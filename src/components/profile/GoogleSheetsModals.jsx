import { useEffect, useState } from 'react';
import {
  RiAddLine,
  RiAlertLine,
  RiCheckLine,
  RiCloseLine,
  RiFileExcel2Line,
  RiRefreshLine,
} from 'react-icons/ri';
import ProfileModal from './ProfileModal';
import { GhostButton, OutlineButton, PrimaryButton } from './ProfileSettingsUi';

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0f0ee] px-6 pb-4 pt-6">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-[#1a1a18]">{title}</h2>
        {subtitle ? <p className="mt-1 text-[12.5px] text-[#6b6b68]">{subtitle}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-8 shrink-0 items-center justify-center rounded-[6px] text-[#9e9e9a] transition-colors hover:bg-[#f7f7f6] hover:text-[#1a1a18]"
      >
        <RiCloseLine size={18} />
      </button>
    </div>
  );
}

function ModalFooter({ children }) {
  return <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f0ee] px-6 py-4">{children}</div>;
}

function PermissionList() {
  const items = [
    'View and manage your Google Sheets spreadsheets',
    'Create new spreadsheets in your Google Drive',
    'Append response data to selected sheets in real time',
  ];
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[12.5px] leading-[19px] text-[#6b6b68]">
          <RiCheckLine size={16} className="mt-0.5 shrink-0 text-[#2e7d52]" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function GoogleSheetsConnectModal({ open, onClose, onConnect }) {
  return (
    <ProfileModal open={open} onClose={onClose} widthClass="w-[min(100%,420px)]" className="overflow-hidden">
      <ModalHeader
        title="Connect Google Sheets"
        subtitle="Clearform will request the following permissions"
        onClose={onClose}
      />
      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="flex items-center gap-3 rounded-[10px] border border-[#e8e8e6] bg-[#fafaf8] px-4 py-3.5">
          <div className="flex size-10 items-center justify-center rounded-[10px] border border-[#bbf7d0] bg-white text-[#34a853]">
            <RiFileExcel2Line size={20} aria-hidden />
          </div>
          <div>
            <p className="text-[13px] font-medium text-[#1a1a18]">Google Sheets</p>
            <p className="text-[12px] text-[#9e9e9a]">Auto-sync form responses</p>
          </div>
        </div>
        <PermissionList />
      </div>
      <ModalFooter>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton type="button" icon={RiAddLine} onClick={onConnect}>
          Connect
        </PrimaryButton>
      </ModalFooter>
    </ProfileModal>
  );
}

const CONNECTING_STEPS = [
  { id: 'redirect', label: 'Redirected to Google Sheets' },
  { id: 'access', label: 'Access approved' },
  { id: 'verify', label: 'Verifying connection' },
];

function ConnectingSpinner() {
  return (
    <div className="flex w-full justify-center" aria-hidden>
      <div className="size-12 animate-spin rounded-full border-[3px] border-[#e8e8e6] border-t-[#1a1a18]" />
    </div>
  );
}

function StepIcon({ status }) {
  if (status === 'done') {
    return (
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border border-[#c6f0d8] bg-[#f0efff] p-px">
        <RiCheckLine size={10} className="text-[#2e7d52]" aria-hidden />
      </span>
    );
  }

  if (status === 'active') {
    return (
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] bg-[#1a1a18]">
        <span className="size-[6px] rounded-[3px] bg-white" />
      </span>
    );
  }

  return <span className="size-[18px] shrink-0 rounded-[9px] border border-[#e8e8e6] bg-[#f7f7f6]" aria-hidden />;
}

export function GoogleSheetsConnectingModal({ open }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      return undefined;
    }

    setActiveStep(0);
    const t1 = window.setTimeout(() => setActiveStep(1), 650);
    const t2 = window.setTimeout(() => setActiveStep(2), 1300);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open]);

  return (
    <ProfileModal
      open={open}
      onClose={() => {}}
      widthClass="w-[min(100%,400px)]"
      className="overflow-hidden !rounded-[16px]"
    >
      <div className="flex flex-col gap-[6px] px-8 py-10">
        <ConnectingSpinner />

        <div className="pt-[14px] text-center">
          <h2 className="text-[15px] font-semibold text-[#1a1a18]">Connecting to Google Sheets</h2>
        </div>

        <p className="text-center text-[13px] leading-[19.5px] text-[#6b6b68]">
          Hang tight while we securely link your
          <br />
          workspace.
        </p>

        <ul className="flex w-full flex-col gap-2.5 pt-[14px]" aria-label="Connection progress">
          {CONNECTING_STEPS.map((step, index) => {
            const status = index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending';

            return (
              <li key={step.id} className="flex items-center gap-2.5">
                <StepIcon status={status} />
                <span
                  className={`text-[13px] leading-normal ${
                    status === 'done'
                      ? 'font-normal text-[#2e7d52]'
                      : status === 'active'
                        ? 'font-medium text-[#1a1a18]'
                        : 'font-normal text-[#9e9e9a]'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ProfileModal>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-[#1a1a18]">{label}</span>
        {description ? <span className="mt-0.5 block text-[12px] text-[#9e9e9a]">{description}</span> : null}
      </span>
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-[#e8e8e6] transition-colors peer-checked:bg-[#1a1a18]" />
        <span className="absolute left-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function GoogleSheetsConfigureModal({ open, onClose, onSave }) {
  const [autoSync, setAutoSync] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  return (
    <ProfileModal open={open} onClose={onClose} widthClass="w-[min(100%,420px)]" className="overflow-hidden">
      <ModalHeader title="Configure Google Sheets" subtitle="Choose how responses sync to your spreadsheet" onClose={onClose} />
      <div className="px-6 py-2">
        <div className="flex flex-col gap-1.5 border-b border-[#f0f0ee] py-4">
          <label className="text-[12px] font-medium text-[#6b6b68]">Spreadsheet</label>
          <select className="w-full rounded-[6px] border border-[#e8e8e6] bg-white px-3 py-2.5 text-[13px] text-[#1a1a18] outline-none focus:border-[#4b43b0]">
            <option>Clearform Responses — 2025</option>
            <option>Create new spreadsheet…</option>
          </select>
        </div>
        <Toggle checked={autoSync} onChange={setAutoSync} label="Auto-sync new responses" description="Append each submission in real time" />
        <Toggle checked={includeTimestamp} onChange={setIncludeTimestamp} label="Include timestamp column" description="Adds submitted-at date to each row" />
      </div>
      <ModalFooter>
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton type="button" icon={RiCheckLine} onClick={onSave}>
          Save configuration
        </PrimaryButton>
      </ModalFooter>
    </ProfileModal>
  );
}

export function GoogleSheetsFailedModal({ open, onClose, onRetry }) {
  return (
    <ProfileModal open={open} onClose={onClose} widthClass="w-[min(100%,420px)]" className="overflow-hidden">
      <div className="flex flex-col items-center px-6 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#fff5f5]">
          <RiAlertLine size={22} className="text-[#c53030]" aria-hidden />
        </div>
        <h2 className="mt-4 text-[15px] font-semibold text-[#1a1a18]">Connection failed</h2>
        <p className="mt-2 max-w-[300px] text-[12.5px] leading-[19px] text-[#6b6b68]">
          We couldn&apos;t connect to Google Sheets. Check your network connection or try signing in again.
        </p>
        <div className="mt-6 flex w-full gap-2.5">
          <OutlineButton type="button" className="flex-1 py-2" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton type="button" icon={RiRefreshLine} className="flex-1 justify-center py-2" onClick={onRetry}>
            Try again
          </PrimaryButton>
        </div>
      </div>
    </ProfileModal>
  );
}

export function useGoogleSheetsFlow() {
  const [modal, setModal] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (modal !== 'connecting') return undefined;
    const timer = window.setTimeout(() => {
      setModal('configure');
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [modal]);

  return {
    connected,
    modal,
    startConnect: () => setModal('connect'),
    openConfigure: () => setModal('configure'),
    confirmConnect: () => setModal('connecting'),
    closeModal: () => setModal(null),
    disconnect: () => {
      setConnected(false);
      setModal(null);
    },
    saveConfigure: () => {
      setConnected(true);
      setModal(null);
    },
    retry: () => setModal('connecting'),
    showFailed: () => setModal('failed'),
  };
}
