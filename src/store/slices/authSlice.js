import { createSlice } from '@reduxjs/toolkit';
import { clearAuthSession } from '@/features/auth/utils/authStorage';

/**
 * UI auth state is in-memory only.
 * Real session: Supabase Auth JWT → Authorization Bearer → backend /auth/me.
 */
const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  isSubmitting: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setField(state, action) {
      const { field, value } = action.payload;
      state[field] = value;
    },
    setSubmitting(state, action) {
      state.isSubmitting = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    setAuthenticated(state, action) {
      state.isAuthenticated = action.payload;
      if (!action.payload) clearAuthSession();
    },
    setAuthInitialized(state, action) {
      state.isInitialized = action.payload;
    },
    loginSuccess(state, action) {
      const { email, firstName = '', lastName = '' } = action.payload;
      state.email = email;
      state.firstName = firstName;
      state.lastName = lastName;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.error = null;
      state.isSubmitting = false;
      // Do not persist auth to localStorage — Supabase session is the source of truth.
      clearAuthSession();
    },
    logout(state) {
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.password = '';
      state.error = null;
      state.isSubmitting = false;
      state.email = '';
      state.firstName = '';
      state.lastName = '';
      clearAuthSession();
    },
    resetForm(state) {
      state.firstName = '';
      state.lastName = '';
      state.email = '';
      state.password = '';
      state.error = null;
      state.isSubmitting = false;
    },
  },
});

export const {
  setField,
  setSubmitting,
  setError,
  setAuthenticated,
  setAuthInitialized,
  loginSuccess,
  logout,
  resetForm,
} = authSlice.actions;

export default authSlice.reducer;
