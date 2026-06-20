"""
Leaderboard Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/leaderboard/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/leaderboard/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import func

from ..models import (
    User,
    Wallet,
    CommunityGroup,
    Organization,
    RecyclingSession,
    RecyclingItem,
    RewardRedemption,
    RewardVariant,
    Reward,
)
from ..middleware import token_required, permission_required
from .. import db
from ..cache import cached_endpoint


leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/leaderboard')


# ══════════════════════════════════════════════════════════════════════════
# LEADERBOARD
# ══════════════════════════════════════════════════════════════════════════

@leaderboard_bp.route('', methods=['GET'])
@token_required
@permission_required('leaderboard', allow_non_admin=True)
@cached_endpoint('leaderboard', ttl=300)
def get_leaderboard(current_user):
    """Return leaderboard data: top users and top groups."""
    try:
        # ── Date boundaries (UTC) ──
        now = datetime.now(timezone.utc)
        week_start  = now - timedelta(days=now.weekday())          # Monday of this week
        week_start  = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # ── Subquery: bottles collected per wallet (lifetime) ──
        bottle_sub = db.session.query(
            RecyclingSession.wallet_id,
            func.coalesce(func.sum(RecyclingSession.item_count), 0).label('bottles')
        ).group_by(RecyclingSession.wallet_id).subquery()

        # ── Subquery: points earned this month per wallet ──
        month_sub = db.session.query(
            RecyclingSession.wallet_id,
            func.coalesce(func.sum(RecyclingItem.points_awarded), 0).label('pts_month')
        ).join(RecyclingItem, RecyclingItem.session_id == RecyclingSession.id)\
         .filter(RecyclingSession.start_time >= month_start)\
         .group_by(RecyclingSession.wallet_id).subquery()

        # ── Subquery: points earned this week per wallet ──
        week_sub = db.session.query(
            RecyclingSession.wallet_id,
            func.coalesce(func.sum(RecyclingItem.points_awarded), 0).label('pts_week')
        ).join(RecyclingItem, RecyclingItem.session_id == RecyclingSession.id)\
         .filter(RecyclingSession.start_time >= week_start)\
         .group_by(RecyclingSession.wallet_id).subquery()

        # ── Subquery: rewards redeemed per wallet ──
        redemption_sub = db.session.query(
            RewardRedemption.wallet_id,
            func.count(RewardRedemption.id).label('rewards_count')
        ).filter(RewardRedemption.status.in_(['claimed', 'used', 'pending']))\
         .group_by(RewardRedemption.wallet_id).subquery()

        user_query = db.session.query(
            User, Wallet.points_balance, Wallet.lifetime_points, Wallet.streak,
            func.coalesce(bottle_sub.c.bottles, 0).label('bottles_collected'),
            func.coalesce(month_sub.c.pts_month, 0).label('pts_month'),
            func.coalesce(week_sub.c.pts_week, 0).label('pts_week'),
            func.coalesce(redemption_sub.c.rewards_count, 0).label('rewards_claimed'),
            CommunityGroup.abbreviation.label('group_abbr'),
            CommunityGroup.name.label('group_name'),
            CommunityGroup.educational_level,
            CommunityGroup.organization_id,
            func.coalesce(Organization.full_name, Organization.name).label('org_name'),
        ).select_from(User)\
         .join(Wallet, Wallet.user_id == User.id)\
         .join(CommunityGroup, CommunityGroup.id == User.community_group_id)\
         .join(Organization, Organization.id == CommunityGroup.organization_id)\
         .outerjoin(bottle_sub, bottle_sub.c.wallet_id == Wallet.id)\
         .outerjoin(month_sub, month_sub.c.wallet_id == Wallet.id)\
         .outerjoin(week_sub, week_sub.c.wallet_id == Wallet.id)\
         .outerjoin(redemption_sub, redemption_sub.c.wallet_id == Wallet.id)

        # Leaderboard is cross-org: all authenticated users see all orgs.
        # Superadmins may still pass ?location_id to scope to one org.
        loc_id = None
        if current_user.role == 'superadmin':
            loc_id = request.args.get('location_id', type=int)
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
                'username': u.username or '',
                'points': row.points_balance or 0,
                'lifetimePoints': row.lifetime_points or 0,
                'pointsThisMonth': row.pts_month or 0,
                'pointsThisWeek': row.pts_week or 0,
                'rewardsClaimed': row.rewards_claimed or 0,
                'streak': row.streak or 0,
                'bottlesCollected': row.bottles_collected or 0,
                'userType': u.user_type,
                'department': row.group_abbr or row.group_name,
                'educationalLevel': row.educational_level,
                'locationId': row.organization_id,
                'locationName': row.org_name,
            })

        group_query = db.session.query(
            CommunityGroup.id,
            CommunityGroup.name,
            CommunityGroup.abbreviation,
            CommunityGroup.educational_level,
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
                'educationalLevel': g.educational_level,
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
