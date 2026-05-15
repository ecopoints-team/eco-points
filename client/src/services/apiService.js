/**
 * EcoPoints — Unified API Service Layer
 * Replaces direct mockData imports with real backend calls.
 *
 * All endpoints go through the Next.js rewrite:  /api/* → http://127.0.0.1:5000/api/*
 * Auth token is stored in localStorage and attached via Authorization header.
 */

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}/api/web`;

// ═══════════════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('ecopoints_token');
}

function setToken(token) {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ecopoints_token', token);
    }
}

function clearToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('ecopoints_token');
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CORE REQUEST HELPER
// ═══════════════════════════════════════════════════════════════════════

async function request(endpoint, { method = 'GET', body = null, params = {} } = {}) {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) url.searchParams.set(k, v);
    });

    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    // Handle auth errors globally
    if (response.status === 401) {
        clearToken();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
            // Already on landing page, do nothing
        } else if (typeof window !== 'undefined') {
            window.location.href = '/?login=true';
        }
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════

export const auth = {
    /**
     * Login with email/username + password.
     * Returns { token, user }.
     */
    login: async (identifier, password) => {
        const data = await request(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: { email: identifier, password },
        });
        setToken(data.token);
        return data;
    },

    /**
     * Get the currently logged-in user from the JWT token.
     */
    me: async () => {
        const data = await request(`${API_BASE}/auth/me`);
        return data.user;
    },

    /**
     * Logout (server logs it, client deletes token).
     */
    logout: async () => {
        try {
            await request(`${API_BASE}/auth/logout`, { method: 'POST' });
        } catch {
            // Even if server call fails, clear local token
        }
        clearToken();
    },

    /**
     * Change password for current user.
     */
    changePassword: async (currentPassword, newPassword) => {
        return await request(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            body: { currentPassword, newPassword },
        });
    },

    /**
     * Update current user's profile fields (name, email, phone).
     */
    updateProfile: async (profileData) => {
        const data = await request(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            body: profileData,
        });
        return data.user;
    },

    /** Check if a token exists locally. */
    isAuthenticated: () => !!getToken(),

    /** Get the raw token. */
    getToken,

    /**
     * Public registration for regular users.
     * Body: { name, username?, email?, phone?, password, userType, locationId, groupId?, yearLevel? }
     */
    register: async (userData) => {
        return await request(`${API_BASE}/auth/register`, {
            method: 'POST',
            body: userData,
        });
    },

    /**
     * Public: get active locations for signup dropdown.
     */
    getPublicLocations: async () => {
        const data = await request(`${API_BASE}/auth/locations`);
        return data.locations;
    },

    /**
     * Public: get community groups for a given location.
     */
    getPublicGroups: async (locationId) => {
        const data = await request(`${API_BASE}/auth/groups`, {
            params: { location_id: locationId },
        });
        return data.groups;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export const dashboard = {
    getStats: async (locationId = null) => {
        const data = await request(`${API_BASE}/dashboard/stats`, {
            params: { location_id: locationId },
        });
        return data.stats;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS  (comprehensive insights)
// ═══════════════════════════════════════════════════════════════════════

export const analytics = {
    getData: async (locationId = null) => {
        const data = await request(`${API_BASE}/analytics`, {
            params: { location_id: locationId },
        });
        return data.analytics;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// ORG TYPES (lookup — superadmin managed)
// ═══════════════════════════════════════════════════════════════════════

export const orgTypes = {
    getAll: async () => {
        const data = await request(`${API_BASE}/org-types`);
        return data.orgTypes;
    },
    create: async (name) => {
        const data = await request(`${API_BASE}/org-types`, { method: 'POST', body: { name } });
        return data.orgType;
    },
    delete: async (id) => {
        return await request(`${API_BASE}/org-types/${id}`, { method: 'DELETE' });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// CITIES (lookup — superadmin managed)
// ═══════════════════════════════════════════════════════════════════════

export const cities = {
    getAll: async () => {
        const data = await request(`${API_BASE}/cities`);
        return data.cities;
    },
    create: async (cityData) => {
        const data = await request(`${API_BASE}/cities`, { method: 'POST', body: cityData });
        return data.city;
    },
    delete: async (id) => {
        return await request(`${API_BASE}/cities/${id}`, { method: 'DELETE' });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// LOCATIONS (Organizations)
// ═══════════════════════════════════════════════════════════════════════

export const locations = {
    getAll: async (locationId = null) => {
        const data = await request(`${API_BASE}/locations`, {
            params: { location_id: locationId },
        });
        return data.locations;
    },

    create: async (locationData) => {
        const data = await request(`${API_BASE}/locations`, {
            method: 'POST',
            body: locationData,
        });
        return data.location;
    },

    update: async (id, locationData) => {
        const data = await request(`${API_BASE}/locations/${id}`, {
            method: 'PUT',
            body: locationData,
        });
        return data.location;
    },

    delete: async (id) => {
        return await request(`${API_BASE}/locations/${id}`, { method: 'DELETE' });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════

export const users = {
    getAll: async ({ locationId, role, userType, isAdmin } = {}) => {
        const data = await request(`${API_BASE}/users`, {
            params: {
                location_id: locationId,
                role,
                user_type: userType,
                is_admin: isAdmin,
            },
        });
        return data.users;
    },

    getById: async (id) => {
        const data = await request(`${API_BASE}/users/${id}`);
        return data.user;
    },

    create: async (userData) => {
        const data = await request(`${API_BASE}/users`, {
            method: 'POST',
            body: userData,
        });
        return data.user;
    },

    update: async (id, userData) => {
        const data = await request(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            body: userData,
        });
        return data.user;
    },

    delete: async (id) => {
        return await request(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    },

    adjustPoints: async (id, { amount, reason }) => {
        return await request(`${API_BASE}/users/${id}/adjust-points`, {
            method: 'POST',
            body: { amount, reason },
        });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// MACHINES (RVMs)
// ═══════════════════════════════════════════════════════════════════════

export const machines = {
    getAll: async (locationId = null) => {
        const data = await request(`${API_BASE}/machines`, {
            params: { location_id: locationId },
        });
        return data.machines;
    },

    create: async (machineData) => {
        const data = await request(`${API_BASE}/machines`, {
            method: 'POST',
            body: machineData,
        });
        return data.machine;
    },

    update: async (id, machineData) => {
        const data = await request(`${API_BASE}/machines/${id}`, {
            method: 'PUT',
            body: machineData,
        });
        return data.machine;
    },

    delete: async (id) => {
        return await request(`${API_BASE}/machines/${id}`, { method: 'DELETE' });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// REWARDS
// ═══════════════════════════════════════════════════════════════════════

export const rewards = {
    getAll: async (locationId = null) => {
        const data = await request(`${API_BASE}/rewards`, {
            params: { location_id: locationId },
        });
        return data.rewards;
    },

    create: async (rewardData) => {
        const data = await request(`${API_BASE}/rewards`, {
            method: 'POST',
            body: rewardData,
        });
        return data.reward;
    },

    update: async (id, rewardData) => {
        const data = await request(`${API_BASE}/rewards/${id}`, {
            method: 'PUT',
            body: rewardData,
        });
        return data.reward;
    },

    delete: async (id) => {
        return await request(`${API_BASE}/rewards/${id}`, { method: 'DELETE' });
    },

    redeem: async (rewardId, { variantId = null, quantity = 1 } = {}) => {
        const data = await request(`${API_BASE}/rewards/${rewardId}/redeem`, {
            method: 'POST',
            body: { variantId, quantity },
        });
        return data.redemption;
    },

    getMyRedemptions: async () => {
        const data = await request(`${API_BASE}/rewards/my-redemptions`);
        return data.redemptions;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════════════════════

export const logs = {
    getBottles: async (locationId = null) => {
        const data = await request(`${API_BASE}/logs/bottles`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },

    getMachines: async (locationId = null) => {
        const data = await request(`${API_BASE}/logs/machines`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },

    createMachineLog: async (logData) => {
        const data = await request(`${API_BASE}/logs/machines`, {
            method: 'POST',
            body: logData,
        });
        return data.log;
    },

    getAccess: async (locationId = null) => {
        const data = await request(`${API_BASE}/logs/access`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },

    getRewards: async (locationId = null) => {
        const data = await request(`${API_BASE}/logs/rewards`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },

    updateRedemptionStatus: async (redemptionId, status) => {
        const data = await request(`${API_BASE}/logs/rewards/${redemptionId}`, {
            method: 'PUT',
            body: { status },
        });
        return data.log;
    },

    getTransactions: async (locationId = null) => {
        const data = await request(`${API_BASE}/logs/transactions`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════

export const leaderboard = {
    get: async (locationId = null) => {
        const data = await request(`${API_BASE}/leaderboard`, {
            params: { location_id: locationId },
        });
        return { topUsers: data.topUsers, topGroups: data.topGroups };
    },
};

// ═══════════════════════════════════════════════════════════════════════
// COMMUNITY GROUPS
// ═══════════════════════════════════════════════════════════════════════

export const groups = {
    getAll: async (locationId = null) => {
        const data = await request(`${API_BASE}/groups`, {
            params: { location_id: locationId },
        });
        return data.groups;
    },

    create: async (groupData) => {
        const data = await request(`${API_BASE}/groups`, {
            method: 'POST',
            body: groupData,
        });
        return data.group;
    },

    update: async (id, groupData) => {
        const data = await request(`${API_BASE}/groups/${id}`, {
            method: 'PUT',
            body: groupData,
        });
        return data.group;
    },

    delete: async (id) => {
        return await request(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
    },
};

// ═══════════════════════════════════════════════════════════════════════
// HEALTH CHECK (public, no auth)
// ═══════════════════════════════════════════════════════════════════════

export const healthCheck = async () => {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        return data.success === true;
    } catch {
        return false;
    }
};

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS (notifications + points configuration)
// ═══════════════════════════════════════════════════════════════════════

export const settings = {
    getNotifications: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/notifications`, {
            params: { location_id: locationId },
        });
        return { settings: data.settings, alertTypes: data.alertTypes };
    },

    updateNotifications: async (settingsArray, locationId = null) => {
        return await request(`${API_BASE}/settings/notifications`, {
            method: 'PUT',
            body: { settings: settingsArray },
            params: { location_id: locationId },
        });
    },

    testNotification: async (channel, recipient) => {
        return await request(`${API_BASE}/settings/notifications/test`, {
            method: 'POST',
            body: { channel, recipient },
        });
    },

    getNotificationLogs: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/notifications/logs`, {
            params: { location_id: locationId },
        });
        return data.logs;
    },

    getPointsConfig: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/points`, {
            params: { location_id: locationId },
        });
        return data.config;
    },

    updatePointsConfig: async (config, locationId = null) => {
        const data = await request(`${API_BASE}/settings/points`, {
            method: 'PUT',
            body: config,
            params: { location_id: locationId },
        });
        return data;
    },

    // ── Channel Config (Email & SMS) ──
    getChannelConfig: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/channels`, {
            params: { location_id: locationId },
        });
        return data.config;
    },

    updateChannelConfig: async (config, locationId = null) => {
        return await request(`${API_BASE}/settings/channels`, {
            method: 'PUT',
            body: config,
            params: { location_id: locationId },
        });
    },

    // ── Security Config ──
    getSecurityConfig: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/security`, {
            params: { location_id: locationId },
        });
        return data.config;
    },

    updateSecurityConfig: async (config, locationId = null) => {
        return await request(`${API_BASE}/settings/security`, {
            method: 'PUT',
            body: config,
            params: { location_id: locationId },
        });
    },

    forceLogoutAll: async (locationId = null) => {
        return await request(`${API_BASE}/settings/security/force-logout`, {
            method: 'POST',
            params: { location_id: locationId },
        });
    },

    getLoginHistory: async (locationId = null) => {
        const data = await request(`${API_BASE}/settings/security/login-history`, {
            params: { location_id: locationId },
        });
        return data.history;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// BULK SESSIONS
// ═══════════════════════════════════════════════════════════════════════

export const bulkSessions = {
    getAll: async (locationId = null) => {
        const data = await request(`${API_BASE}/sessions/bulk`, {
            params: { location_id: locationId },
        });
        return data.sessions;
    },

    create: async (sessionData) => {
        const data = await request(`${API_BASE}/sessions/bulk`, {
            method: 'POST',
            body: sessionData,
        });
        return data.session;
    },

    getById: async (id) => {
        const data = await request(`${API_BASE}/sessions/bulk/${id}`);
        return data.session;
    },
};

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT (for `import api from`)
// ═══════════════════════════════════════════════════════════════════════

const api = { auth, dashboard, analytics, orgTypes, cities, locations, users, machines, rewards, logs, leaderboard, groups, settings, bulkSessions, healthCheck };
export default api;
