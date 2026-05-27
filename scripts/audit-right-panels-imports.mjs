import fs from 'node:fs';

const panelPath = 'src/features/forms/formBuilder/FormBuilderRightPanels.jsx';
const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
const panel = fs.readFileSync(panelPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');

const exportIdx = panel.indexOf('export default function FormBuilderRightPanels');
const importBlock = panel.slice(0, exportIdx);
const body = panel.slice(exportIdx);

const imported = new Set();
for (const m of importBlock.matchAll(/import\s+(?:\{([^}]+)\}|(\w+)(?:\s*,\s*\{([^}]+)\})?)\s+from/g)) {
  const chunk = m[1] || m[3] || '';
  chunk.split(',').forEach((p) => {
    const n = p.trim().split(/\s+as\s+/).pop();
    if (n) imported.add(n);
  });
  if (m[2]) imported.add(m[2]);
}

const propsEnd = body.indexOf('}) {');
if (propsEnd < 0) throw new Error('Could not parse FormBuilderRightPanels props');
const propsBlock = body.slice(body.indexOf('{') + 1, propsEnd);
const props = new Set(
  propsBlock
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean),
);

const riUsed = [...new Set([...body.matchAll(/\b(Ri[A-Z][a-zA-Z0-9]*)\b/g)].map((m) => m[1]))];
const riMissing = riUsed.filter((r) => !imported.has(r));

const pageFns = [...page.matchAll(/const ([a-zA-Z0-9_]+) = (?:useCallback|\(|useMemo|useRef|useState)/g)].map((m) => m[1]);
const pageConsts = [...page.matchAll(/const ([a-zA-Z0-9_]+) =/g)].map((m) => m[1]);
const pageScope = new Set([...pageFns, ...pageConsts]);

const callRefs = [...body.matchAll(/\b([a-z][a-zA-Z0-9_]*)\s*\(/g)].map((m) => m[1]);
const bareRefs = [...body.matchAll(/\b([a-z][a-zA-Z0-9_]{2,})\b/g)].map((m) => m[1]);
const candidates = new Set([...callRefs, ...bareRefs]);
const builtins = new Set([
  'if', 'return', 'function', 'switch', 'case', 'default', 'true', 'false', 'null', 'undefined',
  'map', 'filter', 'length', 'includes', 'setTimeout', 'parseInt', 'parseFloat', 'Math', 'Date',
  'Number', 'String', 'Array', 'Object', 'JSON', 'console', 'document', 'window', 'React',
  'type', 'key', 'className', 'style', 'onClick', 'onChange', 'value', 'checked', 'disabled',
  'children', 'initial', 'animate', 'exit', 'transition', 'layout', 'whileHover', 'whileTap',
]);

const propsMissing = [...candidates]
  .filter((id) => !props.has(id) && !builtins.has(id) && pageScope.has(id))
  .sort();

let failed = false;
if (riMissing.length) {
  console.error('Missing react-icons imports:', riMissing.join(', '));
  failed = true;
} else {
  console.log('react-icons: OK (', riUsed.length, 'used)');
}

if (propsMissing.length) {
  console.error('Possible missing panel props:', propsMissing.join(', '));
  failed = true;
} else {
  console.log('panel props: OK');
}

process.exit(failed ? 1 : 0);
