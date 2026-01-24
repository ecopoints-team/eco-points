'use client';
import React, { useState } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { Settings, Globe, Bell, Shield, Save, ToggleLeft, ToggleRight, Zap, Recycle, Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../../src/context/ThemeContext';

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
        <div><p className="font-medium text-slate-700 dark:text-slate-200">{label}</p>{description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
        <button onClick={onChange}>{enabled ? <ToggleRight size={32} className="text-emerald-600 dark:text-emerald-400" /> : <ToggleLeft size={32} className="text-slate-300 dark:text-slate-600" />}</button>
    </div>
);

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: 'EcoPoints', timezone: 'Asia/Manila', language: 'en', maintenanceMode: false,
        points350ml: 3, points500ml: 5, points750ml: 8, points1000ml: 10, points1500ml: 15,
        emailNotifications: true, pushNotifications: true, lowStockAlerts: true, machineOfflineAlerts: true,
        twoFactorAuth: false, sessionTimeout: 30, auditLogging: true,
    });
    const [activeSection, setActiveSection] = useState('general');
    const [hasChanges, setHasChanges] = useState(false);

    // Theme context for 3-way mode
    const { theme, setTheme } = useTheme();

    const updateSetting = (key, value) => { setSettings(prev => ({ ...prev, [key]: value })); setHasChanges(true); };
    const handleSave = () => { setHasChanges(false); alert('Settings saved!'); };

    const sections = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'points', label: 'Points Config', icon: Zap },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ];

    return (
        <>
            <div className="mb-8 flex justify-between items-center">
                <div><h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Settings</h1><p className="text-slate-500 dark:text-slate-400">Configure system settings</p></div>
                {hasChanges && <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm shadow-lg"><Save size={18} /> Save</button>}
            </div>
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
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timezone</label><select value={settings.timezone} onChange={(e) => updateSetting('timezone', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"><option value="Asia/Manila">Asia/Manila</option><option value="UTC">UTC</option></select></div>
                                    <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label><select value={settings.language} onChange={(e) => updateSetting('language', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"><option value="en">English</option><option value="fil">Filipino</option></select></div>
                                </div>
                                <ToggleSwitch enabled={settings.maintenanceMode} onChange={() => updateSetting('maintenanceMode', !settings.maintenanceMode)} label="Maintenance Mode" description="Disable public access" />
                            </div>
                        </>)}
                        {activeSection === 'appearance' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Appearance</h3></div>
                            <div className="p-6 space-y-6">
                                {/* 3-Way Theme Toggle */}
                                <div className="py-4 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Theme Mode</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Choose between light, neutral, or dark appearance</p>
                                        </div>
                                    </div>

                                    {/* 3-Way Toggle */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'light'
                                                ? 'border-emerald-500 bg-white shadow-lg'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                <Sun size={24} />
                                            </div>
                                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}>Light</span>
                                        </button>

                                        <button
                                            onClick={() => setTheme('neutral')}
                                            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'neutral'
                                                ? 'border-emerald-500 bg-gray-500 shadow-lg'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-full ${theme === 'neutral' ? 'bg-gray-400 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                <Palette size={24} />
                                            </div>
                                            <span className={`text-sm font-medium ${theme === 'neutral' ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}>Neutral</span>
                                        </button>

                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${theme === 'dark'
                                                ? 'border-emerald-500 bg-slate-900 shadow-lg'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                <Moon size={24} />
                                            </div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>Dark</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    Your theme preference is saved automatically and will persist across sessions.
                                </div>
                            </div>
                        </>)}
                        {activeSection === 'points' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Points Configuration</h3></div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[{ key: 'points350ml', label: '350ml PET' }, { key: 'points500ml', label: '500ml PET' }, { key: 'points750ml', label: '750ml Glass' }, { key: 'points1000ml', label: '1000ml PET' }, { key: 'points1500ml', label: '1500ml PET' }].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="flex items-center gap-3"><Recycle size={20} className="text-emerald-600 dark:text-emerald-400" /><span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span></div>
                                        <div className="flex items-center gap-2"><input type="number" value={settings[item.key]} onChange={(e) => updateSetting(item.key, parseInt(e.target.value))} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-center font-bold text-emerald-600 dark:text-emerald-400 outline-none" /><span className="text-sm text-slate-500 dark:text-slate-400">pts</span></div>
                                    </div>
                                ))}
                            </div>
                        </>)}
                        {activeSection === 'notifications' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Notifications</h3></div>
                            <div className="p-6 divide-y divide-slate-100 dark:divide-slate-700">
                                <ToggleSwitch enabled={settings.emailNotifications} onChange={() => updateSetting('emailNotifications', !settings.emailNotifications)} label="Email Notifications" />
                                <ToggleSwitch enabled={settings.pushNotifications} onChange={() => updateSetting('pushNotifications', !settings.pushNotifications)} label="Push Notifications" />
                                <ToggleSwitch enabled={settings.lowStockAlerts} onChange={() => updateSetting('lowStockAlerts', !settings.lowStockAlerts)} label="Low Stock Alerts" />
                                <ToggleSwitch enabled={settings.machineOfflineAlerts} onChange={() => updateSetting('machineOfflineAlerts', !settings.machineOfflineAlerts)} label="Machine Offline Alerts" />
                            </div>
                        </>)}
                        {activeSection === 'security' && (<>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white">Security</h3></div>
                            <div className="p-6 divide-y divide-slate-100 dark:divide-slate-700">
                                <ToggleSwitch enabled={settings.twoFactorAuth} onChange={() => updateSetting('twoFactorAuth', !settings.twoFactorAuth)} label="Two-Factor Auth" />
                                <ToggleSwitch enabled={settings.auditLogging} onChange={() => updateSetting('auditLogging', !settings.auditLogging)} label="Audit Logging" />
                                <div className="py-3"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Session Timeout (min)</label><input type="number" value={settings.sessionTimeout} onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))} className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none" /></div>
                            </div>
                        </>)}
                    </div>
                </div>
            </div>
        </>
    );
}
