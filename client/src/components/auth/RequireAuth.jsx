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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function RequireAuth({ children }) {
    const { currentUser, isInitialized } = useAuth();
    const router = useRouter();

    const redirectTo = isInitialized && !currentUser ? '/?login=true' : null;

    useEffect(() => {
        if (redirectTo) {
            router.replace(redirectTo);
        }
    }, [redirectTo, router]);

    // Render nothing during bootstrap and while redirect is in flight.
    // Prevents any flash of protected content.
    if (!isInitialized || redirectTo) {
        return null;
    }

    return <>{children}</>;
}
