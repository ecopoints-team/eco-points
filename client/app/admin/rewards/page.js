'use client';
import React, { useState, useMemo, useRef } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { Search, Filter, ChevronLeft, ChevronRight, Gift, Package, Plus, Edit2, Trash2, X, Upload, Image, ChevronDown } from 'lucide-react';

const initialRewards = [
    { id: 'RWD-001', name: 'Eco Tote Bag', description: 'Reusable canvas tote bag with EcoPoints logo', pointsCost: 500, stock: 45, status: 'Available', category: 'Merchandise', image: null },
    { id: 'RWD-002', name: 'Reusable Water Bottle', description: 'Stainless steel 750ml water bottle', pointsCost: 800, stock: 32, status: 'Available', category: 'Merchandise', image: null },
    { id: 'RWD-003', name: 'Coffee Shop Voucher', description: '₱100 gift voucher for partner coffee shops', pointsCost: 300, stock: 100, status: 'Available', category: 'Vouchers', image: null },
    { id: 'RWD-004', name: 'Tree Planting Certificate', description: 'Plant a tree in your name', pointsCost: 1000, stock: 50, status: 'Available', category: 'Experience', image: null },
    { id: 'RWD-005', name: 'Bamboo Cutlery Set', description: 'Portable bamboo utensil set', pointsCost: 600, stock: 28, status: 'Available', category: 'Merchandise', image: null },
    { id: 'RWD-006', name: 'Eco Notebook', description: 'Recycled paper notebook', pointsCost: 200, stock: 0, status: 'Out of Stock', category: 'Merchandise', image: null },
    { id: 'RWD-007', name: 'Movie Ticket', description: 'Single movie ticket', pointsCost: 450, stock: 75, status: 'Available', category: 'Vouchers', image: null },
    { id: 'RWD-008', name: 'Plant Kit', description: 'Succulent starter kit', pointsCost: 350, stock: 15, status: 'Low Stock', category: 'Experience', image: null },
];

