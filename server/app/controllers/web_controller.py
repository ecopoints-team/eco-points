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
            'users': [
                {
                    'id': u.id,
                    'username': u.username,
                    'full_name': u.full_name,
                    'points_balance': u.points_balance,
                    'created_at': u.created_at.isoformat()
                }
                for u in users
            ]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user from web application"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')

        if not username or not email or not password:
            return jsonify({'success': False, 'error': 'username, email, and password are required'}), 400

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({'success': False, 'error': 'User with that username or email already exists'}), 409

        user = User(username=username, email=email, full_name=full_name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'points_balance': user.points_balance,
                'created_at': user.created_at.isoformat()
            }
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
            'user': {
                'id': user.id,
                'username': user.username,
                'full_name': user.full_name,
                'points_balance': user.points_balance,
                'created_at': user.created_at.isoformat()
            }
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
