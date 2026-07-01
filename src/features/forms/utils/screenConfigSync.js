import { normalizeResponseQualityOptions } from '@/features/forms/components/ResponseQualityScoringCard';

/**

 * Per-screen field config: extract from / apply to FormBuilder global state.

 * Enables multiple screens of the same block type (e.g. two Short text fields).

 */



const DEFAULT_CONTACT_FIELDS = [

  { id: 'firstName', label: 'First name', placeholder: 'Jane', required: true },

  { id: 'lastName', label: 'Last name', placeholder: 'Smith', required: true },

  { id: 'email', label: 'Email address', placeholder: 'jane@example.com', required: true },

  { id: 'phone', label: 'Phone (optional)', placeholder: '+1 (555) 000-0000', required: false },

];



const CONTACT_FIELD_KEYS = ['firstName', 'lastName', 'email', 'phone', 'company'];

const WORK_FIELD_KEYS = ['company', 'title', 'industry', 'teamSize'];



const CONTACT_ID_ALIASES = {

  firstName: 'firstName',

  lastName: 'lastName',

  email: 'email',

  phone: 'phone',

  company: 'company',

};



const WORK_ID_ALIASES = {

  company: 'company',

  title: 'title',

  role: 'title',

  industry: 'industry',

  teamSize: 'teamSize',

};



const DEFAULT_CONTACT_FIELDS_MAP = {

  firstName: { visible: true, required: false },

  lastName: { visible: true, required: false },

  email: { visible: true, required: true },

  phone: { visible: true, required: false },

  company: { visible: false, required: false },

};



const DEFAULT_WORK_FIELDS_MAP = {

  company: { visible: true, required: false },

  title: { visible: true, required: false },

  industry: { visible: true, required: false },

  teamSize: { visible: true, required: false },

};



/** Template defs use an array; the builder uses { key: { visible, required } }. */

export function normalizeContactFields(fields) {

  if (!fields) return null;

  if (!Array.isArray(fields)) return fields;

  const result = Object.fromEntries(

    CONTACT_FIELD_KEYS.map((key) => [key, { visible: false, required: false }])

  );

  for (const item of fields) {

    const key = CONTACT_ID_ALIASES[item.id] ?? item.id;

    if (CONTACT_FIELD_KEYS.includes(key)) {

      result[key] = { visible: true, required: !!item.required };

    }

  }

  return result;

}



export function normalizeWorkFields(fields) {

  if (!fields) return null;

  if (!Array.isArray(fields)) return fields;

  const result = Object.fromEntries(

    WORK_FIELD_KEYS.map((key) => [key, { visible: false, required: false }])

  );

  for (const item of fields) {

    const key = WORK_ID_ALIASES[item.id] ?? item.id;

    if (WORK_FIELD_KEYS.includes(key)) {

      result[key] = { visible: true, required: !!item.required };

    }

  }

  return result;

}



/**
 * Builder preview: prefer live panel state for the active screen so sidebar,
 * logic canvas, and configure panel stay in sync while typing.
 */
export function getBuilderScreenPreviewText(screen, fallbackMap = {}, activeScreenId = null) {
  if (!screen) return '';
  if (screen.previewText) return screen.previewText;
  if (screen.type === 'intro') return screen.name || 'Start Screen';
  if (screen.type === 'end') return screen.name || 'End Screen';
  if (screen.type !== 'content') return '';

  const live =
    activeScreenId != null && screen.id === activeScreenId
      ? fallbackMap[screen.label]
      : null;
  if (live) return live;

  return getScreenPreviewText(screen, fallbackMap);
}

