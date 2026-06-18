"""
Phase 3 / Property L — Strict-acceptance on mutating endpoints.

**Validates: Requirements 3.2, 3.8, 4E.25**

For every POST/PUT/PATCH endpoint across all Domain_Controllers, inject
one extra unknown key into a minimal valid request body and assert:
  - HTTP 400 response
  - ``error.code`` in ``{"VALIDATION_ERROR", "UNKNOWN_FIELD"}``
  - The response body names the offending key somewhere (in
    ``error.errors[].field`` or ``error.message``).

Strategy
--------
- ``unknown_keys()`` generates random string keys that are NOT in the
  endpoint's known schema (i.e. not in the ``KNOWN_FIELDS`` set for that
  endpoint).
- For each endpoint a minimal valid body is constructed; one extra key
  with a random string value is injected.
- A valid superadmin JWT is minted so the request passes auth/RBAC and
  reaches the validation layer.
- ``@settings(max_examples=50)`` per endpoint.

Note: This test validates the Phase 4E ``@validate_request`` strict-
acceptance invariant. Until Phase 4E lands (``extra='forbid'`` Pydantic
schemas on every mutating handler), these tests will fail — that failure
is the expected signal that the implementation is incomplete.
"""
from __future__ import annotations

import string
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import pytest
from hypothesis import HealthCheck, given, settings, strategies as st

from app import create_app, db
from app.models import CommunityGroup, OrgType, Organization, User, Wallet, UserSecurity


# ── Endpoint registry ─────────────────────────────────────────────────────
# Each entry describes one POST/PUT/PATCH endpoint:
#   path_template : URL path (may contain {id} placeholder)
#   method        : HTTP method
#   known_fields  : set of field names the endpoint legitimately accepts
#   min_body      : callable(org_id, group_id) → dict with minimal valid body
#
# ``{id}`` in path_template is replaced with a sentinel integer (1) for the
# test; the handler will 404 on that ID, but the validation layer (Phase 4E)
# MUST reject unknown fields BEFORE any DB lookup, so a 400 is still the
# expected outcome.

def _users_create_body(org_id, group_id):
    uniq = uuid.uuid4().hex[:6]
    return {
        'firstName': 'Test',
        'lastName': 'User',
        'email': f'test-{uniq}@example.test',
        'password': 'TestPass1',
        'role': 'technician',
        'locationId': org_id,
        'groupId': group_id,
    }


def _users_update_body(org_id, group_id):
    return {'firstName': 'Updated'}


def _adjust_points_body(org_id, group_id):
    return {'amount': 10, 'reason': 'test'}


def _machines_create_body(org_id, group_id):
    return {'locationId': org_id, 'name': 'TestRVM', 'locationName': 'Lab'}


def _machines_update_body(org_id, group_id):
    return {'name': 'UpdatedRVM'}


def _rewards_create_body(org_id, group_id):
    return {
        'locationId': org_id,
        'name': 'TestReward',
        'description': 'desc',
        'category': 'merchandise',
        'pointsRequired': 100,
        'isActive': True,
    }


def _rewards_update_body(org_id, group_id):
    return {'name': 'UpdatedReward'}


def _locations_create_body(org_id, group_id):
    return {'name': 'TestOrg', 'fullName': 'Test Organization', 'status': 'Active'}


def _locations_update_body(org_id, group_id):
    return {'name': 'UpdatedOrg'}


def _org_types_create_body(org_id, group_id):
    uniq = uuid.uuid4().hex[:6]
    return {'name': f'TestType-{uniq}'}


def _groups_create_body(org_id, group_id):
    uniq = uuid.uuid4().hex[:6]
    return {'name': f'TestGroup-{uniq}', 'groupType': 'college', 'organizationId': org_id}


def _groups_update_body(org_id, group_id):
    return {'name': 'UpdatedGroup'}


def _sessions_bulk_create_body(org_id, group_id):
    return {
        'rvmId': 1,
        'walletId': 1,
        'items': [{'detectedClass': 'PET Bottle', 'pointsAwarded': 5}],
    }


