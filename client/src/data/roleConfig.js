/**
 * EcoPoints — Role display metadata.
 * Permissions are authoritative from the server (GET /auth/me → `permissions`).
 * This file holds only display-only metadata: name, description, color, scope.
 */

export const ROLES = {
    superadmin: {
        name: 'Super Admin',
        description: 'Global access to all locations and features',
        color: 'red',
        scope: 'global',
    },
    head_admin: {
        name: 'Head Admin',
        description: 'Full access within assigned location',
        color: 'purple',
        scope: 'location',
    },
    auditor: {
        name: 'Auditor',
        description: 'View and export data within assigned location',
        color: 'blue',
        scope: 'location',
    },
    inventory_officer: {
        name: 'Inventory Officer',
        description: 'Manages rewards and inventory for assigned location',
        color: 'amber',
        scope: 'location',
    },
    technician: {
        name: 'Technician',
        description: 'Manages machines and maintenance for assigned location',
        color: 'green',
        scope: 'location',
    },
};

export const isSuperAdmin = (user) => user?.role === 'superadmin';
