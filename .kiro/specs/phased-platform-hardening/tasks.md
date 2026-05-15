# Implementation Plan: Phased Platform Hardening

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

This plan tracks the six-phase EcoPoints platform hardening program (Phase 0 → Phase 5) defined in `requirements.md` and detailed in `design.md`. Phases are strictly ordered: each phase's exit criteria MUST be satisfied (and recorded in `docs/phase-status.md`) before the next phase begins. Server work is in Python (Flask + SQLAlchemy + Pydantic v2 + Hypothesis); Client work is in JavaScript (Next.js, Vitest + fast-check); edge work is in nginx config; migrations are Flask-Migrate revisions.

## Tasks

- [ ] 1. Phase 0 — Critical Security Hotfixes (close GET-bypass)
  - [ ] 1.1 Introduce shared admin guard helper in `server/app/middleware.py`
    - Define `ADMIN_ROLE_SET = {'superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer'}` at module scope.
    - Add private function `_require_admin_or_403(current_user)` that returns a Flask `(jsonify({...ADMIN_REQUIRED...}), 403)` tuple when `current_user.role` is not in `ADMIN_ROLE_SET`, else returns `None`.
    - Error envelope: `{ "success": false, "error": { "code": "ADMIN_REQUIRED", "message": "Admin access required" } }`.
    - _Requirements: 0.1, 0.6_

  - [ ] 1.2 Refactor `@admin_required` to call `_require_admin_or_403` first
    - Remove the `if request.method != 'GET'` early-return branch entirely.
    - Decorator's first action MUST be `denied = _require_admin_or_403(current_user); if denied: return denied`.
    - _Requirements: 0.2, 0.8_

  - [ ] 1.3 Refactor `@permission_required(*categories)` to call `_require_admin_or_403` first
    - Remove the `if request.method != 'GET'` early-return branch entirely.
    - First action: call `_require_admin_or_403`; only on pass evaluate categories against `ROLE_PERMISSIONS[current_user.role]`.
    - On category miss return HTTP 403 with `{ error: { code: "FORBIDDEN", missing: <category>, message: ... } }`.
    - Add docstring stating that `@token_required` MUST precede `@permission_required` in the decorator stack.
    - _Requirements: 0.3, 0.4, 0.8_

  - [ ] 1.4 Sanitize `ROLE_PERMISSIONS` to remove non-admin entries
    - Either delete the `user` key from `ROLE_PERMISSIONS` or replace its value with an explicit comment marking it as a client-side hint with no server meaning.
    - Verify `dependent` is absent from `ROLE_PERMISSIONS`.
    - _Requirements: 0.7_

  - [ ]* 1.5 Write property test for the universal admin guard
    - **Property A: Universal admin guard**
    - **Validates: Requirements 0.1, 0.2, 0.3, 0.6, 0.8, 0.10, 2.10**
    - File: `server/tests/property/test_phase0_admin_guard.py`.
    - Use Hypothesis with `non_admin_roles()` × `http_methods()` × `decorators ∈ {admin_required, permission_required}`. Build a Flask test app that mounts a stub handler for each combo, mint a JWT for the chosen role, assert HTTP 403 with `error.code == "ADMIN_REQUIRED"` on every example. Configure `@settings(max_examples=200)`.

  - [ ]* 1.6 Write static-analysis test for decorator stacking
    - **Property B: Decorator stacking**
    - **Validates: Requirements 0.5, 0.9**
    - File: `server/tests/static/test_decorator_stacking.py`.
    - Walk the AST of every `server/app/controllers/*.py` route handler; for every function decorated with `@permission_required`, assert the decorator immediately above is `@token_required`. Also assert no source file outside `*.example` retains an `if request.method != 'GET'` early-return inside a function named `admin_required` or `permission_required`.

- [ ] 2. Checkpoint — Phase 0 closure
  - Ensure all tests pass, ask the user if questions arise.
  - Record Phase 0 status in `docs/phase-status.md` (create the file if absent) with `status = closed`, the exit criteria evidence, and merge timestamps.

