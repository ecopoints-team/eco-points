# Admin Session Separation Bugfix Design

## Overview

Admin-role accounts can reach protected user routes because `RequireAuth` only denies unauthenticated visitors. It admits any account with a valid session, so a logged-in admin (`currentUser` set, role in `ADMIN_ROLES`) passes the `!currentUser` check and the protected user page renders.

The fix extends `RequireAuth` (`client/src/components/auth/RequireAuth.jsx`) with a role-based denial branch: when a fully-initialized session belongs to an admin role, the guard force-logs-out the session (server `logout` to invalidate the HttpOnly cookie + clear client state), redirects to `/?login=true`, and renders no protected content. All other inputs — non-admin authenticated users, unauthenticated visitors, bootstrapping state, admins inside `/admin/*` — behave exactly as before.

The approach mirrors the existing admin-side guard pattern (`AdminLayout`, `RequirePermission`): compute a redirect target on each render, fire it from an effect once `isInitialized`, and return `null` while a redirect is in flight to prevent any flash.

## Glossary

- **Bug_Condition (C)**: Fully-initialized, authenticated admin-role account sitting on a protected user route.
- **Property (P)**: Desired behavior under C — deny render, force logout, redirect to `/?login=true`.
- **Preservation**: Behavior for all inputs where C does not hold must stay byte-for-byte identical (non-admin users render, unauthenticated visitors redirect, bootstrapping renders nothing, admins in `/admin/*` unaffected).
- **RequireAuth**: The guard component in `client/src/components/auth/RequireAuth.jsx` wrapping protected user routes (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`).
- **ADMIN_ROLES**: `Set` exported from `client/src/context/AuthContext.js` — `['superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer']`.
- **logout**: AuthContext action that calls `authApi.logout()` (invalidates server HttpOnly cookie) then clears `currentUser`, `allLocations`, `viewAsLocationId`.
- **currentUser / isInitialized**: AuthContext state — the signed-in user (or `null`), and whether the boot session probe has completed.
- **F / F'**: Original guard (admits any authenticated account) / fixed guard (denies admin roles on protected user routes).

## Bug Details

### Bug Condition

The bug manifests when an authenticated admin-role account navigates to a protected user route while auth is fully initialized. `RequireAuth` computes `redirectTo = isInitialized && !currentUser ? '/?login=true' : null`. For an admin, `currentUser` is truthy, so `redirectTo` is `null` and `children` render. The guard performs no role check and no force logout.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { currentUser, isInitialized, route }
  OUTPUT: boolean

  RETURN input.isInitialized = true
     AND input.currentUser <> null
     AND input.currentUser.role IN { superadmin, head_admin, auditor,
                                     inventory_officer, technician }
     AND input.route IN { /profile, /rewards, /redeem-history,
                          /leaderboard, /qr }
END FUNCTION
```

### Examples

- Superadmin with valid session opens `/profile` → page renders, admin acts as a normal user (expected: force logout + redirect to `/?login=true`, no render).
- Technician changes URL from `/admin/machines` to `/rewards` → rewards page renders, admin activity recorded on public site (expected: force logout + redirect, no render).
- Auditor opens `/leaderboard` → leaderboard renders under admin session (expected: force logout + redirect, no render).
- Regular `user` opens `/profile` → page renders (expected behavior, NOT the bug — preserved).
- Unauthenticated visitor opens `/qr` → redirect to `/?login=true` (expected behavior, NOT the bug — preserved).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Non-admin authenticated users (`user`, `dependent`) continue to render protected user pages normally.
- Unauthenticated visitors continue to redirect to `/?login=true` and render no protected content.
- Bootstrapping state (`isInitialized === false`) continues to render nothing and perform no redirect.
- Admins navigating within `/admin/*` continue to render the dashboard with the session active (out of `RequireAuth` scope).
- HTTP 401 handling (`ecopoints:unauthorized`) continues to clear state and redirect to the landing page.

**Scope:**
All inputs where `isBugCondition` is false must be completely unaffected. This includes:
- Non-admin authenticated sessions on protected user routes.
- Unauthenticated sessions on any route.
- Any session while auth is still bootstrapping.
- Admin sessions on `/admin/*` routes (guarded by `AdminLayout`, not `RequireAuth`).

**Note:** The expected correct behavior for the bug condition is defined in the Correctness Properties section (Property 1).

## Hypothesized Root Cause

1. **Missing role-based denial branch**: `RequireAuth` collapses the entire authenticated case into "render children." It checks `!currentUser` only, with no inspection of `currentUser.role` against `ADMIN_ROLES`. This is the primary cause.

2. **No force-logout side effect**: Even with a denial branch, the guard must invalidate the server session. Calling only `router.replace` would leave the HttpOnly cookie valid, so the admin session would persist. The fix must invoke `logout` from AuthContext.

3. **Flash risk if denial renders before redirect**: The guard must return `null` during the denial window (same pattern as the unauthenticated branch) to satisfy the no-flash requirement; rendering `children` before the effect fires would leak content.

4. **Effect ordering / double-invocation**: The force-logout side effect must be idempotent and gated on `isInitialized` so the boot probe does not trigger it and React re-renders do not fire multiple `logout` calls.

## Correctness Properties

Property 1: Bug Condition - Admin denied and force-logged-out on protected user route

_For any_ input where the bug condition holds (`isBugCondition` returns true — a fully-initialized, authenticated admin-role account on a protected user route), the fixed `RequireAuth` SHALL render no protected content, force-log-out the session (server `logout` invalidating the HttpOnly cookie plus client state cleared), and redirect to `/?login=true`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-bug inputs unchanged

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false), the fixed `RequireAuth` SHALL produce the same result as the original guard, preserving behavior for non-admin authenticated users, unauthenticated visitors, bootstrapping state, admins inside `/admin/*`, and the existing 401 (`ecopoints:unauthorized`) flow.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct:

