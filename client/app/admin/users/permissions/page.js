'use client';
import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { useAuth } from '../../../../src/context/AuthContext';
import { ADMIN_USERS as MOCK_ADMIN_USERS, LOCATIONS, ROLES } from '../../../../src/data/mockData';
import { Shield, Check, X, Users, Settings, FileText, Package, Activity, LayoutDashboard, Eye, Edit2, Trash2, Download, Plus, UserCheck, Building2, ChevronDown } from 'lucide-react';

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
            logs: { view: true, export: true, delete: true },
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
        description: 'Logistics focus - Machines & Rewards management',
        color: 'emerald',
        icon: Package,
        userCount: 1,
        permissions: {
            dashboard: { view: true, edit: false },
            users: { view: false, edit: false, delete: false, create: false },
            machines: { view: true, edit: true, delete: false, create: false },
            rewards: { view: true, edit: true, delete: false, create: true },
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
    { key: 'logs', label: 'System Logs', icon: Activity, actions: ['view', 'export', 'delete'] },
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
        emerald: 'from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700',
    };

    const badgeColors = {
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
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
        inventory_officer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    };

    const roleNames = {
        head_admin: 'Head Admin',
        auditor: 'Auditor',
        inventory_officer: 'Inventory Officer',
    };

    // Get location name from user's locationId
    const getLocationName = (locationId) => {
        const loc = LOCATIONS.find(l => l.id === locationId);
        return loc ? loc.name : 'All Locations';
    };

    const roleOptions = [
        { id: 'head_admin', name: 'Head Admin' },
        { id: 'auditor', name: 'Auditor' },
        { id: 'inventory_officer', name: 'Inventory Officer' },
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
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.avatar}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-white text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.id}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-slate-600 dark:text-slate-300">{user.email}</span>
            </td>
            <td className="px-6 py-4">
                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium">
                    <Building2 size={12} />
                    {getLocationName(user.locationId)}
                </span>
            </td>
            <td className="px-6 py-4">
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
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${roleColors[user.role]} 
                            ${canEditUsers ? 'hover:ring-2 hover:ring-offset-1 hover:ring-emerald-500 cursor-pointer' : 'cursor-default opacity-80'} 
                            transition-all`}
                        title={canEditUsers ? "Click to change role" : "You don't have permission to change roles"}
                        disabled={!canEditUsers}
                    >
                        {roleNames[user.role]}
                    </button>
                )}
            </td>
            <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                    {user.status}
                </span>
            </td>
            <td className="px-6 py-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">{user.lastLogin}</span>
            </td>
        </tr>
    );
};

// ============================================================================

export default function PermissionsPage() {
    const { user: currentUser, isSuperAdmin, viewAsLocationId } = useAuth();
    const [roles] = useState(ROLES_DATA);
    // Use ADMIN_USERS from mockData (filter out super_admin for local admins only)
    const [allUsers] = useState(MOCK_ADMIN_USERS.filter(u => u.role !== 'super_admin'));

    // Filter users based on viewAsLocationId
    const users = useMemo(() => {
        if (!viewAsLocationId && isSuperAdmin) return allUsers;
        const targetLocationId = viewAsLocationId || currentUser?.locationId;
        return allUsers.filter(u => u.locationId === targetLocationId);
    }, [allUsers, viewAsLocationId, isSuperAdmin, currentUser]);

    // Mutable users state for UI updates
    const [displayUsers, setDisplayUsers] = useState(users);

    useEffect(() => {
        setDisplayUsers(users);
    }, [users]);

    const [selectedRole, setSelectedRole] = useState(roles[0]);

    // Handle role change for a user
    const handleRoleChange = async (userId, newRole) => {
        setDisplayUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
        ));
    };

    const getColorClasses = (color) => ({
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
    }[color] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Role-Based Access Control</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage roles and permissions for admin users</p>
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
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{users.length}</p>
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
                                    users={users}
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
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full dark:shadow-[0_0_10px_#10b981]"></span>
                        Admin User Accounts
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Test accounts for each role - use these credentials to verify RBAC functionality
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Login</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {displayUsers.map(user => (
                                <UserAccountRow
                                    key={user.id}
                                    user={user}
                                    onRoleChange={handleRoleChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout >
    );
}
