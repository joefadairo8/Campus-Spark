import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    let output = '';
    output += '--- USERS ---\n';
    const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
    output += JSON.stringify(users, null, 2) + '\n';

    output += '\n--- PROPOSALS ---\n';
    try {
        const proposals = await prisma.proposal.findMany({
            include: {
                sender: { select: { email: true } },
                recipient: { select: { email: true } }
            }
        });

        if (proposals.length === 0) {
            output += "No proposals found in DB.\n";
        } else {
            proposals.forEach(p => {
                output += `ID: ${p.id} | Sender: ${p.sender.email} -> Recipient: ${p.recipient.email} | Status: ${p.status} | Budget: ${p.budget}\n`;
            });
        }
    } catch (e: any) {
        output += `Error fetching proposals: ${e.message}\n`;
    }

    fs.writeFileSync('proposals_dump.txt', output);
    console.log('Dumped to proposals_dump.txt');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
