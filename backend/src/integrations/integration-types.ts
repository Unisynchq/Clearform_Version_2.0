/** JSON-safe primitives for integration payloads (no `unknown`). */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/** One screen's answer blob as stored on FormResponse.payload. */
export type FormAnswerScreenSnapshot = JsonObject;

/** Normalized response payload passed into Composio dispatch. */
export type FormAnswersPayload = JsonObject & {
  answersByScreenId?: Record<string, FormAnswerScreenSnapshot>;
};

/** Published or builder snapshot root (screens array drives Sheets columns + logic). */
export type FormPublishedSnapshot = JsonObject & {
  screens?: FormSnapshotScreen[];
  savedAt?: string;
};

export type FormSnapshotScreen = {
  id?: number | string;
  type?: string;
  label?: string;
  name?: string;
  config?: JsonObject;
  fields?: FormSnapshotField[];
};

export type FormSnapshotField = {
  id?: string;
  type?: string;
  label?: string;
};

/** Workspace integration row metadata persisted in Prisma JSON column. */
export type IntegrationConnectionMetadata = {
  spreadsheetId?: string;
  /** Per-form spreadsheet override (formId → spreadsheetId). */
  formSpreadsheetIds?: Record<string, string>;
  /** When set, Sheets dispatch runs only for these form IDs. */
  enabledFormIds?: string[];
  sheetRange?: string;
  /** Per-form Slack channel override (formId → channel). */
  formSlackChannels?: Record<string, string>;
  slackChannel?: string;
  channel?: string;
  sheetsHeaderWritten?: boolean;
  sheetsNextRow?: number;
  sheetsColumnCount?: number;
  /** Per-form Notion database (formId → databaseId), created by createFormNotionDatabase. */
  formNotionDatabaseIds?: Record<string, string>;
  notionDatabaseId?: string;
  lastSyncAt?: string;
  lastSyncError?: string | null;
  lastSyncResponseId?: string;
};

/** Health fields surfaced on GET integrations list. */
export type IntegrationHealth = {
  lastSyncAt: string | null;
  lastSyncError: string | null;
  lastSyncResponseId: string | null;
  spreadsheetConfigured: boolean;
  enabledFormIds: string[] | null;
};

/** Fields merged into integration metadata after a successful Sheets append. */
export type SheetsDispatchMetadataPatch = {
  sheetsHeaderWritten?: boolean;
  sheetsNextRow?: number;
  sheetsColumnCount?: number;
};

/** Status returned by ComposioService.verifyConnectedAccount. */
export type ComposioAccountVerifyStatus =
  | 'ACTIVE'
  | 'INITIATED'
  | 'FAILED'
  | 'EXPIRED';
