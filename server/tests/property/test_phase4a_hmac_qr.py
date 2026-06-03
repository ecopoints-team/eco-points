"""Property N: HMAC-QR round-trip and short-circuit — Phase 4A.

Validates Requirements 4A.5, 4A.6, 4A.9:
  - Valid HMAC suffix → 200 (or 404 user-not-found from a real lookup)
  - Tampered suffix → 401 QR_HMAC_INVALID (no DB user lookup)

Uses the shared session-scoped ``app`` fixture from ``conftest.py`` to
avoid the ``web_bp`` duplicate-registration error.
"""
from __future__ import annotations

import secrets
from unittest.mock import patch

import bcrypt as _bcrypt
import pytest

from app import db
from app.models import (
    Organization, OrgType, CommunityGroup, RVM, User, Wallet,
)
from app.middleware import compute_qr_suffix


@pytest.fixture(scope='module')
def seed(app):
    """Seed RVM with API key + org with HMAC secret + a test user."""
    with app.app_context():
        ot = OrgType.query.filter_by(name='HMACTestOrgType').first()
        if ot is None:
            ot = OrgType(name='HMACTestOrgType')
            db.session.add(ot)
            db.session.flush()

        org = Organization.query.filter_by(name='HMACTestOrg').first()
        if org is None:
            org = Organization(name='HMACTestOrg', full_name='HMAC Test', type_id=ot.id)
            db.session.add(org)
            db.session.flush()

        # Provision HMAC secret
        hmac_secret = secrets.token_bytes(32)
        org.qr_hmac_secret_enc = Organization.encrypt_qr_hmac_secret(hmac_secret)
        db.session.flush()

        cg = CommunityGroup.query.filter_by(name='GN1').first()
        if cg is None:
            cg = CommunityGroup(organization_id=org.id, name='GN1', abbreviation='GN1')
            db.session.add(cg)
            db.session.flush()

        # RVM with API key
        api_key = secrets.token_urlsafe(32)
        hashed = _bcrypt.hashpw(api_key.encode(), _bcrypt.gensalt()).decode()
        rvm = RVM.query.filter_by(machine_uuid='RVM-HMAC-001').first()
        if rvm is None:
            rvm = RVM(
                organization_id=org.id,
                machine_uuid='RVM-HMAC-001',
                name='HMAC RVM',
                location_name='Lab',
                api_key_hash=hashed,
            )
            db.session.add(rvm)
        else:
            rvm.api_key_hash = hashed
        db.session.flush()

        # Test user
        user = User.query.filter_by(email='qrtest@ecopoints.local').first()
        if user is None:
            user = User(
                community_group_id=cg.id,
                first_name='QR', last_name='User',
                email='qrtest@ecopoints.local',
                role='user', is_active=True,
            )
            user.set_password('TestPass!23')
            db.session.add(user)
            db.session.flush()
            user.display_id = 'USER-HMAC-001'

            wallet = Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
            db.session.add(wallet)

        db.session.commit()

        return {
            'machine_uuid': rvm.machine_uuid,
            'api_key': api_key,
            'hmac_secret': hmac_secret,
            'display_id': user.display_id,
            'org_id': org.id,
        }


@pytest.fixture(scope='module')
def client(app):
    return app.test_client()


class TestPropertyN:
    """Property N: HMAC-QR round-trip and short-circuit."""

    def test_valid_hmac_suffix_succeeds(self, client, seed):
        """Valid suffix → 200 with user data."""
        suffix = compute_qr_suffix(seed['hmac_secret'], seed['display_id'])
        qr_payload = f"{seed['display_id']}.{suffix}"

        resp = client.post(
            '/api/rpi/authenticate',
            json={'machineUuid': seed['machine_uuid'], 'qrPayload': qr_payload},
            headers={'X-API-Key': seed['api_key']},
        )
        assert resp.status_code == 200, f'Expected 200, got {resp.status_code}: {resp.get_json()}'
        data = resp.get_json()
        assert data['success'] is True
        assert data['user']['displayId'] == seed['display_id']

    def test_valid_hmac_unknown_user_returns_404(self, client, seed):
        """Valid suffix for non-existent display_id → 404 (real DB lookup, user not found)."""
        fake_id = 'USER-HMAC-999'
        suffix = compute_qr_suffix(seed['hmac_secret'], fake_id)
        qr_payload = f"{fake_id}.{suffix}"

        resp = client.post(
            '/api/rpi/authenticate',
            json={'machineUuid': seed['machine_uuid'], 'qrPayload': qr_payload},
            headers={'X-API-Key': seed['api_key']},
        )
        assert resp.status_code == 404

    def test_tampered_hmac_suffix_returns_401(self, client, seed):
        """Mutated suffix → 401 QR_HMAC_INVALID."""
        suffix = compute_qr_suffix(seed['hmac_secret'], seed['display_id'])
        # Tamper one character
        tampered = ('0' if suffix[0] != '0' else '1') + suffix[1:]
        qr_payload = f"{seed['display_id']}.{tampered}"

        resp = client.post(
            '/api/rpi/authenticate',
            json={'machineUuid': seed['machine_uuid'], 'qrPayload': qr_payload},
            headers={'X-API-Key': seed['api_key']},
        )
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['error']['code'] == 'QR_HMAC_INVALID'

    def test_missing_suffix_returns_401(self, client, seed):
        """No dot separator → 401 QR_HMAC_INVALID."""
        resp = client.post(
            '/api/rpi/authenticate',
            json={'machineUuid': seed['machine_uuid'], 'qrPayload': seed['display_id']},
            headers={'X-API-Key': seed['api_key']},
        )
        assert resp.status_code == 401

    def test_tampered_suffix_no_user_query(self, client, seed, app):
        """Tampered suffix → User.query is NOT called (short-circuit)."""
        suffix = compute_qr_suffix(seed['hmac_secret'], seed['display_id'])
        tampered = ('0' if suffix[0] != '0' else '1') + suffix[1:]
        qr_payload = f"{seed['display_id']}.{tampered}"

        with patch('app.controllers.rpi_controller.User') as MockUser:
            resp = client.post(
                '/api/rpi/authenticate',
                json={'machineUuid': seed['machine_uuid'], 'qrPayload': qr_payload},
                headers={'X-API-Key': seed['api_key']},
            )
            assert resp.status_code == 401
            # User.query.filter_by should NOT have been called
            MockUser.query.filter_by.assert_not_called()
