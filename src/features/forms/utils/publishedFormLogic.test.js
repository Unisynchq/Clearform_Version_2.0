import { describe, it, expect } from 'vitest';
import { createFormLogicRunner } from '@/features/forms/utils/formLogicRunner';
import { writePublishedForm, readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { resolveThemeFromSnapshot } from '@/features/forms/utils/respondentThemeStyles';
import { previewCanvasConfigsFromScreen } from '@/features/forms/utils/previewCanvasConfigsFromScreen';

/**
 * Mirrors the shape written by FormBuilderPage.flushBuilderDraft / autosave
 * and consumed by PublicFormPage → FormRespondentView.
 */
const publishedDraftFixture = {
  formId: 42,
  formTitle: 'Logic publish test',
  screens: [
    { id: 1, type: 'intro', name: 'Start Screen', label: 'Start' },
    {
      id: 2,
      type: 'content',
      name: 'Question',
      label: 'Single',
      config: {
        singleQuestion: 'Pick one',
        singleOptions: ['Yes', 'No'],
      },
    },
    {
      id: 3,
      type: 'content',
      name: 'Follow up',
      label: 'Short text',
      config: { shortTextQuestion: 'Details' },
    },
    { id: 4, type: 'end', name: 'End Screen', label: 'End' },
  ],
  intro: { title: 'Start', description: '', buttonText: 'Start' },
  end: { title: 'Thanks', description: '', buttonText: 'Done' },
  logicConnections: [
    { from: 2, to: 3, kind: 'if' },
    { from: 2, to: 4, kind: 'next' },
  ],
  logicIfRulesByEdge: {
    '2-3': {
      rules: [
        {
          id: 'r1',
          thenScreenId: 3,
          conditions: [
            {
              sourceScreenId: 2,
              fieldId: 'multiple-choice',
              operator: 'includes',
              value: 'Yes',
            },
          ],
        },
      ],
      elseScreenId: 4,
    },
  },
};

describe('published form logic snapshot', () => {
  it('persists logicConnections and logicIfRulesByEdge via publishedFormStorage', () => {
    writePublishedForm(42, publishedDraftFixture);
    const loaded = readPublishedForm(42);
    expect(loaded?.logicConnections).toEqual(publishedDraftFixture.logicConnections);
    expect(loaded?.logicIfRulesByEdge).toEqual(publishedDraftFixture.logicIfRulesByEdge);
    expect(loaded?.screens?.length).toBe(4);
  });

  it('branches on published snapshot the same way as builder preview (if → then, else → end)', () => {
    const runner = createFormLogicRunner({
      screens: publishedDraftFixture.screens,
      logicConnections: publishedDraftFixture.logicConnections,
      logicIfRulesByEdge: publishedDraftFixture.logicIfRulesByEdge,
    });

    runner.recordScreenAnswers(2, { previewPicks: ['Yes'] });
    expect(runner.getNextScreenId(2)).toBe(3);

    runner.recordScreenAnswers(2, { previewPicks: ['No'] });
    expect(runner.getNextScreenId(2)).toBe(4);
  });

  it('round-trips theme and intro fields on published snapshot', () => {
    const withMeta = {
      ...publishedDraftFixture,
      intro: {
        ...publishedDraftFixture.intro,
        logo: 'data:image/png;base64,abc',
        essential: null,
        alignment: 'center',
        textSize: 'L',
      },
      theme: {
        layoutStyle: 'withCard',
        fullCanvas: false,
        background: '#f0eee8',
        cardColor: '#f9f9fa',
        cardOpacity: 74,
        textColor: '#198eea',
        accentColor: '#198eea',
        typography: 'default',
      },
    };
    writePublishedForm(99, withMeta);
    const loaded = readPublishedForm(99);
    expect(loaded?.intro?.logo).toBe('data:image/png;base64,abc');
    expect(loaded?.theme?.accentColor).toBe('#198eea');
    const resolved = resolveThemeFromSnapshot(loaded.theme);
    expect(resolved.accentColor).toBe('#198eea');
    expect(resolved.typography).toContain('DM Sans');
  });

  it('previewCanvasConfigsFromScreen maps short text quality config', () => {
    const screen = publishedDraftFixture.screens[2];
    const configs = previewCanvasConfigsFromScreen({
      ...screen,
      config: {
        ...screen.config,
        shortTextResponseQualityEnabled: true,
        shortTextResponseQualityOptions: { minWords: 5 },
      },
    });
    expect(configs.shortTextResponseQualityConfig?.enabled).toBe(true);
    expect(configs.shortTextConfig).toBeDefined();
  });
});
