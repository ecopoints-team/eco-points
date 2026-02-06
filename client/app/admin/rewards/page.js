'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { useAuth } from '../../../src/context/AuthContext';
import { REWARDS, getRewardsByLocation } from '../../../src/data/mockData';
import {
    Search, Filter, ChevronLeft, ChevronRight, Gift, Package, Plus, Edit2, Trash2, X,
    Upload, Image, AlertTriangle, Minus, ShoppingBag, Building2, ChevronsUpDown, ChevronUp, ChevronDown
} from 'lucide-react';

// Low stock threshold
const LOW_STOCK_THRESHOLD = 10;

// ============================================================================
// COMPONENTS
// ============================================================================

// Stock Status Badge
const StockBadge = ({ stock }) => {
    if (stock === 0) {
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                Out of Stock
            </span>
        );
    }
    if (stock < LOW_STOCK_THRESHOLD) {
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                Low Stock
            </span>
        );
    }
    return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            Available
        </span>
    );
};

// Low Stock Warning Tooltip
const LowStockWarning = ({ stock }) => {
    if (stock >= LOW_STOCK_THRESHOLD) return null;

    return (
        <div className="relative group inline-flex ml-2">
            <AlertTriangle
                size={16}
                className={`${stock === 0 ? 'text-red-500' : 'text-amber-500'} animate-pulse`}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {stock === 0 ? 'Out of Stock: Reorder Immediately!' : 'Low Stock: Reorder Soon'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-800 rotate-45"></div>
            </div>
        </div>
    );
};

// Category Badge
const CategoryBadge = ({ category }) => {
    const colors = {
        'Merchandise': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        'Vouchers': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
        'Experience': 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400'
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[category] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
            {category}
        </span>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function RewardsInventoryPage() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations } = useAuth();

    // Get initial rewards based on location
    const getInitialRewards = () => getRewardsByLocation(effectiveLocationId);

    const [rewards, setRewards] = useState(getInitialRewards);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [sortOrder, setSortOrder] = useState('Newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showModal, setShowModal] = useState(false);
    const [deletingReward, setDeletingReward] = useState(null);
    const [editingReward, setEditingReward] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pointsCost: '',
        stock: '',
        category: 'Merchandise',
        image: null,
        sku: ''
    });
    const fileInputRef = useRef(null);

    // Update rewards when location changes
    useEffect(() => {
        setRewards(getRewardsByLocation(effectiveLocationId));
        setCurrentPage(1);
    }, [effectiveLocationId]);

    const categories = [...new Set(rewards.map(r => r.category))];

    // Derived status based on stock
    const getStatus = (stock) => {
        if (stock === 0) return 'Out of Stock';
        if (stock < LOW_STOCK_THRESHOLD) return 'Low Stock';
        return 'Available';
    };

    const filteredRewards = useMemo(() => {
        let result = rewards.filter(r => {
            const matchesSearch = searchQuery === '' ||
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.sku.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === '' || r.category === filterCategory;
            const status = getStatus(r.stock);
            const matchesStatus = filterStatus === '' || status === filterStatus;
            const matchesLocation = filterLocation === '' || r.locationId === filterLocation;
            return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
        });

        // Sort by column
        if (sortColumn) {
            result = [...result].sort((a, b) => {
                let valA, valB;
                switch (sortColumn) {
                    case 'name': valA = a.name; valB = b.name; break;
                    case 'pointsCost': valA = a.pointsCost; valB = b.pointsCost; break;
                    case 'stock': valA = a.stock; valB = b.stock; break;
                    case 'category': valA = a.category; valB = b.category; break;
                    default: return 0;
                }
                if (typeof valA === 'string') {
                    return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                return sortDirection === 'asc' ? valA - valB : valB - valA;
            });
        }

        return result;
    }, [rewards, searchQuery, filterCategory, filterStatus, filterLocation, sortColumn, sortDirection]);

    const totalPages = Math.ceil(filteredRewards.length / rowsPerPage);
    const currentRewards = filteredRewards.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const hasActiveFilters = filterCategory || filterStatus || filterLocation || sortColumn;
    const clearFilters = () => { setFilterCategory(''); setFilterStatus(''); setFilterLocation(''); setSortColumn(''); setSearchQuery(''); setCurrentPage(1); };

    // Sort handler
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

    // Stats
    const totalStock = rewards.reduce((s, r) => s + r.stock, 0);
    const lowStockCount = rewards.filter(r => r.stock > 0 && r.stock < LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = rewards.filter(r => r.stock === 0).length;
    const totalDispensed = rewards.reduce((s, r) => s + r.dispensed, 0);

    // Get location name
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : '';
    };

    // Modal handlers
    const openAddModal = () => {
        setEditingReward(null);
        setFormData({ name: '', description: '', pointsCost: '', stock: '', category: 'Merchandise', image: null, sku: '' });
        setShowModal(true);
    };

    const openEditModal = (r) => {
        setEditingReward(r);
        setFormData({
            name: r.name,
            description: r.description,
            pointsCost: r.pointsCost.toString(),
            stock: r.stock.toString(),
            category: r.category,
            image: r.image || null,
            sku: r.sku
        });
        setShowModal(true);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, image: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!formData.name || !formData.pointsCost || !formData.stock || !formData.sku || !formData.category) return;
        const stock = parseInt(formData.stock);

        if (editingReward) {
            setRewards(prev => prev.map(r => r.id === editingReward.id ? {
                ...r,
                ...formData,
                pointsCost: parseInt(formData.pointsCost),
                stock
            } : r));
        } else {
            const newId = `RWD-${effectiveLocationId ? effectiveLocationId.split('-')[1] : 'X'}-${String(rewards.length + 1).padStart(3, '0')}`;
            setRewards(prev => [{
                id: newId,
                ...formData,
                pointsCost: parseInt(formData.pointsCost),
                stock,
                dispensed: 0,
                locationId: effectiveLocationId || 'LOC-001'
            }, ...prev]);
        }
        setShowModal(false);
    };

    // Dispense handler
    const handleDispense = (rewardId) => {
        setRewards(prev => prev.map(r => {
            if (r.id === rewardId && r.stock > 0) {
                return {
                    ...r,
                    stock: r.stock - 1,
                    dispensed: r.dispensed + 1
                };
            }
            return r;
        }));
    };

    // Quick stock adjustment
    const adjustStock = (rewardId, amount) => {
        setRewards(prev => prev.map(r => {
            if (r.id === rewardId) {
                const newStock = Math.max(0, r.stock + amount);
                return { ...r, stock: newStock };
            }
            return r;
        }));
    };

    return (
        <>
            {/* Page Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Rewards Inventory</h1>
                        {currentLocation && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                {currentLocation.name}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isSuperAdmin && !effectiveLocationId
                            ? 'Viewing rewards across all locations'
                            : `Manage reward items and stock at ${currentLocation?.name || 'your location'}`}
                    </p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Add Reward
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Gift size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Rewards</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{rewards.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Package size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Stock</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalStock}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock Items</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <ShoppingBag size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Dispensed</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalDispensed.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Banner */}
            {(lowStockCount > 0 || outOfStockCount > 0) && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 flex items-center gap-3">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0" size={20} />
                    <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300">Inventory Alert</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            {outOfStockCount > 0 && <span className="font-semibold">{outOfStockCount} item(s) out of stock. </span>}
                            {lowStockCount > 0 && <span>{lowStockCount} item(s) running low on stock.</span>}
                        </p>
                    </div>
                </div>
            )}

            {/* Table Card */}
            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                {/* Table Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full dark:shadow-[0_0_10px_#10b981]"></span>
                        All Rewards
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 focus:border-emerald-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFilter ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4">
                        <select
                            value={filterCategory}
                            onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        >
                            <option value="">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>

                        {/* Location Filter */}
                        {isSuperAdmin && !effectiveLocationId && (
                            <select
                                value={filterLocation}
                                onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                            >
                                <option value="">All Locations</option>
                                {allLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        )}

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors dark:border-red-500/30 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10">
                                <X size={14} /> Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Image</th>
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Reward <SortIcon column="name" /></div>
                                </th>
                                {isSuperAdmin && !effectiveLocationId && <th className="px-6 py-4">Location</th>}
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1">Category <SortIcon column="category" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('pointsCost')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="pointsCost" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('stock')}>
                                    <div className="flex items-center gap-1">Stock <SortIcon column="stock" /></div>
                                </th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentRewards.map((r) => {
                                const isLowStock = r.stock < LOW_STOCK_THRESHOLD;
                                const isOutOfStock = r.stock === 0;

                                return (
                                    <tr
                                        key={r.id}
                                        className={`hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors ${isOutOfStock
                                            ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500'
                                            : isLowStock
                                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-l-amber-500'
                                                : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                                {r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-slate-400" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{r.description}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">SKU: {r.sku}</p>
                                        </td>
                                        {isSuperAdmin && !effectiveLocationId && (
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                    <Building2 size={12} />
                                                    {getLocationName(r.locationId)}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <CategoryBadge category={r.category} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.pointsCost} pts</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className={`font-semibold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {r.stock}
                                                </span>
                                                <LowStockWarning stock={r.stock} />
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <button
                                                    onClick={() => adjustStock(r.id, 1)}
                                                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StockBadge stock={r.stock} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDispense(r.id)}
                                                    disabled={r.stock === 0}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${r.stock === 0
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500/30'
                                                        }`}
                                                >
                                                    <ShoppingBag size={14} />
                                                    Dispense
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(r)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingReward(r)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {currentRewards.length === 0 && (
                    <div className="p-12 text-center">
                        <Gift size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No rewards found for this location.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{(currentPage - 1) * rowsPerPage + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(currentPage * rowsPerPage, filteredRewards.length)}</strong> of {filteredRewards.length} rewards</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 outline-none cursor-pointer">
                                <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                            </select>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50 bg-white dark:bg-slate-800 dark:border-slate-700">
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === p ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 rounded-lg border disabled:opacity-50 bg-white dark:bg-slate-800 dark:border-slate-700">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingReward ? 'Edit Reward' : 'Add Reward'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                        {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Image size={32} className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                            <Upload size={16} />
                                            Upload
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Keeping Unit (SKU) *</label>
                                    <input type="text" value={formData.sku} onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" placeholder="Item Name (SKU-123)" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 h-20 resize-none outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points Cost *</label>
                                    <input type="number" value={formData.pointsCost} onChange={(e) => setFormData(p => ({ ...p, pointsCost: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock *</label>
                                    <input type="number" value={formData.stock} onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                <input
                                    list="category-list"
                                    value={formData.category}
                                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                                    placeholder="Select or type a category..."
                                />
                                <datalist id="category-list">
                                    <option value="Merchandise" />
                                    <option value="Vouchers" />
                                    <option value="Experience" />
                                    {categories.filter(c => !['Merchandise', 'Vouchers', 'Experience'].includes(c)).map(c => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                            <button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold">{editingReward ? 'Save Changes' : 'Add Reward'}</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deletingReward && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-scale-in">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete Reward?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Are you sure you want to delete <strong>{deletingReward.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingReward(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setRewards(prev => prev.filter(x => x.id !== deletingReward.id));
                                    setDeletingReward(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/25 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
