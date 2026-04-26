# EcoPoints Backend — Security & Architecture Audit

---

## 1. USER AUTHN AND AUTHZ

* **Topic:** Password Hashing
* **File:** [models.py](file:///c:/Users/pc/Documents/Github/server/app/models.py#L184-L190)
* **Current:** `werkzeug.security.generate_password_hash` / `check_password_hash` — defaults to `scrypt` (Python ≥ 3.12) or `pbkdf2:sha256`. Not bcrypt.
* **Better:** Explicit `bcrypt` or `argon2id`. werkzeug default works but varies by Python version. Pin hash method.
* **Tradeoff:** werkzeug built-in = no extra dep. bcrypt/argon2id = industry standard, consistent across versions.

---

* **Topic:** RBAC — Granular Permission System
* **File:** [middleware.py](file:///c:/Users/pc/Documents/Github/server/app/middleware.py#L12-L31)
* **Current:** Role hierarchy + granular permission sets (`ROLE_PERMISSIONS`). `@token_required`, `@admin_required`, `@superadmin_required`, `@permission_required()` decorators.
* **Better:** Already multi-layered. [permission_required](file:///c:/Users/pc/Documents/Github/server/app/middleware.py#104-122) decorator exists but unused in [web_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/web_controller.py) — all routes use `@admin_required` instead. Any admin role can access any admin endpoint.
* **Tradeoff:** Using `@admin_required` everywhere = simpler code, weaker isolation. Using `@permission_required('rewards')` per-route = tighter access, more maintenance.

---

* **Topic:** Missing Auth Guard — RPI Controller (ALL ENDPOINTS)
* **File:** [rpi_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L40-L322)
* **Current:** Zero authentication on `/api/rpi/*`. Endpoints: [scan](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#40-68), [authenticate](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#70-104), [status](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#106-118), [log](file:///c:/Users/pc/Documents/Github/server/app/controllers/auth_controller.py#175-263), [health](file:///c:/Users/pc/Documents/Github/server/app/routes.py#20-27), `session/start`, `item/deposit`, `session/end`. Anyone on network can create sessions, deposit items, credit points.
* **Better:** Machine-level API key or mutual TLS. Each RVM gets unique secret. Validate `machine_uuid` against stored secret.
* **Tradeoff:** API key = simple. mTLS = strong but complex for embedded devices. At minimum: shared secret in Authorization header.

---

## 2. DB QUERIES

* **Topic:** ORM, No Raw SQL
* **File:** All files in `server/app/`
* **Current:** SQLAlchemy ORM exclusively. No `db.text()`, no `execute()`, no string concatenation in queries. All queries parameterized via ORM.
* **Better:** Already correct. SQLi risk: **None detected.**
* **Tradeoff:** ORM overhead vs security. Acceptable.

---

* **Topic:** ORM/Driver
* **File:** [\_\_init\_\_.py](file:///c:/Users/pc/Documents/Github/server/app/__init__.py#L21-L24)
* **Current:** Flask-SQLAlchemy. SQLite (dev), PostgreSQL via `psycopg` (production). `DATABASE_URL` env var.
* **Better:** Already correct dual-driver setup.
* **Tradeoff:** SQLite = no concurrent writes (dev only). PostgreSQL = production-ready.

---

## 3. AUTH TYPE

* **Topic:** JWT — Stateless with Blacklist
* **File:** [auth_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/auth_controller.py#L26-L37), [middleware.py](file:///c:/Users/pc/Documents/Github/server/app/middleware.py#L51-L62)
* **Current:** JWT (HS256) with `jti` claim. Token blacklist on logout via `TokenBlacklist` table. Expiry configurable (default 24h). 2FA temp tokens expire in 10 min.
* **Better:** HS256 fine for single-server. RS256 if API shared across services. Token blacklist DB-backed = revocation works.
* **Tradeoff:** JWT stateless = easy scale, blacklist check on every request = partial stateful. Acceptable hybrid.

---

* **Topic:** Token Storage — localStorage (Client-Side)
* **File:** [auth_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/auth_controller.py#L259) — token returned in JSON body
* **Current:** Token returned in response body `{'token': token}`. Frontend stores in `localStorage` (standard pattern for SPAs). No `Set-Cookie` header. No `HttpOnly` flag.
* **Better:** HttpOnly + Secure + SameSite=Strict cookie. XSS cannot steal cookie-stored tokens.
* **Tradeoff:** localStorage = XSS can read token. HttpOnly cookie = immune to XSS theft, needs CSRF protection. Since CORS `supports_credentials: True` already set, cookie approach viable.

---

* **Topic:** Refresh Token
* **File:** Not found.
* **Current:** Single access token, no refresh token. Token expiry = full re-login.
* **Better:** Short-lived access token (15 min) + long-lived refresh token (7 days) in HttpOnly cookie. Reduces stolen token window.
* **Tradeoff:** Adds complexity. Refresh token rotation needed to prevent replay.

---

## 4. INPUT SECURITY — XSS AND INJECTION

* **Topic:** Input Validation (Server-Side)
* **File:** All controllers
* **Current:** Minimal. Presence checks only (`if not name`, `if not password`). Password has regex validation (uppercase, lowercase, digit, min 8 chars). Email validated only for uniqueness. No length limits on `name`, `notes`, `description`, `actionType`, or any other free-text field. No allowlist on `role`, `user_type`, `year_level` values in several routes.
* **Better:** Validate every field: type, length, format. Use `marshmallow`, `pydantic`, or `cerberus` for schema validation. Allowlist `role` values server-side on create/update.
* **Tradeoff:** Validation library = more code upfront, prevents entire class of bugs. Without it = garbage data in DB.

---

* **Topic:** XSS — Server-Side (API-Only Backend)
* **File:** All controllers
* **Current:** Backend returns JSON only (`jsonify()`). No HTML rendering. No template engine. No `dangerouslySetInnerHTML` or `innerHTML` found in client.
* **Better:** JSON-only API = XSS not directly exploitable server-side. React auto-escapes by default. Stored XSS risk exists if admin-entered data (e.g., reward `description`, maintenance `notes`) rendered as HTML in future. No sanitization library applied before DB write.
* **Tradeoff:** Add server-side sanitization (e.g., `bleach.clean()`) on free-text fields as defense-in-depth. Low effort, high payoff.

---

* **Topic:** XSS — OTP Email Body
* **File:** [otp_service.py](file:///c:/Users/pc/Documents/Github/server/app/services/otp_service.py#L86-L97)
* **Current:** OTP email body constructed with f-string embedding `{code}`. Code is digits only (safe). But notification emails embed user-supplied strings (e.g., user `name`, machine `name`, reward `name`) in HTML body without escaping via `trigger_alert()`.
* **Better:** HTML-escape all interpolated values in [notification_service.py](file:///c:/Users/pc/Documents/Github/server/app/services/notification_service.py#L110-L171) `_build_email_html()` → use `html.escape()`.
* **Tradeoff:** Minimal effort. Prevents HTML injection in email clients.

---

* **Topic:** Validation Library Used
* **Current:** None. No `DOMPurify`, `validator.js`, `Joi`, `Zod`, `marshmallow`, `pydantic`, `cerberus`, or `express-validator`.
* **Better:** Add `pydantic` or `marshmallow` for request validation schemas.
* **Tradeoff:** Adds dependency but eliminates manual validation scatter.

---

* **Topic:** CSP Header
* **File:** Not found in backend or nginx config.
* **Current:** No `Content-Security-Policy` header set anywhere. Nginx config at [default.conf](file:///c:/Users/pc/Documents/Github/nginx/default.conf) has no security headers.
* **Better:** Add `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` in nginx or Flask.
* **Tradeoff:** CSP can break inline scripts/styles if not configured carefully. Start with `report-only` mode.

---

* **Topic:** File Upload
* **Current:** No file upload endpoints found. `image_url` stored as string URL only. No multipart/form-data handling.
* **Better:** Not applicable currently.
* **Tradeoff:** None.

---

## 5. API ROUTING MAP

| Blueprint | Prefix | Auth | File |
|-----------|--------|------|------|
| `auth` | `/api/web/auth` | Mixed (login/register public, rest `@token_required`) | [auth_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/auth_controller.py) |
| `web` | `/api/web` | `@token_required` + `@admin_required` (except `/health`) | [web_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/web_controller.py) |
| `rpi` | `/api/rpi` | **NONE** | [rpi_controller.py](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py) |
| root | `/`, `/health` | None (public) | [routes.py](file:///c:/Users/pc/Documents/Github/server/app/routes.py) |

**Public routes (no auth):**
- `POST /api/web/auth/login`
- `POST /api/web/auth/verify-otp`
- `POST /api/web/auth/register`
- `GET /api/web/auth/locations`
- `GET /api/web/auth/groups`
- `GET /api/web/health`
- `GET /api/rpi/*` (ALL)
- `POST /api/rpi/*` (ALL)
- `GET /`, `GET /health`

**Protected routes:** Everything under `/api/web/*` except health.

**Route-level permission middleware:** `@admin_required` applied uniformly. `@permission_required()` defined but **not used on any route**. All admin roles (technician, inventory_officer, auditor, head_admin, superadmin) access all admin endpoints equally.

---

## 6. ARCHITECTURE LAYERS

| Layer | Present? | File(s) |
|-------|----------|---------|
| Controller | ✅ | `auth_controller.py`, `web_controller.py`, `rpi_controller.py` |
| Service | Partial | `notification_service.py`, `otp_service.py` (only 2 services) |
| Repository/Data | ❌ | None. Direct `db.session` calls in controllers |
| Middleware | Partial | `middleware.py` — auth decorators only |
| Request Validation | ❌ | None. Inline `if not x` checks in controllers |

---

* **Topic:** Missing Middleware Layer
* **File:** [middleware.py](file:///c:/Users/pc/Documents/Github/server/app/middleware.py)
* **Current:** Only JWT auth and RBAC decorators. No request validation middleware, no rate-limit per-route (except login/register), no request logging middleware, no response sanitization.
* **Better:** Middleware should handle: request schema validation, auth, rate-limit, request/response logging, error formatting. Without it, all logic lives in 2737-line `web_controller.py`. Authorization checks scattered inline. Hard to audit.
* **Tradeoff:** Refactoring to service+repository pattern = significant effort. But `web_controller.py` at 2737 lines = maintenance risk. Split by domain (users, machines, rewards, settings).

---

## 7. TOP 5 FIXES — RANKED BY SEVERITY

| # | Severity | Fix | Why | How |
|---|----------|-----|-----|-----|
| 1 | **CRITICAL** | Authenticate `/api/rpi/*` endpoints | Any network actor can credit points, create sessions, manipulate machine state. Full economy compromise. | Add API key auth: each RVM gets UUID secret stored in `rvms` table. Validate `Authorization: Bearer <machine_secret>` on every RPI route. |
| 2 | **HIGH** | Move JWT to HttpOnly cookie | `localStorage` token = one XSS away from full account takeover. | Return token in `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict`. Read from cookie in `token_required`. Add CSRF token for state-changing requests. |
| 3 | **HIGH** | Add input validation layer | No length limits, no type checks, no allowlists. Accepts arbitrary JSON values for `role`, `user_type`, etc. Attacker could set `role: 'superadmin'` on registration if guard missed. | Add `pydantic` or `marshmallow` request schemas. Validate before controller logic. Allowlist enum values. |
| 4 | **MEDIUM** | Enforce `@permission_required()` per route | `ROLE_PERMISSIONS` table defined but never checked. Auditor can create users, modify rewards, change settings. | Replace `@admin_required` with `@permission_required('users', 'write')` etc. on each write endpoint. |
| 5 | **MEDIUM** | Add security headers (CSP, HSTS, X-Frame-Options) | No headers = XSS amplified, clickjacking possible, MIME sniffing. | Add to nginx: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`. |

---

## 8. WHAT IS LACKING

| Gap | Status |
|-----|--------|
| Rate limiting | Partial. Only on `/login` (10/min) and `/register` (5/min). All other endpoints use global 200/min default. No per-user limiting. |
| Input validation layer | Not found. No schema validation library. |
| CORS config | Present. Allowlisted origins in [\_\_init\_\_.py](file:///c:/Users/pc/Documents/Github/server/app/__init__.py#L51-L74). Credentials enabled. Acceptable. |
| CSRF protection | Not found. With `supports_credentials: True` and cookie auth (if migrated), CSRF needed. Currently mitigated by Bearer token in header (not auto-sent). |
| XSS sanitization | Not found. No server-side sanitization library. Relies on React auto-escaping. |
| CSP header | Not found. |
| Logging (structured) | Partial. `AdminLog` table tracks admin actions. No structured request/response logging middleware. `print()` used in [rpi_controller.py:L132](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L132). |
| Error sanitization | Partial. Web/auth controllers return generic "An internal error occurred". RPI controller leaks stack traces via `str(exc)` in 5 endpoints: [L67](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L67), [L103](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L103), [L117](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L117), [L194](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L194), [L251](file:///c:/Users/pc/Documents/Github/server/app/controllers/rpi_controller.py#L251). |
| OTP store | In-memory dict in [otp_service.py:L15](file:///c:/Users/pc/Documents/Github/server/app/services/otp_service.py#L15). Lost on restart. Multi-worker (gunicorn) = each worker has separate store. OTP generated on worker A, verified on worker B = fails. |
| Force logout | [web_controller.py:L2683-L2702](file:///c:/Users/pc/Documents/Github/server/app/controllers/web_controller.py#L2683-L2702) only logs event. Does not blacklist tokens or invalidate sessions. Non-functional. |
| Token cleanup | `TokenBlacklist` table grows indefinitely. No cleanup job for expired entries. |
| Password policy on admin-created users | [web_controller.py:L718-L719](file:///c:/Users/pc/Documents/Github/server/app/controllers/web_controller.py#L718-L719) — requires password but no complexity check (unlike login change-password and registration). Admin-created users can have weak passwords. |

---

## 9. TRADEOFFS

| Choice | Pro | Con |
|--------|-----|-----|
| JWT stateless + blacklist | Easy scale. Revocation via blacklist. | Blacklist query every request. Token cleanup needed. |
| werkzeug password hash | Zero extra deps. | Hash algo varies by Python version. Not pinned. |
| SQLAlchemy ORM only | Zero SQLi risk. | Complex analytics queries verbose. |
| Single `web_controller.py` (2737 lines) | All routes in one file = easy grep. | Hard to audit, maintain, review. Merge conflicts. |
| `@admin_required` everywhere | Simple. Every admin sees everything. | Violates least-privilege. Auditor can write data. |
| In-memory OTP store | No DB schema change. Fast. | Lost on restart. Fails with multiple gunicorn workers. |
| `NotificationSetting` table reused for config storage (`config_points`, `config_security`, `config_channels`) | No schema change. | Semantic mismatch. `recipients_json` stores non-recipient data. Hard to reason about. |
| No refresh token | Simple auth flow. | Stolen token valid for full session (up to 24h). |
| Nginx no TLS termination | Relies on Cloudflare "Flexible" SSL. | Backend traffic from Cloudflare to Nginx is plaintext HTTP on port 80. MITM possible between CDN edge and origin. |
