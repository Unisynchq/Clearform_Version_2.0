/** Mirrors backend default-owner-quality-prompt.ts for builder seeding. */

const MAX_PROMPT_LENGTH = 600;

const EXPERIENCE_FEEDBACK_Q =
  /\b(filling this form|using this form|this form|form builder|clearform|this survey|how is your|how was your|your experience|experien|feedback|improve|onboard)\b/i;

const PROJECT_FIX_Q =
  /\b(correct|fix|change|update|specific thing|what to|make correct|in your project|hackathon|submit|artifact|module|file|bug|issue in)\b/i;

const NAME_Q = /\b(full name|your name|what is your name|first and last)\b/i;

function deriveFacetsFromHelper(helperText = '', questionText = '') {
  const facets = [];
  const h = String(helperText).toLowerCase();
  const q = String(questionText).toLowerCase();

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
  if (/\bexperience|onboard|feedback\b/.test(q) && facets.length === 0) {
    facets.push('what happened');
    facets.push('how it felt or what to improve');
  }
  if (facets.length === 0) {
    facets.push('on-topic detail');
    facets.push('concrete example or outcome');
  }
  return facets.slice(0, 4);
}

export function buildDefaultOwnerPromptForQuestion(questionText = '', helperText = '') {
  const q = String(questionText).trim().slice(0, 100);
  const helper = String(helperText).trim().slice(0, 120);

  if (NAME_Q.test(q)) {
    return (
      'I want a real name — first and last when possible. Titles alone (Mr./Mrs.) are amber; ' +
      'full name is green. Red for gibberish or greetings instead of a name.'
    ).slice(0, MAX_PROMPT_LENGTH);
  }

  if (PROJECT_FIX_Q.test(q)) {
    return (
      `For "${q}": green when they name what to fix and why; amber when only a file or module is named; ` +
      'red when unrelated. Nudge using their exact words (file name, feature, issue).'
    ).slice(0, MAX_PROMPT_LENGTH);
  }

  const facets = deriveFacetsFromHelper(helper, q);
  const facetClause = facets.length
    ? ` Cover: ${facets.join(', ')}.`
    : ' Include impact, stats, or a concrete example when relevant.';

  if (EXPERIENCE_FEEDBACK_Q.test(q)) {
    return (
      `For "${q}": green when specific and actionable (what happened, where, outcome);` +
      ` amber when vague; red for off-topic or repetition.${facetClause} ` +
      'Quote their words in feedback. If 2 of 3 facets are present, green with one tip for the missing part.'
    ).slice(0, MAX_PROMPT_LENGTH);
  }

  if (/\bachievement|significant|accomplish|professional\b/i.test(q)) {
    return (
      `For "${q}": green when they describe the achievement with measurable impact and their role;` +
      ` amber when thin; red for repetition or off-topic.${facetClause} ` +
      'If helper asks for measurable impact, name whether numbers or outcomes are missing.'
    ).slice(0, MAX_PROMPT_LENGTH);
  }

  return (
    `For "${q}": green when on-topic with useful detail (impact, stats, example, or emotion);` +
    ` amber when thin but on-topic; red for gibberish, repetition, or off-topic.${facetClause} ` +
    'Never ask for an example they already gave — quote their words.'
  ).slice(0, MAX_PROMPT_LENGTH);
}
