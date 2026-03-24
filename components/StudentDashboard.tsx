
import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';

const StudentDashboard: React.FC<{ onNavigate: (page: string) => void, onLogout: () => void }> = ({ onNavigate, onLogout }) => {
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
    const [walletData, setWalletData] = useState<{ earnings: number; pending: number; completed: number; gigs: any[] }>({ earnings: 0, pending: 0, completed: 0, gigs: [] });
    // Gig application state
    const [myApplications, setMyApplications] = useState<any[]>([]); // All applications for this student
    const [applyingToGig, setApplyingToGig] = useState<any>(null); // Gig being applied to
    const [pitchText, setPitchText] = useState('');
    const [pitchSubmitting, setPitchSubmitting] = useState(false);
    const [reportGig, setReportGig] = useState<any>(null); // Gig being reported on
    const [reportText, setReportText] = useState('');
    const [reportLink, setReportLink] = useState('');
    const [reportImageUrl, setReportImageUrl] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg> },
        { id: 'wallet', label: 'My Wallet', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg> },
        { id: 'profile', label: 'My Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
    ];

    const tabs = [
        { id: 'gigs', label: 'Available Gigs' },
        { id: 'proposals', label: 'My Proposals', hasBadge: proposals.some(p => p.status === 'pending' && p.recipientId === userProfile?.id) },
        { id: 'brands', label: 'Explore Brands' },
        { id: 'organizations', label: 'Student Orgs' },
        { id: 'community', label: 'Community' },
        { id: 'events', label: 'Campus Events' },
    ];

    const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", (user as any).uid || (user as any).id));
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                }
            } catch (e) {
                console.error("Profile load error:", e);
            }
        }
    };

    const fetchProposals = async () => {
        try {
            const res = await apiClient.get('proposals');
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

    useEffect(() => {
        fetchUserData();
        fetchProposals();
        fetchMyApplications();
    }, []);

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
                    console.log('Fetching gigs with status=open...');
                    const res = await apiClient.get('gigs?status=open');
                    console.log('Gigs API response:', res.data);
                    items = res.data;
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
            try {
                // Fetch completed gigs
                const completedRes = await apiClient.get(`gigs?studentId=${userProfile.id}&status=completed`);
                const completedGigs = completedRes.data;
                const totalEarnings = completedGigs.reduce((sum: number, gig: any) => sum + (Number(gig.reward) || 0), 0);

                // Fetch active/in_progress gigs
                const activeRes = await apiClient.get(`gigs?studentId=${userProfile.id}&status=in_progress`);
                const activeGigs = activeRes.data;

                setWalletData({
                    earnings: totalEarnings,
                    pending: 0, // Placeholder or calculate if needed
                    completed: completedGigs.length,
                    gigs: [...activeGigs, ...completedGigs]
                });
            } catch (e) {
                console.error("Wallet fetch error:", e);
            }
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [currentSection, userProfile]);

    const handleMarkComplete = async (gig: any) => {
        try {
            await apiClient.patch(`gigs/${gig.id}`, { status: 'completed' });
            alert(`Gig "${gig.title}" marked as complete! Reward added to wallet.`);
            fetchWallet();
        } catch (err) {
            console.error('Mark complete error:', err);
            alert('Failed to mark gig as complete.');
        }
    };

    const handleOpenProposalModal = (brand: any) => {
        setProposalRecipient({ id: brand.id, name: brand.name });
        setProposalInitialMessage('');
        setShowProposalModal(true);
    };

    const handleContactHost = (event: any) => {
        console.log('Contacting host for event:', event);
        if (!event.host) {
            alert('Cannot contact host: Host information is missing for this event.');
            return;
        }
        setProposalRecipient({ id: event.host.id, name: event.host.name || event.hostName });
        setProposalInitialMessage(`Hi ${event.hostName}, I'm interested in volunteering for your event "${event.name}".`);
        setShowProposalModal(true);
        setSelectedEvent(null); // Close event modal
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

    const handleOpenReportModal = (gig: any) => {
        setReportGig(gig);
        setReportText('');
        setReportLink('');
        setReportImageUrl('');
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportGig) return;
        setReportSubmitting(true);
        try {
            await apiClient.post(`gigs/${reportGig.id}/report`, {
                report: reportText,
                reportLink: reportLink,
                reportImageUrl: reportImageUrl
            });
            alert('Campaign report submitted! It is now under review by the brand.');
            setReportGig(null);
            await fetchMyApplications();
            await fetchWallet();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to submit report.');
        } finally {
            setReportSubmitting(false);
        }
    };

    // Helper: get this student's application for a specific gig
    const getMyApplication = (gigId: string) => myApplications.find((a: any) => a.gigId === gigId);


    const handleSendProposal = async (data: { recipientId: string; message: string; budget?: string; timeline?: string }) => {
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
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 animate-in fade-in duration-500">
                    <div className="text-6xl mb-6">🏜️</div>
                    <h3 className="text-2xl font-black text-spark-black mb-2">No {activeTab.replace('-', ' ')} found yet.</h3>
                    <p className="text-spark-gray font-medium">The network is just igniting. Check back soon!</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'gigs':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(gig => {
                            const myApp = getMyApplication(gig.id);
                            const isReviewing = myApp && myApp.status === 'pending';
                            const isRunning = myApp && myApp.status === 'accepted';
                            const isDone = myApp && myApp.status === 'rejected';
                            // Also check gig level status for running/completed
                            const gigStatus = gig.status;

                            let statusBadge = { label: 'Open', classes: 'bg-green-50 text-green-600' };
                            if (isReviewing) statusBadge = { label: '🔍 Reviewing', classes: 'bg-yellow-50 text-yellow-600' };
                            else if (isRunning) {
                                if (gigStatus === 'reviewing') {
                                    statusBadge = { label: '⏳ Pending Approval', classes: 'bg-orange-50 text-orange-600' };
                                } else {
                                    statusBadge = { label: '🟢 Running', classes: 'bg-blue-50 text-blue-600' };
                                }
                            }
                            else if (isDone) statusBadge = { label: '❌ Not selected', classes: 'bg-gray-100 text-gray-500' };
                            else if (gigStatus === 'in_progress' && !myApp) statusBadge = { label: 'In Progress', classes: 'bg-purple-50 text-purple-500' };
                            else if (gigStatus === 'reviewing' && !myApp) statusBadge = { label: 'Reviewing', classes: 'bg-yellow-50 text-yellow-500' };

                            return (
                                <div key={gig.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col p-8 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-xl font-black text-spark-red">{gig.brand?.charAt(0) || '⚡'}</div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.classes}`}>{statusBadge.label}</span>
                                    </div>
                                    <h3 className="font-black text-xl mb-1 group-hover:text-spark-red transition-colors">{gig.title}</h3>
                                    <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-3">{gig.brand}</p>
                                    <p className="text-spark-gray text-sm mb-6 flex-1 line-clamp-3">{gig.description}</p>
                                    <div className="border-t border-gray-50 pt-6 mt-auto">
                                        <div className="flex justify-between items-center mb-5">
                                            <span className="text-[10px] font-black text-spark-gray uppercase">Reward</span>
                                            <span className="text-xl font-black text-spark-black">₦{gig.reward?.toLocaleString() || '---'}</span>
                                        </div>
                                        {isRunning ? (
                                            gigStatus === 'reviewing' ? (
                                                <div className="w-full py-4 bg-orange-50 text-orange-700 font-black rounded-2xl text-center text-sm">
                                                    ⏳ Report Under Review
                                                </div>
                                            ) : (
                                                <button onClick={() => handleOpenReportModal(gig)} className="w-full py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all active:scale-[0.98]">
                                                    ✅ Submit Full Report
                                                </button>
                                            )
                                        ) : isReviewing ? (
                                            <div className="w-full py-4 bg-yellow-50 text-yellow-700 font-black rounded-2xl text-center text-sm">
                                                ⏳ Application Under Review
                                            </div>
                                        ) : isDone ? (
                                            <div className="w-full py-4 bg-gray-50 text-gray-500 font-black rounded-2xl text-center text-sm">
                                                Application Not Selected
                                            </div>
                                        ) : gigStatus === 'open' ? (
                                            <button onClick={() => handleOpenApplyModal(gig)} className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all active:scale-[0.98]">
                                                Apply to Join
                                            </button>
                                        ) : (
                                            <div className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-2xl text-center text-sm">Not Available</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'brands':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(profile => (
                            <div key={profile.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl font-black text-spark-red overflow-hidden flex-shrink-0">
                                        {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} /> : profile.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-base line-clamp-1">{profile.name}</h3>
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-widest">{profile.industry || 'Brand'}</span>
                                    </div>
                                </div>
                                {(profile.email || profile.phoneNumber) && (
                                    <div className="space-y-1.5 mb-4">
                                        {profile.email && (
                                            <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-xs text-spark-gray hover:text-spark-red transition-colors">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                <span className="truncate">{profile.email}</span>
                                            </a>
                                        )}
                                        {profile.phoneNumber && (
                                            <a href={`tel:${profile.phoneNumber}`} className="flex items-center gap-2 text-xs text-spark-gray hover:text-spark-red transition-colors">
                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                <span>{profile.phoneNumber}</span>
                                            </a>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedBrand(profile)}
                                    className="w-full py-3 bg-gray-50 text-spark-black font-black rounded-xl hover:bg-spark-red hover:text-white transition-all text-sm"
                                >
                                    View Brand
                                </button>
                            </div>
                        ))}
                    </div>
                );


            case 'organizations':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h3 className="text-xl font-black text-spark-black">Student Organizations</h3>
                            <p className="text-spark-gray mt-1">Connect with orgs on campus. Partner with them for events, content, and more.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.map(org => (
                                <div key={org.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                    <div className="h-20 bg-gradient-to-r from-orange-50 to-red-50"></div>
                                    <div className="px-6 pb-6 -mt-8">
                                        <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-black text-spark-red overflow-hidden mb-3">
                                            {org.imageUrl ? <img src={org.imageUrl} className="w-full h-full object-cover" alt={org.name} /> : org.name.charAt(0)}
                                        </div>
                                        <h3 className="font-black text-lg text-spark-black">{org.name}</h3>
                                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2">{org.university || 'Student Organization'}</p>
                                        {(org.email || org.phoneNumber) && (
                                            <div className="space-y-1 mb-4 flex flex-col items-start">
                                                {org.email && (
                                                    <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-[10px] text-spark-gray hover:text-spark-red transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                        <span className="truncate max-w-[150px]">{org.email}</span>
                                                    </a>
                                                )}
                                                {org.phoneNumber && (
                                                    <a href={`tel:${org.phoneNumber}`} className="flex items-center gap-2 text-[10px] text-spark-gray hover:text-spark-red transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                        <span>{org.phoneNumber}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {org.bio && <p className="text-sm text-spark-gray line-clamp-2 mb-4 leading-relaxed">{org.bio}</p>}
                                        <button
                                            onClick={() => {
                                                setProposalRecipient({ id: org.id, name: org.name });
                                                setProposalInitialMessage(`Hi ${org.name}, I'm a campus ambassador interested in partnering with your organization for upcoming events or campaigns.`);
                                                setShowProposalModal(true);
                                            }}
                                            className="w-full py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm shadow-lg shadow-red-100"
                                        >
                                            Propose Partnership
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'community':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h3 className="text-xl font-black text-spark-black">Community</h3>
                            <p className="text-spark-gray mt-1">Connect with other student influencers and campus ambassadors.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {data.map(member => (
                                <div key={member.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                    <div className="h-16 bg-gradient-to-r from-purple-50 to-pink-50"></div>
                                    <div className="px-5 pb-5 -mt-6 flex flex-col items-center text-center">
                                        <div className="w-14 h-14 rounded-xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-xl font-black text-spark-red overflow-hidden mb-2">
                                            {member.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover" alt={member.name} /> : member.name.charAt(0)}
                                        </div>
                                        <h3 className="font-black text-base text-spark-black">{member.name}</h3>
                                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">{member.university || 'Ambassador'}</p>
                                        {(member.email || member.phoneNumber) && (
                                            <div className="space-y-1 mb-2">
                                                {member.email && (
                                                    <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 text-[9px] text-spark-gray hover:text-spark-red transition-colors">
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                        <span className="truncate max-w-[120px]">{member.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {member.bio && <p className="text-xs text-spark-gray line-clamp-2 mb-3 leading-relaxed">{member.bio}</p>}
                                        <div className="flex items-center gap-2 mt-2 w-full">
                                            <button
                                                onClick={() => {
                                                    setProposalRecipient({ id: member.id, name: member.name });
                                                    setProposalInitialMessage(`Hey ${member.name}, I'd love to collaborate on a brand campaign or content project together!`);
                                                    setShowProposalModal(true);
                                                }}
                                                className="flex-1 py-2.5 bg-gray-50 text-spark-black font-black rounded-xl hover:bg-spark-black hover:text-white transition-all text-xs"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'events':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(event => (
                            <div key={event.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                                <div className="h-4 bg-spark-red"></div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="mb-4 bg-white/90 shadow-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-spark-red tracking-widest inline-block w-max">{new Date(event.date).toLocaleDateString()}</div>
                                    <h3 className="text-xl font-black mb-2 group-hover:text-spark-red transition-colors">{event.name}</h3>
                                    <p className="text-spark-gray text-sm mb-6 line-clamp-3">{event.description}</p>
                                    <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-6">
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="text-spark-red font-black text-sm uppercase tracking-widest hover:underline underline-offset-4"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'proposals':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid gap-6">
                            {proposals.map((p) => {
                                const isSender = p.senderId === userProfile?.id;
                                const otherParty = isSender ? p.recipient : p.sender;
                                return (
                                    <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner">
                                                {otherParty.imageUrl ? <img src={otherParty.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : otherParty.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-spark-black">{otherParty.name}</h4>
                                                <p className="text-xs text-spark-red font-black uppercase tracking-widest">{otherParty.role}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <p className="text-[10px] text-spark-gray font-bold uppercase tracking-wider">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                    {p.budget && <span className="text-[10px] bg-green-50 text-green-600 px-2 rounded-full font-bold">Budget: {p.budget}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button
                                                onClick={() => setSelectedProposal(p)}
                                                className="px-6 py-2 bg-gray-50 text-spark-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-200"
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
                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { label: 'Total Earnings', value: `₦${walletData.earnings.toLocaleString()}`, icon: '💰', color: 'bg-green-50 text-green-600' },
                            { label: 'Pending Payout', value: '₦0.00', icon: '⏳', color: 'bg-orange-50 text-orange-600' },
                            { label: 'Completed Gigs', value: walletData.completed, icon: '✅', color: 'bg-blue-50 text-blue-600' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                                <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-1">{stat.label}</p>
                                <h4 className="text-3xl font-black text-spark-black">{stat.value}</h4>
                            </div>
                        ))}
                    </div>

                    {/* Transactions Table Case */}
                    < div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10" >
                        <h3 className="text-2xl font-black text-spark-black mb-8">Recent Activity</h3>
                        <div className="space-y-6">
                            {walletData.gigs.length === 0 ? (
                                <p className="text-spark-gray text-center py-4">No recent activity.</p>
                            ) : (
                                walletData.gigs.map((gig: any, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-lg">⚡</div>
                                            <div>
                                                <p className="font-black text-spark-black">{gig.title}</p>
                                                <p className="text-xs text-spark-gray font-bold">{new Date(gig.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <div>
                                                <p className="font-black text-green-600">+ ₦{Number(gig.reward).toLocaleString()}</p>
                                                <p className="text-[10px] font-black uppercase text-spark-gray">{gig.status === 'completed' ? 'Success' : 'In Progress'}</p>
                                            </div>
                                            {gig.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleMarkComplete(gig)}
                                                    className="px-4 py-2 bg-spark-black text-white text-[10px] font-black rounded-lg hover:bg-spark-red transition-all"
                                                >
                                                    Mark Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            );
        } else if (currentSection === 'profile') {
            return <ProfileView user={userProfile} onUpdate={fetchUserData} />;
        }

        // Default Dashboard View (Tabs)
        return (
            <div className="space-y-8">
                {/* Tabs Header */}
                <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-t-2xl font-black text-sm uppercase tracking-wider transition-all relative ${activeTab === tab.id
                                ? 'bg-white text-spark-red border-b-2 border-spark-red shadow-sm'
                                : 'text-spark-gray hover:text-spark-black hover:bg-gray-50'
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
        <DashboardShell
            role={UserRole.Ambassador}
            activeView={currentSection}
            onViewChange={setCurrentSection}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={userProfile?.name || "Spark Member"}
            userSub={userProfile?.university || "Student Influencer"}
            userImage={userProfile?.imageUrl}
        >
            {selectedBrand && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedBrand(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="h-48 bg-gradient-to-br from-spark-red to-red-400 relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-white p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-red">
                                    {selectedBrand.name.charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-spark-black mb-1">{selectedBrand.name}</h3>
                                    <p className="text-spark-red font-black uppercase tracking-widest text-sm">{selectedBrand.role}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2 opacity-60">About this Brand</p>
                                    <p className="text-spark-black font-bold text-lg">{selectedBrand.bio || `${selectedBrand.name} is a leading partner in the ${selectedBrand.industry || 'Campus Spark'} ecosystem.`}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedBrand.industry && (
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Industry</p>
                                            <p className="font-black text-spark-black text-sm">{selectedBrand.industry}</p>
                                        </div>
                                    )}
                                    {selectedBrand.companySize && (
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Company Size</p>
                                            <p className="font-black text-spark-black text-sm">{selectedBrand.companySize}</p>
                                        </div>
                                    )}
                                    {selectedBrand.email && (
                                        <div className="p-4 bg-gray-50 rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Email</p>
                                            <p className="font-bold text-spark-black text-sm">{selectedBrand.email}</p>
                                        </div>
                                    )}
                                    {selectedBrand.website && (
                                        <div className="p-4 bg-gray-50 rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Website</p>
                                            <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer" className="font-bold text-spark-red text-sm hover:underline">{selectedBrand.website}</a>
                                        </div>
                                    )}
                                </div>

                                {(selectedBrand.instagram || selectedBrand.twitter || selectedBrand.linkedin) && (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-4 opacity-60">Social Media</p>
                                        <div className="flex gap-3 flex-wrap">
                                            {selectedBrand.instagram && (
                                                <a href={selectedBrand.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Instagram
                                                </a>
                                            )}
                                            {selectedBrand.twitter && (
                                                <a href={selectedBrand.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Twitter
                                                </a>
                                            )}
                                            {selectedBrand.linkedin && (
                                                <a href={selectedBrand.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
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
            {/* ---- APPLY TO GIG MODAL ---- */}
            {applyingToGig && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-spark-black">Apply to Gig</h2>
                                <p className="text-spark-gray mt-1 text-sm font-medium">{applyingToGig.title} · <span className="text-spark-red">{applyingToGig.brand}</span></p>
                            </div>
                            <button onClick={() => setApplyingToGig(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                            <p className="text-xs font-black text-spark-gray uppercase tracking-wider mb-1">Reward</p>
                            <p className="text-2xl font-black text-spark-black">₦{applyingToGig.reward?.toLocaleString()}</p>
                        </div>
                        <form onSubmit={handleSubmitApplication} className="space-y-5">
                            <div>
                                <label className="block text-sm font-black text-spark-black mb-2">How will you help this brand achieve their goal?</label>
                                <textarea
                                    required
                                    value={pitchText}
                                    onChange={e => setPitchText(e.target.value)}
                                    rows={5}
                                    placeholder="Tell the brand about your approach, your audience reach, your strategy, and why you're the perfect fit..."
                                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-spark-red resize-none transition-all"
                                />
                                <p className="text-xs text-spark-gray mt-1">{pitchText.length}/500 characters</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setApplyingToGig(null)} className="flex-1 py-4 border-2 border-gray-100 text-spark-gray font-black rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={pitchSubmitting || pitchText.trim().length < 20} className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {pitchSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Submitting...</> : '🚀 Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ---- COMPLETION REPORT MODAL ---- */}
            {reportGig && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-spark-black">Campaign Report</h2>
                                <p className="text-spark-gray mt-1 text-sm font-medium">{reportGig.title} · <span className="text-spark-red">{reportGig.brand}</span></p>
                            </div>
                            <button onClick={() => setReportGig(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-100">
                            <p className="text-sm font-black text-green-700">🎉 Great work! Submitting this report will mark the campaign as completed and your reward will be credited.</p>
                        </div>
                        <form onSubmit={handleSubmitReport} className="space-y-5">
                            <div>
                                <label className="block text-sm font-black text-spark-black mb-2">How was the campaign carried out? *</label>
                                <textarea
                                    required
                                    value={reportText}
                                    onChange={e => setReportText(e.target.value)}
                                    rows={4}
                                    placeholder="Describe what you did, the results you achieved, impact, etc..."
                                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-green-500 resize-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-spark-black mb-2">Evidence Link (Instagram, Drive, etc.)</label>
                                <input
                                    type="url"
                                    value={reportLink}
                                    onChange={e => setReportLink(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-spark-black mb-2">Evidence Image URL (Direct link)</label>
                                <input
                                    type="url"
                                    value={reportImageUrl}
                                    onChange={e => setReportImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-green-500 transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setReportGig(null)} className="flex-1 py-4 border-2 border-gray-100 text-spark-gray font-black rounded-2xl hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={reportSubmitting || reportText.trim().length < 20} className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {reportSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Submitting...</> : '🚀 Submit Report'}
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
    );
};

export default StudentDashboard;
