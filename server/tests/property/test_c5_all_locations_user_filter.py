"""
C5 Exploration Test — All-Locations User Filter Omits Users.

Bug Condition:
    `get_users` uses `db.session.query(User).join(CommunityGroup)` (INNER JOIN).
    When a superadmin lists users with no location scope (all locations),
    any user whose `community_group_id` points to a non-existent/deleted
    CommunityGroup row is silently dropped from the result set.

Expected Outcome on UNFIXED code:
    FAILS — the user count returned by GET /api/web/users is less than the
    total User rows in the DB (orphaned-group user is omitted).

DO NOT fix the bug when this test fails. Failure = bug confirmed.

Requirements: 1.5 (bugfix.md Req 2.5)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt as pyjwt
import pytest
from flask import Blueprint, Flask

from app import db
from app.models import CommunityGroup, OrgType, Organization, User


# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

def _mint_jwt(app: Flask, user_id: int, role: str = 'superadmin') -> str:
    """Mint an HS256 JWT matching auth_controller token shape."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return pyjwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def _seed_org_and_group(suffix: str):
    """Create an OrgType → Organization → CommunityGroup chain, return (org_id, group_id)."""
    org_type = OrgType(name=f'C5-OrgType-{suffix}')
    db.session.add(org_type)
    db.session.flush()

    org = Organization(
        name=f'C5-ORG-{suffix}',
        full_name=f'C5 Test University {suffix}',
        type_id=org_type.id,
        status='Active',
    )
    db.session.add(org)
    db.session.flush()

    group = CommunityGroup(
        organization_id=org.id,
        name=f'C5 Default Group {suffix}',
        abbreviation=f'C5G-{suffix[:4]}',
    )
    db.session.add(group)
    db.session.flush()

    return org.id, group.id


def _create_user(group_id: int, role: str = 'user', suffix: str = '') -> User:
    """Create and flush a User attached to group_id."""
    u = User(
        community_group_id=group_id,
        first_name='Test',
        last_name=f'User-{suffix or uuid.uuid4().hex[:6]}',
        email=f'c5-{uuid.uuid4().hex[:10]}@example.test',
        password_hash='not-used',
        role=role,
        is_active=True,
    )
    db.session.add(u)
    db.session.flush()
    return u


# ─────────────────────────────────────────────────────────────────────
# App fixture
# ─────────────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def c5_app():
    """Isolated Flask app with users_bp for C5 exploration tests."""
    app = Flask(__name__)
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': (
            'sqlite:///file:c5-test?mode=memory&cache=shared&uri=true'
        ),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key-c5',
        'JWT_EXPIRY_HOURS': 1,
        'TESTING': True,
    })

    db.init_app(app)

    from app.controllers.users_controller import users_bp
    web_bp = Blueprint('web_c5', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        # Seed a superadmin actor (needs a group too — model constraint)
        _, actor_group_id = _seed_org_and_group(f'actor-{suffix}')
        actor = _create_user(actor_group_id, role='superadmin', suffix='actor')
        db.session.commit()
        actor_id = actor.id

    yield app, actor_id

    with app.app_context():
        db.session.remove()


# ─────────────────────────────────────────────────────────────────────
# C5 Exploration Test — MUST FAIL on unfixed code
# ─────────────────────────────────────────────────────────────────────

def test_c5_all_locations_includes_orphaned_group_user(c5_app, monkeypatch):
    """
    Bug Condition C5 — All-Locations User Filter Omits Users.

    EXPLORATION TEST: Expected to FAIL on unfixed code.

    Setup:
        1. Create Org A + Group A → User A  (normal user, group exists)
        2. Create Org B + Group B → User B  (normal user, group will be deleted)
        3. Delete Group B — User B now has community_group_id pointing to a
           non-existent row.
        4. Superadmin (no location scope) calls GET /api/web/users.

    Assertion (Req 2.5):
        All users across all orgs are returned.
        On UNFIXED code, User B is omitted (INNER JOIN drops them) → test FAILS.
        On FIXED code (outerjoin), User B is included → test PASSES.

    Counterexample documented:
        user_b is created with community_group_id = <deleted group id>.
        GET /api/web/users returns N users.
        But User.query.count() returns N+1 (or N + however many orphaned).
        The delta proves the bug: omitted = total_in_db - returned_count.
    """
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    app, actor_id = c5_app

    with app.app_context():
        suffix = uuid.uuid4().hex[:8]

        # ── Org A: normal user with intact group ─────────────────────
        _, group_a_id = _seed_org_and_group(f'orgA-{suffix}')
        user_a = _create_user(group_a_id, role='user', suffix=f'a-{suffix}')
        user_a_id = user_a.id

        # ── Org B: user whose group will be deleted ───────────────────
        _, group_b_id = _seed_org_and_group(f'orgB-{suffix}')
        user_b = _create_user(group_b_id, role='user', suffix=f'b-{suffix}')
        user_b_id = user_b.id

        db.session.commit()

        # Delete Group B so User B becomes "orphaned" from the join perspective.
        # Use raw SQL to bypass SQLAlchemy ORM cascade (which would try to NULL
        # out community_group_id on User, violating nullable=False). SQLite does
        # not enforce FK constraints by default so the raw DELETE succeeds even
        # though users.community_group_id references community_groups.id.
        db.session.execute(
            db.text('DELETE FROM community_groups WHERE id = :gid'),
            {'gid': group_b_id},
        )
        db.session.expire_all()  # clear ORM identity map so stale objects don't interfere
        db.session.commit()

        # Verify user_b still exists in the DB (raw query, no join)
        user_b_in_db = db.session.get(User, user_b_id)
        assert user_b_in_db is not None, (
            'Pre-condition failed: user_b should still exist in the DB after group deletion'
        )

        # Count all User rows directly (no join) — includes orphaned user
        total_users_in_db = db.session.query(User).count()

    token = _mint_jwt(app, actor_id)

    with app.test_client() as client:
        # No location_id param → superadmin all-locations view
        resp = client.get(
            '/api/web/users',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, (
        f'GET /api/web/users returned {resp.status_code}: {resp.get_data(as_text=True)}'
    )

    body = resp.get_json()
    assert body is not None and body.get('success') is True, (
        f'Expected success=True; got {body!r}'
    )

    returned_users = body.get('users', [])
    returned_ids = {u['id'] for u in returned_users}

    # ── CORE ASSERTION (Req 2.5) ──────────────────────────────────────
    # user_b MUST appear in the response. On unfixed code (INNER JOIN),
    # user_b is omitted and this assertion fails — bug confirmed.
    assert user_b_id in returned_ids, (
        f'BUG CONFIRMED (C5): user_b (id={user_b_id}) was omitted from '
        f'GET /api/web/users all-locations response.\n'
        f'  Returned IDs: {sorted(returned_ids)}\n'
        f'  Total User rows in DB: {total_users_in_db}\n'
        f'  Returned user count: {len(returned_users)}\n'
        f'  Counterexample: user with community_group_id pointing to deleted '
        f'group (group_b_id={group_b_id}) is dropped by INNER JOIN in '
        f'users_controller.get_users (line 52: .join(CommunityGroup)).\n'
        f'  Fix: change .join(CommunityGroup) to .outerjoin(CommunityGroup).'
    )

    # Sanity: user_a should also appear
    assert user_a_id in returned_ids, (
        f'Unexpected: user_a (id={user_a_id}) also missing — something else is wrong.'
    )
