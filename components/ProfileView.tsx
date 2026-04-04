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
                <p className="text-spark-gray font-black uppercase tracking-widest text-sm">Igniting Your Profile...</p>
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
        <div className="space-y-3">
            <label className="block text-[10px] font-black text-spark-gray uppercase tracking-[0.2em] ml-2">{label}</label>
            <input
                type={type}
                className="w-full px-8 py-5 bg-gray-50 border-0 rounded-3xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-lg"
                value={(formData as any)[field] || ''}
                placeholder={placeholder}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-red-50 overflow-hidden text-left">
                {/* Header/Cover */}
                <div className="h-56 bg-gradient-to-br from-spark-black via-gray-900 to-spark-red relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute -bottom-20 left-12 group">
                        <div className="w-40 h-40 rounded-[3rem] bg-white p-3 shadow-2xl ring-8 ring-white relative overflow-hidden transition-transform duration-500 group-hover:scale-105">
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Profile" className="w-full h-full object-cover rounded-[2.5rem]" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-50 to-white flex items-center justify-center text-5xl font-black text-spark-red">
                                    {(formData.name || 'U').charAt(0)}
                                </div>
                            )}

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute inset-0 bg-spark-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-sm"
                            >
                                {uploading ? (
                                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                                    </>
                                )}
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>
                </div>

                <div className="pt-24 p-12">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h3 className="text-5xl font-black text-spark-black mb-2">{formData.name || 'Set Your Name'}</h3>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 bg-red-100 text-spark-red text-xs font-black uppercase tracking-widest rounded-full">{user.role}</span>
                                {formData.location && <span className="text-spark-gray font-bold">📍 {formData.location}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 p-1.5 bg-gray-50 rounded-[2rem] mb-12 border border-gray-100/50">
                        {['personal', 'specialized', 'social'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-4 px-6 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-white text-spark-red shadow-lg shadow-red-100'
                                    : 'text-spark-gray hover:text-spark-black'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12 transition-all">
                        {activeTab === 'personal' && (
                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                {renderInput('Full Name', 'name', 'e.g. John Doe')}
                                {renderInput('Phone Number', 'phoneNumber', '+234 ...')}
                                {renderInput('Location', 'location', 'e.g. Lagos, Nigeria')}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="block text-[10px] font-black text-spark-gray uppercase tracking-[0.2em] ml-2">Bio / About Me</label>
                                    <textarea
                                        className="w-full px-8 py-5 bg-gray-50 border-0 rounded-[2rem] outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-lg min-h-[150px]"
                                        value={formData.bio}
                                        placeholder="Tell the community about yourself..."
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'specialized' && (
                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                {user.role === UserRole.Ambassador && (
                                    <>
                                        {renderInput('University', 'university', 'Your school name')}
                                        {renderInput('Spark Handle', 'handle', '@yourusername')}
                                    </>
                                )}

                                {user.role === UserRole.Brand && (
                                    <>
                                        {renderInput('Industry Sector', 'industry', 'e.g. Fintech, Fashion')}
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-spark-gray uppercase tracking-[0.2em] ml-2">Company Size</label>
                                            <select
                                                className="w-full px-8 py-5 bg-gray-50 border-0 rounded-3xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-lg appearance-none cursor-pointer"
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
                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                                {renderInput('Website URL', 'website', 'https://...')}
                                {renderInput('Instagram', 'instagram', '@handle')}
                                {renderInput('X / Twitter', 'twitter', '@handle')}
                                {renderInput('LinkedIn', 'linkedin', 'linkedin.com/in/...')}
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-50">
                            {success && (
                                <div className="mb-8 p-6 bg-green-50 text-green-600 rounded-3xl font-black text-center animate-in fade-in zoom-in-95 flex items-center justify-center gap-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    Profile Synced with Spark Infrastructure!
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-6 bg-spark-black text-white font-black text-xl rounded-3xl hover:bg-spark-red transition-all shadow-2xl shadow-spark-black/10 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-red-50 p-12 text-left">
                <h4 className="text-2xl font-black text-spark-black mb-6">Account Security</h4>
                <div className="flex flex-col sm:flex-row items-center justify-between p-8 bg-gray-50 rounded-[2.5rem] gap-6">
                    <div>
                        <p className="font-black text-spark-black text-xl mb-1">Change Password</p>
                        <p className="text-spark-gray font-bold">Secure your account with a fresh password.</p>
                    </div>
                    <button className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-gray-100 text-sm font-black rounded-2xl hover:bg-spark-black hover:text-white hover:border-spark-black transition-all shadow-xl shadow-gray-100">Update Password</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
