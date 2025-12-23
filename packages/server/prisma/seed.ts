/**
 * Seed script for development
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { phoneNumber: '+255712345678' },
    update: {},
    create: {
      phoneNumber: '+255712345678',
    },
  });

  console.log('✅ Created test user:', user.id);

  // Create a sample event for the user
  const event = await prisma.event.upsert({
    where: { id: 'sample-event' },
    update: {},
    create: {
      id: 'sample-event',
      userId: user.id,
      name: 'Sample Wedding',
      location: 'Dar es Salaam',
    },
  });

  console.log('✅ Created sample event:', event.id);

  // Create a test card design
  const cardDesign = await prisma.cardDesign.upsert({
    where: { id: 'default-design' },
    update: {},
    create: {
      id: 'default-design',
      name: 'Default Wedding Invitation',
      thumbnailUrl: '/designs/default-thumbnail.png',
      templateUrl: '/designs/default-template.png',
    },
  });

  console.log('✅ Created card design:', cardDesign.id);

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

