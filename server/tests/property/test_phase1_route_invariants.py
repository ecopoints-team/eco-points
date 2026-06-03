"""
Phase 1 / Properties D & F — Backward-compatible API paths and Phase-1
decorator preservation.

Validates: Requirements 1.2, 1.5, 1.7, 7.1.

Property D — Backward-compatible API paths
==========================================
For every (method, rule) pair P snapshotted in
`server/tests/fixtures/route_snapshot_pre_phase1.json` immediately before
the Phase 1 controller split, the same (method, rule, endpoint) MUST
still be registered on the live `app.url_map` after the split. The
endpoint name MUST survive — preserving it is what lets us recover the
authorization-decorator metadata for Property F via the blueprint
registry.

The full Property D statement also requires identical success status
code and identical top-level JSON-key set per endpoint. Exercising every
authenticated handler requires DB seeding, JWT minting, and per-handler
request body construction — enormous test scaffolding for a phase whose
only mandate is restructuring. The pragmatic split used here:

* Implement the **route presence + inventory** part as a strict
  assertion: every snapshotted (method, rule, endpoint) is present in
  `app.url_map`, no entry is dropped, no entry is renamed, and no extra
  HTTP method is added to a snapshotted rule.
* Implement the **status-code + JSON-shape** invariant only for the
  public `/api/web/health` endpoint, which is the one snapshotted route
  that needs neither authentication nor seeded DB rows. Comprehensive
  shape checking across the authenticated endpoints is deferred to
  Phase 2's Property J / integration tests, which already have to build
  the full RBAC fixture machinery.

Property F — Phase-1 decorator preservation
============================================
For every surviving handler, the multiset of authorization decorator
names attached to the function MUST equal the multiset snapshotted
before the split. The set of authorization decorators tracked is
`{token_required, admin_required, permission_required,
superadmin_required}`; everything else (route registration, rate
limiters, etc.) is filtered out, matching the convention used by the
fixture.

Decorator names are recovered by AST-walking every Python file under
`server/app/controllers/`, identifying each file's blueprint via its
`Blueprint('<name>', __name__, ...)` assignment, and keying each
function by `(blueprint_name, function_name)`. Snapshot endpoints are
mapped to the same key by splitting on `.`: the LAST segment is the
function name and the segment immediately before it is the blueprint
name (e.g. `web.users.get_users` → `('users', 'get_users')`,
`web.health_check` → `('web', 'health_check')`,
`auth.login` → `('auth', 'login')`).
"""
from __future__ import annotations

import ast
import json
from collections import Counter
from pathlib import Path
from typing import Iterable

import pytest

# `app` is on sys.path via tests/conftest.py.
from app import create_app


# ── Paths ─────────────────────────────────────────────────────────
_HERE = Path(__file__).resolve().parent
_TESTS_DIR = _HERE.parent
_FIXTURE_PATH = _TESTS_DIR / 'fixtures' / 'route_snapshot_pre_phase1.json'

_SERVER_ROOT = _TESTS_DIR.parent
_CONTROLLERS_DIR = _SERVER_ROOT / 'app' / 'controllers'

# The set of authorization decorators that Phase 1 promises to preserve
# byte-for-byte. Anything outside this set (route decorators, rate
# limiters, etc.) is filtered out before multiset comparison so that the
# live AST-recovered decorator list matches the snapshot's filtered
# convention.
AUTH_DECORATORS = frozenset({
    'token_required',
    'admin_required',
    'permission_required',
    'superadmin_required',
})


# ── Fixtures ──────────────────────────────────────────────────────
# The session-scoped `app` fixture is provided by
# `server/tests/property/conftest.py` so that both this module and
# `test_phase2_granularity.py` share the same `create_app()` invocation.
# (Re-defining it here would break Phase 2 — `web_bp` is a module-level
# singleton in `app.controllers.web_controller`, and Flask raises if its
# sub-blueprints are registered twice.)


@pytest.fixture(scope='session')
def snapshot():
    """Load the pre-Phase-1 route inventory snapshot once per session."""
    with _FIXTURE_PATH.open(encoding='utf-8') as fh:
        return json.load(fh)


# ── AST helpers ───────────────────────────────────────────────────
def _decorator_name(node: ast.expr) -> str | None:
    """Return the bare callable name of a decorator AST node.

    Handles:
        @foo                  → 'foo'
        @foo(...)             → 'foo'
        @foo.bar              → 'bar'
        @foo.bar(...)         → 'bar'
    Returns None for unrecognized shapes.
    """
    if isinstance(node, ast.Call):
        return _decorator_name(node.func)
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


