import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
});

async function main() {
    console.log('Using User:', process.env.SMTP_USER);
    console.log('Using Host:', process.env.SMTP_HOST);
    console.log('Using Port:', process.env.SMTP_PORT);
    console.log('Using Secure:', process.env.SMTP_SECURE);
    
    try {
        await transporter.verify();
        console.log('SMTP Connection verified successfully!');
        
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_USER}" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: 'SMTP Connection Test',
            text: 'This is a test to verify that SMTP configurations are valid and working.',
        });
        console.log('Test email sent successfully!', info.messageId);
    } catch (err) {
        console.error('SMTP verification or send failed:', err);
    }
}

main();
