import React, { useState, useEffect } from 'react';
import { apiClient } from '../firebase';

const LiveOpportunitiesSection: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          category: 'Campaign',
          title: g.title,
          brandName: g.brand || g.brandName,
          reward: g.reward || g.budget,
          location: g.location || g.university || 'Nationwide'
        }));

        const publishedEvents = events.filter((e: any) => 
          !e.status || (e.status.toLowerCase() !== 'closed' && e.status.toLowerCase() !== 'draft')
        ).map((e: any) => ({
          ...e,
          category: 'Event',
          title: e.name,
          brandName: e.hostName,
          reward: e.targetSponsorship,
          location: e.university || 'Campus'
        }));

        const all = [...openGigs, ...publishedEvents].sort((a: any, b: any) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );

        setOpportunities(all.slice(0, 4));
      } catch (err) {
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);
  return (
    <section className="py-24 bg-[var(--bg-primary)] border-y border-[var(--border-color)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-50">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-spark-red/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Real-time Marketplace
            </div>
            <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)]">
              Latest <span className="text-gradient-red italic">Opportunities</span>
            </h2>
          </div>
          <p className="text-[var(--text-secondary)] text-base font-medium">
            Active campaigns currently looking for partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--bg-primary)] rounded-3xl p-6 border border-[var(--border-color)] animate-pulse h-48">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            ))
          ) : opportunities.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-[var(--bg-primary)] rounded-3xl border border-dashed border-[var(--border-color)]">
                <p className="text-[var(--text-secondary)] font-medium">No active opportunities found. Check back later!</p>
            </div>
          ) : (
            opportunities.map((opp) => (
              <div 
                key={opp.id} 
                className="bg-[var(--bg-primary)] rounded-3xl p-6 border border-[var(--border-color)] hover:border-spark-red/30 transition-all group card-hover shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    opp.category === 'Campaign' ? 'bg-blue-500/10 text-blue-500' : 
                    opp.category === 'Sponsorship' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {opp.category || 'Campaign'}
                  </span>
                  <span className="text-spark-red font-black text-base">₦{(opp.reward || opp.budget || 0).toLocaleString()}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors line-clamp-2">{opp.title}</h3>
                <p className="text-[var(--text-secondary)] text-[10px] mb-4 font-medium uppercase tracking-widest truncate">by {opp.brandName || opp.company || 'Partner'}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">Hiring Now</span>
                  </div>
                  
                  {/* TEMP: Admin delete for orphans */}
                  {(!opp.hostId && !opp.brandId) && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this orphaned record?')) {
                          try {
                            const coll = opp.category === 'Campaign' ? 'gigs' : 'events';
                            await apiClient.delete(`${coll}/${opp.id}`);
                            setOpportunities(prev => prev.filter(item => item.id !== opp.id));
                            alert('Deleted successfully');
                          } catch (err) {
                            alert('Failed to delete. You might not have permission.');
                          }
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Orphaned Data"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-16 text-center">
          <button 
            onClick={() => onNavigate && onNavigate('careers')}
            className="text-[var(--text-primary)] font-black text-[10px] uppercase tracking-[0.3em] hover:text-spark-red transition-colors flex items-center justify-center mx-auto group border-b border-spark-red/20 pb-1"
          >
            Browse All Gigs
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default LiveOpportunitiesSection;
