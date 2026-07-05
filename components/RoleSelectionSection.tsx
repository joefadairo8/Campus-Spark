import React from 'react';
import { Briefcase, Camera, Award, ChevronRight } from 'lucide-react';

const RoleSelectionSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const roles = [
        {
            id: 'brand',
            title: 'For Brands and Corporations',
            description: 'Launch product campaigns, hire verified creators, sponsor events, send proposals and manage payments from one dashboard.',
            icon: <Briefcase className="w-10 h-10" />,
            color: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none',
            lightColor: 'bg-blue-500/10',
            textColor: 'text-blue-600',
            ctaText: 'Post Campaigns',
            roleName: 'Brand',
            learnMorePath: 'for-brands'
        },
        {
            id: 'creator',
            title: 'For Creators',
            description: 'Find paid gigs, apply for campaigns, build your portfolio, collaborate with other creators and withdraw your earnings directly to your bank account.',
            icon: <Camera className="w-10 h-10" />,
            color: 'bg-spark-red hover:bg-red-700 shadow-red-200 dark:shadow-none',
            lightColor: 'bg-spark-red/10',
            textColor: 'text-spark-red',
            ctaText: 'Find Gigs',
            roleName: 'Creator',
            learnMorePath: 'for-creators'
        },
        {
            id: 'org',
            title: 'For Associations and Professional Bodies',
            description: 'List events, set sponsorship targets, invite brands, assign paid or volunteer gigs and manage event finance from one platform.',
            icon: <Award className="w-10 h-10" />,
            color: 'bg-purple-600 hover:bg-purple-700 shadow-purple-200 dark:shadow-none',
            lightColor: 'bg-purple-500/10',
            textColor: 'text-purple-600',
            ctaText: 'Raise Sponsorship',
            roleName: 'Organization',
            learnMorePath: 'for-associations'
        }
    ];

    const handleRoleNavigate = (roleName: string, learnMorePath: string) => {
        localStorage.setItem('preselectedRole', roleName);
        onNavigate(learnMorePath);
    };

    return (
        <section id="user-paths" className="py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-black tracking-widest text-spark-red uppercase bg-spark-red/5 border border-spark-red/10 rounded-full">
                        Choose Your Stream
                    </div>
                    <h2 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter text-[var(--text-primary)] mb-4">Select Your Path</h2>
                    <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">Explore how ABC-Rally enables you to connect, execute, and grow in the collaboration marketplace.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {roles.map((role) => (
                        <div key={role.id} className="group bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] hover:shadow-2xl transition-all duration-500 relative flex flex-col justify-between">
                            <div>
                                <div className={`w-20 h-20 ${role.lightColor} ${role.textColor} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                    {role.icon}
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4 leading-tight">{role.title}</h3>
                                <p className="text-[var(--text-secondary)] font-medium mb-10 leading-relaxed text-sm">{role.description}</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleRoleNavigate(role.roleName, role.learnMorePath)}
                                    className={`w-full py-4.5 ${role.color} text-white font-black rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest text-xs shadow-lg`}
                                >
                                    {role.ctaText}
                                </button>
                                <button
                                    onClick={() => onNavigate(role.learnMorePath)}
                                    className="text-[var(--text-secondary)] hover:text-spark-red font-bold text-xs uppercase tracking-widest py-2 transition-colors flex items-center justify-center gap-1"
                                >
                                    Learn More
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoleSelectionSection;
