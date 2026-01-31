"use client";
import { useState, useEffect, useRef } from "react";
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
    Search,
    GraduationCap,
    BookOpen,
    Briefcase,
    AlertCircle,
    CheckCircle,
    SkipForward
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import { ADMIN_USERS, ROLES } from '../data/mockData';

// ============================================================================
// EDUCATIONAL DATA - Strands & Departments
// ============================================================================
const SHS_STRANDS = [
    { id: 'STEM', name: 'STEM', fullName: 'Science, Technology, Engineering, and Mathematics' },
    { id: 'ABM', name: 'ABM', fullName: 'Accountancy, Business, and Management' },
    { id: 'HUMSS', name: 'HUMSS', fullName: 'Humanities and Social Sciences' },
    { id: 'GAS', name: 'GAS', fullName: 'General Academic Strand' },
    { id: 'HE', name: 'H.E', fullName: 'Home Economics' },
    { id: 'ICT', name: 'ICT', fullName: 'Information Communication Technology' },
    { id: 'IA', name: 'I.A', fullName: 'Industrial Arts' }
];

const COLLEGE_DEPARTMENTS = [
    { id: 'BSN', name: 'Bachelor of Science in Nursing', abbreviation: 'BSN' },
    { id: 'BEED', name: 'Bachelor of Elementary Education Major in General Education', abbreviation: 'BEED' },
    { id: 'BEED-SPED', name: 'Bachelor of Elementary Education (SPED)', abbreviation: 'BEED-SPED' },
    { id: 'BPED', name: 'Bachelor of Physical Education', abbreviation: 'BPEd' },
    { id: 'BSED-ENG', name: 'Bachelor of Secondary Education - Major in English', abbreviation: 'BSEd-English' },
    { id: 'BSED-MATH', name: 'Bachelor of Secondary Education - Major in Mathematics', abbreviation: 'BSEd-Math' },
    { id: 'BSED-FIL', name: 'Bachelor of Secondary Education - Major in Filipino', abbreviation: 'BSEd-Filipino' },
    { id: 'BSED-SCI', name: 'Bachelor of Secondary Education - Major in Science', abbreviation: 'BSEd-Science' },
    { id: 'BSED-SS', name: 'Bachelor of Secondary Education - Major in Social Studies', abbreviation: 'BSEd-SocStud' },
    { id: 'BSED-VE', name: 'Bachelor of Secondary Education - Major in Values Education', abbreviation: 'BSEd-ValEd' },
    { id: 'BSBA-MM', name: 'Bachelor of Science in Business Administration - Major in Marketing Management', abbreviation: 'BSBA-MM' },
    { id: 'BSBA-FM', name: 'Bachelor of Science in Business Administration - Major in Financial Management', abbreviation: 'BSBA-FM' },
    { id: 'BSAIS', name: 'Bachelor of Science in Accounting Information System', abbreviation: 'BSAIS' },
    { id: 'BSIT', name: 'Bachelor of Science in Information Technology', abbreviation: 'BSIT' },
    { id: 'BSCS', name: 'Bachelor of Science in Computer Science', abbreviation: 'BSCS' },
    { id: 'BSHM', name: 'Bachelor of Science in Hospitality Management', abbreviation: 'BSHM' },
    { id: 'BSTM', name: 'Bachelor of Science in Tourism Management', abbreviation: 'BSTM' },
    { id: 'BSCrim', name: 'Bachelor of Science in Criminology', abbreviation: 'BSCrim' },
    { id: 'AB-EL', name: 'Bachelor of Arts in English Language', abbreviation: 'AB-EL' },
    { id: 'AB-Psych', name: 'Bachelor of Arts in Psychology', abbreviation: 'AB-Psych' },
    { id: 'AB-PolSci', name: 'Bachelor of Arts in Political Science', abbreviation: 'AB-PolSci' },
    { id: 'DM', name: 'Diploma in Midwifery', abbreviation: 'DM' }
];

