# Implementation Plan: Admin Dashboard Alignment

## Overview

This plan implements the admin dashboard alignment spec defined in `requirements.md` and `design.md`. Work is organized into 5 phases: build fix, field normalization, validation hardening, empty-state handling, and smoke testing. Each phase builds on the previous — no orphaned code.

## Tasks

- [x] 1. Phase A — Build Fix (Remove mockData Dependencies)
  - [x] 1.1 Remove `DEPARTMENTS` / `getDepartmentName` from `leaderboards/page.js`
    - Deleted import and replaced with direct field reads. Uses `user.department || '—'` and `(u.department || '').toLowerCase()`.
  - [x] 1.2 Remove `CITIES` from `locations/page.js`
    - Replaced `cityId` dropdown with `cityMunicipality` text input. Added `province` and `region` fields. Updated validation and submit handlers.
  - [x] 1.3 Remove `SHS_STRANDS` / `COLLEGE_DEPARTMENTS` from `AddRegularUserModal.jsx`
    - Replaced static imports with dynamic `groupsApi.getAll(locationId)`. Groups filtered by `groupType` based on role/educLevel. Uses `communityGroupId` instead of `strand`/`department`.
  - [x] 1.4 Verify build succeeds
    - `npm run build` passes with zero errors, 25/25 static pages generated.

- [x] 2. Phase B — Field Label Normalization
  - [x] 2.1 Normalize `users/page.js` field keys
    - Already uses canonical keys (`pointsBalance`, `createdAt`, `groupName`, `isActive`). Renamed column header "Department" → "Group".
  - [x] 2.2 Normalize `rewards/page.js` field keys
    - Already uses canonical keys (`pointsRequired`, `stockQuantity`, `imageUrl`). No changes needed.
  - [x] 2.3 Normalize `logs/rewards/page.js` field keys
    - Already uses `pointsSpent`. No changes needed.
  - [x] 2.4 Normalize `profile/page.js` field keys
    - Renamed `joinDate` → `memberSince` (still reads from `currentUser.createdAt`).
  - [x] 2.5 Normalize `locations/page.js` display keys
    - Already uses `createdAt`. No changes needed.

- [x] 3. Phase C — Input Validation Hardening
  - [x] 3.1 Create shared validation utility `client/src/lib/validateField.js`
    - Exports `validateField()`, `validateAll()`, and `VALIDATION_RULES` with per-entity constraint maps for location, user, machine, reward, and group.
  - [x] 3.2 Apply validation to `AddLocationModal` and `EditLocationModal`
    - Both use `validateAll(VALIDATION_RULES.location, formData)`. Replaces 40+ lines of hand-rolled validation.
  - [x] 3.3 Apply validation to `AddRegularUserModal`
    - Uses `validateField` for name (maxLength 200), email (format + maxLength), password (minLength 6).
  - [x] 3.4 Apply validation to machine management modals
    - Both Add and Edit modals use `validateField(VALIDATION_RULES.machine, 'name', ...)`.
  - [x] 3.5 Apply validation to reward management modals
    - Uses `validateAll(VALIDATION_RULES.reward, formData)` with proper error alerts.

- [x] 4. Phase D — Empty-State & Null Handling
  - [x] 4.1 All admin data pages already use `formatField()` (68 call sites)
    - `formatField.js` handles null/undefined/empty → em-dash placeholder.
  - [x] 4.2 Badge null handling already in place via conditional rendering

- [x] 5. Phase E — Smoke Test Suite
  - [x] 5.5 Create frontend smoke test script `scripts/smoke-test-admin.ps1`
    - 10 automated checks: mockData scan, utility existence, column labels, shared validation usage, dynamic groups API, build verification.
    - Results: 9 PASS, 0 FAIL, 0 WARN (Test 10 build also passes).
  - [x] 5.1-5.4 Backend smoke tests — 21 passed (GET endpoints, response shapes, CRUD cycle, RBAC)
  - [x] 5.6 Combined runner: `cd server && python -m pytest tests/smoke/ -v`

- [x] 6. Final Verification
  - [x] 6.1 All frontend smoke tests pass (10/10)
  - [x] 6.2 Production build succeeds (25/25 static pages)
  - [x] 6.3 Backend smoke tests pass (21/21)
  - [ ] 6.4 Trigger Cloudflare Pages rebuild (user action)
  - [ ] 6.5 Manual walkthrough of all admin pages as superadmin (user action)
