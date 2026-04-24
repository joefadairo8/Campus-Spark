
import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient } from '../firebase';
import { UserRole } from '../types';
import { STATES, UNIVERSITIES } from '../constants';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';

const BrandDashboard: React.FC<{ onNavigate: (page: string) => void, onLogout: () => void }> = ({ onNavigate, onLogout }) => {
    const [currentView, setCurrentView] = useState('directory');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedState, setSelectedState] = useState('All');
    const [selectedUni, setSelectedUni] = useState('All');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<any[]>([]);
    const [brandProfile, setBrandProfile] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [proposing, setProposing] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalRecipient, setProposalRecipient] = useState<{ id: string, name: string } | null>(null);
    const [proposalInitialMessage, setProposalInitialMessage] = useState('');
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaignForm, setCampaignForm] = useState({ title: '', brief: '', budget: '', deadline: '', category: 'Awareness' });
    const [campaignSubmitting, setCampaignSubmitting] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [editingGig, setEditingGig] = useState<any>(null);
    const [viewingApplicants, setViewingApplicants] = useState<any>(null); // Campaign whose applicants are being viewed
    const [applicants, setApplicants] = useState<any[]>([]);
    const [applicantsLoading, setApplicantsLoading] = useState(false);

    const fetchApplicants = async (campaign: any) => {
        setViewingApplicants(campaign);
        setApplicantsLoading(true);
        try {
            const res = await apiClient.get(`gigs/${campaign.id}/applications`);
            setApplicants(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Error fetching applicants:', e);
            setApplicants([]);
        } finally {
            setApplicantsLoading(false);
        }
    };

    const handleApplicationDecision = async (appId: string, status: 'accepted' | 'rejected') => {
        if (!viewingApplicants) return;
        try {
            await apiClient.patch(`gigs/${viewingApplicants.id}/applications/${appId}`, { status });
            // Refresh list
            const res = await apiClient.get(`gigs/${viewingApplicants.id}/applications`);
            setApplicants(res.data);
            if (status === 'accepted') {
                setCampaigns(prev => prev.map(c => c.id === viewingApplicants.id ? { ...c, status: 'in_progress' } : c));
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update application.');
        }
    };

    const handleReportApproval = async (campaignId: string) => {
        try {
            await apiClient.post(`gigs/${campaignId}/approve-report`, {});
            alert('Report approved! Campaign is now marked as completed.');
            // Refresh
            const res = await apiClient.get(`gigs/${campaignId}/applications`);
            setApplicants(res.data);
            setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'completed' } : c));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to approve report.');
        }
    };

    const handleReportRejection = async (campaignId: string) => {
        const feedback = prompt("Enter feedback for the student (why is the report rejected?):");
        if (feedback === null) return;
        try {
            await apiClient.post(`gigs/${campaignId}/reject-report`, { feedback });
            alert('Report rejected. Student has been notified.');
            // Refresh
            const res = await apiClient.get(`gigs/${campaignId}/applications`);
            setApplicants(res.data);
            setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'in_progress' } : c));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to reject report.');
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) return;
        try {
            await apiClient.delete(`gigs/${id}`);
            setCampaigns(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            console.error("Delete error:", err);
            alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
        }
    };

    const handleEditCampaign = (gig: any) => {
        setEditingGig(gig);
        setCampaignForm({
            title: gig.title,
            brief: gig.description,
            budget: String(gig.reward),
            deadline: gig.deadline || '',
            category: gig.category || 'Awareness'
        });
        setShowCampaignModal(true);
    };

    const sidebarItems = [
        { id: 'directory', label: 'Talent Directory', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> },
        { id: 'events', label: 'Campus Events', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
        { id: 'proposals', label: 'Offers & Proposals', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg> },
        { id: 'campaigns', label: 'My Campaigns', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg> },
        { id: 'profile', label: 'Company Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> },
    ];


    const fetchBrandData = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", (user as any).uid || (user as any).id));
            if (userDoc.exists()) setBrandProfile({ id: (user as any).uid || (user as any).id, ...userDoc.data() });
        }
    };

    const fetchProposals = async () => {
        if (!brandProfile?.id) return;
        try {
            const res = await apiClient.get(`proposals?senderId=${brandProfile.id}&recipientId=${brandProfile.id}`);
            setProposals(res.data);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        }
    };

    useEffect(() => {
        fetchBrandData();
        fetchProposals();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (currentView === 'proposals') {
                setLoading(true);
                await fetchProposals();
                setLoading(false);
                return;
            } else if (currentView === 'events') {
                setLoading(true);
                try {
                    const res = await apiClient.get('events');
                    setEvents(res.data);
                } catch (e) {
                    console.error("Error fetching events:", e);
                } finally {
                    setLoading(false);
                }
                return;
            } else if (currentView === 'campaigns') {
                setLoading(true);
                try {
                    // Use the newly supported brand filter
                    const res = await apiClient.get(`gigs?brand=${encodeURIComponent(brandProfile?.name || '')}`);
                    setCampaigns(res.data);
                } catch (e) {
                    console.error("Error fetching campaigns:", e);
                } finally {
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                // Search for all variants of the ambassador role to ensure the directory isn't empty
                const ambassadorRoles = [
                    UserRole.Ambassador,
                    'Ambassador',
                    'Ambassador/Influencer',
                    'Student Influencer'
                ];
                const q = query(collection(db, "users"), where("role", "in", ambassadorRoles), limit(50));
                const querySnapshot = await getDocs(q);
                const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                setStudents(studentsData);
            } catch (err) {
                console.error("Error fetching talent:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentView, brandProfile]);

    const handleOpenProposalModal = (student: any) => {
        setProposalRecipient({ id: student.id, name: student.name });
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
        setProposalInitialMessage(`Hi ${event.hostName}, we are interested in sponsoring your event "${event.name}".`);
        setShowProposalModal(true);
        setSelectedEvent(null); // Close event modal
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
            fetchProposals();
        } catch (error) {
            console.error("Update status error:", error);
        }
    };

    const filteredStudents = students.filter((student) => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUni = selectedUni === 'All' || student.university === selectedUni;
        return matchesSearch && matchesUni;
    });

    const renderContent = () => {
        switch (currentView) {
            case 'directory':
                return (
                    <div className="space-y-8">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="text"
                                    placeholder="Search student talent..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl outline-none font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="absolute left-4 top-4.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredStudents.map(student => (
                                    <div key={student.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-2xl mx-auto mb-4">
                                            {(student.name || '?').charAt(0)}
                                        </div>
                                        <h3 className="font-black text-lg line-clamp-1">{student.name}</h3>
                                        <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mb-3">{student.university || 'Verified'}</p>
                                        <div className="space-y-1.5 mb-6 flex flex-col items-center">
                                            {student.email && (
                                                <a href={`mailto:${student.email}`} className="flex items-center gap-2 text-xs text-spark-gray hover:text-spark-red transition-colors">
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                    <span className="truncate max-w-[200px]">{student.email}</span>
                                                </a>
                                            )}
                                            {student.phoneNumber && (
                                                <a href={`tel:${student.phoneNumber}`} className="flex items-center gap-2 text-xs text-spark-gray hover:text-spark-red transition-colors">
                                                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                    <span>{student.phoneNumber}</span>
                                                </a>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className="w-full py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm active:scale-95"
                                        >
                                            Send Offer
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'events':
                return (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : events.length === 0 ? (
                            <DashboardPlaceholder title="No Events" icon="📅" description="There are no upcoming campus events at the moment." />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {events.map(event => (
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
                                title="No Activity"
                                icon="📩"
                                description="You haven't sent or received any partnership proposals yet. Browse the talent directory to start!"
                            />
                        ) : (
                            <div className="grid gap-6">
                                {proposals.map((p) => {
                                    const isSender = p.senderId === (brandProfile?.id || auth.currentUser?.uid);
                                    const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                    const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                    return (
                                        <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner">
                                                    {otherParty.imageUrl ? <img src={otherParty.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : (otherParty.name ? otherParty.name.charAt(0) : '?')}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-spark-black">{displayName}</h4>
                                                    <p className="text-xs text-spark-red font-black uppercase tracking-widest">{otherParty.role}</p>
                                                    <p className="text-[10px] text-spark-gray font-bold mt-1 uppercase tracking-wider">{new Date(p.createdAt).toLocaleDateString()}</p>
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
                        )}
                    </div>
                );
            case 'campaigns':
                const categories = ['Awareness', 'Product Launch', 'Event Promo', 'Lead Gen', 'Content Creation', 'Social Media'];
                const catColors: Record<string, string> = {
                    'Awareness': 'bg-blue-50 text-blue-600',
                    'Product Launch': 'bg-purple-50 text-purple-600',
                    'Event Promo': 'bg-green-50 text-green-600',
                    'Lead Gen': 'bg-orange-50 text-orange-600',
                    'Content Creation': 'bg-pink-50 text-pink-600',
                    'Social Media': 'bg-teal-50 text-teal-600',
                };
                const statusColorsMap: Record<string, string> = {
                    'open': 'bg-green-50 text-green-600',
                    'in_progress': 'bg-blue-50 text-blue-600',
                    'reviewing': 'bg-orange-50 text-orange-600',
                    'completed': 'bg-gray-100 text-gray-500',
                };
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-spark-black">My Campaigns</h3>
                                <p className="text-spark-gray mt-1">Create and manage your influencer marketing campaigns.</p>
                            </div>
                            <button onClick={() => setShowCampaignModal(true)} className="bg-spark-red text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                                + New Campaign
                            </button>
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                <div className="text-6xl mb-6">📢</div>
                                <h3 className="text-2xl font-black text-spark-black mb-2">No Campaigns Yet</h3>
                                <p className="text-spark-gray mb-8">Launch your first influencer campaign to connect with students at scale.</p>
                                <button onClick={() => setShowCampaignModal(true)} className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all">Create First Campaign</button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {campaigns.map((c: any) => (
                                    <div key={c.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-xl font-black text-spark-black group-hover:text-spark-red transition-colors">{c.title}</h4>
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${catColors[c.category] || 'bg-gray-50 text-gray-600'}`}>{c.category}</span>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${statusColorsMap[c.status] || 'bg-gray-50 text-gray-600'}`}>{c.status?.replace('_', ' ')}</span>
                                        </div>
                                        <p className="text-sm text-spark-gray line-clamp-2 mb-6">{c.brief}</p>
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-spark-gray uppercase tracking-wider">Budget</p>
                                                <p className="font-black text-spark-black">₦{Number(c.budget).toLocaleString()}</p>
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-spark-gray uppercase tracking-wider">Deadline</p>
                                                <p className="font-black text-spark-black">{c.deadline}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => fetchApplicants(c)} className="flex-1 py-3 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all text-sm flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Applicants
                                            </button>
                                            <button onClick={() => handleEditCampaign(c)} className="w-12 h-12 bg-gray-50 text-spark-black rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                            </button>
                                            <button onClick={() => handleDeleteCampaign(c.id)} className="w-12 h-12 bg-gray-50 text-spark-red rounded-xl flex items-center justify-center hover:bg-red-50 transition-all border border-gray-100">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ===== APPLICANTS PANEL ===== */}
                        {viewingApplicants && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="p-8 pb-4 flex justify-between items-start flex-shrink-0">
                                        <div>
                                            <h2 className="text-2xl font-black text-spark-black">Applicants</h2>
                                            <p className="text-spark-gray text-sm mt-1">{viewingApplicants.title}</p>
                                        </div>
                                        <button onClick={() => { setViewingApplicants(null); setApplicants([]); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    {/* Body */}
                                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4">
                                        {applicantsLoading ? (
                                            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spark-red" /></div>
                                        ) : applicants.length === 0 ? (
                                            <div className="text-center py-16">
                                                <p className="text-5xl mb-4">📭</p>
                                                <p className="font-black text-spark-black text-lg">No applications yet</p>
                                                <p className="text-spark-gray text-sm">Students who apply will appear here with their pitch.</p>
                                            </div>
                                        ) : applicants.map((app: any) => {
                                            const statusColors: any = { pending: 'bg-yellow-50 text-yellow-700', accepted: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-500' };
                                            return (
                                                <div key={app.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                                                            {app.student?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-spark-black">{app.student?.name}</h4>
                                                            <p className="text-xs text-spark-gray">{app.student?.university || app.student?.email}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[app.status] || 'bg-gray-100 text-gray-500'}`}>{app.status}</span>
                                                    </div>
                                                    <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                                                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-wider mb-2">Their Pitch</p>
                                                        <p className="text-sm text-spark-black leading-relaxed">{app.pitch}</p>
                                                    </div>
                                                    {app.report && (
                                                        <div className="bg-white rounded-xl p-5 mb-4 border-2 border-green-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <p className="text-[10px] font-black text-green-700 uppercase tracking-wider">📋 Campaign Report</p>
                                                                {app.reportSubmittedAt && <p className="text-[9px] text-spark-gray">{new Date(app.reportSubmittedAt).toLocaleString()}</p>}
                                                            </div>
                                                            <p className="text-sm text-spark-black leading-relaxed mb-4">{app.report}</p>

                                                            <div className="flex flex-wrap gap-3 mb-4">
                                                                {app.reportLink && (
                                                                    <a href={app.reportLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase hover:bg-green-100 transition-colors flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                                        View Evidence Link
                                                                    </a>
                                                                )}
                                                                {app.reportImageUrl && (
                                                                    <a href={app.reportImageUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition-colors flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                                        View Screenshot
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {viewingApplicants.status === 'reviewing' && app.status === 'accepted' && (
                                                                <div className="flex gap-3 border-t border-gray-50 pt-4">
                                                                    <button onClick={() => handleReportApproval(viewingApplicants.id)} className="flex-1 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-xs">Approve Report & Pay</button>
                                                                    <button onClick={() => handleReportRejection(viewingApplicants.id)} className="flex-1 py-3 bg-red-50 text-red-600 font-black rounded-xl hover:bg-red-100 transition-all text-xs">Reject & Request Revision</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {app.status === 'pending' && (
                                                        <div className="flex gap-3">
                                                            <button onClick={() => handleApplicationDecision(app.id, 'accepted')} className="flex-1 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-sm">✓ Accept</button>
                                                            <button onClick={() => handleApplicationDecision(app.id, 'rejected')} className="flex-1 py-3 bg-gray-100 text-spark-gray font-black rounded-xl hover:bg-red-50 hover:text-spark-red transition-all text-sm">✗ Reject</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Create Campaign Modal */}
                        {showCampaignModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => { setShowCampaignModal(false); setEditingGig(null); }}></div>
                                <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                    <div className="p-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-spark-black">{editingGig ? 'Edit Campaign' : 'New Campaign'}</h2>
                                                <p className="text-spark-gray mt-1">{editingGig ? 'Update your campaign details.' : 'Fill in the details for your campaign brief.'}</p>
                                            </div>
                                            <button onClick={() => { setShowCampaignModal(false); setEditingGig(null); }} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                        <form className="space-y-5" onSubmit={async (e) => {
                                            e.preventDefault();
                                            setCampaignSubmitting(true);
                                            try {
                                                if (editingGig) {
                                                    // UPDATE existing Gig
                                                    const res = await apiClient.patch(`gigs/${editingGig.id}`, {
                                                        title: campaignForm.title,
                                                        description: campaignForm.brief,
                                                        reward: Number(campaignForm.budget),
                                                        category: campaignForm.category,
                                                        deadline: campaignForm.deadline
                                                    });
                                                    setCampaigns(prev => prev.map(c => c.id === editingGig.id ? { ...c, ...campaignForm, reward: Number(campaignForm.budget) } : c));
                                                    alert('Campaign updated successfully!');
                                                } else {
                                                    // POST to backend: creates a real Gig that students can apply for
                                                    const gigRes = await apiClient.post('gigs', {
                                                        title: campaignForm.title,
                                                        description: campaignForm.brief,
                                                        reward: Number(campaignForm.budget),
                                                        brand: brandProfile?.name || campaignForm.title,
                                                    });
                                                    const newCampaign = {
                                                        id: gigRes.data.id,
                                                        ...campaignForm,
                                                        gigId: gigRes.data.id,
                                                        createdAt: new Date().toISOString()
                                                    };
                                                    setCampaigns(prev => [newCampaign, ...prev]);
                                                    alert('Campaign launched successfully!');
                                                }
                                                setShowCampaignModal(false);
                                                setEditingGig(null);
                                                setCampaignForm({ title: '', brief: '', budget: '', deadline: '', category: 'Awareness' });
                                            } catch (err: any) {
                                                console.error(err);
                                                const errMsg = err.response?.data?.error || err.message || 'Unknown error';
                                                alert(`Failed to ${editingGig ? 'update' : 'create'} campaign: ${errMsg}`);
                                            } finally {
                                                setCampaignSubmitting(false);
                                            }
                                        }}>

                                            <div>
                                                <label className="block text-xs font-black text-spark-gray uppercase tracking-widest mb-2">Campaign Title</label>
                                                <input required value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" placeholder="e.g. Back to School Blitz" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-spark-gray uppercase tracking-widest mb-2">Category</label>
                                                <select value={campaignForm.category} onChange={e => setCampaignForm(p => ({ ...p, category: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red">
                                                    {categories.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-spark-gray uppercase tracking-widest mb-2">Campaign Brief</label>
                                                <textarea required rows={3} value={campaignForm.brief} onChange={e => setCampaignForm(p => ({ ...p, brief: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red resize-none" placeholder="Describe your campaign goals, target audience, and key messages..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-spark-gray uppercase tracking-widest mb-2">Budget (₦)</label>
                                                    <input required type="number" min="0" value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-spark-gray uppercase tracking-widest mb-2">Deadline</label>
                                                    <input required type="date" value={campaignForm.deadline} onChange={e => setCampaignForm(p => ({ ...p, deadline: e.target.value }))} className="w-full px-5 py-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" />
                                                </div>
                                            </div>
                                            <div className="flex gap-4 pt-2">
                                                <button type="button" onClick={() => { setShowCampaignModal(false); setEditingGig(null); }} className="flex-1 py-4 border-2 border-gray-100 text-spark-gray font-black rounded-2xl hover:bg-gray-50">Cancel</button>
                                                <button type="submit" disabled={campaignSubmitting} className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50">
                                                    {campaignSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{editingGig ? 'Updating...' : 'Creating...'}</> : editingGig ? 'Update Campaign' : 'Launch Campaign'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'profile':
                return <ProfileView user={brandProfile} onUpdate={fetchBrandData} />;
            default:
                return <div>Feature coming soon</div>;
        }
    };

    return (
        <DashboardShell
            role={UserRole.Brand}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={brandProfile?.name || "Brand Partner"}
            userSub={brandProfile?.industry || "Market Leader"}
            userImage={brandProfile?.imageUrl}
        >
            {selectedStudent && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="h-48 bg-gradient-to-br from-spark-red to-red-400 relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-white p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-red">
                                    {(selectedStudent.name || '?').charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-spark-black mb-1">{selectedStudent.name}</h3>
                                    <p className="text-spark-red font-black uppercase tracking-widest text-sm">{selectedStudent.university || 'Campus Talent'}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-2 opacity-60">Talent Bio</p>
                                    <p className="text-spark-black font-bold text-lg">{selectedStudent.bio || `${selectedStudent.name} is a high-impact influencer at ${selectedStudent.university || 'Spark University'}.`}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedStudent.university && (
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">University</p>
                                            <p className="font-black text-spark-black text-sm">{selectedStudent.university}</p>
                                        </div>
                                    )}
                                    {selectedStudent.handle && (
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Handle</p>
                                            <p className="font-black text-spark-black text-sm">@{selectedStudent.handle}</p>
                                        </div>
                                    )}
                                    {selectedStudent.email && (
                                        <div className="p-4 bg-gray-50 rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-spark-gray uppercase mb-1">Email</p>
                                            <p className="font-bold text-spark-black text-sm">{selectedStudent.email}</p>
                                        </div>
                                    )}
                                </div>

                                {(selectedStudent.instagram || selectedStudent.twitter || selectedStudent.linkedin) && (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                        <p className="text-[10px] font-black text-spark-gray uppercase tracking-widest mb-4 opacity-60">Social Media</p>
                                        <div className="flex gap-3 flex-wrap">
                                            {selectedStudent.instagram && (
                                                <a href={selectedStudent.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Instagram
                                                </a>
                                            )}
                                            {selectedStudent.twitter && (
                                                <a href={selectedStudent.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    Twitter
                                                </a>
                                            )}
                                            {selectedStudent.linkedin && (
                                                <a href={selectedStudent.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl font-bold text-xs hover:bg-spark-red hover:text-white transition-all">
                                                    LinkedIn
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleOpenProposalModal(selectedStudent)}
                                disabled={proposing}
                                className="w-full py-6 bg-spark-black text-white font-black text-xl rounded-2xl hover:bg-spark-red transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                            >
                                {proposing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : 'Send Partnership Offer'}
                            </button>
                        </div>
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
                isSender={selectedProposal?.senderId === brandProfile?.id}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                userRole="Brand"
                onContact={handleContactHost}
            />

            {renderContent()}
        </DashboardShell>
    );
};

export default BrandDashboard;
