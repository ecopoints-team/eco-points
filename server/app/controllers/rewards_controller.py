"""
Rewards Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/rewards/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/rewards/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from datetime import datetime, timezone
import secrets
from flask import Blueprint, request, jsonify

from sqlalchemy import or_

from ..models import (
    Reward, RewardVariant, RewardRedemption, Transaction, NotificationSetting,
    RewardOrgAssignment, Organization,
)
from ..middleware import token_required, permission_required, superadmin_required, get_user_org_id, validate_request
from ..schemas import RewardCreateSchema, RewardUpdateSchema, RewardRedeemSchema, RewardAssignSchema
from ..services.notification_service import trigger_alert
from .. import db
from ._shared import (
    _serialize_reward,
    _serialize_reward_log,
    _scope_location_id,
    _log_action,
    _paginate,
)


rewards_bp = Blueprint('rewards', __name__, url_prefix='/rewards')


# ══════════════════════════════════════════════════════════════════════════
# REWARDS
# ══════════════════════════════════════════════════════════════════════════

@rewards_bp.route('', methods=['GET'])
@token_required
def get_rewards(current_user):
    """List rewards, scoped by location.

    Returns rewards that belong to the user's organization AND any rewards
    that have been shared with the user's organization via the
    reward_organization_assignments table (Task 29 — shared merchandise).

    Requires authentication: rewards are not viewable by anonymous users.
    """
    try:
        loc_id = _scope_location_id(current_user)
        query = Reward.query
        if loc_id:
            # Include rewards owned by this org OR assigned to this org
            assigned_ids = db.session.query(RewardOrgAssignment.reward_id)\
                .filter_by(organization_id=loc_id).subquery()
            query = query.filter(
                or_(
                    Reward.organization_id == loc_id,
                    Reward.id.in_(assigned_ids),
                )
            )
        query = query.order_by(Reward.id.asc())
        rewards, pagination = _paginate(query)
        return jsonify({'success': True, 'rewards': [_serialize_reward(r) for r in rewards], 'pagination': pagination}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('', methods=['POST'])
@token_required
@permission_required('rewards', action='create')
@validate_request(RewardCreateSchema)
def create_reward(current_user, payload):
    """Create a new reward."""
    try:
        location_id = payload.locationId
        if current_user.role != 'superadmin':
            location_id = get_user_org_id(current_user)

        if not location_id:
            return jsonify({'success': False, 'error': 'Location is required'}), 400

        reward = Reward(
            organization_id=location_id,
            name=payload.name,
            description=payload.description,
            category=payload.category,
            points_required=payload.pointsRequired if payload.pointsRequired is not None else 0,
            image_url=payload.imageUrl,
            is_active=payload.isActive if payload.isActive is not None else True,
        )
        db.session.add(reward)
        db.session.flush()

        # Create default variant
        variant = RewardVariant(
            reward_id=reward.id,
            variety_name='Default',
            stock_quantity=payload.stockQuantity if payload.stockQuantity is not None else 0,
            is_active=True,
        )
        db.session.add(variant)

        _log_action(current_user, 'Reward Created', reward.name, 'Rewards')
        db.session.commit()
        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('/<int:reward_id>', methods=['PUT'])
@token_required
@permission_required('rewards', action='edit')
@validate_request(RewardUpdateSchema)
def update_reward(current_user, reward_id, payload):
    """Update a reward."""
    try:
        reward = db.session.get(Reward, reward_id)
        if not reward:
            return jsonify({'success': False, 'error': 'Reward not found'}), 404

        if current_user.role != 'superadmin' and reward.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = payload.model_dump(exclude_unset=True)
        for front, back in [
            ('name', 'name'), ('description', 'description'), ('category', 'category'),
            ('pointsRequired', 'points_required'),
            ('imageUrl', 'image_url'), ('isActive', 'is_active'),
        ]:
            if front in data:
                setattr(reward, back, data[front])

        # Update default variant stock if stockQuantity sent
        if 'stockQuantity' in data:
            default_var = RewardVariant.query.filter_by(reward_id=reward.id, variety_name='Default').first()
            if default_var:
                default_var.stock_quantity = data['stockQuantity']
            else:
                default_var = RewardVariant(reward_id=reward.id, variety_name='Default',
                                           stock_quantity=data['stockQuantity'], is_active=True)
                db.session.add(default_var)

        _log_action(current_user, 'Reward Updated', reward.name, 'Rewards')
        db.session.commit()

        # ── Notification hooks: low / out-of-stock ──
        try:
            org_id = reward.organization_id
            total_stock = sum(v.stock_quantity or 0 for v in (reward.variants or []))
            if total_stock <= 0:
                trigger_alert(org_id, 'reward_out_of_stock',
                              f'Reward out of stock: {reward.name}',
                              f'The reward "{reward.name}" has 0 remaining stock.')
            else:
                setting = NotificationSetting.query.filter_by(
                    organization_id=org_id, alert_key='low_reward_stock', is_active=True
                ).first()
                if setting and total_stock <= (setting.threshold or 10):
                    trigger_alert(org_id, 'low_reward_stock',
                                  f'Low reward stock: {reward.name}',
                                  f'"{reward.name}" has only {total_stock} left (threshold: {setting.threshold}).')
        except Exception:
            pass  # never break the main response

        return jsonify({'success': True, 'reward': _serialize_reward(reward)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('/<int:reward_id>', methods=['DELETE'])
@token_required
@permission_required('rewards', action='delete')
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


@rewards_bp.route('/<int:reward_id>/redeem', methods=['POST'])
@token_required
@validate_request(RewardRedeemSchema)
def redeem_reward(current_user, reward_id, payload):
    """Redeem a reward for the current user."""
    try:
        variant_id = payload.variantId
        quantity = payload.quantity if payload.quantity is not None else 1

        reward = db.session.get(Reward, reward_id)
        if not reward or not reward.is_active:
            return jsonify({'success': False, 'error': 'Reward not found or inactive'}), 404

        # Pick variant
        if variant_id:
            variant = db.session.get(RewardVariant, variant_id)
            if not variant or variant.reward_id != reward_id:
                return jsonify({'success': False, 'error': 'Invalid variant'}), 400
        else:
            # Pick first active variant with stock
            variant = next((v for v in reward.variants if v.is_active and v.stock_quantity >= quantity), None)
            if not variant:
                return jsonify({'success': False, 'error': 'Reward is out of stock'}), 400

        if variant.stock_quantity < quantity:
            return jsonify({'success': False, 'error': 'Insufficient stock'}), 400

        total_points_required = reward.points_required * quantity
        wallet = current_user.wallet
        if not wallet or wallet.points_balance < total_points_required:
            return jsonify({'success': False, 'error': 'Insufficient points balance'}), 400

        # Deduct points
        balance_before = wallet.points_balance
        wallet.points_balance -= total_points_required
        balance_after = wallet.points_balance

        # Create Transaction
        txn = Transaction(
            wallet_id=wallet.id,
            transaction_type='redeem',
            amount=-total_points_required,
            balance_before=balance_before,
            balance_after=balance_after,
            reference_type='reward_redemption',
        )
        db.session.add(txn)
        db.session.flush()

        # Update stock
        variant.stock_quantity -= quantity

        # Create Redemption
        redemption_code = secrets.token_hex(4).upper()
        
        redemption = RewardRedemption(
            wallet_id=wallet.id,
            variant_id=variant.id,
            points_spent=total_points_required,
            status='pending',
            redemption_code=redemption_code,
            redeemed_at=datetime.now(timezone.utc)
        )
        db.session.add(redemption)
        db.session.flush()
        
        txn.reference_id = redemption.id
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Redemption successful',
            'redemption': _serialize_reward_log(redemption)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('/my-redemptions', methods=['GET'])
@token_required
def get_my_redemptions(current_user):
    """List redemptions for the current user."""
    try:
        wallet = current_user.wallet
        if not wallet:
            return jsonify({'success': True, 'redemptions': []}), 200
            
        redemptions = RewardRedemption.query.filter_by(wallet_id=wallet.id)\
            .order_by(RewardRedemption.redeemed_at.desc()).all()
            
        return jsonify({
            'success': True, 
            'redemptions': [_serialize_reward_log(r) for r in redemptions]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# REWARD ORGANIZATION ASSIGNMENT (Task 29 — shared merchandise)
# ══════════════════════════════════════════════════════════════════════════

@rewards_bp.route('/<int:reward_id>/assign', methods=['POST'])
@token_required
@superadmin_required
@validate_request(RewardAssignSchema)
def assign_reward(current_user, reward_id, payload):
    """Assign a reward to additional organizations (superadmin only).

    Body: { "organizationIds": [1, 2, 3] }
    """
    try:
        reward = db.session.get(Reward, reward_id)
        if not reward:
            return jsonify({'success': False, 'error': 'Reward not found'}), 404

        added = []
        for org_id in payload.organizationIds:
            # Don't assign to the owning org (redundant)
            if org_id == reward.organization_id:
                continue
            # Check org exists
            if not db.session.get(Organization, org_id):
                continue
            # Skip duplicates
            existing = RewardOrgAssignment.query.filter_by(
                reward_id=reward_id, organization_id=org_id
            ).first()
            if existing:
                continue
            assignment = RewardOrgAssignment(
                reward_id=reward_id,
                organization_id=org_id,
            )
            db.session.add(assignment)
            added.append(org_id)

        _log_action(current_user, 'Reward Assigned',
                    f'{reward.name} → orgs {added}', 'Rewards')
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Reward assigned to {len(added)} organization(s)',
            'assignedOrganizationIds': added,
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('/<int:reward_id>/assign/<int:org_id>', methods=['DELETE'])
@token_required
@superadmin_required
def unassign_reward(current_user, reward_id, org_id):
    """Remove an organization assignment from a reward (superadmin only)."""
    try:
        assignment = RewardOrgAssignment.query.filter_by(
            reward_id=reward_id, organization_id=org_id
        ).first()
        if not assignment:
            return jsonify({'success': False, 'error': 'Assignment not found'}), 404

        reward = db.session.get(Reward, reward_id)
        db.session.delete(assignment)
        _log_action(current_user, 'Reward Unassigned',
                    f'{reward.name if reward else reward_id} ← org {org_id}',
                    'Rewards')
        db.session.commit()

        return jsonify({'success': True, 'message': 'Assignment removed'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@rewards_bp.route('/<int:reward_id>/assignments', methods=['GET'])
@token_required
@superadmin_required
def get_reward_assignments(current_user, reward_id):
    """List all organizations a reward is assigned to (superadmin only)."""
    try:
        reward = db.session.get(Reward, reward_id)
        if not reward:
            return jsonify({'success': False, 'error': 'Reward not found'}), 404

        assignments = RewardOrgAssignment.query.filter_by(reward_id=reward_id).all()
        orgs = []
        for a in assignments:
            org = db.session.get(Organization, a.organization_id)
            if org:
                orgs.append({'id': org.id, 'name': org.name, 'assignedAt': a.assigned_at.isoformat()})

        return jsonify({
            'success': True,
            'rewardId': reward_id,
            'ownerOrganizationId': reward.organization_id,
            'assignedOrganizations': orgs,
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
