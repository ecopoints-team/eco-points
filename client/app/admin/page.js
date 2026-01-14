'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../src/Components/AdminLayout';
import SlotCounter from '../../src/Components/SlotCounter';
import { Activity, Zap, TrendingUp, Box, Users, FileText, Package, Settings, User, MapPin, Clock } from 'lucide-react';

// Mock Data - Recent transactions for dashboard summary
const recentTransactions = [
    {
        id: 'LOG-8842',
        userId: 'USR-1234',
        userName: 'Justin Ibale',
        machineId: 'RVM-001',
        machineName: 'Main Campus RVM',
        bottleType: '500ml PET',
        pointsAwarded: 5,
        timestamp: 'Jan 14, 10:42 AM',
        status: 'Completed',
    },
    {
        id: 'LOG-8841',
        userId: 'USR-1235',
        userName: 'Jana Soriano',
        machineId: 'RVM-002',
        machineName: 'Library RVM',
        bottleType: '1000ml PET',
        pointsAwarded: 10,
        timestamp: 'Jan 14, 10:30 AM',
        status: 'Completed',
    },
    {
        id: 'LOG-8840',
        userId: 'GUEST',
        userName: 'Guest User',
        machineId: 'RVM-001',
        machineName: 'Main Campus RVM',
        bottleType: '350ml PET',
        pointsAwarded: 3,
        timestamp: 'Jan 14, 09:15 AM',
        status: 'Completed',
    },
    {
        id: 'LOG-8839',
        userId: 'USR-1240',
        userName: 'Mark Santos',
        machineId: 'RVM-004',
        machineName: 'Sports Complex RVM',
        bottleType: '1500ml PET',
        pointsAwarded: 15,
        timestamp: 'Jan 14, 08:45 AM',
        status: 'Completed',
    },
    {
        id: 'LOG-8838',
        userId: 'USR-1238',
        userName: 'Sarah Cruz',
        machineId: 'RVM-002',
        machineName: 'Library RVM',
        bottleType: '500ml PET',
        pointsAwarded: 5,
        timestamp: 'Jan 14, 08:20 AM',
        status: 'Completed',
    },
];

// Chart data for different time periods
const chartData = {
    week: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [400, 650, 300, 800, 550, 900, 450],
        maxValue: 1000
    },
    month: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        values: [2800, 3200, 2950, 3500],
        maxValue: 4000
    },
    year: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        values: [8500, 9200, 10500, 11200, 12450, 13800, 14200, 15000, 13500, 12800, 11500, 10200],
        maxValue: 16000
    }
};

