import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  RiQrCodeLine,
  RiCodeSSlashLine,
  RiFileCopyLine,
  RiMailLine,
  RiShareLine,
  RiCheckLine,
} from 'react-icons/ri';
import Select from '../ui/Select';
import { useToast } from '../../hooks/useToast';
import { DeleteFormModal, PauseFormModal } from './AnalyticsFormActionModals';
import { deleteFormRequest, pauseFormRequest } from './analyticsFormActions';
import { updateForm, deleteForm, setFormPause, loadFormsFromApi } from '@/store/slices/formsSlice';
import { setConfirmModalOpen } from '@/store/slices/uiSlice';
import {
  buildIndefinitePausePayload,
  isFormPaused,
} from '@/features/forms/utils/formPause';
import { DEFAULT_LIFECYCLE_MODE, mergeAlertSettings } from '@/utils/formAlertDefaults';
import { dispatchSyncFormAlerts } from '@/utils/syncFormAlertsToStore';
import { clearNotificationsForForm } from '@/store/slices/notificationsSlice';
import { buildFallbackPublicUrl, fetchShareLinks } from '@/api/services/shareService';

const LIFECYCLE_OPTIONS = [
  { value: 'No limit', label: 'No limit' },
  { value: 'Close on date', label: 'Close on date' },
  { value: 'Close after response count', label: 'Close after response count' },
];

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-[20px] w-[36px] shrink-0 cursor-pointer rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40 ${
        checked ? 'bg-[#4b43b0]' : 'bg-[#e9e7e0]'
      }`}
    >
      <span
        className={`absolute top-[3px] size-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-transform ${
          checked ? 'left-[19px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="mb-3 flex w-full items-center gap-3">
      <h3 className="shrink-0 text-[10px] font-bold uppercase tracking-[0.9px] text-[#646464]">
        {children}
      </h3>
      <div className="h-px min-w-[24px] flex-1 bg-[#e9e7e0]" aria-hidden />
    </div>
  );
}

function SettingRow({ label, description, control }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-[#f0ede6] py-4 first:pt-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-[13.5px] font-medium leading-snug text-[#17160e]">{label}</p>
        <p className="text-[12px] leading-[18px] text-[#646464]">{description}</p>
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

const inputBase =
  'rounded-[8px] border border-[#e9e7e0] bg-white px-[11px] py-[7px] text-[13px] text-[#17160e] outline-none transition-colors focus:border-[#4b43b0] focus:ring-1 focus:ring-[#4b43b0]/20';

const SHARE_ACTIONS = [
  {
    id: 'embed',
    label: 'Embed',
    bg: '#f7f5f0',
    iconColor: '#646464',
    Icon: RiCodeSSlashLine,
    message: 'Embed snippet copied to clipboard.',
  },
  {
    id: 'email',
    label: 'Email',
    bg: '#eaf2fc',
    iconColor: '#3b7de8',
    Icon: RiMailLine,
    message: 'Email draft opened with your form link.',
  },
  {
    id: 'qr',
    label: 'QR code',
    bg: '#f3f0ff',
    iconColor: '#6d5bd0',
    Icon: RiQrCodeLine,
    message: 'QR code download started.',
  },
];

function useDebouncedCallback(fn, delayMs) {
  const fnRef = useRef(fn);
  const timerRef = useRef(null);
  fnRef.current = fn;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs],
  );
}

