"""
Phase 2 / Property G — Admin granularity enforcement.

**Validates: Requirements 2.1, 2.2, 2.9**

For every (admin_role X, category C) such that C ∉ ROLE_PERMISSIONS[X],
mint a JWT for X and call any route requiring C; assert HTTP 403 and
`error.code == "FORBIDDEN"` and `error.missing == C`.

Approach
--------
- Build the live Flask app via `create_app()` (same pattern as
  `test_phase1_route_invariants.py`).
- For each permission category C used by Domain_Controllers, pick one
  representative route registered in the live `app.url_map` whose
  `@permission_required(<C>)` matches. The mapping is hard-coded against
  the route inventory documented in the design and verified at module
  import time so a missing category fails fast with a clear message.
- Seed one User per admin role under a single Organization →
  CommunityGroup parent chain (`@token_required` performs a DB lookup).
- Hypothesis enumerates `(admin_role, category)` pairs; the test filters
  to pairs where the role lacks the category, then issues a request with
  the matching method and asserts HTTP 403 + envelope shape.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from hypothesis import HealthCheck, assume, given, settings, strategies as st

# `app` is on sys.path via tests/conftest.py.
from app import create_app, db
from app.middleware import ADMIN_ROLE_SET, ROLE_PERMISSIONS
from app.models import CommunityGroup, OrgType, Organization, User


# ── (category C → representative route) map ────────────────────────
# One route per category C, drawn from the Phase 1 controller split.
# Each route is protected by `@token_required` + `@permission_required(C)`
# and has no other authorization gate stacked above it (i.e. no
# `@superadmin_required`), so a 403 with `error.missing == C` is the
# unambiguous signal that Property G is being exercised.
#
# Methods are chosen for the simplest possible request body: GET where
# possible, POST only where the category has no read endpoint without
# additional gating. The handler is exercised only as far as the
# `@permission_required` check; on a category miss the decorator returns
# 403 before the body is parsed, so an empty JSON `{}` body is enough.
CATEGORY_TO_ROUTE: dict[str, tuple[str, str]] = {
    'users':       ('GET',  '/api/web/users'),
    'machines':    ('GET',  '/api/web/machines'),
    'rewards':     ('POST', '/api/web/rewards'),
    'locations':   ('GET',  '/api/web/locations'),
    'logs':        ('GET',  '/api/web/logs/bottles'),
    'analytics':   ('GET',  '/api/web/analytics'),
    'settings':    ('GET',  '/api/web/settings/notifications'),
    'groups':      ('GET',  '/api/web/groups'),
    'sessions':    ('GET',  '/api/web/sessions/bulk'),
    'leaderboard': ('GET',  '/api/web/leaderboard'),
    'dashboard':   ('GET',  '/api/web/dashboard/stats'),
}

# Sanity-check at import time: every category in ROLE_PERMISSIONS must
# appear in CATEGORY_TO_ROUTE so the property covers the full domain.
_ALL_CATEGORIES = set().union(*ROLE_PERMISSIONS.values())
_MISSING = _ALL_CATEGORIES - set(CATEGORY_TO_ROUTE.keys())
assert not _MISSING, (
    f'CATEGORY_TO_ROUTE is missing representative routes for categories: '
    f'{sorted(_MISSING)}'
)


# ── Fixtures ──────────────────────────────────────────────────────
# The session-scoped `app` fixture is provided by
# `server/tests/property/conftest.py` so that both this module and
# `test_phase1_route_invariants.py` share the same `create_app()` call.
# Defining a per-module fixture here — even at session scope — would
# instantiate a second fixture function and trigger a duplicate
# `web_bp.register_blueprint(...)` (Flask raises once that blueprint has
# been finalised).
@pytest.fixture(scope='session')
def admin_user_ids(app):
    """Seed one User per role in `ADMIN_ROLE_SET` under a single
    Organization → CommunityGroup parent chain. Returns a dict
    `{role: user_id}`.
    """
    user_ids: dict[str, int] = {}
    with app.app_context():
        org_type = OrgType(name=f'TestUni-{uuid.uuid4().hex[:8]}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'EPTU-{uuid.uuid4().hex[:8]}',
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

        for role in sorted(ADMIN_ROLE_SET):
            uniq = uuid.uuid4().hex[:8]
            user = User(
                community_group_id=group.id,
                first_name=role.replace('_', ' ').title(),
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


# ── JWT helper ────────────────────────────────────────────────────
def _mint_jwt(app, user_id: int, role: str) -> str:
    """Mint an HS256 JWT mirroring the auth_controller.login token shape."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ── Hypothesis strategies ─────────────────────────────────────────
