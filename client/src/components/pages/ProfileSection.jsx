// user client
// Profile section

import { useState, useEffect, useRef, useCallback } from "react";
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

export default function ProfileSection() {
  const { currentUser, refreshUser } = useAuth();
  const router = useRouter();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // ── Pending Claims state ──
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchPending() {
      try {
        const redemptions = await rewardsApi.getMyRedemptions();
        if (cancelled) return;
        const pending = (redemptions || []).filter(
          (r) => r.status === 'pending' || r.status === 'PENDING'
        );
        setPendingItems(pending);
        setPendingCount(pending.length);
      } catch {
        // silent — card shows 0
      }
    }
    fetchPending();
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
  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [showUsernameConfirm, setShowUsernameConfirm] = useState(false);

  // FOCUS STATE (INPUT)
  const [isFocused, setIsFocused] = useState(null);

  // Form input states — split name
  const [editFirstName, setEditFirstName] = useState("");
  const [editMiddleName, setEditMiddleName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
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

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // If username changed, intercept and show confirmation first
    const usernameChanged = editUsername !== (currentUser?.username || "");
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

  return (
    <section className="min-h-screen p-4 sm:p-6">
      {/* ROOT DIV */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-6 items-start">
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
              {/* Community Group */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Users size={13} className="text-emerald-500" />
                </div>
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#374151" }}>
                  {currentUser?.communityGroup?.name || PLACEHOLDER}
                </span>
              </div>
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
                style={{ backgroundColor: "#102027" }}
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
                <p className="font-black text-[#064E3B] text-md leading-tight" style={fonts.heading}>Pending Claims</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">

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
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
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
                  {/* USERNAME — editable */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Username</label>
                    <input
                      onFocus={() => setIsFocused("username")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800 truncate"
                      style={fonts.body}
                    />
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

                {/* CHANGE PASSWORD FIELDS */}
                {isChangingPassword && (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4" style={{ animation: "scaleIn 0.2s ease-out forwards" }}>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5" style={fonts.heading}>
                      <Lock size={14} className="text-emerald-600" /> Secure Password Change
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="relative">
                        <input type={showCurrentPassword ? "text" : "password"} placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all" style={fonts.body} />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showNewPassword ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all" style={fonts.body} />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all" style={fonts.body} />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold" style={fonts.body}>💡 Min 8 characters — uppercase, lowercase, and a digit required.</p>
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
                <button onClick={handleSave} disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm hover:bg-[#065F46] shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95" style={fonts.body}>
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* USERNAME CHANGE CONFIRMATION SUB-MODAL */}
          {showUsernameConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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

      {/* PENDING CLAIMS MODAL */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPendingModalOpen(false)}
          />
          <div
            className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl z-10 overflow-hidden flex flex-col"
            style={{ maxHeight: '80vh', animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-5 pt-5 pb-3 flex items-start justify-between border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket size={20} className="text-[#10B981]" />
                  <h3 className="text-lg font-black" style={{ ...fonts.heading, color: '#064E3B' }}>Pending Claims</h3>
                </div>
                <p className="text-xs font-semibold text-slate-400 mt-0.5" style={fonts.body}>Items waiting to be picked up.</p>
              </div>
              <button
                onClick={() => setIsPendingModalOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex-shrink-0 ml-3"
              >
                <XIcon size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {pendingItems.length === 0 ? (
                <div className="text-center py-10">
                  <Ticket size={36} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400" style={fonts.body}>No pending claims</p>
                  <p className="text-xs text-slate-300 mt-1" style={fonts.body}>Redeem a reward to see your tickets here.</p>
                </div>
              ) : (
                pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
                  >
                    {/* Badge row */}
                    <div className="flex items-start justify-between mb-1.5">
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                        style={{ ...fonts.data, color: '#10B981', background: '#F0FDF4', borderColor: '#BBF7D0' }}
                      >
                        EP-REQ-{String(item.id).padStart(6, '0')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                        <Ticket size={14} className="text-[#10B981]" />
                      </div>
                    </div>
                    {/* Name */}
                    <p className="text-sm font-black text-slate-800 mb-0.5" style={fonts.heading}>
                      {item.rewardName || 'Unknown Reward'}
                      {item.variantName && item.variantName !== 'Default' ? ` (${item.variantName})` : ''}
                    </p>
                    {/* Meta */}
                    <p className="text-xs font-semibold text-slate-400 mb-3" style={fonts.body}>
                      Qty: 1 • {item.redeemedAt
                        ? new Date(item.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                        : '—'}
                    </p>
                    {/* Show QR Ticket button */}
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 cursor-pointer"
                      style={fonts.body}
                      onClick={() => {/* future: show QR for this redemption code */ }}
                    >
                      <QrCodeIcon size={14} className="text-[#10B981]" />
                      Show QR Ticket
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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