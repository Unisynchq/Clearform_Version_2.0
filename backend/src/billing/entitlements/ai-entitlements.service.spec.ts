import { ForbiddenException } from '@nestjs/common';
import { AiEntitlementsService } from './ai-entitlements.service';
import { FREE_PLAN, PILOT_35_PLAN } from '../../config/plans';

describe('AiEntitlementsService', () => {
  const userId = 'owner-1';
  const formId = 'form-1';

  const prisma = {
    aiUsage: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    aiCreditLedger: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (ops: unknown) => ops),
  };
  const entitlements = { getPlanForUser: jest.fn() };
  const redis = {
    sadd: jest.fn(),
    sismember: jest.fn(),
    expire: jest.fn().mockResolvedValue(1),
  };

  let service: AiEntitlementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    redis.expire.mockResolvedValue(1);
    service = new AiEntitlementsService(
      prisma as never,
      entitlements as never,
      redis as never,
    );
  });

  describe('checkAndConsumeLogicGeneration', () => {
    it('passes through for unlimited plans', async () => {
      entitlements.getPlanForUser.mockResolvedValue(PILOT_35_PLAN);
      await service.checkAndConsumeLogicGeneration(userId);
      expect(prisma.aiUsage.updateMany).not.toHaveBeenCalled();
    });

    it('consumes atomically while under the limit', async () => {
      entitlements.getPlanForUser.mockResolvedValue(FREE_PLAN);
      prisma.aiUsage.updateMany.mockResolvedValue({ count: 1 });
      await service.checkAndConsumeLogicGeneration(userId);
      expect(prisma.aiUsage.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          logicGenerationsUsed: { lt: FREE_PLAN.ai.logicGenerationsTotal },
        },
        data: { logicGenerationsUsed: { increment: 1 } },
      });
    });

    it('throws UPGRADE_REQUIRED when the quota is spent', async () => {
      entitlements.getPlanForUser.mockResolvedValue(FREE_PLAN);
      prisma.aiUsage.updateMany.mockResolvedValue({ count: 0 });
      const err = await service
        .checkAndConsumeLogicGeneration(userId)
        .catch((e: ForbiddenException) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      const body = (err as ForbiddenException).getResponse() as Record<
        string,
        unknown
      >;
      expect(body.code).toBe('UPGRADE_REQUIRED');
      expect(body.feature).toBe('ai_logic');
      expect(body.quota).toEqual({
        used: FREE_PLAN.ai.logicGenerationsTotal,
        limit: FREE_PLAN.ai.logicGenerationsTotal,
        period: 'lifetime',
      });
    });
  });

  describe('resolveQualityAiAccess', () => {
    const cappedFree = {
      ...FREE_PLAN,
      ai: { ...FREE_PLAN.ai, qualityTrialSessions: 5 },
    };

    it('returns full for paid plans without touching counters', async () => {
      entitlements.getPlanForUser.mockResolvedValue(PILOT_35_PLAN);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('full');
      expect(prisma.aiUsage.findUnique).not.toHaveBeenCalled();
    });

    it('returns full when free plan has no quality session cap (credit wallet only)', async () => {
      entitlements.getPlanForUser.mockResolvedValue(FREE_PLAN);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('full');
      expect(prisma.aiUsage.findUnique).not.toHaveBeenCalled();
    });

    it('counts a new session once and grants trial', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({ qualitySessionsUsed: 4 });
      redis.sadd.mockResolvedValue(1);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('trial');
      expect(redis.sadd).toHaveBeenCalledWith(
        `ai:trial:qsessions:${userId}`,
        `${formId}:session-abc-123`,
      );
      expect(prisma.aiUsage.update).toHaveBeenCalledWith({
        where: { userId },
        data: { qualitySessionsUsed: { increment: 1 } },
      });
    });

    it('does not double-count a session already seen', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({ qualitySessionsUsed: 4 });
      redis.sadd.mockResolvedValue(0);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('trial');
      expect(prisma.aiUsage.update).not.toHaveBeenCalled();
    });

    it('degrades new sessions to rules-only once exhausted', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({
        qualitySessionsUsed: cappedFree.ai.qualityTrialSessions,
      });
      redis.sismember.mockResolvedValue(0);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-new-999'),
      ).resolves.toBe('rules-only');
      expect(redis.sadd).not.toHaveBeenCalled();
    });

    it('assertQualityAiAccess throws UPGRADE_REQUIRED when exhausted', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({
        qualitySessionsUsed: cappedFree.ai.qualityTrialSessions,
      });
      redis.sismember.mockResolvedValue(0);
      const err = await service
        .assertQualityAiAccess(userId, formId, 'session-new-999', 'peek')
        .catch((e: ForbiddenException) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      const body = (err as ForbiddenException).getResponse() as Record<
        string,
        unknown
      >;
      expect(body.code).toBe('UPGRADE_REQUIRED');
      expect(body.feature).toBe('ai_quality');
    });

    it('keeps AI for in-flight sessions that started inside the trial', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({
        qualitySessionsUsed: cappedFree.ai.qualityTrialSessions,
      });
      redis.sismember.mockResolvedValue(1);
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('trial');
    });

    it('fails open when Redis is down mid-trial', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({ qualitySessionsUsed: 1 });
      redis.sadd.mockRejectedValue(new Error('redis down'));
      await expect(
        service.resolveQualityAiAccess(userId, formId, 'session-abc-123'),
      ).resolves.toBe('trial');
    });

    it('requires sessionId before granting trial AI under quota', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({ qualitySessionsUsed: 1 });
      await expect(
        service.resolveQualityAiAccess(userId, formId, undefined),
      ).resolves.toBe('rules-only');
      expect(redis.sadd).not.toHaveBeenCalled();
    });

    it('peek mirrors trial vs exhausted without consuming', async () => {
      entitlements.getPlanForUser.mockResolvedValue(cappedFree);
      prisma.aiUsage.findUnique.mockResolvedValue({ qualitySessionsUsed: 2 });
      await expect(service.peekQualityAiAccess(userId, formId)).resolves.toBe(
        'trial',
      );
      expect(redis.sadd).not.toHaveBeenCalled();

      prisma.aiUsage.findUnique.mockResolvedValue({
        qualitySessionsUsed: cappedFree.ai.qualityTrialSessions,
      });
      await expect(service.peekQualityAiAccess(userId, formId)).resolves.toBe(
        'rules-only',
      );
    });
  });

  describe('AI credit wallet', () => {
    it('returns finite used/limit/remaining for free plan', async () => {
      entitlements.getPlanForUser.mockResolvedValue(FREE_PLAN);
      prisma.aiUsage.findUnique.mockResolvedValue({
        aiCreditsUsed: 10,
        aiCreditsPeriodStart: new Date(),
      });
      prisma.aiUsage.upsert.mockResolvedValue({});
      const balance = await service.getAiCreditUsage(userId);
      expect(balance.used).toBe(10);
      expect(balance.limit).toBe(FREE_PLAN.ai.aiCreditsLimit);
      expect(balance.remaining).toBe(FREE_PLAN.ai.aiCreditsLimit - 10);
      expect(balance.periodLabel).toBe('This month');
    });

    it('throws UPGRADE_REQUIRED when credits cannot cover cost', async () => {
      entitlements.getPlanForUser.mockResolvedValue(FREE_PLAN);
      prisma.aiUsage.findUnique.mockResolvedValue({
        aiCreditsUsed: FREE_PLAN.ai.aiCreditsLimit,
        aiCreditsPeriodStart: new Date(),
      });
      prisma.aiUsage.upsert.mockResolvedValue({});
      await expect(
        service.assertAiCreditsAvailable(userId, 1),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('ignores non-positive debit amounts', async () => {
      await service.debitAiCredits(userId, 0, { action: 'quality_evaluate' });
      await service.debitAiCredits(userId, -5, { action: 'quality_evaluate' });
      expect(prisma.aiUsage.update).not.toHaveBeenCalled();
    });

    it('debits a positive integer credit count with ledger row', async () => {
      prisma.aiUsage.upsert.mockResolvedValue({});
      prisma.aiUsage.update.mockResolvedValue({});
      prisma.aiCreditLedger.create.mockResolvedValue({});
      await service.debitAiCredits(userId, 2, {
        action: 'improve_instructions',
        formId: 'form-1',
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
