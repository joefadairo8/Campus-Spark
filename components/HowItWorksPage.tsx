
import React, { useState } from 'react';
import { HOW_IT_WORKS_CONTENT } from '../constants';
import { UserType } from '../types';

const HowItWorksPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<UserType>(UserType.Brands);

    const subtitles: Record<UserType, string> = {
        [UserType.Brands]: "Maximize your reach across Nigerian universities with targeted campaigns.",
        [UserType.Clubs]: "Secure sponsorships and funding to take your student organization's events to the next level.",
        [UserType.Ambassadors]: "Turn your influence into income by collaborating with top brands on your campus.",
    };

    return (
        <div className="bg-[var(--bg-primary)] min-h-screen">
            <div className="py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-b border-[var(--border-color)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-50">
                  <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-spark-red/10 rounded-full blur-[100px]"></div>
                </div>
                <h1 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter mb-6 text-[var(--text-primary)]">
                    How <span className="text-gradient-red italic">Campus Spark</span> Works
                </h1>
                <p className="max-w-2xl mx-auto text-base md:text-lg text-[var(--text-secondary)] font-medium">
                    Simple, transparent, and built for Nigerian students and brands.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-4xl font-fancy font-black text-[var(--text-primary)] mb-6">{activeTab}</h2>
                    <p className="text-base text-[var(--text-secondary)] mb-12 font-medium">{subtitles[activeTab]}</p>
                </div>
                
                <div className="space-y-12">
                    {HOW_IT_WORKS_CONTENT[activeTab].map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-spark-red/10 text-spark-red font-black text-2xl mb-8 group-hover:bg-spark-red group-hover:text-white transition-colors duration-300">
                                {index + 1}
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{step.title}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed text-sm max-w-xl font-medium">{step.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <button
                        onClick={() => onNavigate('contact')}
                        className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-base font-bold rounded-2xl text-white bg-gradient-red hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-95"
                    >
                        Get Started as {activeTab === UserType.Brands ? 'a Brand' : activeTab === UserType.Clubs ? 'an Organization' : 'an Ambassador'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksPage;