- [ ] 3. Phase 1 (Server) — Decompose `web_controller.py` into Domain_Controllers
  - [ ] 3.1 Create `server/app/controllers/_shared.py` with serializer and helper utilities
    - Move/extract `_serialize_user`, `_serialize_organization`, `_serialize_rvm`, `_serialize_reward`, `_serialize_bottle_log`, `_serialize_machine_log`, `_serialize_admin_log`, `_serialize_reward_log`, `_log_action`, `_paginate`, `_scope_location_id` into this single module.
    - Each helper is imported from `_shared` by every Domain_Controller; no duplicate definitions remain.
    - _Requirements: 1.1, 1.5, 7.1_

  - [ ] 3.2 Extract `dashboard_controller.py`
    - Create `server/app/controllers/dashboard_controller.py` exporting `dashboard_bp` (sub-blueprint of `web_bp`, prefix `/dashboard`).
    - Move `dashboard_stats` and adjacent helpers, preserving the existing decorator stack byte-for-byte.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.3 Extract `users_controller.py`
    - Create `server/app/controllers/users_controller.py` exporting `users_bp` (prefix `/users`).
    - Move `get_users`, `get_user`, `create_user`, `update_user`, `delete_user`, `adjust_user_points`. Preserve every existing decorator on every route.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.4 Extract `locations_controller.py`
    - Create `server/app/controllers/locations_controller.py` exporting `locations_bp` (owns `/locations/*` and `/org-types/*`).
    - Move `get_org_types`, `create_org_type`, `delete_org_type`, `get_locations`, `create_location`, `update_location`, `delete_location`.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.5 Extract `machines_controller.py`
    - Create `server/app/controllers/machines_controller.py` exporting `machines_bp` (prefix `/machines`).
    - Move `get_machines`, `create_machine`, `update_machine`, `delete_machine`.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.6 Extract `rewards_controller.py`
    - Create `server/app/controllers/rewards_controller.py` exporting `rewards_bp` (prefix `/rewards`).
    - Move all reward CRUD handlers.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.7 Extract `logs_controller.py`
    - Create `server/app/controllers/logs_controller.py` exporting `logs_bp` (prefix `/logs`).
    - Move admin/bottle/machine/transaction/reward/access log-listing handlers.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.8 Extract `leaderboard_controller.py`
    - Create `server/app/controllers/leaderboard_controller.py` exporting `leaderboard_bp` (prefix `/leaderboard`).
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.9 Extract `groups_controller.py`
    - Create `server/app/controllers/groups_controller.py` exporting `groups_bp` (prefix `/groups`).
    - Move community-group CRUD.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.10 Extract `analytics_controller.py`
    - Create `server/app/controllers/analytics_controller.py` exporting `analytics_bp` (prefix `/analytics`).
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.11 Extract `settings_controller.py`
    - Create `server/app/controllers/settings_controller.py` exporting `settings_bp` (prefix `/settings`).
    - Move notification settings; leave a placeholder for the Phase 4C force-logout endpoint.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.12 Extract `sessions_controller.py`
    - Create `server/app/controllers/sessions_controller.py` exporting `sessions_bp` (owns `/sessions/*` and `/bulk-sessions/*`).
    - Move bulk-deposit and recycling-session admin views.
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 3.13 Reduce `web_controller.py` and register sub-blueprints in `server/app/__init__.py`
    - Update `server/app/__init__.py` to register each new sub-blueprint under `web_bp` so external paths under `/api/web/...` remain byte-identical.
    - Reduce `web_controller.py` to a thin shim ≤200 lines (or delete entirely if `__init__.py` registers controllers directly).
    - Delete the duplicated handler code from `web_controller.py` once it lives in the Domain_Controllers.
    - _Requirements: 1.1, 1.2, 1.6, 7.1_

  - [ ]* 3.14 Write property tests for backward-compatible paths and decorator preservation
    - **Property D: Backward-compatible API paths**
    - **Property F: Phase-1 decorator preservation**
    - **Validates: Requirements 1.2, 1.5, 1.7, 7.1**
    - File: `server/tests/property/test_phase1_route_invariants.py`.
    - Snapshot the route inventory (method, rule, decorator names) from the Flask app immediately before the split into a fixture file `server/tests/fixtures/route_snapshot_pre_phase1.json` (committed). Property D walks `app.url_map.iter_rules()` for every snapshotted `(method, rule)` and asserts the (method, rule) is still registered, returns the same success status code, and returns the same top-level JSON-key set. Property F asserts the multiset of authorization decorator names attached to each surviving handler is unchanged from the snapshot.

- [ ] 4. Phase 1 (Client) — Decompose `apiService.js` into `client/src/services/api/`
  - [ ] 4.1 Create `client/src/services/api/client.js` (single source of `request()`)
    - Implement `request(method, path, { body, headers } = {})` as the only fetch wrapper: builds URL from `NEXT_PUBLIC_API_BASE`, JSON-encodes body, parses JSON response, normalizes `{ success, error }` envelopes, throws on non-2xx with the server's `error.code`/`error.message`.
    - Export `request` plus an `apiBase` constant.
    - _Requirements: 1.3, 1.9_

  - [ ] 4.2 Create per-domain modules under `client/src/services/api/` and an `index.js`
    - Files: `auth.js`, `dashboard.js`, `users.js`, `locations.js`, `machines.js`, `rewards.js`, `logs.js`, `leaderboard.js`, `groups.js`, `analytics.js`, `settings.js`, `sessions.js`.
    - Each module imports `request` from `./client` exactly once and exports named functions matching the routes in `api_routes_documentation.md`.
    - `index.js` re-exports every module and a default object `{ auth, dashboard, users, ... }` for convenience.
    - _Requirements: 1.3, 1.9_

  - [ ] 4.3 Delete `client/src/services/apiService.js`, drop `cities`, and rewrite all imports
    - Search `client/app/**` and `client/src/**` for `from ['"].*apiService` and `from ['"].*services/api/cities` and rewrite each to import from `'@/services/api'` (or relative equivalent).
    - Delete `apiService.js` and `apiService.cities` references; confirm `client/src/data/mockData.js`'s local `CITIES` list is untouched.
    - _Requirements: 1.4, 1.8_

  - [ ]* 4.4 Write static tests for client API hygiene
    - **Property C: Dead-code-free client API layer**
    - **Property E: Single-source request layer**
    - **Validates: Requirements 1.4, 1.8, 1.9**
    - File: `client/tests/static/api-hygiene.test.js` (Vitest).
    - Property C: walk every file under `client/`, fail if any contains `apiService.cities` or `services/api/cities`.
    - Property E: for every file in `client/src/services/api/` other than `client.js`, parse the source and assert exactly one `import { request } from './client'` statement and zero `new fetch(`/`window.fetch`/raw `await fetch(` calls.

- [ ] 5. Checkpoint — Phase 1 closure
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm `web_controller.py` ≤200 lines, route inventory matches `api_routes_documentation.md`, and `client/src/services/api/` is populated. Record Phase 1 closure in `docs/phase-status.md`.

