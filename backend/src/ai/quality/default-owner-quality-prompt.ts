import {
  isExperienceOrFeedbackQuestion,
  isProfessionalExperienceQuestion,
  isProjectOrFixQuestion,
} from './question-signals.util';
import { isNameIntentQuestion } from '../ai-quality-rules.util';
import type { DoctrineRegistry } from '../doctrine/doctrine.registry';
import type { QuestionIntent } from '../question-intent/question-intent.types';

const MAX_PROMPT_LENGTH = 600;

let doctrineRegistry: DoctrineRegistry | null = null;

export function setDefaultOwnerPromptRegistry(registry: DoctrineRegistry): void {
  doctrineRegistry = registry;
}

function guidanceFromDoctrine(intentKey: string): string | null {
  const block = doctrineRegistry?.getDefaultOwnerGuidanceBlock() ?? '';
  if (!block) return null;
  const section = block.match(
    new RegExp(`### ${intentKey}[\\s\\S]*?(?=### |$)`, 'i'),
  );
  if (!section) return null;
  const lines = section[0]
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  return lines.join(' ').slice(0, MAX_PROMPT_LENGTH) || null;
}

/**
 * Classifier intents → defaults-doctrine section keys. `generic` and
 * `optional_topic` fall through to the regex matcher, which can still
 * find a sharper section (e.g. project_or_fix) than the generic block.
 */
const INTENT_TO_DEFAULTS_KEY: Partial<Record<QuestionIntent, string>> = {
  identity: 'identity',
  factual_short: 'factual_short',
  yes_no: 'factual_short',
  experience_narrative: 'experience_narrative',
  open_feedback: 'experience_narrative',
  achievement: 'achievement',
};

function intentKeyForQuestion(questionText?: string): string {
  if (isNameIntentQuestion(questionText)) return 'identity';
  if (isProjectOrFixQuestion(questionText)) return 'project_or_fix';
  if (isProfessionalExperienceQuestion(questionText)) return 'factual_short';
  if (isExperienceOrFeedbackQuestion(questionText)) return 'experience_narrative';
  if (/\bachievement|significant|accomplish|professional\b/i.test(questionText ?? '')) {
    return 'achievement';
  }
  return 'generic';
}

/** Owner guidance seeded in the builder — sourced from doctrine/defaults/owner-quality-defaults.md. */
export function buildDefaultOwnerPromptForQuestion(
  questionText?: string,
  helperText?: string,
  intent?: QuestionIntent,
): string {
  const q = (questionText ?? 'this question').trim().slice(0, 100);

  const intentSectionKey = intent ? INTENT_TO_DEFAULTS_KEY[intent] : undefined;
  if (intentSectionKey) {
    const fromIntent = guidanceFromDoctrine(intentSectionKey);
    if (fromIntent) {
      return `For "${q}": ${fromIntent}`.slice(0, MAX_PROMPT_LENGTH);
    }
  }

  const fromDoctrine = guidanceFromDoctrine(intentKeyForQuestion(questionText));
  if (fromDoctrine) return fromDoctrine;

  return (
    `For "${q}": green when on-topic with useful detail; amber when thin; red for gibberish or off-topic. ` +
    'Quote their words in feedback.'
  ).slice(0, MAX_PROMPT_LENGTH);
}

/** Facets extracted from helper text for the evaluation context envelope. */
export function deriveFacetsFromHelper(
  helperText?: string,
  questionText?: string,
): string[] {
  const facets: string[] = [];
  const h = (helperText ?? '').toLowerCase();
  const q = (questionText ?? '').toLowerCase();

  if (/\bmeasurable|impact|metric|number|stat|%\b/.test(h)) {
    facets.push('measurable impact');
  }
  if (/\bspecific contribution|your role|you did|your part\b/.test(h)) {
    facets.push('your specific contribution');
  }
  if (/\bexample|concrete|detail|instance\b/.test(h)) {
    facets.push('concrete example');
  }
  if (/\bachievement|accomplish|significant\b/.test(q) && !facets.includes('measurable impact')) {
    facets.push('what you achieved');
  }
  if (/\bexperience|onboard|feedback|hackathon\b/.test(q)) {
    if (isProfessionalExperienceQuestion(questionText)) {
      if (facets.length === 0) facets.push('years or amount of experience');
    } else {
      if (/\b(describe|detail|in detail)\b/.test(q)) {
        facets.push('specific detail relevant to this form');
      }
      if (/\b(what you like|liked most|like the most|favorite part|best part)\b/.test(q)) {
        facets.push('what you liked most');
      }
      if (/\b(how is|how was|experience|participating)\b/.test(q)) {
        facets.push('how the experience felt');
      }
      if (facets.length === 0) {
        facets.push('what happened');
        facets.push('how it felt or what to improve');
      }
    }
  }
  if (/\b(specific as possible|quality matters|be as specific)\b/.test(h)) {
    if (!facets.includes('specific detail relevant to this form')) {
      facets.push('specific detail relevant to this form');
    }
  }
  if (facets.length === 0) {
    facets.push('on-topic detail');
    facets.push('concrete example or outcome');
  }
  return facets.slice(0, 4);
}
