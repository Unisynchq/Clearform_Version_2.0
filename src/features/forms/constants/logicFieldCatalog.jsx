import {
  RiIdCardLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiStarLine,
  RiCalendarLine,
  RiHashtag,
  RiFileUploadLine,
  RiCheckboxLine,
  RiImageLine,
  RiBarChartLine,
  RiListOrdered,
  RiPlayCircleLine,
} from 'react-icons/ri';

/** Figma field-picker badge colors (node 2608:4942) */
export const LOGIC_FIELD_BADGE = {
  pink: '#f8cdd8',
  blue: '#bdddf9',
  purple: '#ddd6fa',
  green: '#c4e3ba',
  yellow: '#fbe19d',
};

const shortTextIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
    <path
      d="M2 5.33398H15.5M2 8.33398H9.5"
      stroke="currentColor"
      strokeWidth="1.125"
      strokeLinecap="round"
    />
  </svg>
);

const longTextIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
    <path
      d="M2 4H15.5M2 7H15.5M2 10H15.5M2 13H11"
      stroke="currentColor"
      strokeWidth="1.125"
      strokeLinecap="round"
    />
  </svg>
);

/** Full catalog — order matches Figma listbox */
export const LOGIC_FIELD_CATALOG = [
  { id: 'contact-info', label: 'Contact Info', badgeBg: LOGIC_FIELD_BADGE.pink, Icon: RiIdCardLine },
  { id: 'address', label: 'Address', badgeBg: LOGIC_FIELD_BADGE.pink, Icon: RiMapPinLine },
  { id: 'phone-number', label: 'Phone Number', badgeBg: LOGIC_FIELD_BADGE.pink, Icon: RiPhoneLine },
  { id: 'short-text', label: 'Short Text', badgeBg: LOGIC_FIELD_BADGE.blue, Icon: shortTextIcon },
  { id: 'long-text', label: 'Long Text', badgeBg: LOGIC_FIELD_BADGE.blue, Icon: longTextIcon },
  { id: 'video-audio', label: 'Video and Audio', badgeBg: LOGIC_FIELD_BADGE.blue, Icon: RiPlayCircleLine },
  { id: 'picture-choice', label: 'Picture Choice', badgeBg: LOGIC_FIELD_BADGE.purple, Icon: RiImageLine },
  { id: 'ranking', label: 'Ranking', badgeBg: LOGIC_FIELD_BADGE.green, Icon: RiListOrdered },
  { id: 'email', label: 'Email', badgeBg: LOGIC_FIELD_BADGE.pink, Icon: RiMailLine },
  { id: 'opinion-scale', label: 'Opinion Scale', badgeBg: LOGIC_FIELD_BADGE.green, Icon: RiBarChartLine },
  { id: 'rating', label: 'Rating', badgeBg: LOGIC_FIELD_BADGE.green, Icon: RiStarLine },
  { id: 'date', label: 'Date', badgeBg: LOGIC_FIELD_BADGE.yellow, Icon: RiCalendarLine },
  { id: 'number', label: 'Number', badgeBg: LOGIC_FIELD_BADGE.yellow, Icon: RiHashtag },
  { id: 'file-upload', label: 'File Upload', badgeBg: LOGIC_FIELD_BADGE.yellow, Icon: RiFileUploadLine },
  { id: 'multiple-choice', label: 'Multiple Choice', badgeBg: LOGIC_FIELD_BADGE.purple, Icon: RiCheckboxLine },
];

const catalogById = Object.fromEntries(LOGIC_FIELD_CATALOG.map((f) => [f.id, f]));

/** Which logic fields are available per screen label in the builder */
export const SCREEN_LOGIC_FIELD_IDS = {
  Contact: ['contact-info', 'email', 'phone-number'],
  Address: ['address'],
  'Work Info': ['contact-info', 'short-text', 'long-text'],
  'Short text': ['short-text'],
  'Long text': ['long-text'],
  Video: ['video-audio'],
  Images: ['picture-choice'],
  Media: ['picture-choice', 'file-upload'],
  Single: ['multiple-choice'],
  Multiple: ['multiple-choice'],
  Rating: ['rating', 'opinion-scale', 'ranking'],
  Date: ['date'],
  Time: ['number', 'date'],
  Upload: ['file-upload'],
  'Multi-image upload': ['file-upload', 'picture-choice'],
  Heading: ['short-text'],
  Description: ['long-text'],
  CTA: ['short-text'],
  Captcha: ['short-text'],
};

