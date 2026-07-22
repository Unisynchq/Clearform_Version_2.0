import fs from 'node:fs';

const path = 'src/features/forms/pages/FormBuilderPage.jsx';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const ranges0 = [
  [182, 300],
  [311, 531],
];
const toRemove = new Set();
for (const [a, b] of ranges0) {
  for (let i = a; i <= b; i += 1) toRemove.add(i);
}
lines = lines.filter((_, i) => !toRemove.has(i));

const imports = [
  `import {
  BoxesIcon,
  TextHIcon,
  TextAlignLeftIcon,
  ImagesCardIcon,
  VideoCardIcon,
  ShortTextIcon,
  LongTextIcon,
  PagesStartIcon,
  PagesEndIcon,
  LogicOutputPortIcon,
} from '@/features/forms/formBuilder/builderFieldIcons';`,
  `import {
  LogicEdgeLineDisconnectButton,
  LogicEdgeControlPill,
} from '@/features/forms/formBuilder/logicEdgeChrome';`,
  `import {
  reorderScreensFromLogicConnections,
  groupLogicConnectionsByFrom,
  groupLogicConnectionsByTo,
  logicConnectionEndpoints,
} from '@/features/forms/formBuilder/logicCanvasHelpers';`,
];

const idx = lines.findIndex((l) => l.includes("LogicEdgePathGroup"));
if (idx === -1) throw new Error('LogicEdgePathGroup import not found');
lines.splice(idx + 1, 0, ...imports);

fs.writeFileSync(path, lines.join('\n'));
console.log('New line count:', lines.length);
