# Requirements Document

## Introduction

This spec defines a phased hardening program for the EcoPoints platform. The program is organized as six sequential phases (Phase 0 through Phase 5) that, together, close the audit-flagged critical authorization bug, restructure the bloated API routing layer, enforce least-privilege RBAC end-to-end, align the data models to the admin UI, finish the remaining security enhancements, and re-establish a deterministic seed dataset that exercises every role and redirect path.

The ordering is deliberate. Critical authorization defects are stopped first (Phase 0) because they are exploitable today. Then the Server is restructured before access control is enforced (Phase 1 → Phase 2) so that RBAC decorators are applied to per-domain controllers rather than retro-fitted onto a 2978-line monolith. Data alignment follows (Phase 3) once the routing surface is stable and access-controlled. Transport-layer and remaining security enhancements come next (Phase 4) and depend on the stable routing surface for cookie/CSRF rollout. Verification is last (Phase 5), because deterministic seed data and login-redirect smoke tests are only meaningful once the entire hardened surface exists.

Rationale for the ordering, in one line: **stop the bleeding (P0) → structure first (P1) → access control (P2) → data alignment (P3) → transport security (P4) → verification last (P5).**

Each phase is a distinct, reviewable deliverable with explicit Phase_Exit_Criteria. Later phases SHALL NOT begin until earlier phases pass their exit criteria.

Scope of in-scope code:

- Backend: `server/app/__init__.py`, `server/app/middleware.py`, `server/app/models.py`, `server/app/routes.py`, `server/app/controllers/*.py`, `server/app/services/*.py`
- Frontend: `client/app/**/page.js`, the (to-be-created) `client/src/services/api/**` directory, and the login modal component on the landing page
- Infra: `nginx/default.conf`, `docker-compose.yml`, seed scripts under `server/`, Flask-Migrate revisions

Out of scope: business-feature additions, model schema changes beyond what is required to surface admin UI fields, RVM firmware changes beyond accepting the new authenticated payload contract documented in `docs/rpi-api-contract.md`.

## Glossary

- **Platform**: The EcoPoints application as a whole (Flask server, Next.js client, RPI controller surface, nginx edge).
- **Server**: The Flask backend in `server/app/`.
- **Client**: The Next.js frontend in `client/app/` plus shared services in `client/src/`.
- **Admin_UI**: All Next.js pages under `client/app/admin/` plus `client/app/profile/`.
- **Web_Controller**: The current monolithic `server/app/controllers/web_controller.py` (≈2978 lines) registered under blueprint `web_bp` at prefix `/api/web`.
- **RPI_Controller**: `server/app/controllers/rpi_controller.py` registered under blueprint `rpi_bp` at prefix `/api/rpi`.
- **Auth_Controller**: `server/app/controllers/auth_controller.py` registered under blueprint `auth_bp` at prefix `/api/web/auth`.
- **Domain_Controller**: One of the new per-domain controller files extracted from Web_Controller (`dashboard_controller.py`, `users_controller.py`, `locations_controller.py`, `machines_controller.py`, `rewards_controller.py`, `logs_controller.py`, `leaderboard_controller.py`, `groups_controller.py`, `analytics_controller.py`, `settings_controller.py`, `sessions_controller.py`).
- **Middleware**: `server/app/middleware.py`, including JWT validation, role hierarchy, and the `ROLE_PERMISSIONS` map.
- **ROLE_PERMISSIONS**: The role-to-permission-category map defined in Middleware that pairs each admin role with allowed action categories.
- **Permission_Required**: The decorator `@permission_required(*categories)` defined in Middleware that enforces ROLE_PERMISSIONS. After Phase 0, it MUST be preceded by `@token_required` and MUST treat non-admin users as 403 before evaluating categories.
- **Admin_Required**: The decorator `@admin_required` defined in Middleware. Before Phase 0 it has a GET-method bypass bug (allows non-admin GETs); after Phase 0 it returns 403 unconditionally for non-admin users.
- **Admin_Or_403_Guard**: The shared private helper `_require_admin_or_403(current_user)` introduced in Phase 0 that returns HTTP 403 unconditionally when `current_user` is not in Admin_Role_Set. Both `@admin_required` and `@permission_required` MUST call this helper as their first authorization step.
- **Role_Hierarchy**: The `ROLE_HIERARCHY` ordering: `dependent` (0) < `user` (1) < `technician` (2) < `inventory_officer` (3) < `auditor` (4) < `head_admin` (5) < `superadmin` (6).
- **Admin_Role_Set**: The set `{superadmin, head_admin, auditor, technician, inventory_officer}`.
- **JWT**: The HS256 token issued at `/api/web/auth/login` and `/api/web/auth/verify-otp`. Each token carries `user_id`, `role`, `iat`, `exp`, `jti`.
- **Token_Blacklist**: The `token_blacklist` table used by Middleware to reject revoked JWTs by `jti`.
- **Token_Cleanup_Job**: A periodic job (Flask CLI command `flask cleanup-tokens` or equivalent) introduced in Phase 4 that deletes rows from `token_blacklist` where `expires_at < NOW()` and logs the number of rows deleted.
- **Force_Logout_At**: A timestamp column on `organizations` set when an admin invokes the force-logout-all action; used to invalidate all JWTs whose `iat` precedes it.
- **RPI_Auth**: The new authentication mechanism for `/api/rpi/*` consisting of (a) a per-machine API key validated by an `@rpi_auth_required` decorator and (b) HMAC-signed QR `display_id` payloads.
- **HMAC_QR_Payload**: A QR payload of the form `<display_id>.<hmac_suffix>` where `hmac_suffix = HMAC-SHA256(per_org_secret, display_id)[:6]` (6-character lowercase hex truncation).
- **RPI_API_Contract_Doc**: The committed deliverable `docs/rpi-api-contract.md` produced in Phase 4A that fully specifies the post-hardening `/api/rpi/*` interface for the hardware team to implement against. It includes request/response shapes, required headers, the HMAC_QR_Payload format, per-machine API key provisioning, per-org HMAC secret provisioning, error codes, and an example signed-QR generator in Python.
- **CSRF_Token**: A double-submit cookie / header-pair token issued by the Server when JWT migrates to an HttpOnly cookie, required on all state-changing requests (POST, PUT, PATCH, DELETE).
- **Security_Headers**: The set `{X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Content-Security-Policy, Referrer-Policy}` set at the nginx edge.
- **Audit_Log_Entry**: A row in `AdminLog` capturing the actor user_id, action, target, before/after JSON, IP, user-agent, and timestamp.
- **Login_Modal**: The login form component opened on the landing page (path to be determined during implementation, likely `client/src/components/**/LogIn*.jsx`). Note that `client/app/login/page.js` only redirects to `/?login=true`; the actual login form, success handler, and post-login redirect logic live in the modal component, not on a dedicated login page.
- **Seed_Script**: The deterministic database population script under `server/` that creates one Organization, one Community Group, one provisioned RVM, one Reward, and one user per role in `{superadmin, head_admin, auditor, technician, inventory_officer, user, dependent}`.
- **Phase_Exit_Criteria**: The set of testable conditions enumerated under each phase requirement that MUST hold before the next phase begins.

