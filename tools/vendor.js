// Copie les bibliothèques (Blockly, fflate, forge, highlight.js) dans web/vendor pour un fonctionnement 100 % hors ligne.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const nm = path.join(root, 'node_modules');
const out = path.join(root, 'web', 'vendor');
fs.mkdirSync(out, { recursive: true });
const copy = (from, to) => fs.copyFileSync(path.join(nm, from), path.join(out, to || path.basename(from)));
['blockly_compressed.js', 'blocks_compressed.js', 'javascript_compressed.js', 'python_compressed.js',
  'php_compressed.js', 'lua_compressed.js', 'dart_compressed.js'].forEach((f) => copy('blockly/' + f));
copy('blockly/msg/fr.js', 'fr.js');
fs.cpSync(path.join(nm, 'blockly/media'), path.join(out, 'media'), { recursive: true });
copy('fflate/umd/index.js', 'fflate.min.js');
copy('node-forge/dist/forge.min.js');
const hl = path.join(nm, '@highlightjs/cdn-assets');
fs.writeFileSync(path.join(out, 'highlight.min.js'),
  fs.readFileSync(path.join(hl, 'highlight.min.js'), 'utf8') + '\n' +
  ['dart', 'lua', 'php', 'python', 'xml', 'css', 'javascript'].map((l) => fs.readFileSync(path.join(hl, 'languages', l + '.min.js'), 'utf8')).join('\n'));
fs.copyFileSync(path.join(hl, 'styles/atom-one-dark.min.css'), path.join(out, 'hljs-dark.min.css'));
// Retire les commentaires sourceMappingURL (fichiers .map non copiés).
fs.readdirSync(out).filter((f) => f.endsWith('.js')).forEach((f) => {
  const p = path.join(out, f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/\/\/# sourceMappingURL=.*$/gm, ''));
});
console.log('vendor ok →', out);
