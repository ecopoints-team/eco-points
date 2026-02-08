'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout, { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import { useAuth } from '../../../src/context/AuthContext';
import { MACHINES, LOCATIONS, AREAS, getMachinesByLocation, BOTTLE_LOGS } from '../../../src/data/mockData';
import {
    Package, MapPin, Activity, Wifi, Settings, Eye, Wrench, X, Plus,
    AlertCircle, CheckCircle2, Clock, DollarSign, User, Calendar, Building2,
    ChevronLeft, ChevronRight, Search
} from 'lucide-react';

// Add Machine Modal
const AddMachineModal = ({ isOpen, onClose, onSubmit, locations, areas }) => {
    const [formData, setFormData] = useState({
        name: '',
        locationId: '',
        areaId: '',
        location: '',
        status: 'Online'
    });
    const [errors, setErrors] = useState({});

    const filteredAreas = useMemo(() => {
        if (!formData.locationId) return [];
        return areas.filter(a => a.locationId === formData.locationId);
    }, [formData.locationId, areas]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Machine name is required';
        if (!formData.locationId) newErrors.locationId = 'Location is required';
        if (!formData.location.trim()) newErrors.location = 'Specific location is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                ...formData,
                id: `RVM-${Date.now().toString().slice(-6)}`,
                bottlesCollected: 0,
                lastSync: 'Just now',
                maintenanceLogs: []
            });
            setFormData({ name: '', locationId: '', areaId: '', location: '', status: 'Online' });
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Campus/Location *</label>
                        <select
                            value={formData.locationId}
                            onChange={(e) => setFormData({ ...formData, locationId: e.target.value, areaId: '' })}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.locationId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        >
                            <option value="">Select Location</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                        {errors.locationId && <p className="text-red-500 text-xs mt-1">{errors.locationId}</p>}
                    </div>
                    {filteredAreas.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Area (Optional)</label>
                            <select
                                value={formData.areaId}
                                onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Select Area</option>
                                {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Specific Location *</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., Building A, Floor 2"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="Online">Online</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
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

// Status Badge with 3 status types
const StatusBadge = ({ status }) => {
    const statusConfig = {
        Online: {
            bg: 'bg-emerald-100 dark:bg-emerald-500/20',
            text: 'text-emerald-700 dark:text-emerald-400',
            icon: Wifi,
            label: 'Online'
        },
        Full: {
            bg: 'bg-amber-100 dark:bg-amber-500/20',
            text: 'text-amber-700 dark:text-amber-400',
            icon: AlertCircle,
            label: 'Full - Needs Emptying'
        },
        Maintenance: {
            bg: 'bg-red-100 dark:bg-red-500/20',
            text: 'text-red-700 dark:text-red-400',
            icon: Wrench,
            label: 'Maintenance'
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
        technician: '',
        issue: '',
        cost: '',
        resolved: false
    });

    if (!isOpen || !machine) return null;

    const handleSubmit = () => {
        if (!newLog.technician || !newLog.issue) return;

        onAddLog(machine.id, {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            technician: newLog.technician,
            issue: newLog.issue,
            cost: parseFloat(newLog.cost) || 0,
            resolved: newLog.resolved
        });

        setNewLog({ technician: '', issue: '', cost: '', resolved: false });
        setShowAddForm(false);
    };

    const totalCost = machine.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

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
                <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{machine.maintenanceLogs.length}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Logs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₱{totalCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Cost</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                            {machine.maintenanceLogs.filter(l => l.resolved).length}/{machine.maintenanceLogs.length}
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
                                        Technician Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newLog.technician}
                                        onChange={(e) => setNewLog(p => ({ ...p, technician: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 
                                            bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm outline-none
                                            focus:border-emerald-500 dark:focus:border-emerald-500"
                                        placeholder="e.g., John Smith"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Cost (₱)
                                    </label>
                                    <input
                                        type="number"
                                        value={newLog.cost}
                                        onChange={(e) => setNewLog(p => ({ ...p, cost: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 
                                            bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm outline-none
                                            focus:border-emerald-500 dark:focus:border-emerald-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Issue Description *
                                </label>
                                <input
                                    type="text"
                                    value={newLog.issue}
                                    onChange={(e) => setNewLog(p => ({ ...p, issue: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 
                                        bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm outline-none
                                        focus:border-emerald-500 dark:focus:border-emerald-500"
                                    placeholder="e.g., Sensor Replacement"
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
                        {machine.maintenanceLogs.map(log => (
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
                                        <span className="text-sm font-medium text-slate-800 dark:text-white">{log.date}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${log.resolved
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                        }`}>
                                        {log.resolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {log.resolved ? 'Resolved' : 'Pending'}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{log.issue}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <User size={12} />
                                        {log.technician}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DollarSign size={12} />
                                        ₱{log.cost.toLocaleString()}
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
    <div className={`bg-white dark:bg-slate-800/50 rounded-2xl border p-6 shadow-lg hover:shadow-xl transition-all duration-300 group ${machine.status === 'Maintenance'
        ? 'border-red-300 dark:border-red-500/30'
        : machine.status === 'Full'
            ? 'border-amber-300 dark:border-amber-500/30'
            : 'border-slate-200 dark:border-slate-700'
        }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${machine.status === 'Maintenance'
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : machine.status === 'Full'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{machine.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{machine.id}</p>
                </div>
            </div>
            <StatusBadge status={machine.status} />
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
            {machine.location}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bottles Collected</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{machine.bottlesCollected.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Points</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{(BOTTLE_LOGS.filter(log => log.machineId === machine.id).reduce((sum, log) => sum + (log.pointsAwarded || 0), 0)).toLocaleString()}</p>
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

    // Filter machines by location
    const filteredMachines = useMemo(() => {
        return getMachinesByLocation(effectiveLocationId);
    }, [effectiveLocationId]);

    const [machines, setMachines] = useState(filteredMachines);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 9;

    // Update machines when location changes
    React.useEffect(() => {
        setMachines(getMachinesByLocation(effectiveLocationId));
        setSearchQuery('');
        setCurrentPage(1);
    }, [effectiveLocationId]);

    // Filter machines by search
    const displayedMachines = useMemo(() => {
        if (!searchQuery) return machines;
        const q = searchQuery.toLowerCase();
        return machines.filter(m =>
            m.name.toLowerCase().includes(q) ||
            m.location.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            m.status.toLowerCase().includes(q)
        );
    }, [machines, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(displayedMachines.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const currentMachines = displayedMachines.slice(startIndex, startIndex + cardsPerPage);

    const onlineCount = machines.filter(m => m.status === 'Online').length;
    const fullCount = machines.filter(m => m.status === 'Full').length;
    const maintenanceCount = machines.filter(m => m.status === 'Maintenance').length;
    const totalBottles = machines.reduce((sum, m) => sum + m.bottlesCollected, 0);

    const handleOpenMaintenance = (machine) => {
        setSelectedMachine(machine);
        setShowMaintenanceModal(true);
    };

    const handleViewDetails = (machine) => {
        setSelectedMachine(machine);
    };

    const handleAddMaintenanceLog = (machineId, newLog) => {
        setMachines(prev => prev.map(m => {
            if (m.id === machineId) {
                return {
                    ...m,
                    maintenanceLogs: [newLog, ...m.maintenanceLogs]
                };
            }
            return m;
        }));
        setSelectedMachine(prev => prev ? {
            ...prev,
            maintenanceLogs: [newLog, ...prev.maintenanceLogs]
        } : null);
    };

    // Add machine handler
    const handleAddMachine = (newMachine) => {
        setMachines([newMachine, ...machines]);
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
                                : `Manage and monitor machines at ${currentLocation?.name || 'your location'}`}
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
                                Add Machine
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
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <AlertCircle size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Full (Needs Emptying)</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{fullCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20">
                            <Wrench size={24} className="text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400"> Under Maintenance</p>
                            <p className="text-2xl font-black text-red-600 dark:text-red-400">{maintenanceCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Package size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Bottles</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalBottles.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Machine Cards Grid */}
            {machines.length > 0 ? (
                <>
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
                areas={AREAS}
            />
        </>
    );
}
