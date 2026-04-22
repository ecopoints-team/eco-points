// Leaderboard Page
// LeaderboardPodium Component

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Crown,
  Medal,
  Award,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─────────────────────────────────────────────
// Font styles (same as Leaderboard.jsx)
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka', sans-serif" },
  body: { fontFamily: "'Quicksand', sans-serif" },
  data: { fontFamily: "'Space Mono', monospace" },
};

// ─────────────────────────────────────────────
// Mock leaderboard data
// ─────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1,  name: "Maria Santos",     points: 2850, school: "College of Engineering" },
  { rank: 2,  name: "Juan dela Cruz",   points: 2680, school: "College of Science" },
  { rank: 3,  name: "Ana Reyes",        points: 2450, school: "College of Arts" },
  { rank: 4,  name: "Carlos Mendoza",   points: 2310, school: "College of Engineering" },
  { rank: 5,  name: "Lea Villanueva",   points: 2190, school: "College of Business" },
  { rank: 6,  name: "Rico Bautista",    points: 2080, school: "College of Science" },
  { rank: 7,  name: "Grace Castillo",   points: 1970, school: "College of Education" },
  { rank: 8,  name: "Miguel Torres",    points: 1860, school: "College of Engineering" },
  { rank: 9,  name: "Donna Aquino",     points: 1750, school: "College of Arts" },
  { rank: 10, name: "Francis Lim",      points: 1640, school: "College of Science" },
  { rank: 11, name: "Jenny Ramos",      points: 1530, school: "College of Business" },
  { rank: 12, name: "Andrei Cruz",      points: 1420, school: "College of Engineering" },
  { rank: 13, name: "Sophia Navarro",   points: 1310, school: "College of Arts" },
  { rank: 14, name: "Paolo Fernandez",  points: 1200, school: "College of Science" },
  { rank: 15, name: "Kristine Garcia",  points: 1095, school: "College of Education" },
  { rank: 16, name: "Renz Padilla",     points: 980,  school: "College of Engineering" },
  { rank: 17, name: "Marites Ocampo",   points: 860,  school: "College of Business" },
  { rank: 18, name: "Juliet Soriano",   points: 750,  school: "College of Arts" },
  { rank: 19, name: "Elmer Diaz",       points: 640,  school: "College of Science" },
  { rank: 20, name: "Carla Espinoza",   points: 530,  school: "College of Education" },
  { rank: 21, name: "Nathan Rivera",    points: 490,  school: "College of Engineering" },
  { rank: 22, name: "Liezel Santos",    points: 450,  school: "College of Business" },
  { rank: 23, name: "Gilberto Flores",  points: 410,  school: "College of Science" },
  { rank: 24, name: "Rhea Gonzales",    points: 370,  school: "College of Arts" },
  { rank: 25, name: "Edward Dela Rosa", points: 340,  school: "College of Education" },
  { rank: 26, name: "Trisha Mercado",   points: 310,  school: "College of Engineering" },
  { rank: 27, name: "Joseph Aguilar",   points: 275,  school: "College of Science" },
  { rank: 28, name: "Maricel Reyes",    points: 240,  school: "College of Business" },
  { rank: 29, name: "Daniel Manalo",    points: 210,  school: "College of Arts" },
  { rank: 30, name: "Sunshine Pascual", points: 185,  school: "College of Education" },
];

