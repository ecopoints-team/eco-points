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

- [x] 2. Phase 2 — Data Fetching Performance (Caching)
  - [x] 2.1 Add `redis>=5.0.0` dependency to `server/requirements.txt`
  - [x] 2.2 Create Redis cache module (`server/app/cache.py`) with get/set/invalidate/decorator
  - [x] 2.3 Add cache layer to `GET /api/web/dashboard/stats` (TTL: 60s)
  - [x] 2.4 Add cache layer to `GET /api/web/leaderboard` (TTL: 300s)
  - [x] 2.5 Add cache layer to `GET /api/web/analytics` (TTL: 120s)
  - [x] 2.6 Add cache invalidation on mutation endpoints:
    - `POST /api/rpi/session/:id/deposit` → dashboard_stats
    - `POST /api/rpi/session/:id/end` → dashboard_stats, leaderboard, analytics
    - `POST /api/web/sessions/bulk` → dashboard_stats, leaderboard, analytics
    - `POST /api/web/bulk-deposits` → dashboard_stats, leaderboard, analytics
  - [x] 2.7 Graceful fallback when Redis unavailable (all ops silently no-op)
  - [x] 2.8 Client-side: DashboardCacheContext persists data across admin navigation (60s staleness)
  - [x] 2.9 Added REDIS_URL to .env with documentation

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

- [ ] 6. Phase 6 — Comprehensive Audit & Connected Fixes
  - [ ] 6.1 Audit all admin modals for field-to-ERD alignment
  - [ ] 6.2 Audit all admin data tables for correct column-to-API key mapping
  - [ ] 6.3 Audit all admin forms for consistent use of shared `validateField.js`
  - [ ] 6.4 Audit Edit modals for correct pre-population from API response data
  - [ ] 6.5 Document and fix any additional bugs found during audit

- [/] 7. Final Verification
  - [/] 7.1 Client build passes ✅ (running now)
  - [ ] 7.2 Backend smoke tests pass
  - [ ] 7.3 Deploy to Render + set REDIS_URL env var
  - [ ] 7.4 Trigger Cloudflare Pages rebuild
  - [ ] 7.5 Manual walkthrough of all admin pages
