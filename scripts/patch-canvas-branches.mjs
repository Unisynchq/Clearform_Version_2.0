import fs from 'node:fs';

const raw = fs.readFileSync('.tmp-fbp-git-clean.jsx', 'utf8').replace(/^\uFEFF/, '').replace(/\u0000/g, '');
const git = raw.split(/\r?\n/);
let chunk = git.slice(8965, 9192).join('\n');
chunk = chunk.replace(/                              mapConfig=\{\{[\s\S]*?\}\}\n/, '');

const pageStr = fs.readFileSync('src/features/forms/pages/FormBuilderPage.jsx', 'utf8');
const needle = "                      </motion.div>\n                ) : activeScreen?.type === 'end' ? (";
const idx = pageStr.indexOf(needle);
if (idx < 0) throw new Error('needle not found');

const fixed =
  pageStr.slice(0, idx) +
  chunk +
  "\n                ) : activeScreen?.type === 'end' ? (" +
  pageStr.slice(idx + needle.length);

fs.writeFileSync('src/features/forms/pages/FormBuilderPage.jsx', fixed, 'utf8');
console.log('patched intro+content branches');
