"""
Phase 4B / Property P — Cookie-vs-Bearer transition behavior.

Validates: Requirement 4B.12.

Property P (from `design.md`):

    For every request whose
    ``(token_cookie_present, authorization_header_present, AUTH_COOKIE_ONLY)``
    triple is ``(C, H, F)``, the Middleware SHALL resolve the JWT from
    the cookie if ``C = true``; else from the header if
    ``H = true ∧ F = false``; else SHALL reject with HTTP 401.

This module enumerates the truth table over ``(C, H, F) ∈ {T, F}^3`` two
ways:

1. **Deterministic 8-combo parametrization** — every cell of the truth
   table is exercised exactly once with a fresh JWT, asserting the
   *source* the middleware chose by checking the `user_id` echoed back
   in the response body.
2. **Hypothesis property** — with ``@settings(max_examples=200)``, the
   same triple is sampled from ``st.booleans() ** 3`` and a fresh JWT
   is minted per example. This stress-tests the same invariant under
   randomized JWT bodies and `jti` values, which would catch a
   regression where the middleware's source choice is subtly correlated
   with token contents (e.g. a buggy short-circuit on `jti` collision).

Why source-checking matters: Property P is about *which token the
middleware reads*, not whether *some* token is valid. To prove
"cookie wins when ``C=T`` regardless of `H`", the test mints two
*different* JWTs — the cookie carries User A's JWT, the header carries
User B's JWT — and asserts the response identifies User A. A naive
"return 200" assertion would pass even on a buggy middleware that
silently fell back to the header.

A self-contained Flask app with a GET-only `/probe` route is used
(rather than the production `web_bp`) because:

  * The route can be GET-only, which side-steps Phase 4B CSRF entirely
    (CSRF only fires on unsafe methods — see ``_UNSAFE_METHODS``).
  * No JWT-blacklist side-effect can short-circuit a later example
    (i.e. there is no `/api/web/auth/logout` lurking that would burn
    the token after first use). Every example mints a fresh `jti`.
  * The decorator under test (`@token_required`) is wired byte-for-byte
    as in production, so the source-resolution invariant is the *real*
    invariant, not a stub.

The conftest already sets ``AUTH_CSRF_DISABLED=true`` for the test
suite, but each example sets it explicitly anyway as a defense in depth
(the GET-only route would not invoke CSRF in any case).
``AUTH_COOKIE_ONLY`` is flipped per-example via ``monkeypatch.setenv``
so that the dynamic per-request read inside ``@token_required``
observes the right value (Task 11.2 explicitly reads the env var
inside the decorator body, not at import).
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
from app.middleware import token_required
from app.models import CommunityGroup, OrgType, Organization, User


# ─────────────────────────────────────────────────────────────────────
# Self-contained Flask app + two seeded users
# ─────────────────────────────────────────────────────────────────────


def _stub_handler(current_user):
    """Echo the resolved user's id so the test can verify *which* token
    the middleware consulted.
    """
    return jsonify({'success': True, 'user_id': current_user.id}), 200


@pytest.fixture(scope='module')
def transition_app():
    """Self-contained Flask app with a GET-only ``/probe`` route wired
    through ``@token_required`` and two seeded users so the test can
    distinguish "cookie path" vs "header path" by the user_id echoed in
    the response.

    Two users are seeded so that an example may put User A's JWT in the
    cookie and User B's JWT in the header, then assert the response
    body identifies User A — proving the cookie path was taken (and not
    just that *some* token was accepted).
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True

    db.init_app(app)

    # GET-only — CSRF is method-gated to unsafe methods, so this route
    # never triggers CSRF, regardless of `AUTH_CSRF_DISABLED`.
    app.add_url_rule(
        '/probe',
        endpoint='probe',
        view_func=token_required(_stub_handler),
        methods=['GET'],
    )

    with app.app_context():
        # The shared in-memory SQLite schema is already created by the
        # session-scoped property-tests fixture, but `create_all` is
        # idempotent and lets this module run standalone too.
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'TransitionUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'TRANS-{suffix}',
            full_name='Cookie-vs-Bearer Transition University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Transition Group',
            abbreviation='TRA',
        )
        db.session.add(group)
        db.session.flush()

        user_a = User(
            community_group_id=group.id,
            first_name='UserA',
            last_name='Cookie',
            email=f'user-a-{suffix}@example.test',
            username=f'user_a_{suffix}',
            password_hash='not-used-in-this-test',
            role='superadmin',
            is_active=True,
        )
        user_b = User(
            community_group_id=group.id,
            first_name='UserB',
            last_name='Bearer',
            email=f'user-b-{suffix}@example.test',
            username=f'user_b_{suffix}',
            password_hash='not-used-in-this-test',
            role='superadmin',
            is_active=True,
        )
        db.session.add_all([user_a, user_b])
        db.session.commit()
        ids = (user_a.id, user_b.id)

    yield app, ids

    with app.app_context():
        db.session.remove()


