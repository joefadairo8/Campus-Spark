import React, { useState, useEffect, useRef } from 'react';
import { SparkIcon, APP_ABBREV } from '../constants';
import { UserRole } from '../types';
import { apiClient, auth, addDoc } from '../firebase';
import NotificationPanel from './NotificationPanel';
import { ShieldCheck, Lock, EyeOff, CheckCircle2, Scale, Building2, Handshake, AlertTriangle, ShieldAlert, MessageSquare, HelpCircle, Send, Phone, Mail, UserCircle, X as XIcon, ChevronRight } from 'lucide-react';

// Profile completion calculator — returns { pct, missing } based on role
const getProfileCompletion = (user: any, role: UserRole): { pct: number; missing: string[] } => {
    if (!user) return { pct: 0, missing: [] };
    const check = (val: any) => !!val && String(val).trim() !== '';
    const sharedFields: [string, string][] = [
        ['name', 'Full Name'],
        ['email', 'Email Address'],
        ['phoneNumber', 'Phone Number'],
        ['location', 'Location'],
        ['bio', 'Bio / Description'],
        ['imageUrl', 'Profile Photo'],
    ];
    const roleFields: Record<string, [string, string][]> = {
        Creator: [['influencerType', 'Creator Type'], ['niche', 'Niche'], ['instagram', 'Instagram']],
        Brand: [['industry', 'Industry'], ['companySize', 'Company Size'], ['website', 'Website']],
        Organization: [['clubType', 'Association Type'], ['university', 'University'], ['website', 'Website']],
        Admin: [],
    };
    const allFields = [...sharedFields, ...(roleFields[role] || [])];
    const missing = allFields.filter(([field]) => !check(user[field])).map(([, label]) => label);
    const pct = Math.round(((allFields.length - missing.length) / allFields.length) * 100);
    return { pct, missing };
};

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface DashboardShellProps {
    role: UserRole;
    activeView: string;
    onViewChange: (view: string) => void;
    onLogout: () => void;
    sidebarItems: SidebarItem[];
    children: React.ReactNode;
    userName: string;
    userSub: string;
    userId?: string;
    userImage?: string;
    walletStrip?: React.ReactNode;
    isDarkMode: boolean;
    toggleTheme: () => void;
    themeMode?: 'light' | 'dark' | 'auto';
    userProfile?: any; // Full user object for profile completion tracking
}

