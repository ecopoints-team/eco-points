# Implementation Plan

## Overview

Add a client-side authentication guard `RequireAuth` (`client/src/components/auth/RequireAuth.jsx`) mirroring the admin `RequirePermission` guard, then wrap each protected user page (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`). The guard redirects fully-initialized unauthenticated visitors to `/?login=true`, renders nothing during redirect, and defers while `isInitialized === false`. Tasks follow the exploratory bugfix flow: explore (Property 1, fails on unfixed code), preserve (Property 2, passes on unfixed code), fix, then re-run both for Fix Checking and Preservation Checking.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Unauthenticated Visitor Renders Protected Route
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it validates the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the missing-guard bug across protected routes
  - **Scoped PBT Approach**: Generate `route ∈ { "/profile", "/rewards", "/redeem-history", "/leaderboard", "/qr" }` with fixed `currentUser = null`, `isInitialized = true` (the concrete bug-condition slice from `isBugCondition` in design)
  - Render each protected page wrapping it in an `AuthContext` provider yielding `{ currentUser: null, isInitialized: true }`
  - Assert the Expected Behavior from design Property 1: `router.replace` called with `/?login=true` AND no protected page content rendered (for `/qr`, assert `MAINTENANCE:SECRET-KEY-999` is absent from output)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS — protected content renders and `/?login=true` redirect is never fired (proves the bug exists)
  - Document counterexamples found (e.g., "`/profile` paints shell with no `router.replace`", "`/qr` exposes `MAINTENANCE:SECRET-KEY-999`")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Buggy Inputs Unchanged
  - **IMPORTANT**: Follow observation-first methodology — record actual outputs on UNFIXED code, then assert them
  - Observe on UNFIXED code and capture outputs for inputs where `isBugCondition` returns false:
    - Authenticated user (`currentUser = user`, `isInitialized = true`) renders each protected route, no redirect
    - Bootstrap window (`isInitialized = false`) on each protected route renders no protected content AND fires no redirect (e.g. `/profile` shows `ProfileSkeleton`)
    - Public route (`/`, `/login`) with `currentUser = null` renders without redirect
    - Admin area (`/admin`) remains governed by `RequirePermission` / `AdminLayout`, unchanged
  - Write property-based tests: generate `{ route ∈ PROTECTED, currentUser ∈ {null, user}, isInitialized ∈ {true, false} }` and assert behavior matches observed output for every case where `isBugCondition` is false (from Preservation Requirements in design)
  - Property-based testing generates many cases for stronger guarantees, especially the `isInitialized === false` deferral window
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for missing user-route authentication guard

  - [x] 3.1 Create the `RequireAuth` guard component
    - Create `client/src/components/auth/RequireAuth.jsx` as a `'use client'` component mirroring `RequirePermission.jsx`
    - Read `currentUser`, `isInitialized` from `useAuth()`; get `useRouter()`
    - Compute `redirectTo = '/?login=true'` only when `isInitialized && !currentUser`
    - Fire `router.replace(redirectTo)` inside `useEffect([redirectTo, router])`
    - Return `null` while `!isInitialized || redirectTo`; otherwise render `children`
    - _Bug_Condition: isBugCondition(input) where isInitialized = true AND currentUser = null AND route ∈ PROTECTED_
    - _Expected_Behavior: expectedBehavior(result) — redirectedTo = "/?login=true" AND protectedContentRendered = false_
    - _Preservation: render nothing while isInitialized === false; never redirect during bootstrap; no change to AuthContext, RequirePermission, AdminLayout, public or admin routes_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.2 Wrap protected user pages with `RequireAuth`
    - Wrap `client/app/profile/page.js` content in `<RequireAuth>`, preserving existing `ProfileSkeleton` during `isInitialized === false`
    - Wrap `client/app/rewards/page.js` content in `<RequireAuth>`
    - Wrap `client/app/redeem-history/page.js` content in `<RequireAuth>`
    - Wrap `client/app/leaderboard/page.js` content in `<RequireAuth>`
    - Wrap `client/app/qr/page.js` content in `<RequireAuth>` so `MAINTENANCE:SECRET-KEY-999` never paints before redirect resolves
    - _Bug_Condition: isBugCondition(input) for route ∈ { /profile, /rewards, /redeem-history, /leaderboard, /qr }_
    - _Expected_Behavior: expectedBehavior(result) from design — redirect to /?login=true, no protected content_
    - _Preservation: authenticated users render each page as today; admin and public routes untouched_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Verify bug condition exploration test now passes (Fix Checking)
    - **Property 1: Expected Behavior** - Unauthenticated Visitor Redirected From Protected Route
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior; passing confirms it is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES — `router.replace('/?login=true')` fired and no protected content rendered for all buggy inputs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify preservation tests still pass (Preservation Checking)
    - **Property 2: Preservation** - Non-Buggy Inputs Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS — authenticated renders, bootstrap deferral, public routes, and admin area all unchanged (no regressions)
    - _Requirements: 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full client test suite (unit, property-based, integration) and confirm green
  - Confirm Property 1 (Fix Checking) and Property 2 (Preservation) both hold
  - Ask the user if questions arise

## Notes

- Tasks 1 and 2 run on UNFIXED code: task 1 MUST fail (proves bug), task 2 MUST pass (captures baseline). Both precede the fix.
- Task 3.2 depends on 3.1 — `RequireAuth` must exist before pages wrap it.
- Tasks 3.3 (Fix Checking) and 3.4 (Preservation Checking) re-run the SAME tests from tasks 1 and 2; do not write new tests.
- Task 4 gates completion on all property checks green.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4"] },
    { "id": 4, "tasks": ["4"] }
  ]
}
```

- Wave 0: write exploration test (1) and preservation tests (2) on unfixed code — independent, parallel.
- Wave 1: create `RequireAuth` guard (3.1).
- Wave 2: wrap protected pages (3.2) — depends on 3.1.
- Wave 3: verify Property 1 fix-check (3.3) and Property 2 preservation-check (3.4) — depend on 3.1, 3.2.
- Wave 4: checkpoint (4) — depends on 3.3, 3.4.
