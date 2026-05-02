"""
Authentication Controller
Handles login, logout, and current-user endpoints with JWT tokens.
"""
import jwt
import re
import json
import uuid
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app
from ..models import (
    User, AdminLog, CommunityGroup, Wallet, UserSecurity, TokenBlacklist,
    LoginAttempt, NotificationSetting,
)
from ..middleware import token_required, get_user_org_id
from .. import db, limiter

auth_bp = Blueprint('auth', __name__, url_prefix='/api/web/auth')

# ── Token Helpers ─────────────────────────────────────────────────────────

TOKEN_EXPIRY_HOURS = 24
TEMP_TOKEN_MINUTES = 10


def _generate_token(user, expiry_hours=None):
    """Create a signed JWT for the given user."""
    if expiry_hours is None:
        expiry_hours = TOKEN_EXPIRY_HOURS
    payload = {
        'user_id': user.id,
        'role': user.role,
        'jti': str(uuid.uuid4()),
        'exp': datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def _generate_temp_token(user):
    """Create a short-lived temp JWT for 2FA verification."""
    payload = {
        'user_id': user.id,
        'purpose': '2fa',
        'jti': str(uuid.uuid4()),
        'exp': datetime.now(timezone.utc) + timedelta(minutes=TEMP_TOKEN_MINUTES),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def _get_session_timeout(user):
    """Get the session timeout (in hours) from the org's security config."""
    try:
        org_id = get_user_org_id(user)
        if org_id:
            setting = NotificationSetting.query.filter_by(
                organization_id=org_id, alert_key='config_security'
            ).first()
            if setting and setting.recipients_json:
                config = json.loads(setting.recipients_json)
                minutes = config.get('sessionTimeoutMinutes', 1440)
                return max(minutes / 60, 0.1)
    except Exception:
        pass
    return TOKEN_EXPIRY_HOURS


def _check_lockout(identifier, org_id=None):
    """Check if the identifier is locked out. Returns (is_locked, remaining_minutes)."""
    try:
        max_attempts = 5
        lockout_minutes = 15
        if org_id:
            setting = NotificationSetting.query.filter_by(
                organization_id=org_id, alert_key='config_security'
            ).first()
            if setting and setting.recipients_json:
                config = json.loads(setting.recipients_json)
                max_attempts = config.get('maxLoginAttempts', 5)
                lockout_minutes = config.get('lockoutDurationMinutes', 15)

        cutoff = datetime.now(timezone.utc) - timedelta(minutes=lockout_minutes)
        failed_count = LoginAttempt.query.filter(
            LoginAttempt.identifier == identifier,
            LoginAttempt.is_success == False,
            LoginAttempt.attempted_at >= cutoff,
        ).count()

        if failed_count >= max_attempts:
            last_fail = LoginAttempt.query.filter(
                LoginAttempt.identifier == identifier,
                LoginAttempt.is_success == False,
                LoginAttempt.attempted_at >= cutoff,
            ).order_by(LoginAttempt.attempted_at.desc()).first()
            if last_fail:
                unlock_at = last_fail.attempted_at + timedelta(minutes=lockout_minutes)
                remaining = (unlock_at - datetime.now(timezone.utc)).total_seconds() / 60
                return True, max(1, int(remaining))
            return True, lockout_minutes
        return False, 0
    except Exception:
        return False, 0


def _log_attempt(identifier, ip, user_id=None, success=False, reason=None):
    """Log a login attempt."""
    try:
        attempt = LoginAttempt(
            identifier=identifier, ip_address=ip, user_id=user_id,
            is_success=success, failure_reason=reason,
        )
        db.session.add(attempt)
        db.session.commit()

        # ── Notification hook: failed login alert ──
        if not success and user_id:
            try:
                from ..services.notification_service import trigger_alert
                user = db.session.get(User, user_id)
                org_id = get_user_org_id(user) if user else None
                if org_id:
                    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
                    fail_count = LoginAttempt.query.filter(
                        LoginAttempt.identifier == identifier,
                        LoginAttempt.is_success == False,
                        LoginAttempt.attempted_at >= cutoff,
                    ).count()
                    threshold_setting = NotificationSetting.query.filter_by(
                        organization_id=org_id, alert_key='failed_login_alert', is_active=True
                    ).first()
                    threshold = (threshold_setting.threshold if threshold_setting else 3) or 3
                    if fail_count >= threshold:
                        trigger_alert(org_id, 'failed_login_alert',
                                      f'Multiple failed logins: {identifier}',
                                      f'{fail_count} failed login attempts for "{identifier}" '
                                      f'from IP {ip} in the last 30 minutes.')
            except Exception:
                pass
    except Exception:
        db.session.rollback()


def _serialize_auth_user(u):
    """Full user payload returned on login and /me."""
    org = None
    location_id = None
    if u.community_group:
        location_id = u.community_group.organization_id
        if u.community_group.organization:
            org = {
                'id': u.community_group.organization.id,
                'name': u.community_group.organization.name,
                'fullName': u.community_group.organization.full_name,
            }

    # 2FA info from UserSecurity
    two_fa_enabled = False
    two_fa_method = None
    if u.security:
        two_fa_enabled = u.security.two_factor_enabled
        two_fa_method = u.security.preferred_method

    return {
        'id': u.id, 'name': u.name, 'firstName': u.first_name,
        'middleName': u.middle_name, 'lastName': u.last_name,
        'username': u.username, 'email': u.email, 'phone': u.phone,
        'role': u.role, 'userType': u.user_type,
        'isActive': u.is_active, 'locationId': location_id,
        'organization': org,
        'pointsBalance': u.wallet.points_balance if u.wallet else 0,
        'lifetimePoints': u.wallet.lifetime_points if u.wallet else 0,
        'streak': u.wallet.streak if u.wallet else 0,
        'lastLogin': u.last_login.isoformat() if u.last_login else None,
        'createdAt': u.created_at.isoformat() if u.created_at else None,
        'otpEnabled': two_fa_enabled, 'otpMethod': two_fa_method,
    }


# ── Routes ────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """Authenticate a user. If 2FA enabled, returns { requires2FA, tempToken }.

    Body: { "email": "...", "password": "..." }
    """
    try:
        data = request.get_json() or {}
        identifier = data.get('email') or data.get('username') or data.get('identifier')
        password = data.get('password')
        ip = request.remote_addr

        if not identifier or not password:
            return jsonify({'success': False, 'error': 'Email/username and password are required'}), 400

        user = User.query.filter_by(email=identifier).first()
        if not user:
            user = User.query.filter_by(username=identifier).first()

        org_id = get_user_org_id(user) if user else None

        # Check lockout
        is_locked, remaining = _check_lockout(identifier, org_id)
        if is_locked:
            _log_attempt(identifier, ip, user.id if user else None, False, 'locked_out')
            return jsonify({'success': False, 'error': f'Account is temporarily locked. Try again in {remaining} minute(s).'}), 429

        if not user:
            _log_attempt(identifier, ip, None, False, 'user_not_found')
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        if not user.check_password(password):
            _log_attempt(identifier, ip, user.id, False, 'invalid_password')
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        if not user.is_active:
            _log_attempt(identifier, ip, user.id, False, 'deactivated')
            return jsonify({'success': False, 'error': 'Account is deactivated'}), 403

        # Check if 2FA is required (per-user via UserSecurity or per-org)
        requires_2fa = False
        if u_sec := user.security:
            requires_2fa = u_sec.two_factor_enabled
        if not requires_2fa and org_id:
            try:
                sec_setting = NotificationSetting.query.filter_by(
                    organization_id=org_id, alert_key='config_security'
                ).first()
                if sec_setting and sec_setting.recipients_json:
                    sec_config = json.loads(sec_setting.recipients_json)
                    if sec_config.get('twoFactorRequired'):
                        requires_2fa = True
            except Exception:
                pass

        if requires_2fa:
            from ..services.otp_service import send_otp
            method = (user.security.preferred_method if user.security else None) or 'email'
            _code, otp_success, otp_error = send_otp(user, method)
            temp_token = _generate_temp_token(user)
            return jsonify({
                'success': True, 'requires2FA': True,
                'tempToken': temp_token, 'otpMethod': method,
                'otpSent': otp_success,
                'otpError': otp_error if not otp_success else None,
                'message': f'Verification code sent via {method}',
            }), 200

        # No 2FA — complete login
        _log_attempt(identifier, ip, user.id, True)
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        session_hours = _get_session_timeout(user)
        token = _generate_token(user, session_hours)

        action_name = 'Admin Login' if user.is_admin else 'User Login'
        log = AdminLog(admin_user_id=user.id, action=action_name,
                       target=user.name, category='Auth', notes=f'Login from {ip}')
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'token': token, 'user': _serialize_auth_user(user)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
@limiter.limit("10 per minute")
def verify_otp_route():
    """Verify a 2FA OTP code and complete the login.

    Body: { "tempToken": "...", "code": "123456" }
    """
    try:
        data = request.get_json() or {}
        temp_token = data.get('tempToken')
        code = data.get('code', '').strip()
        ip = request.remote_addr

        if not temp_token or not code:
            return jsonify({'success': False, 'error': 'Token and code are required'}), 400

        try:
            payload = jwt.decode(temp_token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Verification session expired. Please login again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid verification token'}), 401

        if payload.get('purpose') != '2fa':
            return jsonify({'success': False, 'error': 'Invalid token type'}), 401

        user = db.session.get(User, payload['user_id'])
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 401

        from ..services.otp_service import verify_otp
        success, error = verify_otp(user.id, code)
        if not success:
            return jsonify({'success': False, 'error': error}), 401

        # OTP verified — complete login
        identifier = user.email or user.username
        _log_attempt(identifier, ip, user.id, True)
        user.last_login = datetime.now(timezone.utc)

        # Ensure UserSecurity reflects 2FA enabled
        if user.security and not user.security.two_factor_enabled:
            user.security.two_factor_enabled = True
            user.security.preferred_method = user.security.preferred_method or 'email'
        db.session.commit()

        session_hours = _get_session_timeout(user)
        token = _generate_token(user, session_hours)

        action_name = 'Admin Login (2FA)' if user.is_admin else 'User Login (2FA)'
        log = AdminLog(admin_user_id=user.id, action=action_name,
                       target=user.name, category='Auth', notes=f'Login from {ip} (2FA verified)')
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'token': token, 'user': _serialize_auth_user(user)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Return the currently authenticated user's profile."""
    return jsonify({
        'success': True,
        'user': _serialize_auth_user(current_user),
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Log the logout action and blacklist the JWT token."""
    try:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]
            try:
                payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                jti = payload.get('jti')
                if jti:
                    blacklisted = TokenBlacklist(
                        jti=jti,
                        expires_at=datetime.fromtimestamp(payload['exp'], tz=timezone.utc),
                    )
                    db.session.add(blacklisted)
            except jwt.InvalidTokenError:
                pass

        action_name = 'Admin Logout' if current_user.is_admin else 'User Logout'
        log = AdminLog(
            admin_user_id=current_user.id,
            action=action_name,
            target=current_user.name,
            category='Auth',
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update the current user's profile fields.

    Body: { "firstName": "...", "lastName": "...", "email": "...", "phone": "..." }
    """
    try:
        data = request.get_json() or {}

        # Name fields
        if 'firstName' in data and data['firstName']:
            current_user.first_name = data['firstName'].strip()
        if 'lastName' in data and data['lastName']:
            current_user.last_name = data['lastName'].strip()
        if 'middleName' in data:
            current_user.middle_name = data['middleName'].strip() if data['middleName'] else None
        # Backward compat: if 'name' sent, split into first/last
        if 'name' in data and data['name'] and 'firstName' not in data:
            parts = data['name'].strip().split(' ', 1)
            current_user.first_name = parts[0]
            current_user.last_name = parts[1] if len(parts) > 1 else parts[0]

        # Email (check uniqueness)
        if 'email' in data and data['email']:
            email = data['email'].strip()
            existing = User.query.filter(User.email == email, User.id != current_user.id).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already in use by another account'}), 409
            current_user.email = email

        # Phone
        if 'phone' in data:
            current_user.phone = data['phone'].strip() if data['phone'] else None

        db.session.commit()

        log = AdminLog(
            admin_user_id=current_user.id,
            action='Profile Updated',
            target=current_user.name,
            category='Auth',
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'user': _serialize_auth_user(current_user),
            'message': 'Profile updated successfully',
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change the current user's password.

    Body: { "currentPassword": "...", "newPassword": "..." }
    """
    try:
        data = request.get_json() or {}
        current_pw = data.get('currentPassword')
        new_pw = data.get('newPassword')

        if not current_pw or not new_pw:
            return jsonify({'success': False, 'error': 'Current and new password are required'}), 400

        if len(new_pw) < 8:
            return jsonify({'success': False, 'error': 'New password must be at least 8 characters'}), 400
        if not re.search(r'[A-Z]', new_pw):
            return jsonify({'success': False, 'error': 'New password must contain at least one uppercase letter'}), 400
        if not re.search(r'[a-z]', new_pw):
            return jsonify({'success': False, 'error': 'New password must contain at least one lowercase letter'}), 400
        if not re.search(r'[0-9]', new_pw):
            return jsonify({'success': False, 'error': 'New password must contain at least one digit'}), 400

        if not current_user.check_password(current_pw):
            return jsonify({'success': False, 'error': 'Current password is incorrect'}), 401

        current_user.set_password(new_pw)
        db.session.commit()

        log = AdminLog(
            admin_user_id=current_user.id,
            action='Password Changed',
            target=current_user.name,
            category='Auth',
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Password changed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ── Public Registration ───────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """Public registration for regular (non-admin) users.

    Body: { firstName, lastName, middleName?, username?, email?, phone?,
            password, userType, locationId, groupId? }
    """
    try:
        data = request.get_json() or {}
        first_name = data.get('firstName') or data.get('name', '').split(' ', 1)[0]
        last_name = data.get('lastName') or (data.get('name', '').split(' ', 1)[1] if ' ' in data.get('name', '') else data.get('name', ''))
        middle_name = data.get('middleName')
        password = data.get('password')
        email = data.get('email')
        username = data.get('username')
        phone = data.get('phone')
        user_type = data.get('userType')
        valid_user_types = ('student', 'faculty', 'staff')
        if user_type and user_type not in valid_user_types:
            return jsonify({'success': False, 'error': f'Invalid userType. Must be one of {valid_user_types}'}), 400
        location_id = data.get('locationId')
        group_id = data.get('groupId')

        # Validations
        if not first_name or not last_name:
            return jsonify({'success': False, 'error': 'First name and last name are required'}), 400
        if not password or len(password) < 8:
            return jsonify({'success': False, 'error': 'Password must be at least 8 characters with uppercase, lowercase, and a digit'}), 400
        if not re.search(r'[A-Z]', password):
            return jsonify({'success': False, 'error': 'Password must contain at least one uppercase letter'}), 400
        if not re.search(r'[a-z]', password):
            return jsonify({'success': False, 'error': 'Password must contain at least one lowercase letter'}), 400
        if not re.search(r'[0-9]', password):
            return jsonify({'success': False, 'error': 'Password must contain at least one digit'}), 400
        if not location_id:
            return jsonify({'success': False, 'error': 'Organization/location is required'}), 400

        if email and User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 409
        if username and User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'error': 'Username already taken'}), 409

        # Resolve community group
        if not group_id:
            default_group = CommunityGroup.query.filter_by(
                organization_id=location_id, group_type='staff'
            ).first()
            if not default_group:
                default_group = CommunityGroup.query.filter_by(organization_id=location_id).first()
            if not default_group:
                return jsonify({'success': False, 'error': 'No community group found for this location'}), 400
            group_id = default_group.id
        else:
            group = CommunityGroup.query.get(group_id)
            if not group or group.organization_id != int(location_id):
                return jsonify({'success': False, 'error': 'Selected group does not belong to the chosen location'}), 400

        user = User(
            community_group_id=group_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            username=username,
            email=email,
            phone=phone,
            role='user',
            user_type=user_type,
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Create wallet for the user
        wallet = Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
        db.session.add(wallet)

        # Create security record
        security = UserSecurity(user_id=user.id, two_factor_enabled=False)
        db.session.add(security)

        # Generate display_id
        from ..models import Organization
        org = db.session.get(Organization, location_id)
        if org:
            words = [w for w in org.name.split() if w[0].isupper()]
            org_abbr = ''.join(w[0] for w in words).upper() or 'ORG'
        else:
            org_abbr = 'ORG'
        user.display_id = User.generate_display_id('user', org_abbr)

        db.session.commit()

        return jsonify({'success': True, 'message': 'Account created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/locations', methods=['GET'])
def public_locations():
    """Return active organizations for the signup form (public, no auth)."""
    try:
        from ..models import Organization
        orgs = Organization.query.filter_by(status='Active').order_by(Organization.name).all()
        result = [{'id': o.id, 'name': o.name, 'fullName': o.full_name} for o in orgs]
        return jsonify({'success': True, 'locations': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/groups', methods=['GET'])
def public_groups():
    """Return community groups for a given location (public, no auth).

    Query: ?location_id=1
    """
    try:
        loc_id = request.args.get('location_id', type=int)
        if not loc_id:
            return jsonify({'success': True, 'groups': []}), 200
        groups = CommunityGroup.query.filter_by(organization_id=loc_id)\
            .order_by(CommunityGroup.group_type, CommunityGroup.name).all()
        result = [{
            'id': g.id,
            'name': g.name,
            'abbreviation': g.abbreviation,
            'groupType': g.group_type,
        } for g in groups]
        return jsonify({'success': True, 'groups': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
