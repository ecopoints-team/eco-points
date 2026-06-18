"""
Phase 4C / Property R — Forced-logout invariant.

Validates: Requirements 4C.18, 4C.19, 4C.20.

Three leaf assertions:

1. **JWT iat vs force_logout_at (Requirement 4C.19, 4C.20)** — For
   arbitrary ``(jwt_iat, force_logout_at)`` pairs:
     * ``iat < force_logout_at`` ⇒ HTTP 401 with
       ``error.code == "FORCED_LOGOUT"``.
     * ``iat >= force_logout_at`` ⇒ HTTP 200 (request proceeds normally).

2. **Force-logout endpoint sets timestamp (Requirement 4C.18)** — A
   successful ``POST /api/web/settings/security/force-logout`` sets
   ``Organization.force_logout_at`` within ±5 seconds of ``NOW()``.

3. **Force-logout endpoint writes audit log (Requirement 4C.18, 7.2)** —
   The same successful call writes exactly one new ``AdminLog`` row with
   ``action == 'force_logout'``.

The property test mounts a self-contained Flask app with a single
``@token_required``-protected stub route (for the iat-vs-timestamp
truth table) and also exercises the real ``settings_bp`` force-logout
endpoint (for the timestamp + audit assertions).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from flask import Flask, jsonify
from hypothesis import HealthCheck, given, settings, strategies as st

from app import Config, db
from app.middleware import token_required
from app.models import AdminLog, CommunityGroup, OrgType, Organization, User


# ─────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────


def _stub_handler(current_user):
    """Tiny authenticated stub that returns 200 when all middleware passes."""
    return jsonify({'success': True, 'user_id': current_user.id}), 200


@pytest.fixture(scope='module')
def force_logout_app():
    """Self-contained Flask app with:

    - A stub GET /force-logout-stub protected by @token_required (for the
      iat-vs-timestamp truth table).
    - The real settings_bp registered (for the force-logout endpoint test).
    - One Organization → CommunityGroup → superadmin User seeded.

    Returns (app, user_id, org_id).
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///file:force-logout-test?mode=memory&cache=shared&uri=true'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-do-not-use-in-prod'
    app.config['JWT_EXPIRY_HOURS'] = 1
    app.config['TESTING'] = True

    db.init_app(app)

    # Mount the stub route for the iat-vs-timestamp property
    view = token_required(_stub_handler)
    app.add_url_rule(
        '/force-logout-stub',
        endpoint='force_logout_stub',
        view_func=view,
        methods=['GET'],
    )

    # Register the real settings blueprint for the force-logout endpoint
    from app.controllers.settings_controller import settings_bp
    # Wrap in a parent blueprint to match the /api/web prefix
    from flask import Blueprint
    web_bp = Blueprint('web_test', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(settings_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'ForceLogoutUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'FLOGOUT-{suffix}',
            full_name='Force Logout Test University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Default Group',
            abbreviation='DEF',
            
        )
        db.session.add(group)
        db.session.flush()

        user = User(
            community_group_id=group.id,
            first_name='Force',
            last_name='Logout',
            email=f'force-logout-{suffix}@example.test',
            username=f'force_logout_{suffix}',
            password_hash='not-used-directly',
            role='superadmin',
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()

        user_id = user.id
        org_id = org.id

    yield app, user_id, org_id

    with app.app_context():
        db.session.remove()


def _mint_jwt(app: Flask, user_id: int, iat: datetime | None = None) -> str:
    """Mint an HS256 JWT with a controllable `iat` timestamp.

    The `exp` is always set to 2 hours from *real* now (not from `iat`)
    so the token never expires during the test — we're testing the
    force-logout check, not JWT expiry.
    """
    now_real = datetime.now(timezone.utc)
    iat_ts = iat or now_real
    payload = {
        'user_id': user_id,
        'role': 'superadmin',
        'iat': int(iat_ts.timestamp()),
        'exp': int((now_real + timedelta(hours=2)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return pyjwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ─────────────────────────────────────────────────────────────────────
# 1. Property R — iat vs force_logout_at truth table
#    (Requirements 4C.19, 4C.20)
# ─────────────────────────────────────────────────────────────────────

# Strategy: generate offsets (in seconds) from a reference point.
# Positive offset means iat is AFTER force_logout_at (should pass).
# Negative offset means iat is BEFORE force_logout_at (should reject).
# Zero means iat == force_logout_at (should pass, since the condition
# is "strictly less than").

@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    # offset_seconds: how far iat is from force_logout_at
    # negative = iat before force_logout_at (reject)
    # zero or positive = iat >= force_logout_at (pass)
    offset_seconds=st.integers(min_value=-86400, max_value=86400),
)
def test_forced_logout_iat_vs_timestamp(force_logout_app, monkeypatch, offset_seconds):
    """Property R — forced-logout invariant.

    For arbitrary (jwt_iat, force_logout_at) pairs:
      - iat < force_logout_at ⇒ HTTP 401 with error.code == "FORCED_LOGOUT"
      - iat >= force_logout_at ⇒ HTTP 200

    The test sets Organization.force_logout_at to a fixed reference time,
    then mints a JWT with iat = reference + offset_seconds.
    """
    app, user_id, org_id = force_logout_app

    # Disable CSRF for this property (we're testing force-logout logic, not CSRF)
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    # Use a fixed reference point for force_logout_at
    reference = datetime(2025, 6, 1, 12, 0, 0, tzinfo=timezone.utc)

    # Set the organization's force_logout_at
    with app.app_context():
        org = db.session.get(Organization, org_id)
        org.force_logout_at = reference
        db.session.commit()

    # Mint a JWT with iat = reference + offset
    jwt_iat = reference + timedelta(seconds=offset_seconds)
    token = _mint_jwt(app, user_id, iat=jwt_iat)

    with app.test_client() as client:
        resp = client.get(
            '/force-logout-stub',
            headers={'Authorization': f'Bearer {token}'},
        )

    if offset_seconds < 0:
        # iat < force_logout_at → FORCED_LOGOUT
        assert resp.status_code == 401, (
            f'Expected 401 FORCED_LOGOUT for offset={offset_seconds}s '
            f'(iat before force_logout_at); got {resp.status_code}: '
            f'{resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body is not None
        err = body.get('error')
        assert isinstance(err, dict), f'error must be a dict, got {err!r}'
        assert err.get('code') == 'FORCED_LOGOUT', (
            f'Expected error.code == "FORCED_LOGOUT"; got {err!r}'
        )
    else:
        # iat >= force_logout_at → request proceeds (200)
        assert resp.status_code == 200, (
            f'Expected 200 for offset={offset_seconds}s '
            f'(iat >= force_logout_at); got {resp.status_code}: '
            f'{resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body is not None and body.get('success') is True, body


# ─────────────────────────────────────────────────────────────────────
# 2. Force-logout endpoint sets timestamp within ±5s of NOW()
#    (Requirement 4C.18)
# ─────────────────────────────────────────────────────────────────────

def test_force_logout_sets_timestamp(force_logout_app, monkeypatch):
    """A successful POST /api/web/settings/security/force-logout sets
    Organization.force_logout_at within ±5 seconds of NOW().
    """
    app, user_id, org_id = force_logout_app

    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    # Clear any existing force_logout_at
    with app.app_context():
        org = db.session.get(Organization, org_id)
        org.force_logout_at = None
        db.session.commit()

    # Mint a fresh JWT (iat = now, so it won't be rejected)
    token = _mint_jwt(app, user_id)
    before_call = datetime.now(timezone.utc)

    with app.test_client() as client:
        resp = client.post(
            '/api/web/settings/security/force-logout',
            headers={'Authorization': f'Bearer {token}'},
            json={},
        )

    after_call = datetime.now(timezone.utc)

    assert resp.status_code == 200, (
        f'Expected 200 from force-logout endpoint; got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )
    body = resp.get_json()
    assert body is not None and body.get('success') is True, body

    # Verify the timestamp was set within ±5s of NOW()
    with app.app_context():
        org = db.session.get(Organization, org_id)
        db.session.refresh(org)
        assert org.force_logout_at is not None, (
            'force_logout_at should be set after a successful force-logout call'
        )
        # Normalize to UTC for comparison
        fla = org.force_logout_at
        if fla.tzinfo is None:
            fla = fla.replace(tzinfo=timezone.utc)

        tolerance = timedelta(seconds=5)
        assert before_call - tolerance <= fla <= after_call + tolerance, (
            f'force_logout_at ({fla.isoformat()}) should be within ±5s of '
            f'the call window [{before_call.isoformat()}, {after_call.isoformat()}]'
        )


# ─────────────────────────────────────────────────────────────────────
# 3. Force-logout endpoint writes exactly one AdminLog row
#    (Requirements 4C.18, 7.2)
# ─────────────────────────────────────────────────────────────────────

def test_force_logout_writes_audit_log(force_logout_app, monkeypatch):
    """A successful POST /api/web/settings/security/force-logout writes
    exactly one new AdminLog row with action == 'force_logout'.
    """
    app, user_id, org_id = force_logout_app

    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    # Clear force_logout_at so the JWT won't be rejected
    with app.app_context():
        org = db.session.get(Organization, org_id)
        org.force_logout_at = None
        db.session.commit()

    # Count existing audit logs before the call
    with app.app_context():
        before_count = AdminLog.query.filter_by(
            admin_user_id=user_id,
            action='settings.force_logout',
        ).count()

    # Mint a fresh JWT and call the endpoint
    token = _mint_jwt(app, user_id)

    with app.test_client() as client:
        resp = client.post(
            '/api/web/settings/security/force-logout',
            headers={'Authorization': f'Bearer {token}'},
            json={},
        )

    assert resp.status_code == 200, (
        f'Expected 200; got {resp.status_code}: {resp.get_data(as_text=True)}'
    )

    # Verify exactly one new AdminLog row was written
    with app.app_context():
        after_count = AdminLog.query.filter_by(
            admin_user_id=user_id,
            action='settings.force_logout',
        ).count()

    assert after_count == before_count + 1, (
        f'Expected exactly one new AdminLog row with action="settings.force_logout"; '
        f'before={before_count}, after={after_count}'
    )


# ─────────────────────────────────────────────────────────────────────
# 4. No force_logout_at set → JWT passes regardless of iat
#    (edge case: null force_logout_at should not reject)
# ─────────────────────────────────────────────────────────────────────

def test_null_force_logout_at_does_not_reject(force_logout_app, monkeypatch):
    """When Organization.force_logout_at is NULL, no JWT should be
    rejected by the force-logout check regardless of iat.
    """
    app, user_id, org_id = force_logout_app

    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    # Ensure force_logout_at is NULL
    with app.app_context():
        org = db.session.get(Organization, org_id)
        org.force_logout_at = None
        db.session.commit()

    # Mint a JWT with a very old iat (should still pass when force_logout_at is NULL)
    old_iat = datetime(2020, 1, 1, tzinfo=timezone.utc)
    token = _mint_jwt(app, user_id, iat=old_iat)

    with app.test_client() as client:
        resp = client.get(
            '/force-logout-stub',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, (
        f'Expected 200 when force_logout_at is NULL; got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )
