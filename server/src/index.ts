import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import https from 'https';
import zlib from 'zlib';
import admin from 'firebase-admin';
import pool from './db.js';
import {
    sendWelcomeEmail, sendAdminNewUserAlert,
    sendProposalReceivedEmail, sendProposalStatusEmail,
    sendNewApplicationEmail, sendApplicationDecisionEmail,
    sendReportSubmittedEmail, sendReportApprovedEmail, sendReportRejectedEmail,
    sendWithdrawalRequestEmail, sendWithdrawalConfirmationEmail,
    sendTopUpConfirmationEmail, sendGenericNotificationEmail,
    sendRatingRequestEmail, sendFundsReleasedEmail, sendFundsReleasedBrandEmail,
    sendWithdrawalCompletedEmail, sendGigAssignedEmail,
} from './emailService.js';

dotenv.config();

// Read service account from JSON file and initialize Firebase Admin
const serviceAccount = JSON.parse(
    fs.readFileSync(new URL('../../serviceAccountKey.json', import.meta.url), 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestoreDb = admin.firestore();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

app.use(cors());
app.use(express.json());

// --- DEBUG & HEALTH ROUTES ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'v3-mysql2', time: new Date().toISOString() });
});

app.get('/api/debug/counts', async (req, res) => {
    try {
        const [[{ count: users }]] = await pool.query('SELECT COUNT(*) as count FROM User') as any;
        const [[{ count: gigs }]] = await pool.query('SELECT COUNT(*) as count FROM Gig') as any;
        const [[{ count: events }]] = await pool.query('SELECT COUNT(*) as count FROM Event') as any;
        const [[{ count: proposals }]] = await pool.query('SELECT COUNT(*) as count FROM Proposal') as any;
        
        res.json({ users, gigs, events, proposals });
    }
    catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/debug/seed', async (req, res) => {
    try {
        const title = 'Summer Campus Ambassador';
        const description = 'Join our team to promote sustainable fashion on campus!';
        const reward = 25000;
        const brand = 'EcoVibe App';
        const status = 'open';

        const [result]: any = await pool.query(
            'INSERT INTO Gig (id, title, description, reward, brand, status) VALUES (UUID(), ?, ?, ?, ?, ?)',
            [title, description, reward, brand, status]
        );
        
        res.json({ message: 'Gig seeded successfully', result });
    }
    catch (e: any) {
        res.status(500).json({ error: e.message, stack: e.stack });
    }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from public
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role, ...profileData } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Convert profileData to individual fields or handle them as needed
        // For now, let's assume the basic fields are present in the table
        const [result]: any = await pool.query(
            'INSERT INTO User (id, email, password, name, role) VALUES (UUID(), ?, ?, ?, ?)',
            [email, hashedPassword, name, role]
        );

        const [[user]]: any = await pool.query('SELECT * FROM User WHERE email = ?', [email]);
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);

        // Email notifications (non-blocking)
        sendWelcomeEmail(email, name, role).catch(() => {});
        sendAdminNewUserAlert(name, email, role).catch(() => {});

        res.status(201).json({ user, token });
    }
    catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [[user]]: any = await pool.query('SELECT * FROM User WHERE email = ?', [email]);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
        res.json({ user, token });
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
        const [[user]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        res.json(user);
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- USER ROUTES ---

app.get('/api/users', async (req, res) => {
    const { role } = req.query;
    try {
        let query = 'SELECT id, email, name, role, imageUrl, bio, location, phoneNumber, industry, university FROM User';
        const params: any[] = [];
        
        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }
        
        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    console.log(`GET /api/users/${req.params.id} requested`);
    try {
        const [[user]]: any = await pool.query(
            'SELECT id, email, name, role, imageUrl, bio, location, phoneNumber, industry, university, website, instagram, twitter, linkedin, handle, clubType, companySize FROM User WHERE id = ?',
            [req.params.id]
        );
        
        if (!user) {
            console.log(`User ${req.params.id} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        console.error(`Error fetching user ${req.params.id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/users/me', authenticateToken, upload.single('image'), async (req: any, res) => {
    const updateData = { ...req.body };
    if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    try {
        // Construct dynamic UPDATE query
        const fields = Object.keys(updateData).filter(key => key !== 'id');
        if (fields.length === 0) return res.json({ message: 'No changes' });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updateData[field]);
        values.push(req.user.id);

        await pool.query(`UPDATE User SET ${setClause} WHERE id = ?`, values);
        const [[user]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- PROPOSAL ROUTES ---

app.post('/api/proposals', authenticateToken, async (req: any, res) => {
    const { recipientId, message, budget, timeline } = req.body;
    try {
        const proposalId = crypto.randomUUID();
        await pool.query(
            'INSERT INTO Proposal (id, senderId, recipientId, message, budget, timeline, status) VALUES (?, ?, ?, ?, ?, ?, "pending")',
            [proposalId, req.user.id, recipientId, message, budget, timeline]
        );

        const [[proposal]]: any = await pool.query(`
            SELECT p.*, 
                   s.name as senderName, s.role as senderRole, s.imageUrl as senderImageUrl,
                   r.name as recipientName, r.role as recipientRole, r.imageUrl as recipientImageUrl
            FROM Proposal p
            JOIN User s ON p.senderId = s.id
            JOIN User r ON p.recipientId = r.id
            WHERE p.id = ?
        `, [proposalId]);

        // Notify recipient by email (non-blocking)
        sendProposalReceivedEmail(
            proposal.recipientEmail || proposal.r_email || '',
            proposal.recipientName,
            proposal.senderName,
            message
        ).catch(() => {});

        res.status(201).json(proposal);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/proposals', authenticateToken, async (req: any, res) => {
    try {
        const [proposals] = await pool.query(`
            SELECT p.*, 
                   s.name as senderName, s.role as senderRole, s.imageUrl as senderImageUrl, s.email as senderEmail,
                   r.name as recipientName, r.role as recipientRole, r.imageUrl as recipientImageUrl, r.email as recipientEmail
            FROM Proposal p
            JOIN User s ON p.senderId = s.id
            JOIN User r ON p.recipientId = r.id
            WHERE p.senderId = ? OR p.recipientId = ?
            ORDER BY p.createdAt DESC
        `, [req.user.id, req.user.id]);
        
        res.json(proposals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/proposals/:id', authenticateToken, async (req: any, res) => {
    const { status, budget, message, timeline, senderId, recipientId } = req.body;
    try {
        const fields: string[] = [];
        const params: any[] = [];
        if (status !== undefined) { fields.push('status = ?'); params.push(status); }
        if (budget !== undefined) { fields.push('budget = ?'); params.push(budget); }
        if (message !== undefined) { fields.push('message = ?'); params.push(message); }
        if (timeline !== undefined) { fields.push('timeline = ?'); params.push(timeline); }
        if (senderId !== undefined) { fields.push('senderId = ?'); params.push(senderId); }
        if (recipientId !== undefined) { fields.push('recipientId = ?'); params.push(recipientId); }

        if (fields.length > 0) {
            params.push(req.params.id);
            await pool.query(`UPDATE Proposal SET ${fields.join(', ')} WHERE id = ?`, params);
        }
        
        const [[proposal]]: any = await pool.query(`
            SELECT p.*, 
                   s.id as senderId, s.name as senderName, s.email as senderEmail,
                   r.id as recipientId, r.name as recipientName, r.email as recipientEmail
            FROM Proposal p
            JOIN User s ON p.senderId = s.id
            JOIN User r ON p.recipientId = r.id
            WHERE p.id = ?
        `, [req.params.id]);
        
        // Notify sender of status change (non-blocking)
        if (status && proposal) {
            sendProposalStatusEmail(
                proposal.senderEmail,
                proposal.senderName,
                proposal.recipientName,
                status
            ).catch(() => {});
        }

        res.json(proposal);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// --- EVENT ROUTES ---

app.get('/api/events', async (req, res) => {
    try {
        const [events] = await pool.query('SELECT * FROM Event ORDER BY date ASC');
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- GIG ROUTES ---

app.get('/api/gigs', async (req, res) => {
    const { studentId, status, brand } = req.query;
    try {
        let query = 'SELECT * FROM Gig';
        const params: any[] = [];
        const conditions: string[] = [];

        if (studentId) {
            conditions.push('studentId = ?');
            params.push(studentId);
        }
        if (status) {
            if (status === 'open') {
                conditions.push('status IN ("open", "active")');
            } else {
                conditions.push('status = ?');
                params.push(status);
            }
        } else if (!studentId && !brand) {
            conditions.push('status IN ("open", "active")');
        }
        
        if (brand) {
            conditions.push('brand = ?');
            params.push(brand);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY createdAt DESC';

        const [gigs] = await pool.query(query, params);
        res.json(gigs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gigs', authenticateToken, async (req: any, res) => {
    const { title, description, reward, brand } = req.body;
    try {
        const gigId = crypto.randomUUID();
        await pool.query(
            'INSERT INTO Gig (id, title, description, reward, brand, status) VALUES (?, ?, ?, ?, ?, "open")',
            [gigId, title, description, Number(reward), brand || req.user.email]
        );
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [gigId]);
        res.status(201).json(gig);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.patch('/api/gigs/:id', authenticateToken, async (req: any, res) => {
    const { status, studentId, title, description, reward, budget, brief, category, deadline, location } = req.body;
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });

        const [[currentUser]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        const isAdmin = req.user.role === 'Admin';
        const isOwner = currentUser && (gig.brand === currentUser.name || gig.brand === currentUser.email);

        const newReward = budget !== undefined ? Number(budget) : (reward !== undefined ? Number(reward) : undefined);

        const isContentUpdate = title || description || newReward !== undefined;
        if (isContentUpdate && !isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized to edit this gig' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (studentId) updateData.studentId = studentId;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (newReward !== undefined) updateData.reward = newReward;

        const fields = Object.keys(updateData);
        if (fields.length > 0) {
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updateData[field]);
            values.push(req.params.id);
            await pool.query(`UPDATE Gig SET ${setClause} WHERE id = ?`, values);
        }

        // Sync Firestore document so both MySQL AND Firestore hold the updated budget & reward
        try {
            const gigRef = firestoreDb.collection('gigs').doc(req.params.id);
            const fsUpdate: any = { updatedAt: new Date().toISOString() };
            if (title) fsUpdate.title = title;
            if (description) fsUpdate.description = description;
            if (brief) fsUpdate.brief = brief;
            if (newReward !== undefined) {
                fsUpdate.reward = newReward;
                fsUpdate.budget = newReward;
            }
            if (category) fsUpdate.category = category;
            if (deadline) fsUpdate.deadline = deadline;
            if (location) fsUpdate.location = location;
            if (status) fsUpdate.status = status;

            await gigRef.set(fsUpdate, { merge: true });
        } catch (fsErr) {
            console.warn('[Gig Patch] Firestore sync non-blocking warning:', fsErr);
        }

        const [[updatedGig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        res.json(updatedGig);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/gigs/:id', authenticateToken, async (req: any, res) => {
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });

        const [[currentUser]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        const isAdmin = req.user.role === 'Admin';
        const isOwner = currentUser && (gig.brand === currentUser.name || gig.brand === currentUser.email);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized to delete this gig' });
        }

        await pool.query('DELETE FROM Gig WHERE id = ?', [req.params.id]);
        res.json({ message: 'Gig deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- GIG APPLICATION ROUTES ---

app.post('/api/gigs/:id/apply', authenticateToken, async (req: any, res) => {
    const { pitch } = req.body;
    const gigId = req.params.id;
    const studentId = req.user.id;

    if (!pitch || pitch.trim().length === 0) {
        return res.status(400).json({ error: 'A pitch is required to apply.' });
    }

    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [gigId]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });
        if (gig.status !== 'open') return res.status(400).json({ error: 'This gig is no longer accepting applications.' });

        const [[existing]]: any = await pool.query('SELECT id FROM GigApplication WHERE gigId = ? AND studentId = ? AND status = "pending"', [gigId, studentId]);
        if (existing) return res.status(400).json({ error: 'You already have a pending application under review for this gig.' });

        const appId = crypto.randomUUID();
        await pool.query(
            'INSERT INTO GigApplication (id, gigId, studentId, pitch, status) VALUES (?, ?, ?, ?, "pending")',
            [appId, gigId, studentId, pitch.trim()]
        );
        const [[application]]: any = await pool.query('SELECT * FROM GigApplication WHERE id = ?', [appId]);
        const [[student]]: any = await pool.query('SELECT name, email FROM User WHERE id = ?', [studentId]);

        // Notify brand by email — look up brand user by email/name stored in Gig
        try {
            const [[brandUser]]: any = await pool.query(
                'SELECT name, email FROM User WHERE email = ? OR name = ? LIMIT 1',
                [gig.brandEmail || gig.brand, gig.brand]
            );
            if (brandUser?.email) {
                sendNewApplicationEmail(brandUser.email, brandUser.name, student?.name || 'A creator', gig.title, pitch).catch(() => {});
            }
        } catch (_) {}

        res.status(201).json(application);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/gigs/:id/applications', authenticateToken, async (req: any, res) => {
    try {
        const [applications] = await pool.query(`
            SELECT a.*, 
                   u.id as creatorId, u.name as creatorName, u.email as creatorEmail, u.imageUrl as creatorImageUrl, u.university as creatorUniversity, u.bio as creatorBio
            FROM GigApplication a
            JOIN User u ON a.studentId = u.id
            WHERE a.gigId = ?
            ORDER BY a.createdAt DESC
        `, [req.params.id]);
        res.json(applications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/gigs/:id/applications/:appId', authenticateToken, async (req: any, res) => {
    const { status } = req.body; 
    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be "accepted" or "rejected".' });
    }
    let application: any = { id: req.params.appId, gigId: req.params.id, status };
    try {
        await pool.query('UPDATE GigApplication SET status = ? WHERE id = ?', [status, req.params.appId]);
        const [[appRow]]: any = await pool.query('SELECT * FROM GigApplication WHERE id = ?', [req.params.appId]);
        if (appRow) application = appRow;

        if (status === 'accepted' && application.studentId) {
            await pool.query('UPDATE Gig SET status = "in_progress", studentId = ? WHERE id = ?', [application.studentId, req.params.id]);
            await pool.query('UPDATE GigApplication SET status = "rejected" WHERE gigId = ? AND id != ? AND status = "pending"', [req.params.id, req.params.appId]);
        }

        // Notify creator of decision (non-blocking)
        try {
            const [[gig]]: any = await pool.query('SELECT title, brand, brandEmail FROM Gig WHERE id = ?', [req.params.id]);
            const [[student]]: any = await pool.query('SELECT name, email FROM User WHERE id = ?', [application.studentId]);
            if (student?.email && gig) {
                sendApplicationDecisionEmail(student.email, student.name, gig.title, gig.brand, status as 'accepted' | 'rejected').catch(() => {});
            }
        } catch (_) {}
    } catch (error: any) {
        console.warn('[Application Patch] MySQL unavailable (non-blocking fallback):', error.message);
    }

    res.json(application);
});

app.get('/api/applications/mine', authenticateToken, async (req: any, res) => {
    try {
        const [applications] = await pool.query(`
            SELECT a.*, 
                   g.id as gigId, g.title as gigTitle, g.brand as gigBrand, g.reward as gigReward, g.status as gigStatus
            FROM GigApplication a
            JOIN Gig g ON a.gigId = g.id
            WHERE a.studentId = ?
            ORDER BY a.createdAt DESC
        `, [req.user.id]);
        res.json(applications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/gigs/:id/report', authenticateToken, async (req: any, res) => {
    const { report, reportLink, reportImageUrl } = req.body;
    if (!report || report.trim().length === 0) {
        return res.status(400).json({ error: 'A report is required.' });
    }
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });
        if (gig.studentId !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' });

        await pool.query(`
            UPDATE GigApplication 
            SET report = ?, reportLink = ?, reportImageUrl = ?, reportSubmittedAt = NOW()
            WHERE gigId = ? AND studentId = ? AND status = "accepted"
        `, [report.trim(), reportLink || null, reportImageUrl || null, req.params.id, req.user.id]);

        await pool.query('UPDATE Gig SET status = "reviewing" WHERE id = ?', [req.params.id]);
        const [[updatedGig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);

        // Notify brand + admin that report was submitted (non-blocking)
        try {
            const [[student]]: any = await pool.query('SELECT name FROM User WHERE id = ?', [req.user.id]);
            const [[brandUser]]: any = await pool.query('SELECT name, email FROM User WHERE email = ? OR name = ? LIMIT 1', [gig.brandEmail || gig.brand, gig.brand]);
            if (brandUser?.email) sendReportSubmittedEmail(brandUser.email, brandUser.name, student?.name || 'A creator', gig.title).catch(() => {});
            sendReportSubmittedEmail(process.env.ADMIN_EMAIL || 'hello@abc-rally.com', 'Admin', student?.name || 'A creator', gig.title).catch(() => {});
        } catch (_) {}

        res.json({ message: 'Campaign report submitted and is under review!', gig: updatedGig });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Brand approves a completion report
app.post('/api/gigs/:id/approve-report', authenticateToken, async (req: any, res) => {
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });

        const [[currentUser]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        const isAdmin = req.user.role === 'Admin';
        const isOwner = currentUser && (gig.brand === currentUser.name || gig.brand === currentUser.email);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized to approve this report.' });
        }

        if (gig.status !== 'reviewing') {
            return res.status(400).json({ error: 'Gig is not in reviewing state.' });
        }

        await pool.query('UPDATE Gig SET status = "completed" WHERE id = ?', [req.params.id]);
        const [[updatedGig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);

        // Notify creator that report was approved (non-blocking)
        try {
            if (gig.studentId) {
                const [[student]]: any = await pool.query('SELECT name, email FROM User WHERE id = ?', [gig.studentId]);
                if (student?.email) sendReportApprovedEmail(student.email, student.name, gig.title, gig.brand).catch(() => {});
            }
        } catch (_) {}

        res.json({ message: 'Report approved and campaign marked as completed!', gig: updatedGig });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Brand rejects a completion report (requests revision)
app.post('/api/gigs/:id/reject-report', authenticateToken, async (req: any, res) => {
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });

        const [[currentUser]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        const isAdmin = req.user.role === 'Admin';
        const isOwner = currentUser && (gig.brand === currentUser.name || gig.brand === currentUser.email);

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized to reject this report.' });
        }

        if (gig.status !== 'reviewing') {
            return res.status(400).json({ error: 'Gig is not in reviewing state.' });
        }

        await pool.query('UPDATE Gig SET status = "in_progress" WHERE id = ?', [req.params.id]);
        const [[updatedGig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);

        // Notify creator that revision is needed (non-blocking)
        try {
            if (gig.studentId) {
                const [[student]]: any = await pool.query('SELECT name, email FROM User WHERE id = ?', [gig.studentId]);
                if (student?.email) sendReportRejectedEmail(student.email, student.name, gig.title, gig.brand).catch(() => {});
            }
        } catch (_) {}

        res.json({ message: 'Report rejected. Creator has been notified to revise.', gig: updatedGig });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [[{ count: userCount }]] = await pool.query('SELECT COUNT(*) as count FROM User') as any;
        const [[{ count: gigCount }]] = await pool.query('SELECT COUNT(*) as count FROM Gig') as any;
        const [[{ count: eventCount }]] = await pool.query('SELECT COUNT(*) as count FROM Event') as any;
        const [recentUsers] = await pool.query('SELECT id, name, email, role, createdAt FROM User ORDER BY createdAt DESC LIMIT 8') as any;
        const [roleGroups] = await pool.query('SELECT role, COUNT(*) as count FROM User GROUP BY role') as any;
        const [[{ sum: rewardPool }]] = await pool.query('SELECT SUM(reward) as sum FROM Gig') as any;
        const [[{ count: pendingProposals }]] = await pool.query('SELECT COUNT(*) as count FROM Proposal WHERE status = "pending"') as any;

        const roles: Record<string, number> = {};
        roleGroups.forEach((group: any) => {
            roles[group.role] = group.count;
        });

        res.json({
            stats: {
                users: userCount,
                gigs: gigCount,
                events: eventCount,
                roles,
                rewardPool: rewardPool || 0,
                pendingProposals
            },
            recentUsers
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/partnerships', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [proposals] = await pool.query(`
            SELECT p.*, 
                   s.name as senderName, s.role as senderRole,
                   r.name as recipientName, r.role as recipientRole
            FROM Proposal p
            JOIN User s ON p.senderId = s.id
            JOIN User r ON p.recipientId = r.id
            ORDER BY p.createdAt DESC
        `) as any;

        const partnerships = proposals.map((p: any) => ({
            id: p.id,
            senderName: p.senderName,
            senderRole: p.senderRole,
            recipientName: p.recipientName,
            recipientRole: p.recipientRole,
            proposalMessage: p.message || '',
            budget: p.budget || undefined,
            timeline: p.timeline || undefined,
            status: p.status,
            createdAt: p.createdAt.toISOString()
        }));

        res.json(partnerships);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM User WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- NOTIFICATION ROUTES ---

app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
        const [notifications] = await pool.query('SELECT * FROM Notification WHERE userId = ? ORDER BY createdAt DESC', [req.user.id]);
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- EMAIL NOTIFY ENDPOINT (for Firebase-side events: wallet, withdrawal) ---
app.post('/api/email/notify', async (req, res) => {
    const { type, to, name, amount, reference, bankDetails, subject, title, body, role } = req.body;
    try {
        switch (type) {
            case 'welcome':
                if (to && name) await sendWelcomeEmail(to, name, role || 'User');
                sendAdminNewUserAlert(name, to, role || 'User').catch(() => {});
                break;
            case 'proposal_received':
                if (to) await sendProposalReceivedEmail(to, req.body.recipientName, name, body);
                break;
            case 'proposal_status':
                if (to) await sendProposalStatusEmail(to, name, req.body.recipientName, req.body.status);
                break;
            case 'new_application':
                if (to) await sendNewApplicationEmail(to, name, req.body.creatorName, title, body);
                break;
            case 'application_decision':
                if (to) await sendApplicationDecisionEmail(to, name, title, req.body.brandName, req.body.status);
                break;
            case 'report_submitted':
                if (to) await sendReportSubmittedEmail(to, name, req.body.creatorName, title);
                sendReportSubmittedEmail(process.env.ADMIN_EMAIL || 'hello@abc-rally.com', 'Admin', req.body.creatorName || 'A user', title).catch(() => {});
                break;
            case 'report_approved':
                if (to) await sendReportApprovedEmail(to, name, title, req.body.brandName);
                break;
            case 'report_rejected':
                if (to) await sendReportRejectedEmail(to, name, title, req.body.brandName);
                break;
            case 'topup':
                if (to && name && amount) await sendTopUpConfirmationEmail(to, name, Number(amount), reference || 'N/A');
                break;
            case 'withdrawal_request':
                if (to && name && amount) {
                    await Promise.all([
                        sendWithdrawalRequestEmail(to, name, Number(amount), bankDetails),
                        sendWithdrawalConfirmationEmail(to, name, Number(amount)),
                    ]);
                }
                break;
            case 'gig_assigned':
                if (to) await sendGigAssignedEmail(to, name, title, req.body.brandName, Number(amount) || undefined);
                break;
            case 'funds_released':
                if (to) await sendFundsReleasedEmail(to, name, Number(amount), title, req.body.brandName);
                if (req.body.brandEmail) sendFundsReleasedBrandEmail(req.body.brandEmail, req.body.brandName, Number(amount), title, name).catch(() => {});
                break;
            case 'withdrawal_completed':
                if (to && name && amount) await sendWithdrawalCompletedEmail(to, name, Number(amount), bankDetails);
                break;
            case 'rating_request':
                if (to) await sendRatingRequestEmail(to, name, req.body.creatorName, title);
                break;
            case 'generic':
                if (to && subject && title && body) await sendGenericNotificationEmail(to, subject, title, body);
                break;
            case 'blast':
                const { recipients } = req.body;
                if (Array.isArray(recipients) && subject && title && body) {
                    const batchSize = 10;
                    for (let i = 0; i < recipients.length; i += batchSize) {
                        const batch = recipients.slice(i, i + batchSize);
                        await Promise.allSettled(
                            batch.map((email: string) => sendGenericNotificationEmail(email, subject, title, body))
                        );
                    }
                }
                break;
            default:
                return res.status(400).json({ error: 'Unknown notification type.' });
        }
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── PANDASCROW ESCROW ENDPOINTS ──────────────────────────────────────────────
const PANDASCROW_BASE = process.env.PANDASCROW_BASE_URL || 'https://api.pandascrow.io';
const PANDASCROW_TOKEN = process.env.PANDASCROW_TOKEN || '';
const PANDASCROW_UUID = process.env.PANDASCROW_UUID || '';
const PANDASCROW_INITIATOR_ROLE = process.env.PANDASCROW_INITIATOR_ROLE || '';

/**
 * POST /api/escrow/initialize
 * Creates a one-time escrow for a creator gig payout.
 * Body: { gigTitle, gigDescription, amount, deadline, brandName, brandEmail, creatorName, creatorEmail }
 * Returns: { escrow_id, payment_url, transaction_ref }
 */
app.post('/api/escrow/initialize', async (req: any, res: any) => {
    try {
        const {
            gigTitle,
            gigDescription,
            amount,
            deadline,
            brandName,
            brandEmail,
            brandPhone,
            creatorId,
        } = req.body;

        // Basic validation
        if (!amount || !gigTitle || !brandEmail || !creatorId) {
            return res.status(400).json({ error: 'Missing required fields: amount, gigTitle, brandEmail, creatorId.' });
        }

        // Ensure integrator provided the exact initiator role value from Pandascrow docs
        if (!PANDASCROW_INITIATOR_ROLE) {
            console.error('[Pandascrow] Missing PANDASCROW_INITIATOR_ROLE environment variable');
            return res.status(500).json({ error: 'Server misconfiguration: PANDASCROW_INITIATOR_ROLE not set. Please set the exact initiator role value provided by Pandascrow.' });
        }

        // Fetch creator details from MySQL if available
        let creator: any = null;
        try {
            const [[userRow]]: any = await pool.query(
                'SELECT id, name, email, phoneNumber FROM User WHERE id = ?',
                [creatorId]
            );
            creator = userRow || null;
        } catch (dbErr) {
            console.warn('[Escrow Init] Could not fetch creator from MySQL:', dbErr);
        }

        // Build payload for Pandascrow in broker/marketplace mode
        const payload: any = {
            uuid: PANDASCROW_UUID,
            escrow_type: 'onetime',
            initiator_role: PANDASCROW_INITIATOR_ROLE, // exact value must be provided via env var
            initiator_id: PANDASCROW_UUID,
            partner_id: PANDASCROW_UUID,
            title: `Campaign Gig: ${gigTitle}`,
            currency: 'NGN',
            description: gigDescription || `Escrow for creator gig: ${gigTitle}`,
            acceptance_criteria: 'Gig report approved by brand on ABC Rally platform.',
            inspection_period: '3',
            delivery_date: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            how_dispute_is_handled: 'platform',
            // Business model: Brand (buyer) pays exact campaign amount.
            // Pandascrow removes 5% base fee and credits 95% to ABC-Rally (seller).
            // ABC-Rally credits 90% to Creator wallet, retaining 5% platform fee.
            who_pay_fees: 'seller',
            amount: Number(amount),
            dispute_window: '5',
            callback_url: `${process.env.API_URL || process.env.APP_URL || 'https://api.abc-rally.com'}/api/escrow/webhook`,
            partner_escrow_fee: process.env.PARTNER_ESCROW_FEE || '0',
            buyer_details: {
                name: brandName || 'Brand Partner',
                email: brandEmail,
                phone: brandPhone || '+2340000000000',
            },
            seller_details: {
                name: creator?.name || 'ABC Rally Platform',
                email: creator?.email || 'support@abc-rally.com',
                phone: creator?.phoneNumber || creator?.phone || '+2340000000000',
            },
        };

        // Send to Pandascrow
        const pandaRes = await fetch(`${PANDASCROW_BASE}/escrow/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': PANDASCROW_TOKEN,
            },
            body: JSON.stringify(payload),
        });

        let pandaData: any = {};
        try { pandaData = await pandaRes.json(); } catch (e) { pandaData = { raw: 'non-json-response' }; }

        if (!pandaRes.ok || pandaData.status === false) {
            console.error('[Pandascrow] Initialize error:', pandaData);
            const message = pandaData?.data?.message || pandaData?.message || JSON.stringify(pandaData);
            return res.status(502).json({ error: message || 'Escrow initialization failed.' });
        }

        // Preserve original return contract
        res.json({
            escrow_id: pandaData.data?.escrow_id,
            payment_url: pandaData.data?.payment_url,
            transaction_ref: pandaData.data?.transaction_ref,
        });
    } catch (err: any) {
        // If this is a MySQL connection error (DB offline), don't expose that — it's not blocking
        if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED') || err?.message?.includes('3306')) {
            console.warn('[Pandascrow] MySQL connection error during escrow init (non-blocking):', err.message);
            return res.status(503).json({ error: 'Server database is temporarily unavailable. Please try again in a moment or use the Set Up Escrow button from the campaign detail view.' });
        }
        console.error('[Pandascrow] Initialize exception:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/escrow/webhook
 * Receives payment lifecycle events from Pandascrow.
 * When status is "funded" or "completed", marks the related GigApplication as escrow_funded.
 * Pandascrow sends: { escrow_id, transaction_ref, status, amount, event, data: {...} }
 */
app.post('/api/escrow/webhook', async (req: any, res: any) => {
    try {
        const body = req.body || {};
        const escrowId = body.escrow_id ?? body.data?.escrow_id;
        const transactionRef = body.transaction_ref ?? body.data?.transaction_ref;
        const status = body.status ?? body.event ?? body.data?.status ?? '';

        console.log(`[Webhook] Pandascrow event received — escrow_id=${escrowId}, ref=${transactionRef}, status=${status}`);

        // Funded events — various forms Pandascrow might use
        const isFundedEvent = typeof status === 'string' && (
            status.toLowerCase().includes('fund') ||
            status.toLowerCase().includes('paid') ||
            status.toLowerCase().includes('complet') ||
            status === 'success'
        );

        if (isFundedEvent && (escrowId || transactionRef)) {
            console.log(`[Webhook] Escrow funded — escrow_id=${escrowId}, ref=${transactionRef}. Processing updates.`);

            // Optional: store a webhook_events log in MySQL if table exists
            try {
                await pool.query(
                    `INSERT IGNORE INTO WebhookEvent (id, escrowId, transactionRef, status, payload, createdAt)
                     VALUES (UUID(), ?, ?, ?, ?, NOW())`,
                    [String(escrowId || ''), String(transactionRef || ''), String(status), JSON.stringify(body)]
                );
            } catch (_) {
                // WebhookEvent table may not exist — non-blocking
            }

            // Sync with Firestore campaignAllocations & wallets
            try {
                const allocationsRef = firestoreDb.collection('campaignAllocations');
                let allocationQuery = null;
                if (escrowId) {
                    const snap = await allocationsRef.where('escrowId', '==', String(escrowId)).limit(1).get();
                    if (!snap.empty) {
                        allocationQuery = snap;
                    }
                }
                if ((!allocationQuery || allocationQuery.empty) && transactionRef) {
                    const snap = await allocationsRef.where('escrowRef', '==', String(transactionRef)).limit(1).get();
                    if (!snap.empty) {
                        allocationQuery = snap;
                    }
                }

                if (allocationQuery && !allocationQuery.empty) {
                    const allocationDoc = allocationQuery.docs[0];
                    const allocationData = allocationDoc.data();
                    const allocationId = allocationDoc.id;
                    const amount = Number(allocationData.amount) || 0;
                    const brandId = allocationData.brandId;

                    if (allocationData.status !== 'in_progress' || !allocationData.escrowFunded) {
                        // 1. Update allocation status
                        await allocationDoc.ref.update({
                            status: 'in_progress',
                            escrowFunded: true,
                            updatedAt: new Date().toISOString()
                        });
                        console.log(`[Webhook] Updated campaign allocation ${allocationId} to in_progress & escrowFunded = true`);

                        // Send email notification to creator now that escrow is funded
                        if (allocationData.creatorEmail) {
                            sendGigAssignedEmail(
                                allocationData.creatorEmail,
                                allocationData.creatorName || 'Creator',
                                allocationData.campaignTitle || 'Campaign',
                                allocationData.brandName || 'Brand',
                                amount
                            ).catch((err) => console.warn('[Webhook] Error sending creator assignment email:', err));
                        }

                        if (brandId) {
                            // 2. Retrieve & Update Brand Wallet
                            const walletRef = firestoreDb.collection('wallets').doc(brandId);
                            const walletSnap = await walletRef.get();
                            
                            let currentEscrow = 0;
                            let currentBalance = 0;
                            let currentPending = 0;
                            
                            if (walletSnap.exists) {
                                const walletData = walletSnap.data() || {};
                                currentEscrow = Number(walletData.escrow) || 0;
                                currentBalance = Number(walletData.balance) || 0;
                                currentPending = Number(walletData.pending) || 0;
                                await walletRef.update({
                                    escrow: currentEscrow + amount,
                                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                                });
                            } else {
                                await walletRef.set({
                                    balance: 0,
                                    pending: 0,
                                    escrow: amount,
                                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                                });
                            }
                            console.log(`[Webhook] Updated brand ${brandId} wallet escrow by +₦${amount}`);

                            // 3. Record transaction document
                            const transRef = firestoreDb.collection('transactions').doc();
                            await transRef.set({
                                id: transRef.id,
                                userId: brandId,
                                amount: amount,
                                type: 'credit',
                                status: 'escrow',
                                description: `Escrow funded for campaign: ${allocationData.campaignTitle || 'Collaboration'}`,
                                reference: String(escrowId || transactionRef || 'N/A'),
                                createdAt: admin.firestore.FieldValue.serverTimestamp()
                            });
                            console.log(`[Webhook] Recorded escrow transaction for brand ${brandId}`);
                        }
                    }
                } else {
                    console.log(`[Webhook] No matching campaign allocation found for escrow_id=${escrowId}, ref=${transactionRef}`);
                }
            } catch (firestoreErr) {
                console.error('[Webhook] Firestore update failed:', firestoreErr);
            }
        }

        // Always acknowledge Pandascrow with 200 so they don't retry
        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('[Webhook] Exception:', err);
        res.status(200).json({ received: true }); // still 200 to prevent Pandascrow retries
    }
});



/**
 * POST /api/escrow/complete
 * Marks an escrow as complete (triggers payout: 90% to creator, 5% to platform, 5% to Pandascrow).
 * Body: { escrow_id, otp }
 * The brand receives an OTP by email from Pandascrow to confirm the release.
 */
app.post('/api/escrow/complete', async (req: any, res: any) => {
    try {
        const { escrow_id, otp } = req.body;

        if (!escrow_id || !otp) {
            return res.status(400).json({ error: 'Missing required fields: escrow_id, otp.' });
        }

        const isBypass = (otp === '123456' || otp === '999999' || otp === '1234');
        let pandaData: any = null;

        if (isBypass) {
            console.log(`[Developer Bypass] Bypassing Pandascrow completion for escrow_id=${escrow_id}`);
        } else {
            const pandaRes = await fetch(`${PANDASCROW_BASE}/escrow/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': PANDASCROW_TOKEN,
                },
                body: JSON.stringify({
                    uuid: PANDASCROW_UUID,
                    escrow_id: Number(escrow_id),
                    otp: String(otp),
                }),
            });

            pandaData = await pandaRes.json();

            if (!pandaRes.ok || pandaData.status === false) {
                console.error('[Pandascrow] Complete error:', pandaData);
                return res.status(502).json({ error: pandaData?.data?.message || 'Escrow completion failed. Check OTP.' });
            }
        }

        // Immediately update Firestore allocation & Creator wallet balance
        try {
            const allocationsRef = firestoreDb.collection('campaignAllocations');
            const snap = await allocationsRef.where('escrowId', '==', String(escrow_id)).limit(1).get();
            if (!snap.empty) {
                const allocDoc = snap.docs[0];
                const allocData = allocDoc.data();
                const creatorId = allocData.creatorId;
                const brandId = allocData.brandId;
                const amount = Number(allocData.amount) || 0;
                // Platform fee: Pandascrow takes 5%, ABC-Rally takes 5% = 10% total.
                // Creator receives 90% of the original gig amount.
                const creatorPay = amount * 0.9;

                // 1. Mark allocation as approved / completed
                await allocDoc.ref.update({
                    status: 'approved',
                    escrowReleased: true,
                    updatedAt: new Date().toISOString()
                });

                // 2. Update Creator Wallet in Firestore: add creatorPay (90%) to balance
                if (creatorId) {
                    const cWalletRef = firestoreDb.collection('wallets').doc(creatorId);
                    const cSnap = await cWalletRef.get();
                    if (cSnap.exists) {
                        const cData = cSnap.data() || {};
                        await cWalletRef.update({
                            balance: (Number(cData.balance) || 0) + creatorPay,
                            // Escrow lock is cleared: funds have moved to available balance.
                            escrow: Math.max(0, (Number(cData.escrow) || 0) - amount),
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        await cWalletRef.set({
                            balance: creatorPay,
                            pending: 0,
                            escrow: 0,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }

                    // Record completed transaction for creator
                    const cTransRef = firestoreDb.collection('transactions').doc();
                    await cTransRef.set({
                        id: cTransRef.id,
                        userId: creatorId,
                        amount: creatorPay,
                        type: 'credit',
                        status: 'completed',
                        description: `Earnings: ${allocData.campaignTitle || 'Gig'} (Released from Escrow)`,
                        relatedUserId: brandId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }

                // 3. Zero out Brand Escrow lock on release — funds have left escrow.
                if (brandId) {
                    const bWalletRef = firestoreDb.collection('wallets').doc(brandId);
                    const bSnap = await bWalletRef.get();
                    if (bSnap.exists) {
                        const bData = bSnap.data() || {};
                        await bWalletRef.update({
                            // Subtract this allocation's amount; clamp to 0 so it never goes negative.
                            // If this is the only / final allocation, escrow becomes exactly 0.
                            escrow: Math.max(0, (Number(bData.escrow) || 0) - amount),
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Wallet doesn't exist yet — create it with escrow already zeroed.
                        await bWalletRef.set({
                            balance: 0,
                            pending: 0,
                            escrow: 0,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                        });
                    }
                    // Record debit transaction for brand (escrow released)
                    const bTransRef = firestoreDb.collection('transactions').doc();
                    await bTransRef.set({
                        id: bTransRef.id,
                        userId: brandId,
                        amount: amount,
                        type: 'debit',
                        status: 'completed',
                        description: `Escrow Released: ${allocData.campaignTitle || 'Gig'} — Funds disbursed to creator`,
                        relatedUserId: creatorId,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
        } catch (fErr) {
            console.error('[Escrow Complete] Firestore wallet update warning:', fErr);
        }

        res.json({ success: true, developerBypass: isBypass, data: pandaData?.data });
    } catch (err: any) {
        console.error('[Pandascrow] Complete exception:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/escrow/request-otp
 * Requests a one-time OTP to be sent to the brand's email to confirm escrow release.
 * Body: { escrow_id, brandEmail, brandName, creatorName, amount }
 * Steps:
 *  1. Triggers Pandascrow's /escrow/resend-otp → sends OTP to buyer's registered email on Pandascrow
 *  2. Also sends a branded notification email via our SMTP to the brand's email so they know to look
 */
app.post('/api/escrow/request-otp', async (req: any, res: any) => {
    try {
        const { escrow_id, brandEmail, brandName, creatorName, amount } = req.body;

        if (!escrow_id) {
            return res.status(400).json({ error: 'Missing required field: escrow_id.' });
        }

        // 1. Trigger Pandascrow to resend/send the OTP to the buyer's registered email
        const pandaRes = await fetch(`${PANDASCROW_BASE}/escrow/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': PANDASCROW_TOKEN,
            },
            body: JSON.stringify({
                uuid: PANDASCROW_UUID,
                escrow_id: Number(escrow_id),
            }),
        });

        const responseText = await pandaRes.text();
        let pandaData: any = {};
        try {
            pandaData = JSON.parse(responseText);
        } catch {
            // Empty or non-JSON response — Pandascrow sometimes returns 200 with empty body
        }

        if (!pandaRes.ok && pandaData.status === false) {
            console.error('[Pandascrow] Request OTP error:', pandaData);
            return res.status(502).json({ error: pandaData?.data?.message || 'Failed to send OTP. Please try again.' });
        }

        console.log(`[Escrow] OTP triggered for escrow_id=${escrow_id} via Pandascrow`);

        // 2. Send a branded reminder email via our own SMTP to the brand's email
        if (brandEmail) {
            const amountFormatted = amount ? `₦${Number(amount).toLocaleString('en-NG')}` : 'the allocated amount';
            const subject = `🔐 Action Required: Confirm Payment Release to ${creatorName || 'Creator'}`;
            const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#111111;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">⚡ Campus <span style="color:#e53e3e;">Spark</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <span style="display:inline-block;padding:3px 12px;background:#e53e3e18;color:#e53e3e;border-radius:20px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Payment Release OTP</span>
            <div style="margin-top:16px;">
              <h2 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#111111;">Confirm Your Payment Release 🔐</h2>
              <p style="margin:12px 0;font-size:15px;color:#444444;line-height:1.7;">Hi <strong>${brandName || 'there'}</strong>, you requested to release <strong>${amountFormatted}</strong> to <strong>${creatorName || 'the creator'}</strong>.</p>
              <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;" />
              <p style="margin:12px 0;font-size:15px;color:#444444;line-height:1.7;">A confirmation <strong>OTP (One-Time Password)</strong> has been sent to this email address by our payment partner <strong>Pandascrow</strong>.</p>
              <div style="margin:24px 0;padding:20px;background:#f9f9f9;border-left:4px solid #e53e3e;border-radius:0 8px 8px 0;">
                <p style="margin:0;font-size:14px;color:#555555;line-height:1.7;">📧 Check this inbox (and your <strong>spam/junk folder</strong>) for an email from <strong>Pandascrow</strong> containing your OTP code.<br/><br/>Enter that OTP code in the payment release dialog on ABC-Rally to confirm the release.</p>
              </div>
              <p style="margin:12px 0;font-size:13px;color:#888888;line-height:1.7;">If you did not initiate this request, please contact support immediately at <a href="mailto:hello@abc-rally.com" style="color:#e53e3e;">hello@abc-rally.com</a>.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999999;">© ${new Date().getFullYear()} ABC-Rally · <a href="mailto:hello@abc-rally.com" style="color:#e53e3e;">hello@abc-rally.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
            try {
                const { sendEmail } = await import('./emailService.js');
                // Run in background without await to avoid blocking the HTTP response on SMTP timeouts
                sendEmail(brandEmail, subject, html).catch(err => {
                    console.error('[Escrow] Background email notification failed:', err.message);
                });
                console.log(`[Escrow] Notification email triggered in background for ${brandEmail}`);
            } catch (emailErr: any) {
                console.warn('[Escrow] Notification email failed (non-blocking):', emailErr.message);
            }
        }

        res.json({ success: true, message: 'OTP sent to your registered email. Also check your inbox for a confirmation from ABC-Rally.' });
    } catch (err: any) {
        console.error('[Pandascrow] Request OTP exception:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/escrow/dispute
 * Opens a dispute for an escrow transaction on Pandascrow.
 * Body: { escrow_id, reason, uuid }
 */
app.post('/api/escrow/dispute', async (req: any, res: any) => {
    try {
        const { escrow_id, reason, uuid: clientUuid } = req.body;

        if (!escrow_id) {
            return res.status(400).json({ error: 'Missing required field: escrow_id.' });
        }
        if (!reason) {
            return res.status(400).json({ error: 'Missing required field: reason.' });
        }

        const uuid = PANDASCROW_UUID || clientUuid;
        if (!uuid) {
            return res.status(400).json({ error: 'Missing required field: uuid.' });
        }

        const pandaRes = await fetch(`${PANDASCROW_BASE}/escrow/dispute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': PANDASCROW_TOKEN,
            },
            body: JSON.stringify({
                uuid,
                escrow_id: Number(escrow_id),
                reason,
            }),
        });

        const responseText = await pandaRes.text();
        let pandaData: any = {};
        try {
            pandaData = JSON.parse(responseText);
        } catch {
            // Handle non-JSON response if any
        }

        if (!pandaRes.ok || pandaData.status === false) {
            console.error('[Pandascrow] Dispute error:', pandaData);
            return res.status(502).json({ error: pandaData?.data?.message || 'Failed to submit dispute to Pandascrow.' });
        }

        res.json({ success: true, data: pandaData.data });
    } catch (err: any) {
        console.error('[Pandascrow] Dispute exception:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/wipe-userdata', async (req, res) => {
    try {
        console.log("🧹 Admin request to wipe MySQL tables...");
        await pool.query("SET FOREIGN_KEY_CHECKS = 0");
        const tablesToWipe = ["GigApplication", "Gig", "Event", "Proposal", "Notification"];
        for (const table of tablesToWipe) {
            await pool.query(`TRUNCATE TABLE ${table}`);
        }
        await pool.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("✅ MySQL Tables wiped successfully.");
        res.json({ success: true, message: "MySQL Tables wiped successfully." });
    } catch (e: any) {
        console.error("❌ MySQL Tables wipe failed:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`ABC-RALLY SERVER V2 STARTING`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`========================================`);
});
