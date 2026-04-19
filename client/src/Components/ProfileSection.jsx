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
} from "lucide-react";

import RecentActivity from "./RecentActivity";

export default function ProfileSection() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Mocking the user's tag ID from AccessCredential
  const userTagId = "12345-ABCDE";
  const qrPayload = `USER:${userTagId}`;

  const downloadQR = () => {
    const canvas = document.getElementById("user-qr-code");
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "my-qr-code.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <section className="bg-slate-200 min-h-screen p-4">
      {/* ROOT DIV - Using flex to ensure height alignment is precise */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-4 gap-6 items-start">

        {/* USER INFORMATION (CREDENTIALS) SECTION */}
        <div className="lg:col-span-1 grid gap-4 h-fit">
          <div className="grid grid-row-3 rounded-xl gap-2 bg-slate-50 shadow-sm">
            {/* USERNAME & ICON*/}
            <div className="justify-self-center p-4">
              <div className="w-20 h-20 md:w-30 md:h-30 rounded-full bg-slate-200 justify-items-center flex items-center justify-center">
                <UserIcon className="w-10 h-10 md:w-20 md:h-20 text-slate-400" />
              </div>
            </div>
            {/* USER DETAILS */}
            <div className="justify-items-center">
              <div className="my-2 justify-items-center text-center">
                <div className="text-xl lg:text-3xl font-black text-slate-800">JAY MAR</div>
                <div className="text-xs lg:text-sm text-stone-500 font-bold uppercase tracking-wider">@jaydi_dev</div>
              </div>
            </div>
            {/* BUTTON FOR USER DETAILS */}
            <div className="group justify-items-center pb-4">
              <button className="flex p-2 w-4/5 gap-2 place-content-center bg-green-200 rounded-lg cursor-pointer hover:bg-green-300 transition-colors border border-green-300 shadow-sm">
                <PencilIcon size={16} className="text-green-700" />
                <p className="text-xs font-black text-green-800 uppercase tracking-tighter">Edit Profile</p>
              </button>
            </div>
            {/* USER ROLES & OTHER DETAILS */}
            <div className="justify-self-center p-4 pt-0 w-full">
              <div className="grid gap-3">
                {/* ROLE */}
                <div className="flex gap-2 bg-emerald-400 rounded-s-full p-2 items-center shadow-inner">
                  <div className="p-1.5 rounded-full bg-white shadow-sm flex-shrink-0">
                    <UserIcon size={18} className="text-emerald-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-black text-emerald-900/40">role</p>
                    <p className="text-xs font-black text-emerald-900 truncate">Student</p>
                  </div>
                </div>
                {/* UNIVERSITY */}
                <div className="flex gap-2 bg-emerald-400 rounded-s-full p-2 items-center shadow-inner">
                  <div className="p-1.5 rounded-full bg-white shadow-sm flex-shrink-0">
                    <UniversityIcon size={18} className="text-emerald-600" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-black text-emerald-900/40">Institution</p>
                    <p className="text-xs font-black text-emerald-900 truncate px-1">Polytechnic University...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LEADERBOARD RANK, PERSONAL QR CODE & OTHER DETAILS */}
          <div className="space-y-4">
            {/* CAMPUS RANK */}
            <div className="relative group p-4 rounded-xl grid gap-1 bg-emerald-700 overflow-hidden text-white shadow-lg">
              <p className="text-sm font-black text-emerald-200 uppercase tracking-widest">Campus Rank</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black">TOP #12</p>
                <p className="text-[10px] text-emerald-200/60 font-bold">/ 10,000</p>
              </div>
              <p className="text-[10px] font-bold text-emerald-300">Highest: TOP #12</p>
              <AwardIcon className="absolute text-amber-400/10 -right-4 -top-4 w-16 h-16 group-hover:scale-110 transition-transform" />
            </div>

            {/* STREAK */}
            <div className="relative group p-4 rounded-xl bg-emerald-700 overflow-hidden text-white shadow-lg">
              <p className="text-sm font-black text-emerald-200 uppercase tracking-widest">All Time Streak</p>
              <p className="text-3xl font-black">15 Days</p>
              <FlameIcon className="absolute text-amber-500/10 -right-2 -top-6 w-16 h-16 group-hover:scale-110 transition-transform" />
            </div>

            {/* QR CODE - THE ANCHOR FOR ALIGNMENT */}
            <button 
              onClick={() => setIsQrModalOpen(true)}
              className="w-full p-4 bg-emerald-400 hover:bg-emerald-500 rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-md transform active:scale-95 group">
              <QrCodeIcon size={24} className="text-emerald-900 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900">Show Personal QR</span>
            </button>
          </div>
        </div>

        {/*  RECENT ACTIVITY  */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full min-h-[580px]">
          {/* SUMMARY SECTION */}
          <div className="bg-emerald-50 rounded-2xl h-[180px] border border-emerald-100 flex items-center justify-center relative overflow-hidden shadow-inner group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/20 to-transparent" />
            <p className="text-emerald-900/30 font-black uppercase tracking-[0.3em] text-[10px] relative z-10 transition-colors group-hover:text-emerald-900/50">Summary Insights</p>
          </div>

          {/* RECENT ACTIVITY  */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-emerald-50 overflow-hidden">
            <RecentActivity />
          </div>
        </div>
      </div>

      {/* FOOTER PADDING */}
      <div className="h-12" />

      {/* QR CODE MODAL */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQrModalOpen(false)}
          />
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center transform transition-all z-10">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <XIcon size={20} />
            </button>
            <div className="mb-4 bg-emerald-100 p-3 rounded-full">
              <QrCodeIcon className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1 tracking-tight text-center">Your Personal QR</h3>
            <p className="text-xs text-slate-500 mb-6 text-center font-medium">Scan this QR code at any Reverse Vending Machine to start recycling.</p>

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
            
            <p className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-md mb-6 tracking-widest">
              ID: {userTagId}
            </p>

            <button
              onClick={downloadQR}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
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
