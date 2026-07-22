import {
  buildResponseCells,
  buildResponseColumns,
  cellTextWithLinks,
  guardCellText,
  type ResponseColumn,
} from '../responses/response-row-builder';
import type {
  FormAnswersPayload,
  FormPublishedSnapshot,
} from './integration-types';

export type SheetsColumn = ResponseColumn;

export function buildSheetsColumnsFromSnapshot(
  snapshot: FormPublishedSnapshot | null | undefined,
): SheetsColumn[] {
  // Shared with CSV/XLSX exports so sheet columns always match exported files.
  return buildResponseColumns(snapshot);
}

export function buildSheetsHeaderRow(columns: SheetsColumn[]): string[] {
  return ['Response ID', 'Submitted At', ...columns.map((c) => c.header)];
}

export function needsSheetsHeaderRebuild(
  metadata:
    | {
        sheetsColumnCount?: number;
        sheetsHeaderWritten?: boolean;
      }
    | null
    | undefined,
  columnCount: number,
): boolean {
  if (!metadata?.sheetsHeaderWritten) return false;
  const stored = metadata.sheetsColumnCount;
  return typeof stored === 'number' && stored !== columnCount;
}

export type SheetsAppendPlan = {
  values: string[][];
  startRow: number;
  headerWritten: boolean;
  columnCount: number;
};

/** Builds row batch + start row; rebuilds header when published form column count drifts. */
export function buildSheetsAppendPlan(
  metadata:
    | {
        sheetsHeaderWritten?: boolean;
        sheetsNextRow?: number;
        sheetsColumnCount?: number;
      }
    | null
    | undefined,
  columns: SheetsColumn[],
  dataRow: string[],
): SheetsAppendPlan {
  const columnCount = columns.length;
  const rebuild = needsSheetsHeaderRebuild(metadata, columnCount);
  const headerWritten = metadata?.sheetsHeaderWritten === true && !rebuild;

  const values = headerWritten
    ? [dataRow]
    : [buildSheetsHeaderRow(columns), dataRow];

  const startRow = headerWritten
    ? typeof metadata?.sheetsNextRow === 'number'
      ? metadata.sheetsNextRow
      : 2
    : 1;

  return {
    values,
    startRow,
    headerWritten,
    columnCount,
  };
}

export function buildSheetsDataRow(
  snapshot: FormPublishedSnapshot | null | undefined,
  columns: SheetsColumn[],
  payload: {
    responseId: string;
    submittedAt: string;
    answers: FormAnswersPayload;
  },
): string[] {
  // Shared cell builder: same formatting as exports, upload answers resolve
  // to real links. Cells are guarded because sheets writes use USER_ENTERED,
  // which would otherwise execute leading = + @ as formulas.
  const cells = buildResponseCells(snapshot, columns, payload.answers);
  const questionCells = cells.map((cell) =>
    guardCellText(cellTextWithLinks(cell)),
  );
  return [payload.responseId, payload.submittedAt, ...questionCells];
}
