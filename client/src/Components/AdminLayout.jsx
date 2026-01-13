'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function AdminLayout({ children }) {
  // 1. Theme State (LOCKED TO DARK MODE)
  const [isDarkMode] = useState(true);

  // 2. Sidebar & Mobile State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 3. Handle Screen Resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setSidebarOpen(false);
      } else {
        setIsMobile(false);
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    // WRAPPER: Always applies 'dark' class now
    <div className={`${isDarkMode ? 'dark' : ''} flex h-screen overflow-hidden transition-colors duration-700 ease-in-out`}>

      {/* GLOBAL BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#020617] transition-colors duration-700 -z-10">
        {/* Cyber Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-700"
          style={{
            backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            color: '#10b981' // Locked to Emerald (Dark Mode Color)
          }}>
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
        closeMobile={() => setSidebarOpen(false)}
        isDarkMode={true} // Force prop to true
      />

      {/* MAIN CONTENT */}
      <div className={`
        flex-1 flex flex-col transition-all duration-500 relative w-full
        ${!isMobile && sidebarOpen ? 'ml-64' : (!isMobile && !sidebarOpen ? 'ml-20' : 'ml-0')}
      `}>

        {/* HEADER */}
        <header className="h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30
          bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md 
          border-b border-gray-200 dark:border-emerald-500/20 
          transition-all duration-500 shadow-sm"
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            )}

            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white transition-colors duration-500 flex flex-col sm:block leading-tight">
              Dashboard <span className="text-emerald-600 dark:text-emerald-400 font-light text-sm sm:text-xl">Overview</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">

            {/* SYSTEM STATUS PILL */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full shadow-sm transition-colors duration-500
              bg-emerald-100 border border-emerald-200
              dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-emerald-700 dark:text-emerald-400">SYSTEM ONLINE</span>
            </div>

            {/* PROFILE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 focus:outline-none group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] shadow-md group-hover:shadow-lg transition-all">
                  <div className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      bg-white text-slate-700
                      dark:bg-slate-900 dark:text-white">
                    AD
                  </div>
                </div>
                <ChevronDown size={14} className="transition-colors hidden sm:block text-slate-500 dark:text-slate-400 group-hover:text-emerald-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-48 z-50 origin-top-right rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none 
                      bg-white border border-gray-100
                      dark:bg-[#1e293b] dark:border-slate-700
                      animate-in fade-in slide-in-from-top-2 duration-200">

                    <div className="py-1">
                      <div className="px-4 py-3 border-b mb-1 border-gray-100 dark:border-slate-700/50">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">Admin User</p>
                        <p className="text-xs truncate text-slate-500 dark:text-slate-400">admin@ecopoints.com</p>
                      </div>

                      <Link href="/admin/profile">
                        <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                            text-slate-700 hover:bg-gray-50 hover:text-emerald-600
                            dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-emerald-400">
                          <Settings size={16} />
                          Manage Profile
                        </button>
                      </Link>

                      <Link href="/">
                        <button className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                            text-red-600 hover:bg-red-50
                            dark:text-red-400 dark:hover:bg-red-900/10">
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-emerald-600/30 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}