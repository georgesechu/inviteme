/**
 * Script to update user message credits
 * Usage: tsx scripts/updateCredits.ts <phoneNumber> <credits>
 */
import { prisma } from '../src/config/database';

async function updateCredits(phoneNumber: string, credits: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      console.error(`User with phone number ${phoneNumber} not found`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { phoneNumber },
      data: { messageCredits: credits },
    });

    console.log(`Updated user ${updated.phoneNumber} credits to ${updated.messageCredits}`);
  } catch (error) {
    console.error('Error updating credits:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const phoneNumber = process.argv[2];
const credits = parseInt(process.argv[3], 10);

if (!phoneNumber || isNaN(credits)) {
  console.error('Usage: tsx scripts/updateCredits.ts <phoneNumber> <credits>');
  console.error('Example: tsx scripts/updateCredits.ts +255712345678 5');
  process.exit(1);
}

updateCredits(phoneNumber, credits);