// Only Super Admin demo account
const TEST_ACCOUNTS = ADMIN_USERS.filter(user => user.role === 'super_admin').map(user => ({
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

// ============================================================================
// Reusable Input Field Component
// ============================================================================
const InputField = ({ type, placeholder, icon, showToggle, value, onChange, required = false }) => {
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
                required={required}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg 
          focus:ring-2 focus:ring-lime-500 focus:border-transparent 
          block pl-10 pr-10 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white"
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

// ============================================================================
// Floating Searchable Dropdown Component (Shows UPWARD)
// ============================================================================
const FloatingSearchDropdown = ({
    placeholder,
    icon,
    value,
    onChange,
    options,
    onSelect,
    searchKey = 'name',
    displayKey = 'name',
    subtitleKey = 'abbreviation',
    emptyMessage = 'No results found'
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (value.length > 0) {
            const filtered = options.filter(opt =>
                opt[searchKey].toLowerCase().includes(value.toLowerCase()) ||
                (opt[subtitleKey] && opt[subtitleKey].toLowerCase().includes(value.toLowerCase()))
            );
            setFilteredOptions(filtered);
            setShowDropdown(true);
        } else {
            setFilteredOptions(options);
            setShowDropdown(false);
        }
    }, [value, options, searchKey, subtitleKey]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                {icon}
            </div>
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => value.length > 0 && setShowDropdown(true)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg 
                    focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                    block pl-10 pr-10 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Search size={16} />
            </div>

            {/* Floating Dropdown - positioned UPWARD */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 bottom-full mb-2 left-0
                        w-full bg-white border border-gray-200 rounded-xl shadow-2xl 
                        max-h-48 overflow-y-auto"
                >
                    <div className="sticky top-0 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider 
                        flex items-center gap-1 border-b border-gray-100 bg-white">
                        <BookOpen size={12} />
                        {filteredOptions.length} Result{filteredOptions.length !== 1 ? 's' : ''}
                    </div>
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                    onSelect(option);
                                    setShowDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-lime-50 text-sm text-gray-700 
                                    hover:text-lime-700 transition-all flex items-center gap-2 group border-b border-gray-50 last:border-0"
                            >
                                <div className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center 
                                    text-lime-600 group-hover:bg-lime-200 transition-colors text-xs font-bold flex-shrink-0">
                                    {option[subtitleKey]?.slice(0, 2) || option[displayKey]?.slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 group-hover:text-lime-800 truncate text-xs">
                                        {option[displayKey]}
                                    </p>
                                    {option[subtitleKey] && (
                                        <p className="text-[10px] text-gray-400">{option[subtitleKey]}</p>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-4 text-center flex flex-col items-center justify-center text-gray-400 gap-1">
                            <Search size={16} />
                            <span className="text-xs">{emptyMessage}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================================
// Main LogIn Component
// ============================================================================
export default function LogIn({ onClose }) {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [signUpPhase, setSignUpPhase] = useState(1); // 1 = Basic, 2 = User Info

    // Form states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [loginEmail, setLoginEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loginConfirmPassword, setLoginConfirmPassword] = useState(""); // New: Confirm password for login
    const [role, setRole] = useState("");
    const [school, setSchool] = useState("");
    const [educationLevel, setEducationLevel] = useState("");
    const [strand, setStrand] = useState("");
    const [strandSearch, setStrandSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [departmentSearch, setDepartmentSearch] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
    const [filteredSchools, setFilteredSchools] = useState(["Arellano University - Andres Bonifacio Pasig Campus"]);
    const [error, setError] = useState("");
    const [showAccountPicker, setShowAccountPicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // CAPTCHA states
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef(null);

    // Saved signup data for restore functionality
    const [savedSignUpData, setSavedSignUpData] = useState(null);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [pendingModeSwitch, setPendingModeSwitch] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Show CAPTCHA after failed attempts
    useEffect(() => {
        if (failedAttempts >= 1) {
            setShowCaptcha(true);
            setCaptchaVerified(false);
        }
    }, [failedAttempts]);

    // Check if signup form has data
    const hasSignUpData = () => {
        return email || password || confirmPassword || role || school || educationLevel || strand || department || yearLevel;
    };

    // Check if login form has data
    const hasLoginData = () => {
        return fullName || loginEmail || loginPassword || loginConfirmPassword;
    };

    // Reset login form
    const resetLoginForm = () => {
        setFullName("");
        setLoginEmail("");
        setLoginPassword("");
        setLoginConfirmPassword("");
        setFailedAttempts(0);
        setShowCaptcha(false);
        setCaptchaVerified(false);
    };

    // Reset signup form
    const resetSignUpForm = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("");
        setSchool("");
        setEducationLevel("");
        setStrand("");
        setStrandSearch("");
        setDepartment("");
        setDepartmentSearch("");
        setYearLevel("");
        setSignUpPhase(1);
    };

    // Save current signup data
    const saveSignUpData = () => {
        return {
            email, password, confirmPassword, role, school,
            educationLevel, strand, strandSearch, department, departmentSearch, yearLevel, signUpPhase
        };
    };

    // Restore saved signup data
    const restoreSignUpData = (data) => {
        setEmail(data.email || "");
        setPassword(data.password || "");
        setConfirmPassword(data.confirmPassword || "");
        setRole(data.role || "");
        setSchool(data.school || "");
        setEducationLevel(data.educationLevel || "");
        setStrand(data.strand || "");
        setStrandSearch(data.strandSearch || "");
        setDepartment(data.department || "");
        setDepartmentSearch(data.departmentSearch || "");
        setYearLevel(data.yearLevel || "");
        setSignUpPhase(data.signUpPhase || 1);
    };

    const toggleMode = () => {
        if (isExpanding) return;

        // If switching FROM signup TO login and has signup data, save it
        if (isSignUp && hasSignUpData()) {
            setSavedSignUpData(saveSignUpData());
        }

        // If switching FROM login TO signup and has saved data, ask to restore
        if (!isSignUp && savedSignUpData) {
            setPendingModeSwitch(true);
            setShowRestoreDialog(true);
            return;
        }

        performModeSwitch();
    };

    const performModeSwitch = (restoreData = false) => {
        setIsExpanding(true);
        setShowRestoreDialog(false);
        setPendingModeSwitch(false);

        setTimeout(() => {
            const wasSignUp = isSignUp;
            setIsSignUp((prev) => !prev);
            setError("");
            setShowAccountPicker(false);

            // Reset the form we're leaving
            if (wasSignUp) {
                // Was on signup, going to login - reset login form
                resetLoginForm();
            } else {
                // Was on login, going to signup
                if (restoreData && savedSignUpData) {
                    restoreSignUpData(savedSignUpData);
                } else {
                    resetSignUpForm();
                    setSavedSignUpData(null);
                }
            }

            setTimeout(() => {
                setIsExpanding(false);
            }, 100);
        }, 800);
    };

    const handleRestoreChoice = (restore) => {
        if (restore) {
            performModeSwitch(true);
        } else {
            setSavedSignUpData(null);
            performModeSwitch(false);
        }
    };

    const handleCaptchaChange = (value) => {
        if (value) {
            setCaptchaVerified(true);
            // On mobile, fade out the CAPTCHA popup after a short delay
            if (isMobile) {
                setTimeout(() => {
                    setShowCaptcha(false);
                }, 800);
            }
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        // Check CAPTCHA if required
        if (showCaptcha && !captchaVerified) {
            setError("Please complete the CAPTCHA verification");
            return;
        }

        // Check confirm password matches
        if (loginPassword !== loginConfirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setIsLoading(true);
        setError("");

        await new Promise(resolve => setTimeout(resolve, 800));

        // Check credentials (full name, email, and password)
        if (fullName.toLowerCase() === "admin" && loginEmail === "superadmin@ecopoints.com" && loginPassword === "admin123") {
            localStorage.setItem('ecopoints_current_user', 'ADM-SUPER-001');
            setFailedAttempts(0);
            setShowCaptcha(false);
            router.push("/admin");
            return;
        }

        setIsLoading(false);
        setFailedAttempts(prev => prev + 1);
        setError("Invalid credentials! Use: admin / superadmin@ecopoints.com / admin123");

        // Reset CAPTCHA for next attempt
        if (recaptchaRef.current) {
            recaptchaRef.current.reset();
            setCaptchaVerified(false);
        }
    };

    const handleSignUpPhase1 = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters!");
            return;
        }

        // Move to phase 2
        setSignUpPhase(2);
    };

    const handleSignUpPhase2 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        await new Promise(resolve => setTimeout(resolve, 800));

        // Reset all fields and switch to login
        setIsLoading(false);
        alert("Account created successfully! Please sign in.");
        resetAllFields();
        setIsSignUp(false);
    };

    const handleSkipPhase2 = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert("Account created! You can complete your profile later to access leaderboards.");
            resetAllFields();
            setIsSignUp(false);
        }, 500);
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
        }, 200);
    };

    // Full reset of all form fields
    const resetAllFields = () => {
        setFullName("");
        setEmail("");
        setLoginEmail("");
        setPassword("");
        setLoginPassword("");
        setConfirmPassword("");
        setLoginConfirmPassword("");
        setRole("");
        setSchool("");
        setEducationLevel("");
        setStrand("");
        setStrandSearch("");
        setDepartment("");
        setDepartmentSearch("");
        setYearLevel("");
        setError("");
        setShowSchoolDropdown(false);
        setSignUpPhase(1);
    };

    // Reset department/strand when education level changes
    useEffect(() => {
        setStrand("");
        setStrandSearch("");
        setDepartment("");
        setDepartmentSearch("");
        setYearLevel("");
    }, [educationLevel]);

    // Reset education fields when role changes
    useEffect(() => {
        setEducationLevel("");
        setStrand("");
        setStrandSearch("");
        setDepartment("");
        setDepartmentSearch("");
        setYearLevel("");
    }, [role]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            {/* Transparent Blurred Backdrop - No click to close */}
            <div className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}></div>

            {/* Restore Dialog Popup */}
            {showRestoreDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => handleRestoreChoice(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Restore Previous Data?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            You have previously entered sign-up details. Would you like to restore them?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleRestoreChoice(false)}
                                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Start Fresh
                            </button>
                            <button
                                onClick={() => handleRestoreChoice(true)}
                                className="flex-1 py-2 px-4 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-700 transition-colors"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile CAPTCHA Popup */}
            {isMobile && showCaptcha && !captchaVerified && (
                <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300 ${captchaVerified ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-5 animate-scale-in max-w-sm w-full">
                        <h3 className="text-base font-bold text-gray-800 mb-3 text-center">Verify You're Human</h3>

                        {/* Error message in popup */}
                        {error && !isSignUp && (
                            <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-center">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                onChange={handleCaptchaChange}
                                size="normal"
                                theme="light"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className={`
        relative bg-white rounded-[2rem] shadow-2xl overflow-hidden 
        w-full max-w-[900px] min-h-[580px] md:min-h-[600px]
        flex transition-all duration-500 ease-in-out
        ${isClosing ? 'animate-scale-out' : 'animate-scale-in'}
        ${isMobile ? 'flex-col max-h-[90vh]' : ''}
      `}>

                {/* --- LEFT SIDE: SIGN IN FORM --- */}
                <div className={`
          absolute top-0 left-0 h-full w-full md:w-1/2 
          flex flex-col items-center bg-white
          transition-all duration-700 ease-in-out overflow-y-auto mt-3
          ${isMobile
                        ? (!isSignUp ? 'opacity-100 z-20 justify-end pb-10 pt-4 px-5' : 'opacity-0 z-0 pointer-events-none justify-center')
                        : 'z-10 justify-center p-6'
                    }
        `}>
                    <div className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${!isSignUp ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-gray-800 mb-1`}>Welcome Back</h1>
                        <p className="text-gray-400 text-xs mb-3">Sign in to access your dashboard</p>

                        <form onSubmit={handleLogin} className="w-full space-y-2">
                            {/* Full Name Field */}
                            <InputField
                                type="text"
                                placeholder="Full Name"
                                icon={<User size={16} />}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />

                            {/* Email Field */}
                            <InputField
                                type="email"
                                placeholder="Email"
                                icon={<Mail size={16} />}
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                            />

                            {/* Password Field */}
                            <InputField
                                type="password"
                                placeholder="Password"
                                icon={<Lock size={16} />}
                                showToggle={true}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />

                            {/* Confirm Password Field */}
                            <InputField
                                type="password"
                                placeholder="Confirm Password"
                                icon={<Lock size={16} />}
                                showToggle={true}
                                value={loginConfirmPassword}
                                onChange={(e) => setLoginConfirmPassword(e.target.value)}
                            />

                            {/* CAPTCHA - Popup on mobile, inline on desktop */}
                            {showCaptcha && !isMobile && (
                                <div className="flex justify-center overflow-hidden w-full" style={{ maxHeight: '74px' }}>
                                    <div className="transform scale-[0.9] origin-top">
                                        <ReCAPTCHA
                                            ref={recaptchaRef}
                                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                                            onChange={handleCaptchaChange}
                                            size="normal"
                                            theme="light"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Mobile CAPTCHA verified indicator */}
                            {isMobile && captchaVerified && (
                                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-lime-50 border border-lime-200 rounded-lg">
                                    <CheckCircle size={16} className="text-lime-600" />
                                    <span className="text-xs font-medium text-lime-700">Verified</span>
                                </div>
                            )}

                            {/* Mobile: Show button to open CAPTCHA popup if not verified */}
                            {isMobile && showCaptcha && !captchaVerified && (
                                <button
                                    type="button"
                                    onClick={() => setShowCaptcha(true)}
                                    className="w-full py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={14} />
                                    Tap to complete CAPTCHA verification
                                </button>
                            )}

                            <div className="w-full text-right">
                                <a href="#" className="text-xs text-gray-500 hover:text-lime-600 transition-colors">Forgot your password?</a>
                            </div>


                            <button
                                type="submit"
                                disabled={isLoading || (showCaptcha && !captchaVerified)}
                                className="w-1/2 mx-auto py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg 
                  hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                  transition-all duration-300 flex items-center justify-center gap-2
                  disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isLoading && !isSignUp ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Signing in...</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <p className="text-[10px] text-center text-gray-400 mt-2">
                            Demo: <span className="font-medium">admin</span> / <span className="font-medium">superadmin@ecopoints.com</span> / <span className="font-medium">admin123</span>
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
                        ? (isSignUp ? 'opacity-100 z-20 pt-4 pb-40 px-6 overflow-y-auto no-scrollbar justify-start' : 'opacity-0 z-0 pointer-events-none justify-center')
                        : 'z-10 justify-center p-6 overflow-y-auto'
                    }
        `}>
                    <div className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${isSignUp ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>

                        {/* Phase Indicator */}
                        {isSignUp && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${signUpPhase >= 1 ? 'bg-lime-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    1
                                </div>
                                <div className={`w-10 h-1 rounded-full transition-all ${signUpPhase >= 2 ? 'bg-lime-500' : 'bg-gray-200'}`}></div>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${signUpPhase >= 2 ? 'bg-lime-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    2
                                </div>
                            </div>
                        )}

                        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-extrabold text-gray-800 mb-1`}>
                            {signUpPhase === 1 ? 'Create Account' : 'Complete Your Profile'}
                        </h1>
                        <p className="text-gray-400 text-xs mb-3 text-center">
                            {signUpPhase === 1
                                ? 'Join EcoPoints community today'
                                : 'Help us personalize your experience'}
                        </p>

                        {/* PHASE 1: Basic Credentials ONLY (Name, Email, Passwords) */}
                        {signUpPhase === 1 && (
                            <form onSubmit={handleSignUpPhase1} className="w-full space-y-2">
                                <InputField
                                    type="text"
                                    placeholder="Full Name"
                                    icon={<User size={18} />}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />

                                <InputField
                                    type="email"
                                    placeholder="Email"
                                    icon={<Mail size={18} />}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <InputField
                                    type="password"
                                    placeholder="Password"
                                    icon={<Lock size={18} />}
                                    showToggle={true}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                                <InputField
                                    type="password"
                                    placeholder="Confirm Password"
                                    icon={<Lock size={18} />}
                                    showToggle={true}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />

                                {error && isSignUp && signUpPhase === 1 && (
                                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-1/2 mx-auto py-2.5 md:py-3 bg-lime-600 text-white rounded-lg font-bold shadow-lg 
                                        hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                                        transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        )}

                        {/* PHASE 2: User Information (User Type, School, Department/Strand) */}
                        {signUpPhase === 2 && (
                            <form onSubmit={handleSignUpPhase2} className="w-full space-y-2">

                                {/* Note about leaderboards */}
                                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs text-center mb-1">
                                    <span className="font-medium">📊 NOTE:</span> To see leaderboards, you must complete user information 😊
                                </div>

                                {/* USER TYPE DROPDOWN (Moved to Phase 2) */}
                                <div className="relative w-full group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                        <Users size={18} />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                            focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                            block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                            ${role === "" ? "text-gray-400" : "text-gray-800"}`}
                                    >
                                        <option value="" disabled>Select User Type</option>
                                        <option value="Student">Student</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Staff">Staff</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>

                                {/* SCHOOL SEARCHABLE DROPDOWN (Moved to Phase 2) */}
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
                                    block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white"
                                    />
                                    {showSchoolDropdown && school.length > 0 && (
                                        <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto z-50 p-1">
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
                                                        className="w-full text-left px-3 py-2 hover:bg-lime-50 rounded-lg text-sm text-gray-700 hover:text-lime-700 transition-all flex items-center gap-2 group"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 group-hover:bg-lime-200 transition-colors">
                                                            <Building2 size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 group-hover:text-lime-800 text-xs">{s}</p>
                                                            <p className="text-[10px] text-gray-400">Pasig City</p>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-center flex flex-col items-center justify-center text-gray-400 gap-1">
                                                    <Search size={16} />
                                                    <span className="text-xs">No schools found</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CONDITIONAL FIELDS BASED ON ROLE */}
                                {role === "Student" && (
                                    <>
                                        {/* Educational Level */}
                                        <div className="relative w-full group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                                <GraduationCap size={18} />
                                            </div>
                                            <select
                                                value={educationLevel}
                                                onChange={(e) => setEducationLevel(e.target.value)}
                                                className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                                    focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                                    block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                                    ${educationLevel === "" ? "text-gray-400" : "text-gray-800"}`}
                                            >
                                                <option value="" disabled>Select Educational Level</option>
                                                <option value="shs">Senior High School</option>
                                                <option value="college">College</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>

                                        {/* SHS Strand Dropdown (Searchable, UPWARD) */}
                                        {educationLevel === "shs" && (
                                            <FloatingSearchDropdown
                                                placeholder="Select Strand"
                                                icon={<BookOpen size={18} />}
                                                value={strandSearch}
                                                onChange={setStrandSearch}
                                                options={SHS_STRANDS}
                                                onSelect={(option) => {
                                                    setStrand(option.id);
                                                    setStrandSearch(option.name);
                                                }}
                                                searchKey="name"
                                                displayKey="name"
                                                subtitleKey="fullName"
                                                emptyMessage="No strand found"
                                            />
                                        )}

                                        {/* College Department Dropdown (Searchable, UPWARD) */}
                                        {educationLevel === "college" && (
                                            <>
                                                <FloatingSearchDropdown
                                                    placeholder="Search Department"
                                                    icon={<Building2 size={18} />}
                                                    value={departmentSearch}
                                                    onChange={setDepartmentSearch}
                                                    options={COLLEGE_DEPARTMENTS}
                                                    onSelect={(option) => {
                                                        setDepartment(option.id);
                                                        setDepartmentSearch(`${option.abbreviation}`);
                                                    }}
                                                    searchKey="name"
                                                    displayKey="name"
                                                    subtitleKey="abbreviation"
                                                    emptyMessage="No department found"
                                                />

                                                {/* Year Level (Only for College) */}
                                                <div className="relative w-full group">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                                                        <Zap size={18} />
                                                    </div>
                                                    <select
                                                        value={yearLevel}
                                                        onChange={(e) => setYearLevel(e.target.value)}
                                                        className={`w-full bg-gray-50 border border-gray-200 text-sm rounded-lg 
                                                            focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                                            block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
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
                                    </>
                                )}

                                {/* Faculty: Department Search */}
                                {role === "Faculty" && (
                                    <FloatingSearchDropdown
                                        placeholder="Search Department"
                                        icon={<Building2 size={18} />}
                                        value={departmentSearch}
                                        onChange={setDepartmentSearch}
                                        options={COLLEGE_DEPARTMENTS}
                                        onSelect={(option) => {
                                            setDepartment(option.id);
                                            setDepartmentSearch(`${option.abbreviation}`);
                                        }}
                                        searchKey="name"
                                        displayKey="name"
                                        subtitleKey="abbreviation"
                                        emptyMessage="No department found"
                                    />
                                )}

                                {/* Staff: No additional fields */}
                                {role === "Staff" && (
                                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-xs text-center">
                                        <Briefcase size={20} className="mx-auto mb-1 text-gray-400" />
                                        No additional information required
                                    </div>
                                )}

                                {error && isSignUp && signUpPhase === 2 && (
                                    <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleSkipPhase2}
                                        disabled={isLoading}
                                        className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm
                                            hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-1"
                                    >
                                        <SkipForward size={14} />
                                        Skip
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg text-sm
                                            hover:bg-lime-700 hover:shadow-xl 
                                            transition-all duration-300 flex items-center justify-center gap-1
                                            disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={14} />
                                                Complete
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Back button */}
                                <button
                                    type="button"
                                    onClick={() => setSignUpPhase(1)}
                                    className="w-full text-center text-xs text-gray-500 hover:text-lime-600 transition-colors mt-1"
                                >
                                    ← Back to credentials
                                </button>
                            </form>
                        )}

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
                                ? 'h-full bottom-0 top-auto rounded-[2rem]'
                                : 'h-full top-0 rounded-[2rem]'
                            : isSignUp
                                ? 'h-[18%] min-h-[140px] bottom-0 top-auto rounded-t-[3rem] rounded-b-[2rem]'
                                : 'h-[18%] min-h-[140px] top-0 rounded-b-[3rem] rounded-t-[2rem]'
                        }`
                        : `top-0 h-full
                ${isExpanding
                            ? 'w-full left-0 rounded-[2rem]'
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
                            ${isMobile ? 'w-20' : 'w-48'} z-0`}>
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
                                <div className="flex flex-col justify-center items-center px-4 text-center space-y-2 max-w-md">
                                    <h1 className={`${isMobile ? 'text-lg' : 'text-4xl'} font-bold tracking-tight`}>One of us?</h1>
                                    <p className={`text-white/80 ${isMobile ? 'text-[10px]' : 'text-lg font-light'}`}>
                                        Already have an account? Sign in.
                                    </p>

                                    <div className="w-full hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountPicker(!showAccountPicker)}
                                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium text-sm
                        hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <Users size={16} />
                                            Demo Account
                                            <ChevronDown size={14} className={`transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAccountPicker && (
                                            <div className="mt-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden max-h-32 overflow-y-auto">
                                                {TEST_ACCOUNTS.map((account) => (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        onClick={() => handleQuickLogin(account)}
                                                        className="w-full p-2 flex items-center gap-2 hover:bg-white/20 transition-colors border-b border-white/10 last:border-0"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                            {account.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-xs font-medium">{account.name}</p>
                                                            <p className="text-[10px] text-white/70">{account.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={toggleMode}
                                        className="px-5 py-2 bg-transparent border-2 border-white text-white rounded-full font-semibold uppercase tracking-wider text-xs hover:bg-white hover:text-lime-600 transition-all duration-300 shadow-lg"
                                    >
                                        Sign In
                                    </button>
                                </div>
                            ) : (
                                /* Overlay is on RIGHT - Encourage user to Signup */
                                <div className="flex flex-col justify-center items-center px-4 text-center space-y-2 max-w-md">
                                    <h1 className={`${isMobile ? 'text-lg' : 'text-4xl'} font-bold tracking-tight`}>New Here?</h1>
                                    <p className={`text-white/80 ${isMobile ? 'text-[10px]' : 'text-lg font-light'}`}>
                                        Sign up and start your journey!
                                    </p>

                                    <div className="w-full hidden md:block">
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountPicker(!showAccountPicker)}
                                            className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full font-medium text-sm
                        hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                                        >
                                            <Users size={16} />
                                            Demo Account
                                            <ChevronDown size={14} className={`transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showAccountPicker && (
                                            <div className="mt-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden max-h-32 overflow-y-auto">
                                                {TEST_ACCOUNTS.map((account) => (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        onClick={() => handleQuickLogin(account)}
                                                        className="w-full p-2 flex items-center gap-2 hover:bg-white/20 transition-colors border-b border-white/10 last:border-0"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                            {account.name.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-xs font-medium">{account.name}</p>
                                                            <p className="text-[10px] text-white/70">{account.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={toggleMode}
                                        className="px-5 py-2 bg-transparent border-2 border-white text-white rounded-full font-semibold uppercase tracking-wider text-xs hover:bg-white hover:text-lime-600 transition-all duration-300 shadow-lg"
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
                    className="absolute top-3 right-3 z-[60] w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200
            flex items-center justify-center text-gray-500 hover:text-gray-700 
            transition-all duration-300"
                >
                    <X size={18} />
                </button>
            </div>
        </div >
    );
}
