'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../src/components/admin/RequirePermission';
import { SkeletonMachineCard } from '../../../src/components/admin/SkeletonLoaders';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import { useAuth } from '../../../src/context/AuthContext';
import { locations as locationsApi, orgTypes as orgTypesApi } from '../../../src/services/api';
import { formatField } from '../../../src/lib/formatField';
import { validateAll, VALIDATION_RULES } from '../../../src/lib/validateField';
import { formatDateShort } from '../../../src/utils/formatDate';
import {
    Building2, MapPin, Users, Package, Leaf, TrendingUp,
    Calendar, Phone, Mail, Edit2, Eye, Plus, Search,
    ChevronLeft, ChevronRight, X, Coins, User, Trash2, RefreshCw, Upload, FileText
} from 'lucide-react';

// ============================================================================
// ADD LOCATION MODAL — Two-Page Tabbed Layout
// ============================================================================
function AddLocationModal({ isOpen, onClose, onSubmit, isSuperAdmin }) {
    const [activeTab, setActiveTab] = useState(1);
    const [formData, setFormData] = useState({
        name: '', fullName: '', orgType: '', streetAddress: '', barangay: '',
        cityMunicipality: '', province: '', region: '', zipCode: '',
        contactPerson: '', contactEmail: '', contactPhone: '', status: 'Active'
    });
    const [errors, setErrors] = useState({});
    const [orgTypesList, setOrgTypesList] = useState([]);
    const [orgTypeSearch, setOrgTypeSearch] = useState('');
    const [showOrgTypeDropdown, setShowOrgTypeDropdown] = useState(false);
    const [showAddOrgType, setShowAddOrgType] = useState(false);
    const [newOrgTypeName, setNewOrgTypeName] = useState('');
    const [isAddingOrgType, setIsAddingOrgType] = useState(false);
    const orgTypeRef = useRef(null);
    const [editingOrgTypeId, setEditingOrgTypeId] = useState(null);
    const [editingOrgTypeName, setEditingOrgTypeName] = useState('');
    const [orgTypeError, setOrgTypeError] = useState('');
    const [communityGroups, setCommunityGroups] = useState([]);

    useEffect(() => {
        if (isOpen) {
            orgTypesApi.getAll().then(data => setOrgTypesList(data || [])).catch(() => {});
            setActiveTab(1); setErrors({});
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (orgTypeRef.current && !orgTypeRef.current.contains(e.target)) {
                setShowOrgTypeDropdown(false); setShowAddOrgType(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOrgTypeLabel = orgTypesList.find(t => String(t.id) === String(formData.orgType))?.name || '';
    const filteredOrgTypes = orgTypesList.filter(t => t.name.toLowerCase().includes(orgTypeSearch.toLowerCase()));

    const handleAddOrgType = async () => {
        if (!newOrgTypeName.trim()) return;
        setIsAddingOrgType(true); setOrgTypeError('');
        try {
            const created = await orgTypesApi.create(newOrgTypeName.trim());
            setOrgTypesList(prev => [...prev, created]);
            setFormData(f => ({ ...f, orgType: String(created.id) }));
            setNewOrgTypeName(''); setShowAddOrgType(false); setOrgTypeSearch('');
        } catch (err) { setOrgTypeError(err?.message || 'Failed to create'); }
        finally { setIsAddingOrgType(false); }
    };
    const handleDeleteOrgType = async (id) => {
        setOrgTypeError('');
        try {
            await orgTypesApi.delete(id);
            setOrgTypesList(prev => prev.filter(t => t.id !== id));
            if (String(formData.orgType) === String(id)) setFormData(f => ({ ...f, orgType: '' }));
        } catch (err) { setOrgTypeError(err?.message || 'Failed to delete'); }
    };
    const handleEditOrgType = async (id) => {
        const name = editingOrgTypeName.trim();
        if (!name) return; setOrgTypeError('');
        try {
            const updated = await orgTypesApi.update(id, name);
            setOrgTypesList(prev => prev.map(t => t.id === id ? { ...t, name: updated.name } : t));
            setEditingOrgTypeId(null); setEditingOrgTypeName('');
        } catch (err) { setOrgTypeError(err?.message || 'Failed to rename'); }
    };

    const handlePhoneChange = (val) => {
        let digits = val.replace(/[^\d]/g, '');
        if (digits.startsWith('0')) digits = digits.slice(1);
        if (digits.length > 10) digits = digits.slice(0, 10);
        setFormData({ ...formData, contactPhone: digits });
    };

    const validatePage1 = () => {
        const { errors: newErrors, isValid } = validateAll(VALIDATION_RULES.location, formData);
        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => { if (validatePage1()) setActiveTab(2); };

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (activeTab === 1) { handleNext(); return; }
        if (validatePage1()) {
            const orgTypeObj = orgTypesList.find(t => String(t.id) === String(formData.orgType));
            onSubmit({
                ...formData,
                orgType: orgTypeObj ? orgTypeObj.name : formData.orgType,
                communityGroups: communityGroups.filter(g => g.name.trim()),
            });
            setFormData({ name: '', fullName: '', orgType: '', streetAddress: '', barangay: '', cityMunicipality: '', province: '', region: '', zipCode: '', contactPerson: '', contactEmail: '', contactPhone: '', status: 'Active' });
            setCommunityGroups([]); setActiveTab(1); onClose();
        }
    };

    if (!isOpen) return null;

    const inputCls = (field) => `w-full px-4 py-2 rounded-lg border ${errors[field] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`;
    const plainCls = 'w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20"><Building2 size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add New Location</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
                    {[{ n: 1, icon: FileText, label: 'Location Info' }, { n: 2, icon: Users, label: 'Community Groups' }].map(t => (
                        <button key={t.n} onClick={() => t.n === 1 ? setActiveTab(1) : handleNext()}
                            className={`flex-1 py-3 px-4 text-sm font-bold text-center transition-colors relative ${activeTab === t.n ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                            <div className="flex items-center justify-center gap-2"><t.icon size={16} />{t.label}</div>
                            {activeTab === t.n && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
                        </button>
                    ))}
                </div>
                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    {activeTab === 1 && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name *</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., AU-Pasig" className={inputCls('name')} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                                    <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g., Arellano University - Pasig Campus" className={inputCls('fullName')} />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div ref={orgTypeRef} className="relative">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Type *</label>
                                    <div className="flex gap-1">
                                        <div className="flex-1 relative">
                                            <input type="text" placeholder={formData.orgType ? selectedOrgTypeLabel : 'Select type...'} value={showOrgTypeDropdown ? orgTypeSearch : selectedOrgTypeLabel}
                                                onChange={e => { setOrgTypeSearch(e.target.value); setShowOrgTypeDropdown(true); }} onFocus={() => { setShowOrgTypeDropdown(true); setOrgTypeSearch(''); }}
                                                className={`${inputCls('orgType')} text-sm`} />
                                            {showOrgTypeDropdown && (
                                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                                                    {filteredOrgTypes.length > 0 ? filteredOrgTypes.map(opt => (
                                                        <div key={opt.id} className="flex items-center justify-between px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group">
                                                            {editingOrgTypeId === opt.id ? (
                                                                <div className="flex-1 flex gap-1">
                                                                    <input type="text" value={editingOrgTypeName} onChange={e => setEditingOrgTypeName(e.target.value)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditOrgType(opt.id); } if (e.key === 'Escape') setEditingOrgTypeId(null); }}
                                                                        className="flex-1 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 text-sm outline-none" autoFocus />
                                                                    <button type="button" onClick={() => handleEditOrgType(opt.id)} className="text-emerald-600 text-xs font-medium">Save</button>
                                                                </div>
                                                            ) : (<>
                                                                <button type="button" onClick={() => { setFormData({ ...formData, orgType: String(opt.id) }); setShowOrgTypeDropdown(false); setOrgTypeSearch(''); }}
                                                                    className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{opt.name}</button>
                                                                {isSuperAdmin && (
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button type="button" onClick={e => { e.stopPropagation(); setEditingOrgTypeId(opt.id); setEditingOrgTypeName(opt.name); }}
                                                                            className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={12} /></button>
                                                                        <button type="button" onClick={async e => { e.stopPropagation(); await handleDeleteOrgType(opt.id); }}
                                                                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                                                                    </div>
                                                                )}
                                                            </>)}
                                                        </div>
                                                    )) : (<div className="px-3 py-3 text-center text-xs text-slate-400">No results</div>)}
                                                </div>
                                            )}
                                        </div>
                                        {isSuperAdmin && (
                                            <button type="button" onClick={() => { setShowAddOrgType(!showAddOrgType); setShowOrgTypeDropdown(false); }}
                                                className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 transition-colors" title="Add new organization type">
                                                <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </button>
                                        )}
                                    </div>
                                    {showAddOrgType && isSuperAdmin && (
                                        <div className="mt-2 flex gap-2">
                                            <input type="text" value={newOrgTypeName} onChange={e => setNewOrgTypeName(e.target.value)} placeholder="New type name..."
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddOrgType())}
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                                            <button type="button" onClick={handleAddOrgType} disabled={isAddingOrgType || !newOrgTypeName.trim()}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors">{isAddingOrgType ? '...' : 'Add'}</button>
                                        </div>
                                    )}
                                    {errors.orgType && <p className="text-red-500 text-xs mt-1">{errors.orgType}</p>}
                                    {orgTypeError && <p className="text-red-500 text-xs mt-1">{orgTypeError}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City/Municipality *</label>
                                    <input type="text" value={formData.cityMunicipality} onChange={e => setFormData({ ...formData, cityMunicipality: e.target.value })} placeholder="e.g., Pasig" maxLength={200} className={inputCls('cityMunicipality')} />
                                    {errors.cityMunicipality && <p className="text-red-500 text-xs mt-1">{errors.cityMunicipality}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address *</label>
                                <input type="text" value={formData.streetAddress} onChange={e => setFormData({ ...formData, streetAddress: e.target.value })} placeholder="Full street address" className={inputCls('streetAddress')} />
                                {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barangay</label>
                                    <input type="text" value={formData.barangay} onChange={e => setFormData({ ...formData, barangay: e.target.value })} placeholder="e.g., Caniogan" maxLength={200} className={plainCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ZIP Code</label>
                                    <input type="text" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} placeholder="e.g., 1600" maxLength={10} className={plainCls} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Province</label>
                                    <input type="text" value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} placeholder="e.g., Metro Manila" maxLength={200} className={plainCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region</label>
                                    <input type="text" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} placeholder="e.g., NCR" maxLength={200} className={plainCls} /></div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> Contact Information</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                                    <div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                        <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="e.g., Admin Officer"
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.contactPerson ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`} /></div>
                                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                        <input type="email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="contact@example.edu" className={inputCls('contactEmail')} />
                                        {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}</div>
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                        <div className="flex"><span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 text-sm font-medium">+63</span>
                                            <input type="tel" value={formData.contactPhone} onChange={e => handlePhoneChange(e.target.value)} maxLength={10} placeholder="9XX XXX XXXX"
                                                className={`w-full px-4 py-2 rounded-r-lg border ${errors.contactPhone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`} /></div>
                                        {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <CustomDropdown value={formData.status} onChange={v => setFormData({ ...formData, status: v })} options={['Active', 'Inactive']} showPlaceholder={false} size="md" /></div></div>
                        </div>
                    )}
                    {activeTab === 2 && (
                        <div className="p-6 space-y-4 flex flex-col" style={{ minHeight: '400px' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20"><Users size={16} className="text-emerald-600 dark:text-emerald-400" /></div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Community Groups ({communityGroups.length})</h4></div>
                                <button type="button" onClick={() => setCommunityGroups(prev => [...prev, { name: '', abbreviation: '', groupType: 'college' }])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><Plus size={14} /> Add Group</button>
                            </div>
                            {communityGroups.length === 0 && (<p className="text-xs text-slate-400 dark:text-slate-500 italic">A default &quot;Campus Staff&quot; group will be created if none are added.</p>)}
                            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {communityGroups.map((g, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 flex-wrap">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6">#{idx + 1}</span>
                                        <input type="text" placeholder="Group name (e.g., BSIT)" value={g.name} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, name: e.target.value } : gr))}
                                            className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                                        <input type="text" placeholder="Abbr" value={g.abbreviation} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, abbreviation: e.target.value } : gr))}
                                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                                        <select value={g.groupType} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, groupType: e.target.value } : gr))}
                                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs outline-none">
                                            <option value="college">College</option><option value="shs_strand">SHS Strand</option><option value="jhs">JHS</option><option value="elementary">Elementary</option><option value="staff">Staff</option>
                                        </select>
                                        <button type="button" onClick={() => setCommunityGroups(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700"><Upload size={18} className="text-slate-400 dark:text-slate-500" /></div>
                                    <div><p className="text-sm font-medium text-slate-400 dark:text-slate-500">Import from CSV</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-600">Coming soon — bulk import community groups from a CSV file</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div>{activeTab === 2 && (<button type="button" onClick={() => setActiveTab(1)} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"><ChevronLeft size={16} /> Back</button>)}</div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">Cancel</button>
                        {activeTab === 1 ? (
                            <button type="button" onClick={handleNext} className="flex items-center gap-1 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-colors">Next <ChevronRight size={16} /></button>
                        ) : (
                            <button type="button" onClick={handleSubmit} className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-colors">Add Location</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



// ============================================================================
// EDIT LOCATION MODAL â€” Two-Page Tabbed Layout
// ============================================================================
function EditLocationModal({ isOpen, onClose, onSubmit, location, isSuperAdmin }) {
    const [activeTab, setActiveTab] = useState(1);
    const [formData, setFormData] = useState({
        name: '', fullName: '', orgType: '', streetAddress: '', barangay: '',
        cityMunicipality: '', province: '', region: '', zipCode: '',
        contactPerson: '', contactEmail: '', contactPhone: '', status: 'Active'
    });
    const [errors, setErrors] = useState({});
    const [orgTypesList, setOrgTypesList] = useState([]);
    const [orgTypeSearch, setOrgTypeSearch] = useState('');
    const [showOrgTypeDropdown, setShowOrgTypeDropdown] = useState(false);
    const [showAddOrgType, setShowAddOrgType] = useState(false);
    const [newOrgTypeName, setNewOrgTypeName] = useState('');
    const [isAddingOrgType, setIsAddingOrgType] = useState(false);
    const orgTypeRef = useRef(null);
    const [editingOrgTypeId, setEditingOrgTypeId] = useState(null);
    const [editingOrgTypeName, setEditingOrgTypeName] = useState('');
    const [orgTypeError, setOrgTypeError] = useState('');
    const [communityGroups, setCommunityGroups] = useState([]);

    useEffect(() => {
        if (isOpen && location) {
            orgTypesApi.getAll().then(data => {
                const list = data || [];
                setOrgTypesList(list);
                const matchedType = list.find(t => t.name === location.orgType);
                setFormData({
                    name: location.name || '', fullName: location.fullName || '',
                    orgType: matchedType ? String(matchedType.id) : '',
                    streetAddress: location.streetAddress || '', barangay: location.barangay || '',
                    cityMunicipality: location.cityName || location.cityMunicipality || '',
                    province: location.province || '', region: location.region || '',
                    zipCode: location.zipCode || '', contactPerson: location.contactPerson || '',
                    contactEmail: location.contactEmail || '', contactPhone: location.contactPhone || '',
                    status: location.status || 'Active'
                });
            }).catch(() => {});
            setCommunityGroups((location.communityGroups || []).map(g => ({
                id: g.id, name: g.name || '', abbreviation: g.abbreviation || '', groupType: g.groupType || 'college'
            })));
            setActiveTab(1); setErrors({});
        }
    }, [isOpen, location]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (orgTypeRef.current && !orgTypeRef.current.contains(e.target)) {
                setShowOrgTypeDropdown(false); setShowAddOrgType(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOrgTypeLabel = orgTypesList.find(t => String(t.id) === String(formData.orgType))?.name || '';
    const filteredOrgTypes = orgTypesList.filter(t => t.name.toLowerCase().includes(orgTypeSearch.toLowerCase()));

    const handleAddOrgType = async () => {
        if (!newOrgTypeName.trim()) return;
        setIsAddingOrgType(true); setOrgTypeError('');
        try {
            const created = await orgTypesApi.create(newOrgTypeName.trim());
            setOrgTypesList(prev => [...prev, created]);
            setFormData(f => ({ ...f, orgType: String(created.id) }));
            setNewOrgTypeName(''); setShowAddOrgType(false); setOrgTypeSearch('');
        } catch (err) { setOrgTypeError(err?.message || 'Failed to create'); }
        finally { setIsAddingOrgType(false); }
    };
    const handleDeleteOrgType = async (id) => {
        setOrgTypeError('');
        try {
            await orgTypesApi.delete(id);
            setOrgTypesList(prev => prev.filter(t => t.id !== id));
            if (String(formData.orgType) === String(id)) setFormData(f => ({ ...f, orgType: '' }));
        } catch (err) { setOrgTypeError(err?.message || 'Failed to delete'); }
    };
    const handleEditOrgType = async (id) => {
        const name = editingOrgTypeName.trim();
        if (!name) return; setOrgTypeError('');
        try {
            const updated = await orgTypesApi.update(id, name);
            setOrgTypesList(prev => prev.map(t => t.id === id ? { ...t, name: updated.name } : t));
            setEditingOrgTypeId(null); setEditingOrgTypeName('');
        } catch (err) { setOrgTypeError(err?.message || 'Failed to rename'); }
    };

    const handlePhoneChange = (val) => {
        let digits = val.replace(/[^\d]/g, '');
        if (digits.startsWith('0')) digits = digits.slice(1);
        if (digits.length > 10) digits = digits.slice(0, 10);
        setFormData({ ...formData, contactPhone: digits });
    };

    const validatePage1 = () => {
        const { errors: newErrors, isValid } = validateAll(VALIDATION_RULES.location, formData);
        setErrors(newErrors);
        return isValid;
    };

    const handleNext = () => { if (validatePage1()) setActiveTab(2); };

    const handleSubmit = (e) => {
        e?.preventDefault?.();
        if (activeTab === 1) { handleNext(); return; }
        if (validatePage1()) {
            const orgTypeObj = orgTypesList.find(t => String(t.id) === String(formData.orgType));
            onSubmit(location.id, {
                ...formData,
                orgType: orgTypeObj ? orgTypeObj.name : formData.orgType,
                communityGroups: communityGroups.filter(g => g.name.trim()),
            });
            onClose();
        }
    };

    if (!isOpen || !location) return null;

    const inputCls = (field) => `w-full px-4 py-2 rounded-lg border ${errors[field] ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`;
    const plainCls = 'w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-500/20"><Edit2 size={20} className="text-blue-600 dark:text-blue-400" /></div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Edit Location</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"><X size={20} /></button>
                </div>
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
                    {[{ n: 1, icon: FileText, label: 'Location Info' }, { n: 2, icon: Users, label: 'Community Groups' }].map(t => (
                        <button key={t.n} onClick={() => t.n === 1 ? setActiveTab(1) : handleNext()}
                            className={`flex-1 py-3 px-4 text-sm font-bold text-center transition-colors relative ${activeTab === t.n ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                            <div className="flex items-center justify-center gap-2"><t.icon size={16} />{t.label}</div>
                            {activeTab === t.n && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
                        </button>
                    ))}
                </div>
                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    {activeTab === 1 && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name *</label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., AU-Pasig" className={inputCls('name')} />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                                    <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g., Arellano University - Pasig Campus" className={inputCls('fullName')} />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div ref={orgTypeRef} className="relative">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization Type *</label>
                                    <div className="flex gap-1">
                                        <div className="flex-1 relative">
                                            <input type="text" placeholder={formData.orgType ? selectedOrgTypeLabel : 'Select type...'} value={showOrgTypeDropdown ? orgTypeSearch : selectedOrgTypeLabel}
                                                onChange={e => { setOrgTypeSearch(e.target.value); setShowOrgTypeDropdown(true); }} onFocus={() => { setShowOrgTypeDropdown(true); setOrgTypeSearch(''); }}
                                                className={`${inputCls('orgType')} text-sm`} />
                                            {showOrgTypeDropdown && (
                                                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                                                    {filteredOrgTypes.length > 0 ? filteredOrgTypes.map(opt => (
                                                        <div key={opt.id} className="flex items-center justify-between px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors group">
                                                            {editingOrgTypeId === opt.id ? (
                                                                <div className="flex-1 flex gap-1">
                                                                    <input type="text" value={editingOrgTypeName} onChange={e => setEditingOrgTypeName(e.target.value)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditOrgType(opt.id); } if (e.key === 'Escape') setEditingOrgTypeId(null); }}
                                                                        className="flex-1 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-900 text-sm outline-none" autoFocus />
                                                                    <button type="button" onClick={() => handleEditOrgType(opt.id)} className="text-emerald-600 text-xs font-medium">Save</button>
                                                                </div>
                                                            ) : (<>
                                                                <button type="button" onClick={() => { setFormData({ ...formData, orgType: String(opt.id) }); setShowOrgTypeDropdown(false); setOrgTypeSearch(''); }}
                                                                    className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{opt.name}</button>
                                                                {isSuperAdmin && (
                                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button type="button" onClick={e => { e.stopPropagation(); setEditingOrgTypeId(opt.id); setEditingOrgTypeName(opt.name); }}
                                                                            className="p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Edit2 size={12} /></button>
                                                                        <button type="button" onClick={async e => { e.stopPropagation(); await handleDeleteOrgType(opt.id); }}
                                                                            className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
                                                                    </div>
                                                                )}
                                                            </>)}
                                                        </div>
                                                    )) : (<div className="px-3 py-3 text-center text-xs text-slate-400">No results</div>)}
                                                </div>
                                            )}
                                        </div>
                                        {isSuperAdmin && (
                                            <button type="button" onClick={() => { setShowAddOrgType(!showAddOrgType); setShowOrgTypeDropdown(false); }}
                                                className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 transition-colors" title="Add new organization type">
                                                <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </button>
                                        )}
                                    </div>
                                    {showAddOrgType && isSuperAdmin && (
                                        <div className="mt-2 flex gap-2">
                                            <input type="text" value={newOrgTypeName} onChange={e => setNewOrgTypeName(e.target.value)} placeholder="New type name..."
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddOrgType())}
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
                                            <button type="button" onClick={handleAddOrgType} disabled={isAddingOrgType || !newOrgTypeName.trim()}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors">{isAddingOrgType ? '...' : 'Add'}</button>
                                        </div>
                                    )}
                                    {errors.orgType && <p className="text-red-500 text-xs mt-1">{errors.orgType}</p>}
                                    {orgTypeError && <p className="text-red-500 text-xs mt-1">{orgTypeError}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City/Municipality *</label>
                                    <input type="text" value={formData.cityMunicipality} onChange={e => setFormData({ ...formData, cityMunicipality: e.target.value })} placeholder="e.g., Pasig" maxLength={200} className={inputCls('cityMunicipality')} />
                                    {errors.cityMunicipality && <p className="text-red-500 text-xs mt-1">{errors.cityMunicipality}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Street Address *</label>
                                <input type="text" value={formData.streetAddress} onChange={e => setFormData({ ...formData, streetAddress: e.target.value })} placeholder="Full street address" className={inputCls('streetAddress')} />
                                {errors.streetAddress && <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barangay</label>
                                    <input type="text" value={formData.barangay} onChange={e => setFormData({ ...formData, barangay: e.target.value })} placeholder="e.g., Caniogan" maxLength={200} className={plainCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ZIP Code</label>
                                    <input type="text" value={formData.zipCode} onChange={e => setFormData({ ...formData, zipCode: e.target.value })} placeholder="e.g., 1600" maxLength={10} className={plainCls} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Province</label>
                                    <input type="text" value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} placeholder="e.g., Metro Manila" maxLength={200} className={plainCls} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Region</label>
                                    <input type="text" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} placeholder="e.g., NCR" maxLength={200} className={plainCls} /></div>
                            </div>
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> Contact Information</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person *</label>
                                    <div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><User size={16} /></div>
                                        <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} placeholder="e.g., Admin Officer"
                                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${errors.contactPerson ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`} /></div>
                                    {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-3">
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                        <input type="email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="contact@example.edu" className={inputCls('contactEmail')} />
                                        {errors.contactEmail && <p className="text-red-500 text-xs mt-1">{errors.contactEmail}</p>}</div>
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
                                        <div className="flex"><span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 text-sm font-medium">+63</span>
                                            <input type="tel" value={formData.contactPhone} onChange={e => handlePhoneChange(e.target.value)} maxLength={10} placeholder="9XX XXX XXXX"
                                                className={`w-full px-4 py-2 rounded-r-lg border ${errors.contactPhone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500`} /></div>
                                        {errors.contactPhone && <p className="text-red-500 text-xs mt-1">{errors.contactPhone}</p>}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                <CustomDropdown value={formData.status} onChange={v => setFormData({ ...formData, status: v })} options={['Active', 'Inactive']} showPlaceholder={false} size="md" /></div></div>
                        </div>
                    )}
                    {activeTab === 2 && (
                        <div className="p-6 space-y-4 flex flex-col" style={{ minHeight: '400px' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/20"><Users size={16} className="text-blue-600 dark:text-blue-400" /></div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Community Groups ({communityGroups.length})</h4></div>
                                <button type="button" onClick={() => setCommunityGroups(prev => [...prev, { name: '', abbreviation: '', groupType: 'college' }])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><Plus size={14} /> Add Group</button>
                            </div>
                            {communityGroups.length === 0 && (<p className="text-xs text-slate-400 dark:text-slate-500 italic">No community groups. Add at least one group.</p>)}
                            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                                {communityGroups.map((g, idx) => (
                                    <div key={g.id || `new-${idx}`} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 flex-wrap">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6">#{idx + 1}</span>
                                        <input type="text" placeholder="Group name (e.g., BSIT)" value={g.name} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, name: e.target.value } : gr))}
                                            className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                        <input type="text" placeholder="Abbr" value={g.abbreviation} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, abbreviation: e.target.value } : gr))}
                                            className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                        <select value={g.groupType} onChange={e => setCommunityGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, groupType: e.target.value } : gr))}
                                            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs outline-none">
                                            <option value="college">College</option><option value="shs_strand">SHS Strand</option><option value="jhs">JHS</option><option value="elementary">Elementary</option><option value="staff">Staff</option>
                                        </select>
                                        <button type="button" onClick={() => setCommunityGroups(prev => prev.filter((_, i) => i !== idx))}
                                            className="p-1 rounded text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700"><Upload size={18} className="text-slate-400 dark:text-slate-500" /></div>
                                    <div><p className="text-sm font-medium text-slate-400 dark:text-slate-500">Import from CSV</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-600">Coming soon â€” bulk import community groups from a CSV file</p></div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <div>{activeTab === 2 && (<button type="button" onClick={() => setActiveTab(1)} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors"><ChevronLeft size={16} /> Back</button>)}</div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors">Cancel</button>
                        {activeTab === 1 ? (
                            <button type="button" onClick={handleNext} className="flex items-center gap-1 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors">Next <ChevronRight size={16} /></button>
                        ) : (
                            <button type="button" onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm font-bold shadow-lg shadow-blue-500/20 transition-colors">Save Changes</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



// ============================================================================
// LOCATIONS MANAGEMENT PAGE (Super Admin Only)
// ============================================================================
function LocationsPageContent() {
    const { isSuperAdmin, setViewAsLocation, allLocations, refreshLocations } = useAuth();
    const [locations, setLocations] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Load locations from API
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsDataLoading(true);
            try {
                const data = await locationsApi.getAll();
                if (!cancelled) setLocations(data || []);
            } catch (err) {
                console.error('Failed to load locations:', err);
            } finally {
                if (!cancelled) setIsDataLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [refreshKey]);
    const cardsPerPage = 9;

    // Filter locations by search
    const filteredLocations = useMemo(() => {
        if (!searchQuery) return locations;
        const q = searchQuery.toLowerCase();
        return locations.filter(loc =>
            (loc.name || '').toLowerCase().includes(q) ||
            (loc.fullName || '').toLowerCase().includes(q) ||
            (loc.streetAddress || '').toLowerCase().includes(q)
        );
    }, [locations, searchQuery]);

    // User count is included in the API response as location.userCount
    const userCountByLocation = useMemo(() => {
        return locations.reduce((acc, loc) => {
            acc[loc.id] = loc.userCount || 0;
            return acc;
        }, {});
    }, [locations]);

    // Pagination
    const totalPages = Math.ceil(filteredLocations.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const currentLocations = filteredLocations.slice(startIndex, startIndex + cardsPerPage);

    // Calculate totals
    const totalMachines = locations.reduce((sum, loc) => sum + (loc.machineCount || 0), 0);
    const totalBottles = locations.reduce((sum, loc) => sum + (loc.totalBottlesCollected || 0), 0);
    const totalPoints = locations.reduce((sum, loc) => sum + (loc.totalPoints || 0), 0);

    // Add location handler
    const handleAddLocation = async (newLocation) => {
        try {
            const created = await locationsApi.create(newLocation);
            setLocations([...locations, created]);
            await refreshLocations();
        } catch (err) {
            console.error('Failed to add location:', err);
        }
    };

    // Edit location handler
    const handleEditLocation = async (locationId, updatedData) => {
        try {
            const updated = await locationsApi.update(locationId, updatedData);
            setLocations(prev => prev.map(loc => loc.id === locationId ? { ...loc, ...updated } : loc));
            await refreshLocations();
        } catch (err) {
            console.error('Failed to update location:', err);
        }
    };

    // Refresh handler
    const handleRefresh = () => {
        setRefreshKey(k => k + 1);
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
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isDataLoading}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 transition-all disabled:opacity-50"
                            title="Refresh Locations"
                        >
                            <RefreshCw size={18} className={isDataLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Location</span>
                        </button>
                    </div>
                </div>
            </ViewOnlyWrapper>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 system:bg-[rgba(147,130,220,0.08)] system:border-[rgba(147,130,220,0.2)] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20 system:bg-[rgba(147,130,220,0.15)]">
                            <Building2 size={24} className="text-purple-600 dark:text-purple-400 system:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Locations</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{locations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 system:bg-[rgba(123,160,91,0.08)] system:border-[rgba(123,160,91,0.2)] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 system:bg-[rgba(123,160,91,0.15)]">
                            <Package size={24} className="text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Machines</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalMachines}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 system:bg-[rgba(217,170,60,0.08)] system:border-[rgba(217,170,60,0.2)] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 system:bg-[rgba(217,170,60,0.15)]">
                            <Leaf size={24} className="text-amber-600 dark:text-amber-400 system:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Bottles</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalBottles.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 system:bg-[rgba(96,165,250,0.08)] system:border-[rgba(96,165,250,0.2)] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 system:bg-[rgba(96,165,250,0.15)]">
                            <Coins size={24} className="text-blue-600 dark:text-blue-400 system:text-blue-400" />
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

            {/* Locations Grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {isDataLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonMachineCard key={i} />)
                ) : currentLocations.map((location, index) => {
                    return (
                        <div
                            key={location.id}
                            className="bg-white dark:bg-slate-800/50 system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.15)] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
                                        <Building2 size={24} className="text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{formatField(location.name)}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{formatField(location.fullName)}</p>
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
                                    <span className="truncate">{formatField(location.streetAddress)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <Calendar size={14} className="text-slate-400" />
                                    Joined: {formatDateShort(location.createdAt)}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 system:bg-[rgba(147,130,220,0.08)] rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Users</p>
                                    <p className="text-lg font-black text-purple-600 dark:text-purple-400">
                                        {userCountByLocation[location.id] || 0}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 system:bg-[rgba(123,160,91,0.08)] rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Machines</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">{location.machineCount}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 system:bg-[rgba(96,165,250,0.08)] rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Total Points</p>
                                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{(location.totalPoints || 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 system:bg-[rgba(217,170,60,0.08)] rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Bottles</p>
                                    <p className="text-lg font-black text-amber-600 dark:text-amber-400 system:text-amber-400">{(() => { const b = location.totalBottlesCollected || 0; return b >= 1000 ? `${(b / 1000).toFixed(1)}k` : b; })()}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewAsLocation(location.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium
                                        bg-indigo-100 text-indigo-700 hover:bg-indigo-200
                                        dark:bg-indigo-500/20 dark:text-indigo-400 dark:hover:bg-indigo-500/30
                                        system:bg-[rgba(129,140,248,0.1)] system:text-indigo-400 system:hover:bg-[rgba(129,140,248,0.2)] transition-colors"
                                >
                                    <Eye size={14} />
                                    View As
                                </button>
                                <button
                                    onClick={() => { setEditingLocation(location); setShowEditModal(true); }}
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
                isSuperAdmin={isSuperAdmin}
            />

            {/* Edit Location Modal */}
            <EditLocationModal
                isOpen={showEditModal}
                onClose={() => { setShowEditModal(false); setEditingLocation(null); }}
                onSubmit={handleEditLocation}
                location={editingLocation}
                isSuperAdmin={isSuperAdmin}
            />
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function LocationsPage() {
    return (
        <RequirePermission category="locations">
            <LocationsPageContent />
        </RequirePermission>
    );
}