## Requirements

### Requirement 0 — Phase 0: Critical Security Hotfixes (Decorator GET-Bypass)

**User Story:** As a security owner, I want the GET-method bypass in both `@admin_required` and `@permission_required` closed before any other hardening work proceeds, so that non-admin tokens cannot read any admin endpoint while the rest of the program is still in flight.

#### Background

The current `server/app/middleware.py` contains the same GET-bypass defect in two decorators:

- `@admin_required` (lines 84–88): non-admin users receive 403 only for non-GET methods; GET requests pass through.
- `@permission_required` (lines 100–104): the same `if request.method != 'GET'` early return is present before the category check, so non-admin users can also GET any route protected by `@permission_required`.

Both decorators MUST be fixed in lockstep. Fixing only one leaves the other as an exploitable hole on whichever route uses the unfixed decorator.

#### Acceptance Criteria

1. THE Middleware SHALL introduce a shared private helper `_require_admin_or_403(current_user)` that returns HTTP 403 with `error.code = "ADMIN_REQUIRED"` whenever `current_user.role` is not in Admin_Role_Set, regardless of HTTP method.
2. THE Middleware SHALL refactor `@admin_required` so that its first action is to call `_require_admin_or_403(current_user)`; the decorator SHALL remove the `if request.method != 'GET'` branch that currently allows non-admin GET access.
3. THE Middleware SHALL refactor `@permission_required(*categories)` so that its first action is to call `_require_admin_or_403(current_user)`; only after that guard passes SHALL it evaluate whether the user's role grants every category in `*categories`.
4. THE Middleware SHALL document, in a docstring on `@permission_required`, that the decorator SHALL NOT be applied without `@token_required` preceding it.
5. WHERE `@permission_required` is applied to a route in any Domain_Controller or in the legacy Web_Controller during the transition, THE Middleware SHALL receive a `current_user` already injected by `@token_required` (i.e., decorator stacking order is enforced by code review and by lint/CI checks added in Phase 0).
6. THE Middleware SHALL document that admin-only granularity is the design baseline: every admin route is admin-only by definition, and per-category granularity in `ROLE_PERMISSIONS` only differentiates among members of Admin_Role_Set. Non-admin roles (`user`, `dependent`) SHALL never satisfy `@permission_required` for any category.
7. THE Middleware SHALL either remove the `user` role's entry from `ROLE_PERMISSIONS` or replace its value with an explicit comment documenting that the entry is a client-side hint with no server-side meaning. The `dependent` role SHALL remain absent from `ROLE_PERMISSIONS`.
8. **Phase 0 property — universal admin guard**: FOR EVERY decorator D in `{admin_required, permission_required}` and FOR EVERY HTTP method M in `{GET, POST, PUT, PATCH, DELETE}`, IF the request's authenticated user is not in Admin_Role_Set, THEN D SHALL return HTTP 403.
9. **Phase 0 property — decorator stacking**: FOR EVERY route currently protected by `@permission_required(*c)`, the route's decorator stack SHALL include `@token_required` immediately above `@permission_required`; static analysis or unit tests SHALL fail the build if this invariant is violated.
10. **Phase 0 property — no GET leakage**: FOR EVERY (method, path) pair P registered under `web_bp` and protected by either `@admin_required` or `@permission_required`, a request to P from a JWT whose role is in `{user, dependent}` SHALL receive HTTP 403, regardless of whether the method is GET.
11. **Phase_Exit_Criteria for Phase 0**: criteria 1 through 10 hold; the regression test suite includes one passing test per decorator × method matrix proving non-admin GET requests now return 403; no source file outside `*.example` retains the `if request.method != 'GET'` early-return pattern.

