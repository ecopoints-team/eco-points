'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import { useAuth } from '../../../src/context/AuthContext';
import * as logsApi from '../../../src/services/api/logs';
import { QrCode, Loader2, X, CheckCircle2, AlertCircle, Camera, CameraOff, Keyboard } from 'lucide-react';

export default function ClaimScannerPage() {
    const { currentUser, isSuperAdmin, effectiveLocationId } = useAuth();
    
    // Scanner / Claiming states
    const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'manual'
    const [cameraPermission, setCameraPermission] = useState(null); // null | 'granted' | 'denied'
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
    const [scanResult, setScanResult] = useState(null);
    
    const manualInputRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    // Autofocus when switching to manual mode
    useEffect(() => {
        if (scanMode === 'manual' && scanStatus === 'idle' && manualInputRef.current) {
            manualInputRef.current.focus();
        }
    }, [scanMode, scanStatus]);

    // Cybernetic synthesizer beep sound effects
    const playBeep = (type = 'success') => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'success') {
                osc.frequency.setValueAtTime(660, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.setValueAtTime(120, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch (e) {
            console.error('Audio synthesizer error:', e);
        }
    };

    // Reusable claim code processor
    const processScanCode = async (code) => {
        const trimmedCode = code.trim();
        if (!trimmedCode) return;

        setScanStatus('processing');
        setScanResult(null);

        // Clean prefix payload (e.g. REDEEM:CODE)
        let parsedCode = trimmedCode;
        if (trimmedCode.toUpperCase().startsWith('REDEEM:')) {
            parsedCode = trimmedCode.slice(7).trim();
        }

        try {
            // Fetch latest rewards logs
            const logsList = await logsApi.getRewards(effectiveLocationId);
            const matchedLog = (logsList || []).find(
                log => (log.redemptionCode && log.redemptionCode.toUpperCase() === parsedCode.toUpperCase())
            );

            if (!matchedLog) {
                playBeep('error');
                setScanStatus('error');
                setScanResult({
                    message: `Redemption code "${parsedCode.toUpperCase()}" not found. Please check the code and try again.`,
                    code: parsedCode.toUpperCase()
                });
                setScanInput('');
                return;
            }

            // Check status constraints
            if (matchedLog.status === 'claimed') {
                playBeep('error');
                setScanStatus('error');
                setScanResult({
                    message: `This reward was already claimed!`,
                    details: {
                        userName: matchedLog.userName,
                        userEmail: matchedLog.userEmail,
                        rewardName: matchedLog.rewardName,
                        claimedAt: matchedLog.claimedAt || matchedLog.timestamp,
                        redemptionCode: matchedLog.redemptionCode
                    }
                });
                setScanInput('');
                return;
            }

            if (matchedLog.status === 'expired') {
                playBeep('error');
                setScanStatus('error');
                setScanResult({
                    message: `This redemption code has expired!`,
                    details: {
                        userName: matchedLog.userName,
                        rewardName: matchedLog.rewardName,
                        redemptionCode: matchedLog.redemptionCode
                    }
                });
                setScanInput('');
                return;
            }

            if (matchedLog.status === 'used') {
                playBeep('error');
                setScanStatus('error');
                setScanResult({
                    message: `This reward is already marked as used!`,
                    details: {
                        userName: matchedLog.userName,
                        rewardName: matchedLog.rewardName,
                        redemptionCode: matchedLog.redemptionCode
                    }
                });
                setScanInput('');
                return;
            }

            // Claim redemption code through backend
            const updated = await logsApi.updateRedemptionStatus(matchedLog.id, 'claimed');
            
            playBeep('success');
            setScanStatus('success');
            setScanResult({
                message: `Success! Reward claimed.`,
                details: {
                    userName: matchedLog.userName,
                    userEmail: matchedLog.userEmail,
                    rewardName: matchedLog.rewardName,
                    pointsCost: matchedLog.pointsSpent || matchedLog.pointsCost || 0,
                    redemptionCode: matchedLog.redemptionCode
                }
            });
            setScanInput('');
        } catch (err) {
            playBeep('error');
            setScanStatus('error');
            setScanResult({
                message: err.message || 'Failed to claim redemption on server.',
                code: parsedCode.toUpperCase()
            });
            setScanInput('');
        }
    };

    const handleScanSubmit = async (e) => {
        if (e) e.preventDefault();
        await processScanCode(scanInput);
    };

    // Camera streaming initialization and disposal
    useEffect(() => {
        let html5QrCode = null;
        let isMounted = true;

        if (scanMode === 'camera' && scanStatus === 'idle') {
            // Lazy import html5-qrcode dynamically
            import('html5-qrcode')
                .then((module) => {
                    if (!isMounted) return;
                    const Html5Qrcode = module.Html5Qrcode;
                    
                    // Delay scanning slightly to make sure the #reader element is fully attached to the DOM
                    setTimeout(() => {
                        if (!isMounted) return;
                        try {
                            html5QrCode = new Html5Qrcode('reader');
                            html5QrCodeRef.current = html5QrCode;

                            html5QrCode.start(
                                { facingMode: 'environment' },
                                {
                                    fps: 10,
                                    qrbox: (width, height) => {
                                        const size = Math.max(50, Math.min(width, height) * 0.7);
                                        return { width: size, height: size };
                                    }
                                },
                                async (decodedText) => {
                                    if (!isMounted) return;
                                    // Code read successfully! Stop stream first
                                    try {
                                        if (html5QrCode && html5QrCode.isScanning) {
                                            await html5QrCode.stop();
                                        }
                                    } catch (e) {
                                        console.error('Failed to stop camera stream on scan:', e);
                                    }
                                    processScanCode(decodedText);
                                },
                                (errorMessage) => {
                                    // Ignore quiet errors
                                }
                            )
                            .then(() => {
                                if (isMounted) {
                                    setCameraPermission('granted');
                                    setIsCameraActive(true);
                                }
                            })
                            .catch((err) => {
                                console.error('Camera initialization failed:', err);
                                if (isMounted) {
                                    setCameraPermission('denied');
                                    setIsCameraActive(false);
                                }
                            });
                        } catch (domErr) {
                            console.error('Html5Qrcode DOM setup error:', domErr);
                        }
                    }, 100);
                })
                .catch((err) => {
                    console.error('Failed to import html5-qrcode:', err);
                });
        }

        return () => {
            isMounted = false;
            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().catch((e) => console.error('Clean-up camera stop failed:', e));
                }
            }
        };
    }, [scanMode, scanStatus]);

    return (
        <>
            <ViewOnlyBanner />
            {/* Page Header */}
            <ViewOnlyWrapper>
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        <QrCode className="text-emerald-500" />
                        Staff Claims Scanner
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Scan student QR codes using your device's camera or enter redemption codes manually.
                    </p>
                </div>
            </ViewOnlyWrapper>

            <div className="flex justify-center mt-12">
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes scan {
                        0% { top: 0%; opacity: 0.3; }
                        50% { top: 100%; opacity: 1; }
                        100% { top: 0%; opacity: 0.3; }
                    }
                    .animate-scan-beam {
                        animation: scan 2.5s linear infinite;
                    }
                    #reader {
                        border: none !important;
                    }
                    #reader video {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: cover !important;
                        border-radius: 1.75rem !important;
                    }
                    #reader__scan_region {
                        background: transparent !important;
                    }
                    #reader__dashboard {
                        display: none !important;
                    }
                `}} />

                <div className="bg-white dark:bg-[#1e293b]/60 backdrop-blur-xl rounded-[3rem] p-8 max-w-md w-full shadow-2xl relative flex flex-col items-center border border-emerald-100 dark:border-emerald-500/20 overflow-hidden">
                    {/* Cybernetic design decoration line */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 animate-pulse" />

                    {/* IDLE STATE */}
                    {scanStatus === 'idle' && (
                        <>
                            {/* Segmented Scan Mode Toggle */}
                            <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl mb-6 w-full max-w-xs border border-slate-200/50 dark:border-slate-800/50 self-center z-10">
                                <button
                                    onClick={() => {
                                        setScanMode('camera');
                                        setScanInput('');
                                    }}
                                    className={`flex-grow py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                                        scanMode === 'camera'
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Camera size={14} />
                                    Live Camera
                                </button>
                                <button
                                    onClick={() => {
                                        setScanMode('manual');
                                        setScanInput('');
                                    }}
                                    className={`flex-grow py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                                        scanMode === 'manual'
                                            ? 'bg-emerald-600 text-white shadow-md'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    <Keyboard size={14} />
                                    Manual Input
                                </button>
                            </div>

                            <h3 className="text-2xl font-black mb-1 text-center text-[#064e3b] dark:text-white" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                                {scanMode === 'camera' ? 'Scan Redemption QR' : 'Manual Verification'}
                            </h3>
                            <p className="text-xs mb-6 text-center text-slate-500 dark:text-slate-400 max-w-[280px]" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                                {scanMode === 'camera' 
                                    ? 'Position the student\'s QR code in front of your webcam to capture details.' 
                                    : 'Type the student\'s unique redemption code below to verify and claim their reward.'
                                }
                            </p>

                            {/* Camera Scanning Viewport */}
                            {scanMode === 'camera' && (
                                <>
                                    {cameraPermission === 'denied' ? (
                                        <div className="w-72 h-72 rounded-[2rem] bg-slate-950 border-2 border-red-500/30 flex flex-col items-center justify-center p-6 text-center shadow-xl shadow-red-500/5 mb-6">
                                            <div className="bg-red-500/10 p-3 rounded-full border border-red-500/20 text-red-500 mb-3 animate-pulse">
                                                <CameraOff size={28} />
                                            </div>
                                            <span className="text-sm font-black text-red-500 leading-tight">Camera Access Blocked</span>
                                            <span className="text-[10px] font-medium text-slate-400 mt-2 max-w-[200px] leading-relaxed">
                                                Please enable camera access in your browser settings, or switch to Manual Input mode.
                                            </span>
                                            <button
                                                onClick={() => setScanMode('manual')}
                                                className="mt-4 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30 hover:border-emerald-500 px-4 py-2 rounded-xl transition-all duration-300 active:scale-95 bg-emerald-500/5"
                                            >
                                                Switch to Manual Input
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-72 h-72 rounded-[2rem] overflow-hidden relative bg-slate-950 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/10 mb-6 group">
                                            {/* Live camera stream */}
                                            <div id="reader" className="w-full h-full relative z-0" />

                                            {/* Reticle borders */}
                                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl z-20" />
                                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl z-20" />
                                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl z-20" />
                                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl z-20" />

                                            {/* Dynamic loading backdrop spinner */}
                                            {!isCameraActive && (
                                                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10">
                                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                                    <span className="text-[10px] font-mono tracking-widest text-emerald-500/70 uppercase">
                                                        Initializing Lens...
                                                    </span>
                                                </div>
                                            )}

                                            {/* Pulse Scanning Laser beam */}
                                            {isCameraActive && (
                                                <div className="absolute inset-x-0 h-[2px] bg-emerald-400 opacity-80 animate-scan-beam z-10" />
                                            )}
                                        </div>
                                    )}
                                    {cameraPermission !== 'denied' && (
                                        <span className="text-[10px] font-mono text-emerald-400/80 mb-6 uppercase tracking-widest animate-pulse">
                                            Align Student QR Code inside Frame
                                        </span>
                                    )}
                                </>
                            )}

                            {/* Manual Code Input Viewport */}
                            {scanMode === 'manual' && (
                                <div className="w-full flex flex-col">
                                    <div className="w-full bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 mb-6 flex flex-col items-center">
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-full border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-3 animate-pulse">
                                            <Keyboard size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-[#064e3b] dark:text-emerald-400">Keyboard Verification Ready</span>
                                        <span className="text-[10px] text-slate-400 mt-1 text-center">Enter the student's unique redemption code below</span>
                                    </div>
                                    
                                    {/* SCANNER INPUT FOR MANUAL VERIFICATION */}
                                    <form onSubmit={handleScanSubmit} className="w-full mt-2">
                                        <input
                                            ref={manualInputRef}
                                            type="text"
                                            value={scanInput}
                                            onChange={(e) => setScanInput(e.target.value)}
                                            placeholder="e.g., REDEEM-XXXX-XXXX"
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-[#064e3b] dark:text-white font-bold text-sm text-center placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all font-mono tracking-wider uppercase shadow-inner"
                                            autoComplete="off"
                                        />
                                        
                                        <button
                                            type="submit"
                                            disabled={!scanInput.trim()}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95 mt-3 cursor-pointer"
                                        >
                                            Verify & Claim Code
                                        </button>
                                    </form>
                                </div>
                            )}
                        </>
                    )}

                    {/* PROCESSING STATE */}
                    {scanStatus === 'processing' && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <Loader2 className="w-16 h-16 animate-spin text-[#10b981] mb-6" />
                            <h3 className="text-2xl font-black text-[#064e3b] dark:text-white mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                                Verifying Redemption
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[240px]" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                                Checking transaction logs and confirming status with the server...
                            </p>
                        </div>
                    )}

                    {/* SUCCESS STATE */}
                    {scanStatus === 'success' && scanResult && (
                        <div className="w-full flex flex-col items-center text-center">
                            <div className="mb-4 bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-full border border-emerald-200 dark:border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-scale-in">
                                <CheckCircle2 size={44} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                                Claim Completed!
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold uppercase tracking-wider font-mono">
                                Receipt Updated Successfully
                            </p>

                            {/* Receipt Details */}
                            <div className="bg-emerald-50/60 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6 w-full text-left mb-6 relative overflow-hidden">
                                <div className="absolute right-3 top-3 opacity-5 text-emerald-950 dark:text-emerald-100">
                                    <CheckCircle2 size={120} />
                                </div>
                                <div className="mb-3.5 pb-3 border-b border-dashed border-emerald-200 dark:border-emerald-800/50">
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block leading-none mb-1">
                                        Reward Redeemed
                                    </span>
                                    <span className="text-lg font-black text-[#064e3b] dark:text-white leading-tight block" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                                        {scanResult.details.rewardName}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                                            Student Account
                                        </span>
                                        <span className="text-[#064e3b] dark:text-slate-200 truncate block">
                                            {scanResult.details.userName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                                            Code Verified
                                        </span>
                                        <span className="font-mono text-emerald-700 dark:text-emerald-400 tracking-wider block">
                                            {scanResult.details.redemptionCode}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <button
                                    onClick={() => {
                                        setScanStatus('idle');
                                        setScanResult(null);
                                        setScanInput('');
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95"
                                >
                                    Scan Another
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {scanStatus === 'error' && scanResult && (
                        <div className="w-full flex flex-col items-center text-center">
                            <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-full border border-red-200 dark:border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-scale-in">
                                <AlertCircle size={44} />
                            </div>
                            
                            <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>
                                Verification Failed
                            </h3>
                            <p className="text-xs text-slate-400 mb-6 font-semibold uppercase tracking-wider font-mono">
                                Claim Blocked
                            </p>

                            {/* Error Box */}
                            <div className="bg-red-50/60 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 rounded-3xl p-6 w-full text-left mb-6">
                                <p className="text-red-800 dark:text-red-300 text-sm font-semibold mb-3 leading-relaxed">
                                    {scanResult.message}
                                </p>
                                
                                {scanResult.details && (
                                    <div className="border-t border-dashed border-red-200 dark:border-red-500/30 pt-3.5 grid grid-cols-2 gap-4 text-xs font-bold">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                                                Assigned User
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-200 truncate block">
                                                {scanResult.details.userName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">
                                                Reward Details
                                            </span>
                                            <span className="text-slate-700 dark:text-slate-200 truncate block">
                                                {scanResult.details.rewardName}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full">
                                <button
                                    onClick={() => {
                                        setScanStatus('idle');
                                        setScanResult(null);
                                        setScanInput('');
                                    }}
                                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-md transition-all active:scale-95"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
