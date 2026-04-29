import React, { useState } from 'react';
import { FAQ_ITEMS } from '../constants';
import { FaqItem } from '../types';

const AccordionItem: React.FC<{ item: FaqItem; isOpen: boolean; onClick: () => void; }> = ({ item, isOpen, onClick }) => {
    return (
        <div className="border-b border-[var(--border-color)] last:border-0">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left py-6 px-4 hover:bg-spark-red/5 transition-colors focus:outline-none rounded-2xl"
            >
                <span className={`text-base font-bold transition-colors ${isOpen ? 'text-spark-red' : 'text-[var(--text-primary)]'}`}>{item.question}</span>
                <span className={`flex-shrink-0 ml-4 p-2 rounded-xl transition-all duration-500 ${isOpen ? 'rotate-180 bg-spark-red/10 text-spark-red' : 'bg-spark-red/5 text-[var(--text-secondary)]'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 text-[var(--text-secondary)] leading-relaxed pt-0 text-sm font-medium">
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
        <section id="faq" className="py-24 bg-[var(--bg-primary)]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-4">
                        Got <span className="text-gradient-red italic">Questions?</span>
                    </h2>
                    <p className="max-w-xl mx-auto text-base text-[var(--text-secondary)] font-medium">
                        Everything you need to know about Spark.
                    </p>
                </div>
                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-2 shadow-sm">
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