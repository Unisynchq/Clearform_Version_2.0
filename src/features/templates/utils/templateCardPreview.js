import { getTemplateFormDefinition } from '@/features/templates/data/templateFormDefinitions';
import { getUserTemplateCardPreview } from './userTemplatePreview';

const DEFAULT_PREVIEW = {
  sectionLabel: 'SECTION HEADING',
  title: 'Tell us about yourself',
  description:
    'This section covers your professional background and preferences. All information is kept confidential and used only to improve your experience.',
  formMeta: '5 min form · 10 Questions',
};

/**
 * Surface copy for the mini preview on template cards + meta row.
 */
export function getTemplateCardPreview(templateId, snapshot = null) {
  if (snapshot) return getUserTemplateCardPreview(snapshot);

  const def = getTemplateFormDefinition(templateId);
  if (!def) return DEFAULT_PREVIEW;

  const headingCard = def.cards.find((c) => c.label === 'Heading');
  const questionCount = def.cards.filter(
    (c) => c.label !== 'Heading' && c.label !== 'Captcha'
  ).length;

  let durationLabel = '~10 min';
  if (def.intro.duration) {
    const m = def.intro.duration.match(/~?\s*(\d+)\s*min/i);
    durationLabel = m ? `~${m[1]} min` : def.intro.duration.replace(/^Takes\s+/i, '').trim();
  }

  return {
    sectionLabel: 'SECTION HEADING',
    title: headingCard?.config?.headingText ?? headingCard?.previewText ?? def.intro.title,
    description:
      headingCard?.config?.subHeading ??
      def.intro.description ??
      DEFAULT_PREVIEW.description,
    formMeta: `${durationLabel} form · ${questionCount} Questions`,
  };
}
