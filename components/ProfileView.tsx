import React, { useState, useRef } from 'react';
import { updateDoc, setDoc, doc, db } from '../firebase';
import { User, UserRole } from '../types';
import { notifyProfileSubmitted } from '../emailNotifier';

interface ProfileViewProps {
    user: User;
    onUpdate: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);
    const isCreator = user?.role?.includes('Creator');
    const [activeTab, setActiveTab] = useState<'personal' | 'commercial' | 'specialized' | 'social'>('personal');
    const [reviewErrors, setReviewErrors] = useState<string[]>([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSuccess, setReviewSuccess] = useState(false);

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
        coverPhotoUrl: user?.coverPhotoUrl || '',
        bio: user?.bio || '',
        location: user?.location || '',
        city: user?.city || '',
        state: user?.state || '',
        phoneNumber: user?.phoneNumber || '',
        website: user?.website || '',
        instagram: user?.instagram || '',
        twitter: user?.twitter || '',
        linkedin: user?.linkedin || '',
        tiktok: user?.tiktok || '',
        university: user?.university || '',
        handle: user?.handle || '',
        industry: user?.industry || '',
        clubType: user?.clubType || '',
        companySize: user?.companySize || '',
        influencerType: user?.influencerType || (user?.role === 'Creator' ? (user?.university ? 'Campus Creator' : 'Professional Creator') : ''),
        // Commercial fields — all must be here or Firestore never receives them
        professionalHeadline: user?.professionalHeadline || '',
        professionalSummary: user?.professionalSummary || '',
        campusCommunityReach: user?.campusCommunityReach || '',
        capabilities: user?.capabilities || [],
        primaryCapability: user?.primaryCapability || '',
        startingPrice: user?.startingPrice ?? undefined,
        pricingNegotiable: user?.pricingNegotiable ?? false,
        pricingBasis: user?.pricingBasis || undefined,
        turnaroundTime: user?.turnaroundTime || undefined,
        workPreference: user?.workPreference || undefined,
        availability: user?.availability || undefined,
        primaryService: user?.primaryService || '',
        // WhatsApp Media fields
        whatsappMediaName: user?.whatsappMediaName || '',
        whatsappMediaType: user?.whatsappMediaType || undefined,
        whatsappCampusCoverage: user?.whatsappCampusCoverage || '',
        whatsappPrimaryAudience: user?.whatsappPrimaryAudience || undefined,
        whatsappAverageStatusViews: user?.whatsappAverageStatusViews ?? undefined,
        whatsappChannelFollowers: user?.whatsappChannelFollowers ?? undefined,
        whatsappRatePerPlacement: user?.whatsappRatePerPlacement ?? undefined,
        whatsappPackageDescription: user?.whatsappPackageDescription || '',
        whatsappAudienceEvidence: user?.whatsappAudienceEvidence || undefined,
    });
    const [uploading, setUploading] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Compress an image file to a base64 string, capping max dimensions and quality
    const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                    if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
                img.src = ev.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const compressed = await compressImage(file, 400, 400, 0.80);
            setFormData(prev => ({ ...prev, imageUrl: compressed }));
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            // Cover: max 1200×400, quality 0.75 to stay well under Firestore's 1 MB field limit
            const compressed = await compressImage(file, 1200, 400, 0.75);
            setFormData(prev => ({ ...prev, coverPhotoUrl: compressed }));
        } catch (err) {
            console.error("Cover upload error:", err);
            alert("Failed to upload cover photo");
        } finally {
            setUploadingCover(false);
        }
    };

    const isValidUrl = (string: string) => {
        if (!string) return true;
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const socialFields = ['tiktok', 'instagram', 'twitter', 'linkedin', 'website'];
        const invalidFields = [];
        for (const field of socialFields) {
            const val = (formData as any)[field];
            if (val && !isValidUrl(val)) {
                invalidFields.push(field);
            }
        }

        if (invalidFields.length > 0) {
            alert(`Please enter a valid link (starting with http:// or https://) for: ${invalidFields.join(', ')}`);
            return;
        }

        setLoading(true);
        setSuccess(false);
        try {
            const userId = user?.id || (user as any)?.uid || (user as any)?._id;
            if (!userId) throw new Error('User ID missing');

            const cleanedData: any = {};
            Object.entries(formData).forEach(([k, v]) => {
                if (v !== undefined) {
                    cleanedData[k] = v;
                }
            });

            await setDoc(doc(db, "users", userId), cleanedData, { merge: true });
            setSuccess(true);
            onUpdate();
        } catch (err: any) {
            console.error("Profile update error:", err);
            alert(err.message || "Failed to update profile");
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

    // --- Submit for Review validation (does NOT block draft saves) ---
    const handleSubmitForReview = async () => {
        const errors: string[] = [];
        const caps = (formData.capabilities || user?.capabilities || []).map((c: string) => c.toLowerCase());
        const srvs = (user?.services || formData.services || []);
        const isWhatsAppOp = caps.includes('distribute') && srvs.some((s: string) => s.toLowerCase().includes('whatsapp'));

        if (!formData.professionalHeadline) errors.push('Professional Headline');
        if (!formData.professionalSummary) errors.push('Professional Summary');
        if (!formData.city) errors.push('City');
        if (!formData.state) errors.push('State');
        if (!formData.workPreference) errors.push('Work Preference');
        if (!formData.availability) errors.push('Availability');
        if (!formData.pricingBasis) errors.push('Pricing Basis');
        if (!formData.turnaroundTime) errors.push('Turnaround Time');
        if (!formData.primaryService) errors.push('Primary Service');
        if (!user?.portfolio || user.portfolio.length === 0) errors.push('Portfolio (at least 1 sample)');
        if (!formData.pricingNegotiable && (formData.startingPrice === undefined || formData.startingPrice === null))
            errors.push('Starting Price (or mark as Negotiable)');
        if ((caps.includes('distribute') || caps.includes('activate')) && !formData.campusCommunityReach)
            errors.push('Campus / Community Reach');

        // Section 9.2: WhatsApp Media Provider mandatory fields
        if (isWhatsAppOp) {
            if (!formData.whatsappMediaName) errors.push('WhatsApp Media / Channel Name');
            if (!formData.whatsappMediaType) errors.push('WhatsApp Media Type');
            if (!formData.whatsappCampusCoverage) errors.push('Institution / Campus Coverage');
            if (!formData.whatsappPrimaryAudience) errors.push('Primary Audience Category');
            if ((formData.whatsappMediaType === 'Status TV' || formData.whatsappMediaType === 'Both') && (formData.whatsappAverageStatusViews === undefined || formData.whatsappAverageStatusViews === null)) {
                errors.push('Average Status Views');
            }
            if ((formData.whatsappMediaType === 'Channel' || formData.whatsappMediaType === 'Both') && (formData.whatsappChannelFollowers === undefined || formData.whatsappChannelFollowers === null)) {
                errors.push('Channel Followers Count');
            }
            if (formData.whatsappRatePerPlacement === undefined || formData.whatsappRatePerPlacement === null) {
                errors.push('Rate Per Placement');
            }
            if (!formData.whatsappAudienceEvidence) {
                errors.push('Audience Evidence Screenshot');
            }
        }

        setReviewErrors(errors);
        if (errors.length > 0) {
            setActiveTab('commercial');
            return;
        }
        setSubmittingReview(true);
        try {
            const userId = user?.id || (user as any)?.uid;
            if (!userId) throw new Error('User ID missing');
            // First persist all current form data (same as a regular Save)
            const cleanedData: any = {};
            Object.entries(formData).forEach(([k, v]) => { if (v !== undefined) cleanedData[k] = v; });
            await setDoc(doc(db, 'users', userId), {
                ...cleanedData,
                profileSubmittedForReview: true,
                reviewStatus: 'ready_for_review',
                adminNote: '',   // clear any previous admin note on re-submission
                profileSubmittedAt: new Date().toISOString(),
            }, { merge: true });
            notifyProfileSubmitted(formData.name || user.name || 'Creator', user.email);
            setReviewSuccess(true);
            setReviewErrors([]);
            onUpdate();
        } catch (err: any) {
            alert(err.message || 'Failed to submit for review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Calculate missing profile fields for checklist
    const missingFields: { label: string; tab: 'personal' | 'commercial' | 'specialized' | 'social'; field: string }[] = [];
    if (!formData.name) missingFields.push({ label: 'Full Name', tab: 'personal', field: 'name' });
    if (!formData.phoneNumber) missingFields.push({ label: 'Phone Number', tab: 'personal', field: 'phoneNumber' });
    if (!formData.location) missingFields.push({ label: 'Location', tab: 'personal', field: 'location' });
    if (!formData.bio) missingFields.push({ label: 'Bio / About Me', tab: 'personal', field: 'bio' });
    if (isCreator && !formData.professionalHeadline) missingFields.push({ label: 'Professional Headline', tab: 'commercial', field: 'professionalHeadline' });
    if (isCreator && !formData.professionalSummary) missingFields.push({ label: 'Professional Summary', tab: 'commercial', field: 'professionalSummary' });
    if (!formData.imageUrl) missingFields.push({ label: 'Profile Photo', tab: 'personal', field: 'imageUrl' });
    if (user.role?.includes('Creator')) {
      if (!user.capabilities || user.capabilities.length === 0) missingFields.push({ label: 'Capabilities & Services', tab: 'specialized', field: 'capabilities' });
      if (!formData.instagram && !formData.tiktok && !formData.twitter) missingFields.push({ label: 'Social / Portfolio Link', tab: 'social', field: 'instagram' });
    }

    const totalChecklistFields = user.role?.includes('Creator') ? 7 : 5;
    const completedCount = totalChecklistFields - missingFields.length;
    const completionPct = Math.round((completedCount / totalChecklistFields) * 100);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Profile Completion Checklist Banner */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] p-6 sm:p-8 shadow-lg text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div>
                        <div className="inline-block px-3 py-1 bg-spark-red/10 text-spark-red text-[10px] font-black uppercase tracking-widest rounded-full mb-2">
                            Commercial Profile Checklist
                        </div>
                        <h3 className="text-xl font-fancy font-black text-[var(--text-primary)]">
                            Profile Completion: <span className="text-spark-red">{completionPct}%</span>
                        </h3>
                    </div>
                    <div className="w-full sm:w-48 bg-spark-red/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-spark-red h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                </div>

                {missingFields.length > 0 ? (
                    <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                            ⚠️ Complete the missing fields below to activate directory listing:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {missingFields.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveTab(item.tab)}
                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                                >
                                    <span>+ Add {item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="pt-3 border-t border-[var(--border-color)] text-xs font-bold text-green-500 flex items-center gap-2">
                        ✅ All profile fields complete! Your profile is eligible for directory discovery.
                    </div>
                )}
            </div>

            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-xl text-left" style={{ position: 'relative' }}>
                {/* Header/Cover */}
                <div 
                    className="h-48 bg-spark-black relative group/cover overflow-hidden rounded-t-[3rem]"
                    style={{
                        backgroundImage: formData.coverPhotoUrl ? `url(${formData.coverPhotoUrl})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {!formData.coverPhotoUrl && (
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    )}
                    <button
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="absolute inset-0 bg-spark-black/40 opacity-0 group-hover/cover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-[2px]"
                    >
                        {uploadingCover ? (
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Update Cover Photo</span>
                            </>
                        )}
                    </button>
                    <input type="file" ref={coverFileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
                </div>

                {/* Avatar — lives OUTSIDE the overflow-hidden cover so it is never clipped */}
                <div className="absolute left-10 group" style={{ top: '192px', transform: 'translateY(-50%)' }}>
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

                <div className="pt-20 p-8 sm:p-12">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-3xl font-fancy font-black text-[var(--text-primary)] mb-2 tracking-tighter">{formData.name || 'Set Your Name'}</h3>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-spark-red/10 text-spark-red text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {formData.influencerType || user.role}
                                </span>
                                {formData.location && <span className="text-[var(--text-secondary)] font-bold text-xs flex items-center gap-1"><svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {formData.location}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Capabilities Summary Display for Creator */}
                    {user.role?.includes('Creator') && user.capabilities && user.capabilities.length > 0 && (
                        <div className="mb-8 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-spark-red uppercase tracking-widest">
                                    Capabilities ({user.capabilities.length}) &middot; Primary: {user.primaryCapability || user.capabilities[0]}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {user.capabilities.map((cap: string) => (
                                    <span key={cap} className="px-3 py-1 bg-spark-red/10 text-spark-red text-xs font-black rounded-xl uppercase tracking-wider">
                                        ⚡ {cap}
                                    </span>
                                ))}
                            </div>
                            {user.services && user.services.length > 0 && (
                                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-[var(--border-color)]">
                                    {user.services.map((srv: string) => (
                                        <span key={srv} className="px-2.5 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[11px] font-bold rounded-lg">
                                            {srv}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabs Navigation */}
                    <div className="flex gap-1.5 p-1.5 bg-spark-red/5 rounded-2xl mb-10 border border-spark-red/10 flex-wrap">
                        {(isCreator ? ['personal', 'commercial', 'specialized', 'social'] : ['personal', 'specialized', 'social']).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative ${
                                    activeTab === tab
                                        ? 'bg-[var(--bg-primary)] text-spark-red shadow-lg shadow-spark-red/10 border border-spark-red/10'
                                        : 'text-[var(--text-secondary)] hover:text-spark-red hover:bg-spark-red/5'
                                }`}
                            >
                                {tab}
                                {tab === 'commercial' && reviewErrors.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{reviewErrors.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10 transition-all">
                        {/* ── PERSONAL TAB ── */}
                        {activeTab === 'personal' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {renderInput(user.role === 'Organization' ? 'Association Name' : 'Full Name', 'name', 'e.g. John Doe')}
                                {renderInput('Phone Number', 'phoneNumber', '+234 ...')}
                                {renderInput('Location', 'location', 'e.g. Lagos, Nigeria')}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Bio / About Me</label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] min-h-[120px]"
                                        value={formData.bio || ''}
                                        placeholder="Tell the community about yourself..."
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── COMMERCIAL TAB (Section 5 — Creator Profile Form A–H) ── */}
                        {activeTab === 'commercial' && isCreator && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">

                                {/* Section 8.3: Top Validation / Missing Items Banner with Scroll-Jump links */}
                                {reviewErrors.length > 0 && (
                                    <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                            <p className="text-red-500 font-black text-xs uppercase tracking-widest">
                                                ⚠ Profile Incomplete — Please fill these required items to Submit for Review:
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {reviewErrors.map((errName) => (
                                                <button
                                                    key={errName}
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById(`field-${errName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            el.focus();
                                                        }
                                                    }}
                                                    className="px-3.5 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-all flex items-center gap-1.5 shadow-sm"
                                                >
                                                    <span>↓ Jump to {errName}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {reviewSuccess && (
                                    <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-green-500 font-black text-xs uppercase tracking-widest flex items-center gap-3">
                                        ✅ Your profile has been submitted for review.
                                    </div>
                                )}

                                {/* ── SECTION A. IDENTITY ── */}
                                <div id="field-identity" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-6">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section A</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Identity & Branding</h4>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div id="field-full-name">
                                            {renderInput('Display Name / Business Name', 'name', 'e.g. John Doe or Spark Media')}
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 font-medium">Use your creator name, or media page/agency name if operating as a business.</p>
                                        </div>
                                        <div>
                                            {renderInput('Phone / WhatsApp Line', 'phoneNumber', '+234 ...')}
                                            <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 font-medium">Primary line for client campaigns and admin communications.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── SECTION B. PROFESSIONAL POSITIONING ── */}
                                <div id="field-positioning" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-6">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section B</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Professional Positioning</h4>
                                    </div>

                                    {/* Headline */}
                                    <div id="field-professional-headline" className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Professional Headline <span className="text-spark-red">*</span></label>
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">{(formData.professionalHeadline || '').length}/100</span>
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)]"
                                            value={formData.professionalHeadline || ''}
                                            placeholder="Example: Social Media Manager and Content Writer."
                                            onChange={(e) => setFormData(prev => ({ ...prev, professionalHeadline: e.target.value }))}
                                        />
                                        <p className="text-[11px] text-[var(--text-secondary)] ml-2 font-medium">Example: Social Media Manager and Content Writer.</p>
                                    </div>

                                    {/* Capabilities & Primary Capability */}
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Select Capabilities <span className="text-spark-red">*</span></label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {['Create', 'Manage', 'Distribute', 'Activate'].map((cap) => {
                                                const isSel = (formData.capabilities || user.capabilities || []).includes(cap);
                                                return (
                                                    <button
                                                        key={cap}
                                                        type="button"
                                                        onClick={() => {
                                                            const currentCaps = formData.capabilities || user.capabilities || [];
                                                            const nextCaps = isSel ? currentCaps.filter((c: string) => c !== cap) : [...currentCaps, cap];
                                                            const nextPrimary = (nextCaps.includes(formData.primaryCapability || '') ? formData.primaryCapability : nextCaps[0]) || '';
                                                            setFormData(prev => ({ ...prev, capabilities: nextCaps, primaryCapability: nextPrimary }));
                                                        }}
                                                        className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all ${
                                                            isSel 
                                                                ? 'bg-spark-red/10 border-spark-red text-spark-red shadow-sm' 
                                                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-spark-red/30'
                                                        }`}
                                                    >
                                                        ⚡ {cap}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {(formData.capabilities || user.capabilities || []).length > 0 && (
                                            <div id="field-primary-capability" className="space-y-2 pt-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Primary Capability <span className="text-spark-red">*</span></label>
                                                <select
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer"
                                                    value={formData.primaryCapability || (formData.capabilities || user.capabilities || [])[0] || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, primaryCapability: e.target.value }))}
                                                >
                                                    {(formData.capabilities || user.capabilities || []).map((cap: string) => (
                                                        <option key={cap} value={cap}>{cap}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Primary Service Selection */}
                                    {user.services && user.services.length > 0 && (
                                        <div id="field-primary-service" className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Primary Service <span className="text-spark-red">*</span></label>
                                            <select
                                                className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer"
                                                value={formData.primaryService || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, primaryService: e.target.value }))}
                                            >
                                                <option value="">Select your primary service</option>
                                                {user.services.map((srv: string) => <option key={srv} value={srv}>{srv}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* ── SECTION C. LOCATION AND REACH ── */}
                                <div id="field-location" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-6">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section C</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Location & Delivery Reach</h4>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div id="field-city" className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">City <span className="text-spark-red">*</span></label>
                                            <input type="text" className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)]" value={formData.city || ''} placeholder="e.g. Lagos" onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} />
                                        </div>
                                        <div id="field-state" className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">State <span className="text-spark-red">*</span></label>
                                            <input type="text" className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)]" value={formData.state || ''} placeholder="e.g. Lagos State" onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} />
                                        </div>
                                    </div>

                                    {/* Campus / Community Reach */}
                                    <div id="field-campus---community-reach" className="space-y-2">
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">
                                            Campus / Community Reach {((user.capabilities || []).some((c: string) => ['Distribute','Activate'].includes(c))) && <span className="text-spark-red">* (Mandatory for Distribute & Activate)</span>}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)]"
                                            value={formData.campusCommunityReach || ''}
                                            placeholder="List the campuses, communities, cities or audience groups you can directly reach."
                                            onChange={(e) => setFormData(prev => ({ ...prev, campusCommunityReach: e.target.value }))}
                                        />
                                        <p className="text-[11px] text-[var(--text-secondary)] ml-2 font-medium">List the campuses, communities, cities or audience groups you can directly reach.</p>
                                    </div>

                                    {/* Work Preference */}
                                    <div id="field-work-preference" className="space-y-2">
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Work Preference <span className="text-spark-red">*</span></label>
                                        <select className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer" value={formData.workPreference || ''} onChange={(e) => setFormData(prev => ({ ...prev, workPreference: e.target.value as any }))}>
                                            <option value="">Select preference</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Physical">Physical</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ── SECTION D. PROFESSIONAL SUMMARY ── */}
                                <div id="field-professional-summary" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-4">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section D</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Professional Summary</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Professional Summary <span className="text-spark-red">*</span></label>
                                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">{(formData.professionalSummary || '').length}/600</span>
                                        </div>
                                        <textarea
                                            maxLength={600}
                                            className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] min-h-[140px] resize-y"
                                            value={formData.professionalSummary || ''}
                                            placeholder="Explain what you deliver, the clients or communities you serve and the result you help them achieve."
                                            onChange={(e) => setFormData(prev => ({ ...prev, professionalSummary: e.target.value }))}
                                        />
                                        <p className="text-[11px] text-[var(--text-secondary)] ml-2 font-medium">Explain what you deliver, the clients or communities you serve and the result you help them achieve.</p>
                                    </div>
                                </div>

                                {/* ── SECTION E. PORTFOLIO AND EVIDENCE ── */}
                                <div id="field-portfolio" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-6">
                                    <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section E</span>
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">Portfolio & Evidence</h4>
                                        </div>
                                        <span className="px-3 py-1 bg-spark-red/10 text-spark-red text-xs font-black rounded-lg uppercase tracking-wider">
                                            {user.portfolio?.length || 0} Sample{(user.portfolio?.length || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium">Upload or link to at least one relevant work sample.</p>
                                    
                                    {user.portfolio && user.portfolio.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {user.portfolio.map((item) => (
                                                <div key={item.id} className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl space-y-1">
                                                    <p className="font-black text-sm text-[var(--text-primary)] truncate">{item.title}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] truncate">{item.description || item.fileUrl}</p>
                                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-spark-red uppercase tracking-widest hover:underline inline-block pt-1">
                                                        View Sample →
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-[var(--bg-primary)] border border-dashed border-[var(--border-color)] rounded-2xl text-center">
                                            <p className="text-xs font-bold text-red-500 mb-2">⚠️ Minimum one portfolio sample required for review submission.</p>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('specialized')}
                                                className="px-4 py-2 bg-spark-black text-white text-xs font-black uppercase rounded-xl hover:bg-spark-red transition-all"
                                            >
                                                + Add Work Sample in Portfolio Sub-tab
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ── SECTION F. COMMERCIAL INFORMATION ── */}
                                <div id="field-pricing" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-6">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section F</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Commercial Information</h4>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div id="field-starting-price" className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Starting Price (₦) <span className="text-spark-red">*</span></label>
                                            <input
                                                type="number"
                                                min={0}
                                                disabled={!!formData.pricingNegotiable}
                                                className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] disabled:opacity-40"
                                                value={formData.pricingNegotiable ? '' : (formData.startingPrice ?? '')}
                                                placeholder={formData.pricingNegotiable ? 'Negotiable' : '0'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value ? Number(e.target.value) : undefined }))}
                                            />
                                            <p className="text-[11px] text-[var(--text-secondary)] ml-2 font-medium">Enter your normal starting rate. Final fees may still be agreed for each opportunity.</p>
                                            <label className="flex items-center gap-2 mt-2 cursor-pointer ml-2">
                                                <input type="checkbox" className="accent-spark-red w-4 h-4" checked={!!formData.pricingNegotiable} onChange={(e) => setFormData(prev => ({ ...prev, pricingNegotiable: e.target.checked, startingPrice: e.target.checked ? 0 : prev.startingPrice }))} />
                                                <span className="text-xs font-bold text-[var(--text-secondary)]">Negotiable (no fixed starting rate)</span>
                                            </label>
                                        </div>

                                        <div id="field-pricing-basis" className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Pricing Basis <span className="text-spark-red">*</span></label>
                                            <select className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer" value={formData.pricingBasis || ''} onChange={(e) => setFormData(prev => ({ ...prev, pricingBasis: e.target.value as any }))}>
                                                <option value="">Select basis</option>
                                                <option value="Per project">Per project</option>
                                                <option value="Per day">Per day</option>
                                                <option value="Per month">Per month</option>
                                                <option value="Per placement">Per placement</option>
                                                <option value="Negotiable">Negotiable</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div id="field-turnaround-time" className="space-y-2">
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Turnaround Time <span className="text-spark-red">*</span></label>
                                        <select className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer" value={formData.turnaroundTime || ''} onChange={(e) => setFormData(prev => ({ ...prev, turnaroundTime: e.target.value as any }))}>
                                            <option value="">Select turnaround time</option>
                                            <option value="Same day">Same day</option>
                                            <option value="1–3 days">1–3 days</option>
                                            <option value="4–7 days">4–7 days</option>
                                            <option value="Custom">Custom</option>
                                        </select>
                                    </div>
                                </div>

                                {/* ── SECTION G. AVAILABILITY ── */}
                                <div id="field-availability" className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl space-y-4">
                                    <div className="border-b border-[var(--border-color)] pb-3">
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-[0.2em]">Section G</span>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Availability Status</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Current Availability <span className="text-spark-red">*</span></label>
                                        <select className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer" value={formData.availability || ''} onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}>
                                            <option value="">Select availability</option>
                                            <option value="Available Now">Available Now</option>
                                            <option value="Limited">Limited Availability</option>
                                            <option value="Not Available">Not Available</option>
                                        </select>
                                        <p className="text-[11px] text-[var(--text-secondary)] ml-2 font-medium">Choose your present availability. You can change this at any time without resetting profile approval.</p>
                                    </div>
                                </div>

                                {/* ── SECTION H. CONDITIONAL MEDIA FIELDS (Section 9 — WhatsApp TV & Channel Integration) ── */}
                                {((formData.capabilities || user.capabilities || []).map((c: string) => c.toLowerCase()).includes('distribute') && 
                                  (user.services || []).some((s: string) => s.toLowerCase().includes('whatsapp'))) && (
                                    <div id="field-whatsapp-media-information" className="p-8 bg-green-500/5 border border-green-500/20 rounded-3xl space-y-6">
                                        <div className="border-b border-green-500/20 pb-3">
                                            <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Section H</span>
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">WhatsApp Media & Audience Provider Details</h4>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">As a WhatsApp TV / Channel operator, provide your audience figures and placement rate for verification.</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div id="field-whatsapp-media---channel-name" className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Media / Channel Name <span className="text-spark-red">*</span></label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                    value={formData.whatsappMediaName || ''}
                                                    placeholder="e.g. UNILAG Buzz WhatsApp TV"
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappMediaName: e.target.value }))}
                                                />
                                            </div>

                                            <div id="field-whatsapp-media-type" className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">WhatsApp Media Type <span className="text-spark-red">*</span></label>
                                                <select
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer"
                                                    value={formData.whatsappMediaType || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappMediaType: e.target.value as any }))}
                                                >
                                                    <option value="">Select media type</option>
                                                    <option value="Status TV">Status TV</option>
                                                    <option value="Channel">Channel</option>
                                                    <option value="Both">Both</option>
                                                </select>
                                            </div>

                                            <div id="field-institution---campus-coverage" className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Institution / Campus Coverage <span className="text-spark-red">*</span></label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                    value={formData.whatsappCampusCoverage || ''}
                                                    placeholder="e.g. UNILAG, LASU, Yabatech"
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappCampusCoverage: e.target.value }))}
                                                />
                                            </div>

                                            <div id="field-primary-audience-category" className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Primary Audience Category <span className="text-spark-red">*</span></label>
                                                <select
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer"
                                                    value={formData.whatsappPrimaryAudience || ''}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappPrimaryAudience: e.target.value as any }))}
                                                >
                                                    <option value="">Select audience</option>
                                                    <option value="Students">Students</option>
                                                    <option value="Youth">Youth</option>
                                                    <option value="Professionals">Professionals</option>
                                                    <option value="Faith Community">Faith Community</option>
                                                    <option value="Local Community">Local Community</option>
                                                    <option value="Mixed">Mixed</option>
                                                </select>
                                            </div>

                                            {(formData.whatsappMediaType === 'Status TV' || formData.whatsappMediaType === 'Both') && (
                                                <div id="field-average-status-views" className="space-y-2">
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Average Status Views <span className="text-spark-red">*</span></label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                        value={formData.whatsappAverageStatusViews ?? ''}
                                                        placeholder="e.g. 2500"
                                                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappAverageStatusViews: e.target.value ? Number(e.target.value) : undefined }))}
                                                    />
                                                </div>
                                            )}

                                            {(formData.whatsappMediaType === 'Channel' || formData.whatsappMediaType === 'Both') && (
                                                <div id="field-channel-followers-count" className="space-y-2">
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Channel Followers <span className="text-spark-red">*</span></label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                        value={formData.whatsappChannelFollowers ?? ''}
                                                        placeholder="e.g. 10000"
                                                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappChannelFollowers: e.target.value ? Number(e.target.value) : undefined }))}
                                                    />
                                                </div>
                                            )}

                                            <div id="field-rate-per-placement" className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Rate Per Placement (₦) <span className="text-spark-red">*</span></label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                    value={formData.whatsappRatePerPlacement ?? ''}
                                                    placeholder="e.g. 15000"
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappRatePerPlacement: e.target.value ? Number(e.target.value) : undefined }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Package Description (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all text-base text-[var(--text-primary)]"
                                                    value={formData.whatsappPackageDescription || ''}
                                                    placeholder="e.g. 3 posts over 24 hours + broadcast"
                                                    onChange={(e) => setFormData(prev => ({ ...prev, whatsappPackageDescription: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {/* Evidence Upload */}
                                        <div id="field-audience-evidence-screenshot" className="space-y-3 pt-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Audience Evidence Screenshot <span className="text-spark-red">* (Admin Verification Only)</span></label>
                                            
                                            {formData.whatsappAudienceEvidence ? (
                                                <div className="p-4 bg-[var(--bg-primary)] border border-green-500/30 rounded-2xl flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <img src={formData.whatsappAudienceEvidence} alt="Evidence" className="w-12 h-12 rounded-xl object-cover border" />
                                                        <div>
                                                            <p className="text-xs font-bold text-green-600 dark:text-green-400">✓ Evidence Screenshot Uploaded</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)]">Saved for admin review (hidden from public)</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, whatsappAudienceEvidence: undefined }))}
                                                        className="px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-[var(--bg-primary)] border border-dashed border-green-500/30 rounded-2xl text-center space-y-2">
                                                    <p className="text-xs font-bold text-[var(--text-primary)]">Upload recent status views or channel analytics screenshot</p>
                                                    <p className="text-[11px] text-[var(--text-secondary)]">Required for admin verification. Never displayed publicly.</p>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id="evidence-file-input"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                const compressed = await compressImage(file, 800, 800, 0.75);
                                                                setFormData(prev => ({ ...prev, whatsappAudienceEvidence: compressed }));
                                                            } catch (err) {
                                                                alert('Failed to process image');
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => document.getElementById('evidence-file-input')?.click()}
                                                        className="px-5 py-2.5 bg-green-600 text-white text-xs font-black uppercase rounded-xl hover:bg-green-700 transition-all shadow-sm"
                                                    >
                                                        📷 Upload Screenshot Evidence
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Section 8.3: Save Draft vs. Submit for Review Buttons ── */}
                                <div className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-4">
                                    <button type="submit" disabled={loading} className="flex-1 py-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-sm rounded-2xl hover:bg-spark-red/5 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em]">
                                        {loading ? 'Saving Draft...' : '💾 Save Draft'}
                                    </button>
                                    {!user.profileSubmittedForReview ? (
                                        <button type="button" onClick={handleSubmitForReview} disabled={submittingReview} className="flex-1 py-5 bg-gradient-red text-white font-bold text-sm rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em]">
                                            {submittingReview ? 'Submitting...' : '🚀 Submit for Review'}
                                        </button>
                                    ) : (
                                        <div className="flex-1 py-5 bg-green-500/10 border border-green-500/20 text-green-500 font-black text-xs rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest">
                                            ✅ Submitted for Review
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── SPECIALIZED TAB ── */}
                        {activeTab === 'specialized' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {isCreator && (
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Creator Type</label>
                                            <div className="flex gap-4">
                                                <label className="flex-1 cursor-pointer">
                                                    <input type="radio" name="influencerType" value="Campus Creator" checked={formData.influencerType === 'Campus Creator'} onChange={() => setFormData(prev => ({ ...prev, influencerType: 'Campus Creator' }))} className="hidden peer" />
                                                    <div className="p-4 border border-[var(--border-color)] bg-spark-red/5 rounded-2xl peer-checked:border-spark-red peer-checked:bg-spark-red/10 text-center font-bold text-[var(--text-secondary)] peer-checked:text-spark-red transition-all uppercase tracking-widest text-xs">Campus Creator</div>
                                                </label>
                                                <label className="flex-1 cursor-pointer">
                                                    <input type="radio" name="influencerType" value="Professional Creator" checked={formData.influencerType === 'Professional Creator'} onChange={() => setFormData(prev => ({ ...prev, influencerType: 'Professional Creator', university: '' }))} className="hidden peer" />
                                                    <div className="p-4 border border-[var(--border-color)] bg-spark-red/5 rounded-2xl peer-checked:border-spark-red peer-checked:bg-spark-red/10 text-center font-bold text-[var(--text-secondary)] peer-checked:text-spark-red transition-all uppercase tracking-widest text-xs">Professional Creator</div>
                                                </label>
                                            </div>
                                        </div>
                                        {formData.influencerType === 'Campus Creator' && (
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {renderInput('University', 'university', 'Your school name')}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {user.role === 'Brand' && (
                                    <>
                                        {renderInput('Industry Sector', 'industry', 'e.g. Fintech, Fashion')}
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-2">Company Size</label>
                                            <select className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-base text-[var(--text-primary)] appearance-none cursor-pointer" value={formData.companySize} onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}>
                                                <option value="">Select Size</option>
                                                <option value="Startup">Startup (1-10)</option>
                                                <option value="SME">Small/Medium (11-50)</option>
                                                <option value="Enterprise">Corporate (50+)</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {user.role === 'Organization' && (
                                    <>
                                        {renderInput('University', 'university', 'Where you are based')}
                                        {renderInput('Club Category', 'clubType', 'e.g. Sports, Tech')}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── SOCIAL TAB ── */}
                        {activeTab === 'social' && (
                            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                {isCreator ? (
                                    renderInput('TikTok Link', 'tiktok', 'https://tiktok.com/@handle')
                                ) : (
                                    renderInput('Website URL', 'website', 'https://...')
                                )}
                                {renderInput('Instagram Link', 'instagram', 'https://instagram.com/handle')}
                                {renderInput('X / Twitter Link', 'twitter', 'https://x.com/handle')}
                                {renderInput('LinkedIn Link', 'linkedin', 'https://linkedin.com/in/handle')}
                            </div>
                        )}

                        {/* ── SAVE BUTTON (shown on all tabs except commercial which has its own) ── */}
                        {activeTab !== 'commercial' && (
                        <div className="pt-6 border-t border-[var(--border-color)]">
                            {success && (
                                <div className="mb-8 p-6 bg-green-500/10 text-green-500 rounded-2xl font-black text-center animate-in fade-in zoom-in-95 flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    Profile Synced with ABC-Rally!
                                </div>
                            )}
                            <div className="flex gap-4">
                                <button type="submit" disabled={loading} className="flex-1 py-5 bg-gradient-red text-white font-bold text-base rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em]">
                                    {loading ? 'Processing...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </div>
                        )}
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
