# Requirements Document

## Introduction

This spec defines a phased hardening program for the EcoPoints platform. The program covers five sequential phases that together align data models to the admin UI, enforce least-privilege RBAC end-to-end, restructure the bloated API routing layer, close known security gaps surfaced by the v2 audit, and re-establish a deterministic seed dataset that exercises every role and redirect path.

Each phase is a distinct, reviewable deliverable with explicit exit criteria. Later phases SHALL NOT begin until earlier phases pass their exit criteria, because each phase produces structural assumptions the next phase relies on (for example, Phase 2 RBAC enforcement assumes Phase 1 model/UI alignment, and Phase 5 seed data must exercise the post-hardening surface area produced by Phases 1 through 4).

Scope of in-scope code:

- Backend: `server/app/__init__.py`, `server/app/middleware.py`, `server/app/models.py`, `server/app/routes.py`, `server/app/controllers/*.py`, `server/app/services/*.py`
- Frontend: `client/app/**/page.js`, `client/src/services/api/**`, login redirect logic
- Infra: `nginx/default.conf`, `docker-compose.yml`, seed scripts under `server/`

Out of scope: business-feature additions, model schema changes beyond what is required to surface admin UI fields, mobile RPI firmware changes beyond accepting the new authenticated payload contract.

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
- **ROLE_PERMISSIONS**: The role-to-permission-category map defined in Middleware that pairs each role with allowed action categories.
- **Permission_Required**: The decorator `@permission_required(*categories)` defined in Middleware that enforces ROLE_PERMISSIONS.
- **Admin_Required**: The decorator `@admin_required` defined in Middleware (currently has a GET-bypass bug).
- **Role_Hierarchy**: The `ROLE_HIERARCHY` ordering: `dependent` (0) < `user` (1) < `technician` (2) < `inventory_officer` (3) < `auditor` (4) < `head_admin` (5) < `superadmin` (6).
- **Admin_Role_Set**: The set `{superadmin, head_admin, auditor, technician, inventory_officer}`.
- **JWT**: The HS256 token issued at `/api/web/auth/login` and `/api/web/auth/verify-otp`. Each token carries `user_id`, `role`, `iat`, `exp`, `jti`.
- **Token_Blacklist**: The `TokenBlacklist` table used by Middleware to reject revoked JWTs by `jti`.
- **Force_Logout_At**: A timestamp column on `organizations` set when an admin invokes the force-logout-all action; used to invalidate all JWTs whose `iat` precedes it.
- **RPI_Auth**: The new authentication mechanism for `/api/rpi/*` consisting of (a) a per-machine API key validated by an `@rpi_auth_required` decorator and (b) HMAC-signed QR `display_id` payloads.
- **HMAC_QR_Payload**: A QR payload of the form `<display_id>.<hmac_suffix>` where `hmac_suffix = HMAC-SHA256(org_secret, display_id)[:6]` (6-character hex truncation).
- **CSRF_Token**: A double-submit cookie / header-pair token issued by the Server when JWT migrates to an HttpOnly cookie, required on all state-changing requests (POST, PUT, PATCH, DELETE).
- **Security_Headers**: The set `{X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Content-Security-Policy, Referrer-Policy}` set at the nginx edge.
- **Audit_Log_Entry**: A row in `AdminLog` capturing the actor user_id, action, target, before/after JSON, IP, user-agent, and timestamp.
- **Seed_Script**: The deterministic database population script under `server/` that creates one Organization, one Community Group, one provisioned RVM, one Reward, and one user per role in `{superadmin, head_admin, auditor, technician, inventory_officer, user, dependent}`.
- **Phase_Exit_Criteria**: The set of testable conditions enumerated under each phase requirement that MUST hold before the next phase begins.

## Requirements

### Requirement 1 — Phase 1: Align New Models to Admin UI Fields

**User Story:** As a head_admin, I want every Admin_UI page to display and edit only fields that exist on the corresponding server model with matching types and validation, so that the UI never silently drops data and never sends fields the server rejects.

