
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '../constants';
import { apiClient } from '../firebase';

const CareersPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await apiClient.get('gigs');
        setGigs(res.data);
      } catch (err) {
        console.error('Failed to fetch gigs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 overflow-hidden bg-spark-black text-white">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-spark-red/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-spark-red uppercase bg-white/10 rounded-full backdrop-blur-md">
              Launch Your Career Today
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Gigs from the <span className="text-spark-red">Brands</span> You Love.</h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
              Don't wait until graduation. Join elite ambassador programs, secure sponsorships for your club, or get hired for major campus tours.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('open-gigs')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-spark-red text-white font-black py-5 px-12 rounded-2xl text-xl shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
              >
                Browse Openings
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="bg-white/10 border border-white/20 text-white font-black py-5 px-12 rounded-2xl text-xl hover:bg-white/20 transition-all backdrop-blur-md"
              >
                Inquire About Joining
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Gigs List */}
      <section id="open-gigs" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black text-spark-black mb-4">Current Opportunities</h2>
              <p className="text-xl text-spark-gray">Top brands are currently scouting for talent in these areas. Pick a path and contact us to apply.</p>
            </div>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-16 h-16 bg-red-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-spark-red border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-bold text-spark-gray">Igniting opportunities...</p>
              </div>
            ) : gigs.length > 0 ? (
              gigs.map((gig) => (
                <div key={gig.id} className="group p-8 border-2 border-gray-50 rounded-[2.5rem] hover:border-spark-red/20 hover:bg-red-50/10 transition-all flex flex-col lg:flex-row items-center gap-10 cursor-pointer" onClick={() => onNavigate('contact')}>
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center p-4 border border-gray-50 flex-shrink-0 group-hover:scale-110 transition-transform text-2xl font-black text-spark-red">
                    {gig.brand ? gig.brand.charAt(0) : 'S'}
                  </div>

                  <div className="flex-1 text-center lg:text-left">
                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-3">
                      <span className="px-3 py-1 bg-red-50 text-spark-red text-[10px] font-black uppercase tracking-widest rounded-full">{gig.type}</span>
                      <span className="px-3 py-1 bg-gray-100 text-spark-gray text-[10px] font-black uppercase tracking-widest rounded-full">{gig.location}</span>
                    </div>
                    <h3 className="text-3xl font-black text-spark-black mb-2 group-hover:text-spark-red transition-colors">{gig.title}</h3>
                    <p className="text-spark-gray text-lg max-w-xl">{gig.description}</p>
                  </div>

                  <div className="flex flex-col items-center lg:items-end gap-4 flex-shrink-0 w-full lg:w-auto">
                    <div className="text-center lg:text-right">
                      <p className="text-sm font-black text-spark-gray uppercase tracking-widest mb-1">Benefit/Stipend</p>
                      <p className="text-2xl font-black text-spark-black">{gig.reward}</p>
                    </div>
                    <button className="w-full lg:w-auto bg-spark-red text-white font-black py-4 px-10 rounded-2xl text-lg group-hover:scale-105 transition-all shadow-xl shadow-red-100">Contact to Apply</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                <div className="text-5xl mb-6">🚀</div>
                <h3 className="text-2xl font-black text-spark-black mb-2">New Gigs Landing Soon</h3>
                <p className="text-spark-gray">We're currently finalizing new campaigns. Check back shortly!</p>
                <button
                  onClick={() => onNavigate('contact')}
                  className="mt-8 text-spark-red font-black uppercase tracking-widest hover:underline"
                >
                  Get Notified via Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
