"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "../../utils/useDebounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import HowItWorksModal from "../shared/HowItWorksModal";
import Footer from "../website/Footer";
import {
  Search,
  Sparkles,
  X,
  ShoppingBag,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Loader2,
  Ticket,
  AlertCircle,
  ArrowRight,
  Plus,
  Minus,
  QrCode,
  Download,
  Info,
  LogIn,
  Gift,
  Home,
  Trophy,
  UserIcon,
  ChevronDown,
  LogOut,
  Menu,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const ITEMS_PER_PAGE = 9;
const BRANDED = {
  width: 500,
  height: 720,
  padding: 40,
  qrSize: 260,
  bgStart: "#064E3B",
  bgEnd: "#059669",
  cardBg: "#ffffff",
  textColor: "#064E3B",
  subtextColor: "#6B7280",
  cornerRadius: 32,
};

// ── Helpers ──────────────────────────────────────────────────────────────
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// API origin for server-hosted uploads (reward images live at
// `<origin>/uploads/rewards/...`, served from the server root — NOT under /api/web).
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Does this URL point to a real image we can render?
function isImageUrl(url) {
  if (!url) return false;
  return (
    url.startsWith("/uploads") ||
    url.startsWith("http") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
  );
}

// Resolve a reward imageUrl to a browser-loadable src.
// Absolute http(s) URLs pass through; server-relative /uploads paths get the
// API origin prefix; anything else (e.g. a /public client asset) is returned as-is.
function resolveImageUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/uploads")) return `${API_ORIGIN}${url}`;
  return url;
}

// Reward image with graceful fallback: renders the product image, and if it
// is missing or fails to load (404, broken file), falls back to a floating
// ShoppingBag icon instead of the browser's broken-image glyph.
function ProductImage({ url, alt, iconSize = 64, imgClassName = "", bareFallback = false }) {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(url);
  const showImg = isImageUrl(url) && src && !failed;

  if (showImg) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    );
  }
  if (bareFallback) {
    return (
      <ShoppingBag
        size={iconSize}
        strokeWidth={1.5}
        className="text-emerald-600/50"
      />
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 rounded-full">
      <ShoppingBag
        size={iconSize}
        strokeWidth={1.5}
        className="text-emerald-600/50"
      />
    </div>
  );
}

