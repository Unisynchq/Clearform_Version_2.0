import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RiCloseLine } from 'react-icons/ri';

const TYPING_SETTLE_MS = 750;

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

export function ResponseQualityIndicator({ level }) {
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

export function ResponseQualityMessage({ level, message, onDismiss }) {
  if (!level || !message) return null;
  const s = LEVEL_STYLES[level] || LEVEL_STYLES.amber;

  const isGreat = level === 'green';

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
      <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: s.dotInBox }} />
      <p className="flex-1 text-[13px] leading-[19px] pr-5" style={{ color: s.text, fontFamily: "'DM Sans', sans-serif" }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss feedback"
        className="absolute top-2 right-2 p-0 border-0 bg-transparent cursor-pointer text-[#b4b2ac] hover:text-[#666]"
      >
        <RiCloseLine size={14} />
      </button>
    </motion.div>
  );
}

function useResponseQualityDisplay(evaluation, charCount) {
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
      setSettledEvaluation(evaluation);
    }, TYPING_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [charCount, evaluation]);

  useEffect(() => {
    setDismissed(false);
  }, [settledEvaluation?.level, settledEvaluation?.message]);

  const showSettled = !isTyping && settledEvaluation;
  const showMessage = showSettled && settledEvaluation.message && !dismissed;

  return {
    dismissed,
    setDismissed,
    isTyping,
    settledEvaluation,
    showSettled,
    showMessage,
  };
}

function renderIndicator({ isTyping, settledEvaluation, answerLabel }) {
  if (isTyping) return <ResponseQualityWaveDots />;
  if (settledEvaluation) return <ResponseQualityIndicator level={settledEvaluation.level} />;
  return (
    <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {answerLabel}
    </p>
  );
}

/** Indicator row + optional dismissible message; wave while typing, quality after idle. */
export default function ResponseQualityFeedback({
  evaluation,
  charCount,
  maxChars,
  answerLabel = 'Long answer',
  embedded = false,
  children = null,
}) {
  const { setDismissed, isTyping, settledEvaluation, showMessage } = useResponseQualityDisplay(
    evaluation,
    charCount,
  );

  const charCountLabel = (
    <p className="text-[#bbb] text-[11px] tabular-nums" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {charCount} / {maxChars}
    </p>
  );

  const indicator = renderIndicator({ isTyping, settledEvaluation, answerLabel });

  if (embedded && children) {
    return (
      <>
        <div className="relative w-full">
          {children}
          {charCount > 0 ? (
            <>
              <div
                className="absolute bottom-[10px] left-[12px] z-10 pointer-events-none flex items-center"
                aria-live="polite"
              >
                {charCountLabel}
              </div>
              <div
                className="absolute bottom-[10px] right-[12px] z-10 pointer-events-none flex items-center"
                aria-live="polite"
              >
                {indicator}
              </div>
            </>
          ) : null}
        </div>
        {charCount === 0 ? (
          <div className="flex justify-between items-center pt-[11px] pb-[9px]">
            <p className="text-[#bbb] text-[11px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {answerLabel}
            </p>
            {charCountLabel}
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          {showMessage && (
            <ResponseQualityMessage
              key={`${settledEvaluation.level}-${settledEvaluation.message}`}
              level={settledEvaluation.level}
              message={settledEvaluation.message}
              onDismiss={() => setDismissed(true)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (charCount === 0) {
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
        {indicator}
        {charCountLabel}
      </div>
      <AnimatePresence mode="wait">
        {showMessage && (
          <ResponseQualityMessage
            key={`${settledEvaluation.level}-${settledEvaluation.message}`}
            level={settledEvaluation.level}
            message={settledEvaluation.message}
            onDismiss={() => setDismissed(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
