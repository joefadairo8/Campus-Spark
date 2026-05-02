import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy } from '../firebase';
import { UserRole } from '../types';
import { STATES, UNIVERSITIES } from '../constants';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { WalletService, CampaignAllocation } from '../WalletService';
import { Calendar, Wallet, BarChart3, Lock, Plus, Minus, Mail, Users, Megaphone, Inbox, TrendingUp, ArrowUpRight, ArrowDownLeft, Activity, Handshake, Building2, Search } from 'lucide-react';

const BrandDashboard: React.FC<{ 
    onNavigate: (page: string) => void,
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, user }) => {
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
    const [topUpAmount, setTopUpAmount] = useState('5000');

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);
    const [viewingApplicants, setViewingApplicants] = useState<any>(null); // Campaign whose applicants are being viewed
    const [applicants, setApplicants] = useState<any[]>([]);
    const [applicantsLoading, setApplicantsLoading] = useState(false);
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);

    // ── Campaign & Allocation state ───────────────────────────────────────────
    const [walletData, setWalletData] = useState<{ available: number; locked: number }>({ available: 0, locked: 0 });
    const [allAllocations, setAllAllocations] = useState<CampaignAllocation[]>([]);
    const [campaignAllocations, setCampaignAllocations] = useState<Record<string, CampaignAllocation[]>>({});
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [allocationTarget, setAllocationTarget] = useState<any>(null); // influencer card
    const [allocationForm, setAllocationForm] = useState({ campaignId: '', amount: '' });
    const [allocationSubmitting, setAllocationSubmitting] = useState(false);
    const [showCreateInModal, setShowCreateInModal] = useState(false);
    const [inlineCreateForm, setInlineCreateForm] = useState({ title: '', brief: '', budget: '', deadline: '', category: 'Awareness' });
    const [inlineCreateSubmitting, setInlineCreateSubmitting] = useState(false);
    const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<any>(null);
    const [detailAllocations, setDetailAllocations] = useState<CampaignAllocation[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [activeCampaignContext, setActiveCampaignContext] = useState<any>(null); // for directory overview panel
    const [releaseSubmitting, setReleaseSubmitting] = useState<string | null>(null); // allocation id being released
    const [viewingReport, setViewingReport] = useState<any>(null);
    const [eventBeingSponsored, setEventBeingSponsored] = useState<any>(null);
    const [partners, setPartners] = useState<any[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(false);

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
            alert(err.message || 'Failed to update application.');
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

    const fetchWallet = async () => {
        if (!brandProfile?.id) return;
        setWalletLoading(true);
        try {
            const w = await WalletService.getOrCreateWallet(brandProfile.id);
            setWallet(w);
            setWalletData({ available: w.balance || 0, locked: w.escrow || 0 });
            
            const q = query(
                collection(db, 'transactions'), 
                where('userId', '==', brandProfile.id), 
                orderBy('createdAt', 'desc'),
                limit(30)
            );
            const transSnap = await getDocs(q);
            const mappedTrans = transSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTransactions(mappedTrans);
        } catch (e) {
            console.error("Wallet fetch error:", e);
        } finally {
            setWalletLoading(false);
        }
    };

    // Sync wallet strip data (lightweight — always runs on mount & profile load)
    const syncWalletStrip = async (profileId: string) => {
        try {
            const w = await WalletService.getOrCreateWallet(profileId);
            setWalletData({ available: w.balance || 0, locked: w.escrow || 0 });
        } catch (e) { /* silent */ }
    };

    // Load all campaigns for this brand
    const fetchCampaigns = useCallback(async () => {
        const brandId = brandProfile?.id;
        const brandEmail = brandProfile?.email;
        if (!brandId) return;
        console.log('[fetchCampaigns] Querying brandId:', brandId, '| email:', brandEmail);
        try {
            // PRIMARY: Fetch by brandId
            const resId = await apiClient.get(`gigs?brandId=${brandId}`);
            let allCampaigns = resId.data || [];
            console.log('[fetchCampaigns] Results by brandId:', allCampaigns.length);

            // SECONDARY: Fetch by brandEmail
            if (brandEmail) {
                const resEmail = await apiClient.get(`gigs?brandEmail=${encodeURIComponent(brandEmail)}`);
                const legacyCampaigns = resEmail.data || [];
                console.log('[fetchCampaigns] Results by brandEmail:', legacyCampaigns.length);
                legacyCampaigns.forEach((lc: any) => {
                    if (!allCampaigns.find((c: any) => c.id === lc.id)) {
                        allCampaigns.push(lc);
                    }
                });
            }

            // TERTIARY FALLBACK: full collection scan filtered client-side
            if (allCampaigns.length === 0) {
                console.warn('[fetchCampaigns] Indexed queries returned 0 — doing full scan fallback.');
                const allRes = await apiClient.get('gigs');
                const allGigs: any[] = allRes.data || [];
                allCampaigns = allGigs.filter((g: any) =>
                    g.brandId === brandId ||
                    (brandEmail && g.brandEmail === brandEmail)
                );
                console.log('[fetchCampaigns] Full-scan results:', allCampaigns.length);
            }

            setCampaigns(allCampaigns);
        } catch (e) {
            console.error('[fetchCampaigns] Error:', e);
        }
    }, [brandProfile?.id, brandProfile?.email]);

    // Load all allocations for this brand from Firestore
    const fetchAllAllocations = async (brandId: string) => {
        try {
            const allocations = await WalletService.getAllocationsByBrand(brandId);
            setAllAllocations(allocations);
            // Group by campaignId
            const grouped: Record<string, CampaignAllocation[]> = {};
            for (const alloc of allocations) {
                if (!grouped[alloc.campaignId]) grouped[alloc.campaignId] = [];
                grouped[alloc.campaignId].push(alloc);
            }
            setCampaignAllocations(grouped);
        } catch (e) {
            console.error("Allocation fetch error:", e);
        }
    };

    // Derive a student's status across all campaigns
    const getInfluencerStatus = (studentId: string): 'available' | 'in_campaign' | 'paid' => {
        const match = allAllocations.find(a => a.influencerId === studentId);
        if (!match) return 'available';
        if (match.status === 'paid') return 'paid';
        return 'in_campaign';
    };

    // Calculate budget stats for a campaign
    const getCampaignBudgetStats = (campaign: any) => {
        const allocations = campaignAllocations[campaign.id] || [];
        const allocated = allocations.filter(a => a.status !== 'rejected').reduce((s, a) => s + a.amount, 0);
        const budget = Number(campaign.budget || campaign.reward || 0);
        return { budget, allocated, remaining: Math.max(0, budget - allocated) };
    };

    // Open the "Add to Campaign" modal
    const openAllocationModal = (student: any) => {
        setAllocationTarget(student);
        setAllocationForm({ campaignId: campaigns[0]?.id || '', amount: '' });
        setShowCreateInModal(false);
        setShowAllocationModal(true);
    };

    // Confirm allocation → persist to Firestore & lock funds
    const handleAllocateInfluencer = async () => {
        if (!brandProfile?.id || !allocationTarget || !allocationForm.campaignId || !allocationForm.amount) return;
        const amount = Number(allocationForm.amount);
        if (isNaN(amount) || amount <= 0) { alert('Enter a valid allocation amount.'); return; }
        const campaign = campaigns.find(c => c.id === allocationForm.campaignId);
        if (!campaign) return;
        const stats = getCampaignBudgetStats(campaign);
        if (amount > stats.remaining) {
            alert(`Amount ₦${amount.toLocaleString()} exceeds remaining campaign budget of ₦${stats.remaining.toLocaleString()}.`);
            return;
        }
        setAllocationSubmitting(true);
        try {
            await WalletService.createAllocation({
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                brandId: brandProfile.id,
                brandName: brandProfile.name || brandProfile.brandName,
                influencerId: allocationTarget.id,
                influencerName: allocationTarget.name,
                influencerUniversity: allocationTarget.university,
                influencerEmail: allocationTarget.email,
                amount,
                status: 'selected',
            });
            await fetchAllAllocations(brandProfile.id);
            setShowAllocationModal(false);
            setAllocationTarget(null);
        } catch (e: any) {
            alert(e.message || 'Failed to allocate influencer.');
        } finally {
            setAllocationSubmitting(false);
        }
    };

    // Open campaign detail with its allocations
    const openCampaignDetail = async (campaign: any) => {
        setSelectedCampaignDetail(campaign);
        setDetailLoading(true);
        try {
            const allocations = await WalletService.getAllocationsForCampaign(campaign.id);
            setDetailAllocations(allocations);
        } catch (e) {
            console.error('Detail fetch error:', e);
        } finally {
            setDetailLoading(false);
        }
    };

    // Release payment → move escrow to influencer wallet, update allocation status
    const handleReleasePayment = async (allocation: CampaignAllocation) => {
        if (!brandProfile?.id || !allocation.id) return;
        if (!window.confirm(`Release ₦${allocation.amount.toLocaleString()} to ${allocation.influencerName}?`)) return;
        
        setReleaseSubmitting(allocation.id);
        try {
            await WalletService.releaseAllocationPayment(
                brandProfile.id,
                allocation.id,
                selectedCampaignDetail?.title || 'Campaign'
            );
            
            await syncWalletStrip(brandProfile.id);
            await fetchAllAllocations(brandProfile.id);
            
            // Refresh detail view
            if (selectedCampaignDetail) {
                const updated = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id);
                setDetailAllocations(updated);
            }
            alert('Payment successfully released!');
        } catch (e: any) {
            alert(e.message || 'Failed to release payment.');
        } finally {
            setReleaseSubmitting(null);
        }
    };

    const handleReleaseSponsorship = async (proposal: any) => {
        if (!brandProfile?.id || !proposal.id) return;
        const amount = Number(proposal.budget);
        if (isNaN(amount) || amount <= 0) {
            alert("This proposal does not have a valid budget amount.");
            return;
        }
        
        if (walletData.available < amount) {
            alert(`Insufficient wallet balance. You need ₦${amount.toLocaleString()} in your available balance to release these funds.`);
            return;
        }

        if (!window.confirm(`Release ₦${amount.toLocaleString()} sponsorship to ${proposal.sender?.name}?`)) return;
        
        try {
            // We need to move funds from brand to org with 10% fee
            // But first we must lock them? No, we can just release directly from balance if brand has it
            // The service has releaseSponsorshipFunds which deducts from Brand Escrow.
            // So we must LOCK first.
            
            setLoading(true);
            // 1. Lock funds
            await WalletService.lockFundsForGig(brandProfile.id, proposal.senderId, amount, `Sponsorship: ${proposal.message.substring(0, 30)}...`);
            
            // 2. Release funds
            await WalletService.releaseSponsorshipFunds(
                brandProfile.id,
                proposal.senderId,
                amount,
                proposal.message.substring(0, 30)
            );
            
            // 3. Mark proposal as paid/completed in a custom way or just status accepted
            await apiClient.patch(`proposals/${proposal.id}`, { status: 'paid' });
            
            alert("Sponsorship funds released successfully!");
            await syncWalletStrip(brandProfile.id);
            await fetchProposals();
        } catch (e: any) {
            alert(e.message || 'Failed to release sponsorship.');
        } finally {
            setLoading(false);
        }
    };

    // Reject allocation → refund to available balance, mark rejected
    const handleRejectAllocation = async (allocation: CampaignAllocation) => {
        if (!brandProfile?.id || !allocation.id) return;
        if (!window.confirm(`Reject and refund ₦${allocation.amount.toLocaleString()} for ${allocation.influencerName}?`)) return;
        try {
            await WalletService.refundAllocation(
                brandProfile.id,
                allocation.amount,
                `Refund: ${allocation.influencerName} removed from campaign`,
                allocation.influencerId
            );
            await WalletService.updateAllocationStatus(allocation.id, 'rejected');
            await syncWalletStrip(brandProfile.id);
            await fetchAllAllocations(brandProfile.id);
            if (selectedCampaignDetail) {
                const updated = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id);
                setDetailAllocations(updated);
            }
        } catch (e: any) {
            alert(e.message || 'Failed to reject allocation.');
        }
    };

    // Approve allocation (move status to approved)
    const handleApproveAllocation = async (allocation: CampaignAllocation) => {
        if (!allocation.id) return;
        try {
            await WalletService.updateAllocationStatus(allocation.id, 'approved');
            await fetchAllAllocations(brandProfile.id);
            if (selectedCampaignDetail) {
                const updated = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id);
                setDetailAllocations(updated);
            }
        } catch (e: any) {
            alert(e.message || 'Failed to approve.');
        }
    };

    // Reject report (move status back to revision/in_progress)
    const handleRejectReport = async (allocation: CampaignAllocation) => {
        if (!allocation.id) return;
        if (!window.confirm('Reject this report? The influencer will be notified to revise their submission.')) return;
        try {
            await WalletService.updateAllocationStatus(allocation.id, 'revision');
            await fetchAllAllocations(brandProfile.id);
            if (selectedCampaignDetail) {
                const updated = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id);
                setDetailAllocations(updated);
            }
            alert('Report rejected. Influencer can now resubmit.');
        } catch (e: any) {
            alert(e.message || 'Failed to reject report.');
        }
    };
    // Handle inline campaign creation from the allocation modal
    const handleInlineCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandProfile?.id) return;
        
        const amount = Number(inlineCreateForm.budget);
        const totalRequired = amount + 20000; // Listing fee

        if (walletData.available < totalRequired) {
            alert(`Insufficient wallet balance. You need ₦${totalRequired.toLocaleString()} (₦${amount.toLocaleString()} budget + ₦20,000 listing fee) but only have ₦${walletData.available.toLocaleString()}.`);
            return;
        }

        if (!window.confirm(`Launch campaign? A flat listing fee of ₦20,000 will be charged.`)) return;

        setInlineCreateSubmitting(true);
        try {
            // 1. Charge listing fee
            await WalletService.chargeListingFee(brandProfile.id, inlineCreateForm.title);

            // 2. Create campaign in Firestore
            const payload = {
                title: inlineCreateForm.title,
                brief: inlineCreateForm.brief,
                budget: inlineCreateForm.budget,
                reward: inlineCreateForm.budget, // Keep legacy field in sync
                deadline: inlineCreateForm.deadline,
                category: inlineCreateForm.category,
                status: 'open',
                brandId: brandProfile.id,
                brandEmail: brandProfile.email || user.email,
                brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                createdAt: new Date().toISOString()
            };
            const docRef = await apiClient.post('gigs', payload);
            const newCampaign = { id: docRef.data.id, ...payload };
            
            // 3. Lock budget in escrow
            await WalletService.lockCampaignBudget(brandProfile.id, newCampaign.id, amount, newCampaign.title);
            await syncWalletStrip(brandProfile.id);
            
            // 4. Add to local state & select it for allocation
            await fetchCampaigns();
            setAllocationForm({ ...allocationForm, campaignId: newCampaign.id });
            setShowCreateInModal(false);
            setInlineCreateForm({ title: '', brief: '', budget: '', deadline: '', category: 'Awareness' });
            alert("Campaign launched and listing fee charged!");
        } catch (err: any) {
            console.error("Create error:", err);
            alert(err.message || "Failed to create campaign");
        } finally {
            setInlineCreateSubmitting(false);
        }
    };

    const sidebarItems = [
        { id: 'directory', label: 'Talent Directory', icon: <Users className="w-5 h-5" /> },
        { id: 'campaigns', label: 'My Campaigns', icon: <Megaphone className="w-5 h-5" /> },
        { id: 'partnerships', label: 'Partner Hub', icon: <Handshake className="w-5 h-5" /> },
        { id: 'wallet', label: 'Wallet & Billing', icon: <Wallet className="w-5 h-5" /> },
        { id: 'proposals', label: 'Offers & Proposals', icon: <Inbox className="w-5 h-5" /> },
        { id: 'events', label: 'Campus Events', icon: <Calendar className="w-5 h-5" /> },
        { id: 'profile', label: 'Company Profile', icon: <Users className="w-5 h-5" /> },
    ];


    const fetchBrandData = async () => {
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid || user.id));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setBrandProfile({ ...data, id: user.uid || user.id, email: data.email || user.email });
            }
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
        if (user) {
            fetchBrandData();
            fetchProposals();
        }
    }, [user]);

    // When profile loads, sync wallet strip, campaigns and allocations
    useEffect(() => {
        if (brandProfile?.id) {
            syncWalletStrip(brandProfile.id);
            fetchCampaigns();
            fetchAllAllocations(brandProfile.id);
        }
    }, [brandProfile?.id, fetchCampaigns]);

    useEffect(() => {
        fetchWallet();
    }, [currentView, brandProfile]);

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
                await fetchCampaigns();
                setLoading(false);
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

        const fetchPartners = async () => {
            setPartnersLoading(true);
            try {
                const roles = [UserRole.Organization, 'Organization', 'Brand', UserRole.Brand];
                const q = query(collection(db, "users"), where("role", "in", roles), limit(50));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                setPartners(data.filter(p => p.id !== brandProfile?.id));
            } catch (err) {
                console.error("Error fetching partners:", err);
            } finally {
                setPartnersLoading(false);
            }
        };

        if (currentView === 'partnerships') {
            fetchPartners();
        } else {
            fetchData();
        }
    }, [currentView, brandProfile]);

    const handleOpenProposalModal = (student: any) => {
        setProposalRecipient({ id: student.id, name: student.name });
        setProposalInitialMessage('');
        setShowProposalModal(true);
    };

    const handleContactHost = (event: any) => {
        console.log('Contacting host for event:', event);
        const hostId = event.host?.id || event.hostId;
        const hostName = event.host?.name || event.hostName || "Organization";

        if (!hostId) {
            alert('Cannot contact host: Host information (ID) is missing for this event.');
            return;
        }
        setEventBeingSponsored(event);
        setProposalRecipient({ id: hostId, name: hostName });
        setProposalInitialMessage(`Hi ${hostName}, we are interested in sponsoring your event "${event.name}".`);
        setShowProposalModal(true);
        setSelectedEvent(null); // Close event modal
    };

    const handleSendProposal = async (data: { recipientId: string; message: string; budget?: string; timeline?: string; documentUrl?: string; documentName?: string; }) => {
        try {
            // If it's an event sponsorship with a budget, we deduct from brand wallet
            if (eventBeingSponsored && data.budget) {
                // Extract numbers from budget string (e.g., "₦50,000" -> 50000)
                const amount = Number(data.budget.replace(/[^0-9.]/g, ''));
                if (!isNaN(amount) && amount > 0) {
                    if (walletData.available < amount) {
                        if (window.confirm(`Insufficient balance. You need ₦${amount.toLocaleString()} to sponsor this event. Would you like to top up your wallet now?`)) {
                            setCurrentView('wallet');
                            setShowProposalModal(false);
                        }
                        return;
                    }
                    
                    if (window.confirm(`Confirm sponsorship payment of ₦${amount.toLocaleString()} for "${eventBeingSponsored.name}"? This will be credited to the organization immediately (minus platform fees).`)) {
                        await WalletService.paySponsorship(
                            brandProfile.id, 
                            data.recipientId, 
                            amount, 
                            eventBeingSponsored.name
                        );
                        // Record the proposal with payment info
                        await apiClient.post('proposals', { ...data, status: 'paid', amount });
                        alert(`Sponsorship of ₦${amount.toLocaleString()} sent and credited to the organization!`);
                        syncWalletStrip(brandProfile.id);
                    } else {
                        return; // user cancelled
                    }
                } else {
                    await apiClient.post('proposals', data);
                    alert("Partnership proposal sent successfully!");
                }
            } else {
                await apiClient.post('proposals', data);
                alert("Partnership proposal sent successfully!");
            }

            setShowProposalModal(false);
            setProposalRecipient(null);
            setEventBeingSponsored(null);
            fetchProposals();
        } catch (error: any) {
            console.error("Proposal error:", error);
            alert(error.message || "Failed to send proposal.");
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
            case 'partnerships':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-4xl font-black text-[var(--text-primary)]">Partner Hub</h2>
                                <p className="text-[var(--text-secondary)] mt-1">Connect directly with Organizations and other Brands for non-sponsorship collaborations.</p>
                            </div>
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-spark-red transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search brands or organizations..." 
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-2xl font-bold outline-none focus:border-spark-red transition-all"
                                />
                            </div>
                        </div>

                        {partnersLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : partners.length === 0 ? (
                            <DashboardPlaceholder 
                                icon={<Handshake className="w-12 h-12" />}
                                title="No Partners Available"
                                message="We couldn't find any organizations or brands at the moment."
                            />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {partners.map((partner) => (
                                    <div key={partner.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                        <div className="h-24 bg-gradient-to-r from-spark-red/5 to-spark-black/5 group-hover:from-spark-red/10 group-hover:to-spark-black/10 transition-colors" />
                                        <div className="px-8 pb-8 -mt-12">
                                            <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] rounded-[1.5rem] shadow-lg flex items-center justify-center text-3xl font-black text-spark-red mb-4">
                                                {partner.imageUrl ? <img src={partner.imageUrl} className="w-full h-full object-cover" /> : partner.name?.charAt(0)}
                                            </div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors">{partner.name}</h3>
                                            <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-4">{partner.role}</p>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 min-h-[40px] font-medium leading-relaxed">
                                                {partner.bio || `Connect with ${partner.name} for strategic partnerships and cross-brand collaborations.`}
                                            </p>
                                            <button 
                                                onClick={() => {
                                                    setProposalRecipient({ id: partner.id, name: partner.name });
                                                    setProposalInitialMessage(`Hi ${partner.name}, we would like to explore a partnership with your ${partner.role.toLowerCase()}.`);
                                                    setShowProposalModal(true);
                                                }}
                                                className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                Send Partnership Proposal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'directory':
                return (
                    <div className="space-y-6">
                        {/* ── Active Campaign Overview Panel ── */}
                        {activeCampaignContext && (() => {
                            const stats = getCampaignBudgetStats(activeCampaignContext);
                            const pct = stats.budget > 0 ? Math.min(100, (stats.allocated / stats.budget) * 100) : 0;
                            return (
                                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-2 h-2 rounded-full bg-spark-red animate-pulse flex-shrink-0"></span>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active Campaign</p>
                                        </div>
                                        <h4 className="font-black text-[var(--text-primary)] truncate">{activeCampaignContext.title}</h4>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)] font-bold">
                                            <span>Budget: <span className="text-[var(--text-primary)]">₦{stats.budget.toLocaleString()}</span></span>
                                            <span>Allocated: <span className="text-spark-red">₦{stats.allocated.toLocaleString()}</span></span>
                                            <span>Remaining: <span className="text-green-600">₦{stats.remaining.toLocaleString()}</span></span>
                                        </div>
                                        <div className="mt-2 h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                            <div className="h-full bg-spark-red rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => { setCurrentView('campaigns'); openCampaignDetail(activeCampaignContext); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-spark-red text-white rounded-xl hover:bg-red-700 transition-all shadow-sm">View Detail</button>
                                        <button onClick={() => setActiveCampaignContext(null)} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl hover:bg-spark-red hover:text-white transition-all shadow-sm">Clear</button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── Recent Activity Quick View ── */}
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Recent Activity</h3>
                                <button onClick={() => setCurrentView('wallet')} className="text-[10px] font-black text-spark-red uppercase tracking-widest hover:underline">View All Transactions</button>
                            </div>
                            <div className="space-y-4">
                                {transactions.length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-sm italic py-4">No recent activity found.</p>
                                ) : (
                                    transactions.slice(0, 3).map((trans: any, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trans.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {trans.type === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[var(--text-primary)]">{trans.description}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold">{trans.createdAt?.seconds ? new Date(trans.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                                                </div>
                                            </div>
                                            <p className={`text-sm font-black ${trans.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                {trans.type === 'credit' ? '+' : '-'} ₦{Number(trans.amount).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ── Search Bar ── */}
                        <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)] flex flex-col xl:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="text"
                                    placeholder="Search student talent..."
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-medium text-[var(--text-primary)]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="absolute left-4 top-4.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            {campaigns.length > 0 && (
                                <div className="flex items-center gap-3 w-full xl:w-auto">
                                    <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">Campaign Context:</label>
                                    <select
                                        className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-spark-red"
                                        value={activeCampaignContext?.id || ''}
                                        onChange={e => setActiveCampaignContext(campaigns.find(c => c.id === e.target.value) || null)}
                                    >
                                        <option value="">— No campaign selected —</option>
                                        {campaigns.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* ── Talent Grid ── */}
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredStudents.map(student => {
                                    const status = getInfluencerStatus(student.id);
                                    const statusConfig = {
                                        available: { label: 'Available', cls: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        in_campaign: { label: 'In Campaign', cls: 'bg-spark-red/10 text-spark-red border border-spark-red/20' },
                                        paid: { label: 'Paid', cls: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]' },
                                    }[status];
                                    return (
                                        <div key={student.id} className={`group bg-[var(--bg-primary)] rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 text-center ${status === 'in_campaign' ? 'border-spark-red/30 ring-1 ring-spark-red/10' : 'border-[var(--border-color)]'}`}>
                                            <div className="flex justify-end mb-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusConfig.cls}`}>{statusConfig.label}</span>
                                            </div>
                                            <div className="w-16 h-16 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-2xl mx-auto mb-4">
                                                {(student.name || '?').charAt(0)}
                                            </div>
                                            <h3 className="font-black text-lg line-clamp-1 text-[var(--text-primary)]">{student.name}</h3>
                                            <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mb-3">{student.university || 'Verified'}</p>
                                            <div className="space-y-1.5 mb-6 flex flex-col items-center">
                                                {student.email && (
                                                    <a href={`mailto:${student.email}`} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate max-w-[200px]">{student.email}</span>
                                                    </a>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => openAllocationModal(student)}
                                                disabled={status === 'paid'}
                                                className={`w-full py-3 font-black rounded-xl transition-all text-sm active:scale-95 shadow-sm ${status === 'paid' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed' : status === 'in_campaign' ? 'bg-spark-red/10 text-spark-red border border-spark-red/20 hover:bg-spark-red hover:text-white' : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-spark-red hover:text-white'}`}
                                            >
                                                {status === 'paid' ? 'Already Paid' : status === 'in_campaign' ? 'Re-allocate' : 'Add to Campaign'}
                                            </button>
                                        </div>
                                    );
                                })}
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
                                    <div key={event.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
                                        <div className="h-4 bg-spark-red"></div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="mb-4 bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-spark-red tracking-widest inline-block w-max">{new Date(event.date).toLocaleDateString()}</div>
                                            <h3 className="text-xl font-black mb-2 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{event.name}</h3>
                                            <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3">{event.description}</p>
                                            <div className="mt-auto flex items-center justify-between border-t border-[var(--border-color)] pt-6">
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
            case 'wallet':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        {walletLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid md:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        { label: 'Total Spent', value: `₦${transactions.reduce((acc, t) => acc + (t.type === 'debit' ? (Number(t.amount) || 0) : 0), 0).toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' },
                                        { label: 'Locked in Escrow', value: `₦${(wallet?.escrow || 0).toLocaleString()}`, icon: <Lock className="w-6 h-6" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-spark-black rounded-[2.5rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 text-white">Top Up Your Wallet</h3>
                                        <p className="text-gray-400 font-medium">Add funds to launch new campaigns and hire influencers instantly.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <div className="relative w-full sm:w-48">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                            <input 
                                                type="number" 
                                                value={topUpAmount}
                                                onChange={e => setTopUpAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-black outline-none focus:border-spark-red transition-all"
                                                placeholder="Amount"
                                            />
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (!brandProfile?.id) return;
                                                const amount = Number(topUpAmount);
                                                if (!amount || amount <= 0) {
                                                    alert("Please enter a valid amount.");
                                                    return;
                                                }

                                            const PaystackPop = (window as any).PaystackPop;
                                            if (!PaystackPop) {
                                                alert("CRITICAL: PaystackPop not found on window object.");
                                                return;
                                            }

                                            try {
                                                const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
                                                console.log('[Paystack] Initializing with ref:', reference);
                                                
                                                const handler = PaystackPop.setup({
                                                    key: 'pk_test_5ee439620d8a49acc254131ede19b9063d8fe95f', 
                                                    email: brandProfile.email || user?.email || 'brand@campushub.africa',
                                                    amount: amount * 100,
                                                    currency: 'NGN',
                                                    ref: reference,
                                                    metadata: {
                                                        userId: brandProfile.id,
                                                        custom_fields: [
                                                            {
                                                                display_name: "Wallet Top-up",
                                                                variable_name: "wallet_topup",
                                                                value: brandProfile.id
                                                            }
                                                        ]
                                                    },
                                                    callback: function(response: any) {
                                                        alert("Payment successful! Updating wallet...");
                                                        // Use an IIFE for the async part to satisfy Paystack's function check
                                                        (async () => {
                                                            try {
                                                                setWalletLoading(true);
                                                                await WalletService.topUpWallet(brandProfile.id, amount, response.reference);
                                                                alert(`Wallet updated: ₦${amount.toLocaleString()} added.`);
                                                                await fetchWallet();
                                                                await syncWalletStrip(brandProfile.id);
                                                            } catch (err: any) {
                                                                alert("Error updating wallet: " + err.message);
                                                            } finally {
                                                                setWalletLoading(false);
                                                            }
                                                        })();
                                                    },
                                                    onClose: () => {
                                                        console.log('[Paystack] Modal closed');
                                                    }
                                                });
                                                
                                                alert("Opening Paystack payment window...");
                                                handler.openIframe();
                                            } catch (e: any) {
                                                alert("Paystack Setup Error: " + e.message);
                                            }
                                        }}
                                        className="px-10 py-5 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg whitespace-nowrap active:scale-95"
                                    >
                                        + Add Funds
                                    </button>
                                    </div>
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
            case 'proposals':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : proposals.length === 0 ? (
                            <DashboardPlaceholder
                                title="No Activity"
                                icon={<Inbox className="w-10 h-10" />}
                                description="You haven't sent or received any partnership proposals yet. Browse the talent directory to start!"
                            />
                        ) : (
                            <div className="grid gap-6">
                                {proposals.map((p) => {
                                    const isSender = p.senderId === (brandProfile?.id || auth.currentUser?.uid);
                                    const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                    const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                    return (
                                        <div key={p.id} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner">
                                                    {otherParty.imageUrl ? <img src={otherParty.imageUrl} className="w-full h-full object-cover rounded-2xl" /> : (otherParty.name ? otherParty.name.charAt(0) : '?')}
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
                                                    className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-gray-200"
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
                    'completed': 'bg-[var(--bg-tertiary)] text-gray-500',
                };
                const allocStatusColors: Record<string, string> = {
                    'selected': 'bg-blue-50 text-blue-600',
                    'in_progress': 'bg-orange-50 text-orange-600',
                    'submitted': 'bg-purple-50 text-purple-600',
                    'approved': 'bg-teal-50 text-teal-600',
                    'paid': 'bg-green-50 text-green-600',
                    'rejected': 'bg-red-50 text-red-500',
                };

                // ── Campaign Detail View ──────────────────────────────────────
                if (selectedCampaignDetail) {
                    const detailStats = getCampaignBudgetStats(selectedCampaignDetail);
                    const detailPct = detailStats.budget > 0 ? Math.min(100, (detailStats.allocated / detailStats.budget) * 100) : 0;
                    return (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Back + Header */}
                            <div className="flex items-center gap-4">
                                <button onClick={() => { setSelectedCampaignDetail(null); setDetailAllocations([]); }} className="w-10 h-10 bg-spark-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                                </button>
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedCampaignDetail.title}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-bold mt-0.5">{selectedCampaignDetail.category} · Campaign Detail</p>
                                </div>
                            </div>

                            {/* Budget Summary */}
                            <div className="grid grid-cols-3 gap-5">
                                {[
                                    { label: 'Total Budget', value: `₦${detailStats.budget.toLocaleString()}`, color: 'text-[var(--text-primary)]' },
                                    { label: 'Allocated', value: `₦${detailStats.allocated.toLocaleString()}`, color: 'text-spark-red' },
                                    { label: 'Remaining', value: `₦${detailStats.remaining.toLocaleString()}`, color: 'text-green-600' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[1.5rem] p-5">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{s.label}</p>
                                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                <div className="h-full bg-spark-red rounded-full transition-all duration-700" style={{ width: `${detailPct}%` }}></div>
                            </div>

                            {/* Influencer Table */}
                            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                                    <h4 className="font-black text-[var(--text-primary)]">Allocated Influencers</h4>
                                    <button onClick={() => { setCurrentView('directory'); setActiveCampaignContext(selectedCampaignDetail); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-spark-red text-white rounded-xl hover:bg-red-700 transition-all">+ Add Influencer</button>
                                </div>
                                {detailLoading ? (
                                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spark-red"/></div>
                                ) : detailAllocations.length === 0 ? (
                                    <div className="text-center py-16">
                                        <p className="text-4xl mb-3">👥</p>
                                        <p className="font-black text-[var(--text-primary)] mb-1">No influencers allocated yet</p>
                                        <p className="text-sm text-[var(--text-secondary)]">Go to the Talent Directory and click "Add to Campaign".</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[var(--border-color)]">
                                                    {['Influencer', 'University', 'Allocation', 'Status', 'Actions'].map(h => (
                                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailAllocations.map((alloc) => (
                                                    <tr key={alloc.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-spark-red text-white flex items-center justify-center font-black text-sm flex-shrink-0">{(alloc.influencerName || '?').charAt(0)}</div>
                                                                <span className="font-black text-[var(--text-primary)]">{alloc.influencerName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{alloc.influencerUniversity || '—'}</td>
                                                        <td className="px-6 py-4 font-black text-[var(--text-primary)]">₦{alloc.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${allocStatusColors[alloc.status] || 'bg-[var(--bg-tertiary)] text-gray-500'}`}>{alloc.status.replace('_', ' ')}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {alloc.status === 'rejected' || alloc.status === 'paid' ? (
                                                                <span className="text-[10px] text-[var(--text-secondary)] italic">{alloc.status === 'paid' ? 'Payment released' : 'Refunded'}</span>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    {alloc.submission && (
                                                                        <div className="mb-2 p-3 bg-[var(--bg-primary)] rounded-xl border border-spark-red/20 shadow-sm">
                                                                            <p className="text-[10px] font-black text-spark-red uppercase mb-1">Submission Received</p>
                                                                            <p className="text-xs italic text-[var(--text-primary)] line-clamp-1 mb-2">"{alloc.submission.text}"</p>
                                                                            <button 
                                                                                onClick={() => setViewingReport(alloc)}
                                                                                className="text-[10px] font-black text-spark-red uppercase hover:underline"
                                                                            >
                                                                                View Full Report
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex gap-2">
                                                                        {alloc.status === 'submitted' && (
                                                                            <>
                                                                                <button onClick={() => handleApproveAllocation(alloc)} className="px-3 py-1.5 bg-spark-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-gray-800 transition-colors">
                                                                                    Approve Report
                                                                                </button>
                                                                                <button onClick={() => handleRejectReport(alloc)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors">
                                                                                    Reject Report
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {alloc.status === 'approved' && (
                                                                            <button disabled={releaseSubmitting === alloc.id} onClick={() => handleReleasePayment(alloc)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1">
                                                                                {releaseSubmitting === alloc.id ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : null}
                                                                                Release Pay
                                                                            </button>
                                                                        )}
                                                                        {(alloc.status === 'selected' || alloc.status === 'in_progress' || alloc.status === 'revision') && (
                                                                            <span className="px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-[10px] font-black uppercase border border-[var(--border-color)]">
                                                                                {alloc.status === 'revision' ? 'Revision Requested' : 'Work Pending'}
                                                                            </span>
                                                                        )}
                                                                        {alloc.status !== 'paid' && alloc.status !== 'rejected' && (
                                                                            <button onClick={() => handleRejectAllocation(alloc)} className="px-3 py-1.5 bg-spark-red text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors">
                                                                                {alloc.status === 'submitted' ? 'Cancel & Refund' : 'Reject Influencer'}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // ── Campaign List View ────────────────────────────────────────
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">My Campaigns</h3>
                                <p className="text-[var(--text-secondary)] mt-1">Create and manage your influencer marketing campaigns. <span className="text-spark-red font-bold">₦20,000 listing fee applies.</span></p>
                            </div>
                            <button onClick={() => setShowCampaignModal(true)} className="bg-spark-red text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                                + New Campaign
                            </button>
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="text-6xl mb-6">📢</div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Campaigns Yet</h3>
                                <p className="text-[var(--text-secondary)] mb-8">Launch your first influencer campaign to connect with students at scale.</p>
                                <button onClick={() => setShowCampaignModal(true)} className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all">Create First Campaign</button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {campaigns.map((c: any) => {
                                    const bStats = getCampaignBudgetStats(c);
                                    const bPct = bStats.budget > 0 ? Math.min(100, (bStats.allocated / bStats.budget) * 100) : 0;
                                    return (
                                        <div key={c.id} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-8 hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)] group-hover:text-spark-red transition-colors">{c.title}</h4>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${catColors[c.category] || 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>{c.category}</span>
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase ${statusColorsMap[c.status] || 'bg-[var(--bg-secondary)] text-gray-600'}`}>{c.status?.replace('_', ' ')}</span>
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-5">{c.brief}</p>

                                            {/* Budget Progress */}
                                            <div className="mb-5 space-y-2">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span className="text-[var(--text-secondary)]">Allocated <span className="text-spark-red">₦{bStats.allocated.toLocaleString()}</span></span>
                                                    <span className="text-[var(--text-secondary)]">Remaining <span className="text-green-600">₦{bStats.remaining.toLocaleString()}</span></span>
                                                </div>
                                                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-spark-red rounded-full transition-all" style={{ width: `${bPct}%` }}></div>
                                                </div>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold">Total Budget: ₦{bStats.budget.toLocaleString()} · Deadline: {c.deadline}</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={() => openCampaignDetail(c)} className="flex-1 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm">View Detail</button>
                                                <button onClick={() => fetchApplicants(c)} className="flex-1 py-3 bg-spark-black text-white font-black rounded-xl hover:bg-gray-800 transition-all text-sm flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Applicants
                                                </button>
                                                <button onClick={() => handleEditCampaign(c)} className="w-12 h-12 bg-spark-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </button>
                                                <button onClick={() => handleDeleteCampaign(c.id)} className="w-12 h-12 bg-spark-red text-white rounded-xl flex items-center justify-center hover:bg-red-700 transition-all">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ===== APPLICANTS PANEL ===== */}
                        {viewingApplicants && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                                    {/* Header */}
                                    <div className="p-8 pb-4 flex justify-between items-start flex-shrink-0">
                                        <div>
                                            <h2 className="text-2xl font-black text-[var(--text-primary)]">Applicants</h2>
                                            <p className="text-[var(--text-secondary)] text-sm mt-1">{viewingApplicants.title}</p>
                                        </div>
                                        <button onClick={() => { setViewingApplicants(null); setApplicants([]); }} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
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
                                                <p className="font-black text-[var(--text-primary)] text-lg">No applications yet</p>
                                                <p className="text-[var(--text-secondary)] text-sm">Students who apply will appear here with their pitch.</p>
                                            </div>
                                        ) : applicants.map((app: any) => {
                                            const statusColors: any = { pending: 'bg-yellow-50 text-yellow-700', accepted: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-500' };
                                            return (
                                                <div key={app.id} className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                                                            {app.student?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-black text-[var(--text-primary)]">{app.student?.name}</h4>
                                                            <p className="text-xs text-[var(--text-secondary)]">{app.student?.university || app.student?.email}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[app.status] || 'bg-[var(--bg-tertiary)] text-gray-500'}`}>{app.status}</span>
                                                    </div>
                                                    <div className="bg-[var(--bg-primary)] rounded-xl p-4 mb-4 border border-[var(--border-color)]">
                                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">Their Pitch</p>
                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{app.pitch}</p>
                                                    </div>
                                                    {app.report && (
                                                        <div className="bg-[var(--bg-primary)] rounded-xl p-5 mb-4 border-2 border-green-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <p className="text-[10px] font-black text-green-700 uppercase tracking-wider">📋 Campaign Report</p>
                                                                {app.reportSubmittedAt && <p className="text-[9px] text-[var(--text-secondary)]">{new Date(app.reportSubmittedAt).toLocaleString()}</p>}
                                                            </div>
                                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{app.report}</p>

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

                                                            {app.status === 'accepted' && (
                                                                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-green-700 uppercase tracking-widest leading-relaxed">Application Accepted</p>
                                                                        <p className="text-xs text-green-800 font-bold mt-1">Manage this influencer's execution and release payment in the <button onClick={() => { setViewingApplicants(null); setCurrentView('campaigns'); openCampaignDetail(viewingApplicants); }} className="underline hover:text-green-600">Campaign Details</button> view.</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {app.status === 'submitted' && (
                                                                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest leading-relaxed">Report Submitted</p>
                                                                        <p className="text-xs text-blue-800 font-bold mt-1">Review the report and release payment in the <button onClick={() => { setViewingApplicants(null); setCurrentView('campaigns'); openCampaignDetail(viewingApplicants); }} className="underline hover:text-blue-600">Campaign Details</button> view.</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {app.status === 'pending' && (
                                                        <div className="flex gap-3">
                                                            <button onClick={() => handleApplicationDecision(app.id, 'accepted')} className="flex-1 py-3 bg-spark-black text-white font-black rounded-xl hover:bg-gray-800 transition-all text-sm">✓ Accept</button>
                                                            <button onClick={() => handleApplicationDecision(app.id, 'rejected')} className="flex-1 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm">✗ Reject</button>
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
                                <div className="relative bg-[var(--bg-primary)] w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
                                    <div className="p-10 modal-content-scroll">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-[var(--text-primary)]">{editingGig ? 'Edit Campaign' : 'New Campaign'}</h2>
                                                <p className="text-[var(--text-secondary)] mt-1">{editingGig ? 'Update your campaign details.' : 'Fill in the details for your campaign brief.'}</p>
                                            </div>
                                            <button onClick={() => { setShowCampaignModal(false); setEditingGig(null); }} className="w-10 h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                        <form className="space-y-5" onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!brandProfile?.id) {
                                                alert('Error: Brand profile not loaded. Please wait a moment and try again.');
                                                return;
                                            }
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
                                                    const amount = Number(campaignForm.budget);
                                                    const totalRequired = amount + 20000;

                                                    if (walletData.available < totalRequired) {
                                                        alert(`Insufficient balance. You need ₦${totalRequired.toLocaleString()} (₦${amount.toLocaleString()} budget + ₦20,000 listing fee).`);
                                                        setCampaignSubmitting(false);
                                                        return;
                                                    }

                                                    if (!window.confirm("Launch campaign? A flat listing fee of ₦20,000 will be charged.")) {
                                                        setCampaignSubmitting(false);
                                                        return;
                                                    }

                                                    // 1. Charge listing fee
                                                    await WalletService.chargeListingFee(brandProfile.id, campaignForm.title);

                                                    const resolvedBrandId = user?.uid || brandProfile.id;
                                                    const resolvedBrandEmail = user?.email || brandProfile.email;
                                                    const payload = {
                                                        title: campaignForm.title,
                                                        description: campaignForm.brief,
                                                        brief: campaignForm.brief,
                                                        reward: Number(campaignForm.budget),
                                                        budget: Number(campaignForm.budget),
                                                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                                                        status: 'open',
                                                        brandId: resolvedBrandId,
                                                        brandEmail: resolvedBrandEmail,
                                                        category: campaignForm.category,
                                                        deadline: campaignForm.deadline,
                                                        createdAt: new Date().toISOString()
                                                    };
                                                    
                                                    const gigRes = await apiClient.post('gigs', payload);
                                                    
                                                    // 2. Lock budget in escrow
                                                    await WalletService.lockCampaignBudget(resolvedBrandId, gigRes.data.id, amount, campaignForm.title);
                                                    await syncWalletStrip(resolvedBrandId);

                                                    const newCampaign = { id: gigRes.data.id, ...payload };
                                                    setCampaigns(prev => [newCampaign, ...prev]);
                                                    alert('Campaign launched and listing fee charged!');
                                                    setTimeout(() => fetchCampaigns(), 1500);
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
                                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Campaign Title</label>
                                                <input required value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" placeholder="e.g. Back to School Blitz" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Category</label>
                                                <select value={campaignForm.category} onChange={e => setCampaignForm(p => ({ ...p, category: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red">
                                                    {categories.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Campaign Brief</label>
                                                <textarea required rows={3} value={campaignForm.brief} onChange={e => setCampaignForm(p => ({ ...p, brief: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red resize-none" placeholder="Describe your campaign goals, target audience, and key messages..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Budget (₦)</label>
                                                    <input required type="number" min="0" value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Deadline</label>
                                                    <input required type="date" value={campaignForm.deadline} onChange={e => setCampaignForm(p => ({ ...p, deadline: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-spark-red" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-4 pt-2">
                                                {!editingGig && (
                                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-spark-red text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <Activity className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-spark-red uppercase tracking-widest leading-relaxed">A flat listing fee of ₦20,000 will be charged upon launching this campaign.</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-4">
                                                    <button type="button" onClick={() => { setShowCampaignModal(false); setEditingGig(null); }} className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all">Cancel</button>
                                                    <button type="submit" disabled={campaignSubmitting} className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95">
                                                        {campaignSubmitting ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>{editingGig ? 'Updating...' : 'Creating...'}</> : editingGig ? 'Update Campaign' : 'Launch Campaign'}
                                                    </button>
                                                </div>
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
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            walletStrip={
                <div className="flex items-center gap-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-1.5 shadow-sm">
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Available</p>
                        <p className="text-sm font-black text-green-600">₦{walletData.available.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border-color)]"></div>
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Locked (Escrow)</p>
                        <p className="text-sm font-black text-[var(--text-primary)]">₦{walletData.locked.toLocaleString()}</p>
                    </div>
                    <button onClick={() => setCurrentView('wallet')} className="bg-spark-red text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-red-700 transition-all">
                        Fund Wallet
                    </button>
                </div>
            }
        >
            {selectedStudent && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedStudent(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-spark-red transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="h-48 bg-gradient-to-br from-spark-red to-red-400 relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-[var(--bg-primary)] p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-red">
                                    {(selectedStudent.name || '?').charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-[var(--text-primary)] mb-1">{selectedStudent.name}</h3>
                                    <p className="text-spark-red font-black uppercase tracking-widest text-sm">{selectedStudent.university || 'Campus Talent'}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 opacity-60">Talent Bio</p>
                                    <p className="text-[var(--text-primary)] font-bold text-lg">{selectedStudent.bio || `${selectedStudent.name} is a high-impact influencer at ${selectedStudent.university || 'Spark University'}.`}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedStudent.university && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">University</p>
                                            <p className="font-black text-[var(--text-primary)] text-sm">{selectedStudent.university}</p>
                                        </div>
                                    )}
                                    {selectedStudent.handle && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Handle</p>
                                            <p className="font-black text-[var(--text-primary)] text-sm">@{selectedStudent.handle}</p>
                                        </div>
                                    )}
                                    {selectedStudent.email && (
                                        <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl col-span-2">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Email</p>
                                            <p className="font-bold text-[var(--text-primary)] text-sm">{selectedStudent.email}</p>
                                        </div>
                                    )}
                                </div>

                                {(selectedStudent.instagram || selectedStudent.twitter || selectedStudent.linkedin) && (
                                    <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 opacity-60">Social Media</p>
                                        <div className="flex gap-3 flex-wrap">
                                            {selectedStudent.instagram && (
                                                <a href={selectedStudent.instagram} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
                                                    Instagram
                                                </a>
                                            )}
                                            {selectedStudent.twitter && (
                                                <a href={selectedStudent.twitter} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
                                                    Twitter
                                                </a>
                                            )}
                                            {selectedStudent.linkedin && (
                                                <a href={selectedStudent.linkedin} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-spark-black text-white rounded-xl font-bold text-xs hover:bg-spark-red transition-all">
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
                    onClose={() => { setShowProposalModal(false); setEventBeingSponsored(null); }}
                    recipientName={proposalRecipient.name}
                    recipientId={proposalRecipient.id}
                    initialMessage={proposalInitialMessage}
                    onSubmit={handleSendProposal}
                    isSponsorship={!!eventBeingSponsored}
                    title={eventBeingSponsored ? `Sponsor "${eventBeingSponsored.name}"` : 'Partnership Proposal'}
                />
            )}

            <ProposalDetailsModal
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                proposal={selectedProposal}
                onUpdateStatus={handleUpdateStatus}
                isSender={selectedProposal?.senderId === brandProfile?.id}
                onReleaseSponsorship={handleReleaseSponsorship}
            />

            <EventDetailsModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                userRole="Brand"
                onContact={handleContactHost}
            />
            {/* ===== ALLOCATION MODAL ===== */}
            {showAllocationModal && allocationTarget && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-primary)]">Add to Campaign</h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Talent: {allocationTarget.name}</p>
                            </div>
                            <button onClick={() => { setShowAllocationModal(false); setAllocationTarget(null); setShowCreateInModal(false); }} className="w-8 h-8 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            {showCreateInModal ? (
                                <form onSubmit={handleInlineCreateCampaign} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Campaign Title</label>
                                        <input required type="text" value={inlineCreateForm.title} onChange={e => setInlineCreateForm(p => ({ ...p, title: e.target.value }))} className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold outline-none focus:border-spark-red text-sm" placeholder="e.g. Back to School Promo" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Total Budget (₦)</label>
                                            <input required type="number" min="0" value={inlineCreateForm.budget} onChange={e => setInlineCreateForm(p => ({ ...p, budget: e.target.value }))} className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold outline-none focus:border-spark-red text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Deadline</label>
                                            <input required type="date" value={inlineCreateForm.deadline} onChange={e => setInlineCreateForm(p => ({ ...p, deadline: e.target.value }))} className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold outline-none focus:border-spark-red text-sm" />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-3">
                                        <button type="button" onClick={() => setShowCreateInModal(false)} className="flex-1 py-3 bg-spark-black text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-gray-800">Cancel</button>
                                        <button type="submit" disabled={inlineCreateSubmitting} className="flex-1 py-3 bg-spark-black text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-gray-800 disabled:opacity-50">
                                            {inlineCreateSubmitting ? 'Creating...' : 'Create & Lock'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Select Campaign</label>
                                        <div className="flex gap-2">
                                            <select 
                                                value={allocationForm.campaignId} 
                                                onChange={e => setAllocationForm(p => ({ ...p, campaignId: e.target.value }))}
                                                className="flex-1 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold text-sm outline-none focus:border-spark-red"
                                            >
                                                <option value="" disabled>Choose a campaign...</option>
                                                {campaigns.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                                            </select>
                                            <button onClick={() => setShowCreateInModal(true)} className="px-4 bg-spark-red text-white font-black text-xl rounded-xl hover:bg-red-700 transition-all flex-shrink-0" title="Create New Campaign">+</button>
                                        </div>
                                        {allocationForm.campaignId && (() => {
                                            const c = campaigns.find((x: any) => x.id === allocationForm.campaignId);
                                            if (!c) return null;
                                            const stats = getCampaignBudgetStats(c);
                                            return (
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-2">Remaining Budget: <span className="text-green-600">₦{stats.remaining.toLocaleString()}</span></p>
                                            );
                                        })()}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Allocation Amount (₦)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            placeholder="e.g. 15000"
                                            value={allocationForm.amount} 
                                            onChange={e => setAllocationForm(p => ({ ...p, amount: e.target.value }))}
                                            className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold text-lg outline-none focus:border-spark-red"
                                        />
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-2">This amount will be deducted from the campaign budget and locked for {allocationTarget.name}.</p>
                                    </div>
                                    <button 
                                        onClick={handleAllocateInfluencer}
                                        disabled={allocationSubmitting || !allocationForm.campaignId || !allocationForm.amount}
                                        className="w-full py-4 mt-2 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                                    >
                                        {allocationSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Confirm Allocation'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Report Viewer Modal */}
            {viewingReport && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-xl rounded-[2.5rem] border border-[var(--border-color)] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Execution Report</h3>
                            <button onClick={() => setViewingReport(null)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-8 p-4 bg-[var(--bg-secondary)] rounded-2xl">
                            <div className="w-12 h-12 rounded-xl bg-spark-red text-white flex items-center justify-center font-black text-lg">
                                {viewingReport.influencerName?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-black text-[var(--text-primary)]">{viewingReport.influencerName}</h4>
                                <p className="text-[10px] font-black text-spark-red uppercase tracking-widest">{viewingReport.influencerUniversity}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Campaign Submission</label>
                                <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-[var(--text-primary)] leading-relaxed italic">
                                    "{viewingReport.submission?.text}"
                                </div>
                            </div>
                            {viewingReport.submission?.link && (
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Evidence Link</label>
                                    <a 
                                        href={viewingReport.submission.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-2 p-4 bg-spark-red/5 text-spark-red rounded-xl font-black text-sm hover:bg-spark-red/10 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                                        Open Execution Proof
                                    </a>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setViewingReport(null)} className="w-full mt-10 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all">Close Viewer</button>
                    </div>
                </div>
            )}

            {renderContent()}
        </DashboardShell>
    );
};

export default BrandDashboard;
