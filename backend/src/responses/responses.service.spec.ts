import { ResponseStatus } from '@prisma/client';
import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import type { PrismaService } from '../prisma/prisma.service';
import type { BillingService } from '../billing/billing.service';
import { REDIS_KEYS } from '../common/redis-cache-keys';
import { ResponsesService } from './responses.service';

describe('ResponsesService', () => {
  it('evicts overview, performance, and insights caches on submission', async () => {
    const createdAt = new Date('2026-07-04T00:00:00.000Z');
    const prismaMock = {
      form: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'form-1',
            status: 'LIVE',
            settings: { responseLimit: null, pauseUntil: null },
          })
          .mockResolvedValueOnce({
            publishedSnapshot: null,
            builderSnapshot: null,
          }),
      },
      formResponse: {
        create: jest.fn().mockResolvedValue({
          id: 'response-1',
          formId: 'form-1',
          payload: {
            completed: true,
            status: 'completed',
            answersByScreenId: { '101': 'hello' },
          },
          status: ResponseStatus.PROCESSED,
          qualityScore: null,
          completedAt: createdAt,
          createdAt,
        }),
      },
    };
    const redisMock = {
      del: jest.fn().mockResolvedValue(1),
      lpush: jest.fn().mockResolvedValue(1),
      ltrim: jest.fn().mockResolvedValue('OK'),
      expire: jest.fn().mockResolvedValue(1),
      lrange: jest.fn().mockResolvedValue([]),
    };
    const queueMock = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    const billingMock = {
      assertCanAcceptResponse: jest.fn().mockResolvedValue(undefined),
      incrementResponsesUsedForForm: jest.fn().mockResolvedValue(undefined),
    };

    const service = new ResponsesService(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as Redis,
      queueMock as unknown as Queue,
      billingMock as unknown as BillingService,
    );

    await service.submitResponse('form-1', {
      completed: true,
      status: 'completed',
      answersByScreenId: { '101': 'hello' },
      submittedAt: createdAt.toISOString(),
    });

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
    expect(queueMock.add).toHaveBeenCalledWith(
      'process-side-effects',
      expect.objectContaining({
        responseId: 'response-1',
        formId: 'form-1',
      }),
      { attempts: 3, backoff: { type: 'exponential', delay: 1000 } },
    );
  });
});
