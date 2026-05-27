import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/);

const start = 221;
const end = 3489;
const body = lines.slice(start - 1, end).join('\n');

const header = `import { Fragment, useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBriefcaseLine,
  RiCalendarLine,
  RiCheckboxLine,
  RiCheckLine,
  RiCompassLine,
  RiDeleteBin6Line,
  RiExternalLinkLine,
  RiFileUploadLine,
  RiGlobeLine,
  RiHeartFill,
  RiHeartLine,
  RiIdCardLine,
  RiImageLine,
  RiLinkedinBoxLine,
  RiLockLine,
  RiMailLine,
  RiMapPinLine,
  RiPencilLine,
  RiRadioButtonLine,
  RiRobot2Line,
  RiStarFill,
  RiStarLine,
  RiSubtractLine,
  RiTimeLine,
} from 'react-icons/ri';
import { PiCaretCircleUp } from 'react-icons/pi';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import MapFieldStaticPreview from '@/features/forms/components/MapFieldStaticPreview';
import InlineEditableField from '@/features/forms/components/InlineEditableField';
import { CanvasBadgeText, CanvasHelperText, CanvasQuestionText } from '@/features/forms/components/canvasCardText';
import ResponseQualityScoringCard, {
  DEFAULT_RESPONSE_QUALITY_OPTIONS,
} from '@/features/forms/components/ResponseQualityScoringCard';
import ResponseQualityFeedback from '@/features/forms/components/ResponseQualityFeedback';
import { evaluateResponseQuality } from '@/features/forms/utils/responseQualityScoring';
import {
  applySecondsToSelection,
  clampSeconds,
  isTimeWithinBounds,
  selectionToSeconds,
  to24Hour,
  from24Hour,
} from '@/features/forms/utils/timeFieldUtils';
import { DEFAULT_MAP_CENTER } from '@/features/forms/utils/mapGeocoding';
import {
  formatFileSizeCompact,
  formatMaxSizeLabel,
  parseMaxFileSizeBytes,
} from '@/features/forms/utils/fileSizeLimits';

const MapLocationPicker = lazy(() => import('@/features/forms/components/MapLocationPicker'));

`;

const footer = '\n\nexport default ContentCard;\n';

const out = header + body.replace(/^const ContentCard = /m, 'const ContentCard = ') + footer;
fs.writeFileSync('src/features/forms/formBuilder/BuilderContentCard.jsx', out, 'utf8');

// Remove extracted block and stray comments (lines 207-3490, 1-based)
const remove = new Set();
for (let i = 206; i <= 3489; i += 1) remove.add(i);
lines = lines.filter((_, i) => !remove.has(i));

const importLine = "import ContentCard from '@/features/forms/formBuilder/BuilderContentCard';";
const idx = lines.findIndex((l) => l.includes('builderMotion'));
lines.splice(idx + 1, 0, importLine);

// Remove card theme imports if unused in page
lines = lines.filter(
  (l) =>
    !l.includes("from '@/assets/Card_Themes/Theme-1") &&
    !l.includes("from '@/assets/Card_Themes/Theme-2") &&
    !l.includes("from '@/assets/Card_Themes/Theme-3") &&
    !l.includes("from '@/assets/Card_Themes/Theme-4"),
);

fs.writeFileSync(pagePath, lines.join('\n'), 'utf8');
console.log('ContentCard extracted. Page lines:', lines.length);
