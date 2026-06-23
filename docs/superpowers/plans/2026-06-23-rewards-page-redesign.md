# Rewards Page Redesign Implementation Plan

> **For agentic workers:** Use `executing-plans` to implement this plan task-by-task.

**Goal:** Replace the current Rewards page UI with a new design featuring a 3×3 product grid with floating image cards, a multi-step checkout flow (variant selection → order summary → QR success), a live pending-claims pill panel, and a real QRCodeCanvas ticket.

**Architecture:** All changes are confined to two client files — `Rewards.jsx` (full rewrite) and `HowItWorksModal.jsx` (add `mode` prop). No backend changes. API calls use existing endpoints: `getAll()`, `redeem()`, `getMyRedemptions()`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, `qrcode.react` v4.2 (`QRCodeCanvas`), Lucide React, existing `useAuth` context.

---

## API shapes (reference)

**Reward object** (from `api.rewards.getAll()`):
```js
{
  id, name, description, category, pointsRequired, imageUrl, isActive,
  stockQuantity, // total across all variants
  variants: [{ id, varietyName, stockQuantity, pointsRequired, imageUrl, isActive }]
}
```

**Redemption object** (returned by `api.rewards.redeem()`):
```js
{
  id, rewardId, variantId, rewardName, variantName,
  pointsSpent, status, redemptionCode, redeemedAt, timestamp
}
```

**My-redemptions item** (from `api.rewards.getMyRedemptions()`):
```js
{
  id, rewardName, variantName, pointsSpent,
  status,            // 'pending' | 'claimed'
  redemptionCode, redeemedAt, claimedAt, timestamp
}
```

---

## File Map

| File | Action |
|---|---|
| `client/src/components/pages/Rewards.jsx` | Full rewrite |
| `client/src/components/shared/HowItWorksModal.jsx` | Add `mode` prop (`"earn"` / `"redeem"`) |

No other files change. `ProfileSection.jsx` and `RedeemHistory.jsx` are read-only reference.

---

## Task 1: Update HowItWorksModal with `mode` prop

**Files:**
- Modify: `client/src/components/shared/HowItWorksModal.jsx`

**What:** Add a `mode` prop defaulting to `"earn"`. When `mode="redeem"`, render the 3-step landscape roadmap from the new design. When `mode="earn"` (default), keep the existing 4-step layout so `ProfileSection.jsx` is unaffected.

- [ ] **Step 1: Replace HowItWorksModal.jsx**

```jsx
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
            <h2 className="text-3xl md:text-4xl font-black text-[#064E3B] mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              How to Redeem
            </h2>
            <p className="text-[#6B7280] font-medium text-lg" style={{ fontFamily: "'Quicksand', sans-serif" }}>
              Follow these simple steps to claim your physical items.
            </p>
          </div>

          <div className="relative mb-12">
            <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-1.5 bg-[#F0FDF4] z-0 rounded-full">
              <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] w-full rounded-full opacity-50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                { step: 1, title: "Configure & Checkout", desc: "Select your item variations and quantity, then proceed to review your order summary." },
                { step: 2, title: "Get Your QR Ticket", desc: "A unique Redemption QR Code will be generated after confirming your checkout." },
                { step: 3, title: "Visit the Admin Kiosk", desc: "Present your QR Ticket to the EcoPoints Admin Desk at the cafeteria to collect your items!" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center group bg-white">
                  <div
                    className="w-14 h-14 rounded-full bg-[#10B981] text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.4)] mb-6 group-hover:scale-110 transition-transform"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {item.step}
                  </div>
                  <h4 className="font-bold text-[#064E3B] text-xl mb-3" style={{ fontFamily: "'Fredoka', sans-serif" }}>{item.title}</h4>
                  <p className="text-sm text-[#6B7280] leading-relaxed px-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>{item.desc}</p>
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

  // mode === "earn" — existing layout preserved exactly
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#064e3b]/40 backdrop-blur-sm" />
      <div
        className="relative bg-white/90 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] flex flex-col md:flex-row border border-white"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 text-slate-400 hover:text-slate-800 transition-colors bg-white/50 rounded-full backdrop-blur-sm">
          <X size={24} />
        </button>
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-[#10b981] to-[#064e3b] p-8 flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <div className="text-[#34d399] font-black tracking-widest text-sm uppercase mb-4" style={{ fontFamily: "'Quicksand', sans-serif" }}>EcoPoints</div>
            <h2 className="text-4xl font-black text-white leading-tight" style={{ fontFamily: "'Fredoka', sans-serif" }}>Start Your Impact Today.</h2>
          </div>
          <div className="relative z-10">
            <p className="text-white/80 font-medium text-lg leading-relaxed" style={{ fontFamily: "'Quicksand', sans-serif" }}>Join thousands of students turning waste into rewards.</p>
          </div>
          <div className="absolute bottom-[-40%] right-[-40%] w-[80%] h-[80%] bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-white/5 rounded-full pointer-events-none" />
        </div>
        <div className="flex-1 p-6 md:p-8 overflow-y-auto no-scrollbar">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-black text-[#064e3b] mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>How It Works</h1>
              <p className="text-slate-500 text-base" style={{ fontFamily: "'Quicksand', sans-serif" }}>Follow these simple steps to start earning EcoPoints for every recycled container.</p>
            </div>
            <div className="space-y-3">
              {[
                { num: 1, icon: "qr_code_scanner", title: "Scan QR", desc: "Find a kiosk and scan your personal ID on the mobile app to link your session." },
                { num: 2, icon: "recycling", title: "Insert Bottle", desc: "Place your clean plastic bottles or cans into the intake slot." },
                { num: 3, icon: "stars", title: "Earn Points", desc: "Watch your balance grow! Points are calculated instantly based on container type." },
                { num: 4, icon: "redeem", title: "Redeem", desc: "Browse the rewards catalog and exchange your points for awesome prizes!" },
              ].map((step) => (
                <div key={step.num} className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-[#10b981]/5 transition-colors border border-transparent hover:border-[#10b981]/10">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-lg shadow-[0_4px_12px_rgba(16,185,129,0.3)]">{step.num}</div>
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
            <div className="mt-8">
              <button onClick={onClose} className="w-full bg-[#064e3b] text-white font-bold text-base py-4 px-8 rounded-xl hover:bg-[#0a6c53] transition-all shadow-[0_10px_20px_rgba(6,78,59,0.25)] hover:-translate-y-1 flex items-center justify-center gap-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 font-medium" style={{ fontFamily: "'Quicksand', sans-serif" }}>By continuing, you agree to our sustainability pledge.</p>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
```

