
import React from 'react';
import { Search, Rocket, Wallet } from 'lucide-react';

const FeaturesSection: React.FC = () => {
    const features = [
        {
            title: 'Discover Talent',
            description: 'Browse through thousands of verified student influencers across major Nigerian universities.',
            icon: <Search className="w-6 h-6" />,
            badge: 'Intelligence'
        },
        {
            title: 'Launch Campaigns',
            description: 'Create and deploy campaigns in minutes. Set your budget, goals, and track results in real-time.',
            icon: <Rocket className="w-6 h-6" />,
            badge: 'Speed'
        },
        {
            title: 'Secure Payments',
            description: 'Automated milestone-based payments ensure that creators get paid and brands get value.',
            icon: <Wallet className="w-6 h-6" />,
            badge: 'Security'
        }
    ];

    return (
        <section className="py-24 bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
                            Built for the Future
                        </div>
                        <h2 className="text-4xl md:text-5xl font-fancy font-black tracking-tighter text-[var(--text-primary)] mb-8 leading-[1.1]">
                            Engineered for <span className="text-gradient-red">Campus</span> Marketing.
                        </h2>
                        <p className="text-[var(--text-secondary)] text-lg font-medium leading-relaxed mb-12">
                            The first platform designed specifically for the African student economy. We bridge the gap between high-impact student creators and global brands.
                        </p>
                        
                        <div className="space-y-6">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 flex-shrink-0 bg-spark-red/5 text-spark-red rounded-2xl flex items-center justify-center group-hover:bg-spark-red group-hover:text-white transition-all duration-300">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-black text-[var(--text-primary)]">{feature.title}</h4>
                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md text-[var(--text-secondary)]">{feature.badge}</span>
                                        </div>
                                        <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-spark-red/20 to-purple-600/10 rounded-[3rem] blur-3xl -z-10"></div>
                        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                            <img 
                                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000" 
                                alt="Platform Interface" 
                                className="rounded-[2.5rem] w-full object-cover h-[500px] grayscale group-hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute bottom-10 left-10 right-10 glass p-6 rounded-3xl border border-white/20">
                                <p className="text-white font-black text-xl mb-1">Verified Network</p>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Connect with 50,000+ Students</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
