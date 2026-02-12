import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Trophy, Medal, Crown, Users, Building2, GraduationCap, Briefcase,
    Search, Globe, Layers, School, BookOpen, Zap, Target, TrendingUp,
    TrendingDown, Sparkles, Flame, Award, Star, ChevronLeft, ChevronRight,
    Leaf, Wind, Recycle, PartyPopper, ArrowUp, MousePointer2,
    Cloud, Sun, Sprout, Filter, ChevronDown, ListFilter, UserCircle, Check
} from 'lucide-react';

// --- THEME CONFIG ---
const THEME = {
    bg: 'bg-[#f0fdf4]',
    cardBg: 'bg-white',
    textMain: 'text-stone-800',
    textMuted: 'text-stone-500',
};

// --- SIMULATED LOGGED-IN USER ---
const CURRENT_USER = {
    id: 'u_me',
    name: 'John Paul (You)',
    avatar: 'JP',
    role: 'Student',
    type: 'COLLEGE',
    schoolId: 'pup_main',
    schoolName: 'PUP Main',
    dept: 'BSIT',
    strand: null,
    section: '3-1'
};

// --- DATA CONSTANTS ---
const ROLES = { STUDENT: 'Student', FACULTY: 'Faculty', STAFF: 'Staff' };
const ROLE_OPTIONS = ['All', 'Student', 'Faculty', 'Staff'];

const SORT_OPTIONS = [
    { value: 'POINTS', label: 'Most EcoPoints' },
    { value: 'BOTTLES', label: 'Most Bottles' },
    { value: 'STREAK', label: 'Highest Streak' }
];

// --- MOCK DATA GENERATOR (Data Seeding Ready) ---
const generateLargeDataset = () => {
    // Base real users
    const baseUsers = [
        { id: 'u_me', name: 'John Paul (You)', avatar: 'JP', points: 1850, role: ROLES.STUDENT, type: 'COLLEGE', schoolId: 'pup_main', dept: 'BSIT', section: '3-1', bottlesCollected: 370, streak: 12 },
        { id: 1, name: 'Maria Santos', avatar: 'MS', points: 2850, role: ROLES.STUDENT, type: 'COLLEGE', schoolId: 'pup_main', dept: 'BS Nursing', section: '3-A', bottlesCollected: 570, streak: 15 },
        { id: 2, name: 'Juan Dela Cruz', avatar: 'JD', points: 2680, role: ROLES.STUDENT, type: 'COLLEGE', schoolId: 'pup_main', dept: 'BSCS', section: '3-1', bottlesCollected: 560, streak: 20 },
        { id: 3, name: 'Anna Reyes', avatar: 'AR', points: 2450, role: ROLES.STUDENT, type: 'SHS', schoolId: 'pup_taguig', strand: 'ABM', section: '12-Gold', bottlesCollected: 490, streak: 20 },
    ];

    // Seed data
    const firstNames = ["James", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris"];
    const sections = ["3-1", "3-2", "4-1", "1-A", "12-A", "11-B", "12-Tech"];
    const depts = ["BSIT", "BSCS", "BS Nursing", "BSBA", "BSEd"];
    const strands = ["STEM", "ABM", "HUMSS", "ICT"];

    // Generate 100 random users
    const generated = Array.from({ length: 100 }, (_, i) => {
        const fName = firstNames[i % firstNames.length];
        const lName = lastNames[i % lastNames.length];
        const isCollege = Math.random() > 0.3;

        return {
            id: `gen_${i}`,
            name: `${fName} ${lName}`,
            avatar: `${fName[0]}${lName[0]}`,
            points: Math.floor(Math.random() * 2500) + 100,
            role: Math.random() > 0.9 ? ROLES.FACULTY : ROLES.STUDENT,
            type: isCollege ? 'COLLEGE' : 'SHS',
            schoolId: 'pup_main',
            dept: isCollege ? depts[i % depts.length] : null,
            strand: !isCollege ? strands[i % strands.length] : null,
            section: sections[i % sections.length],
            bottlesCollected: Math.floor(Math.random() * 600),
            streak: Math.floor(Math.random() * 40)
        };
    });

    return [...baseUsers, ...generated];
};

const USERS_DATA = generateLargeDataset();

const SCHOOLS_DATA = [
    { id: 'pup_main', name: 'PUP Main', avatar: 'PUP', points: 154000, bottlesCollected: 30800, role: 'Campus', streak: 45 },
    { id: 'pup_taguig', name: 'PUP Taguig', avatar: 'TAG', points: 124500, bottlesCollected: 24900, role: 'Campus', streak: 30 },
    { id: 'pup_qc', name: 'PUP QC', avatar: 'QC', points: 98000, bottlesCollected: 19600, role: 'Campus', streak: 12 },
    { id: 'pup_sj', name: 'PUP San Juan', avatar: 'SJ', points: 86500, bottlesCollected: 17300, role: 'Campus', streak: 20 },
    { id: 'pup_mnl', name: 'PUP Manila', avatar: 'MNL', points: 154000, bottlesCollected: 30100, role: 'Campus', streak: 40 },
];

const CONTEXT_TABS = {
    OVERALL: { id: 'overall', label: 'Overall', icon: Globe, color: 'bg-indigo-500' },
    SCHOOLS: { id: 'schools', label: 'Top Schools', icon: Building2, color: 'bg-rose-500' },
    MY_SCHOOL: { id: 'my_school', label: 'My School', icon: School, color: 'bg-lime-600' },
    MY_STRAND: { id: 'my_strand', label: 'My Strand', icon: BookOpen, color: 'bg-violet-500' },
    MY_DEPT: { id: 'my_dept', label: 'My Dept', icon: GraduationCap, color: 'bg-amber-500' },
    MY_SECTION: { id: 'my_section', label: 'My Section', icon: Users, color: 'bg-teal-500' },
};

const formatPoints = (points) => points.toLocaleString();

// --- CUSTOM HOOKS ---
const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const updateMousePosition = ev => setMousePosition({ x: ev.clientX, y: ev.clientY });
        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);
    return mousePosition;
};

