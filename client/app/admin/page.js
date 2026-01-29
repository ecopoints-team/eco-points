'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SlotCounter from '../../src/Components/SlotCounter';
import { useAuth } from '../../src/context/AuthContext';
import { MACHINES, USERS, REWARDS, LOCATIONS, BOTTLE_LOGS, getMachinesByLocation, getRewardsByLocation, getUsersByLocation, filterByLocation } from '../../src/data/mockData';
import { Activity, Zap, TrendingUp, Box, Users, FileText, Package, Settings, User, MapPin, Clock, Trophy, Building2, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// DUAL-THEME STAT CARD
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
    const themeMap = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 system:bg-[#1A2E1F] system:text-[#7BA05B] system:border-[rgba(123,160,91,0.3)]',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 system:bg-[#1A2E1F] system:text-cyan-400 system:border-[rgba(123,160,91,0.3)]',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 system:bg-[#1A2E1F] system:text-amber-400 system:border-[rgba(123,160,91,0.3)]',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 system:bg-[#1A2E1F] system:text-purple-400 system:border-[rgba(123,160,91,0.3)]',
    };

    const themeClass = themeMap[color] || themeMap.emerald;
    const glowColorMap = {
        emerald: 'bg-emerald-500',
        blue: 'bg-cyan-500',
        amber: 'bg-amber-500',
        purple: 'bg-purple-500',
    };
    const glowColor = glowColorMap[color] || 'bg-emerald-500';

    return (
        <div className={`
            relative overflow-hidden p-6 rounded-2xl transition-all duration-500 group
            bg-white border border-slate-200 shadow-sm hover:shadow-lg
            dark:bg-[#1e293b]/60 dark:backdrop-blur-xl dark:border-slate-700/50 dark:shadow-lg dark:hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]
            system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)] system:shadow-[0_0_20px_rgba(123,160,91,0.1)] system:hover:shadow-[0_0_25px_rgba(123,160,91,0.2)]
        `}>
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 dark:opacity-20 system:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-40 system:group-hover:opacity-40 transition-opacity duration-700 ${glowColor}`}></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white system:text-[#E1E4E1] font-sans tracking-tight flex items-baseline gap-1">
                        <SlotCounter value={parseInt(String(value).replace(/,/g, ''))} />
                    </h3>
                </div>
                <div className={`p-3 rounded-xl border ${themeClass} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>
            {subtext && (
                <div className="relative z-10 mt-4 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${themeClass}`}>
                        {subtext}
                    </span>
                </div>
            )}
        </div>
    );
};

