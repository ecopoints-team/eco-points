'use client';
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Settings, LogOut, ChevronDown, MapPin, Users, Building2, Eye, Sun, Moon, Circle, Leaf, Bell, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../data/mockData';
import { logs as logsApi } from '../services/apiService';

// View-Only Banner for non-admin roles
export const ViewOnlyBanner = () => {
    const { canManage } = useAuth();
    if (canManage) return null;
    return (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 system:bg-amber-500/10 system:border-amber-500/30 system:text-amber-400">
            <ShieldAlert size={18} />
            <span className="text-sm font-medium">View-only mode — Your role does not have permission to make changes on this page.</span>
        </div>
    );
};

// Wrapper that disables interactive elements for view-only users
export const ViewOnlyWrapper = ({ children }) => {
    const { canManage } = useAuth();
    if (canManage) return <>{children}</>;
    return (
        <div className="relative">
            <div className="pointer-events-none opacity-60 select-none">
                {children}
            </div>
        </div>
    );
};

// 4-Way Theme Toggle Component
const ThemeToggle = ({ theme, setTheme }) => {
    return (
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800 neutral:bg-gray-600 system:bg-[#1A2E1F] border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">
            <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'light'
                    ? 'bg-white text-amber-500 shadow-md'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                title="Light Mode"
            >
                <Sun size={14} />
            </button>
            <button
                onClick={() => setTheme('neutral')}
                className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'neutral'
                    ? 'bg-gray-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                title="Neutral Mode"
            >
                <Circle size={14} />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'dark'
                    ? 'bg-slate-900 text-emerald-400 shadow-md'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                title="Dark Mode"
            >
                <Moon size={14} />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'system'
                    ? 'bg-[#0F1B11] text-[#7BA05B] shadow-md shadow-[rgba(123,160,91,0.3)]'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                title="System Mode"
            >
                <Leaf size={14} />
            </button>
        </div>
    );
};

// Main layout component that uses AuthContext and ThemeContext
export default function AdminLayout({ children }) {
    // Theme State from Context
    const { theme, setTheme, isDarkMode, isNeutralMode, isSystemMode } = useTheme();

    // Get current pathname for conditional rendering
    const pathname = usePathname();
    const isOnLocationsPage = pathname === '/admin/locations';

    // Sidebar & Mobile State - Always start with true (consistent for SSR)
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);

    // Auth Context
    const {
        currentUser,
        isInitialized,
        allLocations,
        isSuperAdmin,
        effectiveLocationId,
        currentLocation,
        viewAsLocationId,
        setViewAsLocation,
        logout,
    } = useAuth();

    // Auth guard — redirect to landing page with login modal if not authenticated
    const router = useRouter();
    useEffect(() => {
        if (isInitialized && !currentUser) {
            router.push('/?login=true');
        }
    }, [isInitialized, currentUser, router]);

    // Load sidebar state from localStorage after mount (client-only)
    useEffect(() => {
        const saved = localStorage.getItem('sidebarOpen');
        if (saved !== null) {
            setSidebarOpen(saved === 'true');
        }
    }, []);

    // Persist sidebar state to localStorage
    const handleSidebarToggle = (newState) => {
        setSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', String(newState));
    };

    // Determine Page Title based on current path
    const getPageTitle = (path) => {
        if (path === '/admin') return { main: 'Dashboard', sub: 'Overview' };
        if (path === '/admin/locations') return { main: 'School', sub: 'Locations' };
        if (path === '/admin/machines') return { main: 'Machine', sub: 'Management' };
        if (path === '/admin/users') return { main: 'User', sub: 'Management' };
        if (path === '/admin/users/permissions') return { main: 'User', sub: 'Permissions' };
        if (path === '/admin/rewards') return { main: 'Rewards', sub: 'Inventory' };
        if (path === '/admin/logs/bottles') return { main: 'System', sub: 'Bottle Logs' };
        if (path === '/admin/logs/access') return { main: 'System', sub: 'Access Logs' };
        if (path === '/admin/logs/machines') return { main: 'System', sub: 'Machine Logs' };
        if (path === '/admin/logs/rewards') return { main: 'System', sub: 'Reward Logs' };
        if (path === '/admin/leaderboards') return { main: 'Leaderboards', sub: 'Overview' };
        if (path === '/admin/settings') return { main: 'Admin', sub: 'Settings' };
        if (path === '/admin/profile') return { main: 'My', sub: 'Profile' };
        return { main: 'Admin', sub: 'Panel' };
    };

    const pageTitle = getPageTitle(pathname);

    // Handle Screen Resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsMobile(true);
                setSidebarOpen(false); // Mobile always starts collapsed
            } else {
                setIsMobile(false);
                // On desktop, restore from localStorage
                const saved = localStorage.getItem('sidebarOpen');
                if (saved !== null) {
                    setSidebarOpen(saved === 'true');
                }
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
        orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    };

    // Determine theme class for root
    const themeClass = theme === 'dark' ? 'dark' : theme === 'neutral' ? 'neutral dark' : theme === 'system' ? 'system dark' : '';

    // Refs for click outside detection
    const profileRef = React.useRef(null);
    const locationRef = React.useRef(null);
    const notificationRef = useRef(null);

    // Notification state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [readNotifications, setReadNotifications] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Load notifications from API (recent admin logs)
    useEffect(() => {
        let cancelled = false;
        const loadNotifications = async () => {
            try {
                const accessLogs = await logsApi.getAccess(effectiveLocationId);
                if (!cancelled) {
                    setNotifications(
                        (accessLogs || []).slice(0, 10).map(log => ({
                            id: log.id,
                            title: log.action,
                            description: `${log.adminName} — ${log.target !== '-' ? log.target : log.category}`,
                            time: log.timestamp,
                            category: log.category,
                            read: readNotifications.includes(log.id),
                        }))
                    );
                }
            } catch {
                // Notifications are non-critical — fail silently
            }
        };
        if (currentUser) loadNotifications();
        return () => { cancelled = true; };
    }, [currentUser, effectiveLocationId]);

    const unreadCount = notifications.filter(n => !readNotifications.includes(n.id)).length;
    const markAllRead = () => setReadNotifications(notifications.map(n => n.id));
    const markRead = (id) => setReadNotifications(prev => prev.includes(id) ? prev : [...prev, id]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }

            if (locationRef.current && !locationRef.current.contains(event.target)) {
                setIsLocationSelectorOpen(false);
            }

            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auth guard — don't render admin layout if not logged in 
    const isAuth = isInitialized && currentUser;
    if (!isAuth) {
        return null;
    }

    return (
        <div className={`${themeClass} flex h-screen overflow-hidden transition-colors duration-700 ease-in-out`}>

            {/* GLOBAL BACKGROUND LAYER */}
            <div className={`absolute inset-0 transition-colors duration-700 -z-10 ${theme === 'light' ? 'bg-slate-100' :
                theme === 'neutral' ? 'bg-gray-700' :
                    theme === 'system' ? 'bg-[#0F1B11]' :
                        'bg-[#020617]'
                }`}>
                {/* Cyber Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity duration-700"
                    style={{
                        backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        color: theme === 'system' ? '#7BA05B' : '#10b981'
                    }}>
                </div>
            </div>

            {/* SIDEBAR */}
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={handleSidebarToggle}
                isMobile={isMobile}
                closeMobile={() => setSidebarOpen(false)}
                isDarkMode={isDarkMode || isNeutralMode || isSystemMode}
            />

            {/* MAIN CONTENT */}
            <div className={`
        flex-1 flex flex-col transition-all duration-500 relative min-w-0
        ${!isMobile && sidebarOpen ? 'ml-64' : (!isMobile && !sidebarOpen ? 'ml-20' : 'ml-0')}
      `}>

                {/* HEADER */}
                <header className={`h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30
          backdrop-blur-md border-b transition-all duration-500 shadow-sm ${theme === 'light' ? 'bg-gray-50/90 border-gray-200/80' :
                        theme === 'neutral' ? 'bg-gray-600/80 border-gray-500' :
                            theme === 'system' ? 'bg-[#1A2E1F]/80 border-[rgba(123,160,91,0.2)]' :
                                'bg-[#0f172a]/80 border-emerald-500/20'
                    }`}
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
                            {pageTitle.main} <span className="text-indigo-500 dark:text-indigo-400 system:text-indigo-400 font-light text-sm sm:text-xl">{pageTitle.sub}</span>
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">

                        {/* LOCATION BADGE - Always visible, shows current view context */}
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
                bg-lime-100 border border-lime-300
                dark:bg-lime-500/10 dark:border-lime-500/20
                system:bg-[rgba(123,160,91,0.15)] system:border-[rgba(123,160,91,0.3)]">
                                <Building2 size={14} className="text-lime-600 dark:text-lime-400 system:text-[#7BA05B]" />
                                <span className="text-xs font-bold tracking-wider text-lime-700 dark:text-lime-400 system:text-[#7BA05B]">
                                    ALL LOCATIONS
                                </span>
                            </div>
                        )}

                        {/* SUPER ADMIN - VIEW AS LOCATION SELECTOR - Hidden on Locations page */}
                        {!isOnLocationsPage && isSuperAdmin && (
                            <div className="relative" ref={locationRef}>
                                <button
                                    onClick={() => setIsLocationSelectorOpen(!isLocationSelectorOpen)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30`}
                                >
                                    <Eye size={14} />
                                    <span className="hidden sm:inline">View as: {viewAsLocationId ? allLocations.find(l => l.id === viewAsLocationId)?.name : 'All'}</span>
                                    <ChevronDown size={12} />
                                </button>

                                {isLocationSelectorOpen && (
                                    <>
                                        <div className={`absolute right-0 mt-2 w-48 z-50 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700`}>
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

                        {/* NOTIFICATION BELL */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-slate-700/50 transition-colors"
                                title="Notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className={`absolute right-0 mt-3 w-80 z-50 origin-top-right rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 overflow-hidden
                   bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700`}>
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <button
                                                    key={n.id}
                                                    onClick={() => markRead(n.id)}
                                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-slate-700/30 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30
                            ${!n.read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm ${!n.read ? 'font-semibold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{n.description}</p>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{n.time}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-900/50">
                                        <Link href="/admin/logs/access">
                                            <button
                                                onClick={() => setIsNotificationOpen(false)}
                                                className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline py-1"
                                            >
                                                View All Activity →
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* THEME TOGGLE */}
                        <ThemeToggle theme={theme} setTheme={setTheme} />

                        {/* PROFILE DROPDOWN */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 focus:outline-none group"
                            >
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px] shadow-md group-hover:shadow-lg transition-all">
                                    <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-bold transition-colors bg-white text-slate-700 dark:bg-slate-900 dark:text-white`}>
                                        {currentUser?.name ? currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
                                    </div>
                                </div>
                                <ChevronDown size={14} className="transition-colors hidden sm:block text-slate-500 dark:text-slate-400 group-hover:text-indigo-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <>
                                    <div className={`absolute right-0 mt-3 w-56 z-50 origin-top-right rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none 
                      animate-in fade-in slide-in-from-top-2 duration-200 bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700`}>

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
                                                <button onClick={() => setIsProfileOpen(false)} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                            text-slate-700 hover:bg-gray-50 hover:text-indigo-600
                            dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-indigo-400">
                                                    <Settings size={16} />
                                                    Manage Profile
                                                </button>
                                            </Link>

                                            <button
                                                onClick={async () => { await logout(); router.push('/?login=true'); }}
                                                className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors
                            text-red-600 hover:bg-red-50
                            dark:text-red-400 dark:hover:bg-red-900/10">
                                                    <LogOut size={16} />
                                                    Sign Out
                                                </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </header>

                {/* CONTENT */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-emerald-600/30 scrollbar-track-transparent">
                    {children}
                </main>
            </div>
        </div>
    );
}
