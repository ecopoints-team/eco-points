'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { useAuth } from '../../../../src/context/AuthContext';
import { SYSTEM_LOGS, LOCATIONS } from '../../../../src/data/mockData';
import { Search, Filter, ChevronLeft, ChevronRight, Wrench, Calendar, MapPin, X, ChevronDown, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function MachineLogsPage() {
    const { user, isSuperAdmin, viewAsLocationId, effectiveLocationId, allLocations } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Get logs from mockData
    const allMachineLogs = useMemo(() => {
        // Sort by date descending
        return SYSTEM_LOGS.machines.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, []);

    const machines = [...new Set(allMachineLogs.map(log => log.machineName))];
    const statuses = ['Resolved', 'Pending', 'In Progress']; // Assumed statuses based on 'resolved' boolean

    const filteredLogs = useMemo(() => {
        let logs = allMachineLogs;

        // Filter by Location
        if (effectiveLocationId) {
            logs = logs.filter(log => log.locationId === effectiveLocationId);
        }

        return logs.filter(log => {
            const statusText = log.resolved ? 'Resolved' : 'Pending';
            const matchesSearch = searchQuery === '' ||
                log.machineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.issue.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesMachine = filterMachine === '' || log.machineName === filterMachine;
            const matchesStatus = filterStatus === '' || statusText === filterStatus;

            return matchesSearch && matchesMachine && matchesStatus;
        });
    }, [allMachineLogs, effectiveLocationId, searchQuery, filterMachine, filterStatus]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterStatus(''); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterStatus || searchQuery;

    // Get location name
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : 'Unknown';
    };

    const getStatusBadge = (resolved) => {
        if (resolved) return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"><CheckCircle size={12} /> Resolved</span>;
        return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"><Clock size={12} /> Pending</span>;
    };

    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Machine Logs</h1>
                <p className="text-slate-500 dark:text-slate-400">Maintenance and status records for Reverse Vending Machines</p>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Maintenance History
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                            <input type="text" placeholder="Search machine, technician..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center">
                        <div className="flex flex-wrap gap-3 flex-1">
                            <select value={filterMachine} onChange={(e) => handleFilterChange(setFilterMachine, e.target.value)} className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Machines</option>
                                {machines.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select value={filterStatus} onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)} className="pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value="">All Statuses</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Pending">Pending</option>
                            </select>
                        </div>
                        {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"><X size={14} /> Clear</button>}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Machine</th>
                                <th className="px-6 py-4">Technician</th>
                                <th className="px-6 py-4">Issue</th>
                                {isSuperAdmin && !effectiveLocationId && <th className="px-6 py-4">Location</th>}
                                <th className="px-6 py-4">Cost</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentLogs.map((log, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{log.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-white text-sm">
                                            <Wrench size={16} className="text-slate-400" />
                                            {log.machineName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{log.technician}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{log.issue}</td>
                                    {isSuperAdmin && !effectiveLocationId && (
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                <MapPin size={12} />
                                                {getLocationName(log.locationId)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{log.cost > 0 ? `₱${log.cost.toLocaleString()}` : '-'}</td>
                                    <td className="px-6 py-4">{getStatusBadge(log.resolved)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length} logs</span>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronLeft size={14} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === p ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>{p}</button>
                            ))}
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
