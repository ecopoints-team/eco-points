"use client";
import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import NavBar from "../src/components/website/NavBar";
import HeroSection from "../src/components/website/sections/HeroSection";
import Footer from "../src/components/website/Footer";
import ScrollToTop from "../src/components/website/ScrollToTop";
import EcoLoadingScreen from "../src/components/shared/EcoLoadingScreen";
import { useState } from "react";
import { useUI } from "../src/context/UIContext";

// Lazy-load below-fold sections for faster initial paint
const LeaderboardCTA = dynamic(() => import("../src/components/pages/Leaderboard"));
const Features = dynamic(() => import("../src/components/website/sections/Features"));
const HowItWorks = dynamic(() => import("../src/components/website/sections/HowItWorks"));
const Carousel = dynamic(() => import("../src/components/website/sections/Carousel"));
const CTASection = dynamic(() => import("../src/components/website/sections/CTASection"));


// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLoginModal, isLoginOpen } = useUI();
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

  // Auto-open login modal when ?login=true is in URL (from logout / auth guard redirect)
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      openLoginModal(false);
      // Clean the URL without reloading the page
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, openLoginModal]);

  const openLogin = () => openLoginModal(false);
  const openSignUp = () => openLoginModal(true);

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
