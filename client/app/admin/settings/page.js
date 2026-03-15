'use client';
import { useState, useEffect, useCallback } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import CustomDropdown from '../../../src/Components/CustomDropdown';
import { useAuth } from '../../../src/context/AuthContext';
import { settings as settingsApi } from '../../../src/services/apiService';
import {
    Settings, Bell, Shield, Save, ToggleLeft, ToggleRight,
    Zap, Recycle, Palette, Plus, X, Send, Mail, Smartphone, Phone,
    Clock, RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
    LogOut, History, Lock, ShieldCheck, Info
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

export default function SettingsPage() {
    const { effectiveLocationId } = useAuth();

    // ── Tab state ──
    const [activeSection, setActiveSection] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // ── Channel config (Email & SMS — API-backed) ──
    const [channelConfig, setChannelConfig] = useState(null);
    const [channelLoading, setChannelLoading] = useState(false);

    // ── Points config (API-backed) ──
    const [pointsConfig, setPointsConfig] = useState(null);
    const [pointsLoading, setPointsLoading] = useState(false);

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

    // ═══ LOAD CHANNEL CONFIG ═══
    const loadChannelConfig = useCallback(async () => {
        setChannelLoading(true);
        try {
            const config = await settingsApi.getChannelConfig(effectiveLocationId);
            setChannelConfig(config);
        } catch (err) {
            console.error('Failed to load channel config:', err);
            setChannelConfig({ emailRecipient: '', smsRecipient: '', emailEnabled: false, smsEnabled: false });
        }
        setChannelLoading(false);
    }, [effectiveLocationId]);

    // ═══ LOAD POINTS CONFIG ═══
    const loadPointsConfig = useCallback(async () => {
        setPointsLoading(true);
        try {
            const config = await settingsApi.getPointsConfig(effectiveLocationId);
            setPointsConfig(config);
        } catch (err) {
            console.error('Failed to load points config:', err);
            setPointsConfig({
                smallWithLabel: 5, smallNoLabel: 3,
                mediumWithLabel: 8, mediumNoLabel: 5,
                largeWithLabel: 10, largeNoLabel: 7,
            });
        }
        setPointsLoading(false);
    }, [effectiveLocationId]);

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
        if (activeSection === 'general' && !channelConfig) loadChannelConfig();
        if (activeSection === 'points' && !pointsConfig) loadPointsConfig();
        if (activeSection === 'notifications' && notifSettings.length === 0) loadNotifSettings();
        if (activeSection === 'security' && !securityConfig) loadSecurityConfig();
    }, [activeSection, channelConfig, pointsConfig, notifSettings.length, securityConfig, loadChannelConfig, loadPointsConfig, loadNotifSettings, loadSecurityConfig]);

    // ═══ SAVE HANDLERS ═══
    const flashSave = (msg, isError = false) => {
        setSaveMessage({ text: msg, isError });
        setTimeout(() => setSaveMessage(null), 3000);
    };

    const handleSavePoints = async () => {
        if (!pointsConfig) return;
        setSaving(true);
        try {
            await settingsApi.updatePointsConfig(pointsConfig, effectiveLocationId);
            flashSave('Points configuration saved!');
            setHasChanges(false);
        } catch (err) {
            flashSave(err.message || 'Failed to save points config', true);
        }
        setSaving(false);
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

    const handleSaveChannels = async () => {
        if (!channelConfig) return;
        setSaving(true);
        try {
            await settingsApi.updateChannelConfig(channelConfig, effectiveLocationId);
            flashSave('Email & SMS configuration saved!');
            setHasChanges(false);
        } catch (err) { flashSave(err.message || 'Failed to save channel config', true); }
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
        if (activeSection === 'general') handleSaveChannels();
        else if (activeSection === 'points') handleSavePoints();
        else if (activeSection === 'notifications') handleSaveNotifications();
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

    // ═══ POINTS HELPERS ═══
    const updatePointsField = (key, value) => {
        setPointsConfig(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
        setHasChanges(true);
    };

    const updateChannelField = (key, value) => {
        setChannelConfig(prev => ({ ...prev, [key]: value }));
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

    const sections = [
        { id: 'general', label: 'Email & SMS', icon: Mail },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'points', label: 'Points Config', icon: Zap },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
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

                        {/* ═══ EMAIL & SMS CONFIGURATION ═══ */}
                        {activeSection === 'general' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Mail size={20} className="text-emerald-600" /> Email & SMS Configuration
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure where system notification alerts will be sent</p>
                            </div>
                            {channelLoading || !channelConfig ? (
                                <div className="p-12 text-center text-slate-400"><RefreshCw size={24} className="animate-spin mx-auto mb-2" />Loading...</div>
                            ) : (
                            <div className="p-6 space-y-8">
                                {/* Email Config */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl"><Mail size={20} className="text-blue-600 dark:text-blue-400" /></div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-white">Email Notifications</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Receive system alerts via email</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch enabled={channelConfig.emailEnabled}
                                            onChange={() => updateChannelField('emailEnabled', !channelConfig.emailEnabled)} />
                                    </div>
                                    {channelConfig.emailEnabled && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                            <input type="email" value={channelConfig.emailRecipient}
                                                onChange={(e) => updateChannelField('emailRecipient', e.target.value)}
                                                placeholder="admin@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                        </div>
                                    )}
                                </div>
                                {/* SMS Config */}
                                <div className="bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl"><Smartphone size={20} className="text-purple-600 dark:text-purple-400" /></div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-white">SMS Notifications</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Receive system alerts via SMS</p>
                                            </div>
                                        </div>
                                        <ToggleSwitch enabled={channelConfig.smsEnabled}
                                            onChange={() => updateChannelField('smsEnabled', !channelConfig.smsEnabled)} />
                                    </div>
                                    {channelConfig.smsEnabled && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number (PH)</label>
                                            <input type="tel" value={channelConfig.smsRecipient}
                                                onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); updateChannelField('smsRecipient', v); }}
                                                placeholder="09171234567" maxLength={11}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                            <p className="text-xs text-slate-400 mt-1.5">11-digit Philippine mobile number starting with 09</p>
                                            {channelConfig.smsRecipient && channelConfig.smsRecipient.length > 0 && (!channelConfig.smsRecipient.startsWith('09') || channelConfig.smsRecipient.length !== 11) && (
                                                <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Must be 11 digits starting with 09</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Info Note */}
                                <div className="flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                                    <Info size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Configure <strong>which notifications</strong> are sent to these addresses in the <strong>Notifications</strong> tab.
                                    </p>
                                </div>
                            </div>
                            )}
                        </>)}

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

                        {/* ═══ POINTS CONFIG ═══ */}
                        {activeSection === 'points' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Points Configuration</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Points per bottle by size and condition — saved per organization</p>
                            </div>
                            <div className="p-6 space-y-4">
                                {pointsLoading || !pointsConfig ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw size={24} className="animate-spin text-emerald-500" />
                                    </div>
                                ) : (<>
                                    {[
                                        { size: 'Small', range: '290–350ml', withKey: 'smallWithLabel', noKey: 'smallNoLabel' },
                                        { size: 'Medium', range: '351–500ml', withKey: 'mediumWithLabel', noKey: 'mediumNoLabel' },
                                        { size: 'Large', range: '750–1000ml', withKey: 'largeWithLabel', noKey: 'largeNoLabel' },
                                    ].map(item => (
                                        <div key={item.size} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Recycle size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{item.size}</span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">({item.range})</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-600 dark:text-slate-400">With Label</span>
                                                        <input type="number" min="0" value={pointsConfig[item.withKey]}
                                                            onChange={(e) => updatePointsField(item.withKey, e.target.value)}
                                                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-emerald-600 dark:text-emerald-400 outline-none" />
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">pts</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-600 dark:text-slate-400">No Label</span>
                                                        <input type="number" min="0" value={pointsConfig[item.noKey]}
                                                            onChange={(e) => updatePointsField(item.noKey, e.target.value)}
                                                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-amber-600 dark:text-amber-400 outline-none" />
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
                                        <strong>Invalid (1001ml+):</strong> Always rejected — 0 points
                                    </div>
                                </>)}
                            </div>
                        </>)}

                        {/* ═══ NOTIFICATIONS ═══ */}
                        {activeSection === 'notifications' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notification Alerts</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure which alerts are sent and via which channels</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {notifLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw size={24} className="animate-spin text-emerald-500" />
                                    </div>
                                ) : (<>
                                    {/* SMTP/Twilio Config Notice */}
                                    <div className="flex items-start gap-3 p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
                                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Email & SMS Credentials Required</p>
                                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                                                To send notifications, configure your SMTP (email) or Twilio (SMS) credentials in the server <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-[11px]">.env</code> file. See <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-[11px]">.env.example</code> for setup instructions.
                                            </p>
                                        </div>
                                    </div>

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
                                                        <div className="flex items-center gap-4 shrink-0">
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => updateNotifSetting(setting.alertKey, 'emailEnabled', !setting.emailEnabled)}
                                                                    disabled={!setting.isActive} type="button"
                                                                    className={`p-1.5 rounded-lg transition-colors ${setting.emailEnabled && setting.isActive
                                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                                                                        } disabled:opacity-40`} title="Email">
                                                                    <Mail size={16} />
                                                                </button>
                                                                <button onClick={() => updateNotifSetting(setting.alertKey, 'smsEnabled', !setting.smsEnabled)}
                                                                    disabled={!setting.isActive} type="button"
                                                                    className={`p-1.5 rounded-lg transition-colors ${setting.smsEnabled && setting.isActive
                                                                        ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                                                                        } disabled:opacity-40`} title="SMS">
                                                                    <Smartphone size={16} />
                                                                </button>
                                                            </div>
                                                            <button onClick={() => setEditingAlertKey(isExpanded ? null : setting.alertKey)} type="button"
                                                                className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        </div>
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
                                                                            {r.includes('@') ? <Mail size={12} /> : <Smartphone size={12} />}
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
                                                                    <input type="text" placeholder="Email or phone number" value={newRecipient}
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
                                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                    {testChannel === 'sms' ? 'Phone Number (PH)' : 'Email Address'}
                                                </label>
                                                {testChannel === 'sms' ? (
                                                    <>
                                                        <input type="tel" placeholder="09171234567" value={testRecipient}
                                                            onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 11); setTestRecipient(v); }}
                                                            maxLength={11}
                                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none text-slate-700 dark:text-slate-200 focus:border-emerald-500" />
                                                        {testRecipient && testRecipient.length > 0 && (!testRecipient.startsWith('09') || testRecipient.length !== 11) && (
                                                            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Must be 11 digits starting with 09</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <input type="email" placeholder="admin@example.com" value={testRecipient}
                                                        onChange={(e) => setTestRecipient(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none text-slate-700 dark:text-slate-200 focus:border-emerald-500" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Channel</label>
                                                <CustomDropdown value={testChannel} onChange={(v) => { setTestChannel(v); setTestRecipient(''); }}
                                                    options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }]} showPlaceholder={false} />
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
                                                                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</td>
                                                                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{log.alertKey}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${log.channel === 'email' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'}`}>
                                                                            {log.channel}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{log.recipient}</td>
                                                                    <td className="px-3 py-2">
                                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                                                                            {log.status}
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
                                                                <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{h.adminName}</td>
                                                                <td className="px-3 py-2">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${h.action?.includes('2FA') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                                                        {h.action}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{h.ipAddress}</td>
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
                    </div>
                </div>
            </div>
        </>
    );
}