def _mint_jwt(app: Flask, user_id: int, role: str = 'superadmin') -> str:
    """Mint a fresh HS256 JWT mirroring the auth_controller.login token
    shape. A unique ``jti`` per call ensures no two examples ever share
    a token (even though the test suite never blacklists tokens, this
    is defense in depth against any global blacklist state leaking in
    from another module).
    """
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


def _expected_outcome(C: bool, H: bool, F: bool) -> str:
    """Decision function for Property P, returned as a tag so the test
    body can branch on three discrete outcomes:

      * ``'cookie'`` — middleware MUST resolve the JWT from the cookie
        and the response MUST identify the cookie's user.
      * ``'header'`` — middleware MUST resolve the JWT from the
        ``Authorization: Bearer`` header and the response MUST
        identify the header's user.
      * ``'reject'`` — middleware MUST respond HTTP 401 with the
        standard "Authentication token is missing" error.

    Truth table (Property P):

        C  H  F  | outcome
        --------|---------
        T  *  *  | cookie     (cookie always wins when present)
        F  T  F  | header     (header fallback when cookie-only off)
        F  T  T  | reject     (cookie-only ON disables fallback)
        F  F  *  | reject     (no token at all)
    """
    if C:
        return 'cookie'
    if H and not F:
        return 'header'
    return 'reject'


# ─────────────────────────────────────────────────────────────────────
# 1. Deterministic 8-combination truth table
# ─────────────────────────────────────────────────────────────────────


# The full enumeration of `(C, H, F) ∈ {T, F}^3`. Listing all eight
# combinations explicitly (rather than ``itertools.product``) makes the
# truth table visible at a glance in the test header, and matches the
# task contract's "run all 8 combinations deterministically" option.
_TRUTH_TABLE = [
    # (C,    H,     F)
    (False, False, False),  # no token at all                 → 401
    (False, False, True),   # no token, cookie-only on        → 401
    (False, True,  False),  # header only, fallback allowed   → header
    (False, True,  True),   # header only, fallback disabled  → 401
    (True,  False, False),  # cookie only                     → cookie
    (True,  False, True),   # cookie only, cookie-only on     → cookie
    (True,  True,  False),  # both present                    → cookie wins
    (True,  True,  True),   # both, cookie-only on            → cookie wins
]


@pytest.mark.parametrize('C,H,F', _TRUTH_TABLE)
def test_property_p_truth_table_deterministic(transition_app, monkeypatch, C, H, F):
    """Property P — deterministic enumeration of `(C, H, F) ∈ {T, F}^3`.

    For each of the 8 cells, mint fresh JWTs (one per side present),
    issue a GET to ``/probe``, and assert:

      * Status code matches the expected outcome.
      * When the middleware accepts the request, the echoed
        ``user_id`` identifies the *source* the middleware chose
        (cookie carries User A; header carries User B). This is the
        critical check: it proves the middleware did not silently fall
        back to the wrong source.
    """
    app, (user_a_id, user_b_id) = transition_app

    # CSRF is method-gated to unsafe methods, so this GET route is
    # already CSRF-immune. Set the escape hatch explicitly anyway as
    # defense in depth.
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')

    # `AUTH_COOKIE_ONLY` is read per-request inside the decorator
    # (Task 11.2), so monkey-patching the env var here is observed on
    # the very next request.
    if F:
        monkeypatch.setenv('AUTH_COOKIE_ONLY', 'true')
    else:
        monkeypatch.setenv('AUTH_COOKIE_ONLY', 'false')

    headers: dict[str, str] = {}
    if H:
        # Header carries User B's JWT (so the test can prove the cookie
        # path was taken when `C=T ∧ H=T` by checking the response is
        # User A, not User B).
        headers['Authorization'] = f'Bearer {_mint_jwt(app, user_b_id)}'

    with app.test_client() as client:
        if C:
            client.set_cookie('token', _mint_jwt(app, user_a_id), domain='localhost')
        resp = client.get('/probe', headers=headers)

    outcome = _expected_outcome(C, H, F)

    if outcome == 'cookie':
        assert resp.status_code == 200, (
            f'(C={C}, H={H}, F={F}) → expected 200 (cookie path); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body == {'success': True, 'user_id': user_a_id}, (
            f'(C={C}, H={H}, F={F}) → expected user_a_id={user_a_id} '
            f'(cookie path); got body={body!r}'
        )
    elif outcome == 'header':
        assert resp.status_code == 200, (
            f'(C={C}, H={H}, F={F}) → expected 200 (header path); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body == {'success': True, 'user_id': user_b_id}, (
            f'(C={C}, H={H}, F={F}) → expected user_b_id={user_b_id} '
            f'(header path); got body={body!r}'
        )
    else:  # 'reject'
        assert resp.status_code == 401, (
            f'(C={C}, H={H}, F={F}) → expected 401 (reject); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body == {
            'success': False,
            'error': 'Authentication token is missing',
        }, (
            f'(C={C}, H={H}, F={F}) → expected missing-token envelope; '
            f'got body={body!r}'
        )


