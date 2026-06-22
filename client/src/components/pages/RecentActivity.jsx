"use client";
// Recent Activity — redesigned per 3-plan.md
import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import api from "../../services/api";

// ─────────────────────────────────────────────
// Font styles
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body:    { fontFamily: "'Quicksand'" },
  data:    { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────
function resolveStatus(txnType) {
  if (txnType === "earn")            return "Deposited";
  if (txnType === "bulk_transaction") return "Rewarded";
  if (txnType === "redeem")          return "Redeemed";
  if (txnType === "redeem_confirm")  return "Claimed";
  return "Deposited";
}

function isCredit(status) {
  return status === "Deposited" || status === "Rewarded";
}

// ─────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// Custom animated dropdown (matches LeaderboardPodium style)
// ─────────────────────────────────────────────
function CustomDropdown({ icon: Icon, label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2 bg-white border px-3 py-2 font-bold text-xs text-emerald-900 whitespace-nowrap transition-all
          ${isOpen
            ? "rounded-t-lg rounded-b-none border-b-white border-emerald-200 z-[51] shadow-none"
            : "rounded-lg shadow-sm border-slate-200 hover:border-emerald-300"}`}
        style={fonts.body}
      >
        {Icon && <Icon size={13} className="text-emerald-500 flex-shrink-0" />}
        <span className="truncate max-w-[110px]">{selected?.label || label}</span>
        <ChevronDown
          size={13}
          className={`text-emerald-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.92 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.92 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute right-0 top-[calc(100%-1px)] z-50 bg-white border border-emerald-200 border-t-0 rounded-b-lg shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-hidden min-w-full"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors whitespace-nowrap
                  ${value === opt.value
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"}`}
                style={fonts.body}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Custom branded calendar picker
// ─────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function DatePickerButton({ value, onChange }) {
  const [isOpen,    setIsOpen]    = useState(false);
  const [viewYear,  setViewYear]  = useState(() => value ? new Date(value).getFullYear()  : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? new Date(value).getMonth()     : new Date().getMonth());
  const ref = useRef(null);

  // Sync view when value cleared externally
  useEffect(() => {
    if (!value) {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid (6 rows × 7 cols)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();
    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--)
      cells.push({ day: prevDays - i, current: false });
    for (let d = 1; d <= daysInMonth; d++)
      cells.push({ day: d, current: true });
    while (cells.length % 7 !== 0)
      cells.push({ day: cells.length - firstDay - daysInMonth + 1, current: false });
    return cells;
  }, [viewYear, viewMonth]);

  const selectedDate = value ? new Date(value) : null;
  const today        = new Date();

  const isSelected = (day, current) => {
    if (!current || !selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
           selectedDate.getMonth()    === viewMonth &&
           selectedDate.getDate()     === day;
  };
  const isToday = (day, current) => {
    return current &&
      today.getFullYear() === viewYear &&
      today.getMonth()    === viewMonth &&
      today.getDate()     === day;
  };

  const selectDay = (day, current) => {
    if (!current) return;
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setIsOpen(false);
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    const iso = now.toISOString().slice(0, 10);
    onChange(iso);
    setIsOpen(false);
  };

  const label = value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "All Dates";

  return (
    <div className="relative shrink-0" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`flex items-center gap-2 bg-white border px-3 py-2 font-bold text-xs text-emerald-900 whitespace-nowrap transition-all
          ${isOpen
            ? "rounded-t-lg rounded-b-none border-b-white border-emerald-200 z-[51] shadow-none"
            : "rounded-lg shadow-sm border-slate-200 hover:border-emerald-300"}`}
        style={fonts.body}
      >
        <Calendar size={13} className="text-emerald-500 flex-shrink-0" />
        <span>{label}</span>
        {value && (
          <X
            size={12}
            className="text-slate-400 hover:text-red-400 transition-colors"
            onClick={(e) => { e.stopPropagation(); onChange(""); setIsOpen(false); }}
          />
        )}
      </button>

      {/* Calendar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.92 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.92 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute right-0 top-[calc(100%-1px)] z-50 bg-white border border-emerald-200 border-t-0 rounded-b-lg shadow-[0_6px_24px_rgba(0,0,0,0.1)] overflow-hidden w-64"
          >
            {/* Inner top separator — visible line below the button join */}
            <div className="w-full border-b border-emerald-100" />
            {/* Month/Year navigation */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-sm font-black text-[#064E3B]" style={fonts.heading}>
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-md hover:bg-emerald-50 text-[#064E3B] transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-md hover:bg-emerald-50 text-[#064E3B] transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 px-3 pb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1" style={fonts.body}>
                  {d}
                </div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
              {calendarDays.map((cell, i) => {
                const sel   = isSelected(cell.day, cell.current);
                const tod   = isToday(cell.day, cell.current);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!cell.current}
                    onClick={() => selectDay(cell.day, cell.current)}
                    className={`h-8 w-full flex items-center justify-center text-xs font-bold rounded-lg transition-all
                      ${!cell.current
                        ? "text-slate-300 cursor-default"
                        : sel
                          ? "bg-[#10B981] text-white shadow-sm"
                          : tod
                            ? "border border-[#10B981] text-[#064E3B] hover:bg-emerald-50"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-[#064E3B]"}`}
                    style={fonts.data}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-4 py-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { onChange(""); setIsOpen(false); }}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
                style={fonts.body}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={goToday}
                className="text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
                style={fonts.body}
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Receipt Modal
// ─────────────────────────────────────────────
function ReceiptModal({ activity, onClose }) {
  const credit = isCredit(activity.status);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative flex flex-col items-center"
        style={{ filter: "drop-shadow(0 25px 60px rgba(0,0,0,0.25))" }}
      >
        {/* Receipt body */}
        <div className="bg-white w-full max-w-[340px] px-7 pb-6 pt-8 flex flex-col items-center rounded-t-2xl">
          {/* Logo */}
          <div className="mb-1 w-16 h-16 flex items-center justify-center">
            <img
              src="/ecopoints-logo-mark.png"
              alt="EcoPoints"
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          </div>
          <p className="text-base font-black text-stone-800 tracking-tight" style={fonts.heading}>
            ECOPOINTS
          </p>
          <p className="text-[9px] text-stone-400 uppercase tracking-widest mb-5" style={fonts.data}>
            Official Transaction
          </p>

          <div className="w-full border-t border-dashed border-stone-200 mb-5" />

          {/* Data rows */}
          <div className="w-full space-y-3">
            {[
              ["Description", activity.description],
              ["Date",        formatDate(activity.date)],
              ["Time",        formatTime(activity.date)],
              ["Location",    activity.location],
              ...(activity.bottles > 0 ? [["Qty Recycled", `${activity.bottles} units`]] : []),
              ["Reference",   activity.reference],
              ["Status",      activity.status],
            ].map(([key, val]) => (
              <div key={key} className="flex justify-between items-start gap-6">
                <span className="text-[9px] text-stone-400 uppercase tracking-wider flex-shrink-0" style={fonts.data}>
                  {key}
                </span>
                <span className="text-[11px] text-stone-700 font-bold text-right leading-snug" style={fonts.body}>
                  {val}
                </span>
              </div>
            ))}
          </div>

          <div className="w-full border-t border-dashed border-stone-200 my-5" />

          {/* Points total */}
          <div className="w-full flex justify-between items-center bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
            <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest" style={fonts.body}>
              Points Total
            </span>
            <span
              className={`text-2xl font-black ${credit ? "text-[#059669]" : "text-[#d97706]"}`}
              style={fonts.data}
            >
              {credit ? "+" : ""}{activity.amount} EP
            </span>
          </div>

          <p className="mt-5 text-[9px] text-stone-400 text-center leading-relaxed uppercase tracking-wider" style={fonts.data}>
            Thank you for helping keep the campus green!
          </p>

          {/* Barcode mockup */}
          <div className="mt-4 flex gap-[2px] items-center justify-center opacity-30">
            {[3,2,4,2,3,2,4,3,2,3,2,4,2,3,2].map((w, i) => (
              <div key={i} className="bg-stone-700" style={{ width: w, height: 28 }} />
            ))}
          </div>
        </div>

        {/* Jagged bottom edge */}
        <div
          className="w-full bg-white"
          style={{
            height: 16,
            clipPath:
              "polygon(0% 0%,3.33% 100%,6.67% 0%,10% 100%,13.33% 0%,16.67% 100%,20% 0%,23.33% 100%,26.67% 0%,30% 100%,33.33% 0%,36.67% 100%,40% 0%,43.33% 100%,46.67% 0%,50% 100%,53.33% 0%,56.67% 100%,60% 0%,63.33% 100%,66.67% 0%,70% 100%,73.33% 0%,76.67% 100%,80% 0%,83.33% 100%,86.67% 0%,90% 100%,93.33% 0%,96.67% 100%,100% 0%)",
            maxWidth: 340,
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/20 transition-all"
          style={fonts.body}
        >
          Close Receipt
        </button>
      </motion.div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const ITEMS_PER_PAGE = 6;

const TYPE_OPTIONS = [
  { value: "all",             label: "All Activities" },
  { value: "Deposited",       label: "Deposited" },
  { value: "Rewarded",        label: "Rewarded" },
  { value: "Redeemed",        label: "Redeemed" },
  { value: "Claimed",         label: "Claimed" },
];

export default function RecentActivity() {
  const [filterType,       setFilterType]       = useState("all");
  const [filterDate,       setFilterDate]       = useState("");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activities,       setActivities]       = useState([]);
  const [isLoading,        setIsLoading]        = useState(true);
  const [fetchError,       setFetchError]       = useState(false);

  // Fetch
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setIsLoading(true);
        const data = await api.logs.getTransactions();
        if (!active) return;
        const mapped = data.map((txn) => {
          const status = resolveStatus(txn.transactionType);
          let description = txn.description;
          if (!description) {
            const t = txn.transactionType;
            const r = txn.referenceType;
            if (t === "earn") {
              description = r === "bulk_deposit" ? "Bulk Recycling Deposit" : "Recycled at RVM";
            } else if (t === "bulk_transaction") {
              description = "Bulk Points Credit";
            } else if (t === "redeem") {
              description = "Reward Redeemed";
            } else if (t === "redeem_confirm") {
              description = "Reward Claimed";
            } else if (t === "adjustment") {
              description = "Points Adjusted by Admin";
            } else {
              description = t
                ? t.charAt(0).toUpperCase() + t.slice(1)
                : "Points Transaction";
            }
          }
          return {
            id:          txn.id,
            status,
            amount:      txn.amount,
            description,
            date:        txn.timestamp,
            reference:   txn.referenceId ? `TXN-${txn.referenceId}` : "N/A",
            bottles:     0,
            location:    txn.locationName || "Unknown Location",
          };
        });
        setActivities(mapped);
      } catch (err) {
        if (active) setFetchError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  // Lock body scroll on modal
  useEffect(() => {
    document.body.style.overflow = selectedActivity ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedActivity]);

  // Filter
  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (filterType !== "all" && a.status !== filterType) return false;
      if (filterDate) {
        const d = new Date(a.date).toISOString().slice(0, 10);
        if (d !== filterDate) return false;
      }
      return true;
    });
  }, [activities, filterType, filterDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const page       = Math.min(currentPage, totalPages);
  const displayed  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilter = (val) => { setFilterType(val); setCurrentPage(1); };
  const handleDate   = (val) => { setFilterDate(val); setCurrentPage(1); };

  // Pagination page numbers (max 5 shown)
  const pageNums = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        {/* Left: title */}
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#064E3B]" />
          <h2 className="font-black text-[#064E3B] text-base" style={fonts.heading}>
            Recent Activity
          </h2>
        </div>

        {/* Right: filters */}
        <div className="flex items-center gap-2">
          <DatePickerButton value={filterDate} onChange={handleDate} />
          <CustomDropdown
            icon={Filter}
            label="All Activities"
            value={filterType}
            options={TYPE_OPTIONS}
            onChange={handleFilter}
          />
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-bold" style={fonts.body}>Loading activities…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-16">
            <History size={32} className="text-slate-200 mb-3" />
            <p className="text-xs text-slate-400 font-bold" style={fonts.body}>Unable to load activities</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <History size={32} className="text-slate-200 mb-3" />
            <p className="text-xs text-slate-400 font-bold" style={fonts.body}>No activities</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayed.map((activity) => {
              const credit = isCredit(activity.status);
              return (
                <div
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {/* Icon bubble */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                    ${credit ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                    {credit
                      ? <ArrowDownLeft size={16} />
                      : <ArrowUpRight  size={16} />}
                  </div>

                  {/* Description + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#064E3B] truncate" style={fonts.heading}>
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5" style={fonts.body}>
                      {formatDate(activity.date)}
                      <span className="mx-1 opacity-50">·</span>
                      <span className={credit ? "text-emerald-500" : "text-amber-500"}>
                        {activity.status}
                      </span>
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`text-sm font-black ${credit ? "text-[#059669]" : "text-[#d97706]"}`}
                      style={fonts.data}
                    >
                      {credit ? "+" : ""}{activity.amount}
                    </span>
                    <span className={`text-[10px] font-bold ml-0.5 ${credit ? "text-emerald-400" : "text-amber-400"}`}
                      style={fonts.body}>EP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 shadow-inner rounded-full px-2 py-1.5">
          <button
            disabled={page === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1.5 rounded-full text-emerald-600 disabled:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>

          {pageNums.map((n) => (
            <button
              key={n}
              onClick={() => setCurrentPage(n)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200
                ${page === n
                  ? "bg-[#064E3B] text-white shadow-md scale-110"
                  : "text-emerald-900 hover:bg-slate-200"}`}
              style={fonts.data}
            >
              {n}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1.5 rounded-full text-emerald-600 disabled:text-slate-300 hover:bg-slate-200 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Receipt modal ── */}
      <AnimatePresence>
        {selectedActivity && (
          <ReceiptModal
            activity={selectedActivity}
            onClose={() => setSelectedActivity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
