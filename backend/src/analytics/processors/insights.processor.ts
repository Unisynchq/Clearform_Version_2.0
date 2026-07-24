import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InsightsGeneratorService } from '../insights-generator.service';

@Processor('ai-insights', {
  drainDelay: 30_000,
  stalledInterval: 300_000,
  concurrency: 2,
})
export class InsightsProcessor extends WorkerHost {
  private readonly logger = new Logger(InsightsProcessor.name);

  constructor(private readonly insightsGenerator: InsightsGeneratorService) {
    super();
  }

  async process(job: Job): Promise<{ insight: string }> {
    const { formId, cacheKey, range } = job.data as {
      formId: string;
      userId: string;
      range: string;
      cacheKey: string;
    };

    const result = await this.insightsGenerator.generateReady(
      formId,
      cacheKey,
      range ?? 'all',
    );
    this.logger.log(`Insights job ${job.id} for form ${formId} complete`);
    const ready = result as { summaryText?: string; insight?: string };
    return {
      insight: String(ready.summaryText ?? ready.insight ?? ''),
    };
  }
}