def _blueprint_name_from_module(tree: ast.AST) -> str | None:
    """Find the first `... = Blueprint('<name>', ...)` assignment in the
    module and return the first positional argument string. Returns
    None if no such assignment exists (e.g. `_shared.py`,
    `__init__.py`).
    """
    for node in ast.walk(tree):
        if not isinstance(node, ast.Assign):
            continue
        value = node.value
        if not isinstance(value, ast.Call):
            continue
        callee = value.func
        callee_name: str | None = None
        if isinstance(callee, ast.Name):
            callee_name = callee.id
        elif isinstance(callee, ast.Attribute):
            callee_name = callee.attr
        if callee_name != 'Blueprint':
            continue
        if not value.args:
            continue
        first = value.args[0]
        if isinstance(first, ast.Constant) and isinstance(first.value, str):
            return first.value
    return None


def _iter_controller_files() -> Iterable[Path]:
    """Yield every `.py` file under `server/app/controllers/` excluding
    `__pycache__` directories.
    """
    if not _CONTROLLERS_DIR.exists():
        return
    for path in _CONTROLLERS_DIR.rglob('*.py'):
        if any(part == '__pycache__' for part in path.parts):
            continue
        yield path


def _build_decorator_index() -> dict[tuple[str, str], list[str]]:
    """Walk every controller file once, parse it, and return a mapping
    `{(blueprint_name, function_name): [auth_decorator_names_in_source_order]}`.

    Decorators in `node.decorator_list` are in top-to-bottom source
    order (i.e. `decorator_list[0]` is the outermost `@`). Only
    decorators in `AUTH_DECORATORS` are recorded; route registration
    decorators like `@<bp>.route(...)` and rate limiters like
    `@limiter.limit(...)` are intentionally dropped so the multiset
    comparison matches the snapshot's filtered convention.
    """
    index: dict[tuple[str, str], list[str]] = {}
    for path in _iter_controller_files():
        source = path.read_text(encoding='utf-8')
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError:
            continue
        bp_name = _blueprint_name_from_module(tree)
        if bp_name is None:
            continue
        for node in ast.walk(tree):
            if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            auth_decorators: list[str] = []
            for dec in node.decorator_list:
                name = _decorator_name(dec)
                if name in AUTH_DECORATORS:
                    auth_decorators.append(name)
            # Last writer wins on the rare collision (same blueprint
            # name reused across files); in practice each blueprint
            # name is unique to a single controller file.
            index[(bp_name, node.name)] = auth_decorators
    return index


# ── Snapshot endpoint → (blueprint, func) mapping ──────────────────
def _split_endpoint(endpoint: str) -> tuple[str, str]:
    """Split an endpoint string into `(blueprint_name, function_name)`.

    Examples:
        'auth.login'                       → ('auth', 'login')
        'web.users.get_users'              → ('users', 'get_users')
        'web.health_check'                 → ('web', 'health_check')
        'web.sessions.create_bulk_deposit' → ('sessions', 'create_bulk_deposit')

    The LAST dotted segment is the function name. The segment
    immediately before it is the blueprint name — for sub-blueprints
    Flask flattens the endpoint as `<parent>.<child>.<func>`, so the
    parent prefix (`web.`) drops out and we keep the child blueprint
    name. For routes registered directly on `web_bp` itself (e.g. the
    public health route), only `web.<func>` appears and the blueprint
    name is `web`.
    """
    parts = endpoint.split('.')
    if len(parts) < 2:
        raise ValueError(f'unexpected endpoint shape: {endpoint!r}')
    func_name = parts[-1]
    blueprint_name = parts[-2]
    return blueprint_name, func_name


