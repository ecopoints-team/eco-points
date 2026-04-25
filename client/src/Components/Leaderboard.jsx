// Home Page
// Leaderboard Section

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Recycle,
  Zap,
  TrendingUp,
  ArrowRight,
  Star,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// Mock top-3 data 
// ─────────────────────────────────────────────
const MOCK_PODIUM = [
  {
    rank: 1,
    points: "2,850",
    color: "from-amber-400 to-yellow-500",
    ring: "ring-amber-400/80",
    shadow: "shadow-amber-500/60",
    icon: <Crown size={28} className="text-white drop-shadow-lg" />,
    label: "1st",
    labelColor: "text-amber-700 font-black",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.55)]",
    platformBg: "bg-gradient-to-b from-amber-300/60 to-amber-400/20 border-2 border-amber-300/60",
    watermarkColor: "text-amber-500/20",
  },
  {
    rank: 2,
    points: "2,680",
    color: "from-slate-300 to-slate-400",
    ring: "ring-slate-400/70",
    shadow: "shadow-slate-400/40",
    icon: <Medal size={24} className="text-white drop-shadow" />,
    label: "2nd",
    labelColor: "text-slate-600 font-black",
    glow: "",
    platformBg: "bg-gradient-to-b from-slate-300/50 to-slate-200/20 border-2 border-slate-300/50",
    watermarkColor: "text-slate-400/20",
  },
  {
    rank: 3,
    points: "2,450",
    color: "from-amber-600 to-orange-500",
    ring: "ring-amber-600/60",
    shadow: "shadow-amber-700/40",
    icon: <Award size={24} className="text-white drop-shadow" />,
    label: "3rd",
    labelColor: "text-orange-700 font-black",
    glow: "",
    platformBg: "bg-gradient-to-b from-orange-300/50 to-amber-200/20 border-2 border-orange-300/50",
    watermarkColor: "text-orange-500/20",
  },
];

// Font styles 
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// How it Works steps
// ─────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    icon: <Recycle size={22} className="text-emerald-400" />,
    title: "Recycle",
    desc: "Drop bottles into the EcoPoints RVM",
  },
  {
    icon: <Zap size={22} className="text-amber-400" />,
    title: "Earn Points",
    desc: "Points are added to your account instantly",
  },
  {
    icon: <TrendingUp size={22} className="text-sky-400" />,
    title: "Climb the Ranks",
    desc: "Your rank updates live across your campus",
  },
  {
    icon: <Star size={22} className="text-pink-400" />,
    title: "Win Rewards",
    desc: "Top recyclers unlock exclusive campus rewards",
  },
];

