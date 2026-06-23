'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../../src/components/admin/RequirePermission';
import { SkeletonTableRow } from '../../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../../src/components/admin/PageSizeSelector';
import AddUserModal from '../../../../src/components/admin/AddUserModal';
import { useAuth } from '../../../../src/context/AuthContext';
import { useProgress } from '../../../../src/context/ProgressContext';
import { ROLES } from '../../../../src/data/roleConfig';
import * as usersApi from '../../../../src/services/api/users';
import { formatField } from '../../../../src/lib/formatField';
import { userRoleLabel } from '../../../../src/lib/enumLabels';
import { Shield, Check, X, Users, Settings, FileText, Package, Activity, LayoutDashboard, Eye, Edit2, Trash2, Download, Plus, Building2, ChevronDown, Wrench, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, AlertTriangle, BarChart3, Layers } from 'lucide-react';

// ============================================================================
// USING ADMIN_USERS FROM MOCKDATA - Connected to School A & B accounts
// ============================================================================

// 3-Role Permission Structure (Snipe-IT Inspired)
const ROLES_DATA = [
    {
        id: 'head_admin',
        name: 'Head Admin',
        description: 'Full system access with all permissions',
        color: 'purple',
        icon: Shield,
        userCount: 1,
        permissions: {
            dashboard: { view: true, edit: true },
            users: { view: true, edit: true, delete: true, create: true },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: true, edit: true, delete: true, create: true },
            analytics: { view: true },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: true }
        }
    },
    {
        id: 'auditor',
        name: 'Auditor',
        description: 'Data integrity focus - View and Export only',
        color: 'blue',
        icon: Eye,
        userCount: 1,
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: true, edit: false, delete: false, create: false },
            machines: { view: true, edit: false, delete: false, create: false },
            rewards: { view: true, edit: false, delete: false, create: false },
            analytics: { view: true },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: true, delete: false },
            settings: { view: true, edit: false }
        }
    },
    {
        id: 'inventory_officer',
        name: 'Inventory Officer',
        description: 'Logistics focus - Rewards management',
        color: 'emerald',
        icon: Package,
        userCount: 0,
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: false, edit: false, delete: false, create: false },
            rewards: { view: true, edit: true, delete: true, create: true },
            analytics: { view: false },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: false, delete: false },
            settings: { view: true, edit: false }
        }
    },
    {
        id: 'technician',
        name: 'Technician',
        description: 'Maintenance focus - Machines & Logs',
        color: 'amber',
        icon: Wrench,
        userCount: 0,
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: true, edit: true, delete: true, create: true },
            rewards: { view: false, edit: false, delete: false, create: false },
            analytics: { view: false },
            bulk_sessions: { view: true, create: true },
            logs: { view: true, export: false, delete: false },
            settings: { view: true, edit: false }
        }
    }
];

// Permission modules configuration
const PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, actions: ['view', 'edit'] },
    { key: 'users', label: 'User Management', icon: Users, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'machines', label: 'Machines (RVM)', icon: Package, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'rewards', label: 'Rewards Inventory', icon: FileText, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, actions: ['view'] },
    { key: 'bulk_sessions', label: 'Bulk Sessions', icon: Layers, actions: ['view', 'create'] },
    { key: 'logs', label: 'System Logs', icon: Activity, actions: ['view', 'export'] },
    { key: 'settings', label: 'System Settings', icon: Settings, actions: ['view', 'edit'] },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const PermissionBadge = ({ enabled }) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${enabled
        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
        : 'bg-red-100 text-red-400 dark:bg-red-500/10 dark:text-red-400/50'
        }`}>
        {enabled ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={2} />}
    </div>
);

const RoleCard = ({ role, isSelected, onClick, users }) => {
    const RoleIcon = role.icon;
    const roleUsers = users.filter(u => u.role === role.id);

    const colorClasses = {
        purple: 'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700',
        blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
        emerald: 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
        amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    };

    const badgeColors = {
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${isSelected
                ? 'bg-emerald-50 border-2 border-emerald-500 shadow-lg dark:bg-emerald-900/20 dark:border-emerald-500'
                : 'bg-slate-50 border-2 border-transparent hover:border-slate-200 dark:bg-slate-800/50 dark:hover:border-slate-600'
                }`}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[role.color]} shadow-md`}>
                    <RoleIcon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColors[role.color]}`}>
                            {role.name}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{role.description}</p>

                    {/* Users with this role */}
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {roleUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-800"
                                    title={user.name}
                                >
                                    {user.avatar}
                                </div>
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </button>
    );
};

