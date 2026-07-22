import { useEffect, useState } from 'react';
import { RiCheckLine } from 'react-icons/ri';

const STEPS = [
  { id: 'redirect', label: 'Redirected to Google Sheets' },
  { id: 'access', label: 'Access approved' },
  { id: 'verify', label: 'Verifying connection' },
];

/** When each step completes: redirect → access → verify → finish */
const STEP_COMPLETE_MS = [600, 1200, 2200];
const FINISH_DELAY_MS = 400;

const CompletedIcon = () => (
  <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border border-[#c6f0d8] bg-[#f0efff] p-px">
    <RiCheckLine size={10} className="text-[#2e7d52]" aria-hidden />
  </span>
);

const ActiveIcon = () => (
  <span
    className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] bg-[#1a1a18]"
    aria-hidden
  >
    <span className="size-[6px] rounded-[3px] bg-white" />
  </span>
);

const PendingIcon = () => (
  <span
    className="flex size-[18px] shrink-0 items-center justify-center rounded-[9px] border border-[#e8e8e6] bg-[#f7f7f6]"
    aria-hidden
  />
);

const GoogleSheetsConnectingView = ({ onComplete, onFailure, simulateFailure = false }) => {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const timers = STEP_COMPLETE_MS.map((delay, index) =>
      window.setTimeout(() => setCompletedCount(index + 1), delay)
    );

    const finishTimer = window.setTimeout(() => {
      if (simulateFailure) onFailure();
      else onComplete();
    }, STEP_COMPLETE_MS[2] + FINISH_DELAY_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [onComplete, onFailure, simulateFailure]);

  return (
    <div className="flex flex-col gap-1.5 px-8 py-10">
      <div className="flex justify-center">
        <div
          className="size-12 animate-spin rounded-full border-[3px] border-[#e8e8e6] border-t-[#1a1a18]"
          role="status"
          aria-label="Connecting"
        />
      </div>

      <h2 className="pt-3.5 text-center text-[15px] font-semibold text-[#1a1a18]">
        Connecting to Google Sheets
      </h2>

      <p className="text-center text-[13px] leading-[19.5px] text-[#6b6b68]">
        Hang tight while we securely link your
        <br />
        workspace.
      </p>

      <ul className="flex w-full flex-col gap-2.5 pt-3.5" aria-label="Connection progress">
        {STEPS.map((step, index) => {
          const isComplete = completedCount > index;
          const isActive = !isComplete && completedCount === index;

          return (
            <li key={step.id} className="flex items-center gap-2.5">
              {isComplete ? (
                <CompletedIcon />
              ) : isActive ? (
                <ActiveIcon />
              ) : (
                <PendingIcon />
              )}
              <span
                className={`text-[13px] ${
                  isComplete
                    ? 'text-[#2e7d52]'
                    : isActive
                      ? 'font-medium text-[#1a1a18]'
                      : 'text-[#9e9e9a]'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default GoogleSheetsConnectingView;
