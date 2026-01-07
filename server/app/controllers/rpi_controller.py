"""
Raspberry Pi Controller
Handles API endpoints for Raspberry Pi 5 hardware
"""
from flask import Blueprint, request, jsonify
from ..models import User, RecyclingSession, RecyclingItem, RVM, Transaction
from .. import db
from datetime import datetime

rpi_bp = Blueprint('rpi', __name__, url_prefix='/api/rpi')

def _get_machine(machine_uuid: str):
    """Fetch an RVM by UUID, returning None if not found."""
    if not machine_uuid:
        return None
    return RVM.query.filter_by(machine_uuid=machine_uuid).first()

def _serialize_session(session: RecyclingSession):
    """Return minimal session payload for API responses."""
    return {
        'session_id': session.id,
        'user_id': session.user_id,
        'rvm_id': session.rvm_id,
        'status': session.status,
        'item_count': session.item_count,
        'total_points_earned': session.total_points_earned,
        'start_time': session.start_time.isoformat() if session.start_time else None,
        'end_time': session.end_time.isoformat() if session.end_time else None,
    }


@rpi_bp.route('/scan', methods=['POST'])
def handle_scan():
    """Handle bottle scan from Raspberry Pi"""
    try:
        data = request.get_json()
        bottle_type = data.get('bottle_type')
        qr_code = data.get('qr_code')
        timestamp = data.get('timestamp', datetime.utcnow().isoformat())
        
        if not bottle_type or not qr_code:
            return jsonify({
                'success': False,
                'error': 'bottle_type and qr_code are required'
            }), 400
        
        # TODO: Process bottle scan and award points
        # This is where you'd add logic to:
        # 1. Validate the QR code
        # 2. Award points to the user
        # 3. Log the transaction
        
        return jsonify({
            'success': True,
            'message': 'Scan processed successfully',
            'data': {
                'bottle_type': bottle_type,
                'qr_code': qr_code,
                'timestamp': timestamp,
                'points_awarded': 10  # Example
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/authenticate', methods=['POST'])
def authenticate_user():
    """Authenticate user via QR code scan"""
    try:
        data = request.get_json()
        qr_code = data.get('qr_code')
        
        if not qr_code:
            return jsonify({'success': False, 'error': 'qr_code is required'}), 400
        
        # TODO: Implement QR code authentication
        # This is where you'd validate the QR code and return user info
        
        return jsonify({
            'success': True,
            'authenticated': True,
            'user': {
                'id': 1,
                'name': 'Example User',
                'qr_code': qr_code
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/status', methods=['GET'])
def get_status():
    """Get Raspberry Pi system status"""
    try:
        # TODO: Add actual system status checks
        return jsonify({
            'success': True,
            'status': 'online',
            'timestamp': datetime.utcnow().isoformat(),
            'message': 'RVM is operational'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/log', methods=['POST'])
def log_event():
    """Log event from Raspberry Pi"""
    try:
        data = request.get_json()
        event_type = data.get('event_type')
        message = data.get('message')
        
        if not event_type:
            return jsonify({'success': False, 'error': 'event_type is required'}), 400
        
        # TODO: Store log in database
        print(f"[RPI LOG] {event_type}: {message}")
        
        return jsonify({
            'success': True,
            'message': 'Log recorded'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for RPI API"""
    return jsonify({
        'success': True,
        'message': 'RPI API is running',
        'status': 'healthy'
    }), 200

@rpi_bp.route('/session/start', methods=['POST'])
def start_session():
    """Start a recycling session once a QR code is validated."""
    data = request.get_json() or {}
    machine_uuid = data.get('machine_uuid')
    user_qr = data.get('user_qr')

    if not machine_uuid or not user_qr:
        return jsonify({'success': False, 'error': 'machine_uuid and user_qr are required'}), 400

    machine = _get_machine(machine_uuid)
    if not machine:
        return jsonify({'success': False, 'error': 'RVM not registered'}), 404

    user = User.query.filter_by(public_id=user_qr).first()
    if not user:
        return jsonify({'success': False, 'error': 'User QR not recognized'}), 404

    try:
        session = RecyclingSession(
            user_id=user.id,
            rvm_id=machine.id,
            status='active',
            start_time=datetime.utcnow()
        )
        machine.is_online = True
        machine.last_heartbeat = datetime.utcnow()
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': _serialize_session(session),
            'user': {
                'id': user.id,
                'public_id': user.public_id,
                'username': user.username,
                'points_balance': user.points_balance
            }
        }), 201
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500

@rpi_bp.route('/item/deposit', methods=['POST'])
def deposit_item():
    """Record a recycled item during an active session."""
    data = request.get_json() or {}
    session_id = data.get('session_id')
    item_type = data.get('item_type')
    points = data.get('points')
    weight_grams = data.get('weight_grams')

    if not session_id or not item_type or points is None:
        return jsonify({'success': False, 'error': 'session_id, item_type, and points are required'}), 400

    session = RecyclingSession.query.get(session_id)
    if not session or session.status != 'active':
        return jsonify({'success': False, 'error': 'Active session not found'}), 404

    machine = session.rvm

    try:
        item = RecyclingItem(
            session_id=session.id,
            item_type=item_type,
            points_awarded=int(points),
            weight_grams=weight_grams
        )
        session.item_count = (session.item_count or 0) + 1
        session.total_points_earned = (session.total_points_earned or 0) + int(points)
        if machine:
            machine.last_heartbeat = datetime.utcnow()
        db.session.add(item)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': _serialize_session(session),
            'item': {
                'id': item.id,
                'item_type': item.item_type,
                'points_awarded': item.points_awarded,
                'weight_grams': item.weight_grams,
                'deposited_at': item.deposited_at.isoformat()
            }
        }), 201
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500

@rpi_bp.route('/session/end', methods=['POST'])
def end_session():
    """Finish a recycling session and credit the user."""
    data = request.get_json() or {}
    session_id = data.get('session_id')
    machine_uuid = data.get('machine_uuid')

    if not session_id or not machine_uuid:
        return jsonify({'success': False, 'error': 'session_id and machine_uuid are required'}), 400

    session = RecyclingSession.query.get(session_id)
    if not session or session.status != 'active':
        return jsonify({'success': False, 'error': 'Active session not found'}), 404

    machine = _get_machine(machine_uuid)
    if not machine or machine.id != session.rvm_id:
        return jsonify({'success': False, 'error': 'Machine does not match session'}), 400

    try:
        total_points = sum(item.points_awarded for item in session.items)
        session.total_points_earned = total_points
        session.end_time = datetime.utcnow()
        session.status = 'completed'

        user = session.user
        if not user:
            raise ValueError('User missing for session')

        balance_before = user.points_balance or 0
        balance_after = balance_before + total_points

        transaction = Transaction(
            user_id=user.id,
            transaction_type='earn',
            amount=total_points,
            balance_before=balance_before,
            balance_after=balance_after,
            description=f'Recycling session {session.id}',
            reference_type='recycling_session',
            reference_id=session.id,
            status='completed'
        )

        user.points_balance = balance_after
        machine.total_items_collected = (machine.total_items_collected or 0) + (session.item_count or 0)
        machine.last_heartbeat = datetime.utcnow()

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': _serialize_session(session),
            'transaction': {
                'id': transaction.id,
                'amount': transaction.amount,
                'balance_before': transaction.balance_before,
                'balance_after': transaction.balance_after,
                'created_at': transaction.created_at.isoformat()
            },
            'user': {
                'id': user.id,
                'points_balance': user.points_balance
            }
        }), 200
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500
