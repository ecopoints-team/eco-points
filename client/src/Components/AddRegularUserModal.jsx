'use client';
import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Building2, Loader2, Users, GraduationCap, BookOpen, Phone, AtSign } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { useAuth } from '../context/AuthContext';
import { SHS_STRANDS, COLLEGE_DEPARTMENTS } from '../data/mockData';
import { users as usersApi } from '../services/apiService';

const InputField = ({ type, placeholder, icon: Icon, showToggle, value, onChange, label, error }) => {
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
                    className={`w-full pl-10 pr-10 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
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
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default function AddRegularUserModal({ isOpen, onClose, onUserAdded }) {
    const { allLocations, isSuperAdmin, currentLocation } = useAuth();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('Student');
    const [locationId, setLocationId] = useState(currentLocation?.id || '');
    const [educLevel, setEducLevel] = useState('');
    const [strand, setStrand] = useState('');
    const [department, setDepartment] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [passwordShake, setPasswordShake] = useState(false);

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
            setPasswordShake(true);
            setTimeout(() => setPasswordShake(false), 600);
            return;
        }

        if (isSuperAdmin && !locationId) {
            setError('Please select a location');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                name,
                username: username || undefined,
                email,
                phone: phone || undefined,
                password,
                role: 'user',
                userType: role.toLowerCase(),
                yearLevel: yearLevel || undefined,
                strand: strand || undefined,
                department: department || undefined,
                locationId: locationId || currentLocation?.id,
            };

            const created = await usersApi.create(payload);

            if (onUserAdded) {
                onUserAdded({
                    ...created,
                    id: String(created.id),
                    accountHealth: 'Active',
                });
            }

            resetForm();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create user. Please try again.');
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
        setRole('Student');
        setEducLevel('');
        setStrand('');
        setDepartment('');
        setYearLevel('');
        setPasswordShake(false);
        setError('');
    };

    // Build year level options based on education level
    const yearLevelOptions = educLevel === 'SHS'
        ? ['Grade 11', 'Grade 12']
        : ['1st Year', '2nd Year', '3rd Year', '4th Year'];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                            <User size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New User</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Add a Student, Faculty, or Staff</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField type="text" placeholder="Full Name" icon={User} value={name} onChange={(e) => setName(e.target.value)} label="Full Name *" />
                        <InputField type="text" placeholder="Username" icon={AtSign} value={username} onChange={(e) => setUsername(e.target.value)} label="Username" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField type="email" placeholder="Email Address" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address *" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                            <div className="relative group flex">
                                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 text-sm font-medium">+63</span>
                                <input
                                    type="tel"
                                    placeholder="9XX XXX XXXX"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s\-]/g, ''))}
                                    className="w-full px-4 py-2 rounded-r-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Location */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                            <CustomDropdown
                                value={role}
                                onChange={(v) => setRole(v)}
                                options={['Student', 'Faculty', 'Staff']}
                                showPlaceholder={false}
                                icon={Users}
                                size="md"
                            />
                        </div>

                        {/* Location (Super Admin only) */}
                        {isSuperAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location *</label>
                                <CustomDropdown
                                    value={locationId}
                                    onChange={(v) => setLocationId(v)}
                                    options={allLocations.map(loc => ({ value: loc.id, label: loc.name }))}
                                    placeholder="Select a location..."
                                    searchable
                                    icon={Building2}
                                    size="md"
                                />
                            </div>
                        )}
                    </div>

                    {/* Student-specific fields */}
                    {role === 'Student' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Educational Level */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Educational Level</label>
                                    <CustomDropdown
                                        value={educLevel}
                                        onChange={(v) => { setEducLevel(v); setStrand(''); setDepartment(''); setYearLevel(''); }}
                                        options={[
                                            { value: 'SHS', label: 'Senior High School' },
                                            { value: 'College', label: 'College' }
                                        ]}
                                        placeholder="Select level..."
                                        icon={GraduationCap}
                                        size="md"
                                    />
                                </div>

                                {/* Year Level */}
                                {educLevel && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year Level</label>
                                        <CustomDropdown
                                            value={yearLevel}
                                            onChange={(v) => setYearLevel(v)}
                                            options={yearLevelOptions}
                                            placeholder="Select year..."
                                            icon={GraduationCap}
                                            size="md"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* SHS Strand */}
                            {educLevel === 'SHS' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SHS Strand</label>
                                    <CustomDropdown
                                        value={strand}
                                        onChange={(v) => setStrand(v)}
                                        options={SHS_STRANDS.map(s => ({ value: s.id, label: `${s.abbreviation} — ${s.name}` }))}
                                        placeholder="Select strand..."
                                        searchable
                                        icon={BookOpen}
                                        size="md"
                                    />
                                </div>
                            )}

                            {/* College Department */}
                            {educLevel === 'College' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Department</label>
                                    <CustomDropdown
                                        value={department}
                                        onChange={(v) => setDepartment(v)}
                                        options={COLLEGE_DEPARTMENTS.map(d => ({ value: d.id, label: `${d.abbreviation} — ${d.name}` }))}
                                        placeholder="Search department..."
                                        searchable
                                        icon={BookOpen}
                                        size="md"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className={passwordShake ? 'animate-shake' : ''}>
                            <InputField type="password" placeholder="Password" icon={Lock} showToggle={true} value={password} onChange={(e) => setPassword(e.target.value)} label="Password *" />
                        </div>
                        <div className={passwordShake ? 'animate-shake' : ''}>
                            <InputField type="password" placeholder="Confirm Password" icon={Lock} showToggle={true} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password *" />
                        </div>
                    </div>

                    {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-500/30">{error}</div>}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Adding...</> : 'Add User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
