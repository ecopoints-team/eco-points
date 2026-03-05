# EcoPoints Admin Dashboard — Comprehensive Audit Report

**Date:** March 5, 2026  
**Scope:** Website system only (Flask web controller + Next.js admin frontend). RPI controller excluded.  
**Files Scanned:** 30+ across `server/app/`, `client/app/admin/`, `client/src/Components/`, `client/src/context/`, `client/src/services/`, `client/src/data/`  
**ERD Status:** Updated ERD now matches `models.py` — added `org_types` table, `org_type_id` FK, `display_id` on users; removed `max_capacity` from rvms.

---

## Summary

| Severity    | Backend | Frontend | **Total** |
| ----------- | ------- | -------- | --------- |
| 🔴 Critical | 2       | 5        | **7**     |
| 🟡 Warning  | 19      | 24       | **43**    |
| 🔵 Info     | 5       | 16       | **21**    |
| **Total**   | **26**  | **45**   | **71**    |

---

# PART 1 — BACKEND (Flask Web Controller + Models)

## B1. Models — Schema Issues

| #   | File        | Line(s)  | Severity   | Description                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `models.py` | L57–58   | � Warning  | **`org_type_id` FK never populated.** `Organization` has both `org_type` (string) and `org_type_id` (FK to `org_types`). The `OrgType` lookup table exists and is managed by super-admin, but `create_location` only sets the string `org_type`, leaving `org_type_id = NULL` always. The controller should set `org_type_id` when creating/editing organizations to keep both in sync. |
| B2  | `models.py` | L113     | 🟡 Warning | Missing index on `Account.community_group_id` — joined in nearly every web controller query                                                                                                                                                                                                                                                                                             |
| B3  | `models.py` | L98      | 🟡 Warning | Missing index on `CommunityGroup.organization_id` — filtered in all location-scoped queries                                                                                                                                                                                                                                                                                             |
| B4  | `models.py` | L253–254 | 🟡 Warning | Missing index on `RecyclingSession.rvm_id` and `RecyclingSession.account_id` — used in bottle log + leaderboard joins                                                                                                                                                                                                                                                                   |
| B5  | `models.py` | L269     | 🟡 Warning | Missing index on `RecyclingItem.session_id` — joined in bottle log queries                                                                                                                                                                                                                                                                                                              |
| B6  | `models.py` | L246     | 🟡 Warning | Missing index on `RVM.organization_id` — filtered in machine, bottle-log, dashboard queries                                                                                                                                                                                                                                                                                             |
| B7  | `models.py` | L400     | 🟡 Warning | Missing index on `Reward.organization_id` — filtered in reward listing and reward-log queries                                                                                                                                                                                                                                                                                           |
| B8  | `models.py` | L147     | 🟡 Warning | Missing index on `User.account_id` — used in serialization lookups                                                                                                                                                                                                                                                                                                                      |
| B9  | `models.py` | L290–291 | 🟡 Warning | `MaintenanceLog.transaction_id` FK has no backref on `Transaction` — reverse lookup impossible via ORM                                                                                                                                                                                                                                                                                  |
| B10 | `models.py` | L37      | 🟡 Warning | `City.name` has no unique constraint — `create_city` only checks by name, so "San Jose, Bulacan" blocks "San Jose, Batangas"                                                                                                                                                                                                                                                            |

## B2. Web Controller — Query & Performance Issues

