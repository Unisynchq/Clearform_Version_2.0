import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../src/features/forms/formBuilder/FormBuilderRightPanels.jsx');
let s = fs.readFileSync(filePath, 'utf8');

s = s.replace(
  /\/\*\* Premium slide-in for right-side builder panels \*\/\r?\nconst RIGHT_PANEL_SPRING =[\s\S]*?transition: RIGHT_PANEL_SPRING,\r?\n\};\r?\n/,
  '',
);

if (!s.includes("BuilderRightPanelShell")) {
  s = s.replace(
    "import { motion, AnimatePresence } from 'motion/react';",
    "import { motion, AnimatePresence } from 'motion/react';\nimport BuilderRightPanelShell from '@/features/forms/formBuilder/BuilderRightPanelShell';",
  );
}

const openRe =
  /<motion\.div\r?\n\s*key="([^"]+)"\r?\n(?:\s*initial=\{skipPanelEnterRef\.current \? false : RIGHT_PANEL_SLIDE\.initial\}\r?\n|\s*initial=\{RIGHT_PANEL_SLIDE\.initial\}\r?\n)\s*animate=\{RIGHT_PANEL_SLIDE\.animate\}\r?\n\s*exit=\{RIGHT_PANEL_SLIDE\.exit\}\r?\n\s*transition=\{RIGHT_PANEL_SPRING\}\r?\n\s*className="([^"]+)"\r?\n\s*>/g;

let openCount = 0;
s = s.replace(openRe, (full, key, className) => {
  openCount += 1;
  const w = className.match(/w-\[(\d+)px\]/)?.[1] ?? '280';
  const skip = full.includes('skipPanelEnterRef');
  const absolute = className.includes('absolute');
  let props = `panelKey="${key}" width={${w}}`;
  if (skip) props += ' skipInitial={skipPanelEnterRef.current}';
  if (absolute) props += ' absolute';
  return `<BuilderRightPanelShell ${props}>`;
});

const lines = s.split(/\r?\n/);
const out = [];
let shellDepth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('<BuilderRightPanelShell')) shellDepth += 1;
  if (shellDepth > 0 && /^(\s*)<\/motion\.div>\s*$/.test(line)) {
    const next = lines[i + 1] ?? '';
    if (/^\s*\)\}\s*$/.test(next) || /^\s*\)\}\)\(\)\}\s*$/.test(next)) {
      out.push(line.replace('</motion.div>', '</BuilderRightPanelShell>'));
      shellDepth -= 1;
      continue;
    }
  }
  out.push(line);
}

fs.writeFileSync(filePath, out.join('\n'));
console.log(`Replaced ${openCount} panel openings`);
