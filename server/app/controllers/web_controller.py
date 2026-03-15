"""
Web Application Controller
Handles ALL API endpoints for the Next.js admin panel.
Every route (except /health) requires JWT authentication via @token_required.

Prefix: /api/web
"""
from datetime import datetime, date, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from ..models import (
    OrgType, City, Organization, CommunityGroup, Account, User, AccessCredential,
    RVM, RecyclingSession, RecyclingItem, MaintenanceLog,
    Transaction, Reward, RewardRedemption, AdminLog,
    NotificationSetting, NotificationLog,
)
from ..middleware import token_required, admin_required, superadmin_required, get_user_org_id
from ..services.notification_service import trigger_alert
from .. import db

web_bp = Blueprint('web', __name__, url_prefix='/api/web')


# ══════════════════════════════════════════════════════════════════════════
# SERIALIZERS  (model → camelCase dict for the frontend)
# ══════════════════════════════════════════════════════════════════════════

def _dt(val):
    """Safely format a datetime to ISO string."""
    return val.isoformat() if val else None


def _serialize_city(c):
    return {'id': c.id, 'name': c.name, 'province': c.province, 'region': c.region}


def _get_org_abbreviation(org):
    """Derive a short abbreviation from an organization name.

    e.g. 'Arellano University' → 'AU', 'Polytechnic University' → 'PU'
    Takes the first letter of each capitalized word.
    """
    if not org or not org.name:
        return 'SYS'
    words = [w for w in org.name.split() if w[0].isupper()]
    return ''.join(w[0] for w in words).upper() or 'ORG'


def _serialize_org_type(ot):
    return {'id': ot.id, 'name': ot.name}


def _serialize_organization(o):
    """Organization → frontend LOCATIONS[] shape."""
    machine_count = len(o.rvms) if o.rvms else 0
    user_count = 0
    total_bottles = 0
    total_points = 0
    for cg in (o.community_groups or []):
        for acc in (cg.accounts or []):
            user_count += len(acc.users) if acc.users else 0
            total_points += acc.points_balance or 0
    for rvm in (o.rvms or []):
        total_bottles += rvm.total_items_collected or 0

    return {
        'id': o.id,
        'name': o.name,
        'fullName': o.full_name,
        'orgType': o.org_type,
        'streetAddress': o.street_address,
        'barangay': o.barangay,
        'cityId': o.city_id,
        'cityName': o.city.name if o.city else None,
        'zipCode': o.zip_code,
        'contactPerson': o.contact_person,
        'contactEmail': o.contact_email,
        'contactPhone': o.contact_phone,
        'status': o.status,
        'joinDate': o.join_date.isoformat() if o.join_date else None,
        'createdAt': _dt(o.created_at),
        'machineCount': machine_count,
        'userCount': user_count,
        'totalBottlesCollected': total_bottles,
        'totalPoints': total_points,
    }


def _serialize_user(u):
    """User → frontend USERS[] / ADMIN_USERS[] shape."""
    org_id = None
    org_name = None
    group_name = None
    if u.account and u.account.community_group:
        cg = u.account.community_group
        org_id = cg.organization_id
        group_name = cg.abbreviation or cg.name
        if cg.organization:
            org_name = cg.organization.name

    return {
        'id': u.id,
        'displayId': u.display_id,
        'accountId': u.account_id,
        'name': u.name,
        'username': u.username,
        'email': u.email,
        'phone': u.phone,
        'role': u.role,
        'userType': u.user_type,
        'yearLevel': u.year_level,
        'isActive': u.is_active,
        'pointsBalance': u.account.points_balance if u.account else 0,
        'streak': u.account.streak if u.account else 0,
        'locationId': org_id,
        'locationName': org_name,
        'groupName': group_name,
        'lastLogin': _dt(u.last_login),
        'createdAt': _dt(u.created_at),
        'updatedAt': _dt(u.updated_at),
    }


def _serialize_rvm(m):
    """RVM → frontend MACHINES[] shape."""
    org_name = m.organization.name if m.organization else None
    return {
        'id': m.id,
        'machineUuid': m.machine_uuid,
        'name': m.name,
        'locationId': m.organization_id,
        'locationName': m.location_name,
        'orgName': org_name,
        'isOnline': m.is_online,
        'lastHeartbeat': _dt(m.last_heartbeat),
        'currentCapacity': m.current_capacity,
        'totalItemsCollected': m.total_items_collected,
        'createdAt': _dt(m.created_at),
    }


def _serialize_reward(r):
    """Reward → frontend REWARDS[] shape."""
    return {
        'id': r.id,
        'name': r.name,
        'description': r.description,
        'category': r.category,
        'pointsRequired': r.points_required,
        'stockQuantity': r.stock_quantity,
        'imageUrl': r.image_url,
        'isActive': r.is_active,
        'locationId': r.organization_id,
        'locationName': r.organization.name if r.organization else None,
        'createdAt': _dt(r.created_at),
    }


def _serialize_bottle_log(item):
    """RecyclingItem → frontend BOTTLE_LOGS[] shape."""
    session = item.session
    account = session.account if session else None
    rvm = session.rvm if session else None
    user = account.users[0] if (account and account.users) else None
    org = rvm.organization if rvm else None

    return {
        'id': item.id,
        'sessionId': item.session_id,
        'userId': user.id if user else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'locationId': rvm.organization_id if rvm else None,
        'locationName': org.name if org else 'Unknown',
        'machineId': rvm.id if rvm else None,
        'machineName': rvm.name if rvm else 'Unknown',
        'bottleType': item.item_type,
        'itemType': item.item_type,
        'material': item.material,
        'brand': item.brand,
        'volumeMl': item.volume_ml,
        'condition': item.condition,
        'weightGrams': item.weight_grams,
        'pointsAwarded': item.points_awarded,
        'timestamp': _dt(item.deposited_at),
        'depositedAt': _dt(item.deposited_at),
        'status': 'Accepted' if item.condition != 'Rejected' else 'Rejected',
        'sessionType': session.session_type if session else 'standard',
    }


def _serialize_machine_log(log):
    """MaintenanceLog → frontend MACHINE_LOGS[] shape."""
    org = log.rvm.organization if (log.rvm and log.rvm.organization) else None
    return {
        'id': log.id,
        'rvmId': log.rvm_id,
        'machineName': log.rvm.name if log.rvm else 'Unknown',
        'locationId': log.rvm.organization_id if log.rvm else None,
        'locationName': org.name if org else 'Unknown',
        'performedBy': log.performed_by.name if log.performed_by else 'Unknown',
        'performedById': log.performed_by_id,
        'actionType': log.action_type,
        'resolved': log.resolved,
        'notes': log.notes,
        'timestamp': _dt(log.timestamp),
    }


def _serialize_admin_log(log):
    """AdminLog → frontend ADMIN_LOGS[] shape."""
    admin = log.admin
    org_id = None
    org_name = None
    if admin and admin.account and admin.account.community_group:
        org_id = admin.account.community_group.organization_id
        if admin.account.community_group.organization:
            org_name = admin.account.community_group.organization.name

    return {
        'id': log.id,
        'adminUserId': log.admin_user_id,
        'adminName': admin.name if admin else 'Unknown',
        'adminRole': admin.role if admin else None,
        'action': log.action,
        'target': log.target,
        'category': log.category,
        'notes': log.notes,
        'timestamp': _dt(log.timestamp),
        'locationId': org_id,
        'locationName': org_name or 'Global',
    }


def _serialize_reward_log(rd):
    """RewardRedemption → frontend REWARDS_LOGS[] shape."""
    account = rd.account
    user = account.users[0] if (account and account.users) else None
    reward = rd.reward
    org_id = reward.organization_id if reward else None
    org = reward.organization if reward else None

    return {
        'id': rd.id,
        'accountId': rd.account_id,
        'rewardId': rd.reward_id,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'rewardName': reward.name if reward else 'Unknown',
        'pointsSpent': rd.points_spent,
        'status': rd.status,
        'redemptionCode': rd.redemption_code,
        'redeemedAt': _dt(rd.redeemed_at),
        'usedAt': _dt(rd.used_at),
        'locationId': org_id,
        'locationName': org.name if org else None,
    }


# ══════════════════════════════════════════════════════════════════════════
# HELPER: location scoping
# ══════════════════════════════════════════════════════════════════════════

