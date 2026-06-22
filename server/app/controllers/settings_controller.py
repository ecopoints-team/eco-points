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
    RestoreBackupSchema,
    SeedSchema,
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
        # A send/config failure is an upstream (email provider) problem, not a
        # server crash — surface it as 502 with the real reason so the admin
        # can fix configuration instead of seeing a generic 500.
        return jsonify({'success': False, 'error': f'Failed to send: {error}'}), 502
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


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: BACKUP & RESTORE
# ══════════════════════════════════════════════════════════════════════════

# Table export order (dependency-safe for restore)
_BACKUP_TABLES = [
    'org_types', 'organizations', 'org_addresses', 'org_contacts',
    'community_groups', 'users', 'wallets', 'user_securities',
    'rvms', 'reward_categories', 'rewards', 'reward_org_assignments',
    'reward_variants', 'recycling_sessions', 'recycling_items',
    'reward_redemptions', 'transactions', 'bulk_deposits',
    'admin_logs', 'maintenance_logs', 'notification_settings',
    'notification_logs', 'otp_codes', 'token_blacklist', 'login_attempts',
]


def _serialize_row(row):
    """Convert a SQLAlchemy row to a JSON-safe dict."""
    import json as _json
    d = {}
    for col in row.__table__.columns:
        val = getattr(row, col.name)
        if val is None:
            d[col.name] = None
        elif isinstance(val, datetime):
            d[col.name] = val.isoformat()
        elif isinstance(val, bytes):
            import base64
            d[col.name] = base64.b64encode(val).decode('ascii')
        else:
            d[col.name] = val
    return d


def _get_model_for_table(table_name):
    """Resolve SQLAlchemy model class by table name."""
    from ..models import (
        OrgType, Organization, OrgAddress, OrgContact, CommunityGroup,
        User, Wallet, UserSecurity, OtpCode, RVM,
        RecyclingSession, RecyclingItem, MaintenanceLog, Transaction,
        RewardCategory, Reward, RewardOrgAssignment, RewardVariant,
        RewardRedemption, BulkDeposit, AdminLog,
        NotificationSetting, NotificationLog, TokenBlacklist, LoginAttempt,
    )
    mapping = {
        'org_types': OrgType, 'organizations': Organization,
        'org_addresses': OrgAddress, 'org_contacts': OrgContact,
        'community_groups': CommunityGroup, 'users': User,
        'wallets': Wallet, 'user_securities': UserSecurity,
        'otp_codes': OtpCode, 'rvms': RVM,
        'recycling_sessions': RecyclingSession, 'recycling_items': RecyclingItem,
        'maintenance_logs': MaintenanceLog, 'transactions': Transaction,
        'reward_categories': RewardCategory, 'rewards': Reward,
        'reward_org_assignments': RewardOrgAssignment,
        'reward_variants': RewardVariant, 'reward_redemptions': RewardRedemption,
        'bulk_deposits': BulkDeposit, 'admin_logs': AdminLog,
        'notification_settings': NotificationSetting,
        'notification_logs': NotificationLog,
        'token_blacklist': TokenBlacklist, 'login_attempts': LoginAttempt,
    }
    return mapping.get(table_name)


@settings_bp.route('/backup', methods=['GET'])
@token_required
@permission_required('settings')
def download_backup(current_user):
    """Export all tables as a JSON backup file. Superadmin only."""
    import json as _json
    try:
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can create backups'}), 403

        tables_data = {}
        total_rows = 0
        for table_name in _BACKUP_TABLES:
            Model = _get_model_for_table(table_name)
            if not Model:
                continue
            rows = Model.query.all()
            tables_data[table_name] = [_serialize_row(r) for r in rows]
            total_rows += len(rows)

        backup = {
            'meta': {
                'version': '1.0',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'table_count': len(tables_data),
                'total_rows': total_rows,
            },
            'tables': tables_data,
        }

        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')
        response = jsonify(backup)
        response.headers['Content-Disposition'] = f'attachment; filename=ecopoints-backup-{timestamp}.json'
        response.headers['Content-Type'] = 'application/json'

        log_action(current_user, 'settings.backup.create', target='backup',
                   before=None, after={'total_rows': total_rows}, category='settings')
        db.session.commit()

        return response, 200
    except Exception as e:
        print(f'BACKUP ERROR: {e}')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/restore', methods=['POST'])
