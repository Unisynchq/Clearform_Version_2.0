import { BadRequestException } from '@nestjs/common';
import {
  validateSnapshotStructure,
  analyzeSnapshot,
} from './snapshot.validator';

describe('snapshot.validator', () => {
  const baseSnapshot = {
    version: 1,
    formId: 'abc',
    formTitle: 'Test',
    screens: [
      { id: 1, type: 'intro', label: 'Start' },
      {
        id: 2,
        type: 'content',
        label: 'Q1',
        config: { shortTextQuestion: 'Name?' },
      },
      { id: 3, type: 'end', label: 'End' },
    ],
  };

  it('analyzes screen counts', () => {
    const analysis = analyzeSnapshot(baseSnapshot);
    expect(analysis.screenCount).toBe(3);
    expect(analysis.contentCount).toBe(1);
    expect(analysis.contentWithoutConfig).toHaveLength(0);
  });

  it('requires version and screens array', () => {
    expect(() => validateSnapshotStructure({})).toThrow(BadRequestException);
  });

  it('defaults missing version to 1 for draft saves', () => {
    const snapshot: Record<string, unknown> = {
      screens: [
        { id: 1, type: 'intro' },
        { id: 2, type: 'content', config: { shortTextQuestion: 'Q?' } },
        { id: 3, type: 'end' },
      ],
    };
    expect(() =>
      validateSnapshotStructure(snapshot, { forPublish: false }),
    ).not.toThrow();
    expect(snapshot.version).toBe(1);
  });

  it('still requires version when publishing', () => {
    expect(() =>
      validateSnapshotStructure(
        {
          screens: [
            { id: 1, type: 'intro' },
            { id: 2, type: 'content', config: { shortTextQuestion: 'Q?' } },
            { id: 3, type: 'end' },
          ],
        },
        { forPublish: true },
      ),
    ).toThrow(BadRequestException);
  });

  it('requires content screens for publish', () => {
    expect(() =>
      validateSnapshotStructure(
        {
          version: 1,
          screens: [
            { id: 1, type: 'intro' },
            { id: 2, type: 'end' },
          ],
        },
        { forPublish: true },
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects publish when content lacks config in strict mode', () => {
    expect(() =>
      validateSnapshotStructure(
        {
          version: 1,
          screens: [
            { id: 1, type: 'intro' },
            { id: 2, type: 'content', label: 'Q' },
            { id: 3, type: 'end' },
          ],
        },
        { forPublish: true, strictContentConfig: true },
      ),
    ).toThrow(BadRequestException);
  });

  it('accepts current frontend snapshot fields without schema drift', () => {
    const snapshot = {
      version: 1,
      formId: 'form-1',
      formTitle: 'Response quality draft',
      nextId: 104,
      intro: {
        logo: '/assets/clearform-logo.png',
        essential: { title: 'Welcome' },
      },
      theme: {
        background: '#ffffff',
        cardColor: '#f7f6f4',
        cardOpacity: 0.9,
        textColor: '#111111',
        accentColor: '#18181a',
        typography: 'DM Sans',
        fullCanvas: false,
        layoutStyle: 'default',
        cardImage: null,
      },
      screens: [
        { id: 1, type: 'intro', label: 'Start' },
        {
          id: 2,
          type: 'content',
          label: 'Short text',
          config: {
            shortTextQuestion: 'What should we improve?',
            shortTextResponseQualityEnabled: true,
            shortTextResponseQualityOptions: {
              customInstructions: 'Push for specifics, not generic praise.',
              length: { enabled: true, minWords: 8 },
              specificity: {
                enabled: true,
                sensitivity: 'Medium',
                vagueWords: 'good, nice, okay',
              },
            },
          },
        },
        {
          id: 3,
          type: 'content',
          label: 'CTA',
          config: {
            ctaImage: 'blob:https://app.clearform.in/example',
          },
        },
        { id: 4, type: 'end', label: 'End' },
      ],
    };

    expect(() =>
      validateSnapshotStructure(snapshot, { forPublish: true }),
    ).not.toThrow();
  });
});
