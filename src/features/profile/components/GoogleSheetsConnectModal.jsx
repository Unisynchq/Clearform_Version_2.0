import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import ProfileModal from '@/components/profile/ProfileModal';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import clearformLogoIcon from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import GoogleSheetsConnectingView from '@/features/profile/components/GoogleSheetsConnectingView';
import GoogleSheetsConnectionFailedView from '@/features/profile/components/GoogleSheetsConnectionFailedView';
import { createGoogleSheetsOAuthError } from '@/features/profile/utils/googleSheetsConnection';

const ALLOWED_PERMISSIONS = [
  {
    title: 'Create new Google Sheets spreadsheets',
    description: 'A new sheet is created per form to receive incoming response',
  },
  {
    title: 'Read spreadsheet metadata',
    description: 'To list your sheets so you can pick the destination',
  },
];

const DENIED_PERMISSIONS = [
  {
    title: 'Read or edit your other Google Drive files',
    description: 'Access is limited to spreadsheets created by or shared with Clearform',
  },
  {
    title: 'Delete sheets or any of your data',
    description: 'No destructive actions, ever',
  },
];

const AllowIcon = () => (
  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border border-[#c6f0d8] bg-[#f0efff] p-px">
    <RiCheckLine size={10} className="text-[#2e7d52]" aria-hidden />
  </span>
);

const DenyIcon = () => (
  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border border-[#fed7d7] bg-[#fff5f5] p-px">
    <RiCloseLine size={10} className="text-[#c53030]" aria-hidden />
  </span>
);

const PermissionRow = ({ type, title, description, isLast }) => (
  <div
    className={`flex gap-2.5 py-2.5 ${isLast ? '' : 'border-b border-[#f0f0ee]'}`}
  >
    <div className="pt-px">{type === 'allow' ? <AllowIcon /> : <DenyIcon />}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-medium text-[#1a1a18]">{title}</p>
      <p className="mt-0.5 text-[12px] leading-[17px] text-[#6b6b68]">{description}</p>
    </div>
  </div>
);

const GoogleSheetsConnectModal = ({
  open,
  onClose,
  onConfirm,
  simulateFailure = false,
  initialSimulateFailure = false,
}) => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('permissions');
  const [errorRef, setErrorRef] = useState(() => createGoogleSheetsOAuthError());
  const [simulateFailureRun, setSimulateFailureRun] = useState(false);

  const willSimulateFailure = simulateFailure || simulateFailureRun;

  useEffect(() => {
    if (!open) {
      setPhase('permissions');
      setErrorRef(createGoogleSheetsOAuthError());
      setSimulateFailureRun(false);
      return;
    }
    if (initialSimulateFailure) setSimulateFailureRun(true);
  }, [open, initialSimulateFailure]);

  const isConnecting = phase === 'connecting';

  const handleClose = () => {
    if (isConnecting) return;
    onClose();
  };

  const handleConfirm = () => {
    setPhase('connecting');
  };

  const handleConnectingComplete = useCallback(() => {
    onConfirm();
    onClose();
    setPhase('permissions');
  }, [onConfirm, onClose]);

  const handleConnectingFailure = useCallback(() => {
    setErrorRef(createGoogleSheetsOAuthError());
    setPhase('failed');
  }, []);

  const handleTryAgain = () => {
    setPhase('connecting');
  };

  const handleGetHelp = () => {
    onClose();
    setPhase('permissions');
    navigate('/dashboard/help');
  };

  return (
    <ProfileModal
      open={open}
      onClose={handleClose}
      widthClass="w-[min(100%,400px)]"
      className="overflow-hidden rounded-[16px] border-0 p-0 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
    >
      {phase === 'connecting' ? (
        <GoogleSheetsConnectingView
          onComplete={handleConnectingComplete}
          onFailure={handleConnectingFailure}
          simulateFailure={willSimulateFailure}
        />
      ) : phase === 'failed' ? (
        <GoogleSheetsConnectionFailedView
          errorRef={errorRef}
          onCancel={handleClose}
          onGetHelp={handleGetHelp}
          onTryAgain={handleTryAgain}
        />
      ) : (
        <div className="flex flex-col">
          <div className="border-b border-[#f0f0ee] px-7 pb-5 pt-6">
            <div className="flex items-center justify-center gap-3.5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#e8e8e6] p-px">
                <img src={sheetsIcon} alt="" className="size-[22px] object-contain" aria-hidden />
              </div>
              <RiArrowRightLine size={20} className="shrink-0 text-[#d0d0ce]" aria-hidden />
              <div className="flex size-12 shrink-0 items-center justify-center rounded-[12px] border border-[#e8e8e6] bg-white p-1.5">
                <img
                  src={clearformLogoIcon}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  aria-hidden
                />
              </div>
            </div>

            <h2
              id="google-sheets-connect-title"
              className="mt-4 text-center text-[15px] font-semibold text-[#1a1a18]"
            >
              Connect Google Sheets to Clearform
            </h2>
            <p className="mt-1 text-center text-[13px] text-[#6b6b68]">
              Clearform is requesting the following permissions
            </p>
          </div>

          <div className="px-7 py-5">
            <p className="pb-3 text-[11px] font-semibold uppercase tracking-[0.77px] text-[#9e9e9a]">
              Clearform will be able to
            </p>
            {ALLOWED_PERMISSIONS.map((item, i) => (
              <PermissionRow
                key={item.title}
                type="allow"
                title={item.title}
                description={item.description}
                isLast={i === ALLOWED_PERMISSIONS.length - 1}
              />
            ))}

            <p className="pb-3 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.77px] text-[#9e9e9a]">
              Clearform will NOT
            </p>
            {DENIED_PERMISSIONS.map((item, i) => (
              <PermissionRow
                key={item.title}
                type="deny"
                title={item.title}
                description={item.description}
                isLast={i === DENIED_PERMISSIONS.length - 1}
              />
            ))}
          </div>

          <div className="border-t border-[#f0f0ee] px-7 pb-6 pt-4">
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="w-[175px] rounded-[6px] px-3.5 py-2 text-[13px] font-medium text-[#6b6b68] transition-colors hover:bg-[#f7f7f6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex w-[179px] items-center justify-center rounded-[6px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#333]"
              >
                Connect
              </button>
            </div>

            <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 text-[12px] text-[#6b6b68]">
              <input
                type="checkbox"
                checked={simulateFailureRun}
                onChange={(e) => setSimulateFailureRun(e.target.checked)}
                className="size-3.5 rounded border-[#c9c7bf] accent-[#1a1a18]"
              />
              Simulate connection failure (preview UI)
            </label>

            <p className="mt-2 text-center text-[11.5px] leading-[17.25px] text-[#9e9e9a]">
              You&apos;ll be redirected to Google to sign in and confirm. By connecting, you agree
              to Clearform&apos;s{' '}
              <a href="#" className="text-[#6b6b68] underline hover:text-[#1a1a18]">
                Terms
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#6b6b68] underline hover:text-[#1a1a18]">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </ProfileModal>
  );
};

export default GoogleSheetsConnectModal;
