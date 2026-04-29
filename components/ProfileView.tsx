import React, { useState, useRef } from 'react';
import { updateDoc, doc, db } from '../firebase';
import { User, UserRole } from '../types';

interface ProfileViewProps {
    user: User;
    onUpdate: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'personal' | 'specialized' | 'social'>('personal');

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-40 animate-pulse">
                <div className="w-16 h-16 border-4 border-spark-red border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-sm">Igniting Your Profile...</p>
            </div>
        );
    }
    const [formData, setFormData] = useState<Partial<User>>({
        name: user?.name || '',
        imageUrl: user?.imageUrl || '',
        bio: user?.bio || '',
        location: user?.location || '',
        phoneNumber: user?.phoneNumber || '',
        website: user?.website || '',
        instagram: user?.instagram || '',
        twitter: user?.twitter || '',
        linkedin: user?.linkedin || '',
        university: user?.university || '',
        handle: user?.handle || '',
        industry: user?.industry || '',
        clubType: user?.clubType || '',
        companySize: user?.companySize || ''
    });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                setUploading(false);
            };
            reader.readAsDataURL(file);
            return;
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            await updateDoc(doc(db, "users", user.id), formData as any);
            setSuccess(true);
            onUpdate();
        } catch (err) {
            console.error("Profile update error:", err);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };
    const renderInput = (label: string, field: keyof User, placeholder: string, type: string = 'text') => (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">{label}</label>
            <input
                type={type}
                className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)]"
                value={(formData as any)[field] || ''}
                placeholder={placeholder}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-xl overflow-hidden text-left">
                {/* Header/Cover */}
                <div className="h-48 bg-gradient-to-br from-spark-black via-[var(--bg-secondary)] to-spark-red relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute -bottom-16 left-10 group">
                        <div className="w-32 h-32 rounded-3xl bg-[var(--bg-primary)] p-2 shadow-2xl ring-4 ring-[var(--bg-primary)] relative overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <div className="w-full h-full bg-spark-red/10 flex items-center justify-center text-4xl font-black text-spark-red">
                                    {(formData.name || 'U').charAt(0)}
                                </div>
                            )}

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 bg-spark-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-sm"
                            >
                                {uploading ? (
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span className="text-[8px] font-black uppercase tracking-widest">Update Photo</span>
                                    </>
                                )}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                </div>

                <div className="pt-20 p-8 sm:p-12">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-3xl font-fancy font-black text-[var(--text-primary)] mb-2 tracking-tighter">{formData.name || 'Set Your Name'}</h3>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-spark-red/10 text-spark-red text-[10px] font-black uppercase tracking-widest rounded-lg">{user.role}</span>
                                {formData.location && <span className="text-[var(--text-secondary)] font-bold text-xs">📍 {formData.location}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-1.5 p-1.5 bg-spark-red/5 rounded-2xl mb-10 border border-spark-red/10">
                        {['personal', 'specialized', 'social'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === tab
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-lg shadow-spark-red/10 border border-spark-red/10'
                                    : 'text-[var(--text-secondary)] hover:text-spark-red hover:bg-spark-red/5'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 transition-all">
                        {activeTab === 'personal' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {renderInput('Full Name', 'name', 'e.g. John Doe')}
                                {renderInput('Phone Number', 'phoneNumber', '+234 ...')}
                                {renderInput('Location', 'location', 'e.g. Lagos, Nigeria')}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Bio / About Me</label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] min-h-[120px]"
                                        value={formData.bio}
                                        placeholder="Tell the community about yourself..."
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'specialized' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {user.role === UserRole.Ambassador && (
                                    <>
                                        {renderInput('University', 'university', 'Your school name')}
                                        {renderInput('Spark Handle', 'handle', '@yourusername')}
                                    </>
                                )}

                                {user.role === UserRole.Brand && (
                                    <>
                                        {renderInput('Industry Sector', 'industry', 'e.g. Fintech, Fashion')}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Company Size</label>
                                            <select
                                                className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer"
                                                value={formData.companySize}
                                                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                                            >
                                                <option value="">Select Size</option>
                                                <option value="Startup">Startup (1-10)</option>
                                                <option value="SME">Small/Medium (11-50)</option>
                                                <option value="Enterprise">Corporate (50+)</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {user.role === UserRole.StudentOrg && (
                                    <>
                                        {renderInput('University', 'university', 'Where you are based')}
                                        {renderInput('Club Category', 'clubType', 'e.g. Sports, Tech')}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'social' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {renderInput('Website URL', 'website', 'https://...')}
                                {renderInput('Instagram', 'instagram', '@handle')}
                                {renderInput('X / Twitter', 'twitter', '@handle')}
                                {renderInput('LinkedIn', 'linkedin', 'linkedin.com/in/...')}
                            </div>
                        )}

                        <div className="pt-6 border-t border-[var(--border-color)]">
                            {success && (
                                <div className="mb-8 p-6 bg-green-500/10 text-green-500 rounded-2xl font-black text-center animate-in fade-in zoom-in-95 flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    Profile Synced with Spark!
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-5 bg-gradient-red text-white font-bold text-base rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em]"
                                >
                                    {loading ? 'Processing...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] p-8 sm:p-12 text-left shadow-lg">
                <h4 className="text-xl font-black text-[var(--text-primary)] mb-6 uppercase tracking-widest">Account Security</h4>
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 sm:p-8 bg-spark-red/5 rounded-3xl border border-spark-red/10 gap-6">
                    <div>
                        <p className="font-bold text-[var(--text-primary)] text-lg mb-1">Change Password</p>
                        <p className="text-[var(--text-secondary)] font-medium text-sm">Secure your account with a fresh password.</p>
                    </div>
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-spark-black text-white text-[10px] font-black rounded-xl hover:bg-spark-red transition-all uppercase tracking-widest shadow-lg">Update Password</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
