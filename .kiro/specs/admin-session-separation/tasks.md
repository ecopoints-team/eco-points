# Implementation Plan

## Overview

Fix admin session separation in `client/src/components/auth/RequireAuth.jsx` using the bug condition methodology. Exploration test surfaces the bug (admin renders protected user content), preservation tests lock baseline behavior, then the role-based denial fix force-logs-out admins and redirects to `/?login=true`. Tests reuse the fast-check harness pattern in `client/tests/property/page-guards.test.js`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"], "dependsOn": [] },
    { "wave": 2, "tasks": ["3.1"], "dependsOn": ["1", "2"] },
    { "wave": 3, "tasks": ["3.2", "3.3"], "dependsOn": ["3.1"] },
    { "wave": 4, "tasks": ["4"], "dependsOn": ["3.2", "3.3"] }
  ]
}
```

- Tasks 1 and 2 are independent and MUST precede 3.1.
- 3.2 and 3.3 depend on 3.1.
- 4 depends on 3.2 and 3.3.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Admin denied and force-logged-out on protected user route
  - **CRITICAL**: This test MUST FAIL on unfixed `RequireAuth` - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate admin sessions render protected user content
  - **Scoped PBT Approach**: Scope the property to the concrete failing domain - iterate every role in `ADMIN_ROLES` (`superadmin`, `head_admin`, `auditor`, `technician`, `inventory_officer`) with `isInitialized = true`
  - Reuse harness pattern from `client/tests/property/page-guards.test.js`: mock `next/navigation` (capture `router.replace`), mock `useAuth` from `AuthContext` to inject `currentUser` + `isInitialized` + spy `logout`
  - Render `RequireAuth` wrapping a `data-testid="protected"` child with an injected admin `currentUser` (role in `ADMIN_ROLES`) and `isInitialized = true` (from Bug Condition `isBugCondition` in design)
  - The test assertions match Expected Behavior Property 1: protected content absent, `logout` called, `router.replace('/?login=true')` fired
  - Run test on UNFIXED `client/src/components/auth/RequireAuth.jsx`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "superadmin with `isInitialized=true` on `/profile` → protected content renders, `logout` never called, no `router.replace`")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-bug inputs unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED guard and record outputs:
    - `role ∈ {user, dependent}`, `isInitialized = true` → protected content renders, no `router.replace`, no `logout`
    - `currentUser = null`, `isInitialized = true` → no content, `router.replace('/?login=true')`, no `logout`
    - `isInitialized = false` (with and without a set user) → no content, no redirect, no `logout`
  - Write property-based tests over the `role × isInitialized` domain asserting identical render/redirect outcomes and that `logout` is never called for non-bug inputs (from Preservation Requirements in design)
  - Property-based testing generates many `(role, isInitialized)` combinations for stronger guarantees (catches `dependent` role, `isInitialized=false` with set user)
  - Admins inside `/admin/*` are out of `RequireAuth` scope (guarded by `AdminLayout`) - assert structurally / document as not mounting the guard
  - Run tests on UNFIXED guard
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix admin session separation in RequireAuth

  - [x] 3.1 Implement the role-based denial fix
    - File: `client/src/components/auth/RequireAuth.jsx`
    - Import `ADMIN_ROLES` from `AuthContext`; pull `logout` from `useAuth()` alongside `currentUser`, `isInitialized`
    - Derive `isAdmin = !!currentUser && ADMIN_ROLES.has(currentUser.role)` on each render
    - Extend redirect computation: `redirectTo = isInitialized && (!currentUser || isAdmin) ? '/?login=true' : null`
    - Add force-logout effect gated on `isInitialized && isAdmin`: `await logout()` once, guarded against double invocation (ref flag) so re-renders do not repeat the server call
    - Preserve no-flash return: keep `if (!isInitialized || redirectTo) return null;`
    - No explicit pathname check required - `RequireAuth` only mounts on protected user routes; `/admin/*` guarded by `AdminLayout`
    - _Bug_Condition: isBugCondition(input) where input.isInitialized=true AND input.currentUser<>null AND input.currentUser.role IN ADMIN_ROLES AND input.route IN protected user routes (from design)_
    - _Expected_Behavior: expectedBehavior(result) → rendersProtectedContent=false AND sessionForceLoggedOut=true AND redirectedTo='/?login=true' (from design)_
    - _Preservation: Preservation Requirements from design - non-admin users render, unauthenticated redirect, bootstrapping no-op, admins in /admin/* unaffected, 401 flow unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Admin denied and force-logged-out on protected user route
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms deny + `logout` + `router.replace('/?login=true')` for every role in `ADMIN_ROLES`
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-bug inputs unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm non-admin users render, unauthenticated redirect, bootstrapping no-op, no `logout` for non-bug inputs - all unchanged after fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 4. Checkpoint - Ensure all tests pass (7 files, 19 tests — all green)
  - Run full property suite (`npm test -- tests/property/`) plus the new exploration and preservation tests
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Property 1 (Bug Condition) MUST fail on the unfixed guard before task 3.1; failure confirms the bug.
- Property 2 (Preservation) MUST pass on the unfixed guard before task 3.1; observation-first baseline.
- Re-run the SAME tests in 3.2 and 3.3 - do not author new ones.
- `logout` must be invoked at most once per admin denial (idempotency via ref flag).
- Run property tests with `npm test -- tests/property/...` (single execution, no watch mode).
