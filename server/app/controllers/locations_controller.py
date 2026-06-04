"""
Locations Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under both `/locations/*` and `/org-types/*`. Because a single
Flask Blueprint can only have one `url_prefix`, this blueprint is declared
without a prefix and the full paths are written into each route decorator.
When `web_bp.register_blueprint(locations_bp)` is called from
`web_controller.py`, both prefixes appear under `/api/web/...` so the
externally visible URL inventory remains byte-identical with the
pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from ..models import (
    OrgType,
    Organization,
    OrgAddress,
    OrgContact,
    CommunityGroup,
    User,
)
from ..middleware import token_required, permission_required, superadmin_required, get_user_org_id, validate_request
from ..schemas import OrgTypeCreateSchema, OrgTypeUpdateSchema, LocationCreateSchema, LocationUpdateSchema
from .. import db
from ._shared import (
    _serialize_org_type,
    _serialize_organization,
    _scope_location_id,
    _log_action,
)


# Note: no `url_prefix` — the blueprint owns two distinct path families
# (`/locations/*` and `/org-types/*`), so each route decorator carries the
# full path. Registering this blueprint under `web_bp` (prefix `/api/web`)
# yields `/api/web/locations/...` and `/api/web/org-types/...`.
locations_bp = Blueprint('locations', __name__)


# ══════════════════════════════════════════════════════════════════════════
# ORG TYPES (lookup — superadmin managed)
# ══════════════════════════════════════════════════════════════════════════

@locations_bp.route('/org-types', methods=['GET'])
@token_required
@permission_required('locations')
def get_org_types(current_user):
    """Return all organization types for dropdown selectors."""
    try:
        types = OrgType.query.order_by(OrgType.name).all()
        return jsonify({'success': True, 'orgTypes': [_serialize_org_type(t) for t in types]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@locations_bp.route('/org-types', methods=['POST'])
@token_required
@superadmin_required
@validate_request(OrgTypeCreateSchema)
def create_org_type(current_user, payload):
    """Create a new organization type (superadmin only)."""
    try:
        name = (payload.name or '').strip()
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


@locations_bp.route('/org-types/<int:ot_id>', methods=['DELETE'])
@token_required
@superadmin_required
def delete_org_type(current_user, ot_id):
    """Delete an organization type (superadmin only)."""
    try:
        ot = db.session.get(OrgType, ot_id)
        if not ot:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        # Prevent deletion if referenced by any organization
        ref_count = Organization.query.filter_by(type_id=ot_id).count()
        if ref_count > 0:
            return jsonify({'success': False, 'error': f'Cannot delete: {ref_count} organization(s) reference this type'}), 409
        db.session.delete(ot)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@locations_bp.route('/org-types/<int:ot_id>', methods=['PUT'])
@token_required
@superadmin_required
@validate_request(OrgTypeUpdateSchema)
def update_org_type(current_user, ot_id, payload):
    """Rename an organization type (superadmin only)."""
    try:
        ot = db.session.get(OrgType, ot_id)
        if not ot:
            return jsonify({'success': False, 'error': 'Not found'}), 404
        name = (payload.name or '').strip()
        if not name:
            return jsonify({'success': False, 'error': 'Name is required'}), 400
        existing = OrgType.query.filter(
            func.lower(OrgType.name) == name.lower(), OrgType.id != ot_id
        ).first()
        if existing:
            return jsonify({'success': False, 'error': 'Organization type already exists'}), 409
        ot.name = name
        db.session.commit()
        return jsonify({'success': True, 'orgType': _serialize_org_type(ot)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


# ══════════════════════════════════════════════════════════════════════════
# LOCATIONS (Organizations)
# ══════════════════════════════════════════════════════════════════════════

@locations_bp.route('/locations', methods=['GET'])
@token_required
@permission_required('locations')
def get_locations(current_user):
    """List organizations. Superadmin sees all; others see only their own."""
    try:
        loc_id = _scope_location_id(current_user)
        query = Organization.query.options(
            joinedload(Organization.community_groups)
                .joinedload(CommunityGroup.users)
                .joinedload(User.wallet),
            joinedload(Organization.rvms),
            joinedload(Organization.address),
            joinedload(Organization.contacts),
            joinedload(Organization.org_type_ref),
        ).order_by(Organization.id.asc())
        if loc_id:
            query = query.filter_by(id=loc_id)
        orgs = query.all()
        return jsonify({'success': True, 'locations': [_serialize_organization(o) for o in orgs]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@locations_bp.route('/locations', methods=['POST'])
@token_required
@superadmin_required
@validate_request(LocationCreateSchema)
def create_location(current_user, payload):
    """Create a new organization (superadmin only)."""
    try:
        data = payload.model_dump(exclude_unset=True)
        org_type_name = data.get('orgType', 'University')
        org_type_ref = OrgType.query.filter(func.lower(OrgType.name) == org_type_name.lower()).first() if org_type_name else None
        org = Organization(
            name=data.get('name'),
            full_name=data.get('fullName'),
            type_id=org_type_ref.id if org_type_ref else None,
            status=data.get('status', 'Active'),
        )
        db.session.add(org)
        db.session.flush()

        # Create OrgAddress
        addr = OrgAddress(
            organization_id=org.id,
            street_address=data.get('streetAddress'),
            barangay=data.get('barangay'),
            city_municipality=data.get('cityName') or data.get('cityMunicipality'),
            province=data.get('province'),
            region=data.get('region'),
            zip_code=data.get('zipCode'),
        )
        db.session.add(addr)

        # Create OrgContact if provided
        if data.get('contactPerson') or data.get('contactEmail'):
            parts = (data.get('contactPerson') or '').split(' ', 1)
            contact = OrgContact(
                organization_id=org.id,
                first_name=parts[0] if parts else '',
                last_name=parts[1] if len(parts) > 1 else '',
                email=data.get('contactEmail'),
                phone_number=data.get('contactPhone'),
            )
            db.session.add(contact)

        # Create community groups — use provided list or fall back to default
        groups_data = data.get('communityGroups')
        if groups_data and isinstance(groups_data, list):
            for gd in groups_data:
                # Handle both dict and Pydantic model objects
                if hasattr(gd, 'name'):
                    gname = gd.name
                    gabbr = gd.abbreviation or ''
                    gtype = gd.groupType or 'college'
                else:
                    gname = gd.get('name', '')
                    gabbr = gd.get('abbreviation', '')
                    gtype = gd.get('groupType', 'college')
                if gname and gname.strip():
                    cg = CommunityGroup(
                        organization_id=org.id,
                        name=gname.strip(),
                        abbreviation=gabbr.strip() or None,
                        group_type=gtype,
                    )
                    db.session.add(cg)
        else:
            # Default: create a single "Campus Staff" group
            for gtype, gname, abbr in [('staff', 'Campus Staff', 'Staff')]:
                cg = CommunityGroup(organization_id=org.id, name=gname, abbreviation=abbr, group_type=gtype)
                db.session.add(cg)

        _log_action(current_user, 'Location Created', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'location': _serialize_organization(org)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@locations_bp.route('/locations/<int:loc_id>', methods=['PUT'])
@token_required
@permission_required('locations')
@validate_request(LocationUpdateSchema)
def update_location(current_user, loc_id, payload):
    """Update an organization."""
    try:
        org = db.session.get(Organization, loc_id)
        if not org:
            return jsonify({'success': False, 'error': 'Location not found'}), 404

        if current_user.role != 'superadmin' and get_user_org_id(current_user) != loc_id:
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = payload.model_dump(exclude_unset=True)
        for front, back in [
            ('name', 'name'), ('fullName', 'full_name'), ('status', 'status'),
        ]:
            if front in data:
                setattr(org, back, data[front] if data[front] != '' else None)

        # Sync type_id when orgType string changes
        if 'orgType' in data and data['orgType']:
            org_type_ref = OrgType.query.filter(func.lower(OrgType.name) == data['orgType'].lower()).first()
            org.type_id = org_type_ref.id if org_type_ref else None

        # Update address
        addr_fields = {'streetAddress': 'street_address', 'barangay': 'barangay',
                       'cityName': 'city_municipality', 'cityMunicipality': 'city_municipality',
                       'province': 'province', 'region': 'region', 'zipCode': 'zip_code'}
        addr_data = {v: data[k] for k, v in addr_fields.items() if k in data}
        if addr_data:
            if not org.address:
                org.address = OrgAddress(organization_id=org.id)
            for k, v in addr_data.items():
                setattr(org.address, k, v)

        _log_action(current_user, 'Location Updated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'location': _serialize_organization(org)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@locations_bp.route('/locations/<int:loc_id>', methods=['DELETE'])
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
            for user in (cg.users or []):
                user.is_active = False

        _log_action(current_user, 'Location Deactivated', org.name, 'Locations')
        db.session.commit()
        return jsonify({'success': True, 'message': f'{org.name} deactivated'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
