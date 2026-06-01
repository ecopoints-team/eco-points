# Implementation Plan: Admin Dashboard Alignment

## Overview

This plan implements the admin dashboard alignment spec defined in `requirements.md` and `design.md`. Work is organized into 5 phases: build fix, field normalization, validation hardening, empty-state handling, and smoke testing. Each phase builds on the previous — no orphaned code.

## Tasks

- [ ] 1. Phase A — Build Fix (Remove mockData Dependencies)
  - [ ] 1.1 Remove `DEPARTMENTS` / `getDepartmentName` from `leaderboards/page.js`
    - Delete import lines 8-11 (`import { DEPARTMENTS, getDepartmentName } from '../../../src/data/mockData'`).
    - Replace `getUserDeptDisplay()` (line 67-70): change `getDepartmentName(user.department)` → `user.department || '—'`.
    - Replace search filter (line 387): change `getDepartmentName(u.department)?.toLowerCase()` → `(u.department || '').toLowerCase()`.
    - Update `availableDepartments` memo (line 342-348): remove `DEPARTMENTS.find()` lookup — use `{ value: d, label: d }` directly.
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

  - [ ] 1.2 Remove `CITIES` from `locations/page.js`
    - Delete import line 8 (`import { CITIES } from '../../../src/data/mockData'`).
    - In `AddLocationModal`: Remove `citiesList` state and `setCitiesList(CITIES)` calls. Replace `cityId` in formData with `cityMunicipality`. Replace `<CustomDropdown>` for city with `<input type="text">`. Add `province` and `region` optional text inputs.
    - In `EditLocationModal`: Same changes as AddLocationModal. Pre-populate `cityMunicipality` from `location.cityName`.
    - Update form validation: `cityId` required → `cityMunicipality` required.
    - Update submit handler: Send `cityMunicipality`, `province`, `region` instead of `cityId`.
    - Group address fields logically: Street → Barangay + City → Province + Region → ZIP.
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 1.3 Remove `SHS_STRANDS` / `COLLEGE_DEPARTMENTS` from `AddRegularUserModal.jsx`
    - Delete import line 6 (`import { SHS_STRANDS, COLLEGE_DEPARTMENTS } from '../../data/mockData'`).
    - Add import: `import { groups as groupsApi } from '../../services/api'`.
    - Add state: `const [availableGroups, setAvailableGroups] = useState([])`, `const [groupsLoading, setGroupsLoading] = useState(false)`.
    - Add `useEffect` to fetch groups on modal open from `groupsApi.getAll(locationId)`.
    - Replace static dropdown options with `availableGroups` filtered by `groupType` based on selected user type.
    - Update form field from `department`/`strand` strings to `communityGroupId` (integer ID).
    - Add loading spinner while groups fetch. Show empty state if no groups.
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ] 1.4 Verify build succeeds
    - Run `npm run build` in `client/` directory.
    - Confirm zero errors, zero `mockData` references.
    - _Requirements: 1.2, 1.3_

- [ ] 2. Phase B — Field Label Normalization
  - [ ] 2.1 Normalize `users/page.js` field keys
    - Replace all `user.points` reads → `user.pointsBalance`.
    - Replace all `user.joinDate` reads → `user.createdAt` (use `formatDateShort(user.createdAt)`).
    - Replace all `user.department` display reads → `user.groupName` (update column header from "Department" → "Group").
    - Remove `accountHealth` derivation — bind the status badge directly to `user.isActive`.
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 2.2 Normalize `rewards/page.js` field keys
    - Replace `reward.points` → `reward.pointsRequired` (update column header "Points" → "Points Required").
    - Replace `reward.stock` → `reward.stockQuantity` (update column header "Stock" → "Stock Qty").
    - Replace `reward.image` → `reward.imageUrl`.
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 2.3 Normalize `logs/rewards/page.js` field keys
    - Replace `log.pointsCost` → `log.pointsSpent`.
    - _Requirements: 5.1_

  - [ ] 2.4 Normalize `profile/page.js` field keys
    - Replace `profile.joinDate` derivation → format `currentUser.createdAt` directly.
    - _Requirements: 5.1_

  - [ ] 2.5 Normalize `locations/page.js` display keys
    - Ensure location cards display `loc.createdAt` instead of `loc.joinDate`.
    - _Requirements: 5.1_

