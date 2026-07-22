import type {
  FormAnswersPayload,
  FormPublishedSnapshot,
  IntegrationConnectionMetadata,
  SheetsDispatchMetadataPatch,
} from '../integration-types';

export interface IntegrationDispatchContext {
  formId: string;
  formTitle: string;
  responseId: string;
  submittedAt: string;
  answers: FormAnswersPayload;
  publishedSnapshot?: FormPublishedSnapshot | null;
  metadata?: IntegrationConnectionMetadata;
}

export interface IntegrationProvider {
  readonly name: string;
  isEnabled(): boolean;
  initiateConnect(
    entityId: string,
    provider: string,
  ): Promise<{ redirectUrl: string }>;
  dispatchOnResponse(
    entityId: string,
    provider: string,
    ctx: IntegrationDispatchContext,
  ): Promise<SheetsDispatchMetadataPatch | null>;
  createSpreadsheet?(
    entityId: string,
    title: string,
  ): Promise<{ spreadsheetId: string }>;
}
