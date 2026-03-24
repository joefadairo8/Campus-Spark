import React, { useState } from 'react';
import { apiClient } from '../firebase';

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
                    <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-spark-black' : 'text-spark-gray'}`}>
                        <span className="text-spark-red font-black block mb-1">📢 New Partnership Proposal</span>
                        {n.message}
                    </p>

                    {metadata.proposalMessage && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-spark-black italic my-1">
                            "{metadata.proposalMessage}"
                        </div>
                    )}

                    <div className="flex gap-4 text-[10px] font-bold text-spark-gray uppercase tracking-wider">
                        {metadata.budget && <span>💰 {metadata.budget}</span>}
                        {metadata.timeline && <span>⏱️ {metadata.timeline}</span>}
                    </div>

                    {isPending && !n.read && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRespond(n.id, 'accepted'); }}
                                disabled={!!processingId}
                                className="flex-1 py-2 bg-spark-black text-white text-xs font-black rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                {processingId === n.id ? '...' : 'Accept'}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRespond(n.id, 'rejected'); }}
                                disabled={!!processingId}
                                className="flex-1 py-2 bg-gray-100 text-spark-gray text-xs font-black rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {!isPending && (
                        <div className={`mt-2 text-xs font-black uppercase tracking-wider ${metadata.status === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                            {metadata.status === 'accepted' ? '✅ Accepted' : '❌ Rejected'}
                        </div>
                    )}
                </div>
            );
        }

        if (n.type === 'partnership_response') {
            const isAccepted = metadata.status === 'accepted';
            return (
                <div className="flex flex-col gap-1">
                    <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-spark-black' : 'text-spark-gray'}`}>
                        <span className={`${isAccepted ? 'text-green-600' : 'text-red-500'} font-black block mb-1`}>
                            {isAccepted ? '🎉 Offer Accepted!' : '🚫 Offer Declined'}
                        </span>
                        {n.message}
                    </p>
                    {metadata.originalMessage && (
                        <p className="text-xs text-spark-gray mt-1 line-clamp-1 italic">
                            Re: {metadata.originalMessage}
                        </p>
                    )}
                </div>
            );
        }

        // Default notification
        return (
            <p className={`text-sm leading-relaxed ${!n.read ? 'font-black text-spark-black' : 'text-spark-gray'}`}>
                {n.message}
            </p>
        );
    };

    return (
        <div className="fixed sm:absolute top-20 sm:top-16 right-4 sm:right-0 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in slide-in-from-top-2 duration-300">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-black text-spark-black">Notifications</h3>
                <button onClick={onClose} className="text-spark-gray hover:text-spark-red transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="text-3xl mb-3">🔔</div>
                        <p className="text-spark-gray text-sm font-bold">No notifications yet!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-5 hover:bg-gray-50 transition-colors relative group ${!n.read ? 'bg-red-50/30' : ''}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-spark-red' : 'bg-transparent'}`}></div>

                                    <div className="flex-1">
                                        {renderNotificationContent(n)}
                                        <p className="text-[10px] text-spark-gray mt-2 font-bold uppercase tracking-wider">
                                            {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                {!n.read && n.type !== 'partnership_proposal' && (
                                    <button
                                        onClick={() => onMarkAsRead(n.id)}
                                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 bg-white p-2 rounded-xl border border-gray-100 shadow-sm text-spark-red hover:bg-red-50 transition-all font-black text-[10px]"
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
                <div className="p-4 bg-gray-50 text-center sticky bottom-0 border-t border-gray-100">
                    <button className="text-spark-red font-black text-xs uppercase tracking-widest hover:underline">View All Activity</button>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
