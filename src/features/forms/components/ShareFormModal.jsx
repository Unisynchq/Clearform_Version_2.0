import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiShareLine,
  RiCloseLine,
  RiFileCopyLine,
  RiMailLine,
  RiSlackLine,
  RiTableLine,
  RiCodeLine,
  RiSendPlaneLine,
  RiUserLine,
  RiCalendarLine,
  RiLockLine,
  RiPlugLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri';
import { closeShareModal } from '@/store/slices/uiSlice';
import { buildFallbackPublicUrl, fetchShareLinks } from '@/api/services/shareService';
import { isApiConfigured } from '@/config/env';
import {
  buildWebhookTriggers,
  createFormWebhook,
  listFormWebhooks,
  testFormWebhook,
  updateFormWebhook,
} from '@/api/services/webhooksService';
import { useToast } from '@/hooks/useToast';
import { getFreshAuthToken } from '@/features/auth/utils/authTokenRefresh';
import { readLastWorkspaceId } from '@/features/auth/utils/authClientContext';
import { loadWorkspacesFromApi } from '@/store/slices/formsSlice';
import {
  connectIntegration,
  loadIntegrationUiState,
  saveIntegrationMetadata,
  redirectToOAuth,
  syncHistoricalToSheets,
  testSheetConnection,
} from '@/api/services/integrationsService';
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';

/* ────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const todayPlus30 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

const detectTimezone = () => {
  try {
    const tz     = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = -new Date().getTimezoneOffset();
    const sign   = offset >= 0 ? '+' : '-';
    const abs    = Math.abs(offset);
    const h      = String(Math.floor(abs / 60)).padStart(2, '0');
    const m      = String(abs % 60).padStart(2, '0');
    return `UTC${sign}${h}:${m} — ${tz.replace(/_/g, ' ')}`;
  } catch {
    return 'UTC+00:00 — UTC';
  }
};

const TZ_LABEL = detectTimezone();

/* Password strength: 4 criteria → 4 segments */
const getStrength = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))           score++;
  if (/[0-9]/.test(pw))           score++;
  if (/[^a-zA-Z0-9]/.test(pw))    score++;
  const levels = {
    1: { bars: 1, label: 'Weak',       color: '#ef4444' },
    2: { bars: 2, label: 'Fair',       color: '#f97316' },
    3: { bars: 3, label: 'Strong',     color: '#16a34a' },
    4: { bars: 4, label: 'Very strong',color: '#16a34a' },
  };
  return levels[score] ?? levels[1];
};

/* ────────────────────────────────────────
   Shared sub-components
───────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-[34px] h-[18px] rounded-[20px] transition-colors duration-200 cursor-pointer shrink-0 appearance-none border-0 p-0 ${
      checked ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'
    }`}
  >
    <div
      className={`absolute top-[3px] w-[12px] h-[12px] bg-white rounded-[6px] transition-all duration-200 ${
        checked ? 'left-[19px]' : 'left-[3px]'
      }`}
    />
  </button>
);

function buildEmbedCode(url) {
  return `<iframe\n  src="${url}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  allow="fullscreen"\n></iframe>`;
}

function buildShareMessage(formTitle, url) {
  return `Fill out "${formTitle}" on Clearform:\n${url}`;
}

const ShareChannel = ({ label, bg, Icon, iconColor, active, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-center gap-[5px] cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed ${
      active ? 'opacity-100' : ''
    }`}
  >
    <div
      className={`w-[60px] h-[60px] rounded-[8px] flex items-center justify-center transition-opacity ${
        active ? 'ring-2 ring-[#1a1917] ring-offset-1' : 'group-hover:opacity-75'
      }`}
      style={{ backgroundColor: bg }}
    >
      <Icon size={24} color={iconColor} />
    </div>
    <span className="text-[11px] font-medium text-[#4e4e4e]">{label}</span>
  </button>
);

const AccessRow = ({ Icon, title, subtitle, subtitleColor, control, noBorder }) => (
  <div className={`flex items-center gap-2.5 py-[11px] ${noBorder ? '' : 'border-b border-[#f0ede8]'}`}>
    <div className="w-7 h-7 rounded-[8px] bg-[#f7f5f0] border border-[#edeae4] flex items-center justify-center shrink-0">
      <Icon size={14} color="#888780" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-medium text-[#2c2a27] leading-[18px]">{title}</p>
      <p className={`text-[12px] font-normal leading-[16px] ${subtitleColor ?? 'text-[#b4b2a9]'}`}>
        {subtitle}
      </p>
    </div>
    {control}
  </div>
);

/* Tiny field label */
const PanelLabel = ({ children }) => (
  <p className="text-[11px] font-semibold text-[#6b7280] tracking-[0.11px] leading-[normal]">
    {children}
  </p>
);

/* White input shell with optional right element */
const PanelInput = ({ children }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-[8px] px-3 py-[9px] flex items-center w-full gap-2">
    {children}
  </div>
);

