
import React, { useState } from 'react';
import { HOW_IT_WORKS_CONTENT } from '../constants';
import { UserType } from '../types';

const HowItWorksPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<UserType>(UserType.Brands);

    const subtitles: Record<UserType, string> = {
        [UserType.Brands]: "Maximize your reach across Nigerian universities with targeted, data-driven campaigns.",
        [UserType.Clubs]: "Secure sponsorships and funding to take your student organization's events to the next level.",
        [UserType.Ambassadors]: "Turn your influence into income by collaborating with top brands on your campus.",
    };

    return (
        <div className="bg-white min-h-screen">
            <div className="bg-red-50 py-24 px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 text-spark-black">
                    How <span className="text-spark-red">Campus Spark</span> Works
                </h1>
                <p className="max-w-2xl mx-auto text-xl text-spark-gray">
                    Simple, transparent, and built for Nigerian students and brands.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="bg-white rounded-2xl shadow-2xl shadow-red-100 p-3 flex flex-col sm:flex-row justify-between gap-3 border border-red-50">
                    {Object.values(UserType).map((type) => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`flex-1 py-5 px-6 rounded-xl text-center font-bold text-lg transition-all ${
                                activeTab === type
                                    ? 'bg-spark-red text-white shadow-lg scale-105'
                                    : 'text-spark-gray hover:bg-red-50 hover:text-spark-red'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-spark-black mb-6">{activeTab}</h2>
                    <p className="text-xl text-spark-gray mb-12">{subtitles[activeTab]}</p>
                </div>
                
                <div className="space-y-16">
                    {HOW_IT_WORKS_CONTENT[activeTab].map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="flex items-center justify-center w-20 h-20 rounded-3xl bg-red-50 text-spark-red font-black text-3xl mb-8 group-hover:bg-spark-red group-hover:text-white transition-colors duration-300">
                                {index + 1}
                            </div>
                            <h3 className="text-2xl font-bold text-spark-black mb-4">{step.title}</h3>
                            <p className="text-spark-gray leading-relaxed text-lg max-w-xl">{step.description}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-24 text-center">
                    <button
                        onClick={() => onNavigate('contact')}
                        className="inline-flex items-center justify-center px-10 py-5 border border-transparent text-xl font-bold rounded-2xl text-white bg-spark-red hover:bg-red-700 transition-all shadow-xl shadow-red-200"
                    >
                        Get Started as {activeTab === UserType.Brands ? 'a Brand' : activeTab === UserType.Clubs ? 'an Organization' : 'an Ambassador'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksPage;
