import React, { useState } from 'react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AI_GUIDANCE_MAX_LENGTH,
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
  default as ResponseQualityScoringCard,
  improvePreferenceInstructions,
  isSubstantiallySameInstructions,
  normalizeResponseQualityOptions,
} from './ResponseQualityScoringCard';

const { showToastSpy, improveApiMock } = vi.hoisted(() => ({
  showToastSpy: vi.fn(),
  improveApiMock: vi.fn(),
}));

vi.mock('@/features/billing/utils/useBillingStatus', () => ({
  useBillingStatus: () => ({
    entitlements: null,
    isPaid: false,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: showToastSpy,
  }),
}));

vi.mock('@/api/services/responseQualityService', () => ({
  improveResponseQualityInstructionsApi: (...args) => improveApiMock(...args),
}));

vi.mock('@/config/env', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, isApiConfigured: () => true };
});

function criterionEntries(options) {
  return Object.entries(options).filter(([key]) => key !== 'customInstructions');
}

function CardHarness({
  initialEnabled = true,
  initialOptions = DEFAULT_RESPONSE_QUALITY_OPTIONS,
  onSave = vi.fn(),
  formId = null,
  screenId = null,
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [options, setOptions] = useState(initialOptions);

  return React.createElement(ResponseQualityScoringCard, {
    enabled,
    onEnabledChange: setEnabled,
    options,
    onOptionsChange: (next) =>
      setOptions((prev) => (typeof next === 'function' ? next(prev) : next)),
    onSave,
    questionText: 'How was your experience?',
    helperText: '',
    formId,
    screenId,
  });
}

beforeAll(() => {
  window.scrollTo = vi.fn();
});

beforeEach(() => {
  showToastSpy.mockClear();
  improveApiMock.mockReset();
});

describe('DEFAULT_RESPONSE_QUALITY_OPTIONS', () => {
  it('defaults all criteria to collapsed', () => {
    for (const [, criterion] of criterionEntries(DEFAULT_RESPONSE_QUALITY_OPTIONS)) {
      expect(criterion.expanded).toBe(false);
    }
  });

  it('defaults customInstructions to an empty string', () => {
    expect(DEFAULT_RESPONSE_QUALITY_OPTIONS.customInstructions).toBe('');
  });
});

describe('normalizeResponseQualityOptions', () => {
  it('forces expanded false on every criterion', () => {
    const normalized = normalizeResponseQualityOptions({
      length: { enabled: true, expanded: true, minWords: 5 },
      completeness: { enabled: false, expanded: true },
    });
    for (const [, criterion] of criterionEntries(normalized)) {
      expect(criterion.expanded).toBe(false);
    }
    expect(normalized.length.minWords).toBe(5);
  });

  it('preserves customInstructions and caps its length', () => {
    const normalized = normalizeResponseQualityOptions({
      customInstructions: 'One-word colour answers are perfect.',
    });
    expect(normalized.customInstructions).toBe('One-word colour answers are perfect.');

    const long = normalizeResponseQualityOptions({
      customInstructions: 'x'.repeat(AI_GUIDANCE_MAX_LENGTH + 100),
    });
    expect(long.customInstructions).toHaveLength(AI_GUIDANCE_MAX_LENGTH);

    const missing = normalizeResponseQualityOptions({});
    expect(missing.customInstructions).toBe('');
  });
});

describe('improvePreferenceInstructions', () => {
  it('polishes terse preference text into question-aware guidance', () => {
    const improved = improvePreferenceInstructions('specificity and relevance', {
      questionText: 'What did you think?',
    });
    expect(improved).toMatch(/For "What did you think\?"/);
    expect(improved).toMatch(/specificity and relevance/i);
    expect(improved).toMatch(/green when/i);
  });

  it('rewrites drafts that already contain "want"', () => {
    const draft =
      'I want relevant experience with a example on what they worked on.';
    const improved = improvePreferenceInstructions(draft, {
      questionText: 'How many years of relevant experience do you have?',
      helperText: 'Include only directly related roles.',
    });
    expect(isSubstantiallySameInstructions(improved, draft)).toBe(false);
    expect(improved).toMatch(/relevant experience/i);
  });
});

describe('ResponseQualityScoringCard', () => {
  it('shows saved preference state and allows returning to edit mode', async () => {
    render(
      React.createElement(CardHarness, {
        initialOptions: {
          ...DEFAULT_RESPONSE_QUALITY_OPTIONS,
          customInstructions: 'Rate each response on specificity (1-5).',
        },
      }),
    );

    expect(screen.getByText('Preference Saved!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() =>
      expect(
        screen.getByDisplayValue('Rate each response on specificity (1-5).'),
      ).toBeInTheDocument(),
    );
  });

  it('keeps criteria inside advanced options and runs improve then save flow', async () => {
    const onSave = vi.fn();
    improveApiMock.mockResolvedValue({
      customInstructions:
        'For "How was your experience?": require the exact step where they got stuck and the outcome.',
      meta: { source: 'llm' },
    });

    render(React.createElement(CardHarness, { onSave, formId: 'form-1', screenId: 3 }));

    expect(screen.queryByText('Length')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /advanced options/i }));
    expect(screen.getByText('Length')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Focus on specificity and relevance.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Improve with AI' }));

    expect(screen.getByRole('status', { name: 'Improving with AI' })).toBeInTheDocument();

    await waitFor(
      () => {
        const saveButton = screen.getByRole('button', { name: 'Save' });
        expect(saveButton).not.toBeDisabled();
      },
      { timeout: 2000 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);

    await waitFor(
      () => expect(screen.getByText('Preference Saved!')).toBeInTheDocument(),
      { timeout: 1000 },
    );
  }, 10000);

  it('greys out expanded criterion details when the criterion is disabled', () => {
    render(React.createElement(CardHarness));

    fireEvent.click(screen.getByRole('button', { name: /advanced options/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand Completeness options' }));

    const disabledDetails = screen.getByText('Detect trailing sentences').closest('fieldset');
    expect(disabledDetails).toHaveAttribute('disabled');
    expect(disabledDetails).toHaveClass('opacity-45');
  });

  it('shows the softer toast when improve returned the contextual fallback', async () => {
    improveApiMock.mockResolvedValue({
      customInstructions:
        'For "How was your experience?": require the exact step where they got stuck and the outcome.',
      meta: { source: 'contextual_fallback' },
    });

    render(React.createElement(CardHarness, { formId: 'form-1', screenId: 3 }));

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Focus on specificity and relevance.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Improve with AI' }));

    await waitFor(
      () =>
        expect(showToastSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'info',
            message: expect.stringMatching(/AI polish was unavailable/i),
          }),
        ),
      { timeout: 2000 },
    );
  }, 10000);

  it('silently upgrades the local seed with the LLM version on toggle-on', async () => {
    improveApiMock.mockResolvedValue({
      customInstructions:
        'Require the exact onboarding step and what they expected instead.',
      meta: { source: 'llm' },
    });

    render(
      React.createElement(CardHarness, {
        initialEnabled: false,
        formId: 'form-1',
        screenId: 3,
      }),
    );

    fireEvent.click(
      screen.getByRole('switch', { name: 'Enable response quality scoring' }),
    );

    expect(
      await screen.findByText(/Require the exact onboarding step/),
    ).toBeInTheDocument();
    expect(improveApiMock).toHaveBeenCalledWith(
      'form-1',
      expect.objectContaining({ draftInstructions: '', screenId: '3' }),
    );
  });

  it('keeps the owner text when they edit before the seed upgrade arrives', async () => {
    let resolveImprove;
    improveApiMock.mockReturnValue(
      new Promise((resolve) => {
        resolveImprove = resolve;
      }),
    );

    render(
      React.createElement(CardHarness, {
        initialEnabled: false,
        formId: 'form-1',
        screenId: 3,
      }),
    );

    fireEvent.click(
      screen.getByRole('switch', { name: 'Enable response quality scoring' }),
    );
    await waitFor(() => expect(improveApiMock).toHaveBeenCalledTimes(1));

    // The seeded preference lands in the saved view — edit it before the upgrade arrives.
    await screen.findByText('Preference Saved!');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: 'Only accept answers naming the payment gateway.' },
    });

    resolveImprove({
      customInstructions:
        'Require the exact onboarding step and what they expected instead.',
      meta: { source: 'llm' },
    });
    await Promise.resolve();

    expect(
      screen.getByDisplayValue('Only accept answers naming the payment gateway.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Require the exact onboarding step/),
    ).not.toBeInTheDocument();
  });
});
