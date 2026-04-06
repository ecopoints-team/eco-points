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
  Flame,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// Decorative mock top-3 data (no real data)
// ─────────────────────────────────────────────
const MOCK_PODIUM = [
  {
    rank: 1,
    initials: "MS",
    name: "M. Santos",
    dept: "BSIT · 3rd Year",
    points: "2,850 pts",
    streak: 15,
    color: "from-amber-400 to-yellow-500",
    ring: "ring-amber-400/60",
    shadow: "shadow-amber-500/30",
    icon: <Crown size={20} className="text-white drop-shadow" />,
    label: "🥇 1st Place",
    badge: "bg-gradient-to-r from-amber-500 to-yellow-500",
  },
  {
    rank: 2,
    initials: "JC",
    name: "J. Cruz",
    dept: "BSCS · 3rd Year",
    points: "2,680 pts",
    streak: 20,
    color: "from-slate-400 to-slate-500",
    ring: "ring-slate-400/50",
    shadow: "shadow-slate-500/20",
    icon: <Medal size={20} className="text-white drop-shadow" />,
    label: "🥈 2nd Place",
    badge: "bg-gradient-to-r from-slate-400 to-slate-500",
  },
  {
    rank: 3,
    initials: "AR",
    name: "A. Reyes",
    dept: "BSN · 2nd Year",
    points: "2,450 pts",
    streak: 20,
    color: "from-amber-600 to-orange-500",
    ring: "ring-amber-600/40",
    shadow: "shadow-amber-700/20",
    icon: <Award size={20} className="text-white drop-shadow" />,
    label: "🥉 3rd Place",
    badge: "bg-gradient-to-r from-amber-600 to-orange-600",
  },
];

// ─────────────────────────────────────────────
// How it Works steps
// ─────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    icon: <Recycle size={22} className="text-lime-300" />,
    title: "Recycle",
    desc: "Drop bottles & cans into an EcoPoints RVM",
  },
  {
    icon: <Zap size={22} className="text-lime-300" />,
    title: "Earn Points",
    desc: "Points are added to your account instantly",
  },
  {
    icon: <TrendingUp size={22} className="text-lime-300" />,
    title: "Climb the Ranks",
    desc: "Your rank updates live across your campus",
  },
  {
    icon: <Star size={22} className="text-lime-300" />,
    title: "Win Rewards",
    desc: "Top recyclers unlock exclusive campus rewards",
  },
];

