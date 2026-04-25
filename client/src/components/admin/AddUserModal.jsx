'use client';
import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Building2, Loader2, Check, Shield, ChevronRight, Phone, AtSign } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { useAuth } from '../../context/AuthContext';
import { users as usersApi } from '../../services/apiService';

// Admin duty roles (not user types like Student/Faculty)
const ADMIN_ROLES = [
    {
        id: 'head_admin',
        name: 'Head Admin',
        description: 'Full access within assigned location',
        color: 'purple'
    },
    {
        id: 'auditor',
        name: 'Auditor',
        description: 'View and export data only',
        color: 'blue'
    },
    {
        id: 'inventory_officer',
        name: 'Inventory Officer',
        description: 'Manage rewards inventory',
        color: 'emerald'
    },
    {
        id: 'technician',
        name: 'Technician',
        description: 'Manage machines and maintenance',
        color: 'amber'
    },
];

// Permission modules (like in the screenshot)
const PERMISSION_MODULES = [
    {
        key: 'superUser',
        name: 'Super User',
        description: 'Determines whether the user has full access to all aspects of the admin. This setting overrides ALL more specific and restrictive permissions.',
    },
    {
        key: 'adminAccess',
        name: 'Admin Access',
        description: 'Determines whether the user has access to most aspects of the system EXCEPT the System Admin Settings.',
    },
    {
        key: 'usersManage',
        name: 'Users Management',
        description: 'This will allow users to manage regular user accounts.',
    },
    {
        key: 'machinesManage',
        name: 'Machines Management',
        description: 'This will allow users to manage RVM machines.',
    },
    {
        key: 'rewardsManage',
        name: 'Rewards Management',
        description: 'This will allow users to manage the rewards inventory.',
    },
    {
        key: 'logsAccess',
        name: 'Logs Access',
        description: 'This will allow users to view and export system logs.',
    },
];

