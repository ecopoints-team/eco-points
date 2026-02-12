'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ============================================================================
// PAGE SIZE SELECTOR COMPONENT
// A compact custom dropdown for selecting rows-per-page in tables.
// Opens upward (since it's typically at the bottom of tables).
// ============================================================================

export default function PageSizeSelector({
    value,
    onChange,
    options = [5, 10, 20, 50, 100, 150, 200],
    label = 'Rows:',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="flex items-center gap-2">
            {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
            <div ref={dropdownRef} className="relative">
                {/* Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        flex items-center gap-1.5 px-2.5 py-1 text-sm rounded-lg border transition-all cursor-pointer
                        ${isOpen
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/10 bg-white dark:bg-slate-800'
                            : 'border-slate-200 bg-white hover:border-emerald-400 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50'
                        }
                        text-slate-700 dark:text-slate-200
                    `}
                >
                    <span className="font-medium">{value}</span>
                    <ChevronDown
                        size={12}
                        className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown - opens UPWARD */}
                {isOpen && (
                    <div className="absolute bottom-full mb-1 right-0 min-w-[80px] rounded-xl border shadow-xl overflow-hidden z-50
                        bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700
                        animate-in slide-in-from-bottom duration-200">
                        <div className="py-1">
                            {options.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center justify-between gap-2 transition-colors
                                        ${value === opt
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <span>{opt}</span>
                                    {value === opt && <Check size={12} className="text-emerald-600 dark:text-emerald-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
