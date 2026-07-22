import fs from 'node:fs';

const pagePath = 'src/features/forms/pages/FormBuilderPage.jsx';
let chunk = fs.readFileSync('scripts/_canvas-chunk.txt', 'utf8').replace(/^\uFEFF/, '');
chunk = chunk.replace(/\n\s*mapConfig=\{\{[\s\S]*?\}\}\n/g, '\n');

const welcomeIdx = chunk.indexOf('Default welcome card');
const endIdx = chunk.indexOf(") : activeScreen?.type === 'end'");
if (welcomeIdx < 0 || endIdx < 0) throw new Error('chunk markers missing');
const parenIdx = chunk.lastIndexOf(') : (', welcomeIdx);
const insertBlock = chunk.slice(parenIdx, endIdx);

let page = fs.readFileSync(pagePath, 'utf8');

const broken = `                          />
                        </div>
                      </motion.div>
                ) : activeScreen?.type === 'end' ? (
                      /* ── End screen card ── */`;

if (!page.includes(broken)) {
  throw new Error('broken canvas anchor not found');
}

page = page.replace(broken, `                          />
                        </div>
                      </motion.div>
${insertBlock}`);

fs.writeFileSync(pagePath, page, 'utf8');
console.log('Patched canvas branches, inserted', insertBlock.split('\n').length, 'lines');
