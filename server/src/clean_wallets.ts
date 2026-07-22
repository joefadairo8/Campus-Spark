import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
    fs.readFileSync(new URL('../../serviceAccountKey.json', import.meta.url), 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function cleanNegativeEscrows() {
    console.log('=== Cleaning negative escrow balances in Firestore wallets ===');
    const snapshot = await db.collection('wallets').get();
    let cleaned = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const escrow = Number(data.escrow);
        if (!isNaN(escrow) && escrow < 0) {
            console.log(`Fixing wallet doc ${doc.id}: old escrow = ${escrow} -> set to 0`);
            await doc.ref.update({
                escrow: 0,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            cleaned++;
        }
    }

    console.log(`Finished. Processed ${snapshot.docs.length} wallets. Fixed ${cleaned} negative escrow balances.`);
    process.exit(0);
}

cleanNegativeEscrows().catch(err => {
    console.error(err);
    process.exit(1);
});
