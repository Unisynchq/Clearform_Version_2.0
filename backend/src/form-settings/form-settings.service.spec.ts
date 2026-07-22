import { FormSettingsService } from './form-settings.service';
import { REDIS_KEYS } from '../common/redis-cache-keys';
import type { PrismaService } from '../prisma/prisma.service';
import type { Redis } from 'ioredis';

describe('FormSettingsService', () => {
  it('evicts overview/performance/insights caches when settings change', async () => {
    const prismaMock = {
      form: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'form-1', ownerId: 'user-1' }),
      },
      formSettings: {
        upsert: jest
          .fn()
          .mockResolvedValue({ formId: 'form-1', responseLimit: 750 }),
      },
    };
    const redisMock = {
      del: jest.fn().mockResolvedValue(1),
    };

    const service = new FormSettingsService(
      prismaMock as unknown as PrismaService,
      redisMock as unknown as Redis,
    );
    await service.update('form-1', 'user-1', { responseLimit: 750 });

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
