# Model ↔ Admin_UI Field Alignment (Phase 3)

> **Source of truth.** Authored under task 8.1 of `phased-platform-hardening` to
> drive tasks 8.2 (server serializer updates), 8.3 (client UI updates with
> empty-state fallbacks), and 8.4 (typed JSON schemas in
> `api_routes_documentation.md`).
>
> **Methodology.** For each Admin_UI page in the Phase 3 enumerated set, the
> table below lists the GET endpoint the page calls, the response keys the page
> reads, the keys the endpoint currently returns (per
> `server/app/controllers/_shared.py` and the per-domain controllers), the type
> per field using the Requirement 3.5 taxonomy, and a resolution per row.
>
> **Resolution taxonomy** (one of):
> - `aligned` — page reads exactly what the endpoint returns; no change.
> - `rename serializer key` — server returns the value under a different key;
>   rename the serializer output to match the UI key (Phase 3 task 8.2).
> - `add derived field` — value is not currently in the response shape; compute
>   it server-side and add the key (Phase 3 task 8.2).
> - `render empty-state` — field is genuinely optional or location-only; the
>   page must render a defined placeholder (e.g. `—`) rather than `undefined`
>   when absent (Phase 3 task 8.3, Requirement 3.4).
>
> **Type taxonomy** (Requirement 3.5):
> `string | integer | number | boolean | iso8601_datetime | enum<…> | array<…> | object`.
>
> **Conventions used below.**
> - Page paths are relative to `client/app/admin/` except `profile` which is
>   `client/app/profile/page.js` rendering `client/src/components/pages/ProfileSection.jsx`.
> - Endpoint paths are absolute (`/api/web/...`).
> - When an endpoint envelopes its payload (e.g. `{ success, locations: [...] }`),
>   the table lists the fields of the array element / payload object — the
>   envelope wrapper is uniform across endpoints and tracked separately as part
>   of Property D, not here.

---

## 1. analytics

- **Page:** `analytics/page.js`
- **GET endpoint:** `GET /api/web/analytics` → `{ success, analytics: { … } }`
- **Source:** `server/app/controllers/analytics_controller.py::get_analytics`

The analytics page is the most complex page; the `analytics` object aggregates
eleven datasets. Field-by-field mapping per dataset:

### 1.a `analytics.recyclingTrends[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `month` | `month` | `string` (`YYYY-MM`) | aligned |
| analytics | `/api/web/analytics` | `accepted` | `accepted` | `integer` | aligned |
| analytics | `/api/web/analytics` | `rejected` | `rejected` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `total` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `points` | `integer` | aligned |

### 1.b `analytics.dailyTrends[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `dow` | `dow` | `integer` (0=Sun … 6=Sat) | aligned |
| analytics | `/api/web/analytics` | `accepted` | `accepted` | `integer` | aligned |
| analytics | `/api/web/analytics` | `rejected` | `rejected` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `day` | `string` (`YYYY-MM-DD`) | aligned |
| analytics | `/api/web/analytics` | (unused) | `total` | `integer` | aligned |

### 1.c `analytics.userGrowth`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `userGrowth.months[].month` | `userGrowth.months[].month` | `string` (`YYYY-MM`) | aligned |
| analytics | `/api/web/analytics` | `userGrowth.months[].count` | `userGrowth.months[].count` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `userGrowth.baseline` | `integer` | aligned |

### 1.d `analytics.pointsEconomy[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `month` | `month` | `string` (`YYYY-MM`) | aligned |
| analytics | `/api/web/analytics` | `type` | `type` | `enum<earn,redeem,adjustment,bulk_transaction>` | aligned |
| analytics | `/api/web/analytics` | `amount` | `amount` | `integer` | aligned |

### 1.e `analytics.machineUtilization[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `name` | `name` | `string` | aligned |
| analytics | `/api/web/analytics` | `itemCount` | `itemCount` | `integer` | aligned |
| analytics | `/api/web/analytics` | `sessionCount` | `sessionCount` | `integer` | aligned |
| analytics | `/api/web/analytics` | `isOnline` | `isOnline` | `boolean` | aligned |
| analytics | `/api/web/analytics` | `organizationId` | `organizationId` | `integer` | aligned |
| analytics | `/api/web/analytics` | `organizationName` | `organizationName` | `string` | aligned |

### 1.f `analytics.peakHours[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `hour` | `hour` | `integer` (0…23) | aligned |
| analytics | `/api/web/analytics` | `count` | `count` | `integer` | aligned |

### 1.g `analytics.peakDays[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `day` | `day` | `enum<Sun,Mon,Tue,Wed,Thu,Fri,Sat>` | aligned |
| analytics | `/api/web/analytics` | `count` | `count` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `dayIndex` | `integer` | aligned |

### 1.h `analytics.userTypeDistribution[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `type` | `type` | `enum<student,faculty,staff,Unknown>` | aligned |
| analytics | `/api/web/analytics` | `count` | `count` | `integer` | aligned |

### 1.i `analytics.conditionDistribution[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `condition` | `condition` | `enum<Accepted,Rejected,Unknown>` | aligned |
| analytics | `/api/web/analytics` | `count` | `count` | `integer` | aligned |

### 1.j `analytics.rewardInsights[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `name` | `name` | `string` | aligned |
| analytics | `/api/web/analytics` | `redemptionCount` | `redemptionCount` | `integer` | aligned |
| analytics | `/api/web/analytics` | `totalPointsSpent` | `totalPointsSpent` | `integer` | aligned |
| analytics | `/api/web/analytics` | `pointsRequired` | `pointsRequired` | `integer` | aligned |

