'use client';
import React, { useState } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { Shield, Check, X, Users, Settings, FileText, Package, Activity } from 'lucide-react';

const rolesData = [
    {
        id: 'admin', name: 'Admin', description: 'Full system access', color: 'purple', userCount: 2,
        permissions: { dashboard: { view: true, edit: true }, users: { view: true, edit: true, delete: true, create: true }, machines: { view: true, edit: true, delete: true, create: true }, rewards: { view: true, edit: true, delete: true, create: true }, logs: { view: true, export: true }, settings: { view: true, edit: true } }
    },
    {
        id: 'moderator', name: 'Moderator', description: 'Manage users and content', color: 'blue', userCount: 3,
        permissions: { dashboard: { view: true, edit: false }, users: { view: true, edit: true, delete: false, create: false }, machines: { view: true, edit: false, delete: false, create: false }, rewards: { view: true, edit: true, delete: false, create: true }, logs: { view: true, export: false }, settings: { view: false, edit: false } }
    },
    {
        id: 'user', name: 'User', description: 'Standard user access', color: 'emerald', userCount: 156,
        permissions: { dashboard: { view: true, edit: false }, users: { view: false, edit: false, delete: false, create: false }, machines: { view: true, edit: false, delete: false, create: false }, rewards: { view: true, edit: false, delete: false, create: false }, logs: { view: false, export: false }, settings: { view: false, edit: false } }
    },
    {
        id: 'guest', name: 'Guest', description: 'Limited access', color: 'slate', userCount: 0,
        permissions: { dashboard: { view: false, edit: false }, users: { view: false, edit: false, delete: false, create: false }, machines: { view: true, edit: false, delete: false, create: false }, rewards: { view: true, edit: false, delete: false, create: false }, logs: { view: false, export: false }, settings: { view: false, edit: false } }
    },
];

const permissionModules = [
    { key: 'dashboard', label: 'Dashboard', icon: Activity, actions: ['view', 'edit'] },
    { key: 'users', label: 'User Management', icon: Users, actions: ['view', 'edit', 'delete', 'create'] },
    { key: 'machines', label: 'Machines', icon: Package, actions: ['view', 'edit', 'delete', 'create'] },
    { key: 'rewards', label: 'Rewards', icon: FileText, actions: ['view', 'edit', 'delete', 'create'] },
    { key: 'logs', label: 'System Logs', icon: Activity, actions: ['view', 'export'] },
    { key: 'settings', label: 'Settings', icon: Settings, actions: ['view', 'edit'] },
];

const PermissionToggle = ({ enabled, onChange }) => (
    <button onClick={onChange} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${enabled ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'}`}>
        {enabled ? <Check size={16} /> : <X size={16} />}
    </button>
);

export default function PermissionsPage() {
    const [roles, setRoles] = useState(rolesData);
    const [selectedRole, setSelectedRole] = useState(roles[0]);

    const getColorClasses = (color) => {
        const colors = {
            purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
            blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
            emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
            slate: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
        };
        return colors[color] || colors.slate;
    };

    const togglePermission = (module, action) => {
        setRoles(prev => prev.map(role => {
            if (role.id === selectedRole.id) {
                const newRole = { ...role, permissions: { ...role.permissions, [module]: { ...role.permissions[module], [action]: !role.permissions[module][action] } } };
                return newRole;
            }
            return role;
        }));
        setSelectedRole(prev => ({ ...prev, permissions: { ...prev.permissions, [module]: { ...prev.permissions[module], [action]: !prev.permissions[module][action] } } }));
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Permissions</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage role-based access control</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield size={18} className="text-emerald-600 dark:text-emerald-400" /> Roles</h3>
                        </div>
                        <div className="p-3 space-y-2">
                            {roles.map(role => (
                                <button key={role.id} onClick={() => setSelectedRole(role)}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${selectedRole.id === role.id ? 'bg-emerald-50 border-2 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500' : 'bg-slate-50 border-2 border-transparent hover:border-slate-200 dark:bg-slate-800/50 dark:hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getColorClasses(role.color)}`}>{role.name}</span>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{role.description}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 dark:text-slate-500">{role.userCount} users</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Permissions for <span className={`px-2 py-0.5 rounded-full text-sm ${getColorClasses(selectedRole.color)}`}>{selectedRole.name}</span></h3>
                            <button className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">Save Changes</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Module</th>
                                        <th className="px-3 py-4 text-center">View</th>
                                        <th className="px-3 py-4 text-center">Edit</th>
                                        <th className="px-3 py-4 text-center">Create</th>
                                        <th className="px-3 py-4 text-center">Delete</th>
                                        <th className="px-3 py-4 text-center">Export</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {permissionModules.map(module => (
                                        <tr key={module.key} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700"><module.icon size={16} className="text-slate-600 dark:text-slate-300" /></div>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{module.label}</span>
                                                </div>
                                            </td>
                                            {['view', 'edit', 'create', 'delete', 'export'].map(action => (
                                                <td key={action} className="px-3 py-4 text-center">
                                                    {module.actions.includes(action) ? (
                                                        <div className="flex justify-center"><PermissionToggle enabled={selectedRole.permissions[module.key]?.[action] || false} onChange={() => togglePermission(module.key, action)} /></div>
                                                    ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
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
        </AdminLayout>
    );
}
