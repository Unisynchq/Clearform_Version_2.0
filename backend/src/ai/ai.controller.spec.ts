import type { EvaluateQualityDto } from './ai.service.types';
import { AiController, resolveSnapshotQualityContext } from './ai.controller';
import type { AiService } from './ai.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { FormAiRateLimitService } from '../common/form-ai-rate-limit.service';
import type { AiTierService } from './ai-tier.service';
import type { AiEntitlementsService } from '../billing/entitlements/ai-entitlements.service';
import type { ImproveInstructionsService } from './quality/improve-instructions.service';
import type { LlmGatewayService } from './llm-gateway.service';

describe('resolveSnapshotQualityContext', () => {
  const dto: EvaluateQualityDto = {
    screenId: '12',
    fieldId: 'long-text',
    questionText: 'Request question',
    helperText: 'Request helper',
    options: {
      length: { enabled: false, minWords: 1 },
    },
    nextScreenLabels: ['Request next'],
  };

  it('prefers snapshot-owned quality fields for public/respondent traffic', () => {
    const resolved = resolveSnapshotQualityContext({
      dto,
      requestOwnerFields: false,
      questionText: 'Snapshot question',
      helperText: 'Snapshot helper',
      nextScreenLabels: ['Snapshot next'],
      formTitle: 'Snapshot form',
      formPurpose: 'Snapshot purpose',
      options: {
        length: { enabled: true, minWords: 10 },
      },
      customInstructions: 'Snapshot guidance',
      logicSummary: 'Snapshot logic',
    });

    expect(resolved.questionText).toBe('Snapshot question');
    expect(resolved.helperText).toBe('Snapshot helper');
    expect(resolved.nextScreenLabels).toEqual(['Snapshot next']);
    expect(resolved.options).toEqual({
      length: { enabled: true, minWords: 10 },
    });
    expect(resolved.customInstructions).toBe('Snapshot guidance');
    expect(resolved.logicSummary).toBe('Snapshot logic');
    expect(resolved.formTitle).toBe('Snapshot form');
    expect(resolved.formPurpose).toBe('Snapshot purpose');
  });

  it('lets the owner preview unsaved request fields while keeping snapshot guidance', () => {
    const resolved = resolveSnapshotQualityContext({
      dto,
      requestOwnerFields: true,
      questionText: 'Snapshot question',
      helperText: 'Snapshot helper',
      nextScreenLabels: ['Snapshot next'],
      options: {
        length: { enabled: true, minWords: 10 },
      },
      customInstructions: 'Snapshot guidance',
      logicSummary: 'Snapshot logic',
    });

    expect(resolved.questionText).toBe('Request question');
    expect(resolved.helperText).toBe('Request helper');
    expect(resolved.nextScreenLabels).toEqual(['Request next']);
    expect(resolved.options).toEqual({
      length: { enabled: false, minWords: 1 },
    });
    expect(resolved.customInstructions).toBe('Snapshot guidance');
    expect(resolved.logicSummary).toBe('Snapshot logic');
  });
});

describe('AiController.enrichWithSnapshotContext', () => {
  const baseDto: EvaluateQualityDto = {
    screenId: '12',
    fieldId: 'short-text',
    questionText: 'Request question',
    helperText: 'Request helper',
    options: {
      length: { enabled: false, minWords: 1 },
    },
  };

  function buildController() {
    const prismaMock = {
      form: {
        findUnique: jest.fn().mockResolvedValue({
          builderSnapshot: {
            title: 'Snapshot form',
            screens: [
              {
                id: 12,
                type: 'content',
                label: 'Short text',
                config: {
                  shortTextQuestion: 'Snapshot question',
                  shortTextHelperText: 'Snapshot helper',
                  shortTextResponseQualityOptions: {
                    customInstructions: 'Snapshot guidance',
                    length: { enabled: true, minWords: 8 },
                  },
                },
              },
            ],
          },
          publishedSnapshot: null,
        }),
      },
    };

    return new AiController(
      {} as AiService,
      prismaMock as unknown as PrismaService,
      {} as FormAiRateLimitService,
      {} as AiTierService,
      {} as AiEntitlementsService,
      {} as ImproveInstructionsService,
      {} as LlmGatewayService,
    );
  }

  function enrichSnapshotContext(
    controller: AiController,
    dto: EvaluateQualityDto,
    requestOwnerFields = false,
  ) {
    const enrich = Reflect.get(controller, 'enrichWithSnapshotContext') as (
      formId: string,
      payload: EvaluateQualityDto,
      requestOwnerFields?: boolean,
    ) => Promise<EvaluateQualityDto>;
    return enrich.call(controller, 'form-1', dto, requestOwnerFields);
  }

  it('overrides public request text with snapshot-owned text', async () => {
    const controller = buildController();

    const resolved = await enrichSnapshotContext(controller, baseDto, false);

    expect(resolved.questionText).toBe('Snapshot question');
    expect(resolved.helperText).toBe('Snapshot helper');
    expect(resolved.options).toEqual(
      expect.objectContaining({
        length: { enabled: true, minWords: 8 },
        customInstructions: 'Snapshot guidance',
      }),
    );
    expect(resolved.customInstructions).toBe('Snapshot guidance');
  });

  it('keeps owner preview request text while still using snapshot guidance', async () => {
    const controller = buildController();

    const resolved = await enrichSnapshotContext(controller, baseDto, true);

    expect(resolved.questionText).toBe('Request question');
    expect(resolved.helperText).toBe('Request helper');
    expect(resolved.options).toEqual({
      length: { enabled: false, minWords: 1 },
    });
    expect(resolved.customInstructions).toBe('Snapshot guidance');
  });
});
