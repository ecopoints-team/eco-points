'use client';
import React, { useState } from 'react';
import { useAuth } from '../../../src/context/AuthContext';
import { LOCATIONS } from '../../../src/data/mockData';
import {
    Building2, MapPin, Users, Package, Leaf, TrendingUp,
    Calendar, Phone, Mail, Edit2, Eye, MoreVertical, Trophy
} from 'lucide-react';

// ============================================================================
// LOCATIONS MANAGEMENT PAGE (Super Admin Only)
// ============================================================================

export default function LocationsPage() {
    const { isSuperAdmin, setViewAsLocation } = useAuth();
    const [locations] = useState(LOCATIONS);
    const [selectedLocation, setSelectedLocation] = useState(null);

    // Redirect or show access denied if not Super Admin
    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                        <Building2 size={40} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Access Denied</h1>
                    <p className="text-slate-500 dark:text-slate-400">Only Super Admins can access the Locations page.</p>
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalMachines = locations.reduce((sum, loc) => sum + loc.machineCount, 0);
    const totalUsers = locations.reduce((sum, loc) => sum + loc.userCount, 0);
    const totalBottles = locations.reduce((sum, loc) => sum + loc.totalBottlesCollected, 0);

    return (
        <>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Location Management
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage all deployment sites and their resources
                </p>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                            <Building2 size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Locations</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{locations.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                            <Package size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Machines</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalMachines}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                            <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalUsers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/20">
                            <Leaf size={24} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Bottles</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{totalBottles.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {locations.map((location, index) => (
                    <div
                        key={location.id}
                        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${index === 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    {index === 0 ? (
                                        <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
                                    ) : (
                                        <Building2 size={24} className="text-slate-600 dark:text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{location.name}</h3>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                                                #1 RANKED
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{location.fullName}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${location.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {location.status}
                            </span>
                        </div>

                        {/* Location Details */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <MapPin size={14} className="text-slate-400" />
                                {location.address}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Mail size={14} className="text-slate-400" />
                                {location.contactEmail}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone size={14} className="text-slate-400" />
                                {location.contactPhone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Calendar size={14} className="text-slate-400" />
                                Joined: {location.joinDate}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Machines</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{location.machineCount}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Users</p>
                                <p className="text-xl font-black text-blue-600 dark:text-blue-400">{location.userCount}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 text-center">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Bottles</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{(location.totalBottlesCollected / 1000).toFixed(1)}k</p>
                            </div>
                        </div>

                        {/* Ranking Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500 dark:text-slate-400">Collection Progress</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    Rank #{location.ranking} of {locations.length}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${(location.totalBottlesCollected / totalBottles) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setViewAsLocation(location.id)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium
                                    bg-emerald-100 text-emerald-700 hover:bg-emerald-200
                                    dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 transition-colors"
                            >
                                <Eye size={16} />
                                View as {location.name}
                            </button>
                            <button className="flex items-center justify-center p-2 rounded-lg
                                bg-slate-100 text-slate-600 hover:bg-slate-200
                                dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors">
                                <Edit2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