| #   | File                | Line(s)   | Severity    | Description                                                                                                                                                        |
| --- | ------------------- | --------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B11 | `web_controller.py` | L56–74    | 🔴 Critical | **Severe N+1 query in `_serialize_organization`.** Lazy-loads `community_groups → accounts → users → rvms` — up to 1000+ extra queries when listing organizations. |
| B12 | `web_controller.py` | L138–169  | 🔴 Critical | **N+1 in `_serialize_bottle_log`.** Chains `item.session → account → users → rvm → organization` on up to 500 items = up to 2500 extra queries.                    |
| B13 | `web_controller.py` | L207–229  | 🟡 Warning  | N+1 in `_serialize_admin_log` — up to 4 lazy loads per log × 500 logs                                                                                              |
| B14 | `web_controller.py` | L10       | 🔵 Info     | Unused import: `or_` from sqlalchemy — never referenced                                                                                                            |
| B15 | `web_controller.py` | L401–417  | 🟡 Warning  | `delete_org_type` doesn't check for referencing organizations — raw `IntegrityError` if FK exists                                                                  |
| B16 | `web_controller.py` | L456–469  | 🟡 Warning  | `delete_city` doesn't check for referencing organizations — same FK constraint issue                                                                               |
| B17 | `web_controller.py` | L718–749  | 🟡 Warning  | `update_user` doesn't validate email/username uniqueness — throws raw `IntegrityError` exposing SQL to client                                                      |
| B18 | `web_controller.py` | L802      | 🔵 Info     | `import uuid` inside function body — should be module-level                                                                                                        |
| B19 | `web_controller.py` | L988–1001 | 🟡 Warning  | Hardcoded `limit(500)` on all log endpoints (bottles, machines, access, rewards) — no pagination support                                                           |
| B20 | `web_controller.py` | L635–715  | 🟡 Warning  | `create_user` — no email/username format validation, accepts any string as email                                                                                   |
| B21 | `web_controller.py` | L297–363  | 🔵 Info     | `dashboard_stats` calls `.count()` 5 times on the same base query — could use a single `GROUP BY`                                                                  |
| B22 | `web_controller.py` | L562–577  | 🟡 Warning  | `delete_location` soft-deletes (sets Inactive) but doesn't deactivate child entities (users, machines, rewards remain active)                                      |
| B23 | `web_controller.py` | L493–526  | 🔵 Info     | `create_location` only creates a 'staff' default group — no college/shs_strand groups, so students can't be assigned                                               |

## B3. Auth Controller

| #   | File                 | Line(s)  | Severity   | Description                                                                          |
| --- | -------------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| B24 | `auth_controller.py` | L16      | 🟡 Warning | `TOKEN_EXPIRY_HOURS = 24` hardcoded — ignores `JWT_EXPIRY_HOURS` from app config/env |
| B25 | `auth_controller.py` | L73–100  | 🟡 Warning | No rate limiting on `/login` — allows unlimited password guessing                    |
| B26 | `auth_controller.py` | L126–143 | 🟡 Warning | Logout doesn't invalidate token server-side — stolen tokens valid for full 24h       |

## B4. App Factory & Config

| #   | File               | Line(s) | Severity   | Description                                                                                  |
| --- | ------------------ | ------- | ---------- | -------------------------------------------------------------------------------------------- |
| B27 | `__init__.py`      | L23     | 🟡 Warning | Default `SECRET_KEY = 'dev-key'` — if env var is unset in production, all JWTs can be forged |
| B28 | `__init__.py`      | L26     | 🔵 Info    | `JWT_EXPIRY_HOURS` config set but never consumed by any controller                           |
| B29 | `requirements.txt` | L7      | 🟡 Warning | `Flask-Login` listed but completely unused — app uses custom JWT auth                        |
| B30 | `requirements.txt` | All     | 🟡 Warning | No version pinning — production builds could pull incompatible future versions               |

---

# PART 2 — FRONTEND (Next.js Admin Dashboard)

## F1. Dead Code

### F1.1 Unused Imports — Icons

| #   | File                              | Import                                      | Severity | Description                                      |
| --- | --------------------------------- | ------------------------------------------- | -------- | ------------------------------------------------ |
| 1   | `app/admin/machines/page.js`      | `DollarSign`                                | 🔵 Info  | Imported from lucide-react but never used in JSX |
| 2   | `app/admin/machines/page.js`      | `AlertCircle`                               | 🔵 Info  | Imported but never rendered                      |
| 3   | `app/admin/users/page.js`         | `GraduationCap`                             | 🔵 Info  | Imported but never rendered                      |
| 4   | `app/admin/logs/access/page.js`   | `User, Clock, Globe, Activity, MapPin`      | 🔵 Info  | 5 icons imported but none used in JSX            |
| 5   | `app/admin/logs/bottles/page.js`  | `User, Clock, MapPin`                       | 🔵 Info  | 3 icons imported but none used in JSX            |
| 6   | `app/admin/logs/machines/page.js` | `Wrench, User, Clock, MapPin, CheckCircle2` | 🔵 Info  | 5 icons imported but none used in JSX            |
| 7   | `app/admin/logs/rewards/page.js`  | `Gift, User, MapPin`                        | 🔵 Info  | 3 icons imported but none used in JSX            |
| 8   | `app/admin/leaderboards/page.js`  | `TrendingUp, Info, Target, MapPin`          | 🔵 Info  | 4 icons imported but never rendered              |