#### Acceptance Criteria

1. THE Server SHALL expose, for each Admin_UI page in `{analytics, bulk-sessions, leaderboards, locations, logs/access, logs/bottles, logs/machines, logs/rewards, logs/transactions, machines, rewards, settings, users, users/permissions, profile}`, a single GET endpoint whose JSON response keys are a superset of the fields rendered by that page.
2. THE Client SHALL, for every form submission in the Admin_UI, send only fields that are accepted by the corresponding POST/PUT endpoint as documented in `api_routes_documentation.md`.
3. WHEN an Admin_UI page renders a model field, THE Client SHALL use the exact field name returned by the Server response without renaming.
4. IF the Server response omits a field that the Admin_UI page references, THEN THE Client SHALL render a defined empty-state placeholder rather than `undefined` or `null` literal text.
5. THE Server SHALL return a typed JSON schema (documented in `api_routes_documentation.md`) for every endpoint listed in criterion 1, where each field has a declared type in `{string, integer, number, boolean, iso8601_datetime, enum<…>, array<…>, object}`.
6. WHERE a model field is an enum (for example `user.role`, `machine.status`, `reward_redemption.status`), THE Server SHALL return the enum's canonical lowercase value and THE Client SHALL render it via a single shared label map.
7. FOR EVERY Admin_UI page P and field F that P renders, the JSON schema returned by the corresponding GET endpoint SHALL contain F (Phase 1 property — completeness invariant).
8. FOR EVERY field F submitted by an Admin_UI form, the corresponding POST/PUT endpoint SHALL accept F or return HTTP 400 with `error.code = "UNKNOWN_FIELD"` naming F (Phase 1 property — strict-acceptance invariant).
9. **Phase_Exit_Criteria for Phase 1**: criteria 1 through 8 hold for every page in the enumerated set, AND a model-vs-UI alignment report is checked into the repo at `docs/model-ui-alignment.md` listing each page, its endpoint, and the field-by-field mapping.

### Requirement 2 — Phase 2: RBAC Enforcement on Server Routes and Admin_UI Page Guards

**User Story:** As a security owner, I want ROLE_PERMISSIONS enforced uniformly on every server route and mirrored in Admin_UI page guards, so that least-privilege is real and auditable rather than aspirational.

#### Acceptance Criteria

1. THE Middleware SHALL apply `@permission_required(*categories)` to every route currently protected by `@admin_required` in Web_Controller and its successor Domain_Controllers, using categories drawn from the ROLE_PERMISSIONS map.
2. WHEN a request authenticated as role X reaches an endpoint requiring permission category C, IF role X's ROLE_PERMISSIONS entry does not include C, THEN THE Server SHALL respond HTTP 403 with body `{ "success": false, "error": { "code": "FORBIDDEN", "missing": C } }`.
3. THE Admin_UI SHALL load `ROLE_PERMISSIONS` (or a client-safe projection) from a single GET endpoint `/api/web/auth/me` and SHALL refuse to render any admin page whose required permission category is not present for the current user's role.
4. WHEN a user whose role lacks the required permission category navigates to an Admin_UI page, THE Client SHALL redirect to `/profile` (for role `user`) or `/admin` (for any other role with at least one admin permission) within 100 ms of route resolution.
5. THE Admin_UI navigation menu SHALL hide every link whose target page's required permission category is not present in the current user's role.
6. THE Middleware SHALL enforce Role_Hierarchy on the user UPDATE endpoint such that an actor with role `R_actor` cannot set a target user's role to any value `R_target` where `level(R_target) >= level(R_actor)`.
7. IF a user UPDATE request would violate the rule in criterion 6, THEN THE Server SHALL respond HTTP 403 with `error.code = "ROLE_HIERARCHY_VIOLATION"` and SHALL NOT mutate the target row.
8. THE Server SHALL write one Audit_Log_Entry for every successful change to a user's role, every successful change to a user's permission set, and every 403 caused by criterion 2 or criterion 7.
9. **Phase 2 property — server-side completeness**: FOR EVERY admin route R and EVERY role X in the keys of ROLE_PERMISSIONS, IF X lacks the permission category required by R, THEN a request from a JWT with role X SHALL receive HTTP 403.
10. **Phase 2 property — client-side completeness**: FOR EVERY Admin_UI page P and EVERY role X in the keys of ROLE_PERMISSIONS, IF X lacks the permission category required by P, THEN navigation to P from a session authenticated as X SHALL not render P's protected content.
11. **Phase_Exit_Criteria for Phase 2**: criteria 1 through 10 hold; the count of routes still using bare `@admin_required` (without `@permission_required`) is zero outside `auth_controller.py` and the public health route.

