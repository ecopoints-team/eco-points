"""
Phase 4B / Property O — Cookie + CSRF transport.

Validates: Requirements 4B.11, 4B.13, 4B.14, 7.6.

Two leaf assertions, each derived from a separate task-contract clause:

1. **Login flow (Requirement 4B.11)** — A successful login via
   ``POST /api/web/auth/login`` MUST return both ``Set-Cookie`` headers:

     * ``token`` cookie:       ``HttpOnly``, ``Secure``,
                               ``SameSite=Strict``, ``Path=/``,
                               positive integer ``Max-Age``.
     * ``csrf_token`` cookie:  NOT ``HttpOnly`` (the Client must read it
                               via ``document.cookie``), ``Secure``,
                               ``SameSite=Strict``, ``Path=/``,
                               positive integer ``Max-Age``.

   The login flow is one fixed deterministic sequence — a single user is
   seeded with a known password and the ``Set-Cookie`` headers on the
   response are parsed and asserted. No Hypothesis is needed for this
   leaf (the task contract explicitly allows deterministic asserts here).

2. **CSRF truth table (Requirements 4B.13, 4B.14, 7.6)** — For every
   unsafe HTTP method ``M ∈ {POST, PUT, PATCH, DELETE}``, the
   four-tuple ``(header_present, cookie_present, header_value, cookie_value)``
   over an authenticated request MUST yield:

     * HTTP 200 *iff* both header and cookie are present, both non-empty,
       *and* ``header_value == cookie_value`` byte-for-byte.
     * HTTP 403 with ``error.code == "CSRF_INVALID"`` in every other
       cell of the truth table.

   The truth-table portion uses Hypothesis with
   ``@settings(max_examples=200, deadline=None)``. To avoid relying on
   the (vanishingly small) probability that two independently drawn
   token strings are byte-equal, the strategy draws a base value and a
   boolean ``equal_values`` flag, so the success case is exercised on
   roughly 50 % of generated tuples (modulo present/non-empty checks).

The truth-table test mounts a self-contained Flask app with a single
``@token_required``-protected stub route, seeded with one user, and
mints a fresh JWT per Hypothesis example. Using a stub (rather than the
real ``POST /api/web/auth/logout``) avoids the JWT-blacklist side effect
that would 401 every example after the first.

The conftest disables CSRF in the test suite by default
(``AUTH_CSRF_DISABLED=true``) so legacy Bearer-only fixtures keep
working. This module flips it OFF
(``monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')``) so the real
double-submit check is exercised on every example.
"""
from __future__ import annotations

import string
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


# Unsafe HTTP methods that MUST require a CSRF double-submit on
# authenticated routes (Requirement 4B.13).
UNSAFE_METHODS = ('POST', 'PUT', 'PATCH', 'DELETE')


# ─────────────────────────────────────────────────────────────────────
# 1. Login flow assertion (Requirement 4B.11)
# ─────────────────────────────────────────────────────────────────────


def _parse_set_cookie(header_value: str) -> tuple[str, str, dict[str, object]]:
    """Parse a single ``Set-Cookie`` header into ``(name, value, attrs)``.

    Boolean attributes (``HttpOnly``, ``Secure``) become ``True``.
    Other attributes (``Path``, ``Max-Age``, ``SameSite``, ``Domain``,
    ``Expires``) become their right-hand-side string values.  All
    attribute keys are lower-cased so the assertions can use a
    canonical form regardless of the server's chosen casing.
    """
    parts = [p.strip() for p in header_value.split(';') if p.strip()]
    name, _, value = parts[0].partition('=')
    attrs: dict[str, object] = {}
    for part in parts[1:]:
        if '=' in part:
            key, _, val = part.partition('=')
            attrs[key.strip().lower()] = val.strip()
        else:
            attrs[part.strip().lower()] = True
    return name.strip(), value, attrs


def _set_cookies_by_name(response, name: str) -> list[tuple[str, dict]]:
    """Return a list of ``(value, attrs)`` for every ``Set-Cookie`` header
    on ``response`` whose cookie name equals ``name``.
    """
    out: list[tuple[str, dict]] = []
    for raw in response.headers.getlist('Set-Cookie'):
        cname, cvalue, cattrs = _parse_set_cookie(raw)
        if cname == name:
            out.append((cvalue, cattrs))
    return out


