import { Fragment, useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo, lazy, Suspense } from 'react';
import ToggleSwitch, { TOGGLE_TRACK_OFF, TOGGLE_TRACK_ON, toggleTrackClassName } from '@/components/ui/ToggleSwitch';
import ResponseQualityScoringCard, {
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
} from '@/features/forms/components/ResponseQualityScoringCard';
import ResponseQualityFeedback from '@/features/forms/components/ResponseQualityFeedback';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateForm, loadFormsFromApi, addForm } from '@/store/slices/formsSlice';
import { selectIsOnboardingActive } from '@/store/slices/onboardingSlice';
import { useToast } from '@/hooks/useToast';
import { readBuilderDraft, clearBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import {
  getBuilderSnapshot,
  saveBuilderSnapshot,
  publishForm as publishFormToApi,
  patchForm,
} from '@/api/services/formsService';
import { resolveApiWorkspaceId } from '@/features/forms/utils/createFormFromTemplateFlow';
import { buildPublishSnapshot, buildLogicMeta } from '@/features/forms/utils/buildPublishSnapshot';
import { canPublishForm, getPublishBlockers } from '@/features/forms/utils/formPublishReadiness';
import { buildFormFromTemplate } from '@/features/templates/utils/buildFormFromTemplate';
import {
  applyScreenConfig,
  extractScreenConfig,
  getBuilderScreenPreviewText,
} from '@/features/forms/utils/screenConfigSync';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  RiAddLine,
  RiFileTextLine,
  RiPaintBrushLine,
  RiGitBranchLine,
  RiSettings3Line,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiImageLine,
  RiRobot2Line,
  RiArrowDownSLine,
  RiIdCardLine,
  RiMapPinLine,
  RiBriefcaseLine,
  RiRadioButtonLine,
  RiCheckboxLine,
  RiCompassLine,
  RiFileUploadLine,
  RiStarLine,
  RiStarFill,
  RiHeartLine,
  RiHeartFill,
  RiTimeLine,
  RiCalendarLine,
  RiDeleteBin6Line,
  RiPencilLine,
  RiCheckLine,
  RiLinkedinBoxLine,
  RiArrowRightLine,
  RiComputerLine,
  RiSmartphoneLine,
  RiEyeLine,
  RiMailLine,
  RiLockLine,
  RiGlobeLine,
  RiArrowLeftLine,
  RiExternalLinkLine,
  RiSubtractLine,
  RiSkipForwardLine,
  RiStopCircleLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
} from 'react-icons/ri';
import { PiCaretCircleUp } from 'react-icons/pi';

import ContentCard from '@/features/forms/formBuilder/BuilderContentCard';
import {
  buildCanvasFieldConfigs,
  FIELD_LABEL_TO_CONFIG_PANEL,
  resolveBuilderTheme,
} from '@/features/forms/formBuilder/buildCanvasFieldConfigs';
import FormBuilderRightPanels from '@/features/forms/formBuilder/FormBuilderRightPanels';
import {
  BUILDER_TAB_MOTION,
  PANEL_SWITCH_DELAY_MS,
  SIDEBAR_ROW_MOTION,
  SIDEBAR_ROW_TRANSITION,
} from '@/features/forms/formBuilder/builderMotion';
import FormBuilderSettingsPanel from '@/features/forms/components/FormBuilderSettingsPanel';
import FormBuilderStepBar from '@/features/forms/formBuilder/FormBuilderStepBar';
import { useFormBuilderRoute } from '@/features/forms/formBuilder/useFormBuilderRoute';
import { getFormBuilderPath } from '@/features/forms/utils/formBuilderNavigation';
import { createFormAndSaveSnapshot } from '@/features/forms/utils/ensureBuilderFormPersisted';
import { finishBuilderRouteTransition } from '@/store/slices/uiSlice';
import FormBuilderLoadingFallback from '@/features/forms/pages/FormBuilderLoadingFallback';
import * as builderScreenMaps from '@/features/forms/formBuilder/builderScreenMaps';
import {
  ESSENTIALS,
  CONTENT_SECTIONS,
  QUESTION_TEMPLATE_CATEGORIES,
  CONFIGURE_TILE_GRID,
  CONFIGURE_TILE_BASE,
  ACCORDION_SECTIONS,
  CTA_COLOR_PALETTE,
} from '@/features/forms/formBuilder/builderConfiguratorConstants';

import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import IfThenLogicPanel, { createEmptyRule } from '@/features/forms/components/IfThenLogicPanel';
import FormPublishView from '@/features/forms/components/FormPublishView';
import DeleteScreenModal from '@/features/forms/components/DeleteScreenModal';
import UnsavedChangesModal from '@/features/forms/components/UnsavedChangesModal';
import PublishFormModal from '@/features/forms/components/PublishFormModal';

import TimeConfigurePanel from '@/features/forms/components/TimeConfigurePanel';
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
import {
  buildLogicQuestionOptions,
  findLogicQuestionOption,
  getLogicFieldById,
  LOGIC_FIELD_CATALOG,
  getLogicFieldOptionsForScreen as resolveLogicFieldOptionsForScreen,
  screenSupportsIfThenLogic,
} from '@/features/forms/constants/logicFieldCatalog';
import BlockVisibilityConditions from '@/features/forms/components/BlockVisibilityConditions';
import LogicCanvasActionsPanel from '@/features/forms/components/LogicCanvasActionsPanel';
import {
  LOGIC_CANVAS_DOT_GRID_STYLE,
  LOGIC_CANVAS_VIEWPORT_CLASS,
} from '@/features/forms/constants/logicCanvasViewport';
import AiLogicGenerationFailedBanner from '@/features/forms/components/AiLogicGenerationFailedBanner';
import AiLogicGenerationFailedPanel from '@/features/forms/components/AiLogicGenerationFailedPanel';
import AiLogicIdleBanner from '@/features/forms/components/AiLogicIdleBanner';
import AiLogicEmptyPanel from '@/features/forms/components/AiLogicEmptyPanel';
import {
  AI_LOGIC_GEN_STATUS,
  resetAiLogicGeneration,
  runAiLogicGeneration,
} from '@/features/forms/utils/aiLogicGeneration';
import { logicService } from '@/api';
import { isApiConfigured } from '@/config/env';
import { getSuggestedFlowLogic } from '@/features/forms/utils/logicCardDefaults';
import {
  buildLogicAnswersFromScreen,
  logicEdgeKey,
  resolveNextScreenId,
  resolveVisibleNextScreenId,
  getPriorContentScreens,
  isScreenVisibleInPreview,
} from '@/features/forms/utils/logicEngine';

const LOGIC_STORAGE_KEY = 'clearform-builder-logic-v1';
const logicStorageKeyForForm = (formId) =>
  formId == null ? LOGIC_STORAGE_KEY : `${LOGIC_STORAGE_KEY}-${formId}`;

const isUsableBuilderSnapshot = (snapshot) =>
  snapshot && typeof snapshot === 'object' && Array.isArray(snapshot.screens) && snapshot.screens.length > 0;

const builderSnapshotTime = (snapshot) =>
  Number(snapshot?.savedAt ?? snapshot?.publishedAt ?? 0);

const newestBuilderSnapshot = (...snapshots) =>
  snapshots.filter(isUsableBuilderSnapshot).sort((a, b) => builderSnapshotTime(b) - builderSnapshotTime(a))[0] ?? null;

/** Migrate legacy per-screen rules into per-connection keys. */
const migrateLogicIfRulesToEdges = (byScreen = {}) => {
  const byEdge = {};
  const elseByScreen = {};
  for (const [fromKey, data] of Object.entries(byScreen)) {
    const from = Number(fromKey);
    if (!Number.isFinite(from)) continue;
    if (data.elseScreenId != null) elseByScreen[from] = data.elseScreenId;
    for (const rule of data.rules ?? []) {
      if (rule.thenScreenId == null) continue;
      const key = logicEdgeKey(from, rule.thenScreenId);
      if (!byEdge[key]) {
        byEdge[key] = { rules: [], elseScreenId: data.elseScreenId ?? null };
      }
      byEdge[key].rules.push({
        ...rule,
        thenScreenId: rule.thenScreenId,
        conditions: (rule.conditions ?? []).map((c) => ({ ...c })),
      });
    }
  }
  return { byEdge, elseByScreen };
};

/** Copy legacy per-screen else into edges that do not have their own else yet. */
const mergeLegacyElseIntoEdges = (byEdge = {}, elseByScreen = {}) => {
  const next = { ...byEdge };
  for (const [fromKey, elseId] of Object.entries(elseByScreen)) {
    const from = Number(fromKey);
    if (!Number.isFinite(from) || elseId == null) continue;
    for (const [key, data] of Object.entries(next)) {
      const edgeFrom = Number(String(key).split('-')[0]);
      if (edgeFrom !== from || data?.elseScreenId != null) continue;
      next[key] = { ...data, elseScreenId: elseId };
    }
  }
  return next;
};
import cardTheme1 from '@/assets/Card_Themes/Theme-1.jpeg';
import cardTheme2 from '@/assets/Card_Themes/Theme-2.jpeg';
import cardTheme3 from '@/assets/Card_Themes/Theme-3.jpeg';
import cardTheme4 from '@/assets/Card_Themes/Theme-4.jpeg';

/* ── Boxes icon (CTA) ── */
const BoxesIcon = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3.5 2H6.5C7.32787 2 8 2.67213 8 3.5V6.5C8 7.32787 7.32787 8 6.5 8H3.5C2.67213 8 2 7.32787 2 6.5V3.5C2 2.67213 2.67213 2 3.5 2V2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M11.5 2H14.5C15.3279 2 16 2.67213 16 3.5V6.5C16 7.32787 15.3279 8 14.5 8H11.5C10.6721 8 10 7.32787 10 6.5V3.5C10 2.67213 10.6721 2 11.5 2V2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M3.5 10H6.5C7.32787 10 8 10.6721 8 11.5V14.5C8 15.3279 7.32787 16 6.5 16H3.5C2.67213 16 2 15.3279 2 14.5V11.5C2 10.6721 2.67213 10 3.5 10V10" stroke="currentColor" strokeWidth="1.8"/>
    <path opacity="0.4" d="M11.5 10H14.5C15.3279 10 16 10.6721 16 11.5V14.5C16 15.3279 15.3279 16 14.5 16H11.5C10.6721 16 10 15.3279 10 14.5V11.5C10 10.6721 10.6721 10 11.5 10V10" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
);

/* ── Heading icon (Text H) ── */
const TextHIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M13 3.5V12.5C13 12.6326 12.9473 12.7598 12.8536 12.8536C12.7598 12.9473 12.6326 13 12.5 13C12.3674 13 12.2402 12.9473 12.1464 12.8536C12.0527 12.7598 12 12.6326 12 12.5V8.5H4V12.5C4 12.6326 3.94732 12.7598 3.85355 12.8536C3.75979 12.9473 3.63261 13 3.5 13C3.36739 13 3.24021 12.9473 3.14645 12.8536C3.05268 12.7598 3 12.6326 3 12.5V3.5C3 3.36739 3.05268 3.24021 3.14645 3.14645C3.24021 3.05268 3.36739 3 3.5 3C3.63261 3 3.75979 3.05268 3.85355 3.14645C3.94732 3.24021 4 3.36739 4 3.5V7.5H12V3.5C12 3.36739 12.0527 3.24021 12.1464 3.14645C12.2402 3.05268 12.3674 3 12.5 3C12.6326 3 12.7598 3.05268 12.8536 3.14645C12.9473 3.24021 13 3.36739 13 3.5Z"
      fill="currentColor"
    />
  </svg>
);

/* ── Description icon (text align left) ── */
const TextAlignLeftIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2 4C2 3.86739 2.05268 3.74021 2.14645 3.64645C2.24021 3.55268 2.36739 3.5 2.5 3.5H13.5C13.6326 3.5 13.7598 3.55268 13.8536 3.64645C13.9473 3.74021 14 3.86739 14 4C14 4.13261 13.9473 4.25979 13.8536 4.35355C13.7598 4.44732 13.6326 4.5 13.5 4.5H2.5C2.36739 4.5 2.24021 4.44732 2.14645 4.35355C2.05268 4.25979 2 4.13261 2 4ZM2.5 7H10.5C10.6326 7 10.7598 6.94732 10.8536 6.85355C10.9473 6.75979 11 6.63261 11 6.5C11 6.36739 10.9473 6.24021 10.8536 6.14645C10.7598 6.05268 10.6326 6 10.5 6H2.5C2.36739 6 2.24021 6.05268 2.14645 6.14645C2.05268 6.24021 2 6.36739 2 6.5C2 6.63261 2.05268 6.75979 2.14645 6.85355C2.24021 6.94732 2.36739 7 2.5 7ZM13.5 8.5H2.5C2.36739 8.5 2.24021 8.55268 2.14645 8.64645C2.05268 8.74021 2 8.86739 2 9C2 9.13261 2.05268 9.25979 2.14645 9.35355C2.24021 9.44732 2.36739 9.5 2.5 9.5H13.5C13.6326 9.5 13.7598 9.44732 13.8536 9.35355C13.9473 9.25979 14 9.13261 14 9C14 8.86739 13.9473 8.74021 13.8536 8.64645C13.7598 8.55268 13.6326 8.5 13.5 8.5ZM10.5 11H2.5C2.36739 11 2.24021 11.0527 2.14645 11.1464C2.05268 11.2402 2 11.3674 2 11.5C2 11.6326 2.05268 11.7598 2.14645 11.8536C2.24021 11.9473 2.36739 12 2.5 12H10.5C10.6326 12 10.7598 11.9473 10.8536 11.8536C10.9473 11.7598 11 11.6326 11 11.5C11 11.3674 10.9473 11.2402 10.8536 11.1464C10.7598 11.0527 10.6326 11 10.5 11Z"
      fill="currentColor"
    />
  </svg>
);

/* ── Images / Video building block icons ── */
const ImagesCardIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M13.5 2.5H4.5C4.23478 2.5 3.98043 2.60536 3.79289 2.79289C3.60536 2.98043 3.5 3.23478 3.5 3.5V4.5H2.5C2.23478 4.5 1.98043 4.60536 1.79289 4.79289C1.60536 4.98043 1.5 5.23478 1.5 5.5V12.5C1.5 12.7652 1.60536 13.0196 1.79289 13.2071C1.98043 13.3946 2.23478 13.5 2.5 13.5H11.5C11.7652 13.5 12.0196 13.3946 12.2071 13.2071C12.3946 13.0196 12.5 12.7652 12.5 12.5V11.5H13.5C13.7652 11.5 14.0196 11.3946 14.2071 11.2071C14.3946 11.0196 14.5 10.7652 14.5 10.5V3.5C14.5 3.23478 14.3946 2.98043 14.2071 2.79289C14.0196 2.60536 13.7652 2.5 13.5 2.5ZM4.5 3.5H13.5V7.42188L12.8706 6.79313C12.7778 6.70024 12.6675 6.62656 12.5462 6.57629C12.4248 6.52602 12.2948 6.50015 12.1634 6.50015C12.0321 6.50015 11.902 6.52602 11.7807 6.57629C11.6594 6.62656 11.5491 6.70024 11.4563 6.79313L10.2063 8.04313L7.45625 5.29313C7.26873 5.10573 7.01448 5.00046 6.74937 5.00046C6.48427 5.00046 6.23002 5.10573 6.0425 5.29313L4.5 6.83563V3.5ZM11.5 12.5H2.5V5.5H3.5V10.5C3.5 10.7652 3.60536 11.0196 3.79289 11.2071C3.98043 11.3946 4.23478 11.5 4.5 11.5H11.5V12.5ZM13.5 10.5H4.5V8.25L6.75 6L9.85375 9.10375C9.94751 9.19745 10.0746 9.25008 10.2072 9.25008C10.3397 9.25008 10.4669 9.19745 10.5606 9.10375L12.1644 7.5L13.5 8.83625V10.5ZM10 5.25C10 5.10166 10.044 4.95666 10.1264 4.83332C10.2088 4.70999 10.3259 4.61386 10.463 4.55709C10.6 4.50032 10.7508 4.48547 10.8963 4.51441C11.0418 4.54335 11.1754 4.61478 11.2803 4.71967C11.3852 4.82456 11.4566 4.9582 11.4856 5.10368C11.5145 5.24917 11.4997 5.39997 11.4429 5.53701C11.3861 5.67406 11.29 5.79119 11.1667 5.8736C11.0433 5.95601 10.8983 6 10.75 6C10.5511 6 10.3603 5.92098 10.2197 5.78033C10.079 5.63968 10 5.44891 10 5.25Z"
      fill="currentColor"
    />
  </svg>
);

const VideoCardIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M10.2775 6.58375L7.2775 4.58375C7.20218 4.5335 7.11463 4.50464 7.0242 4.50026C6.93376 4.49588 6.84383 4.51614 6.76401 4.55887C6.68418 4.60161 6.61746 4.66521 6.57097 4.74291C6.52447 4.8206 6.49994 4.90946 6.5 5V9C6.49994 9.09054 6.52447 9.1794 6.57097 9.25709C6.61746 9.33478 6.68418 9.39839 6.76401 9.44113C6.84383 9.48386 6.93376 9.50412 7.0242 9.49974C7.11463 9.49536 7.20218 9.4665 7.2775 9.41625L10.2775 7.41625C10.3461 7.37061 10.4023 7.30873 10.4412 7.23611C10.4801 7.16349 10.5005 7.08238 10.5005 7C10.5005 6.91762 10.4801 6.83651 10.4412 6.76389C10.4023 6.69127 10.3461 6.62939 10.2775 6.58375ZM7.5 8.06563V5.9375L9.09875 7L7.5 8.06563ZM13.5 2.5H2.5C2.23478 2.5 1.98043 2.60536 1.79289 2.79289C1.60536 2.98043 1.5 3.23478 1.5 3.5V10.5C1.5 10.7652 1.60536 11.0196 1.79289 11.2071C1.98043 11.3946 2.23478 11.5 2.5 11.5H13.5C13.7652 11.5 14.0196 11.3946 14.2071 11.2071C14.3946 11.0196 14.5 10.7652 14.5 10.5V3.5C14.5 3.23478 14.3946 2.98043 14.2071 2.79289C14.0196 2.60536 13.7652 2.5 13.5 2.5ZM13.5 10.5H2.5V3.5H13.5V10.5ZM14.5 13C14.5 13.1326 14.4473 13.2598 14.3536 13.3536C14.2598 13.4473 14.1326 13.5 14 13.5H2C1.86739 13.5 1.74021 13.4473 1.64645 13.3536C1.55268 13.2598 1.5 13.1326 1.5 13C1.5 12.8674 1.55268 12.7402 1.64645 12.6464C1.74021 12.5527 1.86739 12.5 2 12.5H14C14.1326 12.5 14.2598 12.5527 14.3536 12.6464C14.4473 12.7402 14.5 12.8674 14.5 13Z"
      fill="currentColor"
    />
  </svg>
);

/* ── Short / Long text field icons ── */
const ShortTextIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2 5.33398H15.5M2 8.33398H9.5"
      stroke="currentColor"
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LongTextIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M2 4H15.5M2 7H15.5M2 10H15.5M2 13H11"
      stroke="currentColor"
      strokeWidth="1.125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ── Left panel: Start / End screen (src/assets/Icons/Pages_Start.svg, Pages_End.svg) ── */
const PagesStartIcon = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.88138 0.913549C6.33219 0.800404 6.80999 0.901428 7.17642 1.18737C7.54285 1.4733 7.75699 1.91222 7.75682 2.37701V11.4233C7.75699 11.888 7.54285 12.327 7.17642 12.6129C6.80999 12.8988 6.33219 12.9999 5.88138 12.8867L2.00294 11.9137C1.33227 11.7453 0.861958 11.1425 0.861816 10.4511V3.34921C0.861958 2.65774 1.33227 2.05493 2.00294 1.88661L5.88138 0.913549ZM6.464 2.37701C6.46409 2.31071 6.43364 2.24807 6.38146 2.20717C6.32929 2.16627 6.26118 2.15167 6.19682 2.16758L2.31839 3.14063C2.22242 3.16436 2.1549 3.25035 2.15463 3.34921V10.4511C2.1549 10.5499 2.22242 10.6359 2.31839 10.6596L6.19682 11.6327C6.26118 11.6486 6.32929 11.634 6.38146 11.5931C6.43364 11.5522 6.46409 11.4895 6.464 11.4233V2.37701ZM9.69604 1.72888C10.0528 1.72888 10.3424 2.01853 10.3424 2.37529V11.425C10.3424 11.7817 10.0528 12.0714 9.69604 12.0714C9.33927 12.0714 9.04963 11.7817 9.04963 11.425V2.37529C9.04963 2.01853 9.33927 1.72888 9.69604 1.72888ZM12.2817 2.59076C12.6384 2.59076 12.9281 2.8804 12.9281 3.23716V10.5631C12.9281 10.9199 12.6384 11.2095 12.2817 11.2095C11.9249 11.2095 11.6353 10.9199 11.6353 10.5631V3.23716C11.6353 2.8804 11.9249 2.59076 12.2817 2.59076Z"
      fill="currentColor"
    />
  </svg>
);

const PagesEndIcon = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.90866 0.913549C7.45785 0.800404 6.98005 0.901428 6.61362 1.18737C6.24719 1.4733 6.03305 1.91222 6.03322 2.37701V11.4233C6.03305 11.888 6.24719 12.327 6.61362 12.6129C6.98005 12.8988 7.45785 12.9999 7.90866 12.8867L11.7871 11.9137C12.4578 11.7453 12.9281 11.1425 12.9282 10.4511V3.34921C12.9281 2.65774 12.4578 2.05493 11.7871 1.88661L7.90866 0.913549ZM7.32604 2.37701C7.32595 2.31071 7.3564 2.24807 7.40858 2.20717C7.46075 2.16627 7.52886 2.15167 7.59322 2.16758L11.4717 3.14063C11.5676 3.16436 11.6351 3.25035 11.6354 3.34921V10.4511C11.6351 10.5499 11.5676 10.6359 11.4717 10.6596L7.59322 11.6327C7.52886 11.6486 7.46075 11.634 7.40858 11.5931C7.3564 11.5522 7.32595 11.4895 7.32604 11.4233V2.37701ZM4.094 1.72888C3.73724 1.72888 3.4476 2.01853 3.4476 2.37529V11.425C3.4476 11.7817 3.73724 12.0714 4.094 12.0714C4.45077 12.0714 4.74041 11.7817 4.74041 11.425V2.37529C4.74041 2.01853 4.45077 1.72888 4.094 1.72888ZM1.50838 2.59076C1.15162 2.59076 0.861973 2.8804 0.861973 3.23716V10.5631C0.861973 10.9199 1.15162 11.2095 1.50838 11.2095C1.86514 11.2095 2.15479 10.9199 2.15479 10.5631V3.23716C2.15479 2.8804 1.86514 2.59076 1.50838 2.59076Z"
      fill="currentColor"
    />
  </svg>
);

/** Logic canvas output connector — black circle with branching glyph (Figma logic port) */
const LogicOutputPortIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden
  >
    <circle cx="10" cy="10" r="10" fill="#1a1a1a" />
    <path
      d="M5.25 10H7.75M7.75 10V7.35H11.1M7.75 10V12.65H11.1"
      stroke="#fff"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="11.85" cy="7.35" r="1.2" stroke="#fff" strokeWidth="1" fill="none" />
    <circle cx="11.85" cy="12.65" r="1.2" stroke="#fff" strokeWidth="1" fill="none" />
  </svg>
);

/* ── Step bar ── */
const STEPS = [
  { id: 1, label: 'Choose use case' },
  { id: 2, label: 'Template preview' },
  { id: 3, label: 'Form builder' },
  { id: 4, label: 'Publish' },
];

const StepBar = ({ activeStep = 3 }) => (
  <div className="flex items-center">
    {STEPS.map((step, i) => (
      <div key={step.id} className="flex items-center">
        <div className="flex items-center gap-2 px-5">
          <div
            className={`w-5 h-5 rounded-[10px] flex items-center justify-center border text-[10px] font-medium leading-none shrink-0 ${
              step.id === activeStep
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white'
                : 'border-[#e4e2dc] text-[#7a7a72]'
            }`}
          >
            {step.id}
          </div>
          <span
            className={`text-[12px] font-medium whitespace-nowrap ${
              step.id === activeStep ? 'text-[#1a1a1a]' : 'text-[#7a7a72]'
            }`}
          >
            {step.label}
          </span>
        </div>
        {i < STEPS.length - 1 && (
          <RiArrowRightSLine size={16} className="text-[#e4e2dc] shrink-0" aria-hidden />
        )}
      </div>
    ))}
  </div>
);

/* ── Tab bar ── */
const TABS = [
  { id: 'content', label: 'Content', icon: RiFileTextLine },
  { id: 'design', label: 'Design', icon: RiPaintBrushLine },
  { id: 'logic', label: 'Logic', icon: RiGitBranchLine },
  { id: 'settings', label: 'Settings', icon: RiSettings3Line },
];

/* Logic canvas: default horizontal flow + free positioning offsets (board space, unscaled) */
const LOGIC_FLOW_CARD_W = 168;
const LOGIC_FLOW_GAP = 24;
const LOGIC_FLOW_CARD_H_EST = 280;
/** Below this zoom (71%), logic cards show icon + number only */
const LOGIC_CANVAS_COMPACT_ZOOM = 0.71;
const LOGIC_FLOW_CARD_H_COMPACT_EST = 52;
/** Shared card name / preview typography (screens sidebar + logic canvas) */
const SCREEN_CARD_NAME_CLASS =
  'text-[12.5px] font-semibold leading-none text-[#1a1a1c] truncate';
const SCREEN_CARD_PREVIEW_CLASS =
  'text-[12.5px] font-normal leading-none text-[#8a8880] truncate';
const LOGIC_CARD_NAME_CLASS =
  'text-[13px] font-semibold leading-[16px] text-[#1a1a1c] truncate';
const LOGIC_CARD_PREVIEW_CLASS =
  'text-[13px] font-normal leading-[16px] text-[#4c414e] line-clamp-2';
/** Padding on logic board wrapper (Tailwind px-8 py-10) */
const LOGIC_BOARD_PAD_X = 32;
const LOGIC_BOARD_PAD_Y = 40;
/** Connector anchor offsets — half of port control size places curve endpoints outside the card edge */
const LOGIC_CONNECTOR_IN_R = 4;
const LOGIC_CONNECTOR_OUT_R = 10;
/** Match SVG marker `refX` so arrow tips land on port centers */
const LOGIC_PORT_STUB = 7;
/** Horizontal offset when placing the logic menu to the left of a port */
const LOGIC_CONNECTOR_MENU_W = 148;
/** Rendered dropdown width (Tailwind `w-[125px]`) — used for viewport clamping */
const LOGIC_CONNECTOR_MENU_BOX_W = 125;
/** Approximate menu height (4 items) for clamping inside the logic viewport */
const LOGIC_CONNECTOR_MENU_BOX_H = 188;

const clampLogicMenuViewportPos = (vx, vy, vr) => {
  const maxX = Math.max(8, vr.width - LOGIC_CONNECTOR_MENU_BOX_W - 8);
  const maxY = Math.max(8, vr.height - LOGIC_CONNECTOR_MENU_BOX_H - 8);
  return {
    vx: Math.min(Math.max(8, vx), maxX),
    vy: Math.min(Math.max(8, vy), maxY),
  };
};

const logicBezierConnectionPath = (x0, y0, x1, y1) => {
  const span = Math.abs(x1 - x0);
  const dx = Math.max(56, span * 0.5);
  return `M ${x0} ${y0} C ${x0 + dx} ${y0}, ${x1 - dx} ${y1}, ${x1} ${y1}`;
};

/** Point at parameter t along the same cubic used by `logicBezierConnectionPath`, in board space */
const logicBezierPointAt = (x0, y0, x1, y1, t) => {
  const dx = Math.max(48, Math.abs(x1 - x0) * 0.45);
  const p0 = { x: x0, y: y0 };
  const p1 = { x: x0 + dx, y: y0 };
  const p2 = { x: x1 - dx, y: y1 };
  const p3 = { x: x1, y: y1 };
  const s = 1 - t;
  return {
    x: s ** 3 * p0.x + 3 * s ** 2 * t * p1.x + 3 * s * t ** 2 * p2.x + t ** 3 * p3.x,
    y: s ** 3 * p0.y + 3 * s ** 2 * t * p1.y + 3 * s * t ** 2 * p2.y + t ** 3 * p3.y,
  };
};

const logicBezierMidpoint = (x0, y0, x1, y1) => logicBezierPointAt(x0, y0, x1, y1, 0.5);

const LOGIC_ROUTE_PAD = 20;
const LOGIC_ROUTE_EXIT = 40;
const LOGIC_ROUTE_CORNER_R = 16;

const logicObstacleFromPort = (id, pos) => ({
  id,
  left: pos.left - LOGIC_ROUTE_PAD,
  top: pos.top - LOGIC_ROUTE_PAD,
  right: pos.left + pos.width + LOGIC_ROUTE_PAD,
  bottom: pos.top + pos.height + LOGIC_ROUTE_PAD,
});

const logicPointInObstacle = (x, y, obstacle) =>
  x >= obstacle.left && x <= obstacle.right && y >= obstacle.top && y <= obstacle.bottom;

/** True when the default cubic would pass through a card between source and target. */
const logicBezierHitsObstacle = (x0, y0, x1, y1, obstacle) => {
  for (let t = 0; t <= 1; t += 0.04) {
    const p = logicBezierPointAt(x0, y0, x1, y1, t);
    if (logicPointInObstacle(p.x, p.y, obstacle)) return true;
  }
  return false;
};

const logicPolylineHitsObstacle = (points, obstacle) => {
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 12));
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (logicPointInObstacle(x, y, obstacle)) return true;
    }
  }
  return false;
};

const logicPickRouteY = (x0, y0, x1, y1, blocking) => {
  const aboveY = Math.min(...blocking.map((o) => o.top)) - LOGIC_ROUTE_PAD;
  const belowY = Math.max(...blocking.map((o) => o.bottom)) + LOGIC_ROUTE_PAD;
  const aboveCost = Math.abs(aboveY - y0) + Math.abs(aboveY - y1);
  const belowCost = Math.abs(belowY - y0) + Math.abs(belowY - y1);
  if (y1 >= y0 && belowCost <= aboveCost * 1.15) return belowY;
  if (y1 < y0 && aboveCost <= belowCost * 1.15) return aboveY;
  return belowCost <= aboveCost ? belowY : aboveY;
};

const logicPointsToSegments = (points) => {
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ x0: a.x, y0: a.y, x1: b.x, y1: b.y, len });
  }
  return segments;
};

