'use client';

import React, { useState, useEffect } from 'react';
// import { QRCodeCanvas } from 'qrcode.react'; // Module not found workaround

const QRPage = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    // Dummy Data
    const userId = "USER:550e8400-e29b-41d4-a716-446655440000";
    const redemptionCode = "REDEEM:8X29B";
    const maintenanceCode = "MAINTENANCE:SECRET-KEY-999";

    // Helper to generate QR URL
    const getQrUrl = (data, color) => {
        // API: https://goqr.me/api/ or similar
        // Using qrserver for simplicity. Color support is limited in free tier, so we use default black
        // but we can try other APIs if needed. For now standard black is fine, or we can use styling.
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans text-slate-900">
            <div className="max-w-5xl w-full">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-2">QR Code Generator</h1>
                    <p className="text-slate-500">System QR Codes for Testing Purposes</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User ID Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-center group-hover:from-blue-600 group-hover:to-indigo-700 transition-colors">
                            <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                                User Identification
                            </h2>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 mb-6 relative">
                                {/* Replaced QRCodeCanvas with img */}
                                <img
                                    src={getQrUrl(userId)}
                                    alt={`QR code for User ID: ${userId}`}
                                    className="w-[200px] h-[200px]"
                                />
                                {/* Decorative corners */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg -mb-1 -mr-1"></div>
                            </div>
                            <div className="w-full bg-slate-50 py-3 px-4 rounded-lg text-center border border-slate-200">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">User ID</p>
                                <code className="text-slate-700 font-mono text-sm break-all font-semibold">{userId}</code>
                            </div>
                        </div>
                    </div>

                    {/* Redemption Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-center group-hover:from-emerald-600 group-hover:to-green-700 transition-colors">
                            <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                                Reward Redemption
                            </h2>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 mb-6 relative">
                                <img
                                    src={getQrUrl(redemptionCode)}
                                    alt={`QR code for Redemption: ${redemptionCode}`}
                                    className="w-[200px] h-[200px]"
                                />
                                {/* Decorative corners */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-lg -mb-1 -mr-1"></div>
                            </div>
                            <div className="w-full bg-slate-50 py-3 px-4 rounded-lg text-center border border-slate-200">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Redemption Code</p>
                                <code className="text-slate-700 font-mono text-sm break-all font-semibold">{redemptionCode}</code>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-slate-100 group">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-center group-hover:from-amber-600 group-hover:to-orange-700 transition-colors">
                            <h2 className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                                Maintenance Access
                            </h2>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 mb-6 relative">
                                <img
                                    src={getQrUrl(maintenanceCode)}
                                    alt={`QR code for Maintenance: ${maintenanceCode}`}
                                    className="w-[200px] h-[200px]"
                                />
                                {/* Decorative corners */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-lg -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-lg -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-lg -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-lg -mb-1 -mr-1"></div>
                            </div>
                            <div className="w-full bg-slate-50 py-3 px-4 rounded-lg text-center border border-slate-200">
                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Access Token</p>
                                <code className="text-slate-700 font-mono text-sm break-all font-semibold">{maintenanceCode}</code>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="mt-16 text-center text-slate-400">
                    <p className="text-sm">
                        ⚠️ Not connected to backend. For UI validation only.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default QRPage;
