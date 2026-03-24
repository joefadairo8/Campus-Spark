
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to create a test gig...');
        const gig = await prisma.gig.create({
            data: {
                title: 'Test Create',
                description: 'Test Description',
                reward: 100,
                brand: 'Test Brand',
                status: 'open'
            }
        });
        console.log('Successfully created gig:', gig);
    } catch (error) {
        console.error('Prisma Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
