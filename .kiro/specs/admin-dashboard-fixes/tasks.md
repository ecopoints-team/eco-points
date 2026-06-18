# Implementation Plan: Admin Dashboard Fixes

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
  - [ ] 37.8 Push branch + merge to dev (after manual smoke)
  - [ ] 37.9 Manual smoke: create University location with College community group → add Student user → confirm cascade. Add Faculty user → confirm no group field. Confirm org-type field has no add button.
