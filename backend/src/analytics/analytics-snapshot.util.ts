import {
  parseSnapshotScreens,
  questionLabel,
} from '../responses/answer-format.util';
import { fieldTypeFromScreen } from './insights-context.util';

export type ScreenDropoffStep = {
  screenId: number | string;
  q: string;
  kind: 'healthy' | 'attention' | 'critical';
  drop: string | null;
  dropPercent: number;
  alert: boolean;
  label: string;
  fieldType: string;
  reached: number;
  continued: number;
  dropCount: number;
  avgTimeSeconds: number | null;
  insight: string;
};

function snapForScreen(
  answersByScreenId: Record<string, unknown>,
  screenId: number | string,
): Record<string, unknown> | undefined {
  const raw =
    answersByScreenId[String(screenId)] ??
    answersByScreenId[screenId as string];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return raw as Record<string, unknown>;
}

function screenHasAnswer(snap: Record<string, unknown> | undefined): boolean {
  if (!snap) return false;
  if (String(snap.shortTextDraft ?? '').trim()) return true;
  if (String(snap.longTextDraft ?? '').trim()) return true;
  const rating = snap.ratingValue;
  if (rating != null && Number(rating) > 0) return true;
  const picks = snap.previewPicks;
  if (Array.isArray(picks) && picks.length > 0) return true;
  const fields = snap.previewFields;
  if (fields && typeof fields === 'object') {
    for (const v of Object.values(fields as Record<string, unknown>)) {
      if (String(v ?? '').trim()) return true;
    }
  }
  if (snap.captchaChecked === true) return true;
  const uploads = snap.uploadedFiles;
  if (Array.isArray(uploads) && uploads.length > 0) return true;
  return false;
}

function answersMapFromPayload(raw: unknown): Record<string, unknown> {
  const payload =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return (
    (payload.answersByScreenId as Record<string, unknown> | undefined) ??
    (payload.data &&
    typeof payload.data === 'object' &&
    !Array.isArray(payload.data)
      ? ((payload.data as Record<string, unknown>).answersByScreenId as
          | Record<string, unknown>
          | undefined)
      : undefined) ??
    {}
  );
}

export function contentScreenCountFromSnapshot(snapshot: unknown): number {
  return parseSnapshotScreens(snapshot).filter((s) => s.type === 'content')
    .length;
}

function tierForDropPct(dropPct: number): {
  kind: ScreenDropoffStep['kind'];
  alert: boolean;
} {
  if (dropPct >= 70) return { kind: 'critical', alert: true };
  if (dropPct >= 40) return { kind: 'attention', alert: false };
  return { kind: 'healthy', alert: false };
}

function dropInsight(
  label: string,
  dropPercent: number,
  reached: number,
  continued: number,
  q: string,
): string {
  if (reached === 0) {
    return 'No respondents reached this step in the selected period.';
  }
  const dropped = Math.max(0, reached - continued);
  if (dropPercent >= 70) {
    return `${q} "${label}" — ${dropped} of ${reached} dropped here (${dropPercent}%). Review wording or make this field optional.`;
  }
  if (dropPercent >= 40) {
    return `${q} "${label}" — ${dropped} of ${reached} left (${dropPercent}%). Try shorter helper text or fewer required fields.`;
  }
  if (dropPercent > 0) {
    return `${q} "${label}" — ${continued} of ${reached} continued (${dropPercent}% drop).`;
  }
  return `Healthy progression through ${q} "${label}" (${reached} reached).`;
}

type ResponseRow = {
  payload: unknown;
  durationMs: number | null;
  status: string;
};

const COMPLETED_STATUSES = new Set(['PROCESSED', 'PENDING']);

/** Per-question funnel from stored response payloads (handoff B.11). */
export function computeScreenDropoff(
  snapshot: unknown,
  rows: ResponseRow[],
): ScreenDropoffStep[] {
  const contentScreens = parseSnapshotScreens(snapshot).filter(
    (s) => s.type === 'content' && s.id != null,
  );
  if (contentScreens.length === 0) return [];

  const n = contentScreens.length;
  const reached = new Array(n).fill(0);
  const continued = new Array(n).fill(0);
  const dwellTotals = new Array(n).fill(0);
  const dwellCounts = new Array(n).fill(0);

  for (const row of rows) {
    const answers = answersMapFromPayload(row.payload);
    const hasAnswer = contentScreens.map((screen) =>
      screenHasAnswer(snapForScreen(answers, screen.id!)),
    );

    let lastAnswered = -1;
    for (let i = 0; i < n; i++) {
      if (hasAnswer[i]) lastAnswered = i;
    }

    for (let i = 0; i < n; i++) {
      const answeredHere = hasAnswer[i];
      const answeredNext = i < n - 1 ? hasAnswer[i + 1] : false;
      const completed = COMPLETED_STATUSES.has(row.status);
      const advanced =
        answeredNext || (i === n - 1 && answeredHere && completed);

      if (lastAnswered >= i) reached[i] += 1;

      if (answeredHere && advanced) continued[i] += 1;

      if (lastAnswered >= i && row.durationMs != null && row.durationMs > 0) {
        const screensTouched = Math.max(lastAnswered + 1, 1);
        dwellTotals[i] += Math.round(row.durationMs / 1000 / screensTouched);
        dwellCounts[i] += 1;
      }
    }
  }

  const steps: ScreenDropoffStep[] = [];

  contentScreens.forEach((screen, i) => {
    const reachedCount = reached[i];
    const continuedCount = continued[i];
    const dropCount = Math.max(0, reachedCount - continuedCount);
    const dropPercent =
      reachedCount > 0 ? Math.round((dropCount / reachedCount) * 100) : 0;
    const { kind, alert } =
      i === 0 && reachedCount > 0
        ? { kind: 'healthy' as const, alert: false }
        : tierForDropPct(dropPercent);

    const label = questionLabel(screen);
    const avgTimeSeconds =
      dwellCounts[i] > 0 ? Math.round(dwellTotals[i] / dwellCounts[i]) : null;

    steps.push({
      screenId: screen.id!,
      q: `Q${i + 1}`,
      kind,
      drop: dropPercent > 0 ? `−${dropPercent}%` : null,
      dropPercent,
      alert,
      label,
      fieldType: fieldTypeFromScreen(screen),
      reached: reachedCount,
      continued: continuedCount,
      dropCount,
      avgTimeSeconds,
      insight: dropInsight(
        label,
        dropPercent,
        reachedCount,
        continuedCount,
        `Q${i + 1}`,
      ),
    });
  });

  return steps;
}

/** Worst drop step for overview / aiInsight banner (handoff B.13). */
export function worstDropStep(
  steps: ScreenDropoffStep[],
): ScreenDropoffStep | null {
  if (steps.length === 0) return null;
  return (
    [...steps]
      .filter((s) => s.reached > 0 && s.dropPercent > 0)
      .sort((a, b) => b.dropPercent - a.dropPercent)[0] ?? null
  );
}
