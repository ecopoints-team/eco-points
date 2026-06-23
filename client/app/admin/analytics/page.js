'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../../../src/context/AuthContext';
import { useProgress } from '../../../src/context/ProgressContext';import RequirePermission from '../../../src/components/admin/RequirePermission';
import { SkeletonCard, SkeletonChart } from '../../../src/components/admin/SkeletonLoaders';
import * as analyticsApi from '../../../src/services/api/analytics';
import * as locationsApi from '../../../src/services/api/locations';
import { formatField } from '../../../src/lib/formatField';
import SlotCounter from '../../../src/components/shared/SlotCounter';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import {
    BarChart3, TrendingUp, Users, Clock, Package, Trophy, MapPin,
    Recycle, Zap, PieChart as PieChartIcon, Activity, Loader2,
    ChevronDown, ChevronUp, Wifi, WifiOff, RefreshCw, Download, FileText, Calendar, X
} from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── Theme-aware chart colors ────────────────────────────────────────
const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#22c55e', '#0ea5e9'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Reusable Stat Card (centered text) ──────────────────────────────
const AnalyticsStat = ({ title, value, icon: Icon, color = 'emerald' }) => {
    const themeMap = {
        emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 system:bg-emerald-500/10 system:text-emerald-400 system:border-emerald-500/20',
        blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 system:bg-cyan-500/10 system:text-cyan-400 system:border-cyan-500/20',
        amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 system:bg-amber-500/10 system:text-amber-400 system:border-amber-500/20',
        purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 system:bg-purple-500/10 system:text-purple-400 system:border-purple-500/20',
        teal: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/30 system:bg-teal-500/10 system:text-teal-400 system:border-teal-500/20',
    };
    const cardGradient = {
        emerald: 'from-emerald-50/80 to-white dark:from-emerald-500/5 dark:to-[#1e293b]/60 system:from-emerald-500/5 system:to-[#1A2E1F]',
        blue: 'from-blue-50/80 to-white dark:from-cyan-500/5 dark:to-[#1e293b]/60 system:from-cyan-500/5 system:to-[#1A2E1F]',
        amber: 'from-amber-50/80 to-white dark:from-amber-500/5 dark:to-[#1e293b]/60 system:from-amber-500/5 system:to-[#1A2E1F]',
        purple: 'from-purple-50/80 to-white dark:from-purple-500/5 dark:to-[#1e293b]/60 system:from-purple-500/5 system:to-[#1A2E1F]',
        teal: 'from-teal-50/80 to-white dark:from-teal-500/5 dark:to-[#1e293b]/60 system:from-teal-500/5 system:to-[#1A2E1F]',
    };
    const cardBorder = {
        emerald: 'border-emerald-200/60 dark:border-emerald-500/20 system:border-emerald-500/15',
        blue: 'border-blue-200/60 dark:border-cyan-500/20 system:border-cyan-500/15',
        amber: 'border-amber-200/60 dark:border-amber-500/20 system:border-amber-500/15',
        purple: 'border-purple-200/60 dark:border-purple-500/20 system:border-purple-500/15',
        teal: 'border-teal-200/60 dark:border-teal-500/20 system:border-teal-500/15',
    };

    return (
        <div className={`relative overflow-hidden p-5 rounded-2xl transition-all duration-500 group
            bg-gradient-to-br ${cardGradient[color]}
            border ${cardBorder[color]}
            shadow-sm hover:shadow-lg
            dark:backdrop-blur-xl dark:shadow-lg
            system:shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
            <div className="relative z-10 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl border ${themeMap[color]} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon size={22} strokeWidth={1.5} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 font-bold uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white system:text-[#E1E4E1] tracking-tight flex items-baseline justify-center gap-0.5">
                        <SlotCounter value={typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, '')) || 0} />
                    </h3>
                </div>
            </div>
        </div>
    );
};

// ─── Section Card wrapper ────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children, className = '', headerRight }) => (
    <div className={`rounded-2xl p-6 shadow-xl transition-all duration-500
        bg-white border border-slate-200
        dark:bg-[#1e293b]/60 dark:backdrop-blur-md dark:border-slate-700/50
        system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)] system:shadow-[0_0_20px_rgba(123,160,91,0.1)]
        ${className}`}>
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white system:text-[#E1E4E1] flex items-center gap-2">
                <Icon size={18} className="text-emerald-500 dark:text-emerald-400 system:text-[#7BA05B]" />
                {title}
            </h3>
            {headerRight}
        </div>
        {children}
    </div>
);

// ─── Custom Tooltip (matches dashboard style) ───────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800/95 system:bg-[#1A2E1F]/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200 dark:border-slate-600 system:border-[rgba(123,160,91,0.3)] min-w-[140px]">
            <p className="text-sm font-bold text-gray-900 dark:text-white system:text-[#E1E4E1] mb-3 pb-2 border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">{label}</p>
            <div className="space-y-2">
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-slate-600 dark:text-slate-300 system:text-[#E1E4E1]/70">{entry.name}:</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white system:text-[#E1E4E1]">{Number(entry.value).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Pie chart custom label that won't overflow
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 25;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#9ca3af" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ─── Year Picker Popup (replaces dropdown for compact year selection) ─
const YearPicker = ({ value, onChange, options, direction = 'down' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    bg-slate-100 text-slate-600 hover:bg-slate-200
                    dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700
                    system:bg-[#0F1B11] system:text-[#E1E4E1]/70 system:hover:bg-[#1A2E1F]
                    border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]"
            >
                <Calendar size={13} />
                {value}
                <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className={`absolute right-0 z-50 mt-1 min-w-[100px] rounded-xl shadow-2xl overflow-hidden
                    bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700
                    system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.3)]
                    ${direction === 'up' ? 'bottom-full mb-1' : ''}`}
                >
                    <div className="py-1">
                        {options.map(year => (
                            <button
                                key={year}
                                onClick={() => { onChange(year); setOpen(false); }}
                                className={`w-full text-center px-4 py-2 text-sm font-medium transition-colors
                                    ${value === year
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 system:bg-emerald-500/15 system:text-emerald-400'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 system:text-[#E1E4E1]/70 system:hover:bg-[#0F1B11]'
                                    }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════

