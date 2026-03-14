/**
 * EcoPoints — Role definitions and permission configuration.
 * Static config (not mock data). Used by AuthContext and AdminLayout.
 */

export const ROLES = {
    superadmin: {
        name: 'Super Admin',
        description: 'Global access to all locations and features',
        color: 'red',
        scope: 'global',
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            leaderboards: { view: true, edit: true },
            analytics: { view: true },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: true, delete: true },
            settings: { view: true, edit: true }
        }
    },
    head_admin: {
        name: 'Head Admin',
        description: 'Full access within assigned location',
        color: 'purple',
        scope: 'location',
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            leaderboards: { view: true, edit: true },
            analytics: { view: true },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: true }
        }
    },
    auditor: {
        name: 'Auditor',
        description: 'View and export data within assigned location',
        color: 'blue',
        scope: 'location',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: true, edit: false, delete: false, create: false },
            machines: { view: true, edit: false, delete: false, create: false },
            rewards: { view: true, edit: false, delete: false, create: false },
            leaderboards: { view: true, edit: false },
            analytics: { view: true },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: false }
        }
    },
    inventory_officer: {
        name: 'Inventory Officer',
        description: 'Manages rewards and inventory for assigned location',
        color: 'amber',
        scope: 'location',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: true, edit: false, delete: false, create: false },
            machines: { view: true, edit: false, delete: false, create: false },
            rewards: { view: true, edit: true, delete: true, create: true },
            leaderboards: { view: true, edit: false },
            analytics: { view: true },
            bulk_sessions: { view: false, create: false },
            logs: { view: true, export: false, delete: false },
            settings: { view: true, edit: false }
        }
    },
    technician: {
        name: 'Technician',
        description: 'Manages machines and maintenance for assigned location',
        color: 'green',
        scope: 'location',
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: true, edit: true, delete: false, create: false },
            rewards: { view: false, edit: false, delete: false, create: false },
            leaderboards: { view: true, edit: false },
            analytics: { view: true },
            bulk_sessions: { view: false, create: false },
            logs: { view: true, export: false, delete: false },
            settings: { view: false, edit: false }
        }
    },
};

export const hasPermission = (user, module, action) => user?.permissions?.[module]?.[action] || false;
export const isSuperAdmin = (user) => user?.role === 'superadmin';
