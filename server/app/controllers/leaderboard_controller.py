"""
Leaderboard Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/leaderboard/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/leaderboard/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, jsonify
from sqlalchemy import func

from ..models import (
    User,
    Wallet,
    CommunityGroup,
    Organization,
    RecyclingSession,
)
from ..middleware import token_required, permission_required
from .. import db
from ._shared import _scope_location_id


leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/leaderboard')


# ══════════════════════════════════════════════════════════════════════════
# LEADERBOARD
# ══════════════════════════════════════════════════════════════════════════

@leaderboard_bp.route('', methods=['GET'])
@token_required
@permission_required('leaderboard')
def get_leaderboard(current_user):
    """Return leaderboard data: top users and top groups."""
    try:
        loc_id = _scope_location_id(current_user)

        # Subquery: bottles collected per wallet
        bottle_sub = db.session.query(
            RecyclingSession.wallet_id,
            func.coalesce(func.sum(RecyclingSession.item_count), 0).label('bottles')
        ).group_by(RecyclingSession.wallet_id).subquery()

        user_query = db.session.query(
            User, Wallet.points_balance, Wallet.lifetime_points, Wallet.streak,
            func.coalesce(bottle_sub.c.bottles, 0).label('bottles_collected'),
            CommunityGroup.abbreviation.label('group_abbr'),
            CommunityGroup.name.label('group_name'),
            CommunityGroup.group_type,
            CommunityGroup.organization_id,
            Organization.name.label('org_name'),
        ).select_from(User)\
         .join(Wallet, Wallet.user_id == User.id)\
         .join(CommunityGroup, CommunityGroup.id == User.community_group_id)\
         .join(Organization, Organization.id == CommunityGroup.organization_id)\
         .outerjoin(bottle_sub, bottle_sub.c.wallet_id == Wallet.id)

        if loc_id:
            user_query = user_query.filter(CommunityGroup.organization_id == loc_id)
        top_users = user_query.filter(User.role == 'user')\
            .order_by(Wallet.lifetime_points.desc()).all()

        users_list = []
        for row in top_users:
            u = row.User if hasattr(row, 'User') else row[0]
            users_list.append({
                'id': u.id,
                'name': u.name,
                'points': row.points_balance or 0,
                'lifetimePoints': row.lifetime_points or 0,
                'streak': row.streak or 0,
                'bottlesCollected': row.bottles_collected or 0,
                'userType': u.user_type,
                'department': row.group_abbr or row.group_name,
                'groupType': row.group_type,
                'locationId': row.organization_id,
                'locationName': row.org_name,
            })

        group_query = db.session.query(
            CommunityGroup.id,
            CommunityGroup.name,
            CommunityGroup.abbreviation,
            CommunityGroup.group_type,
            CommunityGroup.organization_id,
            func.coalesce(func.sum(Wallet.lifetime_points), 0).label('total_points'),
            func.count(User.id).label('member_count'),
        ).select_from(CommunityGroup)\
         .join(User, User.community_group_id == CommunityGroup.id)\
         .join(Wallet, Wallet.user_id == User.id)\
         .group_by(CommunityGroup.id)

        if loc_id:
            group_query = group_query.filter(CommunityGroup.organization_id == loc_id)

        top_groups = group_query.order_by(func.sum(Wallet.lifetime_points).desc()).all()

        groups_list = []
        for g in top_groups:
            groups_list.append({
                'id': g.id,
                'name': g.name,
                'abbreviation': g.abbreviation,
                'groupType': g.group_type,
                'locationId': g.organization_id,
                'totalPoints': g.total_points,
                'memberCount': g.member_count,
            })

        return jsonify({
            'success': True,
            'topUsers': users_list,
            'topGroups': groups_list,
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
