/**
 * Per-role dashboard Quick Actions (QA spec).
 *
 * Each entry: { label, icon, color, href, permission: [category, verb] }
 * `icon` is the lucide-react icon name string; the dashboard maps it to the
 * imported component. `permission` is checked with hasPermission(category, verb).
 */
export const QUICK_ACTIONS = {
    head_admin: [
        { label: 'Rewards',       icon: 'Trophy',   color: 'purple',  href: '/admin/rewards',      permission: ['rewards', 'view'] },
        { label: 'Manage Users',  icon: 'Users',    color: 'emerald', href: '/admin/users',        permission: ['users', 'view'] },
        { label: 'Machines',      icon: 'Package',  color: 'amber',   href: '/admin/machines',     permission: ['machines', 'view'] },
        { label: 'Admin Logs',    icon: 'FileText', color: 'blue',    href: '/admin/logs/access',  permission: ['logs', 'view'] },
    ],
    auditor: [
        { label: 'User Management', icon: 'Users',     color: 'emerald', href: '/admin/users',         permission: ['users', 'view'] },
        { label: 'Analytics',       icon: 'BarChart3', color: 'blue',    href: '/admin/analytics',     permission: ['analytics', 'view'] },
        { label: 'System Logs',     icon: 'FileText',  color: 'purple',  href: '/admin/logs/access',   permission: ['logs', 'view'] },
        { label: 'Bulk Sessions',   icon: 'Boxes',     color: 'amber',   href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
    ],
    inventory_officer: [
        { label: 'Rewards Inventory', icon: 'Trophy',   color: 'purple',  href: '/admin/rewards',       permission: ['rewards', 'view'] },
        { label: 'Bulk Sessions',     icon: 'Boxes',    color: 'amber',   href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
        { label: 'System Logs',       icon: 'FileText', color: 'blue',    href: '/admin/logs/access',   permission: ['logs', 'view'] },
    ],
    technician: [
        { label: 'Machines',      icon: 'Package',  color: 'amber',   href: '/admin/machines',      permission: ['machines', 'view'] },
        { label: 'Bulk Sessions', icon: 'Boxes',    color: 'emerald', href: '/admin/bulk-sessions', permission: ['sessions', 'view'] },
        { label: 'Session Logs',  icon: 'FileText', color: 'blue',    href: '/admin/logs/bottles',  permission: ['logs', 'view'] },
    ],
};
