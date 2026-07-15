import { describe, expect, it, vi, beforeEach } from 'vitest';

const { navigateToFormBuilder } = vi.hoisted(() => ({
  navigateToFormBuilder: vi.fn(),
}));

vi.mock('@/config/env', () => ({
  isApiConfigured: () => false,
  isFirebaseConfigured: () => false,
}));

vi.mock('@/store/slices/formsSlice', () => ({
  addForm: (payload) => ({ type: 'forms/addForm', payload }),
}));

vi.mock('@/features/templates/utils/buildFormFromTemplate', () => ({
  buildFormFromTemplate: vi.fn(() => ({
    screens: [{ id: 1, type: 'intro' }, { id: 2, type: 'content' }, { id: 3, type: 'end' }],
    formTitle: 'Template Default Title',
    intro: { title: 'Start', description: '', buttonText: 'Begin' },
    end: { title: 'Done', description: '', buttonText: 'Close' },
    nextId: 4,
  })),
}));

vi.mock('@/features/onboarding/utils/createFormFromTemplate', () => ({
  buildFormFromTemplate: vi.fn(() => ({
    id: 'meta-template-id',
    gradientFrom: '#111111',
    gradientTo: '#222222',
    overlayColor: '#333333',
    iconGradient: 'dark',
  })),
}));

vi.mock('@/features/forms/utils/navigateToFormBuilder', () => ({
  navigateToFormBuilder,
}));

import { createFormFromTemplateAndOpenBuilder } from './createFormFromTemplateFlow';

describe('createFormFromTemplateAndOpenBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds builderSnapshot before navigating to the builder', async () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();

    const formId = await createFormFromTemplateAndOpenBuilder({
      template: { id: 'tpl-1', title: 'Scholarship Template' },
      activeWorkspace: 'all',
      dispatch,
      navigate,
      showToast: vi.fn(),
    });

    expect(formId).toBe('meta-template-id');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          templateId: 'tpl-1',
          title: 'Template Default Title',
          builderSnapshot: expect.objectContaining({
            version: 1,
            formId: 'meta-template-id',
            formTitle: 'Template Default Title',
            templateId: 'tpl-1',
            screens: [{ id: 1, type: 'intro' }, { id: 2, type: 'content' }, { id: 3, type: 'end' }],
            nextId: 4,
          }),
        }),
      }),
    );
    expect(navigateToFormBuilder).toHaveBeenCalledWith(
      navigate,
      dispatch,
      expect.objectContaining({
        templateId: 'tpl-1',
        formTitle: 'Template Default Title',
        formId: 'meta-template-id',
      }),
      { minDelayMs: 0 },
    );
  });
});
