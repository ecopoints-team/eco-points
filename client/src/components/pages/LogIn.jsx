// ============================================================================
// ADMIN ACCOUNT CREDENTIALS (All passwords: SeedPass!23)
// Sign in with: email + password
// Total: 50 accounts across 2 organizations (multi-tenant)
// ============================================================================
//
// ── MULTI-TENANT ORGANIZATIONS ──────────────────────────────────────────────
//   EPTU: EcoPoints Test University (Quezon City)
//   GCS:  GreenCorp Solutions (Makati City)
//
// ── PERMISSION MATRIX (by role) ─────────────────────────────────────────────
//   Role               | Scope    | Dashboard | Users | Machines | Rewards | Logs   | Settings
//   ───────────────────|──────────|───────────|───────|──────────|─────────|────────|─────────
//   superadmin         | Global   | Edit      | CRUD  | CRUD     | CRUD    | Export | Edit
//   head_admin         | Org      | Edit      | CRUD  | CRUD     | CRUD    | Export | Edit
//   auditor            | Org      | View      | View  | View     | View    | Export | View
//   inventory_officer  | Org      | View      | —     | —        | CRUD    | View   | View
//   technician         | Org      | View      | —     | CRUD     | —       | View   | View
//
// ── SIDEBAR VISIBILITY ─────────────────────────────────────────────────────
//   Locations page: superadmin only
//   Manage Admins:  users.view permission (superadmin, head_admin)
//   Admin Logs:     superadmin only (others see only own-org logs)
//
// ── ADMIN ACCOUNTS (EPTU — EcoPoints Test University) ───────────────────────
//
//   Role                 | Username             | Email
//   superadmin           | superadmin           | superadmin@ecopoints.local
//   head_admin           | head_admin           | head_admin@ecopoints.local
//   auditor              | auditor              | auditor@ecopoints.local
//   technician           | technician           | technician@ecopoints.local
//   inventory_officer    | inventory_officer    | inventory_officer@ecopoints.local
//
// ── END-USER ACCOUNTS ───────────────────────────────────────────────────────
//
//   user                 | user                 | user@ecopoints.local
//   dependent            | dependent            | dependent@ecopoints.local
//
//   Username                  | Email                                      | Org
//   maria.delacruz            | maria.delacruz@ecopoints.local             | EPTU
//   christian.santos          | christian.santos@ecopoints.local           | EPTU
//   tristan.reyes             | tristan.reyes@ecopoints.local              | EPTU
//   enrique.cruz              | enrique.cruz@ecopoints.local               | EPTU
//   miguel.bautista           | miguel.bautista@ecopoints.local            | EPTU
//   adrian.rivera             | adrian.rivera@ecopoints.local              | EPTU
//   alyssa.gonzales           | alyssa.gonzales@ecopoints.local            | EPTU
//   angela.garcia             | angela.garcia@ecopoints.local              | EPTU
//   antonio.fernandez         | antonio.fernandez@ecopoints.local          | EPTU
//   beatrice.delacruz         | beatrice.delacruz@ecopoints.local          | EPTU
//   bianca.dizon              | bianca.dizon@ecopoints.local               | EPTU
//   camille.ramos             | camille.ramos@ecopoints.local              | EPTU
//   carlos.lopez              | carlos.lopez@ecopoints.local               | EPTU
//   celeste.garcia            | celeste.garcia@ecopoints.local             | EPTU
//   daniela.santos            | daniela.santos@ecopoints.local             | EPTU
//   darwin.navarro            | darwin.navarro@ecopoints.local             | EPTU
//   diana.mercado             | diana.mercado@ecopoints.local              | EPTU
//   elena.gonzales            | elena.gonzales@ecopoints.local             | EPTU
//   elijah.estrella           | elijah.estrella@ecopoints.local            | EPTU
//   francesca.villanueva      | francesca.villanueva@ecopoints.local       | EPTU
//   gabriel.mendoza           | gabriel.mendoza@ecopoints.local            | EPTU
//   gabriela.aquino           | gabriela.aquino@ecopoints.local            | EPTU
//   hannah.martinez           | hannah.martinez@ecopoints.local            | EPTU
//   isabela.valdez            | isabela.valdez@ecopoints.local             | EPTU
//   jasmine.aguilar           | jasmine.aguilar@ecopoints.local            | EPTU
//   jericho.bautista          | jericho.bautista@ecopoints.local           | EPTU
//   juan.soriano              | juan.soriano@ecopoints.local               | EPTU
//   katrina.mendoza           | katrina.mendoza@ecopoints.local            | EPTU
//   kenneth.morales           | kenneth.morales@ecopoints.local            | EPTU
//   kristine.manalo           | kristine.manalo@ecopoints.local            | EPTU
//   luis.torres               | luis.torres@ecopoints.local                | EPTU
//   mikhaela.santiago         | mikhaela.santiago@ecopoints.local          | EPTU
//   nathaniel.villanueva      | nathaniel.villanueva@ecopoints.local       | EPTU
//   nicole.rivera             | nicole.rivera@ecopoints.local              | EPTU
//   paolo.castillo            | paolo.castillo@ecopoints.local             | EPTU
//   patricia.reyes            | patricia.reyes@ecopoints.local             | EPTU
//   rafael.torres             | rafael.torres@ecopoints.local              | EPTU
//   ramon.fernandez           | ramon.fernandez@ecopoints.local            | EPTU
//   regina.salvador           | regina.salvador@ecopoints.local            | EPTU
//   renzo.pascual             | renzo.pascual@ecopoints.local              | EPTU
//   samantha.flores           | samantha.flores@ecopoints.local            | EPTU
//   sofia.ramos               | sofia.ramos@ecopoints.local                | EPTU
//   victoria.cruz             | victoria.cruz@ecopoints.local              | EPTU
//
// ── DEMO DATA INCLUDED ──────────────────────────────────────────────────────
//   ~200 recycling sessions, ~600 items, ~250 transactions
//   ~30 reward redemptions, ~50 admin logs, ~10 maintenance logs
//   ~100 login attempts, ~5 bulk deposits (30 days of activity)
//
// ── QUICK START ─────────────────────────────────────────────────────────────
//   Admin login:  superadmin@ecopoints.local / SeedPass!23 → /admin
//   User login:   user@ecopoints.local / SeedPass!23 → /rewards
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
  AtSign,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../context/AuthContext";
