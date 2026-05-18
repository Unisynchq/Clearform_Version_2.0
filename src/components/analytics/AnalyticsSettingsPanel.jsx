import { useCallback, useMemo, useRef, useState } from 'react';
import {
  RiQrCodeLine,
  RiCodeSSlashLine,
  RiFileCopyLine,
  RiMailLine,
  RiShareLine,
} from 'react-icons/ri';
import Select from '../ui/Select';
import { useToast } from '../../hooks/useToast';
import { DeleteFormModal, PauseFormModal } from './AnalyticsFormActionModals';
import { deleteFormRequest, pauseFormRequest } from './analyticsFormActions';

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

function AnalyticsSettingsPanel({ form }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [formPaused, setFormPaused] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const abortRef = useRef(null);

  const [name, setName] = useState(form?.title ?? 'NPS Survey Q1 2026');
  const [target, setTarget] = useState(String(form?.responseLimit ?? 500));
  const [lifecycle, setLifecycle] = useState('No limit');
  const [partial, setPartial] = useState(true);

  const [alertCompletion, setAlertCompletion] = useState(true);
  const [completionPct, setCompletionPct] = useState('10');
  const [milestone, setMilestone] = useState(true);
  const [milestoneVal, setMilestoneVal] = useState('500');
  const [npsAlert, setNpsAlert] = useState(false);
  const [npsMin, setNpsMin] = useState('50');
  const [sentimentAlert, setSentimentAlert] = useState(true);
  const [sentimentPct, setSentimentPct] = useState('25');
  const [notifyVia, setNotifyVia] = useState('email');

  const slug = useMemo(() => {
    const source = form?.title ?? name;
    return (
      source
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'your-form'
    );
  }, [form?.title, name]);

  const formUrl = `form.clearform.io/${slug}`;
  const fullUrl = `https://${formUrl}`;

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

  const notifyOptions = [
    { id: 'email', label: 'Email' },
    { id: 'in_app', label: 'In-app' },
  ];

  const displayName = name || form?.title || 'NPS Survey Q1 2026';

  const runPauseForm = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setActionLoading(true);

    try {
      await pauseFormRequest({ signal: controller.signal });
      setFormPaused(true);
      setPauseModalOpen(false);
      showToast({
        type: 'warning',
        message: 'Form paused successfully',
        duration: 6000,
        action: {
          label: 'Undo',
          onClick: () => setFormPaused(false),
        },
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
  }, [showToast]);

  const runDeleteForm = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setActionLoading(true);

    try {
      await deleteFormRequest({ signal: controller.signal });
      setDeleteModalOpen(false);
      showToast({
        type: 'success',
        message: 'Form moved to trash',
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => {
            window.location.assign('/dashboard');
          },
        },
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      showToast({
        type: 'error',
        message: 'Failed to delete form. Try again.',
        duration: 4500,
        action: { label: 'Retry', onClick: () => runDeleteForm() },
      });
    } finally {
      setActionLoading(false);
    }
  }, [showToast]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 pt-2 lg:flex-row lg:items-start lg:gap-16">
      {/* Left — settings (Figma ~470px) */}
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
                  onChange={(e) => setName(e.target.value)}
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
                  onChange={(e) => setTarget(e.target.value)}
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
                  onValueChange={setLifecycle}
                  options={LIFECYCLE_OPTIONS}
                  triggerClassName="h-8 min-w-[160px]"
                  aria-label="Form lifecycle"
                />
              }
            />
            <SettingRow
              label="Capture partial submissions"
              description="Save responses from people who started but didn&apos;t submit"
              control={<Toggle checked={partial} onChange={setPartial} />}
            />
          </div>
        </section>

        <section className="mt-10 border-t border-[#e9e7e0] pt-4">
          <SectionHeading>Alert rules</SectionHeading>
          <div>
            <SettingRow
              label="Completion rate drops below"
              description="Get notified when completion rate falls under this threshold"
              control={
                <div className="flex items-center gap-2">
                  <input
                    value={completionPct}
                    onChange={(e) => setCompletionPct(e.target.value)}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <span className="text-[13px] text-[#6a6860]">%</span>
                  <div className="pl-2">
                    <Toggle checked={alertCompletion} onChange={setAlertCompletion} />
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
                    onChange={(e) => setMilestoneVal(e.target.value)}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <div className="pl-2">
                    <Toggle checked={milestone} onChange={setMilestone} />
                  </div>
                </div>
              }
            />
            <SettingRow
              label="NPS score drops below"
              description="Alert when NPS score falls below your minimum acceptable level"
              control={
                <div className="flex items-center gap-2">
                  <input
                    value={npsMin}
                    onChange={(e) => setNpsMin(e.target.value)}
                    className={`${inputBase} h-8 w-20 text-center ${!npsAlert ? 'opacity-50' : ''}`}
                    disabled={!npsAlert}
                  />
                  <div className="pl-2">
                    <Toggle checked={npsAlert} onChange={setNpsAlert} />
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
                    onChange={(e) => setSentimentPct(e.target.value)}
                    className={`${inputBase} h-8 w-20 text-center`}
                  />
                  <span className="text-[13px] text-[#6a6860]">%</span>
                  <div className="pl-2">
                    <Toggle checked={sentimentAlert} onChange={setSentimentAlert} />
                  </div>
                </div>
              }
            />
            <SettingRow
              label="Notify via"
              description="Where to send alert notifications"
              control={
                <div className="flex flex-wrap items-center gap-1.5">
                  {notifyOptions.map(({ id, label: lbl }) => {
                    const active = notifyVia === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setNotifyVia(id)}
                        className={`h-[26px] rounded-full px-3 text-[11px] font-medium transition-colors ${
                          active
                            ? 'border border-[#17160e] bg-[#17160e] text-white'
                            : 'border border-[#8e8c86] bg-transparent font-normal text-[#646464] hover:bg-[#fafaf8]'
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
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

      {/* Right — share & embed (Figma ~300px) */}
      <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[300px]">
        <SectionHeading>Share &amp; embed</SectionHeading>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e8e6e1] bg-white p-[17px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-2.5 border-b border-[#f0ede6] bg-[#fafaf8] -mx-[17px] -mt-[17px] mb-4 px-4 py-3.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#eaf5ee]">
              <RiShareLine size={15} className="text-[#2ea44f]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug text-[#17160e]">Public link</p>
              <p className="mt-0.5 text-[11.5px] leading-[17px] text-[#646464]">
                Anyone with the link can fill out this form.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-[10px] border border-[#e9e7e0] bg-[#f7f6f2] py-1 pl-3 pr-1">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#646464]" title={fullUrl}>
              {formUrl}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                copied
                  ? 'bg-[#2ea44f] text-white'
                  : 'bg-[#17160e] text-white hover:bg-[#2c2a27]'
              }`}
            >
              <RiFileCopyLine size={13} aria-hidden />
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.85px] text-[#a8a6a0]">
            More ways to share
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {SHARE_ACTIONS.map(({ id, label, bg, iconColor, Icon, message }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleShareAction({ id, message })}
                className="group flex flex-col items-center gap-1.5 rounded-[10px] border border-transparent py-2 transition-colors hover:border-[#e9e7e0] hover:bg-[#fafaf8]"
              >
                <span
                  className="flex size-11 items-center justify-center rounded-[10px] transition-opacity group-hover:opacity-85"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={20} color={iconColor} aria-hidden />
                </span>
                <span className="text-[10.5px] font-medium text-[#4e4e4e]">{label}</span>
              </button>
            ))}
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
