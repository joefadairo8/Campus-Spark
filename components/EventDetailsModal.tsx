import React from 'react';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    userRole?: 'Creator' | 'Brand' | 'Org' | 'Student';
    onContact?: (event: any, selectedPackage?: any) => void;
}

export const parsePackages = (packagesField: any): { name: string; price: number; entails: string; }[] => {
    if (!packagesField) return [];
    if (Array.isArray(packagesField)) return packagesField;
    if (typeof packagesField === 'string') {
        try {
            const parsed = JSON.parse(packagesField);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // legacy plain text fallback
            return [{ name: 'Custom Sponsorship', price: 0, entails: packagesField }];
        }
    }
    return [];
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, userRole, onContact }) => {
    if (!isOpen || !event) return null;

    const packages = parsePackages(event.sponsorshipPackages);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto border border-[var(--border-color)]">

                {/* Header Image Placeholder */}
                <div className="h-40 bg-spark-red flex items-center justify-center relative">
                    <div className="text-4xl">✨</div>
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-spark-red transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {/* Date Badge */}
                    <div className="absolute bottom-6 left-8 bg-[var(--bg-primary)]/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-spark-red/10">
                        <p className="text-lg font-fancy font-black text-spark-red">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] modal-content-scroll">

                    {/* Title & Host */}
                    <div>
                        <h2 className="text-2xl font-fancy font-black text-[var(--text-primary)] leading-tight mb-2 tracking-tighter">{event.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-widest">
                            <span>Hosted by <span className="text-spark-red">{event.hostName}</span></span>
                            <span className="opacity-30">•</span>
                            <span>{event.university}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className={`grid ${userRole !== 'Creator' && userRole !== 'Student' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                        <div className="p-5 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">Date & Time</p>
                            <p className="text-base font-black text-[var(--text-primary)]">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="p-5 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">Location</p>
                            <p className="text-base font-black text-[var(--text-primary)] line-clamp-1">{event.location || 'TBA'}</p>
                        </div>
                        {userRole !== 'Creator' && userRole !== 'Student' && (
                            <div className="p-5 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">Sponsorship Goal</p>
                                <p className="text-base font-black text-[var(--text-primary)]">₦{event.targetSponsorship?.toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h4 className="font-black text-[10px] text-spark-red uppercase tracking-widest">About Event</h4>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{event.description}</p>
                    </div>

                    {/* Sponsorship Packages */}
                    {packages.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                            <h4 className="font-black text-[10px] text-spark-red uppercase tracking-widest">Sponsorship Packages</h4>
                            <div className="grid gap-4">
                                {packages.map((pkg, idx) => (
                                    <div key={idx} className="p-5 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="font-black text-sm text-[var(--text-primary)]">{pkg.name}</span>
                                                <span className="text-xs font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-lg">
                                                    ₦{Number(pkg.price).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{pkg.entails}</p>
                                        </div>
                                        {userRole === 'Brand' && onContact && (
                                            <button
                                                onClick={() => onContact(event, pkg)}
                                                className="px-5 py-2.5 bg-spark-red text-white hover:bg-red-700 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto shadow-sm"
                                            >
                                                Select & Pay
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-[var(--border-color)] flex flex-wrap gap-4">
                    {onContact && userRole && (
                        userRole === 'Brand' ? (
                            /* For brands: only show a custom-offer button when NO packages are defined.
                               If packages exist, sponsors must use the "Select & Pay" buttons above. */
                            packages.length === 0 ? (
                                <button
                                    onClick={() => onContact(event)}
                                    className="flex-[1.5] py-4 bg-gradient-red text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all text-xs uppercase tracking-widest"
                                >
                                    Sponsor Event
                                </button>
                            ) : (
                                <p className="w-full text-center text-xs font-bold text-[var(--text-secondary)] opacity-60 py-1">
                                    Select a package above to proceed with sponsorship.
                                </p>
                            )
                        ) : (
                            <button
                                onClick={() => onContact(event)}
                                className="flex-[1.5] py-4 bg-gradient-red text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all text-xs uppercase tracking-widest"
                            >
                                Apply to Volunteer
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
