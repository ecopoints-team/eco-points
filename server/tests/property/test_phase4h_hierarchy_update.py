"""
Phase 4H / Property I — Role-hierarchy on mutation (update variant).

**Validates: Requirements 2.6, 2.7, 4H.30, 4H.31**

For every ``(actor_role, target_role)`` pair where
``level(target_role) >= level(actor_role)``:

  * ``op = create`` (POST /api/web/users):
    Assert HTTP 403 with ``error.code == "ROLE_HIERARCHY_VIOLATION"``
    and the user was NOT created (row count unchanged).

  * ``op = update`` (PUT /api/web/users/<id>):
    Assert HTTP 403 with ``error.code == "ROLE_HIERARCHY_VIOLATION"``
    and the target row is unchanged (role and first_name unmodified).

Scope notes
-----------
Only actor roles that have the ``users`` permission category can reach
the hierarchy check — roles without ``users`` permission are blocked by
``@permission_required('users')`` before the hierarchy guard fires.
That is Property G's territory, not Property I's.  This test therefore
restricts ``actor_role`` to roles in ``ROLE_PERMISSIONS`` that include
``'users'``: ``superadmin`` and ``head_admin``.

For the update path the test sends a ``role`` value that is *different*
from the target user's current role (the controller only fires the
hierarchy check when ``data['role'] != user.role``).  The target user
is seeded with a role strictly below the actor's level so the update
request is otherwise valid; the hierarchy violation comes from the
*attempted* new role being at or above the actor's level.

``AUTH_CSRF_DISABLED=true`` is set so the CSRF double-submit check does
not interfere (we are testing role-hierarchy, not CSRF).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from flask import Blueprint, Flask
from hypothesis import HealthCheck, assume, given, settings, strategies as st

from app import Config, db
from app.controllers._shared import level
from app.middleware import ADMIN_ROLE_SET, ROLE_HIERARCHY, ROLE_PERMISSIONS


# ─────────────────────────────────────────────────────────────────────
# Role sets
# ─────────────────────────────────────────────────────────────────────

# All roles in the hierarchy, ordered by level.
ALL_ROLES = sorted(ROLE_HIERARCHY.keys(), key=lambda r: ROLE_HIERARCHY[r])

# Actor roles: only admin roles that have the 'users' permission can
# reach the hierarchy check.  Roles without 'users' permission are
# blocked by @permission_required('users') before the hierarchy guard
# fires — that is Property G's territory.
ACTOR_ROLES = sorted(
    role for role in ADMIN_ROLE_SET
    if 'users' in ROLE_PERMISSIONS.get(role, set())
)

# Target roles for the *attempted* role assignment: any role in the
# hierarchy can be the target of a create/update attempt.
TARGET_ROLES = ALL_ROLES

# A "low" role that is strictly below every actor role — used as the
# current role of the target user in the update path so the hierarchy
# check fires on the *attempted* new role, not on the existing role.
# 'user' (level 1) is below every admin role (level 2+).
_LOW_ROLE = 'user'


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────

from app.models import CommunityGroup, OrgType, Organization, User


@pytest.fixture(scope='module')
def hierarchy_app():
    """Self-contained Flask app with the real ``users_bp`` registered.

    Seeds:
      - One Organization → CommunityGroup chain.
      - One actor User per role in ``ACTOR_ROLES``.
      - One target User with role ``_LOW_ROLE`` (used as the PUT target).

    Returns ``(app, actor_ids, target_id, org_id, group_id)`` where
    ``actor_ids`` is a ``{role: user_id}`` dict and ``target_id`` is the
    id of the single low-role target user.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = (
        'sqlite:///file:hierarchy-update-test?mode=memory&cache=shared&uri=true'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key-hierarchy-update'
    app.config['JWT_EXPIRY_HOURS'] = 1
    app.config['TESTING'] = True

    db.init_app(app)

    # Register the real users_bp under /api/web/users
    from app.controllers.users_controller import users_bp

    web_bp = Blueprint('web_hierarchy_update', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'HierarchyUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'HIER-{suffix}',
            full_name='Hierarchy Test University',
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
        db.session.flush()

        actor_ids: dict[str, int] = {}
        for role in ACTOR_ROLES:
            uniq = uuid.uuid4().hex[:8]
            user = User(
                community_group_id=group.id,
                first_name=role.replace('_', ' ').title(),
                last_name='Actor',
                email=f'actor-{role}-{uniq}@example.test',
                username=f'actor_{role}_{uniq}',
                password_hash='not-used-directly',
                role=role,
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()
            actor_ids[role] = user.id

        # One target user with a low role (strictly below every actor role).
        # The update path will attempt to change this user's role to a
        # target_role that is at or above the actor's level.
        uniq = uuid.uuid4().hex[:8]
        target_user = User(
            community_group_id=group.id,
            first_name='Original',
            last_name='Target',
            email=f'target-low-{uniq}@example.test',
            username=f'target_low_{uniq}',
            password_hash='not-used-directly',
            role=_LOW_ROLE,
            is_active=True,
        )
        db.session.add(target_user)
        db.session.flush()
        target_id = target_user.id

        db.session.commit()

        org_id = org.id
        group_id = group.id

    yield app, actor_ids, target_id, org_id, group_id

    with app.app_context():
        db.session.remove()


# ─────────────────────────────────────────────────────────────────────
# JWT helper
# ─────────────────────────────────────────────────────────────────────


def _mint_jwt(app: Flask, user_id: int, role: str) -> str:
    """Mint an HS256 JWT mirroring the auth_controller.login token shape."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=app.config['JWT_EXPIRY_HOURS'])).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return pyjwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ─────────────────────────────────────────────────────────────────────
# Hypothesis strategies
# ─────────────────────────────────────────────────────────────────────


def actor_roles():
    """Sample any admin role that has the 'users' permission."""
    return st.sampled_from(ACTOR_ROLES)


def target_roles():
    """Sample any role in the hierarchy."""
    return st.sampled_from(TARGET_ROLES)


def ops():
    """Sample either 'create' or 'update'."""
    return st.sampled_from(['create', 'update'])


# ─────────────────────────────────────────────────────────────────────
# Property I — hierarchy on mutation (create + update)
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(actor_role=actor_roles(), target_role=target_roles(), op=ops())
def test_property_i_role_hierarchy_on_mutation(
    hierarchy_app, monkeypatch, actor_role, target_role, op
):
    """Property I — Role-hierarchy on mutation (update variant).

    **Validates: Requirements 2.6, 2.7, 4H.30, 4H.31**

    For every (actor_role, target_role) pair where
    ``level(target_role) >= level(actor_role)``:

      * op=create: POST /api/web/users MUST return HTTP 403 with
        ``error.code == "ROLE_HIERARCHY_VIOLATION"`` and the user MUST
        NOT be created (row count unchanged).

      * op=update: PUT /api/web/users/<id> MUST return HTTP 403 with
        ``error.code == "ROLE_HIERARCHY_VIOLATION"`` and the target row
        MUST be unchanged (role and first_name unmodified).

    Pairs where ``level(target_role) < level(actor_role)`` are skipped
    via ``assume()`` — those are the success path, not the denial domain.
    """
    # Only test the denial domain: target level >= actor level.
    assume(level(target_role) >= level(actor_role))

    app, actor_ids, target_id, org_id, group_id = hierarchy_app

    # Disable CSRF so the test focuses on role-hierarchy, not CSRF.
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    actor_id = actor_ids[actor_role]
    token = _mint_jwt(app, actor_id, actor_role)

    if op == 'create':
        # ── Create path ──────────────────────────────────────────────
        # Count users before the request; the count MUST be unchanged
        # after a hierarchy-rejected create.
        with app.app_context():
            before_count = User.query.count()

        unique_email = f'hier-create-{uuid.uuid4().hex[:12]}@example.test'

        with app.test_client() as client:
            resp = client.post(
                '/api/web/users',
                json={
                    'firstName': 'Blocked',
                    'lastName': 'Create',
                    'email': unique_email,
                    'password': 'StrongPass1',
                    'role': target_role,
                    'locationId': org_id,
                    'groupId': group_id,
                },
                headers={'Authorization': f'Bearer {token}'},
            )

        assert resp.status_code == 403, (
            f'Expected HTTP 403 for actor_role={actor_role!r} '
            f'target_role={target_role!r} op=create; '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )

        body = resp.get_json()
        assert body is not None, 'Response body must be JSON'
        assert body.get('success') is False, (
            f'Expected success=False; got {body!r}'
        )
        err = body.get('error')
        assert isinstance(err, dict), f'error must be a dict; got {err!r}'
        assert err.get('code') == 'ROLE_HIERARCHY_VIOLATION', (
            f'Expected error.code == "ROLE_HIERARCHY_VIOLATION" for '
            f'actor_role={actor_role!r} target_role={target_role!r} op=create; '
            f'got {err!r}'
        )
        assert err.get('actor_role') == actor_role, (
            f'Expected error.actor_role == {actor_role!r}; got {err!r}'
        )
        assert err.get('target_role') == target_role, (
            f'Expected error.target_role == {target_role!r}; got {err!r}'
        )

        # Row count MUST be unchanged (no partial write).
        with app.app_context():
            after_count = User.query.count()
        assert after_count == before_count, (
            f'Expected user count unchanged ({before_count}) after hierarchy '
            f'rejection on create; got {after_count} '
            f'(actor_role={actor_role!r} target_role={target_role!r})'
        )

    else:
        # ── Update path ──────────────────────────────────────────────
        # The target user has role _LOW_ROLE (strictly below every actor).
        # We attempt to change the role to target_role (at or above actor).
        # The hierarchy check MUST fire and reject the request.
        # Both the role AND the first_name change MUST be rejected atomically.

        # Snapshot the target row before the request.
        with app.app_context():
            target_before = db.session.get(User, target_id)
            role_before = target_before.role
            first_name_before = target_before.first_name

        with app.test_client() as client:
            resp = client.put(
                f'/api/web/users/{target_id}',
                json={
                    'role': target_role,
                    'firstName': 'MutatedByHierarchyViolation',
                },
                headers={'Authorization': f'Bearer {token}'},
            )

        assert resp.status_code == 403, (
            f'Expected HTTP 403 for actor_role={actor_role!r} '
            f'target_role={target_role!r} op=update; '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )

        body = resp.get_json()
        assert body is not None, 'Response body must be JSON'
        assert body.get('success') is False, (
            f'Expected success=False; got {body!r}'
        )
        err = body.get('error')
        assert isinstance(err, dict), f'error must be a dict; got {err!r}'
        assert err.get('code') == 'ROLE_HIERARCHY_VIOLATION', (
            f'Expected error.code == "ROLE_HIERARCHY_VIOLATION" for '
            f'actor_role={actor_role!r} target_role={target_role!r} op=update; '
            f'got {err!r}'
        )
        assert err.get('actor_role') == actor_role, (
            f'Expected error.actor_role == {actor_role!r}; got {err!r}'
        )
        assert err.get('target_role') == target_role, (
            f'Expected error.target_role == {target_role!r}; got {err!r}'
        )

        # Target row MUST be byte-identical before and after the rejection.
        with app.app_context():
            target_after = db.session.get(User, target_id)
            assert target_after.role == role_before, (
                f'Target role was mutated! Before={role_before!r} '
                f'After={target_after.role!r} '
                f'(actor_role={actor_role!r} target_role={target_role!r})'
            )
            assert target_after.first_name == first_name_before, (
                f'Target first_name was mutated! Before={first_name_before!r} '
                f'After={target_after.first_name!r} '
                f'(actor_role={actor_role!r} target_role={target_role!r})'
            )


# ─────────────────────────────────────────────────────────────────────
# Exhaustive coverage smoke test
# ─────────────────────────────────────────────────────────────────────


def test_property_i_exhaustive_coverage(hierarchy_app, monkeypatch):
    """Exhaustive smoke test: every (actor_role, target_role) pair in the
    denial domain MUST produce HTTP 403 ROLE_HIERARCHY_VIOLATION for both
    create and update operations.

    Actor roles are restricted to those with 'users' permission.
    With 2 actor roles (superadmin, head_admin) × 7 target roles = 14
    pairs, of which the denial domain covers the majority, this is fast
    and deterministic.
    """
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    app, actor_ids, target_id, org_id, group_id = hierarchy_app
    failures: list[str] = []

    for actor_role in ACTOR_ROLES:
        for target_role in TARGET_ROLES:
            if level(target_role) < level(actor_role):
                continue  # success path — not the denial domain

            actor_id = actor_ids[actor_role]
            token = _mint_jwt(app, actor_id, actor_role)

            # ── create ──────────────────────────────────────────────
            unique_email = f'exhaust-{uuid.uuid4().hex[:12]}@example.test'
            with app.app_context():
                before_count = User.query.count()

            with app.test_client() as client:
                resp = client.post(
                    '/api/web/users',
                    json={
                        'firstName': 'Exhaust',
                        'lastName': 'Create',
                        'email': unique_email,
                        'password': 'StrongPass1',
                        'role': target_role,
                        'locationId': org_id,
                        'groupId': group_id,
                    },
                    headers={'Authorization': f'Bearer {token}'},
                )

            if resp.status_code != 403:
                failures.append(
                    f'create actor={actor_role!r} target={target_role!r}: '
                    f'expected 403, got {resp.status_code}: '
                    f'{resp.get_data(as_text=True)}'
                )
            else:
                body = resp.get_json() or {}
                err = body.get('error') or {}
                if err.get('code') != 'ROLE_HIERARCHY_VIOLATION':
                    failures.append(
                        f'create actor={actor_role!r} target={target_role!r}: '
                        f'wrong error code, got {body!r}'
                    )
                with app.app_context():
                    after_count = User.query.count()
                if after_count != before_count:
                    failures.append(
                        f'create actor={actor_role!r} target={target_role!r}: '
                        f'row count changed ({before_count} → {after_count})'
                    )

            # ── update ──────────────────────────────────────────────
            # The target user has _LOW_ROLE; we attempt to change it to
            # target_role (at or above actor level).
            with app.app_context():
                t = db.session.get(User, target_id)
                role_before = t.role
                fname_before = t.first_name

            with app.test_client() as client:
                resp = client.put(
                    f'/api/web/users/{target_id}',
                    json={
                        'role': target_role,
                        'firstName': 'ExhaustMutated',
                    },
                    headers={'Authorization': f'Bearer {token}'},
                )

            if resp.status_code != 403:
                failures.append(
                    f'update actor={actor_role!r} target={target_role!r}: '
                    f'expected 403, got {resp.status_code}: '
                    f'{resp.get_data(as_text=True)}'
                )
            else:
                body = resp.get_json() or {}
                err = body.get('error') or {}
                if err.get('code') != 'ROLE_HIERARCHY_VIOLATION':
                    failures.append(
                        f'update actor={actor_role!r} target={target_role!r}: '
                        f'wrong error code, got {body!r}'
                    )
                with app.app_context():
                    t_after = db.session.get(User, target_id)
                    if t_after.role != role_before:
                        failures.append(
                            f'update actor={actor_role!r} target={target_role!r}: '
                            f'role mutated ({role_before!r} → {t_after.role!r})'
                        )
                    if t_after.first_name != fname_before:
                        failures.append(
                            f'update actor={actor_role!r} target={target_role!r}: '
                            f'first_name mutated ({fname_before!r} → {t_after.first_name!r})'
                        )

    assert not failures, (
        'Property I exhaustive coverage failures:\n  - '
        + '\n  - '.join(failures)
    )
