# Implementation Plan: Admin Dashboard Fixes

## Overview

Implementation plan for the admin dashboard fixes. Parts 1–6 and the website-polishing/ERD-relocation sections capture completed phase work. The "Admin CRUD Bug Fixes (C1–C6)" section (tasks 39–55) follows the exploratory bugfix workflow — exploration + preservation tests first, then fixes, then re-run the same tests — covering the six active bug conditions: C1 Add Machine, C2 Edit Machine, C3 Maintenance log, C4 search crash / `getLocationName` TDZ, C5 All-locations user filter, C6 Add User bad request. See the Task Dependency Graph for execution waves.

## Tasks

- [x] 1. Phase 1 — Field Validation Hardening
  - [x] 1.1 Extend `validateField.js` to reject whitespace-only values on all `required` fields
  - [x] 1.2 Add `.trim()` to all text field values before validation and submission across all admin modals
  - [x] 1.3 Audit & apply validation to `locations/page.js` Add/Edit Location modals
  - [x] 1.4 Audit & apply validation to `machines/page.js` Add/Edit Machine modals — upgraded to `validateAll`
  - [x] 1.5 Audit & apply validation to `rewards/page.js` — already uses `validateAll`
  - [x] 1.6 Audit & apply validation to `AddUserModal.jsx` / `AddRegularUserModal.jsx` — added username validation, upgraded to shared rules
  - [x] 1.7 ERD alignment: username required, maxLength 200/500 for org names/addresses

- [x] 2. Phase 2 — Data Fetching Performance (Redis Caching — Admin)
  - [x] 2.1 Add `redis>=5.0.0` dependency to `server/requirements.txt`
  - [x] 2.2 Create Redis cache module (`server/app/cache.py`) with get/set/invalidate/decorator
  - [x] 2.3 Add cache layer to `GET /api/web/dashboard/stats` (TTL: 60s)
  - [x] 2.4 Add cache layer to `GET /api/web/leaderboard` (TTL: 300s)
  - [x] 2.5 Add cache layer to `GET /api/web/analytics` (TTL: 120s)
  - [x] 2.6 Add cache invalidation on mutation endpoints
  - [x] 2.7 Graceful fallback when Redis unavailable (all ops silently no-op)
  - [x] 2.8 Client-side: DashboardCacheContext persists data across admin navigation (60s staleness)
  - [x] 2.9 Added REDIS_URL to .env with documentation
  - [x] 2.10 Redis deployed and connected on Render ✅

- [x] 3. Phase 3 — Dashboard Menu Fixes
  - [x] 3.1 Charts render from bottle logs — empty if no data (expected for fresh deploys)
  - [x] 3.2 Dashboard data persists across navigation via DashboardCacheContext
  - [x] 3.3 Added refresh button with spinning RefreshCw icon
  - [x] 3.4 Charts use real API data — no mock data

- [x] 4. Phase 4 — Locations Menu: Org Type & Modal Alignment
  - [x] 4.1 Added user-visible error feedback on org type create/delete failure
  - [x] 4.2 POST /api/web/org-types endpoint verified
  - [x] 4.3 Dropdown refreshes immediately after creating new org type
  - [x] 4.4 Fields aligned to ERD via validation rules

- [x] 5. Phase 5 — Machines Menu: Cleanup
  - [x] 5.1 Remove "Add" button next to Area Placement
  - [x] 5.2 Remove all associated handler/functionality
  - [x] 5.3 Area Placement → plain text input (ERD: `RVMS.location_name`)
  - [x] 5.4 Upgraded both modals to use `validateAll`

