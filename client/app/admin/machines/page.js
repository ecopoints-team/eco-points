'use client';
import React from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { Package, MapPin, Activity, Wifi, WifiOff, Settings, Eye } from 'lucide-react';

// Mock Data for Machines
const machines = [
    {
        id: 'RVM-001',
        name: 'Main Campus RVM',
        location: 'Student Center, Ground Floor',
        status: 'Online',
        bottlesCollected: 2450,
        lastSync: '2 mins ago',
        fillLevel: 75,
    },
    {
        id: 'RVM-002',
        name: 'Library RVM',
        location: 'University Library, Entrance',
        status: 'Online',
        bottlesCollected: 1820,
        lastSync: '5 mins ago',
        fillLevel: 45,
    },
    {
        id: 'RVM-003',
        name: 'Cafeteria RVM',
        location: 'Main Cafeteria, Exit Area',
        status: 'Offline',
        bottlesCollected: 3100,
        lastSync: '2 hours ago',
        fillLevel: 90,
    },
    {
        id: 'RVM-004',
        name: 'Sports Complex RVM',
        location: 'Gymnasium, Main Lobby',
        status: 'Online',
        bottlesCollected: 980,
        lastSync: '1 min ago',
        fillLevel: 30,
    },
];

// Status Badge Component
const StatusBadge = ({ status }) => {
    const isOnline = status === 'Online';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
            ${isOnline
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
            }`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {status}
        </span>
    );
};

// Fill Level Bar Component
const FillLevelBar = ({ level }) => {
    const getColor = () => {
        if (level >= 80) return 'from-red-500 to-red-400';
        if (level >= 50) return 'from-amber-500 to-amber-400';
        return 'from-emerald-500 to-emerald-400';
    };

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400">Fill Level</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{level}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
                    style={{ width: `${level}%` }}
                ></div>
            </div>
        </div>
    );
};

// Machine Card Component
const MachineCard = ({ machine }) => (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{machine.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{machine.id}</p>
                </div>
            </div>
            <StatusBadge status={machine.status} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <MapPin size={14} className="text-slate-400" />
            {machine.location}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bottles Collected</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{machine.bottlesCollected}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Sync</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{machine.lastSync}</p>
            </div>
        </div>

        {/* Fill Level */}
        <FillLevelBar level={machine.fillLevel} />

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium
                bg-slate-100 text-slate-600 hover:bg-slate-200
                dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                <Eye size={16} />
                View Details
            </button>
            <button className="flex items-center justify-center p-2 rounded-lg
                bg-slate-100 text-slate-600 hover:bg-slate-200
                dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                <Settings size={16} />
            </button>
        </div>
    </div>
);

export default function MachinesPage() {
    const onlineCount = machines.filter(m => m.status === 'Online').length;
    const totalBottles = machines.reduce((sum, m) => sum + m.bottlesCollected, 0);

    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Machines (RVM)
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage and monitor all Reverse Vending Machines
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Activity size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Online Machines</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{onlineCount} / {machines.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Package size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Machines</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{machines.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Package size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Bottles Collected</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalBottles}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Machine Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {machines.map((machine) => (
                    <MachineCard key={machine.id} machine={machine} />
                ))}
            </div>
        </AdminLayout>
    );
}
