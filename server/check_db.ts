
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        take: 20,
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });
    console.log('--- Users in Database ---');
    console.table(users);

    const distinctRoles = await prisma.user.groupBy({
        by: ['role'],
        _count: {
            id: true
        }
    });
    console.log('--- Roles Distribution ---');
    console.table(distinctRoles);

    const gigs = await prisma.gig.findMany({
        take: 20
    });
    console.log('--- Gigs in Database ---');
    console.table(gigs);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
