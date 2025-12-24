// Quick test to see what Prisma returns
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const events = await prisma.event.findMany({ take: 1 });
  console.log('Event fields:', Object.keys(events[0] || {}));
  if (events[0]) {
    console.log('cardDesignImageUrl:', events[0].cardDesignImageUrl);
    console.log('cardTemplateConfig:', events[0].cardTemplateConfig ? 'exists' : 'null');
  }
  await prisma.$disconnect();
}
test();
