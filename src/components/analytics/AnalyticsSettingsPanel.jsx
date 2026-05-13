import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiQrCodeLine,
  RiCodeSSlashLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
} from 'react-icons/ri';
import { useToast } from '../../hooks/useToast';

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

function AnalyticsSettingsPanel({ form }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  const slug = (form?.title ?? 'nps-survey-q1-2026')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);

  const shareUrl = `clearform.io/f/${slug || 'your-form'}`;

  const copyLink = () => {
    const full = `https://${shareUrl}`;
    navigator.clipboard?.writeText(full);
    showToast({ type: 'success', message: 'Link copied to clipboard.', duration: 2200 });
  };

  const notifyOptions = [
    { id: 'email', label: 'Email' },
    { id: 'slack', label: 'Slack' },
    { id: 'in_app', label: 'In-app' },
  ];

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
                <select
                  value={lifecycle}
                  onChange={(e) => setLifecycle(e.target.value)}
                  className={`${inputBase} h-8 min-w-[140px] cursor-pointer pr-8`}
                >
                  <option>No limit</option>
                  <option>Close on date</option>
                  <option>Close after response count</option>
                </select>
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
                  className="shrink-0 rounded-[8px] border border-[#ea580c] px-3 py-2 text-[12px] font-medium text-[#c2410c] transition-colors hover:bg-[#fff7ed]"
                >
                  Pause form
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
                    className="shrink-0 rounded-[8px] border border-[#dc2626] px-3 py-2 text-[12px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2]"
                  >
                    Delete form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#17160e] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2c2c2e]"
          >
            Go to advanced settings
            <RiArrowRightLine size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Right — share & embed (Figma ~300px) */}
      <aside className="w-full shrink-0 lg:sticky lg:top-28 lg:w-[300px]">
        <SectionHeading>Share &amp; embed</SectionHeading>
        <div className="mt-3 rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-white p-[17px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-normal leading-tight text-[#1a1814]">Share</p>
          <div className="mt-3 flex h-[33px] items-center justify-between gap-2 rounded-full bg-[#f5f5f4] px-3">
            <span className="min-w-0 truncate text-[11px] text-[#6b6b67]">{shareUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 text-[11px] font-normal text-[#1a1814] underline-offset-2 hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="mt-3 flex justify-between gap-2">
            {[
              { Icon: RiCodeSSlashLine, label: 'Embed' },
              { Icon: RiCheckboxCircleLine, label: 'Email' },
              { Icon: RiQrCodeLine, label: 'QR code' },
            ].map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex h-[51px] flex-1 flex-col items-center justify-center gap-1 rounded-[8px] border border-[rgba(0,0,0,0.1)] px-1 py-2 text-[#1a1814] transition-colors hover:bg-[#fafaf8]"
              >
                <Icon size={14} className="text-[#1a1814]" aria-hidden />
                <span className="text-center text-[10px] font-normal leading-[15px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
}

export default AnalyticsSettingsPanel;