const UserAccountRow = ({ user, onRoleChange, onEdit, onDelete }) => {
    const { currentUser, isSuperAdmin, hasPermission, allLocations } = useAuth();

    // Permission-gated actions
    const canEditUsers = hasPermission('users', 'edit');
    const canDeleteUsers = hasPermission('users', 'delete');

    const roleColors = {
        head_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        auditor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        inventory_officer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        technician: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    const roleNames = {
        head_admin: 'Head Admin',
        auditor: 'Auditor',
        inventory_officer: 'Inventory Officer',
        technician: 'Technician',
    };

    // Get location name from user's locationId. Server already returns
    // `locationName` directly (alignment doc §14); fall back to a lookup
    // against `allLocations` for legacy rows that still lack the field.
    const locationDisplay = user.locationName ?? (() => {
        const loc = allLocations.find(l => l.id === user.locationId);
        return loc ? loc.name : null;
    })();

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
            <td className="px-3 py-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatField(user.displayId ?? user.id)}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(user.name)}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(user.email)}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-600 dark:text-slate-300">{formatField(locationDisplay)}</span>
            </td>
            <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleColors[user.role]}`}>
                    {roleNames[user.role] || userRoleLabel(user.role)}
                </span>
            </td>
            <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(user.lastLogin)}</span>
            </td>
            <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                    {canEditUsers && (
                        <button onClick={() => onEdit && onEdit(user)} className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all" title="Edit Permissions">
                            <Edit2 size={14} />
                        </button>
                    )}
                    {canDeleteUsers && (
                        <button onClick={() => onDelete && onDelete(user)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all" title="Delete Admin">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

// ============================================================================

function PermissionsPageContent() {
    const { currentUser, isSuperAdmin, viewAsLocationId, allLocations } = useAuth();
    const { runWithProgress } = useProgress();
    const [roles] = useState(ROLES_DATA);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState([]);

    // Search, Filter, Pagination state
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterLocation, setFilterLocation] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Edit and Delete modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [adminUsers, setAdminUsers] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Load admin users from API
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsDataLoading(true);
            try {
                const raw = await usersApi.getAll({ isAdmin: true });
                if (cancelled) return;
                const mapped = raw
                    .filter(u => u.role !== 'superadmin')
                    .map(u => ({
                        ...u,
                        id: String(u.id),
                        avatar: u.name ? u.name.charAt(0).toUpperCase() : '?',
                        // Phase 3 (8.3): consume the server-supplied `permissions`
                        // object once it arrives (added by task 8.2). Until 8.2
                        // ships, fall back to the local `ROLES[role].permissions`
                        // map so the matrix still renders.
                        permissions: u.permissions ?? ROLES[u.role]?.permissions ?? {},
                    }));
                setAllUsers(mapped);
                setAdminUsers(mapped);
            } catch (err) {
                console.error('Failed to load admin users:', err);
            } finally {
                if (!cancelled) setIsDataLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [refreshKey]);
    const [editFormData, setEditFormData] = useState({
        firstName: '', middleName: '', lastName: '', email: '', role: '', isActive: true, locationId: ''
    });

    // Handle Edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        // Try firstName/lastName from server; fall back to parsing name
        let fn = user.firstName || '', mn = user.middleName || '', ln = user.lastName || '';
        if (!fn && !ln && user.name) {
            const parts = user.name.trim().split(/\s+/);
            fn = parts[0] || '';
            ln = parts.length > 2 ? parts.slice(2).join(' ') : (parts[1] || '');
            mn = parts.length > 2 ? parts[1] : '';
        }
        setEditFormData({
            firstName: fn,
            middleName: mn,
            lastName: ln,
            email: user.email || '',
            role: user.role || '',
            isActive: user.isActive !== false,
            locationId: user.locationId || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async () => {
        if (selectedUser) {
            try {
                await runWithProgress('Saving changes...', async () => {
                    await usersApi.update(selectedUser.id, {
                        firstName: editFormData.firstName.trim(),
                        middleName: editFormData.middleName.trim() || null,
                        lastName: editFormData.lastName.trim(),
                        email: editFormData.email,
                        role: editFormData.role,
                        isActive: editFormData.isActive,
                    });
                    const roleChanged = editFormData.role !== selectedUser.role;
                    const newPermissions = roleChanged
                        ? ROLES[editFormData.role]?.permissions || selectedUser.permissions
                        : selectedUser.permissions;

                    const updatedName = [editFormData.firstName, editFormData.middleName, editFormData.lastName].filter(Boolean).join(' ');
                    setAdminUsers(prev => prev.map(u =>
                        u.id === selectedUser.id
                            ? { ...u, ...editFormData, name: updatedName, avatar: editFormData.firstName.charAt(0).toUpperCase(), permissions: newPermissions }
                            : u
                    ));
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }, { successLabel: 'Admin updated' });
            } catch (err) {
                console.error('Failed to save admin:', err);
                alert(err?.message || 'Failed to save admin. Please try again.');
            }
        }
    };

    // Handle Delete
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedUser) {
            try {
                await runWithProgress('Deleting admin...', async () => {
                    await usersApi.delete(selectedUser.id);
                    setAdminUsers(prev => prev.filter(u => u.id !== selectedUser.id));
                }, { successLabel: 'Admin deleted' });
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
            } catch (err) {
                console.error('Failed to delete admin:', err);
                alert(err?.message || 'Failed to delete admin. Please try again.');
            }
        }
    };

    // Filter users based on viewAsLocationId, then apply search/filters
    const filteredUsers = useMemo(() => {
        let result = adminUsers;

        // Location scope filter
        if (viewAsLocationId) {
            result = result.filter(u => u.locationId === viewAsLocationId);
        } else if (!isSuperAdmin && currentUser?.locationId) {
            result = result.filter(u => u.locationId === currentUser.locationId);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(u =>
                String(u.id).toLowerCase().includes(q) ||
                (u.displayId || '').toLowerCase().includes(q) ||
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q)
            );
        }

        // Dropdown filters
        if (filterLocation) result = result.filter(u => u.locationId === filterLocation);
        if (filterRole) result = result.filter(u => u.role === filterRole);
        // Status filter binds directly to `isActive` (alignment doc §14:
        // dropped the synthetic Online/Offline derivation).
        if (filterStatus) {
            const wantActive = filterStatus === 'Online' || filterStatus === 'Active';
            result = result.filter(u => u.isActive === wantActive);
        }

        // Sorting
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                if (sortColumn === 'id') {
                    aVal = parseInt(aVal) || 0;
                    bVal = parseInt(bVal) || 0;
                } else {
                    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                }
                if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
        } else {
            // Default to newest first (descending User ID)
            result = [...result].sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
        }

        return result;
    }, [adminUsers, viewAsLocationId, isSuperAdmin, currentUser, searchQuery, filterLocation, filterRole, filterStatus, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

    // Pagination page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }) => {
        if (sortColumn !== column) return <ChevronsUpDown size={12} className="text-slate-400" />;
        return sortDirection === 'asc'
            ? <ChevronUp size={12} className="text-emerald-500" />
            : <ChevronDown size={12} className="text-emerald-500" />;
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilterLocation('');
        setFilterRole('');
        setFilterStatus('');
        setSortColumn('');
        setCurrentPage(1);
    };
    const hasActiveFilters = filterLocation || filterRole || filterStatus || sortColumn;

    const [selectedRole, setSelectedRole] = useState(roles[0]);

    // Handle role change for a user
    const handleRoleChange = async (userId, newRole) => {
        try {
            await usersApi.update(userId, { role: newRole });
            setAllUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole, permissions: ROLES[newRole]?.permissions || u.permissions } : u
            ));
            setAdminUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole, permissions: ROLES[newRole]?.permissions || u.permissions } : u
            ));
        } catch (err) {
            alert(err.message || 'Failed to update role.');
        }
    };

    const getColorClasses = (color) => ({
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    }[color] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header */}
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manage Admins</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage roles and permissions for admin users</p>
                    </div>
                    {(isSuperAdmin || currentUser?.permissions?.users?.create) && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Admin</span>
                        </button>
                    )}
                </div>
            </ViewOnlyWrapper>


            {/* Role & Permission Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
                {/* Roles Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl h-full flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
                                System Roles
                            </h3>
                        </div>
                        <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                            {roles.map(role => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    isSelected={selectedRole.id === role.id}
                                    onClick={() => setSelectedRole(role)}
                                    users={filteredUsers}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Permission Matrix */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl h-full flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Permissions for{' '}
                                <span className={`px-2 py-0.5 rounded-full text-sm ${getColorClasses(selectedRole.color)}`}>
                                    {selectedRole.name}
                                </span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Module</th>
                                        <th className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Eye size={14} />
                                                <span>View</span>
                                            </div>
                                        </th>
                                        <th className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Edit2 size={14} />
                                                <span>Edit</span>
                                            </div>
                                        </th>
                                        <th className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Plus size={14} />
                                                <span>Create</span>
                                            </div>
                                        </th>
                                        <th className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Trash2 size={14} />
                                                <span>Delete</span>
                                            </div>
                                        </th>
                                        <th className="px-3 py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Download size={14} />
                                                <span>Export</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {PERMISSION_MODULES.map(module => (
                                        <tr key={module.key} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                                                        <module.icon size={16} className="text-slate-600 dark:text-slate-300" />
                                                    </div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{module.label}</span>
                                                </div>
                                            </td>
                                            {['view', 'edit', 'create', 'delete', 'export'].map(action => (
                                                <td key={action} className="px-3 py-4 text-center">
                                                    {module.actions.includes(action) ? (
                                                        <div className="flex justify-center">
                                                            <PermissionBadge
                                                                enabled={selectedRole.permissions[module.key]?.[action] || false}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Users Table */}
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-x-auto backdrop-blur-xl">
                {/* Header with Search & Filters */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full dark:shadow-[0_0_10px_#10b981]"></span>
                        Admin User Accounts
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                            <input type="text" placeholder="Search ID, Name, Email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={() => { setCurrentPage(1); setRefreshKey(k => k + 1); }}
                            disabled={isDataLoading}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Refresh">
                            <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center">
                        <CustomDropdown value={filterLocation} onChange={(v) => { setFilterLocation(v); setCurrentPage(1); }} options={allLocations.map(loc => ({ value: loc.id, label: loc.name }))} placeholder="All Locations" />
                        <CustomDropdown value={filterRole} onChange={(v) => { setFilterRole(v); setCurrentPage(1); }} options={[{ value: 'head_admin', label: 'Head Admin' }, { value: 'auditor', label: 'Auditor' }, { value: 'inventory_officer', label: 'Inventory Officer' }, { value: 'technician', label: 'Technician' }]} placeholder="All Roles" />
                        <CustomDropdown value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} options={['Active', 'Inactive']} placeholder="All Status" />
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"><X size={14} /> Clear</button>}
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} label={null} direction="down" />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                className="p-1.5 rounded border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                <ChevronLeft size={12} />
                            </button>
                            <span className="px-2 py-1 text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                                className="p-1.5 rounded border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-1">User ID <SortIcon column="id" /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="name" /></div>
                                </th>
                                <th className="px-3 py-3 whitespace-nowrap">Email</th>
                                <th className="px-3 py-3 whitespace-nowrap">Location</th>
                                <th className="px-3 py-3 whitespace-nowrap">Duty</th>
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                                <th className="px-3 py-3 whitespace-nowrap">Acct Health</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('lastLogin')}>
                                    <div className="flex items-center gap-1">Last Login <SortIcon column="lastLogin" /></div>
                                </th>
                                <th className="px-3 py-3 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={9} />)
                            ) : currentUsers.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onRoleChange={handleRoleChange}
                                    onEdit={handleEdit}
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredUsers.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length} admins</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                                <ChevronLeft size={14} />
                            </button>
                            {getPageNumbers().map((page, idx) => (
                                <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={page === '...'}
                                    className={`px-3 py-1.5 rounded-lg transition-all font-medium ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : page === '...' ? 'cursor-default text-slate-400 dark:text-slate-500' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                    {page}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>


            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={(newUser) => {
                    const mapped = { ...newUser, id: String(newUser.id), avatar: (newUser.name || '?').charAt(0).toUpperCase() };
                    setAllUsers(prev => [mapped, ...prev]);
                    setAdminUsers(prev => [mapped, ...prev]);
                }}
            />

            {/* Edit Admin Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {editFormData.firstName ? editFormData.firstName.charAt(0).toUpperCase() : (selectedUser.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Admin</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {selectedUser.id}</p>
                            </div>
                            <button onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }} className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name: 3-column grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">First Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={editFormData.firstName}
                                        onChange={(e) => handleEditChange('firstName', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Middle Name</label>
                                    <input type="text" value={editFormData.middleName}
                                        onChange={(e) => handleEditChange('middleName', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Last Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={editFormData.lastName}
                                        onChange={(e) => handleEditChange('lastName', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-purple-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" value={editFormData.email}
                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role <span className="text-red-500">*</span></label>
                                    <CustomDropdown
                                        value={editFormData.role}
                                        onChange={(v) => handleEditChange('role', v)}
                                        options={[
                                            { value: 'head_admin', label: 'Head Admin' },
                                            { value: 'auditor', label: 'Auditor' },
                                            { value: 'inventory_officer', label: 'Inventory Officer' },
                                            { value: 'technician', label: 'Technician' }
                                        ]}
                                        showPlaceholder={false}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Account Status <span className="text-red-500">*</span></label>
                                    <CustomDropdown
                                        value={editFormData.isActive ? 'Active' : 'Inactive'}
                                        onChange={(v) => handleEditChange('isActive', v === 'Active')}
                                        options={['Active', 'Inactive']}
                                        showPlaceholder={false}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location <span className="text-red-500">*</span></label>
                                    <CustomDropdown
                                        value={editFormData.locationId}
                                        onChange={(v) => handleEditChange('locationId', v)}
                                        options={allLocations.map(loc => ({ value: loc.id, label: loc.name }))}
                                        placeholder="Select Location"
                                        searchable
                                        showPlaceholder={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={!editFormData.firstName.trim() || !editFormData.lastName.trim() || !editFormData.email.trim()}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Edit2 size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Admin</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Are you sure you want to delete this admin?
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                    {selectedUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">{selectedUser.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setIsDeleteModalOpen(false); setSelectedUser(null); }}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function PermissionsPage() {
    return (
        <RequirePermission category="users">
            <PermissionsPageContent />
        </RequirePermission>
    );
}