**File**: `client/src/components/auth/RequireAuth.jsx`

**Function**: `RequireAuth` (default export)

**Specific Changes**:

1. **Import `ADMIN_ROLES`**: Add `ADMIN_ROLES` to the `useAuth`/AuthContext imports. Pull `logout` from `useAuth()` alongside `currentUser` and `isInitialized`.

2. **Add admin-role detection**: Derive `isAdmin = !!currentUser && ADMIN_ROLES.has(currentUser.role)` on each render.

3. **Extend redirect computation**: When `isInitialized` is true, compute `redirectTo` as `/?login=true` for either branch — `!currentUser` (existing) OR `isAdmin` (new). Keep `null` otherwise.
   - `redirectTo = isInitialized && (!currentUser || isAdmin) ? '/?login=true' : null`

4. **Force-logout side effect**: In an effect gated on `isInitialized && isAdmin`, call `await logout()` once before/alongside the redirect so the server session (HttpOnly cookie) is invalidated and client state cleared. Guard against double invocation (e.g., a ref flag) so React re-renders do not repeat the server call.

5. **Preserve no-flash return**: Keep `if (!isInitialized || redirectTo) return null;` so neither the bootstrapping window nor the admin-denial window paints `children`.

6. **Scope check (route)**: `RequireAuth` only wraps protected user routes, so the route component of the bug condition is satisfied structurally by which pages mount the guard — no explicit pathname check is required inside the component. Admin `/admin/*` routes are guarded by `AdminLayout` and never mount `RequireAuth`, preserving Requirement 3.3.

## Testing Strategy

### Validation Approach

Two phases: first surface counterexamples that demonstrate the bug on the unfixed guard, then verify the fix denies + force-logs-out admins and preserves all non-bug behavior. Tests mock `next/navigation` (capture `router.replace`) and `useAuth` (inject `currentUser`, `isInitialized`, spy `logout`), matching the existing harness in `client/tests/property/page-guards.test.js`.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause (missing role-based denial branch). If refuted, re-hypothesize.

