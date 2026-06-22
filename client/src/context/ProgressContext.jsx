'use client';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

const ProgressContext = createContext(null);

export function useProgress() {
    const ctx = useContext(ProgressContext);
    if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
    return ctx;
}

export function ProgressProvider({ children }) {
    // phase: 'idle' | 'running' | 'success'
    const [state, setState] = useState({ phase: 'idle', label: '' });
    const timerRef = useRef(null);

    /**
     * Run an async function while showing a blocking progress overlay.
     * @param {string} label   text shown under the spinner
     * @param {() => Promise<any>} fn  the async work
     * @param {{ successLabel?: string, successMs?: number }} [opts]
     * @returns the resolved value of fn (errors are re-thrown to the caller)
     */
    const runWithProgress = useCallback(async (label, fn, opts = {}) => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        setState({ phase: 'running', label });
        try {
            const result = await fn();
            setState({ phase: 'success', label: opts.successLabel || 'Done' });
            timerRef.current = setTimeout(
                () => setState({ phase: 'idle', label: '' }),
                opts.successMs ?? 700,
            );
            return result;
        } catch (err) {
            setState({ phase: 'idle', label: '' });
            throw err;
        }
    }, []);

    const visible = state.phase === 'running' || state.phase === 'success';

    return (
        <ProgressContext.Provider value={{ runWithProgress, isBusy: state.phase === 'running' }}>
            {children}
            {visible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                     role="alertdialog" aria-busy={state.phase === 'running'} aria-live="polite">
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white dark:bg-slate-800 px-10 py-8 shadow-2xl border border-slate-200 dark:border-slate-700">
                        {state.phase === 'running' ? (
                            <Loader2 size={40} className="text-emerald-500 animate-spin" />
                        ) : (
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        )}
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{state.label}</p>
                    </div>
                </div>
            )}
        </ProgressContext.Provider>
    );
}
