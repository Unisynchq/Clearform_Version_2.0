import { GroundingValidatorService } from './grounding-validator.service';

describe('GroundingValidatorService.validateQualityResult', () => {
  const service = new GroundingValidatorService();

  it('accepts green with empty suggestions (doctrine contract)', () => {
    const result = service.validateQualityResult({
      level: 'green',
      message:
        'You named the backend file and what to change — that is exactly what we needed.',
      failedIds: [],
      suggestions: [],
      answerText: 'backend main.py file have to be changed',
    });
    expect(result).toEqual({ ok: true });
  });

  it('accepts green with one near-complete perfection tip', () => {
    const result = service.validateQualityResult({
      level: 'green',
      message:
        'Strong start on "Clearform team" — add measurable impact to make it complete.',
      failedIds: [],
      suggestions: [
        'Add one measurable outcome (a number, %, or count) to make this complete.',
      ],
      answerText: 'I led the Clearform team through a major release.',
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects green with generic perfection tip', () => {
    const result = service.validateQualityResult({
      level: 'green',
      message: 'Good detail.',
      failedIds: [],
      suggestions: ['Add more detail.'],
    });
    expect(result.ok).toBe(false);
  });

  it('accepts red with a single failedId', () => {
    const result = service.validateQualityResult({
      level: 'red',
      message: 'This does not answer what part of the project you would fix.',
      failedIds: ['relevance'],
      suggestions: ['Name the file or component you would change.'],
    });
    expect(result).toEqual({ ok: true });
  });

  it('rejects red without failedIds', () => {
    const result = service.validateQualityResult({
      level: 'red',
      message: 'Too vague.',
      failedIds: [],
    });
    expect(result.ok).toBe(false);
  });

  it('rejects liked-most tips when the question is about errors', () => {
    const result = service.validateQualityResult({
      level: 'amber',
      message: 'Add one more detail.',
      failedIds: ['specificity'],
      suggestions: [
        'If the question asks what you liked most, name your favorite.',
      ],
      questionText: 'Exact error message (if any)',
      answerText: 'Error 500 when I publish',
    });
    expect(result.ok).toBe(false);
  });

  it('accepts red after finalize soft-fills empty failedIds', async () => {
    const { finalizeQualityResult } = await import('./ai-quality.util');
    const finalized = finalizeQualityResult(
      {
        level: 'red',
        message:
          'This answer is dismissive and does not provide usable information for the project.',
        failedIds: [],
        suggestions: ['Name one concrete fix in your submitted project.'],
        followUpQuestion: null,
      },
      {
        screenId: '1',
        fieldId: '1',
        text: 'I dont to do any changes okay . Dont force me to do it.',
        questionText:
          'What specific thing you want to make correct in your project?',
      },
      null,
      'pro',
      'generic',
    );
    expect(finalized.failedIds).toEqual(['relevance']);
    expect(
      service.validateQualityResult({
        ...finalized,
        answerText: 'I dont to do any changes okay . Dont force me to do it.',
      }),
    ).toEqual({ ok: true });
  });
});

describe('GroundingValidatorService.validateLogicGraph', () => {
  it('accepts intro/end edges when they exist in the snapshot', () => {
    const service = new GroundingValidatorService();
    const result = service.validateLogicGraph(
      {
        connections: [
          { from: 1, to: 2, kind: 'next' },
          { from: 2, to: 3, kind: 'end' },
        ],
        ifRulesByEdge: {},
        showIfByScreenId: {},
      },
      {
        formId: 'form-1',
        title: 'Form',
        purpose: '',
        archetype: 'generic',
        screens: [
          {
            screenId: 2,
            label: 'Your role',
            fieldType: 'short_text',
          },
        ],
        contentScreens: [{ id: 2, label: 'Your role', fields: [] }],
        logicGraph: { connections: [], ifRulesByEdge: {} },
        responseStats: {
          count: 0,
          processedCount: 0,
          completionRate: 0,
          avgQuality: null,
        },
        recentAnswersExcerpt: '',
        departmentFields: [],
        screenLabels: ['Your role'],
        snapshot: {
          screens: [
            { id: 1, type: 'intro', label: 'Welcome' },
            { id: 2, type: 'content', label: 'Short text' },
            { id: 3, type: 'end', label: 'Thanks' },
          ],
        },
        memoryChunks: [],
      },
    );

    expect(result).toEqual({ ok: true });
  });
});
