// Home Page
// Navigation Bar

"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Trophy, Gift } from "lucide-react";
import { useAuth, ADMIN_ROLES } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const navItems = ["Home", "How It Works", "Features", "Leaderboard", "Rewards"];

export default function NavBar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  
  const { currentUser, isInitialized, logout } = useAuth();
  // Task 28: hide admin accounts from the public site NavBar.
  // Admin roles belong only to /admin. The currentUser object stays intact
  // (AdminLayout needs it), but the public site treats it as "no user".
  const publicUser = currentUser && ADMIN_ROLES.has(currentUser.role) ? null : currentUser;
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prefetch profile, rewards, and leaderboard for instant transitions
  useEffect(() => {
    if (router) {
      router.prefetch("/profile");
      router.prefetch("/rewards");
      router.prefetch("/leaderboard");
    }
  }, [router]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDashboardClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (publicUser?.role && ['superadmin', 'head_admin', 'auditor', 'inventory_officer', 'technician'].includes(publicUser.role)) {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
  };

  const initials = publicUser?.name
    ? publicUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Scroll-responsive background
  const scrolledRef = useRef(false);
  const pendingNavigationRef = useRef(null);
  const pendingNavigationTimeoutRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const val = window.scrollY > 50;
      if (val !== scrolledRef.current) {
        scrolledRef.current = val;
        setScrolled(val);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (pendingNavigationTimeoutRef.current) {
        clearTimeout(pendingNavigationTimeoutRef.current);
      }
    };
  }, []);

  // Scroll spy — derive active section from viewport focus line
  useEffect(() => {
    const ids = navItems.map((item) => item.toLowerCase().replace(/\s+/g, "-"));

    const clearPendingNavigation = () => {
      pendingNavigationRef.current = null;
      if (pendingNavigationTimeoutRef.current) {
        clearTimeout(pendingNavigationTimeoutRef.current);
        pendingNavigationTimeoutRef.current = null;
      }
    };

    const getSectionEntries = () =>
      ids
        .map((id) => ({ id, el: document.getElementById(id) }))
        .filter((entry) => Boolean(entry.el));

    const syncActiveSection = () => {
      const focusY = window.innerHeight * 0.35;
      const sectionEntries = getSectionEntries();

      if (sectionEntries.length === 0) return;

      const pendingTarget = pendingNavigationRef.current;
      if (pendingTarget) {
        if (pendingTarget === "home") {
          if (window.scrollY <= 8) {
            clearPendingNavigation();
          }
          return;
        }

        const pendingEntry = sectionEntries.find((entry) => entry.id === pendingTarget);
        if (!pendingEntry) {
          clearPendingNavigation();
          return;
        }

        const pendingRect = pendingEntry.el.getBoundingClientRect();
        if (pendingRect.top <= focusY && pendingRect.bottom >= focusY) {
          setActiveSection(pendingTarget);
          clearPendingNavigation();
        }
        return;
      }

      let nextActiveSection = sectionEntries[0].id;
      let nearestDistance = Number.POSITIVE_INFINITY;

      sectionEntries.forEach(({ id, el }) => {
        const rect = el.getBoundingClientRect();

        if (rect.top <= focusY && rect.bottom >= focusY) {
          nextActiveSection = id;
          nearestDistance = 0;
          return;
        }

        const distance = Math.abs(rect.top - focusY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nextActiveSection = id;
        }
      });

      setActiveSection((prev) => (prev === nextActiveSection ? prev : nextActiveSection));
    };

    const onScroll = () => syncActiveSection();
    const onResize = () => syncActiveSection();

    const domObserver = new MutationObserver(() => {
      syncActiveSection();
    });

    domObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    syncActiveSection();

    return () => {
      domObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const handleNavigate = (id) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);

    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    pendingNavigationRef.current = id;

    if (pendingNavigationTimeoutRef.current) {
      clearTimeout(pendingNavigationTimeoutRef.current);
    }

    pendingNavigationTimeoutRef.current = window.setTimeout(() => {
      pendingNavigationRef.current = null;
      pendingNavigationTimeoutRef.current = null;
    }, 2500);

    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(`/#${id}`);
      }
    }
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-3xl w-[95%] max-w-[1200px] transition-all duration-700 ease-out ${scrolled
        ? "bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-3 px-4 md:px-6"
        : "bg-transparent py-3 px-4 md:px-6"
        }`}
    >
      <div className="flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer group"
          onClick={() => handleNavigate("home")}
        >
          <img
            src="/ecopoints-logo-mark.png"
            alt="EcoPoints Logo"
            className="h-10 md:h-12 w-auto transition-all duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* Desktop Nav Items */}
        <ul
          className={`hidden md:flex gap-8 font-bold text-sm px-6 py-2.5 rounded-full border shadow-sm transition-all duration-500 ${scrolled
            ? "bg-white/50 backdrop-blur-md border-white/60"
            : "bg-white/50 backdrop-blur-sm border-slate-200/40"
            }`}
          style={{ fontFamily: "'Quicksand'" }}
        >
          {navItems.map((item) => {
            const id = item.toLowerCase().replace(/\s+/g, "-");
            const isActive = activeSection === id;
            return (
              <li
                key={item}
                className={`relative group cursor-pointer transition-colors ${isActive
                  ? "text-[#10b981]"
                  : scrolled
                    ? "text-slate-500 hover:text-slate-900"
                    : "text-[#064e3b] hover:text-[#10b981]"
                  }`}
                onClick={() => handleNavigate(id)}
              >
                {item}
                <span
                  className={`absolute -bottom-1.5 left-0 w-full h-[2px] bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-300 origin-left ${isActive
                    ? "scale-x-100 opacity-100"
                    : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                    }`}
                />
              </li>
            );
          })}
        </ul>

        {/* Desktop Login / Profile Button */}
        <div className="hidden md:block relative" ref={dropdownRef}>
          {isInitialized && publicUser ? (
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDropdown}
                type="button"
                className="flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-xs shadow-inner select-none">
                  {initials}
                </div>
                <div className="text-left font-bold text-xs max-w-[120px] truncate text-slate-700" style={{ fontFamily: "'Quicksand'" }}>
                  {publicUser.name}
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 group-hover:text-slate-600 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Premium Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-2 z-[1001] flex flex-col gap-1 transition-all duration-300 transform origin-top-right">
                  <div className="px-3 py-2 text-left">
                    <p className="text-xs font-black text-slate-800" style={{ fontFamily: "'Fredoka'" }}>{publicUser.name}</p>
                    <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mt-0.5" style={{ fontFamily: "'Quicksand'" }}>
                      {publicUser.role ? publicUser.role.replace('_', ' ') : 'User'}
                    </p>
                  </div>
                  <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsMobileMenuOpen(false);
                      router.push("/profile");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left web-web-rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <User size={14} className="text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsMobileMenuOpen(false);
                      router.push("/rewards");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left web-web-rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <Gift size={14} className="text-slate-400" />
                    Browse Rewards
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsMobileMenuOpen(false);
                      router.push("/leaderboard");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left web-web-rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <Trophy size={14} className="text-slate-400" />
                    Leaderboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-left web-web-rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-xs font-bold cursor-pointer border-none bg-transparent w-full"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : isInitialized ? (
            <button
              id="navbar-login-btn"
              type="button"
              onClick={onLoginClick}
              className="px-8 py-3 bg-gradient-to-r from-[#10b981] to-[#34d399] border-none rounded-full text-white font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)]"
              style={{ fontFamily: "'Quicksand'" }}
            >
              Login
            </button>
          ) : null}
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`md:hidden p-2 focus:outline-none transition-colors ${scrolled ? "text-slate-900" : "text-[#064e3b]"
            }`}
          aria-label="Toggle menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
          {navItems.map((item) => {
            const id = item.toLowerCase().replace(/\s+/g, "-");
            const isActive = activeSection === id;
            return (
              <button
                key={item}
                onClick={() => handleNavigate(id)}
                className={`text-left text-lg font-bold p-3 web-web-rounded-xl transition-colors ${isActive
                  ? "bg-green-100 text-green-600"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {item}
              </button>
            );
          })}
          {isInitialized && publicUser ? (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 web-web-rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-sm shadow-inner">
                  {initials}
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-slate-800" style={{ fontFamily: "'Fredoka'" }}>{publicUser.name}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest" style={{ fontFamily: "'Quicksand'" }}>
                    {publicUser.role ? publicUser.role.replace('_', ' ') : 'User'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  router.push("/profile");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold web-web-rounded-xl transition-colors cursor-pointer text-sm border-none mb-1"
                style={{ fontFamily: "'Quicksand'" }}
              >
                <User size={16} />
                My Profile
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  router.push("/rewards");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold web-web-rounded-xl transition-colors cursor-pointer text-sm border-none mb-1"
                style={{ fontFamily: "'Quicksand'" }}
              >
                <Gift size={16} />
                Browse Rewards
              </button>
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsMobileMenuOpen(false);
                  router.push("/leaderboard");
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold web-web-rounded-xl transition-colors cursor-pointer text-sm border-none"
                style={{ fontFamily: "'Quicksand'" }}
              >
                <Trophy size={16} />
                Leaderboard
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold web-web-rounded-xl transition-colors cursor-pointer text-sm border-none"
                style={{ fontFamily: "'Quicksand'" }}
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          ) : isInitialized ? (
            <button
              id="navbar-login-btn-mobile"
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLoginClick?.();
              }}
              className="w-full py-4 bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-bold text-lg rounded-full mt-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] cursor-pointer transition-colors"
            >
              Login
            </button>
          ) : null}
        </div>
      )}
    </nav>
  );
}
