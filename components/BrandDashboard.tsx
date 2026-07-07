import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy } from '../firebase';
import { UserRole } from '../types';
import { STATES, UNIVERSITIES, BACKEND_URL } from '../constants';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { notifyTopUp, notifyProposalStatus, notifyApplicationDecision, notifyReportRejected } from '../emailNotifier';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { CreatorProfileModal } from './CreatorProfileModal';
import { WalletService, CampaignAllocation } from '../WalletService';
import { Calendar, Wallet, BarChart3, Lock, Plus, Minus, Mail, Users, Megaphone, Inbox, TrendingUp, ArrowUpRight, ArrowDownLeft, Activity, Handshake, Building2, Search, Briefcase, FileText, Download, Edit, Trash2, User } from 'lucide-react';

const parsePackages = (packagesField: any): { name: string; price: number; entails: string; }[] => {
    if (!packagesField) return [];
    if (Array.isArray(packagesField)) return packagesField;
    if (typeof packagesField === 'string') {
        try {
            const parsed = JSON.parse(packagesField);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            return [{ name: 'Custom Sponsorship', price: 0, entails: packagesField }];
        }
    }
    return [];
};

const BrandDashboard: React.FC<{ 
    onNavigate: (page: string) => void,
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    themeMode: 'light' | 'dark' | 'auto',
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, themeMode, user }) => {
    const [currentView, setCurrentView] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [eventTab, setEventTab] = useState<'explore' | 'my'>('explore');
    const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('brand_checklist');
            return saved ? JSON.parse(saved) : {
                profile: false,
                wallet: false,
                campaign: false,
                invite: false,
                proposals: false
            };
        } catch {
            return {
                profile: false,
                wallet: false,
                campaign: false,
                invite: false,
                proposals: false
            };
        }
    });

    const toggleChecklistItem = (key: string) => {
        const updated = { ...checklist, [key]: !checklist[key] };
        setChecklist(updated);
        localStorage.setItem('brand_checklist', JSON.stringify(updated));
    };
    const [selectedState, setSelectedState] = useState('All');
    const [selectedUni, setSelectedUni] = useState('All');
    const [loading, setLoading] = useState(true);
    const [creators, setCreators] = useState<any[]>([]);
    const [brandProfile, setBrandProfile] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [selectedCreator, setSelectedCreator] = useState<any>(null);
    const [proposing, setProposing] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalRecipient, setProposalRecipient] = useState<{ id: string, name: string } | null>(null);
    const [proposalInitialMessage, setProposalInitialMessage] = useState('');
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedSponsorshipPackage, setSelectedSponsorshipPackage] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [campaignForm, setCampaignForm] = useState({ 
        title: '', 
        brief: '', 
        budget: '', 
        deadline: '', 
        category: 'Awareness',
        objective: '',
        audience: '',
        location: '',
        deliverables: ''
    });
    const [campaignSubmitting, setCampaignSubmitting] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
    const [editingGig, setEditingGig] = useState<any>(null);
    const [topUpAmount, setTopUpAmount] = useState('5000');
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [eventFormData, setEventFormData] = useState({ 
        name: '', 
        date: '', 
        location: '', 
        description: '', 
        targetSponsorship: '',
        // New detailed event fields
        expectedAttendees: '',
        sponsorshipSlots: '',
        sponsorshipPackages: '',
        activationNeeds: '',
        // Volunteer campaign fields
        needVolunteers: 'no', // 'no' | 'yes'
        volunteerType: 'unpaid', // 'paid' | 'unpaid'
        campaignTitle: '',
        campaignCategory: 'Event Promo',
        campaignBrief: '',
        campaignBudget: '',
        campaignDeadline: ''
    });
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [eventSubmitting, setEventSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [editEventFormData, setEditEventFormData] = useState({ 
        name: '', 
        date: '', 
        location: '', 
        description: '', 
        targetSponsorship: '',
        expectedAttendees: '',
        sponsorshipSlots: '',
        sponsorshipPackages: '',
        activationNeeds: ''
    });
    const [editEventSubmitting, setEditEventSubmitting] = useState(false);

    const [formPackages, setFormPackages] = useState<{ name: string; price: string; entails: string; }[]>([
        { name: 'Bronze', price: '50000', entails: 'Logo placement on flyer' },
        { name: 'Silver', price: '150000', entails: 'Logo placement, social mentions & standard event booth' },
        { name: 'Gold', price: '400000', entails: 'Title sponsor, main stage logo, VIP booths & 5 tickets' }
    ]);
    const [editFormPackages, setEditFormPackages] = useState<{ name: string; price: string; entails: string; }[]>([
        { name: '', price: '', entails: '' }
    ]);

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

    // â”€â”€ Campaign & Allocation state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [walletData, setWalletData] = useState<{ available: number; locked: number }>({ available: 0, locked: 0 });
    const [allAllocations, setAllAllocations] = useState<CampaignAllocation[]>([]);
    const [campaignAllocations, setCampaignAllocations] = useState<Record<string, CampaignAllocation[]>>({});
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [allocationTarget, setAllocationTarget] = useState<any>(null); // creator card
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
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
    
    // Influencer profile view
    const [viewingProfile, setViewingProfile] = useState<any>(null);
    const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<any>(null);

    const handleViewInfluencer = async (influencerId: string, fallbackData: any) => {
        setViewingProfile({ ...fallbackData, id: influencerId, loading: true });
        try {
            const userDoc = await getDoc(doc(db, "users", influencerId));
            if (userDoc.exists()) {
                setViewingProfile({ id: influencerId, ...userDoc.data() });
            } else {
                setViewingProfile({ id: influencerId, ...fallbackData });
            }
        } catch (error) {
            console.error("Error fetching influencer details:", error);
            setViewingProfile({ id: influencerId, ...fallbackData });
        }
    };

    const sanitizeSocialLink = (url: string, platform: string) => {
        if (!url) return '';
        let cleanUrl = url.trim();
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            return cleanUrl;
        }
        if (cleanUrl.startsWith('@')) {
            cleanUrl = cleanUrl.substring(1);
        }
        switch (platform) {
            case 'instagram':
                return `https://instagram.com/${cleanUrl}`;
            case 'tiktok':
                return `https://tiktok.com/@${cleanUrl}`;
            case 'twitter':
                return `https://x.com/${cleanUrl}`;
            case 'linkedin':
                return cleanUrl.includes('linkedin.com') ? `https://${cleanUrl}` : `https://linkedin.com/in/${cleanUrl}`;
            default:
                return `https://${cleanUrl}`;
        }
    };

    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedAppToApprove, setSelectedAppToApprove] = useState<any>(null);
    const [approvalAmount, setApprovalAmount] = useState('');
    const [approvalSubmitting, setApprovalSubmitting] = useState(false);

    // Escrow release OTP modal state
    const [showReleaseOtpModal, setShowReleaseOtpModal] = useState(false);
    const [releaseOtpAllocation, setReleaseOtpAllocation] = useState<CampaignAllocation | null>(null);
    const [releaseOtp, setReleaseOtp] = useState('');
    const [releaseOtpSubmitting, setReleaseOtpSubmitting] = useState(false);

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
        if (status === 'accepted') {
            const app = applicants.find(a => a.id === appId);
            setSelectedAppToApprove({ appId, ...app });
            setApprovalAmount(String(viewingApplicants.reward || ''));
            setShowApprovalModal(true);
            return;
        }
        
        try {
            await apiClient.patch(`gigs/${viewingApplicants.id}/applications/${appId}`, { status });
            // Refresh list
            const res = await apiClient.get(`gigs/${viewingApplicants.id}/applications`);
            setApplicants(res.data);
        } catch (err: any) {
            alert(err.message || 'Failed to update application.');
        }
    };

    const confirmApproval = async () => {
        if (!viewingApplicants || !selectedAppToApprove || !approvalAmount) return;
        const amount = Number(approvalAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setApprovalSubmitting(true);
        try {
            // 1. Mark application as accepted in our system
            await apiClient.patch(`gigs/${viewingApplicants.id}/applications/${selectedAppToApprove.appId}`, { 
                status: 'accepted',
                amount 
            });

            // 2. Initialize Escrow for the creator payout
            let escrowData: any = null;
            try {
                const escrowRes = await fetch(`${BACKEND_URL}/api/escrow/initialize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gigTitle: viewingApplicants.title,
                        gigDescription: viewingApplicants.description || viewingApplicants.brief,
                        amount,
                        deadline: viewingApplicants.deadline,
                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                        brandEmail: brandProfile.email || user?.email,
                        creatorName: selectedAppToApprove.name || selectedAppToApprove.creatorName || 'Creator',
                        creatorEmail: selectedAppToApprove.email || selectedAppToApprove.creatorEmail,
                    }),
                });
                const escrowJson = await escrowRes.json();
                if (escrowRes.ok && escrowJson.escrow_id) {
                    escrowData = escrowJson;
                } else {
                    console.warn('[Escrow] Init response:', escrowJson);
                }
            } catch (escrowErr: any) {
                console.warn('[Escrow] Init failed (non-blocking):', escrowErr.message);
                escrowData = null;
            }

            // 3. Save escrow info to the allocation record in Firestore
            await WalletService.createAllocation({
                campaignId: viewingApplicants.id,
                campaignTitle: viewingApplicants.title,
                brandId: brandProfile.id,
                brandName: brandProfile.name || brandProfile.companyName,
                creatorId: selectedAppToApprove.userId || selectedAppToApprove.id || selectedAppToApprove.appId,
                creatorName: selectedAppToApprove.name || selectedAppToApprove.creatorName || 'Creator',
                creatorUniversity: selectedAppToApprove.university || '',
                creatorEmail: selectedAppToApprove.email || selectedAppToApprove.creatorEmail || '',
                amount,
                status: 'selected',
                ...(escrowData ? { escrowId: escrowData.escrow_id, escrowPaymentUrl: escrowData.payment_url, escrowRef: escrowData.transaction_ref } : {}),
            });

            // Refresh
            const res = await apiClient.get(`gigs/${viewingApplicants.id}/applications`);
            setApplicants(res.data);
            setCampaigns(prev => prev.map(c => c.id === viewingApplicants.id ? { ...c, status: 'in_progress' } : c));
            await fetchAllAllocations(brandProfile.id);
            
            setShowApprovalModal(false);
            setSelectedAppToApprove(null);

            if (escrowData?.payment_url) {
                if (window.confirm(`✅ Creator hired! Now fund the escrow to lock ₦${amount.toLocaleString()} for ${selectedAppToApprove.name || 'the creator'}. Click OK to open the escrow payment page.`)) {
                    window.open(escrowData.payment_url, '_blank');
                }
            } else {
                // Show what the API returned so we can debug
                const escrowErrDetail = (escrowData as any)?._err || 'Check browser console → Network tab for details.';
                alert(`Creator hired! ⚠️ Escrow funding could not be set up automatically.\n\nReason: ${escrowErrDetail}\n\nYou can fund it manually from the campaign detail view.`);
            }
        } catch (err: any) {
            alert(err.message || 'Failed to approve application.');
        } finally {
            setApprovalSubmitting(false);
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
                where('userId', '==', brandProfile.id)
            );
            
            const transSnap = await getDocs(q);
            const mappedTrans = (transSnap.docs || []).map(d => ({ id: d.id, ...d.data() }));
            
            // Sort client-side to avoid missing index errors and handle different timestamp formats
            const sortedTrans = mappedTrans.sort((a, b) => {
                const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
                const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
                return dateB - dateA;
            }).slice(0, 50);

            setTransactions(sortedTrans);
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

    // Derive a creator's status across all campaigns
    const getCreatorStatus = (creatorId: string): 'available' | 'in_campaign' => {
        const match = allAllocations.find(a => a.creatorId === creatorId && a.status !== 'paid' && a.status !== 'rejected');
        if (!match) return 'available';
        return 'in_campaign';
    };

    // Calculate budget stats for a campaign
    const getCampaignBudgetStats = (campaign: any) => {
        const allocations = campaignAllocations[campaign.id] || [];
        const allocated = allocations.filter(a => a.status !== 'rejected').reduce((s, a) => s + a.amount, 0);
        
        // LEGACY SUPPORT: If a campaign was posted before the budget system, it won't have a 'budget' field.
        // We fallback to 'reward' but treat it as non-blocking for approvals since it was balance-based.
        const isLegacy = !Object.hasOwn(campaign, 'budget') && !!campaign.reward;
        const budget = Number(campaign.budget || campaign.reward || 0);
        
        return { 
            budget, 
            allocated, 
            remaining: isLegacy ? 9999999 : Math.max(0, budget - allocated),
            isLegacy 
        };
    };

    // Open the "Add to Campaign" modal
    const openAllocationModal = (creator: any) => {
        setAllocationTarget(creator);
        setAllocationForm({ campaignId: campaigns[0]?.id || '', amount: '' });
        setShowCreateInModal(false);
        setShowAllocationModal(true);
    };

    // Confirm allocation â†’ persist to Firestore & lock funds
    const handleAllocateCreator = async () => {
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
            // 1. Initialize Escrow for the creator payout
            let escrowData: any = null;
            try {
                const escrowRes = await fetch(`${BACKEND_URL}/api/escrow/initialize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gigTitle: campaign.title,
                        gigDescription: campaign.description || campaign.brief || `Allocation for creator: ${allocationTarget.name}`,
                        amount,
                        deadline: campaign.deadline,
                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                        brandEmail: brandProfile.email || user?.email,
                        creatorName: allocationTarget.name || 'Creator',
                        creatorEmail: allocationTarget.email || '',
                    }),
                });
                const escrowJson = await escrowRes.json();
                if (escrowRes.ok && escrowJson.escrow_id) {
                    escrowData = escrowJson;
                } else {
                    console.warn('[Escrow] Init response:', escrowJson);
                }
            } catch (escrowErr: any) {
                console.warn('[Escrow] Init failed (non-blocking):', escrowErr.message);
                escrowData = { _err: escrowErr.message };
            }

            // 2. Create campaign allocation with escrow details in Firestore
            await WalletService.createAllocation({
                campaignId: campaign.id,
                campaignTitle: campaign.title,
                brandId: brandProfile.id,
                brandName: brandProfile.name || brandProfile.brandName,
                creatorId: allocationTarget.id,
                creatorName: allocationTarget.name,
                creatorUniversity: allocationTarget.university || '',
                creatorEmail: allocationTarget.email || '',
                amount,
                status: 'selected',
                ...(escrowData?.escrow_id ? { escrowId: escrowData.escrow_id, escrowPaymentUrl: escrowData.payment_url, escrowRef: escrowData.transaction_ref } : {}),
            });

            await fetchAllAllocations(brandProfile.id);
            setShowAllocationModal(false);
            setAllocationTarget(null);

            if (escrowData?.payment_url) {
                if (window.confirm(`✅ Creator allocated! Now fund the escrow to lock ₦${amount.toLocaleString()} for ${allocationTarget.name}. Click OK to open the escrow payment page.`)) {
                    window.open(escrowData.payment_url, '_blank');
                }
            } else {
                const escrowErrDetail = escrowData?._err || 'Check browser console → Network tab for details.';
                alert(`Creator allocated! ⚠️ Escrow funding could not be set up automatically.\n\nReason: ${escrowErrDetail}\n\nYou can fund it manually from the campaign detail view.`);
            }
        } catch (e: any) {
            alert(e.message || 'Failed to allocate creator.');
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

    // Release payment → trigger Escrow OTP release flow
    const handleReleasePayment = async (allocation: CampaignAllocation) => {
        if (!brandProfile?.id || !allocation.id) return;
        const escrowId = (allocation as any).escrowId;
        if (!escrowId) {
            // Legacy allocation without escrow — fallback to direct wallet release
            if (!window.confirm(`Release ₦${allocation.amount.toLocaleString()} to ${allocation.creatorName}?\n\n(Note: This allocation was created before escrow integration. Funds will be released from wallet balance.)`)) return;
            setReleaseSubmitting(allocation.id);
            try {
                await WalletService.releaseAllocationPayment(brandProfile.id, allocation.id, selectedCampaignDetail?.title || 'Campaign');
                await Promise.all([
                    syncWalletStrip(brandProfile.id),
                    fetchAllAllocations(brandProfile.id),
                    selectedCampaignDetail ? (async () => { const u = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id); setDetailAllocations(u); })() : Promise.resolve()
                ]);
                alert('Payment released!');
            } catch (e: any) { alert(e.message || 'Failed.'); }
            finally { setReleaseSubmitting(null); }
            return;
        }

        // New escrow-based release — request OTP, then show entry modal
        setReleaseSubmitting(allocation.id);
        try {
            const otpRes = await fetch(`${BACKEND_URL}/api/escrow/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    escrow_id: escrowId,
                    brandEmail: brandProfile.email || user?.email,
                    brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                    creatorName: allocation.creatorName,
                    amount: allocation.amount,
                }),
            });
            const otpData = await otpRes.json();
            if (!otpRes.ok) throw new Error(otpData.error || 'Failed to send OTP.');
        } catch (e: any) {
            alert(e.message || 'Could not send OTP. Please try again.');
            setReleaseSubmitting(null);
            return;
        } finally {
            setReleaseSubmitting(null);
        }

        setReleaseOtpAllocation(allocation);
        setReleaseOtp('');
        setShowReleaseOtpModal(true);
    };

    // Confirm escrow release via Escrow OTP
    const confirmEscrowRelease = async () => {
        if (!releaseOtpAllocation || !releaseOtp.trim()) return;
        const escrowId = (releaseOtpAllocation as any).escrowId;
        setReleaseOtpSubmitting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/escrow/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrow_id: escrowId, otp: releaseOtp.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Escrow release failed.');

            // Credit creator wallet balance + deduct brand escrow + log transactions
            // This is the full payout flow: creator sees funds in their dashboard
            // and admin can then initiate manual disbursement to their bank account.
            await WalletService.releaseAllocationPayment(
                brandProfile.id,
                releaseOtpAllocation.id,
                selectedCampaignDetail?.title || releaseOtpAllocation.campaignTitle || 'Campaign',
                { escrowRelease: true }
            );

            await Promise.all([
                syncWalletStrip(brandProfile.id),
                fetchAllAllocations(brandProfile.id),
                selectedCampaignDetail
                    ? (async () => { const u = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id); setDetailAllocations(u); })()
                    : Promise.resolve()
            ]);
            setReleaseSubmitting(null);
            setShowReleaseOtpModal(false);
            setReleaseOtp('');
            alert(`Payment released successfully! ₦${releaseOtpAllocation.amount?.toLocaleString()} has been credited to ${releaseOtpAllocation.creatorName}'s wallet. They can now request a payout to their bank account.`);
        } catch (e: any) {
            console.error('Escrow release error:', e);
            alert(e.message || 'Failed to release escrow payment.');
        } finally {
            setReleaseOtpSubmitting(false);
        }
    };


    const handleReleaseSponsorship = async (proposal: any) => {
        if (!brandProfile?.id || !proposal.id) return;
        const amount = Number(proposal.budget);
        if (isNaN(amount) || amount <= 0) {
            alert("This proposal does not have a valid budget amount.");
            return;
        }

        if (!window.confirm(`Pay ₦${amount.toLocaleString()} sponsorship to ${proposal.sender?.name}? You will be redirected to Paystack to complete this payment.`)) return;

        // Direct Paystack payment — no wallet top-up needed
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
            alert('Paystack is not loaded. Please refresh and try again.');
            return;
        }
        try {
            const reference = `SPONS-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            const handler = PaystackPop.setup({
                key: 'pk_test_5ee439620d8a49acc254131ede19b9063d8fe95f',
                email: brandProfile.email || user?.email || 'brand@campushub.africa',
                amount: amount * 100, // Paystack uses kobo
                currency: 'NGN',
                ref: reference,
                metadata: {
                    userId: brandProfile.id,
                    type: 'sponsorship',
                    proposalId: proposal.id,
                    recipientId: proposal.senderId,
                },
                callback: function(response: any) {
                    (async () => {
                        try {
                            setLoading(true);
                            // Credit org wallet and record transaction
                            await WalletService.paySponsorship(
                                brandProfile.id,
                                proposal.senderId,
                                amount,
                                proposal.eventName || proposal.message?.substring(0, 40) || 'Event Sponsorship'
                            );
                            await apiClient.patch(`proposals/${proposal.id}`, { status: 'paid' });
                            alert(`✅ Sponsorship of ₦${amount.toLocaleString()} paid successfully!`);
                            await fetchProposals();
                        } catch (err: any) {
                            alert('Payment captured but wallet update failed: ' + err.message);
                        } finally {
                            setLoading(false);
                        }
                    })();
                },
                onClose: () => { console.log('[Paystack Sponsorship] Modal closed'); }
            });
            handler.openIframe();
        } catch (e: any) {
            alert('Paystack Setup Error: ' + e.message);
        }
    };

    // Reject allocation â†’ refund to available balance, mark rejected
    const handleRejectAllocation = async (allocation: CampaignAllocation) => {
        if (!brandProfile?.id || !allocation.id) return;
        if (!window.confirm(`Reject and refund ₦${allocation.amount.toLocaleString()} for ${allocation.creatorName}?`)) return;
        try {
            await WalletService.refundAllocation(
                brandProfile.id,
                allocation.amount,
                `Refund: ${allocation.creatorName} removed from campaign`,
                allocation.creatorId
            );
            await WalletService.updateAllocationStatus(allocation.id, 'rejected');

            // Notify Creator
            if (allocation.creatorEmail) {
                notifyApplicationDecision(
                    allocation.creatorEmail,
                    allocation.creatorName || 'Creator',
                    allocation.campaignTitle || 'Campaign',
                    brandProfile.name || 'Brand',
                    'rejected'
                );
            }

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
        const reason = window.prompt('Why are you rejecting this report? (This will be shown to the creator)');
        if (reason === null) return; // User clicked cancel

        try {
            await WalletService.updateAllocationStatus(allocation.id, 'revision', { revisionReason: reason });

            // Notify Creator
            if (allocation.creatorEmail) {
                notifyReportRejected(
                    allocation.creatorEmail,
                    allocation.creatorName || 'Creator',
                    allocation.campaignTitle || 'Campaign',
                    brandProfile.name || 'Brand'
                );
            }

            await fetchAllAllocations(brandProfile.id);
            if (selectedCampaignDetail) {
                const updated = await WalletService.getAllocationsForCampaign(selectedCampaignDetail.id);
                setDetailAllocations(updated);
            }
            alert('Report sent back for revision.');
        } catch (e: any) {
            alert(e.message || 'Failed to reject report.');
        }
    };

    // Handle inline campaign creation from the allocation modal
    const handleInlineCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!brandProfile?.id) return;
        
        const amount = Number(inlineCreateForm.budget);
        const totalRequired = amount;

        if (walletData.available < totalRequired) {
            alert(`Insufficient wallet balance. You need ₦${totalRequired.toLocaleString()} campaign budget but only have ₦${walletData.available.toLocaleString()}.`);
            return;
        }

        if (!window.confirm(`Launch campaign?`)) return;

        setInlineCreateSubmitting(true);
        try {

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
            alert("Campaign launched successfully!");
        } catch (err: any) {
            console.error("Create error:", err);
            alert(err.message || "Failed to create campaign");
        } finally {
            setInlineCreateSubmitting(false);
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
        { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
        { id: 'directory', label: 'Creator Directory', icon: <Users className="w-5 h-5" /> },
        { id: 'associations', label: 'Association Directory', icon: <Building2 className="w-5 h-5" /> },
        { id: 'proposals', label: 'Offers & Proposals', icon: <Inbox className="w-5 h-5" /> },
        { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
        { id: 'wallet', label: 'Wallet & Billing', icon: <Wallet className="w-5 h-5" /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'profile', label: 'Company Profile', icon: <User className="w-5 h-5" /> },
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

    const fetchMyEvents = async () => {
        if (!brandProfile?.id) return;
        try {
            const res = await apiClient.get(`events?hostId=${brandProfile.id}`);
            setMyEvents(res.data || []);
        } catch (e) {
            console.error("fetchMyEvents error:", e);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !brandProfile?.id) return;
        if (!eventFormData.name.trim() || !eventFormData.date || !eventFormData.location.trim() || !eventFormData.description.trim() || !eventFormData.targetSponsorship) {
            alert('Please fill in all event fields.');
            return;
        }

        // Volunteer Campaign Validation & Wallet Balance Check
        const isVolunteer = eventFormData.needVolunteers === 'yes';
        const isPaid = isVolunteer && eventFormData.volunteerType === 'paid';
        const paidBudget = isPaid ? Number(eventFormData.campaignBudget) : 0;

        if (isVolunteer) {
            if (!eventFormData.campaignTitle.trim()) {
                alert('Please enter a campaign title.');
                return;
            }
            if (!eventFormData.campaignBrief.trim()) {
                alert('Please enter a campaign brief.');
                return;
            }
            if (!eventFormData.campaignDeadline) {
                alert('Please enter a campaign deadline.');
                return;
            }
            if (isPaid) {
                if (isNaN(paidBudget) || paidBudget <= 0) {
                    alert('Please enter a valid budget for paid volunteers.');
                    return;
                }
                // Events are free to list — only need volunteer budget in wallet
                if (walletData.available < paidBudget) {
                    alert(`Insufficient wallet balance for paid volunteers. You need ₦${paidBudget.toLocaleString()} volunteer budget but only have ₦${walletData.available.toLocaleString()}.`);
                    return;
                }
            }
        }

        setEventSubmitting(true);
        try {
            // 1. Create Event
            const hostName = brandProfile?.name || "Brand";
            const uni = brandProfile?.location || brandProfile?.university || "National";
            const eventPayload = {
                name: eventFormData.name.trim(),
                date: eventFormData.date,
                location: eventFormData.location.trim(),
                description: eventFormData.description.trim(),
                targetSponsorship: Number(eventFormData.targetSponsorship),
                expectedAttendees: eventFormData.expectedAttendees ? Number(eventFormData.expectedAttendees) : 0,
                sponsorshipSlots: eventFormData.sponsorshipSlots ? Number(eventFormData.sponsorshipSlots) : 0,
                sponsorshipPackages: formPackages.map(pkg => ({ name: pkg.name, price: Number(pkg.price), entails: pkg.entails })),
                activationNeeds: eventFormData.activationNeeds.trim(),
                hostName: hostName,
                hostId: user.uid,
                hostEmail: user.email,
                hostRole: 'Brand',
                university: uni,
                status: 'published',
                createdAt: new Date().toISOString()
            };
            const eventRes = await apiClient.post('events', eventPayload);
            const createdEventId = eventRes.data.id;

            // 2. Create Campaign (if selected)
            if (isVolunteer) {
                if (isPaid) {
                    // Events are free — no listing fee for event sponsorship listings
                    // Post Gig
                    const gigPayload = {
                        title: eventFormData.campaignTitle.trim(),
                        description: eventFormData.campaignBrief.trim(),
                        brief: eventFormData.campaignBrief.trim(),
                        reward: paidBudget,
                        budget: paidBudget,
                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                        status: 'open',
                        brandId: brandProfile.id,
                        brandEmail: brandProfile.email,
                        category: eventFormData.campaignCategory,
                        deadline: eventFormData.campaignDeadline,
                        eventId: createdEventId,
                        createdAt: new Date().toISOString()
                    };
                    const gigRes = await apiClient.post('gigs', gigPayload);

                    // Lock budget in escrow
                    await WalletService.lockCampaignBudget(brandProfile.id, gigRes.data.id, paidBudget, eventFormData.campaignTitle);
                } else {
                    // Unpaid Volunteer Gig (budget = 0, no listing fee)
                    const gigPayload = {
                        title: eventFormData.campaignTitle.trim(),
                        description: eventFormData.campaignBrief.trim(),
                        brief: eventFormData.campaignBrief.trim(),
                        reward: 0,
                        budget: 0,
                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                        status: 'open',
                        brandId: brandProfile.id,
                        brandEmail: brandProfile.email,
                        category: eventFormData.campaignCategory,
                        deadline: eventFormData.campaignDeadline,
                        eventId: createdEventId,
                        createdAt: new Date().toISOString()
                    };
                    await apiClient.post('gigs', gigPayload);
                }

                alert(isPaid ? 'Event published and paid volunteer campaign launched!' : 'Event published and unpaid volunteer campaign launched!');
            } else {
                alert('Event published successfully!');
            }

            // Close modal & reset form
            setShowCreateEventModal(false);
            setEventFormData({ 
                name: '', 
                date: '', 
                location: '', 
                description: '', 
                targetSponsorship: '',
                needVolunteers: 'no',
                volunteerType: 'unpaid',
                campaignTitle: '',
                campaignCategory: 'Event Promo',
                campaignBrief: '',
                campaignBudget: '',
                campaignDeadline: ''
            });
            setFormPackages([
                { name: 'Bronze', price: '50000', entails: 'Logo placement on flyer' },
                { name: 'Silver', price: '150000', entails: 'Logo placement, social mentions & standard event booth' },
                { name: 'Gold', price: '400000', entails: 'Title sponsor, main stage logo, VIP booths & 5 tickets' }
            ]);

            // Refresh all dashboard metrics & collections
            fetchMyEvents();
            fetchCampaigns();
            syncWalletStrip(brandProfile.id);
            fetchAllAllocations(brandProfile.id);
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || err.message || "Failed to publish event.");
        } finally {
            setEventSubmitting(false);
        }
    };

    const handleEditEvent = (event: any) => {
        setEditingEvent(event);
        setEditEventFormData({
            name: event.name,
            date: event.date,
            location: event.location || '',
            description: event.description,
            targetSponsorship: String(event.targetSponsorship || 0),
            expectedAttendees: String(event.expectedAttendees || ''),
            sponsorshipSlots: String(event.sponsorshipSlots || ''),
            sponsorshipPackages: '',
            activationNeeds: event.activationNeeds || ''
        });
        const parsed = parsePackages(event.sponsorshipPackages);
        setEditFormPackages(parsed.length > 0 ? parsed.map(pkg => ({ name: pkg.name, price: String(pkg.price), entails: pkg.entails })) : [{ name: '', price: '', entails: '' }]);
    };

    const handleSaveEditEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;
        setEditEventSubmitting(true);
        try {
            await apiClient.patch(`events/${editingEvent.id}`, {
                ...editEventFormData,
                targetSponsorship: Number(editEventFormData.targetSponsorship),
                expectedAttendees: editEventFormData.expectedAttendees ? Number(editEventFormData.expectedAttendees) : 0,
                sponsorshipSlots: editEventFormData.sponsorshipSlots ? Number(editEventFormData.sponsorshipSlots) : 0,
                sponsorshipPackages: editFormPackages.map(pkg => ({ name: pkg.name, price: Number(pkg.price), entails: pkg.entails }))
            });
            setEditingEvent(null);
            fetchMyEvents();
            alert('Event updated successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update event.');
        } finally {
            setEditEventSubmitting(false);
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
                await fetchMyEvents();
                try {
                    const res = await apiClient.get('events');
                    const otherEvents = (res.data || []).filter((e: any) => e.hostId !== brandProfile?.id);
                    setEvents(otherEvents);
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
                // Fetch creators
                const q = query(collection(db, "users"), limit(100));
                const querySnapshot = await getDocs(q);
                
                const creatorRoles = [
                    'Creator', 'Ambassador', 'Ambassador/Influencer', 'Campus Creator',
                    'Student', 'Student/Professional Influencer', 'Professional', 'Influencer',
                    'Creator'
                ];
                const creatorRoleSet = new Set(creatorRoles);

                const creatorsData = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
                    .filter((u: any) => {
                        if (creatorRoleSet.has(u.role)) return true;
                        const role = (u.role || '').toLowerCase();
                        if (role.includes('influencer') || role.includes('creator')) {
                            if (!role.includes('Association') && !role.includes('brand')) return true;
                        }
                        return false;
                    });
                    
                setCreators(creatorsData);
            } catch (err) {
                console.error("Error fetching talent:", err);
            } finally {
                setLoading(false);
            }
        };

        const fetchPartners = async () => {
            setPartnersLoading(true);
            try {
                const roles = ['Organization', 'Association', 'Brand'];
                const q = query(collection(db, "users"), where("role", "in", roles), limit(500));
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                setPartners(data.filter(p => p.id !== brandProfile?.id));
            } catch (err) {
                console.error("Error fetching partners:", err);
            } finally {
                setPartnersLoading(false);
            }
        };

        if (currentView === 'associations') {
            fetchPartners();
        } else {
            fetchData();
        }
    }, [currentView, brandProfile]);

    const handleOpenProposalModal = (creator: any) => {
        setProposalRecipient({ id: creator.id, name: creator.name });
        setProposalInitialMessage('');
        setShowProposalModal(true);
    };

    const handleContactHost = (event: any, selectedPackage?: any) => {
        console.log('Contacting host for event:', event);
        const hostId = event.host?.id || event.hostId;
        const hostName = event.host?.name || event.hostName || "Association";

        if (!hostId) {
            alert('Cannot contact host: Host information (ID) is missing for this event.');
            return;
        }
        setEventBeingSponsored(event);
        setProposalRecipient({ id: hostId, name: hostName });
        if (selectedPackage) {
            setSelectedSponsorshipPackage(selectedPackage);
            setProposalInitialMessage(`Hi ${hostName}, we would like to sponsor the "${selectedPackage.name}" package (₦${Number(selectedPackage.price).toLocaleString()}) for your event "${event.name}".`);
        } else {
            setSelectedSponsorshipPackage(null);
            setProposalInitialMessage(`Hi ${hostName}, we are interested in sponsoring your event "${event.name}".`);
        }
        setShowProposalModal(true);
        setSelectedEvent(null); // Close event modal
    };

    const handleSendProposal = async (data: { recipientId: string; message: string; budget?: string; timeline?: string; documentUrl?: string; documentName?: string; packageName?: string; }) => {
        try {
            // If it's an event sponsorship with a budget, pay directly via Paystack
            if (eventBeingSponsored && data.budget) {
                const amount = Number(data.budget.replace(/[^0-9.]/g, ''));
                if (!isNaN(amount) && amount > 0) {
                    // Save the proposal first, then trigger Paystack
                    const proposalRes = await apiClient.post('proposals', { ...data, status: 'pending_payment', amount, sponsorshipPackageName: data.packageName || null, eventName: eventBeingSponsored.name });
                    const newProposalId = proposalRes.data?.id;

                    setShowProposalModal(false);
                    setProposalRecipient(null);

                    const PaystackPop = (window as any).PaystackPop;
                    if (!PaystackPop) {
                        alert('Paystack is not loaded. Your proposal was saved but payment was not completed. Please go to Proposals and release the payment manually.');
                        fetchProposals();
                        return;
                    }

                    const reference = `SPONS-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
                    const packageLabel = selectedSponsorshipPackage ? ` — ${selectedSponsorshipPackage.name} Package` : '';
                    alert(`Opening Paystack to pay ₦${amount.toLocaleString()} for sponsoring "${eventBeingSponsored.name}"${packageLabel}. The association will receive funds directly.`);

                    const handler = PaystackPop.setup({
                        key: 'pk_test_5ee439620d8a49acc254131ede19b9063d8fe95f',
                        email: brandProfile.email || user?.email || 'brand@campushub.africa',
                        amount: amount * 100,
                        currency: 'NGN',
                        ref: reference,
                        metadata: { userId: brandProfile.id, type: 'sponsorship', proposalId: newProposalId, recipientId: data.recipientId },
                        callback: function(response: any) {
                            (async () => {
                                try {
                                    // Credit the org's wallet
                                    await WalletService.paySponsorship(brandProfile.id, data.recipientId, amount, eventBeingSponsored.name);
                                    if (newProposalId) await apiClient.patch(`proposals/${newProposalId}`, { status: 'paid' });
                                    alert(`✅ Sponsorship of ₦${amount.toLocaleString()} paid and credited to the Association!`);
                                    fetchProposals();
                                } catch (err: any) {
                                    alert('Paystack payment succeeded but wallet credit failed: ' + err.message);
                                }
                            })();
                        },
                        onClose: () => { console.log('[Paystack Sponsorship] closed'); fetchProposals(); }
                    });
                    handler.openIframe();
                    setEventBeingSponsored(null);
                    setSelectedSponsorshipPackage(null);
                    return;
                }
            }

            // Non-sponsored / non-budget proposals — just send the message
            await apiClient.post('proposals', { ...data, sponsorshipPackageName: data.packageName || null });
            alert("Partnership proposal sent successfully!");
            setShowProposalModal(false);
            setProposalRecipient(null);
            setEventBeingSponsored(null);
            setSelectedSponsorshipPackage(null);
            fetchProposals();
        } catch (error: any) {
            console.error("Proposal error:", error);
            alert(error.message || "Failed to send proposal.");
            throw error;
        }
    };

    const handleUpdateStatus = async (id: string, status: string, counterData?: any) => {
        try {
            const payload = counterData ? { status, ...counterData } : { status };
            await apiClient.patch(`proposals/${id}`, payload);
            
            // Notify the sender of the status change
            const prop = proposals.find(p => p.id === id);
            if (prop && prop.sender?.email) {
                notifyProposalStatus(
                    prop.sender.email, 
                    prop.sender.name || 'User', 
                    prop.recipient?.name || brandProfile?.name || 'Brand', 
                    status
                );
            }

            fetchProposals();
        } catch (error) {
            console.error("Update status error:", error);
        }
    };

    const filteredCreators = creators.filter((creator) => {
        const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUni = selectedUni === 'All' || creator.university === selectedUni;
        return matchesSearch && matchesUni;
    });

    const filteredPartners = partners.filter((partner) => {
        const searchLower = partnerSearchTerm.toLowerCase();
        return (
            partner.name?.toLowerCase().includes(searchLower) ||
            partner.role?.toLowerCase().includes(searchLower) ||
            partner.industry?.toLowerCase().includes(searchLower) ||
            partner.email?.toLowerCase().includes(searchLower)
        );
    });

    const renderContent = () => {
        switch (currentView) {
            case 'overview':
                const activeCampaignsCount = campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length;
                const pendingProposalsCount = proposals.filter(p => p.status === 'pending').length;
                const assignedCreatorsCount = allAllocations.length;
                const upcomingEventsCount = events.length;
                
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-4xl font-black text-[var(--text-primary)]">Welcome back, {brandProfile?.name || 'Partner'}</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Here is a quick overview of your brand campaigns, creator gigs, sponsorships, and ongoing collaborations.</p>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setCurrentView('campaigns')}>
                                <div className="w-10 h-10 rounded-xl bg-spark-red/10 text-spark-red flex items-center justify-center mb-4 font-bold">📢</div>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Active Campaigns</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">{activeCampaignsCount}</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setCurrentView('proposals')}>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 font-bold">📩</div>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Pending Proposals</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">{pendingProposalsCount}</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setCurrentView('wallet')}>
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4 font-bold">₦</div>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Wallet Balance</p>
                                <p className="text-3xl font-black text-green-600">₦{(wallet?.balance || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setCurrentView('directory')}>
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 font-bold">👥</div>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Assigned Creators</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">{assignedCreatorsCount}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Checklist */}
                            <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm flex flex-col justify-between lg:col-span-2">
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-black text-[var(--text-primary)]">Next Action Checklist</h3>
                                        <span className="text-[10px] font-black text-spark-red uppercase tracking-widest bg-spark-red/5 px-2.5 py-1 rounded-full">Interactive Tasks</span>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'profile', title: 'Complete Brand Profile Details', desc: 'Ensure your logo, bio and category are complete.', autofill: !!brandProfile?.name },
                                            { key: 'wallet', title: 'Fund Your Wallet', desc: 'Top up your Paystack balance to activate escrow locked hires.', autofill: (wallet?.balance || 0) > 0 },
                                            { key: 'campaign', title: 'Launch a Marketing Campaign', desc: 'Create a campaign and define objectives and deliverables.', autofill: campaigns.length > 0 },
                                            { key: 'invite', title: 'Invite Student Creators', desc: 'Browse the talent directory and click "Hire" to allocate creator tasks.', autofill: allAllocations.length > 0 },
                                            { key: 'proposals', title: 'Review Pending Sponsor Applications', desc: 'Respond to incoming proposals or create counter-offers.', autofill: pendingProposalsCount === 0 && proposals.length > 0 }
                                        ].map((item, idx) => {
                                            const isChecked = checklist[item.key] || item.autofill;
                                            return (
                                                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer items-start" onClick={() => toggleChecklistItem(item.key)}>
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs flex-shrink-0 transition-all ${isChecked ? 'bg-spark-red border-spark-red text-white' : 'border-gray-300 bg-white'}`}>
                                                        {isChecked && '✓'}
                                                    </div>
                                                    <div>
                                                        <p className={`font-black text-sm leading-tight ${isChecked ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>{item.title}</p>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium leading-relaxed">{item.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Notifications / Messages & Upcoming Events */}
                            <div className="space-y-8">
                                {/* Message Count */}
                                <div className="bg-spark-black text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between h-44">
                                    <div>
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Communication Hub</p>
                                        <h3 className="text-2xl font-black text-white">Unread Messages</h3>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-5xl font-black">2</span>
                                        <button className="px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-black uppercase hover:bg-white/20 transition-all" onClick={() => setCurrentView('proposals')}>Open Proposals</button>
                                    </div>
                                </div>

                                {/* Upcoming Events Preview */}
                                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-black text-[var(--text-primary)]">Upcoming Events</h3>
                                        <button className="text-[10px] font-black text-spark-red uppercase hover:underline" onClick={() => setCurrentView('events')}>View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {events.slice(0, 3).length === 0 ? (
                                            <p className="text-xs text-[var(--text-secondary)] italic">No upcoming events listed by associations.</p>
                                        ) : (
                                            events.slice(0, 3).map((event, idx) => (
                                                <div key={idx} className="p-4 rounded-xl border border-[var(--border-color)] hover:border-spark-red/50 transition-all cursor-pointer" onClick={() => { setSelectedEvent(event); setCurrentView('events'); }}>
                                                    <p className="font-black text-sm text-[var(--text-primary)] line-clamp-1">{event.name}</p>
                                                    <div className="flex gap-3 text-[10px] text-[var(--text-secondary)] font-bold mt-1 uppercase">
                                                        <span className="text-spark-red">{event.date}</span>
                                                        <span>{event.university || 'Campus'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'associations':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h2 className="text-4xl font-black text-[var(--text-primary)]">Association Directory</h2>
                                <p className="text-[var(--text-secondary)] mt-1">Connect with student associations, youth communities, and professional bodies for direct collaboration.</p>
                            </div>
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] group-focus-within:text-spark-red transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search associations..." 
                                    value={partnerSearchTerm}
                                    onChange={(e) => setPartnerSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl font-bold outline-none focus:border-spark-red transition-all"
                                />
                            </div>
                        </div>

                        {partnersLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : filteredPartners.length === 0 ? (
                            <DashboardPlaceholder 
                                icon={<Handshake className="w-12 h-12" />}
                                title={partnerSearchTerm ? "No matching associations" : "No Associations Available"}
                                message={partnerSearchTerm ? `We couldn't find any associations matching "${partnerSearchTerm}".` : "We couldn't find any student associations at the moment."}
                            />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPartners.map((partner) => {
                                    const size = partner.membershipSize || partner.audienceSize || "1,200+ Members";
                                    const locationStr = partner.university || partner.location || "Campus Main Gate";
                                    const type = partner.role === 'Organization' ? 'Student Organization' : 'Campus Association';
                                    const packageSummary = "Bronze, Silver, Gold Packages Available";
                                    return (
                                        <div key={partner.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                            <div>
                                                <div className="h-24 bg-spark-red/5 transition-colors" />
                                                <div className="px-8 pb-4 -mt-12">
                                                    <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] rounded-[1.5rem] shadow-lg flex items-center justify-center text-3xl font-black text-spark-red mb-4 overflow-hidden">
                                                        {partner.imageUrl ? <img src={partner.imageUrl} className="w-full h-full object-cover" /> : partner.name?.charAt(0)}
                                                    </div>
                                                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors">{partner.name}</h3>
                                                    <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-4">{type}</p>
                                                    
                                                    <div className="space-y-2 mb-4 text-xs font-semibold text-[var(--text-secondary)]">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-spark-red">📍 Location:</span>
                                                            <span>{locationStr}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-spark-red">👥 Size:</span>
                                                            <span>{size}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-spark-red">📦 Packages:</span>
                                                            <span className="text-[11px] font-black text-green-600">{packageSummary}</span>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 min-h-[40px] font-medium leading-relaxed">
                                                        {partner.bio || `Connect with ${partner.name} for sponsorship and strategic collaborations.`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-8 pb-8">
                                                <button 
                                                    onClick={() => {
                                                        setProposalRecipient({ id: partner.id, name: partner.name });
                                                        setProposalInitialMessage(`Hi ${partner.name}, we would like to explore sponsorship and event partnership with your association.`);
                                                        setShowProposalModal(true);
                                                    }}
                                                    className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    Send Sponsorship Proposal
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'directory':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Creator Directory</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Browse and discover verified creators, micro-influencers, and activation talents that match your campaign goals.</p>
                        </div>
                        {/* â”€â”€ Active Campaign Overview Panel â”€â”€ */}



                        {/* â”€â”€ Search Bar â”€â”€ */}
                        <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)] flex flex-col xl:flex-row gap-6 items-center">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="text"
                                    placeholder="Search campus creators..."
                                    className="w-full pl-12 pr-4 py-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl outline-none font-medium text-[var(--text-primary)]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="absolute left-4 top-4.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                        </div>

                        {/* â”€â”€ Talent Grid â”€â”€ */}
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredCreators.map(creator => {
                                    const status = getCreatorStatus(creator.id);
                                    const statusConfig = {
                                        available: { label: 'Available', cls: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        in_campaign: { label: 'Active', cls: 'bg-spark-red/10 text-spark-red border border-spark-red/20' },
                                    }[status];
                                    const rating = creator.rating || "4.8";
                                    const category = creator.category || "Social Media Influencer";
                                    const location = creator.location || creator.university || "Main Campus";
                                    const audienceSize = creator.audienceSize || "12.5k followers";
                                    const pricing = creator.pricing || "₦20k - ₦50k / post";
                                    return (
                                        <div key={creator.id} className={`group bg-[var(--bg-primary)] rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 flex flex-col justify-between ${status === 'in_campaign' ? 'border-spark-red/30 ring-1 ring-spark-red/10' : 'border-[var(--border-color)]'}`}>
                                            <div>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusConfig.cls}`}>{statusConfig.label}</span>
                                                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                                        <span>★</span>
                                                        <span>{rating}</span>
                                                    </div>
                                                </div>
                                                <div className="w-16 h-16 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-2xl mx-auto mb-4 overflow-hidden">
                                                    {creator.imageUrl ? <img src={creator.imageUrl} className="w-full h-full object-cover" /> : (creator.name || '?').charAt(0)}
                                                </div>
                                                <h3 className="font-black text-lg line-clamp-1 text-[var(--text-primary)] text-center">{creator.name}</h3>
                                                <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mb-3 text-center">{category}</p>
                                                
                                                <div className="space-y-1.5 mb-6 text-xs text-[var(--text-secondary)] font-medium">
                                                    <p className="flex items-center gap-1.5 justify-center">
                                                        <span>📍</span> {location}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 justify-center font-bold text-[var(--text-primary)]">
                                                        <span>📊 Reach:</span> {audienceSize}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 justify-center text-green-600 font-black">
                                                        <span>💰 Rate:</span> {pricing}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingProfile(creator)}
                                                    className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--bg-tertiary)] transition-all text-xs border border-[var(--border-color)]"
                                                >
                                                    Portfolio
                                                </button>
                                                <button
                                                    onClick={() => openAllocationModal(creator)}
                                                    className={`flex-[2] py-3 font-black rounded-xl transition-all text-xs active:scale-95 shadow-sm ${status === 'in_campaign' ? 'bg-spark-red/10 text-spark-red border border-spark-red/20 hover:bg-spark-red hover:text-white' : 'bg-spark-red text-white hover:bg-red-700'}`}
                                                >
                                                    {status === 'in_campaign' ? 'Re-allocate' : 'Hire'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'events':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-color)]">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)]">Events</h2>
                                <p className="text-[var(--text-secondary)] mt-1">Sponsor upcoming events, list and manage your own brand-hosted events.</p>
                            </div>
                            
                            {/* Sub-tabs */}
                            <div className="flex bg-spark-red/5 border border-spark-red/10 p-1 rounded-2xl">
                                <button 
                                    onClick={() => setEventTab('explore')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${eventTab === 'explore' ? 'bg-spark-red text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                                >
                                    Explore Events
                                </button>
                                <button 
                                    onClick={() => setEventTab('my')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${eventTab === 'my' ? 'bg-spark-red text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                                >
                                    My Hosted Events
                                </button>
                            </div>
                        </div>

                        {eventTab === 'explore' ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {loading ? (
                                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                                ) : events.length === 0 ? (
                                    <DashboardPlaceholder title="No Events" icon={<Calendar className="w-9 h-9" />} description="There are no upcoming campus events at the moment." />
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {events.map(event => {
                                            const attendance = event.attendance || "2,500+ Students";
                                            const slots = event.slots || "3 slots available";
                                            const activation = event.activationNeeds || "Logo banners, flyer distribution, social media push";
                                            const sponsorFit = event.sponsorFit || "96% High Match";
                                            return (
                                                <div key={event.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group relative">
                                                    <div className="h-3 bg-spark-red"></div>
                                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-spark-red tracking-wider inline-block">
                                                                    {event.date}
                                                                </div>
                                                                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-spark-purple tracking-wider inline-block max-w-[150px] truncate">
                                                                    {event.location || 'Campus'}
                                                                </div>
                                                                <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                                                                    {sponsorFit}
                                                                </span>
                                                            </div>
                                                            
                                                            <h3 className="text-xl font-black mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">
                                                                {event.name}
                                                            </h3>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">
                                                                Hosted by: <span className="text-spark-red">{event.hostName}</span>
                                                            </p>
                                                            
                                                            <p className="text-[var(--text-secondary)] text-xs mb-6 line-clamp-3 leading-relaxed font-medium">
                                                                {event.description}
                                                            </p>

                                                            {/* Custom Detail Items */}
                                                            <div className="space-y-2 mb-6 border-t border-b border-[var(--border-color)] py-4 text-xs font-semibold text-[var(--text-secondary)]">
                                                                <div className="flex justify-between">
                                                                    <span>👥 Attendance:</span>
                                                                    <span className="font-bold text-[var(--text-primary)]">{attendance}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>🎟️ Slots:</span>
                                                                    <span className="font-bold text-[var(--text-primary)]">{slots}</span>
                                                                </div>
                                                                <div className="space-y-1 mt-2">
                                                                    <p className="text-[10px] font-black uppercase text-spark-red tracking-wider">💡 Activation Needs:</p>
                                                                    <p className="text-xs leading-normal font-medium italic text-[var(--text-secondary)]">{activation}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-auto pt-2 flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">Sponsorship Goal</p>
                                                                <p className="text-base font-black text-[var(--text-primary)]">₦{Number(event.targetSponsorship || 0).toLocaleString()}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedEvent(event)}
                                                                className="px-5 py-2.5 bg-spark-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-spark-red hover:shadow-lg transition-all active:scale-95"
                                                            >
                                                                Sponsor Detail
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-black">My Hosted Events</h3>
                                    <button
                                        onClick={() => setShowCreateEventModal(true)}
                                        className="bg-spark-red text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 text-xs uppercase tracking-wider"
                                    >
                                        + List New Event
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                                ) : myEvents.length === 0 ? (
                                    <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] border-dashed animate-in fade-in duration-500">
                                        <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                                            <Calendar className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No hosted events listed.</h3>
                                        <p className="text-[var(--text-secondary)] font-medium">Create your first brand-hosted event to invite campus volunteers.</p>
                                        <button
                                            onClick={() => setShowCreateEventModal(true)}
                                            className="mt-8 px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
                                        >
                                            Get Started
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {myEvents.map(event => (
                                            <div key={event.id} className="bg-[var(--bg-primary)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm group hover:shadow-xl transition-all">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <h4 className="text-2xl font-black mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{event.name}</h4>
                                                        <div className="flex gap-3 text-sm font-bold uppercase tracking-widest mt-2">
                                                            <span className="text-spark-red">{event.date}</span>
                                                            <span className="text-spark-purple line-clamp-1">{event.location || 'TBA'}</span>
                                                        </div>
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
                                                <div className="flex gap-4">
                                                    <button
                                                        onClick={() => handleEditEvent(event)}
                                                        className="flex-1 py-4 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Edit className="w-4 h-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="flex-1 py-4 bg-red-50 text-red-600 font-black rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'wallet':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Brand Wallet</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Manage campaign budgets, sponsorship payments, transaction records, invoices, and pending payment activities from one secure place.</p>
                        </div>
                        {walletLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid md:grid-cols-3 gap-8">
                                    {[
                                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        { label: 'Total Spent', value: `₦${transactions.reduce((acc, t) => acc + (t.type === 'debit' && t.status === 'completed' ? (Number(t.amount) || 0) : 0), 0).toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' },
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
                                                                
                                                                // Notify user + admin of top-up
                                                                const email = brandProfile.email || user?.email;
                                                                const name = brandProfile.name || user?.name || 'Brand User';
                                                                if (email) notifyTopUp(email, name, amount, response.reference);

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
                                                <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-2xl flex-wrap sm:flex-nowrap gap-4">
                                                    <div className="flex items-center space-x-4">
                                                        <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${trans.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {trans.type === 'credit' ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[var(--text-primary)]">{trans.description}</p>
                                                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                                                                {(() => {
                                                                    if (!trans.createdAt) return 'Just now';
                                                                    const date = trans.createdAt.seconds ? new Date(trans.createdAt.seconds * 1000) : new Date(trans.createdAt);
                                                                    return date.toLocaleDateString();
                                                                })()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <p className={`font-black ${trans.type === 'credit' ? 'text-green-600' : 'text-spark-red'}`}>
                                                            {trans.type === 'credit' ? '+' : '-'} ₦{Number(trans.amount).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] mb-1">{trans.status}</p>
                                                        {trans.status === 'completed' && (
                                                            <button 
                                                                onClick={() => {
                                                                    alert(`Downloading Invoice for transaction ${trans.id || trans.reference || 'INV-001'}...\nDescription: ${trans.description}\nAmount: ₦${Number(trans.amount).toLocaleString()}`);
                                                                    const invoiceText = `INVOICE\n====================\nInvoice Reference: ${trans.id || trans.reference || 'INV-' + Date.now()}\nDescription: ${trans.description}\nAmount: NGN ${Number(trans.amount).toLocaleString()}\nStatus: ${trans.status.toUpperCase()}\nDate: ${new Date().toLocaleDateString()}\nThank you for partnering with ABC-Rally!`;
                                                                    const blob = new Blob([invoiceText], { type: 'text/plain;charset=utf-8' });
                                                                    const url = URL.createObjectURL(blob);
                                                                    const link = document.createElement("a");
                                                                    link.href = url;
                                                                    link.download = `invoice_${trans.id || trans.reference || 'download'}.txt`;
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}
                                                                className="text-[10px] font-black text-spark-red uppercase tracking-wider hover:underline"
                                                            >
                                                                📄 Download Invoice
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Fees & Refund Policy Info */}
                                <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10 mt-8 grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-lg font-black text-[var(--text-primary)] mb-3">Escrow & Refund Policy</h4>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                            All campaign payments are held securely in a multi-sig escrow wallet. If a creator fails to submit their deliverables before the deadline, or if their work fails to meet the campaign brief, the locked budget is refunded directly back to your available balance. Contact our admin support for dispute resolutions.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-[var(--text-primary)] mb-3">Service Fees & Billing</h4>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                                            Listing a campaign on ABC-Rally is free of charge. Creator payouts are subject to a flat 10% platform fee, which is deducted automatically upon releasing escrow funds. Standard Paystack gateway fees of 1.5% + ₦100 apply to wallet top-ups.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'proposals':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Partnership Proposals</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Track collaboration pitches, custom offers, sponsorship requests, and negotiations with creators and associations.</p>
                        </div>
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
                                    const isDirectOffer = p.status === 'pending' && !isSender;
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
                                                {isDirectOffer ? (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-color)] shadow-sm"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(p.id, 'accepted')}
                                                            className="px-6 py-3 bg-spark-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                                            className="px-6 py-3 bg-spark-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all border border-transparent shadow-sm"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-gray-200"
                                                        >
                                                            View Proposal
                                                        </button>
                                                        {p.status !== 'pending' && (
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'accepted' || p.status === 'paid' ? 'bg-green-50 text-green-600' :
                                                                p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                                    'bg-blue-50 text-blue-600'
                                                                }`}>
                                                                {p.status}
                                                            </span>
                                                        )}
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
                    'revision': 'bg-red-50 text-spark-red',
                    'approved': 'bg-teal-50 text-teal-600',
                    'paid': 'bg-green-50 text-green-600',
                    'rejected': 'bg-red-50 text-red-500',
                };

                // â”€â”€ Campaign Detail View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                                    { label: 'Remaining', value: detailStats.isLegacy ? 'Balance-based' : `₦${detailStats.remaining.toLocaleString()}`, color: 'text-green-600' },
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

                            {/* Creator Table */}
                            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
                                    <h4 className="font-black text-[var(--text-primary)]">Allocated Creators</h4>
                                    <button onClick={() => { setCurrentView('directory'); setActiveCampaignContext(selectedCampaignDetail); }} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-spark-red text-white rounded-xl hover:bg-red-700 transition-all">+ Add Creator</button>
                                </div>
                                {detailLoading ? (
                                    <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-spark-red"/></div>
                                ) : detailAllocations.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]">
                                            <Users className="w-8 h-8" />
                                        </div>
                                        <p className="font-black text-[var(--text-primary)] mb-1">No creators allocated yet</p>
                                        <p className="text-sm text-[var(--text-secondary)]">Go to the Talent Directory and click "Add to Campaign".</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-[var(--border-color)]">
                                                    {['Creator', 'University', 'Allocation', 'Status', 'Actions'].map(h => (
                                                        <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailAllocations.map((alloc) => (
                                                    <tr key={alloc.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-spark-red text-white flex items-center justify-center font-black text-sm flex-shrink-0">{(alloc.creatorName || '?').charAt(0)}</div>
                                                                <span className="font-black text-[var(--text-primary)]">{alloc.creatorName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-[var(--text-secondary)] text-xs">{alloc.creatorUniversity || '—'}</td>
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
                                                                                <button 
                                                                                    disabled={releaseSubmitting === alloc.id}
                                                                                    onClick={() => handleReleasePayment(alloc)} 
                                                                                    className="px-3 py-1.5 bg-spark-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-gray-800 transition-colors flex items-center gap-1"
                                                                                >
                                                                                    {releaseSubmitting === alloc.id ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : null}
                                                                                    Accept Report
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleRejectReport(alloc)} 
                                                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors"
                                                                                >
                                                                                    Reject Report
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {alloc.status === 'approved' && (
                                                                            <button 
                                                                                disabled={releaseSubmitting === alloc.id} 
                                                                                onClick={() => handleReleasePayment(alloc)} 
                                                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-green-700 transition-colors flex items-center gap-1"
                                                                            >
                                                                                {releaseSubmitting === alloc.id ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : null}
                                                                                Release Pay
                                                                            </button>
                                                                        )}
                                                                        {(alloc.status === 'selected' || alloc.status === 'in_progress' || alloc.status === 'revision') && (
                                                                            <div className="flex flex-col gap-2">
                                                                                {alloc.status === 'selected' && (
                                                                                    alloc.escrowPaymentUrl ? (
                                                                                        <a
                                                                                            href={alloc.escrowPaymentUrl}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 transition-colors flex items-center gap-1 text-center"
                                                                                        >
                                                                                            <Lock className="w-3 h-3" /> Fund Escrow
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-[10px] font-black uppercase">
                                                                                            Pending Escrow Setup
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                                {(alloc.status === 'in_progress' || alloc.status === 'revision') && (
                                                                                    <span className="px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-[10px] font-black uppercase border border-[var(--border-color)]">
                                                                                        {alloc.status === 'revision' ? 'Revision Requested' : 'Work Pending'}
                                                                                    </span>
                                                                                )}
                                                                                <span className="text-[10px] text-[var(--text-secondary)] italic">Contact Admin for Refunds</span>
                                                                            </div>
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

                // â”€â”€ Campaign List View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">My Campaigns</h3>
                                <p className="text-[var(--text-secondary)] mt-1">Create, manage, and track your brand campaigns, creator gigs, and influencer marketing projects. <span className="text-amber-500 font-bold">₦20,000 listing fee per campaign.</span></p>
                            </div>
                            <button onClick={() => setShowCampaignModal(true)} className="bg-spark-red text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                                + New Campaign
                            </button>
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[var(--text-secondary)]">
                                    <Megaphone className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Campaigns Yet</h3>
                                <p className="text-[var(--text-secondary)] mb-8">Launch your first influencer campaign to connect with creators at scale.</p>
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
                                                    <span className="text-[var(--text-secondary)]">Remaining <span className="text-green-600">{bStats.isLegacy ? 'Balance-based' : `₦${bStats.remaining.toLocaleString()}`}</span></span>
                                                </div>
                                                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                    <div className="h-full bg-spark-red rounded-full transition-all" style={{ width: `${bPct}%` }}></div>
                                                </div>
                                                <p className="text-[10px] text-[var(--text-secondary)] font-bold">Total Budget: ₦{bStats.budget.toLocaleString()} · Deadline: {c.deadline}</p>
                                            </div>

                                            <div className="flex gap-3">
                                                <button onClick={() => openCampaignDetail(c)} className="flex-1 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm">View Details</button>
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
                                                <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]">
                                                    <Inbox className="w-8 h-8" />
                                                </div>
                                                <p className="font-black text-[var(--text-primary)] text-lg">No applications yet</p>
                                                <p className="text-[var(--text-secondary)] text-sm">Creators who apply will appear here with their pitch.</p>
                                            </div>
                                        ) : applicants.map((app: any) => {
                                            const statusColors: any = { pending: 'bg-yellow-50 text-yellow-700', accepted: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-500' };
                                            return (
                                                <div key={app.id} className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-spark-red text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                                                            {app.creatorName?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleViewInfluencer(app.creatorId, { name: app.creatorName, email: app.creatorEmail, university: app.creatorUniversity, bio: app.creatorBio, imageUrl: app.creatorImageUrl })}>
                                                            <h4 className="font-black text-[var(--text-primary)] hover:text-spark-red transition-colors">{app.creatorName}</h4>
                                                            <p className="text-xs text-[var(--text-secondary)]">{app.university || app.creatorUniversity || app.creatorEmail}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[app.status] || 'bg-[var(--bg-tertiary)] text-gray-500'}`}>{app.status}</span>
                                                            <button onClick={() => handleViewInfluencer(app.creatorId, { name: app.creatorName, email: app.creatorEmail, university: app.creatorUniversity, bio: app.creatorBio, imageUrl: app.creatorImageUrl })} className="text-[10px] font-black text-spark-red uppercase hover:underline">View Portfolio</button>
                                                        </div>
                                                    </div>
                                                    <div className="bg-[var(--bg-primary)] rounded-xl p-4 mb-4 border border-[var(--border-color)]">
                                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider mb-2">Their Pitch</p>
                                                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{app.pitch}</p>
                                                    </div>
                                                    {app.report && (
                                                        <div className="bg-[var(--bg-primary)] rounded-xl p-5 mb-4 border-2 border-green-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <p className="text-[10px] font-black text-green-700 uppercase tracking-wider">Campaign Report</p>
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
                                                            <button onClick={() => handleApplicationDecision(app.id, 'accepted')} className="flex-1 py-3 bg-spark-black text-white font-black rounded-xl hover:bg-gray-800 transition-all text-sm">Accept</button>
                                                            <button onClick={() => handleApplicationDecision(app.id, 'rejected')} className="flex-1 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-sm">Reject</button>
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
                                        <div className="mb-6 p-4 bg-spark-red/5 border border-spark-red/20 rounded-2xl flex items-start gap-3 text-spark-red">
                                            <div className="mt-0.5">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black">₦20,000 Campaign Listing Fee</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">A flat ₦20,000 listing fee is charged when you launch a campaign, plus the campaign budget is locked in escrow and paid to creators on approval.</p>
                                            </div>
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
                                                    // Pay ₦20,000 listing fee via Paystack, then create the gig
                                                    const amount = Number(campaignForm.budget);
                                                    const LISTING_FEE = 20000;
                                                    const resolvedBrandId = user?.uid || brandProfile.id;
                                                    const resolvedBrandEmail = user?.email || brandProfile.email;

                                                    if (!window.confirm(`Launch campaign "${campaignForm.title}"?\n\nYou will be charged a ₦20,000 listing fee via Paystack now.\n\nWhen you later hire a creator, you will pay their budget directly into escrow.`)) {
                                                        setCampaignSubmitting(false);
                                                        return;
                                                    }

                                                    const PaystackPop = (window as any).PaystackPop;
                                                    if (!PaystackPop) {
                                                        alert('Paystack is not loaded. Please refresh the page and try again.');
                                                        setCampaignSubmitting(false);
                                                        return;
                                                    }

                                                    const listingRef = `LISTING-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
                                                    const handler = PaystackPop.setup({
                                                        key: 'pk_test_5ee439620d8a49acc254131ede19b9063d8fe95f',
                                                        email: resolvedBrandEmail || 'brand@campushub.africa',
                                                        amount: LISTING_FEE * 100, // ₦20,000 in kobo
                                                        currency: 'NGN',
                                                        ref: listingRef,
                                                        metadata: { userId: resolvedBrandId, type: 'listing_fee', campaignTitle: campaignForm.title },
                                                        callback: function(response: any) {
                                                            (async () => {
                                                                try {
                                                                    const payload = {
                                                                        title: campaignForm.title,
                                                                        description: campaignForm.brief,
                                                                        brief: campaignForm.brief,
                                                                        reward: amount,
                                                                        budget: amount,
                                                                        brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                                                                        status: 'open',
                                                                        brandId: resolvedBrandId,
                                                                        brandEmail: resolvedBrandEmail,
                                                                        category: campaignForm.category,
                                                                        deadline: campaignForm.deadline,
                                                                        listingFeeRef: response.reference,
                                                                        createdAt: new Date().toISOString()
                                                                    };
                                                                    // Create the gig after successful payment
                                                                    const gigRes = await apiClient.post('gigs', payload);
                                                                    const newCampaign = { id: gigRes.data.id, ...payload };
                                                                    setCampaigns(prev => [newCampaign, ...prev]);
                                                                    setShowCampaignModal(false);
                                                                    setEditingGig(null);
                                                                    setCampaignForm({ title: '', brief: '', budget: '', deadline: '', category: 'Awareness' });
                                                                    alert(`✅ Campaign "${campaignForm.title}" launched! Creators can now apply. When you hire a creator, pay their budget directly into escrow.`);
                                                                    setTimeout(() => fetchCampaigns(), 1500);
                                                                } catch (err: any) {
                                                                    alert('Listing fee paid but campaign creation failed: ' + (err.response?.data?.error || err.message));
                                                                } finally {
                                                                    setCampaignSubmitting(false);
                                                                }
                                                            })();
                                                        },
                                                        onClose: () => {
                                                            setCampaignSubmitting(false);
                                                            console.log('[Paystack Listing Fee] closed');
                                                        }
                                                    });
                                                    handler.openIframe();
                                                    return; // Return early — campaign creation continues in Paystack callback
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
                                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <Activity className="w-5 h-5" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">₦20,000 listing fee + campaign budget will be deducted from your wallet on launch.</p>
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
            case 'analytics':
                const totalSpend = transactions.reduce((acc, t) => acc + (t.type === 'debit' && t.status === 'completed' ? (Number(t.amount) || 0) : 0), 0);
                const analyticsActiveCampaigns = campaigns.filter(c => c.status === 'open' || c.status === 'in_progress').length;
                const averageMilestone = analyticsActiveCampaigns > 0 ? (totalSpend / analyticsActiveCampaigns) : 0;
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Campaign Performance Analytics</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Real-time insights on your campaign spending, reaches, and influencer performance.</p>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Estimated Reach</p>
                                <h4 className="text-3xl font-black text-[var(--text-primary)]">148,500</h4>
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-2">↑ 12.3% this month</span>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Completed Milestones</p>
                                <h4 className="text-3xl font-black text-[var(--text-primary)]">38</h4>
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded-full inline-block mt-2">100% Submission rate</span>
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Aggregate Budget Spend</p>
                                <h4 className="text-3xl font-black text-spark-red">₦{totalSpend.toLocaleString()}</h4>
                                <span className="text-[10px] font-black text-spark-red uppercase tracking-widest bg-spark-red/5 px-2 py-0.5 rounded-full inline-block mt-2">Avg ₦{averageMilestone.toLocaleString(undefined, {maximumFractionDigits:0})} / campaign</span>
                            </div>
                        </div>

                        {/* Interactive Graph (Pure SVG & CSS Bar Chart) */}
                        <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-sm">
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Reach Estimations By Campaign</h3>
                            <div className="space-y-4">
                                {[
                                    { title: "Back to School Activation", reach: 65000, color: "bg-spark-red", percent: "90%" },
                                    { title: "ABC-Rally Hackathon Sponsorship", reach: 45000, color: "bg-spark-purple", percent: "65%" },
                                    { title: "Pepsi Cola Product sampling", reach: 38500, color: "bg-blue-600", percent: "55%" }
                                ].map((item, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between text-xs font-black">
                                            <span className="text-[var(--text-primary)]">{item.title}</span>
                                            <span className="text-[var(--text-secondary)]">{item.reach.toLocaleString()} reach</span>
                                        </div>
                                        <div className="h-4 bg-[var(--bg-secondary)] rounded-full overflow-hidden flex">
                                            <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: item.percent }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Table */}
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Talent Performance Standings</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-[var(--border-color)] text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                                            <th className="pb-3">Creator Name</th>
                                            <th className="pb-3">Campaign Assigned</th>
                                            <th className="pb-3">Engagement Rate</th>
                                            <th className="pb-3">Deliverables Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="font-semibold text-[var(--text-secondary)]">
                                        {allAllocations.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center italic text-xs">No active creators to generate performance analytics.</td>
                                            </tr>
                                        ) : (
                                            allAllocations.map((alloc, idx) => (
                                                <tr key={idx} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                                    <td className="py-4 font-black text-[var(--text-primary)]">{alloc.creatorName}</td>
                                                    <td className="py-4">{alloc.campaignTitle}</td>
                                                    <td className="py-4 text-green-600 font-bold">{(8.4 + (idx % 3) * 0.5).toFixed(1)}% Engagement</td>
                                                    <td className="py-4">
                                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100">{alloc.status}</span>
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
            case 'profile':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Profile Settings</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Update your brand information, company details, and public brand profile.</p>
                        </div>
                        <ProfileView user={brandProfile} onUpdate={fetchBrandData} />
                    </div>
                );
            default:
                return <div>Feature coming soon</div>;
        }
    };

    return (
        <DashboardShell
            role={'Brand'}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={brandProfile?.name || "Brand Partner"}
            userSub={brandProfile?.industry || "Market Leader"}
            userId={user?.id || user?.uid}
            userImage={brandProfile?.imageUrl}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
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
            {renderContent()}
            <CreatorProfileModal
                isOpen={!!selectedCreator}
                onClose={() => setSelectedCreator(null)}
                creator={selectedCreator || {}}
                actionButton={
                    <button
                        onClick={() => handleOpenProposalModal(selectedCreator)}
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
                }
            />

            {showProposalModal && proposalRecipient && (
                <ProposalFormModal
                    isOpen={showProposalModal}
                    onClose={() => { setShowProposalModal(false); setEventBeingSponsored(null); setSelectedSponsorshipPackage(null); }}
                    recipientName={proposalRecipient.name}
                    recipientId={proposalRecipient.id}
                    initialMessage={proposalInitialMessage}
                    onSubmit={handleSendProposal}
                    isSponsorship={!!eventBeingSponsored}
                    selectedPackage={selectedSponsorshipPackage}
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
                                        onClick={handleAllocateCreator}
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

            {/* Approval Modal (for Applications) */}
            {showApprovalModal && selectedAppToApprove && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[301] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-primary)]">Approve Influencer</h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Creator: {selectedAppToApprove.creatorName || 'Selected Talent'}</p>
                            </div>
                            <button onClick={() => { setShowApprovalModal(false); setSelectedAppToApprove(null); }} className="w-8 h-8 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Allocation Amount (₦)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    placeholder="e.g. 15000"
                                    value={approvalAmount} 
                                    onChange={e => setApprovalAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold text-lg outline-none focus:border-spark-red"
                                />
                                {viewingApplicants && (() => {
                                    const stats = getCampaignBudgetStats(viewingApplicants);
                                    return (
                                        <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-2">
                                            Remaining Campaign Budget: <span className="text-green-600">₦{stats.remaining.toLocaleString()}</span>
                                        </p>
                                    );
                                })()}
                            </div>
                            
                            <div className="p-4 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                                <p className="text-[10px] text-spark-red font-bold leading-relaxed">
                                    By approving, ₦{Number(approvalAmount || 0).toLocaleString()} will be moved from your campaign budget and locked for this creator. You can release it once they submit their report.
                                </p>
                            </div>

                            <button 
                                onClick={confirmApproval}
                                disabled={approvalSubmitting || !approvalAmount}
                                className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                            >
                                {approvalSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Approve & Allocate'}
                            </button>
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
                                {viewingReport.creatorName?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-black text-[var(--text-primary)]">{viewingReport.creatorName}</h4>
                                <p className="text-[10px] font-black text-spark-red uppercase tracking-widest">{viewingReport.creatorUniversity || 'Creator'}</p>
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
                            {viewingReport.submission?.metricsUrl && (
                                <div>
                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Reach Metrics</label>
                                    <a 
                                        href={viewingReport.submission.metricsUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-2 p-4 bg-green-600/5 text-green-600 border border-green-600/10 rounded-xl font-black text-sm hover:bg-green-600/10 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                        Download Metrics Screenshot
                                    </a>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setViewingReport(null)} className="w-full mt-10 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all">Close Viewer</button>
                    </div>
                </div>
            )}

            {/* Influencer Profile Modal */}
            {viewingProfile && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-spark-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setViewingProfile(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col border border-[var(--border-color)]">
                        {/* Header/Cover */}
                        <div 
                            className="h-40 bg-spark-black relative flex-shrink-0 bg-cover bg-center bg-no-repeat"
                            style={{ backgroundImage: viewingProfile.coverPhotoUrl ? `url(${viewingProfile.coverPhotoUrl})` : undefined }}
                        >
                            {viewingProfile.coverPhotoUrl && <div className="absolute inset-0 bg-spark-black/35 backdrop-blur-[1px] z-0"></div>}
                            <button onClick={() => setViewingProfile(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all z-10">
                                <Plus className="w-6 h-6 rotate-45" />
                             </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {viewingProfile.loading ? (
                                <div className="flex flex-col items-center justify-center py-40">
                                    <div className="w-12 h-12 border-4 border-spark-red border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-xs">Loading profile details...</p>
                                </div>
                            ) : (
                                <div className="px-10 pb-10">
                                    {/* Profile Info */}
                                    <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="flex items-end gap-6">
                                            <div className="w-32 h-32 rounded-3xl bg-[var(--bg-primary)] p-2 shadow-2xl ring-4 ring-[var(--bg-primary)] overflow-hidden relative z-10">
                                                {viewingProfile.imageUrl ? (
                                                    <img src={viewingProfile.imageUrl} className="w-full h-full object-cover rounded-2xl" alt={viewingProfile.name} />
                                                ) : (
                                                    <div className="w-full h-full bg-spark-red/10 flex items-center justify-center text-4xl font-black text-spark-red">
                                                        {(viewingProfile.name || '?').charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pb-2 relative z-10">
                                                <h3 className={`text-3xl font-black ${viewingProfile.coverPhotoUrl ? 'text-white' : 'text-[var(--text-primary)]'}`}>{viewingProfile.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${viewingProfile.coverPhotoUrl ? 'bg-black/30 text-white/90' : 'bg-spark-red/10 text-spark-red'}`}>
                                                        {viewingProfile.influencerType || viewingProfile.role || 'Creator'}
                                                    </span>
                                                    {viewingProfile.influencerType !== 'Professional Creator' && viewingProfile.university && (
                                                        <span className={`font-bold text-xs ${viewingProfile.coverPhotoUrl ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                                                            🏫 {viewingProfile.university}
                                                        </span>
                                                    )}
                                                    {viewingProfile.location && (
                                                        <span className={`font-bold text-xs ${viewingProfile.coverPhotoUrl ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                                                            📍 {viewingProfile.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pb-2 relative z-10">
                                            {viewingProfile.instagram && (
                                                <a href={sanitizeSocialLink(viewingProfile.instagram, 'instagram')} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5 hover:bg-spark-red/10 hover:text-spark-red font-bold text-xs transition-all text-[var(--text-primary)]">
                                                    Instagram
                                                </a>
                                            )}
                                            {viewingProfile.tiktok && (
                                                <a href={sanitizeSocialLink(viewingProfile.tiktok, 'tiktok')} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5 hover:bg-spark-red/10 hover:text-spark-red font-bold text-xs transition-all text-[var(--text-primary)]">
                                                    TikTok
                                                </a>
                                            )}
                                            {viewingProfile.twitter && (
                                                <a href={sanitizeSocialLink(viewingProfile.twitter, 'twitter')} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5 hover:bg-spark-red/10 hover:text-spark-red font-bold text-xs transition-all text-[var(--text-primary)]">
                                                    X / Twitter
                                                </a>
                                            )}
                                            {viewingProfile.linkedin && (
                                                <a href={sanitizeSocialLink(viewingProfile.linkedin, 'linkedin')} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5 hover:bg-spark-red/10 hover:text-spark-red font-bold text-xs transition-all text-[var(--text-primary)]">
                                                    LinkedIn
                                                </a>
                                            )}
                                            {viewingProfile.website && (
                                                <a href={sanitizeSocialLink(viewingProfile.website, 'website')} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-1.5 hover:bg-spark-red/10 hover:text-spark-red font-bold text-xs transition-all text-[var(--text-primary)]">
                                                    Website
                                                </a>
                                            )}
                                            <button onClick={() => { setViewingProfile(null); openAllocationModal(viewingProfile); }} className="px-6 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg text-xs uppercase tracking-widest ml-auto">
                                                Hire Influencer
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tabs for Portfolio / Bio */}
                                    <div className="grid md:grid-cols-3 gap-8">
                                        <div className="md:col-span-1 space-y-6">
                                            <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-color)]">
                                                <h4 className="font-black text-[var(--text-primary)] mb-4 uppercase text-[10px] tracking-widest text-spark-red">About Influencer</h4>
                                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                                                    {viewingProfile.bio || "No bio provided by the influencer yet."}
                                                </p>
                                            </div>
                                            <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 border border-[var(--border-color)]">
                                                <h4 className="font-black text-[var(--text-primary)] mb-4 uppercase text-[10px] tracking-widest text-spark-red">Quick Stats</h4>
                                                <div className="space-y-3">
                                                    {viewingProfile.influencerType !== 'Professional Creator' && viewingProfile.university && (
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-[var(--text-secondary)] font-bold">University</span>
                                                            <span className="text-[var(--text-primary)] font-black">{viewingProfile.university}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-[var(--text-secondary)] font-bold">Joined</span>
                                                        <span className="text-[var(--text-primary)] font-black">{viewingProfile.createdAt ? new Date(viewingProfile.createdAt).getFullYear() : '2024'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-6">
                                            <h4 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                                <Briefcase className="w-6 h-6 text-spark-red" />
                                                Professional Portfolio
                                            </h4>
                                            
                                            {!viewingProfile.portfolio || viewingProfile.portfolio.length === 0 ? (
                                                <div className="bg-[var(--bg-secondary)] rounded-[2.5rem] border-2 border-dashed border-[var(--border-color)] p-12 text-center">
                                                    <p className="text-[var(--text-secondary)] font-bold">This influencer hasn't uploaded any previous work yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid sm:grid-cols-2 gap-4">
                                                    {viewingProfile.portfolio.map((item: any) => (
                                                        <div 
                                                            key={item.id} 
                                                            onClick={() => setSelectedPortfolioItem(item)}
                                                            className="bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] overflow-hidden hover:border-spark-red transition-all flex flex-col group cursor-pointer"
                                                        >
                                                            <div className="h-32 bg-spark-black/5 relative">
                                                                {item.fileType === 'image' ? (
                                                                    <img src={item.fileUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <FileText className="w-10 h-10 text-spark-red/20" />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-spark-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                                    <span className="px-4 py-2 bg-white text-spark-black rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                        View Details
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="p-5">
                                                                <h5 className="font-black text-[var(--text-primary)] text-sm line-clamp-1 group-hover:text-spark-red transition-colors">{item.title}</h5>
                                                                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-1 font-medium">{item.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Portfolio Item Detail Modal */}
            {selectedPortfolioItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-spark-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedPortfolioItem(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-[var(--border-color)]">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--text-primary)]">{selectedPortfolioItem.title}</h2>
                                    <span className="text-[10px] font-black text-spark-red uppercase tracking-widest mt-1 block">Work Done: {new Date(selectedPortfolioItem.createdAt).toLocaleDateString()}</span>
                                </div>
                                <button onClick={() => setSelectedPortfolioItem(null)} className="w-10 h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all">
                                    <Plus className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {selectedPortfolioItem.fileType === 'image' && (
                                    <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
                                        <img src={selectedPortfolioItem.fileUrl} className="w-full h-auto max-h-80 object-cover" alt={selectedPortfolioItem.title} />
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Project Description</h4>
                                    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)]">
                                        <p className="text-[var(--text-primary)] font-medium leading-relaxed whitespace-pre-wrap">
                                            {selectedPortfolioItem.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <a 
                                        href={selectedPortfolioItem.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex-1 py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Work Files
                                    </a>
                                    <button 
                                        onClick={() => setSelectedPortfolioItem(null)}
                                        className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProposalDetailsModal
                isOpen={!!selectedProposal}
                onClose={() => setSelectedProposal(null)}
                proposal={selectedProposal}
                onUpdateStatus={handleUpdateStatus}
                isSender={selectedProposal?.senderId === (brandProfile?.id || auth.currentUser?.uid)}
            />

            {/* Create Event Modal */}
            {showCreateEventModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="fixed inset-0 bg-spark-black/40 backdrop-blur-md" onClick={() => !eventSubmitting && setShowCreateEventModal(false)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto border border-[var(--border-color)]">
                        <div className="p-10 border-b border-[var(--border-color)] flex justify-between items-center">
                            <h3 className="text-3xl font-black text-[var(--text-primary)]">List New Event</h3>
                            <button onClick={() => setShowCreateEventModal(false)} className="text-[var(--text-secondary)] hover:text-spark-red transition-colors">
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
                                    value={eventFormData.name}
                                    onChange={(e) => {
                                        const newName = e.target.value;
                                        setEventFormData(prev => ({
                                            ...prev,
                                            name: newName,
                                            campaignTitle: prev.campaignTitle === (prev.name ? `${prev.name} - Volunteers` : '') 
                                                ? (newName ? `${newName} - Volunteers` : '')
                                                : prev.campaignTitle
                                        }));
                                    }}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        value={eventFormData.date}
                                        onChange={(e) => {
                                            const newDate = e.target.value;
                                            setEventFormData(prev => ({
                                                ...prev,
                                                date: newDate,
                                                campaignDeadline: prev.campaignDeadline === prev.date ? newDate : prev.campaignDeadline
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Target (₦)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        placeholder="e.g. 500000"
                                        value={eventFormData.targetSponsorship}
                                        onChange={(e) => setEventFormData({ ...eventFormData, targetSponsorship: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Expected Attendees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        placeholder="e.g. 500"
                                        value={eventFormData.expectedAttendees}
                                        onChange={(e) => setEventFormData({ ...eventFormData, expectedAttendees: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Slots</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                        placeholder="e.g. 3"
                                        value={eventFormData.sponsorshipSlots}
                                        onChange={(e) => setEventFormData({ ...eventFormData, sponsorshipSlots: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Location</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                    placeholder="e.g. Main Auditorium"
                                    value={eventFormData.location}
                                    onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold resize-none"
                                    placeholder="Describe your event and what sponsors get in return..."
                                    value={eventFormData.description}
                                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Packages</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormPackages(prev => [...prev, { name: '', price: '', entails: '' }])}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-spark-red/10 text-spark-red rounded-xl font-bold text-xs hover:bg-spark-red/20 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Tier
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formPackages.map((pkg, idx) => (
                                        <div key={idx} className="flex gap-2 items-center border border-[var(--border-color)] p-3 rounded-2xl relative bg-[var(--bg-primary)]">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Tier Name (e.g. Gold)"
                                                    value={pkg.name}
                                                    onChange={(e) => {
                                                        const next = [...formPackages];
                                                        next[idx].name = e.target.value;
                                                        setFormPackages(next);
                                                    }}
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-red/20"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Price (₦)"
                                                    value={pkg.price}
                                                    onChange={(e) => {
                                                        const next = [...formPackages];
                                                        next[idx].price = e.target.value;
                                                        setFormPackages(next);
                                                    }}
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-red/20"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Details (e.g. Logo placement)"
                                                    value={pkg.entails}
                                                    onChange={(e) => {
                                                        const next = [...formPackages];
                                                        next[idx].entails = e.target.value;
                                                        setFormPackages(next);
                                                    }}
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-red/20"
                                                    required
                                                />
                                            </div>
                                            {formPackages.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormPackages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-2 text-spark-red hover:bg-spark-red/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-[var(--text-secondary)] font-medium">Define your sponsorship tiers, prices, and perks.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Activation Needs</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold resize-none"
                                    placeholder="e.g. Branded booth, social media takeover, product sampling, banner placements..."
                                    value={eventFormData.activationNeeds}
                                    onChange={(e) => setEventFormData({ ...eventFormData, activationNeeds: e.target.value })}
                                ></textarea>
                            </div>

                            {/* ── Volunteer Recruitment Section ── */}
                            <div className="rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                <div className="px-6 py-5 bg-[var(--bg-secondary)] flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-[var(--text-primary)] text-base">Need Volunteers for this Event?</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Recruiting volunteers will also create a campaign listing</p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="needVolunteers"
                                                value="no"
                                                checked={eventFormData.needVolunteers === 'no'}
                                                onChange={() => setEventFormData(prev => ({ ...prev, needVolunteers: 'no' }))}
                                                className="accent-spark-red w-4 h-4"
                                            />
                                            <span className="text-sm font-bold text-[var(--text-secondary)]">No</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="needVolunteers"
                                                value="yes"
                                                checked={eventFormData.needVolunteers === 'yes'}
                                                onChange={() => setEventFormData(prev => ({ ...prev, needVolunteers: 'yes' }))}
                                                className="accent-spark-red w-4 h-4"
                                            />
                                            <span className="text-sm font-bold text-spark-red">Yes</span>
                                        </label>
                                    </div>
                                </div>

                                {eventFormData.needVolunteers === 'yes' && (
                                    <div className="p-6 space-y-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
                                        {/* Volunteer Type */}
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Volunteer Type</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <label className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${eventFormData.volunteerType === 'unpaid' ? 'border-spark-red bg-spark-red/5' : 'border-[var(--border-color)] hover:border-spark-red/40'}`}>
                                                    <input
                                                        type="radio"
                                                        name="volunteerType"
                                                        value="unpaid"
                                                        checked={eventFormData.volunteerType === 'unpaid'}
                                                        onChange={() => setEventFormData(prev => ({ ...prev, volunteerType: 'unpaid', campaignBudget: '' }))}
                                                        className="accent-spark-red w-4 h-4"
                                                    />
                                                    <div>
                                                        <p className="font-black text-sm text-[var(--text-primary)]">Unpaid</p>
                                                        <p className="text-xs text-[var(--text-secondary)]">Free volunteer listing</p>
                                                    </div>
                                                </label>
                                                <label className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${eventFormData.volunteerType === 'paid' ? 'border-spark-red bg-spark-red/5' : 'border-[var(--border-color)] hover:border-spark-red/40'}`}>
                                                    <input
                                                        type="radio"
                                                        name="volunteerType"
                                                        value="paid"
                                                        checked={eventFormData.volunteerType === 'paid'}
                                                        onChange={() => setEventFormData(prev => ({ ...prev, volunteerType: 'paid' }))}
                                                        className="accent-spark-red w-4 h-4"
                                                    />
                                                    <div>
                                                        <p className="font-black text-sm text-[var(--text-primary)]">Paid</p>
                                                        <p className="text-xs text-[var(--text-secondary)]">Requires budget in wallet</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Campaign Title */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Campaign Title</label>
                                            <input
                                                type="text"
                                                required={eventFormData.needVolunteers === 'yes'}
                                                className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                                placeholder="e.g. My Event - Volunteers"
                                                value={eventFormData.campaignTitle}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, campaignTitle: e.target.value }))}
                                            />
                                        </div>

                                        {/* Category */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Campaign Category</label>
                                            <select
                                                required={eventFormData.needVolunteers === 'yes'}
                                                className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                                value={eventFormData.campaignCategory}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, campaignCategory: e.target.value }))}
                                            >
                                                <option value="Event Promo">Event Promo</option>
                                                <option value="Awareness">Awareness</option>
                                                <option value="Community Outreach">Community Outreach</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Content Creation">Content Creation</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        {/* Campaign Brief */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Volunteer Brief</label>
                                            <textarea
                                                required={eventFormData.needVolunteers === 'yes'}
                                                rows={3}
                                                className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold resize-none"
                                                placeholder="Describe what volunteers will do at this event..."
                                                value={eventFormData.campaignBrief}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, campaignBrief: e.target.value }))}
                                            />
                                        </div>

                                        {/* Budget (paid only) */}
                                        {eventFormData.volunteerType === 'paid' && (
                                            <div className="space-y-2">
                                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Total Volunteer Budget (₦)</label>
                                                <input
                                                    type="number"
                                                    required={eventFormData.needVolunteers === 'yes' && eventFormData.volunteerType === 'paid'}
                                                    min="1"
                                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                                    placeholder="e.g. 50000"
                                                    value={eventFormData.campaignBudget}
                                                    onChange={(e) => setEventFormData(prev => ({ ...prev, campaignBudget: e.target.value }))}
                                                />
                                                <p className="text-xs text-amber-500 font-bold">Note: The volunteer budget will be locked in escrow from your wallet</p>
                                            </div>
                                        )}

                                        {/* Application Deadline */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Application Deadline</label>
                                            <input
                                                type="date"
                                                required={eventFormData.needVolunteers === 'yes'}
                                                className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-red/10 outline-none font-bold"
                                                value={eventFormData.campaignDeadline}
                                                onChange={(e) => setEventFormData(prev => ({ ...prev, campaignDeadline: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    disabled={eventSubmitting}
                                    onClick={() => setShowCreateEventModal(false)}
                                    className="flex-1 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={eventSubmitting}
                                    className="flex-[2] py-5 bg-spark-red text-white font-black rounded-2xl text-lg hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {eventSubmitting ? (
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

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => setEditingEvent(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 border border-[var(--border-color)]">
                        <div className="p-10 modal-content-scroll">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight">Edit Event</h2>
                                    <p className="text-[var(--text-secondary)] font-medium mt-1">Update your event details below.</p>
                                </div>
                                <button onClick={() => setEditingEvent(null)} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <form onSubmit={handleSaveEditEvent} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Name</label>
                                    <input type="text" required value={editEventFormData.name} onChange={e => setEditEventFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Date</label>
                                    <input type="date" required value={editEventFormData.date} onChange={e => setEditEventFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Location</label>
                                    <input type="text" required value={editEventFormData.location} onChange={e => setEditEventFormData(p => ({ ...p, location: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description</label>
                                    <textarea required rows={3} value={editEventFormData.description} onChange={e => setEditEventFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Target Sponsorship (₦)</label>
                                    <input type="number" required min="0" value={editEventFormData.targetSponsorship} onChange={e => setEditEventFormData(p => ({ ...p, targetSponsorship: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Expected Attendees</label>
                                        <input type="number" min="1" value={editEventFormData.expectedAttendees} onChange={e => setEditEventFormData(p => ({ ...p, expectedAttendees: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Sponsorship Slots</label>
                                        <input type="number" min="1" value={editEventFormData.sponsorshipSlots} onChange={e => setEditEventFormData(p => ({ ...p, sponsorshipSlots: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Sponsorship Packages</label>
                                        <button
                                            type="button"
                                            onClick={() => setEditFormPackages(prev => [...prev, { name: '', price: '', entails: '' }])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-spark-red/10 text-spark-red rounded-xl font-bold text-xs hover:bg-spark-red/20 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Tier
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {editFormPackages.map((pkg, idx) => (
                                            <div key={idx} className="flex gap-2 items-center border border-[var(--border-color)] p-3 rounded-2xl relative bg-[var(--bg-primary)]">
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Tier Name (e.g. Gold)"
                                                        value={pkg.name}
                                                        onChange={(e) => {
                                                            const next = [...editFormPackages];
                                                            next[idx].name = e.target.value;
                                                            setEditFormPackages(next);
                                                        }}
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-xl outline-none font-bold text-[var(--text-primary)]"
                                                        required
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Price (₦)"
                                                        value={pkg.price}
                                                        onChange={(e) => {
                                                            const next = [...editFormPackages];
                                                            next[idx].price = e.target.value;
                                                            setEditFormPackages(next);
                                                        }}
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-xl outline-none font-bold text-[var(--text-primary)]"
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Details (e.g. Logo placement)"
                                                        value={pkg.entails}
                                                        onChange={(e) => {
                                                            const next = [...editFormPackages];
                                                            next[idx].entails = e.target.value;
                                                            setEditFormPackages(next);
                                                        }}
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-xl outline-none font-bold text-[var(--text-primary)]"
                                                        required
                                                    />
                                                </div>
                                                {editFormPackages.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditFormPackages(prev => prev.filter((_, i) => i !== idx))}
                                                        className="p-2 text-spark-red hover:bg-spark-red/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Activation Needs</label>
                                    <textarea rows={2} value={editEventFormData.activationNeeds} onChange={e => setEditEventFormData(p => ({ ...p, activationNeeds: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-red rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" placeholder="e.g. Branded booth, social media push..." />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editEventSubmitting} className="flex-[2] py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-3 disabled:opacity-50">
                                        {editEventSubmitting ? (
                                            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Saving...</>
                                        ) : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Release OTP Modal */}
            {showReleaseOtpModal && releaseOtpAllocation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[310] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-[var(--border-color)]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-primary)]">Confirm Payment Release</h3>
                                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-1">To: {releaseOtpAllocation.creatorName}</p>
                            </div>
                            <button
                                onClick={() => { setShowReleaseOtpModal(false); setReleaseOtp(''); }}
                                className="w-8 h-8 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="p-4 bg-spark-red/5 rounded-2xl border border-spark-red/10">
                                <p className="text-sm text-spark-red font-bold leading-relaxed">
                                    A confirmation OTP has been sent to your registered email address. Check your inbox and enter it below to release ₦{releaseOtpAllocation.amount?.toLocaleString()} to {releaseOtpAllocation.creatorName}.
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Enter OTP</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="e.g. 123456"
                                    value={releaseOtp}
                                    onChange={e => setReleaseOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl font-bold text-lg outline-none focus:border-spark-red tracking-[0.35em] text-center"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={confirmEscrowRelease}
                                disabled={releaseOtpSubmitting || !releaseOtp.trim()}
                                className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                            >
                                {releaseOtpSubmitting
                                    ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Releasing...</>
                                    : 'Confirm & Release Payment'
                                }
                            </button>

                            <button
                                onClick={async () => {
                                    const escrowId = (releaseOtpAllocation as any).escrowId;
                                    try {
                                        const r = await fetch(`${BACKEND_URL}/api/escrow/request-otp`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                escrow_id: escrowId,
                                                brandEmail: brandProfile.email || user?.email,
                                                brandName: brandProfile.name || brandProfile.companyName || 'Brand',
                                                creatorName: releaseOtpAllocation.creatorName,
                                                amount: releaseOtpAllocation.amount,
                                            }),
                                        });
                                        const d = await r.json();
                                        if (!r.ok) throw new Error(d.error || 'Failed to resend OTP.');
                                        alert('OTP resent! Please check your email.');
                                    } catch (e: any) {
                                        alert(e.message || 'Could not resend OTP.');
                                    }
                                }}
                                className="w-full py-2.5 text-sm text-[var(--text-secondary)] font-bold hover:text-spark-red transition-colors"
                            >
                                Didn't receive it? Resend OTP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
};

export default BrandDashboard;
