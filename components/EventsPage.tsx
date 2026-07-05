import React, { useState, useEffect } from 'react';
import { apiClient } from '../firebase';
import { 
  Search, Calendar, MapPin, ChevronRight, CalendarX, 
  Megaphone, Users, Award, Shield, FileText, HelpCircle, 
  Plus, Info, Globe, Send, CheckCircle2, ChevronDown, 
  ChevronUp, AlertCircle, Sparkles, Building, Layers, 
  ArrowRight, UserCheck, Star, HelpCircle as QuestionIcon
} from 'lucide-react';
import { ProposalFormModal } from './ProposalFormModal';

interface EventCategory {
  id: string;
  name: string;
  bestFor: string;
  copy: string;
}

const CATEGORIES: EventCategory[] = [
  {
    id: 'Association Events',
    name: 'Association Events',
    bestFor: 'Professional bodies, alumni sets, industry groups, social clubs',
    copy: 'AGMs, reunions, award nights, seminars and conferences seeking sponsors or service providers.'
  },
  {
    id: 'Youth/Community',
    name: 'Youth and Community Events',
    bestFor: 'Youth groups, creator communities, civic groups',
    copy: 'Programs that bring people together around culture, entrepreneurship, learning, lifestyle or community impact.'
  },
  {
    id: 'Conferences',
    name: 'Professional Conferences',
    bestFor: 'Industry bodies, training providers, business communities',
    copy: 'Conferences and summits with sponsorship, exhibition and speaking opportunities.'
  },
  {
    id: 'Campus',
    name: 'Campus and Graduate Events',
    bestFor: 'Universities, student groups, youth organizations',
    copy: 'Career fairs, talent showcases, entrepreneurship programs and campus activations.'
  },
  {
    id: 'Brand Activation',
    name: 'Brand Activation Events',
    bestFor: 'Brands, agencies, event producers',
    copy: 'Product launches, sampling, roadshows, pop-ups and experiential marketing activities.'
  },
  {
    id: 'Tech/Innovation',
    name: 'Tech and Innovation Events',
    bestFor: 'Tech communities, startups, hubs, innovation groups',
    copy: 'Hackathons, demo days, startup showcases, developer meetups and innovation summits.'
  }
];

const FAQS = [
  {
    q: 'Who can list an event?',
    a: 'Associations, communities, brands, professional bodies, event organizers and verified organizations can list events subject to ABC-Rally review.'
  },
  {
    q: 'Can brands sponsor events through ABC-Rally?',
    a: 'Yes. Brands can browse listed events, review audience fit and sponsorship packages, then express interest or send a proposal.'
  },
  {
    q: 'Can creators get event jobs on this page?',
    a: 'Yes. Event organizers can request creators, photographers, videographers, hosts, ushers, field marketers and activation teams.'
  },
  {
    q: 'What information should an event organizer provide?',
    a: 'Organizer name, event title, date, venue, audience profile, expected attendance, sponsorship needs, packages and contact/support details.'
  }
];

// Helper to dynamically determine event category based on text search if not provided
const getEventCategory = (e: any): string => {
  if (e.category) return e.category;
  
  const text = `${e.name || ''} ${e.description || ''}`.toLowerCase();
  
  if (text.includes('tech') || text.includes('hackathon') || text.includes('developer') || text.includes('startup') || text.includes('innovation') || text.includes('demo day')) {
    return 'Tech/Innovation';
  }
  if (text.includes('conference') || text.includes('summit') || text.includes('forum') || text.includes('seminar') || text.includes('agm')) {
    return 'Conferences';
  }
  if (text.includes('campus') || text.includes('university') || text.includes('student') || text.includes('graduate') || text.includes('talent showcase') || text.includes('career fair')) {
    return 'Campus';
  }
  if (text.includes('reunion') || text.includes('alumni') || text.includes('association') || text.includes('dinner') || text.includes('award')) {
    return 'Association Events';
  }
  if (text.includes('launch') || text.includes('activation') || text.includes('roadshow') || text.includes('sampling') || text.includes('pop-up') || text.includes('marketing')) {
    return 'Brand Activation';
  }
  if (text.includes('trade') || text.includes('fair') || text.includes('exhibition') || text.includes('expo') || text.includes('bazaar') || text.includes('market') || text.includes('trade fair')) {
    return 'Trade Fair';
  }
  if (text.includes('youth') || text.includes('community') || text.includes('impact') || text.includes('culture') || text.includes('lifestyle')) {
    return 'Youth/Community';
  }

  // Fallback based on host role or default
  if (e.hostRole === 'Brand') return 'Brand Activation';
  if (e.hostRole === 'Organization' || e.hostRole === 'Association') return 'Association Events';
  
  return 'Youth/Community';
};

