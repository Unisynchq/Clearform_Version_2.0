/**
 * Sync FormBuilderRightPanels props with builderPanelBindings in FormBuilderPage.
 * Also reports identifiers used in the panel body that are defined in the page but missing from props.
 */
import fs from 'node:fs';

const panelPath = 'src/features/forms/formBuilder/FormBuilderRightPanels.jsx';
const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';

const panel = fs.readFileSync(panelPath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');

const fnStart = panel.indexOf('export default function FormBuilderRightPanels');
const propsEnd = panel.indexOf('}) {', fnStart);
const propsBlock = panel.slice(fnStart, propsEnd);
const body = panel.slice(propsEnd);

const props = new Set(
  [...propsBlock.matchAll(/\n\s*([a-zA-Z_][a-zA-Z0-9_]*),?\s*$/gm)]
    .map((m) => m[1])
    .filter((n) => !['export', 'default', 'function', 'FormBuilderRightPanels'].includes(n)),
);

const importEnd = fnStart;
const importBlock = panel.slice(0, importEnd);
const imported = new Set();
for (const m of importBlock.matchAll(/import\s+\{([^}]+)\}/g)) {
  m[1].split(',').forEach((p) => imported.add(p.trim().split(/\s+as\s+/).pop()));
}
for (const m of importBlock.matchAll(/import\s+(\w+)\s+from/g)) imported.add(m[1]);

const localInPanel = new Set(
  [...body.matchAll(/\b(?:const|let|function)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)].map((m) => m[1]),
);

const pageBeforeReturn = page.slice(0, page.indexOf('const builderPanelBindings = {'));
const pageDefined = new Set(
  [...pageBeforeReturn.matchAll(/\bconst\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g)].map((m) => m[1]),
);

const builtins = new Set([
  'true', 'false', 'null', 'undefined', 'NaN', 'Infinity',
  'map', 'filter', 'reduce', 'find', 'some', 'every', 'forEach', 'includes', 'length', 'slice', 'join', 'split',
  'parseInt', 'parseFloat', 'Number', 'String', 'Array', 'Object', 'Math', 'Date', 'JSON', 'Set', 'Map',
  'setTimeout', 'clearTimeout', 'requestAnimationFrame',
  'motion', 'AnimatePresence', 'Fragment',
  'type', 'key', 'ref', 'id', 'className', 'style', 'onClick', 'onChange', 'onBlur', 'onFocus', 'onKeyDown',
  'value', 'checked', 'disabled', 'readOnly', 'placeholder', 'rows', 'cols', 'role', 'aria', 'tabIndex',
  'children', 'initial', 'animate', 'exit', 'transition', 'layout', 'whileHover', 'whileTap',
  'Icon', 'AlignIcon', 'opt', 'opts', 'item', 'items', 'section', 'sections', 'field', 'fields',
  'rule', 'rules', 'edge', 'conn', 'screen', 'screens', 'idx', 'i', 'j', 'k', 'n', 'm', 'p', 'r', 's', 't', 'x', 'y', 'z',
  'a', 'b', 'h', 'w', 'px', 'py', 'mx', 'my', 'id', 'to', 'from', 'isActive', 'questionOptions', 'toScreen',
  'draft', 'file', 'height', 'width', 'target', 'next', 'prev', 'row', 'col', 'cell', 'theme', 'tab',
  'label', 'name', 'size', 'color', 'text', 'val', 'v', 'e', 'ev', 'event',
]);

const usedInBody = new Set();
for (const m of body.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g)) usedInBody.add(m[1]);

const missingFromProps = [...usedInBody]
  .filter((id) => {
    if (props.has(id) || imported.has(id) || localInPanel.has(id) || builtins.has(id)) return false;
    if (id.startsWith('Ri') || id.startsWith('Pi') || id.endsWith('Icon')) return false;
    if (id.startsWith('set') && pageDefined.has(id)) return false; // setters should be passed explicitly
    return pageDefined.has(id);
  })
  .sort();

console.log('Missing from panel props (defined in FormBuilderPage):');
console.log(missingFromProps.length ? missingFromProps.join(', ') : '(none)');

// Auto-add missing to bindings if only configureMaxFileSize etc.
if (missingFromProps.length) {
  let pageContent = page;
  const bindStart = pageContent.indexOf('const builderPanelBindings = {');
  const bindClose = pageContent.indexOf('\n  };\n\n  return (', bindStart);
  if (bindStart < 0 || bindClose < 0) {
    console.error('Could not find builderPanelBindings block');
    process.exit(1);
  }

  let bindInner = pageContent.slice(bindStart, bindClose);
  const toAdd = missingFromProps.filter((id) => !bindInner.includes(`\n    ${id},`));
  if (toAdd.length) {
    for (const id of toAdd.sort()) {
      bindInner += `\n    ${id},`;
      console.log('Added to builderPanelBindings:', id);
    }
    pageContent = pageContent.slice(0, bindStart) + bindInner + pageContent.slice(bindClose);
    fs.writeFileSync(pagePath, pageContent);
  }

  // Add to panel props destructuring (alphabetically-ish: after configureIsUpload)
  let panelContent = fs.readFileSync(panelPath, 'utf8');
  for (const id of toAdd.sort()) {
    if (panelContent.includes(`\n  ${id},`)) continue;
    const anchor = panelContent.includes('\n  configureIsUpload,')
      ? '\n  configureIsUpload,'
      : '\n  configureIsUpload\n';
    if (panelContent.includes('\n  configureIsUpload,')) {
      panelContent = panelContent.replace(
        '\n  configureIsUpload,',
        `\n  configureIsUpload,\n  ${id},`,
      );
    } else {
      // insert before canvasScale or similar
      panelContent = panelContent.replace(
        '\n  canvasScale,',
        `\n  ${id},\n  canvasScale,`,
      );
    }
    console.log('Added to panel props:', id);
  }
  fs.writeFileSync(panelPath, panelContent);
}
