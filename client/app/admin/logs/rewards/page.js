'use client';
import React, { useState, useMemo, useEffect } from 'react';
import RequirePermission from '../../../../src/components/admin/RequirePermission';
import { SkeletonTableRow } from '../../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../../src/context/AuthContext';
import { useProgress } from '../../../../src/context/ProgressContext';import { formatDate } from '../../../../src/utils/formatDate';
import * as logsApi from '../../../../src/services/api/logs';
import { formatField } from '../../../../src/lib/formatField';
import { redemptionStatusLabel } from '../../../../src/lib/enumLabels';
import { Search, Filter, ChevronLeft, ChevronRight, X, ChevronDown, Download, RefreshCw, ChevronsUpDown, ChevronUp, Eye, EyeOff, ChevronRight as ChevronRightIcon } from 'lucide-react';

function RewardsLogsPageContent() {
    const { currentUser, isSuperAdmin, viewAsLocationId, effectiveLocationId, allLocations, hasPermission } = useAuth();
    const { runWithProgress } = useProgress();
    const [allRewardsLogs, setAllRewardsLogs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await logsApi.getRewards(effectiveLocationId);
                if (!cancelled) setAllRewardsLogs((data || []).map(l => ({
                    ...l,
                    id: String(l.id),
                    // Phase 3 (8.3): bind directly to canonical server keys
                    // (`pointsSpent`, server-supplied `timestamp`). Until task 8.2
                    // ships the new `timestamp` derived field, fall back to
                    // `claimedAt`/`redeemedAt` so the column still renders.
                    timestamp: l.timestamp ?? l.claimedAt ?? l.redeemedAt ?? null,
                    timestampObj: new Date(l.timestamp ?? l.claimedAt ?? l.redeemedAt ?? Date.now()),
                })));
            } catch (err) { console.error('Failed to load rewards logs:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        return () => { cancelled = true; };
    }, [effectiveLocationId, refreshKey]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterReward, setFilterReward] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Sortable column state
    const [sortColumn, setSortColumn] = useState('timestampObj');
    const [sortDirection, setSortDirection] = useState('desc');

    // Column visibility toggles
    const [showUser, setShowUser] = useState(true);
    const [showReward, setShowReward] = useState(true);
    const [showLocation, setShowLocation] = useState(true);

    const rewardNames = [...new Set(allRewardsLogs.map(log => log.rewardName))];

    const filteredLogs = useMemo(() => {
        // Data is already server-scoped by effectiveLocationId — no need to re-filter by location
        return allRewardsLogs.filter(log => {
            const matchesSearch = searchQuery === '' ||
                (log.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.rewardName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.redemptionCode || '').toLowerCase().includes(searchQuery.toLowerCase());

            const statusMatch = filterStatus === '' || log.status === filterStatus;

            return matchesSearch &&
                (filterReward === '' || log.rewardName === filterReward) &&
                statusMatch &&
                (filterLocation === '' || log.locationId === filterLocation);
        }).sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
    }, [allRewardsLogs, searchQuery, filterReward, filterStatus, filterLocation, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterReward(''); setFilterStatus(''); setFilterLocation(''); setSortColumn('timestampObj'); setSortDirection('desc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterReward || filterStatus || filterLocation || (sortColumn !== 'timestampObj' || sortDirection !== 'desc');

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

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };

    const getStatusBadge = (status) => {
        const styles = {
            claimed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
            used: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            expired: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
        };
        return styles[status] || 'bg-slate-100 text-slate-600';
    };

    const handleStatusChange = async (logId, newStatus) => {
        try {
            const updated = await logsApi.updateRedemptionStatus(logId, newStatus);
            setAllRewardsLogs(prev => prev.map(l =>
                l.id === String(logId) || l.id === logId
                    // The page now reads `claimedAt` directly from the response
                    // (alignment doc §8 — drops the legacy `usedAt` alias).
                    ? { ...l, status: updated.status, claimedAt: updated.claimedAt ?? updated.usedAt }
                    : l
            ));
        } catch (err) {
            alert(err.message || 'Failed to update status');
        }
    };

    const exportToCSV = () => runWithProgress('Preparing export...', async () => {
        const headers = ['Date', 'Log ID', 'User', 'Email', 'Reward', 'Points', 'Redemption Code', 'Location', 'Status'];
        const rows = filteredLogs.map(log => [
            log.timestamp, log.id, log.userName, log.userEmail, log.rewardName,
            log.pointsSpent ?? 0, log.redemptionCode || '', log.locationName || '—', log.status
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rewards-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, { successLabel: 'Export ready' });

    return (
        <>
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Rewards Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">Reward redemption history and transactions</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    {hasPermission('logs', 'export') && (
                    <button
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold text-sm shadow-lg dark:bg-slate-700 dark:hover:bg-slate-600"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Redemption History
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input type="text" placeholder="Search User, Reward..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400 bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
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
                            <CustomDropdown value={filterReward} onChange={(v) => handleFilterChange(setFilterReward, v)} options={rewardNames} placeholder="All Rewards" />
                            <CustomDropdown value={filterStatus} onChange={(v) => handleFilterChange(setFilterStatus, v)} options={['claimed', 'pending', 'expired']} placeholder="All Statuses" />
                            <CustomDropdown value={filterLocation} onChange={(v) => handleFilterChange(setFilterLocation, v)} options={allLocations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Locations" />
                            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 hover:bg-red-500/20 font-medium transition-colors dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"><X size={14} /> Clear</button>}
                        </div>

                        {/* Column Visibility Toggles */}
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Show columns:</span>
                            <button onClick={() => setShowUser(!showUser)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showUser ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showUser ? <Eye size={12} /> : <EyeOff size={12} />} User
                            </button>
                            <button onClick={() => setShowReward(!showReward)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showReward ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showReward ? <Eye size={12} /> : <EyeOff size={12} />} Reward
                            </button>
                            <button onClick={() => setShowLocation(!showLocation)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showLocation ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showLocation ? <Eye size={12} /> : <EyeOff size={12} />} Location
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
                                <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('timestampObj')}>
                                    <div className="flex items-center gap-1">Date <SortIcon column="timestampObj" /></div>
                                </th>
                                <th className="px-3 py-3 whitespace-nowrap">Log ID</th>
                                {showUser && (
                                    <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('userName')}>
                                        <div className="flex items-center gap-1">User <SortIcon column="userName" /></div>
                                    </th>
                                )}
                                {showReward && (
                                    <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('rewardName')}>
                                        <div className="flex items-center gap-1">Reward <SortIcon column="rewardName" /></div>
                                    </th>
                                )}
                                <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('pointsSpent')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="pointsSpent" /></div>
                                </th>
                                {showLocation && <th className="px-3 py-3 whitespace-nowrap">Location</th>}
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                                <th className="px-3 py-3 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={8} />)
                            ) : currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs font-mono text-slate-600 dark:text-slate-300">{log.id}</span></td>
                                    {showUser && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(log.userName)}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(log.userEmail)}</span>
                                            </div>
                                        </td>
                                    )}
                                    {showReward && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(log.rewardName)}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(log.redemptionCode)}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{(log.pointsSpent ?? 0).toLocaleString()}</span>
                                    </td>
                                    {showLocation && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(log.locationName)}</span>
                                        </td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(log.status)}`}>
                                            {redemptionStatusLabel(log.status)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <select
                                            value={log.status || 'pending'}
                                            onChange={(e) => handleStatusChange(log.id, e.target.value)}
                                            className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="claimed">Claimed</option>
                                            <option value="used">Used</option>
                                            <option value="expired">Expired</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {!isDataLoading && currentLogs.length === 0 && (
                                <tr>
                                    <td colSpan={99} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">🎁</span>
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No rewards logs found</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-600">Try adjusting your filters or check back later</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filteredLogs.length === 0 ? 0 : startIndex + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length} entries</span>
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

        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function RewardsLogsPage() {
    return (
        <RequirePermission category="logs">
            <RewardsLogsPageContent />
        </RequirePermission>
    );
}