### 1.k `analytics.locationComparison[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `name` | `name` | `string` | aligned |
| analytics | `/api/web/analytics` | `bottles` | `bottles` | `integer` | aligned |
| analytics | `/api/web/analytics` | `points` | `points` | `integer` | aligned |
| analytics | `/api/web/analytics` | `users` | `users` | `integer` | aligned |
| analytics | `/api/web/analytics` | `orgType` (used by client filter) | (missing) | `string` | **add derived field** — populate from `Organization.org_type_ref.name` |

### 1.l `analytics.summary`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| analytics | `/api/web/analytics` | `summary.totalItems` | `summary.totalItems` | `integer` | aligned |
| analytics | `/api/web/analytics` | `summary.totalPoints` | `summary.totalPoints` | `integer` | aligned |
| analytics | `/api/web/analytics` | `summary.totalSessions` | `summary.totalSessions` | `integer` | aligned |
| analytics | `/api/web/analytics` | `summary.totalRedemptions` | `summary.totalRedemptions` | `integer` | aligned |
| analytics | `/api/web/analytics` | `summary.totalUsers` | `summary.totalUsers` | `integer` | aligned |
| analytics | `/api/web/analytics` | (unused) | `summary.avgPointsPerSession` | `number` | aligned |
| analytics | `/api/web/analytics` | (unused) | `summary.avgItemsPerSession` | `number` | aligned |

---

## 2. bulk-sessions

- **Page:** `bulk-sessions/page.js`
- **GET endpoint:** `GET /api/web/sessions/bulk` → `{ success, sessions: [...] }`
- **Source:** `server/app/controllers/sessions_controller.py::get_bulk_sessions`,
  `_serialize_bulk_session`.

The page also calls `/api/web/machines`, `/api/web/users`, and
`/api/web/settings/points` to populate the "create session" modal — those are
not GET-list endpoints driving the page's main table, so they are tracked
under their own page sections (3, 13, 12) for alignment.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| bulk-sessions | `/api/web/sessions/bulk` | `id` | `id` | `integer` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `userName` | `userName` | `string` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `userEmail` | `userEmail` | `string` (nullable) | render empty-state |
| bulk-sessions | `/api/web/sessions/bulk` | `machineName` | `machineName` | `string` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `itemCount` | `itemCount` | `integer` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `totalPointsEarned` | `totalPointsEarned` | `integer` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `notes` | (missing) | `string` (nullable) | **add derived field** — `RecyclingSession` has no `notes` column today; sourced from the modal but not persisted on the model. Either persist `notes` on `recycling_sessions` (small migration in 8.2) or ensure the serializer returns `null` so the empty-state placeholder (`-`) renders. |
| bulk-sessions | `/api/web/sessions/bulk` | `startTime` | `startTime` | `iso8601_datetime` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | `status` | `status` | `enum<active,completed,timed_out,error>` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | (unused) | `userId` | `integer` (nullable) | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | (unused) | `machineId` | `integer` (nullable) | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | (unused) | `locationId` | `integer` (nullable) | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | (unused) | `locationName` | `string` | aligned |
| bulk-sessions | `/api/web/sessions/bulk` | (unused) | `endTime` | `iso8601_datetime` (nullable) | aligned |

---

## 3. leaderboards

- **Page:** `leaderboards/page.js`
- **GET endpoint:** `GET /api/web/leaderboard` → `{ success, topUsers: [...], topGroups: [...] }`
- **Source:** `server/app/controllers/leaderboard_controller.py::get_leaderboard`.

### 3.a `topUsers[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| leaderboards | `/api/web/leaderboard` | `id` | `id` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | `name` | `name` | `string` | aligned |
| leaderboards | `/api/web/leaderboard` | `points` | `points` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | `streak` | `streak` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | `bottlesCollected` | `bottlesCollected` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | `userType` | `userType` | `enum<student,faculty,staff>` (nullable) | render empty-state |
| leaderboards | `/api/web/leaderboard` | `department` | `department` | `string` (nullable) | render empty-state |
| leaderboards | `/api/web/leaderboard` | `groupType` | `groupType` | `string` (nullable) | render empty-state |
| leaderboards | `/api/web/leaderboard` | `locationId` | `locationId` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | `locationName` | `locationName` | `string` | aligned |
| leaderboards | `/api/web/leaderboard` | (unused) | `lifetimePoints` | `integer` | aligned |

### 3.b `topGroups[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `id` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `name` | `string` | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `abbreviation` | `string` (nullable) | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `groupType` | `string` (nullable) | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `locationId` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `totalPoints` | `integer` | aligned |
| leaderboards | `/api/web/leaderboard` | (used by `Sidebar`/future) | `memberCount` | `integer` | aligned |

---

## 4. locations

- **Page:** `locations/page.js`
- **GET endpoint:** `GET /api/web/locations` → `{ success, locations: [...] }`
- **Source:** `server/app/controllers/locations_controller.py::get_locations`,
  `_shared.py::_serialize_organization`.
- **Companion endpoint:** `GET /api/web/org-types` populates the type dropdown
  (id/name pairs); covered by section 4.b.

