# File: middleware.py
# RBAC Page Permissions - Admin Roles:
ROLE_PERMISSIONS = {
    'superadmin': {
    'CRUD - Locations, Machine, User Management (Users & Admins), Rewards, Bulk Session',
    'Create, Write -  System Logs (All), Settings',
    'View - Dashboard, Leaderboards, Analytics'
    },
    'head_admin': {
    'CRUD - Machine, User Management (Users & Admin), Rewards, Bulk Session',
    'Create, Write -  System Logs (All), Settings',
    'View - Dashboard, Leaderboards, Analytics'
    },
    'auditor': {
    'Create, Write - Bulk Session, System Logs (All), Settings',
    'View - Dashboard, Analytics, Leaderboards'
    },
    'technician': {
    'CRUD - Machine',
    'Create, Write - Settings',
    'View - Dashboard, System Logs (All)'
    },
    'inventory_officer': {
    'CRUD - Rewards',
    'Create, Write - Settings',
    'View - Dashboard, System Logs (All)'
    },
}


