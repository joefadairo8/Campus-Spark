// Direct SQLite migration to add GigApplication table
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');

if (!fs.existsSync(dbPath)) {
    console.error('ERROR: dev.db not found at', dbPath);
    process.exit(1);
}

// Use node-sqlite3-wasm or better-sqlite3 if available, otherwise use raw file approach
// Let's try using the sqlite3 CLI bundled with Prisma's engines
const sql = `
CREATE TABLE IF NOT EXISTS "GigApplication" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "gigId"     TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "pitch"     TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'pending',
    "report"    TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("gigId") REFERENCES "Gig"("id") ON DELETE CASCADE,
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
);
`;

// Try using better-sqlite3 (Prisma uses it internally)
try {
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    db.exec(sql);
    db.close();
    console.log('SUCCESS: GigApplication table created!');
} catch (e1) {
    console.log('better-sqlite3 not available, trying sqlite3...');
    try {
        // Try the sqlite3 module
        const sqlite3 = require('sqlite3');
        const db = new sqlite3.Database(dbPath);
        db.exec(sql, (err) => {
            if (err) {
                console.error('sqlite3 error:', err.message);
                process.exit(1);
            }
            console.log('SUCCESS: GigApplication table created via sqlite3!');
            db.close();
        });
    } catch (e2) {
        console.error('Could not load any SQLite module:', e2.message);
        console.error('Please run: npx prisma db push --accept-data-loss in the server folder');
    }
}
