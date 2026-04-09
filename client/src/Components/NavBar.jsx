// Home Page
// Navigation Bar

"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = ["Home", "How It Works", "Features", "Leaderboard", "Rewards"];

export default function NavBar({ onLoginClick }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  // Scroll-responsive background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = navItems.map((item) => item.toLowerCase().replace(/\s+/g, "-"));
    const observers = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleNavigate = (id) => {
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
            src={scrolled ? "/EcoPoints Logo Mark with Name.png" : "/EcoPoints Logo Mark with Name (Light Version).png"}
            alt="EcoPoints Logo"
            className="h-10 md:h-12 w-auto transition-all duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* Desktop Nav Items */}
        <ul
          className={`hidden md:flex gap-8 font-bold text-sm px-6 py-2.5 rounded-full border shadow-sm transition-all duration-500 ${scrolled
            ? "bg-white/50 backdrop-blur-md border-white/60"
            : "bg-white/10 backdrop-blur-sm border-white/20"
            }`}
        >
          {navItems.map((item) => {
            const id = item.toLowerCase().replace(/\s+/g, "-");
            const isActive = activeSection === id;
            return (
              <li
                key={item}
                className={`relative group cursor-pointer transition-colors ${isActive
                  ? scrolled
                    ? "text-green-600"
                    : "text-lime-300"
                  : scrolled
                    ? "text-slate-500 hover:text-slate-900"
                    : "text-white/70 hover:text-white"
                  }`}
                onClick={() => handleNavigate(id)}
              >
                {item}
                <span
                  className={`absolute -bottom-1.5 left-0 w-full h-[2px] transition-all duration-300 origin-left ${scrolled ? "bg-green-600" : "bg-lime-300"
                    } ${isActive
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
            className={`px-6 py-2.5 font-bold text-sm rounded-xl cursor-pointer transition-all duration-300 ${scrolled
                ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-md hover:-translate-y-0.5"
                : "border border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
              }`}
          >
            Log In
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`md:hidden p-2 focus:outline-none transition-colors ${scrolled ? "text-slate-900" : "text-white"
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
            className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-xl mt-2 shadow-md hover:bg-green-600 transition-colors"
          >
            Log In
          </button>
        </div>
      )}
    </nav>
  );
}
