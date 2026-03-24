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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header Image Placeholder */}
                <div className="h-48 bg-gradient-to-r from-spark-red/10 to-orange-100 flex items-center justify-center relative">
                    <div className="text-6xl">✨</div>
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-spark-black hover:bg-white transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {/* Date Badge */}
                    <div className="absolute bottom-6 left-8 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg">
                        <p className="text-xl font-black text-spark-red">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">

                    {/* Title & Host */}
                    <div>
                        <h2 className="text-3xl font-black text-spark-black leading-tight mb-2">{event.name}</h2>
                        <div className="flex items-center space-x-2 text-spark-gray font-bold">
                            <span>Hosted by <span className="text-spark-black">{event.hostName}</span></span>
                            <span>•</span>
                            <span>{event.university}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">Date & Time</p>
                            <p className="text-lg font-black text-spark-black">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">Sponsorship Goal</p>
                            <p className="text-lg font-black text-spark-black">₦{event.targetSponsorship?.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-3">
                        <h4 className="font-black text-lg text-spark-black">About Event</h4>
                        <p className="text-spark-gray leading-relaxed">{event.description}</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                    <button className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100">
                        Interested
                    </button>
                    {onContact && userRole && (
                        <button
                            onClick={() => onContact(event)}
                            className="flex-1 py-4 bg-white border-2 border-gray-100 text-spark-black font-black rounded-2xl hover:border-spark-black transition-all"
                        >
                            {userRole === 'Brand' ? 'Sponsor Event' : 'Apply to Volunteer'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
