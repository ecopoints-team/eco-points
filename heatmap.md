import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Leaf, Calendar, ChevronDown, Plus, Info, 
  X, Zap, Recycle, Sparkles 
} from 'lucide-react';

export default function ProfileHeatmap() {
  // --- STATE ---
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [activityData, setActivityData] = useState({});
  const [totalDeposits, setTotalDeposits] = useState(0);

  // Tooltip State
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, date: '', count: 0 });
  const containerRef = useRef(null);

  // --- NEW: MORPHING MODAL STATE ---
  const [selectedTile, setSelectedTile] = useState(null);
  const [modalPhase, setModalPhase] = useState('closed'); // 'closed', 'opening', 'open', 'closing'

  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  // --- MOCK DATA GENERATOR ---
  useEffect(() => {
    const initialData = {};
    let total = 0;
    
    // Generate some random baseline data for the past few years
    availableYears.forEach(year => {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        // 15% chance of having activity to make it look realistic
        if (Math.random() > 0.85) {
          const count = Math.floor(Math.random() * 8) + 1;
          initialData[dateStr] = count;
          if (year === selectedYear) total += count;
        }
      }
    });
    setActivityData(initialData);
    setTotalDeposits(total);
  }, []);

  // Recalculate total when year changes
  useEffect(() => {
    let total = 0;
    Object.keys(activityData).forEach(key => {
      if (key.startsWith(selectedYear.toString())) {
        total += activityData[key];
      }
    });
    setTotalDeposits(total);
  }, [selectedYear, activityData]);

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
        count: activityData[dateStr] || 0
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
  }, [selectedYear, activityData]);

  // --- COLOR SCALING LOGIC ---
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

  // --- HANDLERS ---
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

  // The custom tester button logic
  const handleDepositTest = () => {
    const start = new Date(selectedYear, 0, 1).getTime();
    const end = selectedYear === currentYear ? new Date().getTime() : new Date(selectedYear, 11, 31).getTime();
    const randomTime = new Date(start + Math.random() * (end - start));
    const randomDateStr = randomTime.toISOString().split('T')[0];
    const increment = Math.floor(Math.random() * 3) + 1;

    setActivityData(prev => ({
      ...prev,
      [randomDateStr]: (prev[randomDateStr] || 0) + increment
    }));
  };

  // --- MORPHING MODAL HANDLERS ---
  const handleTileClick = (e, dateStr, count) => {
    if (count === 0) return; // Only allow clicking active days
    
    const rect = e.target.getBoundingClientRect();
    const dateObj = new Date(dateStr);
    const niceDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const cheers = [
      { title: "High Five! 🌍", sub: "Earth just gave you a massive high five." },
      { title: "Crushing It! 💥", sub: "Literally. That plastic didn't stand a chance." },
      { title: "Turtle-y Awesome! 🐢", sub: "The ocean sends its warmest regards." },
      { title: "5-Star Review! ⭐", sub: "Mother Nature highly recommends your work." },
      { title: "Legendary! ⚡", sub: "That is some serious eco-energy right there." },
      { title: "Not On Your Watch! 🛑", sub: "Keeping plastic out of landfills like a pro." },
      { title: "Eco-Hero! 🦸‍♂️", sub: "Saving the planet, one bottle at a time." },
      { title: "Flawless! ✨", sub: "Greener than a freshly tossed vegan salad." }
    ];
    const randomCheer = cheers[Math.floor(Math.random() * cheers.length)];

    setSelectedTile({
      dateStr, 
      date: niceDate,
      count, 
      rect,
      hexColor: getHexColor(count),
      cheer: randomCheer
    });
    setModalPhase('opening');
    setTooltip({ show: false, x: 0, y: 0, date: '', count: 0 }); // Hide tooltip
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

  const closeTileModal = () => {
    setModalPhase('closing');
    setTimeout(() => {
      setModalPhase('closed');
      setSelectedTile(null);
    }, 400); // Matches the cubic-bezier transition time
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdf4]/80 to-white/80 font-sans text-[#064e3b] selection:bg-[#34d399] selection:text-white py-20 px-4 md:px-8 flex flex-col items-center relative overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');
        
        .font-heading { font-family: 'Fredoka', sans-serif; }
        .font-body { font-family: 'Quicksand', sans-serif; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes popup {
          0% { opacity: 0; transform: translate(-50%, calc(-100% + 8px)) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, calc(-100% - 6px)) scale(1); }
        }
        .animate-popup { animation: popup 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* HEADER INTRO */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#10b981]/10 rounded-full mb-4 border border-[#10b981]/20">
          <Leaf className="w-4 h-4 text-[#10b981]" />
          <span className="text-[#10b981] text-sm font-bold uppercase tracking-widest font-body">Profile Heatmap</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#064e3b] font-heading tracking-tight">
          Recycling <span className="bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent">Activity</span>
        </h1>
      </div>

      {/* HEATMAP CARD CONTAINER */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-5xl bg-white/80 backdrop-blur-xl border border-white shadow-[0_15px_50px_rgba(0,0,0,0.06)] rounded-[2.5rem] p-6 md:p-10"
      >
        {/* Card Header (Controls & Stats) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
          <div>
            <h2 className="text-2xl font-black font-heading text-[#064e3b] mb-1">Impact Overview</h2>
            <div className="text-slate-500 font-body text-sm flex items-center gap-2">
              <span className="font-bold text-lg text-[#10b981]">{totalDeposits}</span> 
              bottles recycled in {selectedYear}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative z-20">
              <button 
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold font-body text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <Calendar size={16} className="text-[#10b981]" />
                {selectedYear}
                <ChevronDown size={16} className={`transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isYearDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-32 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden flex flex-col py-2 animate-[scaleIn_0.2s_ease-out_forwards] origin-top-right">
                  {availableYears.map(year => (
                    <button 
                      key={year}
                      onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                      className={`px-4 py-2.5 text-left font-bold font-body text-sm transition-colors hover:bg-emerald-50 ${selectedYear === year ? 'text-[#10b981] bg-emerald-50/50' : 'text-slate-600'}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={handleDepositTest}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-2xl font-bold font-body text-white shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(16,185,129,0.4)] transition-all active:scale-95"
            >
              <Plus size={18} strokeWidth={3} />
              <span className="hidden sm:inline">Deposit Bottle</span>
            </button>
          </div>
        </div>

        {/* THE GITHUB-STYLE HEATMAP */}
        <div className="w-full overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          <div className="min-w-max">
            <div className="flex relative h-6 mb-2 text-xs font-bold text-slate-400 font-body">
              {monthLabels.map((month, i) => (
                <div 
                  key={i} 
                  className="absolute" 
                  style={{ left: `calc(${month.index} * (1rem + 6px))` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              <div className="flex flex-col justify-between gap-1.5 mr-2 text-[10px] font-bold text-slate-400 font-body h-[118px] py-1">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={`empty-${dayIndex}`} className="w-4 h-4 rounded-md" />;
                    }

                    // Hide the original tile while it's morphing so we don't see a duplicate!
                    const isMorphing = selectedTile?.dateStr === day.dateStr && modalPhase !== 'closed';

                    return (
                      <div 
                        key={day.dateStr}
                        onClick={(e) => handleTileClick(e, day.dateStr, day.count)}
                        onMouseEnter={(e) => handleTooltipOpen(e, day.dateStr, day.count)}
                        onMouseLeave={handleTooltipClose}
                        className={`w-4 h-4 rounded-[4px] border transition-all duration-300 ease-out hover:scale-125 hover:z-10 ${day.count > 0 ? 'cursor-pointer' : ''} ${getColorClass(day.count)} ${isMorphing ? 'opacity-0' : 'opacity-100'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Legend */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-body font-medium">
            <Info size={16} className="text-[#10b981]" />
            Learn how we calculate your <a href="#" className="text-[#10b981] font-bold hover:underline">environmental impact</a>.
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-body">
            <span>Less</span>
            <div className="flex gap-1.5">
              <div className="w-3.5 h-3.5 rounded-[3px] bg-slate-100 border border-slate-200" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-emerald-200 border border-emerald-300" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-emerald-400 border border-emerald-500" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-emerald-600 border border-emerald-700" />
              <div className="w-3.5 h-3.5 rounded-[3px] bg-[#064e3b] border border-[#022c22]" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* FLOATING HOVER TOOLTIP */}
        {tooltip.show && (
          <div 
            className="absolute z-50 pointer-events-none animate-popup"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <div className="bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-2xl font-body text-sm flex flex-col items-center border border-slate-700/50">
              <span className="font-bold whitespace-nowrap mb-0.5">
                {tooltip.count === 0 ? "No bottles" : `${tooltip.count} bottles`} deposited
              </span>
              <span className="text-slate-400 text-xs">{tooltip.date}</span>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 rotate-45 border-r border-b border-slate-700/50" />
            </div>
          </div>
        )}

      </div>

      {/* --- CONTINUITY MORPH MODAL --- */}
      {selectedTile && modalPhase !== 'closed' && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center">
          
          {/* Backdrop Blur */}
          <div 
            className={`absolute inset-0 bg-[#064e3b]/30 backdrop-blur-sm transition-opacity duration-400 ease-out ${modalPhase === 'open' ? 'opacity-100' : 'opacity-0'}`} 
            onClick={closeTileModal}
          />
          
          {/* The Morphing Box */}
          <div 
            className="absolute overflow-hidden shadow-2xl"
            style={{
              top: modalPhase === 'open' ? '50%' : `${selectedTile.rect.top}px`,
              left: modalPhase === 'open' ? '50%' : `${selectedTile.rect.left}px`,
              width: modalPhase === 'open' ? 'min(calc(100vw - 2rem), 400px)' : `${selectedTile.rect.width}px`,
              height: modalPhase === 'open' ? '460px' : `${selectedTile.rect.height}px`,
              transform: modalPhase === 'open' ? 'translate(-50%, -50%)' : 'translate(0, 0)',
              borderRadius: modalPhase === 'open' ? '2.5rem' : '4px',
              backgroundColor: modalPhase === 'open' ? '#ffffff' : selectedTile.hexColor,
              // Spring physics transition for that premium feel
              transition: 'all 0.5s cubic-bezier(0.34, 1.08, 0.64, 1)',
              zIndex: 10000
            }}
          >
            {/* Expanded Content - Only fades in when fully expanded */}
            <div 
              className={`w-full h-full flex flex-col transition-opacity duration-300 relative ${modalPhase === 'open' ? 'opacity-100 delay-200' : 'opacity-0'}`}
            >
              
              {/* Dynamic Header matching the specific tile's color */}
              <div 
                className="pt-8 pb-6 px-8 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: selectedTile.hexColor }}
              >
                {/* Decorative background circle */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                
                <h3 className={`text-2xl font-black font-heading relative z-10 ${selectedTile.count <= 2 ? 'text-[#064e3b]' : 'text-white'}`}>
                  Daily Impact
                </h3>
                <p className={`font-body text-sm relative z-10 opacity-80 ${selectedTile.count <= 2 ? 'text-[#064e3b]' : 'text-white'}`}>
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
              <div className="flex-1 p-8 flex flex-col justify-center gap-6 font-body">
                
                {/* Primary Stat: Bottles & Points */}
                <div className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Deposits</span>
                      <div className="flex items-center gap-2 text-3xl font-black text-[#064e3b] font-heading">
                        <Recycle className="text-[#10b981]" size={28} /> {selectedTile.count}
                      </div>
                   </div>
                   <div className="w-px h-12 bg-slate-200" />
                   <div className="flex flex-col items-end">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Earned</span>
                      <div className="flex items-center gap-2 text-3xl font-black bg-gradient-to-r from-[#10b981] to-[#34d399] bg-clip-text text-transparent font-heading">
                        +{selectedTile.count * 10} <Zap className="text-[#34d399]" size={24} />
                      </div>
                   </div>
                </div>

                {/* Clever Congratulatory Message */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <Sparkles className="text-emerald-500" size={24} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-emerald-900 font-black text-lg leading-tight mb-1 font-heading">
                        {selectedTile.cheer.title}
                      </span>
                      <span className="text-emerald-600 text-sm font-medium leading-snug">
                        {selectedTile.cheer.sub}
                      </span>
                   </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}