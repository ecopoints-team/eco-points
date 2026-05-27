"""
Dashboard Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/dashboard/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/dashboard/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, jsonify
from sqlalchemy import func

from ..models import (
    Organization,
    CommunityGroup,
    User,
    RVM,
    RecyclingSession,
    RecyclingItem,
    Reward,
)
from ..middleware import token_required, permission_required
from .. import db
from ._shared import _scope_location_id


dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')


# ══════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
@permission_required('dashboard')
def dashboard_stats(current_user):
    """Aggregated dashboard statistics, scoped by location."""
    try:
        if not current_user.is_admin:
            return jsonify({
                'success': True,
                'stats': {
                    'totalUsers': 0, 'activeUsers': 0, 'students': 0, 'faculty': 0, 'staff': 0,
                    'totalMachines': 0, 'onlineMachines': 0, 'totalBottles': 0,
                    'totalPointsAwarded': 0, 'totalRewards': 0, 'activeRewards': 0,
                    'locationCount': 0,
                }
            }), 200

        loc_id = _scope_location_id(current_user)

        # --- User counts ---
        user_query = db.session.query(User).join(CommunityGroup)
        if loc_id:
            user_query = user_query.filter(CommunityGroup.organization_id == loc_id)

        total_users = user_query.count()
        active_users = user_query.filter(User.is_active == True).count()
        students = user_query.filter(User.user_type == 'student').count()
        faculty = user_query.filter(User.user_type == 'faculty').count()
        staff = user_query.filter(User.user_type == 'staff').count()

        # --- Machine counts ---
        machine_query = RVM.query
        if loc_id:
            machine_query = machine_query.filter_by(organization_id=loc_id)
        total_machines = machine_query.count()
        online_machines = machine_query.filter_by(is_online=True).count()

        # --- Bottle / points aggregates ---
        bottle_query = db.session.query(
            func.count(RecyclingItem.id),
            func.coalesce(func.sum(RecyclingItem.points_awarded), 0),
        ).join(RecyclingSession)
        if loc_id:
            bottle_query = bottle_query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        bottle_count, total_points_awarded = bottle_query.one()

        # --- Reward counts ---
        reward_query = Reward.query
        if loc_id:
            reward_query = reward_query.filter_by(organization_id=loc_id)
        total_rewards = reward_query.count()
        active_rewards = reward_query.filter_by(is_active=True).count()

        # --- Location count ---
        location_count = Organization.query.count() if not loc_id else 1

        return jsonify({
            'success': True,
            'stats': {
                'totalUsers': total_users,
                'activeUsers': active_users,
                'students': students,
                'faculty': faculty,
                'staff': staff,
                'totalMachines': total_machines,
                'onlineMachines': online_machines,
                'totalBottles': bottle_count,
                'totalPointsAwarded': total_points_awarded,
                'totalRewards': total_rewards,
                'activeRewards': active_rewards,
                'locationCount': location_count,
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
