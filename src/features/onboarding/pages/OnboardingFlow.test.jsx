import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import onboardingReducer, { startOnboarding, setOnboardingStep } from '@/store/slices/onboardingSlice';
import authReducer from '@/store/slices/authSlice';
import formsReducer from '@/store/slices/formsSlice';
import uiReducer from '@/store/slices/uiSlice';
import OnboardingLayout from '../layouts/OnboardingLayout';
import OnboardingWelcomePage from './OnboardingWelcomePage';
import OnboardingChooseTemplatePage from './OnboardingChooseTemplatePage';

vi.mock('@/features/templates/hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: [
      { id: 't1', title: 'Test Template', category: 'All', description: 'Demo' },
    ],
    status: 'idle',
  }),
}));

vi.mock('../components/OnboardingTemplatePreviewModal', () => ({
  default: () => null,
}));

vi.mock('@/features/templates/components/TemplateCard', () => ({
  default: ({ template, onSelect }) => (
    <button type="button" onClick={() => onSelect?.(template)}>
      {template.title}
    </button>
  ),
}));

function makeStore() {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      auth: authReducer,
      forms: formsReducer,
      ui: uiReducer,
    },
  });
}

function renderOnboardingFlow(initialPath = '/onboarding', store = makeStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingLayout />}>
            <Route index element={<OnboardingWelcomePage />} />
            <Route path="templates" element={<OnboardingChooseTemplatePage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('Onboarding flow navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('welcome → templates shows template step with smooth route change', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    renderOnboardingFlow('/onboarding', store);
    expect(screen.getByRole('heading', { name: /what would you like/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /create my first form/i }));

    expect(store.getState().onboarding.step).toBe(1);
    expect(screen.getByRole('heading', { name: /what are you building today/i })).toBeInTheDocument();
  });

  it('templates → welcome via back resets step and shows welcome again', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    await act(async () => {
      store.dispatch(setOnboardingStep(1));
    });
    renderOnboardingFlow('/onboarding/templates', store);

    expect(screen.getByRole('heading', { name: /what are you building today/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^back$/i }));

    expect(store.getState().onboarding.step).toBe(0);
    expect(screen.getByRole('heading', { name: /what would you like/i })).toBeInTheDocument();
  });

  it('skip on welcome completes onboarding for dashboard handoff', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    renderOnboardingFlow('/onboarding', store);
    await user.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(store.getState().onboarding.completed).toBe(true);
    expect(store.getState().onboarding.active).toBe(false);
  });
});
