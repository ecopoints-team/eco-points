// Leaderboard Page
// LeaderboardPodium Component

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Crown,
  Medal,
  Award,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Zap,
  Recycle,
  Wallet,
  ChevronDown,
  Check,
} from "lucide-react";

// ─────────────────────────────────────────────
// Font styles
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// Mock leaderboard data
// ─────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Maria Santos", points: 2850, bottles: 285, school: "College of Engineering" },
  { rank: 2, name: "Juan dela Cruz", points: 2680, bottles: 312, school: "College of Science" },
  { rank: 3, name: "Ana Reyes", points: 2450, bottles: 245, school: "College of Arts" },
  { rank: 4, name: "Carlos Mendoza", points: 2310, bottles: 231, school: "College of Engineering" },
  { rank: 5, name: "Lea Villanueva", points: 2190, bottles: 270, school: "College of Business" },
  { rank: 6, name: "Rico Bautista", points: 2080, bottles: 208, school: "College of Science" },
  { rank: 7, name: "Grace Castillo", points: 1970, bottles: 197, school: "College of Education" },
  { rank: 8, name: "Miguel Torres", points: 1860, bottles: 186, school: "College of Engineering" },
  { rank: 9, name: "Donna Aquino", points: 1750, bottles: 175, school: "College of Arts" },
  { rank: 10, name: "Francis Lim", points: 1640, bottles: 164, school: "College of Science" },
  { rank: 11, name: "Jenny Ramos", points: 1530, bottles: 153, school: "College of Business" },
  { rank: 12, name: "Andrei Cruz", points: 1420, bottles: 142, school: "College of Engineering" },
  { rank: 13, name: "Sophia Navarro", points: 1310, bottles: 131, school: "College of Arts" },
  { rank: 14, name: "Paolo Fernandez", points: 1200, bottles: 120, school: "College of Science" },
  { rank: 15, name: "Kristine Garcia", points: 1095, bottles: 110, school: "College of Education" },
  { rank: 16, name: "Renz Padilla", points: 980, bottles: 98, school: "College of Engineering" },
  { rank: 17, name: "Marites Ocampo", points: 860, bottles: 86, school: "College of Business" },
  { rank: 18, name: "Juliet Soriano", points: 750, bottles: 75, school: "College of Arts" },
  { rank: 19, name: "Elmer Diaz", points: 640, bottles: 64, school: "College of Science" },
  { rank: 20, name: "Carla Espinoza", points: 530, bottles: 53, school: "College of Education" },
  { rank: 21, name: "Nathan Rivera", points: 490, bottles: 49, school: "College of Engineering" },
  { rank: 22, name: "Liezel Santos", points: 450, bottles: 45, school: "College of Business" },
  { rank: 23, name: "Gilberto Flores", points: 410, bottles: 41, school: "College of Science" },
  { rank: 24, name: "Rhea Gonzales", points: 370, bottles: 37, school: "College of Arts" },
  { rank: 25, name: "Edward Dela Rosa", points: 340, bottles: 34, school: "College of Education" },
  { rank: 26, name: "Trisha Mercado", points: 310, bottles: 31, school: "College of Engineering" },
  { rank: 27, name: "Joseph Aguilar", points: 275, bottles: 28, school: "College of Science" },
  { rank: 28, name: "Maricel Reyes", points: 240, bottles: 24, school: "College of Business" },
  { rank: 29, name: "Daniel Manalo", points: 210, bottles: 21, school: "College of Arts" },
  { rank: 30, name: "Sunshine Pascual", points: 185, bottles: 19, school: "College of Education" },
];

// ─────────────────────────────────────────────
// Mock current user stats
// ─────────────────────────────────────────────
const MOCK_USER_STATS = {
  accumulatedPoints: 1250,
  currentPoints: 820,
  bottlesRecycled: 147,
};

// ─────────────────────────────────────────────
// Time-period multipliers (mock)
// ─────────────────────────────────────────────
const TIME_MULTIPLIERS = { all: 1, monthly: 0.45, weekly: 0.15 };

