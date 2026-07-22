import fs from 'fs';

const path = 'src/features/templates/pages/TemplatesPage.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Remove duplicate state components (DisabledSearch through EmptyTemplatesBody)
const start = lines.findIndex((l) => l.startsWith('const DisabledSearch'));
const end = lines.findIndex((l) => l.startsWith('const TemplatesPage = () =>'));
if (start !== -1 && end !== -1) {
  lines.splice(start, end - start);
}

let s = lines.join('\n');
const closeDiv = '</' + 'div>';

// Self-closing motion.div bars -> div
s = s.replace(/<motion\.motion\.div/g, '<motion.div');
s = s.replace(/<motion\.motion\.motion\.motion\.div/g, '<motion.div');
s = s.replace(/<motion\.div layout className="bg-\[#e5e3dc\]/g, '<motion.div className="bg-[#e5e3dc]');
s = s.replace(/<motion\.motion\.div layout className="bg-\[#e5e3dc\]/g, '<motion.div className="bg-[#e5e3dc]');

// Replace mistaken </motion.div> with </div> globally, restore motion.div pairs
s = s.replaceAll('</motion.div>', closeDiv);
s = s.replace(/<motion\.motion\.div\b([^>]*)>([\s\S]*?)<\/div>/g, '<motion.div$1>$2</motion.div>');

// SearchResultRow icon container: motion.div -> div
s = s.replace(
  /<motion\.div layout className="w-8 h-8 shrink-0 bg-\[#f4f3ef\][^>]*>\s*<Icon size=\{16\}[^/]*\/>\s*<\/motion\.motion\.motion\.div>/,
  (m) => m.replace(/<\/?motion\.div[^>]*>/g, (tag) =>
    tag.includes('</') ? closeDiv : tag.replace('motion.', '')
  )
);

// renderHeader fix: closing div for header block
s = s.replace(
  /const renderHeader = \(\) => \(\n  <motion\.div className="flex flex-col gap-2 mb-4">/,
  'const renderHeader = () => (\n  <motion.div className="flex flex-col gap-2 mb-4">'
);

// Fix {renderHeader()}</motion.div> wrapper
s = s.replace(
  /<motion\.motion\.motion\.motion\.div className="flex flex-col gap-2 mb-8">\{renderHeader\(\)\}<\/motion\.motion\.motion\.div>/,
  '<motion.div className="flex flex-col gap-2 mb-8">{renderHeader()}</motion.div>'
);
s = s.replace(
  /<div className="flex flex-col gap-2 mb-8">\{renderHeader\(\)\}<\/motion\.motion\.div>/,
  '<motion.div className="flex flex-col gap-2 mb-8">{renderHeader()}</motion.div>'
);
s = s.replace(
  /<div className="flex flex-col gap-2 mb-8">\{renderHeader\(\)\}<\/div>/,
  '<motion.div className="mb-8">{renderHeader()}</motion.div>'
);

// Category empty state -> imported component
s = s.replace(
  /\{gridTemplates\.length === 0 && status === 'loaded' && \([\s\S]*?\)\}/,
  '{gridTemplates.length === 0 && status === \'loaded\' && <EmptyCategoryState />}'
);

fs.writeFileSync(path, s);
console.log('patched', path);
