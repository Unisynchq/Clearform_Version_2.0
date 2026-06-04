import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { closeIntegrationsPanel } from '@/store/slices/uiSlice';
import HooksIcon from '@/features/forms/components/icons/HooksIcon';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import { isApiConfigured } from '@/config/env';
import {
  listFormIntegrations,
  mapConnectionsToUiState,
} from '@/api/services/integrationsService';
import { mergeIntegrations } from '@/features/profile/utils/profileIntegrationDefaults';
import {
  readIntegrationSettings,
} from '@/features/profile/utils/profileSettingsStorage';
import IntegrationAppRow from '@/features/profile/components/IntegrationAppRow';

const panelEase = [0.25, 0.1, 0.25, 1];

const AssetIcon = ({ src, className = 'size-4' }) => (
  <img src={src} alt="" className={`object-contain ${className}`} aria-hidden />
);

const IntegrationsPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOpen = useSelector((state) => state.ui.integrationsPanel.open);
  const activeFormId = useSelector((state) => state.ui.formOverlay.formId);
  const email = useSelector((state) => state.auth.email);
  const [integrations, setIntegrations] = useState(() => mergeIntegrations(null));

  const useApi = isApiConfigured() && Boolean(activeFormId);

  const refreshFromApi = useCallback(async () => {
    if (!useApi || !activeFormId) return;
    try {
      const rows = await listFormIntegrations(activeFormId);
      setIntegrations(mapConnectionsToUiState(rows));
    } catch {
      /* keep prior */
    }
  }, [useApi, activeFormId]);

  useEffect(() => {
    if (!isOpen) return;
    if (useApi) {
      refreshFromApi();
      return;
    }
    setIntegrations(mergeIntegrations(readIntegrationSettings(email)));
  }, [isOpen, email, useApi, refreshFromApi]);

  useEffect(() => {
    if (!isOpen || !useApi) return;
    if (searchParams.get('connected')) {
      refreshFromApi();
    }
  }, [isOpen, searchParams, useApi, refreshFromApi]);

  const handleManageAll = () => {
    dispatch(closeIntegrationsPanel());
    const tab = 'integrations';
    const connected = searchParams.get('connected');
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (connected) params.set('connected', connected);
    if (activeFormId) {
      params.set('returnTo', `/form-builder/${activeFormId}`);
    }
    navigate(`/dashboard/profile?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeIntegrationsPanel())}
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            aria-label="Close integrations"
          />

          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: panelEase }}
            className="fixed right-[52px] top-[62px] z-40 flex w-[380px] flex-col overflow-hidden rounded-[16px] border border-[#e2ded8] bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.1),0px_1px_4px_0px_rgba(0,0,0,0.06)]"
            role="dialog"
            aria-label="Integrations"
          >
            <div className="border-b border-[#eceae5] px-[18px] pb-3 pt-4">
              <h2 className="text-[14px] font-semibold leading-[18px] text-[#1a1a1a]">
                Integrations
              </h2>
              <p className="mt-0.5 text-[12px] leading-[17px] text-[#9e9e9a]">
                {activeFormId ? 'Connections for this form' : 'Apps linked to your account'}
              </p>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              <IntegrationAppRow
                compact
                icon={
                  <HooksIcon className="inline-flex size-4 shrink-0 items-center justify-center" />
                }
                iconClassName="border-[#fdba74] bg-[#fff7ed]"
                title="Webhook"
                description="Push responses to an endpoint"
                connected={integrations.webhook?.connected}
                onConnect={handleManageAll}
                onConfigure={handleManageAll}
                onDisconnect={handleManageAll}
              />
              <IntegrationAppRow
                compact
                icon={<AssetIcon src={sheetsIcon} className="size-[22px]" />}
                iconClassName="border-[#bbf7d0] bg-[#f7f7f6]"
                title="Google Sheets"
                description="Auto-sync responses to a spreadsheet"
                connected={integrations.googleSheets?.connected}
                onConnect={handleManageAll}
                onConfigure={handleManageAll}
                onDisconnect={handleManageAll}
              />
            </div>

            <div className="flex items-center justify-center border-t border-[#eceae5] bg-white px-[18px] py-3">
              <button
                type="button"
                onClick={handleManageAll}
                className="text-[12px] font-medium leading-[16px] text-[#3b82b6] transition-opacity hover:opacity-75"
              >
                Manage integrations →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IntegrationsPanel;
