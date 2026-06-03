"""
Analytics Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/analytics/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/analytics` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify
from sqlalchemy import func

from ..models import (
    Organization, User, Wallet, RVM, RecyclingItem, RecyclingSession,
    Reward, RewardVariant, RewardRedemption, Transaction, CommunityGroup,
)
from ..middleware import token_required, permission_required
from .. import db
from ._shared import _scope_location_id
from ..cache import cached_endpoint


analytics_bp = Blueprint('analytics', __name__, url_prefix='/analytics')


@analytics_bp.route('', methods=['GET'])
@token_required
@permission_required('analytics')
@cached_endpoint('analytics', ttl=120)
def get_analytics(current_user):
    """
    Comprehensive analytics data for the Analytics page.
    Returns multiple datasets: recycling trends, user growth, points economy,
    machine utilization, reward insights, peak hours, and location comparisons.
    """
    try:
        loc_id = _scope_location_id(current_user)
        now = datetime.now(timezone.utc)
        current_year = now.year

        # ── Date formatting (PostgreSQL only) ──
        def _fmt_ym(col):
            return func.to_char(col, 'YYYY-MM')
        def _fmt_ymd(col):
            return func.to_char(col, 'YYYY-MM-DD')
        def _fmt_dow(col):
            # Extract returns numeric, cast to integer to avoid decimal strings like "0.0"
            return func.extract('dow', col).cast(db.Integer)
        def _fmt_hour(col):
            return func.to_char(col, 'HH24')
        def _fmt_year(col):
            return func.to_char(col, 'YYYY')
        def _fmt_date(col):
            return func.cast(col, db.Date)

        # ──────────────────────────────────────────────────────
        # 1. RECYCLING TRENDS  (monthly bottles for last 12 months)
        # ──────────────────────────────────────────────────────
        items_query = db.session.query(
            _fmt_ym(RecyclingItem.scanned_at).label('month'),
            func.count(RecyclingItem.id).label('total'),
            func.sum(db.case(
                (RecyclingItem.status == 'Accepted', 1),
                else_=0
            )).label('accepted'),
            func.sum(db.case(
                (RecyclingItem.status == 'Rejected', 1),
                else_=0
            )).label('rejected'),
            func.coalesce(func.sum(RecyclingItem.points_awarded), 0).label('points'),
        ).join(RecyclingSession)
        if loc_id:
            items_query = items_query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        recycling_trends = items_query.group_by('month').order_by('month').all()

        # Weekly recycling trends (daily for last 7 days)
        today = datetime.now(timezone.utc).date()
        # Find Monday of this week
        days_since_monday = today.weekday()  # 0=Mon
        week_start = today - timedelta(days=days_since_monday)
        daily_items_query = db.session.query(
            _fmt_dow(RecyclingItem.scanned_at).label('dow'),  # 0=Sun
            _fmt_ymd(RecyclingItem.scanned_at).label('day'),
            func.count(RecyclingItem.id).label('total'),
            func.sum(db.case(
                (RecyclingItem.status == 'Accepted', 1),
                else_=0
            )).label('accepted'),
            func.sum(db.case(
                (RecyclingItem.status == 'Rejected', 1),
                else_=0
            )).label('rejected'),
        ).join(RecyclingSession).filter(
            _fmt_date(RecyclingItem.scanned_at) >= week_start,
            _fmt_date(RecyclingItem.scanned_at) <= today,
        )
        if loc_id:
            daily_items_query = daily_items_query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        
        # PostgreSQL requires all non-aggregated columns in the SELECT to be in GROUP BY
        daily_trends = daily_items_query.group_by('day', 'dow').order_by('day').all()

        # ──────────────────────────────────────────────────────
        # 2. USER GROWTH  (monthly new registrations, all years)
        # ──────────────────────────────────────────────────────
        user_base_query = db.session.query(
            _fmt_ym(User.created_at).label('month'),
            func.count(User.id).label('count'),
        ).join(CommunityGroup, User.community_group_id == CommunityGroup.id)
        if loc_id:
            user_base_query = user_base_query.filter(CommunityGroup.organization_id == loc_id)
        user_growth = user_base_query.group_by('month').order_by('month').all()

        # Cumulative user count up to start of current year (baseline)
        baseline_query = db.session.query(func.count(User.id)).join(CommunityGroup, User.community_group_id == CommunityGroup.id)
        if loc_id:
            baseline_query = baseline_query.filter(CommunityGroup.organization_id == loc_id)
        baseline_users = baseline_query.filter(
            User.created_at < datetime(current_year, 1, 1, tzinfo=timezone.utc)
        ).scalar() or 0

        # ──────────────────────────────────────────────────────
        # 3. POINTS ECONOMY  (earn vs redeem per month, all years)
        # ──────────────────────────────────────────────────────
        txn_base = db.session.query(
            _fmt_ym(Transaction.created_at).label('month'),
            Transaction.transaction_type,
            func.sum(func.abs(Transaction.amount)).label('total_amount'),
        ).join(Wallet, Transaction.wallet_id == Wallet.id)
        if loc_id:
            txn_base = txn_base.join(User, Wallet.user_id == User.id)\
                .join(CommunityGroup, User.community_group_id == CommunityGroup.id).filter(
                CommunityGroup.organization_id == loc_id
            )
        points_economy = txn_base.group_by('month', Transaction.transaction_type).order_by('month').all()

        # ──────────────────────────────────────────────────────
        # 4. MACHINE UTILIZATION  (items per machine, all time)
        # ──────────────────────────────────────────────────────
        machine_util_base = db.session.query(
            RVM.name,
            RVM.is_online,
            RVM.organization_id,
            Organization.name.label('org_name'),
            func.count(RecyclingItem.id).label('item_count'),
            func.count(RecyclingSession.id.distinct()).label('session_count'),
        ).join(Organization, RVM.organization_id == Organization.id
        ).outerjoin(RecyclingSession, RVM.id == RecyclingSession.rvm_id
        ).outerjoin(RecyclingItem, RecyclingSession.id == RecyclingItem.session_id)
        if loc_id:
            machine_util_base = machine_util_base.filter(RVM.organization_id == loc_id)
        
        # Grouping by RVM.id allows selecting RVM columns, but Organization columns must be listed
        machine_utilization = machine_util_base.group_by(RVM.id, Organization.id).all()

        # ──────────────────────────────────────────────────────
        # 5. REWARD INSIGHTS  (top redeemed rewards)
        # ──────────────────────────────────────────────────────
        reward_base = db.session.query(
            Reward.name,
            Reward.points_required,
            func.count(RewardRedemption.id).label('redemption_count'),
            func.coalesce(func.sum(RewardRedemption.points_spent), 0).label('total_points_spent'),
        ).outerjoin(RewardVariant, Reward.id == RewardVariant.reward_id
        ).outerjoin(RewardRedemption, RewardVariant.id == RewardRedemption.variant_id)
        if loc_id:
            reward_base = reward_base.filter(Reward.organization_id == loc_id)
        reward_insights = reward_base.group_by(Reward.id).order_by(
            func.count(RewardRedemption.id).desc()
        ).limit(10).all()

        # ──────────────────────────────────────────────────────
        # 6. PEAK HOURS  (bottles by hour of day, all time)
        # ──────────────────────────────────────────────────────
        peak_base = db.session.query(
            _fmt_hour(RecyclingItem.scanned_at).label('hour'),
            func.count(RecyclingItem.id).label('count'),
        ).join(RecyclingSession)
        if loc_id:
            peak_base = peak_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        peak_hours = peak_base.group_by('hour').order_by('hour').all()

        # ──────────────────────────────────────────────────────
        # 7. PEAK DAYS OF WEEK  (bottles by day, all time)
        # ──────────────────────────────────────────────────────
        peak_day_base = db.session.query(
            _fmt_dow(RecyclingItem.scanned_at).label('dow'),  # 0=Sun
            func.count(RecyclingItem.id).label('count'),
        ).join(RecyclingSession)
        if loc_id:
            peak_day_base = peak_day_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        peak_days = peak_day_base.group_by('dow').order_by('dow').all()

        # ──────────────────────────────────────────────────────
        # 8. USER TYPE DISTRIBUTION  (student/faculty/staff)
        # ──────────────────────────────────────────────────────
        utype_base = db.session.query(
            User.user_type,
            func.count(User.id).label('count'),
        ).join(CommunityGroup, User.community_group_id == CommunityGroup.id).filter(User.role == 'user')
        if loc_id:
            utype_base = utype_base.filter(CommunityGroup.organization_id == loc_id)
        user_type_dist = utype_base.group_by(User.user_type).all()

        # ──────────────────────────────────────────────────────
        # 9. LOCATION COMPARISON  (per-org totals — superadmin only)
        # ──────────────────────────────────────────────────────
        # Phase 3 task 8.2 (alignment-doc §1.k): the `orgType` field is
        # required by the page's filter row. We pull it via an outer
        # join on `OrgType` so organizations without a type still
        # appear in the response (with `orgType=null`).
        from ..models import OrgType  # local import keeps top of file clean
        location_comparison = []
        if not loc_id:
            loc_comp = db.session.query(
                Organization.name,
                OrgType.name.label('org_type'),
                func.count(RecyclingItem.id.distinct()).label('bottles'),
                func.coalesce(func.sum(RecyclingItem.points_awarded), 0).label('points'),
                func.count(User.id.distinct()).label('users'),
            ).outerjoin(OrgType, Organization.type_id == OrgType.id
            ).outerjoin(RVM, Organization.id == RVM.organization_id
            ).outerjoin(RecyclingSession, RVM.id == RecyclingSession.rvm_id
            ).outerjoin(RecyclingItem, RecyclingSession.id == RecyclingItem.session_id
            ).outerjoin(CommunityGroup, Organization.id == CommunityGroup.organization_id
            ).outerjoin(User, CommunityGroup.id == User.community_group_id
            ).group_by(Organization.id, OrgType.name).all()
            location_comparison = [{
                'name': row.name,
                'orgType': row.org_type,
                'bottles': row.bottles,
                'points': row.points,
                'users': row.users,
            } for row in loc_comp]

        # ──────────────────────────────────────────────────────
        # 10. ITEM STATUS BREAKDOWN  (Accepted / Rejected)
        # ──────────────────────────────────────────────────────
        cond_base = db.session.query(
            RecyclingItem.status,
            func.count(RecyclingItem.id).label('count'),
        ).join(RecyclingSession)
        if loc_id:
            cond_base = cond_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        condition_dist = cond_base.group_by(RecyclingItem.status).all()

        # ──────────────────────────────────────────────────────
        # 11. SUMMARY TOTALS  (key metrics for stat cards)
        # ──────────────────────────────────────────────────────
        total_items_base = db.session.query(func.count(RecyclingItem.id)).join(RecyclingSession)
        total_points_base = db.session.query(func.coalesce(func.sum(RecyclingItem.points_awarded), 0)).join(RecyclingSession)
        total_sessions_base = db.session.query(func.count(RecyclingSession.id))
        total_redemptions_base = db.session.query(func.count(RewardRedemption.id))
        total_users_base = db.session.query(func.count(User.id)).join(CommunityGroup)

        if loc_id:
            total_items_base = total_items_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_points_base = total_points_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_sessions_base = total_sessions_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_redemptions_base = total_redemptions_base.join(RewardVariant).join(Reward).filter(Reward.organization_id == loc_id)
            total_users_base = total_users_base.filter(CommunityGroup.organization_id == loc_id)

        total_items = total_items_base.scalar() or 0
        total_points = total_points_base.scalar() or 0
        total_sessions = total_sessions_base.scalar() or 0
        total_redemptions = total_redemptions_base.scalar() or 0
        total_users = total_users_base.scalar() or 0

        # Average points per session
        avg_points_per_session = round(total_points / total_sessions, 1) if total_sessions > 0 else 0
        # Average items per session
        avg_items_per_session = round(total_items / total_sessions, 1) if total_sessions > 0 else 0

        # ──────────────────────────────────────────────────────
        # BUILD RESPONSE
        # ──────────────────────────────────────────────────────
        day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

        return jsonify({
            'success': True,
            'analytics': {
                # 1. Recycling trends (monthly)
                'recyclingTrends': [{
                    'month': row.month,
                    'total': row.total,
                    'accepted': int(row.accepted or 0),
                    'rejected': int(row.rejected or 0),
                    'points': int(row.points or 0),
                } for row in recycling_trends],

                # 1b. Daily recycling trends (current week)
                'dailyTrends': [{
                    'day': row.day,
                    'dow': int(row.dow),
                    'total': row.total,
                    'accepted': int(row.accepted or 0),
                    'rejected': int(row.rejected or 0),
                } for row in daily_trends],

                # 2. User growth (monthly, current year)
                'userGrowth': {
                    'baseline': baseline_users,
                    'months': [{
                        'month': row.month,
                        'count': row.count,
                    } for row in user_growth],
                },

                # 3. Points economy (earn vs redeem)
                'pointsEconomy': [{
                    'month': row.month,
                    'type': row.transaction_type,
                    'amount': row.total_amount,
                } for row in points_economy],

                # 4. Machine utilization
                'machineUtilization': [{
                    'name': row.name,
                    'isOnline': row.is_online,
                    'itemCount': row.item_count,
                    'sessionCount': row.session_count,
                    'organizationId': row.organization_id,
                    'organizationName': row.org_name,
                } for row in machine_utilization],

                # 5. Top rewards
                'rewardInsights': [{
                    'name': row.name,
                    'pointsRequired': row.points_required,
                    'redemptionCount': row.redemption_count,
                    'totalPointsSpent': row.total_points_spent,
                } for row in reward_insights],

                # 6. Peak hours (0-23)
                'peakHours': [{
                    'hour': int(row.hour),
                    'count': row.count,
                } for row in peak_hours],

                # 7. Peak days of week
                'peakDays': [{
                    'day': day_names[int(row.dow)],
                    'dayIndex': int(row.dow),
                    'count': row.count,
                } for row in peak_days],

                # 8. User type distribution
                'userTypeDistribution': [{
                    'type': row.user_type or 'Unknown',
                    'count': row.count,
                } for row in user_type_dist],

                # 9. Location comparison (superadmin only)
                'locationComparison': location_comparison,

                # 10. Item status breakdown
                'conditionDistribution': [{
                    'condition': row.status or 'Unknown',
                    'count': row.count,
                } for row in condition_dist],

                # 11. Summary
                'summary': {
                    'totalItems': total_items,
                    'totalPoints': total_points,
                    'totalSessions': total_sessions,
                    'totalRedemptions': total_redemptions,
                    'totalUsers': total_users,
                    'avgPointsPerSession': avg_points_per_session,
                    'avgItemsPerSession': avg_items_per_session,
                },
            }
        }), 200
    except Exception as e:
        print(f"ANALYTICS ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': f'An internal error occurred: {str(e)}'}), 500
