import {
  ImproveInstructionsService,
  contextualImproveInstructions,
  isBoilerplateInstructions,
  isSubstantiallySameInstructions,
} from './improve-instructions.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { LlmGatewayService } from '../llm-gateway.service';
import type { AiTierService } from '../ai-tier.service';
import type { QuestionIntentService } from '../question-intent/question-intent.service';
import { HttpException } from '@nestjs/common';

describe('ImproveInstructionsService', () => {
  function buildService(opts: {
    llmContent?: string | null;
    /** Sequential responses — overrides llmContent when provided. */
    llmContents?: Array<string | null>;
    llmConfigured?: boolean;
    formExists?: boolean;
    intent?: string;
  }) {
    const prisma = {
      form: {
        findFirst: jest.fn().mockResolvedValue(
          opts.formExists === false ? null : { id: 'form-1' },
        ),
      },
    };
    const completion = jest.fn();
    if (opts.llmContents) {
      for (const content of opts.llmContents) {
        completion.mockResolvedValueOnce(content);
      }
    } else {
      completion.mockResolvedValue(opts.llmContent ?? null);
    }
    const llm = {
      isConfigured: jest.fn().mockReturnValue(opts.llmConfigured ?? true),
      completion,
    };
    const aiTier = {
      resolveTierForFormOwner: jest.fn().mockResolvedValue('free'),
    };
    const doctrine = {
      getDoctrineSlim: jest.fn().mockReturnValue('improve doctrine'),
    };
    const formContext = {
      buildForQualityOnly: jest.fn().mockResolvedValue({
        title: 'Hackathon feedback',
        purpose: 'Improve onboarding',
        archetype: 'generic',
        allQuestions: [
          { screenId: 1, label: 'How was your experience?', helperText: '' },
        ],
        screens: [
          {
            screenId: 1,
            label: 'How was your experience?',
            fieldType: 'long-text',
            customInstructions: '',
          },
        ],
        snapshot: { screens: [{ id: 1, type: 'content' }], logicConnections: [] },
        currentScreenId: 1,
      }),
    };
    const questionIntent = {
      classify: jest.fn().mockResolvedValue(opts.intent ?? 'generic'),
    };
    return {
      service: new ImproveInstructionsService(
        prisma as unknown as PrismaService,
        llm as unknown as LlmGatewayService,
        aiTier as unknown as AiTierService,
        doctrine as never,
        formContext as never,
        questionIntent as unknown as QuestionIntentService,
      ),
      llm,
      formContext,
      doctrine,
      questionIntent,
    };
  }

  it('returns LLM-improved instructions when model responds', async () => {
    const { service } = buildService({
      llmContent: JSON.stringify({
        customInstructions:
          'I want responses that name the file and what should change in the project.',
      }),
    });

    const result = await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: 'need file names',
      questionText: 'What should we fix?',
    });

    expect(result.meta.source).toBe('llm');
    expect(result.customInstructions).toContain('file');
  });

  it('loads improve doctrine with the resolved question intent', async () => {
    const { service, doctrine, questionIntent } = buildService({
      llmContent: JSON.stringify({
        customInstructions:
          'Require the measurable impact and the role they played in the project.',
      }),
      intent: 'achievement',
    });

    await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: 'need measurable impact',
      questionText: 'Describe your most significant achievement',
    });

    expect(questionIntent.classify).toHaveBeenCalled();
    expect(doctrine.getDoctrineSlim).toHaveBeenCalledWith(
      'improve-instructions',
      'achievement',
    );
  });

  it('throws when LLM is unavailable', async () => {
    const { service } = buildService({ llmConfigured: false });

    await expect(
      service.improveForOwner('form-1', 'user-1', {
        draftInstructions: 'specificity and relevance',
        questionText: 'Tell us more',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('contextual fallback rewrites owner drafts that already contain "want"', () => {
    const draft =
      'I want relevant experience with a example on what they worked on.';
    const improved = contextualImproveInstructions(
      draft,
      'How many years of relevant experience do you have?',
      'Include only directly related roles.',
    );

    expect(isSubstantiallySameInstructions(improved, draft)).toBe(false);
    expect(improved).toMatch(/relevant experience/i);
    expect(improved).toMatch(/green when/i);
  });

  it('falls back to contextual polish when LLM output is unchanged from the draft', async () => {
    const unchanged =
      'I want relevant experience with a example on what they worked on.';
    const { service } = buildService({
      llmContent: JSON.stringify({ customInstructions: unchanged }),
    });

    const result = await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: unchanged,
      questionText: 'How many years of relevant experience do you have?',
      helperText: 'Include only directly related roles.',
    });

    expect(result.meta.source).toBe('contextual_fallback');
    expect(
      isSubstantiallySameInstructions(result.customInstructions, unchanged),
    ).toBe(false);
  });

  it('throws when LLM is unavailable and draft is empty', async () => {
    const { service } = buildService({ llmConfigured: false });

    await expect(
      service.improveForOwner('form-1', 'user-1', {
        draftInstructions: '',
        questionText: 'Describe your most significant professional achievement',
        helperText: 'Include measurable impact.',
      }),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('accepts plain-text LLM output when JSON wrapper is missing', async () => {
    const plain =
      'I want responses that name measurable impact, the respondent role, and one concrete example from the project.';
    const { service } = buildService({ llmContent: plain });

    const result = await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: 'need measurable impact',
      questionText: 'Describe your achievement',
    });

    expect(result.meta.source).toBe('llm');
    expect(result.customInstructions).toContain('measurable impact');
  });

  it('retries once when the first LLM output is boilerplate and returns the grounded rewrite', async () => {
    const boilerplate =
      'Green when on-topic with useful detail; amber when thin but on-topic; red for gibberish, repetition, or off-topic.';
    const grounded =
      'Require the exact onboarding step where they got stuck and what they expected instead. Green when they name the step and the friction; amber when they only say it was confusing; red for off-topic or gibberish.';
    const { service, llm } = buildService({
      llmContents: [
        JSON.stringify({ customInstructions: boilerplate }),
        JSON.stringify({ customInstructions: grounded }),
      ],
    });

    const result = await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: 'where they got stuck during onboarding',
      questionText: 'Where did you get stuck during onboarding?',
    });

    expect(llm.completion).toHaveBeenCalledTimes(2);
    const retryPrompt = (
      llm.completion.mock.calls[1][0] as {
        messages: Array<{ role: string; content: string }>;
      }
    ).messages[1].content;
    expect(retryPrompt).toContain('Corrective retry');
    expect(result.meta.source).toBe('llm');
    expect(result.customInstructions).toBe(grounded);
  });

  it('falls back with reason llm_boilerplate when both attempts return boilerplate', async () => {
    const boilerplate =
      'Green when on-topic with useful detail; amber when thin but on-topic; red for gibberish, repetition, or off-topic.';
    const { service, llm } = buildService({
      llmContents: [
        JSON.stringify({ customInstructions: boilerplate }),
        JSON.stringify({ customInstructions: boilerplate }),
      ],
    });

    const result = await service.improveForOwner('form-1', 'user-1', {
      draftInstructions: 'where they got stuck during onboarding',
      questionText: 'Where did you get stuck during onboarding?',
    });

    expect(llm.completion).toHaveBeenCalledTimes(2);
    expect(result.meta.source).toBe('contextual_fallback');
    expect(result.meta.reason).toBe('llm_boilerplate');
  });

  describe('isBoilerplateInstructions', () => {
    it('flags the canned scoring template', () => {
      expect(
        isBoilerplateInstructions(
          'Green when on-topic with useful detail; amber when thin; red for gibberish or off-topic.',
          'Where did you get stuck during onboarding?',
        ),
      ).toBe(true);
    });

    it('flags banned fluff phrases from the doctrine', () => {
      expect(
        isBoilerplateInstructions(
          'Require responses with more substance and clarity about the topic.',
          'Where did you get stuck during onboarding?',
        ),
      ).toBe(true);
    });

    it('flags canned scoring that never touches the question topic', () => {
      expect(
        isBoilerplateInstructions(
          'Require useful answers. Amber when thin but trying; make sure they elaborate properly.',
          'Which payment gateway failed during checkout?',
          'Name the gateway and the failure screen.',
        ),
      ).toBe(true);
    });

    it('accepts question-grounded directives even with scoring language', () => {
      expect(
        isBoilerplateInstructions(
          'For "Where did you get stuck during onboarding?": require the exact step and what they expected. Amber when thin on the step name; red for gibberish.',
          'Where did you get stuck during onboarding?',
        ),
      ).toBe(false);
    });

    it('accepts specific directives that paraphrase the topic', () => {
      expect(
        isBoilerplateInstructions(
          'Require the measurable impact, the respondent role, and one concrete example from the project.',
          'Describe your achievement',
        ),
      ).toBe(false);
    });
  });
});
