import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignIn, 
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection as firebaseCollection, doc as firebaseDoc, getDocs as firebaseGetDocs, getDoc as firebaseGetDoc, setDoc as firebaseSetDoc, addDoc as firebaseAddDoc, updateDoc as firebaseUpdateDoc, deleteDoc as firebaseDeleteDoc, query as firebaseQuery, where as firebaseWhere, or as firebaseOr, limit as firebaseLimit, orderBy as firebaseOrderBy, serverTimestamp as firebaseTimestamp, runTransaction } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, logEvent as firebaseLogEvent } from "firebase/analytics";
import { 
  notifyProposalReceived, notifyProposalStatus, 
  notifyNewApplication, notifyApplicationDecision, 
  notifyReportSubmitted, notifyReportApproved, notifyReportRejected 
} from './emailNotifier';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbQdWbU-hcmUvS1rR7llK0eZitU27UoQg",
  authDomain: "campus-spark-3a55d.firebaseapp.com",
  projectId: "campus-spark-3a55d",
  storageBucket: "campus-spark-3a55d.firebasestorage.app",
  messagingSenderId: "1078864505346",
  appId: "1:1078864505346:web:94f6c603fd0f2d8112551b",
  measurementId: "G-3Y2Z7MZTL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);

export const logEvent = (eventName: string, params?: any) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, params);
    } catch (e) {
      console.warn('[Analytics] Failed to log event:', eventName, e);
    }
  }
};

// Use modern persistent cache instead of deprecated enableIndexedDbPersistence
// This fixes the "Unexpected state (ID: b815)" Firestore internal assertion error
export const db = getFirestore(app);
export const storage = getStorage(app);



// Local storage parity for existing components (optional but helpful)
const setUser = (user: any) => {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
};

// Listen for auth changes to sync localStorage
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Note: We'll fetch the full user profile from Firestore later if needed
      setUser(user);
    } else {
      setUser(null);
    }
  });
}

// Wrapper functions to maintain backward compatibility with existing components
export const signInWithEmailAndPassword = async (_auth: any, email: string, password: any) => {
  const result = await firebaseSignIn(auth, email, password);
  return result;
};

export const createUserWithEmailAndPassword = async (_auth: any, email: string, password: any) => {
  const result = await firebaseCreateUser(auth, email, password);
  return result;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Firestore compatibility wrappers
export const collection = (dbInstance: any, name: string) => firebaseCollection(db, name);
export const doc = (dbInstance: any, col: string, id: string) => firebaseDoc(db, col, id);
export const query = firebaseQuery;
export const where = firebaseWhere;
export const limit = firebaseLimit;
export const orderBy = firebaseOrderBy;
export const serverTimestamp = firebaseTimestamp;

export const getDocs = async (q: any) => {
  try {
    const querySnapshot = await firebaseGetDocs(q);
    const docs = querySnapshot.docs.map(d => ({
      id: d.id,
      data: () => d.data()
    }));
    return {
      empty: querySnapshot.empty,
      size: querySnapshot.size,
      docs: docs,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback)
    };
  } catch (err: any) {
    console.error('getDocs error:', err);
    if (err.code === 'unavailable') return { empty: true, size: 0, docs: [], forEach: () => {} };
    throw err;
  }
};

export const getDoc = async (docRef: any) => {
  try {
    const docSnap = await firebaseGetDoc(docRef);
    return {
      exists: () => docSnap.exists(),
      data: () => docSnap.data()
    };
  } catch (err: any) {
    console.error('getDoc error:', err);
    if (err.code === 'unavailable') return { exists: () => false, data: () => ({}) };
    throw err;
  }
};

export const setDoc = firebaseSetDoc;
export const addDoc = async (colName: any, data: any) => {
  const colRef = typeof colName === 'string' ? firebaseCollection(db, colName) : colName;
  const docRef = await firebaseAddDoc(colRef, data);
  return { id: docRef.id };
};
export const updateDoc = firebaseUpdateDoc;
export const deleteDoc = firebaseDeleteDoc;
export { runTransaction };

