
import React from 'react';

interface DashboardPlaceholderProps {
    title: string;
    icon: string;
    description: string;
}

const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({ title, icon, description }) => {
    return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-white rounded-[3rem] border border-gray-100 shadow-sm text-center animate-in zoom-in-95 duration-500 min-h-[400px] sm:min-h-[500px]">
            <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-5xl mb-8">
                {icon}
            </div>
            <h3 className="text-3xl font-black text-spark-black mb-4">{title}</h3>
            <p className="text-spark-gray font-medium max-w-sm leading-relaxed mb-10">
                {description}
            </p>
            <div className="flex gap-4">
                <button className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all active:scale-[0.98]">
                    Join Waitlist
                </button>
                <button className="px-8 py-4 bg-gray-50 text-spark-black font-black rounded-2xl hover:bg-gray-100 transition-all">
                    Learn More
                </button>
            </div>
        </div>
    );
};

export default DashboardPlaceholder;
