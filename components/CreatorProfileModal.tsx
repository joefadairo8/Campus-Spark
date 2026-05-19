import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, Star, MapPin, GraduationCap, X } from 'lucide-react';

interface CreatorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    creator: any;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({ isOpen, onClose, creator }) => {
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
                <div className="relative bg-gradient-to-r from-spark-purple/10 to-transparent p-8 pb-12 pt-10 border-b border-[var(--border-color)]">
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 w-10 h-10 bg-[var(--bg-primary)] hover:bg-spark-purple hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] shadow-xl flex items-center justify-center text-4xl font-black text-spark-purple overflow-hidden flex-shrink-0">
                            {creator.imageUrl ? (
                                <img src={creator.imageUrl} alt={creator.name} className="w-full h-full object-cover" />
                            ) : (
                                (creator.name || '?').charAt(0)
                            )}
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] mb-1">{creator.name}</h2>
                            <p className="text-spark-purple font-bold uppercase tracking-widest text-xs mb-3">
                                {creator.role || 'Creator'}
                            </p>
                            
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-[11px] font-bold text-[var(--text-secondary)]">
                                {creator.university && (
                                    <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        {creator.university}
                                    </span>
                                )}
                                {creator.location && (
                                    <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {creator.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    
                    {/* About Section */}
                    {creator.bio && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> About Creator
                            </h3>
                            <div className="p-5 bg-[var(--bg-secondary)] rounded-[1.5rem] border border-[var(--border-color)]">
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {creator.bio}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Portfolio */}
                    <div>
                        <a 
                            href={creator.portfolioUrl || '#'}
                            target={creator.portfolioUrl ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            onClick={(e) => {
                                if (!creator.portfolioUrl) {
                                    e.preventDefault();
                                    alert('This creator has not added a portfolio link yet.');
                                }
                            }}
                            className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black text-center rounded-[1.5rem] hover:bg-spark-purple hover:text-white transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            <Briefcase className="w-5 h-5" /> View Portfolio
                        </a>
                    </div>

                    {/* Previous Jobs Section */}
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
                                                {Number(job.amount) > 0 ? `â‚¦${Number(job.amount).toLocaleString()}` : 'Volunteer'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
