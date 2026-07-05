import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiRobot2Line,
  RiInformationLine,
  RiArrowDownSLine,
  RiSparklingLine,
  RiPencilLine,
} from 'react-icons/ri';
import { useBillingStatus } from '@/features/billing/utils/useBillingStatus';
import { improveResponseQualityInstructionsApi } from '@/api/services/responseQualityService';
import { isApiConfigured } from '@/config/env';
import { useToast } from '@/hooks/useToast';
import { buildDefaultOwnerPromptForQuestion } from '@/features/forms/utils/defaultOwnerQualityPrompt';

const MAX_CRITERIA = 2;
const FONT = { fontFamily: "'DM Sans', sans-serif" };
const SAVE_TRANSITION_MS = 450;
const AI_IMPROVE_DELAY_MIN_MS = 1500;
const AI_IMPROVE_TIMEOUT_MS = 15000;
const AI_IMPROVE_DELAY_MAX_MS = 2000;
const PREFERENCE_TRANSITION_MS = 250;
const PREFERENCE_TEXTAREA_MIN_H = '132px';

/** Max length for the owner's free-text AI guidance (keeps prompts fast). */
export const AI_GUIDANCE_MAX_LENGTH = 600;

const CRITERIA_DEFAULTS = {
  length: { enabled: false, expanded: false, minWords: 10 },
  specificity: {
    enabled: false,
    expanded: false,
    sensitivity: 'Medium',
    vagueWords: 'good, nice, okay, fine, great, bad',
  },
  relevance: { enabled: false, expanded: false, keywords: '', matchThreshold: 2 },
  completeness: { enabled: false, expanded: false, detectTrailing: true, requiredSentences: 1 },
};

export const DEFAULT_RESPONSE_QUALITY_OPTIONS = {
  ...CRITERIA_DEFAULTS,
  customInstructions: '',
};

/** Merge saved options and force every criterion row collapsed in the UI. */
export function normalizeResponseQualityOptions(options) {
  const next = {};
  for (const id of Object.keys(CRITERIA_DEFAULTS)) {
    next[id] = {
      ...CRITERIA_DEFAULTS[id],
      ...(options?.[id] || {}),
      expanded: false,
    };
  }
  next.customInstructions =
    typeof options?.customInstructions === 'string'
      ? options.customInstructions.slice(0, AI_GUIDANCE_MAX_LENGTH)
      : '';
  return next;
}

const EXPERIENCE_FEEDBACK_Q =
  /\b(filling this form|using this form|this form|form builder|clearform|this survey|how is your|how was your|your experience|experien|feedback|improve)\b/i;