def _bulk_deposits_create_body(org_id, group_id):
    return {'walletId': 1, 'totalPointsAwarded': 10, 'itemCount': 2}


def _settings_notifications_update_body(org_id, group_id):
    return {'settings': [{'alertKey': 'machine_offline', 'emailEnabled': True}]}


def _settings_channels_update_body(org_id, group_id):
    return {'emailRecipient': 'test@example.com', 'emailEnabled': True,
            'smsRecipient': '', 'smsEnabled': False}


def _settings_security_update_body(org_id, group_id):
    return {'twoFactorRequired': False, 'twoFactorMethod': 'email',
            'sessionTimeoutMinutes': 1440, 'maxLoginAttempts': 5,
            'lockoutDurationMinutes': 15}


def _settings_force_logout_body(org_id, group_id):
    return {}


def _settings_test_notification_body(org_id, group_id):
    return {'channel': 'email', 'recipient': 'test@example.com'}


# Registry: (path_template, method, known_fields_set, body_factory)
# known_fields is used by the unknown_keys() strategy to avoid generating
# a key that is actually accepted by the endpoint.
MUTATING_ENDPOINTS: list[tuple[str, str, frozenset[str], Any]] = [
    # ── Users ──────────────────────────────────────────────────────────
    (
        '/api/web/users',
        'POST',
        frozenset({
            'firstName', 'lastName', 'middleName', 'username', 'email',
            'phone', 'password', 'role', 'userType', 'locationId', 'groupId',
            'name', 'educationalLevel', 'yearLevel', 'communityGroupId',
        }),
        _users_create_body,
    ),
    (
        '/api/web/users/{id}',
        'PUT',
        frozenset({
            'firstName', 'lastName', 'middleName', 'username', 'email',
            'phone', 'role', 'userType', 'isActive', 'password', 'name',
            'educationalLevel', 'yearLevel', 'communityGroupId',
        }),
        _users_update_body,
    ),
    (
        '/api/web/users/{id}/adjust-points',
        'POST',
        frozenset({'amount', 'reason'}),
        _adjust_points_body,
    ),
    # ── Machines ───────────────────────────────────────────────────────
    (
        '/api/web/machines',
        'POST',
        frozenset({'locationId', 'name', 'locationName', 'machineUuid', 'isOnline'}),
        _machines_create_body,
    ),
    (
        '/api/web/machines/{id}',
        'PUT',
        frozenset({'name', 'locationName', 'isOnline', 'isCapacityFull'}),
        _machines_update_body,
    ),
    # ── Rewards ────────────────────────────────────────────────────────
    (
        '/api/web/rewards',
        'POST',
        frozenset({
            'locationId', 'name', 'description', 'category',
            'pointsRequired', 'imageUrl', 'isActive', 'stockQuantity',
        }),
        _rewards_create_body,
    ),
    (
        '/api/web/rewards/{id}',
        'PUT',
        frozenset({
            'name', 'description', 'category', 'pointsRequired',
            'imageUrl', 'isActive', 'stockQuantity',
        }),
        _rewards_update_body,
    ),
    # ── Locations ──────────────────────────────────────────────────────
    (
        '/api/web/locations',
        'POST',
        frozenset({
            'name', 'fullName', 'orgType', 'status',
            'streetAddress', 'barangay', 'cityName', 'cityMunicipality',
            'province', 'region', 'zipCode',
            'contactPerson', 'contactEmail', 'contactPhone',
        }),
        _locations_create_body,
    ),
    (
        '/api/web/locations/{id}',
        'PUT',
        frozenset({
            'name', 'fullName', 'status', 'orgType',
            'streetAddress', 'barangay', 'cityName', 'cityMunicipality',
            'province', 'region', 'zipCode',
        }),
        _locations_update_body,
    ),
    # ── Org-types ──────────────────────────────────────────────────────
    (
        '/api/web/org-types',
        'POST',
        frozenset({'name'}),
        _org_types_create_body,
    ),
    # ── Groups ─────────────────────────────────────────────────────────
    (
        '/api/web/groups',
        'POST',
        frozenset({'name', 'abbreviation', 'groupType', 'organizationId'}),
        _groups_create_body,
    ),
    (
        '/api/web/groups/{id}',
        'PUT',
        frozenset({'name', 'abbreviation', 'groupType'}),
        _groups_update_body,
    ),
    # ── Sessions ───────────────────────────────────────────────────────
    (
        '/api/web/sessions/bulk',
        'POST',
        frozenset({'rvmId', 'walletId', 'items', 'notes'}),
        _sessions_bulk_create_body,
    ),
    (
        '/api/web/bulk-deposits',
        'POST',
        frozenset({'walletId', 'totalPointsAwarded', 'itemCount', 'notes'}),
        _bulk_deposits_create_body,
    ),
    # ── Settings ───────────────────────────────────────────────────────
    (
        '/api/web/settings/notifications',
        'PUT',
        frozenset({'settings'}),
        _settings_notifications_update_body,
    ),
    (
        '/api/web/settings/channels',
        'PUT',
        frozenset({'emailRecipient', 'smsRecipient', 'emailEnabled', 'smsEnabled'}),
        _settings_channels_update_body,
    ),
    (
        '/api/web/settings/security',
        'PUT',
        frozenset({
            'twoFactorRequired', 'twoFactorMethod', 'sessionTimeoutMinutes',
            'maxLoginAttempts', 'lockoutDurationMinutes',
        }),
        _settings_security_update_body,
    ),
    (
        '/api/web/settings/security/force-logout',
        'POST',
        frozenset(),
        _settings_force_logout_body,
    ),
    (
        '/api/web/settings/notifications/test',
        'POST',
        frozenset({'channel', 'recipient'}),
        _settings_test_notification_body,
    ),
]


