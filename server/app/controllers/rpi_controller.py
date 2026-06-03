"""
RPI Controller
Handles all API endpoints for the Raspberry Pi (RVM hardware).
Machines authenticate via machine_uuid, users authenticate via QR code (display_id).
"""
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..models import (
    User, RVM, RecyclingSession, RecyclingItem, Transaction, Wallet,
    AdminLog, NotificationSetting,
)
from .. import db

rpi_bp = Blueprint('rpi', __name__, url_prefix='/api/rpi')


# ══════════════════════════════════════════════════════════════════════════
# MACHINE AUTHENTICATION
# ══════════════════════════════════════════════════════════════════════════

@rpi_bp.route('/machine/identify', methods=['POST'])
def identify_machine():
    """Identify and authenticate an RVM by its machine_uuid.

    Body: { "machineUuid": "RVM-AU-01" }
    """
    try:
        data = request.get_json() or {}
        machine_uuid = data.get('machineUuid')

        if not machine_uuid:
            return jsonify({'success': False, 'error': 'machineUuid is required'}), 400

        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not registered'}), 404

        return jsonify({
            'success': True,
            'machine': {
                'id': rvm.id,
                'name': rvm.name,
                'locationName': rvm.location_name,
                'isOnline': rvm.is_online,
                'isCapacityFull': rvm.is_capacity_full,
                'organizationId': rvm.organization_id,
            }
        }), 200
    except Exception:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/machine/heartbeat', methods=['POST'])
def machine_heartbeat():
    """Periodic heartbeat from an RVM to confirm it's alive.

    Body: { "machineUuid": "RVM-AU-01", "isCapacityFull": false }
    """
    try:
        data = request.get_json() or {}
        machine_uuid = data.get('machineUuid')

        if not machine_uuid:
            return jsonify({'success': False, 'error': 'machineUuid is required'}), 400

        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not registered'}), 404

        rvm.is_online = True
        if 'isCapacityFull' in data:
            rvm.is_capacity_full = bool(data['isCapacityFull'])
        db.session.commit()

        return jsonify({'success': True, 'message': 'Heartbeat received'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# USER AUTHENTICATION (QR Code)
# ══════════════════════════════════════════════════════════════════════════

@rpi_bp.route('/authenticate', methods=['POST'])
def authenticate_user():
    """Authenticate a user via QR code payload (display_id).

    Body: { "qrPayload": "USER-AU-001", "machineUuid": "RVM-AU-01" }
    """
    try:
        data = request.get_json() or {}
        qr_payload = data.get('qrPayload')
        if qr_payload and qr_payload.startswith("USER:"):
            qr_payload = qr_payload[5:]
        machine_uuid = data.get('machineUuid')

        if not qr_payload or not machine_uuid:
            return jsonify({'success': False, 'error': 'qrPayload and machineUuid are required'}), 400

        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not registered'}), 404

        # Look up user by qr_token first, then fallback to display_id
        user = User.query.filter_by(qr_token=qr_payload, is_active=True).first()
        if not user:
            user = User.query.filter_by(display_id=qr_payload, is_active=True).first()
        if not user:
            return jsonify({'success': False, 'error': 'Invalid QR code or user not found'}), 404

        wallet = user.wallet
        if not wallet:
            return jsonify({'success': False, 'error': 'User has no wallet'}), 404

        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'name': user.name,
                'displayId': user.display_id,
                'pointsBalance': wallet.points_balance,
                'streak': wallet.streak,
            },
            'walletId': wallet.id,
        }), 200
    except Exception:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# RECYCLING SESSIONS
# ══════════════════════════════════════════════════════════════════════════

