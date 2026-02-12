// ============================================================================
// ADMIN ACCOUNT CREDENTIALS (All passwords: test123)
// Sign in with: username + email + password
// ============================================================================
// SUPER ADMINS:
//   - System Administrator     | sysadmin     | superadmin@ecopoints.com
//   - Chief Technology Officer  | cto          | cto@ecopoints.com
//
// HEAD ADMINS (LOC-001 — Arellano University):
//   - Maria Santos              | msantos      | head@arellano.edu.ph
//   - Roberto Garcia            | rgarcia      | rgarcia@arellano.edu.ph
//   - Elena Cruz                | ecruz        | ecruz@arellano.edu.ph
//
// HEAD ADMIN (LOC-002 — Polytechnic University):
//   - Rosa Aquino               | raquino      | head@pup.edu.ph
//
// AUDITORS (LOC-001):
//   - Juan Dela Cruz            | jdelacruz    | auditor@arellano.edu.ph
//   - Angela Reyes              | areyes       | areyes@arellano.edu.ph
//   - Mark Gonzales             | mgonzales    | mgonzales@arellano.edu.ph
//
// AUDITOR (LOC-002):
//   - Leo Bautista              | lbautista    | auditor@pup.edu.ph
//
// INVENTORY OFFICERS (LOC-001):
//   - Ana Lim                   | alim         | inventory@arellano.edu.ph
//   - Patricia Tan              | ptan         | ptan@arellano.edu.ph
//   - Jose Mendoza              | jmendoza     | jmendoza@arellano.edu.ph
//
// INVENTORY OFFICER (LOC-002):
//   - Carmen Diaz               | cdiaz        | inventory@pup.edu.ph
//
// TECHNICIANS (LOC-001):
//   - Carlos Reyes              | creyes       | tech@arellano.edu.ph
//   - Miguel Santos             | misantos     | msantos@arellano.edu.ph
//   - Fernando Lopez            | flopez       | flopez@arellano.edu.ph
//   - David Villanueva          | dvillanueva  | dvillanueva@arellano.edu.ph
//
// TECHNICIANS (LOC-002):
//   - Rico Fernandez            | rfernandez   | tech@pup.edu.ph
//   - Lorna Gutierrez           | lgutierrez   | tech2@pup.edu.ph
// ============================================================================

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
  SkipForward,
  AtSign,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import { ADMIN_USERS } from "../data/mockData";

// ============================================================================
// EDUCATIONAL DATA - Strands & Departments
// ============================================================================
const SHS_STRANDS = [
  {
    id: "STEM",
    name: "STEM",
    fullName: "Science, Technology, Engineering, and Mathematics",
  },
  { id: "ABM", name: "ABM", fullName: "Accountancy, Business, and Management" },
  { id: "HUMSS", name: "HUMSS", fullName: "Humanities and Social Sciences" },
  { id: "GAS", name: "GAS", fullName: "General Academic Strand" },
  { id: "HE", name: "H.E", fullName: "Home Economics" },
  { id: "ICT", name: "ICT", fullName: "Information Communication Technology" },
  { id: "IA", name: "I.A", fullName: "Industrial Arts" },
];

