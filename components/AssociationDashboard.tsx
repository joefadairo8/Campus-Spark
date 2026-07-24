import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, limit, apiClient, updateDoc, orderBy, logEvent } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { CreatorProfileModal } from './CreatorProfileModal';
import { WalletService } from '../WalletService';
import { notifyTopUp, notifyWithdrawal, notifyProposalReceived, notifyProposalStatus } from '../emailNotifier';
import { Wallet, TrendingUp, Lock, Plus, Minus, Ticket, Edit, Trash2, Search, Handshake, Building2, FileText, Mail, BarChart3, Target, Smartphone, Lightbulb, Award, GraduationCap, BookOpen, Calendar, Users, Megaphone, Inbox, Timer, Instagram, Twitter, Scale, Star, Briefcase, MapPin } from 'lucide-react';
import { STATES, CREATOR_SERVICES_BY_CAPABILITY, ALL_CREATOR_SERVICES } from '../constants';
import { EventListingTermsModal } from './EventListingTermsModal';
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

const AssociationDashboard: React.FC<{ 
    onNavigate: (page: string) => void, 
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    themeMode: 'light' | 'dark' | 'auto',
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, themeMode, user }) => {
    const paystackPublicKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';
    const [currentView, setCurrentView] = useState('overview');
    const [preSelectedDisputeEntity, setPreSelectedDisputeEntity] = useState<any>(null);
    const [eventTab, setEventTab] = useState<'explore' | 'my'>('explore');
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletLoading, setWalletLoading] = useState(false);

    // Withdrawal states
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({ bank: '', account: '', name: '' });
    const [withdrawing, setWithdrawing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showListingTermsModal, setShowListingTermsModal] = useState(false);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [orgProfile, setOrgProfile] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [proposalTab, setProposalTab] = useState<'incoming' | 'outgoing'>('incoming');
    const [creatorTypeTab, setCreatorTypeTab] = useState<'all' | 'professional' | 'student'>('all');
    // Section 8 filters
    const [assocSearchTerm, setAssocSearchTerm] = useState('');
    const [assocFilterCapability, setAssocFilterCapability] = useState('All');
    const [assocFilterService, setAssocFilterService] = useState('All');
    const [assocFilterState, setAssocFilterState] = useState('All');
    const [assocFilterCampus, setAssocFilterCampus] = useState('');
    const [assocFilterAvailable, setAssocFilterAvailable] = useState(false);
    const [assocFilterWhatsApp, setAssocFilterWhatsApp] = useState(false);
    const clearAssocFilters = () => {
        setAssocSearchTerm('');
        setAssocFilterCapability('All');
        setAssocFilterService('All');
        setAssocFilterState('All');
        setAssocFilterCampus('');
        setAssocFilterAvailable(false);
        setAssocFilterWhatsApp(false);
        setCreatorTypeTab('all');
    };
    const [brands, setBrands] = useState<any[]>([]);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [proposing, setProposing] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [proposalRecipient, setProposalRecipient] = useState<{ id: string, name: string } | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [creators, setCreators] = useState<any[]>([]);
    const [creatorsLoading, setCreatorsLoading] = useState(false);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [editFormData, setEditFormData] = useState({ 
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
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('10000');
    const [gigs, setGigs] = useState<any[]>([]);
    const [showGigModal, setShowGigModal] = useState(false);
    const [selectedGig, setSelectedGig] = useState<any>(null);
    const [gigAllocations, setGigAllocations] = useState<Record<string, any[]>>({});
    const [gigFormData, setGigFormData] = useState({ title: '', description: '', reward: '0', type: 'volunteer', location: '' });
    const [gigSubmitting, setGigSubmitting] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedCreatorForAssign, setSelectedCreatorForAssign] = useState<any>(null);
    const [assigningGigId, setAssigningGigId] = useState('');
    const [showCreatorProfile, setShowCreatorProfile] = useState<boolean>(false);
    const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<any>(null);

    const handleViewCreator = async (creatorId: string, fallbackData: any) => {
        setSelectedCreatorProfile({ ...fallbackData, id: creatorId, loading: true });
        setShowCreatorProfile(true);
        try {
            const userDoc = await getDoc(doc(db, "users", creatorId));
            if (userDoc.exists()) {
                setSelectedCreatorProfile({ id: creatorId, ...userDoc.data() });
            } else {
                setSelectedCreatorProfile({ id: creatorId, ...fallbackData });
            }
        } catch (error) {
            console.error("Error fetching creator details:", error);
            setSelectedCreatorProfile({ id: creatorId, ...fallbackData });
        }
    };
    // Platform review state
    const [platformRating, setPlatformRating] = useState(5);
    const [platformReviewText, setPlatformReviewText] = useState('');
    const [platformReviewSubmitting, setPlatformReviewSubmitting] = useState(false);
    const [myPlatformReviews, setMyPlatformReviews] = useState<any[]>([]);

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://js.paystack.co/v1/inline.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        location: '',
        description: '',
        targetSponsorship: '',
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

    const [formPackages, setFormPackages] = useState<{ name: string; price: string; entails: string; }[]>([
        { name: 'Bronze', price: '50000', entails: 'Logo placement on flyer' },
        { name: 'Silver', price: '150000', entails: 'Logo placement, social mentions & standard event booth' },
        { name: 'Gold', price: '400000', entails: 'Title sponsor, main stage logo, VIP booths & 5 tickets' }
    ]);
    const [editFormPackages, setEditFormPackages] = useState<{ name: string; price: string; entails: string; }[]>([
        { name: '', price: '', entails: '' }
    ]);

    const fetchWallet = async () => {
        const uid = orgProfile?.id || user?.id || auth.currentUser?.uid;
        if (uid) {
            setWalletLoading(true);
            try {
                const w = await WalletService.getOrCreateWallet(uid);
                setWallet(w);
                const q = query(
                    collection(db, 'transactions'), 
                    where('userId', '==', uid)
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
        }
    };

    const getTransactionNotes = (trans: any) => String(trans.description || '').toLowerCase();
    const isSponsorshipTransaction = (trans: any) => {
        const note = getTransactionNotes(trans);
        return note.includes('sponsorship') || note.includes('sponsorship received') || note.includes('event sponsorship') || note.includes('sponsorship commission');
    };
    const isCampaignGigTransaction = (trans: any) => {
        const note = getTransactionNotes(trans);
        return note.includes('gig') || note.includes('campaign') || note.includes('allocation') || note.includes('payment released') || note.includes('lock');
    };
    const campaignGigSpend = transactions.reduce((sum, t) => t.type === 'debit' && t.status === 'completed' && isCampaignGigTransaction(t) ? sum + Number(t.amount || 0) : sum, 0);
    const sponsorshipIncome = transactions.reduce((sum, t) => t.type === 'credit' && t.status === 'completed' && isSponsorshipTransaction(t) ? sum + Number(t.amount || 0) : sum, 0);
    const sponsorshipSpend = transactions.reduce((sum, t) => t.type === 'debit' && t.status === 'completed' && isSponsorshipTransaction(t) ? sum + Number(t.amount || 0) : sum, 0);

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'profile', label: 'Association Profile', icon: <Users className="w-5 h-5" /> },
        { id: 'events', label: 'Events', icon: <Ticket className="w-5 h-5" /> },
        { id: 'sponsorships', label: 'Sponsorships', icon: <Award className="w-5 h-5" /> },
        { id: 'brands', label: 'Brand Directory', icon: <Building2 className="w-5 h-5" /> },
        { id: 'proposals', label: 'Proposals', icon: <Handshake className="w-5 h-5" /> },
        { id: 'hiring', label: 'Hire Creators', icon: <Search className="w-5 h-5" /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
        { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
        { id: 'ratings_reviews', label: 'Ratings & Reviews', icon: <Star className="w-5 h-5" /> },
        { id: 'disputes', label: 'Disputes & Mediation', icon: <Scale className="w-5 h-5" /> },
    ];

    const fetchOrgData = async () => {
        // Use prop user if available, fallback to auth
        const activeUser = user || auth.currentUser;
        if (activeUser) {
            try {
                const uid = activeUser.uid || activeUser.id;
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    setOrgProfile({ id: uid, ...userDoc.data() });
                } else {
                    onNavigate('creator-dashboard');
                    console.warn('[AssociationDashboard] No user doc found for:', uid);
                    setOrgProfile({ id: uid, role: 'Organization' }); // Minimal profile to allow loading
                }
            } catch (err) {
                console.error("Error fetching Association Profile:", err);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    };

    const fetchMyEvents = async () => {
        const uid = orgProfile?.id || user?.id || auth.currentUser?.uid;
        if (!uid) return;
        setLoading(true);
        try {
            // Fetch by ID (New standard)
            const resId = await apiClient.get(`events?hostId=${uid}`);
            let allMyEvents = resId.data || [];

            // Legacy fallbacks (Email-based)
            const emailsToTry = new Set<string>();
            const authEmail = orgProfile?.email || user?.email || auth.currentUser?.email;
            if (authEmail) emailsToTry.add(authEmail);
            if (orgProfile?.hostEmail) emailsToTry.add(orgProfile.hostEmail);

            console.log('[fetchMyEvents] Querying hostId:', uid);
            for (const email of emailsToTry) {
                try {
                    const resEmail = await apiClient.get(`events?hostEmail=${encodeURIComponent(email)}`);
                    const legacyEvents = resEmail.data || [];
                    legacyEvents.forEach((le: any) => {
                        if (!allMyEvents.find((e: any) => e.id === le.id)) {
                            allMyEvents.push(le);
                        }
                    });
                } catch (e) {
                    console.warn(`Fallback fetch failed for ${email}:`, e);
                }
            }

            // TERTIARY FALLBACK: Full collection scan filtered client-side
            if (allMyEvents.length === 0) {
                console.warn('[fetchMyEvents] Indexed queries returned 0 â€” doing full scan fallback.');
                const allRes = await apiClient.get('events');
                const allEventsList: any[] = allRes.data || [];
                allMyEvents = allEventsList.filter((e: any) => 
                    e.hostId === uid || 
                    (authEmail && e.hostEmail === authEmail) ||
                    (orgProfile?.hostEmail && e.hostEmail === orgProfile.hostEmail)
                );
                console.log('[fetchMyEvents] Full-scan results:', allMyEvents.length);
            }

            setMyEvents(allMyEvents);
        } catch (err) {
            console.error("Error fetching org events:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        const uid = orgProfile?.id || user?.id || auth.currentUser?.uid;
        if (!uid) return;
        setLoading(true);
        try {
            const res = await apiClient.get(`proposals?senderId=${uid}&recipientId=${uid}`);
            setProposals(res.data);
        } catch (error) {
            console.error("Error fetching proposals:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const q = query(collection(db, "users"), where("role", "==", 'Brand'), limit(20));
            const snap = await getDocs(q);
            setBrands(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
        } catch (error) {
            console.error("Error fetching brands:", error);
        }
    };



    useEffect(() => {
        if (user) {
            fetchOrgData();
        }
    }, [user]);

    useEffect(() => {
        const uid = orgProfile?.id || user?.id || auth.currentUser?.uid;
        if (uid) {
            fetchMyEvents();
            fetchProposals();
            fetchBrands();
            fetchGigs();
            fetchAllocations();
        }
    }, [orgProfile?.id, user?.id, auth.currentUser?.uid]);

    useEffect(() => {
        fetchWallet();
    }, [currentView, orgProfile?.id, user?.id, auth.currentUser?.uid]);

    useEffect(() => {
        if (currentView === 'creators' || currentView === 'hiring') {
            const fetchCreators = async () => {
                setCreatorsLoading(true);
                try {
                    // Fetch users with a generous limit
                    const q = query(collection(db, "users"), limit(200));
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
                            // Match if explicitly in our list
                            if (creatorRoleSet.has(u.role)) return true;
                            // Match if contains key keywords (case insensitive)
                            const role = (u.role || '').toLowerCase();
                            if (role.includes('influencer') || role.includes('creator')) {
                                // Exclude Associations even if they have 'influencer' in name (unlikely but safe)
                                if (!role.includes('Association') && !role.includes('brand')) return true;
                            }
                            return false;
                        });
                    
                    console.log('[fetchCreators] Final creators found:', creatorsData.length);
                    setCreators(creatorsData);
                } catch (e: any) {
                    console.error("Creator fetch error:", e);
                } finally {
                    setCreatorsLoading(false);
                }
            };
            fetchCreators();
        } else if (currentView === 'events') {
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
        if (!formData.name.trim() || !formData.date || !formData.location.trim() || !formData.description.trim() || !formData.targetSponsorship) {
            alert('Please fill in all fields.');
            return;
        }

        // Volunteer budget checks
        const isVolunteer = formData.needVolunteers === 'yes';
        const isPaid = isVolunteer && formData.volunteerType === 'paid';
        const paidBudget = isPaid ? Number(formData.campaignBudget) : 0;

        if (isVolunteer) {
            if (!formData.campaignTitle.trim()) {
                alert("Please provide a volunteer campaign title.");
                return;
            }
            if (!formData.campaignBrief.trim()) {
                alert("Please provide a volunteer campaign brief.");
                return;
            }
            if (!formData.campaignDeadline) {
                alert("Please select a volunteer campaign deadline.");
                return;
            }
            if (isPaid) {
                if (isNaN(paidBudget) || paidBudget <= 0) {
                    alert("Please specify a valid paid volunteer budget.");
                    return;
                }
                // Verify wallet balance
                const w = await WalletService.getOrCreateWallet(user.uid);
                if (w.balance < paidBudget) {
                    alert(`Insufficient wallet balance for paid volunteers. You need ₦${paidBudget.toLocaleString()} volunteer budget but only have ₦${w.balance.toLocaleString()}.`);
                    return;
                }
            }
        }

        setSubmitting(true);
        try {
            const orgName = orgProfile?.name || "Association";
            const uni = orgProfile?.university || "Unknown";
            const payload = {
                name: formData.name.trim(),
                date: formData.date,
                location: formData.location.trim(),
                description: formData.description.trim(),
                targetSponsorship: Number(formData.targetSponsorship),
                expectedAttendees: formData.expectedAttendees ? Number(formData.expectedAttendees) : 0,
                sponsorshipSlots: formData.sponsorshipSlots ? Number(formData.sponsorshipSlots) : 0,
                sponsorshipPackages: formPackages.map(pkg => ({ name: pkg.name, price: Number(pkg.price), entails: pkg.entails })),
                activationNeeds: formData.activationNeeds.trim(),
                hostName: orgName,
                hostId: user.uid,
                hostEmail: user.email,
                hostRole: 'Organization',
                university: uni,
                status: 'published',
                createdAt: new Date().toISOString()
            };
            const res = await apiClient.post('events', payload);
            const createdEventId = res.data.id;
            logEvent('create_event', { eventId: createdEventId, targetSponsorship: payload.targetSponsorship });

            // Create Volunteer Gig if selected
            if (isVolunteer) {
                if (isPaid) {
                    // Lock budget in escrow
                    await WalletService.lockEscrow(user.uid, paidBudget, `Escrow for volunteer gig: ${formData.campaignTitle}`);
                    await fetchWallet();
                }

                await addDoc(collection(db, 'campaigns'), {
                    title: formData.campaignTitle.trim(),
                    description: formData.campaignBrief.trim(),
                    reward: paidBudget,
                    type: isPaid ? 'paid' : 'volunteer',
                    hostId: user.uid,
                    hostName: orgName,
                    status: 'open',
                    createdAt: serverTimestamp(),
                    eventId: createdEventId
                });
                alert(isPaid ? 'Event published and paid volunteer campaign launched!' : 'Event published and unpaid volunteer campaign launched!');
            } else {
                alert('Event published successfully!');
            }
            
            setShowCreateModal(false);
            setFormData({ 
                name: '', 
                date: '', 
                location: '',
                description: '', 
                targetSponsorship: '',
                expectedAttendees: '',
                sponsorshipSlots: '',
                sponsorshipPackages: '',
                activationNeeds: '',
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
            
            // Optimistic update: Add to local state immediately so it doesn't 'vanish' due to latency
            const newEvent = { id: createdEventId, ...payload };
            setMyEvents(prev => [newEvent, ...prev]);
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

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;
        setEditSubmitting(true);
        try {
            await apiClient.patch(`events/${editingEvent.id}`, {
                ...editFormData,
                targetSponsorship: Number(editFormData.targetSponsorship),
                expectedAttendees: editFormData.expectedAttendees ? Number(editFormData.expectedAttendees) : 0,
                sponsorshipSlots: editFormData.sponsorshipSlots ? Number(editFormData.sponsorshipSlots) : 0,
                sponsorshipPackages: editFormPackages.map(pkg => ({ name: pkg.name, price: Number(pkg.price), entails: pkg.entails }))
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
            logEvent('send_proposal_association', { recipientId: data.recipientId, budget: data.budget });

            // Notify Brand
            const brand = brands.find(b => b.id === data.recipientId);
            const recipientName = brand?.name || proposalRecipient?.name || 'Brand';
            const recipientEmail = brand?.email || brand?.brandEmail;
            if (recipientEmail) {
                notifyProposalReceived(
                    recipientEmail,
                    recipientName,
                    orgProfile?.name || 'Association',
                    data.message
                );
            }

            alert("Partnership proposal sent successfully!");
            setShowProposalModal(false);
            setProposalRecipient(null);
            fetchProposals();
        } catch (error) {
            console.error("Proposal error:", error);
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
                    prop.recipient?.name || orgProfile?.name || 'Association',
                    status
                );
            }

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

    const fetchGigs = async () => {
        const orgId = orgProfile?.id || auth.currentUser?.uid;
        if (!orgId) return;
        try {
            const snap = await getDocs(query(collection(db, 'campaigns'), where('hostId', '==', orgId)));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort in memory to avoid index requirements
            data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setGigs(data);
        } catch (e) {
            console.error("fetchGigs error:", e);
        }
    };

    const fetchAllocations = async () => {
        const orgId = orgProfile?.id || auth.currentUser?.uid;
        if (!orgId) return;
        const q = query(collection(db, 'campaignAllocations'), where('hostId', '==', orgId));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const grouped: Record<string, any[]> = {};
        all.forEach((a: any) => {
            if (!grouped[a.campaignId]) grouped[a.campaignId] = [];
            grouped[a.campaignId].push(a);
        });
        setGigAllocations(grouped);
    };

    const handleCreateGig = async () => {
        if (!gigFormData.title.trim() || !gigFormData.description.trim()) {
            alert('Please fill in title and description.');
            return;
        }

        setGigSubmitting(true);
        try {
            const orgId = orgProfile?.id || auth.currentUser?.uid;
            if (!orgId) throw new Error('Not authenticated');

            const reward = Number(gigFormData.reward);
            if (reward > 0) {
                const w = await WalletService.getOrCreateWallet(orgId);
                if (w.balance < reward) {
                    throw new Error(`Insufficient funds. You need ₦${reward.toLocaleString()} but only have ₦${w.balance.toLocaleString()}.`);
                }
                await WalletService.lockEscrow(orgId, reward, `Escrow for gig: ${gigFormData.title}`);
                await fetchWallet();
            }

            await addDoc(collection(db, 'campaigns'), {
                ...gigFormData,
                reward,
                hostId: orgId,
                hostName: orgProfile?.name || 'Association',
                status: 'open',
                createdAt: serverTimestamp()
            });

            setShowGigModal(false);
            setGigFormData({ title: '', description: '', reward: '0', type: 'volunteer', location: '' });
            fetchGigs();
            alert('Gig launched successfully!');
        } catch (e: any) {
            console.error(e);
            alert(e.message || 'Failed to create gig.');
        } finally {
            setGigSubmitting(false);
        }
    };

    const handleAssignGig = async () => {
        if (!assigningGigId || !selectedCreatorForAssign) return;
        try {
            const orgId = orgProfile?.id || auth.currentUser?.uid;
            const q = query(
                collection(db, 'campaignAllocations'),
                where('campaignId', '==', assigningGigId),
                where('studentId', '==', selectedCreatorForAssign.id)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                alert('This creator is already assigned to this gig.');
                return;
            }

            const gig = gigs.find(g => g.id === assigningGigId);
            const reward = Number(gig?.reward || 0);

            // Use a transaction to ensure all updates happen atomically
            await runTransaction(db, async (transaction) => {
                // 1. Create Allocation
                const allocRef = doc(collection(db, 'campaignAllocations'));
                transaction.set(allocRef, {
                    campaignId: assigningGigId,
                    campaignTitle: gig?.title,
                    studentId: selectedCreatorForAssign.id,
                    studentName: selectedCreatorForAssign.name,
                    studentEmail: selectedCreatorForAssign.email,
                    hostId: orgId,
                    amount: reward,
                    status: 'active',
                    assignedAt: serverTimestamp()
                });

                // 2. Update Creator's Wallet (Locked Funds)
                const creatorWalletRef = doc(db, 'wallets', selectedCreatorForAssign.id);
                const creatorSnap = await transaction.get(creatorWalletRef);
                const creatorData = creatorSnap.exists() ? creatorSnap.data() : { balance: 0, pending: 0, escrow: 0 };
                
                transaction.set(creatorWalletRef, {
                    ...creatorData,
                    escrow: (creatorData.escrow || 0) + reward,
                    lastUpdated: serverTimestamp()
                }, { merge: true });

                // 3. Record Creator Transaction
                const transRef = doc(collection(db, 'transactions'));
                transaction.set(transRef, {
                    userId: selectedCreatorForAssign.id,
                    amount: reward,
                    type: 'credit',
                    status: 'escrow',
                    description: `Locked: ${gig?.title || 'New Gig'}`,
                    relatedUserId: orgId,
                    createdAt: serverTimestamp()
                });
            });

            setShowAssignModal(false);
            setSelectedCreatorForAssign(null);
            setAssigningGigId('');
            fetchAllocations();
            alert(`Assigned ${selectedCreatorForAssign.name} to gig! Money moved to their locked funds.`);
        } catch (e) {
            console.error(e);
            alert('Failed to assign gig.');
        }
    };

    const handleReleasePayment = async (alloc: any) => {
        if (!orgProfile?.id || !alloc.id) return;
        if (!window.confirm(`Accept report and release ₦${alloc.amount.toLocaleString()} to ${alloc.studentName}?`)) return;
        
        setSubmitting(true);
        try {
            await WalletService.releaseOrgGigPayment(
                orgProfile.id,
                alloc.id,
                alloc.campaignTitle || 'Gig'
            );
            fetchAllocations();
            alert('Report accepted and payment released!');
        } catch (e: any) {
            alert(e.message || 'Failed to release payment.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectReport = async (alloc: any) => {
        if (!alloc.id) return;
        const reason = window.prompt('Why are you rejecting this report?');
        if (!reason) return;

        try {
            await WalletService.updateAllocationStatus(alloc.id, 'revision', reason);
            fetchAllocations();
            alert('Report rejected. Creator notified for revision.');
        } catch (e) {
            alert('Failed to reject report.');
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const userId = orgProfile?.id || (user as any)?.uid || (user as any)?.id;
        if (!userId || !withdrawalAmount) return;
        setWithdrawing(true);
        try {
            const userEmail = orgProfile?.email || (user as any)?.email;
            const userName = orgProfile?.name || (user as any)?.name || 'Association';

            await WalletService.requestWithdrawal(
                userId, 
                Number(withdrawalAmount), 
                bankDetails,
                { name: userName, email: userEmail }
            );

            // 1. Send Email Notification to User & Admin
            if (userEmail) {
                notifyWithdrawal(userEmail, userName, Number(withdrawalAmount), { details: bankDetails });
            }

            // 2. Create In-App Notification for User
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId: userId,
                    type: 'withdrawal_requested',
                    title: 'Withdrawal Requested 💸',
                    message: `Your withdrawal request of ₦${Number(withdrawalAmount).toLocaleString()} has been submitted and is currently being processed by ABC-Rally.`,
                    read: false,
                    createdAt: new Date().toISOString()
                });
            } catch (notifErr) {
                console.warn('In-app notification creation error:', notifErr);
            }

            alert('Withdrawal request submitted successfully! Confirmation email and in-app notification sent.');
            setShowWithdrawModal(false);
            setWithdrawalAmount('');
            await fetchWallet();
        } catch (e: any) {
            alert(e.message || 'Withdrawal failed.');
        } finally {
            setWithdrawing(false);
        }
    };

    const renderContent = () => {
        switch (currentView) {
            case 'wallet':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Wallet</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Track incoming sponsorship payments, pending funds, request payouts, withdrawals, and transaction records.</p>
                        </div>
                        {walletLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : (
                            <>
                                {/* Summary Cards */}
                                <div className="grid md:grid-cols-4 gap-8">
                                    {[
                                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                                        { label: 'Campaign / Gig Spend', value: `₦${campaignGigSpend.toLocaleString()}`, icon: <Briefcase className="w-6 h-6" />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' },
                                        { label: 'Sponsorship Spend', value: `₦${sponsorshipSpend.toLocaleString()}`, icon: <Handshake className="w-6 h-6" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' },
                                        { label: 'Locked in Escrow', value: `₦${(wallet?.escrow || 0).toLocaleString()}`, icon: <Lock className="w-6 h-6" />, color: 'bg-spark-purple/10 text-spark-purple border border-spark-purple/20' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                                        </div>
                                    ))}
                                </div>

                                {/* Wallet Actions */}
                                <div className="bg-spark-black rounded-[2.5rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div>
                                        <h3 className="text-2xl font-black mb-2 text-white">Association Finances</h3>
                                        <p className="text-purple-100 font-medium">Manage sponsorship funds and pay for campus event resources.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <button 
                                            onClick={() => setShowWithdrawModal(true)}
                                            disabled={(wallet?.balance || 0) < 1000}
                                            className="px-10 py-5 bg-white text-spark-black font-black rounded-2xl hover:bg-gray-100 transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {(wallet?.balance || 0) < 1000 ? 'Min ₦1,000' : 'Request Withdrawal'}
                                        </button>
                                        <div className="relative w-full sm:w-48">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                            <input 
                                                type="number" 
                                                value={topUpAmount}
                                                onChange={e => setTopUpAmount(e.target.value)}
                                                className="w-full pl-8 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white font-black outline-none focus:border-spark-purple transition-all"
                                                placeholder="Amount"
                                            />
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                if (!orgProfile?.id) return;
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
                                                const handler = PaystackPop.setup({
                                                    key: paystackPublicKey,
                                                    email: orgProfile.email || 'org@campushub.africa',
                                                    amount: amount * 100, // Paystack uses Kobo
                                                    currency: 'NGN',
                                                    ref: reference,
                                                    callback: function(response: any) {
                                                        alert("Payment successful! Updating wallet...");
                                                        (async () => {
                                                            try {
                                                                setWalletLoading(true);
                                                                await WalletService.topUpWallet(orgProfile.id, amount, response.reference);

                                                                // Notify user + admin of top-up
                                                                const email = orgProfile.email || user?.email;
                                                                const name = orgProfile.name || user?.name || 'Association User';
                                                                if (email) notifyTopUp(email, name, amount, response.reference);

                                                                alert(`Successfully topped up ₦${amount.toLocaleString()}!`);
                                                                fetchWallet();
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
                                        className="px-10 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg whitespace-nowrap"
                                    >
                                        + Add Funds
                                    </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'events':
                const otherEvents = (allEvents || []).filter((e: any) => e.hostId !== (orgProfile?.id || user?.id || auth.currentUser?.uid));
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-color)]">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)]">Events</h2>
                                <p className="text-[var(--text-secondary)] mt-1 font-medium">Discover upcoming events, Create, manage, and promote your association events and programs.</p>
                            </div>
                            
                            {/* Sub-tabs */}
                            <div className="flex bg-spark-purple/5 border border-spark-purple/10 p-1 rounded-2xl">
                                <button 
                                    onClick={() => setEventTab('explore')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${eventTab === 'explore' ? 'bg-spark-purple text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-purple'}`}
                                >
                                    Explore Events
                                </button>
                                <button 
                                    onClick={() => setEventTab('my')}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${eventTab === 'my' ? 'bg-spark-purple text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-purple'}`}
                                >
                                    My Events
                                </button>
                            </div>
                        </div>

                        {eventTab === 'explore' ? (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                {loading ? (
                                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                                ) : otherEvents.length === 0 ? (
                                    <DashboardPlaceholder title="No Events" icon={<Calendar className="w-9 h-9" />} description="There are no upcoming campus events from other hosts at the moment." />
                                ) : (
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {otherEvents.map(event => {
                                            const attendance = event.expectedAttendees ? `${event.expectedAttendees.toLocaleString()} expected` : "TBD";
                                            const slots = event.sponsorshipSlots ? `${event.sponsorshipSlots} slots` : "TBD";
                                            const activation = event.activationNeeds || "No specific activation details listed.";
                                            return (
                                                <div key={event.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group relative">
                                                    <div className="h-3 bg-spark-purple"></div>
                                                    <div className="p-8 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-spark-purple tracking-wider inline-block">
                                                                    {event.date}
                                                                </div>
                                                                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-spark-purple tracking-wider inline-block max-w-[150px] truncate">
                                                                    {event.location || 'Campus'}
                                                                </div>
                                                            </div>
                                                            
                                                            <h3 className="text-xl font-black mb-1 group-hover:text-spark-purple transition-colors text-[var(--text-primary)]">
                                                                {event.name}
                                                            </h3>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">
                                                                Hosted by: <span className="text-spark-purple">{event.hostName}</span>
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
                                                                    <p className="text-[10px] font-black uppercase text-spark-purple tracking-wider">💡 Activation Needs:</p>
                                                                    <p className="text-xs leading-normal font-medium italic text-[var(--text-secondary)]">{activation}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-auto pt-4 border-t border-[var(--border-color)] space-y-3">
                                                            <div className="flex justify-between items-center text-xs">
                                                                <div>
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Raised</p>
                                                                    <p className="text-base font-black text-emerald-600">₦{Number(event.raisedSponsorship || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Target</p>
                                                                    <p className="text-sm font-black text-[var(--text-primary)]">₦{Number(event.targetSponsorship || 0).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] h-2 rounded-full overflow-hidden">
                                                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: `${Number(event.targetSponsorship || 0) > 0 ? Math.min(100, Math.round((Number(event.raisedSponsorship || 0) / Number(event.targetSponsorship)) * 100)) : 0}%` }} />
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedEvent(event)}
                                                                    className="px-4 py-2 bg-spark-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-spark-purple hover:shadow-lg transition-all active:scale-95 flex-shrink-0"
                                                                >
                                                                    Event Details
                                                                </button>
                                                            </div>
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
                                    <h3 className="text-xl font-black">My Events</h3>
                                    <button
                                        onClick={() => setShowListingTermsModal(true)}
                                        className="bg-spark-purple text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
                                    >
                                        + List New Event
                                    </button>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                                ) : myEvents.length === 0 ? (
                                    <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)] animate-in fade-in duration-500">
                                        <div className="w-20 h-20 bg-spark-purple/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-purple">
                                            <Ticket className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No events listed yet.</h3>
                                        <p className="text-[var(--text-secondary)] font-medium">Create your first event to start attracting brand sponsors.</p>
                                        <button
                                            onClick={() => setShowListingTermsModal(true)}
                                            className="mt-8 px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-purple transition-all"
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
                                                        <h4 className="text-2xl font-black mb-1 group-hover:text-spark-purple transition-colors text-[var(--text-primary)]">{event.name}</h4>
                                                        <p className="text-sm font-bold text-spark-purple uppercase tracking-widest">{event.date}</p>
                                                    </div>
                                                    <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Published</span>
                                                </div>
                                                <p className="text-[var(--text-secondary)] text-sm mb-8 line-clamp-2 leading-relaxed">{event.description}</p>
                                                <div className="mb-8 pb-8 border-b border-[var(--border-color)] space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Raised Sponsorship</p>
                                                            <p className="text-2xl font-black text-emerald-600">₦{Number(event.raisedSponsorship || 0).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">Target Goal</p>
                                                            <p className="text-base font-black text-[var(--text-primary)]">₦{Number(event.targetSponsorship || 0).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        const raised = Number(event.raisedSponsorship || 0);
                                                        const target = Number(event.targetSponsorship || 0);
                                                        const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                                                        return (
                                                            <div className="space-y-1">
                                                                <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] h-3 rounded-full overflow-hidden">
                                                                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                                </div>
                                                                <div className="flex justify-between items-center text-[11px] font-bold text-[var(--text-secondary)]">
                                                                    <span className="text-emerald-600 font-black">{pct}% Funded</span>
                                                                    <span>{Array.isArray(event.sponsors) ? event.sponsors.length : 0} Sponsor{(Array.isArray(event.sponsors) ? event.sponsors.length : 0) !== 1 ? 's' : ''}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <button
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="w-full py-4 bg-spark-purple text-white font-black rounded-2xl hover:bg-purple-700 transition-all"
                                                >
                                                    Manage Sponsorships
                                                </button>
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleEditEvent(event)}
                                                        className="flex-1 py-3 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Edit className="w-4 h-4" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEvent(event.id)}
                                                        className="flex-1 py-3 bg-spark-purple text-white font-black rounded-2xl hover:bg-purple-700 transition-all text-sm flex items-center justify-center gap-2"
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
            case 'gigs':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Assign Gigs</h3>
                                <p className="text-[var(--text-secondary)] mt-1">Create volunteer opportunities or paid gigs for creators.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setGigFormData({ title: '', description: '', reward: '0', type: 'volunteer' });
                                    setShowGigModal(true);
                                }} 
                                className="bg-spark-purple text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all active:scale-95"
                            >
                                + Create New Gig
                            </button>
                        </div>

                        {gigs.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="text-6xl mb-6">ðŸ“¢</div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Gigs Yet</h3>
                                <p className="text-[var(--text-secondary)] mb-8">Start by creating a volunteer or paid gig to assign to creators.</p>
                                <button 
                                    onClick={() => setShowGigModal(true)} 
                                    className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-purple transition-all"
                                >
                                    Create First Gig
                                </button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {gigs.map((g: any) => {
                                    const allocations = gigAllocations[g.id] || [];
                                    return (
                                        <div key={g.id} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-8 hover:shadow-xl transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)] group-hover:text-spark-purple transition-colors">{g.title}</h4>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${Number(g.reward) === 0 ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                                        {Number(g.reward) === 0 ? 'Volunteerism' : 'Paid Gig'}
                                                    </span>
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase bg-[var(--bg-secondary)] text-gray-600`}>{g.status?.replace('_', ' ')}</span>
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-5">{g.description}</p>

                                            <div className="mb-5 space-y-2">
                                                <div className="flex justify-between text-xs font-black">
                                                    <span className="text-[var(--text-secondary)]">Reward: <span className="text-spark-purple">{Number(g.reward) === 0 ? 'Experience/Perks' : `₦${Number(g.reward).toLocaleString()}`}</span></span>
                                                    <span className="text-[var(--text-secondary)]">Assigned: <span className="text-green-600">{allocations.length} Creators</span></span>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedGig(g);
                                                    }} 
                                                    className="flex-1 py-3 bg-spark-purple text-white font-black rounded-xl hover:bg-purple-700 transition-all text-sm"
                                                >
                                                    Manage Gig
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (!window.confirm('Are you sure you want to delete this gig?')) return;
                                                        try {
                                                            await apiClient.delete(`gigs/${g.id}`);
                                                            fetchMyGigs();
                                                            alert('Gig deleted.');
                                                        } catch (e) {
                                                            alert('Failed to delete gig.');
                                                        }
                                                    }} 
                                                    className="w-12 h-12 bg-spark-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            case 'creators': {
                 const filteredCreatorsList = creators.filter((c) => {
                    const isAvailable = c.availability === 'Available Now' || c.availability === 'Limited';

                    const term = assocSearchTerm.toLowerCase();
                    const matchesSearch = !assocSearchTerm ||
                        c.name?.toLowerCase().includes(term) ||
                        c.professionalHeadline?.toLowerCase().includes(term) ||
                        c.primaryService?.toLowerCase().includes(term) ||
                        (c.services || []).some((s: string) => s.toLowerCase().includes(term)) ||
                        c.campusCommunityReach?.toLowerCase().includes(term) ||
                        c.city?.toLowerCase().includes(term);

                    const matchesCapability = assocFilterCapability === 'All' ||
                        c.primaryCapability === assocFilterCapability ||
                        (c.capabilities || []).includes(assocFilterCapability);

                    const allSvcs = [c.primaryService, ...(c.services || []), ...(c.additionalServices || [])].filter(Boolean);
                    const matchesService = assocFilterService === 'All' || allSvcs.some((s: string) => s === assocFilterService);

                    const creatorStateRaw = (c.state || c.location || '').toLowerCase();
                    const matchesState = assocFilterState === 'All' || creatorStateRaw.includes(assocFilterState.toLowerCase());

                    const campusCombined = [c.campusCommunityReach, c.university, c.city].filter(Boolean).join(' ').toLowerCase();
                    const matchesCampus = !assocFilterCampus || campusCombined.includes(assocFilterCampus.toLowerCase());

                    const matchesAvailability = !assocFilterAvailable || isAvailable;
                    const matchesWhatsApp = !assocFilterWhatsApp || !!(c.whatsappMediaName || c.whatsappMediaType);

                    const creatorType = c.influencerType || (c.university ? 'Student Creator' : 'Professional Creator');
                    const isProfessional = creatorType === 'Professional Creator';
                    const matchesTypeTab = creatorTypeTab === 'all' || (creatorTypeTab === 'professional' ? isProfessional : !isProfessional);

                    return matchesSearch && matchesCapability && matchesService && matchesState && matchesCampus && matchesAvailability && matchesWhatsApp && matchesTypeTab;
                });
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Find Creators</h3>
                                <p className="text-[var(--text-secondary)] mt-1">Discover and connect with creators for your events.</p>
                            </div>
                            <div className="flex bg-spark-purple/5 border border-spark-purple/10 p-1 rounded-2xl">
                                {(['all', 'professional', 'student'] as const).map(tab => (
                                    <button key={tab} onClick={() => setCreatorTypeTab(tab)}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${creatorTypeTab === tab ? 'bg-spark-purple text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-purple'}`}
                                    >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                                ))}
                            </div>
                        </div>

                        {/* Section 8 Filter Panel */}
                        <div className="bg-[var(--bg-primary)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)] space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <input type="text" placeholder="Search by name, service, campus..."
                                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-purple transition-all text-sm"
                                        value={assocSearchTerm} onChange={(e) => setAssocSearchTerm(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                                </div>
                                <select value={assocFilterCapability}
                                    onChange={(e) => { setAssocFilterCapability(e.target.value); setAssocFilterService('All'); }}
                                    className="w-full py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-purple transition-all text-sm"
                                >
                                    <option value="All">All Capabilities</option>
                                    {Object.keys(CREATOR_SERVICES_BY_CAPABILITY).map(cap => <option key={cap} value={cap}>{cap}</option>)}
                                </select>
                                <select value={assocFilterService} onChange={(e) => setAssocFilterService(e.target.value)}
                                    className="w-full py-3 px-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-purple transition-all text-sm"
                                >
                                    <option value="All">All Services</option>
                                    {(assocFilterCapability !== 'All' ? CREATOR_SERVICES_BY_CAPABILITY[assocFilterCapability] : ALL_CREATOR_SERVICES).map((svc: string) => (
                                        <option key={svc} value={svc}>{svc}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-3 items-center">
                                <select value={assocFilterState} onChange={(e) => setAssocFilterState(e.target.value)}
                                    className="py-2.5 px-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-purple transition-all text-sm min-w-[140px]"
                                >
                                    <option value="All">All States</option>
                                    {STATES.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="relative">
                                    <input type="text" placeholder="Campus / community keyword"
                                        className="pl-9 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-purple transition-all text-sm w-56"
                                        value={assocFilterCampus} onChange={(e) => setAssocFilterCampus(e.target.value)}
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                </div>
                                <button onClick={() => setAssocFilterAvailable(!assocFilterAvailable)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${assocFilterAvailable ? 'bg-green-500 text-white border-green-500' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-green-500'}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${assocFilterAvailable ? 'bg-white animate-pulse' : 'bg-[var(--text-secondary)]'}`}></span>
                                    Available for Hire
                                </button>
                                <button onClick={() => setAssocFilterWhatsApp(!assocFilterWhatsApp)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${assocFilterWhatsApp ? 'bg-green-600 text-white border-green-600' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-green-600'}`}
                                >
                                    📻 WhatsApp Media
                                </button>
                                {(assocSearchTerm || assocFilterCapability !== 'All' || assocFilterService !== 'All' || assocFilterState !== 'All' || assocFilterCampus || assocFilterAvailable || assocFilterWhatsApp || creatorTypeTab !== 'all') && (
                                    <button onClick={clearAssocFilters} className="ml-auto text-xs font-black text-spark-purple hover:underline uppercase tracking-wider">Clear Filters</button>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap items-center text-[11px] text-[var(--text-secondary)] font-bold">
                                <span>Showing {filteredCreatorsList.length} creator{filteredCreatorsList.length !== 1 ? 's' : ''}</span>
                                {assocFilterCapability !== 'All' && <span className="px-2 py-0.5 bg-spark-purple/10 text-spark-purple rounded-lg">{assocFilterCapability}</span>}
                                {assocFilterService !== 'All' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg">{assocFilterService}</span>}
                                {assocFilterState !== 'All' && <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-lg">{assocFilterState}</span>}
                                {assocFilterCampus && <span className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-lg">{assocFilterCampus}</span>}
                                {assocFilterAvailable && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg">Available for Hire</span>}
                                {assocFilterWhatsApp && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg">WhatsApp Media</span>}
                            </div>
                        </div>

                        {creatorsLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : filteredCreatorsList.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-purple/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-purple">
                                    <Search className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Talent Found</h3>
                                <p className="text-[var(--text-secondary)]">No creators match your filter selections.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCreatorsList.map(profile => {
                                    const primaryCap: string | undefined = profile.primaryCapability;
                                    const primarySvc: string | undefined = profile.primaryService;
                                    const displayLocation = profile.city && profile.state
                                        ? `${profile.city}, ${profile.state}`
                                        : profile.location || profile.university || 'Location not set';
                                    const campusReach: string | undefined = profile.campusCommunityReach;
                                    const startingPrice = profile.startingPrice;
                                    const pricingNegotiable: boolean = profile.pricingNegotiable;
                                    const pricingBasis: string = profile.pricingBasis || 'per project';
                                    const isApproved = profile.reviewStatus === 'approved';
                                    const isAvailableForHire = isApproved &&
                                        (profile.availability === 'Available Now' || profile.availability === 'Limited');
                                    const capColors: Record<string, string> = {
                                        Create: 'bg-spark-red text-white',
                                        Manage: 'bg-blue-600 text-white',
                                        Distribute: 'bg-green-600 text-white',
                                        Activate: 'bg-amber-500 text-white',
                                    };
                                    return (
                                        <div key={profile.id} className="group bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                                            <div className="p-6 pb-4 flex flex-col items-center text-center flex-1">
                                                {/* Top row: status badge + capability */}
                                                <div className="w-full flex justify-between items-center mb-4">
                                                    {isAvailableForHire ? (
                                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                            Available
                                                        </span>
                                                    ) : isApproved && profile.availability === 'Not available' ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                                                            Not Available
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-spark-red/5 text-spark-red border border-spark-red/10">
                                                            Creator
                                                        </span>
                                                    )}

                                                    {primaryCap && (
                                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${capColors[primaryCap] || 'bg-spark-red text-white'}`}>
                                                            {primaryCap}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Photo */}
                                                <div className="w-16 h-16 rounded-2xl bg-spark-purple/10 text-spark-purple flex items-center justify-center font-black text-2xl mb-3 overflow-hidden shadow-md border-2 border-[var(--bg-primary)]">
                                                    {profile.imageUrl ? <img src={profile.imageUrl} alt={profile.name || 'Creator'} className="w-full h-full object-cover" /> : (profile.name || '?').charAt(0)}
                                                </div>

                                                {/* Name */}
                                                <h3 className="font-black text-base line-clamp-1 text-[var(--text-primary)]">{profile.name}</h3>

                                                {/* Professional Headline */}
                                                <p className="text-xs text-spark-purple font-bold mt-0.5 line-clamp-1">
                                                    {profile.professionalHeadline || primarySvc || profile.niche || profile.nicheCategory || 'Creator'}
                                                </p>

                                                {/* Primary Service tag */}
                                                {primarySvc && (
                                                    <span className="mt-2 px-3 py-1 bg-spark-purple/10 text-spark-purple font-black text-[9px] rounded-xl border border-spark-purple/20 uppercase tracking-wider">
                                                        {primarySvc}
                                                    </span>
                                                )}

                                                {/* Location */}
                                                <p className="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium mt-3">
                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                    {displayLocation}{campusReach ? ` · ${campusReach}` : ''}
                                                </p>

                                                {/* Starting Price */}
                                                <p className="text-sm font-black text-[var(--text-primary)] mt-2">
                                                    {pricingNegotiable
                                                        ? 'Price negotiable'
                                                        : startingPrice
                                                            ? `Starting from ₦${Number(startingPrice).toLocaleString()} / ${pricingBasis}`
                                                            : '—'
                                                    }
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="px-6 pb-6 flex gap-3">
                                                <button
                                                    onClick={() => handleViewCreator(profile.id, profile)}
                                                    className="flex-1 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--bg-tertiary)] transition-all text-sm border border-[var(--border-color)]"
                                                >
                                                    View Profile
                                                </button>

                                                <button
                                                    onClick={() => handleOpenProposalModal(profile)}
                                                    className="flex-1 py-3 bg-spark-black text-white font-black rounded-xl hover:bg-gray-800 transition-all text-sm shadow-lg"
                                                >
                                                    Partner
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedCreatorForAssign(profile);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="flex-1 py-3 bg-spark-purple text-white font-black rounded-xl hover:bg-purple-700 transition-all text-sm shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    <Megaphone className="w-4 h-4" /> Assign
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }
            case 'proposals': {
                const filteredProposals = proposals.filter((p) => {
                    const isSender = p.senderId === (orgProfile?.id || auth.currentUser?.uid);
                    return proposalTab === 'incoming' ? !isSender : isSender;
                });
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Proposals</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Track sponsorship requests, partnership proposals, and brand responses.</p>
                        </div>
                        
                        <div className="flex bg-spark-purple/5 border border-spark-purple/10 p-1 rounded-2xl max-w-xs">
                            <button 
                                onClick={() => setProposalTab('incoming')}
                                className={`flex-1 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proposalTab === 'incoming' ? 'bg-spark-purple text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-purple'}`}
                            >
                                Incoming
                            </button>
                            <button 
                                onClick={() => setProposalTab('outgoing')}
                                className={`flex-1 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proposalTab === 'outgoing' ? 'bg-spark-purple text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-purple'}`}
                            >
                                Outgoing
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : filteredProposals.length === 0 ? (
                            <DashboardPlaceholder
                                title={proposalTab === 'incoming' ? "No Incoming Proposals" : "No Outgoing Proposals"}
                                icon={<Handshake className="w-10 h-10" />}
                                description={proposalTab === 'incoming' ? "You haven't received any brand sponsorship requests yet." : "You haven't sent any partnership proposals yet."}
                            />
                        ) : (
                            <div className="grid gap-6">
                                {filteredProposals.map((p) => {
                                    const isSender = p.senderId === (orgProfile?.id || auth.currentUser?.uid);
                                    const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                    const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                    const isDirectOffer = p.status === 'pending' && !isSender;
                                    return (
                                        <div key={p.id} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-2xl font-black text-spark-purple shadow-inner">
                                                    {otherParty?.imageUrl ? <img src={otherParty.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" /> : (displayName.charAt(0))}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)]">{displayName}</h4>
                                                    <p className="text-xs text-spark-purple font-black uppercase tracking-widest">{otherParty.role}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1 uppercase tracking-wider">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                {isDirectOffer ? (
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-color)]"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(p.id, 'accepted')}
                                                            className="px-6 py-3 bg-spark-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-sm"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                                            className="px-6 py-3 bg-spark-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all border border-transparent shadow-sm"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="px-6 py-2 bg-spark-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                                                        >
                                                            View Proposal
                                                        </button>
                                                        {p.status !== 'pending' && (
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                p.status === 'accepted' ? 'bg-green-50 text-green-600' :
                                                                p.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                p.status === 'rejected' ? 'bg-purple-50 text-red-600' :
                                                                'bg-blue-50 text-blue-600'
                                                            }`}>
                                                                {p.status === 'paid' ? 'Paid & Confirmed' : p.status}
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
            }
            case 'brands':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Brand Directory</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Browse brands available for sponsorship, collaboration, and event activation.</p>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : brands.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-purple/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-purple">
                                    <Building2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Brands Found</h3>
                                <p className="text-[var(--text-secondary)]">Check back later as more brands join the network!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {brands.map(profile => (
                                    <div key={profile.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                        <div className="h-24 bg-spark-red/5 transition-colors" />
                                        <div className="px-8 pb-6 -mt-12">
                                            <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] rounded-[1.5rem] shadow-lg flex items-center justify-center text-3xl font-black text-spark-red mb-4 overflow-hidden">
                                                {profile.imageUrl ? <img src={profile.imageUrl} alt={profile.name || 'Brand Logo'} className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
                                            </div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors">{profile.name}</h3>
                                            <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-3">{profile.industry || profile.category || 'Brand Partner'}</p>
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-5 min-h-[54px] font-medium">{profile.bio || profile.description || 'Partner with this brand to secure sponsorship, event activation, and promotional support.'}</p>
                                            <div className="space-y-2 text-xs text-[var(--text-secondary)] font-semibold mb-6">
                                                {profile.location && <div className="flex items-center gap-2"><span>📍</span><span>{profile.location}</span></div>}
                                                {profile.email && <div className="flex items-center gap-2"><span>✉️</span><span>{profile.email}</span></div>}
                                            </div>
                                            <button
                                                onClick={() => setSelectedBrand(profile)}
                                                className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all transform active:scale-95"
                                            >
                                                Propose Collaboration
                                            </button>
                                        </div>
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
                    { icon: <GraduationCap className="w-8 h-8" />, title: 'Sponsorship 101: Video Course', desc: 'A curated series of short-form videos on how to structure, pitch, and close sponsorship deals as an Association.', tag: 'Course', href: '#' },
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
                        <div className="bg-spark-red rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <BookOpen className="w-32 h-32" />
                            </div>
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6">
                                <BookOpen className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black mb-2">Resource Hub</h2>
                            <p className="text-white/80 text-lg font-medium max-w-xl">Everything you need to run successful events, secure sponsors, and grow your Association.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.map((r, i) => (
                                <a key={i} href={r.href} className="group bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-7 hover:shadow-xl hover:border-spark-purple/20 transition-all block">
                                    <div className="w-14 h-14 bg-spark-purple/5 text-spark-purple rounded-xl flex items-center justify-center mb-5 group-hover:bg-spark-purple group-hover:text-white transition-all">
                                        {r.icon}
                                    </div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-black text-[var(--text-primary)] text-base leading-snug group-hover:text-spark-purple transition-colors">{r.title}</h3>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex-shrink-0 ${tagColors[r.tag] || 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>{r.tag}</span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.desc}</p>
                                    <div className="mt-5 flex items-center gap-2 text-spark-purple font-black text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span>Access Resource</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </div>
                                </a>
                            ))}
                        </div>

                        <div className="bg-[var(--bg-primary)] rounded-[2rem] p-8 border border-[var(--border-color)]">
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">💬 Need more?</h3>
                            <p className="text-[var(--text-secondary)] mb-6">Request a custom resource or template for your Association's specific needs. Our team will create it for you.</p>
                            <button className="px-6 py-3 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-purple transition-all">
                                Request a Resource
                            </button>
                        </div>
                    </div>
                );
            case 'sponsorships': {
                const sponsorshipProposals = proposals.filter((p: any) => p.senderId === (orgProfile?.id || auth.currentUser?.uid));
                const paidSponsorships = sponsorshipProposals.filter((p: any) => p.status === 'paid');
                const acceptedSponsorships = sponsorshipProposals.filter((p: any) => p.status === 'accepted');
                const pendingSponsorships = sponsorshipProposals.filter((p: any) => p.status === 'pending');
                const totalRaised = paidSponsorships.reduce((sum: number, p: any) => sum + Number(p.budget || 0), 0);
                const totalCommitted = acceptedSponsorships.reduce((sum: number, p: any) => sum + Number(p.budget || 0), 0);
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Sponsorships</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Create sponsorship packages, invite brands, and track sponsorship interest.</p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-8">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Raised</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">₦{totalRaised.toLocaleString()}</p>
                                <p className="text-xs text-green-600 font-bold mt-1">{paidSponsorships.length} sponsorship{paidSponsorships.length !== 1 ? 's' : ''} paid</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-8">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Committed</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">₦{totalCommitted.toLocaleString()}</p>
                                <p className="text-xs text-blue-600 font-bold mt-1">{acceptedSponsorships.length} accepted, awaiting payment</p>
                            </div>
                            <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-8">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Active Sponsors</p>
                                <p className="text-3xl font-black text-[var(--text-primary)]">{paidSponsorships.length + acceptedSponsorships.length}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-bold mt-1">{pendingSponsorships.length} proposal{pendingSponsorships.length !== 1 ? 's' : ''} in discussion</p>
                            </div>
                        </div>

                        {/* Sponsors List */}
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : sponsorshipProposals.length === 0 ? (
                            <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                <div className="w-20 h-20 bg-spark-purple/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-purple">
                                    <Award className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">No Sponsorships Yet</h3>
                                <p className="text-[var(--text-secondary)] font-medium mb-6">Set up your sponsorship tiers and invite brands directly from your events listing.</p>
                                <button onClick={() => setCurrentView('events')} className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-purple transition-all">
                                    Go to Events
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-lg font-black text-[var(--text-primary)] mb-4">All Sponsorship Activity</h3>
                                <div className="space-y-4">
                                    {sponsorshipProposals.map((p: any) => {
                                        const brand = p.recipient || { name: 'Unknown Brand', imageUrl: null };
                                        const brandName = (brand.name && brand.name !== 'Unknown Brand') ? brand.name : (brand.email || 'Unknown Brand');
                                        const amount = Number(p.budget || 0);
                                        const statusBadge =
                                            p.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                            p.status === 'accepted' ? 'bg-blue-50 text-blue-600' :
                                            p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                            'bg-yellow-50 text-yellow-700';
                                        return (
                                            <div key={p.id} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-6 flex items-center justify-between hover:shadow-md transition-shadow">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center justify-center text-lg font-black text-spark-purple overflow-hidden">
                                                        {brand.imageUrl ? <img src={brand.imageUrl} className="w-full h-full object-cover" alt={brandName} /> : brandName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-[var(--text-primary)]">{brandName}</h4>
                                                        <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                                                            {p.eventName || p.sponsorshipPackageName || (p.message ? p.message.substring(0, 40) + (p.message.length > 40 ? '…' : '') : 'Event Sponsorship')}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {amount > 0 && (
                                                        <p className="text-xl font-black text-[var(--text-primary)]">₦{amount.toLocaleString()}</p>
                                                    )}
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge}`}>
                                                        {p.status === 'paid' ? '✓ Paid' : p.status}
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedProposal(p)}
                                                        className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-color)]"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            }
            case 'profile':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Association Profile</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Update your association details, contact person, audience, and verification.</p>
                        </div>
                        <ProfileView user={orgProfile} onUpdate={fetchOrgData} />
                    </div>
                );

            case 'overview':
                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Welcome back, {orgProfile?.name || 'Association'}!</h2>
                            <p className="text-[var(--text-secondary)] font-medium mt-1">Quick summary of your events, proposals, sponsorships, and collaborations.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Events', value: myEvents.filter((e: any) => new Date(e.date) >= new Date()).length, icon: <Ticket className="w-6 h-6" />, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
                                { label: 'Pending Proposals', value: proposals.filter((p: any) => p.status === 'pending').length, icon: <Handshake className="w-6 h-6" />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                                { label: 'Wallet Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
                                { label: 'Total Proposals', value: proposals.length, icon: <FileText className="w-6 h-6" />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color} mb-3`}>{stat.icon}</div>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-black text-[var(--text-primary)]">Upcoming Events</h3>
                                    <button onClick={() => setCurrentView('events')} className="text-xs font-black text-spark-red uppercase tracking-widest hover:underline">View All →</button>
                                </div>
                                {myEvents.filter((e: any) => new Date(e.date) >= new Date()).slice(0, 3).length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-sm font-medium">No upcoming events. <button onClick={() => setCurrentView('events')} className="text-spark-red font-black">Create one →</button></p>
                                ) : myEvents.filter((e: any) => new Date(e.date) >= new Date()).slice(0, 3).map((evt: any) => (
                                    <div key={evt.id} className="flex items-center gap-4 py-3 border-b border-[var(--border-color)] last:border-0">
                                        <div className="w-10 h-10 bg-spark-red/10 rounded-xl flex items-center justify-center text-spark-red flex-shrink-0"><Ticket className="w-5 h-5" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[var(--text-primary)] truncate">{evt.name || evt.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">{evt.date ? new Date(evt.date).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : 'TBD'}</p>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-green-50 text-green-600 rounded-full whitespace-nowrap">₦{Number(evt.targetSponsorship || 0).toLocaleString()} target</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <h3 className="text-lg font-black text-[var(--text-primary)] mb-6">Quick Start Checklist</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Complete your association profile', action: () => setCurrentView('profile') },
                                        { label: 'Create your first event', action: () => setCurrentView('events') },
                                        { label: 'Set up sponsorship packages', action: () => setCurrentView('sponsorship_packages') },
                                        { label: 'Explore brand partnerships', action: () => setCurrentView('proposals') },
                                        { label: 'Fund your association wallet', action: () => setCurrentView('wallet') },
                                    ].map((item, i) => (
                                        <button key={i} onClick={item.action} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-left group">
                                            <div className="w-6 h-6 rounded-full border-2 border-[var(--border-color)] flex-shrink-0 group-hover:border-spark-red transition-colors" />
                                            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-spark-red transition-colors">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            // Sponsorship Packages tab removed and integrated into event creation flow per user request

            case 'hiring': {
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Hire Creators</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Hire creators directly from the creator directory using the same card layout as the brand dashboard.</p>
                        </div>
                        {creatorsLoading ? (
                            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-purple"></div></div>
                        ) : creators.length === 0 ? (
                            <DashboardPlaceholder title="No Creators Found" icon={<Search className="w-10 h-10" />} description="No creators are available right now." />
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {creators.map((creator: any) => {
                                    const creatorType = creator.influencerType || (creator.university ? 'Student Creator' : 'Professional Creator');
                                    const isProfessional = creatorType === 'Professional Creator';
                                    const category = creator.niche || creator.nicheCategory || creator.category || 'Campus Creator';
                                    const location = creator.location || creator.university || 'Not Specified';

                                    return (
                                        <div key={creator.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                            <div className="h-24 bg-spark-purple/5 transition-colors" />
                                            <div className="px-8 pb-6 -mt-12">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isProfessional ? 'bg-blue-500/10 text-blue-600' : 'bg-spark-purple/10 text-spark-purple'}`}>
                                                        {isProfessional ? 'Professional' : 'Student'}
                                                    </span>
                                                    {creator.rating && (
                                                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                                            <span>★</span>
                                                            <span>{creator.rating}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] rounded-[1.5rem] shadow-lg flex items-center justify-center text-3xl font-black text-spark-red mb-4 overflow-hidden mx-auto">
                                                    {creator.imageUrl ? <img src={creator.imageUrl} alt={creator.name || 'Creator'} className="w-full h-full object-cover" /> : creator.name?.charAt(0) || '?'}
                                                </div>
                                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-1 group-hover:text-spark-red transition-colors text-center">{creator.name}</h3>
                                                <p className="text-[10px] font-black text-spark-purple uppercase tracking-widest mb-3 text-center">{category}</p>
                                                {creator.bio && <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4 leading-relaxed text-center">{creator.bio}</p>}
                                                <div className="space-y-2 text-xs text-[var(--text-secondary)] font-semibold mb-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span>📍</span>
                                                        <span>{location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-8 pb-8">
                                                <button
                                                    onClick={() => { setProposalRecipient({ id: creator.id, name: creator.name }); setShowProposalModal(true); }}
                                                    className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all active:scale-95 text-xs uppercase tracking-wider"
                                                >
                                                    Pitch Collaboration
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            case 'reports': {
                const totalSpent = transactions.reduce((acc, t) => acc + (t.type === 'debit' && t.status === 'completed' ? (Number(t.amount) || 0) : 0), 0);
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Reports</h2>
                            <p className="text-[var(--text-secondary)] mt-1">generate your event reports, sponsorship updates, and campaign performance records.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Events Hosted', value: myEvents.length, sub: 'All time' },
                                { label: 'Accepted Partnerships', value: proposals.filter((p: any) => p.status === 'accepted' || p.status === 'paid').length, sub: 'Sponsorships secured' },
                                { label: 'Total Wallet Spend', value: `₦${totalSpent.toLocaleString()}`, sub: 'From completed debits' },
                                { label: 'Total Sponsorship Target', value: `₦${myEvents.reduce((acc: number, e: any) => acc + Number(e.targetSponsorship || 0), 0).toLocaleString()}`, sub: 'Across all events' },
                            ].map((s, i) => (
                                <div key={i} className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)]">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{s.label}</p>
                                    <p className="text-3xl font-black text-[var(--text-primary)] mt-1">{s.value}</p>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Event Reports</h3>
                                {myEvents.length === 0 ? (
                                    <p className="text-[var(--text-secondary)]">No events yet. <button onClick={() => setCurrentView('events')} className="text-spark-red font-black">Create your first event →</button></p>
                                ) : (
                                    <div className="space-y-4">
                                        {myEvents.map((evt: any) => (
                                            <div key={evt.id} className="p-6 rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div>
                                                    <h4 className="font-black text-[var(--text-primary)]">{evt.name || evt.title}</h4>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                        {evt.date ? new Date(evt.date).toLocaleDateString('en-NG', { dateStyle: 'long' }) : 'Date TBD'} &nbsp;·&nbsp; Target: ₦{Number(evt.targetSponsorship || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const report = `ABC-RALLY — Event Report\n${'='.repeat(40)}\nEvent: ${evt.name || evt.title}\nDate: ${evt.date ? new Date(evt.date).toLocaleDateString('en-NG', { dateStyle: 'long' }) : 'TBD'}\nLocation: ${evt.location || orgProfile?.university || 'Campus'}\nSponsorship Target: ₦${Number(evt.targetSponsorship || 0).toLocaleString()}\nOrganiser: ${orgProfile?.name || 'Association'}\nGenerated: ${new Date().toLocaleDateString('en-NG', { dateStyle: 'long' })}\n${'='.repeat(40)}\n`;
                                                        const blob = new Blob([report], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `Event-Report-${(evt.name || 'event').replace(/\s+/g, '-')}.txt`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="px-6 py-2.5 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all text-xs uppercase tracking-wider whitespace-nowrap flex items-center gap-2"
                                                >
                                                    <FileText className="w-4 h-4" /> Download Report
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                                <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Gig Spending & Results</h3>
                                {gigs.length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-sm font-medium">No gigs listed yet. <button onClick={() => setCurrentView('events')} className="text-spark-purple font-black">Hire creators via your events →</button></p>
                                ) : (
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {gigs.map((g: any) => {
                                            const allocations = gigAllocations[g.id] || [];
                                            const hired = allocations.length;
                                            const paidAmount = allocations
                                                .filter((a: any) => a.status === 'paid')
                                                .reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
                                            return (
                                                <div key={g.id} className="p-4 rounded-xl border border-[var(--border-color)] flex justify-between items-center hover:bg-[var(--bg-secondary)] transition-colors">
                                                    <div>
                                                        <h4 className="font-bold text-[var(--text-primary)] text-sm">{g.title}</h4>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                            {hired} hired · Budget: ₦{Number(g.reward || 0).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-green-600 font-black">₦{paidAmount.toLocaleString()}</p>
                                                        <span className="text-[9px] font-black uppercase bg-spark-purple/10 text-spark-purple px-2 py-0.5 rounded-full inline-block mt-1">{g.status || 'active'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }


            default:
                return <div>Coming Soon</div>;
            case 'ratings_reviews': {
                const fetchAssocPlatformReviews = async () => {
                    if (!orgProfile?.id && !user?.uid && !user?.id) return;
                    try {
                        const uid = orgProfile?.id || user?.uid || user?.id;
                        const q = query(collection(db, 'platformReviews'), where('userId', '==', uid));
                        const snap = await getDocs(q);
                        setMyPlatformReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                    } catch (err) {
                        console.warn('[AssociationDashboard] fetchPlatformReviews error:', err);
                    }
                };
                if (myPlatformReviews.length === 0) fetchAssocPlatformReviews();
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Ratings & Reviews</h2>
                            <p className="text-[var(--text-secondary)] mt-1">Share your experience and help improve ABC-Rally for everyone.</p>
                        </div>
                        {/* Platform Review Form */}
                        <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Review This Platform</h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Share your experience with ABC-Rally. Your feedback helps us grow.</p>
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!platformReviewText.trim()) return;
                                    setPlatformReviewSubmitting(true);
                                    try {
                                        const uid = orgProfile?.id || user?.uid || user?.id;
                                        const reviewDoc = {
                                            userId: uid,
                                            userName: orgProfile?.name || 'Association',
                                            userRole: 'Association',
                                            stars: platformRating,
                                            reviewText: platformReviewText.trim(),
                                            createdAt: new Date().toISOString(),
                                        };
                                        await addDoc(collection(db, 'platformReviews'), reviewDoc);
                                        setMyPlatformReviews(prev => [reviewDoc, ...prev]);
                                        setPlatformReviewText('');
                                        setPlatformRating(5);
                                        alert('Thank you for your review! 🎉');
                                    } catch (err: any) {
                                        alert('Failed to submit review: ' + err.message);
                                    } finally {
                                        setPlatformReviewSubmitting(false);
                                    }
                                }}
                                className="space-y-4"
                            >
                                <div>
                                    <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Your Rating</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setPlatformRating(star)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star className={`w-7 h-7 ${star <= platformRating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-color)]'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    required
                                    value={platformReviewText}
                                    onChange={e => setPlatformReviewText(e.target.value)}
                                    placeholder="Tell us what you love or what we can improve..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none resize-none"
                                />
                                <button
                                    type="submit"
                                    disabled={platformReviewSubmitting}
                                    className="px-8 py-3.5 bg-spark-red text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-red-700 disabled:opacity-50"
                                >
                                    {platformReviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                            {myPlatformReviews.length > 0 && (
                                <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
                                    <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Your Reviews</p>
                                    {myPlatformReviews.map((r, idx) => (
                                        <div key={idx} className="p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] space-y-1">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                                            </div>
                                            <p className="text-sm text-[var(--text-primary)] italic">"{r.reviewText}"</p>
                                            <p className="text-[10px] text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }
            case 'disputes':
                return (
                    <DisputesPanel
                        userRole="Association"
                        userId={user?.id || user?.uid}
                        userProfile={orgProfile}
                        onNavigate={onNavigate}
                        preSelectedEntity={preSelectedDisputeEntity}
                        onClearPreSelected={() => setPreSelectedDisputeEntity(null)}
                    />
                );
        }
    };

    return (
        <DashboardShell
            role={'Association'}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={orgProfile?.name || "Association Leader"}
            userSub={orgProfile?.university || "Campus Organizer"}
            userId={user?.id || user?.uid}
            userImage={orgProfile?.imageUrl}
            userProfile={orgProfile}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
        >
            {/* Wallet Summary Strip - Always visible for quick access */}
            {/* Wallet Summary Strip removed from landing page per user request */}
            {renderContent()}

            <EventListingTermsModal
                isOpen={showListingTermsModal}
                onAccept={() => {
                    setShowListingTermsModal(false);
                    setShowCreateModal(true);
                }}
                onDecline={() => setShowListingTermsModal(false)}
                accentColor="purple"
            />

            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="fixed inset-0 bg-spark-black/40 backdrop-blur-md" onClick={() => !submitting && setShowCreateModal(false)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                        <div className="p-10 border-b border-[var(--border-color)] flex justify-between items-center">
                            <h3 className="text-3xl font-black text-[var(--text-primary)]">List New Event</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-secondary)] hover:text-spark-purple transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                            <div className="p-4 bg-spark-purple/5 border border-spark-purple/20 rounded-2xl flex items-center gap-3 text-xs font-bold text-spark-purple">
                                <span>⚡ <strong>Reminder:</strong> 10% platform fee applies on raised funds. All payments & disputes handled in-platform.</span>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Name *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                    placeholder="e.g. Annual Tech Hackathon 2024"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Date *</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Target (₦) *</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                        placeholder="e.g. 500000"
                                        value={formData.targetSponsorship}
                                        onChange={(e) => setFormData({ ...formData, targetSponsorship: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Expected Attendees</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                        placeholder="e.g. 500"
                                        value={formData.expectedAttendees}
                                        onChange={(e) => setFormData({ ...formData, expectedAttendees: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Slots</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                        placeholder="e.g. 3"
                                        value={formData.sponsorshipSlots}
                                        onChange={(e) => setFormData({ ...formData, sponsorshipSlots: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Location *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold"
                                    placeholder="e.g. Main Auditorium"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Event Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold resize-none"
                                    placeholder="Describe your event and what sponsors get in return..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Sponsorship Packages</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormPackages(prev => [...prev, { name: '', price: '', entails: '' }])}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-spark-purple/10 text-spark-purple rounded-xl font-bold text-xs hover:bg-spark-purple/20 transition-all"
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
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-purple/20"
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
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-purple/20"
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
                                                    className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-0 rounded-xl outline-none font-bold text-[var(--text-primary)] focus:ring-2 focus:ring-spark-purple/20"
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
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border-0 rounded-2xl focus:ring-4 focus:ring-spark-purple/10 outline-none font-bold resize-none"
                                    placeholder="e.g. Branded booth, social media takeover, banner placements..."
                                    value={formData.activationNeeds}
                                    onChange={(e) => setFormData({ ...formData, activationNeeds: e.target.value })}
                                ></textarea>
                            </div>

                            {/* ── Volunteer Recruitment Section ── */}
                            <div className="rounded-2xl border border-[var(--border-color)] overflow-hidden text-left">
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
                                                className="w-4 h-4 text-spark-purple accent-spark-purple"
                                                checked={formData.needVolunteers === 'no'}
                                                onChange={() => setFormData(prev => ({ ...prev, needVolunteers: 'no' }))}
                                            />
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">No</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="needVolunteers"
                                                className="w-4 h-4 text-spark-purple accent-spark-purple"
                                                checked={formData.needVolunteers === 'yes'}
                                                onChange={() => setFormData(prev => ({ ...prev, needVolunteers: 'yes' }))}
                                            />
                                            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">Yes</span>
                                        </label>
                                    </div>
                                </div>

                                {formData.needVolunteers === 'yes' && (
                                    <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)] space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                                            <div>
                                                <p className="font-bold text-[var(--text-primary)] text-sm">Volunteer Reward Type</p>
                                                <p className="text-xs text-[var(--text-secondary)]">Choose between unpaid experience or paid roles</p>
                                            </div>
                                            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, volunteerType: 'unpaid' }))}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                        formData.volunteerType === 'unpaid'
                                                            ? 'bg-spark-purple text-white shadow-sm'
                                                            : 'text-[var(--text-secondary)] hover:text-spark-purple'
                                                    }`}
                                                >
                                                    Unpaid (Exp)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, volunteerType: 'paid' }))}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                                        formData.volunteerType === 'paid'
                                                            ? 'bg-spark-purple text-white shadow-sm'
                                                            : 'text-[var(--text-secondary)] hover:text-spark-purple'
                                                    }`}
                                                >
                                                    Paid Gig
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Campaign / Gig Title *</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-3.5 bg-[var(--bg-secondary)] border-0 rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-spark-purple/10 text-[var(--text-primary)]"
                                                    placeholder="e.g. Event Ushers & Social Media Promoters"
                                                    value={formData.campaignTitle}
                                                    onChange={e => setFormData(prev => ({ ...prev, campaignTitle: e.target.value }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Deliverables / Brief Guidelines *</label>
                                                <textarea
                                                    rows={3}
                                                    className="w-full px-5 py-3.5 bg-[var(--bg-secondary)] border-0 rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-spark-purple/10 resize-none text-[var(--text-primary)]"
                                                    placeholder="List down details of what volunteers/creators will do..."
                                                    value={formData.campaignBrief}
                                                    onChange={e => setFormData(prev => ({ ...prev, campaignBrief: e.target.value }))}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Application Deadline *</label>
                                                    <input
                                                        type="date"
                                                        className="w-full px-5 py-3.5 bg-[var(--bg-secondary)] border-0 rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-spark-purple/10 text-[var(--text-primary)]"
                                                        value={formData.campaignDeadline}
                                                        onChange={e => setFormData(prev => ({ ...prev, campaignDeadline: e.target.value }))}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Total Reward Budget (₦)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={formData.volunteerType === 'unpaid'}
                                                        placeholder={formData.volunteerType === 'unpaid' ? '0 (Experience/Perks)' : 'e.g. 50000'}
                                                        className="w-full px-5 py-3.5 bg-[var(--bg-secondary)] border-0 rounded-2xl outline-none font-bold text-xs focus:ring-4 focus:ring-spark-purple/10 disabled:opacity-50 text-[var(--text-primary)]"
                                                        value={formData.volunteerType === 'unpaid' ? '' : formData.campaignBudget}
                                                        onChange={e => setFormData(prev => ({ ...prev, campaignBudget: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                    className="flex-[2] py-5 bg-spark-purple text-white font-black rounded-2xl text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3 disabled:opacity-50"
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
            <ProposalFormModal 
                isOpen={showProposalModal} 
                onClose={() => setShowProposalModal(false)}
                recipientName={proposalRecipient?.name || ''}
                recipientId={proposalRecipient?.id || ''}
                onSubmit={handleSendProposal}
            />

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
                userRole="Org"
            />

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                            <form onSubmit={handleSaveEdit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Name *</label>
                                    <input type="text" required value={editFormData.name} onChange={e => setEditFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Date *</label>
                                    <input type="date" required value={editFormData.date} onChange={e => setEditFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Location *</label>
                                    <input type="text" required value={editFormData.location} onChange={e => setEditFormData(p => ({ ...p, location: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description *</label>
                                    <textarea required rows={3} value={editFormData.description} onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Target Sponsorship (₦) *</label>
                                    <input type="number" required min="0" value={editFormData.targetSponsorship} onChange={e => setEditFormData(p => ({ ...p, targetSponsorship: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Expected Attendees</label>
                                        <input type="number" min="1" value={editFormData.expectedAttendees} onChange={e => setEditFormData(p => ({ ...p, expectedAttendees: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Sponsorship Slots</label>
                                        <input type="number" min="1" value={editFormData.sponsorshipSlots} onChange={e => setEditFormData(p => ({ ...p, sponsorshipSlots: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Sponsorship Packages</label>
                                        <button
                                            type="button"
                                            onClick={() => setEditFormPackages(prev => [...prev, { name: '', price: '', entails: '' }])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-spark-purple/10 text-spark-purple rounded-xl font-bold text-xs hover:bg-spark-purple/20 transition-all"
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
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-xl outline-none font-bold text-[var(--text-primary)]"
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
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-xl outline-none font-bold text-[var(--text-primary)]"
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
                                                        className="px-4 py-2 text-sm bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-xl outline-none font-bold text-[var(--text-primary)]"
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
                                    <textarea rows={2} value={editFormData.activationNeeds} onChange={e => setEditFormData(p => ({ ...p, activationNeeds: e.target.value }))} className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" placeholder="e.g. Branded booth, social media push..." />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={editSubmitting} className="flex-[2] py-4 bg-spark-purple text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3 disabled:opacity-50">
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
            {/* Create/Edit Gig Modal */}
            {showGigModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => setShowGigModal(false)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight">Create Gig</h2>
                                    <p className="text-[var(--text-secondary)] font-medium mt-1">Formalize opportunities for creators.</p>
                                </div>
                                <button onClick={() => setShowGigModal(false)} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Gig Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setGigFormData(p => ({ ...p, type: 'volunteer', reward: '0' }))}
                                            className={`py-4 rounded-2xl font-black transition-all border-2 ${gigFormData.type === 'volunteer' ? 'border-spark-purple bg-purple-50 text-spark-purple' : 'border-transparent bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                                        >
                                            Volunteerism
                                        </button>
                                        <button 
                                            onClick={() => setGigFormData(p => ({ ...p, type: 'paid' }))}
                                            className={`py-4 rounded-2xl font-black transition-all border-2 ${gigFormData.type === 'paid' ? 'border-spark-purple bg-purple-50 text-spark-purple' : 'border-transparent bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                                        >
                                            Paid Gig
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Graphic Designer for Event" 
                                        value={gigFormData.title}
                                        onChange={e => setGigFormData(p => ({ ...p, title: e.target.value }))}
                                        className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Location</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. University of Lagos (UNILAG) or Remote" 
                                        value={gigFormData.location}
                                        onChange={e => setGigFormData(p => ({ ...p, location: e.target.value }))}
                                        className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description / Brief</label>
                                    <textarea 
                                        rows={4} 
                                        placeholder="What do you need the creator to do?"
                                        value={gigFormData.description}
                                        onChange={e => setGigFormData(p => ({ ...p, description: e.target.value }))}
                                        className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all resize-none" 
                                    />
                                </div>

                                {gigFormData.type === 'paid' && (
                                    <div>
                                        <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Gig Reward (₦)</label>
                                        <input 
                                            type="number" 
                                            value={gigFormData.reward}
                                            onChange={e => setGigFormData(p => ({ ...p, reward: e.target.value }))}
                                            className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all" 
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={handleCreateGig}
                                    disabled={gigSubmitting}
                                    className="w-full py-5 bg-spark-purple text-white font-black rounded-[2rem] hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {gigSubmitting ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    ) : (
                                        'Launch Gig'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-[2.5rem] border border-[var(--border-color)] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Withdraw Funds</h3>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-[var(--text-secondary)] hover:text-spark-purple transition-colors">
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
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-purple font-bold text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <div className="grid gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Bank Name"
                                    value={bankDetails.bank}
                                    onChange={(e) => setBankDetails({...bankDetails, bank: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-purple font-bold text-[var(--text-primary)]"
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Number"
                                    value={bankDetails.account}
                                    onChange={(e) => setBankDetails({...bankDetails, account: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-purple font-bold text-[var(--text-primary)]"
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Account Name"
                                    value={bankDetails.name}
                                    onChange={(e) => setBankDetails({...bankDetails, name: e.target.value})}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-purple font-bold text-[var(--text-primary)]"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                disabled={withdrawing || !withdrawalAmount}
                                className="w-full py-4 bg-spark-purple text-white font-black rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
                            >
                                {withdrawing ? 'Processing Request...' : 'Confirm Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Gig Modal */}
            {showAssignModal && selectedCreatorForAssign && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => setShowAssignModal(false)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-spark-purple uppercase tracking-widest mb-1">Assign Opportunity</p>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight">Hiring {selectedCreatorForAssign.name}</h2>
                                </div>
                                <button onClick={() => setShowAssignModal(false)} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Select Active Gig</label>
                                    {gigs.filter(g => g.status === 'open').length === 0 ? (
                                        <div className="p-6 text-center bg-[var(--bg-secondary)] rounded-2xl border-2 border-dashed border-[var(--border-color)]">
                                            <p className="text-sm font-bold text-[var(--text-secondary)] mb-4">No active gigs available.</p>
                                            <button 
                                                onClick={() => {
                                                    setShowAssignModal(false);
                                                    setShowGigModal(true);
                                                }}
                                                className="text-spark-purple font-black text-xs uppercase tracking-widest"
                                            >
                                                + Create a gig first
                                            </button>
                                        </div>
                                    ) : (
                                        <select 
                                            value={assigningGigId}
                                            onChange={e => setAssigningGigId(e.target.value)}
                                            className="w-full px-5 py-4 bg-[var(--bg-secondary)] border-2 border-transparent focus:border-spark-purple rounded-2xl font-bold text-[var(--text-primary)] outline-none transition-all"
                                        >
                                            <option value="">Choose a gig...</option>
                                            {gigs.filter(g => g.status === 'open').map(g => (
                                                <option key={g.id} value={g.id}>{g.title} ({Number(g.reward) === 0 ? 'Volunteer' : `₦${Number(g.reward).toLocaleString()}`})</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <button 
                                    onClick={handleAssignGig}
                                    disabled={!assigningGigId}
                                    className="w-full py-4 bg-spark-purple text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50"
                                >
                                    Confirm Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gig Management Modal */}
            {selectedGig && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
                    <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md" onClick={() => setSelectedGig(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] leading-tight">{selectedGig.title}</h2>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${Number(selectedGig.reward) === 0 ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                            {Number(selectedGig.reward) === 0 ? 'Volunteerism' : 'Paid Gig'}
                                        </span>
                                        <span className="px-2.5 py-1 bg-[var(--bg-secondary)] rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedGig.status}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedGig(null)} className="w-10 h-10 bg-spark-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all">
                                    <Plus className="w-5 h-5 rotate-45" />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Gig Description</h4>
                                    <p className="text-[var(--text-primary)] leading-relaxed">{selectedGig.description}</p>
                                </div>

                                {Number(selectedGig.reward) > 0 && (
                                    <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Total Budget</p>
                                            <p className="text-2xl font-black text-green-700">₦{Number(selectedGig.reward).toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                                            <Wallet className="w-6 h-6" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">Assigned Creators</h4>
                                        <span className="px-3 py-1 bg-spark-purple text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                            {gigAllocations[selectedGig.id]?.length || 0} Hired
                                        </span>
                                    </div>

                                    {(gigAllocations[selectedGig.id] || []).length === 0 ? (
                                        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-[2rem] border-2 border-dashed border-[var(--border-color)]">
                                            <p className="text-[var(--text-secondary)] font-medium">No creators assigned yet.</p>
                                            <button 
                                                onClick={() => {
                                                    setSelectedGig(null);
                                                    setCurrentView('creators');
                                                }}
                                                className="mt-4 text-spark-purple font-black text-sm hover:underline"
                                            >
                                                Find talent to assign
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {(gigAllocations[selectedGig.id] || []).map((alloc: any) => (
                                                <div key={alloc.id} className="flex items-center justify-between p-5 bg-[var(--bg-secondary)] rounded-[1.5rem] border border-[var(--border-color)] hover:border-spark-purple transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center text-xl font-black text-spark-purple shadow-sm group-hover:scale-110 transition-transform">
                                                            {alloc.studentName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[var(--text-primary)]">{alloc.studentName}</p>
                                                            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{alloc.studentEmail}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest ${
                                                            alloc.status === 'paid' ? 'bg-green-100 text-green-600' : 
                                                            alloc.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                                                            alloc.status === 'revision' ? 'bg-yellow-100 text-yellow-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {alloc.status}
                                                        </span>
                                                        
                                                        {alloc.status === 'submitted' && (
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleReleasePayment(alloc)}
                                                                    disabled={submitting}
                                                                    className="px-3 py-1.5 bg-spark-black text-white rounded-lg text-[10px] font-black uppercase hover:bg-gray-800 transition-colors"
                                                                >
                                                                    Accept Report
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRejectReport(alloc)}
                                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-purple-700 transition-colors"
                                                                >
                                                                    Reject Report
                                                                </button>
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Details Modal */}
            {selectedBrand && (
                <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-primary)] w-full max-w-2xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 my-auto">
                        <button
                            onClick={() => setSelectedBrand(null)}
                            className="absolute top-8 right-8 w-12 h-12 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center hover:bg-spark-purple hover:text-white transition-all z-10"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <div className="h-48 bg-spark-red relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-[var(--bg-primary)] p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-purple">
                                    {selectedBrand.imageUrl ? <img src={selectedBrand.imageUrl} alt={selectedBrand.name || 'Brand Logo'} className="w-full h-full object-cover rounded-2xl" /> : (selectedBrand.name || '?').charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-[var(--text-primary)] mb-1">{selectedBrand.name}</h3>
                                    <p className="text-spark-purple font-black uppercase tracking-widest text-sm">{selectedBrand.role}</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-10">
                                <div className="p-6 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)]">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 opacity-60">About this Brand</p>
                                    <p className="text-[var(--text-primary)] font-bold text-lg">{selectedBrand.bio || `${selectedBrand.name} is a leading partner in the ${selectedBrand.industry || 'ABC-Rally'} ecosystem.`}</p>
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
                                            <a href={selectedBrand.website} target="_blank" rel="noopener noreferrer" className="font-bold text-spark-purple text-sm hover:underline">{selectedBrand.website}</a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenProposalModal(selectedBrand)}
                                disabled={proposing}
                                className="w-full py-6 bg-spark-black text-white font-black text-xl rounded-2xl hover:bg-spark-purple transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-3"
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
            <CreatorProfileModal
                isOpen={showCreatorProfile}
                onClose={() => { setShowCreatorProfile(false); setSelectedCreatorProfile(null); }}
                creator={selectedCreatorProfile}
            />
        </DashboardShell>
    );
};

export default AssociationDashboard;
