"""
Phase 4B / Task 11.4 — CORS allow_headers must include `X-CSRF-Token`.

Validates: Requirement 4B.15.

`server/app/__init__.py` configures Flask-CORS with
``allow_headers=["Content-Type", "Authorization", "X-CSRF-Token"]`` for
``/api/*``. This test issues a CORS preflight (``OPTIONS``) from one of
the configured allowed origins and asserts that:

1. ``Access-Control-Allow-Headers`` in the response includes
   ``X-CSRF-Token`` (case-insensitive), so the browser will permit the
   client to attach the double-submit CSRF header on cross-origin
   state-changing requests.
2. ``Access-Control-Allow-Credentials`` is ``true`` so the browser
   sends the HttpOnly ``token`` cookie + ``csrf_token`` cookie.
3. ``Access-Control-Allow-Origin`` echoes the requesting allowed origin
   (Flask-CORS does not return ``*`` when credentials are supported).
"""
from __future__ import annotations


def _allow_headers_set(response) -> set[str]:
    """Parse the ``Access-Control-Allow-Headers`` response header into a
    case-folded set so the assertion is whitespace/case-insensitive."""
    raw = response.headers.get('Access-Control-Allow-Headers', '') or ''
    return {h.strip().lower() for h in raw.split(',') if h.strip()}


def test_cors_preflight_allows_x_csrf_token_header(app):
    """Preflight from an allowed origin lists ``X-CSRF-Token`` and
    keeps ``supports_credentials`` semantics intact."""
    client = app.test_client()

    response = client.options(
        '/api/web/auth/login',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        },
    )

    assert response.status_code in (200, 204), response.get_data(as_text=True)

    allowed = _allow_headers_set(response)
    assert 'x-csrf-token' in allowed, (
        f"Access-Control-Allow-Headers missing 'X-CSRF-Token'; got {sorted(allowed)!r}"
    )
    # The legacy entries must still be present — Phase 4B.15 only adds.
    assert 'content-type' in allowed
    assert 'authorization' in allowed

    # supports_credentials=True ⇒ Allow-Credentials header is "true" and
    # Allow-Origin echoes the requesting origin (never "*").
    assert response.headers.get('Access-Control-Allow-Credentials') == 'true'
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'
