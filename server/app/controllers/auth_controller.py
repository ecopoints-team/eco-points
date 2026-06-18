"""
Authentication Controller
Handles login, logout, and current-user endpoints with JWT tokens.
"""
import jwt
import json
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app, make_response
from sqlalchemy import func
from ..models import (
    User, AdminLog, CommunityGroup, Wallet, UserSecurity, TokenBlacklist,
    LoginAttempt, NotificationSetting,
)
from ..middleware import token_required, get_user_org_id, ROLE_PERMISSIONS, validate_request, compute_qr_suffix
from ..services.password_policy import validate_password_policy
from ..schemas import (
    LoginSchema,
    VerifyOtpSchema,
    LogoutSchema,
    ProfileUpdateSchema,
    ChangePasswordSchema,
    RegisterSchema,
)
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


# ── Phase 4B: Cookie + CSRF transport ─────────────────────────────────────
#
# Requirement 4B.11 / Task 11.1: on successful login the Server attaches the
# JWT in an HttpOnly + Secure + SameSite cookie and additionally issues a
# (non-HttpOnly) ``csrf_token`` cookie carrying a random value.
#
# Session separation (Task 28): admin logins set ``admin_token``, regular
# user logins set ``token``. The middleware reads the appropriate cookie
# based on the route context. This prevents admin sessions from leaking
# into the public website and vice-versa.

# Cookie names — canonical source is middleware.py (avoids circular import).
from ..middleware import ADMIN_COOKIE_NAME, USER_COOKIE_NAME


def _attach_auth_cookies(response, jwt_token, expiry_hours, is_admin=False):
    """Attach authentication cookies to ``response``.

    Sets two cookies:
      * ``admin_token`` or ``token`` — the issued JWT, HttpOnly + Secure.
        Admin roles get ``admin_token``; regular users get ``token``.
        This separation ensures admin sessions are invisible on the public
        website and regular-user cookies cannot be used on admin routes.
      * ``csrf_token`` — a 32-byte URL-safe random token, *not* HttpOnly so
        the Client can read it via ``document.cookie`` and echo it back on
        the ``X-CSRF-Token`` header (Phase 4B.13).

    Both cookies share the same ``Max-Age`` and ``Path=/``.
    """
    import os
    max_age = int(expiry_hours * 3600)
    samesite_policy = os.environ.get('COOKIE_SAMESITE', 'Lax')
    secure_env = os.environ.get('COOKIE_SECURE', 'true' if samesite_policy.lower() == 'none' else 'false')
    secure_flag = secure_env.lower() == 'true'

    cookie_name = ADMIN_COOKIE_NAME if is_admin else USER_COOKIE_NAME
    response.set_cookie(
        cookie_name,
        jwt_token,
        max_age=max_age,
        path='/',
        secure=secure_flag,
        httponly=True,
        samesite=samesite_policy,
    )
    response.set_cookie(
        'csrf_token',
        secrets.token_urlsafe(32),
        max_age=max_age,
        path='/',
        secure=secure_flag,
        httponly=False,  # Client must read it from document.cookie
        samesite=samesite_policy,
    )
    return response


