import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RiCheckLine } from 'react-icons/ri';
import ContentCard, {
  PreviewPageIndicator,
  PreviewPoweredBy,
  PreviewCardStepNav,
} from '@/features/forms/formBuilder/BuilderContentCard';
import { createFormLogicRunner } from '@/features/forms/utils/formLogicRunner';
import { isScreenVisibleInPreview } from '@/features/forms/utils/logicEngine';
import { previewCanvasConfigsFromScreen } from '@/features/forms/utils/previewCanvasConfigsFromScreen';
import { resolveThemeFromSnapshot } from '@/features/forms/utils/respondentThemeStyles';
import {
  ESSENTIAL_TO_BLOCK,
  WELCOME_TEXT_SIZE_DESKTOP,
} from '@/features/forms/formBuilder/builderScreenMaps';
import { hexToRgba } from '@/features/forms/formBuilder/builderConfiguratorConstants';
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

const SCREEN_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

/**
 * Live form runner — same ContentCard + preview chrome as builder preview.
 */
export default function FormRespondentView({ draft, formId }) {
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

  useEffect(() => {
    runnerRef.current = createFormLogicRunner({
      screens,
      logicConnections,
      logicIfRulesByEdge,
    });
  }, [screens, logicConnections, logicIfRulesByEdge]);

  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;
  const activeScreenIdx = Math.max(0, screens.findIndex((s) => s.id === activeScreenId));

  const contentBlockNum = useMemo(() => {
    if (!activeScreen || activeScreen.type !== 'content') return 1;
    return screens.filter((s) => s.type === 'content').findIndex((s) => s.id === activeScreen.id) + 1;
  }, [activeScreen, screens]);

  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner || !activeScreen || activeScreen.type !== 'content') return;
    if (isScreenVisibleInPreview(activeScreen, runner.answersByScreenId)) return;
    const nextId = runner.getNextScreenId(activeScreenId);
    if (nextId != null && nextId !== activeScreenId) {
      setActiveScreenId(nextId);
    }
  }, [activeScreen, activeScreenId, screens, logicConnections, logicIfRulesByEdge]);

  const handlePreviewSnapChange = useCallback((screenId, snap) => {
    setSnapsByScreenId((prev) => ({ ...prev, [screenId]: snap }));
  }, []);

  const recordAndAdvance = useCallback(() => {
    if (activeScreenId == null) return;
    const validate = previewScreenValidatorRef.current;
    if (validate && !validate()) return;

    const snap = snapsByScreenId[activeScreenId] ?? emptySnap();
    runnerRef.current?.recordScreenAnswers(activeScreenId, snap);
    const nextId = runnerRef.current?.getNextScreenId(activeScreenId);
    const nextScreen = nextId != null ? screens.find((s) => s.id === nextId) : null;
    const isFormComplete = nextId == null || nextScreen?.type === 'end';

    if (isFormComplete && formId) {
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
  const welcomeSize =
    WELCOME_TEXT_SIZE_DESKTOP[draft?.intro?.textSize ?? 'M'] ?? WELCOME_TEXT_SIZE_DESKTOP.M;

  const cardShellStyle =
    theme.fullCanvas
      ? {}
      : {
          ...(theme.cardImage
            ? {
                backgroundImage: `url(${theme.cardImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : { background: theme.cardColor }),
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)',
          border: '1px solid rgba(0,0,0,0.07)',
        };

  const previewStepNav =
    activeScreen?.type === 'content' ? (
      <PreviewCardStepNav
        prevScreen={visitStack.length > 0}
        nextScreen
        onGoPrev={goBack}
        onGoContinue={recordAndAdvance}
        showBackButton={showBackButton}
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
        <motion.div key={`intro-essential-${introEssential}`} className="h-full min-h-0 flex flex-col p-5" {...SCREEN_MOTION}>
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
            />
          </div>
        </motion.div>
      );
    } else {
      screenBody = (
        <motion.div key="intro-screen" className="h-full flex flex-col p-5" {...SCREEN_MOTION}>
          <motion.div
            layout
            className={`flex-1 flex flex-col w-full overflow-hidden min-h-[420px] ${theme.fullCanvas ? '' : 'rounded-[20px]'}`}
            style={cardShellStyle}
          >
            <div
              className={`flex-1 flex flex-col ${welcomeItemsAlignClass} justify-center gap-4 px-[52px] py-[44px]`}
            >
              {draft?.intro?.logo ? (
                <div className="w-[42px] h-[42px] rounded-[10px] overflow-hidden shrink-0">
                  <img src={draft.intro.logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-[42px] h-[42px] rounded-[10px] bg-[#18181a] shrink-0" />
              )}
              <p
                className={`text-[#18181a] font-bold ${welcomeTextAlignClass}`}
                style={{ fontSize: welcomeSize.title, lineHeight: welcomeSize.titleLeading }}
              >
                {draft?.intro?.title || draft?.formTitle || 'Form'}
              </p>
              {draft?.intro?.description ? (
                <p
                  className={`text-[#8c8a84] font-normal ${welcomeTextAlignClass}`}
                  style={{ fontSize: welcomeSize.desc }}
                >
                  {draft.intro.description}
                </p>
              ) : null}
              <div className={`flex items-center gap-2 w-full ${welcomeJustifyClass} max-w-[280px]`}>
                <button
                  type="button"
                  onClick={recordAndAdvance}
                  className="bg-[#18181a] text-white text-[14px] px-[36px] py-[11px] font-bold rounded-[8px] cursor-pointer hover:bg-[#2c2c2c] transition-colors whitespace-nowrap"
                >
                  {draft?.intro?.buttonText || 'Start'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    }
  } else if (activeScreen.type === 'end') {
    const endCardBg = theme.fullCanvas
      ? {}
      : {
          background: hexToRgba(
            draft?.theme?.cardColor ?? '#f9f9fa',
            typeof draft?.theme?.cardOpacity === 'number' ? draft.theme.cardOpacity : 74,
          ),
          boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)',
          border: '1px solid rgba(0,0,0,0.07)',
        };
    screenBody = (
      <motion.div key="end-screen" className="h-full flex flex-col p-5" {...SCREEN_MOTION}>
        <motion.div
          layout
          className={`flex-1 flex flex-col w-full overflow-hidden min-h-[420px] ${theme.fullCanvas ? '' : 'rounded-[20px]'}`}
          style={endCardBg}
        >
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-[52px] py-[44px]">
            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#1a9e4a] flex items-center justify-center shrink-0">
              <RiCheckLine size={18} className="text-white" />
            </div>
            <p className="text-[#111] text-[24px] leading-[28.8px] font-bold text-center tracking-[-0.56px]">
              {draft?.end?.title || 'Thank you'}
            </p>
            {draft?.end?.description ? (
              <p className="text-[#8c8a84] text-[15px] font-normal text-center">{draft.end.description}</p>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    );
  } else if (activeScreen.type === 'content' && activeScreen.section && activeScreen.label) {
    screenBody = (
      <motion.div key={`content-${activeScreen.id}`} className="h-full min-h-0 flex flex-col p-5" {...SCREEN_MOTION}>
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
            responseQualityFormId={formId}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-10"
      style={{ backgroundColor: theme.pageBg, fontFamily: theme.typography }}
    >
      <div
        className="flex flex-col w-full max-w-[820px] shrink-0"
        style={{ fontFamily: theme.typography }}
      >
        {screens.length > 0 && (
          <PreviewPageIndicator current={activeScreenIdx + 1} total={screens.length} />
        )}
        <motion.div layout className="flex-1 min-h-0 flex flex-col w-full">
          <AnimatePresence mode="wait">{screenBody}</AnimatePresence>
        </motion.div>
        {screens.length > 0 && <PreviewPoweredBy />}
      </div>
    </div>
  );
}
