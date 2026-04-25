"use client";

import Link from "next/link";
import { ArrowLeft, Trophy, Leaf } from "lucide-react";
import LeaderboardPodium from "../../src/Components/LeaderboardPodium";

function LeaderboardHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-gradient-to-r from-[#1b4332] via-[#2a5c34] to-[#1b4332] shadow-[0_4px_32px_rgba(0,0,0,0.35)] border-b border-[#66C68E]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center gap-4">

        {/* Left: Back to Home */}
        <div className="flex-1">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="text-xs font-bold tracking-widest uppercase hidden sm:inline">
              Back to Home
            </span>
          </Link>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <h1 className="text-white text-lg sm:text-xl chewy-regular tracking-widest uppercase">
            Leaderboards
          </h1>
          <Trophy size={16} className="text-amber-400" />
        </div>

        {/* Right: EcoPoints Logo */}
        <div className="flex-1 flex justify-end">
          <img
            src="/EcoPoints Logo Mark with Name (Light Version).png"
            alt="EcoPoints"
            className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#66C68E]/60 to-transparent" />
    </header>
  );
}

export default function LeaderboardPage() {
  return (
    <>
      <LeaderboardHeader />
      <main className="pt-16 min-h-screen bg-slate-50 relative overflow-hidden">
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
        <Leaf size={70}  className="pointer-events-none absolute top-1/3 left-[8%] text-emerald-500/[0.05] rotate-[60deg]" fill="currentColor" />
        <Leaf size={55}  className="pointer-events-none absolute bottom-1/4 right-[12%] text-emerald-500/[0.05] -rotate-[20deg]" fill="currentColor" />
        <Leaf size={42}  className="pointer-events-none absolute top-[12%] left-[40%] text-emerald-400/[0.04] rotate-[80deg]" fill="currentColor" />
        {/* Additional leaves — top-heavy distribution */}
        <Leaf size={120} className="pointer-events-none absolute top-[5%] left-[15%] text-emerald-500/[0.05] -rotate-[35deg]" fill="currentColor" />
        <Leaf size={95}  className="pointer-events-none absolute top-[2%] right-[25%] text-emerald-400/[0.06] rotate-[45deg]" fill="currentColor" />
        <Leaf size={50}  className="pointer-events-none absolute top-[18%] left-[55%] text-emerald-500/[0.04] rotate-[120deg]" fill="currentColor" />
        <Leaf size={65}  className="pointer-events-none absolute top-[8%] left-[75%] text-emerald-600/[0.05] -rotate-[60deg]" fill="currentColor" />
        <Leaf size={38}  className="pointer-events-none absolute top-[30%] right-[5%] text-emerald-400/[0.04] rotate-[150deg]" fill="currentColor" />
        <Leaf size={85}  className="pointer-events-none absolute bottom-[10%] left-[25%] text-emerald-500/[0.04] rotate-[30deg]" fill="currentColor" />

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
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <LeaderboardPodium />
        </div>
      </main>
    </>
  );
}
