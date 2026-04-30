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

  // Single document: collection/id
  if (parts.length === 2 && !queryString) {
    const docRef = firebaseDoc(db, parts[0], parts[1]);
    const docSnap = await firebaseGetDoc(docRef);
    return { data: docSnap.exists() ? [{ id: docSnap.id, ...docSnap.data() }] : [] };
  }

  // Collection with optional filters
  const colRef = firebaseCollection(db, parts[0]);
  let constraints: any[] = [];

  // Special handling for legacy role filters
  if (params.role) {
    const ambassadorRoles = [
      'Student/Professional Influencer',
      'Ambassador',
      'Ambassador/Influencer',
      'Student Influencer'
    ];
    
    if (ambassadorRoles.includes(params.role)) {
      constraints.push(firebaseWhere('role', 'in', ambassadorRoles));
    } else {
      constraints.push(firebaseWhere('role', '==', params.role));
    }
  }

  // Handle all other parameters dynamically as '==' filters
  Object.keys(params).forEach(key => {
    if (key === 'role') return; // Already handled
    
    // Special case for proposal involvement
    if (key === 'senderId' && params.recipientId && parts[0] === 'proposals') {
        // Handled below for composite 'or' query
        return;
    }
    if (key === 'recipientId' && params.senderId && parts[0] === 'proposals') {
        // Handled below
        return;
    }

    constraints.push(firebaseWhere(key, '==', params[key]));
  });
  
  // Handle senderId and recipientId OR logic for proposals
  if (params.senderId && params.recipientId && parts[0] === 'proposals') {
    constraints.push(firebaseOr(
      firebaseWhere('senderId', '==', params.senderId),
      firebaseWhere('recipientId', '==', params.recipientId)
    ));
  }

  const q = constraints.length > 0
    ? firebaseQuery(colRef, ...constraints)
    : colRef;

  const snapshot = await firebaseGetDocs(q as any);
  return {
    data: snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[]
  };
},
post: async (path: string, data: any) => {
  const parts = path.replace(/^\//, '').split('/');
  
  // Strip undefined fields to prevent Firestore crashes
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  let enrichedData = { ...cleanData, createdAt: new Date().toISOString() };
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
  
  // Wallet Logic: Accept Application (Balance -> Escrow)
  if (parts[0] === 'gigs' && parts[2] === 'applications' && data.status === 'accepted') {
    const gigId = parts[1];
    return await runTransaction(db, async (transaction) => {
      const gigRef = firebaseDoc(db, 'gigs', gigId);
      const gigSnap = await transaction.get(gigRef);
      const gigData = gigSnap.data() as any;
      const amount = Number(gigData.reward);

      const brandWalletRef = firebaseDoc(db, 'wallets', gigData.brandId);
      const bSnap = await transaction.get(brandWalletRef);

      if (!bSnap.exists() || bSnap.data().balance < amount) {
        throw new Error('Insufficient balance in brand wallet. Please top up first.');
      }

      const bData = bSnap.exists() ? (bSnap.data() as any) : { balance: 0, pending: 0, escrow: 0 };
      transaction.update(brandWalletRef, {
        balance: (bData.balance || 0) - amount,
        escrow: (bData.escrow || 0) + amount,
        lastUpdated: firebaseTimestamp()
      });

      // Record Brand Transaction
      const bTransRef = firebaseDoc(firebaseCollection(db, 'transactions'));
      transaction.set(bTransRef, {
        userId: gigData.brandId, amount, type: 'debit', status: 'escrow',
        description: `Payment locked: ${gigData.title}`, createdAt: firebaseTimestamp()
      });

      // Update Gig and Application
      transaction.update(gigRef, { status: 'in_progress', studentId: data.studentId });
      const appRef = firebaseDoc(db, 'applications', parts[3]);
      transaction.update(appRef, { status: 'accepted' });

      return { data: { success: true } };
    });
  }

  if (parts.length >= 2) {
    const docRef = firebaseDoc(db, parts[0], parts[1]);
    if (data) {
      // Strip undefined fields
      const cleanPatchData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      await firebaseUpdateDoc(docRef, cleanPatchData);
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
  const parts = path.replace(/^\//, '').split('/');
  if (parts.length === 2) {
    const docRef = firebaseDoc(db, parts[0], parts[1]);
    await firebaseDeleteDoc(docRef);
    return { data: { success: true } };
  }
}
};

export default { auth, db };