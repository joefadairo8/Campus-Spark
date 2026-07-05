import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Zap } from 'lucide-react';
import { globalBrandingSettings } from '../constants';

const HeroSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [, setLandingImage] = useState(globalBrandingSettings.landingImage);

  useEffect(() => {
    const unsubscribe = globalBrandingSettings.subscribe(() => {
      setLandingImage(globalBrandingSettings.landingImage);
    });
    return unsubscribe;
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-28 pb-20 bg-[var(--bg-primary)]">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-spark-red/10 rounded-full blur-[130px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[130px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(var(--text-primary) 1px,transparent 1px),linear-gradient(90deg,var(--text-primary) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-center">
        {/* eyebrow badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 mb-8 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full w-fit mx-auto">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-spark-red opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-spark-red" />
          </span>
          <span>MARKETPLACE FOR COLLABORATIONS &amp; WORK</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-fancy font-black tracking-tight leading-[1.15] mb-6 text-[var(--text-primary)]">
          The Modern Marketplace for<br />
          <span className="text-gradient-red italic">Brands, Creators,</span><br />
          and Communities
        </h1>

        {/* Sub-copy */}
        <p className="text-base md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed mb-6 max-w-3xl mx-auto">
          ABC-Rally is Nigeria's trusted creative collaboration marketplace connecting brands, creators, and communities for campaigns, paid gigs, event sponsorships, and real partnership opportunities.
        </p>

        {/* 3-column descriptor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mb-10 text-sm">
          {[
            { label: 'Brands', desc: 'Launch campaigns, hire creators, sponsor events.' },
            { label: 'Creators', desc: 'Find gigs, get verified, get paid securely.' },
            { label: 'Associations', desc: 'List events, raise sponsorship, build partnerships.' },
          ].map(({ label, desc }) => (
            <div key={label} className="px-5 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-left">
              <p className="font-black text-[var(--text-primary)] text-xs uppercase tracking-widest mb-1">{label}</p>
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-center mb-10">
          <button
            onClick={() => onNavigate('create-account')}
            className="w-full sm:w-auto bg-gradient-red hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl text-sm transition-all shadow-lg shadow-spark-red/20 active:scale-95 text-center flex items-center justify-center gap-2"
          >
            Create your free account <Zap className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const el = document.querySelector('#opportunities');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto glass text-[var(--text-primary)] font-bold py-4 px-10 rounded-2xl text-sm border border-[var(--border-color)] hover:bg-[var(--bg-primary)]/50 transition-all active:scale-95 text-center flex items-center justify-center gap-2"
          >
            Explore opportunities
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Trust badge */}
        <div className="flex items-center justify-center gap-3 border-t border-[var(--border-color)] pt-8 max-w-xl mx-auto">
          <Shield className="w-5 h-5 text-spark-red flex-shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider leading-relaxed">
            Built to Rally Nigeria's Creative Economy
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
