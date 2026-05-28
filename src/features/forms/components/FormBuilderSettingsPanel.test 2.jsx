import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import uiReducer from '@/store/slices/uiSlice';
import authReducer from '@/store/slices/authSlice';
import toastReducer from '@/store/slices/toastSlice';
import FormBuilderSettingsPanel from './FormBuilderSettingsPanel';

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const baseProps = {
  settingsAutoAdvance: false,
  setSettingsAutoAdvance: vi.fn(),
  settingsBackButton: true,
  setSettingsBackButton: vi.fn(),
  settingsResubmission: false,
  setSettingsResubmission: vi.fn(),
  settingsConfirmationEmail: false,
  setSettingsConfirmationEmail: vi.fn(),
  settingsResponseLimit: false,
  setSettingsResponseLimit: vi.fn(),
  settingsResponseLimitCount: '500',
  setSettingsResponseLimitCount: vi.fn(),
  onDiscardDraft: vi.fn(),
  activeFormId: 'form-1',
  formTitle: 'My Form',
};

function renderPanel(overrides = {}) {
  const store = configureStore({
    reducer: { ui: uiReducer, auth: authReducer, toast: toastReducer },
    preloadedState: { auth: { email: 'test@example.com' } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <FormBuilderSettingsPanel {...baseProps} {...overrides} />
      </MemoryRouter>
    </Provider>
  );
}

describe('FormBuilderSettingsPanel', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockShowToast.mockClear();
  });

  it('renders updated Figma sections without language or webhook', () => {
    renderPanel();
    expect(screen.getByText('Auto-advance on selection')).toBeInTheDocument();
    expect(screen.getByText('Allow re-submission')).toBeInTheDocument();
    expect(screen.getByText('Confirmation email')).toBeInTheDocument();
    expect(screen.getByText('Connect integrations')).toBeInTheDocument();
    expect(screen.queryByText('Language')).not.toBeInTheDocument();
    expect(screen.queryByText('Webhook URL')).not.toBeInTheDocument();
    expect(screen.queryByText('After submission')).not.toBeInTheDocument();
    expect(screen.queryByText('Password protection')).not.toBeInTheDocument();
  });

  it('opens manage integrations modal from Manage link', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /manage/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Manage integrations')).toBeInTheDocument();
  });

  it('discards draft, shows toast, and navigates to dashboard', () => {
    const onDiscardDraft = vi.fn();
    renderPanel({ onDiscardDraft });
    fireEvent.click(screen.getAllByRole('button', { name: 'Discard draft' })[0]);
    const confirmButtons = screen.getAllByRole('button', { name: 'Discard draft' });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(onDiscardDraft).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Draft discarded',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
