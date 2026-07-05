import pool from '../server/dist/db.js';

async function listUsers() {
    try {
        const [users] = await pool.query('SELECT id, email, name, role, createdAt FROM User');
        console.log("--- MySQL Users ---");
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("MySQL query error:", err);
    } finally {
        pool.end();
    }
}

listUsers();
