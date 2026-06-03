'use client';

/**
 * RequirePermission — Phase 2 client-side admin page guard.
 *
 * Wraps an admin page and ensures the authenticated user has the required
 * permission category. The authoritative `permission_categories` list comes
 * from the server via `GET /api/web/auth/me` (see Phase 2 task 6.3) and is
 * exposed on the user object via `AuthContext`.
 *
 * Behavior matrix:
 *   - Auth still loading           → render nothing (the AdminLayout shows
 *                                     its own "Verifying access..." spinner)
 *   - Unauthenticated              → router.replace('/?login=true')
 *   - role ∈ {user, dependent}     → router.replace('/rewards')
 *   - category ∉ permission_categories → router.replace('/admin')
 *   - otherwise                    → render children
 *
 * Usage:
 *   <RequirePermission category="users">
 *     <UsersPage />
 *   </RequirePermission>
 *
 * Phase 2 — Requirements 2.3, 2.4
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const NON_ADMIN_ROLES = new Set(['user', 'dependent']);

export default function RequirePermission({ category, children }) {
    const { currentUser, isInitialized } = useAuth();
    const router = useRouter();

    // Compute the redirect target (if any) based on current auth state. We
    // derive it on every render so the effect below always sees the latest
    // value, but we only fire the redirect once auth has finished bootstrapping.
    let redirectTo = null;
    if (isInitialized) {
        if (!currentUser) {
            redirectTo = '/?login=true';
        } else if (NON_ADMIN_ROLES.has(currentUser.role)) {
            redirectTo = '/rewards';
        } else {
            const categories = Array.isArray(currentUser.permission_categories)
                ? currentUser.permission_categories
                : [];
            if (category && !categories.includes(category)) {
                redirectTo = '/admin';
            }
        }
    }

    useEffect(() => {
        if (redirectTo) {
            router.replace(redirectTo);
        }
    }, [redirectTo, router]);

    // While auth is still loading, or while a redirect is in flight, render
    // nothing. The surrounding AdminLayout already paints a loading spinner
    // during the bootstrap window, so an empty fragment here avoids a flash
    // of protected content before the redirect completes.
    if (!isInitialized || redirectTo) {
        return null;
    }

    return <>{children}</>;
}
