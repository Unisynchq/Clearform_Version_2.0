import { getScreenPreviewText } from '@/features/forms/utils/screenConfigSync';

const QUESTION_ICON_BGS = [
  '#ECFDF3',
  '#F5F3FF',
  '#FFFAEB',
  '#F0FDFA',
  '#FEF3F2',
  '#EFF6FF',
  '#FDF4FF',
  '#F0FDF4',
];

/** Format milliseconds as human-readable duration (e.g. "2m 15s", "45s"). */
export function formatDurationMs(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Format ISO date for the responses table (e.g. "20 Dec 2025 20:14"). */
export function formatResponseSubmittedAt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${year} ${hh}:${mm}`;
}

function field(snap, key) {
  return String(snap?.previewFields?.[key] ?? '').trim();
}

function snapForScreen(snapsByScreenId, screenId) {
  if (!snapsByScreenId) return undefined;
  return snapsByScreenId[screenId] ?? snapsByScreenId[String(screenId)];
}

/** Human-readable cell value for a content screen from preview snap state. */
export function formatScreenAnswerValue(screen, snap) {
  if (!screen || screen.type !== 'content') return '—';
  const label = screen.label;

  if (label === 'Short text') {
    const v = String(snap?.shortTextDraft ?? '').trim();
    return v || '—';
  }
  if (label === 'Long text') {
    const v = String(snap?.longTextDraft ?? '').trim();
    return v || '—';
  }
  if (label === 'Contact') {
    const parts = [field(snap, 'c.fn'), field(snap, 'c.ln'), field(snap, 'c.em'), field(snap, 'c.ph')].filter(
      Boolean,
    );
    return parts.length ? parts.join(' · ') : '—';
  }
  if (label === 'Address') {
    const parts = [
      field(snap, 'a.st'),
      field(snap, 'a.ci'),
      field(snap, 'a.ste'),
      field(snap, 'a.po'),
      field(snap, 'a.ct'),
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : '—';
  }
  if (label === 'Work Info') {
    const parts = [field(snap, 'w.co'), field(snap, 'w.ti'), field(snap, 'w.ind'), field(snap, 'w.ts')].filter(
      Boolean,
    );
    return parts.length ? parts.join(' · ') : '—';
  }
  if (label === 'Single' || label === 'Multiple' || label === 'Media') {
    const picks = snap?.previewPicks ?? [];
    return picks.length ? picks.join(' · ') : '—';
  }
  if (label === 'Rating') {
    const v = snap?.ratingValue;
    return v != null && v !== '' ? String(v) : '—';
  }
  if (label === 'Date') {
    const v = field(snap, 'dateAns') || field(snap, 'date');
    return v || '—';
  }
  if (label === 'Time') {
    const sel = snap?.timeSelection;
    if (sel) {
      return [sel.hour, sel.minute, sel.second ?? 0]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
    }
    return field(snap, 'dateAns') || field(snap, 'numAns') || '—';
  }
  if (label === 'Video') {
    return field(snap, 'videoAns') || '—';
  }
  if (label === 'Upload' || label === 'Multi-image upload') {
    if (snap?.uploadedFiles?.length) {
      return snap.uploadedFiles.map((f) => f.name || 'File').join(' · ');
    }
    return field(snap, 'uploadAns') || '—';
  }
  if (label === 'Captcha') {
    return snap?.captchaChecked ? 'Verified' : '—';
  }
  if (label === 'Heading') {
    return field(snap, 'headingAns') || '—';
  }
  if (label === 'Description') {
    return field(snap, 'descAns') || '—';
  }

  return '—';
}

export function extractContactFromScreens(screens, snapsByScreenId) {
  for (const screen of screens) {
    if (screen.type !== 'content' || screen.label !== 'Contact') continue;
    const snap = snapForScreen(snapsByScreenId, screen.id);
    if (!snap) continue;
    const email = field(snap, 'c.em');
    if (email) return email;
    const phone = field(snap, 'c.ph');
    if (phone) return phone;
    const name = [field(snap, 'c.fn'), field(snap, 'c.ln')].filter(Boolean).join(' ');
    if (name) return name;
  }
  return '—';
}

/** Name/email/phone column — Contact screen first, else first short/long text answer. */
export function extractRespondentLabel(screens, snapsByScreenId) {
  const contact = extractContactFromScreens(screens, snapsByScreenId);
  if (contact !== '—') return contact;
  for (const screen of screens ?? []) {
    if (screen.type !== 'content') continue;
    if (screen.label !== 'Short text' && screen.label !== 'Long text') continue;
    const v = formatScreenAnswerValue(screen, snapForScreen(snapsByScreenId, screen.id));
    if (v && v !== '—') return v;
  }
  return '—';
}

/**
 * Build a persisted response from builder preview state.
 * @param {{ formId: number|string, screens: object[], snapsByScreenId: Record<number, object> }} params
 */
export function buildResponseFromPreview({
  formId,
  screens,
  snapsByScreenId,
  startedAt,
  durationMs,
  screenTimestamps,
}) {
  const contentScreens = (screens ?? []).filter((s) => s.type === 'content');
  const answers = contentScreens.map((screen, i) => ({
    screenId: screen.id,
    label: getScreenPreviewText(screen, {}) || screen.label || `Question ${i + 1}`,
    value: formatScreenAnswerValue(screen, snapForScreen(snapsByScreenId, screen.id)),
  }));

  const contact = extractRespondentLabel(screens, snapsByScreenId);
  const submittedAt = new Date().toISOString();

  return {
    id: `resp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    formId,
    submittedAt,
    startedAt: startedAt ?? submittedAt,
    durationMs: durationMs ?? null,
    screenTimestamps: screenTimestamps ?? null,
    status: 'completed',
    contact,
    answers,
  };
}

