import React from 'react';
import { PARTNER_LOGOS } from '../constants';

const TrustSection: React.FC = () => {
  const metrics = [
    { label: 'Verified Influencers', value: '15k+' },
    { label: 'Campus Partners', value: '120+' },
    { label: 'Campaign Payouts', value: '₦45M+' },
    { label: 'Active Brands', value: '250+' },
  ];

  return (
    <section className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-20">
          {metrics.map((metric) => (
            <div key={metric.label} className="text-center group">
              <div className="text-3xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors">{metric.value}</div>
              <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="pt-16 border-t border-[var(--border-color)]">
          <div className="text-center mb-12">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--text-secondary)]">Scale your brand with industry leaders</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-12 sm:gap-x-20 gap-y-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            {PARTNER_LOGOS.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center group cursor-default">
                <span className="text-base md:text-lg font-black text-[var(--text-primary)] uppercase tracking-tighter group-hover:text-spark-red transition-colors">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
