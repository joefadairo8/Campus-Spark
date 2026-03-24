import React from 'react';

const CtaSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="bg-white py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-red-50/50 -z-10"></div>
      <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-white p-12 md:p-20 rounded-[3rem] shadow-2xl shadow-red-100 border border-red-100">
            <h2 className="text-3xl font-extrabold text-spark-black sm:text-5xl leading-tight">
              Ready to <span className="text-spark-red underline decoration-red-200 underline-offset-8">Spark</span> a Connection?
            </h2>
            <p className="mt-8 text-xl leading-relaxed text-spark-gray max-w-2xl mx-auto">
              Join Campus Spark today and start building authentic relationships with the next generation of Nigerian leaders, creators, and innovators.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
               <button
                onClick={() => onNavigate('contact')}
                className="inline-block bg-spark-red text-white font-bold py-5 px-10 rounded-2xl text-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Start Your Campaign
              </button>
              <button
                onClick={() => onNavigate('for-brands')}
                className="inline-block bg-white border-2 border-spark-red text-spark-red font-bold py-5 px-10 rounded-2xl text-xl hover:bg-red-50 transition-all"
              >
                Talk to an Expert
              </button>
            </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;