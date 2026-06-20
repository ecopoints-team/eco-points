'use client';
import { useState, useEffect, useCallback } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/components/admin/AdminLayout';
import RequirePermission from '../../../src/components/admin/RequirePermission';
import CustomDropdown from '../../../src/components/admin/CustomDropdown';
import { useAuth } from '../../../src/context/AuthContext';
import { settings as settingsApi } from '../../../src/services/api';
import { formatField } from '../../../src/lib/formatField';
import { notificationChannelLabel } from '../../../src/lib/enumLabels';
import {
    Settings, Bell, Shield, Save, ToggleLeft, ToggleRight,
    Zap, Recycle, Palette, Plus, X, Send, Mail,
    Clock, RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
    LogOut, History, Lock, ShieldCheck, Info,
    HardDrive, FlaskConical, Download, Upload, Trash2, Database, Loader2, FileJson, AlertCircle
} from 'lucide-react';

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        <button onClick={onChange} type="button">
            {enabled
                ? <ToggleRight size={32} className="text-emerald-600 dark:text-emerald-400" />
                : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />
            }
        </button>
    </div>
);

function SettingsPageContent() {
    const { effectiveLocationId } = useAuth();

    // ── Tab state ──
    const [activeSection, setActiveSection] = useState('appearance');
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // ── Notification settings (API-backed) ──
    const [notifSettings, setNotifSettings] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [notifLogs, setNotifLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);

    // ── Test notification ──
    const [testChannel, setTestChannel] = useState('email');
    const [testRecipient, setTestRecipient] = useState('');
    const [testSending, setTestSending] = useState(false);

    // ── Recipient management ──
    const [newRecipient, setNewRecipient] = useState('');
    const [editingAlertKey, setEditingAlertKey] = useState(null);

    // ── Security settings (API-backed) ──
    const [securityConfig, setSecurityConfig] = useState(null);
    const [securityLoading, setSecurityLoading] = useState(false);
    const [loginHistory, setLoginHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [forceLogoutLoading, setForceLogoutLoading] = useState(false);

    // ── Backup & Restore ──
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreFileName, setRestoreFileName] = useState('');
    const [backupMessage, setBackupMessage] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

    // ── Test Data (Seed) ──
    const [seedLoading, setSeedLoading] = useState(false);
    const [seedStatus, setSeedStatus] = useState({ status: 'idle', message: '', percent: 0 });
    const [showTruncateConfirm, setShowTruncateConfirm] = useState(false);
    const [truncateLoading, setTruncateLoading] = useState(false);
    const [seedMessage, setSeedMessage] = useState(null);

    // ═══ LOAD NOTIFICATION SETTINGS ═══
    const loadNotifSettings = useCallback(async () => {
        setNotifLoading(true);
        try {
            const { settings: s } = await settingsApi.getNotifications(effectiveLocationId);
            setNotifSettings(s);
        } catch (err) {
            console.error('Failed to load notification settings:', err);
        }
        setNotifLoading(false);
    }, [effectiveLocationId]);

    // ═══ LOAD NOTIFICATION LOGS ═══
    const loadNotifLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const logs = await settingsApi.getNotificationLogs(effectiveLocationId);
            setNotifLogs(logs || []);
        } catch (err) {
            console.error('Failed to load notification logs:', err);
        }
        setLogsLoading(false);
    }, [effectiveLocationId]);

    // ═══ LOAD SECURITY CONFIG ═══
    const loadSecurityConfig = useCallback(async () => {
        setSecurityLoading(true);
        try {
            const config = await settingsApi.getSecurityConfig(effectiveLocationId);
            setSecurityConfig(config);
        } catch (err) {
            console.error('Failed to load security config:', err);
            setSecurityConfig({ twoFactorRequired: false, twoFactorMethod: 'email', sessionTimeoutMinutes: 1440, maxLoginAttempts: 5, lockoutDurationMinutes: 15 });
        }
        setSecurityLoading(false);
    }, [effectiveLocationId]);

    // ═══ LOAD LOGIN HISTORY ═══
    const loadLoginHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const history = await settingsApi.getLoginHistory(effectiveLocationId);
            setLoginHistory(history || []);
        } catch (err) {
            console.error('Failed to load login history:', err);
        }
        setHistoryLoading(false);
    }, [effectiveLocationId]);

    // Auto-load when tab changes
    useEffect(() => {
        if (activeSection === 'notifications' && notifSettings.length === 0) loadNotifSettings();
        if (activeSection === 'security' && !securityConfig) loadSecurityConfig();
    }, [activeSection, notifSettings.length, securityConfig, loadNotifSettings, loadSecurityConfig]);

    // ═══ SAVE HANDLERS ═══
    const flashSave = (msg, isError = false) => {
        setSaveMessage({ text: msg, isError });
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleSaveNotifications = async () => {
        setSaving(true);
        try {
            const payload = notifSettings
                .filter(s => s.alertKey !== 'config_points')
                .map(s => ({
                    alertKey: s.alertKey,
                    emailEnabled: s.emailEnabled,
                    smsEnabled: s.smsEnabled,
                    threshold: s.threshold,
                    recipients: s.recipients,
                    isActive: s.isActive,
                }));
            await settingsApi.updateNotifications(payload, effectiveLocationId);
            flashSave('Notification settings saved!');
            setHasChanges(false);
        } catch (err) {
            flashSave(err.message || 'Failed to save notification settings', true);
        }
        setSaving(false);
    };

    const handleSaveSecurity = async () => {
        if (!securityConfig) return;
        setSaving(true);
        try {
            await settingsApi.updateSecurityConfig(securityConfig, effectiveLocationId);
            flashSave('Security settings saved!');
            setHasChanges(false);
        } catch (err) { flashSave(err.message || 'Failed to save security settings', true); }
        setSaving(false);
    };

    const handleForceLogout = async () => {
        if (!confirm('Are you sure you want to terminate ALL other admin sessions?')) return;
        setForceLogoutLoading(true);
        try {
            await settingsApi.forceLogoutAll(effectiveLocationId);
            flashSave('All admin sessions have been terminated');
        } catch (err) { flashSave(err.message || 'Failed to force logout', true); }
        setForceLogoutLoading(false);
    };

    const handleSave = () => {
        if (activeSection === 'notifications') handleSaveNotifications();
        else if (activeSection === 'security') handleSaveSecurity();
        else { setHasChanges(false); flashSave('Settings saved!'); }
    };

    // ═══ TEST NOTIFICATION ═══
    const handleTestNotification = async () => {
        if (!testRecipient) return;
        setTestSending(true);
        try {
            await settingsApi.testNotification(testChannel, testRecipient);
            flashSave(`Test ${testChannel} sent to ${testRecipient}`);
        } catch (err) {
            flashSave(err.message || 'Failed to send test notification', true);
        }
        setTestSending(false);
    };

    // ═══ NOTIFICATION SETTING HELPERS ═══
    const updateNotifSetting = (alertKey, field, value) => {
        setNotifSettings(prev => prev.map(s =>
            s.alertKey === alertKey ? { ...s, [field]: value } : s
        ));
        setHasChanges(true);
    };

    const addRecipientToAlert = (alertKey) => {
        if (!newRecipient.trim()) return;
        setNotifSettings(prev => prev.map(s => {
            if (s.alertKey !== alertKey) return s;
            if (s.recipients.includes(newRecipient.trim())) return s;
            return { ...s, recipients: [...s.recipients, newRecipient.trim()] };
        }));
        setNewRecipient('');
        setHasChanges(true);
    };

    const removeRecipientFromAlert = (alertKey, recipient) => {
        setNotifSettings(prev => prev.map(s => {
            if (s.alertKey !== alertKey) return s;
            return { ...s, recipients: s.recipients.filter(r => r !== recipient) };
        }));
        setHasChanges(true);
    };

    const updateSecurityField = (key, value) => {
        setSecurityConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    // ═══ CATEGORY HELPERS ═══
    const categoryLabels = {
        inventory: { label: 'Inventory', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        hardware: { label: 'Hardware', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        activity: { label: 'Activity', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        reports: { label: 'Reports', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        security: { label: 'Security', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    };

    // ═══ BACKUP & RESTORE HANDLERS ═══
    const handleBackupDownload = async () => {
        setBackupLoading(true);
        setBackupMessage(null);
        try {
            const data = await settingsApi.downloadBackup();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ecopoints-backup-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setBackupMessage({ type: 'success', text: `Backup created (${data.meta?.total_rows || 0} rows)` });
        } catch (err) {
            setBackupMessage({ type: 'error', text: err.message || 'Backup failed' });
        }
        setBackupLoading(false);
    };

    const handleRestoreFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setRestoreFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.meta || !parsed.tables) throw new Error('Invalid format');
                setRestoreFile(parsed);
                setBackupMessage(null);
            } catch {
                setBackupMessage({ type: 'error', text: 'Invalid backup file format' });
                setRestoreFile(null);
            }
        };
        reader.readAsText(file);
    };

    const handleRestore = async () => {
        if (!restoreFile) return;
        setRestoreLoading(true);
        setShowRestoreConfirm(false);
        setBackupMessage(null);
        try {
            const result = await settingsApi.restoreBackup(restoreFile);
            setBackupMessage({ type: 'success', text: result.message || 'Restored successfully' });
            setRestoreFile(null);
            setRestoreFileName('');
        } catch (err) {
            setBackupMessage({ type: 'error', text: err.message || 'Restore failed' });
        }
        setRestoreLoading(false);
    };

    // ═══ TEST DATA (SEED) HANDLERS ═══
    const handleGenerateSeed = async () => {
        setSeedLoading(true);
        setSeedMessage(null);
        try {
            await settingsApi.startSeed('demo');
            setSeedStatus({ status: 'running', message: 'Starting demo seed...', percent: 10 });
            // Poll status
            const poll = setInterval(async () => {
                try {
                    const s = await settingsApi.getSeedStatus();
                    setSeedStatus({ status: s.status, message: s.message, percent: s.percent });
                    if (s.status === 'done' || s.status === 'error') {
                        clearInterval(poll);
                        setSeedLoading(false);
                        setSeedMessage({ type: s.status === 'done' ? 'success' : 'error', text: s.message });
                    }
                } catch { clearInterval(poll); setSeedLoading(false); }
            }, 2000);
        } catch (err) {
            setSeedMessage({ type: 'error', text: err.message || 'Failed to start seeding' });
            setSeedLoading(false);
        }
    };

    const handleTruncate = async () => {
        setTruncateLoading(true);
        setShowTruncateConfirm(false);
        setSeedMessage(null);
        try {
            const result = await settingsApi.startSeed('truncate');
            setSeedMessage({ type: 'success', text: result.message || 'All tables truncated' });
        } catch (err) {
            setSeedMessage({ type: 'error', text: err.message || 'Truncate failed' });
        }
        setTruncateLoading(false);
    };

    const sections = [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'backup', label: 'Backup & Restore', icon: HardDrive },
        { id: 'testdata', label: 'Test Data', icon: FlaskConical },
    ];

    return (
        <>
            <ViewOnlyBanner />
            <ViewOnlyWrapper>
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400">Configure system settings</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {saveMessage && (
                            <span className={`text-sm font-medium flex items-center gap-1 ${saveMessage.isError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {saveMessage.isError ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                {saveMessage.text}
                            </span>
                        )}
                        {hasChanges && (
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg disabled:opacity-50">
                                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                Save
                            </button>
                        )}
                    </div>
                </div>
            </ViewOnlyWrapper>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Settings size={18} className="text-emerald-600 dark:text-emerald-400" /> Settings
                            </h3>
                        </div>
                        <div className="p-2">
                            {sections.map(s => (
                                <button key={s.id} onClick={() => setActiveSection(s.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === s.id
                                        ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }`}>
                                    <s.icon size={18} />{s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">


                        {/* ═══ APPEARANCE ═══ */}
                        {activeSection === 'appearance' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Appearance</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the visual style of the dashboard</p>
                            </div>
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <Palette size={36} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Coming Soon</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                                    Appearance styles such as Retro, Eco, and more will be available in a future update.
                                    For theme mode (Light, Neutral, Dark, System), use the toggle at the top of the dashboard.
                                </p>
                            </div>
                        </>)}

                        {/* ═══ NOTIFICATIONS ═══ */}
                        {activeSection === 'notifications' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notification Alerts</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure which alerts are sent and via email</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {notifLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw size={24} className="animate-spin text-emerald-500" />
                                    </div>
                                ) : (<>
                                    {/* Alert Matrix */}
                                    <div className="space-y-3">
                                        {notifSettings.filter(s => !s.alertKey.startsWith('config_')).map(setting => {
                                            const cat = categoryLabels[setting.category] || categoryLabels.activity;
                                            const isExpanded = editingAlertKey === setting.alertKey;
                                            return (
                                                <div key={setting.alertKey} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                    <div className="p-4 flex items-center justify-between bg-white dark:bg-slate-800/30">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <button onClick={() => updateNotifSetting(setting.alertKey, 'isActive', !setting.isActive)} type="button">
                                                                {setting.isActive
                                                                    ? <ToggleRight size={24} className="text-emerald-600 dark:text-emerald-400" />
                                                                    : <ToggleLeft size={24} className="text-slate-300 dark:text-slate-600" />
                                                                }
                                                            </button>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-semibold text-sm ${setting.isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                                                                        {setting.label}
                                                                    </span>
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${cat.color} ${cat.bg}`}>
                                                                        {cat.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{setting.description}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => setEditingAlertKey(isExpanded ? null : setting.alertKey)} type="button"
                                                            className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                                            {setting.threshold !== null && setting.threshold !== undefined && (
                                                                <div className="flex items-center gap-3">
                                                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Threshold:</label>
                                                                    <input type="number" min="0" value={setting.threshold || 0}
                                                                        onChange={(e) => updateNotifSetting(setting.alertKey, 'threshold', parseInt(e.target.value) || 0)}
                                                                        className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-center outline-none text-slate-700 dark:text-slate-200 focus:border-emerald-500" />
                                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                        {setting.alertKey === 'low_reward_stock' && '(stock qty)'}
                                                                        {setting.alertKey === 'maintenance_unresolved' && '(hours)'}
                                                                        {setting.alertKey === 'suspicious_activity' && '(points)'}
                                                                        {setting.alertKey === 'machine_capacity_high' && '(% full)'}
                                                                        {setting.alertKey === 'failed_login_alert' && '(attempts)'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Recipients:</label>
                                                                <div className="flex flex-wrap gap-2 mb-2">
                                                                    {setting.recipients.map((r, i) => (
                                                                        <span key={i} className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium">
                                                                            <Mail size={12} />
                                                                            {r}
                                                                            <button onClick={() => removeRecipientFromAlert(setting.alertKey, r)} type="button"
                                                                                className="hover:text-red-500 ml-1"><X size={12} /></button>
                                                                        </span>
                                                                    ))}
                                                                    {setting.recipients.length === 0 && (
                                                                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">No recipients configured</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <input type="text" placeholder="Email address" value={newRecipient}
                                                                        onChange={(e) => setNewRecipient(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && addRecipientToAlert(setting.alertKey)}
                                                                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500" />
                                                                    <button onClick={() => addRecipientToAlert(setting.alertKey)} type="button"
                                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500">
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Test Notification */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <Send size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            Send Test Notification
                                        </h4>
                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Email Address</label>
                                                <input type="email" placeholder="admin@example.com" value={testRecipient}
                                                    onChange={(e) => setTestRecipient(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none text-slate-700 dark:text-slate-200 focus:border-emerald-500" />
                                            </div>
                                            <button onClick={handleTestNotification} disabled={testSending || !testRecipient}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2">
                                                {testSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                                Send Test
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notification History */}
                                    <div>
                                        <button onClick={() => { setShowLogs(!showLogs); if (!showLogs && notifLogs.length === 0) loadNotifLogs(); }} type="button"
                                            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                                            <Clock size={16} />
                                            Notification History
                                            {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                        {showLogs && (
                                            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                                {logsLoading ? (
                                                    <div className="flex justify-center py-6"><RefreshCw size={20} className="animate-spin text-emerald-500" /></div>
                                                ) : notifLogs.length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500">No notification logs yet</div>
                                                ) : (
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Time</th>
                                                                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Alert</th>
                                                                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Channel</th>
                                                                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Recipient</th>
                                                                <th className="px-3 py-2 text-left text-slate-500 dark:text-slate-400 font-semibold">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                            {notifLogs.map(log => (
                                                                <tr key={log.id}>
                                                                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}</td>
                                                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{formatField(log.alertKey)}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${log.channel === 'email' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'}`}>
                                                                            {notificationChannelLabel(log.channel)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{formatField(log.recipient)}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                                            {formatField(log.status)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </>)}
                            </div>
                        </>)}

                        {/* ═══ SECURITY ═══ */}
                        {activeSection === 'security' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Shield size={20} className="text-emerald-600" /> Security Settings
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure authentication, sessions, and account protection</p>
                            </div>
                            {securityLoading || !securityConfig ? (
                                <div className="p-12 text-center text-slate-400"><RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading...</div>
                            ) : (
                            <div className="p-6 space-y-8">
                                {/* 2FA Section */}
                                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/30 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl"><ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400" /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Two-Factor Authentication</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to admin accounts</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch enabled={securityConfig.twoFactorRequired}
                                        onChange={() => updateSecurityField('twoFactorRequired', !securityConfig.twoFactorRequired)}
                                        label="Require 2FA for all admins" description="When enabled, all admins must verify via OTP on login" />
                                    {securityConfig.twoFactorRequired && (
                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default 2FA Method</label>
                                            <CustomDropdown value={securityConfig.twoFactorMethod}
                                                onChange={(v) => updateSecurityField('twoFactorMethod', v)}
                                                options={[{ value: 'email', label: 'Email OTP' }, { value: 'sms', label: 'SMS OTP' }]} showPlaceholder={false} />
                                        </div>
                                    )}
                                </div>

                                {/* Session Management */}
                                <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl"><Clock size={20} className="text-amber-600 dark:text-amber-400" /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Session Management</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Control session duration and active sessions</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Session Timeout (minutes)</label>
                                        <input type="number" min="5" max="10080" value={securityConfig.sessionTimeoutMinutes}
                                            onChange={(e) => updateSecurityField('sessionTimeoutMinutes', parseInt(e.target.value) || 1440)}
                                            className="w-40 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                        <p className="text-xs text-slate-400 mt-1">Admins will be logged out after this period of inactivity (5 min — 7 days)</p>
                                    </div>
                                    <button onClick={handleForceLogout} disabled={forceLogoutLoading}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                                        <LogOut size={16} /> {forceLogoutLoading ? 'Terminating...' : 'Force Logout All Sessions'}
                                    </button>
                                </div>

                                {/* Login Protection */}
                                <div className="bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-200/50 dark:border-red-800/30 p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl"><Lock size={20} className="text-red-600 dark:text-red-400" /></div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Login Protection</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Prevent brute-force attacks with lockout</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Max Login Attempts</label>
                                            <input type="number" min="3" max="20" value={securityConfig.maxLoginAttempts}
                                                onChange={(e) => updateSecurityField('maxLoginAttempts', parseInt(e.target.value) || 5)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Lockout Duration (minutes)</label>
                                            <input type="number" min="5" max="1440" value={securityConfig.lockoutDurationMinutes}
                                                onChange={(e) => updateSecurityField('lockoutDurationMinutes', parseInt(e.target.value) || 15)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                        </div>
                                    </div>
                                    {/* Login History */}
                                    <button onClick={() => { setShowHistory(!showHistory); if (!showHistory && loginHistory.length === 0) loadLoginHistory(); }}
                                        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        <History size={16} /> {showHistory ? 'Hide' : 'View'} Login History
                                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                    {showHistory && (
                                        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                            {historyLoading ? (
                                                <div className="p-4 text-center"><RefreshCw size={16} className="animate-spin mx-auto text-emerald-500" /></div>
                                            ) : loginHistory.length === 0 ? (
                                                <p className="p-4 text-center text-sm text-slate-400">No login history available</p>
                                            ) : (
                                                <table className="w-full text-xs">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Time</th>
                                                            <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Admin</th>
                                                            <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Action</th>
                                                            <th className="px-3 py-2 text-left text-slate-600 dark:text-slate-300">Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {loginHistory.slice(0, 50).map(h => (
                                                            <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}</td>
                                                                <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{formatField(h.adminName)}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.action?.includes('2FA') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                                                        {formatField(h.action)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatField(h.ipAddress)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Audit Logging Info */}
                                <div className="flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                                    <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Audit Logging is Always Active</p>
                                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">All admin actions are automatically logged and visible in the Access Logs page.</p>
                                    </div>
                                </div>
                            </div>
                            )}
                        </>)}


                        {/* ═══ BACKUP & RESTORE ═══ */}
                        {activeSection === 'backup' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Backup & Restore</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Download a full backup or restore from a previous one</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Status messages */}
                                {backupMessage && (
                                    <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                                        backupMessage.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {backupMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {backupMessage.text}
                                    </div>
                                )}

                                {/* Create Backup */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <Download size={20} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Create Backup</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Download a full JSON backup of all database tables</p>
                                        </div>
                                    </div>
                                    <button onClick={handleBackupDownload} disabled={backupLoading}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 transition-all">
                                        {backupLoading ? <><Loader2 size={16} className="animate-spin" /> Creating Backup...</> : <><Database size={16} /> Download Backup</>}
                                    </button>
                                </div>

                                {/* Restore from Backup */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                            <Upload size={20} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Restore from Backup</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Upload a JSON backup file to restore all data</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 mb-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-200/50 dark:border-red-800/30">
                                        <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                            WARNING: Restoring will permanently REPLACE all existing data with the backup contents. This action cannot be undone.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-600">
                                            <FileJson size={16} /> {restoreFileName || 'Choose .json file'}
                                            <input type="file" accept=".json" onChange={handleRestoreFileSelect} className="hidden" />
                                        </label>
                                        <button onClick={() => setShowRestoreConfirm(true)} disabled={!restoreFile || restoreLoading}
                                            className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-500 disabled:opacity-50 flex items-center gap-2 transition-all">
                                            {restoreLoading ? <><Loader2 size={16} className="animate-spin" /> Restoring...</> : <><Upload size={16} /> Restore Backup</>}
                                        </button>
                                    </div>
                                    {restoreFile && (
                                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-medium">File:</span> {restoreFileName} • <span className="font-medium">Tables:</span> {restoreFile.meta?.table_count || '?'} • <span className="font-medium">Rows:</span> {restoreFile.meta?.total_rows?.toLocaleString() || '?'} • <span className="font-medium">Created:</span> {restoreFile.meta?.created_at ? new Date(restoreFile.meta.created_at).toLocaleString() : '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Restore Confirmation Modal */}
                                {showRestoreConfirm && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                                            <div className="text-center mb-4">
                                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                                    <AlertTriangle size={24} className="text-red-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Restore</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                    This will <span className="font-bold text-red-600">permanently replace</span> all existing data with the backup. Are you sure?
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setShowRestoreConfirm(false)}
                                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                                                    Cancel
                                                </button>
                                                <button onClick={handleRestore}
                                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-all">
                                                    Yes, Restore
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>)}


                        {/* ═══ TEST DATA ═══ */}
                        {activeSection === 'testdata' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Test Data</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate demo data for testing or clear all tables</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Status messages */}
                                {seedMessage && (
                                    <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
                                        seedMessage.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}>
                                        {seedMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {seedMessage.text}
                                    </div>
                                )}

                                {/* Generate Test Data */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                            <Database size={20} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 dark:text-white">Generate Demo Data</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Creates 50 users with 2020-2026 activity data (sessions, transactions, rewards)</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    {seedLoading && (
                                        <div className="mb-4 space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    {seedStatus.message || 'Generating...'}
                                                </span>
                                                <span>{seedStatus.percent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${seedStatus.percent}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={handleGenerateSeed} disabled={seedLoading}
                                        className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 disabled:opacity-50 flex items-center gap-2 transition-all">
                                        {seedLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><FlaskConical size={16} /> Generate Demo Data</>}
                                    </button>
                                </div>

                                {/* Truncate All Tables */}
                                <div className="border border-red-200 dark:border-red-800/50 rounded-xl p-5 bg-red-50/30 dark:bg-red-900/5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                                            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-red-700 dark:text-red-400">Clear All Data</h4>
                                            <p className="text-xs text-red-600/70 dark:text-red-400/70">Truncate ALL database tables. This permanently deletes all data.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowTruncateConfirm(true)} disabled={truncateLoading || seedLoading}
                                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 disabled:opacity-50 flex items-center gap-2 transition-all">
                                        {truncateLoading ? <><Loader2 size={16} className="animate-spin" /> Truncating...</> : <><Trash2 size={16} /> Truncate All Tables</>}
                                    </button>
                                </div>

                                {/* Truncate Confirmation Modal */}
                                {showTruncateConfirm && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                                            <div className="text-center mb-4">
                                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                                    <Trash2 size={24} className="text-red-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Confirm Truncate</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                                    This will <span className="font-bold text-red-600">permanently delete ALL data</span> from every table. This cannot be undone.
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setShowTruncateConfirm(false)}
                                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                                                    Cancel
                                                </button>
                                                <button onClick={handleTruncate}
                                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-500 transition-all">
                                                    Yes, Delete All
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </>
    );
}


// ─── Phase 2: page guard wrapper ────────────────────────────────────
export default function SettingsPage() {
    return (
        <RequirePermission category="settings">
            <SettingsPageContent />
        </RequirePermission>
    );
}
