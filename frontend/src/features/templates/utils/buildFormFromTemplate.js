import { getTemplateFormDefinition } from '../data/templateFormDefinitions';

/**
 * Build form builder state from a catalog template id.
 * @param {string} templateId
 * @returns {{ screens: object[], formTitle: string, intro: object, end: object, nextId: number } | null}
 */
export function buildFormFromTemplate(templateId) {
  const def = getTemplateFormDefinition(templateId);
  if (!def) return null;

  let nextId = 1;
  const introScreen = {
    id: nextId++,
    name: 'Start Screen',
    type: 'intro',
  };

  const contentScreens = def.cards.map((card) => ({
    id: nextId++,
    name: card.label,
    type: 'content',
    section: card.section,
    label: card.label,
    previewText: card.previewText,
    config: card.config ? { ...card.config } : undefined,
  }));

  const endScreen = {
    id: nextId++,
    name: 'End Screen',
    type: 'end',
  };

  return {
    screens: [introScreen, ...contentScreens, endScreen],
    formTitle: def.formTitle,
    intro: def.intro,
    end: def.end ?? {
      title: 'Thanks for your response!',
      description:
        'Your submission has been recorded. We really appreciate you taking the time to share your feedback with us.',
      buttonText: 'Done',
    },
    nextId,
  };
}
