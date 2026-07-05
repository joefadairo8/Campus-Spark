import React, { useState, useEffect } from 'react';
import { apiClient } from '../firebase';
import { 
  Wallet, TrendingUp, Key, Rocket, ChevronRight, Filter, Search, 
  MapPin, Calendar, Shield, Clock, CheckCircle2, UserCheck, 
  Info, Bell, XCircle, ArrowRight, Check
} from 'lucide-react';

const CareersPage: React.FC<{ onNavigate: (page: string) => void, user?: any }> = ({ onNavigate, user }) => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'Campaign' | 'Gig'>('all');

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [budgetRange, setBudgetRange] = useState('all');
  const [roleType, setRoleType] = useState('all');
  const [deadlineStatus, setDeadlineStatus] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Email Alert State
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [submittingAlert, setSubmittingAlert] = useState(false);

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

        // gigs = Campaigns (Brands)
        const openGigs = gigs.filter((g: any) => 
          !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft')
        ).map((g: any) => ({
          ...g,
          type: 'Campaign',
          displayTitle: g.title,
          displayBrand: g.brand || g.brandName,
          displayReward: g.reward || g.budget,
          displayLocation: g.location || g.university || 'Nationwide'
        }));

        // campaigns = Gigs (Associations)
        const openCampaigns = campaigns.filter((g: any) => 
          !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft')
        ).map((g: any) => ({
          ...g,
          type: 'Gig',
          displayTitle: g.title,
          displayBrand: g.hostName || 'Association',
          displayReward: g.reward,
          displayLocation: g.university || 'Campus'
        }));

        const all = [...openGigs, ...openCampaigns].sort((a: any, b: any) => {
          const aDate = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || a.date || 0));
          const bDate = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || b.date || 0));
          return bDate.getTime() - aDate.getTime();
        });

        setOpportunities(all);
      } catch (err) {
        console.error('Failed to fetch opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'No Deadline';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const isClosingSoon = (dateStr: any) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const diff = d.getTime() - Date.now();
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 5;
    } catch (e) {
      return false;
    }
  };

  // Client-side filtering logic
  const filteredOpportunities = opportunities.filter(opp => {
    // 1. Opportunity Type Tab
    if (activeTab !== 'all' && opp.type !== activeTab) return false;

    // 2. Search Text
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = (opp.displayTitle || '').toLowerCase().includes(q);
      const brandMatch = (opp.displayBrand || '').toLowerCase().includes(q);
      const descMatch = (opp.description || opp.brief || '').toLowerCase().includes(q);
      if (!titleMatch && !brandMatch && !descMatch) return false;
    }

    // 3. Category
    if (category !== 'all') {
      const oppCat = (opp.category || opp.displayCategory || '').toLowerCase();
      if (!oppCat.includes(category.toLowerCase())) return false;
    }

    // 4. Location
    if (location !== 'all') {
      const oppLoc = (opp.displayLocation || '').toLowerCase();
      if (location === 'remote') {
        if (!oppLoc.includes('remote') && !oppLoc.includes('nationwide')) return false;
      } else {
        if (!oppLoc.includes(location.toLowerCase())) return false;
      }
    }

    // 5. Budget Range
    if (budgetRange !== 'all') {
      const reward = Number(opp.displayReward || 0);
      if (budgetRange === 'under-50k' && reward >= 50000) return false;
      if (budgetRange === '50k-150k' && (reward < 50000 || reward > 150000)) return false;
      if (budgetRange === '150k-500k' && (reward < 150000 || reward > 500000)) return false;
      if (budgetRange === 'over-500k' && reward <= 500000) return false;
    }

    // 6. Role Type (Paid vs Volunteer)
    if (roleType !== 'all') {
      const reward = Number(opp.displayReward || 0);
      if (roleType === 'paid' && reward === 0) return false;
      if (roleType === 'volunteer' && reward > 0) return false;
    }

    // 7. Verified Organiser
    if (verifiedOnly) {
      const isVerified = opp.verified || opp.verifiedOrganiser || opp.brandId || opp.hostRole === 'Brand';
      if (!isVerified) return false;
    }

    // 8. Deadline status
    if (deadlineStatus !== 'all') {
      if (!opp.deadline) return false;
      if (deadlineStatus === 'closing-soon') {
        if (!isClosingSoon(opp.deadline)) return false;
      } else if (deadlineStatus === 'active') {
        const d = new Date(opp.deadline);
        if (isNaN(d.getTime()) || d.getTime() < Date.now()) return false;
      }
    }

    return true;
  });

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setLocation('all');
    setBudgetRange('all');
    setRoleType('all');
    setDeadlineStatus('all');
    setVerifiedOnly(false);
  };

  const handleSubscribeAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    setSubmittingAlert(true);
    setTimeout(() => {
      setSubmittingAlert(false);
      setAlertSubscribed(true);
      setAlertEmail('');
    }, 1000);
  };

  const handleCreateProfile = () => {
    localStorage.setItem('preselectedRole', 'Creator');
    onNavigate('create-account');
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Launch Your Career Today
            </div>
            <h1 className="text-3xl md:text-5xl font-fancy font-black mb-8 leading-tight tracking-tighter text-[var(--text-primary)]">
              Marketplace Gigs &amp; <span className="text-gradient-red italic">Campaigns</span>.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-xl font-medium mx-auto">
              Don't wait until graduation. Join elite brand campaigns or discover paid gigs hosted by student associations near you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => document.getElementById('open-gigs')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
              >
                Browse Openings
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-spark-black text-white dark:bg-white dark:text-spark-black font-bold py-4 px-10 rounded-2xl text-base hover:bg-gray-800 transition-all active:scale-95"
              >
                Inquire Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">Why Build via <span className="text-gradient-red italic">ABC-Rally</span>?</h2>
            <p className="text-base text-[var(--text-secondary)] font-medium">We don't just find you gigs; we build your professional future.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Secure Payments", desc: "No more chasing brands for payment. We hold funds in escrow and pay out immediately upon task completion.", icon: <Wallet className="w-8 h-8" /> },
              { title: "Portfolio Building", desc: "Every campaign you complete adds a verified credential to your digital CV, recognized by top employers.", icon: <TrendingUp className="w-8 h-8" /> },
              { title: "Direct Access", desc: "Skip the middlemen. Get direct access to marketing managers at the biggest brands in Nigeria.", icon: <Key className="w-8 h-8" /> }
            ].map((benefit, i) => (
              <div key={i} className="p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] card-hover shadow-sm">
                <div className="w-16 h-16 bg-spark-red/5 rounded-2xl flex items-center justify-center text-spark-red mb-6">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{benefit.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Opportunities List */}
      <section id="open-gigs" className="py-20 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
                Current <span className="text-gradient-red italic">Opportunities</span>
              </h2>
              <p className="text-base text-[var(--text-secondary)] font-medium">Top brands and associations are scouting for talent. Select a filter to view specific opportunities.</p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-spark-red/5 rounded-2xl border border-spark-red/10 p-1 flex-wrap md:flex-nowrap">
              {[
                { id: 'all', label: 'All Opportunities' },
                { id: 'Campaign', label: 'Campaigns' },
                { id: 'Gig', label: 'Gigs' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? 'bg-spark-red text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-spark-red'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[2rem] p-6 mb-10 shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Search campaigns, brands, gigs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 pl-11 pr-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                >
                  <option value="all">All Categories</option>
                  <option value="awareness">Awareness Campaigns</option>
                  <option value="content">Content Creation</option>
                  <option value="ambassador">Ambassadors</option>
                  <option value="promo">Event Promotions</option>
                  <option value="usher">Event Support &amp; Ushers</option>
                  <option value="mc">MCs, DJs &amp; Hosts</option>
                  <option value="design">Graphic Design</option>
                </select>
              </div>

              {/* Location Dropdown */}
              <div>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                >
                  <option value="all">All Locations</option>
                  <option value="lagos">Lagos</option>
                  <option value="ibadan">Ibadan</option>
                  <option value="abuja">Abuja</option>
                  <option value="enugu">Enugu</option>
                  <option value="benin">Benin</option>
                  <option value="port harcourt">Port Harcourt</option>
                  <option value="remote">Remote / Nationwide</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Budget dropdown */}
              <div>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                >
                  <option value="all">All Budgets</option>
                  <option value="under-50k">Under ₦50k</option>
                  <option value="50k-150k">₦50k - ₦150k</option>
                  <option value="150k-500k">₦150k - ₦500k</option>
                  <option value="over-500k">Above ₦500k</option>
                </select>
              </div>

              {/* Remuneration dropdown */}
              <div>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                >
                  <option value="all">All Remuneration</option>
                  <option value="paid">Paid Roles Only</option>
                  <option value="volunteer">Volunteer Roles Only</option>
                </select>
              </div>

              {/* Deadline Status dropdown */}
              <div>
                <select
                  value={deadlineStatus}
                  onChange={(e) => setDeadlineStatus(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] text-sm border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] focus:outline-none focus:border-spark-red transition-all"
                >
                  <option value="all">All Deadlines</option>
                  <option value="active">Active Opportunities</option>
                  <option value="closing-soon">Closing Soon (&lt; 5 days)</option>
                </select>
              </div>

              {/* Verified Switch & Clear */}
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 accent-spark-red rounded cursor-pointer"
                  />
                  <Shield className="w-3.5 h-3.5 text-spark-red" /> Verified Organiser
                </label>

                {(search || category !== 'all' || location !== 'all' || budgetRange !== 'all' || roleType !== 'all' || deadlineStatus !== 'all' || verifiedOnly) && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-black text-spark-red hover:underline uppercase tracking-wider"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opportunities Cards */}
          <div className="grid gap-6">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-8 border border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-primary)] animate-pulse h-40">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              ))
            ) : filteredOpportunities.length > 0 ? (
              <div className="grid gap-6">
                {filteredOpportunities.map((opp) => {
                  const isClosing = isClosingSoon(opp.deadline);
                  const isPaid = Number(opp.displayReward || 0) > 0;
                  const organizerVerified = opp.verified || opp.verifiedOrganiser || opp.brandId || opp.hostRole === 'Brand';

                  return (
                    <div 
                      key={opp.id} 
                      className="group p-8 border border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-primary)] hover:border-spark-red/30 transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-10 cursor-pointer card-hover shadow-sm shadow-black/5" 
                      onClick={() => onNavigate(user ? (opp.type === 'Campaign' ? 'creator-dashboard' : 'association-dashboard') : 'login')}
                    >
                      {/* Logo indicator */}
                      <div className="w-16 h-16 bg-spark-red/5 rounded-2xl flex items-center justify-center border border-spark-red/10 flex-shrink-0 group-hover:scale-105 transition-transform text-lg font-black text-spark-red">
                        {(opp.displayBrand || 'S').charAt(0)}
                      </div>

                      {/* Content column */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${
                            opp.type === 'Campaign' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                          }`}>
                            {opp.type}
                          </span>
                          
                          <span className="px-2.5 py-1 bg-spark-black text-white text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                            {opp.displayBrand || 'Partner'}
                            {organizerVerified && <UserCheck className="w-3 h-3 text-blue-400" title="Verified Organiser" />}
                          </span>

                          <span className="px-2.5 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {opp.displayLocation}
                          </span>

                          {/* Payment status tag */}
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 ${
                            isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            <Wallet className="w-3 h-3" />
                            {isPaid ? (opp.type === 'Campaign' ? 'Escrow Funded' : 'Wallet Verified') : 'Volunteer Role'}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors flex items-center gap-2">
                          {opp.displayTitle}
                        </h3>

                        <p className="text-[var(--text-secondary)] text-sm max-w-2xl font-medium line-clamp-2 mb-4">
                          {opp.description || opp.brief || 'No description provided.'}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-[var(--text-secondary)] border-t border-[var(--border-color)]/50 pt-3">
                          <span className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-spark-red" />
                            Eligibility: <span className="text-[var(--text-primary)] font-bold">{opp.eligibility || (opp.type === 'Campaign' ? 'Vetted Creators & Influencers' : 'Registered Student Members')}</span>
                          </span>

                          <span className={`flex items-center gap-1.5 ${isClosing ? 'text-red-500 font-bold' : ''}`}>
                            <Clock className="w-3.5 h-3.5" />
                            Deadline: <span className="text-[var(--text-primary)] font-bold">{formatDate(opp.deadline)}</span>
                            {isClosing && <span className="px-1.5 py-0.5 bg-red-500/15 text-red-500 text-[8px] font-black rounded uppercase tracking-wider">Closing Soon</span>}
                          </span>
                        </div>
                      </div>

                      {/* Right Payout column */}
                      <div className="flex flex-col items-stretch lg:items-end gap-4 flex-shrink-0 w-full lg:w-auto border-t lg:border-t-0 border-[var(--border-color)] pt-4 lg:pt-0">
                        <div className="text-left lg:text-right">
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                            {opp.type === 'Campaign' ? 'Campaign Budget' : 'Gig Payout'}
                          </p>
                          <p className="text-xl font-black text-[var(--text-primary)]">
                            {isPaid ? `₦${(opp.displayReward || 0).toLocaleString()}` : 'Volunteer'}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 w-full lg:w-auto">
                          <button className="flex-1 lg:flex-none bg-gradient-red text-white font-bold py-3 px-8 rounded-xl text-sm group-hover:scale-[1.03] transition-all flex items-center justify-center gap-2 shadow-lg shadow-spark-red/10">
                            {user ? 'View Details' : 'Login to Apply'}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          
                          {/* TEMP: Admin delete for orphans */}
                          {(!opp.hostId && !opp.brandId) && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this orphaned record?')) {
                                  try {
                                    const coll = opp.type === 'Campaign' ? 'gigs' : 'events';
                                    await apiClient.delete(`${coll}/${opp.id}`);
                                    setOpportunities(prev => prev.filter(item => item.id !== opp.id));
                                    alert('Deleted successfully');
                                  } catch (err) {
                                    alert('Failed to delete. You might not have permission.');
                                  }
                                }
                              }}
                              className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              title="Delete Orphaned Data"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[3rem] p-8">
                <div className="w-20 h-20 bg-spark-red/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                  <Rocket className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Openings Found</h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-8 max-w-md mx-auto">
                  We couldn't find any opportunities matching your filters. Create your creator profile or subscribe to direct email alerts so you never miss a match!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <button 
                    onClick={handleCreateProfile}
                    className="bg-gradient-red text-white font-bold py-3 px-8 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-spark-red/20 active:scale-95"
                  >
                    Create Creator Profile
                  </button>
                  <button 
                    onClick={() => {
                      const container = document.getElementById('alert-box');
                      container?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold py-3 px-8 rounded-xl text-sm hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    Subscribe to Alerts
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Subscription Alerts Box */}
      <section id="alert-box" className="py-20 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-10 md:p-12 bg-spark-black text-white rounded-[2.5rem] relative overflow-hidden border border-white/5 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-spark-red/10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-12 h-12 bg-spark-red/20 rounded-2xl flex items-center justify-center text-spark-red mx-auto mb-5">
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-2xl md:text-3xl font-fancy font-black mb-3 text-white">Join Opportunities Alerts</h2>
              <p className="text-gray-400 font-medium mb-8 text-sm">
                Can't find what you are looking for? Give us your email and receive instant notifications the moment a brand posts a campaign or gig matching your interests.
              </p>

              {alertSubscribed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-emerald-400 flex flex-col items-center gap-2">
                  <Check className="w-6 h-6" />
                  <span className="font-bold text-sm">Subscription Active!</span>
                  <span className="text-xs text-gray-300">You will now receive notifications for all new marketplace listings.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribeAlerts} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-spark-red transition-all"
                  />
                  <button
                    type="submit"
                    disabled={submittingAlert}
                    className="bg-gradient-red text-white font-bold py-3.5 px-8 rounded-xl text-sm hover:shadow-lg hover:shadow-spark-red/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {submittingAlert ? 'Subscribing...' : 'Get Notified'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
