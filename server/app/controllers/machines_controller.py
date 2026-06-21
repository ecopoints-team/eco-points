"""
Machines Controller (Phase 1 — Domain_Controller extracted from web_controller.py).

Owns paths under `/machines/*`. Registered as a sub-blueprint of `web_bp`
so the externally visible URL prefix `/api/web/machines/...` remains
byte-identical with the pre-Phase-1 routing surface.

Phase 1 is a pure restructuring: decorators on every moved route are
preserved byte-for-byte. The `@admin_required` → `@permission_required`
substitution is the work of Phase 2.
"""
from flask import Blueprint, request, jsonify

from ..models import RVM
from ..middleware import token_required, permission_required, superadmin_required, get_user_org_id, validate_request
from ..schemas import MachineCreateSchema, MachineUpdateSchema, RotateApiKeySchema
from ..services.notification_service import trigger_alert
from .. import db
from ._shared import (
    _serialize_rvm,
    _scope_location_id,
    _log_action,
    _paginate,
)


machines_bp = Blueprint('machines', __name__, url_prefix='/machines')


# ══════════════════════════════════════════════════════════════════════════
# MACHINES (RVMs)
# ══════════════════════════════════════════════════════════════════════════

@machines_bp.route('', methods=['GET'])
@token_required
@permission_required('machines')
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


@machines_bp.route('', methods=['POST'])
@token_required
@permission_required('machines', action='create')
@validate_request(MachineCreateSchema)
def create_machine(current_user, payload):
    """Register a new RVM."""
    try:
        import uuid as _uuid

        location_id = payload.locationId
        if current_user.role != 'superadmin':
            location_id = get_user_org_id(current_user)

        if not location_id:
            return jsonify({'success': False, 'error': 'Location is required'}), 400

        rvm = RVM(
            organization_id=location_id,
            machine_uuid=payload.machineUuid or str(_uuid.uuid4()),
            name=payload.name,
            location_name=payload.locationName,
            is_online=payload.isOnline if payload.isOnline is not None else False,
        )
        db.session.add(rvm)
        _log_action(current_user, 'Machine Registered', rvm.name, 'Machines')
        db.session.commit()
        return jsonify({'success': True, 'machine': _serialize_rvm(rvm)}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@machines_bp.route('/<int:machine_id>', methods=['PUT'])
@token_required
@permission_required('machines', action='edit')
@validate_request(MachineUpdateSchema)
def update_machine(current_user, machine_id, payload):
    """Update an RVM."""
    try:
        rvm = db.session.get(RVM, machine_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        if current_user.role != 'superadmin' and rvm.organization_id != get_user_org_id(current_user):
            return jsonify({'success': False, 'error': 'Access denied'}), 403

        data = payload.model_dump(exclude_unset=True)
        for front, back in [
            ('name', 'name'), ('locationName', 'location_name'),
            ('isOnline', 'is_online'),
            ('isCapacityFull', 'is_capacity_full'),
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

        # ── Notification hook: machine capacity full ──
        try:
            if 'isCapacityFull' in data and data['isCapacityFull']:
                trigger_alert(rvm.organization_id, 'machine_capacity_high',
                              f'Machine full: {rvm.name}',
                              f'Machine "{rvm.name}" reports its bin is full.')
        except Exception:
            pass

        return jsonify({'success': True, 'machine': _serialize_rvm(rvm)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500


@machines_bp.route('/<int:machine_id>', methods=['DELETE'])
@token_required
@permission_required('machines', action='delete')
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
# Phase 4A: API Key Provisioning
# ══════════════════════════════════════════════════════════════════════════

@machines_bp.route('/<int:machine_id>/rotate-api-key', methods=['POST'])
@token_required
@superadmin_required
@validate_request(RotateApiKeySchema)
def rotate_api_key(current_user, machine_id, payload):
    """Generate a new API key for an RVM (Phase 4A — superadmin only).

    The plaintext key is returned exactly once in the response body and
    printed to stdout. The BCrypt hash is stored in ``rvm.api_key_hash``.
    An ``AdminLog`` row is written via ``_log_action``.

    Requirements: 4A.1, 7.2
    """
    try:
        import secrets
        import bcrypt as _bcrypt

        rvm = db.session.get(RVM, machine_id)
        if not rvm:
            return jsonify({'success': False, 'error': 'Machine not found'}), 404

        # Generate 32-byte random API key, url-safe
        plaintext_key = secrets.token_urlsafe(32)

        # BCrypt hash for storage
        hashed = _bcrypt.hashpw(
            plaintext_key.encode('utf-8'),
            _bcrypt.gensalt(),
        ).decode('utf-8')
        rvm.api_key_hash = hashed

        _log_action(current_user, 'API Key Rotated', rvm.name, 'Machines')
        db.session.commit()

        # Print to operator console exactly once
        print(f'[Phase 4A] API key generated for RVM "{rvm.name}" '
              f'(id={rvm.id}, uuid={rvm.machine_uuid}): {plaintext_key}')

        return jsonify({
            'success': True,
            'apiKey': plaintext_key,
            'message': (
                'API key generated. This is the ONLY time the plaintext '
                'key is shown. Store it securely on the RVM device.'
            ),
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'An internal error occurred'}), 500
