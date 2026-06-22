'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../src/components/admin/RequirePermission';
import { SkeletonTableRow, SkeletonCard } from '../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import PageSizeSelector from '../../../src/components/admin/PageSizeSelector';
import { useAuth } from '../../../src/context/AuthContext';
import { useProgress } from '../../../src/context/ProgressContext';
import { rewards as rewardsApi, rewardCategories as categoriesApi } from '../../../src/services/api';
import RewardVariantEditor from '../../../src/components/admin/RewardVariantEditor';
import { formatField } from '../../../src/lib/formatField';
import { validateAll, VALIDATION_RULES } from '../../../src/lib/validateField';
import {
    Search, Filter, ChevronLeft, ChevronRight, Gift, Package, Plus, Edit2, Trash2, X,
    Upload, Image, AlertTriangle, ShoppingBag, Building2, ChevronsUpDown, ChevronUp, ChevronDown, Share2, Check
} from 'lucide-react';

// Low stock threshold
const LOW_STOCK_THRESHOLD = 10;

// Predefined category options
const DEFAULT_CATEGORIES = ['Merchandise', 'Vouchers', 'Experience', 'Sustainable Product', 'School Supply'];

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

// Searchable Category Field — API-backed CRUD with edit/delete
const CategorySearchField = ({ value, onChange, existingCategories }) => {
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [apiCategories, setApiCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [catError, setCatError] = useState('');
    const ref = useRef(null);

    // Load categories from API
    useEffect(() => {
        categoriesApi.getAll()
            .then(cats => setApiCategories(cats || []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setShowDropdown(false);
                setShowAddCategory(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Merge API categories with existing (from rewards data), deduplicated
    const allCatNames = [...new Set([...apiCategories.map(c => c.name), ...existingCategories])];
    const filtered = allCatNames.filter(c => c.toLowerCase().includes((showDropdown ? search : '').toLowerCase()));

    const handleAddCategory = async () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        setIsAdding(true);
        setCatError('');
        try {
            const created = await categoriesApi.create(trimmed);
            setApiCategories(prev => [...prev, created]);
            onChange(trimmed);
            setNewCategoryName('');
            setShowAddCategory(false);
            setShowDropdown(false);
        } catch (err) {
            setCatError(err?.message || 'Failed to create category');
        } finally {
            setIsAdding(false);
        }
    };

    const handleEditCategory = async (id) => {
        const name = editingName.trim();
        if (!name) return;
        setCatError('');
        try {
            const updated = await categoriesApi.update(id, name);
            setApiCategories(prev => prev.map(c => c.id === id ? { ...c, name: updated.name } : c));
            if (value === editingName) onChange(updated.name);
            setEditingId(null);
            setEditingName('');
        } catch (err) {
            setCatError(err?.message || 'Failed to rename');
        }
    };

    const handleDeleteCategory = async (cat) => {
        const apiCat = apiCategories.find(c => c.name === cat);
        if (!apiCat) return;
        setCatError('');
        try {
            await categoriesApi.delete(apiCat.id);
            setApiCategories(prev => prev.filter(c => c.id !== apiCat.id));
            if (value === cat) onChange('');
        } catch (err) {
            setCatError(err?.message || 'Cannot delete: rewards use this category');
        }
    };

    return (
        <div ref={ref} className="relative">
            <div className="flex gap-1">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder={value || 'Search or type category...'}
                        value={showDropdown ? search : value}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onChange(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => { setShowDropdown(true); setSearch(''); }}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    {showDropdown && (
                        <div className="absolute z-50 bottom-full mb-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[185px] overflow-y-auto">
                            {filtered.length > 0 ? filtered.map(cat => {
                                const apiCat = apiCategories.find(c => c.name === cat);
                                return (
                                    <div key={cat} className="flex items-center justify-between px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group">
                                        {editingId && apiCat && editingId === apiCat.id ? (
                                            <div className="flex-1 flex gap-1">
                                                <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEditCategory(apiCat.id); } if (e.key === 'Escape') setEditingId(null); }}
                                                    className="flex-1 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 text-sm outline-none" autoFocus />
                                                <button type="button" onClick={() => handleEditCategory(apiCat.id)} className="text-emerald-600 text-xs font-medium">Save</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => { onChange(cat); setShowDropdown(false); setSearch(''); }}
                                                    className={`flex-1 text-left text-sm transition-colors ${cat === value
                                                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                                                        : 'text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                                {apiCat && (
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setEditingId(apiCat.id); setEditingName(cat); }}
                                                            className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button type="button" onClick={async (e) => { e.stopPropagation(); await handleDeleteCategory(cat); }}
                                                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="px-3 py-3 text-center text-xs text-slate-400">No matches — use + to add</div>
                            )}
                        </div>
                    )}
                </div>
                <button type="button" onClick={() => { setShowAddCategory(!showAddCategory); setShowDropdown(false); }}
                    className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 transition-colors"
                    title="Add new category">
                    <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                </button>
            </div>
            {showAddCategory && (
                <div className="mt-2 flex gap-2">
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name..."
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                    <button type="button" onClick={handleAddCategory} disabled={!newCategoryName.trim() || isAdding}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                        {isAdding ? '...' : 'Add'}
                    </button>
                </div>
            )}
            {catError && <p className="text-red-500 text-xs mt-1">{catError}</p>}
        </div>
    );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function RewardsInventoryPageContent() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, currentUser, hasPermission } = useAuth();
    const { runWithProgress } = useProgress();
    const [rewards, setRewards] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [sortColumn, setSortColumn] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showModal, setShowModal] = useState(false);
    const [deletingReward, setDeletingReward] = useState(null);
    const [editingReward, setEditingReward] = useState(null);
    // Task 29 — assign reward to additional locations (superadmin)
    const [assigningReward, setAssigningReward] = useState(null);
    const [assignModalOrgs, setAssignModalOrgs] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pointsRequired: '',
        stockQuantity: '',
        category: 'Merchandise',
        imageUrl: null,
        variants: [],
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Load rewards from API when location changes
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await rewardsApi.getAll(effectiveLocationId);
                if (!cancelled) setRewards((data || []).map(r => ({
                    ...r,
                    id: String(r.id),
                    pointsRequired: r.pointsRequired ?? 0,
                    stockQuantity: r.stockQuantity ?? 0,
                    dispensed: 0,
                    imageUrl: r.imageUrl ?? null,
                })));
            } catch (err) { console.error('Failed to load rewards:', err); }
            finally { if (!cancelled) setIsDataLoading(false); }
        };
        load();
        setCurrentPage(1);
        return () => { cancelled = true; };
    }, [effectiveLocationId]);

    // Task 29: load current assignments when the assign modal opens
    useEffect(() => {
        if (!assigningReward) return;
        setAssignError('');
        setAssignLoading(true);
        rewardsApi.getAssignments(assigningReward.id)
            .then(data => {
                const current = (data?.assignedOrganizations || []).map(o => o.id);
                setAssignModalOrgs(current);
            })
            .catch(() => setAssignError('Failed to load current assignments.'))
            .finally(() => setAssignLoading(false));
    }, [assigningReward]);

    const handleAssignToggle = (orgId) => {
        setAssignModalOrgs(prev =>
            prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
        );
    };

    const handleAssignSave = async () => {
        if (!assigningReward) return;
        setAssignLoading(true);
        setAssignError('');
        try {
            await rewardsApi.assign(assigningReward.id, assignModalOrgs);
            // Remove any orgs that were deselected
            const data = await rewardsApi.getAssignments(assigningReward.id);
            const currentIds = (data?.assignedOrganizations || []).map(o => o.id);
            const toRemove = currentIds.filter(id => !assignModalOrgs.includes(id));
            await Promise.all(toRemove.map(orgId =>
                rewardsApi.unassign(assigningReward.id, orgId)
            ));
            setAssigningReward(null);
        } catch {
            setAssignError('Failed to save assignments. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

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
                r.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === '' || r.category === filterCategory;
            const status = getStatus(r.stockQuantity);
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
                    case 'pointsRequired': valA = a.pointsRequired; valB = b.pointsRequired; break;
                    case 'stockQuantity': valA = a.stockQuantity; valB = b.stockQuantity; break;
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
    const totalStock = rewards.reduce((s, r) => s + r.stockQuantity, 0);
    const lowStockCount = rewards.filter(r => r.stockQuantity > 0 && r.stockQuantity < LOW_STOCK_THRESHOLD).length;
    const outOfStockCount = rewards.filter(r => r.stockQuantity === 0).length;
    const totalDispensed = rewards.reduce((s, r) => s + (r.dispensed || 0), 0);

    // Get location name
    const getLocationName = (locationId) => {
        const loc = allLocations.find(l => l.id === locationId);
        return loc ? loc.name : '';
    };

    // Modal handlers
    const openAddModal = () => {
        setEditingReward(null);
        setFormData({ name: '', description: '', pointsRequired: '', stockQuantity: '', category: 'Merchandise', imageUrl: null, variants: [] });
        setImagePreview(null);
        setImageUploading(false);
        setShowModal(true);
    };

    const openEditModal = (r) => {
        setEditingReward(r);
        setFormData({
            name: r.name,
            description: r.description || '',
            pointsRequired: r.pointsRequired.toString(),
            stockQuantity: r.stockQuantity.toString(),
            category: r.category,
            imageUrl: r.imageUrl || null,
            variants: (r.variants || [])
                .filter(v => v.isActive !== false && v.varietyName !== 'Default')
                .map(v => ({
                    id: v.id,
                    varietyName: v.varietyName,
                    stockQuantity: String(v.stockQuantity ?? 0),
                    pointsRequired: v.pointsRequiredOverride != null ? String(v.pointsRequiredOverride) : null,
                    samePrice: v.pointsRequiredOverride == null,
                })),
        });
        setImagePreview(null);
        setImageUploading(false);
        setShowModal(true);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Local preview only — never persisted as base64
        setImagePreview(URL.createObjectURL(file));
        setImageUploading(true);
        try {
            const url = await rewardsApi.uploadImage(file);
            setFormData(p => ({ ...p, imageUrl: url }));
        } catch (err) {
            console.error('Image upload failed:', err);
            alert(err?.message || 'Image upload failed');
            setImagePreview(null);
        } finally {
            setImageUploading(false);
        }
    };

    const handleSubmit = async () => {
        const { errors: fieldErrors, isValid } = validateAll(VALIDATION_RULES.reward, formData);
        if (!isValid) {
            alert(Object.values(fieldErrors)[0]);
            return;
        }
        const stockQuantity = parseInt(formData.stockQuantity);
        const variantsPayload = (formData.variants || [])
            .filter(v => (v.varietyName || '').trim() !== '')
            .map(v => ({
                ...(v.id ? { id: v.id } : {}),
                varietyName: v.varietyName.trim(),
                stockQuantity: parseInt(v.stockQuantity) || 0,
                pointsRequired: v.samePrice ? null : (parseInt(v.pointsRequired) || 0),
            }));
        const label = editingReward ? 'Saving changes...' : 'Creating reward...';
        const successLabel = editingReward ? 'Reward updated' : 'Reward created';

        await runWithProgress(label, async () => {
            if (editingReward) {
                await rewardsApi.update(editingReward.id, {
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    ...(variantsPayload.length ? { variants: variantsPayload } : {}),
                });
                setRewards(prev => prev.map(r => r.id === editingReward.id ? {
                    ...r,
                    ...formData,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity
                } : r));
            } else {
                const created = await rewardsApi.create({
                    name: formData.name,
                    description: formData.description,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    category: formData.category,
                    imageUrl: formData.imageUrl,
                    locationId: effectiveLocationId,
                    ...(variantsPayload.length ? { variants: variantsPayload } : {}),
                });
                setRewards(prev => [{
                    id: String(created.id),
                    ...formData,
                    pointsRequired: parseInt(formData.pointsRequired),
                    stockQuantity,
                    dispensed: 0,
                    locationId: effectiveLocationId
                }, ...prev]);
            }
        }, { successLabel });
        setShowModal(false);
    };

    // Dispense handler
    const handleDispense = (rewardId) => {
        setRewards(prev => prev.map(r => {
            if (r.id === rewardId && r.stockQuantity > 0) {
                return {
                    ...r,
                    stockQuantity: r.stockQuantity - 1,
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
                const newStock = Math.max(0, r.stockQuantity + amount);
                return { ...r, stockQuantity: newStock };
            }
            return r;
        }));
    };

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header */}
            <ViewOnlyWrapper>
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
                    {(isSuperAdmin || hasPermission('rewards', 'create')) && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            Add Reward
                        </button>
                    )}
                </div>
            </ViewOnlyWrapper>

            {/* Stats Overview */}
            {isDataLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
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
            )}

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
                                placeholder="Search by name or category..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 focus:border-emerald-500"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFilter || hasActiveFilters ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Filter {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4">
                        <CustomDropdown value={filterCategory} onChange={(v) => { setFilterCategory(v); setCurrentPage(1); }} options={categories} placeholder="All Categories" />
                        <CustomDropdown value={filterStatus} onChange={(v) => { setFilterStatus(v); setCurrentPage(1); }} options={['Available', 'Low Stock']} placeholder="All Status" />

                        {/* Location Filter */}
                        {isSuperAdmin && !effectiveLocationId && (
                            <CustomDropdown value={filterLocation} onChange={(v) => { setFilterLocation(v); setCurrentPage(1); }} options={allLocations.map(l => ({ value: l.id, label: l.name }))} placeholder="All Locations" />
                        )}

                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 font-medium transition-colors dark:border-red-500/30 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10">
                                <X size={14} /> Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Table */}
                {/* Top Pagination */}
                {totalPages > 0 && (
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center text-xs gap-3 bg-white dark:bg-slate-800/50">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredRewards.length)}</strong> of {filteredRewards.length}</span>
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
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('pointsRequired')}>
                                    <div className="flex items-center gap-1">Points <SortIcon column="pointsRequired" /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-emerald-600" onClick={() => handleSort('stockQuantity')}>
                                    <div className="flex items-center gap-1">Stock <SortIcon column="stockQuantity" /></div>
                                </th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isDataLoading ? (
                                Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} columns={8} />)
                            ) : currentRewards.map((r) => {
                                const isLowStock = r.stockQuantity < LOW_STOCK_THRESHOLD;
                                const isOutOfStock = r.stockQuantity === 0;

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
                                                {r.imageUrl ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-slate-400" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{formatField(r.description)}</p>
                                        </td>
                                        {isSuperAdmin && !effectiveLocationId && (
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                                                    <Building2 size={12} />
                                                    {formatField(r.locationName ?? getLocationName(r.locationId))}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <CategoryBadge category={r.category} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{r.pointsRequired} pts</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <span className={`font-semibold ${isOutOfStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {r.stockQuantity}
                                                </span>
                                                <LowStockWarning stock={r.stockQuantity} />
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
                                            <StockBadge stock={r.stockQuantity} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleDispense(r.id)}
                                                    disabled={r.stockQuantity === 0}
                                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${r.stockQuantity === 0
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                                                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:hover:bg-purple-500/30'
                                                        }`}
                                                >
                                                    <ShoppingBag size={14} />
                                                    Dispense
                                                </button>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => setAssigningReward(r)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10"
                                                        title="Assign to Locations"
                                                    >
                                                        <Share2 size={16} />
                                                    </button>
                                                )}
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

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-4">
                            <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">{(currentPage - 1) * rowsPerPage + 1}</strong> to <strong className="text-emerald-600 dark:text-emerald-400">{Math.min(currentPage * rowsPerPage, filteredRewards.length)}</strong> of {filteredRewards.length} rewards</span>
                            <PageSizeSelector value={rowsPerPage} onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }} />
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
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                                    <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {editingReward ? 'Edit Reward' : 'Add Reward'}
                                </h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                                        {(imagePreview || formData.imageUrl) ? <img src={imagePreview || formData.imageUrl || ''} className="w-full h-full object-cover" /> : <Image size={32} className="text-slate-400" />}
                                    </div>
                                    <div>
                                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                            <Upload size={16} />
                                            Upload
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white h-20 resize-none outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points Cost *</label>
                                    <input type="number" value={formData.pointsRequired} onChange={(e) => setFormData(p => ({ ...p, pointsRequired: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock *</label>
                                    <input type="number" value={formData.stockQuantity} onChange={(e) => setFormData(p => ({ ...p, stockQuantity: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                                <CategorySearchField
                                    value={formData.category}
                                    onChange={(v) => setFormData(p => ({ ...p, category: v }))}
                                    existingCategories={categories}
                                />
                            </div>
                            </div>{/* end left column */}
                            <div className="space-y-3 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Add product variants (e.g. sizes or colors). Each variant tracks its own stock and optionally a custom price. Leave "same as main" checked to use the Points Cost above.
                                </p>
                                <RewardVariantEditor
                                    variants={formData.variants}
                                    mainPrice={formData.pointsRequired}
                                    onChange={(next) => setFormData(p => ({ ...p, variants: next }))}
                                />
                            </div>
                        </div>{/* end grid */}
                        <div className="flex gap-3 p-6 pt-0">
                            <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium">Cancel</button>
                            <button type="button" onClick={handleSubmit} disabled={imageUploading} className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed">{editingReward ? 'Save Changes' : 'Add Reward'}</button>
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
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Deactivate Reward?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Are you sure you want to deactivate <strong>{deletingReward.name}</strong>? It will be hidden from users.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingReward(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await runWithProgress('Deactivating reward...', async () => {
                                        await rewardsApi.delete(deletingReward.id);
                                        setRewards(prev => prev.map(x =>
                                            x.id === deletingReward.id ? { ...x, isActive: false } : x
                                        ));
                                    }, { successLabel: 'Reward deactivated' });
                                    setDeletingReward(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/25 transition-all"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign to Locations Modal (superadmin only, Task 29) ── */}
            {assigningReward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                                    <Share2 size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Assign to Locations</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{assigningReward.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setAssigningReward(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Select locations whose users can also see and redeem this reward. The owner location (<strong className="text-slate-700 dark:text-slate-300">{assigningReward.locationName}</strong>) always has access.
                            </p>

                            {assignLoading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {(allLocations || [])
                                        .filter(loc => loc.id !== assigningReward.locationId)
                                        .map(loc => {
                                            const isSelected = assignModalOrgs.includes(loc.id);
                                            return (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => handleAssignToggle(loc.id)}
                                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Building2 size={14} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                            {loc.name}
                                                        </span>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                                        isSelected
                                                            ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                    }`}>
                                                        {isSelected && <Check size={12} className="text-white" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    {(allLocations || []).filter(loc => loc.id !== assigningReward.locationId).length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-6">No other locations available.</p>
                                    )}
                                </div>
                            )}

                            {assignError && (
                                <p className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{assignError}</p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-5 pb-5">
                            <button
                                onClick={() => setAssigningReward(null)}
                                className="flex-1 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignSave}
                                disabled={assignLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all"
                            >
                                {assignLoading ? 'Saving...' : 'Save Assignments'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function RewardsInventoryPage() {
    return (
        <RequirePermission category="rewards">
            <RewardsInventoryPageContent />
        </RequirePermission>
    );
}
