// Leaderboard Page
// LeaderboardPodium Component — Redesigned

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Crown,
  Medal,
  ChevronLeft,
  ChevronRight,
  Gift,
  Zap,
  Recycle,
  ChevronDown,
  Eye,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

// ─────────────────────────────────────────────
// Font styles
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// Mock data — base entries + extended
// ─────────────────────────────────────────────
const BASE_ENTRIES = [
  { name: "Maria Santos", org: "College of Engineering", basePoints: 2850, bottles: 285 },
  { name: "Juan dela Cruz", org: "College of Science", basePoints: 2680, bottles: 312 },
  { name: "Ana Reyes", org: "College of Arts", basePoints: 2450, bottles: 245 },
  { name: "Carlos Mendoza", org: "College of Engineering", basePoints: 2310, bottles: 231 },
  { name: "Lea Villanueva", org: "College of Business", basePoints: 2190, bottles: 270 },
  { name: "Rico Bautista", org: "College of Science", basePoints: 2080, bottles: 208 },
  { name: "Grace Castillo", org: "College of Education", basePoints: 1970, bottles: 197 },
  { name: "Miguel Torres", org: "College of Engineering", basePoints: 1860, bottles: 186 },
  { name: "Donna Aquino", org: "College of Arts", basePoints: 1750, bottles: 175 },
  { name: "Francis Lim", org: "College of Science", basePoints: 1640, bottles: 164 },
  { name: "Jenny Ramos", org: "College of Business", basePoints: 1530, bottles: 153 },
  { name: "Andrei Cruz", org: "College of Engineering", basePoints: 1420, bottles: 142 },
  { name: "Sophia Navarro", org: "College of Arts", basePoints: 1310, bottles: 131 },
  { name: "Paolo Fernandez", org: "College of Science", basePoints: 1200, bottles: 120 },
  { name: "Kristine Garcia", org: "College of Education", basePoints: 1095, bottles: 110 },
  { name: "Renz Padilla", org: "College of Engineering", basePoints: 980, bottles: 98 },
  { name: "Marites Ocampo", org: "College of Business", basePoints: 860, bottles: 86 },
  { name: "Juliet Soriano", org: "College of Arts", basePoints: 750, bottles: 75 },
  { name: "Elmer Diaz", org: "College of Science", basePoints: 640, bottles: 64 },
  { name: "Carla Espinoza", org: "College of Education", basePoints: 530, bottles: 53 },
  { name: "Nathan Rivera", org: "College of Engineering", basePoints: 490, bottles: 49 },
  { name: "Liezel Santos", org: "College of Business", basePoints: 450, bottles: 45 },
  { name: "Gilberto Flores", org: "College of Science", basePoints: 410, bottles: 41 },
  { name: "Rhea Gonzales", org: "College of Arts", basePoints: 370, bottles: 37 },
  { name: "Edward Dela Rosa", org: "College of Education", basePoints: 340, bottles: 34 },
  { name: "Trisha Mercado", org: "College of Engineering", basePoints: 310, bottles: 31 },
  { name: "Joseph Aguilar", org: "College of Science", basePoints: 275, bottles: 28 },
  { name: "Maricel Reyes", org: "College of Business", basePoints: 240, bottles: 24 },
  { name: "Daniel Manalo", org: "College of Arts", basePoints: 210, bottles: 21 },
  { name: "Sunshine Pascual", org: "College of Education", basePoints: 185, bottles: 19 },
  // Extended entries
  { name: "Rafael Gomez", org: "College of Engineering", basePoints: 175, bottles: 18 },
  { name: "Bianca Salazar", org: "College of Science", basePoints: 168, bottles: 17 },
  { name: "Marco Villanueva", org: "College of Arts", basePoints: 162, bottles: 16 },
  { name: "Christine Lim", org: "College of Business", basePoints: 155, bottles: 16 },
  { name: "Jerome Santos", org: "College of Education", basePoints: 150, bottles: 15 },
  { name: "Patricia Cruz", org: "College of Engineering", basePoints: 145, bottles: 15 },
  { name: "Kevin Reyes", org: "College of Science", basePoints: 140, bottles: 14 },
  { name: "Angela Mendoza", org: "College of Arts", basePoints: 135, bottles: 14 },
  { name: "Ryan Bautista", org: "College of Business", basePoints: 130, bottles: 13 },
  { name: "Michelle Torres", org: "College of Education", basePoints: 128, bottles: 13 },
  { name: "Derek Aquino", org: "College of Engineering", basePoints: 125, bottles: 13 },
  { name: "Samantha Ramos", org: "College of Science", basePoints: 122, bottles: 12 },
  { name: "Adrian Fernandez", org: "College of Arts", basePoints: 120, bottles: 12 },
  { name: "Nicole Garcia", org: "College of Business", basePoints: 118, bottles: 12 },
  { name: "Brandon Padilla", org: "College of Education", basePoints: 115, bottles: 12 },
  { name: "Jasmine Ocampo", org: "College of Engineering", basePoints: 112, bottles: 11 },
  { name: "Vincent Soriano", org: "College of Science", basePoints: 110, bottles: 11 },
  { name: "Camille Diaz", org: "College of Arts", basePoints: 108, bottles: 11 },
  { name: "Patrick Espinoza", org: "College of Business", basePoints: 106, bottles: 11 },
  { name: "Denise Flores", org: "College of Education", basePoints: 104, bottles: 10 },
  { name: "Raymond Gonzales", org: "College of Engineering", basePoints: 102, bottles: 10 },
  { name: "Katrina Dela Rosa", org: "College of Science", basePoints: 100, bottles: 10 },
  { name: "Christian Mercado", org: "College of Arts", basePoints: 98, bottles: 10 },
  { name: "April Aguilar", org: "College of Business", basePoints: 96, bottles: 10 },
  { name: "Jason Manalo", org: "College of Education", basePoints: 94, bottles: 9 },
  { name: "Stephanie Pascual", org: "College of Engineering", basePoints: 92, bottles: 9 },
  { name: "Mark Navarro", org: "College of Science", basePoints: 90, bottles: 9 },
  { name: "Diana Castillo", org: "College of Arts", basePoints: 88, bottles: 9 },
  { name: "Robert Villanueva", org: "College of Business", basePoints: 86, bottles: 9 },
  { name: "Hannah Cruz", org: "College of Education", basePoints: 84, bottles: 8 },
  { name: "Gabriel Reyes", org: "College of Engineering", basePoints: 82, bottles: 8 },
  { name: "Isabelle Santos", org: "College of Science", basePoints: 80, bottles: 8 },
  { name: "Timothy Mendoza", org: "College of Arts", basePoints: 78, bottles: 8 },
  { name: "Victoria Bautista", org: "College of Business", basePoints: 76, bottles: 8 },
  { name: "Dennis Torres", org: "College of Education", basePoints: 74, bottles: 7 },
  { name: "Rebecca Aquino", org: "College of Engineering", basePoints: 72, bottles: 7 },
  { name: "Philip Ramos", org: "College of Science", basePoints: 70, bottles: 7 },
  { name: "Melissa Fernandez", org: "College of Arts", basePoints: 68, bottles: 7 },
  { name: "Oscar Garcia", org: "College of Business", basePoints: 66, bottles: 7 },
  { name: "Teresa Padilla", org: "College of Education", basePoints: 64, bottles: 6 },
  { name: "Martin Ocampo", org: "College of Engineering", basePoints: 62, bottles: 6 },
  { name: "Catherine Soriano", org: "College of Science", basePoints: 60, bottles: 6 },
  { name: "Andrew Diaz", org: "College of Arts", basePoints: 58, bottles: 6 },
  { name: "Monica Espinoza", org: "College of Business", basePoints: 56, bottles: 6 },
  { name: "Steven Flores", org: "College of Education", basePoints: 54, bottles: 5 },
  { name: "Pauline Gonzales", org: "College of Engineering", basePoints: 52, bottles: 5 },
  { name: "Jeffrey Dela Rosa", org: "College of Science", basePoints: 50, bottles: 5 },
  { name: "Charlene Mercado", org: "College of Arts", basePoints: 48, bottles: 5 },
  { name: "Darwin Aguilar", org: "College of Business", basePoints: 46, bottles: 5 },
  { name: "Rosalie Manalo", org: "College of Education", basePoints: 44, bottles: 4 },
];

