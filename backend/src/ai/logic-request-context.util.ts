import {
  screenLabelsFromSnapshot,
  fieldTypeFromScreen,
} from '../analytics/insights-context.util';
import {
  questionLabel,
  questionTextFromConfig,
} from '../responses/answer-format.util';
import type { FormContext, FormContextScreen } from './form-context.types';
import type { GenerateLogicDto } from './ai.service.types';
import { DEPARTMENT_KEYWORDS, detectArchetype } from './quality/archetype.util';

type ScreenRecord = Record<string, unknown>;
type LogicContentScreen = FormContext['contentScreens'][number];

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function keyFor(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function normalizeObjectArray(raw: unknown): ScreenRecord[] {
  return Array.isArray(raw)
    ? raw.filter(
        (entry): entry is ScreenRecord =>
          !!entry && typeof entry === 'object' && !Array.isArray(entry),
      )
    : [];
}

function asNumberId(raw: unknown): number | null {
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : null;
}

function extractPurposeFromIntro(screens: ScreenRecord[]): string {
  const intro = screens.find((screen) => textValue(screen.type) === 'intro');
  if (!intro) return '';
  const config =
    intro.config &&
    typeof intro.config === 'object' &&
    !Array.isArray(intro.config)
      ? (intro.config as ScreenRecord)
      : {};
  return textValue(
    config.description,
    config.subtitle,
    intro.description,
    intro.subtitle,
  ).trim();
}

function deriveChoiceOptions(screen: ScreenRecord): string[] | undefined {
  const config =
    screen.config &&
    typeof screen.config === 'object' &&
    !Array.isArray(screen.config)
      ? (screen.config as ScreenRecord)
      : {};
  const options = [config.singleOptions, config.multipleOptions]
    .filter((value): value is unknown[] => Array.isArray(value))
    .flat()
    .filter(
      (value): value is string =>
        typeof value === 'string' && value.trim() !== '',
    )
    .slice(0, 12);
  return options.length ? options : undefined;
}

function buildContentScreens(
  screens: ScreenRecord[],
  rawContentScreens: ScreenRecord[],
): FormContext['contentScreens'] {
  const screenById = new Map(
    screens
      .map((screen) => [keyFor(screen.id), screen] as const)
      .filter(([id]) => id !== ''),
  );

  if (rawContentScreens.length > 0) {
    const next: LogicContentScreen[] = [];
    for (const screen of rawContentScreens) {
      const id = asNumberId(screen.id);
      if (id == null) continue;
      const fallback = screenById.get(textValue(id));
      const options = Array.isArray(screen.options)
        ? screen.options.filter(
            (value): value is string =>
              typeof value === 'string' && value.trim() !== '',
          )
        : deriveChoiceOptions(fallback ?? screen);
      // Builder screens carry the block-type name in `label` ("Long text"),
      // so the owner's question text in config must win or the LLM never
      // sees what is actually being asked.
      const configText =
        questionTextFromConfig(screen) ||
        (fallback ? questionTextFromConfig(fallback) : '');
      next.push({
        id,
        label:
          configText ||
          textValue(
            screen.label,
            fallback ? questionLabel(fallback) : undefined,
            `Question ${id}`,
          ),
        fields: Array.isArray(screen.fields) ? (screen.fields as object[]) : [],
        fieldType:
          typeof screen.fieldType === 'string' && screen.fieldType.trim()
            ? screen.fieldType
            : fieldTypeFromScreen(fallback ?? screen),
        ...(options?.length ? { options } : {}),
      });
    }
    return next;
  }

  const next: LogicContentScreen[] = [];
  for (const screen of screens) {
    if (textValue(screen.type) !== 'content') continue;
    const id = asNumberId(screen.id);
    if (id == null) continue;
    const fields = Array.isArray(screen.fields)
      ? (screen.fields as object[])
      : [];
    const options = deriveChoiceOptions(screen);
    next.push({
      id,
      label: questionLabel(screen),
      fields,
      fieldType: fieldTypeFromScreen(screen),
      ...(options?.length ? { options } : {}),
    });
  }
  return next;
}

function buildContextScreens(
  screens: ScreenRecord[],
  contentScreens: FormContext['contentScreens'],
): FormContextScreen[] {
  const screenById = new Map(
    screens
      .map((screen) => [keyFor(screen.id), screen] as const)
      .filter(([id]) => id !== ''),
  );
  return contentScreens.map((screen) => {
    const raw = screenById.get(textValue(screen.id));
    const config =
      raw?.config &&
      typeof raw.config === 'object' &&
      !Array.isArray(raw.config)
        ? (raw.config as Record<string, unknown>)
        : undefined;
    return {
      screenId: screen.id,
      label: screen.label,
      fieldType: screen.fieldType ?? 'text',
      config,
      fields: screen.fields as Record<string, unknown>[],
    };
  });
}

export function buildLogicRequestContext(
  formId: string,
  input: GenerateLogicDto,
  fallbackTitle = 'Untitled Form',
): FormContext {
  const screens = normalizeObjectArray(input.screens);
  const rawContentScreens = normalizeObjectArray(input.contentScreens);
  const title =
    textValue(input.formTitle, fallbackTitle).trim() || fallbackTitle;
  const purpose = extractPurposeFromIntro(screens);
  const snapshot = {
    title,
    formTitle: title,
    screens,
    contentScreens: rawContentScreens,
  };
  const contentScreens = buildContentScreens(screens, rawContentScreens);
  const contextScreens = buildContextScreens(screens, contentScreens);
  const departmentFields = contextScreens
    .filter((screen) => DEPARTMENT_KEYWORDS.test(screen.label))
    .map((screen) => textValue(screen.screenId));

  return {
    formId,
    title,
    purpose,
    archetype: detectArchetype(snapshot, title, purpose),
    screens: contextScreens,
    contentScreens,
    logicGraph: { connections: [], ifRulesByEdge: {} },
    responseStats: {
      count: 0,
      processedCount: 0,
      completionRate: 0,
      avgQuality: null,
    },
    recentAnswersExcerpt: '',
    departmentFields,
    screenLabels: screenLabelsFromSnapshot(snapshot),
    snapshot,
    memoryChunks: [],
  };
}
