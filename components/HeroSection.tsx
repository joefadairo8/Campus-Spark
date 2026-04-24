
import React from 'react';
import { PARTNER_LOGOS } from '../constants';

const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="bg-white text-spark-black relative overflow-hidden pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-12 sm:py-20 flex flex-col items-center">

          {/* Text Content */}
          <div className="text-center w-full max-w-4xl mx-auto">
            <div className="inline-block px-5 py-2 mb-8 text-xs font-bold tracking-[0.3em] text-spark-red uppercase bg-red-50/50 rounded-full border border-red-100/50">
              The Heart of Nigerian Campuses
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-spark-black">
              Connect with the <span className="text-spark-red underline decoration-red-200/50 underline-offset-[12px]">Pulse</span> of Campus Culture.
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-spark-gray/70 font-normal leading-relaxed mb-12">
              The most direct way for brands to engage with Nigerian universities. Join a community of 50,000+ verified student leaders and creators today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('create-account')}
                className="w-full sm:w-auto bg-spark-red text-white font-extrabold py-4 px-10 rounded-2xl text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95"
              >
                Join the Network
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full sm:w-auto bg-white border-2 border-gray-100 text-spark-black font-extrabold py-4 px-10 rounded-2xl text-lg hover:bg-gray-50 transition-all active:scale-95"
              >
                Login
              </button>
            </div>
          </div>



        </div>

        <div className="mt-20 border-t border-gray-50 pt-16 pb-12">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-[0.4em] text-spark-gray opacity-40">Trusted by Market Leaders</span>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-12 sm:gap-x-16 gap-y-10">
            {PARTNER_LOGOS.map((logo) => (
              <div key={logo.name} className="flex flex-col items-center group cursor-default">
                <span className="text-[14px] font-black text-spark-gray uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 group-hover:text-spark-red transition-all duration-300">
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

export default HeroSection;
