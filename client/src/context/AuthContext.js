'use client';
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { auth as authApi, locations as locationsApi } from '../services/apiService';
import { ROLES } from '../data/mockData';

// ============================================================================
// AUTH CONTEXT — JWT-Based Auth, Location Scoping, Permissions
// ============================================================================

const AuthContext = createContext(null);

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

    // ── Bootstrap: validate token & load context data on mount ──────────
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            if (authApi.isAuthenticated()) {
                try {
                    const [user, locs] = await Promise.all([
                        authApi.me(),
                        locationsApi.getAll(),
                    ]);
                    if (!cancelled) {
                        setCurrentUser(enrichUser(user));
                        setAllLocations(locs);
                    }
                } catch {
                    // Token expired / invalid — clear it silently
                    authApi.logout().catch(() => {});
                }
            }
            if (!cancelled) {
                setIsInitialized(true);
                setIsLoading(false);
            }
        };
        init();
        return () => { cancelled = true; };
    }, []);

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
        setCurrentUser(enrichUser(data.user));
        try {
            const locs = await locationsApi.getAll();
            setAllLocations(locs);
        } catch { /* non-critical */ }
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
