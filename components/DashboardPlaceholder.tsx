
import React from 'react';

interface DashboardPlaceholderProps {
    title: string;
    icon: React.ReactNode;
    description: string;
}

const DashboardPlaceholder: React.FC<DashboardPlaceholderProps> = ({ title, icon, description }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 sm:p-16 bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm text-center animate-in zoom-in-95 duration-500 min-h-[400px] sm:min-h-[500px] card-hover">
            <div className="w-20 h-20 bg-spark-red/10 rounded-3xl flex items-center justify-center text-4xl mb-8 text-spark-red">
                {icon}
            </div>
            <h3 className="text-2xl sm:text-3xl font-fancy font-black text-[var(--text-primary)] mb-4 tracking-tighter">{title}</h3>
            <p className="text-[var(--text-secondary)] font-medium max-w-sm leading-relaxed mb-10 text-sm">
                {description}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
                <button className="px-8 py-3.5 bg-gradient-red text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-[0.98] text-sm uppercase tracking-widest">
                    Join Waitlist
                </button>
                <button className="px-8 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold rounded-2xl hover:bg-spark-red hover:text-white transition-all text-sm uppercase tracking-widest shadow-lg shadow-black/5">
                    Learn More
                </button>
            </div>
        </div>
    );
};

export default DashboardPlaceholder;
