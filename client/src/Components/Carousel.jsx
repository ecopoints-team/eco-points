// Home Page
// Rewards Section

"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Zap, Leaf, Cloud, Sparkles } from "lucide-react";
import Link from "next/link";

const fonts = {
  heading: { fontFamily: "'Fredoka', sans-serif" },
  body: { fontFamily: "'Quicksand', sans-serif" },
};

// Mock Data
const SHOWCASE_PRODUCTS = [
  { id: 1, category: "Writing", name: "Eco Pencil", desc: "Made from 100% recycled newspaper. Plantable tip.", points: 50, image: "✏️" },
  { id: 2, category: "Notes", name: "Bamboo Notebook", desc: "Sustainable bamboo cover with recycled pages.", points: 150, image: "📓" },
  { id: 3, category: "Carry", name: "Canvas Tote Bag", desc: "Durable, everyday tote for your groceries.", points: 300, image: "🛍️" },
  { id: 4, category: "Drink", name: "Steel Tumbler", desc: "Keep drinks hot or cold for up to 12 hours.", points: 500, image: "🥤" },
  { id: 5, category: "Tech", name: "Bamboo USB", desc: "Eco-friendly 16GB flash drive.", points: 800, image: "💾" },
];

export default function Carousel() {
  const carouselRef = useRef(null);
  const dragState = useRef({ isDragging: false, isHovered: false, startX: 0, scrollLeft: 0 });
  const [isDraggingUI, setIsDraggingUI] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const sectionHeaderRef = useRef(null);

  const handleMouseEnter = () => {
    dragState.current.isHovered = true;
  };

  const handleMouseDown = (e) => {
    dragState.current.isDragging = true;
    dragState.current.startX = e.pageX - carouselRef.current.offsetLeft;
    dragState.current.scrollLeft = carouselRef.current.scrollLeft;
    setIsDraggingUI(true);
  };

  const handleMouseLeave = () => {
    dragState.current.isHovered = false;
    dragState.current.isDragging = false;
    setIsDraggingUI(false);
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
    setIsDraggingUI(false);
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5; // Smoother tracking multiplier
    // Use Math.max or exact translation
    carouselRef.current.scrollLeft = dragState.current.scrollLeft - walk;
  };

  // Auto-scroll logic (Frame decoupled from React state)
  useEffect(() => {
    let animationId;
    let exactScroll = -1;
    let setWidth = 0;

    const autoScroll = () => {
      // Must have enough elements mounted
      if (carouselRef.current && carouselRef.current.children.length > SHOWCASE_PRODUCTS.length) {

        // Dynamically measure exact pixel width of 1 complete repetition set
        if (setWidth === 0) {
          const firstChild = carouselRef.current.children[0];
          const secondSetChild = carouselRef.current.children[SHOWCASE_PRODUCTS.length];
          // Geometric center point immune to layout CSS differences
          setWidth = secondSetChild.offsetLeft - firstChild.offsetLeft;

          if (setWidth > 0) {
            // Jump scrollbar instantly into the middle of the large buffer
            carouselRef.current.scrollLeft = setWidth * 4;
            exactScroll = setWidth * 4;
          }
        }

        if (setWidth > 0) {
          const currentScroll = carouselRef.current.scrollLeft;

          // Bi-directional infinite scroll logic (Always active, even when manually scrolling)
          if (currentScroll <= setWidth * 2) {
            carouselRef.current.scrollLeft = currentScroll + setWidth;
            exactScroll = currentScroll + setWidth;
          }
          else if (currentScroll >= setWidth * 6) {
            carouselRef.current.scrollLeft = currentScroll - setWidth;
            exactScroll = currentScroll - setWidth;
          }

          // Coasting marquee logic (Only when not dragging)
          if (!dragState.current.isDragging) {
            // Sync up fractional math with any native touchpad events
            if (Math.abs(exactScroll - carouselRef.current.scrollLeft) > 5) {
              exactScroll = carouselRef.current.scrollLeft;
            }
            exactScroll += 0.8;
            carouselRef.current.scrollLeft = exactScroll;
          }
        }
      }
      animationId = requestAnimationFrame(autoScroll);
    };

    animationId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Header entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHeaderVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionHeaderRef.current) observer.observe(sectionHeaderRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="rewards" className="min-h-screen py-24 relative overflow-hidden w-full flex flex-col justify-center bg-[#f0fdf4]/30">
      {/* Background glow blobs & floating elements */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#34d399]/10 blur-3xl" />
      <Leaf className="pointer-events-none absolute left-10 top-24 h-12 w-12 text-emerald-400 opacity-20 -rotate-45" />
      <Leaf className="pointer-events-none absolute right-24 bottom-32 h-10 w-10 text-emerald-500 opacity-15 rotate-12" />
      <Cloud className="pointer-events-none absolute right-1/4 top-16 h-16 w-16 text-emerald-400 opacity-10" />
      <Sparkles className="pointer-events-none absolute left-1/4 bottom-1/4 h-8 w-8 text-teal-400 opacity-20" />

      <div className="relative w-full z-10">

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">
        <div
          ref={sectionHeaderRef}
          className={`flex flex-col md:flex-row justify-between items-end gap-6 text-center md:text-left transition-all duration-700 ease-out ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
            <div className="flex flex-col items-center md:items-start w-full md:w-auto">
              <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-[rgba(16,185,129,0.1)]">
                <span className="text-[#10b981] text-[0.95rem] font-bold uppercase tracking-[0.1em]">
                  Redeem Points
                </span>
              </div>
              <h2
                className="text-[clamp(2rem,4vw,4.5rem)] font-black text-[#064e3b] mb-4 leading-tight tracking-tight"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Rewards <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">Catalog</span>
              </h2>
              <p
                className="text-[#6b7280] font-medium text-lg md:text-xl max-w-xl"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Exchange your hard-earned points for eco-friendly products, school supplies, and exclusive merchandise.
              </p>
            </div>

            {/* Alert Button */}
            <Link
              href="/rewards"
              className="px-8 py-5 bg-[#064e3b] border-none text-white font-bold text-lg rounded-full hover:-translate-y-1 shadow-[0_10px_20px_rgba(6,78,59,0.2)] hover:shadow-[0_15px_30px_rgba(6,78,59,0.3)] transition-all duration-500 inline-flex items-center gap-2 shrink-0 w-full md:w-auto justify-center group overflow-hidden relative"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#10b981] to-[#34d399] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center gap-2">Browse All Rewards <ArrowUpRight size={20} className="text-white group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" /></span>
            </Link>
          </div>
        </div>

        {/* Auto-scrolling Carousel */}
        <div className="w-full relative px-0">
          <div
            ref={carouselRef}
            className="flex overflow-x-auto hide-scrollbar pt-20 pb-8 w-full"
            style={{ cursor: isDraggingUI ? 'grabbing' : 'grab', scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'auto' }}
            onMouseEnter={handleMouseEnter}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {/* Scale array 10x to effortlessly swallow any widescreen monitor's right boundary logic */}
            {Array(10).fill(SHOWCASE_PRODUCTS).flat().map((product, idx) => (
              <div key={`${product.id}-${idx}`} className="relative group shrink-0 w-[264px] md:w-[304px] pr-6">

                <div className="bg-white rounded-[30px] p-6 pt-20 border-2 border-emerald-50 shadow-[0_10px_30px_rgba(16,185,129,0.05)] hover:border-emerald-200 hover:-translate-y-[10px] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] transition-all duration-700 ease-out flex flex-col h-full relative select-none group/card z-10">

                  {/* Decorative background shape in card (clipped) */}
                  <div className="absolute inset-0 overflow-hidden rounded-[30px] pointer-events-none z-0">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-full group-hover/card:scale-[2.5] transition-transform duration-700 ease-out opacity-50" />
                  </div>

                  {/* Illusion Art Image Container */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/card:-translate-y-4 group-hover/card:scale-110 pointer-events-none z-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#10b981] to-[#34d399] rounded-full blur-xl opacity-30 group-hover/card:opacity-50 transition-opacity duration-700"></div>
                    <div className="absolute inset-2 bg-gradient-to-br from-white to-emerald-50 rounded-full shadow-inner flex items-center justify-center border border-white/60">
                      <span className="text-5xl drop-shadow-sm transition-all duration-700 group-hover/card:drop-shadow-[0_10px_15px_rgba(16,185,129,0.3)] group-hover/card:scale-110">
                        {product.image}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="text-center mb-6 flex-grow pt-4 pointer-events-none z-10">
                    <div className="text-[10px] font-black text-[#10b981] tracking-widest uppercase mb-3 px-3 py-1 bg-emerald-50/80 inline-block rounded-full backdrop-blur-sm">
                      {product.category}
                    </div>
                    <h3 className="font-extrabold text-[1.4rem] text-[#064e3b] mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>{product.name}</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed" style={{ fontFamily: "'Quicksand', sans-serif" }}>{product.desc}</p>
                  </div>

                  {/* Corresponding Points Needed */}
                  <div className="pt-4 border-t border-emerald-50 flex flex-col gap-3 z-10 w-full">
                    <div className="flex justify-between items-center pointer-events-none px-2 w-full">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover/card:bg-emerald-500 group-hover/card:text-white transition-colors duration-500 shrink-0">
                        <Zap size={18} className="group-hover/card:scale-110 transition-transform" />
                      </div>
                      <div className="font-black font-mono text-[1.5rem] bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent flex items-center gap-1 group-hover/card:scale-105 transition-transform duration-500 ml-auto p-1 overflow-visible">
                        {product.points.toLocaleString()} <span className="text-xs text-[#10b981] font-sans ml-0.5">EP</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
