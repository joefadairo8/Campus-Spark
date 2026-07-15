import React, { useState, useEffect } from 'react';

interface ProposalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
    initialMessage?: string;
    onSubmit: (data: { 
        recipientId: string; 
        message: string; 
        budget?: string; 
        timeline?: string; 
        documentUrl?: string; 
        documentName?: string;
        packageName?: string;
    }) => Promise<void>;
    title?: string;
    isSponsorship?: boolean;
    selectedPackage?: { name: string; price: number; entails: string; } | null;
    isCreatorCollab?: boolean;
}

export const ProposalFormModal: React.FC<ProposalFormModalProps> = ({
    isOpen,
    onClose,
    recipientName,
    recipientId,
    initialMessage = '',
    onSubmit,
    title = 'Partnership Proposal',
    isSponsorship = false,
    selectedPackage = null,
    isCreatorCollab = false
}) => {
    const [message, setMessage] = useState(initialMessage);
    const [budget, setBudget] = useState('');
    const [timeline, setTimeline] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Split calculator states
    const [useSplit, setUseSplit] = useState(false);
    const [splitTotal, setSplitTotal] = useState('');
    const [leadPercent, setLeadPercent] = useState(60);

    useEffect(() => {
        if (isOpen) {
            setMessage(initialMessage);
            setBudget(selectedPackage ? selectedPackage.price.toString() : '');
            setTimeline('');
            setFile(null);
            setError('');
            setUseSplit(false);
            setSplitTotal('');
            setLeadPercent(60);
        }
    }, [isOpen, initialMessage, selectedPackage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                e.target.value = ''; // clear input
                setFile(null);
            } else {
                setError('');
                setFile(selectedFile);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim()) {
            setError(isSponsorship ? 'Please describe your sponsorship intent' : 'Please enter a proposal message');
            return;
        }

        let finalMessage = message.trim();
        let checkoutBudget = selectedPackage ? selectedPackage.price.toString() : budget.trim();

        if (isCreatorCollab && useSplit && splitTotal) {
            const totalVal = Number(splitTotal) || 0;
            const leadAmount = ((totalVal * leadPercent) / 100).toLocaleString(undefined, {maximumFractionDigits: 0});
            const coAmount = ((totalVal * (100 - leadPercent)) / 100).toLocaleString(undefined, {maximumFractionDigits: 0});
            
            finalMessage += `\n\n--- Payout Split Agreement ---\nTotal Collaboration Budget: ₦${totalVal.toLocaleString()}\n• Lead Creator (Me): ${leadPercent}% (₦${leadAmount})\n• Partner (${recipientName}): ${100 - leadPercent}% (₦${coAmount})`;
            
            if (!checkoutBudget) {
                checkoutBudget = `₦${totalVal.toLocaleString()}`;
            }
        }

        if (isSponsorship && !checkoutBudget) {
            setError('Please enter a sponsorship amount');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            let documentUrl: string | undefined = undefined;
            let documentName: string | undefined = undefined;

            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', 'abc-rally');

                    const uploadTask = fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const timeout = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Cloudinary upload timed out. Please check your connection.')), 25000)
                    );
                    
                    const response = await Promise.race([uploadTask, timeout]) as Response;
                    
                    if (!response.ok) {
                        const errData = await response.json().catch(() => null);
                        throw new Error(errData?.error?.message || 'Cloudinary upload failed');
                    }
                    
                    const data = await response.json();
                    documentUrl = data.secure_url;
                    documentName = file.name;
                } catch (uploadError: any) {
                    console.error("Cloudinary upload failed:", uploadError);
                    throw new Error(uploadError.message || 'Failed to upload document to Cloudinary.');
                }
            }

            // Timeout for API submission as well
            const apiTask = onSubmit({
                recipientId,
                message: finalMessage,
                budget: checkoutBudget || undefined,
                timeline: timeline.trim() || undefined,
                packageName: selectedPackage?.name || undefined,
                documentUrl,
                documentName
            });
            const apiTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database submission timed out. Please check your connection.')), 15000)
            );
            
            await Promise.race([apiTask, apiTimeout]);

            // Reset form
            setMessage('');
            setBudget('');
            setTimeline('');
            setFile(null);
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
        <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={submitting}
                    type="button"
                    className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all z-10 disabled:opacity-50"
                >
                    <span className="text-2xl text-[var(--text-secondary)] hover:text-spark-red">×</span>
                </button>

                {/* Header */}
                <div className="bg-spark-red p-8 sm:p-12">
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">{title}</h2>
                    <p className="text-white/90 font-bold">{isSponsorship ? 'Directly sponsor' : 'Send a proposal to'} {recipientName}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-12 modal-content-scroll">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <p className="text-red-700 dark:text-red-400 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {/* Message Field */}
                    <div className="mb-6">
                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                            Proposal Message <span className="text-spark-red">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your partnership proposal..."
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red focus:outline-none font-bold text-[var(--text-primary)] resize-none"
                            disabled={submitting}
                            required
                        />
                    </div>

                    {/* Selected Sponsorship Package Detail Card / Budget Field */}
                    {selectedPackage ? (
                        <div className="mb-6 p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-2 text-left">
                            <p className="text-[10px] font-black text-spark-red uppercase tracking-widest">Sponsorship Package Selected</p>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-base text-[var(--text-primary)]">{selectedPackage.name} Package</span>
                                <span className="text-xs font-black text-green-700 bg-green-500/10 px-2.5 py-1 rounded-xl">
                                    ₦{Number(selectedPackage.price).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{selectedPackage.entails}</p>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                Budget (Optional)
                            </label>
                            <input
                                type="text"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="e.g., ₦50,000 - ₦100,000"
                                className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red focus:outline-none font-bold text-[var(--text-primary)]"
                                disabled={submitting}
                            />
                        </div>
                    )}

                    {/* Timeline Field */}
                    {!isSponsorship && (
                        <div className="mb-8">
                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                Timeline (Optional)
                            </label>
                            <input
                                type="text"
                                value={timeline}
                                onChange={(e) => setTimeline(e.target.value)}
                                placeholder="e.g., 3 months, 6 weeks"
                                className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red focus:outline-none font-bold text-[var(--text-primary)]"
                                disabled={submitting}
                            />
                        </div>
                    )}

                    {isCreatorCollab && message.trim().length > 0 && (
                        <div className="mb-6 p-6 bg-spark-purple/5 border border-spark-purple/20 rounded-3xl space-y-4 text-left">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-black text-spark-purple uppercase tracking-wider flex items-center gap-2">
                                    🤝 Payout Split Agreement
                                </h4>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--text-secondary)]">
                                    <input 
                                        type="checkbox" 
                                        checked={useSplit} 
                                        onChange={(e) => setUseSplit(e.target.checked)} 
                                        className="rounded border-[var(--border-color)] text-spark-purple focus:ring-spark-purple w-4 h-4 cursor-pointer"
                                    />
                                    Enable Split
                                </label>
                            </div>
                            
                            {useSplit && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Collaboration Budget (₦)</label>
                                        <input
                                            type="number"
                                            value={splitTotal}
                                            onChange={(e) => setSplitTotal(e.target.value)}
                                            placeholder="e.g. 100000"
                                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-purple focus:outline-none font-bold text-[var(--text-primary)]"
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Me (Lead) %</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={leadPercent}
                                                onChange={(e) => {
                                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                                    setLeadPercent(val);
                                                }}
                                                className="w-full px-4 py-2.5 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-xl focus:border-spark-purple focus:outline-none font-bold text-[var(--text-primary)]"
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{recipientName} %</label>
                                            <div className="w-full px-4 py-2.5 border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-xl font-bold text-[var(--text-secondary)]">
                                                {100 - leadPercent}%
                                            </div>
                                        </div>
                                    </div>
                                    {Number(splitTotal) > 0 && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] space-y-2 text-xs font-bold">
                                            <div className="flex justify-between text-[var(--text-primary)]">
                                                <span>Me (Lead):</span>
                                                <span>₦{((Number(splitTotal) * leadPercent) / 100).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                            </div>
                                            <div className="flex justify-between text-[var(--text-primary)]">
                                                <span>{recipientName}:</span>
                                                <span>₦{((Number(splitTotal) * (100 - leadPercent)) / 100).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Document Upload Field */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                            Proposal Document (Optional, Max 5MB)
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red focus:outline-none font-bold text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-spark-red/10 file:text-spark-red hover:file:bg-spark-red/20 transition-all"
                            disabled={submitting}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !message.trim()}
                        className={`w-full py-6 font-black text-xl rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isSponsorship ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-spark-red hover:text-white'}`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {isSponsorship ? 'Processing Payment...' : 'Sending Proposal...'}
                            </>
                        ) : (
                            isSponsorship ? 'Send & Pay Sponsorship' : 'Send Proposal'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
