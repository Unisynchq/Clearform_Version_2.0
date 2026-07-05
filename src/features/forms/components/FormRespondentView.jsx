import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiCheckLine } from 'react-icons/ri';
import ContentCard, {
  PreviewPageIndicator,
  PreviewPoweredBy,
  PreviewCardStepNav,
} from '@/features/forms/formBuilder/BuilderContentCard';
import { createFormLogicRunner } from '@/features/forms/utils/formLogicRunner';
import {
  buildLogicAnswersFromScreen,
  getSafeVisibilityAutoSkipTarget,
  isScreenVisibleInPreview,
} from '@/features/forms/utils/logicEngine';
import clearformStartLogo from '@/assets/Clearform logo.png';
import { resolveIntroLogoUrl } from '@/features/forms/utils/introLogoUtils';
import { previewCanvasConfigsFromScreen } from '@/features/forms/utils/previewCanvasConfigsFromScreen';
import { getCardShellSurface, resolveThemeFromSnapshot } from '@/features/forms/utils/respondentThemeStyles';
import {
  ESSENTIAL_TO_BLOCK,
  WELCOME_TEXT_SIZE_DESKTOP,
  WELCOME_TEXT_SIZE_MOBILE,
} from '@/features/forms/formBuilder/builderScreenMaps';
import { useRespondentCompact } from '@/features/forms/hooks/useRespondentCompact';
import {
  introInnerPadClass,
  RESPONDENT_PAGE_SHELL,
  RESPONDENT_PAGE_SHELL_FULL,
  RESPONDENT_SCREEN_FRAME,
} from '@/features/forms/utils/respondentLayout';
import { submitFormResponse, sendAbandonBeacon } from '@/api/services/responsesService';
import { buildResponseFromPreview } from '@/features/forms/utils/formResponseBuilder';
import { buildQualityConversationHistory } from '@/features/forms/utils/buildQualityConversationHistory';

const emptySnap = () => ({
  previewPicks: [],
  shortTextDraft: '',
  longTextDraft: '',
  ratingValue: 0,
  previewFields: {},
  captchaChecked: false,
  uploadedFiles: [],
});

const SCREEN_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

function IntroLogo({ logoSrc }) {
  const initial = resolveIntroLogoUrl(logoSrc, clearformStartLogo);
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(resolveIntroLogoUrl(logoSrc, clearformStartLogo));
  }, [logoSrc]);

  return (
    <div className="w-[42px] h-[42px] rounded-[10px] overflow-hidden shrink-0">
      <img
        src={src}
        alt="Logo"
        className="w-full h-full object-cover"
        onError={() => setSrc(clearformStartLogo)}
      />
    </div>
  );
}

/**
 * Live form runner — same ContentCard + preview chrome as builder preview.
 */
