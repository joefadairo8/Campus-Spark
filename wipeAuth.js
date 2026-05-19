import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

// Read service account from JSON file in ESM
const serviceAccount = JSON.parse(
  readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function wipeEverything() {
  console.log("🚀 Starting full platform wipe (ESM Mode)...");

  try {
    // 1. Wipe Firebase Auth Users
    let totalDeleted = 0;
    const listUsers = async (nextPageToken) => {
      const result = await auth.listUsers(100, nextPageToken);
      const uids = result.users.map(user => user.uid);
      
      if (uids.length > 0) {
        await auth.deleteUsers(uids);
        totalDeleted += uids.length;
        console.log(`Deleted ${uids.length} Auth users...`);
      }
      
      if (result.pageToken) {
        await listUsers(result.pageToken);
      }
    };
    await listUsers();
    console.log(`✅ Auth Cleaned: ${totalDeleted} users removed.`);

    // 2. Wipe Firestore Collections
    const collections = await db.listCollections();
    for (const collection of collections) {
      const colId = collection.id;
      console.log(`Cleaning collection: ${colId}...`);
      
      const snapshot = await collection.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    console.log("✅ Firestore Cleaned.");

    console.log("\n✨ Platform is now 100% fresh. Happy testing!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Wipe failed:", error);
    process.exit(1);
  }
}

wipeEverything();
