# EcoPoints Security Re-Audit v2

**Date:** May 3, 2026
**Auditor:** Automated static analysis
**Baseline:** `security_audit.md` (previous audit)
**Scope:** Full backend (`server/app/`), frontend auth flow (`client/`), nginx, docker-compose

---

## 1. USER AUTHN AND AUTHZ

### 1.1 Password Hashing

* Topic: Password Hashing
* File: `server/app/models.py`, lines 189–190
* Current: `werkzeug.security.generate_password_hash(password)` — no explicit `method` param. Defaults to `scrypt` on Python 3.12+, `pbkdf2:sha256` on older. `check_password_hash` verifies.
* Better: Pin algorithm explicitly: `generate_password_hash(password, method='scrypt')` or migrate to `argon2-cffi` (`argon2id`). Pin guarantees consistent hashes across Python versions.
* Tradeoff: Pinning locks you to one algo but prevents cross-version hash mismatch. Argon2 is memory-hard (better brute-force resistance) but adds dependency.

### 1.2 Login Flow & Lockout

* Topic: Login Lockout
* File: `server/app/controllers/auth_controller.py`, lines 69–103
* Current: `_check_lockout()` tracks failed attempts via `LoginAttempt` model. Default: 5 failures → 15-min lockout. Configurable per-org via `NotificationSetting` (`config_security`). `_log_attempt()` records every attempt with IP, user_id, success/failure, reason.
* Better: Already solid. Consider adding progressive backoff (15 min → 30 min → 60 min) and notification to user email on lockout trigger.
* Tradeoff: Progressive lockout improves security but complicates unlock flow.

### 1.3 RBAC

* Topic: Role-Based Access Control
* File: `server/app/middleware.py`, lines 12–33
* Current: `ROLE_HIERARCHY` defines 7 roles (`dependent` 0 → `superadmin` 6). `ROLE_PERMISSIONS` maps each role to allowed action categories (`read`, `write`, `users`, `machines`, etc.). `can_manage_role()` enforces privilege escalation prevention on user creation.
* Better: `ROLE_PERMISSIONS` exists but `@permission_required()` is never applied to any route. All 53 web_controller routes use `@admin_required` instead. Auditor, inventory_officer, technician have equal API access despite different permission sets.
* Tradeoff: `@admin_required` is simpler but violates least-privilege. `@permission_required()` is granular but requires per-route decoration (53 routes to update).

### 1.4 Auth Guards

* Topic: Missing Auth Guards
* File: `server/app/controllers/rpi_controller.py`, all routes
* Current: Zero authentication on all `/api/rpi/*` endpoints. No `@token_required`, no API key, no shared secret. Machine identified by `machine_uuid` (public identifier, not credential).
* Better: Add machine-level API key authentication. Store hashed secret in `rvms` table. Validate `Authorization: Bearer <machine_secret>` on every RPI route.
* Tradeoff: Adds provisioning complexity (each RPI needs unique key). But without it, anyone on the network can credit points, create sessions, manipulate machines — full economy compromise.

### 1.5 Admin Required GET Bypass — **BUG**

* Topic: Data Exposure via `@admin_required` GET bypass
* File: `server/app/middleware.py`, lines 84–88
* Current: `admin_required` allows ALL GET requests from non-admin users (line 86: `if request.method != 'GET'`). Regular `user` role can GET `/api/web/dashboard/stats`, `/api/web/users`, `/api/web/machines`, `/api/web/rewards`, `/api/web/logs/*`, etc. — 53 endpoints exposed.
* Better: Remove GET exception. Non-admin users MUST NOT access any admin endpoints. Fix: change line 85–87 to return 403 for all methods when `not current_user.is_admin`.
* Tradeoff: None. This is a bug. Regular users should never access admin data endpoints.

---

## 2. DB QUERIES

* Topic: SQL Injection
* File: All controllers, `server/app/models.py`
* Current: Pure SQLAlchemy ORM throughout. No raw SQL. No `db.text()`. No string concatenation in queries. All filters use parameterized ORM methods (`filter_by()`, `filter()`, `.query`).
* Better: Already secure. Zero SQLi risk detected.
* Tradeoff: ORM adds overhead vs raw SQL but eliminates injection class entirely. Acceptable trade.

