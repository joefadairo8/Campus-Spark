import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function listUsers() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_spark',
        port: Number(process.env.DB_PORT) || 3306,
    });

    try {
        const [users] = await pool.query('SELECT id, email, name, role, createdAt FROM User');
        console.log("--- MySQL Users ---");
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("MySQL query error:", err);
    } finally {
        await pool.end();
    }
}

listUsers();