# ── Property D: route presence ────────────────────────────────────
def test_property_d_route_presence_and_inventory_unchanged(app, snapshot):
    """Property D — every snapshotted (method, rule, endpoint) MUST
    still be registered on the live `app.url_map` after the Phase 1
    split. No entry may be dropped or renamed, and no extra HTTP method
    may be added to a snapshotted rule beyond the auto-injected
    `HEAD`/`OPTIONS`.

    The status-code + JSON-shape part of Property D is exercised
    separately by `test_property_d_health_endpoint_smoke` for the one
    snapshotted route that needs neither auth nor seeded DB rows;
    comprehensive request/response checking on authenticated endpoints
    is deferred to Phase 2's Property J / integration tests.
    """
    # Build a quick lookup from the live `url_map`: keyed by rule
    # string, value = list of (endpoint, methods_set_minus_HEAD_OPTIONS).
    # Flask auto-adds HEAD for GET routes and OPTIONS for everything;
    # the snapshot does not record these, so they are stripped before
    # comparison.
    live: dict[str, list[tuple[str, frozenset[str]]]] = {}
    for rule in app.url_map.iter_rules():
        methods = frozenset(rule.methods or ()) - {'HEAD', 'OPTIONS'}
        live.setdefault(rule.rule, []).append((rule.endpoint, methods))

    missing: list[str] = []
    for entry in snapshot:
        method = entry['method']
        rule = entry['rule']
        endpoint = entry['endpoint']

        candidates = live.get(rule)
        if not candidates:
            missing.append(
                f'rule {rule!r} (snapshot endpoint {endpoint!r}, '
                f'method {method!r}) not present in live app.url_map'
            )
            continue

        matched = False
        for live_endpoint, live_methods in candidates:
            if live_endpoint == endpoint and method in live_methods:
                matched = True
                break
        if not matched:
            live_repr = ', '.join(
                f'endpoint={ep!r} methods={sorted(ms)}'
                for ep, ms in candidates
            )
            missing.append(
                f'snapshot entry method={method!r} rule={rule!r} '
                f'endpoint={endpoint!r} not found on live url_map; '
                f'live registrations for this rule: [{live_repr}]'
            )

    assert not missing, (
        'Property D — route inventory drift detected after Phase 1 split:\n  - '
        + '\n  - '.join(missing)
    )


def test_property_d_health_endpoint_smoke(app):
    """Property D (response-shape sample): the public health endpoint
    `GET /api/web/health` MUST still respond HTTP 200 with a JSON body
    whose top-level keys include `success`. This is the one snapshotted
    endpoint that needs neither authentication nor seeded DB rows;
    comprehensive shape assertions across authenticated endpoints are
    deferred to Phase 2's Property J / integration tests, which build
    the full RBAC + JWT-minting fixture machinery.
    """
    with app.test_client() as client:
        resp = client.get('/api/web/health')

    assert resp.status_code == 200, (
        f'GET /api/web/health expected 200, got {resp.status_code}: '
        f'{resp.get_data(as_text=True)}'
    )
    body = resp.get_json()
    assert isinstance(body, dict), (
        f'health response body must be a JSON object, got {body!r}'
    )
    assert 'success' in body, (
        f'health response body must contain top-level "success" key, '
        f'got keys {sorted(body.keys())}'
    )


# ── Property F: decorator preservation ────────────────────────────
def test_property_f_decorator_multiset_preserved(snapshot):
    """Property F — for every snapshotted endpoint, the multiset of
    authorization decorator names attached to the surviving handler
    (recovered by AST-walking `server/app/controllers/`) MUST equal the
    multiset of names recorded in the snapshot.

    Authorization decorators tracked: `{token_required, admin_required,
    permission_required, superadmin_required}`. Every other decorator
    (route registration, rate limiters, third-party utilities, etc.) is
    filtered out before comparison so live and snapshot lists are
    apples-to-apples.
    """
    decorator_index = _build_decorator_index()

    mismatches: list[str] = []
    for entry in snapshot:
        endpoint = entry['endpoint']
        snapshot_decorators = list(entry.get('decorators') or [])

        try:
            key = _split_endpoint(endpoint)
        except ValueError as e:
            mismatches.append(f'{endpoint}: {e}')
            continue

        if key not in decorator_index:
            mismatches.append(
                f'endpoint {endpoint!r} — function {key[1]!r} on '
                f'blueprint {key[0]!r} not found while AST-walking '
                f'server/app/controllers/; cannot verify decorators'
            )
            continue

        live_decorators = decorator_index[key]
        live_counter = Counter(live_decorators)
        snap_counter = Counter(snapshot_decorators)
        if live_counter != snap_counter:
            mismatches.append(
                f'endpoint {endpoint!r}: snapshot decorators '
                f'{sorted(snapshot_decorators)} != live decorators '
                f'{sorted(live_decorators)}'
            )

    assert not mismatches, (
        'Property F — authorization decorator multiset drift after Phase 1:\n  - '
        + '\n  - '.join(mismatches)
    )