const ORGANIZATIONS = [
  "College of Engineering",
  "College of Science",
  "College of Arts",
  "College of Business",
  "College of Education",
];

// Build full user objects with derived fields
const RAW_USERS = BASE_ENTRIES.map((entry, idx) => {
  const rand1 = ((idx * 17) % 100) / 100;
  const rand2 = ((idx * 31) % 100) / 100;

  return {
    id: `usr_${idx}`,
    name: entry.name,
    username: entry.name.toLowerCase().replace(/\s/g, ""),
    organization: entry.org,
    pointsAllTime: entry.basePoints,
    pointsThisMonth: Math.floor(entry.basePoints * (0.1 + rand1 * 0.4)),
    pointsThisWeek: Math.floor(entry.basePoints * (0.01 + rand2 * 0.1)),
    currentPoints: Math.floor(entry.basePoints * 0.4),
    rewardsClaimed: Math.floor(entry.basePoints / 1000) + Math.floor(rand1 * 5),
    bottles: entry.bottles,
  };
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getRedactedUsername(username) {
  if (username.length <= 2) return username;
  return `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}`;
}

function Initials({ name, className }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return <span className={className}>{initials}</span>;
}

// ─────────────────────────────────────────────
// Expandable Ellipsis Pagination
// ─────────────────────────────────────────────
function Pagination({ currentPage, totalPages, setCurrentPage }) {
  const generateRange = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const ExpandableEllipsis = ({ start, end }) => {
    const [expanded, setExpanded] = useState(false);
    if (start > end) return null;
    const range = generateRange(start, end);
    return (
      <div className="flex items-center h-10">
        {/* Collapsed dots — click to expand */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center justify-center px-2 cursor-pointer"
            aria-label="Show more pages"
          >
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(range.length, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 hover:bg-emerald-400 transition-colors shrink-0"
                />
              ))}
            </div>
          </button>
        )}
        {/* Expanded page buttons */}
        {expanded && (
          <div className="flex items-center gap-1.5 px-1 flex-wrap justify-center">
            {range.map((p) => (
              <button
                key={p}
                onClick={() => { setCurrentPage(p); setExpanded(false); }}
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-black transition-all bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 active:scale-95"
                style={fonts.data}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2 mx-auto max-w-full flex-wrap py-1">
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shrink-0"
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>

      <button
        onClick={() => setCurrentPage(1)}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors shrink-0 shadow-sm border ${currentPage === 1
          ? "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20"
          : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50"
          }`}
        style={fonts.data}
      >
        1
      </button>

      <ExpandableEllipsis start={2} end={currentPage - 1} />

      {currentPage !== 1 && currentPage !== totalPages && (
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 border border-emerald-500 shrink-0"
          style={fonts.data}
        >
          {currentPage}
        </button>
      )}

      <ExpandableEllipsis start={currentPage + 1} end={totalPages - 1} />

      {totalPages > 1 && (
        <button
          onClick={() => setCurrentPage(totalPages)}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors shrink-0 shadow-sm border ${currentPage === totalPages
            ? "bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20"
            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
          style={fonts.data}
        >
          {totalPages}
        </button>
      )}

      <button
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage((p) => p + 1)}
        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-30 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shrink-0"
      >
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// TrophyIcon SVG
// ─────────────────────────────────────────────
function TrophyIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 8 6 8s6-2 6-8V2z" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardPodium() {
  const { currentUser: authUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("All Organizations");
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");

  const itemsPerPage = 10;
  const maxItems = 100;

  // Derive CURRENT_USER_ID from auth user name, fallback to "usr_22"
  // If no mock match, synthesize an entry so name is consistent with the navbar
  const CURRENT_USER_ID = "usr_current";

  // Build the effective user list: inject auth user if not already present
  const effectiveUsers = useMemo(() => {
    if (!authUser?.name) return RAW_USERS;
    const username = authUser.name.toLowerCase().replace(/\s/g, "");
    const alreadyIn = RAW_USERS.some((u) => u.username === username);
    if (alreadyIn) return RAW_USERS;
    // Graft auth user name onto usr_22's stats (placeholder until real API)
    const placeholder = RAW_USERS.find((u) => u.id === "usr_22") || RAW_USERS[22];
    return [
      ...RAW_USERS.filter((u) => u.id !== "usr_22"),
      {
        ...placeholder,
        id: "usr_current",
        name: authUser.name,
        username,
      },
    ];
  }, [authUser]);

  // ── Filter, search, sort ──
  const filteredList = useMemo(() => {
    let list = effectiveUsers.filter(
      (u) => orgFilter === "All Organizations" || u.organization === orgFilter
    ).map((u) => ({
      ...u,
      displayPoints:
        timeFilter === "all"
          ? u.pointsAllTime
          : timeFilter === "month"
            ? u.pointsThisMonth
            : u.pointsThisWeek,
    }));

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    // Sort always by points
    list.sort((a, b) => b.displayPoints - a.displayPoints);

    return list.map((u, idx) => ({ ...u, rank: idx + 1 }));
  }, [effectiveUsers, timeFilter, orgFilter, searchQuery]);

  const currentUser =
    filteredList.find((u) => u.id === CURRENT_USER_ID) ||
    (authUser ? filteredList.find((u) => u.name === authUser.name) : null) ||
    filteredList[22] ||
    filteredList[0];
  const CURRENT_USER_RANK = currentUser?.rank || 1;

  const TABLE_LEADERBOARD = filteredList.slice(0, maxItems);
  const totalPages = Math.ceil(TABLE_LEADERBOARD.length / itemsPerPage);
  const currentList = TABLE_LEADERBOARD.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isUserIncluded = currentList.some((u) => u.rank === CURRENT_USER_RANK);

  // Podium order: 2nd | 1st | 3rd
  const topThree = [filteredList[1], filteredList[0], filteredList[2]].filter(
    Boolean
  );

  // ── Floating modal + scroll state ──
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const tableRef = useRef(null);
  const constraintsRef = useRef(null);

  // Close org dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(e.target)) {
        setOrgDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter, orgFilter, searchQuery]);

  // Drag-end: snap to nearest corner
  const handleDragEnd = () => {
    const el = document.getElementById("floating-modal");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const marginX = vw >= 768 ? 32 : 16;
    const marginY = 32;
    const topMargin = 96;
    const snapToLeft = centerX < vw / 2;
    const snapToTop = centerY < vh / 2;
    const nativeLeft = vw - marginX - rect.width;
    const nativeTop = vh - marginY - rect.height;
    const targetX = snapToLeft ? marginX - nativeLeft : 0;
    const targetY = snapToTop ? topMargin - nativeTop : 0;
    setModalPos({ x: targetX, y: targetY });
  };

  // Reset modal position when it hides
  useEffect(() => {
    if (!isTableVisible || isFooterVisible) {
      setModalPos({ x: 0, y: 0 });
    }
  }, [isTableVisible, isFooterVisible]);

  useEffect(() => {
    const handleResize = () => setModalPos({ x: 0, y: 0 });
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Observe table scroll + footer visibility
  useEffect(() => {
    const handleScroll = () => {
      const el = tableRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      setIsTableVisible(rect.top < windowHeight && rect.bottom > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    const footerObserver = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { rootMargin: "0px", threshold: 0 }
    );
    const footerEl = document.getElementById("footer");
    if (footerEl) footerObserver.observe(footerEl);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (footerEl) footerObserver.unobserve(footerEl);
    };
  }, []);

  // Scroll table into view, clearing the fixed nav (~88px)
  const scrollToTable = () => {
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      const navHeight = 96; // fixed nav top-4 (~16px) + nav body (~64px) + gap
      window.scrollTo({ top: rect.top + window.scrollY - navHeight, behavior: "smooth" });
    }
  };

  // Navigate to current user's page
  const handleSeeStats = () => {
    if (CURRENT_USER_RANK <= maxItems) {
      const targetPage = Math.ceil(CURRENT_USER_RANK / itemsPerPage);
      setCurrentPage(targetPage);
      setTimeout(scrollToTable, 50);
    }
  };

  const handleViewStanding = () => {
    if (CURRENT_USER_RANK > maxItems) {
      setShowRankModal(true);
    } else {
      const targetPage = Math.ceil(CURRENT_USER_RANK / itemsPerPage);
      setCurrentPage(targetPage);
      setTimeout(scrollToTable, 50);
    }
  };

  // Display value helper — always points
  const getDisplayValue = (user) => user.displayPoints;
  const displayUnit = "EP";

  // ── Render ──
  return (
    <div className="grid lg:grid-cols-4 gap-8 relative">
      {/* ═══════════════════════════════════════
          Main Leaderboard Area (3 cols)
          ═══════════════════════════════════════ */}
      <div className="lg:col-span-3 flex flex-col gap-8 order-2 lg:order-1">
        {/* ── Podium Stage ── */}
        <div className="bg-emerald-50 rounded-[24px] sm:rounded-[40px] px-3 sm:px-12 pt-8 sm:pt-10 pb-0 overflow-hidden shadow-sm border border-emerald-100 relative flex flex-col items-center">
          {/* Title + Top 100 badge (mobile: stacked to avoid overlap) */}
          <div className="text-center mb-8 sm:mb-12 relative z-20 w-full px-2">
            {/* Mobile Top 100 badge — sits above title */}
            <div
              className="flex md:hidden justify-center mb-3"
              style={fonts.body}
            >
              <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-950 px-3 py-1.5 rounded-lg shadow-sm text-[10px] font-black uppercase tracking-widest ring-2 ring-white/50">
                <Crown size={13} fill="currentColor" className="text-yellow-950" />
                <span>Top 100 Only</span>
              </div>
            </div>
            <h2
              className="text-3xl sm:text-4xl font-black text-emerald-950 uppercase tracking-tighter drop-shadow-sm"
              style={fonts.heading}
            >
              Top Recyclers
            </h2>
            <p
              className="text-emerald-700/80 font-bold text-sm mt-1"
              style={fonts.body}
            >
              {timeFilter === "all"
                ? "Based on Accumulated Points"
                : timeFilter === "month"
                  ? "Based on Monthly Points"
                  : "Based on Weekly Points"}
            </p>
          </div>

          {/* Podium: 2nd | 1st | 3rd */}
          <div className="flex items-end justify-center w-full max-w-2xl mb-0 relative z-10 mx-auto gap-3 sm:gap-6 h-[340px] sm:h-[420px]">
            {/* ─ Rank 2 (Left) ─ */}
            <div className="flex flex-col items-center z-10 hover:z-30 w-[5.5rem] sm:w-32 group cursor-pointer transition-transform">
              <div className="relative mb-3">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-sky-500 rounded-full border-4 border-white flex items-center justify-center overflow-hidden shadow-xl z-10 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                    <Initials name={topThree[0]?.name || ""} className="" />
                  </div>
                </div>
                <div className="absolute -bottom-3 right-0 left-0 flex justify-center z-20 group-hover:scale-110 transition-transform duration-300">
                  <div className="bg-slate-300 text-slate-800 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    <span className="font-black text-sm" style={fonts.data}>
                      2
                    </span>
                  </div>
                </div>
              </div>
              <p
                className="text-emerald-950 font-black text-sm mt-2 truncate w-full text-center group-hover:text-sky-600 transition-colors"
                style={fonts.heading}
              >
                {topThree[0]?.name || ""}
              </p>
              <p
                className="text-emerald-600 font-bold text-xs group-hover:text-sky-500 transition-colors"
                style={fonts.data}
              >
                {getDisplayValue(topThree[0] || { displayPoints: 0, bottles: 0 }).toLocaleString()}{" "}
                {displayUnit}
              </p>
              {/* Platform */}
              <div className="w-full mt-4 flex flex-col items-center">
                <div className="w-full h-28 group-hover:h-32 transition-all duration-300 ease-out bg-gradient-to-b from-sky-100 to-sky-200 border-t-8 border-sky-400 rounded-t-2xl shadow-inner relative flex justify-center pt-4">
                  <Medal className="text-sky-400/50 w-12 h-12" />
                </div>
              </div>
            </div>

            {/* ─ Rank 1 (Center) ─ */}
            <div className="flex flex-col items-center z-20 hover:z-30 w-[7rem] sm:w-40 group cursor-pointer transition-transform">
              <div className="relative mb-3">
                <Crown
                  className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 text-yellow-400 w-8 h-8 sm:w-10 sm:h-10 drop-shadow-md z-30 group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300"
                  fill="currentColor"
                />
                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-yellow-400 rounded-full border-4 border-white flex items-center justify-center overflow-hidden shadow-2xl z-10 mx-auto ring-4 ring-yellow-400/30 group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center text-orange-900 font-black text-2xl sm:text-3xl">
                    <Initials name={topThree[1]?.name || ""} className="" />
                  </div>
                </div>
                <div className="absolute -bottom-4 right-0 left-0 flex justify-center z-20 group-hover:scale-110 transition-transform duration-300">
                  <div className="bg-yellow-400 text-orange-900 w-10 h-10 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                    <span className="font-black text-lg" style={fonts.data}>
                      1
                    </span>
                  </div>
                </div>
              </div>
              <p
                className="text-emerald-950 font-black text-base mt-2 truncate w-full text-center group-hover:text-amber-600 transition-colors"
                style={fonts.heading}
              >
                {topThree[1]?.name || ""}
              </p>
              <p
                className="text-emerald-600 font-bold text-sm group-hover:text-amber-500 transition-colors"
                style={fonts.data}
              >
                {getDisplayValue(topThree[1] || { displayPoints: 0, bottles: 0 }).toLocaleString()}{" "}
                {displayUnit}
              </p>
              {/* Platform */}
              <div className="w-full mt-4 flex flex-col items-center">
                <div className="w-full h-40 group-hover:h-44 transition-all duration-300 ease-out bg-gradient-to-b from-yellow-100 to-amber-100 border-t-8 border-yellow-400 rounded-t-2xl shadow-inner relative flex justify-center pt-4">
                  <TrophyIcon className="text-yellow-400/50 w-16 h-16" />
                </div>
              </div>
            </div>

            {/* ─ Rank 3 (Right) ─ */}
            <div className="flex flex-col items-center z-10 hover:z-30 w-[5.5rem] sm:w-32 group cursor-pointer transition-transform">
              <div className="relative mb-3">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-500 rounded-full border-4 border-white flex items-center justify-center overflow-hidden shadow-xl z-10 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                    <Initials name={topThree[2]?.name || ""} className="" />
                  </div>
                </div>
                <div className="absolute -bottom-3 right-0 left-0 flex justify-center z-20 group-hover:scale-110 transition-transform duration-300">
                  <div className="bg-orange-800 text-white w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    <span className="font-black text-sm" style={fonts.data}>
                      3
                    </span>
                  </div>
                </div>
              </div>
              <p
                className="text-emerald-950 font-black text-sm mt-2 truncate w-full text-center group-hover:text-orange-600 transition-colors"
                style={fonts.heading}
              >
                {topThree[2]?.name || ""}
              </p>
              <p
                className="text-emerald-600 font-bold text-xs group-hover:text-orange-500 transition-colors"
                style={fonts.data}
              >
                {getDisplayValue(topThree[2] || { displayPoints: 0, bottles: 0 }).toLocaleString()}{" "}
                {displayUnit}
              </p>
              {/* Platform */}
              <div className="w-full mt-4 flex flex-col items-center">
                <div className="w-full h-20 group-hover:h-24 transition-all duration-300 ease-out bg-gradient-to-b from-orange-50 to-orange-100 border-t-8 border-orange-400 rounded-t-2xl shadow-inner relative flex justify-center pt-3">
                  <Medal className="text-orange-400/50 w-10 h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Top 100 badge — desktop only (mobile badge is above title) */}
          <div
            className="absolute bottom-6 right-8 z-20 hidden md:flex items-center gap-2 bg-yellow-400 text-yellow-950 px-4 py-2 rounded-lg shadow-md text-xs font-black uppercase tracking-widest ring-4 ring-yellow-400/20"
            style={fonts.body}
          >
            <Crown size={16} fill="currentColor" className="text-yellow-950" />
            <span>Top 100 Only</span>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-row items-center justify-between gap-2 mt-2 w-full flex-wrap">
          {/* Search + Org (org hidden on mobile) */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 sm:py-2 min-w-0 flex-1 sm:flex-none sm:min-w-[160px] shadow-sm focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all">
              <Search size={14} className="text-emerald-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search User"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[10px] sm:text-sm font-medium placeholder-slate-400"
                style={{ ...fonts.body, color: "#064E3B" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            {/* Org filter — hidden on mobile (org column hidden anyway) */}
            <div className="relative min-w-[190px] hidden sm:block" ref={orgDropdownRef}>
              <button
                type="button"
                onClick={() => setOrgDropdownOpen((p) => !p)}
                className={`w-full flex items-center justify-between gap-2 bg-white border border-emerald-200 px-3 py-1.5 sm:py-2 transition-all text-[10px] sm:text-sm font-bold text-emerald-900 whitespace-nowrap ${orgDropdownOpen
                  ? "rounded-t-lg rounded-b-none border-b-white z-[51] relative shadow-none"
                  : "rounded-lg shadow-sm hover:border-emerald-400"
                  }`}
                style={fonts.body}
              >
                <span>{orgFilter}</span>
                <ChevronDown
                  size={14}
                  className={`text-emerald-500 transition-transform duration-200 ${orgDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {orgDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0.92 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0.92 }}
                    transition={{ duration: 0.14, ease: "easeOut" }}
                    style={{ transformOrigin: "top" }}
                    className="absolute left-0 top-[calc(100%-1px)] z-50 bg-white border border-emerald-200 border-t-0 rounded-b-lg shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-hidden min-w-full"
                  >
                    {["All Organizations", ...ORGANIZATIONS].map((org) => (
                      <button
                        key={org}
                        type="button"
                        onClick={() => { setOrgFilter(org); setOrgDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-[10px] sm:text-sm font-bold transition-colors whitespace-nowrap ${orgFilter === org
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
                          }`}
                        style={fonts.body}
                      >
                        {org}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Time toggle — on mobile sits inline after search; on sm+ right-aligned */}
          <div className="flex items-center space-x-0.5 bg-white border border-emerald-200 p-0.5 rounded-lg shadow-sm shrink-0 flex-nowrap">
            {[
              { key: "all", label: "All Time" },
              { key: "month", label: "This Month" },
              { key: "week", label: "This Week" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeFilter(t.key)}
                className={`whitespace-nowrap px-2 sm:px-4 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-bold transition-colors ${timeFilter === t.key
                  ? "bg-emerald-100 text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
                style={fonts.body}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div
          ref={tableRef}
          className="bg-white rounded-[24px] sm:rounded-[40px] border border-emerald-100 shadow-sm overflow-hidden flex flex-col"
        >
          {/* Column headers */}
          <div
            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-x-3 gap-y-0 sm:gap-4 px-4 sm:px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-widest items-center"
            style={fonts.body}
          >
            <div className="col-span-1 md:col-span-2 text-left">Rank</div>
            <div className="col-span-1 md:col-span-4 text-left">User</div>
            <div className="hidden md:block md:col-span-3">Organization</div>
            <div className="col-span-1 md:col-span-2 text-center">Points</div>
            <div className="hidden md:block md:col-span-1 text-center">Rewards</div>
          </div>

          {/* Rows */}
          <div className="relative flex flex-col">
            <div className="flex flex-col relative z-20 pb-4">
              {currentList.length > 0 ? (
                currentList.map((user) => {
                  const isMe = user.rank === CURRENT_USER_RANK;
                  return (
                    <div
                      key={user.id}
                      className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-x-3 gap-y-0 sm:gap-4 px-4 sm:px-8 py-4 items-center border-b border-emerald-50/50 last:border-none transition-colors ${isMe
                        ? "bg-emerald-50/80 relative"
                        : "hover:bg-slate-50"
                        }`}
                    >
                      {/* "You" left bar */}
                      {isMe && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r-md" />
                      )}

                      {/* Rank — col 1 */}
                      <div className="col-span-1 md:col-span-2 flex justify-start items-center">
                        {user.rank <= 3 ? (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${user.rank === 1
                              ? "bg-yellow-400 text-orange-900 shadow-sm"
                              : user.rank === 2
                                ? "bg-sky-200 text-sky-800 shadow-sm"
                                : "bg-orange-200 text-orange-900 shadow-sm"
                              }`}
                            style={fonts.data}
                          >
                            {user.rank}
                          </div>
                        ) : (
                          <span
                            className={`font-black text-base ${isMe ? "text-emerald-600" : "text-slate-400"
                              }`}
                            style={fonts.data}
                          >
                            #{user.rank}
                          </span>
                        )}
                      </div>

                      {/* User — col 2 */}
                      <div className="col-span-1 md:col-span-4 flex items-center gap-2 min-w-0">
                        <div
                          className="hidden sm:flex w-9 h-9 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full items-center justify-center font-black text-emerald-700 text-sm border border-emerald-200 shrink-0"
                          style={fonts.data}
                        >
                          <Initials name={user.name} className="" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`font-black text-sm truncate ${isMe ? "text-emerald-900" : "text-slate-800"
                                }`}
                              style={fonts.heading}
                            >
                              {user.name}
                            </p>
                            {isMe && (
                              <span
                                className="hidden sm:inline-block bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                                style={fonts.body}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <p
                            className="font-bold text-[10px] text-slate-500 truncate"
                            style={fonts.body}
                          >
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {/* Organization — hidden on mobile */}
                      <div className="col-span-3 hidden md:flex items-center truncate">
                        <div
                          className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-md border border-emerald-100 truncate"
                          style={fonts.body}
                        >
                          {user.organization}
                        </div>
                      </div>

                      {/* Points — col 3 on mobile */}
                      <div className="col-span-1 md:col-span-2 text-center">
                        <p
                          className={`font-black text-sm inline-flex items-baseline gap-1 ${isMe ? "text-emerald-700" : "text-slate-700"
                            }`}
                          style={fonts.data}
                        >
                          {getDisplayValue(user).toLocaleString()}
                          <span
                            className="font-bold text-[10px] text-slate-400 uppercase tracking-widest"
                            style={fonts.body}
                          >
                            {displayUnit}
                          </span>
                        </p>
                      </div>

                      {/* Rewards — hidden on mobile */}
                      <div
                        className="hidden md:flex col-span-1 justify-center items-center font-black text-slate-700 text-sm gap-1.5"
                        style={fonts.data}
                      >
                        <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                        {user.rewardsClaimed}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search size={28} className="text-stone-300 mb-3" />
                  <p
                    className="text-stone-400 font-bold text-sm"
                    style={fonts.body}
                  >
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* ── Floating Modal for Current User ── */}
            <AnimatePresence>
              {!isUserIncluded && isTableVisible && !isFooterVisible && currentUser && (
                <div
                  className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
                  ref={constraintsRef}
                >
                  <motion.div
                    id="floating-modal"
                    drag
                    dragConstraints={constraintsRef}
                    dragMomentum={false}
                    onDragEnd={handleDragEnd}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      x: modalPos.x,
                      y: modalPos.y,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      type: "spring",
                      bounce: 0.2,
                    }}
                    className="absolute inset-x-4 sm:inset-x-auto sm:right-6 md:right-8 bottom-6 sm:bottom-8 pointer-events-auto"
                  >
                    <div className="bg-white border-4 border-emerald-400 shadow-[0_16px_40px_rgb(16,185,129,0.35)] rounded-[20px] py-1.5 px-2.5 flex items-center gap-2 pr-2 w-full sm:w-[340px] md:w-[360px] cursor-grab active:cursor-grabbing hover:border-emerald-300 transition-colors">
                      <div className="bg-emerald-100 text-emerald-700 w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 font-black relative overflow-hidden border border-emerald-200 pointer-events-none">
                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-emerald-200/50" />
                        <span
                          className="relative z-10 text-base sm:text-lg"
                          style={fonts.data}
                        >
                          #{currentUser.rank}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pl-1 pointer-events-none">
                        <p
                          className="font-black text-emerald-950 text-sm sm:text-base truncate"
                          style={fonts.heading}
                        >
                          {currentUser.name}
                        </p>
                        <p
                          className="font-bold text-emerald-600 text-[10px] uppercase tracking-widest truncate mt-0.5"
                          style={fonts.body}
                        >
                          Your Position
                        </p>
                      </div>
                      {CURRENT_USER_RANK <= maxItems && (
                        <button
                          onPointerDownCapture={(e) => e.stopPropagation()}
                          onClick={handleSeeStats}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs pl-3 sm:pl-4 pr-2.5 sm:pr-3 py-2 sm:py-2.5 rounded-[12px] transition-colors shrink-0 shadow-sm active:scale-95 flex items-center gap-1 z-10 relative"
                          style={fonts.body}
                        >
                          <span className="hidden sm:inline">See Stats</span>
                          <span className="sm:hidden">Stats</span>
                          <ChevronRight size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="py-8 flex items-center justify-center border-t border-slate-100 bg-slate-50 relative z-20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Sidebar (1 col)
          ═══════════════════════════════════════ */}
      <div className="relative order-1 lg:order-2 lg:col-span-1 bg-white lg:bg-transparent rounded-[24px] sm:rounded-[40px] lg:rounded-none shadow-sm lg:shadow-none border border-emerald-100 lg:border-0 overflow-hidden lg:overflow-visible">
        <div className="grid grid-cols-2 lg:flex lg:flex-col w-full lg:gap-6">
          {/* ── Personal Rank Highlight ── */}
          <div className="col-span-2 lg:flex-none bg-gradient-to-b from-emerald-500 to-emerald-700 p-6 sm:p-8 lg:p-6 text-white relative overflow-hidden flex flex-col justify-between lg:rounded-[40px] lg:shadow-sm lg:border lg:border-emerald-100">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
              <Crown size={120} strokeWidth={1} />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-6 relative z-10">
                <p
                  className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest"
                  style={fonts.body}
                >
                  Your Standing
                </p>
                {!isTableVisible && (
                  <button
                    onClick={handleViewStanding}
                    className="bg-emerald-600/30 hover:bg-emerald-500 text-white p-1 text-xs rounded-full transition-colors backdrop-blur-sm border border-emerald-400/20 flex items-center justify-center group -mt-0.5"
                    title="View in table"
                  >
                    <Eye
                      size={12}
                      className="text-emerald-100 group-hover:text-white"
                    />
                  </button>
                )}
              </div>

              <div className="flex items-end gap-3 mb-2 relative z-10">
                <span
                  className="text-4xl sm:text-5xl lg:text-5xl font-black leading-none text-white tracking-tighter"
                  style={fonts.data}
                >
                  #{currentUser?.rank ?? "—"}
                </span>
                <span
                  className="text-emerald-200 font-bold text-sm mb-1"
                  style={fonts.body}
                >
                  Overall
                </span>
              </div>
              <p
                className="text-emerald-100 font-medium text-xs mb-4"
                style={fonts.body}
              >
                Out of {filteredList.length} active recyclers.
              </p>
            </div>

            <div className="bg-emerald-900/40 rounded-[20px] p-4 backdrop-blur-sm border border-emerald-400/30 w-full mt-auto">
              <div className="flex items-center justify-between">
                <p
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-200"
                  style={fonts.body}
                >
                  Current Points
                </p>
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              </div>
              <p
                className="text-2xl sm:text-3xl font-black mt-1 text-white tracking-tight"
                style={fonts.data}
              >
                {(currentUser?.currentPoints ?? 0).toLocaleString()}
              </p>
              <p
                className="text-[9px] font-bold text-emerald-200/70 mt-1 uppercase tracking-wider"
                style={fonts.body}
              >
                Available to Spend
              </p>
            </div>
          </div>

          {/* ── Accumulated / Filtered Points ── */}
          <div className="col-span-1 lg:flex-none bg-white p-5 sm:p-6 lg:p-6 relative overflow-hidden group hover:bg-emerald-50/30 transition-all flex flex-col justify-center border-t border-emerald-100 lg:border-t-0 lg:rounded-[40px] lg:shadow-sm lg:border lg:border-emerald-100">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
              <Recycle className="text-sky-500 w-6 h-6" />
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"
              style={fonts.body}
            >
              {timeFilter === "all"
                ? "Accumulated Points"
                : timeFilter === "month"
                  ? "Points This Month"
                  : "Points This Week"}
            </p>
            <p
              className="text-3xl font-black text-emerald-950 mb-2 leading-tight tracking-tight"
              style={fonts.data}
            >
              {(currentUser?.displayPoints ?? 0).toLocaleString()}
            </p>
            <p
              className="text-xs font-bold text-slate-500 leading-relaxed"
              style={fonts.body}
            >
              These points determine your leaderboard rank. Keep recycling to go
              up!
            </p>
          </div>

          {/* ── Rewards Claimed ── */}
          <div className="col-span-1 lg:flex-none bg-white p-5 sm:p-6 lg:p-6 relative overflow-hidden group hover:bg-emerald-50/30 transition-all flex flex-col justify-center border-t border-l border-emerald-100 lg:border-t-0 lg:border-l-0 lg:rounded-[40px] lg:shadow-sm lg:border lg:border-emerald-100">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Gift className="text-amber-500 w-6 h-6" />
            </div>
            <p
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1"
              style={fonts.body}
            >
              Items / Rewards
            </p>
            <p
              className="text-3xl font-black text-emerald-950 mb-2 leading-tight tracking-tight"
              style={fonts.data}
            >
              {currentUser?.rewardsClaimed ?? 0}
            </p>
            <p
              className="text-xs font-bold text-slate-500 leading-relaxed"
              style={fonts.body}
            >
              Successfully claimed across your recycling activity.
            </p>
          </div>
        </div>
      </div>

      {/* ── Rank Modal ── */}
      {showRankModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowRankModal(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full border border-emerald-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <button
                onClick={() => setShowRankModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <h3
              className="font-black text-2xl text-slate-800 mb-3 tracking-tight"
              style={fonts.heading}
            >
              Rank Not Displayed
            </h3>
            <p
              className="text-slate-600 text-sm font-medium leading-relaxed mb-8"
              style={fonts.body}
            >
              Only the top 100 users are available on the public leaderboard.
              Keep recycling to improve your standing!
            </p>
            <button
              onClick={() => setShowRankModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl transition-colors shadow-sm"
              style={fonts.heading}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}