---

## 3. AUTH TYPE

### 3.1 Token Architecture

* Topic: JWT Token
* File: `server/app/controllers/auth_controller.py`, lines 256–265; `server/app/middleware.py`, lines 36–76
* Current: JWT (HS256) signed with `SECRET_KEY`. Single token, 24h expiry (configurable per-org via `config_session` setting). Contains `user_id`, `role`, `exp`, `iat`, `jti`. Returned as JSON body: `{'token': token}`. No refresh token.
* Better: Move token to `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict`. Add refresh token pattern (15-min access + 7-day refresh). Add CSRF token for state-changing requests when using cookie auth.
* Tradeoff: HttpOnly cookie prevents XSS token theft but requires CSRF protection. Refresh tokens add complexity but reduce exposure window from 24h to 15min.

### 3.2 Token Storage (Client)

* Topic: Token Storage — XSS Risk
* File: `client/src/services/apiService.js` (stores via `localStorage`)
* Current: Token received in JSON response body, stored in `localStorage`. Attached via `Authorization: Bearer` header on subsequent requests.
* Better: `HttpOnly` + `Secure` + `SameSite=Strict` cookie. Browser automatically attaches. JS cannot read — XSS-proof.
* Tradeoff: `localStorage` = simple, works cross-origin, but any XSS = full account takeover. Cookie = harder setup, CSRF needed, but token unreachable from JS.

### 3.3 Token Revocation

* Topic: Token Blacklist
* File: `server/app/models.py`, lines 574–585; `server/app/middleware.py`, lines 58–63
* Current: On logout, token `jti` added to `TokenBlacklist` table. `token_required` checks blacklist on every request. Blacklist entries include `expires_at` for cleanup.
* Better: Add scheduled cleanup job (`DELETE FROM token_blacklist WHERE expires_at < NOW()`). Table grows indefinitely otherwise.
* Tradeoff: Cleanup adds operational complexity but prevents unbounded table growth.

### 3.4 Force Logout — **BROKEN**

* Topic: Force Logout Non-Functional
* File: `server/app/controllers/web_controller.py`, lines 2821–2834
* Current: `force_logout_all()` only writes an `AdminLog` entry. Does NOT blacklist any tokens. Does NOT invalidate any sessions. UI button does nothing server-side.
* Better: Query all users in org → blacklist their active tokens. Or: add `force_logout_at` timestamp to `organizations` table; `token_required` rejects tokens issued before that timestamp.
* Tradeoff: Token-based blacklisting requires tracking active JTIs per user. Timestamp approach is simpler but invalidates ALL tokens (including the admin who triggered it).

---

## 4. INPUT SECURITY — XSS AND INJECTION

### 4.1 Server-Side Input Validation

* Topic: Input Validation Layer
* File: All controllers
* Current: Manual presence checks (`if not first_name`). Some allowlists: `userType` validated against `('student', 'faculty', 'staff')` in registration (`auth_controller.py:L499-501`). `status` allowlisted in RPI deposit (`rpi_controller.py:L205-206`). No schema validation library (no Pydantic, Marshmallow, Joi, Zod, or express-validator).
* Better: Add `pydantic` or `marshmallow` schemas for all POST/PUT request bodies. Validate types, lengths, formats, enum values server-side.
* Tradeoff: Adds boilerplate per endpoint but catches garbage input before it reaches DB. Prevents type confusion, oversized strings, invalid enums.

### 4.2 XSS — Email Templates

* Topic: XSS — Email Template Injection
* File: `server/app/services/notification_service.py`, lines 110–171
* Current: `_build_email_html()` embeds `{subject}` (line 135) and `{body}` (line 146) directly into HTML via f-string. No `html.escape()`. User-supplied strings (machine names, reward names, user names) flow through `trigger_alert()` → `_build_email_html()` unescaped.
* Better: `import html` → `html.escape(subject)`, `html.escape(body)` before interpolation. Also escape `org_name` (line 113).
* Tradeoff: Over-escaping could break intentional HTML in email body. Use allowlist-based sanitization if rich text needed. For plain alert content, escaping is safe.

