import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, limit, apiClient, updateDoc, orderBy } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { WalletService } from '../WalletService';
import { Wallet, TrendingUp, Lock, Plus, Minus, Ticket, Edit, Trash2, Search, Handshake, Building2, FileText, Mail, BarChart3, Target, Smartphone, Lightbulb, Award, GraduationCap, BookOpen, Calendar, Users, Megaphone, Inbox, Timer } from 'lucide-react';

const OrgDashboard: React.FC<{ 
    onNavigate: (page: string) => void, 
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, user }) => {
    const [currentView, setCurrentView] = useState('events');
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [orgProfile, setOrgProfile] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [proposing, setProposing] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalRecipient, setProposalRecipient] = useState<{ id: string, name: string } | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [ambassadors, setAmbassadors] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ name: '', date: '', description: '', targetSponsorship: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        description: '',
        targetSponsorship: ''
    });

    const fetchWallet = async () => {
        if (currentView === 'wallet' && orgProfile?.id) {
            setWalletLoading(true);
            try {
                const w = await WalletService.getOrCreateWallet(orgProfile.id);
                setWallet(w);
                const q = query(collection(db, 'transactions'), where('userId', '==', orgProfile.id), orderBy('createdAt', 'desc'), limit(10));
                const transSnap = await getDocs(q);
                setTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Wallet fetch error:", e);
            } finally {
                setWalletLoading(false);
            }
        }
    };

    const sidebarItems = [
        { id: 'events', label: 'My Events', icon: <Ticket className="w-5 h-5" /> },
        { id: 'ambassadors', label: 'Find Talent', icon: <Search className="w-5 h-5" /> },
        { id: 'wallet', label: 'Finance Hub', icon: <Wallet className="w-5 h-5" /> },
        { id: 'proposals', label: 'Brand Partnerships', icon: <Handshake className="w-5 h-5" /> },
        { id: 'brands', label: 'Explore Brands', icon: <Building2 className="w-5 h-5" /> },
        { id: 'resources', label: 'Resource Hub', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'profile', label: 'Org Profile', icon: <Users className="w-5 h-5" /> },
    ];

    const fetchOrgData = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", (user as any).uid || (user as any).id));
            if (userDoc.exists()) setOrgProfile({ id: user.uid, ...(userDoc.data() as any) });
        }
    };

    const fetchMyEvents = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`events?hostEmail=${user.email}`);
            setMyEvents(res.data);
        } catch (err) {
            console.error("Error fetching org events:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        if (!orgProfile?.id) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`proposals?senderId=${orgProfile.id}&recipientId=${orgProfile.id}`);
            setProposals(res.data);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const q = query(collection(db, "users"), where("role", "==", UserRole.Brand), limit(20));
            const snap = await getDocs(q);
            setBrands(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchMyEvents();
        fetchProposals();
        fetchBrands();
    }, []);

    useEffect(() => {
        fetchWallet();
    }, [currentView, orgProfile]);

    useEffect(() => {
        if (currentView === 'proposals') {
            fetchProposals();
        } else if (currentView === 'brands') {
            fetchBrands();
        } else if (currentView === 'ambassadors') {
            const fetchAmbassadors = async () => {
                setLoading(true);
                try {
                    const res = await apiClient.get(`users?role=${encodeURIComponent(UserRole.Ambassador)}`);
                    setAmbassadors(res.data);
                } catch (e) {
                    console.error("Ambassador fetch error:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchAmbassadors();
        } else if (currentView === 'campus_events') {
            const fetchAllEvents = async () => {
                setLoading(true);
                try {
                    const res = await apiClient.get('events');
                    setAllEvents(res.data);
                } catch (e) {
                    console.error("All events fetch error:", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchAllEvents();
        }
    }, [currentView]);

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        if (!formData.name.trim() || !formData.date || !formData.description.trim() || !formData.targetSponsorship) {
            alert('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        try {
            const orgName = orgProfile?.name || "Student Organization";
            const uni = orgProfile?.university || "Unknown";
            await apiClient.post('events', {
                name: formData.name.trim(),
                date: formData.date,
                description: formData.description.trim(),
                targetSponsorship: Number(formData.targetSponsorship),
                hostName: orgName,
                university: uni,
                status: 'published',
            });

            setShowCreateModal(false);
            setFormData({ name: '', date: '', description: '', targetSponsorship: '' });
            fetchMyEvents();
        } catch (err: any) {
            console.error("Error creating event:", err);
            alert(err.response?.data?.error || "Failed to create event. Please check all fields and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditEvent = (event: any) => {
        setEditingEvent(event);
        setEditFormData({
            name: event.name,
            date: event.date,
            description: event.description,
            targetSponsorship: String(event.targetSponsorship)
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;
        setEditSubmitting(true);
        try {
            await apiClient.patch(`events/${editingEvent.id}`, {
                ...editFormData,
                targetSponsorship: Number(editFormData.targetSponsorship)
            });
            setEditingEvent(null);
            fetchMyEvents();
            alert('Event updated successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update event.');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleOpenProposalModal = (brand: any) => {
        setProposalRecipient({ id: brand.id, name: brand.name });
        setShowProposalModal(true);
    };

    const handleSendProposal = async (data: { recipientId: string; message: string; budget?: string; timeline?: string; documentUrl?: string; documentName?: string; }) => {
        try {
            await apiClient.post('proposals', data);
            alert("Partnership proposal sent successfully!");
            setShowProposalModal(false);
            setProposalRecipient(null);
            fetchProposals();
        } catch (error) {
            console.error("Proposal error:", error);
            throw error;
        }
    };

    const handleUpdateStatus = async (id: string, status: 'accepted' | 'rejected' | 'reviewing') => {
        try {
            await apiClient.patch(`proposals/${id}`, { status });
            alert(`Proposal ${status}!`);
            fetchProposals();
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this event?')) return;
        try {
            await apiClient.delete(`events/${eventId}`);
            alert('Event deleted successfully.');
            fetchMyEvents();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete event.');
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'wallet':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        {walletLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid md:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        { label: 'Total Sponsoship', value: `₦0.00`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-spark-purple/10 text-spark-purple border border-spark-purple/20' },
                                        { label: 'Locked in Escrow', value: `₦${(wallet?.escrow || 0).toLocaleString()}`, icon: <Lock className="w-6 h-6" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                                        </div>
                                    ))}
                                </div>

                                {/* Wallet Actions */}
                                <div className="bg-spark-purple rounded-[2.5rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 text-white">Organization Finances</h3>
                                        <p className="text-purple-100 font-medium">Manage sponsorship funds and pay for campus event resources.</p>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if (!orgProfile?.id) return;
                                            const amount = Number(prompt("Enter amount to top up (₦):", "10000"));
                                            if (!amount || amount <= 0) return;

                                            const handler = (window as any).PaystackPop.setup({
                                                key: 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY', // Replace with your real public key
                                                email: orgProfile.email || 'org@campushub.africa',
                                                amount: amount * 100, // Paystack uses Kobo
                                                currency: 'NGN',
                                                callback: async (response: any) => {
                                                    // Payment Successful
                                                    await WalletService.topUpWallet(orgProfile.id, amount, response.reference);
                                                    alert(`Successfully topped up ₦${amount.toLocaleString()}!`);
                                                    fetchWallet();
                                                },
                                                onClose: () => {
                                                    console.log('Payment window closed');
                                                }
                                            });
                                            handler.openIframe();
                                        }}
                                        className="px-10 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg whitespace-nowrap"
                                    >
                                        + Add Funds
                                    </button>
                                </div>

                                {/* Transactions Table */}
                                <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10">
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8">Recent Activity</h3>
                                    <div className="space-y-6">
                                        {transactions.length === 0 ? (
                                            <p className="text-[var(--text-secondary)] text-center py-4 italic font-medium">No transactions found.</p>
                                        ) : (
                                            transactions.map((trans: any, i) => (
                                                <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-2xl">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${trans.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {trans.type === 'credit' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[var(--text-primary)]">{trans.description}</p>
                                                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                                                                {trans.createdAt?.seconds ? new Date(trans.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-black ${trans.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                            {trans.type === 'credit' ? '+' : '-'} ₦{Number(trans.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] font-black uppercase text-[var(--text-secondary)]">{trans.status}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'events':
                return (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-black">My Campus Events</h3>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-spark-red text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                            >
                                + List New Event
                            </button>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : myEvents.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)] animate-in fade-in duration-500">
                                <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                    <Ticket className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No events listed yet.</h3>
                                <p className="text-[var(--text-secondary)] font-medium">Create your first event to start attracting brand sponsors.</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-8 px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
                                >
                                    Get Started
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                {myEvents.map(event => (
                                    <div key={event.id} className="bg-[var(--bg-primary)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h4 className="text-2xl font-black mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{event.name}</h4>
                                                <p className="text-sm font-bold text-spark-red uppercase tracking-widest">{event.date}</p>
                                            </div>
                                            <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Published</span>
                                        </div>
                                        <p className="text-[var(--text-secondary)] text-sm mb-8 line-clamp-2 leading-relaxed">{event.description}</p>
                                        <div className="flex items-center justify-between mb-8 pb-8 border-b border-[var(--border-color)]">
                                            <div>
                                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Target Funding</p>
                                                <p className="text-xl font-black text-[var(--text-primary)]">₦{Number(event.targetSponsorship).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="w-full py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all"
                                        >
                                            Manage Sponsorships
                                        </button>
                                        <button
                                            onClick={() => handleEditEvent(event)}
                                            className="w-full py-3 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-sm mt-2 flex items-center justify-center gap-2"
                                        >
                                            <Edit className="w-4 h-4" /> Edit Event
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className="w-full py-3 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all text-sm mt-2 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Event
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'ambassadors':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Find Talent</h3>
                            <p className="text-[var(--text-secondary)] mt-1">Discover and connect with student ambassadors and influencers for your events.</p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : ambassadors.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                    <Search className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Talent Found</h3>
                                <p className="text-[var(--text-secondary)]">No student ambassadors are registered yet. Check back soon!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ambassadors.map(profile => (
                                    <div key={profile.id} className="group bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                        <div className="h-20 bg-gradient-to-r from-spark-red/10 to-orange-50"></div>
                                        <div className="px-6 pb-6 -mt-8">
                                            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] shadow-lg flex items-center justify-center text-2xl font-black text-spark-red overflow-hidden mb-3">
                                                {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} /> : (profile.name || '?').charAt(0)}
                                            </div>
                                            <h3 className="font-black text-lg text-[var(--text-primary)]">{profile.name}</h3>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{profile.university || 'Campus Ambassador'}</p>
                                            {(profile.email || profile.phoneNumber) && (
                                                <div className="space-y-1 mb-2">
                                                    {profile.email && (
                                                        <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                            <span className="truncate max-w-[150px]">{profile.email}</span>
                                                        </a>
                                                    )}
                                                    {profile.phoneNumber && (
                                                        <a href={`tel:${profile.phoneNumber}`} className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                            <span>{profile.phoneNumber}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {profile.bio && <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 mt-2 leading-relaxed">{profile.bio}</p>}
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => handleOpenProposalModal(profile)}
                                                    className="flex-1 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100"
                                                >
                                                    Propose Gig
                                                </button>
                                                <button className="w-10 h-10 bg-spark-black text-white rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'proposals':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : proposals.length === 0 ? (
                            <DashboardPlaceholder
                                title="No Partnerships"
                                icon={<Handshake className="w-10 h-10" />}
                                description="You haven't received any brand sponsorship requests yet. Keep hosting great events to get noticed!"
                            />
                        ) : (
                            <div className="grid gap-6">
                                {proposals.map((p) => {
                                    const isSender = p.senderId === (orgProfile?.id || auth.currentUser?.uid);
                                    const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                    const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                    return (
                                        <div key={p.id} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner">
                                                    {otherParty?.imageUrl ? <img src={otherParty.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : (displayName.charAt(0))}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)]">{displayName}</h4>
                                                    <p className="text-xs text-spark-red font-black uppercase tracking-widest">{otherParty.role}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => setSelectedProposal(p)}
                                                    className="px-6 py-2 bg-spark-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                                                >
                                                    View Proposal
                                                </button>
                                                {p.status !== 'pending' && (
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'accepted' ? 'bg-green-50 text-green-600' :
                                                        p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                            'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'brands':
                return (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : brands.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Brands Found</h3>
                                <p className="text-[var(--text-secondary)]">Check back later as more brands join the network!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {brands.map(profile => (
                            <div key={profile.id} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-6 flex items-center space-x-4">
                                <div className="w-14 h-14 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-xl font-black text-spark-red">
                                    {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover rounded-xl" /> : (profile.name || '?').charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[var(--text-primary)] truncate">{profile.name}</h4>
                                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest truncate">{profile.industry || 'Market Leader'}</p>
                                    {profile.email && (
                                        <p className="text-[9px] text-[var(--text-secondary)] truncate">{profile.email}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setSelectedBrand(profile)}
                                    className="px-4 py-2 bg-spark-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                                >
                                    Propose
                                </button>
                            </div>
                        ))}
                            </div>
                        )}
                    </div>
                );
            case 'resources':
                const resources = [
                    { icon: <FileText className="w-8 h-8" />, title: 'Sponsorship Proposal Template', desc: 'A professionally designed deck to pitch your event to brands. Includes value metrics, audience data, and ROI projections.', tag: 'Template', href: '#' },
                    { icon: <Mail className="w-8 h-8" />, title: 'Brand Outreach Email Scripts', desc: '5 proven cold email templates to contact brand managers. Structured with subject lines, hooks, and calls to action.', tag: 'Scripts', href: '#' },
                    { icon: <BarChart3 className="w-8 h-8" />, title: 'Event Budget Planner', desc: 'A comprehensive spreadsheet template to plan your event budget, track sponsorship income, and manage expenses.', tag: 'Tool', href: '#' },
                    { icon: <Target className="w-8 h-8" />, title: 'Audience Demographics Guide', desc: 'Learn how to capture and present your audience data to attract sponsors. Includes a template for building a media kit.', tag: 'Guide', href: '#' },
                    { icon: <Handshake className="w-8 h-8" />, title: 'Partnership Agreement Template', desc: 'A legal-ready template for formalizing brand partnership agreements. Covers deliverables, payment terms, and IP rights.', tag: 'Legal', href: '#' },
                    { icon: <Smartphone className="w-8 h-8" />, title: 'Social Media Promotion Checklist', desc: 'A step-by-step checklist for promoting your event and sponsor brands across Instagram, X, and TikTok.', tag: 'Checklist', href: '#' },
                    {
                        icon: <Lightbulb className="w-8 h-8" />, title: 'Event ROI Calculator', desc: "Quantify your event's impact for sponsors. Calculate reach, engagement rates, estimated media value, and brand awareness scores.", tag: 'Tool', href: '#'
                    },
                    { icon: <Award className="w-8 h-8" />, title: 'Post-Event Report Template', desc: 'A polished report template to share results with sponsors after the event. Build long-term brand relationships with transparency.', tag: 'Template', href: '#' },
                    { icon: <GraduationCap className="w-8 h-8" />, title: 'Sponsorship 101: Video Course', desc: 'A curated series of short-form videos on how to structure, pitch, and close sponsorship deals as a student organization.', tag: 'Course', href: '#' },
                ];
                const tagColors: Record<string, string> = {
                    Template: 'bg-blue-50 text-blue-600',
                    Scripts: 'bg-purple-50 text-purple-600',
                    Tool: 'bg-green-50 text-green-600',
                    Guide: 'bg-orange-50 text-orange-600',
                    Legal: 'bg-yellow-50 text-yellow-700',
                    Checklist: 'bg-teal-50 text-teal-600',
                    Course: 'bg-pink-50 text-pink-600',
                };
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-br from-spark-red to-red-500 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <BookOpen className="w-32 h-32" />
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">Resource Hub</h2>
                            <p className="text-white/80 text-lg font-medium max-w-xl">Everything you need to run successful events, secure sponsors, and grow your student organization.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.map((r, i) => (
                                <a key={i} href={r.href} className="group bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-7 hover:shadow-xl hover:border-spark-red/20 transition-all block">
                                    <div className="w-14 h-14 bg-spark-red/5 text-spark-red rounded-xl flex items-center justify-center mb-5 group-hover:bg-spark-red group-hover:text-white transition-all">
                                        {r.icon}
                                    </div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-black text-[var(--text-primary)] text-base leading-snug group-hover:text-spark-red transition-colors">{r.title}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${tagColors[r.tag] || 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>{r.tag}</span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.desc}</p>
                                    <div className="mt-5 flex items-center gap-2 text-spark-red font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Access Resource</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </div>
                                </a>
                            ))}
                        </div>

                        <div className="bg-[var(--bg-primary)] rounded-[2rem] p-8 border border-[var(--border-color)]">
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">💬 Need more?</h3>
                            <p className="text-[var(--text-secondary)] mb-6">Request a custom resource or template for your organization's specific needs. Our team will create it for you.</p>
                            <button className="px-6 py-3 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all">
                                Request a Resource
                            </button>
                        </div>
                    </div>
                );
            case 'profile':
                return <ProfileView user={orgProfile} onUpdate={fetchOrgData} />;
            default:
                return <div>Coming Soon</div>;
        }
    };

    return (
        <DashboardShell
            role={UserRole.StudentOrg}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={orgProfile?.name || "Student Leader"}
            userSub={orgProfile?.university || "Campus Organizer"}
            userImage={orgProfile?.imageUrl}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        >
            {selectedBrand && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedBrand(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="h-48 bg-gradient-to-br from-spark-red to-red-400 relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-[var(--bg-primary)] p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-red">
                                    {selectedBrand.imageUrl ? <img src={selectedBrand.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : (selectedBrand.name || '?').charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-[var(--text-primary)] mb-1">{selectedBrand.name}</h3>
                                    <p className="text-spark-red font-black uppercase tracking-widest text-sm">{selectedBrand.role}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 opacity-60">About this Brand</p>
                                    <p className="text-[var(--text-primary)] font-bold text-lg">{selectedBrand.bio || `${selectedBrand.name} is a leading partner in the ${selectedBrand.industry || 'Campus Spark'} ecosystem.`}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedBrand.industry && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Industry</p>
                                            <p className="font-black text-[var(--text-primary)] text-sm">{selectedBrand.industry}</p>
                                        </div>
                                    )}
                                    {selectedBrand.companySize && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Company Size</p>
                                            <p className="font-black text-[var(--text-primary)] text-sm">{selectedBrand.companySize}</p>
                                        </div>
                                    )}
                                    {selectedBrand.email && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Email</p>
                                            <p className="font-bold text-[var(--text-primary)] text-sm">{selectedBrand.email}</p>
                                        </div>
                                    )}
                                    {selectedBrand.website && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Website</p>
                                            <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer" className="font-bold text-spark-red text-sm hover:underline">{selectedBrand.website}</a>
                                        </div>
                                    )}
                                </div>

                                {(selectedBrand.instagram || selectedBrand.twitter || selectedBrand.linkedin) && (
                                    <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 opacity-60">Social Media</p>
                                        <div className="flex gap-3 flex-wrap">
                                            {selectedBrand.instagram && (
                                                <a href={selectedBrand.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-primary)] rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Instagram
                                                </a>
                                            )}
                                            {selectedBrand.twitter && (
                                                <a href={selectedBrand.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-primary)] rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Twitter
                                                </a>
                                            )}
                                            {selectedBrand.linkedin && (
                                                <a href={selectedBrand.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-[var(--bg-primary)] rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleOpenProposalModal(selectedBrand)}
                                disabled={proposing}
                                className="w-full py-6 bg-spark-black text-white font-black text-xl rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-3"
                            >
                                {proposing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending Proposal...
                                    </>
                                ) : 'Propose Sponsorship'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {renderContent()}

            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="fixed inset-0 bg-spark-black/40 backdrop-blur-md" onClick={() => !submitting && setShowCreateModal(false)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                        <div className="p-10 border-b border-[var(--border-color)] flex justify-between items-center">
                            <h3 className="text-3xl font-black text-[var(--text-primary)]">List New Event</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                    placeholder="e.g. Annual Tech Hackathon 2024"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Target (₦)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        placeholder="e.g. 500000"
                                        value={formData.targetSponsorship}
                                        onChange={(e) => setFormData({ ...formData, targetSponsorship: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold resize-none"
                                    placeholder="Describe your event and what sponsors get in return..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[2] py-5 bg-spark-red text-white font-black rounded-2xl text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Publishing...
                                        </>
                                    ) : 'List Event Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showProposalModal && proposalRecipient && (
                <ProposalFormModal
                    isOpen={showProposalModal}
                    onClose={() => setShowProposalModal(false)}
                    recipientName={proposalRecipient.name}
                    recipientId={proposalRecipient.id}
                    onSubmit={handleSendProposal}
                />
            )}

            <ProposalDetailsModal
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                proposal={selectedProposal}
                onUpdateStatus={handleUpdateStatus}
                isSender={selectedProposal?.senderId === (orgProfile?.id || auth.currentUser?.uid)}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
            />

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => setEditingEvent(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight">Edit Event</h2>
                                    <p className="text-[var(--text-secondary)] font-medium mt-1">Update your event details below.</p>
                                </div>
                                <button onClick={() => setEditingEvent(null)} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSaveEdit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Name</label>
                                    <input type="text" required value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Date</label>
                                    <input type="date" required value={editFormData.date} onChange={e => setEditFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description</label>
                                    <textarea required rows={3} value={editFormData.description} onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Target Sponsorship (₦)</label>
                                    <input type="number" required min="0" value={editFormData.targetSponsorship} onChange={e => setEditFormData(p => ({ ...p, targetSponsorship: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editSubmitting} className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50">
                                        {editSubmitting ? (
                                            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Saving...</>
                                        ) : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
};

export default OrgDashboard;
