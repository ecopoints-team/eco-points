"""
Notification Service
Handles sending email and SMS alerts based on per-organization notification settings.
"""
import html
import json
import os
import base64
from datetime import datetime, timezone

import resend

from .. import db
from ..models import NotificationSetting, NotificationLog, Organization

# Path to the inline logo image
_LOGO_PATH = os.path.join(os.path.dirname(__file__), 'logo.png')


def _escape(s):
    """Escape user-supplied values for safe insertion into HTML email templates.

    Coerces None to an empty string and applies html.escape with quote=True so
    that values are safe inside both element bodies and attribute contexts.
    """
    if s is None:
        return ''
    return html.escape(str(s), quote=True)


# ══════════════════════════════════════════════════════════════════════════
# ALERT TYPE REGISTRY
# ══════════════════════════════════════════════════════════════════════════

ALERT_TYPES = {
    'low_reward_stock': {
        'label': 'Low Reward Stock',
        'description': 'When a reward item stock falls below the threshold',
        'default_threshold': 10,
        'category': 'inventory',
    },
    'reward_out_of_stock': {
        'label': 'Reward Out of Stock',
        'description': 'When a reward item reaches zero stock',
        'default_threshold': None,
        'category': 'inventory',
    },
    'machine_offline': {
        'label': 'Machine Offline',
        'description': 'When an RVM goes offline',
        'default_threshold': None,
        'category': 'hardware',
    },
    'machine_maintenance_due': {
        'label': 'Maintenance Due',
        'description': 'When a machine has unresolved maintenance issues',
        'default_threshold': None,
        'category': 'hardware',
    },
    'maintenance_unresolved': {
        'label': 'Unresolved Maintenance',
        'description': 'When maintenance logs remain unresolved past threshold (hours)',
        'default_threshold': 48,
        'category': 'hardware',
    },
    'new_redemption': {
        'label': 'New Redemption',
        'description': 'When a user redeems a reward',
        'default_threshold': None,
        'category': 'activity',
    },
    'new_user_registered': {
        'label': 'New User Registered',
        'description': 'When a new user registers',
        'default_threshold': None,
        'category': 'activity',
    },
    'daily_summary': {
        'label': 'Daily Summary',
        'description': 'Daily recap of recycling activity and key metrics',
        'default_threshold': None,
        'category': 'reports',
    },
    'suspicious_activity': {
        'label': 'Suspicious Activity',
        'description': 'When a manual points adjustment exceeds the threshold',
        'default_threshold': 500,
        'category': 'security',
    },
    'machine_capacity_high': {
        'label': 'Machine Capacity High',
        'description': 'When an RVM reaches a high percentage of its max capacity',
        'default_threshold': 80,
        'category': 'hardware',
    },
    'failed_login_alert': {
        'label': 'Failed Login Attempts',
        'description': 'When multiple failed login attempts are detected for an account',
        'default_threshold': 3,
        'category': 'security',
    },
    'bulk_session_completed': {
        'label': 'Bulk Session Completed',
        'description': 'When a bulk recycling session is completed',
        'default_threshold': None,
        'category': 'activity',
    },
}


def get_alert_types():
    """Return the full alert type registry for the settings UI."""
    return ALERT_TYPES


# ══════════════════════════════════════════════════════════════════════════
# BRANDED HTML EMAIL TEMPLATE
# ══════════════════════════════════════════════════════════════════════════

def _build_email_html(subject, body, org_name=None):
    """Wrap notification content in a branded EcoPoints HTML email template."""
    year = datetime.now().year
    org_line = f' — {_escape(org_name)}' if org_name else ''
    safe_subject = _escape(subject)
    safe_body = _escape(body)

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#166534 0%,#15803d 50%,#16a34a 100%);padding:32px 40px;text-align:center;">
            <img src="cid:ecopoints_logo" alt="EcoPoints" width="240" style="display:block;margin:0 auto;max-width:100%;height:auto;" />
          </td>
        </tr>

        <!-- Subject Banner -->
        <tr>
          <td style="background-color:#dcfce7;padding:16px 40px;border-bottom:1px solid #bbf7d0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;font-weight:600;color:#166534;">&#x1f514; {safe_subject}</td>
                <td align="right" style="font-size:11px;color:#4ade80;">{datetime.now(timezone.utc).strftime('%b %d, %Y at %I:%M %p')} UTC</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <div style="font-size:15px;line-height:1.7;color:#374151;">
              {safe_body}
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;" />
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#166534;">EcoPoints Notification System{org_line}</p>
            <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated alert. Manage your notification preferences in the EcoPoints admin panel.</p>
            <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">&copy; {year} EcoPoints. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


# ══════════════════════════════════════════════════════════════════════════
# EMAIL SENDER
# ══════════════════════════════════════════════════════════════════════════

