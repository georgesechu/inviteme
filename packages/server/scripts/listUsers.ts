/**
 * Script to list all users
 */
import { prisma } from '../src/config/database';

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phoneNumber: true,
        messageCredits: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\nUsers:');
    console.log('='.repeat(80));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.phoneNumber} - Credits: ${user.messageCredits} (ID: ${user.id})`);
    });
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

