"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Ticket, Calendar, Eye, EyeOff, QrCode, Loader2, Search, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function MyRewards() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const [redemptions, setRedemptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revealCodeId, setRevealCodeId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (currentUser) {
      fetchRedemptions();
    }
  }, [currentUser]);

  const fetchRedemptions = async () => {
    try {
      const data = await api.rewards.getMyRedemptions();
      setRedemptions(data);
    } catch (err) {
      console.error("Failed to fetch redemptions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReveal = (id) => {
    setRevealCodeId(revealCodeId === id ? null : id);
  };

  const filteredRedemptions = redemptions.filter(rd => 
    rd.rewardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rd.redemptionCode && rd.redemptionCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isAuthLoading || (isLoading && currentUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#10b981]" />
          <span className="text-emerald-700 font-bold animate-pulse">Retrieving your vouchers...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0fdf4] px-4 text-center">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <Ticket size={40} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black text-[#064e3b] mb-4">Sign in required</h2>
        <p className="text-slate-600 mb-8 max-w-md">You need to be logged in to access your redeemed vouchers and rewards.</p>
        <Link href="/login" className="bg-[#10b981] text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0fdf4] pb-32">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/rewards" className="p-2 hover:bg-emerald-50 rounded-full text-slate-500 transition-all hover:-translate-x-1">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-black text-[#064e3b] uppercase tracking-tighter" style={{ fontFamily: "'Fredoka', sans-serif" }}>My Vouchers</h1>
          </div>
          
          <div className="relative hidden sm:block">
             <div className="bg-emerald-100/50 px-3 py-1 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-200">
                {redemptions.length} Total
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        {/* Search Bar */}
        <div className="mb-10 relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-emerald-500">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search vouchers or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-emerald-100 rounded-[2rem] py-5 pl-14 pr-6 text-[#064e3b] shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all text-lg"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-6 flex items-center text-slate-400 hover:text-emerald-500"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {redemptions.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 text-center border border-emerald-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] animate-scale-in">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
              <Ticket size={40} />
            </div>
            <h3 className="text-3xl font-black text-[#064e3b] mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>No vouchers yet</h3>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto text-lg">Your redeemed rewards will appear here. Start recycling to earn more points!</p>
            <Link href="/rewards" className="bg-[#10b981] text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-[#059669] transition-all inline-block">
              Browse Rewards
            </Link>
          </div>
        ) : filteredRedemptions.length === 0 ? (
           <div className="py-20 text-center text-slate-400">
             <Search size={48} className="mx-auto mb-4 opacity-20" />
             <p className="text-xl font-bold">No vouchers match your search</p>
           </div>
        ) : (
          <div className="grid gap-6">
            {filteredRedemptions.map((rd, index) => (
              <div 
                key={rd.id} 
                className="bg-white rounded-[2.5rem] p-8 border border-emerald-50 shadow-sm flex flex-col md:flex-row md:items-center gap-8 group hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-500 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Left: Reward Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Reward</span>
                  </div>
                  <h3 className="text-3xl font-black text-[#064e3b] mb-3 leading-none" style={{ fontFamily: "'Fredoka', sans-serif" }}>{rd.rewardName}</h3>
                  <div className="flex items-center gap-6 text-slate-400 text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-slate-300" />
                      {new Date(rd.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {rd.variantName || 'Standard'}
                    </div>
                  </div>
                </div>

                {/* Right: Code Reveal */}
                <div className="flex flex-col items-center md:items-end gap-4 flex-shrink-0">
                  <div className={`w-full md:w-auto flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-700 border ${revealCodeId === rd.id ? 'bg-emerald-50 border-emerald-200 scale-105 shadow-inner' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}>
                    <div className="flex flex-col flex-grow md:flex-grow-0 min-w-[140px]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Voucher Code</span>
                      <span className={`font-mono font-black text-2xl tracking-[0.2em] transition-all duration-700 ${revealCodeId === rd.id ? 'text-emerald-700' : 'text-slate-300 blur-md select-none'}`}>
                        {rd.redemptionCode}
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleReveal(rd.id)}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${revealCodeId === rd.id ? 'bg-emerald-200 text-emerald-700' : 'bg-white text-slate-400 shadow-sm hover:text-emerald-500 hover:scale-110'}`}
                      aria-label={revealCodeId === rd.id ? "Hide Code" : "Reveal Code"}
                    >
                      {revealCodeId === rd.id ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                  
                  {revealCodeId === rd.id && (
                    <button className="flex items-center gap-2 text-xs font-black text-emerald-600 hover:text-[#064e3b] transition-colors animate-fade-in uppercase tracking-widest">
                      <QrCode size={16} />
                      Generate Redemption QR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
