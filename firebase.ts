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

export default { auth, db };