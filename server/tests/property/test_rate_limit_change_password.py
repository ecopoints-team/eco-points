"""
Rate-limit regression test for POST /api/web/auth/change-password.

The endpoint is state-changing and abuse-prone (an attacker with a stolen
session could hammer it). It must carry a stricter per-route limit than the
global 200/min default. This test asserts that after the configured number
of requests within the window, the next request returns HTTP 429.

The auth/validation layers are irrelevant to the limit: Flask-Limiter runs
BEFORE the view body (it is the outer decorator), so even requests that would
later 400/401 still consume the rate-limit budget. We therefore send
unauthenticated requests and only assert the transition from non-429 to 429.
"""
from app import create_app, limiter


_LIMIT = 5  # must match the decorator added in Step 3: "5 per minute"
_ENDPOINT = '/api/web/auth/change-password'


def test_change_password_is_rate_limited():
    app = create_app()
    app.config['TESTING'] = True

    # Reset limiter counters so a shared/previous run does not pollute this.
    with app.app_context():
        limiter.reset()

    with app.test_client() as client:
        statuses = []
        # Fire _LIMIT + 1 requests. The first _LIMIT are within budget
        # (they will NOT be 429); the (_LIMIT + 1)th MUST be 429.
        for _ in range(_LIMIT + 1):
            resp = client.post(_ENDPOINT, json={})
            statuses.append(resp.status_code)

    assert statuses[-1] == 429, (
        f'expected the request after {_LIMIT} to be rate-limited (429); '
        f'got status sequence {statuses}'
    )
    assert all(code != 429 for code in statuses[:_LIMIT]), (
        f'no request should be 429 before the limit is reached; '
        f'got {statuses}'
    )
