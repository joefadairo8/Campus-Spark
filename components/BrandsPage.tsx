import React, { useState } from 'react';
import {
  Target, Users, Calendar, BarChart2, Wallet, Briefcase,
  AlertCircle, CheckCircle2, ArrowRight, Megaphone, Shield,
  MessageSquare, Layers, Star, HeadphonesIcon, ChevronRight,
  Search, LayoutDashboard, TrendingUp
} from 'lucide-react';

const BrandsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [activeMenu, setActiveMenu] = useState('campaigns');
  const handleStart = () => {
    localStorage.setItem('preselectedRole', 'Brand');
    onNavigate('create-account');
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-24 border-b border-[var(--border-color)] text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            For Brands &amp; Companies
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-fancy font-black tracking-tighter leading-[1.1] mb-6 text-[var(--text-primary)]">
            Run Smarter Campaigns.<br />
            Hire Verified Creators.<br />
            <span className="text-gradient-red italic">Grow Your Brand.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
            ABC-Rally gives brands a structured way to launch campaigns, find the right creators, sponsor events, and track every naira spent — all from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Post a Campaign <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('schedule-call')}
              className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl text-base hover:bg-spark-red/5 transition-all active:scale-95"
            >
              Book a Brand Demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Pain ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Problem
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Campaign Execution Is <span className="text-gradient-red italic">Broken</span>
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            Most brands struggle with scattered creator searches, unreliable deliverables, missed event sponsorship opportunities, and poor campaign visibility. You end up paying for work you can't verify and missing communities you should own.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {[
              { icon: <Users className="w-5 h-5" />, title: 'Scattered Creator Search', desc: 'No structured way to find vetted, active creators across Nigerian campuses and communities.' },
              { icon: <AlertCircle className="w-5 h-5" />, title: 'Unreliable Deliverables', desc: 'Payments made, content not delivered — no escrow, no accountability, no revision process.' },
              { icon: <Calendar className="w-5 h-5" />, title: 'Weak Event Sponsorship', desc: 'Event opportunities are missed or buried in cold emails with no structure or audience data.' },
              { icon: <BarChart2 className="w-5 h-5" />, title: 'Poor Campaign Tracking', desc: 'No unified dashboard to monitor spend, applications, progress and creator performance.' },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] flex flex-col gap-4">
                <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red">{item.icon}</div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Solution
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            One Platform. Every Tool You <span className="text-gradient-red italic">Need.</span>
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            ABC-Rally brings campaign briefs, a verified creator directory, event sponsorship listings, wallet management, an escrow-style workflow and outcome reporting into one place.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              { icon: <Briefcase className="w-6 h-6" />, title: 'Campaign Briefs', desc: 'Write structured briefs, define deliverables, set budgets and let creators apply — or invite them directly.' },
              { icon: <Users className="w-6 h-6" />, title: 'Creator Directory', desc: 'Search creators by niche, university, location, content type and past performance. View portfolios and ratings.' },
              { icon: <Calendar className="w-6 h-6" />, title: 'Event Sponsorships', desc: 'Browse association events with audience data and sponsorship packages. Send a proposal in minutes.' },
              { icon: <Wallet className="w-6 h-6" />, title: 'Wallet & Escrow', desc: 'Fund campaigns from your brand wallet. Funds are locked until work is approved — zero risk.' },
              { icon: <MessageSquare className="w-6 h-6" />, title: 'Proposal Inbox', desc: 'Receive inbound pitches from creators and associations. Review, negotiate and respond from one inbox.' },
              { icon: <BarChart2 className="w-6 h-6" />, title: 'Reporting', desc: 'Every completed task generates a report. Track spend, deliverables and outcome data in your dashboard.' },
            ].map((card, i) => (
              <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red mb-5 transition-transform duration-300 group-hover:scale-110">{card.icon}</div>
                <h3 className="text-base font-black text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors">{card.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Use Cases
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            What Brands Use <span className="text-gradient-red italic">ABC-Rally</span> For
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              'Product launch campaigns', 'Brand awareness drives', 'Sampling & product activation',
              'Brand ambassador programmes', 'Campus & community activation', 'Event sponsorship packages',
              'Social media amplification', 'Market research & feedback', 'Community outreach initiatives',
            ].map((uc, i) => (
              <div key={i} className="flex items-center gap-3 p-5 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                <CheckCircle2 className="w-5 h-5 text-spark-red flex-shrink-0" />
                <span className="text-sm font-bold text-[var(--text-primary)]">{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            How It Works
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            Simple. <span className="text-gradient-red italic">Structured.</span> Scalable.
          </h2>
          <div className="grid md:grid-cols-5 gap-4 items-start">
            {[
              { step: '01', title: 'Create Brand Profile', desc: 'Register and complete your verified brand profile.' },
              { step: '02', title: 'Post Campaign', desc: 'Write a campaign brief with budget, goals and deliverables.' },
              { step: '03', title: 'Invite or Approve', desc: 'Browse creators and associations, or review inbound applications.' },
              { step: '04', title: 'Fund Wallet', desc: 'Confirm budget. Funds stay in escrow until work is approved.' },
              { step: '05', title: 'Approve & Report', desc: 'Review deliverables, approve work, and receive outcome data.' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-spark-red text-white font-black text-xl flex items-center justify-center shadow-lg shadow-spark-red/20">{s.step}</div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">{s.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Executive Toolkit (interactive) ── */}
      {(() => {
        const menus = [
          {
            id: 'campaigns',
            name: 'Campaign Manager',
            icon: <Megaphone className="w-5 h-5" />,
            description: 'Write structured campaign briefs, define deliverables, set budgets and deadlines, then let creators apply — or invite them directly from the talent directory.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Active Campaign</h4>
                <div className="space-y-3.5 text-xs font-semibold">
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                    <p className="text-[8px] text-[var(--text-secondary)] uppercase">Campaign Title</p>
                    <p className="text-[var(--text-primary)] mt-0.5">Back to School Blitz 2026</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                    <p className="text-[8px] text-[var(--text-secondary)] uppercase">Budget Locked in Escrow</p>
                    <p className="text-spark-red mt-0.5">₦250,000 (5 Creators)</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                    <p className="text-[8px] text-[var(--text-secondary)] uppercase">Status</p>
                    <p className="text-green-500 mt-0.5">3 Active · 2 Submitted</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'directory',
            name: 'Creator Directory',
            icon: <Users className="w-5 h-5" />,
            description: 'Search verified creators by niche, university, state, content type and past performance. View full portfolios, ratings, and send direct campaign invitations.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <div className="flex items-center gap-3.5 mb-4 border-b border-[var(--border-color)] pb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-black">A</div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--text-primary)]">Adaeze Okafor</h4>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Lifestyle Creator · UNILAG</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Niche:</span>
                    <span className="font-bold text-[var(--text-primary)]">Fashion, Beauty, Campus Life</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Rating:</span>
                    <span className="font-bold text-yellow-500">⭐ 4.8 (22 campaigns)</span>
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">Invite to Campaign</button>
              </div>
            )
          },
          {
            id: 'sponsorships',
            name: 'Event Sponsorships',
            icon: <Calendar className="w-5 h-5" />,
            description: 'Browse association events with full audience profiles and sponsorship packages. Review tiers, compare events and send a sponsorship proposal in minutes.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black text-[var(--text-primary)]">OAU Tech Expo 2026</h4>
                    <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Student Union · 5,000+ Audience</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[8px] font-black uppercase">Open</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed mb-6">Seeking Gold, Silver and Bronze sponsors for the largest tech event on OAU campus.</p>
                <button className="w-full py-3 bg-spark-black text-white dark:bg-white dark:text-spark-black text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-all shadow-md">Send Sponsorship Offer</button>
              </div>
            )
          },
          {
            id: 'wallet',
            name: 'Wallet & Escrow',
            icon: <Wallet className="w-5 h-5" />,
            description: 'Top up your brand wallet, fund campaigns, and track spend across all active campaigns. Escrow ensures funds are only released when deliverables are approved.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Brand Wallet</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex justify-between text-xs">
                    <span className="text-green-600 font-bold">Available Balance</span>
                    <span className="font-black text-[var(--text-primary)]">₦1,240,000</span>
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between text-xs">
                    <span className="text-amber-600 font-bold">Locked in Escrow</span>
                    <span className="font-black text-[var(--text-primary)]">₦380,000</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-bold">Total Spend (MTD)</span>
                    <span className="font-black text-[var(--text-primary)]">₦760,000</span>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'proposals',
            name: 'Offers & Proposals',
            icon: <MessageSquare className="w-5 h-5" />,
            description: 'Receive inbound pitches from creators and associations. Review proposal details, negotiate terms and respond from a single inbox — no scattered emails.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Proposal Inbox</h4>
                <div className="space-y-3">
                  {[{ name: 'UNILAG NSA', type: 'Sponsorship', badge: 'Gold Tier', amount: '₦500,000' }, { name: 'Kemi Adeyemi', type: 'Campaign Pitch', badge: 'Creator', amount: '₦40,000' }].map((p, i) => (
                    <div key={i} className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-[var(--text-primary)]">{p.name}</p>
                        <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">{p.type} · {p.badge}</p>
                      </div>
                      <span className="text-xs font-black text-spark-red">{p.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          },
          {
            id: 'analytics',
            name: 'Analytics & Reports',
            icon: <BarChart2 className="w-5 h-5" />,
            description: 'Every completed campaign generates a structured report. Track spend, deliverable completion rates, audience reach and campaign outcome data in your dashboard.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Campaign Analytics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Campaigns Run</p>
                    <p className="text-xl font-black text-[var(--text-primary)] mt-1">7 Total</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Creators Hired</p>
                    <p className="text-xl font-black text-spark-red mt-1">34 Total</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Completion Rate</p>
                    <p className="text-xl font-black text-green-500 mt-1">94%</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Avg. Cost/Creator</p>
                    <p className="text-xl font-black text-[var(--text-primary)] mt-1">₦22k</p>
                  </div>
                </div>
              </div>
            )
          },
          {
            id: 'overview',
            name: 'Dashboard Overview',
            icon: <LayoutDashboard className="w-5 h-5" />,
            description: 'Your brand’s mission control. See all active campaigns, pending proposals, wallet balance, escrow status and top-performing creators at a glance.',
            mockup: (
              <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
                <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Brand Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Active Campaigns</p>
                    <p className="text-xl font-black text-[var(--text-primary)] mt-1">3 Live</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Wallet Balance</p>
                    <p className="text-xl font-black text-green-500 mt-1">₦1.24M</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Pending Proposals</p>
                    <p className="text-xl font-black text-[var(--text-primary)] mt-1">5 New</p>
                  </div>
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Reports Due</p>
                    <p className="text-xl font-black text-amber-500 mt-1">2 Today</p>
                  </div>
                </div>
              </div>
            )
          },
        ];
        const active = menus.find(m => m.id === activeMenu) || menus[0];
        return (
          <section className="py-24 bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-12 gap-16 items-center">
                <div className="lg:col-span-5 text-left">
                  <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
                    Dashboard Features
                  </div>
                  <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
                    An Executive Toolkit
                  </h2>
                  <p className="text-[var(--text-secondary)] font-medium text-sm mb-10 max-w-md">
                    ABC-Rally equips your brand team with powerful dashboard modules to manage campaigns, creators and spend.
                  </p>
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-2 spark-scrollbar">
                    {menus.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${
                          activeMenu === item.id
                            ? 'bg-spark-red text-white border-spark-red shadow-lg shadow-spark-red/10 scale-[1.01]'
                            : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-spark-red/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
                            activeMenu === item.id ? 'bg-white/10 border-white/10 text-white' : 'bg-spark-red/5 border-spark-red/10 text-spark-red'
                          }`}>
                            {item.icon}
                          </div>
                          <span className="font-black text-xs uppercase tracking-wider">{item.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${activeMenu === item.id ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-7 flex flex-col justify-center items-center w-full min-h-[380px]">
                  <div className="w-full max-w-[460px] text-center lg:text-left">
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{active.name}</h3>
                      <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{active.description}</p>
                    </div>
                    <div className="w-full transition-all duration-500 transform scale-100 animate-in fade-in zoom-in-95">
                      {active.mockup}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Pricing & Trust ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Pricing &amp; Trust
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Clear Pricing. <span className="text-gradient-red italic">Zero Surprises.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-spark-black text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-spark-red/10 rounded-full blur-2xl" />
              <div className="relative z-10 space-y-5">
                <h3 className="text-xl font-black">Brand Fees</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-300 font-medium text-sm">Campaign Listing Fee</span>
                    <span className="font-black text-spark-red">₦20,000 / campaign</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-300 font-medium text-sm">Gig Listing Fee</span>
                    <span className="font-black text-spark-red">₦20,000 / gig</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-gray-300 font-medium text-sm">Event Sponsorship Listing</span>
                    <span className="font-black text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-300 font-medium text-sm">Creator Outreach</span>
                    <span className="font-black text-green-400">Free</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2.5rem] space-y-5">
              <h3 className="text-xl font-black text-[var(--text-primary)]">Platform Protections</h3>
              {[
                { icon: <Shield className="w-5 h-5" />, text: 'Verified creators with portfolio and rating system' },
                { icon: <Wallet className="w-5 h-5" />, text: 'Escrow-style payments — funds only released on approval' },
                { icon: <CheckCircle2 className="w-5 h-5" />, text: 'Structured approval and revision steps for deliverables' },
                { icon: <MessageSquare className="w-5 h-5" />, text: 'Dispute channel and dedicated support for brands' },
                { icon: <HeadphonesIcon className="w-5 h-5" />, text: 'Payment timeline transparency with transaction logs' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red flex-shrink-0 mt-0.5">{item.icon}</div>
                  <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="p-12 bg-spark-black rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-spark-red/10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Start Today</p>
              <h2 className="text-3xl md:text-4xl font-fancy font-black mb-4">Ready to Run Your First Campaign?</h2>
              <p className="text-gray-400 font-medium mb-10 max-w-xl mx-auto text-sm">
                Create your brand profile, post a campaign and start receiving applications from verified creators — all in under 10 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleStart}
                  className="bg-gradient-red text-white font-black py-4 px-10 rounded-2xl hover:shadow-2xl hover:shadow-spark-red/30 transition-all active:scale-95"
                >
                  Post a Campaign
                </button>
                <button
                  onClick={() => onNavigate('schedule-call')}
                  className="bg-white/10 text-white font-bold py-4 px-10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                  Book a Brand Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandsPage;