### 4.3 XSS — Frontend

* Topic: XSS — Client-Side
* File: `client/` (Next.js / React)
* Current: React auto-escapes JSX interpolation (`{variable}`). No `dangerouslySetInnerHTML` found. JSON-only API responses. No raw DOM manipulation detected.
* Better: Already safe for standard React rendering. Add CSP header to block inline scripts as defense-in-depth.
* Tradeoff: React's auto-escape handles 99% of XSS vectors. CSP catches the remaining edge cases (injected `<script>` via non-React paths).

### 4.4 SQL Injection

* Topic: SQLi
* File: All controllers, `server/app/models.py`
* Current: Zero risk. Pure ORM. No raw SQL anywhere. See Section 2.
* Better: No action needed.
* Tradeoff: N/A.

### 4.5 Stored XSS Risk

* Topic: Stored XSS
* File: All controllers accepting user input (names, notes, descriptions)
* Current: User input saved to DB without sanitization. Rendered in React frontend (auto-escaped) and HTML emails (NOT escaped). Stored XSS risk exists for email channel only.
* Better: Sanitize on input (strip HTML tags) or escape on output (email templates). React output already safe.
* Tradeoff: Input sanitization is preventive but may strip legitimate content. Output escaping is precise but must be applied at every render point.

### 4.6 CSP Header

* Topic: Content-Security-Policy
* File: `nginx/default.conf`
* Current: No CSP header set. No `X-Content-Type-Options`. No `X-Frame-Options`. No `Strict-Transport-Security`.
* Better: Add headers in nginx server block. Start CSP in report-only mode: `Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`
* Tradeoff: CSP blocks inline scripts (breaks some third-party widgets). Report-only mode catches issues before enforcement.

### 4.7 File Upload

* Topic: File Upload Security
* File: N/A (no upload endpoints exist)
* Current: `image_url` stored as string URL in `rewards.image_url` and `reward_variants.image_url`. No `multipart/form-data` handlers. No file upload endpoints.
* Better: When drag-to-upload is implemented: validate MIME type via magic bytes, allowlist extensions (`.jpg`, `.jpeg`, `.png`, `.webp`), limit size (5MB), store outside webroot, use UUID filenames, sanitize path traversal.
* Tradeoff: Self-hosted upload requires storage management. External service (S3, Cloudinary) offloads but adds cost and dependency.

---

## 5. API ROUTING MAP

### Route Groups

| Blueprint | Prefix | File | Auth | Public Routes |
|-----------|--------|------|------|---------------|
| `auth` | `/api/web/auth` | `auth_controller.py` | Mixed | `/login`, `/register`, `/locations`, `/groups`, `/me` (GET only) |
| `web` | `/api/web` | `web_controller.py` | `@token_required` + `@admin_required` | `/health` only |
| `rpi` | `/api/rpi` | `rpi_controller.py` | **NONE** | ALL routes — critical gap |
| root | `/`, `/health` | `routes.py` | None | All — acceptable |

### RPI Endpoints (All Unauthenticated)

| Endpoint | Method | Risk |
|----------|--------|------|
| `/api/rpi/machine/identify` | POST | Info disclosure — machine details exposed |
| `/api/rpi/machine/heartbeat` | POST | State manipulation — mark any machine online/full |
| `/api/rpi/authenticate` | POST | User lookup — enumerate valid display_ids |
| `/api/rpi/session/start` | POST | Session creation — start session for any user |
| `/api/rpi/session/deposit` | POST | Point inflation — credit arbitrary points |
| `/api/rpi/session/end` | POST | Session manipulation — end/timeout sessions |
| `/api/rpi/status/<uuid>` | GET | Info disclosure — machine status |
| `/api/rpi/points-config` | GET | Config exposure — points-per-item values |

### Web Controller Routes (53 total)

All use `@token_required` + `@admin_required` (or `@superadmin_required` for destructive operations). `@admin_required` has GET bypass bug — non-admin users can read all data.

