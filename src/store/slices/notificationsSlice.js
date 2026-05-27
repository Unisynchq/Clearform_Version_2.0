import { createSlice } from '@reduxjs/toolkit';
import { readNotifications, writeNotifications } from '@/utils/notificationsStorage';

const initialState = {
  activeTab: 'all',
  notifications: readNotifications(),
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationTab(state, action) {
      state.activeTab = action.payload;
    },
    markNotificationRead(state, action) {
      const item = state.notifications.find((n) => n.id === action.payload);
      if (item) item.unread = false;
      writeNotifications(state.notifications);
    },
    /** Clears the inbox after UI exit animation (not individual mark-read). */
    clearAllNotifications(state) {
      state.notifications = [];
      writeNotifications(state.notifications);
    },
    markAllNotificationsRead(state) {
      state.notifications = [];
      writeNotifications(state.notifications);
    },
    addNotification(state, action) {
      const next = { unread: true, dateGroup: 'Today', timestamp: 'Just now', ...action.payload };
      if (!next.id) next.id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.notifications.unshift(next);
      writeNotifications(state.notifications);
    },
    upsertAlertNotification(state, action) {
      const { dedupeKey, notification, active } = action.payload;
      const idx = state.notifications.findIndex((n) => n.dedupeKey === dedupeKey);
      if (!active) {
        if (idx >= 0) state.notifications.splice(idx, 1);
        writeNotifications(state.notifications);
        return;
      }
      const item = {
        id: dedupeKey,
        dedupeKey,
        unread: idx >= 0 ? state.notifications[idx].unread : true,
        ...notification,
      };
      if (idx >= 0) {
        state.notifications[idx] = { ...state.notifications[idx], ...item };
      } else {
        state.notifications.unshift(item);
      }
      writeNotifications(state.notifications);
    },
    syncFormAlertNotifications(state, action) {
      const { formId, items } = action.payload;
      const prefix = `alert:${formId}:`;
      const activeKeys = new Set(
        items.filter((i) => i.active && i.notification).map((i) => i.dedupeKey),
      );

      state.notifications = state.notifications.filter((n) => {
        if (!n.dedupeKey?.startsWith(prefix)) return true;
        return activeKeys.has(n.dedupeKey);
      });

      items.forEach(({ dedupeKey, notification, active }) => {
        if (!active || !notification) return;
        const idx = state.notifications.findIndex((n) => n.dedupeKey === dedupeKey);
        const item = {
          id: dedupeKey,
          dedupeKey,
          unread: idx >= 0 ? state.notifications[idx].unread : true,
          ...notification,
        };
        if (idx >= 0) {
          state.notifications[idx] = { ...state.notifications[idx], ...item };
        } else {
          state.notifications.unshift(item);
        }
      });

      writeNotifications(state.notifications);
    },
    clearNotificationsForForm(state, action) {
      const formId = action.payload;
      const prefix = `alert:${formId}:`;
      state.notifications = state.notifications.filter((n) => !n.dedupeKey?.startsWith(prefix));
      writeNotifications(state.notifications);
    },
    syncSystemAlertNotifications(state, action) {
      const { items } = action.payload;
      const prefix = 'system:';
      const activeKeys = new Set(
        items.filter((i) => i.active && i.notification).map((i) => i.dedupeKey),
      );

      state.notifications = state.notifications.filter((n) => {
        if (!n.dedupeKey?.startsWith(prefix)) return true;
        return activeKeys.has(n.dedupeKey);
      });

      items.forEach(({ dedupeKey, notification, active }) => {
        if (!active || !notification) return;
        const idx = state.notifications.findIndex((n) => n.dedupeKey === dedupeKey);
        const item = {
          id: dedupeKey,
          dedupeKey,
          unread: idx >= 0 ? state.notifications[idx].unread : true,
          ...notification,
        };
        if (idx >= 0) {
          state.notifications[idx] = { ...state.notifications[idx], ...item };
        } else {
          state.notifications.unshift(item);
        }
      });

      writeNotifications(state.notifications);
    },
  },
});

export const {
  setNotificationTab,
  markNotificationRead,
  clearAllNotifications,
  markAllNotificationsRead,
  addNotification,
  upsertAlertNotification,
  syncFormAlertNotifications,
  clearNotificationsForForm,
  syncSystemAlertNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