@rpi_bp.route('/session/start', methods=['POST'])
def start_session():
    """Start a new recycling session.

    Body: { "machineUuid": "RVM-AU-01", "walletId": 1 }
    OR Edge Client Body: { "user_qr": "USER-123", "machine_uuid": "RVM-001" }
    """
    try:
        data = request.get_json() or {}
        machine_uuid = data.get('machineUuid') or data.get('machine_uuid')
        wallet_id = data.get('walletId')
        user_qr = data.get('user_qr')
        if user_qr and user_qr.startswith("USER:"):
            user_qr = user_qr[5:]

        if not machine_uuid:
            return jsonify({'success': False, 'error': 'machineUuid is required'}), 400

        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not registered'}), 404

        user = None
        if user_qr:
            user = User.query.filter_by(qr_token=user_qr, is_active=True).first()
            if not user:
                user = User.query.filter_by(display_id=user_qr, is_active=True).first()
            if not user:
                return jsonify({'success': False, 'error': 'Invalid QR code or user not found'}), 404
            wallet = user.wallet
            if not wallet:
                return jsonify({'success': False, 'error': 'User has no wallet'}), 404
            wallet_id = wallet.id
        else:
            if not wallet_id:
                return jsonify({'success': False, 'error': 'walletId or user_qr is required'}), 400
            wallet = db.session.get(Wallet, wallet_id)
            if not wallet:
                return jsonify({'success': False, 'error': 'Wallet not found'}), 404

        if rvm.is_capacity_full:
            return jsonify({'success': False, 'error': 'Machine is full — cannot accept items'}), 400

        session = RecyclingSession(
            rvm_id=rvm.id,
            wallet_id=wallet_id,
            status='active',
            total_points_earned=0,
            item_count=0,
        )
        db.session.add(session)
        db.session.commit()

        response_data = {
            'success': True,
            'session': {
                'id': session.id,
                'session_id': session.id,
                'rvmId': rvm.id,
                'walletId': wallet_id,
                'status': session.status,
                'startTime': session.start_time.isoformat() if session.start_time else None,
            }
        }
        if user:
            response_data['account'] = {'name': user.name}

        return jsonify(response_data), 201
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/session/<int:session_id>/deposit', methods=['POST'])
def deposit_item(session_id):
    """Deposit a single item during an active session.

    Body: {
        "detectedClass": "PET Bottle - Small",
        "confidenceScore": 95.50,
        "pointsAwarded": 5,
        "status": "Accepted"  // Accepted or Rejected
    }
    """
    try:
        data = request.get_json() or {}
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        if session.status != 'active':
            return jsonify({'success': False, 'error': 'Session is not active'}), 400

        detected_class = data.get('detectedClass', 'Unknown')
        confidence = data.get('confidenceScore')
        points = int(data.get('pointsAwarded', 0))
        status = data.get('status', 'Accepted')

        if status not in ('Accepted', 'Rejected'):
            return jsonify({'success': False, 'error': 'Status must be "Accepted" or "Rejected"'}), 400

        # If rejected, no points
        if status == 'Rejected':
            points = 0

        item = RecyclingItem(
            session_id=session_id,
            detected_class=detected_class,
            confidence_score=confidence,
            points_awarded=points,
            status=status,
        )
        db.session.add(item)

        session.item_count = (session.item_count or 0) + 1
        session.total_points_earned = (session.total_points_earned or 0) + points
        db.session.commit()

        return jsonify({
            'success': True,
            'item': {
                'id': item.id,
                'detectedClass': item.detected_class,
                'confidenceScore': float(item.confidence_score) if item.confidence_score else None,
                'pointsAwarded': item.points_awarded,
                'status': item.status,
            },
            'sessionTotals': {
                'itemCount': session.item_count,
                'totalPointsEarned': session.total_points_earned,
            }
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/item/deposit', methods=['POST'])
def edge_deposit_item():
    """Deposit an item (Edge Client compatibility endpoint).
    
    Body: {
        "session_id": 1,
        "item_type": "PET Plastic",
        "points": 10,
        "weight_grams": 50,
        "brand": "Unknown",
        "condition": "Good",
        "size_category": "Medium"
    }
    """
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'success': False, 'error': 'session_id is required'}), 400
            
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        if session.status != 'active':
            return jsonify({'success': False, 'error': 'Session is not active'}), 400

        detected_class = data.get('item_type', 'Unknown')
        points = int(data.get('points', 0))
        
        item = RecyclingItem(
            session_id=session_id,
            detected_class=detected_class,
            confidence_score=100.0,
            points_awarded=points,
            status='Accepted',
        )
        db.session.add(item)

        session.item_count = (session.item_count or 0) + 1
        session.total_points_earned = (session.total_points_earned or 0) + points
        db.session.commit()

        return jsonify({
            'success': True,
            'item': {
                'id': item.id,
                'detectedClass': item.detected_class,
                'pointsAwarded': item.points_awarded,
                'status': item.status,
            }
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/session/<int:session_id>', methods=['GET'])
def get_session_details(session_id):
    """Get the current details of a specific session (useful for reading active state)."""
    try:
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404

        items = [{
            'id': i.id,
            'detectedClass': i.detected_class,
            'confidenceScore': float(i.confidence_score) if i.confidence_score else None,
            'pointsAwarded': i.points_awarded,
            'status': i.status,
        } for i in session.items]

        return jsonify({
            'success': True,
            'session': {
                'id': session.id,
                'rvmId': session.rvm_id,
                'walletId': session.wallet_id,
                'status': session.status,
                'itemCount': session.item_count,
                'totalPointsEarned': session.total_points_earned,
                'startTime': session.start_time.isoformat() if session.start_time else None,
                'endTime': session.end_time.isoformat() if session.end_time else None,
                'items': items
            }
        }), 200
    except Exception:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/session/<int:session_id>/end', methods=['POST'])
def end_session(session_id):
    """End an active session and credit points to the wallet.

    Body: { "status": "completed" }  // completed, timed_out, error
    """
    try:
        data = request.get_json() or {}
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        if session.status != 'active':
            return jsonify({'success': False, 'error': 'Session is not active'}), 400

        final_status = data.get('status', 'completed')
        if final_status not in ('completed', 'timed_out', 'error'):
            return jsonify({'success': False, 'error': 'Invalid status'}), 400

        session.status = final_status
        session.end_time = datetime.now(timezone.utc)

        total_points = session.total_points_earned or 0

        # Credit wallet on successful completion or session timeout
        if final_status in ('completed', 'timed_out') and total_points > 0:
            wallet = db.session.get(Wallet, session.wallet_id)
            if wallet:
                balance_before = wallet.points_balance
                wallet.points_balance += total_points
                wallet.lifetime_points = (wallet.lifetime_points or 0) + total_points

                txn = Transaction(
                    wallet_id=wallet.id,
                    transaction_type='earn',
                    amount=total_points,
                    balance_before=balance_before,
                    balance_after=wallet.points_balance,
                    reference_type='session',
                    reference_id=session.id,
                )
                db.session.add(txn)

        db.session.commit()

        return jsonify({
            'success': True,
            'session': {
                'id': session.id,
                'status': session.status,
                'itemCount': session.item_count,
                'totalPointsEarned': session.total_points_earned,
                'startTime': session.start_time.isoformat() if session.start_time else None,
                'endTime': session.end_time.isoformat() if session.end_time else None,
            }
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/session/end', methods=['POST'])
def edge_end_session():
    """End a session (Edge Client compatibility endpoint).
    
    Body: { "session_id": 123, "machine_uuid": "..." }
    """
    try:
        data = request.get_json() or {}
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'success': False, 'error': 'session_id is required'}), 400
            
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        if session.status != 'active':
            return jsonify({'success': False, 'error': 'Session is not active'}), 400

        session.status = 'completed'
        session.end_time = datetime.now(timezone.utc)

        total_points = session.total_points_earned or 0

        # Credit wallet
        if total_points > 0:
            wallet = db.session.get(Wallet, session.wallet_id)
            if wallet:
                balance_before = wallet.points_balance
                wallet.points_balance += total_points
                wallet.lifetime_points = (wallet.lifetime_points or 0) + total_points

                txn = Transaction(
                    wallet_id=wallet.id,
                    transaction_type='earn',
                    amount=total_points,
                    balance_before=balance_before,
                    balance_after=wallet.points_balance,
                    reference_type='session',
                    reference_id=session.id,
                )
                db.session.add(txn)

        db.session.commit()

        return jsonify({
            'success': True,
            'session': {
                'id': session.id,
                'status': session.status,
                'itemCount': session.item_count,
                'totalPointsEarned': session.total_points_earned
            }
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rpi_bp.route('/machine/status', methods=['POST'])
def update_machine_status():
    """Update machine operational status.

    Body: { "machineUuid": "...", "isOnline": true, "isCapacityFull": false }
    """
    try:
        data = request.get_json() or {}
        machine_uuid = data.get('machineUuid')

        if not machine_uuid:
            return jsonify({'success': False, 'error': 'machineUuid is required'}), 400

        rvm = RVM.query.filter_by(machine_uuid=machine_uuid).first()
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not registered'}), 404

        if 'isOnline' in data:
            rvm.is_online = bool(data['isOnline'])
        if 'isCapacityFull' in data:
            rvm.is_capacity_full = bool(data['isCapacityFull'])

        db.session.commit()

        # ── Notification hooks ──
        try:
            from ..services.notification_service import trigger_alert
            if 'isOnline' in data and not data['isOnline']:
                trigger_alert(rvm.organization_id, 'machine_offline',
                              f'Machine offline: {rvm.name}',
                              f'The machine "{rvm.name}" has gone offline.')
            if 'isCapacityFull' in data and data['isCapacityFull']:
                trigger_alert(rvm.organization_id, 'machine_capacity_high',
                              f'Machine full: {rvm.name}',
                              f'Machine "{rvm.name}" reports its bin is full.')
        except Exception:
            pass

        return jsonify({'success': True, 'message': 'Machine status updated'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# POINTS CONFIGURATION (for RVM-side point calculation)
# ══════════════════════════════════════════════════════════════════════════

@rpi_bp.route('/config/points/<int:org_id>', methods=['GET'])
def get_points_config(org_id):
    """Get point-per-item configuration for a given organization."""
    try:
        import json as _json
        setting = NotificationSetting.query.filter_by(
            organization_id=org_id, alert_key='config_points'
        ).first()

        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                config = None
        else:
            config = None

        if not config:
            config = {
                'smallWithLabel': 5, 'smallNoLabel': 3,
                'mediumWithLabel': 8, 'mediumNoLabel': 5,
                'largeWithLabel': 10, 'largeNoLabel': 7,
            }

        return jsonify({'success': True, 'config': config}), 200
    except Exception:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
