'use client';
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Repeatable editor for reward variants.
 *
 * Each variant row: { id?, varietyName, stockQuantity, pointsRequired, samePrice }
 *   samePrice = true  → stores null (inherit main price)
 *   samePrice = false → admin enters custom pointsRequired
 */
export default function RewardVariantEditor({ variants = [], mainPrice = '', onChange }) {
    const update = (idx, patch) => {
        const next = variants.map((v, i) => (i === idx ? { ...v, ...patch } : v));
        onChange(next);
    };

    const addRow = () => {
        onChange([
            ...variants,
            { varietyName: '', stockQuantity: '', pointsRequired: null, samePrice: true },
        ]);
    };

    const removeRow = (idx) => {
        onChange(variants.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variants</label>
                <button type="button" onClick={addRow}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                    <Plus size={14} /> Add Variant
                </button>
            </div>

            {variants.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No variants yet. Add one (e.g. "Red - Medium") or leave empty for a single default item.
                </p>
            )}

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {variants.map((v, idx) => (
                    <div key={v.id ?? `new-${idx}`}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Variant name (e.g. Red - Medium)"
                                value={v.varietyName || ''}
                                onChange={(e) => update(idx, { varietyName: e.target.value })}
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button type="button" onClick={() => removeRow(idx)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Stock</label>
                                <input
                                    type="number" min="0"
                                    value={v.stockQuantity ?? ''}
                                    onChange={(e) => update(idx, { stockQuantity: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Points Price</label>
                                <input
                                    type="number" min="0"
                                    placeholder="Variant price"
                                    aria-label="Same price as main"
                                    disabled={v.samePrice}
                                    value={v.samePrice ? (mainPrice || '') : (v.pointsRequired ?? '')}
                                    onChange={(e) => update(idx, { pointsRequired: e.target.value })}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!v.samePrice}
                                aria-label="Same price as main"
                                onChange={(e) => update(idx, {
                                    samePrice: e.target.checked,
                                    pointsRequired: e.target.checked ? null : (v.pointsRequired ?? ''),
                                })}
                                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                            />
                            Same price as main product ({mainPrice || 0} pts)
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
