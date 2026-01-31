'use client';
import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import AddUserModal from '../../../../src/Components/AddUserModal';
import { useAuth } from '../../../../src/context/AuthContext';
import { ADMIN_USERS as MOCK_ADMIN_USERS, LOCATIONS, ROLES } from '../../../../src/data/mockData';
import { Shield, Check, X, Users, Settings, FileText, Package, Activity, LayoutDashboard, Eye, Edit2, Trash2, Download, Plus, UserCheck, Building2, ChevronDown, Wrench, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, AlertTriangle } from 'lucide-react';

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
            logs: { view: true, export: true, delete: false },
            settings: { view: false, edit: false }
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
            rewards: { view: true, edit: true, delete: false, create: true },
            logs: { view: true, export: false, delete: false },
            settings: { view: false, edit: false }
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
            machines: { view: true, edit: true, delete: false, create: false },
            rewards: { view: false, edit: false, delete: false, create: false },
            logs: { view: true, export: false, delete: false },
            settings: { view: false, edit: false }
        }
    }
];

// Permission modules configuration
const PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, actions: ['view', 'edit'] },
    { key: 'users', label: 'User Management', icon: Users, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'machines', label: 'Machines (RVM)', icon: Package, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'rewards', label: 'Rewards Inventory', icon: FileText, actions: ['view', 'edit', 'create', 'delete'] },
    { key: 'logs', label: 'System Logs', icon: Activity, actions: ['view', 'export'] },
    { key: 'settings', label: 'System Settings', icon: Settings, actions: ['view', 'edit'] },
];

