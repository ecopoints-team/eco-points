"""
Phase 4E / Property S — Schema validation completeness on every mutating
``web_bp`` and ``auth_bp`` route.

**Validates: Requirements 4E.23, 4E.24** (and folds into Property L from
Phase 3 for unknown-key behavior — Requirement 4E.25.)

Property S
----------
For every POST / PUT / PATCH route registered under ``web_bp`` (the
Domain_Controllers) and ``auth_bp`` (the Auth_Controller), the wrapped
handler MUST be decorated with ``@validate_request(Schema)`` where the
schema satisfies the strict-acceptance contract::

    Schema.model_config['extra']  == 'forbid'
    Schema.model_config['strict'] is True

For every request body that fails the corresponding schema for any reason
*other* than an unknown key, the Server SHALL respond HTTP 400 with::

    error.code == 'VALIDATION_ERROR'
    error.errors == [{'field': str, 'message': str}, ...]

For every request body containing an unknown key, the Server SHALL respond
HTTP 400 with::

    error.code == 'UNKNOWN_FIELD'
    error.field == '<offending key>'

rpi-carveout (resolved)
------------------------
Phase 4A has landed. ``rpi_controller`` schemas are now authored in
``server/app/schemas/__init__.py`` and ``@validate_request`` is applied
to every RPI POST handler. This test now covers ``rpi_bp`` routes too.

Test layout
-----------
1. ``test_property_s_static_every_mutating_route_has_strict_validate_request``
   — AST walk that confirms every POST/PUT/PATCH route in the controller
   set has ``@validate_request(SchemaName)`` with a strict schema.
2. ``test_property_s_invalid_payload_yields_validation_error`` — Hypothesis
   property that injects type-mismatched payloads on a representative
   subset of routes and asserts the ``VALIDATION_ERROR`` envelope.
3. ``test_property_s_unknown_key_yields_unknown_field`` — Hypothesis
   property that injects one extra key into a valid baseline body on the
   same subset and asserts the ``UNKNOWN_FIELD`` envelope.
"""
from __future__ import annotations

import ast
import importlib
import string
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable

import jwt
import pytest
from hypothesis import HealthCheck, given, settings, strategies as st
from pydantic import BaseModel

from app import db
from app.models import (
    CommunityGroup,
    OrgType,
    Organization,
    User,
    UserSecurity,
    Wallet,
)


# ── Path resolution ─────────────────────────────────────────────────────
# `server/app/controllers/`. Property S walks the controller AST set
# enumerated by ``CONTROLLER_FILES`` below; ``rpi_controller.py`` is
# deliberately excluded (rpi-carveout).
_TESTS_DIR = Path(__file__).resolve().parents[1]
_SERVER_ROOT = _TESTS_DIR.parent
_CONTROLLERS_DIR = _SERVER_ROOT / 'app' / 'controllers'

CONTROLLER_FILES = (
    'auth_controller.py',
    'users_controller.py',
    'locations_controller.py',
    'machines_controller.py',
    'rewards_controller.py',
    'logs_controller.py',
    'leaderboard_controller.py',
    'groups_controller.py',
    'analytics_controller.py',
    'settings_controller.py',
    'sessions_controller.py',
    'dashboard_controller.py',
    'rpi_controller.py',   # Phase 4A: rpi-carveout resolved
)

_MUTATING_METHODS = {'POST', 'PUT', 'PATCH'}

# Routes that accept multipart/form-data (file uploads) instead of JSON.
# These legitimately cannot use @validate_request because the middleware
# calls request.get_json() which fails on multipart bodies.  Manual
# validation is performed inside the handler itself.
_MULTIPART_EXEMPT_ROUTES = {
    'upload_avatar',  # auth_controller: POST /avatar — file upload
}

# ════════════════════════════════════════════════════════════════════════
# Test 1: Static — every mutating route has @validate_request(StrictSchema)
# ════════════════════════════════════════════════════════════════════════


