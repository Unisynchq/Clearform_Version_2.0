import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import HooksIcon from '@/features/forms/components/icons/HooksIcon';
import sheetsIcon from '@/assets/Icons/sheets.svg';
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
  const simulateSheetsFailure = searchParams.get('sheets_fail') === '1';
  const [integrations, setIntegrations] = useState(() =>
    cloneIntegrations(DEFAULT_INTEGRATIONS)
  );
  const [sheetsConnectOpen, setSheetsConnectOpen] = useState(false);
  const [previewFailureFlow, setPreviewFailureFlow] = useState(false);

  const closeSheetsModal = () => {
    setSheetsConnectOpen(false);
    setPreviewFailureFlow(false);
  };

  useEffect(() => {
    setIntegrations(mergeIntegrations(readIntegrationSettings(email)));
  }, [email]);

  const persist = useCallback(
    (next) => {
      setIntegrations(next);
      writeIntegrationSettings(email, next);
    },
    [email]
  );

  const setConnected = (key, connected) => {
    const next = cloneIntegrations(integrations);
    next[key].connected = connected;
    persist(next);
  };

  const handleConfigure = (name) => {
    showToast({
      type: 'info',
      message: `${name} configuration is not available in this demo.`,
      duration: 2400,
    });
  };

  const handleConnect = (key, name) => {
    setConnected(key, true);
    showToast({ type: 'success', message: `${name} connected.`, duration: 2200 });
  };

  const handleGoogleSheetsConnect = () => {
    setConnected('googleSheets', true);
    showToast({
      type: 'success',
      message: 'Google Sheets connected successfully.',
      duration: 2200,
    });
  };

  const handleDisconnect = (key, name) => {
    setConnected(key, false);
    showToast({ type: 'info', message: `${name} disconnected.`, duration: 2200 });
  };

  return (
    <>
    <GoogleSheetsConnectModal
      open={sheetsConnectOpen}
      onClose={closeSheetsModal}
      onConfirm={handleGoogleSheetsConnect}
      simulateFailure={simulateSheetsFailure}
      initialSimulateFailure={previewFailureFlow}
    />
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
        description="Push responses to an endpoint"
        connected={integrations.webhook.connected}
        onConnect={() => handleConnect('webhook', 'Webhook')}
        onConfigure={() => handleConfigure('Webhook')}
        onDisconnect={() => handleDisconnect('webhook', 'Webhook')}
      />

      <IntegrationAppRow
        icon={<AssetIcon src={sheetsIcon} className="size-[22px]" />}
        iconClassName="border-[#bbf7d0] bg-[#f7f7f6]"
        title="Google Sheets"
        description="Auto-sync responses to a spreadsheet in real time"
        connected={integrations.googleSheets.connected}
        onConnect={() => {
          setPreviewFailureFlow(false);
          setSheetsConnectOpen(true);
        }}
        onConfigure={() => handleConfigure('Google Sheets')}
        onDisconnect={() => handleDisconnect('googleSheets', 'Google Sheets')}
      />

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
    </section>
    </>
  );
};

export default ProfileIntegrationsPanel;