---

## 6. ARCHITECTURE LAYERS

### Layer Analysis

| Layer | Present | Files | Notes |
|-------|---------|-------|-------|
| **Controllers** | Yes | `auth_controller.py`, `web_controller.py`, `rpi_controller.py` | Handle HTTP, validation, serialization, DB queries all in one. Controllers are bloated (~2870 lines in web_controller). |
| **Services** | Partial | `otp_service.py`, `notification_service.py` | Only OTP and notification logic extracted. No service layer for users, sessions, rewards, machines. |
| **Models** | Yes | `models.py` | Clean ORM layer. 23 models. Proper relationships, constraints, indexes. |
| **Middleware** | Yes | `middleware.py` | Auth decorators (`token_required`, `admin_required`, `superadmin_required`, `permission_required`). RBAC definitions. Role hierarchy. |
| **Repository/Data** | No | N/A | Controllers query DB directly via SQLAlchemy. No repository pattern. |
| **Validation** | No | N/A | No schema validation layer. Manual checks scattered across controllers. |

### Middleware Assessment

Middleware handles:
- JWT validation and user injection (`token_required`)
- Admin role check (`admin_required`)
- Superadmin role check (`superadmin_required`)
- Granular permission check (`permission_required`) — **defined but unused**
- Role hierarchy enforcement (`can_manage_role`)
- Org resolution (`get_user_org_id`)

Missing from middleware:
- Request validation (no schema enforcement)
- Request logging (no structured audit trail for raw API calls)
- Rate limiting (handled at app init level, not middleware)
- Error sanitization (handled per-controller, not centralized)

Controller bloat is security debt. Validation logic mixed with business logic makes auditing harder. When validation is scattered, gaps appear — admin user creation has no password policy (`web_controller.py:L716-717`) while registration does (`auth_controller.py:L508-515`).

---

## 7. CORS SECURITY

* Topic: CORS Configuration
* File: `server/app/__init__.py`, lines 48–72
* Current: Explicit origin allowlist: `localhost:3000`, `127.0.0.1:3000`, `ecopoints.org`, `www.ecopoints.org`, `rewards.ecopoints.org`. Additional origins via `CORS_ORIGINS` env var. Methods restricted to `GET/POST/PUT/DELETE/OPTIONS`. `supports_credentials: True`. `max_age: 3600`.
* Better: Already solid. Consider removing `supports_credentials: True` if cookies not used (currently JWT via header). When migrating to HttpOnly cookies, `supports_credentials` becomes necessary.
* Tradeoff: `supports_credentials: True` with wildcard origin would be critical — but origins are explicitly listed, so safe.

---

## 8. QR CODE SECURITY

### 8.1 Current QR Flow

* Topic: QR Code Authentication
* File: `server/app/controllers/rpi_controller.py`, lines 85–124; `server/app/models.py`, lines 202–231
* Current: User's QR code encodes `display_id` (e.g., `USER-AU-001`). RPI scans → sends to `/api/rpi/authenticate` → backend looks up `User.display_id` + `is_active`. Returns user data + wallet ID. Session starts.
* QR is permanent — generated once at user creation. Never regenerated. This is by design (user requirement).

### 8.2 Enumeration Risk

* Topic: QR display_id Predictable
* File: `server/app/models.py`, lines 202–231
* Current: `display_id` format: `{ROLE_PREFIX}-{ORG_ABBR}-{SEQUENTIAL_NUMBER}`. Example: `USER-AU-001`, `USER-AU-002`. Pattern is sequential and predictable.
* Risk: Attacker at machine scans `USER-AU-001` through `USER-AU-999` → starts sessions for other users → credits points to wrong wallets or drains points.
* Better: HMAC-signed permanent ID: `USER-AU-001.hMaC4x`. Generated via `hmac.new(org_secret, display_id, sha256).hexdigest()[:6]`. Backend verifies HMAC before accepting. ~16M combinations per ID — brute-force impractical.
* Tradeoff: HMAC suffix adds 7 chars to QR payload (negligible for QR density). Requires per-org secret storage. Existing users need migration script to backfill signed IDs.

