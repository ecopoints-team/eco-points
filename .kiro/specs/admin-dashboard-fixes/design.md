# Design Document — Admin Dashboard Fixes

## Overview

This design documents the technical approach for each fix in the admin dashboard. Work is organized into 6 phases: validation hardening, performance/caching, dashboard chart fixes, locations modal fix, machines modal cleanup, and a comprehensive audit of connected areas.

## Architecture Context

The EcoPoints platform uses:
- **Frontend:** Next.js on Cloudflare Pages (`ecopoints.org`)
- **Backend:** Flask on Render (`eco-points-api.onrender.com`)
- **Database:** Supabase PostgreSQL
- **Auth:** JWT via HttpOnly cookies with `SameSite=None; Secure`
- **CORS:** `flask_cors` with `supports_credentials=True`

### Known Architectural Constraints

| Constraint | Impact |
|------------|--------|
| Frontend and API on different registrable domains | Cookies use `SameSite=None; Secure` |
| Seed password is `SeedPass!23` | Documented in `seed.py` wrapper |
| Werkzeug 3.x uses `scrypt` for password hashing | Hash portability across environments |
| Render free tier cold starts | First request may be slow (~30s) |

---

## Phase 1 — Field Validation Hardening

### Problem
Admin forms accept whitespace-only inputs and lack consistent validation across all menus.

### Approach
- Extend `client/src/lib/validateField.js` to add a `trimRequired` check that rejects whitespace-only values.
- Audit every admin modal and ensure it uses `validateField()` / `validateAll()` with rules aligned to the ERD constraints.
- Add `.trim()` to all text field values before validation and submission.

### Files Affected
| File | Change |
|------|--------|
| `client/src/lib/validateField.js` | Add whitespace-only rejection to all `required` rules |
| `client/app/admin/locations/page.js` | Apply trimmed validation to Add/Edit modals |
| `client/app/admin/machines/page.js` | Apply trimmed validation to Add/Edit modals |
| `client/app/admin/rewards/page.js` | Apply trimmed validation to Add/Edit modals |
| `client/app/admin/users/page.js` | Apply trimmed validation to Add/Edit modals |
| `client/src/components/admin/AddRegularUserModal.jsx` | Apply trimmed validation |
| `client/src/components/admin/AddUserModal.jsx` | Apply trimmed validation |

---

## Phase 2 — Data Fetching Performance (Redis Cache)

### Problem
Dashboard is slow on first load and refetches data on every page navigation.

### Approach

**Server-side (Redis):**
- Add Redis (via `redis` Python package) as an optional cache layer.
- Cache expensive endpoints: `GET /api/web/dashboard/stats`, `GET /api/web/leaderboard`, `GET /api/web/logs/analytics`.
- Use TTL-based cache (e.g., 60s for stats, 300s for leaderboard).
- Invalidate relevant cache keys on mutations (POST/PUT/DELETE).
- Graceful fallback: if Redis is unavailable, skip cache and query DB directly.

**Client-side (State Persistence):**
- Lift dashboard data into `AuthContext` or a dedicated `DashboardContext` so it persists across admin page navigation.
- Only refetch on explicit refresh or after a mutation.

### Files Affected
| File | Change |
|------|--------|
| `server/app/__init__.py` | Initialize Redis connection |
| `server/app/controllers/dashboard_controller.py` | Add cache reads/writes |
| `server/app/controllers/leaderboard_controller.py` | Add cache reads/writes |
| `server/app/controllers/analytics_controller.py` | Add cache reads/writes |
| `server/requirements.txt` | Add `redis` dependency |
| `client/app/admin/page.js` | Use persistent state, avoid refetch on return |

### ERD Alignment
Redis caches read-only aggregations. No schema changes needed. Cache keys scoped by `organization_id` for multi-tenant safety.

---

## Phase 3 — Dashboard Menu Fixes

### Problem
1. Recycling Analytics shows no charts/graphs.
2. Dashboard card data resets on navigation.
3. No manual refresh button.

### Approach

**3.1 — Analytics Charts:**
- Investigate why the analytics endpoint returns empty data or the chart component fails to render.
- Verify `GET /api/web/logs/analytics` returns time-series data.
- Ensure the chart library (if any) is correctly imported and configured.

**3.2 — Data Persistence:**
- Store dashboard stats in a context/store that persists across route changes within the admin shell.
- Only clear on logout or explicit refresh.

**3.3 — Refresh Button:**
- Add a refresh button (with `RefreshCw` icon) to the dashboard header.
- Shows `animate-spin` while fetching. Clears cached data and refetches from API.

### Files Affected
| File | Change |
|------|--------|
| `client/app/admin/page.js` | Fix analytics rendering, add refresh button, persist state |
| `client/app/admin/analytics/page.js` | Fix chart rendering if separate |
| `server/app/controllers/analytics_controller.py` | Verify response shape |

