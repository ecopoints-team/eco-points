"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import NavBar from "../src/Components/NavBar";
import LogIn from "../src/Components/LogIn";

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
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950">
      <NavBar onLoginClick={() => setIsLoginOpen(true)} />

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