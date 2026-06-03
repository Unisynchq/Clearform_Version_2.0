import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { createFormLogicRunner } from '@/features/forms/utils/formLogicRunner';
import { isScreenVisibleInPreview } from '@/features/forms/utils/logicEngine';
import RespondentScreenFields, {
  isRespondentScreenComplete,
} from '@/features/forms/components/respondent/RespondentScreenFields';
import ResponseQualityFeedback from '@/features/forms/components/ResponseQualityFeedback';
import { evaluateResponseQuality } from '@/features/forms/utils/responseQualityScoring';
import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/api/endpoints';
import { isApiConfigured } from '@/config/env';
import { submitFormResponse } from '@/api/services/responsesService';
import { buildResponseFromPreview } from '@/features/forms/utils/formResponseBuilder';
import { PreviewPoweredBy } from '@/features/forms/formBuilder/BuilderContentCard';
import {
  getRespondentThemeStyles,
  respondentCardStyle,
} from '@/features/forms/utils/respondentThemeStyles';

const emptySnap = () => ({
  previewPicks: [],
  shortTextDraft: '',
  longTextDraft: '',
  ratingValue: 0,
  previewFields: {},
  captchaChecked: false,
  uploadedFiles: [],
});

function RespondentShell({ theme, children, showSiteHeader, formTitle }) {
  const t = getRespondentThemeStyles(theme);
  const cardStyle = respondentCardStyle(t);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: t.pageBg, fontFamily: t.typography, color: t.textColor }}
    >
      {showSiteHeader ? (
        <header className="shrink-0 border-b border-[rgba(0,0,0,0.08)] bg-white/80 backdrop-blur px-6 py-4">
          <p className="text-[13px] text-[#71717a]">Clearform</p>
          <h1 className="text-[18px] font-semibold" style={{ color: t.textColor }}>
            {formTitle || 'Form'}
          </h1>
        </header>
      ) : null}
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div
          className={`w-full max-w-xl ${t.fullCanvas ? '' : 'border border-[rgba(0,0,0,0.07)] rounded-[20px] shadow-sm overflow-hidden'}`}
          style={cardStyle}
        >
          {children}
        </div>
      </main>
    </div>
  );
}

function ThemedButton({ theme, children, onClick, className = '', variant = 'primary' }) {
  const t = getRespondentThemeStyles(theme);
  const base =
    variant === 'primary'
      ? { backgroundColor: t.accentColor, color: '#fff' }
      : { borderColor: 'rgba(0,0,0,0.12)', color: t.textColor };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      style={variant === 'primary' ? base : undefined}
      className={
        variant === 'primary'
          ? `rounded-lg px-4 py-3 text-[14px] font-medium cursor-pointer hover:opacity-90 ${className}`
          : `rounded-lg border px-4 py-2.5 text-[14px] font-medium hover:bg-black/[0.03] cursor-pointer ${className}`
      }
    >
      {children}
    </motion.button>
  );
}

/**
 * Live form runner — same logic engine as builder preview; themed from snapshot.
 */