### Requirement 1 — Phase 1: API Routing Reorganization

**User Story:** As a maintainer, I want the 2978-line Web_Controller split into domain controllers and the client API service split into matching modules with no dead code, so that subsequent phases can decorate, audit, and modify any route in a single small file.

#### Acceptance Criteria

1. THE Server SHALL split Web_Controller into the Domain_Controllers enumerated in the Glossary, with each Domain_Controller registered as a sub-blueprint under `web_bp` at prefix `/api/web`.
2. THE Server SHALL preserve every existing path in `api_routes_documentation.md` byte-for-byte across the split (same method, same path, same response shape, same status codes).
3. THE Client SHALL **create** `client/src/services/api/` (which does not currently exist) by splitting the existing single-file `client/src/services/apiService.js` into per-domain modules `{client.js, auth.js, dashboard.js, users.js, locations.js, machines.js, rewards.js, logs.js, leaderboard.js, groups.js, analytics.js, settings.js, sessions.js}` placed inside that new directory, plus an `index.js` that re-exports them.
4. THE Client SHALL remove the `cities` module that exists in the legacy `apiService.js` and SHALL NOT carry it forward into `client/src/services/api/`; THE Client SHALL also remove every import of `cities` from `client/app/**`.
5. WHERE a Domain_Controller declares a route, THE route SHALL retain the same authorization decorators that existed on the corresponding Web_Controller route immediately prior to Phase 1 (i.e., Phase 1 is a pure restructuring; substituting `@permission_required` for `@admin_required` is the work of Phase 2, not Phase 1).
6. THE Server SHALL keep `web_controller.py` only as a thin import shim during the split window OR delete it once all routes are migrated; in either case the file SHALL NOT exceed 200 lines after the phase completes.
7. **Phase 1 property — backward compatibility**: FOR EVERY (method, path) pair documented in `api_routes_documentation.md` before the split, the same (method, path) pair SHALL respond with the same success status code and the same top-level JSON keys after the split.
8. **Phase 1 property — no dead client code**: a static scan of `client/` SHALL find zero references to `apiService.cities` or to any module path containing `services/api/cities`.
9. **Phase 1 property — single source of truth for the request layer**: every Client API module SHALL import the core `request()` function from `client/src/services/api/client.js` exactly once and SHALL NOT define its own fetch wrapper.
10. **Phase_Exit_Criteria for Phase 1**: criteria 1 through 9 hold; the route inventory regenerated from the running server matches the inventory in `api_routes_documentation.md` exactly; the line count of `web_controller.py` is at most 200; `client/src/services/api/` exists with the enumerated module files.

### Requirement 2 — Phase 2: RBAC Enforcement on Server Routes and Admin_UI Page Guards

**User Story:** As a security owner, I want ROLE_PERMISSIONS enforced uniformly on every server route in the now-split Domain_Controllers and mirrored in Admin_UI page guards, so that least-privilege is real and auditable rather than aspirational.

#### Acceptance Criteria

