"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import NavBar from "../src/Components/NavBar";
import LogIn from "../src/Components/LogIn";
import LeaderboardCTA from "../src/Components/Leaderboard";
import Footer from "../src/Components/Footer";

import HowItWorks from "../src/Components/HowItWorks";

// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
        <section id="how-it-works" className="mb-32 min-h-300 flex items-center justify-center bg-lime-800 rounded-lg">
          <h2 className="text-3xl font-bold text-white">How It Works</h2>
        <section id="how-it-works">
          <HowItWorks />

        </section>

        {/* Section 3: Features */}
        <section
          id="features"
          className="mb-32 min-h-300 flex items-center justify-center bg-lime-800 rounded-lg"
        >
          <h2 className="text-3xl font-bold text-white">Features</h2>
        </section>

        {/* Section 4: Leaderboard */}
        <LeaderboardCTA onLoginClick={() => setIsLoginOpen(true)} />

        {/* Section 5: Rewards */}
        <section
          id="rewards"
          className="mb-32 min-h-300 flex items-center justify-center bg-lime-800 rounded-lg"
        >
          <h2 className="text-3xl font-bold text-white">Rewards</h2>
        </section>

        {/* Footer */}
        <Footer />
      </div>

      {/* Section 5: Rewards */}
      <Carousel />
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
