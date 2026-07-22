import type { EvaluateQualityDto } from '../ai.service.types';
import type { QualityCriterionId, QuestionIntent } from './question-intent.types';

export function requiresFullName(
  questionText?: string,
  helperText?: string,
): boolean {
  const combined = `${questionText ?? ''} ${helperText ?? ''}`.toLowerCase();
  return /\b(full name|official document|first and last|legal name|as it appears)\b/.test(
    combined,
  );
}

export function deriveDefaultCriteriaForIntent(
  intent: QuestionIntent,
  dto: EvaluateQualityDto,
): EvaluateQualityDto['options'] {
  const base = { ...(dto.options ?? {}) };

  switch (intent) {
    case 'identity':
      return {
        ...base,
        length: { enabled: false },
        specificity: { enabled: false },
        relevance: { enabled: true, keywordThreshold: 1 },
        completeness: { enabled: true },
      };
    case 'factual_short':
    case 'yes_no':
      return {
        ...base,
        length: { enabled: false },
        specificity: { enabled: false },
        relevance: { enabled: true, keywordThreshold: 1 },
        completeness: { enabled: true },
      };
    case 'achievement':
      return {
        ...base,
        length: { enabled: true, minWords: base.length?.minWords ?? 15 },
        specificity: {
          enabled: true,
          sensitivity: 'Medium',
          vagueWords: base.specificity?.vagueWords ?? 'good,fine,okay,great,work',
        },
        relevance: {
          enabled: true,
          topicKeywords:
            base.relevance?.topicKeywords ??
            'achievement,impact,outcome,result,contribution,project,role',
          keywordThreshold: 1,
        },
        completeness: { enabled: true },
      };
    case 'experience_narrative':
      return {
        ...base,
        length: { enabled: true, minWords: base.length?.minWords ?? 12 },
        specificity: { enabled: true, sensitivity: 'Medium' },
        relevance: { enabled: true, keywordThreshold: 1 },
        completeness: { enabled: true },
      };
    case 'open_feedback':
    case 'generic':
    default:
      return {
        ...base,
        length: { enabled: true, minWords: base.length?.minWords ?? 10 },
        specificity: { enabled: true, sensitivity: 'Medium' },
        relevance: { enabled: true, keywordThreshold: 1 },
        completeness: { enabled: true },
      };
  }
}

export function interpretMetricsForIntent(
  intent: QuestionIntent,
  criteria: QualityCriterionId[],
  intentDoctrine?: string,
): string {
  const lines: string[] = [`Question intent: ${intent}`];
  if (intentDoctrine?.trim()) {
    lines.push(intentDoctrine.trim());
  }

  for (const id of criteria) {
    switch (id) {
      case 'completeness':
        lines.push(
          intent === 'identity'
            ? '- completeness: Did they enter a complete, plausible name (first + last when helper asks for full name)?'
            : intent === 'factual_short' || intent === 'yes_no'
              ? '- completeness: Is the answer complete and unambiguous for this short factual question?'
              : intent === 'experience_narrative' || intent === 'open_feedback'
                ? '- completeness: Did they explain enough for the form owner to understand?'
                : '- completeness: Is the answer finished and sufficiently developed?',
        );
        break;
      case 'relevance':
        lines.push(
          intent === 'identity'
            ? '- relevance: Does the answer look like a real person name (not a greeting, joke, or random text)?'
            : '- relevance: Does the answer address what the question is asking?',
        );
        break;
      case 'specificity':
        lines.push(
          intent === 'achievement'
            ? '- specificity: Are there concrete outcomes, role, or measurable impact — not vague praise?'
            : '- specificity: Are vague words replaced with concrete details?',
        );
        break;
      case 'length':
        lines.push(
          intent === 'identity' || intent === 'factual_short' || intent === 'yes_no'
            ? '- length: Skip — brevity is correct for this question type.'
            : '- length: Is the answer long enough to be useful?',
        );
        break;
      default:
        break;
    }
  }

  return lines.join('\n');
}

export function intentSkipsGreenMicroSuggestion(intent: QuestionIntent): boolean {
  return (
    intent === 'identity' ||
    intent === 'factual_short' ||
    intent === 'yes_no'
  );
}
