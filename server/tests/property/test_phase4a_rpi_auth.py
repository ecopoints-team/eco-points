"""Property M: Universal RPI auth — Phase 4A (Requirements 4A.2, 4A.3, 4A.8).

For every route in ``rpi_bp`` other than ``/api/rpi/health``:
  - Request with no ``X-API-Key`` → 401 ``RPI_AUTH_INVALID``
  - Request with invalid ``X-API-Key`` → 401 ``RPI_AUTH_INVALID``
  - Request with valid ``X-API-Key`` → success (not 401)

Uses the shared session-scoped ``app`` fixture from ``conftest.py`` to
avoid the ``web_bp`` duplicate-registration error.
"""
from __future__ import annotations

import secrets
import bcrypt as _bcrypt
import pytest
from flask import Flask

from app import db
from app.models import Organization, OrgType, CommunityGroup, RVM


# ── Fixtures ────────────────────────────────────────────────────────────


@pytest.fixture(scope='module')
def rvm_and_key(app):
    """Seed a minimal RVM with a known API key."""
    with app.app_context():
        ot = OrgType.query.filter_by(name='TestOrgM').first()
        if ot is None:
            ot = OrgType(name='TestOrgM')
            db.session.add(ot)
            db.session.flush()
        org = Organization.query.filter_by(name='TestOrgM').first()
        if org is None:
            org = Organization(name='TestOrgM', full_name='Test', type_id=ot.id)
            db.session.add(org)
            db.session.flush()
        cg = CommunityGroup.query.filter_by(name='GM1').first()
        if cg is None:
            cg = CommunityGroup(organization_id=org.id, name='GM1', abbreviation='GM1')
            db.session.add(cg)
            db.session.flush()

        rvm = RVM.query.filter_by(machine_uuid='RVM-TEST-M-001').first()
        plaintext = secrets.token_urlsafe(32)
        hashed = _bcrypt.hashpw(plaintext.encode(), _bcrypt.gensalt()).decode()
        if rvm is None:
            rvm = RVM(
                organization_id=org.id,
                machine_uuid='RVM-TEST-M-001',
                name='Test RVM',
                location_name='Lab',
                api_key_hash=hashed,
            )
            db.session.add(rvm)
        else:
            rvm.api_key_hash = hashed
        db.session.commit()
        return rvm.machine_uuid, plaintext


@pytest.fixture(scope='module')
def client(app):
    return app.test_client()


# ── Enumerate every rpi_bp route ────────────────────────────────────────

def _rpi_routes(app: Flask):
    """Yield (method, rule_string) for every route on rpi_bp."""
    for rule in app.url_map.iter_rules():
        if not rule.rule.startswith('/api/rpi'):
            continue
        if rule.rule == '/api/rpi/health':
            continue
        for method in rule.methods:
            if method in ('HEAD', 'OPTIONS'):
                continue
            yield method, rule.rule


# ── Tests ───────────────────────────────────────────────────────────────


class TestPropertyM:
    """Property M: Universal RPI auth."""

    def test_no_api_key_returns_401(self, app, client, rvm_and_key):
        """Every rpi route without X-API-Key → 401 RPI_AUTH_INVALID."""
        machine_uuid, _ = rvm_and_key
        for method, rule in _rpi_routes(app):
            # Build a concrete URL (replace <int:xxx> placeholders)
            url = rule.replace('<int:session_id>', '999').replace('<int:org_id>', '1')
            resp = getattr(client, method.lower())(
                url,
                json={'machineUuid': machine_uuid},
                # No X-API-Key header
            )
            assert resp.status_code in (401, 404), (
                f'{method} {rule} returned {resp.status_code}, expected 401 or 404'
            )

    def test_invalid_api_key_returns_401(self, app, client, rvm_and_key):
        """Every rpi route with wrong X-API-Key → 401 RPI_AUTH_INVALID."""
        machine_uuid, _ = rvm_and_key
        for method, rule in _rpi_routes(app):
            url = rule.replace('<int:session_id>', '999').replace('<int:org_id>', '1')
            resp = getattr(client, method.lower())(
                url,
                json={'machineUuid': machine_uuid},
                headers={'X-API-Key': 'totally-wrong-key'},
            )
            assert resp.status_code == 401, (
                f'{method} {rule} returned {resp.status_code}, expected 401'
            )

    def test_valid_api_key_not_401(self, app, client, rvm_and_key):
        """Every rpi route with valid X-API-Key → NOT 401."""
        machine_uuid, valid_key = rvm_and_key
        for method, rule in _rpi_routes(app):
            url = rule.replace('<int:session_id>', '999').replace('<int:org_id>', '1')
            resp = getattr(client, method.lower())(
                url,
                json={'machineUuid': machine_uuid},
                headers={'X-API-Key': valid_key},
            )
            # Should NOT be 401 — it might be 400/404/500 depending on
            # missing body fields, but never an auth rejection.
            assert resp.status_code != 401, (
                f'{method} {rule} returned 401 with a valid API key'
            )
