'use client';
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ADMIN_USERS, LOCATIONS, filterByLocation, isSuperAdmin } from '../data/mockData';

// ============================================================================
// AUTH CONTEXT - User State & Location Filtering
// ============================================================================

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Current logged-in user (default to Super Admin for demo)
    const [currentUser, setCurrentUser] = useState(ADMIN_USERS[0]);
    const [isInitialized, setIsInitialized] = useState(false);

    // "View as Location" mode for Super Admin
    const [viewAsLocationId, setViewAsLocationId] = useState(null);

    // Load user from localStorage on initial mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('ecopoints_current_user');
            if (storedUserId) {
                const user = ADMIN_USERS.find(u => u.id === storedUserId);
                if (user) {
                    setCurrentUser(user);
                }
            }
            setIsInitialized(true);
        }
    }, []);

    // Save current user to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized && typeof window !== 'undefined') {
            if (currentUser) {
                localStorage.setItem('ecopoints_current_user', currentUser.id);
            }
        }
    }, [currentUser, isInitialized]);

    // Get the effective location ID (for filtering data)
    const effectiveLocationId = useMemo(() => {
        if (isSuperAdmin(currentUser)) {
            return viewAsLocationId; // Super Admin can view as specific location or null (all)
        }
        return currentUser?.locationId; // Regular admins can only see their location
    }, [currentUser, viewAsLocationId]);

    // Get current location object
    const currentLocation = useMemo(() => {
        if (!effectiveLocationId) return null;
        return LOCATIONS.find(loc => loc.id === effectiveLocationId);
    }, [effectiveLocationId]);

    // Switch user account (for demo purposes)
    const switchUser = (userId) => {
        const user = ADMIN_USERS.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
            setViewAsLocationId(null); // Reset location view when switching users
        }
    };

    // Set "View as Location" mode (Super Admin only)
    const setViewAsLocation = (locationId) => {
        if (isSuperAdmin(currentUser)) {
            setViewAsLocationId(locationId);
        }
    };

    // Check permission for current user
    const hasPermission = (module, action) => {
        if (!currentUser || !currentUser.permissions) return false;
        if (isSuperAdmin(currentUser)) return true;
        return currentUser.permissions[module]?.[action] || false;
    };

    // Check if current user can access a specific location's data
    const canAccessLocation = (locationId) => {
        if (isSuperAdmin(currentUser)) return true;
        return currentUser?.locationId === locationId;
    };

    // Filter data by effective location
    const filterDataByLocation = (data) => {
        return filterByLocation(data, effectiveLocationId);
    };

    // Logout function
    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('ecopoints_current_user');
        }
        setCurrentUser(null);
        setViewAsLocationId(null);
    };

    const value = {
        // User state
        currentUser,
        setCurrentUser,
        switchUser,
        logout,
        isInitialized,

        // Location state
        effectiveLocationId,
        currentLocation,
        viewAsLocationId,
        setViewAsLocation,

        // Permission helpers
        hasPermission,
        canAccessLocation,
        isSuperAdmin: isSuperAdmin(currentUser),
        canManage: isSuperAdmin(currentUser) || currentUser?.role === 'head_admin',

        // Data filtering
        filterDataByLocation,

        // All admin users (for account switcher)
        allAdminUsers: ADMIN_USERS,
        allLocations: LOCATIONS,
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
