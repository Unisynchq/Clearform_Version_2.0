import { describe, expect, it } from 'vitest';
import {
  formatFormDateValue,
  monthGridCells,
  parseFormDateValue,
} from './FormDatePickerCalendar';

describe('FormDatePickerCalendar utils', () => {
  it('parseFormDateValue reads ISO dates', () => {
    const d = parseFormDateValue('2026-05-11');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(4);
    expect(d?.getDate()).toBe(11);
  });

  it('formatFormDateValue writes ISO dates', () => {
    expect(formatFormDateValue(new Date(2026, 4, 11))).toBe('2026-05-11');
  });

  it('monthGridCells pads to full weeks', () => {
    const cells = monthGridCells(2026, 4);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean).length).toBe(31);
  });
});
