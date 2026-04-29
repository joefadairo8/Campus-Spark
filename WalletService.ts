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
            
            const bSnap = await transaction.get(brandRef);
            const iSnap = await transaction.get(influencerRef);

            const bData = bSnap.data() as Wallet;
            const iData = iSnap.exists() ? iSnap.data() as Wallet : { balance: 0, pending: 0, escrow: 0 };

            // 1. Deduct from Brand Escrow
            transaction.update(brandRef, {
                escrow: bData.escrow - amount,
                lastUpdated: fsTimestamp()
            });

            // 2. Add to Influencer Balance
            transaction.set(influencerRef, {
                ...iData,
                balance: iData.balance + amount,
                lastUpdated: fsTimestamp()
            });

            // 3. Record Transactions
            const iTransRef = fsDoc(fsCollection(db, 'transactions'));
            transaction.set(iTransRef, {
                userId: influencerId,
                amount,
                type: 'credit',
                status: 'completed',
                description: `Earnings from gig: ${gigTitle}`,
                relatedUserId: brandId,
                createdAt: fsTimestamp()
            });
        });
    },

    /**
     * Refund an allocation back from escrow to available balance (When influencer is rejected)
     */
    async refundAllocation(brandId: string, amount: number, description: string) {
        return await fsRunTransaction(db, async (transaction) => {
            const walletRef = fsDoc(db, 'wallets', brandId);
            const walletSnap = await transaction.get(walletRef);
            
            const currentWallet = walletSnap.exists() 
                ? walletSnap.data() as Wallet 
                : { balance: 0, pending: 0, escrow: 0 };

            transaction.set(walletRef, {
                ...currentWallet,
                balance: currentWallet.balance + amount,
                escrow: Math.max(0, (currentWallet.escrow || 0) - amount),
                lastUpdated: fsTimestamp()
            });

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
     * Create a new campaign allocation in Firestore
     */
    async createAllocation(allocation: Omit<CampaignAllocation, 'id' | 'createdAt'>): Promise<CampaignAllocation> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const payload = {
            ...allocation,
            createdAt: fsTimestamp(),
            updatedAt: fsTimestamp(),
        };
        const docRef = await fsAddDoc(colRef, payload);
        return { id: docRef.id, ...payload };
    },

    /**
     * Fetch all allocations for a given campaign
     */
    async getAllocationsForCampaign(campaignId: string): Promise<CampaignAllocation[]> {
        const colRef = fsCollection(db, 'campaignAllocations');
        const q = fsQuery(colRef, fsWhere('campaignId', '==', campaignId), fsOrderBy('createdAt', 'desc'));
        const snap = await fsGetDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as CampaignAllocation[];
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
};
