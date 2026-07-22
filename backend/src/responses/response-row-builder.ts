/**
 * Single source for turning a form snapshot + stored response payloads into
 * tabular rows. Shared by the CSV/XLSX exports and the integrations sheet
 * dispatch so exported files and live-synced sheets always agree.
 *
 * Handles every historical payload shape:
 *  - { answersByScreenId: {...} }            (current)
 *  - { data: { answersByScreenId: {...} } }  (legacy API wrapper)
 *  - { answers: [{screenId,label,value}] }   (legacy pre-snapshot rows)
 */

import {
  formatScreenAnswerValue,
  parseSnapshotScreens,
  questionLabel,
} from './answer-format.util';

export type ResponseColumn = { screenId: string; header: string };
export type ResponseFileLink = { name: string; url: string };
export type ResponseCell = { text: string; files: ResponseFileLink[] };

export type ExportableResponse = {
  id: string;
  createdAt: Date;
  status: string;
  qualityScore: number | null;
  payload: unknown;
};

export const RESPONSE_META_HEADERS = [
  'Response ID',
  'Submitted At',
  'Status',
  'Quality Score',
] as const;

/** Excel hard cell limit is 32,767 chars; stay under it defensively. */
const MAX_CELL_CHARS = 32_000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** One column per content screen, in form order. */
export function buildResponseColumns(snapshot: unknown): ResponseColumn[] {
  return parseSnapshotScreens(snapshot)
    .filter((s) => s.type === 'content' && s.id != null)
    .map((s) => ({ screenId: String(s.id), header: questionLabel(s) }));
}

/** answersByScreenId from any historical payload shape, or null when absent. */
export function extractAnswersMap(
  payload: unknown,
): Record<string, Record<string, unknown>> | null {
  const record = asRecord(payload);
  const direct = record.answersByScreenId;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct as Record<string, Record<string, unknown>>;
  }
  const nested = asRecord(record.data).answersByScreenId;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as Record<string, Record<string, unknown>>;
  }
  return null;
}

/** Hosted file links from an upload screen snap ({name, url} pairs). */
export function extractUploadFiles(
  snap: Record<string, unknown> | undefined,
): ResponseFileLink[] {
  const files = snap?.uploadedFiles;
  if (!Array.isArray(files)) return [];
  const out: ResponseFileLink[] = [];
  for (const f of files) {
    if (!f || typeof f !== 'object') continue;
    const file = f as Record<string, unknown>;
    const url = String(file.url ?? file.downloadUrl ?? '').trim();
    if (!url || url.startsWith('blob:') || url.startsWith('data:')) continue;
    out.push({ name: String(file.name ?? 'File').trim() || 'File', url });
  }
  return out;
}

type LegacyAnswerRow = { screenId?: number | string; value?: string };

function legacyAnswerRows(payload: unknown): Map<string, string> {
  const record = asRecord(payload);
  const rows = new Map<string, string>();
  if (!Array.isArray(record.answers)) return rows;
  for (const a of record.answers) {
    if (!a || typeof a !== 'object') continue;
    const row = a as LegacyAnswerRow;
    if (row.screenId == null) continue;
    const value = String(row.value ?? '');
    // Rows holding raw snap JSON are unusable pre-formatted values — skip them.
    if (value.startsWith('{') && value.includes('shortTextDraft')) continue;
    rows.set(String(row.screenId), value);
  }
  return rows;
}

/** One cell per column for a single response payload. */
export function buildResponseCells(
  snapshot: unknown,
  columns: ResponseColumn[],
  payload: unknown,
): ResponseCell[] {
  const screens = parseSnapshotScreens(snapshot).filter(
    (s) => s.type === 'content',
  );
  const screenById = new Map(screens.map((s) => [String(s.id ?? ''), s]));
  const answersMap = extractAnswersMap(payload);
  const legacyRows = answersMap ? null : legacyAnswerRows(payload);

  return columns.map((col) => {
    const screen = screenById.get(col.screenId);
    if (!screen) return { text: '—', files: [] };

    if (answersMap) {
      const raw = answersMap[col.screenId];
      const snap =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : undefined;
      const isUpload =
        screen.label === 'Upload' || screen.label === 'Multi-image upload';
      return {
        text: formatScreenAnswerValue(screen, snap),
        files: isUpload ? extractUploadFiles(snap) : [],
      };
    }

    const legacyValue = legacyRows?.get(col.screenId);
    return {
      text: legacyValue && legacyValue.trim() ? legacyValue : '—',
      files: [],
    };
  });
}

/**
 * Cell text with file links resolved for flat outputs (CSV, sheets).
 * Single file → bare URL (spreadsheet apps auto-link a lone URL);
 * multiple → "name (url); name (url)".
 */
export function cellTextWithLinks(cell: ResponseCell): string {
  if (cell.files.length === 1) return cell.files[0].url;
  if (cell.files.length > 1) {
    return cell.files.map((f) => `${f.name} (${f.url})`).join('; ');
  }
  return cell.text;
}

/**
 * Neutralize spreadsheet formula injection: a leading =, +, @ (or - not
 * starting a number) would execute as a formula on open/import.
 */
export function guardCellText(text: string): string {
  if (/^[=+@]/.test(text) || /^-(?![\d.\s])/.test(text)) return `'${text}`;
  return text;
}

function truncateCell(text: string): string {
  return text.length > MAX_CELL_CHARS
    ? `${text.slice(0, MAX_CELL_CHARS)}…`
    : text;
}

function csvEscape(text: string): string {
  return text.includes(',') ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r')
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/** Full CSV document: meta columns + one question column per content screen. */
export function buildResponsesCsv(
  snapshot: unknown,
  responses: ExportableResponse[],
): string {
  const columns = buildResponseColumns(snapshot);
  const header = [...RESPONSE_META_HEADERS, ...columns.map((c) => c.header)];

  const lines = [header.map((h) => csvEscape(guardCellText(h))).join(',')];
  for (const r of responses) {
    const cells = buildResponseCells(snapshot, columns, r.payload);
    const row = [
      r.id,
      r.createdAt.toISOString(),
      r.status,
      r.qualityScore == null ? '' : String(r.qualityScore),
      ...cells.map((c) => truncateCell(cellTextWithLinks(c))),
    ];
    lines.push(row.map((v) => csvEscape(guardCellText(v))).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Row values for XLSX (names as text; hyperlinks applied separately by the
 * caller via cell .l) — returns cells so the caller can place links.
 */
export function buildResponseRowForXlsx(
  snapshot: unknown,
  columns: ResponseColumn[],
  response: ExportableResponse,
): { values: (string | number)[]; cells: ResponseCell[] } {
  const cells = buildResponseCells(snapshot, columns, response.payload);
  const values: (string | number)[] = [
    response.id,
    response.createdAt.toISOString(),
    response.status,
    response.qualityScore ?? '',
    ...cells.map((c) => {
      if (c.files.length === 0) return truncateCell(guardCellText(c.text));
      const text =
        c.files.length === 1
          ? c.files[0].name
          : c.files.map((f) => `${f.name} (${f.url})`).join('; ');
      return truncateCell(guardCellText(text));
    }),
  ];
  return { values, cells };
}
