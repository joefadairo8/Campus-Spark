import React from 'react';

const CtaSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const handleRoleNavigate = (roleName: string) => {
    localStorage.setItem('preselectedRole', roleName);
    onNavigate('create-account');
  };

  return (
    <section className="bg-[var(--bg-primary)] py-24 relative overflow-hidden border-t border-[var(--border-color)]">
      {/* Visual background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spark-red/5 rounded-full blur-[180px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Banner Heading */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Get Started Today
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-fancy font-black text-[var(--text-primary)] leading-tight mb-4">
            Start earning. Start collaborating. <br />
            <span className="text-gradient-red italic">Start growing.</span>
          </h2>
          <p className="text-[var(--text-secondary)] font-medium text-base">
            Ready to dive into Africa's most transparent and secure collaboration marketplace? Select your primary goal below.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Brands */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-wider">For Brands</span>
              <h3 className="text-xl font-black text-[var(--text-primary)] mt-6 mb-3">Post a Campaign</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 font-medium">
                Looking for content creators or event activation partnerships? Outline your brief, fund secure escrow, and hire verified talent today.
              </p>
            </div>
            <button
              onClick={() => handleRoleNavigate('Brand')}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/15"
            >
              Post a Campaign
            </button>
          </div>

          {/* Card 2: Creators */}
          <div className="bg-gradient-red p-8 rounded-[2.5rem] shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[100px] -ml-32 -mt-32"></div>
            <div>
              <span className="text-[10px] font-black text-white bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider relative z-10">For Creators</span>
              <h3 className="text-xl font-black mt-6 mb-3 relative z-10">Find a Paid Gig</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-8 font-medium relative z-10">
                Ready to work with top-tier brands, grow your portfolio, collaborate with creators, and withdraw direct earnings to your bank?
              </p>
            </div>
            <button
              onClick={() => handleRoleNavigate('Creator')}
              className="w-full py-4 bg-white hover:bg-gray-50 text-spark-red font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl relative z-10"
            >
              Find a Paid Gig
            </button>
          </div>

          {/* Card 3: Associations */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black text-purple-600 bg-purple-500/10 px-3 py-1 rounded-full uppercase tracking-wider">For Associations</span>
              <h3 className="text-xl font-black mt-6 mb-3">Raise Sponsorship</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 font-medium">
                Hosting a campus festival, tech hackathon, or cultural show? List sponsorship tiers, match with sponsors, and finance your vision.
              </p>
            </div>
            <button
              onClick={() => handleRoleNavigate('Organization')}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-purple-500/15"
            >
              Raise Sponsorship
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

export default CtaSection;
