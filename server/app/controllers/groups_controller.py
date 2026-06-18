"""
Groups Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/groups/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/groups/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, request, jsonify

from ..models import CommunityGroup, User
from ..middleware import token_required, permission_required, get_user_org_id, validate_request
from ..schemas import GroupCreateSchema, GroupUpdateSchema
from .. import db
from ._shared import _scope_location_id, _log_action


groups_bp = Blueprint('groups', __name__, url_prefix='/groups')


# ══════════════════════════════════════════════════════════════════════════
# COMMUNITY GROUPS (for dropdowns)
# ══════════════════════════════════════════════════════════════════════════

@groups_bp.route('', methods=['GET'])
@token_required
@permission_required('groups')
def get_groups(current_user):
    """List community groups for a location."""
    try:
        loc_id = _scope_location_id(current_user)
        query = CommunityGroup.query
        if loc_id:
            query = query.filter_by(organization_id=loc_id)
        groups = query.order_by(CommunityGroup.educational_level, CommunityGroup.name).all()
        result = [{
            'id': g.id,
            'name': g.name,
            'abbreviation': g.abbreviation,
            'educationalLevel': g.educational_level,
            'organizationId': g.organization_id,
        } for g in groups]
        return jsonify({'success': True, 'groups': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@groups_bp.route('', methods=['POST'])
@token_required
@permission_required('groups')
@validate_request(GroupCreateSchema)
def create_group(current_user, payload):
    """Create a new community group.

    Body: { name, abbreviation?, educationalLevel, organizationId? }
    """
    try:
        name = (payload.name or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Group name is required'}), 400

        educational_level = payload.educationalLevel
        org_id = payload.organizationId

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
            abbreviation=(payload.abbreviation or '').strip() or None,
            educational_level=educational_level,
        )
        db.session.add(group)
        _log_action(current_user, 'Group Created', name, 'Groups')
        db.session.commit()
        return jsonify({'success': True, 'group': {
            'id': group.id,
            'name': group.name,
            'abbreviation': group.abbreviation,
            'educationalLevel': group.educational_level,
            'organizationId': group.organization_id,
        }}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@groups_bp.route('/<int:group_id>', methods=['PUT'])
@token_required
@permission_required('groups')
@validate_request(GroupUpdateSchema)
def update_group(current_user, group_id, payload):
    """Update a community group."""
    try:
        group = db.session.get(CommunityGroup, group_id)
        if not group:
            return jsonify({'success': False, 'error': 'Group not found'}), 404

        if current_user.role != 'superadmin' and group.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = payload.model_dump(exclude_unset=True)
        if 'name' in data:
            group.name = (data['name'] or '').strip()
        if 'abbreviation' in data:
            group.abbreviation = (data['abbreviation'] or '').strip() or None
        if 'educationalLevel' in data:
            group.educational_level = data['educationalLevel']

        _log_action(current_user, 'Group Updated', group.name, 'Groups')
        db.session.commit()
        return jsonify({'success': True, 'group': {
            'id': group.id,
            'name': group.name,
            'abbreviation': group.abbreviation,
            'educationalLevel': group.educational_level,
            'organizationId': group.organization_id,
        }}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@groups_bp.route('/<int:group_id>', methods=['DELETE'])
@token_required
@permission_required('groups')
def delete_group(current_user, group_id):
    """Delete a community group. Prevents deletion if it has users."""
    try:
        group = db.session.get(CommunityGroup, group_id)
        if not group:
            return jsonify({'success': False, 'error': 'Group not found'}), 404

        if current_user.role != 'superadmin' and group.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        # Prevent deletion if referenced by any users
        user_count = User.query.filter_by(community_group_id=group_id).count()
        if user_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {user_count} user(s) belong to this group'}), 409

        _log_action(current_user, 'Group Deleted', group.name, 'Groups')
        db.session.delete(group)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Group deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