- [x] 6. Phase 6 — ERD/Model Alignment Audit (Logs + Users)
  - [x] 6.1 Bottle Logs: Removed ghost columns (Size, Condition, Brand) — no backing model columns
  - [x] 6.2 Bottle Logs: Added Detected Class (`detectedClass`) and Confidence (`confidenceScore`) — real model fields
  - [x] 6.3 Bottle Logs: Fixed filters (removed Condition/Size filters, added Detected Class filter)
  - [x] 6.4 Bottle Logs: Fixed CSV export (removed Brand/Volume/Size/Condition, added Detected Class/Confidence)
  - [x] 6.5 Bottle Logs: Added `detectedClassLabel()` to `enumLabels.js` for YOLO class name mapping
  - [x] 6.6 Transaction Logs: Removed Description column (no `description` column in Transaction model)
  - [x] 6.7 Transaction Logs: Fixed CSV export (removed Description)
  - [x] 6.8 Users: Removed Strand column (`yearLevel` doesn't exist in User model)
  - [x] 6.9 Users: Removed Account Health column (duplicate of Status/isActive)
  - [x] 6.10 Users: Removed `yearLevel` from Edit User modal and form payload
  - [x] 6.11 Machine Logs: ✅ Already aligned
  - [x] 6.12 Access Logs: ✅ Already aligned
  - [x] 6.13 Reward Logs: ✅ Already aligned

- [ ] 7. Phase 7 — Redis Caching for User-Facing Pages (Performance Optimization)
  - [ ] 7.1 Rewards catalog — `GET /api/web/rewards` (TTL: 120s)
  - [ ] 7.2 User list — `GET /api/web/users` (TTL: 120s)
  - [ ] 7.3 Machine list — `GET /api/web/machines` (TTL: 120s)
  - [ ] 7.4 Bottle logs — `GET /api/web/logs/bottles` (TTL: 60s)
  - [ ] 7.5 Add cache invalidation to rewards/users/machines mutation endpoints
  - [ ] 7.6 Add in-memory dict fallback tier to `cache.py`

- [ ] 8. Phase 8 — Comprehensive Audit & Connected Fixes
  - [ ] 8.1 Audit all admin modals for field-to-ERD alignment
  - [ ] 8.2 Audit all admin data tables for correct column-to-API key mapping
  - [ ] 8.3 Audit all admin forms for consistent use of shared `validateField.js`
  - [ ] 8.4 Audit Edit modals for correct pre-population from API response data
  - [ ] 8.5 Document and fix any additional bugs found during audit

- [x] 9. Deployment Verification
  - [x] 9.1 Client build passes ✅
  - [x] 9.2 Redis deployed and connected on Render ✅
  - [ ] 9.3 Backend smoke tests pass
  - [ ] 9.4 Trigger Cloudflare Pages rebuild
  - [ ] 9.5 Manual walkthrough of all admin + user pages

---

## Part 2 Tasks

- [x] 10. Phase 10 — Location Modal: Community Groups + Org Type Edit
  - [x] 10.1 Backend: extend `LocationCreateSchema` to accept `communityGroups` array
  - [x] 10.2 Backend: bulk-create `CommunityGroup` rows inside `POST /locations`
  - [x] 10.3 Frontend: community groups inline table in Add Location modal (name, abbreviation, groupType)
  - [x] 10.4 Backend: `PUT /org-types/<id>` endpoint for renaming
  - [x] 10.5 Frontend: edit (pencil) + delete (trash) buttons on org type dropdown items — both Add and Edit Location modals
  - [x] 10.6 Frontend API: added `updateOrgType(id, name)` to `locations.js`

- [x] 11. Phase 11 — User Modal: Cascading Fields
  - [x] 11.1 Backend: added `educational_level`, `year_level` columns to `User` model
  - [x] 11.2 Backend: expanded `user_type` enum to include `alumni`
  - [x] 11.3 Backend: schemas and users CRUD accept/return `educationalLevel`, `yearLevel`, `communityGroupId`
  - [x] 11.4 Backend: `_serialize_user()` includes new fields
  - [x] 11.5 Frontend: `AddRegularUserModal.jsx` — full rewrite with firstName/middleName/lastName split + cascading OrgType → EducationalLevel → YearLevel → CommunityGroup
  - [ ] 11.6 Frontend: Edit User modal — cascading fields + pre-populate (not yet done)

- [x] 12. Phase 12 — Admin Modal: Name Normalization
  - [x] 12.1 Frontend: `AddUserModal.jsx` — replaced single Full Name field with firstName / middleName / lastName (3-column grid)
  - [x] 12.2 Payload sends separate name parts; avatar initials built from firstName + lastName

- [x] 13. Phase 13 — Reward Categories CRUD
  - [x] 13.1 Backend: new `RewardCategory` model (id, organization_id, name, timestamps)
  - [x] 13.2 Backend: `rewards.category_id` FK → `reward_categories`
  - [x] 13.3 Backend: full CRUD at `/api/web/reward-categories` (GET, POST, PUT/:id, DELETE/:id)
  - [x] 13.4 Backend: schemas — `RewardCategoryCreateSchema`, `RewardCategoryUpdateSchema`
  - [x] 13.5 Frontend API: new `rewardCategories.js` module (getAll, create, update, delete)
  - [x] 13.6 Frontend: `CategorySearchField` in `rewards/page.js` rewired to API — inline edit (pencil) + delete (trashcan) buttons per item
  - [x] 13.7 Database migration applied: `reward_categories` table + `rewards.category_id` + `users.educational_level` + `users.year_level` + `user_type` varchar widened ✅

- [x] 14. Phase 14 — Skeleton Loading
  - [x] 14.1 Created `SkeletonLoaders.jsx` with shared components: `SkeletonCard`, `SkeletonChart`, `SkeletonTable`, `SkeletonTableRow`, `SkeletonRewardCard`, `SkeletonDashboard`
  - [x] 14.2 Dashboard (`admin/page.js`) — stat cards show skeleton while `isDataLoading` and no cached data
  - [ ] 14.3 Other admin pages (users, rewards, locations, etc.) — skeleton loading not yet applied

---

## Part 3 Tasks

- [x] 15.0 Console Error Fix — N+1 bottle logs crash
  - [x] 15.1 Backend: add `joinedload(session→wallet→user)` to `GET /logs/bottles`
  - [x] 15.2 Backend: replace `db.session.get(Wallet)` with `session.wallet` in `_serialize_bottle_log`
  - [x] 15.3 Backend: add `joinedload(rvm→org, performed_by)` to `GET /logs/machines`
  - [x] 15.4 Backend: add `joinedload(admin→community_group→org)` to `GET /logs/access`
  - [x] 15.5 Frontend: fix React hooks order in `AddRegularUserModal.jsx`

- [x] 15. Phase 15 — Bulk Sessions Modal Redesign
  - [x] 15.1 Frontend: redesign modal to two side-by-side panels (Session Info + Items)
  - [x] 15.2 Frontend: add placeholder section for future CSV import on Items panel
  - [x] 15.3 Frontend: manual item add/remove on the Items panel

- [x] 16. Phase 16 — Edit User Modal: Cascading Fields (11.6)
  - [x] 16.1 Frontend: replace `name` with `firstName/middleName/lastName` (3-column grid)
  - [x] 16.2 Frontend: dynamic `userType` dropdown based on org type (`USER_TYPES_BY_ORG`)
  - [x] 16.3 Frontend: cascading Educational Level → Year Level → Community Group (school orgs)
  - [x] 16.4 Frontend: pre-populate all fields from `selectedUser` data
  - [x] 16.5 Frontend: update `saveEdit()` payload with new field names
  - [x] 16.6 Frontend: input validation (required firstName + lastName, valid email)

- [x] 17. Phase 17 — Edit Admin Modal: Name Normalization
  - [x] 17.1 Frontend: replace `Full Name` with `firstName/middleName/lastName` (3-column grid)
  - [x] 17.2 Frontend: update `editFormData` state and `saveEdit()` payload
  - [x] 17.3 Frontend: pre-populate from `selectedUser` (parse name if needed)
  - [x] 17.4 Frontend: avatar initial from `firstName.charAt(0)`

- [x] 18. Phase 18 — Skeleton Loading on All Admin Pages (14.3)
  - [x] 18.1 `admin/users/page.js` — SkeletonTableRow while loading
  - [x] 18.2 `admin/users/permissions/page.js` — SkeletonTableRow while loading
  - [x] 18.3 `admin/rewards/page.js` — SkeletonTableRow while loading
  - [x] 18.4 `admin/machines/page.js` — SkeletonMachineCard while loading
  - [x] 18.5 `admin/locations/page.js` — SkeletonMachineCard grid while loading
  - [x] 18.6 `admin/logs/bottles/page.js` — SkeletonTableRow while loading
  - [x] 18.7 `admin/logs/transactions/page.js` — SkeletonTableRow while loading
  - [x] 18.8 `admin/logs/rewards/page.js` — SkeletonTableRow while loading
  - [x] 18.9 `admin/logs/machines/page.js` — SkeletonTableRow while loading
  - [x] 18.10 `admin/logs/access/page.js` — SkeletonTableRow while loading
  - [x] 18.11 `admin/bulk-sessions/page.js` — SkeletonTableRow while loading

---

## Part 4 Tasks

- [x] 19. Dashboard Confidence Score Fix
  - [x] 19.1 `admin/page.js` L717 — remove `* 100` multiplication, use `${log.confidenceScore}%` to match bottle logs format

- [x] 20. Location Cards — NaN Bottle Count Fix
  - [x] 20.1 Backend: add `totalBottlesCollected` field to `_serialize_organization()` in `_shared.py`
  - [x] 20.2 Frontend: add `|| 0` fallback on `location.totalBottlesCollected` in card display (L1029)
  - [x] 20.3 Frontend: improve display logic (raw number if <1000, `Xk` if ≥1000)

- [x] 21. Add Location Modal — Two-Page Tabbed Layout
  - [x] 21.1 Add `activeTab` state + tab header UI (Location Info / Community Groups)
  - [x] 21.2 Split form: Page 1 = org info + address + contact, Page 2 = community groups + CSV placeholder
  - [x] 21.3 Add Next/Back tab navigation with Page 1 validation before advancing
  - [x] 21.4 Page 2 Submit triggers full validation + submit

- [x] 22. Edit Location Modal — Match Add Modal Layout
  - [x] 22.1 Mirror two-page tabbed layout from redesigned AddLocationModal
  - [x] 22.2 Add Community Groups tab (Page 2) with pre-populated groups
  - [x] 22.3 Ensure all fields pre-populate from `location` prop
  - [x] 22.4 Include `communityGroups` in save payload
  - [x] 22.5 Backend: add CG sync + contact sync to PUT handler
  - [x] 22.6 Schema: add `CommunityGroupUpdateInlineSchema` + contact fields to `LocationUpdateSchema`

---

## Part 5 Tasks

- [x] 23. Dashboard Overview UX
  - [x] 23.1 Move refresh button from Recycling Analytics section to page-level header
  - [x] 23.2 Add `SkeletonChart` loading state to Recycling Analytics section
  - [x] 23.3 Add `SkeletonTableRow` loading state to Real-Time Bottle Logs table (`<SkeletonTable rows={5} columns={9} />` at L681)

- [x] 24. Leaderboards Admin Menu — Complete Removal
  - [x] 24.1 Delete `admin/leaderboards/page.js`
  - [x] 24.2 Remove nav item from `Sidebar.jsx` (L245-248)
  - [x] 24.3 Remove breadcrumb from `AdminLayout.jsx` (L160)
  - [x] 24.4 Remove `leaderboard_bp` registration from `__init__.py` (L263, L272)
  - [x] 24.5 Keep public leaderboard files intact (api service, components, backend controller)

- [x] 25. Analytics Refresh Behavior
  - [x] 25.1 Change refresh button to call `fetchAnalytics(true)` to trigger full skeleton loading

- [x] 26. Connection Pool Hardening
  - [x] 26.1 Add `pool_recycle: 300` to `SQLALCHEMY_ENGINE_OPTIONS` in `__init__.py`

### Already Complete (verified — no changes needed)
- ✅ Locations page — skeleton at L873 (SkeletonMachineCard grid)
- ✅ Machines page — fixed in Part 4 session (outer gate issue)
- ✅ Users page — skeleton stat cards L439-441 + table rows L534-535
- ✅ Rewards page — skeleton table rows L670-671
- ✅ Bulk Sessions page — skeleton table rows L305
- ✅ All System Logs pages — skeleton table rows (bottles, access, machines, rewards, transactions)
- ✅ Claims Scanner — no data fetch on mount, no skeleton needed; terminal error is PgBouncer idle timeout

---

## Admin Functionality Fixes Part 1

- [x] 27. Multi-Tenant Isolation Verification
  - [x] 27.1 Spot-check 3 controllers (dashboard, rewards, users) as head_admin of Org A — confirm no Org B data leaks
  - [x] 27.2 Document verification results (all 12 controllers already use `_scope_location_id`)

- [x] 28. Admin/User Session Separation — Dual-Cookie
  - [x] 28.1 Backend: update `_attach_auth_cookies()` to set `admin_token` for admin roles, `token` for regular users
  - [x] 28.2 Backend: update `login()` and `verify_otp_route()` to pass `user.is_admin` to cookie helper
  - [x] 28.3 Backend: update `logout()` to clear both `admin_token` and `token` cookies
  - [x] 28.4 Backend: add `_resolve_token()` helper in `middleware.py` — reads `admin_token` → `token` → Bearer
  - [x] 28.5 Backend: update `token_required()` to use `_resolve_token()`
  - [x] 28.6 Backend: enforce token source in `@admin_required` / `@permission_required` — reject `token` cookie on admin routes
  - [x] 28.7 Frontend: AuthContext.js — add ADMIN_ROLES guard in enrichUser(); admin cookies return null so public NavBar shows Login
  - [ ] 28.8 Test: admin login sets `admin_token`, public site shows "Login" button
  - [ ] 28.9 Test: regular user login sets `token`, `/admin` still rejected

- [x] 29. Rewards — Multi-Tenant + Shared Merchandise
  - [x] 29.1 Add `RewardOrgAssignment` junction table model in `models.py`
  - [x] 29.2 Migration auto-runs via SQLAlchemy `create_all` on next server start
  - [x] 29.3 Update `GET /rewards` query — return org-specific + assigned rewards via `OR` clause
  - [x] 29.4 Add `POST /rewards/:id/assign` endpoint (superadmin only) — assign reward to multiple orgs
  - [x] 29.5 Add `DELETE /rewards/:id/assign/:org_id` endpoint (superadmin only) — remove assignment
  - [x] 29.6 Add `GET /rewards/:id/assignments` endpoint (superadmin only) — list current assignments
  - [x] 29.6 Add `RewardAssignSchema` in `schemas/__init__.py`
  - [x] 29.7 Update `_serialize_reward()` — include `assignedOrganizations` field
  - [x] 29.8 Frontend: add `assign()` / `unassign()` / `getAssignments()` to `rewards.js` API service
  - [x] 29.9 Frontend: add "Assign to Locations" (Share2 icon) on rewards page (superadmin only) + modal with org checklist
  - [ ] 29.10 Test: superadmin assigns reward from Org A to Org B → Org B user sees it
  - [ ] 29.11 Test: Org C user does NOT see Org A/B shared reward

---

## Part 6 Tasks

    - [x] 30. Phase 30 — Remove "System Mode" Theme
      - [x] 30.1 `ThemeContext.js` — remove `system` from `THEMES`, allowed-values arrays, and `isSystemMode`
      - [x] 30.2 `ThemeContext.js` — update `cycleTheme` order to light → neutral → dark → light
      - [x] 30.3 `ThemeContext.js` — on init, map stored `'system'` value to default `'dark'`
      - [x] 30.4 `AdminLayout.jsx` — remove System Mode (Leaf icon) toggle button
      - [x] 30.5 `AdminLayout.jsx` — remove `theme === 'system'` branches; fix `themeClass`
      - [x] 30.6 `Sidebar.jsx` — remove all `theme === 'system'` styling branches
      - [x] 30.7 `tailwind.config.js` — remove unused `system:` variant (only if no remaining refs)
      - [x] 30.8 Verify light/neutral/dark render correctly; no console errors

- [x] 31. Phase 31 — Points Config "BAD REQUEST" Fix
  - [x] 31.1 `settings_controller.py` `get_points_config` — return 200 + defaults when no location scope (remove 400 guard)
  - [x] 31.2 Verify `PUT /settings/points` still requires location scope (unchanged)
  - [x] 31.3 `settings/page.js` — confirm console error gone (no code change expected)
  - [x] 31.4 `bulk-sessions/page.js` — simplify points-config fallback comment (optional)
  - [x] 31.5 Backend smoke/property test: GET points with no-scope context returns 200 defaults

- [x] 32. Phase 32 — Location Import Feature
  - [x] 32.1 Add `xlsx` (SheetJS) to `client/package.json`
  - [x] 32.2 Create shared `client/src/lib/importFile.js` with `parseSpreadsheet(file)`
  - [x] 32.3 `locations/page.js` — add Import control (button + file input, `.csv,.xls,.xlsx`)
  - [x] 32.4 `locations/page.js` — map rows to ERD Location payload (Phase 4 mapping)
  - [x] 32.5 `locations/page.js` — validate rows with shared `validateField`; row-level error summary
  - [x] 32.6 `locations/page.js` — submit valid rows; refresh list on success
  - [x] 32.7 `locations/page.js` — add `Info` helper icon describing required columns/format
  - [x] 32.8 `locations/page.js` — user-visible error feedback for malformed file/rows

- [x] 33. Phase 33 — Bulk Session Import Feature
  - [x] 33.1 `bulk-sessions/page.js` — replace CSV placeholder with Import control (`.csv,.xls,.xlsx`)
  - [x] 33.2 `bulk-sessions/page.js` — map rows to items (`itemType`, `condition`, `volumeMl`)
  - [x] 33.3 `bulk-sessions/page.js` — auto-calc `pointsAwarded` via `getAutoPoints()`
  - [x] 33.4 `bulk-sessions/page.js` — append imported items; report skipped invalid rows
  - [x] 33.5 `bulk-sessions/page.js` — add `Info` helper icon describing accepted values
  - [x] 33.6 `bulk-sessions/page.js` — user-visible error feedback for malformed file/rows
  - [x] 33.7 Reuse shared `importFile.js` parser (no duplicate parsing logic)

- [x] 34. Part 6 Verification
  - [x] 34.1 Client build passes
  - [x] 34.2 Backend tests pass (points config no-scope case)
  - [x] 34.3 Manual walkthrough: theme switcher (3 themes), settings load (no error), location import, bulk session import

---

## Website Polishing Part 1

- [x] 35. Sign Up Modal — Field Alignment & Styling Fix
  - [x] 35.1 `LogIn.jsx` Phase 1 — replace single `fullName` field with `firstName / middleName / lastName` (3-column grid, matching `AddRegularUserModal`)
  - [x] 35.2 `LogIn.jsx` — update all state, reset, save/restore, and payload references from `fullName` → `firstName/middleName/lastName`
  - [x] 35.3 `LogIn.jsx` `InputField` component — fix `web-web-rounded-lg` typo → `rounded-lg` to restore border radius on all signup inputs

---

## ERD Field Relocation + User-Form Simplification (Option B)

Plan: `docs/superpowers/plans/2026-06-18-erd-field-relocation-and-form-simplification.md`

- [x] 36. Phase 1–3 Backend (merged to dev as `cleanup/erd-field-relocation`)
  - [x] 36.1 Models: `educational_level` moved to `community_groups`; `group_type` dropped; `year_level` kept on `users`
  - [x] 36.2 Migration `d15021ae149c_erd_field_relocation.py` applied to Supabase
  - [x] 36.3 Schemas: `educationalLevel` on group schemas; dropped from user/register schemas
  - [x] 36.4 Controllers: groups/locations/users/auth — replace `groupType`→`educationalLevel`; non-student auto-assign on the backend
  - [x] 36.5 Locations controller: removed `POST/PUT/DELETE /org-types` endpoints (org types locked to 3 fixed values)
  - [x] 36.6 Seeders + 12 test fixture files swept of `group_type=`
  - [x] 36.7 Server suite: 223 passed
  - [x] 36.8 ERD.md updated

- [x] 37. Phase 4 Frontend (`feat/erd-field-relocation-frontend`)
  - [x] 37.1 `client/src/lib/validateField.js` — group rule renamed `groupType` → `educationalLevel`
  - [x] 37.2 `client/src/lib/enumLabels.js` — added `educationalLevelLabel`; kept `groupTypeLabel` as backward-compat alias
  - [x] 37.3 `AddRegularUserModal.jsx` — full rewrite. New cascade: Location → User Type → Community Group (+ student-only Year Level derived from `selectedGroup.educationalLevel`). University + alumni/faculty/staff hide group/year (backend auto-assigns). Org types limited to University/Corporate/Community.
  - [x] 37.4 Edit User modal in `app/admin/users/page.js` — same simplification: dropped `editFormData.educationalLevel`, removed legacy `editIsSchoolOrg`/`GROUP_TYPE_MAP`/`editShowEduc`/`editGroupLabel`. Year level derives from selected group.
  - [x] 37.5 `app/admin/locations/page.js`:
    - Locked org types to 3 fixed values (`FIXED_ORG_TYPES = ['University', 'Corporate', 'Community']`)
    - Removed `orgTypesApi` import + all custom CRUD state/handlers (add/edit/delete)
    - Replaced custom org-type dropdown UI with simple `CustomDropdown` (both Add and Edit modals)
    - Inline community-groups table: `groupType` `<select>` → `educationalLevel` dropdown (Kindergarten/Elementary/JHS/SHS/College) shown ONLY when org type is University
    - `CommunityGroupImport` component: accepts `orgType` prop. University template = `name, abbreviation, educational_level`. Corporate/Community template = `name, abbreviation`.
  - [x] 37.6 `LogIn.jsx` signup — dropped `SHS_STRANDS`, `COLLEGE_DEPARTMENTS` constants, `educationLevel`/`strand`/`department`/`departmentSearch`/`strandSearch` state. New cascade: User Type (Student/Faculty/Staff) → Community Group (student only) → Year Level (derived from selected group's `educationalLevel`). Faculty/Staff hide group; backend auto-assigns. Removed unused `GraduationCap` import.
  - [x] 37.7 Client build passes ✅
  - [x] 37.8 Push branch + merge to dev (after manual smoke)
  - [ ] 37.9 Manual smoke: create University location with College community group → add Student user → confirm cascade. Add Faculty user → confirm no group field. Confirm org-type field has no add button.

- [x] 38. Phase 5 — Verification
  - [x] 38.1 ERD.md updated (done in backend Phase 1-3 merge to dev)
  - [x] 38.2 Server suite: 223 passed, 0 failures (`python -m pytest -m "not integration" -q`)
  - [x] 38.3 Client build passes (`npm run build` — Compiled successfully in 13.1s, 25 pages)
  - [x] 38.4 API service files clean — no stale `groupType` references in `client/src/services/api/`
  - [x] 38.5 Branch `feat/erd-field-relocation-frontend` pushed to origin

---

## Admin CRUD Bug Fixes (Bug Conditions C1–C6)

Exploratory bugfix workflow: write exploration + preservation tests BEFORE the fix, then implement, then re-run the same tests. JS tests use `fast-check` (client, scoped to concrete failing inputs for deterministic bugs); Python tests use `hypothesis`/`pytest` (server). Exploration tests MUST FAIL on unfixed code; preservation tests MUST PASS on unfixed code.

### Exploration Tests (write BEFORE any fix — expected to FAIL)

- [x] 39. Write bug condition exploration test — C1 Add Machine
  - **Property 1: Bug Condition** - Add Machine Does Not Persist
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists. DO NOT fix the test or code when it fails.
  - **GOAL**: Surface counterexamples proving submitting the Add Machine modal does not create a machine.
  - **Scoped PBT Approach**: Scope to concrete valid payloads `{name, machineUuid, locationName, organizationId}`; for all valid inputs, `machinesApi.create` is invoked and a new card appears.
  - Bug Condition: `isBugCondition(input)` = superadmin submits valid Add Machine form (`app/admin/machines/page.js` `AddMachineModal.handleSubmit` → `handleAddMachine` → `machinesApi.create`)
  - Expected Behavior asserted: machine created via `POST /machines` and new card rendered with "Online" summary updated
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS**. Document counterexample (e.g. payload shape mismatch / create not called).
  - _Requirements: 1.1_

- [x] 40. Write bug condition exploration test — C2 Edit Machine
  - **Property 2: Bug Condition** - Edit Machine Does Not Persist
  - **CRITICAL**: This test MUST FAIL on unfixed code. DO NOT fix when it fails.
  - **GOAL**: Surface counterexamples proving Edit Machine save does not persist changes.
  - **Scoped PBT Approach**: For all changed field values, `EditMachineModal.handleSubmit` → `handleEditMachine` → `machinesApi.update(id, data)` persists and the card reflects new values.
  - Bug Condition: `isBugCondition(input)` = admin changes a field in Edit Machine modal and saves (`app/admin/machines/page.js:163` `handleSubmit`, `:712` `handleEditMachine`)
  - Expected Behavior asserted: change persisted via `PUT /machines/:id`, card shows updated values
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS**. Document counterexample.
  - _Requirements: 1.2_

- [x] 41. Write bug condition exploration test — C3 Maintenance Log
  - **Property 3: Bug Condition** - Maintenance Log Not Created
  - **CRITICAL**: This test MUST FAIL on unfixed code. DO NOT fix when it fails.
  - **GOAL**: Surface counterexamples proving the Maintenance modal does not create a log.
  - **Scoped PBT Approach**: For all valid `{technicianId, actionType, notes}`, `MaintenanceModal.handleSubmit` → `handleAddMaintenanceLog` → `logs.createMachineLog` creates a log.
  - Bug Condition: `isBugCondition(input)` = admin submits Maintenance modal with valid data (`app/admin/machines/page.js:296` `handleSubmit`, `handleAddMaintenanceLog`)
  - Expected Behavior asserted: log created via logs API and reflected
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS**. Document counterexample.
  - _Requirements: 1.3_

- [x] 42. Write bug condition exploration test — C4 Machine Search Crash (getLocationName TDZ)
  - **Property 4: Bug Condition** - Search Throws getLocationName TDZ
  - **CRITICAL**: This test MUST FAIL on unfixed code. DO NOT fix when it fails.
  - **GOAL**: Reproduce `Uncaught TypeError: getLocationName is not a function` at `app/admin/machines/page.js:660`.
  - **Scoped PBT Approach** (deterministic bug): scope to the concrete failing case — set `searchQuery` to any non-empty string while machines exist, evaluate `displayedMachines` useMemo.
  - Bug Condition: `isBugCondition(input)` = any non-empty `searchQuery` → `displayedMachines` calls `getLocationName(m.locationId)` (L660) which is a `const` arrow declared later at L722 (temporal dead zone)
  - Expected Behavior asserted: filtering returns results without throwing (Req 2.4 — `getLocationName` defined/hoisted before use)
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS (ReferenceError/TypeError)**. Document counterexample (e.g. `searchQuery="a"` throws).
  - _Requirements: 1.4_

- [x] 43. Write bug condition exploration test — C5 All-Locations User Filter
  - **Property 5: Bug Condition** - All-Locations Omits Users
  - **CRITICAL**: This test MUST FAIL on unfixed code. DO NOT fix when it fails.
  - **GOAL**: Surface counterexamples proving "View As = All locations" omits users from some orgs (e.g. EPTU).
  - **Scoped PBT Approach**: For all users including those with null/missing `community_group`, `GET /users` with no `location_id` scope returns every user. Seed a user whose `CommunityGroup` linkage is absent.
  - Bug Condition: `isBugCondition(input)` = superadmin lists users with no location scope; `users_controller.get_users` uses `db.session.query(User).join(CommunityGroup)` (INNER join) which drops users lacking a community group row
  - Expected Behavior asserted (Req 2.5): all users across all orgs returned
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS** (omitted user). Document counterexample.
  - _Requirements: 1.5_

- [x] 44. Write bug condition exploration test — C6 Add User Bad Request
  - **Property 6: Bug Condition** - Add User Returns Generic BAD REQUEST
  - **CRITICAL**: This test MUST FAIL on unfixed code. DO NOT fix when it fails.
  - **GOAL**: Surface counterexamples where Add User fails with "BAD REQUEST" instead of creating the user or surfacing the real validation message.
  - **Scoped PBT Approach**: (a) valid payloads matching `UserCreateSchema` + server password policy succeed; (b) invalid payloads surface the server's real error string (not "BAD REQUEST"). Cover password-policy mismatch and flat-string error body not parsed by `ApiError`.
  - Bug Condition: `isBugCondition(input)` = admin submits Add User modal; client policy/shape diverges from server `UserCreateSchema` + `validate_password_policy`, and `ApiError` does not surface flat-string error body
  - Expected Behavior asserted (Req 2.6): shared password policy (≥8, upper, lower, digit) + same field/shape as public registration; succeed on valid, surface real server message on invalid
  - Run on UNFIXED code → **EXPECTED OUTCOME: FAILS**. Document counterexample (e.g. valid input rejected; or error shown as "BAD REQUEST").
  - _Requirements: 1.6_

### Preservation Tests (write BEFORE any fix — observation-first, expected to PASS on unfixed code)

- [x] 45. Write preservation property test — Machine list & counts
  - **Property 7: Preservation** - Machine List And Online/Offline Counts
  - **IMPORTANT**: Observation-first. Observe `machinesApi.getAll(locationId)` output and rendered online/offline counts on UNFIXED code; record them.
  - Write property test: for all machine datasets, listed machines and `onlineCount`/`offlineCount` equal observed values (`¬C` = normal load, no mutation/search/crash path).
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.1_

- [x] 46. Write preservation property test — Search matches existing machines
  - **Property 8: Preservation** - Search Returns Name/Id Matches
  - **IMPORTANT**: Observation-first. On UNFIXED code, observe results for terms matching `m.name`/`m.id` (using inputs that do NOT trigger the C4 crash path, e.g. by stubbing `getLocationName`) and record them.
  - Write property test: for all terms matching an existing name or id, those machines are returned.
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.2_

- [x] 47. Write preservation property test — Specific-location user filter
  - **Property 9: Preservation** - Single-Location User Scoping
  - **IMPORTANT**: Observation-first. On UNFIXED code, observe `GET /users?location_id=<EPTU>` returns only that org's users; record them.
  - Write property test: for all single-location scopes, only that location's users are returned (`¬C` = scope provided).
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.3_

- [x] 48. Write preservation property test — Public registration policy
  - **Property 10: Preservation** - Public Signup Password Policy & Errors
  - **IMPORTANT**: Observation-first. On UNFIXED code, observe `LogIn.jsx` public registration applies shared password policy and surfaces server error messages; record behavior.
  - Write property test: for all valid/invalid signup inputs, public registration applies the policy and surfaces server errors unchanged.
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.4_

- [x] 49. Write preservation property test — Valid Add User create
  - **Property 11: Preservation** - Valid Add User Still Creates
  - **IMPORTANT**: Observation-first. On UNFIXED code, observe that already-valid Add User input creates a user with correct `UserCreateSchema` fields; record the created shape.
  - Write property test: for all inputs already passing validation, user is created with correct fields (`¬C` = input already valid).
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.5_

- [x] 50. Write preservation property test — Machines page renders without runtime error
  - **Property 12: Preservation** - Cards/Edit/Maintenance No Runtime Error
  - **IMPORTANT**: Observation-first. On UNFIXED code, observe machine cards, edit, and maintenance flows render without runtime errors for non-buggy inputs (no active search triggering C4); record behavior.
  - Write property test: for all valid non-buggy interactions, the machines page renders without runtime errors.
  - Run on UNFIXED code → **EXPECTED OUTCOME: PASSES**.
  - _Requirements: 3.6_

### Implementation (apply fixes, then re-run the SAME tests above)

- [x] 51. Fix C1–C3 — Machine create/edit/maintenance submit wiring

  - [x] 51.1 Implement machine CRUD submit fixes
    - Align `AddMachineModal`/`EditMachineModal`/`MaintenanceModal` submit payloads to API field/shape expected by `machinesApi.create`/`update` and `logs.createMachineLog`
    - Ensure `handleAddMachine`, `handleEditMachine`, `handleAddMaintenanceLog` invoke the API and update state on success; surface server errors on failure
    - _Bug_Condition: isBugCondition = submit Add/Edit/Maintenance modal with valid data (C1, C2, C3)_
    - _Expected_Behavior: create/update/log persisted via API and reflected in UI (Req 2.1, 2.2, 2.3)_
    - _Preservation: machine list & counts (3.1), search matches (3.2), no runtime errors (3.6)_
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

  - [x] 51.2 Verify exploration tests now pass — C1/C2/C3
    - **Property 1: Expected Behavior** - Add Machine Persists
    - **Property 2: Expected Behavior** - Edit Machine Persists
    - **Property 3: Expected Behavior** - Maintenance Log Created
    - **IMPORTANT**: Re-run the SAME tests from tasks 39, 40, 41 — do NOT write new tests
    - **EXPECTED OUTCOME**: Tests PASS (bugs fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 51.3 Verify preservation tests still pass
    - **Property 7: Preservation** - Machine List And Counts
    - **Property 12: Preservation** - No Runtime Error
    - Re-run tests from tasks 45, 50 → **EXPECTED OUTCOME: PASS** (no regressions)
    - _Requirements: 3.1, 3.6_

- [x] 52. Fix C4 — `getLocationName` temporal-dead-zone in machine search

  - [x] 52.1 Move/hoist `getLocationName` definition above the `displayedMachines` useMemo
    - In `app/admin/machines/page.js`, define `getLocationName` (currently `const` arrow at L722) before its use at L660, or convert to a hoisted `function` declaration
    - _Bug_Condition: isBugCondition = any non-empty searchQuery evaluates displayedMachines (C4)_
    - _Expected_Behavior: search filters without crashing; getLocationName defined before use (Req 2.4)_
    - _Preservation: search matches (3.2), no runtime errors (3.6)_
    - _Requirements: 1.4, 2.4_

  - [x] 52.2 Verify exploration test now passes — C4
    - **Property 4: Expected Behavior** - Search Does Not Throw
    - **IMPORTANT**: Re-run the SAME test from task 42 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (no TDZ crash)
    - _Requirements: 2.4_

  - [x] 52.3 Verify preservation tests still pass
    - **Property 8: Preservation** - Search Returns Name/Id Matches
    - **Property 12: Preservation** - No Runtime Error
    - Re-run tests from tasks 46, 50 → **EXPECTED OUTCOME: PASS**
    - _Requirements: 3.2, 3.6_

- [x] 53. Fix C5 — All-locations user filter omits users

  - [x] 53.1 Replace INNER join with outer join / scope-aware query in `get_users`
    - In `server/app/controllers/users_controller.py` `get_users`, change `db.session.query(User).join(CommunityGroup)` to an `outerjoin(CommunityGroup)` (or remove the join from the unscoped path) so users without a community group are still returned
    - Keep location scoping intact via `_scope_location_id`
    - _Bug_Condition: isBugCondition = superadmin lists users with no location scope; INNER join drops users lacking a community group (C5)_
    - _Expected_Behavior: all users across all orgs returned (Req 2.5)_
    - _Preservation: single-location scoping unchanged (3.3)_
    - _Requirements: 1.5, 2.5_

  - [x] 53.2 Verify exploration test now passes — C5
    - **Property 5: Expected Behavior** - All-Locations Returns Every User
    - **IMPORTANT**: Re-run the SAME test from task 43 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES (no omitted users)
    - _Requirements: 2.5_

  - [x] 53.3 Verify preservation test still passes
    - **Property 9: Preservation** - Single-Location User Scoping
    - Re-run test from task 47 → **EXPECTED OUTCOME: PASS**
    - _Requirements: 3.3_

- [x] 54. Fix C6 — Add User "BAD REQUEST"

  - [x] 54.1 Align client policy/shape and surface real server errors
    - Apply shared password policy (≥8 chars, one uppercase, one lowercase, one digit) in the Add User modal, matching `server/app/services/password_policy.py`
    - Align Add User payload field/shape to `UserCreateSchema` (same handling as public registration)
    - Update `ApiError` handling so a flat-string error body is surfaced as the real message instead of "BAD REQUEST"
    - _Bug_Condition: isBugCondition = Add User submit with client/server policy or shape divergence; flat-string error not surfaced (C6)_
    - _Expected_Behavior: succeed on valid input; surface server's real error on invalid (Req 2.6)_
    - _Preservation: public registration unchanged (3.4), valid Add User still creates (3.5)_
    - _Requirements: 1.6, 2.6_

  - [x] 54.2 Verify exploration test now passes — C6
    - **Property 6: Expected Behavior** - Add User Succeeds / Surfaces Real Error
    - **IMPORTANT**: Re-run the SAME test from task 44 — do NOT write a new test
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.6_

  - [x] 54.3 Verify preservation tests still pass
    - **Property 10: Preservation** - Public Signup Policy & Errors
    - **Property 11: Preservation** - Valid Add User Still Creates
    - Re-run tests from tasks 48, 49 → **EXPECTED OUTCOME: PASS**
    - _Requirements: 3.4, 3.5_

- [x] 55. Checkpoint — Ensure all C1–C6 tests pass
  - Run full client + server test suites; confirm all exploration tests (Properties 1–6) PASS and all preservation tests (Properties 7–12) PASS
  - Ask the user if questions arise
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

---

## Task Dependency Graph

Dependencies for the C1–C6 bugfix work (tasks 39–55). Tests are grouped by the bug condition they target; each fix depends on its exploration + preservation tests existing first, and each verification sub-task depends on its fix.

Execution waves (tasks within a wave have no inter-dependencies and may run in parallel; each wave depends on the previous):

```json
{
  "waves": [
    {
      "wave": 1,
      "description": "Write all exploration tests (must FAIL) and preservation tests (must PASS) on UNFIXED code",
      "tasks": ["39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"]
    },
    {
      "wave": 2,
      "description": "Apply the four independent fixes",
      "tasks": ["51.1", "52.1", "53.1", "54.1"]
    },
    {
      "wave": 3,
      "description": "Re-run the same tests to verify fixes (Expected Behavior) and preservation (no regressions)",
      "tasks": ["51.2", "51.3", "52.2", "52.3", "53.2", "53.3", "54.2", "54.3"]
    },
    {
      "wave": 4,
      "description": "Checkpoint - full suite green",
      "tasks": ["55"]
    }
  ]
}
```

```
Exploration tests (must FAIL on unfixed code):
  39 (C1) ─┐
  40 (C2) ─┤
  41 (C3) ─┴──────────────► 51.1 (fix C1–C3) ──► 51.2 (verify P1/P2/P3) ──► 51.3 (verify P7/P12)
  42 (C4) ─────────────────► 52.1 (fix C4)     ──► 52.2 (verify P4)      ──► 52.3 (verify P8/P12)
  43 (C5) ─────────────────► 53.1 (fix C5)     ──► 53.2 (verify P5)      ──► 53.3 (verify P9)
  44 (C6) ─────────────────► 54.1 (fix C6)     ──► 54.2 (verify P6)      ──► 54.3 (verify P10/P11)

Preservation tests (must PASS on unfixed code):
  45 (P7  Req 3.1) ──► gate for 51.3
  46 (P8  Req 3.2) ──► gate for 51.3, 52.3
  47 (P9  Req 3.3) ──► gate for 53.3
  48 (P10 Req 3.4) ──► gate for 54.3
  49 (P11 Req 3.5) ──► gate for 54.3
  50 (P12 Req 3.6) ──► gate for 51.3, 52.3

Checkpoint:
  51.* , 52.* , 53.* , 54.*  ──►  55 (all tests pass)
```

Ordering rules:
- All exploration tests (39–44) and preservation tests (45–50) MUST be written and run on UNFIXED code before any fix (51–54).
- Exploration tests must FAIL and preservation tests must PASS before proceeding to fixes.
- Each fix sub-task (51.1, 52.1, 53.1, 54.1) precedes its verification sub-tasks.
- The four fixes (51–54) are independent of each other and may proceed in any order or in parallel.
- Task 55 (checkpoint) depends on all of 51–54.

## Notes

- Exploration tests encode expected behavior; the same test that FAILS pre-fix MUST PASS post-fix. Do not rewrite tests during verification — re-run them.
- For deterministic bugs (C4 especially), scope property-based tests to the concrete failing input(s) for reproducibility.
- Client tests: `fast-check` + the project's JS test runner. Server tests: `hypothesis`/`pytest` (`python -m pytest -m "not integration" -q`).
- Run test runners with a single-execution flag (e.g. `--run`), not watch mode.
- C4 root cause confirmed in code: `getLocationName` is a `const` arrow at `app/admin/machines/page.js:722` used at L660 (temporal dead zone). C5 root cause: INNER `join(CommunityGroup)` in `users_controller.get_users`.
