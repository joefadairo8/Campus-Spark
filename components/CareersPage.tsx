
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '../constants';
import { apiClient } from '../firebase';
import { Wallet, TrendingUp, Key, Search, Rocket, ChevronRight } from 'lucide-react';

const CareersPage: React.FC<{ onNavigate: (page: string) => void, user?: any }> = ({ onNavigate, user }) => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isInfluencer = user?.role === 'Ambassador/Influencer' || user?.role === 'Student/Professional Influencer';

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        let gigs: any[] = [];
        let events: any[] = [];

        try {
          const res = await apiClient.get('gigs');
          gigs = res.data || [];
        } catch (e) {
          console.error('Error fetching gigs:', e);
        }

        try {
          const res = await apiClient.get('events');
          events = res.data || [];
        } catch (e) {
          console.error('Error fetching events:', e);
        }

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

        const publishedEvents = events.filter((e: any) => 
          !e.status || (e.status.toLowerCase() !== 'closed' && e.status.toLowerCase() !== 'draft')
        ).map((e: any) => ({
          ...e,
          type: 'Event',
          displayTitle: e.name,
          displayBrand: e.hostName,
          displayReward: e.targetSponsorship,
          displayLocation: e.university || 'Campus'
        }));

        const all = [...openGigs, ...publishedEvents].sort((a: any, b: any) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );

        setOpportunities(all);
      } catch (err) {
        console.error('Failed to fetch opportunities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const mockBrands = [
    { name: 'MTN Nigeria', logo: '🟡', desc: 'Telecommunications giant looking for campus ambassadors.', color: 'bg-yellow-100 text-yellow-700' },
    { name: 'PiggyVest', logo: '🔵', desc: 'Fintech leader driving financial literacy among students.', color: 'bg-blue-100 text-blue-700' },
    { name: 'Kuda Bank', logo: '🟣', desc: 'The bank of the free is scouting for creative content creators.', color: 'bg-purple-100 text-purple-700' },
    { name: 'Bolt Nigeria', logo: '🟢', desc: 'Ride-sharing partner seeking campus mobility leads.', color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Launch Your Career Today
            </div>
            <h1 className="text-3xl md:text-5xl font-fancy font-black mb-8 leading-tight tracking-tighter text-[var(--text-primary)]">
                Gigs from the <span className="text-gradient-red italic">Brands</span> You Love.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-10 leading-relaxed max-w-xl font-medium">
              Don't wait until graduation. Join elite ambassador programs, secure sponsorships, or get hired for major campus tours.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('open-gigs')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
              >
                Browse Openings
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-spark-black text-white font-bold py-4 px-10 rounded-2xl text-base hover:bg-gray-800 transition-all active:scale-95"
              >
                Inquire Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">Why Build via <span className="text-gradient-red italic">Spark</span>?</h2>
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
      <section id="open-gigs" className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
                Current <span className="text-gradient-red italic">Opportunities</span>
              </h2>
              <p className="text-base text-[var(--text-secondary)] font-medium">Top brands and organizations are scouting for talent. Pick a path and contact us to apply.</p>
            </div>
          </div>

          <div className="grid gap-6">
            {opportunities.length > 0 ? (
                <div className="grid gap-6">
                  {opportunities.map((opp) => (
                    <div 
                      key={opp.id} 
                      className="group p-8 border border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-primary)] hover:border-spark-red/30 transition-all flex flex-col lg:flex-row items-center gap-10 cursor-pointer card-hover shadow-sm shadow-black/5" 
                      onClick={() => onNavigate(user ? (opp.type === 'Campaign' ? 'student-dashboard' : 'org-dashboard') : 'login')}
                    >
                      <div className="w-20 h-20 bg-spark-red/5 rounded-[1.5rem] flex items-center justify-center p-4 border border-spark-red/10 flex-shrink-0 group-hover:scale-110 transition-transform text-xl font-black text-spark-red">
                        {(opp.displayBrand || 'S').charAt(0)}
                      </div>

                      <div className="flex-1 text-center lg:text-left">
                        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-3">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${
                            opp.type === 'Campaign' ? 'bg-spark-red/10 text-spark-red' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {opp.type}
                          </span>
                          <span className="px-3 py-1 bg-spark-black text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                            {opp.displayBrand || 'Partner'}
                          </span>
                          <span className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-full">
                            {opp.displayLocation}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors">{opp.displayTitle}</h3>
                        <p className="text-[var(--text-secondary)] text-sm max-w-xl font-medium line-clamp-2">{opp.description || opp.brief || 'No description provided.'}</p>
                      </div>

                      <div className="flex flex-col items-center lg:items-end gap-4 flex-shrink-0 w-full lg:w-auto">
                        <div className="text-center lg:text-right">
                          <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">
                            {opp.type === 'Campaign' ? 'Benefit/Stipend' : 'Target Sponsorship'}
                          </p>
                          <p className="text-xl font-black text-[var(--text-primary)]">
                            ₦{(opp.displayReward || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                          <button className="flex-1 lg:flex-none bg-gradient-red text-white font-bold py-3 px-8 rounded-xl text-sm group-hover:scale-105 transition-all flex items-center justify-center gap-2">
                            {user ? 'View details' : 'Login to Apply'}
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
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-spark-red/5 rounded-[3rem] border border-dashed border-spark-red/10">
                  <div className="w-20 h-20 bg-spark-red/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                    <Rocket className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">New Opportunities Landing Soon</h3>
                  <p className="text-[var(--text-secondary)] text-sm font-medium">We're currently finalizing new campaigns and events. Check back shortly!</p>
                </div>
              )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
