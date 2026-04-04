import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as firebaseSignIn, 
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection as firebaseCollection, 
  doc as firebaseDoc, 
  getDocs as firebaseGetDocs, 
  getDoc as firebaseGetDoc, 
  setDoc as firebaseSetDoc, 
  addDoc as firebaseAddDoc,
  updateDoc as firebaseUpdateDoc,
  deleteDoc as firebaseDeleteDoc,
  query as firebaseQuery,
  where as firebaseWhere,
  limit as firebaseLimit,
  orderBy as firebaseOrderBy,
  serverTimestamp as firebaseTimestamp
} from 'firebase/firestore';

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
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Local storage parity for existing components (optional but helpful)
const setUser = (user: any) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
};

// Listen for auth changes to sync localStorage
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Note: We'll fetch the full user profile from Firestore later if needed
    setUser(user);
  } else {
    setUser(null);
  }
});

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

// API Client for components that need it
export const apiClient = {
  auth,
  db,
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

  if (params.role) {
    constraints.push(firebaseWhere('role', '==', params.role));
  }
  if (params.status) {
    constraints.push(firebaseWhere('status', '==', params.status));
  }
  if (params.studentId) {
    constraints.push(firebaseWhere('studentId', '==', params.studentId));
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
  const colRef = firebaseCollection(db, parts[0]);
  let enrichedData = { ...data, createdAt: new Date().toISOString() };

    if (parts[0] === 'proposals') {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userDoc = await firebaseGetDoc(firebaseDoc(db, 'users', currentUser.uid));
          const senderProfile = userDoc.exists() ? (userDoc.data() as any) : {};
          enrichedData = {
            ...enrichedData,
            senderId: currentUser.uid,
            sender: {
              name: senderProfile.name || 'Unknown',
              role: senderProfile.role || 'User',
              email: senderProfile.email || currentUser.email,
              imageUrl: senderProfile.imageUrl || ''
            },
            status: 'pending'
          };
          if (data.recipientId) {
            const recipientDoc = await firebaseGetDoc(firebaseDoc(db, 'users', data.recipientId));
            if (recipientDoc.exists()) {
              const recipientProfile = recipientDoc.data() as any;
              enrichedData.recipient = {
                name: recipientProfile.name || 'Unknown',
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
  if (parts.length >= 2) {
    const docRef = firebaseDoc(db, parts[0], parts[1]);
    if (data) {
      await firebaseUpdateDoc(docRef, data);
    }
    return { data: { success: true } };
  }
},
put: async (path: string, data: any) => {
  const parts = path.replace(/^\//, '').split('/');
  if (parts.length === 2) {
    const docRef = firebaseDoc(db, parts[0], parts[1]);
    await firebaseUpdateDoc(docRef, data);
    return { data: { id: parts[1], ...data } };
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