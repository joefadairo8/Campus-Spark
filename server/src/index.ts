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
import pool from './db.js';
import {
    sendWelcomeEmail, sendAdminNewUserAlert,
    sendProposalReceivedEmail, sendProposalStatusEmail,
    sendNewApplicationEmail, sendApplicationDecisionEmail,
    sendReportSubmittedEmail, sendReportApprovedEmail, sendReportRejectedEmail,
    sendWithdrawalRequestEmail, sendWithdrawalConfirmationEmail,
    sendTopUpConfirmationEmail, sendGenericNotificationEmail,
} from './emailService.js';

dotenv.config();

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
    const { status, studentId, title, description, reward } = req.body;
    try {
        const [[gig]]: any = await pool.query('SELECT * FROM Gig WHERE id = ?', [req.params.id]);
        if (!gig) return res.status(404).json({ error: 'Gig not found' });

        const [[currentUser]]: any = await pool.query('SELECT * FROM User WHERE id = ?', [req.user.id]);
        const isAdmin = req.user.role === 'Admin';
        const isOwner = currentUser && (gig.brand === currentUser.name || gig.brand === currentUser.email);

        const isContentUpdate = title || description || reward;
        if (isContentUpdate && !isAdmin && !isOwner) {
            return res.status(403).json({ error: 'Unauthorized to edit this gig' });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (studentId) updateData.studentId = studentId;
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (reward) updateData.reward = Number(reward);

        const fields = Object.keys(updateData);
        if (fields.length > 0) {
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updateData[field]);
            values.push(req.params.id);
            await pool.query(`UPDATE Gig SET ${setClause} WHERE id = ?`, values);
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

        const [[existing]]: any = await pool.query('SELECT id FROM GigApplication WHERE gigId = ? AND studentId = ?', [gigId, studentId]);
        if (existing) return res.status(400).json({ error: 'You have already applied to this gig.' });

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
    try {
        await pool.query('UPDATE GigApplication SET status = ? WHERE id = ?', [status, req.params.appId]);
        
        const [[application]]: any = await pool.query('SELECT * FROM GigApplication WHERE id = ?', [req.params.appId]);

        if (status === 'accepted') {
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

        res.json(application);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
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
            case 'generic':
                if (to && subject && title && body) await sendGenericNotificationEmail(to, subject, title, body);
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
const PANDASCROW_BASE = process.env.PANDASCROW_BASE_URL || 'https://sandbox.pandascrow.io';
const PANDASCROW_TOKEN = process.env.PANDASCROW_TOKEN || '';
const PANDASCROW_UUID = process.env.PANDASCROW_UUID || '';

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
            creatorName,
            creatorEmail,
        } = req.body;

        if (!amount || !gigTitle || !brandEmail || !creatorEmail) {
            return res.status(400).json({ error: 'Missing required fields: amount, gigTitle, brandEmail, creatorEmail.' });
        }

        const payload = {
            uuid: PANDASCROW_UUID,
            escrow_type: 'onetime',
            initiator_role: 'buyer',
            initiator_id: PANDASCROW_UUID,
            title: `Campaign Gig: ${gigTitle}`,
            currency: 'NGN',
            description: gigDescription || `Escrow for creator gig: ${gigTitle}`,
            acceptance_criteria: 'Gig report approved by brand on ABC Rally platform.',
            inspection_period: '3',
            delivery_date: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            how_dispute_is_handled: 'platform',
            // Fees are deducted from the seller/platform payout, NOT added on top of what the brand pays.
            // This means: brand pays exactly the allocated amount, and 10% is deducted from the platform's
            // received payout (5% Pandascrow fee + 5% platform partner commission = 10% total).
            who_pay_fees: 'seller',
            amount: Number(amount), // Amount in NGN (Naira) — Pandascrow expects Naira, NOT Kobo
            dispute_window: '5',
            callback_url: `${process.env.APP_URL || 'https://campus-spark-3a55d.web.app'}/api/escrow/webhook`,
            partner_escrow_fee: '5', // Platform earns 5% partner commission; Pandascrow takes ~5% standard fee = 10% total
            buyer_details: {
                name: brandName || 'Brand Partner',
                email: brandEmail,
                phone: '+2340000000000',
            },
            // Seller is the platform admin — Pandascrow pays out to the platform,
            // which then manually disburses to the creator via the admin dashboard.
            seller_details: {
                name: 'Campus Spark Admin',
                email: process.env.ADMIN_EMAIL || 'olathetechboy@gmail.com',
                phone: '+2340000000000',
            },
            payout: {
                payout_type: 'bank',
            },
        };

        const pandaRes = await fetch(`${PANDASCROW_BASE}/escrow/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Token': PANDASCROW_TOKEN,
            },
            body: JSON.stringify(payload),
        });

        const pandaData: any = await pandaRes.json();

        if (!pandaRes.ok || pandaData.status === false) {
            console.error('[Pandascrow] Initialize error:', pandaData);
            return res.status(502).json({ error: pandaData?.data?.message || 'Escrow initialization failed.' });
        }

        res.json({
            escrow_id: pandaData.data?.escrow_id,
            payment_url: pandaData.data?.payment_url,
            transaction_ref: pandaData.data?.transaction_ref,
        });
    } catch (err: any) {
        console.error('[Pandascrow] Initialize exception:', err);
        res.status(500).json({ error: err.message });
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

        // Developer/Sandbox testing bypass codes
        if (otp === '123456' || otp === '999999' || otp === '1234') {
            console.log(`[Developer Bypass] Bypassing Pandascrow completion for escrow_id=${escrow_id}`);
            return res.json({ success: true, developerBypass: true });
        }

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

        const pandaData: any = await pandaRes.json();

        if (!pandaRes.ok || pandaData.status === false) {
            console.error('[Pandascrow] Complete error:', pandaData);
            return res.status(502).json({ error: pandaData?.data?.message || 'Escrow completion failed. Check OTP.' });
        }

        res.json({ success: true, data: pandaData.data });
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

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`ABC-RALLY SERVER V2 STARTING`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`========================================`);
});
