
import React from 'react';
import { CheckCircleIcon } from '../constants';

const StudentsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans text-[var(--text-primary)] text-center">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-24 border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-spark-red/10 rounded-full blur-[120px]"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-block px-4 py-1.5 mb-6 text-[10px] font-black tracking-[0.2em] text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
              Unlock Your Potential
            </div>
            <h1 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter leading-[1.1] mb-8 text-[var(--text-primary)]">
              Level Up Your <span className="text-gradient-red italic">Campus Game</span>.
            </h1>
            <p className="text-base md:text-lg text-[var(--text-secondary)] mb-12 leading-relaxed font-medium">
              Whether you're a creator, an organizer, or a leader, Campus Spark helps you earn, build your resume, and fund your vision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('contact')}
                className="bg-gradient-red text-white font-bold py-4 px-10 rounded-2xl text-base hover:shadow-xl hover:shadow-spark-red/20 transition-all shadow-lg active:scale-95"
              >
                Join the Network
              </button>
              <button 
                 onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-spark-red text-spark-red font-bold py-4 px-10 rounded-2xl text-base hover:bg-spark-red/5 transition-all active:scale-95"
              >
                See Opportunities
              </button>
            </div>
        </div>
      </section>

      {/* Roles / Opportunities Grid */}
      <section id="roles" className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
                    Choose Your <span className="text-gradient-red italic">Path</span>
                </h2>
                <p className="text-base text-[var(--text-secondary)] font-medium">
                    There are multiple ways to participate in the Campus Spark ecosystem. Pick what suits your style.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
                {/* Ambassador Card */}
                <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                    <div className="h-2 bg-spark-red"></div>
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Campus Ambassador</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">
                            Become the face of a brand on your campus.
                        </p>
                        <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Organize meetups & activations</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Distribute swag & merch</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Drive signups & downloads</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-spark-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all text-sm">Apply Now</button>
                    </div>
                </div>

                 {/* Influencer Card */}
                 <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                    <div className="h-2 bg-[var(--text-primary)] opacity-20"></div>
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Student Influencer</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">
                            Monetize your social media following.
                        </p>
                        <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Create sponsored content</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Share promo codes</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Drive buzz for launches</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-spark-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all text-sm">Join as Creator</button>
                    </div>
                </div>

                 {/* Club Lead Card */}
                 <div className="bg-[var(--bg-primary)] rounded-[2rem] overflow-hidden border border-[var(--border-color)] group card-hover shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5">
                    <div className="h-2 bg-[var(--text-secondary)] opacity-10"></div>
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 group-hover:text-spark-red transition-colors">Student Organization</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-6 font-medium">
                            Get resources for your club or society.
                        </p>
                        <ul className="space-y-3 mb-10 text-[var(--text-secondary)] font-semibold text-xs">
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Secure event sponsorships</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Find guest speakers</li>
                            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-spark-red rounded-full mr-3"></span>Partner with other clubs</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-spark-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-all text-sm">Register Club</button>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default StudentsPage;
