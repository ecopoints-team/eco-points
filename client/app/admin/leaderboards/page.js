'use client';
import React from 'react';
import { Trophy, Sparkles, Clock } from 'lucide-react';

export default function LeaderboardsPage() {
    return (
        <>
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Leaderboards</h1>
                <p className="text-slate-500 dark:text-slate-400">Rankings and top recyclers</p>
            </div>

            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md">
                    {/* Animated Icon */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="absolute inset-0 w-32 h-32 rounded-full bg-amber-100 dark:bg-amber-500/10 animate-pulse"></div>
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-500/20 dark:to-amber-600/20 flex items-center justify-center border-2 border-amber-200 dark:border-amber-500/30">
                            <Trophy size={48} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="absolute -top-1 -right-1">
                            <Sparkles size={24} className="text-amber-500 dark:text-amber-400 animate-bounce" />
                        </div>
                    </div>

                    {/* Text */}
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                        Coming Soon
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                        We&apos;re building an exciting leaderboard system to showcase top recyclers, 
                        track achievements, and celebrate environmental champions across all locations.
                    </p>

                    {/* Feature Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Global Rankings', desc: 'Compete across locations' },
                            { label: 'Achievements', desc: 'Earn badges & medals' },
                            { label: 'Weekly Challenges', desc: 'Time-limited events' },
                        ].map((feature) => (
                            <div key={feature.label} className="p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{feature.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30">
                        <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">In Development</span>
                    </div>
                </div>
            </div>
        </>
    );
}
