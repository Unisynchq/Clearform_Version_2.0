import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';

const TYPING_SETTLE_MS = 750;

/** Always-on coaching line — shown until live AI feedback replaces it. */
export const DEFAULT_QUALITY_COACHING =
  "Share a clear, specific answer — we'll help you improve it as you type.";

/** Builder preview on free tier — no API calls; respondents still get coaching on the live form. */
export const PREVIEW_QUALITY_UPGRADE_COACHING =
  'Respondents get AI coaching on your published form. Upgrade to Pilot to preview that feedback here before you publish.';

/** Shown when the AI coaching service is down. */
export const AI_SERVICE_STOPPED_COACHING =
  'AI coaching is temporarily unavailable. Please try again in a moment.';

export const AI_TRIAL_EXHAUSTED_COACHING =
  'Free AI coaching sessions are used up. Upgrade to Pilot for unlimited live feedback.';

const COACHING_NEUTRAL = {
  dot: '#c9c5bc',
  boxBg: '#faf9f7',
  boxBorder: '#ebe8e2',
  text: '#6b6966',
};

const LEVEL_STYLES = {
  red: {
    dot: '#c94040',
    boxBg: '#fdf0f0',
    boxBorder: '#f5d0d0',
    text: '#8b3a3a',
    dotInBox: '#c94040',
  },
  amber: {
    dot: '#d4850a',
    boxBg: '#fdf6ec',
    boxBorder: '#f5e0c0',
    text: '#7a5a20',
    dotInBox: '#d4850a',
  },
  green: {
    dot: '#3d9b4f',
    boxBg: '#f0fdf4',
    boxBorder: '#d1e7d7',
    text: '#2d5c3a',
    dotInBox: '#3d9b4f',
  },
};

const DOT_KEYS = [0, 1, 2];

function normalizeForCompare(text) {
  return String(text ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Never echo helperText verbatim — fall back to the default coaching line. */
export function resolveQualityDisplayMessage({ message, followUpQuestion, helperText }) {
  const followUp =
    typeof followUpQuestion === 'string' && followUpQuestion.trim()
      ? followUpQuestion.trim()
      : null;
  const raw = followUp ?? (typeof message === 'string' ? message.trim() : '');
  if (!raw) return DEFAULT_QUALITY_COACHING;
  const helper = normalizeForCompare(helperText);
  if (helper && normalizeForCompare(raw) === helper) return DEFAULT_QUALITY_COACHING;
  return raw;
}

function ResponseQualityWaveDots() {
  return (
    <div className="flex items-center gap-[6px] h-2" aria-label="Checking response quality" aria-live="polite">
      {DOT_KEYS.map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full shrink-0 bg-[#d4d2cc]"
          animate={{ y: [0, -5, 0], opacity: [0.55, 1, 0.55] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.14,
          }}
        />
      ))}
    </div>
  );
}

function QualityDot({ color, index = 0, pop = false }) {
  if (pop) {
    return (
      <motion.span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        initial={{ scale: 0, y: 4, opacity: 0 }}
        animate={{ scale: [0, 1.35, 1], y: [4, -6, 0], opacity: 1 }}
        transition={{
          duration: 0.55,
          delay: index * 0.1,
          ease: [0.22, 1.2, 0.36, 1],
        }}
      />
    );
  }

  return (
    <motion.span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, delay: index * 0.07, ease: 'easeOut' }}
    />
  );
}

