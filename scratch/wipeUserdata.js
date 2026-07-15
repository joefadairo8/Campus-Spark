import admin from "firebase-admin";
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually parse env variables
try {
  const envContent = readFileSync(join(__dirname, "../server/.env"), "utf8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    }
  });
  console.log("Loaded environment variables successfully.");
} catch (e) {
  console.warn("Could not read server/.env, falling back to default env variables:", e.message);
}

console.log("🚀 Starting partial platform wipe (Userdata only)...");

// 1. Setup Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "../serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Setup MySQL connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_spark',
    port: Number(process.env.DB_PORT) || 3306,
    connectTimeout: 5000 // 5 seconds timeout
});

async function runWipe() {
  try {
    // --- PART A: WIPE MYSQL TABLES (Except User) ---
    console.log("🧹 Wiping MySQL tables...");
    try {
        // Disable foreign key checks to allow truncation
        await pool.query("SET FOREIGN_KEY_CHECKS = 0");
        
        const tablesToWipe = ["GigApplication", "Gig", "Event", "Proposal", "Notification"];
        for (const table of tablesToWipe) {
            console.log(`Truncating table: ${table}...`);
            await pool.query(`TRUNCATE TABLE ${table}`);
        }
        
        // Enable foreign key checks back
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("✅ MySQL Tables cleaned.");
    } catch (dbError) {
        console.warn("⚠️ MySQL Wiping skipped (Connection refused or database offline):", dbError.message);
    }

    // --- PART B: WIPE FIRESTORE COLLECTIONS (Except Users) ---
    console.log("🧹 Wiping Firestore collections...");
    
    const collectionsToWipe = [
        "campaigns", 
        "campaignAllocations", 
        "transactions", 
        "ratingRequests", 
        "past_events", 
        "testimonials"
    ];
    
    for (const colName of collectionsToWipe) {
        console.log(`Cleaning Firestore collection: ${colName}...`);
        const collectionRef = db.collection(colName);
        const snapshot = await collectionRef.get();
        
        if (snapshot.size > 0) {
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Deleted ${snapshot.size} docs from ${colName}.`);
        } else {
            console.log(`Collection ${colName} is already empty.`);
        }
    }
    console.log("✅ Firestore collections wiped.");

    // --- PART C: RESET WALLET BALANCES TO 0 ---
    console.log("🧹 Resetting wallet balances in Firestore...");
    const walletsRef = db.collection("wallets");
    const walletsSnapshot = await walletsRef.get();
    
    if (walletsSnapshot.size > 0) {
        const batch = db.batch();
        walletsSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, {
                balance: 0,
                lockedBalance: 0,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        console.log(`Reset ${walletsSnapshot.size} wallets to ₦0.`);
    } else {
        console.log("No wallets to reset.");
    }
    console.log("✅ Wallets reset completed.");

    console.log("\n✨ Partial platform wipe completed successfully! Gigs, transactions, campaigns, events, and wallets cleared. User accounts remain active.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Wipe failed:", error);
    process.exit(1);
  }
}

runWipe();
