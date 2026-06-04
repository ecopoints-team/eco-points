'use client';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import SlotCounter from '../../src/components/shared/SlotCounter';
import { useAuth } from '../../src/context/AuthContext';
import { useDashboardCache } from '../../src/context/DashboardCacheContext';
import { formatDate } from '../../src/utils/formatDate';
import { detectedClassLabel } from '../../src/lib/enumLabels';
import { Activity, Zap, TrendingUp, Box, Users, FileText, Package, Settings, User, MapPin, Clock, Trophy, Building2, BarChart3, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { SkeletonCard, SkeletonChart } from '../../src/components/admin/SkeletonLoaders';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';



// DUAL-THEME STAT CARD
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
    const themeMap = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 system:bg-emerald-500/10 system:text-emerald-400 system:border-emerald-500/20',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 system:bg-cyan-500/10 system:text-cyan-400 system:border-cyan-500/20',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 system:bg-amber-500/10 system:text-amber-400 system:border-amber-500/20',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 system:bg-purple-500/10 system:text-purple-400 system:border-purple-500/20',
    };

    const themeClass = themeMap[color] || themeMap.emerald;
    const glowColorMap = {
        emerald: 'bg-emerald-500',
        blue: 'bg-cyan-500',
        amber: 'bg-amber-500',
        purple: 'bg-purple-500',
    };
    const glowColor = glowColorMap[color] || 'bg-emerald-500';

    // Subtle gradient tint per card color
    const cardGradient = {
        emerald: 'from-emerald-50/80 to-white dark:from-emerald-500/5 dark:to-[#1e293b]/60 system:from-emerald-500/5 system:to-[#1A2E1F]',
        blue: 'from-blue-50/80 to-white dark:from-cyan-500/5 dark:to-[#1e293b]/60 system:from-cyan-500/5 system:to-[#1A2E1F]',
        amber: 'from-amber-50/80 to-white dark:from-amber-500/5 dark:to-[#1e293b]/60 system:from-amber-500/5 system:to-[#1A2E1F]',
        purple: 'from-purple-50/80 to-white dark:from-purple-500/5 dark:to-[#1e293b]/60 system:from-purple-500/5 system:to-[#1A2E1F]',
    };
    const cardBorderColor = {
        emerald: 'border-emerald-200/60 dark:border-emerald-500/20 system:border-emerald-500/15',
        blue: 'border-blue-200/60 dark:border-cyan-500/20 system:border-cyan-500/15',
        amber: 'border-amber-200/60 dark:border-amber-500/20 system:border-amber-500/15',
        purple: 'border-purple-200/60 dark:border-purple-500/20 system:border-purple-500/15',
    };

    return (
        <div className={`
            relative overflow-hidden p-6 rounded-2xl transition-all duration-500 group
            bg-gradient-to-br ${cardGradient[color] || cardGradient.emerald}
            border ${cardBorderColor[color] || cardBorderColor.emerald}
            shadow-sm hover:shadow-lg
            dark:backdrop-blur-xl dark:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]
            system:shadow-[0_0_15px_rgba(0,0,0,0.3)] system:hover:shadow-[0_0_25px_rgba(0,0,0,0.4)]
        `}>
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 dark:opacity-20 system:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-40 system:group-hover:opacity-40 transition-opacity duration-700 ${glowColor}`}></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
                <div className={`p-3 rounded-xl border ${themeClass} group-hover:scale-110 transition-transform duration-500 mb-3`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white system:text-[#E1E4E1] font-sans tracking-tight flex items-baseline gap-1">
                    <SlotCounter value={parseInt(String(value).replace(/,/g, ''))} />
                </h3>
                {subtext && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${themeClass}`}>
                            {subtext}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// SHORTCUT BUTTON COMPONENT - Full Width Layout
