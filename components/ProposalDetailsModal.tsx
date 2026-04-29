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

    const otherParty = (isSender ? proposal.recipient : proposal.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };

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
            <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-[var(--border-color)]">

                {/* Header */}
                <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-primary)]">
                    <div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Proposal Details</h3>
                        <p className="text-sm font-bold text-[var(--text-secondary)] mt-1">
                            {isSender ? `Sent to ${otherParty.name}` : `Received from ${otherParty.name}`}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">

                    {/* Status Banner */}
                    <div className={`p-4 rounded-2xl flex items-center gap-3 border ${proposal.status === 'accepted' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                            proposal.status === 'rejected' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' :
                                proposal.status === 'reviewing' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                    'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
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
                        <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Proposed Budget</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{proposal.budget ? `₦${Number(proposal.budget).toLocaleString()}` : 'Not specificed'}</p>
                        </div>
                        <div className="p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Timeline</p>
                            <p className="text-xl font-black text-[var(--text-primary)]">{proposal.timeline || 'Flexible'}</p>
                        </div>
                    </div>

                    {/* Message Body */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Proposal Message</p>
                        <div className="p-6 bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                            {proposal.message}
                        </div>
                    </div>

                    {/* Proposal Document */}
                    {proposal.documentUrl && (
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Attached Document</p>
                            <div className="p-6 bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    </div>
                                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]">{proposal.documentName || 'Proposal Document'}</span>
                                </div>
                                <a
                                    href={proposal.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-spark-red text-white text-xs font-black rounded-xl hover:bg-red-700 transition-all shadow-md"
                                >
                                    Download
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Sender/Recipient Info */}
                    <div className="flex items-center gap-4 p-4 border border-[var(--border-color)] rounded-2xl">
                        <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red font-black text-xl">
                            {otherParty.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-[var(--text-primary)]">{otherParty.name}</p>
                            <p className="text-xs font-bold text-[var(--text-secondary)]">{otherParty.email}</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                    {isSender ? (
                        <div className="w-full text-center">
                            <p className="text-[var(--text-secondary)] font-bold text-sm">
                                {proposal.status === 'pending' ? 'Waiting for response...' : `This proposal was ${proposal.status}.`}
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            {proposal.status !== 'rejected' && (
                                <button
                                    onClick={() => handleAction('rejected')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all flex-1"
                                >
                                    Decline
                                </button>
                            )}

                            {proposal.status === 'pending' && (
                                <button
                                    onClick={() => handleAction('reviewing')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-black rounded-2xl hover:bg-[var(--bg-secondary)] transition-all flex-1 border border-[var(--border-color)]"
                                >
                                    Mark as Reviewing
                                </button>
                            )}

                            {proposal.status !== 'accepted' && (
                                <button
                                    onClick={() => handleAction('accepted')}
                                    disabled={updating}
                                    className="px-6 py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-2xl hover:bg-spark-red hover:text-white transition-all shadow-xl shadow-black/5 flex-1"
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
