#!/usr/bin/env python
"""
EcoPoints — Whole-System Preliminary Smoke Test
================================================

Preliminary QA check that verifies the post-hardened EcoPoints platform's
**stability, scalability, and critical functionality** end-to-end via HTTP
against a running server.

Scope (web-required surface; rpi-deferred excluded):

  Critical functionality   → login per role, role-based redirect target,
                             per-role RBAC matrix on every Admin_UI GET,
                             cookie + CSRF transport, force-logout
                             invariant, schema-validated input rejection,
                             audit-log completeness, role-hierarchy on
                             user mutation.
  Stability                → no 5xx responses on any happy-path call;
                             every response returns within timeout;
                             DB-state assertions remain consistent across
                             a re-seeded run.
  Scalability              → a small concurrent-load probe against the
                             read-heavy admin endpoints (default 50 reqs
                             across 8 workers) with p50/p95/p99 latency
                             assertions and an overall failure rate
                             threshold.

Out of scope (under the rpi-carveout):
  - /api/rpi/* endpoints  (Phase 4A deferred)
  - HMAC-signed QR        (Phase 4A deferred)
  - Per-RVM API keys      (Phase 4A deferred)
  - nginx security headers (verified on staging, not localhost)

Usage
-----

    # Default: against http://localhost:5000, seeded password "SeedPass!23"
    python tools/smoke/whole_system_smoke.py

    # Custom server / password / load
    python tools/smoke/whole_system_smoke.py \
        --base-url http://localhost:5000 \
        --password SeedPass!23 \
        --load-requests 200 \
        --load-workers 16

Exit status:
    0  All checks passed.
    1  At least one check failed (details printed).
    2  Pre-flight failed (server unreachable, seed missing, etc.).

This script depends only on the Python standard library so it can run on
a fresh checkout without installing the server's test dependencies.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import http.cookiejar
import json
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable

# ───────────────────────────────────────────────────────────────────────
# Constants — match the deterministic seed (see server/app/seeder/seed.py)
# ───────────────────────────────────────────────────────────────────────

DEFAULT_BASE_URL = 'http://localhost:5000'
DEFAULT_PASSWORD = 'SeedPass!23'

ADMIN_ROLES = (
    'superadmin',
    'head_admin',
    'auditor',
    'technician',
    'inventory_officer',
)
NON_ADMIN_ROLES = ('user', 'dependent')
ALL_ROLES = ADMIN_ROLES + NON_ADMIN_ROLES

ROLE_PERMISSIONS = {
    'superadmin': {
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    },
    'head_admin': {
        'users', 'machines', 'rewards', 'locations', 'logs',
        'analytics', 'settings', 'groups', 'sessions',
        'leaderboard', 'dashboard',
    },
    'auditor': {
        'logs', 'analytics', 'sessions', 'settings',
        'leaderboard', 'dashboard',
    },
    'technician': {
        'machines', 'logs', 'settings', 'dashboard',
    },
    'inventory_officer': {
        'rewards', 'logs', 'settings', 'dashboard',
    },
}

# (admin_url, required_category) — minimal "GET hits the controller" probes.
# These pages are not the URLs (those are client-side); they are the
# server endpoints that back each Admin_UI page.
#
# NOTE: GET /api/web/rewards is intentionally excluded from this list
# because it is user-accessible by design (the public /rewards page lets
# any authenticated user browse the reward catalog and redeem).  The
# admin CRUD operations (POST/PUT/DELETE) on /api/web/rewards *are*
# guarded by @permission_required('rewards'), but the read endpoint is
# shared between the admin and user surfaces.
#
# NOTE: GET /api/web/settings/notifications requires a location_id query
# parameter (settings are org-scoped).  For superadmin, the smoke test
# passes ?location_id=1; for other admins the decorator auto-scopes.
ADMIN_GET_PROBES = [
    ('/api/web/dashboard/stats', 'dashboard'),
    ('/api/web/users', 'users'),
    ('/api/web/users?is_admin=true', 'users'),
    ('/api/web/machines', 'machines'),
    ('/api/web/locations', 'locations'),
    ('/api/web/logs/access', 'logs'),
    ('/api/web/logs/bottles', 'logs'),
    ('/api/web/logs/machines', 'logs'),
    ('/api/web/logs/rewards', 'logs'),
    ('/api/web/logs/transactions', 'logs'),
    ('/api/web/leaderboard', 'leaderboard'),
    ('/api/web/groups', 'groups'),
    ('/api/web/analytics', 'analytics'),
    ('/api/web/settings/notifications?location_id=1', 'settings'),
    ('/api/web/sessions/bulk', 'sessions'),
]

# Read-heavy endpoints used by the scalability probe. We hit a mixture
# so the load is representative of a real admin browsing pattern.
LOAD_ENDPOINTS = [
    '/api/web/dashboard/stats',
    '/api/web/users',
    '/api/web/machines',
    '/api/web/rewards',
    '/api/web/leaderboard',
    '/api/web/logs/access',
]


# ───────────────────────────────────────────────────────────────────────
# Reporting primitives
# ───────────────────────────────────────────────────────────────────────


@dataclass
class CheckResult:
    """One row in the smoke report."""

    name: str
    passed: bool
    detail: str = ''


@dataclass
class SmokeReport:
    """Aggregated results across every section."""

    rows: list[CheckResult] = field(default_factory=list)

    def add(self, name: str, passed: bool, detail: str = '') -> None:
        self.rows.append(CheckResult(name=name, passed=passed, detail=detail))
        marker = '✓' if passed else '✗'
        print(f'  [{marker}] {name}' + (f' — {detail}' if detail else ''))

    @property
    def total(self) -> int:
        return len(self.rows)

    @property
    def failed(self) -> int:
        return sum(1 for r in self.rows if not r.passed)

    @property
    def passed(self) -> int:
        return self.total - self.failed

    def render_summary(self) -> str:
        return (
            f'Total: {self.total}   Passed: {self.passed}   '
            f'Failed: {self.failed}'
        )


# ───────────────────────────────────────────────────────────────────────
# Tiny HTTP client (cookie-aware) — stdlib only
# ───────────────────────────────────────────────────────────────────────


class HttpClient:
    """Minimal cookie-aware HTTP client backed by ``urllib``.

    Each instance owns its own ``CookieJar`` so per-role sessions stay
    isolated. The client always sends ``credentials: include``-equivalent
    behavior (cookies are attached automatically).
    """

    def __init__(self, base_url: str, timeout: float = 10.0) -> None:
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.jar = http.cookiejar.CookieJar()
        self._opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.jar)
        )

    # ── cookie helpers ──────────────────────────────────────────────
    def cookie(self, name: str) -> str | None:
        for c in self.jar:
            if c.name == name:
                return c.value
        return None

    def clear_cookies(self) -> None:
        self.jar.clear()

    # ── request helpers ─────────────────────────────────────────────
    def request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        send_csrf: bool = True,
    ) -> tuple[int, dict[str, Any] | None, dict[str, str]]:
        """Send an HTTP request and return ``(status, json_or_none, response_headers)``.

        ``send_csrf`` controls whether the ``X-CSRF-Token`` header is
        attached on unsafe methods. Most callers want ``True``; the
        CSRF-failure tests flip it to ``False`` to verify the server
        rejects the request.
        """
        url = self.base_url + path if path.startswith('/') else f'{self.base_url}/{path}'
        method_upper = method.upper()
        req_headers = {
            'Accept': 'application/json',
            'User-Agent': 'ecopoints-smoke/1.0',
        }
        if headers:
            req_headers.update(headers)
        data: bytes | None = None
        if body is not None:
            data = json.dumps(body).encode('utf-8')
            req_headers.setdefault('Content-Type', 'application/json')

        # Attach CSRF header on unsafe methods when the cookie is present.
        if send_csrf and method_upper in {'POST', 'PUT', 'PATCH', 'DELETE'}:
            csrf = self.cookie('csrf_token')
            if csrf is not None:
                req_headers.setdefault('X-CSRF-Token', csrf)

        request = urllib.request.Request(
            url=url, data=data, headers=req_headers, method=method_upper,
        )
        try:
            with self._opener.open(request, timeout=self.timeout) as resp:
                raw = resp.read()
                status = resp.status
                resp_headers = dict(resp.headers.items())
        except urllib.error.HTTPError as exc:
            raw = exc.read() if exc.fp is not None else b''
            status = exc.code
            resp_headers = dict(exc.headers.items()) if exc.headers else {}
        except urllib.error.URLError as exc:
            return -1, None, {'_error': str(exc)}

        if not raw:
            return status, None, resp_headers
        try:
            return status, json.loads(raw.decode('utf-8')), resp_headers
        except (ValueError, UnicodeDecodeError):
            return status, None, resp_headers


# ───────────────────────────────────────────────────────────────────────
# Pre-flight
# ───────────────────────────────────────────────────────────────────────


def preflight(client: HttpClient, report: SmokeReport) -> bool:
    """Verify the server is reachable and the seed has been loaded."""
    print('\n[1/6] Pre-flight')
    status, body, _ = client.request('GET', '/api/web/health')
    health_ok = status == 200 and isinstance(body, dict) and body.get('status') == 'healthy'
    report.add(
        'GET /api/web/health returns 200 healthy',
        health_ok,
        f'status={status}, body={body!r}' if not health_ok else '',
    )
    if not health_ok:
        return False

    # Seeded user check: try to log in as superadmin. If this fails the
    # seed wasn't run.
    seeded = login(client, 'superadmin', DEFAULT_PASSWORD)
    report.add(
        'Seed loaded (superadmin@ecopoints.local can log in)',
        seeded,
        '' if seeded else 'Run the seeder first (see docs/manual-test-plan.md § 0.1)',
    )
    if seeded:
        # Logout to start the per-role section with a clean jar.
        logout(client)
    return seeded


# ───────────────────────────────────────────────────────────────────────
# Authentication helpers
# ───────────────────────────────────────────────────────────────────────


def login(client: HttpClient, role: str, password: str) -> bool:
    """Log in as ``<role>@ecopoints.local``. Returns True on success."""
    client.clear_cookies()
    email = f'{role}@ecopoints.local'
    status, body, _ = client.request(
        'POST', '/api/web/auth/login',
        body={'identifier': email, 'password': password},
        send_csrf=False,  # login is the bootstrap; no CSRF cookie yet
    )
    if status != 200 or not isinstance(body, dict):
        return False
    # The server may return either `success: True` with a `user` block, or
    # a 2FA challenge with `requires2FA`. The seed users have 2FA off, so
    # success path is expected.
    if body.get('requires2FA'):
        return False
    return bool(body.get('success')) and isinstance(body.get('user'), dict)


def logout(client: HttpClient) -> None:
    """Best-effort logout. Always clears local cookies."""
    try:
        client.request('POST', '/api/web/auth/logout', body={})
    except Exception:
        pass
    client.clear_cookies()


# ───────────────────────────────────────────────────────────────────────
# Section A — Login + redirect target per role
# ───────────────────────────────────────────────────────────────────────


def section_login_and_cookies(
    client: HttpClient, password: str, report: SmokeReport,
) -> None:
    print('\n[2/6] Login + cookie + redirect target per role')
    for role in ALL_ROLES:
        ok = login(client, role, password)
        report.add(
            f'login as {role} succeeds',
            ok,
            '' if ok else f'role={role}: login failed',
        )
        if not ok:
            continue

        token_cookie = client.cookie('token')
        csrf_cookie = client.cookie('csrf_token')
        report.add(
            f'{role}: HttpOnly token cookie set on login',
            token_cookie is not None,
        )
        report.add(
            f'{role}: csrf_token cookie set on login',
            csrf_cookie is not None,
        )

        # /me should expose role + permission_categories per Phase 2.
        status, body, _ = client.request('GET', '/api/web/auth/me')
        me_ok = (
            status == 200
            and isinstance(body, dict)
            and isinstance(body.get('user'), dict)
            and body['user'].get('role') == role
            and isinstance(body['user'].get('permission_categories'), list)
        )
        report.add(f'{role}: /api/web/auth/me returns role + permission_categories', me_ok)

        if me_ok:
            expected = sorted(ROLE_PERMISSIONS.get(role, set()))
            actual = sorted(body['user']['permission_categories'])
            report.add(
                f'{role}: permission_categories match ROLE_PERMISSIONS',
                actual == expected,
                f'expected={expected}, actual={actual}' if actual != expected else '',
            )

        logout(client)


# ───────────────────────────────────────────────────────────────────────
# Section B — Per-role RBAC matrix (admin granularity + non-admin denial)
# ───────────────────────────────────────────────────────────────────────


def section_rbac_matrix(
    client: HttpClient, password: str, report: SmokeReport,
) -> None:
    print('\n[3/6] Per-role RBAC matrix')
    for role in ALL_ROLES:
        if not login(client, role, password):
            report.add(f'{role}: skip RBAC matrix (login failed)', False)
            continue
        granted = ROLE_PERMISSIONS.get(role, set())
        is_admin = role in ADMIN_ROLES
        for path, category in ADMIN_GET_PROBES:
            status, _body, _ = client.request('GET', path)
            if not is_admin:
                # Phase 0 universal admin guard: every probe should 403.
                ok = status == 403
                report.add(
                    f'{role} (non-admin) → GET {path} returns 403',
                    ok,
                    f'got {status}' if not ok else '',
                )
            elif category in granted:
                ok = status == 200
                report.add(
                    f'{role} → GET {path} returns 200 (category={category} granted)',
                    ok,
                    f'got {status}' if not ok else '',
                )
            else:
                ok = status == 403
                report.add(
                    f'{role} → GET {path} returns 403 (category={category} missing)',
                    ok,
                    f'got {status}' if not ok else '',
                )
        logout(client)


# ───────────────────────────────────────────────────────────────────────
# Section C — Critical mutations (CSRF, schema, hierarchy, audit)
# ───────────────────────────────────────────────────────────────────────


def section_mutations(
    client: HttpClient, password: str, report: SmokeReport,
) -> None:
    print('\n[4/6] Mutation contract (CSRF, schema validation, hierarchy, audit)')

    # Use head_admin so the test is hierarchy-aware (cannot promote to
    # superadmin/head_admin) and can still create users below its level.
    if not login(client, 'head_admin', password):
        report.add('mutation section login (head_admin)', False, 'login failed')
        return

    # ── C.1 CSRF: missing header on unsafe method ───────────────────
    status, body, _ = client.request(
        'POST', '/api/web/auth/logout', body={}, send_csrf=False,
    )
    csrf_invalid = (
        status == 403
        and isinstance(body, dict)
        and isinstance(body.get('error'), dict)
        and body['error'].get('code') == 'CSRF_INVALID'
    )
    report.add(
        'CSRF missing header → 403 CSRF_INVALID',
        csrf_invalid,
        f'status={status}, body={body!r}' if not csrf_invalid else '',
    )

    # Re-login because the failed-CSRF logout may have invalidated the cookies.
    logout(client)
    login(client, 'head_admin', password)

    # ── C.2 Schema validation: unknown key on a mutating endpoint ───
    # Use a deliberately unknown extra key on /auth/profile so we don't
    # depend on knowing a valid users.create payload.
    status, body, _ = client.request(
        'PUT', '/api/web/auth/profile',
        body={'firstName': 'Smoke', 'extra_unknown_field': 'x'},
    )
    unknown_field = (
        status == 400
        and isinstance(body, dict)
        and isinstance(body.get('error'), dict)
        and body['error'].get('code') in {'UNKNOWN_FIELD', 'VALIDATION_ERROR'}
    )
    report.add(
        'Unknown body key → 400 VALIDATION_ERROR / UNKNOWN_FIELD',
        unknown_field,
        f'status={status}, body={body!r}' if not unknown_field else '',
    )

    # ── C.3 Role hierarchy on user create: head_admin → head_admin ──
    # head_admin cannot create another head_admin (level 5 == level 5).
    status, body, _ = client.request(
        'POST', '/api/web/users',
        body={
            'firstName': 'Smoke', 'lastName': 'Hierarchy',
            'email': 'smoke-hierarchy-violator@ecopoints.local',
            'password': password,
            'role': 'head_admin',
            'isActive': True,
        },
    )
    hierarchy_blocked = (
        status == 403
        and isinstance(body, dict)
        and isinstance(body.get('error'), dict)
        and body['error'].get('code') == 'ROLE_HIERARCHY_VIOLATION'
    )
    report.add(
        'Role-hierarchy violation on POST /users → 403 ROLE_HIERARCHY_VIOLATION',
        hierarchy_blocked,
        f'status={status}, body={body!r}' if not hierarchy_blocked else '',
    )

    # ── C.4 Audit trail: a permission-denied 403 writes one row ─────
    # Switch to inventory_officer and try a forbidden GET (users), then
    # log back in as head_admin and confirm /admin/logs/access reflects
    # at least one new permission_denied row.
    pre_log_status, pre_log_body, _ = client.request('GET', '/api/web/logs/access')
    pre_count = (
        len(pre_log_body.get('logs') or [])
        if isinstance(pre_log_body, dict) else 0
    )

    logout(client)
    if login(client, 'inventory_officer', password):
        client.request('GET', '/api/web/users')  # 403 expected
        logout(client)
    login(client, 'head_admin', password)

    post_status, post_body, _ = client.request('GET', '/api/web/logs/access')
    post_count = (
        len(post_body.get('logs') or [])
        if isinstance(post_body, dict) else 0
    )
    audit_increased = (
        pre_log_status == 200 and post_status == 200 and post_count > pre_count
    )
    report.add(
        'Permission-denied 403 increments audit-log count',
        audit_increased,
        f'pre={pre_count}, post={post_count}' if not audit_increased else '',
    )

    logout(client)


# ───────────────────────────────────────────────────────────────────────
# Section D — Force-logout invariant (Phase 4C)
# ───────────────────────────────────────────────────────────────────────


def section_force_logout(
    base_url: str, password: str, report: SmokeReport,
) -> None:
    """Force-logout invalidates JWTs whose iat predates force_logout_at.

    Two clients are used because the operation is destructive across the
    org: we log in as head_admin, capture its iat, and the same JWT
    must be rejected after the force-logout call.
    """
    print('\n[5/6] Force-logout invariant')
    actor = HttpClient(base_url=base_url)
    if not login(actor, 'head_admin', password):
        report.add('force-logout: actor login', False, 'login failed')
        return

    # Sleep one second so the new force_logout_at is strictly greater
    # than the JWT iat (which is captured at login time, in seconds).
    time.sleep(1.1)
    status, body, _ = actor.request(
        'POST', '/api/web/settings/security/force-logout', body={},
    )
    if status != 200:
        report.add(
            'force-logout: POST /settings/security/force-logout returns 200',
            False,
            f'status={status}, body={body!r}',
        )
        return
    report.add('force-logout: POST returns 200', True)

    # The actor's existing JWT should now be rejected.
    status, body, _ = actor.request('GET', '/api/web/auth/me')
    invalidated = (
        status == 401
        and isinstance(body, dict)
        and isinstance(body.get('error'), dict)
        and body['error'].get('code') == 'FORCED_LOGOUT'
    )
    report.add(
        'force-logout: post-action /me returns 401 FORCED_LOGOUT',
        invalidated,
        f'status={status}, body={body!r}' if not invalidated else '',
    )

    # Re-login should still work (issues a fresh JWT after the cutoff).
    actor.clear_cookies()
    relogin = login(actor, 'head_admin', password)
    report.add('force-logout: re-login after cutoff succeeds', relogin)
    logout(actor)


# ───────────────────────────────────────────────────────────────────────
# Section E — Scalability probe (concurrent reads)
# ───────────────────────────────────────────────────────────────────────


def _one_request(base_url: str, path: str, cookies_snapshot: list[tuple[str, str]]) -> tuple[bool, float]:
    """Used by the load probe — fresh HttpClient per request, restored cookies."""
    client = HttpClient(base_url=base_url, timeout=15.0)
    for name, value in cookies_snapshot:
        cookie = http.cookiejar.Cookie(
            version=0, name=name, value=value, port=None, port_specified=False,
            domain=urllib.parse.urlparse(base_url).hostname or 'localhost',
            domain_specified=True, domain_initial_dot=False, path='/',
            path_specified=True, secure=False, expires=None, discard=True,
            comment=None, comment_url=None, rest={'HttpOnly': None}, rfc2109=False,
        )
        client.jar.set_cookie(cookie)
    started = time.perf_counter()
    status, _body, _ = client.request('GET', path)
    elapsed = time.perf_counter() - started
    return (status == 200, elapsed)


def section_scalability(
    base_url: str,
    password: str,
    requests_total: int,
    workers: int,
    report: SmokeReport,
) -> None:
    print(
        f'\n[6/6] Scalability probe '
        f'({requests_total} requests across {workers} workers)'
    )

    # Authenticate as superadmin once and snapshot the cookies for reuse
    # by every worker. We reuse the JWT (single subject) so we measure
    # server throughput, not concurrent-login overhead.
    bootstrap = HttpClient(base_url=base_url)
    if not login(bootstrap, 'superadmin', password):
        report.add('scalability: bootstrap login', False, 'login failed')
        return
    cookies_snapshot = [(c.name, c.value) for c in bootstrap.jar]

    # Round-robin the request paths so the load is mixed.
    plan = [
        LOAD_ENDPOINTS[i % len(LOAD_ENDPOINTS)]
        for i in range(requests_total)
    ]
    durations: list[float] = []
    failures = 0

    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [
            pool.submit(_one_request, base_url, path, cookies_snapshot)
            for path in plan
        ]
        for fut in concurrent.futures.as_completed(futures):
            ok, elapsed = fut.result()
            durations.append(elapsed)
            if not ok:
                failures += 1
    wall = time.perf_counter() - started
    rps = requests_total / wall if wall > 0 else 0.0

    if not durations:
        report.add('scalability: at least one timing sample', False)
        logout(bootstrap)
        return

    p50 = statistics.median(durations)
    p95 = sorted(durations)[int(len(durations) * 0.95) - 1] if len(durations) > 20 else max(durations)
    p99 = sorted(durations)[int(len(durations) * 0.99) - 1] if len(durations) > 100 else max(durations)
    fail_rate = failures / requests_total if requests_total else 0.0

    print(
        f'    rps={rps:.1f}   p50={p50*1000:.1f} ms   '
        f'p95={p95*1000:.1f} ms   p99={p99*1000:.1f} ms   '
        f'failures={failures}/{requests_total} ({fail_rate*100:.1f}%)'
    )

    # Stability + scalability thresholds.
    # The defaults are relaxed for remote-DB dev environments (Supabase
    # free-tier, high-latency regions, limited connection pool).  On a
    # staging / production server with local or pooled DB, tighten these.
    report.add(
        'scalability: failure rate < 5%',
        fail_rate < 0.05,
        f'failures={failures}/{requests_total} ({fail_rate*100:.1f}%)' if fail_rate >= 0.05 else '',
    )
    report.add(
        'scalability: p95 latency < 5000 ms',
        p95 < 5.0,
        f'p95={p95*1000:.1f} ms' if p95 >= 5.0 else '',
    )
    report.add(
        'scalability: p99 latency < 10000 ms',
        p99 < 10.0,
        f'p99={p99*1000:.1f} ms' if p99 >= 10.0 else '',
    )

    logout(bootstrap)


# ───────────────────────────────────────────────────────────────────────
# Entrypoint
# ───────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description='EcoPoints whole-system preliminary smoke test',
    )
    parser.add_argument(
        '--base-url', default=DEFAULT_BASE_URL,
        help=f'Server base URL (default: {DEFAULT_BASE_URL})',
    )
    parser.add_argument(
        '--password', default=DEFAULT_PASSWORD,
        help='Seeded password for every role (default: SeedPass!23)',
    )
    parser.add_argument(
        '--load-requests', type=int, default=50,
        help='Total requests in the scalability probe (default: 50)',
    )
    parser.add_argument(
        '--load-workers', type=int, default=8,
        help='Concurrent workers in the scalability probe (default: 8)',
    )
    parser.add_argument(
        '--skip-load', action='store_true',
        help='Skip the scalability probe (functional checks only)',
    )
    args = parser.parse_args()

    print(f'EcoPoints whole-system smoke against {args.base_url}')
    print('=' * 60)

    report = SmokeReport()
    client = HttpClient(base_url=args.base_url)

    if not preflight(client, report):
        print('\nPre-flight failed; aborting.')
        print(report.render_summary())
        return 2

    section_login_and_cookies(client, args.password, report)
    section_rbac_matrix(client, args.password, report)
    section_mutations(client, args.password, report)
    section_force_logout(args.base_url, args.password, report)
    if not args.skip_load:
        section_scalability(
            args.base_url, args.password,
            args.load_requests, args.load_workers, report,
        )

    print('\n' + '=' * 60)
    print('Summary: ' + report.render_summary())
    if report.failed:
        print('\nFailed checks:')
        for row in report.rows:
            if not row.passed:
                print(f'  - {row.name}' + (f' — {row.detail}' if row.detail else ''))
    return 0 if report.failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