// DUAL-THEME STAT CARD
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
    const themeMap = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
    };

    const themeClass = themeMap[color] || themeMap.emerald;

    // Dynamic glow color for dark mode hover effect
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
            {/* Background Glow (Dark Mode Only) */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 dark:opacity-20 group-hover:opacity-10 dark:group-hover:opacity-40 transition-opacity duration-700 ${glowColor}`}></div>

            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white font-sans tracking-tight flex items-baseline gap-1">
                        <SlotCounter value={parseInt(value.replace(/,/g, ''))} />
                    </h3>
                </div>

                <div className={`p-3 rounded-xl border ${themeClass} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${themeClass}`}>
                    ↑ {subtext}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">vs last month</span>
            </div>
        </div>
    );
};

// SHORTCUT BUTTON COMPONENT
const ShortcutBtn = ({ label, icon: Icon, color, href }) => {
    // Color mapping for the shortcuts
    const colors = {
        emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 dark:hover:border-emerald-500',
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500',
        amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500',
        purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:border-purple-500',
    };
    const style = colors[color] || colors.emerald;

    return (
        <Link href={href} className={`
            flex flex-col items-center justify-center p-4 rounded-xl border border-transparent transition-all duration-300 group
            ${style}
        `}>
            <div className="p-3 rounded-full bg-white dark:bg-[#0f172a] shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </Link>
    );
}

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState('week');
    const currentData = chartData[timeRange];

    // Generate Y-axis labels based on max value
    const yAxisLabels = [
        currentData.maxValue,
        Math.round(currentData.maxValue * 0.75),
        Math.round(currentData.maxValue * 0.5),
        Math.round(currentData.maxValue * 0.25),
        0
    ];

    return (
        <AdminLayout>
            {/* 1. Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Bottles" value="12,450" subtext="12%" color="emerald" icon={Box} />
                <StatCard title="Points Distributed" value="85,200" subtext="8%" color="blue" icon={Zap} />
                <StatCard title="Active Machines" value="4" subtext="Stable" color="amber" icon={Activity} />
                {/* CHANGED: CO2 -> Active Users */}
                <StatCard title="Active Users" value="2,845" subtext="24%" color="purple" icon={Users} />
            </div>

            {/* 2. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CHART SECTION (Left - Wider) */}
                <div className="lg:col-span-2 rounded-2xl p-6 shadow-xl relative transition-all duration-500
          bg-white border border-slate-200
          dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50
        ">
                    {/* Header with title, legend, and dropdown */}
                    <div className="flex justify-between items-center mb-8 relative z-30">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                            Recycling Trends
                        </h3>
                        <div className="flex items-center gap-4">
                            {/* Legend */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <div className="w-3 h-3 rounded bg-gradient-to-t from-emerald-500 to-emerald-300"></div>
                                <span>Bottles Recycled</span>
                            </div>
                            {/* Dropdown */}
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

                    {/* Chart Visuals with Y-axis */}
                    <div className="flex">
                        {/* Y-axis labels */}
                        <div className="flex flex-col justify-between h-64 pr-4 text-right min-w-[50px]">
                            {yAxisLabels.map((label, i) => (
                                <span key={i} className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                    {label.toLocaleString()}
                                </span>
                            ))}
                        </div>

                        {/* Chart area with grid lines */}
                        <div className="flex-1 relative">
                            {/* Horizontal grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4].map((_, i) => (
                                    <div key={i} className="border-t border-slate-200 dark:border-slate-700/50 w-full"></div>
                                ))}
                            </div>

                            {/* Bars */}
                            <div className="h-64 w-full flex items-end justify-around gap-2 relative">
                                {currentData.values.map((value, i) => {
                                    const height = (value / currentData.maxValue) * 100;
                                    return (
                                        <div key={i} className="flex-1 max-w-16 rounded-t-lg relative group cursor-pointer transition-all duration-300
                                            bg-slate-100 dark:bg-slate-800/50 h-full"
                                        >
                                            <div
                                                className="absolute bottom-0 w-full rounded-t-lg transition-all duration-300 flex items-center justify-center
                                                    bg-gradient-to-t from-emerald-500 to-emerald-300 
                                                    group-hover:brightness-110 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]
                                                    dark:from-emerald-600 dark:to-emerald-400/80 
                                                    dark:group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                                                style={{ height: `${height}%` }}
                                            >
                                                {/* Premium glowing tooltip inside bar */}
                                                <span className="opacity-0 group-hover:opacity-100 group-hover:scale-110 
                                                    text-xs font-bold py-1 px-2 rounded-md 
                                                    bg-slate-900/80 backdrop-blur-sm text-emerald-400 
                                                    border border-emerald-500/50 
                                                    shadow-[0_0_15px_rgba(16,185,129,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]
                                                    transition-all duration-300 whitespace-nowrap">
                                                    {value}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* X-axis labels */}
                    <div className="flex mt-4 pl-[50px]">
                        <div className="flex-1 flex justify-around text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider">
                            {currentData.labels.map((label, i) => (
                                <span key={i} className="text-center flex-1 max-w-16">{label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SHORTCUTS SECTION (Right - Replaces Feed) */}
                <div className="rounded-2xl p-6 shadow-xl transition-all duration-500 flex flex-col
          bg-white border border-slate-200
          dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50
        ">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Settings size={18} className="text-emerald-500 dark:text-emerald-400 animate-spin-slow" />
                        Quick Actions
                    </h3>

                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <ShortcutBtn label="Manage Users" icon={Users} color="emerald" href="/admin/users" />
                        <ShortcutBtn label="View Logs" icon={FileText} color="blue" href="/admin/logs/bottles" />
                        <ShortcutBtn label="Machines" icon={Package} color="amber" href="/admin/machines" />
                        <ShortcutBtn label="Settings" icon={Settings} color="purple" href="/admin/profile" />
                    </div>
                </div>
            </div>

            {/* 3. Recent Transactions Table - Summary View */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mt-6">
                {/* Table Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Real-Time Data Logs
                    </h3>
                    <Link href="/admin/logs/bottles" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
                        View All →
                    </Link>
                </div>

                {/* Table Content */}
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
                                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {log.id}
                                        </span>
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
                                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                            {log.bottleType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                            +{log.pointsAwarded}
                                        </span>
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
