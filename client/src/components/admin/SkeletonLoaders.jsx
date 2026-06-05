'use client';
import React from 'react';

/**
 * Skeleton loading placeholder components for admin pages.
 * Used for progressive rendering while data loads.
 */

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`animate-pulse rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700/50 rounded" />
        </div>
    );
}

export function SkeletonChart({ className = '', height = 'h-64' }) {
    return (
        <div className={`animate-pulse rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className={`${height} bg-slate-100 dark:bg-slate-700/30 rounded-xl flex items-end gap-2 p-4`}>
                {[40, 65, 50, 80, 55, 70, 45, 60, 75, 50, 85, 40].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700/50 rounded-t-md" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
    );
}

export function SkeletonTableRow({ columns = 6 }) {
    return (
        <tr className="animate-pulse border-b border-slate-100 dark:border-slate-700/50">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${i === 0 ? 'w-8' : i === 1 ? 'w-32' : 'w-20'}`} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonTable({ rows = 5, columns = 6, className = '' }) {
    return (
        <div className={`animate-pulse rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="flex gap-2">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
            </div>
            {/* Rows */}
            <table className="w-full">
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonRewardCard() {
    return (
        <div className="animate-pulse rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
            <div className="h-40 bg-slate-200 dark:bg-slate-700" />
            <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-700/50 rounded" />
                <div className="flex justify-between items-center mt-2">
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Stats cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonChart />
                <SkeletonChart />
            </div>
            {/* Table */}
            <SkeletonTable rows={5} columns={5} />
        </div>
    );
}