### Requirement 3 — Phase 3: API Routing Reorganization

**User Story:** As a maintainer, I want the 2978-line Web_Controller split into domain controllers and the client API service split into matching modules with no dead code, so that I can locate, audit, and modify any route in under a minute.

#### Acceptance Criteria

1. THE Server SHALL split Web_Controller into the Domain_Controllers enumerated in the Glossary, with each Domain_Controller registered as a sub-blueprint under `web_bp` at prefix `/api/web`.
2. THE Server SHALL preserve every existing path in `api_routes_documentation.md` byte-for-byte across the split (same method, same path, same response shape, same status codes).
3. THE Client SHALL split `client/src/services/api/` into per-domain modules `{client.js, auth.js, dashboard.js, users.js, locations.js, machines.js, rewards.js, logs.js, leaderboard.js, groups.js, analytics.js, settings.js, sessions.js}` and an `index.js` that re-exports them.
4. THE Client SHALL remove the `cities` module from `client/src/services/api/` and SHALL remove every import of `cities` from `client/app/**`.
5. WHERE a Domain_Controller declares a route, THE route SHALL be decorated with both `@token_required` and the appropriate `@permission_required(*categories)` (or `@superadmin_required` where category-level granularity does not apply).
6. THE Server SHALL keep `web_controller.py` only as a thin import shim during the split window OR delete it once all routes are migrated; in either case the file SHALL NOT exceed 200 lines after the phase completes.
7. **Phase 3 property — backward compatibility**: FOR EVERY (method, path) pair documented in `api_routes_documentation.md` before the split, the same (method, path) pair SHALL respond with the same success status code and the same top-level JSON keys after the split.
8. **Phase 3 property — no dead client code**: a static scan of `client/` SHALL find zero references to `apiService.cities` or any module path containing `services/api/cities`.
9. **Phase 3 property — single source of truth for the request layer**: every Client API module SHALL import the core `request()` function from `client/src/services/api/client.js` exactly once and SHALL NOT define its own fetch wrapper.
10. **Phase_Exit_Criteria for Phase 3**: criteria 1 through 9 hold; the route inventory regenerated from the running server matches the inventory in `api_routes_documentation.md` exactly; the line count of `web_controller.py` is at most 200.

### Requirement 4 — Phase 4: Security Enhancements

**User Story:** As a security owner, I want the audit-flagged gaps closed (RPI auth, admin GET-bypass, JWT in HttpOnly cookie with CSRF, working force-logout, security headers, input validation, email XSS escape, password policy on admin-created users, role-hierarchy on UPDATE), so that the platform meets the security_audit_v2 fixes 1 through 5.

#### Acceptance Criteria

##### 4A. RPI Authentication

