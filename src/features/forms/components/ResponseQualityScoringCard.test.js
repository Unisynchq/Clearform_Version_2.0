import React, { useState } from 'react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AI_GUIDANCE_MAX_LENGTH,
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
  default as ResponseQualityScoringCard,
  improvePreferenceInstructions,
  normalizeResponseQualityOptions,
} from './ResponseQualityScoringCard';

vi.mock('@/features/billing/utils/useBillingStatus', () => ({
  useBillingStatus: () => ({
    entitlements: null,
    isPaid: false,
  }),
}));

function criterionEntries(options) {
  return Object.entries(options).filter(([key]) => key !== 'customInstructions');
}

function CardHarness({
  initialEnabled = true,
  initialOptions = DEFAULT_RESPONSE_QUALITY_OPTIONS,
  onSave = vi.fn(),
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
  });
}

beforeAll(() => {
  window.scrollTo = vi.fn();
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
  it('polishes terse preference text into clearer guidance', () => {
    const improved = improvePreferenceInstructions('specificity and relevance', {
      questionText: 'What did you think?',
    });
    expect(improved).toMatch(/^I want responses/);
    expect(improved).toContain('specificity and relevance');
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

    render(React.createElement(CardHarness, { onSave }));

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
      { timeout: 3000 },
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
});
