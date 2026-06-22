// user client
// Profile section

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import { QRCodeCanvas } from "qrcode.react";
import {
  AwardIcon,
  FlameIcon,
  Ticket,
  PencilIcon,
  QrCodeIcon,
  UserIcon,
  XIcon,
  DownloadIcon,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  Edit2,
  Hash,
  Building2,
  Users,
  Mail,
  Info,
  AlertTriangle,
  Trash2,
  ZoomIn,
  CheckCircle,
  Trophy,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  ScrollText,
  Leaf,
} from "lucide-react";
import RecentActivity from "./RecentActivity";
import ProfileHeatmap from "./ProfileHeatmap";
import { useAuth } from "../../context/AuthContext";
import HowItWorksModal from "../shared/HowItWorksModal";
import { auth as authApi, rewards as rewardsApi } from "../../services/api";


// ─────────────────────────────────────────────
// Font styles (consistent across all pages)
// ─────────────────────────────────────────────
const fonts = {
  heading: { fontFamily: "'Fredoka'" },
  body: { fontFamily: "'Quicksand'" },
  data: { fontFamily: "'Space Mono'" },
};

// ─────────────────────────────────────────────
// Branded QR card layout 
// ─────────────────────────────────────────────
const BRANDED_CARD = {
  width: 500,
  height: 720,
  padding: 40,
  qrSize: 260,
  bgGradientStart: "#064E3B",
  bgGradientEnd: "#059669",
  cardBg: "#ffffff",
  textColor: "#064E3B",
  subtextColor: "#6B7280",
  cornerRadius: 32,
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const drawRoundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// ─────────────────────────────────────────────
// Empty-state placeholder (Requirement 3.4)
// ─────────────────────────────────────────────
const PLACEHOLDER = '—';
const fmt = (v) => (v === null || v === undefined || v === '') ? PLACEHOLDER : v;
// Format phone for display: "+63 9XX XXX XXXX"
// Works with "+639XXXXXXXXX", "9XXXXXXXXX", or any spacing variant.
const fmtPhone = (v) => {
  if (!v) return PLACEHOLDER;
  // Strip everything except digits
  const digits = v.replace(/\D/g, '');
  // Expect 12 digits (63 + 10 local) or 10 digits (local only)
  const local = digits.startsWith('63') ? digits.slice(2) : digits;
  if (local.length !== 10) return v; // unrecognised format — show as-is
  return `+63 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
};

// ─────────────────────────────────────────────
// Crop helper: extract pixel region from canvas
// ─────────────────────────────────────────────
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

// ─────────────────────────────────────────────
// Username format validator (pure, non-exported)
// Priority-ordered rules — first failure wins.
// Returns an error string, or null when all rules pass.
// ─────────────────────────────────────────────
function validateUsernameFormat(value) {
  // Rule 1: Empty string → no error, no availability check
  if (value === '') return null;

  // Rule 2: Contains space → spaces error (highest priority)
  if (/\s/.test(value)) return 'No spaces allowed.';

  // Rule 3: Does not start with a letter
  if (!/^[a-zA-Z]/.test(value)) return 'Must start with a letter.';

  // Rule 4: Too short (1–3 chars)
  if (value.length < 4) return 'Must be at least 4 characters.';

  // Rule 5: Too long (> 30 chars)
  if (value.length > 30) return 'Username must be 30 characters or fewer.';

  // Rule 6: Disallowed characters
  if (/[^a-zA-Z0-9_.\-]/.test(value)) return 'Only letters, numbers, underscores, hyphens, and dots are allowed.';

  // All rules pass
  return null;
}

export default function ProfileSection() {
  const { currentUser, refreshUser } = useAuth();
  const router = useRouter();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // ── Redeem History / Pending Claims state ──
  const [allRedemptions, setAllRedemptions] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [activeTabHistory, setActiveTabHistory] = useState('All');
  const [activeQrTicket, setActiveQrTicket] = useState(null);
  const [activeReceiptItem, setActiveReceiptItem] = useState(null);


  useEffect(() => {
    let cancelled = false;
    async function fetchRedemptions() {
      try {
        const redemptions = await rewardsApi.getMyRedemptions();
        if (cancelled) return;
        const all = redemptions || [];
        const pending = all.filter(
          (r) => r.status === 'pending' || r.status === 'PENDING'
        );
        setAllRedemptions(all);
        setPendingItems(pending);
        setPendingCount(pending.length);
      } catch {
        // silent — card shows 0
      }
    }
    fetchRedemptions();
    return () => { cancelled = true; };
  }, []);

  // ── Crop modal state ──
  const cropFileInputRef = useRef(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [cropError, setCropError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setCropError('Only .png or .jpg files are allowed.');
      return;
    }
    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setCropError('File size must be under 10 MB.');
      return;
    }
    setCropError('');
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    if (cropFileInputRef.current) cropFileInputRef.current.value = '';
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !cropImageSrc) return;
    setIsSavingAvatar(true);
    setCropError('');
    try {
      const blob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await authApi.uploadAvatar(file);
      await refreshUser();
      setIsCropModalOpen(false);
      setCropImageSrc(null);
    } catch (err) {
      setCropError(err.message || 'Failed to upload avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setCropImageSrc(null);
    setCropError('');
    setShowRemoveConfirm(false);
  };

  const handleRemoveAvatar = async () => {
    setIsSavingAvatar(true);
    setCropError('');
    try {
      await authApi.updateProfile({ avatar: null });
      await refreshUser();
      setIsCropModalOpen(false);
      setCropImageSrc(null);
      setShowRemoveConfirm(false);
    } catch (err) {
      setCropError(err.message || 'Failed to remove avatar.');
      setShowRemoveConfirm(false);
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Derive display values from server-supplied currentUser fields.
  const userTagId = currentUser?.displayId ?? PLACEHOLDER;
  const qrPayload = currentUser?.qrPayload ?? (currentUser?.displayId ? `USER:${currentUser.displayId}` : 'USER:UNKNOWN');

  const displayName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') || currentUser?.name || "Eco User";
  const userHandle = currentUser?.username
    ? `@${currentUser.username}`
    : (currentUser?.email ? `@${currentUser.email.split("@")[0]}` : "@ecouser");
  const userName = displayName;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "EU";

  // Avatar URL resolution
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
  const avatarSrc = currentUser?.avatarUrl ? `${apiUrl}${currentUser.avatarUrl}` : null;

  const downloadQR = async () => {
    const qrCanvas = document.getElementById("user-qr-code");
    if (!qrCanvas) return;

    const { width: W, height: H, padding: P, qrSize, bgGradientStart, bgGradientEnd, cardBg, textColor, subtextColor, cornerRadius: R } = BRANDED_CARD;

    // Create QR download design from scratch
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgGradientStart);
    grad.addColorStop(1, bgGradientEnd);
    drawRoundedRect(ctx, 0, 0, W, H, R);
    ctx.fillStyle = grad;
    ctx.fill();

    const cardX = P / 2;
    const cardY = P / 2;
    const cardW = W - P;
    const cardH = H - P - 60;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, R - 8);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.save();
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, R - 8);
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    let logoEndY = cardY + 50;
    try {
      const logo = await loadImage("/ecopoints-logo-mark.png");
      const maxLogoW = 200;
      const scale = maxLogoW / logo.width;
      const logoW = logo.width * scale;
      const logoH = logo.height * scale;
      const logoX = (W - logoW) / 2;
      const logoY = cardY + 30;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      logoEndY = logoY + logoH;
    } catch {
      ctx.font = "700 24px Fredoka, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.fillText("EcoPoints", W / 2, cardY + 55);
      logoEndY = cardY + 65;
    }

    const sepY = logoEndY + 15;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, sepY);
    ctx.lineTo(cardX + cardW - 40, sepY);
    ctx.strokeStyle = "rgba(16,185,129,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const qrAreaY = sepY + 20;
    const qrBorderPad = 14;
    const qrBoxSize = qrSize + qrBorderPad * 2;
    const qrBoxX = (W - qrBoxSize) / 2;
    const qrBoxY = qrAreaY;

    // QR white background box
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.strokeStyle = "rgba(16,185,129,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.drawImage(
      qrCanvas,
      qrBoxX + qrBorderPad,
      qrBoxY + qrBorderPad,
      qrSize,
      qrSize
    );

    const nameY = qrBoxY + qrBoxSize + 30;
    ctx.font = "800 22px Fredoka, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.fillText(userName, W / 2, nameY);

    const handleY = nameY + 22;
    ctx.font = "600 14px Quicksand, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText(userHandle, W / 2, handleY);
    const idY = handleY + 28;
    const idText = `ID: ${userTagId}`;
    ctx.font = "400 11px 'Space Mono', monospace";
    const idMetrics = ctx.measureText(idText);
    const pillW = idMetrics.width + 24;
    const pillH = 22;
    const pillX = (W - pillW) / 2;
    const pillY = idY - 14;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 6);
    ctx.fillStyle = "#f1f5f9";
    ctx.fill();

    ctx.fillStyle = subtextColor;
    ctx.textAlign = "center";
    ctx.fillText(idText, W / 2, idY);
    const footerY = H - 25;
    ctx.font = "600 11px Quicksand, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.fillText("Scan at any Reverse Vending Machine", W / 2, footerY);
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    const safeName = userName.replace(/\s+/g, "-");
    downloadLink.download = `EcoPoints-QR-${safeName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Download a branded redemption ticket card
  const downloadTicketQR = async (item) => {
    const qrCanvas = document.getElementById('ticket-qr-canvas');
    if (!qrCanvas) return;

    const { width: W, height: H, padding: P, bgGradientStart, bgGradientEnd, cardBg, textColor, subtextColor, cornerRadius: R } = BRANDED_CARD;
    const qrSize = 220;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgGradientStart);
    grad.addColorStop(1, bgGradientEnd);
    drawRoundedRect(ctx, 0, 0, W, H, R);
    ctx.fillStyle = grad;
    ctx.fill();

    // White card
    const cardX = P / 2, cardY = P / 2;
    const cardW = W - P, cardH = H - P - 60;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, R - 8);
    ctx.fillStyle = cardBg;
    ctx.fill();
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, R - 8);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Logo
    let logoEndY = cardY + 50;
    try {
      const logo = await loadImage('/ecopoints-logo-mark.png');
      const logoW = Math.min(200, logo.width);
      const logoH = logo.height * (logoW / logo.width);
      ctx.drawImage(logo, (W - logoW) / 2, cardY + 20, logoW, logoH);
      logoEndY = cardY + 20 + logoH;
    } catch {
      ctx.font = '700 22px Fredoka, sans-serif';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.fillText('EcoPoints', W / 2, cardY + 50);
      logoEndY = cardY + 60;
    }

    // Separator
    const sepY = logoEndY + 12;
    ctx.beginPath();
    ctx.moveTo(cardX + 40, sepY);
    ctx.lineTo(cardX + cardW - 40, sepY);
    ctx.strokeStyle = 'rgba(16,185,129,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // QR box
    const qrBorderPad = 14;
    const qrBoxSize = qrSize + qrBorderPad * 2;
    const qrBoxX = (W - qrBoxSize) / 2;
    const qrBoxY = sepY + 18;
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
    ctx.strokeStyle = 'rgba(16,185,129,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.drawImage(qrCanvas, qrBoxX + qrBorderPad, qrBoxY + qrBorderPad, qrSize, qrSize);

    // Reward name
    const rewardY = qrBoxY + qrBoxSize + 28;
    const rewardLabel = item.rewardName + (item.variantName && item.variantName !== 'Default' ? ` (${item.variantName})` : '');
    ctx.font = '800 20px Fredoka, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    // Wrap if needed
    const maxW = cardW - 60;
    const words = rewardLabel.split(' ');
    let line = '';
    let lineY = rewardY;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, W / 2, lineY);
        line = word;
        lineY += 26;
      } else { line = test; }
    }
    ctx.fillText(line, W / 2, lineY);

    // Redemption code pill
    const codeY = lineY + 30;
    const codeText = item.redemptionCode;
    ctx.font = '700 13px Space Mono, monospace';
    const codeM = ctx.measureText(codeText);
    const pillW = codeM.width + 28;
    const pillH = 26;
    drawRoundedRect(ctx, (W - pillW) / 2, codeY - 17, pillW, pillH, 8);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.fillStyle = subtextColor;
    ctx.fillText(codeText, W / 2, codeY);

    // Footer
    ctx.font = '600 11px Quicksand, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('Present at the claims counter', W / 2, H - 25);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `EcoPoints-Ticket-${item.redemptionCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);

  // ── Hide page header + lock body scroll whenever any modal is open ──
  useEffect(() => {
    const anyOpen =
      isPendingModalOpen || isQrModalOpen || isHowItWorksOpen ||
      isCropModalOpen || isEditing || !!activeQrTicket;
    if (anyOpen) {
      document.body.classList.add('profile-modal-open');
      // Measure scrollbar width before hiding to avoid layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.classList.remove('profile-modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.classList.remove('profile-modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isPendingModalOpen, isQrModalOpen, isHowItWorksOpen, isCropModalOpen, isEditing, activeQrTicket]);

  // FOCUS STATE (INPUT)
  const [isFocused, setIsFocused] = useState(null);

  // Form input states — split name
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  // '' | 'checking' | 'available' | 'taken' | 'error'
  const [usernameCheckStatus, setUsernameCheckStatus] = useState('');
  const [usernameError, setUsernameError] = useState('');
  // editPhone stores only the 10-digit local part (no +63 prefix)
  const [editPhone, setEditPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error/Success state
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation rules
  const pwRules = useMemo(() => [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
    { label: 'One number', test: (p) => /[0-9]/.test(p) },
    { label: 'No blank spaces', test: (p) => p.length > 0 && !/\s/.test(p) },
  ], []);

  // Phone validation — 10 digits starting with 9, or empty (optional)
  const validatePhone = (val) => {
    if (val === '') return true;
    if (val.length !== 10 || !val.startsWith('9')) {
      setPhoneError('Must be 10 digits starting with 9.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleOpenEditModal = () => {
    setEditFirstName(currentUser?.firstName || "");
    setEditMiddleName(currentUser?.middleName || "");
    setEditLastName(currentUser?.lastName || "");
    setEditUsername(currentUser?.username || "");
    // Strip +63 prefix when populating the local-part field
    const rawPhone = currentUser?.phone || "";
    setEditPhone(rawPhone.startsWith('+63') ? rawPhone.slice(3) : rawPhone);
    setPhoneError("");
    setUsernameCheckStatus('');
    setUsernameError('');

    // Reset change password state
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(false);
    setShowUsernameConfirm(false);

    setIsEditing(true);
  };

  // ── Debounced username availability check ──
  // Runs synchronous format validation first; if that passes, debounces the
  // backend uniqueness check. A `cancelled` flag + clearTimeout ensure stale
  // timers and in-flight responses are discarded on every new keystroke.
  useEffect(() => {
    // Locked field — do nothing; field is not editable (Requirement 7.11)
    if (isUsernameLocked) return;

    // Synchronous format check — runs on every input change
    const formatError = validateUsernameFormat(editUsername);
    if (formatError) {
      setUsernameError(formatError);
      setUsernameCheckStatus('');
      return;
    }

    // Empty input → neutral state, no availability check
    if (!editUsername) {
      setUsernameError('');
      setUsernameCheckStatus('');
      return;
    }

    // Case-insensitive match of own saved username → immediately available,
    // no API call needed (Requirement 2.7 / 3.7)
    if (editUsername.toLowerCase() === (currentUser?.username || '').toLowerCase()) {
      setUsernameError('');
      setUsernameCheckStatus('available');
      return;
    }

    // Format passes and value differs from saved → debounce the availability check
    setUsernameCheckStatus('checking');
    setUsernameError('');

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const available = await authApi.checkUsernameAvailability(editUsername);
        if (cancelled) return;
        if (available) {
          setUsernameCheckStatus('available');
          setUsernameError('');
        } else {
          setUsernameCheckStatus('taken');
          setUsernameError('Username already taken.');
        }
      } catch {
        if (cancelled) return;
        // Network/server error — clear spinner, don't block save (Requirement 2.6 / 3.6)
        setUsernameCheckStatus('error');
        setUsernameError('');
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [editUsername, currentUser?.username, isUsernameLocked]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // If username changed (and not locked), intercept and show confirmation first
    const usernameChanged = !isUsernameLocked && editUsername !== (currentUser?.username || "");
    if (usernameChanged && !showUsernameConfirm) {
      setShowUsernameConfirm(true);
      return;
    }

    setIsSubmitting(true);

    try {
      let profileUpdated = false;
      let passwordChanged = false;

      // 1. Profile fields updates
      const firstNameChanged = editFirstName !== (currentUser?.firstName || "");
      const middleNameChanged = editMiddleName !== (currentUser?.middleName || "");
      const lastNameChanged = editLastName !== (currentUser?.lastName || "");
      const rawPhone = currentUser?.phone || "";
      const strippedPhone = rawPhone.startsWith('+63') ? rawPhone.slice(3) : rawPhone;
      const phoneChanged = editPhone !== strippedPhone;

      // Validate phone before sending
      if (editPhone && !validatePhone(editPhone)) {
        setIsSubmitting(false);
        return;
      }

      if (firstNameChanged || middleNameChanged || lastNameChanged || phoneChanged || usernameChanged) {
        // Assemble full phone number with +63 prefix, or null to clear
        const fullPhone = editPhone ? `+63${editPhone}` : null;
        await authApi.updateProfile({
          firstName: editFirstName,
          middleName: editMiddleName || null,
          lastName: editLastName,
          phone: fullPhone,
          ...(usernameChanged ? { username: editUsername } : {}),
        });
        profileUpdated = true;
      }

      // 2. Change password updates
      if (isChangingPassword) {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
          throw new Error("Please fill in all password fields.");
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error("New password and confirm password do not match.");
        }
        if (newPassword.length < 8) {
          throw new Error("New password must be at least 8 characters long.");
        }
        if (!/[A-Z]/.test(newPassword)) {
          throw new Error("New password must contain at least one uppercase letter.");
        }
        if (!/[a-z]/.test(newPassword)) {
          throw new Error("New password must contain at least one lowercase letter.");
        }
        if (!/[0-9]/.test(newPassword)) {
          throw new Error("New password must contain at least one digit.");
        }

        await authApi.changePassword(currentPassword, newPassword);
        passwordChanged = true;
      }

      // 3. Success feedback
      if (profileUpdated || passwordChanged) {
        await refreshUser();
        setSuccessMsg(
          [
            profileUpdated && "Profile updated successfully.",
            passwordChanged && "Password changed successfully."
          ]
            .filter(Boolean)
            .join(" ")
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsChangingPassword(false);
        setShowUsernameConfirm(false);

        setTimeout(() => {
          setIsEditing(false);
        }, 1500);
      } else {
        setIsEditing(false);
      }
    } catch (err) {
      setShowUsernameConfirm(false);
      setErrorMsg(err.message || "An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Username lockout derived values (Requirements 7.1, 7.7, 7.8, 7.13) ──
  // Computed once at render time from the server-supplied usernameChangedAt field.
  // Both values are plain const — NOT useState — so they are stable for the
  // lifetime of a single modal session and require no effect.
  // NOTE: must be declared before usernameBlocksSave so the guard below can reference it.

  /**
   * Returns true when the username is currently within the 30-day lockout window.
   * Treats null, undefined, and malformed timestamps as "not locked" (Requirement 7.13).
   */
  const isUsernameLocked = (() => {
    if (!currentUser?.usernameChangedAt) return false;
    const changedAt = new Date(currentUser.usernameChangedAt);
    if (isNaN(changedAt.getTime())) return false;   // malformed → treat as null (Req 7.13)
    const elapsedDays = (Date.now() - changedAt.getTime()) / 86_400_000;
    return elapsedDays < 30;
  })();

  /**
   * Whole days remaining in the lockout period, clamped to a minimum of 1.
   * Only meaningful when isUsernameLocked is true; evaluates to 0 otherwise.
   */
  const lockoutRemainingDays = isUsernameLocked
    ? Math.max(1, 30 - Math.floor((Date.now() - new Date(currentUser.usernameChangedAt).getTime()) / 86_400_000))
    : 0;

  // Derived: should the save button be blocked due to username validation state?
  // Empty username → optional, don't block. Format error or taken → block.
  // Checking or debounce pending (status '') → block. Available or network error → don't block.
  // Locked field → never block (Requirement 7.12, Property 9).
  const usernameBlocksSave = (() => {
    if (isUsernameLocked) return false;                       // locked → field can't change, never block
    if (!editUsername) return false;                          // empty → optional, don't block
    if (usernameError) return true;                          // format error or "taken"
    if (usernameCheckStatus === 'checking') return true;     // availability pending
    if (usernameCheckStatus === '') return true;             // format valid but check not fired yet (debounce window)
    // 'available' or 'error' (network failure) → don't block
    return false;
  })();

  return (
    <section className="min-h-screen p-4 sm:p-6 relative">
      {/* ── Ambient Background ── */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
        background: '#F8FAFC',
      }}>
        {/* Blob orbs */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-8%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, #6ee7b7 0%, #10b981 60%, transparent 100%)',
          opacity: 0.07, filter: 'blur(130px)',
          mixBlendMode: 'multiply',
          animation: 'profileBlob1 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-5%', right: '-6%',
          width: 520, height: 520,
          background: 'radial-gradient(circle, #2dd4bf 0%, #0d9488 60%, transparent 100%)',
          opacity: 0.08, filter: 'blur(120px)',
          mixBlendMode: 'multiply',
          animation: 'profileBlob2 22s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: '10%',
          width: 380, height: 380,
          background: 'radial-gradient(circle, #86efac 0%, #22c55e 60%, transparent 100%)',
          opacity: 0.05, filter: 'blur(150px)',
          mixBlendMode: 'multiply',
          animation: 'profileBlob3 26s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', left: '15%',
          width: 340, height: 340,
          background: 'radial-gradient(circle, #34d399 0%, #059669 60%, transparent 100%)',
          opacity: 0.06, filter: 'blur(100px)',
          mixBlendMode: 'multiply',
          animation: 'profileBlob4 20s ease-in-out infinite',
        }} />
        {/* SVG grid texture */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pgrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#064E3B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pgrid)" />
        </svg>
        {/* Blob keyframes */}
        <style>{`
          @keyframes profileBlob1 {
            0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40%; transform:translate(0,0) scale(1); }
            25%      { border-radius:30% 60% 70% 40%/50% 60% 30% 60%; transform:translate(2%,4%) scale(1.04); }
            50%      { border-radius:50% 60% 40% 70%/40% 50% 60% 50%; transform:translate(-3%,2%) scale(0.96); }
            75%      { border-radius:40% 30% 60% 50%/70% 40% 50% 30%; transform:translate(1%,-3%) scale(1.02); }
          }
          @keyframes profileBlob2 {
            0%,100% { border-radius:50% 60% 40% 60%/40% 60% 50% 70%; transform:translate(0,0) scale(1); }
            30%      { border-radius:70% 30% 60% 40%/60% 40% 70% 30%; transform:translate(-3%,-2%) scale(1.05); }
            60%      { border-radius:40% 70% 30% 60%/50% 30% 60% 70%; transform:translate(2%,3%) scale(0.95); }
          }
          @keyframes profileBlob3 {
            0%,100% { border-radius:55% 45% 65% 35%/45% 55% 35% 65%; transform:translate(0,0) scale(1); }
            40%      { border-radius:35% 65% 45% 55%/65% 35% 55% 45%; transform:translate(3%,-4%) scale(1.06); }
            70%      { border-radius:65% 35% 55% 45%/35% 65% 45% 55%; transform:translate(-2%,2%) scale(0.94); }
          }
          @keyframes profileBlob4 {
            0%,100% { border-radius:45% 55% 35% 65%/55% 45% 65% 35%; transform:translate(0,0) scale(1); }
            35%      { border-radius:65% 35% 55% 45%/35% 65% 45% 55%; transform:translate(-4%,3%) scale(1.03); }
            65%      { border-radius:35% 65% 45% 55%/65% 35% 55% 45%; transform:translate(3%,-2%) scale(0.97); }
          }
        `}</style>
      </div>

      {/* ROOT DIV */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-6 items-start relative z-10">
        {/* ═══ SIDEBAR — 3 stacked cards ═══ */}
        <div className="lg:col-span-1 grid gap-3 h-fit">

          {/* ───── 1A. MAIN PROFILE IDENTITY CARD ───── */}
          <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-xl shadow-black/5 overflow-hidden">
            {/* Top Section: Avatar + Name */}
            <div className="flex flex-col items-center p-6 pb-3">
              {/* Avatar with edit overlay */}
              <div className="relative">
                <div className="w-24 h-24 border-3 border-emerald-300 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white select-none" style={fonts.data}>{initials}</span>
                  )}
                </div>
                {/* Edit avatar button — opens crop modal directly */}
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center shadow-md hover:bg-emerald-50 transition-all cursor-pointer"
                  title="Change profile photo"
                >
                  <Edit2 size={14} className="text-emerald-600" />
                </button>
              </div>
              {/* Display Name + Handle */}
              <div className="text-center mt-3">
                <div className="text-xl lg:text-2xl font-black" style={{ ...fonts.heading, color: "#064E3B" }}>
                  {displayName}
                </div>
                <div className="text-xs lg:text-sm font-bold tracking-wider" style={{ ...fonts.data, color: "#6B7280" }}>
                  {userHandle}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-stone-100" />

            {/* Middle Section: User info rows */}
            <div className="px-5 py-3 space-y-2">
              {/* User ID */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Hash size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-semibold truncate" style={{ ...fonts.data, color: "#374151" }}>
                  {fmt(currentUser?.displayId)}
                </span>
              </div>
              {/* Organization */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                  {currentUser?.organization?.fullName || currentUser?.organization?.name || PLACEHOLDER}
                </span>
              </div>
              {/* User Type */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <UserIcon size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                  {currentUser?.userType
                    ? currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1)
                    : (currentUser?.role ? currentUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : PLACEHOLDER)}
                </span>
              </div>
              {/* Community Group — hidden when name contains 'Default' */}
              {!/default/i.test(currentUser?.communityGroup?.name || '') && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Users size={13} className="text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                    {currentUser?.communityGroup?.name || PLACEHOLDER}
                  </span>
                </div>
              )}
              {/* Email */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                  {fmt(currentUser?.email)}
                </span>
              </div>
              {/* Phone — hidden when null/empty */}
              {currentUser?.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Phone size={13} className="text-emerald-500" />
                  </div>
                  <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                    {fmtPhone(currentUser.phone)}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-stone-100" />

            {/* Bottom Section: Action Buttons */}
            <div className="px-4 py-4 flex gap-2">
              <button
                onClick={handleOpenEditModal}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2.5 bg-white border border-emerald-300 rounded-xl hover:bg-emerald-50 transition-all duration-300 shadow-sm cursor-pointer"
              >
                <PencilIcon size={14} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#059669" }}>
                  Edit Info
                </span>
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2.5 rounded-xl hover:opacity-90 transition-all duration-300 shadow-sm cursor-pointer"
                style={{ backgroundColor: "#064E3B" }}
              >
                <QrCodeIcon size={14} className="text-white" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#ffffff" }}>
                  Show QR
                </span>
              </button>
            </div>
          </div>

          {/* ───── CARD 1: PENDING CLAIMS ───── */}
          <div
            onClick={() => setIsPendingModalOpen(true)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-slate-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* Icon: rounded square, green bg */}
              <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center flex-shrink-0">
                <Ticket size={25} className="text-[#10B981]" />
              </div>
              <div>
                <p className="font-black text-[#064E3B] text-md leading-tight" style={fonts.heading}>Redeem Transactions</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 font-bold mt-0.5" style={fonts.body}>View Tickets</p>
              </div>
            </div>
            {/* Badge: amber square-rounded */}
            {pendingCount > 0 && (
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm" style={fonts.data}>{pendingCount}</span>
              </div>
            )}
          </div>

          {/* ───── CARD 2: ACTIVE STREAK ───── */}
          <div
            className="rounded-2xl p-4 shadow-sm border border-[#FDE68A] flex items-center justify-between"
            style={{ background: '#fffdf3ff' }}
          >
            {/* Left: icon + label + value */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <FlameIcon size={25} className="text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black mb-0.5" style={fonts.body}>Active Streak</p>
                <p className="text-xl font-black leading-none" style={{ ...fonts.data, color: '#064E3B' }}>
                  {currentUser?.streak != null ? `${currentUser.streak} Days` : PLACEHOLDER}
                </p>
              </div>
            </div>
            {/* Right: best streak */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black leading-tight" style={{ ...fonts.data, color: '#F59E0B' }}>
                Best: {currentUser?.bestStreak ?? currentUser?.streak ?? PLACEHOLDER}
              </p>
              <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400 font-bold mt-0.5" style={fonts.body}>Record</p>
            </div>
          </div>

          {/* ───── CARD 3: ORGANIZATION RANK ───── */}
          <div
            className="rounded-2xl shadow-sm border border-[#FDE68A] flex flex-col gap-0 overflow-hidden"
            style={{ background: '#FFFBEB' }}
          >
            <div className="p-4 flex flex-col gap-3">
              {/* Top row: icon+label left, rank right */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AwardIcon size={25} className="text-[#F59E0B]" />
                  <div>
                    <p className="font-black text-[#064E3B] text-md leading-tight" style={fonts.heading}>Leaderboard</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black" style={fonts.body}>
                      Organization Rank
                    </p>
                  </div>
                </div>
                <p className="text-3xl font-black leading-none" style={{ ...fonts.data, color: '#059669' }}>
                  {currentUser?.campusRank != null ? `#${currentUser.campusRank}` : PLACEHOLDER}
                </p>
              </div>

              {/* EP labels + progress bar */}
              {currentUser?.campusRank != null && (currentUser?.organizationUserCount ?? 0) > 0 && (() => {
                const pct = Math.max(4, Math.round(
                  ((currentUser.organizationUserCount - currentUser.campusRank) / currentUser.organizationUserCount) * 100
                ));
                return (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span style={{ ...fonts.body, color: '#6B7280' }}>
                        Current: {(currentUser?.lifetimePoints ?? 0).toLocaleString()} EP
                      </span>
                      {currentUser?.nextRankPoints != null && (
                        <span style={{ ...fonts.body, color: '#F59E0B' }}>
                          Next Rank: {currentUser.nextRankPoints.toLocaleString()} EP
                        </span>
                      )}
                    </div>
                    {/* Track */}
                    <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
                        }}
                      >
                        {/* Shimmer */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'rankShimmer 1.8s ease-in-out infinite',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Motivation box */}
              <div className="bg-white/70 rounded-xl p-3 border border-[#FDE68A]">
                <p className="text-xs font-semibold leading-relaxed" style={{ ...fonts.body, color: '#374151' }}>
                  {currentUser?.epToNextRank != null && currentUser?.nextRankUsername ? (
                    <>
                      You are{' '}
                      <span className="font-black" style={{ color: '#F59E0B' }}>
                        {currentUser.epToNextRank.toLocaleString()} EP
                      </span>{' '}
                      away from overtaking{' '}
                      <span className="font-black" style={{ color: '#064E3B' }}>
                        @{currentUser.nextRankUsername}
                      </span>
                      ! Keep recycling!
                    </>
                  ) : currentUser?.campusRank != null ? (
                    currentUser.campusRank <= 3
                      ? "🏆 You're in the top 3! Keep up the amazing work!"
                      : `🔥 You're ranked #${currentUser.campusRank}! Keep recycling to climb higher!`
                  ) : (
                    'Start recycling to earn your rank! 🌱'
                  )}
                </p>
              </div>
            </div>

            {/* Footer: View Leaderboards */}
            <div className="border-t border-[#FDE68A] px-4 py-3">
              <button
                onClick={() => router.push('/leaderboard')}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] transition-colors cursor-pointer"
                style={{ ...fonts.body, color: '#10B981' }}
              >
                VIEW LEADERBOARD
                <span className="text-sm font-bold">→</span>
              </button>
            </div>

            <style>{`
              @keyframes rankShimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        </div>

        {/*  RECENT ACTIVITY  */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-[580px]">
          {/* RECYCLING HEATMAP */}
          <ProfileHeatmap />

          {/* RECENT ACTIVITY  */}
          <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/5 border border-stone-200 overflow-hidden">
            <RecentActivity />
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }}
          />

          {/* Outer shell: rounded, clips scroll, no overflow padding issue */}
          <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-stone-100 z-10 flex flex-col"
            style={{ maxHeight: '88vh', animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>

            {/* ── Sticky header — stays above scroll ── */}
            <div className="flex-shrink-0 px-6 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black" style={{ ...fonts.heading, color: "#064E3B" }}>Edit Profile</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5" style={fonts.body}>Update your account details.</p>
              </div>
              <button
                onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors flex-shrink-0 ml-4"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto scroll-smooth px-6 sm:px-8 py-6" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              <div className="space-y-5">

                {/* ROW 1: User ID | Username */}
                <div className="grid grid-cols-2 gap-4">
                  {/* USER ID — locked */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>User ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.displayId || "—"}
                        disabled
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold truncate"
                        style={fonts.data}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                  {/* USERNAME — locked or editable */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Username</label>
                    {isUsernameLocked ? (
                      /* ── Locked state (Requirements 7.2–7.6) ─────────────────── */
                      <>
                        <div className="relative">
                          <input
                            value={editUsername}
                            disabled
                            className="w-full pr-9 bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200 rounded-lg px-3 py-2 text-sm"
                          />
                          <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 px-1" style={fonts.body}>
                          {`Username locked — available to change in ${lockoutRemainingDays} ${lockoutRemainingDays === 1 ? 'day' : 'days'}.`}
                        </p>
                      </>
                    ) : (
                      /* ── Normal editable state ────────────────────────────────── */
                      <>
                        <div className="relative">
                          <input
                            onFocus={() => setIsFocused("username")}
                            onBlur={() => setIsFocused(null)}
                            type="text"
                            placeholder="Username"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className={`w-full p-3 pr-9 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 text-sm font-semibold text-slate-800 truncate ${
                              usernameError
                                ? 'border-rose-400 focus:border-rose-400'
                                : usernameCheckStatus === 'available'
                                  ? 'border-emerald-400 focus:border-emerald-400'
                                  : 'border-slate-200 focus:border-emerald-300'
                            }`}
                            style={fonts.body}
                          />
                          {/* Right-side icon */}
                          {usernameCheckStatus === 'checking' && !usernameError && (
                            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                          )}
                          {usernameCheckStatus === 'available' && !usernameError && (
                            <CheckCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        {/* Inline error */}
                        {usernameError && (
                          <p className="text-[11px] text-rose-500 font-semibold mt-1 px-1" style={fonts.body}>{usernameError}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ROW 2: First Name | Middle Name | Last Name */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>First Name</label>
                    <input
                      onFocus={() => setIsFocused("firstName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="First Name"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800 truncate"
                      style={fonts.body}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Middle Name <span className="normal-case text-slate-300 font-medium">(optional)</span></label>
                    <input
                      onFocus={() => setIsFocused("middleName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Middle Name"
                      value={editMiddleName}
                      onChange={(e) => setEditMiddleName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800 truncate"
                      style={fonts.body}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Last Name</label>
                    <input
                      onFocus={() => setIsFocused("lastName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Last Name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800 truncate"
                      style={fonts.body}
                    />
                  </div>
                </div>

                {/* ROW 3: Email (locked) | Phone Number */}
                <div className="grid grid-cols-2 gap-4">
                  {/* EMAIL — locked */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={currentUser?.email || "—"}
                        disabled
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold truncate"
                        style={fonts.body}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                  {/* PHONE NUMBER — +63 prefix */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Phone Number <span className="normal-case text-slate-300 font-medium">(optional)</span></label>
                    <div className="flex">
                      <div
                        className="flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm font-bold select-none flex-shrink-0"
                        style={fonts.body}
                      >+63</div>
                      <input
                        onFocus={() => setIsFocused("phone")}
                        onBlur={() => validatePhone(editPhone)}
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="9XXXXXXXXX"
                        value={editPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditPhone(digits);
                          setPhoneError('');
                        }}
                        className={`flex-1 p-3 rounded-r-xl border text-sm font-semibold text-slate-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 min-w-0 ${phoneError ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200/50' : 'border-slate-200 focus:border-emerald-400'}`}
                        style={fonts.body}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1 px-1" style={fonts.body}>{phoneError}</p>
                    )}
                  </div>
                </div>

                {/* ROW 4: Organization | User Type | Community Group — all locked */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Organization</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.organization?.fullName || currentUser?.organization?.name || "—"}
                        disabled
                        title={currentUser?.organization?.fullName || currentUser?.organization?.name || "—"}
                        className="w-full p-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold truncate"
                        style={fonts.body}
                      />
                      <Lock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>User Type</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.userType
                          ? currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1)
                          : (currentUser?.role ? currentUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : "—")}
                        disabled
                        className="w-full p-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold truncate"
                        style={fonts.body}
                      />
                      <Lock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Community Group</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.communityGroup?.name || "—"}
                        disabled
                        title={currentUser?.communityGroup?.name || "—"}
                        className="w-full p-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold truncate"
                        style={fonts.body}
                      />
                      <Lock size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                  <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-semibold leading-relaxed" style={{ ...fonts.body, color: "#92400E" }}>
                    Organization, User Type, Community Group, and Email are locked to your institutional record. Contact an administrator to change them.
                  </p>
                </div>

                {/* CHANGE PASSWORD TOGGLE */}
                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all duration-200 font-bold text-xs uppercase tracking-wider cursor-pointer"
                    style={fonts.body}
                  >
                    <Lock size={14} className={isChangingPassword ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
                    {isChangingPassword ? "Hide Password Fields" : "Change Password"}
                  </button>
                </div>

                {/* CHANGE PASSWORD FIELDS — redesigned */}
                {isChangingPassword && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4" style={{ animation: "scaleIn 0.2s ease-out forwards" }}>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5" style={fonts.heading}>
                      <Lock size={14} className="text-emerald-600" /> Secure Password Change
                    </h3>

                    {/* Row 1: Current Password (full width) */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Current Password</label>
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter your Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                        style={fonts.body}
                      />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600 transition-colors">
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Separator */}
                    <hr className="border-slate-200" />

                    {/* Row 2: New Password | Confirm New Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* New Password + live checklist */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                            style={fonts.body}
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {/* Live checklist */}
                        {newPassword.length > 0 && (
                          <div className="mt-2.5 space-y-1.5 px-1">
                            {pwRules.map((rule) => {
                              const met = rule.test(newPassword);
                              return (
                                <div key={rule.label} className="flex items-center gap-1.5">
                                  {met
                                    ? <Check size={11} className="text-[#10B981] flex-shrink-0" strokeWidth={3} />
                                    : <X size={11} className="text-rose-500 flex-shrink-0" strokeWidth={3} />}
                                  <span
                                    className={`text-[10px] font-semibold transition-colors ${met ? 'text-[#10B981]' : 'text-slate-400'}`}
                                    style={fonts.body}
                                  >
                                    {rule.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Confirm New Password + match status */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                            style={fonts.body}
                          />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {/* Match status */}
                        {confirmNewPassword.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 px-1">
                            {newPassword === confirmNewPassword
                              ? <><Check size={11} className="text-[#10B981] flex-shrink-0" strokeWidth={3} />
                                <span className="text-[10px] font-semibold text-[#10B981]" style={fonts.body}>Passwords match</span></>
                              : <><X size={11} className="text-rose-500 flex-shrink-0" strokeWidth={3} />
                                <span className="text-[10px] font-semibold text-rose-500" style={fonts.body}>Passwords don&apos;t match</span></>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Sticky footer ── */}
            <div className="flex-shrink-0 px-6 sm:px-8 py-4 border-t border-slate-100">
              {errorMsg && (
                <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2" style={fonts.body}>
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2" style={fonts.body}>
                  <span>✅ {successMsg}</span>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }} disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50" style={fonts.body}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={isSubmitting || usernameBlocksSave}
                  className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm hover:bg-[#065F46] shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95" style={fonts.body}>
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* USERNAME CHANGE CONFIRMATION SUB-MODAL */}
          {showUsernameConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowUsernameConfirm(false)} />
              <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center" style={{ animation: "scaleIn 0.2s ease-out forwards" }}>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-black mb-2" style={{ ...fonts.heading, color: "#064E3B" }}>Change Username?</h3>
                <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ ...fonts.body, color: "#6B7280" }}>
                  Are you sure? You cannot change it again for <strong className="text-slate-800">30 days</strong>.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowUsernameConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer" style={fonts.body}>Cancel</button>
                  <button onClick={handleSave} disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2" style={fonts.body}>
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AVATAR CROP MODAL */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCropCancel} />

          {/* Modal card — relative so the confirm overlay can be absolute inside it */}
          <div className="relative bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-stone-100 z-10 overflow-hidden"
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>

            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black" style={{ ...fonts.heading, color: "#064E3B" }}>Edit Profile Picture</h3>
              </div>
              <button onClick={handleCropCancel} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={cropFileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              className="hidden"
              onChange={handleCropFileChange}
            />

            {/* Two-column body */}
            <div className="p-6 flex gap-5 items-center">

              {/* LEFT — current saved avatar preview */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399]
                                flex items-center justify-center shadow-xl overflow-hidden
                                ring-4 ring-emerald-100">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Current avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-white select-none" style={fonts.data}>{initials}</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1" style={fonts.body}>
                  Current
                </p>
              </div>

              {/* RIGHT — upload zone or crop area */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {cropImageSrc ? (
                  /* Crop state */
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-200"
                    style={{ height: 240 }}>
                    <Cropper
                      image={cropImageSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                ) : (
                  /* Upload state — branded dashed zone */
                  <button
                    type="button"
                    onClick={() => cropFileInputRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-emerald-300
                               bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400
                               flex flex-col items-center justify-center gap-3
                               transition-all cursor-pointer group"
                    style={{ minHeight: 200 }}
                  >
                    {/* Brand logo mark */}
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center
                                    group-hover:bg-emerald-200 transition-colors shadow-sm">
                      <img
                        src="/ecopoints-logo-mark.png"
                        alt="EcoPoints"
                        className="w-7 h-7 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-black text-emerald-700" style={fonts.heading}>Upload Photo</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1" style={fonts.body}>
                        .png or .jpg files only | max file size: 10mb
                      </p>
                    </div>
                  </button>
                )}

                {/* Zoom slider — only when file loaded */}
                {cropImageSrc && (
                  <div className="flex items-center gap-3">
                    <ZoomIn size={15} className="text-emerald-500 flex-shrink-0" />
                    <input
                      type="range"
                      min={1} max={3} step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {cropError && (
              <p className="px-6 pb-2 text-xs text-rose-500 font-semibold" style={fonts.body}>{cropError}</p>
            )}

            {/* Button row */}
            <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center gap-3">
              {/* Remove */}
              <button
                onClick={() => setShowRemoveConfirm(true)}
                disabled={!currentUser?.avatarUrl || isSavingAvatar}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200
                           text-rose-500 font-bold text-sm hover:bg-rose-50 transition-all
                           cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={fonts.body}
              >
                <Trash2 size={14} />
                Remove
              </button>

              <div className="flex gap-3 ml-auto">
                {/* Cancel */}
                <button
                  onClick={handleCropCancel}
                  disabled={isSavingAvatar}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600
                             font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer
                             disabled:opacity-50"
                  style={fonts.body}
                >
                  Cancel
                </button>

                {/* Upload */}
                <button
                  onClick={handleCropSave}
                  disabled={isSavingAvatar || !cropImageSrc}
                  className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm
                             hover:bg-[#065F46] shadow-md shadow-emerald-600/20 cursor-pointer
                             disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                  style={fonts.body}
                >
                  {isSavingAvatar ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {isSavingAvatar ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Remove confirmation overlay — sits on top of the card */}
            {showRemoveConfirm && (
              <div className="absolute inset-0 bg-white/97 backdrop-blur-[2px] z-20
                              flex flex-col items-center justify-center gap-5 rounded-2xl p-8"
                style={{ backdropFilter: 'blur(2px)' }}>
                <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center shadow-sm">
                  <Trash2 size={26} className="text-rose-500" />
                </div>
                <div className="text-center max-w-xs">
                  <h4 className="text-base font-black text-slate-800 mb-2" style={fonts.heading}>
                    Remove Profile Picture?
                  </h4>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed" style={fonts.body}>
                    Are you sure you want to remove the current profile picture?
                  </p>
                </div>
                {cropError && (
                  <p className="text-xs text-rose-500 font-semibold" style={fonts.body}>{cropError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRemoveConfirm(false)}
                    disabled={isSavingAvatar}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600
                               font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer
                               disabled:opacity-50"
                    style={fonts.body}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={isSavingAvatar}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm
                               hover:bg-rose-600 transition-all cursor-pointer disabled:opacity-50
                               flex items-center gap-2 active:scale-95"
                    style={fonts.body}
                  >
                    {isSavingAvatar && <Loader2 size={16} className="animate-spin" />}
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REDEEM HISTORY MODAL */}
      {isPendingModalOpen && (() => {
        const isPending = (r) => r.status === 'pending' || r.status === 'PENDING';
        const isClaimed = (r) => r.status === 'claimed' || r.status === 'CLAIMED';
        const filtered = allRedemptions.filter(r => {
          if (activeTabHistory === 'Pending') return isPending(r);
          if (activeTabHistory === 'Claimed') return isClaimed(r);
          return true;
        });
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#064E3B]/60 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0" onClick={() => setIsPendingModalOpen(false)} />
            <div
              className="relative bg-white rounded-[2rem] w-full shadow-2xl z-10 flex flex-col md:flex-row overflow-hidden"
              style={{ maxWidth: 780, height: '50vh', minHeight: 530, animation: 'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            >
              {/* Sidebar */}
              <div className="w-full md:w-60 bg-slate-50 p-5 md:p-7 border-b md:border-b-0 md:border-r border-slate-100 flex flex-row md:flex-col shrink-0 gap-3 md:gap-0">
                <div className="hidden md:flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <ShoppingBag className="text-emerald-600" size={20} />
                  </div>
                  <h2 className="text-xl font-black text-[#064E3B] leading-tight" style={fonts.heading}>Redeem<br />History</h2>
                </div>
                <div className="flex flex-row md:flex-col gap-2 w-full">
                  {[['All', Ticket, 'All Transactions'], ['Pending', AlertCircle, 'Pending Claims'], ['Claimed', Check, 'Claimed Rewards']].map(([tab, Icon, label]) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTabHistory(tab)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer ${activeTabHistory === tab
                        ? 'bg-white text-[#10B981] shadow-sm border border-slate-100'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      style={fonts.body}
                    >
                      <Icon size={16} /> <span className="hidden md:inline">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
                {/* Content header */}
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                  <h3 className="font-black text-[#064E3B] text-base" style={fonts.heading}>
                    {activeTabHistory === 'All' ? 'All Transactions' : activeTabHistory === 'Pending' ? 'Pending Claims' : 'Claimed Rewards'}
                  </h3>
                  <button
                    onClick={() => setIsPendingModalOpen(false)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
                  >
                    <XIcon size={18} />
                  </button>
                </div>

                {/* List */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                      <ShoppingBag size={44} className="mb-4 opacity-20" />
                      <p className="font-bold text-sm" style={fonts.body}>No items found.</p>
                    </div>
                  ) : (
                    filtered.map((item) => {
                      const pending = isPending(item);
                      return (
                        <div
                          key={item.id}
                          className="rounded-[1.5rem] border border-slate-200 flex flex-col sm:flex-row hover:border-[#10B981]/50 hover:shadow-md transition-all group relative bg-white"
                        >
                          {/* Stub Design */}
                          <div className={`w-full sm:w-[25%] sm:min-w-[100px] border-b-2 sm:border-b-0 sm:border-r-2 border-dashed flex flex-col items-center justify-center p-4 relative rounded-t-[1.5rem] sm:rounded-l-[1.5rem] sm:rounded-tr-none ${pending ? 'bg-amber-50 border-amber-200 text-amber-500 group-hover:border-[#10B981]/50' : 'bg-slate-50 border-slate-200 text-slate-400 group-hover:border-[#10B981]/50'} transition-colors`}>

                            {/* Desktop Notches (Top & Bottom) */}
                            <div className="hidden sm:block absolute -top-[1px] -right-3 w-6 h-3 bg-[#F8FAFC] border-b border-x border-slate-200 rounded-b-full group-hover:border-[#10B981]/50 transition-colors z-20"></div>
                            <div className="hidden sm:block absolute -bottom-[1px] -right-3 w-6 h-3 bg-[#F8FAFC] border-t border-x border-slate-200 rounded-t-full group-hover:border-[#10B981]/50 transition-colors z-20"></div>

                            {/* Mobile Notches (Left & Right) */}
                            <div className="sm:hidden absolute -bottom-3 -left-[1px] w-3 h-6 bg-[#F8FAFC] border-r border-y border-slate-200 rounded-r-full group-hover:border-[#10B981]/50 transition-colors z-20"></div>
                            <div className="sm:hidden absolute -bottom-3 -right-[1px] w-3 h-6 bg-[#F8FAFC] border-l border-y border-slate-200 rounded-l-full group-hover:border-[#10B981]/50 transition-colors z-20"></div>

                            <Ticket className="mb-2 opacity-50" size={24} />
                            <span className="font-black tracking-widest text-xs uppercase text-center">
                              {pending ? 'REDEEMED' : 'CLAIMED'}
                            </span>
                          </div>

                          {/* Details Area */}
                          <div className="p-5 flex-1 flex flex-col justify-center relative rounded-b-[1.5rem] sm:rounded-r-[1.5rem] sm:rounded-bl-none">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide ${pending ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                }`} style={fonts.body}>
                                {pending ? 'Pending' : 'Claimed'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400" style={fonts.data}>
                                EP-{String(item.id).padStart(6, '0')}
                              </span>
                            </div>
                            <p className="font-black text-[#064E3B] text-sm leading-tight mb-1" style={fonts.heading}>
                              {item.rewardName || 'Unknown Reward'}
                              {item.variantName && item.variantName.toLowerCase() !== 'default' ? ` · ${item.variantName}` : ''}
                            </p>
                            <div className="mt-auto pt-3 border-t border-slate-50 flex justify-between items-end">
                              {pending ? (
                                <>
                                  <div className="text-[10px] text-slate-400 font-medium" style={fonts.body}>
                                    Redeemed: {fmtDate(item.redeemedAt)}
                                  </div>
                                  <button
                                    onClick={() => setActiveQrTicket(item)}
                                    className="flex items-center gap-1 text-[#10B981] font-bold text-[11px] hover:text-[#064E3B] transition-colors cursor-pointer"
                                    style={fonts.body}
                                  >
                                    <QrCodeIcon size={13} /> Show QR
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-end justify-between w-full gap-2">
                                  <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 font-medium" style={fonts.body}>
                                    <span><strong className="text-slate-400">Redeemed:</strong> {fmtDate(item.redeemedAt)}</span>
                                    <span><strong className="text-emerald-500">Claimed:</strong> {fmtDate(item.claimedAt)}</span>
                                  </div>
                                  <button
                                    onClick={() => setActiveReceiptItem(item)}
                                    className="flex items-center gap-1 text-[#10B981] font-bold text-[11px] hover:text-[#064E3B] transition-colors cursor-pointer group/btn shrink-0 ml-auto"
                                    style={fonts.body}
                                  >
                                    <ScrollText size={13} />
                                    Show Receipt
                                    <ChevronRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RECEIPT MODAL (Claimed items) */}
      {activeReceiptItem && (() => {
        const item = activeReceiptItem;
        const shortCode = (item.redemptionCode || String(item.id)).replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase();
        const pointsUsed = item.pointsSpent ?? 0;
        const qty = item.qty ?? 1;
        const claimedDate = item.claimedAt
          ? new Date(item.claimedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : '—';
        const claimedTime = item.claimedAt
          ? new Date(item.claimedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : '—';
        const charCodeSum = shortCode.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
        const verificationCode = `ECO-${(charCodeSum * 123 % 90000) + 10000}`;
        const orgRaw = item.organizationName ?? currentUser?.organization;
        const organization = typeof orgRaw === 'string'
          ? orgRaw
          : (orgRaw?.fullName ?? orgRaw?.name ?? 'EcoPoints');
        return (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0" onClick={() => setActiveReceiptItem(null)} />
            <div
              className="relative z-10 w-full flex flex-col items-center"
              style={{ maxWidth: 340, maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain', animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            >
              {/* Close — outside receipt */}
              <button
                onClick={() => setActiveReceiptItem(null)}
                className="self-end mb-3 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
              >
                <XIcon size={18} />
              </button>

              {/* Serrated top edge */}
              <div
                className="w-full h-4 flex-shrink-0"
                style={{ background: "radial-gradient(circle at 6px 0, transparent 4px, white 5px) repeat-x", backgroundSize: "12px 16px" }}
              />

              {/* Receipt body */}
              <div className="bg-white w-full px-7 pb-8 pt-4 flex flex-col items-center flex-shrink-0">
                {/* EcoPoints Logo */}
                <img
                  src="/ecopoints-logo-mark.png"
                  alt="EcoPoints"
                  className="h-15 w-auto mb-2 object-contain"
                />
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-5 text-center" style={fonts.data}>Official Transaction Receipt</p>

                <div className="w-full border-t border-dashed border-slate-300 mb-5" />

                {/* Details grid */}
                <div className="w-full flex flex-col gap-3 text-[11px]" style={fonts.data}>
                  {[
                    ['Description', 'Reward Claimed'],
                    ['Redeemed Item', item.rewardName || '—'],
                    ...(item.variantName && item.variantName.toLowerCase() !== 'default'
                      ? [['Variation', item.variantName]] : []),
                    ['Quantity', `${qty} ${qty > 1 ? 'pcs' : 'pc'}`],
                    ['Date Claimed', claimedDate],
                    ['Time Claimed', claimedTime],
                    ['Location', organization],
                    ['Reference No.', shortCode],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-4">
                      <span className="text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
                      <span className="text-right text-slate-800 font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full border-t border-dashed border-slate-300 my-5" />

                {/* Points Used stamp */}
                <div className="w-full bg-[#F0FDF4] border-2 border-dashed border-[#34D399] rounded-xl p-4 flex justify-between items-center mb-6 shadow-sm">
                  <span className="font-bold text-[#064E3B] uppercase tracking-widest text-xs" style={fonts.body}>Points Used</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-[#10B981] text-2xl leading-none" style={fonts.data}>{pointsUsed.toLocaleString()}</span>
                    <span className="font-black text-[#064E3B] text-sm" style={fonts.heading}>EP</span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold text-center mb-2 px-2 leading-relaxed" style={fonts.body}>
                  Thank you for helping us keep the environment green!
                </p>
                <p className="text-[10px] text-[#10B981] font-bold" style={fonts.data}>
                  Verification Code: {verificationCode}
                </p>
              </div>

              {/* Serrated bottom edge */}
              <div
                className="w-full h-4 flex-shrink-0"
                style={{ background: "radial-gradient(circle at 6px 100%, transparent 4px, white 5px) repeat-x", backgroundSize: "12px 16px" }}
              />
            </div>
          </div>
        );
      })()}

      {/* PENDING CLAIMS — QR TICKET MODAL (Claim Receipt) */}
      {activeQrTicket && (() => {
        const shortCode = activeQrTicket.redemptionCode.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase();
        const qty = activeQrTicket.qty ?? 1;
        const dateStr = activeQrTicket.redeemedAt
          ? new Date(activeQrTicket.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={() => setActiveQrTicket(null)} />

            {/* Card */}
            <div
              className="relative w-full max-w-[340px] flex flex-col shadow-2xl rounded-[2.5rem] bg-white overflow-hidden z-10"
              style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards', maxHeight: '92vh', overscrollBehavior: 'contain' }}
            >
              {/* Scrollable receipt area */}
              <div className="overflow-y-auto scroll-smooth" style={{ overscrollBehavior: 'contain' }}>
                {/* Close button */}
                <button
                  onClick={() => setActiveQrTicket(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors z-20 shadow-sm"
                >
                  <XIcon size={20} />
                </button>

                {/* Receipt capture area */}
                <div className="bg-white flex flex-col pt-8">

                  {/* Top Half */}
                  <div className="px-6 flex flex-col items-center relative">
                    {/* EcoPoints Logo */}
                    <img
                      src="/ecopoints-logo-mark.png"
                      alt="EcoPoints"
                      className="h-12 w-auto mb-2 object-contain"
                    />
                    <div className="w-full border-t border-slate-300 mb-2" />
                    <h2 className="text-xl font-black text-[#064E3B] uppercase tracking-widest" style={fonts.heading}>
                      Claim Receipt
                    </h2>
                    <p className="text-[11px] text-slate-500 font-bold text-center mt-1 mb-6 uppercase" style={fonts.body}>
                      Present at the claiming area
                    </p>
                    {/* QR Code */}
                    <div className="w-44 h-44 bg-white border-2 border-slate-100 p-3 rounded-xl shadow-sm flex items-center justify-center">
                      <QRCodeCanvas
                        id="ticket-qr-canvas"
                        value={`REDEEM:${activeQrTicket.redemptionCode}`}
                        size={152}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    {/* Reward name + variant */}
                    <h3 className="font-black text-[#064E3B] text-lg leading-tight mt-2 mb-2" style={fonts.heading}>
                      {activeQrTicket.rewardName}
                      {activeQrTicket.variantName && activeQrTicket.variantName.toLowerCase() !== 'default'
                        ? ` | ${activeQrTicket.variantName}` : ''}
                    </h3>

                    {/* Qty pill */}
                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-md border border-slate-100" style={fonts.body}>
                      Qty: {qty} <span className="text-[#10B981]">{qty > 1 ? 'pcs' : 'pc'}</span>
                    </div>
                  </div>

                  {/* Perforation */}
                  <div className="w-full h-8 relative flex items-center overflow-hidden mt-6">
                    <div className="absolute -left-4 w-8 h-8 bg-slate-900/40 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" />
                    <div className="absolute -right-4 w-8 h-8 bg-slate-900/40 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]" />
                    <div className="w-full border-t-2 border-dashed border-slate-300 mx-6" />
                  </div>

                  {/* Bottom Half */}
                  <div className="pb-4 pt-4 px-6 flex flex-col items-center text-center">

                    {/* Redemption Code Block */}
                    <div className="w-full bg-[#F8FAFC] border border-[#F0FDF4] rounded-xl p-3 mt-1 mb-5 shadow-inner flex flex-col items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1" style={fonts.body}>
                        Redemption Code
                      </p>
                      <p className="text-3xl font-black text-[#10B981] tracking-widest" style={fonts.data}>
                        {shortCode}
                      </p>
                    </div>

                    {/* User + date separator */}
                    <div className="w-full border-t border-slate-100 pt-4 mb-2">
                      <p className="font-bold text-[#064E3B]" style={fonts.body}>{userName}</p>
                      <p className="text-xs font-bold font-mono text-slate-400 mt-0.5">{dateStr}</p>
                    </div>

                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1" style={fonts.body}>
                      Thank you for using EcoPoints!
                    </p>
                  </div>
                </div>
              </div>

              {/* Download button — outside capture area */}
              <div className="px-6 pb-6 pt-2 bg-white flex-shrink-0">
                <button
                  onClick={() => downloadTicketQR(activeQrTicket)}
                  className="w-full py-3.5 text-white rounded-xl font-black text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'linear-gradient(to right, #10B981, #059669)', ...fonts.heading }}
                >
                  <DownloadIcon size={20} /> Download Ticket
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FOOTER PADDING */}
      <div className="h-12" />

      {/* QR CODE MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pt-24 sm:pt-24 pb-10">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsQrModalOpen(false)}
          />

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center transform transition-all z-10 border border-stone-100 max-h-[85vh] overflow-y-auto"
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <XIcon size={20} />
            </button>
            <div className="mb-4 bg-emerald-100 p-3 rounded-full">
              <QrCodeIcon className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-black mb-1 tracking-tight text-center" style={{ ...fonts.heading, color: "#064E3B" }}>Your Personal QR</h3>
            <p className="text-xs mb-6 text-center font-medium" style={{ ...fonts.body, color: "#6B7280" }}>Scan this QR code at any Reverse Vending Machine to start recycling.</p>

            <div className="bg-white p-4 web-web-rounded-xl shadow-inner border border-slate-100 mb-6 flex justify-center items-center">
              <QRCodeCanvas
                id="user-qr-code"
                value={qrPayload}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#0f172a"}
                level={"H"}
                includeMargin={false}
              />
            </div>

            <p className="text-xs bg-slate-100 px-4 py-1.5 rounded-full mb-6 tracking-widest" style={{ ...fonts.data, color: "#6B7280" }}>
              ID: {userTagId !== PLACEHOLDER ? userTagId : '—'}
            </p>

            <button
              onClick={downloadQR}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#065F46] text-white font-bold web-web-rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
              style={fonts.body}
            >
              <DownloadIcon size={18} />
              Download QR Code
            </button>
          </div>
        </div>
      )}
      {/* HOW IT WORKS MODAL */}
      {isHowItWorksOpen && (
        <HowItWorksModal onClose={() => setIsHowItWorksOpen(false)} />
      )}
    </section>
  );
}