- [ ] 6. Phase 2 — RBAC enforcement on routes and Admin_UI page guards
  - [ ] 6.1 Define authoritative `ROLE_PERMISSIONS` map in `middleware.py`
    - Map every admin role in `Admin_Role_Set` to its allowed permission categories (drawn from the existing audit-spec category list, e.g., `users`, `machines`, `rewards`, `locations`, `logs`, `analytics`, `settings`, `groups`, `sessions`, `leaderboard`, `dashboard`).
    - Confirm `user` and `dependent` are absent from the map (per Phase 0).
    - _Requirements: 2.1, 2.9_

  - [ ] 6.2 Substitute `@permission_required(...)` for every `@admin_required` across Domain_Controllers
    - For every route in `dashboard|users|locations|machines|rewards|logs|leaderboard|groups|analytics|settings|sessions` controllers, replace bare `@admin_required` with `@permission_required(<category>)` using the matching category from 6.1. `@token_required` MUST sit immediately above `@permission_required`.
    - Leave `@admin_required` intact only on `auth_controller.py` admin-info routes and the public health route.
    - _Requirements: 2.1, 2.2, 2.12_

  - [ ] 6.3 Extend `GET /api/web/auth/me` to return `role` and `permission_categories`
    - Compute `permission_categories = sorted(ROLE_PERMISSIONS.get(user.role, []))` and add it to the response body alongside `role`.
    - _Requirements: 2.3_

  - [ ] 6.4 Implement `RequirePermission` guard in `client/src/components/admin/RequirePermission.jsx`
    - Read `user` from `AuthContext`.
    - If `user.role ∈ {user, dependent}` redirect to `/rewards` via `useEffect` + `router.replace`.
    - Else if `category ∉ user.permission_categories` redirect to `/admin`.
    - Else render `children`.
    - _Requirements: 2.3, 2.4_

  - [ ] 6.5 Wrap every `client/app/admin/**/page.js` with `RequirePermission`
    - Each admin page passes the matching category prop (e.g., `<RequirePermission category="users">…`).
    - Cover: `analytics`, `bulk-sessions`, `leaderboards`, `locations`, `logs/access`, `logs/bottles`, `logs/machines`, `logs/rewards`, `logs/transactions`, `machines`, `rewards`, `settings`, `users`, `users/permissions`, `profile`.
    - _Requirements: 2.4, 2.11_

  - [ ] 6.6 Filter Admin_UI sidebar links by `permission_categories`
    - Update `client/src/components/admin/Sidebar.jsx` to read `permission_categories` from `AuthContext` and hide every link whose required category is absent.
    - _Requirements: 2.5_

  - [ ] 6.7 Enforce Role_Hierarchy on user-create and user-update controllers
    - Add `level()` helper based on `ROLE_HIERARCHY` to `_shared.py`. In `users_controller.create_user` and `users_controller.update_user`, if the actor would set the target's role to `R_target` where `level(R_target) >= level(R_actor)`, return HTTP 403 with `{ error: { code: "ROLE_HIERARCHY_VIOLATION", actor_role, target_role } }` and do NOT mutate the row.
    - _Requirements: 2.6, 2.7, 4H.30, 4H.31_

  - [ ] 6.8 Add `log_action()` helper to `_shared.py` and wire it into mutating handlers
    - Signature: `log_action(actor, action, target=None, before=None, after=None, category=None, notes=None)`. Writes one `AdminLog` row with `actor_user_id`, `target`, `action`, `before_json`, `after_json`, `ip`, `user_agent`, ISO-8601 `created_at`.
    - Call it from every successful mutating handler that touches users, role assignments, permissions, force-logout, API key rotation, settings; also call it on every 403 caused by Property G or Property I.
    - _Requirements: 2.8, 7.2, 7.3_

  - [ ]* 6.9 Write property test for admin granularity enforcement
    - **Property G: Admin granularity enforcement**
    - **Validates: Requirements 2.1, 2.2, 2.9**
    - File: `server/tests/property/test_phase2_granularity.py`.
    - For every `(admin_role X, category C)` such that `C ∉ ROLE_PERMISSIONS[X]`, mint a JWT for X and call any route requiring C; assert HTTP 403 and `error.code == "FORBIDDEN"` and `error.missing == C`.

  - [ ]* 6.10 Write property test for Admin_UI page guard completeness
    - **Property H: Admin_UI page guard completeness**
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.11**
    - File: `client/tests/property/page-guards.test.js` (Vitest + fast-check).
    - For every `(page P, role X)` quartet, mock `AuthContext` and assert: protected content renders iff `X ∈ Admin_Role_Set ∧ category(P) ∈ permission_categories(X)`; otherwise `router.replace` was called with `/rewards` for `{user, dependent}` else `/admin`.

  - [ ]* 6.11 Write property test for audit log completeness
    - **Property J: Audit log completeness and shape**
    - **Validates: Requirements 2.8, 7.2, 7.3, 7.10**
    - File: `server/tests/property/test_audit_completeness.py`.
    - For every successful mutating user/role/permission/security request and for every 403 from Properties G or I, assert exactly one new `AdminLog` row exists with `actor.user_id` matching the JWT subject, non-null `action`, non-null `before_json`/`after_json`, IP, user-agent, ISO-8601 `created_at`.

- [ ] 7. Checkpoint — Phase 2 closure
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm zero bare `@admin_required` outside `auth_controller.py` and the public health route. Record Phase 2 closure in `docs/phase-status.md`.

