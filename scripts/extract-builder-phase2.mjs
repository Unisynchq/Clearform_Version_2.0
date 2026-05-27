import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);

function slice(start1, end1) {
  return lines.slice(start1 - 1, end1);
}

// 1-based line numbers after phase-1 extraction
const configuratorLines = slice(215, 408);
const screenMapLines = slice(3683, 3760);
const motionLines = slice(3762, 3779);

const configuratorBody = configuratorLines.join('\n').replace(/^const /gm, 'export const ');
const screenMapBody = screenMapLines
  .join('\n')
  .replace(/^const /gm, 'export const ')
  .replace(/BUILDER_PAGE_EASE[\s\S]*builderSectionVariants[\s\S]*};\n\n/, '');

const motionBody = motionLines.join('\n').replace(/^const /gm, 'export const ');

const configuratorFile = `import {
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCompassLine,
  RiFileUploadLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiMapPinLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
  RiTimeLine,
} from 'react-icons/ri';
import cardTheme1 from '@/assets/Card_Themes/Theme-1.jpeg';
import cardTheme2 from '@/assets/Card_Themes/Theme-2.jpeg';
import cardTheme3 from '@/assets/Card_Themes/Theme-3.jpeg';
import cardTheme4 from '@/assets/Card_Themes/Theme-4.jpeg';
import {
  BoxesIcon,
  ImagesCardIcon,
  LongTextIcon,
  ShortTextIcon,
  TextAlignLeftIcon,
  TextHIcon,
  VideoCardIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';

${configuratorBody}
`;

const screenMapFile = `import {
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCompassLine,
  RiFileUploadLine,
  RiCompassLine as RiCompassLineDup,
  RiIdCardLine,
  RiImageLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
  RiFileUploadLine as RiFileUploadLineDup,
} from 'react-icons/ri';
import {
  BoxesIcon,
  ImagesCardIcon,
  LongTextIcon,
  ShortTextIcon,
  TextAlignLeftIcon,
  TextHIcon,
  VideoCardIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';

${screenMapBody}
`;

// Fix duplicate imports in screenMap - use simpler import block
const screenMapFileFixed = `import {
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCompassLine,
  RiFileUploadLine,
  RiIdCardLine,
  RiImageLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarLine,
} from 'react-icons/ri';
import {
  BoxesIcon,
  ImagesCardIcon,
  LongTextIcon,
  ShortTextIcon,
  TextAlignLeftIcon,
  TextHIcon,
  VideoCardIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';

${screenMapBody}
`;

const motionFile = `${motionBody.replace(/^export const BUILDER_PAGE_EASE/, 'export const BUILDER_PAGE_EASE')}\n`;

fs.writeFileSync('src/features/forms/formBuilder/builderConfiguratorConstants.js', configuratorFile, 'utf8');
fs.writeFileSync('src/features/forms/formBuilder/builderScreenMaps.js', screenMapFileFixed, 'utf8');
fs.writeFileSync('src/features/forms/formBuilder/builderMotion.js', motionFile, 'utf8');

// Remove from page (0-indexed): 214-407, 3682-3779
const remove = new Set();
for (let i = 214; i <= 407; i += 1) remove.add(i);
for (let i = 3682; i <= 3760; i += 1) remove.add(i);
for (let i = 3761; i <= 3778; i += 1) remove.add(i);
lines = lines.filter((_, i) => !remove.has(i));

const importIdx = lines.findIndex((l) => l.includes('logicCanvasHelpers'));
lines.splice(importIdx + 1, 0, `import * as builderConfigurator from '@/features/forms/formBuilder/builderConfiguratorConstants';`);
lines.splice(importIdx + 2, 0, `import * as builderScreenMaps from '@/features/forms/formBuilder/builderScreenMaps';`);
lines.splice(importIdx + 3, 0, `import { BUILDER_PAGE_EASE, builderContentVariants, builderSectionVariants } from '@/features/forms/formBuilder/builderMotion';`);

// Destructure commonly used exports at top of FormBuilderPage - actually use namespace is ugly
// Better: add named re-exports usage - replace identifiers in file via destructuring insert after imports

const reexport = `
const {
  ESSENTIALS,
  CONFIGURE_TILE_GRID,
  CONFIGURE_TILE_BASE,
  ACCORDION_SECTIONS,
  QUESTION_TEMPLATE_CATEGORIES,
  CONTENT_SECTIONS,
  THEMES,
  TYPOGRAPHY_FONTS,
  hexToRgba,
  CTA_COLOR_PALETTE,
} = builderConfigurator;
const {
  WELCOME_TEXT_SIZE_DESKTOP,
  WELCOME_TEXT_SIZE_MOBILE,
  ESSENTIAL_TO_BLOCK,
  LABEL_TO_CONFIG_PANEL,
  SCREEN_ICON_MAP,
  SCREEN_ICON_BADGE_HEX,
} = builderScreenMaps;
`;

const formBuilderIdx = lines.findIndex((l) => l.startsWith('const FormBuilderPage'));
lines.splice(formBuilderIdx, 0, reexport);

fs.writeFileSync(pagePath, lines.join('\n'), 'utf8');
console.log('Phase 2 done. New page lines:', lines.length);
