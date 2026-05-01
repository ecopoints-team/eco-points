// user client
// Profile section

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Award,
  AwardIcon,
  FlameIcon,
  MedalIcon,
  PencilIcon,
  QrCodeIcon,
  University,
  UniversityIcon,
  UserIcon,
  XIcon,
  DownloadIcon,
  MailIcon,
  UserCircleIcon,
} from "lucide-react";
import RecentActivity from "./RecentActivity";

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

export default function ProfileSection() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Mocking the user's tag ID from AccessCredential
  const userTagId = "12345-ABCDE";
  const qrPayload = `USER:${userTagId}`;

  // User display info (would come from auth/context in production)
  const userName = "JAY MAR";
  const userHandle = "@jaydi_dev";

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
      const logo = await loadImage("/EcoPoints Logo Mark with Name.png");
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

  // FOCUS STATE (INPUT)
  const [isFocused, setIsFocused] = useState(null);

  // DROPDOWN STATE (EDIT PROFILE)
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState("");

  // ROLE DROPDOWN STATE
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  return (
    <section className="min-h-screen p-4 sm:p-6">
      {/* ROOT DIV */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-6 items-start">
        {/* USER INFORMATION (CREDENTIALS) SECTION */}
        <div className="lg:col-span-1 grid gap-3 h-fit">
          <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-xl shadow-black/5 overflow-hidden">
            {/* USERNAME & ICON*/}
            <div className="justify-self-center p-6 pb-2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-3xl font-black text-white select-none" style={fonts.data}>JM</span>
              </div>
            </div>
            {/* USER DETAILS */}
            <div className="text-center px-4 pb-3">
              <div className="my-1">
                <div className="text-xl lg:text-2xl font-black" style={{ ...fonts.heading, color: "#064E3B" }}>
                  JAY MAR
                </div>
                <div className="text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#6B7280" }}>
                  @jaydi_dev
                </div>
              </div>
            </div>

            {/* USER INFO */}
            <div className="px-5 pb-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <UserIcon size={14} className="text-stone-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#6B7280" }}>Student</span>
              </div>
              <div className="flex items-center gap-2.5">
                <UniversityIcon size={14} className="text-stone-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#6B7280" }}>Polytechnic University of the Philippines</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MailIcon size={14} className="text-stone-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#6B7280" }}>juandelacruz@gmail.com</span>
              </div>
              <div className="flex items-center gap-2.5">
                <UserCircleIcon size={14} className="text-stone-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate" style={{ ...fonts.body, color: "#6B7280" }}>Male</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-4 border-t border-stone-100" />

            {/* EDIT PROFILE & QR BUTTONS */}
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all duration-300 shadow-sm"
              >
                <PencilIcon size={14} className="text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#064E3B" }}>
                  Edit Profile
                </span>
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition-all duration-300 shadow-sm"
              >
                <QrCodeIcon size={14} className="text-stone-500" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ ...fonts.body, color: "#6B7280" }}>
                  Show Personal QR
                </span>
              </button>
            </div>
          </div>

          {/* CAMPUS RANK & STREAK */}
          <div className="space-y-2">
            {/* CAMPUS RANK */}
            <div className="relative group p-4 rounded-2xl grid gap-0.5 overflow-hidden text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #059669 0%, #064E3B 100%)" }}>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ ...fonts.body, color: "#34D399" }}>
                Campus Rank
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black" style={fonts.data}>TOP #12</p>
                <p className="text-[10px] font-black" style={fonts.data}>/ 10,000</p>
              </div>
              <p className="text-[9px] font-bold" style={{ ...fonts.body, color: "#34D399" }}>
                Highest: TOP #12
              </p>
              <AwardIcon className="absolute text-amber-400/10 -right-3 -top-3 w-12 h-12 group-hover:scale-110 transition-transform" />
            </div>

            {/* STREAK */}
            <div className="relative group p-4 rounded-2xl overflow-hidden text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #059669 0%, #064E3B 100%)" }}>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ ...fonts.body, color: "#34D399" }}>
                All Time Streak
              </p>
              <p className="text-2xl font-black" style={fonts.data}>15 Days</p>
              <FlameIcon className="absolute text-amber-500/10 -right-2 -top-4 w-12 h-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        {/*  RECENT ACTIVITY  */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-[580px]">
          {/* SUMMARY SECTION */}
          <div className="bg-white/95 backdrop-blur-sm border border-stone-200 rounded-2xl h-[180px] flex items-center justify-center relative overflow-hidden shadow-xl shadow-black/5">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 to-transparent" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] relative z-10 transition-colors group-hover:text-emerald-900/50"
              style={{ ...fonts.body, color: "rgba(6,78,59,0.3)" }}>
              Summary Insights
            </p>
          </div>

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
            onClick={() => setIsEditing(false)}
          />

          <div className="relative bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl border border-stone-100 max-h-[85vh] overflow-y-auto z-10"
            style={{ animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}>

            {/* Close button */}
            <button
              onClick={() => setIsEditing(false)}
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10b981] to-[#34d399] flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-black text-white" style={fonts.data}>JM</span>
                </div>
              </div>

              {/* FILE UPLOAD */}
              <input
                type="file"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 cursor-pointer transition-all duration-300 hover:border-emerald-300"
                style={fonts.body}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* FULL NAME */}
                <input
                  onFocus={() => setIsFocused("name")}
                  onBlur={() => setIsFocused(null)}
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400"
                  style={fonts.body}
                />

                {/* USERNAME */}
                <input
                  onFocus={() => setIsFocused("username")}
                  onBlur={() => setIsFocused(null)}
                  type="text"
                  placeholder="Username"
                  className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400"
                  style={fonts.body}
                />

                {/* EMAIL */}
                <input
                  onFocus={() => setIsFocused("email")}
                  onBlur={() => setIsFocused(null)}
                  type="email"
                  placeholder="juandelacruz@gmail.com"
                  className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400"
                  style={fonts.body}
                />

                {/* INSTITUTION */}
                <input
                  onFocus={() => setIsFocused("institution")}
                  onBlur={() => setIsFocused(null)}
                  type="text"
                  placeholder="Institution"
                  className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400"
                  style={fonts.body}
                />

                {/* AGE */}
                <input
                  onFocus={() => setIsFocused("age")}
                  onBlur={() => setIsFocused(null)}
                  type="text"
                  placeholder="Age"
                  className="w-full p-3 rounded-xl border border-slate-200 transition-all duration-300 ease-in focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:border-emerald-400"
                  style={fonts.body}
                />

                {/* GENDER */}
                <div className="relative">
                  <div
                    onClick={() => {
                      setIsOpen(!isOpen);
                      setIsRoleOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center cursor-pointer transition-all duration-200 ease-out hover:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400"
                    style={fonts.body}
                  >
                    <span className={selectedGender ? "text-slate-700" : "text-slate-400"}>
                      {selectedGender || "Select Gender"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isOpen && (
                    <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-1">
                        {["Male", "Female", "Other"].map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              setSelectedGender(option);
                              setIsOpen(false);
                            }}
                            className="px-4 py-2.5 cursor-pointer text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            style={fonts.body}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ROLE */}
                <div className="relative">
                  <div
                    onClick={() => {
                      setIsRoleOpen(!isRoleOpen);
                      setIsOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white flex justify-between items-center cursor-pointer transition-all duration-200 ease-out hover:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-emerald-400"
                    style={fonts.body}
                  >
                    <span className={selectedRole ? "text-slate-700" : "text-slate-400"}>
                      {selectedRole || "Select Role"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isRoleOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isRoleOpen && (
                    <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                      <div className="p-1">
                        {["Student", "Faculty", "Alumni", "Others"].map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              setSelectedRole(option);
                              setIsRoleOpen(false);
                            }}
                            className="px-4 py-2.5 cursor-pointer text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            style={fonts.body}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
                style={fonts.body}
              >
                Cancel
              </button>

              <button
                className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-sm transition-all transform active:scale-95 hover:bg-[#065F46] shadow-lg shadow-emerald-600/20 cursor-pointer"
                style={fonts.body}
              >
                Save
              </button>
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

            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mb-6 flex justify-center items-center">
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

            <p className="text-xs bg-slate-100 px-3 py-1 rounded-md mb-6 tracking-widest" style={{ ...fonts.data, color: "#6B7280" }}>
              ID: {userTagId}
            </p>

            <button
              onClick={downloadQR}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#065F46] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
              style={fonts.body}
            >
              <DownloadIcon size={18} />
              Download QR Code
            </button>
          </div>
        </div>
      )}
    </section>
  );
}