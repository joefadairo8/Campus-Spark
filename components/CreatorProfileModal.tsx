import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Briefcase, MapPin, X, Link as LinkIcon, Clock, DollarSign, Zap, Star, Mail, Phone, ExternalLink } from 'lucide-react';

const formatSocialLink = (url: string, platform: string) => {
    if (!url) return '';
    let cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
    if (cleanUrl.startsWith('@')) cleanUrl = cleanUrl.substring(1);
    switch (platform) {
        case 'instagram': return `https://instagram.com/${cleanUrl}`;
        case 'tiktok': return `https://tiktok.com/@${cleanUrl}`;
        case 'twitter': return `https://x.com/${cleanUrl}`;
        case 'linkedin': return cleanUrl.includes('linkedin.com') ? `https://${cleanUrl}` : `https://linkedin.com/in/${cleanUrl}`;
        default: return `https://${cleanUrl}`;
    }
};

const CAPABILITY_COLORS: Record<string, string> = {
    Create: 'bg-spark-red text-white',
    Manage: 'bg-blue-600 text-white',
    Distribute: 'bg-green-600 text-white',
    Activate: 'bg-amber-500 text-white',
};

const parseCreatorPackages = (packagesField: any): { name: string; price: number; description?: string; entails?: string }[] => {
    if (!packagesField) return [];
    if (Array.isArray(packagesField)) {
        return packagesField.map((p: any) => {
            if (typeof p === 'string') return { name: 'Package', price: 0, description: p };
            return {
                name: p.name || p.title || 'Package',
                price: Number(p.price || p.amount || 0),
                description: p.description || p.entails || p.details || ''
            };
        });
    }
    if (typeof packagesField === 'string') {
        try {
            const parsed = JSON.parse(packagesField);
            if (Array.isArray(parsed)) return parseCreatorPackages(parsed);
        } catch {
            return [{ name: 'Custom Package', price: 0, description: packagesField }];
        }
    }
    return [];
};

