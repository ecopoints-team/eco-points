"""
Integration test — Phase 4D / Task 13.2: Security_Headers at the nginx edge.

Validates: Requirements 4D.21 (and the Report-Only deployment of CSP per 4D.22).

This test is an *integration* test: it exercises the real nginx edge
defined in `nginx/default.conf` running inside docker-compose. It does
NOT touch the Flask test client or boot any Python web app — that would
miss the entire point of asserting the headers are emitted at the edge,
not at the upstream.

How to run locally
------------------
From the repo root:

    docker compose up -d nginx backend frontend
    pytest server/tests/integration/test_security_headers.py -v

Then tear down with::

    docker compose down

By default the test issues requests against `http://localhost`, which is
where docker-compose publishes nginx (`ports: "80:80"`). Override with::

    NGINX_BASE_URL=http://nginx:80 pytest server/tests/integration/...

so the same test can run from a sibling container in CI.

If the nginx edge is not reachable (e.g. unit-test runs in CI that don't
bring up the docker-compose stack), every test in this module is
`pytest.skip`-ped cleanly so it does not break the broader test suite.

What's asserted (Requirement 4D.21)
-----------------------------------
For every response from the edge — both successful upstream responses
(Next.js frontend at `/`, Flask backend at `/api/*`) AND error responses
(`/this-path-definitely-does-not-exist` returns a 404 from the upstream
but the edge MUST still attach the headers because they are configured
with the `always` flag) — these headers MUST be present with the exact
values configured in `nginx/default.conf`:

    X-Content-Type-Options:    nosniff
    X-Frame-Options:           DENY
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    Referrer-Policy:           strict-origin-when-cross-origin
    Content-Security-Policy-Report-Only:
        default-src 'self'; script-src 'self' 'unsafe-inline'; ...

CSP is asserted in `Content-Security-Policy-Report-Only` form because
Phase 4D ships it in Report-Only mode for at least one release window
before promoting to enforcing `Content-Security-Policy` (Requirement
4D.22). When that promotion happens, update `EXPECTED_CSP_HEADER_NAME`
below from `Content-Security-Policy-Report-Only` to
`Content-Security-Policy`.
"""
from __future__ import annotations

import os
from typing import Mapping

import pytest

requests = pytest.importorskip(
    "requests",
    reason="`requests` is required for the security headers integration test",
)


# ─── Config ────────────────────────────────────────────────────────────────

NGINX_BASE_URL = os.environ.get("NGINX_BASE_URL", "http://localhost").rstrip("/")

# Connect timeout kept short so a missing edge fails fast and we can
# `pytest.skip` rather than hang the suite. Read timeout is a touch
# longer to accommodate cold upstream containers.
_CONNECT_TIMEOUT = 2.0
_READ_TIMEOUT = 5.0


# ─── Expected headers ──────────────────────────────────────────────────────
#
# These mirror the `add_header ... always;` directives in
# `nginx/default.conf`. Header NAMES are case-insensitive in HTTP/1.1
# (RFC 7230 §3.2), but VALUES are matched byte-for-byte against the
# canonical strings configured at the edge.

EXPECTED_STATIC_HEADERS: Mapping[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}

# Phase 4D ships CSP in Report-Only mode (Requirement 4D.22). Once
# promoted to enforcing this MUST become `Content-Security-Policy`.
EXPECTED_CSP_HEADER_NAME = "Content-Security-Policy-Report-Only"
EXPECTED_CSP_HEADER_VALUE = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "object-src 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)


# ─── Edge probe / skip ─────────────────────────────────────────────────────


def _edge_is_reachable() -> bool:
    """Probe the nginx edge with a single GET / and return True on any
    HTTP response (including 4xx/5xx). Connection-level failures
    (DNS, refused, timeout) mean the edge is not running and the test
    must skip cleanly so unit-test runs without docker-compose pass.
    """
    try:
        requests.get(
            f"{NGINX_BASE_URL}/",
            timeout=(_CONNECT_TIMEOUT, _READ_TIMEOUT),
            allow_redirects=False,
        )
    except requests.exceptions.RequestException:
        return False
    return True


