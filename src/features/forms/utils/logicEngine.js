/**
 * If/Then logic evaluation and navigation resolution.
 */

const toNumber = (v) => {
  if (v === '' || v == null) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const toString = (v) => (v == null ? '' : String(v).trim());

const splitMultiValue = (v) =>
  String(v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Build normalized field-id → answer map from ContentCard preview snap */
export function buildLogicAnswersFromScreen(screen, snap) {
  if (!screen || !snap) return {};
  const pf = (k, def = '') => String(snap.previewFields?.[k] ?? def).trim();
  const label = screen.label;
  const answers = {};

  if (label === 'Rating') {
    answers.rating = snap.ratingValue ?? 0;
    answers['opinion-scale'] = snap.ratingValue ?? 0;
    answers.ranking = snap.ratingValue ?? 0;
  }

  if (label === 'Short text') {
    answers['short-text'] = String(snap.shortTextDraft ?? '').trim();
  }
  if (label === 'Long text') {
    answers['long-text'] = String(snap.longTextDraft ?? '').trim();
  }

  if (label === 'Contact') {
    answers['contact-info'] = [pf('c.fn'), pf('c.ln'), pf('c.em')].filter(Boolean).join(' ');
    answers.email = pf('c.em');
    answers['phone-number'] = pf('c.ph');
  }

  if (label === 'Address') {
    answers.address = [pf('a.st'), pf('a.ci'), pf('a.ste'), pf('a.po'), pf('a.ct')].filter(Boolean).join(', ');
  }

  if (label === 'Work Info') {
    const parts = [pf('w.co'), pf('w.ti'), pf('w.ind'), pf('w.ts')].filter(Boolean);
    answers['contact-info'] = parts.join(' ');
    answers['short-text'] = pf('w.ti');
    answers['long-text'] = pf('w.ind');
  }

  if (label === 'Single') {
    const picks = snap.previewPicks ?? [];
    answers['multiple-choice'] = picks[0] ?? '';
    answers['picture-choice'] = picks[0] ?? '';
  }

  if (label === 'Multiple') {
    const picks = snap.previewPicks ?? [];
    answers['multiple-choice'] = picks.join(', ');
    answers['picture-choice'] = picks[0] ?? '';
  }

  if (label === 'Media') {
    const picks = snap.previewPicks ?? [];
    answers['picture-choice'] = picks.length ? picks.join(', ') : '';
    answers['multiple-choice'] = picks.join(', ');
  }

  if (label === 'Date') {
    answers.date = pf('dateAns') || pf('date');
    answers.number = pf('numAns');
  }

  if (label === 'Time') {
    const sel = snap.timeSelection;
    if (sel) {
      const parts = [sel.hour, sel.minute, sel.second ?? 0].map((n) => String(n).padStart(2, '0'));
      answers.number = parts.join(':');
      answers.date = parts.join(':');
    } else {
      answers.date = pf('dateAns');
      answers.number = pf('numAns');
    }
  }

  if (label === 'Video') {
    answers['video-audio'] = pf('videoAns');
  }

  if (label === 'Upload' || label === 'Multi-image upload') {
    answers['file-upload'] = pf('uploadAns') || (snap.uploadedFiles?.length ? 'uploaded' : '');
  }

  if (label === 'Captcha') {
    answers['short-text'] = snap.captchaChecked ? 'passed' : '';
  }

  if (label === 'Heading') {
    answers['short-text'] = pf('headingAns');
  }
  if (label === 'Description') {
    answers['long-text'] = pf('descAns');
  }

  return answers;
}

/** Screens that appear before `currentScreenId` in form order. */
export function getPriorContentScreens(screens, currentScreenId) {
  const idx = screens.findIndex((s) => s.id === currentScreenId);
  if (idx < 0) return [];
  return screens.slice(0, idx).filter((s) => s.type === 'content');
}

/** Lookup answer for a condition that references a specific prior screen. */
export function getAnswerForCondition(condition, answersByScreenId) {
  const screenAnswers = answersByScreenId[condition.sourceScreenId] ?? {};
  return screenAnswers[condition.fieldId];
}

/** All conditions must match (AND). Empty list = visible. */
export function evaluateVisibilityConditions(conditions, answersByScreenId) {
  const list = conditions ?? [];
  if (!list.length) return true;
  return list.every((c) => {
    if (c.sourceScreenId == null || !c.fieldId) return false;
    const answer = getAnswerForCondition(c, answersByScreenId);
    return evaluateCondition(answer, c);
  });
}

export function isScreenVisibleInPreview(screen, answersByScreenId) {
  if (!screen || screen.type !== 'content') return true;
  const conditions = screen.config?.showIfConditions;
  return evaluateVisibilityConditions(conditions, answersByScreenId);
}

/** Resolve next screen, skipping content screens that fail visibility rules in preview. */
export function getSafeVisibilityAutoSkipTarget(screens, fromScreenId, nextId) {
  if (nextId == null || nextId === fromScreenId) return null;
  const nextScreen = screens.find((s) => s.id === nextId);
  if (!nextScreen || nextScreen.type === 'intro') return null;
  const fromIdx = screens.findIndex((s) => s.id === fromScreenId);
  const nextIdx = screens.findIndex((s) => s.id === nextId);
  if (fromIdx >= 0 && nextIdx >= 0 && nextIdx < fromIdx) return null;
  return nextId;
}

export function resolveVisibleNextScreenId(params) {
  const { fromScreenId, screens } = params;
  const visited = new Set();
  let cur = fromScreenId;

  while (cur != null && !visited.has(cur)) {
    visited.add(cur);
    const nextId = resolveNextScreenId({ ...params, fromScreenId: cur });
    if (nextId == null) return null;

    const nextScreen = screens.find((s) => s.id === nextId);
    if (!nextScreen || nextScreen.type !== 'content') return nextId;
    if (isScreenVisibleInPreview(nextScreen, params.answersByScreenId ?? {})) return nextId;

    cur = nextId;
  }

  return null;
}

export function evaluateCondition(answer, condition) {
  const { fieldId, operator, value } = condition;
  const target = value ?? '';

  const numAnswer = toNumber(answer);
  const numTarget = toNumber(target);
  const useNumeric = !Number.isNaN(numAnswer) && !Number.isNaN(numTarget);

  if (useNumeric) {
    switch (operator) {
      case 'gt':
        return numAnswer > numTarget;
      case 'lt':
        return numAnswer < numTarget;
      case 'eq':
        return numAnswer === numTarget;
      case 'neq':
        return numAnswer !== numTarget;
      case 'gte':
        return numAnswer >= numTarget;
      case 'lte':
        return numAnswer <= numTarget;
      default:
        return false;
    }
  }

  const a = toString(answer).toLowerCase();
  const t = toString(target).toLowerCase();

  switch (operator) {
    case 'eq':
      return a === t;
    case 'neq':
      return a !== t;
    case 'gt':
      return a > t;
    case 'lt':
      return a < t;
    case 'gte':
      return a >= t;
    case 'lte':
      return a <= t;
    case 'contains':
      return t.length > 0 && a.includes(t);
    case 'not_contains':
      return t.length === 0 || !a.includes(t);
    case 'includes': {
      if (!t.length) return false;
      const parts = splitMultiValue(answer);
      return parts.some((p) => p.toLowerCase() === t);
    }
    case 'not_includes': {
      if (!t.length) return true;
      const parts = splitMultiValue(answer);
      return !parts.some((p) => p.toLowerCase() === t);
    }
    case 'is_empty':
      return a.length === 0;
    case 'is_not_empty':
      return a.length > 0;
    default:
      return false;
  }
}

/** All conditions in a rule must match (AND) */
export function evaluateRule(rule, answersByScreenId, { fromScreenId } = {}) {
  const conditions = rule?.conditions ?? [];
  if (!conditions.length) return false;
  return conditions.every((c) => {
    let answer;
    if (c.sourceScreenId != null) {
      answer = getAnswerForCondition(c, answersByScreenId);
    } else if (fromScreenId != null && answersByScreenId && typeof answersByScreenId === 'object') {
      answer = (answersByScreenId[fromScreenId] ?? {})[c.fieldId];
    } else if (answersByScreenId && answersByScreenId[c.fieldId] !== undefined) {
      answer = answersByScreenId[c.fieldId];
    } else {
      answer = undefined;
    }
    return evaluateCondition(answer, c);
  });
}

export const logicEdgeKey = (fromId, toId) => `${fromId}-${toId}`;

/**
 * Resolve next screen when leaving `fromScreenId`.
 * Priority: per-edge if-rules (first matching connection) → else fallback → graph edges → linear order
 */
export function resolveNextScreenId({
  fromScreenId,
  screens,
  logicIfRulesByEdge = {},
  logicElseByScreen = {},
  logicIfRulesByScreen = {},
  logicConnections = [],
  answersByScreenId = {},
}) {
  const from = screens.find((s) => s.id === fromScreenId);
  if (!from) return null;

  const ifEdges = logicConnections
    .filter((c) => c.from === fromScreenId && c.kind === 'if')
    .sort((a, b) => a.to - b.to);

  for (const edge of ifEdges) {
    const edgeRules = logicIfRulesByEdge[logicEdgeKey(edge.from, edge.to)];
    if (!edgeRules?.rules?.length) continue;
    for (const rule of edgeRules.rules) {
      if (evaluateRule(rule, answersByScreenId, { fromScreenId })) {
        return edge.to;
      }
    }
  }

  const outgoing = logicConnections.filter((c) => c.from === fromScreenId && c.kind != null);
  const nextEdge = outgoing.find((c) => c.kind === 'next');
  if (nextEdge?.to != null) return nextEdge.to;

  for (const edge of ifEdges) {
    const edgeRules = logicIfRulesByEdge[logicEdgeKey(edge.from, edge.to)];
    if (edgeRules?.elseScreenId != null) return edgeRules.elseScreenId;
  }

  if (logicElseByScreen[fromScreenId] != null) {
    return logicElseByScreen[fromScreenId];
  }

  const screenRules = logicIfRulesByScreen[fromScreenId];
  if (screenRules?.rules?.length) {
    for (const rule of screenRules.rules) {
      if (evaluateRule(rule, answersByScreenId, { fromScreenId }) && rule.thenScreenId != null) {
        return rule.thenScreenId;
      }
    }
    if (screenRules.elseScreenId != null) {
      return screenRules.elseScreenId;
    }
  }

  const ifEdge = outgoing.find((c) => c.kind === 'if');
  if (ifEdge?.to != null) return ifEdge.to;

  const skipEdge = outgoing.find((c) => c.kind === 'skip');
  if (skipEdge?.to != null) return skipEdge.to;

  const endEdge = outgoing.find((c) => c.kind === 'end');
  if (endEdge?.to != null) return endEdge.to;

  const idx = screens.findIndex((s) => s.id === fromScreenId);
  if (idx >= 0 && idx < screens.length - 1) {
    return screens[idx + 1].id;
  }
  return null;
}

export function getOperatorsForFieldId(fieldId) {
  const numericFields = new Set([
    'rating',
    'opinion-scale',
    'ranking',
    'number',
    'date',
  ]);
  const textFields = new Set([
    'short-text',
    'long-text',
    'email',
    'contact-info',
    'address',
    'phone-number',
    'video-audio',
    'file-upload',
  ]);

  if (numericFields.has(fieldId)) {
    return [
      { id: 'gt', label: 'is greater than' },
      { id: 'lt', label: 'is less than' },
      { id: 'eq', label: 'is equal to' },
      { id: 'neq', label: 'is not equal to' },
      { id: 'gte', label: 'is greater than or equal to' },
      { id: 'lte', label: 'is less than or equal to' },
    ];
  }

  if (textFields.has(fieldId)) {
    return [
      { id: 'eq', label: 'is equal to' },
      { id: 'neq', label: 'is not equal to' },
      { id: 'contains', label: 'contains' },
      { id: 'not_contains', label: 'does not contain' },
      { id: 'is_empty', label: 'is empty' },
      { id: 'is_not_empty', label: 'is not empty' },
    ];
  }

  if (fieldId === 'multiple-choice' || fieldId === 'picture-choice') {
    return [
      { id: 'eq', label: 'is' },
      { id: 'neq', label: 'is not' },
      { id: 'includes', label: 'includes' },
      { id: 'not_includes', label: 'does not include' },
      { id: 'is_empty', label: 'is empty' },
      { id: 'is_not_empty', label: 'is not empty' },
    ];
  }

  return [
    { id: 'gt', label: 'is greater than' },
    { id: 'lt', label: 'is less than' },
    { id: 'eq', label: 'is equal to' },
    { id: 'neq', label: 'is not equal to' },
  ];
}

export function isNumericFieldId(fieldId) {
  return getOperatorsForFieldId(fieldId).some((o) => o.id === 'gt');
}

const VALUE_REQUIRED_OPERATORS = new Set([
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'contains',
  'not_contains',
  'includes',
  'not_includes',
]);

export function conditionRequiresValue(operator) {
  return VALUE_REQUIRED_OPERATORS.has(operator);
}

export function validateIfThenDraft(draft, destinationOptions) {
  const errors = [];
  const destIds = new Set(destinationOptions.map((d) => Number(d.id)));

  if (!draft?.rules?.length) {
    errors.push('Add at least one rule.');
  }

  draft?.rules?.forEach((rule, i) => {
    if (rule.thenScreenId == null || !destIds.has(Number(rule.thenScreenId))) {
      errors.push(`Rule ${i + 1}: choose a destination screen.`);
    }
    rule.conditions?.forEach((c, j) => {
      if (!c.fieldId) errors.push(`Rule ${i + 1}, condition ${j + 1}: choose a question.`);
      const emptyVal = c.value === '' || c.value == null;
      const noValueOp = c.operator === 'is_empty' || c.operator === 'is_not_empty';
      if (!noValueOp && emptyVal && conditionRequiresValue(c.operator)) {
        errors.push(`Rule ${i + 1}, condition ${j + 1}: enter a value.`);
      }
    });
  });

  if (draft?.elseScreenId != null && !destIds.has(Number(draft.elseScreenId))) {
    errors.push('Choose an else (fallback) destination.');
  }

  return errors;
}