def _decorator_call_target_name(node: ast.expr) -> str | None:
    """Return the dotted name of the callee in a decorator AST node.

    Handles ``@validate_request(SomeSchema)`` (the relevant shape) plus
    the variants used elsewhere in the controllers (``@bp.route(...)``,
    ``@token_required``). Returns the bare function name without the
    namespace prefix, e.g. ``'validate_request'``.
    """
    if isinstance(node, ast.Call):
        return _decorator_call_target_name(node.func)
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _decorator_first_arg_name(node: ast.expr) -> str | None:
    """If ``node`` is an ``@foo(NAME)`` call decorator, return ``NAME`` as
    a string. Returns ``None`` when the decorator is not a call or the
    first positional argument is not a bare ``Name`` reference.

    The schema reference at every ``@validate_request(...)`` call site in
    the controllers is *always* a bare class name imported from
    ``app.schemas`` (e.g. ``UserCreateSchema``). If a future commit ever
    smuggles in something more dynamic (a subscript, a call, an
    attribute), this returns ``None`` and the static test fails loudly.
    """
    if not isinstance(node, ast.Call) or not node.args:
        return None
    first = node.args[0]
    if isinstance(first, ast.Name):
        return first.id
    return None


def _route_methods_from_decorator(node: ast.expr) -> set[str]:
    """Extract HTTP methods from a ``@<bp>.route(path, methods=[...])``
    decorator. Returns an empty set when the decorator is not a route
    call or the ``methods`` kwarg is absent.
    """
    if not isinstance(node, ast.Call):
        return set()
    callee = _decorator_call_target_name(node.func)
    if callee != 'route':
        return set()
    methods: set[str] = set()
    for kw in node.keywords:
        if kw.arg != 'methods':
            continue
        if isinstance(kw.value, (ast.List, ast.Tuple, ast.Set)):
            for elt in kw.value.elts:
                if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                    methods.add(elt.value.upper())
    return methods


def _iter_mutating_routes(tree: ast.AST):
    """Yield ``(func_node, decorators)`` for every function whose decorator
    list contains a ``.route(...)`` decorator with at least one method in
    ``_MUTATING_METHODS``. ``decorators`` is the raw decorator list in
    source order (top-to-bottom).
    """
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        # A handler typically has multiple decorators; the route call may
        # not be the first. Scan all of them.
        route_methods: set[str] = set()
        for dec in node.decorator_list:
            route_methods |= _route_methods_from_decorator(dec)
        if route_methods & _MUTATING_METHODS:
            yield node, node.decorator_list


def test_property_s_static_every_mutating_route_has_strict_validate_request():
    """Property S (static): every POST/PUT/PATCH route in
    ``auth_bp`` + every ``web_bp`` Domain_Controller MUST be decorated
    with ``@validate_request(SchemaName)`` where the schema sets
    ``model_config['extra'] == 'forbid'`` AND ``model_config['strict']
    is True``.

    The test walks the controller source AST so the schema reference is
    recovered statically (no runtime closure introspection).
    """
    schemas_module = importlib.import_module('app.schemas')

    violations: list[str] = []
    files_scanned = 0
    routes_checked = 0

    for filename in CONTROLLER_FILES:
        path = _CONTROLLERS_DIR / filename
        if not path.exists():
            violations.append(f'{path}: missing controller file')
            continue
        files_scanned += 1
        source = path.read_text(encoding='utf-8')
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError as e:
            violations.append(f'{path}: failed to parse: {e}')
            continue

        for func, decorators in _iter_mutating_routes(tree):
            routes_checked += 1
            # Locate the @validate_request(...) decorator.
            validate_decorator: ast.Call | None = None
            for dec in decorators:
                if (
                    isinstance(dec, ast.Call)
                    and _decorator_call_target_name(dec) == 'validate_request'
                ):
                    validate_decorator = dec
                    break
            if validate_decorator is None:
                if func.name in _MULTIPART_EXEMPT_ROUTES:
                    continue  # file-upload route — validated manually
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'mutating route is missing @validate_request decorator'
                )
                continue

            schema_name = _decorator_first_arg_name(validate_decorator)
            if schema_name is None:
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'@validate_request argument is not a bare Name; '
                    f'static analysis cannot resolve the schema'
                )
                continue

            schema_cls = getattr(schemas_module, schema_name, None)
            if schema_cls is None:
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'schema {schema_name!r} not found in app.schemas'
                )
                continue
            if not (isinstance(schema_cls, type) and issubclass(schema_cls, BaseModel)):
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'{schema_name!r} is not a pydantic.BaseModel subclass'
                )
                continue

            model_config = getattr(schema_cls, 'model_config', None) or {}
            extra = model_config.get('extra')
            strict = model_config.get('strict')
            if extra != 'forbid':
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'{schema_name}.model_config["extra"] is {extra!r}, '
                    f'expected "forbid"'
                )
            if strict is not True:
                violations.append(
                    f'{path.name}:{func.lineno} {func.name}: '
                    f'{schema_name}.model_config["strict"] is {strict!r}, '
                    f'expected True'
                )

    assert files_scanned == len(CONTROLLER_FILES), (
        f'Scanned {files_scanned} files, expected {len(CONTROLLER_FILES)}'
    )
    assert routes_checked > 0, (
        'No mutating routes found in the controller set; did the '
        'enumeration list go stale?'
    )
    assert not violations, (
        'Property S static violations:\n  - ' + '\n  - '.join(violations)
    )


