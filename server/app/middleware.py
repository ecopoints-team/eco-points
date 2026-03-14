"""
JWT Authentication Middleware
Provides @token_required decorator for protected routes.
"""
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from .models import User
from . import db


# ── Role hierarchy: higher number = more privilege ──────────────────
ROLE_HIERARCHY = {
    'dependent': 0,
    'user': 1,
    'technician': 2,
    'inventory_officer': 3,
    'auditor': 4,
    'head_admin': 5,
    'superadmin': 6,
}

# ── Granular permissions per role ───────────────────────────────────
# Maps role → set of allowed action categories.
# 'read' is implicit for all admin roles.
ROLE_PERMISSIONS = {
    'superadmin':        {'read', 'write', 'users', 'machines', 'rewards', 'settings', 'logs', 'analytics', 'bulk_sessions', 'locations', 'groups'},
    'head_admin':        {'read', 'write', 'users', 'machines', 'rewards', 'settings', 'logs', 'analytics', 'bulk_sessions', 'locations', 'groups'},
    'auditor':           {'read', 'logs', 'analytics', 'bulk_sessions'},
    'inventory_officer': {'read', 'rewards', 'logs'},
    'technician':        {'read', 'machines', 'logs'},
}


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
            # Check token blacklist
            jti = payload.get('jti')
            if jti:
                from .models import TokenBlacklist
                if TokenBlacklist.query.filter_by(jti=jti).first():
                    return jsonify({'success': False, 'error': 'Token has been revoked'}), 401
            current_user = db.session.get(User, payload['user_id'])
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


def permission_required(*categories):
    """Decorator that checks if the user's role has permission for the given categories.
    Must be used AFTER @token_required.

    Usage: @permission_required('users', 'write')
    """
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if not current_user.is_admin:
                return jsonify({'success': False, 'error': 'Admin access required'}), 403
            role_perms = ROLE_PERMISSIONS.get(current_user.role, set())
            for cat in categories:
                if cat not in role_perms:
                    return jsonify({'success': False, 'error': f'Your role ({current_user.role}) does not have {cat} permission'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


def can_manage_role(actor_role, target_role):
    """Check if actor_role can create/modify users with target_role.
    Returns True only if actor has strictly higher privilege than target.
    """
    actor_level = ROLE_HIERARCHY.get(actor_role, 0)
    target_level = ROLE_HIERARCHY.get(target_role, 0)
    return actor_level > target_level


def get_user_org_id(user):
    """Resolve the organization_id for a user via the Account → CommunityGroup → Organization chain."""
    if user.account and user.account.community_group:
        return user.account.community_group.organization_id
    return None
