"use client";
import { useState } from "react";

// Go UP one level (..), then into 'src', then 'Components'
import NavBar from "../src/Components/NavBar";
import Hero from "../src/Components/Hero";
import Features from "../src/Components/Features";
import Services from "../src/Components/Services";
import Rewards from "../src/Components/Showcase"; // Assuming Showcase.jsx is here
import About from "../src/Components/About";
import LogIn from "../src/Components/LogIn";
import Footer from "../src/Components/Footer";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

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
        <LogIn onClose={() => setIsLoginOpen(false)} />
      )}
    </div>
  );
}