/** Client-side polish until a dedicated improve API exists. */
export function improvePreferenceInstructions(raw, { questionText = '' } = {}) {
  let text = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!text) return '';

  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!/[.!?]$/.test(text)) text += '.';

  const hasActionVerbs = /\b(focus|prioritize|expect|want|ensure|look for|score|rate|flag|nudge|emphasize|prefer|require)\b/i.test(
    text,
  );

  if (!hasActionVerbs) {
    const questionHint = questionText.trim() ? ' to this question' : '';
    text = `I want responses${questionHint} that ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  }

  if (text.split(/\s+/).length < 12) {
    text += ' Flag vague or off-topic answers and nudge respondents toward concrete, relevant detail.';
  }

  return text.slice(0, AI_GUIDANCE_MAX_LENGTH);
}

function randomImproveDelayMs() {
  return (
    AI_IMPROVE_DELAY_MIN_MS +
    Math.floor(Math.random() * (AI_IMPROVE_DELAY_MAX_MS - AI_IMPROVE_DELAY_MIN_MS + 1))
  );
}

/** True when question text looks like experience / form feedback (mirrors backend heuristics). */
export function isExperienceFeedbackQuestion(questionText) {
  const q = String(questionText ?? '')
    .toLowerCase()
    .replace(/\bexperiance\b/g, 'experience');
  if (!q.trim()) return false;
  return EXPERIENCE_FEEDBACK_Q.test(q);
}

const CRITERIA_META = [
  {
    id: 'length',
    title: 'Length',
    description: 'Too-short answers',
    hint: 'Nudges more detail while typing; flags short replies red.',
  },
  {
    id: 'specificity',
    title: 'Specificity',
    description: 'Vague or generic wording',
    hint: 'Calls out empty words like “good”; flags vague replies amber.',
  },
  {
    id: 'relevance',
    title: 'Relevance',
    description: 'Off-topic answers',
    hint: 'Keeps answers on your question; flags drift red.',
  },
  {
    id: 'completeness',
    title: 'Completeness',
    description: 'Partial or trailing answers',
    hint: 'Catches answers that stop mid-thought; flags incomplete amber.',
  },
];

function criterionEntries(options) {
  return Object.keys(CRITERIA_DEFAULTS).map((id) => [id, options?.[id] ?? CRITERIA_DEFAULTS[id]]);
}

function MainToggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="Enable response quality scoring"
      onClick={() => onChange(!checked)}
      className={`relative w-[30px] h-[17px] rounded-[99px] transition-colors cursor-pointer shrink-0 appearance-none border-0 p-0 ${
        checked ? 'bg-[#1a1a18]' : 'bg-[#e4e2dc]'
      }`}
    >
      <span
        className={`absolute top-[3px] w-[11px] h-[11px] bg-white rounded-[5.5px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.18)] transition-all duration-200 ${
          checked ? 'left-[16px]' : 'left-[3px]'
        }`}
      />
    </button>
  );
}

function CriterionToggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative shrink-0 w-[36px] h-[20px] rounded-[20px] transition-colors border-0 p-0 flex items-center ${
        checked ? 'bg-[#1a1a18] justify-end pr-[3px]' : 'bg-[#d0cec8] justify-start pl-[3px]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className="w-[14px] h-[14px] bg-white rounded-[7px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] shrink-0" />
    </button>
  );
}

function CriterionHint({ children }) {
  return (
    <p className="text-[11.25px] font-medium leading-snug text-[#6f6b63]" style={FONT}>
      {children}
    </p>
  );
}

function FieldLabel({ children, optional }) {
  return (
    <div className="flex items-end gap-1">
      <span className="text-[11px] font-medium tracking-[0.05px] text-[#5f5a52]" style={FONT}>
        {children}
      </span>
      {optional && (
        <span className="text-[10px] text-[#969189]" style={FONT}>
          optional
        </span>
      )}
    </div>
  );
}

function SegmentedControl({ options, value, onChange, disabled = false }) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-[6px] border border-[#e4e2dc] transition-opacity ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {options.map((opt, i) => (
        <button
          key={String(opt.value)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={`flex-1 min-w-0 px-2 py-[7px] text-[11px] font-medium transition-colors ${
            value === opt.value ? 'bg-[#1a1a18] text-white' : 'bg-white text-[#8a8880] hover:text-[#555]'
          } ${
            disabled ? 'cursor-not-allowed' : ''
          } ${i < options.length - 1 ? 'border-r border-[#e4e2dc]' : ''}`}
          style={FONT}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberWithUnit({ value, onChange, unit, min = 0, disabled = false }) {
  return (
    <div
      className={`flex w-full overflow-hidden rounded-[6px] border border-[#e4e2dc] transition-opacity ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <input
        type="number"
        min={min}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`flex-1 min-w-0 bg-white px-2 py-[7px] text-center text-[14px] font-medium text-[#1a1a18] outline-none ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
        style={FONT}
      />
      <span
        className="shrink-0 border-l border-[#e4e2dc] bg-white px-2.5 py-[7px] text-[12px] text-[#8a8880]"
        style={FONT}
      >
        {unit}
      </span>
    </div>
  );
}

function PreferenceFrame({ title, children, footer }) {
  return (
    <div className="mx-4 px-0 pt-1 pb-2">
      <p
        className="mb-4 text-center text-[13.5px] font-semibold tracking-[-0.01em] text-[#111827]"
        style={FONT}
      >
        {title}
      </p>
      {children}
      <div className="mt-6 flex min-h-7 items-center justify-end gap-2.5">{footer}</div>
    </div>
  );
}

function AnimatedEllipsis() {
  return (
    <span className="inline-flex w-[12px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}

function InlineImproveWithAiAction({ disabled, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: PREFERENCE_TRANSITION_MS / 1000, ease: 'easeInOut' }}
      className="pointer-events-auto inline-flex cursor-pointer items-center gap-1 rounded-[4px] border-0 bg-transparent px-1 py-0.5 text-[11.5px] font-medium text-[#6f6b63] transition-colors hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
      style={FONT}
    >
      <RiSparklingLine size={12} className="shrink-0 text-[#8a8880]" aria-hidden />
      Improve with AI
    </motion.button>
  );
}

function InlineImprovingWithAiStatus() {
  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label="Improving with AI"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: PREFERENCE_TRANSITION_MS / 1000, ease: 'easeInOut' }}
      className="inline-flex cursor-default items-center gap-1 px-1 py-0.5 text-[11.5px] font-medium text-[#6f6b63]"
      style={FONT}
    >
      <motion.span
        animate={{ opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-flex shrink-0"
      >
        <RiSparklingLine size={12} aria-hidden />
      </motion.span>
      Improving with AI
      <AnimatedEllipsis />
    </motion.div>
  );
}

function PreferenceTextareaField({
  value,
  onChange,
  onImproveClick,
  improveState,
  saveState,
}) {
  const isProcessing = improveState === 'improving';
  const showInlineImprove = improveState === 'idle';

  return (
    <div className="relative w-full">
      <textarea
        value={value}
        onChange={onChange}
        placeholder="e.g. I want to focus more on specificity and relevance of the responses to this question."
        rows={6}
        disabled={isProcessing || saveState === 'saving'}
        aria-busy={isProcessing}
        className={`w-full resize-none rounded-[10px] border border-[rgba(140,138,132,0.24)] bg-[#fcfbf8] px-4 pb-9 pt-3 text-[12px] leading-[17px] text-[#000000] outline-none transition-all duration-[250ms] ease-in-out placeholder:text-[rgba(0,0,0,0.38)] disabled:cursor-default ${
          isProcessing ? 'pointer-events-none blur-[2px] opacity-[0.95]' : 'blur-0 opacity-100'
        }`}
        style={{ ...FONT, minHeight: PREFERENCE_TEXTAREA_MIN_H, height: PREFERENCE_TEXTAREA_MIN_H }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end px-3 pb-2.5">
        <AnimatePresence initial={false}>
          {showInlineImprove ? (
            <InlineImproveWithAiAction
              key="improve"
              disabled={saveState === 'saving'}
              onClick={onImproveClick}
            />
          ) : null}
          {isProcessing ? <InlineImprovingWithAiStatus key="improving" /> : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PreferenceButton({
  children,
  variant = 'primary',
  disabled = false,
  icon = null,
  onClick,
  className = '',
}) {
  const baseClassName =
    'inline-flex h-7 items-center justify-center gap-1 rounded-[6px] px-3 text-[12.5px] font-medium transition-colors';
  const toneClassName =
    variant === 'primary'
      ? 'bg-[#1a1a18] text-white hover:bg-[#2c2c2c] disabled:bg-[#6f6f6c] disabled:cursor-not-allowed'
      : variant === 'danger'
        ? 'border border-[rgba(214,48,48,0.58)] bg-white text-[#2c2a27] hover:bg-[#fff7f7]'
        : 'border border-[#9e9a93] bg-white text-[#2c2a27] hover:bg-[#faf9f7]';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClassName} ${toneClassName} ${className}`.trim()}
      style={FONT}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function CriterionOptions({ id, options, onUpdate, disabled = false }) {
  switch (id) {
    case 'length':
      return (
        <div className="flex flex-col gap-[6px]">
          <FieldLabel>Minimum word count</FieldLabel>
          <NumberWithUnit
            value={options.minWords}
            onChange={(v) => onUpdate({ minWords: v })}
            unit="words"
            min={1}
            disabled={disabled}
          />
        </div>
      );
    case 'specificity':
      return (
        <>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel>Sensitivity</FieldLabel>
            <SegmentedControl
              options={[
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              value={options.sensitivity}
              onChange={(v) => onUpdate({ sensitivity: v })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel optional>Vague words to watch</FieldLabel>
            <textarea
              disabled={disabled}
              value={options.vagueWords}
              onChange={(e) => onUpdate({ vagueWords: e.target.value })}
              rows={2}
              className={`w-full resize-none rounded-[8px] border border-[#e4e2dc] bg-white px-3 py-2 text-[13px] leading-[19.5px] text-[#1a1a18] outline-none focus:border-[#999] ${
                disabled ? 'cursor-not-allowed opacity-60' : ''
              }`}
              style={FONT}
            />
            <span className="text-[11px] text-[#b4b2ac]" style={FONT}>
              Comma-separated. Blank = defaults.
            </span>
          </div>
        </>
      );
    case 'relevance':
      return (
        <>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel optional>Expected topic keywords</FieldLabel>
            <textarea
              disabled={disabled}
              value={options.keywords}
              onChange={(e) => onUpdate({ keywords: e.target.value })}
              placeholder="experience, product, feedback…"
              rows={2}
              className={`w-full resize-none rounded-[8px] border border-[#e4e2dc] bg-white px-3 py-2 text-[12.5px] leading-[18.75px] text-[#1a1a18] placeholder:text-[#b4b2ac] outline-none focus:border-[#999] ${
                disabled ? 'cursor-not-allowed opacity-60' : ''
              }`}
              style={FONT}
            />
            <span className="text-[11px] text-[#b4b2ac]" style={FONT}>
              Comma-separated. Blank = skip matching.
            </span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel>Match threshold</FieldLabel>
            <NumberWithUnit
              value={options.matchThreshold}
              onChange={(v) => onUpdate({ matchThreshold: v })}
              unit="keywords"
              min={1}
            disabled={disabled}
            />
          </div>
        </>
      );
    case 'completeness':
      return (
        <>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel>Detect trailing sentences</FieldLabel>
            <SegmentedControl
              options={[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ]}
              value={options.detectTrailing}
              onChange={(v) => onUpdate({ detectTrailing: v })}
              disabled={disabled}
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <FieldLabel>Required sentence count</FieldLabel>
            <NumberWithUnit
              value={options.requiredSentences}
              onChange={(v) => onUpdate({ requiredSentences: v })}
              unit="sentences"
              min={1}
              disabled={disabled}
            />
          </div>
        </>
      );
    default:
      return null;
  }
}

function CriterionCard({ meta, options, atLimit, onToggleEnabled, onToggleExpanded, onUpdate }) {
  const { id, title, description, hint } = meta;
  const isOn = options.enabled;
  const isExpanded = options.expanded;

  return (
    <div className="w-full overflow-hidden rounded-[14px] bg-[#f1eee7]">
      <div className="flex items-center gap-[10px] px-4 py-[14px]">
        <CriterionToggle
          checked={isOn}
          disabled={atLimit && !isOn}
          onChange={onToggleEnabled}
        />
        <div className="flex-1 min-w-0">
          <p
            className={`text-[13.5px] font-semibold leading-[16.2px] ${
              isOn ? 'text-[#111827]' : 'text-[#7f7a71]'
            }`}
            style={FONT}
          >
            {title}
          </p>
          <p
            className={`text-[11.5px] leading-[16.1px] ${
              isOn ? 'text-[#69645c]' : 'text-[#aaa59b]'
            }`}
            style={FONT}
          >
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} options`}
          className="shrink-0 rounded-full border-0 bg-transparent p-1 cursor-pointer hover:bg-[#f7f6f4]"
        >
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <RiArrowDownSLine size={16} className="text-[#8a8880]" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`border-t border-[rgba(0,0,0,0.05)] px-4 pt-[13px] pb-4 transition-colors ${
                isOn ? 'bg-[#f7f4ee]' : 'bg-[#ebe7de]'
              }`}
              aria-disabled={!isOn}
            >
              <fieldset
                disabled={!isOn}
                className={`m-0 flex min-w-0 flex-col gap-3 border-0 p-0 transition-opacity ${
                  isOn ? 'opacity-100' : 'pointer-events-none opacity-45'
                }`}
              >
                <CriterionHint>{hint}</CriterionHint>
                <CriterionOptions id={id} options={options} onUpdate={onUpdate} disabled={!isOn} />
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ResponseQualityScoringCard({
  enabled,
  onEnabledChange,
  options,
  onOptionsChange,
  onSave,
  questionText = '',
  helperText = '',
  formId = null,
  fieldId = 'short-text',
  screenId = null,
}) {
  const [draftInstructions, setDraftInstructions] = useState(options.customInstructions ?? '');
  const [isEditingPreference, setIsEditingPreference] = useState(!(options.customInstructions ?? '').trim());
  const [saveState, setSaveState] = useState('idle');
  const [improveState, setImproveState] = useState('idle');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const syncingPreferenceRef = useRef(false);
  const improveRunRef = useRef(0);
  const activeCount = criterionEntries(options).filter(([, criterion]) => criterion.enabled).length;
  const showExperienceHint = isExperienceFeedbackQuestion(questionText);
  const brevityHelper = /\b(as much or as little|as little as)\b/i.test(helperText ?? '');
  const { entitlements, isPaid } = useBillingStatus();
  const { showToast } = useToast();
  const qualityTrial = entitlements?.aiTrial?.qualitySessions;
  const aiTrialExhausted =
    !isPaid &&
    qualityTrial?.limit != null &&
    qualityTrial.used >= qualityTrial.limit;

  useEffect(() => {
    const savedInstructions = options.customInstructions ?? '';
    if (syncingPreferenceRef.current) return;
    setDraftInstructions(savedInstructions);
    setIsEditingPreference(!savedInstructions.trim());
    setSaveState('idle');
    setImproveState('idle');
  }, [options.customInstructions]);

  const updateCriterion = useCallback(
    (id, patch) => {
      onOptionsChange((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }));
    },
    [onOptionsChange]
  );

  const toggleCriterionEnabled = useCallback(
    (id) => {
      onOptionsChange((prev) => {
        const turningOn = !prev[id].enabled;
        const count = Object.values(prev).filter((o) => o.enabled).length;
        if (turningOn && count >= MAX_CRITERIA) return prev;
        return { ...prev, [id]: { ...prev[id], enabled: turningOn, expanded: false } };
      });
    },
    [onOptionsChange]
  );

  const prevEnabledRef = useRef(enabled);

  useEffect(() => {
    if (!prevEnabledRef.current && enabled) {
      onOptionsChange((prev) => normalizeResponseQualityOptions(prev));
    }
    prevEnabledRef.current = enabled;
  }, [enabled, onOptionsChange]);

  useEffect(() => {
    if (!enabled) {
      setIsEditingPreference(!(options.customInstructions ?? '').trim());
      setSaveState('idle');
      setImproveState('idle');
    }
  }, [enabled, options.customInstructions]);

  useEffect(() => {
    const anyExpanded = Object.values(options).some((o) => o.expanded);
    if (anyExpanded) {
      onOptionsChange((prev) => normalizeResponseQualityOptions(prev));
    }
    // Collapse stale expanded state from older drafts on first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnabledChange = useCallback(
    (next) => {
      onEnabledChange(next);
      if (next) {
        onOptionsChange((prev) => {
          const normalized = normalizeResponseQualityOptions(prev);
          if (!normalized.customInstructions?.trim()) {
            const seeded = buildDefaultOwnerPromptForQuestion(questionText, helperText);
            setDraftInstructions(seeded);
            setIsEditingPreference(true);
            return { ...normalized, customInstructions: seeded };
          }
          return normalized;
        });
      }
    },
    [onEnabledChange, onOptionsChange, questionText, helperText],
  );

  const savePreference = useCallback(
    async (nextInstructions) => {
      const trimmed = nextInstructions.trim().slice(0, AI_GUIDANCE_MAX_LENGTH);
      setSaveState('saving');
      syncingPreferenceRef.current = true;
      onOptionsChange((prev) => ({
        ...prev,
        customInstructions: trimmed,
      }));
      try {
        await Promise.all([
          Promise.resolve(onSave?.()),
          new Promise((resolve) => window.setTimeout(resolve, SAVE_TRANSITION_MS)),
        ]);
        setSaveState('saved');
      } catch {
        setSaveState('idle');
      } finally {
        syncingPreferenceRef.current = false;
      }
      return trimmed;
    },
    [onOptionsChange, onSave],
  );

  const handleImproveClick = useCallback(async () => {
    const input = draftInstructions.trim();
    const runId = improveRunRef.current + 1;
    improveRunRef.current = runId;
    setImproveState('improving');

    const timeoutId = window.setTimeout(() => {
      if (improveRunRef.current === runId) {
        setImproveState('idle');
        showToast({ type: 'error', message: 'Improve with AI timed out — try again.' });
      }
    }, AI_IMPROVE_TIMEOUT_MS);

    try {
      let improved = null;
      if (isApiConfigured() && formId != null) {
        const apiResult = await improveResponseQualityInstructionsApi(formId, {
          screenId: screenId != null ? String(screenId) : undefined,
          fieldId,
          questionText,
          helperText,
          draftInstructions: input,
        });
        improved = apiResult?.customInstructions ?? null;
      }
      if (!improved) {
        const [localImproved] = await Promise.all([
          Promise.resolve(
            improvePreferenceInstructions(input || buildDefaultOwnerPromptForQuestion(questionText, helperText), {
              questionText,
            }),
          ),
          new Promise((resolve) => window.setTimeout(resolve, randomImproveDelayMs())),
        ]);
        improved = localImproved;
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, randomImproveDelayMs()));
      }

      if (improveRunRef.current !== runId) return;

      setDraftInstructions(improved);
      setImproveState('improved');
    } catch (err) {
      if (improveRunRef.current === runId) {
        setImproveState('idle');
        showToast({
          type: 'error',
          message: err?.message || 'Could not improve instructions — try again.',
        });
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (improveRunRef.current === runId) {
        setImproveState((prev) => (prev === 'improving' ? 'idle' : prev));
      }
    }
  }, [draftInstructions, questionText, helperText, formId, fieldId, screenId, showToast]);

  const handleSaveClick = useCallback(async () => {
    if (saveState === 'saving' || improveState === 'improving' || !draftInstructions.trim()) return;

    const trimmed = await savePreference(draftInstructions);
    if (!trimmed) {
      setIsEditingPreference(true);
      setSaveState('idle');
      setImproveState('idle');
      return;
    }
    setDraftInstructions(trimmed);
    setIsEditingPreference(false);
    setImproveState('idle');
  }, [draftInstructions, improveState, savePreference, saveState]);

  const handleCancelClick = useCallback(() => {
    improveRunRef.current += 1;
    const savedInstructions = options.customInstructions ?? '';
    setDraftInstructions(savedInstructions);
    setIsEditingPreference(!savedInstructions.trim());
    setSaveState('idle');
    setImproveState('idle');
  }, [options.customInstructions]);

  const handleDraftChange = useCallback(
    (nextValue) => {
      setDraftInstructions(nextValue.slice(0, AI_GUIDANCE_MAX_LENGTH));
      if (improveState === 'improved') {
        setImproveState('idle');
      }
    },
    [improveState],
  );

  const handleDeleteClick = useCallback(async () => {
    setDraftInstructions('');
    await savePreference('');
    setSaveState('idle');
    setIsEditingPreference(true);
  }, [savePreference]);

  const savedInstructions = (options.customInstructions ?? '').trim();
  const hasSavedPreference = savedInstructions.length > 0;
  const showSavedPreferenceView =
    !isEditingPreference && (hasSavedPreference || saveState === 'saved');
  const activeCriteria = criterionEntries(options)
    .filter(([, criterion]) => criterion.enabled)
    .map(([id]) => CRITERIA_META.find((meta) => meta.id === id)?.title)
    .filter(Boolean);
  const advancedSummary =
    activeCriteria.length > 0 ? `${activeCriteria.join(', ')} selected` : 'Length, specificity, relevance, completeness';

  return (
    <div className="w-full overflow-hidden bg-[#f7f6f4]">
      <div className={`flex w-full items-center justify-between px-4 py-[12px] ${enabled ? 'border-b border-[#e4e3de]' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-[28px] h-[28px] bg-[#1a1a18] rounded-[7px] flex items-center justify-center shrink-0">
            <RiRobot2Line size={14} className="text-white" />
          </div>
          <div className="flex flex-col gap-px min-w-0">
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-[#111827] leading-normal" style={FONT}>
              Response quality
            </span>
            <span className="text-[11.25px] font-medium leading-tight text-[#67645d]" style={FONT}>
              Nudges better answers; flags weak ones before you review.
            </span>
          </div>
        </div>
        <MainToggle checked={enabled} onChange={handleEnabledChange} />
      </div>

      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="criteria"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="w-full bg-[#f7f6f4] pt-[10px] pb-4 flex flex-col">
              <div className="mb-3 flex items-center gap-2 px-[15px]">
                <RiSparklingLine size={18} className="shrink-0 text-[#111827]" aria-hidden />
                <p className="text-[12.75px] font-semibold tracking-[-0.01em] text-[#111827]" style={FONT}>
                  Improve Responses with AI
                </p>
              </div>

              <div className="mx-[15px] mb-4">
                <p className="text-[11.5px] font-medium leading-[16.5px] text-[#64615b]" style={FONT}>
                  Guide the AI: Describe the specific details, friction points, or outcomes you want
                  respondents to share.
                </p>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {!showSavedPreferenceView ? (
                  <motion.div
                    key="preference-edit"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <PreferenceFrame
                      title="What preference do you have?"
                      footer={
                        <>
                          <PreferenceButton variant="secondary" onClick={handleCancelClick}>
                            Cancel
                          </PreferenceButton>
                          <PreferenceButton
                            variant="primary"
                            onClick={handleSaveClick}
                            disabled={
                              !draftInstructions.trim() ||
                              saveState === 'saving' ||
                              improveState === 'improving'
                            }
                            className="min-w-[72px]"
                          >
                            {saveState === 'saving' ? 'Saving...' : 'Save'}
                          </PreferenceButton>
                        </>
                      }
                    >
                      <PreferenceTextareaField
                        value={draftInstructions}
                        onChange={(e) => handleDraftChange(e.target.value)}
                        onImproveClick={handleImproveClick}
                        improveState={improveState}
                        saveState={saveState}
                      />
                    </PreferenceFrame>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preference-saved"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <PreferenceFrame
                      title="Preference Saved!"
                      footer={
                        <>
                          <PreferenceButton
                            variant="secondary"
                            onClick={() => {
                              setDraftInstructions(savedInstructions);
                              setSaveState('idle');
                              setImproveState('idle');
                              setIsEditingPreference(true);
                            }}
                            icon={<RiPencilLine size={12} aria-hidden />}
                          >
                            Edit
                          </PreferenceButton>
                          <PreferenceButton variant="danger" onClick={handleDeleteClick}>
                            Delete
                          </PreferenceButton>
                        </>
                      }
                    >
                      <div
                        className="rounded-[10px] border border-[rgba(140,138,132,0.18)] bg-[#fcfbf8] px-4 py-3 text-[12px] leading-[17px] text-[rgba(0,0,0,0.8)]"
                        style={FONT}
                      >
                        {savedInstructions}
                      </div>
                    </PreferenceFrame>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mx-4 mt-5 border-t border-[#ece9e2] pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-0 py-0 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-[12.25px] font-semibold tracking-[-0.01em] text-[#4b5563]" style={FONT}>
                      Advanced options
                    </p>
                    <p className="mt-1 truncate text-[11.25px] font-medium text-[#6f6b63]" style={FONT}>
                      {advancedSummary}
                    </p>
                  </div>
                  <motion.span
                    animate={{ rotate: showAdvancedOptions ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-[#8a8880]"
                  >
                    <RiArrowDownSLine size={16} aria-hidden />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showAdvancedOptions ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="py-3">
                        <div className="mb-4 rounded-[10px] bg-[#faf9f7] px-4 py-[10px]">
                          <div className="flex gap-[6px] items-start">
                            <RiInformationLine size={14} className="mt-px shrink-0 text-[#8a8880]" />
                            <p className="text-[11.25px] font-medium leading-snug text-[#6f6b63]" style={FONT}>
                              Pick up to <span className="font-semibold">2 criteria</span> — more means stricter filtering.
                            </p>
                          </div>
                        </div>

                        {aiTrialExhausted ? (
                          <div className="mb-4 rounded-[10px] bg-[#fbf3e8] px-4 py-[10px]">
                            <p className="text-[11.25px] font-medium leading-snug text-[#9b6522]" style={FONT}>
                              AI trial used — respondents now get rule-based
                              checks (no live AI). Upgrade to Clearform Pilot
                              for AI quality on every response.
                            </p>
                          </div>
                        ) : null}

                        {showExperienceHint ? (
                          <div className="mb-4 rounded-[10px] bg-[#eef8f1] px-4 py-[10px]">
                            <p className="text-[11.25px] font-medium leading-snug text-[#275b45]" style={FONT}>
                              Experience or feedback question — short evaluative answers stay
                              on-topic.
                              {brevityHelper
                                ? ' Your helper invites brevity, so length may be relaxed.'
                                : ' Length may be relaxed for short feedback answers.'}
                            </p>
                          </div>
                        ) : null}

                        <span
                          className="mb-[10px] block text-[9.75px] font-semibold uppercase tracking-[0.72px] text-[#98938b]"
                          style={FONT}
                        >
                          Scoring criteria
                        </span>

                        <div className="mb-4 flex flex-col gap-3">
                          {CRITERIA_META.map((meta) => (
                            <CriterionCard
                              key={meta.id}
                              meta={meta}
                              options={options[meta.id]}
                              atLimit={activeCount >= MAX_CRITERIA}
                              onToggleEnabled={() => toggleCriterionEnabled(meta.id)}
                              onToggleExpanded={() =>
                                updateCriterion(meta.id, { expanded: !options[meta.id].expanded })
                              }
                              onUpdate={(patch) => updateCriterion(meta.id, patch)}
                            />
                          ))}
                        </div>

                        <div className="pt-1">
                          <p className="text-[11.25px] font-medium leading-[16px] text-[#7c776f]" style={FONT}>
                            More customizability coming soon.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
