import * as Sentry from '@sentry/nestjs';
import { sentryEnabled } from '../../../instrument';
import type { FormContext } from '../../form-context.types';
import type { QualityResult } from '../../ai.service.types';
import type { QuestionIntent } from '../../question-intent/question-intent.types';

export function logQualityEvalBreadcrumb(opts: {
  formId?: string;
  intent: QuestionIntent;
  level: QualityResult['level'];
  violationKind?: string;
  adequacy?: string;
  rulesOnly?: boolean;
  tier?: string;
}): void {
  if (!sentryEnabled) return;
  Sentry.addBreadcrumb({
    category: 'ai.quality',
    message: `quality ${opts.level} intent=${opts.intent}`,
    level: opts.level === 'red' ? 'warning' : 'info',
    data: {
      formId: opts.formId,
      violationKind: opts.violationKind,
      adequacy: opts.adequacy,
      rulesOnly: opts.rulesOnly,
      tier: opts.tier,
    },
  });
}

export function formQuestionsFromContext(
  context: FormContext | null,
): string[] | undefined {
  return context?.allQuestions?.slice(0, 8).map((q) => q.label);
}