@token_required
@permission_required('settings')
@validate_request(RestoreBackupSchema)
def restore_backup(current_user, payload):
    """Restore database from a JSON backup file. Superadmin only."""
    import json as _json
    try:
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can restore backups'}), 403

        # Use the validated payload (meta + tables already parsed by schema).
        meta = payload.meta
        tables = payload.tables
        if meta is None or tables is None:
            return jsonify({'success': False, 'error': 'Invalid backup file format'}), 400

        if (meta.version if meta else None) != '1.0':
            return jsonify({'success': False, 'error': f"Unsupported backup version: {meta.version if meta else None}"}), 400

        # Truncate in reverse dependency order
        for table_name in reversed(_BACKUP_TABLES):
            Model = _get_model_for_table(table_name)
            if Model and table_name in tables:
                db.session.execute(Model.__table__.delete())

        # Insert in dependency order
        restored_rows = 0
        for table_name in _BACKUP_TABLES:
            Model = _get_model_for_table(table_name)
            if not Model or table_name not in tables:
                continue
            rows = tables[table_name]
            for row_data in rows:
                # Convert ISO datetime strings back to datetime objects
                for col in Model.__table__.columns:
                    if col.name in row_data and row_data[col.name] is not None:
                        if hasattr(col.type, 'python_type') and col.type.python_type == datetime:
                            try:
                                row_data[col.name] = datetime.fromisoformat(row_data[col.name])
                            except (ValueError, TypeError):
                                pass
                db.session.execute(Model.__table__.insert().values(**row_data))
                restored_rows += 1

        log_action(current_user, 'settings.backup.restore', target='backup',
                   before=None, after={'restored_rows': restored_rows}, category='settings')
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Backup restored successfully ({restored_rows} rows)',
            'restored_rows': restored_rows,
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f'RESTORE ERROR: {e}')
        return jsonify({'success': False, 'error': str(e) if str(e) else 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: TEST DATA (SEED / TRUNCATE)
# ══════════════════════════════════════════════════════════════════════════

import threading

_seed_status = {
    'status': 'idle',   # idle | running | done | error
    'message': '',
    'percent': 0,
}
_seed_lock = threading.Lock()


@settings_bp.route('/seed', methods=['POST'])
@token_required
@permission_required('settings')
@validate_request(SeedSchema)
def run_seed(current_user, payload):
    """Generate demo data or truncate all tables. Superadmin only."""
    try:
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Only Super Admin can manage test data'}), 403

        mode = payload.mode or 'demo'

        if mode == 'truncate':
            # Truncate is fast — run synchronously
            from ..seeder.seed import _wipe_all_tables
            _wipe_all_tables()
            log_action(current_user, 'settings.seed.truncate', target='all_tables',
                       before=None, after={'mode': 'truncate'}, category='settings')
            db.session.commit()
            return jsonify({'success': True, 'message': 'All tables truncated successfully'}), 200

        elif mode == 'demo':
            with _seed_lock:
                if _seed_status['status'] == 'running':
                    return jsonify({'success': False, 'error': 'Seeding is already in progress'}), 409

                _seed_status['status'] = 'running'
                _seed_status['message'] = 'Starting demo seed...'
                _seed_status['percent'] = 0

            def _run_seed_thread(app):
                with app.app_context():
                    try:
                        from ..seeder.seed import run_demo_seed
                        _seed_status['message'] = 'Generating demo data...'
                        _seed_status['percent'] = 10
                        run_demo_seed(skip_wipe=True)
                        _seed_status['status'] = 'done'
                        _seed_status['message'] = 'Demo data generated successfully'
                        _seed_status['percent'] = 100
                    except Exception as e:
                        _seed_status['status'] = 'error'
                        _seed_status['message'] = str(e)
                        _seed_status['percent'] = 0
                        print(f'SEED THREAD ERROR: {e}')

            from flask import current_app
            app = current_app._get_current_object()
            thread = threading.Thread(target=_run_seed_thread, args=(app,), daemon=True)
            thread.start()

            log_action(current_user, 'settings.seed.demo', target='demo_data',
                       before=None, after={'mode': 'demo'}, category='settings')
            db.session.commit()

            return jsonify({'success': True, 'message': 'Demo seeding started', 'status': 'running'}), 202
        else:
            return jsonify({'success': False, 'error': f'Invalid mode: {mode}'}), 400

    except Exception as e:
        db.session.rollback()
        print(f'SEED ERROR: {e}')
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@settings_bp.route('/seed/status', methods=['GET'])
@token_required
@permission_required('settings')
def seed_status(current_user):
    """Check the status of a running seed operation."""
    return jsonify({
        'success': True,
        'status': _seed_status['status'],
        'message': _seed_status['message'],
        'percent': _seed_status['percent'],
    }), 200
