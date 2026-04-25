// Home Page
// How It Works Section

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ScanQrCodeIcon,
  BottleWineIcon,
  CoinsIcon,
  HandCoinsIcon,
  Leaf,
  Cpu,
  Wifi,
  Zap,
} from "lucide-react";

const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const rafIdRef = useRef(null);

  // Header reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHeaderVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Step reveal with stagger
  useEffect(() => {
    const stepEls = document.querySelectorAll(".hiw-step-item");
    const observers = [];

    stepEls.forEach((el, i) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSteps((prev) => [...new Set([...prev, i])]);
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Combined scroll handler: line progress + parallax (single listener, rAF throttled, no React state)
  useEffect(() => {
    const container = document.querySelector(".hiw-steps-container");
    const techIds = ["hiw-tech-1", "hiw-tech-2", "hiw-tech-3", "hiw-tech-4"];
    const speeds = [0.08, -0.06, 0.1, -0.07];
    const techEls = techIds.map((id) => document.getElementById(id));

    const onScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        // Line progress — write directly to DOM, no setState
        if (container && lineRef.current) {
          const rect = container.getBoundingClientRect();
          const windowH = window.innerHeight;
          const start = windowH * 0.7;
          const end = windowH * 0.3;
          const total = rect.height + start - end;
          const scrolled = start - rect.top;
          const progress = Math.min(Math.max(scrolled / total, 0), 1);
          lineRef.current.style.height = `${progress * 100}%`;
        }

        // Parallax tech icons
        if (sectionRef.current) {
          const offset = sectionRef.current.getBoundingClientRect().top;
          techEls.forEach((el, i) => {
            if (!el) return;
            const s = speeds[i];
            el.style.transform = `translate3d(${offset * s * 0.5}px, ${offset * s}px, 0)`;
          });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const steps = [
    {
      icon: <ScanQrCodeIcon className="w-7 h-7 text-emerald-600" />,
      num: "01",
      title: "Scan QR Code",
      desc: "Authenticate instantly with your unique QR code at the machine.",
    },
    {
      icon: <BottleWineIcon className="w-7 h-7 text-emerald-600" />,
      num: "02",
      title: "Insert Bottle",
      desc: "Place your clean PET bottle for automated material verification.",
    },
    {
      icon: <CoinsIcon className="w-7 h-7 text-emerald-600" />,
      num: "03",
      title: "Earn Points",
      desc: "Receive 10 points instantly credited to your digital wallet.",
    },
    {
      icon: <HandCoinsIcon className="w-7 h-7 text-emerald-600" />,
      num: "04",
      title: "Redeem Rewards",
      desc: "Browse our catalog and redeem items with your hard-earned points.",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-32 px-4 md:px-8 relative z-10 overflow-hidden bg-white/80"
    >
      {/* Parallax futuristic tech decorations */}
      <div
        id="hiw-tech-1"
        className="pointer-events-none absolute top-20 left-8 text-emerald-400/15 will-change-transform"
      >
        <Cpu size={60} />
      </div>
      <div
        id="hiw-tech-2"
        className="pointer-events-none absolute top-1/3 right-10 text-emerald-500/10 will-change-transform"
      >
        <Wifi size={80} />
      </div>
      <div
        id="hiw-tech-3"
        className="pointer-events-none absolute bottom-32 left-16 text-emerald-400/10 will-change-transform"
      >
        <Zap size={50} />
      </div>
      <div
        id="hiw-tech-4"
        className="pointer-events-none absolute bottom-20 right-20 will-change-transform"
      >
        <Leaf size={70} className="text-emerald-400/10" fill="currentColor" />
      </div>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-24 md:mb-32 transition-all duration-1000 ease-out ${headerVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
            }`}
        >
          <span
            className="inline-block text-[#10b981] text-sm font-bold uppercase tracking-[0.2em] mb-4 px-6 py-2 bg-[rgba(16,185,129,0.08)] backdrop-blur-md border border-[rgba(16,185,129,0.2)] rounded-full"
            style={fonts.body}
          >
            The Journey
          </span>
          <h2
            className="text-[clamp(2.5rem,6vw,5rem)] font-black mb-6 text-[#064e3b] tracking-tight leading-none"
            style={fonts.heading}
          >
            How It{" "}
            <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p
            className="text-xl text-[#6b7280] max-w-[600px] mx-auto font-medium leading-relaxed"
            style={fonts.body}
          >
            A seamless experience designed for a sustainable campus life.
          </p>
        </div>

        {/* Steps with vertical timeline */}
        <div className="hiw-steps-container relative">
          {/* Vertical Progress Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-100 hidden md:block -translate-x-1/2 rounded-full overflow-hidden">
            <div
              ref={lineRef}
              className="w-full bg-gradient-to-b from-[#10b981] via-[#34d399] to-[#059669] rounded-full"
              style={{
                height: "0%",
                transition: "height 0.1s linear",
              }}
            />
          </div>

          <div className="space-y-20 md:space-y-32">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              const isVisible = visibleSteps.includes(i);

              return (
                <div
                  key={i}
                  className={`hiw-step-item flex flex-col ${isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    } items-center gap-8 md:gap-24 relative`}
                >
                  {/* Step Number Circle with icon on the line */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-4 border-[#10b981] rounded-full hidden md:flex flex-col items-center justify-center z-20 shadow-lg">
                    <div className="mb-0.5">{step.icon}</div>
                  </div>

                  {/* Content side — Title only outside */}
                  <div
                    className={`flex-1 ${isLeft ? "md:text-right" : "md:text-left"
                      } w-full transition-all duration-1000 ease-out ${isVisible
                        ? "opacity-100 translate-x-0"
                        : isLeft
                          ? "opacity-0 -translate-x-20"
                          : "opacity-0 translate-x-20"
                      }`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    {/* Mobile icon */}
                    <div className="md:hidden w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      {step.icon}
                    </div>
                    <h3
                      className="text-2xl md:text-3xl font-black text-[#064e3b] mb-2"
                      style={fonts.heading}
                    >
                      {step.title}
                    </h3>
                    <span
                      className="text-sm font-black text-emerald-400 tracking-widest"
                      style={fonts.data}
                    >
                      Step {step.num}
                    </span>
                  </div>

                  {/* Card side — description slides in from icon, fills white space */}
                  <div
                    className={`flex-1 hidden md:block transition-all duration-1000 ease-out ${isVisible
                        ? "opacity-100 translate-x-0"
                        : isLeft
                          ? "opacity-0 translate-x-20"
                          : "opacity-0 -translate-x-20"
                      }`}
                    style={{ transitionDelay: `${i * 150 + 200}ms` }}
                  >
                    <div className="w-full bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[24px] shadow-xl p-8 group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden">
                      {/* Futuristic grid pattern inside card */}
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <svg width="100%" height="100%">
                          <defs>
                            <pattern
                              id={`hiw-grid-${i}`}
                              width="20"
                              height="20"
                              patternUnits="userSpaceOnUse"
                            >
                              <path
                                d="M 20 0 L 0 0 0 20"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="0.5"
                              />
                            </pattern>
                          </defs>
                          <rect
                            width="100%"
                            height="100%"
                            fill={`url(#hiw-grid-${i})`}
                          />
                        </svg>
                      </div>

                      {/* Glowing accent dot */}
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />

                      {/* Step number watermark */}
                      <div
                        className="absolute bottom-2 right-4 text-5xl font-black text-slate-100 select-none"
                        style={fonts.data}
                      >
                        {step.num}
                      </div>

                      {/* Content that slides in */}
                      <div className="relative z-10">
                        <p
                          className="text-base md:text-lg text-[#6b7280] font-medium leading-relaxed"
                          style={fonts.body}
                        >
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile description */}
                  <div
                    className={`md:hidden transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                      }`}
                  >
                    <p
                      className="text-base text-[#6b7280] text-center leading-relaxed"
                      style={fonts.body}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
