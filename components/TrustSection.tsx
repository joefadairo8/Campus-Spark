import React from 'react';
import { ShieldCheck, UserCheck, Lock, RefreshCw, CheckCircle2, Zap } from 'lucide-react';

const TrustSection: React.FC = () => {
  const trustPillars = [
    {
      title: "Verified Profiles",
      description: "Every brand, creator, and student association goes through rigorous verification checks before listing or applying to guarantee authenticity.",
      icon: <UserCheck className="w-6 h-6 text-spark-red" />
    },
    {
      title: "Fast Withdrawals",
      description: "Direct bank deposit and credit card payments processed securely. Withdraw your creator earnings swiftly with zero hidden platform fees.",
      icon: <ShieldCheck className="w-6 h-6 text-spark-red" />
    },
    {
      title: "Locked Escrow",
      description: "Campaign funds are pre-funded and securely locked in escrow. Payouts are only released upon approval of deliverables.",
      icon: <Lock className="w-6 h-6 text-spark-red" />
    },
    {
      title: "Dispute Handling",
      description: "24/7 dedicated support team to mediate revisions or handle conflicts, ensuring fair treatment for brands, creators, and associations.",
      icon: <RefreshCw className="w-6 h-6 text-spark-red" />
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Content Grid */}
        <div className="grid lg:grid-cols-12 gap-16 items-center mb-24">
          
          {/* Left Column: Trust Pillars */}
          <div className="lg:col-span-7">
            <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Trust & Transparency
            </div>
            <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
              Trade Safely. <br />
              <span className="text-gradient-red italic">Fund with Confidence.</span>
            </h2>
            <p className="text-[var(--text-secondary)] font-medium text-base mb-12 max-w-lg">
              ABC-Rally is built with financial infrastructure that guarantees deliverables are met and creators get paid on time.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {trustPillars.map((pillar, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="w-12 h-12 flex-shrink-0 bg-spark-red/5 text-spark-red rounded-xl flex items-center justify-center border border-spark-red/10 group-hover:bg-spark-red group-hover:text-white transition-colors duration-300">
                    {pillar.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-[var(--text-primary)] mb-2 text-base flex items-center gap-2">
                      {pillar.title}
                      {index === 0 && <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                    </h4>
                    <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Secure Wallet illustration */}
          <div className="lg:col-span-5 relative w-full flex justify-center items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent blur-3xl -z-10"></div>
            
            {/* Wallet Dashboard Mockup Snippet */}
            <div className="w-full max-w-[380px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] shadow-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Secure Escrow Node</span>
                </div>
                <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 fill-blue-500/5" /> Verified Profile
                </div>
              </div>

              {/* Wallet Info Display */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl">
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Withdrawable Wallet Balance</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <p className="text-xl font-black text-[var(--text-primary)]">₦142,500.00</p>
                    <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Available</span>
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl">
                  <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Locked Campaign Escrow</p>
                  <div className="flex justify-between items-baseline mt-1">
                    <p className="text-xl font-black text-spark-red">₦300,000.00</p>
                    <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Locked</span>
                  </div>
                </div>
              </div>

              {/* Funding Cue / Paystack badge */}
              <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-wider">Payment Partner</span>
                <span className="text-[10px] font-black tracking-tight text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-xl border border-emerald-500/10 uppercase flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Paystack Funded
                </span>
              </div>
            </div>
          </div>

        </div>


      </div>
    </section>
  );
};

export default TrustSection;