export function getScreenPreviewText(screen, fallbackMap = {}) {

  if (!screen) return '';

  if (screen.previewText) return screen.previewText;

  if (screen.type === 'intro') return screen.name || 'Start Screen';

  if (screen.type === 'end') return screen.name || 'End Screen';

  if (screen.type !== 'content') return '';



  const c = screen.config || {};

  const fromConfig = {

    Contact: c.contactQuestion,

    Address: c.addressQuestion,

    'Work Info': c.workQuestion,

    'Short text': c.shortTextQuestion,

    'Long text': c.longTextQuestion,

    Single: c.singleQuestion,

    Multiple: c.multipleQuestion,

    Rating: c.ratingQuestion ?? c.ratingLowLabel,

    Images: c.imageQuestion,

    Video: c.videoQuestion,

    'Multi-image upload': c.question,

    Upload: c.uploadQuestion,

    Heading: c.headingText,

    Description: c.descriptionContent,

    CTA: c.ctaHeadingText || c.ctaButtonLabel,

    Media: c.mediaQuestion,

    Captcha: "Verify you're human",

    Date: c.dateQuestion,

    Time: c.timeQuestion,

  }[screen.label];



  if (fromConfig) return fromConfig;

  return fallbackMap[screen.label] ?? screen.label;

}



