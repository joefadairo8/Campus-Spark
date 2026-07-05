import React, { useState } from 'react';
import { Megaphone, Search, Calendar, DollarSign, FileCheck, Wallet, ShieldCheck, ArrowRight } from 'lucide-react';

interface Module {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  mockup: React.ReactNode;
}

const MarketplaceModules: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('campaigns');

  const modules: Module[] = [
    {
      id: 'campaigns',
      title: 'Campaigns',
      icon: <Megaphone className="w-5 h-5" />,
      description: 'Create campaign briefs, define target parameters, track real-time reach, downloads, or impressions, and manage all your live campaigns from one dashboard.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Active Campaign</p>
              <h4 className="text-lg font-black text-[var(--text-primary)]">NeoBank Launch Promo</h4>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase tracking-wider">Live</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-bold">
                <span className="text-[var(--text-secondary)]">Campaign Progress</span>
                <span className="text-[var(--text-primary)]">72% Completed</span>
              </div>
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                <div className="bg-spark-red h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl">
                <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase">Impressions</p>
                <p className="text-base font-black text-spark-red mt-1">125k</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl">
                <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase">Conversions</p>
                <p className="text-base font-black text-spark-red mt-1">8.4k</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl">
                <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase">ROI</p>
                <p className="text-base font-black text-spark-red mt-1">3.8x</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'directory',
      title: 'Talent Directory',
      icon: <Search className="w-5 h-5" />,
      description: 'Browse, filter, and review verified creators across multiple campuses. Filter by niche, primary platforms, audience demographics, and location.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-lg font-black">
              C
            </div>
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)]">Chinedu Okafor</h4>
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Tech & Gadgets • UNILAG</p>
            </div>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Followers:</span>
              <span className="font-bold text-[var(--text-primary)]">45.2k Reach</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Niche:</span>
              <span className="font-bold text-[var(--text-primary)]">Engineering, Tech</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">Rating:</span>
              <span className="font-bold text-yellow-500">⭐ 5.0 (18 Gigs Completed)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
              View Profile
            </button>
            <button className="flex-1 py-3 bg-spark-red text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-red-600 transition-all shadow-md">
              Send Proposal
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'events',
      title: 'Events',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Host or discover corporate-sponsored campus events. Organizers list events to gain corporate backing while brands find physical activation opportunities.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-start mb-6">
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-wider">Tech Conference</span>
            <span className="text-xs font-black text-spark-red">₦150k target</span>
          </div>
          <h4 className="text-base font-black text-[var(--text-primary)] mb-2">Annual Campus Tech Summit</h4>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium mb-4">Hosted by: Computer Science Association (OAU)</p>
          <div className="bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs mb-4">
            <div>
              <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase">Date</p>
              <p className="font-black text-[var(--text-primary)] mt-0.5">Aug 18, 2026</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-[var(--text-secondary)] font-black uppercase">Venue</p>
              <p className="font-black text-[var(--text-primary)] mt-0.5">Oduduwa Hall</p>
            </div>
          </div>
          <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
            Apply to Sponsor
          </button>
        </div>
      )
    },
    {
      id: 'sponsorship',
      title: 'Sponsorship',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Streamlined corporate event sponsorship workflows. Associations list packages, brands apply to secure physical banner space, speech slots, or sampling.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Sponsorship Packages</h4>
          <div className="space-y-3 mb-6">
            <div className="p-3 bg-spark-red/5 border border-spark-red/10 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-spark-red">Gold Package</p>
                <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Logo on shirts, 10m booth space</p>
              </div>
              <span className="text-sm font-black text-[var(--text-primary)]">₦500,000</span>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[var(--text-primary)]">Silver Package</p>
                <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Banner placement, flyer inclusion</p>
              </div>
              <span className="text-sm font-black text-[var(--text-secondary)]">₦250,000</span>
            </div>
          </div>
          <button className="w-full py-3 bg-spark-black text-white dark:bg-white dark:text-spark-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
            Purchase Sponsorship
          </button>
        </div>
      )
    },
    {
      id: 'proposals',
      title: 'Proposals',
      icon: <FileCheck className="w-5 h-5" />,
      description: 'Negotiate contract terms, campaign deliverables, and budget directly. Standardized contracts protect both sides and ensure clear milestones.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-[var(--text-primary)]">Proposal #PROP-104</h4>
            <span className="px-2.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full text-[9px] font-black uppercase tracking-wider">Pending Action</span>
          </div>
          <div className="space-y-3.5 mb-6 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Deliverables:</span>
              <span className="font-bold text-[var(--text-primary)]">2 Instagram Reels, 1 Tweet</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Deadline:</span>
              <span className="font-bold text-[var(--text-primary)]">July 04, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Proposed Budget:</span>
              <span className="font-black text-spark-red">₦85,000</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
              Decline
            </button>
            <button className="flex-2 py-3 bg-spark-red text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-red-600 transition-all shadow-md">
              Accept & Sign
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'wallet',
      title: 'Wallet',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Fund your marketing operations easily using Paystack, or withdraw creator earnings directly to your local bank account instantly.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="bg-gradient-red p-5 rounded-2xl text-white mb-6 shadow-lg shadow-spark-red/20">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Main Balance</p>
            <h4 className="text-2xl font-black mt-1">₦342,500.00</h4>
            <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-white/90">
              <span>Account: *4920</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-md">Paystack Connected</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">
              Withdraw
            </button>
            <button className="flex-1 py-3 bg-spark-black text-white dark:bg-white dark:text-spark-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
              + Fund Wallet
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'escrow',
      title: 'Escrow',
      icon: <ShieldCheck className="w-5 h-5" />,
      description: 'Budgets are secured in escrow before creators begin work. Funds are only released when milestones are completed and approved.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)]">Escrow Locked</h4>
              <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">NeoBank Promo • ID: #ESC-9920</p>
            </div>
          </div>
          <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] space-y-3 text-xs mb-6 font-medium">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Amount Secured:</span>
              <span className="font-black text-spark-red">₦150,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Milestone Status:</span>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-black uppercase">Awaiting Work</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] text-center font-bold uppercase tracking-wider leading-relaxed">
            Funds cannot be released until deliverables are approved or disputed.
          </p>
        </div>
      )
    }
  ];

  const active = modules.find(m => m.id === activeModule) || modules[0];

  return (
    <section className="py-24 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Module Selection List */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full w-fit">
              Marketplace Engine
            </div>
            <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6 leading-tight">
              One Workspace. <br />
              <span className="text-gradient-red italic">Seven Modules.</span>
            </h2>
            <p className="text-[var(--text-secondary)] font-medium text-base mb-12 max-w-lg">
              Explore the functional pillars of ABC-Rally built to handle product campaigns, community growth, and secure marketplace logistics.
            </p>

            <div className="space-y-3">
              {modules.map((m) => (
                <React.Fragment key={m.id}>
                  <button
                    onClick={() => setActiveModule(m.id)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group ${
                      activeModule === m.id
                        ? 'bg-spark-red text-white border-spark-red shadow-lg shadow-spark-red/10 scale-[1.01]'
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-spark-red/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                        activeModule === m.id 
                          ? 'bg-white/10 border-white/10 text-white' 
                          : 'bg-spark-red/5 border-spark-red/10 text-spark-red'
                      }`}>
                        {m.icon}
                      </div>
                      <span className="font-black text-sm uppercase tracking-wider">{m.title}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                      activeModule === m.id ? 'text-white rotate-90' : 'text-[var(--text-secondary)] group-hover:text-spark-red'
                    }`} />
                  </button>

                  {/* ── Mobile inline preview: renders directly below active tab ── */}
                  {activeModule === m.id && (
                    <div className="lg:hidden px-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="relative rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-spark-red/10 to-transparent blur-2xl -z-10" />
                        <div className="w-full mb-4 text-center pt-2">
                          <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{m.title} Module</h3>
                          <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{m.description}</p>
                        </div>
                        <div className="w-full transition-all duration-500">
                          {m.mockup}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right Side: Mockup Preview Panel — desktop only */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center items-center relative min-h-[420px] w-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-spark-red/10 to-transparent blur-3xl -z-10"></div>
            
            {/* Detail Explanation Panel */}
            <div className="w-full max-w-[440px] flex flex-col items-center">
              <div className="w-full mb-8 text-center lg:text-left">
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3">{active.title} Module</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{active.description}</p>
              </div>

              {/* Dynamic Interactive CSS Mockup */}
              <div className="w-full transition-all duration-500 transform scale-100 animate-in fade-in zoom-in-95">
                {active.mockup}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MarketplaceModules;
