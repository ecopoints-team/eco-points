'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../src/components/admin/RequirePermission';
import { SkeletonTableRow, SkeletonCard } from '../../../src/components/admin/SkeletonLoaders';
import PageSizeSelector from '../../../src/components/admin/PageSizeSelector';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import AddRegularUserModal from '../../../src/components/admin/AddRegularUserModal';
import { useAuth } from '../../../src/context/AuthContext';
import { useProgress } from '../../../src/context/ProgressContext';
// getDepartmentName replaced — server returns groupName directly
import { users as usersApi, groups as groupsApi } from '../../../src/services/api';
import { formatField } from '../../../src/lib/formatField';
import { userRoleLabel, userTypeLabel } from '../../../src/lib/enumLabels';
import { Search, Filter, ChevronLeft, ChevronRight, User, Mail, Calendar, Shield, Edit2, Trash2, UserPlus, X, Building2, RefreshCw, Eye, EyeOff, Wifi, WifiOff, ChevronDown, ChevronsUpDown, ChevronUp, AlertTriangle, Coins } from 'lucide-react';

function ManageUsersPageContent() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, hasPermission } = useAuth();
    const { runWithProgress } = useProgress();

    const [users, setUsers] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterAccountHealth, setFilterAccountHealth] = useState('');
    const [filterSchool, setFilterSchool] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Column visibility toggles
    const [showDepartment, setShowDepartment] = useState(true);

    // Edit and Delete modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        firstName: '', middleName: '', lastName: '', username: '', email: '', phone: '',
        userType: '', yearLevel: '', communityGroupId: '', isActive: true
    });

    // Edit modal cascading state
    const [editGroups, setEditGroups] = useState([]);
    const [editGroupsLoading, setEditGroupsLoading] = useState(false);

    // Adjust Points modal state
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Handle Edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            firstName: user.firstName || '',
            middleName: user.middleName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            userType: user.userType || '',
            yearLevel: user.yearLevel || '',
            communityGroupId: user.communityGroupId ? String(user.communityGroupId) : '',
            isActive: user.isActive !== undefined ? user.isActive : true
        });
        setIsEditModalOpen(true);
        // Fetch groups for user's location
        const locId = user.locationId || effectiveLocationId;
        if (locId) {
            setEditGroupsLoading(true);
            groupsApi.getAll(locId)
                .then(g => setEditGroups(g || []))
                .catch(() => setEditGroups([]))
                .finally(() => setEditGroupsLoading(false));
        }
    };

    const handleEditChange = (field, value) => {
        setEditFormData(prev => {
            const next = { ...prev, [field]: value };
            // Reset dependent fields on cascade change
            if (field === 'userType') {
                next.yearLevel = '';
                next.communityGroupId = '';
            }
            if (field === 'communityGroupId') {
                next.yearLevel = '';
            }
            return next;
        });
    };

    const saveEdit = async () => {
        if (selectedUser) {
            try {
                await runWithProgress('Saving changes...', async () => {
                    const payload = {
                        firstName: editFormData.firstName.trim(),
                        middleName: editFormData.middleName.trim() || null,
                        lastName: editFormData.lastName.trim(),
                        username: editFormData.username,
                        email: editFormData.email,
                        phone: editFormData.phone,
                        userType: editFormData.userType,
                        yearLevel: editFormData.yearLevel || null,
                        communityGroupId: editFormData.communityGroupId ? parseInt(editFormData.communityGroupId) : null,
                        isActive: editFormData.isActive,
                    };
                    const updated = await usersApi.update(selectedUser.id, payload);
                    const updatedName = [editFormData.firstName, editFormData.middleName, editFormData.lastName].filter(Boolean).join(' ');
                    setUsers(prev => prev.map(u =>
                        u.id === selectedUser.id
                            ? { ...u, ...updated, id: String(updated.id), name: updatedName, userType: editFormData.userType, isActive: editFormData.isActive }
                            : u
                    ));
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }, { successLabel: 'User updated' });
            } catch (err) {
                console.error('Failed to save user:', err);
                alert(err?.message || 'Failed to save user. Please try again.');
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
                await runWithProgress('Deactivating user...', async () => {
                    await usersApi.delete(selectedUser.id);
                    setUsers(prev => prev.map(u =>
                        u.id === selectedUser.id ? { ...u, isActive: false } : u
                    ));
                }, { successLabel: 'User deactivated' });
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
            } catch (err) {
                console.error('Failed to deactivate user:', err);
                alert(err?.message || 'Failed to deactivate user. Please try again.');
            }
        }
    };

    // Handle Adjust Points
    const handleAdjustPoints = (user) => {
        setSelectedUser(user);
        setAdjustAmount('');
        setAdjustReason('');
        setIsAdjustModalOpen(true);
    };

    const confirmAdjustPoints = async () => {
        if (!selectedUser || !adjustAmount) return;
        setIsAdjusting(true);
        try {
            await runWithProgress('Adjusting points...', async () => {
                const result = await usersApi.adjustPoints(selectedUser.id, {
                    amount: parseInt(adjustAmount, 10),
                    reason: adjustReason || 'Manual adjustment',
                });
                setUsers(prev => prev.map(u =>
                    u.id === selectedUser.id ? { ...u, pointsBalance: result.balanceAfter } : u
                ));
                setIsAdjustModalOpen(false);
                setSelectedUser(null);
            }, { successLabel: 'Points adjusted' });
        } catch (err) {
            console.error('Failed to adjust points:', err);
            alert(err?.message || 'Failed to adjust points. Please try again.');
        }
        setIsAdjusting(false);
    };

    // Sortable column state
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

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

    // Load users from API when location changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await usersApi.getAll({ locationId: effectiveLocationId });
                if (!cancelled) {
                    const ADMIN_ROLES = ['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician'];
                    const regularUsers = (data || []).filter(u => !ADMIN_ROLES.includes(u.role));
                    setUsers(regularUsers.map(u => ({
                        ...u,
                        id: String(u.id),
                    })));
                }
            } catch (err) {
                console.error('Failed to load users:', err);
            } finally {
                if (!cancelled) setIsDataLoading(false);
            }
        };
        load();
        setCurrentPage(1);
        return () => { cancelled = true; };
    }, [effectiveLocationId]);

    const roles = [...new Set(users.map(u => u.userType).filter(Boolean))];
    const statuses = ['Active', 'Inactive'];

    const filteredUsers = useMemo(() => {
        let result = users.filter(user => {
            const matchesSearch = searchQuery === '' ||
                (user.displayId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === '' || user.userType === filterRole;
            // `Status` and `Account Health` filters both bind directly to `isActive`
            // (the client-side `status`/`accountHealth` derivations were dropped per
            // alignment doc §13).
            const matchesStatus = filterStatus === ''
                || (filterStatus === 'Active' ? user.isActive === true : user.isActive === false);
            const matchesSchool = filterSchool === '' || user.locationId === filterSchool;
            return matchesSearch && matchesRole && matchesStatus && matchesSchool;
        });

        // Apply sortable column sorting
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                if (sortColumn === 'displayId') {
                    aVal = aVal || '';
                    bVal = bVal || '';
                } else if (sortColumn === 'id') {
                    aVal = parseInt(aVal) || 0;
                    bVal = parseInt(bVal) || 0;
                } else if (sortColumn === 'pointsBalance') {
                    aVal = aVal || 0;
                    bVal = bVal || 0;
                } else if (sortColumn === 'createdAt') {
                    aVal = aVal ? new Date(aVal).getTime() : 0;
                    bVal = bVal ? new Date(bVal).getTime() : 0;
                } else {
                    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                }
                if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
        } else {
            // Default to newest first (descending User ID)
            result = result.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));
        }

        return result;
    }, [users, searchQuery, filterRole, filterStatus, filterSchool, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    // Pagination page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    // Stats
    const stats = {
        totalUsers: users.length,
        // Phase 3 (8.3): drop client-side `status: 'Online'/'Offline'` derivation;
        // bind to the canonical server boolean directly. We no longer derive an
        // "Online Now" count from a synthetic field, so this card now shows the
        // count of users with a recorded last login.
        onlineUsers: users.filter(u => !!u.lastLogin).length,
        activeUsers: users.filter(u => u.isActive === true).length,
        totalPoints: users.reduce((sum, u) => sum + (u.pointsBalance || 0), 0),
    };

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterRole(''); setFilterStatus(''); setFilterSchool(''); setSortColumn(''); setSortDirection('asc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterRole || filterStatus || filterSchool || sortColumn;

    // Get location name
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : '';
    };

    const getStatusColor = (isActive) => {
        return isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    };



    const getRoleColor = (role) => {
        switch (role) {
            case 'student': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'faculty': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'staff': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    // Check if user can edit
    const canEdit = hasPermission('users', 'edit');
    const canDelete = hasPermission('users', 'delete');
    const canCreate = hasPermission('users', 'create');

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header */}
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">Manage Users</h1>
                            {currentLocation && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                    {currentLocation.name}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                            {isSuperAdmin && !effectiveLocationId
                                ? 'Viewing all users across all locations'
                                : `View and manage users at ${currentLocation?.name || 'your location'}`}
                        </p>
                    </div>
                    {canCreate && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <UserPlus size={18} />
                            <span className="hidden sm:inline">Add User</span>
                        </button>
                    )}
                </div>
            </ViewOnlyWrapper>
            {/* Stats Cards */}
            {isDataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                <User size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-500/20">
                                <Wifi size={24} className="text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Online Now</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.onlineUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                                <Shield size={24} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Active Accounts</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeUsers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                                <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">⭐</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Points</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalPoints.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-x-auto backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        All Users
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input type="text" placeholder="Search ID, Name, Email..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400
                                    bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                                    dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={async () => {
                            try {
                                setIsDataLoading(true);
                                const data = await usersApi.getAll({ locationId: effectiveLocationId });
                                const ADMIN_ROLES = ['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician'];
                                const regularUsers = (data || []).filter(u => !ADMIN_ROLES.includes(u.role));
                                setUsers(regularUsers.map(u => ({
                                    ...u,
                                    id: String(u.id),
                                })));
                            } catch (err) { console.error('Refresh failed:', err); }
                            finally { setIsDataLoading(false); }
                        }}
                            disabled={isDataLoading}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Refresh">
                            <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${showFilter || hasActiveFilters
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} />Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        {/* Filter Row */}
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                            <CustomDropdown value={filterRole} onChange={(v) => handleFilterChange(setFilterRole, v)} options={roles} placeholder="All Roles" />
                            <CustomDropdown value={filterStatus} onChange={(v) => handleFilterChange(setFilterStatus, v)} options={statuses} placeholder="All Status" />

                            {/* School Filter (Super Admin) */}
                            {isSuperAdmin && !effectiveLocationId && (
                                <CustomDropdown value={filterSchool} onChange={(v) => handleFilterChange(setFilterSchool, v)} options={allLocations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Schools" />
                            )}

                            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 font-medium dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"><X size={14} /> Clear</button>}
                        </div>

                        {/* Column Visibility Toggles */}
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Show columns:</span>
                            <button
                                onClick={() => setShowDepartment(!showDepartment)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showDepartment
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showDepartment ? <Eye size={12} /> : <EyeOff size={12} />}
                                Group
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} label={null} direction="down" />
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
                                {showDepartment && <th className="px-3 py-3 whitespace-nowrap">Group</th>}
                                <th className="px-3 py-3 whitespace-nowrap">Location</th>
                                <th className="px-3 py-3 whitespace-nowrap">Role</th>
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('pointsBalance')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="pointsBalance" /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('createdAt')}>
                                    <div className="flex items-center gap-1">Joined <SortIcon column="createdAt" /></div>
                                </th>
                                {(canEdit || canDelete) && <th className="px-3 py-3 text-right whitespace-nowrap">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={10} />)
                            ) : currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{formatField(user.displayId ?? user.id)}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-medium text-slate-800 dark:text-white text-sm">{formatField(user.name)}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(user.email)}</span>
                                    </td>
                                    {showDepartment && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-600 dark:text-slate-300">{formatField(user.groupName)}</span>
                                        </td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{formatField(user.locationName ?? getLocationName(user.locationId))}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRoleColor(user.userType)}`}>{userTypeLabel(user.userType)}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(user.isActive)}`}>
                                            {user.isActive ? <Wifi size={10} /> : <WifiOff size={10} />}
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{(user.pointsBalance ?? 0).toLocaleString()}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(user.createdAt)}</span>
                                    </td>
                                    {(canEdit || canDelete) && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex justify-end gap-1">
                                                {canEdit && (
                                                    <button onClick={() => handleAdjustPoints(user)} title="Adjust Points" className="p-1.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-500/10 transition-all"><Coins size={14} /></button>
                                                )}
                                                {canEdit && (
                                                    <button onClick={() => handleEdit(user)} title="Edit User" className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all"><Edit2 size={14} /></button>
                                                )}
                                                {canDelete && (
                                                    <button onClick={() => handleDeleteClick(user)} title="Delete User" className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredUsers.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length} users</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} />
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

            {/* Add User Modal */}
            <AddRegularUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onUserAdded={(newUser) => {
                    setUsers(prev => [newUser, ...prev]);
                }}
            />

            {/* Edit User Modal — Cascading fields aligned with AddRegularUserModal */}
            {isEditModalOpen && selectedUser && (() => {
                // Derive org type from user's location
                const editOrgType = (() => {
                    const locId = selectedUser.locationId || effectiveLocationId;
                    const loc = allLocations?.find(l => String(l.id) === String(locId));
                    return loc?.orgType || null;
                })();
                const editIsUniversity = editOrgType && editOrgType.toLowerCase() === 'university';
                const editUserTypes = (() => {
                    if (!editOrgType) return ['Staff'];
                    const USER_TYPES_MAP = {
                        University: ['Student', 'Alumni', 'Faculty', 'Staff'],
                        Community:  ['Resident', 'Community Official', 'Community Worker', 'Business Owner'],
                        Corporate:  ['Employee', 'Manager', 'Executive', 'Contractor', 'Guest'],
                    };
                    const key = Object.keys(USER_TYPES_MAP).find(k => k.toLowerCase() === editOrgType.toLowerCase());
                    return key ? USER_TYPES_MAP[key] : ['Staff'];
                })();
                const editIsStudent = editFormData.userType === 'student';
                const NON_STUDENT_AUTO = new Set(['alumni', 'faculty', 'staff']);
                const YEAR_MAP = {
                    Kindergarten: [],
                    Elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
                    JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
                    SHS: ['Grade 11', 'Grade 12'],
                    College: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
                };
                // Show community-group picker for everyone EXCEPT University
                // alumni/faculty/staff (those auto-assign on the backend).
                const editShowGroup = (() => {
                    if (!editFormData.userType) return false;
                    if (editIsUniversity && NON_STUDENT_AUTO.has(editFormData.userType)) return false;
                    return true;
                })();
                // Year-level options derive from the SELECTED group's
                // educational_level. Only shown for university students.
                const editSelectedGroup = editGroups.find(g => String(g.id) === String(editFormData.communityGroupId)) || null;
                const editYearOptions = (editIsUniversity && editIsStudent && editSelectedGroup?.educationalLevel)
                    ? (YEAR_MAP[editSelectedGroup.educationalLevel] || [])
                    : [];
                const editShowYearLevel = editYearOptions.length > 0;
                const typeToValue = (t) => t.toLowerCase().replace(/ /g, '_');
                const editAvatarInitial = editFormData.firstName ? editFormData.firstName.charAt(0).toUpperCase() : (selectedUser.name || '?').charAt(0).toUpperCase();

                return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                                {editAvatarInitial}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit User</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {selectedUser.displayId || selectedUser.id}</p>
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
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Middle Name</label>
                                    <input type="text" value={editFormData.middleName}
                                        onChange={(e) => handleEditChange('middleName', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Last Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={editFormData.lastName}
                                        onChange={(e) => handleEditChange('lastName', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Username</label>
                                    <input type="text" value={editFormData.username}
                                        onChange={(e) => handleEditChange('username', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" value={editFormData.email}
                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Phone</label>
                                    <input type="text" value={editFormData.phone}
                                        onChange={(e) => handleEditChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">User Type <span className="text-red-500">*</span></label>
                                    <CustomDropdown
                                        value={editFormData.userType}
                                        onChange={(v) => handleEditChange('userType', v)}
                                        options={editUserTypes.map(t => ({ value: typeToValue(t), label: t }))}
                                        showPlaceholder={false}
                                    />
                                </div>
                            </div>

                            {/* Cascading: Community Group + Year Level
                                - Group hidden for University alumni/faculty/staff (auto-assigned)
                                - Year Level shown only for University students whose group has educational_level */}
                            {editShowGroup && (
                                <div className={editShowYearLevel ? 'grid grid-cols-2 gap-4' : ''}>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Community Group <span className="text-red-500">*</span></label>
                                        <CustomDropdown
                                            value={editFormData.communityGroupId}
                                            onChange={(v) => handleEditChange('communityGroupId', v)}
                                            options={editGroups.map(g => ({
                                                value: String(g.id),
                                                label: g.abbreviation
                                                    ? `${g.abbreviation} — ${g.name}${g.educationalLevel ? ` (${g.educationalLevel})` : ''}`
                                                    : `${g.name}${g.educationalLevel ? ` (${g.educationalLevel})` : ''}`,
                                            }))}
                                            placeholder={editGroupsLoading ? 'Loading...' : 'Select community group'}
                                            searchable
                                            showPlaceholder={false}
                                        />
                                    </div>
                                    {editShowYearLevel && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Year / Grade Level</label>
                                            <CustomDropdown
                                                value={editFormData.yearLevel}
                                                onChange={(v) => handleEditChange('yearLevel', v)}
                                                options={editYearOptions}
                                                placeholder="Select year"
                                                showPlaceholder={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

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
                                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Edit2 size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Deactivate User</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">User will be marked as inactive</p>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Are you sure you want to deactivate this user? They will no longer be able to log in.
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
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Adjust Points Modal */}
            {isAdjustModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-500/20">
                                <Coins size={24} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Adjust Points</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedUser.name} — Current: <strong className="text-emerald-600 dark:text-emerald-400">{selectedUser.pointsBalance ?? 0}</strong> pts</p>
                            </div>
                            <button onClick={() => { setIsAdjustModalOpen(false); setSelectedUser(null); }} className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="e.g. 50 to add, -30 to deduct"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use positive to add, negative to deduct</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="e.g. Manual correction, bonus award"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsAdjustModalOpen(false); setSelectedUser(null); }}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAdjustPoints}
                                disabled={!adjustAmount || parseInt(adjustAmount) === 0 || isAdjusting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Coins size={16} />
                                {isAdjusting ? 'Adjusting...' : 'Adjust Points'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function ManageUsersPage() {
    return (
        <RequirePermission category="users">
            <ManageUsersPageContent />
        </RequirePermission>
    );
}
