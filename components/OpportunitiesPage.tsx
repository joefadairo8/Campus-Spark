import React, { useState, useEffect } from 'react';
import { apiClient } from '../firebase';
import {
  ArrowRight, Search, Briefcase, Megaphone,
  CheckCircle2, Shield, UserCheck, BadgeAlert, Star,
  MapPin, Clock, BadgeDollarSign, ChevronDown, ChevronUp,
  BadgeCheck, SlidersHorizontal, Users, X
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category =
  | 'All'
  | 'Creator Gigs'
  | 'Brand Campaigns';

interface Opportunity {
  id: string | number;
  title: string;
  category: Exclude<Category, 'All'>;
  postedBy: string;
  verified: boolean;
  location: string;
  budget: string;
  deadline: string;
  skills: string[];
}

// ─── DB → Opportunity mapper helpers ─────────────────────────────────────────

const formatBudget = (value: any): string => {
  if (!value && value !== 0) return 'See Details';
  const num = Number(value);
  if (!isNaN(num) && num > 0) return `₦${num.toLocaleString()}`;
  return String(value);
};

const formatDeadline = (value: any): string => {
  if (!value) return 'Ongoing';
  try {
    // Firestore Timestamp
    const ms = value?.seconds ? value.seconds * 1000 : new Date(value).getTime();
    if (isNaN(ms)) return String(value);
    return new Date(ms).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(value);
  }
};

const mapGigToOpp = (g: any): Opportunity => ({
  id: g.id,
  title: g.title || 'Untitled',
  category: 'Brand Campaigns',
  postedBy: g.brand || g.brandName || g.company || 'Brand',
  verified: !!g.verified,
  location: g.location || g.university || 'Nationwide',
  budget: formatBudget(g.reward || g.budget),
  deadline: formatDeadline(g.deadline || g.closingDate),
  skills: Array.isArray(g.skills) ? g.skills : (g.skills ? String(g.skills).split(',').map((s: string) => s.trim()) : []),
});

const mapCampaignToOpp = (c: any): Opportunity => ({
  id: c.id,
  title: c.title || 'Untitled',
  category: 'Creator Gigs',
  postedBy: c.hostName || c.brand || c.brandName || 'Association',
  verified: !!c.verified,
  location: c.university || c.location || 'Campus',
  budget: formatBudget(c.reward || c.budget),
  deadline: formatDeadline(c.deadline || c.closingDate),
  skills: Array.isArray(c.skills) ? c.skills : (c.skills ? String(c.skills).split(',').map((s: string) => s.trim()) : []),
});

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORIES: { label: Category; icon: React.ReactNode; color: string }[] = [
  { label: 'All', icon: <SlidersHorizontal className="w-4 h-4" />, color: 'text-spark-red' },
  { label: 'Creator Gigs', icon: <Star className="w-4 h-4" />, color: 'text-purple-500' },
  { label: 'Brand Campaigns', icon: <Megaphone className="w-4 h-4" />, color: 'text-blue-500' },
];

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, string> = {
  'Creator Gigs':    'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Brand Campaigns': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Who can apply for opportunities on ABC-Rally?',
    a: 'Creators, influencers, students, professionals, activation teams, associations and service providers can apply depending on the opportunity requirement.',
  },
  {
    q: 'Are all opportunities paid?',
    a: 'Some opportunities are paid gigs, while others may be sponsorship calls, partnerships, collaborations or event support requests. Each listing clearly states the type of opportunity and reward structure.',
  },
  {
    q: 'How do brands post opportunities?',
    a: 'Brands can create an account, complete their profile, submit a campaign or gig brief, and publish the opportunity after review and payment where applicable.',
  },
  {
    q: 'How does ABC-Rally protect users?',
    a: 'ABC-Rally encourages verified profiles, clear briefs, transparent payment terms and support channels for campaign, payment and event-related disputes.',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const OpportunityCard: React.FC<{ opp: Opportunity; onApply: () => void; onViewDetails: (opp: Opportunity) => void }> = ({ opp, onApply, onViewDetails }) => (
  <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm flex flex-col hover:shadow-xl hover:shadow-spark-red/5 hover:border-spark-red/20 transition-all duration-300 group overflow-hidden">
    {/* Category accent bar */}
    <div className={`h-1 w-full ${
      opp.category === 'Creator Gigs' ? 'bg-purple-500' : 'bg-blue-500'
    }`} />

    <div className="p-6 flex flex-col flex-1 gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span className={`text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[opp.category]}`}>
          {opp.category}
        </span>
        {opp.verified && (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-spark-red bg-spark-red/5 px-2.5 py-1 rounded-lg border border-spark-red/10 whitespace-nowrap">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-black text-sm text-[var(--text-primary)] leading-snug group-hover:text-spark-red transition-colors line-clamp-2">
        {opp.title}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-spark-red/70" />{opp.postedBy}</span>
        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-spark-red/70" />{opp.location}</span>
        <span className="flex items-center gap-1.5"><BadgeDollarSign className="w-3.5 h-3.5 text-spark-red/70" />{opp.budget}</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-spark-red/70" />Closes {opp.deadline}</span>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {opp.skills.map((s) => (
          <span key={s} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            {s}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex gap-2 pt-2 border-t border-[var(--border-color)] mt-1">
        <button
          onClick={onApply}
          className="flex-1 py-3 bg-spark-red text-white font-black text-xs rounded-xl hover:bg-red-700 transition-all active:scale-95"
        >
          Apply Now
        </button>
        <button
          onClick={() => onViewDetails(opp)}
          className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-black text-xs rounded-xl hover:bg-[var(--bg-tertiary)] transition-all active:scale-95 border border-[var(--border-color)]"
        >
          View Details
        </button>
      </div>
    </div>
  </div>
);

// ─── Detail Modal (no login required) ────────────────────────────────────────

const OpportunityDetailModal: React.FC<{
  opp: Opportunity | null;
  onClose: () => void;
  onApply: () => void;
}> = ({ opp, onClose, onApply }) => {
  // Close on Escape key
  useEffect(() => {
    if (!opp) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [opp, onClose]);

  if (!opp) return null;

  const accentBar =
    opp.category === 'Creator Gigs'      ? 'bg-purple-500' :
    opp.category === 'Brand Campaigns'   ? 'bg-blue-500'   :
    opp.category === 'Event Activation'  ? 'bg-amber-500'  :
    opp.category === 'Sponsorship Calls' ? 'bg-green-500'  :
                                           'bg-pink-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[var(--bg-primary)] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-[var(--border-color)] my-auto animate-in zoom-in-95 duration-200">

        {/* Accent bar */}
        <div className={`h-1.5 w-full ${accentBar}`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center hover:bg-spark-red hover:text-white hover:border-spark-red transition-all z-10"
          style={{ minHeight: 'unset' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-[var(--border-color)]">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[opp.category]}`}>
              {opp.category}
            </span>
            {opp.verified && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-spark-red bg-spark-red/5 px-2.5 py-1 rounded-lg border border-spark-red/10">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] leading-snug pr-8">
            {opp.title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-6 max-h-[55vh] overflow-y-auto modal-content-scroll">

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <UserCheck className="w-4 h-4" />, label: 'Posted By', value: opp.postedBy },
              { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: opp.location },
              { icon: <BadgeDollarSign className="w-4 h-4" />, label: 'Budget / Value', value: opp.budget },
              { icon: <Clock className="w-4 h-4" />, label: 'Application Closes', value: opp.deadline },
            ].map((m) => (
              <div key={m.label} className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 text-spark-red mb-1.5">{m.icon}</div>
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">{m.label}</p>
                <p className="text-xs font-black text-[var(--text-primary)] leading-snug">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div>
            <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-3">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {opp.skills.map((s) => (
                <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Note for unauthenticated users */}
          <div className="p-4 bg-spark-red/5 border border-spark-red/10 rounded-2xl">
            <p className="text-xs font-bold text-[var(--text-secondary)] leading-relaxed">
              <span className="text-spark-red font-black">Ready to apply?</span> Create a free profile or log in to send your application or proposal directly to the opportunity owner.
            </p>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="px-8 py-6 border-t border-[var(--border-color)] flex gap-3">
          <button
            onClick={onApply}
            className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
          >
            Apply Now
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-black rounded-2xl hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-6 text-left bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        style={{ minHeight: 'unset' }}
      >
        <span className="font-black text-sm text-[var(--text-primary)]">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-spark-red shrink-0" /> : <ChevronDown className="w-4 h-4 text-spark-red shrink-0" />}
      </button>
      {open && (
        <div className="px-6 pb-6 bg-[var(--bg-primary)]">
          <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const OpportunitiesPage: React.FC<{ onNavigate: (page: string) => void; user?: any }> = ({ onNavigate, user }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch live opportunities from Firestore ─────────────────────────────────
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        let gigs: any[] = [];
        let campaigns: any[] = [];

        try {
          const res = await apiClient.get('gigs');
          gigs = res.data || [];
        } catch (e) {
          console.error('Error fetching gigs:', e);
        }

        try {
          const res = await apiClient.get('campaigns');
          campaigns = res.data || [];
        } catch (e) {
          console.error('Error fetching campaigns:', e);
        }

        const openGigs = gigs
          .filter((g: any) => !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft'))
          .map(mapGigToOpp);

        const openCampaigns = campaigns
          .filter((g: any) => !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft'))
          .map(mapCampaignToOpp);

        const all = [...openGigs, ...openCampaigns];
        setOpportunities(all);
      } catch (err) {
        console.error('Failed to fetch opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  // ── Page-level SEO ─────────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.title;
    document.title = 'Opportunities | Paid Gigs, Brand Campaigns & Sponsorships - ABC-Rally';
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content') || '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Find paid creator gigs, brand campaigns, event activation roles and sponsorship opportunities on ABC-Rally. Apply, collaborate and grow with verified brands and associations.'
      );
    }
    return () => {
      document.title = prev;
      if (metaDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  const filtered = opportunities.filter((o) => {
    const matchCat = activeCategory === 'All' || o.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.title.toLowerCase().includes(q) || o.postedBy.toLowerCase().includes(q) || o.location.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleCTA = () => {
    if (user) {
      const roleMap: Record<string, string> = {
        Brand: 'brand-dashboard',
        Creator: 'creator-dashboard',
        Organization: 'association-dashboard',
        Association: 'association-dashboard',
      };
      onNavigate(roleMap[user.role] || 'create-account');
    } else {
      onNavigate('create-account');
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)]">

      {/* ── Opportunity Detail Modal (no login required) ── */}
      <OpportunityDetailModal opp={selectedOpp} onClose={() => setSelectedOpp(null)} onApply={() => { setSelectedOpp(null); handleCTA(); }} />

      {/* ── SEO ──────────────────────────────────────────────────────────────── */}
      {/* Meta tags are injected server-side / via index.html; page-level title is set dynamically */}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 pb-24 border-b border-[var(--border-color)]">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-8%] left-[-8%] w-[45%] h-[55%] bg-spark-red/8 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-12%] right-[-8%] w-[40%] h-[45%] bg-blue-600/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Opportunities
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-fancy font-black tracking-tighter leading-[1.1] mb-6 text-[var(--text-primary)]">
            Find Paid Gigs, Campaigns<br />
            <span className="text-gradient-red italic">and Collaboration Opportunities</span>
          </h1>

          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-4 leading-relaxed max-w-3xl mx-auto font-medium">
            ABC-Rally connects creators, activation teams, associations and service providers with opportunities
            from brands, organizations and event owners. Discover campaigns to promote, gigs to apply for,
            events to support and sponsorship openings to pursue.
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
            Whether you are a creator looking for paid work, an association seeking brand support, or a brand
            looking for trusted collaborators, the Opportunities page helps you find the right match faster.
          </p>

          {/* Bullet highlights */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-12 text-xs font-bold text-[var(--text-secondary)]">
            {[
              'Apply for creator gigs and brand campaigns',
              'Discover event activation and ambassador roles',
              'Find sponsorship calls from associations',
              'Connect with verified brands and project owners',
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-spark-red shrink-0" />{item}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              id="hero-explore-opportunities"
              onClick={() => document.getElementById('opportunities-list')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              Explore Opportunities <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-post-opportunity"
              onClick={handleCTA}
              className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl hover:bg-spark-red/5 transition-all active:scale-95"
            >
              Post an Opportunity
            </button>
            <button
              id="hero-create-profile"
              onClick={() => {
                localStorage.setItem('preselectedRole', 'Creator');
                onNavigate('create-account');
              }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold py-4 px-10 rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all active:scale-95"
            >
              Create Creator Profile
            </button>
          </div>

          {/* ── Creator fee transparency notice ── */}
          <div className="mt-10 inline-flex items-center gap-2.5 px-5 py-2.5 bg-spark-red/5 border border-spark-red/10 rounded-full text-xs font-bold text-[var(--text-secondary)]">
            <Shield className="w-3.5 h-3.5 text-spark-red shrink-0" />
            <span>
              <span className="text-spark-red font-black">Creators:</span> Joining &amp; applying is 100% free. A{' '}
              <span className="text-[var(--text-primary)] font-black">10% platform service fee</span> is deducted only when you complete a paid gig.
            </span>
          </div>
        </div>
      </section>

      {/* ── Category Overview ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Opportunity Categories
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Every Type of Collaboration, <span className="text-gradient-red italic">In One Place</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Star className="w-5 h-5" />,
                label: 'Creator Gigs',
                who: 'Creators, influencers, photographers, designers, video editors, content writers',
                copy: 'Paid tasks from brands looking for content creation, product promotion, storytelling, design or campaign support.',
                color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
                bar: 'bg-purple-500',
              },
              {
                icon: <Megaphone className="w-5 h-5" />,
                label: 'Brand Campaigns',
                who: 'Brands, creators, campus / community promoters',
                copy: 'Campaign briefs from brands looking for creators, ambassadors or activation teams to support awareness, engagement or sales.',
                color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                bar: 'bg-blue-500',
              },
              {
                icon: <Briefcase className="w-5 h-5" />,
                label: 'Post an Opportunity',
                who: 'Brands and verified organizations',
                copy: 'Are you a brand or organization? Post campaign briefs, hire activation teams and receive proposals from qualified collaborators.',
                color: 'bg-spark-red/10 text-spark-red border-spark-red/20',
                bar: 'bg-spark-red',
                cta: true,
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className={`bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group ${cat.cta ? 'cursor-pointer' : ''}`}
                onClick={cat.cta ? handleCTA : undefined}
              >
                <div className={`h-1.5 w-full ${cat.bar}`} />
                <div className="p-7 flex flex-col gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cat.color}`}>
                    {cat.icon}
                  </div>
                  <h3 className="font-black text-sm text-[var(--text-primary)] group-hover:text-spark-red transition-colors">{cat.label}</h3>
                  <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest opacity-70">{cat.who}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{cat.copy}</p>
                  {cat.cta && (
                    <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-black text-spark-red">
                      Get Started <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse Opportunities ──────────────────────────────────────────────── */}
      <section id="opportunities-list" className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Featured Opportunities
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Browse by <span className="text-gradient-red italic">Category</span>
            </h2>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              id="opportunities-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, brand, or location…"
              className="w-full pl-11 pr-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-spark-red font-medium text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              style={{ minHeight: 'unset' }}
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                id={`tab-${cat.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveCategory(cat.label)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs border transition-all duration-200 active:scale-95 ${
                  activeCategory === cat.label
                    ? 'bg-spark-red text-white border-spark-red shadow-lg shadow-spark-red/20'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-spark-red/30 hover:text-spark-red'
                }`}
                style={{ minHeight: 'unset' }}
              >
                <span className={activeCategory === cat.label ? 'text-white' : cat.color}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-6 animate-pulse h-64">
                  <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/4 mb-4" />
                  <div className="h-5 bg-[var(--bg-secondary)] rounded w-3/4 mb-2" />
                  <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2 mb-6" />
                  <div className="flex gap-2 mt-auto">
                    <div className="h-3 bg-[var(--bg-secondary)] rounded w-16" />
                    <div className="h-3 bg-[var(--bg-secondary)] rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} onApply={handleCTA} onViewDetails={setSelectedOpp} />
              ))}
            </div>
          ) : (
            /* ── Empty State ── */
            <div className="text-center py-24 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-spark-red/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-7 h-7 text-spark-red" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-3">No opportunities found</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-8">
                No opportunities are available for your current filters. New brand campaigns, creator gigs and sponsorship openings
                will appear here as soon as they are posted. Create your profile now so you can apply faster when opportunities go live.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  id="empty-create-profile"
                  onClick={() => { localStorage.setItem('preselectedRole', 'Creator'); onNavigate('create-account'); }}
                  className="bg-gradient-red text-white font-bold py-3.5 px-8 rounded-2xl hover:shadow-lg hover:shadow-spark-red/20 transition-all active:scale-95"
                >
                  Create Profile
                </button>
                <button
                  id="empty-post-opportunity"
                  onClick={handleCTA}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold py-3.5 px-8 rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all active:scale-95"
                >
                  Post First Opportunity
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            The Process
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-12">
            How It <span className="text-gradient-red italic">Works</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 text-left">
            {[
              { step: '01', title: 'Create your profile', desc: 'Set up a portfolio showcasing your skills, experience and contact details.' },
              { step: '02', title: 'Browse opportunities', desc: 'Explore listings filtered by category, location, budget and deadline.' },
              { step: '03', title: 'Apply or send interest', desc: 'Submit your application or send a proposal directly to the opportunity owner.' },
              { step: '04', title: 'Get selected', desc: 'Receive a response, review the brief, and confirm your participation.' },
              { step: '05', title: 'Deliver & get paid', desc: 'Complete your deliverables and receive payment or collaboration confirmation.' },
            ].map((s) => (
              <div key={s.step} className="p-7 bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] flex flex-col gap-3 relative overflow-hidden group hover:border-spark-red/30 transition-all">
                <div className="absolute top-4 right-5 text-5xl font-black text-spark-red/5 group-hover:text-spark-red/10 transition-colors">{s.step}</div>
                <div className="w-10 h-10 rounded-xl bg-spark-red text-white font-black text-xs flex items-center justify-center shadow-lg shadow-spark-red/20">{s.step}</div>
                <h3 className="font-black text-sm text-[var(--text-primary)] leading-snug mt-1">{s.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience Split ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Who Is It For
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Built for <span className="text-gradient-red italic">Every Stakeholder</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Megaphone className="w-6 h-6" />,
                title: 'For Brands',
                desc: 'Post campaign briefs, recruit creators, hire activation teams and receive proposals from qualified collaborators.',
                cta: 'Post an Opportunity',
                role: 'Brand',
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: 'For Creators',
                desc: 'Find paid gigs, apply with your portfolio and build your work history on ABC-Rally.',
                cta: 'Find Gigs',
                role: 'Creator',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'For Associations',
                desc: 'Submit sponsorship opportunities, list event needs and connect with brands ready to support relevant communities.',
                cta: 'List an Opportunity',
                role: 'Association',
              },
            ].map((block) => (
              <div key={block.title} className="bg-[var(--bg-secondary)] p-8 rounded-[2rem] border border-[var(--border-color)] flex flex-col gap-5 hover:border-spark-red/30 transition-all group">
                <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red">
                  {block.icon}
                </div>
                <div>
                  <h3 className="font-black text-base text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors">{block.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{block.desc}</p>
                </div>
                <button
                  onClick={() => { localStorage.setItem('preselectedRole', block.role); onNavigate('create-account'); }}
                  className="mt-auto w-full py-3.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs rounded-xl hover:border-spark-red/40 hover:text-spark-red transition-all active:scale-95"
                >
                  {block.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust & Safety ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
            Trust & Safety
          </div>
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
            Safe. Transparent. <span className="text-gradient-red italic">Supported.</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            ABC-Rally reviews listings, encourages verified profiles and provides support for payment, campaign and event disputes.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {[
              { icon: <BadgeCheck className="w-5 h-5" />, title: 'Verified Listings', desc: 'All opportunities are reviewed before going live to protect applicants.' },
              { icon: <UserCheck className="w-5 h-5" />, title: 'Verified Profiles', desc: 'Brands and associations are encouraged to complete full verification.' },
              { icon: <Shield className="w-5 h-5" />, title: 'Payment Protection', desc: 'Transparent payment terms and escrow options available for eligible gigs.' },
              { icon: <BadgeAlert className="w-5 h-5" />, title: 'Dispute Support', desc: 'Dedicated support channels for campaign, payment and event-related disputes.' },
            ].map((t) => (
              <div key={t.title} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] flex flex-col gap-4">
                <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red">{t.icon}</div>
                <h3 className="font-black text-xs text-[var(--text-primary)]">{t.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              FAQ
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Common <span className="text-gradient-red italic">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="p-12 bg-spark-black rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-spark-red/10 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-600/5 rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-spark-red uppercase tracking-[0.3em] mb-4">Get Started</p>
              <h2 className="text-3xl md:text-4xl font-fancy font-black mb-4">Ready to Find Your Next Opportunity?</h2>
              <p className="text-gray-400 font-medium mb-10 max-w-xl mx-auto text-sm leading-relaxed">
                Create your profile, browse the latest listings and apply for paid gigs, campaigns and sponsorship calls
                across Nigeria.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  id="cta-explore-opportunities"
                  onClick={() => document.getElementById('opportunities-list')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-red text-white font-black py-4 px-10 rounded-2xl hover:shadow-2xl hover:shadow-spark-red/30 transition-all active:scale-95"
                >
                  Explore Opportunities
                </button>
                <button
                  id="cta-post-opportunity"
                  onClick={handleCTA}
                  className="bg-white/10 text-white font-bold py-4 px-10 rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-95"
                >
                  Post an Opportunity
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default OpportunitiesPage;