// ─────────────────────────────────────────────
// Custom Select 
// ─────────────────────────────────────────────
function CustomSelect({ value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-stone-50 border border-emerald-100 rounded-full px-5 py-2 text-[11px] font-bold text-emerald-800 shadow-sm hover:border-emerald-300 transition-all min-w-[120px]"
        style={fonts.body}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-emerald-100 rounded-2xl shadow-xl z-20 overflow-hidden min-w-[150px]">
          <div className="p-1.5 space-y-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-2.5 text-[11px] font-bold rounded-xl transition-colors ${value === opt.value ? "bg-emerald-50 text-emerald-600" : "text-stone-600 hover:bg-stone-50"}`}
                style={fonts.body}
              >
                {opt.label}
                {value === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Podium slot configs
// ─────────────────────────────────────────────
const PODIUM_CONFIG = {
  1: {
    color: "from-amber-400 to-yellow-500",
    ring: "ring-amber-400/80",
    shadow: "shadow-amber-500/60",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.7)]",
    platformBg: "bg-gradient-to-b from-amber-300/70 to-amber-400/30 border-2 border-amber-300/70",
    watermarkColor: "text-amber-500/20",
    icon: <Crown size={34} className="text-white drop-shadow-lg" />,
  },
  2: {
    color: "from-slate-300 to-slate-400",
    ring: "ring-slate-400/70",
    shadow: "shadow-slate-400/40",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.5)]",
    platformBg: "bg-gradient-to-b from-slate-300/60 to-slate-200/30 border-2 border-slate-300/60",
    watermarkColor: "text-slate-400/20",
    icon: <Medal size={30} className="text-white drop-shadow" />,
  },
  3: {
    color: "from-amber-600 to-orange-500",
    ring: "ring-amber-600/60",
    shadow: "shadow-amber-700/40",
    glow: "shadow-[0_0_20px_rgba(217,119,6,0.4)]",
    platformBg: "bg-gradient-to-b from-orange-300/60 to-amber-200/30 border-2 border-orange-300/60",
    watermarkColor: "text-orange-500/20",
    icon: <Award size={30} className="text-white drop-shadow" />,
  },
};

// ─────────────────────────────────────────────
// Scroll-in hook
// ─────────────────────────────────────────────
function useInView(threshold = 0.08) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// ─────────────────────────────────────────────
// Initials Avatar
// ─────────────────────────────────────────────
function Initials({ name, className }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <span className={className} style={fonts.data}>
      {initials}
    </span>
  );
}

