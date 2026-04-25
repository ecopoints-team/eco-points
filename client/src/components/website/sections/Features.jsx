// Home Page
// Features Section

"use client";

import {
  ScanEye,
  HandshakeIcon,
  ScanQrCode,
  MonitorCloud,
  Recycle,
  Cloud,
} from "lucide-react";

import React, { useEffect, useRef, useState } from "react";

const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
};

export default function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="py-32 px-4 md:px-8 relative z-10 bg-[#f0fdf4]/80 overflow-hidden"
    >

      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-20 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <span
            className="inline-block text-[#10b981] text-[0.95rem] font-bold uppercase tracking-[0.1em] mb-4 px-6 py-2 bg-[rgba(16,185,129,0.1)] rounded-full"
            style={fonts.body}
          >
            Platform Features
          </span>
          <h2
            className="text-[clamp(2rem,5vw,4.5rem)] font-black mb-6 text-[#064e3b]"
            style={fonts.heading}
          >
            Everything You Need to{" "}
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
              Recycle Smarter
            </span>
          </h2>
          <p
            className="text-xl text-[#6b7280] max-w-[700px] mx-auto leading-relaxed"
            style={fonts.body}
          >
            Our smart recycling bin combines cutting-edge technology to make
            recycling easier, rewarding, and more efficient.
          </p>
        </div>

        {/* BENTO GRID — ported from featuresample.jsx */}
        <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[280px] gap-6">
          {/* Card 1: Vision System (2col, 1row) — Dark with scanning animation */}
          <div
            className={`md:col-span-2 md:row-span-1 bg-[#064e3b] rounded-[30px] p-8 md:p-10 relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(6,78,59,0.4)] transition-all duration-700 ease-out ${isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
              }`}
            style={{ transitionDelay: "0.1s" }}
          >
            {/* Scanning line animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[30px]">
              <div className="absolute left-0 w-full h-[3px] bg-emerald-400 shadow-[0_0_25px_4px_#34d399] animate-[scanLine_3s_ease-in-out_infinite]" />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-[350px] h-[350px] text-emerald-500 opacity-20 transition-transform duration-700 group-hover:scale-105"
                viewBox="0 0 100 100"
                fill="currentColor"
              >
                <path d="M30 10 h40 v15 l10 10 v55 h-60 v-55 l10 -10 z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full text-white gap-8">
              <div className="flex-1 w-full text-center md:text-left">
                <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 text-emerald-300 border border-emerald-400/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl mx-auto md:mx-0">
                  <ScanEye className="w-8 h-8" />
                </div>
                <h3
                  className="text-3xl md:text-4xl font-black mb-2"
                  style={fonts.heading}
                >
                  Vision System
                </h3>
              </div>
              <div className="flex-1 w-full bg-[#022c22]/40 p-6 rounded-2xl backdrop-blur-md border border-white/5">
                <ul className="space-y-4">
                  {[
                    "Intelligent sensors verify valid PET bottles.",
                    "Rejects non-plastic or invalid items.",
                    "Prevents contamination in the bin.",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-emerald-100/90 text-sm md:text-base"
                      style={fonts.body}
                    >
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_8px_#34d399]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: User Friendly (1x1) — White with animated user flow path */}
          <div
            className={`md:col-span-1 md:row-span-1 bg-white border-2 border-emerald-50 rounded-[30px] p-8 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-700 ease-out ${isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
              }`}
            style={{ transitionDelay: "0.2s" }}
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out opacity-50" />

            {/* Animated user flow SVG */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-700">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <path d="M -10 80 C 30 80, 20 20, 60 20 C 80 20, 90 60, 120 60" fill="none" stroke="#d1fae5" strokeWidth="4" strokeDasharray="6 6" strokeLinecap="round" />
                <circle cx="120" cy="60" r="6" fill="#fff" stroke="#10b981" strokeWidth="3" />
                <circle cx="60" cy="20" r="4" fill="#fff" stroke="#10b981" strokeWidth="2" />
                <g className="drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
                  <circle r="6" fill="#10b981">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M -10 80 C 30 80, 20 20, 60 20 C 80 20, 90 60, 120 60" />
                  </circle>
                  <circle r="2" fill="#fff">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M -10 80 C 30 80, 20 20, 60 20 C 80 20, 90 60, 120 60" />
                  </circle>
                </g>
              </svg>
            </div>

            <div className="relative z-10 flex flex-col h-full justify-center">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-sm group-hover:rotate-12 transition-all duration-300 relative">
                <HandshakeIcon className="w-7 h-7 relative z-10" />
                <div className="absolute inset-0 bg-emerald-300 rounded-xl scale-0 opacity-0 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700 ease-out" />
              </div>
              <h3
                className="text-xl font-extrabold text-[#064e3b] mb-3"
                style={fonts.heading}
              >
                User-Friendly Experience
              </h3>
              <p className="text-[#6b7280] text-sm md:text-base leading-relaxed" style={fonts.body}>
                Designed with ergonomic, user-first flow. Guides users through
                recycling quickly without any prior training.
              </p>
            </div>
          </div>

          {/* Card 3: RVM (1x1) — Gradient with bottle compacting animation */}
          <div
            className={`md:col-span-1 md:row-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[30px] p-8 relative overflow-hidden group hover:shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all duration-700 ease-out ${isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
              }`}
            style={{ transitionDelay: "0.3s" }}
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white opacity-10 rotate-45 group-hover:translate-x-10 group-hover:translate-y-10 transition-transform duration-700 blur-2xl" />

            {/* Compacting animation */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-32 border-2 border-white/20 rounded-xl bg-black/20 overflow-hidden flex flex-col items-center justify-end p-2 opacity-50 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_4px_10px_rgba(0,0,0,0.3)]">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-white/40 to-transparent" />
              <div className="relative mb-2 flex flex-col items-center animate-[bottleProcess_3.5s_ease-in-out_infinite] origin-bottom z-10">
                <div className="w-3 h-1.5 bg-emerald-100 rounded-t-sm" />
                <div className="w-4 h-2 bg-white/40" />
                <div className="w-8 h-12 border border-white/60 rounded-b-md rounded-t-sm bg-white/10 backdrop-blur-sm relative overflow-hidden flex items-center justify-center">
                  <div className="absolute left-0 w-full h-[2px] bg-red-400 shadow-[0_0_8px_#f87171] animate-[laserScan_3.5s_linear_infinite]" />
                </div>
              </div>
              <div className="w-14 h-3 bg-emerald-400 mt-1 rounded-sm shadow-[0_0_12px_#34d399] z-20" />
            </div>

            <div className="relative z-10 text-white h-full flex flex-col justify-between w-[65%]">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg group-hover:-translate-y-2 transition-transform duration-300">
                <Recycle className="w-7 h-7" />
              </div>
              <div>
                <h3
                  className="text-xl md:text-2xl font-extrabold mb-2"
                  style={fonts.heading}
                >
                  RVM System
                </h3>
                <p className="text-emerald-50 text-xs md:text-sm leading-relaxed" style={fonts.body}>
                  Automates bottle sorting and compaction.
                </p>
              </div>
            </div>
          </div>

          <div
            className={`md:col-span-2 md:row-span-2 bg-[#022c22] rounded-[30px] p-8 md:p-12 relative overflow-hidden group hover:shadow-xl transition-all duration-700 ease-out ${isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
              }`}
            style={{ transitionDelay: "0.4s" }}
          >
            {/* Active Flowing Network Connections Background */}
            <div className="absolute right-0 top-0 w-full md:w-2/3 h-full opacity-30 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 150 Q 150 50 300 150 T 600 100" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="10 10">
                  <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                </path>
                <circle cx="150" cy="50" r="5" fill="#10b981" className="animate-pulse" />
                <circle cx="300" cy="150" r="8" fill="#34d399" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
                <circle cx="600" cy="100" r="6" fill="#6ee7b7" className="animate-pulse" style={{ animationDelay: "1s" }} />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col h-full gap-8">
              <div className="text-white z-10 md:w-[85%]">
                <div className="w-16 h-16 bg-emerald-900/80 rounded-xl border border-emerald-700 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                  <Cloud className="w-8 h-8" />
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4" style={fonts.heading}>
                  Web-Connected Rewards
                </h3>
                <p className="text-emerald-200/80 text-base md:text-lg max-w-xl leading-relaxed" style={fonts.body}>
                  IoT-enabled machine updates rewards instantly. Every action
                  syncs to the cloud so you can check points on your dashboard
                  anytime, tracking your environmental impact in real-time.
                </p>
              </div>

              {/* Active Dashboard Graphic */}
              <div className="flex-1 w-full flex items-end justify-center relative z-10 mt-auto">
                <div className="w-full md:w-[90%] h-48 md:h-56 bg-[#064e3b]/80 backdrop-blur-md rounded-t-[30px] border-t border-l border-r border-emerald-500/30 p-6 md:p-8 relative overflow-hidden shadow-2xl group-hover:-translate-y-4 transition-transform duration-700 flex flex-col justify-between">
                  {/* Constant Shimmer Slider */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full animate-[shimmer-slide_3s_infinite_ease-in-out]" />

                  <div className="flex justify-between items-center mb-6">
                    <div className="text-emerald-400 text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Live Sync
                    </div>
                  </div>

                  <div className="flex justify-between items-end h-32 px-2 gap-3 md:gap-6">
                    {[30, 50, 40, 80, 60, 95, 75].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-700 relative group/bar animate-pulse"
                        style={{
                          height: `${h}%`,
                          animationDelay: `${i * 150}ms`,
                        }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-[#064e3b] text-xs font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity">
                          +{h}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: QR Auth (1x1) — White with scanning frame */}
          <div
            className={`md:col-span-1 md:row-span-1 bg-white border-2 border-emerald-50 rounded-[30px] p-8 relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-emerald-200 transition-all duration-700 ease-out ${isVisible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
              }`}
            style={{ transitionDelay: "0.5s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 relative group-hover:bg-emerald-100 transition-colors duration-300">
                <ScanQrCode className="w-12 h-12 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-2 border-2 border-emerald-400 rounded-xl scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-emerald-500 opacity-0 group-hover:opacity-100 group-hover:animate-[scanLine_2s_ease-in-out_infinite] shadow-[0_0_8px_#10b981]" />
              </div>
              <h3
                className="text-xl font-extrabold text-[#064e3b] mb-3"
                style={fonts.heading}
              >
                QR Authentication
              </h3>
              <p className="text-[#6b7280] text-sm" style={fonts.body}>
                Secure, contactless login. Scan your unique ID to instantly
                access your account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}