1. THE Middleware SHALL apply `@permission_required(*categories)` to every route currently protected by `@admin_required` across all Domain_Controllers, using categories drawn from the ROLE_PERMISSIONS map. The Phase 0 stacking rule (`@token_required` above `@permission_required`) SHALL be honored on every such route.
2. WHEN a request authenticated as an admin role X reaches an endpoint requiring permission category C, IF role X's ROLE_PERMISSIONS entry does not include C, THEN THE Server SHALL respond HTTP 403 with body `{ "success": false, "error": { "code": "FORBIDDEN", "missing": C } }`.
3. THE Admin_UI SHALL load `ROLE_PERMISSIONS` (or a client-safe projection) for the current user from `GET /api/web/auth/me` and SHALL refuse to render any admin page whose required permission category is not present for that user's role.
4. WHEN a user whose role lacks the required permission category navigates to an Admin_UI page, THE Client SHALL redirect to `/rewards` (for roles `user` and `dependent`) or to `/admin` (for any other admin role with at least one admin permission) within 100 ms of route resolution. Non-admin roles SHALL NEVER successfully render any page under `client/app/admin/`.
5. THE Admin_UI navigation menu SHALL hide every link whose target page's required permission category is not present in the current user's role.
6. THE Middleware SHALL enforce Role_Hierarchy on the user UPDATE endpoint such that an actor with role `R_actor` cannot set a target user's role to any value `R_target` where `level(R_target) >= level(R_actor)`.
7. IF a user UPDATE request would violate the rule in criterion 6, THEN THE Server SHALL respond HTTP 403 with `error.code = "ROLE_HIERARCHY_VIOLATION"` and SHALL NOT mutate the target row.
8. THE Server SHALL write one Audit_Log_Entry for every successful change to a user's role, every successful change to a user's permission set, and every 403 caused by criterion 2 or criterion 7.
9. **Phase 2 property — server-side completeness (admin granularity)**: FOR EVERY admin route R and EVERY admin role X in the keys of ROLE_PERMISSIONS, IF X lacks the permission category required by R, THEN a request from a JWT with role X SHALL receive HTTP 403.
10. **Phase 2 property — non-admin universal denial**: FOR EVERY admin route R and EVERY non-admin role Y in `{user, dependent}`, a request from a JWT with role Y SHALL receive HTTP 403 (this is the Phase 0 invariant continuing to hold under Phase 2 substitution).
11. **Phase 2 property — client-side completeness**: FOR EVERY Admin_UI page P and EVERY role X, IF X is in `{user, dependent}` OR (X is in Admin_Role_Set AND X lacks the permission category required by P), THEN navigation to P from a session authenticated as X SHALL not render P's protected content.
12. **Phase_Exit_Criteria for Phase 2**: criteria 1 through 11 hold; the count of routes still using bare `@admin_required` (without `@permission_required`) is zero outside `auth_controller.py` and the public health route.

### Requirement 3 — Phase 3: Align New Models to Admin UI Fields

**User Story:** As a head_admin, I want every Admin_UI page to display and edit only fields that exist on the corresponding server model with matching types and validation, so that the UI never silently drops data and never sends fields the server rejects.

#### Acceptance Criteria

1. THE Server SHALL expose, for each Admin_UI page in `{analytics, bulk-sessions, leaderboards, locations, logs/access, logs/bottles, logs/machines, logs/rewards, logs/transactions, machines, rewards, settings, users, users/permissions, profile}`, a single GET endpoint whose JSON response keys are a superset of the fields rendered by that page.
2. THE Client SHALL, for every form submission in the Admin_UI, send only fields that are accepted by the corresponding POST/PUT endpoint as documented in `api_routes_documentation.md`.
3. WHEN an Admin_UI page renders a model field, THE Client SHALL use the exact field name returned by the Server response without renaming.
4. IF the Server response omits a field that the Admin_UI page references, THEN THE Client SHALL render a defined empty-state placeholder rather than `undefined` or `null` literal text.
5. THE Server SHALL return a typed JSON schema (documented in `api_routes_documentation.md`) for every endpoint listed in criterion 1, where each field has a declared type in `{string, integer, number, boolean, iso8601_datetime, enum<…>, array<…>, object}`.
6. WHERE a model field is an enum (for example `user.role`, `machine.status`, `reward_redemption.status`), THE Server SHALL return the enum's canonical lowercase value and THE Client SHALL render it via a single shared label map.
7. **Phase 3 property — completeness invariant**: FOR EVERY Admin_UI page P and field F that P renders, the JSON schema returned by the corresponding GET endpoint SHALL contain F.
8. **Phase 3 property — strict-acceptance invariant**: FOR EVERY field F submitted by an Admin_UI form, the corresponding POST/PUT endpoint SHALL accept F or return HTTP 400 with `error.code = "UNKNOWN_FIELD"` naming F.
9. **Phase_Exit_Criteria for Phase 3**: criteria 1 through 8 hold for every page in the enumerated set; a model-vs-UI alignment report is checked into the repo at `docs/model-ui-alignment.md` listing each page, its endpoint, and the field-by-field mapping.

