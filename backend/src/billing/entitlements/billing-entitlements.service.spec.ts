import { ForbiddenException } from '@nestjs/common';
import { BillingEntitlementsService } from './billing-entitlements.service';

describe('BillingEntitlementsService', () => {
  const userId = 'user-1';

  const prisma = {
    subscription: { findUnique: jest.fn() },
    pilotPurchase: { findUnique: jest.fn() },
    workspace: { count: jest.fn(), findMany: jest.fn() },
    form: { count: jest.fn() },
  };

  let service: BillingEntitlementsService;

  const freeContext = () => {
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.pilotPurchase.findUnique.mockResolvedValue(null);
  };

  const pilotContext = () => {
    const future = new Date(Date.now() + 86_400_000);
    prisma.subscription.findUnique.mockResolvedValue({
      planId: 'pilot_35',
      status: 'ACTIVE',
      periodEnd: future,
      responsesUsed: 0,
      responsesLimit: 300,
    });
    prisma.pilotPurchase.findUnique.mockResolvedValue({
      expiresAt: future,
    });
  };

  const workspaces = (ids: string[]) => {
    prisma.workspace.count.mockResolvedValue(ids.length);
    prisma.workspace.findMany.mockResolvedValue(ids.map((id) => ({ id })));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BillingEntitlementsService(prisma as never);
  });

  describe('assertCanCreateWorkspace', () => {
    it('blocks a free user already at the 1-workspace limit', async () => {
      freeContext();
      workspaces(['ws-1']);
      await expect(
        service.assertCanCreateWorkspace(userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns an UPGRADE_REQUIRED payload with quota', async () => {
      freeContext();
      workspaces(['ws-1']);
      const err = await service
        .assertCanCreateWorkspace(userId)
        .catch((e: ForbiddenException) => e);
      const body = (err as ForbiddenException).getResponse() as Record<
        string,
        unknown
      >;
      expect(body.code).toBe('UPGRADE_REQUIRED');
      expect(body.feature).toBe('workspace');
      expect(body.quota).toEqual({ used: 1, limit: 1, period: 'lifetime' });
      expect(body.upgradePlanId).toBe('pilot_35');
    });

    it('allows a pilot user under the 3-workspace limit', async () => {
      pilotContext();
      workspaces(['ws-1', 'ws-2']);
      await expect(
        service.assertCanCreateWorkspace(userId),
      ).resolves.toBeUndefined();
    });

    it('blocks a pilot user at the 3-workspace limit', async () => {
      pilotContext();
      workspaces(['ws-1', 'ws-2', 'ws-3']);
      await expect(
        service.assertCanCreateWorkspace(userId),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('assertCanCreateForm (workspace freeze)', () => {
    it('allows form creation in the oldest workspace when over limit', async () => {
      freeContext();
      workspaces(['ws-old', 'ws-new']);
      await expect(
        service.assertCanCreateForm(userId, 'ws-old'),
      ).resolves.toBeUndefined();
    });

    it('blocks form creation in an over-limit (frozen) workspace', async () => {
      freeContext();
      workspaces(['ws-old', 'ws-new']);
      const err = await service
        .assertCanCreateForm(userId, 'ws-new')
        .catch((e: ForbiddenException) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      const body = (err as ForbiddenException).getResponse() as Record<
        string,
        unknown
      >;
      expect(body.code).toBe('UPGRADE_REQUIRED');
      expect(body.feature).toBe('workspace');
    });

    it('allows form creation with no workspace', async () => {
      freeContext();
      workspaces(['ws-old', 'ws-new']);
      await expect(
        service.assertCanCreateForm(userId),
      ).resolves.toBeUndefined();
    });

    it('never mutates or deletes workspaces', async () => {
      freeContext();
      workspaces(['ws-old', 'ws-new']);
      await service.assertCanCreateForm(userId, 'ws-new').catch(() => {});
      expect(Object.keys(prisma.workspace)).toEqual(['count', 'findMany']);
    });
  });

  describe('getWorkspaceEntitlement', () => {
    it('reports used/limit and frozen ids beyond the plan limit', async () => {
      freeContext();
      workspaces(['ws-1', 'ws-2', 'ws-3']);
      await expect(service.getWorkspaceEntitlement(userId)).resolves.toEqual({
        used: 3,
        limit: 1,
        frozenWorkspaceIds: ['ws-2', 'ws-3'],
      });
    });

    it('reports no frozen ids when within limit', async () => {
      pilotContext();
      workspaces(['ws-1', 'ws-2']);
      await expect(service.getWorkspaceEntitlement(userId)).resolves.toEqual({
        used: 2,
        limit: 3,
        frozenWorkspaceIds: [],
      });
    });
  });
});
