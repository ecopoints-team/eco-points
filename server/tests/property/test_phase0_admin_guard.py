"""
Phase 0 / Property A — Universal admin guard.

Validates: Requirements 0.1, 0.2, 0.3, 0.6, 0.8, 0.10, 2.10.

For every decorator D in {admin_required, permission_required}, every HTTP
method M in {GET, POST, PUT, PATCH, DELETE}, and every authenticated user
whose role is not in ADMIN_ROLE_SET, applying D to a stub handler and
invoking it via a Flask test client with method M MUST produce HTTP 403
with `error.code == "ADMIN_REQUIRED"`.

The test mounts a stub Flask app, seeds one User per non-admin role with a
real CommunityGroup/Organization parent chain (token_required does a DB
lookup), mints a JWT for the chosen role, and asserts the universal
invariant.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask, jsonify
from hypothesis import HealthCheck, given, settings, strategies as st

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.middleware import (
    ADMIN_ROLE_SET,
    admin_required,
    permission_required,
    token_required,
)
from app.models import CommunityGroup, OrgType, Organization, User


# Roles intentionally outside ADMIN_ROLE_SET. Per Phase 0, these MUST receive
# 403 ADMIN_REQUIRED on every decorator and every HTTP method.
NON_ADMIN_ROLES = ('user', 'dependent')

# Every HTTP method the property MUST cover (Requirement 0.8).
HTTP_METHODS = ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')

# The two decorators that share the universal admin guard (Phase 0).
DECORATOR_NAMES = ('admin_required', 'permission_required')


def _stub_handler(current_user):
    """Stub route body. Should never run for non-admin roles in this test."""
    return jsonify({'success': True, 'role': current_user.role}), 200


def _build_app():
    """Construct a self-contained Flask app with an in-memory schema and the
    two decorator stacks under test wired to stub routes for every method.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS

    db.init_app(app)

    # admin_required stack: token_required → admin_required → handler.
    admin_view = token_required(admin_required(_stub_handler))
    # permission_required stack: token_required → permission_required(...) → handler.
    perm_view = token_required(permission_required('users')(_stub_handler))

    for method in HTTP_METHODS:
        app.add_url_rule(
            '/admin-stub',
            endpoint=f'admin_stub_{method}',
            view_func=admin_view,
            methods=[method],
        )
        app.add_url_rule(
            '/perm-stub',
            endpoint=f'perm_stub_{method}',
            view_func=perm_view,
            methods=[method],
        )

    with app.app_context():
        db.create_all()

    return app


def _seed_users(app):
    """Insert one User row per role in NON_ADMIN_ROLES under a single
    Organization → CommunityGroup parent chain. Returns a dict
    `{role: user_id}`.
    """
    user_ids = {}
    with app.app_context():
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

        for role in NON_ADMIN_ROLES:
            # Unique email/username per role; password not exercised here.
            uniq = uuid.uuid4().hex[:8]
            user = User(
                community_group_id=group.id,
                first_name=role.capitalize(),
                last_name='Tester',
                email=f'{role}-{uniq}@example.test',
                username=f'{role}_{uniq}',
                password_hash='not-used-in-this-test',
                role=role,
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()
            user_ids[role] = user.id

        db.session.commit()
    return user_ids


def _mint_jwt(app, user_id, role):
    """Issue a valid HS256 JWT for the given user. Mirrors the token shape
    issued by auth_controller.login (user_id, role, iat, exp, jti).
    """
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


@pytest.fixture(scope='module')
def app_and_users():
    """Module-scoped fixture: one Flask app, schema, and seeded non-admin users."""
    app = _build_app()
    user_ids = _seed_users(app)
    yield app, user_ids
    # Drop the schema so a re-run of the suite starts clean.
    with app.app_context():
        db.session.remove()
        db.drop_all()


# ── Hypothesis strategies ───────────────────────────────────────────
def non_admin_roles():
    return st.sampled_from(NON_ADMIN_ROLES)


def http_methods():
    return st.sampled_from(HTTP_METHODS)


def decorators():
    return st.sampled_from(DECORATOR_NAMES)


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(role=non_admin_roles(), method=http_methods(), decorator=decorators())
def test_universal_admin_guard(app_and_users, role, method, decorator):
    """Property A: non-admin roles SHALL receive HTTP 403 ADMIN_REQUIRED on
    every (decorator, method) combination, regardless of HTTP verb.
    """
    app, user_ids = app_and_users
    user_id = user_ids[role]
    token = _mint_jwt(app, user_id, role)

    path = '/admin-stub' if decorator == 'admin_required' else '/perm-stub'

    with app.test_client() as client:
        resp = client.open(
            path,
            method=method,
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 403, (
        f'Expected 403 for role={role!r} method={method!r} decorator={decorator!r}, '
        f'got {resp.status_code}: {resp.get_data(as_text=True)}'
    )
    body = resp.get_json()
    assert body is not None, 'Response body must be JSON'
    assert body.get('success') is False, body
    err = body.get('error')
    assert isinstance(err, dict), f'error must be a dict, got {err!r}'
    assert err.get('code') == 'ADMIN_REQUIRED', (
        f'expected error.code == "ADMIN_REQUIRED" for role={role!r} '
        f'method={method!r} decorator={decorator!r}, got body={body!r}'
    )
