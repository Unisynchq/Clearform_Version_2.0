import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ComposioIntegrationProvider } from './composio.provider';
import type { IntegrationProvider } from './integration-provider.interface';

@Injectable()
export class IntegrationProviderFactory {
  private readonly logger = new Logger(IntegrationProviderFactory.name);
  private readonly provider: IntegrationProvider;

  constructor(
    config: ConfigService,
    composioProvider: ComposioIntegrationProvider,
  ) {
    const key = (config.get<string>('INTEGRATION_PROVIDER') ?? 'composio')
      .trim()
      .toLowerCase();

    if (key !== 'composio') {
      this.logger.warn(
        `INTEGRATION_PROVIDER=${key} not implemented; falling back to composio`,
      );
    }
    this.provider = composioProvider;
  }

  getProvider(): IntegrationProvider {
    return this.provider;
  }
}
