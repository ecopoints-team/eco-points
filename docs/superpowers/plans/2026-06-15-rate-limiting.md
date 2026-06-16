# Per-Route Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Flask-Limiter rate limits beyond the three auth endpoints that already have them, starting with the sensitive `POST /api/web/auth/change-password` endpoint, which is currently only covered by the global 200/min default.

**Architecture:** A single `Limiter` instance is created in `server/app/__init__.py` (`limiter = Limiter(...)`) with a global default of `200 per minute`. Individual endpoints opt into stricter limits with the `@limiter.limit("N per minute")` decorator — `login`, `verify-otp`, and `register` already do. We add a stricter per-route limit to `change_password` (a state-changing, abuse-prone endpoint), following the exact same pattern, and prove it with a test that the (N+1)th request returns HTTP 429.

**Tech Stack:** Flask-Limiter 4.x, Flask, pytest. JWT auth via `@token_required`.

---

## Background the engineer needs

- The limiter lives at module scope in `server/app/__init__.py`:
  ```python
  limiter = Limiter(key_func=get_remote_address, default_limits=["200 per minute"], storage_uri="memory://")
  ```
  It is initialised onto the app in `create_app()` via `limiter.init_app(app)`.
- Controllers import it with `from .. import db, limiter` (see `server/app/controllers/auth_controller.py` line 26).
- The decorator order that already works in this codebase (from `login`):
  ```python
  @auth_bp.route('/login', methods=['POST'])
  @limiter.limit("10 per minute")
  @validate_request(LoginSchema)
  def login(payload): ...
  ```
  So `@<bp>.route(...)` is outermost, then `@limiter.limit(...)`, then auth/validation decorators.
- For `change_password` the current stack (in `server/app/controllers/auth_controller.py`, ~line 621) is:
  ```python
  @auth_bp.route('/change-password', methods=['POST'])
  @token_required
  @validate_request(ChangePasswordSchema)
  def change_password(current_user, payload): ...
  ```
- Flask-Limiter returns HTTP 429 with its own body when a limit is exceeded.
- **Test-environment caveat:** the limiter uses in-memory per-process storage. Flask-Limiter is enabled by default, but `app.config['TESTING']` does NOT disable it. However, the limiter only counts requests when `limiter.enabled` is true and an app context with the limiter initialised is used. The test below builds requests through the real app fixture and asserts the 429 appears after the limit is crossed. To avoid cross-test pollution from the shared app fixture, the test resets the limiter storage at the start.

---

## File Structure

| File | Responsibility | Action |
| --- | --- | --- |
| `server/tests/property/test_rate_limit_change_password.py` | Verify the per-route limit triggers 429 after the threshold | Create |
| `server/app/controllers/auth_controller.py` | Add `@limiter.limit("5 per minute")` to `change_password` | Modify (1 line) |

---

### Task 1: Add a rate limit to change-password

**Files:**
- Create: `server/tests/property/test_rate_limit_change_password.py`
- Modify: `server/app/controllers/auth_controller.py` (the `change_password` decorator stack, ~line 621)

- [ ] **Step 1: Write the failing test**

Create `server/tests/property/test_rate_limit_change_password.py` with exactly this content:

```python
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `server/`): `python -m pytest tests/property/test_rate_limit_change_password.py -v`

Expected: FAIL — with no per-route limit, the global default is 200/min, so 6 requests never reach 429; the final assertion `statuses[-1] == 429` fails.

- [ ] **Step 3: Add the rate-limit decorator**

In `server/app/controllers/auth_controller.py`, update the `change_password` decorator stack to insert `@limiter.limit("5 per minute")` directly under the route decorator (matching the `login`/`register` pattern):

```python
@auth_bp.route('/change-password', methods=['POST'])
@limiter.limit("5 per minute")
@token_required
@validate_request(ChangePasswordSchema)
def change_password(current_user, payload):
```

`limiter` is already imported at the top of the file (`from .. import db, limiter`), so no new import is needed.

- [ ] **Step 4: Run the test to verify it passes**

Run (from `server/`): `python -m pytest tests/property/test_rate_limit_change_password.py -v`

Expected: PASS — the 6th request returns 429.

- [ ] **Step 5: Run the auth test suite to confirm no regression**

Run (from `server/`): `python -m pytest tests/property/test_phase4b_cookie_csrf.py tests/property/test_phase2_granularity.py -q`

Expected: all PASS (these mint their own JWTs and hit other endpoints; the new limit on change-password must not affect them).

- [ ] **Step 6: Commit**

```bash
git add server/tests/property/test_rate_limit_change_password.py server/app/controllers/auth_controller.py
git commit -m "security: rate-limit POST /auth/change-password (5/min)"
```

---

## Self-Review

**1. Spec coverage:** Gap = "extend rate limiting beyond the auth endpoints." This plan adds a per-route limit to `change-password` (previously only on the global default) and proves the 429 behaviour. The pattern is reusable for additional endpoints later. ✅

**2. Placeholder scan:** No TBD/TODO. Exact decorator code and exact commands shown. The `_LIMIT` constant in the test (5) matches the decorator string (`"5 per minute"`) — called out explicitly in a comment. ✅

**3. Type/name consistency:** `change_password`, route `/api/web/auth/change-password`, and `from .. import db, limiter` all match `server/app/controllers/auth_controller.py`. `limiter.reset()` is the Flask-Limiter 4.x API for clearing counters. ✅

---

## Notes / Future (not in this plan)

Additional endpoints worth a stricter limit in follow-up commits (same one-line pattern): any future password-reset / forgot-password endpoint, OTP resend, and the RPI deposit endpoint. Add them incrementally with a matching 429 test each. Per-*user* limiting (vs per-IP) would require a custom `key_func` keyed on the authenticated `user_id`; that is a separate, larger change.
