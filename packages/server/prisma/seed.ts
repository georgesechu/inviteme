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

  // Create sample card designs with free stock images from Unsplash
  // Using high-quality wedding/stationery themed images
  const designs = [
    {
      id: 'elegant-gold',
      name: 'Elegant Gold',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'romantic-floral',
      name: 'Romantic Floral',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'classic-elegance',
      name: 'Classic Elegance',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'modern-minimalist',
      name: 'Modern Minimalist',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'vintage-romance',
      name: 'Vintage Romance',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'beach-wedding',
      name: 'Beach Wedding',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=1800&fit=crop&q=90',
    },
    {
      id: 'garden-party',
      name: 'Garden Party',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=400&h=600&fit=crop&q=80',
      templateUrl: 'https://images.unsplash.com/photo-1515378791036-0648a814c963?w=1200&h=1800&fit=crop&q=90',
    },
  ];

  for (const designData of designs) {
    const design = await prisma.cardDesign.upsert({
      where: { id: designData.id },
      update: {},
      create: designData,
    });
    console.log(`✅ Created card design: ${design.name} (${design.id})`);
  }

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