---

## Phase 4 — Locations Menu: Org Type Creation Fix

### Problem
Admin cannot add new organization types from the Add Location modal — the new type is not saved.

### Approach
- Trace the "Add Org Type" flow: frontend modal → API call → database insert.
- Verify `POST /api/web/org-types` endpoint exists and works.
- Fix the frontend to call the correct endpoint and refresh the dropdown after creation.
- Align all modal fields to ERD entities:

**ERD → Modal Field Mapping (Locations):**

| ERD Entity | ERD Field | Modal Field | Type |
|------------|-----------|-------------|------|
| ORGANIZATIONS | `name` | Organization Name (Abbreviation) | String, max 200, required |
| ORGANIZATIONS | `full_name` | Full Organization Name | String, max 500, required |
| ORGANIZATIONS | `type_id` | Organization Type | FK → ORG_TYPES, required |
| ORGANIZATIONS | `status` | Status | Enum: Active/Inactive |
| ORG_ADDRESS | `street_address` | Street Address | String, max 500, required |
| ORG_ADDRESS | `barangay` | Barangay | String, max 200 |
| ORG_ADDRESS | `city_municipality` | City/Municipality | String, max 200, required |
| ORG_ADDRESS | `province` | Province | String, max 200 |
| ORG_ADDRESS | `region` | Region | String, max 200 |
| ORG_ADDRESS | `zip_code` | ZIP Code | String, max 10 |
| ORG_CONTACT | `first_name` | Contact First Name | String, max 200, required |
| ORG_CONTACT | `last_name` | Contact Last Name | String, max 200, required |
| ORG_CONTACT | `email` | Contact Email | String, max 200, valid email |
| ORG_CONTACT | `phone_number` | Contact Phone | String, max 50 |

### Files Affected
| File | Change |
|------|--------|
| `client/app/admin/locations/page.js` | Fix org type creation flow, align modal fields |
| `server/app/controllers/settings_controller.py` | Verify/fix POST org-types endpoint |

---

## Phase 5 — Machines Menu: Remove Area Placement "Add" Button

### Problem
The Add Machine modal has an unnecessary "Add" button next to the Area Placement field.

### Approach
- Remove the "Add" button and its handler from the Add Machine modal.
- Keep Area Placement as a plain text `<input>` mapping to `RVMS.location_name`.

**ERD → Modal Field Mapping (Machines):**

| ERD Entity | ERD Field | Modal Field | Type |
|------------|-----------|-------------|------|
| RVMS | `name` | Machine Name | String, max 200, required |
| RVMS | `machine_uuid` | Machine UUID | String, max 100, required, unique |
| RVMS | `location_name` | Area Placement | String, max 200 |
| RVMS | `organization_id` | (implicit from admin context) | FK |

### Files Affected
| File | Change |
|------|--------|
| `client/app/admin/machines/page.js` | Remove Add button and handler from Area Placement |

---

## Phase 6 — Comprehensive Audit

### Scope
Scan all areas connected to the above fixes for additional bugs:

1. **All admin modals** — verify field-to-ERD alignment
2. **All admin data tables** — verify column-to-API key mapping
3. **All admin forms** — verify shared validation usage
4. **Edit modals** — verify pre-population from API data
5. **API endpoints** — verify request/response shapes match ERD
6. **RBAC** — verify permission checks on all mutation endpoints

### Deliverable
A list of additional bugs found during the audit, appended to `tasks.md` as sub-tasks.

---

## Part 6 Design

### Phase 30 — Remove "System Mode" Theme

#### Problem
A 4th custom theme `'system'` (green palette, not OS-preference detection) clutters the theme switcher and adds styling branches across the admin shell.

#### Approach
- Remove the `system` entry from `THEMES`, the allowed-values arrays, the `cycleTheme` order, and the `isSystemMode` flag in `ThemeContext.js`.
- On init, if `localStorage.ecopoints_theme === 'system'`, treat it as unset and fall back to `'dark'`.
- Remove the Leaf-icon `System Mode` button from the theme switcher in `AdminLayout.jsx`.
- Delete all `theme === 'system'` conditional branches in `Sidebar.jsx` and `AdminLayout.jsx`, keeping the light/neutral/dark branches intact.
- Verify `tailwind.config.js` `system:` variant — it is unused after removal but harmless; remove only if no remaining references.

#### Files Affected
| File | Change |
|------|--------|
| `client/src/context/ThemeContext.js` | Remove `system` from THEMES, allowed arrays, `cycleTheme`, `isSystemMode`; localStorage fallback |
| `client/src/components/admin/AdminLayout.jsx` | Remove System Mode button; drop `theme === 'system'` branches; fix `themeClass` |
| `client/src/components/admin/Sidebar.jsx` | Drop all `theme === 'system'` branches |
| `client/tailwind.config.js` | Optionally remove unused `system:` variant plugin |

