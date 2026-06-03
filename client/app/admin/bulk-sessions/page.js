'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../src/components/admin/RequirePermission';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../src/context/AuthContext';
import { bulkSessions as bulkApi, machines as machinesApi, users as usersApi, settings as settingsApi } from '../../../src/services/api';
import { formatDate } from '../../../src/utils/formatDate';
import { formatField } from '../../../src/lib/formatField';
import { sessionStatusLabel } from '../../../src/lib/enumLabels';
import {
    Layers, Plus, X, Search, ChevronLeft, ChevronRight, RefreshCw,
    Package, Zap, Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, ChevronsUpDown, Trash2
} from 'lucide-react';

// Auto-calculate points from the org's points config (fetched from DB)
const getAutoPoints = (condition, volumeMl, config) => {
    if (!config || !volumeMl) return 0;
    const vol = parseInt(volumeMl) || 0;
    let sizeKey;
    if (vol <= 350) sizeKey = 'small';
    else if (vol <= 500) sizeKey = 'medium';
    else if (vol <= 1000) sizeKey = 'large';
    else return 0;
    const condKey = condition === 'With Label' ? 'WithLabel' : 'NoLabel';
    return parseInt(config[`${sizeKey}${condKey}`]) || 0;
};

function BulkSessionsPageContent() {
    const { currentUser, effectiveLocationId, isSuperAdmin } = useAuth();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // ── Modal state ──
    const [showModal, setShowModal] = useState(false);
    const [machines, setMachines] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [pointsConfig, setPointsConfig] = useState(null);
    const [selectedRvm, setSelectedRvm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState('');

    // ── Table state ──
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [sortColumn, setSortColumn] = useState('startTime');
    const [sortDirection, setSortDirection] = useState('desc');

    // ── Load sessions ──
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await bulkApi.getAll(effectiveLocationId);
                if (!cancelled) setSessions(data || []);
            } catch (err) { console.error('Failed to load bulk sessions:', err); }
            finally { if (!cancelled) setLoading(false); }
        };
        load();
        return () => { cancelled = true; };
    }, [effectiveLocationId, refreshKey]);

    // Default points config (matches seeder BOTTLE_PRICING)
    const DEFAULT_POINTS = {
        smallWithLabel: 5, smallNoLabel: 3,
        mediumWithLabel: 8, mediumNoLabel: 5,
        largeWithLabel: 10, largeNoLabel: 7,
    };

    // ── Load machines & users for modal ──
    const loadModalData = useCallback(async () => {
        try {
            const [m, u] = await Promise.all([
                machinesApi.getAll(effectiveLocationId),
                usersApi.getAll({ locationId: effectiveLocationId }),
            ]);
            setMachines(m || []);
            setAllUsers(u || []);

            // Points config is per-org — may fail for "All Locations" (no org), use defaults
            let pc = null;
            try {
                pc = await settingsApi.getPointsConfig(effectiveLocationId);
            } catch { /* falls back to defaults */ }
            setPointsConfig(pc || DEFAULT_POINTS);
        } catch (err) { console.error('Failed to load modal data:', err); }
    }, [effectiveLocationId]);

    const openModal = () => {
        setShowModal(true);
        setSelectedRvm('');
        setSelectedAccount('');
        setNotes('');
        setItems([{ itemType: 'PET Bottle', condition: 'With Label', volumeMl: '500', pointsAwarded: 0 }]);
        setModalError('');
        loadModalData();
    };

    // ── Items management ──
    const addItem = () => {
        const pts = getAutoPoints('With Label', '500', pointsConfig);
        setItems(prev => [...prev, { itemType: 'PET Bottle', condition: 'With Label', volumeMl: '500', pointsAwarded: pts }]);
    };

    // Recalculate all item points when pointsConfig arrives from API
    useEffect(() => {
        if (!pointsConfig || !showModal) return;
        setItems(prev => prev.map(item => ({
            ...item,
            pointsAwarded: getAutoPoints(item.condition, item.volumeMl, pointsConfig),
        })));
    }, [pointsConfig, showModal]);

    const updateItem = (idx, field, value) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== idx) return item;
            const updated = { ...item, [field]: value };
            // Auto-recalculate points when condition or volume changes
            if (field === 'condition' || field === 'volumeMl') {
                updated.pointsAwarded = getAutoPoints(updated.condition, updated.volumeMl, pointsConfig);
            }
            return updated;
        }));
    };

    const removeItem = (idx) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const totalPoints = useMemo(() => items.reduce((sum, i) => sum + (parseInt(i.pointsAwarded) || 0), 0), [items]);

    // ── Submit ──
    const handleSubmit = async () => {
        if (!selectedRvm) { setModalError('Please select a machine'); return; }
        if (!selectedAccount) { setModalError('Please select a user account'); return; }
        if (items.length === 0) { setModalError('Add at least one item'); return; }
        setSubmitting(true);
        setModalError('');
        try {
            await bulkApi.create({
                rvmId: parseInt(selectedRvm),
                accountId: parseInt(selectedAccount),
                notes,
                items: items.map(i => ({
                    itemType: i.itemType,
                    condition: i.condition,
                    volumeMl: parseInt(i.volumeMl) || 0,
                    pointsAwarded: parseInt(i.pointsAwarded) || 0,
                    brand: null,
                })),
            });
            setShowModal(false);
            setRefreshKey(k => k + 1);
        } catch (err) {
            setModalError(err.message || 'Failed to create session');
        }
        setSubmitting(false);
    };

    // ── Sorting ──
    const handleSort = (col) => {
        if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortColumn(col); setSortDirection('asc'); }
    };

    const SortIcon = ({ column }) => {
        if (sortColumn !== column) return <ChevronsUpDown size={12} className="text-slate-400" />;
        return sortDirection === 'asc' ? <ChevronUp size={12} className="text-emerald-500" /> : <ChevronDown size={12} className="text-emerald-500" />;
    };

    const hasActiveSort = sortColumn !== 'startTime' || sortDirection !== 'desc';
    const clearSort = () => { setSortColumn('startTime'); setSortDirection('desc'); setCurrentPage(1); };

    // ── Filtering & pagination ──
    const filtered = useMemo(() => {
        return sessions.filter(s => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (s.userName || '').toLowerCase().includes(q) ||
                (s.machineName || '').toLowerCase().includes(q) ||
                (s.notes || '').toLowerCase().includes(q) ||
                String(s.id).includes(q);
        }).sort((a, b) => {
            let aV = a[sortColumn], bV = b[sortColumn];
            if (typeof aV === 'string') { aV = aV.toLowerCase(); bV = (bV || '').toLowerCase(); }
            return sortDirection === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1);
        });
    }, [sessions, searchQuery, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const startIdx = (currentPage - 1) * rowsPerPage;
    const currentRows = filtered.slice(startIdx, startIdx + rowsPerPage);

    // ── Stats ──
    const stats = useMemo(() => ({
        total: sessions.length,
        totalItems: sessions.reduce((s, r) => s + (r.itemCount || 0), 0),
        totalPoints: sessions.reduce((s, r) => s + (r.totalPointsEarned || 0), 0),
    }), [sessions]);

    return (
        <>
            <ViewOnlyBanner />
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Bulk Sessions</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage bulk recycling sessions for manual or batch entry</p>
                    </div>
                    <button onClick={openModal} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors font-bold text-sm shadow-lg shadow-emerald-500/20">
                        <Plus size={18} /> New Bulk Session
                    </button>
                </div>
            </ViewOnlyWrapper>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20"><Layers size={24} className="text-blue-600 dark:text-blue-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Sessions</p><p className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</p></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20"><Package size={24} className="text-emerald-600 dark:text-emerald-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Items</p><p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalItems}</p></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20"><Zap size={24} className="text-amber-600 dark:text-amber-400" /></div>
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Total Points Awarded</p><p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.totalPoints.toLocaleString()}</p></div>
                    </div>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>All Bulk Sessions
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
                            <input type="text" placeholder="Search user, machine, notes..." value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" />
                        </div>
                        {hasActiveSort && (
                            <button onClick={clearSort} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 hover:bg-red-500/20 font-medium transition-colors dark:text-red-400 dark:border-red-500/30">
                                <X size={14} /> Clear Sort
                            </button>
                        )}
                        <button onClick={() => { setCurrentPage(1); setRefreshKey(k => k + 1); }} disabled={loading}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400 transition-colors disabled:opacity-50" title="Refresh">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-1">ID <SortIcon column="id" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('userName')}>
                                    <div className="flex items-center gap-1">User <SortIcon column="userName" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('machineName')}>
                                    <div className="flex items-center gap-1">Machine <SortIcon column="machineName" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('itemCount')}>
                                    <div className="flex items-center gap-1">Items <SortIcon column="itemCount" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('totalPointsEarned')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="totalPointsEarned" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('notes')}>
                                    <div className="flex items-center gap-1">Notes <SortIcon column="notes" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('startTime')}>
                                    <div className="flex items-center gap-1">Date <SortIcon column="startTime" /></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status <SortIcon column="status" /></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center">
                                    <RefreshCw size={24} className="animate-spin text-emerald-500 mx-auto" />
                                </td></tr>
                            ) : currentRows.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">No bulk sessions found</td></tr>
                            ) : currentRows.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-4 py-3"><span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{s.id}</span></td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className="text-sm font-medium text-slate-800 dark:text-white">{formatField(s.userName)}</span>
                                            {s.userEmail && <p className="text-xs text-slate-500 dark:text-slate-400">{s.userEmail}</p>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-xs text-slate-600 dark:text-slate-300">{formatField(s.machineName)}</span></td>
                                    <td className="px-4 py-3"><span className="font-bold text-slate-700 dark:text-slate-200">{s.itemCount}</span></td>
                                    <td className="px-4 py-3"><span className="font-bold text-emerald-600 dark:text-emerald-400">+{s.totalPointsEarned}</span></td>
                                    <td className="px-4 py-3"><span className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">{formatField(s.notes)}</span></td>
                                    <td className="px-4 py-3"><span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(s.startTime)}</span></td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">{sessionStatusLabel(s.status)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{filtered.length === 0 ? 0 : startIdx + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(startIdx + rowsPerPage, filtered.length)}</strong> of {filtered.length}</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronLeft size={14} /></button>
                            <span className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-medium">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ NEW BULK SESSION MODAL ═══ */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Layers size={20} className="text-emerald-600 dark:text-emerald-400" />
                                New Bulk Session
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {modalError && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={16} /> {modalError}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Machine (RVM) *</label>
                                    <CustomDropdown value={selectedRvm} onChange={setSelectedRvm} searchable showPlaceholder={false}
                                        options={machines.map(m => ({ value: String(m.id), label: m.name }))} placeholder="Select machine" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">User Account *</label>
                                    <CustomDropdown value={selectedAccount} onChange={setSelectedAccount} searchable showPlaceholder={false}
                                        options={allUsers.map(u => ({ value: String(u.accountId || u.id), label: `${u.name} (${u.email})` }))} placeholder="Select user" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={3}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 resize-none" />
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Items ({items.length})</label>
                                    <button onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                                        <Plus size={14} /> Add Item
                                    </button>
                                </div>
                                <div className="space-y-3 pr-1">
                                    {items.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 flex-wrap">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6">#{idx + 1}</span>
                                            <div className="flex-1 min-w-[120px]">
                                                <CustomDropdown value={item.condition} onChange={(v) => updateItem(idx, 'condition', v)}
                                                    options={['With Label', 'No Label']} showPlaceholder={false} />
                                            </div>
                                            <div className="w-[140px]">
                                                <CustomDropdown value={String(item.volumeMl)} onChange={(v) => updateItem(idx, 'volumeMl', v)}
                                                    options={[
                                                        { value: '350', label: '350ml (Small)' },
                                                        { value: '500', label: '500ml (Medium)' },
                                                        { value: '750', label: '750ml (Large)' },
                                                        { value: '1000', label: '1000ml (Large)' },
                                                    ]} showPlaceholder={false} />
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                                                <Zap size={12} className="text-emerald-600 dark:text-emerald-400" />
                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.pointsAwarded} pts</span>
                                            </div>
                                            {items.length > 1 && (
                                                <button onClick={() => removeItem(idx)} className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{items.length} items</span>
                                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">+{totalPoints} pts</span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 text-sm font-bold shadow-lg disabled:opacity-50">
                                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Create Session
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function BulkSessionsPage() {
    return (
        <RequirePermission category="sessions">
            <BulkSessionsPageContent />
        </RequirePermission>
    );
}
