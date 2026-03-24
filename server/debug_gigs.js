import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();
async function main() {
    try {
        const gigs = await prisma.gig.findMany();
        const output = `Total Gigs: ${gigs.length}\n` + JSON.stringify(gigs, null, 2);
        fs.writeFileSync('gig_debug.log', output);
        console.log('Gig debug log written successfully.');
    } catch (e) {
        fs.writeFileSync('gig_debug.log', 'Error: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
