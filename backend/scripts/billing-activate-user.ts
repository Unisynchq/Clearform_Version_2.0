/**
 * Manually activate pilot_35 for a user by email (support / founder testing).
 * Usage:
 *   bun run billing:activate-user user@example.com
 *   bun run billing:activate-user user@example.com pay_xxxxxxxxxxxx
 */
import 'dotenv/config';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const email = process.argv[2];
const paymentId = process.argv[3]?.trim();
if (!email) {
  console.error('Usage: bun run billing:activate-user <email> [razorpay_payment_id]');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 90);

  if (paymentId) {
    const purchase = await prisma.pilotPurchase.findUnique({
      where: { razorpayPaymentId: paymentId },
    });
    if (purchase) {
      await prisma.pilotPurchase.update({
        where: { id: purchase.id },
        data: {
          userId: user.id,
          claimedAt: new Date(),
          email: user.email.toLowerCase(),
        },
      });
    } else {
      await prisma.pilotPurchase.create({
        data: {
          razorpayPaymentId: paymentId,
          email: user.email.toLowerCase(),
          amountPaise: 3499,
          currency: 'USD',
          status: 'captured',
          planId: 'pilot_35',
          purchasedAt: periodStart,
          expiresAt: periodEnd,
          userId: user.id,
          claimedAt: new Date(),
        },
      });
    }
  }

  const sub = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      planId: 'pilot_35',
      razorpayPaymentId: paymentId ?? null,
      status: SubscriptionStatus.ACTIVE,
      responsesLimit: 300,
      responsesUsed: 0,
      periodStart,
      periodEnd,
    },
    update: {
      planId: 'pilot_35',
      razorpayPaymentId: paymentId ?? undefined,
      status: SubscriptionStatus.ACTIVE,
      responsesLimit: 300,
      periodStart,
      periodEnd,
    },
  });
  console.log('Activated pilot_35 for', email, 'subscription', sub.id);
  if (paymentId) console.log('Linked payment', paymentId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
