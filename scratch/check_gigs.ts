
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function checkGigs() {
  try {
    console.log('Fetching gigs with status == "open"...');
    const colRef = collection(db, 'gigs');
    const q = query(colRef, where('status', '==', 'open'));
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.docs.length} "open" gigs.`);
    snapshot.docs.forEach(doc => {
      console.log(`Gig ID: ${doc.id}, Status: ${doc.data().status}, Title: ${doc.data().title}, Brand: ${doc.data().brand || doc.data().brandName}`);
    });

    console.log('\nFetching all gigs to see if any exist without "open" status...');
    // This might fail if rules block it, but let's try.
    try {
        const snapshotAll = await getDocs(colRef);
        console.log(`Found ${snapshotAll.docs.length} total gigs in collection.`);
    } catch (e) {
        console.log('Could not fetch all gigs (permission denied). This is expected if rules are strict.');
    }

  } catch (err) {
    console.error('Error fetching gigs:', err);
  }
}

checkGigs();
