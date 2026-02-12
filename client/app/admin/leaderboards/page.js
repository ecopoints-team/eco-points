'use client';
import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout, { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import CustomDropdown from '../../../src/Components/CustomDropdown';
import PageSizeSelector from '../../../src/Components/PageSizeSelector';
import { useAuth } from '../../../src/context/AuthContext';
import {
    USERS, LOCATIONS, DEPARTMENTS, SHS_STRANDS, COLLEGE_DEPARTMENTS,
    getUsersByLocation, getDepartmentName, getLocationName
} from '../../../src/data/mockData';
import {
    Trophy, Medal, Award, Crown, Search, Filter, ChevronLeft, ChevronRight,
    Flame, Recycle, Star, TrendingUp, Users as UsersIcon, GraduationCap,
    Building2, X, ChevronsUpDown, ChevronUp, ChevronDown, School, Info,
    Sparkles, Zap, Target
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================
const SORT_OPTIONS = [
    { value: 'POINTS', label: 'Most EcoPoints', icon: Star },
    { value: 'BOTTLES', label: 'Most Bottles', icon: Recycle },
    { value: 'STREAK', label: 'Highest Streak', icon: Flame },
];

const ROLE_OPTIONS = ['All', 'Student', 'Faculty', 'Staff'];

// Tabs for Super Admin: only Overall + Top Schools
const SUPER_ADMIN_TABS = [
    { id: 'OVERALL', label: 'Overall', icon: Trophy },
    { id: 'TOP_SCHOOLS', label: 'Top Schools', icon: School },
];

// Tabs for other admin roles: full set
const ADMIN_TABS = [
    { id: 'MY_LOCATION', label: 'My Location', icon: Building2 },
    { id: 'TOP_SCHOOLS', label: 'Top Schools', icon: School },
    { id: 'BY_DEPARTMENT', label: 'By Department', icon: GraduationCap },
    { id: 'BY_STRAND', label: 'By Strand', icon: GraduationCap },
    { id: 'BY_SECTION', label: 'By Section', icon: UsersIcon },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const getRoleBadge = (role) => {
    switch (role) {
        case 'Student': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
        case 'Faculty': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
        case 'Staff': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
        default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    }
};

// Get user initials (for search matching)
const getUserInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(w => w.charAt(0).toUpperCase()).join('');
};

// Get user's department display (works for ALL roles including Staff)
const getUserDeptDisplay = (user) => {
    if (user.department) return getDepartmentName(user.department);
    if (user.strand) {
        const strand = DEPARTMENTS.find(d => d.id === user.strand);
        return strand?.abbreviation || user.strand;
    }
    return '—';
};

// ============================================================================
// RANK BADGE
// ============================================================================
const RankBadge = ({ rank }) => {
    if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200 dark:shadow-amber-500/30">1</div>;
    if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-200 dark:shadow-slate-500/30">2</div>;
    if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-200 dark:shadow-amber-700/30">3</div>;
    return <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm">{rank}</div>;
};

// ============================================================================
// TOP 3 PODIUM CARDS — ENHANCED EMPHASIS
// ============================================================================
const PodiumCard = ({ user, rank, sortBy }) => {
    // Much stronger visual distinction per rank
    const cardStyles = {
        1: {
            wrapper: 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-amber-100/60 dark:from-amber-500/15 dark:via-yellow-900/20 dark:to-amber-950/40 ring-2 ring-amber-300/60 dark:ring-amber-500/40 shadow-xl shadow-amber-100 dark:shadow-amber-900/30',
            badge: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
            statBg: 'bg-amber-50/80 dark:bg-amber-900/30 border-amber-200/60 dark:border-amber-700/40',
            label: '🥇 1st Place',
            icon: <Crown size={22} className="text-amber-500 drop-shadow-md" />,
            avatarGradient: 'from-amber-400 to-yellow-500',
        },
        2: {
            wrapper: 'bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100/60 dark:from-slate-400/10 dark:via-slate-800/20 dark:to-slate-900/40 ring-2 ring-slate-300/60 dark:ring-slate-500/40 shadow-xl shadow-slate-100 dark:shadow-slate-900/30',
            badge: 'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
            statBg: 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/40',
            label: '🥈 2nd Place',
            icon: <Medal size={22} className="text-slate-400 dark:text-slate-300" />,
            avatarGradient: 'from-slate-400 to-slate-500',
        },
        3: {
            wrapper: 'bg-gradient-to-br from-orange-50 via-amber-50/80 to-orange-100/60 dark:from-amber-700/10 dark:via-orange-900/20 dark:to-amber-950/30 ring-2 ring-amber-400/40 dark:ring-amber-600/30 shadow-xl shadow-orange-100 dark:shadow-amber-900/20',
            badge: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white',
            statBg: 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200/60 dark:border-orange-700/30',
            label: '🥉 3rd Place',
            icon: <Award size={22} className="text-amber-700 dark:text-amber-500" />,
            avatarGradient: 'from-amber-600 to-orange-500',
        }
    };

    const style = cardStyles[rank];

    // Podium icons instead of initials
    const podiumIcons = {
        1: <Crown size={24} className="text-white drop-shadow-sm" />,
        2: <Sparkles size={24} className="text-white drop-shadow-sm" />,
        3: <Zap size={24} className="text-white drop-shadow-sm" />,
    };

    const getMainStat = () => {
        switch (sortBy) {
            case 'BOTTLES': return { value: user.bottlesCollected?.toLocaleString() || '0', label: 'Bottles', icon: <Recycle size={14} className="text-emerald-500" /> };
            case 'STREAK': return { value: `${user.streak || 0} days`, label: 'Streak', icon: <Flame size={14} className="text-orange-500" /> };
            default: return { value: user.points?.toLocaleString() || '0', label: 'EcoPoints', icon: <Star size={14} className="text-amber-500" /> };
        }
    };

    const stat = getMainStat();

    return (
        <div className={`relative rounded-2xl p-5 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${style.wrapper}`}>
            {/* Rank Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {style.icon}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${style.badge}`}>
                        {style.label}
                    </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRoleBadge(user.role)}`}>
                    {user.role}
                </span>
            </div>

            {/* Avatar (icons, not initials) + Name */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.avatarGradient} flex items-center justify-center shadow-lg`}>
                    {podiumIcons[rank]}
                </div>
                <div className="min-w-0">
                    <p className="font-black text-slate-800 dark:text-white truncate text-base">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {getUserDeptDisplay(user)}
                    </p>
                </div>
            </div>

            {/* Main Stat — highlighted */}
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border ${style.statBg}`}>
                {stat.icon}
                <span className="text-2xl font-black text-slate-800 dark:text-white">{stat.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto font-semibold">{stat.label}</span>
            </div>

            {/* Secondary Stats */}
            <div className="flex gap-4 mt-3 px-1">
                {sortBy !== 'POINTS' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Star size={12} className="text-amber-500" />
                        <span className="font-bold">{user.points?.toLocaleString()}</span>
                    </div>
                )}
                {sortBy !== 'BOTTLES' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Recycle size={12} className="text-emerald-500" />
                        <span className="font-bold">{user.bottlesCollected || 0}</span>
                    </div>
                )}
                {sortBy !== 'STREAK' && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Flame size={12} className="text-orange-500" />
                        <span className="font-bold">{user.streak || 0}d</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// TOP SCHOOLS CARD
// ============================================================================
const SchoolRankCard = ({ school, rank, sortBy }) => {
    const borderColors = {
        1: 'ring-2 ring-amber-300/60 dark:ring-amber-500/40',
        2: 'ring-2 ring-slate-300/60 dark:ring-slate-500/40',
    };

    return (
        <div className={`bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-5 backdrop-blur-xl shadow-md ${borderColors[rank] || ''}`}>
            <div className="flex items-center gap-4">
                <RankBadge rank={rank} />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{school.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{school.userCount} users</p>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {sortBy === 'BOTTLES' ? school.totalBottles?.toLocaleString() : school.totalPoints?.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sortBy === 'BOTTLES' ? 'Bottles' : 'EcoPoints'}
                    </p>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function LeaderboardsPage() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, hasPermission } = useAuth();

    // Default tab based on role
    const defaultTab = isSuperAdmin ? 'OVERALL' : 'MY_LOCATION';

    // State
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [sortBy, setSortBy] = useState('POINTS');
    const [roleFilter, setRoleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStrand, setSelectedStrand] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [showSearchHint, setShowSearchHint] = useState(false);

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [activeTab, sortBy, roleFilter, searchQuery, selectedDepartment, selectedStrand, selectedSection]);

    // Reset filters on tab change
    useEffect(() => {
        setSearchQuery('');
        setRoleFilter('');
        setSelectedDepartment('');
        setSelectedStrand('');
        setSelectedSection('');
    }, [activeTab]);

    // Get base user list
    const allUsers = useMemo(() => {
        if ((activeTab === 'OVERALL') && isSuperAdmin) return USERS;
        return getUsersByLocation(effectiveLocationId);
    }, [activeTab, effectiveLocationId, isSuperAdmin]);

    // Sorting function with tiebreakers
    const sortUsers = (users) => {
        return [...users].sort((a, b) => {
            switch (sortBy) {
                case 'BOTTLES':
                    return (b.bottlesCollected || 0) - (a.bottlesCollected || 0) || (b.points || 0) - (a.points || 0);
                case 'STREAK':
                    return (b.streak || 0) - (a.streak || 0) || (b.points || 0) - (a.points || 0);
                default:
                    return (b.points || 0) - (a.points || 0) || (b.bottlesCollected || 0) - (a.bottlesCollected || 0);
            }
        });
    };

    // School rankings (for Top Schools tab)
    const schoolRankings = useMemo(() => {
        return LOCATIONS.map(loc => {
            const locUsers = USERS.filter(u => u.locationId === loc.id);
            return {
                id: loc.id,
                name: loc.name,
                fullName: loc.fullName,
                userCount: locUsers.length,
                totalPoints: locUsers.reduce((sum, u) => sum + (u.points || 0), 0),
                totalBottles: locUsers.reduce((sum, u) => sum + (u.bottlesCollected || 0), 0),
                avgStreak: locUsers.length > 0 ? Math.round(locUsers.reduce((sum, u) => sum + (u.streak || 0), 0) / locUsers.length) : 0,
            };
        }).sort((a, b) => {
            if (sortBy === 'BOTTLES') return b.totalBottles - a.totalBottles;
            return b.totalPoints - a.totalPoints;
        });
    }, [sortBy]);

    // Available departments for current location
    const availableDepartments = useMemo(() => {
        const depts = [...new Set(allUsers.filter(u => u.department).map(u => u.department))];
        return depts.map(d => {
            const dept = DEPARTMENTS.find(dep => dep.id === d);
            return { value: d, label: dept?.abbreviation || d };
        });
    }, [allUsers]);

    // Available strands
    const availableStrands = useMemo(() => {
        const strands = [...new Set(allUsers.filter(u => u.strand).map(u => u.strand))];
        return strands.map(s => {
            const strand = DEPARTMENTS.find(dep => dep.id === s);
            return { value: s, label: strand?.abbreviation || s };
        });
    }, [allUsers]);

    // Available sections
    const availableSections = useMemo(() => {
        return [...new Set(allUsers.filter(u => u.section).map(u => u.section))].sort();
    }, [allUsers]);

    // Processed / filtered / sorted data
    const { leaderboardData, topThree } = useMemo(() => {
        let filtered = [...allUsers];

        // Tab-specific filters
        if (activeTab === 'BY_DEPARTMENT' && selectedDepartment) {
            filtered = filtered.filter(u => u.department === selectedDepartment);
        }
        if (activeTab === 'BY_STRAND' && selectedStrand) {
            filtered = filtered.filter(u => u.strand === selectedStrand);
        }
        if (activeTab === 'BY_SECTION' && selectedSection) {
            filtered = filtered.filter(u => u.section === selectedSection);
        }

        // Role filter
        if (roleFilter !== '') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        // Sort
        const sorted = sortUsers(filtered);

        // Top 3 — always from pre-search data
        const top3 = sorted.slice(0, 3);

        // Apply search (supports initials like "JJ")
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            const qUpper = searchQuery.trim().toUpperCase();
            const searched = sorted.filter(u => {
                // Standard search: name, role, section, dept, strand
                if (u.name?.toLowerCase().includes(q)) return true;
                if (u.role?.toLowerCase().includes(q)) return true;
                if (u.section?.toLowerCase().includes(q)) return true;
                if (getDepartmentName(u.department)?.toLowerCase().includes(q)) return true;
                const strandAbbr = u.strand && DEPARTMENTS.find(d => d.id === u.strand)?.abbreviation;
                if (strandAbbr?.toLowerCase().includes(q)) return true;
                // Easter egg: initials search (e.g. "JJ" matches "Justine James")
                const initials = getUserInitials(u.name);
                if (initials === qUpper) return true;
                if (qUpper.length >= 2 && initials.includes(qUpper)) return true;
                return false;
            });
            return { leaderboardData: searched, topThree: top3 };
        }

        return { leaderboardData: sorted, topThree: top3 };
    }, [allUsers, activeTab, sortBy, roleFilter, searchQuery, selectedDepartment, selectedStrand, selectedSection]);

    // Pagination
    const totalPages = Math.ceil(leaderboardData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentItems = leaderboardData.slice(startIndex, startIndex + rowsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    // Which tabs to show
    const visibleTabs = isSuperAdmin ? SUPER_ADMIN_TABS : ADMIN_TABS;

    // Stats
    const stats = {
        totalParticipants: leaderboardData.length,
        totalPoints: leaderboardData.reduce((sum, u) => sum + (u.points || 0), 0),
        totalBottles: leaderboardData.reduce((sum, u) => sum + (u.bottlesCollected || 0), 0),
        avgStreak: leaderboardData.length > 0 ? Math.round(leaderboardData.reduce((sum, u) => sum + (u.streak || 0), 0) / leaderboardData.length) : 0,
    };

    const hasActiveFilters = roleFilter !== 'All' || searchQuery || selectedDepartment || selectedStrand || selectedSection;
    const clearFilters = () => { setRoleFilter('All'); setSearchQuery(''); setSelectedDepartment(''); setSelectedStrand(''); setSelectedSection(''); };

    return (
        <>
            <ViewOnlyBanner />

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">Leaderboards</h1>
                    {currentLocation && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                            {currentLocation.name}
                        </span>
                    )}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                    {activeTab === 'OVERALL' ? 'Rankings across all locations' :
                        activeTab === 'TOP_SCHOOLS' ? 'Campus-level rankings' :
                            `Top recyclers at ${currentLocation?.name || 'your location'}`}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <UsersIcon size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Participants</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalParticipants}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <Star size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Points</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Recycle size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Bottles</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalBottles.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-500/20">
                            <Flame size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Avg Streak</p>
                            <p className="text-xl font-black text-slate-800 dark:text-white">{stats.avgStreak} days</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Context Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {visibleTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-500/20'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500/50'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab-specific sub-filter: department / strand / section */}
            {activeTab === 'BY_DEPARTMENT' && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Select Department:</span>
                        <div className="flex flex-wrap gap-2">
                            {availableDepartments.map(dept => (
                                <button
                                    key={dept.value}
                                    onClick={() => setSelectedDepartment(selectedDepartment === dept.value ? '' : dept.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedDepartment === dept.value
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                        }`}
                                >
                                    {dept.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BY_STRAND' && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Select Strand:</span>
                        <div className="flex flex-wrap gap-2">
                            {availableStrands.map(strand => (
                                <button
                                    key={strand.value}
                                    onClick={() => setSelectedStrand(selectedStrand === strand.value ? '' : strand.value)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedStrand === strand.value
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                        }`}
                                >
                                    {strand.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BY_SECTION' && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Select Section:</span>
                        <div className="flex flex-wrap gap-2">
                            {availableSections.map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setSelectedSection(selectedSection === sec ? '' : sec)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedSection === sec
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                        }`}
                                >
                                    Section {sec}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TOP SCHOOLS VIEW */}
            {activeTab === 'TOP_SCHOOLS' ? (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl backdrop-blur-xl">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                                Campus Rankings
                            </h3>
                        </div>
                        <div className="p-5 space-y-3">
                            {schoolRankings.map((school, idx) => (
                                <SchoolRankCard key={school.id} school={school} rank={idx + 1} sortBy={sortBy} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* TOP 3 PODIUM CARDS — Always visible, even during search */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {topThree.map((user, idx) => (
                                <PodiumCard key={user.id} user={user} rank={idx + 1} sortBy={sortBy} />
                            ))}
                        </div>
                    )}

                    {/* LEADERBOARD TABLE */}
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        {/* Table Header Bar */}
                        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                                Rankings
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                                    {leaderboardData.length} users
                                </span>
                            </h3>
                            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                                {/* Sort */}
                                <CustomDropdown
                                    value={sortBy}
                                    onChange={(v) => setSortBy(v || 'POINTS')}
                                    options={SORT_OPTIONS.map(opt => ({ value: opt.value, label: opt.label }))}
                                    placeholder="Sort By"
                                    showPlaceholder={false}
                                />

                                {/* Role Filter */}
                                <CustomDropdown
                                    value={roleFilter}
                                    onChange={(v) => setRoleFilter(v)}
                                    options={['Student', 'Faculty', 'Staff']}
                                    placeholder="All Roles"
                                />

                                {/* Search with easter egg hint */}
                                <div className="relative group flex-1 lg:w-56">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search name, dept..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full text-sm rounded-lg pl-10 pr-9 py-2 outline-none transition-all placeholder:text-slate-400
                                            bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                                            dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                                    />
                                    {/* Easter egg icon — hover to reveal hint */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-help"
                                        onMouseEnter={() => setShowSearchHint(true)}
                                        onMouseLeave={() => setShowSearchHint(false)}
                                    >
                                        <Sparkles size={14} className="text-slate-300 dark:text-slate-600 hover:text-amber-400 dark:hover:text-amber-400 transition-colors" />
                                    </div>
                                    {/* Hint tooltip */}
                                    {showSearchHint && (
                                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-xl shadow-2xl z-50 border border-slate-700">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <Sparkles size={12} className="text-amber-400" />
                                                <span className="font-bold text-amber-400">Pro Tip!</span>
                                            </div>
                                            <p className="text-slate-300 leading-relaxed">
                                                Try searching by <span className="font-bold text-white">initials</span>! Type <span className="bg-slate-700 px-1.5 py-0.5 rounded font-mono text-amber-300">MS</span> to find users like "Maria Santos".
                                            </p>
                                            <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 dark:bg-slate-900 rotate-45 border-l border-t border-slate-700"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Clear */}
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10">
                                        <X size={14} /> Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Top Pagination */}
                        {totalPages > 0 && (
                            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{leaderboardData.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + rowsPerPage, leaderboardData.length)}</strong> of {leaderboardData.length}</span>
                                    <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} options={[5, 10, 20, 50]} label={null} direction="down" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                                        className="p-1.5 rounded border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                        <ChevronLeft size={12} />
                                    </button>
                                    <span className="px-2 py-1 text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                                        className="p-1.5 rounded border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                        <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Table — NO initials in rows, just name */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-max text-left">
                                <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap w-16">Rank</th>
                                        <th className="px-4 py-3 whitespace-nowrap">User</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Role</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Dept / Strand</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Section</th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Flame size={12} className="text-orange-500" /> Streak
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Recycle size={12} className="text-emerald-500" /> Bottles
                                            </div>
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Star size={12} className="text-amber-500" /> EcoPoints
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {currentItems.map((user, idx) => {
                                        const rank = startIndex + idx + 1;
                                        const isHighlightSort = (col) => {
                                            if (col === 'POINTS' && sortBy === 'POINTS') return true;
                                            if (col === 'BOTTLES' && sortBy === 'BOTTLES') return true;
                                            if (col === 'STREAK' && sortBy === 'STREAK') return true;
                                            return false;
                                        };

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <RankBadge rank={rank} />
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-medium text-slate-800 dark:text-white text-sm">{user.name}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRoleBadge(user.role)}`}>{user.role}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                                        {getUserDeptDisplay(user)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-xs text-slate-600 dark:text-slate-300">{user.section || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className={`flex items-center gap-1.5 ${isHighlightSort('STREAK') ? 'font-bold text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        <Flame size={14} className={isHighlightSort('STREAK') ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500'} />
                                                        <span className="text-sm">{user.streak || 0}d</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className={`flex items-center gap-1.5 ${isHighlightSort('BOTTLES') ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        <Recycle size={14} className={isHighlightSort('BOTTLES') ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'} />
                                                        <span className="text-sm">{user.bottlesCollected || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`text-sm ${isHighlightSort('POINTS') ? 'font-black text-emerald-600 dark:text-emerald-400' : 'font-bold text-slate-700 dark:text-slate-200'}`}>
                                                        {user.points?.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Empty State */}
                        {currentItems.length === 0 && (
                            <div className="p-12 text-center">
                                <Trophy size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">No users found matching your filters.</p>
                            </div>
                        )}

                        {/* Bottom Pagination */}
                        {totalPages > 0 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-4">
                                    <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{leaderboardData.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, leaderboardData.length)}</strong> of {leaderboardData.length} users</span>
                                    <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} options={[5, 10, 20, 50]} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                                        className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                                        <ChevronLeft size={14} />
                                    </button>
                                    {getPageNumbers().map((page, idx) => (
                                        <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={page === '...'}
                                            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : page === '...' ? 'cursor-default text-slate-400 dark:text-slate-500' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                            {page}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
