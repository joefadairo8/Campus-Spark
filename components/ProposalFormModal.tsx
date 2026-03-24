import React, { useState } from 'react';

interface ProposalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
    initialMessage?: string;
    onSubmit: (data: { recipientId: string; message: string; budget?: string; timeline?: string }) => Promise<void>;
}

export const ProposalFormModal: React.FC<ProposalFormModalProps> = ({
    isOpen,
    onClose,
    recipientName,
    recipientId,
    initialMessage = '',
    onSubmit
}) => {
    const [message, setMessage] = useState(initialMessage);
    const [budget, setBudget] = useState('');
    const [timeline, setTimeline] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setError('Please enter a proposal message');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await onSubmit({
                recipientId,
                message: message.trim(),
                budget: budget.trim() || undefined,
                timeline: timeline.trim() || undefined
            });

            // Reset form
            setMessage('');
            setBudget('');
            setTimeline('');
            onClose();
        } catch (err: any) {
            console.error("Proposal form error:", err);
            setError(err.response?.data?.error || err.message || 'Failed to send proposal');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 bg-gray-100 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all z-10 disabled:opacity-50"
                >
                    <span className="text-2xl text-spark-gray hover:text-spark-red">×</span>
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-spark-red to-red-600 p-8 sm:p-12">
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Partnership Proposal</h2>
                    <p className="text-white/90 font-bold">Send a proposal to {recipientName}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-12 max-h-[60vh] overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <p className="text-red-600 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {/* Message Field */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2">
                            Proposal Message <span className="text-spark-red">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your partnership proposal..."
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-spark-red focus:outline-none font-bold text-spark-black resize-none"
                            disabled={submitting}
                            required
                        />
                    </div>

                    {/* Budget Field */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2">
                            Budget (Optional)
                        </label>
                        <input
                            type="text"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="e.g., ₦50,000 - ₦100,000"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-spark-red focus:outline-none font-bold text-spark-black"
                            disabled={submitting}
                        />
                    </div>

                    {/* Timeline Field */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2">
                            Timeline (Optional)
                        </label>
                        <input
                            type="text"
                            value={timeline}
                            onChange={(e) => setTimeline(e.target.value)}
                            placeholder="e.g., 3 months, 6 weeks"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-spark-red focus:outline-none font-bold text-spark-black"
                            disabled={submitting}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !message.trim()}
                        className="w-full py-6 bg-spark-black text-white font-black text-xl rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending Proposal...
                            </>
                        ) : (
                            'Send Proposal'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
