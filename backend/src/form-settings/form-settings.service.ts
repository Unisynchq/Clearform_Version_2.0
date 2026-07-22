import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { REDIS_KEYS } from '../common/redis-cache-keys';
import { evictAnalyticsCaches } from '../common/analytics-cache.util';
import { safeRedisDel } from '../redis/redis-cache.util';
import { UpdateFormSettingsDto } from './dto/update-form-settings.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class FormSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private async evictRenderCache(formId: string): Promise<void> {
    await safeRedisDel(this.redis, REDIS_KEYS.formRender(formId));
  }

  async update(formId: string, userId: string, data: UpdateFormSettingsDto) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ownerId: userId },
    });
    if (!form) throw new NotFoundException('Form not found');

    const updateData: Record<string, unknown> = { ...data };
    delete updateData['password'];

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    } else if (data.password === null) {
      updateData.passwordHash = null;
    }

    const result = await this.prisma.formSettings.upsert({
      where: { formId },
      update: updateData,
      create: { formId, ...updateData },
    });

    await Promise.all([
      this.evictRenderCache(formId),
      evictAnalyticsCaches(this.redis, formId),
    ]);
    return result;
  }

  async pause(formId: string, userId: string) {
    return this.update(formId, userId, {
      pauseUntil: new Date('9999-12-31').toISOString(),
    });
  }

  async unpause(formId: string, userId: string) {
    return this.update(formId, userId, { pauseUntil: null });
  }
}
