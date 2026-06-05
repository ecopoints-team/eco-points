"use client";
// Recent Activity
// User Profile
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  History,
  TrendingDown,
  TrendingUp,
  Tag,
  Clock,
  X,
  MapPin,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Recycle,
  ReceiptText,
  Scissors
} from "lucide-react";

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
import api from "../../services/api";

const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

function CustomSelect({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 bg-stone-50 border border-emerald-100 rounded-lg px-4 py-2 text-[11px] font-bold text-emerald-800 shadow-sm hover:border-emerald-300 transition-all min-w-[120px]"
        style={fonts.body}
      >
        <span className="truncate">{selectedOption?.label || label}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-emerald-100 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 min-w-[150px]">
          <div className="p-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`flex items-center justify-between w-full px-3 py-2 text-[11px] font-bold rounded-md transition-colors ${value === opt.value
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-stone-600 hover:bg-stone-50"
                  }`}
                style={fonts.body}
              >
                {opt.label}
                {value === opt.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecentActivity() {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const itemsPerPage = 5;

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        setIsLoading(true);
        const data = await api.logs.getTransactions();
        const mappedData = data.map(txn => {
          let description = txn.description;
          if (!description) {
            const type = txn.transactionType;
            const refType = txn.referenceType;
            if (type === "earn") {
              if (refType === "session") {
                description = "Recycled at RVM";
              } else if (refType === "bulk_deposit") {
                description = "Bulk Recycling Deposit";
              } else {
                description = "EcoPoints Earned";
              }
            } else if (type === "redeem") {
              if (refType === "reward_redemption" || refType === "redemption") {
                description = "Reward Redeemed";
              } else {
                description = "Points Redeemed";
              }
            } else if (type === "redeem_confirm") {
              description = "Reward Claimed";
            } else if (type === "adjustment") {
              description = "Points Adjusted by Admin";
            } else {
              description = type 
                ? type.charAt(0).toUpperCase() + type.slice(1) 
                : "Points Transaction";
            }
          }

          return {
            id: txn.id,
            type: txn.transactionType, // 'earn', 'redeem', 'adjustment', 'redeem_confirm'
            amount: txn.amount,
            description: description,
            date: txn.timestamp,
            reference: txn.referenceId ? `TXN-${txn.referenceId}` : "N/A",
            bottles: 0, // Transaction log doesn't store direct bottle count easily, let's default to 0
            location: txn.locationName || "Unknown Location",
            category: txn.transactionType === "earn" ? "Recycling" : "Reward",
          };
        });
        setActivities(mappedData);
      } catch (err) {
        console.error("Failed to load recent activity:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedActivity) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedActivity]);

  const filteredActivities = useMemo(() => {
    let result = [...activities];
    if (filterType !== "all") {
      if (filterType === "redeem") {
        result = result.filter(a => a.type === "redeem" || a.type === "redeem_confirm");
      } else {
        result = result.filter(a => a.type === filterType);
      }
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "oldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "amount_high") return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortBy === "amount_low") return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });
    return result;
  }, [filterType, sortBy, activities]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const displayedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl flex flex-col h-full">
      {/* Header */}
      <div className="p-5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History size={22} className="text-emerald-600" />
          <h2 className="text-lg font-black text-emerald-900 uppercase tracking-widest" style={fonts.heading}>Recent Activities</h2>
        </div>

        <div className="flex items-center gap-3">
          <CustomSelect
            value={filterType}
            onChange={(val) => { setFilterType(val); setCurrentPage(1); }}
            options={[
              { value: "all", label: "Filter Type" },
              { value: "earn", label: "Earned" },
              { value: "redeem", label: "Redeemed" }
            ]}
          />
          <CustomSelect
            value={sortBy}
            onChange={(val) => { setSortBy(val); setCurrentPage(1); }}
            options={[
              { value: "newest", label: "Sort By" },
              { value: "oldest", label: "Oldest First" },
              { value: "amount_high", label: "Highest Points" },
              { value: "amount_low", label: "Lowest Points" }
            ]}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-stone-400 font-bold text-xs" style={fonts.body}>Loading activities...</p>
          </div>
        ) : displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-emerald-50 cursor-pointer transition-all duration-300 border border-transparent hover:border-emerald-100 shadow-sm"
            >
              <div className={`p-2.5 rounded-lg ${
                activity.type === "earn" ? "bg-emerald-100 text-emerald-600" :
                activity.type === "redeem_confirm" ? "bg-emerald-100 text-emerald-600" :
                "bg-amber-100 text-amber-600"
              }`}>
                {activity.type === "earn" ? <ArrowDownLeft size={18} /> :
                 activity.type === "redeem_confirm" ? <Check size={18} /> :
                 <ArrowUpRight size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-emerald-900 text-sm sm:text-base truncate" style={fonts.heading}>{activity.description}</h3>
                <p className="text-[10px] sm:text-xs text-stone-400 font-bold uppercase tracking-widest mt-0.5" style={fonts.body}>
                  {formatDate(activity.date)}
                </p>
              </div>
              <div className={`font-black text-sm sm:text-lg ${
                activity.type === "earn" || activity.type === "redeem_confirm" ? "text-emerald-600" : "text-amber-600"
              }`} style={fonts.data}>
                {activity.amount > 0 ? "+" : ""}{activity.amount}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-stone-400 font-bold text-xs" style={fonts.body}>No activities</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-emerald-50 flex items-center justify-center">
        <div className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-full border border-stone-100 shadow-inner">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-1.5 rounded-full text-emerald-600 disabled:text-stone-300 transition-all hover:bg-stone-200"><ChevronLeft size={16} /></button>
          <div className="flex items-center gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${currentPage === i + 1 ? "bg-emerald-600 text-white shadow-md scale-110" : "bg-transparent text-emerald-800 hover:bg-stone-200"
                  }`}
                style={fonts.data}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-1.5 rounded-full text-emerald-600 disabled:text-stone-300 transition-all hover:bg-stone-200"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {selectedActivity && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedActivity(null)} />

          <div className="relative w-full max-w-[340px] max-h-[85vh] overflow-hidden flex flex-col bg-white shadow-2xl animate-in zoom-in-95 duration-300 receipt-container">
            {/* Top Perforation Mockup */}
            <div className="w-full h-1 flex justify-around pointer-events-none opacity-20">
              {[...Array(20)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-stone-500 -mt-1" />)}
            </div>

            {/* Receipt Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-8 pb-10 flex flex-col items-center text-center">
              <div className="mb-6 w-full px-4">
                <div className="w-40 h-16 mx-auto mb-4 relative flex items-center justify-center">
                  <img src="/logo-elements.png" alt="EcoPoints Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl font-bold text-stone-800 tracking-tighter" style={fonts.heading}>ECOPOINTS</h1>
                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Official Transaction</p>
              </div>

              <div className="w-full border-t border-dashed border-stone-200 my-4" />

              <div className="w-full space-y-4 text-left">
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Description</span>
                  <span className="text-xs font-bold text-stone-700 text-right" style={fonts.body}>{selectedActivity.description}</span>
                </div>
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Date</span>
                  <span className="text-xs font-mono text-stone-700">{formatDate(selectedActivity.date)}</span>
                </div>
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Time</span>
                  <span className="text-xs font-mono text-stone-700">{formatTime(selectedActivity.date)}</span>
                </div>
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Location</span>
                  <span className="text-xs font-bold text-stone-700 text-right leading-tight max-w-[150px]" style={fonts.body}>{selectedActivity.location}</span>
                </div>
                {selectedActivity.bottles > 0 && (
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Qty Recycled</span>
                    <span className="text-xs font-mono font-black text-stone-700">{selectedActivity.bottles} Units</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">Reference</span>
                  <span className="text-xs font-mono text-stone-500 overflow-hidden truncate max-w-[120px]">{selectedActivity.reference}</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-stone-200 my-6" />

              <div className="w-full flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest">Points Total</span>
                <span className={`text-2xl font-black ${
                  selectedActivity.amount > 0 || selectedActivity.type === "redeem_confirm" ? "text-emerald-600" : "text-amber-600"
                }`} style={fonts.data}>
                  {selectedActivity.amount > 0 ? "+" : ""}{selectedActivity.amount}
                </span>
              </div>

              <div className="mt-8 space-y-2">
                <p className="text-[10px] font-mono text-stone-400 uppercase leading-relaxed">Thank you for helping us keep the campus green!</p>
                <p className="text-[9px] font-mono text-emerald-600 font-bold italic">Verification Code: ECO-{selectedActivity.id}{selectedActivity.bottles || 0}</p>
              </div>

              {/* Barcode Mockup */}
              <div className="mt-6 flex gap-1 items-center justify-center opacity-40">
                {[...Array(15)].map((_, i) => <div key={i} className="bg-stone-800" style={{ width: i % 4 === 0 ? '4px' : '2px', height: '24px' }} />)}
              </div>
            </div>

            {/* Bottom Jagged Edge */}
            <div className="w-full h-4 bg-white relative flex-shrink-0" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute -bottom-12 left-0 right-0 py-2 text-white/80 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1 group"
            >
              <Scissors size={12} className="group-hover:rotate-12 transition-transform" />
              Close Receipt
            </button>
          </div>
        </div>,
        document.body
      )}

      <style jsx>{`
        .receipt-container {
          filter: drop-shadow(0 20px 50px rgba(0,0,0,0.2));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .animate-in { animation: animate-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes animate-in { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
