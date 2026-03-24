
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating test gigs...');
    await prisma.gig.create({
        data: {
            title: 'TEST GIG 1 (OPEN)',
            description: 'This is a test gig created to verify visibility.',
            reward: 1000,
            brand: 'Test Brand',
            status: 'open'
        }
    });
    await prisma.gig.create({
        data: {
            title: 'TEST GIG 2 (OPEN)',
            description: 'Another test gig.',
            reward: 2000,
            brand: 'Test Brand',
            status: 'open'
        }
    });
    console.log('Test gigs created successfully!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
