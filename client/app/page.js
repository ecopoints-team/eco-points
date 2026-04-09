"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, User, Trophy, Menu, X } from "lucide-react";

import NavBar from "../src/Components/NavBar";
import LogIn from "../src/Components/LogIn";
import LeaderboardCTA from "../src/Components/Leaderboard";
import Features from "../src/Components/Features";
import HowItWorks from "../src/Components/HowItWorks";
import Footer from "../src/Components/Footer";
import Carousel from "../src/Components/Carousel";

// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Auto-open login modal when ?login=true is in URL (from logout / auth guard redirect)
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setIsLoginOpen(true);
      // Clean the URL without reloading the page
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950">
      {!isLoginOpen && <NavBar onLoginClick={() => setIsLoginOpen(true)} />}

      {isLoginOpen && <LogIn onClose={handleLoginClose} />}

      {/* Navigation Bar Test Sections */}
      <div className="p-8 pt-32">
        {/* Section 1: Home */}
        <section
          id="home"
          className="mb-32 min-h-300 flex items-center justify-center bg-lime-800 rounded-lg"
        >
          <h1 className="text-4xl font-bold text-white">Home</h1>
        </section>

        {/* Section 2: How It Works */}
        <HowItWorks />

        {/* Section 3: Features */}
        <Features />

        {/* Section 4: Leaderboard */}
        <LeaderboardCTA onLoginClick={() => setIsLoginOpen(true)} />

      </div>
      <Carousel />

      {/* Footer */}
      <Footer />

      {/* Expandable Test Navigation Pill — bottom-left */}
      <div className="fixed bottom-6 left-6 z-[1000]">
        {/* Pill Toggle Button */}
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-lime-950/90 backdrop-blur-md border border-white/20 rounded-full shadow-2xl text-white hover:bg-lime-900/90 transition-all duration-300 group"
        >
          {isNavOpen ? (
            <X size={16} className="text-[#66C68E] transition-transform duration-300 group-hover:rotate-90" />
          ) : (
            <Menu size={16} className="text-[#66C68E] transition-transform duration-300" />
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Test Navigation
          </span>
        </button>

        {/* Expandable Nav Links */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isNavOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
            }`}
        >
          <div className="flex flex-col gap-2 bg-lime-950/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl px-4 py-3">
            <Link
              href="/rewards"
              id="home-rewards-btn"
              className="flex items-center gap-2 px-4 py-2 bg-[#66C68E]/20 text-white font-bold rounded-lg shadow hover:bg-[#66C68E]/40 hover:scale-[1.02] transition-all duration-200 border border-[#66C68E]/30 text-sm"
            >
              <Gift size={15} className="text-[#66C68E]" />
              Rewards
            </Link>
            <Link
              href="/profile"
              id="home-profile-btn"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold rounded-lg shadow hover:bg-white/20 hover:scale-[1.02] transition-all duration-200 border border-white/20 backdrop-blur-sm text-sm"
            >
              <User size={15} className="text-white/70" />
              Profile
            </Link>
            <Link
              href="/leaderboard"
              id="home-leaderboard-btn"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-white font-bold rounded-lg shadow hover:bg-amber-500/40 hover:scale-[1.02] transition-all duration-200 border border-amber-500/30 text-sm"
            >
              <Trophy size={15} className="text-amber-400" />
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
