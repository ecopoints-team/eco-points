'use client';
import React from 'react';
import AdminLayout from '../../src/Components/AdminLayout'; 
import Table from '../../src/Components/Table';
import SlotCounter from '../../src/Components/SlotCounter';
import { Activity, Zap, TrendingUp, Box } from 'lucide-react'; // Import icons

// Mock Data
const recentTransactions = [
  ["#TXN-8842", "Justin Ibale", "500ml PET", "Active", "Jan 08, 10:42 AM"],
  ["#TXN-8841", "Jana Soriano", "1000ml PET", "Active", "Jan 08, 10:30 AM"],
  ["#TXN-8840", "Guest User", "350ml PET", "Active", "Jan 08, 09:15 AM"],
];

// NEON CARD COMPONENT
const StatCard = ({ title, value, subtext, color, icon: Icon }) => {
  // Color Mapping for dynamic classes
  const colorMap = {
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    blue: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  };

  const theme = colorMap[color] || colorMap.emerald;

  return (
    <div className={`
      relative overflow-hidden bg-[#1e293b]/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 
      shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300 group
    `}>
      {/* Glow Effect on Hover */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-${color}-500`}></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-black text-white font-sans tracking-tight flex items-baseline gap-1">
            <SlotCounter value={parseInt(value.replace(/,/g, ''))} />
            {title.includes("CO2") && <span className="text-sm font-normal text-slate-500">kg</span>}
          </h3>
        </div>
        
        <div className={`p-3 rounded-xl border ${theme} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="relative z-10 mt-4 flex items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${theme}`}>
          ↑ {subtext}
        </span>
        <span className="text-slate-500 text-xs font-medium">vs last month</span>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  return (
    <AdminLayout>
      {/* 1. Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Bottles" value="12,450" subtext="12%" color="emerald" icon={Box} />
        <StatCard title="Points Distributed" value="85,200" subtext="8%" color="blue" icon={Zap} />
        <StatCard title="Active Machines" value="4" subtext="Stable" color="amber" icon={Activity} />
        <StatCard title="CO2 Reduced" value="1,205" subtext="15%" color="purple" icon={TrendingUp} />
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CHART SECTION */}
        <div className="lg:col-span-2 bg-[#1e293b]/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl relative">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <span className="w-1 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
               Recycling Trends
             </h3>
             <select className="bg-slate-900 text-xs text-slate-300 py-1.5 px-3 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 transition-colors">
               <option>Last 7 Days</option>
               <option>Last Month</option>
             </select>
           </div>
           
           {/* Chart Visuals */}
           <div className="h-64 w-full flex items-end justify-between px-2 gap-3">
              {[40, 65, 30, 80, 55, 90, 45].map((height, i) => (
                <div key={i} className="w-full bg-slate-800/50 rounded-t-lg relative group cursor-pointer border-b border-transparent hover:border-emerald-500/50 transition-all duration-300">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400/80 rounded-t-lg opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-500" 
                    style={{ height: `${height}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2 px-3 rounded-lg shadow-xl transition-all duration-300 z-20 whitespace-nowrap">
                    {height * 10} Units
                    <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-emerald-500/30 rotate-45"></div>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="flex justify-between text-xs text-slate-500 mt-4 px-2 font-mono uppercase tracking-widest">
             <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
           </div>
        </div>

        {/* ALERTS SECTION */}
        <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <Activity size={18} className="text-emerald-400 animate-pulse" />
             Live System Feed
           </h3>
           <div className="space-y-0 relative">
              {/* Timeline Line */}
              <div className="absolute left-[19px] top-2 bottom-4 w-[2px] bg-slate-700/50"></div>

              {[
                { title: "Bin Full Alert", msg: "Machine #2 (Cafeteria) at 95%", color: "red", time: "2m ago" },
                { title: "System Online", msg: "Database sync completed.", color: "emerald", time: "15m ago" },
                { title: "Low Stock", msg: "Rewards inventory running low.", color: "amber", time: "1h ago" }
              ].map((alert, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0 group">
                  <div className={`w-10 h-10 rounded-full bg-slate-900 border-2 border-${alert.color}-500/30 flex items-center justify-center z-10 shrink-0 group-hover:border-${alert.color}-500 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    <div className={`w-2.5 h-2.5 rounded-full bg-${alert.color}-500 shadow-[0_0_8px_currentColor]`}></div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-start">
                      <strong className={`text-${alert.color}-400 text-sm font-bold tracking-wide`}>{alert.title}</strong>
                      <span className="text-[10px] text-slate-600 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{alert.msg}</p>
                  </div>
                </div>
              ))}
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