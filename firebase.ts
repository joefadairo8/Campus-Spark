import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignIn, 
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore, collection as firebaseCollection, doc as firebaseDoc, getDocs as firebaseGetDocs, getDoc as firebaseGetDoc, setDoc as firebaseSetDoc, addDoc as firebaseAddDoc, updateDoc as firebaseUpdateDoc, deleteDoc as firebaseDeleteDoc, query as firebaseQuery, where as firebaseWhere, or as firebaseOr, limit as firebaseLimit, orderBy as firebaseOrderBy, serverTimestamp as firebaseTimestamp, runTransaction } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

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
  const querySnapshot = await firebaseGetDocs(q);
  return {
    empty: querySnapshot.empty,
    docs: querySnapshot.docs.map(d => ({
      id: d.id,
      data: () => d.data()
    }))
  };
};

export const getDoc = async (docRef: any) => {
  const docSnap = await firebaseGetDoc(docRef);
  return {
    exists: () => docSnap.exists(),
    data: () => docSnap.data()
  };
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
    const snapshot = await firebaseGetDocs(q);
    return {
      empty: snapshot.empty,
      docs: snapshot.docs.map(d => ({
        id: d.id,
        data: () => d.data()
      }))
    };
  },
  getDoc: async (docRef: any) => {
    const docSnap = await firebaseGetDoc(docRef);
    return {
      exists: () => docSnap.exists(),
      data: () => docSnap.data()
    };
  },
  setDoc: firebaseSetDoc,
  addDoc: async (colName: any, data: any) => {
    const colRef = typeof colName === 'string' 
      ? firebaseCollection(db, colName) 
      : colName;
    const docRef = await firebaseAddDoc(colRef, data);
    return { id: docRef.id };
  },
  updateDoc: firebaseUpdateDoc,
  deleteDoc: firebaseDeleteDoc,
  query: firebaseQuery,
  where: firebaseWhere,
  limit: firebaseLimit,
  orderBy: firebaseOrderBy,
  serverTimestamp: firebaseTimestamp,
  get: async (path: string) => {
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
        firebaseWhere('studentId', '==', currentUser.uid)
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
      const ambassadorRoles = ['Student/Professional Influencer', 'Ambassador', 'Ambassador/Influencer', 'Student Influencer'];
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

    const q = constraints.length > 0 ? firebaseQuery(colRef, ...constraints) : colRef;
    const snapshot = await firebaseGetDocs(q as any);
    return { data: snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) };
  },
  post: async (path: string, data: any) => {
    const parts = path.replace(/^\//, '').split('/');
    
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    let enrichedData = { ...cleanData, createdAt: new Date().toISOString() };

    // CUSTOM ACTION: Apply to Gig
    if (parts[0] === 'gigs' && parts[2] === 'apply') {
      const gigId = parts[1];
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('You must be logged in to apply.');

      // Fetch student profile for enrichment
      const userDoc = await firebaseGetDoc(firebaseDoc(db, 'users', currentUser.uid));
      const studentProfile = userDoc.exists() ? (userDoc.data() as any) : {};

      const applicationData = {
        ...cleanData,
        studentId: currentUser.uid,
        student: {
          id: currentUser.uid,
          name: studentProfile.name || studentProfile.fullName || currentUser.displayName || 'Unknown Student',
          email: studentProfile.email || currentUser.email || '',
          university: studentProfile.university || 'Campus Spark'
        },
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Save to sub-collection
      const appColRef = firebaseCollection(db, 'gigs', gigId, 'applications');
      const docRef = await firebaseAddDoc(appColRef, applicationData);
      
      // Also save to top-level applications collection with the SAME ID for easy lookup/update
      const topAppDocRef = firebaseDoc(db, 'applications', docRef.id);
      await firebaseSetDoc(topAppDocRef, { ...applicationData, gigId });

      return { data: { id: docRef.id, ...applicationData } };
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
      const influencerRef = firebaseDoc(db, 'wallets', gigData.studentId);
      
      const bSnap = await transaction.get(brandRef);
      const iSnap = await transaction.get(influencerRef);

      const bData = bSnap.exists() ? (bSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
      const iData = iSnap.exists() ? (iSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
      const amount = Number(gigData.reward);

      transaction.update(brandRef, { 
        escrow: (bData.escrow || 0) - amount, 
        lastUpdated: firebaseTimestamp() 
      });
      transaction.set(influencerRef, { 
        ...iData, 
        balance: (iData.balance || 0) + amount,
        escrow: Math.max(0, (iData.escrow || 0) - amount), 
        lastUpdated: firebaseTimestamp() 
      });
      
      // Record Influencer Transaction
      const iTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
      transaction.set(iTransRef, {
        userId: gigData.studentId, amount, type: 'credit', status: 'completed',
        description: `Earnings: ${gigData.title}`, relatedUserId: gigData.brandId, createdAt: firebaseTimestamp()
      });

      transaction.update(gigRef, { status: 'completed' });
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
            status: 'pending'
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
  return { data: { id: docRef.id, ...data } };
},
  patch: async (path: string, data: any = {}) => {
    const parts = path.replace(/^\//, '').split('/');
    
    // Determine docRef (handles sub-collections like gigs/ID/applications/APP_ID)
    let docRef;
    if (parts.length === 4) {
      docRef = firebaseDoc(db, parts[0], parts[1], parts[2], parts[3]);
    } else if (parts.length === 2) {
      docRef = firebaseDoc(db, parts[0], parts[1]);
    }

    // Wallet Logic: Accept Application (Balance -> Escrow)
    if (parts[0] === 'gigs' && parts[2] === 'applications' && data.status === 'accepted') {
      const gigId = parts[1];
      const appId = parts[3];
      console.log('[apiClient.patch] Processing acceptance for App:', appId, 'on Gig:', gigId);
      
      return await runTransaction(db, async (transaction) => {
        // 1. Define all references
        const appSubRef = firebaseDoc(db, 'gigs', gigId, 'applications', appId);
        const gigRef = firebaseDoc(db, 'gigs', gigId);
        
        // 2. PERFORM ALL READS FIRST
        const appSnap = await transaction.get(appSubRef);
        if (!appSnap.exists()) throw new Error('Application document not found in sub-collection.');
        
        const appData = appSnap.data() as any;
        const studentId = appData.studentId || appData.student?.id;
        if (!studentId) throw new Error('Could not identify student from application data.');

        const gigSnap = await transaction.get(gigRef);
        if (!gigSnap.exists()) throw new Error('The associated Gig no longer exists.');
        const gigData = gigSnap.data() as any;

        const brandWalletRef = firebaseDoc(db, 'wallets', gigData.brandId);
        const bSnap = await transaction.get(brandWalletRef);
        
        const influencerWalletRef = firebaseDoc(db, 'wallets', studentId);
        const iSnap = await transaction.get(influencerWalletRef);

        // 3. START ALL WRITES
        const rewardAmount = Number(gigData.reward || 0);

        if (!bSnap.exists()) {
          throw new Error('Your Brand Wallet has not been initialized. Please visit the Finance Hub first.');
        }

        const bData = bSnap.data() as any;
        if ((bData.balance || 0) < rewardAmount) {
          throw new Error(`Insufficient funds. This campaign requires ₦${rewardAmount.toLocaleString()}, but your wallet balance is ₦${(bData.balance || 0).toLocaleString()}.`);
        }

        transaction.update(brandWalletRef, {
          balance: (bData.balance || 0) - rewardAmount,
          escrow: (bData.escrow || 0) + rewardAmount,
          lastUpdated: firebaseTimestamp()
        });

        // 4. Record Brand Transaction
        const bTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
        transaction.set(bTransRef, {
          userId: gigData.brandId,
          amount: rewardAmount,
          type: 'debit',
          status: 'escrow',
          description: `Campaign Activation: ${gigData.title}`,
          createdAt: firebaseTimestamp()
        });

        // 5. Update Gig status
        transaction.update(gigRef, { 
          status: 'in_progress', 
          studentId: studentId,
          acceptedAppId: appId
        });
        
        // 6. Update Influencer Wallet (Add to Escrow/Locked Funds)
        const iData = iSnap.exists() ? (iSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
        
        transaction.set(influencerWalletRef, {
          ...iData,
          escrow: (iData.escrow || 0) + rewardAmount,
          lastUpdated: firebaseTimestamp()
        }, { merge: true });

        // 7. Record Influencer Transaction (Locked)
        const iTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
        transaction.set(iTransRef, {
          userId: studentId,
          amount: rewardAmount,
          type: 'credit',
          status: 'escrow',
          description: `Locked Payment: ${gigData.title}`,
          relatedUserId: gigData.brandId,
          createdAt: firebaseTimestamp()
        });

        // 8. Create Campaign Allocation (for 'My Campaigns' view)
        const allocRef = firebaseDoc(firebaseCollection(db, 'campaignAllocations'));
        transaction.set(allocRef, {
          campaignId: gigId,
          campaignTitle: gigData.title || 'Active Campaign',
          brandId: gigData.brandId,
          brandName: gigData.brandName || gigData.brand || 'Verified Brand',
          influencerId: studentId,
          influencerName: appData.student?.name || 'Student',
          influencerUniversity: appData.student?.university || '',
          influencerEmail: appData.student?.email || '',
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

        return { data: { success: true } };
      });
    }

    if (docRef) {
      const cleanPatchData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      await firebaseUpdateDoc(docRef, cleanPatchData);

      // Generic Sync for applications (Sub -> Top)
      // This handles 'rejected', 'reviewing', etc. Syncing 'accepted' is already handled in the transaction above.
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
  },
put: async (path: string, data: any) => {
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
},
  delete: async (path: string) => {
    console.log('[apiClient.delete] Requested path:', path);
    const cleanPath = path.replace(/^\/+|\/+$/g, '');
    const parts = cleanPath.split('/');
    
    if (parts.length === 2) {
      try {
        const docRef = firebaseDoc(db, parts[0], parts[1]);
        await firebaseDeleteDoc(docRef);
        console.log('[apiClient.delete] Successfully deleted document:', cleanPath);
        return { data: { success: true } };
      } catch (err: any) {
        console.error('[apiClient.delete] Error deleting document:', cleanPath, err);
        throw err;
      }
    } else {
      console.warn('[apiClient.delete] Invalid path for deletion (expected collection/id):', path);
      throw new Error(`Invalid deletion path: ${path}. Expected format: collection/id`);
    }
  }
};

export default { auth, db };