/* Panel Save / Cancel row — reused by both panels */
const PanelActions = ({ onSave, onCancel }) => (
  <div className="flex gap-[7px] pt-[3px]">
    <button
      onClick={onSave}
      className="flex-1 bg-[#0d0f12] text-white text-[12px] font-semibold py-[9px] rounded-[8px] hover:bg-[#262829] transition-colors cursor-pointer"
    >
      Save
    </button>
    <button
      onClick={onCancel}
      className="bg-white border border-[#e5e7eb] text-[#6b7280] text-[12px] font-medium px-[15px] py-[9px] rounded-[8px] hover:bg-[#f9fafb] transition-colors cursor-pointer shrink-0"
    >
      Cancel
    </button>
  </div>
);

/* Animated expand wrapper — shared by both panels */
const ExpandPanel = ({ show, children }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const SHARE_CHANNELS = [
  { id: 'email',  label: 'Email',  bg: '#eaf2fc', Icon: RiMailLine,      iconColor: '#3b7de8' },
  { id: 'slack',  label: 'Slack',  bg: '#eaf5ee', Icon: RiSlackLine,     iconColor: '#2ea44f' },
  { id: 'sheets', label: 'Sheets', bg: '#fef6e4', Icon: RiTableLine,     iconColor: '#c8960c' },
  { id: 'embed',  label: 'Embed',  bg: '#f7f5f0', Icon: RiCodeLine,      iconColor: '#888780' },
  { id: 'other',  label: 'Other',  bg: '#f7f5f0', Icon: RiSendPlaneLine, iconColor: '#888780' },
];

/* ────────────────────────────────────────
   Main modal
───────────────────────────────────────── */
const ShareFormModal = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const { open, formTitle, formId, initialChannel, openWebhook } = useSelector(
    (s) => s.ui.shareModal,
  );
  const forms = useSelector((s) => s.forms.forms ?? []);
  const workspaces = useSelector((s) => s.forms.workspaces ?? []);
  const activeForm = forms.find((f) => String(f.id) === String(formId));
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState(null);

  const workspaceId =
    activeForm?.workspace ||
    resolvedWorkspaceId ||
    workspaces.find((w) => w.id === readLastWorkspaceId())?.id ||
    workspaces[0]?.id ||
    null;

  const [shareLinks, setShareLinks] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [integrations, setIntegrations] = useState({
    googleSheets: { connected: false },
    slack: { connected: false },
  });
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('Sheet1!A1');
  const [slackChannel, setSlackChannel] = useState('');
  const [connectingKey, setConnectingKey] = useState(null);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [testingSheet, setTestingSheet] = useState(false);
  const [sheetsSaved, setSheetsSaved] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseLimit, setResponseLimit] = useState(true);
  const [limitValue, setLimitValue] = useState('500');
  const [autoClose, setAutoClose] = useState(false);
  const [pendingDate, setPendingDate] = useState(todayPlus30);
  const [pendingTime, setPendingTime] = useState('23:59');
  const [savedDate, setSavedDate] = useState('');
  const [savedTime, setSavedTime] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [hintValue, setHintValue] = useState('');
  const [savedPw, setSavedPw] = useState('');
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [savedWebhookUrl, setSavedWebhookUrl] = useState('');
  const [triggerCreated, setTriggerCreated] = useState(true);
  const [triggerClosed, setTriggerClosed] = useState(true);
  const [triggerUpdated, setTriggerUpdated] = useState(false);
  const [webhookId, setWebhookId] = useState(null);
  const [webhookTesting, setWebhookTesting] = useState(false);

  const fullUrl =
    shareLinks?.publicUrl ??
    (formId ? buildFallbackPublicUrl(formId) : '');
  const formUrl =
    shareLinks?.shortDisplay ??
    (formId && typeof window !== 'undefined'
      ? `${window.location.host}/f/${formId}`
      : '');

  useEffect(() => {
    if (!open || !formId) {
      setShareLinks(null);
      return;
    }
    let cancelled = false;
    fetchShareLinks(formId)
      .then((data) => {
        if (!cancelled) setShareLinks(data);
      })
      .catch(() => {
        if (!cancelled) {
          setShareLinks({
            publicUrl: buildFallbackPublicUrl(formId),
            shortDisplay: `${window.location.host}/f/${formId}`,
            slug: 'form',
            status: 'draft',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, formId]);

  useEffect(() => {
    if (!open || !isApiConfigured() || workspaces.length > 0) return;
    dispatch(loadWorkspacesFromApi());
  }, [open, dispatch, workspaces.length]);

  const refreshIntegrations = useCallback(async () => {
    if (!isApiConfigured() || !formId) return;
    try {
      const mapped = await loadIntegrationUiState({ workspaceId, formId });
      setIntegrations(mapped);
      setSpreadsheetId(mapped.googleSheets?.metadata?.spreadsheetId ?? '');
      setSheetRange(mapped.googleSheets?.metadata?.sheetRange ?? 'Sheet1!A1');
      setSlackChannel(
        mapped.slack?.metadata?.slackChannel ??
          mapped.slack?.metadata?.channel ??
          '',
      );
    } catch {
      /* keep prior */
    }
  }, [formId, workspaceId]);

  useEffect(() => {
    if (!open) {
      setActiveChannel(null);
      setWebhookOpen(false);
      setSheetsSaved(false);
      setResolvedWorkspaceId(null);
      return;
    }
    if (initialChannel) {
      setActiveChannel(initialChannel);
    }
    if (openWebhook) {
      setActiveChannel('other');
      setWebhookOpen(true);
    }
    refreshIntegrations();
  }, [open, refreshIntegrations, initialChannel, openWebhook]);

  useEffect(() => {
    if (!open || !isApiConfigured()) return;
    const connected = searchParams.get('connected');
    if (!connected) return;
    refreshIntegrations();
    showToast({
      type: 'success',
      message: `${connected.replace(/_/g, ' ')} connected successfully.`,
      duration: 2800,
    });
  }, [open, searchParams, refreshIntegrations, showToast]);

  useEffect(() => {
    if (!open || !formId || !isApiConfigured() || activeForm?.workspace) return;
    let cancelled = false;
    apiClient(API_ENDPOINTS.forms.byId(formId))
      .then((form) => {
        if (!cancelled && form?.workspace) {
          setResolvedWorkspaceId(String(form.workspace));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, formId, activeForm?.workspace]);

  const ensureToken = async () => {
    const token = await getFreshAuthToken();
    if (!token) {
      showToast({
        type: 'error',
        message: 'Session expired — sign in again.',
        duration: 3200,
      });
      return false;
    }
    return true;
  };

  const handleConnectProvider = async (feKey) => {
    if (!isApiConfigured()) {
      showToast({
        type: 'error',
        message: 'Connect your API to link integrations.',
        duration: 3200,
      });
      return;
    }
    if (!workspaceId) {
      showToast({
        type: 'error',
        message: 'Workspace required. Reload dashboard and try again.',
        duration: 3200,
      });
      return;
    }
    if (!(await ensureToken())) return;
    setConnectingKey(feKey);
    try {
      const { redirectUrl } = await connectIntegration(workspaceId, feKey);
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
  };

  const handleSaveSheetsConfig = async () => {
    const connectionId = integrations.googleSheets?.connectionId;
    const id = spreadsheetId.trim();
    if (!id) {
      showToast({
        type: 'error',
        message: 'Paste your Google Spreadsheet ID first.',
        duration: 2800,
      });
      return;
    }
    if (!connectionId) {
      showToast({
        type: 'error',
        message: 'Connect Google Sheets first (button above), then save.',
        duration: 3200,
      });
      return;
    }
    if (!workspaceId && !formId) {
      showToast({
        type: 'error',
        message: 'Workspace not found — reload the dashboard and try again.',
        duration: 3200,
      });
      return;
    }
    if (!(await ensureToken())) return;
    setSavingIntegration(true);
    setSheetsSaved(false);
    try {
      await saveIntegrationMetadata(workspaceId, formId, connectionId, {
        spreadsheetId: id,
        sheetRange: sheetRange.trim() || 'Sheet1!A1',
      });
      await refreshIntegrations();
      setSheetsSaved(true);
      showToast({
        type: 'success',
        message: 'Saved. New responses will sync to this sheet. Use “Sync existing” for past responses.',
        duration: 4200,
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Could not save Sheets settings.',
        duration: 3000,
      });
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleSaveSlackConfig = async () => {
    const connectionId = integrations.slack?.connectionId;
    if (!connectionId) {
      showToast({
        type: 'error',
        message: 'Connect Slack first, then save your channel.',
        duration: 2800,
      });
      return;
    }
    if (!workspaceId && !formId) {
      showToast({
        type: 'error',
        message: 'Workspace not found — reload the dashboard and try again.',
        duration: 3200,
      });
      return;
    }
    if (!(await ensureToken())) return;
    setSavingIntegration(true);
    try {
      await saveIntegrationMetadata(workspaceId, formId, connectionId, {
        slackChannel: slackChannel.trim() || '#general',
      });
      await refreshIntegrations();
      showToast({ type: 'success', message: 'Slack channel saved.', duration: 2400 });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Could not save Slack settings.',
        duration: 3000,
      });
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleSyncHistorical = async () => {
    const connectionId = integrations.googleSheets?.connectionId;
    if (!workspaceId || !connectionId || !formId) return;
    if (!(await ensureToken())) return;
    setSyncingSheets(true);
    try {
      const result = await syncHistoricalToSheets(workspaceId, connectionId, formId);
      showToast({
        type: 'success',
        message: `Synced ${result.synced} response(s) to Sheets.`,
        duration: 3200,
      });
      await refreshIntegrations();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Could not sync responses to Sheets.',
        duration: 3200,
      });
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleTestSheet = async () => {
    const connectionId = integrations.googleSheets?.connectionId;
    if (!workspaceId || !connectionId) return;
    if (!(await ensureToken())) return;
    setTestingSheet(true);
    try {
      await testSheetConnection(workspaceId, connectionId, formId);
      showToast({
        type: 'success',
        message: 'Test row written to your spreadsheet.',
        duration: 3200,
      });
      await refreshIntegrations();
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Sheet test failed — check spreadsheet ID and OAuth.',
        duration: 3600,
      });
    } finally {
      setTestingSheet(false);
    }
  };

  const sheetsHealth = integrations.googleSheets?.health;
  const sheetsSyncError =
    sheetsHealth?.lastSyncError ??
    integrations.googleSheets?.metadata?.lastSyncError ??
    null;
  const sheetsLastSyncAt =
    sheetsHealth?.lastSyncAt ??
    integrations.googleSheets?.metadata?.lastSyncAt ??
    null;

  const handleChannelClick = (channelId) => {
    if ((channelId === 'slack' || channelId === 'sheets') && !isApiConfigured()) {
      showToast({
        type: 'error',
        message: 'Connect your API to configure Slack or Google Sheets.',
        duration: 3200,
      });
      return;
    }
    setActiveChannel((prev) => (prev === channelId ? null : channelId));
    if (channelId === 'email' && fullUrl) {
      const body = encodeURIComponent(buildShareMessage(formTitle, fullUrl));
      window.location.href = `mailto:?subject=${encodeURIComponent(`Form: ${formTitle}`)}&body=${body}`;
    }
    if (channelId === 'other' && fullUrl) {
      navigator.clipboard?.writeText(buildShareMessage(formTitle, fullUrl));
      showToast({ type: 'success', message: 'Share message copied.', duration: 2200 });
    }
  };

  useEffect(() => {
    if (!open || !formId || !isApiConfigured()) return;
    let cancelled = false;
    listFormWebhooks(formId)
      .then((rows) => {
        if (cancelled) return;
        const hook = rows[0];
        if (!hook) return;
        setWebhookId(hook.id);
        setSavedWebhookUrl(hook.url ?? '');
        setPendingUrl(hook.url ?? '');
        const triggers = hook.triggers ?? [];
        setTriggerCreated(triggers.length === 0 || triggers.includes('response.created'));
        setTriggerClosed(triggers.includes('form.closed'));
        setTriggerUpdated(triggers.includes('response.updated'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, formId]);

  /* ── Handlers: copy ── */
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => dispatch(closeShareModal());

  /* ── Handlers: auto-close ── */
  const handleAutoCloseToggle = (val) => {
    setAutoClose(val);
    if (!val) { setSavedDate(''); setSavedTime(''); }
  };
  const handleSaveDate = () => {
    setSavedDate(pendingDate);
    setSavedTime(pendingTime);
    setAutoClose(false);
  };
  const handleCancelDate = () => {
    setPendingDate(savedDate || todayPlus30());
    setPendingTime(savedTime || '23:59');
    setAutoClose(false);
  };
  const autoCloseSubtitle = savedDate
    ? `Closes ${new Date(savedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${savedTime}`
    : 'Close form on a specific date';

  /* ── Handlers: password ── */
  const handlePwToggle = (val) => {
    setPwOpen(val);
    if (!val) { setSavedPw(''); setPwValue(''); setHintValue(''); }
  };
  const handleSavePw = () => {
    setSavedPw(pwValue);
    setPwOpen(false);
  };
  const handleCancelPw = () => {
    setPwValue(savedPw);
    setPwOpen(false);
    if (!savedPw) setSavedPw('');
  };
  const pwSubtitle = savedPw
    ? 'Protected · ' + '•'.repeat(Math.min(savedPw.length, 10))
    : 'Require a password to view';

  const strength = getStrength(pwValue);

  /* ── Handlers: webhook ── */
  const handleOpenWebhook = () => {
    setPendingUrl(savedWebhookUrl);
    setWebhookOpen(true);
  };
  const handleSaveWebhook = async () => {
    const url = pendingUrl.trim();
    if (!url) {
      showToast({ type: 'error', message: 'Enter a webhook URL.', duration: 2400 });
      return null;
    }
    const body = {
      url,
      triggers: buildWebhookTriggers({
        created: triggerCreated,
        closed: triggerClosed,
        updated: triggerUpdated,
      }),
      active: true,
    };
    try {
      let savedId = webhookId;
      if (isApiConfigured() && formId) {
        const saved = webhookId
          ? await updateFormWebhook(formId, webhookId, body)
          : await createFormWebhook(formId, body);
        savedId = saved?.id ?? webhookId;
        setWebhookId(savedId);
      }
      setSavedWebhookUrl(url);
      setWebhookOpen(false);
      showToast({ type: 'success', message: 'Webhook saved.', duration: 2200 });
      return savedId;
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Could not save webhook.',
        duration: 3000,
      });
      return null;
    }
  };

  const handleTestWebhook = async () => {
    if (!savedWebhookUrl && !pendingUrl.trim()) {
      showToast({ type: 'info', message: 'Save a webhook URL first.', duration: 2200 });
      return;
    }
    if (!isApiConfigured() || !formId) {
      showToast({ type: 'info', message: 'Webhook test requires API configuration.', duration: 2400 });
      return;
    }
    let id = webhookId;
    if (!id) {
      id = await handleSaveWebhook();
      if (!id) return;
    }
    setWebhookTesting(true);
    try {
      const result = await testFormWebhook(formId, id);
      showToast({
        type: result?.success === false ? 'error' : 'success',
        message: result?.message || 'Test payload sent.',
        duration: 2800,
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err?.message || 'Webhook test failed.',
        duration: 3000,
      });
    } finally {
      setWebhookTesting(false);
    }
  };
  const handleCancelWebhook = () => {
    setPendingUrl(savedWebhookUrl);
    setWebhookOpen(false);
  };
  const webhookSubtitle = savedWebhookUrl
    ? savedWebhookUrl
    : 'Push responses to an endpoint';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[16px] border border-[#e0ddd7] w-[440px] max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-6 pt-6 pb-[18px]">
              <div className="w-9 h-9 rounded-[10px] bg-[#eaf5ee] flex items-center justify-center shrink-0">
                <RiShareLine size={16} color="#2ea44f" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-[#1a1917] leading-[21.6px]">
                  Share &ldquo;{formTitle}&rdquo;
                </p>
                <p className="text-[14px] font-normal text-[#888780] leading-[21px] mt-0.5">
                  Anyone with the link can fill out the form.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-[26px] h-[26px] rounded-[8px] bg-[#f7f5f0] border border-[#edeae4] flex items-center justify-center hover:bg-[#eeede8] transition-colors cursor-pointer shrink-0 mt-px"
              >
                <RiCloseLine size={10} color="#888780" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-5 flex flex-col gap-4">

              {/* Copy link */}
              <div className="flex items-center gap-2 bg-[#f7f5f0] border border-[#e0ddd7] rounded-[10px] pl-[13px] pr-[5px] py-[5px]">
                <span className="flex-1 text-[12px] font-mono text-[#888780] truncate">{formUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 bg-[#1a1917] text-white text-[12px] font-medium px-3 py-[7px] rounded-[10px] hover:bg-[#2c2a27] transition-colors cursor-pointer shrink-0"
                >
                  <RiFileCopyLine size={14} />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              {/* Share via */}
              <div className="flex flex-col gap-4">
                <p className="text-[10px] font-semibold text-[#c4c0b8] tracking-[0.9px] uppercase leading-[normal]">Share via</p>
                <div className="flex items-start justify-between">
                  {SHARE_CHANNELS.map((ch) => (
                    <ShareChannel
                      key={ch.id}
                      {...ch}
                      active={activeChannel === ch.id}
                      disabled={connectingKey != null}
                      onClick={() => handleChannelClick(ch.id)}
                    />
                  ))}
                </div>

                <ExpandPanel show={Boolean(activeChannel)}>
                  <div className="rounded-[10px] border border-[#e5e4e0] bg-[#fafaf8] p-4 flex flex-col gap-3">
                    {activeChannel === 'sheets' && (
                      <>
                        <p className="text-[12px] text-[#6b6965]">
                          Connect Google Sheets, paste your spreadsheet ID, then new responses sync automatically.
                        </p>
                        {integrations.googleSheets?.connected ? (
                          <p className="text-[12px] font-medium text-[#16a34a]">Google Sheets connected</p>
                        ) : null}
                        {!integrations.googleSheets?.connectionId ? (
                          <button
                            type="button"
                            disabled={connectingKey === 'googleSheets'}
                            onClick={() => handleConnectProvider('googleSheets')}
                            className="h-9 px-4 rounded-[8px] bg-[#1a1917] text-white text-[12px] font-medium"
                          >
                            Connect Google Sheets
                          </button>
                        ) : (
                          <>
                            <PanelLabel>Spreadsheet ID</PanelLabel>
                            <PanelInput>
                              <input
                                value={spreadsheetId}
                                onChange={(e) => {
                                  setSpreadsheetId(e.target.value);
                                  setSheetsSaved(false);
                                }}
                                placeholder="From Google Sheets URL"
                                className="flex-1 text-[13px] outline-none bg-transparent"
                              />
                            </PanelInput>
                            <PanelLabel>Range (optional)</PanelLabel>
                            <PanelInput>
                              <input
                                value={sheetRange}
                                onChange={(e) => setSheetRange(e.target.value)}
                                placeholder="Sheet1!A1"
                                className="flex-1 text-[13px] outline-none bg-transparent"
                              />
                            </PanelInput>
                            {sheetsSaved && !sheetsSyncError && (
                              <p className="text-[12px] text-[#4caf7d] font-medium">
                                Spreadsheet linked — new responses will sync automatically.
                              </p>
                            )}
                            {sheetsSyncError ? (
                              <p className="text-[12px] text-[#dc2626] font-medium">
                                Sync error: {sheetsSyncError}
                              </p>
                            ) : null}
                            {sheetsLastSyncAt && !sheetsSyncError ? (
                              <p className="text-[11px] text-[#6b6965]">
                                Last synced {new Date(sheetsLastSyncAt).toLocaleString()}
                              </p>
                            ) : null}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={savingIntegration}
                                onClick={handleSaveSheetsConfig}
                                className="flex-1 min-w-[80px] h-9 rounded-[8px] bg-[#1a1917] text-white text-[12px] font-medium disabled:opacity-60"
                              >
                                {savingIntegration ? 'Saving…' : sheetsSaved ? 'Saved' : 'Save'}
                              </button>
                              <button
                                type="button"
                                disabled={testingSheet || !spreadsheetId.trim()}
                                onClick={handleTestSheet}
                                className="flex-1 min-w-[80px] h-9 rounded-[8px] border border-[#e0ddd7] bg-white text-[12px] font-medium disabled:opacity-60"
                              >
                                {testingSheet ? 'Testing…' : 'Test sheet'}
                              </button>
                              <button
                                type="button"
                                disabled={syncingSheets || !spreadsheetId.trim()}
                                onClick={handleSyncHistorical}
                                className="flex-1 min-w-[80px] h-9 rounded-[8px] border border-[#e0ddd7] bg-white text-[12px] font-medium disabled:opacity-60"
                              >
                                {syncingSheets ? 'Syncing…' : 'Sync existing'}
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {activeChannel === 'slack' && (
                      <>
                        <p className="text-[12px] text-[#6b6965]">
                          New responses post to your Slack channel when the form is submitted.
                        </p>
                        {integrations.slack?.connected ? (
                          <p className="text-[12px] font-medium text-[#16a34a]">Slack connected</p>
                        ) : null}
                        {!integrations.slack?.connectionId ? (
                          <button
                            type="button"
                            disabled={connectingKey === 'slack'}
                            onClick={() => handleConnectProvider('slack')}
                            className="h-9 px-4 rounded-[8px] bg-[#1a1917] text-white text-[12px] font-medium"
                          >
                            Connect Slack
                          </button>
                        ) : (
                          <>
                            <PanelLabel>Channel</PanelLabel>
                            <PanelInput>
                              <input
                                value={slackChannel}
                                onChange={(e) => setSlackChannel(e.target.value)}
                                placeholder="#general"
                                className="flex-1 text-[13px] outline-none bg-transparent"
                              />
                            </PanelInput>
                            <button
                              type="button"
                              disabled={savingIntegration}
                              onClick={handleSaveSlackConfig}
                              className="h-9 px-4 rounded-[8px] bg-[#1a1917] text-white text-[12px] font-medium"
                            >
                              Save channel
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {activeChannel === 'embed' && fullUrl && (
                      <>
                        <p className="text-[12px] text-[#6b6965]">Embed this form on your site.</p>
                        <pre className="text-[11px] bg-white border border-[#e5e4e0] rounded-[8px] p-3 overflow-x-auto whitespace-pre-wrap">
                          {buildEmbedCode(fullUrl)}
                        </pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(buildEmbedCode(fullUrl));
                            setEmbedCopied(true);
                            setTimeout(() => setEmbedCopied(false), 2000);
                          }}
                          className="h-9 px-4 rounded-[8px] bg-[#1a1917] text-white text-[12px] font-medium self-start"
                        >
                          {embedCopied ? 'Copied!' : 'Copy embed code'}
                        </button>
                      </>
                    )}

                    {activeChannel === 'email' && (
                      <p className="text-[12px] text-[#6b6965]">
                        Your email app should open with the form link. If not, use Copy link above.
                      </p>
                    )}

                    {activeChannel === 'other' && (
                      <p className="text-[12px] text-[#6b6965]">
                        Share message copied — paste into any app.
                      </p>
                    )}
                  </div>
                </ExpandPanel>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#f0ede8]" />

              {/* Access & limits */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-semibold text-[#c4c0b8] tracking-[0.9px] uppercase leading-[normal]">
                  Access &amp; limits
                </p>

                <div className="flex flex-col">

                  {/* Response limit */}
                  <AccessRow
                    Icon={RiUserLine}
                    title="Response limit"
                    subtitle="Stop collecting after N responses"
                    control={
                      <div className="flex items-center gap-2 shrink-0">
                        {responseLimit && (
                          <input
                            type="number"
                            value={limitValue}
                            onChange={(e) => setLimitValue(e.target.value)}
                            className="w-[52px] h-[28px] text-center text-[14px] font-medium text-[#2c2a27] bg-[#f7f5f0] border border-[#e0ddd7] rounded-[8px] outline-none"
                          />
                        )}
                        <Toggle checked={responseLimit} onChange={setResponseLimit} />
                      </div>
                    }
                  />

                  {/* ── Auto-close date ── */}
                  <div className={`${autoClose ? '' : 'border-b border-[#f0ede8]'}`}>
                    <div className="flex items-center gap-2.5 py-[11px]">
                      <div className="w-7 h-7 rounded-[8px] bg-[#f7f5f0] border border-[#edeae4] flex items-center justify-center shrink-0">
                        <RiCalendarLine size={14} color="#888780" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#2c2a27] leading-[18px]">Auto-close date</p>
                        <p className={`text-[12px] font-normal leading-[16px] ${savedDate ? 'text-[#4caf7d]' : 'text-[#b4b2a9]'}`}>
                          {autoCloseSubtitle}
                        </p>
                      </div>
                      <Toggle checked={autoClose} onChange={handleAutoCloseToggle} />
                    </div>

                    <ExpandPanel show={autoClose}>
                      <div className="bg-[#f7f5f0] border-t border-[#f0ede8] rounded-b-[10px] px-4 pt-[15px] pb-4 flex flex-col gap-2 mb-[11px]">
                        <div className="flex gap-2">
                          <div className="flex-1 flex flex-col gap-[5px]">
                            <PanelLabel>Close date</PanelLabel>
                            <PanelInput>
                              <input
                                type="date"
                                value={pendingDate}
                                onChange={(e) => setPendingDate(e.target.value)}
                                className="w-full text-[13px] text-[#0d0f12] bg-transparent outline-none cursor-pointer"
                              />
                            </PanelInput>
                          </div>
                          <div className="flex-1 flex flex-col gap-[5px]">
                            <PanelLabel>Time</PanelLabel>
                            <PanelInput>
                              <input
                                type="time"
                                value={pendingTime}
                                onChange={(e) => setPendingTime(e.target.value)}
                                className="w-full text-[13px] text-[#0d0f12] bg-transparent outline-none cursor-pointer"
                              />
                            </PanelInput>
                          </div>
                        </div>
                        <div className="flex flex-col gap-[5px]">
                          <PanelLabel>Timezone</PanelLabel>
                          <PanelInput>
                            <span className="text-[13px] text-[#0d0f12] leading-[17px]">{TZ_LABEL}</span>
                          </PanelInput>
                        </div>
                        <PanelActions onSave={handleSaveDate} onCancel={handleCancelDate} />
                      </div>
                    </ExpandPanel>
                  </div>

                  {/* ── Password protect ── */}
                  <div className={`${pwOpen ? '' : 'border-b border-[#f0ede8]'}`}>
                    <div className="flex items-center gap-2.5 py-[11px]">
                      <div className="w-7 h-7 rounded-[8px] bg-[#f7f5f0] border border-[#edeae4] flex items-center justify-center shrink-0">
                        <RiLockLine size={14} color="#888780" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#2c2a27] leading-[18px]">Password protect</p>
                        <p className={`text-[12px] font-normal leading-[16px] ${savedPw ? 'text-[#4caf7d]' : 'text-[#b4b2a9]'}`}>
                          {pwSubtitle}
                        </p>
                      </div>
                      <Toggle checked={pwOpen || !!savedPw} onChange={handlePwToggle} />
                    </div>

                    <ExpandPanel show={pwOpen}>
                      <div className="bg-[#f7f5f0] border-t border-[#f0ede8] rounded-b-[10px] px-4 pt-[15px] pb-4 flex flex-col gap-[11px] mb-[11px]">

                        {/* Yellow warning banner */}
                        <div className="bg-[#fffbeb] border border-[#fde68a] rounded-[8px] px-3 py-[10px]">
                          <p className="text-[11px] text-[#92400e] leading-[15.95px]">
                            Share the password separately — don&apos;t include it in the same message as the link.
                          </p>
                        </div>

                        {/* Password field */}
                        <div className="flex flex-col gap-[3px] pt-px">
                          <PanelLabel>Password</PanelLabel>
                          <div className="bg-white border border-[#e5e7eb] rounded-[8px] px-3 pt-[11px] pb-[9px] flex items-center gap-2">
                            <input
                              type={pwVisible ? 'text' : 'password'}
                              value={pwValue}
                              onChange={(e) => setPwValue(e.target.value)}
                              placeholder="Enter a password"
                              className="flex-1 text-[13px] text-[#0d0f12] bg-transparent outline-none placeholder:text-[#9ca3af]"
                            />
                            <button
                              type="button"
                              onClick={() => setPwVisible((v) => !v)}
                              className="shrink-0 text-[#9ca3af] hover:text-[#6b7280] transition-colors cursor-pointer"
                            >
                              {pwVisible
                                ? <RiEyeOffLine size={14} />
                                : <RiEyeLine    size={14} />}
                            </button>
                          </div>

                          {/* Strength meter */}
                          {pwValue && strength && (
                            <>
                              <div className="flex gap-1 pt-[3px]">
                                {[1, 2, 3, 4].map((seg) => (
                                  <div
                                    key={seg}
                                    className="flex-1 h-[3px] rounded-[2px] transition-colors duration-300"
                                    style={{
                                      backgroundColor: seg <= strength.bars ? strength.color : '#e5e7eb',
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-end">
                                <span
                                  className="text-[10px] font-normal leading-[normal]"
                                  style={{ color: strength.color }}
                                >
                                  {strength.label}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Hint for respondents */}
                        <div className="flex flex-col gap-[5px]">
                          <p className="text-[11px] tracking-[0.11px] leading-[normal]">
                            <span className="font-semibold text-[#6b7280]">Hint for respondents </span>
                            <span className="font-normal text-[#9ca3af]">(optional)</span>
                          </p>
                          <PanelInput>
                            <input
                              type="text"
                              value={hintValue}
                              onChange={(e) => setHintValue(e.target.value)}
                              placeholder={`e.g. "Check your email from HR"`}
                              className="flex-1 text-[13px] text-[#0d0f12] bg-transparent outline-none placeholder:text-[#757575]"
                            />
                          </PanelInput>
                          <p className="text-[11px] font-normal text-[#9ca3af] leading-[15.4px]">
                            💡 Shown on the password screen — don&apos;t reveal the password
                          </p>
                        </div>

                        <PanelActions onSave={handleSavePw} onCancel={handleCancelPw} />
                      </div>
                    </ExpandPanel>
                  </div>

                  {/* ── Webhook ── */}
                  <div>
                    <div className="flex items-center gap-2.5 py-[11px]">
                      <div className="w-7 h-7 rounded-[8px] bg-[#f7f5f0] border border-[#edeae4] flex items-center justify-center shrink-0">
                        <RiPlugLine size={14} color="#888780" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#2c2a27] leading-[18px]">Webhook</p>
                        <p className={`text-[12px] font-normal leading-[16px] truncate ${savedWebhookUrl ? 'text-[#4caf7d]' : 'text-[#b4b2a9]'}`}>
                          {webhookSubtitle}
                        </p>
                      </div>
                      {!webhookOpen && (
                        <button
                          onClick={handleOpenWebhook}
                          className="text-[12px] font-medium text-[#888780] border border-[#96938d] rounded-[10px] px-[13px] py-[8px] hover:bg-[#f7f5f0] transition-colors cursor-pointer shrink-0 leading-[12px]"
                        >
                          {savedWebhookUrl ? 'Edit' : 'Configure'}
                        </button>
                      )}
                    </div>

                    {/* Expandable webhook config panel */}
                    <ExpandPanel show={webhookOpen}>
                      <div className="bg-[#f7f5f0] border-t border-[#bfdbfe] px-4 pt-[15px] pb-4 flex flex-col gap-[11px]">

                        {/* Endpoint URL */}
                        <div className="flex flex-col gap-[5px]">
                          <PanelLabel>Endpoint URL</PanelLabel>
                          <div className="flex items-center gap-[6px] pb-[3px]">
                            <span className="bg-[#dcfce7] text-[#166534] text-[11px] font-mono px-2 py-[3px] rounded-[5px] leading-[normal]">
                              POST
                            </span>
                          </div>
                          <PanelInput>
                            <input
                              type="url"
                              value={pendingUrl}
                              onChange={(e) => setPendingUrl(e.target.value)}
                              placeholder="https://hooks.myapp.com/clearform"
                              className="flex-1 text-[11px] font-mono text-[#0d0f12] bg-transparent outline-none placeholder:text-[#9ca3af]"
                            />
                          </PanelInput>
                        </div>

                        {/* Trigger on */}
                        <div className="flex flex-col gap-[6px]">
                          <PanelLabel>Trigger on</PanelLabel>
                          <div className="flex flex-col gap-[6px]">
                            {/* New response submitted */}
                            <button
                              onClick={() => setTriggerCreated((v) => !v)}
                              className={`flex items-center gap-2 px-[11px] py-[8px] rounded-[7px] w-full border cursor-pointer transition-colors text-left ${
                                triggerCreated
                                  ? 'bg-[#eff6ff] border-[#bfdbfe]'
                                  : 'bg-white border-[#e5e7eb]'
                              }`}
                            >
                              <div className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center transition-colors ${
                                triggerCreated ? 'bg-[#2563eb] border-[#2563eb]' : 'border-[#e5e7eb]'
                              }`}>
                                {triggerCreated && (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[12px] font-medium text-[#0d0f12] leading-[16px]">New response submitted</span>
                              <span className="ml-auto text-[10px] font-normal text-[#9ca3af] font-mono shrink-0">response.created</span>
                            </button>

                            {/* Form closed */}
                            <button
                              onClick={() => setTriggerClosed((v) => !v)}
                              className={`flex items-center gap-2 px-[11px] py-[8px] rounded-[7px] w-full border cursor-pointer transition-colors text-left ${
                                triggerClosed
                                  ? 'bg-[#eff6ff] border-[#bfdbfe]'
                                  : 'bg-white border-[#e5e7eb]'
                              }`}
                            >
                              <div className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center transition-colors ${
                                triggerClosed ? 'bg-[#2563eb] border-[#2563eb]' : 'border-[#e5e7eb]'
                              }`}>
                                {triggerClosed && (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[12px] font-medium text-[#0d0f12] leading-[16px]">Form closed</span>
                              <span className="ml-auto text-[10px] font-normal text-[#9ca3af] font-mono shrink-0">form.closed</span>
                            </button>

                            {/* Response updated */}
                            <button
                              onClick={() => setTriggerUpdated((v) => !v)}
                              className={`flex items-center gap-2 px-[11px] py-[8px] rounded-[7px] w-full border cursor-pointer transition-colors text-left ${
                                triggerUpdated
                                  ? 'bg-[#eff6ff] border-[#bfdbfe]'
                                  : 'bg-white border-[#e5e7eb]'
                              }`}
                            >
                              <div className={`w-[15px] h-[15px] rounded-[4px] border shrink-0 flex items-center justify-center transition-colors ${
                                triggerUpdated ? 'bg-[#2563eb] border-[#2563eb]' : 'border-[#e5e7eb]'
                              }`}>
                                {triggerUpdated && (
                                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[12px] font-medium text-[#0d0f12] leading-[16px]">Response updated</span>
                              <span className="ml-auto text-[10px] font-normal text-[#9ca3af] font-mono shrink-0">response.updated</span>
                            </button>
                          </div>
                        </div>

                        {/* Save / Test / Cancel */}
                        <div className="flex gap-[7px] pt-[3px]">
                          <button
                            type="button"
                            onClick={handleSaveWebhook}
                            className="flex-1 bg-[#0d0f12] text-white text-[12px] font-semibold py-[9px] rounded-[8px] hover:bg-[#262829] transition-colors cursor-pointer"
                          >
                            Save webhook
                          </button>
                          {isApiConfigured() && formId ? (
                            <button
                              type="button"
                              onClick={handleTestWebhook}
                              disabled={webhookTesting}
                              className="bg-white border border-[#e5e7eb] text-[#0d0f12] text-[12px] font-medium px-[12px] py-[9px] rounded-[8px] hover:bg-[#f9fafb] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                            >
                              {webhookTesting ? 'Testing…' : 'Test'}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={handleCancelWebhook}
                            className="bg-white border border-[#e5e7eb] text-[#6b7280] text-[12px] font-medium px-[15px] py-[9px] rounded-[8px] hover:bg-[#f9fafb] transition-colors cursor-pointer shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </ExpandPanel>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom rule */}
            <div className="h-px bg-[#f0ede8] mx-6 mb-1" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareFormModal;