### 4.a `locations[]`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| locations | `/api/web/locations` | `id` | `id` | `integer` | aligned |
| locations | `/api/web/locations` | `name` | `name` | `string` | aligned |
| locations | `/api/web/locations` | `fullName` | `fullName` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `orgType` | `orgType` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `streetAddress` | `streetAddress` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `barangay` | `barangay` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `cityName` | `cityName` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `zipCode` | `zipCode` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `cityId` (sent on PUT, expected on GET for preselect) | (missing) | `integer` | **add derived field** — populate from `OrgAddress.city_municipality` lookup against the static `CITIES` list, OR drop the city-id concept entirely and key the dropdown off `cityName`. Track decision in 8.2. |
| locations | `/api/web/locations` | `contactPerson` | `contactPerson` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `contactEmail` | `contactEmail` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `contactPhone` | `contactPhone` | `string` (nullable) | render empty-state |
| locations | `/api/web/locations` | `status` | `status` | `enum<Active,Inactive>` | aligned |
| locations | `/api/web/locations` | `machineCount` | `machineCount` | `integer` | aligned |
| locations | `/api/web/locations` | `userCount` | `userCount` | `integer` | aligned |
| locations | `/api/web/locations` | `totalPoints` | `totalPoints` | `integer` | aligned |
| locations | `/api/web/locations` | `joinDate` (from create flow) / `createdAt` | `createdAt` | `iso8601_datetime` | **rename serializer key** — page expects `joinDate` for new rows it just inserted; either rename the page's local key to `createdAt` or expose a derived `joinDate` mirroring `createdAt`. The simpler path is to align the page on `createdAt` (Phase 3 task 8.3) and leave the serializer alone. |
| locations | `/api/web/locations` | (unused, reserved for future) | `address`, `contacts[]`, `typeId` | `object`, `array<object>`, `integer` | aligned |

### 4.b `GET /api/web/org-types` (companion lookup)

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| locations | `/api/web/org-types` | `id` | `id` | `integer` | aligned |
| locations | `/api/web/org-types` | `name` | `name` | `string` | aligned |

---

## 5. logs/access

- **Page:** `logs/access/page.js`
- **GET endpoint:** `GET /api/web/logs/access` → `{ success, logs: [...] }`
- **Source:** `server/app/controllers/logs_controller.py::get_access_logs`,
  `_shared.py::_serialize_admin_log`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| logs/access | `/api/web/logs/access` | `id` | `id` | `integer` | aligned |
| logs/access | `/api/web/logs/access` | `adminUserId` | `adminUserId` | `integer` (nullable) | render empty-state |
| logs/access | `/api/web/logs/access` | `adminName` | `adminName` | `string` | aligned |
| logs/access | `/api/web/logs/access` | `adminRole` | `adminRole` | `enum<superadmin,head_admin,auditor,technician,inventory_officer,user,dependent>` | aligned |
| logs/access | `/api/web/logs/access` | `action` | `action` | `string` | aligned |
| logs/access | `/api/web/logs/access` | `target` | `target` | `string` (nullable) | render empty-state |
| logs/access | `/api/web/logs/access` | `category` | `category` | `string` (nullable) | render empty-state |
| logs/access | `/api/web/logs/access` | `notes` | `notes` | `string` (JSON envelope; nullable) | **rename serializer key** — `notes` currently carries the Phase 2 `log_action` envelope (JSON-encoded `before/after/ip/user_agent/notes`). The UI displays it raw, which is human-unreadable. Either expose the human-friendly note as `notes` and move the envelope to a new `meta` key, or split the envelope columns out (planned in `_shared.py` TODO `phase4-audit-split`). Phase 3 8.2 should at minimum return the inner `notes` string under `notes` and the rest under `meta`. |
| logs/access | `/api/web/logs/access` | `timestamp` | `timestamp` | `iso8601_datetime` | aligned |
| logs/access | `/api/web/logs/access` | `locationId` | `locationId` | `integer` (nullable, global actions) | render empty-state |
| logs/access | `/api/web/logs/access` | `locationName` | `locationName` | `string` (defaults to `"Global"`) | aligned |

---

## 6. logs/bottles

- **Page:** `logs/bottles/page.js`
- **GET endpoint:** `GET /api/web/logs/bottles` → `{ success, logs: [...] }`
- **Source:** `server/app/controllers/logs_controller.py::get_bottle_logs`,
  `_shared.py::_serialize_bottle_log`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| logs/bottles | `/api/web/logs/bottles` | `id` | `id` | `integer` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `userId` | `userId` | `integer` (nullable) | render empty-state |
| logs/bottles | `/api/web/logs/bottles` | `userName` | `userName` | `string` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `userEmail` | `userEmail` | `string` (nullable) | render empty-state |
| logs/bottles | `/api/web/logs/bottles` | `machineName` | `machineName` | `string` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `locationId` | `locationId` | `integer` (nullable) | aligned |
| logs/bottles | `/api/web/logs/bottles` | `locationName` | `locationName` | `string` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `pointsAwarded` | `pointsAwarded` | `integer` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `status` | `status` | `enum<Accepted,Rejected>` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `timestamp` | `timestamp` | `iso8601_datetime` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `volumeMl` | (missing) | `integer` (nullable) | **add derived field** — `RecyclingItem` has no `volume_ml` column; the page derives "Small/Medium/Large" tiers from this number and the bulk-session UI sends it on POST. Add a `volume_ml` column to `recycling_items` (migration in task 8.2) and surface it in `_serialize_bottle_log` as `volumeMl`. Until the migration lands, return `null` and have the page render the empty-state size label. |
| logs/bottles | `/api/web/logs/bottles` | `condition` | (missing) | `enum<With Label,No Label,Rejected>` | **add derived field** — derive from `RecyclingItem.detected_class` (e.g., classes ending in `_with_label` map to `"With Label"`) or add an explicit `condition` column. Default to `null` and render the empty-state badge until 8.2 ships the data path. |
| logs/bottles | `/api/web/logs/bottles` | `brand` (used in CSV export) | (missing) | `string` (nullable) | **add derived field** — same status as `volumeMl`/`condition`; not yet on the model. Return `null` and render `-` in the export until 8.2 decides whether to track brand. |
| logs/bottles | `/api/web/logs/bottles` | `sessionId` | `sessionId` | `integer` | aligned |
| logs/bottles | `/api/web/logs/bottles` | `sessionType` | (missing) | `enum<rvm,bulk>` | **add derived field** — populate by joining `RecyclingSession` and inspecting whether the session was created via `/api/rpi/session/start` (rvm) or `/api/web/sessions/bulk` (bulk). Until then, page must render the empty-state badge (skip the BULK pill). |
| logs/bottles | `/api/web/logs/bottles` | `bottleType` (used in search filter only) | (missing) | `string` | **add derived field** — derived from `volumeMl` size tier on the client today; once `volumeMl` lands, the page can drop this filter or compute it locally. Mark `aligned` once the page is updated to filter on `volumeMl` (8.3). |
| logs/bottles | `/api/web/logs/bottles` | (unused) | `machineId`, `confidenceScore`, `detectedClass`, `scannedAt` | `integer`, `number`, `string`, `iso8601_datetime` | aligned |