export const getLogicFieldsForScreenLabel = (screenLabel) => {
  const ids = SCREEN_LOGIC_FIELD_IDS[screenLabel];
  if (ids?.length) return ids.map((id) => catalogById[id]).filter(Boolean);
  const fallbackId =
    screenLabel === 'Rating'
      ? 'rating'
      : screenLabel
        ? `field-${String(screenLabel).toLowerCase().replace(/\s+/g, '-')}`
        : 'short-text';
  const known = catalogById[fallbackId];
  if (known) return [known];
  return [
    {
      id: fallbackId,
      label: screenLabel || 'Field',
      badgeBg: LOGIC_FIELD_BADGE.blue,
      Icon: shortTextIcon,
    },
  ];
};

/** Human-readable field labels scoped to the screen/card that collects the answer. */
export const getLogicFieldLabelForScreen = (screen, field) => {
  if (!screen || !field) return field?.label ?? 'Field';
  const cardName = screen.name?.trim() || screen.label || 'Screen';

  if (screen.type === 'intro') {
    return field.label;
  }

  const byCard = {
    Heading: 'Answer',
    Description: 'Content',
    CTA: 'Button action',
    Captcha: 'Verification',
    Images: 'Selection',
    Video: 'Response',
    'Short text': 'Answer',
    'Long text': 'Answer',
    Single: 'Selected option',
    Multiple: 'Selected options',
    Media: 'Selected option',
    Rating: 'Rating value',
    Contact: field.label,
    Address: 'Address',
    'Work Info': field.label,
    Upload: 'File upload',
    'Multi-image upload': 'File upload',
    Date: 'Selected date',
    Time: 'Selected time',
  };

  const suffix = byCard[screen.label] ?? field.label;
  return `${cardName} — ${suffix}`;
};

const WELCOME_INPUT_FIELD_IDS = {
  'Free text': 'short-text',
  Number: 'number',
  Email: 'email',
  URL: 'short-text',
  Phone: 'phone-number',
  Password: 'short-text',
};

/** Fields available when branching from the Start screen (intro welcome input). */
export const getLogicFieldsForIntro = (welcomeInputType = 'Free text', welcomeHidden = false) => {
  if (welcomeHidden) return [];
  const fieldId = WELCOME_INPUT_FIELD_IDS[welcomeInputType] ?? 'short-text';
  const base = catalogById[fieldId];
  if (!base) return [];
  return [
    {
      ...base,
      label: `Start screen — ${welcomeInputType}`,
    },
  ];
};

/**
 * Field options for If/Then logic when leaving `screen`.
 * Conditions always reference answers collected on that same screen.
 */
export const getLogicFieldOptionsForScreen = (screen, { welcomeInputType, welcomeHidden } = {}) => {
  if (!screen) return [];
  if (screen.type === 'intro') {
    return getLogicFieldsForIntro(welcomeInputType, welcomeHidden);
  }
  if (screen.type !== 'content') return [];

  return getLogicFieldsForScreenLabel(screen.label).map((field) => ({
    ...field,
    label: getLogicFieldLabelForScreen(screen, field),
  }));
};

/**
 * One picker entry per question card in the form (matches sidebar / logic canvas).
 */
