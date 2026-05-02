"""
Raspberry Pi Controller
Handles API endpoints for Raspberry Pi 5 hardware.

Phase 1: Fixed model references to match the 15-table schema.
"""
from flask import Blueprint, request, jsonify
from ..models import (
    AccessCredential, Account, RecyclingSession, RecyclingItem,
    RVM, Transaction
)
from .. import db
from datetime import datetime, timezone


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
        'account_id': session.account_id,
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
        timestamp = data.get('timestamp', datetime.now(timezone.utc).isoformat())

        if not bottle_type or not qr_code:
            return jsonify({
                'success': False,
                'error': 'bottle_type and qr_code are required'
            }), 400

        # TODO: Process bottle scan and award points
        return jsonify({
            'success': True,
            'message': 'Scan processed successfully',
            'data': {
                'bottle_type': bottle_type,
                'qr_code': qr_code,
                'timestamp': timestamp,
                'points_awarded': 10  # Placeholder
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/authenticate', methods=['POST'])
def authenticate_user():
    """Authenticate user via QR code or RFID scan.
    Looks up AccessCredential → Account → User(s).
    """
    try:
        data = request.get_json()
        tag_id = data.get('qr_code') or data.get('tag_id')

        if not tag_id:
            return jsonify({'success': False, 'error': 'qr_code or tag_id is required'}), 400

        cred = AccessCredential.query.filter_by(tag_id=tag_id, is_active=True).first()
        if not cred:
            return jsonify({'success': False, 'error': 'Credential not recognized'}), 404

        account = cred.account
        primary_user = account.users[0] if account.users else None

        return jsonify({
            'success': True,
            'authenticated': True,
            'account': {
                'id': account.id,
                'name': account.account_name,
                'points_balance': account.points_balance,
            },
            'user': {
                'id': primary_user.id,
                'name': primary_user.name,
            } if primary_user else None
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@rpi_bp.route('/status', methods=['GET'])
def get_status():
    """Get Raspberry Pi system status"""
    try:
        return jsonify({
            'success': True,
            'status': 'online',
            'timestamp': datetime.now(timezone.utc).isoformat(),
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
    """Start a recycling session once a QR/RFID credential is validated."""
    data = request.get_json() or {}
    machine_uuid = data.get('machine_uuid')
    tag_id = data.get('user_qr') or data.get('tag_id')

    if not machine_uuid or not tag_id:
        return jsonify({'success': False, 'error': 'machine_uuid and user_qr/tag_id are required'}), 400

    machine = _get_machine(machine_uuid)
    if not machine:
        return jsonify({'success': False, 'error': 'RVM not registered'}), 404

    cred = AccessCredential.query.filter_by(tag_id=tag_id, is_active=True).first()
    if not cred:
        return jsonify({'success': False, 'error': 'Credential not recognized'}), 404

    account = cred.account

    try:
        session = RecyclingSession(
            account_id=account.id,
            rvm_id=machine.id,
            status='active',
        )
        machine.is_online = True
        machine.last_heartbeat = datetime.now(timezone.utc)
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': _serialize_session(session),
            'account': {
                'id': account.id,
                'name': account.account_name,
                'points_balance': account.points_balance,
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
    brand = data.get('brand')
    volume_ml = data.get('volume_ml')
    condition = data.get('condition')
    size_category = data.get('size_category')

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
            brand=brand,
            volume_ml=volume_ml,
            condition=condition,
            points_awarded=int(points),
            weight_grams=weight_grams,
        )
        session.item_count = (session.item_count or 0) + 1
        session.total_points_earned = (session.total_points_earned or 0) + int(points)
        if machine:
            machine.last_heartbeat = datetime.now(timezone.utc)
        db.session.add(item)
        db.session.commit()

        return jsonify({
            'success': True,
            'session': _serialize_session(session),
            'item': {
                'id': item.id,
                'item_type': item.item_type,
                'brand': item.brand,
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
    """Finish a recycling session and credit the account."""
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
        session.end_time = datetime.now(timezone.utc)
        session.status = 'completed'

        account = session.account
        if not account:
            raise ValueError('Account missing for session')

        balance_before = account.points_balance or 0
        balance_after = balance_before + total_points

        transaction = Transaction(
            account_id=account.id,
            transaction_type='earn',
            amount=total_points,
            balance_before=balance_before,
            balance_after=balance_after,
            description=f'Recycling session {session.id}',
            reference_id=str(session.id),
        )

        account.points_balance = balance_after
        machine.total_items_collected = (machine.total_items_collected or 0) + (session.item_count or 0)
        machine.last_heartbeat = datetime.now(timezone.utc)

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
            'account': {
                'id': account.id,
                'points_balance': account.points_balance,
            }
        }), 200
    except Exception as exc:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(exc)}), 500
