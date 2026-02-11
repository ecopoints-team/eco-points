'use client';
import React, { useState } from 'react';
import { X, User, Mail, Lock, Eye, EyeOff, Building2, Loader2, Users, ChevronDown, Search, GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SHS_STRANDS, COLLEGE_DEPARTMENTS } from '../data/mockData';

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
    const [educLevel, setEducLevel] = useState('');
    const [strand, setStrand] = useState('');
    const [department, setDepartment] = useState('');
    const [deptSearch, setDeptSearch] = useState('');
    const [showDeptDropdown, setShowDeptDropdown] = useState(false);
    const [yearLevel, setYearLevel] = useState('');
    const [passwordShake, setPasswordShake] = useState(false);

    // Filtered college departments for searchable dropdown
    const filteredDepts = COLLEGE_DEPARTMENTS.filter(d =>
        d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
        d.abbreviation.toLowerCase().includes(deptSearch.toLowerCase())
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
            setPasswordShake(true);
            setTimeout(() => setPasswordShake(false), 600);
            return;
        }

        if (isSuperAdmin && !locationId && !educLevel) {
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
            educLevel: educLevel || null,
            strand: educLevel === 'SHS' ? strand : null,
            department: educLevel === 'College' ? department : null,
            yearLevel: yearLevel || null,
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
        setEducLevel('');
        setStrand('');
        setDepartment('');
        setDeptSearch('');
        setYearLevel('');
        setPasswordShake(false);
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

                    {/* Educational Level */}
                    {role === 'Student' && (
                        <>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Educational Level</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><GraduationCap size={18} /></div>
                                    <select value={educLevel} onChange={(e) => { setEducLevel(e.target.value); setStrand(''); setDepartment(''); setDeptSearch(''); setYearLevel(''); }} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 appearance-none cursor-pointer outline-none">
                                        <option value="">Select level...</option>
                                        <option value="SHS">Senior High School</option>
                                        <option value="College">College</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                                </div>
                            </div>

                            {/* SHS Strand */}
                            {educLevel === 'SHS' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">SHS Strand</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><BookOpen size={18} /></div>
                                        <select value={strand} onChange={(e) => setStrand(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 appearance-none cursor-pointer outline-none">
                                            <option value="">Select strand...</option>
                                            {SHS_STRANDS.map(s => (
                                                <option key={s.id} value={s.id}>{s.abbreviation} — {s.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                                    </div>
                                </div>
                            )}

                            {/* College Department (searchable) */}
                            {educLevel === 'College' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">College Department</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={18} /></div>
                                        <input
                                            type="text"
                                            placeholder="Search department..."
                                            value={deptSearch}
                                            onChange={(e) => { setDeptSearch(e.target.value); setShowDeptDropdown(true); }}
                                            onFocus={() => setShowDeptDropdown(true)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 outline-none"
                                        />
                                        {showDeptDropdown && filteredDepts.length > 0 && (
                                            <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                {filteredDepts.map(d => (
                                                    <button key={d.id} type="button" onClick={() => { setDepartment(d.id); setDeptSearch(d.abbreviation + ' — ' + d.name); setShowDeptDropdown(false); }}
                                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors ${department === d.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        <span className="font-medium">{d.abbreviation}</span> — {d.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Year Level */}
                            {educLevel && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Year Level</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><GraduationCap size={18} /></div>
                                        <select value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent pl-10 pr-4 py-3 appearance-none cursor-pointer outline-none">
                                            <option value="">Select year...</option>
                                            {educLevel === 'SHS' ? (
                                                <>
                                                    <option value="Grade 11">Grade 11</option>
                                                    <option value="Grade 12">Grade 12</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="1st Year">1st Year</option>
                                                    <option value="2nd Year">2nd Year</option>
                                                    <option value="3rd Year">3rd Year</option>
                                                    <option value="4th Year">4th Year</option>
                                                </>
                                            )}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><ChevronDown size={16} /></div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className={passwordShake ? 'animate-shake' : ''}>
                        <InputField type="password" placeholder="Password" icon={Lock} showToggle={true} value={password} onChange={(e) => setPassword(e.target.value)} label="Password *" />
                    </div>
                    <div className={passwordShake ? 'animate-shake' : ''}>
                        <InputField type="password" placeholder="Confirm Password" icon={Lock} showToggle={true} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} label="Confirm Password *" />
                    </div>

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
