'use client';
import React, { useState, useEffect } from 'react';
import { X, Wrench, Activity, Trash2, ChevronRight, Loader2, Save, FileText, Settings, CheckCircle2 } from 'lucide-react';
import { createMachineLog } from '../../services/api/logs';
import { getAll as getMachines } from '../../services/api/machines';
import { useAuth } from '../../context/AuthContext';
import CustomDropdown from './CustomDropdown';

const CATEGORY_DATA = {
    maintenance: {
        title: 'Maintenance',
        icon: Wrench,
        description: 'Cable, Sensor, Camera, Motor',
        actions: ['Cable Maintenance', 'Sensor Error', 'Camera Error', 'Connection Error', 'Motor Failure'],
        color: 'emerald'
    },
    diagnostics: {
        title: 'Diagnostics',
        icon: Activity,
        description: 'Machine Checkup, Software Update',
        actions: ['Machine Checkup', 'Software Update'],
        color: 'blue'
    },
    clearing: {
        title: 'Clearing',
        icon: Trash2,
        description: 'Bin Full, Storage Reset',
        actions: ['Bin Full', 'Storage Reset'],
        color: 'amber'
    },
};

const QUICK_NOTES = [
    'Issues Resolved',
    'Bin Cleared',
    'Needs Further Review',
    'Maintenance Complete',
];

export default function TechnicianActionModal({ isOpen, onClose }) {
    const { currentLocation, effectiveLocationId } = useAuth();
    
    // Step 1: Selection (Machine, Category, Action)
    // Step 2: Notes & Submission
    const [step, setStep] = useState(1);

    // Form State
    const [selectedMachineId, setSelectedMachineId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('Pending');

    const [machines, setMachines] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMachines();
            resetForm();
        }
    }, [isOpen, effectiveLocationId]);

    const loadMachines = async () => {
        setIsLoading(true);
        try {
            const data = await getMachines(effectiveLocationId);
            setMachines(data);
            if (data.length === 1) {
                setSelectedMachineId(data[0].id);
            }
        } catch (err) {
            console.error('Failed to load machines:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setStep(1);
        setSelectedMachineId(machines.length === 1 ? machines[0].id : '');
        setSelectedCategory('');
        setSelectedAction('');
        setNotes('');
        setStatus('Pending');
        setError('');
        setSuccessMessage('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleQuickNote = (note) => {
        setNotes(prev => prev ? `${prev}\n${note}` : note);
    };

    const proceedToNotes = () => {
        if (!selectedMachineId) {
            setError('Please select a machine first.');
            return;
        }
        if (!selectedCategory || !selectedAction) {
            setError('Please select a category and an action.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async (submitStatus) => {
        setIsSubmitting(true);
        setError('');
        try {
            await createMachineLog({
                rvmId: selectedMachineId,
                actionType: selectedAction,
                status: submitStatus,
                notes: notes,
            });
            setSuccessMessage(`Maintenance log submitted successfully as ${submitStatus}.`);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit maintenance log.');
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const roleColors = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/30',
        amber: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/30',
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
                                <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Technician Portal</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Log machine maintenance and diagnostics</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col flex-1 overflow-y-auto p-6 space-y-6">
                    {successMessage ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Success!</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center">{successMessage}</p>
                        </div>
                    ) : step === 1 ? (
                        <>
                            {/* Step 1: Select Machine */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">1. Select Target Machine</label>
                                {isLoading ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 size={16} className="animate-spin" /> Loading machines...
                                    </div>
                                ) : (
                                    <CustomDropdown
                                        value={selectedMachineId}
                                        onChange={setSelectedMachineId}
                                        options={machines.map(m => ({ value: m.id, label: `${m.name} (${m.status})` }))}
                                        placeholder="Select a machine..."
                                        searchable
                                    />
                                )}
                            </div>

                            {/* Step 2: Select Category */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">2. Select Concern Category</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {Object.entries(CATEGORY_DATA).map(([key, data]) => {
                                        const Icon = data.icon;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => { setSelectedCategory(key); setSelectedAction(''); }}
                                                className={`p-4 rounded-xl text-left transition-all border-2 flex flex-col items-center justify-center gap-2 ${
                                                    selectedCategory === key 
                                                        ? roleColors[data.color] 
                                                        : 'bg-slate-50 dark:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <Icon size={24} className={selectedCategory === key ? '' : 'text-slate-500'} />
                                                <span className={`font-semibold text-center ${selectedCategory === key ? '' : 'text-slate-700 dark:text-slate-300'}`}>{data.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Step 3: Select Action */}
                            {selectedCategory && (
                                <div className="space-y-3 animate-fade-in">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">3. Select Specific Action</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORY_DATA[selectedCategory].actions.map(action => (
                                            <button
                                                key={action}
                                                type="button"
                                                onClick={() => setSelectedAction(action)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                                    selectedAction === action
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {action}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={proceedToNotes}
                                    disabled={!selectedMachineId || !selectedCategory || !selectedAction}
                                    className="py-2 px-6 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Proceed to Notes
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step 4: Notes and Submit */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Selected Action</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">{selectedAction}</p>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Change</button>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Maintenance Notes</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Describe the issue or resolution..."
                                        className="w-full h-32 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Quick Notes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {QUICK_NOTES.map(note => (
                                            <button
                                                key={note}
                                                type="button"
                                                onClick={() => handleQuickNote(note)}
                                                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                + {note}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="pt-6 flex gap-3">
                                    <button
                                        onClick={() => handleSubmit('Pending')}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 rounded-xl border-2 border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-500/50 dark:text-amber-400 dark:hover:bg-amber-500/10 transition-colors font-bold flex justify-center items-center gap-2"
                                    >
                                        {isSubmitting && status === 'Pending' ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                        Needs Review
                                    </button>
                                    <button
                                        onClick={() => handleSubmit('Resolved')}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-bold flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        {isSubmitting && status === 'Resolved' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Mark as Resolved
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
