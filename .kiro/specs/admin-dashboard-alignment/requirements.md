# Requirements Document — Admin Dashboard Alignment

## Introduction

This spec defines the work required to align the admin dashboard UI with the refactored multi-tenant data architecture shipped in the platform hardening program (`.kiro/specs/phased-platform-hardening`). The primary objectives are:

1. **Unblock Cloudflare Pages deployment** by removing all imports from the deleted `src/data/mockData.js`.
2. **Replace static/hardcoded reference data** (cities, departments, SHS strands) with live API calls to the existing `/api/web/groups` and related endpoints.
3. **Normalize field labels** — ensure every UI field maps 1:1 to its canonical backend key (e.g., `pointsBalance` not `points`, `createdAt` not `joinDate`).
4. **Enforce input validation** on all admin forms, aligned to model constraints (string lengths, required fields, enum values).
5. **Smoke-test the entire admin surface** with scripted API tests and UI verification.

### Scope

- **In scope:** All client files under `client/app/admin/`, `client/src/components/admin/`, and the `client/src/services/api/` modules that serve them. Server-side changes limited to any serializer/endpoint adjustments needed to support the UI alignment.
- **Out of scope:** New feature additions, landing page, mobile app, RVM firmware. Schema migrations beyond what was already shipped in the platform hardening phases.

### Dependencies

- Platform hardening Phases 0–5 are complete and merged to `main`.
- Server is live at `https://api.ecopoints.org`.
- All endpoints under `/api/web/*` are functional with RBAC enforcement.
- The `community_groups` table is seeded and served via `GET /api/web/groups`.

---

## Glossary

- **mockData** — The deleted file `client/src/data/mockData.js` that contained hardcoded `CITIES`, `DEPARTMENTS`, `SHS_STRANDS`, `COLLEGE_DEPARTMENTS` arrays.
- **CommunityGroup** — Database model (`community_groups` table) that replaced the static department/strand arrays. Fields: `id`, `organization_id`, `name`, `abbreviation`, `group_type` (`shs_strand`, `college`, `staff`, or `null`).
- **OrgAddress** — Database model (`org_address` table) storing organization addresses. `city_municipality` is a `String(200)` free-text field (no ID lookup).
- **Canonical Key** — The JSON key name returned by the server's serializer. UI fields MUST use canonical keys directly (no client-side aliasing).
- **Alignment Doc** — `docs/model-ui-alignment.md`, the Phase 3 field-by-field mapping document.

---

## Requirements

### Requirement 1 — Remove All mockData Dependencies (Build Fix)

**User Story:** As a developer, I want all references to the deleted `mockData.js` removed so the Cloudflare Pages build succeeds.

#### Acceptance Criteria

- 1.1 No file under `client/` contains an import statement referencing `mockData` or `src/data/mockData`.
- 1.2 `npm run build` in the `client/` directory exits with code 0 and zero Turbopack errors.
- 1.3 The `client/src/data/mockData.js` file does NOT exist (it was already deleted; this criterion prevents re-creation).

---

### Requirement 2 — Leaderboards Page: Live Group Data

**User Story:** As an admin viewing leaderboards, I want department/group filters to use live data from the database so that newly created community groups appear automatically.

#### Acceptance Criteria

- 2.1 The `DEPARTMENTS` import and all `getDepartmentName()` calls are removed from `leaderboards/page.js`.
- 2.2 The "By Department" filter uses `user.department` (the group name string returned by `GET /api/web/leaderboard`) directly — no ID-to-name mapping.
- 2.3 The `availableDepartments` memo derives labels from the `department` field on leaderboard users (no static array).
- 2.4 Search filter handles the `department` field as a nullable string (no crash on `null`/`undefined`).
- 2.5 "By Group Type" filter continues to work using `user.groupType` from the API response.

---

### Requirement 3 — Locations Page: Full Address Collection

**User Story:** As a superadmin managing locations, I want the Add/Edit Location modals to collect all address fields from the `OrgAddress` model (street, barangay, city/municipality, province, region, zip code) with proper text inputs instead of hardcoded dropdowns.

#### Acceptance Criteria

- 3.1 The `CITIES` import is removed from `locations/page.js`.
- 3.2 Both `AddLocationModal` and `EditLocationModal` replace the city `<CustomDropdown>` with a text `<input>` for city/municipality.
- 3.3 The form field is named `cityMunicipality` (matching the backend) instead of `cityId`.
- 3.4 The `cityMunicipality` field is required and validates to a non-empty string (max 200 chars).
- 3.5 The edit modal pre-populates `cityMunicipality` from the location's `cityName` API response field.
- 3.6 `province` (max 200 chars, optional) and `region` (max 200 chars, optional) text inputs are added to complete the address form, matching the `OrgAddress` model.
- 3.7 The edit modal pre-populates `province` and `region` from existing location data.
- 3.8 The form layout groups address fields logically: Street → Barangay + City/Municipality → Province + Region → ZIP Code.

---

### Requirement 4 — AddRegularUserModal: Dynamic Group Selection

**User Story:** As an admin adding a new user, I want the department/strand dropdown to load live community groups from the API, scoped to my current location.

#### Acceptance Criteria

