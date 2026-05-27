/**
 * Suggested if/then rule templates per card type when opening the Logic panel.
 */

import { createEmptyRule } from '@/features/forms/components/IfThenLogicPanel';
import { IF_THEN_LOGIC_SCREEN_LABELS } from '@/features/forms/constants/logicFieldCatalog';

/** Labels that support block-level "show if" visibility (Layer B). */
export const BLOCK_VISIBILITY_LABELS = new Set([
  'Heading',
  'Description',
  'Images',
  'Media',
  'Captcha',
]);

/** Card types best suited as branching decision points (Layer A). */
export const FLOW_BRANCHING_LABELS = IF_THEN_LOGIC_SCREEN_LABELS;

/** Passthrough cards — rarely need if-rules on the screen itself. */
export const FLOW_PASSTHROUGH_LABELS = new Set([
  'CTA',
  'Heading',
  'Description',
  'Images',
  'Video',
  'Captcha',
]);

const pickElse = (destinations, endId) => {
  if (!destinations?.length) return endId ?? null;
  return destinations[0]?.id ?? endId ?? null;
};

const pickAltDest = (destinations, endId) => {
  if (destinations.length >= 2) return destinations[1].id;
  return endId ?? destinations[0]?.id ?? null;
};

export function questionForScreen(questionOptions, fromScreenId) {
  return (
    questionOptions.find((o) => Number(o.sourceScreenId) === Number(fromScreenId)) ??
    questionOptions[0] ??
    null
  );
}

const condFromQuestion = (question, operator, value = '') => ({
  id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  sourceScreenId: question?.sourceScreenId ?? null,
  fieldId: question?.fieldId ?? 'short-text',
  operator,
  value,
});

/**
 * Returns suggested { rules, elseScreenId } for a new if/then draft.
 * @param {string} screenLabel - label of the screen the connection leaves from
 * @param {Array} questionOptions - from buildLogicQuestionOptions (all form cards)
 */
export function getSuggestedFlowLogic(
  screenLabel,
  questionOptions,
  destinationOptions,
  endScreenId,
  fromScreenId
) {
  const elseScreenId = pickElse(destinationOptions, endScreenId);
  const altDest = pickAltDest(destinationOptions, endScreenId);
  const fromQuestion = questionForScreen(questionOptions, fromScreenId);

  const emptyRule = () => ({
    ...createEmptyRule(questionOptions),
    thenScreenId: elseScreenId,
  });

  if (!altDest || altDest === elseScreenId) {
    return { rules: [emptyRule()], elseScreenId };
  }

  const branchRule = (question, operator, value) => ({
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    thenScreenId: altDest,
    conditions: [condFromQuestion(question, operator, value)],
  });

  switch (screenLabel) {
    case 'Single':
    case 'Media': {
      const q =
        questionOptions.find((o) => o.screenLabel === 'Single' || o.screenLabel === 'Media') ??
        fromQuestion;
      return {
        rules: [branchRule(q, 'is_not_empty')],
        elseScreenId,
      };
    }

    case 'Multiple': {
      const q = questionOptions.find((o) => o.screenLabel === 'Multiple') ?? fromQuestion;
      return { rules: [branchRule(q, 'is_not_empty')], elseScreenId };
    }

    case 'Rating': {
      const q = questionOptions.find((o) => o.screenLabel === 'Rating') ?? fromQuestion;
      return { rules: [branchRule(q, 'gte', '4')], elseScreenId };
    }

    case 'Date':
    case 'Time':
      return { rules: [branchRule(fromQuestion, 'is_not_empty')], elseScreenId };

    case 'Short text':
    case 'Long text':
    case 'Contact':
    case 'Address':
    case 'Work Info':
    case 'Images':
      return { rules: [branchRule(fromQuestion, 'is_not_empty')], elseScreenId };

    default:
      if (!IF_THEN_LOGIC_SCREEN_LABELS.has(screenLabel)) {
        return { rules: [emptyRule()], elseScreenId };
      }
      if (FLOW_PASSTHROUGH_LABELS.has(screenLabel)) {
        return { rules: [{ ...createEmptyRule(questionOptions, fromScreenId), thenScreenId: elseScreenId }], elseScreenId };
      }
      return {
        rules: [{ ...createEmptyRule(questionOptions, fromScreenId), thenScreenId: altDest }],
        elseScreenId,
      };
  }
}

export function supportsBlockVisibility(screenLabel) {
  return BLOCK_VISIBILITY_LABELS.has(screenLabel);
}