export default function FormRespondentView({
  draft,
  formTitle,
  formId,
  variant = 'public',
}) {
  const screens = draft?.screens ?? [];
  const logicConnections = draft?.logicConnections ?? [];
  const logicIfRulesByEdge = draft?.logicIfRulesByEdge ?? {};
  const theme = draft?.theme;

  const intro = screens.find((s) => s.type === 'intro');
  const [activeScreenId, setActiveScreenId] = useState(intro?.id ?? screens[0]?.id ?? null);
  const [visitStack, setVisitStack] = useState([]);
  const [snapsByScreenId, setSnapsByScreenId] = useState({});
  const [fieldError, setFieldError] = useState('');

  const runnerRef = useRef(null);
  useEffect(() => {
    runnerRef.current = createFormLogicRunner({
      screens,
      logicConnections,
      logicIfRulesByEdge,
    });
  }, [screens, logicConnections, logicIfRulesByEdge]);

  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;
  const [qualityResult, setQualityResult] = useState(null);
  const qualityTimerRef = useRef(null);

  useEffect(() => {
    setQualityResult(null);
  }, [activeScreenId]);

  const evaluateQuality = (text, config, label) => {
    if (qualityTimerRef.current) clearTimeout(qualityTimerRef.current);
    if (!text?.trim()) {
      setQualityResult(null);
      return;
    }

    const isLong = label === 'Long text';
    const qualityConfig = isLong
      ? config.longTextResponseQualityOptions
      : config.shortTextResponseQualityOptions;
    const enabled = isLong
      ? config.longTextResponseQualityEnabled
      : config.shortTextResponseQualityEnabled;
    if (!enabled) return;

    qualityTimerRef.current = setTimeout(async () => {
      if (isApiConfigured() && formId) {
        try {
          const result = await apiClient(API_ENDPOINTS.responseQuality.evaluate(formId), {
            method: 'POST',
            body: {
              screenId: activeScreenId,
              fieldId: isLong ? 'long-text' : 'short-text',
              text,
              answerText: text,
              questionText:
                config.longTextQuestion ||
                config.shortTextQuestion ||
                activeScreen?.name ||
                label,
              options: qualityConfig ?? {},
            },
          });
          setQualityResult(result);
        } catch {
          setQualityResult(evaluateResponseQuality(text, qualityConfig ?? {}));
        }
      } else {
        setQualityResult(evaluateResponseQuality(text, qualityConfig ?? {}));
      }
    }, 800);
  };

  useEffect(() => {
    setFieldError('');
  }, [activeScreenId]);

  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner || !activeScreen || activeScreen.type !== 'content') return;
    if (isScreenVisibleInPreview(activeScreen, runner.answersByScreenId)) return;
    const nextId = runner.getNextScreenId(activeScreenId);
    if (nextId != null && nextId !== activeScreenId) {
      setActiveScreenId(nextId);
    }
  }, [activeScreen, activeScreenId, screens, logicConnections, logicIfRulesByEdge]);

  const recordAndAdvance = () => {
    if (activeScreenId == null) return;
    const snap = snapsByScreenId[activeScreenId] ?? emptySnap();
    const label = activeScreen?.label;
    const config = activeScreen?.config ?? {};

    if (activeScreen?.type === 'content' && !isRespondentScreenComplete(label, config, snap)) {
      setFieldError('Please complete this question before continuing.');
      return;
    }

    runnerRef.current?.recordScreenAnswers(activeScreenId, snap);
    const nextId = runnerRef.current?.getNextScreenId(activeScreenId);
    const nextScreen = nextId != null ? screens.find((s) => s.id === nextId) : null;
    const isFormComplete = nextId == null || nextScreen?.type === 'end';

    if (isFormComplete) {
      const mergedSnaps = { ...snapsByScreenId, [activeScreenId]: snap };
      const response = buildResponseFromPreview({
        formId,
        screens,
        snapsByScreenId: mergedSnaps,
      });
      submitFormResponse(formId, response, mergedSnaps).catch(() => {});
      if (nextId == null) return;
    }
    setVisitStack((s) => [...s, activeScreenId]);
    setActiveScreenId(nextId);
    setFieldError('');
  };

  const goBack = () => {
    if (!visitStack.length) return;
    const prev = visitStack[visitStack.length - 1];
    setVisitStack((s) => s.slice(0, -1));
    setActiveScreenId(prev);
    setFieldError('');
  };

  const updateSnap = (patch) => {
    if (activeScreenId == null) return;
    setSnapsByScreenId((prev) => ({
      ...prev,
      [activeScreenId]: { ...(prev[activeScreenId] ?? emptySnap()), ...patch },
    }));
    setFieldError('');
  };

  const showSiteHeader = variant === 'public';
  const title =
    formTitle ||
    draft?.formTitle ||
    activeScreen?.name ||
    activeScreen?.label ||
    'Form';

  let inner;
  if (!activeScreen) {
    inner = (
      <div className="flex min-h-[40vh] items-center justify-center text-[#666] p-8">
        Form not available.
      </div>
    );
  } else if (activeScreen.type === 'intro') {
    inner = (
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-semibold">{draft?.intro?.title || title}</h1>
        {draft?.intro?.description ? (
          <p className="text-[15px] opacity-80">{draft.intro.description}</p>
        ) : null}
        <ThemedButton theme={theme} onClick={recordAndAdvance}>
          {draft?.intro?.buttonText || 'Start'}
        </ThemedButton>
        <PreviewPoweredBy />
      </div>
    );
  } else if (activeScreen.type === 'end') {
    inner = (
      <div className="flex flex-col gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{draft?.end?.title || 'Thank you'}</h1>
        {draft?.end?.description ? (
          <p className="text-[15px] opacity-80">{draft.end.description}</p>
        ) : null}
        <PreviewPoweredBy />
      </div>
    );
  } else {
    const snap = snapsByScreenId[activeScreenId] ?? emptySnap();
    const config = activeScreen.config ?? {};
    const label = activeScreen.label;

    const questionText =
      config.singleQuestion ||
      config.multipleQuestion ||
      config.shortTextQuestion ||
      config.longTextQuestion ||
      config.ratingQuestion ||
      config.contactQuestion ||
      config.addressQuestion ||
      config.workQuestion ||
      config.mediaQuestion ||
      config.dateQuestion ||
      config.timeQuestion ||
      config.question ||
      activeScreen.name ||
      label;

    inner = (
      <div className="flex flex-col gap-6 p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
          {label}
        </p>
        <h2 className="text-xl font-semibold">{questionText}</h2>
        {config.shortTextHelperText ||
        config.longTextHelperText ||
        config.contactHelperText ? (
          <p className="text-[14px] opacity-70 -mt-4">
            {config.shortTextHelperText ||
              config.longTextHelperText ||
              config.contactHelperText ||
              config.addressHelperText ||
              config.workHelperText ||
              config.mediaHelperText}
          </p>
        ) : null}
        <RespondentScreenFields
          label={label}
          config={config}
          snap={snap}
          updateSnap={(patch) => {
            updateSnap(patch);
            if ('longTextDraft' in patch) evaluateQuality(patch.longTextDraft, config, 'Long text');
            if ('shortTextDraft' in patch) evaluateQuality(patch.shortTextDraft, config, 'Short text');
          }}
        />
        {qualityResult && (label === 'Long text' || label === 'Short text') ? (
          <ResponseQualityFeedback evaluation={qualityResult} />
        ) : null}
        {fieldError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {fieldError}
          </p>
        ) : null}
        <div className="flex gap-3 pt-2">
          {visitStack.length > 0 ? (
            <ThemedButton theme={theme} variant="secondary" onClick={goBack}>
              Back
            </ThemedButton>
          ) : null}
          <ThemedButton theme={theme} onClick={recordAndAdvance} className="flex-1">
            Continue
          </ThemedButton>
        </div>
        <PreviewPoweredBy />
      </div>
    );
  }

  return (
    <RespondentShell
      theme={theme}
      showSiteHeader={showSiteHeader}
      formTitle={title}
    >
      {inner}
    </RespondentShell>
  );
}
