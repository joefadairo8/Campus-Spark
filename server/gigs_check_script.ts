
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    try {
        const gigs = await prisma.gig.findMany();
        const output = JSON.stringify(gigs, null, 2);
        fs.writeFileSync('gigs_check.json', output);
        console.log('Done');
    } catch (e) {
        fs.writeFileSync('gigs_check.json', 'Error: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
