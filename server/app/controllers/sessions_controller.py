"""
Sessions Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under both `/sessions/*` and `/bulk-deposits*`. Because a single
Flask Blueprint can only have one `url_prefix`, this blueprint is declared
without a prefix and the full paths are written into each route decorator.
When `web_bp.register_blueprint(sessions_bp)` is called from
`web_controller.py`, both prefixes appear under `/api/web/...` so the
externally visible URL inventory remains byte-identical with the
pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from sqlalchemy.orm import joinedload

from ..models import (
    RecyclingSession,
    RecyclingItem,
    RVM,
    Wallet,
    User,
    CommunityGroup,
    Transaction,
    BulkDeposit,
)
from ..middleware import token_required, permission_required, get_user_org_id, validate_request
from ..schemas import BulkSessionCreateSchema, BulkDepositCreateSchema
from ..services.notification_service import trigger_alert
from .. import db
from ..cache import cache_invalidate
from ._shared import _dt, _log_action, _scope_location_id


# Note: no `url_prefix` — the blueprint owns two distinct path families
# (`/sessions/*` and `/bulk-deposits`), so each route decorator carries the
# full path. Registering this blueprint under `web_bp` (prefix `/api/web`)
# yields `/api/web/sessions/...` and `/api/web/bulk-deposits`.
sessions_bp = Blueprint('sessions', __name__)


# ══════════════════════════════════════════════════════════════════════════
# BULK SESSIONS
# ══════════════════════════════════════════════════════════════════════════

def _serialize_bulk_session(session):
    """RecyclingSession (bulk) → frontend shape."""
    # wallet and user are joinedloaded by get_bulk_sessions — no extra queries.
    wallet = session.wallet
    user = wallet.user if wallet else None
    rvm = session.rvm
    org = rvm.organization if rvm else None

    status_value = (session.status or '').lower() or None

    return {
        'id': session.id,
        'userId': user.id if user else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'machineId': rvm.id if rvm else None,
        'machineName': rvm.name if rvm else 'Unknown',
        'locationId': rvm.organization_id if rvm else None,
        'locationName': org.name if org else 'Unknown',
        'itemCount': session.item_count,
        'totalPointsEarned': session.total_points_earned,
        'status': status_value,
        'startTime': _dt(session.start_time),
        'endTime': _dt(session.end_time),
        'notes': getattr(session, 'notes', None),
    }


@sessions_bp.route('/sessions/bulk', methods=['GET'])
@token_required
@permission_required('sessions')
def get_bulk_sessions(current_user):
    """List all recycling sessions, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RecyclingSession.query.options(
            joinedload(RecyclingSession.wallet).joinedload(Wallet.user),
            joinedload(RecyclingSession.rvm).joinedload(RVM.organization),
        )
        if loc_id:
            query = query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        sessions = query.order_by(RecyclingSession.start_time.desc()).limit(200).all()
        return jsonify({'success': True, 'sessions': [_serialize_bulk_session(s) for s in sessions]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@sessions_bp.route('/sessions/bulk', methods=['POST'])
@token_required
@permission_required('sessions')
@validate_request(BulkSessionCreateSchema)
def create_bulk_session(current_user, payload):
    """Create a new bulk recycling session with items.

    Body: {
        rvmId: int,
        walletId: int,
        items: [{ detectedClass, confidenceScore?, pointsAwarded, status? }]
    }
    """
    try:
        rvm_id = payload.rvmId
        wallet_id = payload.walletId
        items_data = [
            item.model_dump(exclude_unset=True)
            for item in (payload.items or [])
        ]

        if not rvm_id:
            return jsonify({'success': False, 'error': 'rvmId is required'}), 400
        if not wallet_id:
            return jsonify({'success': False, 'error': 'walletId is required'}), 400
        if not items_data:
            return jsonify({'success': False, 'error': 'At least one item is required'}), 400

        rvm = db.session.get(RVM, rvm_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        wallet = db.session.get(Wallet, wallet_id)
        if not wallet:
            return jsonify({'success': False, 'error': 'Wallet not found'}), 404

        # Validate wallet user belongs to same org as RVM
        user = wallet.user
        if user and user.community_group:
            if user.community_group.organization_id != rvm.organization_id:
                return jsonify({'success': False, 'error': 'User does not belong to the same organization as the machine'}), 400

        if current_user.role != 'superadmin' and rvm.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        now = datetime.now(timezone.utc)
        session = RecyclingSession(
            rvm_id=rvm_id,
            wallet_id=wallet_id,
            start_time=now,
            end_time=now,
            total_points_earned=0,
            item_count=0,
            status='completed',
            # Phase 3 task 8.2: persist the optional `notes` body field
            # added by migration `phase3_session_notes`.
            notes=(payload.notes or None),
        )
        db.session.add(session)
        db.session.flush()

        total_points = 0
        for item_data in items_data:
            pts = int(item_data.get('pointsAwarded', 0))
            ri = RecyclingItem(
                session_id=session.id,
                detected_class=item_data.get('detectedClass', 'PET Bottle'),
                confidence_score=item_data.get('confidenceScore'),
                points_awarded=pts,
                status=item_data.get('status', 'Accepted'),
                scanned_at=now,
            )
            db.session.add(ri)
            total_points += pts

        session.item_count = len(items_data)
        session.total_points_earned = total_points

        # Credit wallet
        balance_before = wallet.points_balance
        wallet.points_balance += total_points
        wallet.lifetime_points = (wallet.lifetime_points or 0) + total_points

        txn = Transaction(
            wallet_id=wallet_id,
            transaction_type='earn',
            amount=total_points,
            balance_before=balance_before,
            balance_after=wallet.points_balance,
            reference_type='recycling_session',
            reference_id=session.id,
        )
        db.session.add(txn)

        _log_action(current_user, 'Bulk Session Created',
                     f'{len(items_data)} items, {total_points} pts for wallet {wallet_id}',
                     'Logs')
        db.session.commit()

        # Bust caches — new session affects dashboard stats, leaderboard, analytics
        cache_invalidate('dashboard_stats')
        cache_invalidate('leaderboard')
        cache_invalidate('analytics')

        # -- Notification hook: bulk session completed --
        try:
            trigger_alert(rvm.organization_id, 'bulk_session_completed',
                          f'Bulk session completed: {len(items_data)} items',
                          f'A bulk session of {len(items_data)} items ({total_points} pts) '
                          f'was created for wallet {wallet_id} on "{rvm.name}".')
        except Exception:
            pass

        return jsonify({'success': True, 'session': _serialize_bulk_session(session)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@sessions_bp.route('/sessions/bulk/<int:session_id>', methods=['GET'])
@token_required
@permission_required('sessions')
def get_bulk_session_detail(current_user, session_id):
    """Get a single session with its items."""
    try:
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404

        # ── Org scope check ──
        if current_user.role != 'superadmin' and session.rvm:
            if session.rvm.organization_id != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        items = [{
            'id': i.id,
            'detectedClass': i.detected_class,
            'confidenceScore': float(i.confidence_score) if i.confidence_score else None,
            'pointsAwarded': i.points_awarded,
            'status': i.status,
            'scannedAt': _dt(i.scanned_at),
        } for i in session.items]

        result = _serialize_bulk_session(session)
        result['items'] = items

        return jsonify({'success': True, 'session': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# BULK DEPOSITS  (admin manual point credits — no RVM involved)
# ══════════════════════════════════════════════════════════════════════════

def _serialize_bulk_deposit(bd):
    """BulkDeposit → frontend shape."""
    admin = bd.admin if bd.admin else None
    wallet = db.session.get(Wallet, bd.wallet_id) if bd.wallet_id else None
    user = wallet.user if wallet else None
    return {
        'id': bd.id,
        'adminUserId': bd.admin_user_id,
        'adminName': admin.name if admin else 'Unknown',
        'walletId': bd.wallet_id,
        'userId': user.id if user else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'totalPointsAwarded': bd.total_points_awarded,
        'itemCount': bd.item_count,
        'notes': bd.notes,
        'createdAt': _dt(bd.created_at),
    }


@sessions_bp.route('/bulk-deposits', methods=['GET'])
@token_required
@permission_required('sessions')
def get_bulk_deposits(current_user):
    """List all bulk deposits, scoped by organization."""
    try:
        loc_id = _scope_location_id(current_user)
        query = BulkDeposit.query
        if loc_id:
            query = query.join(Wallet, BulkDeposit.wallet_id == Wallet.id)\
                .join(User, Wallet.user_id == User.id)\
                .join(CommunityGroup, User.community_group_id == CommunityGroup.id)\
                .filter(CommunityGroup.organization_id == loc_id)
        deposits = query.order_by(BulkDeposit.created_at.desc()).limit(200).all()
        return jsonify({'success': True, 'deposits': [_serialize_bulk_deposit(d) for d in deposits]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@sessions_bp.route('/bulk-deposits', methods=['POST'])
@token_required
@permission_required('sessions')
@validate_request(BulkDepositCreateSchema)
def create_bulk_deposit(current_user, payload):
    """Create a manual bulk deposit — admin credits points directly to a user's wallet.

    Body: { walletId, totalPointsAwarded, itemCount, notes? }
    """
    try:
        wallet_id = payload.walletId
        points = payload.totalPointsAwarded
        item_count = payload.itemCount
        notes = (payload.notes or '').strip()

        if not wallet_id:
            return jsonify({'success': False, 'error': 'walletId is required'}), 400
        if not points or int(points) <= 0:
            return jsonify({'success': False, 'error': 'totalPointsAwarded must be a positive integer'}), 400
        if not item_count or int(item_count) <= 0:
            return jsonify({'success': False, 'error': 'itemCount must be a positive integer'}), 400

        points = int(points)
        item_count = int(item_count)

        wallet = db.session.get(Wallet, wallet_id)
        if not wallet:
            return jsonify({'success': False, 'error': 'Wallet not found'}), 404

        # Org-scope check: wallet user must belong to admin's org
        user = wallet.user
        if current_user.role != 'superadmin' and user and user.community_group:
            if user.community_group.organization_id != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'User does not belong to your organization'}), 403

        bd = BulkDeposit(
            admin_user_id=current_user.id,
            wallet_id=wallet_id,
            total_points_awarded=points,
            item_count=item_count,
            notes=notes or None,
        )
        db.session.add(bd)
        db.session.flush()

        # Credit wallet
        balance_before = wallet.points_balance
        wallet.points_balance += points
        wallet.lifetime_points = (wallet.lifetime_points or 0) + points

        txn = Transaction(
            wallet_id=wallet_id,
            transaction_type='bulk_transaction',
            amount=points,
            balance_before=balance_before,
            balance_after=wallet.points_balance,
            reference_type='bulk_deposit',
            reference_id=bd.id,
        )
        db.session.add(txn)

        _log_action(current_user, 'Bulk Deposit Created',
                     f'{points} pts to wallet {wallet_id} ({item_count} items)',
                     'Logs', notes)
        db.session.commit()

        # Bust caches — deposit changes points, leaderboard, dashboard
        cache_invalidate('dashboard_stats')
        cache_invalidate('leaderboard')
        cache_invalidate('analytics')

        return jsonify({'success': True, 'deposit': _serialize_bulk_deposit(bd)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