# ── Hypothesis strategies ─────────────────────────────────────────────────

# Characters safe for JSON keys: printable ASCII excluding control chars.
_KEY_ALPHABET = string.ascii_letters + string.digits + '_'


def unknown_keys(known: frozenset[str]):
    """Generate a single random string key that is NOT in ``known``.

    The strategy draws from ``_KEY_ALPHABET`` to produce identifiers that
    look like plausible field names (letters/digits/underscore) but are
    guaranteed to be absent from the endpoint's declared schema.
    """
    return (
        st.text(alphabet=_KEY_ALPHABET, min_size=3, max_size=20)
        .filter(lambda k: k not in known and k.isidentifier())
    )


def unknown_values():
    """Generate a random string value for the injected unknown key."""
    return st.text(alphabet=string.printable, min_size=0, max_size=30)


# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture(scope='module')
def strict_app(app):
    """Module-scoped Flask app alias for the session-scoped shared app.

    Re-uses the session-scoped ``app`` fixture from ``conftest.py`` to
    avoid calling ``create_app()`` a second time in the same pytest
    session. Flask's ``web_bp`` is a module-level singleton; registering
    sub-blueprints onto it a second time raises an ``AssertionError``.
    Sharing the session-scoped app avoids that collision while still
    giving this module a named ``strict_app`` fixture for clarity.
    """
    yield app


@pytest.fixture(scope='module')
def superadmin_context(strict_app):
    """Seed a superadmin user and return ``(app, user_id, org_id, group_id)``.

    The superadmin role has all permission categories, so it passes every
    ``@permission_required`` gate and reaches the validation layer.
    """
    with strict_app.app_context():
        org_type = OrgType(name=f'TestUni-{uuid.uuid4().hex[:6]}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'EPTU-{uuid.uuid4().hex[:6]}',
            full_name='EcoPoints Test University',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Staff',
            abbreviation='STF',
            group_type='staff',
        )
        db.session.add(group)
        db.session.flush()

        uniq = uuid.uuid4().hex[:8]
        user = User(
            community_group_id=group.id,
            first_name='Super',
            last_name='Admin',
            email=f'superadmin-{uniq}@example.test',
            username=f'superadmin_{uniq}',
            password_hash='not-used-in-this-test',
            role='superadmin',
            is_active=True,
        )
        db.session.add(user)
        db.session.flush()

        wallet = Wallet(user_id=user.id, points_balance=0, lifetime_points=0, streak=0)
        db.session.add(wallet)

        security = UserSecurity(user_id=user.id, two_factor_enabled=False)
        db.session.add(security)

        db.session.commit()
        return strict_app, user.id, org.id, group.id


