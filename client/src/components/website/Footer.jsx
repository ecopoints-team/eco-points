// Home Page
// Footer

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Mail, Facebook, Github, X, Rocket } from "lucide-react";

export default function Footer({ extraResources = [] }) {
  const footerResources = [
    ...extraResources,
    { name: "System Documentation", link: "#" },
    { name: "Research Paper", link: "#" },
    { name: "FAQs", link: "#" },
    { name: "Support / Help Center", link: "#" },
  ];

  const year = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!showComingSoon) return;
    const onKey = (e) => { if (e.key === "Escape") setShowComingSoon(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showComingSoon]);

  const handlePlaceholderClick = useCallback((e) => {
    e.preventDefault();
    setShowComingSoon(true);
  }, []);

  return (
    <>
      <footer
        ref={footerRef}
        id="footer"
        className="bg-emerald-950 text-emerald-50 pt-20 pb-10 px-6 lg:px-12 mt-auto relative overflow-hidden rounded-t-[2.5rem] lg:rounded-t-[4rem]"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[100px] -translate-x-1/2 rounded-full pointer-events-none" />

        {/* Ghost Watermark */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[20%] text-[18vw] font-black text-white/[0.02] pointer-events-none tracking-tighter leading-none z-0 font-headline select-none">
          ECOPOINTS
        </div>

        {/* Main Grid */}
        <div
          className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 relative z-10 transition-all duration-1000 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Column 1 — Brand */}
          <div className="flex flex-col items-start">
            <a href="#home" className="flex items-center gap-2 mb-4 group">
              <img
                src="/ecopoints-primary-logo-light.png"
                alt="EcoPoints Logo"
                className="h-12 w-auto transform group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]"
              />
            </a>
            <p className="text-emerald-200/80 text-sm leading-relaxed max-w-sm font-body">
              A smart recycling initiative powered by technology and
              sustainability. Empowering students and communities through
              incentivized waste management.
            </p>
          </div>

          {/* Column 2 — Resources */}
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
              Resources
              <div className="h-px bg-emerald-800/50 flex-1 ml-2 hidden md:block" />
            </h3>
            <ul className="flex flex-col gap-4">
              {footerResources.map((resource) => (
                <li key={resource.name}>
                  <a
                    href={resource.link}
                    onClick={resource.link === "#" ? handlePlaceholderClick : undefined}
                    className="text-emerald-200/80 hover:text-white hover:translate-x-1 inline-block transition-all text-sm font-medium font-body"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact Developers */}
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
              Contact Developers
              <div className="h-px bg-emerald-800/50 flex-1 ml-2 hidden md:block" />
            </h3>
            <p className="text-emerald-200/80 text-sm mb-4 font-body">
              Reach out for collaboration or inquiries:
            </p>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-emerald-200/80 font-body">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <span className="hidden xl:inline">PUP - Institute of Technology, Manila</span>
                  <span className="xl:hidden">PUP - ITECH, Manila</span>
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-emerald-200/80 font-body">
                <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                <a
                  href="mailto:team8.ecopoints@gmail.com"
                  className="hover:text-white transition-colors break-all"
                >
                  team8.ecopoints@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 — Follow Us */}
          <div className="flex flex-col">
            <h3 className="font-headline font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
              Follow Us
              <div className="h-px bg-emerald-800/50 flex-1 ml-2 hidden lg:block" />
            </h3>
            <p className="text-emerald-200/80 text-sm mb-4 font-body">
              Stay updated with our latest features:
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                onClick={handlePlaceholderClick}
                className="w-10 h-10 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                aria-label="Github"
                onClick={handlePlaceholderClick}
                className="w-10 h-10 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-800/50 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 w-full">
          <p className="text-emerald-400/60 text-xs text-center md:text-left font-body">
            &copy; {year} EcoPoints. A PUP Institute of Technology Research Project. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-emerald-400/60 font-body">
            <a href="#" onClick={handlePlaceholderClick} className="hover:text-emerald-200 transition-colors">Privacy Policy</a>
            <a href="#" onClick={handlePlaceholderClick} className="hover:text-emerald-200 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowComingSoon(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-sm bg-emerald-950 border border-emerald-800/60 rounded-3xl p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow decoration */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 blur-[60px] rounded-full pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setShowComingSoon(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-900/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400 hover:text-white hover:bg-emerald-800 transition-all duration-200 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="relative z-10 mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-400/10 border border-emerald-700/40 flex items-center justify-center mb-5">
              <Rocket className="w-8 h-8 text-emerald-400" />
            </div>

            {/* Text */}
            <h2 className="font-headline font-bold text-white text-2xl mb-2 relative z-10">
              Coming Soon
            </h2>
            <p className="font-body text-emerald-200/70 text-sm leading-relaxed mb-6 relative z-10">
              We&apos;re working hard to bring this feature to you. Stay tuned for updates!
            </p>

            {/* CTA button */}
            <button
              onClick={() => setShowComingSoon(false)}
              className="relative z-10 px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-body font-bold text-sm rounded-full hover:from-emerald-500 hover:to-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all duration-300 cursor-pointer border-none"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
