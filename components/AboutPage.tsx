
import React from 'react';
import { SparkIcon } from '../constants';

const AboutPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white min-h-screen text-center">
      {/* Hero */}
      <section className="bg-spark-black text-white py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-spark-red/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter">
            We are the <span className="text-spark-red">Heartbeat</span> of Campus Life.
          </h1>
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-gray-400 font-medium leading-relaxed">
            Campus Spark was founded to solve a simple problem: Nigerian students have immense influence, but no efficient way to connect with the brands they love. We built the bridge.
          </p>
        </div>
      </section>

      {/* Mission/Vision */}
      <section className="py-24 bg-white border-b border-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-black text-spark-black mb-8">Our Mission</h2>
          <p className="text-2xl text-spark-gray mb-16 leading-relaxed">
            To empower 10 million African students by creating a digital ecosystem where their creativity, influence, and leadership are recognized and rewarded by global and local market leaders.
          </p>
          <div className="grid md:grid-cols-2 gap-12 text-left">
            <div className="bg-gray-50 p-10 rounded-[2.5rem]">
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <SparkIcon className="w-8 h-8 text-spark-red" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Authenticity First</h3>
                <p className="text-spark-gray text-lg">We believe in real connections, not just metrics. Every spark on campus should feel genuine.</p>
            </div>
            <div className="bg-gray-50 p-10 rounded-[2.5rem]">
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <SparkIcon className="w-8 h-8 text-spark-red" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Growth Driven</h3>
                <p className="text-spark-gray text-lg">We help students build resumes, not just earn pocket money. Our platform is a career jumpstart.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
