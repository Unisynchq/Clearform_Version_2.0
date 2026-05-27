import { motion, AnimatePresence } from 'motion/react';
import BuilderRightPanelShell from '@/features/forms/formBuilder/BuilderRightPanelShell';

import ToggleSwitch, { TOGGLE_TRACK_OFF, TOGGLE_TRACK_ON, toggleTrackClassName } from '@/components/ui/ToggleSwitch';
import Select from '@/components/ui/Select';
import ResponseQualityScoringCard, { DEFAULT_RESPONSE_QUALITY_OPTIONS } from '@/features/forms/components/ResponseQualityScoringCard';
import IfThenLogicPanel from '@/features/forms/components/IfThenLogicPanel';
import TimeConfigurePanel from '@/features/forms/components/TimeConfigurePanel';
import BlockVisibilityConditions from '@/features/forms/components/BlockVisibilityConditions';
import {
  ESSENTIALS, CONTENT_SECTIONS, QUESTION_TEMPLATE_CATEGORIES, CONFIGURE_TILE_GRID, CONFIGURE_TILE_BASE, ACCORDION_SECTIONS, CTA_COLOR_PALETTE,
} from '@/features/forms/formBuilder/builderConfiguratorConstants';
import { formatFileSizeCompact, formatMaxSizeLabel, parseMaxFileSizeBytes } from '@/features/forms/utils/fileSizeLimits';
import {
  RiAddLine,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiExternalLinkLine,
  RiFileUploadLine,
  RiGlobeLine,
  RiHeartLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiMailLine,
  RiMapPinLine,
  RiPencilLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
  RiStarFill,
  RiTimeLine,
} from 'react-icons/ri';
import { BoxesIcon, ImagesCardIcon, LongTextIcon, ShortTextIcon, TextAlignLeftIcon, TextHIcon, VideoCardIcon } from '@/features/forms/formBuilder/builderFieldIcons';
import { PiCaretCircleUp } from 'react-icons/pi';

