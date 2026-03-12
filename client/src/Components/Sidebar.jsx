'use client';
import React, { useState } from 'react';
import Link from 'next/link';
<<<<<<< Updated upstream
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Package, FileText, Activity, 
  LogOut, Leaf, ChevronLeft, ChevronRight, ChevronDown 
=======
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, Package, FileText, Activity,
    LogOut, Leaf, ChevronLeft, ChevronRight, ChevronDown, Settings, Building2, Trophy, BarChart3, Layers
>>>>>>> Stashed changes
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, href, collapsed, active, hasChildren, expanded, onToggle }) => {
  // 1. GROUP HEADER (Collapsible)
  if (hasChildren) {
    return (
      <button 
        onClick={onToggle}
        className={`
          w-full relative flex items-center h-12 px-3 my-1.5 rounded-xl transition-all duration-300 group
          ${active || expanded 
            ? 'text-white' 
            : 'text-slate-400 hover:bg-white/5 hover:text-emerald-300'
          }
          ${collapsed ? 'justify-center' : 'justify-between'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-all duration-300 ${active || expanded ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-slate-400 group-hover:text-emerald-400'}`}>
            <Icon size={20} />
          </div>
          {!collapsed && <span className="font-semibold text-sm tracking-wide">{label}</span>}
        </div>
        {!collapsed && (
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-300 ${expanded ? 'rotate-180 text-emerald-400' : 'text-slate-600'}`} 
          />
        )}
      </button>
    );
  }

<<<<<<< Updated upstream
  // 2. STANDARD LINK
  return (
    <Link 
      href={href}
      className={`
        relative flex items-center h-12 px-3 my-1.5 rounded-xl transition-all duration-300 group
        ${active 
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-900 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-500/50' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
=======
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
>>>>>>> Stashed changes
        }
        ${collapsed ? 'justify-center' : 'justify-start'}
      `}
    >
      <Icon 
        size={20} 
        className={`shrink-0 transition-all duration-300 ${active ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'group-hover:text-emerald-400'}`} 
      />
      
      {!collapsed && (
        <span className="ml-3 font-medium text-sm whitespace-nowrap">
          {label}
        </span>
      )}

      {/* Glowing Indicator Line for Active State */}
      {active && !collapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_#34d399]"></div>
      )}
    </Link>
  );
};

const SubMenuItem = ({ label, href, active }) => (
  <Link 
    href={href}
    className={`
      flex items-center py-2 pl-11 pr-3 my-1 rounded-lg text-sm transition-all duration-200 relative
      ${active 
        ? 'text-emerald-300 font-medium' 
        : 'text-slate-500 hover:text-emerald-200'
      }
    `}
  >
    {/* Tiny dot connector */}
    <div className={`absolute left-[2.25rem] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-700'}`}></div>
    {label}
  </Link>
);

export default function Sidebar({ isOpen, setIsOpen, isMobile, closeMobile }) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState(['user-management', 'logs']);

  const toggleMenu = (key) => {
    setExpandedMenus(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const navStructure = [
    { type: 'item', label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { type: 'item', label: 'Machines (RVM)', icon: Package, href: '/admin/machines' },
    { 
      type: 'group', 
      key: 'user-management',
      label: 'User Management', 
      icon: Users, 
      children: [
        { label: 'All Users', href: '/admin/users' },
        { label: 'Permissions', href: '/admin/users/permissions' },
      ]
    },
    { type: 'item', label: 'Rewards Inventory', icon: FileText, href: '/admin/rewards' },
    { 
      type: 'group', 
      key: 'logs',
      label: 'System Logs', 
      icon: Activity, 
      children: [
        { label: 'Bottle Logs', href: '/admin/logs/bottles' },
        { label: 'Admin Access', href: '/admin/logs/access' },
      ]
    },
  ];

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" onClick={closeMobile} />
      )}

      <aside 
        className={`
          fixed top-0 left-0 h-full z-50 bg-[#0f172a] border-r border-slate-800 shadow-[10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300
          ${isOpen ? 'w-64' : 'w-20'}
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        `}
      >
        {/* LOGO AREA */}
        <div className="h-24 flex items-center justify-center border-b border-slate-800/50 relative overflow-hidden bg-[#020617]">
            <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900 opacity-50"></div>
          
          <div className="flex items-center gap-3 overflow-hidden px-4 w-full relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/10">
              <Leaf className="text-white fill-white/20" size={22} />
            </div>
            <div className={`flex flex-col transition-all duration-300 ${!isOpen ? 'opacity-0 translate-x-4 hidden' : 'opacity-100 translate-x-0'}`}>
              <span className="font-bold text-xl text-white tracking-wide font-sans">EcoPoints</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION LIST */}
        <nav className="px-3 py-6 space-y-1 h-[calc(100vh-160px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {navStructure.map((item, idx) => {
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
            const isExpanded = expandedMenus.includes(item.key);
            const isActive = item.children.some(child => pathname === child.href);
            
            return (
              <div key={idx} className="mb-2">
                <SidebarItem
                  {...item}
                  collapsed={!isOpen}
                  active={isActive}
                  hasChildren={true}
                  expanded={isExpanded}
                  onToggle={() => {
                    if (!isOpen) setIsOpen(true);
                    toggleMenu(item.key);
                  }}
                />
                
                <div 
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                  `}
                >
                  <div className="relative ml-5 pl-3 border-l border-slate-700/50 my-1 space-y-0.5">
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
            );
          })}
        </nav>

        {/* COLLAPSE TOGGLE BUTTON */}
        {!isMobile && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -right-3 top-28 bg-emerald-500 border-2 border-[#0f172a] p-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)] text-black hover:bg-white transition-all z-50 hover:scale-110"
          >
            {isOpen ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
          </button>
        )}

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-[#020617]">
          <SidebarItem 
            icon={LogOut} 
            label="Sign Out" 
            href="/" 
            collapsed={!isOpen} 
            active={false} 
          />
        </div>
      </aside>
    </>
  );
}