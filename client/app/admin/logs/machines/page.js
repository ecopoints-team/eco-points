'use client';
import React, { useState, useMemo, useEffect } from 'react';
import RequirePermission from '../../../../src/components/admin/RequirePermission';
import { SkeletonTableRow } from '../../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../../src/context/AuthContext';
import { logs as logsApi, machines as machinesApi } from '../../../../src/services/api';
import { formatDate } from '../../../../src/utils/formatDate';
import { formatField } from '../../../../src/lib/formatField';
import { Search, Filter, ChevronLeft, ChevronRight, X, ChevronDown, Download, RefreshCw, ChevronsUpDown, ChevronUp, Eye, EyeOff, Plus } from 'lucide-react';

function MachineLogsPageContent() {
    const { currentUser, isSuperAdmin, viewAsLocationId, effectiveLocationId, allLocations } = useAuth();

    // API-loaded data
    const [allMachineLogs, setAllMachineLogs] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await logsApi.getMachines(effectiveLocationId);
                if (!cancelled) setAllMachineLogs((data || []).map(l => ({ ...l, id: String(l.id), timestampObj: l.timestamp ? new Date(l.timestamp) : new Date() })));
            } catch (err) { console.error('Failed to load machine logs:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        return () => { cancelled = true; };
    }, [effectiveLocationId, refreshKey]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterMachine, setFilterMachine] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // Resolved/Pending
    const [filterLocation, setFilterLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Sortable column state
    const [sortColumn, setSortColumn] = useState('timestampObj');
    const [sortDirection, setSortDirection] = useState('desc');

    // Column visibility toggles
    const [showMachine, setShowMachine] = useState(true);
    const [showLocation, setShowLocation] = useState(true);
    const [showTechnician, setShowTechnician] = useState(true);

    // Create log modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [availableMachines, setAvailableMachines] = useState([]);
    const [createForm, setCreateForm] = useState({ rvmId: '', actionType: '', notes: '', resolved: false });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        machinesApi.getAll({ locationId: effectiveLocationId }).then(m => setAvailableMachines(m || [])).catch(() => {});
    }, [effectiveLocationId]);

    const handleCreateLog = async () => {
        if (!createForm.rvmId || !createForm.actionType) return;
        setIsCreating(true);
        try {
            const newLog = await logsApi.createMachineLog({
                rvmId: parseInt(createForm.rvmId),
                actionType: createForm.actionType,
                notes: createForm.notes,
                resolved: createForm.resolved,
            });
            setAllMachineLogs(prev => [{
                ...newLog,
                id: String(newLog.id),
                timestampObj: newLog.timestamp ? new Date(newLog.timestamp) : new Date(),
            }, ...prev]);
            setIsCreateModalOpen(false);
            setCreateForm({ rvmId: '', actionType: '', notes: '', resolved: false });
        } catch (err) {
            alert(err.message || 'Failed to create log');
        } finally {
            setIsCreating(false);
        }
    };

    const machineNames = [...new Set(allMachineLogs.map(log => log.machineName))];

    const filteredLogs = useMemo(() => {
        // Data is already server-scoped by effectiveLocationId — no need to re-filter by location
        return allMachineLogs.filter(log => {
            const matchesSearch = searchQuery === '' ||
                (log.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.performedBy || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.machineName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (log.actionType || '').toLowerCase().includes(searchQuery.toLowerCase());

            const statusMatch = filterStatus === '' ? true :
                filterStatus === 'Resolved' ? log.resolved : !log.resolved;

            return matchesSearch &&
                (filterMachine === '' || log.machineName === filterMachine) &&
                statusMatch &&
                (filterLocation === '' || log.locationId === filterLocation);
        }).sort((a, b) => {
            // Use sortColumn and sortDirection for sorting
            let aVal = a[sortColumn];
            let bVal = b[sortColumn];

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });
    }, [allMachineLogs, searchQuery, filterMachine, filterStatus, filterLocation, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + rowsPerPage);

    const handleFilterChange = (setter, value) => { setter(value); setCurrentPage(1); };
    const clearFilters = () => { setFilterMachine(''); setFilterStatus(''); setFilterLocation(''); setSortColumn('timestampObj'); setSortDirection('desc'); setSearchQuery(''); setCurrentPage(1); };
    const hasActiveFilters = filterMachine || filterStatus || filterLocation || (sortColumn !== 'timestampObj' || sortDirection !== 'desc');

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

    const exportToCSV = () => {
        const headers = ['Date', 'Log ID', 'Machine', 'Location', 'Technician', 'Action Type', 'Status', 'Notes'];
        const rows = filteredLogs.map(log => [
            log.timestamp, log.id, log.machineName, log.locationName || '—',
            log.performedBy || '—', log.actionType, log.resolved ? 'Resolved' : 'Pending', log.notes || '—'
        ]);
        const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `machine-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Machine Logs</h1>
                    <p className="text-slate-500 dark:text-slate-400">Maintenance and issue logs for RVMs</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                        <Download size={18} />
                        Export CSV
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-bold text-sm shadow-lg shadow-blue-500/20">
                        <Plus size={18} />
                        Create Log
                    </button>
                </div>
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
                            <CustomDropdown value={filterMachine} onChange={(v) => handleFilterChange(setFilterMachine, v)} options={machineNames} placeholder="All Machines" />
                            <CustomDropdown value={filterStatus} onChange={(v) => handleFilterChange(setFilterStatus, v)} options={['Resolved', 'Pending']} placeholder="All Statuses" />
                            {isSuperAdmin && !viewAsLocationId && (
                                <CustomDropdown value={filterLocation} onChange={(v) => handleFilterChange(setFilterLocation, v)} options={allLocations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Locations" />
                            )}
                            {hasActiveFilters && <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 hover:bg-red-500/20 font-medium transition-colors dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"><X size={14} /> Clear</button>}
                        </div>

                        {/* Column Visibility Toggles */}
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Show columns:</span>
                            <button onClick={() => setShowMachine(!showMachine)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showMachine ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showMachine ? <Eye size={12} /> : <EyeOff size={12} />} Machine
                            </button>
                            <button onClick={() => setShowLocation(!showLocation)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showLocation ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showLocation ? <Eye size={12} /> : <EyeOff size={12} />} Location
                            </button>
                            <button onClick={() => setShowTechnician(!showTechnician)} className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showTechnician ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {showTechnician ? <Eye size={12} /> : <EyeOff size={12} />} Technician
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
                                {showMachine && (
                                    <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('machineName')}>
                                        <div className="flex items-center gap-1">Machine <SortIcon column="machineName" /></div>
                                    </th>
                                )}
                                {showLocation && <th className="px-3 py-3 whitespace-nowrap">Location</th>}
                                {showTechnician && (
                                    <th className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-emerald-600" onClick={() => handleSort('performedBy')}>
                                        <div className="flex items-center gap-1">Technician <SortIcon column="performedBy" /></div>
                                    </th>
                                )}
                                <th className="px-3 py-3 whitespace-nowrap">Action Type</th>
                                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 8 }).map((_, i) => <SkeletonTableRow key={i} columns={7} />)
                            ) : currentLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(log.timestamp)}</span></td>
                                    {showMachine && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{log.machineName}</span>
                                        </td>
                                    )}
                                    {showLocation && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{formatField(log.locationName)}</span>
                                        </td>
                                    )}
                                    {showTechnician && (
                                        <td className="px-3 py-3 whitespace-nowrap"><span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(log.performedBy)}</span></td>
                                    )}
                                    <td className="px-3 py-3 whitespace-nowrap"><span className="text-xs text-slate-600 dark:text-slate-300">{log.actionType}</span></td>
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
                            {!isDataLoading && currentLogs.length === 0 && (
                                <tr>
                                    <td colSpan={99} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">🔧</span>
                                            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">No machine logs found</p>
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

            {/* Create Maintenance Log Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Create Maintenance Log</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Machine *</label>
                                <select
                                    value={createForm.rvmId}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, rvmId: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select a machine</option>
                                    {availableMachines.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} — {m.locationName || 'Unknown'}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action Type *</label>
                                <select
                                    value={createForm.actionType}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, actionType: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">Select action type</option>
                                    <option value="Routine Checkup">Routine Checkup</option>
                                    <option value="Sensor Error">Sensor Error</option>
                                    <option value="Bin Full">Bin Full</option>
                                    <option value="Bin Emptied">Bin Emptied</option>
                                    <option value="Hardware Repair">Hardware Repair</option>
                                    <option value="Software Update">Software Update</option>
                                    <option value="Cleaning">Cleaning</option>
                                    <option value="Calibration">Calibration</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                                <textarea
                                    value={createForm.notes}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    placeholder="Optional notes..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={createForm.resolved}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, resolved: e.target.checked }))}
                                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">Mark as resolved</span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateLog}
                                disabled={!createForm.rvmId || !createForm.actionType || isCreating}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                {isCreating ? 'Creating...' : 'Create Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function MachineLogsPage() {
    return (
        <RequirePermission category="logs">
            <MachineLogsPageContent />
        </RequirePermission>
    );
}