export default function FormBuilderRightPanels({   ACCORDION_SECTIONS,
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
  workSections }) {
  return (
    <div className="relative shrink-0 h-full overflow-hidden flex">
        {/* ── Configure panel (right) ── */}
        {!isPreview && <>
        <AnimatePresence>
        {showConfigPanel && (
          <BuilderRightPanelShell panelKey="config-panel" width={280}>
          <div
            className="w-[280px] h-full bg-[#f7f7f8] border-l border-[#e5e3dc] flex flex-col"
            style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}
          >
            {/* Header */}
            <div className="h-[41px] border-b border-[#e5e3dc] flex items-center justify-between px-4 shrink-0">
              <span className="text-[14px] font-semibold text-black">Configure</span>
              <button
                onClick={() => setShowConfigPanel(false)}
                className="w-[22px] h-[22px] bg-[#f4f3ef] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e9e7e0] transition-colors"
              >
                <RiCloseLine size={14} className="text-[#6a6a6a]" aria-hidden />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Essentials section */}
              <div className="p-[14px] flex flex-col gap-4">
                {/* Section heading */}
                <button
                  onClick={() => toggleSection('essentials')}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <span className="text-[#414141] text-[10px] font-semibold tracking-[0.7px] uppercase">
                    Essentials
                  </span>
                  <motion.span
                    animate={{ rotate: sections.essentials ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex items-center shrink-0"
                  >
                    <RiArrowDownSLine size={16} className="text-[#414141]" />
                  </motion.span>
                </button>

                {/* Essentials grid */}
                <AnimatePresence initial={false}>
                  {sections.essentials && (
                    <motion.div
                      key="essentials-grid"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <motion.div
                        className={CONFIGURE_TILE_GRID}
                        variants={{ show: { transition: { staggerChildren: 0.035 } }, hidden: {} }}
                        initial="hidden"
                        animate="show"
                      >
                        {ESSENTIALS.map(({ label, Icon }) => {
                          const isActive = activeScreen?.type === 'intro' && introEssential === label;
                          return (
                            <motion.button
                              key={label}
                              variants={{
                                hidden: { opacity: 0, y: 5 },
                                show: { opacity: 1, y: 0 },
                              }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              onClick={() => handleIntroEssentialSelect(label)}
                              className={`${CONFIGURE_TILE_BASE} ${
                                isActive
                                  ? 'bg-[#eef2ff] border-indigo-300'
                                  : 'bg-white border-[#e5e3dc] hover:bg-[#f9f8f6]'
                              }`}
                            >
                              <Icon size={12} className={`shrink-0 ${isActive ? 'text-indigo-500' : 'text-[#6a6a6a]'}`} />
                              <span className={`text-[9px] leading-[10px] text-center ${isActive ? 'text-indigo-600 font-medium' : 'text-[#6a6a6a]'}`}>
                                {label}
                              </span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion sections */}
              {ACCORDION_SECTIONS.filter(({ key }) =>
                !(activeScreen?.type === 'intro' && key === 'questionTemplates')
              ).map(({ key, label }) => (
                <div key={key} className="border-t border-[rgba(0,0,0,0.09)]">
                  <button
                    onClick={() => toggleSection(key)}
                    className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                  >
                    <span className="text-[#686868] text-[9.5px] font-semibold tracking-[1.235px] uppercase">
                      {label}
                    </span>
                    <motion.span
                      animate={{ rotate: sections[key] ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="flex items-center shrink-0"
                    >
                      <RiArrowDownSLine size={12} className="text-[#686868]" />
                    </motion.span>
                  </button>

                  {/* Question Templates expanded content */}
                  <AnimatePresence initial={false}>
                    {key === 'questionTemplates' && sections.questionTemplates && (
                      <motion.div
                        key="qt-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pb-2">
                          {QUESTION_TEMPLATE_CATEGORIES.map(({ label: catLabel, items }, idx) => (
                            <div key={catLabel}>
                              {idx > 0 && (
                                <div className="h-px bg-[#e5e3dc] mx-[14px]" />
                              )}
                              <div className="p-[14px] flex flex-col gap-4">
                                <span className="text-[#414141] text-[10px] font-semibold tracking-[0.7px] uppercase leading-normal">
                                  {catLabel}
                                </span>
                                <motion.div
                                  className={CONFIGURE_TILE_GRID}
                                  variants={{ show: { transition: { staggerChildren: 0.04 } }, hidden: {} }}
                                  initial="hidden"
                                  animate="show"
                                >
                                  {items.map(({ label: itemLabel, Icon }) => {
                                    const isSelected = selectedTemplate === `${catLabel}:${itemLabel}`;
                                    return (
                                      <motion.button
                                        key={itemLabel}
                                        variants={{
                                          hidden: { opacity: 0, y: 5 },
                                          show: { opacity: 1, y: 0 },
                                        }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        onClick={() => setSelectedTemplate(isSelected ? null : `${catLabel}:${itemLabel}`)}
                                        className={`${CONFIGURE_TILE_BASE} ${
                                          isSelected
                                            ? 'bg-[#ebeaff] border-[#a39eff]'
                                            : 'bg-white border-[#e5e3dc] hover:bg-[#f9f8f6]'
                                        }`}
                                      >
                                        <Icon
                                          size={12}
                                          className={`shrink-0 ${isSelected ? 'text-[#5b55e8]' : 'text-[#6a6a6a]'}`}
                                        />
                                        <span
                                          className={`text-[9px] leading-[10px] text-center ${
                                            isSelected ? 'text-black font-medium' : 'text-[#6a6a6a] font-normal'
                                          }`}
                                        >
                                          {itemLabel}
                                        </span>
                                      </motion.button>
                                    );
                                  })}
                                </motion.div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Field Settings expanded content */}
                    {key === 'fieldSettings' && sections.fieldSettings && (
                      <motion.div
                        key="fs-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="flex flex-col gap-3 px-4 pt-[6px] pb-[14px]">
                          {/* Required toggle */}
                          {[
                            { label: 'Required', value: welcomeRequired, setter: setWelcomeRequired },
                            { label: 'Hidden', value: welcomeHidden, setter: setWelcomeHidden },
                            { label: 'Read-only', value: welcomeReadOnly, setter: setWelcomeReadOnly },
                          ].map(({ label: toggleLabel, value, setter }) => (
                            <div key={toggleLabel} className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444] font-normal">{toggleLabel}</span>
                              <button
                                onClick={() => setter((p) => !p)}
                                className={`relative w-[34px] h-[20px] rounded-[10px] transition-colors cursor-pointer shrink-0 appearance-none border-0 p-0 ${value ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}
                              >
                                <span
                                  className={`absolute top-[3px] w-[14px] h-[14px] bg-white rounded-[7px] transition-all duration-200 ${value ? 'left-[17px]' : 'left-[3px]'}`}
                                />
                              </button>
                            </div>
                          ))}

                          {/* Divider */}
                          <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                          {/* Placeholder text */}
                          <div className="flex flex-col gap-[6px]">
                            <span className="text-[12px] text-[#444] font-normal">Placeholder text</span>
                            <div className="bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[7px]">
                              <input
                                type="text"
                                value={welcomePlaceholder}
                                onChange={(e) => setWelcomePlaceholder(e.target.value)}
                                className="w-full text-[12px] text-[#111] bg-transparent outline-none font-normal leading-normal"
                                placeholder="Type your answer here…"
                              />
                            </div>
                          </div>

                          {/* Helper text */}
                          <div className="flex flex-col gap-[6px]">
                            <span className="text-[12px] text-[#444] font-normal">Helper text</span>
                            <div className="bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[9px] min-h-[60px]">
                              <textarea
                                value={welcomeHelperText}
                                onChange={(e) => setWelcomeHelperText(e.target.value)}
                                rows={3}
                                className="w-full text-[12px] text-[#111] bg-transparent outline-none resize-none font-normal leading-[18.6px]"
                                placeholder="Press Enter to continue"
                              />
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                          {/* Min length */}
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#444] font-normal">Min length</span>
                            <div className="bg-[rgba(0,0,0,0.04)] flex gap-[6px] items-center px-[6px] py-[4px] rounded-[7px]">
                              <button
                                onClick={() => setWelcomeMinLength((v) => Math.max(0, v - 1))}
                                className="bg-[rgba(255,255,255,0.8)] w-[20px] h-[20px] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-white transition-colors text-[14px] text-[#555] font-medium leading-none"
                              >−</button>
                              <span className="min-w-[28px] text-center text-[13px] font-medium text-[#111]">{welcomeMinLength}</span>
                              <button
                                onClick={() => setWelcomeMinLength((v) => Math.min(welcomeMaxLength, v + 1))}
                                className="bg-[rgba(255,255,255,0.8)] w-[20px] h-[20px] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-white transition-colors text-[14px] text-[#555] font-medium leading-none"
                              >+</button>
                            </div>
                          </div>

                          {/* Max length */}
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#444] font-normal">Max length</span>
                            <div className="bg-[rgba(0,0,0,0.04)] flex gap-[6px] items-center px-[6px] py-[4px] rounded-[7px]">
                              <button
                                onClick={() => setWelcomeMaxLength((v) => Math.max(welcomeMinLength, v - 1))}
                                className="bg-[rgba(255,255,255,0.8)] w-[20px] h-[20px] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-white transition-colors text-[14px] text-[#555] font-medium leading-none"
                              >−</button>
                              <span className="min-w-[28px] text-center text-[13px] font-medium text-[#111]">{welcomeMaxLength}</span>
                              <button
                                onClick={() => setWelcomeMaxLength((v) => v + 1)}
                                className="bg-[rgba(255,255,255,0.8)] w-[20px] h-[20px] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-white transition-colors text-[14px] text-[#555] font-medium leading-none"
                              >+</button>
                            </div>
                          </div>

                          {/* Input type dropdown */}
                          <div className="flex flex-col gap-[6px]" ref={welcomeInputTypeRef}>
                            <span className="text-[12px] text-[#444] font-normal">Input type</span>
                            <div>
                              <button
                                onClick={() => setWelcomeInputTypeOpen((p) => !p)}
                                className={`w-full flex items-center justify-between bg-white border border-[rgba(0,0,0,0.2)] pl-[11px] pr-[10px] py-[9px] cursor-pointer transition-colors ${welcomeInputTypeOpen ? 'rounded-t-[6px]' : 'rounded-[6px]'}`}
                              >
                                <span className="text-[12.5px] text-[#1a1a1a] font-normal">{welcomeInputType}</span>
                                <RiArrowDownSLine size={14} className={`text-[#666] transition-transform duration-200 ${welcomeInputTypeOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {welcomeInputTypeOpen && (
                                  <motion.div
                                    key="input-type-dropdown"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                                    style={{ overflow: 'hidden' }}
                                    className="w-full bg-white border border-[#b0b0ae] border-t-0 rounded-b-[6px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.1)]"
                                  >
                                    {['Free text', 'Number', 'Email', 'URL', 'Phone', 'Password'].map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => { setWelcomeInputType(option); setWelcomeInputTypeOpen(false); }}
                                        className={`w-full text-left px-[10px] py-[8px] text-[12.5px] cursor-pointer transition-colors ${
                                          option === welcomeInputType
                                            ? 'bg-[#ebebea] font-medium text-[#1a1a1a]'
                                            : 'font-normal text-[#1a1a1a] hover:bg-[#f5f5f5]'
                                        }`}
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Appearance expanded content */}
                    {key === 'appearance' && sections.appearance && (
                      <motion.div
                        key="appearance-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="flex flex-col gap-3 px-4 pt-[6px] pb-[14px]">
                          {/* Text size */}
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#444] font-normal">Text size</span>
                            <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] h-[31px] p-[2px] rounded-[7px] w-[140px]">
                              {['S', 'M', 'L'].map((size) => (
                                <button
                                  key={size}
                                  onClick={() => setWelcomeTextSize(size)}
                                  className={`flex items-center justify-center rounded-[5px] text-[11.5px] cursor-pointer transition-colors ${
                                    welcomeTextSize === size
                                      ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                      : 'text-[#777] font-normal hover:text-[#444]'
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Alignment */}
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[#444] font-normal">Alignment</span>
                            <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] h-[29px] p-[2px] rounded-[7px] w-[140px]">
                              {[
                                { alignKey: 'left', Icon: RiAlignLeft },
                                { alignKey: 'center', Icon: RiAlignCenter },
                                { alignKey: 'right', Icon: RiAlignRight },
                              ].map(({ alignKey, Icon: AlignIcon }) => (
                                <button
                                  key={alignKey}
                                  onClick={() => setWelcomeAlignment(alignKey)}
                                  className={`flex items-center justify-center rounded-[5px] cursor-pointer transition-colors ${
                                    welcomeAlignment === alignKey
                                      ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                      : 'hover:bg-[rgba(255,255,255,0.5)]'
                                  }`}
                                >
                                  <AlignIcon size={13} className={welcomeAlignment === alignKey ? 'text-[#111]' : 'text-[#777]'} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
          </BuilderRightPanelShell>
        )}
        </AnimatePresence>

        {/* ── Content panel (right) – shown when Add Screen is clicked after intro ── */}
        <AnimatePresence>
          {showContentPanel && (
            <BuilderRightPanelShell panelKey="content-panel" width={280}>
            <div
              className="w-[280px] h-full bg-[#f7f7f8] border-l border-[#e5e3dc] flex flex-col"
              style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.1)' }}
            >
              {/* Header */}
              <div className="h-[41px] border-b border-[#e5e3dc] flex items-center justify-between px-4 shrink-0">
                <span
                  className="text-[14px] font-semibold text-black"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
                >
                  Content
                </span>
                <button
                  onClick={() => setShowContentPanel(false)}
                  className="w-[22px] h-[22px] bg-[#f4f3ef] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e9e7e0] transition-colors"
                >
                  <RiCloseLine size={14} className="text-[#6a6a6a] shrink-0" aria-hidden />
                </button>
              </div>

              {/* Scrollable sections */}
              <div className="flex-1 overflow-y-auto">
                {CONTENT_SECTIONS.map(({ key, label, items }, index) => (
                  <div key={key}>
                    {index > 0 && (
                      <div className="h-px bg-[#e5e3dc] mx-[6px]" />
                    )}
                    <div className="p-[14px] flex flex-col gap-[16px]">
                      {/* Section header row */}
                      <button
                        onClick={() => toggleContentSection(key)}
                        className="flex items-center justify-between w-full cursor-pointer px-[2px]"
                      >
                        <span
                          className="text-[#414141] text-[10px] font-semibold tracking-[0.7px] uppercase leading-normal"
                          style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
                        >
                          {label}
                        </span>
                        <motion.span
                          animate={{ rotate: openContentSections[key] ? 0 : 180 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="flex items-center shrink-0"
                        >
                          <PiCaretCircleUp size={16} className="text-[#414141]" />
                        </motion.span>
                      </button>

                      {/* Items grid */}
                      <AnimatePresence initial={false}>
                        {openContentSections[key] && (
                          <motion.div
                            key={`${key}-grid`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <motion.div
                              className={CONFIGURE_TILE_GRID}
                              variants={{
                                show: { transition: { staggerChildren: 0.04 } },
                                hidden: {},
                              }}
                              initial="hidden"
                              animate="show"
                            >
                              {items.map(({ label: itemLabel, Icon }) => (
                                <motion.button
                                  key={itemLabel}
                                  variants={{
                                    hidden: { opacity: 0, y: 6 },
                                    show: { opacity: 1, y: 0 },
                                  }}
                                  transition={{ duration: 0.15, ease: 'easeOut' }}
                                  onClick={() => addContentScreen(key, itemLabel)}
                                  className={`${CONFIGURE_TILE_BASE} bg-white border-[#e5e3dc] hover:bg-[#f4f3ef] active:bg-[#ebeaff] active:border-[#a39eff]`}
                                >
                                  <Icon size={12} className="shrink-0 text-[#6a6a6a]" />
                                  {itemLabel.length > 13 ? (
                                    <div
                                      className="label-marquee text-[9px] leading-[10px] text-[#6a6a6a] font-normal"
                                      style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
                                    >
                                      <span>{itemLabel}</span>
                                    </div>
                                  ) : (
                                    <span
                                      className="text-[9px] leading-[10px] text-center whitespace-nowrap text-[#6a6a6a] font-normal"
                                      style={{ fontFamily: "'DM Sans', sans-serif", fontVariationSettings: "'opsz' 14" }}
                                    >
                                      {itemLabel}
                                    </span>
                                  )}
                                </motion.button>
                              ))}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── CTA Configure panel (right) ── */}
        <AnimatePresence>
          {showCtaConfigPanel && (
            <BuilderRightPanelShell panelKey="cta-config-panel" width={280}>
              <div
                className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col"
                style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}
              >
                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span
                    className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Configure
                  </span>
                  <button
                    onClick={() => setShowCtaConfigPanel(false)}
                    className="w-[20px] h-[20px] bg-[#f0eeea] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
                  >
                    <RiCloseLine size={10} className="text-[#6a6a6a] shrink-0" aria-hidden />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── BUTTON section ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCtaSections((p) => ({ ...p, button: !p.button }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span
                        className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        BUTTON
                      </span>
                      <motion.span
                        animate={{ rotate: ctaSections.button ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {ctaSections.button && (
                        <motion.div
                          key="cta-btn-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-3 px-4 pt-[6px] pb-[14px]">

                            {/* Preview */}
                            <div className="flex flex-col gap-[10px]">
                              <span
                                className="text-[10px] font-semibold tracking-[0.9px] uppercase text-[#8c8c8a]"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                              >
                                PREVIEW
                              </span>
                              <div>
                                <button
                                  className="flex items-center justify-center gap-[6px] px-4 py-2 text-[13px] font-medium"
                                  style={{
                                    background:
                                      ctaButtonStyle === 'Filled'
                                        ? ctaBtnColor
                                        : 'transparent',
                                    color:
                                      ctaButtonStyle === 'Ghost'
                                        ? ctaBtnColor
                                        : (ctaTextColor ?? (ctaLabelColor === 'black' ? '#111' : '#fff')),
                                    borderRadius: `${ctaCornerRadius}px`,
                                    border:
                                      ctaButtonStyle === 'Outline' || ctaButtonStyle === 'Ghost'
                                        ? `1.5px solid ${ctaBtnColor}`
                                        : 'none',
                                    fontFamily: "'Inter', sans-serif",
                                  }}
                                >
                                  <span>{ctaButtonLabel || 'Get started'}</span>
                                  {ctaShowIcon && <RiArrowRightLine size={14} className="shrink-0" aria-hidden />}
                                </button>
                              </div>
                            </div>

                            {/* Button label */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Button label
                              </span>
                              <input
                                type="text"
                                value={ctaButtonLabel}
                                onChange={(e) => setCtaButtonLabel(e.target.value)}
                                className="w-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[7px] text-[12px] text-[#111] outline-none focus:border-[rgba(0,0,0,0.3)]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Button size */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Button size
                              </span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-4 gap-[2px] p-[2px] rounded-[7px]">
                                {['S', 'M', 'L', 'XL'].map((size) => (
                                  <button
                                    key={size}
                                    onClick={() => setCtaButtonSize(size)}
                                    className={`flex items-center justify-center py-[6px] rounded-[5px] text-[11.5px] transition-colors cursor-pointer ${
                                      ctaButtonSize === size
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Button style */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Button style
                              </span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] p-[2px] rounded-[7px]">
                                {['Filled', 'Outline', 'Ghost'].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setCtaButtonStyle(s)}
                                    className={`flex items-center justify-center py-[6px] rounded-[5px] text-[11.5px] transition-colors cursor-pointer ${
                                      ctaButtonStyle === s
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Corner radius */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Corner radius
                              </span>
                              <div className="flex items-center gap-[10px]">
                                <input
                                  type="range"
                                  min={0}
                                  max={50}
                                  value={ctaCornerRadius}
                                  onChange={(e) => setCtaCornerRadius(Number(e.target.value))}
                                  className="cta-slider flex-1"
                                  style={{
                                    background: `linear-gradient(to right, #111 ${(ctaCornerRadius / 50) * 100}%, #ddd ${(ctaCornerRadius / 50) * 100}%)`,
                                  }}
                                />
                                <span
                                  className="text-[11px] font-medium text-[#111] min-w-[20px] text-right shrink-0"
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {ctaCornerRadius}
                                </span>
                              </div>
                            </div>

                            {/* Button color picker */}
                            <div className="bg-[#fafaf9] border border-[#e5e5e3] rounded-[12px] overflow-hidden">
                              <div className="px-[11px] pt-[11px] pb-[9px] flex flex-col gap-2">
                                <span
                                  className="text-[10px] font-semibold tracking-[0.9px] uppercase text-[#8c8c8a]"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  BUTTON COLOR
                                </span>
                                {/* Quick swatches */}
                                <div className="flex items-center gap-2 pt-[2px]">
                                  {['#1a1a1a', '#3b82f6', '#ffffff'].map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setCtaBtnColor(color)}
                                      className="rounded-full shrink-0 cursor-pointer"
                                      style={{
                                        width: 28,
                                        height: 28,
                                        background: color,
                                        border: color === '#ffffff' ? '1px solid #e5e5e3' : 'none',
                                        outline: ctaBtnColor === color ? '2px solid #111' : 'none',
                                        outlineOffset: 2,
                                      }}
                                    />
                                  ))}
                                  <button
                                    onClick={() => setCtaBtnColorGridOpen((v) => !v)}
                                    className="w-[28px] h-[28px] rounded-full border border-dashed border-[#c0c0be] flex items-center justify-center text-[#9a9a9a] text-[14px] leading-none cursor-pointer hover:bg-white/50"
                                  >
                                    +
                                  </button>
                                </div>
                                {/* Color grid – shown only after clicking + */}
                                <AnimatePresence initial={false}>
                                  {ctaBtnColorGridOpen && (
                                    <motion.div
                                      key="cta-btn-color-grid"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                      style={{ overflow: 'hidden' }}
                                    >
                                      <div className="bg-white border border-[#e5e5e3] rounded-[8px] p-[11px] flex flex-col gap-2">
                                        <div className="grid grid-cols-8 gap-1">
                                          {CTA_COLOR_PALETTE.flat().map((color, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => {
                                                setCtaBtnColor(color);
                                                setCtaBtnColorGridOpen(false);
                                              }}
                                              className="aspect-square rounded-[3px] cursor-pointer hover:scale-110 transition-transform"
                                              style={{
                                                background: color,
                                                border:
                                                  idx === 0
                                                    ? '1px solid #d8d8d6'
                                                    : '1px solid rgba(0,0,0,0.07)',
                                                outline: ctaBtnColor === color ? '2px solid #1a1a1a' : 'none',
                                                outlineOffset: 1,
                                              }}
                                            />
                                          ))}
                                        </div>
                                        {/* Hex input row */}
                                        <div className="border-t border-[#ebebea] pt-[9px] flex items-center gap-[6px]">
                                          <div
                                            className="w-[22px] h-[22px] rounded-[4px] border border-[#d8d8d6] shrink-0"
                                            style={{ background: ctaBtnColor }}
                                          />
                                          <span
                                            className="text-[11.5px] text-[#9a9a9a] shrink-0"
                                            style={{ fontFamily: 'Courier New, monospace' }}
                                          >
                                            #
                                          </span>
                                          <input
                                            type="text"
                                            value={ctaBtnColor.replace('#', '').toUpperCase()}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                setCtaBtnColor('#' + val);
                                              }
                                            }}
                                            className="flex-1 text-[11.5px] text-[#9a9a9a] uppercase outline-none bg-transparent min-w-0"
                                            style={{ fontFamily: 'Courier New, monospace' }}
                                            maxLength={6}
                                          />
                                          <button className="px-2 py-1 border border-[#e0e0de] rounded-[4px] text-[10.5px] text-[#9a9a9a] shrink-0 cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                                            Custom
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Text color picker */}
                            <div className="bg-[#fafaf9] border border-[#e5e5e3] rounded-[12px] overflow-hidden">
                              <div className="px-[11px] pt-[11px] pb-[9px] flex flex-col gap-2">
                                <span
                                  className="text-[10px] font-semibold tracking-[0.9px] uppercase text-[#8c8c8a]"
                                  style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                  TEXT COLOR
                                </span>
                                {/* Quick swatches */}
                                <div className="flex items-center gap-2 pt-[2px]">
                                  {['#3b82f6', '#1a1a1a', '#ffffff'].map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setCtaTextColor(color)}
                                      className="rounded-full shrink-0 cursor-pointer"
                                      style={{
                                        width: 28,
                                        height: 28,
                                        background: color,
                                        border: color === '#ffffff' ? '1px solid #e5e5e3' : 'none',
                                        outline: ctaTextColor === color ? '2px solid #111' : 'none',
                                        outlineOffset: 2,
                                      }}
                                    />
                                  ))}
                                  <button
                                    onClick={() => setCtaColorGridOpen((v) => !v)}
                                    className="w-[28px] h-[28px] rounded-full border border-dashed border-[#c0c0be] flex items-center justify-center text-[#9a9a9a] text-[14px] leading-none cursor-pointer hover:bg-white/50"
                                  >
                                    +
                                  </button>
                                </div>
                                {/* Color grid – shown only after clicking + */}
                                <AnimatePresence initial={false}>
                                  {ctaColorGridOpen && (
                                    <motion.div
                                      key="cta-color-grid"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                      style={{ overflow: 'hidden' }}
                                    >
                                      <div className="bg-white border border-[#e5e5e3] rounded-[8px] p-[11px] flex flex-col gap-2">
                                        <div className="grid grid-cols-8 gap-1">
                                          {CTA_COLOR_PALETTE.flat().map((color, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => {
                                                setCtaTextColor(color);
                                                setCtaColorGridOpen(false);
                                              }}
                                              className="aspect-square rounded-[3px] cursor-pointer hover:scale-110 transition-transform"
                                              style={{
                                                background: color,
                                                border:
                                                  idx === 0
                                                    ? '1px solid #d8d8d6'
                                                    : '1px solid rgba(0,0,0,0.07)',
                                                outline: ctaTextColor === color ? '2px solid #1a1a1a' : 'none',
                                                outlineOffset: 1,
                                              }}
                                            />
                                          ))}
                                        </div>
                                        {/* Hex input row */}
                                        <div className="border-t border-[#ebebea] pt-[9px] flex items-center gap-[6px]">
                                          <div
                                            className="w-[22px] h-[22px] rounded-[4px] border border-[#d8d8d6] shrink-0"
                                            style={{ background: ctaTextColor }}
                                          />
                                          <span
                                            className="text-[11.5px] text-[#9a9a9a] shrink-0"
                                            style={{ fontFamily: 'Courier New, monospace' }}
                                          >
                                            #
                                          </span>
                                          <input
                                            type="text"
                                            value={ctaTextColor.replace('#', '').toUpperCase()}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                setCtaTextColor('#' + val);
                                              }
                                            }}
                                            className="flex-1 text-[11.5px] text-[#9a9a9a] uppercase outline-none bg-transparent min-w-0"
                                            style={{ fontFamily: 'Courier New, monospace' }}
                                            maxLength={6}
                                          />
                                          <button className="px-2 py-1 border border-[#e0e0de] rounded-[4px] text-[10.5px] text-[#9a9a9a] shrink-0 cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                                            Custom
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            {/* Label color */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Label color
                              </span>
                              <div className="flex items-center gap-[6px]">
                                {[
                                  { id: 'white', bg: '#ffffff', shadow: 'inset 0 0 0 2px rgba(0,0,0,0.12)' },
                                  { id: 'black', bg: '#111111', shadow: 'none' },
                                ].map(({ id, bg, shadow }) => (
                                  <button
                                    key={id}
                                    onClick={() => setCtaLabelColor(id)}
                                    className="rounded-full shrink-0 cursor-pointer"
                                    style={{
                                      width: 22,
                                      height: 22,
                                      background: bg,
                                      boxShadow: shadow,
                                      outline: ctaLabelColor === id ? '1.5px solid #111' : 'none',
                                      outlineOffset: 3,
                                    }}
                                  />
                                ))}
                                <button className="w-[22px] h-[22px] rounded-full border border-dashed border-[rgba(0,0,0,0.15)] flex items-center justify-center text-[#bbb] text-[14px] leading-none cursor-pointer hover:bg-[#f0eeea]">
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Show icon */}
                            <div className="flex items-center justify-between">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Show icon
                              </span>
                              <button
                                onClick={() => setCtaShowIcon((v) => !v)}
                                className="relative shrink-0 cursor-pointer transition-colors"
                                style={{
                                  width: 34,
                                  height: 20,
                                  borderRadius: 10,
                                  background: ctaShowIcon ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF,
                                }}
                              >
                                <div
                                  className="absolute top-[3px] bg-white rounded-[7px]"
                                  style={{
                                    width: 14,
                                    height: 14,
                                    left: ctaShowIcon ? 17 : 3,
                                    transition: 'left 0.15s ease',
                                  }}
                                />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── TYPOGRAPHY section ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCtaSections((p) => ({ ...p, typography: !p.typography }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span
                        className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        TYPOGRAPHY
                      </span>
                      <motion.span
                        animate={{ rotate: ctaSections.typography ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {ctaSections.typography && (
                        <motion.div
                          key="cta-typo-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-3 px-4 pt-[6px] pb-[14px]">

                            {/* Heading size */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Heading size
                              </span>
                              <div className="flex items-center gap-[10px]">
                                <input
                                  type="range"
                                  min={12}
                                  max={60}
                                  value={ctaHeadingSize}
                                  onChange={(e) => setCtaHeadingSize(Number(e.target.value))}
                                  className="cta-slider flex-1"
                                  style={{
                                    background: `linear-gradient(to right, #111 ${((ctaHeadingSize - 12) / 48) * 100}%, #ddd ${((ctaHeadingSize - 12) / 48) * 100}%)`,
                                  }}
                                />
                                <span
                                  className="text-[11px] font-medium text-[#111] min-w-[20px] text-right shrink-0"
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {ctaHeadingSize}
                                </span>
                              </div>
                            </div>

                            {/* Body size */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Body size
                              </span>
                              <div className="flex items-center gap-[10px]">
                                <input
                                  type="range"
                                  min={8}
                                  max={32}
                                  value={ctaBodySize}
                                  onChange={(e) => setCtaBodySize(Number(e.target.value))}
                                  className="cta-slider flex-1"
                                  style={{
                                    background: `linear-gradient(to right, #111 ${((ctaBodySize - 8) / 24) * 100}%, #ddd ${((ctaBodySize - 8) / 24) * 100}%)`,
                                  }}
                                />
                                <span
                                  className="text-[11px] font-medium text-[#111] min-w-[20px] text-right shrink-0"
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {ctaBodySize}
                                </span>
                              </div>
                            </div>

                            {/* Font weight */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Font weight
                              </span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] p-[2px] rounded-[7px]">
                                {[
                                  { label: 'Light', weight: 300 },
                                  { label: 'Regular', weight: 400 },
                                  { label: 'Bold', weight: 700 },
                                ].map(({ label, weight }) => (
                                  <button
                                    key={label}
                                    onClick={() => setCtaFontWeight(label)}
                                    className={`flex items-center justify-center py-[6px] rounded-[5px] text-[11.5px] transition-colors cursor-pointer ${
                                      ctaFontWeight === label
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)] text-[#111]'
                                        : 'text-[#777] hover:text-[#444]'
                                    }`}
                                    style={{
                                      fontFamily: "'DM Sans', sans-serif",
                                      fontWeight: weight,
                                    }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Text align */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Text align
                              </span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] p-[2px] rounded-[7px]">
                                {[
                                  { id: 'left', Icon: RiAlignLeft },
                                  { id: 'center', Icon: RiAlignCenter },
                                  { id: 'right', Icon: RiAlignRight },
                                ].map(({ id, Icon }) => (
                                  <button
                                    key={id}
                                    onClick={() => setCtaTextAlign(id)}
                                    className={`flex items-center justify-center py-[6px] rounded-[5px] transition-colors cursor-pointer ${
                                      ctaTextAlign === id
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                        : 'hover:bg-white/30'
                                    }`}
                                  >
                                    <Icon
                                      size={13}
                                      className={ctaTextAlign === id ? 'text-[#111]' : 'text-[#777]'}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── SPACING section ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCtaSections((p) => ({ ...p, spacing: !p.spacing }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span
                        className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        SPACING
                      </span>
                      <motion.span
                        animate={{ rotate: ctaSections.spacing ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {ctaSections.spacing && (
                        <motion.div
                          key="cta-spacing-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-4 px-4 pt-[6px] pb-[14px]">

                            {/* Padding */}
                            <div className="flex flex-col gap-[6px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Padding
                              </span>
                              <div className="flex items-center gap-[10px]">
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  value={ctaPadding}
                                  onChange={(e) => setCtaPadding(Number(e.target.value))}
                                  className="cta-slider flex-1"
                                  style={{
                                    background: `linear-gradient(to right, #111 ${ctaPadding}%, #ddd ${ctaPadding}%)`,
                                  }}
                                />
                                <span
                                  className="text-[11px] font-medium text-[#111] min-w-[20px] text-right shrink-0"
                                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                                >
                                  {ctaPadding}
                                </span>
                              </div>
                            </div>

                            {/* Content width */}
                            <div className="flex flex-col gap-[8px]">
                              <span
                                className="text-[12px] font-normal text-[#444]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              >
                                Content width
                              </span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] p-[2px] rounded-[7px]">
                                {['Narrow', 'Default', 'Wide'].map((w) => (
                                  <button
                                    key={w}
                                    onClick={() => setCtaContentWidth(w)}
                                    className={`flex items-center justify-center py-[6px] rounded-[5px] text-[11.5px] transition-colors cursor-pointer ${
                                      ctaContentWidth === w
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] shadow-[0px_1px_1px_rgba(0,0,0,0.08)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {w}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Heading Configure panel (right) ── */}
        <AnimatePresence>
          {showHeadingConfigPanel && (
            <BuilderRightPanelShell panelKey="heading-config-panel" width={280}>
              <div
                className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col"
                style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}
              >
                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Configure
                  </span>
                  <button
                    onClick={() => setShowHeadingConfigPanel(false)}
                    className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
                  >
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                {/* Card type label */}
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    HEADING
                  </span>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setHeadingSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        FIELD SETTINGS
                      </span>
                      <motion.span
                        animate={{ rotate: headingSections.fieldSettings ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {headingSections.fieldSettings && (
                        <motion.div
                          key="heading-field-settings"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col px-4 pt-[4px] pb-[14px] gap-0">

                            {/* Required toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Required</span>
                              <button
                                onClick={() => setHeadingRequired((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: headingRequired ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: headingRequired ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Hidden toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hidden</span>
                              <button
                                onClick={() => setHeadingHidden((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: headingHidden ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: headingHidden ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Heading text input */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Heading text</span>
                              <input
                                type="text"
                                value={headingText}
                                onChange={(e) => setHeadingText(e.target.value)}
                                placeholder="Enter your heading..."
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Heading level */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Heading level</span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-4 gap-[2px] p-[3px] rounded-[8px]">
                                {['H1', 'H2', 'H3', 'H4'].map((lvl) => (
                                  <button
                                    key={lvl}
                                    onClick={() => setHeadingLevel(lvl)}
                                    className={`flex items-center justify-center py-[5px] rounded-[6px] text-[12px] transition-colors cursor-pointer ${
                                      headingLevel === lvl
                                        ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {lvl}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Sub-heading */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Sub-heading</span>
                              <input
                                type="text"
                                value={subHeading}
                                onChange={(e) => setSubHeading(e.target.value)}
                                placeholder="Optional sub-heading..."
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CONDITIONAL LOGIC ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setHeadingSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        CONDITIONAL LOGIC
                      </span>
                      <motion.span
                        animate={{ rotate: headingSections.conditionalLogic ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {headingSections.conditionalLogic && (
                        <motion.div
                          key="heading-cond-logic"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pb-[15px]">
                            <BlockVisibilityConditions
                              conditions={showIfConditions}
                              onChange={setShowIfConditions}
                              priorScreens={priorScreensForActive}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setHeadingSections((p) => ({ ...p, appearance: !p.appearance }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        APPEARANCE
                      </span>
                      <motion.span
                        animate={{ rotate: headingSections.appearance ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {headingSections.appearance && (
                        <motion.div
                          key="heading-appearance"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-[12px] px-4 pt-[4px] pb-[14px]">

                            {/* Text size */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Text size</span>
                              <div className="flex items-center gap-[6px]">
                                {['S', 'M', 'L', 'XL'].map((sz) => (
                                  <button
                                    key={sz}
                                    onClick={() => setHeadingTextSize(sz)}
                                    className={`w-8 h-7 flex items-center justify-center rounded-[6px] border text-[12px] transition-colors cursor-pointer ${
                                      headingTextSize === sz
                                        ? 'bg-white border-[#111] text-[#111] font-medium'
                                        : 'bg-white border-[#e0e0e0] text-[#777] hover:border-[#bbb]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Alignment */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Alignment</span>
                              <div className="flex items-center gap-[6px]">
                                {[
                                  { id: 'left', Icon: RiAlignLeft },
                                  { id: 'center', Icon: RiAlignCenter },
                                  { id: 'right', Icon: RiAlignRight },
                                ].map(({ id, Icon }) => (
                                  <button
                                    key={id}
                                    onClick={() => setHeadingAlignment(id)}
                                    className={`w-8 h-7 flex items-center justify-center rounded-[6px] border transition-colors cursor-pointer ${
                                      headingAlignment === id
                                        ? 'bg-white border-[#111]'
                                        : 'bg-white border-[#e0e0e0] hover:border-[#bbb]'
                                    }`}
                                  >
                                    <Icon size={14} className={headingAlignment === id ? 'text-[#111]' : 'text-[#777]'} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Font weight */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Font weight</span>
                              <div className="bg-[rgba(0,0,0,0.04)] grid grid-cols-3 gap-[2px] p-[3px] rounded-[8px]">
                                {['Light', 'Regular', 'Bold'].map((w) => (
                                  <button
                                    key={w}
                                    onClick={() => setHeadingFontWeight(w)}
                                    className={`flex items-center justify-center py-[5px] rounded-[6px] text-[11.5px] transition-colors cursor-pointer ${
                                      headingFontWeight === w
                                        ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {w}
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Description Configure panel (right) ── */}
        <AnimatePresence>
          {showDescriptionConfigPanel && (
            <BuilderRightPanelShell panelKey="description-config-panel" width={280}>
              <div
                className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col"
                style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}
              >
                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Configure
                  </span>
                  <button
                    onClick={() => setShowDescriptionConfigPanel(false)}
                    className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
                  >
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                {/* Card type label */}
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    DESCRIPTION
                  </span>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setDescriptionSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        FIELD SETTINGS
                      </span>
                      <motion.span
                        animate={{ rotate: descriptionSections.fieldSettings ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {descriptionSections.fieldSettings && (
                        <motion.div
                          key="desc-field-settings"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col px-4 pt-[4px] pb-[14px] gap-0">

                            {/* Hidden toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hidden</span>
                              <button
                                onClick={() => setDescriptionHidden((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: descriptionHidden ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: descriptionHidden ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Content textarea */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Content</span>
                              <textarea
                                value={descriptionContent}
                                onChange={(e) => setDescriptionContent(e.target.value)}
                                placeholder="Enter description text..."
                                rows={4}
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors resize-none"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Formatting */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Formatting</span>
                              <div className="flex flex-wrap gap-[6px]">
                                {[
                                  { key: 'bold', label: 'Bold' },
                                  { key: 'italic', label: 'Italic' },
                                  { key: 'underline', label: 'Underline' },
                                  { key: 'link', label: 'Link' },
                                  { key: 'list', label: 'List' },
                                ].map(({ key, label }) => (
                                  <button
                                    key={key}
                                    onClick={() => setDescriptionFormatting((prev) => ({ ...prev, [key]: !prev[key] }))}
                                    className={`px-[11px] py-[5px] rounded-[20px] text-[11.5px] transition-colors cursor-pointer border ${
                                      descriptionFormatting[key]
                                        ? 'bg-[#111] border-[#111] text-white'
                                        : 'bg-[#f2f2f2] border-[#e8e8e8] text-[#555] hover:bg-[#e8e8e8]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Show character count toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5] mt-[8px]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Show character count</span>
                              <button
                                onClick={() => setDescriptionShowCharCount((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: descriptionShowCharCount ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: descriptionShowCharCount ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Character limit */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Character limit</span>
                              <input
                                type="number"
                                value={descriptionCharLimit}
                                onChange={(e) => setDescriptionCharLimit(e.target.value)}
                                placeholder="No limit"
                                min={1}
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CONDITIONAL LOGIC ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setDescriptionSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        CONDITIONAL LOGIC
                      </span>
                      <motion.span
                        animate={{ rotate: descriptionSections.conditionalLogic ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {descriptionSections.conditionalLogic && (
                        <motion.div
                          key="desc-cond-logic"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pb-[15px]">
                            <BlockVisibilityConditions
                              conditions={showIfConditions}
                              onChange={setShowIfConditions}
                              priorScreens={priorScreensForActive}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setDescriptionSections((p) => ({ ...p, appearance: !p.appearance }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        APPEARANCE
                      </span>
                      <motion.span
                        animate={{ rotate: descriptionSections.appearance ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {descriptionSections.appearance && (
                        <motion.div
                          key="desc-appearance"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-[12px] px-4 pt-[4px] pb-[14px]">

                            {/* Text size */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Text size</span>
                              <div className="flex items-center gap-[6px]">
                                {['S', 'M', 'L'].map((sz) => (
                                  <button
                                    key={sz}
                                    onClick={() => setDescriptionTextSize(sz)}
                                    className={`w-8 h-7 flex items-center justify-center rounded-[6px] border text-[12px] transition-colors cursor-pointer ${
                                      descriptionTextSize === sz
                                        ? 'bg-white border-[#111] text-[#111] font-medium'
                                        : 'bg-white border-[#e0e0e0] text-[#777] hover:border-[#bbb]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Alignment */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Alignment</span>
                              <div className="flex items-center gap-[6px]">
                                {[
                                  { id: 'left', Icon: RiAlignLeft },
                                  { id: 'center', Icon: RiAlignCenter },
                                  { id: 'right', Icon: RiAlignRight },
                                ].map(({ id, Icon }) => (
                                  <button
                                    key={id}
                                    onClick={() => setDescriptionAlignment(id)}
                                    className={`w-8 h-7 flex items-center justify-center rounded-[6px] border transition-colors cursor-pointer ${
                                      descriptionAlignment === id
                                        ? 'bg-white border-[#111]'
                                        : 'bg-white border-[#e0e0e0] hover:border-[#bbb]'
                                    }`}
                                  >
                                    <Icon size={14} className={descriptionAlignment === id ? 'text-[#111]' : 'text-[#777]'} />
                                  </button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Image Configure panel (right) ── */}
        <AnimatePresence>
          {showImageConfigPanel && (
            <BuilderRightPanelShell panelKey="image-config-panel" width={300}>
              <div
                className="w-[300px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col"
                style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}
              >
                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    Configure
                  </span>
                  <button
                    onClick={() => setShowImageConfigPanel(false)}
                    className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
                  >
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                {/* Card type label */}
                <div className="px-4 pt-[8px] pb-[6px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    IMAGES
                  </span>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setImageSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        FIELD SETTINGS
                      </span>
                      <motion.span
                        animate={{ rotate: imageSections.fieldSettings ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {imageSections.fieldSettings && (
                        <motion.div
                          key="image-field-settings"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col px-4 pt-[4px] pb-[14px] gap-0">

                            {/* Hidden toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hidden</span>
                              <button
                                onClick={() => setImageHidden((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: imageHidden ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: imageHidden ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Image upload area */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Image</span>
                              {imagePreview ? (
                                <div className="relative rounded-[8px] overflow-hidden border border-[#e8e8e8]">
                                  <img src={imagePreview} alt="Preview" className="w-full h-[80px] object-cover" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => imageFileInputRef.current && imageFileInputRef.current.click()}
                                      className="bg-white text-[#444] text-[11px] px-[10px] py-[5px] rounded-[6px] cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                                    >
                                      Replace
                                    </button>
                                    <button
                                      onClick={() => { setImagePreview(null); setImageFileName(''); }}
                                      className="bg-white text-[#d63030] text-[11px] px-[10px] py-[5px] rounded-[6px] cursor-pointer hover:bg-red-50 transition-colors font-medium"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                  {imageFileName && (
                                    <div className="px-[10px] py-[6px] bg-white border-t border-[#e8e8e8]">
                                      <p className="text-[11px] text-[#666] truncate">{imageFileName}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => imageFileInputRef.current && imageFileInputRef.current.click()}
                                  className="w-full bg-[#fafafa] border border-dashed border-[#d0d0d0] rounded-[8px] flex flex-col items-center justify-center py-[17px] gap-[4px] cursor-pointer hover:bg-[#f2f2f2] transition-colors"
                                >
                                  <ImagesCardIcon size={16} className="text-[#999]" />
                                  <p className="text-[12px] text-[#777] text-center">
                                    <span className="font-medium text-[#555]">Click to upload</span>
                                    {' '}or drag & drop
                                  </p>
                                  <p className="text-[11px] text-[#aaa]">PNG, JPG, GIF, WebP</p>
                                </button>
                              )}
                            </div>

                            {/* Alt text */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Alt text</span>
                              <input
                                type="text"
                                value={imageAltText}
                                onChange={(e) => setImageAltText(e.target.value)}
                                placeholder="Describe the image..."
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Caption */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Caption</span>
                              <input
                                type="text"
                                value={imageCaption}
                                onChange={(e) => setImageCaption(e.target.value)}
                                placeholder="Optional caption..."
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Link on click toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5] mt-[8px]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Link on click</span>
                              <button
                                onClick={() => setImageLinkOnClick((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: imageLinkOnClick ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: imageLinkOnClick ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* URL input (visible when link on click is on) */}
                            <AnimatePresence initial={false}>
                              {imageLinkOnClick && (
                                <motion.div
                                  key="image-link-url"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className="pt-[8px] pb-[4px]">
                                    <input
                                      type="url"
                                      value={imageLinkUrl}
                                      onChange={(e) => setImageLinkUrl(e.target.value)}
                                      placeholder="https://..."
                                      className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Open in new tab toggle */}
                            <div className="flex items-center justify-between py-[9px] border-b border-[#f5f5f5]">
                              <span className="text-[13px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Open in new tab</span>
                              <button
                                onClick={() => setImageOpenInNewTab((v) => !v)}
                                className="relative shrink-0 cursor-pointer"
                                style={{ width: 36, height: 20 }}
                              >
                                <div
                                  className="absolute inset-0 rounded-[10px] transition-colors duration-200"
                                  style={{ background: imageOpenInNewTab ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF }}
                                />
                                <div
                                  className="absolute top-[2px] rounded-[8px] bg-white transition-all duration-200"
                                  style={{
                                    width: 16,
                                    height: 16,
                                    left: imageOpenInNewTab ? 18 : 2,
                                  }}
                                />
                              </button>
                            </div>

                            {/* Question text */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Question</span>
                              <input
                                type="text"
                                value={imageQuestion}
                                onChange={(e) => setImageQuestion(e.target.value)}
                                placeholder="What do you see in this image?"
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Description text */}
                            <div className="flex flex-col gap-[5px] pt-[12px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Description</span>
                              <input
                                type="text"
                                value={imageDescription}
                                onChange={(e) => setImageDescription(e.target.value)}
                                placeholder="Describe what's happening in the photo above."
                                className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[13px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.25)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CONDITIONAL LOGIC ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setImageSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        CONDITIONAL LOGIC
                      </span>
                      <motion.span
                        animate={{ rotate: imageSections.conditionalLogic ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {imageSections.conditionalLogic && (
                        <motion.div
                          key="image-cond-logic"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pt-[4px] pb-[14px]">
                            <BlockVisibilityConditions
                              conditions={showIfConditions}
                              onChange={setShowIfConditions}
                              priorScreens={priorScreensForActive}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button
                      onClick={() => setImageSections((p) => ({ ...p, appearance: !p.appearance }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        APPEARANCE
                      </span>
                      <motion.span
                        animate={{ rotate: imageSections.appearance ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#999]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {imageSections.appearance && (
                        <motion.div
                          key="image-appearance"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="flex flex-col gap-[12px] px-4 pt-[4px] pb-[14px]">

                            {/* Alignment */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Alignment</span>
                              <div className="flex items-center gap-[6px]">
                                {[
                                  { id: 'left', Icon: RiAlignLeft },
                                  { id: 'center', Icon: RiAlignCenter },
                                  { id: 'right', Icon: RiAlignRight },
                                ].map(({ id, Icon }) => (
                                  <button
                                    key={id}
                                    onClick={() => setImageAlignment(id)}
                                    className={`w-8 h-7 flex items-center justify-center rounded-[6px] border transition-colors cursor-pointer ${
                                      imageAlignment === id
                                        ? 'bg-white border-[#111]'
                                        : 'bg-white border-[#e0e0e0] hover:border-[#bbb]'
                                    }`}
                                  >
                                    <Icon size={14} className={imageAlignment === id ? 'text-[#111]' : 'text-[#777]'} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Width */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Width</span>
                              <div className="bg-[rgba(0,0,0,0.04)] flex gap-[2px] p-[3px] rounded-[8px]">
                                {['Fit', 'Full', 'Custom'].map((w) => (
                                  <button
                                    key={w}
                                    onClick={() => setImageWidth(w)}
                                    className={`flex-1 flex items-center justify-center py-[5px] rounded-[6px] text-[12px] transition-colors cursor-pointer ${
                                      imageWidth === w
                                        ? 'bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.1)] text-[#111] font-medium'
                                        : 'text-[#777] font-normal hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {w}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Corner radius */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Corner radius</span>
                              <div className="flex items-center gap-[10px]">
                                <input
                                  type="range"
                                  min={0}
                                  max={24}
                                  value={imageCornerRadius}
                                  onChange={(e) => setImageCornerRadius(Number(e.target.value))}
                                  className="flex-1 h-[3px] accent-[#111] cursor-pointer"
                                />
                                <span className="text-[12px] text-[#555] min-w-[20px] text-right" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                  {imageCornerRadius}
                                </span>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Video Configure panel ── */}
        <AnimatePresence>
          {showVideoConfigPanel && (
            <BuilderRightPanelShell panelKey="video-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowVideoConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>VIDEO</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  {/* Field Settings */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setVideoSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: videoSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {videoSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            {/* Question */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={videoQuestion} onChange={(e) => setVideoQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            {/* Description */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Description</label>
                              <textarea value={videoDescription} onChange={(e) => setVideoDescription(e.target.value)} rows={2}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors resize-none" />
                            </div>
                            {/* Video Source */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Video Source</label>
                              <Select
                                value={videoSource}
                                onValueChange={setVideoSource}
                                options={[
                                  { value: 'youtube', label: 'YouTube' },
                                  { value: 'vimeo', label: 'Vimeo' },
                                ]}
                                triggerClassName="text-[12px] py-[7px]"
                              />
                            </div>
                            {/* Video URL */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Video URL</label>
                              <input type="text" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube or Vimeo URL"
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            {/* Caption */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Caption</label>
                              <input type="text" value={videoCaption} onChange={(e) => setVideoCaption(e.target.value)} placeholder="Optional caption"
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            {/* Toggles */}
                            {[
                              { label: 'Required', val: videoRequired, set: setVideoRequired },
                              { label: 'Hidden', val: videoHidden, set: setVideoHidden },
                              { label: 'Loop', val: videoLoop, set: setVideoLoop },
                              { label: 'Autoplay', val: videoAutoplay, set: setVideoAutoplay },
                              { label: 'Show controls', val: videoShowControls, set: setVideoShowControls },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]">{label}</span>
                                <button onClick={() => set(!val)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${val ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                  <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${val ? 'left-[18px]' : 'left-[2px]'}`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Appearance */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setVideoSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
                      <motion.span animate={{ rotate: videoSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {videoSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            {/* Width */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Width</label>
                              <div className="flex gap-1">
                                {['Full', 'Wide', 'Medium', 'Small'].map((w) => (
                                  <button key={w} onClick={() => setVideoWidth(w)}
                                    className={`flex-1 text-[11px] py-[6px] rounded-[5px] border transition-colors ${videoWidth === w ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    {w}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Aspect ratio */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Aspect Ratio</label>
                              <div className="flex gap-1">
                                {['16:9', '4:3', '1:1'].map((r) => (
                                  <button key={r} onClick={() => setVideoAspectRatio(r)}
                                    className={`flex-1 text-[11px] py-[6px] rounded-[5px] border transition-colors ${videoAspectRatio === r ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    {r}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Corner Radius */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-[6px]">Corner Radius: {videoCornerRadius}px</label>
                              <input type="range" min={0} max={24} value={videoCornerRadius} onChange={(e) => setVideoCornerRadius(Number(e.target.value))} className="w-full accent-[#111]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Contact Configure panel ── */}
        <AnimatePresence>
          {showContactConfigPanel && (
            <BuilderRightPanelShell panelKey="contact-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowContactConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>CONTACT</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  {/* Field Settings */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setContactSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: contactSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {contactSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={contactQuestion} onChange={(e) => setContactQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={contactHelperText} onChange={(e) => setContactHelperText(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Required</span>
                              <button onClick={() => setContactRequired(!contactRequired)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${contactRequired ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${contactRequired ? 'left-[18px]' : 'left-[2px]'}`} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fields */}
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setContactSections((p) => ({ ...p, fields: !p.fields }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELDS</span>
                      <motion.span animate={{ rotate: contactSections.fields ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {contactSections.fields && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-2">
                            {[
                              { key: 'firstName', label: 'First Name' },
                              { key: 'lastName', label: 'Last Name' },
                              { key: 'email', label: 'Email Address' },
                              { key: 'phone', label: 'Phone' },
                              { key: 'company', label: 'Company' },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between py-[6px] border-b border-[rgba(0,0,0,0.05)] last:border-0">
                                <span className="text-[12px] text-[#333]">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#aaa]">Req</span>
                                  <button onClick={() => setContactFields((p) => ({ ...p, [key]: { ...p[key], required: !p[key].required } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${contactFields[key]?.required ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${contactFields[key]?.required ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                  <span className="text-[10px] text-[#aaa]">Show</span>
                                  <button onClick={() => setContactFields((p) => ({ ...p, [key]: { ...p[key], visible: !p[key].visible } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${contactFields[key]?.visible !== false ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${contactFields[key]?.visible !== false ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Address Configure panel ── */}
        <AnimatePresence>
          {showAddressConfigPanel && (
            <BuilderRightPanelShell panelKey="address-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowAddressConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>ADDRESS</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setAddressSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: addressSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {addressSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={addressQuestion} onChange={(e) => setAddressQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={addressHelperText} onChange={(e) => setAddressHelperText(e.target.value)} placeholder="Optional helper text"
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Required</span>
                              <button onClick={() => setAddressRequired(!addressRequired)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${addressRequired ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${addressRequired ? 'left-[18px]' : 'left-[2px]'}`} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setAddressSections((p) => ({ ...p, fields: !p.fields }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELDS</span>
                      <motion.span animate={{ rotate: addressSections.fields ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {addressSections.fields && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-2">
                            {[
                              { key: 'street', label: 'Street Address' },
                              { key: 'city', label: 'City' },
                              { key: 'state', label: 'State / Region' },
                              { key: 'postal', label: 'Postal Code' },
                              { key: 'country', label: 'Country' },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between py-[6px] border-b border-[rgba(0,0,0,0.05)] last:border-0">
                                <span className="text-[12px] text-[#333]">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#aaa]">Req</span>
                                  <button onClick={() => setAddressFields((p) => ({ ...p, [key]: { ...p[key], required: !p[key].required } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${addressFields[key]?.required ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${addressFields[key]?.required ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                  <span className="text-[10px] text-[#aaa]">Show</span>
                                  <button onClick={() => setAddressFields((p) => ({ ...p, [key]: { ...p[key], visible: !p[key].visible } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${addressFields[key]?.visible !== false ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${addressFields[key]?.visible !== false ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Work Info Configure panel ── */}
        <AnimatePresence>
          {showWorkConfigPanel && (
            <BuilderRightPanelShell panelKey="work-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowWorkConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>WORK INFO</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setWorkSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: workSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {workSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={workQuestion} onChange={(e) => setWorkQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={workHelperText} onChange={(e) => setWorkHelperText(e.target.value)} placeholder="Optional helper text"
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Required</span>
                              <button onClick={() => setWorkRequired(!workRequired)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${workRequired ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${workRequired ? 'left-[18px]' : 'left-[2px]'}`} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setWorkSections((p) => ({ ...p, fields: !p.fields }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELDS</span>
                      <motion.span animate={{ rotate: workSections.fields ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {workSections.fields && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-2">
                            {[
                              { key: 'company', label: 'Company' },
                              { key: 'title', label: 'Job Title' },
                              { key: 'industry', label: 'Industry' },
                              { key: 'teamSize', label: 'Team Size' },
                            ].map(({ key, label }) => (
                              <div key={key} className="flex items-center justify-between py-[6px] border-b border-[rgba(0,0,0,0.05)] last:border-0">
                                <span className="text-[12px] text-[#333]">{label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-[#aaa]">Req</span>
                                  <button onClick={() => setWorkFields((p) => ({ ...p, [key]: { ...p[key], required: !p[key].required } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${workFields[key]?.required ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${workFields[key]?.required ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                  <span className="text-[10px] text-[#aaa]">Show</span>
                                  <button onClick={() => setWorkFields((p) => ({ ...p, [key]: { ...p[key], visible: !p[key].visible } }))}
                                    className={`w-7 h-[16px] rounded-full transition-colors relative appearance-none border-0 p-0 ${workFields[key]?.visible !== false ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                    <span className={`absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white transition-all ${workFields[key]?.visible !== false ? 'left-[16px]' : 'left-[2px]'}`} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Date Configure panel ── */}
        <AnimatePresence>
          {showDateConfigPanel && (
            <BuilderRightPanelShell panelKey="date-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowDateConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>DATE</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setDateSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: dateSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {dateSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={dateQuestion} onChange={(e) => setDateQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={dateHelperText} onChange={(e) => setDateHelperText(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Required</span>
                              <button onClick={() => setDateRequired(!dateRequired)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${dateRequired ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${dateRequired ? 'left-[18px]' : 'left-[2px]'}`} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Time Configure panel ── */}
        <AnimatePresence>
          {showTimeConfigPanel && (
            <BuilderRightPanelShell panelKey="time-config-panel" width={280}>
              <TimeConfigurePanel
                onClose={() => setShowTimeConfigPanel(false)}
                sections={timeSections}
                setSections={setTimeSections}
                timeRequired={timeRequired}
                setTimeRequired={setTimeRequired}
                timeUse12h={timeUse12h}
                setTimeUse12h={setTimeUse12h}
                timeShowSeconds={timeShowSeconds}
                setTimeShowSeconds={setTimeShowSeconds}
                timeMinTime={timeMinTime}
                setTimeMinTime={setTimeMinTime}
                timeMaxTime={timeMaxTime}
                setTimeMaxTime={setTimeMaxTime}
              />
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Short Text Configure panel ── */}
        <AnimatePresence>
          {showShortTextConfigPanel && (
            <BuilderRightPanelShell panelKey="shorttext-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowShortTextConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>SHORT TEXT</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  <div className="border-b border-[rgba(0,0,0,0.06)] px-0 pb-4">
                    <ResponseQualityScoringCard
                      enabled={shortTextResponseQualityEnabled}
                      onEnabledChange={setShortTextResponseQualityEnabled}
                      options={shortTextResponseQualityOptions}
                      onOptionsChange={setShortTextResponseQualityOptions}
                      onSave={handleSaveShortTextResponseQuality}
                    />
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setShortTextSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: shortTextSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {shortTextSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={shortTextQuestion} onChange={(e) => setShortTextQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={shortTextHelperText} onChange={(e) => setShortTextHelperText(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Placeholder</label>
                              <input type="text" value={shortTextPlaceholder} onChange={(e) => setShortTextPlaceholder(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Min chars</label>
                                <input type="number" min={0} value={shortTextMinChars} onChange={(e) => setShortTextMinChars(Number(e.target.value))}
                                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Max chars</label>
                                <input type="number" min={1} value={shortTextMaxChars} onChange={(e) => setShortTextMaxChars(Number(e.target.value))}
                                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Validation</label>
                              <Select
                                value={shortTextValidation}
                                onValueChange={setShortTextValidation}
                                options={['None', 'Email', 'URL', 'Number', 'Phone'].map((v) => ({
                                  value: v,
                                  label: v,
                                }))}
                                triggerClassName="text-[12px] py-[7px]"
                              />
                            </div>
                            {[
                              { label: 'Required', val: shortTextRequired, set: setShortTextRequired },
                              { label: 'Hidden', val: shortTextHidden, set: setShortTextHidden },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]">{label}</span>
                                <button onClick={() => set(!val)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${val ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                  <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${val ? 'left-[18px]' : 'left-[2px]'}`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setShortTextSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
                      <motion.span animate={{ rotate: shortTextSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {shortTextSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Size</label>
                              <div className="flex gap-1">
                                {['S', 'M', 'L'].map((s) => (
                                  <button key={s} onClick={() => setShortTextSize(s)}
                                    className={`flex-1 text-[11px] py-[6px] rounded-[5px] border transition-colors ${shortTextSize === s ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Alignment</label>
                              <div className="flex gap-1">
                                {[{ v: 'left', Icon: RiAlignLeft }, { v: 'center', Icon: RiAlignCenter }, { v: 'right', Icon: RiAlignRight }].map(({ v, Icon }) => (
                                  <button key={v} onClick={() => setShortTextAlign(v)}
                                    className={`flex-1 text-[14px] py-[5px] rounded-[5px] border transition-colors ${shortTextAlign === v ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    <Icon size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Long Text Configure panel ── */}
        <AnimatePresence>
          {showLongTextConfigPanel && (
            <BuilderRightPanelShell panelKey="longtext-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowLongTextConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                <div className="px-4 pt-[10px] pb-[8px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>LONG TEXT</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  <div className="border-b border-[rgba(0,0,0,0.06)] px-0 pb-4">
                    <ResponseQualityScoringCard
                      enabled={responseQualityEnabled}
                      onEnabledChange={setResponseQualityEnabled}
                      options={responseQualityOptions}
                      onOptionsChange={setResponseQualityOptions}
                      onSave={handleSaveLongTextResponseQuality}
                    />
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setLongTextSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: longTextSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {longTextSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={longTextQuestion} onChange={(e) => setLongTextQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={longTextHelperText} onChange={(e) => setLongTextHelperText(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Placeholder</label>
                              <input type="text" value={longTextPlaceholder} onChange={(e) => setLongTextPlaceholder(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Min chars</label>
                                <input type="number" min={0} value={longTextMinChars} onChange={(e) => setLongTextMinChars(Number(e.target.value))}
                                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Max chars</label>
                                <input type="number" min={1} value={longTextMaxChars} onChange={(e) => setLongTextMaxChars(Number(e.target.value))}
                                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Validation</label>
                              <Select
                                value={longTextValidation}
                                onValueChange={setLongTextValidation}
                                options={['None', 'Email', 'URL'].map((v) => ({
                                  value: v,
                                  label: v,
                                }))}
                                triggerClassName="text-[12px] py-[7px]"
                              />
                            </div>
                            {[
                              { label: 'Required', val: longTextRequired, set: setLongTextRequired },
                              { label: 'Hidden', val: longTextHidden, set: setLongTextHidden },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]">{label}</span>
                                <button onClick={() => set(!val)} className={`w-8 h-[18px] rounded-full transition-colors relative appearance-none border-0 p-0 ${val ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                  <span className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all ${val ? 'left-[18px]' : 'left-[2px]'}`} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-[rgba(0,0,0,0.06)]">
                    <button onClick={() => setLongTextSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
                      <motion.span animate={{ rotate: longTextSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {longTextSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Size</label>
                              <div className="flex gap-1">
                                {['S', 'M', 'L'].map((s) => (
                                  <button key={s} onClick={() => setLongTextSize(s)}
                                    className={`flex-1 text-[11px] py-[6px] rounded-[5px] border transition-colors ${longTextSize === s ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Alignment</label>
                              <div className="flex gap-1">
                                {[{ v: 'left', Icon: RiAlignLeft }, { v: 'center', Icon: RiAlignCenter }, { v: 'right', Icon: RiAlignRight }].map(({ v, Icon }) => (
                                  <button key={v} onClick={() => setLongTextAlign(v)}
                                    className={`flex-1 text-[14px] py-[5px] rounded-[5px] border transition-colors ${longTextAlign === v ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#555] border-[rgba(0,0,0,0.12)] hover:border-[#999]'}`}>
                                    <Icon size={14} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Single Choice Configure panel ── */}
        <AnimatePresence>
          {showSingleConfigPanel && (
            <BuilderRightPanelShell panelKey="single-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowSingleConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {/* FIELD SETTINGS section */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button onClick={() => setSingleSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: singleSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {singleSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-[6px] flex flex-col gap-3">
                            {/* Question */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={singleQuestion} onChange={(e) => setSingleQuestion(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            {/* Helper text */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={singleHelperText} onChange={(e) => setSingleHelperText(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>
                            {/* Options */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Options</label>
                              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto pr-[2px]">
                                {singleOptions.map((opt, i) => (
                                  <div key={i} className="flex gap-1 items-center">
                                    <input type="text" value={opt}
                                      onChange={(e) => setSingleOptions((prev) => prev.map((o, idx) => idx === i ? e.target.value : o))}
                                      className="flex-1 border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[6px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                                    <button onClick={() => setSingleOptions((prev) => prev.filter((_, idx) => idx !== i))}
                                      className="text-[#d63030] text-[16px] leading-none px-1 cursor-pointer hover:text-[#b02020] shrink-0">×</button>
                                  </div>
                                ))}
                              </div>
                              <button onClick={() => setSingleOptions((prev) => [...prev, `Option ${prev.length + 1}`])}
                                className="w-full text-[11px] text-[#555] border border-dashed border-[rgba(0,0,0,0.15)] rounded-[6px] py-[6px] mt-1 cursor-pointer hover:border-[#999] transition-colors">
                                + Add option
                              </button>
                            </div>
                            {/* Toggles */}
                            {[
                              { label: 'Required', val: singleRequired, set: setSingleRequired },
                              { label: 'Multiple select', val: singleMultipleSelect, set: setSingleMultipleSelect },
                              { label: 'Randomise order', val: singleRandomize, set: setSingleRandomize },
                              { label: 'Allow "Other"', val: singleAllowOther, set: setSingleAllowOther },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                <button
                                  onClick={() => set(!val)}
                                  className="relative shrink-0 transition-colors"
                                  style={{ width: 34, height: 20, borderRadius: 10, background: val ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF, padding: 3, display: 'flex', alignItems: 'center', justifyContent: val ? 'flex-end' : 'flex-start' }}
                                >
                                  <span style={{ width: 14, height: 14, borderRadius: 7, background: 'white', display: 'block' }} />
                                </button>
                              </div>
                            ))}
                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />
                            {/* Min / Max choices */}
                            {[
                              { label: 'Min choices', val: singleMinChoices, set: setSingleMinChoices, isInfinite: false },
                              { label: 'Max choices', val: singleMaxChoices, set: setSingleMaxChoices, isInfinite: true },
                            ].map(({ label, val, set, isInfinite }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                <div className="flex items-center gap-[6px] bg-[rgba(0,0,0,0.04)] rounded-[7px] px-[6px] py-[4px]">
                                  <button
                                    onClick={() => set((p) => {
                                      if (isInfinite && p === null) return singleOptions.length;
                                      return Math.max(0, (p ?? 0) - 1);
                                    })}
                                    className="w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[#444] text-[14px] leading-none cursor-pointer hover:bg-white transition-colors shrink-0"
                                  >−</button>
                                  <span className="min-w-[28px] text-center text-[13px] font-medium text-[#111]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                    {isInfinite && val === null ? '∞' : val}
                                  </span>
                                  <button
                                    onClick={() => set((p) => {
                                      if (isInfinite && p === null) return null;
                                      const next = (p ?? 0) + 1;
                                      if (isInfinite && next > singleOptions.length + 2) return null;
                                      return next;
                                    })}
                                    className="w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[#444] text-[14px] leading-none cursor-pointer hover:bg-white transition-colors shrink-0"
                                  >+</button>
                                </div>
                              </div>
                            ))}
                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />
                            {/* Show keyboard hints */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Show keyboard hints</span>
                              <button
                                onClick={() => setSingleShowKeyboardHints(!singleShowKeyboardHints)}
                                className="relative shrink-0 transition-colors"
                                style={{ width: 34, height: 20, borderRadius: 10, background: singleShowKeyboardHints ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF, padding: 3, display: 'flex', alignItems: 'center', justifyContent: singleShowKeyboardHints ? 'flex-end' : 'flex-start' }}
                              >
                                <span style={{ width: 14, height: 14, borderRadius: 7, background: 'white', display: 'block' }} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* APPEARANCE section */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button onClick={() => setSingleSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-bold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
                      <motion.span animate={{ rotate: singleSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {singleSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-[6px] flex flex-col gap-3">
                            {/* Layout */}
                            <div>
                              <label className="text-[12px] text-[#444] block mb-[6px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Layout</label>
                              <div className="bg-[rgba(0,0,0,0.04)] p-[2px] rounded-[7px] grid grid-cols-3 gap-[2px]">
                                {['List', '2 col', '3 col'].map((l) => {
                                  const val = l === '2 col' ? '2col' : l === '3 col' ? '3col' : 'List';
                                  const active = singleLayout === val;
                                  return (
                                    <button key={l} onClick={() => setSingleLayout(val)}
                                      className={`text-[11.5px] py-[6px] rounded-[5px] transition-colors ${active ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-sm' : 'text-[#777]'}`}
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                      {l}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            {/* Option height */}
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Option height</label>
                              <div className="bg-[rgba(0,0,0,0.04)] p-[2px] rounded-[7px] grid grid-cols-3 gap-[2px] w-[108px]">
                                {['S', 'M', 'L'].map((s) => {
                                  const active = singleOptionHeight === s;
                                  return (
                                    <button key={s} onClick={() => setSingleOptionHeight(s)}
                                      className={`text-[11.5px] py-[6px] rounded-[5px] transition-colors ${active ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-sm' : 'text-[#777]'}`}
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                      {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Multiple Choice Configure panel ── */}
        <AnimatePresence>
          {showMultipleConfigPanel && (
            <BuilderRightPanelShell panelKey="multiple-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>

                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button
                    onClick={() => setShowMultipleConfigPanel(false)}
                    className="w-[20px] h-[20px] bg-[#f0eeea] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors"
                  >
                    <RiCloseLine size={11} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setMultipleSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span
                        animate={{ rotate: multipleSections.fieldSettings ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {multipleSections.fieldSettings && (
                        <motion.div
                          key="multiple-field-settings"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pt-[6px] pb-[14px] flex flex-col gap-[12px]">

                            {/* Toggle rows */}
                            {[
                              { label: 'Required', val: multipleRequired, set: setMultipleRequired },
                              { label: 'Multiple select', val: multipleMultipleSelect, set: setMultipleMultipleSelect },
                              { label: 'Randomise order', val: multipleRandomize, set: setMultipleRandomize },
                              { label: 'Allow "Other"', val: multipleAllowOther, set: setMultipleAllowOther },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                <button
                                  onClick={() => set(!val)}
                                  className="relative shrink-0 transition-colors"
                                  style={{ width: 34, height: 20, borderRadius: 10, background: val ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF, padding: 3, display: 'flex', alignItems: 'center', justifyContent: val ? 'flex-end' : 'flex-start' }}
                                >
                                  <span style={{ width: 14, height: 14, borderRadius: 7, background: 'white', display: 'block' }} />
                                </button>
                              </div>
                            ))}

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Min / Max choices steppers */}
                            {[
                              { label: 'Min choices', val: multipleMinChoices, set: setMultipleMinChoices, isInfinite: false },
                              { label: 'Max choices', val: multipleMaxChoices, set: setMultipleMaxChoices, isInfinite: true },
                            ].map(({ label, val, set, isInfinite }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                                <div className="flex items-center gap-[6px] bg-[rgba(0,0,0,0.04)] rounded-[7px] px-[6px] py-[4px]">
                                  <button
                                    onClick={() => set((p) => {
                                      if (isInfinite && p === null) return multipleOptions.length;
                                      return Math.max(0, (p ?? 0) - 1);
                                    })}
                                    className="w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[#444] text-[14px] leading-none cursor-pointer hover:bg-white transition-colors shrink-0"
                                  >−</button>
                                  <span className="min-w-[28px] text-center text-[13px] font-medium text-[#111]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                                    {isInfinite && val === null ? '∞' : val}
                                  </span>
                                  <button
                                    onClick={() => set((p) => {
                                      if (isInfinite && p === null) return null;
                                      const next = (p ?? 0) + 1;
                                      if (isInfinite && next > multipleOptions.length + 2) return null;
                                      return next;
                                    })}
                                    className="w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[#444] text-[14px] leading-none cursor-pointer hover:bg-white transition-colors shrink-0"
                                  >+</button>
                                </div>
                              </div>
                            ))}

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Show keyboard hints */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Show keyboard hints</span>
                              <button
                                onClick={() => setMultipleShowKeyboardHints(!multipleShowKeyboardHints)}
                                className="relative shrink-0 transition-colors"
                                style={{ width: 34, height: 20, borderRadius: 10, background: multipleShowKeyboardHints ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF, padding: 3, display: 'flex', alignItems: 'center', justifyContent: multipleShowKeyboardHints ? 'flex-end' : 'flex-start' }}
                              >
                                <span style={{ width: 14, height: 14, borderRadius: 7, background: 'white', display: 'block' }} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── OPTIONS ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setMultipleSections((p) => ({ ...p, options: !p.options }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>OPTIONS</span>
                      <motion.span
                        animate={{ rotate: multipleSections.options ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {multipleSections.options && (
                        <motion.div
                          key="multiple-options"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pt-[6px] pb-[14px] flex flex-col gap-[8px]">
                            {/* Question */}
                            <div className="flex flex-col gap-[5px]">
                              <label className="text-[11px] font-semibold text-[#888] uppercase tracking-[0.5px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Question</label>
                              <input
                                type="text"
                                value={multipleQuestion}
                                onChange={(e) => setMultipleQuestion(e.target.value)}
                                className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] text-[#111] outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>
                            {/* Helper text */}
                            <div className="flex flex-col gap-[5px]">
                              <label className="text-[11px] font-semibold text-[#888] uppercase tracking-[0.5px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Helper text</label>
                              <input
                                type="text"
                                value={multipleHelperText}
                                onChange={(e) => setMultipleHelperText(e.target.value)}
                                placeholder="Optional helper text"
                                className="w-full bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] text-[#111] placeholder-[#bbb] outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>
                            {/* Options list – scrollable */}
                            <div className="flex flex-col gap-[6px] max-h-[200px] overflow-y-auto pr-[2px]">
                              {multipleOptions.map((opt, i) => (
                                <div key={i} className="flex gap-[6px] items-center">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => setMultipleOptions((prev) => prev.map((o, idx) => idx === i ? e.target.value : o))}
                                    className="flex-1 bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[6px] text-[12px] text-[#111] outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors"
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  />
                                  <button
                                    onClick={() => setMultipleOptions((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="w-[22px] h-[22px] flex items-center justify-center text-[#bbb] text-[15px] leading-none cursor-pointer hover:text-[#d63030] transition-colors shrink-0"
                                  >×</button>
                                </div>
                              ))}
                            </div>
                            {/* Add option button */}
                            <button
                              onClick={() => setMultipleOptions((prev) => [...prev, `Option ${prev.length + 1}`])}
                              className="w-full text-[11.5px] text-[#555] border border-dashed border-[rgba(0,0,0,0.15)] rounded-[6px] py-[7px] cursor-pointer hover:border-[rgba(0,0,0,0.3)] hover:text-[#111] transition-colors"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              + Add option
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setMultipleSections((p) => ({ ...p, appearance: !p.appearance }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
                      <motion.span
                        animate={{ rotate: multipleSections.appearance ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex items-center shrink-0"
                      >
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {multipleSections.appearance && (
                        <motion.div
                          key="multiple-appearance"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="px-4 pt-[6px] pb-[14px] flex flex-col gap-[12px]">

                            {/* Layout */}
                            <div className="flex flex-col gap-[8px]">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Layout</label>
                              <div className="bg-[rgba(0,0,0,0.04)] p-[2px] rounded-[7px] grid grid-cols-3 gap-[2px]">
                                {[
                                  { label: 'List', val: 'List' },
                                  { label: '2 col', val: '2col' },
                                  { label: '3 col', val: '3col' },
                                ].map(({ label, val }) => {
                                  const active = multipleLayout === val;
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => setMultipleLayout(val)}
                                      className={`text-[11.5px] py-[6px] rounded-[5px] transition-colors ${active ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-sm' : 'text-[#777]'}`}
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Option height */}
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Option height</label>
                              <div className="bg-[rgba(0,0,0,0.04)] p-[2px] rounded-[7px] grid grid-cols-3 gap-[2px] w-[108px]">
                                {['S', 'M', 'L'].map((s) => {
                                  const active = multipleOptionHeight === s;
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => setMultipleOptionHeight(s)}
                                      className={`text-[11.5px] py-[6px] rounded-[5px] transition-colors ${active ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-sm' : 'text-[#777]'}`}
                                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                                    >
                                      {s}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Media Choices Configure panel ── */}
        <AnimatePresence>
          {showMediaConfigPanel && (
            <BuilderRightPanelShell panelKey="media-config-panel" width={300}>
              <div className="w-[300px] h-full bg-white border-l border-[#f0f0f0] flex flex-col" style={{ boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.08), 0px 0px 0px 1px rgba(0,0,0,0.06)' }}>
                {/* Header */}
                <div className="border-b border-[#f0f0f0] flex items-center justify-between px-4 py-[15px] shrink-0">
                  <span className="text-[14px] font-bold text-[#111] tracking-[-0.14px]" style={{ fontFamily: 'Arial, sans-serif' }}>Configure</span>
                  <button onClick={() => setShowMediaConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e8e8e8] transition-colors">
                    <RiCloseLine size={12} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>
                {/* Section label */}
                <div className="px-4 pt-[6px] pb-[10px] shrink-0">
                  <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: 'Arial, sans-serif' }}>MEDIA CHOICE</span>
                </div>
                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-t border-[#f0f0f0]">
                    <button onClick={() => setMediaSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: 'Arial, sans-serif' }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: mediaSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {mediaSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pt-1 pb-4 flex flex-col">
                            {/* Toggles */}
                            {[
                              { label: 'Required', val: mediaRequired, set: setMediaRequired },
                              { label: 'Multiple select', val: mediaAllowMultiple, set: setMediaAllowMultiple },
                              { label: 'Randomise order', val: mediaRandomiseOrder, set: setMediaRandomiseOrder },
                            ].map(({ label, val, set }, idx, arr) => (
                              <div key={label} className={`flex items-center justify-between py-[8px] ${idx < arr.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
                                <span className="text-[13px] text-[#222]" style={{ fontFamily: 'Arial, sans-serif' }}>{label}</span>
                                <button onClick={() => set(!val)} className={`w-9 h-5 rounded-[10px] transition-colors relative shrink-0 ${val ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                  <span className={`absolute top-[2px] w-4 h-4 rounded-[8px] bg-white transition-all ${val ? 'left-[18px]' : 'left-[2px]'}`} />
                                </button>
                              </div>
                            ))}
                            {/* Question */}
                            <div className="flex flex-col gap-[5px] pt-3">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Question</label>
                              <input type="text" value={mediaQuestion} onChange={(e) => setMediaQuestion(e.target.value)}
                                placeholder="Which image do you prefer?"
                                className="w-full border border-[#e8e8e8] rounded-[7px] px-[11px] py-[9px] text-[13px] bg-[#fafafa] outline-none focus:border-[#111] transition-colors" style={{ fontFamily: 'Arial, sans-serif' }} />
                            </div>
                            {/* Helper text */}
                            <div className="flex flex-col gap-[5px] pt-3">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Helper text</label>
                              <input type="text" value={mediaHelperText} onChange={(e) => setMediaHelperText(e.target.value)}
                                placeholder="Press Enter to continue"
                                className="w-full border border-[#e8e8e8] rounded-[7px] px-[11px] py-[9px] text-[13px] bg-[#fafafa] outline-none focus:border-[#111] transition-colors" style={{ fontFamily: 'Arial, sans-serif' }} />
                            </div>
                            {/* Min choices */}
                            <div className="flex flex-col gap-[5px] pt-3">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Min choices</label>
                              <div className="flex items-center gap-[10px]">
                                <button onClick={() => setMediaMinChoices((v) => Math.max(1, v - 1))}
                                  className="w-[26px] h-[26px] border border-[#e0e0e0] rounded-[6px] bg-white flex items-center justify-center text-[#555] text-[16px] leading-none cursor-pointer hover:border-[#999] transition-colors">−</button>
                                <span className="text-[13px] text-[#222] text-center min-w-[24px]" style={{ fontFamily: 'Arial, sans-serif' }}>{mediaMinChoices}</span>
                                <button onClick={() => setMediaMinChoices((v) => mediaMaxChoices === null ? v + 1 : Math.min(mediaMaxChoices, v + 1))}
                                  className="w-[26px] h-[26px] border border-[#e0e0e0] rounded-[6px] bg-white flex items-center justify-center text-[#555] text-[16px] leading-none cursor-pointer hover:border-[#999] transition-colors">+</button>
                              </div>
                            </div>
                            {/* Max choices */}
                            <div className="flex flex-col gap-[5px] pt-3">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Max choices</label>
                              <div className="flex items-center gap-[10px]">
                                <button onClick={() => setMediaMaxChoices((v) => v === null ? mediaOptions.length : Math.max(mediaMinChoices, v - 1))}
                                  className="w-[26px] h-[26px] border border-[#e0e0e0] rounded-[6px] bg-white flex items-center justify-center text-[#555] text-[16px] leading-none cursor-pointer hover:border-[#999] transition-colors">−</button>
                                <span className="text-[13px] text-[#222] text-center min-w-[24px]" style={{ fontFamily: 'Arial, sans-serif' }}>{mediaMaxChoices === null ? '∞' : mediaMaxChoices}</span>
                                <button onClick={() => setMediaMaxChoices((v) => v === null ? null : (v >= mediaOptions.length ? null : v + 1))}
                                  className="w-[26px] h-[26px] border border-[#e0e0e0] rounded-[6px] bg-white flex items-center justify-center text-[#555] text-[16px] leading-none cursor-pointer hover:border-[#999] transition-colors">+</button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── OPTIONS ── */}
                  <div className="border-t border-[#f0f0f0]">
                    <button onClick={() => setMediaSections((p) => ({ ...p, options: !p.options }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: 'Arial, sans-serif' }}>OPTIONS</span>
                      <motion.span animate={{ rotate: mediaSections.options ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {mediaSections.options && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pt-1 pb-4 flex flex-col gap-2">
                            {mediaOptions.map((opt, i) => (
                              <div key={i} className="border border-[#ebebeb] rounded-[8px] p-[11px] flex flex-col gap-2">
                                {/* Image upload area */}
                                <label className="block cursor-pointer">
                                  <input type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        const url = URL.createObjectURL(file);
                                        setMediaOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, image: url } : o));
                                      }
                                      e.target.value = '';
                                    }} />
                                  {opt.image ? (
                                    <div className="relative rounded-[8px] overflow-hidden border border-[#d0d0d0]">
                                      <img src={opt.image} alt={opt.label} className="w-full object-cover" style={{ aspectRatio: '16/4' }} />
                                      <button
                                        onClick={(e) => { e.preventDefault(); setMediaOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, image: null } : o)); }}
                                        className="absolute top-1 right-1 w-[18px] h-[18px] bg-black/50 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-black/70 transition-colors">×</button>
                                    </div>
                                  ) : (
                                    <div className="bg-[#fafafa] border border-dashed border-[#d0d0d0] rounded-[8px] py-[12px] flex items-center justify-center hover:border-[#999] hover:bg-[#f5f5f5] transition-colors">
                                      <span className="text-[13px] text-[#ccc]" style={{ fontFamily: 'Arial, sans-serif' }}>🖼 Upload image</span>
                                    </div>
                                  )}
                                </label>
                                {/* Label input + delete */}
                                <div className="flex items-center gap-2">
                                  <input type="text" value={opt.label}
                                    onChange={(e) => setMediaOptions((prev) => prev.map((o, idx) => idx === i ? { ...o, label: e.target.value } : o))}
                                    placeholder="Option label..."
                                    className="flex-1 border border-[#e8e8e8] rounded-[7px] px-[11px] py-[9px] text-[13px] bg-[#fafafa] outline-none focus:border-[#111] transition-colors" style={{ fontFamily: 'Arial, sans-serif' }} />
                                  {mediaOptions.length > 1 && (
                                    <button onClick={() => setMediaOptions((prev) => prev.filter((_, idx) => idx !== i))}
                                      className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[#d63030] hover:bg-red-50 transition-colors shrink-0 text-[14px] leading-none">×</button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button onClick={() => setMediaOptions((prev) => [...prev, { label: '', image: null }])}
                              className="border border-dashed border-[#d0d0d0] rounded-[7px] py-[10px] text-[12px] text-[#888] text-center cursor-pointer hover:border-[#999] hover:text-[#555] transition-colors w-full" style={{ fontFamily: 'Arial, sans-serif' }}>
                              + Add option
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CONDITIONAL LOGIC ── */}
                  <div className="border-t border-[#f0f0f0]">
                    <button onClick={() => setMediaSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: 'Arial, sans-serif' }}>CONDITIONAL LOGIC</span>
                      <motion.span animate={{ rotate: mediaSections.conditionalLogic ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {mediaSections.conditionalLogic && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pt-1 pb-4">
                            <BlockVisibilityConditions
                              conditions={showIfConditions}
                              onChange={setShowIfConditions}
                              priorScreens={priorScreensForActive}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-t border-[#f0f0f0]">
                    <button onClick={() => setMediaSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: 'Arial, sans-serif' }}>APPEARANCE</span>
                      <motion.span animate={{ rotate: mediaSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#999]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {mediaSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pt-1 pb-4 flex flex-col gap-3">
                            {/* Layout picker */}
                            <div className="flex flex-col gap-[5px]">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Layout</label>
                              <div className="flex gap-2">
                                {/* List */}
                                <button onClick={() => setMediaLayout('list')}
                                  className={`flex-1 flex flex-col items-center gap-1 py-[9px] px-2 rounded-[7px] border transition-colors ${mediaLayout === 'list' ? 'border-[#111]' : 'border-[#e0e0e0]'}`}>
                                  <div className="flex flex-col gap-[3px] w-full">
                                    {[0,1,2].map((k) => <div key={k} className={`h-1 rounded-[2px] w-full ${mediaLayout === 'list' ? 'bg-[#bbb]' : 'bg-[#e0e0e0]'}`} />)}
                                  </div>
                                  <span className={`text-[10px] ${mediaLayout === 'list' ? 'text-[#111]' : 'text-[#888]'}`} style={{ fontFamily: 'Arial, sans-serif' }}>List</span>
                                </button>
                                {/* 2 col */}
                                <button onClick={() => setMediaLayout('2col')}
                                  className={`flex-1 flex flex-col items-center gap-1 py-[9px] px-2 rounded-[7px] border transition-colors ${mediaLayout === '2col' ? 'border-[#111]' : 'border-[#e0e0e0]'}`}>
                                  <div className="grid grid-cols-2 gap-[3px] w-full">
                                    {[0,1,2,3].map((k) => <div key={k} className={`h-3 rounded-[2px] ${mediaLayout === '2col' ? 'bg-[#bbb]' : 'bg-[#e0e0e0]'}`} />)}
                                  </div>
                                  <span className={`text-[10px] ${mediaLayout === '2col' ? 'text-[#111]' : 'text-[#888]'}`} style={{ fontFamily: 'Arial, sans-serif' }}>2 col</span>
                                </button>
                                {/* 3 col */}
                                <button onClick={() => setMediaLayout('3col')}
                                  className={`flex-1 flex flex-col items-center gap-1 py-[9px] px-2 rounded-[7px] border transition-colors ${mediaLayout === '3col' ? 'border-[#111]' : 'border-[#e0e0e0]'}`}>
                                  <div className="grid grid-cols-3 gap-[3px] w-full">
                                    {[0,1,2,3,4,5].map((k) => <div key={k} className={`h-3 rounded-[2px] ${mediaLayout === '3col' ? 'bg-[#bbb]' : 'bg-[#e0e0e0]'}`} />)}
                                  </div>
                                  <span className={`text-[10px] ${mediaLayout === '3col' ? 'text-[#111]' : 'text-[#888]'}`} style={{ fontFamily: 'Arial, sans-serif' }}>3 col</span>
                                </button>
                              </div>
                            </div>
                            {/* Option height */}
                            <div className="flex flex-col gap-[5px]">
                              <label className="text-[12px] text-[#444]" style={{ fontFamily: 'Arial, sans-serif' }}>Option height</label>
                              <div className="flex gap-[6px]">
                                {['S', 'M', 'L'].map((size) => (
                                  <button key={size} onClick={() => setMediaOptionHeight(size)}
                                    className={`w-8 h-[28px] border rounded-[6px] text-[12px] transition-colors ${mediaOptionHeight === size ? 'border-[#111] text-[#111]' : 'border-[#e0e0e0] text-[#777] hover:border-[#999]'}`}
                                    style={{ fontFamily: 'Arial, sans-serif' }}>
                                    {size}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Captcha Configure panel ── */}
        <AnimatePresence>
          {showCaptchaConfigPanel && (
            <BuilderRightPanelShell panelKey="captcha-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>

                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowCaptchaConfigPanel(false)} className="w-[20px] h-[20px] bg-[#f0eeea] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={12} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCaptchaSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: captchaSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {captchaSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-[14px] pt-[2px] flex flex-col gap-3">

                            {/* Enabled toggle */}
                            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-[10px]">
                              <span className="text-[12px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Enabled</span>
                              <button
                                onClick={() => setCaptchaEnabled((v) => !v)}
                                className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${captchaEnabled ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}
                              >
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${captchaEnabled ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                            {/* Provider radio list */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Provider</span>
                              {[
                                { id: 'Google reCAPTCHA v3', subtitle: 'Invisible, score-based' },
                                { id: 'Google reCAPTCHA v2', subtitle: 'Checkbox "I\'m not a robot"' },
                                { id: 'hCaptcha', subtitle: 'Privacy-friendly alternative' },
                                { id: 'Cloudflare Turnstile', subtitle: 'Invisible, no challenges' },
                              ].map(({ id, subtitle }) => {
                                const selected = captchaProvider === id;
                                return (
                                  <button
                                    key={id}
                                    onClick={() => setCaptchaProvider(id)}
                                    className={`flex items-center gap-[10px] px-[13px] py-[10px] rounded-[8px] border text-left w-full cursor-pointer transition-colors ${
                                      selected
                                        ? 'bg-[#fafafa] border-[#111]'
                                        : 'bg-transparent border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.25)]'
                                    }`}
                                  >
                                    {/* Radio dot */}
                                    <div className={`w-[14px] h-[14px] rounded-[4px] border shrink-0 flex items-center justify-center transition-colors ${
                                      selected ? 'border-[#111]' : 'border-[#ccc]'
                                    }`}>
                                      {selected && <div className="w-[6px] h-[6px] rounded-[2px] bg-[#111]" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[12px] text-[#222] leading-[1.3]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{id}</span>
                                      <span className="text-[10.5px] text-[#aaa] leading-[1.3]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{subtitle}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.07)]" />

                            {/* Site key */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Site key</span>
                              <input
                                type="text"
                                value={captchaSiteKey}
                                onChange={(e) => setCaptchaSiteKey(e.target.value)}
                                placeholder="Enter your site key..."
                                className="w-full border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[12px] bg-[#fafafa] outline-none focus:border-[#111] focus:bg-white transition-colors placeholder:text-[#bbb]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                            {/* Secret key */}
                            <div className="flex flex-col gap-[5px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Secret key</span>
                              <input
                                type="password"
                                value={captchaSecretKey}
                                onChange={(e) => setCaptchaSecretKey(e.target.value)}
                                placeholder="Enter your secret key..."
                                className="w-full border border-[#e8e8e8] rounded-[7px] px-[11px] py-[8px] text-[12px] bg-[#fafafa] outline-none focus:border-[#111] focus:bg-white transition-colors placeholder:text-[#bbb]"
                                style={{ fontFamily: "'DM Sans', sans-serif" }}
                              />
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── BEHAVIOUR ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCaptchaSections((p) => ({ ...p, behaviour: !p.behaviour }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>BEHAVIOUR</span>
                      <motion.span animate={{ rotate: captchaSections.behaviour ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {captchaSections.behaviour && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-[14px] pt-[6px] flex flex-col gap-3">

                            {/* Visibility mode segmented */}
                            <div className="flex flex-col gap-[6px]">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Visibility mode</span>
                              <div className="bg-[rgba(0,0,0,0.04)] rounded-[7px] p-[2px] grid grid-cols-2 gap-[2px]">
                                {['invisible', 'visible'].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => setCaptchaVisibility(v)}
                                    className={`py-[6px] rounded-[5px] text-[11.5px] capitalize text-center cursor-pointer transition-colors ${
                                      captchaVisibility === v
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                        : 'text-[#777] hover:text-[#444]'
                                    }`}
                                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                                  >
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.07)]" />

                            {/* Show badge toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Show badge</span>
                              <button
                                onClick={() => setCaptchaShowBadge((v) => !v)}
                                className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${captchaShowBadge ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}
                              >
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${captchaShowBadge ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                            {/* Badge position — only visible when badge is shown */}
                            <AnimatePresence initial={false}>
                              {captchaShowBadge && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden flex flex-col gap-[6px]">
                                  <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Badge position</span>
                                  <div className="bg-[rgba(0,0,0,0.04)] rounded-[7px] p-[2px] grid grid-cols-3 gap-[2px]">
                                    {[
                                      { id: 'bottom-right', label: 'Bottom right' },
                                      { id: 'bottom-left',  label: 'Bottom left' },
                                      { id: 'inline',       label: 'Inline' },
                                    ].map(({ id, label }) => (
                                      <button
                                        key={id}
                                        onClick={() => setCaptchaBadgePosition(id)}
                                        className={`py-[6px] rounded-[5px] text-[10.5px] text-center cursor-pointer transition-colors ${
                                          captchaBadgePosition === id
                                            ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                            : 'text-[#777] hover:text-[#444]'
                                        }`}
                                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.07)]" />

                            {/* Block on failure toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Block on failure</span>
                              <button
                                onClick={() => setCaptchaBlockOnFailure((v) => !v)}
                                className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${captchaBlockOnFailure ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}
                              >
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${captchaBlockOnFailure ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CONDITIONAL LOGIC ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setCaptchaSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.235px] uppercase text-[#bbb]" style={{ fontFamily: "'DM Sans', sans-serif" }}>CONDITIONAL LOGIC</span>
                      <motion.span animate={{ rotate: captchaSections.conditionalLogic ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={12} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {captchaSections.conditionalLogic && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-[14px] pt-[6px] flex flex-col gap-[10px]">
                            <BlockVisibilityConditions
                              conditions={showIfConditions}
                              onChange={setShowIfConditions}
                              priorScreens={priorScreensForActive}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Multi-image upload Configure panel ── */}
        <AnimatePresence>
          {showMultiImageConfigPanel && (
            <BuilderRightPanelShell panelKey="multi-image-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>

                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]">Configure</span>
                  <button onClick={() => setShowMultiImageConfigPanel(false)} className="w-[20px] h-[20px] bg-[#f0eeea] rounded-[5px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={12} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setMultiImageSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.2px] uppercase text-[#bbb]">FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: multiImageSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {multiImageSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">

                            {/* Question */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Question</label>
                              <input type="text" value={configureIsUpload ? uploadQuestion : multiImageQuestion} onChange={(e) => (configureIsUpload ? setUploadQuestion : setMultiImageQuestion)(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>

                            {/* Helper text */}
                            <div>
                              <label className="text-[10px] font-semibold text-[#888] uppercase tracking-[0.5px] block mb-1">Helper Text</label>
                              <input type="text" value={configureIsUpload ? uploadHelperText : multiImageHelperText} onChange={(e) => (configureIsUpload ? setUploadHelperText : setMultiImageHelperText)(e.target.value)}
                                className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-3 py-[7px] text-[12px] bg-white outline-none focus:border-[#111] transition-colors" />
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Required toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Required</span>
                              <button onClick={() => setMultiImageRequired(p => !p)} className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${multiImageRequired ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${multiImageRequired ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                            {/* Multiple files toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Multiple files</span>
                              <button onClick={() => setMultiImageMultipleFiles(p => !p)} className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${multiImageMultipleFiles ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${multiImageMultipleFiles ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Max files stepper */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Max files</span>
                              <div className="flex items-center gap-[6px] bg-[rgba(0,0,0,0.04)] rounded-[7px] px-[6px] py-[4px]">
                                <button
                                  onClick={() => setMultiImageMaxFiles(p => Math.max(1, p - 1))}
                                  disabled={multiImageMaxFiles <= 1}
                                  className={`w-[20px] h-[20px] rounded-[5px] bg-[rgba(255,255,255,0.8)] flex items-center justify-center transition-colors text-[14px] leading-none font-light select-none ${multiImageMaxFiles <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white text-[#111]'}`}
                                >−</button>
                                <span className="text-[13px] font-medium text-[#111] min-w-[28px] text-center">{multiImageMaxFiles}</span>
                                <button
                                  onClick={() => setMultiImageMaxFiles(p => Math.min(9, p + 1))}
                                  disabled={multiImageMaxFiles >= 9}
                                  className={`w-[20px] h-[20px] rounded-[5px] bg-[rgba(255,255,255,0.8)] flex items-center justify-center transition-colors text-[14px] leading-none font-light select-none ${multiImageMaxFiles >= 9 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-white text-[#111]'}`}
                                >+</button>
                              </div>
                            </div>

                            {/* Max file size dropdown */}
                            <div className="flex flex-col gap-[6px]">
                              <span className="text-[12px] text-[#444]">Max file size</span>
                              <div className="relative">
                                <button
                                  onClick={() => setMultiImageSizeDropdownOpen(p => !p)}
                                  className="w-full border border-[rgba(0,0,0,0.12)] rounded-[6px] px-[11px] py-[9px] text-[12.5px] text-[#1a1a1a] bg-white flex items-center justify-between cursor-pointer hover:border-[#999] transition-colors"
                                  style={{ borderRadius: multiImageSizeDropdownOpen ? '6px 6px 0 0' : '6px', borderColor: multiImageSizeDropdownOpen ? '#888' : undefined }}
                                >
                                  <span>{configureMaxFileSize}</span>
                                  <RiArrowDownSLine size={14} className={`text-[#888] transition-transform ${multiImageSizeDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {multiImageSizeDropdownOpen && (
                                  <div className="absolute z-20 left-0 right-0 bg-white border border-t-0 border-[#b0b0ae] rounded-b-[6px] overflow-hidden shadow-[0px_8px_24px_rgba(0,0,0,0.1)]">
                                    {['1 MB', '5 MB', '10 MB', '25 MB', '50 MB', '100 MB', 'No limit'].map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => { setConfigureMaxFileSize(opt); setMultiImageSizeDropdownOpen(false); }}
                                        className={`w-full flex items-center justify-between px-[10px] py-[8px] text-[12.5px] cursor-pointer transition-colors ${configureMaxFileSize === opt ? 'bg-[#ebebea] font-medium' : 'hover:bg-[#f5f4f0]'} text-[#1a1a1a]`}
                                      >
                                        <span>{opt}</span>
                                        {configureMaxFileSize === opt && <span className="text-[11px]">✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Accepted types pill toggles */}
                            <div className="flex flex-col gap-[10px]">
                              <span className="text-[12px] text-[#444]">Accepted types</span>
                              <div className="flex flex-wrap gap-[6px]">
                                {['PDF', 'PNG', 'JPG', 'DOCX', 'XLSX', 'MP4', 'ZIP', 'Any'].map(type => {
                                  const isOn = multiImageAcceptedTypes.includes(type);
                                  return (
                                    <button
                                      key={type}
                                      onClick={() => {
                                        if (type === 'Any') {
                                          setMultiImageAcceptedTypes(['Any']);
                                        } else {
                                          setMultiImageAcceptedTypes(prev => {
                                            const without = prev.filter(t => t !== 'Any');
                                            return without.includes(type) ? without.filter(t => t !== type) : [...without, type];
                                          });
                                        }
                                      }}
                                      className={`px-[10px] py-[5px] rounded-[20px] text-[11px] border cursor-pointer transition-colors ${
                                        isOn
                                          ? 'bg-[#111] border-[#111] text-white'
                                          : 'bg-[rgba(0,0,0,0.04)] border-[rgba(0,0,0,0.15)] text-[#444] hover:border-[#999]'
                                      }`}
                                    >{type}</button>
                                  );
                                })}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button
                      onClick={() => setMultiImageSections((p) => ({ ...p, appearance: !p.appearance }))}
                      className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer"
                    >
                      <span className="text-[9.5px] font-semibold tracking-[1.2px] uppercase text-[#bbb]">APPEARANCE</span>
                      <motion.span animate={{ rotate: multiImageSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {multiImageSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">

                            {/* Upload zone size segmented control */}
                            <div className="flex flex-col gap-[8px]">
                              <span className="text-[12px] text-[#444]">Upload zone size</span>
                              <div className="bg-[rgba(0,0,0,0.04)] rounded-[7px] p-[2px] grid grid-cols-3 gap-[2px]">
                                {['Compact', 'Default', 'Large'].map(size => (
                                  <button
                                    key={size}
                                    onClick={() => setMultiImageUploadZoneSize(size)}
                                    className={`py-[6px] rounded-[5px] text-[11.5px] text-center cursor-pointer transition-colors ${
                                      multiImageUploadZoneSize === size
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                        : 'text-[#777] hover:text-[#444]'
                                    }`}
                                  >{size}</button>
                                ))}
                              </div>
                            </div>

                            {/* Show preview toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Show preview</span>
                              <button onClick={() => setMultiImageShowPreview(p => !p)} className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${multiImageShowPreview ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${multiImageShowPreview ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── Rating Configure panel ── */}
        <AnimatePresence>
          {showRatingConfigPanel && (
            <BuilderRightPanelShell panelKey="rating-config-panel" width={280}>
              <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>

                {/* Header */}
                <div className="border-b border-[rgba(0,0,0,0.09)] flex items-center justify-between py-[13px] px-4 shrink-0">
                  <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
                  <button onClick={() => setShowRatingConfigPanel(false)} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
                    <RiCloseLine size={13} className="text-[#666] shrink-0" aria-hidden />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">

                  {/* ── FIELD SETTINGS section ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button onClick={() => setRatingSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-semibold tracking-[1.2px] uppercase text-[#bbb]">FIELD SETTINGS</span>
                      <motion.span animate={{ rotate: ratingSections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {ratingSections.fieldSettings && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-4">

                            <div className="flex flex-col gap-[8px]">
                              <span className="text-[12px] text-[#444]">Question</span>
                              <input
                                type="text"
                                value={ratingQuestion}
                                onChange={(e) => setRatingQuestion(e.target.value)}
                                className="w-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[7px] text-[12px] text-[#111] outline-none focus:border-[#111] transition-colors"
                              />
                            </div>

                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Toggles: Required, Use scale, Use slider */}
                            {[
                              { label: 'Required', val: ratingRequired, set: setRatingRequired },
                              { label: 'Use scale', val: ratingUseScale, set: setRatingUseScale },
                              { label: 'Use slider', val: ratingUseSlider, set: setRatingUseSlider },
                            ].map(({ label, val, set }) => (
                              <div key={label} className="flex items-center justify-between">
                                <span className="text-[12px] text-[#444]">{label}</span>
                                <button onClick={() => set(!val)} className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${val ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                  <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${val ? 'left-[17px]' : 'left-[3px]'}`} />
                                </button>
                              </div>
                            ))}

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Max rating stepper */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Max rating</span>
                              <div className="flex items-center gap-[6px] bg-[rgba(0,0,0,0.04)] rounded-[7px] px-[6px] py-[4px]">
                                <button
                                  onClick={() => setRatingMaxRating((p) => Math.max(ratingStyle === '1-10' ? 10 : 2, p - 1))}
                                  className="w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[14px] text-[#444] cursor-pointer hover:bg-white transition-colors leading-none"
                                >−</button>
                                <span className="text-[13px] font-medium text-[#111] min-w-[28px] text-center">{ratingStyle === '1-10' ? 10 : ratingMaxRating}</span>
                                <button
                                  onClick={() => { if (ratingStyle !== '1-10') setRatingMaxRating((p) => Math.min(10, p + 1)); }}
                                  className={`w-[20px] h-[20px] bg-[rgba(255,255,255,0.8)] rounded-[5px] flex items-center justify-center text-[14px] text-[#444] leading-none transition-colors ${ratingStyle === '1-10' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white'}`}
                                >+</button>
                              </div>
                            </div>

                            {/* Rating style segmented control */}
                            <div className="flex flex-col gap-[8px]">
                              <span className="text-[12px] text-[#444]">Rating style</span>
                              <div className="bg-[rgba(0,0,0,0.04)] rounded-[7px] p-[2px] grid grid-cols-3 gap-[2px]">
                                {[
                                  { val: 'Stars', icon: <RiStarLine size={14} /> },
                                  { val: 'Hearts', icon: <RiHeartLine size={14} /> },
                                  { val: '1-10', icon: null },
                                ].map(({ val, icon }) => (
                                  <button
                                    key={val}
                                    onClick={() => {
                                      setRatingStyle(val);
                                      if (val === '1-10') setRatingMaxRating(10);
                                    }}
                                    className={`flex items-center justify-center gap-[4px] py-[6px] rounded-[5px] text-[11.5px] text-center cursor-pointer transition-colors ${
                                      ratingStyle === val
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                        : 'text-[#777] hover:text-[#444]'
                                    }`}
                                  >
                                    {icon}
                                    {val}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[rgba(0,0,0,0.09)]" />

                            {/* Low label */}
                            <div className="flex flex-col gap-[8px]">
                              <span className="text-[12px] text-[#444]">Low label</span>
                              <input
                                type="text"
                                value={ratingLowLabel}
                                onChange={(e) => setRatingLowLabel(e.target.value)}
                                className="w-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[7px] text-[12px] text-[#111] outline-none focus:border-[#111] transition-colors"
                              />
                            </div>

                            {/* High label */}
                            <div className="flex flex-col gap-[8px]">
                              <span className="text-[12px] text-[#444]">High label</span>
                              <input
                                type="text"
                                value={ratingHighLabel}
                                onChange={(e) => setRatingHighLabel(e.target.value)}
                                className="w-full bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.15)] rounded-[7px] px-[11px] py-[7px] text-[12px] text-[#111] outline-none focus:border-[#111] transition-colors"
                              />
                            </div>

                            {/* Show labels toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Show labels</span>
                              <button onClick={() => setRatingShowLabels((p) => !p)} className={`w-[34px] h-[20px] rounded-[10px] relative transition-colors appearance-none border-0 p-0 ${ratingShowLabels ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]'}`}>
                                <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-[7px] bg-white transition-all ${ratingShowLabels ? 'left-[17px]' : 'left-[3px]'}`} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── APPEARANCE section ── */}
                  <div className="border-b border-[rgba(0,0,0,0.09)]">
                    <button onClick={() => setRatingSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
                      <span className="text-[9.5px] font-semibold tracking-[1.2px] uppercase text-[#bbb]">APPEARANCE</span>
                      <motion.span animate={{ rotate: ratingSections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
                        <RiArrowDownSLine size={14} className="text-[#bbb]" />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {ratingSections.appearance && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-4 pb-4 flex flex-col gap-3">

                            {/* Icon size */}
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#444]">Icon size</span>
                              <div className="bg-[rgba(0,0,0,0.04)] rounded-[7px] p-[2px] grid grid-cols-3 gap-[2px] w-[145px]">
                                {['S', 'M', 'L'].map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => setRatingIconSize(s)}
                                    className={`py-[6px] rounded-[5px] text-[11.5px] text-center cursor-pointer transition-colors ${
                                      ratingIconSize === s
                                        ? 'bg-white border border-[rgba(0,0,0,0.09)] text-[#111] font-medium shadow-[0px_1px_1px_rgba(0,0,0,0.08)]'
                                        : 'text-[#777] hover:text-[#444]'
                                    }`}
                                  >{s}</button>
                                ))}
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </div>
            </BuilderRightPanelShell>
          )}
        </AnimatePresence>

        {/* ── If / Then Logic panel (Logic tab) ── */}
        <AnimatePresence>
          {ifThenLogicPanelEdge != null && ifThenDraft && activeTab === 'logic' && (() => {
            const { from, to } = ifThenLogicPanelEdge;
            const logicScreen = screens.find((s) => s.id === from);
            if (!logicScreen) return null;
            const fromLabel = logicScreen.label || logicScreen.name || 'Screen';
            const toScreen = to != null ? screens.find((s) => s.id === to) : null;
            const toLabel = toScreen
              ? getLogicCardQuestionText(toScreen) || toScreen.name || toScreen.label || 'Screen'
              : null;
            const screenSubtitle =
              toLabel != null ? `${fromLabel} → ${toLabel}` : `${fromLabel} Screen`;
            return (
              <BuilderRightPanelShell panelKey="if-then-logic-panel" width={320}>
                <IfThenLogicPanel
                  screenSubtitle={screenSubtitle}
                  questionOptions={getLogicQuestionOptionsForForm()}
                  screens={screens}
                  fromScreenId={from}
                  destinationOptions={[
                    ...screens
                      .filter((s) => s.type === 'content' && s.id !== from)
                      .map((s) => ({
                        id: s.id,
                        label: getLogicCardQuestionText(s) || s.name || s.label || 'Screen',
                      })),
                    ...(screens.find((s) => s.type === 'end')
                      ? [{ id: screens.find((s) => s.type === 'end').id, label: 'End screen' }]
                      : []),
                  ]}
                  draft={ifThenDraft}
                  onDraftChange={setIfThenDraft}
                  onClose={closeIfThenLogicPanel}
                  onCancel={cancelIfThenLogicPanel}
                  onSave={saveIfThenLogic}
                />
              </BuilderRightPanelShell>
            );
          })()}
        </AnimatePresence>

        {/* ── Design / Customization panel (right) ── */}
        <AnimatePresence>
        {showDesignPanel && (
          <BuilderRightPanelShell panelKey="design-panel" width={280}>
          <div
            className="w-[280px] h-full bg-[#f7f7f8] border-l border-[#e4e2dc] flex flex-col"
            style={{ boxShadow: '-2px 2px 5px rgba(0,0,0,0.1)' }}
          >
            {/* Header */}
            <div className="h-[40px] border-b border-[#e4e2dc] flex items-center justify-between px-4 shrink-0">
              <span className="text-[14px] font-semibold text-[#1a1a1a]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Customization
              </span>
              <button
                onClick={() => { setShowDesignPanel(false); setActiveTab('content'); }}
                className="flex items-center justify-center cursor-pointer text-[#7a7a72] text-[18px] leading-none hover:text-[#1a1a1a] transition-colors"
              >
                ×
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* ── LAYOUT STYLE ── */}
              <div className="border-b border-[#e4e2dc] flex flex-col gap-3 px-4 py-4">
                <span className="text-[10px] font-semibold tracking-[0.6px] uppercase text-[#7a7a72]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Layout Style
                </span>
                <div className="bg-[#f1f1f1] rounded-[8px] p-[3px] grid grid-cols-2 gap-1">
                  {[
                    { id: 'withCard', label: 'With card' },
                    { id: 'fullCanvas', label: 'Full Canvas' },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setDesignLayoutStyle(id)}
                      className={`py-[7px] rounded-[6px] text-[12px] font-medium text-center cursor-pointer transition-colors ${
                        designLayoutStyle === id
                          ? 'bg-white text-black shadow-[0px_4px_2px_rgba(0,0,0,0.1)]'
                          : 'text-[#7a7a72] hover:text-[#1a1a1a]'
                      }`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── BACKGROUND ── */}
              <div className="border-b border-[#e3e1da] flex flex-col gap-2 px-4 py-[13px]">
                {/* Theme preview card — clickable to open overlay */}
                <button
                  onClick={() => setShowThemeOverlay(true)}
                  className="bg-white border border-[rgba(81,76,84,0.15)] rounded-[12px] overflow-hidden w-full text-left hover:border-[rgba(81,76,84,0.35)] transition-colors cursor-pointer"
                >
                  <div
                    className="h-[80px] p-4 flex items-start transition-colors duration-300"
                    style={designCardImage
                      ? { backgroundImage: `url(${designCardImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { backgroundColor: hexToRgba(designCardColor, designCardOpacity) }}
                  >
                    <div className="flex flex-col gap-[2px]">
                      <span className="text-[#262627] text-[13px] leading-5" style={{ fontFamily: "'Inter', sans-serif" }}>Question</span>
                      <span className="text-[#262627] text-[13px] leading-5" style={{ fontFamily: "'Inter', sans-serif" }}>Answer</span>
                      <div className="mt-1 bg-[#262627] rounded-[4px] h-[14px] w-[34px]" />
                    </div>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-[#3c323e] text-[13px] font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {THEMES.find(t => t.id === activeThemeId)?.name ?? 'Custom'}
                    </span>
                    <RiArrowRightLine size={14} className="text-[#9a9a92] shrink-0" />
                  </div>
                </button>

                <span className="text-[10px] font-bold tracking-[0.76px] uppercase text-[#8c8a84]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Background
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { color: '#f7edfc', border: '#111', isOutline: true },
                    { color: '#f0eee8', border: '#e3e1da', isOutline: false },
                    { color: '#111111', border: 'transparent', isOutline: false },
                  ].map(({ color, border, isOutline }) => (
                    <button
                      key={color}
                      onClick={() => setDesignBackground(color)}
                      className="h-[48px] rounded-[8px] cursor-pointer transition-all relative"
                      style={{
                        backgroundColor: color,
                        border: designBackground === color
                          ? `2px solid #1a1a1a`
                          : isOutline ? `1px solid ${border}` : `1px solid ${border}`,
                        outline: designBackground === color ? '2px solid rgba(26,26,26,0.2)' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── CARD COLOR ── */}
              <div className="border-b border-[#e4e2dc] flex flex-col gap-3 px-4 py-4">
                <span className="text-[10px] font-semibold tracking-[0.6px] uppercase text-[#7a7a72]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Card Color
                </span>
                <div className="flex items-center gap-[6px]">
                  {['#f9f9fa', '#1a1a2e', '#4a5568'].map((color) => (
                    <button
                      key={color}
                      onClick={() => { setDesignCardColor(color); setDesignCardImage(null); setActiveThemeId(null); }}
                      className="w-[28px] h-[28px] rounded-full cursor-pointer transition-transform hover:scale-110"
                      style={{
                        background: color,
                        border: color === '#f9f9fa' ? '1px solid #e5e5e3' : 'none',
                        outline: designCardColor === color ? '2px solid #111' : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                  <button
                    onClick={() => setDesignCardColorGridOpen((v) => !v)}
                    className="w-[28px] h-[28px] rounded-full border border-dashed border-[#c0c0be] flex items-center justify-center text-[#9a9a9a] text-[14px] leading-none cursor-pointer hover:bg-white/50"
                  >
                    +
                  </button>
                </div>
                {/* Color grid */}
                <AnimatePresence initial={false}>
                  {designCardColorGridOpen && (
                    <motion.div
                      key="design-card-color-grid"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="bg-white border border-[#e5e5e3] rounded-[8px] p-[11px] flex flex-col gap-2 mb-1">
                        <div className="grid grid-cols-8 gap-1">
                          {CTA_COLOR_PALETTE.flat().map((color, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setDesignCardColor(color);
                                setDesignCardImage(null);
                                setActiveThemeId(null);
                                setDesignCardColorGridOpen(false);
                              }}
                              className="aspect-square rounded-[3px] cursor-pointer hover:scale-110 transition-transform"
                              style={{
                                background: color,
                                border: idx === 0 ? '1px solid #d8d8d6' : '1px solid rgba(0,0,0,0.07)',
                                outline: designCardColor === color ? '2px solid #1a1a1a' : 'none',
                                outlineOffset: 1,
                              }}
                            />
                          ))}
                        </div>
                        {/* Hex input row */}
                        <div className="border-t border-[#ebebea] pt-[9px] flex items-center gap-[6px]">
                          <div
                            className="w-[22px] h-[22px] rounded-[4px] border border-[#d8d8d6] shrink-0"
                            style={{ background: designCardColor }}
                          />
                          <span className="text-[11.5px] text-[#9a9a9a] shrink-0" style={{ fontFamily: 'Courier New, monospace' }}>#</span>
                          <input
                            type="text"
                            value={designCardColor.replace('#', '').toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9A-Fa-f]{0,6}$/.test(val)) { setDesignCardColor('#' + val); setDesignCardImage(null); setActiveThemeId(null); }
                            }}
                            className="flex-1 text-[11.5px] text-[#9a9a9a] uppercase outline-none bg-transparent min-w-0"
                            style={{ fontFamily: 'Courier New, monospace' }}
                            maxLength={6}
                          />
                          <button className="px-2 py-1 border border-[#e0e0de] rounded-[4px] text-[10.5px] text-[#9a9a9a] shrink-0 cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                            Custom
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── CARD OPACITY ── */}
              <div className="border-b border-[#e4e2dc] flex flex-col gap-2 px-4 py-4">
                <span className="text-[9.5px] font-medium tracking-[1.235px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Card Opacity
                </span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Transparent</span>
                    <span className="text-[10px] text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Opaque</span>
                  </div>
                  <div className="relative h-[3px] rounded-full w-full" style={{ background: `linear-gradient(to right, #1a1a1a ${designCardOpacity}%, #e0ddd8 ${designCardOpacity}%)` }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={designCardOpacity}
                      onChange={(e) => setDesignCardOpacity(Number(e.target.value))}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-[14px] -top-[5px]"
                    />
                    <div
                      className="absolute w-[14px] h-[14px] bg-[#1a1a1a] rounded-full -top-[5.5px] -translate-x-1/2 pointer-events-none"
                      style={{
                        left: `${designCardOpacity}%`,
                        boxShadow: '0 0 0 2.5px white, 0 0 0 4px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <span className="text-[10px] font-medium text-[#1a1a1a]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{designCardOpacity}%</span>
                  </div>
                </div>
              </div>

              {/* ── TEXT COLOR ── */}
              <div className="border-b border-[#e4e2dc] flex flex-col gap-3 px-4 py-4">
                <span className="text-[10px] font-semibold tracking-[0.6px] uppercase text-[#7a7a72]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Text Color
                </span>
                <div className="flex items-center gap-[6px]">
                  {[
                    { color: '#3d3d3d' },
                    { color: '#198eea' },
                    { color: '#ffffff', border: '#e4e2dc' },
                  ].map(({ color, border }) => (
                    <button
                      key={color}
                      onClick={() => setDesignTextColor(color)}
                      className="w-[32px] h-[32px] rounded-full cursor-pointer transition-all"
                      style={{
                        backgroundColor: color,
                        border: designTextColor === color
                          ? `2px solid transparent`
                          : border ? `1px solid ${border}` : `2px solid transparent`,
                        outline: designTextColor === color ? '2px solid rgba(0,0,0,0.3)' : 'none',
                        outlineOffset: '1.5px',
                      }}
                    />
                  ))}
                  <button
                    onClick={() => setDesignTextColorGridOpen((v) => !v)}
                    className="w-[32px] h-[32px] rounded-full bg-white border border-dashed border-[#e4e2dc] flex items-center justify-center cursor-pointer hover:bg-[#f5f4f0] transition-colors"
                  >
                    <span className="text-[#1a1a1a] text-[16px] leading-none font-light">+</span>
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {designTextColorGridOpen && (
                    <motion.div
                      key="design-text-color-grid"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="bg-white border border-[#e5e5e3] rounded-[8px] p-[11px] flex flex-col gap-2">
                        <div className="grid grid-cols-8 gap-1">
                          {CTA_COLOR_PALETTE.flat().map((color, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setDesignTextColor(color);
                                setDesignTextColorGridOpen(false);
                              }}
                              className="aspect-square rounded-[3px] cursor-pointer hover:scale-110 transition-transform"
                              style={{
                                background: color,
                                border: idx === 0 ? '1px solid #d8d8d6' : '1px solid rgba(0,0,0,0.07)',
                                outline: designTextColor === color ? '2px solid #1a1a1a' : 'none',
                                outlineOffset: 1,
                              }}
                            />
                          ))}
                        </div>
                        <div className="border-t border-[#ebebea] pt-[9px] flex items-center gap-[6px]">
                          <div
                            className="w-[22px] h-[22px] rounded-[4px] border border-[#d8d8d6] shrink-0"
                            style={{ background: designTextColor }}
                          />
                          <span className="text-[11.5px] text-[#9a9a9a] shrink-0" style={{ fontFamily: 'Courier New, monospace' }}>#</span>
                          <input
                            type="text"
                            value={designTextColor.replace('#', '').toUpperCase()}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9A-Fa-f]{0,6}$/.test(val)) setDesignTextColor('#' + val);
                            }}
                            className="flex-1 text-[11.5px] text-[#9a9a9a] uppercase outline-none bg-transparent min-w-0"
                            style={{ fontFamily: 'Courier New, monospace' }}
                            maxLength={6}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── TYPOGRAPHY ── */}
              <div className="border-b border-[#e4e2dc] flex flex-col gap-2 px-4 py-4">
                <span className="text-[10px] font-semibold tracking-[0.6px] uppercase text-[#7a7a72]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Typography
                </span>
                <div className="flex flex-col">
                  {[
                    { id: 'default', label: 'Default', preview: 'The quick brown fox', fontFamily: "'DM Sans', sans-serif", fontFamilyPreview: "'DM Sans', sans-serif" },
                    { id: 'serif', label: 'Serif', preview: 'The quick brown fox', fontFamily: 'Georgia, serif', fontFamilyPreview: 'Georgia, serif' },
                    { id: 'monospace', label: 'Monospace', preview: 'The quick brown fox', fontFamily: 'Consolas, monospace', fontFamilyPreview: 'Consolas, monospace' },
                  ].map(({ id, label, preview, fontFamily, fontFamilyPreview }) => (
                    <button
                      key={id}
                      onClick={() => setDesignTypography(id)}
                      className={`flex items-center justify-between px-[10px] py-[8px] rounded-[6px] w-full text-left cursor-pointer transition-colors ${
                        designTypography === id ? 'bg-[#f5f4f0]' : 'hover:bg-[#f5f4f0]/60'
                      }`}
                    >
                      <div className="flex flex-col gap-[2px]">
                        <span className="text-[13px] font-medium text-[#1a1a1a]" style={{ fontFamily }}>
                          {label}
                        </span>
                        <span className="text-[11px] text-[#7a7a72]" style={{ fontFamily: fontFamilyPreview }}>
                          {preview}
                        </span>
                      </div>
                      {designTypography === id && (
                        <RiCheckLine size={14} className="text-[#1a1a1a] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
          </BuilderRightPanelShell>
        )}
        </AnimatePresence>
        </>}
    </div>
  );
}
