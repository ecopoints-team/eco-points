'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { Menu, Settings, LogOut, ChevronDown, MapPin, Users, Building2, Eye, Sun, Moon } from 'lucide-react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../data/mockData';

// Main layout component that uses AuthContext and ThemeContext
export default function AdminLayout({ children }) {
  // Theme State from Context
  const { isDarkMode, toggleTheme } = useTheme();

  // Sidebar & Mobile State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);

  // Auth Context
  const {
    currentUser,
    switchUser,
    allAdminUsers,
    allLocations,
    isSuperAdmin,
    effectiveLocationId,
    currentLocation,
    viewAsLocationId,
    setViewAsLocation
  } = useAuth();

  // Handle Screen Resize
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

  // Get role display info
  const getRoleInfo = (role) => {
    return ROLES[role] || { name: role, color: 'slate' };
  };

  const roleInfo = getRoleInfo(currentUser?.role);
  const roleColorClasses = {
    red: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} flex h-screen overflow-hidden transition-colors duration-700 ease-in-out`}>

      {/* GLOBAL BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#020617] transition-colors duration-700 -z-10">
        {/* Cyber Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-700"
          style={{
            backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            color: '#10b981'
          }}>
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isMobile={isMobile}
        closeMobile={() => setSidebarOpen(false)}
        isDarkMode={true}
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

            {/* LOCATION BADGE */}
            {currentLocation ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm transition-colors duration-500
                bg-purple-100 border border-purple-200
                dark:bg-purple-500/10 dark:border-purple-500/20">
                <MapPin size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold tracking-wider text-purple-700 dark:text-purple-400">
                  {currentLocation.name}
                </span>
              </div>
            ) : isSuperAdmin && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm transition-colors duration-500
                bg-red-100 border border-red-200
                dark:bg-red-500/10 dark:border-red-500/20">
                <Building2 size={14} className="text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold tracking-wider text-red-700 dark:text-red-400">
                  ALL LOCATIONS
                </span>
              </div>
            )}

            {/* SUPER ADMIN - VIEW AS LOCATION SELECTOR */}
            {isSuperAdmin && (
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    bg-slate-100 text-slate-600 hover:bg-slate-200
                    dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  <Eye size={14} />
                  <span>View as: {viewAsLocationId ? allLocations.find(l => l.id === viewAsLocationId)?.name : 'All'}</span>
                  <ChevronDown size={12} />
                </button>

                {isLocationSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsLocationSelectorOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 z-50 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5
                      bg-white border border-gray-100
                      dark:bg-[#1e293b] dark:border-slate-700">
                      <div className="py-1">
                        <button
                          onClick={() => { setViewAsLocation(null); setIsLocationSelectorOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                            ${!viewAsLocationId ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                            text-slate-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/50`}
                        >
                          <Building2 size={14} />
                          All Locations
                        </button>
                        {allLocations.map(loc => (
                          <button
                            key={loc.id}
                            onClick={() => { setViewAsLocation(loc.id); setIsLocationSelectorOpen(false); }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                              ${viewAsLocationId === loc.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                              text-slate-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-700/50`}
                          >
                            <MapPin size={14} />
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SYSTEM STATUS PILL */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full shadow-sm transition-colors duration-500
              bg-emerald-100 border border-emerald-200
              dark:bg-emerald-500/10 dark:border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wider text-emerald-700 dark:text-emerald-400">ONLINE</span>
            </div>

            {/* ACCOUNT SWITCHER DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setIsAccountSwitcherOpen(!isAccountSwitcherOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors
                  hover:bg-slate-100 dark:hover:bg-slate-700/50"
              >
                <Users size={14} className="text-slate-400" />
                <span className="hidden sm:inline text-xs font-medium text-slate-600 dark:text-slate-300">Switch Account</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {isAccountSwitcherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAccountSwitcherOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-72 z-50 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5
                    bg-white border border-gray-100
                    dark:bg-[#1e293b] dark:border-slate-700
                    max-h-96 overflow-y-auto">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">TEST ACCOUNTS</p>
                    </div>
                    <div className="py-1">
                      {allAdminUsers.map(user => {
                        const userRoleInfo = getRoleInfo(user.role);
                        const location = allLocations.find(l => l.id === user.locationId);
                        return (
                          <button
                            key={user.id}
                            onClick={() => { switchUser(user.id); setIsAccountSwitcherOpen(false); }}
                            className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-3
                              ${currentUser?.id === user.id
                                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                                : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white">
                              {user.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user.name}</p>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleColorClasses[userRoleInfo.color]}`}>
                                  {userRoleInfo.name}
                                </span>
                                {location && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{location.name}</span>
                                )}
                              </div>
                            </div>
                            {currentUser?.id === user.id && (
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
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
                    {currentUser?.avatar || 'AD'}
                  </div>
                </div>
                <ChevronDown size={14} className="transition-colors hidden sm:block text-slate-500 dark:text-slate-400 group-hover:text-emerald-500" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 z-50 origin-top-right rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none 
                      bg-white border border-gray-100
                      dark:bg-[#1e293b] dark:border-slate-700
                      animate-in fade-in slide-in-from-top-2 duration-200">

                    <div className="py-1">
                      <div className="px-4 py-3 border-b mb-1 border-gray-100 dark:border-slate-700/50">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{currentUser?.name}</p>
                        <p className="text-xs truncate text-slate-500 dark:text-slate-400">{currentUser?.email}</p>
                        <div className="mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${roleColorClasses[roleInfo.color]}`}>
                            {roleInfo.name}
                          </span>
                        </div>
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