import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightSLine,
  RiCheckLine,
  RiCodeSSlashLine,
  RiDownloadLine,
  RiEyeLine,
  RiFileCopyLine,
  RiInformationLine,
  RiLayoutGridLine,
  RiMailLine,
  RiShareForwardLine,
  RiShareLine,
  RiGlobalLine,
} from 'react-icons/ri';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import { useToast } from '@/hooks/useToast';

const STEPS = [
  { id: 1, label: 'Choose use case' },
  { id: 2, label: 'Template preview' },
  { id: 3, label: 'Form builder' },
  { id: 4, label: 'Publish' },
];

const StepBar = ({ activeStep = 4 }) => (
  <div className="flex items-center">
    {STEPS.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex items-center gap-2 px-5">
          <div
            className={`w-5 h-5 rounded-[10px] flex items-center justify-center border text-[10px] font-medium leading-none shrink-0 ${
              step.id === activeStep
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                : 'border-[#e4e2dc] text-[#7a7a72]'
            }`}
          >
            {step.id}
          </div>
          <span
            className={`text-[12px] font-medium whitespace-nowrap ${
              step.id === activeStep ? 'text-[#1a1a1a]' : 'text-[#7a7a72]'
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <span className="text-[#e4e2dc] text-[16px] font-normal leading-none">›</span>
        )}
      </div>
    ))}
  </div>
);

const PublishToggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex shrink-0 items-center w-[42px] h-[24px] rounded-full transition-colors cursor-pointer focus:outline-none ${
      checked ? 'bg-[#2a9d6e]' : 'bg-[#d4d1cb]'
    }`}
  >
    <span
      className={`absolute w-[18px] h-[18px] bg-white rounded-full transition-transform ${
        checked ? 'translate-x-[21px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold text-[#a8a49c] tracking-[0.7px] uppercase">{children}</p>
);

const ShareButton = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-center gap-[6px] h-[36px] bg-[#f5f4f0] border border-[#e8e6e1] rounded-[6px] text-[12.5px] font-medium text-[#3a3835] hover:bg-[#eeede8] transition-colors cursor-pointer"
  >
    <Icon size={13} className="shrink-0" />
    {label}
  </button>
);

const AdvancedRow = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center justify-between w-full px-[18px] py-[13px] hover:bg-[#faf9f7] transition-colors cursor-pointer group"
  >
    <span className="flex items-center gap-[10px]">
      <Icon size={14} className="text-[#0d0d0d] shrink-0" />
      <span className="text-[13px] text-[#0d0d0d]">{label}</span>
    </span>
    <RiArrowRightSLine size={13} className="text-[#a8a49c] group-hover:text-[#6b6860]" />
  </button>
);

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'untitled-form'
  );
}

const FormPublishView = ({ formTitle = 'Untitled Form', showOnboardingStepper = false }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [acceptingResponses, setAcceptingResponses] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const formSlug = useMemo(() => slugify(formTitle), [formTitle]);
  const formUrl = `https://clearform.io/f/${formSlug}`;
  const shortUrl = `clearform.io/f/${formSlug}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=${encodeURIComponent(formUrl)}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      showToast({ type: 'success', message: 'Link copied to clipboard' });
    } catch {
      showToast({ type: 'error', message: 'Could not copy link' });
    }
  }, [formUrl, showToast]);

  const downloadQr = useCallback(() => {
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `${formSlug}-qr.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }, [formSlug, qrImageUrl]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f4f0]">
      <header className="h-[48px] shrink-0 bg-white border-b border-[#e4e2dc] flex items-center px-6 z-10 gap-4">
        <div className="flex items-center shrink-0">
          <img src={clearformLogo} alt="Clearform" className="h-[26px] w-auto object-contain" />
        </div>

        {showOnboardingStepper && (
          <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
            <StepBar activeStep={4} />
          </div>
        )}

        <div className={`flex items-center shrink-0${showOnboardingStepper ? '' : ' ml-auto'}`}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-[15px] py-[8px] bg-white border border-[#e4e2dc] rounded-[8px] text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap"
          >
            Home
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1080px] mx-auto px-6 py-7 pb-12 flex flex-col gap-4">
          <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] flex items-center gap-4 px-7 py-5">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-[20px] bg-[#2a9d6e] flex items-center justify-center">
                <RiCheckLine size={18} className="text-white" />
              </div>
              <div
                className="absolute inset-0 rounded-[20px] pointer-events-none"
                style={{ boxShadow: '0 0 0 6px rgba(42,157,110,0.2)' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-[17px] font-bold text-black tracking-[-0.3px] leading-tight">
                Your form is published!
              </h1>
              <p className="text-[12.5px] text-black/45 mt-0.5 truncate">
                {formTitle} · {shortUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => window.open(formUrl, '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-[6px] h-9 px-4 bg-black text-white text-[13px] font-semibold rounded-[6px] hover:bg-[#2c2c2c] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RiEyeLine size={16} />
                View responses
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-[6px] h-9 px-[17px] border border-black/15 text-[13px] font-medium text-black rounded-[6px] hover:bg-[#f5f4f0] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RiShareLine size={16} />
                Share
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-[18px] pt-[14px] pb-2.5">
                  <SectionLabel>Form link</SectionLabel>
                </div>
                <div className="px-[18px] pb-4 flex flex-col gap-4">
                  <div className="flex gap-2">
                    <div className="flex-1 min-w-0 h-9 flex items-center px-3 bg-[#f5f4f0] border border-[#e8e6e1] rounded-[6px] text-[12px] text-[#3a3835] truncate">
                      {formUrl}
                    </div>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex items-center gap-[5px] h-9 px-[14px] bg-[#0d0d0d] text-white text-[12.5px] font-medium rounded-[6px] hover:bg-[#2c2c2c] transition-colors cursor-pointer shrink-0"
                    >
                      <RiFileCopyLine size={12} />
                      Copy
                    </button>
                  </div>

                  <div className="border-t border-[#e8e6e1]" />

                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 shrink-0 bg-white border border-[#e8e6e1] rounded-[6px] flex items-center justify-center p-1">
                      <img src={qrImageUrl} alt="QR code for form link" className="w-[72px] h-[72px]" />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-[#0d0d0d]">QR Code</p>
                      <p className="text-[12px] text-[#a8a49c] leading-[18px] max-w-[280px]">
                        Let respondents scan this code to access your form instantly.
                      </p>
                      <button
                        type="button"
                        onClick={downloadQr}
                        className="mt-1 self-start flex items-center gap-[5px] h-[30px] px-[13px] bg-white border border-[#d4d1cb] text-[12px] font-medium text-[#0d0d0d] rounded-[6px] hover:bg-[#f5f4f0] transition-colors cursor-pointer"
                      >
                        <RiDownloadLine size={11} />
                        Download QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] overflow-hidden pb-5">
                <div className="px-[18px] pt-[14px] pb-6">
                  <SectionLabel>Share via</SectionLabel>
                </div>
                <div className="px-[18px] grid grid-cols-2 gap-2">
                  <ShareButton icon={RiCodeSSlashLine} label="Embed on website" onClick={() => {}} />
                  <ShareButton icon={RiMailLine} label="Send via email" onClick={() => {}} />
                  <ShareButton icon={RiGlobalLine} label="Social media" onClick={() => {}} />
                  <ShareButton icon={RiShareForwardLine} label="Copy & share" onClick={copyLink} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-[18px] pt-[14px]">
                  <SectionLabel>Response overview</SectionLabel>
                </div>
                <div className="px-[18px] pt-6 pb-[18px] flex flex-col gap-7">
                  <div className="grid grid-cols-3 gap-px bg-[#e8e6e1] rounded-[10px] overflow-hidden">
                    <div className="bg-[#f5f4f0] px-3 py-3.5 flex flex-col gap-0.5">
                      <span className="text-[20px] font-bold text-[#2a9d6e] tracking-[-0.5px]">0</span>
                      <span className="text-[11px] font-medium text-[#a8a49c]">Responses so far</span>
                    </div>
                    <div className="bg-[#f5f4f0] px-3 py-3.5 flex flex-col gap-0.5">
                      <span className="text-[20px] font-bold text-[#0d0d0d] tracking-[-0.5px]">—</span>
                      <span className="text-[11px] font-medium text-[#a8a49c]">Completion rate</span>
                    </div>
                    <div className="bg-[#f5f4f0] px-3 py-3.5 flex flex-col gap-0.5">
                      <span className="text-[20px] font-bold text-[#0d0d0d] tracking-[-0.5px]">—</span>
                      <span className="text-[11px] font-medium text-[#a8a49c]">Avg. time</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#e8f5ee] rounded-[6px]">
                    <RiInformationLine size={14} className="text-[#2a9d6e] shrink-0" />
                    <span className="text-[12px] font-medium text-[#2a9d6e]">
                      Your form is live and accepting responses
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="px-[18px] pt-[14px]">
                  <SectionLabel>Settings</SectionLabel>
                </div>
                <div className="flex items-center justify-between px-[18px] py-4 border-b border-[#e8e6e1]">
                  <div>
                    <p className="text-[13px] font-medium text-[#0d0d0d]">Accepting responses</p>
                    <p className="text-[11.5px] text-[#a8a49c] mt-px">Form is live and collecting submissions</p>
                  </div>
                  <PublishToggle checked={acceptingResponses} onChange={setAcceptingResponses} />
                </div>
                <div className="flex items-center justify-between px-[18px] py-4">
                  <div>
                    <p className="text-[13px] font-medium text-[#0d0d0d]">Email notifications</p>
                    <p className="text-[11.5px] text-[#a8a49c] mt-px">Get notified when someone submits</p>
                  </div>
                  <PublishToggle checked={emailNotifications} onChange={setEmailNotifications} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e8e6e1] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_3px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="px-[18px] pt-[14px] pb-1">
              <SectionLabel>Advanced options</SectionLabel>
            </div>
            <AdvancedRow icon={RiCodeSSlashLine} label="Get embed code" onClick={() => {}} />
            <div className="border-t border-[#e8e6e1]">
              <AdvancedRow icon={RiDownloadLine} label="Export responses" onClick={() => {}} />
            </div>
            <div className="border-t border-[#e8e6e1]">
              <AdvancedRow icon={RiLayoutGridLine} label="Duplicate form" onClick={() => {}} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormPublishView;
