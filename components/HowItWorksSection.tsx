import React from 'react';
import { UserCheck, FilePlus, Handshake, Lock, CreditCard } from 'lucide-react';

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      title: 'Create a profile',
      description: 'Join as a brand, creator or association and complete verification.',
      icon: <UserCheck className="w-6 h-6 text-spark-red" />,
    },
    {
      title: 'Post or discover',
      description: 'Brands post campaigns, associations list events and creators explore work.',
      icon: <FilePlus className="w-6 h-6 text-spark-red" />,
    },
    {
      title: 'Connect and agree',
      description: 'Send proposals, apply for gigs, invite creators or accept sponsorship offers.',
      icon: <Handshake className="w-6 h-6 text-spark-red" />,
    },
    {
      title: 'Fund safely',
      description: 'Budgets can be funded to wallet and locked in escrow until the work is completed.',
      icon: <Lock className="w-6 h-6 text-spark-red" />,
    },
    {
      title: 'Deliver & get paid',
      description: 'Creators submit work, brands/associations approve deliverables and funds are released.',
      icon: <CreditCard className="w-6 h-6 text-spark-red" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Process
          </div>
          <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
            How it <span className="text-gradient-red italic">Works</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">
            From registration to escrow payout, ABC-Rally handles the entire collaboration lifecycle securely.
          </p>
        </div>

        <div className="relative">
          {/* Connector Line for Desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-spark-red/40 -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                {/* Step Circle */}
                <div className="w-24 h-24 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-[2rem] flex items-center justify-center mb-6 shadow-md transition-all duration-500 group-hover:scale-110 group-hover:border-spark-red/40 relative z-10">
                  <div className="w-16 h-16 bg-spark-red/5 rounded-2xl flex items-center justify-center border border-spark-red/10 group-hover:bg-spark-red/10 transition-colors">
                    {step.icon}
                  </div>
                  {/* Step Number Badge */}
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-spark-black text-white dark:bg-white dark:text-spark-black text-xs font-black rounded-full flex items-center justify-center border-2 border-[var(--bg-primary)] shadow-sm">
                    {index + 1}
                  </span>
                </div>

                {/* Step Content */}
                <h3 className="text-lg font-black text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors leading-tight">
                  {step.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium max-w-[200px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