### F1.2 Unused Imports — Components

| #   | File                                  | Import                  | Severity   | Description                                                                                                       |
| --- | ------------------------------------- | ----------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| 9   | `app/admin/profile/page.js`           | `AdminLayout` (default) | 🟡 Warning | Default import never used in JSX; layout is applied by `admin/layout.js`                                          |
| 10  | `app/admin/logs/access/page.js`       | `AdminLayout` (default) | 🟡 Warning | Same — dead import, layout comes from Next.js app router                                                          |
| 11  | `app/admin/logs/bottles/page.js`      | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 12  | `app/admin/logs/machines/page.js`     | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 13  | `app/admin/logs/rewards/page.js`      | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 14  | `app/admin/users/page.js`             | `AdminLayout` (default) | 🟡 Warning | Imports `AdminLayout, { ViewOnlyBanner, ViewOnlyWrapper }` — uses named exports but default `AdminLayout` is dead |
| 15  | `app/admin/users/permissions/page.js` | `AdminLayout` (default) | 🟡 Warning | Same pattern                                                                                                      |
| 16  | `app/admin/settings/page.js`          | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 17  | `app/admin/rewards/page.js`           | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 18  | `app/admin/machines/page.js`          | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |
| 19  | `app/admin/locations/page.js`         | `AdminLayout` (default) | 🟡 Warning | Same                                                                                                              |

> **Impact:** Every admin page imports `AdminLayout` default but none use it. The Next.js `app/admin/layout.js` wraps all pages via `AdminLayoutComponent`. These dead imports increase bundle treeshaking overhead.

### F1.3 Unused Functions / State

| #   | File                         | Line(s) | Severity   | Description                                                                                                                |
| --- | ---------------------------- | ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 20  | `app/admin/machines/page.js` | ~L400   | 🟡 Warning | `handleViewDetails` function defined but never called anywhere                                                             |
| 21  | `app/admin/rewards/page.js`  | ~L30    | 🟡 Warning | `sortOrder` state (`useState('Newest')`) declared but never read or used; actual sorting uses `sortColumn`/`sortDirection` |

### F1.4 Unused Service Files

| #   | File                          | Severity   | Description                                                                                                                                                                                                                              |
| --- | ----------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22  | `src/services/userService.js` | 🟡 Warning | Entire file is a duplicate of `apiService.users` — no file imports from it. All admin pages use `apiService.js`. Additionally, it does NOT attach auth tokens (no `Authorization` header), so it would fail on auth-protected endpoints. |

---

## F2. Runtime Errors / Bugs

### F2.1 Critical Bugs

| #   | File                          | Line(s)                | Severity        | Description                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ----------------------------- | ---------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 23  | `app/admin/locations/page.js` | L639, L645             | 🔴 **Critical** | **Temporal Dead Zone violation**: `useEffect(..., [refreshKey])` at L639 references `refreshKey` BEFORE its `const` declaration at L645. JavaScript's TDZ should cause a `ReferenceError: Cannot access 'refreshKey' before initialization` on every render. Fix: move `const [refreshKey, setRefreshKey] = useState(0)` above the `useEffect` that depends on it.                                                                  |
| 24  | `app/admin/users/page.js`     | L138, L155, L215, L517 | 🔴 **Critical** | **Status filter never matches**: API data is mapped to `status: u.isActive ? 'Active' : 'Inactive'` (L138), but filter dropdown options are `['Online', 'Offline']` (L155). Since no user ever has status `'Online'` or `'Offline'`, the status filter always returns zero results. The stat card `onlineUsers` (L215) always shows `0`. The Wifi/WifiOff icon (L517) always shows WifiOff since `user.status` is never `'Online'`. |

### F2.2 Data Loss Bugs

