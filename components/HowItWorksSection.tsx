import React from 'react';
import { HOW_IT_WORKS_CONTENT } from '../constants';
import { HowItWorksStep } from '../types';
import { UserType } from '../types';

const HowItWorksSection: React.FC = () => {
  const brandSteps = HOW_IT_WORKS_CONTENT[UserType.Brands];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-spark-black sm:text-4xl">
            Get Started in 4 Simple Steps
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-spark-gray">
            Launch your first campus campaign in minutes. Here’s how easy it is for brands to get started.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            {brandSteps.map((step: HowItWorksStep, index: number) => (
              <div key={index} className="text-center relative">
                <div className="flex items-center justify-center bg-red-50 text-spark-red w-20 h-20 rounded-2xl mx-auto mb-6 font-extrabold text-3xl shadow-sm border border-red-100">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-spark-black mb-3">{step.title}</h3>
                <p className="text-spark-gray leading-relaxed text-sm px-4">{step.description}</p>
                {index < 3 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+4rem)] w-[calc(100%-8rem)] border-t-2 border-dashed border-red-100"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;