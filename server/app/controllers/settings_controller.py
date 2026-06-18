"""
Settings Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/settings/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/settings/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2. The `force_logout_all` handler is
moved as-is here in Phase 1; Phase 4C will rewrite its body to actually
invalidate JWTs via `Force_Logout_At` rather than just logging the event.
"""
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from ..models import (
    NotificationSetting,
    NotificationLog,
    Organization,
    User,
    AdminLog,
    CommunityGroup,
)
from ..middleware import token_required, permission_required, validate_request
from ..schemas import (
    NotificationSettingsUpdateSchema,
    NotificationTestSchema,
    ChannelConfigUpdateSchema,
    SecurityConfigUpdateSchema,
    ForceLogoutSchema,
)
from .. import db
from ._shared import _dt, _scope_location_id, log_action


settings_bp = Blueprint('settings', __name__, url_prefix='/settings')


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════

@settings_bp.route('/notifications', methods=['GET'])
@token_required
@permission_required('settings')
def get_notification_settings(current_user):
    """Get all notification settings for the current org, creating defaults if needed."""
    try:
        import json as _json
        from ..services.notification_service import get_alert_types, ensure_default_settings

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            from ..services.notification_service import get_alert_types
            alert_types = get_alert_types()
            return jsonify({'success': True, 'settings': [], 'alertTypes': alert_types}), 200

        ensure_default_settings(loc_id)

        settings = NotificationSetting.query.filter_by(
            organization_id=loc_id
        ).order_by(NotificationSetting.alert_key).all()

        alert_types = get_alert_types()
        result = []
        for s in settings:
            info = alert_types.get(s.alert_key, {})
            try:
                recipients = _json.loads(s.recipients_json or '[]')
            except (_json.JSONDecodeError, TypeError):
                recipients = []
            result.append({
                'id': s.id,
                'alertKey': s.alert_key,
                'label': info.get('label', s.alert_key),
                'description': info.get('description', ''),
                'category': info.get('category', 'general'),
                'emailEnabled': s.email_enabled,
                'smsEnabled': s.sms_enabled,
                'threshold': s.threshold,
                'recipients': recipients,
                'isActive': s.is_active,
            })

        return jsonify({'success': True, 'settings': result, 'alertTypes': alert_types}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/notifications', methods=['PUT'])
@token_required
@permission_required('settings')
@validate_request(NotificationSettingsUpdateSchema)
def update_notification_settings(current_user, payload):
    """Batch-update notification settings for the current org.

    Body: { settings: [{ alertKey, emailEnabled, smsEnabled, threshold, recipients, isActive }] }
    """
    try:
        import json as _json

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        # Use exclude_unset to preserve dict semantics ('emailEnabled' in item).
        updates = [
            item.model_dump(exclude_unset=True)
            for item in (payload.settings or [])
        ]

        for item in updates:
            alert_key = item.get('alertKey')
            if not alert_key:
                continue
            setting = NotificationSetting.query.filter_by(
                organization_id=loc_id, alert_key=alert_key
            ).first()
            if not setting:
                continue

            if 'emailEnabled' in item:
                setting.email_enabled = bool(item['emailEnabled'])
            if 'smsEnabled' in item:
                setting.sms_enabled = bool(item['smsEnabled'])
            if 'threshold' in item:
                setting.threshold = item['threshold']
            if 'recipients' in item:
                setting.recipients_json = _json.dumps(item['recipients'])
            if 'isActive' in item:
                setting.is_active = bool(item['isActive'])

        log_action(
            current_user,
            'settings.notifications.update',
            target=f'org#{loc_id}',
            before=None,
            after={'updated_count': len(updates), 'alert_keys': [u.get('alertKey') for u in updates if u.get('alertKey')]},
            category='settings',
        )
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(updates)} notification setting(s) updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/notifications/test', methods=['POST'])
@token_required
@permission_required('settings')
@validate_request(NotificationTestSchema)
def test_notification(current_user, payload):
    """Send a test email notification.

    Body: { channel: "email", recipient: "..." }
    Only the email channel is supported.
    """
    try:
        from ..services.notification_service import _send_email

        recipient = payload.recipient or ''

        if not recipient:
            return jsonify({'success': False, 'error': 'Recipient is required'}), 400

        subject = 'EcoPoints Test Notification'
        body = 'This is a test notification from EcoPoints. If you received this, notifications are working correctly.'

        # Resolve org name for branded email footer
        loc_id = _scope_location_id(current_user)
        org = db.session.get(Organization, loc_id) if loc_id else None
        org_name = org.name if org else None

        success, error = _send_email(recipient, subject, body, org_name=org_name)

        if loc_id:
            log = NotificationLog(
                organization_id=loc_id,
                alert_key='test',
                channel='email',
                recipient=recipient,
                subject=subject,
                body_preview=body[:500],
                status='sent' if success else 'failed',
                error_message=error,
            )
            db.session.add(log)
            db.session.commit()

        if success:
            return jsonify({'success': True, 'message': f'Test email sent to {recipient}'}), 200
        else:
            return jsonify({'success': False, 'error': f'Failed to send: {error}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/notifications/logs', methods=['GET'])
@token_required
@permission_required('settings')
def get_notification_logs(current_user):
    """Get notification log history for the current org."""
    try:
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': True, 'logs': []}), 200

        logs = NotificationLog.query.filter_by(
            organization_id=loc_id
        ).order_by(NotificationLog.sent_at.desc()).limit(200).all()

        result = [{
            'id': l.id,
            'alertKey': l.alert_key,
            'channel': l.channel,
            'recipient': l.recipient,
            'subject': l.subject,
            'bodyPreview': l.body_preview,
            'status': l.status,
            'errorMessage': l.error_message,
            'sentAt': _dt(l.sent_at),
        } for l in logs]

        return jsonify({'success': True, 'logs': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: POINTS CONFIGURATION (read-only — values are fixed)
# ══════════════════════════════════════════════════════════════════════════

@settings_bp.route('/points', methods=['GET'])
@token_required
@permission_required('settings')
def get_points_config(current_user):
    """Return the fixed points-per-bottle configuration.

    Points are no longer configurable — they are defined centrally in
    ``server/app/constants.py::BOTTLE_POINTS``.
    """
    from ..constants import BOTTLE_POINTS
    return jsonify({'success': True, 'config': BOTTLE_POINTS}), 200


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: EMAIL & SMS CHANNEL CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

@settings_bp.route('/channels', methods=['GET'])
@token_required
@permission_required('settings')
def get_channel_config(current_user):
    """Get email & SMS channel configuration for the current org."""
    try:
        import json as _json
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            config = {'emailRecipient': '', 'smsRecipient': '', 'emailEnabled': False, 'smsEnabled': False}
            return jsonify({'success': True, 'config': config}), 200

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_channels'
        ).first()

        config = None
        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                pass
        if not config:
            config = {'emailRecipient': '', 'smsRecipient': '', 'emailEnabled': False, 'smsEnabled': False}

        return jsonify({'success': True, 'config': config}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/channels', methods=['PUT'])
@token_required
@permission_required('settings')
@validate_request(ChannelConfigUpdateSchema)
def update_channel_config(current_user, payload):
    """Update email & SMS channel configuration."""
    try:
        import json as _json
        if current_user.role not in ('superadmin', 'head_admin'):
            return jsonify({'success': False, 'error': 'Only Super Admin or Head Admin can update channel config'}), 403

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        config = {
            'emailRecipient': (payload.emailRecipient or '').strip(),
            'smsRecipient': (payload.smsRecipient or '').strip(),
            'emailEnabled': bool(payload.emailEnabled) if payload.emailEnabled is not None else False,
            'smsEnabled': bool(payload.smsEnabled) if payload.smsEnabled is not None else False,
        }

        if config['smsRecipient'] and config['smsEnabled']:
            phone = config['smsRecipient']
            if not phone.isdigit() or len(phone) != 11 or not phone.startswith('09'):
                return jsonify({'success': False, 'error': 'SMS number must be 11 digits starting with 09'}), 400

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_channels'
        ).first()
        before_config = None
        if setting and setting.recipients_json:
            try:
                before_config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                before_config = None
        if not setting:
            setting = NotificationSetting(
                organization_id=loc_id, alert_key='config_channels',
                email_enabled=False, sms_enabled=False,
                recipients_json=_json.dumps(config), is_active=True,
            )
            db.session.add(setting)
        else:
            setting.recipients_json = _json.dumps(config)

        log_action(
            current_user,
            'settings.channels.update',
            target=f'org#{loc_id}',
            before=before_config,
            after=config,
            category='settings',
        )
        db.session.commit()
        return jsonify({'success': True, 'config': config, 'message': 'Channel configuration updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: SECURITY CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

@settings_bp.route('/security', methods=['GET'])
@token_required
@permission_required('settings')
def get_security_config(current_user):
    """Get security settings for the current org."""
    try:
        import json as _json
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            config = {
                'twoFactorRequired': False, 'twoFactorMethod': 'email',
                'sessionTimeoutMinutes': 1440, 'maxLoginAttempts': 5, 'lockoutDurationMinutes': 15,
            }
            return jsonify({'success': True, 'config': config}), 200

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_security'
        ).first()

        config = None
        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                pass
        if not config:
            config = {
                'twoFactorRequired': False, 'twoFactorMethod': 'email',
                'sessionTimeoutMinutes': 1440, 'maxLoginAttempts': 5, 'lockoutDurationMinutes': 15,
            }

        return jsonify({'success': True, 'config': config}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/security', methods=['PUT'])
@token_required
@permission_required('settings')
@validate_request(SecurityConfigUpdateSchema)
def update_security_config(current_user, payload):
    """Update security settings."""
    try:
        import json as _json
        if current_user.role not in ('superadmin', 'head_admin'):
            return jsonify({'success': False, 'error': 'Only Super Admin or Head Admin can update security settings'}), 403

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        method = payload.twoFactorMethod
        config = {
            'twoFactorRequired': bool(payload.twoFactorRequired) if payload.twoFactorRequired is not None else False,
            'twoFactorMethod': method if method in ('email', 'sms') else 'email',
            'sessionTimeoutMinutes': max(5, min(int(payload.sessionTimeoutMinutes if payload.sessionTimeoutMinutes is not None else 1440), 10080)),
            'maxLoginAttempts': max(3, min(int(payload.maxLoginAttempts if payload.maxLoginAttempts is not None else 5), 20)),
            'lockoutDurationMinutes': max(5, min(int(payload.lockoutDurationMinutes if payload.lockoutDurationMinutes is not None else 15), 1440)),
        }

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_security'
        ).first()
        before_config = None
        if setting and setting.recipients_json:
            try:
                before_config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                before_config = None
        if not setting:
            setting = NotificationSetting(
                organization_id=loc_id, alert_key='config_security',
                email_enabled=False, sms_enabled=False,
                recipients_json=_json.dumps(config), is_active=True,
            )
            db.session.add(setting)
        else:
            setting.recipients_json = _json.dumps(config)

        log_action(
            current_user,
            'settings.security.update',
            target=f'org#{loc_id}',
            before=before_config,
            after=config,
            category='settings',
        )
        db.session.commit()
        return jsonify({'success': True, 'config': config, 'message': 'Security settings updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/security/force-logout', methods=['POST'])
@token_required
@permission_required('settings')
@validate_request(ForceLogoutSchema)
def force_logout_all(current_user, payload):
    """Force-logout all sessions for the actor's organization.

    Sets `Organization.force_logout_at = NOW()` so that `@token_required`
    rejects any JWT whose `iat` is strictly before this timestamp with
    HTTP 401 / error.code = "FORCED_LOGOUT".

    Requirements: 4C.18, 7.2, 4E.23
    """
    try:
        organization = current_user.community_group.organization

        before = {'force_logout_at': str(organization.force_logout_at) if organization.force_logout_at else None}

        organization.force_logout_at = datetime.now(timezone.utc)
        db.session.commit()

        after = {'force_logout_at': str(organization.force_logout_at)}

        log_action(
            current_user,
            'settings.force_logout',
            target=organization,
            before=before,
            after=after,
            category='settings',
        )
        db.session.commit()

        return jsonify({'success': True, 'message': 'All sessions invalidated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/security/login-history', methods=['GET'])
@token_required
@permission_required('settings')
def get_login_history(current_user):
    """Get recent login history for the current org."""
    try:
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': True, 'history': []}), 200

        logs = AdminLog.query.join(
            User, AdminLog.admin_user_id == User.id
        ).join(
            CommunityGroup, User.community_group_id == CommunityGroup.id
        ).filter(
            CommunityGroup.organization_id == loc_id,
            AdminLog.category == 'Auth',
        ).order_by(AdminLog.created_at.desc()).limit(100).all()

        result = [{
            'id': l.id, 'action': l.action,
            'adminName': l.admin.name if l.admin else 'Unknown',
            'adminRole': l.admin.role if l.admin else None,
            'ipAddress': l.notes or '',
            'timestamp': _dt(l.created_at),
        } for l in logs]

        return jsonify({'success': True, 'history': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
