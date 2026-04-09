"use client";

import { useState, useEffect, useRef } from "react";
import { Leaf, Wind, ArrowUp } from "lucide-react";

export default function CTASection({ onLoginClick }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-32 px-4 md:px-8 relative z-10 transition-all duration-1000 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
    >
      <div className="max-w-[1200px] mx-auto relative group">
        {/* Glow Effect behind the card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-[#064e3b] rounded-[3rem] p-12 md:p-24 text-center overflow-hidden border border-emerald-500/30 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" width="100%" height="100%">
              <defs>
                <pattern
                  id="grid-pattern"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>

          {/* Animated Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-[pulse_6s_ease-in-out_infinite]"></div>
          <div
            className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-[pulse_5s_ease-in-out_infinite]"
            style={{ animationDelay: "1s" }}
          ></div>

          {/* Floating Decoration Icons */}
          <div className="absolute top-10 left-10 opacity-10 animate-[ctaFloat_8s_ease-in-out_infinite]">
            <Leaf size={80} className="text-white" />
          </div>
          <div
            className="absolute bottom-10 right-10 opacity-10 animate-[ctaFloat_10s_ease-in-out_infinite]"
            style={{ animationDelay: "2s" }}
          >
            <Wind size={100} className="text-white" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-sm font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Join the Movement
            </div>

            <h2
              className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Don&apos;t Just Recycle. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Get Rewarded for It.
              </span>
            </h2>

            <p
              className="text-emerald-100/80 text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Every bottle counts. Turn your daily waste into exclusive rewards,
              cafeteria vouchers, and school supplies.
            </p>

            <button
              onClick={() => onLoginClick?.()}
              className="group relative px-12 py-6 bg-white text-[#064e3b] font-black text-xl rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300 overflow-hidden cursor-pointer"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:animate-[shimmer-slide_1s_infinite]"></div>
              <span className="relative flex items-center gap-3">
                Create Free Account
                <ArrowUp
                  className="rotate-45 group-hover:rotate-90 transition-transform duration-300"
                  size={28}
                  strokeWidth={3}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
