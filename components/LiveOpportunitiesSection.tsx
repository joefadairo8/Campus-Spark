import React from 'react';
import { LIVE_OPPORTUNITIES } from '../constants';

const LiveOpportunitiesSection: React.FC = () => {
  return (
    <section className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-color)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spark-red/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Real-time Marketplace
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Latest <span className="text-gradient-red italic">Opportunities</span>
            </h2>
          </div>
          <p className="text-[var(--text-secondary)] text-base font-medium">
            Active campaigns currently looking for partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LIVE_OPPORTUNITIES.map((opp) => (
            <div 
              key={opp.id} 
              className="bg-[var(--bg-primary)] rounded-3xl p-6 border border-[var(--border-color)] hover:border-spark-red/30 transition-all group card-hover shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  opp.type === 'Campaign' ? 'bg-blue-500/10 text-blue-500' : 
                  opp.type === 'Sponsorship' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {opp.type}
                </span>
                <span className="text-spark-red font-black text-base">{opp.amount}</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors">{opp.title}</h3>
              <p className="text-[var(--text-secondary)] text-[10px] mb-4 font-medium uppercase tracking-widest">by {opp.company}</p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-color)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Hiring Now</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button className="text-[var(--text-primary)] font-black text-[10px] uppercase tracking-[0.3em] hover:text-spark-red transition-colors flex items-center justify-center mx-auto group border-b border-spark-red/20 pb-1">
            Browse All Gigs
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default LiveOpportunitiesSection;
