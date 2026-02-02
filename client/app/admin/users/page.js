'use client';
import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import AddRegularUserModal from '../../../src/Components/AddRegularUserModal';
import { useAuth } from '../../../src/context/AuthContext';
import { USERS, getUsersByLocation, getDepartmentName } from '../../../src/data/mockData';
import { Search, Filter, ChevronLeft, ChevronRight, User, Mail, Calendar, Shield, Edit2, Trash2, UserPlus, X, Building2, RefreshCw, Eye, EyeOff, GraduationCap, Wifi, WifiOff, ChevronDown, ChevronsUpDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function ManageUsersPage() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, hasPermission } = useAuth();

    // Get initial users based on location
    const getInitialUsers = () => getUsersByLocation(effectiveLocationId);

    const [users, setUsers] = useState(getInitialUsers);
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
    const [showStrand, setShowStrand] = useState(true);
    const [showAccountHealth, setShowAccountHealth] = useState(false);

    // Edit and Delete modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '', email: '', role: '', status: '', accountHealth: '', departmentId: '', strand: ''
    });

    // Handle Edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role || '',
            status: user.status || '',
            accountHealth: user.accountHealth || '',
            departmentId: user.departmentId || '',
            strand: user.strand || ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = () => {
        if (selectedUser) {
            setUsers(prev => prev.map(u =>
                u.id === selectedUser.id ? { ...u, ...editFormData } : u
            ));
            setIsEditModalOpen(false);
            setSelectedUser(null);
        }
    };

    // Handle Delete
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedUser) {
            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setIsDeleteModalOpen(false);
            setSelectedUser(null);
        }
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

    // Update users when location changes
    useEffect(() => {
        setUsers(getUsersByLocation(effectiveLocationId));
        setCurrentPage(1);
    }, [effectiveLocationId]);

    const roles = [...new Set(users.map(u => u.role))];
    const statuses = ['Online', 'Offline'];
    const accountHealthOptions = ['Active', 'Inactive'];

    const filteredUsers = useMemo(() => {
        let result = users.filter(user => {
            const matchesSearch = searchQuery === '' ||
                user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === '' || user.role === filterRole;
            const matchesStatus = filterStatus === '' || user.status === filterStatus;
            const matchesAccountHealth = filterAccountHealth === '' || user.accountHealth === filterAccountHealth;
            const matchesSchool = filterSchool === '' || user.locationId === filterSchool;
            return matchesSearch && matchesRole && matchesStatus && matchesAccountHealth && matchesSchool;
        });

        // Apply sortable column sorting
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
                if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
                return aVal < bVal ? 1 : -1;
            });
        } else {
            // Default to newest first
            result = result.sort((a, b) => new Date(b.joinDateObj || b.joinDate) - new Date(a.joinDateObj || a.joinDate));
        }

        return result;
    }, [users, searchQuery, filterRole, filterStatus, filterAccountHealth, filterSchool, sortColumn, sortDirection]);

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
        onlineUsers: users.filter(u => u.status === 'Online').length,
        activeUsers: users.filter(u => u.accountHealth === 'Active').length,
        totalPoints: users.reduce((sum, u) => sum + u.points, 0),
    };

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterRole(''); setFilterStatus(''); setFilterAccountHealth(''); setFilterSchool(''); setSortColumn(''); setSortDirection('asc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterRole || filterStatus || filterAccountHealth || filterSchool || sortColumn;

    // Get location name
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : '';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Online': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'Offline': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getAccountHealthColor = (health) => {
        switch (health) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'Inactive': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Student': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'Faculty': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'Staff': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    // Check if user can edit
    const canEdit = hasPermission('users', 'edit');
    const canDelete = hasPermission('users', 'delete');
    const canCreate = hasPermission('users', 'create');

    return (
        <>
            {/* Page Header */}
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
            </div>

            {/* Stats Cards */}
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
                        <button onClick={() => setUsers(getUsersByLocation(effectiveLocationId))}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors"
                            title="Refresh">
                            <RefreshCw size={16} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${showFilter || hasActiveFilters
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} />Filter
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        {/* Filter Row */}
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                            <div className="relative">
                                <select value={filterRole} onChange={(e) => handleFilterChange(setFilterRole, e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="">All Roles</option>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="">All Status</option>
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={filterAccountHealth} onChange={(e) => handleFilterChange(setFilterAccountHealth, e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="">All Account Health</option>
                                    {accountHealthOptions.map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* School Filter (Super Admin) */}
                            {isSuperAdmin && !effectiveLocationId && (
                                <div className="relative">
                                    <select value={filterSchool} onChange={(e) => handleFilterChange(setFilterSchool, e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                        <option value="">All Schools</option>
                                        {allLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
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
                                Department
                            </button>
                            <button
                                onClick={() => setShowStrand(!showStrand)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showStrand
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showStrand ? <Eye size={12} /> : <EyeOff size={12} />}
                                Strand
                            </button>
                            <button
                                onClick={() => setShowAccountHealth(!showAccountHealth)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showAccountHealth
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showAccountHealth ? <Eye size={12} /> : <EyeOff size={12} />}
                                Acct Health
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 text-xs rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={150}>150</option><option value={200}>200</option>
                            </select>
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
                                <th className="px-3 py-3 whitespace-nowrap">User ID</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="name" /></div>
                                </th>
                                <th className="px-3 py-3 whitespace-nowrap">Email</th>
                                {showDepartment && <th className="px-3 py-3 whitespace-nowrap">Department</th>}
                                {showStrand && <th className="px-3 py-3 whitespace-nowrap">Strand</th>}
                                <th className="px-3 py-3 whitespace-nowrap">Location</th>
                                <th className="px-3 py-3 whitespace-nowrap">Role</th>
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                                {showAccountHealth && <th className="px-3 py-3 whitespace-nowrap">Acct Health</th>}
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('points')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="points" /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('joinDateObj')}>
                                    <div className="flex items-center gap-1">Joined <SortIcon column="joinDateObj" /></div>
                                </th>
                                {(canEdit || canDelete) && <th className="px-3 py-3 text-right whitespace-nowrap">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{user.id}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-medium text-slate-800 dark:text-white text-sm">{user.name}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                                    </td>
                                    {showDepartment && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-600 dark:text-slate-300">{getDepartmentName(user.departmentId) || '—'}</span>
                                        </td>
                                    )}
                                    {showStrand && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-600 dark:text-slate-300">{user.strand || '—'}</span>
                                        </td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{getLocationName(user.locationId) || 'Arellano University'}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>{user.role}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${getStatusColor(user.status)}`}>
                                            {user.status === 'Online' ? <Wifi size={10} /> : <WifiOff size={10} />}
                                            {user.status}
                                        </span>
                                    </td>
                                    {showAccountHealth && (
                                        <td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getAccountHealthColor(user.accountHealth)}`}>{user.accountHealth}</span></td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{user.points.toLocaleString()}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{user.joinDate}</span>
                                    </td>
                                    {(canEdit || canDelete) && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex justify-end gap-1">
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

                {/* Empty State */}
                {currentUsers.length === 0 && (
                    <div className="p-12 text-center">
                        <User size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No users found for this location.</p>
                    </div>
                )}

                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredUsers.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredUsers.length)}</strong> of {filteredUsers.length} users</span>
                            <div className="flex items-center gap-2">
                                <span>Rows:</span>
                                <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={150}>150</option><option value={200}>200</option>
                                </select>
                            </div>
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

            {/* Edit User Modal */}
            {isEditModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                                {selectedUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit User</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {selectedUser.id}</p>
                            </div>
                            <button onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }} className="ml-auto p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => handleEditChange('name', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => handleEditChange('email', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Role <span className="text-red-500">*</span></label>
                                    <select
                                        value={editFormData.role}
                                        onChange={(e) => handleEditChange('role', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none cursor-pointer focus:border-emerald-500"
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Staff">Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status <span className="text-red-500">*</span></label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => handleEditChange('status', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none cursor-pointer focus:border-emerald-500"
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Account Health <span className="text-red-500">*</span></label>
                                    <select
                                        value={editFormData.accountHealth}
                                        onChange={(e) => handleEditChange('accountHealth', e.target.value)}
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none cursor-pointer focus:border-emerald-500"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Strand <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        list="strand-options"
                                        value={editFormData.strand}
                                        onChange={(e) => handleEditChange('strand', e.target.value)}
                                        placeholder="Search or select strand..."
                                        required
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-emerald-500"
                                    />
                                    <datalist id="strand-options">
                                        <option value="STEM" />
                                        <option value="ABM" />
                                        <option value="HUMSS" />
                                        <option value="GAS" />
                                        <option value="TVL-HE" />
                                        <option value="TVL-ICT" />
                                        <option value="Arts & Design" />
                                        <option value="Sports Track" />
                                        <option value="N/A" />
                                    </datalist>
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
                                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit2 size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-full bg-red-100 dark:bg-red-500/20">
                                <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete User</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                Are you sure you want to delete this user?
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
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