// Helper for Audience Profile default copy
const getAudienceProfile = (category: string): string => {
  switch (category) {
    case 'Conferences':
      return 'Professionals, business executives, SMEs, tech leaders';
    case 'Association Events':
      return 'Alumni, professionals, industry specialists, social members';
    case 'Youth/Community':
      return 'Youth, creative minds, local community members, activists';
    case 'Campus':
      return 'University students, graduates, youth groups, academic peers';
    case 'Brand Activation':
      return 'Target consumers, brand enthusiasts, influencers, general public';
    case 'Tech/Innovation':
      return 'Developers, founders, startup operators, investors, tech enthusiasts';
    case 'Trade Fair':
      return 'SMEs, local vendors, bargain shoppers, general public';
    default:
      return 'Students, creators, SMEs, community members';
  }
};

const EventsPage: React.FC<{ onNavigate: (page: string) => void, user?: any }> = ({ onNavigate, user }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Proposal Modal States
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalRecipientId, setProposalRecipientId] = useState('');
  const [proposalRecipientName, setProposalRecipientName] = useState('');
  const [proposalTitle, setProposalTitle] = useState('Event Proposal');
  const [isSponsorship, setIsSponsorship] = useState(false);
  const [proposalPackage, setProposalPackage] = useState<any | null>(null);

  // Past Events Gallery State
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [pastEventsLoading, setPastEventsLoading] = useState(true);

  // FAQ State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Set SEO Meta Title and Description dynamically
  useEffect(() => {
    document.title = 'Events | Sponsor Events, Hire Creators & Find Brand Activations - ABC-Rally';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover events seeking sponsors, creators, vendors and brand partners. ABC-Rally helps associations list events and helps brands connect with relevant communities.');
    }
  }, []);

  // Fetch Live Events from database
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await apiClient.get('events');
        const eventData = res.data || [];
        
        // Sort events by date descending
        const sorted = eventData.sort((a: any, b: any) => {
          const aDate = new Date(a.date || a.createdAt || 0);
          const bDate = new Date(b.date || b.createdAt || 0);
          return bDate.getTime() - aDate.getTime();
        });

        setEvents(sorted);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch Past Events for Showcase
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const res = await apiClient.get('past_events');
        const sorted = (res.data || []).sort((a: any, b: any) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        setPastEvents(sorted);
      } catch (err) {
        console.error('Failed to fetch past events:', err);
      } finally {
        setPastEventsLoading(false);
      }
    };
    fetchPastEvents();
  }, []);

  // Handle Event Filtering
  const filteredEvents = events.filter((e) => {
    const category = getEventCategory(e);
    
    const matchesSearch = 
      (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.hostName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedFilter === 'All' || 
      category === selectedFilter;

    return matchesSearch && matchesCategory;
  });

  // CTA triggers
  const handleListEventClick = () => {
    if (!user) {
      onNavigate('login');
    } else if (user.role === 'Organization' || user.role === 'Association') {
      onNavigate('association-dashboard');
    } else {
      alert(`Only Student Organizations and Associations can list events on their dashboard. Your current role is: ${user.role}`);
    }
  };

  const handleSponsorClick = (event: any, pkg: any = null) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setProposalRecipientId(event.hostId || event.hostEmail || '');
    setProposalRecipientName(event.hostName || 'Organizer');
    setProposalTitle(`Sponsorship Proposal: ${event.name}`);
    setIsSponsorship(true);
    setProposalPackage(pkg);
    setShowProposalModal(true);
  };

  const handleApplyClick = (event: any) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setProposalRecipientId(event.hostId || event.hostEmail || '');
    setProposalRecipientName(event.hostName || 'Organizer');
    setProposalTitle(`Creator/Vendor Application: ${event.name}`);
    setIsSponsorship(false);
    setProposalPackage(null);
    setShowProposalModal(true);
  };

  const handleContactClick = (event: any) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setProposalRecipientId(event.hostId || event.hostEmail || '');
    setProposalRecipientName(event.hostName || 'Organizer');
    setProposalTitle(`Inquiry for ${event.name}`);
    setIsSponsorship(false);
    setProposalPackage(null);
    setShowProposalModal(true);
  };

  const handleProposalSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        sponsorshipPackageName: data.packageName || null
      };
      await apiClient.post('proposals', payload);
      alert('Your request has been submitted successfully! The organizer will contact you via your dashboard.');
      setShowProposalModal(false);
    } catch (err: any) {
      console.error('Failed to submit proposal:', err);
      alert(err.message || 'Failed to submit proposal. Please try again.');
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-[var(--text-primary)] transition-colors duration-300">
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-spark-purple/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-[11px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              <Sparkles className="w-3 h-3 text-spark-red" />
              Event Sponsorship Marketplace
            </div>
            
            <h1 className="text-4xl md:text-6xl font-fancy font-black mb-8 leading-tight tracking-tight text-[var(--text-primary)]">
              Discover Events, Sponsorships and <br className="hidden md:inline" />
              <span className="text-gradient-red italic">Brand Activation</span> Opportunities
            </h1>
            
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-6 leading-relaxed max-w-3xl mx-auto font-medium">
              ABC-Rally helps brands, associations, creators and event teams connect around real events. Explore upcoming conferences, community programs, professional gatherings, youth events, product activations and association programs that need sponsors, creators, vendors or brand partners.
            </p>
            
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              For brands, this is where you find events with ready audiences. For associations, this is where you list your event and attract sponsors. For creators and event professionals, this is where you discover event-based gigs and activation tasks.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById('events-directory')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-spark-red hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-spark-red/10 flex items-center gap-2 group"
              >
                Explore Events
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleListEventClick}
                className="bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-black py-4 px-8 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 border border-[var(--border-color)]"
              >
                List Your Event
              </button>
              <button
                onClick={() => onNavigate('for-associations')}
                className="text-spark-red font-black text-sm uppercase tracking-widest hover:underline px-4 py-2"
              >
                Find Sponsors &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Event Categories Grid Section */}
      <section className="py-24 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-purple uppercase bg-spark-purple/5 border border-spark-purple/10 rounded-full">
              Sponsorship Niches
            </span>
            <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
              Browse Event <span className="text-spark-red italic">Categories</span>.
            </h2>
            <p className="text-base text-[var(--text-secondary)] font-medium leading-relaxed">
              Find physical, online, and hybrid gatherings matching your brand values and community marketing needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={cat.id} 
                className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-spark-red/5 text-spark-red flex items-center justify-center border border-spark-red/10 mb-6 group-hover:bg-spark-red group-hover:text-white transition-colors duration-300">
                    {idx === 0 && <Building className="w-6 h-6" />}
                    {idx === 1 && <Users className="w-6 h-6" />}
                    {idx === 2 && <Layers className="w-6 h-6" />}
                    {idx === 3 && <Award className="w-6 h-6" />}
                    {idx === 4 && <Megaphone className="w-6 h-6" />}
                    {idx === 5 && <Sparkles className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors">{cat.name}</h3>
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-4">
                    Best for: <span className="text-[var(--text-primary)]">{cat.bestFor}</span>
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    {cat.copy}
                  </p>
                </div>
                <div className="mt-8 pt-4 border-t border-[var(--border-color)]">
                  <button 
                    onClick={() => {
                      setSelectedFilter(cat.id);
                      document.getElementById('events-directory')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs font-black uppercase tracking-widest text-spark-red group-hover:underline flex items-center gap-1"
                  >
                    View Opportunities &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audiences Public sections (brands, associations, creators) */}
      <section className="py-24 border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* For Brands */}
            <div className="bg-[var(--bg-secondary)]/50 rounded-[2.5rem] border border-[var(--border-color)] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[4rem] group-hover:w-28 group-hover:h-28 transition-all" />
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">For Brands</span>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-6 mb-4">Target Ready Audiences</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  Find events that match your target audience, sponsor relevant communities, and hire creators or activation teams for on-ground visibility. Secure your placements and manage deliverables on a single dashboard.
                </p>
              </div>
              <button 
                onClick={() => onNavigate('for-brands')} 
                className="mt-8 text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                Grow with Events &rarr;
              </button>
            </div>

            {/* For Associations */}
            <div className="bg-[var(--bg-secondary)]/50 rounded-[2.5rem] border border-[var(--border-color)] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-spark-red/5 rounded-bl-[4rem] group-hover:w-28 group-hover:h-28 transition-all" />
              <div>
                <span className="text-[10px] font-black text-spark-red uppercase tracking-widest bg-spark-red/10 px-3 py-1 rounded-full">For Associations</span>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-6 mb-4">Raise Event Sponsorships</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  List your event, define your sponsorship needs, publish your audience profile, and receive interest directly from verified brands or marketing partners. Take control of your event finance.
                </p>
              </div>
              <button 
                onClick={handleListEventClick} 
                className="mt-8 text-xs font-black uppercase tracking-widest text-spark-red flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                List Your Event &rarr;
              </button>
            </div>

            {/* For Creators */}
            <div className="bg-[var(--bg-secondary)]/50 rounded-[2.5rem] border border-[var(--border-color)] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-spark-purple/5 rounded-bl-[4rem] group-hover:w-28 group-hover:h-28 transition-all" />
              <div>
                <span className="text-[10px] font-black text-spark-purple uppercase tracking-widest bg-spark-purple/10 px-3 py-1 rounded-full">For Creators & Vendors</span>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mt-6 mb-4">Find Event Gigs</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  Apply for paid coverage, hosting, photography, videography, ushering, field marketing and activation tasks. Earn money doing what you love while supporting real gatherings.
                </p>
              </div>
              <button 
                onClick={() => onNavigate('for-creators')} 
                className="mt-8 text-xs font-black uppercase tracking-widest text-spark-purple flex items-center gap-1.5 group-hover:translate-x-1 transition-transform"
              >
                Find Gigs &rarr;
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Events Directory */}
      <section id="events-directory" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
                Live Directory
              </span>
              <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)]">
                Active Sponsorship <span className="text-gradient-red italic">Openings</span>.
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium max-w-md">
              Sponsor events seeking corporate backing, or apply for service contracts directly from active organizers.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-6 mb-12">
            
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 pb-2 border-b border-[var(--border-color)]">
              {['All', 'Conferences', 'Association Events', 'Youth/Community', 'Campus', 'Brand Activation', 'Tech/Innovation', 'Trade Fair'].map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setSelectedFilter(filterName)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                    selectedFilter === filterName
                      ? 'bg-spark-red text-white border-spark-red shadow-sm'
                      : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {filterName === 'Youth/Community' ? 'Youth/Community' : filterName}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search events, venues, or hosts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl focus:border-spark-red outline-none transition-all font-bold text-[var(--text-primary)] text-sm shadow-inner"
              />
            </div>
          </div>

          {/* Directory Listings */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--bg-secondary)] rounded-3xl p-8 border border-[var(--border-color)] animate-pulse h-[400px] flex flex-col justify-between">
                  <div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4" />
                    <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-8" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
                  </div>
                  <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => {
                const category = getEventCategory(event);
                const isBrand = event.hostRole === 'Brand';
                const hasPackages = event.sponsorshipPackages && (Array.isArray(event.sponsorshipPackages) ? event.sponsorshipPackages.length > 0 : JSON.parse(event.sponsorshipPackages || '[]').length > 0);
                
                return (
                  <div 
                    key={event.id}
                    className="group bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-spark-red/30 flex flex-col justify-between h-full shadow-sm hover:-translate-y-1"
                  >
                    <div>
                      {/* Host Role Stripe */}
                      <div className={`h-2.5 w-full ${isBrand ? 'bg-blue-500' : 'bg-spark-red'}`} />
                      
                      <div className="p-8 pb-4">
                        
                        {/* Tags */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${isBrand ? 'bg-blue-500/10 text-blue-500' : 'bg-spark-red/10 text-spark-red'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isBrand ? 'bg-blue-500' : 'bg-spark-red'} inline-block animate-pulse`} /> 
                            {isBrand ? 'Brand Host' : 'Association'}
                          </span>
                          <span className="text-[9px] font-black text-green-600 bg-green-500/10 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            Verified
                          </span>
                        </div>

                        {/* Title & Host */}
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors line-clamp-2">
                          {event.name}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-wider mb-6">
                          by {event.hostName || 'Organizer'}
                        </p>
                        
                        {/* Event Attributes (5.4 Template) */}
                        <div className="space-y-3 mb-6 text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)] pb-4">
                          <div className="flex items-center gap-2.5">
                            <Calendar className="w-4 h-4 text-spark-red" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <MapPin className="w-4 h-4 text-spark-red" />
                            <span className="truncate">{event.location || event.university || 'Campus / Venue'}</span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-spark-red shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Audience Profile</p>
                              <p className="text-xs font-medium text-[var(--text-primary)]">{getAudienceProfile(category)}</p>
                            </div>
                          </div>
                          {event.expectedAttendees > 0 && (
                            <div className="flex items-center gap-2.5">
                              <Users className="w-4 h-4 text-spark-red" />
                              <span>Expected Attendance: {event.expectedAttendees.toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* What the organizer needs */}
                        <div className="mb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">Needs</p>
                          <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed line-clamp-2">
                            {event.activationNeeds || 'Sponsors, event workers, photographers and volunteer ushering teams.'}
                          </p>
                        </div>

                        {/* Packages Status */}
                        <div className="mb-4">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-md">
                            Packages: {hasPackages ? 'Bronze, Silver, Gold, Headline' : 'Custom Partnership'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 pt-0 border-t border-[var(--border-color)]/50 mt-4 bg-[var(--bg-secondary)]/10">
                      
                      {/* Sponsorship Target */}
                      <div className="pt-4 flex items-center justify-between mb-6">
                        <div>
                          <p className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Sponsorship Goal</p>
                          <p className="text-lg font-black text-[var(--text-primary)] mt-0.5">
                            ₦{(event.targetSponsorship || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons (5.4 CTA layout) */}
                      <div className="space-y-2">
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="w-full py-3.5 bg-spark-red hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          View Event
                        </button>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleSponsorClick(event)}
                            className="py-2.5 px-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-[9px] uppercase tracking-wider rounded-lg transition-all text-center"
                          >
                            Sponsor
                          </button>
                          <button
                            onClick={() => handleApplyClick(event)}
                            className="py-2.5 px-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-[9px] uppercase tracking-wider rounded-lg transition-all text-center"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleContactClick(event)}
                            className="py-2.5 px-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-[9px] uppercase tracking-wider rounded-lg transition-all text-center"
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State Content (5.6) */
            <div className="py-20 text-center bg-spark-red/5 rounded-[3rem] border border-dashed border-spark-red/20 max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-spark-red/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                <CalendarX className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3">No events are listed yet</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium max-w-xl mx-auto mb-8 leading-relaxed">
                Associations, communities and brands can list upcoming events to attract sponsors, creators, vendors and activation partners.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button 
                  onClick={handleListEventClick}
                  className="bg-spark-red hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all shadow-md"
                >
                  List First Event
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded-xl transition-all border border-[var(--border-color)]"
                >
                  Become a Verified Association
                </button>
                <button 
                  onClick={() => onNavigate('contact')}
                  className="text-spark-red font-black text-xs uppercase tracking-widest hover:underline px-4"
                >
                  Contact ABC-Rally
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Trust & Safety Warning Card (5.3) */}
      <section className="py-8 bg-[var(--bg-secondary)]/20 border-t border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 max-w-4xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-fancy font-black text-lg text-[var(--text-primary)] mb-1">Trust and Safety Note</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                Only publish event details that have organizer contact, date, location, sponsorship request and clear responsibility for delivery. ABC-Rally audits listings periodically to prevent unverified placements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Events Showcase / Gallery */}
      <section className="py-24 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-purple uppercase bg-spark-purple/5 border border-spark-purple/10 rounded-full">
              Past Collaborations
            </span>
            <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
              Previous Events <span className="text-spark-purple italic">Gallery</span>.
            </h2>
            <p className="max-w-xl mx-auto text-base text-[var(--text-secondary)] font-medium leading-relaxed">
              Explore successful campaigns, concert gatherings, hackathons, and brand sponsored activations hosted on ABC-Rally.
            </p>
          </div>

          {pastEventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--bg-primary)] rounded-3xl overflow-hidden border border-[var(--border-color)] animate-pulse h-80">
                  <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((pe) => (
                <div 
                  key={pe.id}
                  className="group bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:border-spark-purple/30 flex flex-col justify-between h-full shadow-sm hover:-translate-y-1"
                >
                  <div>
                    {pe.imageUrl && (
                      <div className="h-56 overflow-hidden relative bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                        <img 
                          src={pe.imageUrl} 
                          alt={pe.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-spark-purple bg-spark-purple/5 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {pe.date || 'Past Event'}
                        </span>
                        {pe.location && (
                          <span className="text-[10px] text-[var(--text-secondary)] font-bold truncate max-w-[150px]">
                            📍 {pe.location}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-purple transition-colors line-clamp-2">
                        {pe.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] text-xs font-medium leading-relaxed line-clamp-4">
                        {pe.description || 'Highlight from previous campus collaboration.'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-[var(--bg-primary)] rounded-[3rem] border border-dashed border-[var(--border-color)] max-w-xl mx-auto">
              <p className="text-[var(--text-secondary)] text-sm font-medium italic">No past events showcased in the gallery yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section (5.7) */}
      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Get Answers
            </span>
            <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6">
              Frequently Asked <span className="text-gradient-red italic">Questions</span>.
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[1.5rem] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm text-[var(--text-primary)] hover:text-spark-red transition-colors outline-none"
                  >
                    <span className="flex items-center gap-3">
                      <QuestionIcon className="w-5 h-5 text-spark-red shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-spark-red" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-[var(--text-secondary)]" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs font-semibold leading-relaxed text-[var(--text-secondary)] border-t border-[var(--border-color)]/40 bg-[var(--bg-primary)]/40 animate-in slide-in-from-top-1 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Event Details Page/Modal (5.5) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-[var(--bg-primary)] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in zoom-in-95 duration-300 flex flex-col my-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-spark-red p-8 md:p-10 text-white relative">
              <button 
                onClick={() => setSelectedEvent(null)} 
                className="absolute top-6 right-6 w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition-all border border-white/10"
              >
                <span className="text-xl font-bold">&times;</span>
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full">
                {getEventCategory(selectedEvent)}
              </span>
              <h2 className="text-2xl md:text-3xl font-fancy font-black mt-4 leading-tight mb-2">
                {selectedEvent.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-white/95 font-bold text-xs uppercase tracking-wider">
                <span>by {selectedEvent.hostName}</span>
                <span>•</span>
                <span>{selectedEvent.university}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] modal-content-scroll">
              
              {/* Event Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[var(--border-color)]">
                <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">{selectedEvent.date}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-1">Location</p>
                  <p className="text-sm font-black text-[var(--text-primary)] truncate">{selectedEvent.location || 'TBA'}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] col-span-2 md:col-span-1">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-1">Sponsorship Target</p>
                  <p className="text-sm font-black text-green-600">₦{(selectedEvent.targetSponsorship || 0).toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)] col-span-2 md:col-span-1">
                  <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-1">Expected Audience</p>
                  <p className="text-sm font-black text-[var(--text-primary)]">{selectedEvent.expectedAttendees || '500+'}</p>
                </div>
              </div>

              {/* About this Event (5.5) */}
              <div>
                <h4 className="font-fancy font-black text-sm text-spark-red uppercase tracking-wider mb-3">About this Event</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  {selectedEvent.description || 'This event is hosted to bring the campus community together for professional networking and talent showcases.'}
                </p>
              </div>

              {/* Sponsorship & Partnership Opportunities (5.5) */}
              <div>
                <h4 className="font-fancy font-black text-sm text-spark-red uppercase tracking-wider mb-3">Sponsorship and Partnership Opportunities</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold mb-4">
                  Brands can support this event through financial sponsorship, product sampling, exhibition booths, creator-led content, branded sessions, media support or community giveaways.
                </p>
                
                {/* Specific Packages details if list exist */}
                {selectedEvent.sponsorshipPackages && (
                  <div className="space-y-3">
                    {(() => {
                      let pkgs = [];
                      try {
                        pkgs = typeof selectedEvent.sponsorshipPackages === 'string' 
                          ? JSON.parse(selectedEvent.sponsorshipPackages)
                          : selectedEvent.sponsorshipPackages;
                      } catch (e) {}
                      
                      if (Array.isArray(pkgs) && pkgs.length > 0) {
                        return pkgs.map((pkg: any, idx: number) => (
                          <div key={idx} className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-black text-[var(--text-primary)]">{pkg.name}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">{pkg.entails}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-green-700 bg-green-500/10 px-3 py-1 rounded-lg">
                                ₦{Number(pkg.price).toLocaleString()}
                              </span>
                              <button 
                                onClick={() => {
                                  setSelectedEvent(null);
                                  handleSponsorClick(selectedEvent, pkg);
                                }}
                                className="px-3.5 py-1.5 bg-spark-red hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Sponsor
                              </button>
                            </div>
                          </div>
                        ));
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Creator & Vendor Opportunities (5.5) */}
              <div>
                <h4 className="font-fancy font-black text-sm text-spark-red uppercase tracking-wider mb-3">Creator and Vendor Opportunities</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold mb-4">
                  Creators, hosts, photographers, videographers, designers, field marketers, ushers and vendors can apply for event-related tasks where available.
                </p>
                {selectedEvent.activationNeeds && (
                  <div className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Organizer Specifications</p>
                    <p className="text-xs text-[var(--text-primary)] font-semibold">{selectedEvent.activationNeeds}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-8 border-t border-[var(--border-color)] flex flex-wrap gap-4 bg-[var(--bg-secondary)]/30">
              <button 
                onClick={() => {
                  setSelectedEvent(null);
                  handleSponsorClick(selectedEvent);
                }}
                className="flex-1 py-4 bg-spark-red hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
              >
                Sponsor Event
              </button>
              <button 
                onClick={() => {
                  setSelectedEvent(null);
                  handleApplyClick(selectedEvent);
                }}
                className="flex-1 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-[var(--border-color)]"
              >
                Apply as Creator/Vendor
              </button>
              <button 
                onClick={() => {
                  setSelectedEvent(null);
                  handleContactClick(selectedEvent);
                }}
                className="py-4 px-6 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-[var(--border-color)]"
              >
                Contact Organizer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Submission Modal Overlay */}
      <ProposalFormModal 
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        recipientId={proposalRecipientId}
        recipientName={proposalRecipientName}
        title={proposalTitle}
        isSponsorship={isSponsorship}
        selectedPackage={proposalPackage}
        onSubmit={handleProposalSubmit}
      />

    </div>
  );
};

export default EventsPage;
