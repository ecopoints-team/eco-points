'use client';
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth as authApi, locations as locationsApi } from '../services/api';
import { ROLES } from '../data/roleConfig';

// ============================================================================
// AUTH CONTEXT — JWT-Based Auth, Location Scoping, Permissions
// ============================================================================

const AuthContext = createContext(null);

// Roles that belong to the admin panel only.
// Exported so the public NavBar can hide admin user info.
export const ADMIN_ROLES = new Set([
    'superadmin', 'head_admin', 'auditor', 'technician', 'inventory_officer',
]);

// Helper: attach role-based permissions to user object so existing code works
function enrichUser(user) {
    if (!user) return null;
    const roleConfig = ROLES[user.role];
    return { ...user, permissions: roleConfig?.permissions || {} };
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [allLocations, setAllLocations] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // "View as Location" mode for Super Admin
    const [viewAsLocationId, setViewAsLocationId] = useState(null);

    // Keep a live reference to the signed-in user so the unauthorized event
    // handler (which is registered once on mount) can read the latest value
    // without re-binding on every state change.
    const currentUserRef = useRef(null);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

    // Next.js router for the post-401 redirect to the landing page. The
    // hook MUST be called at the top level of the provider so it stays
    // stable across renders.
    const router = useRouter();

    // ── Bootstrap: probe session via cookie + load context data on mount ──
    //
    // The JWT lives in an HttpOnly cookie (Phase 4B), so the Client cannot
    // ask "am I logged in?" without a network round-trip. We unconditionally
    // call `GET /auth/me`; the browser attaches the cookie automatically.
    // A 401 (or any error) means there is no valid session and we stay
    // logged out — no `localStorage` token to clear.
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            try {
                const user = await authApi.me();
                if (cancelled) return;
                setCurrentUser(enrichUser(user));
                try {
                    const locs = await locationsApi.getAll();
                    if (!cancelled) setAllLocations(locs);
                } catch {
                    /* non-critical — locations may be reloaded later */
                }
            } catch {
                /* not signed in (or expired session) — render logged out */
            }
            if (!cancelled) {
                setIsInitialized(true);
                setIsLoading(false);
            }
        };
        init();
        return () => { cancelled = true; };
    }, []);

    // ── 401 handler: clear in-memory state and redirect to landing ───────
    //
    // `client.js` dispatches `ecopoints:unauthorized` on every HTTP 401.
    // We only react when a user is currently signed in — the boot probe's
    // 401 (no session yet) is normal and MUST NOT trigger a redirect.
    //
    // Phase 4B — Requirements 4B.16, 7.6.
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handler = () => {
            if (!currentUserRef.current) return;
            setCurrentUser(null);
            setAllLocations([]);
            setViewAsLocationId(null);
            try {
                router.replace('/');
            } catch {
                // Fallback if the router isn't ready (very early in the
                // tree). Hard-navigate so the user lands on a clean page.
                if (typeof window.location !== 'undefined') {
                    window.location.assign('/');
                }
            }
        };
        window.addEventListener('ecopoints:unauthorized', handler);
        return () => window.removeEventListener('ecopoints:unauthorized', handler);
    }, [router]);

    // ── Derived: is this user a super admin? ────────────────────────────
    const isSuperAdminUser = currentUser?.role === 'superadmin';

    // ── Effective location (for data scoping) ───────────────────────────
    const effectiveLocationId = useMemo(() => {
        if (isSuperAdminUser) return viewAsLocationId;
        return currentUser?.locationId;
    }, [currentUser, viewAsLocationId, isSuperAdminUser]);

    const currentLocation = useMemo(() => {
        if (!effectiveLocationId) return null;
        return allLocations.find(loc => loc.id === effectiveLocationId);
    }, [effectiveLocationId, allLocations]);

    // ── Actions ─────────────────────────────────────────────────────────
    const login = useCallback(async (identifier, password) => {
        const data = await authApi.login(identifier, password);
        // Skip the post-login load on 2FA challenges — the cookie is only
        // issued after `verifyOtp`, so `/locations` would 401 here.
        if (data && data.user) {
            setCurrentUser(enrichUser(data.user));
            try {
                const locs = await locationsApi.getAll();
                setAllLocations(locs);
            } catch { /* non-critical */ }
        }
        return data;
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setCurrentUser(null);
        setAllLocations([]);
        setViewAsLocationId(null);
    }, []);

    const setViewAsLocation = useCallback((locationId) => {
        if (isSuperAdminUser) setViewAsLocationId(locationId);
    }, [isSuperAdminUser]);

    // ── Permission helpers ──────────────────────────────────────────────
    const hasPermission = useCallback((module, action) => {
        if (!currentUser) return false;
        if (currentUser.role === 'superadmin') return true;
        return currentUser.permissions?.[module]?.[action] || false;
    }, [currentUser]);

    const canAccessLocation = useCallback((locationId) => {
        if (isSuperAdminUser) return true;
        return currentUser?.locationId === locationId;
    }, [currentUser, isSuperAdminUser]);

    // Client-side filter (for data already fetched)
    const filterDataByLocation = useCallback((data) => {
        if (!effectiveLocationId) return data;
        return data.filter(item => item.locationId === effectiveLocationId);
    }, [effectiveLocationId]);

    // ── Refresh helpers ─────────────────────────────────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const user = await authApi.me();
            setCurrentUser(enrichUser(user));
        } catch { /* ignore */ }
    }, []);

    const refreshLocations = useCallback(async () => {
        try {
            const locs = await locationsApi.getAll();
            setAllLocations(locs);
        } catch { /* ignore */ }
    }, []);

    // ── Context value ───────────────────────────────────────────────────
    const value = {
        // User state
        currentUser,
        setCurrentUser,
        login,
        logout,
        isInitialized,
        isLoading,

        // Location state
        effectiveLocationId,
        currentLocation,
        viewAsLocationId,
        setViewAsLocation,
        allLocations,

        // Permission helpers
        hasPermission,
        canAccessLocation,
        isSuperAdmin: isSuperAdminUser,
        canManage: isSuperAdminUser || currentUser?.role === 'head_admin',

        // Data helpers
        filterDataByLocation,
        refreshUser,
        refreshLocations,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
