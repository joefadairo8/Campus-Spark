import React from 'react';
import { TESTIMONIALS } from '../constants';

const SocialProofSection: React.FC = () => {
    return (
        <section className="py-24 bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
                        Trusted by <span className="text-gradient-red italic">Leaders</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-base text-[var(--text-secondary)] font-medium">
                        Join the growing community of brands and creators shaping the future of youth marketing.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <div key={index} className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] flex flex-col h-full card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                            <div className="text-spark-red mb-6">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.987z" /></svg>
                            </div>
                            <p className="text-base text-[var(--text-primary)] mb-8 flex-grow leading-relaxed font-medium italic">"{testimonial.quote}"</p>
                            <div className="pt-6 border-t border-[var(--border-color)]">
                                <p className="font-bold text-[var(--text-primary)] text-base">{testimonial.name}</p>
                                <p className="text-[9px] text-spark-red font-black uppercase tracking-[0.2em] mt-1">{testimonial.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
