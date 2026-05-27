import { describe, it, expect } from 'vitest';
import {
  getFormBuilderPath,
  parseFormBuilderRouteId,
  FORM_BUILDER_NEW_SEGMENT,
} from './formBuilderNavigation';

describe('formBuilderNavigation', () => {
  it('builds path with numeric form id', () => {
    expect(getFormBuilderPath(42)).toBe('/dashboard/form-builder/42');
  });

  it('builds new-form path when id missing', () => {
    expect(getFormBuilderPath(null)).toBe(`/dashboard/form-builder/${FORM_BUILDER_NEW_SEGMENT}`);
  });

  it('parses route param', () => {
    expect(parseFormBuilderRouteId('99')).toBe(99);
    expect(parseFormBuilderRouteId(FORM_BUILDER_NEW_SEGMENT)).toBeNull();
    expect(parseFormBuilderRouteId(undefined)).toBeNull();
  });
});