---

## Task 2: Rewrite Rewards.jsx — skeleton, state, data fetching

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx`

**What:** Replace the file content from the top through all state declarations and data-fetching effects. Remove FLIP animation state, L-shape filter state, old direct-redeem handlers. Wire up new checkout flow state and pending claims state.

- [ ] **Step 1: Replace the file with the new skeleton (top section through all state + effects)**

```jsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useDebounce } from "../../utils/useDebounce";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import HowItWorksModal from "../shared/HowItWorksModal";
import {
  Search, ArrowLeft, Sparkles, X, ShoppingBag, Zap,
  ChevronLeft, ChevronRight, CheckCircle2, Lock,
  HelpCircle, Loader2, Ticket, AlertCircle, ArrowRight,
  Plus, Minus, QrCode, Download, Info, LogIn
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const ITEMS_PER_PAGE = 9;
const BRANDED = {
  width: 500, height: 720, padding: 40, qrSize: 260,
  bgStart: "#064E3B", bgEnd: "#059669",
  cardBg: "#ffffff", textColor: "#064E3B", subtextColor: "#6B7280",
  cornerRadius: 32,
};

// ── Helpers ──────────────────────────────────────────────────────────────
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
const loadImg = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });

// ── Header ────────────────────────────────────────────────────────────────
function RewardsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-white/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border-b border-[#10b981]/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center gap-4">
        <div className="flex-1">
          <Link href="/" className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-500 hover:text-[#064e3b] hover:bg-[#10b981]/5 transition-all duration-300">
            <ArrowLeft size={18} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="text-xs font-bold tracking-widest uppercase hidden sm:inline" style={{ fontFamily: "'Quicksand', sans-serif" }}>Back to Home</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <h1 className="text-[#064e3b] text-lg sm:text-xl font-black tracking-widest uppercase" style={{ fontFamily: "'Fredoka', sans-serif" }}>Rewards</h1>
        </div>
        <div className="flex-1 flex justify-end items-center gap-3 sm:gap-4">
          <img src="/ecopoints-logo-mark.png" alt="EcoPoints" className="h-7 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#10b981]/40 to-transparent" />
    </header>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Rewards() {
  const { currentUser, isLoading: isAuthLoading, refreshUser } = useAuth();
  const isLoggedIn = !!currentUser;
  const userPoints = currentUser?.pointsBalance ?? 0;

  // ── Product list state ──
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // ── Filter / search / pagination ──
  const [rawSearch, setRawSearch] = useState("");
  const searchQuery = useDebounce(rawSearch, 300);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Checkout flow state ──
  // Step 0 = closed | 1 = config modal | 2 = confirm modal | 3 = QR success modal
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [checkoutData, setCheckoutData] = useState(null);   // frozen at step 2
  const [redemptionResult, setRedemptionResult] = useState(null); // API response
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  // ── Auth modal (unauthenticated click) ──
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Pending claims pill ──
  const [pendingItems, setPendingItems] = useState([]);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [pendingQrItem, setPendingQrItem] = useState(null); // for QR ticket modal

  // ── How it works ──
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // ── Fetch rewards ──
  useEffect(() => {
    let cancelled = false;
    setIsProductsLoading(true);
    api.rewards.getAll()
      .then((fetched) => {
        if (cancelled) return;
        setProducts(fetched || []);
      })
      .catch((err) => console.error("Failed to fetch rewards:", err))
      .finally(() => { if (!cancelled) setIsProductsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ── Fetch pending redemptions (logged-in only) ──
  const loadPendingItems = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsPendingLoading(true);
    try {
      const all = await api.rewards.getMyRedemptions();
      setPendingItems((all || []).filter((r) => r.status === "pending" || r.status === "PENDING"));
    } catch (err) {
      console.error("Failed to fetch redemptions:", err);
    } finally {
      setIsPendingLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      refreshUser();
      loadPendingItems();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search debounce tracking ──
  useEffect(() => { setIsSearching(rawSearch !== searchQuery); }, [rawSearch, searchQuery]);

  // ── Reset page on filter change ──
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory]);

  // ── Derived: categories ──
  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["All", ...unique];
  }, [products]);

  // ── Derived: filtered + paginated ──
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
```

  // ── Derived: currently selected variant object ──
  const selectedVariant = useMemo(() => {
    if (!activeProduct) return null;
    if (!selectedVariantId) return activeProduct.variants?.[0] ?? null;
    return activeProduct.variants?.find((v) => v.id === selectedVariantId) ?? null;
  }, [activeProduct, selectedVariantId]);

  // Unit price = variant override if set, else reward base price
  const unitPrice = useMemo(() => {
    if (!activeProduct) return 0;
    if (selectedVariant?.pointsRequired != null) return selectedVariant.pointsRequired;
    return activeProduct.pointsRequired ?? 0;
  }, [activeProduct, selectedVariant]);

  const maxQty = useMemo(() => {
    if (!selectedVariant) return 1;
    const byStock = selectedVariant.stockQuantity ?? 0;
    const byPoints = unitPrice > 0 ? Math.floor(userPoints / unitPrice) : byStock;
    return Math.max(1, Math.min(byStock, byPoints));
  }, [selectedVariant, unitPrice, userPoints]);
```

---

## Task 3: Handlers — card click, checkout flow, redeem, download ticket

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation, inside the `Rewards` function)

**What:** Add all event handlers inside the component. These follow the flow: card click → step 1 (config modal) → step 2 (confirm modal) → API call → step 3 (QR success).

- [ ] **Step 1: Add handlers inside the Rewards component (after derived values)**

```jsx
  // ── Handlers ──────────────────────────────────────────────────────────

  const handleCardClick = (product) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    // pick first active variant as default
    const firstActive = product.variants?.find((v) => v.isActive !== false) ?? product.variants?.[0] ?? null;
    setActiveProduct(product);
    setSelectedVariantId(firstActive?.id ?? null);
    setSelectedQuantity(1);
    setRedeemError("");
    setCheckoutStep(1);
  };

  const handleInitiateCheckout = () => {
    if (!activeProduct || !selectedVariant) return;
    if ((selectedVariant.stockQuantity ?? 0) <= 0) return;
    const totalCost = unitPrice * selectedQuantity;
    setCheckoutData({
      product: activeProduct,
      variant: selectedVariant,
      quantity: selectedQuantity,
      unitPrice,
      totalCost,
    });
    setCheckoutStep(2);
  };

  const handleConfirmPurchase = async () => {
    if (!checkoutData) return;
    setIsRedeeming(true);
    setRedeemError("");
    try {
      const result = await api.rewards.redeem(checkoutData.product.id, {
        variantId: checkoutData.variant.id,
        quantity: checkoutData.quantity,
      });
      setRedemptionResult(result);
      await refreshUser();
      await loadPendingItems();
      setCheckoutStep(3);
    } catch (err) {
      setRedeemError(err?.message || "Redemption failed. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCloseCheckout = () => {
    setCheckoutStep(0);
    setActiveProduct(null);
    setCheckoutData(null);
    setRedemptionResult(null);
    setRedeemError("");
  };

  // Download QR ticket using canvas (mirrors ProfileSection.downloadTicketQR)
  const downloadTicket = useCallback(async (item) => {
    const qrCanvas = document.getElementById("checkout-qr-canvas");
    if (!qrCanvas) return;
    const { width: W, height: H, padding: P, qrSize, bgStart, bgEnd, cardBg, textColor, subtextColor, cornerRadius: R } = BRANDED;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgStart); grad.addColorStop(1, bgEnd);
    drawRoundedRect(ctx, 0, 0, W, H, R); ctx.fillStyle = grad; ctx.fill();
    const cX = P / 2, cY = P / 2, cW = W - P, cH = H - P - 60;
    drawRoundedRect(ctx, cX, cY, cW, cH, R - 8); ctx.fillStyle = cardBg; ctx.fill();
    drawRoundedRect(ctx, cX, cY, cW, cH, R - 8); ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 1; ctx.stroke();
    let logoEndY = cY + 50;
    try {
      const logo = await loadImg("/ecopoints-logo-mark.png");
      const lW = Math.min(200, logo.width), lH = logo.height * (lW / logo.width);
      ctx.drawImage(logo, (W - lW) / 2, cY + 20, lW, lH);
      logoEndY = cY + 20 + lH;
    } catch {
      ctx.font = "700 22px Fredoka, sans-serif"; ctx.fillStyle = textColor; ctx.textAlign = "center";
      ctx.fillText("EcoPoints", W / 2, cY + 50); logoEndY = cY + 60;
    }
    const sepY = logoEndY + 12;
    ctx.beginPath(); ctx.moveTo(cX + 40, sepY); ctx.lineTo(cX + cW - 40, sepY);
    ctx.strokeStyle = "rgba(16,185,129,0.2)"; ctx.lineWidth = 1; ctx.stroke();
    const pad = 14, box = qrSize + pad * 2;
    const bX = (W - box) / 2, bY = sepY + 18;
    drawRoundedRect(ctx, bX, bY, box, box, 16); ctx.fillStyle = "#f8fafc"; ctx.fill();
    drawRoundedRect(ctx, bX, bY, box, box, 16); ctx.strokeStyle = "rgba(16,185,129,0.15)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.drawImage(qrCanvas, bX + pad, bY + pad, qrSize, qrSize);
    const nameLabel = item.rewardName + (item.variantName && item.variantName !== "Default" ? ` (${item.variantName})` : "");
    const rY = bY + box + 28;
    ctx.font = "800 20px Fredoka, sans-serif"; ctx.fillStyle = textColor; ctx.textAlign = "center";
    ctx.fillText(nameLabel, W / 2, rY);
    const codeY = rY + 30;
    ctx.font = "700 13px Space Mono, monospace";
    const cm = ctx.measureText(item.redemptionCode);
    const pW = cm.width + 28, pH = 26;
    drawRoundedRect(ctx, (W - pW) / 2, codeY - 17, pW, pH, 8);
    ctx.fillStyle = "#f1f5f9"; ctx.fill();
    ctx.fillStyle = subtextColor; ctx.fillText(item.redemptionCode, W / 2, codeY);
    ctx.font = "600 11px Quicksand, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.textAlign = "center";
    ctx.fillText("Present at the claims counter", W / 2, H - 25);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `EcoPoints-Ticket-${item.redemptionCode}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, []);
```

---

## Task 4: JSX return — layout, header, user summary, search/filter

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation of return statement)

**What:** The `return (...)` of the `Rewards` component — background, header, user summary section, hero text, and the search + category filter bar.

- [ ] **Step 1: Add JSX return opening through filter bar**

```jsx
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4]/80 to-white/80 text-[#064e3b] selection:bg-[#34d399] selection:text-white relative pb-32 overflow-x-hidden">

      <style>{`
        .font-fredoka { font-family: 'Fredoka', sans-serif; }
        .font-quicksand { font-family: 'Quicksand', sans-serif; }
        .font-space-mono { font-family: 'Space Mono', monospace; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <RewardsHeader />

      {/* PENDING CLAIMS PILL — fixed right side, logged-in only */}
      {isLoggedIn && (
        <div
          className={`fixed top-[20%] right-0 z-40 transition-transform duration-500 ease-in-out ${isPendingOpen ? "translate-x-0" : "translate-x-[calc(100%-48px)]"}`}
        >
          <div className="bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] border border-slate-100 rounded-l-3xl flex h-[60vh] max-h-[600px] min-h-[400px]">
            {/* Tab */}
            <button
              onClick={() => setIsPendingOpen(!isPendingOpen)}
              className="w-12 bg-[#FBBF24] text-[#064E3B] rounded-l-3xl flex flex-col items-center justify-center gap-4 hover:bg-[#FDE68A] transition-colors relative z-10"
            >
              <Ticket size={20} className="-rotate-90" />
              <span
                style={{ writingMode: "vertical-rl", fontFamily: "'Fredoka', sans-serif" }}
                className="font-bold tracking-wider rotate-180 py-4 text-sm"
              >
                Pending Claims
              </span>
              {pendingItems.length > 0 && (
                <div
                  className="w-6 h-6 bg-[#064E3B] rounded-full flex items-center justify-center text-white font-black text-xs mt-2 shadow-md"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  {pendingItems.length}
                </div>
              )}
            </button>

            {/* Panel content */}
            <div className="w-80 p-6 bg-white overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-black text-xl text-[#064E3B] flex items-center gap-2 font-fredoka">
                  <Ticket size={20} className="text-[#10B981]" /> Pending Items
                </h3>
                <button
                  onClick={() => setIsPendingOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto hide-scrollbar">
                {isPendingLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 size={28} className="animate-spin text-emerald-400" />
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center pb-10">
                    <ShoppingBag size={40} className="mb-3 opacity-30" />
                    <p className="font-medium text-sm font-quicksand">No items waiting to be claimed.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-4">
                    {pendingItems.map((item) => (
                      <div key={item.id} className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#F0FDF4] shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div
                            className="text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-1 rounded-md border border-[#10B981]/20"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            {item.redemptionCode}
                          </div>
                          <div className="text-xs text-slate-500 font-medium font-quicksand">
                            {new Date(item.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                          </div>
                        </div>
                        <h4 className="font-bold text-[#064E3B] leading-tight mb-1 font-fredoka">
                          {item.rewardName}
                          {item.variantName && item.variantName !== "Default" ? ` · ${item.variantName}` : ""}
                        </h4>
                        <button
                          onClick={() => setPendingQrItem(item)}
                          className="w-full py-2.5 bg-white border border-[#34D399] text-[#059669] text-sm font-bold rounded-xl hover:bg-[#F0FDF4] transition-colors flex items-center justify-center gap-2 shadow-sm font-fredoka"
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

      {/* MAIN CONTENT */}
      <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-16">

        {/* User summary */}
        <div className="mt-4 mb-12 bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#10b981]/10 rounded-full mb-4 border border-[#10b981]/20">
                <Sparkles className="w-4 h-4 text-[#10b981]" />
                <span className="text-[#10b981] text-sm font-bold uppercase tracking-widest font-quicksand">Rewards Catalog</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#064e3b] mb-2 font-fredoka tracking-tight">
                Exchange Impact for{" "}
                <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">Rewards</span>
              </h2>
              <p className="text-slate-600 max-w-xl font-quicksand">Browse our curated collection of eco-friendly goods and campus perks. Redeem your EcoPoints today!</p>
            </div>

            {isLoggedIn && (
              <div className="flex flex-col sm:flex-row xl:flex-col gap-4 items-start xl:items-end">
                <div className="bg-white/90 p-4 rounded-2xl border border-[#F0FDF4] shadow-sm flex flex-wrap items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] text-white flex items-center justify-center font-black text-lg font-fredoka border-2 border-white shadow">
                    {currentUser?.name?.substring(0, 2).toUpperCase() || "EP"}
                  </div>
                  <div>
                    <p className="font-bold text-[#064e3b] leading-none font-fredoka text-sm">{currentUser?.name || "User"}</p>
                    <p className="text-xs text-slate-400 font-space-mono">@{currentUser?.username || "user"}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                  <div className="flex gap-6">
                    <div>
                      <p className="text-[10px] font-black text-[#10b981] uppercase tracking-wide font-quicksand">Balance</p>
                      {isAuthLoading
                        ? <div className="h-5 w-16 bg-slate-200 animate-pulse rounded" />
                        : <p className="font-black text-[#064e3b] text-sm font-space-mono">{userPoints.toLocaleString()} EP</p>
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-[#F0FDF4] text-[#064e3b] font-bold rounded-2xl hover:border-[#34D399] hover:bg-[#F0FDF4]/50 transition-all shadow-sm font-quicksand text-sm"
                >
                  <Info size={16} className="text-[#10b981]" /> How to Redeem?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search + category filter */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-[#F0FDF4] mb-8">
          <div className="flex w-full lg:w-auto overflow-x-auto hide-scrollbar gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl font-fredoka font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[#10B981] text-white shadow-md"
                    : "bg-[#F8FAFC] text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#059669]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 shrink-0">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </div>
            <input
              type="text"
              placeholder="Search rewards..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 text-[#064E3B] pl-11 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all font-quicksand"
            />
            {rawSearch && (
              <button onClick={() => setRawSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
```

---

## Task 5: JSX — Product grid (3×3, floating image cards)

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation)

**What:** The product grid with the floating-image card design. Each card has an image or ShoppingBag icon floating above it (`-top-16`). Button text adapts to auth state and affordability.

- [ ] **Step 1: Add product grid and pagination**

```jsx
        {/* Product grid */}
        {isProductsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 mb-20">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="mt-12 bg-white rounded-[2rem] p-6 pt-20 border border-[#F0FDF4] h-64 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="font-fredoka font-bold text-xl text-[#064E3B]">No rewards found</h3>
            <p className="text-[#6B7280] font-quicksand">Try adjusting your search or category filter.</p>
            <button onClick={() => { setRawSearch(""); setSelectedCategory("All"); }} className="mt-4 text-[#10B981] font-bold font-quicksand hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 mb-16">
              {currentProducts.map((product) => {
                const isAffordable = !isLoggedIn || userPoints >= (product.pointsRequired ?? 0);
                const isOutOfStock = (product.stockQuantity ?? 0) <= 0;
                const hasImage = product.imageUrl && (
                  product.imageUrl.includes(".jpg") ||
                  product.imageUrl.includes(".jpeg") ||
                  product.imageUrl.includes(".png") ||
                  product.imageUrl.includes(".webp") ||
                  product.imageUrl.startsWith("/uploads")
                );

                return (
                  <div key={product.id} className="relative group mt-12 w-full">
                    <div className="bg-white rounded-[2rem] p-6 pt-20 border border-[#F0FDF4] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-[#34D399]/50 transition-all duration-500 flex flex-col h-full">

                      {/* Floating image */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-6 group-hover:scale-110 z-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[#34D399] rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        {hasImage ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)] transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full">
                            <ShoppingBag size={64} strokeWidth={1.5} className="text-emerald-600/50" />
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="text-center mb-4 flex-grow pointer-events-none">
                        <div className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2 font-quicksand">{product.category}</div>
                        <h3 className="font-bold text-xl text-[#064E3B] mb-2 font-fredoka">{product.name}</h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed font-quicksand line-clamp-2">{product.description}</p>
                      </div>

                      {/* Price + button */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center pointer-events-none">
                          <span className="font-semibold text-slate-500 text-sm font-quicksand">Cost</span>
                          <div className="font-space-mono font-bold text-xl text-[#10B981] flex items-center gap-1">
                            <Zap size={16} fill="#10B981" /> {(product.pointsRequired ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCardClick(product)}
                          disabled={isLoggedIn && (isOutOfStock || !isAffordable)}
                          className={`w-full py-3 rounded-xl font-bold font-fredoka transition-all flex items-center justify-center gap-2 ${
                            !isLoggedIn
                              ? "bg-[#F8FAFC] text-[#064E3B] border border-slate-200 hover:bg-[#F0FDF4] hover:border-[#10B981]"
                              : isOutOfStock
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : isAffordable
                                  ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          {!isLoggedIn ? (
                            <><LogIn size={16} /> Sign in to Redeem</>
                          ) : isOutOfStock ? (
                            <><X size={16} /> Out of Stock</>
                          ) : isAffordable ? (
                            <>Redeem Item</>
                          ) : (
                            <><Lock size={16} /> Need {((product.pointsRequired ?? 0) - userPoints).toLocaleString()} more EP</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-[#064E3B] hover:border-[#10B981] hover:bg-[#F0FDF4] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-bold font-space-mono text-[#6B7280]">
                  Page <span className="text-[#10B981]">{currentPage}</span> of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-[#064E3B] hover:border-[#10B981] hover:bg-[#F0FDF4] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>{/* end max-w container */}
```

---

## Task 6: JSX — Modal 1: Product configuration (variants + quantity)

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation, inside return)

**What:** Step 1 of the checkout: shows product image, variant selector (out-of-stock variants greyed), quantity stepper bounded by stock and points balance, subtotal, and "Proceed to Checkout".

- [ ] **Step 1: Add configuration modal**

```jsx
      {/* ─── MODAL 1: Product configuration ─── */}
      {checkoutStep === 1 && activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full shadow-2xl relative border border-[#F0FDF4]">
            <button onClick={handleCloseCheckout} className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] rounded-full transition-colors">
              <X size={24} />
            </button>

            {/* Product image / icon */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-32 h-32 mb-4 flex items-center justify-center">
                {activeProduct.imageUrl && (activeProduct.imageUrl.includes(".") || activeProduct.imageUrl.startsWith("/uploads")) ? (
                  <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-full h-full object-contain drop-shadow-xl" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full">
                    <ShoppingBag size={64} strokeWidth={1.5} className="text-emerald-600/50" />
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2">{activeProduct.name}</h2>
              <p className="text-[#6B7280] font-medium text-sm font-quicksand">{activeProduct.description}</p>
            </div>

            <div className="space-y-6">
              {/* Variant selector */}
              {activeProduct.variants && activeProduct.variants.filter((v) => v.isActive !== false && v.varietyName !== "Default").length > 0 && (
                <div>
                  <h4 className="font-bold font-fredoka text-[#064E3B] mb-3">Select Variation</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeProduct.variants.filter((v) => v.isActive !== false && v.varietyName !== "Default").map((v) => {
                      const outOfStock = (v.stockQuantity ?? 0) <= 0;
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => { setSelectedVariantId(v.id); setSelectedQuantity(1); }}
                          disabled={outOfStock}
                          title={outOfStock ? "Out of stock" : ""}
                          className={`px-4 py-2 rounded-xl font-medium font-quicksand text-sm border-2 transition-all relative ${
                            outOfStock
                              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                              : isSelected
                                ? "border-[#10B981] bg-[#F0FDF4] text-[#059669]"
                                : "border-slate-100 bg-white text-[#6B7280] hover:border-slate-300"
                          }`}
                        >
                          {v.varietyName}
                          {outOfStock && <span className="absolute -top-2 -right-2 text-[9px] bg-slate-400 text-white px-1 rounded-full">sold out</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity stepper */}
              <div>
                <h4 className="font-bold font-fredoka text-[#064E3B] mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="font-space-mono font-bold text-xl w-8 text-center text-[#064E3B]">{selectedQuantity}</span>
                  <button
                    onClick={() => setSelectedQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={selectedQuantity >= maxQty}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {selectedQuantity >= maxQty && maxQty > 0 && (
                  <p className="text-xs text-amber-500 font-bold mt-2 font-quicksand">Maximum quantity reached for your balance.</p>
                )}
              </div>

              {/* Summary + checkout button */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-500 font-quicksand">Subtotal:</span>
                  <span className="font-space-mono font-bold text-2xl text-[#10B981]">
                    {(unitPrice * selectedQuantity).toLocaleString()} EP
                  </span>
                </div>
                <button
                  onClick={handleInitiateCheckout}
                  disabled={!selectedVariant || (selectedVariant.stockQuantity ?? 0) <= 0}
                  className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold font-fredoka rounded-xl shadow-md hover:shadow-lg transition-all text-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
```

---

## Task 7: JSX — Modal 2: Order summary / confirmation

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation)

**What:** Step 2 — ledger showing balance before/after, warning, confirm button that calls the API.

- [ ] **Step 1: Add confirmation modal**

```jsx
      {/* ─── MODAL 2: Order summary ─── */}
      {checkoutStep === 2 && checkoutData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl relative border border-[#F0FDF4] flex flex-col">
            <button onClick={handleCloseCheckout} className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] rounded-full transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2 pr-8">Order Summary</h2>
            <p className="text-[#6B7280] font-medium text-sm mb-6 font-quicksand">Please review your redemption details below.</p>

            {/* Item detail */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 flex gap-4 items-center mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shrink-0">
                {checkoutData.product.imageUrl ? (
                  <img src={checkoutData.product.imageUrl} alt={checkoutData.product.name} className="w-full h-full object-contain" />
                ) : (
                  <ShoppingBag size={32} strokeWidth={1.5} className="text-emerald-600/50" />
                )}
              </div>
              <div>
                <h4 className="font-bold font-fredoka text-[#064E3B] leading-tight mb-1">{checkoutData.product.name}</h4>
                {checkoutData.variant.varietyName !== "Default" && (
                  <p className="text-xs text-slate-500 font-medium mb-1 font-quicksand">Variation: {checkoutData.variant.varietyName}</p>
                )}
                <p className="text-xs font-space-mono text-[#10B981] font-bold">Qty: {checkoutData.quantity}</p>
              </div>
            </div>

            {/* Ledger */}
            <div className="space-y-3 border-y border-slate-100 py-5 mb-6 font-space-mono">
              <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                <span>Current Balance</span>
                <span>{userPoints.toLocaleString()} EP</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-rose-500">
                <span>Order Cost</span>
                <span>−{checkoutData.totalCost.toLocaleString()} EP</span>
              </div>
              <div className="h-px w-full bg-slate-100" />
              <div className="flex justify-between items-center font-bold text-lg text-[#064E3B]">
                <span className="font-fredoka">Remaining Balance</span>
                <span>{(userPoints - checkoutData.totalCost).toLocaleString()} EP</span>
              </div>
            </div>

            {/* Warning */}
            <div className="flex gap-3 items-start bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200/50 mb-6 text-sm font-medium leading-relaxed font-quicksand">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
              <p>Please review carefully. Once confirmed, <strong>transactions cannot be cancelled or refunded.</strong></p>
            </div>

            {redeemError && (
              <p className="text-sm text-rose-500 font-bold mb-4 font-quicksand">{redeemError}</p>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setCheckoutStep(1)}
                className="flex-1 py-4 bg-slate-100 text-[#6B7280] font-bold font-fredoka rounded-xl hover:bg-slate-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isRedeeming || userPoints < checkoutData.totalCost}
                className="flex-[2] py-4 bg-[#10B981] text-white font-bold font-fredoka rounded-xl shadow-md hover:bg-[#059669] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedeeming && <Loader2 size={18} className="animate-spin" />}
                {isRedeeming ? "Processing..." : "Confirm Redemption"}
              </button>
            </div>
          </div>
        </div>
      )}
```

---

## Task 8: JSX — Modal 3: QR success + pending QR ticket + auth modal + HowItWorks

**Files:**
- Modify: `client/src/components/pages/Rewards.jsx` (continuation — final modals and closing tags)

**What:** The success/QR modal (step 3), the pending-item QR ticket modal, the auth modal, and the HowItWorksModal invocation. Close the JSX return and export.

- [ ] **Step 1: Add remaining modals and close the component**

```jsx
      {/* ─── MODAL 3: QR Success ─── */}
      {checkoutStep === 3 && redemptionResult && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#064E3B]/90 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center">
            <button onClick={handleCloseCheckout} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} />
            </button>

            {/* Animated success icon */}
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full mx-auto flex items-center justify-center text-[#10B981] mb-6 relative">
              <div className="absolute inset-0 border-4 border-[#10B981] rounded-full animate-ping opacity-20" />
              <CheckCircle2 size={40} />
            </div>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2">Redemption Successful!</h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-4 inline-block">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1 font-quicksand">Redemption Code</span>
              <span className="font-space-mono font-bold text-[#064E3B] text-xl">{redemptionResult.redemptionCode}</span>
            </div>

            <p className="text-[#6B7280] font-medium mb-8 font-quicksand">Present this QR code to the EcoPoints Admin Desk to claim your items.</p>

            {/* Real QR code */}
            <div className="bg-white p-4 border-2 border-dashed border-[#34D399] rounded-2xl inline-block mb-8">
              <QRCodeCanvas
                id="checkout-qr-canvas"
                value={`REDEEM:${redemptionResult.redemptionCode}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#064e3b"
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => downloadTicket(redemptionResult)}
                className="w-full py-4 bg-[#F0FDF4] text-[#059669] border border-[#34D399]/30 font-bold font-fredoka rounded-xl hover:bg-[#34D399]/20 transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
                <Download size={20} /> Download Ticket
              </button>
              <button
                onClick={handleCloseCheckout}
                className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] shadow-md transition-colors"
              >
                Return to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Pending item QR ticket ─── */}
      {pendingQrItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center">
            <button onClick={() => setPendingQrItem(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black font-fredoka text-[#064E3B] mb-2 mt-4">Claim Ticket</h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-6 inline-block mt-2">
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1 font-quicksand">Redemption Code</span>
              <span className="font-space-mono font-bold text-[#064E3B] text-xl">{pendingQrItem.redemptionCode}</span>
            </div>

            <div className="bg-white p-4 border-2 border-dashed border-[#34D399] rounded-2xl inline-block mb-6">
              <QRCodeCanvas
                id="checkout-qr-canvas"
                value={`REDEEM:${pendingQrItem.redemptionCode}`}
                size={200}
                bgColor="#ffffff"
                fgColor="#064e3b"
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="text-left bg-[#F0FDF4] p-5 rounded-2xl mb-8 border border-[#34D399]/30">
              <h4 className="font-bold text-[#064E3B] font-fredoka text-lg leading-tight mb-2">
                {pendingQrItem.rewardName}
                {pendingQrItem.variantName && pendingQrItem.variantName !== "Default" ? ` · ${pendingQrItem.variantName}` : ""}
              </h4>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 font-quicksand border-t border-[#10B981]/20 pt-2 mt-2">
                <span>Status: Pending</span>
                <span>{new Date(pendingQrItem.redeemedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</span>
              </div>
            </div>

            <button
              onClick={() => downloadTicket(pendingQrItem)}
              className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] shadow-md transition-colors flex justify-center items-center gap-2"
            >
              <Download size={20} /> Save QR Ticket
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL: Auth required ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative text-center z-10">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 text-[#6B7280] hover:bg-slate-100 rounded-full">
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-[#10B981]/30">
              <LogIn size={32} />
            </div>
            <h2 className="text-2xl font-black font-fredoka text-[#064E3B] mb-2">Sign In Required</h2>
            <p className="text-[#6B7280] font-medium mb-8 font-quicksand">You need an active EcoPoints account to redeem rewards.</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="w-full py-4 bg-[#064E3B] text-white font-bold font-fredoka rounded-xl hover:bg-[#065F46] transition-colors shadow-md block text-center"
                onClick={() => setShowAuthModal(false)}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── How It Works ─── */}
      {isHowItWorksOpen && (
        <HowItWorksModal onClose={() => setIsHowItWorksOpen(false)} mode="redeem" />
      )}
    </div>
  );
}
```

> **Note on `QRCodeCanvas` id collision:** When both the success QR and a pending-item QR are never open at the same time (they are mutually exclusive), sharing the id `"checkout-qr-canvas"` is safe. The `downloadTicket` function reads whichever canvas is in the DOM at that moment. This mirrors `ProfileSection.jsx`'s approach.

---

## Self-Review Checklist

### Spec coverage

| Requirement | Task |
|---|---|
| 3×3 grid, 9 items/page | Task 5 |
| Floating image card (illusion art), img from server, ShoppingBag fallback | Task 5 |
| Category filter (horizontal pill row, derived from API) | Task 4 |
| Debounced search | Task 2 |
| Variant selector (greyed + "sold out" badge when stockQuantity ≤ 0) | Task 6 |
| Quantity stepper bounded by stock and point balance | Task 6 |
| Order summary modal with ledger | Task 7 |
| Real `QRCodeCanvas` on success (same pattern as RedeemHistory + ProfileSection) | Task 8 |
| `downloadTicket` using canvas (same pattern as ProfileSection) | Task 3 |
| API call `redeem(id, { variantId, quantity })` | Task 3 |
| `refreshUser()` + reload pending after redeem | Task 3 |
| Pending claims pill (fixed right, slide-out, logged-in only) | Task 4 |
| Pending items from `getMyRedemptions()` filtered to `status=pending` | Task 2 |
| QR ticket modal for pending items | Task 8 |
| Auth modal (unauthenticated click) | Task 8 |
| HowItWorksModal with `mode="redeem"` (new 3-step roadmap) | Task 1, Task 8 |
| `mode="earn"` keeps ProfileSection unaffected | Task 1 |
| Remove all mock data | ✅ No mock data anywhere |
| No DB changes | ✅ Frontend only |

### Placeholder check
No TBDs, TODOs, or "fill in later" — all code blocks are complete.

### Type consistency
- `product.pointsRequired` (not `product.points`) — consistent throughout. The mapping `points: p.pointsRequired` from the old component is removed; all references use `product.pointsRequired` directly.
- `variant.varietyName` (not `variation.name`) — matches server shape.
- `redemptionResult.redemptionCode` — matches `_serialize_reward_log` return shape.
- `downloadTicket(item)` called with both `redemptionResult` (step 3) and `pendingQrItem` — both have `.redemptionCode` and `.rewardName`.

---

## Execution

Plan saved to `docs/superpowers/plans/2026-06-23-rewards-page-redesign.md`.

**Tasks 1–8 are sequential** (each modifies the same 2 files). Inline execution is the right approach here — no parallel dispatch needed.

Ready to implement?
