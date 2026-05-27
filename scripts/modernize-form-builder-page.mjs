import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);

const footerIdx = lines.findIndex((l) => l.startsWith('const ContentCardFooter'));
const pageIdx = lines.findIndex((l) => l.startsWith('const FormBuilderPage'));
if (footerIdx < 0 || pageIdx < 0) throw new Error('markers not found', { footerIdx, pageIdx });

// Drop inline card + duplicated constants (keep module versions).
lines = [...lines.slice(0, footerIdx), ...lines.slice(pageIdx)];

let content = lines.join('\n');

// Remove app Sidebar from builder body.
content = content.replace(/import Sidebar from '@\/components\/layout\/Sidebar';\n/, '');
content = content.replace(/<Sidebar[\s\S]*?\/>\n?/m, '');

// Maps field removal (files already deleted).
content = content.replace(/import MapFieldStaticPreview[\s\S]*?;\n/, '');
content = content.replace(/const MapLocationPicker[\s\S]*?;\n/, '');
content = content.replace(/import MapConfigurePanel[\s\S]*?;\n/, '');
content = content.replace(/import \{ DEFAULT_MAP_CENTER \}[\s\S]*?;\n/, '');
content = content.replace(/  \/\* ── Map configure panel state ── \*\/\n[\s\S]*?const \[mapSections[\s\S]*?\}\);\n\n/, '');
content = content.replace(/    \} else if \(itemLabel === 'Maps'\) \{\n      setShowMapConfigPanel\(true\);\n/, '    ');
content = content.replace(/    setShowMapConfigPanel\(false\);\n/, '');
content = content.replace(/    else if \(name === 'mapConfig'\) setShowMapConfigPanel\(true\);\n/, '');
content = content.replace(/                  mapConfig: showMapConfigPanel,\n/, '');
content = content.replace(/    videoCornerRadius,\n    mapQuestion,[\s\S]*?    mapHidden,\n    mediaQuestion,/, '    videoCornerRadius,\n    mediaQuestion,');
content = content.replace(/      setVideoCornerRadius,\n      setMapQuestion,[\s\S]*?      setMapHidden,\n      setMediaQuestion,/, '      setVideoCornerRadius,\n      setMediaQuestion,');
content = content.replace(/      Video: videoQuestion,\n      Maps: mapQuestion,\n/, '      Video: videoQuestion,\n');
content = content.replace(/      videoQuestion,\n      mapQuestion,\n/, '      videoQuestion,\n');
content = content.replace(/                              mapConfig=\{\{[\s\S]*?\}\}\n                            captchaConfig/g, '                            captchaConfig');
content = content.replace(/                            mapConfig=\{\{[\s\S]*?\}\}\n                            captchaConfig/g, '                            captchaConfig');
content = content.replace(/\n        \/\* ── Map Configure panel ── \*\/\n        <AnimatePresence>[\s\S]*?        <\/AnimatePresence>\n\n        \/\* ── Captcha Configure/, '\n        {/* ── Captcha Configure');

// Module imports (after react-icons block).
const moduleImports = `
import ContentCard from '@/features/forms/formBuilder/BuilderContentCard';
import FormBuilderRightPanels from '@/features/forms/formBuilder/FormBuilderRightPanels';
import FormBuilderSettingsPanel from '@/features/forms/components/FormBuilderSettingsPanel';
import FormBuilderStepBar from '@/features/forms/formBuilder/FormBuilderStepBar';
import { useFormBuilderRoute } from '@/features/forms/formBuilder/useFormBuilderRoute';
import { finishBuilderRouteTransition } from '@/store/slices/uiSlice';
import * as builderScreenMaps from '@/features/forms/formBuilder/builderScreenMaps';
import {
  ESSENTIALS,
  CONTENT_SECTIONS,
  QUESTION_TEMPLATE_CATEGORIES,
  CONFIGURE_TILE_GRID,
  CONFIGURE_TILE_BASE,
  ACCORDION_SECTIONS,
  CTA_COLOR_PALETTE,
} from '@/features/forms/formBuilder/builderConfiguratorConstants';
import {
  BUILDER_PAGE_EASE,
  builderSectionVariants,
  builderTabContentVariants,
} from '@/features/forms/formBuilder/builderMotion';
`;

if (!content.includes('import ContentCard from')) {
  content = content.replace(
    /import clearformLogo from/,
    `${moduleImports}\nimport clearformLogo from`,
  );
}

