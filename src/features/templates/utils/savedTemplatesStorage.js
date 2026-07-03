import { readJson, writeJson } from '@/utils/localStorageSafe';

const SAVED_TEMPLATES_KEY = 'clearform_saved_templates';

const readAll = () => {
  const data = readJson(SAVED_TEMPLATES_KEY, {});
  return data && typeof data === 'object' ? data : {};
};

const accountKey = (email) => email?.trim().toLowerCase() ?? '';

/**
 * @typedef {Object} SavedUserTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [category]
 * @property {string} [sourceFormId]
 * @property {object} snapshot
 * @property {number} createdAt
 */

/** @returns {SavedUserTemplate[]} */
export function readSavedTemplates(email) {
  const key = accountKey(email);
  if (!key) return [];
  const list = readAll()[key];
  return Array.isArray(list) ? list : [];
}

/** @returns {SavedUserTemplate[]} */
export function saveUserTemplate(email, template) {
  const key = accountKey(email);
  if (!key) return readSavedTemplates(email);
  const all = readAll();
  const list = Array.isArray(all[key]) ? all[key] : [];
  const entry = {
    id: template.id ?? `user-${crypto.randomUUID?.() ?? Date.now()}`,
    title: template.title,
    description: template.description ?? '',
    category: template.category ?? 'My Template',
    sourceFormId: template.sourceFormId ?? null,
    snapshot: template.snapshot,
    createdAt: template.createdAt ?? Date.now(),
  };
  all[key] = [entry, ...list.filter((t) => t.id !== entry.id)];
  writeJson(SAVED_TEMPLATES_KEY, all);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clearform:user-templates-updated'));
  }
  return all[key];
}

/** @returns {SavedUserTemplate | null} */
export function findSavedTemplate(email, templateId) {
  return readSavedTemplates(email).find((t) => t.id === templateId) ?? null;
}
