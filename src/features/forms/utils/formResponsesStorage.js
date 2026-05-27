import { readJson, writeJson, removeKey } from '@/utils/localStorageSafe';

const RESPONSES_KEY = 'clearform_form_responses';

/** @typedef {{ screenId: number, label: string, value: string }} FormResponseAnswer */

/**
 * @typedef {Object} FormResponseRecord
 * @property {string} id
 * @property {number|string} formId
 * @property {string} submittedAt ISO timestamp
 * @property {'completed'|'partial'} status
 * @property {string} contact
 * @property {FormResponseAnswer[]} answers
 */

/** @returns {Record<string, FormResponseRecord[]>} */
export const readAllFormResponses = () => {
  const stored = readJson(RESPONSES_KEY, {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
};

/** @param {Record<string, FormResponseRecord[]>} map */
export const writeAllFormResponses = (map) => {
  writeJson(RESPONSES_KEY, map);
};

export const clearFormResponses = () => {
  removeKey(RESPONSES_KEY);
};

/** @param {number|string} formId */
export const readFormResponses = (formId) => {
  if (formId == null) return [];
  const all = readAllFormResponses();
  const list = all[String(formId)];
  return Array.isArray(list) ? list : [];
};

/** @param {FormResponseRecord} response */
export const appendFormResponse = (response) => {
  if (response?.formId == null) return;
  const all = readAllFormResponses();
  const key = String(response.formId);
  const prev = Array.isArray(all[key]) ? all[key] : [];
  all[key] = [response, ...prev];
  writeAllFormResponses(all);
};

/** @param {number|string} formId */
export const clearFormResponsesForForm = (formId) => {
  if (formId == null) return;
  const all = readAllFormResponses();
  delete all[String(formId)];
  writeAllFormResponses(all);
};
