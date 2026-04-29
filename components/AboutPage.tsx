
import React, { useState } from 'react';
import { SparkIcon, HOW_IT_WORKS_CONTENT } from '../constants';
import { UserType } from '../types';

const AboutPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<UserType>(UserType.Brands);

  const subtitles: Record<UserType, string> = {
    [UserType.Brands]: "Maximize your reach across Nigerian universities with targeted campaigns.",
    [UserType.Clubs]: "Secure sponsorships and funding to take your student organization's events to the next level.",
    [UserType.Ambassadors]: "Turn your influence into income by collaborating with top brands on your campus.",
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen text-center">
      {/* Hero */}
      <section className="py-24 relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-3xl md:text-5xl font-fancy font-black mb-8 tracking-tighter text-[var(--text-primary)]">
            We are the <span className="text-gradient-red italic">Heartbeat</span> of Campus Life.
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
            Campus Spark was founded to solve a simple problem: Nigerian students have immense influence, but no efficient way to connect with the brands they love. We built the bridge.
          </p>
        </div>
      </section>

      {/* Mission/Vision */}
      <section className="py-24 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-8">Our <span className="text-gradient-red italic">Mission</span></h2>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-16 leading-relaxed font-medium">
            To empower 10 million African students by creating a digital ecosystem where their creativity, influence, and leadership are recognized and rewarded by market leaders.
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-10 rounded-[2.5rem] card-hover shadow-sm">
                <div className="bg-spark-red/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                    <SparkIcon className="w-6 h-6 text-spark-red" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">Authenticity First</h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">We believe in real connections, not just metrics. Every spark on campus should feel genuine and impactful.</p>
            </div>
            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-10 rounded-[2.5rem] card-hover shadow-sm">
                <div className="bg-spark-red/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                    <SparkIcon className="w-6 h-6 text-spark-red" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">Growth Driven</h3>
                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">We help students build professional resumes, not just earn. Our platform is a career jumpstart for the future.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter mb-12 text-[var(--text-primary)]">
                How <span className="text-gradient-red italic">Spark</span> Works
            </h2>
            
            <div className="max-w-3xl mx-auto mb-16">
                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-xl p-2 flex flex-col sm:flex-row justify-between gap-2 border border-[var(--border-color)]">
                    {Object.values(UserType).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`flex-1 py-4 px-6 rounded-2xl text-center font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === type
                                    ? 'bg-spark-red text-white shadow-lg'
                                    : 'text-[var(--text-secondary)] hover:bg-spark-red/5 hover:text-spark-red'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h3 className="text-2xl md:text-3xl font-fancy font-black text-[var(--text-primary)] mb-4">{activeTab}</h3>
                    <p className="text-base text-[var(--text-secondary)] mb-12 font-medium">{subtitles[activeTab]}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-12 text-left">
                    {HOW_IT_WORKS_CONTENT[activeTab].map((step, index) => (
                        <div key={index} className="flex gap-6 group">
                            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-spark-red/10 text-spark-red font-black text-xl group-hover:bg-spark-red group-hover:text-white transition-colors duration-300">
                                {index + 1}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">{step.title}</h4>
                                <p className="text-[var(--text-secondary)] leading-relaxed text-sm font-medium">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24">
                    <button
                        onClick={() => onNavigate('contact')}
                        className="inline-flex items-center justify-center px-12 py-5 border border-transparent text-base font-bold rounded-2xl text-white bg-gradient-red hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
                    >
                        Start Your Journey
                    </button>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
