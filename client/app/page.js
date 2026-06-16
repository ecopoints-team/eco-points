"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Gift, User, Trophy, Menu, X } from "lucide-react";

import NavBar from "../src/components/website/NavBar";
import HeroSection from "../src/components/website/sections/HeroSection";
import Footer from "../src/components/website/Footer";
import ScrollToTop from "../src/components/website/ScrollToTop";
import EcoLoadingScreen from "../src/components/shared/EcoLoadingScreen";

// Lazy-load below-fold sections for faster initial paint
const LogIn = dynamic(() => import("../src/components/pages/LogIn"), { ssr: false });
const LeaderboardCTA = dynamic(() => import("../src/components/pages/Leaderboard"));
const Features = dynamic(() => import("../src/components/website/sections/Features"));
const HowItWorks = dynamic(() => import("../src/components/website/sections/HowItWorks"));
const Carousel = dynamic(() => import("../src/components/website/sections/Carousel"));
const CTASection = dynamic(() => import("../src/components/website/sections/CTASection"));


// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginSignUpMode, setLoginSignUpMode] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(() => {
    // window.__ecoLoadingDone survives SPA navigation but resets on full reload/refresh
    if (typeof window === "undefined") return true;
    return !window.__ecoLoadingDone;
  });

  // Scroll to top on page load / refresh
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Warm up login modal chunk to avoid first-open delay.
  useEffect(() => {
    let timeoutId;

    const warmLoginModal = () => {
      import("../src/components/pages/LogIn");
    };

    timeoutId = window.setTimeout(warmLoginModal, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
    <>
      {/* Loading screen — plays full animation, then reveals page */}
      {isLoading && (
        <EcoLoadingScreen onComplete={() => { window.__ecoLoadingDone = true; setIsLoading(false); }} />
      )}

      <div
        className="min-h-screen bg-slate-50 text-[#064e3b] overflow-x-hidden"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: "opacity 500ms ease-in",
          pointerEvents: isLoading ? "none" : "auto",
        }}
      >
        {/* Page content — blurred when modal is open */}
        <div className={`${isLoginOpen ? "pointer-events-none select-none" : ""}`}>
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

        {/* Expandable Test Navigation Pill — bottom-left (Hidden) */}
        {/*
        <div className="fixed bottom-6 left-6 z-[1000]">
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

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isNavOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
              }`}
          >
            <div className="flex flex-col gap-2 bg-lime-950/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl px-4 py-3">
              <Link
                href="/rewards"
                id="home-rewards-btn"
                className="flex items-center gap-2 px-4 py-2 bg-[#66C68E]/20 text-white font-bold web-web-rounded-lg shadow hover:bg-[#66C68E]/40 hover:scale-[1.02] transition-all duration-200 border border-[#66C68E]/30 text-sm"
              >
                <Gift size={15} className="text-[#66C68E]" />
                Rewards
              </Link>
              <Link
                href="/profile"
                id="home-profile-btn"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold web-web-rounded-lg shadow hover:bg-white/20 hover:scale-[1.02] transition-all duration-200 border border-white/20 backdrop-blur-sm text-sm"
              >
                <User size={15} className="text-white/70" />
                Profile
              </Link>
              <Link
                href="/leaderboard"
                id="home-leaderboard-btn"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-white font-bold web-web-rounded-lg shadow hover:bg-amber-500/40 hover:scale-[1.02] transition-all duration-200 border border-amber-500/30 text-sm"
              >
                <Trophy size={15} className="text-amber-400" />
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
        */}

        {/* Login Modal — overlays page with blurred backdrop */}
        {isLoginOpen && (
          <LogIn
            onClose={handleLoginClose}
            initialSignUp={loginSignUpMode}
          />
        )}
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

