// user client
// Profile section

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  AwardIcon,
  FlameIcon,
  PencilIcon,
  QrCodeIcon,
  UniversityIcon,
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
} from "lucide-react";
import RecentActivity from "./RecentActivity";
import ProfileHeatmap from "./ProfileHeatmap";
import { useAuth } from "../../context/AuthContext";
import HowItWorksModal from "../shared/HowItWorksModal";
import { auth as authApi } from "../../services/api";


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

export default function ProfileSection() {
  const { currentUser, refreshUser } = useAuth();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      await authApi.uploadAvatar(file);
      await refreshUser();
    } catch (err) {
      alert(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
  const [editPhone, setEditPhone] = useState("");

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

  const handleOpenEditModal = () => {
    setEditFirstName(currentUser?.firstName || "");
    setEditMiddleName(currentUser?.middleName || "");
    setEditLastName(currentUser?.lastName || "");
    setEditUsername(currentUser?.username || "");
    setEditPhone(currentUser?.phone || "");
    
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
      const phoneChanged = editPhone !== (currentUser?.phone || "");

      if (firstNameChanged || middleNameChanged || lastNameChanged || phoneChanged || usernameChanged) {
        await authApi.updateProfile({
          firstName: editFirstName,
          middleName: editMiddleName || null,
          lastName: editLastName,
          phone: editPhone,
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white select-none" style={fonts.data}>{initials}</span>
                  )}
                </div>
                {/* Edit avatar button — overlaps bottom-right */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-emerald-200 flex items-center justify-center shadow-md hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-50"
                  title="Upload profile photo"
                >
                  {isUploadingAvatar
                    ? <Loader2 size={14} className="text-emerald-600 animate-spin" />
                    : <Edit2 size={14} className="text-emerald-600" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
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
                    {currentUser.phone}
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

          {/* ───── 1B. ACTIVE STREAK CARD ───── */}
          <div
            className="relative p-4 rounded-2xl overflow-hidden shadow-md"
            style={{
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a33 100%)",
              boxShadow: "0 0 40px rgba(251,191,36,0.15), 0 4px 14px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Flame + Text */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    boxShadow: "0 0 20px rgba(249,115,22,0.4), 0 0 40px rgba(249,115,22,0.15)",
                    animation: "streakPulse 2s ease-in-out infinite",
                  }}
                >
                  <FlameIcon size={24} className="text-white drop-shadow-lg" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ ...fonts.body, color: "#9CA3AF" }}>
                    Active Streak
                  </p>
                  <p className="text-2xl font-black" style={{ ...fonts.data, color: "#059669" }}>
                    {currentUser?.streak != null ? `${currentUser.streak} Days` : PLACEHOLDER}
                  </p>
                </div>
              </div>
            </div>

            {/* Streak pulse animation */}
            <style jsx>{`
              @keyframes streakPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.4), 0 0 40px rgba(249,115,22,0.15); transform: scale(1); }
                50% { box-shadow: 0 0 30px rgba(249,115,22,0.6), 0 0 60px rgba(249,115,22,0.25); transform: scale(1.05); }
              }
            `}</style>
          </div>

          {/* ───── 1C. ORGANIZATION RANK CARD ───── */}
          <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-xl shadow-black/5 overflow-hidden p-4">
            {/* Rank Header */}
            <div className="flex items-center gap-2 mb-3">
              <AwardIcon size={18} className="text-amber-500" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ ...fonts.body, color: "#6B7280" }}>
                Organization Rank
              </p>
            </div>

            {/* Rank Display */}
            <div className="flex items-baseline gap-1.5 mb-3">
              <p className="text-3xl font-black" style={{ ...fonts.data, color: "#064E3B" }}>
                {currentUser?.campusRank != null ? `#${currentUser.campusRank}` : PLACEHOLDER}
              </p>
              {currentUser?.organizationUserCount != null && (
                <p className="text-sm font-bold" style={{ ...fonts.data, color: "#9CA3AF" }}>
                  / {currentUser.organizationUserCount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {currentUser?.campusRank != null && currentUser?.organizationUserCount != null && currentUser.organizationUserCount > 0 && (
              <div className="mb-4">
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.max(5, Math.round(((currentUser.organizationUserCount - currentUser.campusRank) / currentUser.organizationUserCount) * 100))}%`,
                      background: "linear-gradient(90deg, #10b981, #34d399)",
                    }}
                  />
                </div>
                <p className="text-[10px] font-bold mt-1.5" style={{ ...fonts.body, color: "#9CA3AF" }}>
                  Top {Math.round((currentUser.campusRank / currentUser.organizationUserCount) * 100)}% of your organization
                </p>
              </div>
            )}

            {/* Motivation Callout Box */}
            <div
              className="rounded-xl p-3"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <p className="text-xs font-bold leading-relaxed" style={{ ...fonts.body, color: "#92400E" }}>
                {currentUser?.campusRank != null
                  ? currentUser.campusRank <= 3
                    ? "🏆 You're in the top 3! Keep up the amazing work!"
                    : `🔥 You're ranked #${currentUser.campusRank}! Keep recycling to climb higher!`
                  : "Start recycling to earn your rank! 🌱"}
              </p>
            </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pt-24 sm:pt-24 pb-10">

          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }}
          />

          <div className="relative bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl border border-stone-100 max-h-[85vh] overflow-y-auto z-10"
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>

            {/* Close button */}
            <button
              onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-20"
            >
              <XIcon size={18} />
            </button>

            <h2 className="text-xl font-black text-center mb-6" style={{ ...fonts.heading, color: "#064E3B" }}>
              Edit Profile
            </h2>

            <div className="space-y-6">
              {/* Profile Image Preview */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg overflow-hidden">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-white" style={fonts.data}>{initials}</span>
                  )}
                </div>
              </div>

              {/* ─── EDITABLE FIELDS ─── */}
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-3 px-1" style={fonts.body}>Editable Fields</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* FIRST NAME */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>First Name</label>
                    <input
                      onFocus={() => setIsFocused("firstName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="First Name"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800"
                      style={fonts.body}
                    />
                  </div>

                  {/* MIDDLE NAME */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Middle Name <span className="text-slate-300">(Optional)</span></label>
                    <input
                      onFocus={() => setIsFocused("middleName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Middle Name"
                      value={editMiddleName}
                      onChange={(e) => setEditMiddleName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800"
                      style={fonts.body}
                    />
                  </div>

                  {/* LAST NAME */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Last Name</label>
                    <input
                      onFocus={() => setIsFocused("lastName")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Last Name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800"
                      style={fonts.body}
                    />
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
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800"
                      style={fonts.body}
                    />
                  </div>

                  {/* PHONE NUMBER */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Phone Number</label>
                    <input
                      onFocus={() => setIsFocused("phone")}
                      onBlur={() => setIsFocused(null)}
                      type="text"
                      placeholder="Phone Number (e.g. +639123456789)"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 text-sm font-semibold text-slate-800"
                      style={fonts.body}
                    />
                  </div>
                </div>
              </div>

              {/* ─── READ-ONLY FIELDS ─── */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 px-1" style={fonts.body}>Locked Fields</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* USER TYPE */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>User Type</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.userType
                          ? currentUser.userType.charAt(0).toUpperCase() + currentUser.userType.slice(1)
                          : (currentUser?.role ? currentUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : "—")}
                        disabled={true}
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold"
                        style={fonts.body}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  {/* COMMUNITY GROUP */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Community Group</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.communityGroup?.name || "—"}
                        disabled={true}
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold"
                        style={fonts.body}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  {/* ORGANIZATION */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Organization</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.organization?.fullName || currentUser?.organization?.name || "—"}
                        disabled={true}
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold"
                        style={fonts.body}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  {/* USER ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>User ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={currentUser?.displayId || "—"}
                        disabled={true}
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold"
                        style={fonts.data}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1" style={fonts.body}>Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={currentUser?.email || "—"}
                        disabled={true}
                        className="w-full p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-semibold"
                        style={fonts.body}
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── DISCLAIMER ─── */}
              <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
                <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-semibold leading-relaxed" style={{ ...fonts.body, color: "#92400E" }}>
                  User Type, Community Group, and Email are locked to your institutional record. To change these, please contact the administrator.
                </p>
              </div>

              {/* CHANGE PASSWORD TOGGLE BUTTON */}
              <div className="border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all duration-300 font-bold text-xs uppercase tracking-wider cursor-pointer"
                  style={fonts.body}
                >
                  <Lock size={14} className={isChangingPassword ? "text-emerald-500 animate-pulse" : "text-slate-500"} />
                  {isChangingPassword ? "Hide Password Fields" : "Change Password"}
                </button>
              </div>

              {/* CHANGE PASSWORD COLLAPSIBLE BOX */}
              {isChangingPassword && (
                <div 
                  className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 transition-all duration-300"
                  style={{ animation: "scaleIn 0.2s ease-out forwards" }}
                >
                  <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5" style={fonts.heading}>
                    <Lock size={14} className="text-emerald-600" /> Secure Password Change
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* CURRENT PASSWORD */}
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                        style={fonts.body}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* NEW PASSWORD */}
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                        style={fonts.body}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* CONFIRM NEW PASSWORD */}
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full p-3 pr-10 text-sm font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all"
                        style={fonts.body}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 font-semibold leading-relaxed" style={fonts.body}>
                    💡 Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.
                  </div>
                </div>
              )}
            </div>

            {/* ERROR & SUCCESS NOTIFICATIONS */}
            <div className="mt-6 space-y-3">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-bounce" style={fonts.body}>
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2" style={fonts.body}>
                  <span>✅ {successMsg}</span>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setIsEditing(false); setShowUsernameConfirm(false); }}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={fonts.body}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm transition-all transform active:scale-95 hover:bg-[#065F46] shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={fonts.body}
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* USERNAME CHANGE CONFIRMATION SUB-MODAL */}
          {showUsernameConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowUsernameConfirm(false)} />
              <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 text-center"
                style={{ animation: "scaleIn 0.2s ease-out forwards" }}>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-black mb-2" style={{ ...fonts.heading, color: "#064E3B" }}>Change Username?</h3>
                <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ ...fonts.body, color: "#6B7280" }}>
                  Are you sure you want to change your username? You will not be able to change it again for <strong className="text-slate-800">30 days</strong>.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUsernameConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                    style={fonts.body}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    style={fonts.body}
                  >
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    I Understand
                  </button>
                </div>
              </div>
            </div>
          )}
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