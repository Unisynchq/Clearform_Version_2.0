import {
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiFileUploadLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiMapPinLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
  RiTimeLine,
} from 'react-icons/ri';
import cardTheme1 from '@/assets/Card_Themes/Theme-1.jpeg';
import cardTheme2 from '@/assets/Card_Themes/Theme-2.jpeg';
import cardTheme3 from '@/assets/Card_Themes/Theme-3.jpeg';
import cardTheme4 from '@/assets/Card_Themes/Theme-4.jpeg';
import {
  BoxesIcon,
  ImagesCardIcon,
  LongTextIcon,
  ShortTextIcon,
  TextAlignLeftIcon,
  TextHIcon,
  VideoCardIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';


/* ── Configure panel: essentials grid items ── */
export const ESSENTIALS = [
  { label: 'CTA', Icon: BoxesIcon },
  { label: 'Heading', Icon: TextHIcon },
  { label: 'Description', Icon: TextAlignLeftIcon },
  { label: 'Text Box', Icon: ShortTextIcon },
  { label: 'Images', Icon: ImagesCardIcon },
  { label: 'Video', Icon: VideoCardIcon },
  { label: 'Captcha', Icon: RiRobot2Line },
];

export const CONFIGURE_TILE_GRID = 'grid grid-cols-3 gap-1.5 items-start pb-[2px]';
export const CONFIGURE_TILE_BASE =
  'flex flex-col items-center justify-center gap-[4px] h-[42px] w-full px-1 rounded-[6px] border cursor-pointer transition-colors';

/* ── Configure panel: collapsible sections ── */
export const ACCORDION_SECTIONS = [
  { key: 'questionTemplates', label: 'Question Templates' },
  { key: 'fieldSettings', label: 'Field Settings' },
  { key: 'appearance', label: 'Appearance' },
];

/* ── Question template categories ── */
export const QUESTION_TEMPLATE_CATEGORIES = [
  {
    label: 'Building Blocks',
    items: [
      { label: 'CTA', Icon: BoxesIcon },
      { label: 'Heading', Icon: TextHIcon },
      { label: 'Description', Icon: TextAlignLeftIcon },
      { label: 'Images', Icon: ImagesCardIcon },
      { label: 'Video', Icon: VideoCardIcon },
    ],
  },
  {
    label: 'Basic Information',
    items: [
      { label: 'Contact', Icon: RiIdCardLine },
      { label: 'Address', Icon: RiMapPinLine },
      { label: 'Work Info', Icon: RiBriefcaseLine },
    ],
  },
  {
    label: 'Qualitative Inputs',
    items: [
      { label: 'Short text', Icon: ShortTextIcon },
      { label: 'Long text', Icon: LongTextIcon },
    ],
  },
  {
    label: 'Choice Based',
    items: [
      { label: 'Single', Icon: RiRadioButtonLine },
      { label: 'Multiple', Icon: RiCheckboxLine },
      { label: 'Media', Icon: RiImageLine },
    ],
  },
  {
    label: 'Interactive',
    items: [
      { label: 'Upload', Icon: RiFileUploadLine },
      { label: 'Multi-image upload', Icon: RiImageLine },
      { label: 'Captcha', Icon: RiRobot2Line },
    ],
  },
  {
    label: 'Numeric Inputs',
    items: [
      { label: 'Rating', Icon: RiStarLine },
      { label: 'Time', Icon: RiTimeLine },
      { label: 'Date', Icon: RiCalendarLine },
    ],
  },
];

/* ── Content panel sections (shown when Add Screen is clicked after intro) ── */
export const CONTENT_SECTIONS = [
  {
    key: 'buildingBlocks',
    label: 'Building Blocks',
    items: [
      { label: 'CTA', Icon: BoxesIcon },
      { label: 'Heading', Icon: TextHIcon },
      { label: 'Description', Icon: TextAlignLeftIcon },
      { label: 'Images', Icon: ImagesCardIcon },
      { label: 'Video', Icon: VideoCardIcon },
    ],
  },
  {
    key: 'basicInfo',
    label: 'Basic Information',
    items: [
      { label: 'Contact', Icon: RiIdCardLine },
      { label: 'Address', Icon: RiMapPinLine },
      { label: 'Work Info', Icon: RiLinkedinBoxLine },
    ],
  },
  {
    key: 'qualitative',
    label: 'Qualitative Inputs',
    items: [
      { label: 'Short text', Icon: ShortTextIcon },
      { label: 'Long text', Icon: LongTextIcon },
    ],
  },
  {
    key: 'choiceBased',
    label: 'Choice Based',
    items: [
      { label: 'Single', Icon: RiRadioButtonLine },
      { label: 'Multiple', Icon: RiCheckboxLine },
      { label: 'Media', Icon: RiImageLine },
    ],
  },
  {
    key: 'interactive',
    label: 'Interactive',
    items: [
      { label: 'Upload', Icon: RiFileUploadLine },
      { label: 'Multi-image upload', Icon: RiImageLine },
      { label: 'Captcha', Icon: RiRobot2Line },
    ],
  },
  {
    key: 'numeric',
    label: 'Numeric Inputs',
    items: [
      { label: 'Rating', Icon: RiStarLine },
      { label: 'Time', Icon: RiTimeLine },
      { label: 'Date', Icon: RiCalendarLine },
    ],
  },
];

/* ── Design themes ── */
export const THEMES = [
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
export const TYPOGRAPHY_FONTS = {
  default:   "'DM Sans', sans-serif",
  serif:     "Georgia, 'Times New Roman', serif",
  monospace: "'Consolas', 'Courier New', monospace",
};

/* ── Hex → rgba helper ── */
export const hexToRgba = (hex, opacity) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`;
};

/* ── CTA configure panel – text-color palette (6 rows × 8 cols) ── */
export const CTA_COLOR_PALETTE = [
  ['#ffffff', '#ffffff', '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280', '#374151', '#111827'],
  ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'],
  ['#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#713f12'],
  ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'],
  ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'],
  ['#fae8ff', '#f5d0fe', '#e879f9', '#d946ef', '#a855f7', '#9333ea', '#7e22ce', '#581c87'],
];
