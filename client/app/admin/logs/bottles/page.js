'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { useAuth } from '../../../../src/context/AuthContext';
import { BOTTLE_LOGS } from '../../../../src/data/mockData';
import { Search, Filter, ChevronLeft, ChevronRight, Recycle, User, Clock, MapPin, X, ChevronDown, Download, RefreshCw, ChevronsUpDown, ChevronUp } from 'lucide-react';

const allBottleLogs = BOTTLE_LOGS;

// Calculate real stats
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayLogs = allBottleLogs.filter(log => log.timestampObj >= today);
const stats = {
    todayTransactions: todayLogs.length,
    acceptedBottles: allBottleLogs.filter(log => log.status === 'Accepted').length,
    rejectedBottles: allBottleLogs.filter(log => log.status === 'Rejected').length
};

export default function BottleLogsPage() {
    const { user, isSuperAdmin, viewAsLocationId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterBottleType, setFilterBottleType] = useState('');
    const [filterCondition, setFilterCondition] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Sortable column state
    const [sortColumn, setSortColumn] = useState('timestampObj');
    const [sortDirection, setSortDirection] = useState('desc');

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

    const machines = [...new Set(allBottleLogs.map(log => log.machineName))];
    const bottleTypes = [...new Set(allBottleLogs.map(log => log.bottleType))];
    const statuses = [...new Set(allBottleLogs.map(log => log.status))];

    const filteredLogs = useMemo(() => {
        let logs = allBottleLogs;

        // Filter by View As Location (or user's scoped location)
        if (viewAsLocationId) {
            logs = logs.filter(log => log.locationId === viewAsLocationId);
        } else if (user?.locationId && !isSuperAdmin) {
            logs = logs.filter(log => log.locationId === user.locationId);
        }

        return logs.filter(log => {
            const matchesSearch = searchQuery === '' || log.id.toLowerCase().includes(searchQuery.toLowerCase()) || log.userId.toLowerCase().includes(searchQuery.toLowerCase()) || log.userName.toLowerCase().includes(searchQuery.toLowerCase()) || log.machineName.toLowerCase().includes(searchQuery.toLowerCase()) || log.bottleType.toLowerCase().includes(searchQuery.toLowerCase()) || (log.locationName && log.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch &&
                (filterMachine === '' || log.machineName === filterMachine) &&
                (filterBottleType === '' || log.bottleType === filterBottleType) &&
                (filterCondition === '' || log.condition === filterCondition) &&
                (filterStatus === '' || log.status === filterStatus) &&
                (filterLocation === '' || log.locationId === filterLocation);
        }).sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
    }, [searchQuery, filterMachine, filterBottleType, filterCondition, filterStatus, filterLocation, sortColumn, sortDirection, viewAsLocationId, user, isSuperAdmin]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterBottleType(''); setFilterCondition(''); setFilterStatus(''); setFilterLocation(''); setSortColumn('timestampObj'); setSortDirection('desc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterBottleType || filterCondition || filterStatus || filterLocation;

    const getStatusColor = (s) => {
        switch (s) {
            case 'Accepted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    return (
        <>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Bottle Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">View all bottle recycling transactions and activity logs</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20"><Recycle size={24} className="text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Total Transactions</p><p className="text-2xl font-black text-slate-800 dark:text-white">{allBottleLogs.length}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20"><Recycle size={24} className="text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Accepted Bottles</p><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.acceptedBottles}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20"><Recycle size={24} className="text-red-600 dark:text-red-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Rejected Bottles</p><p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.rejectedBottles}</p></div></div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-x-auto backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>All Bottle Logs</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                            <input type="text" placeholder="Search ID, Name, Location..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={() => { setCurrentPage(1); }}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors"
                            title="Refresh">
                            <RefreshCw size={16} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-3 flex-1">
                            <div className="relative"><select value={filterMachine} onChange={(e) => handleFilterChange(setFilterMachine, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Machines</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            <div className="relative"><select value={filterBottleType} onChange={(e) => handleFilterChange(setFilterBottleType, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Sizes</option>{bottleTypes.map(b => <option key={b} value={b}>{b}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            <div className="relative"><select value={filterCondition} onChange={(e) => handleFilterChange(setFilterCondition, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Conditions</option>{['Perfect', 'Good', 'Crushed', 'Dirty (Rejected)'].map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            <div className="relative"><select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Statuses</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>

                            {isSuperAdmin && !viewAsLocationId && (
                                <div className="relative"><select value={filterLocation} onChange={(e) => handleFilterChange(setFilterLocation, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Locations</option><option value="LOC-001">School A</option><option value="LOC-002">School B</option></select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            )}
                        </div>
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 hover:bg-red-500/20 font-medium transition-colors dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"><X size={14} /> Clear</button>}
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length}</span>
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
                                <th className="px-3 py-3">User ID</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('userName')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="userName" /></div>
                                </th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Location</th>
                                <th className="px-3 py-3">Bottle Type</th>
                                <th className="px-3 py-3">Condition</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('pointsAwarded')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="pointsAwarded" /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('timestampObj')}>
                                    <div className="flex items-center gap-1">Timestamp <SortIcon column="timestampObj" /></div>
                                </th>
                                <th className="px-3 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className={`transition-colors ${log.status === 'Rejected'
                                        ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-emerald-900/10'
                                        }`}
                                >
                                    <td className="px-3 py-3"><span className="text-xs font-mono text-slate-500 dark:text-slate-400">{log.userId}</span></td>
                                    <td className="px-3 py-3"><span className="text-sm font-medium text-slate-800 dark:text-white">{log.userName}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs text-slate-500 dark:text-slate-400">{log.userEmail || '-'}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs text-slate-600 dark:text-slate-300">{log.locationName || 'Arellano University'}</span></td>
                                    <td className="px-3 py-3"><span className="text-sm font-medium text-slate-700 dark:text-slate-300">{log.bottleType}</span></td>
                                    <td className="px-3 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.condition === 'With Label' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                            log.condition === 'No Label' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                log.condition === 'Crushed' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' :
                                                    'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                            }`}>{log.condition}</span>
                                    </td>
                                    <td className="px-3 py-3"><span className={`font-bold ${log.pointsAwarded > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{log.pointsAwarded > 0 ? `+${log.pointsAwarded}` : '0'}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</span></td>
                                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(log.status)}`}>{log.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                        <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length} logs</span>
                        <div className="flex items-center gap-2">
                            <span>Rows:</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={150}>150</option><option value={200}>200</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronLeft size={14} /></button>
                        {getPageNumbers().map((page, idx) => (
                            <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={page === '...'} className={`px-3 py-1.5 rounded-lg transition-all font-medium ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : page === '...' ? 'cursor-default text-slate-400 dark:text-slate-500' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>{page}</button>
                        ))}
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>
        </>
    );
}
