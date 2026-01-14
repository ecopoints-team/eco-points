'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { Search, Filter, ChevronLeft, ChevronRight, User, Mail, Calendar, Shield, Edit2, Trash2, UserPlus, ChevronDown, X } from 'lucide-react';

// Mock Data for Users
const allUsers = [
    { id: 'USR-1234', name: 'Justin Ibale', email: 'justin.ibale@email.com', role: 'Admin', status: 'Active', points: 2450, joinDate: 'Jan 5, 2025' },
    { id: 'USR-1235', name: 'Jana Soriano', email: 'jana.soriano@email.com', role: 'User', status: 'Active', points: 1890, joinDate: 'Jan 8, 2025' },
    { id: 'USR-1236', name: 'Miguel Torres', email: 'miguel.torres@email.com', role: 'User', status: 'Active', points: 3210, joinDate: 'Jan 10, 2025' },
    { id: 'USR-1237', name: 'Anna Reyes', email: 'anna.reyes@email.com', role: 'Moderator', status: 'Active', points: 1560, joinDate: 'Jan 12, 2025' },
    { id: 'USR-1238', name: 'Sarah Cruz', email: 'sarah.cruz@email.com', role: 'User', status: 'Inactive', points: 890, joinDate: 'Jan 15, 2025' },
    { id: 'USR-1239', name: 'Carlos Garcia', email: 'carlos.garcia@email.com', role: 'User', status: 'Active', points: 2100, joinDate: 'Jan 18, 2025' },
    { id: 'USR-1240', name: 'Mark Santos', email: 'mark.santos@email.com', role: 'User', status: 'Active', points: 4500, joinDate: 'Jan 20, 2025' },
    { id: 'USR-1241', name: 'Lisa Mendoza', email: 'lisa.mendoza@email.com', role: 'User', status: 'Suspended', points: 320, joinDate: 'Jan 22, 2025' },
    { id: 'USR-1242', name: 'Ryan Tan', email: 'ryan.tan@email.com', role: 'User', status: 'Active', points: 1750, joinDate: 'Jan 25, 2025' },
    { id: 'USR-1243', name: 'Maria Lopez', email: 'maria.lopez@email.com', role: 'User', status: 'Active', points: 2890, joinDate: 'Jan 28, 2025' },
    { id: 'USR-1244', name: 'David Kim', email: 'david.kim@email.com', role: 'Moderator', status: 'Active', points: 1200, joinDate: 'Feb 1, 2025' },
    { id: 'USR-1245', name: 'Angela Lim', email: 'angela.lim@email.com', role: 'User', status: 'Active', points: 980, joinDate: 'Feb 3, 2025' },
    { id: 'USR-1246', name: 'Patrick Tan', email: 'patrick.tan@email.com', role: 'User', status: 'Inactive', points: 450, joinDate: 'Feb 5, 2025' },
    { id: 'USR-1247', name: 'Christina Ong', email: 'christina.ong@email.com', role: 'User', status: 'Active', points: 3100, joinDate: 'Feb 7, 2025' },
    { id: 'USR-1248', name: 'Kevin Wu', email: 'kevin.wu@email.com', role: 'User', status: 'Active', points: 2200, joinDate: 'Feb 10, 2025' },
];

const stats = {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter(u => u.status === 'Active').length,
    totalPoints: allUsers.reduce((sum, u) => sum + u.points, 0),
};

export default function ManageUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const roles = [...new Set(allUsers.map(u => u.role))];
    const statuses = [...new Set(allUsers.map(u => u.status))];

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const matchesSearch = searchQuery === '' ||
                user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === '' || user.role === filterRole;
            const matchesStatus = filterStatus === '' || user.status === filterStatus;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [searchQuery, filterRole, filterStatus]);

    const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterRole(''); setFilterStatus(''); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterRole || filterStatus;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'Inactive': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
            case 'Suspended': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'Moderator': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'User': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manage Users</h1>
                    <p className="text-slate-500 dark:text-slate-400">View and manage all registered users</p>
                </div>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    <UserPlus size={18} />
                    Add User
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Shield size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Active Users</p>
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
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        All Users
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400
                                    bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                                    dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                                ${showFilter || hasActiveFilters
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-3 flex-1">
                            <select value={filterRole} onChange={(e) => handleFilterChange(setFilterRole, e.target.value)}
                                className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Roles</option>
                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                                className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Statuses</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"><X size={14} /> Clear</button>}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Points</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-white text-sm">{user.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Mail size={14} className="text-slate-400" />
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRoleColor(user.role)}`}>{user.role}</span></td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(user.status)}`}>{user.status}</span></td>
                                    <td className="px-6 py-4"><span className="font-bold text-emerald-600 dark:text-emerald-400">{user.points.toLocaleString()}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Calendar size={14} className="text-slate-400" />
                                            {user.joinDate}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all"><Edit2 size={16} /></button>
                                            <button className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                        <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(endIndex, filteredUsers.length)}</strong> of {filteredUsers.length}</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                            className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
