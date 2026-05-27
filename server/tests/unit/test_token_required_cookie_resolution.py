"""
Unit tests for Phase 4B / Task 11.2 — `@token_required` token source resolution.

Validates: Requirement 4B.12.

Covers four behaviors of the cookie-first token source resolution in
`app.middleware.token_required`:

1. **Cookie present** → cookie token is validated; ``Authorization`` header
   is NOT consulted (even if it carries a valid Bearer token, the cookie
   wins).
2. **Cookie absent + AUTH_COOKIE_ONLY != 'true'** → falls back to the
   ``Authorization: Bearer`` header (default backward-compatibility path).
3. **Cookie absent + AUTH_COOKIE_ONLY == 'true'** → returns HTTP 401 with
   "missing token" even if a Bearer header is present.
4. **Cookie present-but-invalid** → returns HTTP 401 (does NOT fall back
   to the Bearer header, even when the header would have worked).

These cases are deterministic, so they are unit tests rather than property
tests (Property P in task 11.8 covers the (cookie, header, AUTH_COOKIE_ONLY)
truth table exhaustively).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, jsonify

from app import Config, db
from app.middleware import token_required
from app.models import CommunityGroup, OrgType, Organization, User


def _stub_handler(current_user):
    return jsonify({'success': True, 'user_id': current_user.id}), 200


@pytest.fixture(scope='module')
def app_and_user():
    """Self-contained Flask app, in-memory schema, one seeded user, and a
    `/protected` route wired through `@token_required`.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS

    db.init_app(app)

    app.add_url_rule(
        '/protected',
        endpoint='protected',
        view_func=token_required(_stub_handler),
        methods=['GET'],
    )

    with app.app_context():
        db.create_all()

        org_type = OrgType(name='TestUniversity')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name='EPTU',
            full_name='EcoPoints Test University',
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

        uniq = uuid.uuid4().hex[:8]
        user = User(
            community_group_id=group.id,
            first_name='Cookie',
            last_name='Tester',
            email=f'cookie-{uniq}@example.test',
            username=f'cookie_{uniq}',
            password_hash='not-used-here',
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
            'exp': int((now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()),
            'jti': uuid.uuid4().hex,
        },
        app.config['SECRET_KEY'],
        algorithm='HS256',
    )


# ── 1. Cookie present → used (header ignored) ─────────────────────────
def test_cookie_token_is_used_when_present(app_and_user, monkeypatch):
    app, user_id = app_and_user
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    valid_token = _mint(app, user_id)

    with app.test_client() as client:
        client.set_cookie('token', valid_token, domain='localhost')
        # Header carries a junk token, but cookie wins → 200.
        resp = client.get(
            '/protected',
            headers={'Authorization': 'Bearer THIS-WOULD-FAIL-IF-USED'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True, 'user_id': user_id}


# ── 2. Cookie absent, AUTH_COOKIE_ONLY != 'true' → header fallback ────
def test_bearer_fallback_when_cookie_absent_and_cookie_only_false(app_and_user, monkeypatch):
    app, user_id = app_and_user
    monkeypatch.setenv('AUTH_COOKIE_ONLY', 'false')
    valid_token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {valid_token}'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    assert resp.get_json() == {'success': True, 'user_id': user_id}


def test_bearer_fallback_when_auth_cookie_only_unset(app_and_user, monkeypatch):
    """Default (env var unset) is equivalent to 'false' — Bearer header still works."""
    app, user_id = app_and_user
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    valid_token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {valid_token}'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)


# ── 3. Cookie absent, AUTH_COOKIE_ONLY == 'true' → 401 (no header fallback) ──
def test_no_bearer_fallback_when_auth_cookie_only_true(app_and_user, monkeypatch):
    app, user_id = app_and_user
    monkeypatch.setenv('AUTH_COOKIE_ONLY', 'true')
    valid_token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {valid_token}'},
        )

    assert resp.status_code == 401, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body == {'success': False, 'error': 'Authentication token is missing'}


def test_auth_cookie_only_is_case_insensitive(app_and_user, monkeypatch):
    """`AUTH_COOKIE_ONLY=TRUE` (uppercase) MUST also disable the Bearer fallback."""
    app, user_id = app_and_user
    monkeypatch.setenv('AUTH_COOKIE_ONLY', 'TRUE')
    valid_token = _mint(app, user_id)

    with app.test_client() as client:
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {valid_token}'},
        )

    assert resp.status_code == 401


# ── 4. Cookie present-but-invalid → 401 (does NOT fall back to header) ─
def test_invalid_cookie_does_not_fall_back_to_header(app_and_user, monkeypatch):
    """Per task 11.2: when the cookie is present-but-invalid, return 401.
    The header fallback only fires when the cookie is *absent*.
    """
    app, user_id = app_and_user
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)
    valid_header_token = _mint(app, user_id)

    with app.test_client() as client:
        client.set_cookie('token', 'not-a-real-jwt', domain='localhost')
        resp = client.get(
            '/protected',
            headers={'Authorization': f'Bearer {valid_header_token}'},
        )

    assert resp.status_code == 401, resp.get_data(as_text=True)
    body = resp.get_json()
    # The decoder rejects it as `InvalidTokenError`, mapped to "Invalid token".
    assert body == {'success': False, 'error': 'Invalid token'}


# ── 5. No cookie, no header → 401 ─────────────────────────────────────
def test_missing_token_returns_401(app_and_user, monkeypatch):
    app, _ = app_and_user
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    with app.test_client() as client:
        resp = client.get('/protected')

    assert resp.status_code == 401
    assert resp.get_json() == {'success': False, 'error': 'Authentication token is missing'}
