
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCbQdWbU-hcmUvS1rR7llK0eZitU27UoQg",
  authDomain: "campus-spark-3a55d.firebaseapp.com",
  projectId: "campus-spark-3a55d",
  storageBucket: "campus-spark-3a55d.firebasestorage.app",
  messagingSenderId: "1078864505346",
  appId: "1:1078864505346:web:94f6c603fd0f2d8112551b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupOrphanedEvents() {
    const colRef = collection(db, 'events');
    const snapshot = await getDocs(colRef);
    console.log(`Checking ${snapshot.size} events...`);
    
    let deletedCount = 0;
    for (const d of snapshot.docs) {
        const data = d.data();
        // Orphaned if missing both hostId AND hostEmail
        if (!data.hostId && !data.hostEmail) {
            console.log(`Deleting orphaned event: ${data.name || 'Unnamed'} (ID: ${d.id})`);
            await deleteDoc(doc(db, 'events', d.id));
            deletedCount++;
        }
    }
    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned events.`);
}

cleanupOrphanedEvents().catch(console.error);
