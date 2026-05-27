import {
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiFileUploadLine,
  RiIdCardLine,
  RiImageLine,
  RiMapPinLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
} from 'react-icons/ri';
import {
  BoxesIcon,
  ImagesCardIcon,
  LongTextIcon,
  ShortTextIcon,
  TextAlignLeftIcon,
  TextHIcon,
  VideoCardIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';

export const WELCOME_TEXT_SIZE_DESKTOP = {
  S: { title: '20px', titleLeading: '24px', desc: '13px' },
  M: { title: '24px', titleLeading: '28.8px', desc: '15px' },
  L: { title: '28px', titleLeading: '33.6px', desc: '17px' },
};
export const WELCOME_TEXT_SIZE_MOBILE = {
  S: { title: '24px', titleLeading: '28.8px', desc: '13px' },
  M: { title: '28px', titleLeading: '33.6px', desc: '15px' },
  L: { title: '32px', titleLeading: '38.4px', desc: '17px' },
};

/* ── Essentials → ContentCard block mapping (for intro screen) ── */
export const ESSENTIAL_TO_BLOCK = {
  'CTA':         { section: 'buildingBlocks', label: 'CTA' },
  'Heading':     { section: 'buildingBlocks', label: 'Heading' },
  'Description': { section: 'buildingBlocks', label: 'Description' },
  'Text Box':    { section: 'qualitative',    label: 'Short text' },
  'Images':      { section: 'buildingBlocks', label: 'Images' },
  'Video':       { section: 'buildingBlocks', label: 'Video' },
  'Captcha':     { section: 'interactive',    label: 'Captcha' },
};

/** Essentials tile label → configure panel key (openPanelByName). */
export const ESSENTIAL_LABEL_TO_CONFIG_PANEL = {
  CTA: 'ctaConfig',
  Heading: 'headingConfig',
  Description: 'descriptionConfig',
  'Text Box': 'shortTextConfig',
  Images: 'imageConfig',
  Video: 'videoConfig',
  Captcha: 'captchaConfig',
};

/** Maps screen label → `openPanelByName` key for the right configure panel. */
export const LABEL_TO_CONFIG_PANEL = {
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

/* ── Screen list icon + color map (keyed by screen label) ── */
export const SCREEN_ICON_MAP = {
  'CTA':               { Icon: BoxesIcon,      bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Heading':           { Icon: TextHIcon,         bg: 'bg-[#eef2ff]', color: 'text-indigo-500'  },
  'Description':       { Icon: TextAlignLeftIcon,  bg: 'bg-[#eef2ff]', color: 'text-indigo-500'  },
  'Images':            { Icon: ImagesCardIcon,    bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Video':             { Icon: VideoCardIcon,      bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Contact':           { Icon: RiIdCardLine,      bg: 'bg-[#eef2ff]', color: 'text-indigo-500'  },
  'Address':           { Icon: RiMapPinLine,      bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Work Info':         { Icon: RiBriefcaseLine,   bg: 'bg-[#fff7ed]', color: 'text-orange-500'  },
  'Short text':        { Icon: ShortTextIcon,    bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Long text':         { Icon: LongTextIcon,     bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Single':            { Icon: RiRadioButtonLine, bg: 'bg-[#fff2ee]', color: 'text-rose-500'    },
  'Multiple':          { Icon: RiCheckboxLine,    bg: 'bg-[#fff7ed]', color: 'text-orange-500'  },
  'Media':             { Icon: RiImageLine,       bg: 'bg-[#fff7ed]', color: 'text-orange-500'  },
  'Captcha':           { Icon: RiRobot2Line,      bg: 'bg-[#f4f4f4]', color: 'text-gray-500'   },
  'Multi-image upload':{ Icon: RiFileUploadLine,  bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Rating':            { Icon: RiStarLine,        bg: 'bg-[#eef2ff]', color: 'text-indigo-500'  },
  'Upload':            { Icon: RiFileUploadLine,  bg: 'bg-[#f0fdf4]', color: 'text-emerald-600' },
  'Date':              { Icon: RiCalendarLine,    bg: 'bg-[#eef2ff]', color: 'text-indigo-500'  },
};

/** Tailwind bg class → hex for logic picker badges */
export const SCREEN_ICON_BADGE_HEX = {
  'bg-[#f0fdf4]': '#f0fdf4',
  'bg-[#eef2ff]': '#eef2ff',
  'bg-[#fff7ed]': '#fff7ed',
  'bg-[#fff2ee]': '#fff2ee',
  'bg-[#ecfeff]': '#ecfeff',
  'bg-[#f4f4f4]': '#f4f4f4',
};
