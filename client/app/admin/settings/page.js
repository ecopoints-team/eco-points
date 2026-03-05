'use client';
import React, { useState } from 'react';
import { ViewOnlyBanner, ViewOnlyWrapper } from '../../../src/Components/AdminLayout';
import CustomDropdown from '../../../src/Components/CustomDropdown';
import { Settings, Globe, Bell, Shield, Save, ToggleLeft, ToggleRight, Zap, Recycle, Palette, Plus, X, Send, Mail, Smartphone, Trash2, Clock } from 'lucide-react';
import { useTheme } from '../../../src/context/ThemeContext';
import { BOTTLE_PRICING } from '../../../src/data/mockData';

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
        <div><p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>{description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
        <button onClick={onChange}>{enabled ? <ToggleRight size={32} className="text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}</button>
    </div>
);

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: 'EcoPoints', timezone: 'Asia/Manila', language: 'en', maintenanceMode: false,
        // Points - aligned with BOTTLE_PRICING
        smallWithLabel: BOTTLE_PRICING.small.withLabel,
        smallNoLabel: BOTTLE_PRICING.small.noLabel,
        mediumWithLabel: BOTTLE_PRICING.medium.withLabel,
        mediumNoLabel: BOTTLE_PRICING.medium.noLabel,
        largeWithLabel: BOTTLE_PRICING.large.withLabel,
        largeNoLabel: BOTTLE_PRICING.large.noLabel,
        // Notifications
        emailNotifications: true, pushNotifications: true, smsNotifications: false,
        lowStockAlerts: true, machineOfflineAlerts: true, newUserAlerts: false, dailyDigest: false,
        notificationRecipients: ['admin@ecopoints.ph'],
        // Security
        twoFactorAuth: false, twoFactorMethod: 'email',
        sessionTimeout: 30, auditLogging: true,
    });
    const [newRecipient, setNewRecipient] = useState('');
    const [testSending, setTestSending] = useState(false);
    const [activeSection, setActiveSection] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    // Theme context for 4-way mode
    const { theme, setTheme } = useTheme();

    const updateSetting = (key, value) => { setSettings(prev => ({ ...prev, [key]: value })); setHasChanges(true); };
    const handleSave = () => { setHasChanges(false); alert('Settings saved!'); };
    const addRecipient = () => {
        if (newRecipient && newRecipient.includes('@') && !settings.notificationRecipients.includes(newRecipient)) {
            updateSetting('notificationRecipients', [...settings.notificationRecipients, newRecipient]);
            setNewRecipient('');
        }
    };
    const removeRecipient = (email) => {
        updateSetting('notificationRecipients', settings.notificationRecipients.filter(r => r !== email));
    };
    const sendTestNotification = async () => {
        setTestSending(true);
        await new Promise(r => setTimeout(r, 1500));
        setTestSending(false);
        alert('Test notification sent to all recipients!');
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
                    <div><h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Settings</h1><p className="text-slate-500 dark:text-slate-400">Configure system settings</p></div>
                    {hasChanges && <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg"><Save size={18} /> Save</button>}
                </div>
            </ViewOnlyWrapper>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Settings size={18} className="text-emerald-600 dark:text-emerald-400" /> Settings</h3></div>
                        <div className="p-2">{sections.map(s => (
                            <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeSection === s.id ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}><s.icon size={18} />{s.label}</button>
                        ))}</div>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        {activeSection === 'general' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">General Settings</h3></div>
                            <div className="p-6 space-y-6">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Site Name</label><input type="text" value={settings.siteName} onChange={(e) => updateSetting('siteName', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-emerald-500 outline-none" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timezone</label><CustomDropdown value={settings.timezone} onChange={(v) => updateSetting('timezone', v)} options={[{ value: 'Asia/Manila', label: 'Asia/Manila' }, { value: 'UTC', label: 'UTC' }]} showPlaceholder={false} /></div>
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label><CustomDropdown value={settings.language} onChange={(v) => updateSetting('language', v)} options={[{ value: 'en', label: 'English' }, { value: 'fil', label: 'Filipino' }]} showPlaceholder={false} /></div>
                                </div>
                                <ToggleSwitch enabled={settings.maintenanceMode} onChange={() => updateSetting('maintenanceMode', !settings.maintenanceMode)} label="Maintenance Mode" description="Disable public access" />
                            </div>
                        </>)}
                        {activeSection === 'appearance' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Appearance</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the visual style of the dashboard</p></div>
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
                        {activeSection === 'points' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Points Configuration</h3><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aligned with BOTTLE_PRICING — with label vs no label</p></div>
                            <div className="p-6 space-y-4">
                                {[
                                    { size: 'Small', range: BOTTLE_PRICING.small.volumeLabel, withKey: 'smallWithLabel', noKey: 'smallNoLabel' },
                                    { size: 'Medium', range: BOTTLE_PRICING.medium.volumeLabel, withKey: 'mediumWithLabel', noKey: 'mediumNoLabel' },
                                    { size: 'Large', range: BOTTLE_PRICING.large.volumeLabel, withKey: 'largeWithLabel', noKey: 'largeNoLabel' },
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
                                                    <input type="number" value={settings[item.withKey]} onChange={(e) => updateSetting(item.withKey, parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-emerald-600 dark:text-emerald-400 outline-none" />
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">pts</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">No Label</span>
                                                    <input type="number" value={settings[item.noKey]} onChange={(e) => updateSetting(item.noKey, parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-amber-600 dark:text-amber-400 outline-none" />
                                                    <span className="text-sm text-slate-500 dark:text-slate-400">pts</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-sm text-red-600 dark:text-red-400">
                                    <strong>Invalid (1001ml+):</strong> Always rejected — 0 points
                                </div>
                            </div>
                        </>)}
                        {activeSection === 'notifications' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Notifications</h3></div>
                            <div className="p-6 space-y-6">
                                {/* Channels */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Mail size={16} /> Notification Channels</h4>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        <ToggleSwitch enabled={settings.emailNotifications} onChange={() => updateSetting('emailNotifications', !settings.emailNotifications)} label="Email" description="Receive notifications via email" />
                                        <ToggleSwitch enabled={settings.pushNotifications} onChange={() => updateSetting('pushNotifications', !settings.pushNotifications)} label="Push" description="Browser push notifications" />
                                        <ToggleSwitch enabled={settings.smsNotifications} onChange={() => updateSetting('smsNotifications', !settings.smsNotifications)} label="SMS" description="Text message alerts (carrier fees may apply)" />
                                    </div>
                                </div>
                                {/* Alert Types */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Bell size={16} /> Alert Types</h4>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                        <ToggleSwitch enabled={settings.lowStockAlerts} onChange={() => updateSetting('lowStockAlerts', !settings.lowStockAlerts)} label="Low Stock Alerts" description="When reward items drop below threshold" />
                                        <ToggleSwitch enabled={settings.machineOfflineAlerts} onChange={() => updateSetting('machineOfflineAlerts', !settings.machineOfflineAlerts)} label="Machine Offline Alerts" description="When a machine goes offline or needs maintenance" />
                                        <ToggleSwitch enabled={settings.newUserAlerts} onChange={() => updateSetting('newUserAlerts', !settings.newUserAlerts)} label="New User Registrations" description="When new users create accounts" />
                                        <ToggleSwitch enabled={settings.dailyDigest} onChange={() => updateSetting('dailyDigest', !settings.dailyDigest)} label="Daily Digest" description="Summary email sent at end of each day" />
                                    </div>
                                </div>
                                {/* Recipients */}
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Notification Recipients</h4>
                                    <div className="space-y-2 mb-3">
                                        {settings.notificationRecipients.map(email => (
                                            <div key={email} className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{email}</span>
                                                <button onClick={() => removeRecipient(email)} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="email" placeholder="Add recipient email..." value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                                            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm outline-none focus:border-emerald-500" />
                                        <button onClick={addRecipient} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors flex items-center gap-1"><Plus size={14} /> Add</button>
                                    </div>
                                </div>
                                {/* Test */}
                                <button onClick={sendTestNotification} disabled={testSending}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors disabled:opacity-50">
                                    <Send size={14} className={testSending ? 'animate-pulse' : ''} /> {testSending ? 'Sending...' : 'Send Test Notification'}
                                </button>
                            </div>
                        </>)}
                        {activeSection === 'security' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Security</h3></div>
                            <div className="p-6 space-y-6">
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <ToggleSwitch enabled={settings.twoFactorAuth} onChange={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)} label="Two-Factor Authentication" description="Require 2FA for admin logins" />
                                    {settings.twoFactorAuth && (
                                        <div className="py-3">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">2FA Delivery Method</label>
                                            <div className="flex gap-3">
                                                {[{ id: 'email', label: 'Email OTP', icon: Mail }, { id: 'sms', label: 'SMS OTP', icon: Smartphone }, { id: 'authenticator', label: 'Authenticator App', icon: Shield }].map(method => (
                                                    <button key={method.id} onClick={() => updateSetting('twoFactorMethod', method.id)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${settings.twoFactorMethod === method.id
                                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
                                                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                                            }`}>
                                                        <method.icon size={16} />
                                                        {method.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <ToggleSwitch enabled={settings.auditLogging} onChange={() => updateSetting('auditLogging', !settings.auditLogging)} label="Audit Logging" description="Log all admin actions for compliance" />
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock size={18} className="text-slate-600 dark:text-slate-400" />
                                        <label className="font-medium text-slate-700 dark:text-slate-200">Session Timeout</label>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Automatically log out inactive users after this duration</p>
                                    <div className="flex items-center gap-3">
                                        <input type="number" value={settings.sessionTimeout} onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 15)} min={5} max={120}
                                            className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400">minutes</span>
                                        <div className="flex gap-2 ml-4">
                                            {[15, 30, 60].map(v => (
                                                <button key={v} onClick={() => updateSetting('sessionTimeout', v)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${settings.sessionTimeout === v
                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                                                        }`}>
                                                    {v}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </>
    );
}
