// Home Page
// Navigation Bar

"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const navItems = ["Home", "How It Works", "Features", "Leaderboard", "Rewards"];

export default function NavBar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

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

  // Scroll spy — lock active updates while smooth nav scroll is in-flight
  useEffect(() => {
    const ids = navItems.map((item) => item.toLowerCase().replace(/\s+/g, "-"));
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const pendingTarget = pendingNavigationRef.current;
        if (pendingTarget) {
          if (pendingTarget === "home") {
            if (window.scrollY <= 8) {
              pendingNavigationRef.current = null;
              if (pendingNavigationTimeoutRef.current) {
                clearTimeout(pendingNavigationTimeoutRef.current);
                pendingNavigationTimeoutRef.current = null;
              }
            }
            return;
          }

          const targetReached = entries.some(
            (entry) => entry.target.id === pendingTarget && entry.isIntersecting
          );

          if (targetReached) {
            setActiveSection(pendingTarget);
            pendingNavigationRef.current = null;
            if (pendingNavigationTimeoutRef.current) {
              clearTimeout(pendingNavigationTimeoutRef.current);
              pendingNavigationTimeoutRef.current = null;
            }
          }
          return;
        }

        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          setActiveSection(intersecting[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (id) => {
    setActiveSection(id);
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
      }
    }
    setIsMobileMenuOpen(false);
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
            src="/EcoPoints Logo Mark with Name.png"
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

        {/* Desktop Login Button */}
        <div className="hidden md:block">
          <button
            id="navbar-login-btn"
            type="button"
            onClick={onLoginClick}
            className="px-8 py-3 bg-gradient-to-r from-[#10b981] to-[#34d399] border-none rounded-full text-white font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)]"
            style={{ fontFamily: "'Quicksand'" }}
          >
            Login
          </button>
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
                className={`text-left text-lg font-bold p-3 rounded-xl transition-colors ${isActive
                  ? "bg-green-100 text-green-600"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {item}
              </button>
            );
          })}
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
        </div>
      )}
    </nav>
  );
}
