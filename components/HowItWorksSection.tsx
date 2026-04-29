import React, { useState } from 'react';
import { HOW_IT_WORKS_CONTENT } from '../constants';
import { UserType } from '../types';

const HowItWorksSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserType>(UserType.Brands);

  return (
    <section id="how-it-works" className="py-24 bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">
            How it <span className="text-gradient-red italic">Works</span>
          </h2>
          
          <div className="flex items-center justify-center mt-10">
            <div className="inline-flex p-1 bg-spark-red/5 rounded-2xl border border-spark-red/10">
              {[UserType.Brands, UserType.Ambassadors, UserType.Clubs].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === type ? 'bg-spark-red text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-spark-red'
                  }`}
                >
                  {type === UserType.Ambassadors ? 'Influencers' : type === UserType.Clubs ? 'Organizers' : 'Brands'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {HOW_IT_WORKS_CONTENT[activeTab].map((step, index) => (
              <div key={index} className="relative group">
                <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] h-full transition-all duration-500 hover:shadow-2xl hover:shadow-spark-red/5 card-hover">
                  <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red font-black text-base mb-6 border border-spark-red/10">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{step.title}</h3>
                  <p className="text-[var(--text-secondary)] text-xs leading-relaxed font-medium">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;