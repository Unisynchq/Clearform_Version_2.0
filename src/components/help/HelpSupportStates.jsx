import { motion } from 'motion/react';
import { RiAlertLine, RiQuestionLine, RiRefreshLine } from 'react-icons/ri';

export function HelpSupportErrorState({ onRetry, isRetrying }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="mx-auto flex w-full max-w-[920px] flex-col items-center px-8 pb-12 pt-16 text-center"
      role="alert"
    >
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-[#fff5f5] text-[#c53030]">
        <RiAlertLine size={28} aria-hidden />
      </div>
      <h2 className="text-[18px] font-semibold tracking-[-0.36px] text-[#111110]">
        Couldn&apos;t load Help &amp; Support
      </h2>
      <p className="mt-2 max-w-[360px] text-[13px] leading-[20px] text-[#777]">
        Check your connection and try again. If the problem continues, email us at{' '}
        <a href="mailto:hello@clearform.in" className="font-medium text-[#111] underline underline-offset-2">
          hello@clearform.in
        </a>
        .
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-[#1a1a18] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d2d2a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRetrying ? (
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <RiRefreshLine size={16} aria-hidden />
        )}
        {isRetrying ? 'Retrying…' : 'Try again'}
      </button>
    </motion.div>
  );
}

export function HelpSupportEmptyFaq() {
  return (
    <div className="rounded-[10px] border border-dashed border-[#e4e3df] bg-[#fafaf8] px-[18px] py-10 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#f0efeb] text-[#999]">
        <RiQuestionLine size={20} aria-hidden />
      </div>
      <p className="text-[13px] font-medium text-[#111]">No FAQs available right now</p>
      <p className="mt-1 text-[12px] leading-[18px] text-[#777]">
        We&apos;re updating our help articles. Use the contact options below in the meantime.
      </p>
    </div>
  );
}
