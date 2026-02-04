// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPlain = 'admin1234';
  const organizerPlain = 'organizer1234';

  const adminPassword = await bcrypt.hash(adminPlain, 12);
  const organizerPassword = await bcrypt.hash(organizerPlain, 12);

  await prisma.user.upsert({
    where: { email: 'kimutaironald48@gmail.com' },
    update: { password: adminPassword, name: 'System Admin', role: 'ADMIN' },
    create: { email: 'kimutaironald48@gmail.com', password: adminPassword, name: 'System Admin', role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'organizer@nairobilb.com' },
    update: { password: organizerPassword, name: 'Event Organizer', role: 'ORGANIZER' },
    create: { email: 'organizer@nairobilb.com', password: organizerPassword, name: 'Event Organizer', role: 'ORGANIZER' },
  });

  console.log('Seed completed: admin and organizer ensured.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