const ShortcutBtn = ({ label, icon: Icon, color, href }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500 system:bg-emerald-500/5 system:text-emerald-400 system:border-emerald-500/15 system:hover:bg-emerald-500/10 system:hover:border-emerald-500/30',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500 system:bg-blue-500/5 system:text-blue-400 system:border-blue-500/15 system:hover:bg-blue-500/10 system:hover:border-blue-500/30',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500 system:bg-amber-500/5 system:text-amber-400 system:border-amber-500/15 system:hover:bg-amber-500/10 system:hover:border-amber-500/30',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:border-purple-500 system:bg-purple-500/5 system:text-purple-400 system:border-purple-500/15 system:hover:bg-purple-500/10 system:hover:border-purple-500/30',
    };
    const style = colors[color] || colors.emerald;

    return (
        <Link href={href} className={`flex-1 min-w-[140px] flex flex-col items-center justify-center gap-3 px-5 py-5 rounded-xl border border-transparent transition-all duration-300 group ${style}`}>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0f172a] system:bg-[#0F1B11] shadow-md group-hover:scale-110 transition-transform">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-sm font-bold text-center">{label}</span>
        </Link>
    );
}

// Custom Tooltip Component for Charts - Styled like reference
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800/95 system:bg-[#1A2E1F]/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-600 system:border-[rgba(123,160,91,0.3)] min-w-[140px]">
                <p className="text-sm font-bold text-gray-900 dark:text-white system:text-[#E1E4E1] mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs text-gray-500 dark:text-slate-400 system:text-[#E1E4E1]/60">{entry.name}:</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white system:text-[#E1E4E1] ml-auto">{entry.value?.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// Custom Tooltip for Pie Chart - Styled (no percentage since labels show it)
const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        const fillColor = data?.payload?.fill || data?.color || '#10b981';
        return (
            <div className="bg-white dark:bg-slate-800/95 system:bg-[#1A2E1F]/95 backdrop-blur-md rounded-xl p-3 shadow-xl border border-slate-200 dark:border-slate-600 system:border-[rgba(123,160,91,0.3)]">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: fillColor }} />
                    <div>
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 system:text-[#E1E4E1]/60 block">{data?.name || '-'}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white system:text-[#E1E4E1]">{data?.value?.toLocaleString() || 0} bottles</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, currentUser, hasPermission } = useAuth();
    const { stats, bottleLogs, isLoading: isDataLoading, isRefreshing, fetchDashboard } = useDashboardCache();
    const [timeRange, setTimeRange] = useState('month');
    const [chartType, setChartType] = useState('line');
    const [mounted, setMounted] = useState(false);

    // Delay chart rendering until browser has completed at least one full paint
    // cycle — double-rAF ensures layout is stable before Recharts measures.
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => setMounted(true));
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // Load dashboard data from cache (skips refetch if data is still fresh)
    useEffect(() => {
        fetchDashboard(effectiveLocationId);
    }, [effectiveLocationId, fetchDashboard]);

    // Location-specific chart data with accepted/rejected
    const chartData = useMemo(() => {
        // Return empty data during SSR to prevent hydration mismatch
        if (!mounted) {
            return {
                week: { labels: [], accepted: [], rejected: [], maxValue: 10 },
                month: { labels: [], accepted: [], rejected: [], maxValue: 10 },
                year: { labels: [], accepted: [], rejected: [], maxValue: 10 }
            };
        }

        const logs = bottleLogs;
        const now = new Date();

        // Helper: classify status
        const isAccepted = (l) => ['Accepted', 'Completed', 'Success'].includes(l.status);
        const isRejected = (l) => ['Rejected', 'Failed', 'Error'].includes(l.status);

        // ── 1. WEEKLY: Real-time 7-day window (Mon → Sun of current week) ──
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        // Find Monday of the current week (ISO week: Monday = 1)
        const currentDay = now.getDay(); // 0=Sun, 1=Mon,...
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);

        const weeklyAccepted = [];
        const weeklyRejected = [];
        for (let i = 0; i < 7; i++) {
            const dayStart = new Date(monday);
            dayStart.setDate(monday.getDate() + i);
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            const dayLogs = logs.filter(l => l.timestampObj >= dayStart && l.timestampObj <= dayEnd);
            weeklyAccepted.push(dayLogs.filter(isAccepted).length);
            weeklyRejected.push(dayLogs.filter(isRejected).length);
        }

        // ── 2. MONTHLY: Jan → Dec of the current year (real-time) ──
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = now.getFullYear();
        const monthlyAccepted = new Array(12).fill(0);
        const monthlyRejected = new Array(12).fill(0);
        logs.forEach(log => {
            const d = log.timestampObj;
            if (d && d.getFullYear() === currentYear) {
                const m = d.getMonth();
                if (isAccepted(log)) monthlyAccepted[m]++;
                else if (isRejected(log)) monthlyRejected[m]++;
            }
        });

        // ── 3. YEARLY: One point per year, dynamically grows ──
        // Find the range of years present in the data
        const yearSet = new Set();
        yearSet.add(currentYear); // Always include current year
        logs.forEach(log => {
            if (log.timestampObj) yearSet.add(log.timestampObj.getFullYear());
        });
        const years = [...yearSet].sort((a, b) => a - b);
        const yearlyLabels = years.map(String);
        const yearlyAccepted = years.map(() => 0);
        const yearlyRejected = years.map(() => 0);
        logs.forEach(log => {
            if (log.timestampObj) {
                const yIdx = years.indexOf(log.timestampObj.getFullYear());
                if (yIdx !== -1) {
                    if (isAccepted(log)) yearlyAccepted[yIdx]++;
                    else if (isRejected(log)) yearlyRejected[yIdx]++;
                }
            }
        });

        const getMax = (arr1, arr2) => Math.max(...arr1, ...arr2, 10);

        return {
            week: {
                labels: dayNames,
                accepted: weeklyAccepted,
                rejected: weeklyRejected,
                maxValue: getMax(weeklyAccepted, weeklyRejected)
            },
            month: {
                labels: monthNames,
                accepted: monthlyAccepted,
                rejected: monthlyRejected,
                maxValue: getMax(monthlyAccepted, monthlyRejected)
            },
            year: {
                labels: yearlyLabels,
                accepted: yearlyAccepted,
                rejected: yearlyRejected,
                maxValue: getMax(yearlyAccepted, yearlyRejected)
            }
        };
    }, [bottleLogs, mounted]);

    const currentData = chartData[timeRange];

    // Get location ranking info
    const locationRanking = useMemo(() => {
        if (isSuperAdmin && !effectiveLocationId) return null;
        const location = allLocations.find(l => l.id === effectiveLocationId);
        if (!location) return null;
        const sorted = [...allLocations].sort((a, b) => (b.totalBottlesCollected || 0) - (a.totalBottlesCollected || 0));
        const rank = sorted.findIndex(l => l.id === effectiveLocationId) + 1;
        return { rank, total: allLocations.length, name: location.name };
    }, [effectiveLocationId, isSuperAdmin, allLocations]);

    // Location-specific recent transactions (from API-loaded bottle logs)
    const recentTransactions = useMemo(() => {
        const sorted = [...bottleLogs].sort((a, b) => (b.timestampObj || 0) - (a.timestampObj || 0));
        return sorted.slice(0, 8);
    }, [bottleLogs]);

    return (
        <>
            {/* Location Ranking Banner for Location Admins */}
            {locationRanking && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800 dark:text-amber-300">
                                {locationRanking.name} Ranking
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                Your school is ranked <strong>#{locationRanking.rank}</strong> of {locationRanking.total} schools in bottle collection!
                            </p>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-amber-600 dark:text-amber-400">
                        #{locationRanking.rank}
                    </div>
                </div>
            )}

            {/* Super Admin Global Stats Banner */}
            {isSuperAdmin && !effectiveLocationId && (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 system:from-indigo-900/20 system:to-blue-900/20 border border-indigo-200 dark:border-indigo-500/30 system:border-indigo-500/20 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 system:bg-indigo-500/15">
                        <Building2 size={24} className="text-indigo-600 dark:text-indigo-400 system:text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-bold text-indigo-800 dark:text-indigo-300 system:text-indigo-300">Global Super Admin View</p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400 system:text-indigo-400/70">
                            Viewing aggregated data across <strong>{allLocations.length} locations</strong>. Use "View as" to filter by specific school.
                        </p>
                    </div>
                </div>
            )}

            {/* 1. Statistics Row - Location Filtered */}
            {isDataLoading && !stats.totalBottles ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Bottles"
                    value={stats.totalBottles.toLocaleString()}

                    color="emerald"
                    icon={Box}
                />
                <StatCard
                    title="Points Distributed"
                    value={stats.totalPoints.toLocaleString()}

                    color="blue"
                    icon={Zap}
                />
                <StatCard
                    title="Active Machines"
                    value={stats.onlineMachines.toString()}
                    subtext={`of ${stats.totalMachines} total`}
                    color="amber"
                    icon={Activity}
                />
                <StatCard
                    title="Online Users"
                    value={stats.activeUsers.toString()}

                    color="purple"
                    icon={Users}
                />
            </div>
            )}

            {/* 2. Recycling Trends - Full Width with Recharts */}
            <div className="rounded-2xl p-6 shadow-xl relative transition-all duration-500 mb-8
                bg-white border border-slate-200
                dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50
                system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)] system:shadow-[0_0_20px_rgba(123,160,91,0.1)]">

                {/* Header with Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white system:text-[#E1E4E1] mb-1 flex items-center gap-2">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981] system:shadow-[0_0_10px_rgba(123,160,91,0.5)]"></span>
                            Recycling Analytics
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">
                            {currentLocation ? `${currentLocation.name} - ` : ''}Bottles recycled over time
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Refresh Button */}
                        <button
                            onClick={() => fetchDashboard(effectiveLocationId, { force: true, silent: true })}
                            disabled={isRefreshing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                                bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200
                                dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700
                                system:bg-[#0F1B11] system:text-[#E1E4E1]/70 system:hover:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)]
                                disabled:opacity-50"
                            title="Refresh data"
                        >
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        {/* Chart Type Toggle with Sliding Indicator */}
                        <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            {/* Sliding Background */}
                            <div
                                className="absolute top-1 bottom-1 w-8 rounded-md bg-indigo-500 shadow-md transition-transform duration-300 ease-out"
                                style={{
                                    transform: `translateX(${chartType === 'line' ? '0px' : chartType === 'bar' ? '32px' : '64px'})`,
                                }}
                            />
                            <button
                                onClick={() => setChartType('line')}
                                className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${chartType === 'line'
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'
                                    }`}
                                title="Line Chart"
                            >
                                <TrendingUp size={16} />
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${chartType === 'bar'
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'
                                    }`}
                                title="Bar Chart"
                            >
                                <BarChart3 size={16} />
                            </button>
                            <button
                                onClick={() => setChartType('pie')}
                                className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${chartType === 'pie'
                                    ? 'text-white'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'
                                    }`}
                                title="Pie Chart"
                            >
                                <PieChartIcon size={16} />
                            </button>
                        </div>

                        {/* Time Range Pills with Sliding Indicator */}
                        <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            {/* Sliding Background */}
                            <div
                                className="absolute top-1 bottom-1 w-[64px] rounded-md bg-emerald-500 shadow-md transition-transform duration-300 ease-out"
                                style={{
                                    transform: `translateX(${timeRange === 'week' ? '0px' : timeRange === 'month' ? '64px' : '128px'})`,
                                }}
                            />
                            {[
                                { key: 'week', label: 'Weekly' },
                                { key: 'month', label: 'Monthly' },
                                { key: 'year', label: 'Yearly' }
                            ].map((range) => (
                                <button
                                    key={range.key}
                                    onClick={() => setTimeRange(range.key)}
                                    className={`relative z-10 w-[64px] py-1.5 rounded-md text-xs font-medium transition-colors duration-200 text-center ${timeRange === range.key
                                        ? 'text-white'
                                        : 'text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Container — only render after mount so Recharts can measure a real DOM size */}
                {mounted ? (
                    <div className="w-full h-80 transition-all duration-300">
                        <ResponsiveContainer key={`${chartType}-${timeRange}`} width="100%" height="100%">
                        {chartType === 'line' ? (
                            <LineChart data={currentData.labels.map((label, i) => ({
                                name: label,
                                accepted: currentData.accepted[i],
                                rejected: currentData.rejected[i]
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.3)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" formatter={(value) => <span style={{ marginRight: '12px', color: '#9ca3af' }}>{value}</span>} />
                                <Line
                                    type="monotone"
                                    dataKey="accepted"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                                    name="Accepted"
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rejected"
                                    stroke="#ef4444"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, fill: '#ef4444', stroke: '#fff', strokeWidth: 3 }}
                                    name="Rejected"
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                    animationBegin={200}
                                />
                            </LineChart>
                        ) : chartType === 'bar' ? (
                            <BarChart data={currentData.labels.map((label, i) => ({
                                name: label,
                                accepted: currentData.accepted[i],
                                rejected: currentData.rejected[i]
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 200, 200, 0.3)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    style={{ fontSize: '12px' }}
                                    tick={{ fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'rgba(156, 163, 175, 0.15)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" formatter={(value) => <span style={{ marginRight: '12px', color: '#9ca3af' }}>{value}</span>} />
                                <Bar
                                    dataKey="accepted"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    name="Accepted"
                                    animationDuration={600}
                                    animationEasing="ease-out"
                                />
                                <Bar
                                    dataKey="rejected"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    name="Rejected"
                                    animationDuration={600}
                                    animationEasing="ease-out"
                                    animationBegin={150}
                                />
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={currentData.labels
                                        .map((label, i) => ({ name: label, value: currentData.accepted[i] + currentData.rejected[i] }))
                                        .filter(item => item.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={100}
                                    fill="#10b981"
                                    dataKey="value"
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {currentData.labels.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={[
                                                '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b',
                                                '#ec4899', '#6366f1', '#14b8a6', '#f97316',
                                                '#84cc16', '#a855f7', '#22c55e', '#0ea5e9'
                                            ][index % 12]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} isAnimationActive={true} />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                                    iconType="circle"
                                    formatter={(value) => <span style={{ marginRight: '12px', color: '#9ca3af' }}>{value}</span>}
                                />
                            </PieChart>
                        )}
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="w-full h-80 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    </div>
                )}

                {/* Summary Statistics - Updated to show Accepted/Rejected + Peak Period */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">Total Transactions</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white system:text-[#E1E4E1]">
                            {(currentData.accepted.reduce((sum, val) => sum + val, 0) + currentData.rejected.reduce((sum, val) => sum + val, 0)).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">Success Rate</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">
                            {(() => {
                                const total = currentData.accepted.reduce((sum, val) => sum + val, 0) + currentData.rejected.reduce((sum, val) => sum + val, 0);
                                const accepted = currentData.accepted.reduce((sum, val) => sum + val, 0);
                                return total > 0 ? `${((accepted / total) * 100).toFixed(1)}%` : '0%';
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">
                            Peak {timeRange === 'week' ? 'Day' : timeRange === 'month' ? 'Month' : 'Year'}
                        </p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400 system:text-amber-400">
                            {(() => {
                                const totals = currentData.accepted.map((val, i) => val + currentData.rejected[i]);
                                const maxIndex = totals.indexOf(Math.max(...totals));
                                return currentData.labels[maxIndex] || '-';
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">Bottles Accepted</p>
                        <p className="text-xl font-bold text-teal-600 dark:text-teal-400 system:text-teal-400">
                            {currentData.accepted.reduce((sum, val) => sum + val, 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">Bottles Rejected</p>
                        <p className="text-xl font-bold text-red-500 dark:text-red-400">
                            {currentData.rejected.reduce((sum, val) => sum + val, 0).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Quick Actions - Full Width Grid Layout */}
            <div className="rounded-2xl p-6 shadow-xl transition-all duration-500 mb-8
                bg-white border border-slate-200
                dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50
                system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)] system:shadow-[0_0_20px_rgba(123,160,91,0.1)]">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white system:text-[#E1E4E1] mb-6 flex items-center gap-2">
                    <Settings size={18} className="text-violet-500 dark:text-violet-400 system:text-violet-400 animate-spin-slow" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Permission-based Shortcuts */}
                    {(isSuperAdmin || hasPermission('rewards', 'view')) && (
                        <ShortcutBtn label="Rewards" icon={Trophy} color="purple" href="/admin/rewards" />
                    )}

                    {(isSuperAdmin || hasPermission('users', 'view')) && (
                        <ShortcutBtn label="Manage Users" icon={Users} color="emerald" href="/admin/users" />
                    )}

                    {(isSuperAdmin || hasPermission('logs', 'view')) && (
                        <ShortcutBtn label="Admin Logs" icon={FileText} color="blue" href="/admin/logs/access" />
                    )}

                    {(isSuperAdmin || hasPermission('machines', 'view')) && (
                        <ShortcutBtn label="Machines" icon={Package} color="amber" href="/admin/machines" />
                    )}
                </div>
            </div>

            {/* 3. Recent Transactions Table - Location Filtered */}
            <div className="bg-white dark:bg-slate-800/50 system:bg-[#1A2E1F] rounded-2xl border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)] shadow-xl system:shadow-[0_0_20px_rgba(123,160,91,0.1)] overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 system:bg-[#0F1B11]/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white system:text-[#E1E4E1] flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-cyan-500 system:bg-cyan-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#06b6d4] system:shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
                        Real-Time Bottle Logs {currentLocation && <span className="text-sm font-normal text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">({currentLocation.name})</span>}
                    </h3>
                    <Link href="/admin/logs/bottles" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 system:text-indigo-400 system:hover:text-indigo-300 transition-colors">
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]
                            bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300 system:bg-[#0F1B11] system:text-[#E1E4E1]/60">
                            <tr>
                                <th className="px-3 py-3">User ID</th>
                                <th className="px-3 py-3">Username</th>
                                <th className="px-3 py-3">Email</th>
                                <th className="px-3 py-3">Location</th>
                                <th className="px-3 py-3">Detected Class</th>
                                <th className="px-3 py-3">Confidence</th>
                                <th className="px-3 py-3">Points</th>
                                <th className="px-3 py-3">Timestamp</th>
                                <th className="px-3 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 system:divide-[rgba(123,160,91,0.1)]">
                            {recentTransactions.map((log) => (
                                <tr
                                    key={log.id}
                                    className={`transition-colors ${log.status === 'Rejected'
                                        ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-900/10 dark:hover:bg-red-900/20 system:bg-red-900/10 system:hover:bg-red-900/20'
                                        : 'hover:bg-slate-50 dark:hover:bg-emerald-900/10 system:hover:bg-[rgba(123,160,91,0.1)]'
                                        }`}
                                >
                                    <td className="px-3 py-3">
                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/50">{log.userId}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="text-sm font-medium text-slate-800 dark:text-white system:text-[#E1E4E1]">{log.userName}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">{log.userEmail}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="text-sm text-slate-600 dark:text-slate-300 system:text-[#E1E4E1]">{log.locationName}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]">{detectedClassLabel(log.detectedClass)}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className="text-sm text-slate-600 dark:text-slate-300 system:text-[#E1E4E1]">{log.confidenceScore != null ? `${(log.confidenceScore * 100).toFixed(1)}%` : '—'}</span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`font-bold ${log.pointsAwarded > 0 ? 'text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]' : 'text-red-500'}`}>
                                            {log.pointsAwarded > 0 ? `+${log.pointsAwarded}` : '0'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60">
                                            <Clock size={12} />
                                            {formatDate(log.timestamp)}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                                            ${log.status === 'Accepted'
                                                ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 system:bg-teal-500/15 system:text-teal-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 system:bg-red-500/15 system:text-red-400'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