---

## 7. logs/machines

- **Page:** `logs/machines/page.js`
- **GET endpoint:** `GET /api/web/logs/machines` → `{ success, logs: [...] }`
- **Source:** `server/app/controllers/logs_controller.py::get_machine_logs`,
  `_shared.py::_serialize_machine_log`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| logs/machines | `/api/web/logs/machines` | `id` | `id` | `integer` | aligned |
| logs/machines | `/api/web/logs/machines` | `rvmId` | `rvmId` | `integer` | aligned |
| logs/machines | `/api/web/logs/machines` | `machineName` | `machineName` | `string` | aligned |
| logs/machines | `/api/web/logs/machines` | `locationId` | `locationId` | `integer` (nullable) | render empty-state |
| logs/machines | `/api/web/logs/machines` | `locationName` | `locationName` | `string` | aligned |
| logs/machines | `/api/web/logs/machines` | `performedBy` | `performedBy` | `string` | aligned |
| logs/machines | `/api/web/logs/machines` | `actionType` | `actionType` | `string` | aligned |
| logs/machines | `/api/web/logs/machines` | `resolved` | `resolved` | `boolean` (derived from `status == 'Resolved'`) | aligned |
| logs/machines | `/api/web/logs/machines` | `notes` | `notes` | `string` (nullable) | render empty-state |
| logs/machines | `/api/web/logs/machines` | `timestamp` | `timestamp` | `iso8601_datetime` | aligned |
| logs/machines | `/api/web/logs/machines` | `technician` (label only) | (missing) | `string` | **add derived field** — currently the page maps `performedBy → technician` on the client. Either rename the serializer key (`performedBy → technician`) or, simpler, leave `performedBy` and update the page in 8.3 to read `performedBy` directly. Recommendation: align the page on `performedBy` (Phase 3 8.3). |
| logs/machines | `/api/web/logs/machines` | (unused) | `performedById`, `status` | `integer`, `enum<Resolved,Pending,Cancelled>` | aligned |

---

## 8. logs/rewards

- **Page:** `logs/rewards/page.js`
- **GET endpoint:** `GET /api/web/logs/rewards` → `{ success, logs: [...] }`
- **Source:** `server/app/controllers/logs_controller.py::get_reward_logs`,
  `_shared.py::_serialize_reward_log`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| logs/rewards | `/api/web/logs/rewards` | `id` | `id` | `integer` | aligned |
| logs/rewards | `/api/web/logs/rewards` | `userName` | `userName` | `string` | aligned |
| logs/rewards | `/api/web/logs/rewards` | `userEmail` | `userEmail` | `string` (nullable) | render empty-state |
| logs/rewards | `/api/web/logs/rewards` | `rewardName` | `rewardName` | `string` | aligned |
| logs/rewards | `/api/web/logs/rewards` | `pointsCost` | `pointsSpent` | `integer` | **rename serializer key** — page reads `pointsCost` (mapped from `pointsSpent` on the client today). Either expose `pointsCost` as a parallel key or, simpler, rename the page's local field to `pointsSpent` (Phase 3 8.3). Recommendation: align the page on `pointsSpent`. |
| logs/rewards | `/api/web/logs/rewards` | `redemptionCode` | `redemptionCode` | `string` | aligned |
| logs/rewards | `/api/web/logs/rewards` | `status` | `status` | `enum<pending,claimed,used,expired>` | aligned |
| logs/rewards | `/api/web/logs/rewards` | `timestamp` (page derives from `redeemedAt`/`usedAt`) | `redeemedAt` | `iso8601_datetime` (nullable) | **rename serializer key** — page expects a single canonical `timestamp`. Add a `timestamp` derived field to the serializer (`= claimed_at or redeemed_at`) so the UI does not have to fall back. Keep `redeemedAt` and `claimedAt` for finer detail. |
| logs/rewards | `/api/web/logs/rewards` | `usedAt` (used in the status-update response handler) | (missing) | `iso8601_datetime` (nullable) | **add derived field** — the model has no `used_at`; today the controller stamps `claimed_at` on `pending → claimed`. Either rename the page reference to `claimedAt` (preferred — done in 8.3) or add a `usedAt` synonym in the serializer. |
| logs/rewards | `/api/web/logs/rewards` | `locationId` | `locationId` | `integer` (nullable) | render empty-state |
| logs/rewards | `/api/web/logs/rewards` | `locationName` | `locationName` | `string` (nullable) | render empty-state |
| logs/rewards | `/api/web/logs/rewards` | (unused) | `walletId`, `variantId`, `rewardId`, `variantName`, `claimedAt` | `integer`, `integer`, `integer`, `string`, `iso8601_datetime` | aligned |

---

## 9. logs/transactions

