import React, { useState, useEffect } from 'react';
import DashboardShell from './DashboardShell';
import { db, auth, collection, query, where, getDocs, limit, doc, getDoc, apiClient, orderBy, updateDoc, addDoc } from '../firebase';
import { UserRole } from '../types';
import ProfileView from './ProfileView';
import DashboardPlaceholder from './DashboardPlaceholder';
import { notifyWithdrawal, notifyReportSubmitted, notifyProposalReceived, notifyProposalStatus, notifyRatingRequest } from '../emailNotifier';
import { ProposalFormModal } from './ProposalFormModal';
import { ProposalDetailsModal } from './ProposalDetailsModal';
import { EventDetailsModal } from './EventDetailsModal';
import { WalletService } from '../WalletService';
import { CreatorProfileModal } from './CreatorProfileModal';
import { Search, Zap, Rocket, Mail, Wallet, Clock, TrendingUp, ArrowUpRight, ArrowDownLeft, Briefcase, Plus, Trash2, ExternalLink, FileText, Image as ImageIcon, Download, Star, Award, Shield, User, Sparkles, AlertCircle, CheckCircle, Circle, UserCheck, HelpCircle, Send, MessageSquare, Building2, Instagram, Twitter, Scale } from 'lucide-react';
import { DisputesPanel } from './DisputesPanel';

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
    return true;
};

