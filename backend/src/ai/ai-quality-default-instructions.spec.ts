import { DoctrineRegistry } from './doctrine/doctrine.registry';
import {
  buildDefaultOwnerPromptForQuestion,
  setDefaultOwnerPromptRegistry,
} from './quality/default-owner-quality-prompt';
import { buildDefaultOwnerInstructions } from './ai-quality.util';

describe('buildDefaultOwnerInstructions', () => {
  beforeAll(() => {
    const registry = new DoctrineRegistry({} as never);
    // Cache owner-quality defaults without Redis (same path as onModuleInit).
    registry.getDefaultOwnerGuidanceBlock();
    setDefaultOwnerPromptRegistry(registry);
  });

  it('returns name guidance for name questions', () => {
    const text = buildDefaultOwnerInstructions(
      { screenId: '1', fieldId: 'short-text', questionText: 'What is your full name?' },
      'identity',
    );
    expect(text).toMatch(/first.*last/i);
  });

  it('returns project guidance for fix questions', () => {
    const text = buildDefaultOwnerInstructions(
      {
        screenId: '1',
        fieldId: 'short-text',
        questionText: 'What specific thing you want to make correct in your project',
      },
      'generic',
    );
    expect(text).toMatch(/fix/i);
  });

  describe('buildDefaultOwnerPromptForQuestion with classifier intent', () => {
    it('uses the intent defaults section and quotes the question', () => {
      const text = buildDefaultOwnerPromptForQuestion(
        'Describe your most significant achievement',
        undefined,
        'achievement',
      );
      expect(text).toMatch(/^For "Describe your most significant achievement":/);
      expect(text).toMatch(/measurable impact/i);
    });

    it('maps yes_no to the factual_short defaults section', () => {
      const text = buildDefaultOwnerPromptForQuestion(
        'Do you use the export feature?',
        undefined,
        'yes_no',
      );
      expect(text).toMatch(/never ask for narrative detail/i);
    });

    it('falls through to the question-regex path for generic intent', () => {
      const text = buildDefaultOwnerPromptForQuestion(
        'What specific thing you want to make correct in your project',
        undefined,
        'generic',
      );
      expect(text).toMatch(/fix/i);
    });
  });
});
