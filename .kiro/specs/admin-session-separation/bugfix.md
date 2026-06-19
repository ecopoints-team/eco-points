# Bugfix Requirements Document

## Introduction

Admin-role accounts (`superadmin`, `head_admin`, `auditor`, `inventory_officer`, `technician`) are intended to live entirely separately from regular user accounts for RBAC security. The admin dashboard (`/admin/*`) is already guarded so non-admins are redirected away. However, the reverse boundary is not enforced: when an admin is logged into the dashboard and manually changes the URL to a user-facing website route (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`), the website treats the admin's valid session as a normal authenticated user and renders the page. The admin account then shows activity on the public website, breaking the strict admin/user separation.

The recently added `RequireAuth` guard (`client/src/components/auth/RequireAuth.jsx`) only blocks unauthenticated visitors (`isInitialized && !currentUser`). An admin holds a valid session, so `currentUser` is set, the `!currentUser` check passes, and the protected user page renders. This bugfix closes that gap: an authenticated admin-role account navigating to a protected user route must be treated as unauthorized — its session expired or force-logged-out — and routed away from the website. Admins who want a normal user experience must create a separate non-admin account.

## Bug Analysis

### Current Behavior (Defect)

`RequireAuth` admits any account with a valid session, including admin-role accounts, to protected user routes.

1.1 WHEN an admin-role account (`superadmin`, `head_admin`, `auditor`, `inventory_officer`, `technician`) with a valid session navigates to a protected user route (`/profile`, `/rewards`, `/redeem-history`, `/leaderboard`, `/qr`) THEN the system renders the user-facing page and lets the admin account act as a normal user
1.2 WHEN an admin-role account changes the URL from `/admin/*` to a protected user route THEN the system keeps the admin session active and records admin activity on the public website
1.3 WHEN `RequireAuth` evaluates an authenticated admin-role account THEN the system passes the `!currentUser` check and treats the admin as an authorized user, applying no role-based denial

### Expected Behavior (Correct)

2.1 WHEN an admin-role account with a valid session navigates to a protected user route THEN the system SHALL treat the session as unauthorized and SHALL NOT render the user-facing page content
2.2 WHEN an admin-role account is detected on a protected user route THEN the system SHALL force-log-out the session by clearing the server session (calling logout to invalidate/clear the HttpOnly cookie) in addition to clearing client auth state
2.3 WHEN an admin-role account is force-logged-out from a protected user route THEN the system SHALL redirect the account to the login entry point (`/?login=true`)
2.4 WHEN `RequireAuth` evaluates an authenticated account THEN the system SHALL deny access for any account whose role is in `ADMIN_ROLES`, independent of the `!currentUser` check
2.5 WHEN an admin-role account is denied at a protected user route THEN the system SHALL NOT flash protected page content before the redirect/logout completes

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a non-admin authenticated user navigates to a protected user route THEN the system SHALL CONTINUE TO render the user-facing page normally
3.2 WHEN an unauthenticated visitor navigates to a protected user route THEN the system SHALL CONTINUE TO redirect to `/?login=true` and render no protected content
3.3 WHEN an admin-role account navigates within the admin dashboard (`/admin/*`) THEN the system SHALL CONTINUE TO render the dashboard and keep the admin session active
3.4 WHEN auth is still bootstrapping (`isInitialized === false`) THEN the system SHALL CONTINUE TO render nothing and perform no redirect on protected user routes
3.5 WHEN a non-admin user is on a non-protected/public route THEN the system SHALL CONTINUE TO behave exactly as before
3.6 WHEN any account triggers an HTTP 401 (`ecopoints:unauthorized`) THEN the system SHALL CONTINUE TO clear state and redirect to the landing page

## Bug Condition Methodology

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { currentUser, isInitialized, route }
  OUTPUT: boolean

  // Bug triggers for a fully-initialized, authenticated admin-role account
  // sitting on a protected user route.
  RETURN X.isInitialized = true
     AND X.currentUser <> null
     AND X.currentUser.role IN { superadmin, head_admin, auditor,
                                 inventory_officer, technician }
     AND X.route IN { /profile, /rewards, /redeem-history,
                      /leaderboard, /qr }
END FUNCTION
```

### Property Specification (Fix Checking)

```pascal
// Property: Fix Checking — admin denied + force logout on protected user route
FOR ALL X WHERE isBugCondition(X) DO
  result ← RequireAuth'(X)
  ASSERT result.rendersProtectedContent = false
     AND result.sessionForceLoggedOut = true   // server logout + client state cleared
     AND result.redirectedTo = '/?login=true'
END FOR
```

### Preservation Goal (Preservation Checking)

```pascal
// Property: Preservation Checking — all non-buggy inputs unchanged
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT RequireAuth(X) = RequireAuth'(X)
END FOR
```

This guarantees non-admin authenticated users, unauthenticated visitors, bootstrapping states, and admins inside `/admin/*` behave identically before and after the fix.

**Key Definitions:**
- **F** = `RequireAuth` (current guard, admits any authenticated account)
- **F'** = `RequireAuth'` (fixed guard, denies admin-role accounts on protected user routes)
- **C(X)** = `isBugCondition(X)` above
- **Counterexample** = superadmin with valid session visiting `/profile` → page renders, admin activity recorded on website
