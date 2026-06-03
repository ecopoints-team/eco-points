"""
Unit tests for Phase 4B / Task 11.3 — `@csrf_required` and the automatic
CSRF check inside `@token_required` for unsafe HTTP methods.

Validates: Requirements 4B.13, 4B.14, 7.6.

Covers:

1. **Standalone `@csrf_required`** — header byte-equals cookie → 200;
   mismatch → 403 `CSRF_INVALID`; missing header → 403; missing cookie
   → 403; safe methods (GET) bypass the check entirely.
2. **Auto-enforcement inside `@token_required`** — POST/PUT/PATCH/DELETE
   require a matching CSRF header+cookie pair after the JWT is
   validated, returning 403 `CSRF_INVALID` on mismatch. GET requests on
   the same handler bypass the CSRF check.
3. **Escape hatch** — when `AUTH_CSRF_DISABLED=true`, the check is a
   no-op so the existing test suite continues to authenticate with
   plain Bearer tokens (set in `tests/conftest.py`).

The CSRF check uses `hmac.compare_digest` for constant-time comparison;
the unit test additionally asserts that an empty header or empty cookie
is treated as a missing value (cannot satisfy `compare_digest` against
the other side).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, jsonify

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.middleware import csrf_required, token_required
from app.models import CommunityGroup, OrgType, Organization, User


def _stub_handler(current_user=None, **_kw):
    if current_user is not None:
        return jsonify({'success': True, 'user_id': current_user.id}), 200
    return jsonify({'success': True}), 200


# ── Standalone @csrf_required fixtures ────────────────────────────────


@pytest.fixture()
def csrf_app(monkeypatch):
    """Flask app with a route protected by `@csrf_required` only.

    CSRF is enforced (escape hatch OFF) so the decorator's real behavior
    is exercised. The fixture is function-scoped so each test gets a
    fresh `monkeypatch` and fresh env state.
    """
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')

    app = Flask(__name__)
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['TESTING'] = True

    # Bind both POST and GET to exercise the unsafe/safe split.
    app.add_url_rule(
        '/csrf-only',
        endpoint='csrf_post',
        view_func=csrf_required(_stub_handler),
        methods=['POST'],
    )
    app.add_url_rule(
        '/csrf-only-get',
        endpoint='csrf_get',
        view_func=csrf_required(_stub_handler),
        methods=['GET'],
    )

    return app


# ── @token_required + auto-CSRF fixtures ──────────────────────────────


@pytest.fixture(scope='module')
def token_csrf_app_and_user():
    """Self-contained Flask app, in-memory schema, one seeded user, and
    `/protected` GET + POST routes wired through `@token_required`.

    `AUTH_CSRF_DISABLED` is left to the conftest default for module
    setup; individual tests below flip it OFF via `monkeypatch.setenv`
    so they exercise the real CSRF check.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True

    db.init_app(app)

    app.add_url_rule(
        '/protected',
        endpoint='protected_get',
        view_func=token_required(_stub_handler),
        methods=['GET'],
    )
    app.add_url_rule(
        '/protected',
        endpoint='protected_post',
        view_func=token_required(_stub_handler),
        methods=['POST'],
    )

    with app.app_context():
        db.create_all()

        org_type = OrgType(name=f'CSRFUni-{uuid.uuid4().hex[:6]}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'CSRF-{uuid.uuid4().hex[:6]}',
            full_name='CSRF Test University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Default',
            abbreviation='DEF',
        )
        db.session.add(group)
        db.session.flush()

        uniq = uuid.uuid4().hex[:8]
        user = User(
            community_group_id=group.id,
            first_name='CSRF',
            last_name='Tester',
            email=f'csrf-{uniq}@example.test',
            username=f'csrf_{uniq}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    yield app, user_id

    with app.app_context():
        db.session.remove()
        db.drop_all()


def _mint(app, user_id, role='superadmin'):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            'user_id': user_id,
            'role': role,
            'iat': int(now.timestamp()),
            'exp': int(
                (now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()
            ),
            'jti': uuid.uuid4().hex,
        },
        app.config['SECRET_KEY'],
        algorithm='HS256',
    )


# ─────────────────────────────────────────────────────────────────────
# 1. Standalone @csrf_required behavior
# ─────────────────────────────────────────────────────────────────────


def test_csrf_post_header_matches_cookie_returns_200(csrf_app):
    csrf_value = 'matching-csrf-token-abc123'
    with csrf_app.test_client() as client:
        client.set_cookie('csrf_token', csrf_value, domain='localhost')
        resp = client.post('/csrf-only', headers={'X-CSRF-Token': csrf_value})

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True}