1. THE Server SHALL add a hashed `api_key_hash` column to the `rvms` table and a provisioning flow that generates one API key per machine, stored hashed at rest.
2. THE Middleware SHALL define `@rpi_auth_required` that validates an `X-API-Key` header against the stored `api_key_hash` for the `machineUuid` carried in the request body or path.
3. THE RPI_Controller SHALL apply `@rpi_auth_required` to every route under `/api/rpi/*` except a single unauthenticated `/api/rpi/health` if needed.
4. WHEN a request to `/api/rpi/authenticate` carries a `qrPayload`, THE Server SHALL parse it as `<display_id>.<hmac_suffix>` and SHALL verify the suffix using HMAC-SHA256 keyed on the organization's per-org secret.
5. IF the HMAC verification in criterion 4A.4 fails, THEN THE Server SHALL respond HTTP 401 with `error.code = "QR_HMAC_INVALID"` and SHALL NOT perform any user lookup.
6. **Phase 4A property**: FOR EVERY request to any `/api/rpi/*` route lacking a valid `X-API-Key`, THE Server SHALL respond HTTP 401.
7. **Phase 4A property**: FOR EVERY request to `/api/rpi/authenticate` whose `qrPayload` HMAC suffix does not equal `HMAC-SHA256(org_secret, display_id)[:6]`, THE Server SHALL respond HTTP 401 and SHALL NOT emit a user-lookup database query.

##### 4B. Admin_Required GET-Bypass Fix

8. THE Middleware SHALL remove the GET-method bypass in `@admin_required` (current `middleware.py:84-88`) such that non-admin users receive HTTP 403 on every method including GET.
9. **Phase 4B property**: FOR EVERY (method, path) pair where the path is registered under any Domain_Controller and the authenticated user is not in Admin_Role_Set, THE Server SHALL respond HTTP 403 regardless of method.

##### 4C. JWT in HttpOnly Cookie + CSRF

10. WHEN login succeeds at `/api/web/auth/login` or `/api/web/auth/verify-otp`, THE Server SHALL set the JWT in a cookie with attributes `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/`, AND SHALL also issue a CSRF_Token in a non-HttpOnly cookie named `csrf_token`.
11. THE Middleware SHALL read the JWT from the `token` cookie first and fall back to the `Authorization: Bearer` header only during a transition window controlled by env var `AUTH_COOKIE_ONLY` (default `false` in this phase, switched to `true` at the end).
12. WHEN the request method is in `{POST, PUT, PATCH, DELETE}`, THE Middleware SHALL require the request header `X-CSRF-Token` to equal the `csrf_token` cookie value.
13. IF the CSRF check in criterion 4C.12 fails, THEN THE Server SHALL respond HTTP 403 with `error.code = "CSRF_INVALID"`.
14. THE Client SHALL stop reading and writing the JWT in `localStorage`, SHALL rely on the cookie for transport, and SHALL attach the `X-CSRF-Token` header on every state-changing request.

##### 4D. Force-Logout Fix

15. THE `organizations` table SHALL gain a `force_logout_at` timestamp column (nullable).
16. WHEN `POST /api/web/settings/security/force-logout` succeeds, THE Server SHALL set `organizations.force_logout_at = NOW()` for the actor's organization and SHALL write one Audit_Log_Entry.
17. THE Middleware SHALL reject any JWT whose `iat` is strictly less than the issuing user's `organization.force_logout_at` with HTTP 401 and `error.code = "FORCED_LOGOUT"`.
18. **Phase 4D property**: FOR EVERY JWT J and organization O such that `J.iat < O.force_logout_at`, every authenticated request bearing J SHALL respond HTTP 401 with `error.code = "FORCED_LOGOUT"`.

##### 4E. Security Headers

19. THE nginx edge SHALL set Security_Headers on every response: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, AND a `Content-Security-Policy` whose `default-src` is `'self'`.
20. THE `Content-Security-Policy` SHALL be deployed in `Content-Security-Policy-Report-Only` mode for at least one release before being switched to enforcing.

##### 4F. Input Validation