function AnalyticsSettingsPanel({ form }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState(null);
  const abortRef = useRef(null);

  const formPaused = isFormPaused(form);

  const alertSettings = useMemo(
    () => mergeAlertSettings(form?.alertSettings),
    [form?.alertSettings],
  );

  const [name, setName] = useState(form?.title ?? '');
  const [target, setTarget] = useState(String(form?.responseLimit ?? 500));
  const [lifecycle, setLifecycle] = useState(form?.lifecycleMode ?? DEFAULT_LIFECYCLE_MODE);
  const [partial, setPartial] = useState(form?.capturePartialSubmissions ?? true);

  const [completionPct, setCompletionPct] = useState(
    String(alertSettings.completion.thresholdPct ?? 10),
  );
  const [milestoneVal, setMilestoneVal] = useState(String(alertSettings.milestone.value ?? 500));
  const [sentimentPct, setSentimentPct] = useState(
    String(alertSettings.sentiment.thresholdPct ?? 1),
  );

  useEffect(() => {
    setName(form?.title ?? '');
    setTarget(String(form?.responseLimit ?? 500));
    setLifecycle(form?.lifecycleMode ?? DEFAULT_LIFECYCLE_MODE);
    setPartial(form?.capturePartialSubmissions ?? true);
    const merged = mergeAlertSettings(form?.alertSettings);
    setCompletionPct(String(merged.completion.thresholdPct ?? 10));
    setMilestoneVal(String(merged.milestone.value ?? 500));
    setSentimentPct(String(merged.sentiment.thresholdPct ?? 1));
  }, [form?.id, form?.title, form?.responseLimit, form?.lifecycleMode, form?.capturePartialSubmissions, form?.alertSettings]);

  useEffect(() => {
    if (!form?.id) {
      setShareLinks(null);
      return;
    }
    let cancelled = false;
    fetchShareLinks(form.id)
      .then((data) => {
        if (!cancelled) setShareLinks(data);
      })
      .catch(() => {
        if (!cancelled) {
          setShareLinks({
            publicUrl: buildFallbackPublicUrl(form.id),
            shortDisplay: `${window.location.host}/f/${form.id}`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [form?.id]);

  const fullUrl =
    shareLinks?.publicUrl ??
    (form?.id ? buildFallbackPublicUrl(form.id) : '');
  const formUrl =
    shareLinks?.shortDisplay ??
    (form?.id && typeof window !== 'undefined'
      ? `${window.location.host}/f/${form.id}`
      : '');

  useEffect(() => {
    dispatch(setConfirmModalOpen(pauseModalOpen || deleteModalOpen));
    return () => dispatch(setConfirmModalOpen(false));
  }, [pauseModalOpen, deleteModalOpen, dispatch]);

  useEffect(() => {
    if (form) dispatchSyncFormAlerts(dispatch, form);
  }, [form, dispatch]);

  const persistFormChanges = useDebouncedCallback((changes) => {
    if (!form?.id) return;
    dispatch(updateForm({ id: form.id, changes }));
    const nextForm = { ...form, ...changes };
    dispatchSyncFormAlerts(dispatch, nextForm);
  }, 300);

  const persistAlertSettings = useDebouncedCallback((nextAlertSettings) => {
    if (!form?.id) return;
    dispatch(updateForm({ id: form.id, changes: { alertSettings: nextAlertSettings } }));
  }, 300);

  const patchAlert = (patch) => {
    if (!form?.id) return;
    const next = mergeAlertSettings({ ...alertSettings, ...patch });
    const nextForm = { ...form, alertSettings: next };
    dispatch(updateForm({ id: form.id, changes: { alertSettings: next } }));
    dispatchSyncFormAlerts(dispatch, nextForm);
    persistAlertSettings(next);
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    showToast({ type: 'success', message: 'Link copied to clipboard.', duration: 2200 });
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleShareAction = (action) => {
    if (action.id === 'embed') {
      const snippet = `<iframe src="${fullUrl}" width="100%" height="520" frameborder="0"></iframe>`;
      navigator.clipboard?.writeText(snippet);
    }
    if (action.id === 'email') {
      const subject = encodeURIComponent(form?.title ?? name ?? 'Clearform survey');
      const body = encodeURIComponent(`Please take our survey:\n\n${fullUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
    }
    showToast({ type: 'success', message: action.message, duration: 2200 });
  };

  const displayName = name || form?.title || 'Untitled';

  const runPauseForm = useCallback(async () => {
    if (!form?.id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setActionLoading(true);

    try {
      await pauseFormRequest({ signal: controller.signal });
      dispatch(setFormPause(buildIndefinitePausePayload(form.id)));
      setPauseModalOpen(false);
      showToast({
        type: 'warning',
        message: 'Form paused successfully',
        duration: 6000,
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      showToast({
        type: 'error',
        message: 'Failed to pause form. Try again.',
        duration: 4500,
        action: { label: 'Retry', onClick: () => runPauseForm() },
      });
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, form?.id, showToast]);

  const runDeleteForm = useCallback(async () => {
    if (!form?.id) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setActionLoading(true);

    try {
      await deleteFormRequest({ formId: form.id, signal: controller.signal });
      dispatch(clearNotificationsForForm(form.id));
      dispatch(deleteForm(form.id));
      await dispatch(loadFormsFromApi());
      setDeleteModalOpen(false);
      showToast({
        type: 'success',
        message: 'Form moved to trash',
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => navigate('/dashboard'),
        },
      });
      navigate('/dashboard');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const detail = err?.message?.trim();
      showToast({
        type: 'error',
        message: detail && detail !== 'Failed to delete form'
          ? detail
          : 'Failed to delete form. Try again.',
        duration: 6000,
        action: { label: 'Retry', onClick: () => runDeleteForm() },
      });
    } finally {
      setActionLoading(false);
    }
  }, [dispatch, form?.id, navigate, showToast]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 pt-2 lg:flex-row lg:items-start lg:gap-16">
      <div className="w-full shrink-0 lg:w-[470px]">
        <section className="border-t border-[#e9e7e0] pt-4">
          <SectionHeading>General</SectionHeading>
          <div className="rounded-none">
            <SettingRow
              label="Form name"
              description="Shown in your workspace and analytics breadcrumb"
              control={
                <input
                  value={name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setName(v);
                    persistFormChanges({ title: v.trim() || 'Untitled' });
                  }}
                  className={`${inputBase} h-8 min-w-[180px] max-w-[220px]`}
                />
              }
            />
            <SettingRow
              label="Response target"
              description="Progress is tracked against this number on the Performance screen"
              control={
                <input
                  value={target}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTarget(v);
                    const n = Math.max(1, parseInt(v, 10) || 1);
                    persistFormChanges({ responseLimit: n });
                  }}
                  type="number"
                  min={1}
                  className={`${inputBase} h-8 w-20 text-center`}
                />
              }
            />
            <SettingRow
              label="Form lifecycle"
              description="Automatically close after reaching a date or response count"
              control={
                <Select
                  value={lifecycle}
                  onValueChange={(v) => {
                    setLifecycle(v);
                    persistFormChanges({ lifecycleMode: v });
                  }}
                  options={LIFECYCLE_OPTIONS}
                  triggerClassName="h-8 min-w-[160px]"
                  aria-label="Form lifecycle"
                />
              }
            />
            <SettingRow
              label="Capture partial submissions"
              description="Save responses from people who started but didn&apos;t submit"
              control={
                <Toggle
                  checked={partial}
                  onChange={(v) => {
                    setPartial(v);
                    persistFormChanges({ capturePartialSubmissions: v });
                  }}
                />
              }
            />
          </div>
        </section>

        <section className="mt-10 border-t border-[#e9e7e0] pt-4">
          <SectionHeading>Alert rules</SectionHeading>
          <p className="mb-3 text-[11px] leading-[16px] text-[#8e8c86]">
            Active alerts appear in your notification center when conditions are met.
          </p>
          <div>
            <SettingRow
              label="Completion rate drops below"
              description="Get notified when completion rate falls under this threshold"
              control={
                <div className="flex items-center gap-2">
                  <input
                    value={completionPct}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompletionPct(v);
                      patchAlert({
                        completion: {
                          ...alertSettings.completion,
                          thresholdPct: Number(v) || 10,
                        },
                      });
                    }}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <span className="text-[13px] text-[#6a6860]">%</span>
                  <div className="pl-2">
                    <Toggle
                      checked={alertSettings.completion.enabled}
                      onChange={(enabled) =>
                        patchAlert({ completion: { ...alertSettings.completion, enabled } })
                      }
                    />
                  </div>
                </div>
              }
            />
            <SettingRow
              label="Responses hit milestone"
              description="Celebrate when you hit 100, 250, 500, or custom milestones"
              control={
                <div className="flex items-center gap-2">
                  <input
                    value={milestoneVal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMilestoneVal(v);
                      patchAlert({
                        milestone: {
                          ...alertSettings.milestone,
                          value: Number(v) || 500,
                        },
                      });
                    }}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <div className="pl-2">
                    <Toggle
                      checked={alertSettings.milestone.enabled}
                      onChange={(enabled) =>
                        patchAlert({ milestone: { ...alertSettings.milestone, enabled } })
                      }
                    />
                  </div>
                </div>
              }
            />
            <SettingRow
              label="Negative sentiment spike"
              description="Alert when negative sentiment exceeds a % in a single day"
              control={
                <div className="flex items-center gap-2">
                  <input
                    value={sentimentPct}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSentimentPct(v);
                      patchAlert({
                        sentiment: {
                          ...alertSettings.sentiment,
                          thresholdPct: Number(v) || 1,
                        },
                      });
                    }}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <span className="text-[13px] text-[#6a6860]">%</span>
                  <div className="pl-2">
                    <Toggle
                      checked={alertSettings.sentiment.enabled}
                      onChange={(enabled) =>
                        patchAlert({ sentiment: { ...alertSettings.sentiment, enabled } })
                      }
                    />
                  </div>
                </div>
              }
            />
          </div>
        </section>

        <section className="mt-10">
          <div className="rounded-[10px] border border-[#f0c4c4] bg-[#fffafa] p-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.9px] text-[#b91c1c]">
              Danger zone
            </h4>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <p className="text-[13px] font-medium text-[#17160e]">Pause form</p>
                  <p className="mt-0.5 text-[12px] leading-[18px] text-[#646464]">
                    Temporarily stop accepting new responses. You can resume anytime.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={formPaused || actionLoading}
                  onClick={() => setPauseModalOpen(true)}
                  className="shrink-0 rounded-[8px] border border-[#ea580c] px-3 py-2 text-[12px] font-medium text-[#c2410c] transition-colors hover:bg-[#fff7ed] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formPaused ? 'Form paused' : 'Pause form'}
                </button>
              </div>
              <div className="border-t border-[#fce4e4] pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-[#17160e]">Delete form</p>
                    <p className="mt-0.5 text-[12px] leading-[18px] text-[#646464]">
                      Permanently remove this form and its analytics. This cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setDeleteModalOpen(true)}
                    className="shrink-0 rounded-[8px] border border-[#dc2626] px-3 py-2 text-[12px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[320px]">
        <SectionHeading>Share &amp; embed</SectionHeading>
        <div className="mt-3 overflow-hidden rounded-[12px] border border-[#e8e6e1] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3 border-b border-[#f0ede6] bg-gradient-to-b from-[#fafaf8] to-white px-4 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eaf5ee] shadow-sm">
              <RiShareLine size={16} className="text-[#2ea44f]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold leading-snug text-[#17160e]">Public link</p>
              <p className="mt-1 text-[12px] leading-[17px] text-[#646464]">
                Anyone with the link can fill out this form.
              </p>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span
                className="min-w-0 flex-1 truncate rounded-[10px] border border-[#e9e7e0] bg-[#fafaf8] px-3 py-2 font-mono text-[11px] text-[#646464]"
                title={fullUrl}
              >
                {formUrl}
              </span>
              <motion.button
                type="button"
                onClick={copyLink}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-3 py-2 text-[12px] font-medium transition-colors ${
                  copied
                    ? 'bg-[#2ea44f] text-white'
                    : 'bg-[#17160e] text-white hover:bg-[#2c2a27]'
                }`}
              >
                {copied ? <RiCheckLine size={14} aria-hidden /> : <RiFileCopyLine size={14} aria-hidden />}
                {copied ? 'Copied' : 'Copy link'}
              </motion.button>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.85px] text-[#a8a6a0] pt-1">
              More ways to share
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {SHARE_ACTIONS.map(({ id, label, bg, iconColor, Icon, message }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleShareAction({ id, message })}
                  className="group flex flex-col items-center gap-2 rounded-[12px] border border-[#f0ede6] bg-[#fafaf8] py-3 transition-all hover:border-[#e0ddd7] hover:bg-white hover:shadow-sm"
                >
                  <span
                    className="flex size-11 items-center justify-center rounded-[10px] transition-transform group-hover:scale-[1.03]"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={20} color={iconColor} aria-hidden />
                  </span>
                  <span className="text-[10.5px] font-medium text-[#4e4e4e]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <PauseFormModal
        open={pauseModalOpen}
        formName={displayName}
        onCancel={() => !actionLoading && setPauseModalOpen(false)}
        onConfirm={runPauseForm}
        isLoading={actionLoading}
      />
      <DeleteFormModal
        open={deleteModalOpen}
        formName={displayName}
        onCancel={() => !actionLoading && setDeleteModalOpen(false)}
        onConfirm={runDeleteForm}
        isLoading={actionLoading}
      />
    </div>
  );
}

export default AnalyticsSettingsPanel;
