"use client";

import { useState } from "react";

function HowItWorksModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/5 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="glass-effect relative w-full max-w-4xl overflow-hidden rounded-xl shadow-2xl shadow-on-surface/10 flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2 text-on-surface-variant hover:bg-surface-container-highest transition-all rounded-full active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        
        {/* Sidebar / Visual Hero Section */}
        <div className="hidden md:flex w-1/3 bg-primary-container/40 p-8 flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="text-primary font-black tracking-widest text-sm uppercase mb-4">EcoPoints</div>
            <h2 className="text-4xl font-black text-on-primary-container leading-tight">Start Your Impact Today.</h2>
          </div>
          <div className="relative z-10">
            <p className="text-on-secondary-container font-medium text-lg leading-relaxed">Join thousands of students turning waste into rewards.</p>
          </div>
          {/* Abstract Organic Shape Decoration */}
          <div className="absolute bottom-[-20%] left-[-20%] w-[150%] h-[150%] opacity-20 pointer-events-none">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.1,-69.2,69.5,-57.4,77.3,-43.8C85.1,-30.3,89.3,-15.1,88.4,-0.5C87.5,14.1,81.5,28.2,73.1,40.8C64.7,53.4,53.8,64.5,41.1,72.4C28.4,80.3,14.2,84.9,-0.6,85.9C-15.4,87,-30.8,84.5,-44.6,77.2C-58.4,70,-70.6,58,-78.3,44.1C-86,30.2,-89.2,14.4,-88.4,0.4C-87.6,-13.5,-82.9,-27.1,-75,-39.8C-67.1,-52.5,-56.1,-64.4,-43.1,-71.9C-30.1,-79.4,-15,-82.5,0.4,-83.2C15.8,-83.9,31.4,-83.6,44.7,-76.4Z" fill="#006947" transform="translate(100 100)"></path>
            </svg>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-on-surface mb-1">How It Works</h1>
              <p className="text-on-surface-variant text-base">Follow these simple steps to start earning EcoPoints for every recycled container.</p>
            </div>
            
            {/* Roadmap Steps */}
            <div className="space-y-4 relative">
              {/* Step 1 */}
              <div className="group flex items-start gap-4 p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-high transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-lg shadow-primary/20">1</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">qr_code_scanner</span>
                    <h3 className="font-bold text-on-surface text-lg">Scan QR</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm">Find a kiosk and scan your personal ID on the mobile app to link your session.</p>
                </div>
              </div>
              {/* Step 2 */}
              <div className="group flex items-start gap-4 p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-high transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-lg shadow-primary/20">2</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">recycling</span>
                    <h3 className="font-bold text-on-surface text-lg">Insert Bottle</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm">Place your clean plastic bottles or cans into the intake slot.</p>
                </div>
              </div>
              {/* Step 3 */}
              <div className="group flex items-start gap-4 p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-high transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-lg shadow-primary/20">3</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-tertiary text-xl">stars</span>
                    <h3 className="font-bold text-on-surface text-lg">Earn Points</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm">Watch your balance grow! Points are calculated instantly based on container type.</p>
                </div>
              </div>
              {/* Step 4 */}
              <div className="group flex items-start gap-4 p-4 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-high transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-lg shadow-primary/20">4</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-secondary text-xl">redeem</span>
                    <h3 className="font-bold text-on-surface text-lg">Redeem</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm">Exchange points for campus rewards, coffee vouchers, or meal discounts.</p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button onClick={onClose} className="flex-1 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-black text-base py-4 px-8 rounded-xl active:scale-95 transition-transform shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                Continue
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-on-surface-variant/70 font-medium">
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
      <div className="glass-card rounded-2xl p-8 border border-white/50 shadow-xl shadow-emerald-900/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-4 flex flex-col md:flex-row lg:flex-col items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-black text-3xl border-4 border-white shadow-lg">AR</div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-on-surface-variant hover:text-primary transition-colors shadow-md">
                <span className="material-symbols-outlined text-sm">settings</span>
              </button>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black text-on-surface tracking-tight mb-1">Alex Rivers</h2>
              <p className="text-sm font-bold text-on-surface-variant mb-4">@arivers</p>
              <div className="flex gap-2 justify-center md:justify-start">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">Active Member</span>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 text-primary font-bold text-xs hover:underline">
                  <span className="material-symbols-outlined text-base">help</span>
                  How It Works
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Available Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-primary">2,450</span>
                  <span className="text-lg font-bold text-primary/70">pts</span>
                </div>
              </div>
              <div className="bg-tertiary-container/20 rounded-2xl p-6 border border-tertiary-container/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-2">Total Redeemed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-tertiary">500</span>
                  <span className="text-lg font-bold text-tertiary/70">pts</span>
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