21. THE Server SHALL adopt a single schema-validation library (Pydantic v2 or Marshmallow) and SHALL define one schema per request body for every POST/PUT/PATCH route across all Domain_Controllers, Auth_Controller, and RPI_Controller.
22. WHEN a request body fails schema validation, THE Server SHALL respond HTTP 400 with `error.code = "VALIDATION_ERROR"` and an array of `{field, message}` entries.
23. **Phase 4F property**: FOR EVERY POST/PUT/PATCH endpoint, a request body containing a key not declared in that endpoint's schema SHALL produce HTTP 400 with `error.code` in `{"VALIDATION_ERROR", "UNKNOWN_FIELD"}`.

##### 4G. Email XSS Escape

24. THE notification service SHALL pass every interpolated user-supplied string (including but not limited to `subject`, `body`, `org_name`, machine names, reward names, user names) through `html.escape()` before insertion into HTML email templates.
25. **Phase 4G property**: FOR EVERY string S inserted into an HTML email template by `notification_service._build_email_html`, the rendered HTML SHALL contain `html.escape(S)` rather than S verbatim.

##### 4H. Password Policy on Admin-Created Users

26. WHEN an admin creates a user via `POST /api/web/users`, THE Server SHALL apply the same password policy as public registration (minimum 8 characters, at least one uppercase, one lowercase, one digit) using a single shared validator function.
27. IF the supplied password fails the policy, THEN THE Server SHALL respond HTTP 400 with `error.code = "WEAK_PASSWORD"` and SHALL NOT create the user.

##### 4I. Role-Hierarchy on User UPDATE

28. THE rule in Requirement 2 criterion 6 SHALL be applied at the controller layer for `PUT /api/web/users/<id>` in addition to the user-create path.
29. **Phase 4I property**: FOR EVERY actor role `R_actor` and target role `R_target`, IF `level(R_target) >= level(R_actor)`, THEN `PUT /api/web/users/<id>` setting role to `R_target` SHALL respond HTTP 403 with `error.code = "ROLE_HIERARCHY_VIOLATION"` regardless of which other fields are also being updated.

##### Phase 4 Exit

30. **Phase_Exit_Criteria for Phase 4**: criteria 1 through 29 hold; the security_audit_v2 "Top Fixes 1 through 5" rows move to status "Closed"; no plaintext JWT is read from or written to `localStorage` in any path under `client/`.

### Requirement 5 — Phase 5: Re-create Deterministic Seed and Login Redirects

**User Story:** As a developer onboarding to the project, I want a single seed command that produces one user per role plus the supporting org, group, machine, and reward, and I want login to redirect each role to the correct landing page, so that I can exercise every authorization path on a fresh checkout.

#### Acceptance Criteria

1. THE Seed_Script SHALL create exactly one Organization (deterministic name and abbreviation), one Community Group inside that organization, one provisioned RVM under that organization with a generated API key (printed once to stdout, stored hashed), and one Reward in that organization.
2. THE Seed_Script SHALL create exactly one user for each role in the set `{superadmin, head_admin, auditor, technician, inventory_officer, user, dependent}` with deterministic email addresses of the form `<role>@ecopoints.local`, identical password from a single env var (or a documented default `SeedPass!23`), and `is_active = true`.
3. THE Seed_Script SHALL be idempotent: running it twice on a populated database SHALL leave the row counts and primary keys for the seed entities unchanged.
4. WHEN the Seed_Script runs against an empty database, THE Server's RBAC SHALL accept the seeded `superadmin` user as authorized for every permission category in ROLE_PERMISSIONS.
5. WHEN a user with role in Admin_Role_Set successfully logs in, THE Client SHALL navigate to `/admin`.
6. WHEN a user with role `user` successfully logs in, THE Client SHALL navigate to `/profile`.
7. WHEN a user with role `dependent` successfully logs in, THE Client SHALL navigate to `/profile` (dependents share the regular-user landing page) or to a dedicated `/dependent` route if implemented; the chosen target SHALL NOT be `/admin`.
8. **Phase 5 property — redirect completeness**: FOR EVERY successful login response with `user.role` in Admin_Role_Set, the Client SHALL invoke `router.push("/admin")`; FOR EVERY successful login response with `user.role == "user"`, the Client SHALL invoke `router.push("/profile")`.
9. **Phase 5 property — seed determinism**: FOR EVERY role R in the enumerated seed set, after Seed_Script execution there SHALL exist exactly one row in `users` with `email = "<R>@ecopoints.local"` and `role = R`.
10. **Phase_Exit_Criteria for Phase 5**: criteria 1 through 9 hold; a smoke test logs in as each seeded role and asserts the redirect target matches criteria 5 through 7.