### Requirement 4 — Phase 4: Remaining Security Enhancements

**User Story:** As a security owner, I want the audit-flagged gaps that did not make it into Phase 0 closed (RPI auth + HMAC QR + contract document, JWT in HttpOnly cookie with CSRF, working force-logout, security headers, input validation, email XSS escape, password policy on admin-created users, role-hierarchy on UPDATE, and a token_blacklist cleanup job), so that the platform meets the security_audit_v2 fixes 1 and 3 through 5 and the remaining low-severity items.

#### 4A. RPI Authentication, HMAC QR, and Hardware Contract

The RVM hardware build is in progress. There is no production RVM fleet to migrate and no existing-deployment burden, so Phase 4A SHALL NOT include a backfill step for unsigned QR codes or a grace period for unauthenticated machines. Instead, Phase 4A SHALL produce a committed contract document that the hardware team implements against on first boot.

1. THE Server SHALL add a hashed `api_key_hash` column to the `rvms` table (Flask-Migrate revision with both upgrade and downgrade) and a provisioning flow that, when a new RVM is registered server-side, generates one API key, returns it once to the operator (printed to provisioning console output, never persisted in plaintext), and stores its hash at rest.
2. THE Middleware SHALL define `@rpi_auth_required` that validates an `X-API-Key` header against the stored `api_key_hash` for the `machineUuid` carried in the request body or path, using a constant-time comparison.
3. THE RPI_Controller SHALL apply `@rpi_auth_required` to every route under `/api/rpi/*` except a single optional unauthenticated `/api/rpi/health` if needed.
4. THE Server SHALL store one per-organization HMAC secret (random, ≥32 bytes) used to sign QR `display_id` payloads. The secret SHALL be sourced from a secrets manager or environment variable, never hardcoded, and SHALL be rotatable.
5. WHEN a request to `/api/rpi/authenticate` carries a `qrPayload`, THE Server SHALL parse it as `<display_id>.<hmac_suffix>` and SHALL verify the suffix using HMAC-SHA256 keyed on the user's organization's per-org HMAC secret, comparing against `HMAC-SHA256(per_org_secret, display_id)[:6]` (6-character lowercase hex).
6. IF the HMAC verification in criterion 4A.5 fails, THEN THE Server SHALL respond HTTP 401 with `error.code = "QR_HMAC_INVALID"` and SHALL NOT perform any user lookup.
7. THE Server SHALL produce `docs/rpi-api-contract.md` as a committed artifact before Phase 4A is marked closed. The document SHALL be implementable by the hardware team without further server-side context and SHALL include, at minimum:
   - Full request and response shapes for every `/api/rpi/*` endpoint after hardening.
   - All required headers, including `X-API-Key`, content type, and any request body fields.
   - The HMAC_QR_Payload format `<display_id>.<hmac_suffix>` with the truncation rule and the example construction.
   - The per-machine API key provisioning flow: how a new RVM is registered, how the key is generated server-side, how the plaintext key is shipped to the device exactly once at provisioning, and how it is hashed at rest.
   - The per-organization HMAC secret provisioning flow and rotation procedure.
   - The error codes the device should handle, including at minimum `RPI_AUTH_INVALID`, `QR_HMAC_INVALID`, `RPI_MACHINE_UNKNOWN`, `RPI_RATE_LIMITED`.
   - An example signed QR payload generation script in Python (≤30 lines) suitable for copy-paste into a provisioning tool.
8. **Phase 4A property — universal RPI auth**: FOR EVERY request to any `/api/rpi/*` route lacking a valid `X-API-Key` (other than `/api/rpi/health` if present), THE Server SHALL respond HTTP 401.
9. **Phase 4A property — HMAC short-circuit**: FOR EVERY request to `/api/rpi/authenticate` whose `qrPayload` HMAC suffix does not equal `HMAC-SHA256(per_org_secret, display_id)[:6]`, THE Server SHALL respond HTTP 401 and SHALL NOT emit a user-lookup database query.
10. **Phase 4A property — contract artifact**: `docs/rpi-api-contract.md` SHALL exist in the repository and SHALL be referenced from the Phase 4 closure entry in `docs/phase-status.md`.

#### 4B. JWT in HttpOnly Cookie + CSRF