import { auth as authApi } from "../../services/api";

// ============================================================================
// AUTHORIZATION — Admin role set (mirrors server-side Admin_Role_Set)
// Members of this set redirect to /admin after login. All other roles
// (including `user` and `dependent`) redirect to /rewards. The /profile
// route is intentionally never used as a post-login target.
// ============================================================================
const ADMIN_ROLES = new Set([
  "superadmin",
  "head_admin",
  "auditor",
  "technician",
  "inventory_officer",
]);

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
// Elastic Float Input — Sign In fields only
// ============================================================================
const ElasticInput = ({ id, type, label, icon, value, onChange, required = false, showToggle = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isActive = isFocused || (value && value.length > 0);
  const inputType = type === 'password' && showToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative flex items-center w-full h-12 border-b border-gray-300 group focus-within:border-lime-500 transition-colors z-10 mt-4">
      <div className={`mr-3 transition-colors duration-300 ${isActive ? 'text-lime-500' : 'text-gray-400'}`}>
        {icon}
      </div>
      <div className="relative flex-1 h-full flex items-center">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full h-full bg-transparent text-gray-800 outline-none pb-1 text-sm"
        />
        <label
          htmlFor={id}
          className={`absolute left-0 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.26,1.55)] origin-left
            ${isActive
              ? '-translate-y-7 scale-75 text-lime-600 font-bold tracking-wide'
              : 'translate-y-0 scale-100 text-gray-400'
            }
          `}
        >
          {label}
        </label>
      </div>
      {showToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Reusable Input Field Component — Sign Up fields
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
      {/* Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>

      <input
        type={inputType}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg 
          block pl-10 pr-10 py-2.5 md:py-3 transition-all duration-300 outline-none
          placeholder:text-gray-400
          focus:border-lime-400 focus:ring-2 focus:ring-lime-500/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(132,204,22,0.08)]
          hover:bg-white"
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
        className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm web-web-rounded-lg 
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
                        w-full bg-white border border-gray-200 web-web-rounded-xl shadow-2xl 
                        max-h-[210px] overflow-y-auto"
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
export default function LogIn({ onClose, initialSignUp = false }) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(initialSignUp);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [signUpPhase, setSignUpPhase] = useState(1); // 1 = Basic, 2 = User Info

  // Form states
  const [loginCredential, setLoginCredential] = useState(""); // username OR email
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationsList, setLocationsList] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [educationLevel, setEducationLevel] = useState("");
  const [strand, setStrand] = useState("");
  const [strandSearch, setStrandSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [yearLevel, setYearLevel] = useState("");
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

  // Load locations for signup form
  useEffect(() => {
    if (isSignUp) {
      authApi.getPublicLocations().then(data => setLocationsList(data || [])).catch(() => { });
    }
  }, [isSignUp]);

  // Load community groups when locationId changes
  useEffect(() => {
    if (locationId) {
      authApi.getPublicGroups(locationId).then(data => setCommunityGroups(data || [])).catch(() => { });
    } else {
      setCommunityGroups([]);
    }
  }, [locationId]);

  // Check if signup form has data
  const hasSignUpData = () => {
    return (
      firstName ||
      middleName ||
      lastName ||
      signUpUsername ||
      email ||
      password ||
      confirmPassword ||
      role ||
      phone ||
      locationId ||
      educationLevel ||
      strand ||
      department ||
      yearLevel
    );
  };

  // Check if login form has data
  const hasLoginData = () => {
    return loginCredential || loginPassword;
  };

  // Reset login form
  const resetLoginForm = () => {
    setLoginCredential("");
    setLoginPassword("");
    setFailedAttempts(0);
    setShowCaptcha(false);
    setShowCaptchaPopup(false);
    setCaptchaVerified(false);
  };

  // Reset signup form
  const resetSignUpForm = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSignUpUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("");
    setPhone("");
    setLocationId("");
    setLocationSearch("");
    setShowLocationDropdown(false);
    setCommunityGroups([]);
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
      firstName,
      middleName,
      lastName,
      signUpUsername,
      email,
      password,
      confirmPassword,
      role,
      phone,
      locationId,
      locationSearch,
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
    setFirstName(data.firstName || "");
    setMiddleName(data.middleName || "");
    setLastName(data.lastName || "");
    setSignUpUsername(data.signUpUsername || "");
    setEmail(data.email || "");
    setPassword(data.password || "");
    setConfirmPassword(data.confirmPassword || "");
    setRole(data.role || "");
    setPhone(data.phone || "");
    setLocationId(data.locationId || "");
    setLocationSearch(data.locationSearch || "");
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
      setError(""); // Clear any previous error
      // Fade out the CAPTCHA popup after a short delay
      setTimeout(() => {
        setShowCaptchaPopup(false);
      }, 800);
    }
  };

  // Get login function from AuthContext
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Check CAPTCHA if required (after failed attempt)
    if (showCaptcha && !captchaVerified) {
      setShowCaptchaPopup(true);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await login(loginCredential, loginPassword);
      setFailedAttempts(0);
      setShowCaptcha(false);
      setShowCaptchaPopup(false);

      const role = data?.user?.role;

      if (ADMIN_ROLES.has(role)) {
        router.push("/admin");
      } else {
        router.push("/rewards");
      }
    } catch (err) {
      setIsLoading(false);
      setFailedAttempts((prev) => prev + 1);
      setError("Invalid credentials. Please try again.");

      // Reset CAPTCHA for next attempt
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
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

    try {
      // Resolve groupId from strand/department selection via communityGroups
      let groupId = null;
      if (role === "Student" && educationLevel === "shs" && strand) {
        const match = communityGroups.find(g => g.groupType === "shs_strand" && g.abbreviation === strand);
        if (match) groupId = match.id;
      } else if ((role === "Student" && educationLevel === "college" && department) || (role === "Faculty" && department)) {
        const match = communityGroups.find(g => g.groupType === "college" && g.abbreviation === department);
        if (match) groupId = match.id;
      } else if (role === "Staff") {
        const match = communityGroups.find(g => g.groupType === "staff");
        if (match) groupId = match.id;
      }

      await authApi.register({
        firstName,
        middleName: middleName || undefined,
        lastName,
        name: `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim(),
        username: signUpUsername || undefined,
        email: email || undefined,
        phone: phone ? `+63${phone}` : undefined,
        password,
        userType: role.toLowerCase(),
        locationId: parseInt(locationId),
        groupId: groupId || undefined,
        yearLevel: yearLevel || undefined,
      });

      setIsLoading(false);
      alert("Account created successfully! Please sign in.");
      resetAllFields();
      setIsSignUp(false);
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        router.push('/');
      }
    }, 120);
  };

  // Full reset of all form fields
  const resetAllFields = () => {
    setLoginCredential("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSignUpUsername("");
    setEmail("");
    setPassword("");
    setLoginPassword("");
    setConfirmPassword("");
    setRole("");
    setPhone("");
    setLocationId("");
    setLocationSearch("");
    setShowLocationDropdown(false);
    setCommunityGroups([]);
    setEducationLevel("");
    setStrand("");
    setStrandSearch("");
    setDepartment("");
    setDepartmentSearch("");
    setYearLevel("");
    setError("");
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




  // Force remove dark/neutral theme class from <html> when login is mounted
  // This prevents dark-themed form fields after admin signout
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'neutral', 'system');
    if (!html.classList.contains('light')) html.classList.add('light');
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
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

      {/* ===== BLURRED BACKDROP OVERLAY ===== */}
      <div
        className={`absolute inset-0 bg-[#064e3b]/40 transition-all duration-120 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      />

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
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 web-web-rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={() => handleRestoreChoice(true)}
                className="flex-1 py-2 px-4 bg-lime-600 text-white web-web-rounded-lg font-medium hover:bg-lime-700 transition-colors"
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
                  <div className="mb-3 p-2 web-web-rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
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
                ? "opacity-100 z-20 justify-end pb-20 pt-4 px-5"
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
              {/* Username or Email Field */}
              <ElasticInput
                id="login-credential"
                type="text"
                label="Username or Email"
                icon={<AtSign size={16} />}
                value={loginCredential}
                onChange={(e) => setLoginCredential(e.target.value)}
                required
              />

              {/* Password Field */}
              <ElasticInput
                id="login-password"
                type="password"
                label="Password"
                icon={<Lock size={16} />}
                showToggle={true}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

              {/* Error message */}
              {error && !isSignUp && !showCaptchaPopup && (
                <div
                  className={`p-2 web-web-rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1 ${passwordMismatchShake ? "animate-shake" : ""}`}
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* CAPTCHA verified indicator (all devices) */}
              {captchaVerified && (
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-lime-50 border border-lime-200 web-web-rounded-lg">
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
                className="w-1/2 mx-auto py-2.5 bg-lime-600 text-white web-web-rounded-lg font-bold shadow-lg 
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
            className={`w-full max-w-xs md:max-w-sm flex flex-col items-center transition-opacity duration-500 ${isSignUp ? "opacity-100" : "opacity-0 md:opacity-100"}`}
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
              <form onSubmit={handleSignUpPhase1} className={`w-full space-y-2.5 ${passwordMismatchShake ? "animate-shake" : ""}`}>
                {/* Row 1: First Name / Middle Name / Last Name */}
                <div className="flex gap-2">
                  <InputField
                    type="text"
                    placeholder="First Name"
                    icon={<User size={16} />}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <InputField
                    type="text"
                    placeholder="Middle Name"
                    icon={<User size={16} />}
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                  <InputField
                    type="text"
                    placeholder="Last Name"
                    icon={<User size={16} />}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>

                {/* Row 2: Username full-width */}
                <InputField
                  type="text"
                  placeholder="Username"
                  icon={<AtSign size={16} />}
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  required
                />

                {/* Row 3: Email full-width */}
                <InputField
                  type="email"
                  placeholder="Email"
                  icon={<Mail size={16} />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {/* Row 4: Password + Confirm Password side-by-side */}
                <div className="flex gap-2">
                  <InputField
                    type="password"
                    placeholder="Password"
                    icon={<Lock size={16} />}
                    showToggle={true}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <InputField
                    type="password"
                    placeholder="Confirm Password"
                    icon={<Lock size={16} />}
                    showToggle={true}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && isSignUp && signUpPhase === 1 && (
                  <div className="p-2 web-web-rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-1/2 mx-auto py-2.5 md:py-3 bg-lime-600 text-white web-web-rounded-lg font-bold shadow-lg 
                                        hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5 
                                        transition-all duration-300 flex items-center justify-center gap-2 mt-2"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* PHASE 2: User Information (User Type, Organization, Phone, Department/Strand) */}
            {signUpPhase === 2 && (
              <form onSubmit={handleSignUpPhase2} className="w-full space-y-2">
                {/* USER TYPE DROPDOWN */}
                <div className="relative w-full group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                    <Users size={18} />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className={`w-full bg-gray-50 border border-gray-200 text-sm web-web-rounded-lg 
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

                {/* PHONE NUMBER */}
                <div className="relative w-full group">
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium">+63</span>
                    <input
                      type="tel"
                      placeholder="9XX XXX XXXX"
                      value={phone}
                      onChange={(e) => { let d = e.target.value.replace(/[^\d]/g, ''); if (d.startsWith('0')) d = d.slice(1); setPhone(d.slice(0, 10)); }}
                      maxLength={10}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-r-lg 
                                  focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                  block px-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white"
                    />
                  </div>
                </div>

                {/* ORGANIZATION / LOCATION SEARCHABLE DROPDOWN */}
                <div className="relative w-full group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300 z-10">
                    <Building2 size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Select Organization / Campus"
                    value={locationSearch}
                    required={!locationId}
                    onChange={(e) => {
                      setLocationSearch(e.target.value);
                      setShowLocationDropdown(true);
                      if (!e.target.value) { setLocationId(""); setCommunityGroups([]); }
                    }}
                    onFocus={() => setShowLocationDropdown(true)}
                    onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm web-web-rounded-lg 
                                    focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                    block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white"
                  />
                  {showLocationDropdown && (
                    <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 web-web-rounded-xl shadow-2xl max-h-[210px] overflow-y-auto z-50 p-1">
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 border-b border-gray-100 mb-1">
                        <Building2 size={12} />
                        Organizations
                      </div>
                      {locationsList
                        .filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()) || (l.fullName || '').toLowerCase().includes(locationSearch.toLowerCase()))
                        .slice(0, 20)
                        .map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setLocationId(String(loc.id));
                              setLocationSearch(loc.fullName || loc.name);
                              setShowLocationDropdown(false);
                              // Reset education fields when org changes
                              setEducationLevel(""); setStrand(""); setStrandSearch(""); setDepartment(""); setDepartmentSearch(""); setYearLevel("");
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-lime-50 web-web-rounded-lg text-sm text-gray-700 hover:text-lime-700 transition-all flex items-center gap-2 group"
                          >
                            <div className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center text-lime-600 group-hover:bg-lime-200 transition-colors flex-shrink-0">
                              <Building2 size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 group-hover:text-lime-800 text-xs truncate">{loc.fullName || loc.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{loc.name}</p>
                            </div>
                          </button>
                        ))}
                      {locationsList.filter(l => l.name.toLowerCase().includes(locationSearch.toLowerCase()) || (l.fullName || '').toLowerCase().includes(locationSearch.toLowerCase())).length === 0 && (
                        <div className="px-4 py-4 text-center flex flex-col items-center justify-center text-gray-400 gap-1">
                          <Search size={16} />
                          <span className="text-xs">No organizations found</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CONDITIONAL FIELDS BASED ON ROLE */}
                {role === "Student" && locationId && (
                  <>
                    {/* Educational Level */}
                    <div className="relative w-full group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                        <GraduationCap size={18} />
                      </div>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        required
                        className={`w-full bg-gray-50 border border-gray-200 text-sm web-web-rounded-lg 
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

                    {/* SHS Strand Dropdown - Use community groups from API */}
                    {educationLevel === "shs" && (
                      <>
                        <FloatingSearchDropdown
                          placeholder="Select Strand"
                          icon={<BookOpen size={18} />}
                          value={strandSearch}
                          onChange={setStrandSearch}
                          options={communityGroups.filter(g => g.groupType === 'shs_strand').map(g => ({ id: g.abbreviation || g.name, name: g.abbreviation || g.name, fullName: g.name }))}
                          onSelect={(option) => {
                            setStrand(option.id);
                            setStrandSearch(option.name);
                          }}
                          searchKey="name"
                          displayKey="name"
                          subtitleKey="fullName"
                          emptyMessage="No strand found"
                        />

                        {/* Year Level (for Senior High School) */}
                        <div className="relative w-full group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors duration-300">
                            <Zap size={18} />
                          </div>
                          <select
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                            required
                            className={`w-full bg-gray-50 border border-gray-200 text-sm web-web-rounded-lg 
                                                            focus:ring-2 focus:ring-lime-500 focus:border-transparent 
                                                            block pl-10 pr-3 py-2.5 md:py-3 transition-all duration-300 outline-none hover:bg-white appearance-none cursor-pointer
                                                            ${yearLevel === "" ? "text-gray-400" : "text-gray-800"}`}
                          >
                            <option value="" disabled>
                              Select Year Level
                            </option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </>
                    )}

                    {/* College Department Dropdown - Use community groups from API */}
                    {educationLevel === "college" && (
                      <>
                        <FloatingSearchDropdown
                          placeholder="Search Department"
                          icon={<Building2 size={18} />}
                          value={departmentSearch}
                          onChange={setDepartmentSearch}
                          options={communityGroups.filter(g => g.groupType === 'college').map(g => ({ id: g.abbreviation || g.name, name: g.name, abbreviation: g.abbreviation || g.name }))}
                          onSelect={(option) => {
                            setDepartment(option.id);
                            setDepartmentSearch(option.abbreviation);
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
                            required
                            className={`w-full bg-gray-50 border border-gray-200 text-sm web-web-rounded-lg 
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

                {/* Faculty: Department Search - Use community groups from API */}
                {role === "Faculty" && locationId && (
                  <FloatingSearchDropdown
                    placeholder="Search Department"
                    icon={<Building2 size={18} />}
                    value={departmentSearch}
                    onChange={setDepartmentSearch}
                    options={communityGroups.filter(g => g.groupType === 'college').map(g => ({ id: g.abbreviation || g.name, name: g.name, abbreviation: g.abbreviation || g.name }))}
                    onSelect={(option) => {
                      setDepartment(option.id);
                      setDepartmentSearch(option.abbreviation);
                    }}
                    searchKey="name"
                    displayKey="name"
                    subtitleKey="abbreviation"
                    emptyMessage="No department found"
                  />
                )}

                {/* Staff: No additional fields */}
                {role === "Staff" && (
                  <div className="p-3 web-web-rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-xs text-center">
                    <Briefcase
                      size={20}
                      className="mx-auto mb-1 text-gray-400"
                    />
                    No additional information required
                  </div>
                )}

                {error && isSignUp && signUpPhase === 2 && (
                  <div className="p-2 web-web-rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-lime-600 text-white web-web-rounded-lg font-bold shadow-lg text-sm
                                            hover:bg-lime-700 hover:shadow-xl hover:-translate-y-0.5
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
                    ? "/logo-elements-light.png"
                    : "/ecopoints-primary-logo-light.png"
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
