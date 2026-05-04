"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import ProfileSkeleton from "../../src/components/shared/skeletons/ProfileSkeleton";

const ProfileSection = dynamic(
  () => import("../../src/components/pages/ProfileSection"),
  { loading: () => <ProfileSkeleton /> }
);

function ProfileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border-b border-[#10b981]/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center gap-4">

        {/* Left: Back to Home */}
        <div className="flex-1">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-[#064e3b] hover:bg-[#10b981]/5 transition-all duration-300"
          >
            <ArrowLeft
              size={18}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            <span className="text-xs font-bold tracking-widest uppercase hidden sm:inline" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Back to Home
            </span>
          </Link>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <h1 className="text-[#064e3b] text-lg sm:text-xl font-black tracking-widest uppercase" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Profile
          </h1>
        </div>

        {/* Right: EcoPoints Logo */}
        <div className="flex-1 flex justify-end">
          <img
            src="/ecopoints-logo-mark.png"
            alt="EcoPoints"
            className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#10b981]/40 to-transparent" />
    </header>
  );
}

export default function ProfilePage() {
  return (
    <>
      <ProfileHeader />
      <main className="pt-16 min-h-screen bg-slate-50">
        {/* Developers: add your sections below */}
        <ProfileSection />
      </main>
    </>
  );
}
