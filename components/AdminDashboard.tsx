import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy, updateDoc, deleteDoc, setDoc, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { WalletService, REVENUE_WALLET_ID } from '../WalletService';
import { globalBrandingSettings, BACKEND_URL } from '../constants';
import { 
    BarChart3, Users, Megaphone, Building2, Shield, Wallet, 
    Search, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
    XCircle, ArrowRight, Calendar, Activity, Database, Trash2, Edit,
    Eye, Ban, CheckCircle, Info, ExternalLink, MapPin, TrendingUp, FileText, Plus, Settings, MessageSquare, Scale, HelpCircle,
    Download, Mail, Send, Loader2, Handshake, Award
} from 'lucide-react';
import { DisputesPanel } from './DisputesPanel';
import { notifyWithdrawalCompleted, notifyGeneric, notifyProfileApproved, notifyProfileNeedsUpdate } from '../emailNotifier';
import * as LucideIcons from 'lucide-react';

const isTransactionActive = (trans: any, myCampaigns: any[]) => {
    if (trans.status !== 'escrow') return true;

    if (trans.campaignId) {
        const match = myCampaigns.find(c => c.campaignId === trans.campaignId || c.id === trans.campaignId);
        if (!match || match.status === 'rejected') {
            return false;
        }
        return true;
    }

    const desc = (trans.description || '').toLowerCase();
    const isLockedPayment = desc.includes('locked');
    if (isLockedPayment) {
        const match = myCampaigns.find(c => {
            const title = (c.campaign?.title || c.campaignTitle || '').toLowerCase();
            return title && desc.includes(title);
        });
        if (match && match.status === 'rejected') {
            return false;
        }
        const hasCampaignMatch = myCampaigns.some(c => {
            const title = (c.campaign?.title || c.campaignTitle || '').toLowerCase();
            return title && desc.includes(title);
        });
        if (!hasCampaignMatch && myCampaigns.length > 0) {
            return false;
        }
    }
};

