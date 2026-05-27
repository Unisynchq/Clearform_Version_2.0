import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let content = fs.readFileSync(pagePath, 'utf8');

if (content.includes('builderPanelBindings')) {
  console.log('bindings already present');
  process.exit(0);
}

const panelStart = content.indexOf('<FormBuilderRightPanels');
if (panelStart < 0) throw new Error('FormBuilderRightPanels usage missing');

const scopeChunk = content.slice(0, panelStart);
const bindingNames = new Set();
for (const m of scopeChunk.matchAll(/const \[([a-zA-Z0-9_]+), (set[A-Za-z0-9_]+)\]/g)) {
  bindingNames.add(m[1]);
  bindingNames.add(m[2]);
}
for (const name of [
  'isPreview', 'activeTab', 'TABS', 'ESSENTIALS', 'CONTENT_SECTIONS', 'QUESTION_TEMPLATE_CATEGORIES',
  'CONFIGURE_TILE_GRID', 'CONFIGURE_TILE_BASE', 'ACCORDION_SECTIONS', 'CTA_COLOR_PALETTE',
  'closeAllRightPanels', 'switchPanel', 'openPanelByName', 'openConfigurePanelForLabel',
  'handleAddScreen', 'handleSelectTheme', 'priorScreensForActive', 'getLogicQuestionOptionsForForm',
  'getLogicDestinationOptions', 'ifThenLogicPanelEdge', 'ifThenDraft', 'closeIfThenLogicPanel',
  'cancelIfThenLogicPanel', 'saveIfThenLogic', 'screens', 'skipPanelEnterRef', 'markFormTouched', 'hexToRgba', 'deviceView',
  'THEMES', 'CTA_COLOR_PALETTE',
]) {
  if (scopeChunk.includes(name)) bindingNames.add(name);
}

const objectBody = [...bindingNames].sort().map((n) => `    ${n},`).join('\n');
const marker = '  return (\n    <div className="flex flex-col h-screen overflow-hidden bg-white">';
const idx = content.indexOf(marker);
if (idx < 0) throw new Error('main return marker not found');

const bindingsConst = `  const builderPanelBindings = {\n${objectBody}\n  };\n\n`;
content = content.slice(0, idx) + bindingsConst + content.slice(idx);
fs.writeFileSync(pagePath, content, 'utf8');
console.log('Added bindings:', bindingNames.size);