# ════════════════════════════════════════════════════════════════════════
# Test 2 + Test 3 fixtures: live Flask app + superadmin auth context
# ════════════════════════════════════════════════════════════════════════


@pytest.fixture(scope='module')
def phase4e_context(app):
    """Seed (org, group, superadmin, target_user, target_machine,
    target_reward) and return a context dict for use in every Hypothesis
    example.

    The target rows exist only so that PUT routes hitting an existing ID
    don't 404 *before* validation runs. Validation IS the first thing
    ``@validate_request`` does — the lookup happens inside the handler —
    so the target rows are belt-and-braces; they keep the spec test
    decoupled from the handler ordering.

    The shared session-scoped ``app`` fixture from ``conftest.py`` is
    used directly (rather than building a new one with ``create_app()``)
    because ``web_bp`` is a module-level singleton in
    ``app.controllers.web_controller`` and Flask raises
    ``AssertionError: setup method ... can no longer be called`` on a
    second registration.
    """
    with app.app_context():
        suffix = uuid.uuid4().hex[:6]

        org_type = OrgType(name=f'PBT-S-Type-{suffix}')
        db.session.add(org_type)
        db.session.flush()

        org = Organization(
            name=f'PBT-S-Org-{suffix}',
            full_name='Property S Test Org',
            type_id=org_type.id,
            status='Active',
        )
        db.session.add(org)
        db.session.flush()

        group = CommunityGroup(
            organization_id=org.id,
            name='Staff',
            abbreviation='STF',
            
        )
        db.session.add(group)
        db.session.flush()

        admin = User(
            community_group_id=group.id,
            first_name='Property',
            last_name='S',
            email=f'prop-s-admin-{suffix}@example.test',
            username=f'prop_s_admin_{suffix}',
            password_hash='not-used',
            role='superadmin',
            is_active=True,
        )
        db.session.add(admin)
        db.session.flush()

        admin_wallet = Wallet(
            user_id=admin.id, points_balance=0,
            lifetime_points=0, streak=0,
        )
        db.session.add(admin_wallet)
        db.session.add(UserSecurity(user_id=admin.id, two_factor_enabled=False))

        # A second user so PUT /users/<id> can target a real row.
        target_user = User(
            community_group_id=group.id,
            first_name='Target',
            last_name='User',
            email=f'prop-s-target-{suffix}@example.test',
            username=f'prop_s_target_{suffix}',
            password_hash='not-used',
            role='user',
            is_active=True,
        )
        db.session.add(target_user)
        db.session.flush()

        target_wallet = Wallet(
            user_id=target_user.id, points_balance=100,
            lifetime_points=100, streak=0,
        )
        db.session.add(target_wallet)
        db.session.add(UserSecurity(user_id=target_user.id, two_factor_enabled=False))

        db.session.commit()

        return {
            'app': app,
            'admin_id': admin.id,
            'org_id': org.id,
            'group_id': group.id,
            'target_user_id': target_user.id,
        }


def _mint_jwt(app, user_id: int, role: str = 'superadmin') -> str:
    """Mint an HS256 JWT for the seeded superadmin."""
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(hours=1)).timestamp()),
        'jti': uuid.uuid4().hex,
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


# ────────────────────────────────────────────────────────────────────────
# Route subset for the Hypothesis tests
# ────────────────────────────────────────────────────────────────────────
#
# Each entry is a "scenario" with the path, method, and a baseline body
# the route would normally accept. The Hypothesis strategies below mutate
# the baseline to either (a) replace required fields with type-incorrect
# values (Test 2) or (b) inject one extra unknown key (Test 3).
#
# We hit a representative subset rather than the full registry so that
# 50 examples × ~5 routes finishes in CI under a minute. The subset
# specifically picks routes whose schemas have multiple distinct field
# types (str, int, bool, list[…]) so Hypothesis's type-mismatch generator
# has variety to work with.


