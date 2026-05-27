import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer, { startOnboarding } from '@/store/slices/onboardingSlice';
import authReducer from '@/store/slices/authSlice';
import formsReducer from '@/store/slices/formsSlice';
import OnboardingWelcomePage from './OnboardingWelcomePage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function makeStore() {
  return configureStore({
    reducer: {
      onboarding: onboardingReducer,
      auth: authReducer,
      forms: formsReducer,
    },
  });
}

function renderWelcome(store = makeStore()) {
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <OnboardingWelcomePage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('OnboardingWelcomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders welcome copy after signup onboarding starts', async () => {
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    renderWelcome(store);

    expect(screen.getByText(/you're in/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what would you like/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create my first form/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument();
  });

  it('navigates to templates when Create my first form is chosen', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    renderWelcome(store);
    await user.click(screen.getByRole('button', { name: /create my first form/i }));

    expect(store.getState().onboarding.step).toBe(1);
    expect(navigateMock).toHaveBeenCalledWith('/onboarding/templates');
  });

  it('completes onboarding and opens dashboard when skipping', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    await act(async () => {
      store.dispatch(startOnboarding());
    });

    renderWelcome(store);
    await user.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(store.getState().onboarding.completed).toBe(true);
    expect(store.getState().onboarding.active).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
