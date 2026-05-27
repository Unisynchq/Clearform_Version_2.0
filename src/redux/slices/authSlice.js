import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  isSubmitting: false,
  error: null,
  isAuthenticated: false,
  user: null,
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
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      });
  },
});

export const { setField, setSubmitting, setError, setAuthenticated, resetForm } =
  authSlice.actions;

export default authSlice.reducer;