const getTrustPopupContent = (role: UserRole) => {
    switch (role) {
        case 'Creator':
            return {
                title: 'Creator Safety & Payment Protection',
                gradient: 'from-spark-red/20 via-transparent to-transparent',
                accentColor: 'text-spark-red border-spark-red/20 bg-spark-red/5',
                btnColor: 'bg-spark-red text-white shadow-spark-red/10',
                guidelines: [
                    {
                        title: 'Locked Escrow Guarantees',
                        desc: 'Brands must fund campaigns upfront. Your payment is held securely in escrow and automatically released to your wallet upon task approval.',
                        icon: <Lock className="w-5 h-5 text-spark-red" />
                    },
                    {
                        title: 'Keep Communications On-Platform',
                        desc: 'Always use platform chat and contract tools. Off-platform agreements bypass escrow protection and cannot be arbitrated by support.',
                        icon: <EyeOff className="w-5 h-5 text-spark-red" />
                    },
                    {
                        title: 'Verification & Authenticity',
                        desc: 'Keep your social profiles and student IDs authentic. Using fake engagement or deceptive metrics leads to immediate suspension.',
                        icon: <ShieldCheck className="w-5 h-5 text-spark-red" />
                    }
                ]
            };
        case 'Brand':
            return {
                title: 'Brand Campaign & Quality Protection',
                gradient: 'from-blue-500/20 via-transparent to-transparent',
                accentColor: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
                btnColor: 'bg-blue-600 text-white shadow-blue-500/10',
                guidelines: [
                    {
                        title: 'Milestone-Based Escrow',
                        desc: 'Your campaign budget is securely locked in escrow. Funds are only paid out after you review and approve the creator\'s submitted work.',
                        icon: <Lock className="w-5 h-5 text-blue-500" />
                    },
                    {
                        title: 'Verified Audience Metrics',
                        desc: 'All creators undergo strict manual vetting to verify social metrics, follower counts, and school credentials, guaranteeing real Gen-Z reach.',
                        icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    },
                    {
                        title: 'Arbitration & Safe Refunds',
                        desc: 'If a creator fails to meet details, timelines, or brief guidelines, our support team mediates disputes and issues swift escrow refunds.',
                        icon: <Scale className="w-5 h-5 text-blue-500" />
                    }
                ]
            };
        case 'Organization':
            return {
                title: 'Association Trust & Sponsorship Integrity',
                gradient: 'from-purple-500/20 via-transparent to-transparent',
                accentColor: 'text-purple-600 border-purple-500/20 bg-purple-50/5',
                btnColor: 'bg-purple-600 text-white shadow-purple-500/10',
                guidelines: [
                    {
                        title: 'Protected Sponsorship Budgets',
                        desc: 'Event sponsorship payments are held securely in escrow by brand partners and released directly to your club wallet upon agreed event milestones.',
                        icon: <Lock className="w-5 h-5 text-purple-600" />
                    },
                    {
                        title: 'Keep Credentials Active',
                        desc: 'Ensure your official student club registration details and executive list are kept up to date to maintain verification status.',
                        icon: <Building2 className="w-5 h-5 text-purple-600" />
                    },
                    {
                        title: 'Clear Partner Deliverables',
                        desc: 'Clearly document sponsorship deliverables (social tags, banner placements, booths) to build trust and lock in recurring brand partnerships.',
                        icon: <Handshake className="w-5 h-5 text-purple-600" />
                    }
                ]
            };
        case 'Admin':
        default:
            return {
                title: 'System Governance & Compliance Briefing',
                gradient: 'from-amber-500/20 via-transparent to-transparent',
                accentColor: 'text-amber-600 border-amber-500/20 bg-amber-500/5',
                btnColor: 'bg-amber-600 text-white shadow-amber-500/10',
                guidelines: [
                    {
                        title: 'Neutral Dispute Arbitration',
                        desc: 'Arbitrate creator-brand conflicts impartially using campaign briefs, chat logs, timeline guidelines, and submitted assets.',
                        icon: <Scale className="w-5 h-5 text-amber-600" />
                    },
                    {
                        title: 'Escrow Sanitisation & Audit',
                        desc: 'Regularly monitor platform wallets, transaction lists, and escrow withdrawals to identify financial abnormalities or system exploits.',
                        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
                    },
                    {
                        title: 'Rigorous Vetting Process',
                        desc: 'Carefully verify incoming creator socials, corporate registries, and student association documents to sustain campus security.',
                        icon: <ShieldAlert className="w-5 h-5 text-amber-600" />
                    }
                ]
            };
    }
};

