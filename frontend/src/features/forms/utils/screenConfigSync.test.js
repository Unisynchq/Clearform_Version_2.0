import { describe, expect, it, vi } from 'vitest';
import { extractScreenConfig, applyScreenConfig, getDefaultScreenConfig } from './screenConfigSync';

describe('getDefaultScreenConfig', () => {
  it('returns blank short text defaults with fresh response quality options', () => {
    const first = getDefaultScreenConfig('Short text');
    const second = getDefaultScreenConfig('Short text');

    expect(first.shortTextQuestion).toBe('');
    expect(first.shortTextHelperText).toBe('');
    expect(first.shortTextMaxChars).toBe(500);
    expect(first.shortTextResponseQualityEnabled).toBe(false);
    expect(first.shortTextResponseQualityOptions.customInstructions).toBe('');

    first.shortTextQuestion = 'Question A';
    first.shortTextResponseQualityOptions.customInstructions = 'Prefer detail';

    expect(second.shortTextQuestion).toBe('');
    expect(second.shortTextResponseQualityOptions.customInstructions).toBe('');
  });

  it('returns blank long text defaults independent of short text', () => {
    const short = getDefaultScreenConfig('Short text');
    const long = getDefaultScreenConfig('Long text');

    expect(long.longTextMaxChars).toBe(5000);

    short.shortTextQuestion = 'Shared by mistake';
    short.shortTextResponseQualityOptions.customInstructions = 'Should not leak';

    expect(long.longTextQuestion).toBe('');
    expect(long.longTextResponseQualityOptions.customInstructions).toBe('');
  });

  it('round-trips Upload required and appearance via extractScreenConfig', () => {
    const screen = { type: 'content', label: 'Upload', config: {} };
    const globals = {
      uploadQuestion: 'Attach docs',
      uploadHelperText: 'PDF only',
      uploadMaxFileSize: '10 MB',
      multiImageRequired: true,
      multiImageUploadZoneSize: 'Compact',
      multiImageShowPreview: false,
      multiImageAcceptedTypes: ['PDF'],
    };
    const extracted = extractScreenConfig(screen, globals);
    expect(extracted).toMatchObject({
      question: 'Attach docs',
      helperText: 'PDF only',
      maxFileSize: '10 MB',
      required: true,
      uploadZoneSize: 'Compact',
      showPreview: false,
      acceptedTypes: ['PDF'],
    });
  });

  it('round-trips Multi-image upload required and appearance via extractScreenConfig', () => {
    const screen = { type: 'content', label: 'Multi-image upload', config: {} };
    const globals = {
      multiImageQuestion: 'Upload photos',
      multiImageHelperText: 'Up to 9',
      multiImageMaxFiles: 9,
      multiImageRequired: true,
      multiImageMultipleFiles: true,
      multiImageMaxFileSize: '25 MB',
      multiImageUploadZoneSize: 'Large',
      multiImageShowPreview: true,
      multiImageAcceptedTypes: ['PNG', 'JPG'],
    };
    const extracted = extractScreenConfig(screen, globals);
    expect(extracted).toMatchObject({
      question: 'Upload photos',
      helperText: 'Up to 9',
      maxFiles: 9,
      required: true,
      multipleFiles: true,
      maxFileSize: '25 MB',
      uploadZoneSize: 'Large',
      showPreview: true,
      acceptedTypes: ['PNG', 'JPG'],
    });
  });

  it('applyScreenConfig restores upload appearance fields from persisted config', () => {
    const screen = { type: 'content', label: 'Upload', config: {} };
    const setters = {
      setUploadQuestion: vi.fn(),
      setUploadHelperText: vi.fn(),
      setUploadMaxFileSize: vi.fn(),
      setMultiImageRequired: vi.fn(),
      setMultiImageUploadZoneSize: vi.fn(),
      setMultiImageShowPreview: vi.fn(),
      setMultiImageAcceptedTypes: vi.fn(),
    };
    applyScreenConfig(
      screen,
      {
        question: 'Files',
        helperText: 'Help',
        maxFileSize: '5 MB',
        required: true,
        uploadZoneSize: 'Default',
        showPreview: true,
        acceptedTypes: ['DOCX'],
      },
      setters,
    );
    expect(setters.setMultiImageRequired).toHaveBeenCalledWith(true);
    expect(setters.setMultiImageUploadZoneSize).toHaveBeenCalledWith('Default');
    expect(setters.setMultiImageShowPreview).toHaveBeenCalledWith(true);
    expect(setters.setMultiImageAcceptedTypes).toHaveBeenCalledWith(['DOCX']);
  });
});
