import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine,
  RiAlertLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiFileExcel2Line,
} from 'react-icons/ri';
import clearformLogo from '../../assets/clearform-high-resolution-logo-transparent.png';
import {
  createGoogleSheetsOAuthState,
  formatGoogleSheetsErrorReference,
  googleSheetsOAuthParamsToClear,
  parseGoogleSheetsOAuthCallback,
} from '../../lib/googleSheetsOAuth';
import ProfileModal from './ProfileModal';
import { GhostButton, OutlineButton, PrimaryButton } from './ProfileSettingsUi';

const CONNECTION_FAILED_CAUSES = [
  'The browser tab was closed during the redirect',
  "Your Google account doesn't have permission to share this workspace",
];

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

/** Figma 2439:4678 — Connect flow permissions modal */
const SHEETS_CAN = [
  {
    title: 'Create new Google Sheets spreadsheets',
    description: 'A new sheet is created per form to receive incoming response',
  },
  {
    title: 'Read spreadsheet metadata',
    description: 'To list your sheets so you can pick the destination',
  },
];

const SHEETS_WONT = [
  {
    title: 'Read or edit your other Google Drive files',
    description: 'Access is limited to spreadsheets created by or shared with Clearform',
  },
  {
    title: 'Delete sheets or any of your data',
    description: 'No destructive actions, ever',
  },
];

function ConnectPermissionIcon({ allowed }) {
  return (
    <span
      className={`mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border p-px ${
        allowed
          ? 'border-[#c6f0d8] bg-[#f0efff] text-[#2e7d52]'
          : 'border-[#fed7d7] bg-[#fff5f5] text-[#c53030]'
      }`}
      aria-hidden
    >
      {allowed ? <RiCheckLine size={10} /> : <RiCloseLine size={10} />}
    </span>
  );
}

function ConnectPermissionRow({ allowed, title, description, bordered = true }) {
  return (
    <div className={`flex gap-2.5 py-2.5 ${bordered ? 'border-b border-[#f0f0ee]' : ''}`}>
      <ConnectPermissionIcon allowed={allowed} />
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="text-[13px] font-medium leading-normal text-[#1a1a18]">{title}</p>
        <p className="text-[12px] leading-normal text-[#6b6b68]">{description}</p>
      </div>
    </div>
  );
}

function ConnectSectionLabel({ children }) {
  return (
    <p className="pb-3 text-[11px] font-semibold uppercase tracking-[0.77px] text-[#9e9e9a]">
      {children}
    </p>
  );
}

