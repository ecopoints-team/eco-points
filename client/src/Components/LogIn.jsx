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
    Leaf
} from "lucide-react";

// Test accounts for demo login
const TEST_ACCOUNTS = [
    { id: 'ADM-SUPER-001', name: 'System Administrator', email: 'superadmin@ecopoints.com', role: 'Super Admin', location: 'All Locations', color: 'red' },
    { id: 'ADM-A-001', name: 'Maria Santos', email: 'headadmin.schoola@ecopoints.com', role: 'Head Admin', location: 'School A', color: 'purple' },
    { id: 'ADM-A-002', name: 'Carlos Reyes', email: 'auditor.schoola@ecopoints.com', role: 'Auditor', location: 'School A', color: 'blue' },
    { id: 'ADM-A-003', name: 'Ana Lim', email: 'inventory.schoola@ecopoints.com', role: 'Inventory Officer', location: 'School A', color: 'emerald' },
    { id: 'ADM-B-001', name: 'Juan Dela Cruz', email: 'headadmin.schoolb@ecopoints.com', role: 'Head Admin', location: 'School B', color: 'purple' },
    { id: 'ADM-B-002', name: 'Patricia Tan', email: 'auditor.schoolb@ecopoints.com', role: 'Auditor', location: 'School B', color: 'blue' },
    { id: 'ADM-B-003', name: 'Roberto Garcia', email: 'inventory.schoolb@ecopoints.com', role: 'Inventory Officer', location: 'School B', color: 'emerald' },
];

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
                                className="w-full py-3 bg-lime-600 text-white rounded-lg font-bold shadow-lg 
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
          flex flex-col items-center p-8 bg-white
          transition-all duration-700 ease-in-out
          ${isMobile
                        ? (isSignUp ? 'opacity-100 z-20 justify-start pt-12' : 'opacity-0 z-0 pointer-events-none justify-center') // Signup Active: Anchor Top
                        : 'z-10 justify-center'
                    }
        `}>
                    <div className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${isSignUp ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Create Account</h1>
                        <p className="text-gray-400 text-sm mb-8">Join EcoPoints community today</p>

                        <form onSubmit={handleSignUp} className="w-full space-y-4">
                            <InputField
                                type="text"
                                placeholder="Full Name"
                                icon={<User size={18} />}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <InputField
                                type="email"
                                placeholder="Email"
                                icon={<Mail size={18} />}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

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
                                className="w-full py-3 bg-lime-600 text-white rounded-lg font-bold shadow-lg 
                  hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                  transition-all duration-300 flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
                    <div className="relative w-full h-full bg-gradient-to-br from-lime-600 via-emerald-600 to-green-700 text-white flex items-center justify-center">

                        {/* Content Container */}
                        <div className={`
              relative w-full h-full transition-opacity duration-300 flex items-center justify-center
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
                                                {TEST_ACCOUNTS.slice(0, 4).map((account) => (
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
                                                {TEST_ACCOUNTS.slice(0, 4).map((account) => (
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