def _serialize_auth_user(u):
    """Full user payload returned on login and /me.

    Phase 3 task 8.2 additions (per `docs/model-ui-alignment.md` §15 —
    profile page):
      - `qrPayload` — the Phase 4A signed-QR payload string. Phase 4A
        has not yet attached the HMAC suffix, so we fall back to the
        unsigned `USER:<displayId>` form (matching the page's current
        client-side default). Once 4A lands, this field carries the
        signed `<displayId>.<hmacSuffix>` value.
      - `campusRank` — the user's position (1-indexed) in
        `Wallet.lifetime_points` ordering, scoped to the user's
        organization. The page displays `TOP #N` against this value.
      - `organizationUserCount` — total user count in the same
        organization, used as the `/N` denominator on the page.

    TODO(phase3-task-8.2 / Requirement 3.4):
      The `User` model has no columns for `gender`, `age`, or
      `dateOfBirth`. The profile page (alignment doc §15) references
      these and Phase 3 task 8.3 must render them as the empty-state
      placeholder until a future schema-evolution backlog item adds
      real columns. We deliberately do NOT add the keys here so the
      schema doc in 8.4 stays honest about what the server currently
      ships.

    Enum normalization (Requirement 3.6): `role` and `userType` are
    returned as the canonical lowercase values stored on the model.
    """
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

    # Phase 2 / Requirement 2.3: project the authoritative ROLE_PERMISSIONS
    # map for the current role into a deterministic, JSON-serializable list
    # the Admin_UI uses to drive page guards and sidebar filtering. Non-admin
    # roles (`user`, `dependent`) are absent from the map by design and
    # therefore receive an empty list here.
    permission_categories = sorted(ROLE_PERMISSIONS.get(u.role, []))

    # ── Phase 3 task 8.2: derived profile fields ─────────────────────
    # qrPayload: signed QR payload (Phase 4A) of format <displayId>.<hmacSuffix>
    qr_payload = None
    if u.display_id:
        org_model = u.community_group.organization if u.community_group else None
        if org_model:
            try:
                org_secret = org_model.get_qr_hmac_secret()
                suffix = compute_qr_suffix(org_secret, u.display_id)
                qr_payload = f"{u.display_id}.{suffix}"
            except Exception:
                qr_payload = f"USER:{u.display_id}"
        else:
            qr_payload = f"USER:{u.display_id}"

    # campusRank: 1-indexed position in lifetime-points ordering scoped
    # to the user's organization. Returns None when no community group
    # is attached (system / unscoped users), or when the user has no
    # wallet (rank is undefined).
    campus_rank = None
    organization_user_count = None
    if location_id is not None:
        try:
            organization_user_count = db.session.query(func.count(User.id))\
                .join(CommunityGroup, User.community_group_id == CommunityGroup.id)\
                .filter(CommunityGroup.organization_id == location_id)\
                .scalar() or 0
        except Exception:
            organization_user_count = None

        if u.wallet is not None:
            try:
                user_lifetime = u.wallet.lifetime_points or 0
                # Count peers (same org) who have strictly more lifetime
                # points; the user's rank is that count + 1.
                peers_above = db.session.query(func.count(Wallet.id))\
                    .join(User, Wallet.user_id == User.id)\
                    .join(CommunityGroup, User.community_group_id == CommunityGroup.id)\
                    .filter(
                        CommunityGroup.organization_id == location_id,
                        Wallet.lifetime_points > user_lifetime,
                    ).scalar() or 0
                campus_rank = int(peers_above) + 1
            except Exception:
                campus_rank = None

    # Enum normalization (Requirement 3.6).
    role_value = (u.role or '').lower() or None
    user_type_value = (u.user_type or '').lower() or None

    return {
        'id': u.id, 'name': u.name, 'firstName': u.first_name,
        'middleName': u.middle_name, 'lastName': u.last_name,
        'username': u.username, 'email': u.email, 'phone': u.phone,
        'displayId': u.display_id,
        'role': role_value, 'permission_categories': permission_categories,
        'userType': user_type_value,
        'isActive': u.is_active, 'locationId': location_id,
        'locationName': (org['name'] if org else None),
        'organization': org,
        'displayId': u.display_id,
        'qrToken': u.qr_token,
        'pointsBalance': u.wallet.points_balance if u.wallet else 0,
        'lifetimePoints': u.wallet.lifetime_points if u.wallet else 0,
        'streak': u.wallet.streak if u.wallet else 0,
        'lastLogin': u.last_login.isoformat() if u.last_login else None,
        'createdAt': u.created_at.isoformat() if u.created_at else None,
        'otpEnabled': two_fa_enabled, 'otpMethod': two_fa_method,
        # Phase 3 task 8.2 — alignment-doc §15 derived fields.
        'qrPayload': qr_payload,
        'campusRank': campus_rank,
        'organizationUserCount': organization_user_count,
    }