export function GoogleSheetsConnectModal({ open, onClose, onConnect }) {
  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,440px)]"
      className="overflow-hidden !rounded-[16px]"
    >
      <div className="border-b border-[#f0f0ee] px-7 pb-[21px] pt-6">
        <div className="flex items-center justify-center gap-3.5" aria-hidden>
          <div className="flex size-12 items-center justify-center rounded-[12px] border border-[#e8e8e6] bg-white p-px">
            <RiFileExcel2Line size={22} className="text-[#34a853]" />
          </div>
          <RiArrowRightLine size={20} className="shrink-0 text-[#d0d0ce]" />
          <div className="flex size-12 items-center justify-center rounded-[12px] border border-[#e8e8e6] bg-white p-1.5">
            <img src={clearformLogo} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        </div>

        <h2 className="pt-4 text-center text-[15px] font-semibold text-[#1a1a18]">
          Connect Google Sheets to Clearform
        </h2>
        <p className="text-center text-[13px] text-[#6b6b68]">
          Clearform is requesting the following permissions
        </p>
      </div>

      <div className="px-7 py-5">
        <ConnectSectionLabel>Clearform will be able to</ConnectSectionLabel>
        {SHEETS_CAN.map((item, index) => (
          <ConnectPermissionRow
            key={item.title}
            allowed
            title={item.title}
            description={item.description}
            bordered={index < SHEETS_CAN.length - 1}
          />
        ))}

        <div className="pb-3 pt-3.5">
          <ConnectSectionLabel>Clearform will NOT</ConnectSectionLabel>
        </div>
        {SHEETS_WONT.map((item, index) => (
          <ConnectPermissionRow
            key={item.title}
            allowed={false}
            title={item.title}
            description={item.description}
            bordered={index < SHEETS_WONT.length - 1}
          />
        ))}
      </div>

      <div className="border-t border-[#f0f0ee] px-7 pb-6 pt-[17px]">
        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-[175px] rounded-[6px] px-3.5 py-2 text-[13px] font-medium text-[#6b6b68] transition-colors hover:bg-[#f7f7f6] hover:text-[#1a1a18]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConnect}
            className="w-[179px] rounded-[6px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2d2d2a]"
          >
            Connect
          </button>
        </div>

        <p className="mt-3 text-center text-[11.5px] leading-[17.25px] text-[#9e9e9a]">
          You&apos;ll be redirected to Google to sign in and confirm. By connecting,
          <br />
          you agree to Clearform&apos;s{' '}
          <a
            href="https://clearform.in/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6b6b68] underline decoration-solid underline-offset-2"
          >
            Terms
          </a>{' '}
          and{' '}
          <a
            href="https://clearform.in/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6b6b68] underline decoration-solid underline-offset-2"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
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

/** Figma 2439:4815 — Connection failed */
export function GoogleSheetsFailedModal({ open, onClose, onRetry, onGetHelp, errorDetails }) {
  const errorReference = formatGoogleSheetsErrorReference(errorDetails);

  return (
    <ProfileModal
      open={open}
      onClose={onClose}
      widthClass="w-[min(100%,440px)]"
      className="overflow-hidden !rounded-[16px]"
    >
      <div
        className="flex flex-col items-center border-b border-[#f0f0ee] px-7 pb-[25px] pt-8 text-center"
        role="alert"
      >
        <div className="flex size-14 items-center justify-center rounded-full border-2 border-[#fed7d7] bg-[#fff5f5]">
          <RiAlertLine size={24} className="text-[#c53030]" aria-hidden />
        </div>
        <h2 className="pt-2.5 text-[16px] font-semibold text-[#1a1a18]">Connection failed</h2>
        <p className="text-[13px] leading-[19.5px] text-[#6b6b68]">
          Clearform couldn&apos;t connect to Google Sheets. This usually
          <br />
          happens when access is denied or the session expires
          <br />
          during the redirect.
        </p>
      </div>

      <div className="px-7 pb-7 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
          What may have happened
        </p>
        <ul className="mt-1.5 flex flex-col gap-2">
          {CONNECTION_FAILED_CAUSES.map((cause) => (
            <li key={cause} className="flex gap-2 text-[13px] leading-normal text-[#6b6b68]">
              <span className="shrink-0 font-semibold text-[#c53030]" aria-hidden>
                ·
              </span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>

        {errorReference ? (
          <>
            <p className="pt-4 text-[11px] font-semibold uppercase tracking-[0.66px] text-[#9e9e9a]">
              Error reference
            </p>
            <div className="mt-1.5 rounded-[6px] border border-[#e8e8e6] bg-[#f0efff] px-[15px] py-[13px]">
              <p className="break-all font-mono text-[12px] leading-normal text-[#6b6b68]">{errorReference}</p>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f0ee] px-7 pb-[22px] pt-[15px]">
        <GhostButton type="button" className="px-3.5 py-2" onClick={onClose}>
          Cancel
        </GhostButton>
        <OutlineButton type="button" className="px-[15px] py-2" onClick={onGetHelp}>
          Get help
        </OutlineButton>
        <PrimaryButton type="button" className="px-4 py-2" onClick={onRetry}>
          Try again
        </PrimaryButton>
      </div>
    </ProfileModal>
  );
}

export function useGoogleSheetsFlow(searchParams, setSearchParams) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [pendingOAuthState, setPendingOAuthState] = useState(null);

  const clearOAuthParams = () => {
    if (!setSearchParams) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        googleSheetsOAuthParamsToClear(next).forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  };

  const failWithError = (details) => {
    setConnectionError(details ?? null);
    setModal('failed');
  };

  useEffect(() => {
    const oauthError = parseGoogleSheetsOAuthCallback(searchParams);
    if (!oauthError) return;

    failWithError(oauthError);
    clearOAuthParams();
  }, [searchParams]);

  useEffect(() => {
    if (modal !== 'connecting') return undefined;

    const simulateFail = searchParams?.get('sheets') === 'fail';

    const timer = window.setTimeout(() => {
      if (simulateFail) {
        failWithError({
          error: 'access_denied',
          state: pendingOAuthState ?? createGoogleSheetsOAuthState(),
        });
        return;
      }
      setModal('configure');
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [modal, pendingOAuthState, searchParams]);

  const closeModal = () => {
    setModal(null);
    setConnectionError(null);
  };

  return {
    connected,
    modal,
    connectionError,
    startConnect: () => setModal('connect'),
    openConfigure: () => setModal('configure'),
    confirmConnect: () => {
      setPendingOAuthState(createGoogleSheetsOAuthState());
      setConnectionError(null);
      setModal('connecting');
    },
    closeModal,
    disconnect: () => {
      setConnected(false);
      setModal(null);
      setConnectionError(null);
    },
    saveConfigure: () => {
      setConnected(true);
      setModal(null);
      setConnectionError(null);
    },
    retry: () => {
      setConnectionError(null);
      setModal('connecting');
    },
    failWithError,
    getHelp: () => {
      setModal(null);
      navigate('/dashboard/help');
    },
  };
}