// ── Header (floating pill — matches Profile page) ─────────────────────────
function RewardsHeader({ hidden = false }) {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, isInitialized, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll-responsive background
  useEffect(() => {
    let prev = false;
    const onScroll = () => {
      const val = window.scrollY > 50;
      if (val !== prev) {
        prev = val;
        setScrolled(val);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const nav = [
    { label: "Home", icon: Home, onClick: () => { setIsDropdownOpen(false); router.push("/"); } },
    { label: "Profile", icon: UserIcon, onClick: () => { setIsDropdownOpen(false); router.push("/profile"); } },
    { label: "Leaderboard", icon: Trophy, onClick: () => { setIsDropdownOpen(false); router.push("/leaderboard"); } },
  ];

  if (hidden) return null;

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-3xl w-[95%] max-w-[1200px] transition-all duration-700 ease-out ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] py-3 px-4 md:px-6"
            : "bg-transparent py-3 px-4 md:px-6"
        }`}
      >
        <div className="flex justify-between items-center">
          {/* Left: Logo — scroll to top */}
          <div
            className="flex items-center cursor-pointer group flex-1"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img
              src="/logo-elements.png"
              alt="EcoPoints"
              className="h-9 w-auto sm:hidden transition-all duration-300 ease-in-out group-hover:scale-110"
            />
            <img
              src="/ecopoints-logo-mark.png"
              alt="EcoPoints Logo"
              className="hidden sm:block h-10 md:h-12 w-auto transition-all duration-300 ease-in-out group-hover:scale-110"
            />
          </div>

          {/* Center: Page Title */}
          <div className="flex items-center gap-2 select-none">
            <Gift size={25} className="text-[#10b981]" strokeWidth={2.5} />
            <span
              className="font-black text-[#064e3b] tracking-wide"
              style={{ fontFamily: "'Fredoka'", fontSize: "25px" }}
            >
              Rewards
            </span>
          </div>

          {/* Right: Profile Button + Dropdown */}
          <div className="flex-1 flex justify-end relative" ref={dropdownRef}>
            {isInitialized && currentUser ? (
              <div className="flex items-center gap-3">
                {/* Mobile: hamburger */}
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  type="button"
                  className="sm:hidden flex items-center justify-center w-9 h-9 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 transition-all duration-300 cursor-pointer shadow-sm"
                >
                  <Menu size={18} className="text-slate-600" />
                </button>

                {/* sm+: full profile button */}
                <button
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  type="button"
                  className="hidden sm:flex items-center gap-2.5 px-3 sm:px-4 py-2 bg-white border border-slate-200/80 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center text-white font-black text-xs shadow-inner select-none">
                    {initials}
                  </div>
                  <div
                    className="text-left font-bold text-xs max-w-[120px] truncate text-slate-700"
                    style={{ fontFamily: "'Quicksand'" }}
                  >
                    {currentUser.name}
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-300 group-hover:text-slate-600 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-xl border border-slate-100 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.12)] p-2 z-[1001] flex flex-col gap-1">
                    <div className="px-3 py-2 text-left">
                      <p className="text-xs font-black text-slate-800" style={{ fontFamily: "'Fredoka'" }}>
                        {currentUser.name}
                      </p>
                      <p
                        className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mt-0.5"
                        style={{ fontFamily: "'Quicksand'" }}
                      >
                        {currentUser.role ? currentUser.role.replace("_", " ") : "User"}
                      </p>
                    </div>
                    <div className="h-[1px] bg-slate-100 my-1 mx-2" />

                    {nav.map(({ label, icon: Icon, onClick }) => (
                      <button
                        key={label}
                        onClick={onClick}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer w-full"
                        style={{ fontFamily: "'Quicksand'" }}
                      >
                        <Icon size={14} className="text-slate-400" />
                        {label}
                      </button>
                    ))}

                    <div className="h-[1px] bg-slate-100 my-1 mx-2" />

                    <button
                      onClick={() => { setIsDropdownOpen(false); setShowLogoutConfirm(true); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors text-xs font-bold cursor-pointer border-none bg-transparent w-full"
                      style={{ fontFamily: "'Quicksand'" }}
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : isInitialized ? (
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2.5 bg-gradient-to-r from-[#10b981] to-[#34d399] border-none rounded-full text-white font-semibold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:-translate-y-[2px] hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] text-sm"
                style={{ fontFamily: "'Quicksand'" }}
              >
                Login
              </button>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            )}
          </div>
        </div>
      </nav>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
          />
          <div
            className="relative bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl z-10 text-center"
            style={{ animation: "scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black mb-2" style={{ fontFamily: "'Fredoka'", color: "#064E3B" }}>
              Log Out?
            </h3>
            <p
              className="text-sm font-semibold mb-6 leading-relaxed"
              style={{ fontFamily: "'Quicksand'", color: "#6B7280" }}
            >
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                style={{ fontFamily: "'Quicksand'" }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Quicksand'" }}
              >
                {isLoggingOut && <Loader2 size={14} className="animate-spin" />}
                Log Out
              </button>
            </div>
          </div>
          <style>{`
            @keyframes scaleIn {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Rewards() {
  const { currentUser, isLoading: isAuthLoading, refreshUser } = useAuth();
  const isLoggedIn = !!currentUser;
  const userPoints = currentUser?.pointsBalance ?? 0;

  // ── Product list ──
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  // ── Filter / search / pagination ──
  const [rawSearch, setRawSearch] = useState("");
  const searchQuery = useDebounce(rawSearch, 300);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Checkout flow (0=closed | 1=config | 2=confirm | 3=QR success) ──
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [checkoutData, setCheckoutData] = useState(null);
  const [redemptionResult, setRedemptionResult] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");

  // ── Auth modal ──
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Pending claims pill ──
  const [pendingItems, setPendingItems] = useState([]);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const [pendingQrItem, setPendingQrItem] = useState(null);

  // ── Footer visibility (to hide the pending pill over the footer) ──
  const footerRef = useRef(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // ── How it works ──
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // ── Fetch rewards ──
  useEffect(() => {
    let cancelled = false;
    setIsProductsLoading(true);
    api.rewards
      .getAll()
      .then((fetched) => {
        if (cancelled) return;
        setProducts(fetched || []);
      })
      .catch((err) => console.error("Failed to fetch rewards:", err))
      .finally(() => {
        if (!cancelled) setIsProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fetch pending redemptions ──
  const loadPendingItems = useCallback(async () => {
    if (!isLoggedIn) return;
    setIsPendingLoading(true);
    try {
      const all = await api.rewards.getMyRedemptions();
      setPendingItems(
        (all || []).filter(
          (r) => r.status === "pending" || r.status === "PENDING"
        )
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // ── Search debounce tracking ──
  useEffect(() => {
    setIsSearching(rawSearch !== searchQuery);
  }, [rawSearch, searchQuery]);

  // ── Reset page on filter change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // ── Hide pending pill when footer scrolls into view ──
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoggedIn]);

  // ── Derived: categories ──
  const categories = useMemo(() => {
    const unique = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    return ["All", ...unique];
  }, [products]);

  // ── Derived: filtered + paginated ──
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q);
      const matchCat =
        selectedCategory === "All" || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  );
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ── Derived: selected variant ──
  const selectedVariant = useMemo(() => {
    if (!activeProduct) return null;
    if (!selectedVariantId)
      return activeProduct.variants?.[0] ?? null;
    return (
      activeProduct.variants?.find((v) => v.id === selectedVariantId) ?? null
    );
  }, [activeProduct, selectedVariantId]);

  // Unit price = variant override if set, else reward base price
  const unitPrice = useMemo(() => {
    if (!activeProduct) return 0;
    if (selectedVariant?.pointsRequired != null)
      return selectedVariant.pointsRequired;
    return activeProduct.pointsRequired ?? 0;
  }, [activeProduct, selectedVariant]);

  const maxQty = useMemo(() => {
    if (!selectedVariant) return 1;
    const byStock = selectedVariant.stockQuantity ?? 0;
    const byPoints =
      unitPrice > 0 ? Math.floor(userPoints / unitPrice) : byStock;
    return Math.max(1, Math.min(byStock, byPoints));
  }, [selectedVariant, unitPrice, userPoints]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCardClick = (product) => {
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    const firstActive =
      product.variants?.find((v) => v.isActive !== false) ??
      product.variants?.[0] ??
      null;
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
    const {
      width: W,
      height: H,
      padding: P,
      qrSize,
      bgStart,
      bgEnd,
      cardBg,
      textColor,
      subtextColor,
      cornerRadius: R,
    } = BRANDED;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgStart);
    grad.addColorStop(1, bgEnd);
    drawRoundedRect(ctx, 0, 0, W, H, R);
    ctx.fillStyle = grad;
    ctx.fill();

    const cX = P / 2,
      cY = P / 2,
      cW = W - P,
      cH = H - P - 60;
    drawRoundedRect(ctx, cX, cY, cW, cH, R - 8);
    ctx.fillStyle = cardBg;
    ctx.fill();
    drawRoundedRect(ctx, cX, cY, cW, cH, R - 8);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();

    let logoEndY = cY + 50;
    try {
      const logo = await loadImg("/ecopoints-logo-mark.png");
      const lW = Math.min(200, logo.width),
        lH = logo.height * (lW / logo.width);
      ctx.drawImage(logo, (W - lW) / 2, cY + 20, lW, lH);
      logoEndY = cY + 20 + lH;
    } catch {
      ctx.font = "700 22px Fredoka, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("EcoPoints", W / 2, cY + 50);
      logoEndY = cY + 60;
    }

    const sepY = logoEndY + 12;
    ctx.beginPath();
    ctx.moveTo(cX + 40, sepY);
    ctx.lineTo(cX + cW - 40, sepY);
    ctx.strokeStyle = "rgba(16,185,129,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const pad = 14,
      box = qrSize + pad * 2;
    const bX = (W - box) / 2,
      bY = sepY + 18;
    drawRoundedRect(ctx, bX, bY, box, box, 16);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    drawRoundedRect(ctx, bX, bY, box, box, 16);
    ctx.strokeStyle = "rgba(16,185,129,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.drawImage(qrCanvas, bX + pad, bY + pad, qrSize, qrSize);

    const nameLabel =
      item.rewardName +
      (item.variantName && item.variantName !== "Default"
        ? ` (${item.variantName})`
        : "");
    const rY = bY + box + 28;
    ctx.font = "800 20px Fredoka, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(nameLabel, W / 2, rY);

    const codeY = rY + 30;
    ctx.font = "700 13px Space Mono, monospace";
    const cm = ctx.measureText(item.redemptionCode);
    const pW = cm.width + 28,
      pH = 26;
    drawRoundedRect(ctx, (W - pW) / 2, codeY - 17, pW, pH, 8);
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();
    ctx.fillStyle = subtextColor;
    ctx.fillText(item.redemptionCode, W / 2, codeY);

    ctx.font = "600 11px Quicksand, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.fillText("Present at the claims counter", W / 2, H - 25);

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `EcoPoints-Ticket-${item.redemptionCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4]/80 to-white/80 text-[#064e3b] selection:bg-[#34d399] selection:text-white relative overflow-x-hidden">

      <style>{`
        .font-fredoka  { font-family: 'Fredoka', sans-serif; }
        .font-quicksand { font-family: 'Quicksand', sans-serif; }
        .font-space-mono { font-family: 'Space Mono', monospace; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <RewardsHeader
        hidden={
          checkoutStep !== 0 ||
          !!pendingQrItem ||
          showAuthModal ||
          isHowItWorksOpen
        }
      />

      {/* ═══ PENDING CLAIMS PILL — fixed right, logged-in only, hidden over footer ═══ */}
      {isLoggedIn && !isFooterVisible && (
        <div
          className={`fixed top-[20%] right-0 z-40 transition-transform duration-500 ease-in-out ${
            isPendingOpen
              ? "translate-x-0"
              : "translate-x-[calc(100%-48px)]"
          }`}
        >
          <div className="bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.15)] border border-slate-100 rounded-l-3xl flex h-[60vh] max-h-[600px] min-h-[400px]">
            {/* Tab */}
            <button
              onClick={() => setIsPendingOpen(!isPendingOpen)}
              className="w-12 bg-[#FBBF24] text-[#064E3B] rounded-l-3xl flex flex-col items-center justify-center gap-4 hover:bg-[#FDE68A] transition-colors relative z-10"
            >
              <Ticket size={20} className="-rotate-90" />
              <span
                style={{
                  writingMode: "vertical-rl",
                  fontFamily: "'Fredoka', sans-serif",
                }}
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

            {/* Panel */}
            <div className="w-80 p-6 bg-white overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3
                  className="font-black text-xl text-[#064E3B] flex items-center gap-2"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
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
                    <Loader2
                      size={28}
                      className="animate-spin text-emerald-400"
                    />
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center pb-10">
                    <ShoppingBag size={40} className="mb-3 opacity-30" />
                    <p
                      className="font-medium text-sm"
                      style={{ fontFamily: "'Quicksand', sans-serif" }}
                    >
                      No items waiting to be claimed.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 pb-4">
                    {pendingItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#F0FDF4] shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div
                            className="text-[10px] font-bold text-[#10B981] bg-[#F0FDF4] px-2 py-1 rounded-md border border-[#10B981]/20 truncate max-w-[120px]"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            {item.redemptionCode}
                          </div>
                          <div
                            className="text-xs text-slate-500 font-medium"
                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                          >
                            {new Date(item.redeemedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </div>
                        <h4
                          className="font-bold text-[#064E3B] leading-tight mb-3"
                          style={{ fontFamily: "'Fredoka', sans-serif" }}
                        >
                          {item.rewardName}
                          {item.variantName && item.variantName !== "Default"
                            ? ` · ${item.variantName}`
                            : ""}
                        </h4>
                        <button
                          onClick={() => setPendingQrItem(item)}
                          className="w-full py-2.5 bg-white border border-[#34D399] text-[#059669] text-sm font-bold rounded-xl hover:bg-[#F0FDF4] transition-colors flex items-center justify-center gap-2 shadow-sm"
                          style={{ fontFamily: "'Fredoka', sans-serif" }}
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

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-[1200px] mx-auto px-6 pt-24 pb-16">

        {/* User summary + hero */}
        <div className="mt-4 mb-10 bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#10b981]/10 rounded-full mb-4 border border-[#10b981]/20">
                <Sparkles className="w-4 h-4 text-[#10b981]" />
                <span
                  className="text-[#10b981] text-sm font-bold uppercase tracking-widest"
                  style={{ fontFamily: "'Quicksand', sans-serif" }}
                >
                  Rewards Catalog
                </span>
              </div>
              <h2
                className="text-4xl md:text-5xl font-black text-[#064e3b] mb-2 tracking-tight"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Exchange Impact for{" "}
                <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">
                  Rewards
                </span>
              </h2>
              <p
                className="text-slate-600 max-w-xl"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Browse our curated collection of eco-friendly goods and campus
                perks. Redeem your EcoPoints today!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row xl:flex-col gap-4 items-start xl:items-end shrink-0">
              {isLoggedIn && (
                <div className="bg-white/90 p-4 rounded-2xl border border-[#F0FDF4] shadow-sm flex flex-wrap items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] text-white flex items-center justify-center font-black text-lg border-2 border-white shadow"
                    style={{ fontFamily: "'Fredoka', sans-serif" }}
                  >
                    {currentUser?.name?.substring(0, 2).toUpperCase() || "EP"}
                  </div>
                  <div>
                    <p
                      className="font-bold text-[#064e3b] leading-none text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      {currentUser?.name || "User"}
                    </p>
                    <p
                      className="text-xs text-slate-400"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      @{currentUser?.username || "user"}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                  <div>
                    <p
                      className="text-[10px] font-black text-[#10b981] uppercase tracking-wide"
                      style={{ fontFamily: "'Quicksand', sans-serif" }}
                    >
                      Balance
                    </p>
                    {isAuthLoading ? (
                      <div className="h-5 w-16 bg-slate-200 animate-pulse rounded" />
                    ) : (
                      <p
                        className="font-black text-[#064e3b] text-sm"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {userPoints.toLocaleString()} EP
                      </p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white border border-[#F0FDF4] text-[#064e3b] font-bold rounded-2xl hover:border-[#34D399] hover:bg-[#F0FDF4]/50 transition-all shadow-sm text-sm"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                <Info size={18} className="text-[#10b981]" /> How to Redeem?
              </button>
            </div>
          </div>
        </div>

        {/* Search + category filter */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-[#F0FDF4] mb-10">
          <div className="flex w-full lg:w-auto overflow-x-auto hide-scrollbar gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[#10B981] text-white shadow-md"
                    : "bg-[#F8FAFC] text-[#6B7280] hover:bg-[#F0FDF4] hover:text-[#059669]"
                }`}
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 shrink-0">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
              {isSearching ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
            </div>
            <input
              type="text"
              placeholder="Search rewards..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-slate-200 text-[#064E3B] pl-11 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-[#10B981]/50 focus:border-[#10B981] transition-all"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            />
            {rawSearch && (
              <button
                onClick={() => setRawSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ═══ PRODUCT GRID ═══ */}
        {isProductsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 mb-20">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="mt-12 bg-white rounded-[2rem] p-6 pt-20 border border-[#F0FDF4] h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-300">
            <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4" />
            <h3
              className="font-bold text-xl text-[#064E3B]"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {products.length === 0
                ? "No rewards available yet"
                : "No rewards found"}
            </h3>
            <p
              className="text-[#6B7280] mb-4"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              {products.length === 0
                ? "Check back later — new items will be added soon."
                : "Try adjusting your search or category filter."}
            </p>
            {products.length > 0 && (rawSearch || selectedCategory !== "All") && (
              <button
                onClick={() => {
                  setRawSearch("");
                  setSelectedCategory("All");
                }}
                className="text-[#10B981] font-bold hover:underline"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20 mb-16">
              {currentProducts.map((product) => {
                const isAffordable =
                  !isLoggedIn || userPoints >= (product.pointsRequired ?? 0);
                const isOutOfStock = (product.stockQuantity ?? 0) <= 0;

                return (
                  <div key={product.id} className="relative group mt-12 w-full">
                    <div className="bg-white rounded-[2rem] p-6 pt-20 border border-[#F0FDF4] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] hover:border-[#34D399]/50 transition-all duration-500 flex flex-col h-full">

                      {/* Floating image */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-6 group-hover:scale-110 z-20 pointer-events-none">
                        <div className="absolute inset-0 bg-[#34D399] rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        <ProductImage
                          url={product.imageUrl}
                          alt={product.name}
                          iconSize={64}
                          imgClassName="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_20px_25px_rgba(0,0,0,0.25)] transition-all duration-500"
                        />
                      </div>

                      {/* Card body */}
                      <div className="text-center mb-4 flex-grow pointer-events-none">
                        <div
                          className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-2"
                          style={{ fontFamily: "'Quicksand', sans-serif" }}
                        >
                          {product.category}
                        </div>
                        <h3
                          className="font-bold text-xl text-[#064E3B] mb-2"
                          style={{ fontFamily: "'Fredoka', sans-serif" }}
                        >
                          {product.name}
                        </h3>
                        <p
                          className="text-sm text-[#6B7280] leading-relaxed line-clamp-2"
                          style={{ fontFamily: "'Quicksand', sans-serif" }}
                        >
                          {product.description}
                        </p>
                      </div>

                      {/* Price + button */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center pointer-events-none">
                          <span
                            className="font-semibold text-slate-500 text-sm"
                            style={{ fontFamily: "'Quicksand', sans-serif" }}
                          >
                            Cost
                          </span>
                          <div
                            className="font-bold text-xl text-[#10B981] flex items-center gap-1"
                            style={{ fontFamily: "'Space Mono', monospace" }}
                          >
                            <Zap size={16} fill="#10B981" />
                            {(product.pointsRequired ?? 0).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCardClick(product)}
                          disabled={isLoggedIn && (isOutOfStock || !isAffordable)}
                          className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                            !isLoggedIn
                              ? "bg-[#F8FAFC] text-[#064E3B] border border-slate-200 hover:bg-[#F0FDF4] hover:border-[#10B981]"
                              : isOutOfStock
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : isAffordable
                                  ? "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                          style={{ fontFamily: "'Fredoka', sans-serif" }}
                        >
                          {!isLoggedIn ? (
                            <>
                              <LogIn size={16} /> Sign in to Redeem
                            </>
                          ) : isOutOfStock ? (
                            <>
                              <X size={16} /> Out of Stock
                            </>
                          ) : isAffordable ? (
                            <>Redeem Item</>
                          ) : (
                            <>
                              <Lock size={16} /> Need{" "}
                              {(
                                (product.pointsRequired ?? 0) - userPoints
                              ).toLocaleString()}{" "}
                              more EP
                            </>
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
                <div
                  className="font-bold text-[#6B7280]"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Page{" "}
                  <span className="text-[#10B981]">{currentPage}</span> of{" "}
                  {totalPages}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      {/* ═══ FOOTER ═══ */}
      <div ref={footerRef}>
        <Footer />
      </div>

      {/* ═══ MODAL 1: Product configuration ═══ */}
      {checkoutStep === 1 && activeProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-lg w-full shadow-2xl relative border border-[#F0FDF4]">
            <button
              onClick={handleCloseCheckout}
              className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {/* Product image */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-32 h-32 mb-4 flex items-center justify-center">
                <ProductImage
                  url={activeProduct.imageUrl}
                  alt={activeProduct.name}
                  iconSize={64}
                  imgClassName="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              <h2
                className="text-3xl font-black text-[#064E3B] mb-2"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {activeProduct.name}
              </h2>
              <p
                className="text-[#6B7280] font-medium text-sm"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                {activeProduct.description}
              </p>
            </div>

            <div className="space-y-6">
              {/* Variant selector — only if variants exist beyond the Default one */}
              {activeProduct.variants &&
                activeProduct.variants.filter(
                  (v) => v.isActive !== false && v.varietyName !== "Default"
                ).length > 0 && (
                  <div>
                    <h4
                      className="font-bold text-[#064E3B] mb-3"
                      style={{ fontFamily: "'Fredoka', sans-serif" }}
                    >
                      Select Variation
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.variants
                        .filter(
                          (v) =>
                            v.isActive !== false && v.varietyName !== "Default"
                        )
                        .map((v) => {
                          const outOfStock = (v.stockQuantity ?? 0) <= 0;
                          const isSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                setSelectedVariantId(v.id);
                                setSelectedQuantity(1);
                              }}
                              disabled={outOfStock}
                              title={outOfStock ? "Out of stock" : ""}
                              className={`relative px-4 py-2 rounded-xl font-medium text-sm border-2 transition-all ${
                                outOfStock
                                  ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                                  : isSelected
                                    ? "border-[#10B981] bg-[#F0FDF4] text-[#059669]"
                                    : "border-slate-100 bg-white text-[#6B7280] hover:border-slate-300"
                              }`}
                              style={{ fontFamily: "'Quicksand', sans-serif" }}
                            >
                              {v.varietyName}
                              {outOfStock && (
                                <span className="absolute -top-2 -right-2 text-[9px] bg-slate-400 text-white px-1 rounded-full leading-tight">
                                  sold out
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Quantity stepper */}
              <div>
                <h4
                  className="font-bold text-[#064E3B] mb-3"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  Quantity
                </h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      setSelectedQuantity((q) => Math.max(1, q - 1))
                    }
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span
                    className="font-bold text-xl w-8 text-center text-[#064E3B]"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {selectedQuantity}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedQuantity((q) => Math.min(maxQty, q + 1))
                    }
                    disabled={selectedQuantity >= maxQty}
                    className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-[#064E3B] hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {selectedQuantity >= maxQty && maxQty > 0 && (
                  <p
                    className="text-xs text-amber-500 font-bold mt-2"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Maximum quantity reached for your balance.
                  </p>
                )}
              </div>

              {/* Subtotal + proceed */}
              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span
                    className="font-bold text-slate-500"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Subtotal:
                  </span>
                  <span
                    className="font-bold text-2xl text-[#10B981]"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {(unitPrice * selectedQuantity).toLocaleString()} EP
                  </span>
                </div>
                <button
                  onClick={handleInitiateCheckout}
                  disabled={
                    !selectedVariant ||
                    (selectedVariant.stockQuantity ?? 0) <= 0
                  }
                  className="w-full py-4 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: Order summary / confirmation ═══ */}
      {checkoutStep === 2 && checkoutData && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 max-w-md w-full shadow-2xl relative border border-[#F0FDF4] flex flex-col">
            <button
              onClick={handleCloseCheckout}
              className="absolute top-6 right-6 p-2 text-[#6B7280] hover:bg-[#F0FDF4] rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <h2
              className="text-3xl font-black text-[#064E3B] mb-2 pr-8"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Order Summary
            </h2>
            <p
              className="text-[#6B7280] font-medium text-sm mb-6"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Please review your redemption details below.
            </p>

            {/* Item detail */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 flex gap-4 items-center mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center shrink-0">
                <ProductImage
                  url={checkoutData.product.imageUrl}
                  alt={checkoutData.product.name}
                  iconSize={32}
                  bareFallback
                  imgClassName="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4
                  className="font-bold text-[#064E3B] leading-tight mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  {checkoutData.product.name}
                </h4>
                {checkoutData.variant.varietyName !== "Default" && (
                  <p
                    className="text-xs text-slate-500 font-medium mb-1"
                    style={{ fontFamily: "'Quicksand', sans-serif" }}
                  >
                    Variation: {checkoutData.variant.varietyName}
                  </p>
                )}
                <p
                  className="text-xs text-[#10B981] font-bold"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  Qty: {checkoutData.quantity}
                </p>
              </div>
            </div>

            {/* Ledger */}
            <div
              className="space-y-3 border-y border-slate-100 py-5 mb-6"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
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
                <span style={{ fontFamily: "'Fredoka', sans-serif" }}>
                  Remaining Balance
                </span>
                <span>
                  {(userPoints - checkoutData.totalCost).toLocaleString()} EP
                </span>
              </div>
            </div>

            {/* Warning */}
            <div
              className="flex gap-3 items-start bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200/50 mb-6 text-sm font-medium leading-relaxed"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              <AlertCircle
                size={20}
                className="shrink-0 mt-0.5 text-amber-500"
              />
              <p>
                Please review carefully. Once confirmed,{" "}
                <strong>transactions cannot be cancelled or refunded.</strong>
              </p>
            </div>

            {redeemError && (
              <p
                className="text-sm text-rose-500 font-bold mb-4"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                {redeemError}
              </p>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setCheckoutStep(1)}
                className="flex-1 py-4 bg-slate-100 text-[#6B7280] font-bold rounded-xl hover:bg-slate-200 transition-colors"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Back
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isRedeeming || userPoints < checkoutData.totalCost}
                className="flex-[2] py-4 bg-[#10B981] text-white font-bold rounded-xl shadow-md hover:bg-[#059669] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {isRedeeming && <Loader2 size={18} className="animate-spin" />}
                {isRedeeming ? "Processing..." : "Confirm Redemption"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 3: QR Success ═══ */}
      {checkoutStep === 3 && redemptionResult && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-[#064E3B]/90 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleCloseCheckout}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            {/* Animated success icon */}
            <div className="w-20 h-20 bg-[#F0FDF4] rounded-full mx-auto flex items-center justify-center text-[#10B981] mb-6 relative">
              <div className="absolute inset-0 border-4 border-[#10B981] rounded-full animate-ping opacity-20" />
              <CheckCircle2 size={40} />
            </div>

            <h2
              className="text-3xl font-black text-[#064E3B] mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Redemption Successful!
            </h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-4 inline-block">
              <span
                className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Redemption Code
              </span>
              <span
                className="font-bold text-[#064E3B] text-xl"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {redemptionResult.redemptionCode}
              </span>
            </div>

            <p
              className="text-[#6B7280] font-medium mb-8"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              Present this QR code to the EcoPoints Admin Desk to claim your
              items.
            </p>

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
                className="w-full py-4 bg-[#F0FDF4] text-[#059669] border border-[#34D399]/30 font-bold rounded-xl hover:bg-[#34D399]/20 transition-colors flex justify-center items-center gap-2 shadow-sm"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                <Download size={20} /> Download Ticket
              </button>
              <button
                onClick={handleCloseCheckout}
                className="w-full py-4 bg-[#064E3B] text-white font-bold rounded-xl hover:bg-[#065F46] shadow-md transition-colors"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Return to Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Pending item QR ticket ═══ */}
      {pendingQrItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#064E3B]/80 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative text-center overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setPendingQrItem(null)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>

            <h2
              className="text-3xl font-black text-[#064E3B] mb-2 mt-4"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Claim Ticket
            </h2>

            <div className="bg-[#F8FAFC] border border-[#F0FDF4] px-6 py-2 rounded-xl mb-6 inline-block mt-2">
              <span
                className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1"
                style={{ fontFamily: "'Quicksand', sans-serif" }}
              >
                Redemption Code
              </span>
              <span
                className="font-bold text-[#064E3B] text-xl"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                {pendingQrItem.redemptionCode}
              </span>
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

            <div
              className="text-left bg-[#F0FDF4] p-5 rounded-2xl mb-8 border border-[#34D399]/30"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              <h4
                className="font-bold text-[#064E3B] text-lg leading-tight mb-2"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {pendingQrItem.rewardName}
                {pendingQrItem.variantName &&
                pendingQrItem.variantName !== "Default"
                  ? ` · ${pendingQrItem.variantName}`
                  : ""}
              </h4>
              <div className="flex justify-between items-center text-sm font-medium text-slate-600 border-t border-[#10B981]/20 pt-2 mt-2">
                <span>Status: Pending</span>
                <span>
                  {new Date(pendingQrItem.redeemedAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "2-digit", year: "numeric" }
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => downloadTicket(pendingQrItem)}
              className="w-full py-4 bg-[#064E3B] text-white font-bold rounded-xl hover:bg-[#065F46] shadow-md transition-colors flex justify-center items-center gap-2"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <Download size={20} /> Save QR Ticket
            </button>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Auth required ═══ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setShowAuthModal(false)}
          />
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative text-center z-10">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-[#6B7280] hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-[#10B981]/30">
              <LogIn size={32} />
            </div>
            <h2
              className="text-2xl font-black text-[#064E3B] mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Sign In Required
            </h2>
            <p
              className="text-[#6B7280] font-medium mb-8"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              You need an active EcoPoints account to redeem rewards.
            </p>
            <Link
              href="/login"
              className="block w-full py-4 bg-[#064E3B] text-white font-bold rounded-xl hover:bg-[#065F46] transition-colors shadow-md text-center"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
              onClick={() => setShowAuthModal(false)}
            >
              Log In
            </Link>
          </div>
        </div>
      )}

      {/* ═══ How It Works ═══ */}
      {isHowItWorksOpen && (
        <HowItWorksModal
          onClose={() => setIsHowItWorksOpen(false)}
          mode="redeem"
        />
      )}
    </div>
  );
}