11. WHEN login succeeds at `/api/web/auth/login` or `/api/web/auth/verify-otp`, THE Server SHALL set the JWT in a cookie with attributes `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/`, AND SHALL also issue a CSRF_Token in a non-HttpOnly cookie named `csrf_token`.
12. THE Middleware SHALL read the JWT from the `token` cookie first and fall back to the `Authorization: Bearer` header only during a transition window controlled by env var `AUTH_COOKIE_ONLY` (default `false` during transition, switched to `true` at the end of Phase 4).
13. WHEN the request method is in `{POST, PUT, PATCH, DELETE}`, THE Middleware SHALL require the request header `X-CSRF-Token` to equal the `csrf_token` cookie value.
14. IF the CSRF check in criterion 4B.13 fails, THEN THE Server SHALL respond HTTP 403 with `error.code = "CSRF_INVALID"`.
15. THE Server SHALL include `X-CSRF-Token` in the CORS `Access-Control-Allow-Headers` configuration in `server/app/__init__.py` so browsers can attach the CSRF header on cross-origin requests. THE Server SHALL keep `supports_credentials: True` (already present) for cookie transport.
16. THE Client SHALL stop reading and writing the JWT in `localStorage`, SHALL rely on the cookie for transport, and SHALL attach the `X-CSRF-Token` header on every state-changing request.

#### 4C. Force-Logout Fix

17. THE `organizations` table SHALL gain a `force_logout_at` timestamp column (nullable). The migration SHALL be a Flask-Migrate revision and SHALL ship with both upgrade and downgrade scripts.
18. WHEN `POST /api/web/settings/security/force-logout` succeeds, THE Server SHALL set `organizations.force_logout_at = NOW()` for the actor's organization and SHALL write one Audit_Log_Entry.
19. THE Middleware SHALL reject any JWT whose `iat` is strictly less than the issuing user's `organization.force_logout_at` with HTTP 401 and `error.code = "FORCED_LOGOUT"`.
20. **Phase 4C property — forced-logout invariant**: FOR EVERY JWT J and organization O such that `J.iat < O.force_logout_at`, every authenticated request bearing J SHALL respond HTTP 401 with `error.code = "FORCED_LOGOUT"`.

#### 4D. Security Headers

21. THE nginx edge SHALL set Security_Headers on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, AND a `Content-Security-Policy` whose `default-src` is `'self'`.
22. THE `Content-Security-Policy` SHALL be deployed in `Content-Security-Policy-Report-Only` mode for at least one release before being switched to enforcing.

#### 4E. Input Validation

23. THE Server SHALL adopt a single schema-validation library (Pydantic v2 or Marshmallow) and SHALL define one schema per request body for every POST/PUT/PATCH route across all Domain_Controllers, Auth_Controller, and RPI_Controller.
24. WHEN a request body fails schema validation, THE Server SHALL respond HTTP 400 with `error.code = "VALIDATION_ERROR"` and an array of `{field, message}` entries.
25. **Phase 4E property — strict-acceptance**: FOR EVERY POST/PUT/PATCH endpoint, a request body containing a key not declared in that endpoint's schema SHALL produce HTTP 400 with `error.code` in `{"VALIDATION_ERROR", "UNKNOWN_FIELD"}`.

#### 4F. Email XSS Escape

26. THE notification service SHALL pass every interpolated user-supplied string (including but not limited to `subject`, `body`, `org_name`, machine names, reward names, user names) through `html.escape()` before insertion into HTML email templates.
27. **Phase 4F property — output escaping**: FOR EVERY string S inserted into an HTML email template by `notification_service._build_email_html`, the rendered HTML SHALL contain `html.escape(S)` rather than S verbatim.

#### 4G. Password Policy on Admin-Created Users

28. WHEN an admin creates a user via `POST /api/web/users`, THE Server SHALL apply the same password policy as public registration (minimum 8 characters, at least one uppercase, one lowercase, one digit) using a single shared validator function.
29. IF the supplied password fails the policy, THEN THE Server SHALL respond HTTP 400 with `error.code = "WEAK_PASSWORD"` and SHALL NOT create the user.

#### 4H. Role-Hierarchy on User UPDATE

30. THE rule in Requirement 2 criterion 6 SHALL be applied at the controller layer for `PUT /api/web/users/<id>` in addition to the user-create path.
31. **Phase 4H property — hierarchy on update**: FOR EVERY actor role `R_actor` and target role `R_target`, IF `level(R_target) >= level(R_actor)`, THEN `PUT /api/web/users/<id>` setting role to `R_target` SHALL respond HTTP 403 with `error.code = "ROLE_HIERARCHY_VIOLATION"` regardless of which other fields are also being updated.

#### 4I. Token Blacklist Cleanup Job

