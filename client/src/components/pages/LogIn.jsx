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
import { useState, useEffect, useRef, Fragment } from "react";
import { createPortal } from "react-dom";
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
  Check,
  Building2,
  Users,
  Zap,
  ArrowRight,
  Leaf,
  Search,
  BookOpen,
  Briefcase,
  AlertCircle,
  CheckCircle,
  AtSign,
  ArrowLeft,
  KeyRound,
  Phone,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../services/api/auth";
import { TC_Modal, PP_Modal } from "./LegalModals";

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
// YEAR_LEVEL_OPTIONS — Static options for the Year Level dropdown
// Declared once at module level so it is never reallocated on re-render.
// ============================================================================
const YEAR_LEVEL_OPTIONS = [
  { id: 1, name: '1st Year', abbreviation: 'Y1' },
  { id: 2, name: '2nd Year', abbreviation: 'Y2' },
  { id: 3, name: '3rd Year', abbreviation: 'Y3' },
  { id: 4, name: '4th Year', abbreviation: 'Y4' },
  { id: 5, name: '5th Year', abbreviation: 'Y5' },
];

// ============================================================================
// Floating Input Field — Sign In fields (replaces ElasticInput in login form)
// ============================================================================
export const FloatingInputField = ({
  id,
  type,
  label,
  icon,
  value,
  onChange,
  required = false,
  error = false,
  onFocus,
  onBlur,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const hasIcon = Boolean(icon);

  // Label floats when focused OR has a value
  const isFloated = isFocused || value.length > 0;

  const borderColor = error
    ? 'border-rose-500'
    : isFocused
      ? 'border-emerald-500'
      : 'border-slate-200';

  const iconColor = error
    ? 'text-rose-500'
    : isFocused
      ? 'text-emerald-500'
      : value.length > 0
        ? 'text-emerald-400'
        : 'text-slate-400';

  const separatorColor = error ? 'bg-rose-200' : 'bg-slate-300';
  const separatorOpacity = isFloated ? 'opacity-100' : 'opacity-0';

  const labelColor = error
    ? 'text-rose-500'
    : isFloated
      ? 'text-emerald-600'
      : 'text-slate-400';

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Resting: centered in the field (field top = 24px, field height = 48px → center = 48px from wrapper top)
  // Floated: centered on the top border line (border is at top=24px from wrapper top)
  const labelStyle = isFloated
    ? { top: '24px', transform: 'translateY(-50%)' }
    : { top: '48px', transform: 'translateY(-50%)' };

  const labelXClass = hasIcon ? 'translate-x-10' : 'translate-x-3';

  return (
    // pt-6 reserves space so the floated label doesn't get clipped
    <div className="relative w-full pt-6">
      {/* Label — resting: placeholder-style inside the field; floated: centered on the top border */}
      <label
        htmlFor={id}
        style={labelStyle}
        className={`pointer-events-none absolute left-0 z-10 font-medium
          transition-all duration-200 ease-in-out
          ${labelXClass}
          ${isFloated ? 'text-xs font-bold bg-white px-1' : 'text-sm bg-transparent'}
          ${labelColor}
        `}
      >
        {label}
      </label>

      {/* Field container */}
      <div
        className={`flex items-center w-full h-12 border rounded-lg px-3 transition-colors duration-200 ${borderColor}`}
      >
        {hasIcon && (
          <div
            data-testid="icon-wrapper"
            className={`flex items-center justify-center transition-colors duration-300 mr-0 ${iconColor}`}
          >
            {icon}
          </div>
        )}

        {hasIcon && (
          <div
            data-testid="separator"
            className={`w-px h-5 mx-3 transition-opacity duration-200 ${separatorColor} ${separatorOpacity}`}
          />
        )}

        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          placeholder=""
          className="flex-1 bg-transparent outline-none text-sm text-slate-700"
        />

        {isPassword && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword(p => !p)}
            className="ml-2 p-1 rounded text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Elastic Float Input — Sign In fields only
// ============================================================================
export const ElasticInput = ({ id, type, label, icon, value, onChange, required = false, showToggle = false }) => {
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
// filterOptions — pure filter utility for FloatingSearchableDropdown
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
// ============================================================================
/**
 * Returns a filtered slice of `options` matching `query`.
 *
 * @param {string} query        - The search string typed by the user (may be empty).
 * @param {Array}  options      - Full list of DropdownOption objects.
 * @param {string} searchKey    - Primary field to match against (e.g. "name").
 * @param {string} subtitleKey  - Secondary field to match against (e.g. "abbreviation").
 * @param {number} maxItems     - Maximum number of items to return.
 * @returns {Array} Filtered array of length ≤ maxItems. Input array is never mutated.
 */
function filterOptions(query, options, searchKey, subtitleKey, maxItems) {
  if (query === "") {
    return options.slice(0, maxItems);
  }

  const result = [];
  const q = query.toLowerCase();

  for (const option of options) {
    const primary = option[searchKey]?.toLowerCase() ?? "";
    const secondary = option[subtitleKey]?.toLowerCase() ?? "";
    if (primary.includes(q) || secondary.includes(q)) {
      result.push(option);
    }
    if (result.length === maxItems) {
      break;
    }
  }

  return result;
}

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
          className="absolute z-50 bottom-full mb-1 left-0
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
// Progress_Bar — 3-step wizard indicator (local to LogIn.jsx)
// ============================================================================
function Progress_Bar({ currentStep }) {
  return (
    <div className="flex items-center justify-center w-full mb-6">
      {[1, 2, 3].map((n, i) => (
        <Fragment key={n}>
          {/* Connector — dashed gray line between steps */}
          {i > 0 && (
            <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-1" />
          )}
          {/* Step indicator circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                transition-all duration-300
                ${n === currentStep
                  ? 'bg-lime-500 text-white shadow-md'
                  : n < currentStep
                    ? 'bg-lime-400 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
          >
            {n}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// FloatingSelectField — custom dropdown in the FloatingInputField visual shell.
// Replaces the native <select> with a styled panel matching the login modal theme.
// Local to LogIn.jsx — do not export.
// Props: id, label, icon, value, onChange, options, onBlur, error, disabled
// ============================================================================
function FloatingSelectField({
  id,
  label,
  icon,
  value,
  onChange,
  options,
  onBlur,
  error = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const hasIcon = Boolean(icon);

  const isFloated = isFocused || isOpen || value.length > 0;

  const borderColor = error
    ? 'border-rose-500'
    : isOpen || isFocused
      ? 'border-emerald-500'
      : 'border-slate-200';

  const iconColor = error
    ? 'text-rose-500'
    : isOpen || isFocused
      ? 'text-emerald-500'
      : value.length > 0
        ? 'text-emerald-400'
        : 'text-slate-400';

  const separatorColor = error ? 'bg-rose-200' : 'bg-slate-300';
  const separatorOpacity = isFloated ? 'opacity-100' : 'opacity-0';

  const labelColor = error
    ? 'text-rose-500'
    : isFloated
      ? 'text-emerald-600'
      : 'text-slate-400';

  const labelStyle = isFloated
    ? { top: '24px', transform: 'translateY(-50%)' }
    : { top: '48px', transform: 'translateY(-50%)' };

  const labelXClass = hasIcon ? 'translate-x-10' : 'translate-x-3';

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    const next = !isOpen;
    setIsOpen(next);
    setIsFocused(next);
    if (!next) onBlur?.();
  };

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div ref={wrapperRef} className={`relative w-full pt-6 ${disabled ? 'opacity-50' : ''}`}>
      {/* Floating label */}
      <label
        htmlFor={id}
        style={labelStyle}
        className={`pointer-events-none absolute left-0 z-10 font-medium
          transition-all duration-200 ease-in-out
          ${labelXClass}
          ${isFloated ? 'text-xs font-bold bg-white px-1' : 'text-sm bg-transparent'}
          ${labelColor}
        `}
      >
        {label}
      </label>

      {/* Field shell — matches FloatingInputField dimensions */}
      <button
        id={id}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center w-full h-12 border rounded-lg px-3 transition-colors duration-200 cursor-pointer ${borderColor} bg-transparent`}
      >
        {hasIcon && (
          <div
            data-testid="select-icon-wrapper"
            className={`flex items-center justify-center transition-colors duration-300 mr-0 ${iconColor}`}
          >
            {icon}
          </div>
        )}

        {hasIcon && (
          <div
            data-testid="select-separator"
            className={`w-px h-5 mx-3 transition-opacity duration-200 ${separatorColor} ${separatorOpacity}`}
          />
        )}

        <span className={`flex-1 text-left text-sm ${value ? 'text-slate-700' : 'text-slate-400'}`}>
          {value || ''}
        </span>

        <ChevronDown
          size={16}
          className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Custom dropdown panel — opens downward */}
      {isOpen && !disabled && (
        <div className="absolute z-50 top-full mt-0.5 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                  ${value === opt
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}
              >
                <span>{opt}</span>
                {value === opt && <Check size={14} className="text-emerald-600 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step1_AccountCredentials — purely presentational; all validation logic and
// derived values (emailValid, usernameValid, passwordRules, passwordValid,
// step1Valid, showMatchIndicator, passwordsMatch) are computed in SignUp_Wizard
// and passed as props.
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
// ============================================================================
function Step1_AccountCredentials({
  email, setEmail,
  username, setUsername,
  password, setPassword,
  confirmPassword, setConfirmPassword,
  touched, setTouched,
  passwordRules,
  showMatchIndicator, passwordsMatch,
  step1Valid,
  onNext,
  onSwitchToSignIn,
}) {
  // Derive per-field validity from passwordRules and values for error display.
  // emailValid / usernameValid / passwordValid are not passed as separate props
  // so we derive them locally for rendering only — the canonical source remains
  // in SignUp_Wizard.
  const emailValid     = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
  const usernameValid  = /^[a-zA-Z0-9._]{3,30}$/.test(username);
  const passwordValid  = passwordRules && Object.values(passwordRules).every(Boolean);

  // Track password field focus so criteria show immediately on click
  const [passwordFocused, setPasswordFocused] = useState(false);
  const showPasswordCriteria = (passwordFocused || touched.password) && !passwordValid && passwordRules;

  return (
    <div className="w-full space-y-1">
      {/* Email */}
      <FloatingInputField
        id="signup-email"
        type="email"
        label="Email"
        icon={<Mail size={18} />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, email: true }))}
        error={touched.email && !emailValid}
      />
      {touched.email && !emailValid && (
        <p className="text-xs text-rose-500 pl-3">
          Enter a valid email address.
        </p>
      )}

      {/* Username */}
      <FloatingInputField
        id="signup-username"
        type="text"
        label="Username"
        icon={<AtSign size={18} />}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, username: true }))}
        error={touched.username && !usernameValid}
      />
      {touched.username && !usernameValid && (
        <p className="text-xs text-rose-500 pl-3">
          3–30 characters: letters, numbers, dots, underscores only.
        </p>
      )}

      {/* Password */}
      <FloatingInputField
        id="signup-password"
        type="password"
        label="Password"
        icon={<Lock size={18} />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => { setPasswordFocused(false); setTouched(t => ({ ...t, password: true })); }}
        error={touched.password && !passwordValid}
      />
      {showPasswordCriteria && (
        <ul className="text-xs pl-3 list-disc list-inside space-y-0.5">
          <li className={passwordRules.minLength ? 'text-emerald-600' : 'text-rose-500'}>At least 8 characters</li>
          <li className={passwordRules.hasUpper  ? 'text-emerald-600' : 'text-rose-500'}>At least one uppercase letter (A–Z)</li>
          <li className={passwordRules.hasLower  ? 'text-emerald-600' : 'text-rose-500'}>At least one lowercase letter (a–z)</li>
          <li className={passwordRules.hasDigit  ? 'text-emerald-600' : 'text-rose-500'}>At least one digit (0–9)</li>
          <li className={passwordRules.noSpace   ? 'text-emerald-600' : 'text-rose-500'}>Must not contain spaces</li>
        </ul>
      )}

      {/* Confirm Password */}
      <FloatingInputField
        id="signup-confirm-password"
        type="password"
        label="Confirm Password"
        icon={<Lock size={18} />}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, confirmPassword: true }))}
        error={false}
      />
      {showMatchIndicator && (
        <p className={`text-xs font-semibold pl-3 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-500'}`}>
          {passwordsMatch ? 'Match' : 'Mismatch'}
        </p>
      )}

      {/* Next Step button */}
      <button
        type="button"
        disabled={!step1Valid}
        onClick={onNext}
        className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold
          hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2"
      >
        Next Step <ArrowRight size={16} />
      </button>

      {/* Sign In link */}
      <p className="text-center text-xs text-slate-500 mt-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-emerald-600 font-semibold hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}

// ============================================================================
// PhoneInputField — FloatingInputField shell with a fixed +63 prefix box.
// "Phone Number" label rests inside the field and floats to the top border
// on focus/fill. The +63 prefix box is only visible once the label has floated.
// Props: value, onChange(rawDigits), onBlur, error
// ============================================================================
function PhoneInputField({ value, onChange, onBlur, error = false }) {
  const [isFocused, setIsFocused] = useState(false);

  const isFloated = isFocused || value.length > 0;

  const borderColor = error
    ? 'border-rose-500'
    : isFocused
      ? 'border-emerald-500'
      : 'border-slate-200';

  const labelColor = error
    ? 'text-rose-500'
    : isFloated
      ? 'text-emerald-600'
      : 'text-slate-400';

  const prefixBorderColor = error
    ? 'border-rose-300 bg-rose-50 text-rose-400'
    : isFocused
      ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
      : 'border-slate-200 bg-slate-100 text-slate-500';

  // Same label positioning math as FloatingInputField
  const labelStyle = isFloated
    ? { top: '24px', transform: 'translateY(-50%)' }
    : { top: '48px', transform: 'translateY(-50%)' };

  // When label is resting, it sits at the normal left edge (no prefix visible).
  // When floated, prefix is visible so label shifts right past it.
  const labelLeft = isFloated ? '0' : '0';
  const labelX = isFloated ? 'translate-x-3' : 'translate-x-3';

  return (
    <div className="relative w-full pt-6">
      {/* Floating label */}
      <label
        htmlFor="signup-phone"
        style={labelStyle}
        className={`pointer-events-none absolute left-0 z-10 font-medium
          transition-all duration-200 ease-in-out ${labelX}
          ${isFloated ? 'text-xs font-bold bg-white px-1' : 'text-sm bg-transparent'}
          ${labelColor}`}
      >
        Phone Number (optional)
      </label>

      {/* Field shell */}
      <div className={`flex items-center w-full h-12 border rounded-lg overflow-hidden transition-colors duration-200 ${borderColor}`}>
        {/* +63 prefix — only visible after label floats */}
        {isFloated && (
          <span className={`px-3 text-sm font-semibold h-full flex items-center border-r select-none whitespace-nowrap transition-colors duration-200 ${prefixBorderColor}`}>
            +63
          </span>
        )}
        {/* Digit input */}
        <input
          id="signup-phone"
          type="tel"
          inputMode="numeric"
          placeholder=""
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          className="flex-1 h-full bg-transparent px-3 text-sm text-slate-700 outline-none"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Step2_PersonalDetails — Step 2 of SignUp_Wizard (Personal Details)
// Purely presentational: receives all state and derived validity booleans
// from SignUp_Wizard via props.
// Props: firstName, setFirstName, middleName, setMiddleName, lastName,
//        setLastName, phone, setPhone, touched, setTouched,
//        firstNameValid, lastNameValid, phoneValid, step2Valid,
//        onNext, onBack
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
// ============================================================================
function Step2_PersonalDetails({
  firstName, setFirstName,
  middleName, setMiddleName,
  lastName, setLastName,
  phone, setPhone,
  touched, setTouched,
  firstNameValid, lastNameValid, phoneValid,
  step2Valid,
  onNext,
  onBack,
}) {
  return (
    <div className="w-full space-y-1">
      {/* First Name */}
      <FloatingInputField
        id="signup-firstname"
        type="text"
        label="First Name"
        icon={<User size={18} />}
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, firstName: true }))}
        error={touched.firstName && !firstNameValid}
      />
      {touched.firstName && !firstNameValid && (
        <p className="text-xs text-rose-500 pl-3">
          1–50 characters; letters, spaces, hyphens, apostrophes only.
        </p>
      )}

      {/* Middle Name (optional) */}
      <FloatingInputField
        id="signup-middlename"
        type="text"
        label="Middle Name (optional)"
        icon={<User size={18} />}
        value={middleName}
        onChange={(e) => setMiddleName(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, middleName: true }))}
        error={false}
      />

      {/* Last Name */}
      <FloatingInputField
        id="signup-lastname"
        type="text"
        label="Last Name"
        icon={<User size={18} />}
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        onBlur={() => setTouched(t => ({ ...t, lastName: true }))}
        error={touched.lastName && !lastNameValid}
      />
      {touched.lastName && !lastNameValid && (
        <p className="text-xs text-rose-500 pl-3">
          1–50 characters; letters, spaces, hyphens, apostrophes only.
        </p>
      )}

      {/* Phone Number — FloatingInputField shell with inline +63 prefix */}
      <PhoneInputField
        value={phone}
        onChange={(v) => setPhone(v)}
        onBlur={() => setTouched(t => ({ ...t, phone: true }))}
        error={touched.phone && phone.length > 0 && !phoneValid}
      />
      {touched.phone && phone.length > 0 && !phoneValid && (
        <p className="text-xs text-rose-500 pl-1">
          Enter 10-digit PH mobile number starting with 9 (e.g. 9171234567).
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium
            hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          disabled={!step2Valid}
          onClick={onNext}
          className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold
            hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          Next Step <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FloatingSearchableDropdown — Unified searchable dropdown with floating label
// Replaces FloatingSearchDropdown, FloatingDatalistField, and plain
// FloatingInputField for the three Step 3 fields. Opens upward, shows up to 5
// items, debounces filter by 300 ms.
// Requirements: 1.1–1.9, 2.1–2.7, 3.1–3.3, 4.1–4.3
// ============================================================================

/**
 * useDebounce — delays propagating `value` by `delayMs` milliseconds.
 * Uses useRef for the timer ID to avoid triggering extra renders.
 *
 * @param {string} value    - The current string to debounce.
 * @param {number} delayMs  - Delay in milliseconds.
 * @returns {string} debouncedValue — trails `value` by `delayMs` ms.
 */
function useDebounce(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear any existing timer before setting a new one
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    // Cleanup: clear timer on unmount or before next effect run
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * FloatingSearchableDropdown — controlled searchable dropdown with floating label.
 *
 * Props:
 *   id           {string}          — Used for label htmlFor
 *   label        {string}          — Floating label text
 *   icon         {React.ReactNode} — Left icon (Lucide element)
 *   value        {string}          — Current display text in the input (controlled)
 *   onChange     {Function}        — Called on every keystroke: (text: string) => void
 *   options      {Array}           — Full DropdownOption[] list (filtered internally)
 *   onSelect     {Function}        — Called when user clicks an item: (option) => void
 *   onClear      {Function}        — Called when input is cleared to ''
 *   searchKey    {string}          — Field to match against (default: "name")
 *   displayKey   {string}          — Field for primary item text (default: "name")
 *   subtitleKey  {string}          — Field for subtitle / avatar initials (default: "abbreviation")
 *   emptyMessage {string}          — Text when no matches (default: "No results found")
 *   disabled     {boolean}         — Disables input and prevents dropdown from opening
 *   error        {boolean}         — Triggers rose colour state
 *   onBlur       {Function}        — Forwarded blur handler
 */
function FloatingSearchableDropdown({
  id,
  label,
  icon,
  value,
  onChange,
  options = [],
  onSelect,
  onClear,
  searchKey = 'name',
  displayKey = 'name',
  subtitleKey = 'abbreviation',
  emptyMessage = 'No results found',
  disabled = false,
  error = false,
  onBlur,
  direction = 'up',  // 'up' | 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the typed value so filter only re-runs 300 ms after the last keystroke
  const debouncedQuery = useDebounce(value, 300);

  // Ref for outside-click detection
  const wrapperRef = useRef(null);

  // Close on mousedown outside the wrapper
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // ── Task 2.3: Event handlers ──────────────────────────────────────────────

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    setIsOpen(true);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    // Do NOT close here — closing on blur eats the item mousedown click
    onBlur?.(e);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    if (e.target.value === '') {
      onClear?.();
    }
    if (!disabled) setIsOpen(true);
  };

  const handleSelect = (option) => {
    onSelect(option);
    onChange(option[displayKey]);
    setIsOpen(false);
  };

  // ── Task 2.2: Colour derivation (same logic as FloatingInputField) ────────

  const isFloated = isFocused || value.length > 0;

  const borderColor = error
    ? 'border-rose-500'
    : isFocused
      ? 'border-emerald-500'
      : 'border-slate-200';

  const iconColor = error
    ? 'text-rose-500'
    : isFocused
      ? 'text-emerald-500'
      : value.length > 0
        ? 'text-emerald-400'
        : 'text-slate-400';

  const separatorColor = error ? 'bg-rose-200' : 'bg-slate-300';
  const separatorOpacity = isFloated ? 'opacity-100' : 'opacity-0';

  const labelColor = error
    ? 'text-rose-500'
    : isFloated
      ? 'text-emerald-600'
      : 'text-slate-400';

  const labelStyle = isFloated
    ? { top: '24px', transform: 'translateY(-50%)' }
    : { top: '48px', transform: 'translateY(-50%)' };

  // Compute the displayed list from the debounced query
  const displayed = filterOptions(debouncedQuery, options, searchKey, subtitleKey, 5);

  // ── Task 2.2: Render ──────────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className={`relative w-full pt-6 ${disabled ? 'opacity-50' : ''}`}>
      {/* Floating label */}
      <label
        htmlFor={id}
        style={labelStyle}
        className={`pointer-events-none absolute left-0 z-10 font-medium
          transition-all duration-200 ease-in-out translate-x-10
          ${isFloated ? 'text-xs font-bold bg-white px-1' : 'text-sm bg-transparent'}
          ${labelColor}`}
      >
        {label}
      </label>

      {/* Field container */}
      <div className={`flex items-center w-full h-12 border rounded-lg px-3 transition-colors duration-200 ${borderColor}`}>
        {/* Left icon */}
        <div className={`flex items-center justify-center transition-colors duration-300 mr-0 ${iconColor}`}>
          {icon}
        </div>

        {/* Vertical separator */}
        <div className={`w-px h-5 mx-3 transition-opacity duration-200 ${separatorColor} ${separatorOpacity}`} />

        {/* Text input */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder=""
          className={`flex-1 bg-transparent outline-none text-sm text-slate-700 ${disabled ? 'cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Dropdown list — direction-aware */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[210px] overflow-y-auto ${direction === 'down' ? 'top-full mt-0.5' : 'bottom-full mb-0.5'}`}>
          {/* Header row */}
          <div className="sticky top-0 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-100 bg-white">
            <BookOpen size={12} />
            {displayed.length} Result{displayed.length !== 1 ? 's' : ''}
          </div>

          {/* Item rows */}
          {displayed.length > 0 ? (
            displayed.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={() => handleSelect(option)}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm text-slate-700 hover:text-emerald-700 transition-all flex items-center gap-2 group border-b border-slate-50 last:border-0"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors text-xs font-bold flex-shrink-0">
                  {option[subtitleKey]?.slice(0, 2) || option[displayKey]?.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 group-hover:text-emerald-800 truncate text-xs">
                    {option[displayKey]}
                  </p>
                  {option[subtitleKey] && (
                    <p className="text-[10px] text-slate-400">{option[subtitleKey]}</p>
                  )}
                </div>
              </button>
            ))
          ) : (
            /* Empty state */
            <div className="px-4 py-4 text-center flex flex-col items-center justify-center text-slate-400 gap-1">
              <Search size={16} />
              <span className="text-xs">{emptyMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Step3_InstitutionalDetails — Step 3 of SignUp_Wizard (Institutional Details)
// Purely presentational: all state lives in SignUp_Wizard and is passed as props.
// API wiring (getPublicLocations + getPublicGroups) lives here via useEffect hooks.
// Requirements: 4.1–4.14, 5.7, 5.8
// ============================================================================
function Step3_InstitutionalDetails({
  orgInput, setOrgInput,
  locationId, setLocationId,
  locationsList, setLocationsList,
  locationsError, setLocationsError,
  userType, setUserType,
  groupInput, setGroupInput,
  groupId, setGroupId,
  communityGroups, setCommunityGroups,
  groupsError, setGroupsError,
  yearLevel, setYearLevel,
  tcChecked, setTcChecked,
  ppChecked, setPpChecked,
  touched, setTouched,
  step3Valid,
  isSubmitting,
  submitError,
  onSubmit,
  onBack,
  onOpenTC,
  onOpenPP,
}) {
  // ── Task 5.2: Fetch locations once on first mount ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchLocations = async () => {
      try {
        const data = await authApi.getPublicLocations();
        if (!cancelled) setLocationsList(data);
      } catch {
        if (!cancelled) setLocationsError('Could not load institutions. ');
      }
    };
    fetchLocations();
    return () => { cancelled = true; };
  }, []); // empty deps — fires once on first mount of Step3

  // Retry affordance for locations
  const retryLoadLocations = () => {
    setLocationsError('');
    let cancelled = false;
    const fetchLocations = async () => {
      try {
        const data = await authApi.getPublicLocations();
        if (!cancelled) setLocationsList(data);
      } catch {
        if (!cancelled) setLocationsError('Could not load institutions. ');
      }
    };
    fetchLocations();
    return () => { cancelled = true; };
  };

  // ── Task 5.3: Fetch groups when locationId changes ─────────────────────────
  useEffect(() => {
    if (locationId === null) return;
    let cancelled = false;
    setGroupsError('');
    const fetchGroups = async () => {
      try {
        const data = await authApi.getPublicGroups(locationId);
        if (!cancelled) setCommunityGroups(data);
      } catch {
        if (!cancelled) setGroupsError('Could not load groups. ');
      }
    };
    fetchGroups();
    return () => { cancelled = true; };
  }, [locationId]);

  // Retry affordance for groups
  const retryLoadGroups = () => {
    if (locationId === null) return;
    setGroupsError('');
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        const data = await authApi.getPublicGroups(locationId);
        if (!cancelled) setCommunityGroups(data);
      } catch {
        if (!cancelled) setGroupsError('Could not load groups. ');
      }
    };
    fetchGroups();
    return () => { cancelled = true; };
  };

  // ── Derive org-type-aware user type list ────────────────────────────────────
  // Mirrors the USER_TYPES_MAP from the admin edit-user modal so both
  // the sign-up form and admin panel enforce the same constraints.
  const USER_TYPES_MAP = {
    University: ['Student', 'Alumni', 'Faculty', 'Staff'],
    Community:  ['Resident', 'Community Official', 'Community Worker', 'Business Owner'],
    Corporate:  ['Employee', 'Manager', 'Executive', 'Contractor', 'Guest'],
  };

  const selectedLocation = locationsList.find(l => l.id === locationId) || null;
  const orgType = selectedLocation?.orgType || null;
  const isUniversity = orgType?.toLowerCase() === 'university';

  const availableUserTypes = (() => {
    if (!orgType) return [];
    const key = Object.keys(USER_TYPES_MAP).find(k => k.toLowerCase() === orgType.toLowerCase());
    return key ? USER_TYPES_MAP[key] : [];
  })();

  // Reset userType + downstream when org changes and current type is no longer valid
  useEffect(() => {
    if (!userType) return;
    if (availableUserTypes.length === 0) return;
    const lc = userType.toLowerCase();
    const valid = availableUserTypes.some(t => t.toLowerCase() === lc);
    if (!valid) {
      setUserType('');
      setYearLevel('');
      setGroupInput('');
      setGroupId(null);
    }
  }, [orgType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Year level logic (mirrors admin modal) ──────────────────────────────────
  const YEAR_MAP = {
    Kindergarten: [],
    Elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    SHS: ['Grade 11', 'Grade 12'],
    College: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
  };

  // University alumni/faculty/staff → auto-assigned on backend, skip group picker
  const NON_STUDENT_AUTO = new Set(['alumni', 'faculty', 'staff']);
  const userTypeLc = userType?.toLowerCase() || '';
  const isStudent = userTypeLc === 'student';
  const showGroupPicker = (() => {
    if (!userType) return false;
    if (isUniversity && NON_STUDENT_AUTO.has(userTypeLc)) return false;
    return true;
  })();

  const selectedGroup = communityGroups.find(g => g.id === groupId) || null;
  const yearOptions = (isUniversity && isStudent && selectedGroup?.educationalLevel)
    ? (YEAR_MAP[selectedGroup.educationalLevel] || [])
    : [];
  const showYearLevel = yearOptions.length > 0;

  // Convert year options to the shape FloatingSearchableDropdown expects
  const yearLevelOptions = yearOptions.map((y, i) => ({ id: i + 1, name: y, abbreviation: '' }));

  return (
    <div className="w-full space-y-1">
      {/* Organization — FloatingSearchableDropdown */}
      <FloatingSearchableDropdown
        id="signup-org"
        label="Organization"
        icon={<Building2 size={18} />}
        value={orgInput}
        onChange={(text) => {
          setOrgInput(text);
          if (!text) { setLocationId(null); setGroupInput(''); setGroupId(null); setUserType(''); setYearLevel(''); }
        }}
        onClear={() => { setLocationId(null); setGroupInput(''); setGroupId(null); setUserType(''); setYearLevel(''); }}
        options={locationsList}
        onSelect={(opt) => {
          setOrgInput(opt.name);
          setLocationId(opt.id);
          setGroupInput('');
          setGroupId(null);
          setUserType('');
          setYearLevel('');
          setTouched(t => ({ ...t, orgInput: true }));
        }}
        searchKey="name"
        displayKey="name"
        subtitleKey="abbreviation"
        emptyMessage="No institutions found"
        error={touched.orgInput && !locationId}
        onBlur={() => setTouched(t => ({ ...t, orgInput: true }))}
        disabled={isSubmitting}
        direction="down"
      />
      {touched.orgInput && !locationId && (
        <p className="text-xs text-rose-500 pl-3 mt-1">Please select a valid organization.</p>
      )}
      {locationsError && (
        <p className="text-xs text-rose-500 pl-3">
          {locationsError}
          <button type="button" className="underline ml-1 cursor-pointer" onClick={retryLoadLocations}>Retry</button>
        </p>
      )}

      {/* User Type — shown only once an org is selected */}
      {locationId && availableUserTypes.length > 0 && (
        <FloatingSelectField
          id="signup-usertype"
          label="User Type"
          icon={<Users size={18} />}
          value={userType}
          onChange={(v) => {
            setUserType(v);
            setYearLevel('');
            setGroupInput('');
            setGroupId(null);
          }}
          options={availableUserTypes}
          onBlur={() => setTouched(t => ({ ...t, userType: true }))}
          error={touched.userType && !userType}
          disabled={isSubmitting}
        />
      )}

      {/* Community Group — shown based on org type + user type rules */}
      {locationId && userType && showGroupPicker && (
        <FloatingSearchableDropdown
          id="signup-group"
          label="Community Group"
          icon={<Users size={18} />}
          value={groupInput}
          onChange={setGroupInput}
          onClear={() => { setGroupId(null); setYearLevel(''); }}
          options={communityGroups}
          onSelect={(opt) => {
            setGroupInput(opt.name);
            setGroupId(opt.id);
            setYearLevel('');
            setTouched(t => ({ ...t, groupInput: true }));
          }}
          searchKey="name"
          displayKey="name"
          subtitleKey="abbreviation"
          emptyMessage="No groups found"
          disabled={!locationId || isSubmitting}
          error={touched.groupInput && !groupId}
          onBlur={() => setTouched(t => ({ ...t, groupInput: true }))}
        />
      )}
      {groupsError && (
        <p className="text-xs text-rose-500 pl-3">
          {groupsError}
          <button
            type="button"
            className="underline ml-1"
            onClick={retryLoadGroups}
          >
            Retry
          </button>
        </p>
      )}

      {/* Year Level — shown only for university students whose group has an educational level */}
      {showYearLevel && (
        <>
          <FloatingSearchableDropdown
            id="signup-yearlevel"
            label="Year / Grade Level"
            icon={<BookOpen size={18} />}
            value={yearLevel}
            onChange={setYearLevel}
            onClear={() => setYearLevel('')}
            options={yearLevelOptions}
            onSelect={(opt) => {
              setYearLevel(opt.name);
              setTouched(t => ({ ...t, yearLevel: true }));
            }}
            searchKey="name"
            displayKey="name"
            subtitleKey="abbreviation"
            emptyMessage="No year levels found"
            error={touched.yearLevel && !yearLevel.trim()}
            onBlur={() => setTouched(t => ({ ...t, yearLevel: true }))}
            disabled={isSubmitting}
          />
          {touched.yearLevel && !yearLevel.trim() && (
            <p className="text-xs text-rose-500 pl-3">
              Year Level is required.
            </p>
          )}
        </>
      )}

      {/* Single combined agreement checkbox */}
      <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer mt-3">
        <input
          type="checkbox"
          checked={tcChecked && ppChecked}
          onChange={(e) => { setTcChecked(e.target.checked); setPpChecked(e.target.checked); }}
          disabled={isSubmitting}
          className="mt-0.5 accent-emerald-600 flex-shrink-0 cursor-pointer"
        />
        <span>
          I acknowledge that I have read, understand, and agree to the{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onOpenTC(); }}
            className="text-emerald-600 underline hover:text-emerald-700 cursor-pointer"
          >
            Terms &amp; Conditions
          </button>
          {' '}and{' '}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onOpenPP(); }}
            className="text-emerald-600 underline hover:text-emerald-700 cursor-pointer"
          >
            Privacy Policy
          </button>
          .
        </span>
      </label>

      {/* Submit error */}
      {submitError && (
        <p className="text-xs text-rose-500 text-center font-medium mt-2">
          {submitError}
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium
            hover:bg-slate-50 transition-all flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          disabled={!step3Valid || isSubmitting}
          onClick={onSubmit}
          className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold
            hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
            : 'Create Account'
          }
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SignUp_Wizard — top-level 3-step sign-up orchestrator.
// Owns all wizard state and derived values; delegates rendering to the three
// Step sub-components. Defined as a named function (not exported).
// Requirements: 1.1, 1.3, 1.4, 2.8, 3.7, 4.1, 5.1–5.8
// ============================================================================
function SignUp_Wizard({ onSwitchToSignIn, onSaveSnapshot, savedSnapshot, onSnapshotConsumed, onAccountCreated }) {
  // ── Navigation ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── Step 1 — Account Credentials ───────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Step 2 — Personal Details ───────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // ── Step 3 — Institutional Details ─────────────────────────────────────────
  const [orgInput, setOrgInput] = useState('');
  const [locationId, setLocationId] = useState(null);
  const [locationsList, setLocationsList] = useState([]);
  const [locationsError, setLocationsError] = useState('');
  const [userType, setUserType] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [groupsError, setGroupsError] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [tcChecked, setTcChecked] = useState(false);
  const [ppChecked, setPpChecked] = useState(false);

  // ── Touched state — becomes true on first onBlur ────────────────────────────
  const [touched, setTouched] = useState({
    email: false, username: false, password: false, confirmPassword: false,
    firstName: false, middleName: false, lastName: false, phone: false,
    orgInput: false, userType: false, groupInput: false, yearLevel: false,
  });

  // ── Submission ───────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [showTCModal, setShowTCModal] = useState(false);
  const [showPPModal, setShowPPModal] = useState(false);

  // ── Restore snapshot when parent passes one in ──────────────────────────────
  useEffect(() => {
    if (!savedSnapshot) return;
    setStep(savedSnapshot.step ?? 1);
    setEmail(savedSnapshot.email ?? '');
    setUsername(savedSnapshot.username ?? '');
    setPassword(savedSnapshot.password ?? '');
    setConfirmPassword(savedSnapshot.confirmPassword ?? '');
    setFirstName(savedSnapshot.firstName ?? '');
    setMiddleName(savedSnapshot.middleName ?? '');
    setLastName(savedSnapshot.lastName ?? '');
    setPhone(savedSnapshot.phone ?? '');
    setOrgInput(savedSnapshot.orgInput ?? '');
    setLocationId(savedSnapshot.locationId ?? null);
    setUserType(savedSnapshot.userType ?? '');
    setGroupInput(savedSnapshot.groupInput ?? '');
    setGroupId(savedSnapshot.groupId ?? null);
    setYearLevel(savedSnapshot.yearLevel ?? '');
    setTcChecked(savedSnapshot.tcChecked ?? false);
    setPpChecked(savedSnapshot.ppChecked ?? false);
    onSnapshotConsumed?.();
  }, [savedSnapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived validation values ────────────────────────────────────────────────
  const emailValid    = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
  const usernameValid = /^[a-zA-Z0-9._]{3,30}$/.test(username);
  const passwordRules = {
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    hasUpper:  /[A-Z]/.test(password),
    hasLower:  /[a-z]/.test(password),
    hasDigit:  /[0-9]/.test(password),
    noSpace:   !/\s/.test(password),
  };
  const passwordValid     = Object.values(passwordRules).every(Boolean);
  const confirmMatchValid = confirmPassword.length > 0 && confirmPassword === password;

  const nameRegex      = /^[a-zA-Z\s\-']{1,50}$/;
  const firstNameValid = nameRegex.test(firstName);
  const lastNameValid  = nameRegex.test(lastName);
  // Phone is optional — only validate format if the user typed something
  const phoneValid     = phone.length === 0 || /^9\d{9}$/.test(phone);

  const step1Valid = emailValid && usernameValid && passwordValid && confirmMatchValid;
  // Phone no longer gates step 2 — it's optional
  const step2Valid = firstNameValid && lastNameValid && phoneValid;

  // Derive org-type for step3 validation (mirrors Step3_InstitutionalDetails logic)
  const _selectedLoc = locationsList.find(l => l.id === locationId) || null;
  const _orgType = _selectedLoc?.orgType?.toLowerCase() || null;
  const _isUniversity = _orgType === 'university';
  const _NON_STUDENT_AUTO = new Set(['alumni', 'faculty', 'staff']);
  const _userTypeLc = userType?.toLowerCase() || '';
  const _autoAssigned = _isUniversity && _NON_STUDENT_AUTO.has(_userTypeLc);
  // University students need a group AND year level (if their group has one);
  // non-auto-assigned non-university users always need a group.
  // University alumni/faculty/staff are auto-assigned — no group needed.
  const step3Valid =
    locationId !== null &&
    userType !== '' &&
    tcChecked &&
    ppChecked &&
    (_autoAssigned || groupId !== null);

  const showMatchIndicator = password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch     = password === confirmPassword;

  // ── Payload builder ──────────────────────────────────────────────────────────
  // toTitleCase: capitalises the first letter of every word regardless of input casing
  const toTitleCase = (str) =>
    str.trim().replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const buildPayload = () => {
    const fn = toTitleCase(firstName);
    const mn = middleName.trim() ? toTitleCase(middleName) : undefined;
    const ln = toTitleCase(lastName);
    return {
      firstName: fn,
      middleName: mn,
      lastName: ln,
      name: `${fn}${mn ? ' ' + mn : ''} ${ln}`.trim(),
      username,
      email,
      phone: phone.trim() ? `+63${phone}` : undefined,
      password,
      userType: userType.toLowerCase().replace(/ /g, '_'),
      locationId,
      groupId: groupId ?? undefined,
      yearLevel: (userType === 'Student' && yearLevel.trim()) ? yearLevel.trim() : undefined,
    };
  };

  // ── captureSnapshot — called by LogIn before closing to persist state ────────
  const captureSnapshot = () => {
    const hasAnyData = email || username || password || firstName || lastName ||
      orgInput || groupInput || yearLevel || phone || userType || locationId;
    if (!hasAnyData) return null;
    return {
      step, email, username, password, confirmPassword,
      firstName, middleName, lastName, phone,
      orgInput, locationId, userType, groupInput, groupId, yearLevel,
      tcChecked, ppChecked,
    };
  };

  // Expose captureSnapshot via the ref passed from LogIn
  useEffect(() => {
    if (onSaveSnapshot && typeof onSaveSnapshot === 'object' && 'current' in onSaveSnapshot) {
      onSaveSnapshot.current = captureSnapshot;
    }
  }); // run every render so the closure is always fresh

  // Also auto-save to sessionStorage on every meaningful change so
  // switching to the login side (which unmounts the wizard) preserves state.
  useEffect(() => {
    const snap = captureSnapshot();
    if (snap) {
      try { sessionStorage.setItem('signupSnapshot', JSON.stringify(snap)); } catch {}
    }
  }); // run every render — cheap and keeps sessionStorage in sync

  // ── handleSubmit — Task 7.2 ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await authApi.register(buildPayload());
      // Reset all fields on success
      setStep(1);
      setEmail(''); setUsername(''); setPassword(''); setConfirmPassword('');
      setFirstName(''); setMiddleName(''); setLastName(''); setPhone('');
      setOrgInput(''); setLocationId(null); setLocationsList([]); setLocationsError('');
      setUserType(''); setGroupInput(''); setGroupId(null); setCommunityGroups([]); setGroupsError('');
      setYearLevel(''); setTcChecked(false); setPpChecked(false);
      setTouched({
        email: false, username: false, password: false, confirmPassword: false,
        firstName: false, middleName: false, lastName: false, phone: false,
        orgInput: false, userType: false, groupInput: false, yearLevel: false,
      });
      setIsSubmitting(false);
      try { sessionStorage.removeItem('signupSnapshot'); } catch {}
      onAccountCreated?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.body?.error ||
        err?.message ||
        'Registration failed. Please try again.';
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center">
      {/* Header — mirrors the login side's "Welcome Back" block */}
      <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Create Account</h1>
      <p className="text-gray-400 text-xs mb-4">Join the EcoPoints community today</p>

      <Progress_Bar currentStep={step} />

      {step === 1 && (
        <Step1_AccountCredentials
          email={email} setEmail={setEmail}
          username={username} setUsername={setUsername}
          password={password} setPassword={setPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
          touched={touched} setTouched={setTouched}
          passwordRules={passwordRules}
          showMatchIndicator={showMatchIndicator} passwordsMatch={passwordsMatch}
          step1Valid={step1Valid}
          onNext={() => setStep(2)}
          onSwitchToSignIn={onSwitchToSignIn}
        />
      )}

      {step === 2 && (
        <Step2_PersonalDetails
          firstName={firstName} setFirstName={setFirstName}
          middleName={middleName} setMiddleName={setMiddleName}
          lastName={lastName} setLastName={setLastName}
          phone={phone} setPhone={setPhone}
          touched={touched} setTouched={setTouched}
          firstNameValid={firstNameValid}
          lastNameValid={lastNameValid}
          phoneValid={phoneValid}
          step2Valid={step2Valid}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3_InstitutionalDetails
          orgInput={orgInput} setOrgInput={setOrgInput}
          locationId={locationId} setLocationId={setLocationId}
          locationsList={locationsList} setLocationsList={setLocationsList}
          locationsError={locationsError} setLocationsError={setLocationsError}
          userType={userType} setUserType={setUserType}
          groupInput={groupInput} setGroupInput={setGroupInput}
          groupId={groupId} setGroupId={setGroupId}
          communityGroups={communityGroups} setCommunityGroups={setCommunityGroups}
          groupsError={groupsError} setGroupsError={setGroupsError}
          yearLevel={yearLevel} setYearLevel={setYearLevel}
          tcChecked={tcChecked} setTcChecked={setTcChecked}
          ppChecked={ppChecked} setPpChecked={setPpChecked}
          touched={touched} setTouched={setTouched}
          step3Valid={step3Valid}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={handleSubmit}
          onBack={() => setStep(2)}
          onOpenTC={() => setShowTCModal(true)}
          onOpenPP={() => setShowPPModal(true)}
        />
      )}

      {showTCModal && <TC_Modal onClose={() => setShowTCModal(false)} />}
      {showPPModal && <PP_Modal onClose={() => setShowPPModal(false)} />}
    </div>
  );
}

// ============================================================================
// RestoreDialog — Save/Restore overlay (Task 9.2)
// Shown when the user returns to Sign Up mode and a saved wizard snapshot exists.
// Two actions: "Start Fresh" (discard snapshot) and "Restore" (repopulate wizard).
// Clicking the backdrop behaves as "Start Fresh" per Requirements 6.5.
// Requirements: 6.2, 6.3, 6.4, 6.5
// ============================================================================
function RestoreDialog({ onRestore, onStartFresh }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onStartFresh}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800 mb-1">
            Continue where you left off?
          </h2>
          <p className="text-sm text-slate-500">
            You have a saved sign-up in progress.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onStartFresh}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium
              hover:bg-slate-50 transition-all"
          >
            Start Fresh
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-bold
              hover:bg-emerald-700 transition-all"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [communityGroupId, setCommunityGroupId] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // CAPTCHA states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [showCaptchaPopup, setShowCaptchaPopup] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  // Password mismatch shake
  const [passwordMismatchShake, setPasswordMismatchShake] = useState(false);

  // Saved signup data for restore functionality (legacy — wizard fields stored in LogIn state)
  const [savedSignUpData, setSavedSignUpData] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState(false);

  // ── Task 9.1: New wizard snapshot (SignUp_Wizard-owned fields) ───────────
  // savedSnapshot holds a SignUpSnapshot captured by SignUp_Wizard via onSaveSnapshot.
  // showSignUpRestoreDialog controls the new RestoreDialog overlay (emerald theme).
  // On mount, restore any snapshot from sessionStorage (persists across close/reopen).
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    try {
      const raw = sessionStorage.getItem('signupSnapshot');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [showSignUpRestoreDialog, setShowSignUpRestoreDialog] = useState(false);
  const captureWizardSnapshot = useRef(null);
  const [showAccountCreated, setShowAccountCreated] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=newPassword, 4=success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotResetToken, setForgotResetToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [showForgotNewPw, setShowForgotNewPw] = useState(false);
  const [showForgotConfirmPw, setShowForgotConfirmPw] = useState(false);

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

  // Forgot password OTP countdown timer
  useEffect(() => {
    if (forgotCountdown <= 0) return;
    const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [forgotCountdown]);

  // Forgot password handlers
  const handleForgotSendOtp = async () => {
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address'); return; }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.forgotPassword(forgotEmail.trim());
      setForgotStep(2);
      setForgotCountdown(300); // 5 minutes
      setForgotSuccess('If an account with that email exists, a reset code has been sent.');
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset code');
    }
    setForgotLoading(false);
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp.trim()) { setForgotError('Please enter the verification code'); return; }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const result = await authApi.verifyResetOtp(forgotEmail.trim(), forgotOtp.trim());
      setForgotResetToken(result.resetToken);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.error || err.message || 'Invalid or expired code');
    }
    setForgotLoading(false);
  };

  const handleForgotResetPassword = async () => {
    if (!forgotNewPassword) { setForgotError('Please enter a new password'); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { setForgotError('Passwords do not match'); return; }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.resetPassword(forgotResetToken, forgotNewPassword);
      setForgotStep(4);
    } catch (err) {
      setForgotError(err.error || err.message || 'Failed to reset password');
    }
    setForgotLoading(false);
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setForgotResetToken('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccess('');
    setForgotCountdown(0);
  };

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
      communityGroupId ||
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
    setCommunityGroupId("");
    setGroupSearch("");
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
      communityGroupId,
      groupSearch,
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
    setCommunityGroupId(data.communityGroupId || "");
    setGroupSearch(data.groupSearch || "");
    setYearLevel(data.yearLevel || "");
    setSignUpPhase(data.signUpPhase || 1);
  };

  const toggleMode = () => {
    if (isExpanding) return;

    // If switching FROM signup TO login and has signup data, save it (legacy wizard)
    if (isSignUp && hasSignUpData()) {
      setSavedSignUpData(saveSignUpData());
    }

    // If switching FROM login TO signup and has saved data, ask to restore (legacy)
    if (!isSignUp && savedSignUpData) {
      setPendingModeSwitch(true);
      setShowRestoreDialog(true);
      return;
    }

    // Task 9.1/9.2: If switching FROM login TO signup and a wizard snapshot exists,
    // show the new RestoreDialog instead of performing the switch immediately.
    if (!isSignUp && savedSnapshot !== null) {
      setIsExpanding(true);
      setTimeout(() => {
        setIsSignUp(true);
        setError('');
        resetLoginForm();
        setTimeout(() => {
          setIsExpanding(false);
          setShowSignUpRestoreDialog(true);
        }, 100);
      }, 800);
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
      setCaptchaToken(value);
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
      const data = await login(loginCredential, loginPassword, captchaToken);
      setFailedAttempts(0);
      setShowCaptcha(false);
      setShowCaptchaPopup(false);

      const role = data?.user?.role;

      // Close the modal before navigating — it's rendered globally
      // via UIContext, so route changes alone won't unmount it.
      if (onClose) onClose();

      if (ADMIN_ROLES.has(role)) {
        router.push("/admin");
      } else {
        router.push("/rewards");
      }
    } catch (err) {
      setFailedAttempts((prev) => prev + 1);
      setError("Invalid credentials. Please try again.");

      // Reset CAPTCHA for next attempt
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaVerified(false);
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpPhase1 = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters!");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one digit.");
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
      // Backend auto-assigns default group for university non-students
      // (alumni/faculty/staff). Students send the selected group.
      await authApi.register({
        firstName,
        middleName: middleName || undefined,
        lastName,
        name: `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`.trim(),
        username: signUpUsername || undefined,
        email: email || undefined,
        phone: phone ? `+63${phone}` : undefined,
        password,
        userType: role.toLowerCase().replace(/ /g, '_'),
        locationId: parseInt(locationId),
        groupId: communityGroupId ? parseInt(communityGroupId) : undefined,
        yearLevel: yearLevel || undefined,
      });

      setIsLoading(false);
      alert("Account created successfully! Please sign in.");
      resetAllFields();
      setIsSignUp(false);
    } catch (err) {
      setIsLoading(false);
      // err.body.error may be a plain string (server returns {success:false, error:"..."}),
      // while err.message falls back to the HTTP status text (e.g. "BAD REQUEST").
      // Prefer the plain-string body error over the generic status text.
      const bodyError = err.body?.error;
      const displayMsg =
        (typeof bodyError === 'string' ? bodyError : null) ||
        err.message ||
        "Registration failed. Please try again.";
      setError(displayMsg);
    }
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    // Save wizard state before closing so it can be restored on next open
    if (isSignUp && captureWizardSnapshot.current) {
      const snap = captureWizardSnapshot.current();
      if (snap) {
        setSavedSnapshot(snap);
        try { sessionStorage.setItem('signupSnapshot', JSON.stringify(snap)); } catch {}
      }
    }
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
    setCommunityGroupId("");
    setGroupSearch("");
    setYearLevel("");
    setError("");
    setSignUpPhase(1);
  };

  // Reset group + year when role changes (cascade root)
  useEffect(() => {
    setCommunityGroupId("");
    setGroupSearch("");
    setYearLevel("");
  }, [role]);

  // Reset year level when the selected group changes
  useEffect(() => {
    setYearLevel("");
  }, [communityGroupId]);




  // Force remove dark/neutral theme class from <html> when login is mounted
  // This prevents dark-themed form fields after admin signout
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'neutral', 'system');
    if (!html.classList.contains('light')) html.classList.add('light');
  }, []);

  // When modal opens in sign-up mode with a saved snapshot, prompt to restore
  useEffect(() => {
    if (isSignUp && savedSnapshot !== null && !showSignUpRestoreDialog) {
      setShowSignUpRestoreDialog(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When the user slides back to sign-up and there's a snapshot, show restore dialog
  useEffect(() => {
    if (isSignUp && savedSnapshot !== null && !showSignUpRestoreDialog) {
      setShowSignUpRestoreDialog(true);
    }
  }, [isSignUp]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Task 9.2: New wizard RestoreDialog — shown when returning to Sign Up with a saved snapshot */}
      {showSignUpRestoreDialog && savedSnapshot !== null && (
        <RestoreDialog
          onRestore={() => {
            // Restore: keep savedSnapshot so SignUp_Wizard can consume it (Task 10.1 wires the prop).
            // Closing the dialog without clearing the snapshot lets the wizard pick it up.
            setShowSignUpRestoreDialog(false);
          }}
          onStartFresh={() => {
            // Start Fresh: discard snapshot so wizard initialises with empty state.
            setSavedSnapshot(null);
            setShowSignUpRestoreDialog(false);
          }}
        />
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
                      (process.env.NODE_ENV !== 'production'
                        ? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
                        : undefined)
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

      {/* Account Created — portalled to document.body so it escapes all stacking contexts */}
      {showAccountCreated && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full flex flex-col items-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 text-center">Account Created!</h2>
            <p className="text-sm text-slate-500 text-center">Your account has been successfully created. You can now sign in.</p>
            <button
              type="button"
              onClick={() => {
                setShowAccountCreated(false);
                if (!isExpanding) {
                  setIsExpanding(true);
                  setTimeout(() => {
                    setIsSignUp(false);
                    setError('');
                    resetLoginForm();
                    setTimeout(() => setIsExpanding(false), 100);
                  }, 800);
                }
              }}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              Sign In Now
            </button>
          </div>
        </div>,
        document.body
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

            <form onSubmit={handleLogin} className="w-full space-y-3 mt-1">
              {/* Username or Email Field */}
              <FloatingInputField
                id="login-credential"
                type="text"
                label="Username or Email"
                icon={<Mail size={18} />}
                value={loginCredential}
                onChange={(e) => { setLoginCredential(e.target.value.replace(/\s/g, "")); setError(""); }}
                required
              />

              {/* Password Field */}
              <FloatingInputField
                id="login-password"
                type="password"
                label="Password"
                icon={<Lock size={18} />}
                value={loginPassword}
                onChange={(e) => { setLoginPassword(e.target.value.replace(/\s/g, "")); setError(""); }}
                required
              />

              {/* Error message — always shown below password, above Verified */}
              {error && !isSignUp && (
                <p className={`text-xs text-red-500 text-center font-medium ${passwordMismatchShake ? "animate-shake" : ""}`}>
                  {error}
                </p>
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
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setForgotEmail(''); setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                  className="text-xs text-gray-500 hover:text-lime-600 transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Forgot your password?
                </button>
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

            {/* ═══ FORGOT PASSWORD OVERLAY ═══ */}
            {showForgotPassword && (
              <div className="absolute inset-0 bg-white z-30 flex flex-col items-center justify-center px-6 sm:px-10 animate-fadeIn">
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Step 1: Email Input */}
                {forgotStep === 1 && (
                  <div className="w-full max-w-xs space-y-4">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-lime-50 border-2 border-lime-200 flex items-center justify-center">
                        <KeyRound size={24} className="text-lime-600" />
                      </div>
                      <h2 className="text-xl font-extrabold text-gray-800">Reset Password</h2>
                      <p className="text-xs text-gray-400 mt-1">Enter your email to receive a verification code</p>
                    </div>
                    {forgotError && (
                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                        <AlertCircle size={14} /><span>{forgotError}</span>
                      </div>
                    )}
                    <div className="relative flex items-center w-full h-12 border-b border-gray-300 focus-within:border-lime-500 transition-colors">
                      <Mail size={16} className="mr-3 text-gray-400" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotSendOtp()}
                        className="w-full h-full bg-transparent text-gray-800 outline-none text-sm placeholder-gray-400"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotSendOtp}
                      disabled={forgotLoading || !forgotEmail.trim()}
                      className="w-full py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg hover:bg-lime-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {forgotLoading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Send Reset Code <ArrowRight size={16} /></>}
                    </button>
                    <button type="button" onClick={closeForgotPassword}
                      className="w-full text-xs text-gray-500 hover:text-lime-600 transition-colors flex items-center justify-center gap-1 mt-2">
                      <ArrowLeft size={14} /> Back to Sign In
                    </button>
                  </div>
                )}

                {/* Step 2: OTP Verification */}
                {forgotStep === 2 && (
                  <div className="w-full max-w-xs space-y-4">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                        <Mail size={24} className="text-blue-600" />
                      </div>
                      <h2 className="text-xl font-extrabold text-gray-800">Check Your Email</h2>
                      <p className="text-xs text-gray-400 mt-1">
                        Enter the 6-digit code sent to <span className="font-semibold text-gray-600">{forgotEmail}</span>
                      </p>
                    </div>
                    {forgotSuccess && (
                      <div className="p-2 rounded-lg bg-lime-50 border border-lime-200 text-lime-700 text-xs text-center font-medium flex items-center justify-center gap-1">
                        <CheckCircle size={14} /><span>{forgotSuccess}</span>
                      </div>
                    )}
                    {forgotError && (
                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                        <AlertCircle size={14} /><span>{forgotError}</span>
                      </div>
                    )}
                    <div className="relative flex items-center w-full h-12 border-b border-gray-300 focus-within:border-lime-500 transition-colors">
                      <KeyRound size={16} className="mr-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="000000"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={(e) => e.key === 'Enter' && forgotOtp.length === 6 && handleForgotVerifyOtp()}
                        maxLength={6}
                        className="w-full h-full bg-transparent text-gray-800 outline-none text-sm tracking-[0.5em] text-center font-bold placeholder-gray-300"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {forgotCountdown > 0
                          ? `Code expires in ${Math.floor(forgotCountdown / 60)}:${String(forgotCountdown % 60).padStart(2, '0')}`
                          : 'Code expired'
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() => { setForgotOtp(''); setForgotError(''); handleForgotSendOtp(); }}
                        disabled={forgotLoading || forgotCountdown > 240}
                        className="text-lime-600 hover:text-lime-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Resend Code
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotVerifyOtp}
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      className="w-full py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg hover:bg-lime-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {forgotLoading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : <>Verify Code <ArrowRight size={16} /></>}
                    </button>
                    <button type="button" onClick={() => { setForgotStep(1); setForgotError(''); setForgotSuccess(''); }}
                      className="w-full text-xs text-gray-500 hover:text-lime-600 transition-colors flex items-center justify-center gap-1">
                      <ArrowLeft size={14} /> Change Email
                    </button>
                  </div>
                )}

                {/* Step 3: New Password */}
                {forgotStep === 3 && (
                  <div className="w-full max-w-xs space-y-4">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                        <Lock size={24} className="text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-extrabold text-gray-800">New Password</h2>
                      <p className="text-xs text-gray-400 mt-1">Create a strong password for your account</p>
                    </div>
                    {forgotError && (
                      <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center font-medium flex items-center justify-center gap-1">
                        <AlertCircle size={14} /><span>{forgotError}</span>
                      </div>
                    )}
                    <div className="relative flex items-center w-full h-12 border-b border-gray-300 focus-within:border-lime-500 transition-colors">
                      <Lock size={16} className="mr-3 text-gray-400" />
                      <input
                        type={showForgotNewPw ? 'text' : 'password'}
                        placeholder="New password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full h-full bg-transparent text-gray-800 outline-none text-sm placeholder-gray-400"
                        autoFocus
                      />
                      <button type="button" onClick={() => setShowForgotNewPw(!showForgotNewPw)}
                        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showForgotNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {forgotNewPassword && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[
                            forgotNewPassword.length >= 8,
                            /[A-Z]/.test(forgotNewPassword),
                            /[a-z]/.test(forgotNewPassword),
                            /\d/.test(forgotNewPassword),
                            /[!@#$%^&*(),.?":{}|<>]/.test(forgotNewPassword),
                          ].map((met, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${met ? 'bg-lime-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400">Min 8 chars, uppercase, lowercase, number, special character</p>
                      </div>
                    )}
                    <div className="relative flex items-center w-full h-12 border-b border-gray-300 focus-within:border-lime-500 transition-colors">
                      <Lock size={16} className="mr-3 text-gray-400" />
                      <input
                        type={showForgotConfirmPw ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleForgotResetPassword()}
                        className="w-full h-full bg-transparent text-gray-800 outline-none text-sm placeholder-gray-400"
                      />
                      <button type="button" onClick={() => setShowForgotConfirmPw(!showForgotConfirmPw)}
                        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showForgotConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {forgotConfirmPassword && forgotNewPassword !== forgotConfirmPassword && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>
                    )}
                    <button
                      type="button"
                      onClick={handleForgotResetPassword}
                      disabled={forgotLoading || !forgotNewPassword || forgotNewPassword !== forgotConfirmPassword}
                      className="w-full py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg hover:bg-lime-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {forgotLoading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
                    </button>
                  </div>
                )}

                {/* Step 4: Success */}
                {forgotStep === 4 && (
                  <div className="w-full max-w-xs space-y-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                      <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-800">Password Reset!</h2>
                    <p className="text-sm text-gray-500">Your password has been successfully reset. You can now sign in with your new password.</p>
                    <button
                      type="button"
                      onClick={closeForgotPassword}
                      className="w-full py-2.5 bg-lime-600 text-white rounded-lg font-bold shadow-lg hover:bg-lime-700 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    >
                      <ArrowLeft size={16} /> Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT SIDE: SIGN UP FORM (SignUp_Wizard, Task 10.1) --- */}
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
            {/* Task 10.1: Mount SignUp_Wizard only when isSignUp is true.
                This prevents the wizard from interfering with the Sign In form
                layout, tab order, or form submission when in login mode.
                Requirements: 7.4, 7.5 */}
            {isSignUp && (
              <SignUp_Wizard
                onSwitchToSignIn={() => {
                  // Mirror the existing toggleMode logic: guard the isExpanding
                  // re-entry check, then perform the animated mode switch.
                  if (isExpanding) return;
                  setIsExpanding(true);
                  setTimeout(() => {
                    setIsSignUp(false);
                    setError('');
                    resetLoginForm();
                    setTimeout(() => {
                      setIsExpanding(false);
                    }, 100);
                  }, 800);
                }}
                onSaveSnapshot={captureWizardSnapshot}
                savedSnapshot={savedSnapshot}
                onSnapshotConsumed={() => {
                  setSavedSnapshot(null);
                  try { sessionStorage.removeItem('signupSnapshot'); } catch {}
                }}
                onAccountCreated={() => setShowAccountCreated(true)}
              />
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
