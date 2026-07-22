import { motion, AnimatePresence } from 'motion/react';
import { RiAlertLine } from 'react-icons/ri';

/* ── "Can't find what you need?" CTA banner — node 1139:45278 ──
   Single component with four mutually-exclusive states:

   - 'default' (E1): white bg, "Create Custom Form" CTA
   - 'loading' (E3): in-flight create, disabled button + spinner
   - 'error'   (E4): red surface, error subtext + "Try again"
   - 'limit'   (E5): amber surface, plan-limit warning + "Upgrade"

   The container chrome (border, radius, padding) stays the same across
   states; only the surface color, copy, and trailing button change. We
   animate only the inner content so the banner doesn't visually "jump"
   when transitioning. */

const SURFACES = {
  default: { bg: '#f7f6f3', border: '#e8e7e2' },
  loading: { bg: '#f7f6f3', border: '#a0a0a0' },
  error:   { bg: '#fef2f2', border: '#fecaca' },
  limit:   { bg: '#fffbeb', border: '#fde68a' },
};

const Spinner = () => (
  <motion.span
    aria-hidden
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    className="w-[12px] h-[12px] border-[2px] border-[#a8a6a0] border-r-transparent rounded-full shrink-0"
  />
);

/* ── State bodies ─────────────────────────────────────────────────────────
   Each renders the title/subtitle block + trailing button. Layout is shared
   so the banner stays vertically stable. The error state is a special case
   that adds an "Error code" line below the main row. */

const DefaultBody = ({ onCreate }) => (
  <div className="flex items-center justify-between gap-4 w-full">
    <div className="flex flex-col gap-1 min-w-0">
      <p
        className="text-[16px] font-bold text-[#111110] leading-[24px] truncate"
        style={{ fontFamily: 'Arimo, sans-serif' }}
      >
        Can&apos;t find what you need?
      </p>
      <p className="text-[14px] font-normal text-[#656565] leading-[21px] truncate">
        Start from scratch or request a custom template
      </p>
    </div>
    <button
      type="button"
      onClick={onCreate}
      className="shrink-0 h-[43.5px] inline-flex items-center justify-center px-6 rounded-[7px] bg-[#111110] border border-[#111110] text-white text-[13px] font-medium leading-[19.5px] hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap"
    >
      Create Custom Form
    </button>
  </div>
);

const LoadingBody = () => (
  <div className="flex items-center justify-between gap-4 w-full">
    <div className="flex flex-col gap-[3px] min-w-0">
      <p className="text-[13px] font-semibold text-[#1a1a1c] leading-[19.5px] truncate">
        Creating your form…
      </p>
      <p className="text-[12px] font-normal text-[#6b6966] leading-[18px] truncate">
        Setting up a blank form in your workspace
      </p>
    </div>
    <button
      type="button"
      disabled
      aria-busy="true"
      className="shrink-0 h-[36px] inline-flex items-center justify-center gap-[8px] px-[17px] rounded-[8px] bg-[#e5e3dc] border border-[#e5e3dc] text-[#a8a6a0] text-[13px] font-medium leading-none cursor-not-allowed whitespace-nowrap"
    >
      <Spinner />
      Creating…
    </button>
  </div>
);

const ErrorBody = ({ onRetry, errorCode }) => (
  <div className="flex flex-col w-full">
    <div className="flex items-center justify-between gap-4 w-full">
      <div className="flex flex-col gap-[3px] min-w-0">
        <p className="text-[13px] font-semibold text-[#dc2626] leading-[19.5px] truncate">
          Failed to create form
        </p>
        <p className="text-[12px] font-normal text-[#dc2626]/80 leading-[18px] truncate">
          Something went wrong. Please try again.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 h-[36px] inline-flex items-center justify-center px-[17px] rounded-[8px] bg-[#dc2626] border border-[#dc2626] text-white text-[13px] font-medium leading-none hover:bg-[#b91c1c] transition-colors cursor-pointer whitespace-nowrap"
      >
        Try again
      </button>
    </div>
    {errorCode && (
      <p className="text-[11px] font-normal text-[#dc2626]/70 leading-[16.5px] mt-[8px] truncate">
        Error code: {errorCode}
      </p>
    )}
  </div>
);

const LimitBody = ({ onUpgrade, planLimit }) => (
  <div className="flex items-center justify-between gap-4 w-full">
    <div className="flex flex-col gap-[3px] min-w-0">
      <div className="flex items-center gap-[6px]">
        <RiAlertLine size={14} className="text-[#dc2626] shrink-0" />
        <p className="text-[13px] font-semibold text-[#dc2626] leading-[19.5px] truncate">
          You&apos;ve reached your plan limit ({planLimit} forms)
        </p>
      </div>
      <p className="text-[12px] font-normal text-[#6b6966] leading-[18px] truncate pl-[20px]">
        Upgrade to Pro to create unlimited forms
      </p>
    </div>
    <button
      type="button"
      onClick={onUpgrade}
      className="shrink-0 h-[36px] inline-flex items-center justify-center px-[17px] rounded-[8px] bg-[#1a1a1c] border border-[#1a1a1c] text-white text-[13px] font-medium leading-none hover:bg-[#2c2c2e] transition-colors cursor-pointer whitespace-nowrap"
    >
      Upgrade
    </button>
  </div>
);

const CreateCustomFormBanner = ({
  state = 'default',
  onCreate,
  onRetry,
  onUpgrade,
  errorCode = '503 — Service temporarily unavailable',
  planLimit = 10,
  className = '',
}) => {
  const surface = SURFACES[state] || SURFACES.default;

  return (
    <motion.div
      initial={false}
      animate={{
        backgroundColor: surface.bg,
        borderColor:     surface.border,
      }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className={`border rounded-[12px] px-[25px] py-[25px] w-full ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
        >
          {state === 'default' && <DefaultBody onCreate={onCreate} />}
          {state === 'loading' && <LoadingBody />}
          {state === 'error'   && <ErrorBody onRetry={onRetry} errorCode={errorCode} />}
          {state === 'limit'   && <LimitBody onUpgrade={onUpgrade} planLimit={planLimit} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default CreateCustomFormBanner;
