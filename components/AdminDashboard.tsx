import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy, updateDoc, deleteDoc } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { WalletService, REVENUE_WALLET_ID } from '../WalletService';
import { 
    BarChart3, Users, Megaphone, Building2, Shield, Wallet, 
    Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
    XCircle, ArrowRight, Calendar, Activity, Database, Trash2, Edit,
    Eye, Ban, CheckCircle, Info, ExternalLink, MapPin, TrendingUp
} from 'lucide-react';

interface AdminStats {
    users: number;
    totalUsers: number;
    gigs: number;
    activeGigs: number;
    events: number;
    pendingProposals: number;
    roles: Record<string, number>;
    totalEscrow: number;
    rewardPool: number;
    platformRevenue: number;
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

const AdminDashboard: React.FC<{ 
    onNavigate: (page: string) => void, 
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, user }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [partnerships, setPartnerships] = useState<any[]>([]);
    const [allGigs, setAllGigs] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [userDetailData, setUserDetailData] = useState<{gigs: any[], events: any[], transactions: any[]}>({gigs: [], events: [], transactions: []});
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchAdminData();
    }, [currentView]);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('admin/stats');
            
            // Also fetch platform revenue wallet balance and total escrow
            const [revenueWallet, walletsSnap] = await Promise.all([
                WalletService.getOrCreateWallet(REVENUE_WALLET_ID),
                getDocs(collection(db, 'wallets'))
            ]);

            const totalEscrowSum = walletsSnap.docs.reduce((acc, d) => acc + (d.data().escrow || 0), 0);
            
            setStats({
                ...res.data.stats,
                totalEscrow: totalEscrowSum,
                platformRevenue: revenueWallet.balance
            });
            setRecentUsers(res.data.recentUsers);

            if (currentView === 'proposals') {
                const proposalsRes = await apiClient.get('partnerships');
                setPartnerships(proposalsRes.data);
            } else if (currentView === 'users') {
                const usersRes = await apiClient.get('users');
                setAllUsers(usersRes.data);
            } else if (currentView === 'campaigns') {
                const gigsRes = await apiClient.get('gigs');
                setAllGigs(gigsRes.data);
            } else if (currentView === 'events') {
                const eventsRes = await apiClient.get('events');
                setAllEvents(eventsRes.data);
            } else if (currentView === 'transactions') {
                const transRes = await apiClient.get('transactions');
                setAllTransactions(transRes.data.sort((a: any, b: any) => 
                    new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime() - 
                    new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime()
                ));
            }

            setError('');
        } catch (err: any) {
            console.error('Admin fetch error:', err);
            setError(err.response?.data?.error || 'Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewUserDetail = async (targetUser: any) => {
        setSelectedUserDetail(targetUser);
        setDetailLoading(true);
        try {
            // Fetch all user-related activity
            const [gigs, events, transactions] = await Promise.all([
                apiClient.get(`gigs?brandId=${targetUser.id}`),
                apiClient.get(`events?hostId=${targetUser.id}`),
                apiClient.get(`transactions?userId=${targetUser.id}`)
            ]);
            setUserDetailData({
                gigs: gigs.data || [],
                events: events.data || [],
                transactions: transactions.data || []
            });
        } catch (err) {
            console.error('Error fetching user details:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleToggleUserSuspension = async (targetUser: any) => {
        const isSuspending = targetUser.status !== 'suspended';
        if (!window.confirm(`Are you sure you want to ${isSuspending ? 'SUSPEND' : 'REINSTATE'} ${targetUser.name}?`)) return;
        
        try {
            await apiClient.patch(`users/${targetUser.id}`, { status: isSuspending ? 'suspended' : 'active' });
            alert(`User ${isSuspending ? 'suspended' : 'reinstated'} successfully.`);
            fetchAdminData();
            if (selectedUserDetail?.id === targetUser.id) {
                setSelectedUserDetail({...selectedUserDetail, status: isSuspending ? 'suspended' : 'active'});
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update user status');
        }
    };

    const handlePromoteToAdmin = async (userId: string) => {
        if (!window.confirm('WARNING: You are about to grant SYSTEM ADMINISTRATOR privileges to this user. They will have full control over the platform. Proceed?')) return;
        try {
            await apiClient.patch(`users/${userId}`, { role: 'Admin' });
            alert('User promoted to Admin successfully.');
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to promote user');
        }
    };

    const handleDeleteRecord = async (collection: string, id: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${collection.slice(0, -1)}? This is permanent.`)) return;
        try {
            await apiClient.delete(`${collection}/${id}`);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.error || `Failed to delete from ${collection}`);
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Network Pulse', icon: <Activity className="w-5 h-5" /> },
        { id: 'users', label: 'User Directory', icon: <Users className="w-5 h-5" /> },
        { id: 'campaigns', label: 'Campaign Monitor', icon: <Megaphone className="w-5 h-5" /> },
        { id: 'events', label: 'Campus Events', icon: <Calendar className="w-5 h-5" /> },
        { id: 'transactions', label: 'Platform Ledger', icon: <Wallet className="w-5 h-5" /> },
        { id: 'revenue', label: 'Revenue Engine', icon: <TrendingUp className="w-5 h-5" /> },
        { id: 'proposals', label: 'Proposal Monitor', icon: <Database className="w-5 h-5" /> },
    ];

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 dark:bg-red-900/10 text-spark-red p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black mb-2">Error loading admin dashboard</h3>
                    <p className="text-sm font-medium text-red-600/70">{error}</p>
                    <button onClick={fetchAdminData} className="mt-6 px-6 py-2 bg-spark-red text-white font-black rounded-xl uppercase text-[10px] tracking-widest">Retry Connection</button>
                </div>
            );
        }

        switch (currentView) {
            case 'revenue':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-spark-black p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <Shield className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-spark-red animate-pulse"></span>
                                        Platform Revenue Hub
                                    </p>
                                    <h2 className="text-6xl font-black mb-4">₦{stats?.platformRevenue?.toLocaleString() || '0'}</h2>
                                    <p className="text-gray-400 font-medium leading-relaxed max-w-xs">Accumulated earnings from platform commissions (10%) and campaign listing fees (₦20,000).</p>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Revenue Streams</h3>
                                    <div className="space-y-4 mt-6">
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <span className="text-sm font-bold text-[var(--text-secondary)]">Campaign Listing Fee</span>
                                            <span className="font-black text-spark-red">₦20,000 / gig</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <span className="text-sm font-bold text-[var(--text-secondary)]">Influencer Commission</span>
                                            <span className="font-black text-spark-red">10%</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <span className="text-sm font-bold text-[var(--text-secondary)]">Sponsorship Commission</span>
                                            <span className="font-black text-spark-red">10%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Revenue Transactions */}
                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)]">
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Revenue Audit Trail</h3>
                            </div>
                            <div className="p-8">
                                <div className="space-y-4">
                                    {allTransactions.filter(t => t.userId === REVENUE_WALLET_ID).length === 0 ? (
                                        <p className="text-center py-10 text-[var(--text-secondary)] italic">No revenue transactions recorded yet.</p>
                                    ) : (
                                        allTransactions.filter(t => t.userId === REVENUE_WALLET_ID).map((t, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                                                        <ArrowDownLeft className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[var(--text-primary)]">{t.description}</p>
                                                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">{new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : t.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-green-600 text-lg">+ ₦{Number(t.amount).toLocaleString()}</p>
                                                    <p className="text-[10px] font-black uppercase text-[var(--text-secondary)]">{t.status}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'events':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Campus Events</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Monitor all organization-led experiences.</p>
                                </div>
                                <div className="px-4 py-2 bg-spark-red/10 text-spark-red rounded-xl font-black text-xs uppercase tracking-widest border border-spark-red/20">
                                    {allEvents.length} Active Events
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Event Details</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Host</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Location</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-[var(--text-secondary)] font-bold italic">No events currently listed in the network.</td>
                                            </tr>
                                        ) : (
                                            allEvents.map((ev) => (
                                                <tr key={ev.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div>
                                                            <p className="font-black text-[var(--text-primary)]">{ev.name || ev.title}</p>
                                                            <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mt-1">{ev.category || 'Experience'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center font-black text-xs">{(ev.hostName || '?').charAt(0)}</div>
                                                            <p className="text-sm font-bold text-[var(--text-primary)]">{ev.hostName || 'Organization'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs font-bold">
                                                            <MapPin className="w-3 h-3" />
                                                            {ev.location || 'Campus Wide'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs text-[var(--text-primary)] font-black">{ev.date || 'Upcoming'}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button onClick={() => handleDeleteRecord('events', ev.id)} className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all">
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'transactions':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-spark-black p-8 rounded-[2.5rem] text-white">
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-2">Platform Escrow</p>
                                <h3 className="text-4xl font-black">₦{(stats?.totalEscrow || 0).toLocaleString()}</h3>
                                <p className="text-xs text-spark-red font-black mt-4 uppercase tracking-widest">Secured in Smart Contracts</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <p className="text-[var(--text-secondary)] font-bold text-[10px] uppercase tracking-widest mb-2">Platform Volume</p>
                                <h3 className="text-4xl font-black text-[var(--text-primary)]">₦{(stats?.rewardPool || 0).toLocaleString()}</h3>
                                <p className="text-xs text-green-600 font-black mt-4 uppercase tracking-widest">Total Transaction History</p>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)]">
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Transaction Ledger</h3>
                                <p className="text-[var(--text-secondary)] font-bold text-sm">Real-time audit log of all financial activity.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Activity</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Value</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allTransactions.map((t, i) => (
                                            <tr key={i} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {t.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm text-[var(--text-primary)]">{t.description}</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tighter">UID: {t.userId?.slice(0,8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        t.status === 'completed' ? 'bg-green-500/10 text-green-600' : 
                                                        t.status === 'escrow' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className={`font-black ${t.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                        {t.type === 'credit' ? '+' : '-'} ₦{Number(t.amount || 0).toLocaleString()}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs text-[var(--text-secondary)] font-bold">
                                                        {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'campaigns':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Campaign Moderation</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Review and manage all live gigs on the platform.</p>
                                </div>
                                <div className="px-4 py-2 bg-spark-red/10 text-spark-red rounded-xl font-black text-xs uppercase tracking-widest border border-spark-red/20">
                                    {allGigs.length} Total Gigs
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Campaign Info</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Brand</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Budget</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allGigs.map((g) => (
                                            <tr key={g.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="font-black text-[var(--text-primary)]">{g.title}</p>
                                                        <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mt-1">{g.category}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center font-black text-xs">{(g.brandName || '?').charAt(0)}</div>
                                                        <p className="text-sm font-bold text-[var(--text-primary)]">{g.brandName}</p>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-[var(--text-primary)]">₦{(g.budget || g.reward || 0).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        g.status === 'open' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                                                    }`}>
                                                        {g.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => handleDeleteRecord('gigs', g.id)} className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                const filteredUsers = allUsers.filter(u =>
                    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Network Directory</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Monitor and moderate {allUsers.length} network participants.</p>
                                </div>
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, or role..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-spark-red/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">User Profile</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Platform Role</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {filteredUsers.map((u) => (
                                            <tr key={u.id} className={`hover:bg-[var(--bg-secondary)]/30 transition-colors ${u.status === 'suspended' ? 'bg-red-50/50 grayscale-[0.5]' : ''}`}>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-spark-red text-white rounded-2xl flex items-center justify-center font-black text-xl relative">
                                                            {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                                            {u.status === 'suspended' && <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-white"><Ban className="w-3 h-3 text-white" /></div>}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[var(--text-primary)] text-base">{u.name || 'Anonymous'}</p>
                                                            <p className="text-xs text-[var(--text-secondary)] font-bold">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                                        u.role === 'Brand' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                        u.role?.includes('Influencer') ? 'bg-spark-red/10 text-spark-red border-spark-red/20' : 
                                                        'bg-green-500/10 text-green-600 border-green-500/20'
                                                    }`}>
                                                        {u.role || 'Member'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                     <span className={`text-[10px] font-black uppercase tracking-widest ${u.status === 'suspended' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {u.status === 'suspended' ? 'Suspended' : 'Active'}
                                                     </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleViewUserDetail(u)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Deep Dive Analysis"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleUserSuspension(u)}
                                                            className={`p-2 rounded-lg transition-all ${u.status === 'suspended' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                            title={u.status === 'suspended' ? 'Reinstate User' : 'Suspend User'}
                                                        >
                                                            {u.status === 'suspended' ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                                        </button>
                                                        {u.role !== 'Admin' && (
                                                            <button
                                                                onClick={() => handlePromoteToAdmin(u.id)}
                                                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                                title="Promote to Admin"
                                                            >
                                                                <Shield className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteRecord('users', u.id)}
                                                            className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );

            case 'proposals':
                return (
                    <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black mb-8 text-[var(--text-primary)]">Partnership Monitor</h3>
                            {partnerships.length === 0 ? (
                                <DashboardPlaceholder
                                    title="No active partnerships"
                                    icon={<Clock className="w-10 h-10" />}
                                    description="The network is quiet. No active partnerships yet."
                                />
                            ) : (
                                partnerships.map((p) => (
                                    <div key={p.id} className="p-8 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-color)] flex items-center justify-between group hover:bg-[var(--bg-primary)] hover:shadow-2xl transition-all duration-300">
                                        <div className="flex items-center gap-6">
                                            <div className="flex -space-x-3 items-center">
                                                <div className="w-16 h-16 bg-spark-red text-white rounded-2xl shadow-xl flex items-center justify-center text-xl font-black z-10">
                                                    {(p.sender?.name || '?').charAt(0)}
                                                </div>
                                                <div className="w-12 h-12 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center z-20 border border-gray-100 shadow-sm"><ArrowRight className="w-5 h-5 text-spark-red" /></div>
                                                <div className="w-16 h-16 bg-spark-black text-white rounded-2xl shadow-xl flex items-center justify-center text-xl font-black z-10">
                                                    {(p.recipient?.name || '?').charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)] mb-1">{p.sender?.name} <span className="text-gray-400 font-bold mx-2">to</span> {p.recipient?.name}</h4>
                                                <div className="flex gap-2">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        p.status === 'accepted' ? 'bg-green-500/10 text-green-600' : 
                                                        p.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        Status: {p.status}
                                                    </span>
                                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[9px] font-black rounded-lg uppercase tracking-widest">
                                                        Sent: {new Date(p.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteRecord('proposals', p.id)} className="p-3 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-2xl transition-all">
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'overview':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* ── High-Level Vital Stats ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Network', value: stats?.users, sub: 'Total Participants', icon: <Users className="w-6 h-6" />, color: 'bg-spark-red text-white' },
                                { label: 'Platform Escrow', value: `₦${(stats?.totalEscrow || 0).toLocaleString()}`, sub: 'Secured Funds', icon: <Shield className="w-6 h-6" />, color: 'bg-blue-600 text-white' },
                                { label: 'Campaign Hub', value: stats?.gigs, sub: `${stats?.activeGigs} Currently Active`, icon: <Megaphone className="w-6 h-6" />, color: 'bg-green-600 text-white' },
                                { label: 'Campus Events', value: stats?.events, sub: 'Live Experiences', icon: <Calendar className="w-6 h-6" />, color: 'bg-spark-black text-white' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                                    <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>{stat.icon}</div>
                                    <p className="text-[var(--text-secondary)] font-black text-[10px] uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-2 opacity-60">{stat.sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* User Breakdown */}
                            <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm lg:col-span-1">
                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-8">Role Distribution</h3>
                                <div className="space-y-6">
                                    {Object.entries(stats?.roles || {}).map(([role, count]) => {
                                        const pct = stats?.users ? Math.round((count / stats.users) * 100) : 0;
                                        return (
                                            <div key={role}>
                                                <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                                                    <span className="text-[var(--text-secondary)]">{role}</span>
                                                    <span className="text-[var(--text-primary)]">{count} ({pct}%)</span>
                                                </div>
                                                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-1000 ${
                                                            role === 'Brand' ? 'bg-blue-600' : 
                                                            role.includes('Influencer') ? 'bg-spark-red' : 'bg-green-600'
                                                        }`} 
                                                        style={{ width: `${pct}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setCurrentView('users')} className="w-full mt-10 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all text-xs uppercase tracking-widest">
                                    Manage Directory
                                </button>
                            </div>

                            {/* Recent Signups */}
                            <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm lg:col-span-2">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-[var(--text-primary)]">New Participants</h3>
                                    <span className="text-[10px] font-black text-spark-red uppercase tracking-widest bg-spark-red/5 px-3 py-1 rounded-full">Last 10 Signups</span>
                                </div>
                                <div className="space-y-4">
                                    {recentUsers.map((u, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl group hover:bg-spark-red/5 transition-all cursor-pointer" onClick={() => handleViewUserDetail(u)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center font-black text-spark-red">
                                                    {(u.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)]">{u.name}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-spark-red uppercase tracking-widest block">{u.role}</span>
                                                <p className="text-[9px] text-[var(--text-secondary)] font-bold mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <DashboardShell
            role={UserRole.Admin}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName="Administrator"
            userSub="System Monitor"
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            walletStrip={
                <div className="flex items-center gap-2 px-4 py-2 bg-spark-black text-white rounded-xl shadow-lg border border-white/10">
                    <Shield className="w-4 h-4 text-spark-red" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Admin Access Restricted</span>
                </div>
            }
        >
            <div className="max-w-[1600px] mx-auto relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">Super Admin Hub</h2>
                        <p className="text-[var(--text-secondary)] font-bold text-lg mt-1 capitalize">Monitoring {currentView} state across the campus spark network.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={fetchAdminData} className="px-6 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-secondary)] transition-all flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Sync Data
                        </button>
                    </div>
                </div>

                <div className="space-y-8 pb-20">
                    {renderContent()}
                </div>

                {/* User Detail Deep Dive Modal */}
                {selectedUserDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-spark-black/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-[var(--bg-primary)] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] border border-[var(--border-color)] shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="p-10 border-b border-[var(--border-color)] flex justify-between items-start">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-spark-red text-white rounded-3xl flex items-center justify-center text-3xl font-black relative">
                                        {(selectedUserDetail.name || '?').charAt(0).toUpperCase()}
                                        {selectedUserDetail.status === 'suspended' && <div className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 border-4 border-[var(--bg-primary)]"><Ban className="w-4 h-4 text-white" /></div>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-3xl font-black text-[var(--text-primary)]">{selectedUserDetail.name}</h3>
                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                selectedUserDetail.status === 'suspended' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
                                            }`}>
                                                {selectedUserDetail.status || 'Active'}
                                            </span>
                                        </div>
                                        <p className="text-[var(--text-secondary)] font-bold text-lg">{selectedUserDetail.email}</p>
                                        <p className="text-xs font-black text-spark-red uppercase tracking-widest mt-2">Role: {selectedUserDetail.role}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUserDetail(null)} className="p-3 bg-[var(--bg-secondary)] rounded-2xl hover:bg-spark-red/10 hover:text-spark-red transition-all">
                                    <XCircle className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="p-10 space-y-10">
                                {detailLoading ? (
                                    <div className="flex flex-col items-center py-20 gap-4">
                                        <Loader2 className="w-12 h-12 animate-spin text-spark-red" />
                                        <p className="text-sm font-black uppercase tracking-widest text-[var(--text-secondary)]">Analyzing Activity Logs...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center"><Megaphone className="w-4 h-4" /></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Campaigns Posted</p>
                                                </div>
                                                <p className="text-4xl font-black text-[var(--text-primary)]">{userDetailData.gigs.length}</p>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 bg-purple-500/10 text-purple-600 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Events Created</p>
                                                </div>
                                                <p className="text-4xl font-black text-[var(--text-primary)]">{userDetailData.events.length}</p>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)]">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 bg-green-500/10 text-green-600 rounded-lg flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                                        {selectedUserDetail.role === 'Brand' ? 'Total Financial Outflow' : 'Total Platform Earnings'}
                                                    </p>
                                                </div>
                                                <p className="text-4xl font-black text-[var(--text-primary)]">
                                                    ₦{userDetailData.transactions.reduce((acc, t) => {
                                                        if (selectedUserDetail.role === 'Brand') {
                                                            return acc + (t.type === 'debit' ? (Number(t.amount) || 0) : 0);
                                                        } else {
                                                            return acc + (t.type === 'credit' ? (Number(t.amount) || 0) : 0);
                                                        }
                                                    }, 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Activity Timeline */}
                                            <div className="space-y-6">
                                                <h4 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                                    <Activity className="w-6 h-6 text-spark-red" />
                                                    Recent Financial Logs
                                                </h4>
                                                <div className="space-y-4">
                                                    {userDetailData.transactions.length === 0 ? (
                                                        <p className="text-sm font-bold text-[var(--text-secondary)] italic">No financial activity recorded for this user.</p>
                                                    ) : (
                                                        userDetailData.transactions.slice(0, 5).map((t, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                                        {t.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-sm text-[var(--text-primary)]">{t.description}</p>
                                                                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">{new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : t.createdAt).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <p className={`font-black ${t.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                                    {t.type === 'credit' ? '+' : '-'} ₦{Number(t.amount || 0).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="pt-10 border-t border-[var(--border-color)] flex gap-4">
                                                <button 
                                                    onClick={() => handleToggleUserSuspension(selectedUserDetail)}
                                                    className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                                                        selectedUserDetail.status === 'suspended' ? 'bg-green-600 text-white shadow-xl shadow-green-900/20' : 'bg-red-600 text-white shadow-xl shadow-red-900/20'
                                                    }`}
                                                >
                                                    {selectedUserDetail.status === 'suspended' ? <><CheckCircle className="w-5 h-5" /> Reinstate Authority</> : <><Ban className="w-5 h-5" /> Suspend Account</>}
                                                </button>
                                                <button 
                                                    onClick={() => { if(window.confirm('Permanent account deletion?')) handleDeleteRecord('users', selectedUserDetail.id); setSelectedUserDetail(null); }}
                                                    className="px-10 py-5 bg-[var(--bg-tertiary)] text-spark-red border border-spark-red/20 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-5 h-5" /> Terminate Record
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    );
};

export default AdminDashboard;
const Loader2 = ({className}: {className?: string}) => <svg className={`animate-spin ${className}`} viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