# ─────────────────────────────────────────────────────────────────────
# 2. Hypothesis sweep over `(C, H, F) ∈ {T, F}^3`
# ─────────────────────────────────────────────────────────────────────


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    C=st.booleans(),
    H=st.booleans(),
    F=st.booleans(),
)
def test_property_p_truth_table_hypothesis(transition_app, monkeypatch, C, H, F):
    """Property P — Hypothesis sweep over the same `(C, H, F)` triple.

    The deterministic test above asserts the truth table once per cell
    with one fixed JWT shape. This test re-asserts the same property
    across 200 fresh JWTs (each with a unique ``jti`` and ``iat``),
    which catches regressions where the middleware's source choice
    accidentally depends on token contents (e.g. "the header path is
    only used when the header's `jti` differs from the cookie's `jti`",
    or any other unintended correlation).

    The strategy is a uniform draw over `{T, F}^3`, so each of the 8
    cells is exercised on roughly 25 examples within the 200-example
    budget.
    """
    app, (user_a_id, user_b_id) = transition_app

    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')
    monkeypatch.setenv('AUTH_COOKIE_ONLY', 'true' if F else 'false')

    headers: dict[str, str] = {}
    if H:
        headers['Authorization'] = f'Bearer {_mint_jwt(app, user_b_id)}'

    with app.test_client() as client:
        if C:
            client.set_cookie('token', _mint_jwt(app, user_a_id), domain='localhost')
        resp = client.get('/probe', headers=headers)

    outcome = _expected_outcome(C, H, F)

    if outcome == 'cookie':
        assert resp.status_code == 200, (
            f'(C={C}, H={H}, F={F}) → expected 200 (cookie path); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        assert resp.get_json() == {'success': True, 'user_id': user_a_id}, (
            f'(C={C}, H={H}, F={F}) → cookie path must echo user_a_id; '
            f'got {resp.get_json()!r}'
        )
    elif outcome == 'header':
        assert resp.status_code == 200, (
            f'(C={C}, H={H}, F={F}) → expected 200 (header path); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        assert resp.get_json() == {'success': True, 'user_id': user_b_id}, (
            f'(C={C}, H={H}, F={F}) → header path must echo user_b_id; '
            f'got {resp.get_json()!r}'
        )
    else:  # 'reject'
        assert resp.status_code == 401, (
            f'(C={C}, H={H}, F={F}) → expected 401 (reject); '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        assert resp.get_json() == {
            'success': False,
            'error': 'Authentication token is missing',
        }, (
            f'(C={C}, H={H}, F={F}) → expected missing-token envelope; '
            f'got {resp.get_json()!r}'
        )


# ─────────────────────────────────────────────────────────────────────
# 3. Explicit "cookie wins over header" disambiguation
# ─────────────────────────────────────────────────────────────────────
#
# The truth-table tests above already check the (C=T, H=T) cells by
# minting different JWTs for each side, but those cells are only two of
# the eight rows. This standalone test makes the
# "cookie-beats-header-for-different-users" invariant explicit so a
# reviewer scanning the file immediately sees that the test does NOT
# rely on coincidental same-user JWTs.


def test_cookie_wins_over_header_for_different_users(transition_app, monkeypatch):
    """Sanity-check the source disambiguation in isolation.

    When the cookie carries User A's JWT and the header carries User
    B's JWT, the response MUST identify User A regardless of
    ``AUTH_COOKIE_ONLY``. This is the load-bearing observation that
    lets the truth-table tests prove the middleware chose the *right*
    source rather than just *a* source.
    """
    app, (user_a_id, user_b_id) = transition_app

    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'true')

    for cookie_only in ('false', 'true'):
        monkeypatch.setenv('AUTH_COOKIE_ONLY', cookie_only)

        with app.test_client() as client:
            client.set_cookie('token', _mint_jwt(app, user_a_id), domain='localhost')
            resp = client.get(
                '/probe',
                headers={'Authorization': f'Bearer {_mint_jwt(app, user_b_id)}'},
            )

        assert resp.status_code == 200, (
            f'AUTH_COOKIE_ONLY={cookie_only}: expected 200; '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        assert resp.get_json() == {'success': True, 'user_id': user_a_id}, (
            f'AUTH_COOKIE_ONLY={cookie_only}: cookie (User A) must win '
            f'over header (User B); got {resp.get_json()!r}'
        )
