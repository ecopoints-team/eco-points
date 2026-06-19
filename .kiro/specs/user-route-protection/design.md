# User Route Protection Bugfix Design

## Overview

User-facing client routes (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`) render their protected page shells for any visitor, including unauthenticated ones. Only the admin area is guarded today, via `RequirePermission.jsx` and `AdminLayout.jsx`. Backend endpoints reject unauthenticated requests (HTTP 401), but the client still paints layout, controls, and — on `/qr` — hardcoded strings resembling privileged access codes before any session check runs.

The fix introduces a single client-side authentication guard, `RequireAuth`, modeled on the existing admin guard. It redirects fully-initialized unauthenticated visitors to `/?login=true` (matching admin behavior), renders no protected content during a redirect, and defers the access decision while the session is still bootstrapping (`isInitialized === false`). The guard wraps each protected user page. All non-buggy behavior — authenticated users, public routes, the admin area, logout, and 401 handling — is preserved untouched.

## Glossary

- **Bug_Condition (C)**: A fully-initialized session (`isInitialized === true`) with no authenticated user (`currentUser === null`) on a protected user route. When C holds, the page must redirect instead of rendering.
- **Property (P)**: For inputs satisfying C, the fixed code redirects to `/?login=true` and renders no protected content.
- **Preservation**: Every input where C does not hold behaves exactly as before — authenticated users on any route, any visitor on a public route, any visitor while `isInitialized === false`, and the entire admin area.
- **RequireAuth**: New client component in `client/src/components/auth/RequireAuth.jsx` that gates protected user pages, mirroring `RequirePermission`.
- **AuthContext**: Source of `currentUser` (null when unauthenticated) and `isInitialized` (false until the `GET /auth/me` boot probe resolves).
- **PROTECTED**: The route set `{ /profile, /rewards, /redeem-history, /leaderboard, /qr }`.

## Bug Details

### Bug Condition

The bug manifests when a fully-initialized, unauthenticated visitor targets a protected user route. The protected page component renders its shell directly off `useAuth()` state without enforcing the presence of `currentUser`, so the guard step that the admin area performs is simply absent for these routes.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { route, currentUser, isInitialized }
  OUTPUT: boolean

  RETURN input.isInitialized = true
     AND input.currentUser = null
     AND input.route IN { "/profile", "/rewards", "/redeem-history", "/leaderboard", "/qr" }
END FUNCTION
```

### Examples

- Unauthenticated visit to `/profile` — expected: redirect to `/?login=true`, no profile shell; actual: profile page shell renders.
- Unauthenticated visit to `/rewards` — expected: redirect to `/?login=true`; actual: rewards page renders.
- Unauthenticated visit to `/redeem-history` — expected: redirect to `/?login=true`; actual: redeem-history page renders.
- Unauthenticated visit to `/leaderboard` — expected: redirect to `/?login=true`; actual: leaderboard renders with a "Login" affordance.
- Unauthenticated visit to `/qr` — expected: redirect to `/?login=true`; actual: QR page renders, exposing hardcoded access-code strings (`MAINTENANCE:SECRET-KEY-999`).
- Edge case: visit to `/profile` while `isInitialized === false` — expected: no protected content, no premature redirect; decision deferred until bootstrap completes.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authenticated users navigating to any protected route continue to see that page exactly as today.
- Any visitor on a public route (`/`, `/login`) continues to render without redirect.
- The admin area (`/admin` and sub-routes) remains governed by the existing `RequirePermission` / `AdminLayout` guards, unchanged.
- The 401 → `ecopoints:unauthorized` handler in `AuthContext` continues to clear in-memory state and redirect.
- Logout continues to redirect to `/`.

**Scope:**
All inputs that do NOT satisfy the bug condition must be completely unaffected by this fix. This includes:
- Authenticated visitors on any route.
- Any visitor on a public route.
- Any visitor while `isInitialized === false` (no premature redirect).
- The entire admin area and its existing guards.

**Note:** The expected correct behavior for buggy inputs is defined in the Correctness Properties section (Property 1).

## Hypothesized Root Cause

Based on the bug description and code review, the cause is a missing guard rather than a malfunctioning one:

1. **Absent client-side guard on user routes**: Protected user pages render directly from `useAuth()` state with no `currentUser` enforcement. `/profile` checks only `isInitialized` (to show a skeleton) and never redirects when `currentUser` is null.

2. **Guard coverage limited to admin tree**: `AdminLayout.jsx` and `RequirePermission.jsx` enforce auth, but they wrap only `app/admin/*`. User routes (`app/profile`, `app/rewards`, `app/redeem-history`, `app/leaderboard`, `app/qr`) have no shared protective layout.

3. **Reliance on backend 401 only**: Protection is assumed to come from API rejection, but page shells render before/without any API call, so unauthenticated content is still painted.

4. **No deferral contract for bootstrap window**: Even where `isInitialized` is consulted, there is no consistent "render nothing and wait" contract during the `isInitialized === false` window for these routes.

## Correctness Properties

Property 1: Bug Condition - Unauthenticated Visitor Redirected From Protected Route

_For any_ input where the bug condition holds (`isBugCondition` returns true — fully initialized, no `currentUser`, on a route in PROTECTED), the fixed code SHALL redirect to `/?login=true` and SHALL NOT render any protected page content.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Buggy Inputs Unchanged

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false — authenticated visitor on any route, any visitor on a public route, any visitor while `isInitialized === false`, or any admin-area route), the fixed code SHALL produce the same result as the original code, preserving rendering, redirect, logout, and 401 behavior. In particular, while `isInitialized === false` the guard SHALL render no protected content and SHALL NOT redirect.