export default function FormRespondentView({ draft, formId }) {
  const isCompact = useRespondentCompact();
  const screens = draft?.screens ?? [];
  const logicConnections = draft?.logicConnections ?? [];
  const logicIfRulesByEdge = draft?.logicIfRulesByEdge ?? {};
  const theme = useMemo(() => resolveThemeFromSnapshot(draft?.theme), [draft?.theme]);
  const showBackButton = draft?.settings?.backButton !== false;

  const intro = screens.find((s) => s.type === 'intro');
  const [activeScreenId, setActiveScreenId] = useState(intro?.id ?? screens[0]?.id ?? null);
  const [visitStack, setVisitStack] = useState([]);
  const [snapsByScreenId, setSnapsByScreenId] = useState({});

  const runnerRef = useRef(null);
  const previewScreenValidatorRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const sessionStartedAtRef = useRef(Date.now());
  const screenEnteredAtRef = useRef({});
  const isCompletedRef = useRef(false);
  const activeScreenIdRef = useRef(activeScreenId);
  const snapsByScreenIdRef = useRef(snapsByScreenId);

  useEffect(() => {
    const runner = createFormLogicRunner({
      screens,
      logicConnections,
      logicIfRulesByEdge,
    });
    for (const [screenIdKey, snap] of Object.entries(snapsByScreenIdRef.current)) {
      const screenId = Number(screenIdKey);
      const screen = screens.find((s) => s.id === screenId);
      if (screen && snap) {
        runner.recordScreenAnswers(screenId, snap);
      }
    }
    runnerRef.current = runner;
  }, [screens, logicConnections, logicIfRulesByEdge]);

  // Keep refs in sync so the abandon handler always sees the latest values.
  useEffect(() => { activeScreenIdRef.current = activeScreenId; }, [activeScreenId]);
  useEffect(() => { snapsByScreenIdRef.current = snapsByScreenId; }, [snapsByScreenId]);

  // Send a partial session beacon when the user leaves without completing the form.
  useEffect(() => {
    if (!formId) return;
    const handleAbandon = () => {
      if (isCompletedRef.current) return;
      sendAbandonBeacon(
        formId,
        snapsByScreenIdRef.current,
        activeScreenIdRef.current,
        sessionStartedAtRef.current,
      );
    };
    window.addEventListener('beforeunload', handleAbandon);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') handleAbandon();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', handleAbandon);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [formId]);

  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;
  const activeScreenIdx = Math.max(0, screens.findIndex((s) => s.id === activeScreenId));

  const contentBlockNum = useMemo(() => {
    if (!activeScreen || activeScreen.type !== 'content') return 1;
    return screens.filter((s) => s.type === 'content').findIndex((s) => s.id === activeScreen.id) + 1;
  }, [activeScreen, screens]);

  const contentScreenCount = useMemo(
    () => screens.filter((s) => s.type === 'content').length,
    [screens],
  );

  useEffect(() => {
    if (activeScreenId == null) return;
    const now = Date.now();
    if (!screenEnteredAtRef.current[activeScreenId]) {
      screenEnteredAtRef.current[activeScreenId] = now;
    }
  }, [activeScreenId]);

  useEffect(() => {
    const runner = runnerRef.current;
    const screen = screens.find((s) => s.id === activeScreenId);
    if (!runner || !screen || screen.type !== 'content') return;
    if (isScreenVisibleInPreview(screen, runner.answersByScreenId)) return;
    const nextId = runner.getNextScreenId(activeScreenId);
    const safeNext = getSafeVisibilityAutoSkipTarget(screens, activeScreenId, nextId);
    if (safeNext != null && safeNext !== activeScreenId) {
      setActiveScreenId(safeNext);
    }
  }, [activeScreenId, screens]);

  const handlePreviewSnapChange = useCallback((screenId, snap) => {
    setSnapsByScreenId((prev) => ({ ...prev, [screenId]: snap }));
    const screen = screens.find((s) => s.id === screenId);
    if (screen && snap && runnerRef.current) {
      runnerRef.current.recordScreenAnswers(screenId, snap);
    }
  }, [screens]);

  const recordAndAdvance = useCallback(() => {
    if (activeScreenId == null) return;
    const validate = previewScreenValidatorRef.current;
    if (validate && !validate()) return;

    const snap = snapsByScreenId[activeScreenId] ?? emptySnap();
    runnerRef.current?.recordScreenAnswers(activeScreenId, snap);
    const nextId = runnerRef.current?.getNextScreenId(activeScreenId);
    const advanceId = getSafeVisibilityAutoSkipTarget(screens, activeScreenId, nextId);
    if (nextId != null && advanceId == null) return;
    const nextScreen = advanceId != null ? screens.find((s) => s.id === advanceId) : null;
    const isFormComplete = advanceId == null || nextScreen?.type === 'end';

    if (isFormComplete && formId) {
      isCompletedRef.current = true;
      const mergedSnaps = { ...snapsByScreenId, [activeScreenId]: snap };
      const startedAtMs = sessionStartedAtRef.current;
      const durationMs = Math.max(0, Date.now() - startedAtMs);
      const response = buildResponseFromPreview({
        formId,
        screens,
        snapsByScreenId: mergedSnaps,
        startedAt: new Date(startedAtMs).toISOString(),
        durationMs,
        screenTimestamps: { ...screenEnteredAtRef.current },
      });
      submitFormResponse(formId, response, mergedSnaps).catch(() => {});
      if (advanceId == null) return;
    }

    const leavingIntro = screens.find((s) => s.id === activeScreenId)?.type === 'intro';
    setVisitStack((s) => (leavingIntro ? s : [...s, activeScreenId]));
    setActiveScreenId(advanceId);
  }, [activeScreenId, snapsByScreenId, screens, formId]);

  const goBack = useCallback(() => {
    if (!visitStack.length) return;
    const prev = visitStack[visitStack.length - 1];
    setVisitStack((s) => s.slice(0, -1));
    setActiveScreenId(prev);
  }, [visitStack]);

  const introEssential = draft?.intro?.essential;
  const introAlign = draft?.intro?.alignment ?? 'left';
  const welcomeTextAlignClass =
    introAlign === 'center' ? 'text-center' : introAlign === 'right' ? 'text-right' : 'text-left';
  const welcomeItemsAlignClass =
    introAlign === 'center' ? 'items-center' : introAlign === 'right' ? 'items-end' : 'items-start';
  const welcomeJustifyClass =
    introAlign === 'center' ? 'justify-center' : introAlign === 'right' ? 'justify-end' : 'justify-start';
  const welcomeSizeMap = isCompact ? WELCOME_TEXT_SIZE_MOBILE : WELCOME_TEXT_SIZE_DESKTOP;
  const welcomeSize =
    welcomeSizeMap[draft?.intro?.textSize ?? 'M'] ?? welcomeSizeMap.M;

  const respondentCardShell = useMemo(
    () => getCardShellSurface(theme),
    [theme],
  );

  const qualityConversationHistory = useMemo(
    () =>
      buildQualityConversationHistory({
        screens,
        snapsByScreenId,
        currentScreenId: activeScreenId,
      }),
    [screens, snapsByScreenId, activeScreenId],
  );

  const previewStepNav =
    activeScreen?.type === 'content' ? (
      <PreviewCardStepNav
        prevScreen={visitStack.length > 0}
        nextScreen
        onGoPrev={goBack}
        onGoContinue={recordAndAdvance}
        showBackButton={showBackButton}
        compactLayout={isCompact}
      />
    ) : null;

  let screenBody = null;

  if (!activeScreen) {
    screenBody = (
      <div className="flex min-h-[40vh] items-center justify-center text-[#666] p-8">
        Form not available.
      </div>
    );
  } else if (activeScreen.type === 'intro') {
    if (introEssential && ESSENTIAL_TO_BLOCK[introEssential]) {
      screenBody = (
        <motion.div key={`intro-essential-${introEssential}`} className={`h-full min-h-0 flex flex-col ${RESPONDENT_SCREEN_FRAME}`} {...SCREEN_MOTION}>
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <ContentCard
              block={ESSENTIAL_TO_BLOCK[introEssential]}
              blockNum={1}
              isIntroScreen
              onDelete={() => {}}
              fullCanvas={theme.fullCanvas}
              cardColor={theme.cardColor}
              cardImage={theme.cardImage}
              accentColor={theme.accentColor}
              textColor={theme.textColor}
              imageFileInputRef={imageFileInputRef}
              onConfigure={() => {}}
              isPreviewMode
              onPreviewAdvance={recordAndAdvance}
              previewScreenValidatorRef={previewScreenValidatorRef}
              onPreviewSnapChange={handlePreviewSnapChange}
              previewScreenId={activeScreen.id}
              responseQualityFormId={formId}
              compactLayout={isCompact}
            />
          </div>
        </motion.div>
      );
    } else {
      screenBody = (
        <motion.div key="intro-screen" className={`h-full flex flex-col ${RESPONDENT_SCREEN_FRAME}`} {...SCREEN_MOTION}>
          <div
            className={`flex-1 flex flex-col w-full overflow-hidden min-h-[min(420px,70dvh)] ${respondentCardShell.borderAndRadius}`}
            style={respondentCardShell.shellStyle}
          >
            <div
              className={`flex-1 flex flex-col ${welcomeItemsAlignClass} justify-center gap-4 ${introInnerPadClass(isCompact)}`}
            >
              <IntroLogo logoSrc={draft?.intro?.logo} />
              <p
                className={`font-bold ${welcomeTextAlignClass}`}
                style={{
                  fontSize: welcomeSize.title,
                  lineHeight: welcomeSize.titleLeading,
                  color: theme.textColor,
                }}
              >
                {draft?.intro?.title || draft?.formTitle || 'Form'}
              </p>
              {draft?.intro?.description ? (
                <p
                  className={`font-normal ${welcomeTextAlignClass}`}
                  style={{
                    fontSize: welcomeSize.desc,
                    color: theme.textColor,
                    opacity: 0.65,
                  }}
                >
                  {draft.intro.description}
                </p>
              ) : null}
              <div className={`flex items-center gap-2 w-full ${welcomeJustifyClass} ${isCompact ? 'max-w-[320px]' : 'max-w-[280px]'}`}>
                <button
                  type="button"
                  onClick={recordAndAdvance}
                  className={`text-white font-bold rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap ${isCompact ? 'text-[16px] px-[40px] py-[13px]' : 'text-[14px] px-[36px] py-[11px]'}`}
                  style={{ backgroundColor: theme.accentColor }}
                >
                  {draft?.intro?.buttonText || 'Start'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }
  } else if (activeScreen.type === 'end') {
    screenBody = (
      <motion.div key="end-screen" className={`h-full flex flex-col ${RESPONDENT_SCREEN_FRAME}`} {...SCREEN_MOTION}>
        <div
          className={`flex-1 flex flex-col w-full overflow-hidden min-h-[min(420px,70dvh)] ${respondentCardShell.borderAndRadius}`}
          style={respondentCardShell.shellStyle}
        >
          <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${introInnerPadClass(isCompact)}`}>
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#1a9e4a] flex items-center justify-center shrink-0">
              <RiCheckLine size={18} className="text-white" />
            </div>
            <p
              className={`font-bold text-center tracking-[-0.56px] ${isCompact ? 'text-[28px] leading-[33.6px]' : 'text-[24px] leading-[28.8px]'}`}
              style={{ color: theme.textColor }}
            >
              {draft?.end?.title || 'Thank you'}
            </p>
            {draft?.end?.description ? (
              <p
                className="text-[15px] font-normal text-center"
                style={{ color: theme.textColor, opacity: 0.65 }}
              >
                {draft.end.description}
              </p>
            ) : null}
          </div>
        </div>
      </motion.div>
    );
  } else if (activeScreen.type === 'content' && activeScreen.section && activeScreen.label) {
    screenBody = (
      <motion.div key={`content-${activeScreen.id}`} className={`h-full min-h-0 flex flex-col ${RESPONDENT_SCREEN_FRAME}`} {...SCREEN_MOTION}>
        <div className="w-full flex-1 min-h-0 flex flex-col">
          <ContentCard
            block={activeScreen}
            blockNum={contentBlockNum}
            onDelete={() => {}}
            fullCanvas={theme.fullCanvas}
            cardColor={theme.cardColor}
            cardImage={theme.cardImage}
            accentColor={theme.accentColor}
            textColor={theme.textColor}
            {...previewCanvasConfigsFromScreen(activeScreen)}
            imageFileInputRef={imageFileInputRef}
            onConfigure={() => {}}
            isPreviewMode
            onPreviewAdvance={recordAndAdvance}
            previewStepNav={previewStepNav}
            previewScreenValidatorRef={previewScreenValidatorRef}
            onPreviewSnapChange={handlePreviewSnapChange}
            previewScreenId={activeScreen.id}
            initialPreviewSnap={snapsByScreenId[activeScreen.id]}
            responseQualityFormId={formId}
            qualityConversationHistory={qualityConversationHistory}
            compactLayout={isCompact}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={theme.fullCanvas ? RESPONDENT_PAGE_SHELL_FULL : RESPONDENT_PAGE_SHELL}
      style={{ backgroundColor: theme.pageBg, fontFamily: theme.typography }}
    >
      <div
        className="flex flex-col w-full max-w-[820px] shrink-0"
        style={{ fontFamily: theme.typography }}
      >
        {screens.length > 0 && (
          <PreviewPageIndicator
            step={activeScreen?.type === 'content' ? contentBlockNum : null}
            totalSteps={contentScreenCount}
            show={activeScreen?.type === 'content' && contentScreenCount > 0}
          />
        )}
        <motion.div layout className="flex-1 min-h-0 flex flex-col w-full">
          <AnimatePresence mode="wait">{screenBody}</AnimatePresence>
        </motion.div>
        {screens.length > 0 && <PreviewPoweredBy />}
      </div>
    </div>
  );
}
