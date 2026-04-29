import React from 'react';

interface EventDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    userRole?: 'Student' | 'Brand' | 'Org';
    onContact?: (event: any) => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ isOpen, onClose, event, userRole, onContact }) => {
    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto border border-[var(--border-color)]">

                {/* Header Image Placeholder */}
                <div className="h-40 bg-gradient-to-r from-spark-red/10 to-orange-100 flex items-center justify-center relative">
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
                <div className="p-8 space-y-8">

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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">Date & Time</p>
                            <p className="text-base font-black text-[var(--text-primary)]">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="p-5 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-1 opacity-70">Sponsorship Goal</p>
                            <p className="text-base font-black text-[var(--text-primary)]">₦{event.targetSponsorship?.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h4 className="font-black text-[10px] text-spark-red uppercase tracking-widest">About Event</h4>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{event.description}</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-[var(--border-color)] flex flex-wrap gap-4">
                    <button className="flex-1 py-4 bg-spark-red text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-xs uppercase tracking-widest">
                        Interested
                    </button>
                    {onContact && userRole && (
                        <button
                            onClick={() => onContact(event)}
                            className="flex-[1.5] py-4 bg-gradient-red text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all text-xs uppercase tracking-widest"
                        >
                            {userRole === 'Brand' ? 'Sponsor Event' : 'Apply to Volunteer'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