**Validates: Requirements 2.6, 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct, add a dedicated user-route guard and apply it to each protected page.

**New File**: `client/src/components/auth/RequireAuth.jsx`

**Component**: `RequireAuth`

**Behavior matrix (mirrors `RequirePermission`):**
- Auth still loading (`isInitialized === false`) → render nothing, do not redirect.
- Unauthenticated (`isInitialized === true && !currentUser`) → `router.replace('/?login=true')`, render nothing.
- Authenticated → render `children`.

**Specific Changes**:
1. **Create the guard**: Implement `RequireAuth` using `useAuth()` (`currentUser`, `isInitialized`) and `useRouter()`. Compute `redirectTo` on every render; fire `router.replace(redirectTo)` inside a `useEffect`. Return `null` while `!isInitialized || redirectTo` to avoid any flash of protected content.

   ```
   FUNCTION RequireAuth({ children })
     { currentUser, isInitialized } := useAuth()
     router := useRouter()

     redirectTo := null
     IF isInitialized AND NOT currentUser THEN
       redirectTo := '/?login=true'

     useEffect(() => { IF redirectTo THEN router.replace(redirectTo) }, [redirectTo, router])

     IF (NOT isInitialized) OR redirectTo THEN RETURN null
     RETURN children
   END FUNCTION
   ```

2. **Wrap `/profile`**: Wrap the page content of `client/app/profile/page.js` in `<RequireAuth>`. Preserve the existing `ProfileSkeleton` shown while `isInitialized === false` (the guard also returns null during that window, so the skeleton path stays consistent).

3. **Wrap `/rewards`**: Wrap `client/app/rewards/page.js` content in `<RequireAuth>`.

4. **Wrap `/redeem-history`**: Wrap `client/app/redeem-history/page.js` content in `<RequireAuth>`.

5. **Wrap `/leaderboard`**: Wrap `client/app/leaderboard/page.js` content in `<RequireAuth>`.

6. **Wrap `/qr`**: Wrap `client/app/qr/page.js` content in `<RequireAuth>`, ensuring the hardcoded access-code strings are never rendered before the redirect resolves.