/** Rounded-corner polyline — Typeform-style trunk legs (no sharp elbows). */
const logicSmoothPolylinePathD = (points) => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return logicBezierConnectionPath(points[0].x, points[0].y, points[1].x, points[1].y);
  }
  const r = LOGIC_ROUTE_CORNER_R;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const inLen = Math.hypot(inDx, inDy) || 1;
    const outLen = Math.hypot(outDx, outDy) || 1;
    const cornerR = Math.min(r, inLen / 2, outLen / 2);
    const bx = curr.x - (inDx / inLen) * cornerR;
    const by = curr.y - (inDy / inLen) * cornerR;
    const ax = curr.x + (outDx / outLen) * cornerR;
    const ay = curr.y + (outDy / outLen) * cornerR;
    d += ` L ${bx} ${by} Q ${curr.x} ${curr.y} ${ax} ${ay}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
};

const logicObstacleBetween = (o, x0, x1, y0, y1) => {
  const minX = Math.min(x0, x1) - LOGIC_ROUTE_PAD;
  const maxX = Math.max(x0, x1) + LOGIC_ROUTE_PAD;
  const minY = Math.min(y0, y1) - 96;
  const maxY = Math.max(y0, y1) + 96;
  return o.right >= minX && o.left <= maxX && o.bottom >= minY && o.top <= maxY;
};

const logicBezierSegmentLen = (x0, y0, x1, y1) => {
  let len = 0;
  let px = x0;
  let py = y0;
  for (let t = 0.08; t <= 1; t += 0.08) {
    const p = logicBezierPointAt(x0, y0, x1, y1, t);
    len += Math.hypot(p.x - px, p.y - py);
    px = p.x;
    py = p.y;
  }
  return len;
};

const logicBuildRoutedPath = (x0, y0, x1, y1, routeY) => {
  const goingRight = x1 >= x0;
  const exitLen = Math.min(LOGIC_ROUTE_EXIT, Math.max(24, Math.abs(x1 - x0) * 0.12));
  const xOut = goingRight ? x0 + exitLen : x0 - exitLen;
  const xIn = goingRight ? x1 - exitLen : x1 + exitLen;
  const points = [
    { x: x0, y: y0 },
    { x: xOut, y: y0 },
    { x: xOut, y: routeY },
    { x: xIn, y: routeY },
    { x: xIn, y: y1 },
    { x: x1, y: y1 },
  ];
  return {
    d: logicSmoothPolylinePathD(points),
    type: 'polyline',
    points,
    segments: logicPointsToSegments(points),
  };
};

const joinLogicPathParts = (parts) => {
  if (parts.length === 1) return parts[0];
  let d = '';
  const points = [];
  const segments = [];
  for (const p of parts) {
    if (!d) {
      d = p.d;
      if (p.points) points.push(...p.points);
      else points.push({ x: p.x0, y: p.y0 }, { x: p.x1, y: p.y1 });
    } else {
      const trimmed = p.d.replace(/^M\s*[-\d.]+\s+[-\d.]+\s*/i, '');
      d += ` ${trimmed}`;
      if (p.points) points.push(...p.points.slice(1));
      else points.push({ x: p.x1, y: p.y1 });
    }
    if (p.segments) segments.push(...p.segments);
    else if (p.type === 'bezier') {
      segments.push({
        x0: p.x0,
        y0: p.y0,
        x1: p.x1,
        y1: p.y1,
        len: logicBezierSegmentLen(p.x0, p.y0, p.x1, p.y1),
      });
    }
  }
  return { type: 'compound', d, points, segments };
};

/** Single segment between two ports — smooth bezier or routed corridor around blocking cards. */
const buildLogicConnectionSegment = (x0, y0, x1, y1, obstacles = []) => {
  const relevant = obstacles.filter((o) => logicObstacleBetween(o, x0, x1, y0, y1));
  const blocking = relevant.filter((o) => logicBezierHitsObstacle(x0, y0, x1, y1, o));
  if (blocking.length === 0) {
    return {
      d: logicBezierConnectionPath(x0, y0, x1, y1),
      type: 'bezier',
      x0,
      y0,
      x1,
      y1,
      segments: [{ x0, y0, x1, y1, len: logicBezierSegmentLen(x0, y0, x1, y1) }],
    };
  }

  const routeAboveY = Math.min(...blocking.map((o) => o.top)) - LOGIC_ROUTE_PAD;
  const routeBelowY = Math.max(...blocking.map((o) => o.bottom)) + LOGIC_ROUTE_PAD;
  const candidates = [logicPickRouteY(x0, y0, x1, y1, blocking), routeAboveY, routeBelowY];

  for (const routeY of candidates) {
    const routed = logicBuildRoutedPath(x0, y0, x1, y1, routeY);
    const hits = relevant.some((o) => logicPolylineHitsObstacle(routed.points, o));
    if (!hits) return routed;
  }

  return logicBuildRoutedPath(x0, y0, x1, y1, candidates[0]);
};

/**
 * Full connection path with optional shared trunks (branch out / merge in like Typeform).
 * @param {{ prefixWaypoints?: {x:number,y:number}[], suffixWaypoints?: {x:number,y:number}[] }} trunk
 */
const buildLogicConnectionPath = (x0, y0, x1, y1, obstacles = [], trunk = {}) => {
  const prefix = trunk.prefixWaypoints ?? [];
  const suffix = trunk.suffixWaypoints ?? [];

  if (prefix.length === 0 && suffix.length === 0) {
    return buildLogicConnectionSegment(x0, y0, x1, y1, obstacles);
  }

  const parts = [];

  if (prefix.length > 0) {
    const pts = [{ x: x0, y: y0 }, ...prefix];
    parts.push({
      d: logicSmoothPolylinePathD(pts),
      type: 'polyline',
      points: pts,
      segments: logicPointsToSegments(pts),
    });
  }

  const mainStart = prefix.length > 0 ? prefix[prefix.length - 1] : { x: x0, y: y0 };
  const mainEnd = suffix.length > 0 ? suffix[0] : { x: x1, y: y1 };
  parts.push(
    buildLogicConnectionSegment(mainStart.x, mainStart.y, mainEnd.x, mainEnd.y, obstacles)
  );

  if (suffix.length > 0) {
    const pts = [...suffix, { x: x1, y: y1 }];
    parts.push({
      d: logicSmoothPolylinePathD(pts),
      type: 'polyline',
      points: pts,
      segments: logicPointsToSegments(pts),
    });
  }

  return joinLogicPathParts(parts);
};

const logicConnectionPathPointAt = (meta, t) => {
  if (meta.type === 'bezier') {
    return logicBezierPointAt(meta.x0, meta.y0, meta.x1, meta.y1, t);
  }
  const total = meta.segments.reduce((sum, seg) => sum + seg.len, 0);
  if (total === 0) return meta.points[0] ?? { x: 0, y: 0 };
  let dist = total * t;
  for (const seg of meta.segments) {
    if (dist <= seg.len || seg === meta.segments[meta.segments.length - 1]) {
      const r = seg.len === 0 ? 0 : dist / seg.len;
      return {
        x: seg.x0 + (seg.x1 - seg.x0) * r,
        y: seg.y0 + (seg.y1 - seg.y0) * r,
      };
    }
    dist -= seg.len;
  }
  const last = meta.points[meta.points.length - 1];
  return last ?? { x: 0, y: 0 };
};

const logicConnectionPathMidpoint = (meta) => logicConnectionPathPointAt(meta, 0.5);

/** Edge kinds chosen from the connector dot menu */
const LOGIC_EDGE_KIND = {
  next: 'next',
  if: 'if',
  skip: 'skip',
  end: 'end',
};

/** Replace same from→to if present; `kind: null` = pending until user picks from logic menu */
const upsertLogicConnection = (prev, from, to, kind) => {
  const tail = prev.filter((c) => !(c.from === from && c.to === to));
  return [...tail, { from, to, kind: kind === undefined ? null : kind }];
};

/** Label + leading icon per edge kind — matches logic connector menu semantics (Figma pill uses same iconography). */
const logicEdgeKindControlMeta = (kind) => {
  const k = kind ?? LOGIC_EDGE_KIND.next;
  if (k === LOGIC_EDGE_KIND.if) return { label: 'If/Else', Icon: RiGitBranchLine };
  if (k === LOGIC_EDGE_KIND.skip) return { label: 'Skip', Icon: RiSkipForwardLine };
  if (k === LOGIC_EDGE_KIND.end) return { label: 'End', Icon: RiStopCircleLine };
  return { label: 'Next', Icon: RiArrowRightLine };
};

const LOGIC_EDGE_STROKE = '#b5b3ad';
const LOGIC_EDGE_STROKE_STRONG = '#8f8d87';
const LOGIC_EDGE_STROKE_SKIP = '#a8a6a0';

const getLogicEdgePathProps = (kind) => {
  if (kind == null) {
    return {
      fill: 'none',
      stroke: LOGIC_EDGE_STROKE,
      strokeWidth: 1.25,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeDasharray: '5 4',
      markerEnd: 'url(#logicFlowArrowHeadMuted)',
    };
  }
  const k = kind;
  const base = {
    fill: 'none',
    stroke: LOGIC_EDGE_STROKE_STRONG,
    strokeWidth: 1.25,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    markerEnd: 'url(#logicFlowArrowHead)',
  };
  if (k === LOGIC_EDGE_KIND.if) return { ...base, strokeDasharray: '6 5' };
  if (k === LOGIC_EDGE_KIND.skip) {
    return { ...base, stroke: LOGIC_EDGE_STROKE_SKIP, strokeDasharray: '5 4' };
  }
  if (k === LOGIC_EDGE_KIND.end) return { ...base, strokeWidth: 1.5 };
  return base;
};

/** In-progress wire from output port — always dashed with CSS motion until drop commits */
const LOGIC_CONNECT_DRAG_DASH = '6 5';

const getLogicConnectDragPathProps = (kind) => {
  const base = getLogicEdgePathProps(kind ?? null);
  return {
    ...base,
    strokeDasharray: LOGIC_CONNECT_DRAG_DASH,
    className: 'logic-connect-drag-path',
  };
};

const LOGIC_EDGE_HOVER_STROKE = '#dc2626';
const LOGIC_EDGE_KIND_HOVER_STROKE = '#16a34a';

const getLogicEdgePathPropsHovered = (kind) => {
  const base = getLogicEdgePathProps(kind);
  return {
    ...base,
    stroke: LOGIC_EDGE_HOVER_STROKE,
    markerEnd: 'url(#logicFlowArrowHeadRed)',
  };
};

const getLogicEdgePathPropsKindHovered = (kind) => {
  const base = getLogicEdgePathProps(kind);
  return {
    ...base,
    stroke: LOGIC_EDGE_KIND_HOVER_STROKE,
    markerEnd: 'url(#logicFlowArrowHeadGreen)',
  };
};

const LOGIC_EDGE_HIT_STROKE_WIDTH = 18;

const resolveLogicEdgeStrokeProps = (edgeKey, kind, disconnectHoveredKey, kindHoveredKey) => {
  if (disconnectHoveredKey === edgeKey) return getLogicEdgePathPropsHovered(kind);
  if (kindHoveredKey === edgeKey) return getLogicEdgePathPropsKindHovered(kind);
  return getLogicEdgePathProps(kind);
};

/** Visible edge + wide transparent hit stroke (hover line → green, click → logic options) */
const LogicEdgePathGroup = ({
  d,
  edgeKey,
  kind,
  connection,
  disconnectHoveredKey,
  kindHoveredKey,
  onKindEnter,
  onKindLeave,
  onEdgeClick,
  hitsOnly = false,
}) => {
  const strokeProps = resolveLogicEdgeStrokeProps(
    edgeKey,
    kind,
    disconnectHoveredKey,
    kindHoveredKey,
  );
  if (hitsOnly) {
    return (
      <g data-logic-edge={edgeKey}>
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={LOGIC_EDGE_HIT_STROKE_WIDTH}
          pointerEvents="stroke"
          className="cursor-pointer"
          aria-label={
            kind === LOGIC_EDGE_KIND.if
              ? 'Edit if/else logic for this connection'
              : 'Open logic options for this connection'
          }
          onPointerEnter={() => onKindEnter(edgeKey)}
          onPointerLeave={onKindLeave}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEdgeClick(connection, e.clientX, e.clientY);
          }}
        />
      </g>
    );
  }
  return (
    <g data-logic-edge={edgeKey} pointerEvents="none">
      <path d={d} pointerEvents="none" {...strokeProps} />
    </g>
  );
};

/** × on the connection line — removes the wire only */
const LogicEdgeLineDisconnectButton = ({
  x,
  y,
  onDisconnect,
  onPointerEnter,
  onPointerLeave,
}) => (
  <div
    data-logic-edge-disconnect
    className="absolute z-[11] flex items-center justify-center pointer-events-auto"
    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    onPointerDown={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      aria-label="Disconnect connection"
      title="Disconnect connection"
      className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#e6e4e0] bg-white p-0 text-[#5c5c58] hover:bg-[#fafaf9] hover:text-[#1a1a1a] cursor-pointer touch-none outline-none appearance-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/35 focus-visible:ring-offset-1 [&::-moz-focus-inner]:border-0"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={(e) => {
        e.stopPropagation();
        onDisconnect();
      }}
    >
      <RiCloseLine size={11} aria-hidden className="shrink-0 pointer-events-none" />
    </button>
  </div>
);

/** Edge pill: kind label + optional × to clear if-logic (wire stays) */
const LogicEdgeControlPill = ({
  pillX,
  pillY,
  meta,
  showClearLogic,
  onClearLogic,
  onPillClick,
}) => (
  <div
    role="group"
    aria-label={`Connection ${meta.label}`}
    data-logic-edge-pill
    className="absolute z-[12] pointer-events-none"
    style={{
      left: pillX,
      top: pillY,
      transform: 'translate(-50%, -50%)',
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <div
      className={`inline-flex flex-nowrap items-center gap-1.5 rounded-[10px] border border-solid border-[#cacaca] bg-[#e8ddfa] pl-2 pr-1.5 py-1 ${
        onPillClick ? 'pointer-events-auto cursor-pointer hover:bg-[#dfd0f8] transition-colors' : ''
      }`}
      onPointerDown={onPillClick ? (e) => e.stopPropagation() : undefined}
      onClick={
        onPillClick
          ? (e) => {
              e.stopPropagation();
              onPillClick();
            }
          : undefined
      }
      onKeyDown={
        onPillClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onPillClick();
              }
            }
          : undefined
      }
      role={onPillClick ? 'button' : undefined}
      tabIndex={onPillClick ? 0 : undefined}
    >
      <span className="inline-flex flex-nowrap items-center gap-1 shrink-0">
        <meta.Icon size={13} className="shrink-0 text-[#636363]" aria-hidden />
        <span className="text-[11px] font-medium leading-normal text-[#636363] whitespace-nowrap select-none">
          {meta.label}
        </span>
      </span>
      {showClearLogic ? (
        <button
          type="button"
          aria-label="Remove logic"
          title="Remove logic"
          className="flex size-[20px] shrink-0 items-center justify-center rounded-full border border-[#636363]/35 bg-transparent p-0 text-[#636363] hover:bg-white/45 cursor-pointer touch-none pointer-events-auto outline-none appearance-none focus-visible:ring-2 focus-visible:ring-[#4f46e5]/35 focus-visible:ring-offset-1 [&::-moz-focus-inner]:border-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClearLogic();
          }}
        >
          <RiCloseLine size={11} aria-hidden className="shrink-0 pointer-events-none" />
        </button>
      ) : null}
    </div>
  </div>
);

/** Rebuild [intro, ...content, end] by following logic edges from intro; unreachable content keeps prior relative order. */
const reorderScreensFromLogicConnections = (screens, connections) => {
  const intro = screens.find((s) => s.type === 'intro');
  const end = screens.find((s) => s.type === 'end');
  const content = screens.filter((s) => s.type === 'content');
  if (!intro || !end) return screens;

  const outgoing = new Map();
  for (const e of connections) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from).push(e);
  }
  for (const edges of outgoing.values()) {
    edges.sort((a, b) => a.to - b.to || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }

  const pickPrimaryTo = (fromId) => {
    const resolved = (outgoing.get(fromId) ?? []).filter((e) => e.kind != null);
    if (!resolved.length) return null;
    const nextEdge = resolved.find((e) => e.kind === LOGIC_EDGE_KIND.next);
    return (nextEdge ?? resolved[0]).to;
  };

  const chainIds = [];
  let cur = intro.id;
  const visited = new Set();
  while (true) {
    const to = pickPrimaryTo(cur);
    if (to == null) break;
    if (to === end.id) break;
    if (visited.has(to)) break;
    visited.add(to);
    const s = screens.find((x) => x.id === to);
    if (!s || s.type !== 'content') break;
    chainIds.push(to);
    cur = to;
  }

  const inChain = new Set(chainIds);
  const contentIdOrder = content.map((s) => s.id);
  const orphanIds = contentIdOrder.filter((id) => !inChain.has(id));
  const newContentIds = [...chainIds, ...orphanIds];
  const byId = new Map(screens.map((s) => [s.id, s]));
  const newContent = newContentIds.map((id) => byId.get(id)).filter(Boolean);

  return [intro, ...newContent, end];
};

/** Group edges for fanning multiple connectors from/to the same node (stable sort). */
const groupLogicConnectionsByFrom = (connections) => {
  const m = new Map();
  for (const c of connections) {
    if (!m.has(c.from)) m.set(c.from, []);
    m.get(c.from).push(c);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.to - b.to || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }
  return m;
};

const groupLogicConnectionsByTo = (connections) => {
  const m = new Map();
  for (const c of connections) {
    if (!m.has(c.to)) m.set(c.to, []);
    m.get(c.to).push(c);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.from - b.from || String(a.kind ?? '').localeCompare(String(b.kind ?? '')));
  }
  return m;
};

const LOGIC_EDGE_FAN_PX = 16;
/** Shared horizontal trunk before branches fan / merge (Typeform-style) */
const LOGIC_IF_TRUNK_PX = 56;

const logicConnectionEndpoints = (c, byFrom, byTo, a, b) => {
  const fromArr = byFrom.get(c.from) ?? [c];
  const fi = Math.max(0, fromArr.indexOf(c));
  const nF = fromArr.length;
  const dy0 = nF <= 1 ? 0 : (fi - (nF - 1) / 2) * LOGIC_EDGE_FAN_PX;

  const toArr = byTo.get(c.to) ?? [c];
  const fj = Math.max(0, toArr.indexOf(c));
  const nT = toArr.length;
  const dy1 = nT <= 1 ? 0 : (fj - (nT - 1) / 2) * LOGIC_EDGE_FAN_PX;

  const useFromTrunk = nF > 1;
  const useToTrunk = nT > 1;
  const outY = a.outY ?? a.portY;
  const inY = b.inY ?? b.portY;

  let prefixWaypoints = [];
  let suffixWaypoints = [];

  if (useFromTrunk) {
    const trunkX = a.outX + LOGIC_IF_TRUNK_PX;
    prefixWaypoints = [
      { x: trunkX, y: outY },
      { x: trunkX, y: outY + dy0 },
    ];
  }
  if (useToTrunk) {
    const approachX = b.inX - LOGIC_IF_TRUNK_PX;
    suffixWaypoints = [
      { x: approachX, y: inY + dy1 },
      { x: approachX, y: inY },
    ];
  }

  return {
    x0: a.outX,
    y0: useFromTrunk ? outY : outY + dy0,
    x1: b.inX,
    y1: useToTrunk ? inY : inY + dy1,
    prefixWaypoints,
    suffixWaypoints,
  };
};

/** Pull path endpoints through port centers so stroke + arrowhead overlap the anchor dots */
const applyLogicPortStubs = (x0, y0, x1, y1) => ({
  x0: x0 - LOGIC_PORT_STUB,
  y0,
  x1: x1 + LOGIC_PORT_STUB,
  y1,
});

/* ── Design themes ── */
const THEMES = [
  {
    id: 'sage',
    name: 'Sage — Organic',
    cardBg: '#b8cfc6',
    previewType: 'image',
    previewImg: cardTheme1,
  },
  {
    id: 'earth',
    name: 'Earth — Warm',
    cardBg: '#f0e6d3',
    previewType: 'image',
    previewImg: cardTheme2,
  },
  {
    id: 'terra',
    name: 'Terra — Bold',
    cardBg: '#e06b55',
    previewType: 'image',
    previewImg: cardTheme3,
  },
  {
    id: 'azure',
    name: 'Azure — Minimal',
    cardBg: '#b5cedf',
    previewType: 'image',
    previewImg: cardTheme4,
  },
];

/* ── Typography font map ── */
const TYPOGRAPHY_FONTS = {
  default:   "'DM Sans', sans-serif",
  serif:     "Georgia, 'Times New Roman', serif",
  monospace: "'Consolas', 'Courier New', monospace",
};

/* ── Hex → rgba helper ── */
const hexToRgba = (hex, opacity) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
};

const PREVIEW_PAGE_INDICATOR_H = 34;
const PREVIEW_POWERED_BY_H = 38;
const PREVIEW_CHROME_H = PREVIEW_PAGE_INDICATOR_H + PREVIEW_POWERED_BY_H;

/** Page counter shown above the form card in preview — Figma 2521:8332 */
const PreviewPageIndicator = ({ current, total }) => (
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
const PreviewPoweredBy = () => (
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
const PreviewCardStepNav = ({ prevScreen, nextScreen, onGoPrev, onGoContinue }) => (
  <div className="border-t border-[#cfcecd] flex items-center justify-between shrink-0 px-14 pt-[15px] pb-[18px]">
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

const {
  SCREEN_ICON_MAP,
  LABEL_TO_CONFIG_PANEL,
  WELCOME_TEXT_SIZE_DESKTOP,
  WELCOME_TEXT_SIZE_MOBILE,
  ESSENTIAL_TO_BLOCK,
  SCREEN_ICON_BADGE_HEX,
} = builderScreenMaps;

const FormBuilderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { activeFormId } = useFormBuilderRoute();
  const formAccentColor = location.state?.formColor ?? '#3b7bf6';
  const fromOnboarding = location.state?.fromOnboarding === true;
  const showOnboardingStepper = useSelector(selectIsOnboardingActive);
  const persistedForm = useSelector((state) =>
    activeFormId == null
      ? null
      : state.forms.forms.find((form) => String(form.id) === String(activeFormId)) ?? null
  );
  const previewScreenValidatorRef = useRef(null);

  useEffect(() => {
    // Clear route loading bridge once the builder page mounts.
    dispatch(finishBuilderRouteTransition());
  }, [dispatch]);

  const [deviceView, setDeviceView] = useState('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishView, setIsPublishView] = useState(false);
  const [publishedPublicUrl, setPublishedPublicUrl] = useState(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [screens, setScreens] = useState([]);
  const [activeScreenId, setActiveScreenId] = useState(null);
  const [logicModeManual, setLogicModeManual] = useState(true);
  const [aiLogicGen, setAiLogicGen] = useState({
    status: AI_LOGIC_GEN_STATUS.idle,
    errorMessage: '',
  });
  const patchAiLogicGen = useCallback((patch) => {
    setAiLogicGen((prev) => ({ ...prev, ...patch }));
  }, []);
  const [logicCanvasZoom, setLogicCanvasZoom] = useState(1);
  const [logicCanvasPan, setLogicCanvasPan] = useState({ x: 0, y: 0 });
  const logicPanDragRef = useRef(null);
  const [logicCanvasPanning, setLogicCanvasPanning] = useState(false);
  const logicViewportRef = useRef(null);
  const logicBoardMeasureRef = useRef(null);
  const logicPortPositionsRef = useRef(new Map());
  const logicConnectGestureRef = useRef(null);
  const logicPortTapRef = useRef(null);
  const logicCanvasPanRef = useRef({ x: 0, y: 0 });
  const logicCanvasZoomRef = useRef(1);
  const logicPrevTabRef = useRef(activeTab);
  const [logicCardDraggingId, setLogicCardDraggingId] = useState(null);
  const [logicCardDragOffset, setLogicCardDragOffset] = useState({ x: 0, y: 0 });
  const logicCardDragRef = useRef(null);
  /** Per-screen-id offsets on the logic canvas only; does not change Content sidebar order */
  const [logicCardOffsets, setLogicCardOffsets] = useState({});
  /** Directed edges on the logic canvas only (screen id → screen id); does not reorder the Content list */
  const [logicConnections, setLogicConnections] = useState([]);
  /** While dragging from an output port: current pointer in board (padding) coordinates */
  const [logicConnectDrag, setLogicConnectDrag] = useState(null);
  /** Context menu from a quick tap on an output connector dot (coords relative to logic viewport) */
  const [logicConnectorMenu, setLogicConnectorMenu] = useState(null);
  /** If/then + else keyed by `${fromScreenId}-${toScreenId}` (one config per connection) */
  const [logicIfRulesByEdge, setLogicIfRulesByEdge] = useState({});
  /** @deprecated Legacy per-screen else; merged into logicIfRulesByEdge on load */
  const [logicElseByScreen, setLogicElseByScreen] = useState({});
  const [ifThenLogicPanelEdge, setIfThenLogicPanelEdge] = useState(null);
  const [ifThenDraft, setIfThenDraft] = useState(null);
  const ifThenDraftSnapshotRef = useRef(null);
  const previewSnapByScreenRef = useRef({});
  const previewAnswersByScreenRef = useRef({});
  const [previewVisitStack, setPreviewVisitStack] = useState([]);
  const previewVisitStackRef = useRef([]);
  const [previewSnapVersion, setPreviewSnapVersion] = useState(0);
  const logicStorageHydratedRef = useRef(false);
  const logicMergeSessionRef = useRef(null);
  /** Hover on disconnect control highlights the corresponding edge in red */
  const [logicDisconnectHoveredKey, setLogicDisconnectHoveredKey] = useState(null);
  const [logicEdgeKindHoveredKey, setLogicEdgeKindHoveredKey] = useState(null);
  /** Measured card heights on the logic canvas (for vertically centered connector ports) */
  const [logicCardHeights, setLogicCardHeights] = useState({});
  /** Measured port anchor centers in board space (from DOM) */
  const [logicPortDomAnchors, setLogicPortDomAnchors] = useState({});
  /* -- Left panel: reorder content screens (between intro & end) -- */
  const contentScreensScrollRef = useRef(null);
  const prevContentScreensCountRef = useRef(0);
  const contentDragSourceIdRef = useRef(null);
  const contentDragLastTargetRef = useRef(null);
  const [contentDraggingId, setContentDraggingId] = useState(null);
  const [contentDropTargetId, setContentDropTargetId] = useState(null);

  useEffect(() => {
    previewVisitStackRef.current = previewVisitStack;
  }, [previewVisitStack]);

  useEffect(() => {
    if (!isPreview) {
      setPreviewVisitStack([]);
      return;
    }
    setPreviewVisitStack([]);
    const intro = screens.find((s) => s.type === 'intro');
    if (intro) setActiveScreenId(intro.id);
  }, [isPreview]);

  useEffect(() => {
    if (!contentDraggingId) return undefined;
    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'grabbing';
    return () => {
      document.body.style.cursor = prevCursor;
    };
  }, [contentDraggingId]);

  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadedFormTitle, setLoadedFormTitle] = useState(
    () => location.state?.formTitle ?? null
  );
  const [isEditingFormTitle, setIsEditingFormTitle] = useState(false);
  const [draftFormTitle, setDraftFormTitle] = useState('');
  const formTitleInputRef = useRef(null);
  const lastHydratedTemplateIdRef = useRef(null);
  const newFormHydratedRef = useRef(false);
  const builderDraftHydratedRef = useRef(false);
  const builderHydrationSessionRef = useRef(null);
  const builderBaselineRef = useRef(null);
  const builderBaselineSessionRef = useRef(null);
  const [builderHydrated, setBuilderHydrated] = useState(false);
  const [builderSaveStatus, setBuilderSaveStatus] = useState('idle');
  const lastSaveToastAtRef = useRef(0);
  const lastPersistedSnapshotRef = useRef(null);
  const ensureFormPersistedRef = useRef(async () => null);
  const ensureFormInFlightRef = useRef(false);
  const formTouchedRef = useRef(false);
  const markFormTouched = () => {
    formTouchedRef.current = true;
  };
  const autoPreviewAppliedRef = useRef(false);
  const prevActiveScreenIdRef = useRef(null);
  const configGlobalsRef = useRef({});
  const introTitleRef = useRef('Title');
  const fieldPreviewFallbackRef = useRef({});
  const [logicQuestionOptionsTick, setLogicQuestionOptionsTick] = useState(0);
  const [sections, setSections] = useState({
    essentials: true,
    questionTemplates: false,
    fieldSettings: false,
    appearance: false,
  });

  /* ── Welcome screen field-settings state ── */
  const [welcomeRequired, setWelcomeRequired] = useState(true);
  const [welcomeHidden, setWelcomeHidden] = useState(false);
  const [welcomeReadOnly, setWelcomeReadOnly] = useState(false);
  const [welcomePlaceholder, setWelcomePlaceholder] = useState('Type your answer here…');
  const [welcomeHelperText, setWelcomeHelperText] = useState('Press Enter to continue');
  const [welcomeMinLength, setWelcomeMinLength] = useState(0);
  const [welcomeMaxLength, setWelcomeMaxLength] = useState(80);
  const [welcomeInputType, setWelcomeInputType] = useState('Free text');
  const [welcomeInputTypeOpen, setWelcomeInputTypeOpen] = useState(false);
  const [welcomeTextSize, setWelcomeTextSize] = useState('M');
  const [welcomeAlignment, setWelcomeAlignment] = useState('left');
  const welcomeInputTypeRef = useRef(null);

  /* ── Response quality scoring state ── */
  const [responseQualityEnabled, setResponseQualityEnabled] = useState(false);
  const [responseQualityOptions, setResponseQualityOptions] = useState(DEFAULT_RESPONSE_QUALITY_OPTIONS);
  const [shortTextResponseQualityEnabled, setShortTextResponseQualityEnabled] = useState(false);
  const [shortTextResponseQualityOptions, setShortTextResponseQualityOptions] = useState(
    DEFAULT_RESPONSE_QUALITY_OPTIONS
  );

  /* ── Content panel state ── */
  const [showContentPanel, setShowContentPanel] = useState(false);

  /* ── Form Settings state ── */
  const [settingsOneAtATime, setSettingsOneAtATime] = useState(false);
  const [settingsAutoAdvance, setSettingsAutoAdvance] = useState(true);
  const [settingsBackButton, setSettingsBackButton] = useState(false);
  const [settingsCompletionAction, setSettingsCompletionAction] = useState('Show thank you screen');
  const [settingsResubmission, setSettingsResubmission] = useState(true);
  const [settingsConfirmationEmail, setSettingsConfirmationEmail] = useState(true);
  const [settingsSubmissionNotifications, setSettingsSubmissionNotifications] = useState(false);
  const [settingsEmailCollection, setSettingsEmailCollection] = useState(true);
  const [settingsLanguage, setSettingsLanguage] = useState('English');
  const [settingsPasswordProtection, setSettingsPasswordProtection] = useState(false);
  const [settingsResponseLimit, setSettingsResponseLimit] = useState(false);
  const [settingsResponseLimitCount, setSettingsResponseLimitCount] = useState('500');
  const [settingsWebhook, setSettingsWebhook] = useState(false);

  /* ── Design (Customization) panel state ── */
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [showThemeOverlay, setShowThemeOverlay] = useState(false);
  const [pendingScreenDelete, setPendingScreenDelete] = useState(null);
  const [activeThemeId, setActiveThemeId] = useState('sage');
  const [designLayoutStyle, setDesignLayoutStyle] = useState('withCard');
  const [designBackground, setDesignBackground] = useState('#f0eee8');
  const [designCardColor, setDesignCardColor] = useState('#f9f9fa');
  const [designCardImage, setDesignCardImage] = useState(null);
  const [designCardColorGridOpen, setDesignCardColorGridOpen] = useState(false);
  const [designTextColorGridOpen, setDesignTextColorGridOpen] = useState(false);
  const [designCardOpacity, setDesignCardOpacity] = useState(74);
  const [designTextColor, setDesignTextColor] = useState('#3d3d3d');
  const [designTypography, setDesignTypography] = useState('default');

  /* ── CTA configure panel state ── */
  const [showCtaConfigPanel, setShowCtaConfigPanel] = useState(false);
  const [ctaButtonLabel, setCtaButtonLabel] = useState('Get started');
  const [ctaHeadingText, setCtaHeadingText] = useState('Welcome to our survey');
  const [ctaHelperText, setCtaHelperText] = useState(
    'Please fill out this form to help us improve. It only takes a couple of minutes and your feedback matters.'
  );
  const [ctaDurationText, setCtaDurationText] = useState('Takes ~3 minutes');
  const [isEditingCtaCard, setIsEditingCtaCard] = useState(false);
  const [ctaButtonSize, setCtaButtonSize] = useState('M');
  const [ctaButtonStyle, setCtaButtonStyle] = useState('Filled');
  const [ctaCornerRadius, setCtaCornerRadius] = useState(10);
  const [ctaBtnColor, setCtaBtnColor] = useState('#1a1a1a');
  const [ctaBtnColorGridOpen, setCtaBtnColorGridOpen] = useState(false);
  const [ctaTextColor, setCtaTextColor] = useState('#ffffff');
  const [ctaColorGridOpen, setCtaColorGridOpen] = useState(false);
  const [ctaLabelColor, setCtaLabelColor] = useState('white');
  const [ctaShowIcon, setCtaShowIcon] = useState(true);
  const [ctaHeadingSize, setCtaHeadingSize] = useState(28);
  const [ctaBodySize, setCtaBodySize] = useState(15);
  const [ctaFontWeight, setCtaFontWeight] = useState('Regular');
  const [ctaTextAlign, setCtaTextAlign] = useState('center');
  const [ctaPadding, setCtaPadding] = useState(44);
  const [ctaContentWidth, setCtaContentWidth] = useState('Default');
  const [ctaSections, setCtaSections] = useState({ button: true, typography: true, spacing: true });

  /* ── Heading configure panel state ── */
  const [showHeadingConfigPanel, setShowHeadingConfigPanel] = useState(false);
  const [isEditingHeadingCard, setIsEditingHeadingCard] = useState(false);
  const [headingText, setHeadingText] = useState('');
  const [headingAnswerText, setHeadingAnswerText] = useState('');
  const [subHeading, setSubHeading] = useState('');
  const [headingRequired, setHeadingRequired] = useState(false);
  const [headingHidden, setHeadingHidden] = useState(false);
  const [headingLevel, setHeadingLevel] = useState('H2');
  const [headingTextSize, setHeadingTextSize] = useState('M');
  const [headingAlignment, setHeadingAlignment] = useState('left');
  const [headingFontWeight, setHeadingFontWeight] = useState('Regular');
  const [headingSections, setHeadingSections] = useState({ fieldSettings: true, conditionalLogic: true, appearance: true });
  const [showIfConditions, setShowIfConditions] = useState([]);

  /* ── Description configure panel state ── */
  const [showDescriptionConfigPanel, setShowDescriptionConfigPanel] = useState(false);
  const [descriptionContent, setDescriptionContent] = useState('');
  const [descriptionHidden, setDescriptionHidden] = useState(false);
  const [descriptionShowCharCount, setDescriptionShowCharCount] = useState(false);
  const [descriptionCharLimit, setDescriptionCharLimit] = useState('');
  const [descriptionFormatting, setDescriptionFormatting] = useState({ bold: false, italic: false, underline: false, link: false, list: false });
  const [descriptionTextSize, setDescriptionTextSize] = useState('M');
  const [descriptionAlignment, setDescriptionAlignment] = useState('left');
  const [descriptionSections, setDescriptionSections] = useState({ fieldSettings: true, conditionalLogic: true, appearance: true });

  /* ── Image configure panel state ── */
  const [showImageConfigPanel, setShowImageConfigPanel] = useState(false);
  const [imageHidden, setImageHidden] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageLinkOnClick, setImageLinkOnClick] = useState(false);
  const [imageLinkUrl, setImageLinkUrl] = useState('');
  const [imageOpenInNewTab, setImageOpenInNewTab] = useState(false);
  const [imageAlignment, setImageAlignment] = useState('left');
  const [imageWidth, setImageWidth] = useState('Full');
  const [imageCornerRadius, setImageCornerRadius] = useState(8);
  const [imageQuestion, setImageQuestion] = useState('What do you see in this image?');
  const [imageDescription, setImageDescription] = useState("Describe what's happening in the photo above.");
  const [imageSections, setImageSections] = useState({ fieldSettings: true, conditionalLogic: true, appearance: true });
  const imageFileInputRef = useRef(null);

  /* ── Video configure panel state ── */
  const [showVideoConfigPanel, setShowVideoConfigPanel] = useState(false);
  const [videoRequired, setVideoRequired] = useState(false);
  const [videoHidden, setVideoHidden] = useState(false);
  const [videoLoop, setVideoLoop] = useState(false);
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [videoShowControls, setVideoShowControls] = useState(true);
  const [videoSource, setVideoSource] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [videoWidth, setVideoWidth] = useState('Full');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [videoCornerRadius, setVideoCornerRadius] = useState(8);
  const [videoQuestion, setVideoQuestion] = useState('After watching the video, what are your thoughts?');
  const [videoDescription, setVideoDescription] = useState('Share your honest feedback about the product demo.');
  const [videoSections, setVideoSections] = useState({ fieldSettings: true, appearance: true, conditionalLogic: false });

  /* ── Contact configure panel state ── */
  const [showContactConfigPanel, setShowContactConfigPanel] = useState(false);
  const [contactRequired, setContactRequired] = useState(false);
  const [contactQuestion, setContactQuestion] = useState('How can we get in touch?');
  const [contactHelperText, setContactHelperText] = useState("We'll only reach out if we have a follow-up question.");
  const [contactFields, setContactFields] = useState({
    firstName: { visible: true, required: false },
    lastName: { visible: true, required: false },
    email: { visible: true, required: true },
    phone: { visible: true, required: false },
    company: { visible: false, required: false },
  });
  const [contactSections, setContactSections] = useState({ fieldSettings: true, fields: true, conditionalLogic: false });

  /* ── Address configure panel state ── */
  const [showAddressConfigPanel, setShowAddressConfigPanel] = useState(false);
  const [addressRequired, setAddressRequired] = useState(false);
  const [addressQuestion, setAddressQuestion] = useState("What's your mailing address?");
  const [addressHelperText, setAddressHelperText] = useState('');
  const [addressFields, setAddressFields] = useState({
    street: { visible: true, required: false },
    city: { visible: true, required: false },
    state: { visible: true, required: false },
    postal: { visible: true, required: false },
    country: { visible: true, required: false },
  });
  const [addressSections, setAddressSections] = useState({ fieldSettings: true, fields: true, conditionalLogic: false });

  /* ── Work configure panel state ── */
  const [showWorkConfigPanel, setShowWorkConfigPanel] = useState(false);
  const [workRequired, setWorkRequired] = useState(false);
  const [workQuestion, setWorkQuestion] = useState('Tell us about your role');
  const [workHelperText, setWorkHelperText] = useState('');
  const [workFields, setWorkFields] = useState({
    company: { visible: true, required: false },
    title: { visible: true, required: false },
    industry: { visible: true, required: false },
    teamSize: { visible: true, required: false },
  });
  const [workSections, setWorkSections] = useState({ fieldSettings: true, fields: true, conditionalLogic: false });

  /* ── Short text configure panel state ── */
  const [showShortTextConfigPanel, setShowShortTextConfigPanel] = useState(false);
  const [shortTextRequired, setShortTextRequired] = useState(false);
  const [shortTextHidden, setShortTextHidden] = useState(false);
  const [shortTextQuestion, setShortTextQuestion] = useState("What's your name?");
  const [shortTextHelperText, setShortTextHelperText] = useState('Please enter your full name as it appears on official documents.');
  const [shortTextPlaceholder, setShortTextPlaceholder] = useState('Type your answer here…');
  const [shortTextMinChars, setShortTextMinChars] = useState(0);
  const [shortTextMaxChars, setShortTextMaxChars] = useState(100);
  const [shortTextValidation, setShortTextValidation] = useState('None');
  const [shortTextSize, setShortTextSize] = useState('M');
  const [shortTextAlign, setShortTextAlign] = useState('left');
  const [shortTextSections, setShortTextSections] = useState({
    fieldSettings: true,
    appearance: true,
    conditionalLogic: false,
    responseQuality: false,
  });

  /* ── Long text configure panel state ── */
  const [showLongTextConfigPanel, setShowLongTextConfigPanel] = useState(false);
  const [longTextRequired, setLongTextRequired] = useState(false);
  const [longTextHidden, setLongTextHidden] = useState(false);
  const [longTextQuestion, setLongTextQuestion] = useState('Tell us about your experience');
  const [longTextHelperText, setLongTextHelperText] = useState("Share as much or as little as you'd like.");
  const [longTextPlaceholder, setLongTextPlaceholder] = useState('Type your answer here…');
  const [longTextMinChars, setLongTextMinChars] = useState(0);
  const [longTextMaxChars, setLongTextMaxChars] = useState(500);
  const [longTextValidation, setLongTextValidation] = useState('None');
  const [longTextSize, setLongTextSize] = useState('M');
  const [longTextAlign, setLongTextAlign] = useState('left');
  const [longTextSections, setLongTextSections] = useState({ fieldSettings: true, appearance: true, conditionalLogic: false, responseQuality: false });

  /* ── Multiple choice configure panel state ── */
  const [showMultipleConfigPanel, setShowMultipleConfigPanel] = useState(false);
  const [multipleRequired, setMultipleRequired] = useState(true);
  const [multipleAllowOther, setMultipleAllowOther] = useState(false);
  const [multipleRandomize, setMultipleRandomize] = useState(false);
  const [multipleMultipleSelect, setMultipleMultipleSelect] = useState(false);
  const [multipleShowKeyboardHints, setMultipleShowKeyboardHints] = useState(false);
  const [multipleOptionHeight, setMultipleOptionHeight] = useState('M');
  const [multipleMinChoices, setMultipleMinChoices] = useState(1);
  const [multipleMaxChoices, setMultipleMaxChoices] = useState(null);
  const [multipleQuestion, setMultipleQuestion] = useState('Which features do you use most?');
  const [multipleHelperText, setMultipleHelperText] = useState('Select all that apply.');
  const [multipleOptions, setMultipleOptions] = useState(['Dashboard', 'Reports', 'Integrations', 'Analytics']);
  const [multipleLayout, setMultipleLayout] = useState('List');
  const [multipleSections, setMultipleSections] = useState({ fieldSettings: true, options: false, appearance: true });

  /* ── Single choice configure panel state ── */
  const [showSingleConfigPanel, setShowSingleConfigPanel] = useState(false);
  const [singleRequired, setSingleRequired] = useState(true);
  const [singleMultipleSelect, setSingleMultipleSelect] = useState(false);
  const [singleRandomize, setSingleRandomize] = useState(false);
  const [singleAllowOther, setSingleAllowOther] = useState(true);
  const [singleMinChoices, setSingleMinChoices] = useState(1);
  const [singleMaxChoices, setSingleMaxChoices] = useState(null);
  const [singleShowKeyboardHints, setSingleShowKeyboardHints] = useState(true);
  const [singleLayout, setSingleLayout] = useState('List');
  const [singleOptionHeight, setSingleOptionHeight] = useState('M');
  const [singleQuestion, setSingleQuestion] = useState('How did you hear about us?');
  const [singleHelperText, setSingleHelperText] = useState('Choose the option that best describes your experience.');
  const [singleOptions, setSingleOptions] = useState(['Social media', 'Search engine', 'Friend / colleague', 'Advertisement']);
  const [singleSections, setSingleSections] = useState({ fieldSettings: true, appearance: true });

  /* ── Media choices configure panel state ── */
  const [showMediaConfigPanel, setShowMediaConfigPanel] = useState(false);
  const [mediaRequired, setMediaRequired] = useState(false);
  const [mediaAllowMultiple, setMediaAllowMultiple] = useState(false);
  const [mediaRandomiseOrder, setMediaRandomiseOrder] = useState(false);
  const [mediaMinChoices, setMediaMinChoices] = useState(1);
  const [mediaMaxChoices, setMediaMaxChoices] = useState(null);
  const [mediaLayout, setMediaLayout] = useState('2col');
  const [mediaOptionHeight, setMediaOptionHeight] = useState('S');
  const [mediaQuestion, setMediaQuestion] = useState('Choose an image option');
  const [mediaHelperText, setMediaHelperText] = useState('Select the image that best represents your answer.');
  const [mediaOptions, setMediaOptions] = useState([
    { label: 'Option A', image: null },
    { label: 'Option B', image: null },
    { label: 'Option C', image: null },
    { label: 'Option D', image: null },
  ]);
  const [mediaSections, setMediaSections] = useState({ fieldSettings: true, options: true, conditionalLogic: false, appearance: true });

  /* ── Captcha configure panel state ── */
  const [showCaptchaConfigPanel, setShowCaptchaConfigPanel] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState(true);
  const [captchaProvider, setCaptchaProvider] = useState('Google reCAPTCHA v3');
  const [captchaSiteKey, setCaptchaSiteKey] = useState('');
  const [captchaSecretKey, setCaptchaSecretKey] = useState('');
  const [captchaVisibility, setCaptchaVisibility] = useState('invisible');
  const [captchaShowBadge, setCaptchaShowBadge] = useState(true);
  const [captchaBadgePosition, setCaptchaBadgePosition] = useState('bottom-right');
  const [captchaBlockOnFailure, setCaptchaBlockOnFailure] = useState(true);
  const [captchaSections, setCaptchaSections] = useState({ fieldSettings: true, behaviour: false, conditionalLogic: false });

  /* ── Multi-image upload configure panel state ── */
  const [showMultiImageConfigPanel, setShowMultiImageConfigPanel] = useState(false);
  const [multiImageQuestion, setMultiImageQuestion] = useState('Upload photos of the issue');
  const [multiImageHelperText, setMultiImageHelperText] = useState('Add up to 9 images. Drag to reorder.');
  const [multiImageRequired, setMultiImageRequired] = useState(false);
  const [multiImageMultipleFiles, setMultiImageMultipleFiles] = useState(true);
  const [multiImageMaxFiles, setMultiImageMaxFiles] = useState(5);
  const [multiImageMaxFileSize, setMultiImageMaxFileSize] = useState('25 MB');
  const [multiImageSizeDropdownOpen, setMultiImageSizeDropdownOpen] = useState(false);

  /* -- File upload (Upload) configure state -- */
  const [uploadQuestion, setUploadQuestion] = useState('Attach supporting documents');
  const [uploadHelperText, setUploadHelperText] = useState('Attach any files that help us understand your request better.');
  const [uploadMaxFileSize, setUploadMaxFileSize] = useState('25 MB');
  const [multiImageAcceptedTypes, setMultiImageAcceptedTypes] = useState(['PDF', 'PNG', 'JPG', 'DOCX']);
  const [multiImageUploadZoneSize, setMultiImageUploadZoneSize] = useState('Default');
  const [multiImageShowPreview, setMultiImageShowPreview] = useState(true);
  const [multiImageSections, setMultiImageSections] = useState({ fieldSettings: true, appearance: true });

  /* ── Date configure panel state ── */
  const [showDateConfigPanel, setShowDateConfigPanel] = useState(false);
  const [dateQuestion, setDateQuestion] = useState("When's the best date for you?");
  const [dateHelperText, setDateHelperText] = useState('Pick a date from the calendar.');
  const [dateRequired, setDateRequired] = useState(false);
  const [dateSections, setDateSections] = useState({ fieldSettings: true });

  /* ── Time configure panel state ── */
  const [showTimeConfigPanel, setShowTimeConfigPanel] = useState(false);
  const [timeQuestion, setTimeQuestion] = useState('What time works best for you?');
  const [timeHelperText, setTimeHelperText] = useState('Select your preferred time slot.');
  const [timeRequired, setTimeRequired] = useState(true);
  const [timeUse12h, setTimeUse12h] = useState(false);
  const [timeShowSeconds, setTimeShowSeconds] = useState(true);
  const [timeMinTime, setTimeMinTime] = useState('');
  const [timeMaxTime, setTimeMaxTime] = useState('');
  const [timeSections, setTimeSections] = useState({ fieldSettings: true });

  /* ── Rating configure panel state ── */
  const [showRatingConfigPanel, setShowRatingConfigPanel] = useState(false);
  const [ratingQuestion, setRatingQuestion] = useState('How would you rate your overall experience?');
  const [ratingRequired, setRatingRequired] = useState(false);
  const [ratingUseScale, setRatingUseScale] = useState(true);
  const [ratingUseSlider, setRatingUseSlider] = useState(false);
  const [ratingMaxRating, setRatingMaxRating] = useState(5);
  const [ratingStyle, setRatingStyle] = useState('Stars');
  const [ratingLowLabel, setRatingLowLabel] = useState('Very poor');
  const [ratingHighLabel, setRatingHighLabel] = useState('Excellent');
  const [ratingShowLabels, setRatingShowLabels] = useState(true);
  const [ratingIconSize, setRatingIconSize] = useState('M');
  const [ratingSections, setRatingSections] = useState({ fieldSettings: true, appearance: true });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFileName(file.name);
    }
    e.target.value = '';
  };

  const [openContentSections, setOpenContentSections] = useState({
    buildingBlocks: true,
    basicInfo: true,
    qualitative: true,
    choiceBased: true,
    interactive: true,
    numeric: true,
  });

  const toggleContentSection = (key) => {
    setOpenContentSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Add/remove content screens ── */
  const nextIdRef = useRef(100);
  const closePanelsRef = useRef(() => {});
  const addContentScreen = (sectionKey, itemLabel) => {
    const newId = (nextIdRef.current += 1);
    const newScreen = {
      id: newId,
      name: itemLabel,
      type: 'content',
      section: sectionKey,
      label: itemLabel,
    };
    setScreens((prev) => {
      const endIdx = prev.findIndex((s) => s.type === 'end');
      if (endIdx === -1) return [...prev, newScreen];
      return [...prev.slice(0, endIdx), newScreen, ...prev.slice(endIdx)];
    });
    setActiveScreenId(newId);
    markFormTouched();
    setShowContentPanel(false);
    closePanelsRef.current();
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
    panelTimerRef.current = setTimeout(() => {
      openConfigurePanelForLabel(itemLabel);
    }, PANEL_SWITCH_DELAY_MS);
  };

  const removeContentScreen = (screenId) => {
    if (activeScreenId === screenId) {
      closeAllRightPanels();
    }
    setLogicConnections((prev) => prev.filter((c) => c.from !== screenId && c.to !== screenId));
    setLogicIfRulesByEdge((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const [from, to] = key.split('-').map(Number);
        if (from === screenId || to === screenId) delete next[key];
      }
      return next;
    });
    setLogicElseByScreen((prev) => {
      const next = { ...prev };
      delete next[screenId];
      return next;
    });
    if (ifThenLogicPanelEdge?.from === screenId || ifThenLogicPanelEdge?.to === screenId) {
      setIfThenLogicPanelEdge(null);
      setIfThenDraft(null);
    }
    setScreens((prev) => {
      const remaining = prev.filter((s) => s.id !== screenId);
      if (activeScreenId === screenId) {
        const idx = prev.findIndex((s) => s.id === screenId);
        const fallback = remaining[Math.max(0, idx - 1)];
        setActiveScreenId(fallback ? fallback.id : null);
      }
      return remaining;
    });
  };

  const reorderContentScreens = useCallback((prev, fromId, toId) => {
    if (fromId == null || toId == null || fromId === toId) return prev;
    const intro = prev.filter((s) => s.type === 'intro');
    const content = prev.filter((s) => s.type === 'content');
    const end = prev.filter((s) => s.type === 'end');
    const fromIdx = content.findIndex((s) => s.id === fromId);
    const toIdx = content.findIndex((s) => s.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
    const next = [...content];
    const [removed] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, removed);
    return [...intro, ...next, ...end];
  }, []);

  const handleContentRowDragStart = (e, screenId) => {
    contentDragSourceIdRef.current = screenId;
    contentDragLastTargetRef.current = null;
    setContentDraggingId(screenId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(screenId));

    const row = e.currentTarget.closest('[data-content-screen-row]');
    if (row instanceof HTMLElement) {
      const rect = row.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      const clone = row.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      Object.assign(clone.style, {
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: `${rect.width}px`,
        opacity: '0.96',
        transform: 'rotate(1.25deg)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
        borderRadius: '8px',
        background: '#fff',
        pointerEvents: 'none',
      });
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, offsetX, offsetY);
      requestAnimationFrame(() => {
        document.body.removeChild(clone);
      });
    }
  };

  const handleContentRowDragOver = (e, screenId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fromId = contentDragSourceIdRef.current;
    if (fromId == null || fromId === screenId) return;
    setContentDropTargetId(screenId);
    if (contentDragLastTargetRef.current === screenId) return;
    contentDragLastTargetRef.current = screenId;
    setScreens((prev) => reorderContentScreens(prev, fromId, screenId));
  };

  const handleContentRowDrop = (e) => {
    e.preventDefault();
    contentDragSourceIdRef.current = null;
    contentDragLastTargetRef.current = null;
    setContentDraggingId(null);
    setContentDropTargetId(null);
  };

  const handleContentRowDragEnd = () => {
    contentDragSourceIdRef.current = null;
    contentDragLastTargetRef.current = null;
    setContentDraggingId(null);
    setContentDropTargetId(null);
  };

  const onLogicCardPointerDown = useCallback((e, screenId) => {
    if (e.button !== 0) return;
    if (e.target instanceof Element && e.target.closest('[data-logic-output-port]')) return;
    e.stopPropagation();
    logicCardDragRef.current = { startX: e.clientX, startY: e.clientY, screenId };
    setLogicCardDraggingId(screenId);
    setLogicCardDragOffset({ x: 0, y: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onLogicCardPointerMove = useCallback((e, screenId) => {
    const d = logicCardDragRef.current;
    if (!d || d.screenId !== screenId) return;
    const z = logicCanvasZoomRef.current;
    setLogicCardDragOffset({ x: (e.clientX - d.startX) / z, y: (e.clientY - d.startY) / z });
  }, []);

  const onLogicCardPointerUp = useCallback((e, screenId) => {
    const d = logicCardDragRef.current;
    logicCardDragRef.current = null;
    setLogicCardDraggingId(null);
    setLogicCardDragOffset({ x: 0, y: 0 });
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (!d || d.screenId !== screenId) return;
    const moved = Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY);
    if (moved < 10) return;

    const z = logicCanvasZoomRef.current;
    const dx = (e.clientX - d.startX) / z;
    const dy = (e.clientY - d.startY) / z;
    setLogicCardOffsets((prev) => ({
      ...prev,
      [screenId]: {
        x: (prev[screenId]?.x ?? 0) + dx,
        y: (prev[screenId]?.y ?? 0) + dy,
      },
    }));
  }, []);

  const clientToLogicBoardLocal = useCallback((clientX, clientY) => {
    const board = logicBoardMeasureRef.current;
    if (!board) return { x: 0, y: 0 };
    const r = board.getBoundingClientRect();
    const z = logicCanvasZoomRef.current;
    return {
      x: (clientX - r.left - LOGIC_BOARD_PAD_X * z) / z,
      y: (clientY - r.top - LOGIC_BOARD_PAD_Y * z) / z,
    };
  }, []);

  const resolveLogicDropTarget = useCallback((clientX, clientY, fromId, boardX, boardY) => {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const node of stack) {
      if (!(node instanceof Element)) continue;
      const card = node.closest('[data-logic-card]');
      if (!card) continue;
      const sid = card.getAttribute('data-screen-id');
      if (!sid) continue;
      const id = Number(sid);
      if (id === fromId) continue;
      return id;
    }

    const local = clientToLogicBoardLocal(clientX, clientY);
    const bx = boardX ?? local.x;
    const by = boardY ?? local.y;
    const snapR = 44;
    let bestId = null;
    let bestD = snapR;
    logicPortPositionsRef.current.forEach((pos, id) => {
      if (id === fromId || pos.inX == null || pos.kind === 'intro') return;
      const d = Math.hypot(bx - pos.inX, by - (pos.inY ?? pos.portY));
      if (d < bestD) {
        bestD = d;
        bestId = id;
      }
    });
    return bestId;
  }, [clientToLogicBoardLocal]);

  const removeLogicConnection = useCallback(
    (fromId, toId) => {
      setLogicConnectorMenu(null);
      setLogicDisconnectHoveredKey(null);
      setLogicConnections((prev) => prev.filter((c) => !(c.from === fromId && c.to === toId)));
      setLogicIfRulesByEdge((prev) => {
        const next = { ...prev };
        delete next[logicEdgeKey(fromId, toId)];
        return next;
      });
      if (ifThenLogicPanelEdge?.from === fromId && ifThenLogicPanelEdge?.to === toId) {
        setIfThenLogicPanelEdge(null);
        setIfThenDraft(null);
      }
    },
    [ifThenLogicPanelEdge]
  );

  const handleLogicMenuConnectNext = useCallback((fromId) => {
    setLogicConnectorMenu(null);
    const idx = screens.findIndex((s) => s.id === fromId);
    if (idx === -1 || idx >= screens.length - 1) return;
    const target = screens[idx + 1];
    if (target.type === 'intro') return;
    setLogicConnections((prev) => upsertLogicConnection(prev, fromId, target.id, LOGIC_EDGE_KIND.next));
  }, [screens]);

  const handleLogicMenuConnectEnd = useCallback((fromId) => {
    setLogicConnectorMenu(null);
    const end = screens.find((s) => s.type === 'end');
    if (!end) return;
    const fromScreen = screens.find((s) => s.id === fromId);
    const kind =
      fromScreen?.type === 'intro' ? LOGIC_EDGE_KIND.next : LOGIC_EDGE_KIND.end;
    setLogicConnections((prev) => upsertLogicConnection(prev, fromId, end.id, kind));
  }, [screens]);

  const handleLogicMenuSkip = useCallback((fromId) => {
    setLogicConnectorMenu(null);
    const idx = screens.findIndex((s) => s.id === fromId);
    if (idx === -1) return;
    const target = screens[idx + 2];
    if (!target || target.type === 'intro') return;
    setLogicConnections((prev) => upsertLogicConnection(prev, fromId, target.id, LOGIC_EDGE_KIND.skip));
  }, [screens]);

  const getLogicQuestionOptionsForForm = useCallback(
    () =>
      buildLogicQuestionOptions({
        screens,
        getQuestionText: (screen) =>
          getBuilderScreenPreviewText(screen, fieldPreviewFallbackRef.current, activeScreenId),
        welcomeInputType,
        welcomeHidden,
        introTitle: introTitleRef.current,
      }),
    [screens, welcomeInputType, welcomeHidden, logicQuestionOptionsTick, activeScreenId]
  );

  const getLogicFieldOptionsForScreen = useCallback(
    (screen) =>
      resolveLogicFieldOptionsForScreen(screen, {
        welcomeInputType,
        welcomeHidden,
      }),
    [welcomeInputType, welcomeHidden]
  );

  const getLogicDestinationOptions = useCallback(
    (fromScreenId) => {
      const end = screens.find((s) => s.type === 'end');
      const destinations = screens
        .filter((s) => s.type === 'content' && s.id !== fromScreenId)
        .map((s) => ({
          id: s.id,
          label: s.name || s.label || 'Screen',
        }));
      if (end) destinations.push({ id: end.id, label: 'End screen' });
      return destinations;
    },
    [screens]
  );

  const normalizeCondition = useCallback(
    (condition, questionOptions, fromScreenId) => {
      if (condition.sourceScreenId != null) {
        const opt = findLogicQuestionOption(
          questionOptions,
          condition.sourceScreenId,
          condition.fieldId
        );
        if (opt) return { ...condition };
      }
      const match =
        questionOptions.find((o) => Number(o.sourceScreenId) === Number(fromScreenId)) ??
        questionOptions.find((o) => o.fieldId === condition.fieldId) ??
        questionOptions[0];
      if (!match) return condition;
      return {
        ...condition,
        sourceScreenId: match.sourceScreenId,
        fieldId: match.fieldId,
      };
    },
    []
  );

  const buildDefaultIfThenDraft = useCallback(
    (fromScreenId, toScreenId, initialThenScreenId = null) => {
      const questionOptions = getLogicQuestionOptionsForForm();
      const end = screens.find((s) => s.type === 'end');
      const targetTo = toScreenId ?? initialThenScreenId;
      const defaultElse = end?.id ?? null;

      if (targetTo != null) {
        const saved = logicIfRulesByEdge[logicEdgeKey(fromScreenId, targetTo)];
        if (saved?.rules?.length) {
          return {
            rules: saved.rules.map((r) => ({
              ...r,
              thenScreenId: targetTo,
              conditions: r.conditions.map((c) =>
                normalizeCondition(c, questionOptions, fromScreenId)
              ),
            })),
            elseScreenId: saved.elseScreenId ?? defaultElse,
          };
        }
        return {
          rules: [
            {
              ...createEmptyRule(questionOptions, fromScreenId),
              thenScreenId: targetTo,
            },
          ],
          elseScreenId: defaultElse,
        };
      }

      const firstDest =
        initialThenScreenId ??
        screens.find((s) => s.type === 'content' && s.id !== fromScreenId)?.id ??
        end?.id ??
        null;
      const screen = screens.find((s) => s.id === fromScreenId);
      const destinations = getLogicDestinationOptions(fromScreenId);
      const suggested = getSuggestedFlowLogic(
        screen?.label,
        questionOptions,
        destinations,
        end?.id ?? null,
        fromScreenId
      );
      return {
        rules: suggested.rules.map((r) => ({
          ...r,
          thenScreenId: r.thenScreenId ?? firstDest,
          conditions: r.conditions.map((c) =>
            normalizeCondition(c, questionOptions, fromScreenId)
          ),
        })),
        elseScreenId: suggested.elseScreenId ?? defaultElse,
      };
    },
    [
      screens,
      logicIfRulesByEdge,
      getLogicQuestionOptionsForForm,
      normalizeCondition,
      getLogicDestinationOptions,
    ]
  );

  const openIfThenLogicPanel = useCallback(
    (fromScreenId, { to: toScreenId = null, initialThenScreenId = null } = {}) => {
      const fromScreen = screens.find((s) => s.id === fromScreenId);
      if (!screenSupportsIfThenLogic(fromScreen)) return;
      closeRightConfigPanels({ keepContentPanel: true, keepIfThenPanel: true });
      setLogicConnectorMenu(null);
      const targetTo = toScreenId ?? initialThenScreenId;
      const draft = buildDefaultIfThenDraft(fromScreenId, targetTo, initialThenScreenId);
      ifThenDraftSnapshotRef.current = JSON.parse(JSON.stringify(draft));
      setIfThenDraft(draft);
      setIfThenLogicPanelEdge(
        targetTo != null
          ? { from: fromScreenId, to: targetTo }
          : { from: fromScreenId, to: null }
      );
    },
    [buildDefaultIfThenDraft, screens]
  );

  const closeIfThenLogicPanel = useCallback(() => {
    setIfThenLogicPanelEdge(null);
    setIfThenDraft(null);
    ifThenDraftSnapshotRef.current = null;
  }, []);

  const clearLogicForConnection = useCallback(
    (fromId, toId) => {
      setLogicConnectorMenu(null);
      setLogicIfRulesByEdge((prev) => {
        const next = { ...prev };
        delete next[logicEdgeKey(fromId, toId)];
        return next;
      });
      setLogicConnections((prev) => {
        const edge = prev.find((c) => c.from === fromId && c.to === toId);
        if (edge?.kind === LOGIC_EDGE_KIND.if) {
          return upsertLogicConnection(prev, fromId, toId, LOGIC_EDGE_KIND.next);
        }
        return prev;
      });
      if (ifThenLogicPanelEdge?.from === fromId && ifThenLogicPanelEdge?.to === toId) {
        setIfThenLogicPanelEdge(null);
        setIfThenDraft(null);
        ifThenDraftSnapshotRef.current = null;
      }
    },
    [ifThenLogicPanelEdge]
  );

  const cancelIfThenLogicPanel = useCallback(() => {
    closeIfThenLogicPanel();
  }, [closeIfThenLogicPanel]);

  const saveIfThenLogic = useCallback(() => {
    if (!ifThenLogicPanelEdge || !ifThenDraft) return;
    const from = ifThenLogicPanelEdge.from;
    const prevTo = ifThenLogicPanelEdge.to;
    const to = ifThenDraft.rules[0]?.thenScreenId ?? prevTo;
    if (to == null) return;

    setLogicIfRulesByEdge((prev) => {
      const next = { ...prev };
      if (prevTo != null && Number(prevTo) !== Number(to)) {
        delete next[logicEdgeKey(from, prevTo)];
      }
      next[logicEdgeKey(from, to)] = {
        rules: ifThenDraft.rules.map((r) => ({
          ...r,
          thenScreenId: to,
          conditions: r.conditions.map((c) => ({ ...c })),
        })),
        elseScreenId: ifThenDraft.elseScreenId ?? null,
      };
      return next;
    });

    setLogicConnections((prev) => {
      const next = prev.filter(
        (c) => !(c.from === from && (Number(c.to) === Number(to) || Number(c.to) === Number(prevTo)))
      );
      return upsertLogicConnection(next, from, to, LOGIC_EDGE_KIND.if);
    });

    closeIfThenLogicPanel();
  }, [ifThenLogicPanelEdge, ifThenDraft, closeIfThenLogicPanel]);

  const openLogicOptionsForEdge = useCallback(
    (connection, clientX, clientY) => {
      setLogicEdgeKindHoveredKey(null);
      setLogicDisconnectHoveredKey(null);
      const vr = logicViewportRef.current?.getBoundingClientRect();
      if (!vr) return;
      const pos = clampLogicMenuViewportPos(clientX - vr.left + 6, clientY - vr.top + 6, vr);
      if (connection.kind === LOGIC_EDGE_KIND.if) {
        const fromScreen = screens.find((s) => s.id === connection.from);
        if (screenSupportsIfThenLogic(fromScreen)) {
          openIfThenLogicPanel(connection.from, { to: connection.to });
        }
        return;
      }
      if (connection.kind == null) {
        setLogicConnectorMenu({
          mode: 'chooseEdgeKind',
          fromId: connection.from,
          toId: connection.to,
          ...pos,
        });
        return;
      }
      setLogicConnectorMenu({ mode: 'fromPort', fromId: connection.from, ...pos });
    },
    [openIfThenLogicPanel, screens]
  );

  /** After drawing a new wire (pending `kind`), user picks Next / If / Skip / End for that edge only. */
  const applyChosenEdgeKind = useCallback(
    (fromId, toId, edgeKind) => {
      setLogicConnectorMenu(null);
      const end = screens.find((s) => s.type === 'end');
      if (edgeKind === LOGIC_EDGE_KIND.if) {
        const fromScreen = screens.find((s) => s.id === fromId);
        if (!screenSupportsIfThenLogic(fromScreen)) return;
        openIfThenLogicPanel(fromId, { to: toId });
        return;
      }
      if (edgeKind === LOGIC_EDGE_KIND.end) {
        if (!end) return;
        const fromScreen = screens.find((s) => s.id === fromId);
        const kind =
          fromScreen?.type === 'intro' ? LOGIC_EDGE_KIND.next : LOGIC_EDGE_KIND.end;
        setLogicConnections((prev) => {
          const tail = prev.filter((c) => !(c.from === fromId && c.to === toId));
          return upsertLogicConnection(tail, fromId, end.id, kind);
        });
        return;
      }
      const fromScreen = screens.find((s) => s.id === fromId);
      const toScreen = screens.find((s) => s.id === toId);
      const kind =
        fromScreen?.type === 'intro' && toScreen?.type === 'end'
          ? LOGIC_EDGE_KIND.next
          : edgeKind;
      setLogicConnections((prev) => upsertLogicConnection(prev, fromId, toId, kind));
    },
    [screens, openIfThenLogicPanel]
  );

  const commitLogicConnection = useCallback(
    (g, clientX, clientY) => {
      const targetId = resolveLogicDropTarget(clientX, clientY, g.fromId, g.x1, g.y1);
      if (targetId == null) return false;
      const toMeta = logicPortPositionsRef.current.get(targetId);
      if (!toMeta || toMeta.inX == null || toMeta.kind === 'intro') return false;

      const fromScreen = screens.find((s) => s.id === g.fromId);
      const toScreen = screens.find((s) => s.id === targetId);
      let kind = g.kind != null ? g.kind : null;
      if (fromScreen?.type === 'intro' && toScreen?.type === 'end') {
        kind = LOGIC_EDGE_KIND.next;
      }

      setLogicConnections((prev) => upsertLogicConnection(prev, g.fromId, targetId, kind));

      if (kind == null) {
        requestAnimationFrame(() => {
          const vr = logicViewportRef.current?.getBoundingClientRect();
          if (!vr) return;
          const rawVx = clientX - vr.left + 6;
          const rawVy = clientY - vr.top + 6;
          const { vx, vy } = clampLogicMenuViewportPos(rawVx, rawVy, vr);
          setLogicConnectorMenu({
            mode: 'chooseEdgeKind',
            fromId: g.fromId,
            toId: targetId,
            vx,
            vy,
          });
        });
      } else {
        setLogicConnectorMenu(null);
      }
      return true;
    },
    [resolveLogicDropTarget, screens]
  );

  const endLogicConnectGesture = useCallback(() => {
    logicConnectGestureRef.current = null;
    setLogicConnectDrag(null);
  }, []);

  const applyLogicConnectionDrop = useCallback(
    (g, clientX, clientY) => {
      const fromMeta = logicPortPositionsRef.current.get(g.fromId);
      if (!fromMeta || fromMeta.outX == null) return;
      commitLogicConnection(g, clientX, clientY);
    },
    [commitLogicConnection]
  );

  const updateLogicConnectDrag = useCallback(
    (ev) => {
      if (!logicConnectGestureRef.current) return;
      const p = clientToLogicBoardLocal(ev.clientX, ev.clientY);
      const next = { ...logicConnectGestureRef.current, x1: p.x, y1: p.y };
      logicConnectGestureRef.current = next;
      setLogicConnectDrag({ ...next });
    },
    [clientToLogicBoardLocal]
  );

  const startLogicDocumentConnect = useCallback(
    (fromId, kind) => {
      setLogicConnectorMenu(null);
      if (kind === LOGIC_EDGE_KIND.if) {
        openIfThenLogicPanel(fromId);
        return;
      }
      requestAnimationFrame(() => {
        const meta = logicPortPositionsRef.current.get(fromId);
        if (!meta?.outX) return;
        const payload = { fromId, x1: meta.outX, y1: meta.outY ?? meta.portY, kind };
        logicConnectGestureRef.current = payload;
        setLogicConnectDrag(payload);

        const onMove = (ev) => updateLogicConnectDrag(ev);
        const onUp = (ev) => {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          const g = logicConnectGestureRef.current;
          endLogicConnectGesture();
          if (g) applyLogicConnectionDrop(g, ev.clientX, ev.clientY);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      });
    },
    [updateLogicConnectDrag, applyLogicConnectionDrop, endLogicConnectGesture, openIfThenLogicPanel, screens]
  );

  const onLogicOutputPortPointerDown = useCallback((e, fromId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    logicPortTapRef.current = { fromId, sx: e.clientX, sy: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onLogicOutputPortPointerMove = useCallback(
    (e) => {
      const tap = logicPortTapRef.current;
      if (tap && tap.pointerId === e.pointerId) {
        const moved = Math.abs(e.clientX - tap.sx) + Math.abs(e.clientY - tap.sy);
        if (moved > 8) {
          logicPortTapRef.current = null;
          const p = clientToLogicBoardLocal(e.clientX, e.clientY);
          const payload = { fromId: tap.fromId, x1: p.x, y1: p.y, kind: null };
          logicConnectGestureRef.current = payload;
          setLogicConnectDrag(payload);
        }
        return;
      }
      updateLogicConnectDrag(e);
    },
    [clientToLogicBoardLocal, updateLogicConnectDrag]
  );

  const onLogicOutputPortPointerUp = useCallback(
    (e) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      const tap = logicPortTapRef.current;
      logicPortTapRef.current = null;

      if (tap && tap.pointerId === e.pointerId) {
        const moved = Math.abs(e.clientX - tap.sx) + Math.abs(e.clientY - tap.sy);
        if (moved < 8) return;
      }

      const g = logicConnectGestureRef.current;
      endLogicConnectGesture();
      if (g) applyLogicConnectionDrop(g, e.clientX, e.clientY);
    },
    [applyLogicConnectionDrop, endLogicConnectGesture]
  );

  /* ── Intro essential variant (null = show default welcome card) ── */
  const [introEssential, setIntroEssential] = useState(null);

  /* ── End screen state ── */
  const [endScreenTitle, setEndScreenTitle] = useState('Thanks for your response!');
  const [endScreenDescription, setEndScreenDescription] = useState('Your submission has been recorded. We really appreciate you taking the time to share your feedback with us.');
  const [endScreenButtonText, setEndScreenButtonText] = useState('Done');
  const [isEditingEndScreen, setIsEditingEndScreen] = useState(false);
  const [draftEndTitle, setDraftEndTitle] = useState('Thanks for your response!');
  const [draftEndDescription, setDraftEndDescription] = useState('Your submission has been recorded. We really appreciate you taking the time to share your feedback with us.');
  const [draftEndButtonText, setDraftEndButtonText] = useState('Done');

  /* ── Default welcome card content state ── */
  const [introTitle, setIntroTitle] = useState('Title');
  introTitleRef.current = introTitle;
  const [introDescription, setIntroDescription] = useState('Add the purpose of form here');
  const [introButtonText, setIntroButtonText] = useState('Start \u2192');
  const [logoImage, setLogoImage] = useState(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [draftTitle, setDraftTitle] = useState('Title');
  const [draftDescription, setDraftDescription] = useState('Add the purpose of form here');
  const [draftButtonText, setDraftButtonText] = useState('Start \u2192');
  const [draftLogo, setDraftLogo] = useState(null);
  const logoInputRef = useRef(null);
  const introEditSnapshotRef = useRef(null);
  const endEditSnapshotRef = useRef(null);
  const [unsavedChangesPrompt, setUnsavedChangesPrompt] = useState(null);

  const handleEditContent = () => {
    introEditSnapshotRef.current = {
      title: introTitle,
      description: introDescription,
      buttonText: introButtonText,
      logo: logoImage,
    };
    setDraftTitle(introTitle);
    setDraftDescription(introDescription);
    setDraftButtonText(introButtonText);
    setDraftLogo(logoImage);
    setIsEditingContent(true);
    markFormTouched();
  };

  const commitIntroDraft = () => {
    setIntroTitle(draftTitle);
    setIntroDescription(draftDescription);
    setIntroButtonText(draftButtonText);
    setLogoImage(draftLogo);
  };

  const handleEditEndScreen = () => {
    endEditSnapshotRef.current = {
      title: endScreenTitle,
      description: endScreenDescription,
      buttonText: endScreenButtonText,
    };
    setDraftEndTitle(endScreenTitle);
    setDraftEndDescription(endScreenDescription);
    setDraftEndButtonText(endScreenButtonText);
    setIsEditingEndScreen(true);
    markFormTouched();
  };

  const commitEndDraft = () => {
    setEndScreenTitle(draftEndTitle);
    setEndScreenDescription(draftEndDescription);
    setEndScreenButtonText(draftEndButtonText);
  };

  const hasEndScreenChanges =
    isEditingEndScreen &&
    endEditSnapshotRef.current != null &&
    (draftEndTitle !== endEditSnapshotRef.current.title ||
      draftEndDescription !== endEditSnapshotRef.current.description ||
      draftEndButtonText !== endEditSnapshotRef.current.buttonText);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setDraftLogo(URL.createObjectURL(file));
    e.target.value = '';
  };

  const hasChanges =
    isEditingContent &&
    introEditSnapshotRef.current != null &&
    (draftTitle !== introEditSnapshotRef.current.title ||
      draftDescription !== introEditSnapshotRef.current.description ||
      draftButtonText !== introEditSnapshotRef.current.buttonText ||
      draftLogo !== introEditSnapshotRef.current.logo);

  const handleBackFromIntroEdit = () => {
    if (hasChanges) {
      setUnsavedChangesPrompt('intro');
      return;
    }
    commitIntroDraft();
    introEditSnapshotRef.current = null;
    setIsEditingContent(false);
  };

  const handleBackFromEndEdit = () => {
    if (hasEndScreenChanges) {
      setUnsavedChangesPrompt('end');
      return;
    }
    commitEndDraft();
    endEditSnapshotRef.current = null;
    setIsEditingEndScreen(false);
  };

  const handleSaveIntroEdit = () => {
    commitIntroDraft();
    introEditSnapshotRef.current = null;
    setIsEditingContent(false);
  };

  const handleSaveEndEdit = () => {
    commitEndDraft();
    endEditSnapshotRef.current = null;
    setIsEditingEndScreen(false);
  };

  const closeUnsavedChangesModal = () => setUnsavedChangesPrompt(null);

  const discardIntroEdits = () => {
    const snap = introEditSnapshotRef.current;
    if (snap) {
      setDraftTitle(snap.title);
      setDraftDescription(snap.description);
      setDraftButtonText(snap.buttonText);
      setDraftLogo(snap.logo);
      setIntroTitle(snap.title);
      setIntroDescription(snap.description);
      setIntroButtonText(snap.buttonText);
      setLogoImage(snap.logo);
    }
    introEditSnapshotRef.current = null;
    setIsEditingContent(false);
    setUnsavedChangesPrompt(null);
  };

  const discardEndEdits = () => {
    const snap = endEditSnapshotRef.current;
    if (snap) {
      setDraftEndTitle(snap.title);
      setDraftEndDescription(snap.description);
      setDraftEndButtonText(snap.buttonText);
      setEndScreenTitle(snap.title);
      setEndScreenDescription(snap.description);
      setEndScreenButtonText(snap.buttonText);
    }
    endEditSnapshotRef.current = null;
    setIsEditingEndScreen(false);
    setUnsavedChangesPrompt(null);
  };

  useEffect(() => {
    if (!isEditingContent) return;
    commitIntroDraft();
  }, [draftTitle, draftDescription, draftButtonText, draftLogo, isEditingContent]);

  useEffect(() => {
    if (!isEditingEndScreen) return;
    commitEndDraft();
  }, [draftEndTitle, draftEndDescription, draftEndButtonText, isEditingEndScreen]);

  const panelTimerRef = useRef(null);
  /** Skip width enter animation when creating the first screen so canvas scale measures correctly. */
  const skipPanelEnterRef = useRef(false);

  const closeRightConfigPanels = ({
    keepContentPanel = false,
    keepIfThenPanel = false,
  } = {}) => {
    setShowConfigPanel(false);
    if (!keepContentPanel) setShowContentPanel(false);
    setShowCtaConfigPanel(false);
    setShowHeadingConfigPanel(false);
    setShowDescriptionConfigPanel(false);
    setShowImageConfigPanel(false);
    setShowVideoConfigPanel(false);
    setShowContactConfigPanel(false);
    setShowAddressConfigPanel(false);
    setShowWorkConfigPanel(false);
    setShowShortTextConfigPanel(false);
    setShowLongTextConfigPanel(false);
    setShowSingleConfigPanel(false);
    setShowMultipleConfigPanel(false);
    setShowMediaConfigPanel(false);
    setShowCaptchaConfigPanel(false);
    setShowMultiImageConfigPanel(false);
    setShowRatingConfigPanel(false);
    setShowDateConfigPanel(false);
    setShowTimeConfigPanel(false);
    setShowDesignPanel(false);
    if (!keepIfThenPanel) {
      setIfThenLogicPanelEdge(null);
      setIfThenDraft(null);
      ifThenDraftSnapshotRef.current = null;
    }
  };

  const closeAllRightPanels = () => closeRightConfigPanels();
  closePanelsRef.current = closeAllRightPanels;

  const openPanelByName = (name) => {
    if (name === 'config') setShowConfigPanel(true);
    else if (name === 'content') setShowContentPanel(true);
    else if (name === 'ctaConfig') setShowCtaConfigPanel(true);
    else if (name === 'headingConfig') setShowHeadingConfigPanel(true);
    else if (name === 'descriptionConfig') setShowDescriptionConfigPanel(true);
    else if (name === 'imageConfig') setShowImageConfigPanel(true);
    else if (name === 'videoConfig') setShowVideoConfigPanel(true);
    else if (name === 'contactConfig') setShowContactConfigPanel(true);
    else if (name === 'addressConfig') setShowAddressConfigPanel(true);
    else if (name === 'workConfig') setShowWorkConfigPanel(true);
    else if (name === 'shortTextConfig') setShowShortTextConfigPanel(true);
    else if (name === 'longTextConfig') setShowLongTextConfigPanel(true);
    else if (name === 'singleConfig') setShowSingleConfigPanel(true);
    else if (name === 'multipleConfig') setShowMultipleConfigPanel(true);
    else if (name === 'mediaConfig') setShowMediaConfigPanel(true);
    else if (name === 'captchaConfig') setShowCaptchaConfigPanel(true);
    else if (name === 'multiImageConfig') setShowMultiImageConfigPanel(true);
    else if (name === 'ratingConfig') setShowRatingConfigPanel(true);
    else if (name === 'dateConfig') setShowDateConfigPanel(true);
    else if (name === 'timeConfig') setShowTimeConfigPanel(true);
    else if (name === 'designPanel') setShowDesignPanel(true);
  };

  const openConfigurePanelForLabel = (itemLabel) => {
    const LABEL_TO_PANEL = {
      CTA: 'ctaConfig',
      Heading: 'headingConfig',
      Description: 'descriptionConfig',
      Images: 'imageConfig',
      Video: 'videoConfig',
      Contact: 'contactConfig',
      Address: 'addressConfig',
      'Work Info': 'workConfig',
      'Short text': 'shortTextConfig',
      'Long text': 'longTextConfig',
      Single: 'singleConfig',
      Multiple: 'multipleConfig',
      Media: 'mediaConfig',
      Captcha: 'captchaConfig',
      'Multi-image upload': 'multiImageConfig',
      Upload: 'multiImageConfig',
      Rating: 'ratingConfig',
      Date: 'dateConfig',
      Time: 'timeConfig',
    };
    const panel = LABEL_TO_PANEL[itemLabel];
    if (panel) openPanelByName(panel);
  };

  /* Close one panel, then open another after the exit animation finishes */
  const switchPanel = (open) => {
    if (panelTimerRef.current) clearTimeout(panelTimerRef.current);
    closeAllRightPanels();
    panelTimerRef.current = setTimeout(() => {
      openPanelByName(open);
    }, 300);
  };

  const handleAddScreen = () => {
    if (screens.length === 0) {
      const welcomeScreen = { id: 1, name: 'Start Screen', type: 'intro' };
      const endScreen = { id: 2, name: 'End Screen', type: 'end' };
      setScreens([welcomeScreen, endScreen]);
      setActiveScreenId(1);
      markFormTouched();
      closeAllRightPanels();
      skipPanelEnterRef.current = true;
      setShowConfigPanel(true);
    } else {
      if (showContentPanel) {
        setShowContentPanel(false);
      } else {
        switchPanel('content', null);
      }
    }
  };

  const handleSelectTheme = useCallback((theme) => {
    setDesignCardColor(theme.cardBg);
    setDesignCardImage(theme.previewImg);
    setActiveThemeId(theme.id);
    setShowThemeOverlay(false);
  }, []);

  const performDeleteIntroScreen = () => {
    setScreens([]);
    setActiveScreenId(null);
    setLogicConnections([]);
    setLogicIfRulesByEdge({});
    setLogicElseByScreen({});
    setLogicCardOffsets({});
    setLogicConnectDrag(null);
    setLogicConnectorMenu(null);
    setLogicCardHeights({});
    closeAllRightPanels();
    setIntroEssential(null);
    setIsEditingContent(false);
    setLogoImage(null);
    setIntroTitle('Title');
    setIntroDescription('Add the purpose of form here');
    setIntroButtonText('Start \u2192');
    setIsEditingEndScreen(false);
    setEndScreenTitle('Thanks for your response!');
    setEndScreenDescription('Your submission has been recorded. We really appreciate you taking the time to share your feedback with us.');
    setEndScreenButtonText('Done');
  };

  const performDeleteEndScreen = () => {
    setScreens((prev) => {
      const remaining = prev.filter((s) => s.type !== 'end');
      const fallback = remaining[remaining.length - 1];
      setActiveScreenId(fallback ? fallback.id : null);
      return remaining;
    });
    setIsEditingEndScreen(false);
  };

  const toggleSection = (key) => {
    setSections((prev) => {
      const isAlreadyOpen = prev[key];
      const allClosed = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      return { ...allClosed, [key]: !isAlreadyOpen };
    });
  };

  const hasScreens = screens.length > 0;
  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? null;

  const handleIntroEssentialSelect = useCallback(
    (label) => {
      const currentScreen = screens.find((s) => s.id === activeScreenId);
      if (currentScreen?.type !== 'intro') {
        showToast({ type: 'info', message: 'Switch to the Start screen to edit essentials.' });
        return;
      }
      setIntroEssential((prev) => {
        const next = prev === label ? null : label;
        if (next != null) {
          closeAllRightPanels();
          setTimeout(() => {
            const panel = builderScreenMaps.ESSENTIAL_LABEL_TO_CONFIG_PANEL[label];
            if (panel) openPanelByName(panel);
          }, 300);
        }
        return next;
      });
    },
    [screens, activeScreenId, showToast],
  );

  const configureIsUpload = activeScreen?.label === 'Upload';
  const configureMaxFileSize = configureIsUpload ? uploadMaxFileSize : multiImageMaxFileSize;
  const setConfigureMaxFileSize = configureIsUpload ? setUploadMaxFileSize : setMultiImageMaxFileSize;
  const contentScreens = screens.filter((s) => s.type === 'content');
  const selectManualLogicMode = useCallback(() => {
    setLogicModeManual(true);
    resetAiLogicGeneration(patchAiLogicGen);
  }, [patchAiLogicGen]);
  const selectAiDrivenLogicMode = useCallback(() => {
    setLogicModeManual(false);
    resetAiLogicGeneration(patchAiLogicGen);
  }, [patchAiLogicGen]);
  const aiLogicGenerationContext = useMemo(
    () => ({
      screens,
      contentScreens,
      welcomeInputType,
      welcomeHidden,
      introTitle: introTitleRef.current,
      getQuestionText: (screen) =>
        getBuilderScreenPreviewText(screen, fieldPreviewFallbackRef.current, activeScreenId),
    }),
    [screens, contentScreens, welcomeInputType, welcomeHidden, logicQuestionOptionsTick, activeScreenId]
  );

  const applyAiLogicToBuilder = useCallback(
    (applied) => {
      if (Array.isArray(applied.logicConnections)) {
        setLogicConnections(applied.logicConnections);
      }
      if (applied.logicIfRulesByEdge && typeof applied.logicIfRulesByEdge === 'object') {
        setLogicIfRulesByEdge(applied.logicIfRulesByEdge);
      }
      if (Array.isArray(applied.screens)) {
        setScreens(applied.screens);
      }
      showToast({ type: 'success', message: 'AI logic applied to your form.' });
    },
    [showToast]
  );

  const handleAiLogicRetry = useCallback(async () => {
    patchAiLogicGen({ status: AI_LOGIC_GEN_STATUS.generating, errorMessage: '' });
    showToast({ type: 'info', message: 'Retrying AI logic generation…' });
    let formId = activeFormId;
    if (isApiConfigured() && !formId) {
      formId = await ensureFormPersistedRef.current();
    }
    const fetchAiLogic =
      isApiConfigured() && formId
        ? () => logicService.generateFormLogic(formId, aiLogicGenerationContext)
        : undefined;
    runAiLogicGeneration(aiLogicGenerationContext, patchAiLogicGen, applyAiLogicToBuilder, {
      fetchAiLogic,
    });
  }, [patchAiLogicGen, aiLogicGenerationContext, applyAiLogicToBuilder, showToast, activeFormId]);
  const handleGenerateAiLogic = useCallback(async () => {
    patchAiLogicGen({ status: AI_LOGIC_GEN_STATUS.generating, errorMessage: '' });
    showToast({ type: 'info', message: 'Generating AI logic from your form…' });
    let formId = activeFormId;
    if (isApiConfigured() && !formId) {
      formId = await ensureFormPersistedRef.current();
    }
    const fetchAiLogic =
      isApiConfigured() && formId
        ? () => logicService.generateFormLogic(formId, aiLogicGenerationContext)
        : undefined;
    runAiLogicGeneration(aiLogicGenerationContext, patchAiLogicGen, applyAiLogicToBuilder, {
      fetchAiLogic,
    });
  }, [patchAiLogicGen, aiLogicGenerationContext, applyAiLogicToBuilder, showToast, activeFormId]);
  const aiLogicGenerationFailed = aiLogicGen.status === AI_LOGIC_GEN_STATUS.failed;
  const aiLogicGenerating = aiLogicGen.status === AI_LOGIC_GEN_STATUS.generating;
  const aiLogicReady = aiLogicGen.status === AI_LOGIC_GEN_STATUS.success;
  const hasLogicOnCanvas =
    logicConnections.length > 0 || Object.keys(logicIfRulesByEdge).length > 0;
  const showLogicCanvas = logicModeManual || aiLogicReady || hasLogicOnCanvas;
  const openLogicCanvasIntegrations = useCallback(() => setActiveTab('settings'), []);
  const openLogicCanvasWebhook = useCallback(() => setActiveTab('settings'), []);
  /** Design: only after Add screen creates the form shell */
  const designTabDisabled = !hasScreens;
  /** Logic: needs at least one question screen (also implies hasScreens) */
  const logicTabDisabled = contentScreens.length === 0;
  const contentBlockNum = contentScreens.findIndex((s) => s.id === activeScreenId) + 1;
  const activeScreenIdx = screens.findIndex((s) => s.id === activeScreenId);

  useEffect(() => {
    const prev = prevContentScreensCountRef.current;
    if (contentScreens.length > prev && contentScreens.length > 0) {
      const last = contentScreens[contentScreens.length - 1];
      requestAnimationFrame(() => {
        const row = contentScreensScrollRef.current?.querySelector(
          `[data-content-screen-row][data-screen-id="${last.id}"]`
        );
        row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
    prevContentScreensCountRef.current = contentScreens.length;
  }, [contentScreens]);

  configGlobalsRef.current = {
    contactQuestion,
    contactHelperText,
    contactFields,
    contactRequired,
    addressQuestion,
    addressHelperText,
    addressFields,
    addressRequired,
    workQuestion,
    workHelperText,
    workFields,
    workRequired,
    shortTextQuestion,
    shortTextHelperText,
    shortTextPlaceholder,
    shortTextMaxChars,
    shortTextMinChars,
    shortTextValidation,
    shortTextAlign,
    shortTextSize,
    shortTextRequired,
    shortTextHidden,
    shortTextResponseQualityEnabled,
    shortTextResponseQualityOptions,
    longTextQuestion,
    longTextHelperText,
    longTextPlaceholder,
    longTextMaxChars,
    longTextMinChars,
    longTextValidation,
    longTextAlign,
    longTextSize,
    longTextRequired,
    longTextHidden,
    longTextResponseQualityEnabled: responseQualityEnabled,
    longTextResponseQualityOptions: responseQualityOptions,
    singleQuestion,
    singleHelperText,
    singleOptions,
    singleLayout,
    singleOptionHeight,
    singleRequired,
    singleAllowOther,
    singleRandomize,
    singleMultipleSelect,
    singleMinChoices,
    singleMaxChoices,
    singleShowKeyboardHints,
    multipleQuestion,
    multipleHelperText,
    multipleOptions,
    multipleLayout,
    multipleRequired,
    multipleAllowOther,
    multipleRandomize,
    multipleMultipleSelect,
    multipleMinChoices,
    multipleMaxChoices,
    multipleShowKeyboardHints,
    multipleOptionHeight,
    headingText,
    subHeading,
    headingRequired,
    headingHidden,
    headingLevel,
    headingTextSize,
    headingAlignment,
    headingFontWeight,
    headingAnswerText,
    ctaButtonLabel,
    ctaHeadingText,
    ctaHelperText,
    ctaDurationText,
    ctaButtonSize,
    ctaButtonStyle,
    ctaCornerRadius,
    ctaShowIcon,
    ctaHeadingSize,
    ctaBodySize,
    ctaFontWeight,
    ctaTextAlign,
    ctaPadding,
    ctaTextColor,
    ctaBtnColor,
    ctaLabelColor,
    ctaContentWidth,
    descriptionContent,
    descriptionHidden,
    descriptionShowCharCount,
    descriptionCharLimit,
    descriptionFormatting,
    descriptionTextSize,
    descriptionAlignment,
    dateQuestion,
    dateHelperText,
    dateRequired,
    timeQuestion,
    timeHelperText,
    timeRequired,
    timeUse12h,
    timeShowSeconds,
    timeMinTime,
    timeMaxTime,
    ratingQuestion,
    ratingRequired,
    ratingUseScale,
    ratingUseSlider,
    ratingMaxRating,
    ratingStyle,
    ratingLowLabel,
    ratingHighLabel,
    ratingShowLabels,
    ratingIconSize,
    imageQuestion,
    imageDescription,
    imageHidden,
    imageAltText,
    imageCaption,
    imageLinkOnClick,
    imageLinkUrl,
    imageOpenInNewTab,
    imageAlignment,
    imageWidth,
    imageCornerRadius,
    imagePreview,
    imageFileName,
    videoQuestion,
    videoDescription,
    videoRequired,
    videoHidden,
    videoLoop,
    videoAutoplay,
    videoShowControls,
    videoSource,
    videoUrl,
    videoCaption,
    videoWidth,
    videoAspectRatio,
    videoCornerRadius,
    mediaQuestion,
    mediaHelperText,
    mediaOptions,
    mediaAllowMultiple,
    mediaRequired,
    mediaRandomiseOrder,
    mediaMinChoices,
    mediaMaxChoices,
    mediaLayout,
    mediaOptionHeight,
    captchaProvider,
    captchaSiteKey,
    captchaEnabled,
    captchaVisibility,
    multiImageQuestion,
    multiImageHelperText,
    multiImageMaxFiles,
    multiImageRequired,
    multiImageMultipleFiles,
    multiImageMaxFileSize,
    uploadQuestion,
    uploadHelperText,
    uploadMaxFileSize,
    showIfConditions,
  };

  const getScreensSnapshot = useCallback(() => {
    const globals = configGlobalsRef.current;
    return screens.map((s) => {
      if (s.type !== 'content') {
        return {
          id: s.id,
          type: s.type,
          name: s.name,
          label: s.label,
          section: s.section,
        };
      }
      const config =
        s.id === activeScreenId
          ? extractScreenConfig(s, globals)
          : s.config ?? null;
      return {
        id: s.id,
        type: s.type,
        name: s.name,
        label: s.label,
        section: s.section,
        config: s.id === activeScreenId && config ? { ...config, showIfConditions } : config,
      };
    });
  }, [activeScreenId, screens, showIfConditions]);

  const buildBuilderThemeSnapshot = useCallback(
    () => ({
      activeThemeId,
      layoutStyle: designLayoutStyle,
      fullCanvas: designLayoutStyle === 'fullCanvas',
      background: designBackground,
      cardColor: designCardColor,
      cardImage: designCardImage,
      cardOpacity: designCardOpacity,
      textColor: designTextColor,
      accentColor: designTextColor || formAccentColor,
      typography: designTypography,
    }),
    [
      activeThemeId,
      designLayoutStyle,
      designBackground,
      designCardColor,
      designCardImage,
      designCardOpacity,
      designTextColor,
      formAccentColor,
      designTypography,
    ]
  );

  const buildBuilderSettingsSnapshot = useCallback(
    () => ({
      oneAtATime: settingsOneAtATime,
      autoAdvance: settingsAutoAdvance,
      backButton: settingsBackButton,
      completionAction: settingsCompletionAction,
      resubmission: settingsResubmission,
      confirmationEmail: settingsConfirmationEmail,
      submissionNotifications: settingsSubmissionNotifications,
      emailCollection: settingsEmailCollection,
      language: settingsLanguage,
      passwordProtection: settingsPasswordProtection,
      responseLimit: settingsResponseLimit,
      responseLimitCount: settingsResponseLimitCount,
      webhook: settingsWebhook,
    }),
    [
      settingsOneAtATime,
      settingsAutoAdvance,
      settingsBackButton,
      settingsCompletionAction,
      settingsResubmission,
      settingsConfirmationEmail,
      settingsSubmissionNotifications,
      settingsEmailCollection,
      settingsLanguage,
      settingsPasswordProtection,
      settingsResponseLimit,
      settingsResponseLimitCount,
      settingsWebhook,
    ]
  );

  const serializeBuilderState = () => {
    const screensSnapshot = getScreensSnapshot();
    return JSON.stringify({
      screens: screensSnapshot,
      intro: {
        title: introTitle,
        description: introDescription,
        buttonText: introButtonText,
        textSize: welcomeTextSize,
        alignment: welcomeAlignment,
      },
      end: {
        title: endScreenTitle,
        description: endScreenDescription,
        buttonText: endScreenButtonText,
      },
      logicConnections,
      logicIfRulesByEdge,
      theme: buildBuilderThemeSnapshot(),
      settings: buildBuilderSettingsSnapshot(),
    });
  };

  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    if (screens.length === 0) {
      builderBaselineRef.current = null;
      builderBaselineSessionRef.current = null;
      setIsFormDirty(false);
      return;
    }
    const sessionKey = `${location.key}|${activeFormId ?? 'new'}|${location.state?.templateId ?? ''}`;
    if (builderBaselineSessionRef.current === sessionKey) return;

    builderBaselineSessionRef.current = sessionKey;
    let cancelled = false;
    const captureBaseline = () => {
      if (cancelled) return;
      builderBaselineRef.current = serializeBuilderState();
      formTouchedRef.current = false;
      setIsFormDirty(false);
    };
    const outerFrame = requestAnimationFrame(() => {
      requestAnimationFrame(captureBaseline);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outerFrame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture once per session after paint settles
  }, [screens.length, location.key, activeFormId, location.state?.templateId]);

  useLayoutEffect(() => {
    if (!builderBaselineRef.current || screens.length === 0) {
      setIsFormDirty(false);
      return;
    }
    const dirty = serializeBuilderState() !== builderBaselineRef.current;
    setIsFormDirty(dirty);
    if (dirty) {
      formTouchedRef.current = true;
      setBuilderSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
    }
  });

  const hasPendingBuilderEdits =
    isFormDirty ||
    hasChanges ||
    hasEndScreenChanges ||
    isEditingContent ||
    isEditingEndScreen ||
    isEditingCtaCard ||
    isEditingHeadingCard;

  const screenConfigSetters = useMemo(
    () => ({
      setContactQuestion,
      setContactHelperText,
      setContactFields,
      setContactRequired,
      setAddressQuestion,
      setAddressHelperText,
      setAddressFields,
      setAddressRequired,
      setWorkQuestion,
      setWorkHelperText,
      setWorkFields,
      setWorkRequired,
      setShortTextQuestion,
      setShortTextHelperText,
      setShortTextPlaceholder,
      setShortTextMaxChars,
      setShortTextMinChars,
      setShortTextValidation,
      setShortTextAlign,
      setShortTextSize,
      setShortTextRequired,
      setShortTextHidden,
      setShortTextResponseQualityEnabled,
      setShortTextResponseQualityOptions,
      setLongTextQuestion,
      setLongTextHelperText,
      setLongTextPlaceholder,
      setLongTextMaxChars,
      setLongTextMinChars,
      setLongTextValidation,
      setLongTextAlign,
      setLongTextSize,
      setLongTextRequired,
      setLongTextHidden,
      setLongTextResponseQualityEnabled: setResponseQualityEnabled,
      setLongTextResponseQualityOptions: setResponseQualityOptions,
      setSingleQuestion,
      setSingleHelperText,
      setSingleOptions,
      setSingleLayout,
      setSingleOptionHeight,
      setSingleRequired,
      setSingleAllowOther,
      setSingleRandomize,
      setSingleMultipleSelect,
      setSingleMinChoices,
      setSingleMaxChoices,
      setSingleShowKeyboardHints,
      setMultipleQuestion,
      setMultipleHelperText,
      setMultipleOptions,
      setMultipleLayout,
      setMultipleRequired,
      setMultipleAllowOther,
      setMultipleRandomize,
      setMultipleMultipleSelect,
      setMultipleMinChoices,
      setMultipleMaxChoices,
      setMultipleShowKeyboardHints,
      setMultipleOptionHeight,
      setHeadingText,
      setSubHeading,
      setHeadingRequired,
      setHeadingHidden,
      setHeadingLevel,
      setHeadingTextSize,
      setHeadingAlignment,
      setHeadingFontWeight,
      setHeadingAnswerText,
      setCtaButtonLabel,
      setCtaHeadingText,
      setCtaHelperText,
      setCtaDurationText,
      setCtaButtonSize,
      setCtaButtonStyle,
      setCtaCornerRadius,
      setCtaShowIcon,
      setCtaHeadingSize,
      setCtaBodySize,
      setCtaFontWeight,
      setCtaTextAlign,
      setCtaPadding,
      setCtaTextColor,
      setCtaBtnColor,
      setCtaLabelColor,
      setCtaContentWidth,
      setDescriptionContent,
      setDescriptionHidden,
      setDescriptionShowCharCount,
      setDescriptionCharLimit,
      setDescriptionFormatting,
      setDescriptionTextSize,
      setDescriptionAlignment,
      setDateQuestion,
      setDateHelperText,
      setDateRequired,
      setTimeQuestion,
      setTimeHelperText,
      setTimeRequired,
      setTimeUse12h,
      setTimeShowSeconds,
      setTimeMinTime,
      setTimeMaxTime,
      setRatingQuestion,
      setRatingRequired,
      setRatingUseScale,
      setRatingUseSlider,
      setRatingMaxRating,
      setRatingStyle,
      setRatingLowLabel,
      setRatingHighLabel,
      setRatingShowLabels,
      setRatingIconSize,
      setImageQuestion,
      setImageDescription,
      setImageHidden,
      setImageAltText,
      setImageCaption,
      setImageLinkOnClick,
      setImageLinkUrl,
      setImageOpenInNewTab,
      setImageAlignment,
      setImageWidth,
      setImageCornerRadius,
      setImagePreview,
      setImageFileName,
      setVideoQuestion,
      setVideoDescription,
      setVideoRequired,
      setVideoHidden,
      setVideoLoop,
      setVideoAutoplay,
      setVideoShowControls,
      setVideoSource,
      setVideoUrl,
      setVideoCaption,
      setVideoWidth,
      setVideoAspectRatio,
      setVideoCornerRadius,
      setMediaQuestion,
      setMediaHelperText,
      setMediaOptions,
      setMediaAllowMultiple,
      setMediaRequired,
      setMediaRandomiseOrder,
      setMediaMinChoices,
      setMediaMaxChoices,
      setMediaLayout,
      setMediaOptionHeight,
      setCaptchaProvider,
      setCaptchaSiteKey,
      setCaptchaEnabled,
      setCaptchaVisibility,
      setMultiImageQuestion,
      setMultiImageHelperText,
      setMultiImageMaxFiles,
      setMultiImageRequired,
      setMultiImageMultipleFiles,
      setMultiImageMaxFileSize,
      setUploadQuestion,
      setUploadHelperText,
      setUploadMaxFileSize,
      setShowIfConditions,
    }),
    []
  );

  const persistScreenConfigById = useCallback((screenId) => {
    if (screenId == null) return;
    setScreens((prev) => {
      const screen = prev.find((s) => s.id === screenId);
      if (!screen || screen.type !== 'content') return prev;
      const config = extractScreenConfig(screen, configGlobalsRef.current);
      if (!config) return prev;
      return prev.map((s) =>
        s.id === screenId ? { ...s, config: { ...config, showIfConditions } } : s
      );
    });
  }, [showIfConditions]);

  const handleSaveShortTextResponseQuality = useCallback(() => {
    if (activeScreenId == null) return;
    persistScreenConfigById(activeScreenId);
    markFormTouched();
    showToast({ type: 'success', message: 'Response quality settings saved.' });
  }, [activeScreenId, persistScreenConfigById, showToast]);

  const handleSaveLongTextResponseQuality = useCallback(() => {
    if (activeScreenId == null) return;
    persistScreenConfigById(activeScreenId);
    markFormTouched();
    showToast({ type: 'success', message: 'Response quality settings saved.' });
  }, [activeScreenId, persistScreenConfigById, showToast]);

  useEffect(() => {
    const formTitle = location.state?.formTitle;
    if (formTitle && !newFormHydratedRef.current && !location.state?.templateId) {
      newFormHydratedRef.current = true;
      setLoadedFormTitle(formTitle);
    }
  }, [location.state?.formTitle, location.state?.templateId]);

  const applyBuiltFormState = useCallback((built, templateIdForRef) => {
    lastHydratedTemplateIdRef.current = templateIdForRef ?? null;
    newFormHydratedRef.current = true;
    nextIdRef.current = built.nextId;

    setScreens(built.screens);
    setLoadedFormTitle(built.formTitle);
    setIntroTitle(built.intro.title);
    setIntroDescription(built.intro.description);
    setIntroButtonText(built.intro.buttonText);
    setWelcomeTextSize(built.intro.textSize ?? 'M');
    setWelcomeAlignment(built.intro.alignment ?? 'left');
    if (built.intro?.logo) {
      setLogoImage(built.intro.logo);
      setDraftLogo(built.intro.logo);
    } else {
      setLogoImage(null);
      setDraftLogo(null);
    }
    setIntroEssential(built.intro?.essential ?? null);
    setDraftTitle(built.intro.title);
    setDraftDescription(built.intro.description);
    setDraftButtonText(built.intro.buttonText);
    setEndScreenTitle(built.end.title);
    setEndScreenDescription(built.end.description);
    setEndScreenButtonText(built.end.buttonText);
    setDraftEndTitle(built.end.title);
    setDraftEndDescription(built.end.description);
    setDraftEndButtonText(built.end.buttonText);
    if (built.theme && typeof built.theme === 'object') {
      if (built.theme.activeThemeId) setActiveThemeId(built.theme.activeThemeId);
      if (built.theme.layoutStyle) setDesignLayoutStyle(built.theme.layoutStyle);
      if (built.theme.background) setDesignBackground(built.theme.background);
      if (built.theme.cardColor) setDesignCardColor(built.theme.cardColor);
      if (Object.prototype.hasOwnProperty.call(built.theme, 'cardImage')) {
        setDesignCardImage(built.theme.cardImage);
      }
      if (typeof built.theme.cardOpacity === 'number') setDesignCardOpacity(built.theme.cardOpacity);
      if (built.theme.textColor) setDesignTextColor(built.theme.textColor);
      if (built.theme.typography) setDesignTypography(built.theme.typography);
    }
    if (built.settings && typeof built.settings === 'object') {
      if (Object.prototype.hasOwnProperty.call(built.settings, 'oneAtATime')) setSettingsOneAtATime(Boolean(built.settings.oneAtATime));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'autoAdvance')) setSettingsAutoAdvance(Boolean(built.settings.autoAdvance));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'backButton')) setSettingsBackButton(Boolean(built.settings.backButton));
      if (built.settings.completionAction) setSettingsCompletionAction(built.settings.completionAction);
      if (Object.prototype.hasOwnProperty.call(built.settings, 'resubmission')) setSettingsResubmission(Boolean(built.settings.resubmission));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'confirmationEmail')) setSettingsConfirmationEmail(Boolean(built.settings.confirmationEmail));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'submissionNotifications')) setSettingsSubmissionNotifications(Boolean(built.settings.submissionNotifications));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'emailCollection')) setSettingsEmailCollection(Boolean(built.settings.emailCollection));
      if (built.settings.language) setSettingsLanguage(built.settings.language);
      if (Object.prototype.hasOwnProperty.call(built.settings, 'passwordProtection')) setSettingsPasswordProtection(Boolean(built.settings.passwordProtection));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'responseLimit')) setSettingsResponseLimit(Boolean(built.settings.responseLimit));
      if (built.settings.responseLimitCount != null) setSettingsResponseLimitCount(String(built.settings.responseLimitCount));
      if (Object.prototype.hasOwnProperty.call(built.settings, 'webhook')) setSettingsWebhook(Boolean(built.settings.webhook));
    }
    setActiveScreenId(built.screens[0]?.id ?? null);
    closeAllRightPanels();
    setShowConfigPanel(true);
    setActiveTab('content');
  }, []);

  useEffect(() => {
    builderDraftHydratedRef.current = false;
    builderHydrationSessionRef.current = null;
    lastHydratedTemplateIdRef.current = null;
    newFormHydratedRef.current = false;
    autoPreviewAppliedRef.current = false;
    builderBaselineRef.current = null;
    builderBaselineSessionRef.current = null;
    formTouchedRef.current = false;
    setBuilderHydrated(false);
    setIsPublishView(location.state?.startInPublishView === true);
  }, [activeFormId, location.key, location.state?.startInPublishView]);

  useEffect(() => {
    if (!location.state?.startInPublishView || !isPublishView) return;
    if (screens.length === 0) return;
    if (!canPublishForm(screens)) {
      setIsPublishView(false);
      showToast({ type: 'info', message: getPublishBlockers(screens)[0] });
    }
  }, [location.state?.startInPublishView, isPublishView, screens, showToast]);

  useEffect(() => {
    if (!location.state?.startInPreview || autoPreviewAppliedRef.current) return;
    if (screens.length === 0) return;
    autoPreviewAppliedRef.current = true;
    setIsPreview(true);
  }, [location.state?.startInPreview, screens.length, location.key]);

  useEffect(() => {
    if (!activeFormId || !isApiConfigured()) return undefined;
    if (isUsableBuilderSnapshot(persistedForm?.builderSnapshot)) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const res = await getBuilderSnapshot(activeFormId);
        const apiSnap = res?.snapshot ?? res;
        if (cancelled || !isUsableBuilderSnapshot(apiSnap)) return;
        dispatch(updateForm({ id: activeFormId, changes: { builderSnapshot: apiSnap } }));
      } catch {
        /* keep local fallbacks */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFormId, persistedForm?.builderSnapshot, dispatch]);

  useEffect(() => {
    const formId = activeFormId;
    const savedSnapshot =
      isUsableBuilderSnapshot(persistedForm?.builderSnapshot)
        ? persistedForm.builderSnapshot
        : null;
    const draftSnapshot = !isApiConfigured() && formId ? readBuilderDraft(formId) : null;
    const publishedSnapshot = !isApiConfigured() && formId ? readPublishedForm(formId) : null;
    const fallbackSnapshot = savedSnapshot ? null : newestBuilderSnapshot(draftSnapshot, publishedSnapshot);
    const templateId =
      savedSnapshot?.templateId ??
      fallbackSnapshot?.templateId ??
      location.state?.templateId ??
      persistedForm?.templateId;
    const hydrationSource = savedSnapshot
      ? 'snapshot'
      : fallbackSnapshot
        ? 'fallback-snapshot'
        : persistedForm
          ? 'form'
          : 'pending';
    const hydrationSessionKey = `${location.key}|${formId ?? 'new'}|${templateId ?? ''}|${hydrationSource}`;

    if (builderHydrationSessionRef.current === hydrationSessionKey) return;
    builderHydrationSessionRef.current = hydrationSessionKey;

    if (formId && savedSnapshot) {
      builderDraftHydratedRef.current = true;
      applyBuiltFormState(
        {
          screens: savedSnapshot.screens,
          formTitle: savedSnapshot.formTitle ?? persistedForm?.title ?? location.state?.formTitle ?? 'Untitled Form',
          intro: savedSnapshot.intro ?? {
            title: 'Title',
            description: '',
            buttonText: 'Start',
          },
          end: savedSnapshot.end ?? {
            title: 'Thanks for your response!',
            description: '',
            buttonText: 'Done',
          },
          nextId: savedSnapshot.nextId ?? 100,
          theme: savedSnapshot.theme,
          settings: savedSnapshot.settings,
        },
        templateId
      );
      setLogicConnections(Array.isArray(savedSnapshot.logicConnections) ? savedSnapshot.logicConnections : []);
      setLogicIfRulesByEdge(
        savedSnapshot.logicIfRulesByEdge && typeof savedSnapshot.logicIfRulesByEdge === 'object'
          ? savedSnapshot.logicIfRulesByEdge
          : {}
      );
      if (savedSnapshot.logicMeta && typeof savedSnapshot.logicMeta === 'object') {
        if (typeof savedSnapshot.logicMeta.logicModeManual === 'boolean') {
          setLogicModeManual(savedSnapshot.logicMeta.logicModeManual);
        }
        if (savedSnapshot.logicMeta.logicCardOffsets && typeof savedSnapshot.logicMeta.logicCardOffsets === 'object') {
          setLogicCardOffsets(savedSnapshot.logicMeta.logicCardOffsets);
        }
        if (savedSnapshot.logicMeta.aiLogicGenStatus === AI_LOGIC_GEN_STATUS.success) {
          setAiLogicGen({ status: AI_LOGIC_GEN_STATUS.success, errorMessage: '' });
        }
      }
      setLogicElseByScreen({});
      if (!savedSnapshot.logicMeta?.logicCardOffsets) setLogicCardOffsets({});
      setBuilderHydrated(true);
      return;
    }

    if (formId && fallbackSnapshot) {
      builderDraftHydratedRef.current = true;
      applyBuiltFormState(
        {
          screens: fallbackSnapshot.screens,
          formTitle: fallbackSnapshot.formTitle ?? persistedForm?.title ?? location.state?.formTitle ?? 'Untitled Form',
          intro: fallbackSnapshot.intro ?? {
            title: 'Title',
            description: '',
            buttonText: 'Start',
          },
          end: fallbackSnapshot.end ?? {
            title: 'Thanks for your response!',
            description: '',
            buttonText: 'Done',
          },
          nextId: fallbackSnapshot.nextId ?? 100,
          theme: fallbackSnapshot.theme,
          settings: fallbackSnapshot.settings,
        },
        fallbackSnapshot.templateId ?? templateId
      );
      if (Array.isArray(fallbackSnapshot.logicConnections)) {
        setLogicConnections(fallbackSnapshot.logicConnections);
      }
      if (fallbackSnapshot.logicIfRulesByEdge && typeof fallbackSnapshot.logicIfRulesByEdge === 'object') {
        setLogicIfRulesByEdge(fallbackSnapshot.logicIfRulesByEdge);
      }
      if (fallbackSnapshot.logicMeta && typeof fallbackSnapshot.logicMeta === 'object') {
        if (typeof fallbackSnapshot.logicMeta.logicModeManual === 'boolean') {
          setLogicModeManual(fallbackSnapshot.logicMeta.logicModeManual);
        }
        if (fallbackSnapshot.logicMeta.logicCardOffsets && typeof fallbackSnapshot.logicMeta.logicCardOffsets === 'object') {
          setLogicCardOffsets(fallbackSnapshot.logicMeta.logicCardOffsets);
        }
        if (fallbackSnapshot.logicMeta.aiLogicGenStatus === AI_LOGIC_GEN_STATUS.success) {
          setAiLogicGen({ status: AI_LOGIC_GEN_STATUS.success, errorMessage: '' });
        }
      }
      setLogicElseByScreen({});
      if (!fallbackSnapshot.logicMeta?.logicCardOffsets) setLogicCardOffsets({});
      dispatch(updateForm({ id: formId, changes: { builderSnapshot: fallbackSnapshot } }));
      setBuilderHydrated(true);
      return;
    }

    if (templateId) {
      const built = buildFormFromTemplate(templateId);
      if (!built) {
        setBuilderHydrated(true);
        return;
      }

      setLogicConnections([]);
      setLogicIfRulesByEdge({});
      setLogicElseByScreen({});
      setLogicCardOffsets({});
      applyBuiltFormState(
        {
          ...built,
          formTitle: location.state?.formTitle ?? built.formTitle,
        },
        templateId
      );
      setBuilderHydrated(true);
      return;
    }

    if (persistedForm?.title || location.state?.formTitle) {
      newFormHydratedRef.current = true;
      setLoadedFormTitle(persistedForm?.title ?? location.state?.formTitle);
    }
    setBuilderHydrated(true);
  }, [
    activeFormId,
    location.state?.templateId,
    location.state?.formTitle,
    location.key,
    persistedForm,
    dispatch,
    applyBuiltFormState,
  ]);

  useEffect(() => {
    const prevId = prevActiveScreenIdRef.current;
    if (prevId != null && prevId !== activeScreenId) {
      persistScreenConfigById(prevId);
    }
    prevActiveScreenIdRef.current = activeScreenId;
  }, [activeScreenId, persistScreenConfigById]);

  useEffect(() => {
    if (activeScreenId == null) return;
    setIsEditingCtaCard(false);
    const screen = screens.find((s) => s.id === activeScreenId);
    if (!screen || screen.type !== 'content') return;
    if (screen.config) {
      applyScreenConfig(screen, screen.config, screenConfigSetters);
    } else {
      setShowIfConditions((prev) => (prev.length === 0 ? prev : []));
    }
    // Only re-load panel state when the active screen changes (not on every screens[] update).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeScreenId]);

  const fieldPreviewFallback = useMemo(
    () => ({
      Contact: contactQuestion,
      Address: addressQuestion,
      'Work Info': workQuestion,
      'Short text': shortTextQuestion,
      'Long text': longTextQuestion,
      Single: singleQuestion,
      Multiple: multipleQuestion,
      Rating: ratingQuestion || ratingLowLabel || 'Rate your experience',
      Date: dateQuestion,
      Time: timeQuestion,
      Images: imageQuestion,
      Video: videoQuestion,
      'Multi-image upload': multiImageQuestion,
      Heading: headingText || 'Add a heading',
      Description: descriptionContent || 'Add a description',
      CTA: ctaHeadingText || ctaButtonLabel,
      Media: mediaQuestion,
      Captcha: "Verify you're human",
    }),
    [
      contactQuestion,
      addressQuestion,
      workQuestion,
      shortTextQuestion,
      longTextQuestion,
      singleQuestion,
      multipleQuestion,
      ratingLowLabel,
      imageQuestion,
      videoQuestion,
      multiImageQuestion,
      headingText,
      descriptionContent,
      ctaHeadingText,
      ctaButtonLabel,
      mediaQuestion,
    ]
  );
  fieldPreviewFallbackRef.current = fieldPreviewFallback;

  useEffect(() => {
    setLogicQuestionOptionsTick((t) => t + 1);
  }, [introTitle, fieldPreviewFallback]);

  const getScreenDeleteLabel = useCallback(
    (screen) => {
      if (!screen) return 'Screen';
      if (screen.type === 'intro') {
        return introTitle?.trim() || getBuilderScreenPreviewText(screen, fieldPreviewFallback, activeScreenId) || 'Start Screen';
      }
      if (screen.type === 'end') {
        return endScreenTitle?.trim() || getBuilderScreenPreviewText(screen, fieldPreviewFallback, activeScreenId) || 'End Screen';
      }
      return getBuilderScreenPreviewText(screen, fieldPreviewFallback, activeScreenId) || screen.name || screen.label || 'Screen';
    },
    [fieldPreviewFallback, introTitle, endScreenTitle, activeScreenId]
  );

  const requestDeleteScreen = useCallback(
    (payload) => setPendingScreenDelete(payload),
    []
  );

  const closeDeleteScreenModal = useCallback(() => setPendingScreenDelete(null), []);

  const confirmScreenDelete = useCallback(() => {
    if (!pendingScreenDelete) return;
    const { kind, screenId } = pendingScreenDelete;
    if (kind === 'content' && screenId != null) {
      removeContentScreen(screenId);
    } else if (kind === 'intro') {
      performDeleteIntroScreen();
    } else if (kind === 'end') {
      performDeleteEndScreen();
    }
    setPendingScreenDelete(null);
  }, [pendingScreenDelete, removeContentScreen, performDeleteIntroScreen, performDeleteEndScreen]);

  useEffect(() => {
    if (!builderHydrated || activeFormId == null) return;
    const sessionKey = String(activeFormId);
    if (logicMergeSessionRef.current === sessionKey) return;

    const hasSnapshotLogic =
      logicConnections.length > 0 || Object.keys(logicIfRulesByEdge).length > 0;

    try {
      const raw = localStorage.getItem(logicStorageKeyForForm(activeFormId));
      if (raw) {
        const data = JSON.parse(raw);
        const storedHasLogic =
          (Array.isArray(data.logicConnections) && data.logicConnections.length > 0) ||
          (data.logicIfRulesByEdge && Object.keys(data.logicIfRulesByEdge).length > 0);

        if (!hasSnapshotLogic && storedHasLogic) {
          if (Array.isArray(data.logicConnections)) {
            setLogicConnections(data.logicConnections);
          }
          let byEdge = {};
          let legacyElse = {};
          if (data.logicIfRulesByEdge && typeof data.logicIfRulesByEdge === 'object') {
            byEdge = data.logicIfRulesByEdge;
          } else if (data.logicIfRulesByScreen && typeof data.logicIfRulesByScreen === 'object') {
            const migrated = migrateLogicIfRulesToEdges(data.logicIfRulesByScreen);
            byEdge = migrated.byEdge;
            legacyElse = migrated.elseByScreen;
          }
          if (data.logicElseByScreen && typeof data.logicElseByScreen === 'object') {
            legacyElse = { ...legacyElse, ...data.logicElseByScreen };
          }
          setLogicIfRulesByEdge(mergeLegacyElseIntoEdges(byEdge, legacyElse));
        }

        if (data.logicMeta && typeof data.logicMeta === 'object') {
          if (typeof data.logicMeta.logicModeManual === 'boolean') {
            setLogicModeManual(data.logicMeta.logicModeManual);
          }
          if (data.logicMeta.logicCardOffsets && typeof data.logicMeta.logicCardOffsets === 'object') {
            setLogicCardOffsets(data.logicMeta.logicCardOffsets);
          }
          if (data.logicMeta.aiLogicGenStatus === AI_LOGIC_GEN_STATUS.success) {
            setAiLogicGen({ status: AI_LOGIC_GEN_STATUS.success, errorMessage: '' });
          }
        }
      }
    } catch {
      /* ignore corrupt storage */
    }

    logicMergeSessionRef.current = sessionKey;
    logicStorageHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- merge once per form after hydration
  }, [builderHydrated, activeFormId]);

  useEffect(() => {
    logicMergeSessionRef.current = null;
    logicStorageHydratedRef.current = false;
    lastPersistedSnapshotRef.current = null;
  }, [activeFormId]);

  useEffect(() => {
    if (!logicStorageHydratedRef.current || !builderHydrated || activeFormId == null) return;
    try {
      localStorage.setItem(
        logicStorageKeyForForm(activeFormId),
        JSON.stringify({
          logicConnections,
          logicIfRulesByEdge,
          logicMeta: buildLogicMeta({
            logicModeManual,
            logicCardOffsets,
            aiLogicGenStatus: aiLogicGen.status,
          }),
          savedAt: Date.now(),
        })
      );
    } catch {
      /* quota / private mode */
    }
  }, [
    activeFormId,
    builderHydrated,
    logicConnections,
    logicIfRulesByEdge,
    logicModeManual,
    logicCardOffsets,
    aiLogicGen.status,
  ]);

  useEffect(() => {
    if (!builderHydrated || !activeFormId || screens.length === 0 || !isFormDirty) {
      return undefined;
    }
    const timer = setTimeout(() => {
      const snapshot = buildPublishSnapshot({
        formId: activeFormId,
        templateId: location.state?.templateId ?? lastHydratedTemplateIdRef.current,
        formTitle: loadedFormTitle ?? location.state?.formTitle ?? persistedForm?.title ?? 'Untitled Form',
        screens: getScreensSnapshot(),
        nextId: nextIdRef.current,
        intro: {
          title: introTitle,
          description: introDescription,
          buttonText: introButtonText,
          textSize: welcomeTextSize,
          alignment: welcomeAlignment,
        },
        end: {
          title: endScreenTitle,
          description: endScreenDescription,
          buttonText: endScreenButtonText,
        },
        logicConnections,
        logicIfRulesByEdge,
        logicMeta: buildLogicMeta({
          logicModeManual,
          logicCardOffsets,
          aiLogicGenStatus: aiLogicGen.status,
        }),
        theme: buildBuilderThemeSnapshot(),
        settings: buildBuilderSettingsSnapshot(),
      });
      const snapshotKey = JSON.stringify(snapshot);
      if (lastPersistedSnapshotRef.current === snapshotKey) {
        return;
      }
      if (isApiConfigured()) setBuilderSaveStatus('saving');
      saveBuilderSnapshot(activeFormId, snapshot)
        .then(() => {
          lastPersistedSnapshotRef.current = snapshotKey;
          builderBaselineRef.current = serializeBuilderState();
          formTouchedRef.current = false;
          setIsFormDirty(false);
          setBuilderSaveStatus('saved');
          const now = Date.now();
          if (now - lastSaveToastAtRef.current > 8000) {
            lastSaveToastAtRef.current = now;
            showToast({ type: 'success', message: 'Draft saved', duration: 2500 });
          }
        })
        .catch((err) => {
          if (err?.status === 429) {
            setBuilderSaveStatus('error');
            return;
          }
          setBuilderSaveStatus('error');
          showToast({ type: 'error', message: 'Auto-save failed', duration: 3000 });
        });
      dispatch(
        updateForm({
          id: activeFormId,
          changes: {
            title: snapshot.formTitle,
            templateId: snapshot.templateId,
            builderSnapshot: snapshot,
            timeAgo: 'just now',
          },
        })
      );
    }, 5000);
    return () => clearTimeout(timer);
  }, [
    builderHydrated,
    activeFormId,
    screens,
    isFormDirty,
    loadedFormTitle,
    persistedForm?.title,
    introTitle,
    introDescription,
    introButtonText,
    welcomeTextSize,
    welcomeAlignment,
    endScreenTitle,
    endScreenDescription,
    endScreenButtonText,
    logicConnections,
    logicIfRulesByEdge,
    logicModeManual,
    logicCardOffsets,
    aiLogicGen.status,
    location.state?.templateId,
    location.state?.formTitle,
    getScreensSnapshot,
    buildBuilderThemeSnapshot,
    buildBuilderSettingsSnapshot,
    dispatch,
  ]);

  useEffect(() => {
    if (!activeFormId) return;
    const title = loadedFormTitle ?? location.state?.formTitle;
    if (!title) return;
    dispatch(updateForm({ id: activeFormId, changes: { title } }));
  }, [activeFormId, loadedFormTitle, location.state?.formTitle, dispatch]);

  useEffect(() => {
    if (!isPreview) return;
    setPreviewVisitStack([]);
    previewSnapByScreenRef.current = {};
    previewAnswersByScreenRef.current = {};
    setPreviewSnapVersion(0);
  }, [isPreview]);

  const handlePreviewSnapChange = useCallback(
    (screenId, snap) => {
      if (!isPreview || screenId == null) return;
      previewSnapByScreenRef.current[screenId] = snap;
      const screen = screens.find((s) => s.id === screenId);
      if (screen) {
        previewAnswersByScreenRef.current[screenId] = buildLogicAnswersFromScreen(screen, snap);
      }
      setPreviewSnapVersion((v) => v + 1);
    },
    [isPreview, screens]
  );

  const capturePreviewAnswersForScreen = useCallback(
    (screenId) => {
      const screen = screens.find((s) => s.id === screenId);
      const snap = previewSnapByScreenRef.current[screenId];
      if (screen && snap) {
        previewAnswersByScreenRef.current[screenId] = buildLogicAnswersFromScreen(screen, snap);
      }
    },
    [screens]
  );

  const priorScreensForActive = useMemo(
    () => getPriorContentScreens(screens, activeScreenId),
    [screens, activeScreenId]
  );

  const getLogicalNextScreenId = useCallback(
    (fromScreenId) =>
      resolveVisibleNextScreenId({
        fromScreenId,
        screens,
        logicIfRulesByEdge,
        logicElseByScreen,
        logicConnections,
        answersByScreenId: previewAnswersByScreenRef.current,
      }),
    [screens, logicIfRulesByEdge, logicElseByScreen, logicConnections]
  );

  useEffect(() => {
    if (!isPreview || activeScreenId == null) return;
    const screen = screens.find((s) => s.id === activeScreenId);
    if (!screen || screen.type !== 'content') return;
    if (isScreenVisibleInPreview(screen, previewAnswersByScreenRef.current)) return;

    const nextId = resolveVisibleNextScreenId({
      fromScreenId: activeScreenId,
      screens,
      logicIfRulesByEdge,
      logicElseByScreen,
      logicConnections,
      answersByScreenId: previewAnswersByScreenRef.current,
    });
    if (nextId != null && nextId !== activeScreenId) {
      setActiveScreenId(nextId);
    }
  }, [isPreview, activeScreenId, screens, logicIfRulesByEdge, logicElseByScreen, logicConnections, previewSnapVersion]);

  const prevScreen = useMemo(() => {
    if (isPreview) {
      if (previewVisitStack.length === 0) return null;
      const prevId = previewVisitStack[previewVisitStack.length - 1];
      return screens.find((s) => s.id === prevId) ?? null;
    }
    return activeScreenIdx > 0 ? screens[activeScreenIdx - 1] : null;
  }, [isPreview, previewVisitStack, screens, activeScreenIdx]);

  const nextScreen = useMemo(() => {
    if (isPreview && activeScreenId != null) {
      const nextId = getLogicalNextScreenId(activeScreenId);
      return nextId != null ? screens.find((s) => s.id === nextId) ?? null : null;
    }
    return activeScreenIdx < screens.length - 1 ? screens[activeScreenIdx + 1] : null;
  }, [
    isPreview,
    activeScreenId,
    screens,
    activeScreenIdx,
    getLogicalNextScreenId,
    previewVisitStack,
    previewSnapVersion,
  ]);

  useEffect(() => {
    const ids = new Set(screens.map((s) => s.id));
    setLogicConnections((prev) => {
      const next = prev.filter((c) => ids.has(c.from) && ids.has(c.to));
      return next.length === prev.length ? prev : next;
    });
    setLogicCardOffsets((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const id = Number(k);
        if (!ids.has(id)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setLogicCardHeights((prev) => {
      let changed = false;
      const next = {};
      for (const s of screens) {
        if (prev[s.id] !== undefined) next[s.id] = prev[s.id];
      }
      if (Object.keys(next).length !== Object.keys(prev).length) changed = true;
      return changed ? next : prev;
    });
  }, [screens]);

  useEffect(() => {
    if (logicConnections.length === 0) return;
    setScreens((prev) => {
      const next = reorderScreensFromLogicConnections(prev, logicConnections);
      const a = prev.map((s) => s.id).join(',');
      const b = next.map((s) => s.id).join(',');
      if (a === b) return prev;
      return next;
    });
  }, [logicConnections]);

  useEffect(() => {
    if (!logicConnectorMenu) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLogicConnectorMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [logicConnectorMenu]);

  useEffect(() => {
    if (activeTab !== 'logic') setLogicDisconnectHoveredKey(null);
  }, [activeTab]);

  const goPreviewPrev = useCallback(() => {
    const stack = previewVisitStackRef.current;
    if (!stack.length) return;
    const prevId = stack[stack.length - 1];
    setPreviewVisitStack(stack.slice(0, -1));
    setActiveScreenId(prevId);
  }, []);

  const goPreviewNext = useCallback(() => {
    if (activeScreenId == null) return;
    const validate = previewScreenValidatorRef.current;
    if (validate && !validate()) return;
    capturePreviewAnswersForScreen(activeScreenId);
    const nextId = getLogicalNextScreenId(activeScreenId);
    if (nextId == null) return;
    setPreviewVisitStack((stack) => [...stack, activeScreenId]);
    setActiveScreenId(nextId);
  }, [activeScreenId, capturePreviewAnswersForScreen, getLogicalNextScreenId]);

  const previewStepNavEl =
    isPreview && activeScreen?.type !== 'intro' ? (
      <PreviewCardStepNav
        prevScreen={prevScreen}
        nextScreen={nextScreen}
        onGoPrev={goPreviewPrev}
        onGoContinue={goPreviewNext}
      />
    ) : null;

  /* ── Responsive canvas scaling ── */
  // Base "design" resolution the form is authored at
  const CANVAS_BASE_W = deviceView === 'mobile' ? 420 : 820;
  const CANVAS_CARD_H = deviceView === 'mobile' ? 680 : 560;
  // Keep scale identical in builder and preview by always reserving preview chrome space.
  const CANVAS_BASE_H = CANVAS_CARD_H + (hasScreens ? PREVIEW_CHROME_H : 0);
  const CANVAS_PAD = 40; // px gap around the scaled frame

  const canvasContainerRef = useRef(null);
  const [canvasScale, setCanvasScale] = useState(1);

  const measureCanvasScale = useCallback(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const availW = Math.max(0, el.clientWidth - CANVAS_PAD * 2);
    const availH = Math.max(0, el.clientHeight - CANVAS_PAD * 2);
    const scale = Math.min(1, availW / CANVAS_BASE_W, availH / CANVAS_BASE_H);
    setCanvasScale(Number.isFinite(scale) && scale > 0 ? scale : 1);
  }, [CANVAS_BASE_W, CANVAS_BASE_H]);

  useLayoutEffect(() => {
    measureCanvasScale();
    if (skipPanelEnterRef.current) {
      skipPanelEnterRef.current = false;
    }
  }, [measureCanvasScale, hasScreens, isPreview, deviceView]);

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return undefined;
    const obs = new ResizeObserver(measureCanvasScale);
    obs.observe(el);
    return () => obs.disconnect();
  }, [measureCanvasScale, hasScreens]);

  const welcomeTextAlignClass =
    welcomeAlignment === 'center' ? 'text-center' : welcomeAlignment === 'right' ? 'text-right' : 'text-left';
  const welcomeItemsAlignClass =
    welcomeAlignment === 'center' ? 'items-center' : welcomeAlignment === 'right' ? 'items-end' : 'items-start';
  const welcomeJustifyClass =
    welcomeAlignment === 'center' ? 'justify-center' : welcomeAlignment === 'right' ? 'justify-end' : 'justify-start';
  const welcomeSizeMap = deviceView === 'mobile' ? WELCOME_TEXT_SIZE_MOBILE : WELCOME_TEXT_SIZE_DESKTOP;
  const welcomeSize = welcomeSizeMap[welcomeTextSize] ?? welcomeSizeMap.M;

  useEffect(() => {
    if (!hasScreens) return undefined;
    const t = setTimeout(measureCanvasScale, 300);
    return () => clearTimeout(t);
  }, [hasScreens, showConfigPanel, showContentPanel, measureCanvasScale]);

  // Scroll the input-type dropdown into view when it opens
  useEffect(() => {
    if (welcomeInputTypeOpen && welcomeInputTypeRef.current) {
      setTimeout(() => {
        welcomeInputTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [welcomeInputTypeOpen]);

  useEffect(() => {
    if (activeTab === 'logic' && logicTabDisabled) {
      setActiveTab('content');
    }
  }, [activeTab, logicTabDisabled]);

  useEffect(() => {
    if (activeTab === 'design' && designTabDisabled) {
      setActiveTab('content');
      setShowDesignPanel(false);
    }
  }, [activeTab, designTabDisabled]);

  useEffect(() => {
    if (activeScreenId == null) return undefined;
    const screen = screens.find((s) => s.id === activeScreenId);
    if (!screen || screen.type !== 'content') return undefined;
    const timer = setTimeout(() => {
      persistScreenConfigById(activeScreenId);
    }, 120);
    return () => clearTimeout(timer);
  }, [activeScreenId, fieldPreviewFallback, showIfConditions, persistScreenConfigById, screens.length]);

  const getLogicCardQuestionText = useCallback(
    (screen) => getBuilderScreenPreviewText(screen, fieldPreviewFallback, activeScreenId),
    [fieldPreviewFallback, activeScreenId],
  );

  const logicIntro = screens.find((s) => s.type === 'intro') ?? null;
  const logicEnd = screens.find((s) => s.type === 'end') ?? null;
  const logicFlowNodes = [
    ...(logicIntro ? [{ kind: 'intro', screen: logicIntro }] : []),
    ...contentScreens.map((s) => ({ kind: 'content', screen: s })),
    ...(logicEnd ? [{ kind: 'end', screen: logicEnd }] : []),
  ];
  const logicBoardSize = useMemo(() => {
    const intro = screens.find((s) => s.type === 'intro') ?? null;
    const end = screens.find((s) => s.type === 'end') ?? null;
    const content = screens.filter((s) => s.type === 'content');
    const nodes = [
      ...(intro ? [intro] : []),
      ...content,
      ...(end ? [end] : []),
    ];
    const padX = 64;
    const padY = 80;
    let maxR = 0;
    let maxB = 0;
    nodes.forEach((scr, i) => {
      const id = scr.id;
      const off = logicCardOffsets[id] ?? { x: 0, y: 0 };
      let x = i * (LOGIC_FLOW_CARD_W + LOGIC_FLOW_GAP) + off.x;
      let y = off.y;
      if (logicCardDraggingId === id) {
        x += logicCardDragOffset.x;
        y += logicCardDragOffset.y;
      }
      const h =
        logicCardHeights[id] ??
        (logicCanvasZoom < LOGIC_CANVAS_COMPACT_ZOOM
          ? LOGIC_FLOW_CARD_H_COMPACT_EST
          : LOGIC_FLOW_CARD_H_EST);
      maxR = Math.max(maxR, x + LOGIC_FLOW_CARD_W);
      maxB = Math.max(maxB, y + h);
    });
    const n = nodes.length;
    const minFlowW = n > 0 ? n * LOGIC_FLOW_CARD_W + Math.max(0, n - 1) * LOGIC_FLOW_GAP : LOGIC_FLOW_CARD_W;
    const width = Math.max(minFlowW + padX, maxR + 48);
    const height = Math.max(LOGIC_FLOW_CARD_H_EST + padY, maxB + 48);
    return { width, height };
  }, [
    screens,
    logicCardOffsets,
    logicCardDraggingId,
    logicCardDragOffset,
    logicCardHeights,
    logicCanvasZoom,
  ]);

  const logicPortPositions = useMemo(() => {
    const intro = screens.find((s) => s.type === 'intro') ?? null;
    const end = screens.find((s) => s.type === 'end') ?? null;
    const content = screens.filter((s) => s.type === 'content');
    const nodes = [
      ...(intro ? [{ kind: 'intro', screen: intro }] : []),
      ...content.map((s) => ({ kind: 'content', screen: s })),
      ...(end ? [{ kind: 'end', screen: end }] : []),
    ];
    const map = new Map();
    nodes.forEach((item, idx) => {
      const id = item.screen.id;
      const off = logicCardOffsets[id] ?? { x: 0, y: 0 };
      const dragging = logicCardDraggingId === id;
      const ddx = dragging ? logicCardDragOffset.x : 0;
      const ddy = dragging ? logicCardDragOffset.y : 0;
      const left = idx * (LOGIC_FLOW_CARD_W + LOGIC_FLOW_GAP) + off.x + ddx;
      const top = off.y + ddy;
      const h = logicCardHeights[id] ?? LOGIC_FLOW_CARD_H_EST;
      const dom = logicPortDomAnchors[id];
      let inX = null;
      let outX = null;
      if (item.kind === 'intro') {
        outX = dom?.outX ?? left + LOGIC_FLOW_CARD_W + LOGIC_CONNECTOR_OUT_R;
      } else if (item.kind === 'end') {
        inX = dom?.inX ?? left - LOGIC_CONNECTOR_IN_R;
      } else {
        inX = dom?.inX ?? left - LOGIC_CONNECTOR_IN_R;
        outX = dom?.outX ?? left + LOGIC_FLOW_CARD_W + LOGIC_CONNECTOR_OUT_R;
      }
      const inY = dom?.inY ?? top + h / 2;
      const outY = dom?.outY ?? top + h / 2;
      const portY = outY;
      map.set(id, {
        left,
        top,
        width: LOGIC_FLOW_CARD_W,
        height: h,
        inX,
        outX,
        inY,
        outY,
        portY,
        kind: item.kind,
      });
    });
    return map;
  }, [
    screens,
    logicCardOffsets,
    logicCardDraggingId,
    logicCardDragOffset,
    logicCardHeights,
    logicPortDomAnchors,
    logicCanvasZoom,
  ]);

  const logicConnectionsForRender = logicConnections;

  const logicConnByFrom = useMemo(
    () => groupLogicConnectionsByFrom(logicConnectionsForRender),
    [logicConnectionsForRender]
  );
  const logicConnByTo = useMemo(
    () => groupLogicConnectionsByTo(logicConnectionsForRender),
    [logicConnectionsForRender]
  );

  /** Draw longer edges first so shorter wires stay visible on top (Typeform-style clarity). */
  const logicConnectionsDrawOrder = useMemo(() => {
    return [...logicConnectionsForRender].sort((ca, cb) => {
      const aa = logicPortPositions.get(ca.from);
      const ba = logicPortPositions.get(ca.to);
      const ab = logicPortPositions.get(cb.from);
      const bb = logicPortPositions.get(cb.to);
      if (!aa?.outX || !ba?.inX || !ab?.outX || !bb?.inX) return 0;
      const la = Math.hypot(ba.inX - aa.outX, ba.portY - aa.portY);
      const lb = Math.hypot(bb.inX - ab.outX, bb.portY - ab.portY);
      return lb - la;
    });
  }, [logicConnectionsForRender, logicPortPositions]);

  const logicObstacles = useMemo(() => {
    const list = [];
    logicPortPositions.forEach((pos, id) => {
      list.push(logicObstacleFromPort(id, pos));
    });
    return list;
  }, [logicPortPositions]);

  useLayoutEffect(() => {
    if (activeTab !== 'logic' || !showLogicCanvas || contentScreens.length === 0) return;
    const board = logicBoardMeasureRef.current;
    if (!board) return;

    const measure = () => {
      const nextHeights = {};
      const nextPorts = {};
      const boardRect = board.getBoundingClientRect();
      const zoom = logicCanvasZoom || 1;

      const portCenterInBoard = (portEl) => {
        const r = portEl.getBoundingClientRect();
        return {
          x: (r.left + r.width / 2 - boardRect.left) / zoom,
          y: (r.top + r.height / 2 - boardRect.top) / zoom,
        };
      };

      board.querySelectorAll('[data-logic-card]').forEach((el) => {
        const sid = el.getAttribute('data-screen-id');
        if (!sid) return;
        const id = Number(sid);
        const kind = el.getAttribute('data-logic-kind');
        nextHeights[id] = el.offsetHeight;

        const ports = {};
        const inPort = el.querySelector('[data-logic-input-port]');
        const outPort = el.querySelector('[data-logic-output-port]');
        if (kind !== 'intro' && inPort) {
          const c = portCenterInBoard(inPort);
          ports.inX = c.x;
          ports.inY = c.y;
        }
        if (kind !== 'end' && outPort) {
          const c = portCenterInBoard(outPort);
          ports.outX = c.x;
          ports.outY = c.y;
        }
        if (Object.keys(ports).length) {
          nextPorts[id] = ports;
        }
      });

      setLogicCardHeights((prev) => {
        let changed = false;
        const merged = { ...prev };
        for (const sid of Object.keys(nextHeights)) {
          const id = Number(sid);
          if (merged[id] !== nextHeights[id]) {
            merged[id] = nextHeights[id];
            changed = true;
          }
        }
        for (const k of Object.keys(prev)) {
          const id = Number(k);
          if (nextHeights[id] === undefined && merged[id] !== undefined) {
            delete merged[id];
            changed = true;
          }
        }
        return changed ? merged : prev;
      });

      setLogicPortDomAnchors((prev) => {
        const prevJson = JSON.stringify(prev);
        const nextJson = JSON.stringify(nextPorts);
        return prevJson === nextJson ? prev : nextPorts;
      });
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(board);
    board.querySelectorAll('[data-logic-card]').forEach((el) => ro.observe(el));
    board.querySelectorAll('[data-logic-input-port], [data-logic-output-port]').forEach((el) =>
      ro.observe(el),
    );

    return () => ro.disconnect();
  }, [
    activeTab,
    showLogicCanvas,
    contentScreens.length,
    screens,
    logicCardOffsets,
    logicCardDraggingId,
    logicCardDragOffset,
    logicCanvasZoom,
    logicCanvasPan,
    introTitle,
    introDescription,
    endScreenTitle,
    endScreenDescription,
  ]);

  useLayoutEffect(() => {
    logicPortPositionsRef.current = logicPortPositions;
  }, [logicPortPositions]);

  const logicCanvasCompact = logicCanvasZoom < LOGIC_CANVAS_COMPACT_ZOOM;

  const cardDragHandlers = (screenId) => ({
    onPointerDown: (e) => onLogicCardPointerDown(e, screenId),
    onPointerMove: (e) => onLogicCardPointerMove(e, screenId),
    onPointerUp: (e) => onLogicCardPointerUp(e, screenId),
    onPointerCancel: (e) => onLogicCardPointerUp(e, screenId),
  });

  const renderLogicFlowCard = (item, flowIndex) => {
    const screenId = item.screen.id;
    const off = logicCardOffsets[screenId] ?? { x: 0, y: 0 };
    const baseX = flowIndex * (LOGIC_FLOW_CARD_W + LOGIC_FLOW_GAP);
    const baseY = 0;
    const dragging = logicCardDraggingId === screenId;
    const ddx = dragging ? logicCardDragOffset.x : 0;
    const ddy = dragging ? logicCardDragOffset.y : 0;
    const posStyle = {
      position: 'absolute',
      left: baseX + off.x + ddx,
      top: baseY + off.y + ddy,
      width: LOGIC_FLOW_CARD_W,
      zIndex: dragging ? 50 : 9,
      boxShadow: dragging ? '0 12px 36px rgba(0,0,0,0.14)' : undefined,
      opacity: dragging ? 0.95 : undefined,
    };

    const outputPortHandlers = {
      onPointerDown: (e) => onLogicOutputPortPointerDown(e, screenId),
      onPointerMove: onLogicOutputPortPointerMove,
      onPointerUp: onLogicOutputPortPointerUp,
      onPointerCancel: onLogicOutputPortPointerUp,
    };

    const inDot = (
      <span
        data-logic-input-port
        className="absolute z-[15] w-2 h-2 rounded-full bg-[#1a1a1a] pointer-events-none"
        style={{ top: '50%', left: 0, transform: 'translate(-50%, -50%)' }}
        aria-hidden
      />
    );

    const outPort = (
      <span
        role="presentation"
        data-logic-output-port
        className="absolute z-[15] flex h-5 w-5 cursor-crosshair touch-none hover:scale-110 transition-transform"
        style={{ top: '50%', right: 0, transform: 'translate(50%, -50%)' }}
        aria-label="Connect logic branch"
        {...outputPortHandlers}
      >
        <LogicOutputPortIcon size={20} className="pointer-events-none" />
      </span>
    );

    const contentIdx =
      item.kind === 'content'
        ? contentScreens.findIndex((s) => s.id === item.screen.id) + 1
        : 0;

    const cardPadClass = logicCanvasCompact ? 'p-2.5' : 'p-4';

    if (item.kind === 'intro') {
      return (
        <div
          key={screenId}
          data-logic-card
          data-screen-id={screenId}
          data-logic-kind="intro"
          style={posStyle}
          className={`relative rounded-[12px] border border-[rgba(71,69,74,0.08)] bg-white ${cardPadClass} shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing touch-none overflow-visible`}
          {...cardDragHandlers(screenId)}
        >
          {outPort}
          <div className="flex items-start gap-2">
            <div className="flex h-6 items-center rounded-md bg-[#dedcde] px-1.5 shrink-0">
              <PagesStartIcon size={14} className="text-[#3C323E]" />
            </div>
          </div>
          {!logicCanvasCompact ? (
            <div className="mt-2 flex min-w-0 flex-col gap-[2px]">
              <span className={LOGIC_CARD_NAME_CLASS}>
                {introTitle?.trim() || item.screen.name || 'Start Screen'}
              </span>
              {introDescription?.trim() ? (
                <span className={LOGIC_CARD_PREVIEW_CLASS}>{introDescription.trim()}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (item.kind === 'content') {
      const meta = SCREEN_ICON_MAP[item.screen.label] ?? {
        Icon: RiFileTextLine,
        bg: 'bg-[#f4f4f4]',
        color: 'text-gray-500',
      };
      const QIcon = meta.Icon;
      return (
        <div
          key={screenId}
          data-logic-card
          data-screen-id={screenId}
          data-logic-kind="content"
          style={posStyle}
          className={`relative rounded-[12px] border border-[rgba(81,76,84,0.15)] bg-white ${cardPadClass} shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing touch-none overflow-visible`}
          {...cardDragHandlers(screenId)}
        >
          {inDot}
          {outPort}
          <div className="flex items-start gap-2">
            <div
              className={`relative flex h-6 min-w-[48px] items-center overflow-hidden rounded-md pl-1 pr-5 ${meta.bg}`}
            >
              <QIcon size={14} className={`shrink-0 ${meta.color}`} />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[12px] font-semibold tabular-nums text-[#3c323e]">
                {contentIdx}
              </span>
            </div>
          </div>
          {!logicCanvasCompact ? (
            <div className="mt-2 flex min-w-0 flex-col gap-[2px]">
              <span className={LOGIC_CARD_NAME_CLASS}>{item.screen.label}</span>
              <span className={LOGIC_CARD_PREVIEW_CLASS}>
                {getLogicCardQuestionText(item.screen)}
              </span>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        key={screenId}
        data-logic-card
        data-screen-id={screenId}
        data-logic-kind="end"
        style={posStyle}
        className={`relative rounded-[12px] border border-[rgba(71,69,74,0.08)] bg-white ${cardPadClass} shadow-[0_2px_8px_rgba(0,0,0,0.06)] cursor-grab active:cursor-grabbing touch-none overflow-visible`}
        {...cardDragHandlers(screenId)}
      >
        {inDot}
        <div className="flex items-start gap-2">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#eef2ff] shrink-0">
            <PagesEndIcon size={14} className="text-[#3C323E]" />
          </div>
        </div>
        {!logicCanvasCompact ? (
          <div className="mt-2 flex min-w-0 flex-col gap-[2px]">
            <span className={LOGIC_CARD_NAME_CLASS}>
              {endScreenTitle?.trim() || item.screen.name || 'End Screen'}
            </span>
            {endScreenDescription?.trim() ? (
              <span className={LOGIC_CARD_PREVIEW_CLASS}>{endScreenDescription.trim()}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  useEffect(() => {
    logicCanvasPanRef.current = logicCanvasPan;
  }, [logicCanvasPan]);
  useEffect(() => {
    logicCanvasZoomRef.current = logicCanvasZoom;
  }, [logicCanvasZoom]);

  const fitLogicCanvasView = useCallback(() => {
    const vp = logicViewportRef.current;
    const board = logicBoardMeasureRef.current;
    if (!vp || !board) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const w = board.offsetWidth;
    const h = board.offsetHeight;
    if (w <= 0 || h <= 0 || vw <= 0 || vh <= 0) return;
    const pad = 80;
    const z = Math.min((vw - pad) / w, (vh - pad) / h, 2.5);
    const newZoom = Math.max(0.25, z);
    const panX = (vw - w * newZoom) / 2;
    const panY = (vh - h * newZoom) / 2;
    setLogicCanvasZoom(newZoom);
    setLogicCanvasPan({ x: panX, y: panY });
  }, []);

  const handleLogicCanvasWheel = useCallback((e) => {
    const vp = logicViewportRef.current;
    if (!vp) return;
    e.preventDefault();
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const prevZoom = logicCanvasZoomRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const newZoom = Math.min(2.5, Math.max(0.25, prevZoom * zoomFactor));
    if (Math.abs(newZoom - prevZoom) < 0.0001) return;
    const prevPan = logicCanvasPanRef.current;
    const wx = (mx - prevPan.x) / prevZoom;
    const wy = (my - prevPan.y) / prevZoom;
    setLogicCanvasZoom(newZoom);
    setLogicCanvasPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
  }, []);

  useEffect(() => {
    const vp = logicViewportRef.current;
    if (!vp) return undefined;
    vp.addEventListener('wheel', handleLogicCanvasWheel, { passive: false });
    return () => vp.removeEventListener('wheel', handleLogicCanvasWheel);
  }, [handleLogicCanvasWheel, activeTab, contentScreens.length]);

  const nudgeLogicZoom = useCallback((factor) => {
    const vp = logicViewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const prevZoom = logicCanvasZoomRef.current;
    const newZoom = Math.min(2.5, Math.max(0.25, prevZoom * factor));
    if (Math.abs(newZoom - prevZoom) < 0.0001) return;
    const prevPan = logicCanvasPanRef.current;
    const wx = (mx - prevPan.x) / prevZoom;
    const wy = (my - prevPan.y) / prevZoom;
    setLogicCanvasZoom(newZoom);
    setLogicCanvasPan({ x: mx - wx * newZoom, y: my - wy * newZoom });
  }, []);

  const onLogicPanSurfacePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    setLogicConnectorMenu(null);
    const t = e.target;
    if (
      t instanceof Element &&
      (t.closest('[data-logic-card]') ||
        t.closest('[data-logic-edge]') ||
        t.closest('[data-logic-edge-pill]') ||
        t.closest('[data-logic-edge-disconnect]') ||
        t.closest('[data-logic-output-port]'))
    )
      return;
    logicPanDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      pan: { ...logicCanvasPanRef.current },
    };
    setLogicCanvasPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onLogicPanSurfacePointerMove = useCallback((e) => {
    const d = logicPanDragRef.current;
    if (!d) return;
    setLogicCanvasPan({
      x: d.pan.x + e.clientX - d.sx,
      y: d.pan.y + e.clientY - d.sy,
    });
  }, []);

  const onLogicPanSurfacePointerUp = useCallback((e) => {
    logicPanDragRef.current = null;
    setLogicCanvasPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  useLayoutEffect(() => {
    const prev = logicPrevTabRef.current;
    logicPrevTabRef.current = activeTab;
    if (activeTab === 'logic' && prev !== 'logic' && contentScreens.length > 0) {
      requestAnimationFrame(() => fitLogicCanvasView());
    }
  }, [activeTab, contentScreens.length, fitLogicCanvasView]);

  const publishFormTitle = useMemo(() => {
    if (loadedFormTitle) return loadedFormTitle;
    if (location.state?.formTitle) return location.state.formTitle;
    if (selectedTemplate) {
      const parts = selectedTemplate.split(':');
      return parts.length > 1 ? parts.slice(1).join(':') : parts[0];
    }
    return 'Untitled Form';
  }, [loadedFormTitle, selectedTemplate, location.state?.formTitle]);

  const commitFormTitleEdit = useCallback(() => {
    const next = draftFormTitle.trim() || 'Untitled Form';
    setLoadedFormTitle(next);
    setIsEditingFormTitle(false);
    markFormTouched();
  }, [draftFormTitle]);

  const cancelFormTitleEdit = useCallback(() => {
    setIsEditingFormTitle(false);
  }, []);

  const startFormTitleEdit = useCallback(() => {
    setDraftFormTitle(publishFormTitle);
    setIsEditingFormTitle(true);
  }, [publishFormTitle]);

  useLayoutEffect(() => {
    if (!isEditingFormTitle) return;
    const input = formTitleInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [isEditingFormTitle]);

  const buildCurrentPublishSnapshot = useCallback(() => {
    if (!activeFormId || screens.length === 0) return null;
    return buildPublishSnapshot({
      formId: activeFormId,
      templateId: location.state?.templateId ?? lastHydratedTemplateIdRef.current,
      formTitle: publishFormTitle,
      screens: getScreensSnapshot(),
      nextId: nextIdRef.current,
      intro: {
        title: introTitle,
        description: introDescription,
        buttonText: introButtonText,
        textSize: welcomeTextSize,
        alignment: welcomeAlignment,
        logo: logoImage,
        essential: introEssential,
      },
      end: {
        title: endScreenTitle,
        description: endScreenDescription,
        buttonText: endScreenButtonText,
      },
      logicConnections,
      logicIfRulesByEdge: mergeLegacyElseIntoEdges(logicIfRulesByEdge, logicElseByScreen),
      logicMeta: buildLogicMeta({
        logicModeManual,
        logicCardOffsets,
        aiLogicGenStatus: aiLogicGen.status,
      }),
      theme: buildBuilderThemeSnapshot(),
      settings: buildBuilderSettingsSnapshot(),
    });
  }, [
    activeFormId,
    screens,
    publishFormTitle,
    introTitle,
    introDescription,
    introButtonText,
    welcomeTextSize,
    welcomeAlignment,
    logoImage,
    introEssential,
    endScreenTitle,
    endScreenDescription,
    endScreenButtonText,
    logicConnections,
    logicIfRulesByEdge,
    logicElseByScreen,
    logicModeManual,
    logicCardOffsets,
    aiLogicGen.status,
    location.state?.templateId,
    getScreensSnapshot,
    buildBuilderThemeSnapshot,
    buildBuilderSettingsSnapshot,
  ]);

  const flushBuilderDraft = useCallback(() => {
    const snapshot = buildCurrentPublishSnapshot();
    if (!snapshot || !activeFormId) return;
    saveBuilderSnapshot(activeFormId, snapshot);
    dispatch(
      updateForm({
        id: activeFormId,
        changes: {
          title: snapshot.formTitle,
          templateId: snapshot.templateId,
          builderSnapshot: snapshot,
          timeAgo: 'just now',
        },
      })
    );
  }, [buildCurrentPublishSnapshot, activeFormId, dispatch]);

  const ensureFormPersisted = useCallback(async () => {
    if (activeFormId || !isApiConfigured() || screens.length === 0) {
      return activeFormId ?? null;
    }
    if (ensureFormInFlightRef.current) {
      return ensureFormPersistedRef.current();
    }
    ensureFormInFlightRef.current = true;
    try {
      const snapshot = buildCurrentPublishSnapshot();
      const title =
        snapshot?.formTitle ??
        loadedFormTitle ??
        location.state?.formTitle ??
        location.state?.templateTitle ??
        'Untitled Form';
      const workspaceId = resolveApiWorkspaceId(location.state?.workspaceId);
      const created = await createFormAndSaveSnapshot({
        title,
        templateId: location.state?.templateId ?? lastHydratedTemplateIdRef.current,
        snapshot,
        workspaceId,
      });
      dispatch(
        addForm({
          id: created.id,
          title: created.title,
          status: 'draft',
          responses: 0,
          timeAgo: 'just now',
          templateId: location.state?.templateId ?? lastHydratedTemplateIdRef.current,
          workspace: workspaceId ?? '',
          gradientFrom: created.gradientFrom,
          gradientTo: created.gradientTo,
          overlayColor: created.overlayColor,
          iconGradient: created.iconGradient,
        }),
      );
      navigate(getFormBuilderPath(created.id), {
        state: { ...location.state, formId: created.id, formTitle: created.title },
        replace: true,
      });
      setBuilderSaveStatus('saved');
      showToast({ type: 'success', message: 'Draft saved', duration: 2500 });
      return created.id;
    } catch {
      showToast({ type: 'error', message: 'Could not save form draft. Please try again.' });
      return null;
    } finally {
      ensureFormInFlightRef.current = false;
    }
  }, [
    activeFormId,
    screens.length,
    buildCurrentPublishSnapshot,
    loadedFormTitle,
    location.state,
    dispatch,
    navigate,
    showToast,
  ]);

  ensureFormPersistedRef.current = ensureFormPersisted;

  useEffect(() => {
    if (!builderHydrated || activeFormId || !isApiConfigured() || screens.length === 0) return;
    void ensureFormPersisted();
  }, [builderHydrated, activeFormId, screens.length, ensureFormPersisted]);

  const handlePublishForm = useCallback(async () => {
    const blockers = getPublishBlockers(screens);
    if (blockers.length) {
      showToast({ type: 'info', message: blockers[0] });
      setPublishModalOpen(false);
      return;
    }
    let formId = activeFormId;
    if (!formId && isApiConfigured()) {
      formId = await ensureFormPersisted();
    }
    if (!formId) {
      showToast({ type: 'error', message: 'Save your form before publishing.' });
      setPublishModalOpen(false);
      return;
    }
    const snapshot = buildCurrentPublishSnapshot();
    if (!snapshot) {
      showToast({ type: 'error', message: 'Nothing to publish yet.' });
      setPublishModalOpen(false);
      return;
    }
    try {
      const workspaceId = resolveApiWorkspaceId(location.state?.workspaceId);
      if (workspaceId && !persistedForm?.workspace) {
        await patchForm(formId, { workspaceId });
      }
      await saveBuilderSnapshot(formId, snapshot);
      const published = await publishFormToApi(formId, snapshot);
      setPublishedPublicUrl(published?.publicUrl ?? null);
      dispatch(
        updateForm({
          id: formId,
          changes: {
            status: published?.status ?? 'live',
            title: published?.title ?? snapshot.formTitle,
            templateId: snapshot.templateId,
            builderSnapshot: snapshot,
            timeAgo: published?.timeAgo ?? 'just now',
            ...(workspaceId ? { workspace: workspaceId } : {}),
          },
        })
      );
      await dispatch(loadFormsFromApi());
      builderBaselineRef.current = serializeBuilderState();
      formTouchedRef.current = false;
      setIsFormDirty(false);
      setPublishModalOpen(false);
      setIsPublishView(true);
      showToast({ type: 'success', message: 'Form published', duration: 3000 });
    } catch (err) {
      const message = err?.message ?? 'Publish failed. Check your connection and try again.';
      showToast({ type: 'error', message, duration: 4000 });
      setPublishModalOpen(false);
    }
  }, [
    screens,
    activeFormId,
    buildCurrentPublishSnapshot,
    dispatch,
    showToast,
    serializeBuilderState,
    ensureFormPersisted,
    persistedForm?.workspace,
    location.state?.workspaceId,
  ]);

  const handlePublishClick = useCallback(() => {
    const blockers = getPublishBlockers(screens);
    if (blockers.length) {
      showToast({ type: 'info', message: blockers[0] });
      return;
    }
    setPublishModalOpen(true);
  }, [screens, showToast]);

  const restoreFromBuilderBaseline = useCallback(() => {
    if (!builderBaselineRef.current) return;
    try {
      const snap = JSON.parse(builderBaselineRef.current);
      if (Array.isArray(snap.screens)) {
        setScreens(snap.screens);
        setActiveScreenId(snap.screens[0]?.id ?? null);
      }
      if (snap.intro) {
        setIntroTitle(snap.intro.title);
        setIntroDescription(snap.intro.description);
        setIntroButtonText(snap.intro.buttonText);
        setWelcomeTextSize(snap.intro.textSize ?? 'M');
        setWelcomeAlignment(snap.intro.alignment ?? 'left');
        setDraftTitle(snap.intro.title);
        setDraftDescription(snap.intro.description);
        setDraftButtonText(snap.intro.buttonText);
      }
      if (snap.end) {
        setEndScreenTitle(snap.end.title);
        setEndScreenDescription(snap.end.description);
        setEndScreenButtonText(snap.end.buttonText);
        setDraftEndTitle(snap.end.title);
        setDraftEndDescription(snap.end.description);
        setDraftEndButtonText(snap.end.buttonText);
      }
      if (Array.isArray(snap.logicConnections)) {
        setLogicConnections(snap.logicConnections);
      }
      if (snap.logicIfRulesByEdge && typeof snap.logicIfRulesByEdge === 'object') {
        setLogicIfRulesByEdge(snap.logicIfRulesByEdge);
      }
    } catch {
      /* ignore malformed snapshot */
    }
    introEditSnapshotRef.current = null;
    endEditSnapshotRef.current = null;
    setIsEditingContent(false);
    setIsEditingEndScreen(false);
    setIsEditingCtaCard(false);
    setIsEditingHeadingCard(false);
    closeAllRightPanels();
  }, [closeAllRightPanels]);

  const performLeaveBuilder = useCallback(() => {
    const leaveTo =
      fromOnboarding || showOnboardingStepper ? '/onboarding' : '/dashboard';
    navigate(leaveTo, { replace: true });
  }, [fromOnboarding, showOnboardingStepper, navigate]);

  const discardAndLeaveBuilder = useCallback(() => {
    restoreFromBuilderBaseline();
    if (activeFormId) {
      clearBuilderDraft(activeFormId);
    }
    setUnsavedChangesPrompt(null);
    performLeaveBuilder();
  }, [restoreFromBuilderBaseline, activeFormId, performLeaveBuilder]);

  const shouldConfirmLeaveBuilder = () => {
    if (screens.length === 0) return false;
    if (screens.some((s) => s.type === 'content')) return true;
    return (
      formTouchedRef.current ||
      isFormDirty ||
      hasChanges ||
      hasEndScreenChanges ||
      isEditingContent ||
      isEditingEndScreen ||
      isEditingCtaCard ||
      isEditingHeadingCard
    );
  };

  const handleHeaderBack = () => {
    if (shouldConfirmLeaveBuilder()) {
      setUnsavedChangesPrompt('leave');
      return;
    }
    performLeaveBuilder();
  };

  const handleUnsavedDiscard = () => {
    if (unsavedChangesPrompt === 'leave') {
      discardAndLeaveBuilder();
    } else if (unsavedChangesPrompt === 'end') {
      discardEndEdits();
    } else {
      discardIntroEdits();
    }
  };

  const handleUnsavedSave = () => {
    if (unsavedChangesPrompt === 'leave') {
      flushBuilderDraft();
      builderBaselineRef.current = serializeBuilderState();
      formTouchedRef.current = false;
      setIsFormDirty(false);
      setUnsavedChangesPrompt(null);
      performLeaveBuilder();
      return;
    }
    if (unsavedChangesPrompt === 'end') {
      handleSaveEndEdit();
    } else {
      handleSaveIntroEdit();
    }
    setUnsavedChangesPrompt(null);
  };

  const closeAllRightPanelsRef = useRef(closeAllRightPanels);
  closeAllRightPanelsRef.current = closeAllRightPanels;

  const openSingleConfigPanel = useCallback(() => {
    closeAllRightPanelsRef.current();
    setTimeout(() => setShowSingleConfigPanel(true), 300);
  }, []);

  const openMultipleConfigPanel = useCallback(() => {
    closeAllRightPanelsRef.current();
    setTimeout(() => setShowMultipleConfigPanel(true), 300);
  }, []);

  const handleConfigureFromCanvas = useCallback(
    (label) => {
      const panel = FIELD_LABEL_TO_CONFIG_PANEL[label];
      if (!panel) return;
      closeAllRightPanelsRef.current();
      openPanelByName(panel);
    },
    [openPanelByName],
  );

  const builderTheme = useMemo(
    () =>
      resolveBuilderTheme({
        designBackground,
        designTextColor,
        formAccentColor,
        designCardColor,
        designCardOpacity,
        designCardImage,
        designLayoutStyle,
        hexToRgba,
      }),
    [
      designBackground,
      designTextColor,
      formAccentColor,
      designCardColor,
      designCardOpacity,
      designCardImage,
      designLayoutStyle,
    ],
  );

  const canvasConfigSnapshot = JSON.stringify(configGlobalsRef.current);

  const canvasFieldConfigs = useMemo(
    () =>
      buildCanvasFieldConfigs({
        ctaButtonLabel,
        ctaHeadingText,
        ctaHelperText,
        ctaDurationText,
        ctaButtonSize,
        ctaButtonStyle,
        ctaCornerRadius,
        ctaShowIcon,
        ctaHeadingSize,
        ctaBodySize,
        ctaFontWeight,
        ctaTextAlign,
        ctaPadding,
        ctaTextColor,
        ctaBtnColor,
        ctaLabelColor,
        ctaContentWidth,
        isEditingCtaCard,
        setIsEditingCtaCard,
        setCtaHeadingText,
        setCtaHelperText,
        setCtaDurationText,
        headingText,
        subHeading,
        headingRequired,
        headingHidden,
        headingLevel,
        headingTextSize,
        headingAlignment,
        headingFontWeight,
        headingAnswerText,
        isEditingHeadingCard,
        setIsEditingHeadingCard,
        setHeadingText,
        setSubHeading,
        setHeadingAnswerText,
        descriptionContent,
        descriptionHidden,
        descriptionShowCharCount,
        descriptionCharLimit,
        descriptionFormatting,
        descriptionTextSize,
        descriptionAlignment,
        setDescriptionContent,
        imageHidden,
        imagePreview,
        imageAltText,
        imageCaption,
        imageLinkOnClick,
        imageLinkUrl,
        imageOpenInNewTab,
        imageAlignment,
        imageWidth,
        imageCornerRadius,
        imageQuestion,
        imageDescription,
        setImagePreview,
        setImageFileName,
        setImageCaption,
        setImageQuestion,
        setImageDescription,
        videoUrl,
        videoCaption,
        videoWidth,
        videoAspectRatio,
        videoCornerRadius,
        videoQuestion,
        videoDescription,
        videoRequired,
        videoHidden,
        videoLoop,
        videoAutoplay,
        videoShowControls,
        videoSource,
        setVideoCaption,
        setVideoQuestion,
        setVideoDescription,
        contactQuestion,
        contactHelperText,
        contactFields,
        contactRequired,
        setContactQuestion,
        setContactHelperText,
        addressQuestion,
        addressHelperText,
        addressFields,
        addressRequired,
        setAddressQuestion,
        setAddressHelperText,
        workQuestion,
        workHelperText,
        workFields,
        workRequired,
        setWorkQuestion,
        setWorkHelperText,
        shortTextQuestion,
        shortTextHelperText,
        shortTextPlaceholder,
        shortTextMaxChars,
        shortTextMinChars,
        shortTextValidation,
        shortTextAlign,
        shortTextSize,
        shortTextRequired,
        shortTextHidden,
        shortTextResponseQualityEnabled,
        shortTextResponseQualityOptions,
        setShortTextQuestion,
        setShortTextHelperText,
        setShortTextPlaceholder,
        longTextQuestion,
        longTextHelperText,
        longTextPlaceholder,
        longTextMaxChars,
        longTextMinChars,
        longTextValidation,
        longTextAlign,
        longTextSize,
        longTextRequired,
        longTextHidden,
        responseQualityEnabled,
        responseQualityOptions,
        setLongTextQuestion,
        setLongTextHelperText,
        setLongTextPlaceholder,
        singleQuestion,
        singleHelperText,
        singleOptions,
        singleLayout,
        singleOptionHeight,
        singleRequired,
        singleAllowOther,
        singleRandomize,
        singleMultipleSelect,
        singleMinChoices,
        singleMaxChoices,
        singleShowKeyboardHints,
        setSingleQuestion,
        setSingleHelperText,
        multipleQuestion,
        multipleHelperText,
        multipleOptions,
        multipleLayout,
        multipleRequired,
        multipleAllowOther,
        multipleRandomize,
        multipleMultipleSelect,
        multipleMinChoices,
        multipleMaxChoices,
        multipleShowKeyboardHints,
        multipleOptionHeight,
        setMultipleQuestion,
        setMultipleHelperText,
        mediaQuestion,
        mediaHelperText,
        mediaOptions,
        mediaAllowMultiple,
        mediaRequired,
        mediaRandomiseOrder,
        mediaMinChoices,
        mediaMaxChoices,
        mediaLayout,
        mediaOptionHeight,
        setMediaQuestion,
        setMediaHelperText,
        captchaProvider,
        captchaSiteKey,
        captchaEnabled,
        captchaVisibility,
        multiImageQuestion,
        multiImageHelperText,
        multiImageMaxFiles,
        multiImageRequired,
        multiImageMultipleFiles,
        multiImageMaxFileSize,
        setMultiImageQuestion,
        setMultiImageHelperText,
        uploadQuestion,
        uploadHelperText,
        uploadMaxFileSize,
        setUploadQuestion,
        setUploadHelperText,
        ratingQuestion,
        ratingRequired,
        ratingUseScale,
        ratingUseSlider,
        ratingMaxRating,
        ratingStyle,
        ratingLowLabel,
        ratingHighLabel,
        ratingShowLabels,
        ratingIconSize,
        setRatingQuestion,
        setRatingLowLabel,
        setRatingHighLabel,
        dateQuestion,
        dateHelperText,
        dateRequired,
        setDateQuestion,
        setDateHelperText,
        timeQuestion,
        timeHelperText,
        timeRequired,
        timeUse12h,
        timeShowSeconds,
        timeMinTime,
        timeMaxTime,
        setTimeQuestion,
        setTimeHelperText,
        openSingleConfigPanel,
        openMultipleConfigPanel,
      }),
    [
      canvasConfigSnapshot,
      isEditingCtaCard,
      isEditingHeadingCard,
      openSingleConfigPanel,
      openMultipleConfigPanel,
    ],
  );

  /** Keep canvas visible when a content screen is selected (picker only replaces canvas for intro/end). */
  const showBlockPickerOnCanvas =
    showContentPanel && !isPreview && activeScreen?.type !== 'content';

  if (!builderHydrated) {
    return <FormBuilderLoadingFallback />;
  }

  if (isPublishView) {
    return (
      <FormPublishView
        formTitle={publishFormTitle}
        formId={activeFormId}
        publicUrl={publishedPublicUrl}
        showOnboardingStepper={showOnboardingStepper}
        fromOnboarding={fromOnboarding}
        onRetryPublish={handlePublishForm}
        onSaveAsDraft={() => setIsPublishView(false)}
      />
    );
  }

  const builderPanelBindings = {
    ACCORDION_SECTIONS,
    addContentScreen,
    CONFIGURE_TILE_BASE,
    CONFIGURE_TILE_GRID,
    CONTENT_SECTIONS,
    CTA_COLOR_PALETTE,
    ESSENTIALS,
    QUESTION_TEMPLATE_CATEGORIES,
    TABS,
    THEMES,
    toggleContentSection,
    toggleSection,
    activeScreen,
    activeScreenId,
    activeTab,
    activeThemeId,
    addressFields,
    addressHelperText,
    addressQuestion,
    addressRequired,
    addressSections,
    aiLogicGen,
    cancelIfThenLogicPanel,
    configureIsUpload,
    configureMaxFileSize,
    canvasScale,
    captchaBadgePosition,
    captchaBlockOnFailure,
    captchaEnabled,
    captchaProvider,
    captchaSecretKey,
    captchaSections,
    captchaShowBadge,
    captchaSiteKey,
    captchaVisibility,
    closeAllRightPanels,
    closeIfThenLogicPanel,
    contactFields,
    contactHelperText,
    contactQuestion,
    contactRequired,
    contactSections,
    contentDraggingId,
    contentDropTargetId,
    ctaBodySize,
    ctaBtnColor,
    ctaBtnColorGridOpen,
    ctaButtonLabel,
    ctaButtonSize,
    ctaButtonStyle,
    ctaColorGridOpen,
    ctaContentWidth,
    ctaCornerRadius,
    ctaDurationText,
    ctaFontWeight,
    ctaHeadingSize,
    ctaHeadingText,
    ctaHelperText,
    ctaLabelColor,
    ctaPadding,
    ctaSections,
    ctaShowIcon,
    ctaTextAlign,
    ctaTextColor,
    dateHelperText,
    dateQuestion,
    dateRequired,
    dateSections,
    descriptionAlignment,
    descriptionCharLimit,
    descriptionContent,
    descriptionFormatting,
    descriptionHidden,
    descriptionSections,
    descriptionShowCharCount,
    descriptionTextSize,
    designBackground,
    designCardColor,
    designCardColorGridOpen,
    designCardImage,
    designCardOpacity,
    designLayoutStyle,
    designTextColor,
    designTextColorGridOpen,
    designTypography,
    deviceView,
    draftButtonText,
    draftDescription,
    draftEndButtonText,
    draftEndDescription,
    draftEndTitle,
    draftFormTitle,
    draftLogo,
    draftTitle,
    endScreenButtonText,
    endScreenDescription,
    endScreenTitle,
    getLogicCardQuestionText,
    getLogicDestinationOptions,
    getLogicQuestionOptionsForForm,
    handleAddScreen,
    handleIntroEssentialSelect,
    handleSaveLongTextResponseQuality,
    handleSaveShortTextResponseQuality,
    handleSelectTheme,
    headingAlignment,
    headingAnswerText,
    headingFontWeight,
    headingHidden,
    headingLevel,
    headingRequired,
    headingSections,
    headingText,
    headingTextSize,
    hexToRgba,
    ifThenDraft,
    ifThenLogicPanelEdge,
    imageAlignment,
    imageAltText,
    imageCaption,
    imageCornerRadius,
    imageDescription,
    imageFileInputRef,
    imageFileName,
    imageHidden,
    imageLinkOnClick,
    imageLinkUrl,
    imageOpenInNewTab,
    imagePreview,
    imageQuestion,
    imageSections,
    imageWidth,
    introButtonText,
    introDescription,
    introEssential,
    introTitle,
    isEditingContent,
    isEditingCtaCard,
    isEditingEndScreen,
    isEditingFormTitle,
    isEditingHeadingCard,
    isFormDirty,
    isPreview,
    isPublishView,
    loadedFormTitle,
    logicCanvasPan,
    logicCanvasPanning,
    logicCanvasZoom,
    logicCardDragOffset,
    logicCardDraggingId,
    logicCardHeights,
    logicCardOffsets,
    logicConnectDrag,
    logicConnections,
    logicConnectorMenu,
    logicDisconnectHoveredKey,
    logicEdgeKindHoveredKey,
    logicElseByScreen,
    logicIfRulesByEdge,
    logicModeManual,
    logicQuestionOptionsTick,
    logoImage,
    longTextAlign,
    longTextHelperText,
    longTextHidden,
    longTextMaxChars,
    longTextMinChars,
    longTextPlaceholder,
    longTextQuestion,
    longTextRequired,
    longTextSections,
    longTextSize,
    longTextValidation,
    markFormTouched,
    mediaAllowMultiple,
    mediaHelperText,
    mediaLayout,
    mediaMaxChoices,
    mediaMinChoices,
    mediaOptionHeight,
    mediaOptions,
    mediaQuestion,
    mediaRandomiseOrder,
    mediaRequired,
    mediaSections,
    multiImageAcceptedTypes,
    multiImageHelperText,
    multiImageMaxFileSize,
    multiImageMaxFiles,
    multiImageMultipleFiles,
    multiImageQuestion,
    multiImageRequired,
    multiImageSections,
    multiImageShowPreview,
    multiImageSizeDropdownOpen,
    multiImageUploadZoneSize,
    multipleAllowOther,
    multipleHelperText,
    multipleLayout,
    multipleMaxChoices,
    multipleMinChoices,
    multipleMultipleSelect,
    multipleOptionHeight,
    multipleOptions,
    multipleQuestion,
    multipleRandomize,
    multipleRequired,
    multipleSections,
    multipleShowKeyboardHints,
    openContentSections,
    openPanelByName,
    pendingScreenDelete,
    previewSnapVersion,
    previewVisitStack,
    priorScreensForActive,
    publishModalOpen,
    ratingHighLabel,
    ratingIconSize,
    ratingLowLabel,
    ratingMaxRating,
    ratingQuestion,
    ratingRequired,
    ratingSections,
    ratingShowLabels,
    ratingStyle,
    ratingUseScale,
    ratingUseSlider,
    responseQualityEnabled,
    responseQualityOptions,
    saveIfThenLogic,
    screens,
    sections,
    selectedTemplate,
    setActiveScreenId,
    setActiveTab,
    setActiveThemeId,
    setAddressFields,
    setAddressHelperText,
    setAddressQuestion,
    setAddressRequired,
    setAddressSections,
    setAiLogicGen,
    setCanvasScale,
    setCaptchaBadgePosition,
    setCaptchaBlockOnFailure,
    setCaptchaEnabled,
    setCaptchaProvider,
    setCaptchaSecretKey,
    setCaptchaSections,
    setCaptchaShowBadge,
    setCaptchaSiteKey,
    setConfigureMaxFileSize,
    setCaptchaVisibility,
    setContactFields,
    setContactHelperText,
    setContactQuestion,
    setContactRequired,
    setContactSections,
    setContentDraggingId,
    setContentDropTargetId,
    setCtaBodySize,
    setCtaBtnColor,
    setCtaBtnColorGridOpen,
    setCtaButtonLabel,
    setCtaButtonSize,
    setCtaButtonStyle,
    setCtaColorGridOpen,
    setCtaContentWidth,
    setCtaCornerRadius,
    setCtaDurationText,
    setCtaFontWeight,
    setCtaHeadingSize,
    setCtaHeadingText,
    setCtaHelperText,
    setCtaLabelColor,
    setCtaPadding,
    setCtaSections,
    setCtaShowIcon,
    setCtaTextAlign,
    setCtaTextColor,
    setDateHelperText,
    setDateQuestion,
    setDateRequired,
    setDateSections,
    setDescriptionAlignment,
    setDescriptionCharLimit,
    setDescriptionContent,
    setDescriptionFormatting,
    setDescriptionHidden,
    setDescriptionSections,
    setDescriptionShowCharCount,
    setDescriptionTextSize,
    setDesignBackground,
    setDesignCardColor,
    setDesignCardColorGridOpen,
    setDesignTextColorGridOpen,
    setDesignCardImage,
    setDesignCardOpacity,
    setDesignLayoutStyle,
    setDesignTextColor,
    setDesignTypography,
    setDeviceView,
    setDraftButtonText,
    setDraftDescription,
    setDraftEndButtonText,
    setDraftEndDescription,
    setDraftEndTitle,
    setDraftFormTitle,
    setDraftLogo,
    setDraftTitle,
    setEndScreenButtonText,
    setEndScreenDescription,
    setEndScreenTitle,
    setHeadingAlignment,
    setHeadingAnswerText,
    setHeadingFontWeight,
    setHeadingHidden,
    setHeadingLevel,
    setHeadingRequired,
    setHeadingSections,
    setHeadingText,
    setHeadingTextSize,
    setIfThenDraft,
    setIfThenLogicPanelEdge,
    setImageAlignment,
    setImageAltText,
    setImageCaption,
    setImageCornerRadius,
    setImageDescription,
    setImageFileName,
    setImageHidden,
    setImageLinkOnClick,
    setImageLinkUrl,
    setImageOpenInNewTab,
    setImagePreview,
    setImageQuestion,
    setImageSections,
    setImageWidth,
    setIntroButtonText,
    setIntroDescription,
    setIntroEssential,
    setIntroTitle,
    setIsEditingContent,
    setIsEditingCtaCard,
    setIsEditingEndScreen,
    setIsEditingFormTitle,
    setIsEditingHeadingCard,
    setIsFormDirty,
    setIsPreview,
    setIsPublishView,
    setLoadedFormTitle,
    setLogicCanvasPan,
    setLogicCanvasPanning,
    setLogicCanvasZoom,
    setLogicCardDragOffset,
    setLogicCardDraggingId,
    setLogicCardHeights,
    setLogicCardOffsets,
    setLogicConnectDrag,
    setLogicConnections,
    setLogicConnectorMenu,
    setLogicDisconnectHoveredKey,
    setLogicEdgeKindHoveredKey,
    setLogicElseByScreen,
    setLogicIfRulesByEdge,
    setLogicModeManual,
    setLogicQuestionOptionsTick,
    setLogoImage,
    setLongTextAlign,
    setLongTextHelperText,
    setLongTextHidden,
    setLongTextMaxChars,
    setLongTextMinChars,
    setLongTextPlaceholder,
    setLongTextQuestion,
    setLongTextRequired,
    setLongTextSections,
    setLongTextSize,
    setLongTextValidation,
    setMediaAllowMultiple,
    setMediaHelperText,
    setMediaLayout,
    setMediaMaxChoices,
    setMediaMinChoices,
    setMediaOptionHeight,
    setMediaOptions,
    setMediaQuestion,
    setMediaRandomiseOrder,
    setMediaRequired,
    setMediaSections,
    setMultiImageAcceptedTypes,
    setMultiImageHelperText,
    setMultiImageMaxFileSize,
    setMultiImageMaxFiles,
    setMultiImageMultipleFiles,
    setMultiImageQuestion,
    setMultiImageRequired,
    setMultiImageSections,
    setMultiImageShowPreview,
    setMultiImageSizeDropdownOpen,
    setMultiImageUploadZoneSize,
    setMultipleAllowOther,
    setMultipleHelperText,
    setMultipleLayout,
    setMultipleMaxChoices,
    setMultipleMinChoices,
    setMultipleMultipleSelect,
    setMultipleOptionHeight,
    setMultipleOptions,
    setMultipleQuestion,
    setMultipleRandomize,
    setMultipleRequired,
    setMultipleSections,
    setMultipleShowKeyboardHints,
    setOpenContentSections,
    setPendingScreenDelete,
    setPreviewSnapVersion,
    setPreviewVisitStack,
    setPublishModalOpen,
    setRatingHighLabel,
    setRatingIconSize,
    setRatingLowLabel,
    setRatingMaxRating,
    setRatingQuestion,
    setRatingRequired,
    setRatingSections,
    setRatingShowLabels,
    setRatingStyle,
    setRatingUseScale,
    setRatingUseSlider,
    setResponseQualityEnabled,
    setResponseQualityOptions,
    setScreens,
    setSections,
    setSelectedTemplate,
    setSettingsAutoAdvance,
    setSettingsBackButton,
    setSettingsCompletionAction,
    setSettingsConfirmationEmail,
    setSettingsEmailCollection,
    setSettingsLanguage,
    setSettingsOneAtATime,
    setSettingsPasswordProtection,
    setSettingsResponseLimit,
    setSettingsResponseLimitCount,
    setSettingsResubmission,
    setSettingsSubmissionNotifications,
    setSettingsWebhook,
    setShortTextAlign,
    setShortTextHelperText,
    setShortTextHidden,
    setShortTextMaxChars,
    setShortTextMinChars,
    setShortTextPlaceholder,
    setShortTextQuestion,
    setShortTextRequired,
    setShortTextResponseQualityEnabled,
    setShortTextResponseQualityOptions,
    setShortTextSections,
    setShortTextSize,
    setShortTextValidation,
    setShowAddressConfigPanel,
    setShowCaptchaConfigPanel,
    setShowConfigPanel,
    setShowContactConfigPanel,
    setShowContentPanel,
    setShowCtaConfigPanel,
    setShowDateConfigPanel,
    setShowDescriptionConfigPanel,
    setShowDesignPanel,
    setShowHeadingConfigPanel,
    setShowIfConditions,
    setShowImageConfigPanel,
    setShowLongTextConfigPanel,
    setShowMediaConfigPanel,
    setShowMultiImageConfigPanel,
    setShowMultipleConfigPanel,
    setShowRatingConfigPanel,
    setShowShortTextConfigPanel,
    setShowSingleConfigPanel,
    setShowThemeOverlay,
    setShowTimeConfigPanel,
    setShowVideoConfigPanel,
    setShowWorkConfigPanel,
    setSingleAllowOther,
    setSingleHelperText,
    setSingleLayout,
    setSingleMaxChoices,
    setSingleMinChoices,
    setSingleMultipleSelect,
    setSingleOptionHeight,
    setSingleOptions,
    setSingleQuestion,
    setSingleRandomize,
    setSingleRequired,
    setSingleSections,
    setSingleShowKeyboardHints,
    setSubHeading,
    setTimeHelperText,
    setTimeMaxTime,
    setTimeMinTime,
    setTimeQuestion,
    setTimeRequired,
    setTimeSections,
    setTimeShowSeconds,
    setTimeUse12h,
    setUnsavedChangesPrompt,
    setUploadHelperText,
    setUploadMaxFileSize,
    setUploadQuestion,
    setVideoAspectRatio,
    setVideoAutoplay,
    setVideoCaption,
    setVideoCornerRadius,
    setVideoDescription,
    setVideoHidden,
    setVideoLoop,
    setVideoQuestion,
    setVideoRequired,
    setVideoSections,
    setVideoShowControls,
    setVideoSource,
    setVideoUrl,
    setVideoWidth,
    setWelcomeAlignment,
    setWelcomeHelperText,
    setWelcomeHidden,
    setWelcomeInputType,
    setWelcomeInputTypeOpen,
    setWelcomeMaxLength,
    setWelcomeMinLength,
    setWelcomePlaceholder,
    setWelcomeReadOnly,
    setWelcomeRequired,
    setWelcomeTextSize,
    setWorkFields,
    setWorkHelperText,
    setWorkQuestion,
    setWorkRequired,
    setWorkSections,
    settingsAutoAdvance,
    settingsBackButton,
    settingsCompletionAction,
    settingsConfirmationEmail,
    settingsEmailCollection,
    settingsLanguage,
    settingsOneAtATime,
    settingsPasswordProtection,
    settingsResponseLimit,
    settingsResponseLimitCount,
    settingsResubmission,
    settingsSubmissionNotifications,
    settingsWebhook,
    shortTextAlign,
    shortTextHelperText,
    shortTextHidden,
    shortTextMaxChars,
    shortTextMinChars,
    shortTextPlaceholder,
    shortTextQuestion,
    shortTextRequired,
    shortTextResponseQualityEnabled,
    shortTextResponseQualityOptions,
    shortTextSections,
    shortTextSize,
    shortTextValidation,
    showAddressConfigPanel,
    showCaptchaConfigPanel,
    showConfigPanel,
    showContactConfigPanel,
    showContentPanel,
    showCtaConfigPanel,
    showDateConfigPanel,
    showDescriptionConfigPanel,
    showDesignPanel,
    showHeadingConfigPanel,
    showIfConditions,
    showImageConfigPanel,
    showLongTextConfigPanel,
    showMediaConfigPanel,
    showMultiImageConfigPanel,
    showMultipleConfigPanel,
    showRatingConfigPanel,
    showShortTextConfigPanel,
    showSingleConfigPanel,
    showThemeOverlay,
    showTimeConfigPanel,
    showVideoConfigPanel,
    showWorkConfigPanel,
    singleAllowOther,
    singleHelperText,
    singleLayout,
    singleMaxChoices,
    singleMinChoices,
    singleMultipleSelect,
    singleOptionHeight,
    singleOptions,
    singleQuestion,
    singleRandomize,
    singleRequired,
    singleSections,
    singleShowKeyboardHints,
    subHeading,
    switchPanel,
    timeHelperText,
    timeMaxTime,
    timeMinTime,
    timeQuestion,
    timeRequired,
    timeSections,
    timeShowSeconds,
    timeUse12h,
    unsavedChangesPrompt,
    uploadHelperText,
    uploadMaxFileSize,
    uploadQuestion,
    videoAspectRatio,
    videoAutoplay,
    videoCaption,
    videoCornerRadius,
    videoDescription,
    videoHidden,
    videoLoop,
    videoQuestion,
    videoRequired,
    videoSections,
    videoShowControls,
    videoSource,
    videoUrl,
    videoWidth,
    welcomeAlignment,
    welcomeHelperText,
    welcomeHidden,
    welcomeInputType,
    welcomeInputTypeOpen,
    welcomeInputTypeRef,
    welcomeMaxLength,
    welcomeMinLength,
    welcomePlaceholder,
    welcomeReadOnly,
    welcomeRequired,
    welcomeTextSize,
    workFields,
    workHelperText,
    workQuestion,
    workRequired,
    workSections,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* ── Topbar ── */}
      {!isPreview && (
      <header className="h-[48px] shrink-0 bg-white border-b border-[#e4e2dc] flex items-center px-6 z-10 gap-4">
        <div className="flex items-center shrink-0">
          <img src={clearformLogo} alt="Clearform" className="h-[26px] w-auto object-contain" />
        </div>

        {showOnboardingStepper && (
          <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
            <StepBar activeStep={3} />
          </div>
        )}

        <div
          className={`flex items-center gap-3 shrink-0${showOnboardingStepper ? '' : ' ml-auto'}`}
        >
          {isApiConfigured() && activeFormId && builderSaveStatus !== 'idle' ? (
            <span className="text-[11px] font-medium text-[#6b6b68] whitespace-nowrap" aria-live="polite">
              {builderSaveStatus === 'saving' && 'Saving…'}
              {builderSaveStatus === 'saved' && 'All changes saved'}
              {builderSaveStatus === 'error' && 'Save delayed — still editing'}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleHeaderBack}
            className="px-[15px] py-[8px] bg-white border border-[#e4e2dc] rounded-[8px] text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] transition-colors cursor-pointer whitespace-nowrap"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={!canPublishForm(screens)}
            title={
              !canPublishForm(screens)
                ? getPublishBlockers(screens)[0]
                : undefined
            }
            className={`inline-flex items-center gap-[6px] px-[15px] py-[8px] border rounded-[8px] text-[12px] font-medium transition-colors whitespace-nowrap ${
              canPublishForm(screens)
                ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white hover:bg-[#2c2c2c] cursor-pointer'
                : 'bg-[#e8e8e6] border-[#e8e8e6] text-[#a8a8a4] cursor-not-allowed'
            }`}
          >
            Publish
            <RiArrowRightLine size={14} className="shrink-0" aria-hidden />
          </button>
        </div>
      </header>
      )}

      {/* ── Body: Sidebar + Screens Panel + Content + Config Panel ── */}
      <LayoutGroup>
      <div className="relative flex flex-1 overflow-hidden">
        {/* ── Screens panel (visible after first screen is added) ── */}
        {!isPreview && hasScreens && (
          <motion.div
            key="screens-panel"
            initial={skipPanelEnterRef.current ? false : { width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="shrink-0 self-stretch bg-[#f7f7f8] border-r border-[#e4e2dc] flex flex-col overflow-hidden min-h-0"
          >
            <div className="w-[200px] flex flex-1 flex-col min-h-0 overflow-hidden">
              {/* Add screen button - sticky at top */}
              <div className="px-[15px] pt-[16px] pb-[24px] shrink-0">
                <button
                  onClick={handleAddScreen}
                  className="w-full flex items-center gap-[4px] bg-[#272727] text-white text-[12px] font-normal px-[12px] py-[8px] rounded-[6px] justify-center cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                >
                  <RiAddLine size={12} className="shrink-0" />
                  Add screen
                </button>
              </div>

              {(() => {
                const LABEL_TO_PANEL = {
                  CTA: 'ctaConfig',
                  Heading: 'headingConfig',
                  Description: 'descriptionConfig',
                  Images: 'imageConfig',
                  Video: 'videoConfig',
                  Contact: 'contactConfig',
                  Address: 'addressConfig',
                  'Work Info': 'workConfig',
                  'Short text': 'shortTextConfig',
                  'Long text': 'longTextConfig',
                  Single: 'singleConfig',
                  Multiple: 'multipleConfig',
                  Media: 'mediaConfig',
                  Captcha: 'captchaConfig',
                  'Multi-image upload': 'multiImageConfig',
                  Upload: 'multiImageConfig',
                  Rating: 'ratingConfig',
                  Date: 'dateConfig',
                  Time: 'timeConfig',
                };
                const PANEL_OPEN_STATE = {
                  ctaConfig: showCtaConfigPanel,
                  headingConfig: showHeadingConfigPanel,
                  descriptionConfig: showDescriptionConfigPanel,
                  imageConfig: showImageConfigPanel,
                  videoConfig: showVideoConfigPanel,
                  contactConfig: showContactConfigPanel,
                  addressConfig: showAddressConfigPanel,
                  workConfig: showWorkConfigPanel,
                  shortTextConfig: showShortTextConfigPanel,
                  longTextConfig: showLongTextConfigPanel,
                  singleConfig: showSingleConfigPanel,
                  multipleConfig: showMultipleConfigPanel,
                  mediaConfig: showMediaConfigPanel,
                  captchaConfig: showCaptchaConfigPanel,
                  multiImageConfig: showMultiImageConfigPanel,
                  ratingConfig: showRatingConfigPanel,
                  dateConfig: showDateConfigPanel,
                  timeConfig: showTimeConfigPanel,
                  config: showConfigPanel,
                };

                const handleScreenRowClick = (screen) => {
                  if (activeTab === 'logic') {
                    setActiveScreenId(screen.id);
                    return;
                  }
                  const isSameCard = activeScreenId === screen.id;
                  setActiveScreenId(screen.id);
                  const targetPanel =
                    screen.type === 'intro'
                      ? 'config'
                      : screen.type === 'end'
                        ? null
                        : LABEL_TO_PANEL[screen.label] || null;
                  const isCurrentPanelOpen = targetPanel ? PANEL_OPEN_STATE[targetPanel] : false;
                  if (isSameCard && isCurrentPanelOpen) {
                    closeAllRightPanels();
                  } else if (showContentPanel) {
                    if (targetPanel) switchPanel(targetPanel, 'content');
                    else closeAllRightPanels();
                  } else {
                    closeAllRightPanels();
                    if (targetPanel) openPanelByName(targetPanel);
                  }
                };

                const hasContentScreens = contentScreens.length > 0;

                const renderStartRow = () =>
                  logicIntro ? (
                    <button
                      type="button"
                      onClick={() => handleScreenRowClick(logicIntro)}
                      className={`flex items-center gap-[8px] px-[14px] py-[9px] w-full text-left transition-colors cursor-pointer ${
                        activeScreenId === logicIntro.id ? 'bg-white/60' : 'hover:bg-white/40'
                      }`}
                    >
                      <div className="w-[30px] h-[30px] rounded-[8px] bg-[#dedcde] flex items-center justify-center shrink-0">
                        <PagesStartIcon size={14} className="text-[#3C323E] shrink-0" />
                      </div>
                      <span className={`${SCREEN_CARD_NAME_CLASS} w-full`}>{logicIntro.name}</span>
                    </button>
                  ) : null;

                const renderEndRow = () =>
                  logicEnd ? (
                    <button
                      type="button"
                      onClick={() => handleScreenRowClick(logicEnd)}
                      className={`flex items-center gap-[8px] px-[14px] py-[9px] w-full text-left transition-colors cursor-pointer ${
                        activeScreenId === logicEnd.id ? 'bg-white/60' : 'hover:bg-white/40'
                      }`}
                    >
                      <div className="w-[30px] h-[30px] rounded-[8px] bg-[#eef2ff] flex items-center justify-center shrink-0">
                        <PagesEndIcon size={14} className="text-[#3C323E] shrink-0" />
                      </div>
                      <span className={`${SCREEN_CARD_NAME_CLASS} w-full`}>{logicEnd.name}</span>
                    </button>
                  ) : null;

                return (
                  <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                    {/* No questions yet: start and end stacked together at the top */}
                    {!hasContentScreens ? (
                      <div className="shrink-0 flex flex-col bg-[#f7f7f8] border-b border-[#e4e2dc]/70">
                        {renderStartRow()}
                        {renderEndRow()}
                      </div>
                    ) : (
                      <div
                        ref={contentScreensScrollRef}
                        className="flex flex-1 min-h-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
                      >
                        {logicIntro && (
                          <div className="sticky top-0 z-10 shrink-0 border-b border-[#e4e2dc]/70 bg-[#f7f7f8]">
                            {renderStartRow()}
                          </div>
                        )}

                        <LayoutGroup id="content-screens-list">
                          <div className="flex flex-col shrink-0">
                            <AnimatePresence initial={false}>
                            {contentScreens.map((screen) => {
                            const isActive = activeScreenId === screen.id;

                            const contentIndex =
                              screens.filter((s) => s.type === 'content').findIndex((s) => s.id === screen.id) + 1;
                            const { Icon: ScreenIcon, bg: iconBg, color: iconColor } = SCREEN_ICON_MAP[
                              screen.label
                            ] ?? { Icon: RiFileTextLine, bg: 'bg-[#f4f4f4]', color: 'text-gray-500' };
                            const questionText = getBuilderScreenPreviewText(
                              screen,
                              fieldPreviewFallback,
                              activeScreenId,
                            );

                            const isDropTarget = contentDropTargetId === screen.id;
                            const isDraggingRow = contentDraggingId === screen.id;

                            return (
                              <motion.div
                                key={screen.id}
                                layout
                                initial={SIDEBAR_ROW_MOTION.initial}
                                animate={SIDEBAR_ROW_MOTION.animate}
                                exit={SIDEBAR_ROW_MOTION.exit}
                                data-content-screen-row
                                data-screen-id={screen.id}
                                transition={SIDEBAR_ROW_TRANSITION}
                                className={`relative px-[14px] py-[4px] ${isDraggingRow ? 'z-20' : 'z-0'}`}
                                onDragOver={(e) => handleContentRowDragOver(e, screen.id)}
                                onDrop={handleContentRowDrop}
                              >
                                {isDropTarget && !isDraggingRow && (
                                  <motion.div
                                    layoutId="screen-drop-indicator"
                                    className="pointer-events-none absolute left-[18px] right-[18px] top-[2px] h-[2px] rounded-full bg-[#4f46e5]"
                                    initial={{ opacity: 0, scaleX: 0.4 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    exit={{ opacity: 0, scaleX: 0.4 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                  />
                                )}
                                <motion.div
                                  layout="position"
                                  animate={{
                                    scale: isDraggingRow ? 1.02 : 1,
                                    opacity: isDraggingRow ? 0.45 : 1,
                                    boxShadow: isDraggingRow
                                      ? '0 10px 28px rgba(79, 70, 229, 0.12)'
                                      : '0 0 0 rgba(0,0,0,0)',
                                  }}
                                  transition={{
                                    scale: { type: 'spring', stiffness: 400, damping: 28 },
                                    opacity: { duration: 0.15 },
                                    boxShadow: { duration: 0.15 },
                                  }}
                                  className={`relative flex w-full items-center overflow-hidden h-[48px] ${
                                    isActive
                                      ? 'bg-[#eeeeec] rounded-tl-[8px] rounded-tr-[8px] rounded-br-[8px]'
                                      : `rounded-[8px] hover:bg-white/60${isDropTarget && !isDraggingRow ? ' bg-white/80 ring-1 ring-[#4f46e5]/35 ring-inset' : ''}`
                                  }${isActive && isDropTarget && !isDraggingRow ? ' ring-1 ring-[#4f46e5]/35 ring-inset' : ''}`}
                                >
                                  {isActive && (
                                    <div
                                      className="absolute left-0 top-[8px] bottom-[6px] w-[3px] bg-[#4f46e5] rounded-tr-[2px] rounded-br-[2px] pointer-events-none z-10"
                                      aria-hidden
                                    />
                                  )}

                                  <div
                                    draggable
                                    onDragStart={(e) => handleContentRowDragStart(e, screen.id)}
                                    onDragEnd={handleContentRowDragEnd}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex h-full w-[20px] shrink-0 cursor-grab active:cursor-grabbing items-center justify-center text-[#b8b6b0] hover:text-[#9c9a94] touch-none"
                                    title="Drag to reorder"
                                    aria-label={`Drag to reorder screen ${contentIndex}`}
                                  >
                                    <div
                                      className="h-[12.5px] w-[8px]"
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 2.5px)',
                                        gap: '2.75px',
                                      }}
                                    >
                                      {[...Array(6)].map((_, i) => (
                                        <div
                                          key={i}
                                          className="rounded-[1.25px] bg-current"
                                          style={{ width: '2.5px', height: '2.5px' }}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleScreenRowClick(screen)}
                                    type="button"
                                    className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden border-0 bg-transparent p-0 text-left cursor-pointer h-full"
                                  >
                                    <div className="w-[16px] shrink-0 flex flex-col items-end justify-center self-stretch pr-[2px]">
                                      <span className="text-[#b8b6b0] text-[10px] font-semibold leading-none text-right whitespace-nowrap">
                                        {contentIndex}
                                      </span>
                                    </div>

                                    <div className="h-[48px] w-[44px] shrink-0 flex flex-col items-start justify-center pl-[4px] pr-[8px] py-[8px]">
                                      <div
                                        className={`w-[32px] h-[32px] rounded-[7px] flex items-center justify-center shrink-0 ${iconBg}`}
                                      >
                                        <ScreenIcon size={16} className={iconColor} />
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col gap-[2px] items-start justify-center pr-[8px] py-[8px]">
                                      <span className={`${SCREEN_CARD_NAME_CLASS} w-full text-left`}>
                                        {screen.label}
                                      </span>
                                      <span className={`${SCREEN_CARD_PREVIEW_CLASS} w-full text-left`}>
                                        {questionText}
                                      </span>
                                    </div>
                                  </button>
                                </motion.div>
                              </motion.div>
                            );
                              })}
                            </AnimatePresence>
                          </div>
                        </LayoutGroup>

                        {logicEnd && (
                          <div className="sticky bottom-0 z-10 shrink-0 border-t border-[#e4e2dc]/70 bg-[#f7f7f8]">
                            {renderEndRow()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Hidden image file input (global for content screens) */}
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* ── Main content area ── */}
        <div
          className={`flex-1 flex flex-col overflow-hidden min-w-0 relative ${isPreview ? 'bg-[#f5f4f0]' : 'bg-white'}`}
        >
          {/* Tab bar */}
          {!isPreview && (
          <div className="bg-white border-b border-[rgba(226,232,240,0.8)] flex items-center justify-between gap-3 px-[7px] pr-4 h-[40px] shrink-0">
            <div className="flex items-center gap-[6px] h-full min-w-0 overflow-x-auto">
            {TABS.map((tab) => {
              const isDesignDisabled = tab.id === 'design' && designTabDisabled;
              const isLogicDisabled = tab.id === 'logic' && logicTabDisabled;
              const isTabDisabled = isDesignDisabled || isLogicDisabled;
              const disabledTitle =
                isDesignDisabled
                  ? 'Add a screen first to use Design'
                  : isLogicDisabled
                    ? hasScreens
                      ? 'Add a question between start and end to use Logic'
                      : 'Add a screen first to use Logic'
                    : undefined;
              return (
              <button
                key={tab.id}
                type="button"
                disabled={isTabDisabled}
                title={disabledTitle}
                onClick={() => {
                  if (isTabDisabled) return;
                  setActiveTab(tab.id);
                  if (tab.id === 'design') {
                    closeAllRightPanels();
                    setShowDesignPanel(true);
                  } else if (tab.id === 'settings' || tab.id === 'logic') {
                    closeAllRightPanels();
                    setShowDesignPanel(false);
                  } else {
                    setShowDesignPanel(false);
                  }
                }}
                className={`h-full flex items-center gap-2 px-4 text-[14px] transition-colors whitespace-nowrap ${
                  isTabDisabled
                    ? 'text-[#c4c2bc] cursor-not-allowed border-b-2 border-transparent'
                    : 'cursor-pointer'
                } ${
                  !isTabDisabled && tab.id === activeTab
                    ? 'border-b-2 border-black text-black font-normal'
                    : !isTabDisabled
                      ? 'text-[#8c8a84] font-medium hover:text-[#1a1a1a] border-b-2 border-transparent'
                      : ''
                }`}
              >
                <tab.icon size={16} className="shrink-0" />
                {tab.label}
              </button>
              );
            })}
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              <div
                className={`flex items-center gap-[6px] h-[25px] max-w-[min(280px,32vw)] px-3 border rounded-[6px] bg-white ${
                  isEditingFormTitle
                    ? 'border-[#17160e] ring-1 ring-[#17160e]/10'
                    : 'border-[rgba(0,0,0,0.1)]'
                }`}
              >
                <span
                  className="w-[10px] h-[10px] rounded-full shrink-0"
                  style={{ backgroundColor: formAccentColor }}
                  aria-hidden
                />
                {isEditingFormTitle ? (
                  <input
                    ref={formTitleInputRef}
                    type="text"
                    value={draftFormTitle}
                    onChange={(e) => setDraftFormTitle(e.target.value)}
                    onBlur={commitFormTitleEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitFormTitleEdit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelFormTitleEdit();
                      }
                    }}
                    className="min-w-0 flex-1 text-[12.5px] font-medium text-[#17160e] bg-transparent border-0 outline-none p-0"
                    aria-label="Form name"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={startFormTitleEdit}
                    className="min-w-0 flex-1 text-left text-[12.5px] font-medium text-[#17160e] truncate cursor-text hover:text-[#000000] focus:outline-none focus-visible:underline"
                    title="Click to rename form"
                  >
                    {publishFormTitle}
                  </button>
                )}
              </div>
            </div>
          </div>
          )}

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
          {activeTab === 'settings' ? (
            <motion.div
              key="settings-tab"
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              {...BUILDER_TAB_MOTION}
            >
            <FormBuilderSettingsPanel
              settingsAutoAdvance={settingsAutoAdvance}
              setSettingsAutoAdvance={setSettingsAutoAdvance}
              settingsBackButton={settingsBackButton}
              setSettingsBackButton={setSettingsBackButton}
              settingsResubmission={settingsResubmission}
              setSettingsResubmission={setSettingsResubmission}
              settingsConfirmationEmail={settingsConfirmationEmail}
              setSettingsConfirmationEmail={setSettingsConfirmationEmail}
              settingsResponseLimit={settingsResponseLimit}
              setSettingsResponseLimit={setSettingsResponseLimit}
              settingsResponseLimitCount={settingsResponseLimitCount}
              setSettingsResponseLimitCount={setSettingsResponseLimitCount}
              onDiscardDraft={restoreFromBuilderBaseline}
              activeFormId={activeFormId}
              formTitle={loadedFormTitle ?? location.state?.formTitle ?? 'Untitled Form'}
            />
            </motion.div>
          ) : !hasScreens ? (
            <motion.div
              key="content-empty-tab"
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              {...BUILDER_TAB_MOTION}
            >
            {/* Empty state */}
            <div
              className="flex-1 flex items-center justify-center overflow-hidden transition-colors duration-300"
              style={{ backgroundColor: isPreview ? '#f5f4f0' : builderTheme.canvasBackground }}
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-[16px] font-medium text-black">
                  Start by adding an intro screen
                </p>
                <button
                  onClick={handleAddScreen}
                  className="flex items-center gap-1 bg-[#272727] text-white text-[12px] font-normal px-3 py-2 rounded-[6px] w-[183px] justify-center cursor-pointer hover:bg-[#3a3a3a] transition-colors"
                >
                  <RiAddLine size={12} className="shrink-0" />
                  Add screen
                </button>
              </motion.div>
            </div>
            </motion.div>
          ) : activeTab === 'logic' ? (
            <motion.div
              key="logic-tab"
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              {...BUILDER_TAB_MOTION}
            >
            <div
              className="flex-1 flex flex-col min-h-0 bg-[#f2f2f0] overflow-hidden"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <div className="h-[40px] shrink-0 bg-white border-b border-[#e5e5e2] flex items-center gap-3 px-5">
                <span className="text-[11px] font-semibold tracking-[0.77px] uppercase text-[#a0a09c] shrink-0 pr-3 border-r border-[#e5e5e2]">
                  Logic mode
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectManualLogicMode}
                    className={`rounded-full border px-[13px] py-[5px] text-[12px] font-semibold transition-colors cursor-pointer ${
                      logicModeManual
                        ? 'bg-[#f4f4f2] border-[#d4d4d0] text-[#111110]'
                        : 'border-transparent text-[#6b6b68] hover:bg-[#ececea]'
                    }`}
                  >
                    Manual Logic
                  </button>
                  <button
                    type="button"
                    onClick={selectAiDrivenLogicMode}
                    className={`flex items-center gap-2 rounded-full border px-[12px] py-[4px] text-[12px] font-semibold transition-colors cursor-pointer ${
                      !logicModeManual
                        ? 'bg-[#f4f4f2] border-[#d4d4d0] text-[#111110]'
                        : 'border-transparent text-[#6b6b68] hover:bg-[#ececea]'
                    }`}
                  >
                    <span>AI-Driven Logic</span>
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.57px] text-white bg-[#6b6b68] rounded-full px-[6px] py-[1.5px] leading-none">
                      PRO
                    </span>
                  </button>
                </div>
              </div>
              {!logicModeManual ? (
                <>
                  {aiLogicGenerationFailed ? (
                    <AiLogicGenerationFailedBanner message={aiLogicGen.errorMessage} />
                  ) : null}
                  <AiLogicIdleBanner
                    onGenerate={handleGenerateAiLogic}
                    disabled={aiLogicGenerating}
                  />
                  {aiLogicReady ? (
                    <div className="shrink-0 border-b border-[#e5e5e2] bg-[#f0fdf4] px-5 py-2">
                      <p className="text-[12px] font-medium text-[#166534]">
                        AI logic applied — edit on the canvas below or switch to Manual Logic anytime.
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
              {!showLogicCanvas ? (
                aiLogicGenerationFailed && logicModeManual ? (
                  <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                    <div
                      className={LOGIC_CANVAS_VIEWPORT_CLASS}
                      style={LOGIC_CANVAS_DOT_GRID_STYLE}
                    >
                      <LogicCanvasActionsPanel
                        onAddIntegration={openLogicCanvasIntegrations}
                        onAddWebhook={openLogicCanvasWebhook}
                      />
                      <div className="flex h-full min-h-0 items-center justify-center overflow-auto px-5 py-5">
                        <AiLogicGenerationFailedPanel
                          onRetry={handleAiLogicRetry}
                          onSwitchToManual={selectManualLogicMode}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                    <div
                      className={LOGIC_CANVAS_VIEWPORT_CLASS}
                      style={LOGIC_CANVAS_DOT_GRID_STYLE}
                    >
                      <LogicCanvasActionsPanel
                        onAddIntegration={openLogicCanvasIntegrations}
                        onAddWebhook={openLogicCanvasWebhook}
                      />
                      <div className="flex h-full min-h-0 items-center justify-center overflow-auto px-5 py-5">
                        {aiLogicGenerating ? (
                          <p className="text-[14px] text-[#6b6b68] text-center max-w-md leading-relaxed">
                            Generating AI logic from your form…
                          </p>
                        ) : aiLogicGenerationFailed && !logicModeManual ? (
                          <AiLogicGenerationFailedPanel
                            onRetry={handleAiLogicRetry}
                            onSwitchToManual={selectManualLogicMode}
                          />
                        ) : (
                          <AiLogicEmptyPanel />
                        )}
                      </div>
                    </div>
                  </div>
                )
              ) : contentScreens.length === 0 || logicFlowNodes.length === 0 ? (
                <div className="flex-1 overflow-auto min-h-0 flex items-start justify-center p-8">
                  {contentScreens.length === 0 ? (
                    <p className="text-[14px] text-[#6b6b68] mt-16 text-center max-w-md leading-relaxed">
                      Add at least one question between the start and end screens from the Content tab to open the logic
                      canvas.
                    </p>
                  ) : (
                    <p className="text-[14px] text-[#6b6b68] mt-16 text-center max-w-md leading-relaxed">
                      No screens to show yet.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
                  <div
                    ref={logicViewportRef}
                    className={`${LOGIC_CANVAS_VIEWPORT_CLASS} touch-none select-none flex-1 min-h-0`}
                    style={LOGIC_CANVAS_DOT_GRID_STYLE}
                  >
                  <LogicCanvasActionsPanel
                    onAddIntegration={openLogicCanvasIntegrations}
                    onAddWebhook={openLogicCanvasWebhook}
                  />
                  {logicConnectorMenu ? (
                    <div
                      className="absolute z-[50] w-[125px] rounded-[10px] border border-[#e2e0dc] bg-white py-0.5 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
                      style={{ left: logicConnectorMenu.vx, top: logicConnectorMenu.vy }}
                      role="menu"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      {(() => {
                        const menuFromScreen = screens.find(
                          (s) => s.id === logicConnectorMenu.fromId
                        );
                        const showIfLogicOption = screenSupportsIfThenLogic(menuFromScreen);
                        return logicConnectorMenu.mode === 'chooseEdgeKind' ? (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() =>
                              applyChosenEdgeKind(
                                logicConnectorMenu.fromId,
                                logicConnectorMenu.toId,
                                LOGIC_EDGE_KIND.next
                              )
                            }
                          >
                            <RiArrowRightLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            Next
                          </button>
                          {showIfLogicOption ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() =>
                              applyChosenEdgeKind(
                                logicConnectorMenu.fromId,
                                logicConnectorMenu.toId,
                                LOGIC_EDGE_KIND.if
                              )
                            }
                          >
                            <RiGitBranchLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            If logic
                          </button>
                          ) : null}
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() =>
                              applyChosenEdgeKind(
                                logicConnectorMenu.fromId,
                                logicConnectorMenu.toId,
                                LOGIC_EDGE_KIND.skip
                              )
                            }
                          >
                            <RiSkipForwardLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            Skip
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() =>
                              applyChosenEdgeKind(
                                logicConnectorMenu.fromId,
                                logicConnectorMenu.toId,
                                LOGIC_EDGE_KIND.end
                              )
                            }
                          >
                            <RiStopCircleLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            End
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() => handleLogicMenuConnectNext(logicConnectorMenu.fromId)}
                          >
                            <RiArrowRightLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            Next
                          </button>
                          {showIfLogicOption ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() => startLogicDocumentConnect(logicConnectorMenu.fromId, LOGIC_EDGE_KIND.if)}
                          >
                            <RiGitBranchLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            If logic
                          </button>
                          ) : null}
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() => handleLogicMenuSkip(logicConnectorMenu.fromId)}
                          >
                            <RiSkipForwardLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            Skip
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-[12px] font-medium text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer transition-colors"
                            onClick={() => handleLogicMenuConnectEnd(logicConnectorMenu.fromId)}
                          >
                            <RiStopCircleLine className="shrink-0 text-[#3c323e]" size={15} aria-hidden />
                            End
                          </button>
                        </>
                      );
                      })()}
                    </div>
                  ) : null}
                  <div
                    className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-0.5 rounded-lg border border-[#d4d4d0] bg-white/95 px-1 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-sm"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <button
                      type="button"
                      onClick={() => nudgeLogicZoom(1 / 1.15)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[#1a1a1a] hover:bg-[#f0eeea] cursor-pointer transition-colors"
                      aria-label="Zoom out"
                    >
                      <RiSubtractLine size={16} />
                    </button>
                    <span className="min-w-[3rem] text-center text-[11px] tabular-nums text-[#4a4a48]">
                      {Math.round(logicCanvasZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => nudgeLogicZoom(1.15)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-[#1a1a1a] hover:bg-[#f0eeea] cursor-pointer transition-colors"
                      aria-label="Zoom in"
                    >
                      <RiAddLine size={16} />
                    </button>
                    <div className="mx-0.5 h-5 w-px bg-[#e4e2dc]" aria-hidden />
                    <button
                      type="button"
                      onClick={fitLogicCanvasView}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#1a1a1a] rounded-md hover:bg-[#f0eeea] cursor-pointer transition-colors whitespace-nowrap"
                    >
                      Fit view
                    </button>
                  </div>
                  <div
                    className={`absolute inset-0 z-10 ${logicCanvasPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={onLogicPanSurfacePointerDown}
                    onPointerMove={onLogicPanSurfacePointerMove}
                    onPointerUp={onLogicPanSurfacePointerUp}
                    onPointerCancel={onLogicPanSurfacePointerUp}
                  >
                    <div
                      style={{
                        transform: `translate(${logicCanvasPan.x}px, ${logicCanvasPan.y}px) scale(${logicCanvasZoom})`,
                        transformOrigin: '0 0',
                      }}
                      className="w-max"
                    >
                      <div
                        ref={logicBoardMeasureRef}
                        className="relative px-8 py-10 shrink-0"
                        style={{ width: logicBoardSize.width, height: logicBoardSize.height }}
                      >
                        <svg
                          className="absolute left-0 top-0 z-[1] overflow-visible"
                          style={{ pointerEvents: 'none' }}
                          width={logicBoardSize.width}
                          height={logicBoardSize.height}
                        >
                          <defs>
                            <marker
                              id="logicFlowArrowHead"
                              markerUnits="userSpaceOnUse"
                              markerWidth="7"
                              markerHeight="7"
                              refX="7"
                              refY="3.5"
                              orient="auto"
                            >
                              <path d="M0 0 L7 3.5 L0 7 Z" fill={LOGIC_EDGE_STROKE_STRONG} />
                            </marker>
                            <marker
                              id="logicFlowArrowHeadRed"
                              markerUnits="userSpaceOnUse"
                              markerWidth="7"
                              markerHeight="7"
                              refX="7"
                              refY="3.5"
                              orient="auto"
                            >
                              <path d="M0 0 L7 3.5 L0 7 Z" fill={LOGIC_EDGE_HOVER_STROKE} />
                            </marker>
                            <marker
                              id="logicFlowArrowHeadMuted"
                              markerUnits="userSpaceOnUse"
                              markerWidth="7"
                              markerHeight="7"
                              refX="7"
                              refY="3.5"
                              orient="auto"
                            >
                              <path d="M0 0 L7 3.5 L0 7 Z" fill={LOGIC_EDGE_STROKE} />
                            </marker>
                            <marker
                              id="logicFlowArrowHeadGreen"
                              markerUnits="userSpaceOnUse"
                              markerWidth="7"
                              markerHeight="7"
                              refX="7"
                              refY="3.5"
                              orient="auto"
                            >
                              <path d="M0 0 L7 3.5 L0 7 Z" fill={LOGIC_EDGE_KIND_HOVER_STROKE} />
                            </marker>
                          </defs>
                          {logicConnectionsDrawOrder.map((c) => {
                            const a = logicPortPositions.get(c.from);
                            const b = logicPortPositions.get(c.to);
                            if (!a || !b || a.outX == null || b.inX == null) return null;
                            const { x0, y0, x1, y1, prefixWaypoints, suffixWaypoints } =
                              logicConnectionEndpoints(
                                c,
                                logicConnByFrom,
                                logicConnByTo,
                                a,
                                b
                              );
                            const edgeObstacles = logicObstacles.filter(
                              (o) => o.id !== c.from && o.id !== c.to
                            );
                            const stubbed = applyLogicPortStubs(x0, y0, x1, y1);
                            const pathMeta = buildLogicConnectionPath(
                              stubbed.x0,
                              stubbed.y0,
                              stubbed.x1,
                              stubbed.y1,
                              edgeObstacles,
                              {
                              prefixWaypoints,
                              suffixWaypoints,
                            });
                            const edgeKey = `${c.from}-${c.to}`;
                            return (
                              <LogicEdgePathGroup
                                key={`edge-${c.from}-${c.to}-${c.kind ?? 'flow'}`}
                                d={pathMeta.d}
                                edgeKey={edgeKey}
                                kind={c.kind}
                                connection={c}
                                disconnectHoveredKey={logicDisconnectHoveredKey}
                                kindHoveredKey={logicEdgeKindHoveredKey}
                                onKindEnter={setLogicEdgeKindHoveredKey}
                                onKindLeave={() => setLogicEdgeKindHoveredKey(null)}
                                onEdgeClick={openLogicOptionsForEdge}
                              />
                            );
                          })}
                          {logicConnectDrag &&
                            (() => {
                              const a = logicPortPositions.get(logicConnectDrag.fromId);
                              if (!a || a.outX == null) return null;
                              const dragObstacles = logicObstacles.filter(
                                (o) => o.id !== logicConnectDrag.fromId
                              );
                              const outY = a.outY ?? a.portY;
                              const pathMeta = buildLogicConnectionSegment(
                                a.outX,
                                outY,
                                logicConnectDrag.x1,
                                logicConnectDrag.y1,
                                dragObstacles
                              );
                              const strokeProps = getLogicConnectDragPathProps(logicConnectDrag.kind);
                              return <path d={pathMeta.d} {...strokeProps} opacity={0.88} />;
                            })()}
                        </svg>
                        <svg
                          className="absolute left-0 top-0 z-[8] overflow-visible"
                          style={{ pointerEvents: 'none' }}
                          width={logicBoardSize.width}
                          height={logicBoardSize.height}
                        >
                          {logicConnectionsForRender.map((c, i) => {
                            const a = logicPortPositions.get(c.from);
                            const b = logicPortPositions.get(c.to);
                            if (!a || !b || a.outX == null || b.inX == null) return null;
                            const { x0, y0, x1, y1, prefixWaypoints, suffixWaypoints } =
                              logicConnectionEndpoints(
                                c,
                                logicConnByFrom,
                                logicConnByTo,
                                a,
                                b
                              );
                            const edgeObstacles = logicObstacles.filter(
                              (o) => o.id !== c.from && o.id !== c.to
                            );
                            const stubbed = applyLogicPortStubs(x0, y0, x1, y1);
                            const pathMeta = buildLogicConnectionPath(
                              stubbed.x0,
                              stubbed.y0,
                              stubbed.x1,
                              stubbed.y1,
                              edgeObstacles,
                              {
                              prefixWaypoints,
                              suffixWaypoints,
                            });
                            const edgeKey = `${c.from}-${c.to}`;
                            return (
                              <LogicEdgePathGroup
                                key={`${c.from}-${c.to}-${c.kind ?? 'flow'}-${i}-hit`}
                                d={pathMeta.d}
                                edgeKey={edgeKey}
                                kind={c.kind}
                                connection={c}
                                disconnectHoveredKey={logicDisconnectHoveredKey}
                                kindHoveredKey={logicEdgeKindHoveredKey}
                                onKindEnter={setLogicEdgeKindHoveredKey}
                                onKindLeave={() => setLogicEdgeKindHoveredKey(null)}
                                onEdgeClick={openLogicOptionsForEdge}
                                hitsOnly
                              />
                            );
                          })}
                        </svg>
                        {logicConnectionsForRender.map((c, i) => {
                          const a = logicPortPositions.get(c.from);
                          const b = logicPortPositions.get(c.to);
                          if (!a || !b || a.outX == null || b.inX == null) return null;
                          const { x0, y0, x1, y1, prefixWaypoints, suffixWaypoints } =
                            logicConnectionEndpoints(
                              c,
                              logicConnByFrom,
                              logicConnByTo,
                              a,
                              b
                            );
                          const edgeObstacles = logicObstacles.filter(
                            (o) => o.id !== c.from && o.id !== c.to
                          );
                          const pathMeta = buildLogicConnectionPath(x0, y0, x1, y1, edgeObstacles, {
                            prefixWaypoints,
                            suffixWaypoints,
                          });
                          const mid = logicConnectionPathMidpoint(pathMeta);
                          const lineDisconnect = logicConnectionPathPointAt(pathMeta, 0.38);
                          const edgeKey = `${c.from}-${c.to}`;
                          const hasKind = c.kind != null;
                          const meta = hasKind ? logicEdgeKindControlMeta(c.kind) : null;
                          const disconnectHoverHandlers = {
                            onPointerEnter: () => {
                              setLogicEdgeKindHoveredKey(null);
                              setLogicDisconnectHoveredKey(edgeKey);
                            },
                            onPointerLeave: () => setLogicDisconnectHoveredKey(null),
                          };
                          if (!hasKind) {
                            return (
                              <LogicEdgeLineDisconnectButton
                                key={`logic-edge-controls-${c.from}-${c.to}-${c.kind ?? 'flow'}-${i}`}
                                x={mid.x}
                                y={mid.y}
                                onDisconnect={() => removeLogicConnection(c.from, c.to)}
                                {...disconnectHoverHandlers}
                              />
                            );
                          }

                          return (
                            <Fragment key={`logic-edge-controls-${c.from}-${c.to}-${i}`}>
                              <LogicEdgeLineDisconnectButton
                                x={lineDisconnect.x}
                                y={lineDisconnect.y}
                                onDisconnect={() => removeLogicConnection(c.from, c.to)}
                                {...disconnectHoverHandlers}
                              />
                              <LogicEdgeControlPill
                                pillX={mid.x}
                                pillY={mid.y}
                                meta={meta}
                                showClearLogic={c.kind === LOGIC_EDGE_KIND.if}
                                onClearLogic={() => clearLogicForConnection(c.from, c.to)}
                                onPillClick={
                                  c.kind === LOGIC_EDGE_KIND.if
                                    ? () => openIfThenLogicPanel(c.from, { to: c.to })
                                    : undefined
                                }
                              />
                            </Fragment>
                          );
                        })}
                        {logicFlowNodes.map((node, i) => renderLogicFlowCard(node, i))}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab === 'design' ? 'design-tab' : 'content-tab'}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
              {...BUILDER_TAB_MOTION}
            >
            {/* Scaled preview canvas */}
            <div
              ref={canvasContainerRef}
              className="flex-1 overflow-hidden relative flex items-center justify-center transition-colors duration-300 p-10 min-h-0"
              style={{ backgroundColor: isPreview ? '#f5f4f0' : builderTheme.canvasBackground }}
            >
              {/* Scaled form frame — page indicator + card + powered-by (Figma 2521:8332) */}
              <div
                className="flex flex-col shrink-0 origin-center"
                style={{
                  width: CANVAS_BASE_W,
                  height: CANVAS_BASE_H,
                  transform: `scale(${canvasScale})`,
                  transformOrigin: 'center center',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: TYPOGRAPHY_FONTS[designTypography] ?? TYPOGRAPHY_FONTS.default,
                }}
              >
              {hasScreens && (
                isPreview ? (
                  <PreviewPageIndicator current={activeScreenIdx + 1} total={screens.length} />
                ) : (
                  <motion.div
                    layout
                    aria-hidden
                    className="shrink-0 w-full"
                    style={{ height: PREVIEW_PAGE_INDICATOR_H }}
                  />
                )
              )}
              <motion.div layout className="flex-1 min-h-0 flex flex-col w-full">
              <AnimatePresence mode="wait">
                {showBlockPickerOnCanvas ? (
                  /* ── Empty state while user selects a content block ── */
                  <motion.div
                    key="content-panel-empty"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="h-full flex items-center justify-center p-6"
                  >
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#f4f3ef] flex items-center justify-center">
                        <RiAddLine size={18} className="text-[#9a9a92]" />
                      </div>
                      <p
                        className="text-[14px] font-medium text-[#1a1a1a]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Select a block to add
                      </p>
                      <p
                        className="text-[12px] text-[#7a7a72] max-w-[220px] leading-normal"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Choose a content block from the panel on the right to add a new screen.
                      </p>
                    </div>
                  </motion.div>
                ) : activeScreen?.type === 'intro' ? (
                      introEssential ? (
                        /* ── Essential selected: show matching ContentCard ── */
                        <motion.div
                          key={`intro-essential-${introEssential}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className={`h-full min-h-0 flex flex-col ${deviceView === 'mobile' ? 'p-3' : 'p-5'}`}
                        >
                          <div className="w-full flex-1 min-h-0 flex flex-col">
                            <ContentCard
                              block={ESSENTIAL_TO_BLOCK[introEssential]}
                              blockNum={1}
                              isIntroScreen
                              onDelete={() =>
                                requestDeleteScreen({
                                  kind: 'intro',
                                  screenLabel: getScreenDeleteLabel(activeScreen),
                                })
                              }
                              fullCanvas={builderTheme.fullCanvas}
                              cardColor={builderTheme.cardColor}
                              cardImage={builderTheme.cardImage}
                              accentColor={builderTheme.accentColor}
                              textColor={builderTheme.textColor}
                              {...canvasFieldConfigs}
                              imageFileInputRef={imageFileInputRef}
                              onConfigure={handleConfigureFromCanvas}
                              isPreviewMode={isPreview}
                            onPreviewAdvance={goPreviewNext}
                            previewStepNav={previewStepNavEl}
                            previewScreenValidatorRef={previewScreenValidatorRef}
                            onPreviewSnapChange={handlePreviewSnapChange}
                            previewScreenId={activeScreen.id}
                            responseQualityFormId={activeFormId}
                          />
                        </div>
                      </motion.div>
) : (
                        /* ── Default welcome card ── */
                        <motion.div
                          key="intro-screen"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className={`h-full flex flex-col ${deviceView === 'mobile' ? 'p-3' : 'p-5'}`}
                        >
                          {/* Hidden logo file input */}
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                          <motion.div
                            layout
                            className={`flex-1 flex flex-col w-full overflow-hidden ${designLayoutStyle === 'fullCanvas' ? '' : 'rounded-[20px]'}`}
                            style={designLayoutStyle === 'fullCanvas' ? {} : {
                              ...(designCardImage
                                ? { backgroundImage: `url(${designCardImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                : { background: hexToRgba(designCardColor, designCardOpacity) }),
                              boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)',
                              border: '1px solid rgba(0,0,0,0.07)',
                            }}
                          >
                            {/* Card body */}
                            <div className={`flex-1 flex flex-col ${welcomeItemsAlignClass} justify-center gap-4 ${deviceView === 'mobile' ? 'px-[32px] py-[28px]' : 'px-[52px] py-[44px]'}`}>
                              {/* Logo upload */}
                              <button
                                onClick={() => !isPreview && isEditingContent && logoInputRef.current?.click()}
                                title={!isPreview && isEditingContent ? 'Click to upload logo' : ''}
                                className={`${deviceView === 'mobile' ? 'w-[50px] h-[50px]' : 'w-[42px] h-[42px]'} rounded-[10px] flex items-center justify-center shrink-0 transition-colors overflow-hidden ${
                                  !isPreview && isEditingContent ? 'cursor-pointer hover:bg-[#2c2c2c]' : 'cursor-default'
                                } ${!draftLogo && !logoImage ? 'bg-[#18181a]' : ''}`}
                                style={(isEditingContent ? draftLogo : logoImage) ? { padding: 0 } : {}}
                              >
                                {(isEditingContent ? draftLogo : logoImage) ? (
                                  <img src={isEditingContent ? draftLogo : logoImage} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                  <RiAddLine size={deviceView === 'mobile' ? 24 : 20} className="text-white" />
                                )}
                              </button>

                              {isEditingContent ? (
                                <input
                                  type="text"
                                  value={draftTitle}
                                  onChange={(e) => setDraftTitle(e.target.value)}
                                  className={`text-[#18181a] font-bold bg-transparent border-b border-[#c8c6c0] outline-none w-full max-w-[320px] pb-[2px] focus:border-[#18181a] transition-colors ${welcomeTextAlignClass}`}
                                  style={{ fontSize: welcomeSize.title, lineHeight: welcomeSize.titleLeading }}
                                  placeholder="Title"
                                />
                              ) : (
                                <p
                                  className={`text-[#18181a] font-bold ${welcomeTextAlignClass}`}
                                  style={{ fontSize: welcomeSize.title, lineHeight: welcomeSize.titleLeading }}
                                >
                                  {introTitle}
                                </p>
                              )}

                              {isEditingContent ? (
                                <textarea
                                  value={draftDescription}
                                  onChange={(e) => setDraftDescription(e.target.value)}
                                  rows={2}
                                  className={`text-[#8c8a84] font-normal bg-transparent border-b border-[#c8c6c0] outline-none w-full max-w-[360px] resize-none pb-[2px] focus:border-[#18181a] transition-colors leading-normal ${welcomeTextAlignClass}`}
                                  style={{ fontSize: welcomeSize.desc }}
                                  placeholder="Add the purpose of form here"
                                />
                              ) : (
                                <p
                                  className={`text-[#8c8a84] font-normal ${welcomeTextAlignClass}`}
                                  style={{ fontSize: welcomeSize.desc }}
                                >
                                  {introDescription}
                                </p>
                              )}

                              {isEditingContent ? (
                                <div className={`flex items-center gap-2 w-full ${welcomeJustifyClass} ${deviceView === 'mobile' ? 'max-w-[320px]' : 'max-w-[280px]'}`}>
                                  <input
                                    type="text"
                                    value={draftButtonText}
                                    onChange={(e) => setDraftButtonText(e.target.value)}
                                    className={`bg-[#18181a] text-white ${deviceView === 'mobile' ? 'text-[16px] px-[28px] py-[12px]' : 'text-[14px] px-[24px] py-[10px]'} font-bold rounded-[8px] outline-none text-center w-full opacity-80`}
                                    placeholder="Button label"
                                  />
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={isPreview ? goPreviewNext : undefined}
                                  className={`bg-[#18181a] text-white ${deviceView === 'mobile' ? 'text-[16px] px-[40px] py-[13px]' : 'text-[14px] px-[36px] py-[11px]'} font-bold rounded-[8px] cursor-pointer hover:bg-[#2c2c2c] transition-colors whitespace-nowrap`}
                                >
                                  {introButtonText}
                                </button>
                              )}
                            </div>

                            {/* Card footer */}
                            {!isPreview && (
                            <div className="border-t border-[rgba(0,0,0,0.1)] flex items-center gap-2 px-[20px] py-[10px] shrink-0">
                              <button
                                onClick={() =>
                                  requestDeleteScreen({
                                    kind: 'intro',
                                    screenLabel: getScreenDeleteLabel(activeScreen),
                                  })
                                }
                                className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,245,245,0.7)] border border-[rgba(200,50,50,0.2)] text-[#d63030] text-[12px] font-normal cursor-pointer hover:bg-[rgba(255,235,235,0.9)] transition-colors whitespace-nowrap"
                              >
                                <RiDeleteBin6Line size={12} className="shrink-0" />
                                Delete
                              </button>
                              {!isEditingContent && (
                                <button
                                  onClick={handleEditContent}
                                  className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] font-normal cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
                                >
                                  <RiPencilLine size={12} className="shrink-0" />
                                  Edit content
                                </button>
                              )}
                              {isEditingContent && <div className="flex-1" />}
                              {isEditingContent && (
                                <button
                                  type="button"
                                  onClick={handleSaveIntroEdit}
                                  className="flex items-center gap-[5px] px-[16px] py-[8px] rounded-[8px] bg-[#111] text-white text-[12px] font-medium cursor-pointer hover:bg-[#2c2c2c] transition-colors whitespace-nowrap"
                                >
                                  <RiCheckLine size={11} className="shrink-0" />
                                  Save
                                </button>
                              )}
                            </div>
                            )}
                          </motion.div>
                        </motion.div>
                      )
                    ) : activeScreen?.type === 'content' ? (
                      /* ── Content screen card ── */
                      <motion.div
                        key={`content-${activeScreen.id}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`h-full min-h-0 flex flex-col ${deviceView === 'mobile' ? 'p-3' : 'p-5'}`}
                      >
                        <div className="w-full flex-1 min-h-0 flex flex-col">
                          <ContentCard
                            block={activeScreen}
                            blockNum={contentBlockNum}
                            onDelete={() =>
                              requestDeleteScreen({
                                kind: 'content',
                                screenId: activeScreen.id,
                                screenLabel: getScreenDeleteLabel(activeScreen),
                              })
                            }
                            fullCanvas={builderTheme.fullCanvas}
                            cardColor={builderTheme.cardColor}
                            cardImage={builderTheme.cardImage}
                            accentColor={builderTheme.accentColor}
                            textColor={builderTheme.textColor}
                            {...canvasFieldConfigs}
                            imageFileInputRef={imageFileInputRef}
                            onConfigure={handleConfigureFromCanvas}
                            isPreviewMode={isPreview}
                            onPreviewAdvance={goPreviewNext}
                            previewStepNav={previewStepNavEl}
                            previewScreenValidatorRef={previewScreenValidatorRef}
                            onPreviewSnapChange={handlePreviewSnapChange}
                            previewScreenId={activeScreen.id}
                            responseQualityFormId={activeFormId}
                          />
                        </div>
                      </motion.div>
                ) : activeScreen?.type === 'end' ? (
                      /* ── End screen card ── */
                      <motion.div
                        key="end-screen"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`h-full flex flex-col ${deviceView === 'mobile' ? 'p-3' : 'p-5'}`}
                      >
                        <motion.div
                          layout
                          className={`flex-1 flex flex-col w-full overflow-hidden ${designLayoutStyle === 'fullCanvas' ? '' : 'rounded-[20px]'}`}
                          style={designLayoutStyle === 'fullCanvas' ? {} : {
                            background: hexToRgba(designCardColor, designCardOpacity),
                            boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 8px 32px 0px rgba(0,0,0,0.07)',
                            border: '1px solid rgba(0,0,0,0.07)',
                          }}
                        >
                          {/* Card body */}
                          <div className={`flex-1 flex flex-col items-center justify-center gap-4 ${deviceView === 'mobile' ? 'px-[32px] py-[28px]' : 'px-[52px] py-[44px]'}`}>
                            {/* Green checkmark badge */}
                            <div className="w-[36px] h-[36px] rounded-[10px] bg-[#1a9e4a] flex items-center justify-center shrink-0">
                              <RiCheckLine size={18} className="text-white" />
                            </div>

                            {/* Title */}
                            {isEditingEndScreen ? (
                              <input
                                type="text"
                                value={draftEndTitle}
                                onChange={(e) => setDraftEndTitle(e.target.value)}
                                className={`text-[#111] ${deviceView === 'mobile' ? 'text-[28px] leading-[33.6px]' : 'text-[24px] leading-[28.8px]'} font-bold text-center bg-transparent border-b border-[#c8c6c0] outline-none w-full max-w-[360px] pb-[2px] focus:border-[#18181a] transition-colors tracking-[-0.56px]`}
                                placeholder="Thank you title"
                              />
                            ) : (
                              <p className={`text-[#111] ${deviceView === 'mobile' ? 'text-[28px] leading-[33.6px]' : 'text-[24px] leading-[28.8px]'} font-bold text-center tracking-[-0.56px]`}>{endScreenTitle}</p>
                            )}

                            {/* Description */}
                            {isEditingEndScreen ? (
                              <textarea
                                value={draftEndDescription}
                                onChange={(e) => setDraftEndDescription(e.target.value)}
                                rows={3}
                                className="text-[#888] text-[15px] font-light text-center bg-transparent border-b border-[#c8c6c0] outline-none w-full max-w-[320px] resize-none pb-[2px] focus:border-[#18181a] transition-colors leading-normal"
                                placeholder="Thank you description"
                              />
                            ) : (
                              <p className="text-[#888] text-[15px] font-light text-center max-w-[320px] leading-[1.65]">{endScreenDescription}</p>
                            )}

                            {/* Done button */}
                            {isEditingEndScreen ? (
                              <input
                                type="text"
                                value={draftEndButtonText}
                                onChange={(e) => setDraftEndButtonText(e.target.value)}
                                className={`bg-[#1a1a1a] text-white ${deviceView === 'mobile' ? 'text-[16px] px-[28px] py-[12px]' : 'text-[14px] px-[28px] py-[12px]'} font-medium rounded-[10px] outline-none text-center`}
                                placeholder="Button label"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={
                                  isPreview
                                    ? () => {
                                        const intro = screens.find((s) => s.type === 'intro');
                                        setIsPreview(false);
                                        if (intro) setActiveScreenId(intro.id);
                                      }
                                    : undefined
                                }
                                className={`bg-[#1a1a1a] text-white flex items-center gap-[7px] ${deviceView === 'mobile' ? 'text-[16px] px-[28px] py-[12px]' : 'text-[14px] px-[28px] py-[12px]'} font-medium rounded-[10px] cursor-pointer hover:bg-[#2c2c2c] transition-colors`}
                              >
                                {endScreenButtonText}
                                <RiCheckLine size={12} className="shrink-0" />
                              </button>
                            )}
                          </div>

                                                      {isPreview ? previewStepNavEl : null}

                            {/* Card footer */}
                          {!isPreview && (
                          <div className="border-t border-[rgba(0,0,0,0.1)] flex items-center gap-2 px-[20px] py-[10px] shrink-0">
                            <button
                              onClick={() =>
                                requestDeleteScreen({
                                  kind: 'end',
                                  screenLabel: getScreenDeleteLabel(activeScreen),
                                })
                              }
                              className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,245,245,0.7)] border border-[rgba(200,50,50,0.2)] text-[#d63030] text-[12px] font-normal cursor-pointer hover:bg-[rgba(255,235,235,0.9)] transition-colors whitespace-nowrap"
                            >
                              <RiDeleteBin6Line size={12} className="shrink-0" />
                              Delete
                            </button>
                            {!isEditingEndScreen ? (
                              <button
                                onClick={handleEditEndScreen}
                                className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] font-normal cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
                              >
                                <RiPencilLine size={12} className="shrink-0" />
                                Edit
                              </button>
                            ) : (
                              <button
                                onClick={handleBackFromEndEdit}
                                className="flex items-center gap-[5px] px-[14px] py-[8px] rounded-[8px] bg-[rgba(255,255,255,0.7)] border border-[rgba(0,0,0,0.16)] text-[#444] text-[12px] font-normal cursor-pointer hover:bg-[rgba(245,245,245,0.9)] transition-colors whitespace-nowrap"
                              >
                                <RiArrowLeftLine size={12} className="shrink-0" aria-hidden />
                                Back
                              </button>
                            )}
                            {isEditingEndScreen && <div className="flex-1" />}
                            {isEditingEndScreen && (
                              <button
                                type="button"
                                onClick={handleSaveEndEdit}
                                className="flex items-center gap-[5px] px-[16px] py-[8px] rounded-[8px] bg-[#111] text-white text-[12px] font-medium cursor-pointer hover:bg-[#2c2c2c] transition-colors whitespace-nowrap"
                              >
                                <RiCheckLine size={11} className="shrink-0" />
                                Save
                              </button>
                            )}
                          </div>
                          )}
                        </motion.div>
                      </motion.div>
                ) : null}
              </AnimatePresence>
              </motion.div>
              {hasScreens && (
                isPreview ? <PreviewPoweredBy /> : (
                  <motion.div
                    layout
                    aria-hidden
                    className="shrink-0 w-full"
                    style={{ height: PREVIEW_POWERED_BY_H }}
                  />
                )
              )}
              </div>{/* end scaled frame */}

              {/* ── Viewport / Preview toggle (floating top-right) ── */}
              <div className="absolute top-[10px] right-[12px] z-10">
                <div
                  className="inline-flex items-center bg-white border border-[#e4e2dc] rounded-[8px] p-[3px] gap-[2px]"
                  style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}
                >
                  <button
                    onClick={() => setDeviceView('desktop')}
                    title="Desktop view"
                    className={`flex items-center justify-center w-[30px] h-[26px] rounded-[5px] transition-colors cursor-pointer ${deviceView === 'desktop' ? 'bg-[#1a1a1a] text-white' : 'text-[#9a9a92] hover:text-[#555] hover:bg-[#f4f3ef]'}`}
                  >
                    <RiComputerLine size={14} />
                  </button>
                  <button
                    onClick={() => setDeviceView('mobile')}
                    title="Mobile view"
                    className={`flex items-center justify-center w-[30px] h-[26px] rounded-[5px] transition-colors cursor-pointer ${deviceView === 'mobile' ? 'bg-[#1a1a1a] text-white' : 'text-[#9a9a92] hover:text-[#555] hover:bg-[#f4f3ef]'}`}
                  >
                    <RiSmartphoneLine size={14} />
                  </button>
                  <button
                    onClick={() => setIsPreview(p => !p)}
                    title="Preview"
                    className={`flex items-center justify-center w-[30px] h-[26px] rounded-[5px] transition-colors cursor-pointer ${isPreview ? 'bg-[#1a1a1a] text-white' : 'text-[#9a9a92] hover:text-[#555] hover:bg-[#f4f3ef]'}`}
                  >
                    <RiEyeLine size={14} />
                  </button>
                </div>
              </div>
            </div>
            </motion.div>
          )}
          </AnimatePresence>
          </div>

          {/* Footer — screen navigation (hidden on Logic tab; preview uses in-card Back/Next) */}
          {!isPreview && activeTab !== 'logic' && (
          <div className="h-[51px] shrink-0 border-t border-[#e4e2dc] flex items-center px-6 bg-white">
            {hasScreens ? (
              <>
                <button
                  type="button"
                  onClick={() => prevScreen && setActiveScreenId(prevScreen.id)}
                  disabled={!prevScreen}
                  className={`inline-flex items-center gap-1.5 px-[15px] py-[8px] bg-white border border-[#e4e2dc] rounded-[8px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                    prevScreen ? 'text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer' : 'text-[#ccc] cursor-not-allowed'
                  }`}
                >
                  <RiArrowLeftLine size={13} className={`shrink-0 ${prevScreen ? 'text-[#1a1a1a]' : 'text-[#ccc]'}`} aria-hidden />
                  Previous
                </button>
                <span className="flex-1 text-center text-[12px] font-normal text-[#7a7a72]">
                  Screen {activeScreenIdx + 1} of {screens.length}
                </span>
                <button
                  type="button"
                  onClick={() => nextScreen && setActiveScreenId(nextScreen.id)}
                  disabled={!nextScreen}
                  className={`inline-flex items-center gap-1.5 px-[15px] py-[8px] bg-white border border-[#e4e2dc] rounded-[8px] text-[11px] font-medium transition-colors whitespace-nowrap ${
                    nextScreen ? 'text-[#1a1a1a] hover:bg-[#f4f3ef] cursor-pointer' : 'text-[#ccc] cursor-not-allowed'
                  }`}
                >
                  Next
                  <RiArrowRightLine size={13} className={`shrink-0 ${nextScreen ? 'text-[#1a1a1a]' : 'text-[#ccc]'}`} aria-hidden />
                </button>
              </>
            ) : (
              <span className="flex-1 text-center text-[12px] font-normal text-[#7a7a72]">
                No screens added yet
              </span>
            )}
          </div>
          )}

          {/* ── Theme selection overlay ── */}
          <AnimatePresence>
            {showThemeOverlay && (
              <motion.div
                key="theme-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 z-50 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.32)' }}
                onClick={() => setShowThemeOverlay(false)}
              >
                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.96, opacity: 0, y: 6 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-[12px] w-[580px] max-h-[88vh] flex flex-col overflow-hidden"
                  style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.1)] shrink-0">
                    <span className="text-[14px] font-normal text-[#4c414e]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      Theme
                    </span>
                    <button
                      onClick={() => setShowThemeOverlay(false)}
                      className="w-[24px] h-[24px] flex items-center justify-center rounded-[6px] text-[#7a7a72] text-[16px] cursor-pointer hover:bg-[#f4f3ef] transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  {/* Theme grid */}
                  <div className="overflow-y-auto">
                    <div className="p-5 grid grid-cols-2 gap-5">
                      {THEMES.map((theme) => {
                        const isActive = activeThemeId === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => handleSelectTheme(theme)}
                            className="text-left cursor-pointer group"
                            style={{
                              background: 'white',
                              border: isActive ? '2px solid #1a1a1a' : '1px solid #d4d4d4',
                              borderRadius: 16,
                              overflow: 'hidden',
                              transition: 'border-color 0.15s ease',
                            }}
                          >
                            {/* Preview area */}
                            <div className="h-[160px] overflow-hidden" style={{ borderRadius: '14px 14px 0 0' }}>
                              <img
                                src={theme.previewImg}
                                alt={theme.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Name row */}
                            <div className="px-4 py-3 flex items-center justify-between bg-white">
                              <span className="text-[10.5px] font-medium text-black" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                {theme.name}
                              </span>
                              {isActive && <RiCheckLine size={13} className="text-[#1a1a1a] shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {!isPreview && <FormBuilderRightPanels {...builderPanelBindings} />}

      </div>
      </LayoutGroup>

      <DeleteScreenModal
        open={Boolean(pendingScreenDelete)}
        screenLabel={pendingScreenDelete?.screenLabel}
        onCancel={closeDeleteScreenModal}
        onConfirm={confirmScreenDelete}
      />

      <UnsavedChangesModal
        open={Boolean(unsavedChangesPrompt)}
        scope={unsavedChangesPrompt === 'leave' ? 'builder' : 'screen'}
        onCancel={closeUnsavedChangesModal}
        onDiscard={handleUnsavedDiscard}
        onSave={handleUnsavedSave}
      />

      <PublishFormModal
        open={publishModalOpen}
        onCancel={() => setPublishModalOpen(false)}
        onConfirm={handlePublishForm}
      />
    </div>
  );
};

export default FormBuilderPage;