const parseEventPackages = (packagesField: any): { name: string; price: number; entails?: string }[] => {
    if (!packagesField) return [{ name: 'Custom Sponsorship', price: 0 }];
    if (Array.isArray(packagesField)) {
        return packagesField.map(p => ({
            name: p.name || 'Sponsorship Package',
            price: Number(p.price || 0),
            entails: p.entails || ''
        }));
    }
    if (typeof packagesField === 'string') {
        try {
            const parsed = JSON.parse(packagesField);
            if (Array.isArray(parsed)) {
                return parsed.map(p => ({
                    name: p.name || 'Sponsorship Package',
                    price: Number(p.price || 0),
                    entails: p.entails || ''
                }));
            }
        } catch (e) {
            return packagesField.split('\n').filter(Boolean).map(pkg => ({ name: pkg, price: 0 }));
        }
    }
    return [{ name: 'Custom Sponsorship', price: 0 }];
};

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
    listingFeesTotal?: number;
    creatorCommissionsTotal?: number;
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
    themeMode: 'light' | 'dark' | 'auto',
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, themeMode, user }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [partnerships, setPartnerships] = useState<any[]>([]);
    const [allGigs, setAllGigs] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [allTransactions, setAllTransactions] = useState<any[]>([]);
    
    
    // Past Events State
    const [allPastEvents, setAllPastEvents] = useState<any[]>([]);
    const [showPastEventModal, setShowPastEventModal] = useState(false);
    const [pastEventFormData, setPastEventFormData] = useState({ id: '', title: '', description: '', date: '', location: '', imageUrl: '' });
    const [pastEventUploading, setPastEventUploading] = useState(false);
    const [pastEventUploadProgress, setPastEventUploadProgress] = useState(0);
    const [eventsSubTab, setEventsSubTab] = useState<'active' | 'past'>('active');

    // Testimonials State
    const [allTestimonials, setAllTestimonials] = useState<any[]>([]);
    const [showTestimonialModal, setShowTestimonialModal] = useState(false);
    const [testimonialFormData, setTestimonialFormData] = useState({ id: '', quote: '', name: '', title: '' });

    // Blog State
    const [allBlogs, setAllBlogs] = useState<any[]>([]);
    const [showBlogModal, setShowBlogModal] = useState(false);
    const [blogFormData, setBlogFormData] = useState({ title: '', excerpt: '', content: '', imageUrl: '', status: 'draft', id: '' });

    // Core UI State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentView, setCurrentView] = useState('overview');
    const [preSelectedDisputeEntity, setPreSelectedDisputeEntity] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [userDetailData, setUserDetailData] = useState<{gigs: any[], events: any[], transactions: any[], allocations: any[]}>({gigs: [], events: [], transactions: [], allocations: []});
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

    // Section 9 — Creator Review State
    const [reviewCreators, setReviewCreators] = useState<any[]>([]);
    const [selectedReviewCreator, setSelectedReviewCreator] = useState<any>(null);
    const [adminNoteInput, setAdminNoteInput] = useState('');
    const [reviewActionLoading, setReviewActionLoading] = useState(false);
    const [reviewSearchTerm, setReviewSearchTerm] = useState('');
    const [reviewStatusFilter, setReviewStatusFilter] = useState<'queue' | 'approved' | 'needs_update' | 'all'>('queue');

    // Section 10 — Migration Audit State
    const [showMigrationPanel, setShowMigrationPanel] = useState(false);
    const [migrationRunning, setMigrationRunning] = useState(false);
    const [migrationResult, setMigrationResult] = useState<{ audited: number; markedIncomplete: number; skipped: number } | null>(null);

    // Section 11 — Acceptance Checklist State (stored in localStorage)
    const [showAcceptancePanel, setShowAcceptancePanel] = useState(false);
    const ACCEPTANCE_TESTS = [
        { id: 'content_writer', scenario: 'Content Writer', steps: 'Register → Create → Content Writer → complete profile → submit', expected: 'Admin can review; approved profile shows writing service, sample, price and availability' },
        { id: 'social_media_mgr', scenario: 'Social Media Manager', steps: 'Register → Manage → Social Media Manager + Community Manager', expected: 'Profile appears as digital management professional, not only a content creator' },
        { id: 'whatsapp_tv', scenario: 'WhatsApp Status TV', steps: 'Register → Distribute → WhatsApp Status TV → enter views, campus, rate, evidence', expected: 'Media fields save; admin can review evidence; public profile shows audience inventory' },
        { id: 'campus_mobiliser', scenario: 'Campus Mobiliser', steps: 'Register → Activate → enter campus/community access + physical work preference', expected: 'Profile shows execution reach and activation service' },
        { id: 'multi_skilled', scenario: 'Multi-skilled Creator', steps: 'Select Create + Manage and multiple services', expected: 'One primary capability displayed; additional capabilities remain visible' },
        { id: 'existing_creator', scenario: 'Existing Creator', steps: 'Log in to old account after deployment', expected: 'Existing data remains; user prompted only for new missing information' },
        { id: 'unavailable_creator', scenario: 'Unavailable Creator', steps: 'Approved creator changes availability to Not Available', expected: 'Approval remains; profile leaves default hire-ready directory' },
    ];
    const [acceptanceChecks, setAcceptanceChecks] = useState<Record<string, boolean>>(() => {
        try { return JSON.parse(localStorage.getItem('abc_acceptance_checks') || '{}'); } catch { return {}; }
    });
    const toggleAcceptanceCheck = (id: string) => {
        setAcceptanceChecks(prev => {
            const next = { ...prev, [id]: !prev[id] };
            localStorage.setItem('abc_acceptance_checks', JSON.stringify(next));
            return next;
        });
    };

    // Email Blast State
    const [showEmailBlast, setShowEmailBlast] = useState(false);
    const [emailBlastForm, setEmailBlastForm] = useState({ subject: '', title: '', body: '', role: 'all' });
    const [emailBlastLoading, setEmailBlastLoading] = useState(false);
    const [emailBlastResult, setEmailBlastResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
    const [blastBodyHtml, setBlastBodyHtml] = useState('');
    const [blastAttachments, setBlastAttachments] = useState<{ name: string; url: string; type: string }[]>([]);
    const [blastAttachUploading, setBlastAttachUploading] = useState(false);
    const blastEditorRef = React.useRef<HTMLDivElement>(null);
    const [csvDownloading, setCsvDownloading] = useState<string | null>(null);

    // Branding settings state
    const [brandingForm, setBrandingForm] = useState({
        title: '',
        abbrev: '',
        favicon: '',
        logoType: 'icon',
        logoValue: '',
        landingImage: ''
    });
    const [savingBranding, setSavingBranding] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [faviconUploading, setFaviconUploading] = useState(false);
    const [landingImageUploading, setLandingImageUploading] = useState(false);
    const [logoUploadProgress, setLogoUploadProgress] = useState(0);
    const [faviconUploadProgress, setFaviconUploadProgress] = useState(0);
    const [landingImageUploadProgress, setLandingImageUploadProgress] = useState(0);

    // Support Tickets State
    const [supportTickets, setSupportTickets] = useState<any[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [replyBody, setReplyBody] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);

    // Platform Reviews State
    const [platformReviews, setPlatformReviews] = useState<any[]>([]);

    // External Brand Sponsorship State
    const [showExternalSponsorModal, setShowExternalSponsorModal] = useState(false);
    const [externalSponsorForm, setExternalSponsorForm] = useState({
        brandName: '',
        eventId: '',
        packageName: '',
        customAmount: '',
        notes: ''
    });
    const [externalSponsorSubmitting, setExternalSponsorSubmitting] = useState(false);
    const [externalSponsorSuccess, setExternalSponsorSuccess] = useState<string | null>(null);

    // Full Event Detail Modal State for Admin
    const [selectedAdminEvent, setSelectedAdminEvent] = useState<any>(null);

    const handleImageUpload = (
        file: File,
        folder: 'logos' | 'favicons' | 'landing_images' | 'past_events',
        onProgress: (p: number) => void,
        onComplete: (url: string) => void,
        setUploading: (v: boolean) => void
    ) => {
        if (!file) return;
        setUploading(true);
        const storageRef = ref(storage, `site_branding/${folder}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed',
            (snapshot) => {
                onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
            },
            (err) => {
                console.error('Upload error:', err);
                alert('Upload failed: ' + err.message);
                setUploading(false);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                onComplete(url);
                setUploading(false);
            }
        );
    };

    const handleCloudinaryUpload = async (
        file: File,
        onProgress: (p: number) => void,
        onComplete: (url: string) => void,
        setUploading: (v: boolean) => void
    ) => {
        if (!file) return;
        setUploading(true);
        onProgress(10);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'abc-rally');

            onProgress(35);
            const response = await fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                method: 'POST',
                body: formData
            });
            onProgress(85);
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error?.message || 'Cloudinary upload failed');
            }
            const data = await response.json();
            onProgress(100);
            onComplete(data.secure_url);
        } catch (err: any) {
            console.error('Cloudinary upload error:', err);
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
        
        if (currentView === 'branding') {
            setBrandingForm({
                title: globalBrandingSettings.title,
                abbrev: globalBrandingSettings.abbrev,
                favicon: globalBrandingSettings.favicon,
                logoType: globalBrandingSettings.logoType,
                logoValue: globalBrandingSettings.logoValue,
                landingImage: globalBrandingSettings.landingImage || ''
            });
        }
        
        // Always fetch transactions for overview "Recent Activity" if needed
        if (currentView === 'overview') {
            apiClient.get('transactions').then(res => {
                setAllTransactions(res.data.sort((a: any, b: any) => 
                    new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime() - 
                    new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime()
                ));
            });
        }
    }, [currentView]);

    const fetchAdminData = async () => {
        setLoading(true);
        setError('');

        // --- Stats + wallet (non-fatal: log but don't block tab data) ---
        try {
            const res = await apiClient.get('admin/stats');
            setRecentUsers(res.data.recentUsers);

            try {
                const [revenueWallet, walletsSnap, allocSnap, eventsSnap] = await Promise.all([
                    WalletService.getOrCreateWallet(REVENUE_WALLET_ID),
                    getDocs(collection(db, 'wallets')),
                    getDocs(collection(db, 'campaignAllocations')),
                    getDocs(collection(db, 'events'))
                ]);
                const totalEscrowSum = walletsSnap.docs.reduce((acc, d) => acc + (d.data().escrow || 0), 0);

                // 10% Commission calculated on creator earnings from each completed/paid gig
                const completedAllocations = allocSnap.docs.filter(d => ['approved', 'paid'].includes(d.data().status));
                const creatorCommissionsTotal = completedAllocations.reduce((acc, d) => acc + ((d.data().amount || 0) * 0.10), 0);

                // Listing fees (₦20,000 per event listing)
                const listingFeesTotal = eventsSnap.docs.length * 20000;

                const combinedPlatformRevenue = Math.max(revenueWallet.balance || 0, listingFeesTotal + creatorCommissionsTotal);

                setStats({
                    ...res.data.stats,
                    totalEscrow: totalEscrowSum,
                    platformRevenue: combinedPlatformRevenue,
                    listingFeesTotal,
                    creatorCommissionsTotal
                });
            } catch (walletErr) {
                console.warn('Wallet fetch failed, using stats without wallet data:', walletErr);
                setStats(res.data.stats);
            }
        } catch (statsErr: any) {
            console.warn('Admin stats fetch failed:', statsErr);
        }

        // --- Tab-specific data (each independent, shows error only if THIS fails) ---
        try {
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
                const [eventsRes, eventsSnap] = await Promise.all([
                    apiClient.get('events'),
                    getDocs(collection(db, 'past_events'))
                ]);
                setAllEvents(eventsRes.data);
                const pastEventsData = eventsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                pastEventsData.sort((a: any, b: any) =>
                    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                );
                setAllPastEvents(pastEventsData);
            } else if (currentView === 'transactions' || currentView === 'withdrawals') {
                const transRes = await apiClient.get('transactions');
                setAllTransactions(transRes.data.sort((a: any, b: any) =>
                    new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime() -
                    new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime()
                ));
            } else if (currentView === 'blogs') {
                const snap = await getDocs(collection(db, 'blogs'));
                const blogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                blogs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setAllBlogs(blogs);
            } else if (currentView === 'testimonials') {
                const snap = await getDocs(collection(db, 'testimonials'));
                const items = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
                items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setAllTestimonials(items);
            } else if (currentView === 'support') {
                const snap = await getDocs(collection(db, 'support_tickets'));
                const tickets = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                tickets.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setSupportTickets(tickets);
            } else if (currentView === 'platform_reviews') {
                const snap = await getDocs(collection(db, 'platformReviews'));
                const reviews = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                reviews.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                setPlatformReviews(reviews);
            } else if (currentView === 'creator_review') {
                // Fetch all Creator-role users for manual quality review
                const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'Creator')));
                const creators = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
                creators.sort((a: any, b: any) => {
                    // Prioritise 'ready_for_review' first
                    const order: Record<string, number> = { ready_for_review: 0, needs_update: 1, approved: 2 };
                    const ao = order[a.reviewStatus] ?? 3;
                    const bo = order[b.reviewStatus] ?? 3;
                    if (ao !== bo) return ao - bo;
                    return new Date(b.profileSubmittedAt || b.createdAt || 0).getTime() - new Date(a.profileSubmittedAt || a.createdAt || 0).getTime();
                });
                setReviewCreators(creators);
            }
        } catch (tabErr: any) {
            console.error(`Admin tab fetch error [${currentView}]:`, tabErr);
            setError(tabErr.response?.data?.error || `Failed to load ${currentView} data. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleViewUserDetail = async (targetUser: any) => {
        setSelectedUserDetail(targetUser);
        setDetailLoading(true);
        try {
            // Fetch all user-related activity
            const [gigs, events, transactions, allocationsSnap] = await Promise.all([
                apiClient.get(`gigs?brandId=${targetUser.id}`),
                apiClient.get(`events?hostId=${targetUser.id}`),
                apiClient.get(`transactions?userId=${targetUser.id}`),
                getDocs(query(collection(db, 'campaignAllocations'), where('creatorId', '==', targetUser.id)))
            ]);
            const rawAllocations = (allocationsSnap.docs || []).map(d => ({ id: d.id, ...d.data() as any }));
            const allocations = await Promise.all(rawAllocations.map(async (c) => {
                const gigDoc = await getDoc(doc(db, 'gigs', c.campaignId));
                return { ...c, campaign: gigDoc.exists() ? gigDoc.data() : null };
            }));
            setUserDetailData({
                gigs: gigs.data || [],
                events: events.data || [],
                transactions: transactions.data || [],
                allocations: allocations
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

    const handleFundEventOffPlatform = async (e: React.FormEvent) => {
        e.preventDefault();
        const { brandName, eventId, packageName, customAmount, notes } = externalSponsorForm;

        if (!brandName.trim()) { alert('Brand Name is required.'); return; }
        if (!eventId) { alert('Please select an event.'); return; }
        const amount = Number(customAmount);
        if (!amount || amount <= 0) { alert('Please enter a valid amount greater than 0.'); return; }

        setExternalSponsorSubmitting(true);
        setExternalSponsorSuccess(null);
        try {
            const selectedEvent = allEvents.find(ev => ev.id === eventId);
            if (!selectedEvent) throw new Error('Event not found.');

            const hostId = selectedEvent.hostId || selectedEvent.userId || '';
            const eventTitle = selectedEvent.title || selectedEvent.name || 'Unnamed Event';
            const pkgLabel = packageName || 'Sponsorship Package';
            const now = new Date().toISOString();

            // 1. Credit the event host's wallet via a transaction record
            await addDoc(collection(db, 'transactions'), {
                userId: hostId,
                type: 'credit',
                amount,
                status: 'completed',
                description: `Event Sponsorship received for "${eventTitle}" (${pkgLabel}) from ${brandName} [Off-Platform Brand]`,
                createdAt: now,
                eventId,
                source: 'admin_external_sponsorship',
            });

            // 2. Create a partnership/proposal record
            await addDoc(collection(db, 'partnerships'), {
                eventId,
                eventTitle,
                senderName: brandName,
                senderId: 'external_brand',
                recipientId: hostId,
                recipientName: selectedEvent.hostName || selectedEvent.organization || '',
                package: pkgLabel,
                amount,
                notes: notes.trim(),
                status: 'paid',
                source: 'admin_funded',
                createdAt: now,
            });

            // 3. Increment raisedSponsorship on the event document & append to sponsors array
            try {
                const eventRef = doc(db, 'events', eventId);
                const eventSnap = await getDoc(eventRef);
                if (eventSnap.exists()) {
                    const evData = eventSnap.data() as any;
                    const prev = Number(evData.raisedSponsorship || 0);
                    await updateDoc(eventRef, {
                        raisedSponsorship: prev + amount,
                        sponsors: arrayUnion({
                            name: brandName,
                            package: pkgLabel,
                            amount,
                            isExternal: true,
                            fundedAt: now,
                            notes: notes.trim() || '',
                        }),
                    });
                }
            } catch (evErr) {
                console.warn('Could not update raisedSponsorship on event doc:', evErr);
            }

            // 4. Send in-app notification to the event planner
            if (hostId) {
                await addDoc(collection(db, 'notifications'), {
                    userId: hostId,
                    type: 'sponsorship',
                    title: '🎉 Sponsorship Received!',
                    message: `Your event "${eventTitle}" received a ₦${amount.toLocaleString()} sponsorship from ${brandName} for the "${pkgLabel}" package.`,
                    read: false,
                    createdAt: now,
                    eventId,
                });
            }

            setExternalSponsorSuccess(`₦${amount.toLocaleString()} sponsorship from ${brandName} has been credited to the event planner's wallet.`);
            setExternalSponsorForm({ brandName: '', eventId: '', packageName: '', customAmount: '', notes: '' });
        } catch (err: any) {
            alert('Failed to process sponsorship: ' + (err.message || 'Unknown error'));
        } finally {
            setExternalSponsorSubmitting(false);
        }
    };

    // Section 9 — Review Action Handlers
    const handleApproveCreator = async (creatorId: string) => {
        setReviewActionLoading(true);
        try {
            const targetCreator = reviewCreators.find(c => c.id === creatorId);
            await updateDoc(doc(db, 'users', creatorId), {
                reviewStatus: 'approved',
                profileSubmittedForReview: false,
                adminNote: '',
                approvedAt: new Date().toISOString(),
            });
            if (targetCreator?.email) {
                notifyProfileApproved(targetCreator.email, targetCreator.name || 'Creator');
            }
            setReviewCreators(prev => prev.map(c => c.id === creatorId
                ? { ...c, reviewStatus: 'approved', profileSubmittedForReview: false, adminNote: '' }
                : c));
            setSelectedReviewCreator((prev: any) => prev?.id === creatorId
                ? { ...prev, reviewStatus: 'approved', profileSubmittedForReview: false, adminNote: '' }
                : prev);
            setAdminNoteInput('');
            alert('✓ Profile approved! Creator will appear in the hiring directory.');
        } catch (err: any) {
            alert('Failed to approve: ' + err.message);
        } finally {
            setReviewActionLoading(false);
        }
    };

    const handleNeedsUpdateCreator = async (creatorId: string) => {
        if (!adminNoteInput.trim()) {
            alert('Please enter an admin note explaining what the creator needs to fix.');
            return;
        }
        setReviewActionLoading(true);
        try {
            const targetCreator = reviewCreators.find(c => c.id === creatorId);
            const noteText = adminNoteInput.trim();
            await updateDoc(doc(db, 'users', creatorId), {
                reviewStatus: 'needs_update',
                profileSubmittedForReview: false,
                adminNote: noteText,
            });
            if (targetCreator?.email) {
                notifyProfileNeedsUpdate(targetCreator.email, targetCreator.name || 'Creator', noteText);
            }
            setReviewCreators(prev => prev.map(c => c.id === creatorId
                ? { ...c, reviewStatus: 'needs_update', profileSubmittedForReview: false, adminNote: noteText }
                : c));
            setSelectedReviewCreator((prev: any) => prev?.id === creatorId
                ? { ...prev, reviewStatus: 'needs_update', profileSubmittedForReview: false, adminNote: noteText }
                : prev);
            alert('⚠ Creator notified to update their profile.');
        } catch (err: any) {
            alert('Failed to request update: ' + err.message);
        } finally {
            setReviewActionLoading(false);
        }
    };

    const handleReturnToReview = async (creatorId: string) => {
        setReviewActionLoading(true);
        try {
            await updateDoc(doc(db, 'users', creatorId), {
                reviewStatus: 'ready_for_review',
                profileSubmittedForReview: true,
            });
            setReviewCreators(prev => prev.map(c => c.id === creatorId
                ? { ...c, reviewStatus: 'ready_for_review', profileSubmittedForReview: true }
                : c));
            setSelectedReviewCreator((prev: any) => prev?.id === creatorId
                ? { ...prev, reviewStatus: 'ready_for_review', profileSubmittedForReview: true }
                : prev);
            alert('↩ Profile returned to Ready for Review queue.');
        } catch (err: any) {
            alert('Failed: ' + err.message);
        } finally {
            setReviewActionLoading(false);
        }
    };

    // Section 10 — Migration Audit: mark creators without reviewStatus as 'incomplete'
    const handleMigrationAudit = async () => {
        if (!window.confirm('This will scan all Creator accounts and mark those without a reviewStatus as Incomplete. No existing data will be overwritten and no account will be auto-approved. Proceed?')) return;
        setMigrationRunning(true);
        setMigrationResult(null);
        try {
            // Use the already-loaded reviewCreators list (must have loaded creator_review tab first)
            const toMark = reviewCreators.filter(c => !c.reviewStatus);
            let markedIncomplete = 0;
            const batchSize = 10;
            for (let i = 0; i < toMark.length; i += batchSize) {
                const batch = toMark.slice(i, i + batchSize);
                await Promise.all(batch.map(async (creator) => {
                    await updateDoc(doc(db, 'users', creator.id), {
                        reviewStatus: 'incomplete',
                    });
                    markedIncomplete++;
                }));
            }
            setReviewCreators(prev => prev.map(c =>
                !c.reviewStatus ? { ...c, reviewStatus: 'incomplete' } : c
            ));
            setMigrationResult({
                audited: reviewCreators.length,
                markedIncomplete,
                skipped: reviewCreators.length - markedIncomplete,
            });
        } catch (err: any) {
            alert('Migration audit failed: ' + err.message);
        } finally {
            setMigrationRunning(false);
        }
    };


    // Download user emails as CSV entirely client-side using allUsers array
    const handleDownloadEmails = async (role: string) => {
        setCsvDownloading(role);
        try {
            // Filter allUsers based on selected role
            const filtered = allUsers.filter(u => {
                if (role === 'all') return true;
                const userRole = (u.role || '').toLowerCase();
                
                if (role === 'Creator') {
                    // Match creator role variants
                    return userRole.includes('creator') || userRole.includes('student') || userRole.includes('ambassador');
                }
                if (role === 'Brand') {
                    return userRole.includes('brand');
                }
                if (role === 'Association') {
                    return userRole.includes('association') || userRole.includes('organization') || userRole.includes('club');
                }
                return userRole.includes(role.toLowerCase());
            });

            if (filtered.length === 0) {
                alert(`No users found with role type: ${role}`);
                return;
            }

            // Create CSV content (Name, Email, Role)
            const header = 'Name,Email,Role\r\n';
            const rows = filtered.map(u => {
                const name = `"${(u.name || 'Anonymous').replace(/"/g, '""')}"`;
                const email = `"${(u.email || '').replace(/"/g, '""')}"`;
                const userRole = `"${(u.role || 'Member').replace(/"/g, '""')}"`;
                return `${name},${email},${userRole}`;
            }).join('\r\n');

            const csvContent = header + rows;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = role === 'all' ? 'campus-spark-all-emails.csv' : `campus-spark-${role.toLowerCase()}-emails.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err: any) {
            alert('Failed to download CSV: ' + err.message);
        } finally {
            setCsvDownloading(null);
        }
    };

    // Rich-text editor formatting commands
    const execBlastFormat = (command: string, value?: string) => {
        blastEditorRef.current?.focus();
        document.execCommand(command, false, value);
        setBlastBodyHtml(blastEditorRef.current?.innerHTML || '');
    };

    // Upload a file attachment to Cloudinary / Backend Server / Firebase Storage / DataURL
    const handleBlastAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setBlastAttachUploading(true);

        const uploadSingleFile = async (file: File): Promise<{ name: string; url: string; type: string }> => {
            // 1. Try Cloudinary (auto upload endpoint used in CreatorDashboard)
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'abc-rally');
                const res = await fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.secure_url) {
                        return { name: file.name, url: data.secure_url, type: file.type || 'application/octet-stream' };
                    }
                }
            } catch (err) {
                console.warn('Cloudinary upload warning:', err);
            }

            // 2. Try Server /api/upload
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch(`${BACKEND_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) {
                        return { name: file.name, url: data.url, type: file.type || 'application/octet-stream' };
                    }
                }
            } catch (err) {
                console.warn('Server API upload warning:', err);
            }

            // 3. Try Firebase Storage (fixed task listener)
            try {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const path = `blast_attachments/${Date.now()}_${safeName}`;
                const storageRef = ref(storage, path);
                await new Promise<void>((resolve, reject) => {
                    const task = uploadBytesResumable(storageRef, file);
                    task.on('state_changed', () => {}, reject, () => resolve());
                });
                const url = await getDownloadURL(storageRef);
                return { name: file.name, url, type: file.type || 'application/octet-stream' };
            } catch (err) {
                console.warn('Firebase Storage upload warning:', err);
            }

            // 4. Data URL fallback for small files (< 5MB)
            if (file.size <= 5 * 1024 * 1024) {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                return { name: file.name, url: dataUrl, type: file.type || 'application/octet-stream' };
            }

            throw new Error(`Could not upload file ${file.name}. Please check file size or network.`);
        };

        try {
            const uploads = await Promise.all(files.map(file => uploadSingleFile(file)));
            setBlastAttachments(prev => [...prev, ...uploads]);
        } catch (err: any) {
            alert('File upload failed: ' + (err.message || 'Unknown error'));
        } finally {
            setBlastAttachUploading(false);
            e.target.value = '';
        }
    };

    // Send bulk email blast
    const handleEmailBlast = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalBody = blastEditorRef.current?.innerHTML || blastBodyHtml || emailBlastForm.body;
        if (!finalBody.trim() || finalBody === '<br>' || finalBody === '<div><br></div>') {
            alert('Please write a message body.');
            return;
        }

        setEmailBlastLoading(true);

        // Resolve recipients: Ensure we have all users from API and Firestore
        let usersToTarget: any[] = [...allUsers];
        if (usersToTarget.length === 0) {
            try {
                const usersRes = await apiClient.get('users');
                if (Array.isArray(usersRes.data) && usersRes.data.length > 0) {
                    usersToTarget = usersRes.data;
                }
            } catch (err) {
                console.warn('apiClient fetch users error:', err);
            }

            try {
                const snap = await getDocs(collection(db, 'users'));
                const firestoreUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                if (firestoreUsers.length > 0) {
                    const existingEmails = new Set(usersToTarget.map(u => (u.email || '').toLowerCase()));
                    for (const fu of firestoreUsers) {
                        if (fu.email && !existingEmails.has((fu.email).toLowerCase())) {
                            usersToTarget.push(fu);
                        }
                    }
                }
            } catch (err) {
                console.warn('Firestore fetch users error:', err);
            }

            if (usersToTarget.length > 0) {
                setAllUsers(usersToTarget);
            }
        }
        
        // Filter recipients by role
        const targetRole = emailBlastForm.role;
        const targetUsers = usersToTarget.filter(u => {
            if (targetRole === 'all') return true;
            const userRole = (u.role || '').toLowerCase();
            if (targetRole === 'Creator') {
                return userRole.includes('creator') || userRole.includes('student') || userRole.includes('ambassador');
            }
            if (targetRole === 'Brand') {
                return userRole.includes('brand');
            }
            if (targetRole === 'Association') {
                return userRole.includes('association') || userRole.includes('organization') || userRole.includes('club');
            }
            return userRole.includes(targetRole.toLowerCase());
        });

        // Clean & deduplicate recipient emails
        const recipients = Array.from(new Set(
            targetUsers
                .map(u => (u.email || '').trim())
                .filter(email => email.length > 0 && email.includes('@'))
        ));

        if (recipients.length === 0) {
            setEmailBlastLoading(false);
            alert(`No valid recipient emails found for target segment: "${targetRole}"`);
            return;
        }

        if (!window.confirm(`You are about to send an email to ${recipients.length} user(s) (${targetRole === 'all' ? 'All Roles' : targetRole}). Proceed?`)) {
            setEmailBlastLoading(false);
            return;
        }
        
        setEmailBlastResult(null);

        // Build HTML body with attachments appended
        let htmlBody = finalBody;
        if (blastAttachments.length > 0) {
            const images = blastAttachments.filter(a => a.type.startsWith('image/'));
            const videos = blastAttachments.filter(a => a.type.startsWith('video/'));
            const others = blastAttachments.filter(a => !a.type.startsWith('image/') && !a.type.startsWith('video/'));
            if (images.length) {
                htmlBody += images.map(img =>
                    `<div style="margin-top:16px;"><img src="${img.url}" alt="${img.name}" style="max-width:100%;border-radius:8px;display:block;" /></div>`
                ).join('');
            }
            if (videos.length) {
                htmlBody += videos.map(v =>
                    `<div style="margin-top:16px;"><p style="font-size:13px;color:#888;">📹 Attachment: <a href="${v.url}" target="_blank" style="color:#e53e3e;font-weight:700;">${v.name}</a></p></div>`
                ).join('');
            }
            if (others.length) {
                htmlBody += '<div style="margin-top:16px;">' + others.map(f =>
                    `<p style="font-size:13px;color:#888;">📎 Attachment: <a href="${f.url}" target="_blank" style="color:#e53e3e;font-weight:700;">${f.name}</a></p>`
                ).join('') + '</div>';
            }
        }

        let sent = 0;
        let failed = 0;

        try {
            const batchSize = 5;
            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (email) => {
                        try {
                            // First attempt with 'blast_html'
                            let res = await fetch(`${BACKEND_URL}/api/email/notify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: 'blast_html',
                                    to: email,
                                    subject: emailBlastForm.subject,
                                    title: emailBlastForm.title,
                                    body: htmlBody
                                })
                            });

                            // Fallback to 'generic' if server returns 400 (e.g. deployed server without blast_html route)
                            if (!res.ok) {
                                res = await fetch(`${BACKEND_URL}/api/email/notify`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        type: 'generic',
                                        to: email,
                                        subject: emailBlastForm.subject,
                                        title: emailBlastForm.title,
                                        body: htmlBody
                                    })
                                });
                            }

                            if (!res.ok) {
                                throw new Error(`HTTP ${res.status}`);
                            }
                            sent++;
                        } catch (err) {
                            console.warn(`Server email notify error for ${email}, attempting Firestore log fallback:`, err);
                            try {
                                await addDoc(collection(db, 'email_blasts_sent'), {
                                    to: email,
                                    subject: emailBlastForm.subject,
                                    title: emailBlastForm.title,
                                    body: htmlBody,
                                    sentAt: new Date().toISOString(),
                                    status: 'logged'
                                });
                                sent++;
                            } catch (fsErr) {
                                console.error(`Failed to record email blast for ${email}:`, fsErr);
                                failed++;
                            }
                        }
                    })
                );
                if (i + batchSize < recipients.length) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            setEmailBlastResult({ 
                sent, 
                failed, 
                total: recipients.length 
            });
        } catch (err: any) {
            alert('Email blast failed: ' + err.message);
        } finally {
            setEmailBlastLoading(false);
        }
    };

    const handleApproveWithdrawal = async (transactionId: string) => {
        if (!window.confirm('Mark this withdrawal as DISBURSED? Ensure you have actually sent the funds to the user bank.')) return;
        try {
            await WalletService.completeWithdrawal(transactionId);
            const trans = allTransactions.find(t => t.id === transactionId);
            if (trans && (trans.userEmail || trans.email)) {
                notifyWithdrawalCompleted(
                    trans.userEmail || trans.email,
                    trans.userName || trans.name || 'User',
                    trans.amount,
                    { bank: trans.bankName, account: trans.accountNumber }
                );
            }
            alert('Withdrawal marked as completed.');
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to approve withdrawal: ' + err.message);
        }
    };

    const handleRejectWithdrawal = async (transactionId: string) => {
        const reason = window.prompt('Enter reason for rejection (this will be visible to the user):');
        if (reason === null) return;
        try {
            await WalletService.rejectWithdrawal(transactionId, reason || 'Rejected by Admin');
            alert('Withdrawal rejected and funds refunded.');
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to reject withdrawal: ' + err.message);
        }
    };

    const handleSaveBlog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (blogFormData.id) {
                // Update
                const blogRef = doc(db, 'blogs', blogFormData.id);
                await updateDoc(blogRef, {
                    title: blogFormData.title,
                    excerpt: blogFormData.excerpt,
                    content: blogFormData.content,
                    imageUrl: blogFormData.imageUrl,
                    status: blogFormData.status,
                    updatedAt: serverTimestamp()
                });
                alert('Blog updated successfully!');
            } else {
                // Create
                await addDoc(collection(db, 'blogs'), {
                    title: blogFormData.title,
                    excerpt: blogFormData.excerpt,
                    content: blogFormData.content,
                    imageUrl: blogFormData.imageUrl,
                    status: blogFormData.status,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                alert('Blog created successfully!');
            }
            setShowBlogModal(false);
            setBlogFormData({ title: '', excerpt: '', content: '', imageUrl: '', status: 'draft', id: '' });
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to save blog: ' + err.message);
        }
    };

    const handleDeleteBlog = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this blog post?')) return;
        try {
            await deleteDoc(doc(db, 'blogs', id));
            alert('Blog deleted successfully.');
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to delete blog: ' + err.message);
        }
    };

    const handleSavePastEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (pastEventFormData.id) {
                const peRef = doc(db, 'past_events', pastEventFormData.id);
                await updateDoc(peRef, {
                    title: pastEventFormData.title,
                    description: pastEventFormData.description,
                    date: pastEventFormData.date,
                    location: pastEventFormData.location,
                    imageUrl: pastEventFormData.imageUrl,
                    updatedAt: serverTimestamp()
                });
                alert('Past event updated successfully!');
            } else {
                await addDoc(collection(db, 'past_events'), {
                    title: pastEventFormData.title,
                    description: pastEventFormData.description,
                    date: pastEventFormData.date,
                    location: pastEventFormData.location,
                    imageUrl: pastEventFormData.imageUrl,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                alert('Past event added to gallery successfully!');
            }
            setShowPastEventModal(false);
            setPastEventFormData({ id: '', title: '', description: '', date: '', location: '', imageUrl: '' });
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to save past event: ' + err.message);
        }
    };

    const handleDeletePastEvent = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this past event from gallery?')) return;
        try {
            await deleteDoc(doc(db, 'past_events', id));
            alert('Past event deleted successfully.');
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to delete past event: ' + err.message);
        }
    };

    const handleSaveTestimonial = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (testimonialFormData.id) {
                const tRef = doc(db, 'testimonials', testimonialFormData.id);
                await updateDoc(tRef, {
                    quote: testimonialFormData.quote,
                    name: testimonialFormData.name,
                    title: testimonialFormData.title,
                    updatedAt: serverTimestamp()
                });
                alert('Testimonial updated successfully!');
            } else {
                await addDoc(collection(db, 'testimonials'), {
                    quote: testimonialFormData.quote,
                    name: testimonialFormData.name,
                    title: testimonialFormData.title,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                alert('Testimonial added successfully!');
            }
            setShowTestimonialModal(false);
            setTestimonialFormData({ id: '', quote: '', name: '', title: '' });
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to save testimonial: ' + err.message);
        }
    };

    const handleDeleteTestimonial = async (id: string) => {
        if (!window.confirm('Remove this testimonial from the homepage?')) return;
        try {
            await deleteDoc(doc(db, 'testimonials', id));
            alert('Testimonial deleted.');
            fetchAdminData();
        } catch (err: any) {
            alert('Failed to delete testimonial: ' + err.message);
        }
    };

    const handleSaveBranding = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingBranding(true);
        try {
            const docRef = doc(db, 'site_settings', 'branding');
            await setDoc(docRef, {
                title: brandingForm.title,
                abbrev: brandingForm.abbrev,
                favicon: brandingForm.favicon,
                logoType: brandingForm.logoType,
                logoValue: brandingForm.logoValue,
                landingImage: brandingForm.landingImage || '',
                updatedAt: serverTimestamp()
            });
            alert('Site branding updated successfully! Changes will propagate across the platform instantly.');
        } catch (err: any) {
            console.error('Error saving branding:', err);
            alert('Failed to save settings: ' + err.message);
        } finally {
            setSavingBranding(false);
        }
    };

    const sidebarItems = [
        { id: 'overview', label: 'Network Pulse', icon: <Activity className="w-5 h-5" /> },
        { id: 'creator_review', label: 'Creator Review', icon: <CheckCircle2 className="w-5 h-5" />, badge: reviewCreators.filter(c => c.reviewStatus === 'ready_for_review' || (c.profileSubmittedForReview && c.reviewStatus !== 'approved')).length || undefined },
        { id: 'users', label: 'User Directory', icon: <Users className="w-5 h-5" /> },
        { id: 'campaigns', label: 'Campaign Monitor', icon: <Megaphone className="w-5 h-5" /> },
        { id: 'events', label: 'Events', icon: <Calendar className="w-5 h-5" /> },
        { id: 'transactions', label: 'Platform Ledger', icon: <Wallet className="w-5 h-5" /> },
        { id: 'revenue', label: 'Revenue Engine', icon: <TrendingUp className="w-5 h-5" /> },
        { id: 'withdrawals', label: 'Withdrawals', icon: <CheckCircle2 className="w-5 h-5" />, badge: allTransactions.filter(t => t.type === 'debit' && t.status === 'pending').length },
        { id: 'proposals', label: 'Proposal Monitor', icon: <Database className="w-5 h-5" /> },
        { id: 'blogs', label: 'Blog Manager', icon: <FileText className="w-5 h-5" /> },
        { id: 'testimonials', label: 'Testimonials', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'branding', label: 'Site Config', icon: <Settings className="w-5 h-5" /> },
        { id: 'disputes', label: 'Disputes & Mediation', icon: <Scale className="w-5 h-5" />, badge: 0 },
        { id: 'support', label: 'Support Inbox', icon: <HelpCircle className="w-5 h-5" />, badge: supportTickets.filter(t => t.status === 'open').length || undefined },
        { id: 'platform_reviews', label: 'Platform Reviews', icon: <LucideIcons.Star className="w-5 h-5" /> },
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
            case 'creator_review': {
                const queueCreators = reviewCreators.filter(c =>
                    c.reviewStatus === 'ready_for_review' || (c.profileSubmittedForReview && c.reviewStatus !== 'approved' && c.reviewStatus !== 'needs_update')
                );
                const filteredReviewList = reviewCreators.filter(c => {
                    const matchesStatus =
                        reviewStatusFilter === 'all' ? true :
                        reviewStatusFilter === 'queue' ? (c.reviewStatus === 'ready_for_review' || (c.profileSubmittedForReview && c.reviewStatus !== 'approved' && c.reviewStatus !== 'needs_update')) :
                        c.reviewStatus === reviewStatusFilter;
                    const term = reviewSearchTerm.toLowerCase();
                    const matchesSearch = !reviewSearchTerm ||
                        c.name?.toLowerCase().includes(term) ||
                        c.email?.toLowerCase().includes(term) ||
                        c.primaryService?.toLowerCase().includes(term);
                    return matchesStatus && matchesSearch;
                });

                const statusBadge = (status: string) => {
                    if (status === 'approved') return <span className="px-2.5 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">✓ Approved</span>;
                    if (status === 'needs_update') return <span className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">⚠ Needs Update</span>;
                    if (status === 'ready_for_review') return <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">⏳ Ready for Review</span>;
                    return <span className="px-2.5 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full text-[9px] font-black uppercase tracking-widest">Incomplete</span>;
                };

                const capColors: Record<string, string> = { Create: 'bg-spark-red text-white', Manage: 'bg-blue-600 text-white', Distribute: 'bg-green-600 text-white', Activate: 'bg-amber-500 text-white' };

                return (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)]">Creator Review</h2>
                                <p className="text-[var(--text-secondary)] font-bold text-sm mt-1">Manual quality control — approve profiles or request corrections.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-2 bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 rounded-xl text-xs font-black uppercase">
                                    {queueCreators.length} Pending Review
                                </span>
                                <button onClick={fetchAdminData} className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-black text-[var(--text-secondary)] hover:text-spark-red transition-all">
                                    ↻ Refresh
                                </button>
                            </div>
                        </div>

                        {/* Section 10 — Migration Audit Panel */}
                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-[2rem] overflow-hidden">
                            <button
                                onClick={() => setShowMigrationPanel(p => !p)}
                                className="w-full flex items-center justify-between p-5 hover:bg-blue-500/5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base">🔄</span>
                                    <div className="text-left">
                                        <p className="font-black text-sm text-[var(--text-primary)]">Section 10 — Migration Audit</p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">Mark existing creators without a review status as Incomplete. Safe to run multiple times.</p>
                                    </div>
                                </div>
                                <span className="text-[var(--text-secondary)] text-xs font-bold">{showMigrationPanel ? '▲ Hide' : '▼ Show'}</span>
                            </button>
                            {showMigrationPanel && (
                                <div className="px-6 pb-6 space-y-4 border-t border-blue-500/20 pt-4">
                                    <div className="grid sm:grid-cols-3 gap-3 text-center">
                                        <div className="p-3 bg-[var(--bg-primary)] rounded-xl">
                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Total Creators Loaded</p>
                                            <p className="text-xl font-black text-[var(--text-primary)]">{reviewCreators.length}</p>
                                        </div>
                                        <div className="p-3 bg-[var(--bg-primary)] rounded-xl">
                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">No Review Status</p>
                                            <p className="text-xl font-black text-amber-600">{reviewCreators.filter(c => !c.reviewStatus).length}</p>
                                        </div>
                                        <div className="p-3 bg-[var(--bg-primary)] rounded-xl">
                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Already Reviewed</p>
                                            <p className="text-xl font-black text-green-600">{reviewCreators.filter(c => !!c.reviewStatus).length}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-[var(--text-secondary)] space-y-1">
                                        <p className="font-black text-amber-700 uppercase text-[9px]">Safety Rules</p>
                                        <p>✓ Never overwrites existing profile field values</p>
                                        <p>✓ Never auto-approves any account</p>
                                        <p>✓ Skips creators who already have a reviewStatus</p>
                                        <p>✓ Only sets reviewStatus = 'incomplete' on unreviewed accounts</p>
                                    </div>
                                    {migrationResult && (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm">
                                            <p className="font-black text-green-700 mb-1">✓ Audit Complete</p>
                                            <p className="text-[var(--text-secondary)]">Audited: <strong>{migrationResult.audited}</strong> · Marked Incomplete: <strong>{migrationResult.markedIncomplete}</strong> · Skipped (already had status): <strong>{migrationResult.skipped}</strong></p>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <button
                                            disabled={migrationRunning || reviewCreators.filter(c => !c.reviewStatus).length === 0}
                                            onClick={handleMigrationAudit}
                                            className="px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                                        >
                                            {migrationRunning ? '⏳ Running...' : `Run Audit (${reviewCreators.filter(c => !c.reviewStatus).length} to process)`}
                                        </button>
                                        {reviewCreators.filter(c => !c.reviewStatus).length === 0 && (
                                            <span className="text-xs text-green-600 font-bold">✓ All creators already have a review status</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 11 — 48-Hour Acceptance Checklist */}
                        <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2rem] overflow-hidden">
                            <button
                                onClick={() => setShowAcceptancePanel(p => !p)}
                                className="w-full flex items-center justify-between p-5 hover:bg-purple-500/5 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-base">✅</span>
                                    <div className="text-left">
                                        <p className="font-black text-sm text-[var(--text-primary)]">Section 11 — 48-Hour Release Acceptance Tests</p>
                                        <p className="text-[11px] text-[var(--text-secondary)]">
                                            {Object.values(acceptanceChecks).filter(Boolean).length}/{ACCEPTANCE_TESTS.length} scenarios verified
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                        <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${(Object.values(acceptanceChecks).filter(Boolean).length / ACCEPTANCE_TESTS.length) * 100}%` }} />
                                    </div>
                                    <span className="text-[var(--text-secondary)] text-xs font-bold">{showAcceptancePanel ? '▲ Hide' : '▼ Show'}</span>
                                </div>
                            </button>
                            {showAcceptancePanel && (
                                <div className="border-t border-purple-500/20">
                                    <div className="px-4 py-3 bg-purple-500/5 text-[10px] text-purple-700 font-bold">
                                        Test each scenario on mobile AND desktop before marking complete. Checks persist locally.
                                    </div>
                                    <div className="divide-y divide-purple-500/10">
                                        {ACCEPTANCE_TESTS.map(test => (
                                            <label key={test.id} className="flex items-start gap-4 p-5 hover:bg-[var(--bg-secondary)] transition-all cursor-pointer">
                                                <div className="mt-0.5 flex-shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!acceptanceChecks[test.id]}
                                                        onChange={() => toggleAcceptanceCheck(test.id)}
                                                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-black text-sm ${acceptanceChecks[test.id] ? 'text-green-600 line-through' : 'text-[var(--text-primary)]'}`}>{test.scenario}</p>
                                                        {acceptanceChecks[test.id] && <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full text-[9px] font-black uppercase">✓ Verified</span>}
                                                    </div>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium"><span className="font-bold text-[var(--text-primary)]">Steps:</span> {test.steps}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5"><span className="font-bold text-[var(--text-primary)]">Expected:</span> {test.expected}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {Object.values(acceptanceChecks).filter(Boolean).length === ACCEPTANCE_TESTS.length && (
                                        <div className="p-5 bg-green-500/10 border-t border-green-500/20 text-center">
                                            <p className="font-black text-green-700 text-sm">🎉 All 7 scenarios verified — release is acceptance-complete!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid lg:grid-cols-[380px,1fr] gap-6 items-start">
                            {/* LEFT: Queue List */}
                            <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                                {/* Filters */}
                                <div className="p-4 border-b border-[var(--border-color)] space-y-3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search creators..."
                                            value={reviewSearchTerm}
                                            onChange={e => setReviewSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-medium outline-none focus:border-spark-red text-[var(--text-primary)]"
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {(['queue', 'needs_update', 'approved', 'all'] as const).map(f => (
                                            <button key={f} onClick={() => setReviewStatusFilter(f)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${reviewStatusFilter === f ? 'bg-spark-red text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-spark-red'}`}
                                            >
                                                {f === 'queue' ? `Queue (${queueCreators.length})` : f === 'needs_update' ? `Needs Update (${reviewCreators.filter(c => c.reviewStatus === 'needs_update').length})` : f === 'approved' ? `Approved (${reviewCreators.filter(c => c.reviewStatus === 'approved').length})` : 'All'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Creator List */}
                                <div className="overflow-y-auto max-h-[70vh]">
                                    {filteredReviewList.length === 0 ? (
                                        <div className="p-8 text-center text-[var(--text-secondary)] text-sm font-bold">No creators in this view.</div>
                                    ) : filteredReviewList.map(creator => (
                                        <button
                                            key={creator.id}
                                            onClick={() => { setSelectedReviewCreator(creator); setAdminNoteInput(creator.adminNote || ''); }}
                                            className={`w-full p-4 flex items-start gap-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all text-left ${selectedReviewCreator?.id === creator.id ? 'bg-spark-red/5 border-l-4 border-l-spark-red' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-shrink-0 overflow-hidden">
                                                {creator.imageUrl ? <img src={creator.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-base font-black text-[var(--text-secondary)]">{creator.name?.[0] || '?'}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-[var(--text-primary)] truncate">{creator.name || 'Unnamed'}</p>
                                                <p className="text-[11px] text-[var(--text-secondary)] truncate">{creator.primaryService || creator.primaryCapability || 'No service set'}</p>
                                                <div className="mt-1.5">{statusBadge(creator.reviewStatus)}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: Detail Panel */}
                            {selectedReviewCreator ? (
                                <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                                    {/* Creator header */}
                                    <div className="p-8 border-b border-[var(--border-color)] flex items-start gap-5">
                                        <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-shrink-0 overflow-hidden">
                                            {selectedReviewCreator.imageUrl
                                                ? <img src={selectedReviewCreator.imageUrl} alt="" className="w-full h-full object-cover" />
                                                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[var(--text-secondary)]">{selectedReviewCreator.name?.[0] || '?'}</div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedReviewCreator.name}</h3>
                                                {statusBadge(selectedReviewCreator.reviewStatus)}
                                            </div>
                                            <p className="text-[var(--text-secondary)] font-medium text-sm mt-0.5">{selectedReviewCreator.professionalHeadline || 'No headline set'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {(selectedReviewCreator.capabilities || []).map((cap: string) => (
                                                    <span key={cap} className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${capColors[cap] || 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>{cap}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-16rem)]">
                                        {/* Grid: core info */}
                                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                            {[
                                                ['Contact / Email', selectedReviewCreator.email || 'N/A'],
                                                ['Phone', selectedReviewCreator.phoneNumber || 'N/A'],
                                                ['Registered', selectedReviewCreator.createdAt ? new Date(selectedReviewCreator.createdAt?.seconds ? selectedReviewCreator.createdAt.seconds * 1000 : selectedReviewCreator.createdAt).toLocaleDateString() : 'N/A'],
                                                ['Submitted', selectedReviewCreator.profileSubmittedAt ? new Date(selectedReviewCreator.profileSubmittedAt).toLocaleDateString() : 'Not yet'],
                                                ['Location', selectedReviewCreator.city ? `${selectedReviewCreator.city}, ${selectedReviewCreator.state}` : (selectedReviewCreator.location || 'Not set')],
                                                ['Campus / Community Reach', selectedReviewCreator.campusCommunityReach || 'Not set'],
                                                ['Primary Service', selectedReviewCreator.primaryService || 'Not set'],
                                                ['Services', (selectedReviewCreator.services || []).join(', ') || 'None'],
                                                ['Work Preference', selectedReviewCreator.workPreference || 'Not set'],
                                                ['Availability', selectedReviewCreator.availability || 'Not set'],
                                                ['Starting Price', selectedReviewCreator.pricingNegotiable ? 'Negotiable' : (selectedReviewCreator.startingPrice ? `₦${Number(selectedReviewCreator.startingPrice).toLocaleString()}` : 'Not set')],
                                                ['Pricing Basis', selectedReviewCreator.pricingBasis || 'Not set'],
                                                ['Turnaround Time', selectedReviewCreator.turnaroundTime || 'Not set'],
                                            ].map(([label, value]) => (
                                                <div key={label} className="p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">{label}</p>
                                                    <p className="font-bold text-[var(--text-primary)] text-sm">{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Professional Summary */}
                                        {selectedReviewCreator.professionalSummary && (
                                            <div className="p-5 bg-[var(--bg-secondary)] rounded-2xl">
                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Professional Summary</p>
                                                <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{selectedReviewCreator.professionalSummary}</p>
                                            </div>
                                        )}

                                        {/* Portfolio */}
                                        {(selectedReviewCreator.portfolio || []).length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Portfolio Samples ({selectedReviewCreator.portfolio.length})</p>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    {selectedReviewCreator.portfolio.map((item: any, i: number) => (
                                                        <a key={i} href={item.fileUrl || item} target="_blank" rel="noopener noreferrer"
                                                            className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex items-center gap-2 hover:border-spark-red transition-all group">
                                                            <ExternalLink className="w-3.5 h-3.5 text-spark-red flex-shrink-0" />
                                                            <span className="text-xs font-bold text-[var(--text-primary)] truncate group-hover:text-spark-red">{item.title || item.fileUrl || item}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* WhatsApp Media Section */}
                                        {(selectedReviewCreator.whatsappMediaName || selectedReviewCreator.whatsappAudienceEvidence) && (
                                            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-4">
                                                <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
                                                    <h5 className="font-black text-sm text-[var(--text-primary)]">📻 WhatsApp Media Claims</h5>
                                                    <span className="text-[9px] font-bold text-green-600 uppercase">{selectedReviewCreator.whatsappMediaType || 'Provider'}</span>
                                                </div>
                                                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                                    {[
                                                        ['Media Name', selectedReviewCreator.whatsappMediaName],
                                                        ['Campus Coverage', selectedReviewCreator.whatsappCampusCoverage],
                                                        ['Audience Category', selectedReviewCreator.whatsappPrimaryAudience],
                                                        ['Status Views', selectedReviewCreator.whatsappAverageStatusViews?.toLocaleString()],
                                                        ['Channel Followers', selectedReviewCreator.whatsappChannelFollowers?.toLocaleString()],
                                                        ['Rate/Placement', selectedReviewCreator.whatsappRatePerPlacement ? `₦${Number(selectedReviewCreator.whatsappRatePerPlacement).toLocaleString()}` : undefined],
                                                    ].filter(([, v]) => v).map(([label, value]) => (
                                                        <div key={label}>
                                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">{label}</p>
                                                            <p className="font-bold text-[var(--text-primary)]">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {selectedReviewCreator.whatsappAudienceEvidence && (
                                                    <div className="pt-3 border-t border-green-500/20">
                                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-2">Audience Evidence (Admin Only)</p>
                                                        <div className="relative group max-w-xs rounded-xl overflow-hidden border border-green-500/30">
                                                            <img src={selectedReviewCreator.whatsappAudienceEvidence} alt="Evidence" className="w-full h-36 object-cover" />
                                                            <a href={selectedReviewCreator.whatsappAudienceEvidence} target="_blank" rel="noopener noreferrer"
                                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold uppercase">
                                                                🔍 View Full
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Admin Note Input (always visible, required for Needs Update) */}
                                        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Admin Note</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Required when selecting "Needs Update". Shown to creator on their dashboard.</p>
                                            </div>
                                            <textarea
                                                rows={3}
                                                placeholder="e.g. Please add at least one portfolio link. Your professional summary is too short — expand to at least 3 sentences."
                                                value={adminNoteInput}
                                                onChange={e => setAdminNoteInput(e.target.value)}
                                                className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-amber-500/30 rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none focus:border-amber-500 resize-none"
                                            />
                                            {selectedReviewCreator.adminNote && (
                                                <p className="text-[10px] text-amber-700 font-bold">Previous note: "{selectedReviewCreator.adminNote}"</p>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-color)]">
                                            <button
                                                disabled={reviewActionLoading}
                                                onClick={() => handleApproveCreator(selectedReviewCreator.id)}
                                                className="py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="w-4 h-4" /> Approve
                                            </button>
                                            <button
                                                disabled={reviewActionLoading}
                                                onClick={() => handleNeedsUpdateCreator(selectedReviewCreator.id)}
                                                className="py-4 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                ⚠ Needs Update
                                            </button>
                                            <button
                                                disabled={reviewActionLoading}
                                                onClick={() => handleReturnToReview(selectedReviewCreator.id)}
                                                className="py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs uppercase tracking-widest rounded-2xl hover:border-spark-red transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                ↩ Return to Queue
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-3xl flex items-center justify-center mx-auto mb-4">
                                        <Eye className="w-8 h-8 text-[var(--text-secondary)]" />
                                    </div>
                                    <p className="font-black text-[var(--text-primary)]">Select a creator</p>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">Click any creator in the queue to review their profile.</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            case 'revenue':

                return (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Platform Revenue & Fee Settings</h2>
                            <p className="text-[var(--text-secondary)] font-bold text-sm mt-1">Monitor total network transaction fees, withdrawal charges, commission earnings, and change fee constants.</p>
                        </div>
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
                                    <p className="text-gray-400 font-medium leading-relaxed max-w-xs">Accumulated earnings from platform commissions (10%) and event listing fees (₦20,000).</p>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Revenue Breakdown</h3>
                                    <div className="space-y-4 mt-6">
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <div>
                                                <span className="block text-sm font-bold text-[var(--text-primary)]">Event Listing Fees</span>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-medium">₦20,000 flat per published event listing</span>
                                            </div>
                                            <span className="font-black text-spark-red text-base">₦{(stats?.listingFeesTotal || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <div>
                                                <span className="block text-sm font-bold text-[var(--text-primary)]">Creator Gig Commission</span>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-medium">10% deducted on creator earnings from completed gigs</span>
                                            </div>
                                            <span className="font-black text-spark-red text-base">₦{(stats?.creatorCommissionsTotal || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                                            <div>
                                                <span className="block text-sm font-bold text-[var(--text-primary)]">Sponsorship Commission</span>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-medium">10% platform fee on released sponsorship packages</span>
                                            </div>
                                            <span className="font-black text-spark-red text-base">10%</span>
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
                        {/* Sub Tabs Selection */}
                        <div className="flex gap-4 border-b border-[var(--border-color)] pb-4">
                            <button 
                                onClick={() => setEventsSubTab('active')} 
                                className={`pb-2 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${eventsSubTab === 'active' ? 'border-spark-red text-spark-red' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                Active Listings
                            </button>
                            <button 
                                onClick={() => setEventsSubTab('past')} 
                                className={`pb-2 px-4 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${eventsSubTab === 'past' ? 'border-spark-red text-spark-red' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                Past Event Gallery
                            </button>
                        </div>

                        {eventsSubTab === 'active' ? (
                            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-[var(--border-color)] flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Events</h3>
                                        <p className="text-[var(--text-secondary)] font-bold text-sm">Monitor all Association-led experiences.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setExternalSponsorSuccess(null);
                                                setExternalSponsorForm({ brandName: '', eventId: '', packageName: '', customAmount: '', notes: '' });
                                                setShowExternalSponsorModal(true);
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                        >
                                            <Handshake className="w-4 h-4" />
                                            Fund Event (Off-Platform Brand)
                                        </button>
                                        <div className="px-4 py-2 bg-spark-red/10 text-spark-red rounded-xl font-black text-xs uppercase tracking-widest border border-spark-red/20">
                                            {allEvents.length} Active Events
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[var(--bg-secondary)]/50">
                                            <tr>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Event Details</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Host / Organizer</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Attendees & Slots</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Sponsorship Goal vs Raised</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {allEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-20 text-center text-[var(--text-secondary)] font-bold italic">No events currently listed in the network.</td>
                                                </tr>
                                            ) : (
                                                allEvents.map((ev) => {
                                                    const raised = Number(ev.raisedSponsorship || 0);
                                                    const target = Number(ev.targetSponsorship || 0);
                                                    const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                                                    const attendees = ev.expectedAttendees || ev.attendees || ev.capacity || 'TBD';
                                                    const slots = ev.sponsorshipSlots || ev.slots || 'Open';

                                                    return (
                                                        <tr key={ev.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div>
                                                                    <p className="font-black text-[var(--text-primary)] text-base">{ev.name || ev.title}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] text-spark-red font-black uppercase tracking-widest px-2 py-0.5 bg-spark-red/10 rounded-md">{ev.category || 'Experience'}</span>
                                                                        <span className="text-[11px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3" /> {ev.location || 'Campus Wide'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium line-clamp-1 max-w-[280px]">{ev.description}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-xl bg-spark-purple/10 text-spark-purple flex items-center justify-center font-black text-sm flex-shrink-0">
                                                                        {(ev.hostName || ev.organization || '?').charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-[var(--text-primary)]">{ev.hostName || ev.organization || 'Association'}</p>
                                                                        {ev.hostEmail && <p className="text-[10px] font-medium text-[var(--text-secondary)]">{ev.hostEmail}</p>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-bold text-[var(--text-primary)]">👥 {attendees} attendees</p>
                                                                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">🎟️ {slots} slots</p>
                                                                    <p className="text-[10px] font-bold text-spark-red">📅 {ev.date || 'Upcoming'}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="w-48 space-y-1.5">
                                                                    <div className="flex justify-between items-center text-xs">
                                                                        <span className="font-black text-emerald-600">₦{raised.toLocaleString()}</span>
                                                                        <span className="font-bold text-[var(--text-secondary)]">of ₦{target.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] h-2 rounded-full overflow-hidden">
                                                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                    <p className="text-[10px] font-black text-right text-[var(--text-secondary)] uppercase tracking-wider">{pct}% Funded</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => setSelectedAdminEvent(ev)}
                                                                        className="px-3.5 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs rounded-xl border border-[var(--border-color)] transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <Eye className="w-3.5 h-3.5 text-spark-red" /> View Details
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setExternalSponsorSuccess(null);
                                                                            const pkgs = parseEventPackages(ev.sponsorshipPackages);
                                                                            const firstPkg = pkgs[0] || { name: 'Custom Sponsorship', price: 0 };
                                                                            const defaultAmt = firstPkg.price || (ev.targetSponsorship ? String(ev.targetSponsorship) : '');
                                                                            setExternalSponsorForm({
                                                                                brandName: '',
                                                                                eventId: ev.id,
                                                                                packageName: firstPkg.name || 'Custom Sponsorship',
                                                                                customAmount: defaultAmt ? String(defaultAmt) : '',
                                                                                notes: ''
                                                                            });
                                                                            setShowExternalSponsorModal(true);
                                                                        }}
                                                                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5"
                                                                    >
                                                                        <Handshake className="w-3.5 h-3.5 text-emerald-600" /> Sponsor
                                                                    </button>
                                                                    <button onClick={() => handleDeleteRecord('events', ev.id)} className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">Previous Event Gallery</h3>
                                        <p className="text-[var(--text-secondary)] font-bold text-sm">Add or remove snapshots of past campus events.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setPastEventFormData({ id: '', title: '', description: '', date: '', location: '', imageUrl: '' });
                                            setShowPastEventModal(true);
                                        }} 
                                        className="px-6 py-3 bg-spark-red hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Add Past Event
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-[var(--bg-secondary)]/50">
                                            <tr>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Image</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Title</th>
                                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date / Venue</th>
                                                <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-color)]">
                                            {allPastEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-20 text-center text-[var(--text-secondary)] font-bold italic">No past events in the gallery yet.</td>
                                                </tr>
                                            ) : (
                                                allPastEvents.map((pe) => (
                                                    <tr key={pe.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                                                        <td className="px-8 py-4">
                                                            {pe.imageUrl ? (
                                                                <img src={pe.imageUrl} alt={pe.title} className="w-16 h-12 rounded-lg object-cover border border-[var(--border-color)]" />
                                                            ) : (
                                                                <div className="w-16 h-12 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-[9px] font-black text-[var(--text-secondary)]">No Img</div>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <p className="font-black text-[var(--text-primary)] text-sm">{pe.title}</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 max-w-[300px] mt-0.5">{pe.description}</p>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <p className="text-xs text-[var(--text-primary)] font-black">{pe.date}</p>
                                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold">{pe.location || 'Campus Wide'}</p>
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        setPastEventFormData({
                                                                            id: pe.id,
                                                                            title: pe.title || '',
                                                                            description: pe.description || '',
                                                                            date: pe.date || '',
                                                                            location: pe.location || '',
                                                                            imageUrl: pe.imageUrl || ''
                                                                        });
                                                                        setShowPastEventModal(true);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all"
                                                                >
                                                                    <Edit className="w-5 h-5" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeletePastEvent(pe.id)} 
                                                                    className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'transactions':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Platform Transactions & Escrow</h2>
                            <p className="text-[var(--text-secondary)] font-bold text-sm mt-1">Full audit ledger of all deposits, debits, escrow allocations, and fund releases across all accounts.</p>
                        </div>
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
                    <>
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Email Tools Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* CSV Download Card */}
                                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
                                            <Download className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[var(--text-primary)] text-sm">Export Email Lists</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Download as CSV</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'All Users', role: 'all', color: 'bg-spark-black text-white hover:bg-gray-800' },
                                            { label: 'Creators', role: 'Creator', color: 'bg-spark-red/10 text-spark-red border border-spark-red/20 hover:bg-spark-red hover:text-white' },
                                            { label: 'Brands', role: 'Brand', color: 'bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white' },
                                            { label: 'Associations', role: 'Association', color: 'bg-green-500/10 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white' },
                                        ].map(({ label, role: r, color }) => (
                                            <button
                                                key={r}
                                                onClick={() => handleDownloadEmails(r)}
                                                disabled={csvDownloading !== null}
                                                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60 ${color}`}
                                            >
                                                {csvDownloading === r ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Download className="w-3 h-3" />
                                                )}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Email Blast Card */}
                                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-spark-red/10 text-spark-red rounded-xl flex items-center justify-center">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[var(--text-primary)] text-sm">Send Email Blast</h4>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">Broadcast to user segments</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] font-medium mb-4 leading-relaxed">Compose and send a custom email to all users or a specific role group instantly.</p>
                                    <button
                                        onClick={() => { setShowEmailBlast(true); setEmailBlastResult(null); setEmailBlastForm({ subject: '', title: '', body: '', role: 'all' }); }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-spark-red text-white font-black rounded-xl text-xs uppercase tracking-wider hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-100"
                                    >
                                        <Send className="w-4 h-4" /> Compose & Send
                                    </button>
                                </div>
                            </div>

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
                                                            (u.role?.includes('Creator')) ? 'bg-spark-red/10 text-spark-red border-spark-red/20' : 
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

                        {/* Email Blast Modal */}
                        {showEmailBlast && (
                            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                                <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] max-w-2xl w-full relative animate-in zoom-in-95 duration-300 shadow-2xl my-4">
                                    <button
                                        onClick={() => { setShowEmailBlast(false); setBlastAttachments([]); setBlastBodyHtml(''); }}
                                        className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-spark-red hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-spark-red/10 text-spark-red rounded-2xl flex items-center justify-center">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Email Broadcast</h3>
                                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">Admin-to-platform communication</p>
                                        </div>
                                    </div>

                                    {emailBlastResult ? (
                                        <div className="text-center py-8 space-y-4">
                                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                                <CheckCircle className="w-10 h-10" />
                                            </div>
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">Blast Sent!</h4>
                                            <div className="grid grid-cols-3 gap-3 mt-4">
                                                <div className="p-4 bg-green-50 rounded-2xl text-center">
                                                    <p className="text-2xl font-black text-green-600">{emailBlastResult.sent}</p>
                                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Sent</p>
                                                </div>
                                                <div className="p-4 bg-red-50 rounded-2xl text-center">
                                                    <p className="text-2xl font-black text-red-600">{emailBlastResult.failed}</p>
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Failed</p>
                                                </div>
                                                <div className="p-4 bg-[var(--bg-secondary)] rounded-2xl text-center">
                                                    <p className="text-2xl font-black text-[var(--text-primary)]">{emailBlastResult.total}</p>
                                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Total</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setShowEmailBlast(false); setEmailBlastResult(null); setBlastAttachments([]); setBlastBodyHtml(''); }}
                                                className="mt-4 px-6 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-600 transition-all text-sm uppercase tracking-widest"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleEmailBlast} className="space-y-5">
                                            {/* Audience */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Target Audience</label>
                                                    <select
                                                        value={emailBlastForm.role}
                                                        onChange={e => setEmailBlastForm({...emailBlastForm, role: e.target.value})}
                                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-bold text-sm focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                                    >
                                                        <option value="all">All Users</option>
                                                        <option value="Creator">Creators Only</option>
                                                        <option value="Brand">Brands Only</option>
                                                        <option value="Association">Associations Only</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Email Subject</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={emailBlastForm.subject}
                                                        onChange={e => setEmailBlastForm({...emailBlastForm, subject: e.target.value})}
                                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-sm focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                                        placeholder="e.g. Important Update"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Email Headline</label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={emailBlastForm.title}
                                                    onChange={e => setEmailBlastForm({...emailBlastForm, title: e.target.value})}
                                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-sm focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                                    placeholder="e.g. Exciting news for our community!"
                                                />
                                            </div>

                                            {/* Rich Text Editor */}
                                            <div>
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Message Body</label>
                                                {/* Formatting Toolbar */}
                                                <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t-xl border-b-0">
                                                    {[
                                                        { cmd: 'bold', label: <span className="font-black text-sm">B</span>, title: 'Bold' },
                                                        { cmd: 'italic', label: <span className="italic text-sm">I</span>, title: 'Italic' },
                                                        { cmd: 'underline', label: <span className="underline text-sm">U</span>, title: 'Underline' },
                                                    ].map(({ cmd, label, title }) => (
                                                        <button
                                                            key={cmd}
                                                            type="button"
                                                            title={title}
                                                            onMouseDown={ev => { ev.preventDefault(); execBlastFormat(cmd); }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-spark-red/10 hover:text-spark-red text-[var(--text-primary)] transition-all"
                                                        >{label}</button>
                                                    ))}
                                                    <div className="w-px h-5 bg-[var(--border-color)] mx-1" />
                                                    {[
                                                        { cmd: 'insertParagraph', label: '¶', title: 'Paragraph' },
                                                        { cmd: 'insertUnorderedList', label: '• List', title: 'Bullet List' },
                                                        { cmd: 'insertOrderedList', label: '1. List', title: 'Numbered List' },
                                                    ].map(({ cmd, label, title }) => (
                                                        <button
                                                            key={cmd}
                                                            type="button"
                                                            title={title}
                                                            onMouseDown={ev => { ev.preventDefault(); execBlastFormat(cmd); }}
                                                            className="px-2 h-8 flex items-center justify-center rounded-lg hover:bg-spark-red/10 hover:text-spark-red text-[var(--text-primary)] text-xs font-bold transition-all"
                                                        >{label}</button>
                                                    ))}
                                                    <div className="w-px h-5 bg-[var(--border-color)] mx-1" />
                                                    <select
                                                        className="h-8 px-2 text-xs bg-transparent text-[var(--text-secondary)] font-bold rounded-lg hover:bg-spark-red/10 cursor-pointer outline-none border-none"
                                                        defaultValue=""
                                                        onChange={e => { if (e.target.value) execBlastFormat('fontSize', e.target.value); e.target.value = ''; }}
                                                        title="Font Size"
                                                    >
                                                        <option value="" disabled>Size</option>
                                                        <option value="1">Small</option>
                                                        <option value="3">Normal</option>
                                                        <option value="5">Large</option>
                                                        <option value="7">Huge</option>
                                                    </select>
                                                    <select
                                                        className="h-8 px-2 text-xs bg-transparent text-[var(--text-secondary)] font-bold rounded-lg hover:bg-spark-red/10 cursor-pointer outline-none border-none"
                                                        defaultValue=""
                                                        onChange={e => { if (e.target.value) execBlastFormat('foreColor', e.target.value); e.target.value = ''; }}
                                                        title="Text Colour"
                                                    >
                                                        <option value="" disabled>Color</option>
                                                        <option value="#111111">Black</option>
                                                        <option value="#e53e3e">Red</option>
                                                        <option value="#2563eb">Blue</option>
                                                        <option value="#16a34a">Green</option>
                                                        <option value="#d97706">Orange</option>
                                                    </select>
                                                </div>
                                                {/* Editable area */}
                                                <div
                                                    ref={blastEditorRef}
                                                    contentEditable
                                                    suppressContentEditableWarning
                                                    onInput={() => setBlastBodyHtml(blastEditorRef.current?.innerHTML || '')}
                                                    data-placeholder="Write your message here. Use the toolbar above to format text."
                                                    className="min-h-[160px] w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-b-xl text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-spark-red/20 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--text-secondary)] [&:empty]:before:pointer-events-none leading-relaxed"
                                                    style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}
                                                />
                                            </div>

                                            {/* Attachment Upload */}
                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Attachments <span className="normal-case text-[9px] font-medium">(Images, Videos, Files — uploaded to Firebase)</span></label>
                                                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${ blastAttachUploading ? 'opacity-50 cursor-wait' : 'border-[var(--border-color)] hover:border-spark-red/40 hover:bg-spark-red/5' }`}>
                                                    {blastAttachUploading ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin text-spark-red" /><span className="text-xs font-bold text-[var(--text-secondary)]">Uploading...</span></>
                                                    ) : (
                                                        <><Plus className="w-4 h-4 text-spark-red" /><span className="text-xs font-bold text-[var(--text-secondary)]">Add Image / Video / File</span></>
                                                    )}
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                                                        onChange={handleBlastAttachment}
                                                        className="hidden"
                                                        disabled={blastAttachUploading}
                                                    />
                                                </label>
                                                {/* Attachment previews */}
                                                {blastAttachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {blastAttachments.map((att, idx) => (
                                                            <div key={idx} className="relative group flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-xs font-bold text-[var(--text-primary)] max-w-[180px]">
                                                                {att.type.startsWith('image/') ? (
                                                                    <img src={att.url} alt={att.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                                                ) : att.type.startsWith('video/') ? (
                                                                    <span className="text-base">🎬</span>
                                                                ) : (
                                                                    <span className="text-base">📎</span>
                                                                )}
                                                                <span className="truncate text-[10px]">{att.name}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBlastAttachments(prev => prev.filter((_, i) => i !== idx))}
                                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >✕</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                <p className="text-[11px] font-bold text-amber-700">This will send a real email to every {emailBlastForm.role === 'all' ? 'user' : emailBlastForm.role} on the platform. Double-check before sending.</p>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={emailBlastLoading || blastAttachUploading}
                                                className="w-full flex items-center justify-center gap-2 py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100/50 uppercase tracking-widest text-sm disabled:opacity-60"
                                            >
                                                {emailBlastLoading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                                                ) : (
                                                    <><Send className="w-4 h-4" /> Send Email Blast</>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                );
            case 'withdrawals':
                const pendingWithdrawals = allTransactions.filter(t => t.type === 'debit' && t.status === 'pending');
                return (
                    <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Withdrawal Management Portal</h3>
                                <p className="text-[var(--text-secondary)] font-bold text-sm mt-1 mb-8">Process pending withdrawal requests, review creator bank details, and verify manual payments.</p>
                            </div>
                            {pendingWithdrawals.length === 0 ? (
                                <DashboardPlaceholder
                                    title="No pending withdrawals"
                                    icon={<Wallet className="w-10 h-10" />}
                                    description="All withdrawal requests have been processed. Great job!"
                                />
                            ) : (
                                pendingWithdrawals.map((t) => (
                                    <div key={t.id} className="p-8 bg-[var(--bg-secondary)] rounded-[2.5rem] border border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-[var(--bg-primary)] hover:shadow-2xl transition-all duration-300">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-spark-red/10 text-spark-red rounded-2xl flex items-center justify-center text-2xl font-black">
                                                ₦
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[var(--text-primary)] mb-1">₦{Number(t.amount).toLocaleString()}</h4>
                                                <p className="text-sm font-bold text-[var(--text-secondary)]">{t.userName || 'Unknown User'} ({t.userEmail || 'No email'})</p>
                                                <div className="flex flex-wrap gap-3 mt-2">
                                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-100">
                                                        {t.bankName || 'No Bank'} • {t.accountNumber || 'No Account'}
                                                    </div>
                                                    <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-green-100">
                                                        {t.accountName || 'No Name'}
                                                    </div>
                                                    <div className="px-3 py-1 bg-spark-black/5 text-spark-black text-[10px] font-black rounded-lg uppercase tracking-widest">
                                                        {new Date(t.createdAt?.seconds ? t.createdAt.seconds * 1000 : t.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setSelectedWithdrawal(t)}
                                                className="px-6 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-black rounded-xl hover:bg-[var(--border-color)] transition-all text-xs uppercase tracking-widest"
                                            >
                                                View Details
                                            </button>
                                            <button 
                                                onClick={() => handleApproveWithdrawal(t.id)}
                                                className="px-6 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-xs uppercase tracking-widest shadow-lg shadow-green-900/20"
                                            >
                                                Disburse
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Disbursal History */}
                        <div className="mt-16 space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Disbursal History</h3>
                                <div className="px-4 py-2 bg-spark-black text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                                    Total Disbursed: ₦{allTransactions.filter(t => t.type === 'debit' && t.status === 'completed').reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toLocaleString()}
                                </div>
                            </div>
                            
                            <div className="overflow-hidden border border-[var(--border-color)] rounded-[2.5rem] bg-[var(--bg-secondary)]/30">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Recipient</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Amount</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allTransactions.filter(t => t.type === 'debit' && (t.status === 'completed' || t.status === 'rejected')).slice(0, 10).map((t) => (
                                            <tr key={t.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-sm text-[var(--text-primary)]">{t.userName || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-secondary)]">{t.bankName || '---'} • {t.accountNumber || '---'}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-spark-red">₦{Number(t.amount).toLocaleString()}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-[var(--text-secondary)]">{t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                        t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {allTransactions.filter(t => t.type === 'debit' && (t.status === 'completed' || t.status === 'rejected')).length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-10 text-center text-[var(--text-secondary)] italic font-medium">No disbursal history found.</td>
                                            </tr>
                                        )}
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
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)]">Partnership Monitor</h3>
                                <p className="text-[var(--text-secondary)] font-bold text-sm mt-1 mb-8">Audit and monitor all custom sponsorship pitches and campaign bids submitted across the platform.</p>
                            </div>
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

            case 'branding':
                return (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-primary)] p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Site Configuration</h3>
                            <p className="text-[var(--text-secondary)] font-bold text-sm mb-10">Configure global branding settings including site title, abbreviated name, favicon link, and active logo.</p>

                            <div className="grid md:grid-cols-3 gap-8">
                                <form onSubmit={handleSaveBranding} className="space-y-6 md:col-span-2">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Site Title (Browser Tab)</label>
                                        <input
                                            required
                                            type="text"
                                            value={brandingForm.title}
                                            onChange={e => setBrandingForm({ ...brandingForm, title: e.target.value })}
                                            className="w-full px-5 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-spark-red/20 transition-all text-[var(--text-primary)]"
                                            placeholder="e.g. ABC-Rally by Campus Himpact Hub"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">App Abbreviated Name</label>
                                        <input
                                            required
                                            type="text"
                                            value={brandingForm.abbrev}
                                            onChange={e => setBrandingForm({ ...brandingForm, abbrev: e.target.value })}
                                            className="w-full px-5 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-spark-red/20 transition-all text-[var(--text-primary)]"
                                            placeholder="e.g. ABC-Rally"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Favicon</label>
                                        <div className="flex items-center gap-4">
                                            {brandingForm.favicon && (
                                                <img src={brandingForm.favicon} alt="Favicon" className="w-8 h-8 rounded-lg object-contain border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1" onError={(e) => { (e.target as any).style.display='none'; }} />
                                            )}
                                            <label className="flex-1 cursor-pointer">
                                                <div className={`w-full px-5 py-4 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl text-sm font-semibold text-[var(--text-secondary)] text-center hover:border-spark-red/40 hover:text-spark-red transition-all ${ faviconUploading ? 'opacity-50 pointer-events-none' : '' }`}>
                                                    {faviconUploading ? `Uploading... ${faviconUploadProgress}%` : (brandingForm.favicon ? '↑ Replace Favicon' : '↑ Upload Favicon (.ico, .png, .svg)')}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept=".ico,.png,.svg,.webp"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, 'favicons', setFaviconUploadProgress, (url) => setBrandingForm(prev => ({ ...prev, favicon: url })), setFaviconUploading);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3">Logo</label>
                                        <div className="flex gap-2 mb-3">
                                            <button type="button" onClick={() => setBrandingForm(prev => ({ ...prev, logoType: 'icon', logoValue: '' }))} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${ brandingForm.logoType === 'icon' ? 'bg-spark-red text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-spark-red/40 border border-[var(--border-color)]' }`}>Icon</button>
                                            <button type="button" onClick={() => setBrandingForm(prev => ({ ...prev, logoType: 'image', logoValue: '' }))} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${ brandingForm.logoType === 'image' ? 'bg-spark-red text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-spark-red/40 border border-[var(--border-color)]' }`}>Upload Image</button>
                                        </div>
                                        {brandingForm.logoType === 'icon' ? (
                                            <input
                                                type="text"
                                                value={brandingForm.logoValue}
                                                onChange={e => setBrandingForm({ ...brandingForm, logoValue: e.target.value })}
                                                className="w-full px-5 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-spark-red/20 transition-all text-[var(--text-primary)]"
                                                placeholder="e.g. Megaphone, Sparkles, Activity"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                {brandingForm.logoValue && (
                                                    <img src={brandingForm.logoValue} alt="Logo Preview" className="w-12 h-12 rounded-2xl object-contain border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2" onError={(e) => { (e.target as any).style.display='none'; }} />
                                                )}
                                                <label className="flex-1 cursor-pointer">
                                                    <div className={`w-full px-5 py-4 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl text-sm font-semibold text-[var(--text-secondary)] text-center hover:border-spark-red/40 hover:text-spark-red transition-all ${ logoUploading ? 'opacity-50 pointer-events-none' : '' }`}>
                                                        {logoUploading ? `Uploading... ${logoUploadProgress}%` : (brandingForm.logoValue ? '↑ Replace Logo Image' : '↑ Upload Logo Image')}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept=".png,.svg,.jpg,.jpeg,.webp"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageUpload(file, 'logos', setLogoUploadProgress, (url) => setBrandingForm(prev => ({ ...prev, logoValue: url })), setLogoUploading);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Landing Page Hero Image</label>
                                        <div className="flex items-center gap-4">
                                            {brandingForm.landingImage && (
                                                <img src={brandingForm.landingImage} alt="Landing Page Hero Preview" className="w-16 h-12 rounded-xl object-cover border border-[var(--border-color)] bg-[var(--bg-secondary)]" onError={(e) => { (e.target as any).style.display='none'; }} />
                                            )}
                                            <label className="flex-1 cursor-pointer">
                                                <div className={`w-full px-5 py-4 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl text-sm font-semibold text-[var(--text-secondary)] text-center hover:border-spark-red/40 hover:text-spark-red transition-all ${ landingImageUploading ? 'opacity-50 pointer-events-none' : '' }`}>
                                                    {landingImageUploading ? `Uploading... ${landingImageUploadProgress}%` : (brandingForm.landingImage ? '↑ Replace Landing Image' : '↑ Upload Landing Image')}
                                                </div>
                                                <input
                                                    type="file"
                                                    accept=".png,.svg,.jpg,.jpeg,.webp"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleImageUpload(file, 'landing_images', setLandingImageUploadProgress, (url) => setBrandingForm(prev => ({ ...prev, landingImage: url })), setLandingImageUploading);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingBranding}
                                        className="w-full py-4.5 bg-gradient-red text-white font-black rounded-2xl hover:shadow-xl hover:shadow-spark-red/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs disabled:opacity-50"
                                    >
                                        {savingBranding ? 'Saving Settings...' : 'Save Configuration'}
                                    </button>
                                </form>

                                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-8 rounded-[2.5rem] flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-6">Live Branding Preview</h4>
                                        
                                        <div className="space-y-6">
                                            <div className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center min-h-[100px]">
                                                <div className="flex items-center gap-2">
                                                    {brandingForm.logoType === 'image' && brandingForm.logoValue ? (
                                                        <img src={brandingForm.logoValue} className="w-8 h-8 object-contain text-spark-red" alt="Preview" onError={(e) => { (e.target as any).src = 'https://placehold.co/32?text=Error'; }} />
                                                    ) : (
                                                        (() => {
                                                            const IconComp = (LucideIcons as any)[brandingForm.logoValue] || Megaphone;
                                                            return <IconComp className="w-8 h-8 text-spark-red" />;
                                                        })()
                                                    )}
                                                    <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter">{brandingForm.abbrev || 'AppName'}</span>
                                                </div>
                                            </div>

                                            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-4 text-xs font-semibold space-y-2">
                                                <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">Browser Tab Simulation</p>
                                                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                                                    <img src={brandingForm.favicon || '/vite.svg'} className="w-3.5 h-3.5 object-contain" alt="Favicon" onError={(e) => { (e.target as any).src = '/vite.svg'; }} />
                                                    <span className="truncate text-[var(--text-primary)] font-bold text-[10px]">{brandingForm.title || 'ABC-Rally'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-[var(--border-color)] text-[10px] text-[var(--text-secondary)] font-bold leading-relaxed">
                                        * Saving will update the settings in real-time. All users currently browsing the website will see the changes instantly.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'blogs':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Blog Manager</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Create and manage content for the platform.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setBlogFormData({ title: '', excerpt: '', content: '', imageUrl: '', status: 'published', id: '' });
                                        setShowBlogModal(true);
                                    }}
                                    className="px-6 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> New Post
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Title</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allBlogs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-10 text-center text-[var(--text-secondary)] font-bold italic">No blog posts yet.</td>
                                            </tr>
                                        ) : (
                                            allBlogs.map((b) => (
                                                <tr key={b.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <p className="font-black text-[var(--text-primary)]">{b.title}</p>
                                                        <p className="text-xs text-[var(--text-secondary)] truncate max-w-md mt-1">{b.excerpt}</p>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                            b.status === 'published' ? 'bg-green-500/10 text-green-600' : 'bg-gray-200 text-gray-600'
                                                        }`}>
                                                            {b.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-xs text-[var(--text-secondary)] font-bold">
                                                        {b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button 
                                                            onClick={() => {
                                                                setBlogFormData({ ...b });
                                                                setShowBlogModal(true);
                                                            }} 
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        >
                                                            <Edit className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteBlog(b.id)} 
                                                            className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all ml-2"
                                                        >
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

                        {/* Blog Form Modal */}
                        {showBlogModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
                                    <button onClick={() => setShowBlogModal(false)} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-spark-red hover:bg-red-50 rounded-full transition-all">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6">{blogFormData.id ? 'Edit' : 'Create'} Blog Post</h3>
                                    
                                    <form onSubmit={handleSaveBlog} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Title</label>
                                            <input 
                                                required 
                                                type="text" 
                                                value={blogFormData.title} 
                                                onChange={e => setBlogFormData({...blogFormData, title: e.target.value})}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Excerpt</label>
                                            <input 
                                                required 
                                                type="text" 
                                                value={blogFormData.excerpt} 
                                                onChange={e => setBlogFormData({...blogFormData, excerpt: e.target.value})}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none"
                                                placeholder="Short summary for the blog list"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Image URL</label>
                                            <input 
                                                type="text" 
                                                value={blogFormData.imageUrl} 
                                                onChange={e => setBlogFormData({...blogFormData, imageUrl: e.target.value})}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Status</label>
                                            <select 
                                                value={blogFormData.status} 
                                                onChange={e => setBlogFormData({...blogFormData, status: e.target.value})}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Content (Markdown/Text)</label>
                                            <textarea 
                                                required 
                                                rows={10}
                                                value={blogFormData.content} 
                                                onChange={e => setBlogFormData({...blogFormData, content: e.target.value})}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none resize-none"
                                                placeholder="Write your blog content here..."
                                            />
                                        </div>
                                        
                                        <button type="submit" className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 uppercase tracking-widest text-sm">
                                            {blogFormData.id ? 'Update Post' : 'Publish Post'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'testimonials':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Testimonials Manager</h3>
                                    <p className="text-[var(--text-secondary)] font-bold text-sm">Add or remove testimonials displayed on the homepage.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setTestimonialFormData({ id: '', quote: '', name: '', title: '' });
                                        setShowTestimonialModal(true);
                                    }}
                                    className="px-6 py-3 bg-spark-red hover:bg-red-600 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Plus className="w-4 h-4" /> Add Testimonial
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--bg-secondary)]/50">
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Quote</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Name</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Title / Role</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {allTestimonials.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-[var(--text-secondary)] font-bold italic">No testimonials added yet. Click &quot;Add Testimonial&quot; to get started.</td>
                                            </tr>
                                        ) : (
                                            allTestimonials.map((t) => (
                                                <tr key={t.id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors group">
                                                    <td className="px-8 py-5 max-w-xs">
                                                        <p className="text-sm text-[var(--text-primary)] italic line-clamp-2">"{t.quote}"</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="font-black text-[var(--text-primary)] text-sm">{t.name}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-[10px] font-black text-spark-red uppercase tracking-widest">{t.title}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setTestimonialFormData({ id: t.id, quote: t.quote || '', name: t.name || '', title: t.title || '' });
                                                                    setShowTestimonialModal(true);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                            >
                                                                <Edit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTestimonial(t.id)}
                                                                className="p-2 text-gray-400 hover:text-spark-red hover:bg-red-50 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Testimonial Form Modal */}
                        {showTestimonialModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] max-w-lg w-full relative animate-in zoom-in-95 duration-300">
                                    <button onClick={() => setShowTestimonialModal(false)} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-spark-red hover:bg-red-50 rounded-full transition-all">
                                        <XCircle className="w-6 h-6" />
                                    </button>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6">{testimonialFormData.id ? 'Edit' : 'Add'} Testimonial</h3>
                                    <form onSubmit={handleSaveTestimonial} className="space-y-5">
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Quote / Review</label>
                                            <textarea
                                                required
                                                rows={4}
                                                value={testimonialFormData.quote}
                                                onChange={e => setTestimonialFormData({ ...testimonialFormData, quote: e.target.value })}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none resize-none text-[var(--text-primary)]"
                                                placeholder="What did they say about ABC-Rally?"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Full Name</label>
                                            <input
                                                required
                                                type="text"
                                                value={testimonialFormData.name}
                                                onChange={e => setTestimonialFormData({ ...testimonialFormData, name: e.target.value })}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                                placeholder="e.g. Adebayo Okafor"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-2">Title / Role</label>
                                            <input
                                                required
                                                type="text"
                                                value={testimonialFormData.title}
                                                onChange={e => setTestimonialFormData({ ...testimonialFormData, title: e.target.value })}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                                placeholder="e.g. Brand Manager, GTBank"
                                            />
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100/50 uppercase tracking-widest text-sm">
                                            {testimonialFormData.id ? 'Update Testimonial' : 'Add to Homepage'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'disputes':
                return (
                    <DisputesPanel
                        userRole="Admin"
                        userId={auth.currentUser?.uid}
                        userProfile={null}
                        onNavigate={onNavigate}
                        preSelectedEntity={preSelectedDisputeEntity}
                        onClearPreSelected={() => setPreSelectedDisputeEntity(null)}
                    />
                );

            case 'platform_reviews':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Platform Reviews</h2>
                            <p className="text-[var(--text-secondary)] font-medium mt-1">Feedback and reviews submitted by brands, creators, and associations.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {platformReviews.length === 0 ? (
                                <div className="col-span-full text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] text-[var(--text-secondary)] font-bold italic">
                                    No platform reviews submitted yet.
                                </div>
                            ) : (
                                platformReviews.map((r) => (
                                    <div key={r.id} className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm space-y-4 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-[var(--text-primary)] text-base">{r.userName || 'Anonymous'}</h4>
                                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${
                                                    r.userRole === 'Brand' ? 'bg-spark-red/10 text-spark-red' : 
                                                    r.userRole === 'Creator' ? 'bg-spark-black text-white' : 
                                                    'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                                }`}>
                                                    {r.userRole || 'User'}
                                                </span>
                                            </div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <LucideIcons.Star 
                                                        key={i} 
                                                        className={`w-4 h-4 ${i < (r.stars || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-color)]'}`} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] font-medium italic leading-relaxed">
                                            "{r.reviewText || 'No comment provided.'}"
                                        </p>
                                        <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pt-2 border-t border-[var(--border-color)]">
                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'support':
                return (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-[var(--text-primary)]">Support Inbox</h2>
                                <p className="text-[var(--text-secondary)] font-medium mt-1">Manage and respond to user support tickets.</p>
                            </div>
                            <div className="flex gap-3">
                                <span className="px-4 py-2 bg-spark-red/10 text-spark-red text-xs font-black uppercase tracking-widest rounded-xl border border-spark-red/20">
                                    {supportTickets.filter(t => t.status === 'open').length} Open
                                </span>
                                <span className="px-4 py-2 bg-green-500/10 text-green-700 text-xs font-black uppercase tracking-widest rounded-xl border border-green-500/20">
                                    {supportTickets.filter(t => t.status === 'responded').length} Responded
                                </span>
                            </div>
                        </div>

                        {selectedTicket ? (
                            <div className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-8 space-y-6">
                                <button onClick={() => { setSelectedTicket(null); setReplyBody(''); }} className="text-xs font-black text-spark-red uppercase tracking-widest hover:underline flex items-center gap-1">← Back to Inbox</button>
                                <div className="border-b border-[var(--border-color)] pb-6">
                                    <div className="flex justify-between items-start flex-wrap gap-4">
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)]">{selectedTicket.name}</h3>
                                            <p className="text-xs text-spark-red font-black uppercase tracking-widest mt-1">{selectedTicket.enquiryType?.replace(/-/g, ' ')}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedTicket.status === 'responded' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-spark-red/10 text-spark-red border border-spark-red/20'}`}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>
                                    <div className="grid sm:grid-cols-3 gap-4 mt-4 text-xs text-[var(--text-secondary)] font-medium">
                                        <p><span className="font-black text-[var(--text-primary)]">Email:</span> {selectedTicket.email}</p>
                                        <p><span className="font-black text-[var(--text-primary)]">Phone:</span> {selectedTicket.phone || 'N/A'}</p>
                                        <p><span className="font-black text-[var(--text-primary)]">User Type:</span> {selectedTicket.userType}</p>
                                        <p><span className="font-black text-[var(--text-primary)]">Organisation:</span> {selectedTicket.organisation || 'N/A'}</p>
                                        <p><span className="font-black text-[var(--text-primary)]">Callback:</span> {selectedTicket.callbackTime}</p>
                                        <p><span className="font-black text-[var(--text-primary)]">Submitted:</span> {selectedTicket.createdAt?.seconds ? new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Message</p>
                                    <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                                </div>
                                {selectedTicket.status !== 'responded' && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Send Reply to {selectedTicket.email}</p>
                                        <textarea
                                            value={replyBody}
                                            onChange={e => setReplyBody(e.target.value)}
                                            placeholder="Type your reply here..."
                                            className="w-full px-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl outline-none font-medium text-[var(--text-primary)] focus:border-spark-red min-h-[120px] resize-none"
                                        />
                                        <button
                                            disabled={!replyBody.trim() || replyLoading}
                                            onClick={async () => {
                                                if (!replyBody.trim()) return;
                                                const targetEmail = selectedTicket.email || selectedTicket.userEmail || selectedTicket.createdByEmail || '';
                                                if (!targetEmail) {
                                                    alert('Cannot send email reply: No email address found for this support ticket.');
                                                    return;
                                                }
                                                setReplyLoading(true);
                                                try {
                                                    const res = await fetch(`${BACKEND_URL}/api/email/notify`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            type: 'generic',
                                                            to: targetEmail,
                                                            subject: `Re: Your ABC-Rally Support Request — ${selectedTicket.enquiryType?.replace(/-/g, ' ') || 'General'}`,
                                                            title: 'Response to Your Support Request',
                                                            body: replyBody
                                                        }),
                                                    });
                                                    if (!res.ok) {
                                                        const errData = await res.json().catch(() => ({}));
                                                        throw new Error(errData.error || `Server responded with status ${res.status}`);
                                                    }
                                                    try {
                                                        await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: 'responded', respondedAt: new Date().toISOString(), replyBody });
                                                    } catch (fsErr) {
                                                        console.warn('Firestore support_tickets update warning:', fsErr);
                                                    }
                                                    setSupportTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'responded', replyBody } : t));
                                                    setSelectedTicket({ ...selectedTicket, status: 'responded', replyBody });
                                                    setReplyBody('');
                                                    alert(`Reply sent successfully to ${targetEmail}!`);
                                                } catch (err: any) {
                                                    console.error('Failed to send support ticket reply email:', err);
                                                    alert('Failed to send reply email: ' + (err?.message || 'Could not reach email server.'));
                                                } finally {
                                                    setReplyLoading(false);
                                                }
                                            }}
                                            className="px-8 py-3 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {replyLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Reply</>}
                                        </button>
                                    </div>
                                )}
                                {selectedTicket.status === 'responded' && (
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <p className="text-sm font-bold text-green-700">This ticket has been responded to. A reply was sent to {selectedTicket.email}.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            supportTickets.length === 0 ? (
                                <div className="text-center py-24 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                                    <HelpCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">No Support Tickets</h3>
                                    <p className="text-[var(--text-secondary)]">When users submit the support/contact form, tickets will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {supportTickets.map(ticket => (
                                        <div key={ticket.id} className="bg-[var(--bg-primary)] rounded-[2rem] border border-[var(--border-color)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-spark-red/30 transition-all cursor-pointer group" onClick={() => { setSelectedTicket(ticket); setReplyBody(''); }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-spark-red/10 rounded-2xl flex items-center justify-center text-spark-red font-black text-lg flex-shrink-0">
                                                    {ticket.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[var(--text-primary)] group-hover:text-spark-red transition-colors">{ticket.name}</h4>
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">{ticket.email} · {ticket.userType}</p>
                                                    <p className="text-[10px] text-spark-red font-black uppercase tracking-widest mt-1">{ticket.enquiryType?.replace(/-/g, ' ')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${ticket.status === 'responded' ? 'bg-green-500/10 text-green-700 border border-green-500/20' : 'bg-spark-red/10 text-spark-red border border-spark-red/20'}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-xs text-[var(--text-secondary)] font-medium">{ticket.createdAt?.seconds ? new Date(ticket.createdAt.seconds * 1000).toLocaleDateString() : ''}</span>
                                                <ArrowRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-spark-red transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                );

            case 'overview':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">Platform Overview</h2>
                            <p className="text-[var(--text-secondary)] font-bold text-sm mt-1">System monitoring panel showing vital registration stats, payment operations, and network health.</p>
                        </div>
                        {/* â”€â”€ High-Level Vital Stats â”€â”€ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Active Network', value: stats?.users, sub: 'Total Participants', icon: <Users className="w-6 h-6" />, color: 'bg-spark-red text-white' },
                                { label: 'Platform Escrow', value: `₦${(stats?.totalEscrow || 0).toLocaleString()}`, sub: 'Secured Funds', icon: <Shield className="w-6 h-6" />, color: 'bg-blue-600 text-white' },
                                { label: 'Campaign Hub', value: stats?.gigs, sub: `${stats?.activeGigs} Currently Active`, icon: <Megaphone className="w-6 h-6" />, color: 'bg-green-600 text-white' },
                                { label: 'Events', value: stats?.events, sub: 'Live Experiences', icon: <Calendar className="w-6 h-6" />, color: 'bg-spark-black text-white' },
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
                                                            (role.includes('Creator')) ? 'bg-spark-red' : 'bg-green-600'
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
            role={'Admin'}
            activeView={currentView}
            onViewChange={setCurrentView}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName="Administrator"
            userSub="System Monitor"
            userId={user?.id || user?.uid}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
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
                        <p className="text-[var(--text-secondary)] font-bold text-lg mt-1 capitalize">Monitoring {currentView} state across the ABC-Rally network.</p>
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
                                                    ₦{(() => {
                                                        const activeTransactions = userDetailData.transactions.filter(t => isTransactionActive(t, userDetailData.allocations || []));
                                                        return activeTransactions.reduce((acc, t) => {
                                                            if (selectedUserDetail.role === 'Brand') {
                                                                return acc + (t.type === 'debit' ? (Number(t.amount) || 0) : 0);
                                                            } else {
                                                                return acc + (t.type === 'credit' && t.status === 'completed' ? (Number(t.amount) || 0) : 0);
                                                            }
                                                        }, 0).toLocaleString();
                                                    })()}
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
                                                    {(() => {
                                                         const activeTransactions = userDetailData.transactions.filter(t => isTransactionActive(t, userDetailData.allocations || []));
                                                         if (activeTransactions.length === 0) {
                                                             return <p className="text-sm font-bold text-[var(--text-secondary)] italic">No financial activity recorded for this user.</p>;
                                                         }
                                                         return activeTransactions.slice(0, 5).map((t, idx) => (
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
                                                         ));
                                                      })()}
                                                </div>
                                            </div>

                                            {/* Creator Commercial Profile & WhatsApp Audience Review (Section 9.3) */}
                                            {selectedUserDetail.role === 'Creator' && (
                                                <div className="p-8 bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] space-y-6 text-left">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-4">
                                                        <div>
                                                            <span className="text-[10px] font-black text-spark-red uppercase tracking-widest">Creator Profile Review</span>
                                                            <h4 className="text-xl font-black text-[var(--text-primary)]">Commercial & Audience Claims</h4>
                                                        </div>
                                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                                                            selectedUserDetail.reviewStatus === 'approved'
                                                                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                                                : selectedUserDetail.reviewStatus === 'needs_update'
                                                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                                                : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                                                        }`}>
                                                            {selectedUserDetail.reviewStatus === 'approved' ? '✓ Approved' : selectedUserDetail.reviewStatus === 'needs_update' ? '⚠ Needs Update' : '⏳ Ready for Review'}
                                                        </span>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-4 text-xs font-medium">
                                                        <div>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Headline</p>
                                                            <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedUserDetail.professionalHeadline || 'None declared'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Location & Reach</p>
                                                            <p className="font-bold text-[var(--text-primary)] mt-0.5">{selectedUserDetail.city ? `${selectedUserDetail.city}, ${selectedUserDetail.state}` : (selectedUserDetail.location || 'Not set')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Capabilities & Primary</p>
                                                            <p className="font-bold text-[var(--text-primary)] mt-0.5">{(selectedUserDetail.capabilities || []).join(', ') || 'None'} (Primary: {selectedUserDetail.primaryCapability || 'None'})</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Starting Price & Basis</p>
                                                            <p className="font-bold text-[var(--text-primary)] mt-0.5">
                                                                {selectedUserDetail.pricingNegotiable ? 'Negotiable' : `₦${Number(selectedUserDetail.startingPrice || 0).toLocaleString()}`} ({selectedUserDetail.pricingBasis || 'Per project'})
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* WhatsApp Media & Evidence Section */}
                                                    {(selectedUserDetail.whatsappMediaName || selectedUserDetail.whatsappAudienceEvidence) && (
                                                        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-4">
                                                            <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
                                                                <h5 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                                                                    📻 WhatsApp Audience Claims
                                                                </h5>
                                                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">
                                                                    {selectedUserDetail.whatsappMediaType || 'Media Provider'}
                                                                </span>
                                                            </div>
                                                            <div className="grid sm:grid-cols-3 gap-3 text-xs">
                                                                <div>
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Media Name</p>
                                                                    <p className="font-bold text-[var(--text-primary)]">{selectedUserDetail.whatsappMediaName || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Campus Coverage</p>
                                                                    <p className="font-bold text-[var(--text-primary)]">{selectedUserDetail.whatsappCampusCoverage || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Audience Category</p>
                                                                    <p className="font-bold text-[var(--text-primary)]">{selectedUserDetail.whatsappPrimaryAudience || 'N/A'}</p>
                                                                </div>
                                                                {selectedUserDetail.whatsappAverageStatusViews !== undefined && (
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Declared Status Views</p>
                                                                        <p className="font-black text-green-600 dark:text-green-400">{Number(selectedUserDetail.whatsappAverageStatusViews).toLocaleString()} views</p>
                                                                    </div>
                                                                )}
                                                                {selectedUserDetail.whatsappChannelFollowers !== undefined && (
                                                                    <div>
                                                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Channel Followers</p>
                                                                        <p className="font-black text-green-600 dark:text-green-400">{Number(selectedUserDetail.whatsappChannelFollowers).toLocaleString()} followers</p>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">Placement Rate</p>
                                                                    <p className="font-bold text-[var(--text-primary)]">₦{Number(selectedUserDetail.whatsappRatePerPlacement || selectedUserDetail.startingPrice || 0).toLocaleString()}</p>
                                                                </div>
                                                            </div>

                                                            {/* Evidence Screenshot Preview */}
                                                            {selectedUserDetail.whatsappAudienceEvidence && (
                                                                <div className="pt-3 border-t border-green-500/20 space-y-2">
                                                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Uploaded Audience Evidence (Admin Only)</p>
                                                                    <div className="relative group max-w-sm rounded-xl overflow-hidden border border-green-500/30">
                                                                        <img src={selectedUserDetail.whatsappAudienceEvidence} alt="Audience Evidence" className="w-full h-40 object-cover" />
                                                                        <a href={selectedUserDetail.whatsappAudienceEvidence} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
                                                                            🔍 View Full Screenshot
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Admin Approve / Request Update */}
                                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await updateDoc(doc(db, 'users', selectedUserDetail.id), {
                                                                        reviewStatus: 'approved',
                                                                        profileSubmittedForReview: false,
                                                                        whatsappAudienceReviewedDate: new Date().toISOString()
                                                                    });
                                                                    setSelectedUserDetail((prev: any) => ({
                                                                        ...prev,
                                                                        reviewStatus: 'approved',
                                                                        profileSubmittedForReview: false,
                                                                        whatsappAudienceReviewedDate: new Date().toISOString()
                                                                    }));
                                                                    alert('Profile approved for hiring directory!');
                                                                } catch (err: any) {
                                                                    alert('Failed to approve: ' + err.message);
                                                                }
                                                            }}
                                                            className="flex-1 py-3 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all"
                                                        >
                                                            ✓ Approve Profile
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await updateDoc(doc(db, 'users', selectedUserDetail.id), {
                                                                        reviewStatus: 'needs_update',
                                                                        profileSubmittedForReview: false
                                                                    });
                                                                    setSelectedUserDetail((prev: any) => ({
                                                                        ...prev,
                                                                        reviewStatus: 'needs_update',
                                                                        profileSubmittedForReview: false
                                                                    }));
                                                                    alert('Profile marked as Needs Update!');
                                                                } catch (err: any) {
                                                                    alert('Failed: ' + err.message);
                                                                }
                                                            }}
                                                            className="flex-1 py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all"
                                                        >
                                                            ⚠ Request Profile Update
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

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
            {/* Withdrawal Details Modal */}
            {selectedWithdrawal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedWithdrawal(null)}></div>
                    <div className="relative bg-[var(--bg-primary)] w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-[var(--border-color)] animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h3 className="text-3xl font-black text-[var(--text-primary)] mb-6">Withdrawal Preview</h3>
                            
                            <div className="space-y-6">
                                <div className="p-6 bg-spark-red/5 rounded-3xl border border-spark-red/10">
                                    <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-1">Amount to Disburse</p>
                                    <p className="text-3xl font-black text-[var(--text-primary)]">₦{Number(selectedWithdrawal.amount).toLocaleString()}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Recipient Name</span>
                                        <span className="font-black text-[var(--text-primary)]">{selectedWithdrawal.userName}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Email Address</span>
                                        <span className="font-bold text-[var(--text-primary)]">{selectedWithdrawal.userEmail}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Bank Name</span>
                                        <span className="font-black text-spark-red uppercase tracking-widest">{selectedWithdrawal.bankName || 'Not Provided'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-[var(--border-color)]">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Account Number</span>
                                        <span className="font-black text-[var(--text-primary)] tracking-widest text-lg">{selectedWithdrawal.accountNumber || 'Not Provided'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Account Name</span>
                                        <span className="font-black text-[var(--text-primary)]">{selectedWithdrawal.accountName || 'Not Provided'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        onClick={() => {
                                            handleApproveWithdrawal(selectedWithdrawal.id);
                                            setSelectedWithdrawal(null);
                                        }}
                                        className="flex-1 py-4 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 transition-all text-xs uppercase tracking-widest shadow-xl shadow-green-900/20"
                                    >
                                        Approve & Disburse
                                    </button>
                                    <button 
                                        onClick={() => {
                                            handleRejectWithdrawal(selectedWithdrawal.id);
                                            setSelectedWithdrawal(null);
                                        }}
                                        className="flex-1 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Reject Request
                                    </button>
                                </div>
                                <button 
                                    onClick={() => setSelectedWithdrawal(null)}
                                    className="w-full py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-spark-red transition-colors"
                                >
                                    Cancel Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Past Event Form Modal */}
            {showPastEventModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2rem] border border-[var(--border-color)] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowPastEventModal(false)} className="absolute top-6 right-6 p-2 text-[var(--text-secondary)] hover:text-spark-red hover:bg-red-50 rounded-full transition-all">
                            <XCircle className="w-6 h-6" />
                        </button>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-6">{pastEventFormData.id ? 'Edit' : 'Add'} Past Event</h3>
                        
                        <form onSubmit={handleSavePastEvent} className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Title</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={pastEventFormData.title} 
                                    onChange={e => setPastEventFormData({...pastEventFormData, title: e.target.value})}
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description</label>
                                <textarea 
                                    required 
                                    rows={4}
                                    value={pastEventFormData.description} 
                                    onChange={e => setPastEventFormData({...pastEventFormData, description: e.target.value})}
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none resize-none text-[var(--text-primary)]"
                                    placeholder="Describe the highlights of this event..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Date</label>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="e.g. October 12, 2025"
                                        value={pastEventFormData.date} 
                                        onChange={e => setPastEventFormData({...pastEventFormData, date: e.target.value})}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Location / Venue</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. UNILAG, Lagos"
                                        value={pastEventFormData.location} 
                                        onChange={e => setPastEventFormData({...pastEventFormData, location: e.target.value})}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium focus:ring-2 focus:ring-spark-red/20 outline-none text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Event Highlight Image</label>
                                <div className="flex items-center gap-4">
                                    {pastEventFormData.imageUrl && (
                                        <img src={pastEventFormData.imageUrl} alt="Past Event Preview" className="w-16 h-12 rounded-xl object-cover border border-[var(--border-color)] bg-[var(--bg-secondary)]" onError={(e) => { (e.target as any).style.display='none'; }} />
                                    )}
                                    <label className="flex-1 cursor-pointer">
                                        <div className={`w-full px-5 py-4 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-color)] rounded-2xl text-sm font-semibold text-[var(--text-secondary)] text-center hover:border-spark-red/40 hover:text-spark-red transition-all ${ pastEventUploading ? 'opacity-50 pointer-events-none' : '' }`}>
                                            {pastEventUploading ? `Uploading... ${pastEventUploadProgress}%` : (pastEventFormData.imageUrl ? '↑ Replace Image' : '↑ Upload Event Image')}
                                        </div>
                                        <input
                                            type="file"
                                            accept=".png,.svg,.jpg,.jpeg,.webp"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleCloudinaryUpload(file, setPastEventUploadProgress, (url) => setPastEventFormData(prev => ({ ...prev, imageUrl: url })), setPastEventUploading);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" disabled={pastEventUploading} className="w-full py-4 bg-spark-red text-white font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 uppercase tracking-widest text-sm disabled:opacity-50">
                                {pastEventFormData.id ? 'Update Past Event' : 'Save Past Event'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        {/* ────────────────────────────────────────────────────────────────
            External Brand Sponsorship Modal (Scrollable Overlay)
        ──────────────────────────────────────────────────────────────── */}
        {showExternalSponsorModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                    {/* Sticky Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 sm:p-8 relative overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white rounded-full" />
                            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white rounded-full" />
                        </div>
                        <div className="relative flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Handshake className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">Fund Event on Behalf of Brand</h2>
                                    <p className="text-emerald-100 text-xs font-medium mt-0.5">Off-platform corporate sponsorship — no payment gateway required</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowExternalSponsorModal(false)}
                                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white font-black transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleFundEventOffPlatform} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                        {externalSponsorSuccess && (
                            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                                <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black text-emerald-700 text-sm">Sponsorship Recorded & Wallet Credited!</p>
                                    <p className="text-emerald-600 text-xs font-medium mt-1">{externalSponsorSuccess}</p>
                                </div>
                            </div>
                        )}

                        {/* Select Event */}
                        <div>
                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                Select Target Event <span className="text-spark-red">*</span>
                            </label>
                            <select
                                required
                                value={externalSponsorForm.eventId}
                                onChange={e => {
                                    const evId = e.target.value;
                                    const ev = allEvents.find(ev => ev.id === evId);
                                    const pkgs = ev ? parseEventPackages(ev.sponsorshipPackages) : [];
                                    setExternalSponsorForm(prev => ({
                                        ...prev,
                                        eventId: evId,
                                        packageName: pkgs.length > 0 ? pkgs[0].name : '',
                                        customAmount: pkgs.length > 0 && pkgs[0].price > 0 ? String(pkgs[0].price) : prev.customAmount
                                    }));
                                }}
                                className="w-full px-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-bold text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                            >
                                <option value="">— Select a listed campus event —</option>
                                {allEvents.map(ev => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.title || ev.name} — {ev.hostName || ev.organization || 'Association'} ({ev.date || 'Upcoming'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Planner Event Information Card (Auto-Populated) */}
                        {externalSponsorForm.eventId && (() => {
                            const ev = allEvents.find(e => e.id === externalSponsorForm.eventId);
                            if (!ev) return null;
                            const raised = Number(ev.raisedSponsorship || 0);
                            const target = Number(ev.targetSponsorship || 0);
                            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                            const attendees = ev.expectedAttendees || ev.attendees || ev.capacity || 'TBD';
                            const slots = ev.sponsorshipSlots || ev.slots || 'Open';
                            const pkgs = parseEventPackages(ev.sponsorshipPackages);

                            return (
                                <div className="p-5 bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] rounded-2xl space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[9px] font-black text-spark-red uppercase tracking-widest px-2 py-0.5 bg-spark-red/10 rounded-md mb-1 inline-block">
                                                {ev.category || 'Event Summary'}
                                            </span>
                                            <h4 className="text-base font-black text-[var(--text-primary)]">{ev.title || ev.name}</h4>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                                Organized by <strong className="text-[var(--text-primary)]">{ev.hostName || ev.organization || 'Association'}</strong> ({ev.hostEmail || 'No email'})
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAdminEvent(ev)}
                                            className="px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs font-bold text-spark-red rounded-lg transition-all flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" /> Full Spec
                                        </button>
                                    </div>

                                    {/* Planner Details Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-color)]">
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Attendees</p>
                                            <p className="font-black text-[var(--text-primary)] mt-0.5">👥 {attendees}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Avail. Slots</p>
                                            <p className="font-black text-[var(--text-primary)] mt-0.5">🎟️ {slots}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Location & Date</p>
                                            <p className="font-bold text-[var(--text-primary)] truncate mt-0.5">📍 {ev.location || 'Campus'} • {ev.date || 'Date TBD'}</p>
                                        </div>
                                    </div>

                                    {/* Funding Progress */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-[var(--text-secondary)]">Funding Goal:</span>
                                            <span className="text-[var(--text-primary)]">
                                                <strong className="text-emerald-600">₦{raised.toLocaleString()}</strong> raised of ₦{target.toLocaleString()} target ({pct}%)
                                            </span>
                                        </div>
                                        <div className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>

                                    {/* Packages Defined by Planner */}
                                    {pkgs.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Packages Defined by Planner:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {pkgs.map((pkg, idx) => (
                                                    <div key={idx} className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-xs">
                                                        <span className="font-black text-[var(--text-primary)]">{pkg.name}</span>: <span className="font-bold text-emerald-600">₦{pkg.price ? Number(pkg.price).toLocaleString() : 'Custom'}</span>
                                                        {pkg.entails && <p className="text-[10px] text-[var(--text-secondary)] font-medium italic mt-0.5 line-clamp-1">{pkg.entails}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Brand Name */}
                        <div>
                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                Off-Platform Brand / Company Name <span className="text-spark-red">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Coca-Cola Nigeria, Red Bull, MTN, GTBank"
                                value={externalSponsorForm.brandName}
                                onChange={e => setExternalSponsorForm(prev => ({ ...prev, brandName: e.target.value }))}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                            />
                        </div>

                        {/* Package & Amount */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                    Sponsorship Tier / Package
                                </label>
                                {externalSponsorForm.eventId && (() => {
                                    const ev = allEvents.find(ev => ev.id === externalSponsorForm.eventId);
                                    const pkgs = ev ? parseEventPackages(ev.sponsorshipPackages) : [];
                                    if (pkgs.length > 0) {
                                        return (
                                            <select
                                                value={externalSponsorForm.packageName}
                                                onChange={e => {
                                                    const pkg = pkgs.find(p => p.name === e.target.value);
                                                    setExternalSponsorForm(prev => ({
                                                        ...prev,
                                                        packageName: e.target.value,
                                                        customAmount: pkg && pkg.price > 0 ? String(pkg.price) : prev.customAmount
                                                    }));
                                                }}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-bold text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                                            >
                                                {pkgs.map(pkg => (
                                                    <option key={pkg.name} value={pkg.name}>
                                                        {pkg.name} {pkg.price > 0 ? `(₦${Number(pkg.price).toLocaleString()})` : ''}
                                                    </option>
                                                ))}
                                                <option value="Custom Sponsorship">Custom Sponsorship Tier</option>
                                            </select>
                                        );
                                    }
                                    return (
                                        <input
                                            type="text"
                                            placeholder="e.g. Title Sponsor, Gold Tier"
                                            value={externalSponsorForm.packageName}
                                            onChange={e => setExternalSponsorForm(prev => ({ ...prev, packageName: e.target.value }))}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                                        />
                                    );
                                })()}
                                {!externalSponsorForm.eventId && (
                                    <input
                                        type="text"
                                        placeholder="Select an event first"
                                        value={externalSponsorForm.packageName}
                                        onChange={e => setExternalSponsorForm(prev => ({ ...prev, packageName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                    Sponsorship Amount (₦) <span className="text-spark-red">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[var(--text-secondary)] text-sm">₦</span>
                                    <input
                                        type="number"
                                        required
                                        min="100"
                                        step="1"
                                        placeholder="e.g. 500000"
                                        value={externalSponsorForm.customAmount}
                                        onChange={e => setExternalSponsorForm(prev => ({ ...prev, customAmount: e.target.value }))}
                                        className="w-full pl-8 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Admin Notes */}
                        <div>
                            <label className="block text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                                Internal Notes / Payment Reference <span className="normal-case text-[10px] font-normal">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Offline bank transfer ref #OFF-9482, Cheque received"
                                value={externalSponsorForm.notes}
                                onChange={e => setExternalSponsorForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl font-medium text-sm text-[var(--text-primary)] outline-none"
                            />
                        </div>

                        {/* Informational Callout */}
                        <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                            <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                <strong>Direct Disbursal:</strong> Submitting will instantly credit ₦{Number(externalSponsorForm.customAmount || 0).toLocaleString()} to the event planner's wallet, log the partnership as paid, and update the event's raised funding. No payment gateway needed.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowExternalSponsorModal(false)}
                                className="px-6 py-3.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={externalSponsorSubmitting}
                                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 disabled:opacity-60 active:scale-95"
                            >
                                {externalSponsorSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                ) : (
                                    <><Handshake className="w-4 h-4" /> Fund & Credit Planner Wallet</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ────────────────────────────────────────────────────────────────
            Full Admin Event Detail Modal (Full Inspection)
        ──────────────────────────────────────────────────────────────── */}
        {selectedAdminEvent && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto">
                <div className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-spark-red to-red-600 p-6 sm:p-8 relative overflow-hidden flex-shrink-0 text-white">
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <span className="px-3 py-1 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">
                                    {selectedAdminEvent.category || 'Campus Experience'}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-black">{selectedAdminEvent.name || selectedAdminEvent.title}</h2>
                                <p className="text-white/80 text-xs font-bold mt-1">
                                    Hosted by {selectedAdminEvent.hostName || selectedAdminEvent.organization || 'Association'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedAdminEvent(null)}
                                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white font-black transition-all"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                        {/* Event Quick Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Target Goal</p>
                                <p className="text-lg font-black text-[var(--text-primary)] mt-1">₦{Number(selectedAdminEvent.targetSponsorship || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Raised So Far</p>
                                <p className="text-lg font-black text-emerald-600 mt-1">₦{Number(selectedAdminEvent.raisedSponsorship || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Attendees</p>
                                <p className="text-lg font-black text-[var(--text-primary)] mt-1">👥 {selectedAdminEvent.expectedAttendees || selectedAdminEvent.attendees || 'TBD'}</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Sponsorship Slots</p>
                                <p className="text-lg font-black text-[var(--text-primary)] mt-1">🎟️ {selectedAdminEvent.sponsorshipSlots || selectedAdminEvent.slots || 'Open'}</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {(() => {
                            const raised = Number(selectedAdminEvent.raisedSponsorship || 0);
                            const target = Number(selectedAdminEvent.targetSponsorship || 0);
                            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
                            return (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
                                    <div className="flex justify-between items-center text-xs font-black">
                                        <span className="text-emerald-800 dark:text-emerald-300">Overall Sponsorship Progress:</span>
                                        <span className="text-emerald-700 dark:text-emerald-400">{pct}% Funded</span>
                                    </div>
                                    <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 h-3 rounded-full overflow-hidden">
                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Event Details Grid */}
                        <div className="grid sm:grid-cols-2 gap-6 bg-[var(--bg-secondary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
                            <div>
                                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Planner Information</h4>
                                <div className="space-y-2 text-sm font-semibold">
                                    <p className="text-[var(--text-primary)]">👤 {selectedAdminEvent.hostName || selectedAdminEvent.organization || 'Association'}</p>
                                    <p className="text-[var(--text-secondary)]">✉️ {selectedAdminEvent.hostEmail || 'No email provided'}</p>
                                    {selectedAdminEvent.hostPhone && <p className="text-[var(--text-secondary)]">📞 {selectedAdminEvent.hostPhone}</p>}
                                    <p className="text-[var(--text-secondary)]">🆔 Host ID: <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-0.5 rounded">{selectedAdminEvent.hostId || 'N/A'}</code></p>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Event Schedule & Venue</h4>
                                <div className="space-y-2 text-sm font-semibold">
                                    <p className="text-[var(--text-primary)]">📅 Date: {selectedAdminEvent.date || 'Upcoming'}</p>
                                    <p className="text-[var(--text-primary)]">📍 Location: {selectedAdminEvent.location || 'Campus Wide'}</p>
                                    {selectedAdminEvent.activationNeeds && (
                                        <p className="text-[var(--text-secondary)] text-xs italic">💡 Activation: {selectedAdminEvent.activationNeeds}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Description</h4>
                            <div className="p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                                {selectedAdminEvent.description || 'No detailed description provided by organizer.'}
                            </div>
                        </div>

                        {/* Sponsorship Packages Defined */}
                        <div>
                            <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Sponsorship Packages & Tiers</h4>
                            {(() => {
                                const pkgs = parseEventPackages(selectedAdminEvent.sponsorshipPackages);
                                if (pkgs.length === 0) {
                                    return <p className="text-xs text-[var(--text-secondary)] italic">No specific sponsorship packages defined.</p>;
                                }
                                return (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {pkgs.map((pkg, idx) => (
                                            <div key={idx} className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="font-black text-[var(--text-primary)] text-sm">{pkg.name}</h5>
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-black">
                                                        ₦{pkg.price ? Number(pkg.price).toLocaleString() : 'Custom'}
                                                    </span>
                                                </div>
                                                {pkg.entails && (
                                                    <p className="text-xs text-[var(--text-secondary)] font-medium">{pkg.entails}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Current Sponsors List */}
                        {Array.isArray(selectedAdminEvent.sponsors) && selectedAdminEvent.sponsors.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Confirmed Sponsors & Funders</h4>
                                <div className="space-y-2">
                                    {selectedAdminEvent.sponsors.map((sp: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl flex justify-between items-center text-xs font-bold">
                                            <div>
                                                <span className="text-[var(--text-primary)] font-black">{sp.name}</span>
                                                <span className="text-[var(--text-secondary)] ml-2">({sp.package || 'Sponsor'})</span>
                                                {sp.isExternal && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">Off-Platform</span>}
                                            </div>
                                            <span className="text-emerald-600 font-black">₦{Number(sp.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                        <button
                            onClick={() => setSelectedAdminEvent(null)}
                            className="px-6 py-3 bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                const ev = selectedAdminEvent;
                                setSelectedAdminEvent(null);
                                setExternalSponsorSuccess(null);
                                const pkgs = parseEventPackages(ev.sponsorshipPackages);
                                const firstPkg = pkgs[0] || { name: 'Custom Sponsorship', price: 0 };
                                const defaultAmt = firstPkg.price || (ev.targetSponsorship ? String(ev.targetSponsorship) : '');
                                setExternalSponsorForm({
                                    brandName: '',
                                    eventId: ev.id,
                                    packageName: firstPkg.name || 'Custom Sponsorship',
                                    customAmount: defaultAmt ? String(defaultAmt) : '',
                                    notes: ''
                                });
                                setShowExternalSponsorModal(true);
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                        >
                            <Handshake className="w-4 h-4" /> Fund on Behalf of Brand
                        </button>
                    </div>
                </div>
            </div>
        )}
        </DashboardShell>
    );
};

export default AdminDashboard;
