'use client';
import React, { useState, useMemo, useEffect } from 'react';
import RequirePermission from '../../../../src/components/admin/RequirePermission';
import { SkeletonTableRow } from '../../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../../src/context/AuthContext';
import { useProgress } from '../../../../src/context/ProgressContext';import { formatDate } from '../../../../src/utils/formatDate';
import { logs as logsApi } from '../../../../src/services/api';
import { Search, Filter, ChevronLeft, ChevronRight, X, ChevronDown, Download, RefreshCw, ChevronsUpDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { formatField } from '../../../../src/lib/formatField';
import { detectedClassLabel } from '../../../../src/lib/enumLabels';

function BottleLogsPageContent() {
    const { currentUser, isSuperAdmin, viewAsLocationId, effectiveLocationId, allLocations, hasPermission } = useAuth();
    const { runWithProgress } = useProgress();
    const [allBottleLogs, setAllBottleLogs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await logsApi.getBottles(effectiveLocationId);
                if (!cancelled) setAllBottleLogs((data || []).map(l => ({ ...l, id: String(l.id), userId: String(l.userId || ''), timestampObj: l.timestamp ? new Date(l.timestamp) : new Date() })));
            } catch (err) { console.error('Failed to load bottle logs:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        return () => { cancelled = true; };
    }, [effectiveLocationId, refreshKey]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterDetectedClass, setFilterDetectedClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Column visibility toggles
    const [showMachine, setShowMachine] = useState(true);
    const [showLocation, setShowLocation] = useState(true);
    const [showSession, setShowSession] = useState(false);

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
    const detectedClasses = [...new Set(allBottleLogs.map(log => log.detectedClass).filter(Boolean))];
    const statuses = [...new Set(allBottleLogs.map(log => log.status))];


    const filteredLogs = useMemo(() => {
        // Data is already server-scoped by effectiveLocationId — no need to re-filter by location
        return allBottleLogs.filter(log => {
            const matchesSearch = searchQuery === '' || (log.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || (log.userId || '').toLowerCase().includes(searchQuery.toLowerCase()) || (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (log.machineName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (log.detectedClass || '').toLowerCase().includes(searchQuery.toLowerCase()) || (log.locationName && log.locationName.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesSearch &&
                (filterMachine === '' || log.machineName === filterMachine) &&
                (filterDetectedClass === '' || log.detectedClass === filterDetectedClass) &&
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
    }, [allBottleLogs, searchQuery, filterMachine, filterDetectedClass, filterStatus, filterLocation, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterDetectedClass(''); setFilterStatus(''); setFilterLocation(''); setSortColumn('timestampObj'); setSortDirection('desc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterDetectedClass || filterStatus || filterLocation || (sortColumn !== 'timestampObj' || sortDirection !== 'desc');

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

    const exportToCSV = () => runWithProgress('Preparing export...', async () => {
        const headers = ['Date', 'Log ID', 'User', 'Email', 'Machine', 'Location', 'Detected Class', 'Confidence %', 'Points', 'Status'];
        const rows = filteredLogs.map(log => [
            log.timestamp, log.id, log.userName, log.userEmail, log.machineName,
            log.locationName || log.locationId, detectedClassLabel(log.detectedClass),
            log.confidenceScore != null ? log.confidenceScore : '', log.pointsAwarded, log.status
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bottle-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, { successLabel: 'Export ready' });

    return (
        <>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Bottle Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">View all bottle recycling transactions and activity logs</p>
                </div>
                {hasPermission('logs', 'export') && (
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
                )}
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
                        <button onClick={() => { setCurrentPage(1); setRefreshKey(k => k + 1); }}
                            disabled={isDataLoading}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Refresh">
                            <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                            <Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        {/* Filter Row */}
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                            <CustomDropdown value={filterMachine} onChange={(v) => handleFilterChange(setFilterMachine, v)} options={machines} placeholder="All Machines" />
                            <CustomDropdown value={filterDetectedClass} onChange={(v) => handleFilterChange(setFilterDetectedClass, v)} options={detectedClasses.map(c => ({ value: c, label: detectedClassLabel(c) }))} placeholder="All Classes" />
                            <CustomDropdown value={filterStatus} onChange={(v) => handleFilterChange(setFilterStatus, v)} options={statuses} placeholder="All Statuses" />

                            {isSuperAdmin && !viewAsLocationId && (
                                <CustomDropdown value={filterLocation} onChange={(v) => handleFilterChange(setFilterLocation, v)} options={allLocations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Locations" />
                            )}

                            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 hover:bg-red-500/20 font-medium transition-colors dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"><X size={14} /> Clear</button>}
                        </div>

                        {/* Column Visibility Toggles */}
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Show columns:</span>
                            <button
                                onClick={() => setShowMachine(!showMachine)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showMachine
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showMachine ? <Eye size={12} /> : <EyeOff size={12} />}
                                Machine
                            </button>
                            <button
                                onClick={() => setShowLocation(!showLocation)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showLocation
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showLocation ? <Eye size={12} /> : <EyeOff size={12} />}
                                Location
                            </button>
                            <button
                                onClick={() => setShowSession(!showSession)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showSession
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showSession ? <Eye size={12} /> : <EyeOff size={12} />}
                                Session
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length}</span>
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
                                <th className="px-3 py-3">User ID</th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('userName')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="userName" /></div>
                                </th>
                                <th className="px-3 py-3">Email</th>
                                {showMachine && <th className="px-3 py-3">Machine</th>}
                                {showLocation && <th className="px-3 py-3">Location</th>}
                                {showSession && <th className="px-3 py-3">Session</th>}
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('detectedClass')}>
                                    <div className="flex items-center gap-1">Detected Class <SortIcon column="detectedClass" /></div>
                                </th>
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('confidenceScore')}>
                                    <div className="flex items-center gap-1">Confidence <SortIcon column="confidenceScore" /></div>
                                </th>
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
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={8} />)
                            ) : currentLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className={`transition-colors ${log.status === 'Rejected'
                                        ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-emerald-900/10'
                                        }`}
                                >
                                    <td className="px-3 py-3"><span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatField(log.userId)}</span></td>
                                    <td className="px-3 py-3"><span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(log.userName)}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs text-slate-500 dark:text-slate-400">{formatField(log.userEmail)}</span></td>
                                    {showMachine && (
                                        <td className="px-3 py-3"><span className="text-xs text-slate-600 dark:text-slate-300">{formatField(log.machineName)}</span></td>
                                    )}
                                    {showLocation && (
                                        <td className="px-3 py-3"><span className="text-xs text-slate-600 dark:text-slate-300">{formatField(log.locationName)}</span></td>
                                    )}
                                    {showSession && (
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatField(log.sessionId)}</span>
                                                {log.sessionType === 'bulk' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">BULK</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-3 py-3"><span className="text-xs font-medium text-slate-700 dark:text-slate-300">{detectedClassLabel(log.detectedClass)}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs font-mono text-slate-600 dark:text-slate-400">{log.confidenceScore != null ? `${log.confidenceScore}%` : formatField(null)}</span></td>
                                    <td className="px-3 py-3"><span className={`font-bold ${log.pointsAwarded > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{log.pointsAwarded > 0 ? `+${log.pointsAwarded}` : '0'}</span></td>
                                    <td className="px-3 py-3"><span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</span></td>
                                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(log.status)}`}>{log.status}</span></td>
                                </tr>
                            ))}
                            {!isDataLoading && currentLogs.length === 0 && (
                                <tr>
                                    <td colSpan={99} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">📦</span>
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No bottle logs found</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-600">Try adjusting your filters or check back later</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-4">
                        <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length} logs</span>
                        <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} />
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


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function BottleLogsPage() {
    return (
        <RequirePermission category="logs">
            <BottleLogsPageContent />
        </RequirePermission>
    );
}
