'use client';
import { useState, useEffect, useCallback } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import CustomDropdown from '../../../src/Components/CustomDropdown';
import { useAuth } from '../../../src/context/AuthContext';
import { settings as settingsApi } from '../../../src/services/apiService';
import {
    Settings, Globe, Bell, Shield, Save, ToggleLeft, ToggleRight,
    Zap, Recycle, Palette, Plus, X, Send, Mail, Smartphone,
    Clock, RefreshCw, CheckCircle, AlertTriangle, ChevronDown, ChevronUp
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

    // ── General settings (cosmetic, local-only) ──
    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'EcoPoints', timezone: 'Asia/Manila', language: 'en', maintenanceMode: false,
    });

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

    // ── Security settings (cosmetic, local-only) ──
    const [securitySettings, setSecuritySettings] = useState({
        twoFactorAuth: false, twoFactorMethod: 'email', sessionTimeout: 30, auditLogging: true,
    });

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

    // Auto-load when tab changes
    useEffect(() => {
        if (activeSection === 'points' && !pointsConfig) loadPointsConfig();
        if (activeSection === 'notifications' && notifSettings.length === 0) loadNotifSettings();
    }, [activeSection, pointsConfig, notifSettings.length, loadPointsConfig, loadNotifSettings]);

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

    const handleSave = () => {
        if (activeSection === 'points') handleSavePoints();
        else if (activeSection === 'notifications') handleSaveNotifications();
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

    const updateGeneralSetting = (key, value) => {
        setGeneralSettings(prev => ({ ...prev, [key]: value }));
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
        { id: 'general', label: 'General', icon: Globe },
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

                        {/* ═══ GENERAL ═══ */}
                        {activeSection === 'general' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">General Settings</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Site Name</label>
                                    <input type="text" value={generalSettings.siteName} onChange={(e) => updateGeneralSetting('siteName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timezone</label>
                                        <CustomDropdown value={generalSettings.timezone} onChange={(v) => updateGeneralSetting('timezone', v)}
                                            options={[{ value: 'Asia/Manila', label: 'Asia/Manila' }, { value: 'UTC', label: 'UTC' }]} showPlaceholder={false} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
                                        <CustomDropdown value={generalSettings.language} onChange={(v) => updateGeneralSetting('language', v)}
                                            options={[{ value: 'en', label: 'English' }, { value: 'fil', label: 'Filipino' }]} showPlaceholder={false} />
                                    </div>
                                </div>
                                <ToggleSwitch enabled={generalSettings.maintenanceMode}
                                    onChange={() => updateGeneralSetting('maintenanceMode', !generalSettings.maintenanceMode)}
                                    label="Maintenance Mode" description="Disable public access" />
                            </div>
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
                                    {/* Alert Matrix */}
                                    <div className="space-y-3">
                                        {notifSettings.filter(s => s.alertKey !== 'config_points').map(setting => {
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
                                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Recipient</label>
                                                <input type="text" placeholder="email@example.com or +63..." value={testRecipient}
                                                    onChange={(e) => setTestRecipient(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none text-slate-700 dark:text-slate-200 focus:border-emerald-500" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Channel</label>
                                                <CustomDropdown value={testChannel} onChange={setTestChannel}
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
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <ToggleSwitch enabled={securitySettings.twoFactorAuth}
                                    onChange={() => setSecuritySettings(p => ({ ...p, twoFactorAuth: !p.twoFactorAuth }))}
                                    label="Two-Factor Authentication" description="Require 2FA for admin accounts" />
                                {securitySettings.twoFactorAuth && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">2FA Method</label>
                                        <CustomDropdown value={securitySettings.twoFactorMethod}
                                            onChange={(v) => setSecuritySettings(p => ({ ...p, twoFactorMethod: v }))}
                                            options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }]} showPlaceholder={false} />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Session Timeout (minutes)</label>
                                    <input type="number" min="5" value={securitySettings.sessionTimeout}
                                        onChange={(e) => setSecuritySettings(p => ({ ...p, sessionTimeout: parseInt(e.target.value) || 30 }))}
                                        className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" />
                                </div>
                                <ToggleSwitch enabled={securitySettings.auditLogging}
                                    onChange={() => setSecuritySettings(p => ({ ...p, auditLogging: !p.auditLogging }))}
                                    label="Audit Logging" description="Log all admin actions" />
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </>
    );
}
