'use client';
import React, { useState } from 'react';
import AdminLayout from '../../../../src/Components/AdminLayout';
import { Search, Filter, ChevronLeft, ChevronRight, Recycle, User, Clock, MapPin } from 'lucide-react';

// Mock Data for Bottle Logs
const bottleLogs = [
    {
        id: 'LOG-8842',
        userId: 'USR-1234',
        userName: 'Justin Ibale',
        machineId: 'RVM-001',
        machineName: 'Main Campus RVM',
        bottleType: '500ml PET',
        pointsAwarded: 5,
        timestamp: 'Jan 14, 2026 10:42 AM',
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
        timestamp: 'Jan 14, 2026 10:30 AM',
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
        timestamp: 'Jan 14, 2026 09:15 AM',
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
        timestamp: 'Jan 14, 2026 08:45 AM',
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
        timestamp: 'Jan 14, 2026 08:20 AM',
        status: 'Completed',
    },
    {
        id: 'LOG-8837',
        userId: 'USR-1236',
        userName: 'Miguel Torres',
        machineId: 'RVM-003',
        machineName: 'Cafeteria RVM',
        bottleType: '750ml Glass',
        pointsAwarded: 8,
        timestamp: 'Jan 13, 2026 04:30 PM',
        status: 'Completed',
    },
    {
        id: 'LOG-8836',
        userId: 'USR-1237',
        userName: 'Anna Reyes',
        machineId: 'RVM-001',
        machineName: 'Main Campus RVM',
        bottleType: '500ml PET',
        pointsAwarded: 5,
        timestamp: 'Jan 13, 2026 03:15 PM',
        status: 'Completed',
    },
    {
        id: 'LOG-8835',
        userId: 'GUEST',
        userName: 'Guest User',
        machineId: 'RVM-004',
        machineName: 'Sports Complex RVM',
        bottleType: '1000ml PET',
        pointsAwarded: 10,
        timestamp: 'Jan 13, 2026 02:00 PM',
        status: 'Completed',
    },
];

// Stats data
const stats = {
    todayTransactions: 156,
    todayBottles: 203,
    todayPoints: 1520,
};

export default function BottleLogsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Bottle Logs
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    View all bottle recycling transactions and activity logs
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Recycle size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Today's Transactions</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayTransactions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Recycle size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Bottles Recycled Today</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayBottles}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Recycle size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Points Awarded Today</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{stats.todayPoints}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                {/* Table Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                        Transaction History
                    </h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                        {/* Search */}
                        <div className="relative group flex-1 sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400
                                    bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                                    dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                            />
                        </div>
                        {/* Filter Button */}
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                            bg-slate-100 text-slate-600 hover:bg-slate-200
                            dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
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
                            {bottleLogs.map((log) => (
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

                {/* Pagination */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4
                    bg-slate-50/50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-500">
                    <span>
                        Showing <strong className="text-emerald-600 dark:text-emerald-400">1</strong> to{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">8</strong> of 156 entries
                    </span>
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg border transition-all disabled:opacity-50
                            bg-white border-slate-200 text-slate-400 hover:bg-slate-100
                            dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronLeft size={14} />
                        </button>
                        <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-md">1</button>
                        <button className="px-3 py-1.5 rounded-lg border transition-all
                            bg-white border-slate-200 text-slate-600 hover:bg-slate-100
                            dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">2</button>
                        <button className="px-3 py-1.5 rounded-lg border transition-all
                            bg-white border-slate-200 text-slate-600 hover:bg-slate-100
                            dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">3</button>
                        <button className="p-2 rounded-lg border transition-all
                            bg-white border-slate-200 text-slate-400 hover:bg-slate-100
                            dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
