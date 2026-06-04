'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Building2, Loader2, Users, GraduationCap, BookOpen, Phone, AtSign } from 'lucide-react';
import CustomDropdown from './CustomDropdown';
import { useAuth } from '../../context/AuthContext';
import { users as usersApi, groups as groupsApi } from '../../services/api';
import { validateField, VALIDATION_RULES } from '../../lib/validateField';

const InputField = ({ type, placeholder, icon: Icon, showToggle, value, onChange, label, error, disabled }) => {
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
                    disabled={disabled}
                    className={`w-full pl-10 pr-10 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed`}
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

// ── Org-type → User-type mapping ─────────────────────────────────────────
const USER_TYPES_BY_ORG = {
    University: ['Student', 'Alumni', 'Faculty', 'Staff'],
    School:     ['Student', 'Alumni', 'Faculty', 'Staff'],
    Community:  ['Resident', 'Community Official', 'Community Worker', 'Business Owner'],
    Corporate:  ['Employee', 'Manager', 'Executive', 'Contractor', 'Guest'],
};
const DEFAULT_USER_TYPES = ['Staff'];

// Normalize user type label → value (e.g. "Community Official" → "community_official")
const typeToValue = (t) => t.toLowerCase().replace(/ /g, '_');
const valueToLabel = (v) => {
    const map = {};
    Object.values(USER_TYPES_BY_ORG).flat().forEach(t => { map[typeToValue(t)] = t; });
    return map[v] || v;
};

// ── Educational level mapping ─────────────────────────────────────────────
const EDUCATION_LEVELS = [
    { value: 'Kindergarten', label: 'Kindergarten' },
    { value: 'Elementary', label: 'Elementary School' },
    { value: 'JHS', label: 'Junior High School (JHS)' },
    { value: 'SHS', label: 'Senior High School (SHS)' },
    { value: 'College', label: 'College' },
];

const YEAR_LEVELS = {
    Kindergarten: [],
    Elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    SHS: ['Grade 11', 'Grade 12'],
    College: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
};

const GROUP_TYPE_MAP = {
    Elementary: 'elementary',
    JHS: 'jhs',
    SHS: 'shs_strand',
    College: 'college',
};

// Helper: is this org type an educational institution?
const isSchoolOrg = (orgType) => {
    if (!orgType) return false;
    const lower = orgType.toLowerCase();
    return lower === 'university' || lower === 'school';
};

export default function AddRegularUserModal({ isOpen, onClose, onUserAdded }) {
    const { allLocations, isSuperAdmin, currentLocation } = useAuth();

    // Core fields
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordShake, setPasswordShake] = useState(false);

    // Cascading fields
    const [locationId, setLocationId] = useState(currentLocation?.id || '');
    const [userType, setUserType] = useState('');
    const [educLevel, setEducLevel] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [communityGroupId, setCommunityGroupId] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Dynamic group loading from API
    const [availableGroups, setAvailableGroups] = useState([]);
    const [groupsLoading, setGroupsLoading] = useState(false);

    // Effective location for fetching groups
    const effectiveLocationId = isSuperAdmin ? locationId : currentLocation?.id;

    // Derive org type from selected location
    const selectedOrgType = useMemo(() => {
        if (!effectiveLocationId) return null;
        const loc = allLocations?.find(l => String(l.id) === String(effectiveLocationId));
        return loc?.orgType || null;
    }, [effectiveLocationId, allLocations]);

    // Get available user types based on org type
    const availableUserTypes = useMemo(() => {
        if (!selectedOrgType) return DEFAULT_USER_TYPES;
        // Match against known org types (case-insensitive)
        const key = Object.keys(USER_TYPES_BY_ORG).find(
            k => k.toLowerCase() === selectedOrgType.toLowerCase()
        );
        return key ? USER_TYPES_BY_ORG[key] : DEFAULT_USER_TYPES;
    }, [selectedOrgType]);

    // Student-specific: whether to show education level fields
    const isStudent = userType === 'student';
    const showEducFields = isSchoolOrg(selectedOrgType) && isStudent;

    // Fetch groups when modal opens or location changes
    useEffect(() => {
        if (isOpen && effectiveLocationId) {
            setGroupsLoading(true);
            groupsApi.getAll(effectiveLocationId)
                .then(groups => setAvailableGroups(groups || []))
                .catch(() => setAvailableGroups([]))
                .finally(() => setGroupsLoading(false));
        } else {
            setAvailableGroups([]);
        }
    }, [isOpen, effectiveLocationId]);

    // Filter groups by education level / role
    const filteredGroups = useMemo(() => {
        if (showEducFields && educLevel) {
            const gType = GROUP_TYPE_MAP[educLevel];
            return gType ? availableGroups.filter(g => g.groupType === gType) : [];
        }
        if (userType === 'faculty') return availableGroups.filter(g => g.groupType === 'college');
        if (userType === 'staff') return availableGroups.filter(g => g.groupType === 'staff' || !g.groupType);
        // For non-school orgs, show all groups
        if (!isSchoolOrg(selectedOrgType)) return availableGroups;
        return [];
    }, [availableGroups, userType, educLevel, showEducFields, selectedOrgType]);

    // Determine whether to show community group selector
    const showGroupField = useMemo(() => {
        if (!userType) return false;
        if (showEducFields) {
            // Kindergarten has no group
            if (educLevel === 'Kindergarten') return false;
            // Other ed levels need a group
            return !!educLevel;
        }
        // Non-school orgs always show group
        return true;
    }, [userType, showEducFields, educLevel]);

    // Year level options based on education level
    const yearLevelOptions = educLevel ? (YEAR_LEVELS[educLevel] || []) : [];

    // Group label based on context
    const groupLabel = useMemo(() => {
        if (showEducFields) {
            if (educLevel === 'SHS') return 'SHS Strand';
            if (educLevel === 'College') return 'College Department';
            return 'Section';
        }
        if (userType === 'faculty') return 'College Department';
        return 'Community Group';
    }, [showEducFields, educLevel, userType]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate required fields
        const fieldErrors = [];
        if (!firstName.trim()) fieldErrors.push('First name is required');
        if (!lastName.trim()) fieldErrors.push('Last name is required');
        const emailErr = validateField(VALIDATION_RULES.user, 'email', email);
        const pwErr = validateField(VALIDATION_RULES.user, 'password', password);
        if (emailErr) fieldErrors.push(emailErr);
        if (pwErr) fieldErrors.push(pwErr);
        if (!userType) fieldErrors.push('Please select a user type');
        if (password !== confirmPassword) {
            setPasswordShake(true);
            setTimeout(() => setPasswordShake(false), 600);
            fieldErrors.push('Passwords do not match');
        }
        if (isSuperAdmin && !locationId) fieldErrors.push('Please select a location');
        if (fieldErrors.length > 0) {
            setError(fieldErrors[0]);
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                firstName: firstName.trim(),
                middleName: middleName.trim() || undefined,
                lastName: lastName.trim(),
                username: username.trim() || undefined,
                email: email.trim(),
                phone: phone || undefined,
                password,
                userType,
                educationalLevel: showEducFields ? educLevel : undefined,
                yearLevel: showEducFields && yearLevel ? yearLevel : undefined,
                communityGroupId: communityGroupId || undefined,
                locationId: effectiveLocationId,
                isAdmin: false,
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
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setUserType('');
        setEducLevel('');
        setCommunityGroupId('');
        setYearLevel('');
        setPasswordShake(false);
        setError('');
    };

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
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {selectedOrgType ? `${selectedOrgType} Organization` : 'Select a location to begin'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name Fields (split per ERD) */}
                    <div className="grid grid-cols-3 gap-4">
                        <InputField type="text" placeholder="First Name" icon={User} value={firstName} onChange={(e) => setFirstName(e.target.value)} label="First Name *" />
                        <InputField type="text" placeholder="Middle Name" icon={User} value={middleName} onChange={(e) => setMiddleName(e.target.value)} label="Middle Name" />
                        <InputField type="text" placeholder="Last Name" icon={User} value={lastName} onChange={(e) => setLastName(e.target.value)} label="Last Name *" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField type="text" placeholder="Username" icon={AtSign} value={username} onChange={(e) => setUsername(e.target.value)} label="Username" />
                        <InputField type="email" placeholder="Email Address" icon={Mail} value={email} onChange={(e) => setEmail(e.target.value)} label="Email Address *" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                        {/* Location (Super Admin only) */}
                        {isSuperAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location *</label>
                                <CustomDropdown
                                    value={locationId}
                                    onChange={(v) => { setLocationId(v); setUserType(''); setEducLevel(''); setYearLevel(''); setCommunityGroupId(''); }}
                                    options={allLocations.map(loc => ({ value: loc.id, label: loc.name }))}
                                    placeholder="Select a location..."
                                    searchable
                                    icon={Building2}
                                    size="md"
                                />
                            </div>
                        )}
                    </div>

                    {/* User Type (depends on org type) */}
                    {effectiveLocationId && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">User Type *</label>
                                <CustomDropdown
                                    value={userType}
                                    onChange={(v) => { setUserType(v); setEducLevel(''); setYearLevel(''); setCommunityGroupId(''); }}
                                    options={availableUserTypes.map(t => ({ value: typeToValue(t), label: t }))}
                                    placeholder="Select user type..."
                                    icon={Users}
                                    size="md"
                                />
                            </div>
                        </div>
                    )}

                    {/* Educational Level + Year Level (Student at School/University only) */}
                    {showEducFields && userType && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Educational Level</label>
                                <CustomDropdown
                                    value={educLevel}
                                    onChange={(v) => { setEducLevel(v); setCommunityGroupId(''); setYearLevel(''); }}
                                    options={EDUCATION_LEVELS}
                                    placeholder="Select level..."
                                    icon={GraduationCap}
                                    size="md"
                                />
                            </div>

                            {educLevel && yearLevelOptions.length > 0 && (
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
                    )}

                    {/* Community Group */}
                    {showGroupField && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{groupLabel}</label>
                            {groupsLoading ? (
                                <div className="flex items-center gap-2 py-2 text-slate-400 text-sm">
                                    <Loader2 size={16} className="animate-spin" /> Loading groups...
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <p className="text-slate-400 text-sm py-2">No groups configured for this location</p>
                            ) : (
                                <CustomDropdown
                                    value={communityGroupId}
                                    onChange={(v) => setCommunityGroupId(v)}
                                    options={filteredGroups.map(g => ({ value: String(g.id), label: g.abbreviation ? `${g.abbreviation} — ${g.name}` : g.name }))}
                                    placeholder={`Search ${groupLabel.toLowerCase()}...`}
                                    searchable
                                    icon={BookOpen}
                                    size="md"
                                />
                            )}
                        </div>
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
