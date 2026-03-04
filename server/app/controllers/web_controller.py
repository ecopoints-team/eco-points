"""
Web Application Controller
Handles ALL API endpoints for the Next.js admin panel.
Every route (except /health) requires JWT authentication via @token_required.

Prefix: /api/web
"""
from datetime import datetime, date, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import func, or_
from ..models import (
    OrgType, City, Organization, CommunityGroup, Account, User, AccessCredential,
    RVM, RecyclingSession, RecyclingItem, MaintenanceLog,
    Transaction, Reward, RewardRedemption, AdminLog,
)
from ..middleware import token_required, admin_required, superadmin_required, get_user_org_id
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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/org-types/<int:ot_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_org_type(current_user, ot_id):
    """Delete an organization type (superadmin only)."""
    try:
        ot = OrgType.query.get(ot_id)
        if not ot:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        db.session.delete(ot)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/cities/<int:city_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_city(current_user, city_id):
    """Delete a city (superadmin only)."""
    try:
        city = City.query.get(city_id)
        if not city:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        db.session.delete(city)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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
        query = Organization.query.order_by(Organization.id.asc())
        if loc_id:
            query = query.filter_by(id=loc_id)
        orgs = query.all()
        return jsonify({'success': True, 'locations': [_serialize_organization(o) for o in orgs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/locations', methods=['POST'])
@token_required
@superadmin_required
def create_location(current_user):
    """Create a new organization (superadmin only)."""
    try:
        data = request.get_json() or {}
        org = Organization(
            name=data.get('name'),
            full_name=data.get('fullName'),
            org_type=data.get('orgType', 'University'),
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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/locations/<int:loc_id>', methods=['PUT'])
@token_required
@admin_required
def update_location(current_user, loc_id):
    """Update an organization."""
    try:
        org = Organization.query.get(loc_id)
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

        _log_action(current_user, 'Location Updated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'location': _serialize_organization(org)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/locations/<int:loc_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_location(current_user, loc_id):
    """Deactivate an organization. Superadmin only."""
    try:
        org = Organization.query.get(loc_id)
        if not org:
            return jsonify({'success': False, 'error': 'Location not found'}), 404

        org.status = 'Inactive'
        _log_action(current_user, 'Location Deactivated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{org.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


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

        users = query.order_by(User.id.asc()).all()
        return jsonify({'success': True, 'users': [_serialize_user(u) for u in users]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
def get_user(current_user, user_id):
    """Get a single user by ID."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        return jsonify({'success': True, 'user': _serialize_user(user)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
        org = Organization.query.get(location_id)
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
        return jsonify({'success': True, 'user': _serialize_user(user)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    """Update user fields."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = request.get_json() or {}
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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    """Deactivate a user (soft delete)."""
    try:
        user = User.query.get(user_id)
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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        machines = query.order_by(RVM.id.asc()).all()
        return jsonify({'success': True, 'machines': [_serialize_rvm(m) for m in machines]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/machines/<int:machine_id>', methods=['PUT'])
@token_required
@admin_required
def update_machine(current_user, machine_id):
    """Update an RVM."""
    try:
        rvm = RVM.query.get(machine_id)
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
        return jsonify({'success': True, 'machine': _serialize_rvm(rvm)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/machines/<int:machine_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_machine(current_user, machine_id):
    """Decommission an RVM."""
    try:
        rvm = RVM.query.get(machine_id)
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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        rewards = query.order_by(Reward.id.asc()).all()
        return jsonify({'success': True, 'rewards': [_serialize_reward(r) for r in rewards]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/rewards/<int:reward_id>', methods=['PUT'])
@token_required
@admin_required
def update_reward(current_user, reward_id):
    """Update a reward."""
    try:
        reward = Reward.query.get(reward_id)
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
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/rewards/<int:reward_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_reward(current_user, reward_id):
    """Deactivate a reward."""
    try:
        reward = Reward.query.get(reward_id)
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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        query = RecyclingItem.query.join(RecyclingSession)
        if loc_id:
            query = query.join(RVM, RecyclingSession.rvm_id == RVM.id).filter(RVM.organization_id == loc_id)
        items = query.order_by(RecyclingItem.deposited_at.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_bottle_log(i) for i in items]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


@web_bp.route('/logs/rewards', methods=['GET'])
@token_required
@admin_required
def get_reward_logs(current_user):
    """Reward redemption logs, scoped by location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RewardRedemption.query.join(Reward)
        if loc_id:
            query = query.filter(Reward.organization_id == loc_id)
        logs = query.order_by(RewardRedemption.redeemed_at.desc()).limit(500).all()
        return jsonify({'success': True, 'logs': [_serialize_reward_log(r) for r in logs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500


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
        return jsonify({'success': False, 'error': str(e)}), 500