const CreatorDashboard: React.FC<{ 
    onNavigate: (page: string) => void, 
    onLogout: () => void,
    isDarkMode: boolean,
    toggleTheme: () => void,
    themeMode?: 'light' | 'dark' | 'auto',
    user: any
}> = ({ onNavigate, onLogout, isDarkMode, toggleTheme, themeMode, user }) => {
    const [currentSection, setCurrentSection] = useState('overview');
    const [activeTab, setActiveTab] = useState('gigs');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);
    const [proposals, setProposals] = useState<any[]>([]);
    const [proposalTab, setProposalTab] = useState<'incoming' | 'outgoing'>('incoming');
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
    const [myApplications, setMyApplications] = useState<any[]>([]); // All applications for this creator
    const [myCampaigns, setMyCampaigns] = useState<any[]>([]); // Campaigns creator is allocated to
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
    const [metricsFile, setMetricsFile] = useState<File | null>(null);
    const [submittingWork, setSubmittingWork] = useState(false);

    // Portfolio states
    const [showPortfolioModal, setShowPortfolioModal] = useState(false);
    const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', fileType: 'image' as any, linkUrl: '' });
    const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
    const [portfolioSubmitting, setPortfolioSubmitting] = useState(false);

    // New Dashboard States
    const [preSelectedDisputeEntity, setPreSelectedDisputeEntity] = useState<any>(null);
    const [profileSubTab, setProfileSubTab] = useState<'profile' | 'portfolio'>('profile');
    const [collabSubTab, setCollabSubTab] = useState<'invitations' | 'network' | 'splits'>('invitations');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedBudgetRange, setSelectedBudgetRange] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [ratingRequestCampaignId, setRatingRequestCampaignId] = useState('');
    const [ratingRequestSubmitting, setRatingRequestSubmitting] = useState(false);
    const [testimonials, setTestimonials] = useState<any[]>([]);
    // Platform review state
    const [platformRating, setPlatformRating] = useState(5);
    const [platformReviewText, setPlatformReviewText] = useState('');
    const [platformReviewSubmitting, setPlatformReviewSubmitting] = useState(false);
    const [myPlatformReviews, setMyPlatformReviews] = useState<any[]>([]);
    const [splitTotal, setSplitTotal] = useState('');
    const [splitShares, setSplitShares] = useState<Array<{ name: string; percentage: number }>>([
        { name: 'Me (Lead)', percentage: 60 },
        { name: 'Co-Creator', percentage: 40 }
    ]);
    const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({
        custom_feedback: false
    });

    const [partners, setPartners] = useState<any[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(false);
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('');

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg> },
        { id: 'profile_portfolio', label: 'Profile & Portfolio', icon: <Briefcase className="w-5 h-5" /> },
        { id: 'opportunities', label: 'Opportunities', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> },
        { id: 'applications', label: 'Applications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg> },
        { id: 'active_gigs', label: 'Active Gigs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
        { id: 'earnings_wallet', label: 'Earnings & Wallet', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
        { id: 'partners', label: 'Brands & Associations', icon: <Building2 className="w-5 h-5" /> },
        { id: 'collaboration', label: 'Collaboration', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> },
        { id: 'ratings_reviews', label: 'Ratings & Reviews', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> },
        { id: 'disputes', label: 'Disputes & Mediation', icon: <Scale className="w-5 h-5" /> },
    ];

    const tabs = [
        { id: 'gigs', label: 'Opportunities' },
        { id: 'my-campaigns', label: 'My Campaigns', hasBadge: myCampaigns.some(c => c.status === 'selected' || c.status === 'in_progress') },
        { id: 'creator-hub', label: 'Explore Brand & Org' },
        { id: 'proposals', label: 'Offers', hasBadge: proposals.some(p => p.status === 'pending' && p.recipientId === userProfile?.id) },
        { id: 'community', label: 'Network' },
        { id: 'events', label: 'Events' },
    ];

    const fetchUserData = async () => {
        const user = auth.currentUser;
        if (user) {
            try {
                const userDoc = await getDoc(doc(db, "users", (user as any).uid || (user as any).id));
                if (userDoc.exists()) {
                    const profileData = userDoc.data();
                    setUserProfile({ id: (user as any).uid || (user as any).id, ...profileData });
                    if (profileData.bankDetails) {
                        setBankDetails(profileData.bankDetails);
                    }
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
            const campaigns = await WalletService.getAllocationsByCreator(userProfile.id);
            // Enrich with campaign details from gigs or campaigns collection
            const enriched = await Promise.all(campaigns.map(async (c) => {
                let gigDoc = await getDoc(doc(db, 'gigs', c.campaignId));
                if (!gigDoc.exists()) {
                    gigDoc = await getDoc(doc(db, 'campaigns', c.campaignId));
                }
                return { ...c, campaign: gigDoc.exists() ? gigDoc.data() : null };
            }));
            setMyCampaigns(enriched);
        } catch (e) {
            console.error('Error fetching campaigns:', e);
        }
    };

    const fetchTestimonials = async () => {
        if (!userProfile?.id) return;
        try {
            const q = query(
                collection(db, 'ratingRequests'),
                where('creatorId', '==', userProfile.id),
                where('status', '==', 'submitted')
            );
            const snap = await getDocs(q);
            setTestimonials(snap.docs.map(docVal => ({ id: docVal.id, ...docVal.data() })));
        } catch (err) {
            console.warn('[CreatorDashboard] Error fetching testimonials:', err);
        }
    };

    const fetchPlatformReviews = async () => {
        if (!userProfile?.id && !user?.id) return;
        try {
            const uid = userProfile?.id || user?.id;
            const q = query(collection(db, 'platformReviews'), where('userId', '==', uid));
            const snap = await getDocs(q);
            setMyPlatformReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.warn('[CreatorDashboard] Error fetching platform reviews:', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    useEffect(() => {
        if (userProfile?.id) {
            fetchProposals();
            fetchMyApplications();
            fetchMyCampaigns();
            fetchTestimonials();
            fetchPlatformReviews();
        }
    }, [userProfile?.id, currentSection, activeTab]);

    useEffect(() => {
        const fetchData = async () => {
            if (currentSection !== 'opportunities' && currentSection !== 'collaboration' && currentSection !== 'overview' && currentSection !== 'partners') {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                if (currentSection === 'opportunities' || currentSection === 'overview') {
                    // Fetch gigs, campaigns and events for opportunities board / matched count
                    const [gigsRes, campaignsRes, eventsRes] = await Promise.all([
                        apiClient.get('gigs'),
                        apiClient.get('campaigns'),
                        apiClient.get('events')
                    ]);
                    
                    const openGigs = (gigsRes.data || []).filter((g: any) => 
                        !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft')
                    ).map((g: any) => ({
                        ...g,
                        category: 'Campaign',
                        displayTitle: g.title,
                        displayBrand: g.brand || g.brandName,
                        displayReward: g.reward || g.budget,
                        displayLocation: g.location || g.university || 'Nationwide',
                        sourceCollection: 'gigs'
                    }));

                    const openCampaigns = (campaignsRes.data || []).filter((g: any) => 
                        !g.status || (g.status.toLowerCase() !== 'closed' && g.status.toLowerCase() !== 'draft')
                    ).map((g: any) => ({
                        ...g,
                        category: 'Gig',
                        displayTitle: g.title,
                        displayBrand: g.hostName || 'Association',
                        displayReward: g.reward,
                        displayLocation: g.university || 'Campus',
                        sourceCollection: 'campaigns'
                    }));

                    const publishedEvents = (eventsRes.data || []).map((e: any) => ({
                        ...e,
                        category: 'Event',
                        displayTitle: e.name,
                        displayBrand: e.hostName,
                        displayReward: e.targetSponsorship,
                        displayLocation: e.university || 'Campus'
                    }));

                    const sortedItems = [...openGigs, ...openCampaigns, ...publishedEvents].sort((a: any, b: any) => 
                        new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt || b.date || 0)).getTime() - 
                        new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt || a.date || 0)).getTime()
                    );
                    setData(sortedItems);
                } else if (currentSection === 'collaboration') {
                    // Fetch other creators for collaboration network list
                    const creatorsRes = await apiClient.get(`users?role=${encodeURIComponent('Creator')}`);
                    const netList = (creatorsRes.data || []).filter((u: any) => u.id !== userProfile?.id);
                    setData(netList);
                    await fetchProposals();
                } else if (currentSection === 'partners') {
                    setPartnersLoading(true);
                    try {
                        const qBrands = query(collection(db, "users"), where("role", "==", "Brand"));
                        const qOrgs = query(collection(db, "users"), where("role", "==", "Organization"));
                        const [brandsSnap, orgsSnap] = await Promise.all([getDocs(qBrands), getDocs(qOrgs)]);
                        const brandList = brandsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        const orgList = orgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setPartners([...brandList, ...orgList]);
                    } catch (err) {
                        console.error("Error fetching partners:", err);
                    } finally {
                        setPartnersLoading(false);
                    }
                    await fetchProposals();
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentSection, userProfile?.id]);

    const fetchWallet = async () => {
        if (!userProfile?.id) return;
        setWalletLoading(true);
        try {
            const w = await WalletService.getOrCreateWallet(userProfile.id);
            setWallet(w);
            
            // Fetch transactions for this user
            const q = query(
                collection(db, 'transactions'), 
                where('userId', '==', userProfile.id)
            );
            
            const transSnap = await getDocs(q);
            const mappedTrans = (transSnap.docs || []).map(d => ({ id: d.id, ...d.data() }));
            
            // Sort client-side to avoid "missing index" errors and handle different timestamp formats
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
                bankDetails,
                { name: userProfile.name, email: userProfile.email }
            );

            // Notify user + admin of withdrawal request
            if (userProfile.email) {
                notifyWithdrawal(userProfile.email, userProfile.name, Number(withdrawalAmount), { details: bankDetails });
            }

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

    const handleSaveBankDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile?.id) return;
        try {
            await updateDoc(doc(db, "users", userProfile.id), { bankDetails });
            setUserProfile({ ...userProfile, bankDetails });
            alert('Bank details linked and verified successfully!');
        } catch (e: any) {
            console.error("Save bank details error:", e);
            alert('Failed to save bank details: ' + e.message);
        }
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCampaign) return;
        setSubmittingWork(true);
        try {
            let metricsUrl = selectedCampaign.submission?.metricsUrl || '';

            // Handle Cloudinary upload for metrics screenshot
            if (metricsFile) {
                const formData = new FormData();
                formData.append('file', metricsFile);
                formData.append('upload_preset', 'abc-rally');

                const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    metricsUrl = data.secure_url;
                } else {
                    console.error('Cloudinary metrics upload failed');
                }
            }

            const finalSubmission = {
                ...submissionData,
                metricsUrl
            };

            // 1. Update the allocation document (for 'My Campaigns' view)
            await WalletService.updateAllocationSubmission(selectedCampaign.id!, finalSubmission);
            
            // 2. Sync with application document (for Brand's 'Applicants' view)
            if (selectedCampaign.applicationId && selectedCampaign.campaignId) {
                await apiClient.patch(`gigs/${selectedCampaign.campaignId}/applications/${selectedCampaign.applicationId}`, {
                    status: 'submitted',
                    report: finalSubmission.text,
                    reportLink: finalSubmission.link,
                    metricsUrl: finalSubmission.metricsUrl,
                    updatedAt: new Date().toISOString()
                });
            }

            // Notify Brand
            try {
                // Fetch brand's email if possible, or trigger server with brandId
                // The gig top level contains brandEmail 
                const gigRes = await apiClient.get(`gigs/${selectedCampaign.campaignId}`);
                const brandEmail = gigRes.data[0]?.brandEmail || gigRes.data[0]?.brand;
                if (brandEmail) {
                    notifyReportSubmitted(
                        brandEmail,
                        selectedCampaign.brandName || 'Brand',
                        userProfile?.name || 'Creator',
                        selectedCampaign.campaignTitle || 'Campaign'
                    );
                }
            } catch (e) {
                console.warn('Failed to notify brand of report submission', e);
            }

            alert('Work submitted successfully! The brand will review it shortly.');
            setSelectedCampaign(null);
            setSubmissionData({ link: '', text: '' });
            setMetricsFile(null);
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

    // Handle accepting an assignment (selected campaign)
    const handleAcceptAssignment = async (camp: any) => {
        if (!window.confirm('Accept this assignment?')) return;
        try {
            // Update allocation status to in_progress
            await WalletService.updateAllocationStatus(camp.id, 'in_progress');
            alert('Assignment accepted! You can now start working on this campaign.');
            await fetchMyCampaigns();
        } catch (e) {
            console.error('Accept assignment error:', e);
            alert('Failed to accept assignment.');
        }
    };

    // Handle declining an assignment (selected campaign)
    const handleDeclineAssignment = async (camp: any) => {
        if (!window.confirm('Decline this assignment?')) return;
        try {
            // Update allocation status to rejected
            await WalletService.updateAllocationStatus(camp.id, 'rejected');
            // Refund the allocated amount back to the brand
            if (camp.brandId && camp.amount) {
                await WalletService.refundAllocation(camp.brandId, camp.amount, 'Assignment declined', camp.creatorId);
            }
            alert('Assignment declined and funds refunded to the brand.');
            await fetchMyCampaigns();
        } catch (e) {
            console.error('Decline assignment error:', e);
            alert('Failed to decline assignment.');
        }
    };

    // Handle resubmitting a rejected report (revision)
    const handleResubmitReport = async (camp: any) => {
        // Change status back to submitted so creator can submit work again
        try {
            await WalletService.updateAllocationStatus(camp.id, 'submitted');
            alert('Report status reset to submitted. You can now resubmit your work.');
            await fetchMyCampaigns();
        } catch (e) {
            console.error('Resubmit report error:', e);
            alert('Failed to reset report for resubmission.');
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
            const coll = applyingToGig.sourceCollection || 'gigs';
            await apiClient.post(`${coll}/${applyingToGig.id}/apply`, { pitch: pitchText });
            const campaignTitle = applyingToGig.displayTitle || applyingToGig.title || 'Campaign';
            alert(`Application submitted for "${campaignTitle}"! The brand will review your pitch.`);
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
        const hostId = event.host?.id || event.hostId;
        const hostName = event.host?.name || event.hostName || "Association";

        if (!hostId) {
            alert('Cannot contact host: Host information is missing for this event.');
            return;
        }
        setProposalRecipient({ id: hostId, name: hostName });
        setProposalInitialMessage(`Hi ${hostName}, I'm interested in volunteering for your event "${event.name}".`);
        setShowProposalModal(true);
        setSelectedEvent(null);
    };

    // Helper: get this creator's application for a specific gig
    const getMyApplication = (gigId: string) => myApplications.find((a: any) => a.gigId === gigId);


    const handleSendProposal = async (proposalData: { recipientId: string; message: string; budget?: string; timeline?: string; documentUrl?: string; documentName?: string; }) => {
        try {
            await apiClient.post('proposals', proposalData);

            // Notify Recipient (Brand or Org)
            const recipientUser = data.find((u: any) => u.id === proposalData.recipientId) || partners.find((u: any) => u.id === proposalData.recipientId);
            const recipientName = recipientUser?.name || proposalRecipient?.name || 'User';
            const recipientEmail = recipientUser?.email;

            if (recipientEmail) {
                notifyProposalReceived(
                    recipientEmail,
                    recipientName,
                    userProfile?.name || 'Creator',
                    proposalData.message
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
                    prop.recipient?.name || userProfile?.name || 'Creator',
                    status
                );
            }

            fetchProposals();
        } catch (error) {
            console.error("Update status error:", error);
        }
    };

    const handlePortfolioSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isLinkType = portfolioForm.fileType === 'video' || portfolioForm.fileType === 'link';

        if (!isLinkType && !portfolioFile) {
            alert('Please select a file to upload.');
            return;
        }
        if (isLinkType && !portfolioForm.linkUrl.trim()) {
            alert('Please enter a valid URL.');
            return;
        }

        setPortfolioSubmitting(true);
        try {
            let fileUrl = portfolioForm.linkUrl || '';

            if (!isLinkType && portfolioFile) {
                const formData = new FormData();
                formData.append('file', portfolioFile);
                formData.append('upload_preset', 'abc-rally');

                const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dk9tq3oop/auto/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();
                fileUrl = uploadData.secure_url;
            }

            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                ...portfolioForm,
                fileUrl,
                createdAt: new Date().toISOString()
            };

            const updatedPortfolio = [...(userProfile.portfolio || []), newItem];
            await updateDoc(doc(db, "users", userProfile.id), { portfolio: updatedPortfolio });
            
            setUserProfile({ ...userProfile, portfolio: updatedPortfolio });
            setShowPortfolioModal(false);
            setPortfolioForm({ title: '', description: '', fileType: 'image', linkUrl: '' });
            setPortfolioFile(null);
            alert('Portfolio item added successfully!');
        } catch (e) {
            console.error('Portfolio error:', e);
            alert('Failed to add portfolio item.');
        } finally {
            setPortfolioSubmitting(false);
        }
    };


    const handleDeletePortfolioItem = async (itemId: string) => {
        if (!window.confirm('Delete this portfolio item?')) return;
        try {
            const updatedPortfolio = userProfile.portfolio.filter((item: any) => item.id !== itemId);
            await updateDoc(doc(db, "users", userProfile.id), { portfolio: updatedPortfolio });
            setUserProfile({ ...userProfile, portfolio: updatedPortfolio });
        } catch (e) {
            console.error('Delete error:', e);
            alert('Failed to delete item.');
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

        const isEmpty = (
            activeTab === 'proposals' ? proposals.length : 
            activeTab === 'my-campaigns' ? myCampaigns.length :
            data.length
        ) === 0;

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
            case 'creator-hub':
                return (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {data.map((partner: any) => (
                                <div key={partner.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                    <div className={`h-24 bg-spark-red/5 group-hover:opacity-80 transition-opacity`} />
                                    <div className="px-8 pb-8 -mt-12">
                                        <div className="w-20 h-20 bg-[var(--bg-primary)] border-4 border-[var(--border-color)] rounded-[1.5rem] shadow-lg flex items-center justify-center text-3xl font-black text-spark-red mb-4 overflow-hidden">
                                            {partner.imageUrl ? <img src={partner.imageUrl} className="w-full h-full object-cover" alt={partner.name} /> : partner.name?.charAt(0)}
                                        </div>
                                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-1">{partner.name}</h3>
                                        <p className="text-[10px] font-black text-spark-red uppercase tracking-widest mb-4">{partner.role === 'Brand' ? 'Brand' : 'Student Association'}</p>
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-6 min-h-[40px] font-medium leading-relaxed">
                                            {partner.bio || `Connect with ${partner.name} to explore brand creator roles and campus volunteer opportunities.`}
                                        </p>
                                        <div className="flex flex-col gap-3 mt-auto">
                                            <button 
                                                onClick={() => setSelectedBrand(partner)}
                                                className="w-full py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] font-black rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all flex items-center justify-center gap-2"
                                            >
                                                View {partner.role === 'Brand' ? 'Brand' : 'Organization'}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setProposalRecipient({ id: partner.id, name: partner.name });
                                                    setProposalInitialMessage(`Hi ${partner.name}, I'm interested in being a creator or volunteer for your ${partner.role === 'Brand' ? 'brand' : 'Association'}. Here's why I'd be a great fit...`);
                                                    setShowProposalModal(true);
                                                }}
                                                className="w-full py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5 active:scale-95"
                                            >
                                                Apply for Role
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
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
                                              s === 'selected' ? { label: '⚡ Direct Offer', classes: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20' } :
                                              { label: 'In Progress', classes: 'bg-spark-red/10 text-spark-red border border-spark-red/20' };
                            } else if (myApp) {
                                statusBadge = myApp.status === 'pending' ? { label: 'Applied', classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' } :
                                              myApp.status === 'rejected' ? { label: 'Not Selected', classes: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]' } :
                                              { label: 'Open', classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' };
                            }

                            return (
                                <div key={gig.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all flex flex-col p-8 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-xl font-black text-spark-red border border-spark-red/10">{(gig.displayBrand || gig.brand || gig.brandName || '⚡').charAt(0)}</div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.classes}`}>{statusBadge.label}</span>
                                            {activeTab === 'gigs' && (
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    gig.category === 'Campaign' ? 'bg-spark-red/10 text-spark-red' : 'bg-blue-500/10 text-blue-500'
                                                }`}>
                                                    {gig.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-xl mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{gig.displayTitle || gig.title}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">{gig.displayBrand || gig.brand || gig.brandName || 'Brand'}</p>
                                    <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1 line-clamp-3">{gig.description || gig.brief || 'No description provided.'}</p>
                                    
                                    <div className="bg-[var(--bg-secondary)] dark:bg-spark-black/20 rounded-2xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>{gig.category === 'Event' ? 'Target Sponsorship' : 'Reward'}</span>
                                            <span className="text-[var(--text-primary)]">₦{(gig.displayReward || gig.reward || gig.budget || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>{gig.category === 'Event' ? 'Event Date' : 'Deadline'}</span>
                                            <span className="text-[var(--text-primary)]">{gig.deadline || gig.date || 'Ongoing'}</span>
                                        </div>
                                    </div>

                                    {myCamp ? (
                                        myCamp.status === 'selected' ? (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => handleAcceptAssignment(myCamp)}
                                                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                                                >
                                                    Accept Offer
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineAssignment(myCamp)}
                                                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                                                >
                                                    Decline Offer
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => { setSelectedCampaign(myCamp); setActiveTab('my-campaigns'); }} className="w-full px-4 py-3.5 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5">
                                                Manage Active Campaign
                                            </button>
                                        )
                                    ) : (
                                        <div className="space-y-3">
                                            {myApp && (
                                                <div className="px-4 py-2 bg-spark-black/5 dark:bg-white/5 rounded-xl border border-spark-black/10 dark:border-white/10 text-center text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">
                                                    Latest Application: {myApp.status}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => gig.category === 'Event' ? handleContactHost(gig) : handleOpenApplyModal(gig)} 
                                                className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-2xl hover:bg-spark-red hover:text-white transition-all text-sm shadow-lg shadow-black/5"
                                            >
                                                {gig.category === 'Event' ? 'Contact Host' : myApp ? 'Submit Another Pitch' : 'Apply to Campaign'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            case 'my-campaigns':
                const activeCamps = myCampaigns.filter(c => c.status !== 'paid');
                const completedCamps = myCampaigns.filter(c => c.status === 'paid');
                return (
                    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                        {/* â”€â”€ Active Section â”€â”€ */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 rounded-full bg-spark-red animate-pulse"></div>
                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">Active & Ongoing</h3>
                            </div>
                            {activeCamps.length === 0 ? (
                                <div className="text-center py-16 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)] opacity-60">
                                    <p className="text-[var(--text-secondary)] font-bold">No active campaigns at the moment.</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {activeCamps.map(camp => (
                                        <div key={camp.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-spark-red/10 rounded-2xl flex items-center justify-center font-black text-spark-red shadow-inner">
                                                    <Zap className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-[var(--text-primary)]">{camp.campaign?.title || camp.campaignTitle || 'Active Campaign'}</h4>
                                                    <p className="text-xs font-black text-spark-red uppercase tracking-widest">{camp.campaign?.brand || camp.brandName || 'Verified Brand'}</p>
                                                    <div className="flex gap-3 mt-2">
                                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">₦{(camp.amount || camp.campaign?.reward || 0).toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-300">•</span>
                                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Due: {camp.campaign?.deadline || '---'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    camp.status === 'approved' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                                    camp.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                                                    camp.status === 'selected' ? 'bg-spark-red/10 text-spark-red border-spark-red/20' :
                                                    camp.status === 'revision' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' :
                                                    'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                                }`}>
                                                    {camp.status === 'selected' ? 'Brand Accepted - Start Working' : camp.status.replace('_', ' ')}
                                                </span>
                                {camp.status === 'selected' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAcceptAssignment(camp)}
                                    className="px-4 py-2 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-xs"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDeclineAssignment(camp)}
                                    className="px-4 py-2 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all text-xs"
                                >
                                    Decline
                                </button>
                            </div>
                        ) : camp.status === 'revision' ? (
                            <button
                                onClick={() => handleResubmitReport(camp)}
                                className="px-4 py-2 bg-yellow-600 text-white font-black rounded-xl hover:bg-yellow-700 transition-all text-xs"
                            >
                                Resubmit Report
                            </button>
                        ) : (
                                    <button
                                        onClick={() => setSelectedCampaign(camp)}
                                        className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-xl hover:bg-spark-red hover:text-white transition-all text-xs shadow-sm"
                                    >
                                        Manage Work
                                    </button>
                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* â”€â”€ Completed Section â”€â”€ */}
                        {completedCamps.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-widest">Completed History</h3>
                                </div>
                                <div className="grid gap-4 opacity-80">
                                    {completedCamps.map(camp => (
                                        <div key={camp.id} className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 flex items-center justify-between grayscale-[0.5] hover:grayscale-0 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-[var(--text-primary)]">{camp.campaign?.title || camp.campaignTitle}</h4>
                                                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Paid: ₦{camp.amount?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <span className="px-4 py-1.5 bg-green-500/10 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-green-500/20">Completed</span>
                                        </div>
                                    ))}
                                </div>
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
                                                {otherParty.imageUrl ? <img src={otherParty.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" /> : (displayName.charAt(0))}
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
                                                        onClick={() => setSelectedProposal(p)}
                                                        className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-color)]"
                                                    >
                                                        View & Decide
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

            case 'community':
                return (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {data.map(member => (
                            <div key={member.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all p-6 text-center">
                                <div className="w-20 h-20 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] mx-auto mb-4 flex items-center justify-center text-3xl font-black text-spark-red overflow-hidden">
                                    {member.imageUrl ? <img src={member.imageUrl} className="w-full h-full object-cover" alt={member.name} /> : (member.name || '?').charAt(0)}
                                </div>
                                <h3 className="font-black text-lg text-[var(--text-primary)]">{member.name}</h3>
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">{member.university || 'Creator'}</p>
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
                            <div key={event.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group relative">
                                <div className={`h-4 bg-spark-red`}></div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="mb-4 flex flex-wrap items-center gap-2">
                                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-spark-red tracking-widest inline-block w-max">
                                            {new Date(event.date).toLocaleDateString()}
                                        </div>
                                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-spark-purple tracking-widest inline-block w-max max-w-[150px] truncate">
                                            {event.location || 'TBA'}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            event.hostRole === 'Brand' 
                                                ? 'bg-spark-red/10 text-spark-red border-spark-red/20' 
                                                : 'bg-spark-purple/10 text-spark-purple border-spark-purple/20'
                                        }`}>
                                            {event.hostRole === 'Brand' ? 'Brand Event' : 'Campus Event'}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-black mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">
                                        {event.name}
                                    </h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">
                                        Hosted by: <span className="text-spark-red">{event.hostName}</span>
                                    </p>
                                    
                                    <p className="text-[var(--text-secondary)] text-sm mb-6 line-clamp-3 leading-relaxed">
                                        {event.description}
                                    </p>
                                    
                                    <div className="mt-auto pt-6 border-t border-[var(--border-color)] flex items-center justify-end">
                                        <button
                                            onClick={() => setSelectedEvent(event)}
                                            className="px-5 py-2.5 bg-spark-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-spark-red hover:shadow-lg transition-all active:scale-95"
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderPortfolio = () => {
        const portfolio = userProfile?.portfolio || [];
        
        return (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-[var(--text-primary)]">My Portfolio</h2>
                        <p className="text-[var(--text-secondary)] mt-1 font-medium">Showcase your best work to brands and Associations.</p>
                    </div>
                    <button 
                        onClick={() => setShowPortfolioModal(true)}
                        className="px-8 py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-100 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add Portfolio Item
                    </button>
                </div>

                {portfolio.length === 0 ? (
                    <div className="text-center py-32 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <div className="w-20 h-20 bg-spark-red/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                            <Briefcase className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2">Portfolio Empty</h3>
                        <p className="text-[var(--text-secondary)] font-medium mb-8">Upload previous work to increase your chances of being selected for gigs.</p>
                        <button 
                            onClick={() => setShowPortfolioModal(true)}
                            className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
                        >
                            Create Your First Entry
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {portfolio.map((item: any) => (
                            <div key={item.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                <div className="h-48 bg-[var(--bg-secondary)] relative overflow-hidden group">
                                    {item.fileType === 'image' ? (
                                        <img src={item.fileUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.title} />
                                    ) : item.fileType === 'video' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-spark-black gap-2">
                                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
                                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                            </div>
                                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Video</span>
                                        </div>
                                    ) : item.fileType === 'link' ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-spark-black gap-2">
                                            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20">
                                                <ExternalLink className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">External Link</span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-spark-black gap-2">
                                            <FileText className="w-12 h-12 text-white/20" />
                                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Document</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-spark-black rounded-xl hover:bg-spark-red hover:text-white transition-all transform hover:scale-110">
                                            {(item.fileType === 'video' || item.fileType === 'link') ? <ExternalLink className="w-6 h-6" /> : <Download className="w-6 h-6" />}
                                        </a>
                                        <button onClick={() => handleDeletePortfolioItem(item.id)} className="p-3 bg-white text-spark-black rounded-xl hover:bg-spark-red hover:text-white transition-all transform hover:scale-110">
                                            <Trash2 className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-black text-[var(--text-primary)] group-hover:text-spark-red transition-colors line-clamp-1">{item.title}</h3>
                                        <span className="px-3 py-1 bg-spark-red/10 text-spark-red text-[8px] font-black uppercase tracking-widest rounded-lg border border-spark-red/10">{item.fileType}</span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium line-clamp-3 mb-6 flex-1 leading-relaxed">{item.description}</p>
                                    <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-spark-red uppercase tracking-widest hover:underline flex items-center gap-1">
                                            View Work <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Portfolio Modal */}
                {showPortfolioModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-spark-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowPortfolioModal(false)}></div>
                        <div className="relative bg-[var(--bg-primary)] w-full max-w-xl rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden border border-[var(--border-color)]">
                            <form onSubmit={handlePortfolioSubmit} className="p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-primary)]">Add Portfolio Item</h2>
                                        <p className="text-[var(--text-secondary)] mt-1 font-medium">Tell brands about your previous achievements.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowPortfolioModal(false)} className="w-10 h-10 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full flex items-center justify-center hover:bg-spark-red hover:text-white transition-all">
                                        <Plus className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 ml-2">Project Title</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={portfolioForm.title}
                                            onChange={e => setPortfolioForm({...portfolioForm, title: e.target.value})}
                                            className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all"
                                            placeholder="e.g. Red Bull Campus Tour 2024"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 ml-2">Description</label>
                                        <textarea 
                                            required
                                            value={portfolioForm.description}
                                            onChange={e => setPortfolioForm({...portfolioForm, description: e.target.value})}
                                            className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all min-h-[120px]"
                                            placeholder="What did you do? What were the results?"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 ml-2">Work Type</label>
                                            <select 
                                                value={portfolioForm.fileType}
                                                onChange={e => setPortfolioForm({...portfolioForm, fileType: e.target.value as any, linkUrl: ''})}
                                                className="w-full px-6 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="image">Image / Graphic</option>
                                                <option value="video">Video Link</option>
                                                <option value="document">PDF / Document</option>
                                                <option value="link">External Link</option>
                                            </select>
                                        </div>
                                        <div>
                                            {(portfolioForm.fileType === 'video' || portfolioForm.fileType === 'link') ? (
                                                <div>
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 ml-2">
                                                        {portfolioForm.fileType === 'video' ? 'Video URL' : 'External Link'}
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={portfolioForm.linkUrl}
                                                        onChange={e => setPortfolioForm({...portfolioForm, linkUrl: e.target.value})}
                                                        placeholder={portfolioForm.fileType === 'video' ? 'https://youtube.com/...' : 'https://...'}
                                                        className="w-full px-4 py-4 bg-spark-red/5 border border-[var(--border-color)] rounded-2xl outline-none font-bold focus:ring-4 focus:ring-spark-red/10 transition-all text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 ml-2">Evidence File</label>
                                                    <input 
                                                        type="file" 
                                                        onChange={e => setPortfolioFile(e.target.files?.[0] || null)}
                                                        className="hidden" 
                                                        id="portfolio-file"
                                                        accept={portfolioForm.fileType === 'image' ? 'image/*' : '.pdf'}
                                                    />
                                                    <label 
                                                        htmlFor="portfolio-file"
                                                        className="w-full px-6 py-4 bg-spark-black text-white rounded-2xl font-black text-center cursor-pointer hover:bg-spark-red transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                                    >
                                                        {portfolioFile ? 'File Selected' : 'Upload File'}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>


                                    <button 
                                        type="submit"
                                        disabled={portfolioSubmitting}
                                        className="w-full py-5 bg-gradient-red text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm mt-4"
                                    >
                                        {portfolioSubmitting ? 'Uploading to Spark...' : 'Add to Portfolio'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderOverview = () => {
        const profileCompletion = (() => {
            if (!userProfile) return 0;
            let score = 0;
            if (userProfile.bio) score += 20;
            if (userProfile.nicheCategory || userProfile.niche) score += 20;
            if (userProfile.skills && userProfile.skills.length > 0) score += 20;
            if (userProfile.instagram || userProfile.twitter || userProfile.tiktok) score += 20;
            if (userProfile.portfolio && userProfile.portfolio.length > 0) score += 20;
            return score;
        })();

        const activeGigsCount = myCampaigns.filter(c => ['selected', 'in_progress', 'submitted', 'revision', 'approved'].includes(c.status)).length;
        
        const matchedOpportunities = data.filter(item => {
            if (item.category === 'Event') return false;
            const niche = (userProfile?.nicheCategory || userProfile?.niche || '').toLowerCase();
            if (!niche) return false;
            const title = (item.title || item.displayTitle || '').toLowerCase();
            const desc = (item.description || item.brief || '').toLowerCase();
            return title.includes(niche) || desc.includes(niche);
        });

        const pendingPayouts = myCampaigns.filter(c => ['approved', 'submitted'].includes(c.status)).reduce((sum, c) => sum + (c.amount || 0), 0);
        const pendingProposalsCount = proposals.filter(p => p.status === 'pending' && p.recipientId === userProfile?.id).length;

        const isProfileDone = profileCompletion >= 80;
        const isSocialDone = !!(userProfile?.instagram || userProfile?.twitter || userProfile?.tiktok);
        const isAppliedDone = myApplications.length > 0;
        const isBankDone = !!(userProfile?.bankDetails || (bankDetails.bank && bankDetails.account));

        return (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]">Welcome, {userProfile?.name || 'Creator'}!</h2>
                        <p className="text-[var(--text-secondary)] font-medium mt-1">Quick summary of your profile, gigs, applications, and earnings.</p>
                    </div>
                    {userProfile?.nicheCategory && (
                        <span className="px-4 py-2 bg-spark-red/10 text-spark-red border border-spark-red/20 rounded-full text-xs font-black uppercase tracking-wider">
                            ✨ {userProfile.nicheCategory} Creator
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Profile Strength', value: `${profileCompletion}%`, icon: <User className="w-6 h-6" />, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', action: () => setCurrentSection('profile_portfolio') },
                        { label: 'Active Gigs', value: activeGigsCount, icon: <Briefcase className="w-6 h-6" />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', action: () => setCurrentSection('active_gigs') },
                        { label: 'Matched Opportunities', value: matchedOpportunities.length, icon: <Sparkles className="w-6 h-6" />, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', action: () => setCurrentSection('opportunities') },
                        { label: 'Pending Payouts', value: `₦${pendingPayouts.toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'text-green-500 bg-green-500/10 border-green-500/20', action: () => setCurrentSection('earnings_wallet') }
                    ].map((stat, i) => (
                        <div 
                            key={i} 
                            onClick={stat.action}
                            className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Direct Assignments Alert */}
                {myCampaigns.filter(c => c.status === 'selected').length > 0 && (
                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-spark-red/20 shadow-md space-y-6">
                        <div>
                            <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                                <Zap className="w-5 h-5 text-spark-red" /> Pending Gig Assignments
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Brands have assigned these gigs directly to you. Please accept or decline them.</p>
                        </div>
                        <div className="grid gap-4">
                            {myCampaigns.filter(c => c.status === 'selected').map((camp) => (
                                <div key={camp.id} className="p-5 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-black text-lg text-[var(--text-primary)]">{camp.campaignTitle || 'Direct Campaign'}</h4>
                                        <p className="text-xs text-spark-red font-black uppercase tracking-widest mt-1">{camp.brandName || 'Verified Brand'}</p>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Reward: ₦{(camp.amount || 0).toLocaleString()} · Due: {camp.campaign?.deadline || '---'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptAssignment(camp)}
                                            className="px-4 py-2 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-sm"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleDeclineAssignment(camp)}
                                            className="px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-sm"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                        <h3 className="text-lg font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Award className="w-5 h-5 text-spark-red" /> Creator Checklist
                        </h3>
                        <div className="space-y-4">
                            {[
                                { id: 'profile', label: 'Complete profile details (80%+)', checked: isProfileDone, desc: 'Add niche, skills, bio & profile pic.', action: () => setCurrentSection('profile_portfolio') },
                                { id: 'socials', label: 'Link social channels', checked: isSocialDone, desc: 'Connect your Instagram, TikTok, or X accounts.', action: () => setCurrentSection('profile_portfolio') },
                                { id: 'apply', label: 'Apply to opportunities', checked: isAppliedDone, desc: 'Find open campaigns on the board.', action: () => setCurrentSection('opportunities') },
                                { id: 'bank', label: 'Link bank account details', checked: isBankDone, desc: 'Set up payout info for earnings.', action: () => setCurrentSection('earnings_wallet') },
                                { id: 'feedback', label: 'Provide platform feedback', checked: checklistItems.custom_feedback, desc: 'Let us know how you like ABC-Rally.', action: () => setChecklistItems(prev => ({ ...prev, custom_feedback: !prev.custom_feedback })) }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-all">
                                    <button 
                                        onClick={item.action} 
                                        className="mt-0.5 text-spark-red hover:scale-110 transition-transform flex-shrink-0"
                                    >
                                        {item.checked ? (
                                            <CheckCircle className="w-6 h-6 fill-spark-red text-white" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-[var(--border-color)]" />
                                        )}
                                    </button>
                                    <div className="flex-1 cursor-pointer" onClick={item.action}>
                                        <p className={`text-sm font-bold text-[var(--text-primary)] ${item.checked ? 'line-through opacity-55' : ''}`}>{item.label}</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" /> Matched Listings
                            </h3>
                            <button onClick={() => setCurrentSection('opportunities')} className="text-xs font-black text-spark-red uppercase tracking-widest hover:underline">View All →</button>
                        </div>

                        {matchedOpportunities.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-sm text-[var(--text-secondary)] font-medium">No direct matches. Complete your profile details to see tailored opportunities.</p>
                                <button onClick={() => setCurrentSection('opportunities')} className="mt-4 px-6 py-2.5 bg-spark-black text-white rounded-xl text-xs font-black uppercase hover:bg-spark-red transition-all">Explore Gigs</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {matchedOpportunities.slice(0, 3).map((item, idx) => (
                                    <div key={idx} className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h4 className="font-black text-[var(--text-primary)] truncate">{item.displayTitle || item.title}</h4>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{item.displayBrand || 'Brand'} · ₦{(item.displayReward || 0).toLocaleString()}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (item.category === 'Event') {
                                                    setSelectedEvent(item);
                                                } else {
                                                    handleOpenApplyModal(item);
                                                }
                                            }}
                                            className="px-4 py-2 bg-spark-black hover:bg-spark-red text-white text-[10px] font-black uppercase rounded-lg transition-colors whitespace-nowrap"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {pendingProposalsCount > 0 && (
                            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                                    <div>
                                        <p className="text-xs font-black text-yellow-800 uppercase tracking-wider">New Invitations</p>
                                        <p className="text-xs text-yellow-700 font-medium">You have {pendingProposalsCount} pending brand invitation{pendingProposalsCount !== 1 ? 's' : ''}!</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setCurrentSection('collaboration'); setCollabSubTab('invitations'); }}
                                    className="px-4 py-2 bg-yellow-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                    Review
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderProfilePortfolio = () => {
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border-color)] pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Profile & Portfolio</h2>
                        <p className="text-[var(--text-secondary)] mt-1 font-medium">Update your bio, skills, content samples, social links, and creator profile.</p>
                    </div>
                    <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
                        <button 
                            onClick={() => setProfileSubTab('profile')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                profileSubTab === 'profile'
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-sm border border-[var(--border-color)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Profile Details
                        </button>
                        <button 
                            onClick={() => setProfileSubTab('portfolio')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                profileSubTab === 'portfolio'
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-sm border border-[var(--border-color)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            My Portfolio ({userProfile?.portfolio?.length || 0})
                        </button>
                    </div>
                </div>

                {profileSubTab === 'profile' ? (
                    <ProfileView user={userProfile} onUpdate={fetchUserData} />
                ) : (
                    renderPortfolio()
                )}
            </div>
        );
    };

    const renderOpportunities = () => {
        const filteredGigs = data.filter((gig) => {
            const matchesSearch = 
                (gig.displayTitle || gig.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (gig.displayBrand || gig.brand || gig.brandName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (gig.description || gig.brief || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = 
                selectedCategory === 'All' || 
                gig.category === selectedCategory;
            
            const rewardAmount = Number(gig.displayReward || gig.reward || gig.budget || 0);
            let matchesBudget = true;
            if (selectedBudgetRange === 'Under ₦50k') {
                matchesBudget = rewardAmount < 50000;
            } else if (selectedBudgetRange === '₦50k-₦200k') {
                matchesBudget = rewardAmount >= 50000 && rewardAmount <= 200000;
            } else if (selectedBudgetRange === 'Over ₦200k') {
                matchesBudget = rewardAmount > 200000;
            }
            
            const matchesLocation = 
                selectedLocation === 'All' || 
                (gig.displayLocation || gig.location || gig.university || '').toLowerCase().includes(selectedLocation.toLowerCase());

            return matchesSearch && matchesCategory && matchesBudget && matchesLocation;
        });

        const locations = Array.from(new Set(data.map(item => item.displayLocation || item.location || item.university || 'Campus'))).filter(Boolean);

        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Opportunities</h2>
                        <p className="text-[var(--text-secondary)] font-medium mt-1">Discover paid creator gigs, campaigns, activations, and event tasks.</p>
                    </div>
                    <button 
                        onClick={() => alert("Search alert saved! You'll receive email notifications when new matching gigs are posted.")}
                        className="px-6 py-3.5 bg-spark-red text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                        Save Search Alert
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[var(--bg-primary)] p-6 rounded-3xl border border-[var(--border-color)]">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search gigs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none focus:border-spark-red transition-all"
                        />
                    </div>
                    <div>
                        <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none cursor-pointer"
                        >
                            <option value="All">All Categories</option>
                            <option value="Campaign">Brand Campaigns</option>
                            <option value="Gig">Paid Gigs / Tasks</option>
                            <option value="Event">Event Volunteering</option>
                        </select>
                    </div>
                    <div>
                        <select 
                            value={selectedBudgetRange}
                            onChange={(e) => setSelectedBudgetRange(e.target.value)}
                            className="w-full px-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none cursor-pointer"
                        >
                            <option value="All">All Budgets</option>
                            <option value="Under ₦50k">Under ₦50,000</option>
                            <option value="₦50k-₦200k">₦50,000 – ₦200,000</option>
                            <option value="Over ₦200k">Over ₦200,000</option>
                        </select>
                    </div>
                    <div>
                        <select 
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            className="w-full px-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none cursor-pointer"
                        >
                            <option value="All">All Locations</option>
                            {locations.map((loc, idx) => (
                                <option key={idx} value={loc as string}>{loc as string}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                ) : filteredGigs.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] font-medium">No opportunities match your filter selections. Try broadening your criteria!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGigs.map(gig => {
                            const myApp = getMyApplication(gig.id);
                            const myCamp = myCampaigns.find(c => c.campaignId === gig.id);
                            
                            let statusBadge = { label: 'Open', classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' };
                            if (myCamp) {
                                const s = myCamp.status;
                                statusBadge = s === 'paid' ? { label: 'Paid', classes: 'bg-green-500/20 text-green-800 dark:text-green-300 border border-green-500/30' } :
                                              s === 'approved' ? { label: 'Approved', classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' } :
                                              s === 'submitted' ? { label: 'Submitted', classes: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' } :
                                              s === 'selected' ? { label: '⚡ Direct Offer', classes: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20' } :
                                              { label: 'In Progress', classes: 'bg-spark-red/10 text-spark-red border border-spark-red/20' };
                            } else if (myApp) {
                                statusBadge = myApp.status === 'pending' ? { label: 'Applied', classes: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' } :
                                              myApp.status === 'rejected' ? { label: 'Not Selected', classes: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)]' } :
                                              { label: 'Open', classes: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' };
                            }

                            return (
                                <div key={gig.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all flex flex-col p-8 group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-spark-red/10 rounded-xl flex items-center justify-center text-xl font-black text-spark-red border border-spark-red/10">
                                            {(gig.displayBrand || gig.brand || gig.brandName || '⚡').charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.classes}`}>{statusBadge.label}</span>
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                gig.category === 'Campaign' ? 'bg-spark-red/10 text-spark-red' : gig.category === 'Event' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {gig.category}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-xl mb-1 group-hover:text-spark-red transition-colors text-[var(--text-primary)]">{gig.displayTitle || gig.title}</h3>
                                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">{gig.displayBrand || gig.brand || gig.brandName || 'Brand'}</p>
                                    <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">{gig.description || gig.brief || 'No description provided.'}</p>
                                    
                                    <div className="bg-[var(--bg-secondary)] dark:bg-spark-black/20 rounded-2xl p-4 mb-6 space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>{gig.category === 'Event' ? 'Target Sponsorship' : 'Reward'}</span>
                                            <span className="text-[var(--text-primary)]">₦{(gig.displayReward || gig.reward || gig.budget || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--text-secondary)]">
                                            <span>{gig.category === 'Event' ? 'Event Date' : 'Deadline'}</span>
                                            <span className="text-[var(--text-primary)]">{gig.deadline || gig.date || 'Ongoing'}</span>
                                        </div>
                                    </div>

                                    {myCamp ? (
                                        myCamp.status === 'selected' ? (
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => handleAcceptAssignment(myCamp)}
                                                    className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                                                >
                                                    Accept Offer
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineAssignment(myCamp)}
                                                    className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                                                >
                                                    Decline Offer
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedCampaign(myCamp); setCurrentSection('active_gigs'); }}
                                                className="w-full px-4 py-3.5 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
                                            >
                                                Manage Active Campaign
                                            </button>
                                        )
                                    ) : (
                                        <div className="space-y-3">
                                            {myApp && (
                                                <div className="px-4 py-2 bg-spark-black/5 dark:bg-white/5 rounded-xl border border-spark-black/10 dark:border-white/10 text-center text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest">
                                                    Latest Application: {myApp.status}
                                                </div>
                                            )}
                                            <button 
                                                onClick={() => gig.category === 'Event' ? handleContactHost(gig) : handleOpenApplyModal(gig)} 
                                                className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-2xl hover:bg-spark-red hover:text-white transition-all text-sm shadow-lg shadow-black/5"
                                            >
                                                {gig.category === 'Event' ? 'Contact Host' : myApp ? 'Submit Another Pitch' : 'Apply to Campaign'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderPartners = () => {
        const filteredPartners = partners.filter((partner) => {
            const displayName = partner.name || partner.companyName || '';
            const description = partner.description || '';
            const uni = partner.university || partner.location || '';
            const matchesSearch = 
                displayName.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
                description.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
                uni.toLowerCase().includes(partnerSearchTerm.toLowerCase());
            return matchesSearch;
        });

        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Brands & Student Associations</h2>
                        <p className="text-[var(--text-secondary)] font-medium mt-1">Discover and pitch collaboration proposals directly to top Gen-Z brands and associations, and youth communities you can work with.</p>
                    </div>
                </div>

                <div className="relative max-w-md bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--border-color)]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search partners..."
                        value={partnerSearchTerm}
                        onChange={(e) => setPartnerSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none focus:border-spark-red transition-all"
                    />
                </div>

                {partnersLoading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spark-red"></div></div>
                ) : filteredPartners.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <p className="text-[var(--text-secondary)] font-medium">No partners match your search criteria. Try a different term!</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPartners.map(partner => {
                            const displayName = partner.name || partner.companyName || 'Unknown Partner';
                            const roleLabel = partner.role === 'Brand' ? 'Brand Partner' : 'Student Association';
                            const badgeColor = partner.role === 'Brand' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
                            const location = partner.university || partner.location || 'Nationwide';
                            const description = partner.description || 'Connect with this partner to explore collaborations, sponsorships, and campus activations.';

                            return (
                                <div key={partner.id} className="group bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                                    <div className="h-24 bg-spark-red/5 transition-colors" />
                                    <div className="px-8 pb-6 -mt-12">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-14 h-14 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-xl font-black text-spark-red shadow-inner overflow-hidden">
                                                {partner.imageUrl ? <img src={partner.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" /> : displayName.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-[var(--text-primary)] leading-tight">{displayName}</h3>
                                                <span className={`inline-block px-3 py-1 mt-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                                                    {roleLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-3 mb-5 min-h-[54px] leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                    <div className="px-8 pb-8">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-[var(--text-secondary)] mb-4">
                                            <span>Location</span>
                                            <span className="text-[var(--text-primary)] truncate max-w-[150px]">{location}</span>
                                        </div>
                                        <button
                                            onClick={() => handleOpenProposalModal(partner)}
                                            className="w-full py-3.5 bg-spark-red text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all active:scale-95 shadow-sm"
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
    };

    const renderApplications = () => {
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)]">My Applications</h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Track gigs and opportunities you have applied for.</p>
                </div>

                {myApplications.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <div className="w-16 h-16 bg-spark-red/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                            <FileText className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">No Applications Yet</h3>
                        <p className="text-[var(--text-secondary)] font-medium mb-6">You haven't applied to any gigs or campaigns yet.</p>
                        <button 
                            onClick={() => setCurrentSection('opportunities')}
                            className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
                        >
                            Find Campus Gigs
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {myApplications.map((app, idx) => {
                            const steps = ['applied', 'shortlisted', 'accepted', 'paid'];
                            const currentIdx = app.status === 'rejected' ? -1 : 
                                               app.status === 'paid' ? 3 :
                                               ['selected', 'in_progress', 'submitted', 'approved'].includes(app.status) ? 2 :
                                               app.status === 'shortlisted' ? 1 : 0;
                            
                            return (
                                <div key={idx} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6 mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-[var(--text-primary)]">{app.campaignTitle || 'Campus Campaign'}</h3>
                                            <p className="text-xs font-black text-spark-red uppercase tracking-widest mt-1">Applied on {new Date(app.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest self-start ${
                                            app.status === 'paid' || app.status === 'approved' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' :
                                            app.status === 'rejected' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' :
                                            'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                                        }`}>
                                            {app.status}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-8">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">My Pitch / Message</p>
                                        <p className="text-sm text-[var(--text-primary)] font-medium bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] leading-relaxed italic">
                                            "{app.pitch || 'No pitch text provided.'}"
                                        </p>
                                    </div>

                                    {app.status === 'rejected' ? (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <p className="text-xs text-red-800 font-medium">This application was not selected. Check the opportunities page for other listings.</p>
                                        </div>
                                    ) : app.status === 'paid' ? (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <p className="text-xs text-green-800 dark:text-green-400 font-medium">This gig is complete and your payment has been processed.</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    // Find the matching campaign allocation by campaignId or gigId
                                                    const matchedAllocation = myCampaigns.find(
                                                        c => c.campaignId === app.campaignId || c.campaignId === app.gigId || c.id === app.campaignId
                                                    );
                                                    if (matchedAllocation) {
                                                        setRatingRequestCampaignId(matchedAllocation.id || matchedAllocation.campaignId);
                                                    }
                                                    setCurrentSection('ratings_reviews');
                                                }}
                                                className="w-full py-3.5 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                <Star className="w-4 h-4" />
                                                Request Rating &amp; Review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Application Progress</p>
                                            <div className="relative flex justify-between items-center max-w-lg mx-auto py-4">
                                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--border-color)] -translate-y-1/2 z-0"></div>
                                                <div 
                                                    className="absolute top-1/2 left-0 h-1 bg-spark-red -translate-y-1/2 z-0 transition-all duration-500"
                                                    style={{ width: `${currentIdx * 33.3}%` }}
                                                ></div>
                                                
                                                {steps.map((step, sIdx) => {
                                                    const isPassed = sIdx <= currentIdx;
                                                    const isActive = sIdx === currentIdx;
                                                    return (
                                                        <div key={sIdx} className="relative z-10 flex flex-col items-center">
                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                isPassed 
                                                                    ? 'bg-spark-red border-spark-red text-white' 
                                                                    : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]'
                                                            } ${isActive ? 'ring-4 ring-spark-red/20' : ''}`}>
                                                                {isPassed ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-secondary)] mt-2 bg-[var(--bg-primary)] px-2">{step}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const renderActiveGigs = () => {
        const activeCampaigns = myCampaigns.filter(c => ['selected', 'in_progress', 'submitted', 'revision', 'approved'].includes(c.status));

        if (selectedCampaign) {
            const isApproved = selectedCampaign.status === 'approved';
            const isSubmitted = selectedCampaign.status === 'submitted';
            return (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 bg-[var(--bg-primary)] p-8 sm:p-10 rounded-[3rem] border border-[var(--border-color)]">
                    <div className="flex justify-between items-start border-b border-[var(--border-color)] pb-6 mb-6">
                        <div>
                            <button 
                                onClick={() => setSelectedCampaign(null)}
                                className="text-xs font-black text-spark-red uppercase tracking-widest hover:underline flex items-center gap-1 mb-2"
                            >
                                ← Back to list
                            </button>
                            <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">{selectedCampaign.campaign?.title || selectedCampaign.campaignTitle || 'Campaign Details'}</h3>
                            <p className="text-sm font-black text-spark-red uppercase tracking-widest mt-1">{selectedCampaign.brandName || 'Verified Sponsor'}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            isApproved ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                            isSubmitted ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                            'bg-spark-red/10 text-spark-red border-spark-red/20'
                        }`}>
                            {selectedCampaign.status}
                        </span>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">Gig Brief & Objectives</h4>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">
                                    {selectedCampaign.campaign?.description || selectedCampaign.campaign?.brief || 'Review requirements carefully before starting content creation. Maintain brand authenticity in all student promotions.'}
                                </p>
                            </div>
                            
                            <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                                <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">Required Deliverables</h4>
                                <div className="space-y-3">
                                    {[
                                        'Review sponsor requirements & references',
                                        'Produce marketing graphic / short-form video draft',
                                        'Publish to primary linked social media handle',
                                        'Copy submission url and upload screenshot proof of metrics'
                                    ].map((del, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-sm text-[var(--text-primary)] font-medium">{del}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] self-start">
                            <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4">Submit Deliverables</h4>
                            {isApproved ? (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="text-sm font-black text-green-800">Sponsor Approved!</p>
                                    <p className="text-xs text-green-700 mt-1 font-medium">Escrow funds released to wallet. Payout is processed.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmitWork} className="space-y-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Live Content Link</label>
                                        <input 
                                            type="url" 
                                            required
                                            value={submissionData.link}
                                            onChange={e => setSubmissionData({...submissionData, link: e.target.value})}
                                            placeholder="https://instagram.com/p/..."
                                            disabled={isSubmitted || submittingWork}
                                            className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none text-xs font-bold focus:border-spark-red"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Performance Summary / Note</label>
                                        <textarea 
                                            required
                                            value={submissionData.text}
                                            onChange={e => setSubmissionData({...submissionData, text: e.target.value})}
                                            placeholder="Brief description of post metrics (reach, impressions)..."
                                            disabled={isSubmitted || submittingWork}
                                            className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl outline-none text-xs font-bold focus:border-spark-red min-h-[80px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Metrics File (e.g. Screenshot)</label>
                                        <input 
                                            type="file" 
                                            onChange={e => setMetricsFile(e.target.files?.[0] || null)}
                                            disabled={isSubmitted || submittingWork}
                                            id="metrics-file-upload"
                                            className="hidden"
                                        />
                                        <label 
                                            htmlFor="metrics-file-upload"
                                            className="w-full px-4 py-3.5 bg-spark-black text-white hover:bg-spark-red rounded-xl font-black text-[10px] uppercase tracking-widest text-center cursor-pointer block transition-all"
                                        >
                                            {metricsFile ? 'File Selected' : 'Upload Proof Screenshot'}
                                        </label>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitted || submittingWork}
                                        className="w-full py-4 bg-spark-red text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                                    >
                                        {submittingWork ? 'Submitting Work...' : isSubmitted ? 'Pending Brand Approval' : 'Submit for Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Raise Dispute button */}
                    <div className="pt-4 border-t border-[var(--border-color)] flex justify-end">
                        <button
                            onClick={() => {
                                setPreSelectedDisputeEntity({
                                    id: selectedCampaign.id,
                                    title: selectedCampaign.campaignTitle || selectedCampaign.campaign?.title || 'Active Campaign',
                                    type: 'campaign_allocation',
                                    amount: selectedCampaign.amount || 0,
                                    counterpartyId: selectedCampaign.brandId || '',
                                    counterpartyName: selectedCampaign.brandName || 'Verified Brand',
                                    counterpartyEmail: '',
                                    counterpartyRole: 'Brand',
                                    escrowId: selectedCampaign.escrowId || null,
                                    escrowRef: selectedCampaign.escrowRef || null,
                                    escrowPaymentUrl: selectedCampaign.escrowPaymentUrl || null
                                });
                                setCurrentSection('disputes');
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 border border-spark-red/40 text-spark-red text-xs font-black uppercase tracking-wider rounded-xl hover:bg-spark-red/10 transition-all cursor-pointer"
                        >
                            <Scale className="w-4 h-4" /> Raise a Dispute
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)]">Active Gigs</h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Manage accepted gigs, tasks, deadlines, and delivery updates.</p>
                </div>

                {activeCampaigns.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-primary)] rounded-[3rem] border-2 border-dashed border-[var(--border-color)]">
                        <div className="w-16 h-16 bg-spark-red/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-spark-red">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">No Active Gigs</h3>
                        <p className="text-[var(--text-secondary)] font-medium mb-6">You don't have any active campaigns or volunteer gigs currently assigned.</p>
                        <button 
                            onClick={() => setCurrentSection('opportunities')}
                            className="px-8 py-4 bg-spark-black text-white font-black rounded-2xl hover:bg-spark-red transition-all"
                        >
                            Find Campus Gigs
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {activeCampaigns.map(camp => (
                            <div key={camp.id} className="bg-[var(--bg-primary)] rounded-[2.5rem] border border-[var(--border-color)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-spark-red/10 rounded-2xl flex items-center justify-center font-black text-spark-red shadow-inner">
                                        <Zap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-[var(--text-primary)]">{camp.campaign?.title || camp.campaignTitle || 'Active Campaign'}</h4>
                                        <p className="text-xs font-black text-spark-red uppercase tracking-widest">{camp.campaign?.brand || camp.brandName || 'Verified Brand'}</p>
                                        <div className="flex gap-3 mt-2">
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">₦{(camp.amount || camp.campaign?.reward || 0).toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-300">•</span>
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Due: {camp.campaign?.deadline || '---'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        camp.status === 'approved' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' :
                                        camp.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' :
                                        camp.status === 'selected' ? 'bg-spark-red/10 text-spark-red border-spark-red/20' :
                                        camp.status === 'revision' ? 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' :
                                        'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}>
                                        {camp.status === 'selected' ? 'Brand Accepted - Start Working' : camp.status.replace('_', ' ')}
                                    </span>
                                    {camp.status === 'selected' ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptAssignment(camp)}
                                                className="px-4 py-2 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 transition-all text-xs"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDeclineAssignment(camp)}
                                                className="px-4 py-2 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-all text-xs"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    ) : camp.status === 'revision' ? (
                                        <button
                                            onClick={() => handleResubmitReport(camp)}
                                            className="px-4 py-2 bg-yellow-600 text-white font-black rounded-xl hover:bg-yellow-700 transition-all text-xs"
                                        >
                                            Resubmit Report
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedCampaign(camp)}
                                            className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-black rounded-xl hover:bg-spark-red hover:text-white transition-all text-xs shadow-sm"
                                        >
                                            Manage Work
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderEarningsWallet = () => {
        const calculatedEscrow = myCampaigns
            .filter(c => ['selected', 'in_progress', 'submitted', 'approved'].includes(c.status))
            .reduce((sum, c) => sum + (c.amount || 0), 0);
        
        const activeTransactions = transactions.filter(t => isTransactionActive(t, myCampaigns));
        const totalEarnings = activeTransactions.reduce((acc, t) => acc + (t.type === 'credit' && t.status === 'completed' ? (Number(t.amount) || 0) : 0), 0);

        const hasBankLinked = !!(userProfile?.bankDetails?.bank && userProfile?.bankDetails?.account);

        return (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border-color)] pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Earnings & Wallet</h2>
                        <p className="text-[var(--text-secondary)] font-medium mt-1">Track your pending payouts, view transaction history, and request withdrawals to your linked bank account.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    {[
                        { label: 'Available Balance', value: `₦${(wallet?.balance || 0).toLocaleString()}`, icon: <Wallet className="w-6 h-6" />, color: 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20' },
                        { label: 'Locked Funds (Escrow)', value: `₦${calculatedEscrow.toLocaleString()}`, icon: <Clock className="w-6 h-6" />, color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20' },
                        { label: 'Pending Payouts', value: `₦${myCampaigns.filter(c => ['approved', 'submitted'].includes(c.status)).reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' },
                        { label: 'Total Earnings', value: `₦${totalEarnings.toLocaleString()}`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                            <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center text-xl mb-4`}>{stat.icon}</div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{stat.label}</p>
                            <h4 className="text-3xl font-black text-[var(--text-primary)]">{stat.value}</h4>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-spark-red rounded-[2.5rem] p-10 text-white shadow-xl shadow-red-100 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h3 className="text-3xl font-black mb-2 text-white">Withdraw Funds</h3>
                                <p className="text-red-100 font-medium">Ready to cash out? Send your available balance to your bank account.</p>
                                <p className="text-[10px] font-black text-spark-black uppercase tracking-widest mt-2 bg-white/20 px-3 py-1 rounded-full inline-block">Note: A 10% platform service fee applies to all earnings.</p>
                            </div>
                            <button 
                                onClick={() => {
                                    if (!hasBankLinked) {
                                        alert("Please verify & link your bank details first!");
                                        return;
                                    }
                                    setShowWithdrawModal(true);
                                }}
                                disabled={(wallet?.balance || 0) < 1000}
                                className="px-12 py-5 bg-spark-black text-white font-black rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
                            >
                                {(wallet?.balance || 0) < 1000 ? 'Min ₦1,000' : 'Request Payout'}
                            </button>
                        </div>

                        <div className="bg-[var(--bg-primary)] rounded-[3rem] border border-[var(--border-color)] shadow-sm p-10">
                            <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8">Transaction History</h3>
                            <div className="space-y-4">
                                {activeTransactions.length === 0 ? (
                                    <div className="text-center py-10 text-[var(--text-secondary)] italic font-medium">No transactions recorded yet.</div>
                                ) : (
                                    activeTransactions.map((trans: any, i) => (
                                        <div key={i} className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] rounded-2xl hover:bg-[var(--bg-tertiary)] transition-all">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-lg ${trans.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {trans.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-[var(--text-primary)]">{trans.description}</p>
                                                    <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">
                                                        {(() => {
                                                            if (!trans.createdAt) return 'Pending';
                                                            const date = trans.createdAt.seconds ? new Date(trans.createdAt.seconds * 1000) : new Date(trans.createdAt);
                                                            return date.toLocaleDateString();
                                                        })()}
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
                    </div>

                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] self-start space-y-6">
                        <div>
                            <h3 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                                <Shield className="w-5 h-5 text-green-600" /> Payout Destination
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Verify your bank account for secure direct deposit payouts.</p>
                        </div>

                        {hasBankLinked && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-green-600" />
                                <div className="text-xs">
                                    <p className="font-black text-green-800">Verified & Linked</p>
                                    <p className="text-green-700 font-medium">{userProfile?.bankDetails?.bank} - {userProfile?.bankDetails?.account}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveBankDetails} className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Bank Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={bankDetails.bank}
                                    onChange={e => setBankDetails({...bankDetails, bank: e.target.value})}
                                    placeholder="e.g. GTBank, Zenith, Kuda"
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none text-xs font-bold focus:border-spark-red"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Account Number</label>
                                <input 
                                    type="text" 
                                    required
                                    pattern="[0-9]{10}"
                                    maxLength={10}
                                    value={bankDetails.account}
                                    onChange={e => setBankDetails({...bankDetails, account: e.target.value})}
                                    placeholder="10 digit account number"
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none text-xs font-bold focus:border-spark-red"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Account Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={bankDetails.name}
                                    onChange={e => setBankDetails({...bankDetails, name: e.target.value})}
                                    placeholder="Account holder's official name"
                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl outline-none text-xs font-bold focus:border-spark-red"
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className="w-full py-4 bg-spark-black text-white hover:bg-spark-red rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Link & Verify Bank Details
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const renderCollaboration = () => {
        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--border-color)] pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">Collaboration Hub</h2>
                        <p className="text-[var(--text-secondary)] mt-1 font-medium">Manage invitations, create team-up gigs, and calculate payment splits with co-creators.</p>
                    </div>
                    <div className="flex gap-2 bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
                        <button 
                            onClick={() => setCollabSubTab('invitations')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                collabSubTab === 'invitations'
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-sm border border-[var(--border-color)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Invitations ({proposals.filter(p => p.status === 'pending').length})
                        </button>
                        <button 
                            onClick={() => setCollabSubTab('network')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                collabSubTab === 'network'
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-sm border border-[var(--border-color)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Partner Network
                        </button>
                        <button 
                            onClick={() => setCollabSubTab('splits')}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                                collabSubTab === 'splits'
                                    ? 'bg-[var(--bg-primary)] text-spark-red shadow-sm border border-[var(--border-color)]'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Split Calculator
                        </button>
                    </div>
                </div>

                {collabSubTab === 'invitations' && (
                    <div className="space-y-6">
                        <div className="flex bg-spark-red/5 border border-spark-red/10 p-1 rounded-2xl max-w-xs">
                            <button 
                                onClick={() => setProposalTab('incoming')}
                                className={`flex-1 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proposalTab === 'incoming' ? 'bg-spark-red text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                            >
                                Incoming
                            </button>
                            <button 
                                onClick={() => setProposalTab('outgoing')}
                                className={`flex-1 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${proposalTab === 'outgoing' ? 'bg-spark-red text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-spark-red'}`}
                            >
                                Outgoing
                            </button>
                        </div>

                        {(() => {
                            const filteredProposals = proposals.filter((p) => {
                                const isSender = p.senderId === (userProfile?.id || auth.currentUser?.uid);
                                return proposalTab === 'incoming' ? !isSender : isSender;
                            });

                            return filteredProposals.length === 0 ? (
                                <div className="bg-[var(--bg-primary)] p-12 rounded-[3rem] border border-[var(--border-color)] text-center shadow-sm">
                                    <Mail className="w-10 h-10 text-spark-red mx-auto mb-4" />
                                    <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                                        {proposalTab === 'incoming' ? "No Incoming Offers" : "No Outgoing Pitches"}
                                    </h3>
                                    <p className="text-[var(--text-secondary)] font-medium">
                                        {proposalTab === 'incoming' ? "When brands or associations send you direct campaign offers, they will appear here." : "When you submit collaboration proposals, they will appear here."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {filteredProposals.map((p) => {
                                        const isSender = p.senderId === (userProfile?.id || auth.currentUser?.uid);
                                        const isDirectOffer = p.status === 'pending' && !isSender;
                                        const otherParty = (isSender ? p.recipient : p.sender) || { name: 'Unknown User', role: 'Unknown', email: '' };
                                        const displayName = otherParty.name !== 'Unknown User' ? otherParty.name : (otherParty.email || 'Unknown User');
                                        return (
                                            <div key={p.id} className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div className="flex items-center space-x-6">
                                                    <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center text-2xl font-black text-spark-red shadow-inner flex-shrink-0">
                                                        {otherParty.imageUrl ? <img src={otherParty.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" /> : (displayName.charAt(0))}
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
                                                        <button
                                                            onClick={() => setSelectedProposal(p)}
                                                            className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--bg-tertiary)] transition-all border border-[var(--border-color)]"
                                                        >
                                                            View & Decide
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => setSelectedProposal(p)}
                                                                className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-spark-red hover:text-white transition-all border border-transparent"
                                                            >
                                                                View & Decide
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
                            );
                        })()}
                    </div>
                )}

                {collabSubTab === 'network' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.map(member => {
                            const creatorType = member.influencerType || (member.university ? 'Student Creator' : 'Professional Creator');
                            const isProfessional = creatorType === 'Professional Creator';
                            const niche = member.niche || member.nicheCategory || member.category || null;
                            return (
                                <div key={member.id} className="bg-[var(--bg-primary)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl hover:border-spark-red/20 transition-all flex flex-col justify-between text-left group">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isProfessional ? 'bg-blue-500/10 text-blue-600' : 'bg-spark-red/5 text-spark-red'}`}>
                                                {isProfessional ? 'Professional' : 'Student'}
                                            </span>
                                            {member.rating && (
                                                <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                                    <span>★</span>
                                                    <span>{member.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-16 h-16 rounded-2xl bg-spark-red/10 flex items-center justify-center text-spark-red font-black text-2xl mx-auto mb-4 overflow-hidden shadow-md">
                                            {member.imageUrl ? <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover rounded-2xl" /> : member.name?.charAt(0) || '?'}
                                        </div>
                                        <h4 className="font-black text-[var(--text-primary)] text-center line-clamp-1 mb-1">{member.name}</h4>
                                        {niche && <p className="text-[10px] text-spark-red font-black uppercase tracking-widest text-center mb-2">{niche}</p>}
                                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center mb-4">📍 {member.university || member.location || 'Campus'}</p>

                                        {/* Social Handles */}
                                        <div className="flex gap-2 mb-4 justify-center">
                                            {member.instagram && (
                                                <a href={member.instagram.startsWith('http') ? member.instagram : `https://instagram.com/${member.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-secondary)] hover:text-spark-red rounded-xl transition-all">
                                                    <Instagram className="w-4 h-4" />
                                                </a>
                                            )}
                                            {member.tiktok && (
                                                <a href={member.tiktok.startsWith('http') ? member.tiktok : `https://tiktok.com/@${member.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-secondary)] hover:text-spark-red rounded-xl transition-all">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.7-4.06-1.66-.27-.23-.52-.48-.75-.75-.01 2.91-.02 5.82-.02 8.74-.08 2.37-1.12 4.74-3.05 6.13-2.14 1.58-5.11 2.05-7.58 1.25-2.82-.87-5.06-3.47-5.26-6.47-.36-4.22 2.91-8.23 7.15-8.43.19-.01.37 0 .56-.01V8.33c-1.92.21-3.79 1.48-4.57 3.25-.97 2.12-.55 4.8 1.01 6.55 1.55 1.76 4.14 2.38 6.27 1.59 1.83-.66 3.14-2.49 3.23-4.47.08-2.73.04-5.46.05-8.19-.01 0-.01 0-.02 0-.07-.94-.48-1.89-1.17-2.54-.74-.74-1.78-1.15-2.83-1.18V.02z"/></svg>
                                                </a>
                                            )}
                                            {member.twitter && (
                                                <a href={member.twitter.startsWith('http') ? member.twitter : `https://twitter.com/${member.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[var(--bg-secondary)] hover:bg-spark-red/10 text-[var(--text-secondary)] hover:text-spark-red rounded-xl transition-all">
                                                    <Twitter className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>

                                        {member.bio && <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed text-center">{member.bio}</p>}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setProposalRecipient({ id: member.id, name: member.name, isCreator: true });
                                            setProposalInitialMessage(`Hey ${member.name}, I'd love to collaborate on a campaign together!`);
                                            setShowProposalModal(true);
                                        }}
                                        className="w-full py-3 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all text-xs uppercase tracking-wider text-center"
                                    >
                                        Collaborate
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}


                {collabSubTab === 'splits' && (
                    <div className="bg-[var(--bg-primary)] p-8 sm:p-10 rounded-[3rem] border border-[var(--border-color)] shadow-sm max-w-2xl mx-auto space-y-8">
                        <div>
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Co-Creator Payout Splits</h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Teaming up on a big campaign? Divide the reward escrow splits in real-time.</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Total Campaign Budget (₦)</label>
                                <input 
                                    type="number" 
                                    placeholder="Enter total reward amount, e.g. 150000"
                                    value={splitTotal}
                                    onChange={(e) => setSplitTotal(e.target.value)}
                                    className="w-full px-6 py-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl outline-none text-sm font-bold focus:border-spark-red"
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Share Splits</p>
                                {splitShares.map((share, idx) => (
                                    <div key={idx} className="space-y-2 bg-[var(--bg-secondary)] p-4 rounded-2xl border border-[var(--border-color)]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black text-[var(--text-primary)]">{share.name}</span>
                                            <span className="text-xs font-black text-spark-red">{share.percentage}% Split</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={share.percentage}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                const updated = [...splitShares];
                                                updated[idx].percentage = val;
                                                const otherIdx = idx === 0 ? 1 : 0;
                                                updated[otherIdx].percentage = 100 - val;
                                                setSplitShares(updated);
                                            }}
                                            className="w-full accent-spark-red cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)]">
                                            <span>Est. Payout:</span>
                                            <span className="text-[var(--text-primary)]">₦{((Number(splitTotal) || 0) * share.percentage / 100).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-blue-800 font-medium">
                                    <p className="font-bold">How splits work:</p>
                                    <p className="mt-1">When applying for group gigs, you can attach co-creator splits to your pitch. Upon milestone completion, the smart escrow splits and pays all team members automatically.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderRatingsReviews = () => {
        const completedCampaigns = myCampaigns.filter(c => c.status === 'paid');
        const avgScore = testimonials.length > 0
            ? (testimonials.reduce((sum, t) => sum + (Number(t.stars) || 5), 0) / testimonials.length).toFixed(1)
            : (userProfile?.rating || '0.0');

        return (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)]">Ratings & Reviews</h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">Review feedback, and ratings from completed collaborations.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm space-y-6 self-start text-center">
                        <div>
                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Average Performance Score</p>
                            <h3 className="text-6xl font-black text-[var(--text-primary)] mt-3">{avgScore}</h3>
                        </div>
                        <div className="flex justify-center gap-1 text-yellow-500">
                            {Array.from({ length: Math.round(Number(avgScore)) }).map((_, i) => (
                                <Star key={i} className="w-6 h-6 fill-yellow-500" />
                            ))}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] font-medium">Based on {testimonials.length} reviews & recommendations on ABC-Rally.</p>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
                            <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Recent Brand Testimonials</h3>
                            <div className="space-y-6">
                                {testimonials.length === 0 ? (
                                    <div className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] italic">
                                        No reviews or testimonials received yet. Send rating requests to your brand partners.
                                    </div>
                                ) : (
                                    testimonials.map((test, idx) => (
                                        <div key={test.id || idx} className="p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-black text-spark-red uppercase tracking-wider">{test.campaignTitle || 'Completed Collaboration'}</span>
                                                <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                                                    {test.updatedAt ? new Date(test.updatedAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <div className="flex gap-0.5 text-yellow-500">
                                                {Array.from({ length: Number(test.stars) || 5 }).map((_, i) => (
                                                    <Star key={i} className="w-4.5 h-4.5 fill-yellow-500 text-yellow-500" />
                                                ))}
                                            </div>
                                            <p className="text-sm text-[var(--text-primary)] font-medium italic">"{test.reviewText}"</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Request Brand Rating</h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Finished a campaign recently? Prompt the brand manager to review and write a recommendation.</p>
                            </div>

                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!ratingRequestCampaignId) return;
                                    setRatingRequestSubmitting(true);
                                    try {
                                        const selectedCamp = completedCampaigns.find(c => c.id === ratingRequestCampaignId);
                                        if (!selectedCamp) {
                                            alert('Invalid campaign selected.');
                                            return;
                                        }

                                        const newRequest = {
                                            creatorId: userProfile.id,
                                            creatorName: userProfile.name || 'Campus Creator',
                                            campaignId: selectedCamp.campaignId,
                                            campaignTitle: selectedCamp.campaignTitle || selectedCamp.campaign?.title || 'Completed Gig',
                                            brandId: selectedCamp.brandId,
                                            status: 'pending',
                                            createdAt: new Date().toISOString()
                                        };

                                        await addDoc(collection(db, 'ratingRequests'), newRequest);

                                        try {
                                            const brandDoc = await getDoc(doc(db, 'users', selectedCamp.brandId));
                                            if (brandDoc.exists() && brandDoc.data().email) {
                                                const brandEmail = brandDoc.data().email;
                                                const brandName = brandDoc.data().name || 'Brand Manager';
                                                notifyRatingRequest(
                                                    brandEmail,
                                                    brandName,
                                                    userProfile.name || 'Campus Creator',
                                                    newRequest.campaignTitle
                                                );
                                            }
                                        } catch (emailErr) {
                                            console.warn('[CreatorDashboard] Email notify rating request error:', emailErr);
                                        }

                                        alert("Review request sent successfully! The brand manager will be notified.");
                                        setRatingRequestCampaignId('');
                                    } catch (err: any) {
                                        console.error('Rating request error:', err);
                                        alert('Failed to send rating request: ' + err.message);
                                    } finally {
                                        setRatingRequestSubmitting(false);
                                    }
                                }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <select 
                                    required
                                    value={ratingRequestCampaignId}
                                    onChange={(e) => setRatingRequestCampaignId(e.target.value)}
                                    className="flex-1 px-4 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm font-bold outline-none cursor-pointer"
                                >
                                    <option value="">Select a completed campaign</option>
                                    {completedCampaigns.length > 0 ? (
                                        completedCampaigns.map(camp => (
                                            <option key={camp.id} value={camp.id}>{camp.campaignTitle || 'Completed Gig'}</option>
                                        ))
                                    ) : (
                                        <option value="">No completed campaigns found</option>
                                    )}
                                </select>
                                <button 
                                    type="submit"
                                    disabled={ratingRequestSubmitting}
                                    className="px-8 py-3.5 bg-spark-black text-white hover:bg-spark-red rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap"
                                >
                                    {ratingRequestSubmitting ? 'Sending Request...' : 'Send Request'}
                                </button>
                            </form>
                        </div>

                        {/* Platform Review Section */}
                        <div className="bg-[var(--bg-primary)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-[var(--text-primary)]">Review This Platform</h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Share your experience with ABC-Rally. Your feedback helps us improve.</p>
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!platformReviewText.trim()) return;
                                    setPlatformReviewSubmitting(true);
                                    try {
                                        const reviewDoc = {
                                            userId: userProfile?.id || user?.id,
                                            userName: userProfile?.name || 'Anonymous',
                                            userRole: 'Creator',
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
                                                <Star
                                                    className={`w-7 h-7 ${star <= platformRating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-color)]'}`}
                                                />
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
                </div>
            </div>
        );
    };


    const renderMainContent = () => {
        switch (currentSection) {
            case 'overview':
                return renderOverview();
            case 'profile_portfolio':
                return renderProfilePortfolio();
            case 'opportunities':
                return renderOpportunities();
            case 'applications':
                return renderApplications();
            case 'active_gigs':
                return renderActiveGigs();
            case 'earnings_wallet':
                return renderEarningsWallet();
            case 'collaboration':
                return renderCollaboration();
            case 'partners':
                return renderPartners();
            case 'ratings_reviews':
                return renderRatingsReviews();
            case 'disputes':
                return (
                    <DisputesPanel
                        userRole="Creator"
                        userId={user?.id || user?.uid}
                        userProfile={userProfile}
                        onNavigate={onNavigate}
                        preSelectedEntity={preSelectedDisputeEntity}
                        onClearPreSelected={() => setPreSelectedDisputeEntity(null)}
                    />
                );
            default:
                return renderOverview();
        }
    };

    return (
        <>
        <DashboardShell
            role={'Creator'}
            activeView={currentSection}
            onViewChange={setCurrentSection}
            onLogout={onLogout}
            sidebarItems={sidebarItems}
            userName={userProfile?.name || "Spark Member"}
            userSub={userProfile?.university || "Creator"}
            userId={user?.id || user?.uid}
            userImage={userProfile?.imageUrl}
            userProfile={userProfile}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            themeMode={themeMode}
            walletStrip={
                <div className="flex items-center gap-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-1.5 shadow-sm">
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Available</p>
                        <p className="text-sm font-black text-green-600">₦{(wallet?.balance || 0).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-[var(--border-color)]"></div>
                    <div className="px-3">
                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Locked Funds</p>
                        <p className="text-sm font-black text-spark-red">₦{(wallet?.escrow || 0).toLocaleString()}</p>
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

                        <div className="h-48 bg-spark-red relative">
                            <div className="absolute -bottom-12 left-12">
                                <div className="w-24 h-24 bg-[var(--bg-primary)] p-2 rounded-3xl shadow-xl ring-4 ring-white flex items-center justify-center text-4xl font-black text-spark-red">
                                    {(selectedBrand.name || '?').charAt(0)}
                                </div>
                            </div>
                        </div>

                        <div className="pt-20 p-6 sm:p-12 modal-content-scroll">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h3 className="text-4xl font-black text-[var(--text-primary)] mb-1">{selectedBrand.name}</h3>
                                    <p className="text-spark-red font-black uppercase tracking-widest text-sm">{selectedBrand.role}</p>
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
                    isCreatorCollab={!!proposalRecipient.isCreator}
                />
            )}

            {/* Withdraw Modal */}
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
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                <p className="text-[10px] font-black uppercase text-blue-600 mb-2">Completion Rule</p>
                                <p className="text-sm text-blue-700 leading-relaxed font-medium">A written report is <b>required</b> for the brand to release your payment. Please provide details on your execution, reach, and links to your work.</p>
                            </div>
                            <div className="bg-[var(--bg-secondary)] dark:bg-spark-black/20 p-6 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-[var(--text-secondary)] mb-4">Campaign Guidelines</p>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed">{selectedCampaign.campaign?.description}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-[var(--bg-primary)] dark:bg-spark-black/10 border border-[var(--border-color)] rounded-2xl">
                                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)]">Your Reward</p>
                                    <p className="text-lg font-black text-green-600">₦{(selectedCampaign.amount || selectedCampaign.campaign?.reward || 0).toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-spark-red uppercase mt-1 tracking-widest">A 10% platform service fee will be deducted from this amount.</p>
                                </div>
                                <div className="p-4 bg-[var(--bg-primary)] dark:bg-spark-black/10 border border-[var(--border-color)] rounded-2xl">
                                    <p className="text-[9px] font-black uppercase text-[var(--text-secondary)] mb-1">Current Status</p>
                                    <div className="text-xs font-black text-spark-red uppercase tracking-widest">
                                        {selectedCampaign.status === 'selected' ? 'Awaiting Execution' : 
                                         selectedCampaign.status === 'revision' ? (
                                             <div className="space-y-2">
                                                 <span>Revision Requested</span>
                                                 {selectedCampaign.revisionReason && (
                                                     <p className="normal-case font-bold text-[10px] bg-spark-red/5 p-3 rounded-xl border border-spark-red/10 text-spark-red leading-relaxed italic">
                                                         "{(selectedCampaign as any).revisionReason}"
                                                     </p>
                                                 )}
                                             </div>
                                         ) : 
                                         selectedCampaign.status}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedCampaign.status === 'in_progress' || selectedCampaign.status === 'selected' || selectedCampaign.status === 'revision' ? (
                            <form onSubmit={handleSubmitWork} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Evidence Link (Instagram/Twitter Post, Drive, etc.)</label>
                                    <input 
                                        type="url" 
                                        value={submissionData.link}
                                        onChange={(e) => setSubmissionData({...submissionData, link: e.target.value})}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)]"
                                        placeholder="https://..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Detailed Execution Report (Mandatory for Payment)</label>
                                    <textarea 
                                        rows={6}
                                        value={submissionData.text}
                                        onChange={(e) => setSubmissionData({...submissionData, text: e.target.value})}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-primary)] resize-none"
                                        placeholder="Describe exactly what you did, the reach achieved, and any insights..."
                                        required
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[var(--text-secondary)] mb-2">Execution Metrics (Reach Screenshots)</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => setMetricsFile(e.target.files?.[0] || null)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-spark-red font-bold text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-spark-red/10 file:text-spark-red"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={submittingWork}
                                    className="w-full py-4 bg-spark-black text-white font-black rounded-xl hover:bg-spark-red transition-all disabled:opacity-50 shadow-xl shadow-red-100"
                                >
                                    {submittingWork ? 'Submitting Report...' : 'Submit Final Report for Payment Approval'}
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
            <CreatorProfileModal
                isOpen={!!selectedBrand}
                onClose={() => setSelectedBrand(null)}
                creator={selectedBrand}
                actionButton={
                    <button
                        onClick={() => {
                            setProposalRecipient({ id: selectedBrand.id, name: selectedBrand.name });
                            setProposalInitialMessage(`Hi ${selectedBrand.name}, I'm interested in being a creator or volunteer for your ${selectedBrand.role === 'Brand' ? 'brand' : 'Association'}. Here's why I'd be a great fit...`);
                            setShowProposalModal(true);
                            setSelectedBrand(null);
                        }}
                        className="w-full sm:w-auto px-8 py-4 bg-spark-red text-white font-black rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 mt-6 sm:mt-0"
                    >
                        Apply for Role
                    </button>
                }
            />
        </>
    );
};

export default CreatorDashboard;