const COLLEGE_DEPARTMENTS = [
  { id: "BSN", name: "Bachelor of Science in Nursing", abbreviation: "BSN" },
  {
    id: "BEED",
    name: "Bachelor of Elementary Education Major in General Education",
    abbreviation: "BEED",
  },
  {
    id: "BEED-SPED",
    name: "Bachelor of Elementary Education (SPED)",
    abbreviation: "BEED-SPED",
  },
  { id: "BPED", name: "Bachelor of Physical Education", abbreviation: "BPEd" },
  {
    id: "BSED-ENG",
    name: "Bachelor of Secondary Education - Major in English",
    abbreviation: "BSEd-English",
  },
  {
    id: "BSED-MATH",
    name: "Bachelor of Secondary Education - Major in Mathematics",
    abbreviation: "BSEd-Math",
  },
  {
    id: "BSED-FIL",
    name: "Bachelor of Secondary Education - Major in Filipino",
    abbreviation: "BSEd-Filipino",
  },
  {
    id: "BSED-SCI",
    name: "Bachelor of Secondary Education - Major in Science",
    abbreviation: "BSEd-Science",
  },
  {
    id: "BSED-SS",
    name: "Bachelor of Secondary Education - Major in Social Studies",
    abbreviation: "BSEd-SocStud",
  },
  {
    id: "BSED-VE",
    name: "Bachelor of Secondary Education - Major in Values Education",
    abbreviation: "BSEd-ValEd",
  },
  {
    id: "BSBA-MM",
    name: "Bachelor of Science in Business Administration - Major in Marketing Management",
    abbreviation: "BSBA-MM",
  },
  {
    id: "BSBA-FM",
    name: "Bachelor of Science in Business Administration - Major in Financial Management",
    abbreviation: "BSBA-FM",
  },
  {
    id: "BSAIS",
    name: "Bachelor of Science in Accounting Information System",
    abbreviation: "BSAIS",
  },
  {
    id: "BSIT",
    name: "Bachelor of Science in Information Technology",
    abbreviation: "BSIT",
  },
  {
    id: "BSCS",
    name: "Bachelor of Science in Computer Science",
    abbreviation: "BSCS",
  },
  {
    id: "BSHM",
    name: "Bachelor of Science in Hospitality Management",
    abbreviation: "BSHM",
  },
  {
    id: "BSTM",
    name: "Bachelor of Science in Tourism Management",
    abbreviation: "BSTM",
  },
  {
    id: "BSCrim",
    name: "Bachelor of Science in Criminology",
    abbreviation: "BSCrim",
  },
  {
    id: "AB-EL",
    name: "Bachelor of Arts in English Language",
    abbreviation: "AB-EL",
  },
  {
    id: "AB-Psych",
    name: "Bachelor of Arts in Psychology",
    abbreviation: "AB-Psych",
  },
  {
    id: "AB-PolSci",
    name: "Bachelor of Arts in Political Science",
    abbreviation: "AB-PolSci",
  },
  { id: "DM", name: "Diploma in Midwifery", abbreviation: "DM" },
];