32. THE Server SHALL implement a periodic cleanup job (Token_Cleanup_Job) that deletes rows from `token_blacklist` where `expires_at < NOW()`. The job MAY be implemented as a Flask CLI command (`flask cleanup-tokens`) invoked on a schedule (cron, Render cron job, GitHub Action, or equivalent).
33. THE Token_Cleanup_Job SHALL log, on every run, the number of rows deleted and the wall-clock duration of the cleanup transaction.
34. THE schedule for Token_Cleanup_Job SHALL be documented in the deployment README and SHALL run at least once per 24 hours.
35. **Phase 4I property — bounded-blacklist invariant**: FOR EVERY row R in `token_blacklist` with `R.expires_at < NOW() - 1 day`, after the next scheduled Token_Cleanup_Job run, R SHALL NOT exist.

#### Phase 4 Exit

36. **Phase_Exit_Criteria for Phase 4**: criteria 1 through 35 hold; the security_audit_v2 "Top Fixes 1, 3, 4, and 5" rows move to status "Closed" (Top Fix 2, the GET-bypass, was already closed in Phase 0); no plaintext JWT is read from or written to `localStorage` in any path under `client/`; `docs/rpi-api-contract.md` is committed; the Token_Cleanup_Job has run successfully at least once in CI or staging.

### Requirement 5 — Phase 5: Re-create Deterministic Seed and Login Redirects

**User Story:** As a developer onboarding to the project, I want a single seed command that produces one user per role plus the supporting org, group, machine, and reward, and I want login (handled in the Login_Modal) to redirect each role to the correct landing page, so that I can exercise every authorization path on a fresh checkout.

#### Acceptance Criteria

1. THE Seed_Script SHALL create exactly one Organization (deterministic name and abbreviation), one Community Group inside that organization, one provisioned RVM under that organization with a generated API key (printed once to stdout, stored hashed per Phase 4A), and one Reward in that organization.
2. THE Seed_Script SHALL create exactly one user for each role in the set `{superadmin, head_admin, auditor, technician, inventory_officer, user, dependent}` with deterministic email addresses of the form `<role>@ecopoints.local` and `is_active = true`.
3. THE seeded password SHALL satisfy the Phase 4G password policy (≥8 characters, at least one uppercase, one lowercase, one digit). The default seeded password SHALL be `SeedPass!23` (which already passes the policy) and SHALL be overridable via env var `SEED_PASSWORD` so CI environments can supply their own value.
4. IF `SEED_PASSWORD` is set but does not satisfy the password policy, THEN the Seed_Script SHALL exit with a non-zero status and SHALL NOT create or update any user rows.
5. THE Seed_Script SHALL be idempotent: running it twice on a populated database SHALL leave the row counts and primary keys for the seed entities unchanged.
6. WHEN the Seed_Script runs against an empty database, THE Server's RBAC SHALL accept the seeded `superadmin` user as authorized for every permission category in ROLE_PERMISSIONS.
7. THE Login_Modal SHALL implement role-based post-login navigation. The integration point is the login modal component on the landing page (path to be determined during implementation, likely under `client/src/components/**/LogIn*.jsx` or similar); the file `client/app/login/page.js` is a thin redirect to `/?login=true` and SHALL NOT contain redirect-after-login logic.
8. WHEN a user with role in Admin_Role_Set successfully logs in, THE Client SHALL navigate to `/admin`.
9. WHEN a user with role `user` successfully logs in, THE Client SHALL navigate to `/rewards`.
10. WHEN a user with role `dependent` successfully logs in, THE Client SHALL navigate to `/rewards`.
11. THE Client SHALL NOT use `/profile` as a post-login redirect target for any role; `/profile` remains reachable by manual navigation but is no longer the landing page for non-admin users.
12. **Phase 5 property — redirect completeness (admin)**: FOR EVERY successful login response with `user.role` in Admin_Role_Set, the Client SHALL navigate to `/admin`.
13. **Phase 5 property — redirect completeness (non-admin)**: FOR EVERY successful login response with `user.role` in `{user, dependent}`, the Client SHALL navigate to `/rewards`.
14. **Phase 5 property — seed determinism**: FOR EVERY role R in the enumerated seed set, after Seed_Script execution there SHALL exist exactly one row in `users` with `email = "<R>@ecopoints.local"` and `role = R`.
15. **Phase_Exit_Criteria for Phase 5**: criteria 1 through 14 hold; a smoke test logs in as each seeded role and asserts the redirect target matches criteria 8 through 10.

### Requirement 6 — Phase Ordering and Gating

**User Story:** As a release manager, I want each phase to be a hard gate on the next, so that we never split routes before stopping the GET-bypass, never enforce per-category RBAC against a monolithic controller, never align models against an unstable route surface, never roll out cookie auth before the routing and RBAC are stable, and never re-seed against an unhardened API.