# Module-level marks: 
#   - `integration` so unit-test runs can exclude this file with
#     `pytest -m 'not integration'` (matches the convention used by
#     `tests/integration/test_migration_reversibility.py`).
#   - `skipif` so the file still skips cleanly even when run without
#     a marker filter (e.g. `pytest server/tests/`) and the docker
#     edge happens not to be up.
pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not _edge_is_reachable(),
        reason=(
            f"nginx edge not reachable at {NGINX_BASE_URL!r}. "
            "Bring it up with `docker compose up -d nginx backend frontend` "
            "or set NGINX_BASE_URL to your edge's URL."
        ),
    ),
]


# ─── Helpers ───────────────────────────────────────────────────────────────


def _assert_security_headers(headers: Mapping[str, str], *, where: str) -> None:
    """Assert every Security_Header is present with the expected value
    on `headers`. `where` is a short string identifying the request
    being checked, used to make pytest failure output actionable.
    """
    # `requests.Response.headers` is a `CaseInsensitiveDict`, so lookup
    # by canonical name works regardless of nginx's emitted casing.
    for name, expected in EXPECTED_STATIC_HEADERS.items():
        actual = headers.get(name)
        assert actual is not None, (
            f"[{where}] missing header {name!r}. "
            f"Got headers: {dict(headers)}"
        )
        assert actual == expected, (
            f"[{where}] header {name!r} has unexpected value. "
            f"expected={expected!r} actual={actual!r}"
        )

    # CSP is asserted separately because (a) the header NAME itself
    # changes between Report-Only and enforcing modes (4D.22), and
    # (b) the value is long enough that a focused diff is easier to
    # read on failure.
    csp_actual = headers.get(EXPECTED_CSP_HEADER_NAME)
    assert csp_actual is not None, (
        f"[{where}] missing header {EXPECTED_CSP_HEADER_NAME!r}. "
        f"Got headers: {dict(headers)}"
    )
    assert csp_actual == EXPECTED_CSP_HEADER_VALUE, (
        f"[{where}] header {EXPECTED_CSP_HEADER_NAME!r} has unexpected value.\n"
        f"expected={EXPECTED_CSP_HEADER_VALUE!r}\n"
        f"actual  ={csp_actual!r}"
    )


def _get(path: str) -> requests.Response:
    """Issue a GET against the nginx edge. `allow_redirects=False` so we
    inspect the headers nginx emits, not whatever final upstream the
    client may have followed to.
    """
    return requests.get(
        f"{NGINX_BASE_URL}{path}",
        timeout=(_CONNECT_TIMEOUT, _READ_TIMEOUT),
        allow_redirects=False,
    )


# ─── Tests ─────────────────────────────────────────────────────────────────


def test_security_headers_present_on_frontend_route():
    """A request that proxies to the Next.js frontend (`/`) MUST carry
    every Security_Header at the edge.

    Validates: Requirements 4D.21.
    """
    resp = _get("/")
    _assert_security_headers(resp.headers, where=f"GET / -> {resp.status_code}")


def test_security_headers_present_on_backend_api_route():
    """A request that proxies to the Flask backend (`/api/*`) MUST also
    carry every Security_Header at the edge — proving the headers are
    set at nginx, not by the upstream Flask app.

    `/api/web/auth/me` is unauthenticated → expected to return 401, but
    the headers MUST still be present because of `add_header ... always`.

    Validates: Requirements 4D.21.
    """
    resp = _get("/api/web/auth/me")
    _assert_security_headers(
        resp.headers, where=f"GET /api/web/auth/me -> {resp.status_code}"
    )


def test_security_headers_present_on_error_response():
    """A request to a path that does not exist on either upstream MUST
    still carry every Security_Header because `add_header ... always` is
    configured. This is the literal interpretation of Requirement
    4D.21's "every response" wording: error responses count too.

    We use a deliberately implausible path so the upstream returns a
    4xx (typically 404), then assert the headers are still attached.

    Validates: Requirements 4D.21.
    """
    resp = _get("/this-path-definitely-does-not-exist-4d21")
    # We don't pin an exact status — Next.js may render its own 404
    # page (200 with HTML body) or return 404 depending on config. The
    # invariant under test is the *headers*, not the status code.
    _assert_security_headers(
        resp.headers,
        where=f"GET /this-path-definitely-does-not-exist-4d21 -> {resp.status_code}",
    )
