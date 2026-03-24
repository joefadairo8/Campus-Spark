
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Gig Table Info ---');
    try {
        const info = await prisma.$queryRawUnsafe(`PRAGMA table_info(Gig);`);
        console.log('Table structure:');
        console.table(info);
    } catch (e) {
        console.error('Error checking schema:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
