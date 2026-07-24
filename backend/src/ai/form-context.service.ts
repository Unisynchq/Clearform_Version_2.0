import { Injectable, NotFoundException } from '@nestjs/common';
import { ResponseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseSnapshotScreens,
  questionLabel,
} from '../responses/answer-format.util';
import {
  collectQuestionAnswers,
  fieldTypeFromScreen,
  formatQaExcerpt,
  screenLabelsFromSnapshot,
} from '../analytics/insights-context.util';
import {
  resolveHelperTextFromScreen,
  resolveQuestionTextFromScreen,
} from './snapshot-screen.util';
import {
  customInstructionsFromScreen,
  qualityOptionsFromScreen,
} from './quality/quality-snapshot.util';
import { resolveFormPurpose } from './quality/form-purpose.util';
import { DEPARTMENT_KEYWORDS, detectArchetype } from './quality/archetype.util';
import type {
  FormContext,
  FormContextQuestionSummary,
  FormContextScreen,
} from './form-context.types';

export type {
  FormArchetype,
  FormContext,
  FormContextScreen,
} from './form-context.types';

function textValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function titleFromSnapshotOrForm(
  snapshot: unknown,
  fallbackTitle: string,
): string {
  if (!snapshot || typeof snapshot !== 'object') return fallbackTitle.trim();
  return textValue(
    (snapshot as Record<string, unknown>).title,
    fallbackTitle,
  ).trim();
}

function detectDepartmentFields(snapshot: unknown): string[] {
  const screens = parseSnapshotScreens(snapshot).filter(
    (s) => s.type === 'content',
  );
  const fields: string[] = [];
  for (const screen of screens) {
    const cfg = screen.config ?? {};
    const q = textValue(
      cfg.singleQuestion,
      cfg.multipleQuestion,
      cfg.question,
      screen.label,
    );
    if (DEPARTMENT_KEYWORDS.test(q)) {
      fields.push(textValue(screen.id));
    }
  }
  return fields;
}

function extractLogicGraph(snapshot: unknown): FormContext['logicGraph'] {
  if (!snapshot || typeof snapshot !== 'object') {
    return { connections: [], ifRulesByEdge: {} };
  }
  const s = snapshot as Record<string, unknown>;
  const logic = (s.logic ?? s.formLogic ?? {}) as Record<string, unknown>;
  const topLevelConnections = Array.isArray(s.logicConnections)
    ? (s.logicConnections as unknown[])
    : [];
  const topLevelIfRules =
    s.logicIfRulesByEdge && typeof s.logicIfRulesByEdge === 'object'
      ? (s.logicIfRulesByEdge as Record<string, unknown>)
      : {};
  return {
    connections: topLevelConnections.length
      ? topLevelConnections
      : Array.isArray(logic.connections)
        ? logic.connections
        : [],
    ifRulesByEdge:
      Object.keys(topLevelIfRules).length > 0
        ? topLevelIfRules
        : logic.ifRulesByEdge && typeof logic.ifRulesByEdge === 'object'
          ? (logic.ifRulesByEdge as Record<string, unknown>)
          : {},
  };
}

export type BuildForQualityOptions = {
  /** Owner builder preview — prefer unsaved builderSnapshot over published. */
  preferBuilderSnapshot?: boolean;
};

@Injectable()
export class FormContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildForForm(formId: string, range = 'all'): Promise<FormContext> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { settings: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const snapshot = form.publishedSnapshot ?? form.builderSnapshot ?? null;
    const intro =
      snapshot && typeof snapshot === 'object'
        ? ((snapshot as Record<string, unknown>).intro as
            | Record<string, unknown>
            | undefined)
        : undefined;
    const purpose = textValue(intro?.description, intro?.subtitle).trim();
    const title = titleFromSnapshotOrForm(snapshot, form.title);

    const cutoff = this.rangeCutoff(range);
    const dateFilter = cutoff ? { gte: cutoff } : undefined;
    const responseWhere = {
      formId,
      ...(dateFilter && { createdAt: dateFilter }),
    };

    const [total, processed, avg, recentRows] = await Promise.all([
      this.prisma.formResponse.count({
        where: {
          ...responseWhere,
          status: { not: ResponseStatus.ABANDONED },
        },
      }),
      this.prisma.formResponse.count({
        where: { ...responseWhere, status: 'PROCESSED' },
      }),
      this.prisma.formResponse.aggregate({
        where: {
          formId,
          qualityScore: { not: null },
          ...(dateFilter && { createdAt: dateFilter }),
        },
        _avg: { qualityScore: true },
      }),
      this.prisma.formResponse.findMany({
        where: responseWhere,
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { payload: true },
      }),
    ]);

