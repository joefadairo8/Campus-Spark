console.log('!!! SAFE SERVER STARTING !!!');
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = 5123;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', source: 'server_safe.ts', time: new Date().toISOString() });
});

app.get('/api/gigs', async (req, res) => {
    const { studentId, status, brand } = req.query;
    try {
        const whereClause: any = {};
        if (studentId) whereClause.studentId = studentId;
        if (status) whereClause.status = status;
        if (brand) whereClause.brand = brand;

        if (!status && !studentId && !brand) whereClause.status = 'open';

        const gigs = await prisma.gig.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        res.json(gigs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`SAFE Server is running on port ${PORT}`);
});
