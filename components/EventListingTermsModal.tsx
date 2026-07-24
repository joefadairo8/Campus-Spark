import React, { useState } from 'react';
import { ShieldCheck, Percent, CreditCard, Scale, FileText, CheckCircle2, X } from 'lucide-react';

interface EventListingTermsModalProps {
    isOpen: boolean;
    onAccept: () => void;
    onDecline: () => void;
    accentColor?: 'purple' | 'red';
}

export const EventListingTermsModal: React.FC<EventListingTermsModalProps> = ({
    isOpen,
    onAccept,
    onDecline,
    accentColor = 'purple'
}) => {
    const [agreedCheck, setAgreedCheck] = useState(false);

    if (!isOpen) return null;

    const primaryColor = accentColor === 'red' ? 'spark-red' : 'spark-purple';
    const bgGradient = accentColor === 'red' 
        ? 'from-spark-red to-red-600' 
        : 'from-spark-purple to-purple-700';
    const buttonBg = accentColor === 'red'
        ? 'bg-spark-red hover:bg-red-700 shadow-red-900/20'
        : 'bg-spark-purple hover:bg-purple-700 shadow-purple-900/20';

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                
                {/* Header */}
                <div className={`bg-gradient-to-r ${bgGradient} p-6 sm:p-8 text-white relative overflow-hidden flex-shrink-0`}>
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-2">
                                <ShieldCheck className="w-3 h-3" /> Event Listing Policy & Terms
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Terms & Conditions</h2>
                            <p className="text-white/80 text-xs font-bold mt-1">
                                Please review and accept the event listing rules before creating your event.
                            </p>
                        </div>
                        <button
                            onClick={onDecline}
                            className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white font-black transition-all flex-shrink-0"
                            title="Decline and close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                    
                    {/* Key Callout: 10% Fee */}
                    <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 font-black">
                            <Percent className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
                                10% Platform Commission Fee
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                ABC Rally charges a <strong>10% service fee</strong> on all successful sponsorship funds raised for your event. This fee is automatically deducted from payouts to maintain platform security, escrow processing, and sponsor matching.
                            </p>
                        </div>
                    </div>

                    {/* Term Items */}
                    <div className="space-y-4">
                        
                        {/* Term 1: All Payments Through Platform */}
                        <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-start gap-4">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                                    All Payments Must Go Through Platform
                                </h5>
                                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                    All sponsorship funds, brand contributions, and financial transactions for this event must be processed exclusively via the ABC Rally secure payment portal. Soliciting or accepting off-platform payments for listed events is strictly prohibited.
                                </p>
                            </div>
                        </div>

                        {/* Term 2: In-Platform Dispute Resolution */}
                        <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-start gap-4">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                <Scale className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                                    Mandatory In-Platform Dispute Resolution
                                </h5>
                                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Any disagreements, non-fulfillment of agreed sponsorship deliverables, or payment issues must be formally submitted and mediated through the <strong>ABC Rally Disputes System</strong> for official platform arbitration.
                                </p>
                            </div>
                        </div>

                        {/* Term 3: Truthful Event Details */}
                        <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-start gap-4">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="space-y-1">
                                <h5 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                                    Accurate Deliverables & Fulfillment
                                </h5>
                                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                    Event listers agree to fulfill all promised activation perks (branding, booth spaces, attendee access) as stated in their package descriptions for confirmed brand sponsors.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Quick Confirmation Checkbox */}
                    <label className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)]/60 border border-[var(--border-color)] rounded-2xl cursor-pointer hover:bg-[var(--bg-secondary)] transition-all">
                        <input
                            type="checkbox"
                            checked={agreedCheck}
                            onChange={(e) => setAgreedCheck(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-spark-purple focus:ring-spark-purple cursor-pointer accent-spark-purple"
                        />
                        <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                            I have read, understood, and agree to the 10% platform fee, in-platform payment policy, and dispute resolution guidelines.
                        </span>
                    </label>

                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between gap-4 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onDecline}
                        className="px-6 py-3.5 bg-[var(--bg-primary)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={!agreedCheck}
                        className={`px-8 py-3.5 ${buttonBg} text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <CheckCircle2 className="w-4 h-4" /> Accept & Proceed to Form
                    </button>
                </div>

            </div>
        </div>
    );
};
