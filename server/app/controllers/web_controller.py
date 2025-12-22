"""
Web Application Controller
Handles API endpoints for the web frontend (Next.js)
"""
from flask import Blueprint, request, jsonify
from ..models import User
from .. import db

web_bp = Blueprint('web', __name__, url_prefix='/api/web')


@web_bp.route('/users', methods=['GET'])
def get_users():
    """Get all users for web application"""
    try:
        users = User.query.order_by(User.id.asc()).all()
        return jsonify({
            'success': True,
            'users': [{'id': u.id, 'name': u.name, 'created_at': u.created_at.isoformat()} for u in users]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user from web application"""
    try:
        data = request.get_json()
        name = data.get('name')
        
        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        
        user = User(name=name)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': {'id': user.id, 'name': user.name, 'created_at': user.created_at.isoformat()}
        }), 201
    except Exception as e:
        db.session.rollback()
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
            'user': {'id': user.id, 'name': user.name, 'created_at': user.created_at.isoformat()}
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