def admin_roles():
    """Sample any role inside ADMIN_ROLE_SET. Non-admin roles are
    Property A's territory, not Property G.
    """
    return st.sampled_from(sorted(ADMIN_ROLE_SET))


def categories():
    """Sample any permission category that has a representative route."""
    return st.sampled_from(sorted(CATEGORY_TO_ROUTE.keys()))


# ── Property G ────────────────────────────────────────────────────
@settings(
    max_examples=80,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(role=admin_roles(), category=categories())
def test_property_g_admin_granularity_enforcement(app, admin_user_ids,
                                                  role, category):
    """Property G — for every (admin_role X, category C) such that
    `C ∉ ROLE_PERMISSIONS[X]`, a request with X's JWT to a route
    requiring C MUST return HTTP 403 with
    `error.code == "FORBIDDEN"` and `error.missing == C`.

    Pairs where the role DOES have the category are skipped via
    `assume()` — those are Property G's complement (success path), not
    its denial invariant.
    """
    # Skip the success branch: only pairs missing the category are
    # in Property G's denial domain.
    role_perms = ROLE_PERMISSIONS.get(role, set())
    assume(category not in role_perms)

    user_id = admin_user_ids[role]
    token = _mint_jwt(app, user_id, role)
    method, path = CATEGORY_TO_ROUTE[category]

    with app.test_client() as client:
        resp = client.open(
            path,
            method=method,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            json={},
        )

    assert resp.status_code == 403, (
        f'Expected 403 for role={role!r} category={category!r} '
        f'method={method!r} path={path!r}, got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )
    body = resp.get_json()
    assert body is not None, 'Response body must be JSON'
    assert body.get('success') is False, body
    err = body.get('error')
    assert isinstance(err, dict), f'error must be a dict, got {err!r}'
    assert err.get('code') == 'FORBIDDEN', (
        f'expected error.code == "FORBIDDEN" for role={role!r} '
        f'category={category!r}, got body={body!r}'
    )
    assert err.get('missing') == category, (
        f'expected error.missing == {category!r} for role={role!r} '
        f'method={method!r} path={path!r}, got body={body!r}'
    )


# ── Coverage smoke test ───────────────────────────────────────────
def test_property_g_covers_every_missing_pair(app, admin_user_ids):
    """Hypothesis shrinking + `assume()` filters can in principle leave
    some `(role, category)` pair unexplored if the strategy never samples
    it within `max_examples`. This exhaustive smoke test pins coverage:
    every admin role × every category-it-lacks must produce a 403 with
    `error.missing == C`.

    With 5 admin roles × 11 categories = 55 pairs, of which the four
    non-superadmin/head_admin roles cover the lion's share of the
    "missing category" combinations, this is fast and deterministic.
    """
    failures: list[str] = []
    for role in sorted(ADMIN_ROLE_SET):
        role_perms = ROLE_PERMISSIONS.get(role, set())
        for category, (method, path) in CATEGORY_TO_ROUTE.items():
            if category in role_perms:
                continue  # success path is not Property G's domain
            user_id = admin_user_ids[role]
            token = _mint_jwt(app, user_id, role)
            with app.test_client() as client:
                resp = client.open(
                    path,
                    method=method,
                    headers={
                        'Authorization': f'Bearer {token}',
                        'Content-Type': 'application/json',
                    },
                    json={},
                )
            if resp.status_code != 403:
                failures.append(
                    f'role={role!r} category={category!r} {method} {path}: '
                    f'expected 403, got {resp.status_code}: '
                    f'{resp.get_data(as_text=True)}'
                )
                continue
            body = resp.get_json() or {}
            err = body.get('error') or {}
            if err.get('code') != 'FORBIDDEN' or err.get('missing') != category:
                failures.append(
                    f'role={role!r} category={category!r} {method} {path}: '
                    f'envelope drift, got {body!r}'
                )

    assert not failures, (
        'Property G coverage failures:\n  - ' + '\n  - '.join(failures)
    )