// Reusable Input Field Component
const InputField = ({ type, placeholder, icon: Icon, showToggle, value, onChange, label }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showToggle ? (showPassword ? 'text' : 'password') : type;

    return (
        <div>
            {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Icon size={16} />
                </div>
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {showToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// Permission Toggle (3-state like in screenshot: Grant / Inherit / Deny)
const PermissionToggle = ({ value, onChange }) => {
    return (
        <div className="flex gap-1">
            <button
                type="button"
                onClick={() => onChange('grant')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${value === 'grant'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                title="Grant"
            >
                <Check size={14} strokeWidth={3} />
            </button>
            <button
                type="button"
                onClick={() => onChange('inherit')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${value === 'inherit'
                    ? 'bg-slate-500 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                title="Inherit"
            >
                <Shield size={14} />
            </button>
            <button
                type="button"
                onClick={() => onChange('deny')}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${value === 'deny'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                title="Deny"
            >
                <X size={14} strokeWidth={3} />
            </button>
        </div>
    );
};

export default function AddUserModal({ isOpen, onClose, onUserAdded }) {
    const { allLocations, isSuperAdmin, currentLocation } = useAuth();

    // Tab state
    const [activeTab, setActiveTab] = useState('information');

    // Form state - Information tab
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordShake, setPasswordShake] = useState(false);
    const [locationId, setLocationId] = useState(currentLocation?.id || '');

    // Form state - Permissions tab (no default selection)
    const [selectedRole, setSelectedRole] = useState('');
    const [permissions, setPermissions] = useState({
        superUser: 'inherit',
        adminAccess: 'inherit',
        usersManage: 'inherit',
        machinesManage: 'inherit',
        rewardsManage: 'inherit',
        logsAccess: 'inherit',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handlePermissionChange = (key, value) => {
        setPermissions(prev => ({ ...prev, [key]: value }));
    };

    // Auto-set permissions based on role
    const applyRoleDefaults = (roleId) => {
        setSelectedRole(roleId);
        switch (roleId) {
            case 'head_admin':
                setPermissions({
                    superUser: 'deny',
                    adminAccess: 'grant',
                    usersManage: 'grant',
                    machinesManage: 'grant',
                    rewardsManage: 'grant',
                    logsAccess: 'grant',
                });
                break;
            case 'auditor':
                setPermissions({
                    superUser: 'deny',
                    adminAccess: 'deny',
                    usersManage: 'deny',
                    machinesManage: 'deny',
                    rewardsManage: 'deny',
                    logsAccess: 'grant',
                });
                break;
            case 'inventory_officer':
                setPermissions({
                    superUser: 'deny',
                    adminAccess: 'deny',
                    usersManage: 'deny',
                    machinesManage: 'deny',
                    rewardsManage: 'grant',
                    logsAccess: 'inherit',
                });
                break;
            case 'technician':
                setPermissions({
                    superUser: 'deny',
                    adminAccess: 'deny',
                    usersManage: 'deny',
                    machinesManage: 'grant',
                    rewardsManage: 'deny',
                    logsAccess: 'grant',
                });
                break;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all required fields in Information tab.');
            setActiveTab('information');
            return;
        }

        if (!selectedRole) {
            setError('Please select an Admin Role.');
            setActiveTab('permissions');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setPasswordShake(true);
            setActiveTab('information');
            setTimeout(() => setPasswordShake(false), 600);
            return;
        }

        if (!locationId && isSuperAdmin) {
            setError('Please select a location.');
            setActiveTab('information');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Build the payload for the API
            const payload = {
                name,
                username: username || undefined,
                email,
                phone: phone || undefined,
                password,
                role: selectedRole,
                locationId: isSuperAdmin ? locationId : currentLocation?.id,
                isAdmin: true,
            };

            const created = await usersApi.create(payload);

            // Enrich the returned user for the local table
            const newUser = {
                ...created,
                id: String(created.id),
                avatar: (created.name || name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                status: 'Active',
                accountHealth: 'Active',
                lastLogin: 'Never',
            };

            // Call callback to add user
            if (onUserAdded) {
                onUserAdded(newUser);
            }

            resetForm();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create admin user.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setPasswordShake(false);
        setSelectedRole(''); // Reset to no selection
        setActiveTab('information');
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const roleColors = {
        purple: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500',
        blue: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500',
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500',
        amber: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500',
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="p-6 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                                <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add Admin User</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Create a new admin account with permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex px-6">
                        <button
                            onClick={() => setActiveTab('information')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'information'
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Information
                        </button>
                        <button
                            onClick={() => setActiveTab('permissions')}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'permissions'
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Permissions
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        {/* Information Tab */}
                        {activeTab === 'information' && (
                            <div className="p-6 space-y-4">
                                <InputField
                                    type="text"
                                    placeholder="John Doe"
                                    icon={User}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    label="Full Name *"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        type="text"
                                        placeholder="johndoe"
                                        icon={AtSign}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        label="Username"
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                        <div className="relative group flex">
                                            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 text-sm font-medium">+63</span>
                                            <input
                                                type="tel"
                                                placeholder="9XX XXX XXXX"
                                                value={phone}
                                                onChange={(e) => { let d = e.target.value.replace(/[^\d]/g, ''); if (d.startsWith('0')) d = d.slice(1); setPhone(d.slice(0, 10)); }}
                                                maxLength={10}
                                                className="w-full px-4 py-2 rounded-r-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <InputField
                                    type="email"
                                    placeholder="john@ecopoints.com"
                                    icon={Mail}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    label="Email Address *"
                                />
                                <div className={passwordShake ? 'animate-shake' : ''}>
                                    <InputField
                                        type="password"
                                        placeholder="Enter password"
                                        icon={Lock}
                                        showToggle={true}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        label="Password *"
                                    />
                                </div>
                                <div className={passwordShake ? 'animate-shake' : ''}>
                                    <InputField
                                        type="password"
                                        placeholder="Re-enter password"
                                        icon={Lock}
                                        showToggle={true}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        label="Confirm Password *"
                                    />
                                </div>

                                {/* Location (Super Admin Only) */}
                                {isSuperAdmin && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location *</label>
                                        <CustomDropdown
                                            value={locationId}
                                            onChange={(v) => setLocationId(v)}
                                            options={allLocations.map(loc => ({ value: loc.id, label: `${loc.name} - ${loc.fullName}` }))}
                                            placeholder="Select a location..."
                                            searchable
                                            icon={Building2}
                                            size="md"
                                        />
                                    </div>
                                )}

                                {/* Next button */}
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('permissions')}
                                        className="w-full py-2 rounded-lg font-medium text-white
                                            bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500
                                            transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        Next: Set Permissions
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Permissions Tab */}
                        {activeTab === 'permissions' && (
                            <div className="p-6 space-y-6">
                                {/* Info Banner */}
                                <div className="p-4 rounded-lg bg-cyan-500 text-white text-sm">
                                    We strongly suggest using Permission Groups (Roles) instead of assigning individual permissions for easier management.
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Admin Role</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {ADMIN_ROLES.map(role => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => applyRoleDefaults(role.id)}
                                                className={`p-4 rounded-lg text-left transition-all border-2 ${selectedRole === role.id
                                                    ? roleColors[role.color]
                                                    : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-white">{role.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{role.description}</p>
                                                    </div>
                                                    {selectedRole === role.id && (
                                                        <Check size={20} className="text-emerald-500" />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Individual Permissions */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Fine-tune Permissions</label>
                                    <div className="space-y-1">
                                        {/* Filter out Super User if not Super Admin */}
                                        {PERMISSION_MODULES
                                            .filter(mod => isSuperAdmin || mod.key !== 'superUser')
                                            .map(mod => (
                                                <div key={mod.key} className="p-4 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-slate-800 dark:text-white">{mod.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description}</p>
                                                    </div>
                                                    <PermissionToggle
                                                        value={permissions[mod.key]}
                                                        onChange={(val) => handlePermissionChange(mod.key, val)}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <User size={18} />
                                    Add Admin
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