---

### Phase 31 — Points Config "BAD REQUEST" Fix

#### Problem
`GET /api/web/settings/points` returns `400 Location required` when no location scope resolves, causing a console error on the Settings page and forcing an error-driven fallback in the Bulk Sessions modal.

#### Approach
Make the GET endpoint resilient: when `_scope_location_id(current_user)` is `None`, return `200` with the default config instead of `400`. This is safe because GET is read-only and the defaults match `BOTTLE_PRICING`. `PUT` remains strict (still requires a location to persist).

```python
# get_points_config — replace the 400 guard
loc_id = _scope_location_id(current_user)
DEFAULTS = {
    'smallWithLabel': 5, 'smallNoLabel': 3,
    'mediumWithLabel': 8, 'mediumNoLabel': 5,
    'largeWithLabel': 10, 'largeNoLabel': 7,
}
if not loc_id:
    return jsonify({'success': True, 'config': DEFAULTS}), 200
# ... existing per-org lookup unchanged ...
```

Client cleanup: in `bulk-sessions/page.js`, the `try/catch` around `getPointsConfig` can remain as defense-in-depth but will no longer trigger on the "All Locations" path. In `settings/page.js`, the `catch` block keeps the defensive fallback; the success path now resolves without logging.

#### Files Affected
| File | Change |
|------|--------|
| `server/app/controllers/settings_controller.py` | `get_points_config`: return 200 + defaults when no location scope |
| `client/app/admin/settings/page.js` | No behavior change required; verify console error gone |
| `client/app/admin/bulk-sessions/page.js` | Optional: simplify points-config fallback comment |

---

### Phase 32 & 33 — Import Features (Locations + Bulk Sessions)

#### Problem
Locations and Bulk Sessions need real file import (`.csv`, `.xls`, `.xlsx`) with format guidance. Placeholders already exist (tasks 15.2, 21.2).

#### Shared Approach (DRY)
- Add SheetJS (`xlsx`) to `client/package.json` — parses CSV/XLS/XLSX into JSON rows.
- Create a shared helper `client/src/lib/importFile.js`:
  - `parseSpreadsheet(file): Promise<{ rows: object[], headers: string[] }>` — reads the file via `FileReader`, parses the first sheet, returns header-keyed row objects.
  - Throws a typed error on unparseable/empty files for user-visible feedback.
- Create a shared `ImportHelp` UI affordance: an Info icon button that toggles a popover/tooltip describing required columns. Each feature passes its own column spec.

```js
// client/src/lib/importFile.js (signature contract)
import * as XLSX from 'xlsx';

export async function parseSpreadsheet(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new Error('No sheet found in file');
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    const headers = Object.keys(rows[0] || {});
    if (!rows.length) throw new Error('File contains no data rows');
    return { rows, headers };
}
```

#### Phase 32 — Location Import
- Add a "Import" control (button + hidden `<input type="file" accept=".csv,.xls,.xlsx">`) on `locations/page.js`, near the Add Location action / Community Groups tab.
- Map each parsed row to the ERD Location payload (Phase 4 mapping). Required columns: `name`, `full_name`, `type` (org type name), `status`, `street_address`, `city_municipality`, `first_name`, `last_name`. Optional: `barangay`, `province`, `region`, `zip_code`, `email`, `phone_number`.
- Validate each row with shared `validateField` rules; collect row-level errors into an error summary; submit valid rows (reuse existing create flow / loop `POST /locations`, or a batch call if added).
- Helper icon (`Info` from lucide) opens a popover listing the columns above.

| File | Change |
|------|--------|
| `client/app/admin/locations/page.js` | Import control, file handler, row mapping/validation, error summary, Info helper |
| `client/src/lib/importFile.js` | New shared parser (create) |

#### Phase 33 — Bulk Session Import
- Replace the CSV placeholder on the Items panel with a real "Import" control (same accept types).
- Map parsed rows to items: `itemType`, `condition`, `volumeMl`. Auto-calc `pointsAwarded` via existing `getAutoPoints(condition, volumeMl, pointsConfig)`.
- Append imported items to the current `items` array; report skipped invalid rows.
- Helper icon (`Info`) explains accepted values: item types, conditions (`With Label` / `No Label`), volumes.

| File | Change |
|------|--------|
| `client/app/admin/bulk-sessions/page.js` | Replace placeholder with import control, file handler, row→item mapping, Info helper |
| `client/src/lib/importFile.js` | Reuse shared parser |

#### Security / Validation Notes
- Parsing is client-side only; all imported rows still pass through existing server-side schema validation on create (no new trust boundary).
- Cap import size (e.g., reject > 1000 rows) to avoid UI freeze; surface a clear message.
- Reuse existing `validateField.js` rules so import validation matches manual-entry validation (DRY).

---
