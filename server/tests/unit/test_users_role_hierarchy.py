"""
Unit tests for Phase 2 / Task 6.7 — Role_Hierarchy enforcement on
`POST /api/web/users` (create) and `PUT /api/web/users/<id>` (update).

Validates: Requirements 2.6, 2.7, 4H.30, 4H.31.

The controller MUST reject any request whose target role's privilege
level is greater than or equal to the actor's level (`level(R_target)
>= level(R_actor)`) with HTTP 403 and the error envelope:

    {
      "success": false,
      "error": {
        "code": "ROLE_HIERARCHY_VIOLATION",
        "actor_role": <actor.role>,
        "target_role": <attempted role>
      }
    }

The target row MUST NOT be mutated when the check rejects.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from flask import Flask

# `app` is on sys.path via tests/conftest.py.
from app import Config, db
from app.controllers.auth_controller import auth_bp
from app.controllers.users_controller import users_bp
from app.controllers._shared import level
from app.middleware import ROLE_HIERARCHY
from app.models import (
    AdminLog,
    CommunityGroup,
    OrgType,
    Organization,
    User,
)


# ── Fixtures ──────────────────────────────────────────────────────────────


def _build_app():
    """Self-contained Flask app with the users blueprint mounted."""
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True

    db.init_app(app)

    # Mount users_bp under the same `/api/web` prefix it sits under
    # in production (web_bp registers it with prefix `/users`, and
    # web_bp itself is registered at `/api/web`). For unit purposes we
    # mount it directly at `/api/web` so the URL still reads
    # `/api/web/users/...`.
    from flask import Blueprint
    web_bp = Blueprint('web', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()
    return app


def _seed_org(app, suffix=None):
    suffix = suffix or uuid.uuid4().hex[:8]
    with app.app_context():
        org_type = OrgType(name=f'TestUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'EPTU-{suffix}',
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
            group_type='staff',
        )
        db.session.add(group)
        db.session.commit()
        return org.id, group.id


def _seed_user(app, role: str, group_id: int) -> int:
    with app.app_context():
        uniq = uuid.uuid4().hex[:8]
        user = User(
            community_group_id=group_id,
            first_name=role.capitalize(),
            last_name='Tester',
            email=f'{role}-{uniq}@example.test',
            username=f'{role}_{uniq}',
            password_hash='not-used',
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
        'exp': int(
            (now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()
        ),
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


# ── level() helper invariants ─────────────────────────────────────────────


def test_level_helper_matches_role_hierarchy():
    """level() must mirror the canonical ROLE_HIERARCHY mapping for every
    documented role and return -1 for unknown roles (fail-closed)."""
    for role, expected in ROLE_HIERARCHY.items():
        assert level(role) == expected, role
    assert level('not-a-real-role') == -1
    assert level(None) == -1


# ── create_user: hierarchy rejection ──────────────────────────────────────


def test_create_user_rejects_peer_role(app_ctx):
    """An actor cannot create a user with a role at the actor's own level
    (strict `>=` rule)."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'firstName': 'Peer',
                'lastName': 'Admin',
                'email': f'peer-{uuid.uuid4().hex[:6]}@x.test',
                'password': 'StrongPass1',
                'role': 'head_admin',  # same level — must reject
                'locationId': org_id,
            },
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is False
    assert body['error']['code'] == 'ROLE_HIERARCHY_VIOLATION'
    assert body['error']['actor_role'] == 'head_admin'
    assert body['error']['target_role'] == 'head_admin'


def test_create_user_rejects_higher_role(app_ctx):
    """An actor cannot create a user above their own level."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'firstName': 'Up',
                'lastName': 'Above',
                'email': f'above-{uuid.uuid4().hex[:6]}@x.test',
                'password': 'StrongPass1',
                'role': 'superadmin',
                'locationId': org_id,
            },
        )

    assert resp.status_code == 403
    body = resp.get_json()
    assert body['error']['code'] == 'ROLE_HIERARCHY_VIOLATION'
    assert body['error']['target_role'] == 'superadmin'


def test_create_user_does_not_persist_on_violation(app_ctx):
    """A 403 hierarchy rejection MUST NOT persist a User row."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')
    target_email = f'never-{uuid.uuid4().hex[:6]}@x.test'

    with app_ctx.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'firstName': 'Never',
                'lastName': 'Made',
                'email': target_email,
                'password': 'StrongPass1',
                'role': 'superadmin',
                'locationId': org_id,
            },
        )

    assert resp.status_code == 403
    with app_ctx.app_context():
        assert User.query.filter_by(email=target_email).first() is None