interface CreatorProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    creator: any;
    actionButton?: React.ReactNode;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({ isOpen, onClose, creator, actionButton }) => {
    const [previousJobs, setPreviousJobs] = useState<any[]>([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [selectedMediaPreview, setSelectedMediaPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !creator || creator.loading) return;
        const fetchJobs = async () => {
            setJobsLoading(true);
            try {
                const q1 = query(collection(db, 'campaignAllocations'), where('creatorId', '==', creator.id));
                const q2 = query(collection(db, 'campaignAllocations'), where('studentId', '==', creator.id));
                
                const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                
                const jobsMap = new Map<string, any>();
                snap1.docs.forEach(doc => jobsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                snap2.docs.forEach(doc => jobsMap.set(doc.id, { id: doc.id, ...doc.data() }));
                
                const jobs = Array.from(jobsMap.values());
                jobs.sort((a: any, b: any) => {
                    const timeA = a.assignedAt?.toMillis ? a.assignedAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                    const timeB = b.assignedAt?.toMillis ? b.assignedAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                    return timeB - timeA;
                });
                setPreviousJobs(jobs);
            } catch (error) {
                console.error("Error fetching creator's previous jobs:", error);
            } finally {
                setJobsLoading(false);
            }
        };
        fetchJobs();
    }, [isOpen, creator]);


    if (!isOpen || !creator) return null;

    if (creator.loading) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-sm" onClick={onClose}></div>
                <div className="relative bg-[var(--bg-primary)] p-12 rounded-[2.5rem] shadow-2xl border border-[var(--border-color)] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 border-4 border-spark-red border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-black text-sm text-[var(--text-primary)]">Loading creator profile...</p>
                </div>
            </div>
        );
    }

    // ── Section 10.2 display rule helpers ──
    const isApproved = creator.reviewStatus === 'approved';
    const availabilityStatus = creator.availability;
    const isAvailableForHire = isApproved && (availabilityStatus === 'Available Now' || availabilityStatus === 'Limited');
    const isNotAvailable = isApproved && availabilityStatus === 'Not available';

    const primaryCap: string | undefined = creator.primaryCapability || (creator.capabilities && creator.capabilities[0]);
    const allCaps: string[] = creator.capabilities || [];
    const additionalCaps = allCaps.filter(c => c !== primaryCap);

    const primarySvc: string | undefined = creator.primaryService || (creator.services && creator.services[0]);
    const allServices: string[] = creator.services || creator.additionalServices || [];
    const otherServices = allServices.filter(s => s !== primarySvc);

    const headline = creator.professionalHeadline || primarySvc || creator.influencerType || creator.niche || creator.nicheCategory || creator.category || creator.role || 'Creator';

    const displayLocation = creator.city && creator.state
        ? `${creator.city}, ${creator.state}`
        : creator.location || null;
    const uniName = creator.university;
    const campusReach: string | undefined = creator.campusCommunityReach;
    const workPref: string | undefined = creator.workPreference;

    const professionalSummary: string | undefined = creator.professionalSummary || creator.bio || creator.description;
    
    // Normalize portfolio items
    const rawPortfolio: any[] = creator.portfolio || [];
    const portfolio = rawPortfolio.map((item: any, idx: number) => {
        if (typeof item === 'string') {
            return { title: `Work Sample ${idx + 1}`, url: item, imageUrl: item, description: '' };
        }
        return {
            title: item.title || item.name || `Work Sample ${idx + 1}`,
            description: item.description || item.details || '',
            url: item.url || item.fileUrl || item.imageUrl || item.link,
            imageUrl: item.fileUrl || item.imageUrl || item.url,
            fileType: item.fileType || 'image'
        };
    });

    const startingPrice = creator.startingPrice;
    const pricingNegotiable: boolean = creator.pricingNegotiable;
    const pricingBasis: string = creator.pricingBasis || 'per project';
    const turnaround: string | undefined = creator.turnaroundTime;
    const packagesList = parseCreatorPackages(creator.packages || creator.servicePackages);

    const isWhatsAppOperator = !!(creator.whatsappMediaName || creator.whatsappMediaType);
    const isCreator = creator.role !== 'Brand' && creator.role !== 'Association' && creator.role !== 'Org';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)] max-h-[90vh] flex flex-col">

                {/* ── Step 1 & 2: Cover + Photo + Name + Headline + Location ── */}
                <div
                    className="relative p-8 pb-10 pt-10 border-b border-[var(--border-color)] bg-cover bg-center bg-no-repeat flex-shrink-0"
                    style={{ backgroundImage: creator.coverPhotoUrl ? `url(${creator.coverPhotoUrl})` : undefined }}
                >
                    {creator.coverPhotoUrl && <div className="absolute inset-0 bg-spark-black/40 backdrop-blur-[1px] z-0"></div>}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 bg-[var(--bg-primary)] hover:bg-spark-red hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                        {/* Step 1: Photo / Logo */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] shadow-xl flex items-center justify-center text-4xl font-black text-spark-red overflow-hidden flex-shrink-0">
                            {creator.imageUrl
                                ? <img src={creator.imageUrl} alt={creator.name} className="w-full h-full object-cover" />
                                : (creator.name || '?').charAt(0)
                            }
                        </div>

                        <div className="text-center sm:text-left flex-1 min-w-0">
                            {/* Step 2: Display name + Badges */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <h2 className={`text-2xl sm:text-3xl font-black ${creator.coverPhotoUrl ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                    {creator.name}
                                </h2>
                                {creator.rating && (
                                    <span className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                        <Star className="w-3.5 h-3.5 fill-current" /> {creator.rating}
                                    </span>
                                )}
                                {isWhatsAppOperator && (
                                    <span className="px-3 py-1 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-sm">
                                        📻 Media & Audience Provider
                                    </span>
                                )}
                            </div>

                            {/* Professional Headline */}
                            <p className={`font-bold text-sm mb-3 leading-snug ${creator.coverPhotoUrl ? 'text-white/90' : 'text-spark-red'}`}>
                                {headline}
                            </p>

                            {/* Step 4: Location + Campus Reach + Work Preference */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-bold">
                                {displayLocation && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${creator.coverPhotoUrl ? 'bg-black/40 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        <MapPin className="w-3 h-3 flex-shrink-0" /> {displayLocation}
                                    </span>
                                )}
                                {uniName && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${creator.coverPhotoUrl ? 'bg-black/40 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        🏫 {uniName}
                                    </span>
                                )}
                                {campusReach && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${creator.coverPhotoUrl ? 'bg-black/40 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        🎓 Reach: {campusReach}
                                    </span>
                                )}
                                {workPref && (
                                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${creator.coverPhotoUrl ? 'bg-black/40 text-white/90' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}>
                                        💼 {workPref}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-7">

                    {/* Step 3: Capability badges + service tags */}
                    {(primaryCap || primarySvc || allCaps.length > 0) && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {primaryCap && (
                                    <span className={`px-4 py-1.5 font-black text-xs rounded-full uppercase tracking-widest shadow-sm ${CAPABILITY_COLORS[primaryCap] || 'bg-spark-red text-white'}`}>
                                        {primaryCap}
                                    </span>
                                )}
                                {additionalCaps.map((cap: string) => (
                                    <span key={cap} className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-[11px] rounded-full border border-[var(--border-color)] uppercase tracking-wide">
                                        {cap}
                                    </span>
                                ))}
                            </div>
                            {(primarySvc || otherServices.length > 0) && (
                                <div className="flex flex-wrap gap-2">
                                    {primarySvc && (
                                        <span className="px-3 py-1.5 bg-spark-red/10 text-spark-red font-black text-[10px] rounded-xl border border-spark-red/20 uppercase tracking-wider">
                                            {primarySvc}
                                        </span>
                                    )}
                                    {otherServices.slice(0, 8).map((svc: string) => (
                                        <span key={svc} className="px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-bold text-[10px] rounded-xl border border-[var(--border-color)]">
                                            {svc}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Professional Summary */}
                    {professionalSummary && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">About & Professional Summary</h3>
                            <div className="p-5 bg-[var(--bg-secondary)] rounded-[1.5rem] border border-[var(--border-color)]">
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                                    {professionalSummary}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 6: Portfolio Samples */}
                    {portfolio.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5" /> Work Samples & Portfolio
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {portfolio.map((item: any, idx: number) => (
                                    <div
                                        key={idx}
                                        onClick={() => item.imageUrl && setSelectedMediaPreview(item.imageUrl)}
                                        className="group relative rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] cursor-pointer hover:border-spark-red/50 transition-all flex flex-col"
                                    >
                                        <div className="aspect-video sm:aspect-square w-full overflow-hidden bg-spark-black/5 relative">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)] text-xs font-bold p-3 text-center">
                                                    <Zap className="w-6 h-6 opacity-40 mb-1" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-black text-[var(--text-primary)] line-clamp-1 group-hover:text-spark-red transition-colors">{item.title}</p>
                                            {item.description && (
                                                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">{item.description}</p>
                                            )}
                                            {item.url && (
                                                <a
                                                    href={formatSocialLink(item.url, 'website')}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="mt-2 text-[10px] text-spark-red font-bold flex items-center gap-1 hover:underline"
                                                >
                                                    View Link <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 6 (cont): Completed Platform Gigs */}
                    {isCreator && (() => {
                        const completedJobs = previousJobs.filter(j => 
                            j.status === 'completed' || j.status === 'paid' || j.status === 'released' || j.status === 'approved'
                        );
                        return (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5" /> Completed Platform Gigs
                                    </h3>
                                    {completedJobs.length > 0 && (
                                        <span className="px-2.5 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                                            ✓ {completedJobs.length} Completed
                                        </span>
                                    )}
                                </div>
                                {jobsLoading ? (
                                    <div className="flex justify-center py-6">
                                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-spark-red"></div>
                                    </div>
                                ) : completedJobs.length === 0 ? (
                                    <div className="text-center p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[1.5rem]">
                                        <Briefcase className="w-6 h-6 mx-auto text-[var(--text-secondary)] opacity-40 mb-1" />
                                        <p className="text-xs font-bold text-[var(--text-secondary)]">No completed platform gigs yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {completedJobs.map((job) => (
                                            <div key={job.id} className="p-4 bg-[var(--bg-primary)] border border-green-500/20 bg-green-500/5 rounded-2xl flex items-center justify-between transition-colors">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-[var(--text-primary)] text-sm">{job.campaignTitle || job.title || 'Campaign Gig'}</h4>
                                                        <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">✓ Verified Completed</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-500/20 text-green-800 dark:text-green-300">
                                                            {job.status === 'paid' ? 'Paid' : 'Completed'}
                                                        </span>
                                                        <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                                                            {job.assignedAt?.toDate ? job.assignedAt.toDate().toLocaleDateString() : (job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'Completed')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="font-black text-[var(--text-primary)] text-sm">
                                                    {Number(job.amount) > 0 ? `₦${Number(job.amount).toLocaleString()}` : 'Standard Reward'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}



                    {/* Step 7: Pricing & Rate Packages */}
                    {(startingPrice !== undefined || pricingNegotiable || turnaround || packagesList.length > 0) && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Pricing & Rate Card</h3>
                            <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] flex flex-wrap gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
                                        <DollarSign className="w-3 h-3 text-spark-red" /> Price Standard
                                    </p>
                                    <p className="font-black text-[var(--text-primary)] text-sm">
                                        {pricingNegotiable
                                            ? 'Price negotiable'
                                            : startingPrice
                                                ? `Starting from ₦${Number(startingPrice).toLocaleString()} / ${pricingBasis}`
                                                : 'Rate negotiable'
                                        }
                                    </p>
                                </div>
                                {turnaround && (
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em] flex items-center gap-1.5 mb-1">
                                            <Clock className="w-3 h-3 text-spark-red" /> Turnaround
                                        </p>
                                        <p className="font-black text-[var(--text-primary)] text-sm">
                                            {turnaround}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {packagesList.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {packagesList.map((pkg, pIdx) => (
                                        <div key={pIdx} className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-black text-sm text-[var(--text-primary)]">{pkg.name}</h4>
                                                {pkg.price > 0 && (
                                                    <span className="text-xs font-black text-spark-red">₦{pkg.price.toLocaleString()}</span>
                                                )}
                                            </div>
                                            {pkg.description && (
                                                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{pkg.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 8: Availability badge */}
                    {isAvailableForHire && (
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></span>
                            <span className="font-black text-green-700 dark:text-green-400 text-xs uppercase tracking-widest">
                                Available for Hire{availabilityStatus === 'Limited' ? ' — Limited Availability' : ''}
                            </span>
                        </div>
                    )}
                    {isNotAvailable && (
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl">
                            <span className="w-2.5 h-2.5 bg-[var(--text-secondary)] rounded-full flex-shrink-0"></span>
                            <span className="font-bold text-[var(--text-secondary)] text-xs uppercase tracking-widest">
                                Not currently available
                            </span>
                        </div>
                    )}

                    {/* Step 9: WhatsApp Media & Audience Reach (conditional) */}
                    {isWhatsAppOperator && (
                        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-[2rem] space-y-4">
                            <div className="flex items-center justify-between border-b border-green-500/20 pb-3">
                                <div>
                                    <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">WhatsApp Media & Audience Reach</span>
                                    <h3 className="text-lg font-black text-[var(--text-primary)]">{creator.whatsappMediaName || creator.name}</h3>
                                </div>
                                <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-black rounded-xl uppercase tracking-wider">
                                    {creator.whatsappMediaType || 'WhatsApp Media'}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Campus / Location</p>
                                    <p className="font-bold text-[var(--text-primary)] mt-0.5">{creator.whatsappCampusCoverage || creator.whatsappCityState || displayLocation || 'Nationwide'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Primary Audience</p>
                                    <p className="font-bold text-[var(--text-primary)] mt-0.5">{creator.whatsappPrimaryAudience || 'General'}</p>
                                </div>
                                {creator.whatsappAverageStatusViews !== undefined && (
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Avg. Status Views</p>
                                        <p className="font-black text-green-600 dark:text-green-400 mt-0.5">{Number(creator.whatsappAverageStatusViews).toLocaleString()} views</p>
                                    </div>
                                )}
                                {creator.whatsappChannelFollowers !== undefined && (
                                    <div>
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Channel Followers</p>
                                        <p className="font-black text-green-600 dark:text-green-400 mt-0.5">{Number(creator.whatsappChannelFollowers).toLocaleString()} followers</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Placement Rate</p>
                                    <p className="font-black text-[var(--text-primary)] mt-0.5">
                                        {creator.whatsappRatePerPlacement
                                            ? `Starting from ₦${Number(creator.whatsappRatePerPlacement).toLocaleString()}`
                                            : startingPrice ? `Starting from ₦${Number(startingPrice).toLocaleString()}` : 'Negotiable'
                                        }
                                    </p>
                                </div>
                            </div>
                            {creator.whatsappPackageDescription && (
                                <div className="pt-2 border-t border-green-500/20">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Package Info</p>
                                    <p className="text-xs text-[var(--text-primary)] font-medium mt-0.5">{creator.whatsappPackageDescription}</p>
                                </div>
                            )}
                            {creator.whatsappAudienceReviewedDate && (
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold pt-1 border-t border-green-500/20">
                                    ✓ Audience information reviewed on {new Date(creator.whatsappAudienceReviewedDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 10: Social links & Contact Info */}
                    {(creator.instagram || creator.tiktok || creator.twitter || creator.linkedin || creator.website || creator.phone) && (
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] flex items-center gap-2">
                                <LinkIcon className="w-3.5 h-3.5" /> Social Profiles & Contact Info
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {creator.instagram && (
                                    <a href={formatSocialLink(creator.instagram, 'instagram')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">Instagram</a>
                                )}
                                {creator.tiktok && (
                                    <a href={formatSocialLink(creator.tiktok, 'tiktok')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">TikTok</a>
                                )}
                                {creator.twitter && (
                                    <a href={formatSocialLink(creator.twitter, 'twitter')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">X / Twitter</a>
                                )}
                                {creator.linkedin && (
                                    <a href={formatSocialLink(creator.linkedin, 'linkedin')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">LinkedIn</a>
                                )}
                                {creator.website && (
                                    <a href={formatSocialLink(creator.website, 'website')} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all">Website</a>
                                )}
                                {creator.phone && (
                                    <a href={`tel:${creator.phone}`} className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-primary)] hover:text-spark-red text-xs font-bold rounded-xl border border-[var(--border-color)] transition-all flex items-center gap-1.5">
                                        <Phone className="w-3 h-3" /> {creator.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    )}


                    {actionButton && (
                        <div className="pt-2">
                            {actionButton}
                        </div>
                    )}
                </div>

            </div>

            {/* Media Lightbox Preview Modal */}
            {selectedMediaPreview && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-spark-black/90 backdrop-blur-md" onClick={() => setSelectedMediaPreview(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
                        <button
                            onClick={() => setSelectedMediaPreview(null)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-spark-red transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img src={selectedMediaPreview} alt="Work preview" className="w-full h-auto max-h-[85vh] object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
};
