
import React from 'react';
import { CheckCircleIcon, PARTNER_LOGOS } from '../constants';

const BrandsPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white min-h-screen font-sans text-spark-black text-center">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden pt-24 pb-24 border-b border-gray-50">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-wider text-spark-red uppercase bg-red-50 rounded-full">
              Growth for Brands
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8">
              Captivate the <span className="text-spark-red">Next Generation</span> of Nigerian Consumers.
            </h1>
            <p className="text-xl md:text-2xl text-spark-gray mb-12 leading-relaxed max-w-3xl mx-auto">
              Campus Spark is your direct line to millions of students across the nation. Build authentic connections, drive adoption, and gather deep insights through verified campus ambassadors and influencers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => onNavigate('contact')}
                className="bg-spark-red text-white font-bold py-5 px-12 rounded-xl text-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Get Started
              </button>
              <button 
                 onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white border-2 border-spark-red text-spark-red font-bold py-5 px-12 rounded-xl text-lg hover:bg-red-50 transition-all"
              >
                Explore Solutions
              </button>
            </div>
        </div>
      </section>

      {/* Market Context */}
      <section className="py-24 bg-white border-b border-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-extrabold text-spark-black mb-8">
                Why Nigerian Campuses?
            </h2>
            <p className="text-xl text-spark-gray mb-12 leading-relaxed">
                Nigeria has one of the youngest populations on the planet, with a rapidly growing student population that drives culture, technology adoption, and consumption trends.
            </p>
            <div className="grid sm:grid-cols-2 gap-8 text-left">
                {[
                    "Access a market of millions of higher education students.",
                    "Build brand loyalty at a pivotal life stage.",
                    "Leverage the high social influence of student leaders.",
                    "Bypass traditional ad-blockers with peer-to-peer marketing."
                ].map((item, i) => (
                    <div key={i} className="flex items-start bg-gray-50 p-6 rounded-2xl">
                        <div className="mt-1 flex-shrink-0">
                            <CheckCircleIcon className="w-6 h-6 text-spark-red" />
                        </div>
                        <span className="ml-4 text-spark-black font-bold text-lg">{item}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section id="solutions" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl font-extrabold text-spark-black sm:text-5xl mb-6">
                    Comprehensive Campus Solutions
                </h2>
                <p className="text-xl text-spark-gray">
                    We provide the toolkit you need to execute diverse marketing strategies, from digital buzz to on-ground activations.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                {[
                    {
                        title: "Student Ambassador Programs",
                        desc: "Recruit and manage long-term brand representatives to drive downloads, sign-ups, and ongoing awareness on their specific campuses.",
                        icon: "🎓"
                    },
                    {
                        title: "Event Sponsorships",
                        desc: "Find high-traffic student events (hackathons, cultural fests, sports) and secure sponsorship tiers that guarantee visibility.",
                        icon: "🎉"
                    },
                    {
                        title: "Influencer Marketing",
                        desc: "Collaborate with micro-influencers who have high engagement rates within their university bubbles for authentic product endorsements.",
                        icon: "📱"
                    },
                    {
                        title: "Product Sampling & Activations",
                        desc: "Coordinate on-ground teams to distribute samples, run demos, or manage pop-up stalls directly in high-footfall campus areas.",
                        icon: "📦"
                    },
                    {
                        title: "Market Research & Surveys",
                        desc: "Gain rapid feedback on new products or features by deploying surveys to a segmented audience of verified students.",
                        icon: "📊"
                    },
                    {
                        title: "Direct Recruitment",
                        desc: "Spot top talent early. Connect with leaders of coding clubs, business societies, and debate teams for internships and grad roles.",
                        icon: "🤝"
                    }
                ].map((card, i) => (
                    <div key={i} className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-red-50 transition-all duration-300 border border-gray-100 group">
                        <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                        <h3 className="text-xl font-bold text-spark-black mb-4 group-hover:text-spark-red transition-colors">{card.title}</h3>
                        <p className="text-spark-gray leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>
    </div>
  );
};

export default BrandsPage;
