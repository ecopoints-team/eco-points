'use client';

/**
 * RequireAuth — Client-side authentication guard for protected user routes.
 *
 * When fully initialized and unauthenticated, redirects to /?login=true which
 * lands on the home page and automatically opens the login modal. Mirrors the
 * behavior of AdminLayout for consistency.
 *
 * Behavior matrix:
 *   - Auth still loading (isInitialized === false) → render nothing, no redirect
 *   - Unauthenticated (isInitialized === true && !currentUser) → router.replace('/?login=true'), render nothing
 *   - Authenticated (isInitialized === true && currentUser) → render children
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_ROLES } from '../../context/AuthContext';

export default function RequireAuth({ children }) {
    const { currentUser, isInitialized, logout } = useAuth();
    const router = useRouter();

    const isAdmin = !!currentUser && ADMIN_ROLES.has(currentUser.role);

    const redirectTo = isInitialized && (!currentUser || isAdmin) ? '/?login=true' : null;

    // Guard against double logout invocation across React re-renders.
    const logoutFiredRef = useRef(false);

    useEffect(() => {
        if (redirectTo) {
            router.replace(redirectTo);
        }
    }, [redirectTo, router]);

    // Force-logout effect: invalidate the server session (HttpOnly cookie)
    // and clear client state when an admin role lands on a protected user route.
    // Uses cleanup-based guard so React Strict Mode's mount/unmount/remount
    // cycle does not fire multiple server logout calls.
    useEffect(() => {
        if (!(isInitialized && isAdmin)) return;
        if (logoutFiredRef.current) return;
        logoutFiredRef.current = true;

        let cancelled = false;
        logout().catch(() => {}).finally(() => {
            if (cancelled) return;
            // Logout done — state already cleared by AuthContext.
        });

        return () => { cancelled = true; };
    }, [isInitialized, isAdmin, logout]);

    // Render nothing during bootstrap and while redirect is in flight.
    // Prevents any flash of protected content.
    if (!isInitialized || redirectTo) {
        return null;
    }

    return <>{children}</>;
}
