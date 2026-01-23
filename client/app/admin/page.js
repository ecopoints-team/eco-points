'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '../../src/Components/AdminLayout';
import SlotCounter from '../../src/Components/SlotCounter';
import { useAuth } from '../../src/context/AuthContext';
import { MACHINES, USERS, REWARDS, LOCATIONS, getMachinesByLocation, getRewardsByLocation, getUsersByLocation } from '../../src/data/mockData';
import { Activity, Zap, TrendingUp, Box, Users, FileText, Package, Settings, User, MapPin, Clock, Trophy, Building2 } from 'lucide-react';

// DUAL-THEME STAT CARD
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
    const themeMap = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
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
        `}>
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-40 transition-opacity duration-700 ${glowColor}`}></div>
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white font-sans tracking-tight flex items-baseline gap-1">
                        <SlotCounter value={parseInt(String(value).replace(/,/g, ''))} />
                    </h3>
                </div>
                <div className={`p-3 rounded-xl border ${themeClass} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${themeClass}`}>
                    {subtext}
                </span>
            </div>
        </div>
    );
};

// SHORTCUT BUTTON COMPONENT
const ShortcutBtn = ({ label, icon: Icon, color, href }) => {
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:border-purple-500',
    };
    const style = colors[color] || colors.emerald;

    return (
        <Link href={href} className={`flex flex-col items-center justify-center p-4 rounded-xl border border-transparent transition-all duration-300 group ${style}`}>
            <div className="p-3 rounded-full bg-white dark:bg-[#0f172a] shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </Link>
    );
}