export default function RewardsInventoryPage() {
    const [rewards, setRewards] = useState(initialRewards);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', pointsCost: '', stock: '', category: 'Merchandise', image: null });
    const fileInputRef = useRef(null);

    const categories = [...new Set(rewards.map(r => r.category))];
    const statuses = [...new Set(rewards.map(r => r.status))];

    const filteredRewards = useMemo(() => {
        return rewards.filter(r => {
            const matchesSearch = searchQuery === '' || r.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch && (filterCategory === '' || r.category === filterCategory) && (filterStatus === '' || r.status === filterStatus);
        });
    }, [rewards, searchQuery, filterCategory, filterStatus]);

    const totalPages = Math.ceil(filteredRewards.length / 10);
    const currentRewards = filteredRewards.slice((currentPage - 1) * 10, currentPage * 10);

    const getStatusColor = (s) => ({ 'Available': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', 'Low Stock': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', 'Out of Stock': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' }[s] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');
    const getCategoryColor = (c) => ({ 'Merchandise': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', 'Vouchers': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', 'Experience': 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400' }[c] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400');

    const openAddModal = () => { setEditingReward(null); setFormData({ name: '', description: '', pointsCost: '', stock: '', category: 'Merchandise', image: null }); setShowModal(true); };
    const openEditModal = (r) => { setEditingReward(r); setFormData({ name: r.name, description: r.description, pointsCost: r.pointsCost.toString(), stock: r.stock.toString(), category: r.category, image: r.image }); setShowModal(true); };

    const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setFormData(p => ({ ...p, image: reader.result })); reader.readAsDataURL(file); } };

    const handleSubmit = () => {
        if (!formData.name || !formData.pointsCost || !formData.stock) return;
        const stock = parseInt(formData.stock);
        const status = stock === 0 ? 'Out of Stock' : stock <= 20 ? 'Low Stock' : 'Available';
        if (editingReward) {
            setRewards(prev => prev.map(r => r.id === editingReward.id ? { ...r, ...formData, pointsCost: parseInt(formData.pointsCost), stock, status } : r));
        } else {
            setRewards(prev => [{ id: `RWD-${String(prev.length + 1).padStart(3, '0')}`, ...formData, pointsCost: parseInt(formData.pointsCost), stock, status }, ...prev]);
        }
        setShowModal(false);
    };

    return (
        <AdminLayout>
            <div className="mb-8 flex justify-between items-center">
                <div><h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Rewards Inventory</h1><p className="text-slate-500 dark:text-slate-400">Manage reward items and stock</p></div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg"><Plus size={18} /> Add Reward</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20"><Gift size={24} className="text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Total Rewards</p><p className="text-2xl font-black text-slate-800 dark:text-white">{rewards.length}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20"><Package size={24} className="text-blue-600 dark:text-blue-400" /></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Total Stock</p><p className="text-2xl font-black text-slate-800 dark:text-white">{rewards.reduce((s, r) => s + r.stock, 0)}</p></div></div>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20"><span className="text-amber-600 dark:text-amber-400">⚠️</span></div><div><p className="text-sm text-slate-500 dark:text-slate-400">Low Stock</p><p className="text-2xl font-black text-slate-800 dark:text-white">{rewards.filter(r => r.stock > 0 && r.stock <= 20).length}</p></div></div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-6 bg-emerald-500 rounded-full dark:shadow-[0_0_10px_#10b981]"></span>All Rewards</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300" /></div>
                        <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${showFilter ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}><Filter size={16} /> Filter</button>
                    </div>
                </div>

                {showFilter && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4">
                        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><option value="">All Categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select>
                        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><option value="">All Statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr><th className="px-6 py-4">Image</th><th className="px-6 py-4">Reward</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Points</th><th className="px-6 py-4">Stock</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {currentRewards.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10">
                                    <td className="px-6 py-4"><div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden">{r.image ? <img src={r.image} alt={r.name} className="w-full h-full object-cover" /> : <Image size={20} className="text-slate-400" />}</div></td>
                                    <td className="px-6 py-4"><p className="font-semibold text-slate-800 dark:text-white text-sm">{r.name}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{r.description}</p></td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getCategoryColor(r.category)}`}>{r.category}</span></td>
                                    <td className="px-6 py-4"><span className="font-bold text-emerald-600 dark:text-emerald-400">{r.pointsCost} pts</span></td>
                                    <td className="px-6 py-4"><span className="font-semibold text-slate-700 dark:text-slate-300">{r.stock}</span></td>
                                    <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(r.status)}`}>{r.status}</span></td>
                                    <td className="px-6 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEditModal(r)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10"><Edit2 size={16} /></button><button onClick={() => setRewards(prev => prev.filter(x => x.id !== r.id))} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10"><Trash2 size={16} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <span>Showing {currentRewards.length} of {filteredRewards.length}</span>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50 bg-white dark:bg-slate-800 dark:border-slate-700"><ChevronLeft size={14} /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => <button key={p} onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg font-medium ${currentPage === p ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>{p}</button>)}
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50 bg-white dark:bg-slate-800 dark:border-slate-700"><ChevronRight size={14} /></button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingReward ? 'Edit Reward' : 'Add Reward'}</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X size={20} /></button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image</label><div className="flex items-center gap-4"><div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">{formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <Image size={32} className="text-slate-400" />}</div><div><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium"><Upload size={16} /> Upload</button></div></div></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label><textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 h-20 resize-none outline-none" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Points *</label><input type="number" value={formData.pointsCost} onChange={(e) => setFormData(p => ({ ...p, pointsCost: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock *</label><input type="number" value={formData.stock} onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none" /></div>
                            </div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 outline-none"><option>Merchandise</option><option>Vouchers</option><option>Experience</option></select></div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button><button onClick={handleSubmit} className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 font-bold">{editingReward ? 'Save' : 'Add'}</button></div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
