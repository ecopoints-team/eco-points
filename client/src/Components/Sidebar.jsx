'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Package, FileText, Activity,
    LogOut, Leaf, ChevronLeft, ChevronRight, ChevronDown, Settings, Building2, Trophy, BarChart3, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SidebarItem = ({ icon: Icon, label, href, collapsed, active, hasChildren, expanded, onToggle, hidden, children: childrenItems }) => {
    // Don't render if hidden
    if (hidden) return null;

    // GROUP HEADER (Collapsible) - With flyout menu when collapsed
    if (hasChildren) {
        return (
            <div className="relative group">
                <button
                    onClick={onToggle}
                    className={`
                        w-full relative flex items-center h-12 px-3 my-1.5 rounded-xl transition-all duration-300
                        ${active || expanded
                            ? 'bg-slate-800/50 text-white dark:bg-transparent dark:text-white'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-emerald-300'
                        }
                        ${collapsed ? 'justify-center' : 'justify-between'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${active || expanded ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-slate-400 group-hover:text-emerald-500'}`}>
                            <Icon size={20} />
                        </div>
                        {!collapsed && <span className="font-semibold text-sm tracking-wide">{label}</span>}
                    </div>
                    {!collapsed && (
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-300 ${expanded ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
                        />
                    )}
                </button>

                {/* FLYOUT MENU - Shows on hover when collapsed (Snipe-IT style) */}
                {collapsed && childrenItems && childrenItems.length > 0 && (
                    <div className="absolute left-full top-0 ml-2 py-2 px-1 min-w-[180px] bg-slate-800 dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        {/* Header */}
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 mb-1 flex items-center gap-2">
                            <Icon size={14} className="text-emerald-400" />
                            {label}
                        </div>
                        {/* Submenu Items */}
                        {childrenItems.map((child, idx) => (
                            <Link
                                key={idx}
                                href={child.href}
                                className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-lg text-sm transition-colors ${child.active
                                    ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${child.active ? 'bg-emerald-400' : 'bg-slate-500'}`}></div>
                                {child.label}
                            </Link>
                        ))}
                        {/* Arrow pointer */}
                        <div className="absolute left-0 top-4 -translate-x-1 w-2 h-2 bg-slate-800 dark:bg-slate-900 rotate-45 border-l border-b border-slate-700"></div>
                    </div>
                )}
            </div>
        );
    }

    // STANDARD LINK
    return (
        <Link
            href={href}
            className={`
                relative flex items-center h-12 px-3 my-1.5 rounded-xl transition-all duration-300 group
                ${active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-emerald-900 dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:border dark:border-emerald-500/50'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white dark:border dark:border-transparent'
                }
                ${collapsed ? 'justify-center' : 'justify-start'}
            `}
        >
            <Icon
                size={20}
                className={`shrink-0 transition-all duration-300 ${active ? 'text-emerald-700 dark:text-white dark:drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`}
            />

            {!collapsed && (
                <span className="ml-3 font-medium text-sm whitespace-nowrap">
                    {label}
                </span>
            )}

            {/* Glowing Indicator Line (Dark Mode Only) */}
            {active && !collapsed && (
                <div className="hidden dark:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_#34d399]"></div>
            )}

            {/* Tooltip for collapsed sidebar */}
            {collapsed && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
            )}
        </Link>
    );
};

const SubMenuItem = ({ label, href, active, hidden }) => {
    if (hidden) return null;

    return (
        <Link
            href={href}
            className={`
          flex items-center py-2 pl-11 pr-3 my-1 rounded-lg text-sm transition-all duration-200 relative
          ${active
                    ? 'text-emerald-700 font-bold bg-emerald-900/20 dark:text-emerald-300 dark:font-medium dark:bg-transparent'
                    : 'text-slate-500 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-200'
                }
        `}
        >
            {/* Tiny dot connector */}
            <div className={`absolute left-[2.25rem] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-300 ${active ? 'bg-emerald-600 dark:bg-emerald-400 dark:shadow-[0_0_8px_#34d399]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
            <span className="ml-2">{label}</span>
        </Link>
    );
};

export default function Sidebar({ isOpen, setIsOpen, isMobile, closeMobile, isDarkMode }) {
    const pathname = usePathname();
    const { theme } = useTheme();
    // Accordion state: only one menu can be expanded at a time
    const [activeMenuKey, setActiveMenuKey] = useState(null);
    const router = useRouter();

    // Get auth context
    let currentUser = null;
    let hasPermission = () => false;
    let isSuperAdmin = false;
    let logout = () => { };

    try {
        const auth = useAuth();
        currentUser = auth.currentUser;
        hasPermission = auth.hasPermission;
        isSuperAdmin = auth.isSuperAdmin;
        logout = auth.logout;
    } catch (e) {
        // AuthContext not available yet, use defaults
    }

    // Accordion toggle: clicking an open menu closes it, clicking a closed menu opens it (and closes others)
    const toggleMenu = (key) => {
        setActiveMenuKey(prev => prev === key ? null : key);
    };

    // Navigation structure with permission checks
    const navStructure = [
        {
            type: 'item',
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/admin',
            hidden: false // Everyone can see dashboard
        },
        {
            type: 'item',
            label: 'Locations',
            icon: Building2,
            href: '/admin/locations',
            hidden: !isSuperAdmin // Only Super Admin
        },
        {
            type: 'item',
            label: 'Machines (RVM)',
            icon: Package,
            href: '/admin/machines',
            hidden: !hasPermission('machines', 'view')
        },
        {
            type: 'group',
            key: 'user-management',
            label: 'User Management',
            icon: Users,
            hidden: !hasPermission('users', 'view'),
            children: [
                { label: 'Manage Users', href: '/admin/users' },
                { label: 'Manage Admins', href: '/admin/users/permissions' },
            ]
        },
        {
            type: 'item',
            label: 'Rewards Inventory',
            icon: FileText,
            href: '/admin/rewards',
            hidden: !hasPermission('rewards', 'view')
        },
        {
            type: 'item',
            label: 'Leaderboards',
            icon: Trophy,
            href: '/admin/leaderboards',
            hidden: !hasPermission('leaderboards', 'view')
        },
        {
            type: 'item',
            label: 'Analytics',
            icon: BarChart3,
            href: '/admin/analytics',
            hidden: !hasPermission('logs', 'view')
        },
        {
            type: 'item',
            label: 'Bulk Sessions',
            icon: Layers,
            href: '/admin/bulk-sessions',
            hidden: !hasPermission('logs', 'view')
        },
        {
            type: 'group',
            key: 'logs',
            label: 'System Logs',
            icon: Activity,
            hidden: !hasPermission('logs', 'view'),
            children: [
                { label: 'Bottle Logs', href: '/admin/logs/bottles' },
                { label: 'Machine Logs', href: '/admin/logs/machines' },
                { label: 'Rewards Logs', href: '/admin/logs/rewards' },
                { label: 'Transactions', href: '/admin/logs/transactions' },
                { label: 'Admin Logs', href: '/admin/logs/access', hidden: !isSuperAdmin && !hasPermission('logs', 'view') },
            ]
        },
        {
            type: 'item',
            label: 'Settings',
            icon: Settings,
            href: '/admin/settings',
            hidden: !hasPermission('settings', 'view')
        },
    ];

    // Keep dropdowns open when visiting a page within that group
    useEffect(() => {
        let foundGroup = false;
        navStructure.forEach(item => {
            if (item.type === 'group' && item.children && !item.hidden) {
                const isActive = item.children.some(child => pathname === child.href);
                if (isActive) {
                    setActiveMenuKey(item.key);
                    foundGroup = true;
                }
            }
        });
        if (!foundGroup) {
            setActiveMenuKey(null);
        }
    }, [pathname]);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={closeMobile} />
            )}

            <aside
                className={`
          fixed top-0 left-0 h-full z-50 transition-all duration-300
          border-r shadow-2xl
          ${theme === 'neutral'
                        ? 'bg-gray-800 border-gray-600'
                        : theme === 'system'
                            ? 'bg-[#0F1B11] border-[rgba(123,160,91,0.2)] shadow-[10px_0_30px_rgba(0,0,0,0.5)]'
                            : 'bg-white border-slate-200 dark:bg-[#0f172a] dark:border-slate-800 dark:shadow-[10px_0_30px_rgba(0,0,0,0.5)]'
                    }
          ${isOpen ? 'w-64 translate-x-0' : (isMobile ? '-translate-x-full' : 'w-20 translate-x-0')}
        `}
            >
                {/* LOGO AREA */}
                <div className={`h-24 flex items-center justify-center border-b relative overflow-hidden transition-colors duration-300 ${theme === 'neutral'
                    ? 'bg-gray-900 border-gray-700'
                    : theme === 'system'
                        ? 'bg-[#0F1B11] border-[rgba(123,160,91,0.2)]'
                        : 'bg-white dark:bg-[#020617] border-slate-100 dark:border-slate-800/50'
                    }`}>
                    {/* Subtle Gradient Overlay */}
                    <div className={`absolute top-0 w-full h-full opacity-50 ${theme === 'system'
                        ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[rgba(123,160,91,0.2)] via-[#0F1B11] to-[#0F1B11]'
                        : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white dark:from-emerald-900/20 dark:via-slate-900 dark:to-slate-900'
                        }`}></div>

                    <div className="flex items-center gap-3 overflow-hidden px-4 w-full relative z-10">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/20 ${theme === 'system'
                            ? 'bg-gradient-to-br from-[#7BA05B] to-[#5A8040] shadow-[0_0_15px_rgba(123,160,91,0.3)]'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200 dark:shadow-[0_0_5px_rgba(16,185,129,0.15)] dark:border-white/10'
                            }`}>
                            <Leaf className="text-white" size={22} />
                        </div>
                        <div className={`flex flex-col transition-all duration-300 ${!isOpen ? 'opacity-0 translate-x-4 hidden' : 'opacity-100 translate-x-0'}`}>
                            <span className={`font-bold text-xl tracking-wide font-sans ${theme === 'system' ? 'text-[#E1E4E1]' : 'text-slate-800 dark:text-white'}`}>EcoPoints</span>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'system' ? 'text-[#7BA05B]' : 'text-emerald-600 dark:text-emerald-400'}`}>Admin Panel</span>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION LIST */}
                <nav className={`px-3 py-6 space-y-1 h-[calc(100vh-160px)] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent ${isOpen ? 'overflow-y-auto' : 'overflow-visible'}`}>
                    {navStructure.map((item, idx) => {
                        if (item.hidden) return null;

                        if (item.type === 'item') {
                            return (
                                <SidebarItem
                                    key={idx}
                                    {...item}
                                    collapsed={!isOpen}
                                    active={pathname === item.href}
                                />
                            );
                        }
                        const isExpanded = activeMenuKey === item.key;
                        const isActive = item.children.some(child => pathname === child.href);
                        // Destructure to separate 'key' from other props to avoid React warning
                        const { key: itemKey, ...itemProps } = item;

                        return (
                            <div key={idx} className="mb-2">
                                <SidebarItem
                                    {...itemProps}
                                    collapsed={!isOpen}
                                    active={isActive}
                                    hasChildren={true}
                                    expanded={isExpanded}
                                    onToggle={() => toggleMenu(itemKey)}
                                    children={item.children.map(child => ({
                                        ...child,
                                        active: pathname === child.href
                                    }))}
                                />

                                <div
                                    className={`
                                        grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                        ${isExpanded && isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                                    `}
                                >
                                    <div className="overflow-hidden transition-all duration-300">
                                        <div className="relative ml-5 pl-3 border-l border-slate-200 dark:border-slate-700/50 my-1 space-y-0.5">
                                            {item.children.map((child, cIdx) => (
                                                <SubMenuItem
                                                    key={cIdx}
                                                    {...child}
                                                    active={pathname === child.href}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* COLLAPSE TOGGLE BUTTON (Hidden on Mobile) */}
                {!isMobile && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="absolute -right-3 top-28 bg-white dark:bg-emerald-500 border border-slate-200 dark:border-[#0f172a] p-1 rounded-full shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.6)] text-slate-500 dark:text-black hover:text-emerald-600 dark:hover:bg-white transition-all z-50 hover:scale-110"
                    >
                        {isOpen ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
                    </button>
                )}

                {/* FOOTER */}
                <div className={`absolute bottom-0 left-0 w-full p-4 border-t transition-colors duration-300 ${theme === 'system'
                    ? 'border-[rgba(123,160,91,0.2)] bg-[#0F1B11]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]'
                    }`}>
                    <button
                        onClick={() => { logout(); router.push('/?login=true'); }}
                        className={`
                            relative flex items-center h-12 px-3 my-1.5 rounded-xl transition-all duration-300 group w-full
                            ${theme === 'system'
                                ? 'text-[#E1E4E1]/60 hover:bg-red-900/20 hover:text-red-400'
                                : 'text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/10 dark:hover:text-red-400'}
                            ${!isOpen ? 'justify-center' : 'justify-start'}
                        `}
                    >
                        <LogOut
                            size={20}
                            className={`shrink-0 transition-all duration-300 group-hover:text-red-600 dark:group-hover:text-red-400`}
                        />

                        {isOpen && (
                            <span className="ml-3 font-medium text-sm whitespace-nowrap">
                                Sign Out
                            </span>
                        )}

                        {!isOpen && (
                            <div className={`absolute left-full ml-3 px-3 py-2 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 ${theme === 'system' ? 'bg-[#1A2E1F]' : 'bg-slate-800'}`}>
                                Sign Out
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rotate-45 ${theme === 'system' ? 'bg-[#1A2E1F]' : 'bg-slate-800'}`}></div>
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