// Action icons mapping
const ACTION_ICONS = {
    view: Eye,
    edit: Edit2,
    create: Plus,
    delete: Trash2,
    export: Download
};

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
        blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
        emerald: 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
        amber: 'from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700',
    };

    const badgeColors = {
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
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

const UserAccountRow = ({ user, onRoleChange }) => {
    const { user: currentUser, isSuperAdmin } = useAuth();
    const [isChangingRole, setIsChangingRole] = useState(false);

    // Check if current logged in user has permission to edit users
    const canEditUsers = isSuperAdmin || currentUser?.permissions?.users?.edit;

    const roleColors = {
        head_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        auditor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        auditor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        inventory_officer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        technician: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    const roleNames = {
        head_admin: 'Head Admin',
        auditor: 'Auditor',
        auditor: 'Auditor',
        inventory_officer: 'Inventory Officer',
        technician: 'Technician',
    };

    // Get location name from user's locationId
    const getLocationName = (locationId) => {
        const loc = LOCATIONS.find(l => l.id === locationId);
        return loc ? loc.name : 'All Locations';
    };

    const roleOptions = [
        { id: 'head_admin', name: 'Head Admin' },
        { id: 'auditor', name: 'Auditor' },
        { id: 'auditor', name: 'Auditor' },
        { id: 'inventory_officer', name: 'Inventory Officer' },
        { id: 'technician', name: 'Technician' },
    ];

    const handleRoleChange = async (newRole) => {
        if (newRole === user.role) {
            setIsChangingRole(false);
            return;
        }

        if (onRoleChange) {
            await onRoleChange(user.id, newRole);
        }
        setIsChangingRole(false);
    };

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
            <td className="px-3 py-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{user.id}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-sm font-medium text-slate-800 dark:text-white">{user.name}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-600 dark:text-slate-300">{getLocationName(user.locationId)}</span>
            </td>
            <td className="px-3 py-3">
                {isChangingRole ? (
                    <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        onBlur={() => setIsChangingRole(false)}
                        autoFocus
                        className="px-2 py-1 text-xs font-bold rounded-lg border border-emerald-500 
                            bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                            outline-none cursor-pointer"
                    >
                        {roleOptions.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                ) : (
                    <button
                        onClick={() => canEditUsers && setIsChangingRole(true)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleColors[user.role]} 
                            ${canEditUsers ? 'hover:ring-2 hover:ring-offset-1 hover:ring-emerald-500 cursor-pointer' : 'cursor-default opacity-80'} 
                            transition-all`}
                        title={canEditUsers ? "Click to change role" : "You don't have permission to change roles"}
                        disabled={!canEditUsers}
                    >
                        {roleNames[user.role]}
                    </button>
                )}
            </td>
            <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.status === 'Online'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                    {user.status}
                </span>
            </td>
            <td className="px-3 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.accountHealth === 'Active'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                    {user.accountHealth}
                </span>
            </td>
            <td className="px-3 py-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.lastLogin}</span>
            </td>
            <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit && onEdit(user)} className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all" title="Edit Permissions">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete && onDelete(user)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all" title="Delete Admin">
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// Helper function for handling edit/delete in table
const UserAccountRowWithActions = ({ user, onEdit, onDelete }) => (
    <UserAccountRow user={user} onEdit={onEdit} onDelete={onDelete} />
);

// ============================================================================

export default function PermissionsPage() {
    const { user: currentUser, isSuperAdmin, viewAsLocationId } = useAuth();
    const [roles] = useState(ROLES_DATA);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // Use ADMIN_USERS from mockData (filter out super_admin for local admins only)
    const [allUsers] = useState(MOCK_ADMIN_USERS.filter(u => u.role !== 'super_admin'));

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
    const [adminUsers, setAdminUsers] = useState(MOCK_ADMIN_USERS.filter(u => u.role !== 'super_admin'));

    // Handle Edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    // Handle Delete
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            setAdminUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
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
                u.id.toLowerCase().includes(q) ||
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            );
        }

        // Dropdown filters
        if (filterLocation) result = result.filter(u => u.locationId === filterLocation);
        if (filterRole) result = result.filter(u => u.role === filterRole);
        if (filterStatus) result = result.filter(u => u.status === filterStatus);

        // Sorting
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
        }

        return result;
    }, [allUsers, viewAsLocationId, isSuperAdmin, currentUser, searchQuery, filterLocation, filterRole, filterStatus, sortColumn, sortDirection]);

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + rowsPerPage);

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
    const hasActiveFilters = filterLocation || filterRole || filterStatus;

    const [selectedRole, setSelectedRole] = useState(roles[0]);

    // Handle role change for a user
    const handleRoleChange = async (userId, newRole) => {
        // This would update in a real app
    };

    const getColorClasses = (color) => ({
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
    }[color] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');

    return (
        <>
            {/* Page Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manage Admins</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage roles and permissions for admin users</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Add Admin
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Shield size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Roles</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{roles.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <UserCheck size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Admin Users</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{allUsers.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Activity size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Permission Modules</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{PERMISSION_MODULES.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role & Permission Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Roles Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
                                System Roles
                            </h3>
                        </div>
                        <div className="p-3 space-y-2">
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
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Permissions for{' '}
                                <span className={`px-2 py-0.5 rounded-full text-sm ${getColorClasses(selectedRole.color)}`}>
                                    {selectedRole.name}
                                </span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
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
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
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
                        <button onClick={() => window.location.reload()}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors"
                            title="Refresh">
                            <RefreshCw size={16} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center">
                        <div className="relative">
                            <select value={filterLocation} onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Locations</option>
                                {LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Roles</option>
                                <option value="head_admin">Head Admin</option>
                                <option value="auditor">Auditor</option>
                                <option value="inventory_officer">Inventory Officer</option>
                                <option value="technician">Technician</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Status</option>
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"><X size={14} /> Clear</button>}
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={150}>150</option><option value={200}>200</option>
                            </select>
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
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-3 py-3">User ID</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="name" /></div>
                                </th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Location</th>
                                <th className="px-3 py-3">Duty</th>
                                <th className="px-3 py-3">Status</th>
                                <th className="px-3 py-3">Acct Health</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('lastLogin')}>
                                    <div className="flex items-center gap-1">Last Login <SortIcon column="lastLogin" /></div>
                                </th>
                                <th className="px-3 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentUsers.map(user => (
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
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={150}>150</option><option value={200}>200</option>
                            </select>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><ChevronLeft size={14} /></button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>


            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={(newUser) => {
                    // In a real app, you'd add to DB and refresh
                    // Here we just update local state if needed or show success
                    console.log("Admin Added", newUser);
                    // For demo purposes, we might want to update allUsers if we can access setAllUsers
                    // But allUsers is derived from MockData which we can't easily mutate from here persistenty.
                    // We'll just close for now.
                }}
            />

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
