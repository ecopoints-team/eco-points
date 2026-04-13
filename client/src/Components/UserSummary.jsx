"use client";

import { useState } from "react";
import { Zap, HelpCircle, Settings, ArrowRight, X } from "lucide-react";

function HowItWorksModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#064e3b]/40 backdrop-blur-sm" />

      <div
        className="relative bg-white/90 backdrop-blur-xl w-full max-w-4xl overflow-hidden rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex flex-col md:flex-row border border-white"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 text-slate-400 hover:text-slate-800 transition-colors bg-white/50 rounded-full backdrop-blur-sm"
        >
          <X size={24} />
        </button>

        {/* Sidebar / Visual Hero */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-[#10b981] to-[#064e3b] p-8 flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="text-[#34d399] font-black tracking-widest text-sm uppercase mb-4" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              EcoPoints
            </div>
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              Start Your Impact Today.
            </h2>
          </div>
          <div className="relative z-10">
            <p className="text-white/80 font-medium text-lg leading-relaxed" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Join thousands of students turning waste into rewards.
            </p>
          </div>
          {/* Decorative circle */}
          <div className="absolute bottom-[-40%] right-[-40%] w-[80%] h-[80%] bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[#064e3b] mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>How It Works</h1>
              <p className="text-slate-500 text-base" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Follow these simple steps to start earning EcoPoints for every recycled container.
              </p>
            </div>

            {/* Roadmap Steps */}
            <div className="space-y-3">
              {[
                { num: 1, icon: "qr_code_scanner", title: "Scan QR", desc: "Find a kiosk and scan your personal ID on the mobile app to link your session." },
                { num: 2, icon: "recycling", title: "Insert Bottle", desc: "Place your clean plastic bottles or cans into the intake slot." },
                { num: 3, icon: "stars", title: "Earn Points", desc: "Watch your balance grow! Points are calculated instantly based on container type." },
                { num: 4, icon: "redeem", title: "Redeem", desc: "Exchange points for campus rewards, coffee vouchers, or meal discounts." },
              ].map((step) => (
                <div key={step.num} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#10b981]/5 transition-colors border border-transparent hover:border-[#10b981]/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                    {step.num}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#10b981] text-xl">{step.icon}</span>
                      <h3 className="font-bold text-[#064e3b] text-lg" style={{ fontFamily: "'Fredoka', sans-serif" }}>{step.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm" style={{ fontFamily: "'Quicksand', sans-serif" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Action */}
            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full bg-[#064e3b] text-white font-bold text-base py-4 px-8 rounded-xl hover:bg-[#0a6c53] transition-all shadow-[0_10px_20px_rgba(6,78,59,0.25)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(6,78,59,0.35)] flex items-center justify-center gap-2"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 font-medium" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              By continuing, you agree to our sustainability pledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserSummary() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="mb-12">
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left: User Avatar & Info */}
          <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] text-white flex items-center justify-center font-black text-3xl border-4 border-white shadow-[0_8px_24px_rgba(16,185,129,0.25)]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                AR
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-slate-400 hover:text-[#10b981] transition-colors shadow-md border border-slate-100">
                <Settings size={14} />
              </button>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black text-[#064e3b] tracking-tight mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                Alex Rivers
              </h2>
              <p className="text-sm font-bold text-slate-400 mb-4" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                @arivers
              </p>
              <div className="flex gap-2 justify-center md:justify-start flex-wrap">
                <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#10b981]/20">
                  Active Member
                </span>
                <button
                  onClick={() => setIsModalOpen(true)}
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
                  <span className="text-5xl font-black text-[#064e3b]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    2,450
                  </span>
                  <span className="text-lg font-bold text-[#10b981]" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    EP
                  </span>
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
                  <span className="text-4xl font-black text-amber-700" style={{ fontFamily: "'Space Mono', monospace" }}>
                    500
                  </span>
                  <span className="text-lg font-bold text-amber-500" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    EP
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-400" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                    Across 3 rewards
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {isModalOpen && <HowItWorksModal onClose={() => setIsModalOpen(false)} />}
    </section>
  );
}
