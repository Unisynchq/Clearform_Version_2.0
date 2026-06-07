import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { readNotifications, writeNotifications } from '@/utils/notificationsStorage';
import { listNotifications } from '@/api/services/notificationsService';
import { isApiConfigured } from '@/config/env';

function dateGroupLabel(isoString) {
  if (!isoString) return 'Earlier';
  const d = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  return 'Earlier';
}

function relativeTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

const TYPE_ICON = {
  new_response: { iconType: 'check', iconBg: '#e8f5e9', category: 'forms' },
  ai_summary: { iconType: 'chat', iconBg: '#e3f2fd', category: 'alerts' },
  alert: { iconType: 'warning', iconBg: '#fff8e1', category: 'alerts' },
};

function mapApiNotification(item) {
  const { iconType, iconBg, category } =
    TYPE_ICON[item.type] ?? { iconType: 'check', iconBg: '#f5f5f5', category: 'all' };
  return {
    id: item.id,
    unread: !item.readAt,
    title: item.title,
    bodySegments: [{ bold: false, text: item.body ?? '' }],
    timestamp: relativeTimestamp(item.createdAt),
    dateGroup: dateGroupLabel(item.createdAt),
    iconType,
    iconBg,
    category,
    formId: item.formId,
  };
}

export const loadNotificationsFromApi = createAsyncThunk(
  'notifications/loadFromApi',
  async () => {
    if (!isApiConfigured()) return [];
    try {
      const { items } = await listNotifications();
      return items.map(mapApiNotification);
    } catch {
      return [];
    }
  },
);

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
  extraReducers(builder) {
    builder.addCase(loadNotificationsFromApi.fulfilled, (state, action) => {
      const apiItems = action.payload;
      if (!apiItems.length) return;
      const existingIds = new Set(state.notifications.map((n) => n.id));
      const newItems = apiItems.filter((n) => !existingIds.has(n.id));
      if (!newItems.length) return;
      state.notifications = [...newItems, ...state.notifications];
      writeNotifications(state.notifications);
    });
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
