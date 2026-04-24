
import React from 'react';
import { FEATURES } from '../constants';
import { Feature } from '../types';

const FeatureBlock: React.FC<{ feature: Feature }> = ({ feature }) => (
  <div className="max-w-4xl mx-auto text-center py-16 border-b border-gray-50 last:border-0 grid gap-10">
    <div className="space-y-6">
      <div className="inline-flex items-center justify-center">
        <span className="bg-spark-red/10 p-5 rounded-3xl">
          {feature.icon}
        </span>
      </div>
      <h3 className="text-3xl md:text-4xl font-black text-spark-black">{feature.title}</h3>
      <p className="text-xl text-spark-gray leading-relaxed max-w-2xl mx-auto">{feature.description}</p>
      <div className="flex flex-wrap justify-center gap-4 text-sm font-bold text-spark-red uppercase tracking-widest pt-2">
        {feature.bullets.map((bullet, index) => (
          <span key={index} className="px-5 py-2.5 bg-red-50 rounded-xl">
            {bullet}
          </span>
        ))}
      </div>
    </div>


  </div>
);


const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 sm:py-28 bg-spark-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-spark-black sm:text-5xl">
            Everything You Need to Win on Campus
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-spark-gray">
            Our powerful, easy-to-use tools are designed for impactful campus marketing.
          </p>
        </div>
        <div className="space-y-12">
          {FEATURES.map((feature) => (
            <FeatureBlock key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
