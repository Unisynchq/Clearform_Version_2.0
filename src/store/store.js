import { configureStore } from '@reduxjs/toolkit';
import formsReducer from './slices/formsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import toastReducer from './slices/toastSlice';
import notificationsReducer from './slices/notificationsSlice';
import onboardingReducer from './slices/onboardingSlice';
import { persistAppMiddleware } from './middleware/persistAppMiddleware';

export const store = configureStore({
  reducer: {
    forms: formsReducer,
    auth: authReducer,
    ui: uiReducer,
    toast: toastReducer,
    notifications: notificationsReducer,
    onboarding: onboardingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistAppMiddleware),
});
