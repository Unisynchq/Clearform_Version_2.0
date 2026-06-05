import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RiCheckLine, RiShieldCheckLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import driveIcon from '@/assets/Icons/google-drive.svg';
import slackIcon from '@/assets/Icons/slack.svg';
import { isApiConfigured } from '@/config/env';
import {
  connectIntegration,
  disconnectIntegration,
  loadIntegrationUiState,
  redirectToOAuth,
  saveIntegrationMetadata,
} from '@/api/services/integrationsService';
import { mergeIntegrations } from '@/features/profile/utils/profileIntegrationDefaults';
import { useToast } from '@/hooks/useToast';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';

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

function IntegrationCard({ card, connected, onToggle, busy }) {
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
          disabled={busy}
          onClick={() => onToggle(false)}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] border border-[#86efac] bg-[#dcfce7] px-3 text-[11.5px] font-medium text-[#16a34a] transition-colors hover:bg-[#bbf7d0] disabled:opacity-60"
        >
          <RiCheckLine size={10} aria-hidden />
          Connected
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || card.key === 'notion'}
          onClick={() => onToggle(true)}
          className="h-7 shrink-0 rounded-[6px] border border-[#e5e4e0] bg-white px-[13px] text-[11.5px] font-medium text-[#0a0a0a] transition-colors hover:bg-[#f7f7f6] disabled:opacity-50"
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default function ManageIntegrationsModal({ open, onClose, formId, workspaceId }) {
  const [searchParams] = useSearchParams();
  const authSubmitting = useSelector((state) => state.auth.isSubmitting);
  const { showToast } = useToast();
  const [integrations, setIntegrations] = useState(() => mergeIntegrations(null));
  const [connectingKey, setConnectingKey] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [slackChannel, setSlackChannel] = useState('');
  const [loading, setLoading] = useState(false);

  const useApi = isApiConfigured();

  const applyIntegrationState = useCallback((mapped) => {
    setIntegrations(mapped);
    setSpreadsheetId(mapped.googleSheets?.metadata?.spreadsheetId ?? '');
    setSlackChannel(
      mapped.slack?.metadata?.slackChannel ?? mapped.slack?.metadata?.channel ?? '',
    );
  }, []);

  const refreshFromApi = useCallback(async () => {
    if (!useApi) return;
    setLoading(true);
    try {
      const mapped = await loadIntegrationUiState({ workspaceId, formId });
      applyIntegrationState(mapped);
    } catch {
      /* keep prior state */
    } finally {
      setLoading(false);
    }
  }, [applyIntegrationState, formId, useApi, workspaceId]);

  useEffect(() => {
    if (!open) return;
    if (useApi) {
      refreshFromApi();
      return;
    }
    applyIntegrationState(mergeIntegrations(null));
  }, [open, useApi, refreshFromApi, applyIntegrationState]);

  useEffect(() => {
    if (!open || !useApi) return;
    const connected = searchParams.get('connected');
    if (!connected) return;
    refreshFromApi();
    showToast({
      type: 'success',
      message: `${connected.replace(/_/g, ' ')} connected successfully.`,
      duration: 2800,
    });
  }, [open, searchParams, useApi, refreshFromApi, showToast]);

  const handleToggle = async (key, connected) => {
    if (authSubmitting) return;
    if (key === 'notion') {
      showToast({ type: 'info', message: 'Notion is not available yet.', duration: 2200 });
      return;
    }

    if (!connected) {
      const connectionId = integrations[key]?.connectionId;
      if (useApi && workspaceId && connectionId) {
        try {
          await disconnectIntegration(workspaceId, connectionId);
          await refreshFromApi();
          showToast({ type: 'success', message: 'Disconnected.', duration: 2200 });
        } catch (err) {
          showToast({
            type: 'error',
            message: err?.message ?? 'Could not disconnect.',
            duration: 2800,
          });
        }
        return;
      }
      if (useApi) {
        showToast({
          type: 'info',
          message: 'This integration is not connected.',
          duration: 2200,
        });
      }
      return;
    }

    if (useApi && workspaceId) {
      setConnectingKey(key);
      try {
        const token = await getFreshAuthToken();
        if (!token) {
          showToast({
            type: 'error',
            message: 'Session expired — sign in again.',
            duration: 3200,
          });
          return;
        }
        const { redirectUrl } = await connectIntegration(workspaceId, key);
        redirectToOAuth(redirectUrl);
      } catch (err) {
        showToast({
          type: 'error',
          message: err?.message || 'Could not start connection.',
          duration: 3200,
        });
      } finally {
        setConnectingKey(null);
      }
      return;
    }

    showToast({
      type: 'error',
      message: isApiConfigured()
        ? 'Workspace required to connect integrations.'
        : 'Connect your API to link integrations.',
      duration: 3200,
    });
  };

  const handleDone = async () => {
    if (!useApi) {
      showToast({
        type: 'error',
        message: 'Connect your API to save integration settings.',
        duration: 2800,
      });
      return;
    }
    const sheetsConnId = integrations.googleSheets?.connectionId;
    const slackConnId = integrations.slack?.connectionId;
    try {
      if (sheetsConnId && spreadsheetId.trim()) {
        await saveIntegrationMetadata(workspaceId, formId, sheetsConnId, {
          spreadsheetId: spreadsheetId.trim(),
        });
      }
      if (slackConnId && slackChannel.trim()) {
        await saveIntegrationMetadata(workspaceId, formId, slackConnId, {
          slackChannel: slackChannel.trim(),
        });
      }
      await refreshFromApi();
      showToast({ type: 'success', message: 'Integration settings saved.', duration: 2200 });
      onClose();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message ?? 'Could not save integration settings.',
        duration: 2800,
      });
    }
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

      {useApi && (integrations.googleSheets?.connected || integrations.slack?.connected) ? (
        <div className="space-y-2 px-6 pt-2">
          {integrations.googleSheets?.connected ? (
            <label className="block text-[12px] text-[#6b6965]">
              Google Sheets spreadsheet ID
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="Spreadsheet ID from URL"
                className="mt-1 w-full rounded-[8px] border border-[#e5e4e0] px-3 py-2 text-[13px] text-[#0a0a0a]"
              />
            </label>
          ) : null}
          {integrations.slack?.connected ? (
            <label className="block text-[12px] text-[#6b6965]">
              Slack channel
              <input
                type="text"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#channel-name"
                className="mt-1 w-full rounded-[8px] border border-[#e5e4e0] px-3 py-2 text-[13px] text-[#0a0a0a]"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="px-6 pt-4 text-[12px] text-[#9b9b97]">Loading connections…</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 px-6 pb-2 pt-4">
        {INTEGRATION_CARDS.map((card) => (
          <IntegrationCard
            key={card.key}
            card={card}
            connected={integrations[card.key]?.connected ?? false}
            onToggle={(connected) => handleToggle(card.key, connected)}
            busy={connectingKey === card.key || authSubmitting}
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