    const contentScreensRaw = parseSnapshotScreens(snapshot).filter(
      (s) => s.type === 'content' && s.id != null,
    );

    const screens: FormContextScreen[] = contentScreensRaw.map((s) => ({
      screenId: s.id!,
      label: questionLabel(s),
      fieldType: fieldTypeFromScreen(s),
      config: s.config,
      qualityOptions: qualityOptionsFromScreen(s),
      customInstructions: customInstructionsFromScreen(s),
    }));

    const contentScreens = contentScreensRaw.map((s) => {
      const ext = s as { fields?: unknown[] };
      return {
        id: Number(s.id),
        label: questionLabel(s),
        fields: (Array.isArray(ext.fields) ? ext.fields : []) as object[],
      };
    });

    const qaRows = collectQuestionAnswers(
      snapshot,
      recentRows.map((r) => r.payload),
    );

    return {
      formId,
      title,
      purpose,
      archetype: detectArchetype(snapshot, title, purpose),
      screens,
      contentScreens,
      logicGraph: extractLogicGraph(snapshot),
      responseStats: {
        count: total,
        processedCount: processed,
        completionRate: total > 0 ? Math.round((processed / total) * 100) : 0,
        avgQuality: avg._avg.qualityScore
          ? Math.round(avg._avg.qualityScore)
          : null,
      },
      recentAnswersExcerpt: formatQaExcerpt(qaRows, 30),
      departmentFields: detectDepartmentFields(snapshot),
      screenLabels: screenLabelsFromSnapshot(snapshot),
      snapshot,
      memoryChunks: [],
    };
  }

  // Lightweight alternative to buildForForm for logic generation.
  // Skips response history, stats, and recent answers — logic only needs the snapshot.
  async buildForLogicOnly(formId: string): Promise<FormContext> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { title: true, publishedSnapshot: true, builderSnapshot: true },
    });
    if (!form) throw new NotFoundException('Form not found');

    const snapshot = form.publishedSnapshot ?? form.builderSnapshot ?? null;
    const intro =
      snapshot && typeof snapshot === 'object'
        ? ((snapshot as Record<string, unknown>).intro as
            | Record<string, unknown>
            | undefined)
        : undefined;
    const purpose = textValue(intro?.description, intro?.subtitle).trim();
    const title = titleFromSnapshotOrForm(snapshot, form.title);

    const contentScreensRaw = parseSnapshotScreens(snapshot).filter(
      (s) => s.type === 'content' && s.id != null,
    );
    const screens: FormContextScreen[] = contentScreensRaw.map((s) => ({
      screenId: s.id!,
      label: questionLabel(s),
      fieldType: fieldTypeFromScreen(s),
      config: s.config,
      qualityOptions: qualityOptionsFromScreen(s),
      customInstructions: customInstructionsFromScreen(s),
    }));
    const contentScreens = contentScreensRaw.map((s) => {
      const ext = s as { fields?: unknown[] };
      const config = s.config ?? {};
      // Choice option labels let the model write real if-rules
      // (e.g. answer == "Student") instead of generic is_not_empty branches.
      const options = [config.singleOptions, config.multipleOptions]
        .filter((v): v is unknown[] => Array.isArray(v))
        .flat()
        .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
        .slice(0, 12);
      return {
        id: Number(s.id),
        label: questionLabel(s),
        fields: (Array.isArray(ext.fields) ? ext.fields : []) as object[],
        fieldType: fieldTypeFromScreen(s),
        ...(options.length ? { options } : {}),
      };
    });

    return {
      formId,
      title,
      purpose,
      archetype: detectArchetype(snapshot, title, purpose),
      screens,
      contentScreens,
      logicGraph: extractLogicGraph(snapshot),
      responseStats: {
        count: 0,
        processedCount: 0,
        completionRate: 0,
        avgQuality: null,
      },
      recentAnswersExcerpt: '',
      departmentFields: detectDepartmentFields(snapshot),
      screenLabels: screenLabelsFromSnapshot(snapshot),
      snapshot,
      memoryChunks: [],
    };
  }

  // Minimal context for keystroke response-quality evaluation.
  // Skips all response history DB queries — only loads the snapshot and the target screen.
  async buildForQualityOnly(
    formId: string,
    screenId?: number | string,
    opts: BuildForQualityOptions = {},
  ): Promise<FormContext> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: {
        title: true,
        publishedSnapshot: true,
        builderSnapshot: true,
        owner: { select: { firstName: true, lastName: true } },
      },
    });
    if (!form) throw new NotFoundException('Form not found');

    const ownerFirst = form.owner?.firstName?.trim();
    const audienceLabel = ownerFirst
      ? `${ownerFirst}${form.owner?.lastName?.trim() ? ` ${form.owner.lastName.trim().charAt(0)}.` : ''}`
      : undefined;

    const snapshot = (
      opts.preferBuilderSnapshot
        ? (form.builderSnapshot ?? form.publishedSnapshot)
        : (form.publishedSnapshot ?? form.builderSnapshot)
    ) as Record<string, unknown> | null;
    const title = titleFromSnapshotOrForm(snapshot, form.title);
    const purpose = resolveFormPurpose(snapshot, title);

    const allContentScreensRaw = parseSnapshotScreens(snapshot).filter(
      (s) => s.type === 'content' && s.id != null,
    );
    const contentScreensRaw =
      screenId != null
        ? allContentScreensRaw.filter(
            (s) => textValue(s.id) === textValue(screenId),
          )
        : allContentScreensRaw;

    const allQuestions: FormContextQuestionSummary[] = allContentScreensRaw.map(
      (s) => ({
        screenId: s.id!,
        label: resolveQuestionTextFromScreen(s as Record<string, unknown>),
        helperText: resolveHelperTextFromScreen(s as Record<string, unknown>),
        fieldType: fieldTypeFromScreen(s),
      }),
    );
    const screens: FormContextScreen[] = contentScreensRaw.map((s) => ({
      screenId: s.id!,
      label: questionLabel(s),
      fieldType: fieldTypeFromScreen(s),
      config: s.config,
      qualityOptions: qualityOptionsFromScreen(s),
      customInstructions: customInstructionsFromScreen(s),
    }));
    const contentScreens = contentScreensRaw.map((s) => {
      const ext = s as { fields?: unknown[] };
      return {
        id: Number(s.id),
        label: questionLabel(s),
        fields: (Array.isArray(ext.fields) ? ext.fields : []) as object[],
      };
    });

    return {
      formId,
      title,
      purpose,
      audienceLabel,
      archetype: detectArchetype(snapshot, title, purpose),
      screens,
      contentScreens,
      allQuestions,
      currentScreenId: screenId,
      logicGraph: snapshot
        ? extractLogicGraph(snapshot)
        : { connections: [], ifRulesByEdge: {} },
      responseStats: {
        count: 0,
        processedCount: 0,
        completionRate: 0,
        avgQuality: null,
      },
      recentAnswersExcerpt: '',
      departmentFields: [],
      screenLabels: screenLabelsFromSnapshot(snapshot),
      snapshot,
      memoryChunks: [],
    };
  }

  async build(
    formId: string,
    opts?: { range?: string; memoryChunks?: string[] },
  ): Promise<FormContext> {
    const ctx = await this.buildForForm(formId, opts?.range ?? 'all');
    const chunks = opts?.memoryChunks ?? [];
    if (chunks.length === 0) return ctx;
    return {
      ...ctx,
      memoryChunks: chunks,
      recentAnswersExcerpt: this.withMemoryExcerpt(ctx, chunks.join('\n'))
        .recentAnswersExcerpt,
    };
  }

  allScreensForLogic(ctx: FormContext): {
    id: number;
    label: string;
    type: string;
    config?: object;
  }[] {
    const screens = parseSnapshotScreens(ctx.snapshot);
    return screens
      .filter((s) => s.id != null)
      .map((s) => ({
        id: Number(s.id),
        label: textValue(s.label, s.type, 'Screen'),
        type: textValue(s.type, 'content'),
        config: s.config,
      }));
  }

  contentScreensForLogic(ctx: FormContext): {
    id: number;
    label: string;
    fields: object[];
  }[] {
    return ctx.contentScreens.map((s) => ({
      id: s.id,
      label: s.label,
      fields: s.fields,
    }));
  }

  /** Merge RAG memory excerpt into context (Phase 3). */
  withMemoryExcerpt(context: FormContext, memoryExcerpt: string): FormContext {
    if (!memoryExcerpt.trim()) return context;
    return {
      ...context,
      recentAnswersExcerpt: `${context.recentAnswersExcerpt}\n\nPast patterns:\n${memoryExcerpt}`,
    };
  }

  private rangeCutoff(range?: string): Date | undefined {
    if (!range || range === 'all') return undefined;
    const days =
      range === '7d'
        ? 7
        : range === '30d'
          ? 30
          : range === '90d'
            ? 90
            : undefined;
    if (!days) return undefined;
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
