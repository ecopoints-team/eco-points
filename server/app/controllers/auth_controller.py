"""
Authentication Controller
Handles login, logout, and current-user endpoints with JWT tokens.
"""
import jwt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app
from ..models import User, AdminLog
from ..middleware import token_required
from .. import db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/web/auth')

# ── Token Helpers ─────────────────────────────────────────────────────────

TOKEN_EXPIRY_HOURS = 24  # Tokens valid for 24 hours


def _generate_token(user):
    """Create a signed JWT for the given user."""
    payload = {
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def _serialize_auth_user(u):
    """Full user payload returned on login and /me."""
    org = None
    location_id = None
    if u.account and u.account.community_group:
        cg = u.account.community_group
        location_id = cg.organization_id
        if cg.organization:
            org = {
                'id': cg.organization.id,
                'name': cg.organization.name,
                'fullName': cg.organization.full_name,
            }

    return {
        'id': u.id,
        'name': u.name,
        'username': u.username,
        'email': u.email,
        'phone': u.phone,
        'role': u.role,
        'userType': u.user_type,
        'yearLevel': u.year_level,
        'isActive': u.is_active,
        'locationId': location_id,
        'organization': org,
        'pointsBalance': u.account.points_balance if u.account else 0,
        'lastLogin': u.last_login.isoformat() if u.last_login else None,
        'createdAt': u.created_at.isoformat() if u.created_at else None,
    }


# ── Routes ────────────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate an admin user and return a JWT token.

    Body: { "email": "...", "password": "..." }
      OR  { "username": "...", "password": "..." }
    """
    try:
        data = request.get_json() or {}
        identifier = data.get('email') or data.get('username')
        password = data.get('password')

        if not identifier or not password:
            return jsonify({'success': False, 'error': 'Email/username and password are required'}), 400

        # Look up by email first, then username
        user = User.query.filter_by(email=identifier).first()
        if not user:
            user = User.query.filter_by(username=identifier).first()

        if not user:
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        if not user.check_password(password):
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'success': False, 'error': 'Account is deactivated'}), 403

        if not user.is_admin:
            return jsonify({'success': False, 'error': 'Admin access only'}), 403

        # Update last_login timestamp
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        token = _generate_token(user)

        # Log the login action
        log = AdminLog(
            admin_user_id=user.id,
            action='Admin Login',
            target=user.name,
            category='Auth',
            notes=f'Login from {request.remote_addr}',
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'success': True,
            'token': token,
            'user': _serialize_auth_user(user),
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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
    """Log the logout action. Token invalidation is client-side (delete token).
    For server-side blacklisting, add a token_blacklist table later.
    """
    try:
        log = AdminLog(
            admin_user_id=current_user.id,
            action='Admin Logout',
            target=current_user.name,
            category='Auth',
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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

        if len(new_pw) < 6:
            return jsonify({'success': False, 'error': 'New password must be at least 6 characters'}), 400

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
        return jsonify({'success': False, 'error': str(e)}), 500