def _scope_location_id(current_user):
    """Return the location_id to filter by.
    - Super admins: use ?location_id query param (or None = all).
    - Other admins: forced to their own org.
    """
    if current_user.role == 'superadmin':
        loc = request.args.get('location_id', type=int)
        return loc
    return get_user_org_id(current_user)


def _log_action(user, action, target=None, category=None, notes=None):
    """Write to admin_logs audit trail."""
    log = AdminLog(
        admin_user_id=user.id,
        action=action,
        target=target,
        category=category,
        notes=notes,
    )
    db.session.add(log)


def _paginate(query, default_limit=50, max_limit=200):
    """Apply pagination to a query. Reads ?page= and ?per_page= from request args.
    Returns (items, pagination_meta).
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', default_limit, type=int)
    per_page = min(per_page, max_limit)
    if page < 1:
        page = 1

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return items, {
        'page': page,
        'perPage': per_page,
        'total': total,
        'totalPages': (total + per_page - 1) // per_page,
    }


# ══════════════════════════════════════════════════════════════════════════
# HEALTH (public)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'success': True, 'message': 'Web API is running', 'status': 'healthy'}), 200


# ══════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@admin_required
def dashboard_stats(current_user):
    """Aggregated dashboard statistics, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)

        # --- User counts ---
        user_query = db.session.query(User).join(Account).join(CommunityGroup)
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


