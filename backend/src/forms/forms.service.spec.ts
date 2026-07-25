import { FormStatus } from '@prisma/client';
import type { Redis } from 'ioredis';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../prisma/prisma.service';
import type { WebhooksService } from '../webhooks/webhooks.service';
import type { IntegrationsService } from '../integrations/integrations.service';
import type { BillingService } from '../billing/billing.service';
import type { FormQualityMemoryIndexer } from '../ai/form-quality-memory-indexer.service';
import { REDIS_KEYS } from '../common/redis-cache-keys';
import { FormsService } from './forms.service';

jest.mock('./snapshot.validator', () => ({
  validateSnapshotStructure: jest.fn(),
  snapshotTitle: jest.fn(() => 'Published form'),
}));

jest.mock('../common/cloudflare-purge.util', () => ({
  purgePublishedFormCache: jest.fn().mockResolvedValue(undefined),
}));

function makeForm(status: FormStatus) {
  const now = new Date('2026-07-04T00:00:00.000Z');
  return {
    id: 'form-1',
    ownerId: 'user-1',
    workspaceId: null,
    title: 'Published form',
    status,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === FormStatus.LIVE ? now : null,
    builderSnapshot: { screens: [] },
    publishedSnapshot: status === FormStatus.LIVE ? { screens: [] } : null,
    settings: {},
    _count: { responses: 3 },
  };
}

describe('FormsService', () => {
  it('evicts render and analytics caches on publish and unpublish', async () => {
    const prismaMock = {
      form: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'form-1', ownerId: 'user-1' }),
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(makeForm(FormStatus.DRAFT))
          .mockResolvedValueOnce(makeForm(FormStatus.LIVE)),
        update: jest
          .fn()
          .mockResolvedValueOnce(makeForm(FormStatus.LIVE))
          .mockResolvedValueOnce(makeForm(FormStatus.DRAFT)),
      },
    };
    const redisMock = {
      del: jest.fn().mockResolvedValue(1),
    };
    const configMock = {
      get: jest
        .fn()
        .mockImplementation((key: string) =>
          key === 'PUBLIC_FORM_ORIGIN'
            ? 'https://app.clearform.in'
            : 'https://api.clearform.in',
        ),
    };
    const webhooksMock = {
      dispatchWebhooks: jest.fn().mockResolvedValue(undefined),
    };
    const integrationsMock = {};
    const billingMock = {};
    const indexerMock = {
      indexPublishedForm: jest.fn().mockResolvedValue(undefined),
    };

    const service = new FormsService(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as Redis,
      configMock as unknown as ConfigService,
      webhooksMock as unknown as WebhooksService,
      integrationsMock as IntegrationsService,
      billingMock as BillingService,
      indexerMock as unknown as FormQualityMemoryIndexer,
    );

    await service.publish('form-1', 'user-1', { screens: [] });
    await service.unpublish('form-1', 'user-1');

    expect(redisMock.del).toHaveBeenCalledWith(REDIS_KEYS.formRender('form-1'));
    expect(redisMock.del).toHaveBeenCalledWith(
      REDIS_KEYS.analyticsOverview('form-1'),
    );
    for (const range of ['7d', '30d', '90d', 'all']) {
      expect(redisMock.del).toHaveBeenCalledWith(
        REDIS_KEYS.analyticsPerformance('form-1', range),
      );
      expect(redisMock.del).toHaveBeenCalledWith(
        REDIS_KEYS.analyticsInsights('form-1', range),
      );
    }
  });
});
