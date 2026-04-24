
import React from 'react';
import { UserRole } from '../types';

const PortalCard: React.FC<{ 
    title: string; 
    role: UserRole; 
    desc: string; 
    icon: string; 
    onAction: (page: string) => void 
}> = ({ title, role, desc, icon, onAction }) => (
    <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
        <div className="w-16 h-16 bg-red-50 text-spark-red rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-spark-black mb-4">{title}</h3>
        <p className="text-spark-gray font-medium mb-10 flex-1 leading-relaxed">{desc}</p>
        <div className="space-y-4">
            <button 
                onClick={() => onAction('create-account')}
                className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
            >
                Start as {role === UserRole.Brand ? 'Brand' : role === UserRole.StudentOrg ? 'Org' : 'Ambassador'}
            </button>
            <button 
                onClick={() => onAction('login')}
                className="w-full py-4 border-2 border-gray-50 text-spark-gray font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm uppercase tracking-widest"
            >
                Login to Dashboard
            </button>
        </div>
    </div>
);

const DashboardPortal: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    return (
        <section className="py-24 bg-gray-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-black text-spark-black mb-6">One Platform. Three Worlds.</h2>
                    <p className="text-xl text-spark-gray font-medium">Whether you're looking to hire or be hired, we've built a dedicated space just for you.</p>
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
