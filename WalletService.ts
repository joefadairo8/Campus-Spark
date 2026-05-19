import { db, runTransaction, doc, collection, addDoc, serverTimestamp, getDoc, setDoc } from './firebase';
import { getFirestore, collection as fsCollection, addDoc as fsAddDoc, getDocs as fsGetDocs, doc as fsDoc, setDoc as fsSetDoc, updateDoc as fsUpdateDoc, query as fsQuery, where as fsWhere, orderBy as fsOrderBy, deleteDoc as fsDeleteDoc, serverTimestamp as fsTimestamp, runTransaction as fsRunTransaction, getDoc as fsGetDoc } from 'firebase/firestore';
import { notifyReportApproved } from './emailNotifier';

export interface Transaction {
    id?: string;
    userId: string;
    amount: number;
    type: 'credit' | 'debit';
    status: 'completed' | 'pending' | 'failed' | 'escrow';
    description: string;
    reference?: string;
    relatedUserId?: string;
    createdAt: any;
}

export interface Wallet {
    balance: number;
    pending: number;
    escrow: number;
    lastUpdated: any;
}

export interface CampaignAllocation {
    id?: string;
    campaignId: string;
    brandId: string;
    creatorId: string;
    creatorName: string;
    creatorUniversity?: string;
    creatorEmail?: string;
    amount: number;
    status: 'selected' | 'in_progress' | 'submitted' | 'approved' | 'paid' | 'rejected';
    createdAt: any;
    updatedAt?: any;
}

export const REVENUE_WALLET_ID = 'PLATFORM_REVENUE_HUB';
export const LISTING_FEE = 20000;
export const SERVICE_FEE_PCT = 0.1;

