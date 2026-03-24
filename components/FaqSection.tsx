import React, { useState } from 'react';
import { FAQ_ITEMS } from '../constants';
import { FaqItem } from '../types';

const AccordionItem: React.FC<{ item: FaqItem; isOpen: boolean; onClick: () => void; }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-6 px-4 hover:bg-red-50/30 transition-colors focus:outline-none rounded-xl"
            >
                <span className="text-lg font-bold text-spark-black">{item.question}</span>
                <span className={`flex-shrink-0 ml-4 p-1 rounded-full bg-red-50 text-spark-red transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 text-spark-gray leading-relaxed pt-0">
                    {item.answer}
                </div>
            </div>
        </div>
    );
};

const FaqSection: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-extrabold text-spark-black sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-spark-gray">
                        Everything you need to know about Campus Spark.
                    </p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-4">
                    {FAQ_ITEMS.map((item, index) => (
                        <AccordionItem
                            key={index}
                            item={item}
                            isOpen={openIndex === index}
                            onClick={() => handleClick(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FaqSection;