| #   | File                         | Line(s)                         | Severity        | Description                                                                                                                                                                                                                                |
| --- | ---------------------------- | ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 25  | `app/admin/settings/page.js` | ~L400                           | 🔴 **Critical** | `handleSave` just runs `alert('Settings saved!')` — **no API call**. All settings (general, points, notifications, security) are local state only. Everything is lost on page refresh. No settings API endpoint exists in `apiService.js`. |
| 26  | `app/admin/profile/page.js`  | ~L100                           | 🟡 Warning      | `handleSave` for profile shows an alert but does NOT call any API to persist name/email changes. Only `handleUpdatePassword` correctly calls `authApi.changePassword`. Profile image upload is also client-side only.                      |
| 27  | `app/admin/rewards/page.js`  | `handleDispense`, `adjustStock` | 🔴 **Critical** | Both `handleDispense` (decrements stock) and `adjustStock` (+1 stock) only update local state — **no API call to persist stock changes**. Stock resets to server value on page refresh.                                                    |
| 28  | `app/admin/machines/page.js` | `handleAddMaintenanceLog`       | 🟡 Warning      | Maintenance log modal adds logs to local state only. TODO comment indicates no API persistence. Maintenance logs are lost on refresh.                                                                                                      |

### F2.3 Logic Errors

| #   | File                             | Line(s)                | Severity   | Description                                                                                                                                                                                            |
| --- | -------------------------------- | ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 29  | `app/admin/logs/bottles/page.js` | Table row              | 🟡 Warning | Hardcoded fallback: `{log.locationName \|\| 'Arellano University'}` — if `locationName` is missing, it defaults to a specific institution name instead of `'—'` or dynamically resolving it.           |
| 30  | `app/admin/logs/rewards/page.js` | Machine column         | 🟡 Warning | The "Machine" column displays `{log.locationName \|\| '-'}` instead of the actual machine name. This is a copy-paste error — both "Machine" and "Location" columns show the same `locationName` value. |
| 31  | `app/admin/settings/page.js`     | `sendTestNotification` | 🔵 Info    | Uses `setTimeout` to fake a success notification — no actual API call. Misleads user into thinking the system can send notifications.                                                                  |

---

## F3. API Problems

| #   | File                             | Severity        | Description                                                                                                                                                                                                                        |
| --- | -------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 32  | `app/admin/settings/page.js`     | 🔴 **Critical** | No settings API exists. `apiService.js` has no `settings` namespace. The entire settings page (`handleSave`, bottle pricing, notifications, security) is non-functional.                                                           |
| 33  | `src/services/apiService.js`     | 🟡 Warning      | `request()` creates `new URL(endpoint, window.location.origin)` — will throw during SSR where `window` is undefined. All API calls must originate from client components only.                                                     |
| 34  | `src/services/apiService.js`     | 🔵 Info         | The 401 handler silently redirects to `/?login=true` and clears the token. There is no token refresh mechanism — if the JWT expires during an active session, the user is kicked out without warning.                              |
| 35  | `src/Components/AdminLayout.jsx` | 🟡 Warning      | Notifications load ALL access logs (`logsApi.getAccess(effectiveLocationId)`) then `.slice(0, 10)`. No pagination/limit parameter is sent — the server returns the full dataset just to show 10 items.                             |
| 36  | `src/services/rpiService.js`     | 🔵 Info         | Bypasses the centralized `apiService.request()` helper. Uses raw `fetch()` with hardcoded `API_BASE_URL` and no auth token attachment. This is intentional for RPI device communication but inconsistent with the web API pattern. |

---

## F4. Component Issues

