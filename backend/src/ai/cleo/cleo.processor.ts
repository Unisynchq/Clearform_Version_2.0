import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CleoLearningService } from './cleo-learning.service';
import { CleoJarvisService } from './cleo-jarvis.service';

export const CLEO_QUEUE = 'cleo-learning';
export const CLEO_JOB_NAME = 'nightly-learning';

@Processor(CLEO_QUEUE, { drainDelay: 60_000, stalledInterval: 600_000, concurrency: 1 })
export class CleoProcessor extends WorkerHost {
  private readonly logger = new Logger(CleoProcessor.name);

  constructor(
    private readonly learning: CleoLearningService,
    private readonly jarvis: CleoJarvisService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== CLEO_JOB_NAME) return;
    this.logger.log('Cleo nightly job started');
    const result = await this.learning.runNightlyLearning();
    this.logger.log(
      `Cleo learning done — processed=${result.processed} rules=${result.rulesDistilled}`,
    );
    const obs = await this.jarvis.runPassiveObservation();
    this.logger.log(`Cleo Jarvis done — observations=${obs.observations}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Cleo job ${job.id} failed: ${err.message}`);
  }
}
