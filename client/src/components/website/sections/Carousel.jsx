// Home Page
// Rewards Section

"use client";

import { useRef, useState, useEffect } from "react";
import { Zap } from "lucide-react";

const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
};

// Mock Data
const SHOWCASE_PRODUCTS = [
  { id: 1, category: "Writing", name: "Eco Pencil", desc: "Made from 100% recycled newspaper. Plantable tip.", points: 50, image: "/eco_pencil_new.png" },
  { id: 2, category: "Lifestyle", name: "Eco-Friendly Tote Bag", desc: "Heavy-duty organic cotton tote designed for your daily campus essentials and grocery runs.", points: 200, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdRIyelRvj7UQf66B2WW1yPfHo9iQgNBraqUvxP9otyaYR_1fIJpLZVSKB_ZNGQ5QnZxQbt7gUSqcwHA-1HrkSsjzlzgweiS9a014-AgQFf5MpXDWVXi7aWNRXw27wcOM06Ic0K3c7pKVHHEIOZ_0k5fFimASRzWfMiaJQIgiUBAJmLnK9PdEnFJZ7dkaNPlE2vDyhsKriHuUmhLOkUB-jrMBSvCg_YWrtfRVhMYcH_ZWV6MOB5Y1qq0XGeIQQ9I7P-38q5C3u6wkd" },
  { id: 3, category: "Notes", name: "Bamboo Notebook", desc: "Sustainable bamboo cover with recycled pages.", points: 150, image: "/bamboo_notebook_new.png" },
  { id: 4, category: "Lifestyle", name: "Bamboo Straw Set", desc: "Natural, biodegradable, and reusable straws with a travel pouch for zero-waste sipping.", points: 100, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD0ZqC6jlwFwCJcs0ylje_QL2PrMLldMwKNXbkRbae-ORGeEh6KjnTQz5DylUzNvyu3AQZMpI-6jiMvRMTjVgp-Cv9cCbhJ-L689sHHcs4o0Fi3EZf-KYZSzAyTO_9u1n0LAWT8QJFZ_0AAYO0cspEd_05ID21TNv4NNdrhNjrjDC5AEZgeN8hjAYR_EqctGGOkFb73qv3GElXAM0gdjTKc2TY0VU0cPSc_Fz_WuT3BreTaO710IVD4vRwRdzJYi9fMrrvlqztS-wkl" },
  { id: 5, category: "Eco-Wear", name: "Sticker Pack", desc: "Express your sustainability values with this collection of recycled vinyl stickers.", points: 50, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzhy_bpix0ejS2xSUe3pjiSjsOd7NrmcG0UZLcPwA_SV7MZrIUJ6QwdHavFki1uLFeZ9NpXtFJSweES7l_XgkyF-FO0-p5RmEBOwSm24dp4mhTGJjwqh8pSEAV17a9VSD7IhtHv1qNu8n9_R6WmLR5sIyxixT5TFuA9YTKAQzH86gMRvLMUtv_Qi_L9phX0Svn-yw8BJxkavxoD7SnUiF6Jzs6enV6qJKFFda4_4gbQCz3zWX0F2hkt_xp14q-pmImxqd-mWm9gy4X" },
  { id: 6, category: "Lifestyle", name: "Reusable Coffee Cup", desc: "Barista-standard glass and cork cup. Keep your coffee warm and the planet cool.", points: 250, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBRCRprsbEsVZ1koaWgdDhyUhBTXkJS8HMZPCpILR9Icy5rOSNWxQM3XLzBn7NWKCVEXdMTaWg6d0zcR9z12qEqjEhDeJHDXDNnecujL_qT23_l1kHLWu-5Qhj52ebbP_yvmizmZdUA2JUvrFX7Uo27QEIFC-G0rl-5eGlnvOa2epCCA3afRxf5Ed1bNByNnx6qb75nobdwG8giYAnqpSCqstP6FmPZ5acBO_A9sRWtAmKibxPH3EqzwFTh4ANJhdD2UIeVsIIj_B_W" },
  { id: 7, category: "Lifestyle", name: "Hemp Backpack", desc: "Sustainable hemp fibers make this the most durable and carbon-neutral bag on campus.", points: 500, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAb3TLf6_Gl0Okbd2b1pOIbUQsAwe9GJxAEoARg78ylCmr2dlr2I4LSW3p6cugXZla27cHv6F4avJ_pIvr83gsRILPtsvtemVCQ3KwXLURkIIOnv6q3LYtpzBZQxljnyuf8suY8eXOGT4NvCs17GkDrGXDCNMeWv2P7R-bDr1mTe8ugwMALaSLJdti8IW95fwocSiWwxryYgKsHzymKdfPyopPcu0N6F1n-8MymuyRWDdfTtfpSug1vhYdwpvrzjQ9bctLff6O4F_cZ" },
  { id: 8, category: "Drink", name: "Steel Tumbler", desc: "Keep drinks hot or cold for up to 12 hours.", points: 500, image: "/steel_water_tumbler_logo.png" },
  { id: 9, category: "Tech", name: "Biodegradable Phone Case", desc: "Made from flax straw waste. Protect your phone and the earth at the same time.", points: 350, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFhLV4YnUIdu6zNIxFQ1RlLhMYN0k9_dRnaoEjqhQ8MCt1AjwNEQk5NA2-w-NrXFQCvHxREZLFFeP24rO5vOa4s1VrfbbZoFtDbdA1HvdQOXUh5iPa_uEDIILCRQZARujeXvid5LbHaBegzhMoxxxC28CyBHsLKPMwg968YN3KMA79i7uYQLopVYFMOU2bVYNIDbdzSyJgsLdveOATXK1sVHxMmPiMaM-2gG30fd_P_y9Wz4F0eaXO5YusesUEPp7Jkl1ayclRGrTp" },
  { id: 10, category: "Tech", name: "Bamboo USB", desc: "Eco-friendly 16GB flash drive.", points: 800, image: "/bamboo_usb_new.png" },
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
                style={{ fontFamily: "'Fredoka'" }}
              >
                Rewards <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">Catalog</span>
              </h2>
              <p
                className="text-[#6b7280] font-medium text-lg md:text-xl max-w-xl"
                style={{ fontFamily: "'Quicksand'" }}
              >
                Exchange your hard-earned points for eco-friendly products, school supplies, and exclusive merchandise.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-scrolling Carousel */}
        <div className="w-full relative px-0">
          <div
            ref={carouselRef}
            className="flex overflow-x-auto hide-scrollbar pt-32 pb-12 w-full"
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
                    <div className="absolute inset-2 bg-gradient-to-br from-white to-emerald-50 rounded-full shadow-inner flex items-center justify-center border border-white/60 overflow-hidden">
                      {product.image.startsWith('http') || product.image.startsWith('/') ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                      ) : (
                        <span className="text-5xl drop-shadow-sm transition-all duration-700 group-hover/card:drop-shadow-[0_10px_15px_rgba(16,185,129,0.3)] group-hover/card:scale-110">
                          {product.image}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="text-center mb-6 flex-grow pt-4 pointer-events-none z-10">
                    <div className="text-[10px] font-black text-[#10b981] tracking-widest uppercase mb-3 px-3 py-1 bg-emerald-50/80 inline-block rounded-full backdrop-blur-sm">
                      {product.category}
                    </div>
                    <h3 className="font-extrabold text-[1.4rem] text-[#064e3b] mb-2" style={{ fontFamily: "'Fredoka'" }}>{product.name}</h3>
                    <p className="text-sm text-[#6b7280] leading-relaxed" style={{ fontFamily: "'Quicksand'" }}>{product.desc}</p>
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