def _user_create_baseline(ctx) -> dict[str, Any]:
    return {
        'firstName': 'Sample',
        'lastName': 'User',
        'email': f'sample-{uuid.uuid4().hex[:6]}@example.test',
        'password': 'StrongPass1',
        'role': 'user',
        'locationId': ctx['org_id'],
        'groupId': ctx['group_id'],
    }


def _user_update_baseline(ctx) -> dict[str, Any]:
    return {'firstName': 'UpdatedSample'}


def _location_create_baseline(ctx) -> dict[str, Any]:
    return {
        'name': f'PBT-Loc-{uuid.uuid4().hex[:4]}',
        'fullName': 'Property S Location',
        'status': 'Active',
    }


def _machine_create_baseline(ctx) -> dict[str, Any]:
    return {
        'locationId': ctx['org_id'],
        'name': f'PBT-RVM-{uuid.uuid4().hex[:4]}',
        'locationName': 'Lab',
    }


def _reward_create_baseline(ctx) -> dict[str, Any]:
    return {
        'locationId': ctx['org_id'],
        'name': f'PBT-Reward-{uuid.uuid4().hex[:4]}',
        'description': 'desc',
        'category': 'merchandise',
        'pointsRequired': 100,
        'isActive': True,
    }


# Scenario tuple: (name, method, path_template_factory, baseline_factory,
#                  schema_field_specs)
#
# ``schema_field_specs`` is a tuple of ``(field_name, expected_python_type)``
# pairs that names the *required-or-typed* fields the route's schema cares
# about. Test 2's strategy uses these specs to draw a field and produce
# a value of a different primitive type, guaranteeing a Pydantic
# ``*_type`` error rather than an accidental success.
ScenarioPathFactory = Callable[[dict[str, Any]], str]
ScenarioBodyFactory = Callable[[dict[str, Any]], dict[str, Any]]

SCENARIOS: tuple[tuple[str, str, ScenarioPathFactory, ScenarioBodyFactory, tuple[tuple[str, type], ...]], ...] = (
    (
        'user_create',
        'POST',
        lambda ctx: '/api/web/users',
        _user_create_baseline,
        (
            ('firstName', str), ('lastName', str), ('email', str),
            ('password', str), ('role', str),
            ('locationId', int), ('groupId', int),
        ),
    ),
    (
        'user_update',
        'PUT',
        lambda ctx: f'/api/web/users/{ctx["target_user_id"]}',
        _user_update_baseline,
        (
            ('firstName', str), ('lastName', str), ('email', str),
            ('phone', str), ('role', str), ('isActive', bool),
        ),
    ),
    (
        'location_create',
        'POST',
        lambda ctx: '/api/web/locations',
        _location_create_baseline,
        (
            ('name', str), ('fullName', str), ('status', str),
        ),
    ),
    (
        'machine_create',
        'POST',
        lambda ctx: '/api/web/machines',
        _machine_create_baseline,
        (
            ('locationId', int), ('name', str), ('locationName', str),
            ('isOnline', bool),
        ),
    ),
    (
        'reward_create',
        'POST',
        lambda ctx: '/api/web/rewards',
        _reward_create_baseline,
        (
            ('locationId', int), ('name', str), ('description', str),
            ('category', str), ('pointsRequired', int), ('isActive', bool),
        ),
    ),
)

SCENARIO_NAMES = tuple(s[0] for s in SCENARIOS)
SCENARIO_BY_NAME = {s[0]: s for s in SCENARIOS}


# ────────────────────────────────────────────────────────────────────────
# Hypothesis strategies
# ────────────────────────────────────────────────────────────────────────


# A small pool of distinctive type-mismatched values for each Python
# primitive type. Pydantic's ``strict=True`` mode rejects every cross-type
# value here:
#   - 12345 is an int (rejected for str fields)
#   - 'not-an-int' is a str (rejected for int fields)
#   - 'not-a-bool' is a str (rejected for bool fields)
#   - [...] is a list (rejected for str / int / bool fields)
# ``None`` is intentionally NOT used — every field in the schemas is
# ``Optional[...]``, so ``None`` would be a valid value and the
# resulting payload could pass validation.
_TYPE_MISMATCHES: dict[type, tuple[Any, ...]] = {
    str: (12345, True, [1, 2, 3], {'nested': 'object'}),
    int: ('not-an-int', True, [1, 2, 3], {'nested': 'object'}),
    bool: ('not-a-bool', 12345, [1, 2, 3], {'nested': 'object'}),
}