// SHORTCUT BUTTON COMPONENT - Full Width Layout
const ShortcutBtn = ({ label, icon: Icon, color, href }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500 system:bg-[#1A2E1F] system:text-emerald-400 system:border-[rgba(123,160,91,0.2)] system:hover:bg-[#243a28] system:hover:border-[rgba(123,160,91,0.4)]',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500 system:bg-[#1A2E1F] system:text-blue-400 system:border-[rgba(123,160,91,0.2)] system:hover:bg-[#243a28] system:hover:border-[rgba(123,160,91,0.4)]',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500 system:bg-[#1A2E1F] system:text-amber-400 system:border-[rgba(123,160,91,0.2)] system:hover:bg-[#243a28] system:hover:border-[rgba(123,160,91,0.4)]',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:border-purple-500 system:bg-[#1A2E1F] system:text-purple-400 system:border-[rgba(123,160,91,0.2)] system:hover:bg-[#243a28] system:hover:border-[rgba(123,160,91,0.4)]',
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

// Custom Tooltip for Pie Chart - More styled
const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-white dark:bg-slate-800/95 system:bg-[#1A2E1F]/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-600 system:border-[rgba(123,160,91,0.3)]">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: data.payload.fill }} />
                    <span className="text-sm font-bold text-gray-900 dark:text-white system:text-[#E1E4E1]">{data.name}</span>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-gray-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Bottles:</span>
                        <span className="font-bold text-gray-900 dark:text-white system:text-[#E1E4E1]">{data.value?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-gray-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Share:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">{((data.percent || 0) * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations, currentUser } = useAuth();
    const [timeRange, setTimeRange] = useState('week');
    const [chartType, setChartType] = useState('line');

    // =========================================================================
    // LOCATION-FILTERED STATISTICS
    // =========================================================================
    const stats = useMemo(() => {
        const machines = getMachinesByLocation(effectiveLocationId);
        const users = getUsersByLocation(effectiveLocationId);
        const rewards = getRewardsByLocation(effectiveLocationId);

        const totalBottles = machines.reduce((sum, m) => sum + m.bottlesCollected, 0);
        const onlineMachines = machines.filter(m => m.status === 'Online').length;
        const totalMachines = machines.length;
        const activeUsers = users.filter(u => u.status === 'Active').length;
        const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
        const totalRewards = rewards.length;
        const totalStock = rewards.reduce((sum, r) => sum + r.stock, 0);

        return {
            totalBottles,
            onlineMachines,
            totalMachines,
            activeUsers,
            totalUsers: users.length,
            totalPoints,
            totalRewards,
            totalStock
        };
    }, [effectiveLocationId]);

    // Location-specific chart data with accepted/rejected
    const chartData = useMemo(() => {
        const logs = filterByLocation(BOTTLE_LOGS, effectiveLocationId);
        const now = new Date();

        // Helper to get day name
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Helper to count accepted/rejected
        const countByStatus = (logsSubset) => {
            const accepted = logsSubset.filter(l => ['Accepted', 'Completed', 'Success'].includes(l.status)).length;
            const rejected = logsSubset.filter(l => ['Rejected', 'Failed', 'Error'].includes(l.status)).length;
            return { accepted, rejected };
        };

        // 1. Weekly Data (Last 7 Days)
        const weeklyAccepted = [];
        const weeklyRejected = [];
        const weeklyLabels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            weeklyLabels.push(days[d.getDay()]);

            const dayStart = new Date(d.setHours(0, 0, 0, 0));
            const dayEnd = new Date(d.setHours(23, 59, 59, 999));

            const dayLogs = logs.filter(l => l.timestampObj >= dayStart && l.timestampObj <= dayEnd);
            const counts = countByStatus(dayLogs);
            weeklyAccepted.push(counts.accepted);
            weeklyRejected.push(counts.rejected);
        }

        // 2. Monthly Data (Last 4 Weeks)
        const monthlyAccepted = [];
        const monthlyRejected = [];
        const monthlyLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        for (let i = 0; i < 4; i++) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - ((3 - i) * 7) - 6);
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() - ((3 - i) * 7));

            const weekLogs = logs.filter(l => l.timestampObj >= weekStart && l.timestampObj <= weekEnd);
            const counts = countByStatus(weekLogs);
            monthlyAccepted.push(counts.accepted);
            monthlyRejected.push(counts.rejected);
        }

        // 3. Yearly Data (Last 12 Months)
        const yearlyAccepted = new Array(12).fill(0);
        const yearlyRejected = new Array(12).fill(0);
        const yearlyLabels = months;
        logs.forEach(log => {
            const d = new Date(log.timestampObj);
            if (d.getFullYear() === now.getFullYear()) {
                if (['Accepted', 'Completed', 'Success'].includes(log.status)) {
                    yearlyAccepted[d.getMonth()]++;
                } else if (['Rejected', 'Failed', 'Error'].includes(log.status)) {
                    yearlyRejected[d.getMonth()]++;
                }
            }
        });

        // Determine Max Values for scaling (combined)
        const getMax = (arr1, arr2) => Math.max(...arr1, ...arr2, 10);

        return {
            week: {
                labels: weeklyLabels,
                accepted: weeklyAccepted,
                rejected: weeklyRejected,
                maxValue: getMax(weeklyAccepted, weeklyRejected)
            },
            month: {
                labels: monthlyLabels,
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
    }, [effectiveLocationId]);

    const currentData = chartData[timeRange];

    // Get location ranking info
    const locationRanking = useMemo(() => {
        if (isSuperAdmin && !effectiveLocationId) return null;
        const location = allLocations.find(l => l.id === effectiveLocationId);
        return location ? { rank: location.ranking, total: allLocations.length, name: location.name } : null;
    }, [effectiveLocationId, isSuperAdmin, allLocations]);

    // Location-specific recent transactions
    const recentTransactions = useMemo(() => {
        // Use the centralized BOTTLE_LOGS
        const logs = filterByLocation(BOTTLE_LOGS, effectiveLocationId);

        // Sort by timestamp (newest first) and take top 5
        return logs.slice(0, 5).map(log => ({
            id: log.id,
            userId: log.userId,
            userName: log.userName,
            location: log.locationName,
            machineId: log.machineId,
            machineName: log.machineName,
            bottleType: log.bottleType,
            condition: log.condition,
            pointsAwarded: log.pointsAwarded,
            timestamp: log.timestamp,
            status: log.status,
        }));
    }, [effectiveLocationId]);

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
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-500/30 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/20">
                        <Building2 size={24} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <p className="font-bold text-red-800 dark:text-red-300">Global Super Admin View</p>
                        <p className="text-sm text-red-700 dark:text-red-400">
                            Viewing aggregated data across <strong>{allLocations.length} locations</strong>. Use "View as" to filter by specific school.
                        </p>
                    </div>
                </div>
            )}

            {/* 1. Statistics Row - Location Filtered */}
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
                        {/* Chart Type Toggle */}
                        <div className="flex items-center gap-1 p-1 rounded-lg
                            bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            <button
                                onClick={() => setChartType('line')}
                                className={`p-2 rounded-md transition-all duration-300 ${chartType === 'line'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 hover:text-emerald-600 dark:hover:text-emerald-400'
                                    }`}
                                title="Line Chart"
                            >
                                <TrendingUp size={16} />
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                className={`p-2 rounded-md transition-all duration-300 ${chartType === 'bar'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 hover:text-emerald-600 dark:hover:text-emerald-400'
                                    }`}
                                title="Bar Chart"
                            >
                                <BarChart3 size={16} />
                            </button>
                            <button
                                onClick={() => setChartType('pie')}
                                className={`p-2 rounded-md transition-all duration-300 ${chartType === 'pie'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 hover:text-emerald-600 dark:hover:text-emerald-400'
                                    }`}
                                title="Pie Chart"
                            >
                                <PieChartIcon size={16} />
                            </button>
                        </div>

                        {/* Time Range Pills */}
                        <div className="flex items-center gap-1 p-1 rounded-lg
                            bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            {[
                                { key: 'week', label: 'Daily' },
                                { key: 'month', label: 'Weekly' },
                                { key: 'year', label: 'Monthly' }
                            ].map((range) => (
                                <button
                                    key={range.key}
                                    onClick={() => setTimeRange(range.key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${timeRange === range.key
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60 hover:bg-slate-200 dark:hover:bg-slate-700 system:hover:bg-[#1A2E1F]'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Container */}
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
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
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                                <Line
                                    type="monotone"
                                    dataKey="accepted"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                                    name="Accepted"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="rejected"
                                    stroke="#ef4444"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                                    name="Rejected"
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
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                                <Bar
                                    dataKey="accepted"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    name="Accepted"
                                />
                                <Bar
                                    dataKey="rejected"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    name="Rejected"
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
                                <Tooltip content={<PieTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>

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
                            Peak {timeRange === 'week' ? 'Day' : timeRange === 'month' ? 'Week' : 'Month'}
                        </p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400 system:text-cyan-400">
                            {(() => {
                                const totals = currentData.accepted.map((val, i) => val + currentData.rejected[i]);
                                const maxIndex = totals.indexOf(Math.max(...totals));
                                return currentData.labels[maxIndex] || '-';
                            })()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mb-1">Bottles Accepted</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">
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
                    <Settings size={18} className="text-emerald-500 dark:text-emerald-400 system:text-[#7BA05B] animate-spin-slow" />
                    Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Role-based Shortcuts - Always show all 4 for super admins */}
                    {['super_admin', 'head_admin', 'inventory_officer'].includes(currentUser?.role) && (
                        <ShortcutBtn label="Rewards" icon={Trophy} color="purple" href="/admin/rewards" />
                    )}

                    {['super_admin', 'head_admin'].includes(currentUser?.role) && (
                        <ShortcutBtn label="Manage Users" icon={Users} color="emerald" href="/admin/users" />
                    )}

                    {['super_admin', 'head_admin', 'auditor'].includes(currentUser?.role) && (
                        <ShortcutBtn label="Admin Logs" icon={FileText} color="blue" href="/admin/logs/access" />
                    )}

                    {['super_admin', 'head_admin'].includes(currentUser?.role) && (
                        <ShortcutBtn label="Machines" icon={Package} color="amber" href="/admin/machines" />
                    )}
                </div>
            </div>

            {/* 3. Recent Transactions Table - Location Filtered */}
            <div className="bg-white dark:bg-slate-800/50 system:bg-[#1A2E1F] rounded-2xl border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)] shadow-xl system:shadow-[0_0_20px_rgba(123,160,91,0.1)] overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 system:bg-[#0F1B11]/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white system:text-[#E1E4E1] flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 system:bg-[#7BA05B] rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981] system:shadow-[0_0_10px_rgba(123,160,91,0.5)]"></span>
                        Real-Time Bottle Logs {currentLocation && <span className="text-sm font-normal text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">({currentLocation.name})</span>}
                    </h3>
                    <Link href="/admin/logs/bottles" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 system:text-[#7BA05B] system:hover:text-[#8fb56a] transition-colors">
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]
                            bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300 system:bg-[#0F1B11] system:text-[#E1E4E1]/60">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Condition</th>
                                <th className="px-6 py-4">Points</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 system:divide-[rgba(123,160,91,0.1)]">
                            {recentTransactions.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 system:hover:bg-[rgba(123,160,91,0.1)] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 system:bg-[#0F1B11] flex items-center justify-center">
                                                <User size={14} className="text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white system:text-[#E1E4E1] text-sm">{log.userName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/50 font-mono">{log.userId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-slate-400 system:text-[#7BA05B]" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]">{log.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11] text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60">
                                            {log.condition}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">+{log.pointsAwarded}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60">
                                            <Clock size={14} />
                                            {log.timestamp}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold
                                            ${['Accepted', 'Completed', 'Success', 'Resolved'].includes(log.status)
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 system:bg-[rgba(123,160,91,0.2)] system:text-[#7BA05B]'
                                                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
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
