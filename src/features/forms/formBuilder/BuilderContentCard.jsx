import { Fragment, cloneElement, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RiAddLine,
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiExternalLinkLine,
  RiFileTextLine,
  RiFileUploadLine,
  RiGlobeLine,
  RiHeartFill,
  RiHeartLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiLockLine,
  RiMailLine,
  RiMapPinLine,
  RiPencilLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiSettings3Line,
  RiStarFill,
  RiStarLine,
  RiSubtractLine,
  RiTimeLine,
} from 'react-icons/ri';
import { PiCaretCircleUp } from 'react-icons/pi';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import InlineEditableField from '@/features/forms/components/InlineEditableField';
import { CanvasBadgeText, CanvasHelperText, CanvasQuestionText } from '@/features/forms/components/canvasCardText';
import { BoxesIcon, ImagesCardIcon, VideoCardIcon } from '@/features/forms/formBuilder/builderFieldIcons';
import ResponseQualityScoringCard, {
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
} from '@/features/forms/components/ResponseQualityScoringCard';
import ResponseQualityFeedback from '@/features/forms/components/ResponseQualityFeedback';
import { useResponseQualityEvaluation } from '@/features/forms/hooks/useResponseQualityEvaluation';
import {
  cardBodyPadClass,
  cardBodyPadXClass,
  cardFooterToolsPadClass,
  cardNavPadClass,
  choiceListRowPad,
  fieldGrid2Class,
  questionFontSize,
} from '@/features/forms/utils/respondentLayout';
import {
  applySecondsToSelection,
  clampSeconds,
  isTimeWithinBounds,
  selectionToSeconds,
  to24Hour,
  from24Hour,
} from '@/features/forms/utils/timeFieldUtils';
import {
  formatFileSizeCompact,
  formatMaxSizeLabel,
  parseMaxFileSizeBytes,
} from '@/features/forms/utils/fileSizeLimits';
import { getCardShellSurface } from '@/features/forms/utils/respondentThemeStyles';
import {
  respondentInputClass,
  respondentTextareaClass,
  RESPONDENT_QUALITY_FIELD_PAD,
} from '@/features/forms/utils/respondentFieldInput';