def _send_email(to_email, subject, body, org_name=None):
    """Send a branded HTML email via the Resend API with inline logo.

    Returns (success: bool, error: str|None).

    Configuration (environment):
      RESEND_API_KEY  — required; API key from https://resend.com/api-keys
      EMAIL_FROM      — required; verified sender, e.g. 'EcoPoints <notifications@ecopoints.org>'
    """
    api_key = os.environ.get('RESEND_API_KEY', '')
    email_from = os.environ.get('EMAIL_FROM', '')

    if not api_key:
        return False, 'Resend not configured (RESEND_API_KEY required)'
    if not email_from:
        return False, 'Resend sender not configured (EMAIL_FROM required)'

    try:
        resend.api_key = api_key

        html_content = _build_email_html(subject, body, org_name)
        plain_text = f"{subject}\n\n{body}\n\n— EcoPoints Notification System"

        payload = {
            'from': email_from,
            'to': [to_email],
            'subject': f'[EcoPoints] {subject}',
            'html': html_content,
            'text': plain_text,
        }

        # Attach logo as inline image referenced by cid:ecopoints_logo in the template.
        if os.path.exists(_LOGO_PATH):
            with open(_LOGO_PATH, 'rb') as f:
                logo_b64 = base64.b64encode(f.read()).decode('ascii')
            payload['attachments'] = [{
                'filename': 'ecopoints-logo.png',
                'content': logo_b64,
                'content_id': 'ecopoints_logo',
            }]

        resend.Emails.send(payload)
        return True, None
    except Exception as e:
        return False, str(e)


# ══════════════════════════════════════════════════════════════════════════
# SMS SENDER
# ══════════════════════════════════════════════════════════════════════════

def _send_sms(to_phone, body):
    """Send an SMS via Twilio. Returns (success: bool, error: str|None)."""
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
    from_number = os.environ.get('TWILIO_FROM_NUMBER', '')

    if not account_sid or not auth_token or not from_number:
        return False, 'Twilio not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER required)'

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(
            body=body,
            from_=from_number,
            to=to_phone,
        )
        return True, None
    except Exception as e:
        return False, str(e)


# ══════════════════════════════════════════════════════════════════════════
# CORE DISPATCHER
# ══════════════════════════════════════════════════════════════════════════

def trigger_alert(org_id, alert_key, subject, body, extra_context=None):
    """
    Fire an alert for a given organization.
    Looks up the NotificationSetting for (org_id, alert_key) and sends
    via all enabled channels to all configured recipients.

    Returns: list of NotificationLog entries created.
    """
    setting = NotificationSetting.query.filter_by(
        organization_id=org_id,
        alert_key=alert_key,
        is_active=True,
    ).first()

    if not setting:
        return []

    if not setting.email_enabled and not setting.sms_enabled:
        return []

    try:
        recipients = json.loads(setting.recipients_json or '[]')
    except (json.JSONDecodeError, TypeError):
        recipients = []

    if not recipients:
        return []

    # Look up org name for email branding
    org = db.session.get(Organization, org_id)
    org_name = org.name if org else None

    logs_created = []

    for recipient in recipients:
        # Email channel
        if setting.email_enabled and '@' in recipient:
            success, error = _send_email(recipient, subject, body, org_name=org_name)
            log = NotificationLog(
                organization_id=org_id,
                alert_key=alert_key,
                channel='email',
                recipient=recipient,
                subject=subject,
                body_preview=body[:500] if body else None,
                status='sent' if success else 'failed',
                error_message=error,
            )
            db.session.add(log)
            logs_created.append(log)

        # SMS channel
        if setting.sms_enabled and '@' not in recipient:
            sms_body = f"[EcoPoints] {subject}: {body[:160]}"
            success, error = _send_sms(recipient, sms_body)
            log = NotificationLog(
                organization_id=org_id,
                alert_key=alert_key,
                channel='sms',
                recipient=recipient,
                subject=subject,
                body_preview=sms_body[:500],
                status='sent' if success else 'failed',
                error_message=error,
            )
            db.session.add(log)
            logs_created.append(log)

    # Commit logs (caller is responsible for the outer transaction)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return logs_created


def ensure_default_settings(org_id):
    """
    Create default NotificationSetting rows for an org if they don't exist yet.
    Called when accessing settings for the first time.
    """
    existing_keys = {s.alert_key for s in NotificationSetting.query.filter_by(
        organization_id=org_id).all()}

    new_settings = []
    for key, info in ALERT_TYPES.items():
        if key not in existing_keys:
            ns = NotificationSetting(
                organization_id=org_id,
                alert_key=key,
                email_enabled=False,
                sms_enabled=False,
                threshold=info.get('default_threshold'),
                recipients_json='[]',
                is_active=True,
            )
            db.session.add(ns)
            new_settings.append(ns)

    if new_settings:
        db.session.commit()

    return new_settings
