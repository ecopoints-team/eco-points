Integrate this code design on the rewards page including the functionality. Remove all mock data and do not create anything on the database. If there are needed changes, ask before implementing:

import React, { useState, useEffect } from 'react';
import {
  Search, Info, User, Zap, LogIn, X,
  CheckCircle2, AlertCircle, ShoppingBag, Ticket,
  Plus, Minus, QrCode, Download, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';

// --- MOCK DATA ---
const CATEGORIES = ['All', 'Supplies', 'Merchandise', 'Vouchers'];

const PRODUCTS = [
  { id: 1, name: "EcoPoints Canvas Tote", points: 2000, category: "Merchandise", image: "👜", desc: "Heavy-duty organic cotton tote bag perfect for carrying books.", variations: ["Natural White", "Forest Green"] },
  { id: 2, name: "Insulated Tumbler", points: 3500, category: "Merchandise", image: "🥤", desc: "Keep your drinks ice cold for 24 hours. BPA free.", variations: ["Matte Black", "Mint Green", "Steel"] },
  { id: 3, name: "Recycled Notebook", points: 1500, category: "Supplies", image: "📓", desc: "100-page lined notebook made entirely from recycled paper.", variations: ["Lined", "Dotted", "Blank"] },
  { id: 4, name: "Bamboo Pen Set", points: 800, category: "Supplies", image: "🖊️", desc: "Set of 3 smooth-writing pens crafted from sustainable bamboo.", variations: [] },
  { id: 5, name: "Cafeteria Meal Pass", points: 5000, category: "Vouchers", image: "🍱", desc: "Redeemable for one premium combo meal at the main cafeteria.", variations: [] },
  { id: 6, name: "Campus T-Shirt", points: 4500, category: "Merchandise", image: "👕", desc: "Limited edition EcoWarrior campus shirt. 100% cotton.", variations: ["Small", "Medium", "Large", "X-Large"] },
  { id: 7, name: "Reusable Straw Set", points: 1200, category: "Supplies", image: "🧃", desc: "Stainless steel straws with a cleaning brush and pouch.", variations: ["Silver", "Rose Gold"] },
  { id: 8, name: "Eco Lanyard", points: 500, category: "Merchandise", image: "🎗️", desc: "Durable ID lanyard made from recycled PET bottles.", variations: [] },
  { id: 9, name: "Coffee Voucher", points: 2500, category: "Vouchers", image: "☕", desc: "50% off any premium coffee at the campus cafe.", variations: [] },
  { id: 10, name: "Plantable Pencil", points: 600, category: "Supplies", image: "✏️", desc: "Pencil with seeds at the end that grows when planted.", variations: ["Basil", "Tomato", "Sunflower"] },
  { id: 11, name: "Solar Calculator", points: 3000, category: "Supplies", image: "🧮", desc: "Battery-free, solar-powered scientific calculator.", variations: [] },
  { id: 12, name: "Organic Cap", points: 3800, category: "Merchandise", image: "🧢", desc: "Comfortable baseball cap with embroidered EcoPoints logo.", variations: ["Forest Green", "Black"] }
];

const Rewards = () => {
  // --- STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Defaulted to true to test features
  const [userPoints, setUserPoints] = useState(8000);
  const [redeemedItemsCount, setRedeemedItemsCount] = useState(4);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Product Selection States
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Checkout & Confirmation States
  const [checkoutData, setCheckoutData] = useState(null);

  // Pending Items & expanding pill states
  const [isPendingExpanded, setIsPendingExpanded] = useState(false);
  const [pendingItemQR, setPendingItemQR] = useState(null);
  const [pendingItems, setPendingItems] = useState([
    { id: 'EP-REQ-847291', name: 'Campus T-Shirt (Medium)', quantity: 1, date: 'Apr 02, 2026' },
    { id: 'EP-REQ-592018', name: 'Bamboo Pen Set', quantity: 2, date: 'Apr 01, 2026' }
  ]);

  // Modal States
  const [isHowToModalOpen, setIsHowToModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showCheckoutQR, setShowCheckoutQR] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Pagination State (3x3 grid = 9 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // --- FILTER & PAGINATION LOGIC ---
  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);


  // --- HANDLERS ---
  const handleProductClick = (product) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveProduct(product);
    setSelectedVariation(product.variations && product.variations.length > 0 ? product.variations[0] : '');
    setSelectedQuantity(1);
  };

  const handleInitiateCheckout = () => {
    if (!activeProduct) return;

    // Freeze the current selection data for the confirmation modal
    setCheckoutData({
      product: activeProduct,
      variation: selectedVariation,
      quantity: selectedQuantity,
      totalCost: activeProduct.points * selectedQuantity
    });

    setActiveProduct(null);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (checkoutData && userPoints >= checkoutData.totalCost) {
      setUserPoints(prev => prev - checkoutData.totalCost);
      setRedeemedItemsCount(prev => prev + checkoutData.quantity);

      const newTransactionId = `EP-REQ-${Math.floor(Math.random() * 1000000)}`;
      setTransactionId(newTransactionId);

      // Add items to pending list automatically
      const newPendingItem = {
        id: newTransactionId,
        name: `${checkoutData.product.name} ${checkoutData.variation ? `(${checkoutData.variation})` : ''}`,
        quantity: checkoutData.quantity,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      };
      setPendingItems(prev => [newPendingItem, ...prev]);

      // Clean up checkout states
      setIsConfirmModalOpen(false);
      setCheckoutData(null);

      // Show success QR
      setShowCheckoutQR(true);
    }
  };

  // --- REUSABLE PRODUCT CARD ---
  const renderProductCard = (product, idx) => {
    const canAfford = isLoggedIn && userPoints >= product.points;
    const pointsDeficit = product.points - userPoints;

    return (
      <div key={`${product.id}-${idx}`} className="relative group mt-12 w-full">
        <div className="bg-white rounded-[2rem] p-6 pt-20 border border-[#F0FDF4] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-[#34D399]/50 transition-all duration-500 flex flex-col h-full z-10 relative">

          {/* ILLUSION ART IMAGE CONTAINER */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-40 h-40 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-6 group-hover:scale-110 z-20 pointer-events-none">
            <div className="absolute inset-0 bg-[#34D399] rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <span className="text-8xl drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)] transition-all duration-500">
              {product.image}
            </span>
          </div>

          <div className="text-center mb-4 flex-grow pointer-events-none">
            <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2">{product.category}</div>
            <h3 className="font-fredoka font-bold text-xl text-[#064E3B] mb-2">{product.name}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{product.desc}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
            <div className="flex justify-between items-center pointer-events-none">
              <span className="font-semibold text-slate-500 text-sm">Cost</span>
              <div className="font-space-mono font-bold text-xl text-[#10B981] flex items-center gap-1">
                <Zap size={16} /> {product.points.toLocaleString()}
              </div>
            </div>

            {/* Smart Button: Changes style and disabled state based on userPoints */}
            <button
              onClick={() => handleProductClick(product)}
              disabled={isLoggedIn && !canAfford}
              className={`w-full py-3 rounded-xl font-bold font-fredoka transition-all flex items-center justify-center gap-2 ${!isLoggedIn
                ? 'bg-[#F8FAFC] text-[#064E3B] border border-slate-200 hover:bg-[#F0FDF4] hover:border-[#10B981]'
                : canAfford
                  ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {!isLoggedIn ? 'Sign in to Redeem' : canAfford ? 'Redeem Item' : `Need ${pointsDeficit.toLocaleString()} more EP`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-quicksand text-[#064E3B] selection:bg-[#34D399] selection:text-white pb-24 overflow-x-hidden">

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        .font-fredoka { font-family: 'Fredoka', sans-serif; }
        .font-quicksand { font-family: 'Quicksand', sans-serif; }
        .font-space-mono { font-family: 'Space Mono', monospace; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* --- PENDING CLAIMS EXPANDING PILL --- */}
      {isLoggedIn && (
        <div className={`fixed top-[15%] right-0 z-40 transition-transform duration-500 ease-in-out ${isPendingExpanded ? 'translate-x-0' : 'translate-x-[calc(100%-48px)]'}`}>
          <div className="bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] border border-slate-100 rounded-l-3xl flex h-[60vh] max-h-[600px] min-h-[400px]">
            {/* Pill Tab */}
            <button
              onClick={() => setIsPendingExpanded(!isPendingExpanded)}
              className="w-12 bg-[#FBBF24] text-[#064E3B] rounded-l-3xl flex flex-col items-center justify-center gap-4 hover:bg-[#FDE68A] transition-colors shadow-[inset_2px_0_10px_rgba(0,0,0,0.05)] relative z-10"
            >
              <Ticket size={20} className="-rotate-90" />
              <span style={{ writingMode: 'vertical-rl' }} className="font-bold font-fredoka tracking-wider rotate-180 py-4">
                Pending Claims
              </span>
              {pendingItems.length > 0 && (
                <div className="w-6 h-6 bg-[#064E3B] rounded-full flex items-center justify-center text-white font-black text-xs font-space-mono mt-2 shadow-md">
                  {pendingItems.length}
                </div>
              )}
            </button>

            {/* Panel Content */}
            <div className="w-80 p-6 bg-white overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-black font-fredoka text-xl text-[#064E3B] flex items-center gap-2">
                  <Ticket size={20} className="text-[#10B981]" /> Pending Items
                </h3>
                <button onClick={() => setIsPendingExpanded(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto hide-scrollbar">
                {pendingItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center pb-10">
                    <ShoppingBag size={40} className="mb-3 opacity-30" />
                    <p className="font-medium text-sm">No items waiting to be claimed.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-4">
                    {pendingItems.map((item, idx) => (
                      <div key={idx} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#F0FDF4] shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-1 rounded-md font-space-mono border border-[#10B981]/20">{item.id}</div>
                          <div className="text-xs text-slate-500 font-medium">{item.date}</div>
                        </div>
                        <h4 className="font-bold text-[#064E3B] font-fredoka leading-tight mb-1">{item.name}</h4>
                        <p className="text-xs text-slate-600 font-medium mb-3">Quantity: {item.quantity}</p>
                        <button
                          onClick={() => setPendingItemQR(item)}
                          className="w-full py-2.5 bg-white border border-[#34D399] text-[#059669] text-sm font-bold font-fredoka rounded-xl hover:bg-[#F0FDF4] transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <QrCode size={16} /> View QR Ticket
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SIMULATION TOGGLE --- */}
      <div className="fixed bottom-4 left-4 z-[999] bg-white p-3 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Auth State:</span>
        <button
          onClick={() => {
            setIsLoggedIn(!isLoggedIn);
            if (isLoggedIn) { setIsPendingExpanded(false); }
          }}
          className={`px-4 py-1.5 rounded-xl text-sm font-bold font-fredoka transition-colors ${isLoggedIn ? 'bg-[#10B981] text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          {isLoggedIn ? 'Logged In' : 'Logged Out'}
        </button>
      </div>

      {/* --- NAVIGATION BAR --- */}
      <nav className="bg-white border-b border-[#F0FDF4] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center text-white font-bold text-sm font-fredoka">EP</div>
            <span className="font-bold text-xl tracking-tight text-[#064E3B] font-fredoka hidden sm:block">Rewards</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="font-semibold text-[#6B7280] hover:text-[#10B981] transition-colors">Home</a>

            {!isLoggedIn ? (
              <button className="px-5 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm">
                <LogIn size={16} /> Sign In
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F0FDF4] rounded-full flex items-center justify-center text-[#059669] border border-[#34D399]/30">
                  <User size={18} />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- HEADER SECTION --- */}
      <div className="max-w-[1200px] mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-8">

          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black font-fredoka text-[#064E3B] mb-3">Rewards Catalog</h1>
            <p className="text-[#6B7280] font-medium text-lg max-w-lg">
              Turn your environmental impact into tangible rewards. Browse our collection of eco-friendly gear and campus perks.
            </p>
          </div>

          {/* User Info & Actions Container */}
          <div className="flex flex-col items-start xl:items-end gap-4 w-full xl:w-auto shrink-0">
            {isLoggedIn && (
              <div className="bg-white p-4 rounded-2xl border border-[#F0FDF4] shadow-[0_4px_15px_rgba(16,185,129,0.05)] flex flex-wrap items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F8FAFC] rounded-full flex items-center justify-center text-[#10B981] border-2 border-[#F0FDF4]">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-fredoka font-bold text-[#064E3B] leading-none text-sm md:text-base">Jana Soriano</h3>
                    <span className="text-[10px] md:text-xs text-[#6B7280] font-space-mono">@luwieo</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wide">Balance</span>
                    <span className="font-space-mono font-bold text-[#064E3B] text-sm md:text-base">{userPoints.toLocaleString()} EP</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#10B981] uppercase tracking-wide">Redeemed</span>
                    <div className="font-space-mono font-bold text-[#064E3B] text-sm md:text-base flex items-center gap-1">
                      <Ticket size={14} className="text-[#34D399]" /> {redeemedItemsCount}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsHowToModalOpen(true)}
              className="px-6 py-4 bg-white border-2 border-[#F0FDF4] text-[#064E3B] font-bold rounded-2xl hover:border-[#34D399] hover:bg-[#F0FDF4]/50 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto"
            >
              <Info size={20} className="text-[#10B981]" /> How to Redeem?
            </button>
          </div>
        </div>

        {/* --- FILTERS & SEARCH --- */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-[#F0FDF4]">
          <div className="flex w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-xl font-fredoka font-medium text-sm whitespace-nowrap transition-all ${activeCategory === category
                  ? 'bg-[#10B981] text-white shadow-md'
                  : 'bg-[#F8FAFC] text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#059669]'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
            <input
              type="text"
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 text-[#064E3B] pl-10 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- DISPLAY LOGIC (3x3 GRID & PAGINATION) --- */}
      <div className="max-w-[1200px] mx-auto px-6 pb-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-fredoka font-bold text-xl text-[#064E3B]">No rewards found</h3>
            <p className="text-[#6B7280]">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {currentProducts.map((product, idx) => renderProductCard(product, idx))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6 mt-20">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-[#064E3B] hover:border-[#10B981] hover:bg-[#F0FDF4] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-bold font-space-mono text-[#6B7280]">
                  Page <span className="text-[#10B981]">{currentPage}</span> of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-[#064E3B] hover:border-[#10B981] hover:bg-[#F0FDF4] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* MODALS                                    */}
      {/* ========================================= */}

      {/* 1. PRODUCT CONFIGURATION MODAL */}
      {activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#F0FDF4]">
            <button onClick={() => setActiveProduct(null)} className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#065F46] rounded-full transition-colors z-10">
              <X size={24} />
            </button>

            <div className="flex flex-col items-center text-center mb-8">
              <div className="text-8xl drop-shadow-xl mb-4">{activeProduct.image}</div>
              <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2">{activeProduct.name}</h2>
              <p className="text-[#6B7280] font-medium text-sm">{activeProduct.desc}</p>
            </div>

            <div className="space-y-6">
              {/* Variations */}
              {activeProduct.variations && activeProduct.variations.length > 0 && (
                <div>
                  <h4 className="font-bold font-fredoka text-[#064E3B] mb-3">Select Variation</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.variations.map(v => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariation(v)}
                        className={`px-4 py-2 rounded-xl font-medium font-quicksand text-sm border-2 transition-all ${selectedVariation === v
                          ? 'border-[#10B981] bg-[#F0FDF4] text-[#059669]'
                          : 'border-slate-100 bg-white text-[#6B7280] hover:border-slate-300'
                          }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity with Smart Checkout Limits */}
              <div>
                <h4 className="font-bold font-fredoka text-[#064E3B] mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-space-mono font-bold text-xl w-8 text-center text-[#064E3B]">{selectedQuantity}</span>
                  <button
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    disabled={(selectedQuantity + 1) * activeProduct.points > userPoints}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {(selectedQuantity + 1) * activeProduct.points > userPoints && (
                  <p className="text-xs text-amber-500 font-bold mt-2">Maximum quantity reached for your balance.</p>
                )}
              </div>

              {/* Summary & Checkout Transition */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-500">Subtotal:</span>
                  <span className="font-space-mono font-bold text-2xl text-[#10B981]">
                    {(activeProduct.points * selectedQuantity).toLocaleString()} EP
                  </span>
                </div>
                <button
                  onClick={handleInitiateCheckout}
                  className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold font-fredoka rounded-xl shadow-md hover:shadow-lg transition-all text-lg flex justify-center items-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHECKOUT SUMMARY & CONFIRMATION MODAL */}
      {isConfirmModalOpen && checkoutData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#F0FDF4] flex flex-col">
            <button onClick={() => setIsConfirmModalOpen(false)} className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#065F46] rounded-full transition-colors z-10">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2 pr-8">Order Summary</h2>
            <p className="text-[#6B7280] font-medium text-sm mb-6">Please review your redemption details below.</p>

            {/* Item Details Box */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 flex gap-4 items-center mb-6">
              <div className="text-4xl bg-white p-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                {checkoutData.product.image}
              </div>
              <div>
                <h4 className="font-bold font-fredoka text-[#064E3B] leading-tight mb-1">{checkoutData.product.name}</h4>
                {checkoutData.variation && (
                  <p className="text-xs text-slate-500 font-medium mb-1">Variation: {checkoutData.variation}</p>
                )}
                <p className="text-xs font-space-mono text-[#10B981] font-bold">Qty: {checkoutData.quantity}</p>
              </div>
            </div>

            {/* Ledger & Calculations */}
            <div className="space-y-3 border-y border-slate-100 py-5 mb-6 font-space-mono">
              <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Current Balance</span>
                <span>{userPoints.toLocaleString()} EP</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-rose-500">
                <span>Order Cost</span>
                <span>-{checkoutData.totalCost.toLocaleString()} EP</span>
              </div>
              <div className="h-px w-full bg-slate-100 my-1"></div>
              <div className="flex justify-between items-center font-bold text-lg text-[#064E3B]">
                <span className="font-fredoka">Remaining Balance</span>
                <span>{(userPoints - checkoutData.totalCost).toLocaleString()} EP</span>
              </div>
            </div>

            {/* Warning Prompt */}
            <div className="flex gap-3 items-start bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200/50 mb-8 text-sm font-medium leading-relaxed">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
              <p>Please review your order carefully. Once confirmed, <strong>transactions cannot be cancelled or refunded.</strong></p>
            </div>

            <div className="flex gap-3 mt-auto">
              <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-[#6B7280] font-bold font-fredoka rounded-xl hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={userPoints < checkoutData.totalCost}
                className="flex-[2] py-4 bg-[#10B981] text-white font-bold font-fredoka rounded-xl shadow-md hover:bg-[#059669] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Redemption
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. CHECKOUT SUCCESS & QR MODAL */}
      {showCheckoutQR && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#064E3B]/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center animate-in zoom-in-50 duration-500">
            <button onClick={() => setShowCheckoutQR(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors z-10">
              <X size={24} />
            </button>

            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full mx-auto flex items-center justify-center text-[#10B981] mb-6 relative">
              <div className="absolute inset-0 border-4 border-[#10B981] rounded-full animate-ping opacity-20"></div>
              <CheckCircle2 size={40} />
            </div>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2">Redemption Successful!</h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-4 inline-block">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Transaction ID</span>
              <span className="font-space-mono font-bold text-[#064E3B] text-xl">{transactionId}</span>
            </div>

            <p className="text-[#6B7280] font-medium mb-8">Present this QR code to the EcoPoints Admin Desk to claim your items.</p>

            {/* Mock QR Code Visual */}
            <div className="bg-white p-4 border-2 border-dashed border-[#34D399] rounded-2xl inline-block mb-8">
              <div className="w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxwYXRoIGQ9Ik0wLDBIMTBWMTBIMHptMjAsMEgzMFYxMEgyMHptMjAsMEg1MFYxMEg0MHptMjAsMEg3MFYxMEg2MHoiIGZpbGw9IiMwNjRlM2IiLz48L3N2Zz4=')] bg-repeat rounded-lg opacity-80" style={{ backgroundSize: '20px 20px' }}>
                <div className="w-full h-full border-[16px] border-[#064E3B] rounded-xl flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-[#064E3B] rounded-sm"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button className="w-full py-4 bg-[#F0FDF4] text-[#059669] border border-[#34D399]/30 font-bold font-fredoka rounded-xl hover:bg-[#34D399]/20 transition-colors flex justify-center items-center gap-2 shadow-sm">
                <Download size={20} /> Download Ticket
              </button>
              <button onClick={() => setShowCheckoutQR(false)} className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] shadow-md transition-colors">
                Return to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. VIEW PENDING ITEM QR MODAL */}
      {pendingItemQR && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <button onClick={() => setPendingItemQR(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors z-10">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2 mt-4">Claim Ticket</h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-6 inline-block mt-2">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Transaction ID</span>
              <span className="font-space-mono font-bold text-[#064E3B] text-xl">{pendingItemQR.id}</span>
            </div>

            <div className="bg-white p-4 border-2 border-dashed border-[#34D399] rounded-2xl inline-block mb-6 relative">
              <div className="w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxwYXRoIGQ9Ik0wLDBIMTBWMTBIMHptMjAsMEgzMFYxMEgyMHptMjAsMEg1MFYxMEg0MHptMjAsMEg3MFYxMEg2MHoiIGZpbGw9IiMwNjRlM2IiLz48L3N2Zz4=')] bg-repeat rounded-lg opacity-80" style={{ backgroundSize: '20px 20px' }}>
                <div className="w-full h-full border-[16px] border-[#064E3B] rounded-xl flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-[#064E3B] rounded-sm"></div>
                </div>
              </div>
            </div>

            <div className="text-left bg-[#F0FDF4] p-5 rounded-2xl mb-8 border border-[#34D399]/30">
              <h4 className="font-bold text-[#064E3B] font-fredoka text-lg leading-tight mb-2">{pendingItemQR.name}</h4>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 font-quicksand border-t border-[#10B981]/20 pt-2 mt-2">
                <span>Quantity: {pendingItemQR.quantity}</span>
                <span>{pendingItemQR.date}</span>
              </div>
            </div>

            <button className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] shadow-md transition-colors flex justify-center items-center gap-2">
              <Download size={20} /> Save QR Ticket
            </button>
          </div>
        </div>
      )}

      {/* 5. HOW TO REDEEM MODAL (Landscape Roadmap Style) */}
      {isHowToModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-4xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsHowToModalOpen(false)} className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#065F46] rounded-full transition-colors z-10">
              <X size={24} />
            </button>

            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-[#F0FDF4] text-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Info size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black font-fredoka text-[#064E3B] mb-2">How to Redeem</h2>
              <p className="text-[#6B7280] font-medium text-lg">Follow these simple steps to claim your physical items.</p>
            </div>

            {/* Roadmap Layout */}
            <div className="relative mb-12">
              <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-1.5 bg-[#F0FDF4] z-0 rounded-full">
                <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] w-full rounded-full opacity-50"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {[
                  { step: 1, title: 'Configure & Checkout', desc: 'Select your item variations and quantity, then proceed to review your order summary.' },
                  { step: 2, title: 'Get Your QR Ticket', desc: 'A unique Redemption QR Code will be generated after confirming your checkout.' },
                  { step: 3, title: 'Visit the Admin Kiosk', desc: 'Present your QR Ticket to the EcoPoints Admin Desk at the cafeteria to collect your items!' }
                ].map(item => (
                  <div key={item.step} className="flex flex-col items-center text-center group bg-white">
                    <div className="w-14 h-14 rounded-full bg-[#10B981] text-white font-bold font-space-mono text-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-6 group-hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    <h4 className="font-bold font-fredoka text-[#064E3B] text-xl mb-3">{item.title}</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed px-2">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setIsHowToModalOpen(false)} className="w-full max-w-md mx-auto block py-4 bg-[#F8FAFC] text-[#064E3B] font-bold font-fredoka rounded-xl hover:bg-[#F0FDF4] hover:text-[#059669] transition-colors border border-slate-100">
              Got it, I'm ready!
            </button>
          </div>
        </div>
      )}

      {/* 6. AUTH CHECK MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative text-center animate-in slide-in-from-bottom-10 duration-300">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 text-[#6B7280] hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-[#10B981]/30">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-black font-fredoka text-[#064E3B] mb-2">Sign In Required</h2>
            <p className="text-[#6B7280] font-medium mb-8">You need an active EcoPoints account to redeem rewards. Create one to start earning points!</p>
            <div className="flex flex-col gap-3">
              <button className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] transition-colors shadow-md">
                Log In
              </button>
              <button className="w-full py-4 bg-[#F0FDF4] text-[#059669] font-bold font-fredoka rounded-xl hover:bg-[#34D399]/20 transition-colors">
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Rewards;