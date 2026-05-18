import { useRef, useState } from 'react';
import { RiMailLine, RiSmartphoneLine } from 'react-icons/ri';
import { useToast } from '../../hooks/useToast';
import { CardHeader, GhostButton, PrimaryButton, SettingsCard } from './ProfileSettingsUi';

function NotificationToggle({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-[20px] transition-colors ${
        on ? 'bg-[#1a1a18]' : 'bg-[#ebebea]'
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
          on ? 'left-[18px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function PreferenceRow({ title, description, emailOn, pushOn, onEmailChange, onPushChange }) {
  return (
    <div className="flex items-stretch border-b border-[#eeede9] last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-7 py-4">
        <p className="text-[13.5px] font-medium text-[#1a1a18]">{title}</p>
        <p className="text-[12.5px] text-[#6b6b68]">{description}</p>
      </div>
      <div className="flex w-[90px] shrink-0 items-center justify-center border-l border-[#eeede9] px-3">
        <NotificationToggle on={emailOn} onChange={onEmailChange} />
      </div>
      <div className="flex w-[90px] shrink-0 items-center justify-center border-l border-[#eeede9] px-3">
        <NotificationToggle on={pushOn} onChange={onPushChange} />
      </div>
    </div>
  );
}

const DEFAULT_PREFS = {
  newResponse: { email: true, push: false },
  weeklyDigest: { email: true, push: false },
  mentions: { email: true, push: false },
};

function prefsSnapshot(prefs) {
  return JSON.stringify(prefs);
}

export default function ProfileNotificationsTab() {
  const { showToast } = useToast();
  const baselineRef = useRef(prefsSnapshot(DEFAULT_PREFS));
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const dirty = prefsSnapshot(prefs) !== baselineRef.current;

  const updatePref = (key, channel, value) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: value },
    }));
  };

  const handleSave = () => {
    baselineRef.current = prefsSnapshot(prefs);
    showToast({
      type: 'success',
      message: 'Your preferences have been saved',
      duration: 3200,
    });
  };

  const handleDiscard = () => {
    setPrefs(JSON.parse(baselineRef.current));
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard className="overflow-hidden rounded-[14px] border-[#e8e8e6] pt-[13px]">
        <CardHeader
          title="Notification preferences"
          subtitle="Control which events trigger notifications and through which channels"
          titleClassName="text-[14px]"
        />

        <div className="flex h-[39px] items-center border-b border-[#e8e8e6] bg-[#f7f7f6]">
          <div className="flex flex-1 items-center px-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
              Event
            </span>
          </div>
          <div className="flex w-[90px] items-center justify-center gap-1 border-l border-[#e8e8e6] text-[#9e9e9a]">
            <RiMailLine size={13} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px]">Email</span>
          </div>
          <div className="flex w-[90px] items-center justify-center gap-1 border-l border-[#e8e8e6] text-[#9e9e9a]">
            <RiSmartphoneLine size={13} aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-[0.66px]">Push</span>
          </div>
        </div>

        <div className="border-b border-t border-[#f0f0ee] bg-[#f7f7f6] px-7 py-2.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.74px] text-[#9e9e9a]">
            Responses
          </span>
        </div>

        <PreferenceRow
          title="New response received"
          description="When any form in your workspace gets a new submission"
          emailOn={prefs.newResponse.email}
          pushOn={prefs.newResponse.push}
          onEmailChange={(v) => updatePref('newResponse', 'email', v)}
          onPushChange={(v) => updatePref('newResponse', 'push', v)}
        />
        <PreferenceRow
          title="Weekly digest"
          description="Summary of form performance and top insights every Monday"
          emailOn={prefs.weeklyDigest.email}
          pushOn={prefs.weeklyDigest.push}
          onEmailChange={(v) => updatePref('weeklyDigest', 'email', v)}
          onPushChange={(v) => updatePref('weeklyDigest', 'push', v)}
        />
        <PreferenceRow
          title="@mentioned in comment"
          description="When a teammate mentions you in a form note or comment"
          emailOn={prefs.mentions.email}
          pushOn={prefs.mentions.push}
          onEmailChange={(v) => updatePref('mentions', 'email', v)}
          onPushChange={(v) => updatePref('mentions', 'push', v)}
        />

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#f0f0ee] px-7 py-5 sm:flex-row sm:items-center">
          <GhostButton type="button" onClick={handleDiscard} disabled={!dirty}>
            Discard changes
          </GhostButton>
          <PrimaryButton type="button" onClick={handleSave} disabled={!dirty}>
            Save preferences
          </PrimaryButton>
        </div>
      </SettingsCard>
    </div>
  );
}
