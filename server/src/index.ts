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
    const { status } = req.body;
    try {
        await pool.query('UPDATE Proposal SET status = ? WHERE id = ?', [status, req.params.id]);
        
        const [[proposal]]: any = await pool.query(`
            SELECT p.*, 
                   s.id as senderId, s.name as senderName, s.email as senderEmail,
                   r.id as recipientId, r.name as recipientName, r.email as recipientEmail
            FROM Proposal p
            JOIN User s ON p.senderId = s.id
            JOIN User r ON p.recipientId = r.id
            WHERE p.id = ?
        `, [req.params.id]);
        
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
        res.status(201).json(application);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/gigs/:id/applications', authenticateToken, async (req: any, res) => {
    try {
        const [applications] = await pool.query(`
            SELECT a.*, 
                   u.id as studentId, u.name as studentName, u.email as studentEmail, u.imageUrl as studentImageUrl, u.university as studentUniversity, u.bio as studentBio
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

        res.json({ message: 'Report rejected. Student has been notified to revise.', gig: updatedGig });
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

app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`CAMPUS SPARK SERVER V2 STARTING`);
    console.log(`Port: ${PORT}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`========================================`);
});
