import React, { useEffect } from 'react';
import { PhoneCall, ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { APP_ABBREV } from '../constants';

const ScheduleCallPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        // Load Calendly script
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // cleanup if needed
            const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
            if (existingScript) existingScript.remove();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pt-32 pb-20 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-spark-red/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 z-0 pointer-events-none"></div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                <button
                    onClick={() => onNavigate('for-brands')}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-spark-red font-bold transition-colors mb-10 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Brands
                </button>

                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Context */}
                    <div className="lg:col-span-5 animate-in slide-in-from-left-8 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-spark-red/10 text-spark-red rounded-full text-sm font-black uppercase tracking-widest mb-6">
                            <PhoneCall className="w-4 h-4" /> Discovery Call
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] mb-6 leading-tight">
                            Let's Discuss Your <span className="text-spark-red italic">Campus Strategy</span>
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed font-medium">
                            Book a 30-minute introductory meeting with our partnerships team to learn how {APP_ABBREV} can help you scale your brand across universities.
                        </p>

                        <div className="space-y-6 bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-color)]">
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 mb-6">
                                <Building2 className="text-spark-red w-6 h-6" /> What to expect:
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    'Platform demonstration tailored to your industry',
                                    'Discussion of your specific Gen-Z marketing goals',
                                    'Overview of our vetted creator network',
                                    'Custom pricing and onboarding timeline'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-[var(--text-primary)] font-medium">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Calendly Embed */}
                    <div className="lg:col-span-7 bg-[var(--bg-secondary)] rounded-[3rem] p-4 sm:p-6 border border-[var(--border-color)] shadow-2xl animate-in slide-in-from-right-8 duration-700 delay-300 h-[800px]">
                        <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden">
                            {/* Calendly inline widget begin */}
                            <div 
                                className="calendly-inline-widget" 
                                data-url="https://calendly.com/campusspark/30min" 
                                style={{ minWidth: '320px', height: '100%' }}
                            ></div>
                            {/* Calendly inline widget end */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCallPage;