- **Page:** `logs/transactions/page.js`
- **GET endpoint:** `GET /api/web/logs/transactions` → `{ success, logs: [...] }`
- **Source:** inline serialization in `logs_controller.py::get_transaction_logs`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| logs/transactions | `/api/web/logs/transactions` | `id` | `id` | `integer` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `userName` | `userName` | `string` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `userEmail` | `userEmail` | `string` (nullable) | render empty-state |
| logs/transactions | `/api/web/logs/transactions` | `transactionType` | `transactionType` | `enum<earn,redeem,adjustment,bulk_transaction>` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `amount` | `amount` | `integer` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `balanceBefore` | `balanceBefore` | `integer` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `balanceAfter` | `balanceAfter` | `integer` | aligned |
| logs/transactions | `/api/web/logs/transactions` | `description` | (missing) | `string` (nullable) | **add derived field** — there is no `description` column on `transactions`; the page renders an empty placeholder today via the `\|\| '—'` fallback, which is correct UI but the field should be present in the JSON schema. Either compute a derived description from `(transaction_type, reference_type, reference_id)` (e.g., `"Reward redemption #42"`) or document it as always-null. Recommendation: derive a human-readable summary in the serializer (Phase 3 8.2). |
| logs/transactions | `/api/web/logs/transactions` | `referenceId` | `referenceId` | `integer` (nullable) | render empty-state |
| logs/transactions | `/api/web/logs/transactions` | `locationId` | `locationId` | `integer` (nullable) | render empty-state |
| logs/transactions | `/api/web/logs/transactions` | `locationName` | `locationName` | `string` (nullable) | render empty-state |
| logs/transactions | `/api/web/logs/transactions` | `timestamp` | `timestamp` | `iso8601_datetime` | aligned |
| logs/transactions | `/api/web/logs/transactions` | (unused) | `walletId`, `referenceType` | `integer`, `string` | aligned |

---

## 10. machines

- **Page:** `machines/page.js`
- **GET endpoint:** `GET /api/web/machines` → `{ success, machines: [...], pagination }`
- **Source:** `server/app/controllers/machines_controller.py::get_machines`,
  `_shared.py::_serialize_rvm`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| machines | `/api/web/machines` | `id` | `id` | `integer` | aligned |
| machines | `/api/web/machines` | `machineUuid` | `machineUuid` | `string` (UUID) | aligned |
| machines | `/api/web/machines` | `name` | `name` | `string` | aligned |
| machines | `/api/web/machines` | `locationId` | `locationId` | `integer` | aligned |
| machines | `/api/web/machines` | `locationName` | `locationName` | `string` (nullable; the area placement, e.g. "Main Lobby") | render empty-state |
| machines | `/api/web/machines` | `orgName` | `orgName` | `string` (nullable) | render empty-state |
| machines | `/api/web/machines` | `isOnline` | `isOnline` | `boolean` | aligned |
| machines | `/api/web/machines` | `isCapacityFull` (consumed indirectly via maintenance modal status badge) | `isCapacityFull` | `boolean` (nullable on legacy rows) | render empty-state |
| machines | `/api/web/machines` | `createdAt` (used in detail views) | `createdAt` | `iso8601_datetime` | aligned |
| machines | `/api/web/machines` | `currentCapacity` (set by AddMachine modal default; expected on read for the bin-status indicator) | (missing) | `integer` | **add derived field** — `RVM` has no `current_capacity` column; the seed and modal set it client-side only. Either persist `current_capacity` on `rvms` (small migration in 8.2) or remove the UI indicator and treat the field as out of scope. Recommendation: persist as `current_capacity` (`integer`, default `0`) and surface as `currentCapacity`. |
| machines | `/api/web/machines` | `totalItemsCollected` (set by AddMachine default; not currently displayed but expected by detail panel) | (missing) | `integer` | **add derived field** — same status as `currentCapacity`. Either compute on the fly (`COUNT(recycling_items)` join) and expose as `totalItemsCollected`, or drop from the page. |
| machines | `/api/web/machines` | `lastSync` (set by AddMachine default; intended for online-status detail) | (missing) | `iso8601_datetime` (nullable) | **add derived field** — derive from the most-recent `RVM.heartbeat_at` (column already exists on the model — confirm in 8.2) and expose as `lastSync`. Until then page renders empty-state. |
| machines | `/api/web/machines` | (paginated) | `pagination` envelope `{page, perPage, total, totalPages}` | `object` of `integer`s | aligned |

---

## 11. rewards

- **Page:** `rewards/page.js`
- **GET endpoint:** `GET /api/web/rewards` → `{ success, rewards: [...], pagination }`
- **Source:** `server/app/controllers/rewards_controller.py::get_rewards`,
  `_shared.py::_serialize_reward`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| rewards | `/api/web/rewards` | `id` | `id` | `integer` | aligned |
| rewards | `/api/web/rewards` | `name` | `name` | `string` | aligned |
| rewards | `/api/web/rewards` | `description` | `description` | `string` (nullable) | render empty-state |
| rewards | `/api/web/rewards` | `category` | `category` | `string` (nullable) | render empty-state |
| rewards | `/api/web/rewards` | `points` (mapped from `pointsRequired` client-side) | `pointsRequired` | `integer` | **rename serializer key** — page reads `points` after a client-side fallback. Align the page on `pointsRequired` directly (Phase 3 8.3) so the JSON schema and UI use the canonical key. |
| rewards | `/api/web/rewards` | `stock` (mapped from `stockQuantity` client-side) | `stockQuantity` | `integer` | **rename serializer key** — same as above; align the page on `stockQuantity` (8.3). |
| rewards | `/api/web/rewards` | `image` (mapped from `imageUrl`) | `imageUrl` | `string` (nullable, URL or data-URI) | **rename serializer key** — align the page on `imageUrl` directly (8.3). |
| rewards | `/api/web/rewards` | `isActive` | `isActive` | `boolean` | aligned |
| rewards | `/api/web/rewards` | `locationId` | `locationId` | `integer` | aligned |
| rewards | `/api/web/rewards` | `locationName` | `locationName` | `string` (nullable) | render empty-state |
| rewards | `/api/web/rewards` | `dispensed` (initialized to `0` on the client) | (missing) | `integer` | **add derived field** — page displays "Total Dispensed" but reads `0` from the synthetic init. Either compute from `RewardRedemption` (`SUM(quantity_redeemed) WHERE status IN ('claimed','used')`) and expose as `dispensed`, or remove the stat. Recommendation: derive in `_serialize_reward` (8.2). |
| rewards | `/api/web/rewards` | (unused) | `variants[]` (`{id, varietyName, stockQuantity, isActive}`), `createdAt` | `array<object>`, `iso8601_datetime` | aligned |

