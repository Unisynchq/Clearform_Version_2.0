import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { readNotifications, writeNotifications } from '@/utils/notificationsStorage';
import {
  listNotifications,
  markAllNotificationsReadOnServer,
  markNotificationReadOnServer,
} from '@/api/services/notificationsService';
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

function isLocalNotificationId(id) {
  const value = String(id ?? '');
  return value.includes(':') || value.startsWith('n-');
}

function persistNotifications(notifications) {
  if (!isApiConfigured()) {
    writeNotifications(notifications);
  }
}

/** Record current inbox items as dismissed so alert sync cannot immediately restore them. */
function dismissAndClearInbox(state) {
  if (!state.dismissedKeys) state.dismissedKeys = {};
  for (const n of state.notifications) {
    if (n.dedupeKey) state.dismissedKeys[n.dedupeKey] = true;
    if (n.id != null) state.dismissedKeys[String(n.id)] = true;
  }
  state.notifications = [];
  persistNotifications(state.notifications);
}

function isDismissedKey(state, key) {
  return key != null && !!state.dismissedKeys?.[String(key)];
}

export const loadNotificationsFromApi = createAsyncThunk(
  'notifications/loadFromApi',
  async () => {
    if (!isApiConfigured()) return [];
    try {
      const { items } = await listNotifications();
      return items.filter((item) => !item.readAt).map(mapApiNotification);
    } catch {
      return [];
    }
  },
);

export const markNotificationReadThunk = createAsyncThunk(
  'notifications/markReadThunk',
  async (id) => {
    if (isApiConfigured() && !isLocalNotificationId(id)) {
      try {
        await markNotificationReadOnServer(id);
      } catch {
        // Keep inbox responsive even if the API is temporarily unavailable.
      }
    }
    return id;
  },
);

export const clearAllNotificationsThunk = createAsyncThunk(
  'notifications/clearAllThunk',
  async () => {
    if (isApiConfigured()) {
      try {
        await markAllNotificationsReadOnServer();
      } catch {
        // Local clear still runs so the user is not stuck with a stale inbox.
      }
    }
  },
);

const initialState = {
  activeTab: 'all',
  notifications: isApiConfigured() ? [] : readNotifications(),
  dismissedKeys: {},
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationTab(state, action) {
      state.activeTab = action.payload;
    },
    markNotificationRead(state, action) {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      persistNotifications(state.notifications);
    },
    /** Clears the inbox after UI exit animation (not individual mark-read). */
    clearAllNotifications(state) {
      dismissAndClearInbox(state);
    },
    markAllNotificationsRead(state) {
      dismissAndClearInbox(state);
    },
    addNotification(state, action) {
      const next = { unread: true, dateGroup: 'Today', timestamp: 'Just now', ...action.payload };
      if (!next.id) next.id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      state.notifications.unshift(next);
      persistNotifications(state.notifications);
    },
    upsertAlertNotification(state, action) {
      const { dedupeKey, notification, active } = action.payload;
      if (active && isDismissedKey(state, dedupeKey)) return;
      const idx = state.notifications.findIndex((n) => n.dedupeKey === dedupeKey);
      if (!active) {
        if (idx >= 0) state.notifications.splice(idx, 1);
        persistNotifications(state.notifications);
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
      persistNotifications(state.notifications);
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
        if (!active || !notification || isDismissedKey(state, dedupeKey)) return;
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

      persistNotifications(state.notifications);
    },
    clearNotificationsForForm(state, action) {
      const formId = action.payload;
      const prefix = `alert:${formId}:`;
      state.notifications = state.notifications.filter((n) => !n.dedupeKey?.startsWith(prefix));
      persistNotifications(state.notifications);
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
        if (!active || !notification || isDismissedKey(state, dedupeKey)) return;
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

      persistNotifications(state.notifications);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(clearAllNotificationsThunk.pending, (state) => {
        dismissAndClearInbox(state);
      })
      .addCase(loadNotificationsFromApi.fulfilled, (state, action) => {
        const apiItems = action.payload.filter((n) => !isDismissedKey(state, n.id));
        const localOnly = state.notifications.filter(
          (n) => n.dedupeKey || isLocalNotificationId(n.id),
        );
        const apiIds = new Set(apiItems.map((n) => n.id));
        const mergedLocal = localOnly.filter(
          (n) => !apiIds.has(n.id) && !isDismissedKey(state, n.dedupeKey ?? n.id),
        );
        state.notifications = [...apiItems, ...mergedLocal];
        persistNotifications(state.notifications);
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
        persistNotifications(state.notifications);
      })
      .addCase(clearAllNotificationsThunk.fulfilled, (state) => {
        dismissAndClearInbox(state);
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
