import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InlineEditableField from './InlineEditableField';

describe('InlineEditableField', () => {
  it('enters edit mode on click and syncs onChange', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <InlineEditableField value="Hello" onChange={onChange} aria-label="Title" />,
    );

    fireEvent.click(screen.getByRole('button', { name: /title/i }));
    const input = screen.getByLabelText('Title');
    expect(input).toHaveValue('Hello');
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(onChange).toHaveBeenCalledWith('Hello world');

    rerender(<InlineEditableField value="Hello world" onChange={onChange} aria-label="Title" />);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('button', { name: /title/i })).toHaveTextContent('Hello world');
  });

  it('reverts on Escape', () => {
    const onChange = vi.fn();
    render(<InlineEditableField value="Original" onChange={onChange} aria-label="Field" />);

    fireEvent.click(screen.getByRole('button', { name: /field/i }));
    const input = screen.getByLabelText('Field');
    fireEvent.change(input, { target: { value: 'Changed' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onChange).toHaveBeenLastCalledWith('Original');
    expect(screen.getByRole('button', { name: /field/i })).toHaveTextContent('Original');
  });
});
