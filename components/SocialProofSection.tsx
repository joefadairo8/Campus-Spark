
import React from 'react';
import { TESTIMONIALS } from '../constants';
import { Testimonial } from '../types';

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-lg flex flex-col h-full border border-gray-50">
        <p className="text-xl text-spark-gray mb-8 flex-grow leading-relaxed italic">"{testimonial.quote}"</p>
        <div className="pt-8 border-t border-gray-50">
            <p className="font-black text-spark-black text-lg">{testimonial.name}</p>
            <p className="text-sm text-spark-red font-black uppercase tracking-widest mt-1">{testimonial.title}</p>
        </div>
    </div>
);

const SocialProofSection: React.FC = () => {
    return (
        <section className="py-24 sm:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black text-spark-black sm:text-5xl">
                        Trusted by Ambitious Brands & Student Leaders
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-spark-gray">
                        Join the growing community of innovators shaping the future of campus engagement.
                    </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {TESTIMONIALS.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
