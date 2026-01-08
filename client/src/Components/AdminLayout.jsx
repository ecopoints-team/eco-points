'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Sun, Moon, Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  // 1. Theme State (Default to true for Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // 2. Sidebar & Mobile State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 3. Handle Screen Resize (Responsiveness)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobile(true);
        setSidebarOpen(false); // Auto-close on mobile
      } else {
        setIsMobile(false);
        setSidebarOpen(true); // Auto-open on desktop
      }
    };
    handleResize(); // Run on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    // WRAPPER: Toggles 'dark' class on the whole layout
    <div className={`${isDarkMode ? 'dark' : ''} flex h-screen overflow-hidden transition-colors duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]`}>
      
      {/* GLOBAL BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#020617] transition-colors duration-700 -z-10">
         {/* Cyber Grid (Subtle in Light, Glowing in Dark) */}
         <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03] pointer-events-none transition-opacity duration-700" 
             style={{
               backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
               backgroundSize: '40px 40px',
               color: isDarkMode ? '#10b981' : '#cbd5e1' // Emerald in Dark, Slate in Light
             }}>
        </div>
      </div>

      {/* SIDEBAR COMPONENT */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isMobile={isMobile} 
        closeMobile={() => setSidebarOpen(false)} 
      />

      {/* MAIN CONTENT AREA */}
      <div className={`
        flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] relative
        ${!isMobile && sidebarOpen ? 'ml-64' : (!isMobile && !sidebarOpen ? 'ml-20' : 'ml-0')}
      `}>
        
        {/* HEADER */}
        <header className="h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30
          bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-200 dark:border-emerald-500/20 
          transition-all duration-500 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            )}

            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white transition-colors duration-500">
              Dashboard <span className="text-emerald-600 dark:text-emerald-400 font-light">Overview</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* THEME TOGGLE BUTTON */}
            <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-emerald-400 border border-gray-200 dark:border-emerald-500/30 hover:scale-110 transition-all duration-300 shadow-sm"
               title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* SYSTEM STATUS PILL (Hidden on small mobile) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 shadow-sm transition-colors duration-500">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
               </span>
               <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">SYSTEM ONLINE</span>
            </div>
             
             {/* ADMIN AVATAR */}
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[2px] shadow-md">
               <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white transition-colors duration-500">
                 AD
               </div>
             </div>
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-emerald-600/30 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}