const DashboardShell: React.FC<DashboardShellProps> = ({
    role,
    activeView,
    onViewChange,
    onLogout,
    sidebarItems,
    children,
    userName,
    userSub,
    userId,
    userImage,
    walletStrip,
    isDarkMode,
    toggleTheme,
    themeMode,
    userProfile
}) => {
    const renderThemeIcon = () => {
        const activeMode = themeMode || (isDarkMode ? 'dark' : 'light');
        if (activeMode === 'light') {
            return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            );
        } else if (activeMode === 'dark') {
            return (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            );
        } else {
            return (
                <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
    };
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const [showSupport, setShowSupport] = useState(false);
    const [supportSubject, setSupportSubject] = useState('');
    const [supportMessage, setSupportMessage] = useState('');
    const [supportSubmitting, setSupportSubmitting] = useState(false);

    const handleSendSupport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportSubject.trim() || !supportMessage.trim()) return;
        setSupportSubmitting(true);
        try {
            await addDoc('supportTickets', {
                subject: supportSubject.trim(),
                message: supportMessage.trim(),
                userId: userId || auth.currentUser?.uid || 'anonymous',
                userName: userName || 'Anonymous User',
                userRole: role,
                userEmail: auth.currentUser?.email || '',
                status: 'open',
                createdAt: new Date().toISOString()
            });
            alert('Your ticket was successfully submitted! Our support team has been notified and will contact you via email.');
            setSupportSubject('');
            setSupportMessage('');
            setShowSupport(false);
        } catch (err: any) {
            console.error('Failed to submit support ticket:', err);
            alert('Could not submit ticket. Please check your network and try again.');
        } finally {
            setSupportSubmitting(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await apiClient.get('notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await apiClient.patch(`notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const [showTrustPopup, setShowTrustPopup] = useState(false);
    const [showProfilePrompt, setShowProfilePrompt] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(false);

    // Compute profile completion from passed userProfile
    const { pct: profilePct, missing: profileMissing } = getProfileCompletion(userProfile, role);
    const isProfileIncomplete = profilePct < 100;

    useEffect(() => {
        const keyVal = userId || userName;
        if (keyVal && keyVal !== "Spark Member" && keyVal !== "Brand Partner" && keyVal !== "Association Leader" && keyVal !== "System Admin") {
            const popupKey = `seen_trust_safety_${role}_${keyVal}`;
            const seen = localStorage.getItem(popupKey);
            if (!seen) {
                setShowTrustPopup(true);
            }
        }
    }, [role, userId, userName]);

    // First-login profile completion prompt (fires 1.5s after trust popup so they don't stack)
    useEffect(() => {
        if (!userId || role === 'Admin') return;
        const promptKey = `seen_profile_prompt_${userId}`;
        const seen = localStorage.getItem(promptKey);
        if (!seen && isProfileIncomplete) {
            setTimeout(() => setShowProfilePrompt(true), 1500);
        }
    }, [userId, role, isProfileIncomplete]);

    const handleDismissProfilePrompt = () => {
        if (userId) localStorage.setItem(`seen_profile_prompt_${userId}`, 'true');
        setShowProfilePrompt(false);
    };

    const handleGoToProfile = () => {
        if (userId) localStorage.setItem(`seen_profile_prompt_${userId}`, 'true');
        setShowProfilePrompt(false);
        onViewChange('profile');
    };

    const handleDismissPopup = () => {
        const keyVal = userId || userName;
        if (keyVal) {
            const popupKey = `seen_trust_safety_${role}_${keyVal}`;
            localStorage.setItem(popupKey, 'true');
        }
        setShowTrustPopup(false);
    };

    const popupContent = getTrustPopupContent(role);

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
            {/* Trust & Safety Onboarding Popup */}
            {showTrustPopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-[2.5rem] shadow-2xl p-8 md:p-10 flex flex-col gap-6 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Top decorative gradient glow */}
                        <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${popupContent.gradient} rounded-full blur-2xl -z-10`} />

                        {/* Pulsing Shield Icon Container */}
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${popupContent.accentColor} animate-pulse`}>
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">Safety & Security Briefing</span>
                                <h3 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)] mt-0.5">{popupContent.title}</h3>
                            </div>
                        </div>

                        <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed border-b border-[var(--border-color)] pb-4">
                            Welcome, <strong className="text-[var(--text-primary)]">{userName}</strong>. To ensure a safe, professional, and secure experience for everyone on ABC-Rally, please review our core platform rules for your role:
                        </p>

                        {/* Guidelines Checklist */}
                        <div className="flex flex-col gap-5">
                            {popupContent.guidelines.map((guideline, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${popupContent.accentColor}`}>
                                        {guideline.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-[var(--text-primary)] mb-1">{guideline.title}</h4>
                                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">{guideline.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleDismissPopup}
                            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg hover:opacity-95 ${popupContent.btnColor}`}
                        >
                            I Understand & Accept
                        </button>
                    </div>
                </div>
            )}
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar — full on desktop, drawer on mobile */}
            <aside className={`fixed lg:static inset-y-0 left-0 flex flex-col flex-shrink-0 z-[130] transition-all duration-300 bg-[var(--bg-primary)] border-r border-[var(--border-color)] 
                ${isSidebarOpen ? 'w-72 translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:w-64'}`}>

                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-[var(--border-color)]">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => (window.location.href = '/')}>
                        <SparkIcon className={`w-7 h-7 flex-shrink-0 ${role === 'Organization' ? 'text-spark-purple' : 'text-spark-red'}`} />
                        <span className="font-fancy font-black text-[var(--text-primary)] text-base tracking-tighter">{APP_ABBREV}</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = activeView === item.id;
                        const accentColorClass = role === 'Organization' ? 'spark-purple' : 'spark-red';
                        return (
                            <button
                                key={item.id}
                                onClick={() => { onViewChange(item.id); setIsSidebarOpen(false); }}
                                className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 
                                    ${isActive 
                                        ? (role === 'Organization' ? 'bg-spark-purple text-white shadow-lg shadow-spark-purple/20 scale-[1.02]' : 'bg-spark-red text-white shadow-lg shadow-spark-red/20 scale-[1.02]') 
                                        : (role === 'Organization' ? 'text-[var(--text-secondary)] hover:bg-spark-purple/5 hover:text-spark-purple' : 'text-[var(--text-secondary)] hover:bg-spark-red/5 hover:text-spark-red')}`}
                            >
                                <span className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                                <span className="font-bold text-xs truncate uppercase tracking-widest">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Role Badge at bottom */}
                <div className="p-4 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-spark-red/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-spark-red uppercase tracking-wider">{role.substring(0, 3)}</span>
                        </div>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] truncate">{role}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
                {/* Header / Navbar */}
                <header className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] h-auto min-h-[5rem] flex flex-wrap items-center justify-between px-6 lg:px-10 relative z-50 gap-y-2 py-3">
                    <div className="flex items-center space-x-4">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-spark-red bg-spark-red/5 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h2 className="text-sm lg:text-base font-black text-[var(--text-primary)] uppercase tracking-[0.3em] truncate max-w-[150px] sm:max-w-none">
                            {sidebarItems.find(i => i.id === activeView)?.label || 'Dashboard'}
                        </h2>
                    </div>
                    {/* Wallet Strip — rendered only when provided by parent */}
                    {walletStrip && (
                        <div className="flex-1 flex justify-center px-4 order-3 lg:order-2 w-full lg:w-auto pb-1 lg:pb-0">
                            {walletStrip}
                        </div>
                    )}

                    <div className="flex items-center space-x-3 sm:space-x-5 order-2 lg:order-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 bg-spark-red/5 border border-spark-red/10 rounded-xl text-spark-red hover:bg-spark-red/10 transition-all active:scale-95"
                            aria-label="Toggle Theme"
                        >
                             {renderThemeIcon()}
                        </button>

                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2.5 relative bg-spark-red/5 border border-spark-red/10 rounded-xl transition-all ${showNotifications ? 'text-spark-red ring-4 ring-spark-red/5' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                {unreadCount > 0 && (
                                    <span className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black rounded-full border-2 border-[var(--bg-primary)] flex items-center justify-center animate-pulse ${role === 'Organization' ? 'bg-spark-purple' : 'bg-spark-red'}`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <NotificationPanel
                                    notifications={notifications}
                                    onMarkAsRead={handleMarkAsRead}
                                    onClose={() => setShowNotifications(false)}
                                />
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-3 pl-4 sm:pl-5 border-l border-[var(--border-color)] hover:opacity-80 transition-opacity"
                            >
                                <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-black text-white shadow-lg ring-2 ring-[var(--bg-primary)] flex-shrink-0 ${role === 'Organization' ? 'bg-spark-purple shadow-spark-purple/10' : 'bg-spark-red shadow-spark-red/10'}`}>
                                    {userImage ? (
                                        <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-sm">{userName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-xs font-black text-[var(--text-primary)] leading-none truncate max-w-[100px]">{userName}</p>
                                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 opacity-70 uppercase tracking-widest truncate max-w-[100px]">{userSub}</p>
                                </div>
                                <svg className="w-3 h-3 text-[var(--text-secondary)] hidden sm:block transition-transform duration-300 group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-3 w-52 bg-[var(--bg-primary)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden z-50 animate-in zoom-in-95 fade-in duration-200">
                                    <div className="px-5 py-5 border-b border-[var(--border-color)]">
                                        <p className="font-black text-[var(--text-primary)] text-xs truncate">{userName}</p>
                                        <p className="text-[10px] text-[var(--text-secondary)] opacity-70 truncate uppercase tracking-widest mt-1">{userSub}</p>
                                        <span className={`mt-2.5 inline-block px-2 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-[0.2em] ${role === 'Organization' ? 'bg-spark-purple/10 text-spark-purple' : 'bg-spark-red/10 text-spark-red'}`}>{role}</span>
                                    </div>
                                    <button
                                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black text-red-500 hover:bg-red-500/5 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 lg:p-8 bg-[var(--bg-primary)] relative">

                    {/* ── Profile Completion Banner ── */}
                    {isProfileIncomplete && !bannerDismissed && role !== 'Admin' && (
                        <div className={`mb-6 rounded-2xl overflow-hidden border animate-in slide-in-from-top-2 duration-500 ${profilePct < 50 ? 'border-spark-red/40 bg-gradient-to-r from-spark-red/10 to-orange-500/5' : 'border-amber-400/40 bg-gradient-to-r from-amber-400/10 to-yellow-400/5'}`}>
                            <div className="px-5 py-3.5 flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${profilePct < 50 ? 'bg-spark-red/15 text-spark-red' : 'bg-amber-400/15 text-amber-600'}`}>
                                        <UserCircle className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-[var(--text-primary)] leading-none">
                                            Profile is <span className={profilePct < 50 ? 'text-spark-red' : 'text-amber-600'}>{profilePct}% complete</span> — complete it to unlock full platform visibility
                                        </p>
                                        {profileMissing.length > 0 && (
                                            <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5 truncate">
                                                Missing: {profileMissing.slice(0, 3).join(', ')}{profileMissing.length > 3 ? ` +${profileMissing.length - 3} more` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-[var(--border-color)] rounded-full overflow-hidden hidden sm:block">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${profilePct < 50 ? 'bg-spark-red' : profilePct < 80 ? 'bg-amber-400' : 'bg-green-500'}`}
                                            style={{ width: `${profilePct}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => onViewChange('profile')}
                                        className={`px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 flex-shrink-0 ${profilePct < 50 ? 'bg-spark-red shadow-sm shadow-spark-red/30' : 'bg-amber-500 shadow-sm shadow-amber-400/30'}`}
                                    >
                                        Update Profile <ChevronRight className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => setBannerDismissed(true)}
                                        className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                                        title="Dismiss for this session"
                                    >
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {children}

                    {/* ── First-Login Profile Completion Prompt ── */}
                    {showProfilePrompt && isProfileIncomplete && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[990] p-4 animate-in fade-in duration-300">
                            <div className="relative w-full max-w-md bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-[2.5rem] shadow-2xl p-8 flex flex-col gap-6 overflow-hidden animate-in zoom-in-95 duration-300">
                                {/* Decorative glow */}
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-spark-red/20 via-transparent to-transparent rounded-full blur-2xl -z-10" />
                                {/* Header */}
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-spark-red/10 flex items-center justify-center flex-shrink-0 border-2 border-spark-red/20">
                                        <UserCircle className="w-8 h-8 text-spark-red" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">Welcome to ABC-Rally!</span>
                                        <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)] mt-0.5">Complete Your Profile</h3>
                                    </div>
                                </div>
                                <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">
                                    Hey <strong className="text-[var(--text-primary)]">{userName}</strong>! 👋 Your profile is only <span className="font-black text-spark-red">{profilePct}%</span> complete. A complete profile boosts your visibility and makes you more attractive to {role === 'Creator' ? 'brands and associations' : 'creators'}.
                                </p>
                                {/* Progress ring visual */}
                                <div className="flex items-center gap-4 py-2 px-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--border-color)]" />
                                            <circle
                                                cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5"
                                                stroke={profilePct < 50 ? '#ef4444' : profilePct < 80 ? '#f59e0b' : '#22c55e'}
                                                strokeDasharray={`${profilePct} ${100 - profilePct}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-[var(--text-primary)]">{profilePct}%</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-[var(--text-primary)] mb-1">Missing fields:</p>
                                        <ul className="text-[11px] text-[var(--text-secondary)] font-medium space-y-0.5">
                                            {profileMissing.slice(0, 4).map((f, i) => (
                                                <li key={i} className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-spark-red/60 flex-shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                            {profileMissing.length > 4 && <li className="text-[var(--text-secondary)] opacity-60">+{profileMissing.length - 4} more</li>}
                                        </ul>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleGoToProfile}
                                        className="w-full py-4 bg-spark-red text-white font-black text-sm rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-spark-red/20 flex items-center justify-center gap-2"
                                    >
                                        <UserCircle className="w-5 h-5" />
                                        Update My Profile Now
                                    </button>
                                    <button
                                        onClick={handleDismissProfilePrompt}
                                        className="w-full py-3 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-secondary)] transition-all"
                                    >
                                        I'll do it later
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Floating Customer Support FAB */}
                    <button
                        onClick={() => setShowSupport(true)}
                        className={`fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ${role === 'Organization' ? 'bg-spark-purple hover:bg-purple-700 shadow-spark-purple/35' : 'bg-spark-red hover:bg-red-700 shadow-spark-red/35'}`}
                        title="Customer Support"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </button>

                    {/* Customer Support Modal */}
                    {showSupport && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowSupport(false); setSupportSubject(''); setSupportMessage(''); }}></div>
                            <div className="relative bg-[var(--bg-primary)] w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-8 pb-4 flex justify-between items-center border-b border-[var(--border-color)]">
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Customer Support</h3>
                                        <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Get fast help from the Spark Team</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowSupport(false);
                                            setSupportSubject('');
                                            setSupportMessage('');
                                        }}
                                        className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                                    {/* Contact Channels */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <a
                                            href="https://wa.me/2349060320863"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-4 bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 hover:border-green-500/40 rounded-2xl flex flex-col items-center text-center transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-green-500/10 group-hover:scale-110 transition-transform">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">WhatsApp Support</span>
                                            <span className="text-[9px] text-[var(--text-secondary)] mt-0.5 font-bold">Average response: 5 mins</span>
                                        </a>
                                        <a
                                            href="mailto:hello@abc-rally.com"
                                            className="p-4 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl flex flex-col items-center text-center transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">Email Support</span>
                                            <span className="text-[9px] text-[var(--text-secondary)] mt-0.5 font-bold">Average response: 2 hrs</span>
                                        </a>
                                     </div>

                                    {/* FAQs */}
                                    <div>
                                        <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                            <HelpCircle className="w-4 h-4 text-spark-red" /> Quick FAQs
                                        </h4>
                                        <div className="space-y-3">
                                            {[
                                                { q: "How does the escrow safety lock work?", a: "Brands lock the campaign budget when selecting creators. Funds are held in our secure escrow wallet and only paid out to the creator's wallet once the task report is approved." },
                                                { q: "How can I withdraw my earnings?", a: "Creators and clubs can request payouts from their available balance directly to their Nigerian bank account. Payout requests are verified and processed within 24 hours." },
                                                { q: "What is the ₦20,000 campaign fee?", a: "It is a flat fee charged to brands to launch a campaign, list briefs to creators, and enable verified performance metrics tracking." }
                                            ].map((faq, idx) => (
                                                <details key={idx} className="group bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3.5 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
                                                    <summary className="flex items-center justify-between text-xs font-black text-[var(--text-primary)] select-none">
                                                        <span>{faq.q}</span>
                                                        <span className="text-xs font-black transition-transform group-open:rotate-45">+</span>
                                                    </summary>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium leading-relaxed">{faq.a}</p>
                                                </details>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ticket Form */}
                                    <form onSubmit={handleSendSupport} className="space-y-4 pt-4 border-t border-[var(--border-color)] text-left">
                                        <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Send a Message</h4>
                                        <div>
                                            <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Subject</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="e.g. Escrow payment not reflecting"
                                                value={supportSubject}
                                                onChange={e => setSupportSubject(e.target.value)}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-spark-red rounded-xl font-bold text-xs outline-none transition-all text-[var(--text-primary)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Message / Issue Details</label>
                                            <textarea
                                                required
                                                rows={3}
                                                placeholder="Describe your issue, including any relevant transaction references..."
                                                value={supportMessage}
                                                onChange={e => setSupportMessage(e.target.value)}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:border-spark-red rounded-xl font-bold text-xs outline-none transition-all resize-none text-[var(--text-primary)]"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={supportSubmitting}
                                            className={`w-full py-3.5 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 ${role === 'Organization' ? 'bg-spark-purple hover:bg-purple-700 shadow-purple-100' : 'bg-spark-red hover:bg-red-700 shadow-red-100'}`}
                                        >
                                            {supportSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" /> Submit Ticket
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DashboardShell;
