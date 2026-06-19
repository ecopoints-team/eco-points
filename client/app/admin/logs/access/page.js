'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { logs as logsApi } from '../../../../src/services/api';
import { formatDate } from '../../../../src/utils/formatDate';
import { formatField } from '../../../../src/lib/formatField';
import { userRoleLabel } from '../../../../src/lib/enumLabels';
import RequirePermission from '../../../../src/components/admin/RequirePermission';
import { SkeletonTableRow } from '../../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../../src/context/AuthContext';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronDown, X, Download, Eye, EyeOff, RefreshCw, ChevronsUpDown, ChevronUp } from 'lucide-react';

function AdminAccessLogsPageContent() {
    const { effectiveLocationId, isSuperAdmin, allLocations } = useAuth();

    // API-loaded data
    const [allAdminLogs, setAllAdminLogs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await logsApi.getAccess(effectiveLocationId);
                if (!cancelled) {
                    const mapped = (data || []).map(l => ({ ...l, id: String(l.id), timestampObj: l.timestamp ? new Date(l.timestamp) : new Date() }));
                    setAllAdminLogs(mapped);
                }
            } catch (err) { console.error('Failed to load access logs:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        return () => { cancelled = true; };
    }, [effectiveLocationId, refreshKey]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterAdmin, setFilterAdmin] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
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

    // Column visibility
    const [showLocation, setShowLocation] = useState(true);
    const [showNotes, setShowNotes] = useState(false);
    const locations = allLocations;
    const admins = [...new Set(allAdminLogs.map(log => log.adminName))];
    const categories = [...new Set(allAdminLogs.map(log => log.category))];


    const [showCategory, setShowCategory] = useState(false);

    const filteredLogs = useMemo(() => {
        return allAdminLogs.filter(log => {
            // 1. Filter by Location (View As)
            // Include global actions (null locationId) alongside location-specific ones
            if (effectiveLocationId && log.locationId && log.locationId !== effectiveLocationId) {
                return false;
            }

            // 2. Filter by Search Query
            const matchesSearch = searchQuery === '' ||
                (log.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.adminName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.target || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

            // 3. Filter by Dropdowns
            const matchesAdmin = filterAdmin === '' || log.adminName === filterAdmin;
            const matchesCategory = filterCategory === '' || log.category === filterCategory;
            const matchesLocation = filterLocation === '' || log.locationId === filterLocation;

            return matchesSearch && matchesAdmin && matchesCategory && matchesLocation;
        }).sort((a, b) => {
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
    }, [allAdminLogs, searchQuery, filterAdmin, filterCategory, filterLocation, effectiveLocationId, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    // Pagination page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
        else if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push('...', totalPages); }
        else if (currentPage >= totalPages - 2) { pages.push(1, '...'); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
        else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
        return pages;
    };
    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterAdmin(''); setFilterCategory(''); setFilterLocation(''); setSearchQuery(''); setSortColumn('timestampObj'); setSortDirection('desc'); setCurrentPage(1); };
    const hasActiveFilters = filterAdmin || filterCategory || filterLocation || (sortColumn !== 'timestampObj' || sortDirection !== 'desc');

    const getCategoryColor = (cat) => {
        const colors = { 'Users': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', 'Rewards': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', 'Machines': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', 'Settings': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300', 'Auth': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', 'Permissions': 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' };
        return colors[cat] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
    };

    const getDutyColor = (duty) => {
        const colors = {
            'Super Admin': 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 dark:from-amber-500/30 dark:to-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
            'super_admin': 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 border border-amber-200 dark:from-amber-500/30 dark:to-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
            'Head Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
            'head_admin': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
            'Auditor': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            'auditor': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            'Inventory Officer': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
            'inventory_officer': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
            'Technician': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
            'technician': 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
            'Admin': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
            'Manager': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
            'Staff': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
        };
        return colors[duty] || 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300';
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Log ID', 'Admin ID', 'Admin', 'Role', 'Action', 'Target', 'Category', 'Location', 'Notes'];
        const rows = filteredLogs.map(log => [
            log.timestamp, log.id, log.adminUserId, log.adminName, log.adminRole,
            log.action, log.target, log.category, log.locationName || '-',
            log.notes
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `admin-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Admin Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track all administrative actions</p>
                </div>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-x-auto backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-purple-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#a855f7]"></span>Activity Log</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search Admin, Action, Target..." value={searchQuery} onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 focus:border-purple-500" />
                        </div>
                        <button onClick={() => { setCurrentPage(1); setRefreshKey(k => k + 1); }}
                            disabled={isDataLoading}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-purple-500/20 dark:hover:text-purple-400 transition-colors disabled:opacity-50"
                            title="Refresh">
                            <RefreshCw size={16} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFilter || hasActiveFilters ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}><Filter size={16} /> Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-purple-500"></span>}</button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                            <CustomDropdown value={filterAdmin} onChange={(v) => handleFilterChange(setFilterAdmin, v)} options={admins} placeholder="All Admins" />
                            <CustomDropdown value={filterCategory} onChange={(v) => handleFilterChange(setFilterCategory, v)} options={categories} placeholder="All Categories" />
                            <CustomDropdown value={filterLocation} onChange={(v) => { handleFilterChange(setFilterLocation, v); }} options={locations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Locations" />
                            {hasActiveFilters && <button onClick={clearFilters} className="px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 font-medium flex items-center gap-1 hover:bg-red-50 transition-colors dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"><X size={14} /> Clear</button>}
                        </div>

                        {/* Column Visibility */}
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Show columns:</span>
                            <button
                                onClick={() => setShowLocation(!showLocation)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showLocation
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showLocation ? <Eye size={12} /> : <EyeOff size={12} />}
                                Location
                            </button>
                            <button
                                onClick={() => setShowNotes(!showNotes)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showNotes
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showNotes ? <Eye size={12} /> : <EyeOff size={12} />}
                                Notes
                            </button>
                            <button
                                onClick={() => setShowCategory(!showCategory)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showCategory
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {showCategory ? <Eye size={12} /> : <EyeOff size={12} />}
                                Category
                            </button>
                        </div>
                    </div>
                )}

                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-purple-600 dark:text-purple-400">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredLogs.length)}</strong> of {filteredLogs.length}</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} label={null} direction="down" />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                className="p-1.5 rounded border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                <ChevronLeft size={12} />
                            </button>
                            <span className="px-2 py-1 text-slate-600 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
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
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('adminName')}>
                                    <div className="flex items-center gap-1">Username <SortIcon column="adminName" /></div>
                                </th>
                                <th className="px-3 py-3 whitespace-nowrap">Role</th>
                                <th className="px-3 py-3 whitespace-nowrap">Action</th>
                                <th className="px-3 py-3 whitespace-nowrap">Target</th>
                                {showCategory && <th className="px-3 py-3 whitespace-nowrap">Category</th>}
                                {showLocation && <th className="px-3 py-3 whitespace-nowrap">Location</th>}
                                <th className="px-3 py-3 cursor-pointer hover:text-emerald-600 whitespace-nowrap" onClick={() => handleSort('timestampObj')}>
                                    <div className="flex items-center gap-1">Date/Time <SortIcon column="timestampObj" /></div>
                                </th>
                                {showNotes && <th className="px-3 py-3 whitespace-nowrap">Notes</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
                            ) : currentLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-purple-900/10"
                                >
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs font-mono text-slate-500 dark:text-slate-400">{formatField(log.adminUserId)}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(log.adminName)}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDutyColor(log.adminRole)}`}>
                                            {userRoleLabel(log.adminRole)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{formatField(log.action)}</span></td>
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="font-mono text-xs text-slate-500 dark:text-slate-400">{formatField(log.target)}</span></td>
                                    {showCategory && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(log.category)}`}>
                                                {formatField(log.category)}
                                            </span>
                                        </td>
                                    )}
                                    {showLocation && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                {formatField(log.locationName)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</span></td>
                                    {showNotes && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{log.notes || '—'}</span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {!isDataLoading && currentLogs.length === 0 && (
                                <tr>
                                    <td colSpan={99} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">📋</span>
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No admin logs found</p>
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
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                            className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronLeft size={14} />
                        </button>
                        {getPageNumbers().map((page, idx) => (
                            <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={page === '...'}
                                className={`px-3 py-1.5 rounded-lg transition-all font-medium ${currentPage === page ? 'bg-emerald-600 text-white shadow-md' : page === '...' ? 'cursor-default text-slate-400 dark:text-slate-500' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border transition-all disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div >
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function AdminAccessLogsPage() {
    return (
        <RequirePermission category="logs">
            <AdminAccessLogsPageContent />
        </RequirePermission>
    );
}
