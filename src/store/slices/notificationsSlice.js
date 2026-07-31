import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { readNotifications, writeNotifications } from '@/utils/notificationsStorage';
import {
  listNotifications,
  markAllNotificationsReadOnServer,
  markNotificationReadOnServer,
  deleteAllNotifications,
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
  daily_report: { iconType: 'chat', iconBg: '#e3f2fd', category: 'alerts' },
  billing_receipt: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  billing_expiring: { iconType: 'warning', iconBg: '#fff8e1', category: 'alerts' },
  billing_pilot_activated: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  password_changed: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  export: { iconType: 'check', iconBg: '#e8f5e9', category: 'forms' },
  webhook_connected: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  webhook_disconnected: { iconType: 'warning', iconBg: '#fff8e1', category: 'alerts' },
  invite_single: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  invite_multiple: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  active_session: { iconType: 'warning', iconBg: '#fff8e1', category: 'alerts' },
  template_created: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
  template_deleted: { iconType: 'warning', iconBg: '#fff8e1', category: 'alerts' },
  preferences_updated: { iconType: 'check', iconBg: '#e8f5e9', category: 'alerts' },
};

function mapApiNotification(item) {
  const { iconType, iconBg, category } =
    TYPE_ICON[item.type] ?? { iconType: 'check', iconBg: '#f5f5f5', category: 'all' };
  const mapped = {
    id: item.id,
    unread: !item.readAt,
    title: item.title,
    bodySegments: [{ bold: false, text: item.body ?? '' }],
    timestamp: relativeTimestamp(item.createdAt),
    dateGroup: dateGroupLabel(item.createdAt),
    iconType,
    iconBg,
    category,
    type: item.type,
    formId: item.formId,
    readAt: item.readAt,
    createdAt: item.createdAt,
  };
  if (item.action) {
    mapped.action = typeof item.action === 'object' ? item.action : JSON.parse(item.action);
  }
  return mapped;
}

function isLocalNotificationId(id) {
  const value = String(id ?? '');
  return value.includes(':') || value.startsWith('n-');
}

export function persistNotifications(notifications) {
  if (!isApiConfigured()) {
    writeNotifications(notifications);
  }
}

function dismissAndClearInbox(state) {
  if (!state.dismissedKeys) state.dismissedKeys = {};
  for (const n of state.notifications) {
    if (n.dedupeKey) state.dismissedKeys[n.dedupeKey] = true;
    if (n.id != null) state.dismissedKeys[String(n.id)] = true;
  }
  state.notifications = [];
  state.unreadCount = 0;
  persistNotifications(state.notifications);
}

function isDismissedKey(state, key) {
  return key != null && !!state.dismissedKeys?.[String(key)];
}

function updateUnreadCount(state) {
  state.unreadCount = state.notifications.filter((n) => n.unread).length;
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
        await deleteAllNotifications();
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
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotificationTab(state, action) {
      state.activeTab = action.payload;
    },
    markNotificationRead(state, action) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) {
        n.unread = false;
        n.readAt = new Date().toISOString();
      }
      updateUnreadCount(state);
      persistNotifications(state.notifications);
    },
    clearAllNotifications(state) {
      dismissAndClearInbox(state);
    },
    markAllNotificationsRead(state) {
      state.notifications.forEach((n) => {
        n.unread = false;
        n.readAt = new Date().toISOString();
      });
      state.unreadCount = 0;
      persistNotifications(state.notifications);
    },
    addNotification(state, action) {
      const next = { unread: true, dateGroup: 'Today', timestamp: 'Just now', ...action.payload };
      if (!next.id) next.id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (!next.type) next.type = 'alert';
      const { iconType, iconBg, category } = TYPE_ICON[next.type] ?? TYPE_ICON.alert;
      next.iconType = next.iconType ?? iconType;
      next.iconBg = next.iconBg ?? iconBg;
      next.category = next.category ?? category;
      if (typeof next.body === 'string') {
        next.bodySegments = [{ bold: false, text: next.body }];
      }
      state.notifications.unshift(next);
      updateUnreadCount(state);
      persistNotifications(state.notifications);
    },
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
    receiveRealtimeNotification(state, action) {
      const item = mapApiNotification(action.payload);
      const existing = state.notifications.find((n) => n.id === item.id);
      if (existing) return;
      state.notifications.unshift(item);
      updateUnreadCount(state);
      persistNotifications(state.notifications);
    },
    upsertAlertNotification(state, action) {
      const { dedupeKey, notification, active } = action.payload;
      if (active && isDismissedKey(state, dedupeKey)) return;
      const idx = state.notifications.findIndex((n) => n.dedupeKey === dedupeKey);
      if (!active) {
        if (idx >= 0) state.notifications.splice(idx, 1);
        updateUnreadCount(state);
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
      updateUnreadCount(state);
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

      updateUnreadCount(state);
      persistNotifications(state.notifications);
    },
    clearNotificationsForForm(state, action) {
      const formId = action.payload;
      const prefix = `alert:${formId}:`;
      state.notifications = state.notifications.filter((n) => !n.dedupeKey?.startsWith(prefix));
      updateUnreadCount(state);
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

      updateUnreadCount(state);
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
        updateUnreadCount(state);
        persistNotifications(state.notifications);
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const n = state.notifications.find((n) => n.id === action.payload);
        if (n) {
          n.unread = false;
          n.readAt = new Date().toISOString();
        }
        updateUnreadCount(state);
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
  setUnreadCount,
  receiveRealtimeNotification,
  upsertAlertNotification,
  syncFormAlertNotifications,
  clearNotificationsForForm,
  syncSystemAlertNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
