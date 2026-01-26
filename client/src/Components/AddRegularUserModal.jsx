'use client';
import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Building2, Loader2, Users, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const InputField = ({ type, placeholder, icon: Icon, showToggle, value, onChange, label }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showToggle ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="space-y-1">
            {label && <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Icon size={18} />
                </div>
                <input
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                        text-slate-800 dark:text-white text-sm rounded-xl 
                        focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                        pl-10 pr-10 py-3 transition-all outline-none"
                />
                {showToggle && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default function AddRegularUserModal({ isOpen, onClose, onUserAdded }) {
    const { allLocations, isSuperAdmin, currentLocation } = useAuth();
    const { theme } = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Student');
    const [locationId, setLocationId] = useState(currentLocation?.id || '');
    const [schoolSearch, setSchoolSearch] = useState('');
    const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);

    // Mock schools for search
    const filteredSchools = ["Arellano University - Andres Bonifacio Pasig Campus"].filter(s =>
        s.toLowerCase().includes(schoolSearch.toLowerCase())
    );

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (isSuperAdmin && !locationId && !schoolSearch) {
            // For super admin, need to specify location. For now just relying on locationId or school string.
            // We'll map school string back to location if needed, or just store the string.
            // Mock data uses locationId.
            if (!locationId) {
                setError('Please select a location');
                return;
            }
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newUser = {
            id: `USR-${Date.now()}`,
            name,
            email,
            role,
            status: 'Active',
            points: 0,
            locationId: locationId || currentLocation?.id,
            joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        if (onUserAdded) {
            onUserAdded(newUser);
        }

        setIsLoading(false);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('Student');
        setSchoolSearch('');
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-in ${theme === 'light' ? 'bg-white' : theme === 'neutral' ? 'bg-gray-600' : 'bg-[#1e293b]'}`}>
                <div className={`border-b px-6 py-4 flex items-center justify-between ${theme === 'light' ? 'border-slate-200 bg-slate-50' : theme === 'neutral' ? 'border-gray-500 bg-gray-700' : 'border-slate-700 bg-slate-800/50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <User size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add New User</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Add a Student, Faculty, or Staff</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <InputField type="text" placeholder="Full Name" icon={User} value={name} onChange={(e) => setName(e.target.value)} label="Full Name *" />
                    <InputField type="email" placeholder="Email Address" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address *" />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Users size={18} /></div>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 appearance-none cursor-pointer outline-none">
                                <option value="Student">Student</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Staff">Staff</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                        </div>
                    </div>

                    {isSuperAdmin && (
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">School / Location *</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Building2 size={18} /></div>
                                <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 appearance-none cursor-pointer outline-none">
                                    <option value="">Select a location...</option>
                                    {allLocations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                            </div>
                        </div>
                    )}

                    <InputField type="password" placeholder="Password" icon={Lock} showToggle={true} value={password} onChange={(e) => setPassword(e.target.value)} label="Password *" />
                    <InputField type="password" placeholder="Confirm Password" icon={Lock} showToggle={true} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password *" />

                    {error && <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>}

                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Adding...</> : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