def _mismatch_strategy(target_type: type):
    """Hypothesis strategy that draws a value guaranteed to be of a
    different primitive type than ``target_type`` under strict Pydantic
    validation.
    """
    pool = _TYPE_MISMATCHES.get(target_type, ('mismatch',))
    return st.sampled_from(pool)


_KEY_ALPHABET = string.ascii_letters + string.digits + '_'


def _unknown_key_strategy(known_fields: frozenset[str]):
    """Strategy producing a string identifier that is NOT in
    ``known_fields``. Constrained to ``[A-Za-z0-9_]`` so the key looks
    like a plausible JSON field name.
    """
    return (
        st.text(alphabet=_KEY_ALPHABET, min_size=3, max_size=20)
        .filter(lambda k: k.isidentifier() and k not in known_fields)
    )


# Known-field sets per scenario, used by the unknown-key strategy below.
# These mirror every field declared in the corresponding schema (and a
# couple of legacy alias keys some schemas accept) so the unknown-key
# strategy never accidentally generates a valid field name.
_KNOWN_FIELDS_BY_SCENARIO: dict[str, frozenset[str]] = {
    'user_create': frozenset({
        'firstName', 'lastName', 'middleName', 'name',
        'username', 'email', 'phone', 'password',
        'role', 'userType', 'isActive',
        'locationId', 'groupId',
    }),
    'user_update': frozenset({
        'firstName', 'lastName', 'middleName', 'name',
        'username', 'email', 'phone', 'password',
        'role', 'userType', 'isActive',
    }),
    'location_create': frozenset({
        'name', 'fullName', 'orgType', 'status',
        'streetAddress', 'barangay', 'cityName', 'cityMunicipality',
        'province', 'region', 'zipCode',
        'contactPerson', 'contactEmail', 'contactPhone',
    }),
    'machine_create': frozenset({
        'locationId', 'machineUuid', 'name', 'locationName', 'isOnline',
    }),
    'reward_create': frozenset({
        'locationId', 'name', 'description', 'category',
        'pointsRequired', 'imageUrl', 'isActive', 'stockQuantity',
    }),
}


# ════════════════════════════════════════════════════════════════════════
# Test 2: invalid payloads → HTTP 400 VALIDATION_ERROR
# ════════════════════════════════════════════════════════════════════════


@settings(
    max_examples=50,
    deadline=None,
    suppress_health_check=[
        HealthCheck.function_scoped_fixture,
        HealthCheck.too_slow,
    ],
)
@given(data=st.data())
def test_property_s_invalid_payload_yields_validation_error(phase4e_context, data):
    """Property S: an invalid payload (wrong types, etc.) MUST produce
    HTTP 400 with ``error.code == 'VALIDATION_ERROR'`` and
    ``error.errors`` matching ``[{field, message}, ...]``.

    Strategy: pick a scenario at random, then for *every* typed field in
    the scenario's spec replace the baseline value with a value of a
    different primitive type. ``strict=True`` on the schema means any
    one of these mismatches is sufficient to fire a Pydantic
    ``*_type`` error, but injecting on every typed field maximises the
    chance of triggering at least one error even if Hypothesis happens
    to draw a value that matches the original type for one of them.
    """
    ctx = phase4e_context
    app = ctx['app']
    token = _mint_jwt(app, ctx['admin_id'])

    name = data.draw(st.sampled_from(SCENARIO_NAMES))
    _, method, path_factory, body_factory, field_specs = SCENARIO_BY_NAME[name]

    path = path_factory(ctx)
    body = dict(body_factory(ctx))

    # Replace every typed field with a value of an incorrect primitive
    # type drawn from ``_TYPE_MISMATCHES``. This guarantees at least one
    # Pydantic ``*_type`` error per request.
    for field_name, expected_type in field_specs:
        body[field_name] = data.draw(_mismatch_strategy(expected_type))

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

    assert resp.status_code == 400, (
        f'Expected HTTP 400 for {method} {path} with type-mismatched body '
        f'{body!r}, got {resp.status_code}: {resp.get_data(as_text=True)}'
    )
    payload = resp.get_json()
    assert payload is not None, (
        f'Response must be JSON for {method} {path}; got '
        f'{resp.get_data(as_text=True)!r}'
    )
    assert payload.get('success') is False, (
        f'success must be False for {method} {path}; got {payload!r}'
    )
    err = payload.get('error')
    assert isinstance(err, dict), (
        f'error must be a dict for {method} {path}; got {err!r}'
    )
    assert err.get('code') == 'VALIDATION_ERROR', (
        f'Expected error.code == "VALIDATION_ERROR" for {method} {path} '
        f'with body {body!r}; got error={err!r}'
    )
    errors = err.get('errors')
    assert isinstance(errors, list) and errors, (
        f'error.errors must be a non-empty list for {method} {path}; '
        f'got {errors!r}'
    )
    for entry in errors:
        assert isinstance(entry, dict), (
            f'every error.errors entry must be a dict; got {entry!r}'
        )
        assert 'field' in entry and isinstance(entry['field'], str), (
            f'error.errors entry missing "field" key or wrong type: {entry!r}'
        )
        assert 'message' in entry and isinstance(entry['message'], str), (
            f'error.errors entry missing "message" key or wrong type: '
            f'{entry!r}'
        )