- [ ] 3. Phase C — Input Validation Hardening
  - [ ] 3.1 Create shared validation utility `client/src/lib/validateField.js`
    - Export `validateField(rules, fieldName, value)` → returns error string or `null`.
    - Export `VALIDATION_RULES` object with per-entity constraint maps.
    - Support: `required`, `maxLength`, `min`, `pattern`, `type` constraints.
    - Include `CharLimitIndicator` component showing remaining chars when > 80% used.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 3.2 Apply validation to `AddLocationModal` and `EditLocationModal`
    - Import and use `validateField` with `VALIDATION_RULES.location`.
    - Add `maxLength` attributes to all text inputs.
    - Show `CharLimitIndicator` on long-text fields (street address, full name).
    - Red asterisk on required field labels.
    - Validate on blur + submit.
    - _Requirements: 6.2, 6.6, 6.7_

  - [ ] 3.3 Apply validation to `AddRegularUserModal`
    - Import and use `validateField` with `VALIDATION_RULES.user`.
    - Add `maxLength` attributes. Red asterisks. Blur + submit validation.
    - _Requirements: 6.1, 6.6, 6.7_

  - [ ] 3.4 Apply validation to machine management modals
    - Import and use `validateField` with `VALIDATION_RULES.machine`.
    - _Requirements: 6.3, 6.6, 6.7_

  - [ ] 3.5 Apply validation to reward management modals
    - Import and use `validateField` with `VALIDATION_RULES.reward`.
    - Validate `pointsRequired` as positive integer.
    - _Requirements: 6.4, 6.6, 6.7_

- [ ] 4. Phase D — Empty-State & Null Handling
  - [ ] 4.1 Audit all admin table cells for consistent empty-state rendering
    - Grep all admin pages for inline `|| ''`, `|| '-'`, `|| '—'` patterns.
    - Replace with `formatField(value)` calls.
    - Ensure date formatting uses `formatField(value, 'date')`.
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 4.2 Standardize badge/pill null handling
    - Update userType badge to show "Unknown" (gray) when `userType` is null.
    - Update status badges to handle null gracefully.
    - _Requirements: 7.4_

- [ ] 5. Phase E — Smoke Test Suite
  - [ ] 5.1 Create backend smoke test fixtures (`server/tests/smoke/conftest.py`)
    - Create Flask test app fixture with test database.
    - Create `admin_client` fixture that authenticates as `superadmin` and returns a test client with valid JWT.
    - Create fixtures for each admin role: `head_admin_client`, `auditor_client`, `technician_client`, `inventory_client`.
    - Seed test data: 1 organization, 2 community groups, 2 users, 1 RVM, 1 reward.
    - _Requirements: 8.1_

  - [ ] 5.2 Create GET endpoint smoke tests (`server/tests/smoke/test_admin_smoke.py`)
    - Test every GET endpoint returns 200 with `success: true`.
    - Validate response payload contains expected top-level keys.
    - Validate serialization shape of user, location, machine, reward, log records.
    - Check no required fields are null.
    - Log each test with endpoint name, status, field mismatches.
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

  - [ ] 5.3 Create mutating endpoint smoke tests
    - Test CRUD cycle for groups: POST → PUT → DELETE.
    - Test user creation with valid payload.
    - Test reward creation with valid payload.
    - Test location update with valid payload.
    - Verify response shapes match canonical keys.
    - _Requirements: 8.6, 8.7_

  - [ ] 5.4 Create RBAC smoke tests
    - For each admin role, verify access to permitted endpoints returns 200.
    - For each admin role, verify access to forbidden endpoints returns 403.
    - Test that non-admin JWT gets 403 on all admin endpoints.
    - _Requirements: 8.2_

  - [ ] 5.5 Create frontend build verification script (`client/tests/smoke/smoke_build.ps1`)
    - Scan for `mockData` references → fail if found.
    - Run `npm run build` → fail on non-zero exit.
    - Print human-readable PASS/FAIL summary.
    - _Requirements: 8.4, 8.5_

  - [ ] 5.6 Create combined smoke test runner
    - Document the command sequence:
      ```
      # Backend smoke tests
      cd server && python -m pytest tests/smoke/ -v --tb=short

      # Frontend build verification
      cd client && powershell -File tests/smoke/smoke_build.ps1
      ```
    - _Requirements: 8.5_

- [ ] 6. Final Verification
  - [ ] 6.1 Run full smoke test suite and document results
  - [ ] 6.2 Deploy to staging (Render) and verify
  - [ ] 6.3 Trigger Cloudflare Pages rebuild and verify build success
  - [ ] 6.4 Manual walkthrough of all admin pages as superadmin