export function ResponseQualityIndicator({ level, isLoading = false }) {
  if (isLoading) return <ResponseQualityWaveDots />;
  if (!level) return null;
  const color = LEVEL_STYLES[level]?.dot ?? '#e4e2dc';
  const labels = { red: 'Poor response quality', amber: 'Fair response quality', green: 'Great response quality' };

  if (level === 'red') {
    return (
      <div className="flex items-center h-2" aria-label={labels.red}>
        <QualityDot color={color} />
      </div>
    );
  }

  if (level === 'amber') {
    return (
      <div className="flex items-center gap-[6px] h-2" aria-label={labels.amber}>
        <QualityDot color={color} index={0} />
        <QualityDot color={color} index={1} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-[6px] h-2" aria-label={labels.green}>
      {DOT_KEYS.map((i) => (
        <QualityDot key={i} color={color} index={i} pop />
      ))}
    </div>
  );
}

export function ResponseQualityMessage({
  level,
  message,
  suggestions = [],
  followUpQuestion = null,
  helperText,
  onDismiss,
  dismissible = true,
  actionLabel = null,
  onAction = null,
}) {
  const displayMessage = resolveQualityDisplayMessage({ message, followUpQuestion, helperText });
  if (!displayMessage) return null;

  const s = level ? LEVEL_STYLES[level] || LEVEL_STYLES.amber : COACHING_NEUTRAL;
  const isGreat = level === 'green';
  const tips = isGreat
    ? []
    : Array.isArray(suggestions)
      ? suggestions.filter(Boolean).slice(0, 2)
      : [];
  const hasFollowUp =
    level &&
    typeof followUpQuestion === 'string' &&
    followUpQuestion.trim().length > 0 &&
    normalizeForCompare(followUpQuestion) !== normalizeForCompare(helperText);

  return (
    <motion.div
      initial={isGreat ? { opacity: 0, y: 10, scale: 0.92 } : { opacity: 0, y: 6 }}
      animate={isGreat ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={
        isGreat
          ? { duration: 0.38, ease: [0.22, 1.15, 0.36, 1] }
          : { duration: 0.22, ease: 'easeOut' }
      }
      className="relative flex gap-2 items-start px-3 py-3 rounded-[8px] border mt-2"
      style={{ backgroundColor: s.boxBg, borderColor: s.boxBorder }}
      role="status"
    >
      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: s.dotInBox ?? s.dot }} />
      <div className="flex-1 pr-5">
        {hasFollowUp ? (
          <p className="text-[13px] leading-[19px]" style={{ color: s.text, fontFamily: "'DM Sans', sans-serif" }}>
            {followUpQuestion}
          </p>
        ) : (
          <>
            <p className="text-[13px] leading-[19px]" style={{ color: s.text, fontFamily: "'DM Sans', sans-serif" }}>
              {displayMessage}
            </p>
            {tips.length > 0 ? (
              <ul
                className="mt-2 space-y-1 text-[12px] leading-[17px] list-disc pl-4"
                style={{ color: s.text, fontFamily: "'DM Sans', sans-serif" }}
              >
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
            {actionLabel && onAction ? (
              <button
                type="button"
                onClick={onAction}
                className="mt-2.5 inline-flex items-center rounded-[7px] border border-[#1a1a18] px-3 py-1 text-[12px] font-medium text-[#1a1a18] transition-colors hover:bg-[#1a1a18] hover:text-white"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {actionLabel}
              </button>
            ) : null}
          </>
        )}
      </div>
      {dismissible && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss feedback"
          className="absolute top-2 right-2 p-0 border-0 bg-transparent cursor-pointer text-[#b4b2ac] hover:text-[#666]"
        >
          <RiCloseLine size={14} />
        </button>
      ) : null}
    </motion.div>
  );
}

function useResponseQualityDisplay(evaluation, charCount, isLoading) {
  const [dismissed, setDismissed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [settledEvaluation, setSettledEvaluation] = useState(null);

  useEffect(() => {
    if (charCount === 0) {
      setIsTyping(false);
      setSettledEvaluation(null);
      return;
    }

    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [charCount]);

  useEffect(() => {
    if (charCount === 0) {
      setSettledEvaluation(null);
      return;
    }
    if (!isLoading) {
      setSettledEvaluation(evaluation);
    }
  }, [charCount, evaluation, isLoading]);

  useEffect(() => {
    setDismissed(false);
  }, [settledEvaluation?.level, settledEvaluation?.message, settledEvaluation?.followUpQuestion]);

  const showLiveFeedback =
    settledEvaluation?.message && !dismissed && !isLoading;

  return {
    dismissed,
    setDismissed,
    isTyping,
    settledEvaluation,
    showLiveFeedback,
  };
}

function renderIndicator({ isTyping, settledEvaluation, isLoading, answerLabel, previewUpgradeHint }) {
  if (previewUpgradeHint) {
    return (
      <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {answerLabel}
      </p>
    );
  }
  if (isTyping || isLoading) return <ResponseQualityWaveDots />;
  if (settledEvaluation?.level) return <ResponseQualityIndicator level={settledEvaluation.level} />;
  return (
    <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {answerLabel}
    </p>
  );
}

/** Indicator row + coaching box; wave while typing/loading, quality after idle. */
export default function ResponseQualityFeedback({
  evaluation,
  isLoading = false,
  serviceError = null,
  charCount,
  maxChars,
  answerLabel = 'Long answer',
  embedded = false,
  coachingEnabled = false,
  previewUpgradeHint = false,
  onUpgradeClick = null,
  helperText = '',
  children = null,
}) {
  const { setDismissed, isTyping, settledEvaluation, showLiveFeedback } = useResponseQualityDisplay(
    evaluation,
    charCount,
    isLoading,
  );

  const charCountLabel = (
    <p className="text-[#bbb] text-[11px] tabular-nums" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {charCount} / {maxChars}
    </p>
  );

  const indicator = renderIndicator({
    isTyping,
    settledEvaluation,
    isLoading,
    answerLabel,
    previewUpgradeHint,
  });

  const coachingBox = previewUpgradeHint ? (
    <ResponseQualityMessage
      key="preview-upgrade"
      level={null}
      message={PREVIEW_QUALITY_UPGRADE_COACHING}
      helperText={helperText}
      dismissible={false}
      actionLabel={onUpgradeClick ? 'Upgrade to Pilot' : null}
      onAction={onUpgradeClick}
    />
  ) : serviceError ? (
    <ResponseQualityMessage
      key={`service-error-${serviceError.code}`}
      level={null}
      message={
        serviceError.upgradeRequired
          ? serviceError.message || AI_TRIAL_EXHAUSTED_COACHING
          : serviceError.message || AI_SERVICE_STOPPED_COACHING
      }
      helperText={helperText}
      dismissible={false}
      actionLabel={serviceError.upgradeRequired && onUpgradeClick ? 'Upgrade to Pilot' : null}
      onAction={serviceError.upgradeRequired ? onUpgradeClick : null}
    />
  ) : coachingEnabled ? (
    <AnimatePresence mode="wait">
      {showLiveFeedback ? (
        <ResponseQualityMessage
          key={`live-${settledEvaluation.level}-${settledEvaluation.followUpQuestion ?? settledEvaluation.message}`}
          level={settledEvaluation.level}
          message={settledEvaluation.message}
          suggestions={settledEvaluation.suggestions}
          followUpQuestion={settledEvaluation.followUpQuestion ?? null}
          helperText={helperText}
          onDismiss={() => setDismissed(true)}
        />
      ) : (
        <ResponseQualityMessage
          key="coaching-default"
          level={null}
          message={isLoading ? 'Taking a quick look at your answer…' : DEFAULT_QUALITY_COACHING}
          helperText={helperText}
          dismissible={false}
        />
      )}
    </AnimatePresence>
  ) : (
    <AnimatePresence mode="wait">
      {showLiveFeedback && (
        <ResponseQualityMessage
          key={`${settledEvaluation.level}-${settledEvaluation.message}`}
          level={settledEvaluation.level}
          message={settledEvaluation.message}
          suggestions={settledEvaluation.suggestions}
          followUpQuestion={settledEvaluation.followUpQuestion ?? null}
          helperText={helperText}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </AnimatePresence>
  );

  if (embedded && children) {
    return (
      <>
        <div className="relative w-full">
          {children}
          {charCount > 0 || coachingEnabled ? (
            <>
              <div
                className="absolute bottom-[10px] left-[12px] z-10 pointer-events-none flex items-center"
                aria-live="polite"
              >
                {charCount > 0 ? charCountLabel : null}
              </div>
              <div
                className="absolute bottom-[10px] right-[12px] z-10 pointer-events-none flex items-center"
                aria-live="polite"
              >
                {charCount > 0 ? indicator : null}
              </div>
            </>
          ) : null}
        </div>
        {charCount === 0 && !coachingEnabled ? (
          <div className="flex justify-between items-center pt-[11px] pb-[9px]">
            <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {answerLabel}
            </p>
            {charCountLabel}
          </div>
        ) : null}
        {coachingBox}
      </>
    );
  }

  if (charCount === 0 && !coachingEnabled) {
    return (
      <div className="flex justify-between items-center pt-[11px] pb-[9px]">
        <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {answerLabel}
        </p>
        {charCountLabel}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center pt-[11px] pb-[9px]">
        {charCount > 0 ? indicator : <span />}
        {charCountLabel}
      </div>
      {coachingBox}
    </>
  );
}