- [ ] 8. Phase 3 — Align Server JSON shapes with Admin_UI fields
  - [ ] 8.1 Author `docs/model-ui-alignment.md`
    - One row per page in `{analytics, bulk-sessions, leaderboards, locations, logs/access, logs/bottles, logs/machines, logs/rewards, logs/transactions, machines, rewards, settings, users, users/permissions, profile}`.
    - Columns: page, GET endpoint, fields the page reads, fields the endpoint returns, type per field, resolution (rename serializer key | add derived field | render empty-state).
    - _Requirements: 3.9_

  - [ ] 8.2 Update serializers in `server/app/controllers/_shared.py` per the alignment doc
    - Rename keys, add derived fields, and ensure every page's GET endpoint returns a superset of the fields its UI renders.
    - Enums (`user.role`, `machine.status`, `reward_redemption.status`) returned as canonical lowercase strings.
    - _Requirements: 3.1, 3.3, 3.6_

  - [ ] 8.3 Update Admin_UI pages to use exact field names with empty-state fallbacks
    - Every Admin_UI page reads server response keys verbatim (no client-side renaming).
    - Add a single shared label map in `client/src/lib/enumLabels.js` for enum rendering.
    - When a referenced field is missing/null, render a defined placeholder (e.g., `—`) instead of literal `undefined`/`null`.
    - _Requirements: 3.3, 3.4, 3.6_

  - [ ] 8.4 Document typed JSON schemas for every aligned endpoint in `api_routes_documentation.md`
    - For each endpoint listed in 3.1, document the response schema with field types in `{string, integer, number, boolean, iso8601_datetime, enum<…>, array<…>, object}`.
    - _Requirements: 3.5_

  - [ ]* 8.5 Write property test for page–field coverage
    - **Property K: Page–field coverage**
    - **Validates: Requirements 3.1, 3.3, 3.7**
    - File: `client/tests/property/page-field-coverage.test.js`.
    - Parse each Admin_UI page's source for the fields it reads off the API response; intersect with the JSON schema declared for the corresponding endpoint in `api_routes_documentation.md`; fail when a page-read field is absent from the endpoint's schema.

  - [ ]* 8.6 Write property test for strict-acceptance on mutating endpoints
    - **Property L: Strict-acceptance on mutating endpoints**
    - **Validates: Requirements 3.2, 3.8, 4E.25**
    - File: `server/tests/property/test_strict_acceptance.py`.
    - Use `unknown_keys()` strategy to inject one extra key per request body to every POST/PUT/PATCH endpoint; assert HTTP 400, `error.code ∈ {"VALIDATION_ERROR", "UNKNOWN_FIELD"}`, and the response names the offending key.

- [ ] 9. Checkpoint — Phase 3 closure
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm `docs/model-ui-alignment.md` is committed and every page renders without `undefined` placeholders. Record Phase 3 closure in `docs/phase-status.md`.

- [ ] 10. Phase 4A — RPI Authentication, HMAC QR, and Hardware Contract
  - [ ] 10.1 Create Flask-Migrate revision `phase4a_rpi_auth`
    - File: `server/migrations/versions/phase4a_rpi_auth.py`.
    - `upgrade()` adds `rvms.api_key_hash` (`String(255)`, nullable) and `organizations.qr_hmac_secret_enc` (`LargeBinary`, nullable). `downgrade()` drops both.
    - _Requirements: 4A.1, 4A.4, 7.8, 7.11_

  - [ ] 10.2 Update `RVM` model with `api_key_hash` and `verify_api_key`
    - Add column `api_key_hash`. Add method `verify_api_key(plaintext) -> bool` using `bcrypt.checkpw` with constant-time semantics.
    - _Requirements: 4A.1, 4A.2_

  - [ ] 10.3 Update `Organization` model with `qr_hmac_secret_enc` and `get_qr_hmac_secret`
    - Add column `qr_hmac_secret_enc`. Implement `_fernet()` helper (Fernet keyed by SECRET_KEY-derived material) and `Organization.get_qr_hmac_secret() -> bytes`.
    - _Requirements: 4A.4_

  - [ ] 10.4 Implement RVM provisioning flow (server-side key generation)
    - Add a Flask CLI command or admin endpoint `POST /api/web/machines/<id>/rotate-api-key` that generates a random API key, prints plaintext to the operator console exactly once, stores BCrypt hash in `api_key_hash`, and writes one `AdminLog` row via `log_action()`.
    - _Requirements: 4A.1, 7.2_

  - [ ] 10.5 Implement `@rpi_auth_required` decorator in `middleware.py`
    - Resolve `machineUuid` from request body (or path) → look up `RVM` → constant-time compare `X-API-Key` header against `api_key_hash`.
    - On failure return HTTP 401 `{ error: { code: "RPI_AUTH_INVALID" } }`. On unknown machine return HTTP 404 `{ error: { code: "RPI_MACHINE_UNKNOWN", machineUuid } }`. Inject the resolved RVM into the wrapped handler.
    - _Requirements: 4A.2, 4A.3_

  - [ ] 10.6 Apply `@rpi_auth_required` to every route in `rpi_controller.py`
    - Decorate every route under `/api/rpi/*`; the only exception is an optional `/api/rpi/health` if it exists.
    - _Requirements: 4A.3, 4A.8_

  - [ ] 10.7 Implement HMAC-suffix validation in `POST /api/rpi/authenticate`
    - Add helper `compute_qr_suffix(secret, display_id) -> str` returning lowercase hex `HMAC-SHA256(secret, display_id)[:6]`.
    - In the handler: schema-validate body → `@rpi_auth_required` resolves RVM → split `qrPayload` on the rightmost `.` into `display_id` + `hmac_suffix` → constant-time compare via `hmac.compare_digest` against `compute_qr_suffix(rvm.organization.get_qr_hmac_secret(), display_id)`. On mismatch return HTTP 401 `{ error: { code: "QR_HMAC_INVALID" } }` BEFORE any `User.query` call. Only on success resolve the user by `display_id`.
    - _Requirements: 4A.5, 4A.6_

  - [ ] 10.8 Author `docs/rpi-api-contract.md`
    - Include: full request/response shapes for every `/api/rpi/*` route after hardening; all required headers (including `X-API-Key`); the HMAC_QR_Payload format `<display_id>.<hmac_suffix>` and truncation rule; per-machine API key provisioning flow; per-org HMAC secret provisioning + rotation; error codes (`RPI_AUTH_INVALID`, `QR_HMAC_INVALID`, `RPI_MACHINE_UNKNOWN`, `RPI_RATE_LIMITED`); a ≤30-line Python signed-QR generator example.
    - _Requirements: 4A.7, 4A.10_

  - [ ]* 10.9 Write property test for universal RPI auth
    - **Property M: Universal RPI auth**
    - **Validates: Requirements 4A.2, 4A.3, 4A.8**
    - File: `server/tests/property/test_phase4a_rpi_auth.py`.
    - For every route in `rpi_bp.url_map` other than `/api/rpi/health`, send a request with no `X-API-Key`, an invalid `X-API-Key`, and a valid one. Assert HTTP 401 `RPI_AUTH_INVALID` for the first two cases and HTTP 200 (or domain-appropriate success) for the valid case.

  - [ ]* 10.10 Write property test for HMAC-QR round-trip and short-circuit
    - **Property N: HMAC-QR round-trip and short-circuit**
    - **Validates: Requirements 4A.5, 4A.6, 4A.9**
    - File: `server/tests/property/test_phase4a_hmac_qr.py`.
    - With `display_ids()` and `secrets()` strategies: round-trip (valid suffix → 200 or `USER_NOT_FOUND` from a real lookup), tamper (mutate any hex char of the suffix → 401 `QR_HMAC_INVALID`). For the tamper case, patch `User.query` with a spy and assert zero `.filter_by` calls were made.

