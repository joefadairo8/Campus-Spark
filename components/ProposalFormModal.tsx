import React, { useState } from 'react';

interface ProposalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
    initialMessage?: string;
    onSubmit: (data: { recipientId: string; message: string; budget?: string; timeline?: string; documentUrl?: string; documentName?: string; }) => Promise<void>;
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
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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
            setError('Please enter a proposal message');
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
                    formData.append('upload_preset', 'campus-spark');

                    // Using 'auto' allows raw files (PDF, DOCX) as well as images
                    const uploadTask = fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                        method: 'POST',
                        body: formData
                    });

                    // Add a timeout to prevent infinite hanging
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
                message: message.trim(),
                budget: budget.trim() || undefined,
                timeline: timeline.trim() || undefined,
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
        <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-6 right-6 sm:top-8 sm:right-8 w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all z-10 disabled:opacity-50"
                >
                    <span className="text-2xl text-[var(--text-secondary)] hover:text-spark-red">×</span>
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-spark-red to-red-600 p-8 sm:p-12">
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">Partnership Proposal</h2>
                    <p className="text-white/90 font-bold">Send a proposal to {recipientName}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-12 max-h-[60vh] overflow-y-auto">
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

                    {/* Budget Field */}
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

                    {/* Timeline Field */}
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

                    {/* Document Upload Field */}
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                            Proposal Document (Optional, Max 5MB)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="w-full px-4 py-3 border-2 border-[var(--border-color)] bg-[var(--bg-primary)] rounded-2xl focus:border-spark-red focus:outline-none font-bold text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-spark-red/10 file:text-spark-red hover:file:bg-spark-red/20 transition-all"
                            disabled={submitting}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting || !message.trim()}
                        className="w-full py-6 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black text-xl rounded-2xl hover:bg-spark-red hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
