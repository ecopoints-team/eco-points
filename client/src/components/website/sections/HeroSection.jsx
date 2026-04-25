"use client";

import { useEffect, useRef } from "react";

export default function HeroSection() {
  const heroVisualRef = useRef(null);
  const parallaxLayerRef = useRef(null);

  const handleCardMove = (e) => {
    if (window.innerWidth < 768) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `perspective(1000px) rotateX(${y / 35}deg) rotateY(${-x / 35}deg) scale(1.01)`;
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform =
      "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
  };

  useEffect(() => {
    let moveRafId = null;
    let scrollRafId = null;

    const onMouseMove = (e) => {
      if (moveRafId) return;
      moveRafId = requestAnimationFrame(() => {
        moveRafId = null;
        if (parallaxLayerRef.current) {
          const xValue = (window.innerWidth / 2 - e.clientX) / 30;
          const yValue = (window.innerHeight / 2 - e.clientY) / 30;
          Array.from(parallaxLayerRef.current.children).forEach(
            (shape, index) => {
              shape.style.transform = `translate3d(${xValue * (index + 1) * 0.5}px, ${yValue * (index + 1) * 0.5}px, 0)`;
            }
          );
        }
      });
    };

    const onScroll = () => {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        if (heroVisualRef.current) {
          heroVisualRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.2}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      if (moveRafId) cancelAnimationFrame(moveRafId);
      if (scrollRafId) cancelAnimationFrame(scrollRafId);
    };
  }, []);

  return (
    <>
      {/* Parallax Floating Shapes Background */}
      <div className="parallax-bg">
        <div ref={parallaxLayerRef} className="parallax-layer">
          <div className="floating-shape shape-1">
            <div className="shape-inner"></div>
          </div>
          <div className="floating-shape shape-2">
            <div className="shape-inner"></div>
          </div>
          <div className="floating-shape shape-3">
            <div className="shape-inner"></div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        id="home"
        className="min-h-screen flex items-center pt-24 pb-16 px-4 md:px-8 relative z-10 bg-gradient-to-b from-[#f0fdf4]/80 to-white/80 overflow-hidden"
      >
        {/* Decorative SVG Circle */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-cover opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'%3E%3Ccircle cx='600' cy='600' r='500' fill='%2310b981' opacity='0.05'/%3E%3Ccircle cx='700' cy='400' r='300' fill='%2334d399' opacity='0.05'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1.2fr_1fr] gap-16 items-center relative z-10 w-full">
          {/* Left Column — Text Content */}
          <div className="opacity-0 animate-[fadeInUp_1s_ease-out_0.3s_forwards] pt-10">

            <h1 className="text-[clamp(3rem,7vw,6rem)] font-black leading-[1.1] mb-6 text-[#064e3b]" style={{ fontFamily: "'Fredoka'" }}>
              <div className="hero-text-reveal overflow-hidden pb-2">
                <span style={{ animationDelay: "0.1s" }}>Smart</span>
              </div>
              <div className="hero-text-reveal overflow-hidden pb-2">
                <span style={{ animationDelay: "0.2s" }}>Recycling,</span>
              </div>
              <div className="hero-text-reveal overflow-hidden pb-2">
                <span
                  className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent hero-gradient-text relative"
                  data-text="Rewarding Future"
                  style={{ animationDelay: "0.3s" }}
                >
                  Rewarding Future
                </span>
              </div>
            </h1>


            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-[fadeInUp_1s_ease-out_0.9s_backwards]">
              <button className="px-10 py-5 bg-white border-2 border-[#10b981] rounded-full text-[#10b981] font-bold text-lg cursor-pointer transition-all duration-400 hover:bg-[#10b981] hover:text-white hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                Watch Demo ▶
              </button>
            </div>
          </div>

          {/* Right Column — 3D Tilting Card with Machine Image */}
          <div
            ref={heroVisualRef}
            className="relative hidden md:block -mt-12"
          >
            {/* PUP Badge Pill — positioned above the card */}
            <div className="flex justify-center mb-4 animate-[fadeInUp_0.8s_ease-out_0.3s_backwards]">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-[rgba(16,185,129,0.1)] rounded-full text-sm font-semibold text-[#10b981]" style={{ fontFamily: "'Quicksand'" }}>
                🎓 PUP Institute of Technology Research Project
              </div>
            </div>
            <div
              className="bg-white rounded-[30px] p-12 shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative transition-transform duration-500 ease-[cubic-bezier(0.03,0.98,0.52,0.99)] cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
              onMouseMove={handleCardMove}
              onMouseLeave={handleCardLeave}
            >
              <div className="flex items-center justify-center">
                <img
                  src="/ezgif-frame-001.png"
                  alt="EcoPoints Reverse Vending Machine"
                  className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