### Requirement 6 — Phase Ordering and Gating

**User Story:** As a release manager, I want each phase to be a hard gate on the next, so that we never enforce RBAC against unaligned models, never split routes before RBAC enforcement is testable, never re-seed against an unhardened API, and so on.

#### Acceptance Criteria

1. THE Platform release process SHALL treat phases 1 through 5 as strictly ordered: Phase N+1 SHALL NOT be merged or deployed until Phase N's Phase_Exit_Criteria are met and recorded in `docs/phase-status.md`.
2. WHEN a pull request opens a change set whose primary scope is Phase N+1, IF Phase N's status in `docs/phase-status.md` is not `closed`, THEN the pull request SHALL be marked as blocked.
3. **Phase 6 property — monotonic gating**: FOR EVERY pair of phases (N, N+1), the merge timestamp of the last Phase N+1 PR SHALL be greater than the merge timestamp of the Phase N closure PR.
4. THE Platform SHALL maintain `docs/phase-status.md` with one row per phase containing `{phase_number, name, status, exit_criteria_met_at, evidence_links}` where `status ∈ {not_started, in_progress, closed}`.

### Requirement 7 — Cross-Phase Non-Functional Requirements

**User Story:** As a security and operations owner, I want backward-compatible API paths during the controller split, an audit trail for every RBAC change, no hardcoded secrets, and CSRF protection once the JWT moves to a cookie, so that the hardening program does not introduce regressions or new gaps.

#### Acceptance Criteria

1. THE Server SHALL maintain backward-compatible API paths during Phase 3: every `(method, path)` pair listed in `api_routes_documentation.md` immediately before Phase 3 SHALL continue to respond at the same path with the same success status codes throughout Phase 3 and after Phase 3 closes.
2. THE Server SHALL write one Audit_Log_Entry for every change to ROLE_PERMISSIONS, every change to a user's role, every change to a user's permission overrides (if any), every force-logout invocation, and every API key rotation.
3. THE Audit_Log_Entry SHALL include actor `user_id`, target identifier, action name, before-snapshot JSON, after-snapshot JSON, IP, user-agent, and ISO-8601 timestamp.
4. THE Platform SHALL contain no hardcoded secrets in source: every secret (`SECRET_KEY`, DB password, per-org HMAC secret, RPI API keys, SMTP password, SMS provider key) SHALL be sourced from environment variables or a secrets manager.
5. WHEN `FLASK_ENV = "production"` and any required secret env var is missing or equals a known development default, THE Server SHALL refuse to start and SHALL log the missing variable name (without logging values).
6. WHEN the Server issues a JWT via cookie (Phase 4C), THE Server SHALL also issue a CSRF_Token, AND THE Server SHALL reject any state-changing request lacking a matching `X-CSRF-Token` header.
7. THE Server SHALL document every new env var added by phases 1 through 5 in `server/README.md` (or equivalent) with description, default, and whether it is required in production.
8. **Cross-phase property — secret hygiene**: a static scan of the repo SHALL produce zero matches for any of `{SECRET_KEY = "dev"`, hardcoded BCrypt salts, hardcoded API keys, hardcoded SMTP credentials, hardcoded SMS provider tokens`}` outside `*.example` files.
9. **Cross-phase property — audit completeness**: FOR EVERY successful mutating request to a user-management or settings-security endpoint, exactly one new Audit_Log_Entry SHALL exist with the actor's `user_id`.
