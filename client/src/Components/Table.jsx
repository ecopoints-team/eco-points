import React from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({ headers, data, title }) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-xl overflow-hidden mt-6 relative">
      {/* Decorative background grid (subtle) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

      {/* Table Header / Toolbar */}
      <div className="p-5 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-900/50 gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></span>
          {title}
        </h3>
        
        <div className="flex gap-3 w-full sm:w-auto">
           {/* Search Input */}
           <div className="relative group w-full sm:w-64">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
             <input 
               type="text" 
               placeholder="Search records..." 
               className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
             />
           </div>

           {/* Add New Button */}
           <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 whitespace-nowrap">
             <Plus size={16} />
             Add New
           </button>
        </div>
      </div>

      {/* The Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-400">
          <thead className="bg-slate-900/80 text-slate-300 uppercase text-xs font-bold tracking-wider border-b border-slate-700">
            <tr>
              {headers.map((head, index) => (
                <th key={index} className="px-6 py-4 first:pl-6 last:pr-6">{head}</th>
              ))}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-emerald-900/10 transition-colors group relative">
                {row.map((cell, i) => (
                  <td key={i} className="px-6 py-4 whitespace-nowrap group-hover:text-emerald-100 transition-colors text-sm">
                    {/* Status Badge Logic (Optional styling for "Active"/"Inactive" text) */}
                    {cell === "Active" || cell === "Online" ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold">
                        {cell}
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
         <span>Showing <strong className="text-emerald-400">1</strong> to <strong className="text-emerald-400">5</strong> of 12 entries</span>
         <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-all">
               <ChevronLeft size={14} />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">1</button>
            <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all">2</button>
            <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all">3</button>
            <button className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all">
               <ChevronRight size={14} />
            </button>
         </div>
      </div>
    </div>
  );
}