export default function AdminDashboard() {
    const { effectiveLocationId, currentLocation, isSuperAdmin, allLocations } = useAuth();
    const [timeRange, setTimeRange] = useState('week');

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

    // Location-specific chart data
    const chartData = useMemo(() => {
        // Generate different chart data based on location
        const baseMultiplier = effectiveLocationId === 'LOC-001' ? 1.2 : effectiveLocationId === 'LOC-002' ? 0.8 : 1.5;

        return {
            week: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [400, 650, 300, 800, 550, 900, 450].map(v => Math.round(v * baseMultiplier)),
                maxValue: Math.round(1000 * baseMultiplier)
            },
            month: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: [2800, 3200, 2950, 3500].map(v => Math.round(v * baseMultiplier)),
                maxValue: Math.round(4000 * baseMultiplier)
            },
            year: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                values: [8500, 9200, 10500, 11200, 12450, 13800, 14200, 15000, 13500, 12800, 11500, 10200].map(v => Math.round(v * baseMultiplier)),
                maxValue: Math.round(16000 * baseMultiplier)
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

    // Y-axis labels based on max value
    const yAxisLabels = [
        currentData.maxValue,
        Math.round(currentData.maxValue * 0.75),
        Math.round(currentData.maxValue * 0.5),
        Math.round(currentData.maxValue * 0.25),
        0
    ];

    // Location-specific recent transactions
    const recentTransactions = useMemo(() => {
        const machines = getMachinesByLocation(effectiveLocationId);
        const machineIds = machines.map(m => m.id);

        // Generate transactions based on actual machines
        const users = getUsersByLocation(effectiveLocationId);

        return machines.slice(0, 5).map((machine, idx) => ({
            id: `LOG-${8842 - idx}`,
            userId: users[idx]?.id || 'GUEST',
            userName: users[idx]?.name || 'Guest User',
            machineId: machine.id,
            machineName: machine.name,
            bottleType: ['500ml PET', '1000ml PET', '350ml PET', '1500ml PET'][idx % 4],
            pointsAwarded: [5, 10, 3, 15, 5][idx % 5],
            timestamp: `Jan 23, ${10 - idx}:${30 + idx * 5} AM`,
            status: 'Completed',
        }));
    }, [effectiveLocationId]);

    return (
        <AdminLayout>
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
                    subtext={`${stats.totalMachines} machines`}
                    color="emerald"
                    icon={Box}
                />
                <StatCard
                    title="Points Distributed"
                    value={stats.totalPoints.toLocaleString()}
                    subtext={`${stats.totalUsers} users`}
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
                    title="Active Users"
                    value={stats.activeUsers.toString()}
                    subtext={`${stats.totalRewards} rewards`}
                    color="purple"
                    icon={Users}
                />
            </div>

            {/* 2. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CHART SECTION */}
                <div className="lg:col-span-2 rounded-2xl p-6 shadow-xl relative transition-all duration-500
                    bg-white border border-slate-200
                    dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50">
                    <div className="flex justify-between items-center mb-8 relative z-30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                            Recycling Trends {currentLocation && <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({currentLocation.name})</span>}
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <div className="w-3 h-3 rounded bg-gradient-to-t from-emerald-500 to-emerald-300"></div>
                                <span>Bottles Recycled</span>
                            </div>
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="text-xs py-1.5 px-3 rounded-lg outline-none transition-colors cursor-pointer
                                    bg-slate-50 text-slate-600 border border-slate-200
                                    dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 focus:border-emerald-500"
                            >
                                <option value="week">By Week</option>
                                <option value="month">By Month</option>
                                <option value="year">By Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex">
                        <div className="flex flex-col justify-between h-64 pr-4 text-right min-w-[50px]">
                            {yAxisLabels.map((label, i) => (
                                <span key={i} className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {label.toLocaleString()}
                                </span>
                            ))}
                        </div>
                        <div className="flex-1 relative">
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map((_, i) => (
                                    <div key={i} className="border-t border-slate-200 dark:border-slate-700/50 w-full"></div>
                                ))}
                            </div>
                            <div className="h-64 w-full flex items-end justify-around gap-2 relative">
                                {currentData.values.map((value, i) => {
                                    const height = (value / currentData.maxValue) * 100;
                                    return (
                                        <div key={i} className="flex-1 max-w-16 rounded-t-lg relative group cursor-pointer transition-all duration-300
                                            bg-slate-100 dark:bg-slate-800/50 h-full">
                                            <div
                                                className="absolute bottom-0 w-full rounded-t-lg transition-all duration-300 flex items-center justify-center
                                                    bg-gradient-to-t from-emerald-500 to-emerald-300 
                                                    group-hover:brightness-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]
                                                    dark:from-emerald-600 dark:to-emerald-400/80 
                                                    dark:group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                                style={{ height: `${height}%` }}
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 group-hover:scale-110 
                                                    text-xs font-bold py-1 px-2 rounded-md 
                                                    bg-slate-900/80 backdrop-blur-sm text-emerald-400 
                                                    border border-emerald-500/50 
                                                    shadow-[0_0_15px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]
                                                    transition-all duration-300 whitespace-nowrap">
                                                    {value.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex mt-4 pl-[50px]">
                        <div className="flex-1 flex justify-around text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
                            {currentData.labels.map((label, i) => (
                                <span key={i} className="text-center flex-1 max-w-16">{label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SHORTCUTS SECTION */}
                <div className="rounded-2xl p-6 shadow-xl transition-all duration-500 flex flex-col
                    bg-white border border-slate-200
                    dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Settings size={18} className="text-emerald-500 dark:text-emerald-400 animate-spin-slow" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <ShortcutBtn label="Manage Users" icon={Users} color="emerald" href="/admin/users" />
                        <ShortcutBtn label="View Logs" icon={FileText} color="blue" href="/admin/logs/bottles" />
                        <ShortcutBtn label="Machines" icon={Package} color="amber" href="/admin/machines" />
                        <ShortcutBtn label="Settings" icon={Settings} color="purple" href="/admin/settings" />
                    </div>
                </div>
            </div>

            {/* 3. Recent Transactions Table - Location Filtered */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mt-6">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Real-Time Data Logs {currentLocation && <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({currentLocation.name})</span>}
                    </h3>
                    <Link href="/admin/logs/bottles" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                        View All →
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700
                            bg-slate-50 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            <tr>
                                <th className="px-6 py-4">Log ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Machine</th>
                                <th className="px-6 py-4">Bottle Type</th>
                                <th className="px-6 py-4">Points</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {recentTransactions.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{log.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                <User size={14} className="text-slate-500 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white text-sm">{log.userName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{log.userId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-slate-400" />
                                            <div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{log.machineName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{log.machineId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col sm:flex-row gap-1 items-start sm:items-center">
                                            {log.bottleType.split(' ').map((part, i) => (
                                                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                                                    {part}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+{log.pointsAwarded}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Clock size={14} />
                                            {log.timestamp}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold
                                            bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout >
    );
}
