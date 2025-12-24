/**
 * Script to set different statuses on guests for testing UI
 * Usage: tsx scripts/testStatuses.ts
 */
import { prisma } from '../src/config/database';

async function testStatuses() {
  try {
    // Get all guests
    const guests = await prisma.guest.findMany({
      take: 8, // Get first 8 guests
      orderBy: { createdAt: 'desc' },
    });

    if (guests.length === 0) {
      console.log('No guests found');
      return;
    }

    const statuses: Array<'pending' | 'sent' | 'delivered' | 'read' | 'failed'> = [
      'pending',
      'sent',
      'delivered',
      'read',
      'failed',
      'sent',
      'delivered',
      'read',
    ];

    console.log(`Updating ${guests.length} guests with test statuses...\n`);

    for (let i = 0; i < guests.length && i < statuses.length; i++) {
      const guest = guests[i];
      const status = statuses[i];
      const now = new Date();

      const updateData: any = {
        sendStatus: status,
      };

      // Set appropriate timestamps
      if (status === 'sent' || status === 'delivered' || status === 'read') {
        updateData.lastSentAt = new Date(now.getTime() - (i + 1) * 60000); // Stagger timestamps
      }
      if (status === 'delivered' || status === 'read') {
        updateData.lastDeliveredAt = new Date(now.getTime() - (i + 1) * 30000);
      }
      if (status === 'read') {
        updateData.lastReadAt = new Date(now.getTime() - (i + 1) * 10000);
      }

      await prisma.guest.update({
        where: { id: guest.id },
        data: updateData,
      });

      console.log(`✓ ${guest.name} → ${status}`);
    }

    console.log('\n✅ Status updates complete!');
    console.log('\nStatus distribution:');
    const counts = await prisma.guest.groupBy({
      by: ['sendStatus'],
      _count: true,
    });
    counts.forEach(({ sendStatus, _count }) => {
      console.log(`  ${sendStatus || 'null'}: ${_count}`);
    });
  } catch (error) {
    console.error('Error updating statuses:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testStatuses();

