import React from "react";
import { X, ArrowRight, Info } from "lucide-react";

export default function HowItWorksModal({ onClose, mode = "earn" }) {
  if (mode === "redeem") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/40 backdrop-blur-sm"
        style={{ animation: "scaleIn 0.2s ease-out forwards" }}
      >
        <div
          className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-4xl w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#065F46] rounded-full transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-[#F0FDF4] text-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Info size={32} />
            </div>
            <h2
              className="text-3xl md:text-4xl font-black text-[#064E3B] mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              How to Redeem
            </h2>
            <p
              className="text-[#6B7280] font-medium text-lg"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Follow these simple steps to claim your physical items.
            </p>
          </div>

          <div className="relative mb-12">
            <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-1.5 bg-[#F0FDF4] z-0 rounded-full">
              <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] w-full rounded-full opacity-50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                {
                  step: 1,
                  title: "Configure & Checkout",
                  desc: "Select your item variations and quantity, then proceed to review your order summary.",
                },
                {
                  step: 2,
                  title: "Get Your QR Ticket",
                  desc: "A unique Redemption QR Code will be generated after confirming your checkout.",
                },
                {
                  step: 3,
                  title: "Visit the Admin Kiosk",
                  desc: "Present your QR Ticket to the EcoPoints Admin Desk at the cafeteria to collect your items!",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex flex-col items-center text-center group bg-white"
                >
                  <div
                    className="w-14 h-14 rounded-full bg-[#10B981] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-6 group-hover:scale-110 transition-transform"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {item.step}
                  </div>
                  <h4
                    className="font-bold text-[#064E3B] text-xl mb-3"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {item.title}
                  </h4>
                  <p
                    className="text-sm text-[#6B7280] leading-relaxed px-2"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full max-w-md mx-auto block py-4 bg-[#F8FAFC] text-[#064E3B] font-bold rounded-xl hover:bg-[#F0FDF4] hover:text-[#059669] transition-colors border border-slate-100"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Got it, I&apos;m ready!
          </button>
        </div>

        <style>{`
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // mode === "earn" — existing layout preserved
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#064e3b]/40 backdrop-blur-sm" />
      <div
        className="relative bg-white/90 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex flex-col md:flex-row border border-white"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 text-slate-400 hover:text-slate-800 transition-colors bg-white/50 rounded-full backdrop-blur-sm"
        >
          <X size={24} />
        </button>

        {/* Sidebar */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-[#10b981] to-[#064e3b] p-8 flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div
              className="text-[#34d399] font-black tracking-widest text-sm uppercase mb-4"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              EcoPoints
            </div>
            <h2
              className="text-4xl font-black text-white leading-tight"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Start Your Impact Today.
            </h2>
          </div>
          <div className="relative z-10">
            <p
              className="text-white/80 font-medium text-lg leading-relaxed"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Join thousands of students turning waste into rewards.
            </p>
          </div>
          <div className="absolute bottom-[-40%] right-[-40%] w-[80%] h-[80%] bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <h1
                className="text-2xl font-black text-[#064e3b] mb-1"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                How It Works
              </h1>
              <p
                className="text-slate-500 text-base"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Follow these simple steps to start earning EcoPoints for every recycled container.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  num: 1,
                  icon: "qr_code_scanner",
                  title: "Scan QR",
                  desc: "Find a kiosk and scan your personal ID on the mobile app to link your session.",
                },
                {
                  num: 2,
                  icon: "recycling",
                  title: "Insert Bottle",
                  desc: "Place your clean plastic bottles or cans into the intake slot.",
                },
                {
                  num: 3,
                  icon: "stars",
                  title: "Earn Points",
                  desc: "Watch your balance grow! Points are calculated instantly based on container type.",
                },
                {
                  num: 4,
                  icon: "redeem",
                  title: "Redeem",
                  desc: "Browse the rewards catalog and exchange your points for awesome prizes!",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#10b981]/5 transition-colors border border-transparent hover:border-[#10b981]/10"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                    {step.num}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#10b981] text-xl">
                        {step.icon}
                      </span>
                      <h3
                        className="font-bold text-[#064e3b] text-lg"
                        style={{ fontFamily: "'Fredoka', sans-serif" }}
                      >
                        {step.title}
                      </h3>
                    </div>
                    <p
                      className="text-slate-500 text-sm"
                      style={{ fontFamily: "'Quicksand', sans-serif" }}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

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
            <p
              className="mt-4 text-center text-xs text-slate-400 font-medium"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              By continuing, you agree to our sustainability pledge.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
