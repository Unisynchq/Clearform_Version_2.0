import { createSlice } from '@reduxjs/toolkit';
import {
  readOnboardingComplete,
  readOnboardingSession,
  writeOnboardingComplete,
  writeOnboardingSession,
  clearOnboardingSession,
} from '@/features/onboarding/utils/onboardingStorage';
import { markOnboardingCompleteOnServer } from '@/api/services/authMeService';

const session = readOnboardingSession();

const initialState = {
  completed: readOnboardingComplete(),
  /** Only true during signup onboarding — not restored on sign-in / app load */
  active: false,
  step: session.step ?? 0,
  selectedTemplateId: session.selectedTemplateId,
};

const persist = (state) => {
  writeOnboardingSession({
    active: state.active,
    step: state.step,
    selectedTemplateId: state.selectedTemplateId,
  });
  writeOnboardingComplete(state.completed);
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    startOnboarding(state) {
      state.completed = false;
      state.active = true;
      state.step = 0;
      state.selectedTemplateId = null;
      writeOnboardingComplete(false);
      persist(state);
    },
    setOnboardingStep(state, action) {
      state.step = action.payload;
      persist(state);
    },
    selectOnboardingTemplate(state, action) {
      state.selectedTemplateId = action.payload;
      persist(state);
    },
    completeOnboarding(state) {
      state.completed = true;
      state.active = false;
      state.step = 1;
      state.selectedTemplateId = null;
      clearOnboardingSession();
      markOnboardingCompleteOnServer().catch(() => {});
    },
    /** Enter onboarding UI (signup route) without resetting step/template */
    enterOnboardingFlow(state) {
      if (state.completed) return;
      state.active = true;
      const stored = readOnboardingSession();
      state.step = stored.step ?? state.step ?? 0;
      state.selectedTemplateId = stored.selectedTemplateId ?? state.selectedTemplateId;
      persist(state);
    },
    /** Sign-in: leave onboarding flow without marking it complete */
    dismissOnboardingSession(state) {
      state.active = false;
      persist(state);
    },
    resumeOnboardingIfNeeded(state) {
      if (state.completed) {
        state.active = false;
        return;
      }
      const stored = readOnboardingSession();
      state.step = stored.step ?? 0;
      state.selectedTemplateId = stored.selectedTemplateId;
    },
  },
});

export const {
  startOnboarding,
  setOnboardingStep,
  selectOnboardingTemplate,
  completeOnboarding,
  enterOnboardingFlow,
  dismissOnboardingSession,
  resumeOnboardingIfNeeded,
} = onboardingSlice.actions;

export const selectIsOnboardingActive = (s) =>
  s.onboarding.active && !s.onboarding.completed;

export const selectOnboardingStep = (s) => s.onboarding.step;

export default onboardingSlice.reducer;
