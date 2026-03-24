
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    console.log('Attempting Prisma connection...');
    try {
        await prisma.$connect();
        console.log('Connected successfully!');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('User found:', users.length > 0 ? users[0].name : 'None');
    } catch (e) {
        console.error('Prisma connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