@pytest.fixture(scope='module')
def login_user(app):
    """Seed one superadmin with a known password under a fresh
    Organization → CommunityGroup chain.  Returns ``{email, password,
    user_id}`` so the login test can submit credentials and receive a
    successful response that triggers the cookie-attaching path.
    """
    suffix = uuid.uuid4().hex[:8]
    password = 'TestP@ssw0rd!'
    with app.app_context():
        org_type = OrgType(name=f'LoginTestUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'LOGIN-{suffix}',
            full_name='Login Test University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Login Group',
            abbreviation='LOG',
            group_type='staff',
        )
        db.session.add(group)
        db.session.flush()

        email = f'login-{suffix}@example.test'
        user = User(
            community_group_id=group.id,
            first_name='Login',
            last_name='Tester',
            email=email,
            username=f'login_{suffix}',
            role='superadmin',
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        return {'email': email, 'password': password, 'user_id': user.id}


def test_login_sets_token_and_csrf_cookies(app, login_user, monkeypatch):
    """Property O — login flow assertion (Requirement 4B.11).

    A successful ``POST /api/web/auth/login`` MUST issue:

      * ``Set-Cookie: admin_token=<jwt>; HttpOnly; Secure; SameSite=Strict;
        Path=/; Max-Age=<n>`` — the JWT itself, locked away from JS.
        Named 'admin_token' (not 'token') to keep the admin session
        separate from the regular user session cookie.
      * ``Set-Cookie: csrf_token=<random>; Secure; SameSite=Strict;
        Path=/; Max-Age=<n>`` — readable by JS so the Client can echo
        it on ``X-CSRF-Token``.

    Both cookies share the same Max-Age (the active session expiry).

    The ``Secure`` flag is environment-controlled (``COOKIE_SECURE``) so
    that cookies work over plain ``http://localhost`` in local dev. This
    test pins the PRODUCTION posture: with ``COOKIE_SECURE=true`` (which
    production MUST set), both cookies are issued ``Secure``.
    """
    # Pin production cookie posture for this assertion.
    monkeypatch.setenv('COOKIE_SECURE', 'true')

    with app.test_client() as client:
        resp = client.post(
            '/api/web/auth/login',
            json={
                'email': login_user['email'],
                'password': login_user['password'],
            },
        )

    assert resp.status_code == 200, resp.get_data(as_text=True)
    body = resp.get_json()
    assert body is not None and body.get('success') is True, body

    # ── admin_token cookie ───────────────────────────────────────────
    # The JWT is set as 'admin_token' (not 'token') to keep the admin
    # session separate from the regular user session cookie.
    token_cookies = _set_cookies_by_name(resp, 'admin_token')
    assert len(token_cookies) == 1, (
        'Expected exactly one Set-Cookie: admin_token=... header; got '
        f'{len(token_cookies)} from {resp.headers.getlist("Set-Cookie")!r}'
    )
    token_value, token_attrs = token_cookies[0]
    assert token_value, 'token cookie value (the JWT) must be non-empty'
    assert token_attrs.get('httponly') is True, (
        f'token cookie MUST be HttpOnly; attrs={token_attrs!r}'
    )
    assert token_attrs.get('secure') is True, (
        f'token cookie MUST be Secure; attrs={token_attrs!r}'
    )
    samesite_token = token_attrs.get('samesite')
    assert isinstance(samesite_token, str) and samesite_token.lower() == 'strict', (
        f'token cookie MUST set SameSite=Strict; attrs={token_attrs!r}'
    )
    assert token_attrs.get('path') == '/', (
        f'token cookie MUST set Path=/; attrs={token_attrs!r}'
    )
    max_age_token = token_attrs.get('max-age')
    assert (
        isinstance(max_age_token, str)
        and max_age_token.isdigit()
        and int(max_age_token) > 0
    ), f'token cookie MUST set a positive integer Max-Age; attrs={token_attrs!r}'

    # ── csrf_token cookie ─────────────────────────────────────────
    csrf_cookies = _set_cookies_by_name(resp, 'csrf_token')
    assert len(csrf_cookies) == 1, (
        'Expected exactly one Set-Cookie: csrf_token=... header; got '
        f'{len(csrf_cookies)} from {resp.headers.getlist("Set-Cookie")!r}'
    )
    csrf_value, csrf_attrs = csrf_cookies[0]
    assert csrf_value, 'csrf_token cookie value must be non-empty'
    # Must NOT be HttpOnly: the Client reads it from document.cookie.
    assert csrf_attrs.get('httponly') is not True, (
        f'csrf_token cookie MUST NOT be HttpOnly; attrs={csrf_attrs!r}'
    )
    assert csrf_attrs.get('secure') is True, (
        f'csrf_token cookie MUST be Secure; attrs={csrf_attrs!r}'
    )
    samesite_csrf = csrf_attrs.get('samesite')
    assert isinstance(samesite_csrf, str) and samesite_csrf.lower() == 'strict', (
        f'csrf_token cookie MUST set SameSite=Strict; attrs={csrf_attrs!r}'
    )
    assert csrf_attrs.get('path') == '/', (
        f'csrf_token cookie MUST set Path=/; attrs={csrf_attrs!r}'
    )
    max_age_csrf = csrf_attrs.get('max-age')
    assert (
        isinstance(max_age_csrf, str)
        and max_age_csrf.isdigit()
        and int(max_age_csrf) > 0
    ), f'csrf_token cookie MUST set a positive integer Max-Age; attrs={csrf_attrs!r}'


# ─────────────────────────────────────────────────────────────────────
# 2. CSRF truth-table property over unsafe methods
#    (Requirements 4B.13, 4B.14, 7.6)
# ─────────────────────────────────────────────────────────────────────


def _stub_handler(current_user):
    """Tiny authenticated stub. Returns 200 with the user_id when CSRF
    passes; never reached when the CSRF check denies."""
    return jsonify({'success': True, 'user_id': current_user.id}), 200


@pytest.fixture(scope='module')
def csrf_truth_table_app():
    """Self-contained Flask app: ``/csrf-stub`` is mounted under
    ``token_required(_stub_handler)`` for every unsafe method, and one
    superadmin user is seeded for JWT minting.

    A self-contained app keeps the property test independent of the
    production routing surface — it has no other validation that could
    short-circuit the CSRF check (e.g. Pydantic 400s, JWT-blacklist
    side effects from ``/api/web/auth/logout``), so the
    truth-table-vs-status-code mapping is one-to-one.
    """
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_EXPIRY_HOURS'] = Config.JWT_EXPIRY_HOURS
    app.config['TESTING'] = True

    db.init_app(app)

    view = token_required(_stub_handler)
    for method in UNSAFE_METHODS:
        app.add_url_rule(
            '/csrf-stub',
            endpoint=f'csrf_stub_{method}',
            view_func=view,
            methods=[method],
        )

    with app.app_context():
        # `db.create_all()` is idempotent; the conftest's session-scoped
        # `app` fixture has already created the schema in the same
        # in-memory SQLite, but calling it again is a no-op.
        db.create_all()

        suffix = uuid.uuid4().hex[:8]
        org_type = OrgType(name=f'CSRFTruthUni-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'CSRF-{suffix}',
            full_name='CSRF Truth-Table University',
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

        user = User(
            community_group_id=group.id,
            first_name='CSRF',
            last_name='Truth',
            email=f'csrf-truth-{suffix}@example.test',
            username=f'csrf_truth_{suffix}',
            password_hash='not-used-in-this-test',
            role='superadmin',
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    yield app, user_id

    with app.app_context():
        db.session.remove()


def _mint_jwt(app: Flask, user_id: int, role: str = 'superadmin') -> str:
    """Mint an HS256 JWT mirroring the auth_controller.login token shape."""
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


# ── Hypothesis strategies ─────────────────────────────────────────
# CSRF tokens in production are url-safe base64 (``secrets.token_urlsafe(32)``).
# For the property only byte-equality matters, so any non-empty
# url-safe-ish string works.  ``min_size=1`` guarantees the
# "non-empty" precondition for the success case.
_TOKEN_ALPHABET = string.ascii_letters + string.digits + '-_'


def csrf_token_values():
    return st.text(alphabet=_TOKEN_ALPHABET, min_size=1, max_size=64)


def methods():
    return st.sampled_from(UNSAFE_METHODS)


@settings(
    max_examples=200,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
@given(
    method=methods(),
    header_present=st.booleans(),
    cookie_present=st.booleans(),
    equal_values=st.booleans(),
    base_value=csrf_token_values(),
    other_value=csrf_token_values(),
)
def test_csrf_truth_table_property_o(
    csrf_truth_table_app,
    monkeypatch,
    method,
    header_present,
    cookie_present,
    equal_values,
    base_value,
    other_value,
):
    """Property O — CSRF truth table over unsafe methods.

    For every ``(method, header_present, cookie_present, header_value,
    cookie_value)`` cell of the truth table, the authenticated request
    MUST yield:

      * HTTP 200 IFF
          ``header_present ∧ cookie_present
           ∧ header_value != '' ∧ cookie_value != ''
           ∧ header_value == cookie_value``.
      * Otherwise HTTP 403 with ``error.code == "CSRF_INVALID"``.

    The strategy draws ``equal_values`` so the success cell is hit on
    roughly half of all generated tuples, ensuring the property
    exercises both sides of the truth table within
    ``max_examples=200``.

    ``AUTH_CSRF_DISABLED`` is forced to ``'false'`` per-example so the
    real check fires (the conftest sets it ``'true'`` by default for
    legacy Bearer-only fixtures).  ``AUTH_COOKIE_ONLY`` is cleared so
    the Bearer fallback in ``token_required`` is allowed to resolve
    the JWT from the ``Authorization`` header.
    """
    app, user_id = csrf_truth_table_app

    # Force CSRF enforcement ON for this property; allow Bearer
    # fallback so the JWT comes from the Authorization header rather
    # than from a (deliberately absent) ``token`` cookie.
    monkeypatch.setenv('AUTH_CSRF_DISABLED', 'false')
    monkeypatch.delenv('AUTH_COOKIE_ONLY', raising=False)

    token = _mint_jwt(app, user_id)

    header_value = base_value
    cookie_value = base_value if equal_values else other_value

    headers = {'Authorization': f'Bearer {token}'}
    if header_present:
        headers['X-CSRF-Token'] = header_value

    with app.test_client() as client:
        if cookie_present:
            client.set_cookie('csrf_token', cookie_value, domain='localhost')

        resp = client.open('/csrf-stub', method=method, headers=headers)

    # Decide the expected outcome under Property O.  ``base_value`` and
    # ``other_value`` come from a ``min_size=1`` strategy so the
    # non-empty precondition is automatically satisfied when the
    # corresponding side is "present".
    should_pass = (
        header_present
        and cookie_present
        and header_value != ''
        and cookie_value != ''
        and header_value == cookie_value
    )

    if should_pass:
        assert resp.status_code == 200, (
            f'Expected 200 (CSRF passes) for method={method!r} '
            f'header_present={header_present!r} '
            f'cookie_present={cookie_present!r} '
            f'header_value={header_value!r} cookie_value={cookie_value!r}; '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body == {'success': True, 'user_id': user_id}, body
    else:
        assert resp.status_code == 403, (
            f'Expected 403 CSRF_INVALID for method={method!r} '
            f'header_present={header_present!r} '
            f'cookie_present={cookie_present!r} '
            f'header_value={header_value!r} cookie_value={cookie_value!r}; '
            f'got {resp.status_code}: {resp.get_data(as_text=True)}'
        )
        body = resp.get_json()
        assert body is not None, 'Response body must be JSON'
        assert body.get('success') is False, body
        err = body.get('error')
        assert isinstance(err, dict), f'error must be a dict, got {err!r}'
        assert err.get('code') == 'CSRF_INVALID', (
            f'Expected error.code == "CSRF_INVALID" for method={method!r} '
            f'header_present={header_present!r} '
            f'cookie_present={cookie_present!r} '
            f'header_value={header_value!r} cookie_value={cookie_value!r}; '
            f'got body={body!r}'
        )