**Test Plan**: Render `RequireAuth` wrapping a `data-testid="protected"` child with an injected admin `currentUser` and `isInitialized = true`. Assert the protected content is absent, `logout` was called, and `router.replace('/?login=true')` fired. Run on the UNFIXED guard to observe failures.

**Test Cases**:
1. **Superadmin on protected route**: inject `role: 'superadmin'` → expect deny+logout+redirect (will fail on unfixed code — content renders).
2. **Technician on protected route**: inject `role: 'technician'` → expect deny+logout+redirect (will fail on unfixed code).
3. **Auditor on protected route**: inject `role: 'auditor'` → expect deny+logout+redirect (will fail on unfixed code).
4. **All ADMIN_ROLES coverage**: iterate every role in `ADMIN_ROLES` → expect deny+logout+redirect for each (will fail on unfixed code).

**Expected Counterexamples**:
- Protected content renders for admin sessions; `logout` never invoked; no `router.replace`.
- Cause: `redirectTo` resolves to `null` because only `!currentUser` is checked.

### Fix Checking

**Goal**: For all inputs where the bug condition holds, the fixed guard produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := RequireAuth_fixed(input)
  ASSERT result.rendersProtectedContent = false
     AND result.sessionForceLoggedOut = true   // server logout + client state cleared
     AND result.redirectedTo = '/?login=true'
END FOR
```

### Preservation Checking

**Goal**: For all inputs where the bug condition does NOT hold, the fixed guard produces the same result as the original guard.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT RequireAuth_original(input) = RequireAuth_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation because:
- It generates many `(role, isInitialized)` combinations automatically across the input domain.
- It catches edge cases manual unit tests miss (e.g., `dependent` role, `isInitialized = false` with a set user).
- It provides strong guarantees behavior is unchanged for every non-buggy input.

**Test Plan**: Observe behavior on the UNFIXED guard for non-admin users, unauthenticated visitors, and bootstrapping state, then write property-based tests over the role × init-state domain asserting identical render/redirect outcomes and that `logout` is never called for non-bug inputs.

**Test Cases**:
1. **Non-admin authenticated render**: `role ∈ {user, dependent}`, `isInitialized = true` → content renders, no redirect, no `logout`.
2. **Unauthenticated redirect**: `currentUser = null`, `isInitialized = true` → no content, `router.replace('/?login=true')`, no `logout`.
3. **Bootstrapping no-op**: `isInitialized = false` (with and without a set user) → no content, no redirect, no `logout`.
4. **Admin inside /admin/\***: admin session on an `/admin/*` route (guarded by `AdminLayout`, `RequireAuth` not mounted) → dashboard renders, session active.

### Unit Tests

- Admin denial + force logout + redirect for each role in `ADMIN_ROLES`.
- Non-admin authenticated user renders children with no `logout` call.
- Unauthenticated visitor redirects to `/?login=true`.
- `isInitialized === false` renders nothing and performs no redirect or `logout`.
- `logout` invoked at most once per admin denial (idempotency).

### Property-Based Tests

- Over the full `role × isInitialized` domain, assert non-bug inputs match the original guard's render/redirect outcome and never call `logout`.
- Over all `ADMIN_ROLES`, assert deny + `logout` + `router.replace('/?login=true')` and no protected content rendered.
- Assert no flash: protected `data-testid` never present in the DOM for any admin or unauthenticated input.

### Integration Tests

- Full flow: log in as admin, navigate to each protected user route (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`) → force logout, land on `/?login=true`, session invalidated (subsequent `GET /auth/me` 401).
- Context switch: admin in `/admin/*` then manual URL change to a protected user route → denied and logged out.
- Regression: log in as `user`, navigate the same protected routes → pages render, session stays active; 401 mid-session still clears state and redirects to landing.
