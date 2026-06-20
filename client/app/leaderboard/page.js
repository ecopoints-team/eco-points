"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Leaf, Trophy, ChevronDown, User, LogOut, Gift, LayoutDashboard, Menu } from "lucide-react";
import { useAuth } from "../../src/context/AuthContext";
import LeaderboardSkeleton from "../../src/components/shared/skeletons/LeaderboardSkeleton";
import Footer from "../../src/components/website/Footer";
import RequireAuth from "../../src/components/auth/RequireAuth";

const LeaderboardPodium = dynamic(
  () => import("../../src/components/pages/LeaderboardPodium"),
  { loading: () => <div className="py-10"><LeaderboardSkeleton /></div> }
);

function LeaderboardHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, isInitialized, logout } = useAuth();
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

  // Scroll-responsive background
  useEffect(() => {
    let prev = false;
    const onScroll = () => {
      const val = window.scrollY > 50;
      if (val !== prev) {
        prev = val;
        setScrolled(val);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "U";

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
      setIsDropdownOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
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
        {/* Left: Logo — icon-only on mobile, full mark on sm+ */}
        <div
          className="flex items-center cursor-pointer group flex-1"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {/* Mobile: icon only */}
          <img
            src="/logo-elements.png"
            alt="EcoPoints"
            className="h-9 w-auto sm:hidden transition-all duration-300 ease-in-out group-hover:scale-110"
          />
          {/* sm+: full logo mark */}
          <img
            src="/ecopoints-logo-mark.png"
            alt="EcoPoints Logo"
            className="hidden sm:block h-10 md:h-12 w-auto transition-all duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* Center: Leaderboards Title + Trophy */}
        <div className="flex items-center gap-2 select-none">
          <Trophy
            size={25}
            className="text-[#10b981]"
            strokeWidth={2.5}
          />
          <span
            className="font-black text-base sm:text-lg text-[#064e3b] tracking-wide"
            style={{ fontFamily: "'Fredoka'", fontSize: '25px' }}
          >
            Leaderboard
          </span>
        </div>

        {/* Right: Profile Button */}
        <div className="flex-1 flex justify-end relative" ref={dropdownRef}>
          {isInitialized && currentUser ? (
            <div className="flex items-center gap-3">
              {/* Mobile: hamburger icon only */}
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                type="button"
                className="sm:hidden flex items-center justify-center w-9 h-9 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 transition-all duration-300 cursor-pointer shadow-sm"
              >
                <Menu size={18} className="text-slate-600" />
              </button>

              {/* sm+: full profile button */}
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                type="button"
                className="hidden sm:flex items-center gap-2.5 px-3 sm:px-4 py-2 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-xs shadow-inner select-none">
                  {initials}
                </div>
                <div
                  className="text-left font-bold text-xs max-w-[120px] truncate text-slate-700"
                  style={{ fontFamily: "'Quicksand'" }}
                >
                  {currentUser.name}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-300 group-hover:text-slate-600 ${isDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-2 z-[1001] flex flex-col gap-1">
                  <div className="px-3 py-2 text-left">
                    <p
                      className="text-xs font-black text-slate-800"
                      style={{ fontFamily: "'Fredoka'" }}
                    >
                      {currentUser.name}
                    </p>
                    <p
                      className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mt-0.5"
                      style={{ fontFamily: "'Quicksand'" }}
                    >
                      {currentUser.role
                        ? currentUser.role.replace("_", " ")
                        : "User"}
                    </p>
                  </div>
                  <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/profile");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <User size={14} className="text-slate-400" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/rewards");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <Gift size={14} className="text-slate-400" />
                    Browse Rewards
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push("/");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <LayoutDashboard size={14} className="text-slate-400" />
                    Home
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-xs font-bold cursor-pointer border-none bg-transparent w-full"
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
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-gradient-to-r from-[#10b981] to-[#34d399] border-none rounded-full text-white font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] text-sm"
              style={{ fontFamily: "'Quicksand'" }}
            >
              Login
            </button>
          ) : (
            /* Skeleton placeholder while auth initializes */
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          )}
        </div>
      </div>
    </nav>
  );
}

export default function LeaderboardPage() {
  return (
    <RequireAuth>
      <div className="footerbg" style={{ backgroundColor: "rgba(5, 148, 103, 0.2)" }}>
        <LeaderboardHeader />
        <main className="pt-24 bg-slate-50 relative overflow-hidden">
          {/* Outer glow blobs */}
          <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-400/[0.06] blur-2xl" />
          {/* Top-right glow */}
          <div className="pointer-events-none absolute -top-20 right-[10%] w-[350px] h-[350px] rounded-full bg-emerald-300/[0.08] blur-3xl" />

          {/* ── Eco background design (from Leaderboard.jsx) ── */}

          {/* Tech-eco circuit pattern — top area */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 w-full h-[45%] opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="eco-circuit" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="3" fill="#059669" />
                <circle cx="60" cy="60" r="8" fill="none" stroke="#059669" strokeWidth="0.5" />
                <line x1="60" y1="60" x2="120" y2="60" stroke="#059669" strokeWidth="0.5" />
                <line x1="60" y1="60" x2="60" y2="120" stroke="#059669" strokeWidth="0.5" />
                <line x1="60" y1="60" x2="0" y2="0" stroke="#059669" strokeWidth="0.5" strokeDasharray="4 4" />
                <circle cx="0" cy="0" r="2" fill="#10b981" />
                <circle cx="120" cy="60" r="2" fill="#10b981" />
                <circle cx="60" cy="120" r="2" fill="#10b981" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#eco-circuit)" />
          </svg>

          {/* Eco wave design — top of page (flipped) */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 w-full h-[35%]"
            viewBox="0 0 1440 300"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: "scaleY(-1)" }}
          >
            <path d="M0,40 C240,120 480,0 720,60 C960,120 1200,20 1440,60 L1440,300 L0,300 Z" fill="rgba(16,185,129,0.05)" />
            <path d="M0,80 C200,20 440,120 720,75 C1000,30 1240,100 1440,65 L1440,300 L0,300 Z" fill="rgba(52,211,153,0.06)" />
          </svg>

          {/* Floating hex nodes — techy accent */}
          <svg aria-hidden="true" className="pointer-events-none absolute top-[6%] left-[20%] w-16 h-16 text-emerald-500/[0.08]" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </svg>
          <svg aria-hidden="true" className="pointer-events-none absolute top-[12%] right-[18%] w-12 h-12 text-emerald-400/[0.07]" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <svg aria-hidden="true" className="pointer-events-none absolute top-[22%] left-[42%] w-10 h-10 text-emerald-500/[0.06]" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* 1. Subtle dot-grid SVG pattern */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="eco-dots-page" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(16,185,129,0.10)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#eco-dots-page)" />
          </svg>

          {/* 2. Eco wave design — bottom of page */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 w-full h-[62%]"
            viewBox="0 0 1440 300"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0,40 C240,120 480,0 720,60 C960,120 1200,20 1440,60 L1440,300 L0,300 Z" fill="rgba(16,185,129,0.07)" />
            <path d="M0,70 C200,20 440,120 720,75 C1000,30 1240,100 1440,65 L1440,300 L0,300 Z" fill="rgba(52,211,153,0.09)" />
            <path d="M0,100 C180,55 400,140 720,100 C1040,60 1280,120 1440,90 L1440,300 L0,300 Z" fill="rgba(5,150,105,0.11)" />
          </svg>

          {/* 3. Scattered leaf silhouettes */}
          <Leaf size={180} className="pointer-events-none absolute -top-8 -right-12 text-emerald-500/[0.06] rotate-[15deg]" fill="currentColor" />
          <Leaf size={70} className="pointer-events-none absolute top-1/3 left-[8%] text-emerald-500/[0.05] rotate-[60deg]" fill="currentColor" />
          <Leaf size={55} className="pointer-events-none absolute bottom-1/4 right-[12%] text-emerald-500/[0.05] -rotate-[20deg]" fill="currentColor" />
          <Leaf size={42} className="pointer-events-none absolute top-[12%] left-[40%] text-emerald-400/[0.04] rotate-[80deg]" fill="currentColor" />
          {/* Additional leaves — top-heavy distribution */}
          <Leaf size={120} className="pointer-events-none absolute top-[5%] left-[15%] text-emerald-500/[0.05] -rotate-[35deg]" fill="currentColor" />
          <Leaf size={95} className="pointer-events-none absolute top-[2%] right-[25%] text-emerald-400/[0.06] rotate-[45deg]" fill="currentColor" />
          <Leaf size={50} className="pointer-events-none absolute top-[18%] left-[55%] text-emerald-500/[0.04] rotate-[120deg]" fill="currentColor" />
          <Leaf size={65} className="pointer-events-none absolute top-[8%] left-[75%] text-emerald-600/[0.05] -rotate-[60deg]" fill="currentColor" />
          <Leaf size={38} className="pointer-events-none absolute top-[30%] right-[5%] text-emerald-400/[0.04] rotate-[150deg]" fill="currentColor" />
          <Leaf size={85} className="pointer-events-none absolute bottom-[10%] left-[25%] text-emerald-500/[0.04] rotate-[30deg]" fill="currentColor" />

          {/* 4. Animated pulse rings */}
          <div className="pointer-events-none absolute top-[20%] right-[15%]">
            <div className="w-24 h-24 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: "3s" }} />
          </div>
          <div className="pointer-events-none absolute bottom-[25%] left-[10%]">
            <div className="w-16 h-16 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
          </div>
          {/* Top-area pulse ring */}
          <div className="pointer-events-none absolute top-[8%] left-[30%]">
            <div className="w-20 h-20 rounded-full border border-emerald-400/10 animate-ping" style={{ animationDuration: "5s", animationDelay: "2s" }} />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
            <LeaderboardPodium />
          </div>
        </main>
        <Footer
          extraResources={[
            { name: "System Introduction", link: "/" },
          ]}
        />
      </div>
    </RequireAuth>
  );
}