# ══════════════════════════════════════════════════════════════════════════
# ORG TYPES (lookup — superadmin managed)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/org-types', methods=['GET'])
@token_required
@admin_required
def get_org_types(current_user):
    """Return all organization types for dropdown selectors."""
    try:
        types = OrgType.query.order_by(OrgType.name).all()
        return jsonify({'success': True, 'orgTypes': [_serialize_org_type(t) for t in types]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/org-types', methods=['POST'])
@token_required
@superadmin_required
def create_org_type(current_user):
    """Create a new organization type (superadmin only)."""
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        existing = OrgType.query.filter(func.lower(OrgType.name) == name.lower()).first()
        if existing:
            return jsonify({'success': False, 'error': 'Organization type already exists'}), 409
        ot = OrgType(name=name)
        db.session.add(ot)
        db.session.commit()
        return jsonify({'success': True, 'orgType': _serialize_org_type(ot)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/org-types/<int:ot_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_org_type(current_user, ot_id):
    """Delete an organization type (superadmin only)."""
    try:
        ot = db.session.get(OrgType, ot_id)
        if not ot:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        # Prevent deletion if referenced by any organization
        ref_count = Organization.query.filter_by(org_type_id=ot_id).count()
        if ref_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {ref_count} organization(s) reference this type'}), 409
        db.session.delete(ot)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# CITIES (lookup — superadmin managed)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/cities', methods=['GET'])
@token_required
@admin_required
def get_cities(current_user):
    """Return all cities for dropdown selectors."""
    try:
        cities = City.query.order_by(City.name).all()
        return jsonify({'success': True, 'cities': [_serialize_city(c) for c in cities]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/cities', methods=['POST'])
@token_required
@superadmin_required
def create_city(current_user):
    """Create a new city (superadmin only)."""
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'City name is required'}), 400
        existing = City.query.filter(func.lower(City.name) == name.lower()).first()
        if existing:
            return jsonify({'success': False, 'error': 'City already exists'}), 409
        city = City(name=name, province=data.get('province'), region=data.get('region'))
        db.session.add(city)
        db.session.commit()
        return jsonify({'success': True, 'city': _serialize_city(city)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/cities/<int:city_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_city(current_user, city_id):
    """Delete a city (superadmin only)."""
    try:
        city = db.session.get(City, city_id)
        if not city:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        # Prevent deletion if referenced by any organization
        ref_count = Organization.query.filter_by(city_id=city_id).count()
        if ref_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {ref_count} organization(s) reference this city'}), 409
        db.session.delete(city)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# LOCATIONS (Organizations)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/locations', methods=['GET'])
@token_required
@admin_required
def get_locations(current_user):
    """List organizations. Superadmin sees all; others see only their own."""
    try:
        loc_id = _scope_location_id(current_user)
        query = Organization.query.options(
            joinedload(Organization.community_groups)
                .joinedload(CommunityGroup.accounts)
                .joinedload(Account.users),
            joinedload(Organization.rvms),
            joinedload(Organization.city),
        ).order_by(Organization.id.asc())
        if loc_id:
            query = query.filter_by(id=loc_id)
        orgs = query.all()
        return jsonify({'success': True, 'locations': [_serialize_organization(o) for o in orgs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/locations', methods=['POST'])
@token_required
@superadmin_required
def create_location(current_user):
    """Create a new organization (superadmin only)."""
    try:
        data = request.get_json() or {}
        org_type_name = data.get('orgType', 'University')
        # Resolve org_type_id from OrgType lookup table
        org_type_ref = OrgType.query.filter(func.lower(OrgType.name) == org_type_name.lower()).first() if org_type_name else None
        org = Organization(
            name=data.get('name'),
            full_name=data.get('fullName'),
            org_type=org_type_name,
            org_type_id=org_type_ref.id if org_type_ref else None,
            street_address=data.get('streetAddress'),
            barangay=data.get('barangay'),
            city_id=data.get('cityId') or None,
            zip_code=data.get('zipCode'),
            contact_person=data.get('contactPerson'),
            contact_email=data.get('contactEmail'),
            contact_phone=data.get('contactPhone'),
            status=data.get('status', 'Active'),
            join_date=date.today(),
        )
        db.session.add(org)
        db.session.flush()

        # Create default community groups for this org
        for gtype, gname, abbr in [('staff', 'Campus Staff', 'Staff')]:
            cg = CommunityGroup(organization_id=org.id, name=gname, abbreviation=abbr, group_type=gtype)
            db.session.add(cg)

        _log_action(current_user, 'Location Created', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'location': _serialize_organization(org)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/locations/<int:loc_id>', methods=['PUT'])
@token_required
@admin_required
def update_location(current_user, loc_id):
    """Update an organization."""
    try:
        org = db.session.get(Organization, loc_id)
        if not org:
            return jsonify({'success': False, 'error': 'Location not found'}), 404

        if current_user.role != 'superadmin' and get_user_org_id(current_user) != loc_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        for front, back in [
            ('name', 'name'), ('fullName', 'full_name'), ('orgType', 'org_type'),
            ('streetAddress', 'street_address'), ('barangay', 'barangay'),
            ('cityId', 'city_id'), ('zipCode', 'zip_code'),
            ('contactPerson', 'contact_person'), ('contactEmail', 'contact_email'),
            ('contactPhone', 'contact_phone'), ('status', 'status'),
        ]:
            if front in data:
                setattr(org, back, data[front] if data[front] != '' else None)

        # Sync org_type_id when org_type string changes
        if 'orgType' in data and data['orgType']:
            org_type_ref = OrgType.query.filter(func.lower(OrgType.name) == data['orgType'].lower()).first()
            org.org_type_id = org_type_ref.id if org_type_ref else None

        _log_action(current_user, 'Location Updated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'location': _serialize_organization(org)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/locations/<int:loc_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_location(current_user, loc_id):
    """Deactivate an organization. Superadmin only."""
    try:
        org = db.session.get(Organization, loc_id)
        if not org:
            return jsonify({'success': False, 'error': 'Location not found'}), 404

        org.status = 'Inactive'

        # Cascade: deactivate child RVMs, rewards, and users under this org
        for rvm in (org.rvms or []):
            rvm.is_online = False
        for reward in (org.rewards or []):
            reward.is_active = False
        for cg in (org.community_groups or []):
            for acc in (cg.accounts or []):
                for user in (acc.users or []):
                    user.is_active = False

        _log_action(current_user, 'Location Deactivated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{org.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    """List users. Supports filters: ?role=, ?user_type=, ?location_id=, ?is_admin=."""
    try:
        loc_id = _scope_location_id(current_user)
        query = db.session.query(User).join(Account).join(CommunityGroup)
        if loc_id:
            query = query.filter(CommunityGroup.organization_id == loc_id)

        role_filter = request.args.get('role')
        if role_filter:
            query = query.filter(User.role == role_filter)

        type_filter = request.args.get('user_type')
        if type_filter:
            query = query.filter(User.user_type == type_filter)

        is_admin_filter = request.args.get('is_admin')
        if is_admin_filter == 'true':
            query = query.filter(User.role.in_(['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician']))
        elif is_admin_filter == 'false':
            query = query.filter(User.role.in_(['user', 'dependent']))

        query = query.order_by(User.id.asc())
        users, pagination = _paginate(query)
        return jsonify({'success': True, 'users': [_serialize_user(u) for u in users], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(current_user, user_id):
    """Get a single user by ID."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        return jsonify({'success': True, 'user': _serialize_user(user)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/users', methods=['POST'])
@token_required
@admin_required
def create_user(current_user):
    """Create a new user (regular or admin).

    Body: { name, username?, email?, phone?, password, role, userType?, yearLevel?, locationId, groupId? }
    """
    try:
        data = request.get_json() or {}
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')

        # ── Role hierarchy guard: prevent privilege escalation ──
        from ..middleware import can_manage_role
        if not can_manage_role(current_user.role, role):
            return jsonify({'success': False, 'error': f'Your role ({current_user.role}) cannot create users with role "{role}"'}), 403

        location_id = data.get('locationId')

        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        if not password:
            return jsonify({'success': False, 'error': 'Password is required'}), 400

        if email and User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'error': 'Email already exists'}), 409

        username = data.get('username')
        if username and User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'error': 'Username already taken'}), 409

        if current_user.role != 'superadmin':
            location_id = get_user_org_id(current_user)

        if not location_id:
            return jsonify({'success': False, 'error': 'Location is required'}), 400

        group_id = data.get('groupId')
        if not group_id:
            default_group = CommunityGroup.query.filter_by(
                organization_id=location_id, group_type='staff'
            ).first()
            if not default_group:
                default_group = CommunityGroup.query.filter_by(organization_id=location_id).first()
            if not default_group:
                return jsonify({'success': False, 'error': 'No community group found for this location'}), 400
            group_id = default_group.id

        account = Account(
            community_group_id=group_id,
            account_name=name,
            points_balance=0,
        )
        db.session.add(account)
        db.session.flush()

        # Resolve org abbreviation for display_id
        org = db.session.get(Organization, location_id)
        org_abbr = _get_org_abbreviation(org) if org else 'SYS'

        user = User(
            account_id=account.id,
            name=name,
            username=username,
            email=email,
            phone=data.get('phone'),
            role=role,
            user_type=data.get('userType'),
            year_level=data.get('yearLevel'),
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Generate and assign display_id
        user.display_id = User.generate_display_id(role, org_abbr)

        _log_action(current_user, 'User Created', name, 'Users', f'Role: {role}')
        db.session.commit()

        # ── Notification hook: new user registered ──
        try:
            trigger_alert(location_id, 'new_user_registered',
                          f'New user registered: {name}',
                          f'A new {role} "{name}" was created by {current_user.name}.')
        except Exception:
            pass

        return jsonify({'success': True, 'user': _serialize_user(user)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user fields."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}

        # Uniqueness checks for email and username
        if 'email' in data and data['email']:
            existing = User.query.filter(User.email == data['email'], User.id != user_id).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already in use'}), 409
        if 'username' in data and data['username']:
            existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
            if existing:
                return jsonify({'success': False, 'error': 'Username already in use'}), 409

        # ── Role hierarchy guard: prevent privilege escalation ──
        from ..middleware import can_manage_role
        if 'role' in data and data['role'] != user.role:
            if not can_manage_role(current_user.role, data['role']):
                return jsonify({'success': False, 'error': f'Your role ({current_user.role}) cannot assign role "{data["role"]}"'}), 403

        for front, back in [
            ('name', 'name'), ('username', 'username'), ('email', 'email'),
            ('phone', 'phone'), ('role', 'role'), ('userType', 'user_type'),
            ('yearLevel', 'year_level'), ('isActive', 'is_active'),
        ]:
            if front in data:
                setattr(user, back, data[front])

        if 'password' in data and data['password']:
            user.set_password(data['password'])

        _log_action(current_user, 'User Updated', user.name, 'Users')
        db.session.commit()
        return jsonify({'success': True, 'user': _serialize_user(user)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Deactivate a user (soft delete)."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        user.is_active = False
        _log_action(current_user, 'User Deactivated', user.name, 'Users')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{user.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/users/<int:user_id>/adjust-points', methods=['POST'])
@token_required
@admin_required
def adjust_user_points(current_user, user_id):
    """Manually adjust a user's point balance (add or subtract)."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        amount = data.get('amount')
        reason = data.get('reason', 'Manual adjustment')

        if amount is None or not isinstance(amount, (int, float)):
            return jsonify({'success': False, 'error': 'Amount is required and must be a number'}), 400
        amount = int(amount)
        if amount == 0:
            return jsonify({'success': False, 'error': 'Amount cannot be zero'}), 400

        account = user.account
        if not account:
            return jsonify({'success': False, 'error': 'User has no account'}), 404

        balance_before = account.points_balance
        balance_after = balance_before + amount

        if balance_after < 0:
            return jsonify({'success': False, 'error': f'Insufficient balance. Current: {balance_before}, adjustment: {amount}'}), 400

        account.points_balance = balance_after

        txn = Transaction(
            account_id=account.id,
            transaction_type='adjustment',
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=reason,
            reference_id=f'ADJ-{user.id}-{current_user.id}',
        )
        db.session.add(txn)

        direction = 'added' if amount > 0 else 'deducted'
        _log_action(current_user, f'Points {direction.title()}',
                     f'{abs(amount)} pts {direction} for {user.name} (was {balance_before}, now {balance_after})',
                     'Users', notes=reason)
        db.session.commit()

        # ── Notification hook: suspicious large adjustment ──
        try:
            org_id = get_user_org_id(current_user)
            if org_id:
                setting = NotificationSetting.query.filter_by(
                    organization_id=org_id, alert_key='suspicious_activity', is_active=True
                ).first()
                threshold = (setting.threshold if setting else 500) or 500
                if abs(amount) >= threshold:
                    trigger_alert(org_id, 'suspicious_activity',
                                  f'Suspicious points adjustment: {abs(amount)} pts',
                                  f'{current_user.name} {direction} {abs(amount)} points for {user.name}. '
                                  f'Balance: {balance_before} → {balance_after}. Reason: {reason}')
        except Exception:
            pass

        return jsonify({
            'success': True,
            'message': f'{abs(amount)} points {direction} for {user.name}',
            'balanceBefore': balance_before,
            'balanceAfter': balance_after,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# MACHINES (RVMs)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/machines', methods=['GET'])
@token_required
@admin_required
def get_machines(current_user):
    """List RVMs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RVM.query
        if loc_id:
            query = query.filter_by(organization_id=loc_id)
        query = query.order_by(RVM.id.asc())
        machines, pagination = _paginate(query)
        return jsonify({'success': True, 'machines': [_serialize_rvm(m) for m in machines], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/machines', methods=['POST'])
@token_required
@admin_required
def create_machine(current_user):
    """Register a new RVM."""
    try:
        data = request.get_json() or {}
        import uuid as _uuid

        location_id = data.get('locationId')
        if current_user.role != 'superadmin':
            location_id = get_user_org_id(current_user)

        if not location_id:
            return jsonify({'success': False, 'error': 'Location is required'}), 400

        rvm = RVM(
            organization_id=location_id,
            machine_uuid=data.get('machineUuid') or str(_uuid.uuid4()),
            name=data.get('name'),
            location_name=data.get('locationName'),
            is_online=data.get('isOnline', False),
        )
        db.session.add(rvm)
        _log_action(current_user, 'Machine Registered', rvm.name, 'Machines')
        db.session.commit()
        return jsonify({'success': True, 'machine': _serialize_rvm(rvm)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/machines/<int:machine_id>', methods=['PUT'])
@token_required
@admin_required
def update_machine(current_user, machine_id):
    """Update an RVM."""
    try:
        rvm = db.session.get(RVM, machine_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        if current_user.role != 'superadmin' and rvm.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        for front, back in [
            ('name', 'name'), ('locationName', 'location_name'),
            ('isOnline', 'is_online'),
            ('currentCapacity', 'current_capacity'),
        ]:
            if front in data:
                setattr(rvm, back, data[front])

        _log_action(current_user, 'Machine Updated', rvm.name, 'Machines')
        db.session.commit()

        # ── Notification hook: machine offline ──
        try:
            if 'isOnline' in data and not data['isOnline']:
                trigger_alert(rvm.organization_id, 'machine_offline',
                              f'Machine offline: {rvm.name}',
                              f'The machine "{rvm.name}" has been marked offline.')
        except Exception:
            pass

        return jsonify({'success': True, 'machine': _serialize_rvm(rvm)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/machines/<int:machine_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_machine(current_user, machine_id):
    """Decommission an RVM."""
    try:
        rvm = db.session.get(RVM, machine_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        if current_user.role != 'superadmin' and rvm.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        rvm.is_online = False
        _log_action(current_user, 'Machine Decommissioned', rvm.name, 'Machines')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{rvm.name} decommissioned'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# REWARDS
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/rewards', methods=['GET'])
@token_required
@admin_required
def get_rewards(current_user):
    """List rewards, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = Reward.query
        if loc_id:
            query = query.filter_by(organization_id=loc_id)
        query = query.order_by(Reward.id.asc())
        rewards, pagination = _paginate(query)
        return jsonify({'success': True, 'rewards': [_serialize_reward(r) for r in rewards], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/rewards', methods=['POST'])
@token_required
@admin_required
def create_reward(current_user):
    """Create a new reward."""
    try:
        data = request.get_json() or {}
        location_id = data.get('locationId')
        if current_user.role != 'superadmin':
            location_id = get_user_org_id(current_user)

        if not location_id:
            return jsonify({'success': False, 'error': 'Location is required'}), 400

        reward = Reward(
            organization_id=location_id,
            name=data.get('name'),
            description=data.get('description'),
            category=data.get('category'),
            points_required=data.get('pointsRequired', 0),
            stock_quantity=data.get('stockQuantity'),
            image_url=data.get('imageUrl'),
            is_active=data.get('isActive', True),
        )
        db.session.add(reward)
        _log_action(current_user, 'Reward Created', reward.name, 'Rewards')
        db.session.commit()
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/rewards/<int:reward_id>', methods=['PUT'])
@token_required
@admin_required
def update_reward(current_user, reward_id):
    """Update a reward."""
    try:
        reward = db.session.get(Reward, reward_id)
        if not reward:
            return jsonify({'success': False, 'error': 'Reward not found'}), 404

        if current_user.role != 'superadmin' and reward.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        for front, back in [
            ('name', 'name'), ('description', 'description'), ('category', 'category'),
            ('pointsRequired', 'points_required'), ('stockQuantity', 'stock_quantity'),
            ('imageUrl', 'image_url'), ('isActive', 'is_active'),
        ]:
            if front in data:
                setattr(reward, back, data[front])

        _log_action(current_user, 'Reward Updated', reward.name, 'Rewards')
        db.session.commit()

        # ── Notification hooks: low / out-of-stock ──
        try:
            org_id = reward.organization_id
            if reward.stock_quantity is not None and reward.stock_quantity <= 0:
                trigger_alert(org_id, 'reward_out_of_stock',
                              f'Reward out of stock: {reward.name}',
                              f'The reward "{reward.name}" has 0 remaining stock.')
            elif reward.stock_quantity is not None:
                setting = NotificationSetting.query.filter_by(
                    organization_id=org_id, alert_key='low_reward_stock', is_active=True
                ).first()
                if setting and reward.stock_quantity <= (setting.threshold or 10):
                    trigger_alert(org_id, 'low_reward_stock',
                                  f'Low reward stock: {reward.name}',
                                  f'"{reward.name}" has only {reward.stock_quantity} left (threshold: {setting.threshold}).')
        except Exception:
            pass  # never break the main response

        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/rewards/<int:reward_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_reward(current_user, reward_id):
    """Deactivate a reward."""
    try:
        reward = db.session.get(Reward, reward_id)
        if not reward:
            return jsonify({'success': False, 'error': 'Reward not found'}), 404

        if current_user.role != 'superadmin' and reward.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        reward.is_active = False
        _log_action(current_user, 'Reward Deactivated', reward.name, 'Rewards')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{reward.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# LOGS (read-only)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/logs/bottles', methods=['GET'])
@token_required
@admin_required
def get_bottle_logs(current_user):
    """Recycling item logs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RecyclingItem.query.join(RecyclingSession).options(
            joinedload(RecyclingItem.session)
                .joinedload(RecyclingSession.account)
                .joinedload(Account.users),
            joinedload(RecyclingItem.session)
                .joinedload(RecyclingSession.rvm)
                .joinedload(RVM.organization),
        )
        if loc_id:
            query = query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        items = query.order_by(RecyclingItem.deposited_at.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_bottle_log(i) for i in items]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/machines', methods=['GET'])
@token_required
@admin_required
def get_machine_logs(current_user):
    """Maintenance logs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = MaintenanceLog.query.join(RVM)
        if loc_id:
            query = query.filter(RVM.organization_id == loc_id)
        logs = query.order_by(MaintenanceLog.timestamp.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_machine_log(l) for l in logs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/machines', methods=['POST'])
@token_required
@admin_required
def create_machine_log(current_user):
    """Create a new maintenance log entry."""
    try:
        data = request.get_json() or {}
        rvm_id = data.get('rvmId')
        action_type = data.get('actionType')

        if not rvm_id or not action_type:
            return jsonify({'success': False, 'error': 'rvmId and actionType are required'}), 400

        rvm = db.session.get(RVM, rvm_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        if current_user.role != 'superadmin':
            if rvm.organization_id != _scope_location_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        log = MaintenanceLog(
            rvm_id=rvm_id,
            performed_by_id=current_user.id,
            action_type=action_type,
            resolved=data.get('resolved', False),
            notes=data.get('notes', ''),
        )
        db.session.add(log)
        _log_action(current_user, 'Maintenance Log Created',
                     f'{action_type} on {rvm.name}', 'Machines')
        db.session.commit()

        # ── Notification hook: maintenance log created ──
        try:
            trigger_alert(rvm.organization_id, 'machine_maintenance_due',
                          f'Maintenance logged: {rvm.name}',
                          f'A new maintenance issue has been reported for "{rvm.name}": {action_type}')
        except Exception:
            pass

        return jsonify({'success': True, 'log': _serialize_machine_log(log)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/access', methods=['GET'])
@token_required
@admin_required
def get_access_logs(current_user):
    """Admin action logs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = AdminLog.query.join(User, AdminLog.admin_user_id == User.id)
        if loc_id:
            query = query.join(Account, User.account_id == Account.id)\
                         .join(CommunityGroup, Account.community_group_id == CommunityGroup.id)\
                         .filter(CommunityGroup.organization_id == loc_id)
        logs = query.order_by(AdminLog.timestamp.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_admin_log(l) for l in logs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/rewards', methods=['GET'])
@token_required
@admin_required
def get_reward_logs(current_user):
    """Reward redemption logs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RewardRedemption.query.join(Reward).options(
            joinedload(RewardRedemption.account)
                .joinedload(Account.users),
            joinedload(RewardRedemption.reward)
                .joinedload(Reward.organization),
        )
        if loc_id:
            query = query.filter(Reward.organization_id == loc_id)
        logs = query.order_by(RewardRedemption.redeemed_at.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_reward_log(r) for r in logs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/rewards/<int:redemption_id>', methods=['PUT'])
@token_required
@admin_required
def update_reward_redemption(current_user, redemption_id):
    """Update a reward redemption status (pending→claimed→used→expired)."""
    try:
        rd = db.session.get(RewardRedemption, redemption_id)
        if not rd:
            return jsonify({'success': False, 'error': 'Redemption not found'}), 404

        # ── Org scope check ──
        if current_user.role != 'superadmin' and rd.reward:
            if rd.reward.organization_id != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        new_status = data.get('status')
        valid_statuses = ('pending', 'claimed', 'used', 'expired')
        if new_status not in valid_statuses:
            return jsonify({'success': False, 'error': f'Invalid status. Must be one of {valid_statuses}'}), 400

        old_status = rd.status
        rd.status = new_status
        if new_status == 'used' and not rd.used_at:
            rd.used_at = datetime.now(timezone.utc)

        _log_action(current_user, 'Redemption Status Updated',
                     f'{rd.redemption_code}: {old_status} → {new_status}', 'Rewards')
        db.session.commit()

        # ── Notification hook: new redemption ──
        try:
            if new_status == 'claimed' and old_status == 'pending':
                reward_name = rd.reward.name if rd.reward else 'Unknown'
                org_id = rd.reward.organization_id if rd.reward else None
                if org_id:
                    trigger_alert(org_id, 'new_redemption',
                                  f'Reward redeemed: {reward_name}',
                                  f'Redemption {rd.redemption_code} for "{reward_name}" was claimed.')
        except Exception:
            pass

        return jsonify({'success': True, 'log': _serialize_reward_log(rd)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/logs/transactions', methods=['GET'])
@token_required
@admin_required
def get_transaction_logs(current_user):
    """Transaction logs (earn/redeem/adjustment), scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = db.session.query(Transaction, Account, User).join(
            Account, Transaction.account_id == Account.id
        ).outerjoin(
            User, User.account_id == Account.id
        ).join(
            CommunityGroup, Account.community_group_id == CommunityGroup.id
        ).join(
            Organization, CommunityGroup.organization_id == Organization.id
        )
        if loc_id:
            query = query.filter(Organization.id == loc_id)
        rows = query.order_by(Transaction.created_at.desc()).limit(500).all()
        result = []
        for txn, acct, user in rows:
            org_name = None
            if acct.community_group and acct.community_group.organization:
                org_name = acct.community_group.organization.name
            result.append({
                'id': txn.id,
                'accountId': txn.account_id,
                'userName': user.name if user else acct.account_name,
                'userEmail': user.email if user else None,
                'transactionType': txn.transaction_type,
                'amount': txn.amount,
                'balanceBefore': txn.balance_before,
                'balanceAfter': txn.balance_after,
                'description': txn.description,
                'referenceId': txn.reference_id,
                'locationId': acct.community_group.organization_id if acct.community_group else None,
                'locationName': org_name,
                'timestamp': _dt(txn.created_at),
            })
        return jsonify({'success': True, 'logs': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# LEADERBOARD
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/leaderboard', methods=['GET'])
@token_required
@admin_required
def get_leaderboard(current_user):
    """Return leaderboard data: top users and top groups."""
    try:
        loc_id = _scope_location_id(current_user)

        # Subquery: bottles collected per account
        bottle_sub = db.session.query(
            RecyclingSession.account_id,
            func.coalesce(func.sum(RecyclingSession.item_count), 0).label('bottles')
        ).group_by(RecyclingSession.account_id).subquery()

        user_query = db.session.query(
            User, Account.points_balance, Account.streak,
            func.coalesce(bottle_sub.c.bottles, 0).label('bottles_collected'),
            CommunityGroup.abbreviation.label('group_abbr'),
            CommunityGroup.name.label('group_name'),
            CommunityGroup.group_type,
            CommunityGroup.organization_id,
            Organization.name.label('org_name'),
        ).select_from(User)\
         .join(Account, Account.id == User.account_id)\
         .join(CommunityGroup, CommunityGroup.id == Account.community_group_id)\
         .join(Organization, Organization.id == CommunityGroup.organization_id)\
         .outerjoin(bottle_sub, bottle_sub.c.account_id == Account.id)

        if loc_id:
            user_query = user_query.filter(CommunityGroup.organization_id == loc_id)
        top_users = user_query.filter(User.role == 'user')\
            .order_by(Account.points_balance.desc()).all()

        users_list = []
        for row in top_users:
            u = row.User if hasattr(row, 'User') else row[0]
            users_list.append({
                'id': u.id,
                'name': u.name,
                'points': row.points_balance or 0,
                'streak': row.streak or 0,
                'bottlesCollected': row.bottles_collected or 0,
                'userType': u.user_type,
                'yearLevel': u.year_level,
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
            func.coalesce(func.sum(Account.points_balance), 0).label('total_points'),
            func.count(Account.id).label('member_count'),
        ).select_from(CommunityGroup)\
         .join(Account, Account.community_group_id == CommunityGroup.id)\
         .group_by(CommunityGroup.id)

        if loc_id:
            group_query = group_query.filter(CommunityGroup.organization_id == loc_id)

        top_groups = group_query.order_by(func.sum(Account.points_balance).desc()).all()

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


# ══════════════════════════════════════════════════════════════════════════
# COMMUNITY GROUPS (for dropdowns)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/groups', methods=['GET'])
@token_required
@admin_required
def get_groups(current_user):
    """List community groups for a location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = CommunityGroup.query
        if loc_id:
            query = query.filter_by(organization_id=loc_id)
        groups = query.order_by(CommunityGroup.group_type, CommunityGroup.name).all()
        result = [{
            'id': g.id,
            'name': g.name,
            'abbreviation': g.abbreviation,
            'groupType': g.group_type,
            'organizationId': g.organization_id,
        } for g in groups]
        return jsonify({'success': True, 'groups': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/groups', methods=['POST'])
@token_required
@admin_required
def create_group(current_user):
    """Create a new community group.

    Body: { name, abbreviation?, groupType, organizationId? }
    """
    try:
        data = request.get_json() or {}
        name = (data.get('name') or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Group name is required'}), 400

        group_type = data.get('groupType', 'college')
        org_id = data.get('organizationId')

        if current_user.role != 'superadmin':
            org_id = get_user_org_id(current_user)

        if not org_id:
            return jsonify({'success': False, 'error': 'Organization is required'}), 400

        # Check for duplicate name within the same org
        existing = CommunityGroup.query.filter_by(
            organization_id=org_id, name=name
        ).first()
        if existing:
            return jsonify({'success': False, 'error': 'A group with this name already exists in this organization'}), 409

        group = CommunityGroup(
            organization_id=org_id,
            name=name,
            abbreviation=(data.get('abbreviation') or '').strip() or None,
            group_type=group_type,
        )
        db.session.add(group)
        _log_action(current_user, 'Group Created', name, 'Groups')
        db.session.commit()
        return jsonify({'success': True, 'group': {
            'id': group.id,
            'name': group.name,
            'abbreviation': group.abbreviation,
            'groupType': group.group_type,
            'organizationId': group.organization_id,
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/groups/<int:group_id>', methods=['PUT'])
@token_required
@admin_required
def update_group(current_user, group_id):
    """Update a community group."""
    try:
        group = db.session.get(CommunityGroup, group_id)
        if not group:
            return jsonify({'success': False, 'error': 'Group not found'}), 404

        if current_user.role != 'superadmin' and group.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
        if 'name' in data:
            group.name = (data['name'] or '').strip()
        if 'abbreviation' in data:
            group.abbreviation = (data['abbreviation'] or '').strip() or None
        if 'groupType' in data:
            group.group_type = data['groupType']

        _log_action(current_user, 'Group Updated', group.name, 'Groups')
        db.session.commit()
        return jsonify({'success': True, 'group': {
            'id': group.id,
            'name': group.name,
            'abbreviation': group.abbreviation,
            'groupType': group.group_type,
            'organizationId': group.organization_id,
        }}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/groups/<int:group_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_group(current_user, group_id):
    """Delete a community group. Prevents deletion if it has accounts."""
    try:
        group = db.session.get(CommunityGroup, group_id)
        if not group:
            return jsonify({'success': False, 'error': 'Group not found'}), 404

        if current_user.role != 'superadmin' and group.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        # Prevent deletion if referenced by any accounts
        acc_count = Account.query.filter_by(community_group_id=group_id).count()
        if acc_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {acc_count} account(s) belong to this group'}), 409

        _log_action(current_user, 'Group Deleted', group.name, 'Groups')
        db.session.delete(group)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Group deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# ANALYTICS  (comprehensive insights)
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/analytics', methods=['GET'])
@token_required
@admin_required
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

        # ── Database-agnostic date formatting ──
        dialect = db.engine.dialect.name  # 'sqlite' or 'postgresql'
        if dialect == 'sqlite':
            def _fmt_ym(col):
                return func.strftime('%Y-%m', col)
            def _fmt_ymd(col):
                return func.strftime('%Y-%m-%d', col)
            def _fmt_dow(col):
                return func.strftime('%w', col)
            def _fmt_hour(col):
                return func.strftime('%H', col)
            def _fmt_year(col):
                return func.strftime('%Y', col)
            def _fmt_date(col):
                return func.date(col)
        else:
            def _fmt_ym(col):
                return func.to_char(col, 'YYYY-MM')
            def _fmt_ymd(col):
                return func.to_char(col, 'YYYY-MM-DD')
            def _fmt_dow(col):
                return func.extract('dow', col).cast(db.String)
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
            _fmt_ym(RecyclingItem.deposited_at).label('month'),
            func.count(RecyclingItem.id).label('total'),
            func.sum(db.case(
                (RecyclingItem.condition != 'Rejected', 1),
                else_=0
            )).label('accepted'),
            func.sum(db.case(
                (RecyclingItem.condition == 'Rejected', 1),
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
            _fmt_dow(RecyclingItem.deposited_at).label('dow'),  # 0=Sun
            _fmt_ymd(RecyclingItem.deposited_at).label('day'),
            func.count(RecyclingItem.id).label('total'),
            func.sum(db.case(
                (RecyclingItem.condition != 'Rejected', 1),
                else_=0
            )).label('accepted'),
            func.sum(db.case(
                (RecyclingItem.condition == 'Rejected', 1),
                else_=0
            )).label('rejected'),
        ).join(RecyclingSession).filter(
            _fmt_date(RecyclingItem.deposited_at) >= week_start.isoformat(),
            _fmt_date(RecyclingItem.deposited_at) <= today.isoformat(),
        )
        if loc_id:
            daily_items_query = daily_items_query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        daily_trends = daily_items_query.group_by('day').order_by('day').all()

        # ──────────────────────────────────────────────────────
        # 2. USER GROWTH  (monthly new registrations, all years)
        # ──────────────────────────────────────────────────────
        user_base_query = db.session.query(
            _fmt_ym(User.created_at).label('month'),
            func.count(User.id).label('count'),
        ).join(Account).join(CommunityGroup)
        if loc_id:
            user_base_query = user_base_query.filter(CommunityGroup.organization_id == loc_id)
        user_growth = user_base_query.group_by('month').order_by('month').all()

        # Cumulative user count up to start of current year (baseline)
        baseline_query = db.session.query(func.count(User.id)).join(Account).join(CommunityGroup)
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
        ).join(Account)
        if loc_id:
            txn_base = txn_base.join(CommunityGroup, Account.community_group_id == CommunityGroup.id).filter(
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
        machine_utilization = machine_util_base.group_by(RVM.id).all()

        # ──────────────────────────────────────────────────────
        # 5. REWARD INSIGHTS  (top redeemed rewards)
        # ──────────────────────────────────────────────────────
        reward_base = db.session.query(
            Reward.name,
            Reward.points_required,
            func.count(RewardRedemption.id).label('redemption_count'),
            func.coalesce(func.sum(RewardRedemption.points_spent), 0).label('total_points_spent'),
        ).outerjoin(RewardRedemption, Reward.id == RewardRedemption.reward_id)
        if loc_id:
            reward_base = reward_base.filter(Reward.organization_id == loc_id)
        reward_insights = reward_base.group_by(Reward.id).order_by(
            func.count(RewardRedemption.id).desc()
        ).limit(10).all()

        # ──────────────────────────────────────────────────────
        # 6. PEAK HOURS  (bottles by hour of day, all time)
        # ──────────────────────────────────────────────────────
        peak_base = db.session.query(
            _fmt_hour(RecyclingItem.deposited_at).label('hour'),
            func.count(RecyclingItem.id).label('count'),
        ).join(RecyclingSession)
        if loc_id:
            peak_base = peak_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        peak_hours = peak_base.group_by('hour').order_by('hour').all()

        # ──────────────────────────────────────────────────────
        # 7. PEAK DAYS OF WEEK  (bottles by day, all time)
        # ──────────────────────────────────────────────────────
        peak_day_base = db.session.query(
            _fmt_dow(RecyclingItem.deposited_at).label('dow'),  # 0=Sun
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
        ).join(Account).join(CommunityGroup).filter(User.role == 'user')
        if loc_id:
            utype_base = utype_base.filter(CommunityGroup.organization_id == loc_id)
        user_type_dist = utype_base.group_by(User.user_type).all()

        # ──────────────────────────────────────────────────────
        # 9. LOCATION COMPARISON  (per-org totals — superadmin only)
        # ──────────────────────────────────────────────────────
        location_comparison = []
        if not loc_id:
            loc_comp = db.session.query(
                Organization.name,
                Organization.org_type,
                func.count(RecyclingItem.id.distinct()).label('bottles'),
                func.coalesce(func.sum(RecyclingItem.points_awarded), 0).label('points'),
                func.count(User.id.distinct()).label('users'),
            ).outerjoin(RVM, Organization.id == RVM.organization_id
            ).outerjoin(RecyclingSession, RVM.id == RecyclingSession.rvm_id
            ).outerjoin(RecyclingItem, RecyclingSession.id == RecyclingItem.session_id
            ).outerjoin(CommunityGroup, Organization.id == CommunityGroup.organization_id
            ).outerjoin(Account, CommunityGroup.id == Account.community_group_id
            ).outerjoin(User, Account.id == User.account_id
            ).group_by(Organization.id).all()
            location_comparison = [{
                'name': row.name,
                'orgType': row.org_type,
                'bottles': row.bottles,
                'points': row.points,
                'users': row.users,
            } for row in loc_comp]

        # ──────────────────────────────────────────────────────
        # 10. BOTTLE CONDITION BREAKDOWN  (With Label / No Label / Rejected)
        # ──────────────────────────────────────────────────────
        cond_base = db.session.query(
            RecyclingItem.condition,
            func.count(RecyclingItem.id).label('count'),
        ).join(RecyclingSession)
        if loc_id:
            cond_base = cond_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        condition_dist = cond_base.group_by(RecyclingItem.condition).all()

        # ──────────────────────────────────────────────────────
        # 11. SUMMARY TOTALS  (key metrics for stat cards)
        # ──────────────────────────────────────────────────────
        total_items_base = db.session.query(func.count(RecyclingItem.id)).join(RecyclingSession)
        total_points_base = db.session.query(func.coalesce(func.sum(RecyclingItem.points_awarded), 0)).join(RecyclingSession)
        total_sessions_base = db.session.query(func.count(RecyclingSession.id))
        total_redemptions_base = db.session.query(func.count(RewardRedemption.id))
        total_users_base = db.session.query(func.count(User.id)).join(Account).join(CommunityGroup)

        if loc_id:
            total_items_base = total_items_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_points_base = total_points_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_sessions_base = total_sessions_base.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
            total_redemptions_base = total_redemptions_base.join(Reward).filter(Reward.organization_id == loc_id)
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
                    'accepted': row.accepted,
                    'rejected': row.rejected,
                    'points': row.points,
                } for row in recycling_trends],

                # 1b. Daily recycling trends (current week)
                'dailyTrends': [{
                    'day': row.day,
                    'dow': int(row.dow),
                    'total': row.total,
                    'accepted': row.accepted,
                    'rejected': row.rejected,
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

                # 10. Bottle condition breakdown
                'conditionDistribution': [{
                    'condition': row.condition or 'Unknown',
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
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: NOTIFICATIONS
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/settings/notifications', methods=['GET'])
@token_required
@admin_required
def get_notification_settings(current_user):
    """Get all notification settings for the current org, creating defaults if needed."""
    try:
        import json as _json
        from ..services.notification_service import get_alert_types, ensure_default_settings

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        ensure_default_settings(loc_id)

        settings = NotificationSetting.query.filter_by(
            organization_id=loc_id
        ).order_by(NotificationSetting.alert_key).all()

        alert_types = get_alert_types()
        result = []
        for s in settings:
            info = alert_types.get(s.alert_key, {})
            try:
                recipients = _json.loads(s.recipients_json or '[]')
            except (_json.JSONDecodeError, TypeError):
                recipients = []
            result.append({
                'id': s.id,
                'alertKey': s.alert_key,
                'label': info.get('label', s.alert_key),
                'description': info.get('description', ''),
                'category': info.get('category', 'general'),
                'emailEnabled': s.email_enabled,
                'smsEnabled': s.sms_enabled,
                'threshold': s.threshold,
                'recipients': recipients,
                'isActive': s.is_active,
            })

        return jsonify({'success': True, 'settings': result, 'alertTypes': alert_types}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/notifications', methods=['PUT'])
@token_required
@admin_required
def update_notification_settings(current_user):
    """Batch-update notification settings for the current org.

    Body: { settings: [{ alertKey, emailEnabled, smsEnabled, threshold, recipients, isActive }] }
    """
    try:
        import json as _json

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        data = request.get_json() or {}
        updates = data.get('settings', [])

        for item in updates:
            alert_key = item.get('alertKey')
            if not alert_key:
                continue
            setting = NotificationSetting.query.filter_by(
                organization_id=loc_id, alert_key=alert_key
            ).first()
            if not setting:
                continue

            if 'emailEnabled' in item:
                setting.email_enabled = bool(item['emailEnabled'])
            if 'smsEnabled' in item:
                setting.sms_enabled = bool(item['smsEnabled'])
            if 'threshold' in item:
                setting.threshold = item['threshold']
            if 'recipients' in item:
                setting.recipients_json = _json.dumps(item['recipients'])
            if 'isActive' in item:
                setting.is_active = bool(item['isActive'])

        _log_action(current_user, 'Notification Settings Updated', f'{len(updates)} alert(s)', 'Settings')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{len(updates)} notification setting(s) updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/notifications/test', methods=['POST'])
@token_required
@admin_required
def test_notification(current_user):
    """Send a test notification.

    Body: { channel: "email"|"sms", recipient: "..." }
    """
    try:
        from ..services.notification_service import _send_email, _send_sms

        data = request.get_json() or {}
        channel = data.get('channel', 'email')
        recipient = data.get('recipient', '')

        if not recipient:
            return jsonify({'success': False, 'error': 'Recipient is required'}), 400

        subject = 'EcoPoints Test Notification'
        body = 'This is a test notification from EcoPoints. If you received this, notifications are working correctly.'

        if channel == 'email':
            success, error = _send_email(recipient, subject, body)
        elif channel == 'sms':
            success, error = _send_sms(recipient, f'[EcoPoints] {body}')
        else:
            return jsonify({'success': False, 'error': 'Channel must be "email" or "sms"'}), 400

        loc_id = _scope_location_id(current_user)
        if loc_id:
            log = NotificationLog(
                organization_id=loc_id,
                alert_key='test',
                channel=channel,
                recipient=recipient,
                subject=subject,
                body_preview=body[:500],
                status='sent' if success else 'failed',
                error_message=error,
            )
            db.session.add(log)
            db.session.commit()

        if success:
            return jsonify({'success': True, 'message': f'Test {channel} sent to {recipient}'}), 200
        else:
            return jsonify({'success': False, 'error': f'Failed to send: {error}'}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/notifications/logs', methods=['GET'])
@token_required
@admin_required
def get_notification_logs(current_user):
    """Get notification log history for the current org."""
    try:
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        logs = NotificationLog.query.filter_by(
            organization_id=loc_id
        ).order_by(NotificationLog.sent_at.desc()).limit(200).all()

        result = [{
            'id': l.id,
            'alertKey': l.alert_key,
            'channel': l.channel,
            'recipient': l.recipient,
            'subject': l.subject,
            'bodyPreview': l.body_preview,
            'status': l.status,
            'errorMessage': l.error_message,
            'sentAt': _dt(l.sent_at),
        } for l in logs]

        return jsonify({'success': True, 'logs': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: POINTS CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

# Points configuration is stored in a special NotificationSetting-like
# mechanism using the Organization table's contact_email field as a JSON
# store would be over-engineered. Instead, we use a simple JSON file or
# env-based approach. For simplicity, we store bottle pricing in a
# dedicated settings row. But to keep things simple and avoid schema
# bloat, we use a key-value approach in notification_settings with
# a special alert_key prefix of 'config_'.

@web_bp.route('/settings/points', methods=['GET'])
@token_required
@admin_required
def get_points_config(current_user):
    """Get points-per-bottle configuration for the current org."""
    try:
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        import json as _json
        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_points'
        ).first()

        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                config = None
        else:
            config = None

        # Defaults matching BOTTLE_PRICING
        if not config:
            config = {
                'smallWithLabel': 5, 'smallNoLabel': 3,
                'mediumWithLabel': 8, 'mediumNoLabel': 5,
                'largeWithLabel': 10, 'largeNoLabel': 7,
            }

        return jsonify({'success': True, 'config': config}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/points', methods=['PUT'])
@token_required
@admin_required
def update_points_config(current_user):
    """Update points-per-bottle configuration.

    Body: { smallWithLabel, smallNoLabel, mediumWithLabel, mediumNoLabel, largeWithLabel, largeNoLabel }
    """
    try:
        import json as _json

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        data = request.get_json() or {}
        config = {
            'smallWithLabel': int(data.get('smallWithLabel', 5)),
            'smallNoLabel': int(data.get('smallNoLabel', 3)),
            'mediumWithLabel': int(data.get('mediumWithLabel', 8)),
            'mediumNoLabel': int(data.get('mediumNoLabel', 5)),
            'largeWithLabel': int(data.get('largeWithLabel', 10)),
            'largeNoLabel': int(data.get('largeNoLabel', 7)),
        }

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_points'
        ).first()

        if not setting:
            setting = NotificationSetting(
                organization_id=loc_id,
                alert_key='config_points',
                email_enabled=False,
                sms_enabled=False,
                recipients_json=_json.dumps(config),
                is_active=True,
            )
            db.session.add(setting)
        else:
            setting.recipients_json = _json.dumps(config)

        _log_action(current_user, 'Points Config Updated', str(config), 'Settings')
        db.session.commit()
        return jsonify({'success': True, 'config': config, 'message': 'Points configuration updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# BULK SESSIONS
# ══════════════════════════════════════════════════════════════════════════

def _serialize_bulk_session(session):
    """RecyclingSession (bulk) → frontend shape."""
    account = session.account
    user = account.users[0] if (account and account.users) else None
    rvm = session.rvm
    org = rvm.organization if rvm else None

    return {
        'id': session.id,
        'userId': user.id if user else None,
        'userName': user.name if user else 'Unknown',
        'userEmail': user.email if user else None,
        'machineId': rvm.id if rvm else None,
        'machineName': rvm.name if rvm else 'Unknown',
        'locationId': rvm.organization_id if rvm else None,
        'locationName': org.name if org else 'Unknown',
        'sessionType': session.session_type,
        'notes': session.notes,
        'itemCount': session.item_count,
        'totalPointsEarned': session.total_points_earned,
        'status': session.status,
        'startTime': _dt(session.start_time),
        'endTime': _dt(session.end_time),
    }


@web_bp.route('/sessions/bulk', methods=['GET'])
@token_required
@admin_required
def get_bulk_sessions(current_user):
    """List all bulk recycling sessions, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RecyclingSession.query.filter_by(session_type='bulk').options(
            joinedload(RecyclingSession.account).joinedload(Account.users),
            joinedload(RecyclingSession.rvm).joinedload(RVM.organization),
        )
        if loc_id:
            query = query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        sessions = query.order_by(RecyclingSession.start_time.desc()).limit(200).all()
        return jsonify({'success': True, 'sessions': [_serialize_bulk_session(s) for s in sessions]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/sessions/bulk', methods=['POST'])
@token_required
@admin_required
def create_bulk_session(current_user):
    """Create a new bulk recycling session with items.

    Body: {
        rvmId: int,
        accountId: int,
        notes: str,
        items: [{ itemType, material?, brand?, volumeMl?, condition, weightGrams?, pointsAwarded }]
    }
    """
    try:
        data = request.get_json() or {}
        rvm_id = data.get('rvmId')
        account_id = data.get('accountId')
        items_data = data.get('items', [])
        notes = data.get('notes', '')

        if not rvm_id:
            return jsonify({'success': False, 'error': 'rvmId is required'}), 400
        if not account_id:
            return jsonify({'success': False, 'error': 'accountId is required'}), 400
        if not items_data:
            return jsonify({'success': False, 'error': 'At least one item is required'}), 400

        rvm = db.session.get(RVM, rvm_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        account = db.session.get(Account, account_id)
        if not account:
            return jsonify({'success': False, 'error': 'Account not found'}), 404

        # ── Validate account belongs to same org as RVM ──
        if account.community_group:
            if account.community_group.organization_id != rvm.organization_id:
                return jsonify({'success': False, 'error': 'Account does not belong to the same organization as the machine'}), 400

        if current_user.role != 'superadmin' and rvm.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        now = datetime.now(timezone.utc)
        session = RecyclingSession(
            rvm_id=rvm_id,
            account_id=account_id,
            start_time=now,
            end_time=now,
            total_points_earned=0,
            item_count=0,
            status='completed',
            session_type='bulk',
            notes=notes,
        )
        db.session.add(session)
        db.session.flush()

        total_points = 0
        for item_data in items_data:
            pts = int(item_data.get('pointsAwarded', 0))
            ri = RecyclingItem(
                session_id=session.id,
                item_type=item_data.get('itemType', 'PET Bottle'),
                material=item_data.get('material', 'Plastic'),
                brand=item_data.get('brand'),
                volume_ml=item_data.get('volumeMl'),
                condition=item_data.get('condition', 'With Label'),
                weight_grams=item_data.get('weightGrams', 0),
                points_awarded=pts,
                deposited_at=now,
            )
            db.session.add(ri)
            total_points += pts

        session.item_count = len(items_data)
        session.total_points_earned = total_points

        # Credit account
        balance_before = account.points_balance
        account.points_balance += total_points

        txn = Transaction(
            account_id=account_id,
            transaction_type='earn',
            amount=total_points,
            balance_before=balance_before,
            balance_after=account.points_balance,
            description=f'Bulk session: {len(items_data)} items',
            reference_id=f'BULK-{session.id}',
        )
        db.session.add(txn)

        # Update RVM stats
        rvm.total_items_collected = (rvm.total_items_collected or 0) + len(items_data)

        _log_action(current_user, 'Bulk Session Created',
                     f'{len(items_data)} items, {total_points} pts for account {account_id}',
                     'Logs', notes=notes)
        db.session.commit()

        return jsonify({'success': True, 'session': _serialize_bulk_session(session)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/sessions/bulk/<int:session_id>', methods=['GET'])
@token_required
@admin_required
def get_bulk_session_detail(current_user, session_id):
    """Get a single bulk session with its items."""
    try:
        session = db.session.get(RecyclingSession, session_id)
        if not session:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
        if session.session_type != 'bulk':
            return jsonify({'success': False, 'error': 'Not a bulk session'}), 400

        # ── Org scope check ──
        if current_user.role != 'superadmin' and session.rvm:
            if session.rvm.organization_id != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        items = [{
            'id': i.id,
            'itemType': i.item_type,
            'material': i.material,
            'brand': i.brand,
            'volumeMl': i.volume_ml,
            'condition': i.condition,
            'weightGrams': i.weight_grams,
            'pointsAwarded': i.points_awarded,
            'depositedAt': _dt(i.deposited_at),
        } for i in session.items]

        result = _serialize_bulk_session(session)
        result['items'] = items

        return jsonify({'success': True, 'session': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: EMAIL & SMS CHANNEL CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/settings/channels', methods=['GET'])
@token_required
@admin_required
def get_channel_config(current_user):
    """Get email & SMS channel configuration for the current org."""
    try:
        import json as _json
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_channels'
        ).first()

        config = None
        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                pass
        if not config:
            config = {'emailRecipient': '', 'smsRecipient': '', 'emailEnabled': False, 'smsEnabled': False}

        return jsonify({'success': True, 'config': config}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/channels', methods=['PUT'])
@token_required
@admin_required
def update_channel_config(current_user):
    """Update email & SMS channel configuration."""
    try:
        import json as _json
        if current_user.role not in ('superadmin', 'head_admin'):
            return jsonify({'success': False, 'error': 'Only Super Admin or Head Admin can update channel config'}), 403

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        data = request.get_json() or {}
        config = {
            'emailRecipient': (data.get('emailRecipient') or '').strip(),
            'smsRecipient': (data.get('smsRecipient') or '').strip(),
            'emailEnabled': bool(data.get('emailEnabled', False)),
            'smsEnabled': bool(data.get('smsEnabled', False)),
        }

        if config['smsRecipient'] and config['smsEnabled']:
            phone = config['smsRecipient']
            if not phone.isdigit() or len(phone) != 11 or not phone.startswith('09'):
                return jsonify({'success': False, 'error': 'SMS number must be 11 digits starting with 09'}), 400

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_channels'
        ).first()
        if not setting:
            setting = NotificationSetting(
                organization_id=loc_id, alert_key='config_channels',
                email_enabled=False, sms_enabled=False,
                recipients_json=_json.dumps(config), is_active=True,
            )
            db.session.add(setting)
        else:
            setting.recipients_json = _json.dumps(config)

        _log_action(current_user, 'Channel Config Updated',
                     f'Email: {config["emailEnabled"]}, SMS: {config["smsEnabled"]}', 'Settings')
        db.session.commit()
        return jsonify({'success': True, 'config': config, 'message': 'Channel configuration updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# SETTINGS: SECURITY CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

@web_bp.route('/settings/security', methods=['GET'])
@token_required
@admin_required
def get_security_config(current_user):
    """Get security settings for the current org."""
    try:
        import json as _json
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_security'
        ).first()

        config = None
        if setting and setting.recipients_json:
            try:
                config = _json.loads(setting.recipients_json)
            except (_json.JSONDecodeError, TypeError):
                pass
        if not config:
            config = {
                'twoFactorRequired': False, 'twoFactorMethod': 'email',
                'sessionTimeoutMinutes': 1440, 'maxLoginAttempts': 5, 'lockoutDurationMinutes': 15,
            }

        return jsonify({'success': True, 'config': config}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/security', methods=['PUT'])
@token_required
@admin_required
def update_security_config(current_user):
    """Update security settings."""
    try:
        import json as _json
        if current_user.role not in ('superadmin', 'head_admin'):
            return jsonify({'success': False, 'error': 'Only Super Admin or Head Admin can update security settings'}), 403

        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        data = request.get_json() or {}
        config = {
            'twoFactorRequired': bool(data.get('twoFactorRequired', False)),
            'twoFactorMethod': data.get('twoFactorMethod', 'email') if data.get('twoFactorMethod') in ('email', 'sms') else 'email',
            'sessionTimeoutMinutes': max(5, min(int(data.get('sessionTimeoutMinutes', 1440)), 10080)),
            'maxLoginAttempts': max(3, min(int(data.get('maxLoginAttempts', 5)), 20)),
            'lockoutDurationMinutes': max(5, min(int(data.get('lockoutDurationMinutes', 15)), 1440)),
        }

        setting = NotificationSetting.query.filter_by(
            organization_id=loc_id, alert_key='config_security'
        ).first()
        if not setting:
            setting = NotificationSetting(
                organization_id=loc_id, alert_key='config_security',
                email_enabled=False, sms_enabled=False,
                recipients_json=_json.dumps(config), is_active=True,
            )
            db.session.add(setting)
        else:
            setting.recipients_json = _json.dumps(config)

        _log_action(current_user, 'Security Config Updated',
                     f'2FA={config["twoFactorRequired"]}, Timeout={config["sessionTimeoutMinutes"]}min', 'Settings')
        db.session.commit()
        return jsonify({'success': True, 'config': config, 'message': 'Security settings updated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/security/force-logout', methods=['POST'])
@token_required
@admin_required
def force_logout_all(current_user):
    """Log a force-logout event for the org."""
    try:
        if current_user.role not in ('superadmin', 'head_admin'):
            return jsonify({'success': False, 'error': 'Only Super Admin or Head Admin can force logout'}), 403
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        _log_action(current_user, 'Force Logout All',
                     f'All admin sessions terminated for org {loc_id}', 'Settings',
                     notes='Emergency force logout initiated')
        db.session.commit()
        return jsonify({'success': True, 'message': 'All admin sessions have been terminated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@web_bp.route('/settings/security/login-history', methods=['GET'])
@token_required
@admin_required
def get_login_history(current_user):
    """Get recent login history for the current org."""
    try:
        loc_id = _scope_location_id(current_user)
        if not loc_id:
            return jsonify({'success': False, 'error': 'Location required'}), 400

        logs = AdminLog.query.join(
            User, AdminLog.admin_user_id == User.id
        ).join(
            Account, User.account_id == Account.id
        ).join(
            CommunityGroup, Account.community_group_id == CommunityGroup.id
        ).filter(
            CommunityGroup.organization_id == loc_id,
            AdminLog.category == 'Auth',
        ).order_by(AdminLog.timestamp.desc()).limit(100).all()

        result = [{
            'id': l.id, 'action': l.action,
            'adminName': l.admin.name if l.admin else 'Unknown',
            'adminRole': l.admin.role if l.admin else None,
            'ipAddress': l.notes or '',
            'timestamp': _dt(l.timestamp),
        } for l in logs]

        return jsonify({'success': True, 'history': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
