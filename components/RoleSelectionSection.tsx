
import React from 'react';
import { GraduationCap, Building2, Users } from 'lucide-react';

const RoleSelectionSection: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const roles = [
        {
            id: 'ambassador',
            title: 'Student Ambassador',
            description: 'Monetize your influence. Join top brand campaigns and grow your personal brand.',
            icon: <GraduationCap className="w-12 h-12" />,
            color: 'bg-spark-red',
            lightColor: 'bg-red-50',
            textColor: 'text-spark-red'
        },
        {
            id: 'brand',
            title: 'Brand Partner',
            description: 'Reach the youth market. Connect with verified campus influencers for high-impact campaigns.',
            icon: <Building2 className="w-12 h-12" />,
            color: 'bg-spark-black',
            lightColor: 'bg-gray-50',
            textColor: 'text-spark-black'
        },
        {
            id: 'org',
            title: 'Student Organization',
            description: 'Scale your impact. Secure brand sponsorships and resources for your campus events.',
            icon: <Users className="w-12 h-12" />,
            color: 'bg-spark-red',
            lightColor: 'bg-red-50',
            textColor: 'text-spark-red'
        }
    ];

    return (
        <section className="py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-fancy font-black tracking-tighter text-[var(--text-primary)] mb-4">Choose Your Path</h2>
                    <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">Whether you're looking to grow as a creator, reach new audiences, or scale your organization, we have the tools for you.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {roles.map((role) => (
                        <div key={role.id} className="group bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                            <div className={`w-20 h-20 ${role.lightColor} ${role.textColor} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                {role.icon}
                            </div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">{role.title}</h3>
                            <p className="text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">{role.description}</p>
                            <button
                                onClick={() => onNavigate('create-account')}
                                className={`w-full py-4 ${role.color} text-white font-black rounded-2xl hover:opacity-90 transition-all active:scale-[0.98] uppercase tracking-widest text-xs`}
                            >
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoleSelectionSection;
