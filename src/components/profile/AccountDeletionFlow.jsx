import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiAlertLine, RiCheckboxCircleLine, RiRefreshLine } from 'react-icons/ri';
import clearformLogo from '../../assets/clearform-high-resolution-logo-transparent.png';
import { SkBlock } from './ProfileSkeletonUi';

const REDIRECT_MS = 4000;
const CLEARFORM_HOME = 'https://clearform.in';

function Spinner({ className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.22" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeletingPanel() {
  return (
    <motion.div
      key="deleting"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex w-full max-w-[440px] flex-col items-center rounded-[16px] border border-[#e8e8e6] bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
      aria-busy="true"
      aria-live="polite"
      aria-label="Deleting account"
    >
      <img src={clearformLogo} alt="Clearform" className="mb-6 h-8 w-auto opacity-90" />

      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-[#f7f7f6] text-[#6b6b68]">
        <Spinner />
      </div>

      <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-[#1a1a18]">Deleting your account</h1>
      <p className="mt-2 max-w-[320px] text-[15px] leading-[24px] text-[#6b6b68]">
        Removing your data, revoking sessions, and disconnecting integrations. Please don&apos;t close
        this window.
      </p>

      <div className="mt-8 flex w-full max-w-[280px] flex-col gap-3">
        <SkBlock className="h-2.5 w-full" />
        <SkBlock className="h-2.5 w-[85%] mx-auto" />
        <SkBlock className="h-2.5 w-[70%] mx-auto" />
      </div>
    </motion.div>
  );
}

function FarewellPanel({ secondsLeft, onGoHome }) {
  return (
    <motion.div
      key="farewell"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="flex w-full max-w-[440px] flex-col items-center rounded-[16px] border border-[#e8e8e6] bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
    >
      <img src={clearformLogo} alt="Clearform" className="mb-6 h-8 w-auto opacity-90" />

      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-[#d6f0e0] text-[#1a4731]">
        <RiCheckboxCircleLine size={28} aria-hidden />
      </div>

      <h1 id="account-deleted-title" className="text-[22px] font-semibold tracking-[-0.4px] text-[#1a1a18]">
        Account deleted
      </h1>
      <p className="mt-2 text-[15px] leading-[24px] text-[#6b6b68]">
        Your Clearform account and data have been permanently removed.
      </p>
      <p className="mt-4 text-[15px] font-medium leading-[24px] text-[#1a1a18]">
        We&apos;re sad to see you leave.
      </p>
      <p className="mt-1 text-[13.5px] text-[#9e9e9a]">Thank you for being part of Clearform.</p>

      <p className="mt-8 text-[13px] text-[#9e9e9a]">
        Returning to <span className="font-medium text-[#1a4731]">clearform.in</span> in {secondsLeft}
        s…
      </p>

      <button
        type="button"
        onClick={onGoHome}
        className="mt-6 rounded-[10px] bg-[#1a1a18] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2d2d2a]"
      >
        Go to clearform.in
      </button>
    </motion.div>
  );
}

function ErrorPanel({ onRetry, onCancel }) {
  return (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="flex w-full max-w-[440px] flex-col items-center rounded-[16px] border border-[#fed7d7] bg-white px-8 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.08)]"
      role="alert"
    >
      <img src={clearformLogo} alt="Clearform" className="mb-6 h-8 w-auto opacity-90" />

      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-[#fff5f5] text-[#c53030]">
        <RiAlertLine size={28} aria-hidden />
      </div>

      <h1 className="text-[22px] font-semibold tracking-[-0.4px] text-[#1a1a18]">
        Couldn&apos;t delete your account
      </h1>
      <p className="mt-2 max-w-[320px] text-[15px] leading-[24px] text-[#6b6b68]">
        Something went wrong while removing your account. Your data is still intact — you can try again
        or return to your profile.
      </p>

      <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-[10px] border border-[#e0ddd7] bg-white px-5 text-[14px] font-medium text-[#888780] transition-colors hover:bg-[#fafaf8]"
        >
          Back to profile
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#1a1a18] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#2d2d2a]"
        >
          <RiRefreshLine size={16} aria-hidden />
          Try again
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Full-screen delete flow: loading → farewell (or error).
 * @param {'loading'|'farewell'|'error'|null} phase
 */
export default function AccountDeletionFlow({ phase, onRetry, onCancel, onFinished }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(REDIRECT_MS / 1000));

  useEffect(() => {
    if (phase !== 'farewell') return undefined;

    setSecondsLeft(Math.ceil(REDIRECT_MS / 1000));
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const redirect = window.setTimeout(() => {
      onFinished?.();
      window.location.assign(CLEARFORM_HOME);
    }, REDIRECT_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [phase, onFinished]);

  const handleGoHome = () => {
    onFinished?.();
    window.location.assign(CLEARFORM_HOME);
  };

  if (!phase) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-[#f5f4f0] px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      aria-modal="true"
    >
      <AnimatePresence mode="wait">
        {phase === 'loading' ? <DeletingPanel /> : null}
        {phase === 'farewell' ? (
          <FarewellPanel secondsLeft={secondsLeft} onGoHome={handleGoHome} />
        ) : null}
        {phase === 'error' ? <ErrorPanel onRetry={onRetry} onCancel={onCancel} /> : null}
      </AnimatePresence>
    </motion.div>
  );
}
