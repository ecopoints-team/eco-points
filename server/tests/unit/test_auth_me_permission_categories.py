"""
Unit test for Phase 2 / Task 6.3 — `GET /api/web/auth/me` returns
`permission_categories` alongside `role`.

Validates: Requirement 2.3.

The serializer `auth_controller._serialize_auth_user` MUST project
`sorted(ROLE_PERMISSIONS.get(user.role, []))` into the response body so
the Admin_UI can drive page guards and sidebar filtering. Non-admin roles
(`user`, `dependent`) are absent from `ROLE_PERMISSIONS` by design and
therefore receive an empty list.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.controllers.auth_controller import auth_bp, _serialize_auth_user
from app.middleware import ROLE_PERMISSIONS
from app.models import CommunityGroup, OrgType, Organization, User


# ── Fixtures ──────────────────────────────────────────────────────────────


def _build_app():
    """Self-contained Flask app with the auth blueprint mounted and an
    in-memory SQLite schema.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS

    db.init_app(app)

    # Register the real auth blueprint so the live `/me` route is exercised.
    # The `limiter` extension is referenced inside the controller; we don't
    # need to init it for /me which has no rate limit.
    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed_user(app, role: str) -> int:
    """Insert one User with the given role under a fresh org+group.

    Returns the user's primary-key id.
    """
    with app.app_context():
        uniq = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'TestUni-{uniq}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'EPTU-{uniq}',
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
        db.session.commit()
        return user.id


def _mint_jwt(app, user_id: int, role: str) -> str:
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
def app_ctx():
    app = _build_app()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


# ── Tests ─────────────────────────────────────────────────────────────────


@pytest.mark.parametrize('role', sorted(ROLE_PERMISSIONS.keys()))
def test_serialize_auth_user_includes_sorted_permission_categories_for_admin_roles(app_ctx, role):
    """Each admin role's serialized payload MUST carry a sorted list of its
    ROLE_PERMISSIONS entries under `permission_categories`.
    """
    user_id = _seed_user(app_ctx, role)
    with app_ctx.app_context():
        user = db.session.get(User, user_id)
        payload = _serialize_auth_user(user)

    expected = sorted(ROLE_PERMISSIONS[role])
    assert payload['role'] == role
    assert 'permission_categories' in payload, payload
    assert payload['permission_categories'] == expected
    # Must be a plain list (deterministic JSON output, not a set).
    assert isinstance(payload['permission_categories'], list)


@pytest.mark.parametrize('role', ['user', 'dependent'])
def test_serialize_auth_user_returns_empty_categories_for_non_admin_roles(app_ctx, role):
    """Non-admin roles are absent from ROLE_PERMISSIONS by design and MUST
    receive an empty list under `permission_categories`.
    """
    user_id = _seed_user(app_ctx, role)
    with app_ctx.app_context():
        user = db.session.get(User, user_id)
        payload = _serialize_auth_user(user)

    assert payload['role'] == role
    assert payload['permission_categories'] == []


def test_get_me_endpoint_returns_role_and_permission_categories(app_ctx):
    """End-to-end check: `GET /api/web/auth/me` MUST surface both `role` and
    `permission_categories` (sorted) in the user payload.
    """
    role = 'auditor'
    user_id = _seed_user(app_ctx, role)
    token = _mint_jwt(app_ctx, user_id, role)

    with app_ctx.test_client() as client:
        resp = client.get(
            '/api/web/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is True
    user_obj = body['user']
    assert user_obj['role'] == role
    assert user_obj['permission_categories'] == sorted(ROLE_PERMISSIONS[role])


def test_serialize_auth_user_includes_per_verb_permissions(app_ctx):
    """The /auth/me payload MUST include a per-verb `permissions` object
    derived from app.permissions.permissions_for_role."""
    from app.permissions import permissions_for_role

    user_id = _seed_user(app_ctx, 'auditor')
    with app_ctx.app_context():
        user = db.session.get(User, user_id)
        payload = _serialize_auth_user(user)

    assert 'permissions' in payload
    assert payload['permissions'] == permissions_for_role('auditor')
    # auditor can view users but not edit
    assert 'view' in payload['permissions']['users']
    assert 'edit' not in payload['permissions'].get('users', [])
