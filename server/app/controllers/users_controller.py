"""
Users Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/users/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/users/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, request, jsonify

from ..models import (
    Organization,
    CommunityGroup,
    User,
    Wallet,
    UserSecurity,
    Transaction,
    NotificationSetting,
)
from ..middleware import token_required, permission_required, get_user_org_id, validate_request
from ..schemas import UserCreateSchema, UserUpdateSchema, UserAdjustPointsSchema
from ..services.notification_service import trigger_alert
from ..services.password_policy import validate_password_policy
from .. import db
from ._shared import (
    _get_org_abbreviation,
    _serialize_user,
    _scope_location_id,
    log_action,
    _paginate,
    level,
)


users_bp = Blueprint('users', __name__, url_prefix='/users')


# ══════════════════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════════════════

@users_bp.route('', methods=['GET'])
@token_required
@permission_required('users')
def get_users(current_user):
    """List users. Supports filters: ?role=, ?user_type=, ?location_id=, ?is_admin=."""
    try:
        loc_id = _scope_location_id(current_user)
        query = db.session.query(User).join(CommunityGroup)
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

        if not current_user.is_admin:
            query = query.filter(User.id == current_user.id)

        query = query.order_by(User.id.asc())
        users, pagination = _paginate(query)
        return jsonify({'success': True, 'users': [_serialize_user(u) for u in users], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
@permission_required('users')
def get_user(current_user, user_id):
    """Get a single user by ID."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if not current_user.is_admin and current_user.id != user_id:
                return jsonify({'success': False, 'error': 'Access denied'}), 403
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        return jsonify({'success': True, 'user': _serialize_user(user)}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@users_bp.route('', methods=['POST'])
@token_required
@permission_required('users')
@validate_request(UserCreateSchema)
def create_user(current_user, payload):
    """Create a new user (regular or admin).

    Body: { firstName, lastName, middleName?, username?, email?, phone?, password, role, userType?, locationId, groupId? }
    """
    try:
        data = payload.model_dump(exclude_unset=True)
        first_name = data.get('firstName') or (data.get('name', '').split(' ', 1)[0] if data.get('name') else '')
        last_name = data.get('lastName') or (data.get('name', '').split(' ', 1)[1] if data.get('name') and ' ' in data.get('name', '') else data.get('name', ''))
        middle_name = data.get('middleName')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')

        # ── Role hierarchy guard (Phase 2 / Task 6.7) ──
        # Enforce Requirement 2.6 / 4H.30: actor cannot set a target's role
        # to any value at or above the actor's own level. Note the strict
        # `>=` comparison — an actor cannot create a peer either.
        if level(role) >= level(current_user.role):
            log_action(
                current_user,
                'role_hierarchy_violation',
                target=None,
                before=None,
                after={'role': role},
                category='users',
                notes=(
                    f"create blocked: actor_role={current_user.role} "
                    f"target_role={role}"
                ),
            )
            db.session.commit()
            return jsonify({
                'success': False,
                'error': {
                    'code': 'ROLE_HIERARCHY_VIOLATION',
                    'actor_role': current_user.role,
                    'target_role': role,
                },
            }), 403

        location_id = data.get('locationId')

        if not first_name or not last_name:
            return jsonify({'success': False, 'error': 'First name and last name are required'}), 400
        if not password:
            return jsonify({'success': False, 'error': 'Password is required'}), 400

        # ── Password policy guard (Phase 4G / Requirement 4G.28-29) ──
        # Validate against the shared policy before any DB write so that
        # a weak password never results in a partial row being created.
        pw_valid, pw_message = validate_password_policy(password)
        if not pw_valid:
            return jsonify({
                'success': False,
                'error': {
                    'code': 'WEAK_PASSWORD',
                    'policy': pw_message,
                },
            }), 400

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

        # Resolve org abbreviation for display_id
        org = db.session.get(Organization, location_id)
        org_abbr = _get_org_abbreviation(org) if org else 'SYS'

        user = User(
            community_group_id=group_id,
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            username=username,
            email=email,
            phone=data.get('phone'),
            role=role,
            user_type=data.get('userType'),
            educational_level=data.get('educationalLevel'),
            year_level=data.get('yearLevel'),
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        # Create wallet
        wallet = Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
        db.session.add(wallet)

        # Create security record
        security = UserSecurity(user_id=user.id, two_factor_enabled=False)
        db.session.add(security)

        # Generate and assign display_id
        user.display_id = User.generate_display_id(role, org_abbr)

        log_action(
            current_user,
            'user.create',
            target=user,
            before=None,
            after={
                'id': user.id,
                'display_id': user.display_id,
                'email': user.email,
                'username': user.username,
                'role': user.role,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'community_group_id': user.community_group_id,
            },
            category='users',
        )
        db.session.commit()

        # ── Notification hook: new user registered ──
        try:
            trigger_alert(location_id, 'new_user_registered',
                          f'New user registered: {user.name}',
                          f'A new {role} "{user.name}" was created by {current_user.name}.')
        except Exception:
            pass

        return jsonify({'success': True, 'user': _serialize_user(user)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@users_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
@permission_required('users')
@validate_request(UserUpdateSchema)
def update_user(current_user, user_id, payload):
    """Update user fields."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = payload.model_dump(exclude_unset=True)

        # Uniqueness checks for email and username
        if 'email' in data and data['email']:
            existing = User.query.filter(User.email == data['email'], User.id != user_id).first()
            if existing:
                return jsonify({'success': False, 'error': 'Email already in use'}), 409
        if 'username' in data and data['username']:
            existing = User.query.filter(User.username == data['username'], User.id != user_id).first()
            if existing:
                return jsonify({'success': False, 'error': 'Username already in use'}), 409

        # ── Role hierarchy guard (Phase 2 / Task 6.7) ──
        # Enforce Requirement 2.7 / 4H.31: when the role is being changed,
        # the actor cannot set the target's role to any value at or above
        # the actor's own level. The check fires regardless of which other
        # fields are being updated; any rejection here MUST NOT mutate the
        # target row.
        if 'role' in data and data['role'] != user.role:
            target_role = data['role']
            if level(target_role) >= level(current_user.role):
                log_action(
                    current_user,
                    'role_hierarchy_violation',
                    target=user,
                    before={'role': user.role},
                    after={'role': target_role},
                    category='users',
                    notes=(
                        f"update blocked: actor_role={current_user.role} "
                        f"target_role={target_role}"
                    ),
                )
                db.session.commit()
                return jsonify({
                    'success': False,
                    'error': {
                        'code': 'ROLE_HIERARCHY_VIOLATION',
                        'actor_role': current_user.role,
                        'target_role': target_role,
                    },
                }), 403

        # Snapshot before state for the audit row.
        before_snapshot = {
            'first_name': user.first_name,
            'middle_name': user.middle_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'user_type': user.user_type,
            'is_active': user.is_active,
        }

        for front, back in [
            ('firstName', 'first_name'), ('lastName', 'last_name'), ('middleName', 'middle_name'),
            ('username', 'username'), ('email', 'email'),
            ('phone', 'phone'), ('role', 'role'), ('userType', 'user_type'),
            ('educationalLevel', 'educational_level'), ('yearLevel', 'year_level'),
            ('isActive', 'is_active'),
        ]:
            if front in data:
                setattr(user, back, data[front])

        # Update community group if provided
        if 'communityGroupId' in data and data['communityGroupId']:
            user.community_group_id = data['communityGroupId']

        # Backward compat: if 'name' sent, split into first/last
        if 'name' in data and data['name'] and 'firstName' not in data:
            parts = data['name'].strip().split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else parts[0]

        password_changed = bool(data.get('password'))
        if 'password' in data and data['password']:
            user.set_password(data['password'])

        after_snapshot = {
            'first_name': user.first_name,
            'middle_name': user.middle_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'role': user.role,
            'user_type': user.user_type,
            'is_active': user.is_active,
            'password_changed': password_changed,
        }

        log_action(
            current_user,
            'user.update',
            target=user,
            before=before_snapshot,
            after=after_snapshot,
            category='users',
        )
        db.session.commit()
        return jsonify({'success': True, 'user': _serialize_user(user)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@token_required
@permission_required('users')
def delete_user(current_user, user_id):
    """Deactivate a user (soft delete)."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        was_active = user.is_active
        user.is_active = False
        log_action(
            current_user,
            'user.deactivate',
            target=user,
            before={'is_active': was_active},
            after={'is_active': False},
            category='users',
        )
        db.session.commit()
        return jsonify({'success': True, 'message': f'{user.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@users_bp.route('/<int:user_id>/adjust-points', methods=['POST'])
@token_required
@permission_required('users')
@validate_request(UserAdjustPointsSchema)
def adjust_user_points(current_user, user_id, payload):
    """Manually adjust a user's point balance (add or subtract)."""
    try:
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        if current_user.role != 'superadmin':
            if get_user_org_id(user) != get_user_org_id(current_user):
                return jsonify({'success': False, 'error': 'Access denied'}), 403

        amount = payload.amount
        reason = payload.reason or 'Manual adjustment'

        if amount is None or not isinstance(amount, (int, float)):
            return jsonify({'success': False, 'error': 'Amount is required and must be a number'}), 400
        amount = int(amount)
        if amount == 0:
            return jsonify({'success': False, 'error': 'Amount cannot be zero'}), 400

        wallet = user.wallet
        if not wallet:
            return jsonify({'success': False, 'error': 'User has no wallet'}), 404

        balance_before = wallet.points_balance
        balance_after = balance_before + amount

        if balance_after < 0:
            return jsonify({'success': False, 'error': f'Insufficient balance. Current: {balance_before}, adjustment: {amount}'}), 400

        wallet.points_balance = balance_after
        if amount > 0:
            wallet.lifetime_points = (wallet.lifetime_points or 0) + amount

        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='adjustment',
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type='admin_log',
            reference_id=user.id,
        )
        db.session.add(txn)

        direction = 'added' if amount > 0 else 'deducted'
        log_action(
            current_user,
            'user.adjust_points',
            target=user,
            before={'points_balance': balance_before},
            after={'points_balance': balance_after, 'amount': amount},
            category='users',
            notes=reason,
        )
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
