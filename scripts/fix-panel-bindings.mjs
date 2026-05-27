import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let content = fs.readFileSync(pagePath, 'utf8');

const startMarker = '        <FormBuilderRightPanels';
const endMarker = '        />';

const startIdx = content.indexOf(startMarker);
if (startIdx < 0) throw new Error('FormBuilderRightPanels block not found');

const endIdx = content.indexOf(endMarker, startIdx);
if (endIdx < 0) throw new Error('closing /> not found');

const block = content.slice(startIdx, endIdx + endMarker.length);
const names = [...block.matchAll(/^        ([a-zA-Z0-9_]+),$/gm)].map((m) => m[1]);

const objectBody = names.map((n) => `    ${n},`).join('\n');
const bindingsConst = `  const builderPanelBindings = {\n${objectBody}\n  };\n\n`;

const returnIdx = content.lastIndexOf('  return (');
if (returnIdx < 0) throw new Error('return not found');
if (!content.includes('const builderPanelBindings')) {
  content = content.slice(0, returnIdx) + bindingsConst + content.slice(returnIdx);
}

const replacement = '        <FormBuilderRightPanels {...builderPanelBindings} />';
content = content.slice(0, startIdx) + replacement + content.slice(endIdx + endMarker.length);

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Fixed bindings:', names.length);