const CardShell = ({ children, fullCanvas = false, cardColor = '#f7f6f4', cardImage = null, scrollable = false, footer = null }) => {
  const { borderAndRadius, shellStyle } = getCardShellSurface({ fullCanvas, cardColor, cardImage });

  if (footer) {
    return (
      <div
        className={`flex-1 flex flex-col min-h-0 transition-colors duration-300 ${borderAndRadius}`}
        style={shellStyle}
      >
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            scrollable ? 'overflow-y-auto overflow-x-hidden' : 'overflow-x-hidden overflow-y-auto justify-between'
          }`}
        >
          {children}
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div
      className={`${scrollable ? 'overflow-y-auto min-h-0' : 'overflow-x-hidden overflow-y-auto min-h-0'} flex-1 flex flex-col justify-between transition-colors duration-300 ${borderAndRadius}`}
      style={shellStyle}
    >
      {children}
    </div>
  );
};

function CardBody({ compactLayout, className = '', children }) {
  return <div className={`${cardBodyPadClass(compactLayout)} ${className}`.trim()}>{children}</div>;
}

const DEFAULT_ACCENT = '#111111';

const choiceMarkStyle = (accent, picked) => {
  if (!picked) return { borderColor: 'rgba(0,0,0,0.2)' };
  const a = accent || DEFAULT_ACCENT;
  return { borderColor: a, backgroundColor: a };
};

const accentButtonStyle = (accent) => ({
  backgroundColor: accent || DEFAULT_ACCENT,
});

/** Preview viewport chrome heights — Figma Clearform-Changes 2521:8332 */
const PREVIEW_PAGE_INDICATOR_H = 34;
const PREVIEW_POWERED_BY_H = 38;
export const PREVIEW_CHROME_H = PREVIEW_PAGE_INDICATOR_H + PREVIEW_POWERED_BY_H;

/** Page counter shown above the form card in preview — Figma 2521:8332 */
export const PreviewPageIndicator = ({ current, total }) => (
  <motion.div
    layout
    className="flex items-center justify-center shrink-0 w-full"
    style={{
      height: PREVIEW_PAGE_INDICATOR_H,
      fontFamily: "'DM Sans', sans-serif",
      fontVariationSettings: "'opsz' 14",
    }}
  >
    <span className="text-[11px] font-medium tracking-[0.04em] text-[#8c8a84]">
      Page {current} of {total}
    </span>
  </motion.div>
);

/** Clearform branding shown below the form card in preview — Figma 2521:8332 */
export const PreviewPoweredBy = () => (
  <motion.div
    layout
    className="flex items-center justify-center gap-[5px] shrink-0 w-full"
    style={{
      height: PREVIEW_POWERED_BY_H,
      fontFamily: "'DM Sans', sans-serif",
      fontVariationSettings: "'opsz' 14",
    }}
  >
    <span className="text-[10.5px] font-normal text-[#b0aea8]">Powered by</span>
    <img src={clearformLogo} alt="Clearform" className="h-[13px] w-auto object-contain" />
  </motion.div>
);

/** Back / Continue — matches Figma (Clearform-Changes 2521:7135) */
export const PreviewCardStepNav = ({
  prevScreen,
  nextScreen,
  onGoPrev,
  onGoContinue,
  showBackButton = true,
  compactLayout = false,
}) => (
  <div className={`border-t border-[#cfcecd] flex items-center justify-between shrink-0 gap-2 ${cardNavPadClass(compactLayout)}`}>
    {showBackButton ? (
      <button
        type="button"
        onClick={() => onGoPrev?.()}
        disabled={!prevScreen}
        className={`inline-flex items-center justify-center gap-[6px] h-[38px] rounded-[6px] border border-solid px-[15px] text-[13px] font-normal transition-colors ${
          prevScreen
            ? 'border-[#e2e0dc] bg-white text-[#8a8880] hover:bg-[#f7f6f4] cursor-pointer'
            : 'border-[#e8e6e2] bg-[#fafaf9] text-[#c4c2bc] cursor-not-allowed'
        }`}
        style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
      >
        <RiArrowLeftLine size={13} className={`shrink-0 ${prevScreen ? 'text-[#8a8880]' : 'text-[#c4c2bc]'}`} aria-hidden />
        Back
      </button>
    ) : (
      <span className="h-[38px] w-[1px]" aria-hidden />
    )}
    <button
      type="button"
      onClick={() => onGoContinue?.()}
      disabled={!nextScreen}
      className={`inline-flex items-center justify-center gap-2 h-[38px] rounded-[10px] px-6 text-[14px] font-medium transition-colors ${
        nextScreen
          ? 'bg-[#1a1a18] text-white hover:bg-[#2a2a26] cursor-pointer'
          : 'bg-[#d4d2cc] text-[#a8a6a0] cursor-not-allowed'
      }`}
      style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
    >
      Continue
      <RiArrowRightLine size={14} className={`shrink-0 ${nextScreen ? 'text-white' : 'text-[#a8a6a0]'}`} aria-hidden />
    </button>
  </div>
);

/** Shown beside the question title line when Continue is tapped but required preview fields are incomplete. */
const PreviewRequiredInline = ({ show }) =>
  show ? (
    <span
      className="text-[10px] font-semibold uppercase tracking-[0.06em] text-red-600 shrink-0"
      aria-live="polite"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      Required
    </span>
  ) : null;

const SectionBadge = ({ num, label }) => (
  <div className="flex gap-[8px] items-center">
    <div className="bg-[#111] w-[26px] h-[26px] rounded-[6px] flex items-center justify-center shrink-0">
      <span className="text-white text-[13px] font-semibold leading-none">{num}</span>
    </div>
    <span className="text-[#888] text-[15px] tracking-[0.42px]">{label}</span>
  </div>
);

const FormField = ({ label, value }) => (
  <div className="flex flex-col w-full">
    <p className="text-[#888] text-[10.5px] font-medium tracking-[0.42px] uppercase pb-[6px]">{label}</p>
    <div className="border-b border-[rgba(0,0,0,0.16)] pb-[9px] pt-[8px]">
      <p className="text-[14px] text-black font-light">{value}</p>
    </div>
  </div>
);

/** Editable text field for preview/fill mode (replaces static {@link FormField} samples). */
const PreviewLabeledInput = ({ label, value, onChange, placeholder = '', type = 'text', className = '' }) => (
  <div className="flex flex-col w-full">
    <label className="text-[#888] text-[10.5px] font-medium tracking-[0.42px] uppercase pb-[6px]">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={respondentInputClass(className)}
    />
  </div>
);

const ContentCardFooter = ({ onDelete, onConfigure, variant = 'default', accentColor = DEFAULT_ACCENT, compactLayout = false }) => (
  <div className={`border-t border-[rgba(0,0,0,0.1)] flex gap-2 items-center ${cardFooterToolsPadClass(compactLayout)}`}>
    {variant === 'content' && (
      <button className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-white/70 border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap">
        <RiPencilLine size={12} className="shrink-0" />
        Edit content
      </button>
    )}
    {onConfigure ? (
      <button
        type="button"
        onClick={onConfigure}
        className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-white/70 border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
      >
        <RiSettings3Line size={12} className="shrink-0" />
        Configure
      </button>
    ) : null}
    <button
      type="button"
      onClick={onDelete}
      className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,245,245,0.7)] border border-[rgba(200,50,50,0.2)] text-[#d63030] text-[12px] cursor-pointer hover:bg-[rgba(255,235,235,0.9)] transition-colors whitespace-nowrap"
    >
      <RiDeleteBin6Line size={12} className="shrink-0" />
      Delete
    </button>
    <div className="flex-1" />
    <button
      type="button"
      className="flex items-center gap-[5px] px-[16px] py-[8px] rounded-[8px] text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
      style={accentButtonStyle(accentColor)}
    >
      <RiCheckLine size={11} className="shrink-0" />
      Save
    </button>
  </div>
);

const FileUploadCard = ({
  blockNum,
  onDelete,
  onConfigure,
  configureLabel,
  config,
  isPreviewMode = false,
  accentColor = DEFAULT_ACCENT,
  compactLayout = false,
}) => {
  const accent = accentColor || DEFAULT_ACCENT;
  const question = config?.question || 'Attach supporting documents';
  const helperText = config?.helperText || 'Attach any files that help us understand your request better.';
  const maxFileSizeLabel = config?.maxFileSize || '25 MB';
  const maxBytes = parseMaxFileSizeBytes(maxFileSizeLabel);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sizeError, setSizeError] = useState(null);
  const fileInputRef = useRef(null);

  const startUploadProgress = (fileIds) => {
    fileIds.forEach((fileId) => {
      let prog = 0;
      const tick = () => {
        prog = Math.min(100, prog + Math.random() * 18 + 6);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: Math.round(prog) } : f))
        );
        if (prog < 100) setTimeout(tick, 80);
      };
      setTimeout(tick, 80);
    });
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const oversized = selected.find((f) => f.size > maxBytes);
    if (oversized) {
      setSizeError({ name: oversized.name, size: oversized.size });
      e.target.value = '';
      return;
    }

    setSizeError(null);

    const newFiles = selected.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: f.name,
      size: f.size,
      progress: 0,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    startUploadProgress(newFiles.map((f) => f.id));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt?.files) {
      handleFileSelect({ target: { files: dt.files } });
    }
  };

  const handleRemove = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleTryAnother = () => {
    setSizeError(null);
    fileInputRef.current?.click();
  };

  const formatSize = (bytes) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const maxSizeHint = maxFileSizeLabel === 'No limit'
    ? 'No size limit'
    : `Max ${maxFileSizeLabel} per file`;

  return (
    <>
      <CardBody compactLayout={compactLayout}>
        <SectionBadge num={blockNum} label="File upload" />
        <div className="pt-[9px]">
          <CanvasQuestionText
            value={config?.question ?? ''}
            onChange={config?.setQuestion}
            isPreviewMode={isPreviewMode}
            fontSize="26px"
            fontWeight="500"
            className="font-medium leading-tight"
          />
        </div>
        <CanvasHelperText
          value={config?.helperText ?? ''}
          onChange={config?.setHelperText}
          isPreviewMode={isPreviewMode}
          className="mt-[2px] mb-5 leading-[1.6]"
        />

        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-[5px] mb-[5px]">
            {uploadedFiles.map(file => (
              <div key={file.id} className="bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.1)] rounded-[9px] flex gap-[10px] items-center px-[15px] py-[11px]">
                <div className="bg-[rgba(0,0,0,0.06)] rounded-[7px] w-[32px] h-[32px] shrink-0 flex items-center justify-center">
                  <RiFileTextLine size={16} className="text-[#666]" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                  <span className="font-medium text-[#111] text-[13px] leading-none truncate">{file.name}</span>
                  {file.progress < 100 ? (
                    <div className="bg-[rgba(0,0,0,0.1)] h-[2px] rounded-[2px] w-full overflow-hidden">
                      <div className="h-full rounded-[2px] transition-[width] duration-75" style={{ width: `${file.progress}%`, backgroundColor: accent }} />
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#888]">Upload complete</span>
                  )}
                </div>
                <span className="text-[11px] text-black shrink-0">{formatSize(file.size)}</span>
                <button
                  onClick={() => handleRemove(file.id)}
                  className="shrink-0 w-[22px] h-[22px] rounded-[5px] flex items-center justify-center hover:bg-[rgba(0,0,0,0.06)] transition-colors cursor-pointer"
                >
                  <RiDeleteBin6Line size={12} className="text-[#999]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
        />

        {sizeError ? (
          <div className="flex flex-col gap-[6px] mt-[5px] mb-5">
            <div className="bg-[#fef2f2] border border-dashed border-[#e8271c] rounded-[8px] flex flex-col items-center gap-[2px] px-[25px] py-[33px]">
              <p className="text-[24px] leading-[36px] opacity-50 text-[#141412]">&#9888;</p>
              <p className="text-[#e8271c] text-[13px] font-medium leading-[19.5px] pt-[6px]">File too large</p>
              <p className="text-[#9a9a94] text-[11.5px] text-center leading-[17.25px]">
                {sizeError.name} is {formatFileSizeCompact(sizeError.size)} — max allowed is{' '}
                {formatMaxSizeLabel(maxFileSizeLabel)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTryAnother}
              className="w-full bg-[#f7f7f5] border border-dashed border-[#e2e2de] rounded-[8px] py-[15px] px-[13px] text-[#5c5c56] text-[12px] text-center cursor-pointer hover:bg-[#f0f0ed] transition-colors"
            >
              + Try another file
            </button>
          </div>
        ) : (
          <div
            className="bg-[rgba(255,255,255,0.4)] border border-dashed border-[rgba(0,0,0,0.16)] rounded-[12px] flex flex-col items-center gap-[10px] pt-[34px] pb-[50px] px-[25px] mt-[5px] mb-5 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="bg-[rgba(0,0,0,0.06)] rounded-[10px] w-[40px] h-[40px] shrink-0 flex items-center justify-center pointer-events-none">
              <RiFileUploadLine size={20} className="text-[#666]" />
            </div>
            <span className="font-medium text-[#111] text-[14px] text-center pointer-events-none">
              {uploadedFiles.length > 0 ? 'Add another file' : 'Drop your files here'}
            </span>
            <div className="flex items-center gap-[10px] w-full pointer-events-none">
              <div className="bg-[rgba(0,0,0,0.1)] h-px flex-1" />
              <span className="text-[11px] text-black">or</span>
              <div className="bg-[rgba(0,0,0,0.1)] h-px flex-1" />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="bg-[rgba(255,255,255,0.8)] border border-[rgba(0,0,0,0.16)] rounded-[8px] flex items-center gap-[6px] px-[19px] py-[9px] cursor-pointer hover:bg-white transition-colors"
            >
              <RiAddLine size={13} className="text-[#444] shrink-0" />
              <span className="font-medium text-[#444] text-[12.5px]">Browse files</span>
            </button>
            <span className="text-[11px] text-black text-center pointer-events-none">
              PDF, DOCX, PNG, JPG &middot; {maxSizeHint}
            </span>
          </div>
        )}
      </CardBody>
      {!isPreviewMode && (
        <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure && configureLabel ? () => onConfigure(configureLabel) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />
      )}
    </>
  );
};

const TimePickerStepBtn = ({ onClick, direction, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="bg-[rgba(255,255,255,0.6)] border border-[rgba(0,0,0,0.1)] h-[24px] w-[32px] rounded-[6px] flex items-center justify-center shrink-0 cursor-pointer hover:bg-white/90 transition-colors"
  >
    {direction === 'up'
      ? <RiArrowUpSLine size={12} className="text-[#888]" />
      : <RiArrowDownSLine size={12} className="text-[#888]" />}
  </button>
);

const TimePickerColumn = ({ value, label, isActive, onActivate, onIncrement, onDecrement }) => (
  <div className="flex flex-col gap-[4px] items-center shrink-0">
    <TimePickerStepBtn direction="up" onClick={onIncrement} ariaLabel={`Increase ${label.toLowerCase()}`} />
    <button
      type="button"
      onClick={onActivate}
      className={`h-[44px] w-[64px] rounded-[10px] flex items-center justify-center shrink-0 border p-px cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#111] border-[#111] text-white'
          : 'bg-[rgba(255,255,255,0.7)] border-[rgba(0,0,0,0.16)] text-[#111]'
      }`}
    >
      <span className="font-medium text-[22px] tracking-[0.44px] leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </button>
    <TimePickerStepBtn direction="down" onClick={onDecrement} ariaLabel={`Decrease ${label.toLowerCase()}`} />
    <span className="text-[10px] text-[#bbb] tracking-[0.6px] uppercase leading-none">{label}</span>
  </div>
);

const TimePickerCard = ({
  blockNum,
  onDelete,
  onConfigure,
  configureLabel,
  config,
  isPreviewMode = false,
  previewRequiredHint = false,
  onTimeChange,
  accentColor = DEFAULT_ACCENT,
  compactLayout = false,
}) => {
  const accent = accentColor || DEFAULT_ACCENT;
  const question = config?.timeQuestion || 'What time works best for you?';
  const helperText = config?.timeHelperText || 'Select your preferred time slot.';
  const required = !!config?.timeRequired;
  const use12h = config?.timeUse12h ?? false;
  const showSeconds = !!config?.timeShowSeconds;
  const minTime = config?.timeMinTime ?? '';
  const maxTime = config?.timeMaxTime ?? '';

  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(30);
  const [second, setSecond] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [activeColumn, setActiveColumn] = useState('hour');
  const [rangeError, setRangeError] = useState(null);

  const wrapHour12 = (n) => (n > 12 ? 1 : n < 1 ? 12 : n);
  const wrapHour24 = (n) => (n > 23 ? 0 : n < 0 ? 23 : n);
  const wrapMinute = (n) => (n > 59 ? 0 : n < 0 ? 59 : n);
  const wrapSecond = (n) => (n > 59 ? 0 : n < 0 ? 59 : n);

  const applyBounds = useCallback(
    (h, m, s, p) => {
      let secs = selectionToSeconds({ hour: h, minute: m, second: s, period: p, use12h });
      if (!isTimeWithinBounds(secs, minTime, maxTime, { showSeconds })) {
        secs = clampSeconds(secs, minTime, maxTime, { showSeconds });
        return applySecondsToSelection(secs, { use12h, showSeconds });
      }
      return { hour: h, minute: m, second: s, period: p };
    },
    [use12h, showSeconds, minTime, maxTime],
  );

  const commitTime = useCallback(
    (h, m, s, p) => {
      const bounded = applyBounds(h, m, s, p);
      setHour(bounded.hour);
      setMinute(bounded.minute);
      setSecond(bounded.second);
      setPeriod(bounded.period);
      const secs = selectionToSeconds({ ...bounded, use12h });
      setRangeError(
        isTimeWithinBounds(secs, minTime, maxTime, { showSeconds })
          ? null
          : 'Selected time is outside the allowed range.',
      );
      onTimeChange?.(bounded);
    },
    [applyBounds, use12h, minTime, maxTime, showSeconds, onTimeChange],
  );

  useEffect(() => {
    if (!showSeconds) setSecond(0);
  }, [showSeconds]);

  useEffect(() => {
    commitTime(hour, minute, second, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minTime, maxTime]);

  const prevUse12h = useRef(use12h);
  useEffect(() => {
    if (prevUse12h.current === use12h) return;
    prevUse12h.current = use12h;
    if (use12h) {
      const { hour12, period: p } = from24Hour(to24Hour(hour, period));
      commitTime(hour12, minute, second, p);
    } else {
      commitTime(to24Hour(hour, period), minute, second, period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [use12h]);

  return (
    <>
      <CardBody compactLayout={compactLayout}>
        <SectionBadge num={blockNum} label="Time picker" />
        <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <CanvasQuestionText
            value={config?.timeQuestion ?? ''}
            onChange={config?.setTimeQuestion}
            isPreviewMode={isPreviewMode}
            required={required}
            fontSize="26px"
            fontWeight="500"
            className="font-medium leading-[32.5px]"
          />
          <PreviewRequiredInline show={previewRequiredHint} />
        </div>
        <CanvasHelperText
          value={config?.timeHelperText ?? ''}
          onChange={config?.setTimeHelperText}
          isPreviewMode={isPreviewMode}
          className="text-[13px] leading-[20.8px]"
        />
        <div className="flex gap-[8px] items-center justify-center pb-[17px] pt-[19px] w-full">
          <TimePickerColumn
            value={hour}
            label="Hour"
            isActive={activeColumn === 'hour'}
            onActivate={() => setActiveColumn('hour')}
            onIncrement={() =>
              commitTime(
                use12h ? wrapHour12(hour + 1) : wrapHour24(hour + 1),
                minute,
                second,
                period,
              )
            }
            onDecrement={() =>
              commitTime(
                use12h ? wrapHour12(hour - 1) : wrapHour24(hour - 1),
                minute,
                second,
                period,
              )
            }
          />
          <span className="text-[#888] text-[22px] font-light leading-none pb-[18px] shrink-0">:</span>
          <TimePickerColumn
            value={minute}
            label="Minute"
            isActive={activeColumn === 'minute'}
            onActivate={() => setActiveColumn('minute')}
            onIncrement={() => commitTime(hour, wrapMinute(minute + 1), second, period)}
            onDecrement={() => commitTime(hour, wrapMinute(minute - 1), second, period)}
          />
          {showSeconds && (
            <>
              <span className="text-[#888] text-[22px] font-light leading-none pb-[18px] shrink-0">:</span>
              <TimePickerColumn
                value={second}
                label="Second"
                isActive={activeColumn === 'second'}
                onActivate={() => setActiveColumn('second')}
                onIncrement={() => commitTime(hour, minute, wrapSecond(second + 1), period)}
                onDecrement={() => commitTime(hour, minute, wrapSecond(second - 1), period)}
              />
            </>
          )}
          {use12h && (
            <div className="flex flex-col gap-[4px] pl-[4px] shrink-0">
              {(['AM', 'PM']).map((p) => {
                const selected = period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => commitTime(hour, minute, second, p)}
                    className={`rounded-[7px] px-[15px] py-[9px] text-[12px] cursor-pointer transition-colors border ${
                      selected
                        ? 'bg-[#111] border-[#111] text-white font-medium'
                        : 'border-[rgba(0,0,0,0.16)] text-[#888] font-normal hover:bg-[rgba(0,0,0,0.03)]'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {rangeError && (
          <p className="text-center text-[11px] text-[#d63030] pb-2 -mt-2">{rangeError}</p>
        )}
      </CardBody>
      {!isPreviewMode && (
        <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure && configureLabel ? () => onConfigure(configureLabel) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />
      )}
    </>
  );
};

const MultiImageUploadCard = ({
  blockNum,
  onDelete,
  onConfigure,
  configureLabel,
  config,
  fullCanvas = false,
  cardColor = '#f7f6f4',
  cardImage = null,
  accentColor = DEFAULT_ACCENT,
  isPreviewMode = false,
  previewStepNav = null,
  previewScreenValidatorRef,
  compactLayout = false,
}) => {
  const accent = accentColor || DEFAULT_ACCENT;
  const question   = config?.question   || 'Upload photos of the issue';
  const helperText = config?.helperText || 'Add up to 9 images. Drag to reorder.';
  const maxImages  = config?.maxFiles   || 9;
  const maxFileSizeLabel = config?.maxFileSize || '25 MB';
  const maxBytes = parseMaxFileSizeBytes(maxFileSizeLabel);
  const required   = !!config?.required;

  const [images, setImages]       = useState([]);
  const [sizeError, setSizeError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOver, setDragOver]   = useState(null);
  const [addHovered, setAddHovered] = useState(false);
  const [previewRequiredHint, setPreviewRequiredHint] = useState(false);
  const fileInputRef = useRef(null);

  const snapRef = useRef({});
  snapRef.current = { required, imageCount: images.length };

  useEffect(() => {
    setPreviewRequiredHint(false);
  }, [images]);

  useEffect(() => {
    if (!previewScreenValidatorRef) return undefined;
    if (!isPreviewMode) {
      previewScreenValidatorRef.current = null;
      return undefined;
    }

    previewScreenValidatorRef.current = () => {
      const { required: rq, imageCount } = snapRef.current;
      if (!rq) {
        setPreviewRequiredHint(false);
        return true;
      }
      const ok = imageCount > 0;
      setPreviewRequiredHint(!ok);
      return ok;
    };
    return () => {
      previewScreenValidatorRef.current = null;
    };
  }, [isPreviewMode, previewScreenValidatorRef, required]);

  const handleSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const oversized = files.find((f) => f.size > maxBytes);
    if (oversized) {
      setSizeError({ name: oversized.name, size: oversized.size });
      e.target.value = '';
      return;
    }

    setSizeError(null);
    const remaining = maxImages - images.length;
    const toAdd = files.slice(0, remaining).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const handleTryAnother = () => {
    setSizeError(null);
    fileInputRef.current?.click();
  };

  const handleRemove = (id) => {
    setImages(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter(img => img.id !== id);
    });
  };

  /* ── Drag-to-reorder handlers ── */
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOver(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOver(null);
  };

  const isAtMax = images.length >= maxImages;

  return (
    <CardShell
      fullCanvas={fullCanvas}
      cardColor={cardColor}
      cardImage={cardImage}
      footer={isPreviewMode && previewStepNav ? cloneElement(previewStepNav, { compactLayout }) : null}
    >
        <CardBody compactLayout={compactLayout} className="pb-4">
        <SectionBadge num={blockNum} label="Multi-image upload" />
        <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <CanvasQuestionText
            value={config?.question ?? ''}
            onChange={config?.setQuestion}
            isPreviewMode={isPreviewMode}
            required={required}
            fontSize="26px"
            fontWeight="500"
            className="font-medium leading-tight"
          />
          <PreviewRequiredInline show={previewRequiredHint} />
        </div>
        <CanvasHelperText
          value={config?.helperText ?? ''}
          onChange={config?.setHelperText}
          isPreviewMode={isPreviewMode}
          className="mt-[2px] leading-[1.6]"
        />

        {sizeError && (
          <div className="flex flex-col gap-[6px] mt-[14px]">
            <div className="bg-[#fef2f2] border border-dashed border-[#e8271c] rounded-[8px] flex flex-col items-center gap-[2px] px-[25px] py-[33px]">
              <p className="text-[24px] leading-[36px] opacity-50 text-[#141412]">&#9888;</p>
              <p className="text-[#e8271c] text-[13px] font-medium leading-[19.5px] pt-[6px]">File too large</p>
              <p className="text-[#9a9a94] text-[11.5px] text-center leading-[17.25px]">
                {sizeError.name} is {formatFileSizeCompact(sizeError.size)} — max allowed is{' '}
                {formatMaxSizeLabel(maxFileSizeLabel)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTryAnother}
              className="w-full bg-[#f7f7f5] border border-dashed border-[#e2e2de] rounded-[8px] py-[15px] px-[13px] text-[#5c5c56] text-[12px] text-center cursor-pointer hover:bg-[#f0f0ed] transition-colors"
            >
              + Try another file
            </button>
          </div>
        )}

        {/* Counter + drag hint — only show once images exist */}
        {images.length > 0 && (
          <div className="flex items-center justify-between mt-[14px]">
            <span className="text-[#888] text-[11.5px]">{images.length} of {maxImages} uploaded</span>
            <div className="flex items-center gap-[4px]">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="1"    width="11" height="1.5" rx="0.75" fill="#111" />
                <rect x="0" y="4.75" width="11" height="1.5" rx="0.75" fill="#111" />
                <rect x="0" y="8.5"  width="11" height="1.5" rx="0.75" fill="#111" />
              </svg>
              <span className="text-[11px] text-[#111]">Drag to reorder</span>
            </div>
          </div>
        )}

        {/* Image grid — 4 per row, scrollable so card never expands */}
        <div className={`mt-[10px] mb-[4px] overflow-y-auto ${compactLayout ? 'max-h-[45dvh]' : ''}`} style={compactLayout ? undefined : { maxHeight: '250px' }}>
          <div className={`grid gap-[6px] ${compactLayout ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative rounded-[8px] overflow-hidden aspect-square border transition-all cursor-grab active:cursor-grabbing select-none ${
                  dragOver === index
                    ? 'border-[#111] scale-[0.96] opacity-70'
                    : dragIndex === index
                    ? 'border-[rgba(0,0,0,0.1)] opacity-40'
                    : 'border-[rgba(0,0,0,0.1)]'
                }`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover pointer-events-none" />
                <button
                  onClick={() => handleRemove(img.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-[4px] right-[4px] w-[16px] h-[16px] rounded-full flex items-center justify-center backdrop-blur-[2px] bg-[rgba(0,0,0,0.5)] cursor-pointer hover:bg-[rgba(0,0,0,0.7)] transition-colors"
                >
                  <span className="text-white text-[9px] leading-none">×</span>
                </button>
              </div>
            ))}

            {/* Add photo slot — always visible; disabled + tooltip when at max */}
            <div className="relative aspect-square">
              {addHovered && (
                <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-[#111] text-white text-[10px] px-[8px] py-[4px] rounded-[5px] whitespace-nowrap z-10 pointer-events-none">
                  {isAtMax ? 'Max 9 reached' : 'Add photo'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111]" />
                </div>
              )}
              <button
                onClick={() => !isAtMax && fileInputRef.current?.click()}
                onMouseEnter={() => setAddHovered(true)}
                onMouseLeave={() => setAddHovered(false)}
                disabled={isAtMax}
                className={`w-full h-full border border-dashed rounded-[8px] flex flex-col items-center justify-center gap-[4px] transition-colors ${
                  isAtMax
                    ? 'border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] cursor-not-allowed opacity-40'
                    : 'border-[rgba(0,0,0,0.16)] bg-[rgba(255,255,255,0.4)] cursor-pointer hover:bg-[rgba(255,255,255,0.7)]'
                }`}
              >
                <RiAddLine size={16} className={isAtMax ? 'text-[#bbb]' : 'text-[#555]'} />
                <span className={`text-[10px] ${isAtMax ? 'text-[#bbb]' : 'text-[#555]'}`}>Add photo</span>
              </button>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleSelect}
        />
      </CardBody>
      {!isPreviewMode && (
        <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure && configureLabel ? () => onConfigure(configureLabel) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />
      )}
    </CardShell>
  );
};

const CTA_CONTENT_WIDTH_MAP = { Narrow: '280px', Default: '320px', Wide: '480px' };
const HEADING_FONT_WEIGHT_MAP = { Light: '300', Regular: '500', Bold: '700' };
const VIDEO_WIDTH_STYLES = {
  Full: { width: '100%' },
  Wide: { width: '90%', maxWidth: '90%', marginLeft: 'auto', marginRight: 'auto' },
  Medium: { width: '75%', maxWidth: '75%', marginLeft: 'auto', marginRight: 'auto' },
  Small: { width: '55%', maxWidth: '55%', marginLeft: 'auto', marginRight: 'auto' },
};
const VIDEO_ASPECT_RATIO_MAP = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1' };

/** Parse YouTube/Vimeo URL respecting the selected video source in configure */
function parseVideoEmbed(url, preferredSource = 'youtube') {
  if (!url?.trim()) return null;
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');

  if (preferredSource === 'vimeo' && !isVimeo) return null;
  if (preferredSource === 'youtube' && !isYoutube) return null;

  if (isYoutube) {
    const videoId = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1];
    return videoId
      ? { type: 'youtube', embedBase: `https://www.youtube.com/embed/${videoId}`, videoId }
      : null;
  }
  if (isVimeo) {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId
      ? { type: 'vimeo', embedBase: `https://player.vimeo.com/video/${videoId}`, videoId }
      : null;
  }
  return null;
}

function buildVideoEmbedUrl(parsed, { autoplay = false, loop = false, showControls = true } = {}) {
  if (!parsed) return null;
  const params = new URLSearchParams();
  if (parsed.type === 'youtube') {
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('mute', '1');
    }
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', parsed.videoId);
    }
    if (!showControls) params.set('controls', '0');
    params.set('rel', '0');
  } else {
    if (autoplay) params.set('autoplay', '1');
    if (loop) params.set('loop', '1');
    if (!showControls) params.set('controls', '0');
  }
  const qs = params.toString();
  return qs ? `${parsed.embedBase}?${qs}` : parsed.embedBase;
}

const TEXT_VALIDATION_INPUT_TYPE = {
  None: 'text',
  Email: 'email',
  URL: 'url',
  Number: 'number',
  Phone: 'tel',
};

function validateTextValue(value, validation) {
  const v = String(value ?? '').trim();
  if (!v || !validation || validation === 'None') return true;
  switch (validation) {
    case 'Email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    case 'URL': {
      try {
        const u = v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`;
        new URL(u);
        return true;
      } catch {
        return false;
      }
    }
    case 'Number':
      return v !== '' && !Number.isNaN(Number(v));
    case 'Phone':
      return /^[\d\s\-+().]{7,}$/.test(v);
    default:
      return true;
  }
}

/** Block-level or per-field required flag for contact/address/work composite fields */
function isCompositeFieldRequired(blockRequired, field) {
  return !!(blockRequired || field?.required);
}

function shuffleArray(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getChoicePickCount(picks) {
  return (picks || []).filter((p) => p !== 'Other').length;
}

/** Validates min/max/required for single, multiple, and media choice fields */
function validateChoicePicks({ required, multipleSelect, minChoices, maxChoices, picks, optionCount }) {
  const count = getChoicePickCount(picks);
  if (!required && count === 0) return true;
  const min = multipleSelect
    ? Math.max(required ? 1 : 0, Number(minChoices) || (required ? 1 : 0))
    : required ? 1 : 0;
  const max = multipleSelect
    ? (maxChoices == null ? optionCount + 1 : Number(maxChoices))
    : 1;
  if (count < min) return false;
  if (count > max) return false;
  return true;
}

const CHOICE_KEYBOARD_HINT = (i) => String.fromCharCode(65 + (i % 26));

/** Renders description instruction copy with list/link formatting from the configure panel */
function renderDescriptionContent(content, formatting, textAlignClass, contentStyle) {
  const linkStyle = formatting.link ? { color: '#2563eb', textDecoration: 'underline' } : {};
  const mergedStyle = { ...contentStyle, fontFamily: "'Geist', sans-serif", ...linkStyle };
  const lines = String(content || '').split('\n').filter((line) => line.length > 0);

  if (formatting.list) {
    const items = lines.length > 0 ? lines : [content];
    return (
      <ul className={`list-disc pl-5 space-y-1 text-[#6b6860] leading-[23px] ${textAlignClass}`} style={mergedStyle}>
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }

  return (
    <p className={`text-[#6b6860] leading-[23px] ${textAlignClass}`} style={mergedStyle}>
      {content}
    </p>
  );
}

/** Builder overlay when a field is marked hidden in configure */
const HiddenFieldOverlay = ({ show }) =>
  show ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] pointer-events-none"
      style={{ background: 'rgba(255,255,255,0.55)' }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#888] px-3 py-1 rounded-full border border-[rgba(0,0,0,0.12)] bg-white/90"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Hidden from respondents
      </span>
    </motion.div>
  ) : null;

/** Validates preview Continue when configured fields are marked required */
function isPreviewAdvanceAllowed(snap) {
  const g = (k) => String(snap.previewFields[k] ?? '').trim();
  const { cardKey, shortTextDraft, longTextDraft, previewPicks = [], captchaChecked, ratingValue } = snap;
  const realPicks = () => getChoicePickCount(previewPicks);

  switch (cardKey) {
    case 'buildingBlocks:CTA':
      return true;
    case 'buildingBlocks:Heading':
      if (snap.headingConfig?.headingHidden) return true;
      return !snap.headingConfig?.headingRequired || g('headingAns').length > 0;
    case 'buildingBlocks:Description':
      if (snap.descriptionConfig?.descriptionHidden) return true;
      return true;
    case 'buildingBlocks:Images':
      if (snap.imageConfig?.imageHidden) return true;
      return true;
    case 'buildingBlocks:Video':
      if (snap.videoConfig?.videoHidden) return true;
      return !snap.videoConfig?.videoRequired || g('videoAns').length > 0;
    case 'basicInfo:Contact': {
      const cc = snap.contactConfig || {};
      const br = !!cc.contactRequired;
      const cf = cc.contactFields || {};
      const need = (fld) => !!(fld?.visible !== false && (br || fld?.required === true));
      if (need(cf.firstName) && !g('c.fn')) return false;
      if (need(cf.lastName) && !g('c.ln')) return false;
      if (need(cf.email) && !g('c.em')) return false;
      if (need(cf.phone) && !g('c.ph')) return false;
      if (need(cf.company) && !g('c.co')) return false;
      return true;
    }
    case 'basicInfo:Address': {
      const ac = snap.addressConfig || {};
      const br = !!ac.addressRequired;
      const af = ac.addressFields || {};
      const need = (fld) => !!(fld?.visible !== false && (br || fld?.required === true));
      if (need(af.street) && !g('a.st')) return false;
      if (need(af.city) && !g('a.ci')) return false;
      if (need(af.state) && !g('a.ste')) return false;
      if (need(af.postal) && !g('a.po')) return false;
      if (need(af.country) && !g('a.ct')) return false;
      return true;
    }
    case 'basicInfo:Work Info': {
      const wc = snap.workConfig || {};
      const br = !!wc.workRequired;
      const wf = wc.workFields || {};
      const need = (fld) => !!(fld?.visible !== false && (br || fld?.required === true));
      if (need(wf.company) && !g('w.co')) return false;
      if (need(wf.title) && !g('w.ti')) return false;
      if (need(wf.industry) && !g('w.ind')) return false;
      if (need(wf.teamSize) && !g('w.ts')) return false;
      return true;
    }
    case 'qualitative:Short text': {
      const st = snap.shortTextConfig || {};
      if (st.shortTextHidden) return true;
      const val = String(shortTextDraft ?? '').trim();
      if (st.shortTextRequired && !val) return false;
      const min = Math.max(0, Number(st.shortTextMinChars) || 0);
      if (val && min > 0 && val.length < min) return false;
      if (val && !validateTextValue(val, st.shortTextValidation)) return false;
      return true;
    }
    case 'qualitative:Long text': {
      const lt = snap.longTextConfig || {};
      if (lt.longTextHidden) return true;
      const val = String(longTextDraft ?? '').trim();
      if (lt.longTextRequired && !val) return false;
      const min = Math.max(0, Number(lt.longTextMinChars) || 0);
      if (val && min > 0 && val.length < min) return false;
      if (val && !validateTextValue(val, lt.longTextValidation)) return false;
      return true;
    }
    case 'choiceBased:Single': {
      const sc = snap.singleConfig || {};
      const opts = sc.singleOptions || [];
      return validateChoicePicks({
        required: !!sc.singleRequired,
        multipleSelect: !!sc.singleMultipleSelect,
        minChoices: sc.singleMinChoices,
        maxChoices: sc.singleMaxChoices,
        picks: previewPicks,
        optionCount: opts.length,
      });
    }
    case 'choiceBased:Multiple': {
      const mc = snap.multipleConfig || {};
      const opts = mc.multipleOptions || [];
      return validateChoicePicks({
        required: !!mc.multipleRequired,
        multipleSelect: !!mc.multipleMultipleSelect,
        minChoices: mc.multipleMinChoices,
        maxChoices: mc.multipleMaxChoices,
        picks: previewPicks,
        optionCount: opts.length,
      });
    }
    case 'choiceBased:Media': {
      const me = snap.mediaConfig || {};
      const opts = me.mediaOptions || [];
      return validateChoicePicks({
        required: !!me.mediaRequired,
        multipleSelect: !!me.mediaAllowMultiple,
        minChoices: me.mediaMinChoices,
        maxChoices: me.mediaMaxChoices,
        picks: previewPicks,
        optionCount: opts.length,
      });
    }
    case 'interactive:Captcha': {
      const cap = snap.captchaConfig || {};
      if (cap.captchaEnabled === false) return true;
      return !!captchaChecked;
    }
    case 'numeric:Rating':
      return !snap.ratingConfig?.ratingRequired || (ratingValue ?? 0) > 0;
    case 'numeric:Time': {
      const tc = snap.timeConfig || {};
      const sel = snap.timeSelection;
      if (!sel) return !tc.timeRequired;
      const secs = selectionToSeconds({
        hour: sel.hour,
        minute: sel.minute,
        second: sel.second ?? 0,
        period: sel.period,
        use12h: !!tc.timeUse12h,
      });
      return isTimeWithinBounds(secs, tc.timeMinTime, tc.timeMaxTime, {
        showSeconds: !!tc.timeShowSeconds,
      });
    }
    default:
      return true;
  }
}

const ContentCardInner = ({
  block,
  blockNum,
  onDelete,
  onConfigure,
  ctaConfig,
  headingConfig,
  descriptionConfig,
  imageConfig,
  imageFileInputRef,
  videoConfig,
  contactConfig,
  addressConfig,
  workConfig,
  shortTextConfig,
  longTextConfig,
  longTextResponseQualityConfig,
  shortTextResponseQualityConfig,
  singleConfig,
  multipleConfig,
  mediaConfig,
  captchaConfig,
  multiImageConfig,
  uploadConfig,
  ratingConfig,
  dateConfig,
  timeConfig,
  fullCanvas = false,
  cardColor = '#f7f6f4',
  cardImage = null,
  accentColor = DEFAULT_ACCENT,
  textColor = '#111111',
  mutedTextColor = '#888888',
  isPreviewMode = false,
  onPreviewAdvance,
  previewAutoAdvance = false,
  previewStepNav = null,
  previewScreenValidatorRef,
  onPreviewSnapChange,
  previewScreenId,
  responseQualityFormId = null,
  isIntroScreen = false,
  compactLayout = false,
}) => {
  const { section, label } = block;
  const cardKey = `${section}:${label}`;
  const qFont = (variant = 'default') => questionFontSize(compactLayout, variant);
  const grid2 = fieldGrid2Class(compactLayout);
  const listRowPad = choiceListRowPad(compactLayout);
  const accent = accentColor || DEFAULT_ACCENT;
  const primaryText = textColor || '#111111';
  const mutedText = mutedTextColor || '#888888';
  const cardTextStyle = {
    '--card-text-color': primaryText,
    '--card-text-muted': mutedText,
  };

  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [shortTextDraft, setShortTextDraft] = useState('');
  const [previewFields, setPreviewFields] = useState({});
  const [previewPicks, setPreviewPicks] = useState([]);
  const [longTextDraft, setLongTextDraft] = useState('');
  const [previewRequiredHint, setPreviewRequiredHint] = useState(false);
  const [timeSelection, setTimeSelection] = useState(null);

  const shortTextMaxCap = shortTextConfig?.shortTextMaxChars ?? 100;
  const shortTextCapRef = useRef(shortTextMaxCap);
  if (shortTextCapRef.current !== shortTextMaxCap) {
    shortTextCapRef.current = shortTextMaxCap;
    setShortTextDraft((d) => (d.length > shortTextMaxCap ? d.slice(0, shortTextMaxCap) : d));
  }

  const pf = (key, def = '') => previewFields[key] ?? def;
  const setPf = (key, val) => setPreviewFields((prev) => ({ ...prev, [key]: val }));

  const previewAutoAdvanceRef = useRef(previewAutoAdvance);
  previewAutoAdvanceRef.current = previewAutoAdvance;

  const togglePreviewPick = (optLabel, allowMultiple, maxChoices = null) => {
    setPreviewPicks((prev) => {
      let next;
      if (allowMultiple) {
        if (prev.includes(optLabel)) next = prev.filter((x) => x !== optLabel);
        else {
          const max = maxChoices == null ? Infinity : Number(maxChoices);
          if (getChoicePickCount(prev) >= max) return prev;
          next = [...prev, optLabel];
        }
      } else {
        next = prev.includes(optLabel) ? [] : [optLabel];
      }
      if (
        !allowMultiple &&
        previewAutoAdvanceRef.current &&
        onPreviewAdvance &&
        next.length > 0 &&
        !prev.includes(optLabel)
      ) {
        queueMicrotask(() => onPreviewAdvance());
      }
      return next;
    });
  };

  const singleOptsKey = (singleConfig?.singleOptions || []).join('\x1e');
  const singleDisplayOpts = useMemo(() => {
    const sc = singleConfig || {};
    const opts = sc.singleOptions || ['Social media', 'Search engine', 'Friend / colleague', 'Advertisement'];
    const allowOther = sc.singleAllowOther ?? true;
    const base = allowOther ? [...opts, 'Other'] : [...opts];
    return sc.singleRandomize ? shuffleArray(base) : base;
  }, [singleOptsKey, singleConfig?.singleAllowOther, singleConfig?.singleRandomize]);

  const multipleOptsKey = (multipleConfig?.multipleOptions || []).join('\x1e');
  const multipleDisplayOpts = useMemo(() => {
    const mc = multipleConfig || {};
    const opts = mc.multipleOptions || ['Dashboard', 'Reports', 'Integrations', 'Analytics'];
    const allowOther = mc.multipleAllowOther ?? false;
    const base = allowOther ? [...opts, 'Other'] : [...opts];
    return mc.multipleRandomize ? shuffleArray(base) : base;
  }, [multipleOptsKey, multipleConfig?.multipleAllowOther, multipleConfig?.multipleRandomize]);

  const mediaOptsKey = (mediaConfig?.mediaOptions || []).map((o) => o?.label ?? '').join('\x1e');
  const mediaDisplayOpts = useMemo(() => {
    const opts = mediaConfig?.mediaOptions || [];
    return mediaConfig?.mediaRandomiseOrder ? shuffleArray([...opts]) : opts;
  }, [mediaOptsKey, mediaConfig?.mediaRandomiseOrder]);

  const longTextQualityEnabled =
    isPreviewMode && cardKey === 'qualitative:Long text' && longTextResponseQualityConfig?.enabled;
  const shortTextQualityEnabled =
    isPreviewMode && cardKey === 'qualitative:Short text' && shortTextResponseQualityConfig?.enabled;

  const longTextQualityEvaluation = useResponseQualityEvaluation({
    enabled: longTextQualityEnabled,
    options: longTextResponseQualityConfig?.options,
    fieldKind: 'longText',
    question: longTextConfig?.longTextQuestion,
    helperText: longTextConfig?.longTextHelperText,
    answerText: longTextDraft,
    formId: responseQualityFormId,
    screenId: previewScreenId,
  });

  const shortTextQualityEvaluation = useResponseQualityEvaluation({
    enabled: shortTextQualityEnabled,
    options: shortTextResponseQualityConfig?.options,
    fieldKind: 'shortText',
    question: shortTextConfig?.shortTextQuestion,
    helperText: shortTextConfig?.shortTextHelperText,
    answerText: shortTextDraft,
    formId: responseQualityFormId,
    screenId: previewScreenId,
  });

  const responseQualityEvaluation = longTextQualityEnabled
    ? longTextQualityEvaluation
    : shortTextQualityEnabled
      ? shortTextQualityEvaluation
      : null;

  const snapRef = useRef({});
  snapRef.current = {
    cardKey,
    previewFields,
    shortTextDraft,
    longTextDraft,
    previewPicks,
    captchaChecked,
    ratingValue,
    headingConfig,
    videoConfig,
    contactConfig,
    addressConfig,
    workConfig,
    shortTextConfig,
    longTextConfig,
    singleConfig,
    multipleConfig,
    mediaConfig,
    captchaConfig,
    ratingConfig,
    dateConfig,
    timeConfig,
    timeSelection,
  };

  useEffect(() => {
    setPreviewRequiredHint(false);
  }, [previewFields, shortTextDraft, longTextDraft, previewPicks, captchaChecked, ratingValue]);

  useEffect(() => {
    if (!isPreviewMode || !onPreviewSnapChange || previewScreenId == null) return;
    onPreviewSnapChange(previewScreenId, snapRef.current);
  }, [
    isPreviewMode,
    onPreviewSnapChange,
    previewScreenId,
    previewFields,
    shortTextDraft,
    longTextDraft,
    previewPicks,
    captchaChecked,
    ratingValue,
    timeSelection,
  ]);

  useEffect(() => {
    if (!previewScreenValidatorRef) return undefined;

    if (!isPreviewMode) {
      previewScreenValidatorRef.current = null;
      return undefined;
    }

    previewScreenValidatorRef.current = null;
    if (cardKey === 'interactive:Multi-image upload') {
      return () => {
        previewScreenValidatorRef.current = null;
      };
    }

    previewScreenValidatorRef.current = () => {
      const ok = isPreviewAdvanceAllowed(snapRef.current);
      setPreviewRequiredHint(!ok);
      return ok;
    };
    return () => {
      previewScreenValidatorRef.current = null;
    };
  }, [isPreviewMode, cardKey, previewScreenValidatorRef]);

  let content;

  if (cardKey === 'buildingBlocks:CTA') {
    const cc = ctaConfig || {};
    const btnLabel     = cc.ctaButtonLabel  ?? 'Get started';
    const btnSize      = cc.ctaButtonSize   ?? 'M';
    const btnStyle     = cc.ctaButtonStyle  ?? 'Filled';
    const btnRadius    = cc.ctaCornerRadius ?? 10;
    const showIcon     = cc.ctaShowIcon     ?? true;
    const headingSize  = cc.ctaHeadingSize  ?? 32;
    const bodySize     = cc.ctaBodySize     ?? 15;
    const fontWeight   = cc.ctaFontWeight   ?? 'Regular';
    const textAlign    = cc.ctaTextAlign    ?? 'center';
    const padding      = cc.ctaPadding      ?? 44;
    const mainHeading  = cc.ctaHeadingText ?? 'Welcome to our survey';
    const helperText   = cc.ctaHelperText  ?? 'Please fill out this form to help us improve. It only takes a couple of minutes and your feedback matters.';
    const durationText = cc.ctaDurationText ?? 'Takes ~3 minutes';

    const btnSizePxMap  = { S: { px: '14px', py: '8px', text: '14px' }, M: { px: '28px', py: '12px', text: '15px' }, L: { px: '36px', py: '14px', text: '16px' }, XL: { px: '44px', py: '16px', text: '18px' } };
    const { px: bPx, py: bPy, text: bText } = btnSizePxMap[btnSize] || btnSizePxMap['M'];
    const fontWeightMap = { Light: '300', Regular: '500', Bold: '700' };
    const textAlignClass = textAlign === 'center' ? 'text-center' : textAlign === 'right' ? 'text-right' : 'text-left';

    const isFilled  = btnStyle === 'Filled';
    const isOutline = btnStyle === 'Outline';
    const isGhost   = btnStyle === 'Ghost';
    const accent    = cc.ctaBtnColor ?? '#111';
    const btnBg     = isFilled ? accent : 'transparent';
    const btnColor  = cc.ctaTextColor
      ?? (cc.ctaLabelColor === 'black' ? '#111' : '#fff');
    const btnBorder = isOutline || isGhost ? `1.5px solid ${accent}` : 'none';
    const effectiveBtnColor = isGhost ? accent : btnColor;
    const contentMaxWidth = CTA_CONTENT_WIDTH_MAP[cc.ctaContentWidth] || CTA_CONTENT_WIDTH_MAP.Default;

    content = (
      <>
        <div
          className={`flex-1 flex flex-col items-center justify-center gap-[9px] ${cardBodyPadXClass(compactLayout)} ${textAlignClass}`}
          style={{ paddingTop: padding, paddingBottom: padding }}
        >
          <div className="bg-[#111] w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0">
            <BoxesIcon size={18} className="text-white" />
          </div>
          <div className="pt-[11px] w-full mx-auto" style={{ maxWidth: contentMaxWidth }}>
            <InlineEditableField
              value={cc.ctaHeadingText ?? ''}
              onChange={cc.setCtaHeadingText}
              disabled={isPreviewMode}
              className={`tracking-[-0.56px] leading-[1.3] w-full ${textAlignClass}`}
              style={{ fontSize: headingSize, fontWeight: fontWeightMap[fontWeight], color: primaryText }}
              placeholder={mainHeading}
              aria-label="CTA heading"
            />
          </div>
          <div className={`w-full mx-auto ${textAlignClass}`} style={{ maxWidth: contentMaxWidth }}>
            <InlineEditableField
              multiline
              rows={3}
              value={cc.ctaHelperText ?? ''}
              onChange={cc.setCtaHelperText}
              disabled={isPreviewMode}
              className={`font-light leading-[1.6] w-full ${textAlignClass}`}
              style={{ fontSize: bodySize, color: mutedText }}
              placeholder={helperText}
              aria-label="CTA description"
            />
          </div>
          {isPreviewMode ? (
            <button
              type="button"
              onClick={() => onPreviewAdvance?.()}
              className={`flex gap-[7px] items-center justify-center mt-2 cursor-pointer ${compactLayout ? 'w-full max-w-full' : ''}`}
              style={{
                background: btnBg,
                color: effectiveBtnColor,
                border: btnBorder,
                borderRadius: `${btnRadius}px`,
                paddingLeft: bPx,
                paddingRight: bPx,
                paddingTop: bPy,
                paddingBottom: bPy,
              }}
            >
              <span style={{ fontSize: bText, fontWeight: '500' }}>{btnLabel}</span>
              {showIcon && <RiArrowRightLine size={12} style={{ color: effectiveBtnColor }} />}
            </button>
          ) : (
            <div
              className="flex gap-[7px] items-center mt-2"
              style={{
                background: btnBg,
                color: effectiveBtnColor,
                border: btnBorder,
                borderRadius: `${btnRadius}px`,
                paddingLeft: bPx,
                paddingRight: bPx,
                paddingTop: bPy,
                paddingBottom: bPy,
              }}
            >
              <span style={{ fontSize: bText, fontWeight: '500' }}>{btnLabel}</span>
              {showIcon && <RiArrowRightLine size={12} style={{ color: effectiveBtnColor }} />}
            </div>
          )}
          <div className="flex gap-[5px] items-center justify-center pt-[5px]">
            <RiTimeLine size={12} className="text-black shrink-0" />
            <InlineEditableField
              value={cc.ctaDurationText ?? ''}
              onChange={cc.setCtaDurationText}
              disabled={isPreviewMode}
              className="text-[12px] text-black text-center min-w-[120px]"
              placeholder={durationText}
              aria-label="Estimated duration"
            />
          </div>
        </div>
        {!isPreviewMode && (
          <ContentCardFooter
            onDelete={onDelete}
            onConfigure={onConfigure ? () => onConfigure(label) : undefined}
            variant="field"
            accentColor={accent}
            compactLayout={compactLayout}
          />
        )}
      </>
    );
  } else if (cardKey === 'buildingBlocks:Heading') {
    const hc = headingConfig || {};
    const hText = hc.headingText || 'Tell us about yourself';
    const hLevel = hc.headingLevel || 'H2';
    const hSize = hc.headingTextSize || 'M';
    const hAlign = hc.headingAlignment || 'left';
    const hHidden = !!hc.headingHidden;
    const hRequired = !!hc.headingRequired;
    const textAlignClass = hAlign === 'center' ? 'text-center' : hAlign === 'right' ? 'text-right' : 'text-left';
    // Heading level controls the heading title size
    const headingLevelSizeMap = { H1: '40px', H2: '32px', H3: '26px', H4: '20px' };
    const headingLevelWeightMap = { H1: '700', H2: '600', H3: '600', H4: '500' };
    const hTitleWeight = HEADING_FONT_WEIGHT_MAP[hc.headingFontWeight] ?? headingLevelWeightMap[hLevel];
    // Text size controls the answer textarea font size
    const answerTextSizeMap = { S: '15px', M: '17px', L: '20px', XL: '24px' };
    content = (
      <>
        <CardBody compactLayout={compactLayout} className={`relative flex-1 gap-3 ${hHidden && !isPreviewMode ? 'opacity-40' : ''} ${hHidden && isPreviewMode ? 'hidden' : ''}`}>
          <HiddenFieldOverlay show={hHidden && !isPreviewMode} />
          <CanvasBadgeText
            value={hc.subHeading ?? ''}
            onChange={hc.setSubHeading}
            isPreviewMode={isPreviewMode}
            align={hAlign}
          />

          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 w-full ${
              hAlign === 'center' ? 'justify-center' : 'justify-between'
            }`}
          >
            <CanvasQuestionText
              value={hc.headingText ?? ''}
              onChange={hc.setHeadingText}
              isPreviewMode={isPreviewMode}
              required={hRequired}
              align={hAlign}
              fontSize={headingLevelSizeMap[hLevel]}
              fontWeight={hTitleWeight}
              className={`tracking-[-0.52px] ${hAlign === 'center' ? '' : 'flex-1'}`}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>

          {/* Answer area — size driven by Text Size; pinned to bottom, grows upward as content fills */}
          <div className={`flex-1 flex flex-col justify-end pb-2 pt-4 ${hHidden && isPreviewMode ? 'hidden' : ''}`}>
            {isPreviewMode ? (
              <textarea
                value={pf('headingAns')}
                onChange={(e) => setPf('headingAns', e.target.value)}
                rows={1}
                className={respondentTextareaClass(`resize-none ${textAlignClass}`)}
                style={{ fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', fontSize: answerTextSizeMap[hSize] }}
                placeholder="Type your answer here…"
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
            ) : (
              <div className="border-b border-[#111] pb-[11px] pt-[10px]">
                <InlineEditableField
                  multiline
                  rows={1}
                  value={hc.headingAnswerText ?? ''}
                  onChange={hc.setHeadingAnswerText}
                  disabled={isPreviewMode}
                  className={`font-light w-full leading-[1.6] pb-0 pt-0 ${textAlignClass} ${hc.headingAnswerText ? 'text-[#333]' : 'text-[#aaa]'}`}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: answerTextSizeMap[hSize] }}
                  placeholder="Type your answer here…"
                  aria-label="Sample answer placeholder"
                />
              </div>
            )}
          </div>
        </CardBody>
        {!isPreviewMode && (
          <ContentCardFooter
            onDelete={onDelete}
            onConfigure={onConfigure ? () => onConfigure(label) : undefined}
            variant="field"
            accentColor={accent}
            compactLayout={compactLayout}
          />
        )}
      </>
    );
  } else if (cardKey === 'buildingBlocks:Description') {
    const dc = descriptionConfig || {};
    const dcContent = dc.descriptionContent || 'This field is required only if you are currently employed full time. If not, you can skip ahead to the next section.';
    const dcSize = dc.descriptionTextSize || 'M';
    const dcAlign = dc.descriptionAlignment || 'left';
    const dcFormatting = dc.descriptionFormatting || {};
    const dcHidden = !!dc.descriptionHidden;
    const dcShowCharCount = dc.descriptionShowCharCount || false;
    const dcCharLimit = dc.descriptionCharLimit || '';
    const fontSizeMap = { S: '16px', M: '18px', L: '20px' };
    const textAlignClass = dcAlign === 'center' ? 'text-center' : dcAlign === 'right' ? 'text-right' : 'text-left';
    const contentStyle = {
      fontSize: fontSizeMap[dcSize],
      fontWeight: dcFormatting.bold ? '600' : '400',
      fontStyle: dcFormatting.italic ? 'italic' : 'normal',
      textDecoration: dcFormatting.underline ? 'underline' : 'none',
    };
    content = (
      <div className={`relative flex-1 flex flex-col ${dcHidden && !isPreviewMode ? 'opacity-40' : ''} ${dcHidden && isPreviewMode ? 'hidden' : ''}`}>
        <HiddenFieldOverlay show={dcHidden && !isPreviewMode} />
        <div className={`flex-1 flex flex-col gap-[8px] ${compactLayout ? 'px-5 pt-7 pb-4' : 'px-[28px] pt-[32px] pb-[20px]'}`}>
          {/* Block type label */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 w-full">
            <span
              className="text-[13px] font-semibold tracking-[1.4px] uppercase text-black"
              style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
            >
              Description
            </span>
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          {/* Instruction sub-label */}
          <div className="pt-[2px]">
            <span
              className="text-[#6b6860] text-[12px] font-semibold tracking-[0.66px] uppercase"
              style={{ fontFamily: "'Geist', sans-serif" }}
            >
              INSTRUCTION
            </span>
          </div>
          {/* Description content in vertical border */}
          <div className="border-l-2 border-[#e4e2dc] pl-[14px] py-[2px]">
            {isPreviewMode ? (
              renderDescriptionContent(dcContent, dcFormatting, textAlignClass, contentStyle)
            ) : (
              <InlineEditableField
                multiline
                rows={4}
                value={dc.descriptionContent ?? ''}
                onChange={dc.setDescriptionContent}
                disabled={isPreviewMode}
                className={`text-[#6b6860] leading-[23px] w-full ${textAlignClass}`}
                style={{ ...contentStyle, fontFamily: "'Geist', sans-serif" }}
                placeholder={dcContent}
                aria-label="Description instruction"
              />
            )}
          </div>
        </div>
        {/* Input area + gray line just above footer */}
        <div className={`${compactLayout ? 'px-5' : 'px-[28px]'} pt-[4px] pb-[0px] ${dcHidden && isPreviewMode ? 'hidden' : ''}`}>
          {isPreviewMode ? (
            <textarea
              value={pf('descAns')}
              onChange={(e) => setPf('descAns', dcCharLimit ? e.target.value.slice(0, Number(dcCharLimit) || 5000) : e.target.value)}
              rows={2}
              placeholder="Type your answer here…"
              className={respondentTextareaClass(`text-[17px] resize-none ${textAlignClass}`)}
              style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
            />
          ) : (
            <div className="border-b border-[#111] pb-[11px]">
              <p
                className={`text-black text-[17px] font-light ${textAlignClass}`}
                style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
              >
                Type your answer here…
              </p>
            </div>
          )}
          {dcShowCharCount && (
            <div className="flex justify-end mt-[4px]">
              <span className="text-[#bbb] text-[11px]">
                {(isPreviewMode ? pf('descAns').length : 0)}{dcCharLimit ? ` / ${dcCharLimit}` : ''}
              </span>
            </div>
          )}
          <div className="h-px bg-[#e4e2dc] mt-[14px]" />
        </div>
        {/* Footer */}
        {!isPreviewMode && (
          <ContentCardFooter
            onDelete={onDelete}
            onConfigure={onConfigure ? () => onConfigure(label) : undefined}
            variant="field"
            accentColor={accent}
            compactLayout={compactLayout}
          />
        )}
      </div>
    );
  } else if (cardKey === 'buildingBlocks:Images') {
    const ic = imageConfig || {};
    const imgPreview = ic.imagePreview || null;
    const imgAltText = ic.imageAltText || '';
    const imgCaption = ic.imageCaption || '';
    const imgAlignment = ic.imageAlignment || 'left';
    const imgWidth = ic.imageWidth || 'Full';
    const imgCornerRadius = ic.imageCornerRadius ?? 8;
    const imgQuestion = ic.imageQuestion || 'What do you see in this image?';
    const imgDescription = ic.imageDescription || "Describe what's happening in the photo above.";
    const imgLinkOnClick = ic.imageLinkOnClick || false;
    const imgLinkUrl = ic.imageLinkUrl || '';
    const imgOpenInNewTab = ic.imageOpenInNewTab || false;
    const imgAnswerText = ic.imageAnswerText || '';
    const imgHidden = !!ic.imageHidden;

    const alignClass = imgAlignment === 'center' ? 'items-center' : imgAlignment === 'right' ? 'items-end' : 'items-start';
    const imgWidthStyle = imgWidth === 'Fit' ? { width: 'auto', maxWidth: '100%' } : imgWidth === 'Custom' ? { width: '60%' } : { width: '100%' };

    const imageArea = imgPreview ? (
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: imgCornerRadius, ...imgWidthStyle }}
      >
        {imgLinkOnClick && imgLinkUrl ? (
          <a href={imgLinkUrl} target={imgOpenInNewTab ? '_blank' : '_self'} rel="noreferrer">
            <img
              src={imgPreview}
              alt={imgAltText || 'Uploaded image'}
              className="w-full object-cover"
              style={{ borderRadius: imgCornerRadius }}
            />
          </a>
        ) : (
          <img
            src={imgPreview}
            alt={imgAltText || 'Uploaded image'}
            className="w-full object-cover"
            style={{ borderRadius: imgCornerRadius }}
          />
        )}
        {/* Replace / Remove overlay buttons */}
        {!isPreviewMode && (
        <div className="absolute top-[10px] right-[10px] flex gap-[6px]">
          <button
            onClick={() => imageFileInputRef && imageFileInputRef.current && imageFileInputRef.current.click()}
            className="flex gap-[5px] items-center px-[11px] py-[6px] rounded-[20px] bg-white/88 border border-[rgba(0,0,0,0.1)] text-[#444] text-[11px] font-medium backdrop-blur-sm cursor-pointer hover:bg-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.88)' }}
          >
            <RiPencilLine size={11} className="shrink-0" />
            Replace
          </button>
          <button
            onClick={() => ic.onRemoveImage && ic.onRemoveImage()}
            className="flex gap-[5px] items-center px-[11px] py-[6px] rounded-[20px] border border-[rgba(0,0,0,0.1)] text-[#d63030] text-[11px] font-medium backdrop-blur-sm cursor-pointer hover:bg-red-50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.88)' }}
          >
            <RiDeleteBin6Line size={11} className="shrink-0" />
            Remove
          </button>
        </div>
        )}
        {/* File info bar */}
        <div className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]">
          <InlineEditableField
            value={imgCaption}
            onChange={ic.setImageCaption}
            disabled={isPreviewMode}
            className="text-[11px] text-black font-light w-full"
            placeholder="image.jpg · uploaded"
            aria-label="Image caption"
          />
        </div>
      </div>
    ) : isPreviewMode ? (
      <div
        className={`bg-[#eceae6] overflow-hidden`}
        style={{ borderRadius: imgCornerRadius, ...imgWidthStyle }}
      >
        <div className="flex flex-col items-center justify-center py-[90px] gap-[10px]">
          <ImagesCardIcon size={32} className="text-[#aaa]" />
          <p className="text-[12px] text-black font-light">No image (builder preview)</p>
        </div>
        <div className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]">
          <p className="text-[11px] text-black font-light">The author will add an image here</p>
        </div>
      </div>
    ) : (
      <button
        onClick={() => imageFileInputRef && imageFileInputRef.current && imageFileInputRef.current.click()}
        className={`bg-[#eceae6] overflow-hidden cursor-pointer hover:bg-[#e4e2de] transition-colors`}
        style={{ borderRadius: imgCornerRadius, ...imgWidthStyle }}
      >
        <div className="flex flex-col items-center justify-center py-[90px] gap-[10px]">
          <ImagesCardIcon size={32} className="text-[#aaa]" />
          <p className="text-[12px] text-black font-light">Image preview</p>
        </div>
        <div className="bg-[rgba(0,0,0,0.03)] border-t border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]">
          <p className="text-[11px] text-black font-light">Click to upload an image</p>
        </div>
      </button>
    );

    content = (
      <CardBody
        compactLayout={compactLayout}
        className={`relative shrink-0 ${imgHidden && !isPreviewMode ? 'opacity-40' : ''} ${imgHidden && isPreviewMode ? 'hidden' : ''}`}
      >
        <HiddenFieldOverlay show={imgHidden && !isPreviewMode} />
        <SectionBadge num={blockNum} label="Short text + Image" />
        <div className={`flex flex-col pt-[10px] ${alignClass}`}>
          {imageArea}
        </div>
        <div className="pt-[15px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <CanvasQuestionText
            value={ic.imageQuestion ?? ''}
            onChange={ic.setImageQuestion}
            isPreviewMode={isPreviewMode}
            fontSize={qFont()}
          />
          <PreviewRequiredInline show={previewRequiredHint} />
        </div>
        <CanvasHelperText
          value={ic.imageDescription ?? ''}
          onChange={ic.setImageDescription}
          isPreviewMode={isPreviewMode}
          className="mb-[19.8px] leading-[20.8px]"
        />
        {isPreviewMode ? (
          <textarea
            value={pf('imgAns')}
            onChange={(e) => setPf('imgAns', e.target.value.slice(0, 200))}
            rows={2}
            placeholder="Type your answer here…"
            className={respondentTextareaClass('text-[15px] resize-none')}
          />
        ) : (
          <div className="border-b border-[rgba(0,0,0,0.16)] pb-[11px] pt-[10px]">
            <p className="text-black text-[15px] font-light">{imgAnswerText || 'Type your answer here…'}</p>
          </div>
        )}
        <div className="flex items-center justify-between pt-[4px] pb-[18px]">
          <span className="text-[11px] text-black font-light">Press Enter ↵ to continue</span>
          <span className="text-[11px] text-black">{isPreviewMode ? `${pf('imgAns').length}` : '0'} / 200</span>
        </div>
        {!isPreviewMode && (
          <>
            <div className={`border-t border-[rgba(0,0,0,0.1)] flex gap-[7px] items-center pt-[12px] ${cardBodyPadXClass(compactLayout)}`}>
              <button
                type="button"
                onClick={() => imageFileInputRef && imageFileInputRef.current && imageFileInputRef.current.click()}
                className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-white/70 border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
              >
                <ImagesCardIcon size={12} className="shrink-0" />
                Change image
              </button>
            </div>
            <ContentCardFooter
              onDelete={onDelete}
              onConfigure={onConfigure ? () => onConfigure(label) : undefined}
              variant="field"
              accentColor={accent}
              compactLayout={compactLayout}
            />
          </>
        )}
      </CardBody>
    );
  } else if (cardKey === 'buildingBlocks:Video') {
    const vc = videoConfig || {};
    const vUrl = vc.videoUrl || '';
    const vQuestion = vc.videoQuestion || 'After watching the video, what are your thoughts?';
    const vDescription = vc.videoDescription || 'Share your honest feedback about the product demo.';
    const vCaption = vc.videoCaption || '';
    const vCornerRadius = vc.videoCornerRadius ?? 8;
    const vHidden = !!vc.videoHidden;
    const vRequired = !!vc.videoRequired;
    const vSource = vc.videoSource || 'youtube';
    const vWidth = vc.videoWidth || 'Full';
    const vAspectRatio = vc.videoAspectRatio || '16:9';
    const vAutoplay = !!vc.videoAutoplay;
    const vLoop = !!vc.videoLoop;
    const vShowControls = vc.videoShowControls !== false;
    const sourceLabel = vSource === 'vimeo' ? 'Vimeo' : 'YouTube';
    const videoWidthStyle = VIDEO_WIDTH_STYLES[vWidth] || VIDEO_WIDTH_STYLES.Full;
    const aspectRatioCss = VIDEO_ASPECT_RATIO_MAP[vAspectRatio] || VIDEO_ASPECT_RATIO_MAP['16:9'];
    const parsedVideo = parseVideoEmbed(vUrl, vSource);
    const embedUrl = buildVideoEmbedUrl(parsedVideo, {
      autoplay: vAutoplay,
      loop: vLoop,
      showControls: vShowControls,
    });
    const hasUrl = !!vUrl.trim();
    const urlMismatch = hasUrl && !parsedVideo;
    content = (
      <>
        <CardBody
          compactLayout={compactLayout}
          className={`relative shrink-0 ${vHidden && !isPreviewMode ? 'opacity-40' : ''} ${vHidden && isPreviewMode ? 'hidden' : ''}`}
        >
          <HiddenFieldOverlay show={vHidden && !isPreviewMode} />
          <SectionBadge num={blockNum} label="Video with question" />
          <div className="pt-[10px] mb-4" style={videoWidthStyle}>
            <div className="overflow-hidden" style={{ borderRadius: vCornerRadius, border: '1px solid rgba(0,0,0,0.1)' }}>
              {embedUrl ? (
                <>
                  <iframe
                    src={embedUrl}
                    className="w-full"
                    style={{ aspectRatio: aspectRatioCss, display: 'block' }}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={vCaption || vQuestion}
                  />
                  <div className="bg-[rgba(0,0,0,0.02)] border-t border-[rgba(0,0,0,0.07)] px-3 py-[7px] flex items-center justify-between gap-2">
                    <InlineEditableField
                      value={vCaption}
                      onChange={vc.setVideoCaption}
                      disabled={isPreviewMode}
                      className="text-[11px] text-[#888] flex-1 min-w-0"
                      placeholder="Video"
                      aria-label="Video caption"
                    />
                    {(vAutoplay || vLoop || !vShowControls) && (
                      <span className="text-[10px] text-[#aaa] shrink-0">
                        {[vAutoplay && 'Autoplay', vLoop && 'Loop', !vShowControls && 'No controls'].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#eceae6] flex flex-col items-center justify-center py-16 gap-3 px-6">
                    <VideoCardIcon size={28} className="text-[#aaa]" />
                    <p className="text-[#888] text-[15px] text-center">
                      {urlMismatch
                        ? `URL doesn't match ${sourceLabel} — check Video Source`
                        : `Paste a ${sourceLabel} URL`}
                    </p>
                  </div>
                  <div className="bg-[rgba(0,0,0,0.02)] border-t border-[rgba(0,0,0,0.07)] px-3 py-[7px]">
                    <InlineEditableField
                      value={vCaption}
                      onChange={vc.setVideoCaption}
                      disabled={isPreviewMode}
                      className="text-[11px] text-[#888] w-full"
                      placeholder="Click to configure video"
                      aria-label="Video caption"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="pt-[4px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={vc.videoQuestion ?? ''}
              onChange={vc.setVideoQuestion}
              isPreviewMode={isPreviewMode}
              required={vRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={vc.videoDescription ?? ''}
            onChange={vc.setVideoDescription}
            isPreviewMode={isPreviewMode}
            className="mb-[15px]"
          />
          {isPreviewMode ? (
            <textarea
              value={pf('videoAns')}
              onChange={(e) => setPf('videoAns', e.target.value.slice(0, 500))}
              placeholder="Type your answer here…"
              className={respondentTextareaClass('mb-3')}
            />
          ) : (
            <div className="border border-[rgba(0,0,0,0.1)] rounded-[8px] px-4 py-3 min-h-[80px] mb-3">
              <p className="text-[#bbb] text-[14px] font-light">Type your answer here…</p>
            </div>
          )}
          <div className="flex justify-between items-center pb-[14px]">
            <span className="text-[11px] text-[#bbb]">Press Enter ↵ to continue</span>
            <span className="text-[11px] text-[#bbb]">{isPreviewMode ? pf('videoAns').length : 0} / 500</span>
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'basicInfo:Contact') {
    const cc = contactConfig || {};
    const cQuestion = cc.contactQuestion || 'How can we get in touch?';
    const cHelperText = cc.contactHelperText || "We'll only reach out if we have a follow-up question.";
    const cBlockRequired = !!cc.contactRequired;
    const cFields = cc.contactFields || { firstName: { visible: true }, lastName: { visible: true }, email: { visible: true }, phone: { visible: true }, company: { visible: false } };
    const cReq = (fld) => isCompositeFieldRequired(cBlockRequired, fld);
    const cLabel = (name, fld) => `${name}${cReq(fld) ? ' *' : ''}`;
    const showFirst = cFields.firstName?.visible !== false;
    const showLast = cFields.lastName?.visible !== false;
    const showEmail = cFields.email?.visible !== false;
    const showPhone = cFields.phone?.visible !== false;
    const showCompany = cFields.company?.visible !== false;
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Contact" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={cc.contactQuestion ?? ''}
              onChange={cc.setContactQuestion}
              isPreviewMode={isPreviewMode}
              required={cBlockRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={cc.contactHelperText ?? ''}
            onChange={cc.setContactHelperText}
            isPreviewMode={isPreviewMode}
            className="mb-[19px]"
          />
          {(showFirst || showLast) && (
            <div className={grid2}>
              {showFirst && (isPreviewMode ? (
                <PreviewLabeledInput
                  label={cLabel('FIRST NAME', cFields.firstName)}
                  value={pf('c.fn')}
                  onChange={(v) => setPf('c.fn', v)}
                  placeholder=""
                />
              ) : (
                <FormField label={cLabel('FIRST NAME', cFields.firstName)} value="Jane" />
              ))}
              {showLast && (isPreviewMode ? (
                <PreviewLabeledInput
                  label={cLabel('LAST NAME', cFields.lastName)}
                  value={pf('c.ln')}
                  onChange={(v) => setPf('c.ln', v)}
                  placeholder=""
                />
              ) : (
                <FormField label={cLabel('LAST NAME', cFields.lastName)} value="Smith" />
              ))}
            </div>
          )}
          {showEmail && (
            <div className="mt-[9px]">
              {isPreviewMode ? (
                <PreviewLabeledInput
                  label={cLabel('EMAIL ADDRESS', cFields.email)}
                  value={pf('c.em')}
                  onChange={(v) => setPf('c.em', v)}
                  placeholder="you@example.com"
                  type="email"
                />
              ) : (
                <FormField label={cLabel('EMAIL ADDRESS', cFields.email)} value="jane@example.com" />
              )}
            </div>
          )}
          {showPhone && (
            <div className="mt-[9px]">
              {isPreviewMode ? (
                <PreviewLabeledInput
                  label={cReq(cFields.phone) ? cLabel('PHONE', cFields.phone) : 'PHONE (OPTIONAL)'}
                  value={pf('c.ph')}
                  onChange={(v) => setPf('c.ph', v)}
                  placeholder=""
                  type="tel"
                />
              ) : (
                <FormField label={cReq(cFields.phone) ? cLabel('PHONE', cFields.phone) : 'PHONE (OPTIONAL)'} value="+1 (555) 000-0000" />
              )}
            </div>
          )}
          {showCompany && (
            <div className="mt-[9px]">
              {isPreviewMode ? (
                <PreviewLabeledInput
                  label={cLabel('COMPANY', cFields.company)}
                  value={pf('c.co')}
                  onChange={(v) => setPf('c.co', v)}
                  placeholder=""
                />
              ) : (
                <FormField label={cLabel('COMPANY', cFields.company)} value="Acme Inc." />
              )}
            </div>
          )}
          <div className="pb-[17px]" />
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'basicInfo:Address') {
    const ac = addressConfig || {};
    const aQuestion = ac.addressQuestion || "What's your mailing address?";
    const aHelperText = ac.addressHelperText || '';
    const aBlockRequired = !!ac.addressRequired;
    const aFields = ac.addressFields || { street: { visible: true }, city: { visible: true }, state: { visible: true }, postal: { visible: true }, country: { visible: true } };
    const aReq = (fld) => isCompositeFieldRequired(aBlockRequired, fld);
    const aLabel = (name, fld) => `${name}${aReq(fld) ? ' *' : ''}`;
    const showStreet = aFields.street?.visible !== false;
    const showCity = aFields.city?.visible !== false;
    const showState = aFields.state?.visible !== false;
    const showPostal = aFields.postal?.visible !== false;
    const showCountry = aFields.country?.visible !== false;
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Address" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={ac.addressQuestion ?? ''}
              onChange={ac.setAddressQuestion}
              isPreviewMode={isPreviewMode}
              required={aBlockRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={ac.addressHelperText ?? ''}
            onChange={ac.setAddressHelperText}
            isPreviewMode={isPreviewMode}
          />
          {showStreet && (
            <div className="mt-[19px]">
              {isPreviewMode ? (
                <PreviewLabeledInput
                  label={aLabel('STREET ADDRESS', aFields.street)}
                  value={pf('a.st')}
                  onChange={(v) => setPf('a.st', v)}
                  placeholder=""
                />
              ) : (
                <FormField label={aLabel('STREET ADDRESS', aFields.street)} value="123 Main Street" />
              )}
            </div>
          )}
          {(showCity || showState) && (
            <div className={`${grid2} mt-[9px]`}>
              {showCity && (isPreviewMode ? (
                <PreviewLabeledInput label={aLabel('CITY', aFields.city)} value={pf('a.ci')} onChange={(v) => setPf('a.ci', v)} />
              ) : (
                <FormField label={aLabel('CITY', aFields.city)} value="San Francisco" />
              ))}
              {showState && (isPreviewMode ? (
                <PreviewLabeledInput label={aLabel('STATE / REGION', aFields.state)} value={pf('a.ste')} onChange={(v) => setPf('a.ste', v)} />
              ) : (
                <FormField label={aLabel('STATE / REGION', aFields.state)} value="California" />
              ))}
            </div>
          )}
          {(showPostal || showCountry) && (
            <div className={`${grid2} mt-[9px] pb-[17px]`}>
              {showPostal && (isPreviewMode ? (
                <PreviewLabeledInput label={aLabel('POSTAL CODE', aFields.postal)} value={pf('a.po')} onChange={(v) => setPf('a.po', v)} />
              ) : (
                <FormField label={aLabel('POSTAL CODE', aFields.postal)} value="94103" />
              ))}
              {showCountry && (isPreviewMode ? (
                <PreviewLabeledInput label={aLabel('COUNTRY', aFields.country)} value={pf('a.ct')} onChange={(v) => setPf('a.ct', v)} />
              ) : (
                <FormField label={aLabel('COUNTRY', aFields.country)} value="United States" />
              ))}
            </div>
          )}
          {!showPostal && !showCountry && <div className="pb-[17px]" />}
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'basicInfo:Work Info') {
    const wc = workConfig || {};
    const wQuestion = wc.workQuestion || 'Tell us about your role';
    const wHelperText = wc.workHelperText || '';
    const wBlockRequired = !!wc.workRequired;
    const wFields = wc.workFields || { company: { visible: true }, title: { visible: true }, industry: { visible: true }, teamSize: { visible: true } };
    const wReq = (fld) => isCompositeFieldRequired(wBlockRequired, fld);
    const wLabel = (name, fld) => `${name}${wReq(fld) ? ' *' : ''}`;
    const showWCompany = wFields.company?.visible !== false;
    const showTitle = wFields.title?.visible !== false;
    const showIndustry = wFields.industry?.visible !== false;
    const showTeamSize = wFields.teamSize?.visible !== false;
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Work Info" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={wc.workQuestion ?? ''}
              onChange={wc.setWorkQuestion}
              isPreviewMode={isPreviewMode}
              required={wBlockRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={wc.workHelperText ?? ''}
            onChange={wc.setWorkHelperText}
            isPreviewMode={isPreviewMode}
          />
          {(showWCompany || showTitle) && (
            <div className={`${grid2} mt-[19px]`}>
              {showWCompany && (isPreviewMode ? (
                <PreviewLabeledInput label={wLabel('COMPANY', wFields.company)} value={pf('w.co')} onChange={(v) => setPf('w.co', v)} />
              ) : (
                <FormField label={wLabel('COMPANY', wFields.company)} value="Acme Inc." />
              ))}
              {showTitle && (isPreviewMode ? (
                <PreviewLabeledInput label={wLabel('JOB TITLE', wFields.title)} value={pf('w.ti')} onChange={(v) => setPf('w.ti', v)} />
              ) : (
                <FormField label={wLabel('JOB TITLE', wFields.title)} value="Product Manager" />
              ))}
            </div>
          )}
          {(showIndustry || showTeamSize) && (
            <div className={`${grid2} mt-[9px] pb-[17px]`}>
              {showIndustry && (isPreviewMode ? (
                <PreviewLabeledInput label={wLabel('INDUSTRY', wFields.industry)} value={pf('w.ind')} onChange={(v) => setPf('w.ind', v)} />
              ) : (
                <FormField label={wLabel('INDUSTRY', wFields.industry)} value="Technology" />
              ))}
              {showTeamSize && (isPreviewMode ? (
                <PreviewLabeledInput label={wLabel('TEAM SIZE', wFields.teamSize)} value={pf('w.ts')} onChange={(v) => setPf('w.ts', v)} />
              ) : (
                <FormField label={wLabel('TEAM SIZE', wFields.teamSize)} value="11–50 people" />
              ))}
            </div>
          )}
          {!showIndustry && !showTeamSize && <div className="pb-[17px]" />}
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'qualitative:Short text') {
    const stc = shortTextConfig || {};
    const stQuestion = stc.shortTextQuestion || "What's your name?";
    const stHelper = stc.shortTextHelperText || 'Please enter your full name as it appears on official documents.';
    const stPlaceholder = stc.shortTextPlaceholder || 'Type your answer here…';
    const stMaxChars = stc.shortTextMaxChars ?? 100;
    const stMinChars = Math.max(0, Number(stc.shortTextMinChars) || 0);
    const stValidation = stc.shortTextValidation || 'None';
    const stInputType = TEXT_VALIDATION_INPUT_TYPE[stValidation] || 'text';
    const stHidden = !!stc.shortTextHidden;
    const stRequired = !!stc.shortTextRequired;
    const stAlign = stc.shortTextAlign || 'left';
    const stSize = stc.shortTextSize || 'M';
    const stFontSize = { S: '16px', M: '20px', L: '32px' }[stSize] || '20px';
    const stTextAlign = stAlign === 'center' ? 'text-center' : stAlign === 'right' ? 'text-right' : 'text-left';
    content = (
      <>
        <CardBody
          compactLayout={compactLayout}
          className={`relative ${stHidden && !isPreviewMode ? 'opacity-40' : ''} ${stHidden && isPreviewMode ? 'hidden' : ''}`}
        >
          <HiddenFieldOverlay show={stHidden && !isPreviewMode} />
          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge num={blockNum} label="Short text" />
            {!isPreviewMode && shortTextResponseQualityConfig?.enabled ? (
              <span className="text-[10px] px-2 py-[3px] rounded-full bg-[#eef8f3] text-[#3d8b6a] border border-[#cfe8dc]">
                Quality scoring
              </span>
            ) : null}
          </div>
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={stc.shortTextQuestion ?? ''}
              onChange={stc.setShortTextQuestion}
              isPreviewMode={isPreviewMode}
              required={stRequired}
              align={stAlign}
              fontSize={stFontSize}
              className={stTextAlign}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={stc.shortTextHelperText ?? ''}
            onChange={stc.setShortTextHelperText}
            isPreviewMode={isPreviewMode}
            align={stAlign}
            className={stTextAlign}
          />
          {(stValidation !== 'None' || stMinChars > 0) && (
            <p className={`text-[#aaa] text-[11px] mt-[4px] ${stTextAlign}`}>
              {stValidation !== 'None' ? `${stValidation} format` : ''}
              {stValidation !== 'None' && stMinChars > 0 ? ' · ' : ''}
              {stMinChars > 0 ? `min ${stMinChars} characters` : ''}
            </p>
          )}
          <div className="mt-[19px]">
            {isPreviewMode ? (
              <>
                {shortTextResponseQualityConfig?.enabled ? (
                  <ResponseQualityFeedback
                    embedded
                    evaluation={responseQualityEvaluation}
                    charCount={shortTextDraft.length}
                    maxChars={stMaxChars}
                    answerLabel="Short answer"
                  >
                    <input
                      type={stInputType}
                      value={shortTextDraft}
                      onChange={(e) => setShortTextDraft(e.target.value.slice(0, stMaxChars))}
                      maxLength={stMaxChars}
                      placeholder={stPlaceholder}
                      aria-label={stQuestion}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={respondentInputClass(`${stTextAlign} ${RESPONDENT_QUALITY_FIELD_PAD}`)}
                    />
                  </ResponseQualityFeedback>
                ) : (
                  <input
                    type={stInputType}
                    value={shortTextDraft}
                    onChange={(e) => setShortTextDraft(e.target.value.slice(0, stMaxChars))}
                    maxLength={stMaxChars}
                    placeholder={stPlaceholder}
                    aria-label={stQuestion}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={respondentInputClass(stTextAlign)}
                  />
                )}
                {!shortTextResponseQualityConfig?.enabled ? (
                  <div className="flex justify-between items-center pt-[11px] pb-[9px]">
                    <p className="text-[#bbb] text-[11px]">Short answer</p>
                    <p className="text-[#bbb] text-[11px]">{shortTextDraft.length} / {stMaxChars}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="border-b-2 border-[rgba(0,0,0,0.12)] pb-[10px] pt-[8px]">
                  <InlineEditableField
                    value={stc.shortTextPlaceholder ?? ''}
                    onChange={stc.setShortTextPlaceholder}
                    disabled={isPreviewMode}
                    className={`w-full text-[14px] font-light text-[#bbb] ${stTextAlign}`}
                    placeholder={stPlaceholder}
                    aria-label="Answer placeholder"
                  />
                </div>
                <div className="flex justify-between items-center pt-[11px] pb-[9px]">
                  <p className="text-[#bbb] text-[11px]">Short answer</p>
                  <p className="text-[#bbb] text-[11px]">0 / {stMaxChars}</p>
                </div>
              </>
            )}
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'qualitative:Long text') {
    const ltc = longTextConfig || {};
    const ltQuestion = ltc.longTextQuestion || 'Tell us about your experience';
    const ltHelper = ltc.longTextHelperText || "Share as much or as little as you'd like.";
    const ltPlaceholder = ltc.longTextPlaceholder || 'Type your answer here…';
    const ltMaxChars = ltc.longTextMaxChars ?? 500;
    const ltMinChars = Math.max(0, Number(ltc.longTextMinChars) || 0);
    const ltValidation = ltc.longTextValidation || 'None';
    const ltHidden = !!ltc.longTextHidden;
    const ltRequired = !!ltc.longTextRequired;
    const ltAlign = ltc.longTextAlign || 'left';
    const ltSize = ltc.longTextSize || 'M';
    const ltFontSize = { S: '16px', M: '20px', L: '32px' }[ltSize] || '20px';
    const ltTextAlign = ltAlign === 'center' ? 'text-center' : ltAlign === 'right' ? 'text-right' : 'text-left';
    const ltInputMode = { Email: 'email', URL: 'url', Number: 'numeric', Phone: 'tel' }[ltValidation];
    content = (
      <>
        <CardBody
          compactLayout={compactLayout}
          className={`relative ${ltHidden && !isPreviewMode ? 'opacity-40' : ''} ${ltHidden && isPreviewMode ? 'hidden' : ''}`}
        >
          <HiddenFieldOverlay show={ltHidden && !isPreviewMode} />
          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge num={blockNum} label="Long text" />
            {!isPreviewMode && longTextResponseQualityConfig?.enabled ? (
              <span className="text-[10px] px-2 py-[3px] rounded-full bg-[#eef8f3] text-[#3d8b6a] border border-[#cfe8dc]">
                Quality scoring
              </span>
            ) : null}
          </div>
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={ltc.longTextQuestion ?? ''}
              onChange={ltc.setLongTextQuestion}
              isPreviewMode={isPreviewMode}
              required={ltRequired}
              align={ltAlign}
              fontSize={ltFontSize}
              className={ltTextAlign}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={ltc.longTextHelperText ?? ''}
            onChange={ltc.setLongTextHelperText}
            isPreviewMode={isPreviewMode}
            align={ltAlign}
            className={ltTextAlign}
          />
          {(ltValidation !== 'None' || ltMinChars > 0) && (
            <p className={`text-[#aaa] text-[11px] mt-[4px] ${ltTextAlign}`}>
              {ltValidation !== 'None' ? `${ltValidation} format` : ''}
              {ltValidation !== 'None' && ltMinChars > 0 ? ' · ' : ''}
              {ltMinChars > 0 ? `min ${ltMinChars} characters` : ''}
            </p>
          )}
          <div className="mt-[19px]">
            {isPreviewMode ? (
              <>
                {longTextResponseQualityConfig?.enabled ? (
                  <ResponseQualityFeedback
                    embedded
                    evaluation={responseQualityEvaluation}
                    charCount={longTextDraft.length}
                    maxChars={ltMaxChars}
                  >
                    <textarea
                      value={longTextDraft}
                      onChange={(e) => setLongTextDraft(e.target.value.slice(0, ltMaxChars))}
                      maxLength={ltMaxChars}
                      placeholder={ltPlaceholder}
                      inputMode={ltInputMode}
                      aria-label={ltQuestion}
                      onMouseDown={(e) => e.stopPropagation()}
                      rows={3}
                      className={respondentTextareaClass(`${ltTextAlign} ${RESPONDENT_QUALITY_FIELD_PAD}`)}
                    />
                  </ResponseQualityFeedback>
                ) : (
                  <textarea
                    value={longTextDraft}
                    onChange={(e) => setLongTextDraft(e.target.value.slice(0, ltMaxChars))}
                    maxLength={ltMaxChars}
                    placeholder={ltPlaceholder}
                    inputMode={ltInputMode}
                    aria-label={ltQuestion}
                    onMouseDown={(e) => e.stopPropagation()}
                    rows={3}
                    className={respondentTextareaClass(ltTextAlign)}
                  />
                )}
                {!longTextResponseQualityConfig?.enabled ? (
                  <div className="flex justify-between items-center pt-[11px] pb-[9px]">
                    <p className="text-[#bbb] text-[11px]">Long answer</p>
                    <p className="text-[#bbb] text-[11px]">
                      {longTextDraft.length}{ltMinChars > 0 ? ` (min ${ltMinChars})` : ''} / {ltMaxChars}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="border border-[rgba(0,0,0,0.1)] rounded-[8px] px-4 py-3 min-h-[120px]">
                  <InlineEditableField
                    value={ltc.longTextPlaceholder ?? ''}
                    onChange={ltc.setLongTextPlaceholder}
                    disabled={isPreviewMode}
                    className={`w-full text-[14px] font-light text-[#bbb] ${ltTextAlign}`}
                    placeholder={ltPlaceholder}
                    aria-label="Answer placeholder"
                  />
                </div>
                <div className="flex justify-between items-center pt-[11px] pb-[9px]">
                  <p className="text-[#bbb] text-[11px]">Long answer</p>
                  <p className="text-[#bbb] text-[11px]">0 / {ltMaxChars}</p>
                </div>
              </>
            )}
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'choiceBased:Single') {
    const sc = singleConfig || {};
    const sQuestion = sc.singleQuestion || 'How did you hear about us?';
    const sHelper = sc.singleHelperText || 'Choose the option that best describes your experience.';
    const sAllowOther = sc.singleAllowOther ?? true;
    const sLayout = sc.singleLayout || 'List';
    const sHeight = sc.singleOptionHeight || 'M';
    const sHeightPy = sHeight === 'S' ? 'py-[8px]' : sHeight === 'L' ? 'py-[18px]' : 'py-[13px]';
    const allOpts = singleDisplayOpts;
    const isList = sLayout === 'List' || compactLayout;
    const is2col = !compactLayout && sLayout === '2col';
    const onOpenPanel = sc.onOpenPanel;
    const sMulti = sc.singleMultipleSelect ?? false;
    const sRequired = !!sc.singleRequired;
    const sShowHints = !!sc.singleShowKeyboardHints;
    const sMaxChoices = sMulti ? sc.singleMaxChoices : 1;
    const sMinChoices = sMulti ? (Number(sc.singleMinChoices) || 1) : (sRequired ? 1 : 0);
    content = (
      <>
        <CardBody compactLayout={compactLayout} className="min-h-0 flex-1">
          <SectionBadge num={blockNum} label="Single choice" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={sc.singleQuestion ?? ''}
              onChange={sc.setSingleQuestion}
              isPreviewMode={isPreviewMode}
              required={sRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={sc.singleHelperText ?? ''}
            onChange={sc.setSingleHelperText}
            isPreviewMode={isPreviewMode}
          />
          {sMulti && (sMinChoices > 1 || sMaxChoices != null) && (
            <p className="text-[#aaa] text-[11px] mt-[4px] mb-[12px]">
              Select {sMinChoices}{sMaxChoices != null ? `–${sMaxChoices}` : '+'} option{sMaxChoices !== 1 ? 's' : ''}
            </p>
          )}
          {(!sMulti || !(sMinChoices > 1 || sMaxChoices != null)) && <div className="mb-[19px]" />}
          <div
            className={`mb-5 overflow-y-auto ${compactLayout ? 'max-h-[50dvh]' : 'max-h-[320px]'} ${isList ? 'flex flex-col' : is2col ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2'}`}
          >
            {allOpts.map((opt, i) => {
              const isOther = sAllowOther && opt === 'Other';
              const hint = isPreviewMode && sShowHints && !isOther && !compactLayout ? CHOICE_KEYBOARD_HINT(i) : null;
              const isPicked = previewPicks.includes(opt);
              const markBase = sMulti
                ? 'w-[20px] h-[20px] rounded-[4px] flex items-center justify-center border-2 shrink-0'
                : 'w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 shrink-0';
              const mark = (
                <div className={markBase} style={choiceMarkStyle(accent, isPicked)}>
                  {isPicked && (sMulti ? <RiCheckLine size={12} className="text-white" /> : <div className="w-[7px] h-[7px] rounded-full bg-white" />)}
                </div>
              );
              if (isList) {
                const rowPad = compactLayout ? listRowPad : `px-4 ${sHeightPy}`;
                const rowCls = `flex items-center gap-3 sm:gap-4 min-w-0 ${rowPad} border-x border-b ${i === 0 ? 'border-t rounded-t-[8px]' : ''} ${i === allOpts.length - 1 ? 'rounded-b-[8px]' : ''} ${isOther ? 'border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.01)]' : 'border-[rgba(0,0,0,0.08)]'} ${isPreviewMode && !isOther ? 'cursor-pointer hover:bg-[rgba(0,0,0,0.02)]' : ''}`;
                if (isPreviewMode) {
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => !isOther && togglePreviewPick(opt, sMulti, sMaxChoices)}
                      className={`w-full text-left ${rowCls}`}
                    >
                      {hint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{hint}</span>}
                      {mark}
                      <span className={`text-[14px] min-w-0 break-words ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                    </button>
                  );
                }
                return (
                  <div
                    key={opt}
                    className={rowCls}
                  >
                    {hint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{hint}</span>}
                    <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 shrink-0 border-[rgba(0,0,0,0.2)]" />
                    <span className={`text-[14px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                  </div>
                );
              }
              const tileCls = `flex items-center gap-3 px-3 ${sHeightPy} border rounded-[8px] border-[rgba(0,0,0,0.08)] ${isOther ? 'bg-[rgba(0,0,0,0.01)]' : ''} ${isPreviewMode && !isOther ? 'cursor-pointer hover:border-[rgba(0,0,0,0.2)]' : ''}`;
              if (isPreviewMode) {
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => !isOther && togglePreviewPick(opt, sMulti, sMaxChoices)}
                    className={`w-full text-left ${tileCls}`}
                  >
                    {hint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{hint}</span>}
                    {sMulti ? (
                      <div className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center border-2 shrink-0" style={choiceMarkStyle(accent, isPicked)}>
                        {isPicked && <RiCheckLine size={11} className="text-white" />}
                      </div>
                    ) : (
                      mark
                    )}
                    <span className={`text-[13px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                  </button>
                );
              }
              return (
                <div
                  key={opt}
                  className={tileCls}
                >
                  <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 shrink-0 border-[rgba(0,0,0,0.2)]" />
                  <span className={`text-[13px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
        {!isPreviewMode && (
        <div className={`border-t border-[rgba(0,0,0,0.1)] flex gap-2 items-center ${cardFooterToolsPadClass(compactLayout)}`}>
          {onOpenPanel && (
            <button
              onClick={onOpenPanel}
              className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-white/70 border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
            >
              <RiPencilLine size={12} className="shrink-0" />
              Edit options
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,245,245,0.7)] border border-[rgba(200,50,50,0.2)] text-[#d63030] text-[12px] cursor-pointer hover:bg-[rgba(255,235,235,0.9)] transition-colors whitespace-nowrap"
          >
            <RiDeleteBin6Line size={12} className="shrink-0" />
            Delete
          </button>
          <div className="flex-1" />
          <button
            className="flex items-center gap-[5px] px-[16px] py-[8px] rounded-[8px] text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            style={accentButtonStyle(accent)}
          >
            <RiCheckLine size={11} className="shrink-0" />
            Save
          </button>
        </div>
        )}
      </>
    );
  } else if (cardKey === 'choiceBased:Multiple') {
    const mc = multipleConfig || {};
    const mQuestion = mc.multipleQuestion || 'Which features do you use most?';
    const mHelper = mc.multipleHelperText || 'Select all that apply.';
    const mAllowOther = mc.multipleAllowOther ?? false;
    const mLayout = mc.multipleLayout || 'List';
    const mMultipleSelect = mc.multipleMultipleSelect ?? false;
    const mHeight = mc.multipleOptionHeight || 'M';
    const mHeightPy = mHeight === 'S' ? 'py-[8px]' : mHeight === 'L' ? 'py-[18px]' : 'py-[13px]';
    const mOnOpenPanel = mc.onOpenPanel;
    const allMOpts = multipleDisplayOpts;
    const mRequired = !!mc.multipleRequired;
    const mShowHints = !!mc.multipleShowKeyboardHints;
    const mMaxChoices = mMultipleSelect ? mc.multipleMaxChoices : 1;
    const mMinChoices = mMultipleSelect ? (Number(mc.multipleMinChoices) || 1) : (mRequired ? 1 : 0);
    const isMList = mLayout === 'List' || compactLayout;
    const isM2col = !compactLayout && mLayout === '2col';
    content = (
      <>
        <CardBody compactLayout={compactLayout} className="min-h-0 flex-1">
          <SectionBadge num={blockNum} label="Multiple choice" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={mc.multipleQuestion ?? ''}
              onChange={mc.setMultipleQuestion}
              isPreviewMode={isPreviewMode}
              required={mRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={mc.multipleHelperText ?? ''}
            onChange={mc.setMultipleHelperText}
            isPreviewMode={isPreviewMode}
          />
          {mMultipleSelect && (mMinChoices > 1 || mMaxChoices != null) && (
            <p className="text-[#aaa] text-[11px] mt-[4px] mb-[12px]">
              Select {mMinChoices}{mMaxChoices != null ? `–${mMaxChoices}` : '+'} option{mMaxChoices !== 1 ? 's' : ''}
            </p>
          )}
          {(!mMultipleSelect || !(mMinChoices > 1 || mMaxChoices != null)) && <div className="mb-[19px]" />}
          <div
            className={`mb-5 overflow-y-auto ${compactLayout ? 'max-h-[50dvh]' : 'max-h-[320px]'} ${isMList ? 'flex flex-col' : isM2col ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-2'}`}
          >
            {allMOpts.map((opt, i) => {
              const isOther = mAllowOther && opt === 'Other';
              const mHint = isPreviewMode && mShowHints && !isOther && !compactLayout ? CHOICE_KEYBOARD_HINT(i) : null;
              const isPicked = previewPicks.includes(opt);
              const markBase = mMultipleSelect
                ? 'flex items-center justify-center shrink-0 border-2 w-[20px] h-[20px] rounded-[4px]'
                : 'flex items-center justify-center shrink-0 border-2 w-[22px] h-[22px] rounded-full';
              const mark = (
                <div className={markBase} style={choiceMarkStyle(accent, isPicked)}>
                  {isPicked && (mMultipleSelect ? <RiCheckLine size={12} className="text-white" /> : <div className="w-[7px] h-[7px] rounded-full bg-white" />)}
                </div>
              );
              if (isMList) {
                const rowPad = compactLayout ? listRowPad : `px-4 ${mHeightPy}`;
                const rowCls = `flex items-center gap-3 sm:gap-4 min-w-0 ${rowPad} border-x border-b ${i === 0 ? 'border-t rounded-t-[8px]' : ''} ${i === allMOpts.length - 1 ? 'rounded-b-[8px]' : ''} ${isOther ? 'border-[rgba(0,0,0,0.06)] bg-[rgba(0,0,0,0.01)]' : 'border-[rgba(0,0,0,0.08)]'} ${isPreviewMode && !isOther ? 'cursor-pointer hover:bg-[rgba(0,0,0,0.02)]' : ''}`;
                if (isPreviewMode) {
                  return (
                    <button type="button" key={i} onClick={() => !isOther && togglePreviewPick(opt, mMultipleSelect, mMaxChoices)} className={`w-full text-left ${rowCls}`}>
                      {mHint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{mHint}</span>}
                      {mark}
                      <span className={`text-[14px] min-w-0 break-words ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                    </button>
                  );
                }
                return (
                  <div
                    key={i}
                    className={rowCls}
                  >
                    {mHint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{mHint}</span>}
                    <div className={`flex items-center justify-center shrink-0 border-2 border-[rgba(0,0,0,0.2)] ${mMultipleSelect ? 'w-[20px] h-[20px] rounded-[4px]' : 'w-[22px] h-[22px] rounded-full'}`} />
                    <span className={`text-[14px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                  </div>
                );
              }
              const tileCls = `flex items-center gap-3 px-3 ${mHeightPy} border rounded-[8px] border-[rgba(0,0,0,0.08)] ${isOther ? 'bg-[rgba(0,0,0,0.01)]' : ''} ${isPreviewMode && !isOther ? 'cursor-pointer hover:border-[rgba(0,0,0,0.2)]' : ''}`;
              if (isPreviewMode) {
                return (
                  <button type="button" key={i} onClick={() => !isOther && togglePreviewPick(opt, mMultipleSelect, mMaxChoices)} className={`w-full text-left ${tileCls}`}>
                    {mHint && <span className="text-[10px] font-semibold text-[#bbb] w-4 shrink-0">{mHint}</span>}
                    {mMultipleSelect ? (
                      <div className="flex items-center justify-center shrink-0 border-2 w-[18px] h-[18px] rounded-[4px]" style={choiceMarkStyle(accent, isPicked)}>
                        {isPicked && <RiCheckLine size={11} className="text-white" />}
                      </div>
                    ) : (
                      mark
                    )}
                    <span className={`text-[13px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                  </button>
                );
              }
              return (
                <div
                  key={i}
                  className={tileCls}
                >
                  <div className={`flex items-center justify-center shrink-0 border-2 border-[rgba(0,0,0,0.2)] ${mMultipleSelect ? 'w-[18px] h-[18px] rounded-[4px]' : 'w-[20px] h-[20px] rounded-full'}`} />
                  <span className={`text-[13px] ${isOther ? 'text-[#aaa] italic' : 'text-[#111]'}`}>{opt}</span>
                </div>
              );
            })}
          </div>
        </CardBody>
        {!isPreviewMode && (
        <div className={`border-t border-[rgba(0,0,0,0.1)] flex gap-2 items-center ${cardFooterToolsPadClass(compactLayout)}`}>
          {mOnOpenPanel && (
            <button
              onClick={mOnOpenPanel}
              className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-white/70 border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
            >
              <RiPencilLine size={12} className="shrink-0" />
              Edit options
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,245,245,0.7)] border border-[rgba(200,50,50,0.2)] text-[#d63030] text-[12px] cursor-pointer hover:bg-[rgba(255,235,235,0.9)] transition-colors whitespace-nowrap"
          >
            <RiDeleteBin6Line size={12} className="shrink-0" />
            Delete
          </button>
          <div className="flex-1" />
          <button
            className="flex items-center gap-[5px] px-[16px] py-[8px] rounded-[8px] text-white text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
            style={accentButtonStyle(accent)}
          >
            <RiCheckLine size={11} className="shrink-0" />
            Save
          </button>
        </div>
        )}
      </>
    );
  } else if (cardKey === 'choiceBased:Media') {
    const mec = mediaConfig || {};
    const meQuestion = mec.mediaQuestion || 'Choose an image option';
    const meHelper = mec.mediaHelperText || 'Select the image that best represents your answer.';
    const meOpts = mediaDisplayOpts.length ? mediaDisplayOpts : [{ label: 'Option A', image: null }, { label: 'Option B', image: null }, { label: 'Option C', image: null }, { label: 'Option D', image: null }];
    const meAllowMultiple = mec.mediaAllowMultiple || false;
    const meRequired = !!mec.mediaRequired;
    const meMaxChoices = meAllowMultiple ? mec.mediaMaxChoices : 1;
    const meMinChoices = meAllowMultiple ? (Number(mec.mediaMinChoices) || 1) : (meRequired ? 1 : 0);
    const meLayout = mec.mediaLayout || '2col';
    const meOptHeight = mec.mediaOptionHeight || 'M';
    const meGridCols = compactLayout
      ? 'grid-cols-1'
      : meLayout === 'list'
        ? 'grid-cols-1'
        : meLayout === '3col'
          ? 'grid-cols-3'
          : 'grid-cols-2';
    const meImgRatio = meOptHeight === 'S' ? '16/4' : meOptHeight === 'L' ? '16/7' : '16/5';
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Media choice" />
          <div className="pt-[6px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={mec.mediaQuestion ?? ''}
              onChange={mec.setMediaQuestion}
              isPreviewMode={isPreviewMode}
              required={meRequired}
              fontSize={qFont('media')}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={mec.mediaHelperText ?? ''}
            onChange={mec.setMediaHelperText}
            isPreviewMode={isPreviewMode}
          />
          {meAllowMultiple && (meMinChoices > 1 || meMaxChoices != null) && (
            <p className="text-[#aaa] text-[11px] mt-[4px] mb-[10px]">
              Select {meMinChoices}{meMaxChoices != null ? `–${meMaxChoices}` : '+'} option{meMaxChoices !== 1 ? 's' : ''}
            </p>
          )}
          {(!meAllowMultiple || !(meMinChoices > 1 || meMaxChoices != null)) && <div className="mb-[10px]" />}
          <div
            className="overflow-y-auto pb-3"
            style={{ maxHeight: compactLayout ? '45dvh' : '290px' }}
          >
            <div className={`grid ${meGridCols} gap-2`}>
            {meOpts.map((opt, i) => {
              const optKey = opt.label || `Option ${i + 1}`;
              const isPicked = previewPicks.includes(optKey);
              const tile = (
                <>
                  {opt.image ? (
                    <img src={opt.image} alt={opt.label} className="w-full object-cover" style={{ aspectRatio: meImgRatio }} />
                  ) : (
                    <div className="bg-[rgba(0,0,0,0.04)] flex items-center justify-center" style={{ aspectRatio: meImgRatio }}>
                      <RiImageLine size={20} className="text-[#bbb]" />
                    </div>
                  )}
                  <div className="px-3 py-[6px] flex items-center gap-2">
                    <div
                      className={`shrink-0 flex items-center justify-center border-2 ${meAllowMultiple ? 'w-[16px] h-[16px] rounded-[4px]' : 'w-[16px] h-[16px] rounded-full'}`}
                      style={choiceMarkStyle(accent, isPicked)}
                    >
                      {isPicked && (meAllowMultiple ? <RiCheckLine size={10} className="text-white" /> : <div className="w-[5px] h-[5px] rounded-full bg-white" />)}
                    </div>
                    <span className="text-[12px] text-[#111]">{optKey}</span>
                  </div>
                </>
              );
              if (isPreviewMode) {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => togglePreviewPick(optKey, meAllowMultiple, meMaxChoices)}
                    className="border rounded-[10px] overflow-hidden text-left transition-colors cursor-pointer"
                    style={
                      isPicked
                        ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` }
                        : { borderColor: 'rgba(0,0,0,0.1)' }
                    }
                  >
                    {tile}
                  </button>
                );
              }
              return (
                <div key={i} className="border rounded-[10px] overflow-hidden border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.25)] transition-colors cursor-pointer">
                  {opt.image ? (
                    <img src={opt.image} alt={opt.label} className="w-full object-cover" style={{ aspectRatio: meImgRatio }} />
                  ) : (
                    <div className="bg-[rgba(0,0,0,0.04)] flex items-center justify-center" style={{ aspectRatio: meImgRatio }}>
                      <RiImageLine size={20} className="text-[#bbb]" />
                    </div>
                  )}
                  <div className="px-3 py-[6px] flex items-center gap-2">
                    <div className={`shrink-0 flex items-center justify-center border-2 border-[rgba(0,0,0,0.2)] ${meAllowMultiple ? 'w-[16px] h-[16px] rounded-[4px]' : 'w-[16px] h-[16px] rounded-full'}`} />
                    <span className="text-[12px] text-[#111]">{opt.label || `Option ${i + 1}`}</span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'interactive:Upload') {
    content = (
      <FileUploadCard
        blockNum={blockNum}
        onDelete={onDelete}
        onConfigure={onConfigure}
        configureLabel={label}
        config={uploadConfig}
        isPreviewMode={isPreviewMode}
        accentColor={accent}
        compactLayout={compactLayout}
      />
    );
  } else if (cardKey === 'interactive:Multi-image upload') {
    return (
      <MultiImageUploadCard
        blockNum={blockNum}
        onDelete={onDelete}
        onConfigure={onConfigure}
        configureLabel={label}
        config={multiImageConfig}
        fullCanvas={fullCanvas}
        cardColor={cardColor}
        cardImage={cardImage}
        accentColor={accent}
        isPreviewMode={isPreviewMode}
        previewStepNav={previewStepNav}
        previewScreenValidatorRef={previewScreenValidatorRef}
        compactLayout={compactLayout}
      />
    );
  } else if (cardKey === 'interactive:Captcha') {
    const capc = captchaConfig || {};
    const capProvider = capc.captchaProvider || 'Google reCAPTCHA v3';
    const capEnabled = capc.captchaEnabled !== false;
    const PROVIDER_SHORT = {
      'Google reCAPTCHA v3': 'reCAPTCHA',
      'Google reCAPTCHA v2': 'reCAPTCHA',
      'hCaptcha': 'hCaptcha',
      'Cloudflare Turnstile': 'Turnstile',
    };
    const capLabel = PROVIDER_SHORT[capProvider] || capProvider;
    content = (
      <>
        <CardBody compactLayout={compactLayout} className={`transition-opacity ${capEnabled ? 'opacity-100' : 'opacity-40'}`}>
          <SectionBadge num={blockNum} label="Captcha" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="font-medium text-[#111] tracking-[-0.52px] leading-[32.5px] flex-1 min-w-0" style={{ fontSize: '26px' }}>
              One last check before we submit
            </p>
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <p className="text-[#888] text-[15px] font-light mt-px mb-[19px] leading-[20.8px]">Please confirm you're not a robot.</p>
          <div className="flex items-center gap-[14px] bg-[rgba(255,255,255,0.5)] border border-[rgba(0,0,0,0.16)] rounded-[10px] px-[21px] py-[17px]">
            <button
              onClick={() => capEnabled && setCaptchaChecked((v) => !v)}
              className={`w-[22px] h-[22px] rounded-[5px] border shrink-0 flex items-center justify-center transition-colors ${
                capEnabled ? 'cursor-pointer' : 'cursor-default'
              } ${
                captchaChecked
                  ? ''
                  : 'bg-transparent border-[rgba(0,0,0,0.16)] hover:border-[rgba(0,0,0,0.35)]'
              }`}
              style={captchaChecked ? choiceMarkStyle(accent, true) : undefined}
            >
              <AnimatePresence>
                {captchaChecked && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    <RiCheckLine size={13} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <span className="text-[14px] text-[#111] flex-1 select-none" style={{ fontFamily: "'DM Sans', sans-serif" }}>I'm not a robot</span>
            <div className="flex flex-col items-center gap-[2px]">
              <span className="text-[16px] leading-none">🔒</span>
              <span className="text-[8px] text-black leading-none">{capLabel}</span>
            </div>
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'numeric:Rating') {
    const rc = ratingConfig || {};
    const rQuestion = rc.ratingQuestion || 'How would you rate your overall experience?';
    const rStyle = rc.ratingStyle || 'Stars';
    const rMax = rc.ratingMaxRating || 5;
    const rLow = rc.ratingLowLabel ?? 'Very poor';
    const rHigh = rc.ratingHighLabel ?? 'Excellent';
    const rShowLabels = rc.ratingShowLabels !== false;
    const rIconSize = rc.ratingIconSize || 'M';
    const iconPx = rIconSize === 'S' ? 13 : rIconSize === 'L' ? 20 : 16;
    const btnSizePx = rIconSize === 'S' ? 30 : rIconSize === 'L' ? 42 : 36;

    const activeRating = ratingHover || ratingValue;

    const renderIconBtn = (n) => {
      const filled = n <= activeRating;
      if (rStyle === '1-10') {
        return (
          <button
            key={n}
            onClick={() => setRatingValue(n === ratingValue ? 0 : n)}
            onMouseEnter={() => setRatingHover(n)}
            onMouseLeave={() => setRatingHover(0)}
            className="flex-1 flex items-center justify-center py-[8px] transition-all duration-150 cursor-pointer rounded-[8px]"
            style={{
              border: `1px solid ${filled ? accent : '#e2e2de'}`,
              background: filled ? accent : 'transparent',
              minWidth: 0,
            }}
            aria-label={`Rate ${n}`}
          >
            <span className="text-[13.5px] font-medium leading-none" style={{ color: filled ? '#fff' : '#141412' }}>{n}</span>
          </button>
        );
      }
      const FilledIcon = rStyle === 'Hearts' ? RiHeartFill : RiStarFill;
      const EmptyIcon = rStyle === 'Hearts' ? RiHeartLine : RiStarLine;
      return (
        <button
          key={n}
          onClick={() => setRatingValue(n === ratingValue ? 0 : n)}
          onMouseEnter={() => setRatingHover(n)}
          onMouseLeave={() => setRatingHover(0)}
          className="shrink-0 flex items-center justify-center transition-all duration-150 cursor-pointer"
          style={{
            width: btnSizePx,
            height: btnSizePx,
            borderRadius: 9,
            border: `1px solid ${filled ? accent : 'rgba(0,0,0,0.16)'}`,
            background: filled ? accent : 'rgba(255,255,255,0.6)',
            padding: 1,
          }}
          aria-label={`Rate ${n} out of ${rMax}`}
        >
          {filled
            ? <FilledIcon size={iconPx} className="text-white" />
            : <EmptyIcon size={iconPx} className="text-[#555]" />
          }
        </button>
      );
    };

    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Rating" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={rc.ratingQuestion ?? ''}
              onChange={rc.setRatingQuestion}
              isPreviewMode={isPreviewMode}
              fontSize={qFont('media')}
              fontWeight="500"
              className="font-medium"
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <div className={`flex pt-[19px] pb-[17px] ${rStyle === '1-10' ? '' : 'justify-center'} ${compactLayout ? 'flex-wrap' : ''}`}>
            <div className={`flex flex-col ${rStyle === '1-10' ? 'w-full' : ''}`}>
              <div className={`flex items-center ${rStyle === '1-10' ? 'gap-[6px]' : 'gap-2'}`}>
                {Array.from({ length: rMax }, (_, i) => i + 1).map(renderIconBtn)}
              </div>
              {rShowLabels && (
                <div className="flex items-start justify-between pt-[6px] gap-2">
                  <InlineEditableField
                    value={rc.ratingLowLabel ?? ''}
                    onChange={rc.setRatingLowLabel}
                    disabled={isPreviewMode}
                    className="text-[10px] text-black font-light flex-1 min-w-0"
                    placeholder={rLow}
                    aria-label="Low rating label"
                  />
                  <InlineEditableField
                    value={rc.ratingHighLabel ?? ''}
                    onChange={rc.setRatingHighLabel}
                    disabled={isPreviewMode}
                    className="text-[10px] text-black font-light flex-1 min-w-0 text-right"
                    placeholder={rHigh}
                    aria-label="High rating label"
                  />
                </div>
              )}
            </div>
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else if (cardKey === 'numeric:Time') {
    content = (
      <TimePickerCard
        blockNum={blockNum}
        onDelete={onDelete}
        onConfigure={onConfigure}
        configureLabel={label}
        config={timeConfig}
        isPreviewMode={isPreviewMode}
        previewRequiredHint={previewRequiredHint}
        onTimeChange={setTimeSelection}
        accentColor={accent}
        compactLayout={compactLayout}
      />
    );
  } else if (cardKey === 'numeric:Date') {
    const dc = dateConfig || {};
    const dQuestion = dc.dateQuestion || "When's the best date for you?";
    const dHelper = dc.dateHelperText || 'Pick a date from the calendar.';
    const dRequired = !!dc.dateRequired;
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const weekendIdx = new Set([4, 5, 11, 12, 18, 19, 25, 26]);
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label="Date" />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <CanvasQuestionText
              value={dc.dateQuestion ?? ''}
              onChange={dc.setDateQuestion}
              isPreviewMode={isPreviewMode}
              required={dRequired}
              fontSize={qFont()}
            />
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <CanvasHelperText
            value={dc.dateHelperText ?? ''}
            onChange={dc.setDateHelperText}
            isPreviewMode={isPreviewMode}
            className="mb-[19px]"
          />
          <div className="border border-[rgba(0,0,0,0.12)] rounded-[10px] overflow-hidden mb-5">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,0,0,0.07)]">
              <span className="text-[13px] font-medium text-[#111]">May 2026</span>
              <div className="flex gap-3">
                <RiArrowLeftSLine size={16} className="text-[#888] cursor-pointer shrink-0" aria-hidden />
                <RiArrowRightSLine size={16} className="text-[#888] cursor-pointer shrink-0" aria-hidden />
              </div>
            </div>
            <div className="grid grid-cols-7 text-center px-4 py-3 gap-y-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="text-[10px] text-[#888] pb-1">{d}</span>
              ))}
              {days.map((d) => (
                <span
                  key={d}
                  className={`${compactLayout ? 'text-[12px]' : 'text-[13px]'} py-1 rounded-full ${d === 11 ? 'text-white' : weekendIdx.has(d - 1) ? 'text-[#ccc]' : 'text-[#111] cursor-pointer hover:bg-[rgba(0,0,0,0.05)]'}`}
                  style={d === 11 ? { backgroundColor: accent } : undefined}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  } else {
    content = (
      <>
        <CardBody compactLayout={compactLayout}>
          <SectionBadge num={blockNum} label={label} />
          <div className="pt-[9px] flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-5">
            <p className="font-semibold text-[#111] tracking-[-0.52px] leading-[1.3] flex-1 min-w-0 break-words" style={{ fontSize: qFont(), fontWeight: '600' }}>
              {label}
            </p>
            <PreviewRequiredInline show={previewRequiredHint} />
          </div>
          <p className="text-[#888] text-[15px] font-light pb-5">
            This is a {label.toLowerCase()} field for collecting respondent data.
          </p>
        </CardBody>
        {!isPreviewMode && <ContentCardFooter
          onDelete={onDelete}
          onConfigure={onConfigure ? () => onConfigure(label) : undefined}
          variant="field"
          accentColor={accent}
          compactLayout={compactLayout}
        />}
      </>
    );
  }

  const isImageCard = cardKey === 'buildingBlocks:Images';
  const isVideoCard = cardKey === 'buildingBlocks:Video';
  const isScrollableCard = isImageCard || isVideoCard;
  const scrollableLabel = isImageCard ? 'IMAGE WITH QUESTION' : 'VIDEO WITH QUESTION';

  const inCardPreviewNav =
    isPreviewMode && previewStepNav ? cloneElement(previewStepNav, { compactLayout }) : null;

  return (
    <motion.div
      className="h-full min-h-0 flex flex-col"
      style={cardTextStyle}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {isScrollableCard ? (
        <div className="flex-1 min-h-0 flex flex-col gap-[6px]">
          <div className="flex gap-[14px] items-center pb-[8px] pt-[6px]">
            <span className="text-[15px] font-semibold tracking-[1.52px] uppercase text-black whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {scrollableLabel}
            </span>
            <div className="flex-1 h-px bg-[rgba(0,0,0,0.1)]" />
          </div>
          <CardShell fullCanvas={fullCanvas} cardColor={cardColor} cardImage={cardImage} scrollable footer={inCardPreviewNav}>{content}</CardShell>
        </div>
      ) : (
        <CardShell fullCanvas={fullCanvas} cardColor={cardColor} cardImage={cardImage} footer={inCardPreviewNav}>{content}</CardShell>
      )}
    </motion.div>
  );
};

/** Guards invalid block props without violating rules-of-hooks in the inner tree. */
const ContentCard = (props) => {
  const { block } = props;
  if (!block?.section || !block?.label) return null;
  return <ContentCardInner {...props} block={block} />;
};

export default ContentCard;
