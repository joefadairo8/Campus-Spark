import React, { useState } from 'react';

interface ProposalDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposal: any;
    onUpdateStatus: (id: string, status: 'accepted' | 'rejected' | 'reviewing') => Promise<void>;
    isSender: boolean;
}

export const ProposalDetailsModal: React.FC<ProposalDetailsModalProps> = ({ isOpen, onClose, proposal, onUpdateStatus, isSender }) => {
    const [updating, setUpdating] = useState(false);

    if (!isOpen || !proposal) return null;

    const otherParty = isSender ? proposal.recipient : proposal.sender;

    const handleAction = async (status: 'accepted' | 'rejected' | 'reviewing') => {
        setUpdating(true);
        try {
            await onUpdateStatus(proposal.id, status);
            onClose();
        } catch (error) {
            console.error("Action failed", error);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-spark-black">Proposal Details</h3>
                        <p className="text-sm font-bold text-spark-gray mt-1">
                            {isSender ? `Sent to ${otherParty.name}` : `Received from ${otherParty.name}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-spark-gray hover:text-spark-red shadow-sm transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">

                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${proposal.status === 'accepted' ? 'bg-green-50 text-green-700' :
                            proposal.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                proposal.status === 'reviewing' ? 'bg-blue-50 text-blue-700' :
                                    'bg-yellow-50 text-yellow-700'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${proposal.status === 'accepted' ? 'bg-green-500' :
                                proposal.status === 'rejected' ? 'bg-red-500' :
                                    proposal.status === 'reviewing' ? 'bg-blue-500' :
                                        'bg-yellow-500'
                            }`}></div>
                        <span className="font-black uppercase text-xs tracking-widest">
                            Current Status: {proposal.status}
                        </span>
                    </div>

                    {/* Checkers for budget and timeline */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">Proposed Budget</p>
                            <p className="text-xl font-black text-spark-black">{proposal.budget ? `₦${Number(proposal.budget).toLocaleString()}` : 'Not specificed'}</p>
                        </div>
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">Timeline</p>
                            <p className="text-xl font-black text-spark-black">{proposal.timeline || 'Flexible'}</p>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest">Proposal Message</p>
                        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 text-spark-black leading-relaxed whitespace-pre-wrap">
                            {proposal.message}
                        </div>
                    </div>

                    {/* Sender/Recipient Info */}
                    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl">
                        <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red font-black text-xl">
                            {otherParty.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-spark-black">{otherParty.name}</p>
                            <p className="text-xs font-bold text-spark-gray">{otherParty.email}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                    {isSender ? (
                        <div className="w-full text-center">
                            <p className="text-spark-gray font-bold text-sm">
                                {proposal.status === 'pending' ? 'Waiting for response...' : `This proposal was ${proposal.status}.`}
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {proposal.status !== 'rejected' && (
                                <button
                                    onClick={() => handleAction('rejected')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-white border-2 border-gray-100 text-spark-gray font-black rounded-2xl hover:border-red-100 hover:text-red-500 hover:bg-red-50 transition-all flex-1"
                                >
                                    Decline
                                </button>
                            )}

                            {proposal.status === 'pending' && (
                                <button
                                    onClick={() => handleAction('reviewing')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-blue-50 text-blue-600 font-black rounded-2xl hover:bg-blue-100 transition-all flex-1"
                                >
                                    Mark as Reviewing
                                </button>
                            )}

                            {proposal.status !== 'accepted' && (
                                <button
                                    onClick={() => handleAction('accepted')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100 flex-1"
                                >
                                    Accept Proposal
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