# ── Routes ────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
@validate_request(LoginSchema)
def login(payload):
    """Authenticate a user. If 2FA enabled, returns { requires2FA, tempToken }.

    Body: { "email": "...", "password": "..." }
    """
    try:
        identifier = payload.email or payload.username or payload.identifier
        password = payload.password
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

        # Phase 4B (task 11.1 / Requirement 4B.11): set the HttpOnly token
        # cookie and the (non-HttpOnly) CSRF cookie. The legacy ``token``
        # field stays in the body for Bearer-based clients still mid-migration.
        response = make_response(jsonify({
            'success': True, 'token': token, 'user': _serialize_auth_user(user)
        }), 200)
        return _attach_auth_cookies(response, token, session_hours, is_admin=user.is_admin)
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/verify-otp', methods=['POST'])
@limiter.limit("10 per minute")
@validate_request(VerifyOtpSchema)
def verify_otp_route(payload):
    """Verify a 2FA OTP code and complete the login.

    Body: { "tempToken": "...", "code": "123456" }
    """
    try:
        temp_token = payload.tempToken
        code = (payload.code or '').strip()
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

        # Phase 4B (task 11.1 / Requirement 4B.11): mirror the login flow —
        # attach the HttpOnly token cookie and the CSRF cookie on the
        # OTP-verified login path. Legacy body ``token`` stays for the
        # Bearer transition window.
        response = make_response(jsonify({
            'success': True, 'token': token, 'user': _serialize_auth_user(user)
        }), 200)
        return _attach_auth_cookies(response, token, session_hours, is_admin=user.is_admin)
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
@validate_request(LogoutSchema)
def logout(current_user, payload):
    """Log the logout action, blacklist the JWT token, and clear auth cookies."""
    try:
        # Read token from admin_token or token cookie, then Bearer header
        token = request.cookies.get(ADMIN_COOKIE_NAME) or request.cookies.get(USER_COOKIE_NAME)
        if not token:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]

        if token:
            try:
                decoded = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
                jti = decoded.get('jti')
                if jti:
                    blacklisted = TokenBlacklist(
                        jti=jti,
                        expires_at=datetime.fromtimestamp(decoded['exp'], tz=timezone.utc),
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

        resp = jsonify({'success': True, 'message': 'Logged out successfully'})
        # Clear BOTH auth cookies so a user who logged in as both admin and
        # regular user gets fully logged out. Attributes must match the
        # original Set-Cookie (SameSite, Secure, Path) for browser removal.
        import os as _os
        _ss = _os.environ.get('COOKIE_SAMESITE', 'Lax')
        _sec_env = _os.environ.get('COOKIE_SECURE', 'true' if _ss.lower() == 'none' else 'false')
        _sec = _sec_env.lower() == 'true'
        resp.set_cookie(ADMIN_COOKIE_NAME, '', max_age=0, path='/', samesite=_ss, secure=_sec, httponly=True)
        resp.set_cookie(USER_COOKIE_NAME, '', max_age=0, path='/', samesite=_ss, secure=_sec, httponly=True)
        resp.set_cookie('csrf_token', '', max_age=0, path='/', samesite=_ss, secure=_sec)
        return resp, 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@auth_bp.route('/profile', methods=['PUT'])
@token_required
@validate_request(ProfileUpdateSchema)
def update_profile(current_user, payload):
    """Update the current user's profile fields.

    Body: { "firstName": "...", "lastName": "...", "email": "...", "phone": "..." }
    """
    try:
        data = payload.model_dump(exclude_unset=True)

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
@limiter.limit("5 per minute")
@token_required
@validate_request(ChangePasswordSchema)
def change_password(current_user, payload):
    """Change the current user's password.

    Body: { "currentPassword": "...", "newPassword": "..." }
    """
    try:
        current_pw = payload.currentPassword
        new_pw = payload.newPassword

        if not current_pw or not new_pw:
            return jsonify({'success': False, 'error': 'Current and new password are required'}), 400

        pw_valid, pw_message = validate_password_policy(new_pw)
        if not pw_valid:
            return jsonify({'success': False, 'error': pw_message}), 400

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
@validate_request(RegisterSchema)
def register(payload):
    """Public registration for regular (non-admin) users.

    Body: { firstName, lastName, middleName?, username?, email?, phone?,
            password, userType, locationId, groupId? }
    """
    try:
        data = payload.model_dump(exclude_unset=True)
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
        pw_valid, pw_message = validate_password_policy(password)
        if not pw_valid:
            return jsonify({'success': False, 'error': pw_message}), 400
        if not location_id:
            return jsonify({'success': False, 'error': 'Organization/location is required'}), 400

        if email and User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 409
        if username and User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'error': 'Username already taken'}), 409

        # Resolve community group
        if not group_id:
            default_group = CommunityGroup.query.filter_by(
                organization_id=location_id
            ).order_by(CommunityGroup.id.asc()).first()
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
            .order_by(CommunityGroup.educational_level, CommunityGroup.name).all()
        result = [{
            'id': g.id,
            'name': g.name,
            'abbreviation': g.abbreviation,
            'educationalLevel': g.educational_level,
        } for g in groups]
        return jsonify({'success': True, 'groups': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
