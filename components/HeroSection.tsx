
import React from 'react';
import { Smartphone, TrendingUp } from 'lucide-react';

const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-20">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 mb-8 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spark-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-spark-red"></span>
            </span>
            <span>Where Influence Meets Impact</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-fancy font-black tracking-tighter leading-[1.1] mb-8 text-[var(--text-primary)] max-w-4xl">
            Connect with <span className="text-gradient-red italic">Influencers</span> and Youth Audiences.
          </h1>
          
          <p className="max-w-xl mx-auto text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed mb-12">
            Find paid campaigns, secure sponsorships, and reach the most active youth communities across Nigeria.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('create-account')}
              className="w-full sm:w-auto bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
            >
              Find Opportunities
            </button>
            <button
              onClick={() => onNavigate('create-account')}
              className="w-full sm:w-auto glass text-[var(--text-primary)] font-bold py-4 px-10 rounded-2xl text-base border border-[var(--border-color)] hover:bg-[var(--bg-primary)]/50 transition-all active:scale-95"
            >
              Post a Campaign
            </button>
          </div>


          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50">
             <div className="flex flex-col items-center">
               <span className="text-xl font-black text-[var(--text-primary)]">50k+</span>
               <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Creators</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xl font-black text-[var(--text-primary)]">200+</span>
               <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Brands</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xl font-black text-[var(--text-primary)]">1k+</span>
               <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Events</span>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-xl font-black text-[var(--text-primary)]">₦100M+</span>
               <span className="text-[9px] uppercase tracking-widest font-black text-[var(--text-secondary)]">Value Created</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