// --- ANIMATION COMPONENTS ---
const LeafCursor = () => {
    const { x, y } = useMousePosition();
    const [trail, setTrail] = useState([]);
    const lastPos = useRef({ x: 0, y: 0 });
    const frameRef = useRef(0);

    useEffect(() => {
        const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
        if (dist > 15) {
            const id = Date.now() + Math.random();
            const type = Math.random() > 0.7 ? 'wind' : 'leaf';
            const rotation = Math.random() * 360;
            const size = Math.random() * 8 + 6;
            const driftX = (Math.random() - 0.5) * 2;
            setTrail(prev => [...prev.slice(-20), { x, y, id, type, rotation, size, driftX, life: 1 }]);
            lastPos.current = { x, y };
        }
    }, [x, y]);

    useEffect(() => {
        const animate = () => {
            setTrail(prev => prev.map(p => ({
                ...p, life: p.life - 0.04, y: p.y + 1.5, x: p.x + p.driftX, rotation: p.rotation + 2
            })).filter(p => p.life > 0));
            frameRef.current = requestAnimationFrame(animate);
        };
        frameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    return (
        <>
            {trail.map(p => (
                <div key={p.id} className="fixed pointer-events-none z-[100] text-lime-400/60" style={{ left: p.x, top: p.y, transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`, opacity: p.life, scale: p.life }}>
                    {p.type === 'leaf' ? <Leaf size={p.size} fill="currentColor" /> : <Wind size={p.size} />}
                </div>
            ))}
            <div className="fixed pointer-events-none z-[100] text-lime-600 drop-shadow-md transition-transform duration-75 ease-out" style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${x * 0.1}deg) scale(1.2)` }}>
                <Leaf size={28} fill="#a3e635" className="text-lime-800" strokeWidth={2} />
            </div>
        </>
    );
};

const ParallaxBackground = () => {
    const { x, y } = useMousePosition();
    const moveX = (x - window.innerWidth / 2) / 35;
    const moveY = (y - window.innerHeight / 2) / 35;
    const lean = (x - window.innerWidth / 2) / 45;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-60">
            <div className="absolute top-20 left-10 transition-transform duration-700 ease-out" style={{ transform: `translate(${moveX * -1.2}px, ${moveY * -1.2}px) rotate(${lean}deg)` }}><Leaf size={60} className="text-lime-200/80" fill="currentColor" /></div>
            <div className="absolute top-1/4 left-1/3 transition-transform duration-1000 ease-out" style={{ transform: `translate(${moveX * 0.5}px, ${moveY * 0.5}px)` }}><Cloud size={80} className="text-white/60" fill="currentColor" /></div>
            <div className="absolute top-20 right-1/4 transition-transform duration-1000 ease-out" style={{ transform: `translate(${moveX * -0.5}px, ${moveY * -0.5}px)` }}><Sun size={60} className="text-amber-100" fill="currentColor" /></div>
            <div className="absolute top-1/3 right-20 transition-transform duration-700 ease-out" style={{ transform: `translate(${moveX}px, ${moveY}px) rotate(${-lean}deg)` }}><Wind size={120} className="text-blue-100" /></div>
            <div className="absolute bottom-1/2 left-10 transition-transform duration-800 ease-out" style={{ transform: `translate(${moveX * -1}px, ${moveY * 1}px)` }}><Sprout size={45} className="text-emerald-200" /></div>
            <div className="absolute bottom-32 left-1/4 transition-transform duration-700 ease-out" style={{ transform: `translate(${moveX * 1.5}px, ${moveY * 1.5}px) rotate(${lean * 0.5}deg)` }}><Zap size={50} className="text-amber-100" fill="currentColor" /></div>
            <div className="absolute bottom-10 right-10 transition-transform duration-900 ease-out" style={{ transform: `translate(${moveX * -1.5}px, ${moveY * -1.5}px)` }}><Leaf size={40} className="text-lime-300" fill="currentColor" /></div>
            <div className="absolute bottom-1/4 right-1/3 transition-transform duration-700 ease-out" style={{ transform: `translate(${moveX * -0.8}px, ${moveY * -0.8}px) rotate(${lean * -0.5}deg)` }}>
                <Recycle size={90} className="text-emerald-100/60" />
            </div>
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-lime-100/40 to-emerald-100/40 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-yellow-100/40 to-orange-100/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>
    );
};

const Confetti = ({ isActive }) => {
    const canvasRef = useRef(null);
    useEffect(() => {
        if (!isActive) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = Array.from({ length: 100 }, () => ({
            x: canvas.width / 2, y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 10,
            size: Math.random() * 10 + 5, color: ['#84cc16', '#facc15', '#f43f5e', '#3b82f6'][Math.floor(Math.random() * 4)], life: 100
        }));
        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let activeParticles = 0;
            particles.forEach(p => {
                if (p.life > 0) { p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life--; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); activeParticles++; }
            });
            if (activeParticles > 0) requestAnimationFrame(animate);
        };
        animate();
    }, [isActive]);
    if (!isActive) return null;
    return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
};

// --- SUB-COMPONENTS ---

const GameButton = ({ children, active, onClick, colorClass = "bg-white", icon: Icon }) => (
    <button
        onClick={onClick}
        className={`
            relative flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-sm tracking-wider transition-all duration-200
            border-b-4 border-r-4 border-stone-800 active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1 cursor-none whitespace-nowrap
            ${active ? `${colorClass} text-white` : 'bg-white text-stone-500 hover:bg-stone-50'}
        `}
    >
        {Icon && <Icon size={18} strokeWidth={3} />}
        {children}
    </button>
);

const CustomDropdown = ({ value, onChange, options, icon: Icon, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange({ target: { value: val } });
        setIsOpen(false);
    };

    const selectedLabel = options.find(o => (typeof o === 'object' ? o.value === value : o === value)) || value;
    const labelToDisplay = typeof selectedLabel === 'object' ? selectedLabel.label : selectedLabel;

    return (
        <div className="relative w-full z-30" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border-b-4 border-r-4 border-stone-800 active:border-b-2 active:border-r-2 active:translate-x-0.5 active:translate-y-0.5 rounded-xl px-4 py-2.5 pr-10 font-black text-stone-600 focus:outline-none flex items-center justify-between transition-all cursor-none text-left"
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon size={18} strokeWidth={3} className="text-stone-400" />}
                    <span>{labelToDisplay || placeholder}</span>
                </div>
                <ChevronDown size={18} strokeWidth={3} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-stone-800 rounded-xl shadow-lg max-h-60 overflow-y-auto cursor-none overflow-hidden">
                    {options.map((opt, idx) => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const label = typeof opt === 'object' ? opt.label : opt;
                        return (
                            <div
                                key={val || idx}
                                onClick={() => handleSelect(val)}
                                className={`px-4 py-3 hover:bg-lime-100 font-bold text-stone-600 cursor-none flex items-center justify-between group border-b border-stone-100 last:border-0 ${val === value ? 'bg-lime-50 text-lime-700' : ''}`}
                            >
                                {label}
                                {val === value && <Check size={16} strokeWidth={3} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const PodiumPillar = ({ user, rank, delay, activeSort }) => {
    const isFirst = rank === 1;
    const height = isFirst ? 'h-64' : rank === 2 ? 'h-48' : 'h-40';
    const bgClass = isFirst ? 'bg-amber-300' : rank === 2 ? 'bg-stone-300' : 'bg-orange-300';

    // Dynamic value display based on sort
    let displayValue = user.points.toLocaleString() + " PTS";
    if (activeSort === 'BOTTLES') displayValue = user.bottlesCollected + " Bottles";
    if (activeSort === 'STREAK') displayValue = user.streak + " Days";

    return (
        <div
            className="flex flex-col items-center justify-end z-10 cursor-none group transition-transform hover:scale-105 duration-300"
            style={{ animation: `slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms backwards` }}
        >
            <div className={`relative mb-4 flex flex-col items-center ${isFirst ? 'animate-bounce-slow' : ''}`}>
                {isFirst && <Crown size={56} className="text-amber-500 mb-3 drop-shadow-md rotate-[-10deg]" strokeWidth={3} fill="#fbbf24" />}

                <div className={`
                    w-20 h-20 rounded-full border-4 border-stone-900 bg-white flex items-center justify-center text-2xl font-black text-stone-900 shadow-md group-hover:rotate-12 transition-transform duration-300
                    ${isFirst ? 'scale-125' : ''}
                `}>
                    {user.avatar}
                </div>
                <div className="mt-2 text-center bg-stone-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                    {displayValue}
                </div>
                <div className="mt-1 font-black text-stone-800 bg-white/80 px-2 rounded-md">{user.name.split(' ')[0]}</div>

                {user.isTieBroken && (
                    <div className="absolute -right-8 top-0 bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md rotate-12 shadow-sm animate-pulse">
                        Wins on {user.tieBreakerReason}!
                    </div>
                )}
            </div>

            <div className={`
                ${height} w-24 sm:w-32 rounded-t-3xl border-4 border-stone-900 ${bgClass}
                relative flex items-start justify-center pt-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]
                group-hover:brightness-110 transition-all
            `}>
                <span className="text-6xl font-black text-stone-900/10 select-none">{rank}</span>
                <div className="absolute bottom-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-900/20" />
                    <div className="w-2 h-2 rounded-full bg-stone-900/20" />
                </div>
            </div>
        </div>
    );
};

const PlayerRow = ({ user, rank, delay, activeSort }) => {
    let roleColorClass = "bg-stone-100 text-stone-500";
    if (user.role === ROLES.STUDENT) roleColorClass = "bg-blue-100 text-blue-700";
    if (user.role === ROLES.FACULTY) roleColorClass = "bg-purple-100 text-purple-700";
    if (user.role === ROLES.STAFF) roleColorClass = "bg-amber-100 text-amber-800";
    if (user.role === 'Campus') roleColorClass = "bg-rose-100 text-rose-800";

    const isStreakActive = activeSort === 'STREAK';
    const isBottlesActive = activeSort === 'BOTTLES';
    const isPointsActive = activeSort === 'POINTS';

    return (
        <div
            className="group relative flex items-center gap-3 sm:gap-4 p-4 mb-3 bg-white rounded-2xl border-2 border-stone-100 hover:border-stone-900 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#1c1917] hover:z-10 animate-in slide-in-from-bottom-4 fade-in fill-mode-backwards cursor-none"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-8 sm:w-10 font-black text-lg sm:text-xl text-stone-300 group-hover:text-lime-600 transition-colors">#{rank}</div>

            <div className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform
                ${user.role === ROLES.STUDENT ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    user.role === ROLES.FACULTY ? 'bg-purple-50 border-purple-200 text-purple-600' :
                        user.role === 'Campus' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                            'bg-amber-50 border-amber-200 text-amber-600'}
            `}>
                {user.avatar}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-stone-800 text-base sm:text-lg leading-none truncate group-hover:text-lime-700 transition-colors">{user.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleColorClass}`}>
                        {user.role}
                    </span>
                </div>

                <div className="text-xs font-bold text-stone-400 uppercase tracking-wide flex flex-wrap items-center gap-x-2 gap-y-1">
                    {user.role === 'Campus' ? (
                        <span>Registered Campus</span>
                    ) : (
                        <>
                            {user.type && <span className="text-stone-500">{user.type}</span>}
                            {user.type && <span className="text-stone-300">•</span>}
                            <span className="truncate">{user.dept || user.strand || 'N/A'}</span>
                            {user.section && <span className="text-stone-300">•</span>}
                            {user.section && <span className="text-lime-600">{user.section}</span>}
                        </>
                    )}
                </div>
            </div>

            {/* Stats Area with Highlighting */}
            <div className="hidden md:flex items-center gap-3 mr-4">
                <div className={`
                    px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all duration-300
                    ${isStreakActive ? 'bg-orange-500 text-white scale-110 shadow-md' : 'bg-orange-50 border border-orange-100 text-orange-600'}
                `}>
                    <Flame size={14} fill="currentColor" /> {user.streak} Streak
                </div>
                <div className={`
                    px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all duration-300
                    ${isBottlesActive ? 'bg-blue-500 text-white scale-110 shadow-md' : 'bg-blue-50 border border-blue-100 text-blue-600'}
                `} title="Bottles Collected">
                    <Recycle size={14} /> {user.bottlesCollected} Bottles
                </div>
            </div>

            <div className={`text-right transition-transform duration-300 ${isPointsActive ? 'scale-110 origin-right' : ''}`}>
                <div className={`font-black text-lg sm:text-xl ${isPointsActive ? 'text-lime-600' : 'text-stone-800'}`}>{user.points.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-lime-600 uppercase">EcoPts</div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function EcoPointsLeaderboardPlayful() {
    const [activeTabId, setActiveTabId] = useState(CONTEXT_TABS.MY_SCHOOL.id);
    const [showConfetti, setShowConfetti] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [sortBy, setSortBy] = useState('POINTS');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const availableTabs = useMemo(() => {
        const tabs = [CONTEXT_TABS.MY_SCHOOL, CONTEXT_TABS.OVERALL, CONTEXT_TABS.SCHOOLS];
        if (CURRENT_USER.type === 'SHS') tabs.push(CONTEXT_TABS.MY_STRAND);
        if (CURRENT_USER.type === 'COLLEGE') tabs.push(CONTEXT_TABS.MY_DEPT);
        tabs.push(CONTEXT_TABS.MY_SECTION);
        return tabs;
    }, []);

    const { leaderboardData, contextTopThree } = useMemo(() => {
        let baseData = activeTabId === CONTEXT_TABS.SCHOOLS.id ? [...SCHOOLS_DATA] : [...USERS_DATA];

        // 1. Context Filtering
        switch (activeTabId) {
            case CONTEXT_TABS.MY_SCHOOL.id: baseData = baseData.filter(u => u.schoolId === CURRENT_USER.schoolId); break;
            case CONTEXT_TABS.MY_STRAND.id: baseData = baseData.filter(u => u.strand === CURRENT_USER.strand); break;
            case CONTEXT_TABS.MY_DEPT.id: baseData = baseData.filter(u => u.dept === CURRENT_USER.dept); break;
            case CONTEXT_TABS.MY_SECTION.id: baseData = baseData.filter(u => u.section === CURRENT_USER.section); break;
            default: break;
        }

        // 2. Role Filter
        if (roleFilter !== 'All') {
            baseData = baseData.filter(u => u.role === roleFilter);
        }

        // 3. Sorting
        baseData.sort((a, b) => {
            if (sortBy === 'BOTTLES') {
                if (b.bottlesCollected !== a.bottlesCollected) return b.bottlesCollected - a.bottlesCollected;
                return b.points - a.points;
            } else if (sortBy === 'STREAK') {
                if (b.streak !== a.streak) return b.streak - a.streak;
                return b.points - a.points;
            } else {
                if (b.points !== a.points) return b.points - a.points;
                return b.bottlesCollected - a.bottlesCollected;
            }
        });

        const contextTopThree = baseData.slice(0, 3);
        let tableData = [...baseData];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            tableData = tableData.filter(item =>
                item.name.toLowerCase().includes(lowerQuery) ||
                item.role.toLowerCase().includes(lowerQuery) ||
                (item.section?.toLowerCase() || '').includes(lowerQuery) ||
                (item.dept?.toLowerCase() || '').includes(lowerQuery) ||
                (item.strand?.toLowerCase() || '').includes(lowerQuery)
            );
        } else {
            tableData = tableData.slice(3);
        }

        return { leaderboardData: tableData, contextTopThree };
    }, [activeTabId, searchQuery, roleFilter, sortBy]);

    useEffect(() => {
        setCurrentPage(1);
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, [activeTabId, sortBy]);

    const totalItems = leaderboardData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedListData = leaderboardData.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className={`min-h-screen ${THEME.bg} font-sans pb-28 overflow-x-hidden selection:bg-lime-200 cursor-none`}>
            <style>{`* { cursor: none !important; }`}</style>
            <Confetti isActive={showConfetti} />
            <LeafCursor />
            <ParallaxBackground />

            <nav className="sticky top-0 z-40 bg-[#f0fdf4]/80 backdrop-blur-md border-b-2 border-stone-200 px-4 py-3 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-lime-500 rounded-xl border-2 border-stone-900 flex items-center justify-center shadow-[3px_3px_0px_0px_#1c1917] group-hover:-translate-y-1 transition-all">
                            <Leaf className="text-white" fill="currentColor" size={20} />
                        </div>
                        <span className="font-black text-stone-800 text-lg tracking-tight group-hover:text-lime-700 transition-colors">EcoPoints</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border-2 border-stone-200 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-stone-500 uppercase">Live Feed</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 mt-8 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-7xl font-black text-stone-900 mb-4 drop-shadow-sm tracking-tight animate-in fade-in zoom-in duration-700">
                        {availableTabs.find(t => t.id === activeTabId)?.label || 'Leaderboard'}
                    </h1>
                    <p className="text-stone-500 font-bold text-xl animate-in slide-in-from-bottom-4 fade-in delay-200">
                        Who is the greenest of them all? 🌿
                    </p>
                </div>

                {/* --- FILTERS AREA --- */}
                <div className="flex flex-col gap-6 mb-12">
                    {/* 1. Main Tabs */}
                    <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar max-w-full justify-start md:justify-center px-2">
                        {availableTabs.map(tab => (
                            <GameButton
                                key={tab.id}
                                active={activeTabId === tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                colorClass={tab.color}
                                icon={tab.icon}
                            >
                                {tab.label}
                            </GameButton>
                        ))}
                    </div>

                    {/* 2. Dropdown Filters (Role & Sort Only - Removed Section) */}
                    <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
                        <div className="w-full md:w-48">
                            <CustomDropdown
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                options={ROLE_OPTIONS}
                                placeholder="All Roles"
                                icon={UserCircle}
                            />
                        </div>
                        <div className="w-full md:w-56">
                            <CustomDropdown
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                options={SORT_OPTIONS}
                                icon={ListFilter}
                            />
                        </div>
                    </div>
                </div>

                {/* --- PODIUM --- */}
                {contextTopThree.length > 0 && (
                    <div className="relative h-[28rem] mb-16 flex justify-center items-end gap-3 sm:gap-8 perspective-[1000px]">
                        {contextTopThree[1] && <PodiumPillar user={contextTopThree[1]} rank={2} delay={200} activeSort={sortBy} />}
                        {contextTopThree[0] && <PodiumPillar user={contextTopThree[0]} rank={1} delay={0} activeSort={sortBy} />}
                        {contextTopThree[2] && <PodiumPillar user={contextTopThree[2]} rank={3} delay={400} activeSort={sortBy} />}
                    </div>
                )}

                <div className="bg-stone-50 rounded-[2.5rem] p-6 sm:p-8 border-4 border-stone-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative mb-12">

                    {/* Search Bar & Top Pagination */}
                    <div className="mb-6 flex flex-col md:flex-row justify-center items-center gap-4">
                        <div className="relative group w-full max-w-lg flex-1">
                            <input
                                type="text"
                                placeholder="Search Name, Role, Section, Dept..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full py-4 pl-14 pr-4 rounded-2xl border-4 border-stone-900 font-bold text-stone-700 text-lg focus:outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-500/20 shadow-[4px_4px_0px_0px_#1c1917] transition-all bg-white placeholder:text-stone-300 cursor-none"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-lime-600 transition-colors" strokeWidth={3} size={24} />
                        </div>
                        {/* Compact Top Pagination */}
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-xl border-4 border-stone-900 bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-x-1 active:translate-y-1 cursor-none">
                                <ChevronLeft size={24} strokeWidth={3} />
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-xl border-4 border-stone-900 bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-50 disabled:hover:bg-white transition-all shadow-[4px_4px_0px_0px_#1c1917] active:shadow-none active:translate-x-1 active:translate-y-1 cursor-none">
                                <ChevronRight size={24} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3 min-h-[300px]">
                        {paginatedListData.map((user, idx) => (
                            <PlayerRow
                                key={user.id}
                                user={user}
                                rank={searchQuery ? idx + 1 : startIndex + idx + 4}
                                delay={idx * 100}
                                activeSort={sortBy}
                            />
                        ))}
                        {paginatedListData.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-stone-400 font-bold text-lg">No players found</p>
                                <p className="text-stone-300 text-sm">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Pagination (Full) */}
                    <div className="mt-8 pt-6 border-t-2 border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-sm font-bold text-stone-500">
                            <span>Rows:</span>
                            <div className="w-24">
                                <CustomDropdown
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    options={[5, 10, 20]}
                                />
                            </div>
                            <span className="ml-2">
                                Showing <span className="text-stone-800">{startIndex + 1}</span> to <span className="text-stone-800">{Math.min(startIndex + itemsPerPage, leaderboardData.length)}</span> of <span className="text-stone-800">{leaderboardData.length}</span> entries
                            </span>
                        </div>

                        {/* Numbered Page Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-stone-200 text-stone-400 hover:border-stone-800 cursor-none disabled:opacity-30"
                            >
                                <ChevronLeft size={20} strokeWidth={3} />
                            </button>

                            {/* Page Numbers */}
                            {(() => {
                                let startPage = Math.max(1, currentPage - 2);
                                if (startPage + 4 > totalPages) {
                                    startPage = Math.max(1, totalPages - 4);
                                }

                                return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = startPage + i;
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 rounded-xl font-black text-sm border-2 transition-all cursor-none ${currentPage === pageNum
                                                ? 'bg-lime-500 border-stone-900 text-white shadow-[2px_2px_0px_0px_#1c1917] -translate-y-0.5'
                                                : 'border-transparent text-stone-400 hover:bg-stone-100'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                });
                            })()}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-stone-200 text-stone-400 hover:border-stone-800 cursor-none disabled:opacity-30"
                            >
                                <ChevronRight size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
                    <div className="bg-stone-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border-4 border-stone-800 animate-in slide-in-from-bottom-20 fade-in duration-1000">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-lime-500 rounded-2xl flex items-center justify-center text-stone-900 font-black text-lg border-2 border-white shadow-inner animate-pulse">#?</div>
                            <div>
                                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Your Current Rank</div>
                                <div className="font-black text-lg leading-none">Keep recycling! 🔥</div>
                            </div>
                        </div>
                        <button className="bg-white text-stone-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 cursor-none">
                            My Stats <ArrowUp size={14} strokeWidth={4} />
                        </button>
                    </div>
                </div>
            </main>
            <style>{`@keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; } @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}