- [ ] 11. Phase 4B — JWT in HttpOnly cookie + CSRF
  - [ ] 11.1 Set HttpOnly token cookie and CSRF cookie on successful login
    - In `auth_controller.login` and `auth_controller.verify_otp`, after issuing the JWT also set: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<JWT_EXPIRY_HOURS*3600>` and `Set-Cookie: csrf_token=<urlsafe_token(32)>; Secure; SameSite=Strict; Path=/; Max-Age=<same>`.
    - Keep the legacy `token` field in the response body during transition.
    - _Requirements: 4B.11_

  - [ ] 11.2 Update `@token_required` to read cookie first, fall back to `Authorization: Bearer`
    - Read `request.cookies.get('token')`; if present, validate that. Else, if `AUTH_COOKIE_ONLY != 'true'`, fall back to the `Authorization: Bearer` header. Else reject HTTP 401.
    - Wire `AUTH_COOKIE_ONLY` env var with default `false`.
    - _Requirements: 4B.12_

  - [ ] 11.3 Implement and apply `@csrf_required`
    - Decorator compares `X-CSRF-Token` header to `csrf_token` cookie via `hmac.compare_digest`. Mismatch → HTTP 403 `{ error: { code: "CSRF_INVALID" } }`.
    - Apply automatically inside `@token_required` for unsafe methods `{POST, PUT, PATCH, DELETE}`.
    - _Requirements: 4B.13, 4B.14, 7.6_

  - [ ] 11.4 Add `X-CSRF-Token` to CORS allowed headers
    - In `server/app/__init__.py`, add `X-CSRF-Token` to `CORS(..., allow_headers=[...])`. Keep `supports_credentials=True`.
    - _Requirements: 4B.15_

  - [ ] 11.5 Stop using `localStorage` for the JWT in the Client
    - Remove all `localStorage.{getItem,setItem,removeItem}('ecopoints_token', ...)` calls from `client/app/**` and `client/src/**` (excluding tests/`*.example`).
    - Update `client/src/contexts/AuthContext.js` (or equivalent) to drop in-memory `token` and rely on the HttpOnly cookie.
    - _Requirements: 4B.16_

  - [ ] 11.6 Read `csrf_token` cookie and attach `X-CSRF-Token` on state-changing requests
    - In `client/src/services/api/client.js`, on every `request()` whose method ∈ `{POST, PUT, PATCH, DELETE}`, read `document.cookie` for `csrf_token` and attach the `X-CSRF-Token` header.
    - On 401 responses, `AuthContext` clears the in-memory user and triggers a redirect to the landing page.
    - _Requirements: 4B.16, 7.6_

  - [ ]* 11.7 Write property test for cookie + CSRF transport
    - **Property O: Cookie + CSRF transport**
    - **Validates: Requirements 4B.11, 4B.13, 4B.14, 7.6**
    - File: `server/tests/property/test_phase4b_cookie_csrf.py`.
    - Login → assert both `Set-Cookie` headers present with correct flags. For unsafe methods, vary `(header_present, cookie_present, header_value, cookie_value)`; assert 200 only when header byte-equals cookie, else 403 `CSRF_INVALID`.

  - [ ]* 11.8 Write property test for cookie-vs-Bearer transition behavior
    - **Property P: Cookie-vs-Bearer transition behavior**
    - **Validates: Requirements 4B.12**
    - File: `server/tests/property/test_phase4b_transition.py`.
    - Enumerate `(C, H, F)` ∈ `{T, F}^3`; assert middleware resolves token from cookie when `C=T`, else from header when `H=T ∧ F=F`, else HTTP 401.

  - [ ]* 11.9 Write static test for JWT-not-in-localStorage invariant
    - **Property Q: No JWT in localStorage**
    - **Validates: Requirements 4B.16**
    - File: `client/tests/static/no-jwt-in-localstorage.test.js`.
    - Walk every file under `client/` excluding `__tests__/` and `*.example`; fail if any file calls `localStorage.{getItem,setItem,removeItem}` with a JWT key (`'ecopoints_token'` or any equivalent).

- [ ] 12. Phase 4C — Force-logout invariant
  - [ ] 12.1 Create Flask-Migrate revision `phase4c_force_logout`
    - File: `server/migrations/versions/phase4c_force_logout.py`.
    - `upgrade()` adds `organizations.force_logout_at` (`DateTime(timezone=True)`, nullable). `downgrade()` drops it.
    - _Requirements: 4C.17, 7.8, 7.11_

  - [ ] 12.2 Update `Organization` model with `force_logout_at`
    - Add the column to the SQLAlchemy model.
    - _Requirements: 4C.17_

  - [ ] 12.3 Implement `POST /api/web/settings/security/force-logout`
    - In `settings_controller.py`, handler stack: `@token_required` → `@permission_required('settings')` → `@csrf_required` → `@validate_request(ForceLogoutSchema)` (empty body schema with `extra='forbid'`).
    - Set `actor.community_group.organization.force_logout_at = datetime.utcnow()`. Commit. Call `log_action(actor, 'force_logout', target=organization, before={...}, after={...})`.
    - _Requirements: 4C.18, 7.2_

  - [ ] 12.4 Reject JWTs older than `force_logout_at` in `@token_required`
    - After successfully decoding, look up the user's `community_group.organization.force_logout_at` (using existing `get_user_org_id` helper). If `payload['iat'] < force_logout_at` (Unix epoch seconds), return HTTP 401 `{ error: { code: "FORCED_LOGOUT", force_logout_at } }`.
    - _Requirements: 4C.19_

  - [ ]* 12.5 Write property test for forced-logout invariant
    - **Property R: Forced-logout invariant**
    - **Validates: Requirements 4C.18, 4C.19, 4C.20**
    - File: `server/tests/property/test_phase4c_force_logout.py`.
    - For arbitrary `(jwt_iat, force_logout_at)` pairs, assert: `iat < force_logout_at` ⇒ HTTP 401 `FORCED_LOGOUT`; `iat >= force_logout_at` ⇒ 200. Also assert that a successful force-logout call sets `force_logout_at` within ±5 s of `NOW()` and writes exactly one `AdminLog` row.

- [ ] 13. Phase 4D — Security headers at the nginx edge
  - [ ] 13.1 Add Security_Headers to `nginx/default.conf`
    - In the server block, add: `X-Content-Type-Options "nosniff" always;`, `X-Frame-Options "DENY" always;`, `Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`, `Referrer-Policy "strict-origin-when-cross-origin" always;`.
    - Add `Content-Security-Policy-Report-Only "default-src 'self'; …" always;` initially (per Requirement 4D.22).
    - _Requirements: 4D.21, 4D.22_

  - [ ]* 13.2 Write integration test asserting headers are present on responses
    - File: `server/tests/integration/test_security_headers.py` (run via docker-compose).
    - Issue a request through nginx and assert every header in Security_Headers is present with the expected value.
    - _Validates: Requirements 4D.21_

- [ ] 14. Phase 4E — Schema-validated input on every mutating route
  - [ ] 14.1 Create `server/app/schemas/__init__.py` with one Pydantic v2 schema per request body
    - Cover every POST/PUT/PATCH route across `auth_controller`, every Domain_Controller, and `rpi_controller`.
    - Every schema sets `model_config = ConfigDict(extra='forbid', strict=True)`.
    - _Requirements: 4E.23_

  - [ ] 14.2 Implement `@validate_request(Schema)` decorator in `middleware.py`
    - Calls `Schema.model_validate_json(request.data)`. On Pydantic `extra='forbid'` violation → HTTP 400 `{ error: { code: "UNKNOWN_FIELD", field: <name>, errors: [...] } }`. On other validation errors → HTTP 400 `{ error: { code: "VALIDATION_ERROR", errors: [{field, message}, ...] } }`. On success, pass parsed model as kwarg `payload=...`.
    - _Requirements: 4E.24, 4E.25_

  - [ ] 14.3 Apply `@validate_request` to every POST/PUT/PATCH handler in every controller
    - Stack order: `@token_required` → `@permission_required(...)` (or `@rpi_auth_required` for RPI routes) → `@csrf_required` (web only) → `@validate_request(Schema)`. Handler signature accepts `payload` kwarg.
    - _Requirements: 4E.23_

  - [ ]* 14.4 Write property test for schema validation completeness
    - **Property S: Schema validation completeness**
    - **Validates: Requirements 4E.23, 4E.24**
    - File: `server/tests/property/test_phase4e_validation.py`.
    - For every POST/PUT/PATCH route, assert the wrapped function has a `@validate_request(...)` decorator with a Schema whose `model_config.extra == 'forbid'`. For arbitrary invalid payloads (missing required, wrong type), assert HTTP 400 with `error.code == "VALIDATION_ERROR"` and `error.errors` matches `[{field, message}, ...]`.

- [ ] 15. Phase 4F — Email HTML escape
  - [ ] 15.1 Wrap every user-supplied interpolation in `notification_service._build_email_html` with `html.escape(..., quote=True)`
    - Identify every f-string interpolation in `server/app/services/notification_service.py` that takes attacker-controllable input (subjects, body fragments, org names, machine names, reward names, user names) and replace each with `escape(...)`.
    - _Requirements: 4F.26_

  - [ ]* 15.2 Write property test for email output escaping
    - **Property T: Email HTML escape**
    - **Validates: Requirements 4F.26, 4F.27**
    - File: `server/tests/property/test_phase4f_email_escape.py`.
    - For every interpolation point, render the template with each of `<script>alert(1)</script>`, `"`, `'`, `<`, `>`, `&`; assert the literal `<` does not appear in the output and that `html.escape(S, quote=True)` is contained verbatim.

- [ ] 16. Phase 4G — Password policy on admin-created users
  - [ ] 16.1 Extract `validate_password_policy(password)` into a shared module
    - File: `server/app/services/password_policy.py`.
    - Single function used by both public registration and admin user-create. Policy: length ≥8, ≥1 uppercase, ≥1 lowercase, ≥1 digit. Returns `(is_valid: bool, message: str)`.
    - _Requirements: 4G.28_

  - [ ] 16.2 Apply `validate_password_policy` in `users_controller.create_user`
    - Call before any DB write; on failure return HTTP 400 `{ error: { code: "WEAK_PASSWORD", policy: <message> } }`.
    - _Requirements: 4G.28, 4G.29_

  - [ ]* 16.3 Write property test for password policy on admin-create
    - **Property U: Password policy on admin-create**
    - **Validates: Requirements 4G.28, 4G.29**
    - File: `server/tests/property/test_phase4g_password_policy.py`.
    - With `passwords_violating_policy()` strategy: assert HTTP 400 `WEAK_PASSWORD` and that `users` row count is unchanged. With `passwords_satisfying_policy()`: assert 201 and one new row.

- [ ] 17. Phase 4H — Role-Hierarchy on PUT user
  - [ ] 17.1 Extend hierarchy enforcement to `PUT /api/web/users/<id>`
    - Reuse the helper from 6.7. In `users_controller.update_user`, before applying any update, if the request would set `role` to `R_target` where `level(R_target) >= level(R_actor)`, return HTTP 403 `{ error: { code: "ROLE_HIERARCHY_VIOLATION", actor_role, target_role } }` regardless of which other fields are also being updated. The target row MUST be byte-identical before and after the rejected request.
    - Call `log_action()` for the rejected attempt.
    - _Requirements: 4H.30, 4H.31_

  - [ ]* 17.2 Write property test for hierarchy on update
    - **Property I: Role-hierarchy on mutation (update variant)**
    - **Validates: Requirements 2.6, 2.7, 4H.30, 4H.31**
    - File: `server/tests/property/test_phase4h_hierarchy_update.py`.
    - For every `(actor_role, target_role)` pair where `level(target) >= level(actor)`, assert PUT returns 403 `ROLE_HIERARCHY_VIOLATION` and the target row is unchanged. Do this for both `op = create` (covering 2.6/2.7) and `op = update` (covering 4H.30/4H.31).

- [ ] 18. Phase 4I — Token blacklist cleanup job
  - [ ] 18.1 Implement `flask cleanup-tokens` CLI command
    - File: `server/app/seeder/cleanup.py` (or similar) registered in `server/app/__init__.py` via `app.cli.add_command`.
    - Deletes rows from `token_blacklist` where `expires_at < datetime.utcnow()`. Logs `deleted=<int> duration_s=<float>` on every run.
    - _Requirements: 4I.32, 4I.33_

  - [ ] 18.2 Document the schedule in `server/README.md`
    - Add a section showing the cron / Render Cron Job invocation that runs `flask cleanup-tokens` at least once per 24 hours.
    - _Requirements: 4I.34_

  - [ ]* 18.3 Write property test for bounded token blacklist
    - **Property V: Bounded token blacklist**
    - **Validates: Requirements 4I.32, 4I.33, 4I.35**
    - File: `server/tests/property/test_phase4i_cleanup.py`.
    - Seed `token_blacklist` with arbitrary `(expires_at)` values (some in the past >1 day, some current); invoke the CLI command via `runner.invoke(cleanup_tokens)`; assert every row with `expires_at < NOW() - 1 day` is gone and the log line contains both `deleted=` and `duration_s=`.

- [ ] 19. Checkpoint — Phase 4 closure
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm `docs/rpi-api-contract.md` is committed, no plaintext JWT lives in `localStorage`, every mutating route is schema-validated, and the cleanup job has run successfully at least once. Record Phase 4 closure in `docs/phase-status.md`.

- [ ] 20. Phase 5 — Deterministic seed and login redirects
  - [ ] 20.1 Rewrite `server/app/seeder/seed.py` to satisfy the deterministic seed contract
    - Create exactly one `OrgType` ("University"), one `Organization` (`name="EcoPoints Test University"`, `abbreviation="EPTU"`), one `CommunityGroup`, one provisioned `RVM` (generate API key, print plaintext to stdout once, store BCrypt hash, seed `qr_hmac_secret_enc`), one `Reward`.
    - Create one `User` per role in `{superadmin, head_admin, auditor, technician, inventory_officer, user, dependent}` with email `<role>@ecopoints.local`, role `<role>`, `is_active=True`.
    - Password: `os.environ.get('SEED_PASSWORD', 'SeedPass!23')` validated with `validate_password_policy()` BEFORE any row is written; on failure exit non-zero with no rows touched.
    - Idempotency: upsert by deterministic natural keys (org name, email, machine_uuid). Re-run is a no-op for row counts and primary keys.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 20.2 Implement role-based post-login redirect in `LogIn.jsx`
    - In the modal component (likely `client/src/components/pages/LogIn.jsx`), after a successful `auth.login()` resolution, branch on `user.role`:
      - `ADMIN_ROLES.has(role)` → `router.push('/admin')`
      - `role === 'user' || role === 'dependent'` → `router.push('/rewards')`
    - Never redirect to `/profile` from this branch.
    - Confirm `client/app/login/page.js` remains a thin redirect to `/?login=true` and contains no post-login redirect logic.
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11_

  - [ ]* 20.3 Write property test for deterministic seed
    - **Property W: Deterministic seed**
    - **Validates: Requirements 5.1, 5.2, 5.5, 5.14**
    - File: `server/tests/property/test_phase5_seed.py`.
    - For arbitrary starting DB states (empty, partially seeded, fully seeded), invoke `seed.py` and assert post-state contains exactly one Organization, one CommunityGroup, one RVM (with non-null `api_key_hash`), one Reward, and exactly one User per role with the deterministic email/role/`is_active` contract. Run twice consecutively and assert byte-identical row counts and primary keys.

  - [ ]* 20.4 Write property test for seed password policy
    - **Property X: Seed password policy**
    - **Validates: Requirements 5.3, 5.4**
    - File: `server/tests/property/test_phase5_seed_password.py`.
    - For arbitrary `SEED_PASSWORD` values, assert: violating policy ⇒ script exits non-zero AND `users` table row count is unchanged from pre-run state; satisfying policy ⇒ script exits 0 AND seeded users have hashes that verify against the supplied password.

  - [ ]* 20.5 Write property test for login redirect
    - **Property Y: Login redirect**
    - **Validates: Requirements 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13**
    - File: `client/tests/property/login-redirect.test.js` (Vitest + fast-check).
    - For every role R, mount `LogIn.jsx` with a mocked `auth.login()` resolving to `{ user: { role: R } }` and a mocked `router`; assert `router.push` is called with `/admin` iff `R ∈ Admin_Role_Set` else `/rewards`. Assert it is NEVER called with `/profile` for any role.

- [ ] 21. Cross-phase non-functional verification
  - [ ] 21.1 Add startup-time secret-presence check in `server/app/__init__.py`
    - When `FLASK_ENV == 'production'`, refuse to start if any of `{SECRET_KEY, DATABASE_URL, qr_hmac_secret_ref, SMTP password, SMS provider key}` is missing or equals a known development default. Log the missing variable name (NEVER its value) and exit non-zero.
    - _Requirements: 7.5_

  - [ ] 21.2 Initialize and maintain `docs/phase-status.md`
    - Schema: one row per phase with columns `{phase_number, name, status, exit_criteria_met_at, evidence_links}`. Phase numbers ∈ `{0..5}`, status ∈ `{not_started, in_progress, closed}`. Row order matches the canonical phase ordering.
    - _Requirements: 6.4, 6.5_

  - [ ]* 21.3 Write static-scan property test for secret hygiene
    - **Property Z: Secret hygiene**
    - **Validates: Requirements 7.4, 7.9**
    - File: `tools/tests/test_secret_hygiene.py`.
    - Walk every file under `server/`, `client/`, `nginx/` excluding `*.example`; fail if any matches the patterns `SECRET_KEY\s*=\s*['"]dev['"]`, hardcoded BCrypt salts, hardcoded API keys, hardcoded SMTP credentials, hardcoded SMS provider tokens, or hardcoded per-org HMAC secrets.

  - [ ]* 21.4 Write property test for production secret refusal
    - **Property AA: Production secret refusal**
    - **Validates: Requirements 7.5**
    - File: `server/tests/property/test_production_secret_refusal.py`.
    - Set `FLASK_ENV=production` and unset (or default) each required secret in turn; assert app startup fails non-zero AND the log message contains the variable name AND does NOT contain its value.

  - [ ]* 21.5 Write integration test for migration reversibility
    - **Property BB: Migration reversibility**
    - **Validates: Requirements 7.8, 7.11**
    - File: `server/tests/integration/test_migration_reversibility.py`.
    - For every revision in `phases 0..5` (including `phase4a_rpi_auth` and `phase4c_force_logout`), against a Postgres test DB (Supabase staging or local CI Postgres): snapshot schema → `flask db upgrade` → `flask db downgrade -1` → snapshot schema → assert byte-identical column lists, constraints, and indexes.

- [ ] 22. Final checkpoint — Program closure
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm every phase row in `docs/phase-status.md` is `closed`, every property test (A–CC) has at least one passing run on CI, and `api_routes_documentation.md` reflects the post-hardened surface.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; core implementation tasks must always be implemented.
- Each task references the granular requirement clauses it satisfies (e.g., `4A.5` for the HMAC-suffix verification clause), and each property-test task explicitly names the property letter (A–CC) from the design document.
- Phases are strictly ordered by `Requirement 6` — a later phase MUST NOT begin until the previous phase's checkpoint task is complete and `docs/phase-status.md` reflects closure.
- Property-based tests use Hypothesis (Server) and fast-check (Client) at minimum 100 iterations each (`max_examples=200` / `numRuns=200` in this plan).
- Migrations (Phase 4A, Phase 4C) ship with both `upgrade` and `downgrade`, exercised against Postgres before merge per Requirement 7.8 / 7.11 (Property BB).
- Audit completeness (Property J / Requirement 7.10) is a continuous invariant: every mutating handler under Phase 2 onwards calls `log_action()` from `_shared.py`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "4.2"] },
    { "id": 2, "tasks": ["1.4", "4.3"] },
    { "id": 3, "tasks": ["1.5", "1.6", "4.4"] },
    { "id": 4, "tasks": ["3.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12"] },
    { "id": 6, "tasks": ["3.13"] },
    { "id": 7, "tasks": ["3.14"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 10, "tasks": ["6.5", "6.6", "6.7", "6.8"] },
    { "id": 11, "tasks": ["6.9", "6.10", "6.11"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 14, "tasks": ["8.5", "8.6"] },
    { "id": 15, "tasks": ["10.1"] },
    { "id": 16, "tasks": ["10.2", "10.3"] },
    { "id": 17, "tasks": ["10.4", "10.5"] },
    { "id": 18, "tasks": ["10.6", "10.7", "10.8"] },
    { "id": 19, "tasks": ["10.9", "10.10"] },
    { "id": 20, "tasks": ["11.1", "11.2", "11.4"] },
    { "id": 21, "tasks": ["11.3", "11.5"] },
    { "id": 22, "tasks": ["11.6"] },
    { "id": 23, "tasks": ["11.7", "11.8", "11.9"] },
    { "id": 24, "tasks": ["12.1"] },
    { "id": 25, "tasks": ["12.2"] },
    { "id": 26, "tasks": ["12.3", "12.4"] },
    { "id": 27, "tasks": ["12.5"] },
    { "id": 28, "tasks": ["13.1"] },
    { "id": 29, "tasks": ["13.2"] },
    { "id": 30, "tasks": ["14.1", "14.2"] },
    { "id": 31, "tasks": ["14.3"] },
    { "id": 32, "tasks": ["14.4", "15.1", "16.1"] },
    { "id": 33, "tasks": ["15.2", "16.2", "17.1", "18.1"] },
    { "id": 34, "tasks": ["16.3", "17.2", "18.2", "18.3"] },
    { "id": 35, "tasks": ["20.1", "20.2", "21.1", "21.2"] },
    { "id": 36, "tasks": ["20.3", "20.4", "20.5", "21.3", "21.4", "21.5"] }
  ]
}
```
