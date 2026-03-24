import { PrismaClient } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function promoteUser(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'Admin' },
        });
        console.log(`User ${user.name} (${user.email}) promoted to Admin successfully!`);
    } catch (error: any) {
        console.error('Error promoting user:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];

if (!email) {
    console.log('Usage: npx tsx promote_user.ts <email>');
    process.exit(1);
}

promoteUser(email);
