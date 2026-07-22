/**
 * Mirrors frontend formResponseBuilder — format answersByScreenId for list/detail APIs.
 */

type ScreenLike = {
  id?: number | string;
  type?: string;
  label?: string;
  name?: string;
  config?: Record<string, unknown>;
};

function field(snap: Record<string, unknown>, key: string): string {
  const fields = snap.previewFields;
  if (!fields || typeof fields !== 'object') return '';
  return String((fields as Record<string, unknown>)[key] ?? '').trim();
}

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

export function formatScreenAnswerValue(
  screen: ScreenLike,
  snap: Record<string, unknown> | undefined,
): string {
  if (!screen || screen.type !== 'content' || !snap) return '—';
  const label = screen.label ?? '';

  if (label === 'Short text') {
    const v = String(snap.shortTextDraft ?? '').trim();
    return v || '—';
  }
  if (label === 'Long text') {
    const v = String(snap.longTextDraft ?? '').trim();
    return v || '—';
  }
  if (label === 'Contact') {
    const parts = [
      field(snap, 'c.fn'),
      field(snap, 'c.ln'),
      field(snap, 'c.em'),
      field(snap, 'c.ph'),
    ].filter(Boolean);
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
    const parts = [
      field(snap, 'w.co'),
      field(snap, 'w.ti'),
      field(snap, 'w.ind'),
      field(snap, 'w.ts'),
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  }
  if (label === 'Single' || label === 'Multiple' || label === 'Media') {
    const picks = snap.previewPicks;
    if (Array.isArray(picks) && picks.length)
      return picks.map(String).join(' · ');
    return '—';
  }
  if (label === 'Rating') {
    const v = snap.ratingValue;
    return v != null && v !== '' ? String(v) : '—';
  }
  if (label === 'Date') {
    const v = field(snap, 'dateAns') || field(snap, 'date');
    return v || '—';
  }
  if (label === 'Time') {
    const sel = snap.timeSelection as Record<string, unknown> | undefined;
    if (sel && typeof sel === 'object') {
      const hh = String(sel.hour ?? 0).padStart(2, '0');
      const mm = String(sel.minute ?? 0).padStart(2, '0');
      const ss = String(sel.second ?? 0).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
    return field(snap, 'dateAns') || field(snap, 'numAns') || '—';
  }
  if (label === 'Video') {
    return field(snap, 'videoAns') || '—';
  }
  if (label === 'Upload' || label === 'Multi-image upload') {
    const files = snap.uploadedFiles;
    if (Array.isArray(files) && files.length) {
      return files
        .map((f) =>
          f && typeof f === 'object' && 'name' in f
            ? String((f as { name?: string }).name || 'File')
            : 'File',
        )
        .join(' · ');
    }
    return field(snap, 'uploadAns') || '—';
  }
  if (label === 'Captcha') {
    return snap.captchaChecked ? 'Verified' : '—';
  }
  if (label === 'Heading') {
    return field(snap, 'headingAns') || '—';
  }
  if (label === 'Description') {
    return field(snap, 'descAns') || '—';
  }

  return '—';
}

/**
 * Owner-written question text from screen config, or '' when none is set.
 * Builder screens keep the block-type name in `label` ("Short text"), so
 * callers that need human question text must check config first.
 */
export function questionTextFromConfig(screen: ScreenLike): string {
  const config = screen.config ?? {};
  const keys = [
    'singleQuestion',
    'multipleQuestion',
    'shortTextQuestion',
    'longTextQuestion',
    'ratingQuestion',
    'contactQuestion',
    'addressQuestion',
    'workQuestion',
    'mediaQuestion',
    'dateQuestion',
    'timeQuestion',
    'uploadQuestion',
    'imageQuestion',
    'videoQuestion',
    'question',
  ];
  for (const key of keys) {
    const v = config[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

export function questionLabel(screen: ScreenLike): string {
  return (
    questionTextFromConfig(screen) || screen.name || screen.label || 'Question'
  );
}

export function extractContactFromSnapshot(
  screens: ScreenLike[],
  answersByScreenId: Record<string, unknown>,
): string {
  for (const screen of screens) {
    if (screen.type !== 'content' || screen.label !== 'Contact') continue;
    const snap = snapForScreen(answersByScreenId, screen.id!);
    if (!snap) continue;
    const email = field(snap, 'c.em');
    if (email) return email;
    const phone = field(snap, 'c.ph');
    if (phone) return phone;
    const name = [field(snap, 'c.fn'), field(snap, 'c.ln')]
      .filter(Boolean)
      .join(' ');
    if (name) return name;
  }
  return '—';
}

/** Fallback when form has no Contact screen — first short/long text answer. */
export function extractRespondentLabel(
  screens: ScreenLike[],
  answersByScreenId: Record<string, unknown>,
): string {
  const contact = extractContactFromSnapshot(screens, answersByScreenId);
  if (contact !== '—') return contact;

  for (const screen of screens) {
    if (screen.type !== 'content') continue;
    if (screen.label !== 'Short text' && screen.label !== 'Long text') continue;
    const snap = snapForScreen(answersByScreenId, screen.id!);
    const v = formatScreenAnswerValue(screen, snap);
    if (v && v !== '—') return v;
  }
  return '—';
}

export function buildAnswersFromSnapshot(
  screens: ScreenLike[],
  answersByScreenId: Record<string, unknown>,
): { screenId: string; label: string; value: string }[] {
  const contentScreens = screens.filter((s) => s.type === 'content');
  return contentScreens.map((screen, i) => {
    const snap = snapForScreen(answersByScreenId, screen.id!);
    return {
      screenId: String(screen.id),
      label: questionLabel(screen) || `Question ${i + 1}`,
      value: formatScreenAnswerValue(screen, snap),
    };
  });
}

export function parseSnapshotScreens(snapshot: unknown): ScreenLike[] {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const screens = (snapshot as Record<string, unknown>).screens;
  if (!Array.isArray(screens)) return [];
  return screens as ScreenLike[];
}