export function buildLogicQuestionOptions({
  screens = [],
  getQuestionText = (s) => s?.name || s?.label || 'Screen',
  welcomeInputType = 'Free text',
  welcomeHidden = false,
  introTitle = 'Start Screen',
} = {}) {
  const options = [];
  const contentScreens = screens.filter((s) => s.type === 'content');

  const intro = screens.find((s) => s.type === 'intro');
  if (intro && !welcomeHidden) {
    const introFields = getLogicFieldsForIntro(welcomeInputType, welcomeHidden);
    const field = introFields[0];
    if (field) {
      const question = introTitle?.trim() || 'Start Screen';
      options.push({
        id: `${intro.id}:${field.id}`,
        sourceScreenId: intro.id,
        fieldId: field.id,
        label: `Start — ${question}`,
        badgeBg: field.badgeBg,
        Icon: field.Icon,
        screenLabel: 'Start screen',
      });
    }
  }

  contentScreens.forEach((screen, idx) => {
    const fields = getLogicFieldOptionsForScreen(screen, { welcomeInputType, welcomeHidden });
    const field = fields[0];
    if (!field) return;

    const cardType = screen.label || 'Question';
    const question = getQuestionText(screen)?.trim() || screen.name?.trim() || cardType;
    const num = idx + 1;

    options.push({
      id: `${screen.id}:${field.id}`,
      sourceScreenId: screen.id,
      fieldId: field.id,
      label: `${num} ${cardType} — ${question}`,
      badgeBg: field.badgeBg,
      Icon: field.Icon,
      screenLabel: cardType,
    });
  });

  return options;
}

export const logicQuestionKey = (sourceScreenId, fieldId) => `${sourceScreenId}:${fieldId}`;

export const parseLogicQuestionKey = (key) => {
  const str = String(key ?? '');
  const sep = str.indexOf(':');
  if (sep < 0) return { sourceScreenId: null, fieldId: str };
  return {
    sourceScreenId: Number(str.slice(0, sep)),
    fieldId: str.slice(sep + 1),
  };
};

export const findLogicQuestionOption = (options, sourceScreenId, fieldId) =>
  options.find(
    (o) => Number(o.sourceScreenId) === Number(sourceScreenId) && o.fieldId === fieldId
  ) ?? null;

export const getLogicFieldById = (id) => catalogById[id];

/** Card types that support block visibility (SHOW THIS BLOCK IF). */
export const BLOCK_VISIBILITY_LABELS = new Set([
  'Heading',
  'Description',
  'Images',
  'Media',
  'Captcha',
]);

/**
 * Content screens that support If/Else flow branching on the logic canvas.
 * Excludes file uploads, captcha, and display-only blocks — those use Next/Skip/End only.
 */
export const IF_THEN_LOGIC_SCREEN_LABELS = new Set([
  /* Choice-based */
  'Single',
  'Multiple',
  'Media',
  'Images',
  /* Numeric / date */
  'Rating',
  'Date',
  'Time',
  /* Text & structured answers */
  'Short text',
  'Long text',
  'Contact',
  'Address',
  'Work Info',
]);

export const screenSupportsIfThenLogic = (screen) => {
  if (!screen || screen.type !== 'content') return false;
  return IF_THEN_LOGIC_SCREEN_LABELS.has(screen.label);
};

export const isChoiceLogicFieldId = (fieldId) =>
  fieldId === 'multiple-choice' || fieldId === 'picture-choice';

/** Choice labels from persisted screen config (Single / Multiple / Media). */
export function getLogicChoiceOptionsForScreen(screen) {
  if (!screen) return [];
  const config = screen.config ?? {};
  switch (screen.label) {
    case 'Single':
      return Array.isArray(config.singleOptions)
        ? config.singleOptions.map(String).filter(Boolean)
        : [];
    case 'Multiple':
      return Array.isArray(config.multipleOptions)
        ? config.multipleOptions.map(String).filter(Boolean)
        : [];
    case 'Media':
    case 'Images': {
      const opts = config.mediaOptions ?? [];
      return opts
        .map((o) => (typeof o === 'string' ? o : o?.label ?? ''))
        .map(String)
        .filter(Boolean);
    }
    default:
      return [];
  }
}

export function getLogicChoiceOptionsForCondition(screens, sourceScreenId, fieldId) {
  if (!isChoiceLogicFieldId(fieldId)) return [];
  const screen = screens?.find((s) => Number(s.id) === Number(sourceScreenId));
  return getLogicChoiceOptionsForScreen(screen);
}
