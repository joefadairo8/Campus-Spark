import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from '../firebase';
import { WalletService } from '../WalletService';
import { notifyGeneric, notifyDisputeOpened } from '../emailNotifier';
import {
    AlertTriangle,
    CheckCircle,
    Scale,
    Clock,
    Plus,
    HelpCircle,
    Check,
    X,
    FileText,
    ArrowLeft,
    TrendingUp,
    Shield,
    Info,
    Mail
} from 'lucide-react';

interface DisputesPanelProps {
    userRole: 'Creator' | 'Brand' | 'Organization' | 'Association' | 'Admin';
    userId: string;
    userProfile: any;
    onNavigate: (page: string) => void;
    preSelectedEntity?: {
        id: string;
        title: string;
        type: 'campaign_allocation' | 'sponsorship';
        amount: number;
        counterpartyId: string;
        counterpartyName: string;
        counterpartyEmail: string;
        counterpartyRole: string;
    } | null;
    onClearPreSelected?: () => void;
}

export const DisputesPanel: React.FC<DisputesPanelProps> = ({
    userRole,
    userId,
    userProfile,
    onNavigate,
    preSelectedEntity,
    onClearPreSelected
}) => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedDispute, setSelectedDispute] = useState<any>(null);

    // Form states
    const [category, setCategory] = useState<'escrow_settlement' | 'deliverables' | 'sponsorship' | 'other'>('escrow_settlement');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [disputedAmount, setDisputedAmount] = useState('');
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [formSubmitting, setFormSubmitting] = useState(false);

    // List of entities the user can dispute
    const [eligibleEntities, setEligibleEntities] = useState<any[]>([]);
    const [entitiesLoading, setEntitiesLoading] = useState(false);

    // Admin resolution states
    const [resolutionNote, setResolutionNote] = useState('');
    const [resolutionAction, setResolutionAction] = useState<'dismiss' | 'refund_to_brand' | 'release_to_creator' | 'custom'>('custom');
    const [resolving, setResolving] = useState(false);

    // Filter states
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'under_review' | 'resolved'>('all');

    useEffect(() => {
        fetchDisputes();
        loadEligibleEntities();
    }, [userId, userRole]);

    useEffect(() => {
        if (preSelectedEntity) {
            setViewMode('create');
            setCategory(preSelectedEntity.type === 'campaign_allocation' ? 'escrow_settlement' : 'sponsorship');
            setTitle(`Dispute regarding: ${preSelectedEntity.title}`);
            setDisputedAmount(preSelectedEntity.amount.toString());
            setSelectedEntityId(preSelectedEntity.id);
        }
    }, [preSelectedEntity]);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const disputesCol = collection(db, 'disputes');
            let disputesList: any[] = [];

            if (userRole === 'Admin') {
                const snap = await getDocs(disputesCol);
                disputesList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            } else {
                // Fetch where user created it
                const q1 = query(disputesCol, where('createdBy', '==', userId));
                const snap1 = await getDocs(q1);
                const list1 = snap1.docs.map(d => ({ id: d.id, ...d.data() }));

                // Fetch where user is counterparty
                const q2 = query(disputesCol, where('counterpartyId', '==', userId));
                const snap2 = await getDocs(q2);
                const list2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));

                // Merge and filter duplicates
                const merged = [...list1];
                list2.forEach(item => {
                    if (!merged.some(m => m.id === item.id)) {
                        merged.push(item);
                    }
                });
                disputesList = merged;
            }

            // Sort by createdAt descending
            disputesList.sort((a, b) => {
                const dateA = a.createdAt?.seconds || new Date(a.createdAt).getTime() || 0;
                const dateB = b.createdAt?.seconds || new Date(b.createdAt).getTime() || 0;
                return dateB - dateA;
            });

            setDisputes(disputesList);
        } catch (err) {
            console.error('Error fetching disputes:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadEligibleEntities = async () => {
        if (userRole === 'Admin') return;
        setEntitiesLoading(true);
        try {
            const entities: any[] = [];

            if (userRole === 'Creator') {
                const allocations = await WalletService.getAllocationsByCreator(userId);
                allocations.forEach(a => {
                    if (a.status !== 'paid' && a.status !== 'rejected') {
                        entities.push({
                            id: a.id,
                            title: a.campaignTitle || 'Campaign Collaboration',
                            type: 'campaign_allocation',
                            amount: a.amount,
                            counterpartyId: a.brandId,
                            counterpartyName: a.brandName || 'Verified Brand',
                            counterpartyEmail: a.creatorEmail || '', // fallback, we'll look up if needed
                            counterpartyRole: 'Brand',
                            escrowId: a.escrowId || null,
                            escrowRef: a.escrowRef || null,
                            escrowPaymentUrl: a.escrowPaymentUrl || null
                        });
                    }
                });
            } else if (userRole === 'Brand') {
                const allocations = await WalletService.getAllocationsByBrand(userId);
                allocations.forEach(a => {
                    if (a.status !== 'paid' && a.status !== 'rejected') {
                        entities.push({
                            id: a.id,
                            title: `Gig with ${a.creatorName}: ${a.campaignTitle || 'Active gig'}`,
                            type: 'campaign_allocation',
                            amount: a.amount,
                            counterpartyId: a.creatorId,
                            counterpartyName: a.creatorName,
                            counterpartyEmail: a.creatorEmail || '',
                            counterpartyRole: 'Creator',
                            escrowId: a.escrowId || null,
                            escrowRef: a.escrowRef || null,
                            escrowPaymentUrl: a.escrowPaymentUrl || null
                        });
                    }
                });

                // Fetch accepted proposals/sponsorships
                const proposalsSnap = await getDocs(query(collection(db, 'proposals'), where('senderId', '==', userId), where('status', '==', 'accepted')));
                proposalsSnap.docs.forEach(d => {
                    const p = d.data() as any;
                    entities.push({
                        id: d.id,
                        title: `Sponsorship Proposal for ${p.recipient?.name || 'Student Org'}`,
                        type: 'sponsorship',
                        amount: Number(p.budget) || 0,
                        counterpartyId: p.recipientId,
                        counterpartyName: p.recipient?.name || 'Student Org',
                        counterpartyEmail: p.recipient?.email || '',
                        counterpartyRole: 'Organization'
                    });
                });
            } else if (userRole === 'Organization') {
                // Hired creators
                const allocations = await WalletService.getAllocationsByCreator(userId); // wait, hired creators could be handled similarly or from their own campaignAllocations
                // Also fetch sponsorships received
                const proposalsSnap = await getDocs(query(collection(db, 'proposals'), where('recipientId', '==', userId), where('status', '==', 'accepted')));
                proposalsSnap.docs.forEach(d => {
                    const p = d.data() as any;
                    entities.push({
                        id: d.id,
                        title: `Sponsorship from ${p.sender?.name || 'Verified Brand'}`,
                        type: 'sponsorship',
                        amount: Number(p.budget) || 0,
                        counterpartyId: p.senderId,
                        counterpartyName: p.sender?.name || 'Verified Brand',
                        counterpartyEmail: p.sender?.email || '',
                        counterpartyRole: 'Brand'
                    });
                });
            }

            setEligibleEntities(entities);
        } catch (err) {
            console.error('Error loading eligible entities:', err);
        } finally {
            setEntitiesLoading(false);
        }
    };

    const handleCreateDispute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            alert('Please fill out the title and description.');
            return;
        }

        setFormSubmitting(true);
        try {
            if (!userId) {
                throw new Error('User ID is missing. Please log in again.');
            }

            let entity: any = null;
            if (selectedEntityId && selectedEntityId !== 'custom') {
                entity = eligibleEntities.find(e => e.id === selectedEntityId) || preSelectedEntity;
            }

            const disputeData: any = {
                category: category || 'escrow_settlement',
                title: title.trim(),
                description: description.trim(),
                status: 'open',
                amount: Number(disputedAmount) || 0,
                createdBy: userId,
                createdByName: userProfile?.name || 'ABC-Rally Member',
                createdByEmail: userProfile?.email || '',
                createdByRole: userRole || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (entity) {
                disputeData.entityId = entity.id || '';
                disputeData.entityType = entity.type || '';
                disputeData.entityTitle = entity.title || '';
                disputeData.counterpartyId = entity.counterpartyId || '';
                disputeData.counterpartyName = entity.counterpartyName || '';
                disputeData.counterpartyRole = entity.counterpartyRole || '';
                disputeData.escrowId = entity.escrowId || null;
                disputeData.escrowRef = entity.escrowRef || null;
                disputeData.escrowPaymentUrl = entity.escrowPaymentUrl || null;

                // Attempt to fetch counterparty email from user document if empty
                if (!entity.counterpartyEmail && entity.counterpartyId) {
                    try {
                        const userSnap = await getDoc(doc(db, 'users', entity.counterpartyId));
                        if (userSnap.exists()) {
                            disputeData.counterpartyEmail = userSnap.data().email || '';
                        }
                    } catch (e) {
                        console.warn('Could not fetch counterparty email:', e);
                        disputeData.counterpartyEmail = '';
                    }
                } else {
                    disputeData.counterpartyEmail = entity.counterpartyEmail || '';
                }
            } else {
                // Custom dispute fallback counterparty
                disputeData.entityType = 'other';
                disputeData.counterpartyId = 'platform_support';
                disputeData.counterpartyName = 'ABC-Rally Mediation Team';
                disputeData.counterpartyEmail = 'support@campushimpacthub.com';
                disputeData.counterpartyRole = 'Admin';
            }

            // Create dispute document in Firestore
            const docRef = await addDoc(collection(db, 'disputes'), disputeData);

            // If related to a campaign allocation, flag the allocation as disputed
            if (entity && entity.type === 'campaign_allocation') {
                try {
                    await updateDoc(doc(db, 'campaignAllocations', entity.id), {
                        disputed: true,
                        disputeId: docRef.id
                    });
                } catch (allocErr) {
                    console.warn('Could not flag campaign allocation as disputed', allocErr);
                }
            }

            // Notify Parties & Admin via Email (non-blocking)
            notifyDisputeOpened(
                disputeData.createdByEmail || (userProfile?.email || ''),
                disputeData.createdByName || (userProfile?.name || 'User'),
                disputeData.counterpartyName || 'Counterparty',
                disputeData.counterpartyEmail || '',
                `${category}: ${description}`,
                docRef.id
            );

            alert('Dispute submitted successfully. Our mediation team has been notified.');

            // Cleanup and navigate
            setTitle('');
            setDescription('');
            setDisputedAmount('');
            setSelectedEntityId('');
            if (onClearPreSelected) onClearPreSelected();

            setViewMode('list');
            fetchDisputes();
        } catch (err: any) {
            console.error('Error submitting dispute:', err);
            alert('Failed to submit dispute: ' + err.message);
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleResolveDispute = async () => {
        if (!resolutionNote.trim()) {
            alert('Please provide resolution details/notes.');
            return;
        }

        setResolving(true);
        try {
            const disputeRef = doc(db, 'disputes', selectedDispute.id);
            const updatePayload: any = {
                status: 'resolved',
                resolutionNote: resolutionNote.trim(),
                resolutionAction,
                resolvedAt: new Date().toISOString(),
                resolvedBy: userId,
                updatedAt: new Date().toISOString()
            };

            // Execute programmatic actions in wallets if necessary
            if (selectedDispute.entityId && selectedDispute.entityType === 'campaign_allocation') {
                // Fetch the campaign allocation to get latest metadata
                const allocSnap = await getDoc(doc(db, 'campaignAllocations', selectedDispute.entityId));
                if (allocSnap.exists()) {
                    const allocation = allocSnap.data();

                    if (resolutionAction === 'refund_to_brand') {
                        // Refund Brand: Release back to balance, decrease brand escrow
                        await WalletService.refundAllocation(
                            allocation.brandId,
                            selectedDispute.amount,
                            `Dispute Refund: ${selectedDispute.title}`,
                            allocation.creatorId
                        );
                        // Mark allocation as rejected (so it clears Creator's locked escrow)
                        await WalletService.updateAllocationStatus(selectedDispute.entityId, 'rejected');
                    } else if (resolutionAction === 'release_to_creator') {
                        // Release payment to Creator: Pay 90% to creator, 10% platform commission
                        await WalletService.releaseAllocationPayment(
                            allocation.brandId,
                            selectedDispute.entityId,
                            selectedDispute.title,
                            { escrowRelease: true }
                        );
                    }
                }
            } else if (selectedDispute.entityId && selectedDispute.entityType === 'sponsorship') {
                const propSnap = await getDoc(doc(db, 'proposals', selectedDispute.entityId));
                if (propSnap.exists()) {
                    const proposal = propSnap.data();
                    if (resolutionAction === 'refund_to_brand') {
                        await WalletService.refundAllocation(
                            proposal.senderId,
                            selectedDispute.amount,
                            `Dispute Refund: Sponsorship resolved`
                        );
                        await updateDoc(doc(db, 'proposals', selectedDispute.entityId), { status: 'rejected' });
                    } else if (resolutionAction === 'release_to_creator') {
                        await WalletService.releaseSponsorshipFunds(
                            proposal.senderId,
                            proposal.recipientId,
                            selectedDispute.amount,
                            selectedDispute.title
                        );
                    }
                }
            }

            // Update Dispute Status
            await updateDoc(disputeRef, updatePayload);

            // Notify both parties of resolution
            const emailsToNotify = [
                { email: selectedDispute.createdByEmail, name: selectedDispute.createdByName },
                { email: selectedDispute.counterpartyEmail, name: selectedDispute.counterpartyName }
            ];

            emailsToNotify.forEach(party => {
                if (party.email && party.email !== 'support@campushimpacthub.com') {
                    notifyGeneric(
                        party.email,
                        `Dispute Resolved: ${selectedDispute.title}`,
                        `Dispute Resolution Notice`,
                        `Hi ${party.name},\n\nThe dispute ticket regarding "${selectedDispute.title}" has been resolved by our administrator team.\n\nResolution Action: ${resolutionAction.toUpperCase()}\nResolution Notes: ${resolutionNote}\n\nThank you for choosing our platform.`
                    );
                }
            });

            alert('Dispute resolved and wallets synced successfully!');
            setResolutionNote('');
            setViewMode('list');
            fetchDisputes();
        } catch (err: any) {
            console.error('Error resolving dispute:', err);
            alert('Failed to resolve dispute: ' + err.message);
        } finally {
            setResolving(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'open':
                return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20';
            case 'under_review':
                return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20';
            case 'resolved':
                return 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20';
            default:
                return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20';
        }
    };

    const filteredDisputes = disputes.filter(d => {
        if (filterStatus === 'all') return true;
        return d.status === filterStatus;
    });

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-6">
                <div>
                    <h2 className="text-3xl font-black text-[var(--text-primary)]">
                        {userRole === 'Admin' ? 'Dispute Monitor' : 'Disputes & Mediation'}
                    </h2>
                    <p className="text-[var(--text-secondary)] font-medium mt-1">
                        {userRole === 'Admin'
                            ? 'Moderate escrow settlement conflicts, sponsorships, and user performance disputes.'
                            : 'Raise disputes for escrow settlement issues, deliverables, or track active resolutions.'}
                    </p>
                </div>
                {userRole !== 'Admin' && viewMode === 'list' && (
                    <button
                        onClick={() => setViewMode('create')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-spark-red text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-spark-red/20 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> File a Dispute
                    </button>
                )}
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex gap-2 border-b border-[var(--border-color)] pb-3 overflow-x-auto">
                        {(['all', 'open', 'under_review', 'resolved'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${filterStatus === status
                                        ? 'bg-spark-black text-white dark:bg-white dark:text-spark-black'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-spark-red border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredDisputes.length === 0 ? (
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-[var(--bg-secondary)] text-spark-red rounded-full flex items-center justify-center mx-auto text-2xl border border-[var(--border-color)]">
                                ⚖️
                            </div>
                            <h3 className="text-lg font-black text-[var(--text-primary)]">No Disputes Found</h3>
                            <p className="text-sm text-[var(--text-secondary)] font-medium max-w-md mx-auto">
                                Everything is looking clear! There are currently no disputes matching your selection.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredDisputes.map(dispute => (
                                <div
                                    key={dispute.id}
                                    onClick={() => {
                                        setSelectedDispute(dispute);
                                        setResolutionAction(dispute.entityType === 'campaign_allocation' || dispute.entityType === 'sponsorship' ? 'refund_to_brand' : 'custom');
                                        setViewMode('detail');
                                    }}
                                    className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 hover:border-spark-red/50 transition-all cursor-pointer hover:shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                >
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(dispute.status)}`}>
                                                {dispute.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                                {dispute.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-[var(--text-primary)]">{dispute.title}</h4>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                                            {dispute.entityTitle ? `Target: ${dispute.entityTitle} | ` : ''}
                                            Disputed by: {dispute.createdByName} vs {dispute.counterpartyName}
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right space-y-1">
                                        <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Disputed Amount</p>
                                        <p className="text-xl font-black text-spark-red">₦{(dispute.amount || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-[var(--text-secondary)] font-medium">
                                            {new Date(dispute.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* File Dispute Form */}
            {viewMode === 'create' && (
                <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => {
                                setViewMode('list');
                                if (onClearPreSelected) onClearPreSelected();
                            }}
                            className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
                        </button>
                        <h3 className="text-2xl font-black text-[var(--text-primary)]">File a Dispute</h3>
                    </div>

                    {preSelectedEntity && (
                        <div className="bg-spark-red/5 border border-spark-red/20 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="w-5 h-5 text-spark-red flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-spark-red uppercase tracking-wider">Pre-selected for Dispute</p>
                                <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{preSelectedEntity.title}</p>
                                <p className="text-xs text-[var(--text-secondary)] font-medium">
                                    Counterparty: {preSelectedEntity.counterpartyName} | Amount: ₦{preSelectedEntity.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleCreateDispute} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Dispute Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-2xl focus:outline-none focus:border-spark-red transition-all cursor-pointer"
                                >
                                    <option value="escrow_settlement">Escrow Settlement</option>
                                    <option value="deliverables">Deliverables & Deliveries</option>
                                    <option value="sponsorship">Event Sponsorship</option>
                                    <option value="other">Other / Custom</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Select Disputed Campaign / Collaboration</label>
                                {entitiesLoading ? (
                                    <div className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] px-4 py-3 rounded-2xl text-xs text-[var(--text-secondary)]">
                                        Loading collaborations...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedEntityId}
                                        onChange={(e) => {
                                            setSelectedEntityId(e.target.value);
                                            const selected = eligibleEntities.find(ent => ent.id === e.target.value);
                                            if (selected) {
                                                setDisputedAmount(selected.amount.toString());
                                                setTitle(`Dispute: ${selected.title}`);
                                            }
                                        }}
                                        disabled={!!preSelectedEntity}
                                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-2xl focus:outline-none focus:border-spark-red transition-all cursor-pointer disabled:opacity-60"
                                    >
                                        <option value="">-- Choose Campaign/Collaboration (Optional) --</option>
                                        {eligibleEntities.map(ent => (
                                            <option key={ent.id} value={ent.id}>
                                                [{ent.type === 'campaign_allocation' ? 'GIG' : 'SPONSORSHIP'}] {ent.title} (₦{ent.amount.toLocaleString()})
                                            </option>
                                        ))}
                                        <option value="custom">Other (Custom / General Platform Issue)</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Dispute Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Escrow payout not reflecting after approved review"
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-2xl focus:outline-none focus:border-spark-red transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Disputed Amount (₦)</label>
                                <input
                                    type="number"
                                    value={disputedAmount}
                                    onChange={(e) => setDisputedAmount(e.target.value)}
                                    placeholder="e.g. 25000"
                                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-2xl focus:outline-none focus:border-spark-red transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Provide Dispute Details & Proof Summary</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                placeholder="Describe the dispute background, milestones completed, deliverables approved, and what specific settlement action you request."
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-3 rounded-2xl focus:outline-none focus:border-spark-red transition-all resize-none"
                                required
                            />
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-[var(--border-color)]">
                            <button
                                type="submit"
                                disabled={formSubmitting}
                                className="px-6 py-3 bg-spark-red text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-55"
                            >
                                {formSubmitting ? 'Submitting dispute...' : 'File Dispute'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode('list');
                                    if (onClearPreSelected) onClearPreSelected();
                                }}
                                className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-black uppercase tracking-wider rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Dispute Detail View */}
            {viewMode === 'detail' && selectedDispute && (
                <div className="space-y-6">
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] rounded-xl text-xs font-black uppercase tracking-wider text-[var(--text-primary)] cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Disputes
                    </button>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Detail Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-8 space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadgeColor(selectedDispute.status)}`}>
                                                {selectedDispute.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">
                                                {selectedDispute.category.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-[var(--text-primary)]">{selectedDispute.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">Disputed Amount</p>
                                        <p className="text-2xl font-black text-spark-red mt-1">₦{(selectedDispute.amount || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">Description / Evidence Summary</h4>
                                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-color)] whitespace-pre-line">
                                        {selectedDispute.description}
                                    </p>
                                </div>

                                {selectedDispute.status === 'resolved' && (
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 space-y-3">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                            <CheckCircle className="w-5 h-5" />
                                            <h4 className="text-sm font-black uppercase tracking-wider">Dispute Resolution Details</h4>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] font-bold">
                                            Resolved Action: <span className="text-[var(--text-primary)]">{selectedDispute.resolutionAction?.toUpperCase()}</span>
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] font-medium">
                                            {selectedDispute.resolutionNote}
                                        </p>
                                        <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider">
                                            Resolved At: {new Date(selectedDispute.resolvedAt).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Info & Admin Actions */}
                        <div className="space-y-6">
                            {/* Parties Card */}
                            <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4">
                                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2">
                                    Dispute Parties
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider leading-none">Disputer</p>
                                        <p className="text-sm font-black text-[var(--text-primary)]">{selectedDispute.createdByName}</p>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">{selectedDispute.createdByRole}</p>
                                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium"><Mail className="w-3.5 h-3.5" />{selectedDispute.createdByEmail}</p>
                                    </div>
                                    <div className="border-t border-[var(--border-color)] pt-3 space-y-1">
                                        <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider leading-none">Counterparty</p>
                                        <p className="text-sm font-black text-[var(--text-primary)]">{selectedDispute.counterpartyName}</p>
                                        <p className="text-xs text-[var(--text-secondary)] font-medium">{selectedDispute.counterpartyRole}</p>
                                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium"><Mail className="w-3.5 h-3.5" />{selectedDispute.counterpartyEmail}</p>
                                    </div>
                                    {selectedDispute.entityTitle && (
                                        <div className="border-t border-[var(--border-color)] pt-3 space-y-1">
                                            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-wider leading-none">Disputed Collaboration</p>
                                            <p className="text-xs font-bold text-[var(--text-primary)]">{selectedDispute.entityTitle}</p>
                                            <p className="text-[9px] text-[var(--text-secondary)] font-medium">{selectedDispute.entityType?.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Admin Resolution Panel */}
                            {userRole === 'Admin' && selectedDispute.status !== 'resolved' && (
                                <div className="bg-[var(--bg-primary)] border border-spark-red/30 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 text-spark-red">
                                        <Scale className="w-5 h-5" />
                                        <h4 className="text-sm font-black uppercase tracking-wider">Resolve Dispute</h4>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Resolution Action</label>
                                            <select
                                                value={resolutionAction}
                                                onChange={(e) => setResolutionAction(e.target.value as any)}
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-spark-red transition-all cursor-pointer font-bold"
                                            >
                                                {selectedDispute.entityType === 'campaign_allocation' && (
                                                    <>
                                                        <option value="refund_to_brand">Refund Escrow to Brand Wallet</option>
                                                        <option value="release_to_creator">Release Escrow to Creator</option>
                                                    </>
                                                )}
                                                {selectedDispute.entityType === 'sponsorship' && (
                                                    <>
                                                        <option value="refund_to_brand">Refund Sponsorship to Brand</option>
                                                        <option value="release_to_creator">Release Sponsorship to Student Org</option>
                                                    </>
                                                )}
                                                <option value="dismiss">Dismiss Dispute (No Wallet Payout/Refund)</option>
                                                <option value="custom">Custom Text Resolution</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Resolution Details / Notes</label>
                                            <textarea
                                                value={resolutionNote}
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                                rows={4}
                                                placeholder="Provide resolution details to be sent to both parties."
                                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-spark-red transition-all resize-none"
                                                required
                                            />
                                        </div>

                                        <button
                                            onClick={handleResolveDispute}
                                            disabled={resolving}
                                            className="w-full py-3 bg-spark-red text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                        >
                                            {resolving ? 'Resolving dispute...' : 'Apply Resolution & Settle'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