| #   | File                             | Severity   | Description                                                                                                                                                                                                     |
| --- | -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 37  | `src/Components/AdminLayout.jsx` | 🟡 Warning | `ADMIN_ROLES` array is defined inside the component function body — creates a new array reference on every render. Should be a module-level constant.                                                           |
| 38  | `src/Components/AdminLayout.jsx` | 🟡 Warning | `readNotifications` state is never persisted (localStorage or API). On every page refresh, all notifications revert to "unread".                                                                                |
| 39  | `src/Components/AdminLayout.jsx` | 🔵 Info    | Uses both `React.useRef(null)` (for `profileRef`) and `useRef(null)` (for `notificationRef`) — inconsistent import usage within the same file.                                                                  |
| 40  | `src/Components/Sidebar.jsx`     | 🔵 Info    | `navStructure` array is recreated on every render and used in a `useEffect` without being in the dependency array — stale closure risk. Should be memoized with `useMemo` or extracted outside the component.   |
| 41  | `app/admin/rewards/page.js`      | 🔵 Info    | Bottom pagination uses `Array.from({ length: Math.min(totalPages, 5) })` instead of the `getPageNumbers()` function with ellipsis used in all other pages — inconsistent UX when rewards table exceeds 5 pages. |
| 42  | `app/admin/leaderboards/page.js` | 🔵 Info    | Debug `console.log` statements left in production code at L256 and L258: `console.log('[Leaderboard] Fetching...')` and `console.log('[Leaderboard] API response:', ...)`.                                      |

---

## F5. Context Issues

| #   | File                          | Severity   | Description                                                                                                                                                                                                                 |
| --- | ----------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 43  | `src/context/AuthContext.js`  | 🟡 Warning | `enrichUser()` attaches hardcoded permission matrices from `mockData.ROLES` to every user. If the backend ever returns permissions, this client-side enrichment could override or conflict with server-defined permissions. |
| 44  | `src/context/ThemeContext.js` | 🔵 Info    | The `'system'` theme mode does NOT read the OS `prefers-color-scheme` preference — it's just a custom green "hacker" theme. The name is misleading; consider renaming to `'eco'` or `'forest'`.                             |

---

## F6. Mock Data Usage

The project has migrated to real API calls (`apiService.js`) but still actively imports mock data in several critical files:

| #   | File                                     | Imports Used                         | Severity   | Description                                                                                                                                                                                              |
| --- | ---------------------------------------- | ------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 45  | `src/context/AuthContext.js`             | `ROLES`                              | 🟡 Warning | Used in `enrichUser()` to attach permission objects. This is the **single source of all role-based permissions** client-side. If a new role is added on the backend, this file must be manually updated. |
| 46  | `src/Components/AdminLayout.jsx`         | `ROLES`                              | 🔵 Info    | Used for display only: role name and color badge in the profile dropdown.                                                                                                                                |
| 47  | `app/admin/locations/page.js`            | `CITIES`, `getCityName`              | 🟡 Warning | City dropdown in Add/Edit location modals uses hardcoded CITIES array from mock data instead of fetching from `apiService.cities.getAll()` (which exists).                                               |
| 48  | `app/admin/users/page.js`                | `getDepartmentName`                  | 🔵 Info    | Used for department column display — resolves abbreviation from mock DEPARTMENTS.                                                                                                                        |
| 49  | `app/admin/leaderboards/page.js`         | `DEPARTMENTS`, `getDepartmentName`   | 🔵 Info    | Used to display department abbreviation in leaderboard table.                                                                                                                                            |
| 50  | `src/Components/AddRegularUserModal.jsx` | `SHS_STRANDS`, `COLLEGE_DEPARTMENTS` | 🟡 Warning | SHS strand and college department dropdowns use hardcoded arrays from mock data. Not fetched from any API endpoint.                                                                                      |
| 51  | `app/admin/settings/page.js`             | `BOTTLE_PRICING`                     | 🔵 Info    | Default values for the points configuration section. Moot since settings aren't persisted anyway (see finding #32).                                                                                      |

### Mock Data File Overhead

`src/data/mockData.js` (654 lines) still generates 200 fake users, 500 bottle logs, 100 admin logs, 50 machine logs, and 100 reward logs on import. While these generated datasets (`USERS`, `BOTTLE_LOGS`, `MACHINE_LOGS`, `ADMIN_LOGS`, `REWARDS_LOGS`) are no longer imported by any page, the file IS imported for its constants (`ROLES`, `DEPARTMENTS`, `CITIES`, `BOTTLE_PRICING`). The random data generation code runs on every import, wasting CPU cycles.

**Recommendation:** Extract the still-used constants (`ROLES`, `DEPARTMENTS`, `CITIES`, `BOTTLE_PRICING`, `SHS_STRANDS`, `COLLEGE_DEPARTMENTS`) into a lean `constants.js` file. Delete or move the unused generated data.

