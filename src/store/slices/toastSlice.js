import { createSlice } from '@reduxjs/toolkit';

// Monotonic counter — guarantees unique IDs even if multiple toasts are
// dispatched in the same millisecond. Replaces the previous
// `Date.now() + Math.random()` which could (rarely) collide and produced
// non-deterministic, hard-to-debug React keys.
let nextToastId = 1;

const toastSlice = createSlice({
  name: 'toast',
  initialState: {
    toasts: [],
  },
  reducers: {
    addToast: (state, action) => {
      const toast = {
        id: nextToastId++,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const { addToast, removeToast, clearAllToasts } = toastSlice.actions;
export default toastSlice.reducer;
