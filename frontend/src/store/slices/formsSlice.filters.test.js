import { describe, it, expect } from 'vitest';
import formsReducer, {
  clearAllFormFilters,
  selectFilteredForms,
  setActiveFilter,
  setActiveWorkspace,
  setSearchQuery,
  setAdvancedFilters,
} from './formsSlice';

const sampleForms = [
  { id: 1, title: 'Alpha Survey', status: 'live', workspace: 'product', responses: 3, timeAgo: '1d ago' },
  { id: 2, title: 'Beta Draft', status: 'draft', workspace: 'hr', responses: 0, timeAgo: '2d ago' },
  { id: 3, title: 'Gamma Live', status: 'live', workspace: 'hr', responses: 1, timeAgo: '3d ago' },
];

const buildState = (formsOverrides = {}) => ({
  forms: {
    forms: sampleForms,
    workspaces: [],
    activeFilter: 'live',
    activeWorkspace: 'hr',
    searchQuery: 'beta',
    sortOrder: 'recent',
    advancedFilters: { status: ['live'], responses: ['has_responses'] },
    ...formsOverrides,
  },
});

describe('formsSlice filters', () => {
  it('clearAllFormFilters resets every dashboard filter field', () => {
    const state = formsReducer(
      buildState(),
      clearAllFormFilters(),
    );

    expect(state.activeFilter).toBe('all');
    expect(state.activeWorkspace).toBe('all');
    expect(state.searchQuery).toBe('');
    expect(state.advancedFilters).toEqual({ status: [], responses: [] });
  });

  it('selectFilteredForms returns all forms after clearAllFormFilters', () => {
    let root = buildState();
    root = { forms: formsReducer(root.forms, clearAllFormFilters()) };

    const filtered = selectFilteredForms(root);
    expect(filtered.map((f) => f.id)).toEqual([1, 2, 3]);
  });

  it('selectFilteredForms applies search, status, workspace, and advanced filters together', () => {
    const filtered = selectFilteredForms(buildState());
    expect(filtered).toHaveLength(0);

    const partial = selectFilteredForms(
      buildState({
        activeFilter: 'all',
        searchQuery: '',
        advancedFilters: { status: [], responses: [] },
      }),
    );
    expect(partial.map((f) => f.id)).toEqual([2, 3]);
  });

  it('setActiveFilter and setSearchQuery update results immediately', () => {
    let slice = {
      forms: sampleForms,
      workspaces: [],
      activeFilter: 'all',
      activeWorkspace: 'all',
      searchQuery: '',
      sortOrder: 'recent',
      advancedFilters: { status: [], responses: [] },
    };

    slice = formsReducer(slice, setActiveFilter('draft'));
    let root = { forms: slice };
    expect(selectFilteredForms(root).map((f) => f.id)).toEqual([2]);

    slice = formsReducer(slice, setSearchQuery('gamma'));
    root = { forms: slice };
    expect(selectFilteredForms(root)).toHaveLength(0);

    slice = formsReducer(slice, setSearchQuery(''));
    slice = formsReducer(slice, setActiveFilter('all'));
    slice = formsReducer(slice, setActiveWorkspace('hr'));
    root = { forms: slice };
    expect(selectFilteredForms(root).map((f) => f.id)).toEqual([2, 3]);

    slice = formsReducer(slice, setAdvancedFilters({ status: ['live'], responses: [] }));
    root = { forms: slice };
    expect(selectFilteredForms(root).map((f) => f.id)).toEqual([3]);
  });
});