---

## 12. settings

- **Page:** `settings/page.js`
- **GET endpoints:** four read calls populate the four tabs of the settings page.
  Each is treated separately because the page conditionally fetches them as the
  user navigates tabs.
- **Sources:** `server/app/controllers/settings_controller.py::*`.

### 12.a `GET /api/web/settings/notifications` → `{ success, settings: [...], alertTypes }`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| settings | `/api/web/settings/notifications` | `settings[].alertKey` | `alertKey` | `string` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].label` | `label` | `string` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].description` | `description` | `string` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].category` | `category` | `enum<inventory,hardware,activity,reports,security,general>` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].emailEnabled` | `emailEnabled` | `boolean` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].smsEnabled` | `smsEnabled` | `boolean` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].threshold` | `threshold` | `integer` (nullable) | render empty-state |
| settings | `/api/web/settings/notifications` | `settings[].recipients` | `recipients` | `array<string>` | aligned |
| settings | `/api/web/settings/notifications` | `settings[].isActive` | `isActive` | `boolean` | aligned |
| settings | `/api/web/settings/notifications` | (unused) | `id` | `integer` | aligned |
| settings | `/api/web/settings/notifications` | (unused) | `alertTypes` | `object` (alert-key → metadata) | aligned |

### 12.b `GET /api/web/settings/notifications/logs` → `{ success, logs: [...] }`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| settings | `/api/web/settings/notifications/logs` | `id` | `id` | `integer` | aligned |
| settings | `/api/web/settings/notifications/logs` | `alertKey` | `alertKey` | `string` | aligned |
| settings | `/api/web/settings/notifications/logs` | `channel` | `channel` | `enum<email,sms>` | aligned |
| settings | `/api/web/settings/notifications/logs` | `recipient` | `recipient` | `string` | aligned |
| settings | `/api/web/settings/notifications/logs` | `subject` | `subject` | `string` (nullable for SMS) | render empty-state |
| settings | `/api/web/settings/notifications/logs` | `bodyPreview` | `bodyPreview` | `string` | aligned |
| settings | `/api/web/settings/notifications/logs` | `status` | `status` | `enum<sent,failed>` | aligned |
| settings | `/api/web/settings/notifications/logs` | `errorMessage` | `errorMessage` | `string` (nullable) | render empty-state |
| settings | `/api/web/settings/notifications/logs` | `sentAt` | `sentAt` | `iso8601_datetime` | aligned |

### 12.c `GET /api/web/settings/points` → `{ success, config }`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| settings | `/api/web/settings/points` | `config.smallWithLabel` | `smallWithLabel` | `integer` | aligned |
| settings | `/api/web/settings/points` | `config.smallNoLabel` | `smallNoLabel` | `integer` | aligned |
| settings | `/api/web/settings/points` | `config.mediumWithLabel` | `mediumWithLabel` | `integer` | aligned |
| settings | `/api/web/settings/points` | `config.mediumNoLabel` | `mediumNoLabel` | `integer` | aligned |
| settings | `/api/web/settings/points` | `config.largeWithLabel` | `largeWithLabel` | `integer` | aligned |
| settings | `/api/web/settings/points` | `config.largeNoLabel` | `largeNoLabel` | `integer` | aligned |

### 12.d `GET /api/web/settings/security` → `{ success, config }`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| settings | `/api/web/settings/security` | `config.twoFactorRequired` | `twoFactorRequired` | `boolean` | aligned |
| settings | `/api/web/settings/security` | `config.twoFactorMethod` | `twoFactorMethod` | `enum<email,sms>` | aligned |
| settings | `/api/web/settings/security` | `config.sessionTimeoutMinutes` | `sessionTimeoutMinutes` | `integer` | aligned |
| settings | `/api/web/settings/security` | `config.maxLoginAttempts` | `maxLoginAttempts` | `integer` | aligned |
| settings | `/api/web/settings/security` | `config.lockoutDurationMinutes` | `lockoutDurationMinutes` | `integer` | aligned |

### 12.e `GET /api/web/settings/security/login-history` → `{ success, history: [...] }`

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| settings | `/api/web/settings/security/login-history` | `id` | `id` | `integer` | aligned |
| settings | `/api/web/settings/security/login-history` | `action` | `action` | `string` | aligned |
| settings | `/api/web/settings/security/login-history` | `adminName` | `adminName` | `string` | aligned |
| settings | `/api/web/settings/security/login-history` | `adminRole` | `adminRole` | `string` (nullable) | render empty-state |
| settings | `/api/web/settings/security/login-history` | `ipAddress` | `ipAddress` | `string` | **add derived field** — currently the controller writes `notes` (an envelope JSON, not a plain IP) into `ipAddress`. Once the Phase 4 audit-column split lands (`AdminLog.ip` becomes a real column), the controller should pass that column through verbatim. Until then the UI must render the empty-state for any envelope-shaped value. |
| settings | `/api/web/settings/security/login-history` | `timestamp` | `timestamp` | `iso8601_datetime` | aligned |

---

## 13. users

- **Page:** `users/page.js`
- **GET endpoint:** `GET /api/web/users` → `{ success, users: [...], pagination }`
- **Source:** `server/app/controllers/users_controller.py::get_users`,
  `_shared.py::_serialize_user`.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| users | `/api/web/users` | `id` | `id` | `integer` | aligned |