// ─────────────────────────────────────────────
// Podium
// ─────────────────────────────────────────────
function Podium({ users, inView }) {
  const order = [users[1], users[0], users[2]]; // 2nd | 1st | 3rd

  return (
    <div className="flex items-end justify-center gap-4 md:gap-8">
      {order.map((user, i) => {
        if (!user) return null;
        const cfg = PODIUM_CONFIG[user.rank];
        const isFirst = user.rank === 1;
        const delay = i === 1 ? 0 : i === 0 ? 160 : 300;

        const avatarSize = isFirst ? "w-28 h-28 text-3xl" : user.rank === 2 ? "w-20 h-20 text-xl" : "w-18 h-18 text-lg";
        const platformH = isFirst ? "h-40" : user.rank === 2 ? "h-28" : "h-20";
        const platformW = isFirst ? "w-32 md:w-36" : "w-24 md:w-28";

        return (
          <div
            key={user.rank}
            className="flex flex-col items-center group cursor-default"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(50px)",
              transition: `opacity 0.7s ease ${delay}ms, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
            }}
          >
            {isFirst && (
              <Crown
                size={44}
                className="mb-2 text-amber-400 drop-shadow-lg"
                style={{ animation: "podium-bounce 3s infinite ease-in-out" }}
                fill="#fbbf24"
                strokeWidth={1.5}
              />
            )}

            <div className="relative mb-3">
              {isFirst && (
                <>
                  <span className="absolute inset-[-8px] rounded-full border-2 border-amber-400/40 animate-ping" />
                  <span className="absolute inset-[-4px] rounded-full border border-amber-400/30" />
                </>
              )}
              <div
                className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${cfg.color} ring-3 ${cfg.ring} shadow-2xl ${cfg.shadow} ${cfg.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${avatarSize}`}
              >
                <Initials
                  name={user.name}
                  className={`font-black text-white select-none ${isFirst ? "text-3xl" : "text-xl"}`}
                />
              </div>
            </div>

            <p
              className={`text-center font-black leading-tight drop-shadow-sm ${isFirst ? "text-base max-w-[110px]" : "text-sm max-w-[90px]"}`}
              style={{ ...fonts.heading, color: "#064E3B" }}
            >
              {user.name}
            </p>

            <div
              className={`mt-1.5 mb-4 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-600 font-black text-white tabular-nums shadow-lg backdrop-blur-sm ${isFirst ? "text-sm" : "text-xs"}`}
              style={fonts.data}
            >
              {user.points.toLocaleString()} pts
            </div>

            <div
              className={`${platformW} ${platformH} rounded-t-3xl relative flex items-start justify-center pt-4 overflow-hidden transition-all duration-300 group-hover:brightness-105 ${cfg.platformBg} shadow-xl`}
            >
              <span
                className={`absolute inset-0 flex items-center justify-center font-black select-none ${cfg.watermarkColor}`}
                style={{ fontSize: "5rem" }}
              >
                {user.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Ranked List Row
// ─────────────────────────────────────────────
function RankRow({ user, index, inView, sortBy = "points" }) {
  const isTopTen = user.rank <= 10;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-colors duration-200 cursor-default border border-transparent hover:border-emerald-100"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(8px)",
        transition: `opacity 0.4s ease ${index * 35}ms, transform 0.4s ease ${index * 35}ms`,
      }}
    >
      <div
        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full font-black text-xs ${isTopTen ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60" : "bg-stone-100 text-stone-500"}`}
        style={fonts.data}
      >
        {user.rank}
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 ${isTopTen ? "bg-emerald-600" : "bg-stone-400"}`}
          style={fonts.data}
        >
          {user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-emerald-900 truncate" style={fonts.heading}>
            {user.name}
          </p>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest truncate" style={fonts.body}>
            {user.school}
          </p>
        </div>
      </div>

      <div
        className={`flex-shrink-0 px-3 py-1 rounded-full font-black text-sm tabular-nums ${isTopTen ? "bg-emerald-500 text-white shadow-md shadow-emerald-300/50" : "bg-stone-200 text-stone-700"}`}
        style={fonts.data}
      >
        {sortBy === "bottles" ? user.bottles.toLocaleString() : user.points.toLocaleString()}
        <span className="text-[10px] font-bold ml-1 opacity-70">{sortBy === "bottles" ? "btl" : "pts"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardPodium() {
  const [podiumRef, podiumInView] = useInView(0.05);
  const [listRef, listInView] = useInView(0.05);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("points");
  const [timePeriod, setTimePeriod] = useState("all");
  const ITEMS_PER_PAGE = 17;

  const rankedData = useMemo(() => {
    const mult = TIME_MULTIPLIERS[timePeriod];
    const adjusted = MOCK_LEADERBOARD.map((u) => ({
      ...u,
      points: Math.round(u.points * mult),
      bottles: Math.round(u.bottles * mult),
    }));
    const sortField = sortBy === "bottles" ? "bottles" : "points";
    adjusted.sort((a, b) => b[sortField] - a[sortField]);
    return adjusted.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [sortBy, timePeriod]);

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.toLowerCase();
    return rankedData.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.school.toLowerCase().includes(q) ||
      String(u.rank).includes(q) ||
      String(u.points).includes(q) ||
      String(u.bottles).includes(q)
    );
  }, [searchQuery, rankedData, isSearching]);

  const listUsers = isSearching ? searchResults : rankedData.filter((u) => u.rank >= 4);

  const totalPages = Math.ceil(listUsers.length / ITEMS_PER_PAGE);
  const displayedUsers = listUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, timePeriod]);

  return (
    <div className="relative">

      {/* ── Summary Cards ── */}
      <div className="sticky top-[64px] md:top-[76px] z-[60] flex justify-center w-full px-2 pointer-events-none mb-16 pt-2">
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl w-full pointer-events-auto">

          {/* Accumulated Points */}
          <div className="group bg-white/95 backdrop-blur-md border border-stone-200 rounded-3xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-200 relative overflow-hidden min-w-[220px] flex-shrink-0 cursor-default">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/40 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform duration-500 group-hover:scale-150" />
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-emerald-100 transition-colors duration-300 group-hover:bg-emerald-200">
                <Zap size={16} className="text-emerald-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ ...fonts.body, color: "#10B981" }}>
                Accumulated Points
              </p>
            </div>
            <p className="text-3xl font-black mt-1" style={{ ...fonts.data, color: "#064E3B" }}>
              {MOCK_USER_STATS.accumulatedPoints.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold mt-1 text-stone-500 transition-colors duration-300 group-hover:text-emerald-700" style={fonts.body}>
              Total points earned
            </p>
          </div>

          {/* Current Points */}
          <div className="group bg-white/95 backdrop-blur-md border border-stone-200 rounded-3xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-900/10 hover:border-amber-200 relative overflow-hidden min-w-[220px] flex-shrink-0 cursor-default">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/40 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform duration-500 group-hover:scale-150" />
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-100 transition-colors duration-300 group-hover:bg-amber-200">
                <Wallet size={16} className="text-amber-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ ...fonts.body, color: "#D97706" }}>
                Current Points
              </p>
            </div>
            <p className="text-3xl font-black mt-1" style={{ ...fonts.data, color: "#064E3B" }}>
              {MOCK_USER_STATS.currentPoints.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold mt-1 text-stone-500 transition-colors duration-300 group-hover:text-amber-700" style={fonts.body}>
              Available to redeem
            </p>
          </div>

          {/* Bottles Recycled */}
          <div className="group bg-white/95 backdrop-blur-md border border-stone-200 rounded-3xl p-5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-900/10 hover:border-sky-200 relative overflow-hidden min-w-[220px] flex-shrink-0 cursor-default">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-100/40 rounded-full -mr-8 -mt-8 pointer-events-none transition-transform duration-500 group-hover:scale-150" />
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-sky-100 transition-colors duration-300 group-hover:bg-sky-200">
                <Recycle size={16} className="text-sky-600 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ ...fonts.body, color: "#0284C7" }}>
                Bottles Recycled
              </p>
            </div>
            <p className="text-3xl font-black mt-1" style={{ ...fonts.data, color: "#064E3B" }}>
              {MOCK_USER_STATS.bottlesRecycled.toLocaleString()}
            </p>
            <p className="text-[10px] font-bold mt-1 text-stone-500 transition-colors duration-300 group-hover:text-sky-700" style={fonts.body}>
              Total bottles recycled
            </p>
          </div>

        </div>
      </div>

      {/* ── Podium ── */}
      <div ref={podiumRef} className="pt-6 pb-6">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Trophy size={20} className="text-amber-500" />
          <span
            className="text-sm font-bold uppercase tracking-[0.18em]"
            style={{ ...fonts.heading, color: "#065F46" }}
          >
            Top Recyclers
          </span>
          <Trophy size={20} className="text-amber-500" />
        </div>
        <Podium users={rankedData} inView={podiumInView} />
      </div>

      {/* ── Ranked List Card ── */}
      <div
        ref={listRef}
        className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-3xl shadow-xl shadow-black/5 overflow-hidden mt-8 mb-16"
      >
        <div className="px-6 py-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-emerald-600" />
            <h2 className="text-base font-black text-emerald-900 uppercase tracking-widest" style={fonts.heading}>
              Rankings
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Search Input Filter */}
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-1.5 min-w-[160px] shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
              <Search size={14} className="text-emerald-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] font-medium placeholder-slate-400"
                style={{ ...fonts.body, color: "#064E3B" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-emerald-500 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "points", label: "By Points" },
                { value: "bottles", label: "By Bottles" },
              ]}
            />
            <CustomSelect
              value={timePeriod}
              onChange={setTimePeriod}
              options={[
                { value: "all", label: "All Time" },
                { value: "monthly", label: "Monthly" },
                { value: "weekly", label: "Weekly" },
              ]}
            />
          </div>
        </div>

        <div className="px-2 py-2 space-y-0.5">
          {displayedUsers.length > 0 ? (
            displayedUsers.map((user, index) => (
              <RankRow
                key={`${user.name}-${user.rank}`}
                user={user}
                index={index}
                inView={listInView}
                sortBy={sortBy}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={28} className="text-stone-300 mb-3" />
              <p className="text-stone-400 font-bold text-sm" style={fonts.body}>
                No results for &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-stone-100">
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-center">
              <div className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-full border border-stone-100 shadow-inner">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-full text-emerald-600 disabled:text-stone-300 transition-all hover:bg-stone-200 active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${currentPage === i + 1
                        ? "bg-emerald-600 text-white shadow-md scale-110"
                        : "bg-transparent text-emerald-800 hover:bg-stone-200"
                        }`}
                      style={fonts.data}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-full text-emerald-600 disabled:text-stone-300 transition-all hover:bg-stone-200 active:scale-95"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes podium-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}