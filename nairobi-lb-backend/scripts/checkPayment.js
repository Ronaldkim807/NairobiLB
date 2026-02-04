// ./scripts/checkPayment.js
import 'dotenv/config';
import prisma from '../utils/database.js';

async function main() {
  const checkoutId = process.argv[2]; // pass checkout id as arg OR none
  if (checkoutId) {
    const p = await prisma.payment.findFirst({ where: { providerRef: checkoutId }, include: { booking: true } });
    console.log(p);
  } else {
    const recent = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { booking: true } });
    console.log(recent);
  }
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
