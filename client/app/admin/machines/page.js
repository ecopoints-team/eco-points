'use client';
import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout, { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import CustomDropdown from '../../../src/Components/CustomDropdown';
import { useAuth } from '../../../src/context/AuthContext';
import { machines as machinesApi } from '../../../src/services/apiService';
import {
    Package, MapPin, Activity, Wifi, Settings, Eye, Wrench, X, Plus,
    AlertCircle, CheckCircle2, Clock, DollarSign, User, Calendar, Building2,
    ChevronLeft, ChevronRight, Search
} from 'lucide-react';

// Add Machine Modal
const AddMachineModal = ({ isOpen, onClose, onSubmit, locations }) => {
    const [formData, setFormData] = useState({
        name: '',
        locationId: '',
        locationName: '',
        maxCapacity: 100,
        isOnline: true
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Machine name is required';
        if (!formData.locationId) newErrors.locationId = 'Location is required';
        if (!formData.maxCapacity || formData.maxCapacity < 1) newErrors.maxCapacity = 'Must be at least 1';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const loc = locations.find(l => l.id === formData.locationId);
            onSubmit({
                ...formData,
                id: `RVM-${Date.now().toString().slice(-6)}`,
                machineUuid: `RVM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
                organizationName: loc ? loc.name : '',
                totalItemsCollected: 0,
                currentCapacity: 0,
                lastSync: 'Just now'
            });
            setFormData({ name: '', locationId: '', locationName: '', maxCapacity: 100, isOnline: true });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                            <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Machine</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Machine Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., RVM Alpha-02"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization (Location) *</label>
                        <CustomDropdown
                            value={formData.locationId}
                            onChange={(v) => setFormData({ ...formData, locationId: v })}
                            options={locations.map(l => ({ value: l.id, label: l.name }))}
                            placeholder="Select Location"
                            searchable
                            size="md"
                        />
                        {errors.locationId && <p className="text-red-500 text-xs mt-1">{errors.locationId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Area Placement</label>
                        <input
                            type="text"
                            value={formData.locationName}
                            onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                            placeholder="e.g., Main Gate, Canteen, Lobby"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Max Capacity</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.maxCapacity}
                                onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
                                placeholder="100"
                                className={`w-full px-4 py-2 rounded-lg border ${errors.maxCapacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            {errors.maxCapacity && <p className="text-red-500 text-xs mt-1">{errors.maxCapacity}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                            <CustomDropdown
                                value={formData.isOnline ? 'Online' : 'Offline'}
                                onChange={(v) => setFormData({ ...formData, isOnline: v === 'Online' })}
                                options={['Online', 'Offline']}
                                showPlaceholder={false}
                                size="md"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20">
                            Add Machine
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Status Badge with 2 status types
const StatusBadge = ({ status }) => {
    const statusConfig = {
        Online: {
            bg: 'bg-emerald-100 dark:bg-emerald-500/20',
            text: 'text-emerald-700 dark:text-emerald-400',
            icon: Wifi,
            label: 'Online'
        },
        Offline: {
            bg: 'bg-red-100 dark:bg-red-500/20',
            text: 'text-red-700 dark:text-red-400',
            icon: Wrench,
            label: 'Offline'
        }
    };

    const config = statusConfig[status] || statusConfig.Online;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
            <Icon size={12} />
            {status}
        </span>
    );
};



// Maintenance Log Modal
const MaintenanceModal = ({ machine, isOpen, onClose, onAddLog }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLog, setNewLog] = useState({
        technicianId: '',
        actionType: '',
        notes: '',
        resolved: false
    });
    const [logs, setLogs] = useState([]);
    const [technicians, setTechnicians] = useState([]);

    // Load maintenance logs and technicians from API when modal opens
    useEffect(() => {
        if (!isOpen || !machine) return;
        let cancelled = false;
        (async () => {
            try {
                const { logs: logsApi, users: usersApi } = await import('../../../src/services/apiService');
                const [logData, userData] = await Promise.all([
                    logsApi.getMachines(machine.locationId),
                    usersApi.getAll({ locationId: machine.locationId, role: 'technician' }),
                ]);
                if (cancelled) return;
                setLogs((logData || []).filter(l => l.rvmId === machine.id || String(l.rvmId) === String(machine.id)));
                setTechnicians((userData || []).filter(u => u.role === 'technician' && u.isActive));
            } catch (err) {
                console.error('Failed to load maintenance data:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [isOpen, machine]);

    if (!isOpen || !machine) return null;

    const handleSubmit = () => {
        if (!newLog.technicianId || !newLog.actionType) return;
        const tech = technicians.find(a => String(a.id) === String(newLog.technicianId));

        onAddLog(machine.id, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            technicianId: newLog.technicianId,
            technician: tech ? tech.name : 'Unknown',
            actionType: newLog.actionType,
            notes: newLog.notes || '',
            resolved: newLog.resolved
        });

        setNewLog({ technicianId: '', actionType: '', notes: '', resolved: false });
        setShowAddForm(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Wrench size={20} className="text-amber-500" />
                            Maintenance Logs
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {machine.name} ({machine.id})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{logs.length}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Logs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                            {logs.filter(l => l.resolved).length}/{logs.length}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Resolved</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[40vh]">
                    {/* Add New Log Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mb-4 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 
                                text-slate-500 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 
                                dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Add New Maintenance Log
                        </button>
                    )}

                    {/* Add Log Form */}
                    {showAddForm && (
                        <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">New Maintenance Entry</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Technician *
                                    </label>
                                    <CustomDropdown
                                        value={newLog.technicianId}
                                        onChange={(v) => setNewLog(p => ({ ...p, technicianId: v }))}
                                        options={technicians.map(t => ({ value: t.id, label: t.name }))}
                                        placeholder="Select technician..."
                                        searchable
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Action Description *
                                </label>
                                <input
                                    type="text"
                                    value={newLog.actionType}
                                    onChange={(e) => setNewLog(p => ({ ...p, actionType: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 
                                        bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm outline-none
                                        focus:border-emerald-500 dark:focus:border-emerald-500"
                                    placeholder="e.g., Sensor Replacement"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Notes
                                </label>
                                <textarea
                                    value={newLog.notes}
                                    onChange={(e) => setNewLog(p => ({ ...p, notes: e.target.value }))}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 
                                        bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm outline-none
                                        focus:border-emerald-500 dark:focus:border-emerald-500 resize-none"
                                    placeholder="Additional notes..."
                                />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newLog.resolved}
                                        onChange={(e) => setNewLog(p => ({ ...p, resolved: e.target.checked }))}
                                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Issue Resolved</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 
                                        hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white 
                                        hover:bg-emerald-500 transition-colors"
                                >
                                    Save Entry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Log List */}
                    <div className="space-y-3">
                        {logs.map(log => (
                            <div
                                key={log.id}
                                className={`p-4 rounded-xl border transition-colors ${log.resolved
                                    ? 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="text-sm font-medium text-slate-800 dark:text-white">{log.timestamp}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${log.resolved
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                        }`}>
                                        {log.resolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {log.resolved ? 'Resolved' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{log.actionType}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <User size={12} />
                                        {log.technician}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="w-full py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 
                            hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Machine Card Component
const MachineCard = ({ machine, onOpenMaintenance, onViewDetails, locationName, currentUser, hasPermission }) => (
    <div className={`bg-white dark:bg-slate-800/50 rounded-2xl border p-6 shadow-lg hover:shadow-xl transition-all duration-300 group ${!machine.isOnline
        ? 'border-red-300 dark:border-red-500/30'
        : 'border-slate-200 dark:border-slate-700'
        }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${!machine.isOnline
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{machine.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{machine.id}</p>
                </div>
            </div>
            <StatusBadge status={machine.isOnline ? 'Online' : 'Offline'} />
        </div>

        {/* Location Tag */}
        {locationName && (
            <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 mb-2">
                <Building2 size={12} />
                <span className="font-medium">{locationName}</span>
            </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <MapPin size={14} className="text-slate-400" />
            {machine.locationName || 'Unassigned'}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Items Collected</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{machine.totalItemsCollected.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Capacity</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{machine.currentCapacity || 0}<span className="text-xs font-medium text-slate-400">/{machine.maxCapacity || 100}</span></p>
            </div>
        </div>



        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => onViewDetails(machine)} className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium
                bg-slate-100 text-slate-600 hover:bg-slate-200
                dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                <Eye size={16} />
                View Details
            </button>
            {hasPermission('machines', 'edit') && (
                <button
                    onClick={() => onOpenMaintenance(machine)}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium
                    bg-blue-100 text-blue-700 hover:bg-blue-200
                    dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30 transition-colors"
                >
                    <Wrench size={16} />
                    Maintenance
                </button>
            )}
            <button onClick={() => onViewDetails(machine)} className="flex items-center justify-center p-2 rounded-lg
                bg-slate-100 text-slate-600 hover:bg-slate-200
                dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Machine Settings">
                <Settings size={16} />
            </button>
        </div>
    </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function MachinesPage() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, currentUser, hasPermission } = useAuth();

    const [machines, setMachines] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 9;

    // Load machines from API when location changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await machinesApi.getAll(effectiveLocationId);
                if (!cancelled) setMachines((data || []).map(m => ({ ...m, id: String(m.id) })));
            } catch (err) { console.error('Failed to load machines:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        setSearchQuery('');
        setCurrentPage(1);
    }, [effectiveLocationId]);

    // Filter machines by search
    const displayedMachines = useMemo(() => {
        if (!searchQuery) return machines;
        const q = searchQuery.toLowerCase();
        return machines.filter(m =>
            m.name.toLowerCase().includes(q) ||
            (m.locationName || '').toLowerCase().includes(q) ||
            getLocationName(m.locationId).toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q)
        );
    }, [machines, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(displayedMachines.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const currentMachines = displayedMachines.slice(startIndex, startIndex + cardsPerPage);

    const onlineCount = machines.filter(m => m.isOnline).length;
    const offlineCount = machines.filter(m => !m.isOnline).length;
    const totalItems = machines.reduce((sum, m) => sum + m.totalItemsCollected, 0);

    const handleOpenMaintenance = (machine) => {
        setSelectedMachine(machine);
        setShowMaintenanceModal(true);
    };

    const handleViewDetails = (machine) => {
        setSelectedMachine(machine);
    };

    const handleAddMaintenanceLog = (machineId, newLog) => {
        // TODO: Call maintenance log API to persist the new maintenance log
        // For now just refresh the selected machine to show new log
        setSelectedMachine(prev => prev ? { ...prev } : null);
    };

    // Add machine handler
    const handleAddMachine = async (newMachine) => {
        try {
            const created = await machinesApi.create(newMachine);
            setMachines([{ ...created, id: String(created.id) }, ...machines]);
        } catch (err) {
            console.error('Failed to add machine:', err);
        }
    };

    // Get location name for a machine
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : '';
    };

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header */}
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                                Machines (RVM)
                            </h1>
                            {currentLocation && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                    {currentLocation.name}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">
                            {isSuperAdmin && !effectiveLocationId
                                ? 'Viewing all machines across all locations'
                                : `Manage and monitor machines at ${currentLocation?.name || 'your location'} `}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search machines..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all w-64"
                            />
                        </div>
                        {(isSuperAdmin || hasPermission('machines', 'create')) && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Machine</span>
                            </button>
                        )}
                    </div>
                </div>
            </ViewOnlyWrapper>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Wifi size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Online</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{onlineCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20">
                            <Wrench size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Offline</p>
                            <p className="text-2xl font-black text-red-600 dark:text-red-400">{offlineCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Package size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Items Collected</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalItems.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Machine Cards Grid */}
            {machines.length > 0 ? (
                <>
                    {/* Top Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mb-6">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                        {currentMachines.map((machine) => (
                            <MachineCard
                                key={machine.id}
                                machine={machine}
                                onOpenMaintenance={handleOpenMaintenance}
                                onViewDetails={handleViewDetails}
                                locationName={isSuperAdmin && !effectiveLocationId ? getLocationName(machine.locationId) : null}
                                currentUser={currentUser}
                                hasPermission={hasPermission}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border disabled:opacity-50 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No machines found for this location.</p>
                </div>
            )}

            {/* Maintenance Modal */}
            <MaintenanceModal
                machine={selectedMachine}
                isOpen={showMaintenanceModal}
                onClose={() => {
                    setShowMaintenanceModal(false);
                    setSelectedMachine(null);
                }}
                onAddLog={handleAddMaintenanceLog}
            />

            {/* Add Machine Modal */}
            <AddMachineModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddMachine}
                locations={allLocations}
            />
        </>
    );
}
