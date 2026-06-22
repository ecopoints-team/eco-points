import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Leaf, Calendar, ChevronDown,
  X, Zap, Recycle
} from 'lucide-react';
import api from '../../services/api';

// ─────────────────────────────────────────────
// Font styles (consistent with ProfileSection)
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

/**
 * ProfileHeatmap — GitHub-style recycling activity heatmap.
 *
 * Renders inside the profile page grid (3-col span).
 * Data comes from `activityData` prop (or empty by default).
 * Format: { "YYYY-MM-DD": count, ... }
 *
 * @param {Object} props
 * @param {Object} [props.activityData={}] - Date→count map from API
 */
export default function ProfileHeatmap({ activityData = {} }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Dynamic API loading state
  const [heatmapData, setHeatmapData] = useState(activityData);
  const [isLoading, setIsLoading] = useState(false);

  // Stringify activityData to avoid infinite render loops due to default object reference changes on each render
  const activityDataStr = JSON.stringify(activityData || {});

  useEffect(() => {
    // If activityData was passed as a non-empty prop, use it directly
    if (activityData && Object.keys(activityData).length > 0) {
      setHeatmapData(activityData);
      return;
    }

    let active = true;
    async function loadRecyclingActivity() {
      try {
        setIsLoading(true);
        const logs = await api.logs.getBottles();
        if (!active) return;

        // Group bottles by date (YYYY-MM-DD)
        const counts = {};
        logs.forEach(item => {
          if (item.scannedAt && item.status === 'Accepted') {
            const dateStr = item.scannedAt.split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          }
        });
        setHeatmapData(counts);
      } catch (err) {
        console.error("Failed to fetch recycling activity for heatmap:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadRecyclingActivity();
    return () => { active = false; };
  }, [activityDataStr]);

  // Tooltip State
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, date: '', count: 0 });
  const containerRef = useRef(null);

  // Morphing Modal State
  const [selectedTile, setSelectedTile] = useState(null);
  const [modalPhase, setModalPhase] = useState('closed'); // 'closed' | 'opening' | 'open' | 'closing'

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  // Calculate total deposits for the selected year
  const totalDeposits = useMemo(() => {
    let total = 0;
    Object.keys(heatmapData).forEach(key => {
      if (key.startsWith(selectedYear.toString())) {
        total += heatmapData[key];
      }
    });
    return total;
  }, [selectedYear, heatmapData]);

  // --- HEATMAP GRID GENERATION ---
  const { weeks, monthLabels } = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    const weeksArray = [];
    const months = [];
    let currentWeek = [];
    let lastMonth = -1;

    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null);
    }

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const month = d.getMonth();

      if (month !== lastMonth && currentWeek.length > 0) {
        months.push({ label: d.toLocaleString('default', { month: 'short' }), index: weeksArray.length });
        lastMonth = month;
      }

      currentWeek.push({
        dateStr,
        dateObj: new Date(d),
        count: heatmapData[dateStr] || 0
      });

      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeksArray.push(currentWeek);
    }

    return { weeks: weeksArray, monthLabels: months };
  }, [selectedYear, heatmapData]);

  // --- COLOR SCALING ---
  const getColorClass = (count) => {
    if (count === 0) return 'bg-slate-100/80 border-slate-200/50';
    if (count <= 2) return 'bg-emerald-200 border-emerald-300';
    if (count <= 5) return 'bg-emerald-400 border-emerald-500';
    if (count <= 9) return 'bg-emerald-600 border-emerald-700';
    return 'bg-[#064e3b] border-[#022c22]';
  };

  const getHexColor = (count) => {
    if (count === 0) return '#f1f5f9';
    if (count <= 2) return '#a7f3d0';
    if (count <= 5) return '#34d399';
    if (count <= 9) return '#059669';
    return '#064e3b';
  };

  // --- TOOLTIP HANDLERS ---
  const handleTooltipOpen = (e, dateStr, count) => {
    if (!dateStr || modalPhase !== 'closed') return;
    const targetRect = e.target.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = targetRect.left - containerRect.left + (targetRect.width / 2);
    const y = targetRect.top - containerRect.top;

    const dateObj = new Date(dateStr);
    const niceDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setTooltip({ show: true, x, y, date: niceDate, count });
  };

  const handleTooltipClose = () => {
    setTooltip({ show: false, x: 0, y: 0, date: '', count: 0 });
  };

  // --- MORPHING MODAL HANDLERS ---
  const handleTileClick = (e, dateStr, count) => {
    if (count === 0) return;

    const rect = e.target.getBoundingClientRect();
    const dateObj = new Date(dateStr);
    const niceDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    setSelectedTile({
      dateStr,
      date: niceDate,
      count,
      rect,
      hexColor: getHexColor(count)
    });
    setModalPhase('opening');
    setTooltip({ show: false, x: 0, y: 0, date: '', count: 0 });
  };

  useEffect(() => {
    if (modalPhase === 'opening') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setModalPhase('open');
        });
      });
    }
  }, [modalPhase]);

  // Hide the page header while the tile detail modal is open
  useEffect(() => {
    const isOpen = modalPhase !== 'closed';
    if (isOpen) {
      document.body.classList.add('profile-modal-open');
    } else {
      document.body.classList.remove('profile-modal-open');
    }
    return () => document.body.classList.remove('profile-modal-open');
  }, [modalPhase]);

  const closeTileModal = () => {
    setModalPhase('closing');
    setTimeout(() => {
      setModalPhase('closed');
      setSelectedTile(null);
    }, 400);
  };

  // Close year dropdown on outside click
  useEffect(() => {
    if (!isYearDropdownOpen) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-year-dropdown]')) setIsYearDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isYearDropdownOpen]);

  return (
    <>
      {/* HEATMAP CARD */}
      <div
        ref={containerRef}
        className="relative bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-xl shadow-black/5 overflow-hidden"
      >
        {/* ── Card Header ── */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100">
          {/* Left: title + sub-text */}
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#10b981]" />
              <h2 className="text-base font-black text-[#064e3b]" style={fonts.heading}>
                Recycling Activity
              </h2>
              {isLoading && (
                <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 pl-6" style={fonts.body}>
              <span className="font-black text-[#10b981]" style={fonts.data}>{totalDeposits}</span>
              {' '}bottles recycled
            </p>
          </div>

          {/* Right: animated custom year dropdown — matches LeaderboardPodium style */}
          <div className="relative shrink-0" data-year-dropdown>
            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setIsYearDropdownOpen(v => !v)}
              className={`flex items-center gap-2 bg-white border border-emerald-200 px-4 py-2 font-bold text-sm text-emerald-900 whitespace-nowrap transition-all
                ${isYearDropdownOpen
                  ? 'rounded-t-lg rounded-b-none border-b-white z-[51] shadow-none'
                  : 'rounded-lg shadow-sm hover:border-emerald-400'}`}
              style={fonts.data}
            >
              <Calendar size={14} className="text-emerald-500 flex-shrink-0" />
              {selectedYear}
              <ChevronDown
                size={14}
                className={`text-emerald-500 transition-transform duration-200 flex-shrink-0 ${isYearDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Animated panel */}
            <AnimatePresence>
              {isYearDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scaleY: 0.92 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.92 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  style={{ transformOrigin: 'top' }}
                  className="absolute right-0 top-[calc(100%-1px)] z-50 bg-white border border-emerald-200 border-t-0 rounded-b-lg shadow-[0_6px_20px_rgba(0,0,0,0.08)] overflow-hidden min-w-full"
                >
                  {availableYears.map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors whitespace-nowrap
                        ${selectedYear === year
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'}`}
                      style={fonts.data}
                    >
                      {year}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Heatmap Grid ── */}
        <div className="px-6 py-5">

          {/* Month labels row */}
          <div className="flex mb-1.5">
            {/* Spacer matching the day-label column */}
            <div className="w-8 flex-shrink-0" />
            {/* Months stretched across the remaining width */}
            <div className="relative flex-1 h-4 text-[10px] font-bold text-slate-400" style={fonts.body}>
              {monthLabels.map((month, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{ left: `calc(${month.index} / ${weeks.length} * 100%)` }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>

          {/* Day labels + grid — unified 7-row × (1+N-week) CSS grid */}
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: `2rem repeat(${weeks.length}, minmax(0, 1fr))` }}
          >
            {/* Row 0-6: day labels in column 1 */}
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, rowIdx) => (
              <span
                key={d}
                className="text-[10px] font-bold text-slate-400 flex items-center"
                style={{ ...fonts.body, gridColumn: 1, gridRow: rowIdx + 1 }}
              >
                {d}
              </span>
            ))}

            {/* Weeks: each week column starts at gridColumn 2 */}
            {weeks.map((week, weekIndex) => (
              week.map((day, dayIndex) => {
                const col = weekIndex + 2;
                const row = dayIndex + 1;

                if (!day) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="aspect-square rounded-[3px]"
                      style={{ gridColumn: col, gridRow: row }}
                    />
                  );
                }

                const isMorphing = selectedTile?.dateStr === day.dateStr && modalPhase !== 'closed';

                return (
                  <div
                    key={day.dateStr}
                    onClick={(e) => handleTileClick(e, day.dateStr, day.count)}
                    onMouseEnter={(e) => handleTooltipOpen(e, day.dateStr, day.count)}
                    onMouseLeave={handleTooltipClose}
                    style={{ gridColumn: col, gridRow: row }}
                    className={`aspect-square rounded-[3px] border transition-all duration-300 ease-out hover:scale-110 hover:z-10 hover:ring-2 hover:ring-offset-1 hover:ring-[#10B981] ${day.count > 0 ? 'cursor-pointer' : ''} ${getColorClass(day.count)} ${isMorphing ? 'opacity-0' : 'opacity-100'}`}
                  />
                );
              })
            ))}
          </div>

        </div>

        {/* ── Legend (bottom) ── */}
        <div className="flex justify-end items-center gap-2 px-6 py-3 border-t border-stone-100">
          <span className="text-[10px] font-bold text-slate-400" style={fonts.data}>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[3px] bg-slate-100 border border-slate-200" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-200 border border-emerald-300" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-400 border border-emerald-500" />
            <div className="w-3 h-3 rounded-[3px] bg-emerald-600 border border-emerald-700" />
            <div className="w-3 h-3 rounded-[3px] bg-[#064e3b] border border-[#022c22]" />
          </div>
          <span className="text-[10px] font-bold text-slate-400" style={fonts.data}>More</span>
        </div>

        {/* FLOATING TOOLTIP */}
        {tooltip.show && (
          <div
            className="absolute z-50 pointer-events-none animate-heatmap-popup"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-2xl text-sm flex flex-col items-center border border-slate-700/50" style={fonts.body}>
              <span className="font-bold whitespace-nowrap mb-0.5">
                {tooltip.count === 0 ? "No bottles" : `${tooltip.count} bottles`} deposited
              </span>
              <span className="text-slate-400 text-xs">{tooltip.date}</span>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-slate-700/50" />
            </div>
          </div>
        )}
      </div>

      {/* MORPHING TILE MODAL */}
      {selectedTile && modalPhase !== 'closed' && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-[#064e3b]/30 backdrop-blur-sm transition-opacity duration-400 ease-out ${modalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeTileModal}
          />

          {/* Morphing Box */}
          <div
            className="absolute overflow-hidden shadow-2xl"
            style={{
              top: modalPhase === 'open' ? '50%' : `${selectedTile.rect.top}px`,
              left: modalPhase === 'open' ? '50%' : `${selectedTile.rect.left}px`,
              width: modalPhase === 'open' ? 'min(calc(100vw - 2rem), 400px)' : `${selectedTile.rect.width}px`,
              height: modalPhase === 'open' ? '320px' : `${selectedTile.rect.height}px`,
              transform: modalPhase === 'open' ? 'translate(-50%, -50%)' : 'translate(0, 0)',
              borderRadius: modalPhase === 'open' ? '2.5rem' : '4px',
              backgroundColor: modalPhase === 'open' ? '#ffffff' : selectedTile.hexColor,
              transition: 'all 0.5s cubic-bezier(0.34, 1.08, 0.64, 1)',
              zIndex: 10000
            }}
          >
            {/* Expanded Content */}
            <div
              className={`w-full h-full flex flex-col transition-opacity duration-300 relative ${modalPhase === 'open' ? 'opacity-100 delay-200' : 'opacity-0'}`}
            >
              {/* Header */}
              <div
                className="pt-8 pb-6 px-8 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: selectedTile.hexColor }}
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <h3 className={`text-2xl font-black relative z-10 ${selectedTile.count <= 2 ? 'text-[#064e3b]' : 'text-white'}`} style={fonts.heading}>
                  Daily Impact
                </h3>
                <p className={`text-sm relative z-10 opacity-80 ${selectedTile.count <= 2 ? 'text-[#064e3b]' : 'text-white'}`} style={fonts.body}>
                  {selectedTile.date}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeTileModal}
                className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-colors z-20 ${selectedTile.count <= 2 ? 'bg-[#064e3b]/10 text-[#064e3b] hover:bg-[#064e3b]/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Stats Body */}
              <div className="flex-1 p-8 flex flex-col justify-center gap-6" style={fonts.body}>
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Deposits</span>
                    <div className="flex items-center gap-2 text-3xl font-black text-[#064e3b]" style={fonts.heading}>
                      <Recycle className="text-[#10b981]" size={28} /> {selectedTile.count}
                    </div>
                  </div>
                  <div className="w-px h-12 bg-slate-200" />
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Earned</span>
                    <div className="flex items-center gap-2 text-3xl font-black bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent" style={fonts.heading}>
                      +{selectedTile.count * 10} <Zap className="text-[#34d399]" size={24} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
