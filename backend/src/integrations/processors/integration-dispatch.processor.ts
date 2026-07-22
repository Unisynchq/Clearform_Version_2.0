import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IntegrationsService } from '../integrations.service';

/**
 * Durable per-connection integration dispatch. concurrency: 1 serializes
 * dispatches so the sheets append-plan (metadata.sheetsNextRow
 * read-modify-write) can never race between concurrent responses.
 * Retries/backoff come from the job options set at enqueue time;
 * UnrecoverableError from the service stops retries for config/auth
 * failures already surfaced in connection metadata.
 */
@Processor('integrations', { concurrency: 1, drainDelay: 30_000 })
export class IntegrationDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(IntegrationDispatchProcessor.name);

  constructor(private readonly integrationsService: IntegrationsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'dispatch-connection') {
      this.logger.warn(`Unknown integrations job: ${job.name}`);
      return;
    }
    await this.integrationsService.dispatchForConnection(
      job.data as {
        connectionId: string;
        formId: string;
        responseId: string;
        submittedAt: string;
      },
    );
  }
}
