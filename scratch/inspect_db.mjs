import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function inspect() {
    try {
        console.log("--- PAST EVENTS ---");
        const peSnap = await getDocs(collection(db, 'past_events'));
        console.log(`Count: ${peSnap.size}`);
        peSnap.forEach(d => {
            console.log(d.id, JSON.stringify(d.data(), null, 2));
        });

        console.log("\n--- TESTIMONIALS ---");
        const tSnap = await getDocs(collection(db, 'testimonials'));
        console.log(`Count: ${tSnap.size}`);
        tSnap.forEach(d => {
            console.log(d.id, JSON.stringify(d.data(), null, 2));
        });
    } catch (err) {
        console.error("Inspect error:", err);
    }
}

inspect();