export const WalletService = {
    /**
     * Get or create a wallet for a user
     */
    async getOrCreateWallet(userId: string): Promise<Wallet> {
        const walletRef = fsDoc(db, 'wallets', userId);
        const snap = await fsGetDoc(walletRef);
        
        if (snap.exists()) {
            return snap.data() as Wallet;
        } else {
            const newWallet: Wallet = {
                balance: 0,
                pending: 0,
                escrow: 0,
                lastUpdated: fsTimestamp()
            };
            await fsSetDoc(walletRef, newWallet);
            return newWallet;
        }
    },

    /**
     * Top up a brand's wallet (Simulated payment success for now)
     * In production, this would be called after a successful Paystack callback
     */
    async topUpWallet(userId: string, amount: number, reference: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', userId);
            const walletSnap = await transaction.get(walletRef);
            
            const currentWallet = walletSnap.exists() 
                ? walletSnap.data() as Wallet 
                : { balance: 0, pending: 0, escrow: 0 };

            // 1. Update Wallet
            transaction.set(walletRef, {
                ...currentWallet,
                balance: currentWallet.balance + amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Record Transaction
            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId,
                amount,
                type: 'credit',
                status: 'completed',
                description: 'Wallet Top-up',
                reference,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Move funds from Brand to Escrow (When hiring a creator)
     */
    async lockFundsForGig(brandId: string, creatorId: string, amount: number, gigTitle: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const brandWalletRef = fsDoc(db, 'wallets', brandId);
            const brandSnap = await transaction.get(brandWalletRef);

            if (!brandSnap.exists() || brandSnap.data().balance < amount) {
                throw new Error('Insufficient balance in brand wallet.');
            }

            const brandData = brandSnap.data() as Wallet;

            // 1. Update Brand Wallet (Move balance to escrow)
            transaction.update(brandWalletRef, {
                balance: brandData.balance - amount,
                escrow: (brandData.escrow || 0) + amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Record Transaction for Brand
            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId: brandId,
                amount,
                type: 'debit',
                status: 'escrow',
                description: `Payment locked for gig: ${gigTitle}`,
                relatedUserId: creatorId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Consistently release payment for a specific allocation after report approval.
     * Enforces that a report must exist and be in a valid state.
     */
    async releaseAllocationPayment(brandId: string, allocationId: string, gigTitle: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const allocRef = fsDoc(db, 'campaignAllocations', allocationId);
            const allocSnap = await transaction.get(allocRef);
            
            if (!allocSnap.exists()) throw new Error('Allocation record not found.');
            const allocData = allocSnap.data() as CampaignAllocation;
            
            if (allocData.status !== 'approved' && allocData.status !== 'submitted') {
                throw new Error('Payment can only be released for approved or submitted reports.');
            }
            
            if (!allocData.submission || (!allocData.submission.text && !allocData.submission.link)) {
                throw new Error('No valid campaign report found. A report must be submitted before payment release.');
            }

            const creatorId = allocData.creatorId;
            const amount = allocData.amount;

            // Define wallet refs
            const brandRef = fsDoc(db, 'wallets', brandId);
            const creatorRef = fsDoc(db, 'wallets', creatorId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const bSnap = await transaction.get(brandRef);
            const iSnap = await transaction.get(creatorRef);
            const sSnap = await transaction.get(systemRef);

            const bData = bSnap.data() as Wallet;
            const iData = iSnap.exists() ? iSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            const serviceFee = amount * SERVICE_FEE_PCT;
            const creatorPay = amount - serviceFee;

            // 1. Deduct from Brand Escrow
            transaction.update(brandRef, {
                escrow: (bData.escrow || 0) - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to Creator (90%)
            transaction.set(creatorRef, {
                ...iData,
                balance: (iData.balance || 0) + creatorPay,
                // If the creator has a conceptual escrow, subtract from it (best effort)
                escrow: Math.max(0, (iData.escrow || 0) - amount),
                lastUpdated: fsTimestamp()
            });

            // 3. Add to System Revenue (10%)
            transaction.set(systemRef, {
                ...sData,
                balance: (sData.balance || 0) + serviceFee,
                lastUpdated: fsTimestamp()
            });

            // 4. Record Transactions
            const iTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(iTransRef, {
                userId: creatorId,
                amount: creatorPay,
                type: 'credit',
                status: 'completed',
                description: `Earnings: ${gigTitle} (Report Approved)`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: serviceFee,
                type: 'credit',
                status: 'completed',
                description: `Service fee: ${gigTitle} (Creator: ${creatorId})`,
                relatedUserId: creatorId,
                createdAt: fsTimestamp()
            });

            const bTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(bTransRef, {
                userId: brandId,
                amount: amount,
                type: 'debit',
                status: 'completed',
                description: `Payment Released: ${gigTitle} (Creator Paid)`,
                relatedUserId: creatorId,
                createdAt: fsTimestamp()
            });

            // 5. Update Allocation Status
            transaction.update(allocRef, { status: 'paid', updatedAt: fsTimestamp() });
            
            // Notify Creator of Report Approval
            try {
                if (allocData.creatorEmail) {
                    notifyReportApproved(
                        allocData.creatorEmail,
                        allocData.creatorName || 'Creator',
                        gigTitle,
                        allocData.brandName || 'Verified Brand'
                    );
                }
            } catch (e) {
                console.warn('Failed to notify creator of report approval', e);
            }

            return { success: true };
        });
    },
    
    /**
     * Release payment for an Org-led gig (Where money is ALREADY in creator's escrow)
     */
    async releaseOrgGigPayment(orgId: string, allocId: string, gigTitle: string) {
        return await runTransaction(db, async (transaction) => {
            const allocRef = fsDoc(db, 'campaignAllocations', allocId);
            const allocSnap = await transaction.get(allocRef);
            if (!allocSnap.exists()) throw new Error('Allocation not found');
            const allocData = allocSnap.data();
            const creatorId = allocData.studentId;
            const amount = allocData.amount;

            const creatorRef = fsDoc(db, 'wallets', creatorId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const iSnap = await transaction.get(creatorRef);
            const sSnap = await transaction.get(systemRef);

            const iData = iSnap.exists() ? iSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            const serviceFee = amount * SERVICE_FEE_PCT;
            const creatorPay = amount - serviceFee;

            // 1. Deduct from Creator Escrow
            transaction.update(creatorRef, {
                escrow: (iData.escrow || 0) - amount,
                balance: (iData.balance || 0) + creatorPay,
                lastUpdated: fsTimestamp()
            });

            // 2. Add Fee to Platform
            transaction.set(systemRef, {
                ...sData,
                balance: (sData.balance || 0) + serviceFee,
                lastUpdated: fsTimestamp()
            }, { merge: true });

            // 3. Record Transactions
            const cTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(cTransRef, {
                userId: creatorId,
                amount: creatorPay,
                type: 'credit',
                status: 'completed',
                description: `Earnings: ${gigTitle} (Report Accepted)`,
                relatedUserId: orgId,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: serviceFee,
                type: 'credit',
                status: 'completed',
                description: `Service fee: ${gigTitle} (Creator: ${creatorId})`,
                relatedUserId: creatorId,
                createdAt: fsTimestamp()
            });

            // 4. Update Allocation Status
            transaction.update(allocRef, { status: 'paid', updatedAt: fsTimestamp() });
            
            return { success: true };
        });
    },

    /**
     * Refund an allocation back from escrow to available balance (When creator is rejected)
     */
    async refundAllocation(brandId: string, amount: number, description: string, creatorId?: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', brandId);
            // 1. ALL READS FIRST
            const walletSnap = await transaction.get(walletRef);
            
            const currentWallet = walletSnap.exists() 
                ? walletSnap.data() as Wallet 
                : { balance: 0, pending: 0, escrow: 0 };

            // 2. ALL WRITES AFTER
            // Refund Brand Wallet
            transaction.set(walletRef, {
                ...currentWallet,
                balance: currentWallet.balance + amount,
                escrow: Math.max(0, (currentWallet.escrow || 0) - amount),
                lastUpdated: fsTimestamp()
            });

            // Note: Creator escrow is handled via client-side calculation from allocations
            // This avoids 'Missing or insufficient permissions' when a brand tries to read/write creator wallets.

            // Record Transaction for Brand
            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId: brandId,
                amount,
                type: 'credit',
                status: 'completed',
                description: description || 'Allocation refunded',
                createdAt: fsTimestamp()
            });
        });
    },

    // ─── Campaign Allocation Firestore CRUD ──────────────────────────────────

    /**
     * Create a new campaign allocation in Firestore & update creator escrow
     */
    async createAllocation(allocation: Omit<CampaignAllocation, 'id' | 'createdAt'>): Promise<CampaignAllocation> {
        return await fsRunTransaction(db, async (transaction) => {
            const colRef = fsCollection(db, 'campaignAllocations');
            const docRef = fsDoc(colRef);
            
            // 1. NO READS NEEDED for creator wallet (Avoids permission issues)

            // 2. ALL WRITES AFTER
            const payload = {
                ...allocation,
                createdAt: fsTimestamp(),
                updatedAt: fsTimestamp(),
            };
            
            // Create the allocation doc
            transaction.set(docRef, payload);

            // Note: Creator's 'Locked Funds' will be calculated in the UI from this record
            return { id: docRef.id, ...payload } as CampaignAllocation;
        });
    },

    /**
     * Fetch all allocations for a given campaign
     */
    async getAllocationsForCampaign(campaignId: string): Promise<CampaignAllocation[]> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const q = fsQuery(colRef, fsWhere('campaignId', '==', campaignId));
        const snap = await fsGetDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CampaignAllocation[];
        return results.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
    },

    /**
     * Fetch all allocations for a given brand (across all campaigns)
     */
    async getAllocationsByBrand(brandId: string): Promise<CampaignAllocation[]> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const q = fsQuery(colRef, fsWhere('brandId', '==', brandId));
        const snap = await fsGetDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CampaignAllocation[];
    },

    /**
     * Update the status of an allocation
     */
    async updateAllocationStatus(allocationId: string, status: CampaignAllocation['status'], extraData?: any) {
        const docRef = fsDoc(db, 'campaignAllocations', allocationId);
        await fsUpdateDoc(docRef, { 
            status, 
            updatedAt: fsTimestamp(),
            ...(extraData || {})
        });
    },

    /**
     * Delete an allocation (used for rejection + refund)
     */
    async deleteAllocation(allocationId: string) {
        const docRef = fsDoc(db, 'campaignAllocations', allocationId);
        await fsDeleteDoc(docRef);
    },

    /**
     * Fetch all allocations for a given creator
     */
    async getAllocationsByCreator(creatorId: string): Promise<CampaignAllocation[]> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const q = fsQuery(colRef, fsWhere('creatorId', '==', creatorId));
        const snap = await fsGetDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CampaignAllocation[];
    },

    /**
     * Update allocation with submission data
     */
    async updateAllocationSubmission(allocationId: string, submission: { link?: string, text?: string, imageUrl?: string }) {
        const docRef = fsDoc(db, 'campaignAllocations', allocationId);
        await fsUpdateDoc(docRef, { 
            status: 'submitted', 
            submission, 
            updatedAt: fsTimestamp() 
        });
    },

    /**
     * Request a withdrawal from available balance
     */
    async requestWithdrawal(userId: string, amount: number, bankDetails: string, userMetadata?: { name: string, email: string }) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', userId);
            const walletSnap = await transaction.get(walletRef);

            if (!walletSnap.exists() || walletSnap.data().balance < amount) {
                throw new Error('Insufficient available balance.');
            }

            const currentWallet = walletSnap.data() as Wallet;

            // 1. Update Wallet (Move from balance to pending/escrow conceptually or just deduct and wait for admin)
            // For now, let's deduct from balance immediately to prevent double spending
            transaction.update(walletRef, {
                balance: currentWallet.balance - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Record Transaction
            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId,
                userName: userMetadata?.name || 'Unknown',
                userEmail: userMetadata?.email || '',
                amount,
                type: 'debit',
                status: 'pending',
                bankName: (bankDetails as any).bank || '',
                accountNumber: (bankDetails as any).account || '',
                accountName: (bankDetails as any).name || '',
                description: `Withdrawal Request: ${(bankDetails as any).bank} - ${(bankDetails as any).account}`,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Mark a withdrawal as completed (disbursed)
     */
    async completeWithdrawal(transactionId: string) {
        const transRef = fsDoc(db, 'transactions', transactionId);
        await fsUpdateDoc(transRef, { 
            status: 'completed', 
            updatedAt: fsTimestamp() 
        });
    },

    /**
     * Reject a withdrawal and refund the amount to the user's balance
     */
    async rejectWithdrawal(transactionId: string, reason: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const transRef = fsDoc(db, 'transactions', transactionId);
            const transSnap = await transaction.get(transRef);
            
            if (!transSnap.exists()) throw new Error('Transaction not found.');
            const transData = transSnap.data() as any;
            
            if (transData.status !== 'pending') throw new Error('Only pending withdrawals can be rejected.');
            
            const userId = transData.userId;
            const amount = transData.amount;
            
            const walletRef = fsDoc(db, 'wallets', userId);
            const walletSnap = await transaction.get(walletRef);
            
            if (walletSnap.exists()) {
                const currentWallet = walletSnap.data() as Wallet;
                transaction.update(walletRef, {
                    balance: currentWallet.balance + amount,
                    lastUpdated: fsTimestamp()
                });
            }
            
            transaction.update(transRef, {
                status: 'failed',
                description: `${transData.description} (Rejected: ${reason})`,
                updatedAt: fsTimestamp()
            });
        });
    },

    /**
     * Lock campaign budget in escrow when a campaign is created
     */
    async lockCampaignBudget(brandId: string, campaignId: string, amount: number, campaignTitle: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', brandId);
            const walletSnap = await transaction.get(walletRef);

            const currentWallet = walletSnap.exists()
                ? walletSnap.data() as Wallet
                : { balance: 0, pending: 0, escrow: 0 };

            if (currentWallet.balance < amount) {
                throw new Error(`Insufficient wallet balance. You need ₦${amount.toLocaleString()} but only have ₦${currentWallet.balance.toLocaleString()}.`);
            }

            transaction.set(walletRef, {
                ...currentWallet,
                balance: currentWallet.balance - amount,
                escrow: (currentWallet.escrow || 0) + amount,
                lastUpdated: fsTimestamp()
            });

            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId: brandId,
                amount,
                type: 'debit',
                status: 'escrow',
                description: `Campaign budget locked: ${campaignTitle}`,
                relatedUserId: campaignId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Charge flat listing fee for a new campaign
     */
    async chargeListingFee(brandId: string, campaignTitle: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const brandRef = fsDoc(db, 'wallets', brandId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const bSnap = await transaction.get(brandRef);
            const sSnap = await transaction.get(systemRef);

            const bData = bSnap.data() as Wallet;
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            if (!bSnap.exists() || bData.balance < LISTING_FEE) {
                throw new Error(`Insufficient balance for listing fee (₦${LISTING_FEE.toLocaleString()}).`);
            }

            // 1. Deduct from Brand
            transaction.update(brandRef, {
                balance: bData.balance - LISTING_FEE,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to System
            transaction.set(systemRef, {
                ...sData,
                balance: (sData.balance || 0) + LISTING_FEE,
                lastUpdated: fsTimestamp()
            });

            // 3. Record Transactions
            const bTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(bTransRef, {
                userId: brandId,
                amount: LISTING_FEE,
                type: 'debit',
                status: 'completed',
                description: `Campaign Listing Fee: ${campaignTitle}`,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: LISTING_FEE,
                type: 'credit',
                status: 'completed',
                description: `Listing Fee from ${campaignTitle} (Brand: ${brandId})`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Release sponsorship funds to an Association with 10% platform fee
     */
    async releaseSponsorshipFunds(brandId: string, orgId: string, amount: number, eventName: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const brandRef = fsDoc(db, 'wallets', brandId);
            const orgRef = fsDoc(db, 'wallets', orgId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const bSnap = await transaction.get(brandRef);
            const oSnap = await transaction.get(orgRef);
            const sSnap = await transaction.get(systemRef);

            const bData = bSnap.data() as Wallet;
            const oData = oSnap.exists() ? oSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            const serviceFee = amount * SERVICE_FEE_PCT;
            const orgPay = amount - serviceFee;

            // 1. Deduct from Brand Escrow
            transaction.update(brandRef, {
                escrow: (bData.escrow || 0) - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to Org (90%)
            transaction.set(orgRef, {
                ...oData,
                balance: (oData.balance || 0) + orgPay,
                lastUpdated: fsTimestamp()
            });

            // 3. Add to System (10%)
            transaction.set(systemRef, {
                ...sData,
                balance: (sData.balance || 0) + serviceFee,
                lastUpdated: fsTimestamp()
            });

            // 4. Record Transactions
            const oTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(oTransRef, {
                userId: orgId,
                amount: orgPay,
                type: 'credit',
                status: 'completed',
                description: `Sponsorship Funds: ${eventName} (After 10% platform fee)`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: serviceFee,
                type: 'credit',
                status: 'completed',
                description: `Sponsorship Commission: ${eventName} (Org: ${orgId})`,
                relatedUserId: orgId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Direct sponsorship payment from Brand Balance to Association Balance
     */
    async paySponsorship(brandId: string, orgId: string, amount: number, eventName: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const brandRef = fsDoc(db, 'wallets', brandId);
            const orgRef = fsDoc(db, 'wallets', orgId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const bSnap = await transaction.get(brandRef);
            const oSnap = await transaction.get(orgRef);
            const sSnap = await transaction.get(systemRef);

            if (!bSnap.exists()) throw new Error("Brand wallet not found.");
            const bData = bSnap.data() as Wallet;
            if (bData.balance < amount) throw new Error(`Insufficient balance. You have ₦${bData.balance.toLocaleString()}.`);

            const oData = oSnap.exists() ? oSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            const serviceFee = amount * SERVICE_FEE_PCT;
            const orgPay = amount - serviceFee;

            // 1. Deduct from Brand Balance
            transaction.update(brandRef, {
                balance: bData.balance - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to Org Balance (90%)
            transaction.set(orgRef, {
                ...oData,
                balance: (oData.balance || 0) + orgPay,
                lastUpdated: fsTimestamp()
            }, { merge: true });

            // 3. Add to System Balance (10%)
            transaction.set(systemRef, {
                ...sData,
                balance: (sData.balance || 0) + serviceFee,
                lastUpdated: fsTimestamp()
            }, { merge: true });

            // 4. Record Transactions
            const bTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(bTransRef, {
                userId: brandId,
                amount: amount,
                type: 'debit',
                status: 'completed',
                description: `Event Sponsorship: ${eventName}`,
                relatedUserId: orgId,
                createdAt: fsTimestamp()
            });

            const oTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(oTransRef, {
                userId: orgId,
                amount: orgPay,
                type: 'credit',
                status: 'completed',
                description: `Sponsorship Received: ${eventName} (After 10% platform fee)`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: serviceFee,
                type: 'credit',
                status: 'completed',
                description: `Sponsorship Commission: ${eventName} (Org: ${orgId})`,
                relatedUserId: orgId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Move funds from available balance to escrow
     */
    async lockEscrow(userId: string, amount: number, description: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', userId);
            const walletSnap = await transaction.get(walletRef);

            const currentWallet = walletSnap.exists()
                ? walletSnap.data() as Wallet
                : { balance: 0, pending: 0, escrow: 0 };

            if (currentWallet.balance < amount) {
                throw new Error(`Insufficient wallet balance.`);
            }

            transaction.set(walletRef, {
                ...currentWallet,
                balance: currentWallet.balance - amount,
                escrow: (currentWallet.escrow || 0) + amount,
                lastUpdated: fsTimestamp()
            });

            const transRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(transRef, {
                userId,
                amount,
                type: 'debit',
                status: 'escrow',
                description: description || 'Funds moved to escrow',
                createdAt: fsTimestamp()
            });
        });
    }
};
