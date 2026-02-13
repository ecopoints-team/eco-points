'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// ============================================================================
// CUSTOM DROPDOWN COMPONENT
// A styled dropdown replacement for native <select> elements
// Supports search, icons, and theme-aware styling
// ============================================================================

export default function CustomDropdown({
    value,
    onChange,
    options = [],        // Array of { value, label } or strings
    placeholder = 'Select...',
    icon: Icon = null,   // Optional lucide icon component
    className = '',
    size = 'sm',         // 'sm' | 'md'
    searchable = false,  // Enable search within dropdown
    disabled = false,
    showPlaceholder = true, // Show "All" / clear option in dropdown
    direction = 'down',     // 'down' | 'up' — direction the panel opens
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    // Normalize options to { value, label } format
    const normalizedOptions = options.map(opt =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    // Filter options by search
    const filteredOptions = searchable && search
        ? normalizedOptions.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        )
        : normalizedOptions;

    // Find selected label
    const selectedLabel = normalizedOptions.find(opt => opt.value === value)?.label;

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opening
    useEffect(() => {
        if (isOpen && searchable && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (optValue) => {
        onChange(optValue);
        setIsOpen(false);
        setSearch('');
    };

    const sizeClasses = size === 'md'
        ? 'px-4 py-2.5 text-sm'
        : 'px-3 py-2 text-sm';

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center justify-between gap-2 w-full rounded-lg border transition-all outline-none
                    ${sizeClasses}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500/50'}
                    ${isOpen
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/10 bg-white dark:bg-slate-800'
                        : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'
                    }
                    text-slate-700 dark:text-slate-200
                `}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />}
                    <span className={`truncate ${!selectedLabel ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                        {selectedLabel || placeholder}
                    </span>
                </div>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className={`absolute z-50 w-full min-w-[180px] rounded-xl border shadow-xl overflow-hidden
                    bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700
                    ${direction === 'up' ? 'bottom-full mb-1 animate-in slide-in-from-bottom duration-200' : 'mt-1 animate-in slide-in-from-top duration-200'}`}>

                    {/* Search Input */}
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 dark:border-slate-700/50">
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800
                                    text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    {/* Options List */}
                    <div className="max-h-56 overflow-y-auto py-1">
                        {/* "All" / placeholder option */}
                        {showPlaceholder && (
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                                ${value === ''
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <span>{placeholder}</span>
                                {value === '' && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                            </button>
                        )}

                        {filteredOptions.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                                    ${value === opt.value
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <span className="truncate">{opt.label}</span>
                                {value === opt.value && <Check size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                            </button>
                        ))}

                        {searchable && filteredOptions.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
