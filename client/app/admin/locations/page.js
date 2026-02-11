'use client';
import React, { useState, useMemo } from 'react';
import AdminLayout, { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import { useAuth } from '../../../src/context/AuthContext';
import { LOCATIONS, BOTTLE_LOGS, USERS, getUsersByLocation, CITIES, getCityName } from '../../../src/data/mockData';
import {
    Building2, MapPin, Users, Package, Leaf, TrendingUp,
    Calendar, Phone, Mail, Edit2, Eye, Trophy, Plus, Search,
    ChevronLeft, ChevronRight, X, Coins, User
} from 'lucide-react';

// ============================================================================
// ADD LOCATION MODAL
// ============================================================================
function AddLocationModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        fullName: '',
        cityId: '',
        streetAddress: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        status: 'Active'
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Short name is required';
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        if (!formData.cityId) newErrors.cityId = 'City is required';
        if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
        if (!formData.contactEmail.trim()) {
            newErrors.contactEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
            newErrors.contactEmail = 'Invalid email format';
        }
        if (!formData.contactPhone.trim()) {
            newErrors.contactPhone = 'Phone is required';
        } else if (!/^[\d\s\-+()]+$/.test(formData.contactPhone)) {
            newErrors.contactPhone = 'Invalid phone format';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                ...formData,
                id: `LOC-${Date.now()}`,
                joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                machineCount: 0,
                userCount: 0,
                totalBottlesCollected: 0,
                totalPoints: 0,
                ranking: LOCATIONS.length + 1
            });
            setFormData({ name: '', fullName: '', cityId: '', streetAddress: '', contactPerson: '', contactEmail: '', contactPhone: '', status: 'Active' });
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
                            <Building2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Add New Location</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., AU-Pasig"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="e.g., Arellano University - Pasig Campus"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City *</label>
                        <select
                            value={formData.cityId}
                            onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.cityId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer`}
                        >
                            <option value="">Select city...</option>
                            {CITIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.cityId && <p className="text-red-500 text-xs mt-1">{errors.cityId}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address *</label>
                        <input
                            type="text"
                            value={formData.streetAddress}
                            onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                            placeholder="Full street address"
                            className={`w-full px-4 py-2 rounded-lg border ${errors.streetAddress ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                placeholder="e.g., Admin Officer"
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.contactPerson ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                        </div>
                        {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                placeholder="contact@example.edu"
                                className={`w-full px-4 py-2 rounded-lg border ${errors.contactEmail ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                placeholder="+63 XXX XXXX"
                                className={`w-full px-4 py-2 rounded-lg border ${errors.contactPhone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`}
                            />
                            {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20">
                            Add Location
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================================
// LOCATIONS MANAGEMENT PAGE (Super Admin Only)
// ============================================================================
export default function LocationsPage() {
    const { isSuperAdmin, setViewAsLocation } = useAuth();
    const [locations, setLocations] = useState(LOCATIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const cardsPerPage = 9;

    // Filter locations by search
    const filteredLocations = useMemo(() => {
        if (!searchQuery) return locations;
        return locations.filter(loc =>
            loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            loc.streetAddress.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [locations, searchQuery]);

    // User count by location
    const userCountByLocation = useMemo(() => {
        return USERS.reduce((acc, user) => {
            acc[user.locationId] = (acc[user.locationId] || 0) + 1;
            return acc;
        }, {});
    }, []);

    // Pagination
    const totalPages = Math.ceil(filteredLocations.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const currentLocations = filteredLocations.slice(startIndex, startIndex + cardsPerPage);

    // Calculate totals
    const totalMachines = locations.reduce((sum, loc) => sum + loc.machineCount, 0);
    const totalBottles = locations.reduce((sum, loc) => sum + loc.totalBottlesCollected, 0);
    const totalPoints = BOTTLE_LOGS.reduce((sum, log) => sum + (log.pointsAwarded || 0), 0);

    // Add location handler
    const handleAddLocation = (newLocation) => {
        setLocations([...locations, newLocation]);
    };

    // Redirect or show access denied if not Super Admin
    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <Building2 size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400">Only Super Admins can access the Locations page.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header with Add Button */}
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                            Location Management
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage all deployment sites and their resources
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <Plus size={18} />
                        Add Location
                    </button>
                </div>
            </ViewOnlyWrapper>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Building2 size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Locations</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{locations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Package size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Machines</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalMachines}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <Leaf size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Bottles</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalBottles.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Coins size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Points</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {currentLocations.length} of {filteredLocations.length} locations
                </span>
            </div>

            {/* Locations Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {currentLocations.map((location, index) => {
                    const globalIndex = locations.findIndex(l => l.id === location.id);
                    return (
                        <div
                            key={location.id}
                            className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${globalIndex === 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        {globalIndex === 0 ? (
                                            <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
                                        ) : (
                                            <Building2 size={24} className="text-slate-600 dark:text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{location.name}</h3>
                                            {globalIndex === 0 && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                                    #1
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{location.fullName}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${location.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                    {location.status}
                                </span>
                            </div>

                            {/* Location Details */}
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{location.streetAddress}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Calendar size={14} className="text-slate-400" />
                                    Joined: {location.joinDate}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Users</p>
                                    <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                                        {userCountByLocation[location.id] || 0}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Machines</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{location.machineCount}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Total Points</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{(BOTTLE_LOGS.filter(log => log.locationId === location.id).reduce((sum, log) => sum + (log.pointsAwarded || 0), 0)).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Bottles</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{(location.totalBottlesCollected / 1000).toFixed(1)}k</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewAsLocation(location.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium
                                        bg-emerald-100 text-emerald-700 hover:bg-emerald-200
                                        dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 transition-colors"
                                >
                                    <Eye size={14} />
                                    View As
                                </button>
                                <button
                                    onClick={() => alert(`Edit location: ${location.name}\n\nThis feature will allow editing location details such as name, address, and contact information.`)}
                                    className="flex items-center justify-center p-2 rounded-lg
                                    bg-slate-100 text-slate-600 hover:bg-slate-200
                                    dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    title="Edit Location">
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
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

            {/* Add Location Modal */}
            <AddLocationModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddLocation}
            />
        </>
    );
}