# ════════════════════════════════════════════════════════════════════════
# Test 3: unknown-key payloads → HTTP 400 UNKNOWN_FIELD
# ════════════════════════════════════════════════════════════════════════


@settings(
    max_examples=50,
    deadline=None,
    suppress_health_check=[
        HealthCheck.function_scoped_fixture,
        HealthCheck.too_slow,
    ],
)
@given(data=st.data())
def test_property_s_unknown_key_yields_unknown_field(phase4e_context, data):
    """Property S: a request body containing one extra key not declared
    in the route's schema MUST produce HTTP 400 with
    ``error.code == 'UNKNOWN_FIELD'`` and ``error.field`` populated with
    the offending key.

    Strategy: pick a scenario at random, build the baseline (schema-valid)
    body, then inject one extra random ``[A-Za-z0-9_]`` key whose value
    is also random. Because ``_unknown_key_strategy`` filters the key
    against the scenario's ``KNOWN_FIELDS`` set, the injected key is
    guaranteed to be unknown to the schema.
    """
    ctx = phase4e_context
    app = ctx['app']
    token = _mint_jwt(app, ctx['admin_id'])

    name = data.draw(st.sampled_from(SCENARIO_NAMES))
    _, method, path_factory, body_factory, _field_specs = SCENARIO_BY_NAME[name]

    path = path_factory(ctx)
    body = dict(body_factory(ctx))

    unknown_key = data.draw(_unknown_key_strategy(_KNOWN_FIELDS_BY_SCENARIO[name]))
    unknown_value = data.draw(
        st.text(alphabet=string.printable, min_size=0, max_size=30)
    )
    body[unknown_key] = unknown_value

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

    assert resp.status_code == 400, (
        f'Expected HTTP 400 for {method} {path} with unknown key '
        f'{unknown_key!r}, got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )
    payload = resp.get_json()
    assert payload is not None, (
        f'Response must be JSON for {method} {path}; got '
        f'{resp.get_data(as_text=True)!r}'
    )
    assert payload.get('success') is False, (
        f'success must be False for {method} {path}; got {payload!r}'
    )
    err = payload.get('error')
    assert isinstance(err, dict), (
        f'error must be a dict for {method} {path}; got {err!r}'
    )
    assert err.get('code') == 'UNKNOWN_FIELD', (
        f'Expected error.code == "UNKNOWN_FIELD" for {method} {path} '
        f'with unknown key {unknown_key!r}; got error={err!r}'
    )
    field = err.get('field')
    assert isinstance(field, str) and field, (
        f'error.field must be a non-empty string for {method} {path}; '
        f'got {field!r}'
    )
    # The offending key must match what we injected. Pydantic emits the
    # ``loc`` tuple as ``(unknown_key,)`` for top-level extra keys and
    # ``_format_loc`` renders that as a bare key string.
    assert field == unknown_key, (
        f'error.field={field!r} does not match injected unknown key '
        f'{unknown_key!r} for {method} {path}'
    )
