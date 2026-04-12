"use client";

import Link from "next/link";
import { ArrowLeft, Leaf } from "lucide-react";
import UserSummary from "./UserSummary";

function RewardsHeader() {
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
          <Leaf size={16} className="text-[#66C68E]" />
          <h1 className="text-white text-lg sm:text-xl chewy-regular tracking-widest uppercase">
            Rewards
          </h1>
          <Leaf size={16} className="text-[#66C68E] scale-x-[-1]" />
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

export default function Rewards() {
  return (
    <>
      <RewardsHeader />
      <main className="max-w-7xl mx-auto px-6 pt-28 pb-32 min-h-screen">
        <UserSummary />
        {/* Developers: add your sections below */}
      </main>
    </>
  );
}
