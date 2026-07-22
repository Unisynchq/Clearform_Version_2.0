import { parseSnapshotScreens, questionLabel } from '../../responses/answer-format.util';
import type { FormArchetype } from '../form-context.types';

/**
 * Single archetype detector for the whole AI subsystem. FormContextService
 * (live evals) and Cleo learning (rule distillation) must agree — a rule
 * learned under one archetype label is only retrieved under the same label.
 */
export const DEPARTMENT_KEYWORDS =
  /\b(department|team|division|org unit|business unit|function)\b/i;
const NPS_KEYWORDS = /\b(nps|net promoter|recommend|rating|score 0|0-10)\b/i;
const REVIEW_KEYWORDS = /\b(review|360|feedback|performance review|internal)\b/i;
const ACADEMIC_KEYWORDS =
  /\b(survey|research|study|course|professor|student|irb|consent|likert|thesis)\b/i;
const COMMUNITY_KEYWORDS =
  /\b(club|community|event|signup|volunteer|meetup|workshop|membership)\b/i;
const FOUNDER_KEYWORDS =
  /\b(startup|founder|product discovery|jtbd|pain point|customer interview|workflow|problem)\b/i;

function templateIdFromSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object') return '';
  return String((snapshot as Record<string, unknown>).templateId ?? '').toLowerCase();
}

/** Derive title/purpose from the snapshot when the caller has nothing better. */
export function detectArchetypeFromSnapshot(snapshot: unknown): FormArchetype {
  if (!snapshot || typeof snapshot !== 'object') return 'generic';
  const s = snapshot as Record<string, unknown>;
  const intro = (s.intro ?? {}) as Record<string, unknown>;
  const title = String(s.title ?? s.name ?? '');
  const purpose = String(intro.description ?? intro.subtitle ?? '');
  return detectArchetype(snapshot, title, purpose);
}

export function detectArchetype(
  snapshot: unknown,
  title: string,
  purpose: string,
): FormArchetype {
  const templateId = templateIdFromSnapshot(snapshot);
  if (templateId.includes('research') || templateId.includes('academic')) {
    return 'academic-research';
  }
  const haystack = `${title} ${purpose}`.toLowerCase();
  const screens = parseSnapshotScreens(snapshot);
  const labels = screens.map((s) => questionLabel(s).toLowerCase()).join(' ');

  const hasRating = screens.some((s) => {
    const cfg = s.config ?? {};
    return (
      String(s.label ?? '').toLowerCase().includes('rating') ||
      cfg.ratingQuestion != null
    );
  });
  const hasDepartmentSelect = screens.some((s) => {
    const cfg = s.config ?? {};
    const q = String(
      cfg.singleQuestion ??
        cfg.multipleQuestion ??
        cfg.question ??
        s.label ??
        '',
    );
    return DEPARTMENT_KEYWORDS.test(q);
  });

  if (
    (NPS_KEYWORDS.test(haystack) || NPS_KEYWORDS.test(labels)) &&
    hasRating
  ) {
    return 'customer-nps';
  }
  if (
    (REVIEW_KEYWORDS.test(haystack) || hasDepartmentSelect) &&
    (REVIEW_KEYWORDS.test(haystack) || DEPARTMENT_KEYWORDS.test(labels))
  ) {
    return 'internal-team-review';
  }
  if (ACADEMIC_KEYWORDS.test(haystack) || ACADEMIC_KEYWORDS.test(labels)) {
    return 'academic-research';
  }
  if (COMMUNITY_KEYWORDS.test(haystack) || COMMUNITY_KEYWORDS.test(labels)) {
    return 'community-club';
  }
  if (FOUNDER_KEYWORDS.test(haystack) || FOUNDER_KEYWORDS.test(labels)) {
    return 'founder-product-discovery';
  }
  return 'generic';
}
