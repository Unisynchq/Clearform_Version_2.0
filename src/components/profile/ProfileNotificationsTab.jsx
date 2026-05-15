import { useState } from 'react';
import { CardHeader, SettingsCard } from './ProfileSettingsUi';

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0f0ee] px-7 py-[18px] last:border-b-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-[#1a1a18]">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[#6b6b68]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#1a1a18]' : 'bg-[#e8e8e6]'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export default function ProfileNotificationsTab() {
  const [emailDigest, setEmailDigest] = useState(true);
  const [responseAlerts, setResponseAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  return (
    <SettingsCard className="pt-3">
      <CardHeader
        title="Email notifications"
        subtitle="Control which updates Clearform sends to musharof@clearform.io"
      />
      <ToggleRow
        title="Weekly digest"
        description="Summary of form performance and top insights"
        checked={emailDigest}
        onChange={setEmailDigest}
      />
      <ToggleRow
        title="New response alerts"
        description="Get notified when a form receives a new submission"
        checked={responseAlerts}
        onChange={setResponseAlerts}
      />
      <ToggleRow
        title="Product updates"
        description="News about features and improvements"
        checked={productUpdates}
        onChange={setProductUpdates}
      />
    </SettingsCard>
  );
}
