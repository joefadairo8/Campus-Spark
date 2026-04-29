import React from 'react';
import { NAV_LINKS, SparkIcon } from '../constants';

const SocialIconLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} className="text-[var(--text-secondary)] hover:text-spark-red transition-all p-2.5 bg-spark-red/5 border border-spark-red/10 rounded-xl hover:scale-110 active:scale-95">
        <span className="sr-only">Social Media</span>
        {children}
    </a>
);

const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    return (
        <footer className="bg-[var(--bg-primary)] text-[var(--text-primary)] border-t border-[var(--border-color)]">
            <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 md:gap-12">
                    <div className="col-span-2 lg:col-span-1">
                         <div className="flex items-center space-x-2">
                            <SparkIcon className="w-8 h-8 text-spark-red" />
                            <span className="text-xl font-fancy font-black tracking-tighter">Spark</span>
                        </div>
                        <p className="mt-8 text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                          Connecting brands to the heart of youth culture with authenticity and scale.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-spark-red tracking-[0.3em] uppercase mb-8">Platform</h3>
                        <ul className="space-y-4">
                            {NAV_LINKS.map(link => (
                                <li key={link.label}>
                                    <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onNavigate(link.href);
                                        }}
                                        className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold"
                                    >
                                        {link.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-spark-red tracking-[0.3em] uppercase mb-8">Company</h3>
                        <ul className="space-y-4">
                            <li><button onClick={() => onNavigate('about')} className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">About Us</button></li>
                            <li><button onClick={() => onNavigate('blog')} className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">Blog</button></li>
                            <li><button onClick={() => onNavigate('careers')} className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">Careers</button></li>
                            <li><button onClick={() => onNavigate('contact')} className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">Contact</button></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-spark-red tracking-[0.3em] uppercase mb-8">Legal</h3>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">Privacy Policy</a></li>
                            <li><a href="#" className="text-sm text-[var(--text-secondary)] hover:text-spark-red transition-colors font-semibold">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-24 pt-12 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-8">
                    <p className="text-xs text-[var(--text-secondary)] md:order-1 font-bold tracking-wider">&copy; {new Date().getFullYear()} CAMPUS SPARK. ALL RIGHTS RESERVED.</p>
                    <div className="flex space-x-4 md:order-2">
                       <SocialIconLink href="#">
                           <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                       </SocialIconLink>
                       <SocialIconLink href="#">
                           <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.095 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                       </SocialIconLink>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;