import { createSlice } from '@reduxjs/toolkit';
import {
  readAuthSession,
  writeAuthSession,
  clearAuthSession,
  isAuthSessionValid,
} from '@/features/auth/utils/authStorage';

const savedSession = isAuthSessionValid() ? readAuthSession() : null;

const initialState = {
  firstName: savedSession?.firstName ?? '',
  lastName: savedSession?.lastName ?? '',
  email: savedSession?.email ?? '',
  password: '',
  isSubmitting: false,
  error: null,
  isAuthenticated: savedSession?.isAuthenticated === true,
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
    loginSuccess(state, action) {
      const { email, firstName = '', lastName = '' } = action.payload;
      state.email = email;
      state.firstName = firstName;
      state.lastName = lastName;
      state.isAuthenticated = true;
      state.error = null;
      state.isSubmitting = false;
      writeAuthSession({ email, firstName, lastName });
    },
    logout(state) {
      state.isAuthenticated = false;
      state.password = '';
      state.error = null;
      state.isSubmitting = false;
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
  loginSuccess,
  logout,
  resetForm,
} = authSlice.actions;

export default authSlice.reducer;
