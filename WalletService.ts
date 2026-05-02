import { db, runTransaction, doc, collection, addDoc, serverTimestamp, getDoc, setDoc } from './firebase';
import { getFirestore, collection as fsCollection, addDoc as fsAddDoc, getDocs as fsGetDocs, doc as fsDoc, setDoc as fsSetDoc, updateDoc as fsUpdateDoc, query as fsQuery, where as fsWhere, orderBy as fsOrderBy, deleteDoc as fsDeleteDoc, serverTimestamp as fsTimestamp, runTransaction as fsRunTransaction, getDoc as fsGetDoc } from 'firebase/firestore';

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
    influencerId: string;
    influencerName: string;
    influencerUniversity?: string;
    influencerEmail?: string;
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
     * Move funds from Brand to Escrow (When hiring an influencer)
     */
    async lockFundsForGig(brandId: string, influencerId: string, amount: number, gigTitle: string) {
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
                relatedUserId: influencerId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Release funds from Escrow to Influencer (When gig is completed)
     */
    async releaseFundsToInfluencer(brandId: string, influencerId: string, amount: number, gigTitle: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const brandRef = fsDoc(db, 'wallets', brandId);
            const influencerRef = fsDoc(db, 'wallets', influencerId);
            const systemRef = fsDoc(db, 'wallets', REVENUE_WALLET_ID);
            
            const bSnap = await transaction.get(brandRef);
            const iSnap = await transaction.get(influencerRef);
            const sSnap = await transaction.get(systemRef);

            const bData = bSnap.data() as Wallet;
            const iData = iSnap.exists() ? iSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };
            const sData = sSnap.exists() ? sSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            const serviceFee = amount * SERVICE_FEE_PCT;
            const influencerPay = amount - serviceFee;

            // 1. Deduct from Brand Escrow
            transaction.update(brandRef, {
                escrow: (bData.escrow || 0) - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to Influencer (90%)
            transaction.set(influencerRef, {
                ...iData,
                balance: (iData.balance || 0) + influencerPay,
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
                userId: influencerId,
                amount: influencerPay,
                type: 'credit',
                status: 'completed',
                description: `Earnings from gig: ${gigTitle} (After 10% platform fee)`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });

            const sTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(sTransRef, {
                userId: REVENUE_WALLET_ID,
                amount: serviceFee,
                type: 'credit',
                status: 'completed',
                description: `Service fee from ${gigTitle} (Influencer: ${influencerId})`,
                relatedUserId: influencerId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Refund an allocation back from escrow to available balance (When influencer is rejected)
     */
    async refundAllocation(brandId: string, amount: number, description: string, influencerId?: string) {
        return await fsRunTransaction(db, async (transaction) => {
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

            // Note: Influencer escrow is handled via client-side calculation from allocations
            // This avoids 'Missing or insufficient permissions' when a brand tries to read/write influencer wallets.

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
     * Create a new campaign allocation in Firestore & update influencer escrow
     */
    async createAllocation(allocation: Omit<CampaignAllocation, 'id' | 'createdAt'>): Promise<CampaignAllocation> {
        return await fsRunTransaction(db, async (transaction) => {
            const colRef = fsCollection(db, 'campaignAllocations');
            const docRef = fsDoc(colRef);
            
            // 1. NO READS NEEDED for influencer wallet (Avoids permission issues)

            // 2. ALL WRITES AFTER
            const payload = {
                ...allocation,
                createdAt: fsTimestamp(),
                updatedAt: fsTimestamp(),
            };
            
            // Create the allocation doc
            transaction.set(docRef, payload);

            // Note: Influencer's 'Locked Funds' will be calculated in the UI from this record
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
    async updateAllocationStatus(allocationId: string, status: CampaignAllocation['status']) {
        const docRef = fsDoc(db, 'campaignAllocations', allocationId);
        await fsUpdateDoc(docRef, { status, updatedAt: fsTimestamp() });
    },

    /**
     * Delete an allocation (used for rejection + refund)
     */
    async deleteAllocation(allocationId: string) {
        const docRef = fsDoc(db, 'campaignAllocations', allocationId);
        await fsDeleteDoc(docRef);
    },

    /**
     * Fetch all allocations for a given influencer
     */
    async getAllocationsByInfluencer(influencerId: string): Promise<CampaignAllocation[]> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const q = fsQuery(colRef, fsWhere('influencerId', '==', influencerId));
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
    async requestWithdrawal(userId: string, amount: number, bankDetails: string) {
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
                amount,
                type: 'debit',
                status: 'pending',
                description: `Withdrawal Request: ${bankDetails}`,
                createdAt: fsTimestamp()
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
     * Release sponsorship funds to an organization with 10% platform fee
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
    }
};
