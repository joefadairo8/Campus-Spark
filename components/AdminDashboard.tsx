import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy, updateDoc, deleteDoc } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { WalletService } from '../WalletService';
import { BarChart3, Users, Megaphone, Building2, Shield, Wallet, Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface AdminStats {
    users: number;
    events: number;
    gigs: number;
    roles: Record<string, number>;
    rewardPool: number;
    pendingProposals: number;
    totalUsers: number;
    activeGigs: number;
    totalEscrow: number;
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Partnership {
    id: string;
    senderName: string;
    senderRole: string;
    recipientName: string;
    recipientRole: string;
    proposalMessage: string;
    budget?: string;
    timeline?: string;
    status: string;
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
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('admin/stats');
            setStats(res.data.stats);
            setRecentUsers(res.data.recentUsers);

            const proposalsRes = await apiClient.get('partnerships');
            setPartnerships(proposalsRes.data);

            setError('');
        } catch (err: any) {
            console.error('Admin fetch error:', err);
            setError(err.response?.data?.error || 'Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await apiClient.delete(`admin/users/${userId}`);
            fetchAdminData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const filteredUsers = recentUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sidebarItems = [
        { id: 'overview', label: 'Network Overview', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'proposals', label: 'Proposal Monitor', icon: <Megaphone className="w-5 h-5" /> },
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
                <div className="bg-red-50 text-spark-red p-6 rounded-2xl border border-red-100">
                    <p className="font-bold">Error loading admin dashboard</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            );
        }

        switch (currentView) {
            case 'proposals':
                return (
                    <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            {partnerships.length === 0 ? (
                                <DashboardPlaceholder
                                    title="No active partnerships"
                                    icon={<Clock className="w-10 h-10" />}
                                    description="No active partnerships in the network."
                                />
                            ) : (
                                partnerships.map((p) => (
                                    <div key={p.id} className="p-8 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-color)] flex items-center justify-between group hover:bg-[var(--bg-primary)] hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
                                        <div className="flex items-center gap-6">
                                            <div className="flex -space-x-3 items-center">
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl shadow-sm border border-[var(--border-color)] flex items-center justify-center text-xl font-black text-spark-red z-10 uppercase">
                                                    {(p.senderName || '?').charAt(0)}
                                                </div>
                                                <div className="w-16 h-16 bg-spark-red/10 rounded-2xl border-2 border-dashed border-spark-red/30 flex items-center justify-center text-xl"><Building2 className="w-6 h-6 text-spark-red" /></div>
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] rounded-2xl shadow-sm border border-[var(--border-color)] flex items-center justify-center text-xl font-black text-blue-600 uppercase">
                                                    {(p.recipientName || '?').charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)] mb-1">{p.senderName} <ArrowRight className="inline w-5 h-5 text-gray-400 mx-2" /> {p.recipientName}</h4>
                                                <div className="flex gap-2">
                                                    {p.budget && (
                                                        <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-lg border border-green-100">
                                                            <Wallet className="w-3 h-3 inline mr-1" /> {p.budget}
                                                        </span>
                                                    )}
                                                    {p.timeline && (
                                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                                                            <Clock className="w-3 h-3 inline mr-1" /> {p.timeline}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${p.status === 'accepted' ? 'bg-green-500 text-white' : p.status === 'rejected' ? 'bg-spark-red text-white' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-[var(--bg-primary)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-spark-red/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider relative z-10">Total Network</p>
                                <p className="text-4xl font-black text-[var(--text-primary)] mt-2 relative z-10">{stats?.users}</p>
                                <div className="mt-4 flex gap-2 relative z-10">
                                    <span className="text-[10px] bg-spark-red/10 text-spark-red px-2 py-0.5 rounded-full font-black border border-spark-red/20">A: {stats?.roles?.['Ambassador'] || 0}</span>
                                    <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full font-black border border-blue-500/20">B: {stats?.roles?.['Brand'] || 0}</span>
                                    <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-black border border-green-500/20">O: {stats?.roles?.['Student Organization'] || 0}</span>
                                </div>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider relative z-10">Total Reward Pool</p>
                                <p className="text-4xl font-black text-[var(--text-primary)] mt-2 relative z-10">₦{(stats?.rewardPool || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-black uppercase tracking-widest relative z-10">Distributed across {stats?.gigs} gigs</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider relative z-10">Network Events</p>
                                <p className="text-4xl font-black text-[var(--text-primary)] mt-2 relative z-10">{stats?.events}</p>
                                <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-black uppercase tracking-widest relative z-10">Live on campus</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-3xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                                <p className="text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider relative z-10">Pending Partnerships</p>
                                <p className="text-4xl font-black text-[var(--text-primary)] mt-2 relative z-10">{stats?.pendingProposals}</p>
                                <p className="text-[10px] text-spark-red mt-2 font-black uppercase tracking-widest relative z-10 animate-pulse">Action Required</p>
                            </div>
                        </div>

                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">User Management</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Monitor and moderate network participants.</p>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <div className="relative flex-1 md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search directory..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-spark-red/20 transition-all"
                                        />
                                        <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <button onClick={fetchAdminData} className="p-3 bg-spark-red/10 text-spark-red rounded-2xl hover:bg-spark-red/20 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--bg-secondary)]/50">
                                            <th className="px-8 py-4 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">User Profile</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Platform Role</th>
                                            <th className="px-8 py-4 text-left text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Join Date</th>
                                            <th className="px-8 py-4 text-right text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-[var(--text-secondary)] font-bold italic">No users found matching your search.</td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <tr key={user.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center font-black text-spark-red uppercase">
                                                                {(user.name || '?').charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-[var(--text-primary)]">{user.name}</p>
                                                                <p className="text-xs text-[var(--text-secondary)] font-bold opacity-60">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                         <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border ${user.role === 'Brand' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                                                 user.role === 'Student Organization' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                                                                     'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
                                                             }`}>
                                                             {user.role}
                                                         </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-[var(--text-secondary)] text-xs font-bold">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete User"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
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
        >
            <div className="space-y-8">
                {renderContent()}
            </div>
        </DashboardShell>
    );
};

export default AdminDashboard;