---

## 9. DATABASE SECURITY

* Topic: Database Configuration
* File: `server/app/__init__.py`, lines 20–22; `docker-compose.yml`, lines 5–15
* Current: PostgreSQL 15-alpine via Docker. Credentials from env vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`). `DATABASE_URL` required at startup (RuntimeError if missing). Port 5432 commented out in docker-compose — DB only accessible within Docker network. Flask-SQLAlchemy default connection pooling (QueuePool).
* Better: Already secure. Consider adding `pool_size` and `max_overflow` config for production scale. Add `sslmode=require` to `DATABASE_URL` for encrypted connections if DB ever moves external.
* Tradeoff: Internal Docker network eliminates need for DB encryption in transit for current architecture.

---

## 10. ADMIN PERMISSION/AUTHORIZATION

### 10.1 Route Protection Summary

| Protection Level | Count | Routes |
|-----------------|-------|--------|
| `@superadmin_required` | 4 | org-type CRUD, location create, location delete |
| `@admin_required` | 49 | All other web_controller routes |
| `@token_required` only | 0 | None in web_controller |
| No auth | 1 | `/api/web/health` |

### 10.2 Superadmin Isolation

Properly protected. Only `superadmin` can:
- Create/delete org types (`web_controller.py:L425-465`)
- Create locations (`web_controller.py:L502-554`)
- Delete/deactivate locations (`web_controller.py:L601-627`)

### 10.3 Role Hierarchy Guard

* File: `server/app/middleware.py`, lines 127–133
* Current: `can_manage_role(actor_role, target_role)` returns True only if actor has strictly higher privilege level. Enforced on user creation (`web_controller.py:L708-710`).
* Gap: NOT enforced on user UPDATE. Admin could change another admin's role to `superadmin` via PUT `/api/web/users/<id>`.

### 10.4 Login Redirect (Client)

* File: `client/src/components/pages/LogIn.jsx`, lines 712–718
* Current: Post-login, checks `data.user.role` against admin role list. Admin roles → `router.push("/admin")`. Regular users → `router.push("/profile")`.
* Status: Fixed. Previously all users redirected to admin dashboard.

---

## 11. TRADEOFFS

| Decision | Current Choice | Alternative | Tradeoff |
|----------|---------------|-------------|----------|
| JWT vs Session | JWT (stateless) | Session + Redis | JWT = easy scale, hard revoke (need blacklist table). Session = easy revoke, needs Redis/shared store. |
| Token in localStorage vs Cookie | localStorage | HttpOnly cookie | localStorage = simple, XSS-vulnerable. Cookie = XSS-proof, needs CSRF. |
| ORM vs Raw SQL | SQLAlchemy ORM | Raw SQL | ORM = safe from SQLi, slightly slower. Raw SQL = faster, injection risk. |
| Single token vs Refresh | Single 24h token | Access + Refresh | Single = simple. Refresh = smaller exposure window, more complex auth flow. |
| `@admin_required` vs `@permission_required` | `@admin_required` (uniform) | `@permission_required` (granular) | Uniform = simple, least-privilege violated. Granular = secure, 53 routes to update. |
| QR permanent ID vs Rotating | Permanent `display_id` | Rotating token | Permanent = convenient, enumerable. Rotating = secure, UX friction (regenerate before each session). HMAC signing is the middle ground. |
| Monolith controllers vs Service layer | Monolith (2870-line web_controller) | Service extraction | Monolith = fewer files, harder to audit. Services = more files, testable, auditable. |

---

## 12. TOP FIXES — RANKED BY SEVERITY

### Fix 1: RPI API Key Authentication — 🔴 CRITICAL

* What: All `/api/rpi/*` endpoints lack authentication.
* Why: Anyone on network can credit points, start sessions for other users, manipulate machine state. Full economy compromise.
* How: Add `api_key_hash` column to `rvms` table. Create `@rpi_auth_required` decorator. Validate `X-API-Key` header against stored hash on every RPI route. Generate unique key per machine during provisioning.

### Fix 2: Remove `@admin_required` GET Bypass — 🔴 CRITICAL

* What: `admin_required` allows non-admin users to GET all 53 admin endpoints.
* Why: Regular users can read dashboard stats, user lists (with emails, phones), machine data, reward configs, all logs. Data exposure.
* How: Remove lines 86–87 in `middleware.py`. Replace with unconditional 403 for non-admin users.

### Fix 3: Move JWT to HttpOnly Cookie — 🟠 HIGH

* What: JWT stored in `localStorage`, readable by any JS on the page.
* Why: Single XSS vulnerability = full account takeover. Token theft via injected script.
* How: Set token via `Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict` on login response. Read from `request.cookies` in `token_required`. Add CSRF token for POST/PUT/DELETE.

### Fix 4: Fix Force Logout — 🟡 MEDIUM

* What: Force logout button writes log only. No tokens invalidated.
* Why: Emergency security feature non-functional. Compromised accounts cannot be force-disconnected.
* How: Add `force_logout_at` timestamp to `organizations`. On force-logout, set to `NOW()`. In `token_required`, reject tokens with `iat < org.force_logout_at`.

### Fix 5: Add Security Headers — 🟡 MEDIUM

* What: No CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
* Why: XSS amplified without CSP. Clickjacking possible without X-Frame-Options. HTTPS downgrade without HSTS.
* How: Add to `nginx/default.conf`:
  ```
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;" always;
  ```

---

## 13. WHAT IS LACKING

| Gap | Risk | Status |
|-----|------|--------|
| RPI endpoint authentication | Critical | Open |
| `admin_required` GET bypass for regular users | Critical | Open — bug |
| HttpOnly cookie for JWT | High | Open |
| Refresh token mechanism | High | Open |
| `@permission_required()` enforcement | Medium | Defined, never applied |
| Force-logout implementation | Medium | Broken — logs only |
| Security headers (CSP, HSTS, X-Frame-Options) | Medium | Missing |
| Input validation library (Pydantic/Marshmallow) | Medium | Missing |
| `html.escape()` in email templates | Medium | Missing |
| Password policy on admin-created users | Medium | Missing |
| Token blacklist cleanup job | Low | Missing |
| QR `display_id` HMAC signing | Low | Missing |
| Per-user rate limiting | Low | Missing |
| Structured request logging | Low | Missing |
| Role hierarchy check on user UPDATE | Low | Missing |

---

## 14. IMPROVEMENTS SINCE LAST AUDIT

| # | Change | File | Impact |
|---|--------|------|--------|
| 1 | OTP moved to persistent DB storage (`OtpCode` model) | `models.py:L282-299` | Survives restarts, works across workers. Replaces old in-memory dict. |
| 2 | Login attempt tracking + configurable lockout | `auth_controller.py:L69-103`, `models.py:L588-600` | 5 failures → 15-min lockout. Per-org config. |
| 3 | Error messages sanitized (RPI) | `rpi_controller.py` all `except` blocks | No more `str(exc)` stack trace leaks. All return `'An internal error occurred'`. |
| 4 | DB port no longer exposed | `docker-compose.yml:L14-15` | Port 5432 commented out. DB internal to Docker network. |
| 5 | Login redirect fixed for web | `LogIn.jsx:L712-718` | Role-based routing: admin → `/admin`, user → `/profile`. |
| 6 | `userType` allowlist on registration | `auth_controller.py:L499-501` | Validates against `('student', 'faculty', 'staff')`. |
| 7 | Role hierarchy prevents privilege escalation | `middleware.py:L127-133` | `can_manage_role()` enforced on user creation. |
| 8 | SECRET_KEY production guard | `__init__.py:L35-46` | Blocks startup with default key when `FLASK_ENV=production`. Warns in dev. |
| 9 | Token blacklist with `jti` | `middleware.py:L58-63`, `models.py:L574-585` | Revoked tokens rejected on every authenticated request. |
| 10 | Password strength validation on registration | `auth_controller.py:L508-515` | Min 8 chars, uppercase, lowercase, digit required. |
