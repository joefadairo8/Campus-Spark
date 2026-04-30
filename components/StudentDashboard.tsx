import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { WalletService } from '../WalletService';
import { Search, Zap, Rocket, Mail, Wallet, Clock, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const StudentDashboard: React.FC<{ 
    onNavigate: (page: string) => void, 
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, user }) => {
    const [currentSection, setCurrentSection] = useState('dashboard');
    const [activeTab, setActiveTab] = useState('gigs');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [proposing, setProposing] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalRecipient, setProposalRecipient] = useState<{ id: string, name: string } | null>(null);
    const [proposalInitialMessage, setProposalInitialMessage] = useState('');
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);

    // Gig application state
    const [myApplications, setMyApplications] = useState<any[]>([]); // All applications for this student
    const [myCampaigns, setMyCampaigns] = useState<any[]>([]); // Campaigns influencer is allocated to
    const [applyingToGig, setApplyingToGig] = useState<any>(null); // Gig being applied to
    const [pitchText, setPitchText] = useState('');
    const [pitchSubmitting, setPitchSubmitting] = useState(false);
    
    // Withdrawal states
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({ bank: '', account: '', name: '' });
    const [withdrawing, setWithdrawing] = useState(false);

    // Submission states
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [submissionData, setSubmissionData] = useState({ link: '', text: '' });
    const [submittingWork, setSubmittingWork] = useState(false);

    const sidebarItems = [
        { id: 'dashboard', label: 'Work Hub', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
        { id: 'wallet', label: 'Earnings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
        { id: 'profile', label: 'My Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
    ];

    const tabs = [
        { id: 'gigs', label: 'Opportunities' },
        { id: 'my-campaigns', label: 'My Campaigns', hasBadge: myCampaigns.some(c => c.status === 'selected' || c.status === 'in_progress') },
        { id: 'proposals', label: 'Offers', hasBadge: proposals.some(p => p.status === 'pending' && p.recipientId === userProfile?.id) },
        { id: 'brands', label: 'Explore Brands' },
        { id: 'community', label: 'Network' },
        { id: 'events', label: 'Campus Events' },
    ];

    const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", (user as any).uid || (user as any).id));
                if (userDoc.exists()) {
                    setUserProfile({ id: (user as any).uid || (user as any).id, ...userDoc.data() });
                }
            } catch (e) {
                console.error("Profile load error:", e);
            }
        }
    };

    const fetchProposals = async () => {
        if (!userProfile?.id) return;
        try {
            const res = await apiClient.get(`proposals?senderId=${userProfile.id}&recipientId=${userProfile.id}`);
            setProposals(res.data);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const res = await apiClient.get('applications/mine');
            setMyApplications(res.data);
        } catch (e) {
            console.error('Error fetching applications:', e);
        }
    };

    const fetchMyCampaigns = async () => {
        if (!userProfile?.id) return;
        try {
            const campaigns = await WalletService.getAllocationsByInfluencer(userProfile.id);
            // Enrich with campaign details from gigs collection
            const enriched = await Promise.all(campaigns.map(async (c) => {
                const gigDoc = await getDoc(doc(db, 'gigs', c.campaignId));
                return { ...c, campaign: gigDoc.exists() ? gigDoc.data() : null };
            }));
            setMyCampaigns(enriched);
        } catch (e) {
            console.error('Error fetching campaigns:', e);
        }
    };

    useEffect(() => {
        const init = async () => {
            await fetchUserData();
        };
        init();
    }, []);

    useEffect(() => {
        if (userProfile?.id) {
            fetchProposals();
            fetchMyApplications();
            fetchMyCampaigns();
        }
    }, [userProfile]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentSection !== 'dashboard') {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                let items: any[] = [];
                if (activeTab === 'gigs') {
                    const res = await apiClient.get('gigs');
                    items = (res.data || []).filter((g: any) => g.status === 'open');
                } else if (activeTab === 'brands') {
                    const res = await apiClient.get(`users?role=${encodeURIComponent(UserRole.Brand)}`);
                    items = res.data;
                } else if (activeTab === 'organizations') {
                    const res = await apiClient.get(`users?role=${encodeURIComponent(UserRole.StudentOrg)}`);
                    items = res.data;
                } else if (activeTab === 'community') {
                    const res = await apiClient.get(`users?role=${encodeURIComponent(UserRole.Ambassador)}`);
                    // Filter out self
                    items = res.data.filter((u: any) => u.id !== userProfile?.id);
                } else if (activeTab === 'events') {
                    const res = await apiClient.get('events');
                    items = res.data;
                } else if (activeTab === 'proposals') {
                    await fetchProposals();
                }

                if (activeTab !== 'proposals') {
                    console.log(`Setting data for tab ${activeTab}:`, items);
                    setData(items);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentSection, activeTab, userProfile]);

    const fetchWallet = async () => {
        if (currentSection === 'wallet' && userProfile?.id) {
            setWalletLoading(true);
            try {
                const w = await WalletService.getOrCreateWallet(userProfile.id);
                setWallet(w);
                
                // Fetch transactions
                const q = query(
                    collection(db, 'transactions'), 
                    where('userId', '==', userProfile.id),
                    orderBy('createdAt', 'desc'),
                    limit(10)
                );
                const transSnap = await getDocs(q);
                setTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Wallet fetch error:", e);
            } finally {
                setWalletLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [currentSection, userProfile]);

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.id || !withdrawalAmount) return;
        setWithdrawing(true);
        try {
            await WalletService.requestWithdrawal(
                userProfile.id, 
                Number(withdrawalAmount), 
                `${bankDetails.bank} | ${bankDetails.account} | ${bankDetails.name}`
            );
            alert('Withdrawal request submitted successfully!');
            setShowWithdrawModal(false);
            setWithdrawalAmount('');
            await fetchWallet();
        } catch (e: any) {
            alert(e.message || 'Withdrawal failed.');
        } finally {
            setWithdrawing(false);
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampaign) return;
        setSubmittingWork(true);
        try {
            await WalletService.updateAllocationSubmission(selectedCampaign.id, submissionData);
            alert('Work submitted successfully! The brand will review it shortly.');
            setSelectedCampaign(null);
            setSubmissionData({ link: '', text: '' });
            await fetchMyCampaigns();
        } catch (e) {
            console.error('Submission error:', e);
            alert('Failed to submit work.');
        } finally {
            setSubmittingWork(false);
        }
    };

    const handleAcceptOffer = async (offer: any) => {
        if (!window.confirm('Accept this campaign offer?')) return;
        try {
            // Update allocation status to in_progress
            await WalletService.updateAllocationStatus(offer.id, 'in_progress');
            alert('Offer accepted! You can now start working on this campaign.');
            await fetchProposals();
            await fetchMyCampaigns();
            setActiveTab('my-campaigns');
        } catch (e) {
            console.error('Accept offer error:', e);
            alert('Failed to accept offer.');
        }
    };

    const handleOpenApplyModal = (gig: any) => {
        setApplyingToGig(gig);
        setPitchText('');
    };

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!applyingToGig) return;
        setPitchSubmitting(true);
        try {
            await apiClient.post(`gigs/${applyingToGig.id}/apply`, { pitch: pitchText });
            alert(`Application submitted for "${applyingToGig.title}"! The brand will review your pitch.`);
            setApplyingToGig(null);
            setPitchText('');
            await fetchMyApplications();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit application.');
        } finally {
            setPitchSubmitting(false);
        }
    };

    const handleOpenProposalModal = (brand: any) => {
        setProposalRecipient({ id: brand.id, name: brand.name });
        setProposalInitialMessage('');
        setShowProposalModal(true);
    };

    const handleContactHost = (event: any) => {
        if (!event.host) {
            alert('Cannot contact host: Host information is missing for this event.');
            return;
        }
        setProposalRecipient({ id: event.host.id, name: event.host.name || event.hostName });
        setProposalInitialMessage(`Hi ${event.hostName}, I'm interested in volunteering for your event "${event.name}".`);
        setShowProposalModal(true);
        setSelectedEvent(null);
    };

    // Helper: get this student's application for a specific gig
    const getMyApplication = (gigId: string) => myApplications.find((a: any) => a.gigId === gigId);


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
            fetchProposals();
        } catch (error) {
            console.error("Update status error:", error);
        }
    };

    const renderDashboardContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div>
                </div>
            );
        }

        const isEmpty = (activeTab === 'proposals' ? proposals.length : data.length) === 0;

        if (isEmpty) {
            return (
                <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)] animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                        <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No {activeTab.replace('-', ' ')} found yet.</h3>
                    <p className="text-[var(--text-secondary)] font-medium">The network is just igniting. Check back soon!</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'gigs':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(gig => {
                            const myApp = getMyApplication(gig.id);
                            const myCamp = myCampaigns.find(c => c.campaignId === gig.id);
                            
                            let statusBadge = { label: 'Open', classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' };
                            if (myCamp) {
                                const s = myCamp.status;
                                statusBadge = s === 'paid' ? { label: 'Paid', classes: 'bg-green-500/20 text-green-800 dark:text-green-300 border border-green-500/30' } :
                                              s === 'approved' ? { label: 'Approved', classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' } :
                                              s === 'submitted' ? { label: 'Submitted', classes: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' } :
                                              { label: 'Accepted', classes: 'bg-spark-red/10 text-spark-red border border-spark-red/20' };
                            } else if (myApp) {
                                statusBadge = myApp.status === 'pending' ? { label: 'Applied', classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' } :
                                              myApp.status === 'rejected' ? { label: 'Not Selected', classes: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]' } :
                                              { label: 'Open', classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' };
                            }

                            return (
                                <div key={gig.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all flex flex-col p-8 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-xl font-black text-spark-red border border-spark-red/10">{(gig.brand || gig.brandName || '⚡').charAt(0)}</div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.classes}`}>{statusBadge.label}</span>
                                    </div>
                                    <h3 className="font-black text-xl mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{gig.title}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">{gig.brand || gig.brandName || 'Brand'}</p>
                                    <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1 line-clamp-3">{gig.description || gig.brief || 'No description provided.'}</p>
                                    
                                    <div className="bg-[var(--bg-secondary)] dark:bg-spark-black/20 rounded-2xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>Reward</span>
                                            <span className="text-[var(--text-primary)]">₦{(gig.reward || gig.budget || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>Deadline</span>
                                            <span className="text-[var(--text-primary)]">{gig.deadline || 'Ongoing'}</span>
                                        </div>
                                    </div>

                                    {myCamp ? (
                                        <button onClick={() => { setSelectedCampaign(myCamp); setActiveTab('my-campaigns'); }} className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-2xl hover:bg-spark-red hover:text-white transition-all text-sm shadow-lg shadow-black/5">
                                            View in My Campaigns
                                        </button>
                                    ) : myApp ? (
                                        <div className="w-full py-4 bg-spark-black text-white font-black rounded-2xl text-center text-sm border border-transparent shadow-lg shadow-black/10">
                                            {myApp.status === 'pending' ? 'Application Pending' : 'Application Closed'}
                                        </div>
                                    ) : (
                                        <button onClick={() => handleOpenApplyModal(gig)} className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-2xl hover:bg-spark-red hover:text-white transition-all text-sm shadow-lg shadow-black/5">
                                            Apply to Campaign
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            case 'my-campaigns':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {myCampaigns.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                    <Rocket className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Active Campaigns</h3>
                                <p className="text-[var(--text-secondary)] font-medium mb-8">Apply to opportunities or accept offers to start earning.</p>
                                <button onClick={() => setActiveTab('gigs')} className="px-8 py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100">
                                    Browse Opportunities
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {myCampaigns.map(camp => (
                                    <div key={camp.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center font-black text-spark-red shadow-inner">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)]">{camp.campaign?.title}</h4>
                                                <p className="text-xs font-black text-spark-red uppercase tracking-widest">{camp.campaign?.brand}</p>
                                                <div className="flex gap-3 mt-2">
                                                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">₦{camp.amount?.toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-300">•</span>
                                                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Due: {camp.campaign?.deadline || '---'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                camp.status === 'paid' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                                                camp.status === 'approved' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                                camp.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                                                'bg-spark-red/10 text-spark-red border-spark-red/20'
                                            }`}>
                                                {camp.status}
                                            </span>
                                            <button 
                                                onClick={() => setSelectedCampaign(camp)}
                                                className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-xl hover:bg-spark-red hover:text-white transition-all text-xs shadow-sm"
                                            >
                                                Manage Work
                                            </button>
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
                        {proposals.length === 0 ? (
                            <div className="bg-[var(--bg-primary)] p-12 rounded-[3rem] border-2 border-dashed border-[var(--border-color)] text-center">
                                <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                    <Mail className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Campaign Offers</h3>
                                <p className="text-[var(--text-secondary)] font-medium">When brands send you direct campaign offers, they will appear here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                            {proposals.map((p) => {
                                const isSender = p.senderId === (userProfile?.id || auth.currentUser?.uid);
                                const isDirectOffer = p.status === 'pending' && !isSender;
                                const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                return (
                                    <div key={p.id} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner">
                                                {otherParty.imageUrl ? <img src={otherParty.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : (displayName.charAt(0))}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)]">{displayName}</h4>
                                                <p className="text-xs text-spark-red font-black uppercase tracking-widest">{otherParty.role}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                    {p.budget && <span className="text-[10px] bg-green-50 text-green-600 px-2 rounded-full font-bold">Offer: {p.budget}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            {isDirectOffer ? (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleAcceptOffer(p)}
                                                        className="px-6 py-3 bg-spark-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                                                    >
                                                        Accept Offer
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                                        className="px-6 py-3 bg-spark-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all border border-transparent"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setSelectedProposal(p)}
                                                        className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-spark-red hover:text-white transition-all border border-transparent"
                                                    >
                                                        View Details
                                                    </button>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${p.status === 'accepted' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' :
                                                        p.status === 'rejected' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' :
                                                            'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                                        }`}>
                                                        {p.status}
                                                    </span>
                                                </>
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
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(profile => (
                            <div key={profile.id} className="group bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-2xl font-black text-spark-red overflow-hidden flex-shrink-0">
                                        {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} /> : (profile.name || '?').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-base line-clamp-1 text-[var(--text-primary)]">{profile.name}</h3>
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-widest">{profile.industry || 'Brand'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedBrand(profile)}
                                    className="w-full py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black rounded-xl hover:bg-spark-red hover:text-white transition-all text-sm"
                                >
                                    View Brand
                                </button>
                            </div>
                        ))}
                    </div>
                );

            case 'community':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(member => (
                            <div key={member.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 text-center">
                                <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] mx-auto mb-4 flex items-center justify-center text-3xl font-black text-spark-red overflow-hidden">
                                    {member.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover" alt={member.name} /> : (member.name || '?').charAt(0)}
                                </div>
                                <h3 className="font-black text-lg text-[var(--text-primary)]">{member.name}</h3>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">{member.university || 'Influencer'}</p>
                                <button
                                    onClick={() => {
                                        setProposalRecipient({ id: member.id, name: member.name });
                                        setProposalInitialMessage(`Hey ${member.name}, I'd love to collaborate on a campaign together!`);
                                        setShowProposalModal(true);
                                    }}
                                    className="w-full py-2.5 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all text-xs"
                                >
                                    Connect
                                </button>
                            </div>
                        ))}
                    </div>
                );

            case 'events':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(event => (
                            <div key={event.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                                <div className="h-4 bg-spark-red"></div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="mb-4 bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-spark-red tracking-widest inline-block w-max">{new Date(event.date).toLocaleDateString()}</div>
                                    <h3 className="text-xl font-black mb-2 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{event.name}</h3>
                                    <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3">{event.description}</p>
                                    <button
                                        onClick={() => setSelectedEvent(event)}
                                        className="text-spark-red font-black text-sm uppercase tracking-widest hover:underline underline-offset-4 mt-auto text-left"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderMainContent = () => {
        if (currentSection === 'wallet') {
            return (
                <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                    {walletLoading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                    ) : (
                        <>
                            {/* Earnings Summary */}
                            <div className="grid md:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        { label: 'Pending Payouts', value: `₦0.00`, icon: <Clock className="w-6 h-6" />, color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' },
                                        { label: 'Total Earnings', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                                        </div>
                                    ))}
                            </div>

                            {/* Wallet Actions */}
                            <div className="bg-spark-red rounded-[2.5rem] p-10 text-white shadow-xl shadow-red-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <h3 className="text-3xl font-black mb-2 text-white">Withdraw Funds</h3>
                                    <p className="text-red-100 font-medium">Ready to cash out? Send your available balance to your bank account.</p>
                                </div>
                                <button 
                                    onClick={() => setShowWithdrawModal(true)}
                                    disabled={(wallet?.balance || 0) < 1000}
                                    className="px-12 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
                                >
                                    {(wallet?.balance || 0) < 1000 ? 'Min ₦1,000' : 'Request Withdrawal'}
                                </button>
                            </div>

                            {/* Transaction History */}
                            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10">
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8">Transaction History</h3>
                                <div className="space-y-4">
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-10 text-[var(--text-secondary)] italic font-medium">No transactions recorded yet.</div>
                                    ) : (
                                        transactions.map((trans: any, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${trans.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {trans.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                        </div>
                                                    <div>
                                                        <p className="font-black text-[var(--text-primary)]">{trans.description}</p>
                                                        <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">
                                                            {trans.createdAt?.seconds ? new Date(trans.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-black text-lg ${trans.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                        {trans.type === 'credit' ? '+' : '-'} ₦{Number(trans.amount).toLocaleString()}
                                                    </p>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                                        trans.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>{trans.status}</span>
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
        } else if (currentSection === 'profile') {
            return <ProfileView user={userProfile} onUpdate={fetchUserData} />;
        }

        // Default Dashboard View (Tabs)
        return (
            <div className="space-y-8">
                {/* Tabs Header */}
                <div className="flex flex-wrap gap-4 border-b border-[var(--border-color)] pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-t-2xl font-black text-sm uppercase tracking-wider transition-all relative ${activeTab === tab.id
                                ? 'bg-[var(--bg-primary)] text-spark-red border-b-2 border-spark-red shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                                }`}
                        >
                            {tab.label}
                            {tab.hasBadge && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-spark-red rounded-full animate-pulse ring-2 ring-white"></span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {renderDashboardContent()}
            </div>
        );
    };

    return (
        <>
        <DashboardShell
            role={UserRole.Ambassador}
            activeView={currentSection}
            onViewChange={setCurrentSection}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={userProfile?.name || "Spark Member"}
            userSub={userProfile?.university || "Influencer"}
            userImage={userProfile?.imageUrl}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            walletStrip={
                <div className="flex items-center gap-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-1.5 shadow-sm">
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Available</p>
                        <p className="text-sm font-black text-green-600">₦{(wallet?.balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border-color)]"></div>
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Pending</p>
                        <p className="text-sm font-black text-[var(--text-primary)]">₦{(wallet?.pending || 0).toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={() => setShowWithdrawModal(true)}
                        className="bg-spark-red text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-700 transition-all"
                    >
                        Withdraw Funds
                    </button>
                </div>
            }
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
                                    {(selectedBrand.name || '?').charAt(0)}
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
                                                <a href={selectedBrand.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
                                                    Instagram
                                                </a>
                                            )}
                                            {selectedBrand.twitter && (
                                                <a href={selectedBrand.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
                                                    Twitter
                                                </a>
                                            )}
                                            {selectedBrand.linkedin && (
                                                <a href={selectedBrand.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
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
                                className="w-full py-6 bg-spark-black text-white font-black text-xl rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                            >
                                {proposing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Sending Proposal...
                                    </>
                                ) : 'Propose Partnership'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ---- MODALS ---- */}

            {showProposalModal && proposalRecipient && (
                <ProposalFormModal
                    isOpen={showProposalModal}
                    onClose={() => setShowProposalModal(false)}
                    recipientName={proposalRecipient.name}
                    recipientId={proposalRecipient.id}
                    initialMessage={proposalInitialMessage}
                    onSubmit={handleSendProposal}
                />
            )}

            <ProposalDetailsModal
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                proposal={selectedProposal}
                onUpdateStatus={handleUpdateStatus}
                isSender={selectedProposal?.senderId === userProfile?.id}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                userRole="Student"
                onContact={handleContactHost}
            />

            {renderMainContent()}
        </DashboardShell>

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Withdraw Funds</h3>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleWithdraw} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Available: ₦{(wallet?.balance || 0).toLocaleString()}</label>
                                <input 
                                    type="number" 
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    placeholder="Amount to withdraw"
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <div className="grid gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Bank Name"
                                    value={bankDetails.bank}
                                    onChange={(e) => setBankDetails({...bankDetails, bank: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Number"
                                    value={bankDetails.account}
                                    onChange={(e) => setBankDetails({...bankDetails, account: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Name"
                                    value={bankDetails.name}
                                    onChange={(e) => setBankDetails({...bankDetails, name: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={withdrawing || !withdrawalAmount}
                                className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                            >
                                {withdrawing ? 'Processing Request...' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaign Submission Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[3rem] border border-[var(--border-color)] p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedCampaign.campaign?.title}</h3>
                                <p className="text-xs font-black text-spark-red uppercase tracking-widest">{selectedCampaign.campaign?.brand}</p>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-[var(--bg-secondary)] dark:bg-spark-black/20 p-6 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] mb-4">Guidelines</p>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{selectedCampaign.campaign?.description}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg-primary)] dark:bg-spark-black/10 border border-[var(--border-color)] rounded-2xl">
                                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Reward</p>
                                    <p className="text-lg font-black text-green-600">₦{selectedCampaign.amount?.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-[var(--bg-primary)] dark:bg-spark-black/10 border border-[var(--border-color)] rounded-2xl">
                                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Status</p>
                                    <p className="text-lg font-black text-spark-red uppercase tracking-widest text-xs">{selectedCampaign.status}</p>
                                </div>
                            </div>
                        </div>

                        {selectedCampaign.status === 'in_progress' || selectedCampaign.status === 'selected' ? (
                            <form onSubmit={handleSubmitWork} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Submission Link (Social Post, Content, etc)</label>
                                    <input 
                                        type="url" 
                                        value={submissionData.link}
                                        onChange={(e) => setSubmissionData({...submissionData, link: e.target.value})}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                        placeholder="https://instagram.com/p/..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Notes for the Brand</label>
                                    <textarea 
                                        rows={4}
                                        value={submissionData.text}
                                        onChange={(e) => setSubmissionData({...submissionData, text: e.target.value})}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)] resize-none"
                                        placeholder="Any additional info about your work..."
                                    ></textarea>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submittingWork}
                                    className="w-full py-4 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all disabled:opacity-50"
                                >
                                    {submittingWork ? 'Submitting...' : 'Submit Work for Review'}
                                </button>
                            </form>
                        ) : (
                            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                                <p className="text-yellow-700 font-bold text-sm text-center">
                                    {selectedCampaign.status === 'submitted' ? 'Work is under review. You\'ll be notified once approved.' : 
                                     selectedCampaign.status === 'approved' ? 'Work approved! Funds will be released to your balance shortly.' : 
                                     'Campaign finalized.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Application Pitch Modal */}
            {applyingToGig && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-lg rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Apply to Campaign</h3>
                            <button onClick={() => setApplyingToGig(null)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="mb-6">
                            <h4 className="font-black text-lg text-spark-red">{applyingToGig.title}</h4>
                            <p className="text-xs font-black text-[var(--text-secondary)] uppercase">{applyingToGig.brand}</p>
                        </div>
                        <form onSubmit={handleSubmitApplication} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Your Pitch (Why should we pick you?)</label>
                                <textarea 
                                    rows={5}
                                    value={pitchText}
                                    onChange={(e) => setPitchText(e.target.value)}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)] resize-none"
                                    placeholder="Highlight your relevant experience or audience engagement..."
                                    required
                                ></textarea>
                            </div>
                            <button 
                                type="submit" 
                                disabled={pitchSubmitting || !pitchText}
                                className="w-full py-4 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all disabled:opacity-50"
                            >
                                {pitchSubmitting ? 'Submitting Application...' : 'Submit Pitch'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentDashboard;
