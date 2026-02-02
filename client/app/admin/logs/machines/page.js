'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { useAuth } from '../../../../src/context/AuthContext';
import { MACHINE_LOGS } from '../../../../src/data/mockData';
import { Search, Filter, ChevronLeft, ChevronRight, Wrench, User, Clock, MapPin, X, ChevronDown, CheckCircle2, Download, RefreshCw } from 'lucide-react';

const allMachineLogs = MACHINE_LOGS;

export default function MachineLogsPage() {
    const { user, isSuperAdmin, viewAsLocationId } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // Resolved/Pending
    const [filterLocation, setFilterLocation] = useState('');
    const [sortOrder, setSortOrder] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const machineNames = [...new Set(allMachineLogs.map(log => log.machineName))];

    const filteredLogs = useMemo(() => {
        let logs = allMachineLogs;

        // Filter by View As Location (or user's scoped location)
        if (viewAsLocationId) {
            logs = logs.filter(log => log.locationId === viewAsLocationId);
        } else if (user?.locationId && !isSuperAdmin) {
            logs = logs.filter(log => log.locationId === user.locationId);
        }

        return logs.filter(log => {
            const matchesSearch = searchQuery === '' ||
                log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.issue.toLowerCase().includes(searchQuery.toLowerCase());

            const statusMatch = filterStatus === '' ? true :
                filterStatus === 'Resolved' ? log.resolved : !log.resolved;

            return matchesSearch &&
                (filterMachine === '' || log.machineName === filterMachine) &&
                statusMatch &&
                (filterLocation === '' || log.locationId === filterLocation);
        }).sort((a, b) => {
            switch (sortOrder) {
                case 'Technician': return a.technician.localeCompare(b.technician);
                case 'Cost (High-Low)': return b.cost - a.cost;
                case 'Newest': default: return b.timestampObj - a.timestampObj;
            }
        });
    }, [searchQuery, filterMachine, filterStatus, filterLocation, sortOrder, user, isSuperAdmin, viewAsLocationId]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterStatus(''); setFilterLocation(''); setSortOrder('Newest'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterStatus || filterLocation || sortOrder !== 'Newest';

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
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Machine Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">Maintenance and issue logs for RVMs</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-x-auto backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Maintenance History
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input type="text" placeholder="Search Machine, Technician, Issue..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400 bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
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
                            <div className="relative">
                                <select value={filterMachine} onChange={(e) => handleFilterChange(setFilterMachine, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="">All Machines</option>
                                    {machineNames.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="">All Statuses</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Pending">Pending</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={sortOrder} onChange={(e) => handleFilterChange(setSortOrder, e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                    <option value="Newest">Newest First</option>
                                    <option value="Technician">Technician Name</option>
                                    <option value="Cost (High-Low)">Cost (High-Low)</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
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
                                <th className="px-3 py-3 whitespace-nowrap">Date</th>
                                <th className="px-3 py-3 whitespace-nowrap">Machine</th>
                                <th className="px-3 py-3 whitespace-nowrap">Technician</th>
                                <th className="px-3 py-3 whitespace-nowrap">Issue</th>
                                <th className="px-3 py-3 whitespace-nowrap">Cost</th>
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{log.machineName}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{log.locationId}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-sm font-medium text-slate-800 dark:text-white">{log.technician}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-600 dark:text-slate-300">{log.issue}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="font-bold text-emerald-600 dark:text-emerald-400">₱{log.cost.toLocaleString()}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${log.resolved
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                            }`}>
                                            {log.resolved ? 'Resolved' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
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
            </div >
        </>
    );
}
