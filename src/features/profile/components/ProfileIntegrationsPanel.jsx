import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import HooksIcon from '@/features/forms/components/icons/HooksIcon';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import driveIcon from '@/assets/Icons/google-drive.svg';
import slackIcon from '@/assets/Icons/slack.svg';
import { isApiConfigured } from '@/config/env';
import {
  connectIntegration,
  disconnectIntegration,
  listWorkspaceIntegrations,
  mapConnectionsToUiState,
  redirectToOAuth,
} from '@/api/services/integrationsService';
import {
  readIntegrationSettings,
  writeIntegrationSettings,
} from '@/features/profile/utils/profileSettingsStorage';
import {
  DEFAULT_INTEGRATIONS,
  cloneIntegrations,
  mergeIntegrations,
} from '@/features/profile/utils/profileIntegrationDefaults';
import { useToast } from '@/hooks/useToast';
import IntegrationAppRow from '@/features/profile/components/IntegrationAppRow';
import GoogleSheetsConnectModal from '@/features/profile/components/GoogleSheetsConnectModal';

const AssetIcon = ({ src, className = 'size-4' }) => (
  <img src={src} alt="" className={`object-contain ${className}`} aria-hidden />
);

const ProfileIntegrationsPanel = () => {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const email = useSelector((s) => s.auth.email);
  const workspaces = useSelector((s) => s.forms.workspaces);
  const workspaceId = workspaces[0]?.id ?? null;
  const simulateSheetsFailure = searchParams.get('sheets_fail') === '1';
  const useApi = isApiConfigured() && Boolean(workspaceId);
  const [integrations, setIntegrations] = useState(() =>
    cloneIntegrations(DEFAULT_INTEGRATIONS),
  );
  const [sheetsConnectOpen, setSheetsConnectOpen] = useState(false);
  const [previewFailureFlow, setPreviewFailureFlow] = useState(false);

  const closeSheetsModal = () => {
    setSheetsConnectOpen(false);
    setPreviewFailureFlow(false);
  };

  const refreshFromApi = useCallback(async () => {
    if (!useApi) return;
    try {
      const rows = await listWorkspaceIntegrations(workspaceId);
      setIntegrations(mapConnectionsToUiState(rows));
    } catch {
      /* keep local fallback */
    }
  }, [useApi, workspaceId]);

  useEffect(() => {
    if (useApi) {
      refreshFromApi();
      return;
    }
    setIntegrations(mergeIntegrations(readIntegrationSettings(email)));
  }, [email, useApi, refreshFromApi]);

  useEffect(() => {
    if (!useApi) return;
    const connected = searchParams.get('connected');
    if (connected) {
      refreshFromApi();
      showToast({
        type: 'success',
        message: `${connected.replace(/_/g, ' ')} connected successfully.`,
        duration: 2800,
      });
    }
  }, [searchParams, useApi, refreshFromApi, showToast]);

  const persistLocal = useCallback(
    (next) => {
      setIntegrations(next);
      writeIntegrationSettings(email, next);
    },
    [email],
  );

  const setConnectedLocal = (key, connected) => {
    const next = cloneIntegrations(integrations);
    next[key].connected = connected;
    persistLocal(next);
  };

  const handleConfigure = (name) => {
    showToast({
      type: 'info',
      message: `${name} configuration opens from a form's share or settings panel.`,
      duration: 2800,
    });
  };

  const handleConnectProvider = async (key, name) => {
    if (useApi && workspaceId) {
      try {
        const { redirectUrl } = await connectIntegration(workspaceId, key);
        redirectToOAuth(redirectUrl);
      } catch (err) {
        showToast({
          type: 'error',
          message: err?.message || `Could not connect ${name}.`,
          duration: 3200,
        });
      }
      return;
    }
    if (isApiConfigured()) {
      showToast({
        type: 'error',
        message: 'Create a workspace before connecting integrations.',
        duration: 3200,
      });
      return;
    }
    setConnectedLocal(key, true);
    showToast({ type: 'success', message: `${name} connected (demo).`, duration: 2200 });
  };

  const handleDisconnect = async (key, name) => {
    const connectionId = integrations[key]?.connectionId;
    if (useApi && workspaceId && connectionId) {
      try {
        await disconnectIntegration(workspaceId, connectionId);
        await refreshFromApi();
        showToast({ type: 'success', message: `${name} disconnected.`, duration: 2200 });
      } catch (err) {
        showToast({
          type: 'error',
          message: err?.message ?? `Could not disconnect ${name}.`,
          duration: 2800,
        });
      }
      return;
    }
    if (useApi) {
      showToast({
        type: 'info',
        message: `${name} is not connected.`,
        duration: 2200,
      });
      return;
    }
    setConnectedLocal(key, false);
    showToast({ type: 'info', message: `${name} disconnected.`, duration: 2200 });
  };

  const handleGoogleSheetsConnect = () => {
    if (useApi) {
      handleConnectProvider('googleSheets', 'Google Sheets');
      closeSheetsModal();
      return;
    }
    setConnectedLocal('googleSheets', true);
    showToast({
      type: 'success',
      message: 'Google Sheets connected successfully.',
      duration: 2200,
    });
    closeSheetsModal();
  };

  return (
    <>
      {!useApi ? (
        <GoogleSheetsConnectModal
          open={sheetsConnectOpen}
          onClose={closeSheetsModal}
          onConfirm={handleGoogleSheetsConnect}
          simulateFailure={simulateSheetsFailure}
          initialSimulateFailure={previewFailureFlow}
        />
      ) : null}
      <section className="overflow-hidden rounded-[14px] border border-[#e8e8e6] bg-white">
        <div className="border-b border-[#f0f0ee] px-7 pb-[19px] pt-[22px]">
          <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-[#1a1a18]">
            Connected apps
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[#9e9e9a]">
            Apps currently linked to your Clearform account
          </p>
        </div>

        <IntegrationAppRow
          icon={<HooksIcon className="inline-flex size-4 shrink-0 items-center justify-center" />}
          iconClassName="border-[#fdba74] bg-[#fff7ed]"
          title="Webhook"
          description="Configure per form in Share settings"
          connected={integrations.webhook?.connected}
          onConnect={() => handleConfigure('Webhook')}
          onConfigure={() => handleConfigure('Webhook')}
          onDisconnect={() => handleDisconnect('webhook', 'Webhook')}
        />

        <IntegrationAppRow
          icon={<AssetIcon src={sheetsIcon} className="size-[22px]" />}
          iconClassName="border-[#bbf7d0] bg-[#f7f7f6]"
          title="Google Sheets"
          description="Auto-sync responses to a spreadsheet in real time"
          connected={integrations.googleSheets?.connected}
          onConnect={() => {
            if (useApi) {
              handleConnectProvider('googleSheets', 'Google Sheets');
            } else {
              setPreviewFailureFlow(false);
              setSheetsConnectOpen(true);
            }
          }}
          onConfigure={() => handleConfigure('Google Sheets')}
          onDisconnect={() => handleDisconnect('googleSheets', 'Google Sheets')}
        />

        <IntegrationAppRow
          icon={<AssetIcon src={slackIcon} className="size-[18px]" />}
          iconClassName="border-[rgba(81,76,84,0.15)] bg-[#f7f7f8]"
          title="Slack"
          description="Send notifications when responses arrive"
          connected={integrations.slack?.connected}
          onConnect={() => handleConnectProvider('slack', 'Slack')}
          onConfigure={() => handleConfigure('Slack')}
          onDisconnect={() => handleDisconnect('slack', 'Slack')}
        />

        <IntegrationAppRow
          icon={<AssetIcon src={driveIcon} className="size-[18px]" />}
          iconClassName="border-[rgba(81,76,84,0.15)] bg-[#f7f7f8]"
          title="Google Drive"
          description="Store uploads and exports in Drive"
          connected={integrations.googleDrive?.connected}
          onConnect={() => handleConnectProvider('googleDrive', 'Google Drive')}
          onConfigure={() => handleConfigure('Google Drive')}
          onDisconnect={() => handleDisconnect('googleDrive', 'Google Drive')}
        />

        {!useApi ? (
          <div className="border-t border-[#f0f0ee] px-7 py-3">
            <button
              type="button"
              onClick={() => {
                setPreviewFailureFlow(true);
                setSheetsConnectOpen(true);
              }}
              className="text-[12.5px] font-medium text-[#6b6b68] underline decoration-[#c9c7bf] underline-offset-2 transition-colors hover:text-[#1a1a18]"
            >
              Preview connection failure flow
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
};

export default ProfileIntegrationsPanel;
