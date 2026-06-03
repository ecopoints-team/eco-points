# Requirements Document — Admin Dashboard Fixes

## Introduction

This spec defines fixes for bugs and issues found in the admin dashboard during QA and production deployment. This is the first part of the fixes. Work is organized into phased tasks for better tracking.

### Scope

- **In scope:** All admin pages (`client/app/admin/`), admin components (`client/src/components/admin/`), server-side controllers, API endpoints, caching, and form modals.
- **Out of scope:** New feature additions, landing page redesign, mobile app, RVM firmware.

### Dependencies

- Admin Dashboard Alignment spec (`.kiro/specs/admin-dashboard-alignment`) is complete.
- Server is deployed on Render at `https://eco-points-api.onrender.com`.
- Frontend is deployed on Cloudflare Pages at `https://ecopoints.org` / `https://www.ecopoints.org`.
- ERD reference: `ERD.md` in project root.

---

## Requirements

### Requirement 1 — Field Validation (All Menus)

**User Story:** As an admin, I want all form fields across all admin menus to enforce proper input validation so that invalid data (including whitespace-only inputs) is rejected before submission.

#### Acceptance Criteria

- 1.1 All text input fields across all admin modals (Locations, Machines, Rewards, Users) reject whitespace-only values.
- 1.2 Validation rules are aligned to the ERD field types and constraints (string lengths, required/nullable, format).
- 1.3 Required fields show validation errors on blur and on submit.
- 1.4 The shared `validateField.js` utility is extended to cover trimming and whitespace-only rejection.
- 1.5 All existing forms are audited and updated to use the shared validation.

---

### Requirement 2 — Data Fetching Performance

**User Story:** As an admin, I want the dashboard to load data quickly on first access and navigate between pages without slow refetching.

#### Acceptance Criteria

- 2.1 Admin dashboard data loads within a reasonable time on first access (target: < 2s for cached data).
- 2.2 Navigating between admin pages does not trigger full data refetches when data is already loaded.
- 2.3 Server-side caching (Redis or equivalent) is implemented for expensive endpoints: leaderboard, analytics, dashboard stats.
- 2.4 Cache is invalidated on relevant mutations (new session, new user, reward redemption, etc.).
- 2.5 Client-side state persists across page navigation within the admin shell (no reset on route change).

---

### Requirement 3 — Dashboard Menu Fixes

**User Story:** As an admin on the Dashboard page, I want analytics charts to display data correctly, dashboard card data to persist during navigation, and a manual refresh button.

#### Acceptance Criteria

- 3.1 `Recycling Analytics` section displays line graphs and charts showing data trends (not empty/blank).
- 3.2 Dashboard stat cards retain their data when the admin navigates to other pages and returns.
- 3.3 A refresh button is visible on the dashboard that manually triggers a fresh data fetch.
- 3.4 The refresh button shows a loading indicator while fetching.

---

### Requirement 4 — Locations Menu: Add Location Modal Fix

**User Story:** As an admin, I want to add new organization types from the Add Location modal, and I want the modal fields to align with the ERD entities.

#### Acceptance Criteria

- 4.1 When creating a new organization type in the Add Location modal, the new type is saved to the database and appears in the dropdown immediately.
- 4.2 The `POST /api/web/org-types` endpoint correctly creates a new `OrgType` record.
- 4.3 The Add/Edit Location modal fields align with the ERD:
  - Organization: `name` (abbreviation), `full_name`, `type_id` (FK → ORG_TYPES), `status`
  - Address: `street_address`, `barangay`, `city_municipality`, `province`, `region`, `zip_code`
  - Contact: `first_name`, `last_name`, `email`, `phone_number`
- 4.4 No extra fields exist that are not in the ERD; no ERD fields are missing from the modal.

---

### Requirement 5 — Machines Menu: Remove "Add" Button on Area Placement

**User Story:** As an admin, I want the Area Placement field in the Add Machine modal to be a simple text input without an "Add" button.

#### Acceptance Criteria

- 5.1 The "Add" button next to the Area Placement field is removed from the Add Machine modal.
- 5.2 All associated functionality (creating new area placements) is removed.
- 5.3 Area Placement remains a simple text input field (maps to `RVMS.location_name` in ERD).

---

### Requirement 6 — Comprehensive Audit & Connected Fixes

**User Story:** As a developer, I want all areas connected to the reported issues to be scanned and fixed so no related bugs remain.

#### Acceptance Criteria

- 6.1 All admin modals (Add/Edit for Locations, Machines, Rewards, Users) are audited for field-ERD alignment.
- 6.2 All admin data tables are audited for correct column mapping to API response keys.
- 6.3 All admin forms are audited for consistent validation using the shared utility.
- 6.4 Any additional bugs found during the audit are documented and fixed.

---
