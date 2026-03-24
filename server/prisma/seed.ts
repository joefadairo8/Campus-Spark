import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // Create some Gigs
    const gig1 = await prisma.gig.create({
        data: {
            title: 'Campus Ambassador Program',
            description: 'Represent Spark on your campus and earn rewards for every new user you sign up.',
            reward: 50000,
            brand: 'Flutterwave',
            status: 'open',
        },
    });

    const gig2 = await prisma.gig.create({
        data: {
            title: 'Social Media Influencer',
            description: 'Create engaging content about our new app and share it with your followers.',
            reward: 25000,
            brand: 'PiggyVest',
            status: 'open',
        },
    });

    const gig3 = await prisma.gig.create({
        data: {
            title: 'Event Photographer',
            description: 'Capture high-quality photos for our upcoming campus concert.',
            reward: 35000,
            brand: 'MTN Nigeria',
            status: 'open',
        },
    });

    console.log({ gig1, gig2, gig3 });
    console.log('Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
