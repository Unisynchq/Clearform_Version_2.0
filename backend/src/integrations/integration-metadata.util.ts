import type { Prisma } from '@prisma/client';
import type {
  FormAnswersPayload,
  FormPublishedSnapshot,
  IntegrationConnectionMetadata,
  IntegrationHealth,
} from './integration-types';

export function parseIntegrationMetadata(
  value: Prisma.JsonValue | null,
): IntegrationConnectionMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as IntegrationConnectionMetadata;
}

export function resolveSlackChannel(
  metadata: IntegrationConnectionMetadata,
  formId: string,
): string {
  const perForm = metadata.formSlackChannels?.[formId];
  if (typeof perForm === 'string' && perForm.trim()) return perForm.trim();
  const global =
    (typeof metadata.slackChannel === 'string' && metadata.slackChannel.trim()) ||
    (typeof metadata.channel === 'string' && metadata.channel.trim());
  return global || '#general';
}

export function resolveSpreadsheetId(
  metadata: IntegrationConnectionMetadata,
  formId: string,
): string | undefined {
  const perForm = metadata.formSpreadsheetIds?.[formId];
  if (typeof perForm === 'string' && perForm.trim()) return perForm.trim();
  const global = metadata.spreadsheetId;
  return typeof global === 'string' && global.trim() ? global.trim() : undefined;
}

export function resolveNotionDatabaseId(
  metadata: IntegrationConnectionMetadata,
  formId: string,
): string | undefined {
  const perForm = metadata.formNotionDatabaseIds?.[formId];
  if (typeof perForm === 'string' && perForm.trim()) return perForm.trim();
  const global = metadata.notionDatabaseId;
  return typeof global === 'string' && global.trim() ? global.trim() : undefined;
}

export function isFormEnabledForIntegration(
  metadata: IntegrationConnectionMetadata,
  formId: string,
): boolean {
  const enabled = metadata.enabledFormIds;
  if (!enabled || enabled.length === 0) return true;
  return enabled.includes(formId);
}

export function buildIntegrationHealth(
  metadata: IntegrationConnectionMetadata,
  formId?: string,
): IntegrationHealth {
  const spreadsheetConfigured = formId
    ? !!resolveSpreadsheetId(metadata, formId)
    : !!(
        (typeof metadata.spreadsheetId === 'string' &&
          metadata.spreadsheetId.trim()) ||
        (metadata.formSpreadsheetIds &&
          Object.values(metadata.formSpreadsheetIds).some(
            (id) => typeof id === 'string' && id.trim(),
          ))
      );
  return {
    lastSyncAt: metadata.lastSyncAt ?? null,
    lastSyncError: metadata.lastSyncError ?? null,
    lastSyncResponseId: metadata.lastSyncResponseId ?? null,
    spreadsheetConfigured,
    enabledFormIds: metadata.enabledFormIds?.length
      ? metadata.enabledFormIds
      : null,
  };
}

export function parseFormAnswersPayload(
  value: Prisma.JsonValue,
): FormAnswersPayload {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as FormAnswersPayload;
  }
  return {};
}

export function parsePublishedSnapshot(
  value: Prisma.JsonValue | null,
): FormPublishedSnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as FormPublishedSnapshot;
}
