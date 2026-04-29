import React, { useState } from 'react';
import { apiClient } from '../firebase';
import { ArrowRight, CheckCircle2, XCircle, Bell, Megaphone, Wallet, Clock } from 'lucide-react';

interface Notification {
    id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
    metadata?: string;
}

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onMarkAsRead, onClose }) => {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleRespond = async (id: string, status: 'accepted' | 'rejected') => {
        setProcessingId(id);
        try {
            await apiClient.patch(`partnerships/${id}`, { status });
            // Ideally we should refresh notifications here, but onMarkAsRead will trigger a refresh in parent usually
            onMarkAsRead(id);
            alert(`Proposal ${status} successfully!`);
        } catch (error) {
            console.error("Response error:", error);
            alert("Failed to send response.");
        } finally {
            setProcessingId(null);
        }
    };

    const renderNotificationContent = (n: Notification) => {
        let metadata: any = {};
        try {
            metadata = n.metadata ? JSON.parse(n.metadata) : {};
        } catch (e) {
            console.error("Error parsing notification metadata", e);
        }

        if (n.type === 'partnership_proposal') {
            const isPending = metadata.status === 'pending';

            return (
                <div className="flex flex-col gap-2 w-full">
                    <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        <span className="text-spark-red font-black flex items-center gap-2 mb-1">
                            <Megaphone className="w-4 h-4" /> New Partnership Proposal
                        </span>
                        {n.message}
                    </p>

                    {metadata.proposalMessage && (
                        <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-primary)] italic my-1">
                            "{metadata.proposalMessage}"
                        </div>
                    )}

                    <div className="flex gap-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        {metadata.budget && <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> {metadata.budget}</span>}
                        {metadata.timeline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {metadata.timeline}</span>}
                    </div>

                    {isPending && !n.read && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRespond(n.id, 'accepted'); }}
                                disabled={!!processingId}
                                className="flex-1 py-2 bg-spark-black text-white text-xs font-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                {processingId === n.id ? '...' : 'Accept'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRespond(n.id, 'rejected'); }}
                                disabled={!!processingId}
                                className="flex-1 py-2 bg-spark-red text-white text-xs font-black rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {!isPending && (
                        <div className={`mt-2 text-xs font-black uppercase tracking-wider ${metadata.status === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                            {metadata.status === 'accepted' ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Accepted</span> : <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>}
                        </div>
                    )}
                </div>
            );
        }

        if (n.type === 'partnership_response') {
            const isAccepted = metadata.status === 'accepted';
            return (
                <div className="flex flex-col gap-1">
                    <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        <span className={`${isAccepted ? 'text-green-600' : 'text-red-500'} font-black block mb-1`}>
                            {isAccepted ? <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Offer Accepted!</span> : <span className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Offer Declined</span>}
                        </span>
                        {n.message}
                    </p>
                    {metadata.originalMessage && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1 italic">
                            Re: {metadata.originalMessage}
                        </p>
                    )}
                </div>
            );
        }

        // Default notification
        return (
            <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {n.message}
            </p>
        );
    };

    return (
        <div className="fixed sm:absolute top-20 sm:top-16 right-4 sm:right-0 w-[calc(100vw-2rem)] sm:w-96 bg-[var(--bg-primary)] rounded-3xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-[110] animate-in slide-in-from-top-2 duration-300">
            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)] sticky top-0 z-10">
                <h3 className="font-black text-[var(--text-primary)]">Notifications</h3>
                <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="text-center py-24 px-8">
                        <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                            <Bell className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">All caught up!</h3>
                        <p className="text-[var(--text-secondary)] font-medium">You have no new notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-5 hover:bg-[var(--bg-primary)] transition-colors relative group ${!n.read ? 'bg-red-50/30' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-spark-red' : 'bg-transparent'}`}></div>

                                    <div className="flex-1">
                                        {renderNotificationContent(n)}
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-wider">
                                            {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {!n.read && n.type !== 'partnership_proposal' && (
                                    <button
                                        onClick={() => onMarkAsRead(n.id)}
                                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 bg-spark-black text-white p-2 rounded-xl shadow-sm hover:bg-spark-red transition-all font-black text-[10px]"
                                    >
                                        Mark Read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {notifications.length > 0 && (
                <div className="p-4 bg-[var(--bg-primary)] text-center sticky bottom-0 border-t border-[var(--border-color)]">
                    <button className="text-spark-red font-black text-xs uppercase tracking-widest hover:underline">View All Activity</button>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