| users | `/api/web/users` | `displayId` | `displayId` | `string` (nullable for legacy rows) | render empty-state |
| users | `/api/web/users` | `name` | `name` | `string` | aligned |
| users | `/api/web/users` | `username` | `username` | `string` (nullable) | render empty-state |
| users | `/api/web/users` | `email` | `email` | `string` (nullable) | render empty-state |
| users | `/api/web/users` | `phone` | `phone` | `string` (nullable) | render empty-state |
| users | `/api/web/users` | `role` | `role` | `enum<superadmin,head_admin,auditor,technician,inventory_officer,user,dependent>` | aligned |
| users | `/api/web/users` | `userType` | `userType` | `enum<student,faculty,staff>` (nullable) | render empty-state |
| users | `/api/web/users` | `isActive` | `isActive` | `boolean` | aligned |
| users | `/api/web/users` | `pointsBalance` | `pointsBalance` | `integer` | aligned |
| users | `/api/web/users` | `locationId` | `locationId` | `integer` (nullable) | render empty-state |
| users | `/api/web/users` | `groupName` (mapped to `department` on the client) | `groupName` | `string` (nullable) | **rename serializer key** — page reads `groupName` directly under `department`. Either rename the page's local field to `groupName` (Phase 3 8.3) or keep both. Recommendation: page aligns on `groupName` and drops the `department` alias. |
| users | `/api/web/users` | `yearLevel` (sent on PUT, read for display in EditModal) | (missing) | `string` (nullable) | **add derived field** — `User` model has no `year_level` column today. Either drop the field from the form (preferred — students should set this on registration only, not via admin edit), or add a column in 8.2. Until then, the edit modal must initialize the field to `''` and the table must render empty-state. |
| users | `/api/web/users` | `accountHealth` (derived client-side from `isActive`) | (missing) | `enum<Active,Inactive>` | **add derived field** — currently computed client-side. Recommendation: keep it client-side (it is a UI-only synonym for `isActive`) and not add to the JSON schema. Marked as `add derived field` only for completeness; closed by removing client-side derivation in 8.3 and binding the column to `isActive` directly. |
| users | `/api/web/users` | `lastLogin` | `lastLogin` | `iso8601_datetime` (nullable) | render empty-state |
| users | `/api/web/users` | `joinDate` (mapped from `createdAt`) | `createdAt` | `iso8601_datetime` | **rename serializer key** — same case as locations (§4.a). Align the page on `createdAt` (Phase 3 8.3). |
| users | `/api/web/users` | `points` (mapped from `pointsBalance`) | `pointsBalance` | `integer` | **rename serializer key** — align the page on `pointsBalance` (Phase 3 8.3). |
| users | `/api/web/users` | (unused but returned) | `firstName`, `middleName`, `lastName`, `lifetimePoints`, `streak`, `walletId`, `locationName`, `updatedAt` | mixed — see `_serialize_user` | aligned |

---

## 14. users/permissions

- **Page:** `users/permissions/page.js`
- **GET endpoint:** `GET /api/web/users?is_admin=true` → `{ success, users: [...], pagination }`
- **Source:** same as §13 (`get_users`, `_serialize_user`); the page filters in
  the controller via `?is_admin=true` and additionally hides the `superadmin`
  role on the client.

The page is a specialization of the users list focused on the admin role set,
plus a left-hand "Permissions for <role>" matrix. The matrix data is currently
hard-coded in `ROLES_DATA` on the client; per Requirement 2.3 the canonical
permission categories already arrive on `GET /api/web/auth/me` (§15). No
endpoint addition is required to satisfy the page's render needs — the Phase 2
infrastructure already covers it.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| users/permissions | `/api/web/users?is_admin=true` | `id` | `id` | `integer` | aligned |
| users/permissions | `/api/web/users?is_admin=true` | `displayId` | `displayId` | `string` (nullable) | render empty-state |
| users/permissions | `/api/web/users?is_admin=true` | `name` | `name` | `string` | aligned |
| users/permissions | `/api/web/users?is_admin=true` | `email` | `email` | `string` (nullable) | render empty-state |
| users/permissions | `/api/web/users?is_admin=true` | `role` | `role` | `enum<superadmin,head_admin,auditor,technician,inventory_officer>` | aligned |
| users/permissions | `/api/web/users?is_admin=true` | `locationId` | `locationId` | `integer` (nullable) | render empty-state |
| users/permissions | `/api/web/users?is_admin=true` | `lastLogin` | `lastLogin` | `iso8601_datetime` (nullable) | render empty-state |
| users/permissions | `/api/web/users?is_admin=true` | `status` (derived client-side from `lastLogin` presence) | (missing) | `enum<Online,Offline>` | **add derived field** — recommend dropping the synthetic client-side derivation; replace the column with "Last seen" (formatted `lastLogin`) in 8.3. |
| users/permissions | `/api/web/users?is_admin=true` | `accountHealth` (mapped from `isActive`) | `isActive` | `boolean` | **rename serializer key** — same as §13; align the page on `isActive` (8.3). |
| users/permissions | `/api/web/users?is_admin=true` | `avatar` (initials from `name`) | (missing) | `string` | **add derived field** — purely cosmetic; keep client-side. Marked for completeness only. |
| users/permissions | `/api/web/users?is_admin=true` | `permissions` (looked up from `ROLES[role]` client map) | (missing) | `object` | **add derived field** — populate `permissions` per row by reading `ROLE_PERMISSIONS[role]` server-side and serializing to a `{view, edit, create, delete, export}` map keyed by category. This eliminates the hard-coded `ROLES_DATA` on the client and aligns with Requirement 2.3 / 2.5. Action item for 8.2. |

---

## 15. profile

- **Page:** `client/app/profile/page.js` → `client/src/components/pages/ProfileSection.jsx`.
- **GET endpoint:** `GET /api/web/auth/me` → `{ success, user: {...} }`
  (also extended in Phase 2 task 6.3 to return `permission_categories`).
