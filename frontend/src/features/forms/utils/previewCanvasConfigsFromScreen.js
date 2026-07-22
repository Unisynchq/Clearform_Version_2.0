import { normalizeContactFields, normalizeWorkFields } from '@/features/forms/utils/screenConfigSync';
import { normalizeResponseQualityOptions } from '@/features/forms/components/ResponseQualityScoringCard';

const noop = () => {};

/**
 * Build ContentCard *Config props from a published screen snapshot (screen.config).
 * Used by public respondent + preview parity path.
 */
export function previewCanvasConfigsFromScreen(screen) {
  if (!screen || screen.type !== 'content') return {};
  const c = screen.config ?? {};
  const { label } = screen;

  switch (label) {
    case 'CTA':
      return {
        ctaConfig: {
          ctaButtonLabel: c.ctaButtonLabel,
          ctaHeadingText: c.ctaHeadingText,
          ctaHelperText: c.ctaHelperText,
          ctaDurationText: c.ctaDurationText,
          ctaButtonSize: c.ctaButtonSize,
          ctaButtonStyle: c.ctaButtonStyle,
          ctaCornerRadius: c.ctaCornerRadius,
          ctaShowIcon: c.ctaShowIcon,
          ctaImage: c.ctaImage,
          ctaHeadingSize: c.ctaHeadingSize,
          ctaBodySize: c.ctaBodySize,
          ctaFontWeight: c.ctaFontWeight,
          ctaTextAlign: c.ctaTextAlign,
          ctaPadding: c.ctaPadding,
          ctaTextColor: c.ctaTextColor,
          ctaBtnColor: c.ctaBtnColor,
          ctaLabelColor: c.ctaLabelColor,
          ctaContentWidth: c.ctaContentWidth,
          isEditingCtaCard: false,
          setIsEditingCtaCard: noop,
          setCtaHeadingText: noop,
          setCtaHelperText: noop,
          setCtaDurationText: noop,
        },
      };
    case 'Heading':
      return {
        headingConfig: {
          headingText: c.headingText,
          subHeading: c.subHeading,
          headingRequired: c.headingRequired,
          headingHidden: c.headingHidden,
          headingLevel: c.headingLevel,
          headingTextSize: c.headingTextSize,
          headingAlignment: c.headingAlignment,
          headingFontWeight: c.headingFontWeight,
          headingAnswerText: c.headingAnswerText,
          isEditingHeadingCard: false,
          setIsEditingHeadingCard: noop,
          setHeadingText: noop,
          setSubHeading: noop,
          setHeadingAnswerText: noop,
        },
      };
    case 'Description':
      return {
        descriptionConfig: {
          descriptionContent: c.descriptionContent,
          descriptionHidden: c.descriptionHidden,
          descriptionShowCharCount: c.descriptionShowCharCount,
          descriptionCharLimit: c.descriptionCharLimit,
          descriptionFormatting: c.descriptionFormatting,
          descriptionTextSize: c.descriptionTextSize,
          descriptionAlignment: c.descriptionAlignment,
          setDescriptionContent: noop,
        },
      };
    case 'Images':
      return {
        imageConfig: {
          imageHidden: c.imageHidden,
          imagePreview: c.imagePreview,
          imageAltText: c.imageAltText,
          imageCaption: c.imageCaption,
          imageLinkOnClick: c.imageLinkOnClick,
          imageLinkUrl: c.imageLinkUrl,
          imageOpenInNewTab: c.imageOpenInNewTab,
          imageAlignment: c.imageAlignment,
          imageWidth: c.imageWidth,
          imageCornerRadius: c.imageCornerRadius,
          imageQuestion: c.imageQuestion,
          imageDescription: c.imageDescription,
          setImageCaption: noop,
          setImageQuestion: noop,
          setImageDescription: noop,
          onRemoveImage: noop,
        },
      };
    case 'Video':
      return {
        videoConfig: {
          videoUrl: c.videoUrl,
          videoCaption: c.videoCaption,
          videoWidth: c.videoWidth,
          videoAspectRatio: c.videoAspectRatio,
          videoCornerRadius: c.videoCornerRadius,
          videoQuestion: c.videoQuestion,
          videoDescription: c.videoDescription,
          videoRequired: c.videoRequired,
          videoHidden: c.videoHidden,
          videoLoop: c.videoLoop,
          videoAutoplay: c.videoAutoplay,
          videoShowControls: c.videoShowControls,
          videoSource: c.videoSource,
          setVideoCaption: noop,
          setVideoQuestion: noop,
          setVideoDescription: noop,
        },
      };
    case 'Contact':
      return {
        contactConfig: {
          contactQuestion: c.contactQuestion,
          contactHelperText: c.contactHelperText,
          contactFields: normalizeContactFields(c.contactFields),
          contactRequired: c.contactRequired,
          setContactQuestion: noop,
          setContactHelperText: noop,
        },
      };
    case 'Address':
      return {
        addressConfig: {
          addressQuestion: c.addressQuestion,
          addressHelperText: c.addressHelperText,
          addressFields: c.addressFields,
          addressRequired: c.addressRequired,
          setAddressQuestion: noop,
          setAddressHelperText: noop,
        },
      };
    case 'Work Info':
      return {
        workConfig: {
          workQuestion: c.workQuestion,
          workHelperText: c.workHelperText,
          workFields: normalizeWorkFields(c.workFields),
          workRequired: c.workRequired,
          setWorkQuestion: noop,
          setWorkHelperText: noop,
        },
      };
    case 'Short text':
      return {
        shortTextConfig: { ...c, setShortTextQuestion: noop, setShortTextHelperText: noop, setShortTextPlaceholder: noop },
        shortTextResponseQualityConfig: {
          enabled: c.shortTextResponseQualityEnabled,
          options: normalizeResponseQualityOptions(c.shortTextResponseQualityOptions ?? {}),
        },
      };
    case 'Long text':
      return {
        longTextConfig: { ...c, setLongTextQuestion: noop, setLongTextHelperText: noop, setLongTextPlaceholder: noop },
        longTextResponseQualityConfig: {
          enabled: c.longTextResponseQualityEnabled,
          options: normalizeResponseQualityOptions(c.longTextResponseQualityOptions ?? {}),
        },
      };
    case 'Single':
      return {
        singleConfig: {
          ...c,
          setSingleQuestion: noop,
          setSingleHelperText: noop,
          onOpenPanel: noop,
        },
      };
    case 'Multiple':
      return {
        multipleConfig: {
          ...c,
          setMultipleQuestion: noop,
          setMultipleHelperText: noop,
          onOpenPanel: noop,
        },
      };
    case 'Media':
      return {
        mediaConfig: { ...c, setMediaQuestion: noop, setMediaHelperText: noop },
      };
    case 'Captcha':
      return { captchaConfig: { ...c } };
    case 'Multi-image upload':
    case 'Upload':
      return {
        multiImageConfig: {
          question: c.question ?? c.multiImageQuestion ?? c.uploadQuestion,
          helperText: c.helperText ?? c.multiImageHelperText ?? c.uploadHelperText,
          maxFiles: c.maxFiles ?? c.multiImageMaxFiles,
          required: c.required ?? c.multiImageRequired,
          multipleFiles: c.multipleFiles ?? c.multiImageMultipleFiles,
          maxFileSize: c.maxFileSize ?? c.multiImageMaxFileSize ?? c.uploadMaxFileSize,
          uploadZoneSize: c.uploadZoneSize ?? c.multiImageUploadZoneSize,
          showPreview: c.showPreview ?? c.multiImageShowPreview,
          acceptedTypes: c.acceptedTypes ?? c.multiImageAcceptedTypes,
          setQuestion: noop,
          setHelperText: noop,
        },
        uploadConfig: {
          question: c.question ?? c.uploadQuestion ?? c.multiImageQuestion,
          helperText: c.helperText ?? c.uploadHelperText ?? c.multiImageHelperText,
          maxFileSize: c.maxFileSize ?? c.uploadMaxFileSize ?? c.multiImageMaxFileSize,
          required: c.required ?? c.uploadRequired ?? c.multiImageRequired,
          uploadZoneSize: c.uploadZoneSize,
          showPreview: c.showPreview,
          acceptedTypes: c.acceptedTypes,
          setQuestion: noop,
          setHelperText: noop,
        },
      };
    case 'Rating':
      return {
        ratingConfig: {
          ...c,
          setRatingQuestion: noop,
          setRatingLowLabel: noop,
          setRatingHighLabel: noop,
        },
      };
    case 'Date':
      return {
        dateConfig: { ...c, setDateQuestion: noop, setDateHelperText: noop },
      };
    case 'Time':
      return {
        timeConfig: { ...c, setTimeQuestion: noop, setTimeHelperText: noop },
      };
    default:
      return {};
  }
}