# ── JWT helper ────────────────────────────────────────────────────────────

def _mint_superadmin_jwt(app, user_id: int) -> str:
    """Mint a valid HS256 JWT for the superadmin user."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': 'superadmin',
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ── Core assertion helper ─────────────────────────────────────────────────

def _assert_strict_rejection(resp, path: str, method: str, unknown_key: str) -> None:
    """Assert that the response is a strict-acceptance rejection.

    Checks:
    1. HTTP 400 status code.
    2. ``error.code`` in ``{"VALIDATION_ERROR", "UNKNOWN_FIELD"}``.
    3. The offending key is named somewhere in the response body
       (in ``error.errors[].field`` or ``error.message``).
    """
    assert resp.status_code == 400, (
        f'Expected HTTP 400 for {method} {path} with unknown key '
        f'{unknown_key!r}, got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )

    body = resp.get_json()
    assert body is not None, (
        f'Response body must be JSON for {method} {path}'
    )
    assert body.get('success') is False, (
        f'success must be False for {method} {path}, got {body!r}'
    )

    err = body.get('error')
    assert isinstance(err, dict), (
        f'error must be a dict for {method} {path}, got {err!r}'
    )

    code = err.get('code')
    assert code in {'VALIDATION_ERROR', 'UNKNOWN_FIELD'}, (
        f'error.code must be "VALIDATION_ERROR" or "UNKNOWN_FIELD" for '
        f'{method} {path} with unknown key {unknown_key!r}, got {code!r}; '
        f'full body: {body!r}'
    )

    # The offending key must be named somewhere in the response.
    # Check error.errors[].field first, then fall back to error.message.
    key_named = False

    errors_list = err.get('errors')
    if isinstance(errors_list, list):
        for entry in errors_list:
            if isinstance(entry, dict) and entry.get('field') == unknown_key:
                key_named = True
                break

    if not key_named:
        message = err.get('message', '')
        if isinstance(message, str) and unknown_key in message:
            key_named = True

    assert key_named, (
        f'The offending key {unknown_key!r} must be named in the response '
        f'for {method} {path}; got body: {body!r}'
    )


# ── Property L: parametrized per endpoint ────────────────────────────────

def _make_property_test(path_template: str, method: str,
                        known: frozenset[str], body_factory):
    """Factory that returns a Hypothesis property test for one endpoint.

    Parametrizing ``@given`` tests directly inside a loop is not
    supported by Hypothesis; instead we generate one named function per
    endpoint and register it in the module namespace.
    """
    @settings(
        max_examples=50,
        deadline=None,
        suppress_health_check=[
            HealthCheck.function_scoped_fixture,
            HealthCheck.too_slow,
        ],
    )
    @given(
        unknown_key=unknown_keys(known),
        unknown_val=unknown_values(),
    )
    def _test(superadmin_context, unknown_key, unknown_val):
        """Property L — injecting an unknown key into a mutating endpoint
        body MUST produce HTTP 400 with error.code in
        {"VALIDATION_ERROR", "UNKNOWN_FIELD"} and the offending key named
        in the response.
        """
        app, user_id, org_id, group_id = superadmin_context
        token = _mint_superadmin_jwt(app, user_id)

        # Resolve {id} placeholder to a sentinel integer.
        path = path_template.replace('{id}', '1')

        # Build minimal valid body and inject the unknown key.
        body = dict(body_factory(org_id, group_id))
        body[unknown_key] = unknown_val

        with app.test_client() as client:
            resp = client.open(
                path,
                method=method,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                },
                json=body,
            )

        _assert_strict_rejection(resp, path, method, unknown_key)

    return _test


# ── Register one test function per endpoint ───────────────────────────────
# Hypothesis requires each property test to be a distinct top-level
# function so that it can track its own database and shrink independently.
# We generate a unique name from the method + path and inject it into the
# module's global namespace.

def _endpoint_to_test_name(method: str, path_template: str) -> str:
    """Convert a (method, path_template) pair to a valid Python identifier
    suitable for use as a pytest test function name.

    Example:
        ('POST', '/api/web/users')          → 'test_strict_POST_api_web_users'
        ('PUT',  '/api/web/users/{id}')     → 'test_strict_PUT_api_web_users__id_'
    """
    safe = (
        path_template
        .replace('/', '_')
        .replace('{', '_')
        .replace('}', '_')
        .replace('-', '_')
        .strip('_')
    )
    # Collapse consecutive underscores.
    while '__' in safe:
        safe = safe.replace('__', '_')
    return f'test_strict_{method}_{safe}'


for _path_tmpl, _method, _known, _body_factory in MUTATING_ENDPOINTS:
    _test_name = _endpoint_to_test_name(_method, _path_tmpl)
    _test_fn = _make_property_test(_path_tmpl, _method, _known, _body_factory)
    # Give the function a meaningful __name__ so pytest reports it clearly.
    _test_fn.__name__ = _test_name
    _test_fn.__qualname__ = _test_name
    globals()[_test_name] = _test_fn


# ── Exhaustive smoke test (deterministic, no Hypothesis) ─────────────────

def test_property_l_smoke_all_endpoints(superadmin_context):
    """Deterministic smoke test: send one request with a fixed unknown key
    (``__unknown_field__``) to every mutating endpoint and assert the
    strict-acceptance invariant.

    This test is fast and deterministic; it complements the Hypothesis
    property tests above by guaranteeing that every endpoint in the
    registry is exercised at least once even if Hypothesis's random
    sampling misses some endpoints.
    """
    app, user_id, org_id, group_id = superadmin_context
    token = _mint_superadmin_jwt(app, user_id)
    unknown_key = '__unknown_field__'

    failures: list[str] = []
    for path_template, method, _known, body_factory in MUTATING_ENDPOINTS:
        path = path_template.replace('{id}', '1')
        body = dict(body_factory(org_id, group_id))
        body[unknown_key] = 'injected_value'

        with app.test_client() as client:
            resp = client.open(
                path,
                method=method,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                },
                json=body,
            )

        if resp.status_code != 400:
            failures.append(
                f'{method} {path}: expected 400, got {resp.status_code}: '
                f'{resp.get_data(as_text=True)[:200]}'
            )
            continue

        body_resp = resp.get_json() or {}
        err = body_resp.get('error')
        # error may be a string (legacy shape) or a dict (Phase 4E shape).
        # Only a dict with the correct code satisfies the invariant.
        if not isinstance(err, dict):
            failures.append(
                f'{method} {path}: error must be a dict with code field, '
                f'got {err!r}; body: {body_resp!r}'
            )
            continue
        code = err.get('code')
        if code not in {'VALIDATION_ERROR', 'UNKNOWN_FIELD'}:
            failures.append(
                f'{method} {path}: expected error.code in '
                f'{{"VALIDATION_ERROR","UNKNOWN_FIELD"}}, got {code!r}; '
                f'body: {body_resp!r}'
            )
            continue

        # Check the offending key is named.
        key_named = False
        errors_list = err.get('errors')
        if isinstance(errors_list, list):
            for entry in errors_list:
                if isinstance(entry, dict) and entry.get('field') == unknown_key:
                    key_named = True
                    break
        if not key_named:
            message = err.get('message', '')
            if isinstance(message, str) and unknown_key in message:
                key_named = True
        if not key_named:
            failures.append(
                f'{method} {path}: offending key {unknown_key!r} not named '
                f'in response; body: {body_resp!r}'
            )

    assert not failures, (
        'Property L smoke-test failures:\n  - ' + '\n  - '.join(failures)
    )
