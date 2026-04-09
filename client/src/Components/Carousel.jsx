// Home Page
// Rewards Section

"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Zap } from "lucide-react";

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

          // Coasting marquee logic (Only when idle)
          if (!dragState.current.isDragging && !dragState.current.isHovered) {
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

  return (
    <section id="rewards" className="min-h-screen py-24 relative overflow-hidden w-full flex flex-col justify-center">
      {/* Background glow blobs */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#10b981]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#34d399]/10 blur-3xl" />

      <div className="relative w-full z-10">

        <div className="max-w-[1200px] mx-auto px-6 md:px-12 mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 text-center md:text-left">
            <div className="flex flex-col items-center md:items-start w-full md:w-auto">
              <div className="inline-flex items-center gap-2 mb-4 px-5 py-2 rounded-full bg-[rgba(16,185,129,0.1)]">
                <span className="text-[#10b981] text-[0.95rem] font-bold uppercase tracking-[0.1em]">
                  Redeem Points
                </span>
              </div>
              <h2 className="text-[clamp(2rem,4vw,4.5rem)] font-black text-white mb-4 leading-tight tracking-tight">
                Rewards Catalog
              </h2>
              <p className="text-white/70 font-medium text-lg md:text-xl max-w-xl">
                Exchange your hard-earned points for eco-friendly products, school supplies, and exclusive merchandise.
              </p>
            </div>

            {/* Alert Button */}
            <button
              onClick={() => alert("Redirecting to full Rewards Page...")}
              className="px-8 py-5 bg-gradient-to-r from-[#10b981] to-[#34d399] border-none text-white font-bold text-lg rounded-full hover:-translate-y-1 shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)] transition-all duration-400 inline-flex items-center gap-2 shrink-0 w-full md:w-auto justify-center group"
            >
              Browse All Rewards <ArrowUpRight size={20} className="text-white group-hover:rotate-45 transition-transform" />
            </button>
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

                <div className="bg-white rounded-[25px] p-6 pt-16 border-2 border-transparent shadow-[0_5px_20px_rgba(0,0,0,0.05)] hover:border-[#34d399]/30 hover:-translate-y-[15px] hover:shadow-[0_25px_60px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col h-full relative select-none">

                  {/* Illusion Art Image Container */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-4 group-hover:scale-110 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <span className="text-7xl drop-shadow-md transition-all duration-500 hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.15)]">
                      {product.image}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="text-center mb-6 flex-grow pt-4 pointer-events-none">
                    <div className="text-[10px] font-black text-[#10b981] tracking-widest uppercase mb-2">
                      {product.category}
                    </div>
                    <h3 className="font-extrabold text-[1.4rem] text-[#064e3b] mb-2">{product.name}</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed">{product.desc}</p>
                  </div>

                  {/* Corresponding Points Needed */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center pointer-events-none px-2">
                      <span className="font-bold text-slate-400 text-xs uppercase tracking-wider">Cost</span>
                      <div className="font-black font-mono text-[1.5rem] bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent flex items-center gap-1">
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
