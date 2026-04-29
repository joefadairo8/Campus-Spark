import React from 'react';

const CtaSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="bg-[var(--bg-primary)] py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spark-red/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-gradient-red p-12 md:p-20 rounded-[3rem] border border-white/10 relative overflow-hidden shadow-2xl shadow-spark-red/20">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[100px] -ml-32 -mt-32"></div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-white leading-tight mb-8">
              Start earning. Start collaborating. <br className="hidden md:block"/><span className="italic">Start growing.</span>
            </h2>
            <p className="mt-8 text-base md:text-lg leading-relaxed text-white/80 max-w-2xl mx-auto mb-10 font-medium">
              Join the marketplace where brands, influencers, and organizations meet to create high-impact youth marketing campaigns.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button
                onClick={() => onNavigate('create-account')}
                className="bg-white text-spark-red font-black py-4 px-10 rounded-2xl text-base hover:scale-105 transition-all shadow-xl"
              >
                Join as Influencer
              </button>
              <button
                onClick={() => onNavigate('create-account')}
                className="bg-black/20 text-white border border-white/20 font-black py-4 px-10 rounded-2xl text-base hover:bg-black/30 transition-all active:scale-95"
              >
                Join as Brand
              </button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;