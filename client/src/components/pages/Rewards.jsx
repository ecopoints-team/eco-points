"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDebounce } from "../../utils/useDebounce";
import Link from "next/link";
import HowItWorksModal from "../shared/HowItWorksModal";
import {
  Search, Filter, ArrowRight, ArrowLeft, Sparkles, X, UserCircle,
  ShoppingBag, Zap, Cpu, Leaf, Droplet, Coffee, Tag, ChevronLeft, ChevronRight,
  CheckCircle2, Lock, HelpCircle, Settings, Loader2, Ticket
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/apiService";

// --- PRODUCT DATA (30 Products) ---
// Images from /Rewards/ folder for 5 products; Lucide icons for the rest
// --- PRODUCT DATA ---
// Mock data removed in favor of API fetching

const ITEMS_PER_PAGE = 20;

// --- REWARDS HEADER ---
function RewardsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border-b border-[#10b981]/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center gap-4">

        {/* Left: Back to Home */}
        <div className="flex-1">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-[#064e3b] hover:bg-[#10b981]/5 transition-all duration-300"
          >
            <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="text-xs font-bold tracking-widest uppercase hidden sm:inline" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Back to Home
            </span>
          </Link>
        </div>

        {/* Center: Page Title */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <h1 className="text-[#064e3b] text-lg sm:text-xl font-black tracking-widest uppercase" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Rewards
          </h1>
        </div>

        {/* Right: EcoPoints Logo */}
        <div className="flex-1 flex justify-end items-center gap-4 sm:gap-6">
          <Link 
            href="/my-rewards" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[#064e3b] font-bold text-[10px] uppercase tracking-widest bg-[#10b981]/10 hover:bg-[#10b981]/20 transition-all"
          >
            <Ticket size={14} className="fill-[#064e3b]" />
            <span className="hidden sm:inline">My Vouchers</span>
          </Link>
          <img
            src="/ecopoints-logo-mark.png"
            alt="EcoPoints"
            className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
          />
        </div>
      </div>

      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#10b981]/40 to-transparent" />
    </header>
  );
}


// --- MAIN REWARDS COMPONENT ---
export default function Rewards() {
  // --- STATE ---
  const [rawSearch, setRawSearch] = useState("");
  const searchQuery = useDebounce(rawSearch, 300);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Refs
  const filterContainerRef = useRef(null);

  const { currentUser, isLoading: isAuthLoading, refreshUser } = useAuth();
  const isLoggedIn = !!currentUser;
  const userPoints = currentUser?.pointsBalance ?? 0;
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Rewards Data
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // Card Pop-Out (FLIP) Animation
  const [detailedProduct, setDetailedProduct] = useState(null);
  const [detailedModalState, setDetailedModalState] = useState("closed");
  const [cardRect, setCardRect] = useState(null);
  const [insufficientAnimId, setInsufficientAnimId] = useState(null);

  // --- L-SHAPE ANIMATION TIMINGS ---
  const bounceEase = "cubic-bezier(0.34, 1.56, 0.64, 1)";
  const smoothEase = "cubic-bezier(0.4, 0, 0.2, 1)";

  const stemTransition = isFilterOpen
    ? `height 400ms ${bounceEase} 0ms`
    : `height 300ms ${smoothEase} 200ms`;

  const barTransition = isFilterOpen
    ? `top 400ms ${bounceEase} 0ms, width 600ms ${bounceEase} 150ms`
    : `width 300ms ${smoothEase} 0ms, top 300ms ${smoothEase} 200ms`;

  // Fetch rewards from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      try {
        const fetched = await api.rewards.getAll();
        // Assign colors/icons to API products based on their ID or category
        const COLORS = [
          "from-amber-100 to-orange-50",
          "from-emerald-100 to-teal-50",
          "from-blue-100 to-indigo-50",
          "from-rose-100 to-pink-50",
          "from-purple-100 to-fuchsia-50",
          "from-cyan-100 to-blue-50",
          "from-green-100 to-emerald-50"
        ];
        const ICONS = [Tag, Leaf, ShoppingBag, Zap, Cpu, Droplet, Coffee];
        
        const mapped = fetched.map((p, idx) => ({
          ...p,
          desc: p.description,
          points: p.pointsRequired,
          image: p.imageUrl,
          color: COLORS[idx % COLORS.length],
          icon: ICONS[idx % ICONS.length]
        }));
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      } finally {
        setIsProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    return ["All", ...unique];
  }, [products]);

  // --- FILTERING & PAGINATION ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.desc || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Refresh user balance on mount
  useEffect(() => {
    if (isLoggedIn) {
      refreshUser();
    }
  }, [isLoggedIn, refreshUser]);

  // Track typing/debouncing state
  useEffect(() => {
    setIsSearching(rawSearch !== searchQuery);
  }, [rawSearch, searchQuery]);

  // Click-Outside Listener for Filter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target)
      ) {
        if (isFilterOpen) {
          setIsFilterOpen(false);
          setSelectedCategory("All");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  // Handle FLIP Animation opening frame delay
  useEffect(() => {
    if (detailedModalState === "opening") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDetailedModalState("open");
        });
      });
    }
  }, [detailedModalState]);

  // --- HANDLERS ---
  const toggleFilter = () => {
    if (isFilterOpen) {
      setSelectedCategory("All");
    }
    setIsFilterOpen(!isFilterOpen);
  };

  const handleCardClick = (product, element) => {
    if (!isLoggedIn) {
      setSelectedProduct(product);
      setShowAuthModal(true);
    } else {
      const rect = element.getBoundingClientRect();
      setCardRect({
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width / 2,
        width: rect.width,
        height: rect.height,
      });
      setDetailedProduct(product);
      setDetailedModalState("opening");
    }
  };

  const handleDirectRedeem = (product, e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setSelectedProduct(product);
      setShowAuthModal(true);
      return;
    }
    if (userPoints < product.points) {
      setInsufficientAnimId(product.id);
      setTimeout(() => setInsufficientAnimId(null), 500);
      return;
    }

    // Call real API
    api.rewards.redeem(product.id).then(() => {
      refreshUser();
      setSelectedProduct(product);
      setShowSuccessModal(true);
    }).catch(err => {
      console.error("Redemption failed:", err);
      // Optional: show error toast
    });
  };

  const handleDetailedRedeem = () => {
    if (userPoints < detailedProduct.points) {
      setInsufficientAnimId("detailed-" + detailedProduct.id);
      setTimeout(() => setInsufficientAnimId(null), 500);
      return;
    }
    
    // Call real API
    api.rewards.redeem(detailedProduct.id).then(() => {
      refreshUser();
      setSelectedProduct(detailedProduct);
      closeDetailedModal();
      setTimeout(() => setShowSuccessModal(true), 500);
    }).catch(err => {
      console.error("Redemption failed:", err);
    });
  };

  const closeDetailedModal = () => {
    setDetailedModalState("closing");
    setTimeout(() => {
      setDetailedProduct(null);
      setDetailedModalState("closed");
    }, 500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    setShowAuthModal(false);
    if (selectedProduct) {
      const cardElements = document.querySelectorAll(
        `[data-product-id="${selectedProduct.id}"]`
      );
      if (cardElements.length > 0) {
        handleCardClick(selectedProduct, cardElements[0]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4]/80 to-white/80 text-[#064e3b] selection:bg-[#34d399] selection:text-white relative pb-32 overflow-hidden">



      {/* PARALLAX FLOATING SHAPES BACKGROUND (from landing page) */}
      <div className="parallax-bg">
        <div className="parallax-layer">
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

      {/* DECORATIVE SVG CIRCLE (from landing page) */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full bg-cover opacity-50 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 1200'%3E%3Ccircle cx='600' cy='600' r='500' fill='%2310b981' opacity='0.05'/%3E%3Ccircle cx='700' cy='400' r='300' fill='%2334d399' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      {/* REWARDS HEADER */}
      <RewardsHeader />



      {/* FLOATING USER BALANCE (Only visible when logged in) */}
      {isLoggedIn && (
        <div className="fixed top-20 left-4 sm:left-8 z-40 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(16,185,129,0.15)] rounded-full px-4 py-2 border border-emerald-100 flex items-center gap-3 animate-slide-up pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-inner">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div className="pr-2">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 font-body">
              My Balance
            </div>
            {isAuthLoading ? (
              <div className="h-5 w-16 bg-slate-200 animate-pulse rounded-md" />
            ) : (
              <div className="text-xl font-black leading-none flex items-baseline gap-1 font-data text-[#064e3b]">
                {userPoints.toLocaleString()}{" "}
                <span className="text-xs text-emerald-500 font-bold font-body">EP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 relative z-10">

        {/* USER SUMMARY SECTION (inlined) */}
        <div className="mt-4 animate-slide-up">
          <section className="mb-12">
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                {/* Left: User Avatar & Info */}
                <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col items-center md:items-start gap-6">
                  <div className="relative">
                    {isAuthLoading ? (
                      <div className="w-24 h-24 rounded-full bg-slate-200 animate-pulse border-4 border-white shadow-md" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] text-white flex items-center justify-center font-black text-3xl border-4 border-white shadow-[0_8px_24px_rgba(16,185,129,0.25)]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                        {currentUser?.name?.substring(0, 2).toUpperCase() || "EP"}
                      </div>
                    )}
                    <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-slate-400 hover:text-[#10b981] transition-colors shadow-md border border-slate-100">
                      <Settings size={14} />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    {isAuthLoading ? (
                      <>
                        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg mb-2" />
                        <div className="h-4 w-32 bg-slate-100 animate-pulse rounded-md" />
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-black text-[#064e3b] tracking-tight mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                          {currentUser?.name || "Guest User"}
                        </h2>
                        <p className="text-sm font-bold text-slate-400 mb-4" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          @{currentUser?.username || "guest"}
                        </p>
                      </>
                    )}
                    <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                      <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#10b981]/20">
                        Active Member
                      </span>
                      <button
                        onClick={() => setIsHowItWorksOpen(true)}
                        className="flex items-center gap-1.5 text-[#10b981] font-bold text-xs hover:underline transition-colors"
                        style={{ fontFamily: "'Quicksand', sans-serif" }}
                      >
                        <HelpCircle size={14} />
                        How It Works
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Stats Cards */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Available Balance */}
                    <div className="bg-gradient-to-br from-[#10b981]/5 to-[#34d399]/10 rounded-[1.5rem] p-6 border border-[#10b981]/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 rounded-full -mr-6 -mt-6 pointer-events-none" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                        Available Balance
                      </p>
                      <div className="flex items-baseline gap-2">
                        {isAuthLoading ? (
                          <div className="h-12 w-24 bg-slate-200 animate-pulse rounded-xl" />
                        ) : (
                          <>
                            <span className="text-5xl font-black text-[#064e3b]" style={{ fontFamily: "'Space Mono', monospace" }}>
                              {userPoints.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-[#10b981]" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                              EP
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <Zap size={14} className="text-[#10b981] fill-[#10b981]" />
                        <span className="text-xs font-bold text-slate-400" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          Ready to redeem
                        </span>
                      </div>
                    </div>

                    {/* Total Redeemed */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[1.5rem] p-6 border border-amber-100/50 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full -mr-6 -mt-6 pointer-events-none" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                        Total Redeemed
                      </p>
                      <div className="flex items-baseline gap-2">
                        {isAuthLoading ? (
                          <div className="h-10 w-20 bg-amber-200/50 animate-pulse rounded-xl" />
                        ) : (
                          <>
                            <span className="text-4xl font-black text-amber-700" style={{ fontFamily: "'Space Mono', monospace" }}>
                              {((currentUser?.lifetimePoints ?? 0) - userPoints).toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-amber-500" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                              EP
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                          No redemptions yet
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </section>
        </div>

        {/* HERO SECTION */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#10b981]/10 rounded-full mb-6 border border-[#10b981]/20">
            <Sparkles className="w-4 h-4 text-[#10b981]" />
            <span className="text-[#10b981] text-sm font-bold uppercase tracking-widest font-body">
              Rewards Showcase
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-[#064e3b] mb-4 font-heading tracking-tight">
            Exchange Impact for{" "}
            <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
              Rewards
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-body">
            Browse our curated collection of sustainable goods, tech
            accessories, and everyday essentials. Redeem your EcoPoints today!
          </p>
        </div>

        {/* SEARCH & L-SHAPE MECHANICAL FILTER */}
        <div
          className="mb-12 animate-slide-up relative z-50"
          style={{ animationDelay: "0.1s" }}
          ref={filterContainerRef}
        >
          <div className="relative w-full max-w-3xl mx-auto px-2 sm:px-4 z-50 overflow-hidden">
            {/* Animated "L" Shape Background */}
            <div
              className="absolute top-0 left-2 sm:left-4 right-2 sm:right-4 z-10 pointer-events-none"
              style={{
                filter:
                  "drop-shadow(0 12px 24px rgba(0,0,0,0.06)) drop-shadow(0 4px 8px rgba(16,185,129,0.1))",
              }}
            >
              <div
                className="absolute left-0 top-0 bg-white/90 backdrop-blur-xl rounded-full origin-top pointer-events-auto"
                style={{
                  width: "var(--filter-btn-size)",
                  height: isFilterOpen
                    ? "var(--filter-stem-open)"
                    : "var(--filter-btn-size)",
                  transition: stemTransition,
                }}
              />

              <div
                className="absolute left-0 bg-white/90 backdrop-blur-xl rounded-full overflow-hidden no-scrollbar pointer-events-auto flex justify-start"
                style={{
                  top: isFilterOpen ? "var(--filter-bar-top)" : "0px",
                  width: isFilterOpen ? "100%" : "var(--filter-btn-size)",
                  height: "var(--filter-btn-size)",
                  transition: barTransition,
                }}
              >
                <div
                  className="flex items-center h-full w-full pr-3 sm:pr-4 overflow-x-auto no-scrollbar [-webkit-overflow-scrolling:touch]"
                  style={{
                    paddingLeft: isFilterOpen
                      ? "calc(var(--filter-btn-size) - 8px)"
                      : "16px",
                    opacity: isFilterOpen ? 1 : 0,
                    transform: isFilterOpen
                      ? "translateX(0)"
                      : "translateX(-16px)",
                    transition: `all 400ms ${smoothEase} ${isFilterOpen ? "300ms" : "0ms"
                      }`,
                  }}
                >
                  <div className="flex gap-2 w-max">
                    {categories.map((category) => {
                      const isActive = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`relative shrink-0 px-6 py-2.5 sm:py-3 rounded-[2rem] font-bold font-body text-sm transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden outline-none ${isActive
                            ? "text-white shadow-[0_5px_15px_rgba(16,185,129,0.4)] scale-105"
                            : "text-slate-500 hover:text-[#064e3b] bg-white/50 hover:bg-slate-100"
                            }`}
                        >
                          <div className="absolute inset-0 flex justify-center items-center z-0 pointer-events-none">
                            <div
                              className={`absolute w-[150px] h-[150px] bg-[#34d399]/90 rounded-[43%] transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] wave-back ${isActive
                                ? "top-[-20px] opacity-100"
                                : "top-[80px] opacity-0"
                                }`}
                            />
                            <div
                              className={`absolute w-[160px] h-[160px] bg-gradient-to-t from-[#064e3b] to-[#10b981] rounded-[40%] transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-75 wave-front ${isActive
                                ? "top-[-10px] opacity-100"
                                : "top-[80px] opacity-0"
                                }`}
                            />
                          </div>

                          <div
                            className={`absolute top-0 left-1/4 right-1/4 h-[2px] bg-white/60 rounded-b-full z-10 transition-opacity duration-500 delay-300 ${isActive ? "opacity-100" : "opacity-0"
                              }`}
                          />
                          <span className="relative z-10 tracking-wide">
                            {category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-20 flex gap-3 h-[var(--filter-btn-size)]">
              <button
                onClick={toggleFilter}
                className="relative w-[var(--filter-btn-size)] h-[var(--filter-btn-size)] flex items-center justify-center shrink-0 rounded-full text-[#10b981] hover:text-[#064e3b] transition-colors focus:outline-none"
                aria-label={isFilterOpen ? "Close filters" : "Open filters"}
              >
                <div
                  className={`absolute transition-all duration-500 ease-in-out ${isFilterOpen
                    ? "rotate-90 scale-0 opacity-0"
                    : "rotate-0 scale-100 opacity-100"
                    }`}
                >
                  <Filter size={24} strokeWidth={2.5} />
                </div>
                <div
                  className={`absolute transition-all duration-500 ease-in-out ${isFilterOpen
                    ? "rotate-0 scale-100 opacity-100"
                    : "-rotate-90 scale-0 opacity-0"
                    }`}
                >
                  <X size={24} strokeWidth={2.5} />
                </div>
                {selectedCategory !== "All" && !isFilterOpen && (
                  <span className="absolute top-1 sm:top-2 right-1 sm:right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-scale-in z-20"></span>
                )}
              </button>

              <div className="relative group flex-grow h-full">
                <div className="relative h-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-2 flex items-center shadow-sm overflow-hidden no-scrollbar">
                  <div className="pl-4 pr-2 text-emerald-500">
                    {isSearching ? (
                      <Loader2 size={22} className="animate-spin" />
                    ) : (
                      <Search size={22} />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={rawSearch}
                    onChange={(e) => setRawSearch(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-[#064e3b] font-body text-base sm:text-lg placeholder-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setRawSearch("")}
                      className="p-2 text-slate-400 hover:text-emerald-500 transition-colors mr-2 hidden sm:block z-30"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                height: isFilterOpen
                  ? "calc(var(--filter-stem-open) - var(--filter-btn-size) + 16px)"
                  : "0px",
                transition: stemTransition,
              }}
            />
          </div>
        </div>

        {/* RESULTS METADATA */}
        <div
          className="flex justify-between items-center mb-6 px-2 animate-slide-up relative z-10"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="text-slate-500 font-body font-semibold">
            Showing{" "}
            <span className="text-[#064e3b]">{filteredProducts.length}</span>{" "}
            items{" "}
            {selectedCategory !== "All" && `in ${selectedCategory}`}
          </div>
          <div className="flex items-center gap-2 text-sm font-body font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full transition-all duration-300">
            <Filter size={14} />{" "}
            {selectedCategory === "All"
              ? "All Categories"
              : `${selectedCategory} Only`}
          </div>
        </div>

        {isProductsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-20 relative z-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 h-[420px] animate-pulse border border-white">
                <div className="flex justify-between mb-4">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-8 w-16 bg-slate-200 rounded-xl" />
                </div>
                <div className="w-full h-44 bg-slate-100 rounded-[1.5rem] mb-6" />
                <div className="h-8 w-3/4 bg-slate-200 rounded-lg mb-4" />
                <div className="h-4 w-full bg-slate-100 rounded-md mb-2" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-[2rem] p-16 text-center animate-scale-in relative z-10">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="text-2xl font-black font-heading text-[#064e3b] mb-2">
              No products found
            </h3>
            <p className="text-slate-500 font-body">
              Try adjusting your search or category filters to find what
              you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-6 text-[#10b981] font-bold font-body hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 mb-20 relative z-10">
            {currentProducts.map((product, index) => {
              const isImageFile =
                product.image &&
                (product.image.includes(".jpg") ||
                  product.image.includes(".png"));
              const IconComp = product.icon || ShoppingBag;

              const isAffordable = userPoints >= product.points;
              const isOutOfStock = product.stockQuantity <= 0;
              const isShaking = insufficientAnimId === product.id;

              return (
                <div
                  key={product.id}
                  data-product-id={product.id}
                  onClick={(e) => handleCardClick(product, e.currentTarget)}
                  className={`group relative bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] flex flex-col h-auto min-h-[420px] transition-all duration-300 ease-out cursor-pointer ${detailedProduct?.id === product.id
                    ? "opacity-0 pointer-events-none"
                    : "hover:shadow-[0_20px_60px_rgba(16,185,129,0.15)] hover:-translate-y-2 animate-scale-in"
                    }`}
                  style={{
                    animationDelay:
                      detailedProduct?.id === product.id
                        ? "0s"
                        : `${index * 0.05}s`,
                  }}
                >
                  {/* Card Top: Category & Cost */}
                  <div className="flex justify-between items-start mb-4 relative z-20">
                    <span className="bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full font-body">
                      {product.category}
                    </span>
                    <div
                      className={`p-[2px] rounded-2xl shadow-sm transition-all duration-300 ${isLoggedIn && !isAffordable
                        ? "bg-slate-200"
                        : "bg-gradient-to-r from-[#10b981] to-[#34d399] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        }`}
                    >
                      <div className="bg-white px-3 py-1.5 rounded-[14px] flex items-center gap-1.5">
                        {isLoggedIn && !isAffordable ? (
                          <Lock size={14} className="text-slate-400" />
                        ) : (
                          <Zap
                            size={14}
                            className="text-[#10b981] fill-[#10b981]"
                          />
                        )}
                        <span
                          className={`font-black font-data text-lg leading-none ${isLoggedIn && !isAffordable
                            ? "text-slate-400"
                            : "text-[#064e3b]"
                            }`}
                        >
                          {product.points}
                        </span>
                        <span
                          className={`font-bold text-xs leading-none font-body ${isLoggedIn && !isAffordable
                            ? "text-slate-400"
                            : "text-[#10b981]"
                            }`}
                        >
                          EP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Staging Area */}
                  <div
                    className={`w-full h-44 rounded-[1.5rem] relative overflow-hidden mb-6 flex-shrink-0 group-hover:scale-[1.03] transition-transform duration-500 ${isLoggedIn && !isAffordable
                      ? "bg-slate-100 grayscale-[50%]"
                      : `bg-gradient-to-br ${product.color}`
                      }`}
                  >
                    <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                      <div className="w-32 h-32 bg-white rounded-full blur-3xl animate-glow"></div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center p-6 animate-float">
                      {isImageFile ? (
                        <img
                          src={encodeURI(product.image)}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-emerald-700/40 drop-shadow-md group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                          <IconComp size={80} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col flex-grow relative overflow-hidden pb-1">
                    <h3 className="text-2xl font-black text-[#064e3b] mb-2 font-heading truncate">
                      {product.name}
                    </h3>

                    <p className="text-slate-500 text-sm font-body leading-relaxed line-clamp-2 group-hover:opacity-20 transition-opacity duration-300">
                      {product.desc}
                    </p>

                    {/* Dynamic Action Button (Direct Redeem) */}
                    <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pb-1">
                      <button
                        onClick={(e) => !isOutOfStock && handleDirectRedeem(product, e)}
                        disabled={isOutOfStock}
                        className={`w-full py-3.5 rounded-xl font-bold font-body text-[15px] flex items-center justify-center gap-2 transition-all shadow-md ${isShaking
                          ? "bg-red-50 text-red-500 border-2 border-red-200 animate-error-shake"
                          : isOutOfStock
                            ? "bg-slate-50 text-slate-400 border-2 border-slate-100 cursor-not-allowed"
                            : !isLoggedIn
                              ? "bg-white border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white"
                              : isAffordable
                                ? "bg-[#064e3b] text-white hover:bg-[#0a6c53] shadow-[#064e3b]/30"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200 hover:bg-slate-200"
                          }`}
                      >
                        {isOutOfStock ? (
                          <>
                            Out of Stock <X size={18} />
                          </>
                        ) : !isLoggedIn ? (
                          <>
                            Sign In to Redeem <ArrowRight size={18} />
                          </>
                        ) : isAffordable ? (
                          <>
                            Redeem Now <ArrowRight size={18} />
                          </>
                        ) : isShaking ? (
                          <>
                            Insufficient Points <X size={18} />
                          </>
                        ) : (
                          <>
                            Not Enough EP <Lock size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pb-20 animate-slide-up relative z-10">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-12 h-12 rounded-full font-bold font-body text-sm transition-all shadow-sm ${currentPage === i + 1
                    ? "bg-gradient-to-r from-[#10b981] to-[#34d399] text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)] scale-110"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. DETAILED PRODUCT MODAL (FLIP ANIMATION) */}
      {detailedProduct && isLoggedIn && !showSuccessModal && (
        <div className="fixed inset-0 z-[120] pointer-events-none">
          {/* Blurred Background Overlay */}
          <div
            className={`absolute inset-0 bg-[#064e3b]/30 backdrop-blur-sm pointer-events-auto transition-opacity duration-500 ease-in-out ${detailedModalState === "open" ? "opacity-100" : "opacity-0"
              }`}
            onClick={closeDetailedModal}
          />

          {/* Floating / Morphing Card Container */}
          <div
            className="absolute bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden pointer-events-auto border border-white"
            style={{
              top:
                detailedModalState === "open"
                  ? "50%"
                  : `${cardRect?.top}px`,
              left:
                detailedModalState === "open"
                  ? "50%"
                  : `${cardRect?.left}px`,
              width:
                detailedModalState === "open"
                  ? "min(calc(100vw - 2rem), 56rem)"
                  : `${cardRect?.width}px`,
              height:
                detailedModalState === "open"
                  ? "min(calc(100vh - 2rem), 32rem)"
                  : `${cardRect?.height}px`,
              transform: "translate(-50%, -50%)",
              transition:
                "all 500ms cubic-bezier(0.34, 1.08, 0.64, 1)",
              padding: "1.5rem",
              gap:
                detailedModalState === "open" ? "2.5rem" : "0rem",
            }}
          >
            <button
              onClick={closeDetailedModal}
              className={`absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-all duration-500 z-20 bg-white/50 rounded-full p-1 backdrop-blur-sm ${detailedModalState === "open"
                ? "opacity-100 scale-100"
                : "opacity-0 scale-50 pointer-events-none"
                }`}
            >
              <X size={28} />
            </button>

            {/* Left: Enhanced Product Display */}
            <div
              className={`w-full h-full rounded-[1.5rem] md:rounded-[2rem] relative overflow-hidden flex items-center justify-center flex-shrink-0 transition-all duration-500 ${userPoints < detailedProduct.points || detailedProduct.stockQuantity <= 0
                ? "bg-slate-100 grayscale-[50%]"
                : `bg-gradient-to-br ${detailedProduct.color}`
                } ${detailedModalState === "open"
                  ? "md:w-1/2"
                  : "md:w-full"
                }`}
            >
              <div className="absolute inset-0 flex justify-center items-center opacity-60 pointer-events-none">
                <div className="w-64 h-64 bg-white rounded-full blur-3xl animate-glow"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center p-8 animate-float">
                {detailedProduct.image &&
                  (detailedProduct.image.includes(".jpg") ||
                    detailedProduct.image.includes(".png")) ? (
                  <img
                    src={encodeURI(detailedProduct.image)}
                    alt={detailedProduct.name}
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-2xl hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-emerald-700/40 drop-shadow-xl hover:scale-110 transition-transform duration-700">
                    {React.createElement(
                      detailedProduct.icon || ShoppingBag,
                      {
                        size:
                          detailedModalState === "open" ? 140 : 80,
                        strokeWidth: 1.5,
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Rich Details & CTA */}
            <div
              className={`w-full md:w-1/2 flex-col justify-center py-4 md:py-8 pr-2 md:pr-6 transition-opacity duration-300 ${detailedModalState === "open"
                ? "opacity-100 flex delay-200"
                : "opacity-0 hidden"
                }`}
            >
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-bold tracking-widest uppercase text-xs rounded-full mb-4 w-max font-body">
                {detailedProduct.category}
              </span>
              <h2 className="text-3xl md:text-4xl font-black font-heading text-[#064e3b] mb-4 leading-tight">
                {detailedProduct.name}
              </h2>

              <div className="flex-grow overflow-y-auto no-scrollbar">
                <p className="text-slate-600 font-body text-lg leading-relaxed mb-6">
                  {detailedProduct.desc}
                  <br />
                  <br />
                  This premium eco-friendly reward is carefully sourced to
                  ensure minimal environmental impact. Redeem it using your
                  hard-earned EcoPoints and take another step towards a
                  sustainable future!
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-2">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-sm font-body">
                    Required Points
                  </span>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${userPoints < detailedProduct.points || detailedProduct.stockQuantity <= 0
                      ? "bg-slate-100 border-slate-200"
                      : "bg-emerald-50 border-emerald-100"
                      }`}
                  >
                    {userPoints >= detailedProduct.points && detailedProduct.stockQuantity > 0 ? (
                      <Zap
                        className="text-[#10b981] fill-[#10b981]"
                        size={24}
                      />
                    ) : (
                      <Lock className="text-slate-400" size={24} />
                    )}
                    <span
                      className={`text-3xl font-black font-data ${userPoints < detailedProduct.points
                        ? "text-slate-400"
                        : "text-[#064e3b]"
                        }`}
                    >
                      {detailedProduct.points}
                    </span>
                    <span
                      className={`text-lg font-bold font-body ${userPoints < detailedProduct.points
                        ? "text-slate-400"
                        : "text-[#10b981]"
                        }`}
                    >
                      EP
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDetailedRedeem}
                  disabled={detailedProduct.stockQuantity <= 0}
                  className={`w-full py-4 rounded-xl font-bold font-body text-[17px] flex items-center justify-center gap-2 transition-all duration-300 ${insufficientAnimId ===
                    "detailed-" + detailedProduct.id
                    ? "bg-red-50 text-red-500 border-2 border-red-200 animate-error-shake"
                    : detailedProduct.stockQuantity <= 0
                      ? "bg-slate-50 text-slate-400 border-2 border-slate-100 cursor-not-allowed"
                      : userPoints >= detailedProduct.points
                        ? "bg-[#064e3b] text-white hover:bg-[#0a6c53] shadow-[0_10px_20px_rgba(6,78,59,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(6,78,59,0.35)]"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200"
                    }`}
                >
                  {detailedProduct.stockQuantity <= 0 ? (
                    <>
                      Out of Stock <X size={20} className="ml-1" />
                    </>
                  ) : userPoints >= detailedProduct.points ? (
                    <>
                      Confirm Redemption{" "}
                      <CheckCircle2 size={20} className="ml-1" />
                    </>
                  ) : insufficientAnimId ===
                    "detailed-" + detailedProduct.id ? (
                    <>
                      Insufficient Points{" "}
                      <X size={20} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Not Enough EP{" "}
                      <Lock size={20} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#064e3b]/40 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.2)] animate-scale-in overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="text-center relative z-10 mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <UserCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black font-heading text-[#064e3b] mb-2">
                Sign In Required
              </h2>
              <p className="text-slate-500 font-body leading-relaxed">
                Please sign in to your EcoPoints account to redeem the{" "}
                <strong className="text-[#064e3b]">
                  {selectedProduct?.name}
                </strong>
                .
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="relative z-10 flex flex-col gap-4"
            >
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-600 font-body ml-1">
                  Student ID / Email
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2020-12345-MN-0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-body text-slate-700"
                  required
                />
              </div>
              <div className="space-y-1 mb-2">
                <label className="text-sm font-bold text-slate-600 font-body ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all font-body text-slate-700"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#10b981] to-[#34d399] text-white font-bold font-body text-lg py-4 rounded-xl shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 transition-transform"
              >
                Sign In to Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#064e3b]/60 backdrop-blur-md"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] animate-scale-in text-center overflow-hidden">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full h-40 bg-emerald-400 rounded-full blur-3xl opacity-20 pointer-events-none" />

            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-inner">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>

            <h2 className="text-3xl font-black font-heading text-[#064e3b] mb-3 relative z-10">
              Redemption Successful!
            </h2>
            <p className="text-slate-600 font-body mb-8 relative z-10 leading-relaxed">
              You have successfully claimed the{" "}
              <strong>{selectedProduct?.name}</strong>. Please check your
              email for pickup instructions!
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-slate-900 text-white font-bold font-body py-4 rounded-xl hover:bg-slate-800 transition-colors relative z-10 shadow-lg"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
      {isHowItWorksOpen && <HowItWorksModal onClose={() => setIsHowItWorksOpen(false)} />}
    </div>
  );
}