def test_create_user_allows_strictly_lower_role(app_ctx):
    """Sanity check: a head_admin actor CAN create a user with a strictly
    lower role (auditor)."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')
    email = f'lower-{uuid.uuid4().hex[:6]}@x.test'

    with app_ctx.test_client() as client:
        resp = client.post(
            '/api/web/users',
            headers={'Authorization': f'Bearer {token}'},
            json={
                'firstName': 'Lower',
                'lastName': 'Allowed',
                'email': email,
                'password': 'StrongPass1',
                'role': 'auditor',
                'locationId': org_id,
            },
        )

    assert resp.status_code == 201, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['success'] is True
    assert body['user']['role'] == 'auditor'


# ── update_user: hierarchy rejection ──────────────────────────────────────


def test_update_user_rejects_role_change_at_or_above_actor(app_ctx):
    """An actor cannot UPDATE a user's role to any value at or above the
    actor's own level. The target row MUST NOT be mutated on rejection."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    target_id = _seed_user(app_ctx, 'auditor', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={'Authorization': f'Bearer {token}'},
            json={'role': 'head_admin', 'firstName': 'Mutated'},
        )

    assert resp.status_code == 403, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body['error']['code'] == 'ROLE_HIERARCHY_VIOLATION'
    assert body['error']['actor_role'] == 'head_admin'
    assert body['error']['target_role'] == 'head_admin'

    # Target row MUST NOT be mutated — neither `role` nor `first_name`.
    with app_ctx.app_context():
        target = db.session.get(User, target_id)
        assert target.role == 'auditor'
        assert target.first_name != 'Mutated'


def test_update_user_allows_no_role_change(app_ctx):
    """When the request does not change `role`, hierarchy check does not
    fire and other field updates proceed normally."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    target_id = _seed_user(app_ctx, 'auditor', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={'Authorization': f'Bearer {token}'},
            json={'firstName': 'Renamed'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    with app_ctx.app_context():
        target = db.session.get(User, target_id)
        assert target.first_name == 'Renamed'
        assert target.role == 'auditor'


def test_update_user_skips_check_when_role_unchanged(app_ctx):
    """If `role` is in the body but equals the current role, the hierarchy
    check is skipped (no spurious 403 on no-op role assignments)."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    target_id = _seed_user(app_ctx, 'auditor', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={'Authorization': f'Bearer {token}'},
            json={'role': 'auditor', 'firstName': 'NoOp'},
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)


def test_update_user_writes_admin_log_on_violation(app_ctx):
    """A hierarchy violation on update MUST emit an AdminLog entry so the
    audit trail captures the attempted privilege escalation (Requirement 2.8)."""
    org_id, group_id = _seed_org(app_ctx)
    actor_id = _seed_user(app_ctx, 'head_admin', group_id)
    target_id = _seed_user(app_ctx, 'auditor', group_id)
    token = _mint_jwt(app_ctx, actor_id, 'head_admin')

    with app_ctx.app_context():
        before = AdminLog.query.count()

    with app_ctx.test_client() as client:
        resp = client.put(
            f'/api/web/users/{target_id}',
            headers={'Authorization': f'Bearer {token}'},
            json={'role': 'superadmin'},
        )

    assert resp.status_code == 403
    with app_ctx.app_context():
        after = AdminLog.query.count()
        assert after == before + 1
        latest = AdminLog.query.order_by(AdminLog.id.desc()).first()
        assert latest.action == 'role_hierarchy_violation'
        assert latest.admin_user_id == actor_id
        assert latest.category == 'users'
