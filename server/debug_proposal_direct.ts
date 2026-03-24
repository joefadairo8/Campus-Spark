import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting debug script...');
    try {
        // 1. Check DB connection
        console.log('Connecting to DB...');
        await prisma.$connect();
        console.log('Connected.');

        // 2. Get 2 users
        const users = await prisma.user.findMany({ take: 2 });
        console.log(`Found ${users.length} users.`);
        if (users.length < 2) {
            console.error('Not enough users.');
            return;
        }

        const sender = users[0];
        const recipient = users[1];

        // 3. Create Proposal directly (simulating backend logic)
        console.log('Creating proposal directly via Prisma...');
        const proposal = await prisma.proposal.create({
            data: {
                senderId: sender.id,
                recipientId: recipient.id,
                message: "Debug proposal direct test",
                budget: "1000",
                timeline: "1 week",
                status: 'pending'
            }
        });
        console.log('Proposal created:', proposal.id);

        // 4. Verify fetch
        const fetched = await prisma.proposal.findUnique({ where: { id: proposal.id } });
        console.log('Fetched proposal:', fetched);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
