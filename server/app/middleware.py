"""
JWT Authentication Middleware
Provides @token_required decorator for protected routes.
"""
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from .models import User


def token_required(f):
    """Decorator that enforces a valid JWT Bearer token on a route.
    Injects `current_user` (a User model instance) into the wrapped function.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Check Authorization header: "Bearer <token>"
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'success': False, 'error': 'Authentication token is missing'}), 401

        try:
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            current_user = User.query.get(payload['user_id'])
            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
            if not current_user.is_active:
                return jsonify({'success': False, 'error': 'Account is deactivated'}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """Decorator that requires the user to be an admin (any admin role).
    Must be used AFTER @token_required.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)

    return decorated


def superadmin_required(f):
    """Decorator that requires superadmin role.
    Must be used AFTER @token_required.
    """
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'superadmin':
            return jsonify({'success': False, 'error': 'Super Admin access required'}), 403
        return f(current_user, *args, **kwargs)

    return decorated


def get_user_org_id(user):
    """Resolve the organization_id for a user via the Account → CommunityGroup → Organization chain."""
    if user.account and user.account.community_group:
        return user.account.community_group.organization_id
    return None