- 4.1 The `SHS_STRANDS` and `COLLEGE_DEPARTMENTS` imports are removed from `AddRegularUserModal.jsx`.
- 4.2 On modal open, groups are fetched from `GET /api/web/groups?location_id=X` where X is the current location.
- 4.3 The dropdown options are derived from the API response, filtered by `groupType`:
  - SHS students see groups where `groupType === 'shs_strand'`
  - College students see groups where `groupType === 'college'`
  - Staff see groups where `groupType === 'staff'`
- 4.4 The form sends `communityGroupId` (integer) to `POST /api/web/users`, not a department name string.
- 4.5 A loading state is shown while groups are being fetched.
- 4.6 An empty-state message is shown if no groups exist for the location ("No groups configured for this location").

---

### Requirement 5 — Field Label Normalization

**User Story:** As a developer maintaining the admin UI, I want every displayed field to use the canonical key from the API response — no client-side aliasing — so the codebase is consistent and debuggable.

#### Acceptance Criteria

The following field renames are applied across all admin pages:

| Page | Old UI Key | Canonical API Key | New Column Header | File |
|---|---|---|---|---|
| users | `points` | `pointsBalance` | "Points Balance" | `users/page.js` |
| users | `joinDate` | `createdAt` | "Joined" | `users/page.js` |
| users | `department` | `groupName` | **"Group"** | `users/page.js` |
| users | `accountHealth` | Derive from `isActive` inline | "Status" | `users/page.js` |
| locations | `joinDate` | `createdAt` | "Created" | `locations/page.js` |
| locations | `cityId` | `cityMunicipality` (text) | "City/Municipality" | `locations/page.js` |
| rewards | `points` | `pointsRequired` | "Points Required" | `rewards/page.js` |
| rewards | `stock` | `stockQuantity` | "Stock Qty" | `rewards/page.js` |
| rewards | `image` | `imageUrl` | — | `rewards/page.js` |
| logs/rewards | `pointsCost` | `pointsSpent` | "Points Spent" | `logs/rewards/page.js` |
| profile | `joinDate` | `createdAt` | "Joined" | `profile/page.js` |

- 5.1 All listed renames are applied in the respective files.
- 5.2 No client-side field aliasing remains (no `const points = user.pointsBalance` or `const joinDate = user.createdAt` mappings).
- 5.3 Table column headers match the API field's semantic meaning (e.g., "Points Balance" not "Points").

---

### Requirement 6 — Input Validation Alignment

**User Story:** As an admin, I want form inputs to enforce the same constraints as the backend models so I get clear errors before submission.

#### Acceptance Criteria

- 6.1 **User forms:** `first_name` (max 200 chars, required), `last_name` (max 200 chars, required), `email` (max 200 chars, valid format), `phone` (max 50 chars, valid format), `username` (max 100 chars).
- 6.2 **Location forms:** `name` (max 200 chars, required), `full_name` (max 500 chars, required), `street_address` (max 500 chars, required), `barangay` (max 200 chars), `city_municipality` (max 200 chars, required), `province` (max 200 chars), `region` (max 200 chars), `zip_code` (max 10 chars), `contactPerson` first/last name (max 200 each), `contactEmail` (max 200 chars, valid format), `contactPhone` (max 50 chars).
- 6.3 **Machine forms:** `name` (max 200 chars, required), `machine_uuid` (max 100 chars, required, unique), `location_name` (max 200 chars).
- 6.4 **Reward forms:** `name` (max 200 chars, required), `description` (text, optional), `category` (max 100 chars), `points_required` (positive integer, required), `image_url` (max 500 chars, valid URL).
- 6.5 All text inputs display remaining character count when > 80% of max length.
- 6.6 Required fields show a red asterisk (*) in the label.
- 6.7 Validation runs on blur and on submit. Errors display below the input in red text.

---

### Requirement 7 — Empty-State & Null Handling

**User Story:** As an admin viewing data tables, I want nullable fields to display a consistent placeholder ("—") instead of `undefined`, `null`, or empty space.

#### Acceptance Criteria

- 7.1 All nullable fields in table cells render `"—"` when the value is `null`, `undefined`, or empty string.
- 7.2 The existing `formatField()` utility from `src/lib/formatField.js` is used consistently (no inline `|| '—'` fallbacks).
- 7.3 Date fields that are null render `"—"` (not "Invalid Date").
- 7.4 Badge/pill components handle null gracefully (e.g., userType badge shows "Unknown" with gray styling).

---

### Requirement 8 — Smoke Test Suite

**User Story:** As a developer, I want a scripted smoke test that exercises every admin API endpoint and validates the response shapes, so I can verify alignment after changes.

#### Acceptance Criteria

- 8.1 A test script `server/tests/smoke/test_admin_smoke.py` exists that authenticates as each admin role and hits every `GET /api/web/*` endpoint.
- 8.2 For each endpoint, the script validates:
  - HTTP status code is 200
  - Response contains `success: true`
  - All canonical keys listed in the alignment doc are present in the response
  - No unexpected `null` values on required fields
- 8.3 The script logs each test result with endpoint name, status, and any field mismatches to stdout.
- 8.4 A companion script `client/tests/smoke/test_admin_build.sh` (or `.ps1` for Windows) runs `npm run build` and validates zero errors.
- 8.5 Both scripts can be run via a single command: `python -m pytest server/tests/smoke/ -v` for backend, `npm run build` for frontend.
- 8.6 The smoke test covers all mutating endpoints (POST, PUT, DELETE) with valid payloads, verifying 200/201 responses and correct response shapes.
- 8.7 Test output is human-readable with clear PASS/FAIL indicators and field-level detail on failures.