// ─────────────────────────────────────────────
// Scroll-in hook
// ─────────────────────────────────────────────
function useInView(threshold = 0.15) {
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
// Podium 
// ─────────────────────────────────────────────
function Podium({ inView }) {
  const order = [MOCK_PODIUM[1], MOCK_PODIUM[0], MOCK_PODIUM[2]];

  return (
    <div className="flex items-end justify-center gap-2 md:gap-4">
      {order.map((user, i) => {
        const delay = i === 1 ? 0 : i === 0 ? 150 : 280;
        const isFirst = user.rank === 1;

        return (
          <div
            key={user.rank}
            className="flex flex-col items-center group cursor-default"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(40px)",
              transition: `opacity 0.65s ease ${delay}ms, transform 0.75s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
            }}
          >
            {isFirst && (
              <Crown
                size={36}
                className="mb-1 text-amber-400 drop-shadow-lg"
                style={{ animation: "bounce-slow 3s infinite ease-in-out" }}
                fill="#fbbf24"
                strokeWidth={1.5}
              />
            )}

            <div className="relative mb-3">
              {isFirst && (
                <>
                  <span className="absolute inset-[-6px] rounded-full border-2 border-amber-400/40 animate-ping" />
                  <span className="absolute inset-[-3px] rounded-full border border-amber-400/30" />
                </>
              )}
              <div
                className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${user.color} ring-2 ${user.ring} shadow-xl ${user.shadow} ${user.glow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${isFirst ? "w-20 h-20" : "w-14 h-14"
                  }`}
              >
                {user.icon}
              </div>
            </div>

            {/* Points badge */}
            <div
              className="mb-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-black text-white tabular-nums shadow-sm"
              style={fonts.data}
            >
              {user.points} pts
            </div>

            {/* Platform block */}
            <div
              className={`${isFirst ? "w-24 md:w-28 h-28" : user.rank === 2 ? "w-20 md:w-24 h-20" : "w-20 md:w-24 h-14"
                } rounded-t-2xl relative flex items-start justify-center pt-3 overflow-hidden transition-all duration-300 group-hover:brightness-105 ${user.platformBg}`}
            >
              <span className={`absolute inset-0 flex items-center justify-center text-7xl font-black select-none ${user.watermarkColor}`}>
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
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardCTA({ onLoginClick }) {
  const router = useRouter();
  const { currentUser, isInitialized } = useAuth();

  const [sectionRef, sectionInView] = useInView(0.08);
  const [podiumRef, podiumInView] = useInView(0.08);
  const [stepsRef, stepsInView] = useInView(0.08);

  const handleCTAClick = () => {
    if (currentUser) {
      router.push("/admin/leaderboards");
    } else {
      onLoginClick?.();
    }
  };

  return (
    <section
      id="leaderboard"
      ref={sectionRef}
      className="mb-32 relative overflow-hidden rounded-3xl"
    >
      {/* ── Background glow blobs ── */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-amber-400/[0.06] blur-2xl" />

      {/* ── Light card container — off-white like scrolled navbar ── */}
      <div className="relative border border-stone-200 bg-white/95 backdrop-blur-sm rounded-3xl px-6 py-14 md:px-14 md:py-16 overflow-hidden shadow-xl shadow-black/5">

        {/* ── Eco background design ── */}

        {/* Subtle dot-grid SVG pattern */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="eco-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(16,185,129,0.10)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#eco-dots)" />
        </svg>

        {/* Eco wave design — bottom of the card */}
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

        {/* Scattered leaf silhouettes */}
        <Leaf size={180} className="pointer-events-none absolute -top-8 -right-12 text-emerald-500/[0.06] rotate-[15deg]" fill="currentColor" />
        <Leaf size={70} className="pointer-events-none absolute top-1/3 left-[8%] text-emerald-500/[0.05] rotate-[60deg]" fill="currentColor" />
        <Leaf size={55} className="pointer-events-none absolute bottom-1/4 right-[12%] text-emerald-500/[0.05] -rotate-[20deg]" fill="currentColor" />
        <Leaf size={42} className="pointer-events-none absolute top-[12%] left-[40%] text-emerald-400/[0.04] rotate-[80deg]" fill="currentColor" />

        {/* Animated pulse rings */}
        <div className="pointer-events-none absolute top-[20%] right-[15%]">
          <div className="w-24 h-24 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: "3s" }} />
        </div>
        <div className="pointer-events-none absolute bottom-[25%] left-[10%]">
          <div className="w-16 h-16 rounded-full border border-emerald-500/15 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        </div>

        {/* ── Top row: Text (left) + Podium (right) ── */}
        <div
          ref={podiumRef}
          className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 mb-14"
        >
          {/* ── LEFT: Title + CTA ── */}
          <div
            className="w-full max-w-lg text-left"
            style={{
              opacity: sectionInView ? 1 : 0,
              transform: sectionInView ? "translateX(0)" : "translateX(-28px)",
              transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s",
            }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider" style={fonts.body}>
                UPDATED IN REAL-TIME
              </span>
            </div>

            <h2
              className="text-4xl md:text-5xl font-black mb-5 leading-tight"
              style={{ ...fonts.heading, color: "#064E3B" }}
            >
              Compete.{" "}
              <span style={{ WebkitTextFillColor: "transparent", background: "linear-gradient(to right, #10B981, #059669)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                Recycle.
              </span>{" "}
              Rise.
            </h2>

            <p
              className="text-base md:text-lg leading-relaxed mb-4 max-w-xl"
              style={{ ...fonts.body, color: "#6B7280" }}
            >
              Every bottle you recycle earns you points and a spot on the live campus
              leaderboard. See how you stack up against your peers — and compete for
              exclusive rewards.
            </p>

            {/* Bullet points */}
            <ul className="space-y-2.5 mb-8">
              {[
                { icon: <Trophy size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />, text: "Earn special profile badges and campus recognition" },
                { icon: <Star size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />, text: "Unlock exclusive top-tier merch rewards" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm" style={{ ...fonts.body, color: "#6B7280" }}>
                  {item.icon}
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            {isInitialized && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  id="leaderboard-cta-primary"
                  onClick={handleCTAClick}
                  className="group flex items-center gap-2.5 px-7 py-3.5 text-white font-black text-sm rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    ...fonts.body,
                    backgroundColor: "#059669",
                    boxShadow: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#065F46"; e.currentTarget.style.boxShadow = "0 0 24px rgba(5,150,105,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#059669"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {currentUser ? (
                    <>
                      View Your Current Rank
                      <TrendingUp
                        size={16}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      />
                    </>
                  ) : (
                    <>
                      Sign In to Compete
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </button>

                {currentUser && (
                  <button
                    id="leaderboard-cta-secondary"
                    onClick={() => router.push("/admin/leaderboards")}
                    className="flex items-center gap-2 px-5 py-3.5 border border-emerald-200 font-bold text-sm rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                    style={{ ...fonts.body, color: "#065F46" }}
                  >
                    View Full Leaderboard
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            )}

            {!isInitialized && (
              <div className="h-12 w-48 rounded-2xl bg-slate-100 animate-pulse" />
            )}
          </div>

          {/* ── RIGHT: Podium ── */}
          <div
            className="flex-shrink-0 w-full lg:w-auto flex flex-col items-center gap-4"
            style={{
              opacity: sectionInView ? 1 : 0,
              transform: sectionInView ? "translateX(0)" : "translateX(28px)",
              transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s",
            }}
          >
            {/* Section label */}
            <div className="flex items-center gap-2 self-start lg:self-center mb-2">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#6B7280" }}>
                Top Recyclers
              </span>
            </div>

            <Podium inView={podiumInView} />

            <p className="text-xs mt-1 font-medium text-center" style={{ ...fonts.body, color: "#6B7280" }}>
              + 200 more recyclers competing right now
            </p>
          </div>
        </div>

        {/* ── How It Works — Roadmap ── */}
        <div ref={stepsRef}>
          <div
            className="text-center pt-10 pb-6"
            style={{ opacity: stepsInView ? 1 : 0, transition: "opacity 0.5s ease" }}
          >
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ ...fonts.heading, color: "#065F46", letterSpacing: "0.15em" }}
            >
              How The Leaderboard Works
            </span>
          </div>

          {/* ── Roadmap: 4 horizontal cards, alternating high/low  ── */}
          <div
            className="relative"
            style={{ height: "260px", overflow: "visible", opacity: stepsInView ? 1 : 0, transition: "opacity 0.6s ease" }}
          >
            {/* SVG dashed connector lines — L-shaped, side midpoints */}
            <svg
              className="pointer-events-none absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ overflow: "visible", opacity: stepsInView ? 1 : 0, transition: "opacity 0.8s ease 0.35s" }}
            >
              {/* 1→2: bottom-center of Card1 → down to Card2 mid-Y → right to Card2 left-side-center */}
              <path d="M 11 44 L 11 75 L 26 75" stroke="#34D399" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
              {/* 2→3: top-center of Card2 → up to Card3 mid-Y → right to Card3 left-side-center */}
              <path d="M 37 58 L 37 27 L 52 27" stroke="#34D399" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
              {/* 3→4: bottom-center of Card3 → down to Card4 mid-Y → right to Card4 left-side-center */}
              <path d="M 63 44 L 63 75 L 78 75" stroke="#34D399" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Card 1 — top-left, icon at top */}
            <div
              className="absolute group"
              style={{ top: "24px", left: "0%", width: "22%", opacity: stepsInView ? 1 : 0, transform: stepsInView ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.6s ease 0ms, transform 0.6s ease 0ms" }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-lime-50 border-2 border-lime-300 group-hover:border-lime-500 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                {HOW_IT_WORKS[0].icon}
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 pt-8 text-center hover:-translate-y-1 transition-transform duration-300">
                <span className="text-sm font-black block mb-1 select-none" style={{ ...fonts.data, color: "#6EE7B7" }}>01</span>
                <p className="font-bold text-sm mb-1" style={{ ...fonts.heading, color: "#064E3B" }}>{HOW_IT_WORKS[0].title}</p>
                <p className="text-[11px] leading-relaxed" style={{ ...fonts.body, color: "#6B7280" }}>{HOW_IT_WORKS[0].desc}</p>
              </div>
            </div>

            {/* Card 2 — bottom (offset down), icon at bottom */}
            <div
              className="absolute group"
              style={{ bottom: "20px", left: "26%", width: "22%", opacity: stepsInView ? 1 : 0, transform: stepsInView ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.6s ease 180ms, transform 0.6s ease 180ms" }}
            >
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 pb-8 text-center hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                <p className="font-bold text-sm mb-1" style={{ ...fonts.heading, color: "#064E3B" }}>{HOW_IT_WORKS[1].title}</p>
                <p className="text-[11px] leading-relaxed mb-2" style={{ ...fonts.body, color: "#6B7280" }}>{HOW_IT_WORKS[1].desc}</p>
                <span className="text-sm font-black block mt-auto select-none" style={{ ...fonts.data, color: "#6EE7B7" }}>02</span>
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-amber-50 border-2 border-amber-300 group-hover:border-amber-500 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                {HOW_IT_WORKS[1].icon}
              </div>
            </div>

            {/* Card 3 — top (same level as Card 1), icon at top */}
            <div
              className="absolute group"
              style={{ top: "24px", left: "52%", width: "22%", opacity: stepsInView ? 1 : 0, transform: stepsInView ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.6s ease 360ms, transform 0.6s ease 360ms" }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-sky-50 border-2 border-sky-300 group-hover:border-sky-500 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                {HOW_IT_WORKS[2].icon}
              </div>
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 pt-8 text-center hover:-translate-y-1 transition-transform duration-300">
                <span className="text-sm font-black block mb-1 select-none" style={{ ...fonts.data, color: "#6EE7B7" }}>03</span>
                <p className="font-bold text-sm mb-1" style={{ ...fonts.heading, color: "#064E3B" }}>{HOW_IT_WORKS[2].title}</p>
                <p className="text-[11px] leading-relaxed" style={{ ...fonts.body, color: "#6B7280" }}>{HOW_IT_WORKS[2].desc}</p>
              </div>
            </div>

            {/* Card 4 — bottom-right, icon at bottom */}
            <div
              className="absolute group"
              style={{ bottom: "20px", right: "0%", width: "22%", opacity: stepsInView ? 1 : 0, transform: stepsInView ? "translateY(0)" : "translateY(14px)", transition: "opacity 0.6s ease 540ms, transform 0.6s ease 540ms" }}
            >
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 pb-8 text-center hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                <p className="font-bold text-sm mb-1" style={{ ...fonts.heading, color: "#064E3B" }}>{HOW_IT_WORKS[3].title}</p>
                <p className="text-[11px] leading-relaxed mb-2" style={{ ...fonts.body, color: "#6B7280" }}>{HOW_IT_WORKS[3].desc}</p>
                <span className="text-sm font-black block mt-auto select-none" style={{ ...fonts.data, color: "#6EE7B7" }}>04</span>
              </div>
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-pink-50 border-2 border-pink-300 group-hover:border-pink-500 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110">
                {HOW_IT_WORKS[3].icon}
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
