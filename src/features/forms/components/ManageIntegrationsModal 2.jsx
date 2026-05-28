import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RiCheckLine, RiShieldCheckLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import driveIcon from '@/assets/Icons/google-drive.svg';
import slackIcon from '@/assets/Icons/slack.svg';
import {
  readIntegrationSettings,
  writeIntegrationSettings,
} from '@/features/profile/utils/profileSettingsStorage';
import {
  cloneIntegrations,
  mergeIntegrations,
} from '@/features/profile/utils/profileIntegrationDefaults';

const AssetIcon = ({ src, className = 'size-4' }) => (
  <img src={src} alt="" className={`object-contain ${className}`} aria-hidden />
);

const NotionMark = () => (
  <span className="text-[11px] font-bold leading-none text-[#0a0a0a]" aria-hidden>
    N
  </span>
);

const INTEGRATION_CARDS = [
  {
    key: 'googleSheets',
    title: ['Google', 'Sheets'],
    icon: <AssetIcon src={sheetsIcon} className="size-4" />,
    iconWrap: 'border-[#dedde0] bg-[#f7f7f8]',
  },
  {
    key: 'googleDrive',
    title: 'Drive',
    icon: <AssetIcon src={driveIcon} className="size-4" />,
    iconWrap: 'border-[rgba(81,76,84,0.15)] bg-[#f7f7f8]',
  },
  {
    key: 'slack',
    title: 'Slack',
    icon: <AssetIcon src={slackIcon} className="size-4" />,
    iconWrap: 'border-[rgba(81,76,84,0.15)] bg-[#f7f7f8]',
  },
  {
    key: 'notion',
    title: 'Notion',
    icon: <NotionMark />,
    iconWrap: 'bg-[#f0f9ff]',
    iconBoxClass: 'border-0',
  },
];

function IntegrationCard({ card, connected, onToggle }) {
  const titleLines = Array.isArray(card.title) ? card.title : [card.title];

  return (
    <div
      className={`flex min-h-[62px] items-center justify-between rounded-[9px] border px-[17px] py-[15px] ${
        connected
          ? 'border-[#86efac] bg-[#f0fdf4]'
          : 'border-[#e5e4e0] bg-white'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] border ${card.iconWrap} ${card.iconBoxClass ?? ''}`}
        >
          {card.icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-[#0a0a0a]">
            {titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p
            className={`mt-px text-[11px] ${connected ? 'text-[#16a34a]' : 'text-[#b0aea8]'}`}
          >
            {connected ? 'Connected' : 'Not connected'}
          </p>
        </div>
      </div>

      {connected ? (
        <button
          type="button"
          onClick={() => onToggle(false)}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] border border-[#86efac] bg-[#dcfce7] px-3 text-[11.5px] font-medium text-[#16a34a] transition-colors hover:bg-[#bbf7d0]"
        >
          <RiCheckLine size={10} aria-hidden />
          Connected
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggle(true)}
          className="h-7 shrink-0 rounded-[6px] border border-[#e5e4e0] bg-white px-[13px] text-[11.5px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#f7f7f6]"
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default function ManageIntegrationsModal({ open, onClose }) {
  const email = useSelector((state) => state.auth.email);
  const [integrations, setIntegrations] = useState(() => mergeIntegrations(null));

  useEffect(() => {
    if (open) {
      setIntegrations(mergeIntegrations(readIntegrationSettings(email)));
    }
  }, [open, email]);

  const persist = useCallback(
    (next) => {
      setIntegrations(next);
      if (email) {
        writeIntegrationSettings(email, cloneIntegrations(next));
      }
    },
    [email]
  );

  const handleToggle = (key, connected) => {
    persist({
      ...integrations,
      [key]: { connected },
    });
  };

  const handleDone = () => {
    if (email) {
      writeIntegrationSettings(email, cloneIntegrations(integrations));
    }
    onClose();
  };

  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,560px)]"
      className="overflow-hidden rounded-[16px] p-0 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
    >
      <div className="px-6 pt-[22px]">
        <div className="flex size-11 items-center justify-center rounded-[12px] bg-[#eff6ff] text-[#3b82f6]">
          <RiShieldCheckLine size={22} aria-hidden />
        </div>
        <h2 className="mt-2 text-[16px] font-bold tracking-[-0.3px] text-[#0a0a0a]">
          Manage integrations
        </h2>
        <p className="mt-1 text-[13px] leading-[20px] text-[#6b6965]">
          Connect your form to other tools to automatically route responses. Changes apply
          immediately.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-6 pb-2 pt-4">
        {INTEGRATION_CARDS.map((card) => (
          <IntegrationCard
            key={card.key}
            card={card}
            connected={integrations[card.key]?.connected ?? false}
            onToggle={(connected) => handleToggle(card.key, connected)}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2 border-t border-[#e5e4e0] px-6 pb-4 pt-[17px]">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-[8px] border border-[#e5e4e0] px-[17px] text-[13px] font-medium text-[#6b6965] transition-colors hover:bg-[#f7f7f6]"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="h-9 rounded-[8px] bg-[#0a0a0a] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#333]"
        >
          Done
        </button>
      </div>
    </ProfileModal>
  );
}
