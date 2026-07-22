import { Injectable } from '@nestjs/common';
import {
  ComposioService,
  SUPPORTED_COMPOSIO_PROVIDERS,
} from '../composio.service';
import type { SheetsDispatchMetadataPatch } from '../integration-types';
import type {
  IntegrationDispatchContext,
  IntegrationProvider,
} from './integration-provider.interface';

/** Delegates OAuth + dispatch for {@link SUPPORTED_COMPOSIO_PROVIDERS}. */
@Injectable()
export class ComposioIntegrationProvider implements IntegrationProvider {
  readonly name = 'composio';
  readonly supportedProviders = SUPPORTED_COMPOSIO_PROVIDERS;

  constructor(private readonly composio: ComposioService) {}

  isEnabled(): boolean {
    return this.composio.isEnabled();
  }

  async initiateConnect(
    entityId: string,
    provider: string,
  ): Promise<{ redirectUrl: string }> {
    const redirectUrl = await this.composio.initiateConnection(
      entityId,
      provider,
    );
    return { redirectUrl };
  }

  async dispatchOnResponse(
    entityId: string,
    provider: string,
    ctx: IntegrationDispatchContext,
  ): Promise<SheetsDispatchMetadataPatch | null> {
    return this.composio.dispatchAction(entityId, provider, {
      formId: ctx.formId,
      formTitle: ctx.formTitle,
      responseId: ctx.responseId,
      submittedAt: ctx.submittedAt,
      answers: ctx.answers,
      publishedSnapshot: ctx.publishedSnapshot,
      metadata: ctx.metadata,
    });
  }

  async createSpreadsheet(
    entityId: string,
    title: string,
  ): Promise<{ spreadsheetId: string }> {
    return this.composio.createSpreadsheet(entityId, title);
  }
}
