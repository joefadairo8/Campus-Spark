import React from 'react';
import { UserRole } from '../types';

const PortalCard: React.FC<{ 
    title: string; 
    role: UserRole; 
    desc: string; 
    icon: string; 
    onAction: (page: string) => void 
}> = ({ title, role, desc, icon, onAction }) => (
    <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm hover:shadow-2xl transition-all group flex flex-col card-hover">
        <div className="w-16 h-16 bg-spark-red/5 text-spark-red rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-2xl font-fancy font-black text-[var(--text-primary)] mb-4 tracking-tighter">{title}</h3>
        <p className="text-[var(--text-secondary)] font-medium mb-10 flex-1 leading-relaxed text-sm">{desc}</p>
        <div className="space-y-4">
            <button 
                onClick={() => onAction('create-account')}
                className="w-full py-4 bg-gradient-red text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-spark-red/20 transition-all text-xs uppercase tracking-widest"
            >
                Start as {role === UserRole.Brand ? 'Brand' : role === UserRole.StudentOrg ? 'Org' : 'Ambassador'}
            </button>
            <button 
                onClick={() => onAction('login')}
                className="w-full py-4 bg-spark-red/5 border border-spark-red/10 text-[var(--text-primary)] font-bold rounded-2xl hover:bg-spark-red/10 transition-all text-[10px] uppercase tracking-[0.2em]"
            >
                Login to Dashboard
            </button>
        </div>
    </div>
);

const DashboardPortal: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    return (
        <section className="py-24 bg-spark-red/[0.02] border-y border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-5xl font-fancy font-black text-[var(--text-primary)] mb-6 tracking-tighter">One Platform. <span className="text-gradient-red italic">Three Worlds.</span></h2>
                    <p className="text-base text-[var(--text-secondary)] font-medium">Whether you're looking to hire or be hired, we've built a dedicated space just for you.</p>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-8">
                    <PortalCard 
                        title="For Brands"
                        role={UserRole.Brand}
                        desc="Access a nationwide directory of talent, manage large-scale campaigns, and track real-time ROI."
                        icon="💼"
                        onAction={onNavigate}
                    />
                    <PortalCard 
                        title="For Influencers"
                        role={UserRole.Ambassador}
                        desc="Build your professional profile as a student or professional influencer, collaborate with brands, and track your growth."
                        icon="⚡"
                        onAction={onNavigate}
                    />
                    <PortalCard 
                        title="For Organizations"
                        role={UserRole.StudentOrg}
                        desc="List your student or professional organization, secure corporate sponsorships for events, and grow your impact."
                        icon="🏛️"
                        onAction={onNavigate}
                    />
                </div>
            </div>
        </section>
    );
};

export default DashboardPortal;