// ─────────────────────────────────────────────
// Podium slot configs
// ─────────────────────────────────────────────
const PODIUM_CONFIG = {
  1: {
    color: "from-amber-400 to-yellow-500",
    ring: "ring-amber-400/80",
    shadow: "shadow-amber-500/60",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.7)]",
    platformBg:
      "bg-gradient-to-b from-amber-300/70 to-amber-400/30 border-2 border-amber-300/70",
    watermarkColor: "text-amber-500/20",
    icon: <Crown size={34} className="text-white drop-shadow-lg" />,
  },
  2: {
    color: "from-slate-300 to-slate-400",
    ring: "ring-slate-400/70",
    shadow: "shadow-slate-400/40",
    glow: "shadow-[0_0_20px_rgba(148,163,184,0.5)]",
    platformBg:
      "bg-gradient-to-b from-slate-300/60 to-slate-200/30 border-2 border-slate-300/60",
    watermarkColor: "text-slate-400/20",
    icon: <Medal size={30} className="text-white drop-shadow" />,
  },
  3: {
    color: "from-amber-600 to-orange-500",
    ring: "ring-amber-600/60",
    shadow: "shadow-amber-700/40",
    glow: "shadow-[0_0_20px_rgba(217,119,6,0.4)]",
    platformBg:
      "bg-gradient-to-b from-orange-300/60 to-amber-200/30 border-2 border-orange-300/60",
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
// Podium — floats on the page, no card wrapper
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

        // Slot sizing by rank
        const avatarSize = isFirst
          ? "w-28 h-28 text-3xl"
          : user.rank === 2
          ? "w-20 h-20 text-xl"
          : "w-18 h-18 text-lg";

        const platformH = isFirst
          ? "h-40"
          : user.rank === 2
          ? "h-28"
          : "h-20";

        const platformW = isFirst
          ? "w-32 md:w-36"
          : "w-24 md:w-28";

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
            {/* Crown for 1st */}
            {isFirst && (
              <Crown
                size={44}
                className="mb-2 text-amber-400 drop-shadow-lg"
                style={{ animation: "podium-bounce 3s infinite ease-in-out" }}
                fill="#fbbf24"
                strokeWidth={1.5}
              />
            )}

            {/* Avatar circle */}
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

            {/* Name */}
            <p
              className={`text-center font-black leading-tight drop-shadow-sm ${
                isFirst ? "text-base max-w-[110px]" : "text-sm max-w-[90px]"
              }`}
              style={{ ...fonts.heading, color: "#064E3B" }}
            >
              {user.name}
            </p>

            {/* Points badge */}
            <div
              className={`mt-1.5 mb-4 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-600 font-black text-white tabular-nums shadow-lg backdrop-blur-sm ${
                isFirst ? "text-sm" : "text-xs"
              }`}
              style={fonts.data}
            >
              {user.points.toLocaleString()} pts
            </div>

            {/* Platform block */}
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
function RankRow({ user, index, inView }) {
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
      {/* Rank badge */}
      <div
        className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full font-black text-xs ${
          isTopTen
            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60"
            : "bg-stone-100 text-stone-500"
        }`}
        style={fonts.data}
      >
        {user.rank}
      </div>

      {/* Initials + name + school */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white flex-shrink-0 ${
            isTopTen ? "bg-emerald-600" : "bg-stone-400"
          }`}
          style={fonts.data}
        >
          {user.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="min-w-0">
          <p
            className="font-bold text-sm text-emerald-900 truncate"
            style={fonts.heading}
          >
            {user.name}
          </p>
          <p
            className="text-[10px] text-stone-400 font-bold uppercase tracking-widest truncate"
            style={fonts.body}
          >
            {user.school}
          </p>
        </div>
      </div>

      {/* Points — high contrast, pops immediately */}
      <div
        className={`flex-shrink-0 px-3 py-1 rounded-full font-black text-sm tabular-nums ${
          isTopTen
            ? "bg-emerald-500 text-white shadow-md shadow-emerald-300/50"
            : "bg-stone-200 text-stone-700"
        }`}
        style={fonts.data}
      >
        {user.points.toLocaleString()}
        <span className="text-[10px] font-bold ml-1 opacity-70">pts</span>
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
  const ITEMS_PER_PAGE = 17;

  const listUsers = MOCK_LEADERBOARD.filter((u) => u.rank >= 4);
  const totalPages = Math.ceil(listUsers.length / ITEMS_PER_PAGE);
  const displayedUsers = listUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-12">
      {/* ── Podium — floats directly on page background, no card ── */}
      <div
        ref={podiumRef}
        className="pt-6 pb-2"
      >
        {/* Section label */}
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

        <Podium users={MOCK_LEADERBOARD} inView={podiumInView} />
      </div>

      {/* ── Ranked List Card ── */}
      <div
        ref={listRef}
        className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-3xl shadow-xl shadow-black/5 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-emerald-600" />
            <h2
              className="text-base font-black text-emerald-900 uppercase tracking-widest"
              style={fonts.heading}
            >
              Rankings
            </h2>
          </div>
          <span
            className="text-xs font-bold text-stone-400 uppercase tracking-widest"
            style={fonts.body}
          >
            {MOCK_LEADERBOARD.length} Recyclers
          </span>
        </div>

        {/* Column headers */}
        <div className="px-4 py-2 grid grid-cols-[36px_1fr_auto] gap-4 border-b border-stone-100">
          <span
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-center"
            style={fonts.body}
          >
            #
          </span>
          <span
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest"
            style={fonts.body}
          >
            Recycler
          </span>
          <span
            className="text-[10px] font-black text-stone-400 uppercase tracking-widest"
            style={fonts.body}
          >
            EcoPoints
          </span>
        </div>

        {/* Rows */}
        <div className="px-2 py-2 space-y-0.5">
          {displayedUsers.map((user, index) => (
            <RankRow
              key={user.rank}
              user={user}
              index={index}
              inView={listInView}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="px-6 py-5 border-t border-stone-100 flex items-center justify-center">
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${
                    currentPage === i + 1
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
