"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { QrCode, DoorOpen, Users, Bell, ArrowDown, Coins } from "lucide-react";

export default function HeroSection() {
  const heroVisualRef = useRef(null);
  const parallaxLayerRef = useRef(null);
  const [showToast, setShowToast] = useState(false);



  /* ── Parallax mouse + scroll ── */
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
          heroVisualRef.current.style.transform = `translate3d(0, ${window.scrollY * 0.15}px, 0)`;
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

  /* ── Watch Demo toast ── */
  const handleWatchDemo = useCallback(() => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  }, []);

  /* ── Learn More scroll ── */
  const handleLearnMore = useCallback(() => {
    const nextSection = document.getElementById("how-it-works");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    }
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

        {/* Logo watermark */}
        <img
          src="/ecopoints-primary-logo.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "clamp(1800px, 70vw, 1000px)",
            height: "auto",
            opacity: 0.03,
            pointerEvents: "none",
            userSelect: "none",
            zIndex: 0,
            objectFit: "contain",
          }}
        />

        {/* ── Main 2-column grid ── */}
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center relative z-10 w-full">

          {/* ── Z-10: Left Column — Typography & CTA ── */}
          <div className="opacity-0 animate-[fadeInUp_1s_ease-out_0.3s_forwards] pt-4 md:pt-10">
            {/* Status badge */}
            <div className="flex mb-6 animate-[fadeInUp_0.8s_ease-out_0.2s_backwards]">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#10b981]/30 bg-[#10b981]/5 rounded-full text-xs font-bold text-[#10b981] tracking-wide uppercase"
                style={{ fontFamily: "'Quicksand'" }}
              >
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                PUP Institute of Technology
              </div>
            </div>

            {/* Headline */}
            <h1
              className="hero-headline-text text-[clamp(2.5rem,6vw,5.5rem)] font-black leading-[1.05] mb-6 text-[#064e3b]"
              style={{ fontFamily: "'Fredoka'" }}
            >
              <div className="hero-text-reveal overflow-hidden pb-1">
                <span className="hero-headline-italic" style={{ animationDelay: "0.1s" }}>
                  Scan. Drop. Earn.
                </span>
              </div>
              <div className="hero-text-reveal overflow-hidden pb-1">
                <span className="hero-headline-italic" style={{ animationDelay: "0.2s" }}>
                  Smart recycling
                </span>
              </div>
              <div className="hero-text-reveal overflow-hidden pb-1">
                <span
                  className="hero-headline-italic bg-gradient-to-r from-[#059669] to-[#34d399] bg-clip-text text-transparent hero-gradient-text relative"
                  data-text="made rewarding."
                  style={{ animationDelay: "0.3s" }}
                >
                  made rewarding.
                </span>
              </div>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-base md:text-lg text-[#064e3b]/70 max-w-[520px] mb-10 leading-relaxed animate-[fadeInUp_1s_ease-out_0.6s_backwards] font-medium"
              style={{ fontFamily: "'Quicksand'" }}
            >
              EcoPoints bridges the gap between environmental action and
              immediate gratification. Help keep the campus clean by feeding our
              AI-powered bin, and earn digital points for every bottle you
              recycle!
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-[fadeInUp_1s_ease-out_0.8s_backwards]">
              <button
                onClick={handleWatchDemo}
                className="hero-btn-primary"
              >
                Watch Demo ▶
              </button>
              <button
                onClick={handleLearnMore}
                className="hero-btn-secondary group"
              >
                Learn More
                <ArrowDown size={16} className="transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* ── Z-20: Right Column — Product Showcase & Annotations ── */}
          <div
            ref={heroVisualRef}
            className="relative hidden md:block"
          >
            {/* Machine card with scale hover */}
            <div className="hero-machine-card">
              <img
                src="/Updated Machine Design.png"
                alt="EcoPoints Smart Reverse Vending Machine"
                className="w-full h-auto max-h-[600px] object-contain drop-shadow-[0_25px_40px_rgba(6,78,59,0.18)]"
              />

              {/* ── SVG Dashed connector lines ── */}
              <svg
                className="hero-connector-svg"
                viewBox="0 0 600 650"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Line to QR Scanner tag (top) */}
                <line
                  x1="280" y1="80"
                  x2="100" y2="30"
                  stroke="#10b981"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  strokeOpacity="0.35"
                />
                {/* Line to Door Access tag (right-mid) */}
                <line
                  x1="420" y1="300"
                  x2="560" y2="260"
                  stroke="#10b981"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  strokeOpacity="0.35"
                />
                {/* Line to Accessible tag (bottom-left) */}
                <line
                  x1="180" y1="500"
                  x2="40" y2="530"
                  stroke="#10b981"
                  strokeWidth="1.2"
                  strokeDasharray="6 4"
                  strokeOpacity="0.35"
                />
              </svg>

              {/* ── Floating Annotation Tags ── */}

              {/* Tag 1: QR Scanner — top-left */}
              <div
                className="hero-annotation-tag"
                style={{
                  top: "-5%",
                  left: "-12%",
                  animationDelay: "0.5s",
                }}
              >
                <div className="hero-annotation-icon" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <QrCode size={16} className="text-[#10b981]" />
                </div>
                <span className="hero-annotation-label">QR Scanner for Account Access</span>
              </div>

              {/* Tag 2: Door Access — right-mid */}
              <div
                className="hero-annotation-tag"
                style={{
                  top: "35%",
                  right: "-18%",
                  animationDelay: "0.8s",
                }}
              >
                <div className="hero-annotation-icon" style={{ background: "rgba(6,78,59,0.08)" }}>
                  <DoorOpen size={16} className="text-[#064e3b]" />
                </div>
                <span className="hero-annotation-label">Door Accessed Bottle Disposal</span>
              </div>

              {/* Tag 3: Accessible — bottom-left */}
              <div
                className="hero-annotation-tag"
                style={{
                  bottom: "5%",
                  left: "-15%",
                  animationDelay: "1.1s",
                }}
              >
                <div className="hero-annotation-icon" style={{ background: "rgba(251,191,36,0.12)" }}>
                  <Users size={16} className="text-amber-600" />
                </div>
                <span className="hero-annotation-label">Accessible for the Community</span>
              </div>
            </div>

            {/* ── Overlapping Notification Card ── */}
            <div className="hero-app-card animate-[fadeInUp_0.8s_ease-out_1.4s_backwards]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Bell size={12} className="text-[#10b981]" />
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    Notification
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full"
                  style={{ fontFamily: "'Quicksand'" }}
                >
                  Just Now
                </span>
              </div>
              {/* Body */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shrink-0 shadow-sm">
                  <Coins size={20} className="text-white" />
                </div>
                <div>
                  <p
                    className="text-sm font-black text-[#064e3b] leading-tight"
                    style={{ fontFamily: "'Fredoka'" }}
                  >
                    +25 Points Added!
                  </p>
                  <p
                    className="text-[11px] font-semibold text-slate-400 mt-0.5"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    Credited to your account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming Soon Toast ── */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full bg-[#064e3b] text-white text-sm font-bold shadow-[0_10px_30px_rgba(6,78,59,0.3)] transition-all duration-500 ${showToast
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        style={{ fontFamily: "'Quicksand'" }}
      >
        🎬 Demo video coming soon!
      </div>
    </>
  );
}
