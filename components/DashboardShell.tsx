
import React, { useState, useEffect, useRef } from 'react';
import { SparkIcon } from '../constants';
import { UserRole } from '../types';
import { apiClient } from '../firebase';
import NotificationPanel from './NotificationPanel';

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
    userImage?: string;
    walletStrip?: React.ReactNode;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
    role,
    activeView,
    onViewChange,
    onLogout,
    sidebarItems,
    children,
    userName,
    userSub,
    userImage,
    walletStrip,
    isDarkMode,
    toggleTheme
}) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
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
                        <SparkIcon className="w-7 h-7 text-spark-red flex-shrink-0" />
                        <span className="font-fancy font-black text-[var(--text-primary)] text-base tracking-tighter">Campus Spark</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 flex flex-col gap-1 px-3 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { onViewChange(item.id); setIsSidebarOpen(false); }}
                                className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 
                                    ${isActive ? 'bg-spark-red text-white shadow-lg shadow-spark-red/20 scale-[1.02]' : 'text-[var(--text-secondary)] hover:bg-spark-red/5 hover:text-spark-red'}`}
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
                            {isDarkMode ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2.5 relative bg-spark-red/5 border border-spark-red/10 rounded-xl transition-all ${showNotifications ? 'text-spark-red ring-4 ring-spark-red/5' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-spark-red text-white text-[8px] font-black rounded-full border-2 border-[var(--bg-primary)] flex items-center justify-center animate-pulse">
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
                                <div className="w-9 h-9 rounded-xl bg-spark-red overflow-hidden flex items-center justify-center font-black text-white shadow-lg shadow-spark-red/10 ring-2 ring-[var(--bg-primary)] flex-shrink-0">
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
                                        <span className="mt-2.5 inline-block px-2 py-0.5 bg-spark-red/10 text-spark-red text-[8px] font-black rounded-lg uppercase tracking-[0.2em]">{role}</span>
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
                <div className="flex-1 overflow-auto p-6 lg:p-8 bg-[var(--bg-primary)]">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardShell;
