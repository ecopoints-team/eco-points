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
