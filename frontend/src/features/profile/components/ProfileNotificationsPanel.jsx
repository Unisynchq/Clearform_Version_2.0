import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiCheckLine, RiMailLine, RiSmartphoneLine } from 'react-icons/ri';
import {
  readNotificationSettings,
  writeNotificationSettings,
} from '@/features/profile/utils/profileSettingsStorage';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_EVENT_GROUPS,
  cloneNotificationPreferences,
  mergeNotificationPreferences,
  notificationPreferencesEqual,
} from '@/features/profile/utils/profileNotificationDefaults';
import { useToast } from '@/hooks/useToast';

const ghostBtnClass =
  'rounded-[6px] px-[15px] py-2 text-[13px] font-medium text-[#6b6b68] hover:bg-[#f7f7f6] transition-colors disabled:opacity-40 disabled:pointer-events-none';

const PreferenceToggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-[19px] w-[34px] shrink-0 items-center rounded-full border-0 p-0 transition-colors focus:outline-none ${
      checked ? 'bg-[#1a1a18]' : 'bg-[#e8e8e6]'
    }`}
  >
    <span
      className={`absolute size-[14px] rounded-[7px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-transform ${
        checked ? 'translate-x-[17px]' : 'translate-x-[2.5px]'
      }`}
    />
  </button>
);

const ColumnHeader = ({ icon: Icon, label }) => (
  <div className="flex items-center justify-center gap-1">
    <Icon size={13} className="text-[#9e9e9a]" aria-hidden />
    <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
      {label}
    </span>
  </div>
);

const NotificationRow = ({ event, channels, onToggle }) => (
  <div className="grid grid-cols-1 gap-4 border-b border-[#f0f0ee] py-[15px] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_90px_90px] sm:items-center sm:gap-0">
    <div className="min-w-0 pr-0 sm:pr-6">
      <p className="text-[13.5px] font-medium text-[#1a1a18]">{event.title}</p>
      <p className="mt-0.5 text-[12.5px] leading-[17.5px] text-[#6b6b68]">{event.description}</p>
    </div>
    <div className="flex items-center justify-between sm:justify-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a] sm:hidden">
        Email
      </span>
      <PreferenceToggle
        checked={channels.email}
        onChange={(next) => onToggle(event.id, 'email', next)}
        label={`${event.title} — email notifications`}
      />
    </div>
    <div className="flex items-center justify-between sm:justify-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a] sm:hidden">
        Push
      </span>
      <PreferenceToggle
        checked={channels.push}
        onChange={(next) => onToggle(event.id, 'push', next)}
        label={`${event.title} — push notifications`}
      />
    </div>
  </div>
);

const ProfileNotificationsPanel = ({ email }) => {
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState(() =>
    cloneNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
  );
  const [isSaving, setIsSaving] = useState(false);
  const savedRef = useRef(cloneNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES));

  const hydrate = useCallback(() => {
    const merged = mergeNotificationPreferences(readNotificationSettings(email));
    setPreferences(merged);
    savedRef.current = cloneNotificationPreferences(merged);
  }, [email]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const hasChanges = useMemo(
    () => !notificationPreferencesEqual(preferences, savedRef.current),
    [preferences]
  );

  const handleToggle = (eventId, channel, value) => {
    setPreferences((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [channel]: value },
    }));
  };

  const handleReset = () => {
    setPreferences(cloneNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const next = cloneNotificationPreferences(preferences);
    writeNotificationSettings(email, next);
    savedRef.current = next;
    setIsSaving(false);
    showToast({ type: 'success', message: 'Notification preferences saved.', duration: 2200 });
  };

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#e8e8e6] bg-white">
      <div className="border-b border-[#f0f0ee] px-7 pb-[19px] pt-[22px]">
        <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">
          Notification preferences
        </h2>
        <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
          Control which events trigger notifications and through which channels
        </p>
      </div>

      <div className="hidden border-b border-[#e8e8e6] bg-[#f7f7f6] sm:grid sm:grid-cols-[minmax(0,1fr)_90px_90px] sm:px-7 sm:py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
          Event
        </span>
        <ColumnHeader icon={RiMailLine} label="Email" />
        <ColumnHeader icon={RiSmartphoneLine} label="Push" />
      </div>

      {NOTIFICATION_EVENT_GROUPS.map((group) => (
        <div key={group.id}>
          <div className="border-b border-[#f0f0ee] bg-[#f7f7f6] px-7 pb-[7px] pt-[11px]">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.74px] text-[#9e9e9a]">
              {group.label}
            </p>
          </div>
          <div className="px-7">
            {group.events.map((event) => (
              <NotificationRow
                key={event.id}
                event={event}
                channels={preferences[event.id]}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f0ee] px-7 pb-5 pt-[21px]">
        <button type="button" onClick={handleReset} className={ghostBtnClass}>
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`inline-flex items-center gap-1.5 rounded-[6px] px-[18px] py-[9px] text-[13.5px] font-medium text-white transition-colors ${
            hasChanges
              ? 'bg-[#1a1a18] hover:bg-[#2d2d2b]'
              : 'bg-[#6b6b68] cursor-not-allowed'
          }`}
        >
          <RiCheckLine size={14} aria-hidden />
          {isSaving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </section>
  );
};

export default ProfileNotificationsPanel;
