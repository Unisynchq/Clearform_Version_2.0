import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/features/forms/formBuilder/FormBuilderRightPanels.jsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/<\/BuilderRightPanelShell>/g, '</motion.div>');

const lines = content.split(/\r?\n/);
const panelCloseLines = new Set();

function countDivOpens(line) {
  let n = 0;
  if (/<div[\s/>]/.test(line)) {
    const selfClose = /<div[^>]*\/>/.test(line);
    const closeOnly = /^\s*<\/div>/.test(line);
    if (!selfClose && !closeOnly && line.includes('<div')) n += 1;
  }
  return n;
}

function countDivCloses(line) {
  return (line.match(/<\/div>/g) || []).length;
}

function isComponentPanel(startIdx) {
  for (let j = startIdx + 1; j < Math.min(startIdx + 8, lines.length); j++) {
    if (/<(?:TimeConfigurePanel|IfThenLogicPanel)\b/.test(lines[j])) return j;
  }
  return -1;
}

function findPanelRootDiv(startIdx) {
  for (let j = startIdx + 1; j < Math.min(startIdx + 8, lines.length); j++) {
    const chunk = lines.slice(j, j + 4).join(' ');
    if (
      lines[j].includes('<div') &&
      /w-\[(280|300|320)px\]/.test(chunk) &&
      /h-full/.test(chunk)
    ) {
      return j;
    }
  }
  return -1;
}

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].includes('<BuilderRightPanelShell')) continue;

  const componentLine = isComponentPanel(i);
  if (componentLine !== -1) {
    for (let j = componentLine + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (line === '' || line.startsWith('{/*')) continue;
      if (/^\s*<\/motion\.div>\s*$/.test(lines[j])) {
        panelCloseLines.add(j);
        break;
      }
      if (line.startsWith('</') || line === ');') break;
    }
    continue;
  }

  const rootDivLine = findPanelRootDiv(i);
  if (rootDivLine === -1) continue;

  let divDepth = 0;
  let started = false;
  for (let j = rootDivLine; j < lines.length; j++) {
    divDepth += countDivOpens(lines[j]);
    if (divDepth > 0) started = true;
    divDepth -= countDivCloses(lines[j]);

    if (started && divDepth === 0) {
      for (let k = j + 1; k < Math.min(j + 6, lines.length); k++) {
        if (/^\s*<\/motion\.div>\s*$/.test(lines[k])) {
          panelCloseLines.add(k);
          break;
        }
        if (lines[k].trim() !== '' && !lines[k].trim().startsWith('{/*')) break;
      }
      break;
    }
  }
}

for (const idx of panelCloseLines) {
  lines[idx] = lines[idx].replace('</motion.div>', '</BuilderRightPanelShell>');
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Panel shell opens:', (content.match(/<BuilderRightPanelShell/g) || []).length);
console.log('Panel closes fixed:', panelCloseLines.size);
