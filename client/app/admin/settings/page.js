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

    // Theme context for dark/light mode
    const { isDarkMode, toggleTheme } = useTheme();

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
        <AdminLayout>
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
                                <div className="flex items-center justify-between py-4 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-slate-700 text-yellow-400' : 'bg-amber-100 text-amber-600'}`}>
                                            {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Theme Mode</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark appearance</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`relative w-16 h-8 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${isDarkMode ? 'left-9' : 'left-1'}`}>
                                            {isDarkMode ? <Moon size={14} className="text-slate-700" /> : <Sun size={14} className="text-amber-500" />}
                                        </div>
                                    </button>
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 italic">Your theme preference is saved automatically and will persist across sessions.</div>
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
        </AdminLayout>
    );
}