- **Source:** `server/app/controllers/auth_controller.py::me_endpoint` (and the
  `_serialize_user` helper for the embedded `user`).

`ProfileSection.jsx` currently displays mostly hard-coded placeholder strings
(name `"JAY MAR"`, university `"Polytechnic University of the Philippines"`, etc.)
because the page predates Phase 2. Phase 3 task 8.3 must wire it up to the
fields below.

| Page | GET endpoint | Field the page reads | Field the endpoint returns | Type | Resolution |
| --- | --- | --- | --- | --- | --- |
| profile | `/api/web/auth/me` | `user.name` | `user.name` | `string` | aligned (page must read this; today hard-coded) |
| profile | `/api/web/auth/me` | `user.username` (rendered as `@handle`) | `user.username` | `string` (nullable) | render empty-state |
| profile | `/api/web/auth/me` | `user.email` | `user.email` | `string` (nullable) | render empty-state |
| profile | `/api/web/auth/me` | `user.userType` (Student/Faculty/Staff label) | `user.userType` | `enum<student,faculty,staff>` (nullable) | render empty-state |
| profile | `/api/web/auth/me` | `user.locationName` (institution) | `user.locationName` | `string` (nullable) | render empty-state |
| profile | `/api/web/auth/me` | `user.gender` | (missing) | `enum<male,female,other>` (nullable) | **add derived field** — `User` model has no `gender` column. Add column in 8.2 OR drop the field from the profile form. Recommendation: add `gender` (`enum<male,female,other,prefer_not_to_say>`, nullable). |
| profile | `/api/web/auth/me` | `user.age` | (missing) | `integer` (nullable) | **add derived field** — `User` model has no `age`/`date_of_birth` column. Add `date_of_birth` (`date`, nullable) in 8.2 and derive `age` on read; or drop. Recommendation: add `dateOfBirth` and compute `age` on the server. |
| profile | `/api/web/auth/me` | `user.displayId` (used as the QR `userTagId`) | `user.displayId` | `string` (nullable) | render empty-state |
| profile | `/api/web/auth/me` | `user.qrPayload` (the signed Phase 4A `<displayId>.<hmacSuffix>` string) | (missing) | `string` | **add derived field** — Phase 4A introduces HMAC-signed QR payloads. Until that lands, the page falls back to `USER:<displayId>`. Phase 3 8.2 should preview the field as `qrPayload` so the schema is ready when 4A signs payloads. |
| profile | `/api/web/auth/me` | `user.pointsBalance` (used by RecentActivity / heatmap shells) | `user.pointsBalance` | `integer` | aligned |
| profile | `/api/web/auth/me` | `user.lifetimePoints` | `user.lifetimePoints` | `integer` | aligned |
| profile | `/api/web/auth/me` | `user.streak` | `user.streak` | `integer` | aligned |
| profile | `/api/web/auth/me` | `user.campusRank` | (missing) | `integer` (nullable) | **add derived field** — page renders `TOP #12` today as a hard-coded literal. Compute `campusRank` server-side as the user's position in `Wallet.lifetime_points` ordering scoped to their organization, and an `organizationUserCount` companion field for the `/N` denominator. Phase 3 8.2 action item. |
| profile | `/api/web/auth/me` | `user.organizationUserCount` (`/ 10,000` display) | (missing) | `integer` | **add derived field** — companion to `campusRank`; same 8.2 action item. |
| profile | `/api/web/auth/me` | `permission_categories` (from Phase 2 6.3) | `permission_categories` | `array<string>` | aligned |
| profile | `/api/web/auth/me` | (unused, returned by `_serialize_user`) | `firstName`, `middleName`, `lastName`, `phone`, `role`, `isActive`, `walletId`, `locationId`, `groupName`, `lastLogin`, `createdAt`, `updatedAt` | mixed | aligned |

---

## Summary of resolutions (rolling up tasks 8.2 and 8.3)

For convenience when scoping the follow-on tasks, every non-`aligned` row above
collapses into one of three buckets:

- **`rename serializer key` (server work — 8.2):** `logs/rewards.pointsCost`,
  `logs/rewards.timestamp`, `users.points`, `users.joinDate`, `locations.joinDate`,
  `logs/access.notes` (envelope split), `users/permissions.accountHealth`.
  Most of these are resolved by *aligning the page on the existing key* (no
  server change needed) — captured as task 8.3 work — except `logs/access.notes`
  and `logs/rewards.timestamp`, which are genuine server-side renames in 8.2.
- **`add derived field` (server work — 8.2):**
  `analytics.locationComparison.orgType`, `bulk-sessions.notes`,
  `logs/bottles.{volumeMl,condition,brand,sessionType}`,
  `logs/transactions.description`, `machines.{currentCapacity,totalItemsCollected,lastSync}`,
  `rewards.dispensed`, `users.yearLevel`, `users/permissions.permissions`,
  `profile.{gender,age,qrPayload,campusRank,organizationUserCount}`,
  `settings.security.login-history.ipAddress` (post Phase 4 audit-split),
  `locations.cityId`, `logs/machines.technician`, `logs/rewards.usedAt`.
- **`render empty-state` (client work — 8.3):** every nullable optional field
  flagged above (`userEmail`, `notes`, `description`, `category`, `barangay`,
  `cityName`, `zipCode`, etc.). Implementation is uniform: a single
  `formatField(value, placeholder = '—')` helper applied at every read site.

The single shared label map for enums (Requirement 3.6) lives at
`client/src/lib/enumLabels.js` and is created in task 8.3.

The typed JSON schemas (Requirement 3.5) for every endpoint listed above are
documented inline in `api_routes_documentation.md` under task 8.4.
