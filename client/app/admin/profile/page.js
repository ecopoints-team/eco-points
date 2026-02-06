'use client';
import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from '../../../src/Components/AdminLayout';
import { useAuth } from '../../../src/context/AuthContext';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Save, Key, Activity } from 'lucide-react';

export default function ProfilePage() {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        name: '', email: '', phone: '',
        location: '', role: '', joinDate: '',
        bio: '',
    });

    useEffect(() => {
        if (currentUser) {
            setProfile({
                name: currentUser.name || 'Admin User',
                email: currentUser.email || 'admin@ecopoints.com',
                phone: '+63 912 345 6789', // Mock phone
                location: currentUser.location || 'Metro Manila, Philippines', // Start with mock/default
                role: currentUser.role ? currentUser.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Admin',
                joinDate: 'January 5, 2025', // Mock date
                bio: `System administrator for EcoPoints. Role: ${currentUser.role || 'Admin'}.`,
            });
            // Update location specifically if we have easy access to location name via context or mock data
            // For now, we keep the mock location unless we want to fetch it from LOCATIONS based on locationId
        }
    }, [currentUser]);

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setProfileImage(reader.result); reader.readAsDataURL(file); } };
    const handleSave = () => { setIsEditing(false); alert('Profile updated!'); };

    return (
        <>
            <div className="mb-8"><h1 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Manage Profile</h1><p className="text-slate-500 dark:text-slate-400">View and update your account</p></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 h-24"></div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-12 mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden mx-auto">
                                    {profileImage ? <img src={profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl font-bold text-white">{profile.name ? profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}</div>}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-500"><Camera size={14} /></button>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{profile.name}</h2>
                                <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">{profile.role}</span>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{profile.bio}</p>
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Mail size={16} className="text-slate-400" />{profile.email}</div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Phone size={16} className="text-slate-400" />{profile.phone}</div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><MapPin size={16} className="text-slate-400" />{profile.location}</div>
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"><Calendar size={16} className="text-slate-400" />Joined {profile.joinDate}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><User size={20} className="text-emerald-600 dark:text-emerald-400" /> Profile Info</h3>
                            {isEditing ? <button onClick={handleSave} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-500"><Save size={16} /> Save</button> : <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium"><Edit2 size={16} /> Edit</button>}
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label><input type="text" value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} disabled={!isEditing} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label><input type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} disabled={!isEditing} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label><input type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} disabled={!isEditing} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 outline-none" /></div>
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label><input type="text" value={profile.location} onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))} disabled={!isEditing} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 outline-none" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label><textarea value={profile.bio} onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))} disabled={!isEditing} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 h-20 resize-none disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-500 outline-none" /></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden backdrop-blur-xl">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"><h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><Key size={20} className="text-emerald-600 dark:text-emerald-400" /> Change Password</h3></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none" placeholder="••••••••" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New</label><input type="password" value={passwords.new} onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none" placeholder="••••••••" /></div>
                                <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none" placeholder="••••••••" /></div>
                            </div>
                            <button className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-2 px-5 rounded-lg text-sm">Update Password</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