#### Acceptance Criteria

1. THE Platform release process SHALL treat phases 0 through 5 as strictly ordered: Phase N+1 SHALL NOT be merged or deployed until Phase N's Phase_Exit_Criteria are met and recorded in `docs/phase-status.md`.
2. WHEN a pull request opens a change set whose primary scope is Phase N+1, IF Phase N's status in `docs/phase-status.md` is not `closed`, THEN the pull request SHALL be marked as blocked.
3. **Phase 6 property — monotonic gating**: FOR EVERY pair of consecutive phases (N, N+1) where N is in `{0, 1, 2, 3, 4}`, the merge timestamp of the last Phase N+1 PR SHALL be greater than the merge timestamp of the Phase N closure PR.
4. THE Platform SHALL maintain `docs/phase-status.md` with one row per phase containing `{phase_number, name, status, exit_criteria_met_at, evidence_links}` where `phase_number ∈ {0, 1, 2, 3, 4, 5}` and `status ∈ {not_started, in_progress, closed}`.
5. THE row order in `docs/phase-status.md` SHALL match the canonical ordering: Phase 0 (Critical Security Hotfixes), Phase 1 (API Routing Reorganization), Phase 2 (RBAC Enforcement), Phase 3 (Model ↔ Admin UI Alignment), Phase 4 (Remaining Security Enhancements), Phase 5 (Seed + Login Redirects).

### Requirement 7 — Cross-Phase Non-Functional Requirements

**User Story:** As a security and operations owner, I want backward-compatible API paths during the controller split, an audit trail for every RBAC change, no hardcoded secrets, CSRF protection once the JWT moves to a cookie, and properly tested migrations, so that the hardening program does not introduce regressions or new gaps.

#### Acceptance Criteria

1. THE Server SHALL maintain backward-compatible API paths during Phase 1: every `(method, path)` pair listed in `api_routes_documentation.md` immediately before Phase 1 SHALL continue to respond at the same path with the same success status codes throughout Phase 1 and after Phase 1 closes.
2. THE Server SHALL write one Audit_Log_Entry for every change to ROLE_PERMISSIONS, every change to a user's role, every change to a user's permission overrides (if any), every force-logout invocation, and every API key rotation.
3. THE Audit_Log_Entry SHALL include actor `user_id`, target identifier, action name, before-snapshot JSON, after-snapshot JSON, IP, user-agent, and ISO-8601 timestamp.
4. THE Platform SHALL contain no hardcoded secrets in source: every secret (`SECRET_KEY`, DB password, per-org HMAC secret, RPI API keys, SMTP password, SMS provider key, `SEED_PASSWORD` if non-default, CSRF signing key if added) SHALL be sourced from environment variables or a secrets manager.
5. WHEN `FLASK_ENV = "production"` and any required secret env var is missing or equals a known development default, THE Server SHALL refuse to start and SHALL log the missing variable name (without logging values).
6. WHEN the Server issues a JWT via cookie (Phase 4B), THE Server SHALL also issue a CSRF_Token, AND THE Server SHALL reject any state-changing request lacking a matching `X-CSRF-Token` header.
7. THE Server SHALL document every new env var added by phases 0 through 5 in `server/README.md` (or equivalent) with description, default, and whether it is required in production.
8. THE Server SHALL implement every schema change as a Flask-Migrate revision. Each phase that adds columns (Phase 4A `rvms.api_key_hash`, Phase 4C `organizations.force_logout_at`) SHALL ship with both upgrade and downgrade scripts, and the migration SHALL be exercised against the Supabase-hosted Postgres instance before the corresponding PR is merged. The migration test evidence (timestamped log of `flask db upgrade` followed by `flask db downgrade -1` on a Supabase branch or staging copy) SHALL be linked in `docs/phase-status.md` for the phase that introduced the migration.
9. **Cross-phase property — secret hygiene**: a static scan of the repo SHALL produce zero matches for any of `{SECRET_KEY = "dev"`, hardcoded BCrypt salts, hardcoded API keys, hardcoded SMTP credentials, hardcoded SMS provider tokens, hardcoded per-org HMAC secrets`}` outside `*.example` files.
10. **Cross-phase property — audit completeness**: FOR EVERY successful mutating request to a user-management or settings-security endpoint, exactly one new Audit_Log_Entry SHALL exist with the actor's `user_id`.
11. **Cross-phase property — migration reversibility**: FOR EVERY Flask-Migrate revision introduced by phases 0 through 5, applying `upgrade` followed by `downgrade -1` against a Supabase-hosted Postgres instance SHALL leave the schema byte-identical (column lists, constraints, indexes) to the pre-upgrade state.
