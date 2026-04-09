"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
