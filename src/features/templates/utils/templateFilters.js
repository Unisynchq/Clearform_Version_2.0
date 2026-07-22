/**
 * @param {import('../data/templateCatalog').TemplateCatalogItem[]} templates
 * @param {string} filterTab
 */
export function filterTemplatesByCategory(templates, filterTab) {
  if (filterTab === 'All') return templates;
  return templates.filter((t) => t.filter === filterTab);
}

/**
 * @param {import('../data/templateCatalog').TemplateCatalogItem[]} templates
 * @param {string} query
 */
export function searchTemplates(templates, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return templates.filter(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      t.category.toLowerCase().includes(needle) ||
      t.filter.toLowerCase().includes(needle) ||
      t.description.toLowerCase().includes(needle)
  );
}

/**
 * Suggest alternate search terms from loaded templates when a query has no hits.
 * @param {import('../data/templateCatalog').TemplateCatalogItem[]} templates
 * @param {string} query
 * @param {number} limit
 */
export function suggestTemplateSearchTerms(templates, query, limit = 3) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const seen = new Set();
  const suggestions = [];

  for (const template of templates) {
    const candidates = [template.title, template.category, template.filter];
    for (const candidate of candidates) {
      const key = candidate.toLowerCase();
      if (seen.has(key) || key === needle) continue;
      if (key.includes(needle) || needle.includes(key.split(' ')[0])) {
        seen.add(key);
        suggestions.push(candidate);
        if (suggestions.length >= limit) return suggestions;
      }
    }
  }

  return suggestions;
}
