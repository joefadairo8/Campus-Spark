
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
    userImage
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
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-spark-black/40 backdrop-blur-sm z-[120] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar — full on desktop, drawer on mobile */}
            <aside className={`fixed lg:static inset-y-0 left-0 flex flex-col flex-shrink-0 z-[130] transition-all duration-300 bg-white border-r border-gray-100 
                ${isSidebarOpen ? 'w-72 translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:w-64'}`}>

                {/* Logo */}
                <div className="h-20 flex items-center px-6 border-b border-gray-50">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => (window.location.href = '/')}>
                        <SparkIcon className="w-8 h-8 text-spark-red flex-shrink-0" />
                        <span className="font-black text-spark-black text-lg tracking-tight">Campus Spark</span>
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
                                className={`group w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 
                                    ${isActive ? 'bg-spark-red text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:bg-red-50 hover:text-spark-red'}`}
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                <span className="font-bold text-sm truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Role Badge at bottom */}
                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-[8px] font-black text-spark-red uppercase tracking-wider">{role.substring(0, 3)}</span>
                        </div>
                        <span className="text-xs font-bold text-spark-gray truncate">{role}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
                {/* Header / Navbar */}
                <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-6 lg:px-10 relative">
                    <div className="flex items-center space-x-4">
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-spark-gray hover:text-spark-red bg-gray-50 rounded-xl transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                        <h2 className="text-lg lg:text-2xl font-black text-spark-black capitalize truncate max-w-[150px] sm:max-w-none">
                            {sidebarItems.find(i => i.id === activeView)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-5">
                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 relative bg-gray-50 rounded-xl transition-all ${showNotifications ? 'text-spark-red ring-4 ring-spark-red/5' : 'text-spark-gray hover:text-spark-red'}`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-spark-red text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce">
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
                                className="flex items-center space-x-3 pl-4 sm:pl-5 border-l border-gray-100 hover:opacity-80 transition-opacity"
                            >
                                <div className="w-10 h-10 rounded-xl bg-spark-red overflow-hidden flex items-center justify-center font-black text-white shadow-sm ring-2 ring-white flex-shrink-0">
                                    {userImage ? (
                                        <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{userName.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-bold text-spark-black leading-none">{userName}</p>
                                    <p className="text-xs text-spark-gray mt-0.5 opacity-70">{userSub}</p>
                                </div>
                                <svg className="w-4 h-4 text-spark-gray hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 top-full mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in zoom-in-95 fade-in duration-150">
                                    <div className="px-4 py-4 border-b border-gray-50">
                                        <p className="font-black text-spark-black text-sm truncate">{userName}</p>
                                        <p className="text-xs text-spark-gray opacity-70 truncate">{userSub}</p>
                                        <span className="mt-1.5 inline-block px-2 py-0.5 bg-red-50 text-spark-red text-[10px] font-black rounded-lg uppercase tracking-widest">{role}</span>
                                    </div>
                                    <button
                                        onClick={() => { setShowUserMenu(false); onLogout(); }}
                                        className="w-full flex items-center gap-3 px-4 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 lg:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardShell;
