
import React from 'react';
import { PARTNER_LOGOS } from '../constants';

const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="bg-white text-spark-black relative overflow-hidden pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-12 sm:py-20 lg:flex lg:items-center lg:gap-12">

          {/* Text Content */}
          <div className="text-center lg:text-left lg:w-1/2">
            <div className="inline-block px-4 py-2 mb-6 text-xs font-black tracking-[0.2em] text-spark-red uppercase bg-red-50 rounded-full">
              Nigeria's Premier Campus Network
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-spark-black">
              Own the <span className="text-spark-red underline decoration-red-100 underline-offset-[12px]">Future</span> of Campus Marketing.
            </h1>
            <p className="max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-spark-gray font-medium leading-relaxed mb-10">
              Connect your brand with the pulse of Nigerian universities. Join 50k+ verified student leaders and creators today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
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

          {/* Hero Image */}
          <div className="mt-12 lg:mt-0 lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-red-100 to-orange-50 rounded-[3rem] transform rotate-2 blur-2xl opacity-60"></div>
            <img
              src="/images/hero-students.png"
              alt="Happy Nigerian University Students"
              className="relative rounded-[2.5rem] shadow-2xl transform -rotate-1 border-4 border-white object-cover w-full h-auto"
            />
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
