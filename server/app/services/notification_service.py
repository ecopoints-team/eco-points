"""
Notification Service
Handles sending email and SMS alerts based on per-organization notification settings.
"""
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone

from .. import db
from ..models import NotificationSetting, NotificationLog, Organization


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
}


def get_alert_types():
    """Return the full alert type registry for the settings UI."""
    return ALERT_TYPES


# ══════════════════════════════════════════════════════════════════════════
# EMAIL SENDER
# ══════════════════════════════════════════════════════════════════════════

def _send_email(to_email, subject, body):
    """Send an email via SMTP. Returns (success: bool, error: str|None)."""
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')
    smtp_from = os.environ.get('SMTP_FROM', smtp_user)

    if not smtp_host or not smtp_user:
        return False, 'SMTP not configured (SMTP_HOST and SMTP_USER required)'

    try:
        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.ehlo()
            if smtp_port != 25:
                server.starttls()
                server.ehlo()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)

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

    logs_created = []

    for recipient in recipients:
        # Email channel
        if setting.email_enabled and '@' in recipient:
            success, error = _send_email(recipient, subject, body)
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
