import React from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Table({ headers, data, title, showAddButton = true }) {
    return (
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden mt-6 relative transition-all duration-500">
            {/* Decorative background grid (Visible in Dark Mode only) */}
            <div className="absolute inset-0 opacity-0 dark:opacity-[0.03] pointer-events-none transition-opacity duration-500" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            {/* Table Header / Toolbar */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 gap-4 transition-colors duration-500">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-sm dark:shadow-[0_0_10px_#10b981]"></span>
                    {title}
                </h3>

                <div className="flex gap-3 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative group w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            className="w-full text-sm rounded-lg pl-10 pr-4 py-2 outline-none transition-all placeholder:text-slate-400
                 bg-white border border-slate-200 text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500
                 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300
               "
                        />
                    </div>

                    {/* Add New Button */}
                    {showAddButton && (
                        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                            <Plus size={16} />
                            Add New
                        </button>
                    )}
                </div>
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-500 dark:text-slate-400">
                    <thead className="uppercase text-xs font-bold tracking-wider border-b border-slate-200 dark:border-slate-700
            bg-slate-50 text-slate-600
            dark:bg-slate-900/80 dark:text-slate-300
          ">
                        <tr>
                            {headers.map((head, index) => (
                                <th key={index} className="px-6 py-4 first:pl-6 last:pr-6">{head}</th>
                            ))}
                            {showAddButton && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {data.map((row, index) => (
                            <tr key={index} className="transition-colors group relative
                hover:bg-slate-50 dark:hover:bg-emerald-900/10
              ">
                                {row.map((cell, i) => (
                                    <td key={i} className="px-6 py-4 whitespace-nowrap transition-colors text-sm group-hover:text-slate-700 dark:group-hover:text-emerald-100">
                                        {/* Status Badge Logic */}
                                        {cell === "Active" || cell === "Online" ? (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold border
                        bg-emerald-100 text-emerald-700 border-emerald-200
                        dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
                      ">
                                                {cell}
                                            </span>
                                        ) : (
                                            cell
                                        )}
                                    </td>
                                ))}
                                {showAddButton && (
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button className="p-2 rounded-lg transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-2 rounded-lg transition-all text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 transition-colors
        bg-slate-50/50 text-slate-500
        dark:bg-slate-900/50 dark:text-slate-500
      ">
                <span>Showing <strong className="text-emerald-600 dark:text-emerald-400">1</strong> to <strong className="text-emerald-600 dark:text-emerald-400">5</strong> of 12 entries</span>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg border transition-all disabled:opacity-50
              bg-white border-slate-200 text-slate-400 hover:bg-slate-100
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700
            ">
                        <ChevronLeft size={14} />
                    </button>

                    <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold shadow-md">1</button>

                    <button className="px-3 py-1.5 rounded-lg border transition-all
              bg-white border-slate-200 text-slate-600 hover:bg-slate-100
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700
            ">2</button>

                    <button className="px-3 py-1.5 rounded-lg border transition-all
              bg-white border-slate-200 text-slate-600 hover:bg-slate-100
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700
            ">3</button>

                    <button className="p-2 rounded-lg border transition-all
              bg-white border-slate-200 text-slate-400 hover:bg-slate-100
              dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700
            ">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
