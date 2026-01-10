'use client';
import React from 'react';
import Link from 'next/link';
import AdminLayout from '../../src/Components/AdminLayout'; 
import Table from '../../src/Components/Table';
import SlotCounter from '../../src/Components/SlotCounter';
import { Activity, Zap, TrendingUp, Box, Users, FileText, Package, Settings } from 'lucide-react';

// Mock Data
const recentTransactions = [
  ["#TXN-8842", "Justin Ibale", "500ml PET", "Active", "Jan 08, 10:42 AM"],
  ["#TXN-8841", "Jana Soriano", "1000ml PET", "Active", "Jan 08, 10:30 AM"],
  ["#TXN-8840", "Guest User", "350ml PET", "Active", "Jan 08, 09:15 AM"],
];

// DUAL-THEME STAT CARD
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
  const themeMap = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    blue:    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30',
    amber:   'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    purple:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
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
        blue:    'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20 dark:hover:border-blue-500',
        amber:   'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20 dark:hover:border-amber-500',
        purple:  'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20 dark:hover:border-purple-500',
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
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
               Recycling Trends
             </h3>
             <select className="text-xs py-1.5 px-3 rounded-lg outline-none transition-colors
               bg-slate-50 text-slate-600 border border-slate-200
               dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 focus:border-emerald-500
             ">
               <option>Last 7 Days</option>
               <option>Last Month</option>
             </select>
           </div>
           
           {/* Chart Visuals */}
           <div className="h-64 w-full flex items-end justify-between px-2 gap-3">
              {[40, 65, 30, 80, 55, 90, 45].map((height, i) => (
                <div key={i} className="w-full rounded-t-lg relative group cursor-pointer border-b border-transparent hover:border-emerald-500 transition-all duration-300
                  bg-slate-100 dark:bg-slate-800/50
                ">
                  <div 
                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700
                      bg-gradient-to-t from-emerald-500 to-emerald-300 opacity-90
                      dark:from-emerald-600 dark:to-emerald-400/80 dark:opacity-80 dark:group-hover:opacity-100 dark:group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                    style={{ height: `${height}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 text-xs font-bold py-2 px-3 rounded-lg shadow-xl transition-all duration-300 z-20 whitespace-nowrap
                    bg-slate-800 text-white dark:bg-slate-900 dark:text-emerald-400 dark:border dark:border-emerald-500/30
                  ">
                    {height * 10} Units
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-800 dark:bg-slate-900 dark:border-r dark:border-b dark:border-emerald-500/30"></div>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-4 px-2 font-mono uppercase tracking-widest">
             <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
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

      {/* 3. Recent Transactions Table */}
      <Table 
        title="Real-Time Data Logs"
        headers={["Trans ID", "User", "Item Type", "Status", "Timestamp"]}
        data={recentTransactions}
      />
    </AdminLayout>
  );
}