// ============================================================================
// Reusable Input Field Component
// ============================================================================
const InputField = ({
  type,
  placeholder,
  icon,
  showToggle,
  value,
  onChange,
  required = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === "password" && showToggle
      ? showPassword
        ? "text"
        : "password"
      : type;

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
  searchKey = "name",
  displayKey = "name",
  subtitleKey = "abbreviation",
  emptyMessage = "No results found",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = options.filter(
        (opt) =>
          opt[searchKey].toLowerCase().includes(value.toLowerCase()) ||
          (opt[subtitleKey] &&
            opt[subtitleKey].toLowerCase().includes(value.toLowerCase())),
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          <div
            className="sticky top-0 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider 
                        flex items-center gap-1 border-b border-gray-100 bg-white"
          >
            <BookOpen size={12} />
            {filteredOptions.length} Result
            {filteredOptions.length !== 1 ? "s" : ""}
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
                <div
                  className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center 
                                    text-lime-600 group-hover:bg-lime-200 transition-colors text-xs font-bold flex-shrink-0"
                >
                  {option[subtitleKey]?.slice(0, 2) ||
                    option[displayKey]?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 group-hover:text-lime-800 truncate text-xs">
                    {option[displayKey]}
                  </p>
                  {option[subtitleKey] && (
                    <p className="text-[10px] text-gray-400">
                      {option[subtitleKey]}
                    </p>
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
  const [loginUsername, setLoginUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [school, setSchool] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [strand, setStrand] = useState("");
  const [strandSearch, setStrandSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState([
    "Arellano University - Andres Bonifacio Pasig Campus",
  ]);
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // CAPTCHA states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showCaptchaPopup, setShowCaptchaPopup] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const recaptchaRef = useRef(null);

  // Password mismatch shake
  const [passwordMismatchShake, setPasswordMismatchShake] = useState(false);

  // Saved signup data for restore functionality
  const [savedSignUpData, setSavedSignUpData] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Show CAPTCHA after failed attempts — auto-open popup
  useEffect(() => {
    if (failedAttempts >= 1) {
      setShowCaptcha(true);
      setCaptchaVerified(false);
      setShowCaptchaPopup(true);
    }
  }, [failedAttempts]);

  // Check if signup form has data
  const hasSignUpData = () => {
    return (
      fullName ||
      signUpUsername ||
      email ||
      password ||
      confirmPassword ||
      role ||
      school ||
      educationLevel ||
      strand ||
      department ||
      yearLevel
    );
  };

  // Check if login form has data
  const hasLoginData = () => {
    return loginUsername || loginEmail || loginPassword;
  };

  // Reset login form
  const resetLoginForm = () => {
    setLoginUsername("");
    setLoginEmail("");
    setLoginPassword("");
    setFailedAttempts(0);
    setShowCaptcha(false);
    setShowCaptchaPopup(false);
    setCaptchaVerified(false);
  };

  // Reset signup form
  const resetSignUpForm = () => {
    setFullName("");
    setSignUpUsername("");
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
      fullName,
      signUpUsername,
      email,
      password,
      confirmPassword,
      role,
      school,
      educationLevel,
      strand,
      strandSearch,
      department,
      departmentSearch,
      yearLevel,
      signUpPhase,
    };
  };

  // Restore saved signup data
  const restoreSignUpData = (data) => {
    setFullName(data.fullName || "");
    setSignUpUsername(data.signUpUsername || "");
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
      setIsSignUp((prev) => !prev);
      setError("");

      // Always reset BOTH forms completely
      resetLoginForm();
      resetSignUpForm();

      // If restoring signup data, re-apply it after clearing
      if (restoreData && savedSignUpData) {
        restoreSignUpData(savedSignUpData);
      } else {
        setSavedSignUpData(null);
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
      setError(""); // Clear error — user has verified, they can retry now
      // Fade out the CAPTCHA popup after a short delay
      setTimeout(() => {
        setShowCaptchaPopup(false);
      }, 800);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Step 1: Validate all fields are filled
    if (!loginUsername.trim()) {
      setError("Username is required");
      return;
    }

    if (!loginEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!loginPassword.trim()) {
      setError("Password is required");
      return;
    }

    // Step 2: Check CAPTCHA if required (after failed attempt)
    if (showCaptcha && !captchaVerified) {
      setShowCaptchaPopup(true);
      return;
    }

    setIsLoading(true);
    setError("");

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Step 3: Check credentials against ADMIN_USERS (username + email + password)
    const matchedUser = ADMIN_USERS.find(
      (user) =>
        user.username?.toLowerCase() === loginUsername.toLowerCase() &&
        user.email.toLowerCase() === loginEmail.toLowerCase() &&
        user.password === loginPassword,
    );

    if (matchedUser) {
      localStorage.setItem("ecopoints_current_user", matchedUser.id);
      setFailedAttempts(0);
      setShowCaptcha(false);
      setShowCaptchaPopup(false);
      router.push("/admin");
      return;
    }

    // Failed login — increment attempts, keep username/email intact
    setIsLoading(false);
    setFailedAttempts((prev) => prev + 1);
    setError("Invalid credentials. Please try again.");

    // Reset CAPTCHA for next attempt
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setCaptchaVerified(false);
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

    await new Promise((resolve) => setTimeout(resolve, 800));

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
      alert(
        "Account created! You can complete your profile later to access leaderboards.",
      );
      resetAllFields();
      setIsSignUp(false);
    }, 500);
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
    setLoginUsername("");
    setFullName("");
    setSignUpUsername("");
    setEmail("");
    setLoginEmail("");
    setPassword("");
    setLoginPassword("");
    setConfirmPassword("");
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

  // Mouse tracking for parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Animation styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(30px, -40px) rotate(90deg); }
          50% { transform: translate(-20px, -80px) rotate(180deg); }
          75% { transform: translate(40px, -30px) rotate(270deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-50px, -60px) rotate(120deg) scale(1.2); }
          66% { transform: translate(30px, -40px) rotate(240deg) scale(0.8); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -50px) scale(1.1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes drift-up {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* ===== PARALLAX BACKGROUND ===== */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${isClosing ? "opacity-0" : "opacity-100"}`}
      >
        {/* Base gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2f1f] via-[#0d3b2d] to-[#061f15]" />

        {/* Animated gradient orbs - react to mouse */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
            top: "10%",
            left: "15%",
            transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 20}px)`,
            transition: "transform 0.3s ease-out",
            animation: "pulse-glow 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)",
            bottom: "5%",
            right: "10%",
            transform: `translate(${mousePos.x * -25}px, ${mousePos.y * -15}px)`,
            transition: "transform 0.3s ease-out",
            animation: "pulse-glow 10s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: "radial-gradient(circle, #84cc16 0%, transparent 70%)",
            top: "50%",
            left: "60%",
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 25}px)`,
            transition: "transform 0.3s ease-out",
            animation: "pulse-glow 12s ease-in-out infinite 4s",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)`,
            transition: "transform 0.4s ease-out",
          }}
        />

        {/* Floating particles layer 1 - leaves/circles */}
        <div
          style={{
            transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`,
            transition: "transform 0.4s ease-out",
          }}
        >
          {[...Array(8)].map((_, i) => (
            <div
              key={`leaf-${i}`}
              className="absolute"
              style={{
                width: `${12 + (i % 3) * 8}px`,
                height: `${12 + (i % 3) * 8}px`,
                borderRadius: i % 2 === 0 ? "50% 0 50% 0" : "50%",
                background: `rgba(${i % 2 === 0 ? "16, 185, 129" : "20, 184, 166"}, ${0.1 + (i % 3) * 0.05})`,
                border: `1px solid rgba(${i % 2 === 0 ? "16, 185, 129" : "20, 184, 166"}, 0.15)`,
                top: `${10 + ((i * 12) % 80)}%`,
                left: `${5 + ((i * 13) % 90)}%`,
                animation: `float-${(i % 3) + 1} ${15 + i * 3}s ease-in-out infinite ${i * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Floating particles layer 2 - small dots (deeper parallax) */}
        <div
          style={{
            transform: `translate(${mousePos.x * 8}px, ${mousePos.y * 8}px)`,
            transition: "transform 0.6s ease-out",
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={`dot-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                background: `rgba(16, 185, 129, ${0.15 + (i % 3) * 0.1})`,
                top: `${(i * 8.3) % 100}%`,
                left: `${(i * 7.7) % 100}%`,
                animation: `float-slow ${10 + i * 2}s ease-in-out infinite ${i * 1.5}s`,
              }}
            />
          ))}
        </div>

        {/* Rising particles - bottles/eco motif */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={`rise-${i}`}
              className="absolute"
              style={{
                width: `${6 + (i % 3) * 4}px`,
                height: `${6 + (i % 3) * 4}px`,
                borderRadius: "50%",
                background: `rgba(132, 204, 22, ${0.15 + (i % 3) * 0.08})`,
                boxShadow: `0 0 ${8 + i * 2}px rgba(132, 204, 22, 0.1)`,
                left: `${10 + ((i * 15) % 80)}%`,
                animation: `drift-up ${20 + i * 5}s linear infinite ${i * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Vignette overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* Restore Dialog Popup */}
      {showRestoreDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => handleRestoreChoice(false)}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Restore Previous Data?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You have previously entered sign-up details. Would you like to
              restore them?
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

      {/* CAPTCHA Popup (all devices) */}
      {showCaptchaPopup && showCaptcha && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 animate-scale-in max-w-sm w-full">
            {captchaVerified ? (
              /* Verified state — shown briefly before popup closes */
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle size={40} className="text-lime-500" />
                <p className="text-sm font-bold text-lime-700">Verified!</p>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-gray-800 mb-3 text-center">
                  Verify You're Human
                </h3>

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
                    sitekey={
                      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                      "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                    }
                    onChange={handleCaptchaChange}
                    size="normal"
                    theme="light"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        className={`
        relative bg-white rounded-[2rem] shadow-2xl overflow-hidden 
        w-full max-w-[900px] min-h-[580px] md:min-h-[600px]
        flex transition-all duration-500 ease-in-out
        ${isClosing ? "animate-scale-out" : "animate-scale-in"}
        ${isMobile ? "flex-col max-h-[90vh]" : ""}
      `}
      >
        {/* --- LEFT SIDE: SIGN IN FORM --- */}
        <div
          className={`
          absolute top-0 left-0 h-full w-full md:w-1/2 
          flex flex-col items-center bg-white
          transition-all duration-700 ease-in-out overflow-y-auto
          ${isMobile
              ? !isSignUp
                ? "opacity-100 z-20 justify-end pb-10 pt-4 px-5"
                : "opacity-0 z-0 pointer-events-none justify-center"
              : "z-10 justify-center p-6"
            }
        `}
        >
          <div
            className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${!isSignUp ? "opacity-100" : "opacity-0 md:opacity-100"}`}
          >
            <h1
              className={`${isMobile ? "text-xl" : "text-2xl"} font-extrabold text-gray-800 mb-1`}
            >
              Welcome Back
            </h1>
            <p className="text-gray-400 text-xs mb-3">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-2">
              {/* Username Field */}
              <InputField
                type="text"
                placeholder="Username"
                icon={<AtSign size={16} />}
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              />

              {/* Email Field */}
              <InputField
                type="email"
                placeholder="Email"
                icon={<Mail size={16} />}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              {/* Password Field */}
              <InputField
                type="password"
                placeholder="Password"
                icon={<Lock size={16} />}
                showToggle={true}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

              {/* Error message */}
              {error && !isSignUp && !showCaptchaPopup && (
                <div
                  className={`p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1 ${passwordMismatchShake ? "animate-shake" : ""}`}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* CAPTCHA verified indicator (all devices) */}
              {captchaVerified && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-lime-50 border border-lime-200 rounded-lg">
                  <CheckCircle size={16} className="text-lime-600" />
                  <span className="text-xs font-medium text-lime-700">
                    Verified
                  </span>
                </div>
              )}

              <div className="w-full text-right">
                <a
                  href="#"
                  className="text-xs text-gray-500 hover:text-lime-600 transition-colors"
                >
                  Forgot your password?
                </a>
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
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* --- RIGHT SIDE: SIGN UP FORM --- */}
        <div
          className={`
          absolute top-0 right-0 h-full w-full md:w-1/2 
          flex flex-col items-center 
          bg-white
          transition-all duration-700 ease-in-out
          ${isMobile
              ? isSignUp
                ? "opacity-100 z-20 pt-4 pb-40 px-6 overflow-y-auto no-scrollbar justify-start"
                : "opacity-0 z-0 pointer-events-none justify-center"
              : "z-10 justify-center p-6 overflow-y-auto"
            }
        `}
        >
          <div
            className={`w-full max-w-xs flex flex-col items-center transition-opacity duration-500 ${isSignUp ? "opacity-100" : "opacity-0 md:opacity-100"}`}
          >
            {/* Phase Indicator */}
            {isSignUp && (
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${signUpPhase >= 1 ? "bg-lime-500 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  1
                </div>
                <div
                  className={`w-10 h-1 rounded-full transition-all ${signUpPhase >= 2 ? "bg-lime-500" : "bg-gray-200"}`}
                ></div>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                    ${signUpPhase >= 2 ? "bg-lime-500 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  2
                </div>
              </div>
            )}

            <h1
              className={`${isMobile ? "text-xl" : "text-2xl"} font-extrabold text-gray-800 mb-1`}
            >
              {signUpPhase === 1 ? "Create Account" : "Complete Your Profile"}
            </h1>
            <p className="text-gray-400 text-xs mb-3 text-center">
              {signUpPhase === 1
                ? "Join EcoPoints community today"
                : "Help us personalize your experience"}
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
                  type="text"
                  placeholder="Username"
                  icon={<AtSign size={18} />}
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
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
                  <span className="font-medium">📊 NOTE:</span> To see
                  leaderboards, you must complete user information 😊
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
                    <option value="" disabled>
                      Select User Type
                    </option>
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
                        if (
                          "Arellano University - Andres Bonifacio Pasig Campus"
                            .toLowerCase()
                            .includes(val.toLowerCase())
                        ) {
                          setFilteredSchools([
                            "Arellano University - Andres Bonifacio Pasig Campus",
                          ]);
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
                              <p className="font-semibold text-gray-800 group-hover:text-lime-800 text-xs">
                                {s}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Pasig City
                              </p>
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
                        <option value="" disabled>
                          Select Educational Level
                        </option>
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
                            <option value="" disabled>
                              Select Year Level
                            </option>
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
                    <Briefcase
                      size={20}
                      className="mx-auto mb-1 text-gray-400"
                    />
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
        <div
          className={`
          absolute z-50 overflow-hidden
          transition-all duration-[800ms] cubic-bezier(0.65, 0, 0.35, 1) text-white
          
          ${isMobile
              ? `w-full left-0
               ${isExpanding
                ? isSignUp
                  ? "h-full bottom-0 top-auto rounded-[2rem]"
                  : "h-full top-0 rounded-[2rem]"
                : isSignUp
                  ? "h-[18%] min-h-[140px] bottom-0 top-auto rounded-t-[3rem] rounded-b-[2rem]"
                  : "h-[18%] min-h-[140px] top-0 rounded-b-[3rem] rounded-t-[2rem]"
              }`
              : `top-0 h-full
                ${isExpanding
                ? "w-full left-0 rounded-[2rem]"
                : isSignUp
                  ? "w-1/2 left-0 rounded-r-[50px] rounded-l-[2rem]"
                  : "w-1/2 left-1/2 rounded-l-[50px] rounded-r-[2rem]"
              }`
            }
        `}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-lime-600 via-emerald-600 to-green-700 text-white flex items-center justify-center flex-col">
            {/* ANIMATED LOGO DISPLAY */}
            <div
              className={`absolute transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                            ${isExpanding ? "scale-125 opacity-100 rotate-0" : "scale-75 opacity-0 -rotate-12"}
                            ${isMobile ? "w-20" : "w-48"} z-0`}
            >
              <img
                src={
                  isMobile
                    ? "/Logo Elements (Light).png"
                    : "/EcoPoints Primary Logo (Light version).png"
                }
                alt="EcoPoints Logo"
                className="w-full h-auto object-contain drop-shadow-2xl animate-float-slow"
              />
            </div>

            {/* Content Container */}
            <div
              className={`
              relative w-full h-full transition-opacity duration-300 flex items-center justify-center z-10
              ${isExpanding ? "opacity-0 scale-95" : "opacity-100 scale-100"}
            `}
            >
              {isSignUp ? (
                /* Overlay is on LEFT - Encourage user to Login */
                <div className="flex flex-col justify-center items-center px-4 text-center space-y-2 max-w-md">
                  <h1
                    className={`${isMobile ? "text-lg" : "text-4xl"} font-bold tracking-tight`}
                  >
                    One of us?
                  </h1>
                  <p
                    className={`text-white/80 ${isMobile ? "text-[10px]" : "text-lg font-light"}`}
                  >
                    Already have an account? Sign in.
                  </p>

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
                  <h1
                    className={`${isMobile ? "text-lg" : "text-4xl"} font-bold tracking-tight`}
                  >
                    New Here?
                  </h1>
                  <p
                    className={`text-white/80 ${isMobile ? "text-[10px]" : "text-lg font-light"}`}
                  >
                    Sign up and start your journey!
                  </p>

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
    </div>
  );
}
