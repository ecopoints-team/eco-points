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
import HeroSection from "../src/Components/HeroSection";
import CTASection from "../src/Components/CTASection";
import ScrollToTop from "../src/Components/ScrollToTop";


// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginSignUpMode, setLoginSignUpMode] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Scroll to top on page load / refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-open login modal when ?login=true is in URL (from logout / auth guard redirect)
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      setLoginSignUpMode(false);
      setIsLoginOpen(true);
      // Clean the URL without reloading the page
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  const handleLoginClose = () => {
    setIsLoginOpen(false);
    setLoginSignUpMode(false);
  };

  const openLogin = () => {
    setLoginSignUpMode(false);
    setIsLoginOpen(true);
  };

  const openSignUp = () => {
    setLoginSignUpMode(true);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#064e3b] overflow-x-hidden">
      {/* Page content — blurred when modal is open */}
      <div className={`transition-[filter,opacity] duration-300 ${isLoginOpen ? "blur-sm brightness-75 pointer-events-none select-none" : ""}`}>
        <NavBar onLoginClick={openLogin} />

        <ScrollToTop />
        <HeroSection />
        <HowItWorks />
        <div className="px-4 md:px-8">
          <Features />
        </div>
        <div className="px-4 md:px-8">
          <LeaderboardCTA onLoginClick={openSignUp} />
        </div>
        <Carousel />
        <CTASection onLoginClick={openSignUp} />
        <Footer />
      </div>

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

      {/* Login Modal — overlays page with blurred backdrop */}
      {isLoginOpen && <LogIn onClose={handleLoginClose} initialSignUp={loginSignUpMode} />}
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
