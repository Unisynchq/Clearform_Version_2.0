import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);

// 1) Remove inline ContentCard + duplicated screen maps (before FormBuilderPage component).
const footerIdx = lines.findIndex((l) => l.startsWith('const ContentCardFooter'));
const pageIdx = lines.findIndex((l) => l.startsWith('const FormBuilderPage ='));
if (footerIdx < 0 || pageIdx < 0) throw new Error('card markers missing');
lines = [...lines.slice(0, footerIdx), ...lines.slice(pageIdx)];

let content = lines.join('\n');

// 2) Maps + sidebar cleanup.
content = content.replace(/import Sidebar from '@\/components\/layout\/Sidebar';\n/, '');
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

// 3) Duplicate configurator constants (already in builderConfiguratorConstants).
content = content.replace(
  /\/\* ── Configure panel: essentials grid items ── \*\/[\s\S]*?^];\n\n\/\* ── Design themes ── \*\/\n/m,
  '/* ── Design themes ── */\n',
);

// 4) Module imports.
const moduleImports = `
import ContentCard from '@/features/forms/formBuilder/BuilderContentCard';
import FormBuilderRightPanels from '@/features/forms/formBuilder/FormBuilderRightPanels';
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
`;

if (!content.includes('import ContentCard from')) {
  content = content.replace(/import clearformLogo from/, `${moduleImports}\nimport clearformLogo from`);
}

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

content = content.replace(
  /const activeFormId = location\.state\?\.formId \?\? null;/,
  `const { formId: routeFormId } = useFormBuilderRoute();
  const activeFormId = routeFormId;`,
);

if (!content.includes('finishBuilderRouteTransition')) {
  content = content.replace(
    /const previewScreenValidatorRef = useRef\(null\);/,
    `const previewScreenValidatorRef = useRef(null);

  useEffect(() => {
    dispatch(finishBuilderRouteTransition());
  }, [dispatch]);`,
  );
}

// 5) Extract right panels (9489-14385, 1-based).
lines = content.split('\n');
const panelStart0 = lines.findIndex((l) => l.includes('Configure panel (right)'));
const panelEnd0 = lines.findIndex((l, i) => i > panelStart0 && l.trim() === '</>}' && lines[i + 1]?.trim() === '');
if (panelStart0 < 0 || panelEnd0 < 0) throw new Error('panel bounds not found', { panelStart0, panelEnd0 });

const panelBody = lines.slice(panelStart0, panelEnd0 + 1).join('\n');

const scopeChunk = lines.slice(0, panelStart0).join('\n');
const bindingNames = new Set();
for (const m of scopeChunk.matchAll(/const \[([a-zA-Z0-9_]+), (set[A-Za-z0-9_]+)\]/g)) {
  bindingNames.add(m[1]);
  bindingNames.add(m[2]);
}
for (const name of [
  'isPreview', 'activeTab', 'TABS', 'ESSENTIALS', 'CONTENT_SECTIONS', 'QUESTION_TEMPLATE_CATEGORIES',
  'CONFIGURE_TILE_GRID', 'CONFIGURE_TILE_BASE', 'ACCORDION_SECTIONS', 'CTA_COLOR_PALETTE', 'THEMES',
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
import { formatFileSizeCompact, formatMaxSizeLabel, parseMaxFileSizeBytes } from '@/features/forms/utils/fileSizeLimits';
import {
  RiAddLine, RiAlignLeft, RiAlignCenter, RiAlignRight, RiArrowDownSLine, RiArrowLeftSLine, RiArrowRightLine,
  RiArrowRightSLine, RiArrowUpSLine, RiBriefcaseLine, RiCalendarLine, RiCheckboxLine, RiCheckLine, RiCloseLine,
  RiDeleteBin6Line, RiExternalLinkLine, RiFileUploadLine, RiGlobeLine, RiHeartLine, RiIdCardLine, RiImageLine,
  RiLinkedinBoxLine, RiMailLine, RiMapPinLine, RiPencilLine, RiRadioButtonLine, RiRobot2Line, RiStarLine, RiStarFill, RiTimeLine,
} from 'react-icons/ri';
import { PiCaretCircleUp } from 'react-icons/pi';
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

const replacement = `        {!isPreview && (
          <FormBuilderRightPanels
            ${sortedBindings.map((n) => `${n}={${n}}`).join('\n            ')}
          />
        )}`;

lines.splice(panelStart0, panelEnd0 - panelStart0 + 1, ...replacement.split('\n'));
content = lines.join('\n');

const objectBody = sortedBindings.map((n) => `    ${n},`).join('\n');
const bindingsConst = `  const builderPanelBindings = {\n${objectBody}\n  };\n\n`;
const marker = '  return (\n    <div className="flex flex-col h-screen overflow-hidden bg-white">';
const returnIdx = content.indexOf(marker);
if (returnIdx < 0) throw new Error('main return not found');
if (!content.includes('builderPanelBindings')) {
  content = content.slice(0, returnIdx) + bindingsConst + content.slice(returnIdx);
}
content = content.replace(
  /        \{\!isPreview && \(\n          <FormBuilderRightPanels\n            [\s\S]*?\n          \/>\n        \)\}/,
  '        {!isPreview && <FormBuilderRightPanels {...builderPanelBindings} />}',
);

// Remove broken sidebar stub if any.
content = content.replace(/\n        \{\/\* ── Icon sidebar[\s\S]*?\n\n        \{\/\* ── Screens panel/, '\n        {/* ── Screens panel');

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Safe modernize complete. Page lines:', content.split('\n').length, 'bindings:', sortedBindings.length);