export function extractScreenConfig(screen, globals) {

  if (!screen || screen.type !== 'content') return null;

  const { label } = screen;



  switch (label) {

    case 'Contact':

      return {

        contactQuestion: globals.contactQuestion,

        contactHelperText: globals.contactHelperText,

        contactFields: globals.contactFields,

        contactRequired: globals.contactRequired,

      };

    case 'Address':

      return {

        addressQuestion: globals.addressQuestion,

        addressHelperText: globals.addressHelperText,

        addressFields: globals.addressFields,

        addressRequired: globals.addressRequired,

      };

    case 'Work Info':

      return {

        workQuestion: globals.workQuestion,

        workHelperText: globals.workHelperText,

        workFields: globals.workFields,

        workRequired: globals.workRequired,

      };

    case 'Short text':

      return {

        shortTextQuestion: globals.shortTextQuestion,

        shortTextHelperText: globals.shortTextHelperText,

        shortTextPlaceholder: globals.shortTextPlaceholder,

        shortTextMaxChars: globals.shortTextMaxChars,

        shortTextMinChars: globals.shortTextMinChars,

        shortTextValidation: globals.shortTextValidation,

        shortTextAlign: globals.shortTextAlign,

        shortTextSize: globals.shortTextSize,

        shortTextRequired: globals.shortTextRequired,

        shortTextHidden: globals.shortTextHidden,

        shortTextResponseQualityEnabled: globals.shortTextResponseQualityEnabled,

        shortTextResponseQualityOptions: globals.shortTextResponseQualityOptions,

      };

    case 'Long text':

      return {

        longTextQuestion: globals.longTextQuestion,

        longTextHelperText: globals.longTextHelperText,

        longTextPlaceholder: globals.longTextPlaceholder,

        longTextMaxChars: globals.longTextMaxChars,

        longTextMinChars: globals.longTextMinChars,

        longTextValidation: globals.longTextValidation,

        longTextAlign: globals.longTextAlign,

        longTextSize: globals.longTextSize,

        longTextRequired: globals.longTextRequired,

        longTextHidden: globals.longTextHidden,

        longTextResponseQualityEnabled: globals.longTextResponseQualityEnabled,

        longTextResponseQualityOptions: globals.longTextResponseQualityOptions,

      };

    case 'Single':

      return {

        singleQuestion: globals.singleQuestion,

        singleHelperText: globals.singleHelperText,

        singleOptions: globals.singleOptions,

        singleLayout: globals.singleLayout,

        singleOptionHeight: globals.singleOptionHeight,

        singleRequired: globals.singleRequired,

        singleAllowOther: globals.singleAllowOther,

        singleRandomize: globals.singleRandomize,

        singleMultipleSelect: globals.singleMultipleSelect,

        singleMinChoices: globals.singleMinChoices,

        singleMaxChoices: globals.singleMaxChoices,

        singleShowKeyboardHints: globals.singleShowKeyboardHints,

      };

    case 'Multiple':

      return {

        multipleQuestion: globals.multipleQuestion,

        multipleHelperText: globals.multipleHelperText,

        multipleOptions: globals.multipleOptions,

        multipleLayout: globals.multipleLayout,

        multipleRequired: globals.multipleRequired,

        multipleAllowOther: globals.multipleAllowOther,

        multipleRandomize: globals.multipleRandomize,

        multipleMultipleSelect: globals.multipleMultipleSelect,

        multipleMinChoices: globals.multipleMinChoices,

        multipleMaxChoices: globals.multipleMaxChoices,

        multipleShowKeyboardHints: globals.multipleShowKeyboardHints,

        multipleOptionHeight: globals.multipleOptionHeight,

      };

    case 'Heading':

      return {

        headingText: globals.headingText,

        subHeading: globals.subHeading,

        headingRequired: globals.headingRequired,

        headingHidden: globals.headingHidden,

        headingLevel: globals.headingLevel,

        headingTextSize: globals.headingTextSize,

        headingAlignment: globals.headingAlignment,

        headingFontWeight: globals.headingFontWeight,

        headingAnswerText: globals.headingAnswerText,

      };

    case 'Description':

      return {

        descriptionContent: globals.descriptionContent,

        descriptionHidden: globals.descriptionHidden,

        descriptionShowCharCount: globals.descriptionShowCharCount,

        descriptionCharLimit: globals.descriptionCharLimit,

        descriptionFormatting: globals.descriptionFormatting,

        descriptionTextSize: globals.descriptionTextSize,

        descriptionAlignment: globals.descriptionAlignment,

      };

    case 'CTA':

      return {

        ctaButtonLabel: globals.ctaButtonLabel,

        ctaHeadingText: globals.ctaHeadingText,

        ctaHelperText: globals.ctaHelperText,

        ctaDurationText: globals.ctaDurationText,

        ctaButtonSize: globals.ctaButtonSize,

        ctaButtonStyle: globals.ctaButtonStyle,

        ctaCornerRadius: globals.ctaCornerRadius,

        ctaShowIcon: globals.ctaShowIcon,

        ctaImage: globals.ctaImage,

        ctaHeadingSize: globals.ctaHeadingSize,

        ctaBodySize: globals.ctaBodySize,

        ctaFontWeight: globals.ctaFontWeight,

        ctaTextAlign: globals.ctaTextAlign,

        ctaPadding: globals.ctaPadding,

        ctaTextColor: globals.ctaTextColor,

        ctaBtnColor: globals.ctaBtnColor,

        ctaLabelColor: globals.ctaLabelColor,

        ctaContentWidth: globals.ctaContentWidth,

      };

    case 'Rating':

      return {

        ratingQuestion: globals.ratingQuestion,

        ratingRequired: globals.ratingRequired,

        ratingUseScale: globals.ratingUseScale,

        ratingUseSlider: globals.ratingUseSlider,

        ratingMaxRating: globals.ratingMaxRating,

        ratingStyle: globals.ratingStyle,

        ratingLowLabel: globals.ratingLowLabel,

        ratingHighLabel: globals.ratingHighLabel,

        ratingShowLabels: globals.ratingShowLabels,

        ratingIconSize: globals.ratingIconSize,

      };

    case 'Date':

      return {

        dateQuestion: globals.dateQuestion,

        dateHelperText: globals.dateHelperText,

        dateRequired: globals.dateRequired,

      };

    case 'Time':

      return {

        timeQuestion: globals.timeQuestion,

        timeHelperText: globals.timeHelperText,

        timeRequired: globals.timeRequired,

        timeUse12h: globals.timeUse12h,

        timeShowSeconds: globals.timeShowSeconds,

        timeMinTime: globals.timeMinTime,

        timeMaxTime: globals.timeMaxTime,

      };

    case 'Images':

      return {

        imageQuestion: globals.imageQuestion,

        imageDescription: globals.imageDescription,

        imageHidden: globals.imageHidden,

        imageAltText: globals.imageAltText,

        imageCaption: globals.imageCaption,

        imageLinkOnClick: globals.imageLinkOnClick,

        imageLinkUrl: globals.imageLinkUrl,

        imageOpenInNewTab: globals.imageOpenInNewTab,

        imageAlignment: globals.imageAlignment,

        imageWidth: globals.imageWidth,

        imageCornerRadius: globals.imageCornerRadius,

        imagePreview: globals.imagePreview,

        imageFileName: globals.imageFileName,

      };

    case 'Video':

      return {

        videoQuestion: globals.videoQuestion,

        videoDescription: globals.videoDescription,

        videoRequired: globals.videoRequired,

        videoHidden: globals.videoHidden,

        videoLoop: globals.videoLoop,

        videoAutoplay: globals.videoAutoplay,

        videoShowControls: globals.videoShowControls,

        videoSource: globals.videoSource,

        videoUrl: globals.videoUrl,

        videoCaption: globals.videoCaption,

        videoWidth: globals.videoWidth,

        videoAspectRatio: globals.videoAspectRatio,

        videoCornerRadius: globals.videoCornerRadius,

      };

    case 'Media':

      return {

        mediaQuestion: globals.mediaQuestion,

        mediaHelperText: globals.mediaHelperText,

        mediaOptions: globals.mediaOptions,

        mediaAllowMultiple: globals.mediaAllowMultiple,

        mediaRequired: globals.mediaRequired,

        mediaRandomiseOrder: globals.mediaRandomiseOrder,

        mediaMinChoices: globals.mediaMinChoices,

        mediaMaxChoices: globals.mediaMaxChoices,

        mediaLayout: globals.mediaLayout,

        mediaOptionHeight: globals.mediaOptionHeight,

      };

    case 'Captcha':

      return {

        captchaProvider: globals.captchaProvider,

        captchaSiteKey: globals.captchaSiteKey,

        captchaEnabled: globals.captchaEnabled,

        captchaVisibility: globals.captchaVisibility,

      };

    case 'Multi-image upload':

      return {

        question: globals.multiImageQuestion,

        helperText: globals.multiImageHelperText,

        maxFiles: globals.multiImageMaxFiles,

        required: globals.multiImageRequired,

        multipleFiles: globals.multiImageMultipleFiles,

        maxFileSize: globals.multiImageMaxFileSize,

      };

    case 'Upload':

      return {

        question: globals.uploadQuestion,

        helperText: globals.uploadHelperText,

        maxFileSize: globals.uploadMaxFileSize,

      };

  }

  return screen.config ?? null;

}