// API Client for components that need it
export const apiClient = {
  auth,
  db,
  runTransaction,
  collection: (name: string) => firebaseCollection(db, name),
  doc: (col: string, id: string) => firebaseDoc(db, col, id),
  getDocs: async (q: any) => {
    try {
      const snapshot = await firebaseGetDocs(q);
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        data: () => d.data()
      }));
      return {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: docs,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback)
      };
    } catch (err: any) {
      console.error('apiClient.getDocs error:', err);
      if (err.code === 'unavailable') return { empty: true, size: 0, docs: [], forEach: () => {} };
      throw err;
    }
  },
  getDoc: async (docRef: any) => {
    try {
      const docSnap = await firebaseGetDoc(docRef);
      return {
        exists: () => docSnap.exists(),
        data: () => docSnap.data()
      };
    } catch (err: any) {
      console.error('apiClient.getDoc error:', err);
      if (err.code === 'unavailable') return { exists: () => false, data: () => ({}) };
      throw err;
    }
  },
  setDoc: firebaseSetDoc,
  addDoc: async (colName: any, data: any) => {
    try {
      const colRef = typeof colName === 'string' 
        ? firebaseCollection(db, colName) 
        : colName;
      const docRef = await firebaseAddDoc(colRef, data);
      return { id: docRef.id };
    } catch (err: any) {
      console.error('apiClient.addDoc error:', err);
      throw err;
    }
  },
  updateDoc: firebaseUpdateDoc,
  deleteDoc: firebaseDeleteDoc,
  query: firebaseQuery,
  where: firebaseWhere,
  limit: firebaseLimit,
  orderBy: firebaseOrderBy,
  serverTimestamp: firebaseTimestamp,
  get: async (path: string) => {
    try {
      const [pathPart, queryString] = path.replace(/^\//, '').split('?');
    const parts = pathPart.split('/');

    // Parse query params
    const params: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach(p => {
        const [k, v] = p.split('=');
        if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
      });
    }
    // Special case for 'admin/stats'
    if (parts[0] === 'admin' && parts[1] === 'stats') {
      try {
        const [usersSnap, gigsSnap, eventsSnap, proposalsSnap, walletsSnap] = await Promise.all([
          firebaseGetDocs(firebaseCollection(db, 'users')),
          firebaseGetDocs(firebaseCollection(db, 'gigs')),
          firebaseGetDocs(firebaseCollection(db, 'events')),
          firebaseGetDocs(firebaseCollection(db, 'proposals')),
          firebaseGetDocs(firebaseCollection(db, 'wallets'))
        ]);

        const users = usersSnap.docs.map(d => d.data());
        const roles: Record<string, number> = {};
        users.forEach((u: any) => {
          const r = u.role || 'Unknown';
          roles[r] = (roles[r] || 0) + 1;
        });

        const wallets = walletsSnap.docs.map(d => d.data());
        const totalEscrow = wallets.reduce((sum: number, w: any) => sum + (Number(w.escrow) || 0), 0);
        const totalBalance = wallets.reduce((sum: number, w: any) => sum + (Number(w.balance) || 0), 0);

        const stats = {
          users: users.length,
          totalUsers: users.length,
          gigs: gigsSnap.size,
          activeGigs: gigsSnap.docs.filter(d => (d.data() as any).status === 'in_progress').length,
          events: eventsSnap.size,
          pendingProposals: proposalsSnap.docs.filter(d => (d.data() as any).status === 'pending').length,
          roles,
          totalEscrow,
          rewardPool: totalBalance + totalEscrow
        };

        const recentUsers = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 10);

        return { data: { stats, recentUsers } };
      } catch (err) {
        console.error('Admin stats error:', err);
        return { data: { stats: null, recentUsers: [] } };
      }
    }

    // Special case for 'admin/users'
    if (parts[0] === 'admin' && parts[1] === 'users' && parts.length === 2) {
      const snapshot = await firebaseGetDocs(firebaseCollection(db, 'users'));
      return { data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    }

    // Special case for 'partnerships' (aliases to proposals)
    if (parts[0] === 'partnerships') {
      const snapshot = await firebaseGetDocs(firebaseCollection(db, 'proposals'));
      return { data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    }

    // Special case for 'applications/mine'
    if (parts[0] === 'applications' && parts[1] === 'mine') {
      const currentUser = auth.currentUser;
      if (!currentUser) return { data: [] };
      const q = firebaseQuery(
        firebaseCollection(db, 'applications'),
        firebaseWhere('creatorId', '==', currentUser.uid)
      );
      const snapshot = await firebaseGetDocs(q);
      return { data: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
    }

    // Determine collection reference (handles sub-collections like gigs/ID/applications)
    let colRef;
    if (parts.length === 3) {
      colRef = firebaseCollection(db, parts[0], parts[1], parts[2]);
    } else {
      colRef = firebaseCollection(db, parts[0]);
    }

    // Single document: collection/id
    if (parts.length === 2 && !queryString && parts[0] !== 'applications') {
      const docRef = firebaseDoc(db, parts[0], parts[1]);
      const docSnap = await firebaseGetDoc(docRef);
      return { data: docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [] };
    }

    let constraints: any[] = [];

    // Special handling for legacy role filters
    if (params.role) {
      const ambassadorRoles = ['Creator', 'Campus Creator', 'Ambassador', 'Ambassador/Influencer'];
      if (ambassadorRoles.includes(params.role)) {
        constraints.push(firebaseWhere('role', 'in', ambassadorRoles));
      } else {
        constraints.push(firebaseWhere('role', '==', params.role));
      }
    }

    // Handle all other parameters dynamically
    Object.keys(params).forEach(key => {
      if (key === 'role') return;
      if (key === 'senderId' && params.recipientId && parts[0] === 'proposals') return;
      if (key === 'recipientId' && params.senderId && parts[0] === 'proposals') return;
      constraints.push(firebaseWhere(key, '==', params[key]));
    });
    
    if (params.senderId && params.recipientId && parts[0] === 'proposals') {
      constraints.push(firebaseOr(
        firebaseWhere('senderId', '==', params.senderId),
        firebaseWhere('recipientId', '==', params.recipientId)
      ));
    }

    const snapshot = constraints.length > 0 ? await firebaseGetDocs(firebaseQuery(colRef, ...constraints)) : await firebaseGetDocs(colRef);
    const results = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    if (parts[0] === 'events') {
      try {
        const usersSnap = await firebaseGetDocs(firebaseCollection(db, 'users'));
        const existingUserIds = new Set(usersSnap.docs.map(u => u.id));
        return { data: results.filter((e: any) => e.hostId && existingUserIds.has(e.hostId)) };
      } catch (err) {
        console.error('Error fetching users for event filtering:', err);
        return { data: results };
      }
    }

    return { data: results };
  } catch (err: any) {
    console.error('apiClient.get error:', err);
    if (err.code === 'unavailable') return { data: [] };
    throw err;
  }
},
  post: async (path: string, data: any) => {
    try {
      const parts = path.replace(/^\//, '').split('/');
    
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    let enrichedData = { ...cleanData, createdAt: new Date().toISOString() };

    // CUSTOM ACTION: Apply to Gig or Campaign
    if ((parts[0] === 'gigs' || parts[0] === 'campaigns') && parts[2] === 'apply') {
      const gigId = parts[1];
      const sourceCol = parts[0];
      console.log(`[apiClient.post] Applying to ${sourceCol}:`, gigId);
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must be logged in to apply.');

      // Fetch creator profile for enrichment
      const userDoc = await firebaseGetDoc(firebaseDoc(db, 'users', currentUser.uid));
      const creatorProfile = userDoc.exists() ? (userDoc.data() as any) : {};

      const applicationData = {
        ...cleanData,
        creatorId: currentUser.uid,
        studentId: currentUser.uid, // Alias for legacy rules
        creator: {
          id: currentUser.uid,
          name: creatorProfile.name || creatorProfile.fullName || currentUser.displayName || 'Unknown Creator',
          email: creatorProfile.email || currentUser.email || '',
          university: creatorProfile.university || 'ABC-Rally'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('[apiClient.post] Application data:', applicationData);

      // Save to sub-collection
      try {
        const appColRef = firebaseCollection(db, sourceCol, gigId, 'applications');
        const docRef = await firebaseAddDoc(appColRef, applicationData);
        console.log('[apiClient.post] Sub-collection doc created:', docRef.id);
        
        // Also save to top-level applications collection with the SAME ID for easy lookup/update
        const topAppDocRef = firebaseDoc(db, 'applications', docRef.id);
        await firebaseSetDoc(topAppDocRef, { ...applicationData, gigId, sourceCollection: sourceCol });
        console.log('[apiClient.post] Top-level application doc created');

        // Notify Brand/Host
        try {
            const gigDoc = await firebaseGetDoc(firebaseDoc(db, sourceCol, gigId));
            if (gigDoc.exists()) {
                const gigData = gigDoc.data() as any;
                const brandEmail = gigData.brandEmail || gigData.brand || gigData.hostEmail; 
                const brandName = gigData.brandName || gigData.brand || gigData.hostName || 'Host';
                if (brandEmail) {
                    notifyNewApplication(brandEmail, brandName, applicationData.creator.name, gigData.title, applicationData.pitch || '');
                }
            }
        } catch (e) {
            console.warn('Failed to send gig application email', e);
        }

        logEvent('gig_application_submitted', { gigId, sourceCollection: parts[0] });
        return { data: { id: docRef.id, ...applicationData } };
      } catch (err: any) {
        console.error('[apiClient.post] CRITICAL ERROR during application save:', err);
        logEvent('application_error', { gigId, error: err.message });
        throw err;
      }
    }

    // Wallet Logic: Approve Report (Escrow -> Influencer)
    if (parts[0] === 'gigs' && parts[2] === 'approve-report') {
    const gigId = parts[1];
    return await runTransaction(db, async (transaction) => {
      const gigRef = firebaseDoc(db, 'gigs', gigId);
      const gigSnap = await transaction.get(gigRef);
      if (!gigSnap.exists()) throw new Error('Gig not found');
      const gigData = gigSnap.data() as any;

      const brandRef = firebaseDoc(db, 'wallets', gigData.brandId);
      const creatorRef = firebaseDoc(db, 'wallets', gigData.creatorId);
      
      const bSnap = await transaction.get(brandRef);
      const iSnap = await transaction.get(creatorRef);

      const bData = bSnap.exists() ? (bSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
      const iData = iSnap.exists() ? (iSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
      const amount = Number(gigData.reward);

      transaction.update(brandRef, { 
        escrow: (bData.escrow || 0) - amount, 
        lastUpdated: firebaseTimestamp() 
      });
      transaction.set(creatorRef, { 
        ...iData, 
        balance: (iData.balance || 0) + amount,
        escrow: Math.max(0, (iData.escrow || 0) - amount), 
        lastUpdated: firebaseTimestamp() 
      });
      
      // Record Creator Transaction
      const iTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
      transaction.set(iTransRef, {
        userId: gigData.creatorId, amount, type: 'credit', status: 'completed',
        description: `Earnings: ${gigData.title}`, relatedUserId: gigData.brandId, createdAt: firebaseTimestamp()
      });

      transaction.update(gigRef, { status: 'completed' });
      logEvent('report_approved', { gigId, amount });
      return { data: { success: true } };
    });
  }

  const colRef = firebaseCollection(db, parts[0]);

    if (parts[0] === 'proposals') {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await firebaseGetDoc(firebaseDoc(db, 'users', currentUser.uid));
          const senderProfile = userDoc.exists() ? (userDoc.data() as any) : {};
          
          const senderName = senderProfile.name || senderProfile.fullName || currentUser.displayName || 'User';
          const senderRole = senderProfile.role || 'Member';
          
          enrichedData = {
            ...enrichedData,
            senderId: currentUser.uid,
            sender: {
              name: senderName,
              role: senderRole,
              email: senderProfile.email || currentUser.email || '',
              imageUrl: senderProfile.imageUrl || currentUser.photoURL || ''
            },
            status: data.status || 'pending'
          };
          
          if (data.recipientId) {
            const recipientDoc = await firebaseGetDoc(firebaseDoc(db, 'users', data.recipientId));
            if (recipientDoc.exists()) {
              const recipientProfile = recipientDoc.data() as any;
              enrichedData.recipient = {
                name: recipientProfile.name || recipientProfile.fullName || 'Unknown User',
                role: recipientProfile.role || 'User',
                email: recipientProfile.email || '',
                imageUrl: recipientProfile.imageUrl || ''
              };
            }
          }
        } catch (err) {
          console.error('Error enriching proposal:', err);
        }
      }
    }
  const docRef = await firebaseAddDoc(colRef, enrichedData);

  // Notify Proposal Recipient
  if (parts[0] === 'proposals' && enrichedData.recipient?.email) {
      notifyProposalReceived(
          enrichedData.recipient.email,
          enrichedData.recipient.name,
          enrichedData.sender?.name || 'A user',
          data.message || ''
      );
  }

  // Track proposal send
  if (parts[0] === 'proposals') {
    logEvent('proposal_sent', {
      senderRole: enrichedData.sender?.role || 'unknown',
      recipientRole: enrichedData.recipient?.role || 'unknown'
    });
  }

  return { data: { id: docRef.id, ...data } };
    } catch (err: any) {
      console.error('apiClient.post error:', err);
      if (err.code === 'unavailable') {
        throw new Error('You are currently offline. This action will sync once you reconnect.');
      }
      throw err;
    }
},
  patch: async (path: string, data: any = {}) => {
    try {
      const parts = path.replace(/^\//, '').split('/');
      
      // Determine docRef (handles sub-collections like gigs/ID/applications/APP_ID)
      let docRef;
      if (parts.length === 4) {
        docRef = firebaseDoc(db, parts[0], parts[1], parts[2], parts[3]);
      } else if (parts.length === 2) {
        docRef = firebaseDoc(db, parts[0], parts[1]);
      }

      // Wallet Logic: Accept Application (Allocation from Campaign Budget)
      if (parts[0] === 'gigs' && parts[2] === 'applications' && data.status === 'accepted') {
        const gigId = parts[1];
        const appId = parts[3];
        const allocationAmount = Number(data.amount || 0); // Amount specified by brand during approval
        
        console.log('[apiClient.patch] Processing acceptance for App:', appId, 'on Gig:', gigId, 'Amount:', allocationAmount);
        
        return await runTransaction(db, async (transaction) => {
          // 1. Define all references
          const appSubRef = firebaseDoc(db, 'gigs', gigId, 'applications', appId);
          const gigRef = firebaseDoc(db, 'gigs', gigId);
          
          // 2. PERFORM ALL READS FIRST
          const appSnap = await transaction.get(appSubRef);
          if (!appSnap.exists()) throw new Error('Application document not found in sub-collection.');
          
          const appData = appSnap.data() as any;
          const creatorId = appData.creatorId || appData.creator?.id;
          if (!creatorId) throw new Error('Could not identify creator from application data.');

          const gigSnap = await transaction.get(gigRef);
          if (!gigSnap.exists()) throw new Error('The associated Gig no longer exists.');
          const gigData = gigSnap.data() as any;

          const brandWalletRef = firebaseDoc(db, 'wallets', gigData.brandId);
          const bSnap = await transaction.get(brandWalletRef);
          
          const creatorWalletRef = firebaseDoc(db, 'wallets', creatorId);
          const iSnap = await transaction.get(creatorWalletRef);

          // 3. START ALL WRITES
          const rewardAmount = allocationAmount || Number(gigData.reward || 0);

          if (!bSnap.exists()) {
            throw new Error('Your Brand Wallet has not been initialized. Please visit the Finance Hub first.');
          }

          const bData = bSnap.data() as any;
          
          // If the campaign has a pre-locked budget, draw from Brand Escrow instead of Balance
          if (gigData.budget || gigData.budgetLocked) {
             console.log('[apiClient.patch] Drawing from pre-locked budget');
             // We don't deduct from balance again. We just assign a portion of the Brand's total Escrow to this student allocation.
          } else {
            // LEGACY/DIRECT: Deduct from balance
            if ((bData.balance || 0) < rewardAmount) {
              throw new Error(`Insufficient funds. This campaign requires ₦${rewardAmount.toLocaleString()}, but your wallet balance is ₦${(bData.balance || 0).toLocaleString()}.`);
            }
            transaction.update(brandWalletRef, {
              balance: (bData.balance || 0) - rewardAmount,
              escrow: (bData.escrow || 0) + rewardAmount,
              lastUpdated: firebaseTimestamp()
            });
            
            // Record Brand Transaction
            const bTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
            transaction.set(bTransRef, {
              userId: gigData.brandId,
              amount: rewardAmount,
              type: 'debit',
              status: 'escrow',
              description: `Campaign Activation: ${gigData.title}`,
              createdAt: firebaseTimestamp()
            });
          }

          // 5. Update Gig status & Budget
          const remainingBudget = (Number(gigData.budget || gigData.reward || 0)) - rewardAmount;
          transaction.update(gigRef, { 
            status: 'in_progress', 
            budget: remainingBudget, // Update remaining budget on the campaign
            creatorId: creatorId,
            acceptedAppId: appId
          });
          
          // 6. Update Creator Wallet (Add to Escrow/Locked Funds)
          const iData = iSnap.exists() ? (iSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
          
          transaction.set(creatorWalletRef, {
            ...iData,
            escrow: (iData.escrow || 0) + rewardAmount,
            lastUpdated: firebaseTimestamp()
          }, { merge: true });

          // 7. Record Creator Transaction (Locked)
          const iTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
          transaction.set(iTransRef, {
            userId: creatorId,
            amount: rewardAmount,
            type: 'credit',
            status: 'escrow',
            description: `Locked Payment: ${gigData.title}`,
            relatedUserId: gigData.brandId,
            campaignId: gigId,
            createdAt: firebaseTimestamp()
          });

          // 8. Create Campaign Allocation (for 'My Campaigns' view)
          const allocRef = firebaseDoc(firebaseCollection(db, 'campaignAllocations'));
          transaction.set(allocRef, {
            campaignId: gigId,
            campaignTitle: gigData.title || 'Active Campaign',
            brandId: gigData.brandId,
            brandName: gigData.brandName || gigData.brand || 'Verified Brand',
            creatorId: creatorId,
            creatorName: appData.creator?.name || 'Creator',
            creatorUniversity: appData.creator?.university || '',
            creatorEmail: appData.creator?.email || '',
            amount: rewardAmount,
            status: 'in_progress',
            applicationId: appId,
            createdAt: firebaseTimestamp()
          });

          // 9. Update Application in sub-collection
          transaction.update(appSubRef, { status: 'accepted', updatedAt: new Date().toISOString() });
          
          // 10. Update Application in top-level collection (best effort, creates if missing)
          const appTopRef = firebaseDoc(db, 'applications', appId);
          transaction.set(appTopRef, { status: 'accepted', updatedAt: new Date().toISOString() }, { merge: true });

          // Notify Creator of Acceptance
          try {
            if (appData.creator?.email) {
                notifyApplicationDecision(
                    appData.creator.email, 
                    appData.creator.name || 'Creator', 
                    gigData.title || 'Campaign', 
                    gigData.brandName || gigData.brand || 'Verified Brand', 
                    'accepted'
                );
            }
          } catch (e) {
              console.warn('Failed to send application decision email', e);
          }

          // Track application acceptance
          logEvent('application_accepted', {
            gigId,
            rewardAmount,
            brandId: gigData.brandId,
            creatorId
          });

          return { data: { success: true } };
        });
      }

      if (docRef) {
        const cleanPatchData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await firebaseUpdateDoc(docRef, cleanPatchData);

        // Generic Sync for applications (Sub -> Top)
        if (parts.length === 4 && parts[0] === 'gigs' && parts[2] === 'applications') {
          try {
            const topRef = firebaseDoc(db, 'applications', parts[3]);
            await firebaseSetDoc(topRef, { ...cleanPatchData, updatedAt: new Date().toISOString() }, { merge: true });
          } catch (syncErr) {
            console.warn('[apiClient.patch] Top-level sync failed (non-critical):', syncErr);
          }
        }

        return { data: { success: true } };
      }
    } catch (err: any) {
      console.error('apiClient.patch error:', err);
      if (err.code === 'unavailable') {
        throw new Error('You are currently offline. This action will sync once you reconnect.');
      }
      throw err;
    }
  },
put: async (path: string, data: any) => {
    try {
      const parts = path.replace(/^\//, '').split('/');
      if (parts.length === 2) {
        const docRef = firebaseDoc(db, parts[0], parts[1]);
        // Strip undefined fields
        const cleanPutData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined)
        );
        await firebaseUpdateDoc(docRef, cleanPutData);
        return { data: { id: parts[1], ...cleanPutData } };
      }
    } catch (err: any) {
      console.error('apiClient.put error:', err);
      if (err.code === 'unavailable') {
        throw new Error('You are currently offline. This action will sync once you reconnect.');
      }
      throw err;
    }
  },
  delete: async (path: string) => {
    try {
      console.log('[apiClient.delete] Requested path:', path);
      const cleanPath = path.replace(/^\/+|\/+$/g, '');
      const parts = cleanPath.split('/');
      
      if (parts.length === 2) {
        const docRef = firebaseDoc(db, parts[0], parts[1]);
        await firebaseDeleteDoc(docRef);
        console.log('[apiClient.delete] Successfully deleted document:', cleanPath);
        return { data: { success: true } };
      } else {
        console.warn('[apiClient.delete] Invalid path for deletion (expected collection/id):', path);
        throw new Error(`Invalid deletion path: ${path}. Expected format: collection/id`);
      }
    } catch (err: any) {
      console.error('[apiClient.delete] Error deleting document:', path, err);
      if (err.code === 'unavailable') {
        return { data: { success: false, error: 'Network unavailable. Deletion queued.' } };
      }
      throw err;
    }
  }
};

export default { auth, db };
