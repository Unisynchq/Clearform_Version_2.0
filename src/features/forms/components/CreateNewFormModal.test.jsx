import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import formsReducer from '@/store/slices/formsSlice';
import uiReducer from '@/store/slices/uiSlice';
import authReducer from '@/store/slices/authSlice';
import onboardingReducer from '@/store/slices/onboardingSlice';
import toastReducer from '@/store/slices/toastSlice';
import notificationsReducer from '@/store/slices/notificationsSlice';
import { openCreateNewFormModal } from '@/store/slices/uiSlice';
import CreateNewFormModal from './CreateNewFormModal';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../utils/navigateToFormBuilder', () => ({
  navigateToFormBuilder: vi.fn(),
}));

/** Deferred exit callback — mirrors AnimatePresence waiting for exit (Check B). */
let pendingModalExitComplete = null;

vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  const React = await import('react');

  function TestAnimatePresence({ children, onExitComplete }) {
    const hadChildrenRef = React.useRef(false);

    React.useEffect(() => {
      const hasChildren = Boolean(children);
      if (hadChildrenRef.current && !hasChildren) {
        pendingModalExitComplete = onExitComplete ?? null;
      }
      if (hasChildren) pendingModalExitComplete = null;
      hadChildrenRef.current = hasChildren;
    }, [children, onExitComplete]);

    return children;
  }

  return {
    ...actual,
    AnimatePresence: TestAnimatePresence,
  };
});

function flushModalExitAnimation() {
  const run = pendingModalExitComplete;
  pendingModalExitComplete = null;
  run?.();
}

import { navigateToFormBuilder } from '../utils/navigateToFormBuilder';

function makeStore() {
  return configureStore({
    reducer: {
      forms: formsReducer,
      ui: uiReducer,
      auth: authReducer,
      onboarding: onboardingReducer,
      toast: toastReducer,
      notifications: notificationsReducer,
    },
  });
}

function renderModal(store = makeStore()) {
  const view = render(
    <Provider store={store}>
      <CreateNewFormModal />
    </Provider>,
  );
  return { store, ...view };
}

describe('CreateNewFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens via Redux without act warnings and shows dialog', async () => {
    const { store } = renderModal();

    await act(async () => {
      store.dispatch(openCreateNewFormModal());
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/form name/i)).toBeInTheDocument();
    expect(store.getState().ui.createNewFormModal.open).toBe(true);
  });

  it('fires open state from New Form trigger without act warnings', async () => {
    const { store } = renderModal();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await act(async () => {
      store.dispatch(openCreateNewFormModal());
    });

    expect(store.getState().ui.createNewFormModal.open).toBe(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('closes modal on Create Form before calling navigateToFormBuilder', async () => {
    const user = userEvent.setup();
    const { store } = renderModal();

    await act(async () => {
      store.dispatch(openCreateNewFormModal());
    });

    await user.click(screen.getByRole('button', { name: /create form/i }));

    expect(store.getState().ui.createNewFormModal.open).toBe(false);
    expect(navigateToFormBuilder).not.toHaveBeenCalled();
    expect(pendingModalExitComplete).toBeTruthy();

    await act(async () => {
      flushModalExitAnimation();
    });

    expect(navigateToFormBuilder).toHaveBeenCalledTimes(1);
    expect(navigateToFormBuilder).toHaveBeenCalledWith(
      navigateMock,
      expect.any(Function),
      expect.objectContaining({ formTitle: 'Untitled' }),
      { showOverlay: false },
    );
  });

  it('defers builder overlay until modal exit completes (Check B)', async () => {
    const user = userEvent.setup();
    const { store } = renderModal();

    await act(async () => {
      store.dispatch(openCreateNewFormModal());
    });

    await user.click(screen.getByRole('button', { name: /create form/i }));

    expect(store.getState().ui.builderRouteTransition.pending).toBe(false);
    expect(navigateToFormBuilder).not.toHaveBeenCalled();

    await act(async () => {
      flushModalExitAnimation();
    });

    expect(store.getState().ui.builderRouteTransition.pending).toBe(true);
    expect(navigateToFormBuilder).toHaveBeenCalledTimes(1);
  });
});