// Destructure screen maps in component if missing.
if (!content.includes('} = builderScreenMaps')) {
  content = content.replace(
    /const FormBuilderPage = \(\) => \{/,
    `const {
  SCREEN_ICON_MAP,
  LABEL_TO_CONFIG_PANEL,
  WELCOME_TEXT_SIZE_DESKTOP,
  WELCOME_TEXT_SIZE_MOBILE,
  ESSENTIAL_TO_BLOCK,
  SCREEN_ICON_BADGE_HEX,
} = builderScreenMaps;

const FormBuilderPage = () => {`,
  );
}

// useFormBuilderRoute hook
if (!content.includes('useFormBuilderRoute')) {
  content = content.replace(
    /const activeFormId = location\.state\?\.formId \?\? null;/,
    `const { formId: routeFormId, isNewForm } = useFormBuilderRoute();
  const activeFormId = routeFormId;`,
  );
}

// Extract right panels block
lines = content.split('\n');
const panelStart = lines.findIndex((l) => l.includes('Configure panel (right)'));
const panelEnd = lines.findIndex((l, i) => i > panelStart && l.trim() === '</>' && lines[i + 1]?.trim() === '');
if (panelStart < 0) {
  console.warn('Panel block not found; skipping panel extraction');
  fs.writeFileSync(pagePath, content, 'utf8');
  process.exit(0);
}

let panelEndIdx = panelStart;
for (let i = panelStart; i < lines.length; i++) {
  if (lines[i].includes('</>') && lines[i - 1]?.includes('</AnimatePresence>')) {
    panelEndIdx = i + 1;
    break;
  }
}

// Find design panel closing - look for DeleteScreenModal
const deleteIdx = lines.findIndex((l) => l.includes('<DeleteScreenModal'));
const panelLines = lines.slice(panelStart - 1, deleteIdx);
const panelBody = panelLines.join('\n');

// Regenerate FormBuilderRightPanels from current page panel body
const scopeChunk = lines.slice(0, panelStart).join('\n');
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
]) {
  if (scopeChunk.includes(name)) bindingNames.add(name);
}
const sortedBindings = [...bindingNames].sort();
const destructure = sortedBindings.join(',\n  ');

const panelImportBlock = `import { motion, AnimatePresence } from 'motion/react';
import ToggleSwitch, { TOGGLE_TRACK_OFF, TOGGLE_TRACK_ON, toggleTrackClassName } from '@/components/ui/ToggleSwitch';
import ResponseQualityScoringCard, { DEFAULT_RESPONSE_QUALITY_OPTIONS } from '@/features/forms/components/ResponseQualityScoringCard';
import IfThenLogicPanel from '@/features/forms/components/IfThenLogicPanel';
import TimeConfigurePanel from '@/features/forms/components/TimeConfigurePanel';
import BlockVisibilityConditions from '@/features/forms/components/BlockVisibilityConditions';
import {
  ESSENTIALS, CONTENT_SECTIONS, QUESTION_TEMPLATE_CATEGORIES, CONFIGURE_TILE_GRID, CONFIGURE_TILE_BASE, ACCORDION_SECTIONS, CTA_COLOR_PALETTE,
} from '@/features/forms/formBuilder/builderConfiguratorConstants';
import { getLogicCardQuestionText } from '@/features/forms/utils/screenConfigSync';
import { formatFileSizeCompact, formatMaxSizeLabel, parseMaxFileSizeBytes } from '@/features/forms/utils/fileSizeLimits';
import {
  RiAddLine, RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightSLine, RiArrowUpSLine, RiBriefcaseLine, RiCalendarLine,
  RiCheckboxLine, RiCheckLine, RiCloseLine, RiDeleteBin6Line, RiFileUploadLine, RiGlobeLine, RiIdCardLine, RiImageLine,
  RiLinkedinBoxLine, RiMailLine, RiMapPinLine, RiPencilLine, RiRadioButtonLine, RiRobot2Line, RiStarLine, RiStarFill, RiTimeLine, RiExternalLinkLine,
} from 'react-icons/ri';
import { BoxesIcon, ImagesCardIcon, LongTextIcon, ShortTextIcon, TextAlignLeftIcon, TextHIcon, VideoCardIcon } from '@/features/forms/formBuilder/builderFieldIcons';
`;

fs.writeFileSync(
  'src/features/forms/formBuilder/FormBuilderRightPanels.jsx',
  `${panelImportBlock}
export default function FormBuilderRightPanels({ ${destructure} }) {
  return (
    <>
${panelBody}
    </>
  );
}
`,
  'utf8',
);

const objectBody = sortedBindings.map((n) => `    ${n},`).join('\n');
const bindingsConst = `  const builderPanelBindings = {\n${objectBody}\n  };\n\n`;

const returnIdx = content.lastIndexOf('  return (');
content = content.slice(0, returnIdx) + bindingsConst + content.slice(returnIdx);

const newLines = content.split('\n');
const ps = newLines.findIndex((l) => l.includes('Configure panel (right)'));
const de = newLines.findIndex((l, i) => i > ps && l.includes('<DeleteScreenModal'));
newLines.splice(ps - 1, de - ps, '        <FormBuilderRightPanels {...builderPanelBindings} />');

fs.writeFileSync(pagePath, newLines.join('\n'), 'utf8');
console.log('Modernized page. Bindings:', sortedBindings.length, 'Removed inline card lines:', pageIdx - footerIdx);
