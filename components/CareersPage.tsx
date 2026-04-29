
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon } from '../constants';
import { apiClient } from '../firebase';

const CareersPage: React.FC<{ onNavigate: (page: string) => void, user?: any }> = ({ onNavigate, user }) => {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isInfluencer = user?.role === 'Ambassador/Influencer' || user?.role === 'Student/Professional Influencer';

  useEffect(() => {
    const fetchGigs = async () => {
      if (!isInfluencer) {
          setLoading(false);
          return;
      }
      try {
        const res = await apiClient.get('gigs?status=open');
        setGigs(res.data);
      } catch (err) {
        console.error('Failed to fetch gigs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, [isInfluencer]);

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
              { title: "Secure Payments", desc: "No more chasing brands for payment. We hold funds in escrow and pay out immediately upon task completion.", icon: "💰" },
              { title: "Portfolio Building", desc: "Every campaign you complete adds a verified credential to your digital CV, recognized by top employers.", icon: "📈" },
              { title: "Direct Access", desc: "Skip the middlemen. Get direct access to marketing managers at the biggest brands in Nigeria.", icon: "🔑" }
            ].map((benefit, i) => (
              <div key={i} className="p-8 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] card-hover shadow-sm">
                <div className="text-4xl mb-6">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">{benefit.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Gigs List */}
      <section id="open-gigs" className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-4">
                Current <span className="text-gradient-red italic">Opportunities</span>
              </h2>
              <p className="text-base text-[var(--text-secondary)] font-medium">Top brands are scouting for talent. Pick a path and contact us to apply.</p>
            </div>
            <div className="flex gap-2 bg-spark-red/5 p-1 rounded-2xl border border-spark-red/10">
                <button className="px-6 py-2 bg-spark-red text-white text-[10px] font-black uppercase tracking-widest rounded-xl">All</button>
                <button className="px-6 py-2 bg-spark-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Gigs</button>
                <button className="px-6 py-2 bg-spark-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Events</button>
            </div>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="py-20 text-center animate-pulse">
                <div className="w-12 h-12 bg-spark-red/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-spark-red border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="font-black text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Igniting opportunities...</p>
              </div>
            ) : isInfluencer ? (
              gigs.length > 0 ? (
                gigs.map((gig) => (
                  <div key={gig.id} className="group p-8 border border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-primary)] hover:border-spark-red/30 transition-all flex flex-col lg:flex-row items-center gap-10 cursor-pointer card-hover shadow-sm shadow-black/5" onClick={() => onNavigate('contact')}>
                    <div className="w-20 h-20 bg-spark-red/5 rounded-[1.5rem] flex items-center justify-center p-4 border border-spark-red/10 flex-shrink-0 group-hover:scale-110 transition-transform text-xl font-black text-spark-red">
                      {(gig.brand || 'S').charAt(0)}
                    </div>

                    <div className="flex-1 text-center lg:text-left">
                      <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-3">
                        <span className="px-3 py-1 bg-spark-red/10 text-spark-red text-[9px] font-black uppercase tracking-widest rounded-full">{gig.brand || 'Brand Opportunity'}</span>
                        <span className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[9px] font-black uppercase tracking-widest rounded-full">{gig.location || 'Nationwide'}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-spark-red transition-colors">{gig.title}</h3>
                      <p className="text-[var(--text-secondary)] text-sm max-w-xl font-medium">{gig.description}</p>
                    </div>

                    <div className="flex flex-col items-center lg:items-end gap-4 flex-shrink-0 w-full lg:w-auto">
                      <div className="text-center lg:text-right">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Benefit/Stipend</p>
                        <p className="text-xl font-black text-[var(--text-primary)]">
                          {typeof gig.reward === 'number' ? `₦${gig.reward.toLocaleString()}` : gig.reward || '₦0'}
                        </p>
                      </div>
                      <button className="w-full lg:w-auto bg-gradient-red text-white font-bold py-3 px-8 rounded-xl text-sm group-hover:scale-105 transition-all">Apply Now</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-spark-red/5 rounded-[3rem] border border-dashed border-spark-red/10">
                  <div className="text-5xl mb-6">🚀</div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">New Gigs Landing Soon</h3>
                  <p className="text-[var(--text-secondary)] text-sm font-medium">We're currently finalizing new campaigns. Check back shortly!</p>
                </div>
              )
            ) : (
              // Unauthenticated or Non-Influencer view: Show Featured Brands
              <div className="grid md:grid-cols-2 gap-8">
                {mockBrands.map((brand, i) => (
                    <div key={i} className="p-8 border border-[var(--border-color)] rounded-[3rem] bg-[var(--bg-primary)] card-hover flex items-start gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${brand.color}`}>
                            {brand.logo}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{brand.name}</h3>
                            <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed mb-6">{brand.desc}</p>
                            <button 
                                onClick={() => onNavigate('login')}
                                className="text-xs font-black uppercase tracking-widest text-spark-red hover:underline"
                            >
                                Login to View Gigs →
                            </button>
                        </div>
                    </div>
                ))}
                <div className="md:col-span-2 p-10 bg-gradient-red rounded-[3rem] text-white text-center shadow-xl shadow-red-100">
                    <h3 className="text-2xl font-black mb-4">Are you a Campus Influencer?</h3>
                    <p className="font-medium mb-8 opacity-90">Log in as an ambassador to see real-time budgets and apply for live brand campaigns.</p>
                    <button onClick={() => onNavigate('login')} className="px-10 py-4 bg-white text-spark-red font-black rounded-2xl hover:bg-red-50 transition-all">Get Started</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
