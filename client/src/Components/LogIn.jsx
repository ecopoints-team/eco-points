"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    X,
    ChevronDown,
    Building2,
    Users,
    Zap,
    ArrowRight,
    Leaf,
    Search
} from "lucide-react";

import { ADMIN_USERS, ROLES } from '../data/mockData';

// Generate Test Accounts from Centralized Mock Data
const TEST_ACCOUNTS = ADMIN_USERS.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: ROLES[user.role]?.name || 'Super Admin',
    location: user.locationId ? 'Arellano University' : 'All Locations',
    color: ROLES[user.role]?.color || 'red'
}));

// Role badge colors
const roleColors = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

// Reusable Input Field Component
const InputField = ({ type, placeholder, icon, showToggle, value, onChange }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' && showToggle ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="relative group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                {icon}
            </div>
            <input
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg 
          focus:ring-2 focus:ring-lime-500 focus:border-transparent 
          block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white"
            />
            {showToggle && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
};

export default function LogIn({ onClose }) {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Form states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("");
    const [school, setSchool] = useState("");
    const [course, setCourse] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [department, setDepartment] = useState("");
    const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
    const [filteredSchools, setFilteredSchools] = useState(["Arellano University - Andres Bonifacio Pasig Campus"]);
    const [error, setError] = useState("");
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleMode = () => {
        if (isExpanding) return;

        // 1. Start Expansion (Fill the screen)
        setIsExpanding(true);

        // 2. Wait for expansion to finish
        setTimeout(() => {
            // 3. Switch the form state while covered
            setIsSignUp((prev) => !prev);
            setError("");
            setShowAccountPicker(false);

            // 4. Shrink to new position
            setTimeout(() => {
                setIsExpanding(false);
            }, 100);
        }, 800);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        await new Promise(resolve => setTimeout(resolve, 800));

        if (username === "admin" && password === "admin123") {
            localStorage.setItem('ecopoints_current_user', 'ADM-SUPER-001');
            router.push("/admin");
            return;
        }

        setIsLoading(false);
        setError("Invalid credentials! Try 'admin' and 'admin123'");
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        await new Promise(resolve => setTimeout(resolve, 800));

        if (password !== confirmPassword) {
            setIsLoading(false);
            setError("Passwords do not match!");
            return;
        }

        // Demo: Just show success and switch to login
        setIsLoading(false);
        alert("Account created successfully! Please sign in.");
        toggleMode();
    };

    const handleQuickLogin = async (account) => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('ecopoints_current_user', account.id);
        router.push("/admin");
    };

    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 200); // Match animation duration
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Transparent Blurred Backdrop */}
            <div className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose}></div>

            {/* Main Card */}
            <div className={`
        relative bg-white rounded-[2rem] shadow-2xl overflow-hidden 
        w-full max-w-[900px] min-h-[600px]
        flex transition-all duration-500 ease-in-out
        ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}
        ${isMobile ? 'flex-col' : ''}
      `}>

                {/* --- LEFT SIDE: SIGN IN FORM --- */}
                <div className={`
          absolute top-0 left-0 h-full w-full md:w-1/2 
          flex flex-col items-center p-8 bg-white
          transition-all duration-700 ease-in-out
          ${isMobile
                        ? (!isSignUp ? 'opacity-100 z-20 justify-end pb-24' : 'opacity-0 z-0 pointer-events-none justify-center') // Login Active: Anchor Bottom
                        : 'z-10 justify-center'
                    }
        `}>
                    <div className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${!isSignUp ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Welcome Back</h1>
                        <p className="text-gray-400 text-sm mb-8">Sign in to access your dashboard</p>

                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            <InputField
                                type="text"
                                placeholder="Username"
                                icon={<User size={18} />}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <InputField
                                type="password"
                                placeholder="Password"
                                icon={<Lock size={18} />}
                                showToggle={true}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <div className="w-full text-right">
                                <a href="#" className="text-xs text-gray-500 hover:text-lime-600 transition-colors">Forgot your password?</a>
                            </div>

                            {error && !isSignUp && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-2/4 mx-auto py-3 bg-lime-600 text-white rounded-lg font-bold shadow-lg 
                  hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                  transition-all duration-300 flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isLoading && !isSignUp ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="text-xs text-center text-gray-400 mt-4">
                            Demo: <span className="font-medium">admin</span> / <span className="font-medium">admin123</span>
                        </p>

                    </div>
                </div>

                {/* --- RIGHT SIDE: SIGN UP FORM --- */}
                <div className={`
          absolute top-0 right-0 h-full w-full md:w-1/2 
          flex flex-col items-center 
          bg-white
          transition-all duration-700 ease-in-out
          ${isMobile
                        ? (isSignUp ? 'opacity-100 z-20 pt-6 pb-48 overflow-y-auto no-scrollbar justify-start' : 'opacity-0 z-0 pointer-events-none justify-center')
                        : 'z-10 justify-center p-8'
                    }
        `}>
                    <div className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${isSignUp ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                        <h1 className={`${isMobile ? 'text-2xl mt-2' : 'text-3xl'} font-extrabold text-gray-800 mb-1`}>Create Account</h1>
                        <p className="text-gray-400 text-xs mb-4">Join EcoPoints community today</p>

                        <form onSubmit={handleSignUp} className={`w-full ${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                            <div className={`${isMobile ? 'scale-95 origin-top' : ''} space-y-2 w-full`}>
                                <InputField
                                    type="text"
                                    placeholder="Full Name"
                                    icon={<User size={18} />}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />

                                <InputField
                                    type="email"
                                    placeholder="School Email (@arellano.edu.ph)"
                                    icon={<Mail size={18} />}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />

                                {/* USER TYPE DROPDOWN */}
                                <div className="relative w-full group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                        <Users size={18} />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                    focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                    block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                    ${role === "" ? "text-gray-400" : "text-gray-800"}`}
                                    >
                                        <option value="" disabled>Select User Type</option>
                                        <option value="Student">Student</option>
                                        <option value="Employee">Employee</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>

                                {/* CONDITIONAL FIELDS FOR STUDENT */}
                                {role === "Student" && (
                                    <>
                                        {/* COURSE DROPDOWN */}
                                        <div className="relative w-full group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                                <Building2 size={18} />
                                            </div>
                                            <select
                                                value={course}
                                                onChange={(e) => setCourse(e.target.value)}
                                                className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                            focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                            block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                            ${course === "" ? "text-gray-400" : "text-gray-800"}`}
                                            >
                                                <option value="" disabled>Select Course</option>
                                                <option value="BSIT">BS Information Technology</option>
                                                <option value="BSCS">BS Computer Science</option>
                                                <option value="BSN">BS Nursing</option>
                                                <option value="BSBA">BS Business Administration</option>
                                                <option value="BSHM">BS Hospitality Management</option>
                                                <option value="BSED">BS Education</option>
                                                <option value="BSA">BS Accountancy</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>

                                        {/* YEAR LEVEL DROPDOWN */}
                                        <div className="relative w-full group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                                <Zap size={18} />
                                            </div>
                                            <select
                                                value={yearLevel}
                                                onChange={(e) => setYearLevel(e.target.value)}
                                                className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                            focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                            block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                            ${yearLevel === "" ? "text-gray-400" : "text-gray-800"}`}
                                            >
                                                <option value="" disabled>Select Year Level</option>
                                                <option value="1">1st Year</option>
                                                <option value="2">2nd Year</option>
                                                <option value="3">3rd Year</option>
                                                <option value="4">4th Year</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* CONDITIONAL FIELDS FOR EMPLOYEE */}
                                {role === "Employee" && (
                                    <div className="relative w-full group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                            <Building2 size={18} />
                                        </div>
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                        focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                        block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                        ${department === "" ? "text-gray-400" : "text-gray-800"}`}
                                        >
                                            <option value="" disabled>Select Department</option>
                                            <option value="Administration">Administration</option>
                                            <option value="Academics">Academics</option>
                                            <option value="Finance">Finance</option>
                                            <option value="IT">Information Technology</option>
                                            <option value="HR">Human Resources</option>
                                            <option value="Maintenance">Maintenance</option>
                                            <option value="Security">Security</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                )}

                                {/* SCHOOL SEARCHABLE DROPDOWN */}
                                <div className="relative w-full group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                        <Building2 size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Select School / Campus"
                                        value={school}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSchool(val);
                                            if (val.length > 0) {
                                                setShowSchoolDropdown(true);
                                                // Mock Filtering (Client Side)
                                                if ("Arellano University - Andres Bonifacio Pasig Campus".toLowerCase().includes(val.toLowerCase())) {
                                                    setFilteredSchools(["Arellano University - Andres Bonifacio Pasig Campus"]);
                                                } else {
                                                    setFilteredSchools([]);
                                                }
                                            } else {
                                                setShowSchoolDropdown(false);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (school.length > 0) setShowSchoolDropdown(true);
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg 
                                    focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                    block pl-10 pr-3 md:py-3 py-2.5 transition-all duration-300 outline-none hover:bg-white"
                                    />
                                    {showSchoolDropdown && school.length > 0 && (
                                        <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-50 p-1">
                                            <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 border-b border-gray-100 mb-1">
                                                <Building2 size={12} />
                                                Suggested Schools
                                            </div>
                                            {filteredSchools.length > 0 ? (
                                                filteredSchools.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setSchool(s);
                                                            setShowSchoolDropdown(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 hover:bg-lime-50 rounded-lg text-sm text-gray-700 hover:text-lime-700 transition-all flex items-center gap-3 group"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 group-hover:bg-lime-200 transition-colors">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 group-hover:text-lime-800">{s}</p>
                                                            <p className="text-xs text-gray-400">Pasig City</p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-gray-400 gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <Search size={18} />
                                                    </div>
                                                    <span className="text-xs">No schools found matching "{school}"</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <InputField
                                    type="password"
                                    placeholder="Password"
                                    icon={<Lock size={18} />}
                                    showToggle={true}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                <InputField
                                    type="password"
                                    placeholder="Confirm Password"
                                    icon={<Lock size={18} />}
                                    showToggle={true}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />

                                {error && isSignUp && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-2/4 mx-auto ${isMobile ? 'py-2.5 mt-2' : 'py-3'} bg-lime-600 text-white rounded-lg font-bold shadow-lg 
                  hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                  transition-all duration-300 flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-3`}
                                >
                                    {isLoading && isSignUp ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        'Sign Up'
                                    )}
                                </button>
                            </div>
                        </form>

                    </div>
                </div>

                {/* --- EXPANDING OVERLAY SECTION --- */}
                <div className={`
          absolute z-50 overflow-hidden
          transition-all duration-[800ms] cubic-bezier(0.65, 0, 0.35, 1) text-white
          
          ${isMobile
                        ? `w-full left-0
               ${isExpanding
                            ? isSignUp
                                ? 'h-full bottom-0 top-auto rounded-[2rem]' // Was Signup (Bottom), Expand Up
                                : 'h-full top-0 rounded-[2rem]' // Was Login (Top), Expand Down
                            : isSignUp
                                ? 'h-[20%] min-h-[160px] bottom-0 top-auto rounded-t-[3rem] rounded-b-[2rem]' // Signup Mode: Overlay Bottom
                                : 'h-[20%] min-h-[160px] top-0 rounded-b-[3rem] rounded-t-[2rem]' // Login Mode: Overlay Top
                        }`
                        : `top-0 h-full
                ${isExpanding
                            ? 'w-full left-0 rounded-[2rem]' // Full cover, keep rounded corners (was rounded-none)
                            : isSignUp
                                ? 'w-1/2 left-0 rounded-r-[50px] rounded-l-[2rem]'
                                : 'w-1/2 left-1/2 rounded-l-[50px] rounded-r-[2rem]'
                        }`
                    }
        `}>
                    <div className="relative w-full h-full bg-gradient-to-br from-lime-600 via-emerald-600 to-green-700 text-white flex items-center justify-center flex-col">

                        {/* ANIMATED LOGO DISPLAY */}
                        <div className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                            ${isExpanding ? 'scale-125 opacity-100 rotate-0' : 'scale-75 opacity-0 -rotate-12'}
                            ${isMobile ? 'w-24' : 'w-48'} z-0`}>
                            <img
                                src={isMobile ? "/Logo Elements (Light).png" : "/EcoPoints Primary Logo (Light version).png"}
                                alt="EcoPoints Logo"
                                className="w-full h-auto object-contain drop-shadow-2xl animate-float-slow"
                            />
                        </div>

                        {/* Content Container */}
                        <div className={`
              relative w-full h-full transition-opacity duration-300 flex items-center justify-center z-10
              ${isExpanding ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}>

                            {isSignUp ? (
                                /* Overlay is on LEFT - Encourage user to Login */
                                <div className="flex flex-col justify-center items-center px-4 text-center space-y-3 max-w-md">
                                    <h1 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-bold tracking-tight`}>One of us?</h1>
                                    <p className={`text-white/80 ${isMobile ? 'text-xs mb-2' : 'text-lg font-light leading-relaxed'}`}>
                                        If you already have an account, just sign in.
                                    </p>

                                    <div className="w-full hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountPicker(!showAccountPicker)}
                                            className="w-full px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium 
                        hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <Users size={18} />
                                            Demo Accounts
                                            <ChevronDown size={16} className={`transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAccountPicker && (
                                            <div className="mt-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden max-h-40 overflow-y-auto">
                                                {TEST_ACCOUNTS.slice(0, 8).map((account) => (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        onClick={() => handleQuickLogin(account)}
                                                        className="w-full p-3 flex items-center gap-3 hover:bg-white/20 transition-colors border-b border-white/10 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                            {account.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium">{account.name}</p>
                                                            <p className="text-xs text-white/70">{account.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={toggleMode}
                                        className="px-6 py-2 bg-transparent border-2 border-white text-white rounded-full font-semibold uppercase tracking-wider hover:bg-white hover:text-lime-600 transition-all duration-300 shadow-lg text-sm"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            ) : (
                                /* Overlay is on RIGHT - Encourage user to Signup */
                                <div className="flex flex-col justify-center items-center px-4 text-center space-y-3 max-w-md">
                                    <h1 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-bold tracking-tight`}>New Here?</h1>
                                    <p className={`text-white/80 ${isMobile ? 'text-xs mb-2' : 'text-lg font-light leading-relaxed'}`}>
                                        Sign up and start your journey!
                                    </p>

                                    <div className="w-full hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountPicker(!showAccountPicker)}
                                            className="w-full px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium 
                        hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <Users size={18} />
                                            Demo Accounts
                                            <ChevronDown size={16} className={`transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAccountPicker && (
                                            <div className="mt-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden max-h-40 overflow-y-auto">
                                                {TEST_ACCOUNTS.slice(0, 8).map((account) => (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        onClick={() => handleQuickLogin(account)}
                                                        className="w-full p-3 flex items-center gap-3 hover:bg-white/20 transition-colors border-b border-white/10 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                            {account.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm font-medium">{account.name}</p>
                                                            <p className="text-xs text-white/70">{account.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={toggleMode}
                                        className="px-6 py-2 bg-transparent border-2 border-white text-white rounded-full font-semibold uppercase tracking-wider hover:bg-white hover:text-lime-600 transition-all duration-300 shadow-lg text-sm"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-[60] w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200
            flex items-center justify-center text-gray-500 hover:text-gray-700 
            transition-all duration-300"
                >
                    <X size={20} />
                </button>
            </div>
        </div >
    );
}
