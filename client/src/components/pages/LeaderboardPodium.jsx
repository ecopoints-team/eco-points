// Leaderboard Page
// LeaderboardPodium Component — Real API Data

"use client";

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

// ─────────────────────────────────────────────
// Font styles
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function Initials({ name, className }) {
  const initials = (name || "?")
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
// Skeleton row
// ─────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-12 gap-x-3 gap-y-0 sm:gap-4 px-4 sm:px-8 py-4 items-center border-b border-emerald-50/50 animate-pulse">
      <div className="col-span-1 md:col-span-2"><div className="h-8 w-8 rounded-full bg-slate-100" /></div>
      <div className="col-span-1 md:col-span-4 flex items-center gap-2">
        <div className="hidden sm:block h-9 w-9 rounded-full bg-slate-100 shrink-0" />
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="h-3.5 w-28 rounded bg-slate-100" />
          <div className="h-2.5 w-20 rounded bg-slate-100" />
        </div>
      </div>
      <div className="hidden md:block md:col-span-3"><div className="h-6 w-28 rounded-md bg-slate-100" /></div>
      <div className="col-span-1 md:col-span-2 flex justify-center"><div className="h-4 w-16 rounded bg-slate-100" /></div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardPodium() {
  const { currentUser: authUser } = useAuth();
  const searchParams = useSearchParams();
  const highlightMe = searchParams.get('highlight') === 'me';
  const orgParam = searchParams.get('org') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const [orgFilter, setOrgFilter] = useState(orgParam || "All Organizations");
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const orgDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all"); // all | month | week
  const timeSegRef = useRef(null);
  const [sliderRect, setSliderRect] = useState(null);

  // API state
  const [rawUsers, setRawUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const itemsPerPage = 10;
  const maxItems = 100;

  // ── Fetch leaderboard from API ──
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.leaderboard.get()
      .then(({ topUsers }) => {
        if (cancelled) return;
        // Map API shape → internal shape
        const mapped = (topUsers || []).map((u) => ({
          id: u.id,
          name: u.name || "Unknown",
          username: u.username || u.name?.toLowerCase().replace(/\s+/g, "") || "",
          organization: u.locationName || u.department || "—",
          department: u.department || "—",
          pointsAllTime: u.lifetimePoints || 0,
          pointsThisMonth: u.pointsThisMonth || 0,
          pointsThisWeek: u.pointsThisWeek || 0,
          currentPoints: u.points || 0,
          rewardsClaimed: u.rewardsClaimed || 0,
          bottles: u.bottlesCollected || 0,
          streak: u.streak || 0,
        }));
        setRawUsers(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load leaderboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Derive org list dynamically
  const orgList = useMemo(() => {
    const seen = new Set();
    rawUsers.forEach((u) => { if (u.organization && u.organization !== "—") seen.add(u.organization); });
    return Array.from(seen).sort();
  }, [rawUsers]);

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
  }, [orgFilter, searchQuery, timeFilter]);

  // Measure active time-filter button for the sliding indicator
  useLayoutEffect(() => {
    if (!timeSegRef.current) return;
    const btns = timeSegRef.current.querySelectorAll("button[data-seg]");
    const TIME_KEYS = ["all", "month", "week"];
    const idx = TIME_KEYS.indexOf(timeFilter);
    if (btns[idx]) {
      setSliderRect({ left: btns[idx].offsetLeft, width: btns[idx].offsetWidth });
    }
  }, [timeFilter]);

  // ── Filter, search, sort ──
  const filteredList = useMemo(() => {
    let list = rawUsers.filter(
      (u) => orgFilter === "All Organizations" || u.organization === orgFilter
    ).map((u) => ({
      ...u,
      displayPoints:
        timeFilter === "month" ? u.pointsThisMonth
          : timeFilter === "week" ? u.pointsThisWeek
            : u.pointsAllTime,
    }));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => b.displayPoints - a.displayPoints);

    // Assign dense ranks: tied points share the same rank
    let currentRank = 1;
    return list.map((u, idx) => {
      if (idx > 0 && u.displayPoints < list[idx - 1].displayPoints) {
        currentRank = idx + 1;
      }
      return { ...u, rank: currentRank };
    });
  }, [rawUsers, orgFilter, searchQuery, timeFilter]);

  // Identify current user by ID
  const currentUser = useMemo(() => {
    if (!authUser?.id) return filteredList[0] || null;
    return filteredList.find((u) => String(u.id) === String(authUser.id)) || null;
  }, [filteredList, authUser]);

  const CURRENT_USER_RANK = currentUser?.rank || null;

  // Include all users whose rank is within the top maxItems (ties at the boundary are shown)
  const TABLE_LEADERBOARD = filteredList.filter((u) => u.rank <= maxItems);
  const totalPages = Math.max(1, Math.ceil(TABLE_LEADERBOARD.length / itemsPerPage));
  const currentList = TABLE_LEADERBOARD.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isUserIncluded = authUser?.id
    ? currentList.some((u) => String(u.id) === String(authUser.id))
    : false;

  // Podium list — org + time filter, never affected by search
  const podiumList = useMemo(() => {
    const list = rawUsers
      .filter((u) => orgFilter === "All Organizations" || u.organization === orgFilter)
      .map((u) => ({
        ...u,
        displayPoints:
          timeFilter === "month" ? u.pointsThisMonth
            : timeFilter === "week" ? u.pointsThisWeek
              : u.pointsAllTime,
      }));
    const sorted = [...list].sort((a, b) => b.displayPoints - a.displayPoints);

    // Assign dense ranks consistent with the main leaderboard
    let currentRank = 1;
    const ranked = sorted.map((u, idx) => {
      if (idx > 0 && u.displayPoints < sorted[idx - 1].displayPoints) {
        currentRank = idx + 1;
      }
      return { ...u, rank: currentRank };
    });

    return ranked.slice(0, 3);
  }, [rawUsers, orgFilter, timeFilter]);

  // Podium order: 2nd | 1st | 3rd
  const topThree = [podiumList[1], podiumList[0], podiumList[2]].filter(Boolean);

  // ── Floating modal + scroll state ──
  const [isTableVisible, setIsTableVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const tableRef = useRef(null);
  const constraintsRef = useRef(null);

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

  const scrollToTable = () => {
    // When arriving via highlight=me, prefer scrolling to the user's specific row
    const myRow = document.getElementById("my-leaderboard-row");
    if (myRow) {
      const rect = myRow.getBoundingClientRect();
      const navHeight = 96;
      // Place the row roughly in the upper-middle of the viewport so it's
      // fully visible with the rows above it for context.
      const viewportCenter = window.innerHeight * 0.38;
      const scrollTarget = rect.top + window.scrollY - navHeight - viewportCenter;
      window.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
      return;
    }
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      const navHeight = 96;
      window.scrollTo({ top: rect.top + window.scrollY - navHeight, behavior: "smooth" });
    }
  };

  // ── Auto-scroll to the current user's row when arriving from "View Leaderboard" ──
  // Fires once after data loads when `highlight=me` is in the URL.
  const hasAutoScrolled = useRef(false);
  useEffect(() => {
    if (!highlightMe || hasAutoScrolled.current) return;
    if (loading || !rawUsers.length) return;
    if (!CURRENT_USER_RANK) return;

    hasAutoScrolled.current = true;
    const targetPage = Math.ceil(CURRENT_USER_RANK / itemsPerPage);
    setCurrentPage(targetPage);
    // Give the DOM a tick to re-render the correct page before scrolling
    setTimeout(scrollToTable, 150);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightMe, loading, rawUsers.length, CURRENT_USER_RANK]);

  const handleSeeStats = () => {
    if (CURRENT_USER_RANK && CURRENT_USER_RANK <= maxItems) {
      const targetPage = Math.ceil(CURRENT_USER_RANK / itemsPerPage);
      setCurrentPage(targetPage);
      setTimeout(scrollToTable, 50);
    }
  };

  const handleViewStanding = () => {
    if (!CURRENT_USER_RANK || CURRENT_USER_RANK > maxItems) {
      setShowRankModal(true);
    } else {
      const targetPage = Math.ceil(CURRENT_USER_RANK / itemsPerPage);
      setCurrentPage(targetPage);
      setTimeout(scrollToTable, 50);
    }
  };

  // ── Render ──
  return (
    <div className="grid lg:grid-cols-4 gap-8 relative">
      {/* ═══════════════════════════════════════
          Main Leaderboard Area (3 cols)
          ═══════════════════════════════════════ */}
      <div className="lg:col-span-3 flex flex-col gap-8 order-2 lg:order-1">
        {/* ── Podium Stage ── */}
        <div className="bg-emerald-50 rounded-[24px] sm:rounded-[40px] px-3 sm:px-12 pt-8 sm:pt-10 pb-0 overflow-hidden shadow-sm border border-emerald-100 relative flex flex-col items-center">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12 relative z-20 w-full px-2">
            <div className="flex md:hidden justify-center mb-3" style={fonts.body}>
              <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-yellow-950 px-3 py-1.5 rounded-lg shadow-sm text-[10px] font-black uppercase tracking-widest ring-2 ring-white/50">
                <Crown size={13} fill="currentColor" className="text-yellow-950" />
                <span>Top 100 Only</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950 uppercase tracking-tighter drop-shadow-sm" style={fonts.heading}>
              Top Recyclers
            </h2>
            <p className="text-emerald-700/80 font-bold text-sm mt-1" style={fonts.body}>
              {timeFilter === "month" ? "Based on Points This Month"
                : timeFilter === "week" ? "Based on Points This Week"
                  : "Based on Accumulated Points"}
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
                    <span className="font-black text-sm" style={fonts.data}>2</span>
                  </div>
                </div>
              </div>
              <p className="text-emerald-950 font-black text-sm mt-2 truncate w-full text-center group-hover:text-sky-600 transition-colors" style={fonts.heading}>
                {loading ? "—" : (topThree[0]?.name || "")}
              </p>
              <p className="text-emerald-600 font-bold text-xs group-hover:text-sky-500 transition-colors" style={fonts.data}>
                {loading ? "—" : `${(topThree[0]?.displayPoints || 0).toLocaleString()} EP`}
              </p>
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
                    <span className="font-black text-lg" style={fonts.data}>1</span>
                  </div>
                </div>
              </div>
              <p className="text-emerald-950 font-black text-base mt-2 truncate w-full text-center group-hover:text-amber-600 transition-colors" style={fonts.heading}>
                {loading ? "—" : (topThree[1]?.name || "")}
              </p>
              <p className="text-emerald-600 font-bold text-sm group-hover:text-amber-500 transition-colors" style={fonts.data}>
                {loading ? "—" : `${(topThree[1]?.displayPoints || 0).toLocaleString()} EP`}
              </p>
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
                    <span className="font-black text-sm" style={fonts.data}>3</span>
                  </div>
                </div>
              </div>
              <p className="text-emerald-950 font-black text-sm mt-2 truncate w-full text-center group-hover:text-orange-600 transition-colors" style={fonts.heading}>
                {loading ? "—" : (topThree[2]?.name || "")}
              </p>
              <p className="text-emerald-600 font-bold text-xs group-hover:text-orange-500 transition-colors" style={fonts.data}>
                {loading ? "—" : `${(topThree[2]?.displayPoints || 0).toLocaleString()} EP`}
              </p>
              <div className="w-full mt-4 flex flex-col items-center">
                <div className="w-full h-20 group-hover:h-24 transition-all duration-300 ease-out bg-gradient-to-b from-orange-50 to-orange-100 border-t-8 border-orange-400 rounded-t-2xl shadow-inner relative flex justify-center pt-3">
                  <Medal className="text-orange-400/50 w-10 h-10" />
                </div>
              </div>
            </div>
          </div>

          {/* Top 100 badge — desktop */}
          <div
            className="absolute bottom-6 right-8 z-20 hidden md:flex items-center gap-2 bg-yellow-400 text-yellow-950 px-4 py-2 rounded-lg shadow-md text-xs font-black uppercase tracking-widest ring-4 ring-yellow-400/20"
            style={fonts.body}
          >
            <Crown size={16} fill="currentColor" className="text-yellow-950" />
            <span>Top 100 Only</span>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 w-full flex-wrap">
          {/* Row 1: Search + Org */}
          <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
            {/* Search — wider */}
            <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-1.5 sm:py-2 flex-1 sm:min-w-[240px] shadow-sm focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400 transition-all">
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
                <button onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-emerald-500 transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Org filter — fixed width = widest option via phantom sizer */}
            {orgList.length > 0 && (
              <div className="relative hidden sm:block shrink-0" ref={orgDropdownRef}>
                {/* Phantom sizer: invisible, sets container width to widest option */}
                <div
                  className="invisible pointer-events-none flex items-center gap-2 px-3 py-2 text-[10px] sm:text-sm font-bold whitespace-nowrap"
                  style={fonts.body}
                  aria-hidden
                >
                  <span>
                    {["All Organizations", ...orgList].reduce((a, b) =>
                      a.length > b.length ? a : b, "All Organizations"
                    )}
                  </span>
                  <ChevronDown size={14} className="flex-shrink-0" />
                </div>
                {/* Actual button: absolutely fills phantom's footprint */}
                <button
                  type="button"
                  onClick={() => setOrgDropdownOpen((p) => !p)}
                  className={`absolute inset-0 flex items-center justify-between gap-2 bg-white border border-emerald-200 px-3 transition-all text-[10px] sm:text-sm font-bold text-emerald-900 whitespace-nowrap ${orgDropdownOpen
                    ? "rounded-t-lg rounded-b-none border-b-white z-[51] shadow-none"
                    : "rounded-lg shadow-sm hover:border-emerald-400"
                    }`}
                  style={fonts.body}
                >
                  <span>{orgFilter}</span>
                  <ChevronDown
                    size={14}
                    className={`text-emerald-500 transition-transform duration-200 flex-shrink-0 ${orgDropdownOpen ? "rotate-180" : ""}`}
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
                      {["All Organizations", ...orgList].map((org) => (
                        <button
                          key={org}
                          type="button"
                          onClick={() => { setOrgFilter(org); setOrgDropdownOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[10px] sm:text-sm font-bold transition-colors whitespace-nowrap ${orgFilter === org
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
            )}
          </div>

          {/* Time filter — segmented control with measured sliding indicator */}
          {(() => {
            const TIME_OPTIONS = [
              { key: "all", label: "All Time" },
              { key: "month", label: "This Month" },
              { key: "week", label: "This Week" },
            ];
            return (
              <div
                ref={timeSegRef}
                className="relative flex bg-white border border-emerald-200 rounded-lg p-[3px] shrink-0"
                style={{ height: "38px" }}
              >
                {/* Sliding background — sized to the active button */}
                {sliderRect && (
                  <div
                    className="absolute top-[3px] bottom-[3px] rounded-md bg-emerald-600 shadow-sm transition-all duration-200 ease-out"
                    style={{ left: sliderRect.left, width: sliderRect.width }}
                  />
                )}
                {TIME_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    data-seg
                    onClick={() => setTimeFilter(key)}
                    className={`relative z-10 px-4 text-[10px] sm:text-xs font-black uppercase tracking-wide transition-colors duration-200 whitespace-nowrap ${timeFilter === key ? "text-white" : "text-emerald-700 hover:text-emerald-900"
                      }`}
                    style={fonts.body}
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>

        {/* ── Table ── */}
        <div
          ref={tableRef}
          className="bg-white rounded-[24px] sm:rounded-[40px] border border-emerald-100 shadow-sm overflow-hidden flex flex-col"
        >
          {/* Column headers */}
          <div
            className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-12 gap-x-3 gap-y-0 sm:gap-4 px-4 sm:px-8 py-5 bg-emerald-50/50 border-b border-emerald-100 text-[10px] sm:text-xs font-black text-emerald-800 uppercase tracking-widest items-center"
            style={fonts.body}
          >
            <div className="col-span-1 md:col-span-2 text-left">Rank</div>
            <div className="col-span-1 md:col-span-4 text-left">User</div>
            <div className="hidden md:block md:col-span-3 text-left">Organization</div>
            <div className="col-span-1 md:col-span-2 text-center">Points</div>
            <div className="col-span-1 md:col-span-1 text-center">Rewards</div>
          </div>

          {/* Rows */}
          <div className="relative flex flex-col">
            <div className="flex flex-col relative z-20 pb-4">
              {/* Loading state */}
              {loading && (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              )}

              {/* Error state */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <AlertCircle size={28} className="text-red-300" />
                  <p className="text-slate-500 font-bold text-sm" style={fonts.body}>{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                    style={fonts.body}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && currentList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search size={28} className="text-stone-300 mb-3" />
                  <p className="text-stone-400 font-bold text-sm" style={fonts.body}>
                    {searchQuery ? `No results for "${searchQuery}"` : "No users found."}
                  </p>
                </div>
              )}

              {/* Data rows */}
              {!loading && !error && currentList.map((user) => {
                const isMe = authUser?.id && String(user.id) === String(authUser.id);
                const isHighlighted = isMe && highlightMe;
                return (
                  <div
                    key={user.id}
                    id={isMe ? "my-leaderboard-row" : undefined}
                    className={`grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-12 gap-x-3 gap-y-0 sm:gap-4 px-4 sm:px-8 py-4 items-center border-b border-emerald-50/50 last:border-none transition-colors ${isMe
                      ? `bg-emerald-50/80 relative${isHighlighted ? ' ring-2 ring-inset ring-emerald-400' : ''}`
                      : "hover:bg-slate-50"
                      }`}
                  >
                    {isMe && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r-md" />
                    )}

                    {/* Rank */}
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
                          className={`font-black text-base ${isMe ? "text-emerald-600" : "text-slate-400"}`}
                          style={fonts.data}
                        >
                          #{user.rank}
                        </span>
                      )}
                    </div>

                    {/* User */}
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
                            className={`font-black text-sm truncate ${isMe ? "text-emerald-900" : "text-slate-800"}`}
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
                        <p className="font-bold text-[10px] text-slate-500 truncate" style={fonts.body}>
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {/* Organization */}
                    <div className="col-span-3 hidden md:flex items-center truncate">
                      <div
                        className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-md border border-emerald-100 truncate"
                        style={fonts.body}
                      >
                        {user.organization}
                      </div>
                    </div>

                    {/* Points */}
                    <div className="col-span-1 md:col-span-2 text-right">
                      <p
                        className={`font-black text-sm inline-flex items-baseline gap-1 ${isMe ? "text-emerald-700" : "text-slate-700"}`}
                        style={fonts.data}
                      >
                        {user.displayPoints.toLocaleString()}
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest" style={fonts.body}>
                          EP
                        </span>
                      </p>
                    </div>

                    {/* Rewards */}
                    <div className="col-span-1 md:col-span-1 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-black text-sm ${isMe ? "text-emerald-700" : "text-slate-700"
                          }`}
                        style={fonts.data}
                        title="Rewards redeemed"
                      >
                        <Gift size={13} className="text-emerald-500 flex-shrink-0" />
                        {user.rewardsClaimed ?? 0}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                    animate={{ opacity: 1, x: modalPos.x, y: modalPos.y, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
                    className="absolute inset-x-4 sm:inset-x-auto sm:right-6 md:right-8 bottom-6 sm:bottom-8 pointer-events-auto"
                  >
                    <div className="bg-white border-4 border-emerald-400 shadow-[0_16px_40px_rgb(16,185,129,0.35)] rounded-[20px] py-1.5 px-2.5 flex items-center gap-2 pr-2 w-full sm:w-[340px] md:w-[360px] cursor-grab active:cursor-grabbing hover:border-emerald-300 transition-colors">
                      <div className="bg-emerald-100 text-emerald-700 w-11 h-11 sm:w-12 sm:h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 font-black relative overflow-hidden border border-emerald-200 pointer-events-none">
                        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-emerald-200/50" />
                        <span className="relative z-10 text-base sm:text-lg" style={fonts.data}>
                          #{currentUser.rank}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pl-1 pointer-events-none">
                        <p className="font-black text-emerald-950 text-sm sm:text-base truncate" style={fonts.heading}>
                          {currentUser.name}
                        </p>
                        <p className="font-bold text-emerald-600 text-[10px] uppercase tracking-widest truncate mt-0.5" style={fonts.body}>
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
                <p className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest" style={fonts.body}>
                  Your Standing
                </p>
                {!isTableVisible && currentUser && (
                  <button
                    onClick={handleViewStanding}
                    className="bg-emerald-600/30 hover:bg-emerald-500 text-white p-1 text-xs rounded-full transition-colors backdrop-blur-sm border border-emerald-400/20 flex items-center justify-center group -mt-0.5"
                    title="View in table"
                  >
                    <Eye size={12} className="text-emerald-100 group-hover:text-white" />
                  </button>
                )}
              </div>

              <div className="flex items-end gap-3 mb-2 relative z-10">
                <span className="text-4xl sm:text-5xl lg:text-5xl font-black leading-none text-white tracking-tighter" style={fonts.data}>
                  {loading ? (
                    <Loader2 size={36} className="animate-spin text-emerald-200" />
                  ) : (
                    currentUser ? `#${currentUser.rank}` : "—"
                  )}
                </span>
                <span className="text-emerald-200 font-bold text-sm mb-1" style={fonts.body}>
                  Overall
                </span>
              </div>
              <p className="text-emerald-100 font-medium text-xs mb-4" style={fonts.body}>
                Out of {filteredList.length} active recyclers.
              </p>
            </div>

            <div className="bg-emerald-900/40 rounded-[20px] p-4 backdrop-blur-sm border border-emerald-400/30 w-full mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200" style={fonts.body}>
                  Current EcoPoints (EP)
                </p>
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black mt-1 text-white tracking-tight" style={fonts.data}>
                {loading ? "—" : (currentUser?.currentPoints ?? 0).toLocaleString()}
              </p>
              <p className="text-[9px] font-bold text-emerald-200/70 mt-1 uppercase tracking-wider" style={fonts.body}>
                Available to Spend
              </p>
            </div>
          </div>

          {/* ── Accumulated Points ── */}
          <div className="col-span-1 lg:flex-none bg-white p-5 sm:p-6 lg:p-6 relative overflow-hidden group hover:bg-emerald-50/50 transition-all flex flex-col justify-center border-t border-emerald-100 lg:border-t-0 lg:rounded-[40px] lg:shadow-sm lg:border lg:border-emerald-100">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
              <Recycle className="text-sky-500 w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" style={fonts.body}>
              Accumulated Points
            </p>
            <p className="text-3xl font-black text-emerald-950 mb-2 leading-tight tracking-tight" style={fonts.data}>
              {loading ? "—" : (currentUser?.pointsAllTime ?? 0).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-500 leading-relaxed" style={fonts.body}>
              These points determine your leaderboard rank. Keep recycling to go up!
            </p>
          </div>

          {/* ── Bottles Collected ── */}
          <div className="col-span-1 lg:flex-none bg-white p-5 sm:p-6 lg:p-6 relative overflow-hidden group hover:bg-emerald-50/50 transition-all flex flex-col justify-center border-t border-l border-emerald-100 lg:border-t-0 lg:border-l-0 lg:rounded-[40px] lg:shadow-sm lg:border lg:border-emerald-100">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <Gift className="text-amber-500 w-6 h-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1" style={fonts.body}>
              Bottles Collected
            </p>
            <p className="text-3xl font-black text-emerald-950 mb-2 leading-tight tracking-tight" style={fonts.data}>
              {loading ? "—" : (currentUser?.bottles ?? 0).toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-500 leading-relaxed" style={fonts.body}>
              Total bottles recycled across all your sessions.
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
            <h3 className="font-black text-2xl text-slate-800 mb-3 tracking-tight" style={fonts.heading}>
              Rank Not Displayed
            </h3>
            <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8" style={fonts.body}>
              Only the top 100 users are available on the public leaderboard. Keep recycling to improve your standing!
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