// ─────────────────────────────────────────────
// Scroll-in animations
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
// Podium Card
// ─────────────────────────────────────────────
function PodiumCard({ user, delay, inView }) {
  return (
    <div
      className="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 transition-all duration-700 hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, background 0.3s, box-shadow 0.3s, translate 0.3s`,
      }}
    >
      {/* Rank Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black text-white ${user.badge}`}
        >
          {user.label}
        </span>
        <div className="flex items-center gap-1 text-orange-300 text-xs font-bold">
          <Flame size={12} fill="currentColor" />
          {user.streak}d
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${user.color} ring-2 ${user.ring} shadow-lg ${user.shadow} flex items-center justify-center flex-shrink-0`}
        >
          {user.icon}
        </div>
        <div className="min-w-0">
          <p className="font-black text-white text-sm leading-tight truncate">
            {user.name}
          </p>
          <p className="text-white/50 text-[11px] truncate">{user.dept}</p>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
          <Star size={12} className="text-amber-400" fill="currentColor" />
          EcoPoints
        </div>
        <span className="text-lime-300 font-black text-base">{user.points}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function LeaderboardCTA({ onLoginClick }) {
  const router = useRouter();
  const { currentUser, isInitialized } = useAuth();

  const [sectionRef, sectionInView] = useInView(0.1);
  const [podiumRef, podiumInView] = useInView(0.1);
  const [stepsRef, stepsInView] = useInView(0.1);

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
      <div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-lime-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-3xl" />

      {/* ── Glass container ── */}
      <div className="relative border border-white/10 bg-white/5 backdrop-blur-sm rounded-3xl px-6 py-16 md:px-16 md:py-20 overflow-hidden">

        {/* Decorative floating leaves */}
        <Leaf
          size={120}
          className="pointer-events-none absolute -top-6 -right-8 text-lime-400/8 rotate-12"
          fill="currentColor"
        />
        <Leaf
          size={80}
          className="pointer-events-none absolute bottom-8 left-4 text-lime-400/8 -rotate-45"
          fill="currentColor"
        />

        {/* ── Header ── */}
        <div
          className="text-center mb-14"
          style={{
            opacity: sectionInView ? 1 : 0,
            transform: sectionInView ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
            </span>
            <span className="text-lime-300 text-xs font-bold uppercase tracking-wider">
              Updated in Real-Time
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            Compete.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-400">
              Recycle.
            </span>{" "}
            Rise.
          </h2>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Every bottle you recycle earns you points and a spot on the live
            campus leaderboard. See how you stack up against your peers — and
            compete for exclusive rewards.
          </p>
        </div>

        {/* ── Mock Podium ── */}
        <div ref={podiumRef} className="mb-14">
          {/* Section label */}
          <div
            className="flex items-center gap-3 mb-6"
            style={{
              opacity: podiumInView ? 1 : 0,
              transition: "opacity 0.5s ease 0.1s",
            }}
          >
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-white/70 text-sm font-bold uppercase tracking-wider">
                Top Recyclers
              </span>
            </div>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs italic">Preview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd - 1st - 3rd layout on desktop */}
            {/* On mobile: 1st, 2nd, 3rd in order */}
            <div className="md:order-2">
              <PodiumCard user={MOCK_PODIUM[0]} delay={0} inView={podiumInView} />
            </div>
            <div className="md:order-1">
              <PodiumCard user={MOCK_PODIUM[1]} delay={120} inView={podiumInView} />
            </div>
            <div className="md:order-3">
              <PodiumCard user={MOCK_PODIUM[2]} delay={240} inView={podiumInView} />
            </div>
          </div>

          {/* Blur overlay hinting there's more below */}
          <div className="relative mt-3 h-14 overflow-hidden rounded-b-2xl pointer-events-none">
            <div className="absolute inset-0 flex flex-col gap-2 px-2 opacity-30">
              {[4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-3 bg-white/20 rounded-full"
                  style={{ width: `${90 - n * 8}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5" />
          </div>

          {/* "And 200+ more recyclers…" */}
          <p className="text-center text-white/30 text-sm mt-2 font-medium">
            + 200 more recyclers competing right now
          </p>
        </div>

        {/* ── How It Works steps ── */}
        <div ref={stepsRef} className="mb-14">
          <div
            className="text-center mb-8"
            style={{
              opacity: stepsInView ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          >
            <span className="text-white/50 text-sm font-bold uppercase tracking-widest">
              How The Leaderboard Works
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 group"
                style={{
                  opacity: stepsInView ? 1 : 0,
                  transform: stepsInView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.6s ease ${i * 100}ms, transform 0.6s ease ${i * 100}ms, background 0.3s`,
                }}
              >
                {/* Step number */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/20 flex items-center justify-center group-hover:bg-lime-400/15 transition-colors">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-lime-400/20 border border-lime-400/30 flex items-center justify-center text-[10px] font-black text-lime-300">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm mb-1">{step.title}</p>
                  <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Buttons ── */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{
            opacity: sectionInView ? 1 : 0,
            transform: sectionInView ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s",
          }}
        >
          {isInitialized && (
            <>
              <button
                id="leaderboard-cta-primary"
                onClick={handleCTAClick}
                className="group flex items-center gap-2.5 px-8 py-4 bg-lime-400 hover:bg-lime-300 text-lime-950 font-black text-base rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(163,230,53,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {currentUser ? (
                  <>
                    View My Rank
                    <TrendingUp
                      size={18}
                      className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    />
                  </>
                ) : (
                  <>
                    Sign In to Compete
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>

              {currentUser && (
                <button
                  id="leaderboard-cta-secondary"
                  onClick={() => router.push("/admin/leaderboards")}
                  className="flex items-center gap-2 px-6 py-4 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 font-bold text-sm rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  View Full Leaderboard
                  <ChevronRight size={16} />
                </button>
              )}
            </>
          )}

          {/* Skeleton while auth initializes */}
          {!isInitialized && (
            <div className="h-14 w-52 rounded-2xl bg-white/10 animate-pulse" />
          )}
        </div>

        {/* ── Fine print ── */}
        <p className="text-center text-white/25 text-xs mt-6">
          Rankings reset at the start of each academic term. Earn points by recycling at any EcoPoints RVM on campus.
        </p>
      </div>
    </section>
  );
}
