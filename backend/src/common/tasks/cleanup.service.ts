import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CleanupTaskService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CleanupTaskService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    // Run cleanup check once per day (86,400,000 ms)
    this.timer = setInterval(() => {
      void this.purgeExpiredTrashForms();
    }, 24 * 60 * 60 * 1000);
  }

  async purgeExpiredTrashForms(): Promise<void> {
    this.logger.log('Starting scheduled trash cleanup...');
    try {
      const now = new Date();
      const expiredForms = await this.prisma.form.findMany({
        where: {
          status: 'TRASH',
          deletedAt: { not: null },
          permanentDeleteAt: { lte: now },
        },
        select: { id: true },
      });

      if (expiredForms.length === 0) {
        this.logger.log('No expired trash forms found for purging.');
        return;
      }

      const formIds = expiredForms.map((f) => f.id);

      await this.prisma.$transaction([
        this.prisma.formResponse.deleteMany({
          where: { formId: { in: formIds } },
        }),
        this.prisma.notification.deleteMany({
          where: { formId: { in: formIds } },
        }),
        this.prisma.form.deleteMany({
          where: { id: { in: formIds } },
        }),
      ]);

      this.logger.log(`[CLEANUP] Permanently purged ${formIds.length} expired forms from trash.`);
    } catch (error) {
      this.logger.error('Error during scheduled trash cleanup:', error);
    }
  }
}
