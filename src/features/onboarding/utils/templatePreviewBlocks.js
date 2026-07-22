import { getTemplateFormDefinition } from '@/features/templates/data/templateFormDefinitions';
import {
  DEFAULT_TEMPLATE_PREVIEW_BLOCKS,
  TEMPLATE_PREVIEW_META,
} from '../constants/templatePreviewContent';

const HELPER_KEYS = [
  'shortTextHelperText',
  'longTextHelperText',
  'singleHelperText',
  'multipleHelperText',
  'contactHelperText',
  'uploadHelperText',
  'helperText',
  'dateHelperText',
  'workHelperText',
  'mediaHelperText',
  'ratingHelperText',
];

function getHelperText(config) {
  if (!config) return null;
  for (const key of HELPER_KEYS) {
    if (config[key]) return config[key];
  }
  return null;
}

function extractPreviewFields(card) {
  const cfg = card.config ?? {};
  const label = card.label;

  switch (label) {
    case 'Heading':
      return null;
    case 'Contact': {
      if (Array.isArray(cfg.contactFields)) {
        return cfg.contactFields
          .filter((f) => f.required !== false)
          .map((f) => f.placeholder || f.label);
      }
      return ['Jane', 'Smith', 'jane@example.com', '+1 (555) 000-0000'];
    }
    case 'Work Info':
      return ['Acme Inc.', 'Director of Operations'];
    case 'Short text':
      return [cfg.shortTextPlaceholder || 'Type your answer here…'];
    case 'Long text':
      return [cfg.longTextPlaceholder || 'Type your answer here…'];
    case 'Single':
      return (cfg.singleOptions ?? []).slice(0, 5);
    case 'Multiple':
      return (cfg.multipleOptions ?? []).slice(0, 6);
    case 'Rating': {
      const max = cfg.ratingMaxRating ?? 5;
      const nums = Array.from({ length: Math.min(max, 5) }, (_, i) => String(i + 1));
      if (cfg.ratingLowLabel && cfg.ratingHighLabel) {
        return [cfg.ratingLowLabel, ...nums, cfg.ratingHighLabel];
      }
      return nums;
    }
    case 'Date':
      return ['MM / DD / YYYY'];
    case 'Upload':
    case 'Multi-image upload':
      return ['Drop file here or click to browse'];
    case 'Media':
      return (cfg.mediaOptions ?? [])
        .map((o) => (typeof o === 'object' && o !== null ? o.label : o))
        .slice(0, 5);
    case 'Captcha':
      return ['Verify you are human'];
    default:
      return [cfg.placeholder || 'Your answer…'];
  }
}

/**
 * Build scrollable preview blocks + meta for the onboarding template modal.
 * @param {string | undefined} templateId
 */
export function getTemplatePreviewBlocks(templateId) {
  const def = getTemplateFormDefinition(templateId);
  if (!def) {
    return { blocks: DEFAULT_TEMPLATE_PREVIEW_BLOCKS, meta: TEMPLATE_PREVIEW_META };
  }

  const blocks = [
    {
      type: 'welcome',
      label: 'Welcome screen',
      title: def.intro.title,
      description: def.intro.description,
    },
  ];

  let questionNum = 0;

  for (const card of def.cards) {
    if (card.label === 'Heading') {
      blocks.push({
        type: 'section',
        label: 'Section heading',
        title: cfgHeadingTitle(card),
        description: card.config?.subHeading ?? null,
      });
      continue;
    }

    questionNum += 1;
    blocks.push({
      type: 'question',
      num: questionNum,
      label: card.label,
      title: card.previewText,
      description: getHelperText(card.config),
      fields: extractPreviewFields(card),
    });
  }

  const meta = {
    questionCount: questionNum,
    duration: def.intro.duration?.replace(/^Takes\s+/i, '') ?? '~10 minutes',
    structure: def.cards.some((c) => c.label === 'Heading') ? 'Multi-section' : 'Single flow',
  };

  return { blocks, meta };
}

function cfgHeadingTitle(card) {
  return card.config?.headingText ?? card.previewText;
}
