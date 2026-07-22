import React from 'react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LogicScreenPicker from './LogicScreenPicker';

beforeAll(() => {
  window.scrollTo = vi.fn();
});

describe('LogicScreenPicker', () => {
  it('shows selected label when option has no Icon', () => {
    render(
      <LogicScreenPicker
        value={42}
        onChange={vi.fn()}
        options={[{ id: 42, label: 'Screen 2 — Feedback' }]}
        placeholder="Select screen…"
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Screen 2 — Feedback');
    expect(screen.queryByText('Select screen…')).not.toBeInTheDocument();
  });

  it('opens menu and selects an option without icons', () => {
    const onChange = vi.fn();
    render(
      <LogicScreenPicker
        value={null}
        onChange={onChange}
        options={[
          { id: 1, label: 'Intro' },
          { id: 2, label: 'Question 1' },
        ]}
        placeholder="Select screen…"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('option', { name: 'Question 1' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});
