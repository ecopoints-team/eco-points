'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { useAuth } from '../../../../src/context/AuthContext';
import { ADMIN_LOGS } from '../../../../src/data/mockData';
import { Search, Filter, ChevronLeft, ChevronRight, Shield, User, Clock, Globe, ChevronDown, X, Activity, Download } from 'lucide-react';

const allAdminLogs = ADMIN_LOGS;

export default function AdminAccessLogsPage() {
    const { effectiveLocationId } = useAuth(); // Get filtering context
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterAdmin, setFilterAdmin] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const admins = [...new Set(allAdminLogs.map(log => log.adminName))];
    const categories = [...new Set(allAdminLogs.map(log => log.category))];

    const filteredLogs = useMemo(() => {
        return allAdminLogs.filter(log => {
            // 1. Filter by Location (View As)
            // If effectiveLocationId is set, only show logs matching that location
            // OR logs that are global (null) if we want to show global events to everyone? 
            // Usually, "View As Location A" means "Show me things relevant to Location A".
            // Strict filtering: log.locationId === effectiveLocationId
            if (effectiveLocationId && log.locationId !== effectiveLocationId) {
                return false;
            }

            // 2. Filter by Search Query
            const matchesSearch = searchQuery === '' ||
                log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.action.toLowerCase().includes(searchQuery.toLowerCase());

            // 3. Filter by Dropdowns
            const matchesAdmin = filterAdmin === '' || log.adminName === filterAdmin;
            const matchesCategory = filterCategory === '' || log.category === filterCategory;

            return matchesSearch && matchesAdmin && matchesCategory;
        });
    }, [searchQuery, filterAdmin, filterCategory, effectiveLocationId]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);
    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterAdmin(''); setFilterCategory(''); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterAdmin || filterCategory;

    const getCategoryColor = (cat) => {
        const colors = { 'Users': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', 'Rewards': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', 'Machines': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', 'Settings': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', 'Auth': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', 'Permissions': 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' };
        return colors[cat] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    };

    return (
        <>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Admin Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track all administrative actions</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20"><Activity size={24} className="text-purple-600 dark:text-purple-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Actions (24h)</p><p className="text-2xl font-black text-slate-800 dark:text-white">47</p></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20"><Shield size={24} className="text-emerald-600 dark:text-emerald-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Active Admins</p><p className="text-2xl font-black text-slate-800 dark:text-white">4</p></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20"><X size={24} className="text-red-600 dark:text-red-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Failed Actions</p><p className="text-2xl font-black text-slate-800 dark:text-white">5</p></div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#a855f7]"></span>Activity Log</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search by Admin, Action, or Target..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 focus:border-purple-500" />
                        </div>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFilter || hasActiveFilters ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}><Filter size={16} /> Filter</button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center">
                        <select value={filterAdmin} onChange={(e) => handleFilterChange(setFilterAdmin, e.target.value)} className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none">
                            <option value="">All Admins</option>{admins.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select value={filterCategory} onChange={(e) => handleFilterChange(setFilterCategory, e.target.value)} className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none">
                            <option value="">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {hasActiveFilters && <button onClick={clearFilters} className="text-sm text-red-600 font-medium flex items-center gap-1"><X size={14} /> Clear</button>}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3">Date/Time</th>
                                <th className="px-4 py-3">Admin Name</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Target</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-purple-900/10 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Clock size={14} />{log.timestamp}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <User size={14} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <p className="font-medium text-slate-800 dark:text-white text-sm">{log.adminName}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                            {log.adminRole}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium">{log.action}</td>
                                    <td className="px-4 py-3"><span className="font-mono text-sm text-slate-500 dark:text-slate-400">{log.target}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <span>Showing <strong className="text-purple-600 dark:text-purple-400">{startIndex + 1}</strong> to <strong className="text-purple-600 dark:text-purple-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length}</span>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === page ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>
        </>
    );
}
