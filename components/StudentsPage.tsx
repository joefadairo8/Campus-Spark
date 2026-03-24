
import React from 'react';
import { CheckCircleIcon } from '../constants';

const StudentsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white min-h-screen font-sans text-spark-black text-center">
      {/* Hero Section */}
      <section className="relative bg-white pt-24 pb-24 overflow-hidden border-b border-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-spark-red uppercase bg-red-50 rounded-full">
              Unlock Your Potential
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
              Level Up Your <span className="text-spark-red">Campus Game</span>.
            </h1>
            <p className="text-xl md:text-2xl text-spark-gray mb-12 leading-relaxed">
              Whether you're a social butterfly at Unilag, a content creator in Abuja, or a club leader in Enugu, Campus Spark helps you earn money, build your resume, and fund your events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('contact')}
                className="bg-spark-red text-white font-bold py-5 px-12 rounded-xl text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Join the Network
              </button>
              <button 
                 onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white border-2 border-spark-red text-spark-red font-bold py-5 px-12 rounded-xl text-lg hover:bg-red-50 transition-all"
              >
                See Opportunities
              </button>
            </div>
        </div>
      </section>

      {/* Roles / Opportunities Grid */}
      <section id="roles" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl font-extrabold text-spark-black sm:text-5xl mb-6">
                    Choose Your Path
                </h2>
                <p className="text-xl text-spark-gray">
                    There are multiple ways to participate in the Campus Spark ecosystem. Pick what suits your style.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10 text-left">
                {/* Ambassador Card */}
                <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-red-50 transition-all duration-300 border border-gray-100 group">
                    <div className="h-4 bg-spark-red"></div>
                    <div className="p-10">
                        <h3 className="text-2xl font-bold text-spark-black mb-3 group-hover:text-spark-red transition-colors">Campus Ambassador</h3>
                        <p className="text-spark-gray mb-6">
                            Become the face of a brand on your campus.
                        </p>
                        <ul className="space-y-3 mb-10 text-spark-gray font-medium">
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Organize meetups & activations</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Distribute swag & merch</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Drive signups & downloads</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-white border-2 border-spark-red text-spark-red font-bold py-4 rounded-2xl hover:bg-spark-red hover:text-white transition-all shadow-sm">Apply Now</button>
                    </div>
                </div>

                 {/* Influencer Card */}
                 <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-red-50 transition-all duration-300 border border-gray-100 group">
                    <div className="h-4 bg-spark-black"></div>
                    <div className="p-10">
                        <h3 className="text-2xl font-bold text-spark-black mb-3 group-hover:text-spark-red transition-colors">Student Influencer</h3>
                        <p className="text-spark-gray mb-6">
                            Monetize your social media following.
                        </p>
                        <ul className="space-y-3 mb-10 text-spark-gray font-medium">
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Create sponsored content</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Share promo codes</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Drive buzz for launches</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-white border-2 border-spark-red text-spark-red font-bold py-4 rounded-2xl hover:bg-spark-red hover:text-white transition-all shadow-sm">Join as Creator</button>
                    </div>
                </div>

                 {/* Club Lead Card */}
                 <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-red-50 transition-all duration-300 border border-gray-100 group">
                    <div className="h-4 bg-spark-gray"></div>
                    <div className="p-10">
                        <h3 className="text-2xl font-bold text-spark-black mb-3 group-hover:text-spark-red transition-colors">Student Organization</h3>
                        <p className="text-spark-gray mb-6">
                            Get resources for your club or society.
                        </p>
                        <ul className="space-y-3 mb-10 text-spark-gray font-medium">
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Secure event sponsorships</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Find guest speakers</li>
                            <li className="flex items-center"><span className="w-2 h-2 bg-spark-red rounded-full mr-3"></span>Partner with other clubs</li>
                        </ul>
                         <button onClick={() => onNavigate('contact')} className="w-full block text-center bg-white border-2 border-spark-red text-spark-red font-bold py-4 rounded-2xl hover:bg-spark-red hover:text-white transition-all shadow-sm">Register Club</button>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default StudentsPage;
