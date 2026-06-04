"""
Reward Categories Controller — CRUD for reward_categories table.

Registered under ``web_bp`` without a prefix; routes carry full paths
so the externally visible URL is ``/api/web/reward-categories/...``.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import func

from ..models import RewardCategory, Reward
from ..middleware import token_required, permission_required, get_user_org_id, validate_request
from ..schemas import RewardCategoryCreateSchema, RewardCategoryUpdateSchema
from .. import db
from ._shared import _scope_location_id, _log_action


reward_categories_bp = Blueprint('reward_categories', __name__)


@reward_categories_bp.route('/reward-categories', methods=['GET'])
@token_required
@permission_required('rewards')
def get_reward_categories(current_user):
    """List reward categories scoped to the user's organization."""
    try:
        loc_id = _scope_location_id(current_user)
        query = RewardCategory.query
        if loc_id:
            query = query.filter_by(organization_id=loc_id)
        cats = query.order_by(RewardCategory.name).all()
        result = [{
            'id': c.id,
            'name': c.name,
            'organizationId': c.organization_id,
            'rewardCount': Reward.query.filter_by(category_id=c.id).count(),
        } for c in cats]
        return jsonify({'success': True, 'categories': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@reward_categories_bp.route('/reward-categories', methods=['POST'])
@token_required
@permission_required('rewards')
@validate_request(RewardCategoryCreateSchema)
def create_reward_category(current_user, payload):
    """Create a new reward category."""
    try:
        name = (payload.name or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400

        org_id = payload.organizationId
        if current_user.role != 'superadmin':
            org_id = get_user_org_id(current_user)
        if not org_id:
            return jsonify({'success': False, 'error': 'Organization is required'}), 400

        existing = RewardCategory.query.filter(
            RewardCategory.organization_id == org_id,
            func.lower(RewardCategory.name) == name.lower(),
        ).first()
        if existing:
            return jsonify({'success': False, 'error': 'Category already exists'}), 409

        cat = RewardCategory(organization_id=org_id, name=name)
        db.session.add(cat)
        _log_action(current_user, 'Reward Category Created', name, 'Rewards')
        db.session.commit()
        return jsonify({'success': True, 'category': {
            'id': cat.id, 'name': cat.name,
            'organizationId': cat.organization_id, 'rewardCount': 0,
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@reward_categories_bp.route('/reward-categories/<int:cat_id>', methods=['PUT'])
@token_required
@permission_required('rewards')
@validate_request(RewardCategoryUpdateSchema)
def update_reward_category(current_user, cat_id, payload):
    """Rename a reward category."""
    try:
        cat = db.session.get(RewardCategory, cat_id)
        if not cat:
            return jsonify({'success': False, 'error': 'Category not found'}), 404

        if current_user.role != 'superadmin' and cat.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        name = (payload.name or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400

        existing = RewardCategory.query.filter(
            RewardCategory.organization_id == cat.organization_id,
            func.lower(RewardCategory.name) == name.lower(),
            RewardCategory.id != cat_id,
        ).first()
        if existing:
            return jsonify({'success': False, 'error': 'Category name already exists'}), 409

        cat.name = name
        _log_action(current_user, 'Reward Category Updated', name, 'Rewards')
        db.session.commit()
        return jsonify({'success': True, 'category': {
            'id': cat.id, 'name': cat.name,
            'organizationId': cat.organization_id,
            'rewardCount': Reward.query.filter_by(category_id=cat.id).count(),
        }}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@reward_categories_bp.route('/reward-categories/<int:cat_id>', methods=['DELETE'])
@token_required
@permission_required('rewards')
def delete_reward_category(current_user, cat_id):
    """Delete a reward category. Blocks if any rewards reference it."""
    try:
        cat = db.session.get(RewardCategory, cat_id)
        if not cat:
            return jsonify({'success': False, 'error': 'Category not found'}), 404

        if current_user.role != 'superadmin' and cat.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        ref_count = Reward.query.filter_by(category_id=cat_id).count()
        if ref_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {ref_count} reward(s) use this category'}), 409

        _log_action(current_user, 'Reward Category Deleted', cat.name, 'Rewards')
        db.session.delete(cat)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
