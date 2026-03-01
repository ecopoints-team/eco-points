"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// Go UP one level (..), then into 'src', then 'Components'
import NavBar from "../src/Components/NavBar";
import Hero from "../src/Components/Hero";
import Features from "../src/Components/Features";
import Services from "../src/Components/Services";
import Rewards from "../src/Components/Showcase"; // Assuming Showcase.jsx is here
import About from "../src/Components/About";
import LogIn from "../src/Components/LogIn";
import Footer from "../src/Components/Footer";

// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Auto-open login modal when ?login=true is in URL (from logout / auth guard redirect)
  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      setIsLoginOpen(true);
      // Clean the URL without reloading the page
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  const handleLoginClose = () => {
    setIsLoginOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden relative">
      <NavBar onLoginClick={() => setIsLoginOpen(true)} />
      
      <main className="flex flex-col gap-0">
        <Hero />
        <Features />
        <Services />
        <Rewards />
        <About />
      </main>
      
      <Footer />

      {isLoginOpen && (
        <LogIn onClose={handleLoginClose} />
      )}
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