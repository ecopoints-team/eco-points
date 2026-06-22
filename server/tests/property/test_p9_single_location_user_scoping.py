"""
Property 9: Preservation — Single-Location User Scoping

When `GET /api/web/users?location_id=<id>` is called with a specific
location scope, only users belonging to that org's community groups are
returned.

This is the PRESERVATION (¬C5) test: it exercises the scoped path of
`get_users` where `loc_id` IS set. On unfixed code this path works
correctly (the INNER JOIN is fine when a location filter is applied —
only Org A's users are in Org A's group, so the join still returns them).

Expected outcome on UNFIXED code: PASSES.

**Validates: Requirements 3.3**
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
# Helpers (same pattern as test_c5_all_locations_user_filter.py)
# ─────────────────────────────────────────────────────────────────────

def _mint_jwt(app: Flask, user_id: int, role: str = 'superadmin') -> str:
    """Mint HS256 JWT matching auth_controller token shape."""
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
    """OrgType → Organization → CommunityGroup chain. Returns (org_id, group_id)."""
    org_type = OrgType(name=f'P9-OrgType-{suffix}')
    db.session.add(org_type)
    db.session.flush()

    org = Organization(
        name=f'P9-ORG-{suffix}',
        full_name=f'P9 Test University {suffix}',
        type_id=org_type.id,
        status='Active',
    )
    db.session.add(org)
    db.session.flush()

    group = CommunityGroup(
        organization_id=org.id,
        name=f'P9 Default Group {suffix}',
        abbreviation=f'P9G-{suffix[:4]}',
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
        email=f'p9-{uuid.uuid4().hex[:10]}@example.test',
        password_hash='not-used',
        role=role,
        is_active=True,
    )
    db.session.add(u)
    db.session.flush()
    return u


# ─────────────────────────────────────────────────────────────────────
# Isolated module-scoped app (avoids blueprint registration conflicts)
# ─────────────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def p9_app():
    """Isolated Flask app with users_bp for P9 preservation tests."""
    app = Flask(__name__)
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': (
            'sqlite:///file:p9-test?mode=memory&cache=shared&uri=true'
        ),
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key-p9',
        'JWT_EXPIRY_HOURS': 1,
        'TESTING': True,
    })

    db.init_app(app)

    from app.controllers.users_controller import users_bp
    web_bp = Blueprint('web_p9', __name__, url_prefix='/api/web')
    web_bp.register_blueprint(users_bp)
    app.register_blueprint(web_bp)

    with app.app_context():
        db.create_all()

        suffix = uuid.uuid4().hex[:8]

        # Superadmin actor needs own org+group (model constraint)
        _, actor_group_id = _seed_org_and_group(f'actor-{suffix}')
        actor = _create_user(actor_group_id, role='superadmin', suffix='actor')
        db.session.commit()
        actor_id = actor.id

    yield app, actor_id

    with app.app_context():
        db.session.remove()


# ─────────────────────────────────────────────────────────────────────
# P9 Preservation Test — MUST PASS on unfixed code
# ─────────────────────────────────────────────────────────────────────

def test_p9_single_location_scoping_returns_only_that_orgs_users(p9_app, monkeypatch):
    """
    Property 9: Preservation — Single-Location User Scoping.

    **Validates: Requirements 3.3**

    Setup:
        1. Seed Org A + Group A → 2 users (user_a1, user_a2)
        2. Seed Org B + Group B → 2 users (user_b1, user_b2)
        3. Superadmin calls GET /api/web/users?location_id=<org_a_id>

    Assertions:
        - Response 200 with success=True
        - All returned users have community_group_id == group_a_id
        - Neither user_b1 nor user_b2 appears in the response
        - At least one Org A user appears (seed sanity check)

    Expected outcome on UNFIXED code: PASSES.
    The scoped path (loc_id set → filter applied) works correctly even
    before the C5 fix because the INNER JOIN correctly returns users
    when a location filter limits results to a valid org.
    """
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    app, actor_id = p9_app

    with app.app_context():
        suffix = uuid.uuid4().hex[:8]

        # Org A — the org we will scope to
        org_a_id, group_a_id = _seed_org_and_group(f'orgA-{suffix}')
        user_a1 = _create_user(group_a_id, role='user', suffix=f'a1-{suffix}')
        user_a2 = _create_user(group_a_id, role='user', suffix=f'a2-{suffix}')
        user_a1_id = user_a1.id
        user_a2_id = user_a2.id

        # Org B — should be excluded from the scoped response
        _, group_b_id = _seed_org_and_group(f'orgB-{suffix}')
        user_b1 = _create_user(group_b_id, role='user', suffix=f'b1-{suffix}')
        user_b2 = _create_user(group_b_id, role='user', suffix=f'b2-{suffix}')
        user_b1_id = user_b1.id
        user_b2_id = user_b2.id

        db.session.commit()

    token = _mint_jwt(app, actor_id)

    with app.test_client() as client:
        # Superadmin with ?location_id= triggers the scoped path in
        # _scope_location_id: request.args.get('location_id', type=int)
        resp = client.get(
            f'/api/web/users?location_id={org_a_id}',
            headers={'Authorization': f'Bearer {token}'},
        )

    assert resp.status_code == 200, (
        f'GET /api/web/users?location_id={org_a_id} returned {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )

    body = resp.get_json()
    assert body is not None and body.get('success') is True, (
        f'Expected success=True; got {body!r}'
    )

    returned_users = body.get('users', [])
    returned_ids = {u['id'] for u in returned_users}
    returned_group_ids = {u['communityGroupId'] for u in returned_users}

    # ── Core assertion 1: Org B users must NOT appear ─────────────────
    org_b_ids_in_response = {user_b1_id, user_b2_id} & returned_ids
    assert not org_b_ids_in_response, (
        f'SCOPING VIOLATION (P9): Org B users leaked into Org A scoped response.\n'
        f'  Leaked IDs: {org_b_ids_in_response}\n'
        f'  Returned IDs: {sorted(returned_ids)}\n'
        f'  location_id filter was: org_a_id={org_a_id}\n'
        f'  group_b_id={group_b_id} — users from this group must be excluded.'
    )

    # ── Core assertion 2: all returned users belong to Org A's group ──
    # (Covers the case where some other org's users sneak in)
    foreign_group_users = [
        u for u in returned_users
        if u['communityGroupId'] != group_a_id
    ]
    assert not foreign_group_users, (
        f'SCOPING VIOLATION (P9): response contains users not in group_a_id={group_a_id}.\n'
        f'  Foreign-group users: {foreign_group_users}'
    )

    # ── Sanity: at least one Org A user appears ────────────────────────
    org_a_ids_in_response = {user_a1_id, user_a2_id} & returned_ids
    assert org_a_ids_in_response, (
        f'SEED SANITY FAILED (P9): no Org A users appeared in scoped response.\n'
        f'  Expected at least one of: {user_a1_id}, {user_a2_id}\n'
        f'  Returned IDs: {sorted(returned_ids)}'
    )
