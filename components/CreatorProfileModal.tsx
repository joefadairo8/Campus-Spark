import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, Star, MapPin, GraduationCap, X, Link as LinkIcon } from 'lucide-react';

const formatSocialLink = (url: string, platform: string) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        return cleanUrl;
    }
    if (cleanUrl.startsWith('@')) {
        cleanUrl = cleanUrl.substring(1);
    }
    switch (platform) {
        case 'instagram':
            return `https://instagram.com/${cleanUrl}`;
        case 'tiktok':
            return `https://tiktok.com/@${cleanUrl}`;
        case 'twitter':
            return `https://x.com/${cleanUrl}`;
        case 'linkedin':
            return cleanUrl.includes('linkedin.com') ? `https://${cleanUrl}` : `https://linkedin.com/in/${cleanUrl}`;
        default:
            return `https://${cleanUrl}`;
    }
};

interface CreatorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    creator: any;
    actionButton?: React.ReactNode;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({ isOpen, onClose, creator, actionButton }) => {
    const [previousJobs, setPreviousJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !creator) return;

        const fetchJobs = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'campaignAllocations'),
                    where('studentId', '==', creator.id)
                );
                const snap = await getDocs(q);
                const jobs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort by assignedAt descending
                jobs.sort((a: any, b: any) => {
                    const timeA = a.assignedAt?.toMillis() || 0;
                    const timeB = b.assignedAt?.toMillis() || 0;
                    return timeB - timeA;
                });
                setPreviousJobs(jobs);
            } catch (error) {
                console.error("Error fetching creator's previous jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [isOpen, creator]);

    if (!isOpen || !creator) return null;

    const completedJobs = previousJobs.filter(job => job.status === 'paid' || job.status === 'completed');
    const totalEarnings = completedJobs.reduce((sum, job) => sum + (Number(job.amount) || 0), 0);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)] max-h-[90vh] flex flex-col">
                
                {/* Header Profile Section */}
                <div 
                    className="relative p-8 pb-12 pt-10 border-b border-[var(--border-color)] bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: creator.coverPhotoUrl ? `url(${creator.coverPhotoUrl})` : undefined }}
                >
                    {creator.coverPhotoUrl && <div className="absolute inset-0 bg-spark-black/35 backdrop-blur-[1px] z-0"></div>}
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 w-10 h-10 bg-[var(--bg-primary)] hover:bg-spark-purple hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] shadow-xl flex items-center justify-center text-4xl font-black text-spark-purple overflow-hidden flex-shrink-0">
                            {creator.imageUrl ? (
                                <img src={creator.imageUrl} alt={creator.name} className="w-full h-full object-cover" />
                            ) : (
                                (creator.name || '?').charAt(0)
                            )}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h2 className={`text-2xl sm:text-3xl font-black mb-1 ${creator.coverPhotoUrl ? 'text-white' : 'text-[var(--text-primary)]'}`}>{creator.name}</h2>
                            <p className={`${creator.coverPhotoUrl ? 'text-white/90' : 'text-spark-purple'} font-bold uppercase tracking-widest text-xs mb-3`}>
                                {creator.influencerType || creator.role || 'Creator'}
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-[11px] font-bold">
                                {((creator.role === 'Brand' && creator.industry) || (creator.role !== 'Brand' && creator.influencerType !== 'Professional Creator' && creator.university)) && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${creator.coverPhotoUrl ? 'bg-black/30 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        {creator.role === 'Brand' ? creator.industry : creator.university}
                                    </span>
                                )}
                                {creator.location && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${creator.coverPhotoUrl ? 'bg-black/30 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        <MapPin className="w-3.5 h-3.5" />
                                        {creator.location}
                                    </span>
                                )}
                                {(creator.companySize || creator.clubType) && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${creator.coverPhotoUrl ? 'bg-black/30 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {creator.role === 'Brand' ? creator.companySize : creator.clubType}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    
                    {/* Contact Info */}
                    {creator.email && (
                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Email</p>
                            <p className="font-bold text-[var(--text-primary)] text-sm">{creator.email}</p>
                        </div>
                    )}

                    {/* About Section */}
                    {creator.bio && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> About {creator.role === 'Brand' ? 'Brand' : (creator.role === 'Association' || creator.role === 'Org') ? 'Association' : 'Creator'}
                            </h3>
                            <div className="p-5 bg-[var(--bg-secondary)] rounded-[1.5rem] border border-[var(--border-color)]">
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {creator.bio}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {(creator.instagram || creator.tiktok || creator.twitter || creator.linkedin || creator.website) && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <LinkIcon className="w-3.5 h-3.5" /> Social Profiles
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {creator.instagram && (
                                    <a href={formatSocialLink(creator.instagram, 'instagram')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-purple/10 text-[var(--text-primary)] hover:text-spark-purple text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">
                                        Instagram
                                    </a>
                                )}
                                {creator.tiktok && (
                                    <a href={formatSocialLink(creator.tiktok, 'tiktok')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-purple/10 text-[var(--text-primary)] hover:text-spark-purple text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">
                                        TikTok
                                    </a>
                                )}
                                {creator.twitter && (
                                    <a href={formatSocialLink(creator.twitter, 'twitter')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-purple/10 text-[var(--text-primary)] hover:text-spark-purple text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">
                                        X / Twitter
                                    </a>
                                )}
                                {creator.linkedin && (
                                    <a href={formatSocialLink(creator.linkedin, 'linkedin')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-purple/10 text-[var(--text-primary)] hover:text-spark-purple text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">
                                        LinkedIn
                                    </a>
                                )}
                                {creator.website && (
                                    <a href={formatSocialLink(creator.website, 'website')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-purple/10 text-[var(--text-primary)] hover:text-spark-purple text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Previous Jobs Section */}
                    {(creator.role !== 'Brand' && creator.role !== 'Association' && creator.role !== 'Org') && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> Previous Gigs & Campaigns
                            </h3>
                            
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spark-purple"></div>
                                </div>
                            ) : previousJobs.length === 0 ? (
                                <div className="text-center p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[1.5rem]">
                                    <Briefcase className="w-8 h-8 mx-auto text-[var(--text-secondary)] opacity-50 mb-3" />
                                    <p className="text-sm font-bold text-[var(--text-primary)]">No past jobs found</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">This creator hasn't completed any gigs yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {previousJobs.map((job) => (
                                        <div key={job.id} className="p-5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[1.5rem] flex items-center justify-between hover:border-spark-purple/30 transition-colors">
                                            <div>
                                                <h4 className="font-black text-[var(--text-primary)] text-sm">{job.campaignTitle || 'Unnamed Gig'}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                        job.status === 'paid' || job.status === 'completed' 
                                                            ? 'bg-green-100 text-green-700'
                                                            : job.status === 'active' || job.status === 'escrow'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                    <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                                                        {job.assignedAt?.toDate ? job.assignedAt.toDate().toLocaleDateString() : 'Unknown date'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-[var(--text-primary)]">
                                                    {Number(job.amount) > 0 ? `₦${Number(job.amount).toLocaleString()}` : 'Volunteer'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Button Slot */}
                    {actionButton && (
                        <div className="pt-4 mt-auto">
                            {actionButton}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
