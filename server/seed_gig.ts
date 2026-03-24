
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Gigs ---');
    try {
        const gig = await prisma.gig.create({
            data: {
                title: 'Summer Campus Ambassador',
                description: 'Join our team to promote sustainable fashion on campus! You will be responsible for hosting 2 events and creating 4 social media posts.',
                reward: 25000,
                brand: 'EcoVibe App',
                status: 'open'
            }
        });
        console.log('Gig created successfully:', gig);

        const gig2 = await prisma.gig.create({
            data: {
                title: 'Social Media Content Creator',
                description: 'Create 5 engaging TikToks/Reels showcasing our new product. Must be a student at a Nigerian university.',
                reward: 15000,
                brand: 'Spark Gadgets',
                status: 'open'
            }
        });
        console.log('Gig created successfully:', gig2);

    } catch (e) {
        console.error('Error seeding gigs:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
