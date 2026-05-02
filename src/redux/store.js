import { configureStore } from '@reduxjs/toolkit';
import formsReducer from './slices/formsSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import toastReducer from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    forms: formsReducer,
    auth: authReducer,
    ui: uiReducer,
    toast: toastReducer,
  },
});
