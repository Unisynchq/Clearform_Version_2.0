import { LuFileText } from 'react-icons/lu';

/**
 * Map a persisted user template to the catalog card shape used by TemplatesPage.
 * @param {import('./savedTemplatesStorage').SavedUserTemplate} saved
 */
export function toUserTemplateCatalogItem(saved) {
  return {
    id: saved.id,
    Icon: LuFileText,
    title: saved.title,
    description:
      saved.description?.trim() ||
      'Custom template saved from your workspace. Reuse it to spin up new forms faster.',
    category: saved.category || 'My Template',
    filter: 'All',
    tagVariant: 'light',
    isUserTemplate: true,
    snapshot: saved.snapshot,
    createdAt: saved.createdAt,
  };
}
