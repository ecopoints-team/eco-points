'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { Search, Filter, ChevronLeft, ChevronRight, Recycle, User, Clock, MapPin, X, ChevronDown } from 'lucide-react';

const generateBottleLogs = () => {
    const users = [
        { id: 'USR-1234', name: 'Justin Ibale' }, { id: 'USR-1235', name: 'Jana Soriano' }, { id: 'USR-1236', name: 'Miguel Torres' },
        { id: 'USR-1237', name: 'Anna Reyes' }, { id: 'USR-1238', name: 'Sarah Cruz' }, { id: 'USR-1239', name: 'Carlos Garcia' },
        { id: 'USR-1240', name: 'Mark Santos' }, { id: 'USR-1241', name: 'Lisa Mendoza' }, { id: 'GUEST', name: 'Guest User' },
    ];
    const machines = [
        { id: 'RVM-001', name: 'Main Campus RVM' }, { id: 'RVM-002', name: 'Library RVM' },
        { id: 'RVM-003', name: 'Cafeteria RVM' }, { id: 'RVM-004', name: 'Sports Complex RVM' },
    ];
    const bottleTypes = ['350ml PET', '500ml PET', '750ml Glass', '1000ml PET', '1500ml PET'];
    const pointsMap = { '350ml PET': 3, '500ml PET': 5, '750ml Glass': 8, '1000ml PET': 10, '1500ml PET': 15 };
    const statuses = ['Completed', 'Pending', 'Failed'];
    const logs = [];
    const baseDate = new Date('2026-01-14T10:45:00');
    for (let i = 0; i < 156; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const machine = machines[Math.floor(Math.random() * machines.length)];
        const bottleType = bottleTypes[Math.floor(Math.random() * bottleTypes.length)];
        const status = i < 140 ? 'Completed' : statuses[Math.floor(Math.random() * statuses.length)];
        const logDate = new Date(baseDate.getTime() - (i * 15 * 60000));
        const formattedDate = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + logDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        logs.push({ id: `LOG-${8842 - i}`, userId: user.id, userName: user.name, machineId: machine.id, machineName: machine.name, bottleType, pointsAwarded: pointsMap[bottleType], timestamp: formattedDate, status });
    }
    return logs;
};

const allBottleLogs = generateBottleLogs();
const stats = { todayTransactions: 156, todayBottles: 203, todayPoints: 1520 };

export default function BottleLogsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterBottleType, setFilterBottleType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const machines = [...new Set(allBottleLogs.map(log => log.machineName))];
    const bottleTypes = [...new Set(allBottleLogs.map(log => log.bottleType))];
    const statuses = [...new Set(allBottleLogs.map(log => log.status))];

    const filteredLogs = useMemo(() => {
        return allBottleLogs.filter(log => {
            const matchesSearch = searchQuery === '' || log.id.toLowerCase().includes(searchQuery.toLowerCase()) || log.userName.toLowerCase().includes(searchQuery.toLowerCase()) || log.machineName.toLowerCase().includes(searchQuery.toLowerCase()) || log.bottleType.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && (filterMachine === '' || log.machineName === filterMachine) && (filterBottleType === '' || log.bottleType === filterBottleType) && (filterStatus === '' || log.status === filterStatus);
        });
    }, [searchQuery, filterMachine, filterBottleType, filterStatus]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterBottleType(''); setFilterStatus(''); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterBottleType || filterStatus;

    const getStatusColor = (s) => ({ 'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', 'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', 'Failed': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' }[s] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Bottle Logs</h1>
                <p className="text-slate-500 dark:text-slate-400">View all bottle recycling transactions and activity logs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20"><Recycle size={24} className="text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Today's Transactions</p><p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayTransactions}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20"><Recycle size={24} className="text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Bottles Recycled Today</p><p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayBottles}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20"><Recycle size={24} className="text-purple-600 dark:text-purple-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Points Awarded Today</p><p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayPoints}</p></div></div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>All Bottle Logs</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                            <input type="text" placeholder="Search logs..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-3 flex-1">
                            <div className="relative"><select value={filterMachine} onChange={(e) => handleFilterChange(setFilterMachine, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Machines</option>{machines.map(m => <option key={m} value={m}>{m}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            <div className="relative"><select value={filterBottleType} onChange={(e) => handleFilterChange(setFilterBottleType, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Bottle Types</option>{bottleTypes.map(b => <option key={b} value={b}>{b}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                            <div className="relative"><select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"><option value="">All Statuses</option>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
                        </div>
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"><X size={14} /> Clear Filters</button>}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr><th className="px-6 py-4">Log ID</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Machine</th><th className="px-6 py-4">Bottle Type</th><th className="px-6 py-4">Points</th><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-6 py-4"><span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{log.id}</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center"><User size={14} className="text-emerald-600 dark:text-emerald-400" /></div><div><p className="font-medium text-slate-800 dark:text-white text-sm">{log.userName}</p><p className="text-xs text-slate-500 dark:text-slate-400">{log.userId}</p></div></div></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><MapPin size={14} className="text-slate-400" />{log.machineName}</div></td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row gap-1 items-start sm:items-center">
                                            {log.bottleType.split(' ').map((part, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                                    {part}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className="font-bold text-emerald-600 dark:text-emerald-400">+{log.pointsAwarded} pts</span></td>
                                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Clock size={14} className="text-slate-400" />{log.timestamp}</div></td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(log.status)}`}>{log.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                        <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length} entries</span>
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
        </AdminLayout>
    );
}
