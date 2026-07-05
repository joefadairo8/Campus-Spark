import React, { useState } from 'react';
import { ChevronDown, MessageCircle, ArrowRight, ShieldCheck, CreditCard, Users, Handshake } from 'lucide-react';
import { FAQ_ITEMS } from '../constants';

const HelpCenterPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const categories = [
        { id: 'wallet', title: 'Wallet & Payments', icon: <CreditCard className="w-5 h-5" /> },
        { id: 'escrow', title: 'Escrow & Safety', icon: <ShieldCheck className="w-5 h-5" /> },
        { id: 'campaigns', title: 'Campaigns & Gigs', icon: <Users className="w-5 h-5" /> },
        { id: 'sponsorship', title: 'Sponsorships', icon: <Handshake className="w-5 h-5" /> },
    ];

    const faqs = [
        {
            category: 'wallet',
            q: "How do I withdraw my earnings as a creator?",
            a: "Once a gig is marked as 'accepted' by the brand or association, the funds are automatically moved from Locked Escrow to your Available Balance. From your Creator Dashboard, click 'Withdraw', enter your bank details, and the funds will be transferred securely. Withdrawals are processed within 24-48 hours."
        },
        {
            category: 'escrow',
            q: "What is the Escrow system and how does it protect me?",
            a: "When a brand or association hires a creator, they must pre-fund the campaign budget. These funds are held securely in the ABC-Rally Escrow system. They are only released to the creator once the agreed-upon deliverables are submitted and approved. This guarantees creators get paid for completed work, and brands get what they paid for."
        },
        {
            category: 'escrow',
            q: "What happens if there's a dispute over deliverables?",
            a: "If a brand rejects a submission, they must provide a reason, and the creator is given a chance to revise. If an agreement cannot be reached, our 24/7 support team will mediate the conflict based on the original campaign brief and the submitted evidence to ensure fair resolution."
        },
        {
            category: 'campaigns',
            q: "What is the listing fee system?",
            a: "Brands pay a flat ₦20,000 listing fee each time they publish a campaign or gig. This keeps the marketplace focused on committed opportunities. Event sponsorship listings — posted by associations or brands seeking sponsors — are completely free to list. Creators and associations never pay to apply or list."
        },
        {
            category: 'sponsorship',
            q: "How does event sponsorship work?",
            a: "Associations can list upcoming events and set a sponsorship target. Brands can browse these events and send proposals directly through the platform. Once terms are agreed upon, the brand can fund the sponsorship via the ABC-Rally wallet system."
        }
    ];

    return (
        <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
                        Support & Resources
                    </div>
                    <h1 className="text-4xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
                        How can we <span className="text-gradient-red italic">help you?</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto text-lg">
                        Find answers about money movement, escrow safety, campaign management, and creator payments.
                    </p>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 text-center hover:border-spark-red/40 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-[var(--bg-primary)] text-spark-red rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                {cat.icon}
                            </div>
                            <h3 className="font-black text-[var(--text-primary)] text-sm">{cat.title}</h3>
                        </div>
                    ))}
                </div>

                {/* FAQs */}
                <div className="mb-16">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                                >
                                    <span className="font-bold text-[var(--text-primary)] pr-4">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? 'rotate-180 text-spark-red' : ''}`} />
                                </button>
                                <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Full Platform FAQ from shared constants */}
                <div className="mb-16">
                    <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">All FAQ Topics</h2>
                    <p className="text-[var(--text-secondary)] text-sm font-medium mb-8">Common questions from Creators, Brands, and Associations.</p>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((faq, idx) => {
                            const globalIdx = faqs.length + idx;
                            return (
                                <div key={globalIdx} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all duration-300">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === globalIdx ? null : globalIdx)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none hover:bg-spark-red/5 transition-colors"
                                    >
                                        <span className={`font-bold text-[var(--text-primary)] pr-4 transition-colors ${openFaq === globalIdx ? 'text-spark-red' : ''}`}>{faq.question}</span>
                                        <ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform duration-300 flex-shrink-0 ${openFaq === globalIdx ? 'rotate-180 text-spark-red' : ''}`} />
                                    </button>
                                    <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === globalIdx ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="bg-spark-black rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-spark-red/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Still need help?</h3>
                    <p className="text-gray-400 mb-8 max-w-lg mx-auto font-medium">
                        Our support team is available 24/7 to assist with disputes, payment inquiries, and platform guidance.
                    </p>
                    <button 
                        onClick={() => onNavigate('contact')}
                        className="bg-spark-red hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl transition-all active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        Contact Support
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default HelpCenterPage;
