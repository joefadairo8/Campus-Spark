
import React from 'react';
import { CheckCircleIcon, PARTNER_LOGOS } from '../constants';

const BrandsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)] text-center">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-24 border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Growth for Brands
            </div>
            <h1 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter leading-[1.1] mb-8 text-[var(--text-primary)]">
              Captivate the <span className="text-gradient-red italic">Next Generation</span> of Nigerian Consumers.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-12 leading-relaxed max-w-3xl mx-auto font-medium">
              Campus Spark is your direct line to millions of students. Build authentic connections, drive adoption, and gather deep insights through verified campus ambassadors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('contact')}
                className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95"
              >
                Get Started
              </button>
              <button 
                 onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl text-base hover:bg-spark-red/5 transition-all active:scale-95"
              >
                Explore Solutions
              </button>
            </div>
        </div>
      </section>

      {/* Market Context */}
      <section className="py-24 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-8">
                Why Nigerian <span className="text-gradient-red italic">Campuses?</span>
            </h2>
            <p className="text-base text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
                Nigeria has one of the youngest populations, with a rapidly growing student demographic that drives culture, technology adoption, and consumption trends.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 text-left">
                {[
                    "Access a market of millions of students.",
                    "Build brand loyalty at a pivotal life stage.",
                    "Leverage the high influence of student leaders.",
                    "Bypass traditional ad-blockers with P2P marketing."
                ].map((item, i) => (
                    <div key={i} className="flex items-start bg-[var(--bg-primary)] border border-[var(--border-color)] p-6 rounded-[2rem] card-hover">
                        <div className="mt-1 flex-shrink-0">
                            <CheckCircleIcon className="w-5 h-5 text-spark-red" />
                        </div>
                        <span className="ml-4 text-[var(--text-primary)] font-bold text-base">{item}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
                    Comprehensive <span className="text-gradient-red italic">Solutions</span>
                </h2>
                <p className="text-base text-[var(--text-secondary)] font-medium">
                    We provide the toolkit you need to execute diverse marketing strategies, from digital buzz to on-ground activations.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {[
                    { title: "Student Ambassador Programs", desc: "Recruit long-term reps to drive downloads, sign-ups, and awareness on specific campuses.", icon: "🎓" },
                    { title: "Event Sponsorships", desc: "Find high-traffic student events and secure sponsorship tiers that guarantee visibility.", icon: "🎉" },
                    { title: "Influencer Marketing", desc: "Collaborate with micro-influencers who have high engagement within university bubbles.", icon: "📱" },
                    { title: "Product Activations", desc: "Coordinate on-ground teams to distribute samples or manage pop-up stalls directly.", icon: "📦" },
                    { title: "Market Research", desc: "Gain rapid feedback on products by deploying surveys to verified student audiences.", icon: "📊" },
                    { title: "Direct Recruitment", desc: "Spot top talent early. Connect with leaders of clubs for internships and grad roles.", icon: "🤝" }
                ].map((card, i) => (
                    <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                        <div className="text-3xl mb-6 transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">{card.title}</h3>
                        <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

export default BrandsPage;
