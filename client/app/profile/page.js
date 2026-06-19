"use client";


import { useState, useEffect, useRef } from "react";
import { User, ChevronDown, LogOut, Gift, LayoutDashboard, Menu, Trophy, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileSkeleton from "../../src/components/shared/skeletons/ProfileSkeleton";
import { useAuth } from "../../src/context/AuthContext";
import ProfileSection from "../../src/components/pages/ProfileSection";

function ProfileHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, isInitialized, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        {/* Left: Logo */}
        <div
          className="flex items-center cursor-pointer group flex-1"
          onClick={() => router.push("/")}
        >
          <img
            src="/logo-elements.png"
            alt="EcoPoints"
            className="h-9 w-auto sm:hidden transition-all duration-300 ease-in-out group-hover:scale-110"
          />
          <img
            src="/ecopoints-logo-mark.png"
            alt="EcoPoints Logo"
            className="hidden sm:block h-10 md:h-12 w-auto transition-all duration-300 ease-in-out group-hover:scale-110"
          />
        </div>

        {/* Center: Profile Title */}
        <div className="flex items-center gap-2 select-none">
          <UserIcon
            size={25}
            className="text-[#10b981]"
            strokeWidth={2.5}
          />
          <span
            className="font-black text-base sm:text-lg text-[#064e3b] tracking-wide"
            style={{ fontFamily: "'Fredoka'", fontSize: '25px' }}
          >
            Profile
          </span>
        </div>

        {/* Right: Profile Button */}
        <div className="flex-1 flex justify-end relative" ref={dropdownRef}>
          {isInitialized && currentUser ? (
            <div className="flex items-center gap-3">
              {/* Mobile: hamburger */}
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
                      router.push("/leaderboard");
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    <Trophy size={14} className="text-slate-400" />
                    Leaderboards
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
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
          )}
        </div>
      </div>
    </nav>
  );
}

export default function ProfilePage() {
  const { currentUser, isInitialized } = useAuth();

  if (!isInitialized) {
    return <ProfileSkeleton />;
  }

  return (
    <>
      <ProfileHeader />
      <main className="pt-24 min-h-screen bg-slate-50">
        <ProfileSection />
      </main>
    </>
  );
}
