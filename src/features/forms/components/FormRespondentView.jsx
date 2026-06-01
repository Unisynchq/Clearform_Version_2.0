import { useEffect, useRef, useState } from 'react';
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

const emptySnap = () => ({
  previewPicks: [],
  shortTextDraft: '',
  longTextDraft: '',
  ratingValue: 0,
  previewFields: {},
  captchaChecked: false,
  uploadedFiles: [],
});

/**
 * Minimal live form runner — uses the same logic engine as builder preview.
 */
export default function FormRespondentView({ draft, formTitle, formId }) {
  const screens = draft?.screens ?? [];
  const logicConnections = draft?.logicConnections ?? [];
  const logicIfRulesByEdge = draft?.logicIfRulesByEdge ?? {};

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
    if (!text?.trim()) { setQualityResult(null); return; }

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
            body: { screenId: activeScreenId, fieldId: isLong ? 'long-text' : 'short-text', text, options: qualityConfig ?? {} },
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
    if (nextId == null) {
      const response = buildResponseFromPreview({
        formId,
        screens,
        snapsByScreenId: { ...snapsByScreenId, [activeScreenId]: snap },
      });
      submitFormResponse(formId, response).catch(() => {});
      return;
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

  if (!activeScreen) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#666]">
        Form not available.
      </div>
    );
  }

  const title =
    formTitle ||
    draft?.formTitle ||
    activeScreen.name ||
    activeScreen.label ||
    'Form';

  if (activeScreen.type === 'intro') {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
        <h1 className="text-2xl font-semibold text-[#18181b]">{title}</h1>
        {draft?.intro?.description ? (
          <p className="text-[15px] text-[#52525b]">{draft.intro.description}</p>
        ) : null}
        <button
          type="button"
          onClick={recordAndAdvance}
          className="rounded-lg bg-[#18181b] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#27272a] cursor-pointer"
        >
          {draft?.intro?.buttonText || 'Start'}
        </button>
      </div>
    );
  }

  if (activeScreen.type === 'end') {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold text-[#18181b]">
          {draft?.end?.title || 'Thank you'}
        </h1>
        {draft?.end?.description ? (
          <p className="text-[15px] text-[#52525b]">{draft.end.description}</p>
        ) : null}
      </div>
    );
  }

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

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-8">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a1a1aa]">
        {label}
      </p>
      <h2 className="text-xl font-semibold text-[#18181b]">{questionText}</h2>
      {config.shortTextHelperText || config.longTextHelperText || config.contactHelperText ? (
        <p className="text-[14px] text-[#71717a] -mt-4">
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
          <button
            type="button"
            onClick={goBack}
            className="rounded-lg border border-[#e4e4e7] px-4 py-2.5 text-[14px] font-medium text-[#52525b] hover:bg-[#fafaf9] cursor-pointer"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={recordAndAdvance}
          className="flex-1 rounded-lg bg-[#18181b] px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#27272a] cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