/** Stable empty array — avoids infinite re-render loops when applying config. */
const EMPTY_SHOW_IF_CONDITIONS = [];

export function applyScreenConfig(screen, config, setters) {

  if (!screen || screen.type !== 'content' || !config) return;

  const { label } = screen;



  switch (label) {

    case 'Contact':

      if (config.contactQuestion != null) setters.setContactQuestion(config.contactQuestion);

      if (config.contactHelperText != null) setters.setContactHelperText(config.contactHelperText);

      if (config.contactFields != null) setters.setContactFields(normalizeContactFields(config.contactFields));

      if (config.contactRequired != null) setters.setContactRequired(config.contactRequired);

      break;

    case 'Address':

      if (config.addressQuestion != null) setters.setAddressQuestion(config.addressQuestion);

      if (config.addressHelperText != null) setters.setAddressHelperText(config.addressHelperText);

      if (config.addressFields != null) setters.setAddressFields(config.addressFields);

      if (config.addressRequired != null) setters.setAddressRequired(config.addressRequired);

      break;

    case 'Work Info':

      if (config.workQuestion != null) setters.setWorkQuestion(config.workQuestion);

      if (config.workHelperText != null) setters.setWorkHelperText(config.workHelperText);

      if (config.workFields != null) setters.setWorkFields(normalizeWorkFields(config.workFields));

      if (config.workRequired != null) setters.setWorkRequired(config.workRequired);

      break;

    case 'Short text':

      if (config.shortTextQuestion != null) setters.setShortTextQuestion(config.shortTextQuestion);

      if (config.shortTextHelperText != null) setters.setShortTextHelperText(config.shortTextHelperText);

      if (config.shortTextPlaceholder != null) setters.setShortTextPlaceholder(config.shortTextPlaceholder);

      if (config.shortTextMaxChars != null) setters.setShortTextMaxChars(config.shortTextMaxChars);

      if (config.shortTextMinChars != null) setters.setShortTextMinChars(config.shortTextMinChars);

      if (config.shortTextValidation != null) setters.setShortTextValidation(config.shortTextValidation);

      if (config.shortTextAlign != null) setters.setShortTextAlign(config.shortTextAlign);

      if (config.shortTextSize != null) setters.setShortTextSize(config.shortTextSize);

      if (config.shortTextRequired != null) setters.setShortTextRequired(config.shortTextRequired);

      if (config.shortTextHidden != null) setters.setShortTextHidden(config.shortTextHidden);

      if (config.shortTextResponseQualityEnabled != null) {
        setters.setShortTextResponseQualityEnabled(config.shortTextResponseQualityEnabled);
      }

      if (config.shortTextResponseQualityOptions != null) {
        setters.setShortTextResponseQualityOptions(
          normalizeResponseQualityOptions(config.shortTextResponseQualityOptions),
        );
      }

      break;

    case 'Long text':

      if (config.longTextQuestion != null) setters.setLongTextQuestion(config.longTextQuestion);

      if (config.longTextHelperText != null) setters.setLongTextHelperText(config.longTextHelperText);

      if (config.longTextPlaceholder != null) setters.setLongTextPlaceholder(config.longTextPlaceholder);

      if (config.longTextMaxChars != null) setters.setLongTextMaxChars(config.longTextMaxChars);

      if (config.longTextMinChars != null) setters.setLongTextMinChars(config.longTextMinChars);

      if (config.longTextValidation != null) setters.setLongTextValidation(config.longTextValidation);

      if (config.longTextAlign != null) setters.setLongTextAlign(config.longTextAlign);

      if (config.longTextSize != null) setters.setLongTextSize(config.longTextSize);

      if (config.longTextRequired != null) setters.setLongTextRequired(config.longTextRequired);

      if (config.longTextHidden != null) setters.setLongTextHidden(config.longTextHidden);

      if (config.longTextResponseQualityEnabled != null) {
        setters.setLongTextResponseQualityEnabled(config.longTextResponseQualityEnabled);
      }

      if (config.longTextResponseQualityOptions != null) {
        setters.setLongTextResponseQualityOptions(
          normalizeResponseQualityOptions(config.longTextResponseQualityOptions),
        );
      }

      break;

    case 'Single':

      if (config.singleQuestion != null) setters.setSingleQuestion(config.singleQuestion);

      if (config.singleHelperText != null) setters.setSingleHelperText(config.singleHelperText);

      if (config.singleOptions != null) setters.setSingleOptions(config.singleOptions);

      if (config.singleLayout != null) setters.setSingleLayout(config.singleLayout);

      if (config.singleOptionHeight != null) setters.setSingleOptionHeight(config.singleOptionHeight);

      if (config.singleRequired != null) setters.setSingleRequired(config.singleRequired);

      if (config.singleAllowOther != null) setters.setSingleAllowOther(config.singleAllowOther);

      if (config.singleRandomize != null) setters.setSingleRandomize(config.singleRandomize);

      if (config.singleMultipleSelect != null) setters.setSingleMultipleSelect(config.singleMultipleSelect);

      if (config.singleMinChoices != null) setters.setSingleMinChoices(config.singleMinChoices);

      if (config.singleMaxChoices != null) setters.setSingleMaxChoices(config.singleMaxChoices);

      if (config.singleShowKeyboardHints != null) setters.setSingleShowKeyboardHints(config.singleShowKeyboardHints);

      break;

    case 'Multiple':

      if (config.multipleQuestion != null) setters.setMultipleQuestion(config.multipleQuestion);

      if (config.multipleHelperText != null) setters.setMultipleHelperText(config.multipleHelperText);

      if (config.multipleOptions != null) setters.setMultipleOptions(config.multipleOptions);

      if (config.multipleLayout != null) setters.setMultipleLayout(config.multipleLayout);

      if (config.multipleRequired != null) setters.setMultipleRequired(config.multipleRequired);

      if (config.multipleAllowOther != null) setters.setMultipleAllowOther(config.multipleAllowOther);

      if (config.multipleRandomize != null) setters.setMultipleRandomize(config.multipleRandomize);

      if (config.multipleMultipleSelect != null) setters.setMultipleMultipleSelect(config.multipleMultipleSelect);

      if (config.multipleMinChoices != null) setters.setMultipleMinChoices(config.multipleMinChoices);

      if (config.multipleMaxChoices != null) setters.setMultipleMaxChoices(config.multipleMaxChoices);

      if (config.multipleShowKeyboardHints != null) setters.setMultipleShowKeyboardHints(config.multipleShowKeyboardHints);

      if (config.multipleOptionHeight != null) setters.setMultipleOptionHeight(config.multipleOptionHeight);

      break;

    case 'Heading':

      if (config.headingText != null) setters.setHeadingText(config.headingText);

      if (config.subHeading != null) setters.setSubHeading(config.subHeading);

      if (config.headingRequired != null) setters.setHeadingRequired(config.headingRequired);

      if (config.headingHidden != null) setters.setHeadingHidden(config.headingHidden);

      if (config.headingLevel != null) setters.setHeadingLevel(config.headingLevel);

      if (config.headingTextSize != null) setters.setHeadingTextSize(config.headingTextSize);

      if (config.headingAlignment != null) setters.setHeadingAlignment(config.headingAlignment);

      if (config.headingFontWeight != null) setters.setHeadingFontWeight(config.headingFontWeight);

      if (config.headingAnswerText != null) setters.setHeadingAnswerText(config.headingAnswerText);

      break;

    case 'Description':

      if (config.descriptionContent != null) setters.setDescriptionContent(config.descriptionContent);

      if (config.descriptionHidden != null) setters.setDescriptionHidden(config.descriptionHidden);

      if (config.descriptionShowCharCount != null) setters.setDescriptionShowCharCount(config.descriptionShowCharCount);

      if (config.descriptionCharLimit != null) setters.setDescriptionCharLimit(config.descriptionCharLimit);

      if (config.descriptionFormatting != null) setters.setDescriptionFormatting(config.descriptionFormatting);

      if (config.descriptionTextSize != null) setters.setDescriptionTextSize(config.descriptionTextSize);

      if (config.descriptionAlignment != null) setters.setDescriptionAlignment(config.descriptionAlignment);

      break;

    case 'CTA':

      if (config.ctaButtonLabel != null) setters.setCtaButtonLabel(config.ctaButtonLabel);

      if (config.ctaHeadingText != null) setters.setCtaHeadingText(config.ctaHeadingText);

      if (config.ctaHelperText != null) setters.setCtaHelperText(config.ctaHelperText);

      if (config.ctaDurationText != null) setters.setCtaDurationText(config.ctaDurationText);

      if (config.ctaButtonSize != null) setters.setCtaButtonSize(config.ctaButtonSize);

      if (config.ctaButtonStyle != null) setters.setCtaButtonStyle(config.ctaButtonStyle);

      if (config.ctaCornerRadius != null) setters.setCtaCornerRadius(config.ctaCornerRadius);

      if (config.ctaShowIcon != null) setters.setCtaShowIcon(config.ctaShowIcon);

      if (config.ctaImage != null) setters.setCtaImage(config.ctaImage);

      if (config.ctaHeadingSize != null) setters.setCtaHeadingSize(config.ctaHeadingSize);

      if (config.ctaBodySize != null) setters.setCtaBodySize(config.ctaBodySize);

      if (config.ctaFontWeight != null) setters.setCtaFontWeight(config.ctaFontWeight);

      if (config.ctaTextAlign != null) setters.setCtaTextAlign(config.ctaTextAlign);

      if (config.ctaPadding != null) setters.setCtaPadding(config.ctaPadding);

      if (config.ctaTextColor != null) setters.setCtaTextColor(config.ctaTextColor);

      if (config.ctaBtnColor != null) setters.setCtaBtnColor(config.ctaBtnColor);

      if (config.ctaLabelColor != null) setters.setCtaLabelColor(config.ctaLabelColor);

      if (config.ctaContentWidth != null) setters.setCtaContentWidth(config.ctaContentWidth);

      break;

    case 'Rating':

      if (config.ratingQuestion != null) setters.setRatingQuestion(config.ratingQuestion);

      if (config.ratingRequired != null) setters.setRatingRequired(config.ratingRequired);

      if (config.ratingUseScale != null) setters.setRatingUseScale(config.ratingUseScale);

      if (config.ratingUseSlider != null) setters.setRatingUseSlider(config.ratingUseSlider);

      if (config.ratingMaxRating != null) setters.setRatingMaxRating(config.ratingMaxRating);

      if (config.ratingStyle != null) setters.setRatingStyle(config.ratingStyle);

      if (config.ratingLowLabel != null) setters.setRatingLowLabel(config.ratingLowLabel);

      if (config.ratingHighLabel != null) setters.setRatingHighLabel(config.ratingHighLabel);

      if (config.ratingShowLabels != null) setters.setRatingShowLabels(config.ratingShowLabels);

      if (config.ratingIconSize != null) setters.setRatingIconSize(config.ratingIconSize);

      break;

    case 'Date':

      if (config.dateQuestion != null) setters.setDateQuestion(config.dateQuestion);

      if (config.dateHelperText != null) setters.setDateHelperText(config.dateHelperText);

      if (config.dateRequired != null) setters.setDateRequired(config.dateRequired);

      break;

    case 'Time':

      if (config.timeQuestion != null) setters.setTimeQuestion(config.timeQuestion);

      if (config.timeHelperText != null) setters.setTimeHelperText(config.timeHelperText);

      if (config.timeRequired != null) setters.setTimeRequired(config.timeRequired);

      if (config.timeUse12h != null) setters.setTimeUse12h(config.timeUse12h);

      if (config.timeShowSeconds != null) setters.setTimeShowSeconds(config.timeShowSeconds);

      if (config.timeMinTime != null) setters.setTimeMinTime(config.timeMinTime);

      if (config.timeMaxTime != null) setters.setTimeMaxTime(config.timeMaxTime);

      break;

    case 'Images':

      if (config.imageQuestion != null) setters.setImageQuestion(config.imageQuestion);

      if (config.imageDescription != null) setters.setImageDescription(config.imageDescription);

      if (config.imageHidden != null) setters.setImageHidden(config.imageHidden);

      if (config.imageAltText != null) setters.setImageAltText(config.imageAltText);

      if (config.imageCaption != null) setters.setImageCaption(config.imageCaption);

      if (config.imageLinkOnClick != null) setters.setImageLinkOnClick(config.imageLinkOnClick);

      if (config.imageLinkUrl != null) setters.setImageLinkUrl(config.imageLinkUrl);

      if (config.imageOpenInNewTab != null) setters.setImageOpenInNewTab(config.imageOpenInNewTab);

      if (config.imageAlignment != null) setters.setImageAlignment(config.imageAlignment);

      if (config.imageWidth != null) setters.setImageWidth(config.imageWidth);

      if (config.imageCornerRadius != null) setters.setImageCornerRadius(config.imageCornerRadius);

      if ('imagePreview' in config) setters.setImagePreview(config.imagePreview);

      if ('imageFileName' in config) setters.setImageFileName(config.imageFileName);

      break;

    case 'Video':

      if (config.videoQuestion != null) setters.setVideoQuestion(config.videoQuestion);

      if (config.videoDescription != null) setters.setVideoDescription(config.videoDescription);

      if (config.videoRequired != null) setters.setVideoRequired(config.videoRequired);

      if (config.videoHidden != null) setters.setVideoHidden(config.videoHidden);

      if (config.videoLoop != null) setters.setVideoLoop(config.videoLoop);

      if (config.videoAutoplay != null) setters.setVideoAutoplay(config.videoAutoplay);

      if (config.videoShowControls != null) setters.setVideoShowControls(config.videoShowControls);

      if (config.videoSource != null) setters.setVideoSource(config.videoSource);

      if (config.videoUrl != null) setters.setVideoUrl(config.videoUrl);

      if (config.videoCaption != null) setters.setVideoCaption(config.videoCaption);

      if (config.videoWidth != null) setters.setVideoWidth(config.videoWidth);

      if (config.videoAspectRatio != null) setters.setVideoAspectRatio(config.videoAspectRatio);

      if (config.videoCornerRadius != null) setters.setVideoCornerRadius(config.videoCornerRadius);

      break;

    case 'Media':

      if (config.mediaQuestion != null) setters.setMediaQuestion(config.mediaQuestion);

      if (config.mediaHelperText != null) setters.setMediaHelperText(config.mediaHelperText);

      if (config.mediaOptions != null) setters.setMediaOptions(config.mediaOptions);

      if (config.mediaAllowMultiple != null) setters.setMediaAllowMultiple(config.mediaAllowMultiple);

      if (config.mediaRequired != null) setters.setMediaRequired(config.mediaRequired);

      if (config.mediaRandomiseOrder != null) setters.setMediaRandomiseOrder(config.mediaRandomiseOrder);

      if (config.mediaMinChoices != null) setters.setMediaMinChoices(config.mediaMinChoices);

      if (config.mediaMaxChoices != null) setters.setMediaMaxChoices(config.mediaMaxChoices);

      if (config.mediaLayout != null) setters.setMediaLayout(config.mediaLayout);

      if (config.mediaOptionHeight != null) setters.setMediaOptionHeight(config.mediaOptionHeight);

      break;

    case 'Captcha':

      if (config.captchaProvider != null) setters.setCaptchaProvider(config.captchaProvider);

      if (config.captchaSiteKey != null) setters.setCaptchaSiteKey(config.captchaSiteKey);

      if (config.captchaEnabled != null) setters.setCaptchaEnabled(config.captchaEnabled);

      if (config.captchaVisibility != null) setters.setCaptchaVisibility(config.captchaVisibility);

      break;

    case 'Multi-image upload':

      if (config.question != null) setters.setMultiImageQuestion(config.question);

      if (config.helperText != null) setters.setMultiImageHelperText(config.helperText);

      if (config.maxFiles != null) setters.setMultiImageMaxFiles(config.maxFiles);

      if (config.required != null) setters.setMultiImageRequired(config.required);

      if (config.multipleFiles != null) setters.setMultiImageMultipleFiles(config.multipleFiles);

      if (config.maxFileSize != null) setters.setMultiImageMaxFileSize(config.maxFileSize);

      break;

    case 'Upload':

      if (config.question != null) setters.setUploadQuestion(config.question);

      if (config.helperText != null) setters.setUploadHelperText(config.helperText);

      if (config.maxFileSize != null) setters.setUploadMaxFileSize(config.maxFileSize);

      break;

    default:

      break;

  }

  if (setters.setShowIfConditions) {
    const next =
      config.showIfConditions != null ? config.showIfConditions : EMPTY_SHOW_IF_CONDITIONS;
    setters.setShowIfConditions(next);
  }

}



export {

  DEFAULT_CONTACT_FIELDS,

  DEFAULT_CONTACT_FIELDS_MAP,

  DEFAULT_WORK_FIELDS_MAP,

};