def test_csrf_post_header_mismatch_returns_403(csrf_app):
    with csrf_app.test_client() as client:
        client.set_cookie('csrf_token', 'cookie-side-value', domain='localhost')
        resp = client.post(
            '/csrf-only',
            headers={'X-CSRF-Token': 'header-side-value'},
        )

    assert resp.status_code == 403
    body = resp.get_json()
    assert body['success'] is False
    assert body['error']['code'] == 'CSRF_INVALID'
    assert 'message' in body['error']


def test_csrf_post_missing_header_returns_403(csrf_app):
    with csrf_app.test_client() as client:
        client.set_cookie('csrf_token', 'cookie-only', domain='localhost')
        resp = client.post('/csrf-only')  # no X-CSRF-Token header

    assert resp.status_code == 403
    body = resp.get_json()
    assert body['error']['code'] == 'CSRF_INVALID'


def test_csrf_post_missing_cookie_returns_403(csrf_app):
    with csrf_app.test_client() as client:
        resp = client.post(
            '/csrf-only',
            headers={'X-CSRF-Token': 'header-only'},
        )

    assert resp.status_code == 403
    body = resp.get_json()
    assert body['error']['code'] == 'CSRF_INVALID'


def test_csrf_post_empty_header_returns_403(csrf_app):
    """An empty `X-CSRF-Token` value MUST NOT satisfy the check even if the
    cookie is also empty — both sides must be present and non-empty."""
    with csrf_app.test_client() as client:
        client.set_cookie('csrf_token', '', domain='localhost')
        resp = client.post('/csrf-only', headers={'X-CSRF-Token': ''})

    assert resp.status_code == 403
    assert resp.get_json()['error']['code'] == 'CSRF_INVALID'


def test_csrf_get_request_bypasses_check(csrf_app):
    """Safe methods (GET, HEAD, OPTIONS) MUST NOT trigger the CSRF check.

    A GET to a `@csrf_required`-protected handler succeeds even with no
    CSRF cookie or header present.
    """
    with csrf_app.test_client() as client:
        resp = client.get('/csrf-only-get')

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True}


# ─────────────────────────────────────────────────────────────────────
# 2. Automatic CSRF enforcement inside @token_required
# ─────────────────────────────────────────────────────────────────────


def test_token_required_post_with_matching_csrf_returns_200(
    token_csrf_app_and_user, monkeypatch
):
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    csrf_value = 'super-secret-csrf-value'
    with app.test_client() as client:
        client.set_cookie('csrf_token', csrf_value, domain='localhost')
        resp = client.post(
            '/protected',
            headers={
                'Authorization': f'Bearer {token}',
                'X-CSRF-Token': csrf_value,
            },
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True, 'user_id': user_id}


def test_token_required_post_csrf_mismatch_returns_403(
    token_csrf_app_and_user, monkeypatch
):
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    with app.test_client() as client:
        client.set_cookie('csrf_token', 'cookie-value', domain='localhost')
        resp = client.post(
            '/protected',
            headers={
                'Authorization': f'Bearer {token}',
                'X-CSRF-Token': 'different-value',
            },
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is False
    assert body['error']['code'] == 'CSRF_INVALID'


def test_token_required_post_missing_csrf_returns_403(
    token_csrf_app_and_user, monkeypatch
):
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.post(
            '/protected',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 403
    body = resp.get_json()
    assert body['error']['code'] == 'CSRF_INVALID'


def test_token_required_get_bypasses_csrf(token_csrf_app_and_user, monkeypatch):
    """GET requests under `@token_required` MUST NOT trigger CSRF, even
    when CSRF enforcement is on. Safe methods are unaffected."""
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    with app.test_client() as client:
        # No CSRF cookie, no CSRF header — and yet GET succeeds.
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True, 'user_id': user_id}


# ─────────────────────────────────────────────────────────────────────
# 3. Escape hatch behavior
# ─────────────────────────────────────────────────────────────────────


def test_auth_csrf_disabled_skips_check_on_token_required(
    token_csrf_app_and_user, monkeypatch
):
    """`AUTH_CSRF_DISABLED=true` MUST bypass the CSRF check entirely so
    that legacy Bearer-only test fixtures keep working."""
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    with app.test_client() as client:
        # No CSRF cookie or header — but the escape hatch lets it through.
        resp = client.post(
            '/protected',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)


def test_auth_csrf_disabled_is_case_insensitive(
    token_csrf_app_and_user, monkeypatch
):
    app, user_id = token_csrf_app_and_user
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'TRUE')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.post(
            '/protected',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200
