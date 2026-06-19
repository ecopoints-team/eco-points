# Bugfix Requirements Document

## Introduction

User-facing routes have no authentication guard. A visitor with no account, or a user who is logged out, can navigate directly via URL to `/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, and `/qr` and have the page shell render. Only the admin area (`/admin`) is currently protected, via `RequirePermission.jsx` and `AdminLayout.jsx`. The public routes have no equivalent.

This is a security and session-integrity defect: protected content should not be reachable by unauthenticated visitors. The bug is on the client navigation/render layer — backend endpoints already reject unauthenticated requests (HTTP 401), but the client still paints the protected page shell before/without any session check, exposing layout, controls, and in the case of `/qr`, hardcoded strings that resemble privileged access codes (`MAINTENANCE:SECRET-KEY-999`).

The fix adds a client-side route guard (mirroring the admin guard and enhancing it) that redirects unauthenticated visitors away from protected user routes to the landing page with the login prompt, consistent with the admin guard's `/?login=true` behavior.

**Scope of protected routes (all auth-required):** `/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`.

## Bug Analysis

### Current Behavior (Defect)

When an unauthenticated visitor (no valid session; `currentUser` is `null` after `AuthContext` initializes) targets a user-facing route by URL or in-app navigation, the page renders instead of being blocked.

1.1 WHEN an unauthenticated visitor navigates to `/profile` THEN the system renders the profile page shell instead of blocking access
1.2 WHEN an unauthenticated visitor navigates to `/rewards` THEN the system renders the rewards page instead of blocking access
1.3 WHEN an unauthenticated visitor navigates to `/redeem-history` THEN the system renders the redeem-history page instead of blocking access
1.4 WHEN an unauthenticated visitor navigates to `/leaderboard` THEN the system renders the leaderboard page (showing a "Login" affordance) instead of blocking access
1.5 WHEN an unauthenticated visitor navigates to `/qr` THEN the system renders the QR page, exposing hardcoded access-code strings, instead of blocking access

### Expected Behavior (Correct)

Protected user routes must require a valid session. Unauthenticated visitors are redirected to the landing page with the login prompt, matching the admin guard pattern (`/?login=true`). No protected content is painted before the redirect resolves.

2.1 WHEN an unauthenticated visitor navigates to `/profile` THEN the system SHALL redirect to `/?login=true` without rendering protected content
2.2 WHEN an unauthenticated visitor navigates to `/rewards` THEN the system SHALL redirect to `/?login=true` without rendering protected content
2.3 WHEN an unauthenticated visitor navigates to `/redeem-history` THEN the system SHALL redirect to `/?login=true` without rendering protected content
2.4 WHEN an unauthenticated visitor navigates to `/leaderboard` THEN the system SHALL redirect to `/?login=true` without rendering protected content
2.5 WHEN an unauthenticated visitor navigates to `/qr` THEN the system SHALL redirect to `/?login=true` without rendering protected content
2.6 WHILE the session is still initializing (`isInitialized` is false) THEN the system SHALL render no protected content and SHALL NOT prematurely redirect, deferring the access decision until auth bootstrap completes

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an authenticated user navigates to any protected route (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`) THEN the system SHALL CONTINUE TO render that page as it does today
3.2 WHEN an unauthenticated visitor navigates to a public route (e.g. `/`, `/login`) THEN the system SHALL CONTINUE TO render that page without redirect
3.3 WHEN an admin user accesses the admin area (`/admin` and sub-routes) THEN the system SHALL CONTINUE TO be governed by the existing `RequirePermission` / `AdminLayout` guards, unchanged
3.4 WHEN a session becomes unauthorized (HTTP 401 → `ecopoints:unauthorized`) THEN the system SHALL CONTINUE TO clear in-memory auth state and redirect via the existing `AuthContext` handler
3.5 WHEN a user logs out THEN the system SHALL CONTINUE TO redirect to `/` as it does today

## Bug Condition Methodology

### Definitions

- **F**: Current client routing/render — protected user routes render regardless of session state.
- **F'**: Fixed client routing/render — protected user routes are gated by an auth guard.
- **Protected routes**: `PROTECTED = { /profile, /rewards, /redeem-history, /leaderboard, /qr }`
- **Auth state**: derived from `AuthContext` — `currentUser` (null when unauthenticated) and `isInitialized`.

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X = { route, currentUser, isInitialized }
  OUTPUT: boolean

  // Bug triggers when a fully-initialized, unauthenticated visitor
  // targets a protected route.
  RETURN X.isInitialized = true
     AND X.currentUser = null
     AND X.route IN { "/profile", "/rewards", "/redeem-history", "/leaderboard", "/qr" }
END FUNCTION
```

### Property Specification (Fix Checking)

```pascal
// Property: Unauthenticated visitors cannot reach protected content.
FOR ALL X WHERE isBugCondition(X) DO
  result ← F'(X)
  ASSERT result.redirectedTo = "/?login=true"
     AND result.protectedContentRendered = false
END FOR
```

### Preservation Goal (Preservation Checking)

```pascal
// Property: All non-buggy inputs behave identically to before the fix.
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

Non-buggy inputs include: authenticated visitors on any route, any visitor on a public route, any visitor while `isInitialized = false`, and the entire admin area.