**Notes:**
- No change to `AuthContext`, `RequirePermission`, `AdminLayout`, or any admin route.
- No change to public routes (`/`, `/login`).
- Guard is applied per-page because user routes share no layout group; this keeps the change minimal and localized.

## Testing Strategy

### Validation Approach

Two phases: first surface counterexamples that demonstrate the bug on unfixed code, then verify the fix redirects buggy inputs and preserves all non-buggy behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix, confirming the root cause (missing guard) rather than a malfunctioning one. If refuted, re-hypothesize.

**Test Plan**: Render each protected page with `AuthContext` providing `{ currentUser: null, isInitialized: true }` and assert that no redirect occurs and protected content is present. Run on UNFIXED code to observe the bug.

**Test Cases**:
1. **Profile unauthenticated**: render `/profile` with no user — protected content renders, no redirect (will fail expectation on unfixed code).
2. **Rewards unauthenticated**: render `/rewards` with no user — renders instead of redirecting (will fail on unfixed code).
3. **Redeem-history unauthenticated**: render `/redeem-history` with no user — renders (will fail on unfixed code).
4. **Leaderboard unauthenticated**: render `/leaderboard` with no user — renders "Login" affordance (will fail on unfixed code).
5. **QR unauthenticated**: render `/qr` with no user — exposes hardcoded access-code strings (will fail on unfixed code).
6. **Edge — bootstrapping**: render `/profile` with `isInitialized === false` — assert no redirect (expected to already pass; documents the deferral contract).

**Expected Counterexamples**:
- Protected content is painted and `router.replace('/?login=true')` is never called for unauthenticated visitors.
- Cause: no client-side guard wraps these routes.

### Fix Checking

**Goal**: For all inputs where the bug condition holds, the fixed code redirects and renders no protected content.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderRoute_fixed(input)
  ASSERT result.redirectedTo = "/?login=true"
     AND result.protectedContentRendered = false
END FOR
```

### Preservation Checking

**Goal**: For all inputs where the bug condition does NOT hold, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderRoute_original(input) = renderRoute_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation because:
- It generates many inputs across the domain (route × auth state × init state).
- It catches edge cases manual tests miss, especially the `isInitialized === false` window.
- It gives strong guarantees that non-buggy behavior is unchanged.

**Test Plan**: Observe behavior on UNFIXED code for authenticated users, public routes, the bootstrap window, and the admin area, then write tests asserting identical behavior after the fix.

**Test Cases**:
1. **Authenticated render preservation**: Observe authenticated users render each protected route on unfixed code; assert identical render after fix.
2. **Bootstrap deferral preservation**: Observe that `isInitialized === false` renders no protected content and triggers no redirect; assert unchanged after fix.
3. **Public route preservation**: Observe `/` and `/login` render without redirect for unauthenticated visitors; assert unchanged.
4. **Admin area preservation**: Observe `/admin` guards (`RequirePermission` / `AdminLayout`) behavior; assert unchanged.

### Unit Tests

- `RequireAuth` renders `null` while `isInitialized === false`.
- `RequireAuth` calls `router.replace('/?login=true')` and renders `null` when initialized and unauthenticated.
- `RequireAuth` renders `children` when authenticated.
- Each protected page renders content for an authenticated user and redirects for an unauthenticated one.

### Property-Based Tests

- Generate `{ route ∈ PROTECTED, currentUser ∈ {null, user}, isInitialized ∈ {true,false} }`; assert redirect occurs iff `isBugCondition` holds, and no protected content renders during redirect or bootstrap.
- Generate authenticated states across all protected routes; assert content renders and no redirect fires (preservation).
- Generate `isInitialized === false` across all protected routes; assert no redirect (deferral preserved).

### Integration Tests

- Full navigation: unauthenticated direct-URL hit to each protected route lands on `/?login=true` with the login prompt and no protected content flash.
- Login flow: after authenticating, navigation to each protected route renders normally.
- Admin flow: admin login and navigation across `/admin` sub-routes remains governed by existing guards, with user-route guard not interfering.