---

---

# PART 3 — CROSS-CUTTING CONCERNS

## C1. Duplicated Code Patterns

- **Pagination logic** (`getPageNumbers`, `handleFilterChange`, `clearFilters`, `hasActiveFilters`, `SortIcon`, `handleSort`) is copy-pasted across all 8 table-based pages. Consider extracting into a `useTableControls()` custom hook.
- **CSV export** (`exportToCSV`) is duplicated in all 4 log pages. Should be a shared utility.
- **Location-scoped data loading** pattern (useEffect with `effectiveLocationId` + `refreshKey` + cancelled flag) is identical across 10+ pages. Extract into a `useLocationData(apiFn)` hook.

## C2. Security Notes

- `mockData.js` contains plaintext passwords (`password: 'test123'`) for all mock admin users.
- `userService.js` makes unauthenticated API calls (no JWT token) — if accidentally imported, it would expose user data without auth.

---

---

# PRIORITIZED FIX LIST

## Immediate (Critical — 8 items)

| Priority | Area     | Fix                                                                                                                           |
| -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1        | Frontend | **Fix `refreshKey` TDZ** in `locations/page.js` — move useState declaration above the useEffect                               |
| 2        | Frontend | **Fix status filter mismatch** in `users/page.js` — change filter options to `['Active', 'Inactive']`                         |
| 3        | Frontend | **Add stock persistence API calls** in `rewards/page.js` — `handleDispense`/`adjustStock` must call API                       |
| 4        | Frontend | **Add settings API** or mark settings page as "Coming Soon"                                                                   |
| 5        | Backend  | **Fix N+1 query storm** in `_serialize_organization` — add `joinedload()` for nested relations                                |
| 6        | Backend  | **Fix N+1 query storm** in `_serialize_bottle_log` — add eager loading for session chain                                      |
| 7        | Backend  | **Sync `org_type_id` FK** — `create_location`/`update_location` should set `org_type_id` from the `OrgType` table when saving |
| 8        | Backend  | **Set strong random SECRET_KEY** or fail loudly if env var is unset                                                           |

## Short-Term (Warnings — top 12)

| Priority | Area     | Fix                                                                            |
| -------- | -------- | ------------------------------------------------------------------------------ |
| 9        | Backend  | Add **7 missing database indexes** on foreign key columns (B2–B8)              |
| 10       | Backend  | Add FK reference checks before deleting org types and cities (B15, B16)        |
| 11       | Backend  | Add email/username uniqueness validation in `update_user` (B17)                |
| 12       | Backend  | Add pagination support to log endpoints — replace hardcoded `limit(500)` (B19) |
| 13       | Frontend | Remove 11 dead `AdminLayout` default imports + 20+ unused icon imports         |
| 14       | Frontend | Replace `CITIES` mock data with `apiService.cities.getAll()` in locations page |
| 15       | Frontend | Add API persistence for profile edits and maintenance logs                     |
| 16       | Frontend | Fix rewards log "Machine" column — copy-paste error showing `locationName`     |
| 17       | Frontend | Extract constants from `mockData.js` into a lean `constants.js`                |
| 18       | Backend  | Add rate limiting on login endpoint (B25)                                      |
| 19       | Backend  | Implement token blacklist for logout / add token refresh (B26)                 |
| 20       | Backend  | Cascade soft-delete to child entities when deactivating a location (B22)       |

## Long-Term (Architecture — Info)

| Priority | Area     | Fix                                                                        |
| -------- | -------- | -------------------------------------------------------------------------- |
| 21       | Frontend | Extract shared table logic (pagination, sort, export) into custom hooks    |
| 22       | Frontend | Add token refresh mechanism to AuthContext                                 |
| 23       | Frontend | Delete `userService.js` (dead file)                                        |
| 24       | Frontend | Remove debug `console.log` from leaderboards page                          |
| 25       | Frontend | Rename "system" theme to "eco" or "forest" (misleading name)               |
| 26       | Backend  | Add input validation schema (marshmallow/pydantic) to all endpoints        |
| 27       | Backend  | Add pagination to all list endpoints (users, machines, rewards, locations) |
| 28       | Backend  | Remove unused `Flask-Login` dependency + pin all package versions          |
