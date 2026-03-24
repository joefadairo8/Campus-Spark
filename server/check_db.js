import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const gigs = await prisma.gig.findMany();
    console.log('Gigs found:', JSON.stringify(gigs, null, 2));
}
main();
