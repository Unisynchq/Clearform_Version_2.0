import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionSource, SubscriptionStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { PromoCodeService } from './promo-code.service';

function makeSubscription(overrides: Partial<Record<string, unknown>> = {}) {
  // Relative dates: fixed timestamps rot once the calendar passes them.
  const periodStart = new Date();
  const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: 'sub-1',
    userId: 'user-1',
    planId: 'pilot_35',
    razorpaySubId: null,
    razorpayPaymentId: null,
    status: SubscriptionStatus.ACTIVE,
    responsesUsed: 0,
    responsesLimit: 300,
    periodStart,
    periodEnd,
    source: SubscriptionSource.PROMO,
    createdAt: periodStart,
    updatedAt: periodStart,
    ...overrides,
  };
}

function makePrismaMock(overrides: Record<string, unknown> = {}) {
  return {
    subscription: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    promoRedemption: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    form: { count: jest.fn().mockResolvedValue(0) },
    workspace: { count: jest.fn().mockResolvedValue(0) },
    $transaction: jest.fn(),
    ...overrides,
  } as unknown as PrismaService;
}

function makeAiEntitlementsMock() {
  return {
    resetAiTokenWallet: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PromoCodeService.redeem', () => {
  it('grants a 7-day pilot trial with source PROMO for a fresh free user', async () => {
    const createdSub = makeSubscription();
    const tx = {
      promoCode: {
        findUnique: jest.fn().mockResolvedValue({ id: 'promo-1', code: 'TESTCODE1', active: true }),
        update: jest.fn().mockResolvedValue({ id: 'promo-1', code: 'TESTCODE1', active: true, redemptionCount: 1 }),
      },
      subscription: { upsert: jest.fn().mockResolvedValue(createdSub) },
      promoRedemption: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = makePrismaMock({
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    });

    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);
    const result = await service.redeem('user-1', ' testcode1 ');

    expect(tx.promoCode.findUnique).toHaveBeenCalledWith({ where: { code: 'TESTCODE1' } });
    expect(tx.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        create: expect.objectContaining({
          planId: 'pilot_35',
          source: SubscriptionSource.PROMO,
          responsesLimit: 300,
        }),
        update: expect.objectContaining({ source: SubscriptionSource.PROMO }),
      }),
    );
    expect(tx.promoRedemption.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ promoCodeId: 'promo-1', userId: 'user-1' }),
    });
    expect(tx.promoCode.update).toHaveBeenCalledWith({
      where: { id: 'promo-1' },
      data: { redemptionCount: { increment: 1 } },
    });

    // Same feature set as a paid pilot: aiTier flips to 'pro', pilot features included.
    expect(result.planId).toBe('pilot_35');
    expect(result.aiTier).toBe('pro');
    expect(result.source).toBe(SubscriptionSource.PROMO);
    expect(result.trialDays).toBe(7);

    const upsertArgs = tx.subscription.upsert.mock.calls[0][0];
    const grantedMs = upsertArgs.create.periodEnd.getTime() - upsertArgs.create.periodStart.getTime();
    expect(Math.round(grantedMs / (24 * 60 * 60 * 1000))).toBe(7);
  });

  it('uses the code-specific durationDays when set (partner codes)', async () => {
    const createdSub = makeSubscription({
      periodEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });
    const tx = {
      promoCode: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'promo-2', code: 'PARTNER1', active: true, durationDays: 60 }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscription: { upsert: jest.fn().mockResolvedValue(createdSub) },
      promoRedemption: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = makePrismaMock({
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    });

    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);
    const result = await service.redeem('user-1', 'PARTNER1');

    expect(result.trialDays).toBe(60);
    const upsertArgs = tx.subscription.upsert.mock.calls[0][0];
    const grantedMs = upsertArgs.create.periodEnd.getTime() - upsertArgs.create.periodStart.getTime();
    expect(Math.round(grantedMs / (24 * 60 * 60 * 1000))).toBe(60);
  });

  it('rejects an unknown or inactive code', async () => {
    const tx = {
      promoCode: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const prisma = makePrismaMock({
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    });
    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);

    await expect(service.redeem('user-1', 'NOPE')).rejects.toThrow(NotFoundException);
  });

  it('rejects a user who already redeemed a promo code', async () => {
    const prisma = makePrismaMock({
      promoRedemption: {
        findUnique: jest.fn().mockResolvedValue({ id: 'redemption-1', userId: 'user-1' }),
      },
    });
    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);

    await expect(service.redeem('user-1', 'TESTCODE1')).rejects.toThrow(BadRequestException);
    await expect(service.redeem('user-1', 'TESTCODE1')).rejects.toThrow(
      "You've already used a promo code on this account.",
    );
  });

  it('rejects a user who already has an active paid (RAZORPAY) pilot plan', async () => {
    const activePaidSub = makeSubscription({ source: SubscriptionSource.RAZORPAY });
    const prisma = makePrismaMock({
      subscription: { findUnique: jest.fn().mockResolvedValue(activePaidSub) },
    });
    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);

    await expect(service.redeem('user-1', 'TESTCODE1')).rejects.toThrow(
      'You already have an active pilot plan.',
    );
  });

  it('does not block a user whose paid pilot has already expired', async () => {
    const expiredPaidSub = makeSubscription({
      source: SubscriptionSource.RAZORPAY,
      periodEnd: new Date('2020-01-01T00:00:00.000Z'),
    });
    const createdSub = makeSubscription();
    const tx = {
      promoCode: {
        findUnique: jest.fn().mockResolvedValue({ id: 'promo-1', code: 'TESTCODE1', active: true }),
        update: jest.fn().mockResolvedValue({ id: 'promo-1', code: 'TESTCODE1', active: true, redemptionCount: 1 }),
      },
      subscription: { upsert: jest.fn().mockResolvedValue(createdSub) },
      promoRedemption: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = makePrismaMock({
      subscription: { findUnique: jest.fn().mockResolvedValue(expiredPaidSub) },
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    });
    const service = new PromoCodeService(prisma, makeAiEntitlementsMock() as any);

    await expect(service.redeem('user-1', 'TESTCODE1')).resolves.toBeDefined();
  });
});
