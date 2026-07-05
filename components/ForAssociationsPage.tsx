import React, { useState } from 'react';
import {
  AlertCircle, Users, CheckCircle2, Layers, ArrowRight,
  Calendar, Wallet, Search, Handshake, Award, LayoutDashboard,
  Briefcase, MessageSquare, Settings, ChevronRight, TrendingUp,
  Building2, Megaphone, Shield
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  mockup: React.ReactNode;
}

const ForAssociationsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [activeMenu, setActiveMenu] = useState('overview');

  const handleRegister = () => {
    localStorage.setItem('preselectedRole', 'Organization');
    onNavigate('create-account');
  };

  const menus: MenuItem[] = [
    {
      id: 'overview',
      name: 'Dashboard Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'See your active events, sponsorship targets, creator tasks, pending brand proposals, wallet balance and escrow status from one control centre.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Executive Dashboard Overview</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Active Events</p>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">2 Live</p>
            </div>
            <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Sponsorship Raised</p>
              <p className="text-xl font-black text-spark-red mt-1">₦1,250,000</p>
            </div>
            <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Active Gigs</p>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">12 Creators</p>
            </div>
            <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Wallet Balance</p>
              <p className="text-xl font-black text-green-500 mt-1">₦340,000</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'events',
      name: 'My Events',
      icon: <Calendar className="w-5 h-5" />,
      description: 'List upcoming events, set sponsorship targets, describe audience value, upload event assets and invite brands to sponsor directly.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Create Public Event Page</h4>
          <div className="space-y-3.5 text-xs font-semibold">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-[8px] text-[var(--text-secondary)] uppercase">Event Title</p>
              <p className="text-[var(--text-primary)] mt-0.5">Annual Cultural Concert 2026</p>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-[8px] text-[var(--text-secondary)] uppercase">Sponsorship Target &amp; Tiers</p>
              <p className="text-spark-red mt-0.5">₦1,500,000 (Gold/Silver/Bronze)</p>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
              <p className="text-[8px] text-[var(--text-secondary)] uppercase">Creator Roles Needed</p>
              <p className="text-[var(--text-primary)] mt-0.5">5 Ushers, 2 Event Videographers</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'gigs',
      name: 'Assign Gigs',
      icon: <Briefcase className="w-5 h-5" />,
      description: 'Create paid or volunteer roles for creators and event support talent. Define role type, deliverables, duration, payment, reporting requirement and approval process.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-[var(--text-primary)]">Manage Gigs</h4>
            <div className="flex bg-[var(--bg-secondary)] rounded-lg p-0.5 border border-[var(--border-color)] text-[8px] font-black uppercase">
              <span className="bg-spark-red text-white px-2 py-1 rounded-md">Paid Gigs</span>
              <span className="text-[var(--text-secondary)] px-2 py-1">Volunteer</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[var(--text-primary)]">Event Usher (5 positions)</p>
                <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Deliverable: Welcoming guests, registration desk</p>
              </div>
              <span className="text-xs font-black text-spark-red">₦15,000/day</span>
            </div>
            <div className="p-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[var(--text-primary)]">Social Media Coverage</p>
                <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Deliverable: 3 Instagram Stories, 1 Reel</p>
              </div>
              <span className="text-xs font-black text-spark-red">₦30,000 total</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'creators',
      name: 'Find Creators',
      icon: <Search className="w-5 h-5" />,
      description: 'Search verified creators by category, location, niche, portfolio, event experience, content type and rating. View profiles and assign gigs directly.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex items-center gap-3.5 mb-4 border-b border-[var(--border-color)] pb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-black">T</div>
            <div>
              <h4 className="text-xs font-black text-[var(--text-primary)]">Tobi Alabi</h4>
              <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Campus Emcee • OAU Ife</p>
            </div>
          </div>
          <div className="space-y-2 mb-4 text-xs font-medium">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Experience:</span>
              <span className="font-bold text-[var(--text-primary)]">UNILAG Carnival, OAU Hackathon</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Rating:</span>
              <span className="font-bold text-yellow-500">⭐ 4.9 (14 bookings)</span>
            </div>
          </div>
          <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
            Assign Gig Directly
          </button>
        </div>
      )
    },
    {
      id: 'finance',
      name: 'Finance Hub',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Track sponsorship received, wallet balance, escrowed task funds, withdrawals and transaction history. Make the money flow transparent to association executives.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Financial Accountability Ledger</h4>
          <div className="space-y-3">
            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex justify-between text-xs">
              <span className="text-green-600 font-bold">Available for Withdrawal</span>
              <span className="font-black text-[var(--text-primary)]">₦340,000</span>
            </div>
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between text-xs">
              <span className="text-amber-600 font-bold">Locked for Assigned Gigs</span>
              <span className="font-black text-[var(--text-primary)]">₦120,000</span>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-bold">Total Sponsorship Deposited</span>
              <span className="font-black text-[var(--text-primary)]">₦460,000</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'brands',
      name: 'Explore Brands',
      icon: <Handshake className="w-5 h-5" />,
      description: 'Discover brands open to partnerships. Send sponsorship proposals, respond to brand offers and manage accept or decline decisions.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)]">PiggyVest Growth</h4>
              <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase">Fintech &amp; Savings</p>
            </div>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md text-[8px] font-black uppercase">Active Partner</span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
            Looking to sponsor tech events and finance seminars with expected attendance of 500+ students.
          </p>
          <button className="w-full py-3 bg-spark-black text-white dark:bg-white dark:text-spark-black text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-all shadow-md">
            Send Sponsorship Proposal
          </button>
        </div>
      )
    },
    {
      id: 'offers',
      name: 'Sponsorship Offers',
      icon: <Award className="w-5 h-5" />,
      description: 'View incoming offers from brands, compare terms, accept sponsorship, decline unsuitable offers or request clarification.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-[var(--text-primary)]">Incoming Sponsorship</h4>
            <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase">Funded</span>
          </div>
          <div className="space-y-2 mb-6 text-xs font-semibold">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Sponsor:</span>
              <span className="text-[var(--text-primary)]">MTN Pulse Nigeria</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Pledge:</span>
              <span className="text-[var(--text-primary)]">Gold Tier (₦750,000)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Status:</span>
              <span className="text-emerald-500">Funds Held in Wallet Escrow</span>
            </div>
          </div>
          <button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md">
            Acknowledge &amp; Accept
          </button>
        </div>
      )
    },
    {
      id: 'messages',
      name: 'Messages and Proposals',
      icon: <MessageSquare className="w-5 h-5" />,
      description: 'Keep all proposal conversations, documents, sponsorship terms and brand negotiations in one place.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Sponsor Negotiation Chat</h4>
          <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 text-xs">
            <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl max-w-[85%] border border-[var(--border-color)] font-medium leading-relaxed">
              <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase mb-1">MTN Brand Manager</p>
              We've reviewed your proposal for the Concert. Can we get 2 speech slots instead of 1?
            </div>
            <div className="bg-spark-red/5 p-3 rounded-2xl max-w-[85%] ml-auto border border-spark-red/10 font-medium leading-relaxed">
              <p className="text-[8px] font-black text-spark-red uppercase mb-1">Association Lead</p>
              Yes, we can slot in the second speech during the tech showcase break!
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      name: 'Settings and Verification',
      icon: <Settings className="w-5 h-5" />,
      description: 'Manage association profile, executive contacts, bank details, verification documents, event categories and notification preferences.',
      mockup: (
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)] shadow-xl w-full">
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-4">Verification Center</h4>
          <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between text-xs mb-4">
            <div>
              <p className="font-black text-[var(--text-primary)]">Association Status</p>
              <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase mt-0.5">Faculty Letter Uploaded</p>
            </div>
            <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded-md text-[8px] font-black uppercase">Approved</span>
          </div>
          <div className="space-y-2 text-[10px] font-bold text-[var(--text-secondary)]">
            <p className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" /> Profile Details Completed</p>
            <p className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" /> Bank Settlement Account Set</p>
          </div>
        </div>
      )
    }
  ];

  const active = menus.find(m => m.id === activeMenu) || menus[0];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-24 border-b border-[var(--border-color)] text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Powering Student Groups &amp; Professional Bodies
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-fancy font-black tracking-tighter leading-[1.1] mb-6 text-[var(--text-primary)]">
            Fund Your Events.<br />
            Activate Your Community.<br />
            <span className="text-gradient-red italic">Build Real Partnerships.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
            ABC-Rally gives associations and professional bodies a structured way to list events, set sponsorship targets, receive brand offers, assign paid or volunteer gigs and manage event funds through a secure wallet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRegister}
              className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Register Your Association <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('events')}
              className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl text-base hover:bg-spark-red/5 transition-all active:scale-95"
            >
              List an Event for Sponsorship
            </button>
          </div>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Problem
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Associations Have <span className="text-gradient-red italic">Real Audiences</span> But Weak Infrastructure
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            Most associations operate with strong community access but weak sponsor proposals, limited brand visibility, no funding tracker, and no structured way to source and pay event talent.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {[
              { icon: <AlertCircle className="w-5 h-5" />, title: 'Weak Sponsor Proposals', desc: 'No structure to present audience value, tiers, or benefits that brands can evaluate quickly.' },
              { icon: <Users className="w-5 h-5" />, title: 'Limited Brand Access', desc: 'No marketplace to connect with brands actively looking for community and campus partners.' },
              { icon: <Wallet className="w-5 h-5" />, title: 'No Funding Tracker', desc: 'Sponsorship pledges and payments are untracked, creating accountability gaps.' },
              { icon: <Briefcase className="w-5 h-5" />, title: 'Unstructured Talent Sourcing', desc: 'Event roles are filled informally, with no contracts, deliverables, or payment records.' },
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

      {/* ── Who It Is For ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Who It Is For
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            Built for <span className="text-gradient-red italic">Every Community</span> Organisation
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              'Student associations', 'Alumni sets', 'Campus clubs', 'NGOs & youth bodies',
              'Professional bodies', 'Community organisations', 'Event organisers', 'Religious fellowships',
            ].map((who, i) => (
              <div key={i} className="flex items-center gap-3 p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <CheckCircle2 className="w-5 h-5 text-spark-red flex-shrink-0" />
                <span className="text-sm font-bold text-[var(--text-primary)]">{who}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Solution
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            Everything Your Association <span className="text-gradient-red italic">Needs</span>
          </h2>
          <p className="text-base text-[var(--text-secondary)] font-medium max-w-3xl mx-auto mb-12 leading-relaxed">
            ABC-Rally helps associations list events, set sponsorship targets, receive proposals, hire creators and vendors, and report outcomes — all on one structured platform.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {[
              { icon: <Megaphone className="w-5 h-5" />, title: 'Build Event Sponsorship Pages', desc: 'Create a public event page with audience profile, sponsorship target, and brand benefit tiers.' },
              { icon: <Users className="w-5 h-5" />, title: 'Assign the Right People', desc: 'Post paid and volunteer roles for ushers, content creators, registration staff, and support talent.' },
              { icon: <TrendingUp className="w-5 h-5" />, title: 'Manage Sponsorship Finance', desc: 'Track pledges, received funds, locked gig payments, and available balance — all in one ledger.' },
              { icon: <Building2 className="w-5 h-5" />, title: 'Turn Community Into Value', desc: 'Convert your audience reach and trust into structured brand partnerships and recurring sponsorships.' },
            ].map((s, i) => (
              <div key={i} className="p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] flex gap-5">
                <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red flex-shrink-0 mt-1">{s.icon}</div>
                <div>
                  <h3 className="font-black text-base text-[var(--text-primary)] mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Use Cases
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            How Associations Use <span className="text-gradient-red italic">ABC-Rally</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {[
              'Event sponsorship packages', 'Membership awareness campaigns', 'Training & workshop partnerships',
              'Product activation hosting', 'Community outreach programmes', 'Brand ambassador recruitment',
            ].map((uc, i) => (
              <div key={i} className="flex items-center gap-3 p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <CheckCircle2 className="w-5 h-5 text-spark-red flex-shrink-0" />
                <span className="text-sm font-bold text-[var(--text-primary)]">{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            How It Works
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            From Registration to <span className="text-gradient-red italic">Outcome</span>
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
            {[
              { step: '01', title: 'Register Association' },
              { step: '02', title: 'Verify Leadership & Audience' },
              { step: '03', title: 'List Event or Package' },
              { step: '04', title: 'Receive Proposals' },
              { step: '05', title: 'Deliver Activation' },
              { step: '06', title: 'Submit Report' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-spark-red text-white font-black text-xl flex items-center justify-center shadow-lg shadow-spark-red/20">{s.step}</div>
                <h3 className="font-black text-xs text-[var(--text-primary)]">{s.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Showcase ── */}
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
                ABC-Rally equips your association executives with powerful dashboard modules to organise financing and staffing.
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

      {/* ── CTA ── */}
      <section className="py-24 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="p-12 bg-spark-black rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-spark-red/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Start Today</p>
              <h2 className="text-3xl md:text-4xl font-fancy font-black mb-4">Convert Community Influence Into Real Partnerships</h2>
              <p className="text-gray-400 font-medium mb-10 max-w-xl mx-auto text-sm">
                Set up your association dashboard in minutes and start receiving brand offers and sponsorship proposals from your first week.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRegister}
                  className="bg-gradient-red text-white font-black py-4 px-10 rounded-2xl hover:shadow-2xl hover:shadow-spark-red/30 transition-all active:scale-95"
                >
                  Register Association
                </button>
                <button
                  onClick={() => onNavigate('events')}
                  className="bg-white/10 text-white font-bold py-4 px-10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                  List an Event for Sponsorship
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForAssociationsPage;
