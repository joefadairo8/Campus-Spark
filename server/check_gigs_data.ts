import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const gigs = await prisma.gig.findMany();
        console.log("Total Gigs:", gigs.length);
        console.log(JSON.stringify(gigs, null, 2));
    } catch (error) {
        console.error("Prisma Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
