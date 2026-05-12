import { useState } from 'react';
import {
  RiMailLine,
  RiQrCodeLine,
  RiLayoutGridLine,
} from 'react-icons/ri';

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
        checked ? 'bg-[#7c3aed]' : 'bg-[#d4d2cc]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function AnalyticsSettingsPanel({ form }) {
  const [name, setName] = useState(form?.title ?? '');
  const [target, setTarget] = useState(String(form?.responseLimit ?? 500));
  const [lifecycle, setLifecycle] = useState('No limit');
  const [partial, setPartial] = useState(true);
  const [alertCompletion, setAlertCompletion] = useState(true);
  const [completionPct, setCompletionPct] = useState('10');
  const [milestone, setMilestone] = useState(true);
  const [milestoneVal, setMilestoneVal] = useState('500');
  const [npsAlert, setNpsAlert] = useState(false);
  const [npsMin, setNpsMin] = useState('50');

  const slug = (form?.title ?? 'form')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

  const shareUrl = `clearform.io/f/${slug || 'your-form'}`;

  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
      <div className="flex flex-col gap-8">
        <section>
          <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase mb-4">General</h3>
          <div className="bg-white border border-[#e5e3dc] rounded-[12px] p-5 flex flex-col gap-5 shadow-sm">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#393939]">Form name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] outline-none focus:border-[#7c3aed]"
              />
              <span className="text-[11px] text-[#a8a6a0]">Shown in your workspace and analytics breadcrumb</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#393939]">Response target</span>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                type="number"
                min={1}
                className="max-w-[120px] rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] outline-none focus:border-[#7c3aed]"
              />
              <span className="text-[11px] text-[#a8a6a0]">Progress is tracked against this number on the Performance screen</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[#393939]">Form lifecycle</span>
              <select
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
                className="max-w-[240px] rounded-[8px] border border-[#e5e3dc] px-3 py-2 text-[13px] bg-white outline-none focus:border-[#7c3aed] cursor-pointer"
              >
                <option>No limit</option>
                <option>Close on date</option>
                <option>Close after response count</option>
              </select>
              <span className="text-[11px] text-[#a8a6a0]">Automatically close after reaching a date or response count</span>
            </label>
            <div className="flex items-start justify-between gap-4 pt-1 border-t border-[#f4f3ef]">
              <div>
                <p className="text-[13px] font-medium text-[#393939]">Capture partial submissions</p>
                <p className="text-[11px] text-[#a8a6a0] mt-1">Save responses from people who started but didn&apos;t submit</p>
              </div>
              <Toggle checked={partial} onChange={setPartial} />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase mb-4">Alert rules</h3>
          <div className="bg-white border border-[#e5e3dc] rounded-[12px] p-5 flex flex-col gap-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#393939]">Completion rate drops below</p>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={completionPct}
                    onChange={(e) => setCompletionPct(e.target.value)}
                    className="w-14 rounded-[6px] border border-[#e5e3dc] px-2 py-1 text-[13px]"
                  />
                  <span className="text-[13px] text-[#6b6966]">%</span>
                </div>
                <p className="text-[11px] text-[#a8a6a0] mt-1">Get notified when completion rate falls under this threshold</p>
              </div>
              <Toggle checked={alertCompletion} onChange={setAlertCompletion} />
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-[#f4f3ef] pt-4">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#393939]">Responses hit milestone</p>
                <input
                  value={milestoneVal}
                  onChange={(e) => setMilestoneVal(e.target.value)}
                  className="mt-2 w-24 rounded-[6px] border border-[#e5e3dc] px-2 py-1 text-[13px]"
                />
                <p className="text-[11px] text-[#a8a6a0] mt-1">Celebrate when you hit 100, 250, 500, or custom milestones</p>
              </div>
              <Toggle checked={milestone} onChange={setMilestone} />
            </div>
            <div className="flex items-start justify-between gap-4 border-t border-[#f4f3ef] pt-4">
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#393939]">NPS score drops below</p>
                <input
                  value={npsMin}
                  onChange={(e) => setNpsMin(e.target.value)}
                  className="mt-2 w-24 rounded-[6px] border border-[#e5e3dc] px-2 py-1 text-[13px]"
                  disabled={!npsAlert}
                />
                <p className="text-[11px] text-[#a8a6a0] mt-1">Alert when NPS score falls below your minimum acceptable level</p>
              </div>
              <Toggle checked={npsAlert} onChange={setNpsAlert} />
            </div>
          </div>
        </section>
      </div>

      <aside className="xl:sticky xl:top-28">
        <h3 className="text-[10px] font-semibold text-[#888780] tracking-[0.7px] uppercase mb-3">Share &amp; embed</h3>
        <div className="bg-white border border-[#e5e3dc] rounded-[12px] p-4 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-[11px] text-[#a8a6a0] mb-1.5">Share link</p>
            <div className="flex rounded-[8px] border border-[#e5e3dc] overflow-hidden">
              <input readOnly value={shareUrl} className="flex-1 min-w-0 px-3 py-2 text-[12px] text-[#393939] bg-[#fafaf8] outline-none" />
              <button
                type="button"
                className="px-3 text-[12px] font-medium text-[#7c3aed] hover:bg-[#f4f3ef] border-l border-[#e5e3dc] cursor-pointer shrink-0"
                onClick={() => navigator.clipboard?.writeText(`https://${shareUrl}`)}
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { Icon: RiLayoutGridLine, label: 'Embed' },
              { Icon: RiMailLine, label: 'Email' },
              { Icon: RiQrCodeLine, label: 'QR code' },
            ].map(({ Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[8px] border border-[#e5e3dc] text-left text-[13px] font-medium text-[#393939] hover:bg-[#f4f3ef] cursor-pointer"
              >
                <Icon size={18} className="text-[#6b6966]" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default AnalyticsSettingsPanel;
