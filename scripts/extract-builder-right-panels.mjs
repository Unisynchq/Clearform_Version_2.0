import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
const lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);

const panelStart = 5318; // 1-based inclusive
const panelEnd = 10128;

const panelBody = lines.slice(panelStart - 1, panelEnd).join('\n');

const pageHead = lines.slice(0, panelStart - 2).join('\n');
const pageTail = lines.slice(panelEnd).join('\n');

// Collect bindings: useState pairs + common consts used in panels (from first 5317 lines)
const scopeChunk = lines.slice(0, panelStart - 1).join('\n');
const bindingNames = new Set();
for (const m of scopeChunk.matchAll(/const \[([a-zA-Z0-9_]+), (set[A-Za-z0-9_]+)\]/g)) {
  bindingNames.add(m[1]);
  bindingNames.add(m[2]);
}
for (const name of [
  'isPreview',
  'activeTab',
  'TABS',
  'ESSENTIALS',
  'CONTENT_SECTIONS',
  'QUESTION_TEMPLATE_CATEGORIES',
  'CONFIGURE_TILE_GRID',
  'CONFIGURE_TILE_BASE',
  'ACCORDION_SECTIONS',
  'CTA_COLOR_PALETTE',
  'closeAllRightPanels',
  'switchPanel',
  'openPanelByName',
  'openConfigurePanelForLabel',
  'handleAddScreen',
  'handleSelectTheme',
  'priorScreensForActive',
  'getLogicQuestionOptionsForForm',
  'getLogicDestinationOptions',
  'ifThenLogicPanelEdge',
  'ifThenDraft',
  'closeIfThenLogicPanel',
  'cancelIfThenLogicPanel',
  'saveIfThenLogic',
  'screens',
  'skipPanelEnterRef',
  'markFormTouched',
  'hexToRgba',
  'deviceView',
]) {
  if (scopeChunk.includes(name)) bindingNames.add(name);
}

const sortedBindings = [...bindingNames].sort();
const destructure = sortedBindings.join(',\n  ');

const importBlock = `import { Fragment, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ToggleSwitch, { TOGGLE_TRACK_OFF, TOGGLE_TRACK_ON, toggleTrackClassName } from '@/components/ui/ToggleSwitch';
import ResponseQualityScoringCard, {
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
} from '@/features/forms/components/ResponseQualityScoringCard';
import IfThenLogicPanel from '@/features/forms/components/IfThenLogicPanel';
import TimeConfigurePanel from '@/features/forms/components/TimeConfigurePanel';
import {
  ESSENTIALS,
  CONTENT_SECTIONS,
  QUESTION_TEMPLATE_CATEGORIES,
  CONFIGURE_TILE_GRID,
  CONFIGURE_TILE_BASE,
  ACCORDION_SECTIONS,
  CTA_COLOR_PALETTE,
} from '@/features/forms/formBuilder/builderConfiguratorConstants';
import { getLogicCardQuestionText } from '@/features/forms/utils/screenConfigSync';
import {
  formatFileSizeCompact,
  formatMaxSizeLabel,
  parseMaxFileSizeBytes,
} from '@/features/forms/utils/fileSizeLimits';
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpSLine,
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
  RiFileUploadLine,
  RiGlobeLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiMailLine,
  RiMapPinLine,
  RiPencilLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
  RiStarFill,
  RiTimeLine,
  RiExternalLinkLine,
} from 'react-icons/ri';
import { BoxesIcon, ImagesCardIcon, LongTextIcon, ShortTextIcon, TextAlignLeftIcon, TextHIcon, VideoCardIcon } from '@/features/forms/formBuilder/builderFieldIcons';
import BlockVisibilityConditions from '@/features/forms/components/BlockVisibilityConditions';

`;

const panelFile = `${importBlock}
/**
 * Right-side configure / design / if-then panels for the form builder.
 * Receives the full builder scope from FormBuilderPage (state + handlers).
 */
export default function FormBuilderRightPanels({
  ${destructure}
}) {
  return (
    <>
${panelBody}
    </>
  );
}
`;

fs.writeFileSync('src/features/forms/formBuilder/FormBuilderRightPanels.jsx', panelFile, 'utf8');

const bindingList = sortedBindings.join(',\n        ');
const replacement = `        <FormBuilderRightPanels
        ${bindingList}
        />`;

const newPage = `${pageHead}\n${replacement}\n${pageTail}`;
if (!newPage.includes("import FormBuilderRightPanels from '@/features/forms/formBuilder/FormBuilderRightPanels';")) {
  const importLine = "import FormBuilderRightPanels from '@/features/forms/formBuilder/FormBuilderRightPanels';";
  const idx = newPage.indexOf("import FormBuilderSettingsPanel");
  if (idx >= 0) {
    const insertAt = newPage.indexOf('\n', idx) + 1;
    const finalPage = newPage.slice(0, insertAt) + importLine + '\n' + newPage.slice(insertAt);
    fs.writeFileSync(pagePath, finalPage, 'utf8');
  } else {
    fs.writeFileSync(pagePath, newPage, 'utf8');
  }
} else {
  fs.writeFileSync(pagePath, newPage, 'utf8');
}

console.log('Extracted panels:', panelEnd - panelStart + 1, 'lines');
console.log('Bindings:', sortedBindings.length);
