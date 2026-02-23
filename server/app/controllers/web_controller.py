"""
Web Application Controller
Handles API endpoints for the web frontend (Next.js).

Phase 1: Minimal endpoints with correct model references.
Full endpoint suite (~25 routes) will be added in Phase 3.
"""
from flask import Blueprint, request, jsonify
from ..models import User, Account
from .. import db

web_bp = Blueprint('web', __name__, url_prefix='/api/web')


def _serialize_user(u):
    """Return a frontend-compatible user dict."""
    return {
        'id': u.id,
        'name': u.name,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'status': u.status,
        'is_active': u.is_active,
        'points_balance': u.account.points_balance if u.account else 0,
        'created_at': u.created_at.isoformat() if u.created_at else None,
    }


@web_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users for web application"""
    try:
        users = User.query.order_by(User.id.asc()).all()
        return jsonify({
            'success': True,
            'users': [_serialize_user(u) for u in users]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        return jsonify({
            'success': True,
            'user': _serialize_user(user)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for web API"""
    return jsonify({
        'success': True,
        'message': 'Web API is running',
        'status': 'healthy'
    }), 200