/**
 * Table column headers for analytics (fixed cols + one per content screen).
 * @param {{ screens?: object[] } | null} draft
 * @param {typeof import('react-icons/ri').RiListCheck2} ListIcon
 */
export function buildResponseTableHeaders(draft, ListIcon) {
  const FIXED = [
    { label: 'Name, email, or phone', Icon: null, iconBg: null },
    { label: 'Response time', Icon: null, iconBg: '#E8F4FC' },
    { label: 'Response type', Icon: null, iconBg: '#FFF0E6' },
  ];

  const contentScreens = (draft?.screens ?? []).filter((s) => s.type === 'content');
  const questionHeaders = contentScreens.map((screen, i) => ({
    label: getScreenPreviewText(screen, {}) || screen.label || `Question ${i + 1}`,
    Icon: ListIcon,
    iconBg: QUESTION_ICON_BGS[i % QUESTION_ICON_BGS.length],
  }));

  return [...FIXED, ...questionHeaders];
}

function answersLookLikeRawJson(answers) {
  return (answers ?? []).some(
    (a) =>
      typeof a?.value === 'string' &&
      a.value.startsWith('{') &&
      a.value.includes('shortTextDraft'),
  );
}

/**
 * Normalize a GET /analytics/.../responses item using the published/builder snapshot.
 * @param {object} item — API list row
 * @param {{ screens?: object[] } | null} draft — form snapshot
 */
export function mapApiResponseForDisplay(item, draft) {
  if (!item) return item;
  const screens = draft?.screens ?? [];
  const byScreen = item.answersByScreenId;

  if (byScreen && screens.length > 0) {
    const rebuilt = buildResponseFromPreview({
      formId: item.formId,
      screens,
      snapsByScreenId: byScreen,
    });
    return {
      ...item,
      contact: item.contact && item.contact !== '—' ? item.contact : rebuilt.contact,
      status: item.status ?? rebuilt.status,
      answers: rebuilt.answers,
      durationMs: item.durationMs ?? item.metadata?.durationMs ?? null,
    };
  }

  if (!answersLookLikeRawJson(item.answers)) return item;

  return item;
}

/** @param {import('./formResponsesStorage').FormResponseRecord} response */
export function responseToTableRow(response) {
  const durationLabel =
    response.durationMs != null
      ? formatDurationMs(response.durationMs)
      : response.metadata?.durationMs != null
        ? formatDurationMs(response.metadata.durationMs)
        : '—';
  return [
    response.contact || '—',
    durationLabel,
    response.status === 'completed' ? 'Completed' : 'Partial',
    ...(response.answers ?? []).map((a) => a.value || '—'),
  ];
}

const MS_DAY = 86_400_000;

/** Filter responses by analytics date-range label. */
export function filterResponsesByRange(responses, rangeLabel, customRange = {}) {
  if (!responses?.length) return [];
  if (!rangeLabel || rangeLabel === 'All time') return sortResponsesByNewest(responses);

  const now = Date.now();
  let start = 0;
  let end = now;

  if (rangeLabel === 'Last 7 days') {
    start = now - 7 * MS_DAY;
  } else if (rangeLabel === 'Last 30 days') {
    start = now - 30 * MS_DAY;
  } else if (rangeLabel === 'Last 90 days') {
    start = now - 90 * MS_DAY;
  } else if (rangeLabel === 'This quarter') {
    const d = new Date();
    const qStartMonth = Math.floor(d.getMonth() / 3) * 3;
    start = new Date(d.getFullYear(), qStartMonth, 1).getTime();
  } else if (customRange?.start && customRange?.end) {
    start = new Date(customRange.start).setHours(0, 0, 0, 0);
    end = new Date(customRange.end).setHours(23, 59, 59, 999);
  } else {
    return responses;
  }

  const filtered = responses.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return Number.isFinite(t) && t >= start && t <= end;
  });
  return sortResponsesByNewest(filtered);
}

/** Newest submissions first (stable for equal timestamps). */
export function sortResponsesByNewest(responses) {
  if (!responses?.length) return [];
  return [...responses].sort((a, b) => {
    const ta = new Date(a.submittedAt).getTime();
    const tb = new Date(b.submittedAt).getTime();
    const aValid = Number.isFinite(ta);
    const bValid = Number.isFinite(tb);
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    return tb - ta;
  });
}