function AnalyticsPageContent() {
    const { currentUser, isSuperAdmin, effectiveLocationId, allLocations, hasPermission } = useAuth();
    const { runWithProgress } = useProgress();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [mounted, setMounted] = useState(false);

    // Recycling trends controls (matches dashboard)
    const [trendChartType, setTrendChartType] = useState('line');
    const [trendTimeRange, setTrendTimeRange] = useState('month');
    const [trendYear, setTrendYear] = useState(new Date().getFullYear());
    const [userGrowthYear, setUserGrowthYear] = useState(new Date().getFullYear());
    const [userGrowthTimeRange, setUserGrowthTimeRange] = useState('month');
    const [pointsYear, setPointsYear] = useState(new Date().getFullYear());
    const [pointsTimeRange, setPointsTimeRange] = useState('month');

    // Machine status popup
    const [showMachineStatus, setShowMachineStatus] = useState(false);
    const [machineLocationFilter, setMachineLocationFilter] = useState('all');

    // Location comparison
    const [orgTypeFilter, setOrgTypeFilter] = useState('all');
    const [orgTypesList, setOrgTypesList] = useState([]);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => setMounted(true));
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    const fetchAnalytics = useCallback(async (showFullLoading = true) => {
        try {
            if (showFullLoading) setLoading(true);
            else setRefreshing(true);
            const result = await analyticsApi.getData(effectiveLocationId);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [effectiveLocationId]);

    useEffect(() => {
        if (currentUser) fetchAnalytics(true);
    }, [currentUser, fetchAnalytics]);

    // Fetch org types for location filter
    useEffect(() => {
        const fetchOrgTypes = async () => {
            try {
                const types = await locationsApi.getOrgTypes();
                setOrgTypesList(types || []);
            } catch (err) {
                console.error('Failed to fetch org types:', err);
            }
        };
        fetchOrgTypes();
    }, []);

    // ─── Derived chart data ──────────────────────────────────────────
    const recyclingTrendData = useMemo(() => {
        if (!data?.recyclingTrends) return [];
        return data.recyclingTrends.map(row => {
            const [y, m] = row.month.split('-');
            return {
                name: MONTH_LABELS[parseInt(m) - 1],
                year: y,
                Accepted: row.accepted,
                Rejected: row.rejected,
            };
        });
    }, [data]);

    // Available years for recycling trends
    const availableTrendYears = useMemo(() => {
        if (!recyclingTrendData.length) return [new Date().getFullYear()];
        const years = [...new Set(recyclingTrendData.map(d => parseInt(d.year)))];
        if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
        return years.sort();
    }, [recyclingTrendData]);

    // Year-filtered recycling data — show all 12 months (Jan-Dec) like the dashboard
    const yearFilteredTrendData = useMemo(() => {
        const dataByMonth = {};
        recyclingTrendData
            .filter(d => parseInt(d.year) === trendYear)
            .forEach(d => { dataByMonth[d.name] = d; });
        return MONTH_LABELS.map(label => dataByMonth[label] || { name: label, year: String(trendYear), Accepted: 0, Rejected: 0 });
    }, [recyclingTrendData, trendYear]);

    // Weekly (daily) trend data from backend
    const weeklyTrendData = useMemo(() => {
        if (!data?.dailyTrends) return [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        // Build a map from day-of-week to data
        const dayMap = {};
        data.dailyTrends.forEach(row => {
            const dayName = dayNames[row.dow];
            if (!dayMap[dayName]) dayMap[dayName] = { name: dayName, Accepted: 0, Rejected: 0 };
            dayMap[dayName].Accepted += row.accepted;
            dayMap[dayName].Rejected += row.rejected;
        });
        // Return in Mon-Sun order
        return DAY_ORDER.map(day => dayMap[day] || { name: day, Accepted: 0, Rejected: 0 });
    }, [data]);

    // Time-range filtered trend data
    const trendFilteredData = useMemo(() => {
        if (trendTimeRange === 'year') {
            const yearMap = {};
            recyclingTrendData.forEach(d => {
                if (!yearMap[d.year]) yearMap[d.year] = { name: d.year, Accepted: 0, Rejected: 0 };
                yearMap[d.year].Accepted += d.Accepted;
                yearMap[d.year].Rejected += d.Rejected;
            });
            return Object.values(yearMap);
        }
        if (trendTimeRange === 'week') {
            return weeklyTrendData;
        }
        return yearFilteredTrendData;
    }, [recyclingTrendData, yearFilteredTrendData, weeklyTrendData, trendTimeRange]);

    // Pie data for trend chart pie mode
    const trendPieData = useMemo(() => {
        const totals = trendFilteredData.reduce((acc, d) => {
            acc.Accepted += d.Accepted;
            acc.Rejected += d.Rejected;
            return acc;
        }, { Accepted: 0, Rejected: 0 });
        return [
            { name: 'Accepted', value: totals.Accepted },
            { name: 'Rejected', value: totals.Rejected },
        ].filter(d => d.value > 0);
    }, [trendFilteredData]);

    // Available years for user growth
    const availableUserGrowthYears = useMemo(() => {
        if (!data?.userGrowth?.months) return [new Date().getFullYear()];
        const years = [...new Set(
            data.userGrowth.months
                .filter(m => m.month && typeof m.month === 'string' && m.month.includes('-'))
                .map(m => parseInt(m.month.split('-')[0]))
        )];
        if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
        return years.sort();
    }, [data]);

    const userGrowthData = useMemo(() => {
        if (!data?.userGrowth) return [];
        if (userGrowthTimeRange === 'year') {
            const yearMap = {};
            data.userGrowth.months.forEach(m => {
                if (!m.month) return;
                const y = m.month.split('-')[0];
                if (!yearMap[y]) yearMap[y] = { name: y, 'New Users': 0 };
                yearMap[y]['New Users'] += m.count;
            });
            return Object.values(yearMap);
        }
        return MONTH_LABELS.map((label, idx) => {
            const monthKey = `${userGrowthYear}-${String(idx + 1).padStart(2, '0')}`;
            const found = data.userGrowth.months.find(m => m.month === monthKey);
            const newUsers = found ? found.count : 0;
            return { name: label, 'New Users': newUsers };
        });
    }, [data, userGrowthYear, userGrowthTimeRange]);

    // Available years for points economy
    const availablePointsYears = useMemo(() => {
        if (!data?.pointsEconomy) return [new Date().getFullYear()];
        const years = [...new Set(data.pointsEconomy.map(r => parseInt(r.month.split('-')[0])))];
        if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());
        return years.sort();
    }, [data]);

    const pointsEconomyData = useMemo(() => {
        if (!data?.pointsEconomy) return [];
        if (pointsTimeRange === 'year') {
            const yearMap = {};
            data.pointsEconomy.forEach(row => {
                const y = row.month.split('-')[0];
                if (!yearMap[y]) yearMap[y] = { name: y, Earned: 0, Redeemed: 0 };
                if (row.type === 'earn') yearMap[y].Earned += row.amount;
                else if (row.type === 'redeem') yearMap[y].Redeemed += row.amount;
            });
            return Object.values(yearMap);
        }
        const filtered = data.pointsEconomy.filter(r => r.month.startsWith(String(pointsYear)));
        const grouped = {};
        filtered.forEach(row => {
            const [, m] = row.month.split('-');
            const label = MONTH_LABELS[parseInt(m) - 1];
            if (!grouped[label]) grouped[label] = { name: label, Earned: 0, Redeemed: 0 };
            if (row.type === 'earn') grouped[label].Earned += row.amount;
            else if (row.type === 'redeem') grouped[label].Redeemed += row.amount;
        });
        return MONTH_LABELS.map(m => grouped[m] || { name: m, Earned: 0, Redeemed: 0 });
    }, [data, pointsYear, pointsTimeRange]);

    const machineData = useMemo(() => {
        if (!data?.machineUtilization) return [];
        return data.machineUtilization.map(m => ({
            name: m.name,
            Items: m.itemCount,
            Sessions: m.sessionCount,
            status: m.isOnline ? 'Online' : 'Offline',
            organizationId: m.organizationId,
            organizationName: m.organizationName,
        }));
    }, [data]);

    // Machine location filter options (superadmin only)
    const machineLocationOptions = useMemo(() => {
        const orgs = [...new Map(machineData.map(m => [m.organizationId, m.organizationName])).entries()];
        return [
            { value: 'all', label: 'All Locations' },
            ...orgs.map(([id, name]) => ({ value: id, label: name }))
        ];
    }, [machineData]);

    // Filtered machine data by location
    const filteredMachineData = useMemo(() => {
        if (machineLocationFilter === 'all') return machineData;
        return machineData.filter(m => m.organizationId === machineLocationFilter);
    }, [machineData, machineLocationFilter]);

    const peakHoursData = useMemo(() => {
        if (!data?.peakHours) return [];
        const hours = Array.from({ length: 24 }, (_, i) => ({
            name: `${i.toString().padStart(2, '0')}:00`,
            Bottles: 0,
        }));
        data.peakHours.forEach(h => { hours[h.hour].Bottles = h.count; });
        return hours;
    }, [data]);

    const peakDaysData = useMemo(() => {
        if (!data?.peakDays) return [];
        const dayMap = {};
        data.peakDays.forEach(d => { dayMap[d.day] = d.count; });
        return DAY_ORDER.map(day => ({ name: day, Bottles: dayMap[day] || 0 }));
    }, [data]);

    const userTypePieData = useMemo(() => {
        if (!data?.userTypeDistribution) return [];
        return data.userTypeDistribution.map(d => ({
            name: d.type.charAt(0).toUpperCase() + d.type.slice(1),
            value: d.count,
        }));
    }, [data]);

    const conditionPieData = useMemo(() => {
        if (!data?.conditionDistribution) return [];
        return data.conditionDistribution.map(d => ({ name: d.condition, value: d.count }));
    }, [data]);

    const rewardData = useMemo(() => {
        if (!data?.rewardInsights) return [];
        return data.rewardInsights.map(r => ({
            name: r.name,
            fullName: r.name,
            Redemptions: r.redemptionCount,
            'Points Spent': r.totalPointsSpent,
            pointsRequired: r.pointsRequired,
        }));
    }, [data]);

    const locationData = useMemo(() => data?.locationComparison || [], [data]);

    // Filtered location data based on org TYPE filter
    const filteredLocationData = useMemo(() => {
        if (orgTypeFilter === 'all') return locationData;
        return locationData.filter(loc => loc.orgType === orgTypeFilter);
    }, [locationData, orgTypeFilter]);

    // Org type dropdown options derived from location data
    const orgTypeOptions = useMemo(() => {
        const types = [...new Set(locationData.map(loc => loc.orgType).filter(Boolean))];
        return [
            { value: 'all', label: 'All Types' },
            ...types.map(t => ({ value: t, label: t }))
        ];
    }, [locationData]);

    const summary = data?.summary || {};

    // ─── Export helpers ──────────────────────────────────────────────
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const exportCSV = () => runWithProgress('Preparing export...', async () => {
        if (!data) return;
        const rows = [['Section', 'Metric', 'Value']];

        // Summary
        rows.push(['Summary', 'Total Bottles', summary.totalItems || 0]);
        rows.push(['Summary', 'Total Points', summary.totalPoints || 0]);
        rows.push(['Summary', 'Sessions', summary.totalSessions || 0]);
        rows.push(['Summary', 'Redemptions', summary.totalRedemptions || 0]);
        rows.push(['Summary', 'Total Users', summary.totalUsers || 0]);
        rows.push([]);

        // Recycling Trends
        rows.push(['Recycling Trends', 'Month', 'Accepted', 'Rejected'].join(',').split(','));
        recyclingTrendData.forEach(d => rows.push(['Recycling Trends', d.name, d.Accepted, d.Rejected]));
        rows.push([]);

        // User Growth
        rows.push(['User Growth', 'Month', 'New Users'].join(',').split(','));
        userGrowthData.forEach(d => rows.push(['User Growth', d.name, d['New Users']]));
        rows.push([]);

        // Points Economy
        rows.push(['Points Economy', 'Month', 'Earned', 'Redeemed'].join(',').split(','));
        pointsEconomyData.forEach(d => rows.push(['Points Economy', d.name, d.Earned, d.Redeemed]));
        rows.push([]);

        // Machine Utilization
        rows.push(['Machine Utilization', 'Machine', 'Items', 'Sessions', 'Status'].join(',').split(','));
        machineData.forEach(d => rows.push(['Machine Utilization', d.name, d.Items, d.Sessions, d.status]));
        rows.push([]);

        // Peak Hours
        rows.push(['Peak Hours', 'Hour', 'Bottles'].join(',').split(','));
        peakHoursData.forEach(d => rows.push(['Peak Hours', d.name, d.Bottles]));
        rows.push([]);

        // Peak Days
        rows.push(['Peak Days', 'Day', 'Bottles'].join(',').split(','));
        peakDaysData.forEach(d => rows.push(['Peak Days', d.name, d.Bottles]));
        rows.push([]);

        // Rewards
        rows.push(['Top Rewards', 'Reward', 'Redemptions', 'Points Spent'].join(',').split(','));
        rewardData.forEach(d => rows.push(['Top Rewards', d.fullName, d.Redemptions, d['Points Spent']]));

        // Location Comparison
        if (locationData.length > 0) {
            rows.push([]);
            rows.push(['Location Comparison', 'Location', 'Type', 'Bottles', 'Points', 'Users'].join(',').split(','));
            locationData.forEach(d => rows.push(['Location Comparison', d.name, d.orgType || '', d.bottles, d.points, d.users]));
        }

        const csvContent = rows.map(r => Array.isArray(r) ? r.map(c => `"${c}"`).join(',') : '').join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EcoPoints_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    }, { successLabel: 'Export ready' });

    const exportPDF = () => {
        if (!data) return;
        // Build a printable HTML document
        const now = new Date().toLocaleString();
        let html = `
            <html><head><title>EcoPoints Analytics Report</title>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 900px; margin: 0 auto; }
                h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
                h2 { color: #334155; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 13px; }
                th { background: #f1f5f9; text-align: left; padding: 8px 12px; font-weight: 600; border: 1px solid #e2e8f0; }
                td { padding: 6px 12px; border: 1px solid #e2e8f0; }
                .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 16px 0; }
                .stat-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center; }
                .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-card .value { font-size: 22px; font-weight: 800; color: #065f46; margin-top: 4px; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
                @media print { body { padding: 20px; } }
            </style></head><body>
            <h1>EcoPoints Analytics Report</h1>
            <p style="color:#64748b;font-size:13px;">Generated on ${now}</p>

            <h2>Summary</h2>
            <div class="stat-grid">
                <div class="stat-card"><div class="label">Total Bottles</div><div class="value">${(summary.totalItems || 0).toLocaleString()}</div></div>
                <div class="stat-card"><div class="label">Total Points</div><div class="value">${(summary.totalPoints || 0).toLocaleString()}</div></div>
                <div class="stat-card"><div class="label">Sessions</div><div class="value">${(summary.totalSessions || 0).toLocaleString()}</div></div>
                <div class="stat-card"><div class="label">Redemptions</div><div class="value">${(summary.totalRedemptions || 0).toLocaleString()}</div></div>
                <div class="stat-card"><div class="label">Users</div><div class="value">${(summary.totalUsers || 0).toLocaleString()}</div></div>
            </div>`;

        // Recycling Trends table
        html += '<h2>Recycling Trends</h2><table><tr><th>Period</th><th>Accepted</th><th>Rejected</th></tr>';
        recyclingTrendData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d.Accepted}</td><td>${d.Rejected}</td></tr>`; });
        html += '</table>';

        // User Growth table
        html += `<h2>User Growth (${userGrowthYear})</h2><table><tr><th>Month</th><th>New Users</th></tr>`;
        userGrowthData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d['New Users']}</td></tr>`; });
        html += '</table>';

        // Points Economy table
        html += `<h2>Points Economy (${pointsYear})</h2><table><tr><th>Month</th><th>Earned</th><th>Redeemed</th></tr>`;
        pointsEconomyData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d.Earned}</td><td>${d.Redeemed}</td></tr>`; });
        html += '</table>';

        // Machine Utilization
        html += '<h2>Machine Utilization</h2><table><tr><th>Machine</th><th>Items</th><th>Sessions</th><th>Status</th></tr>';
        machineData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d.Items}</td><td>${d.Sessions}</td><td>${d.status}</td></tr>`; });
        html += '</table>';

        // Peak Hours
        html += '<h2>Peak Hours</h2><table><tr><th>Hour</th><th>Bottles</th></tr>';
        peakHoursData.forEach(d => { if (d.Bottles > 0) html += `<tr><td>${d.name}</td><td>${d.Bottles}</td></tr>`; });
        html += '</table>';

        // Peak Days
        html += '<h2>Peak Days of Week</h2><table><tr><th>Day</th><th>Bottles</th></tr>';
        peakDaysData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d.Bottles}</td></tr>`; });
        html += '</table>';

        // Top Rewards
        html += '<h2>Top Rewards</h2><table><tr><th>Reward</th><th>Redemptions</th><th>Points Spent</th></tr>';
        rewardData.forEach(d => { html += `<tr><td>${d.fullName}</td><td>${d.Redemptions}</td><td>${d['Points Spent']}</td></tr>`; });
        html += '</table>';

        // Location Comparison
        if (locationData.length > 0) {
            html += '<h2>Location Comparison</h2><table><tr><th>Location</th><th>Type</th><th>Bottles</th><th>Points</th><th>Users</th></tr>';
            locationData.forEach(d => { html += `<tr><td>${d.name}</td><td>${d.orgType || '—'}</td><td>${d.bottles}</td><td>${d.points}</td><td>${d.users}</td></tr>`; });
            html += '</table>';
        }

        html += `<div class="footer">EcoPoints Recycling System — Analytics Report — ${now}</div></body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 400);
        setShowExportMenu(false);
    };

    // ─── Loading / Error states ──────────────────────────────────────
    if (loading) {
        return (
            <div className="space-y-8">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="animate-pulse">
                        <div className="h-8 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                        <div className="h-4 w-64 bg-slate-100 dark:bg-slate-700/50 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                    </div>
                </div>
                {/* Stat cards skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
                {/* Chart skeletons */}
                <SkeletonChart height="h-96" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SkeletonChart />
                    <SkeletonChart />
                </div>
                <SkeletonChart />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-bold mb-2">Error Loading Analytics</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    if (!mounted) return null;

    // Shared styles
    const barCursorStyle = { fill: 'rgba(156, 163, 175, 0.1)' };
    const legendFormatter = (value) => <span style={{ marginRight: '16px', color: '#9ca3af' }}>{value}</span>;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white system:text-[#E1E4E1] tracking-tight">
                        Analytics
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60 mt-1">
                        Comprehensive insights across your recycling ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchAnalytics(true)}
                        disabled={loading || refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                            bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200
                            dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:border-slate-700
                            system:bg-[#0F1B11] system:text-[#E1E4E1]/70 system:hover:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.2)]
                            disabled:opacity-50"
                        title="Refresh data"
                    >
                        <RefreshCw size={15} className={loading || refreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{loading || refreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>

                    {/* Export Button */}
                    {hasPermission('analytics', 'export') && (
                    <div className="relative" ref={exportRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                                bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200
                                dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 dark:border-emerald-500/30
                                system:bg-emerald-500/10 system:text-emerald-400 system:hover:bg-emerald-500/20 system:border-emerald-500/20"
                            title="Generate Report"
                        >
                            <Download size={15} />
                            <span className="hidden sm:inline">Generate Report</span>
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-52 z-50 rounded-xl shadow-2xl overflow-hidden
                                bg-white border border-slate-200 dark:bg-[#1e293b] dark:border-slate-700
                                system:bg-[#1A2E1F] system:border-[rgba(123,160,91,0.3)]">
                                <div className="py-1">
                                    <button onClick={exportCSV}
                                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                                            text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50
                                            system:text-[#E1E4E1]/70 system:hover:bg-[#0F1B11]">
                                        <FileText size={16} className="text-emerald-500" />
                                        <div>
                                            <p className="font-medium">Export as CSV</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Spreadsheet format</p>
                                        </div>
                                    </button>
                                    <button onClick={exportPDF}
                                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                                            text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50
                                            system:text-[#E1E4E1]/70 system:hover:bg-[#0F1B11]">
                                        <FileText size={16} className="text-red-500" />
                                        <div>
                                            <p className="font-medium">Export as PDF</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">Print-ready report</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>
            </div>

            {/* ─── 1. SUMMARY STAT CARDS (5 cards, centered text) ─────── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <AnalyticsStat title="Total Bottles" value={summary.totalItems || 0} icon={Recycle} color="emerald" />
                <AnalyticsStat title="Total Points" value={summary.totalPoints || 0} icon={Zap} color="amber" />
                <AnalyticsStat title="Sessions" value={summary.totalSessions || 0} icon={Activity} color="blue" />
                <AnalyticsStat title="Redemptions" value={summary.totalRedemptions || 0} icon={Trophy} color="purple" />
                <AnalyticsStat title="Total Users" value={summary.totalUsers || 0} icon={Users} color="teal" />
            </div>

            {/* ─── 2. RECYCLING TRENDS (exact dashboard controls) ──────── */}
            <SectionCard
                title="Recycling Trends"
                icon={TrendingUp}
                headerRight={
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Year Picker for Recycling Trends — only in Monthly mode */}
                        {trendTimeRange === 'month' && (
                            <YearPicker
                                value={trendYear}
                                onChange={setTrendYear}
                                options={availableTrendYears}
                            />
                        )}

                        {/* Chart Type Toggle with Sliding Indicator */}
                        <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            <div
                                className="absolute top-1 bottom-1 w-8 rounded-md bg-indigo-500 shadow-md transition-transform duration-300 ease-out"
                                style={{ transform: `translateX(${trendChartType === 'line' ? '0px' : trendChartType === 'bar' ? '32px' : '64px'})` }}
                            />
                            <button onClick={() => setTrendChartType('line')} className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${trendChartType === 'line' ? 'text-white' : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'}`} title="Line Chart">
                                <TrendingUp size={16} />
                            </button>
                            <button onClick={() => setTrendChartType('bar')} className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${trendChartType === 'bar' ? 'text-white' : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'}`} title="Bar Chart">
                                <BarChart3 size={16} />
                            </button>
                            <button onClick={() => setTrendChartType('pie')} className={`relative z-10 p-2 rounded-md transition-colors duration-200 ${trendChartType === 'pie' ? 'text-white' : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'}`} title="Pie Chart">
                                <PieChartIcon size={16} />
                            </button>
                        </div>

                        {/* Time Range Pills with Sliding Indicator */}
                        <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                            <div
                                className="absolute top-1 bottom-1 w-[64px] rounded-md bg-emerald-500 shadow-md transition-transform duration-300 ease-out"
                                style={{ transform: `translateX(${trendTimeRange === 'week' ? '0px' : trendTimeRange === 'month' ? '64px' : '128px'})` }}
                            />
                            {[
                                { key: 'week', label: 'Weekly' },
                                { key: 'month', label: 'Monthly' },
                                { key: 'year', label: 'Yearly' }
                            ].map((range) => (
                                <button
                                    key={range.key}
                                    onClick={() => setTrendTimeRange(range.key)}
                                    className={`relative z-10 w-[64px] py-1.5 rounded-md text-xs font-medium transition-colors duration-200 text-center ${trendTimeRange === range.key
                                        ? 'text-white'
                                        : 'text-slate-600 dark:text-slate-400 system:text-[#E1E4E1]/60'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            >
                {mounted ? (
                    <div className="w-full h-96">
                        <ResponsiveContainer key={`${trendChartType}-${trendTimeRange}`} width="100%" height="100%" minHeight={100} minWidth={100}>
                        {trendChartType === 'line' ? (
                            <LineChart data={trendFilteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.3)" />
                                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" formatter={legendFormatter} />
                                <Line type="monotone" dataKey="Accepted" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }} animationDuration={800} />
                                <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#ef4444', stroke: '#fff', strokeWidth: 3 }} animationDuration={800} animationBegin={200} />
                            </LineChart>
                        ) : trendChartType === 'bar' ? (
                            <BarChart data={trendFilteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.3)" />
                                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" formatter={legendFormatter} />
                                <Bar dataKey="Accepted" fill="#10b981" radius={[4, 4, 0, 0]} animationDuration={600} />
                                <Bar dataKey="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={600} animationBegin={150} />
                            </BarChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={trendPieData}
                                    cx="50%" cy="50%"
                                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                    label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={120}
                                    fill="#10b981" dataKey="value"
                                    animationDuration={800}
                                >
                                    {trendPieData.map((_, i) => (
                                        <Cell key={i} fill={['#10b981', '#ef4444'][i]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" formatter={legendFormatter} />
                            </PieChart>
                        )}
                        </ResponsiveContainer>
                    </div>
                ) : <div className="w-full h-96 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
            </SectionCard>

            {/* ─── 3. TWO-COLUMN: User Growth + Points Economy ────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard
                    title="User Growth"
                    icon={Users}
                    headerRight={
                        <div className="flex items-center gap-2 flex-wrap">
                            {userGrowthTimeRange === 'month' && (
                                <YearPicker
                                    value={userGrowthYear}
                                    onChange={setUserGrowthYear}
                                    options={availableUserGrowthYears}
                                    direction="up"
                                />
                            )}
                            <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                                <div
                                    className="absolute top-1 bottom-1 w-[64px] rounded-md bg-emerald-500 shadow-md transition-transform duration-300 ease-out"
                                    style={{ transform: `translateX(${userGrowthTimeRange === 'month' ? '0px' : '64px'})` }}
                                />
                                {[{ key: 'month', label: 'Monthly' }, { key: 'year', label: 'Yearly' }].map((range) => (
                                    <button
                                        key={range.key}
                                        onClick={() => setUserGrowthTimeRange(range.key)}
                                        className={`relative z-10 w-[64px] py-1.5 rounded-md text-xs font-medium transition-colors duration-200 text-center ${userGrowthTimeRange === range.key
                                            ? 'text-white'
                                            : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'}`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    }
                >
                    {mounted ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                <BarChart data={userGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                    <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" formatter={legendFormatter} />
                                    <Bar dataKey="New Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={600} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>

                <SectionCard
                    title="Points Economy"
                    icon={Zap}
                    headerRight={
                        <div className="flex items-center gap-2 flex-wrap">
                            {pointsTimeRange === 'month' && (
                                <YearPicker
                                    value={pointsYear}
                                    onChange={setPointsYear}
                                    options={availablePointsYears}
                                    direction="up"
                                />
                            )}
                            <div className="relative flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 system:bg-[#0F1B11]">
                                <div
                                    className="absolute top-1 bottom-1 w-[64px] rounded-md bg-emerald-500 shadow-md transition-transform duration-300 ease-out"
                                    style={{ transform: `translateX(${pointsTimeRange === 'month' ? '0px' : '64px'})` }}
                                />
                                {[{ key: 'month', label: 'Monthly' }, { key: 'year', label: 'Yearly' }].map((range) => (
                                    <button
                                        key={range.key}
                                        onClick={() => setPointsTimeRange(range.key)}
                                        className={`relative z-10 w-[64px] py-1.5 rounded-md text-xs font-medium transition-colors duration-200 text-center ${pointsTimeRange === range.key
                                            ? 'text-white'
                                            : 'text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60'}`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    }
                >
                    {mounted ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                <BarChart data={pointsEconomyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                    <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" formatter={legendFormatter} />
                                    <Bar dataKey="Earned" fill="#10b981" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="Redeemed" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>
            </div>

            {/* ─── 4. PEAK HOURS + PEAK DAYS ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="Peak Hours" icon={Clock}>
                {mounted ? (
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                            <BarChart data={peakHoursData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '10px' }} tick={{ fill: '#9ca3af' }} interval={2} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                <Bar dataKey="Bottles" radius={[3, 3, 0, 0]}>
                                    {peakHoursData.map((entry, index) => (
                                        <Cell key={index} fill={entry.Bottles === Math.max(...peakHoursData.map(h => h.Bottles)) && entry.Bottles > 0 ? '#10b981' : '#06b6d4'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>

                <SectionCard title="Peak Days of Week" icon={Activity}>
                {mounted ? (
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                            <BarChart data={peakDaysData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                <Bar dataKey="Bottles" radius={[4, 4, 0, 0]}>
                                    {peakDaysData.map((entry, index) => (
                                        <Cell key={index} fill={entry.Bottles === Math.max(...peakDaysData.map(d => d.Bottles)) && entry.Bottles > 0 ? '#8b5cf6' : '#06b6d4'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>
            </div>

            {/* ─── 5. MACHINE UTILIZATION ─────────────────────────────── */}
            <SectionCard
                title="Machine Utilization"
                icon={Package}
                headerRight={
                    machineData.length > 0 && (
                        <div className="flex items-center gap-2">
                            {isSuperAdmin && machineLocationOptions.length > 2 && (
                                <div className="w-40">
                                    <CustomDropdown
                                        value={machineLocationFilter}
                                        onChange={setMachineLocationFilter}
                                        options={machineLocationOptions}
                                        
                                    />
                                </div>
                            )}
                            <button
                                onClick={() => setShowMachineStatus(!showMachineStatus)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                                    ${showMachineStatus
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 system:bg-emerald-500/20 system:text-emerald-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 system:bg-[#0F1B11] system:text-[#E1E4E1]/60'
                                    } hover:scale-105`}
                            >
                                {showMachineStatus ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                Machine Status
                            </button>
                        </div>
                    )
                }
            >
                {machineData.length > 0 ? (
                    <div className="space-y-4">
                        {mounted ? (
                            <div className="w-full" style={{ height: Math.max(280, filteredMachineData.length * 50 + 60) }}>
                                <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                <BarChart data={filteredMachineData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                    <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                    <YAxis type="category" dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} width={140} />
                                    <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} iconType="circle" formatter={legendFormatter} />
                                    <Bar dataKey="Items" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                                    <Bar dataKey="Sessions" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        ) : <div style={{ height: 280 }} className="flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}

                        {/* Expandable Machine Status Panel — separated Online / Offline */}
                        {showMachineStatus && (
                            <div className="mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 system:bg-[#0F1B11]/40 border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.15)]">
                                {/* Online Machines */}
                                {filteredMachineData.filter(m => m.status === 'Online').length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Wifi size={14} className="text-emerald-500" />
                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 system:text-emerald-400">
                                                Online ({filteredMachineData.filter(m => m.status === 'Online').length})
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filteredMachineData.filter(m => m.status === 'Online').map((m, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                                                    bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 system:bg-emerald-500/10 system:border-emerald-500/15">
                                                    <Wifi size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]/80 truncate">{m.name}</p>
                                                        {isSuperAdmin && <p className="text-xs text-slate-400 dark:text-slate-500 system:text-[#E1E4E1]/40">{m.organizationName}</p>}
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline Machines */}
                                {filteredMachineData.filter(m => m.status === 'Offline').length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <WifiOff size={14} className="text-red-500" />
                                            <span className="text-sm font-bold text-red-600 dark:text-red-400 system:text-red-400">
                                                Offline ({filteredMachineData.filter(m => m.status === 'Offline').length})
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {filteredMachineData.filter(m => m.status === 'Offline').map((m, i) => (
                                                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                                                    bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 system:bg-red-500/10 system:border-red-500/15">
                                                    <WifiOff size={16} className="text-red-500 dark:text-red-400 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]/80 truncate">{m.name}</p>
                                                        {isSuperAdmin && <p className="text-xs text-slate-400 dark:text-slate-500 system:text-[#E1E4E1]/40">{m.organizationName}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {filteredMachineData.length === 0 && (
                                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">No machines for this location</p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No machine data available</p>
                )}
            </SectionCard>

            {/* ─── 6. TWO-COLUMN: User Types + Bottle Conditions ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="User Types" icon={Users}>
                    {mounted ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                <PieChart>
                                    <Pie
                                        data={userTypePieData}
                                        cx="50%" cy="45%"
                                        label={renderPieLabel}
                                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                        outerRadius={90} innerRadius={45}
                                        fill="#10b981" dataKey="value" animationDuration={800}
                                    >
                                        {userTypePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" formatter={legendFormatter} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>

                <SectionCard title="Bottle Conditions" icon={Recycle}>
                    {mounted ? (
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                <PieChart>
                                    <Pie
                                        data={conditionPieData}
                                        cx="50%" cy="45%"
                                        label={renderPieLabel}
                                        labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                        outerRadius={90} innerRadius={45}
                                        fill="#10b981" dataKey="value" animationDuration={800}
                                    >
                                        {conditionPieData.map((_, i) => (
                                            <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444', '#6366f1'][i % 4]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} iconType="circle" formatter={legendFormatter} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : <div className="w-full h-80 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}
                </SectionCard>
            </div>

            {/* ─── 7. TOP REWARDS ─────────────────────────────────────── */}
            <SectionCard title="Top Rewards" icon={Trophy}>
                {rewardData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewardData.slice(0, 9).map((r, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 system:bg-[#0F1B11]/40 border border-slate-100 dark:border-slate-700/50 system:border-[rgba(123,160,91,0.1)] hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]/80 truncate">{r.fullName}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 system:text-[#E1E4E1]/40">{r.pointsRequired} pts required</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right ml-3">
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">{r.Redemptions}x</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">redeemed</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No reward data available</p>
                )}
            </SectionCard>

            {/* ─── 8. LOCATION COMPARISON (superadmin only) ───────────── */}
            {isSuperAdmin && locationData.length > 0 && (
                <SectionCard
                    title="Location Comparison"
                    icon={MapPin}
                    headerRight={
                        <div className="w-44">
                            <CustomDropdown
                                value={orgTypeFilter}
                                onChange={setOrgTypeFilter}
                                options={orgTypeOptions}
                                direction="up"
                            />
                        </div>
                    }
                >
                    <div className="space-y-6">
                        {mounted ? (
                            <div className="w-full h-96">
                                <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                                    <BarChart data={filteredLocationData} margin={{ bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,200,200,0.2)" />
                                        <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} angle={-15} textAnchor="end" />
                                        <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                                        <Tooltip content={<ChartTooltip />} cursor={barCursorStyle} />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" formatter={legendFormatter} />
                                        <Bar dataKey="bottles" name="Bottles" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="users" name="Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="w-full h-96 flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}

                        {/* Data table (max 5 visible rows, scrollable) */}
                        <div className="overflow-x-auto max-h-[280px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 system:bg-[#0F1B11]">
                                    <tr className="border-b border-slate-200 dark:border-slate-700 system:border-[rgba(123,160,91,0.2)]">
                                        <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Location</th>
                                        <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Type</th>
                                        <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Bottles</th>
                                        <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Points</th>
                                        <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">Users</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLocationData.map((loc, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 system:border-[rgba(123,160,91,0.1)] hover:bg-slate-50 dark:hover:bg-slate-800/30 system:hover:bg-[#0F1B11]/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 system:text-[#E1E4E1]/80">{loc.name}</td>
                                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 system:text-[#E1E4E1]/60">{formatField(loc.orgType)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 system:text-[#7BA05B]">{loc.bottles.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-600 dark:text-amber-400 system:text-amber-400">{loc.points.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right font-bold text-blue-600 dark:text-cyan-400 system:text-cyan-400">{loc.users.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function AnalyticsPage() {
    return (
        <RequirePermission category="analytics">
            <AnalyticsPageContent />
        </RequirePermission>
    );
}
