// Test de fumée : ouvre le studio dans Chromium, charge chaque modèle, génère le code
// dans les 5 langages, lance l'aperçu, puis exporte un APK et un ZIP.
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'build');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 820 }, acceptDownloads: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/permissions policy/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'web', 'index.html'));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(out, 'shot-splash1.png') });
  await page.waitForTimeout(1900);
  await page.screenshot({ path: path.join(out, 'shot-splash2.png') });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(out, 'shot-welcome.png') });
  await page.evaluate(() => { document.querySelector('#modal').hidden = true; });

  const ids = await page.evaluate(() => NXTemplates.list.map((t) => t.id));
  for (const id of ids) {
    const r = await page.evaluate((id) => {
      NXStudio.createProject('Test ' + id, id);
      const res = { id, blocks: NXStudio.ws().getAllBlocks(false).length, tops: NXStudio.ws().getTopBlocks(false).length,
        expected: (NXTemplates.byId(id).xml().match(/<block x=/g) || []).length };
      ['js', 'py', 'php', 'lua', 'dart'].forEach((l) => { res[l] = NXStudio.generate(l).length; });
      res.jsCode = NXStudio.generate('js');
      return res;
    }, id);
    // Vérifie que le JavaScript généré est syntaxiquement valide.
    try { new Function(r.jsCode); } catch (e) { errors.push('syntaxe JS ' + id + ': ' + e.message); }
    if (r.tops !== r.expected) errors.push('blocs détachés dans ' + id + ' : ' + r.tops + ' au lieu de ' + r.expected);
    const { jsCode, ...summary } = r;
    console.log(JSON.stringify(summary));
    await page.evaluate(() => { NXStudio.showTab('preview'); NXStudio.run(); });
    await page.waitForTimeout(['plateforme', 'shooter', 'aventure', 'bagarre', 'labyrinthe3d'].includes(id) ? 2500 : 900);
    const frameErr = await page.evaluate(() => {
      const d = document.querySelector('#preview').contentDocument;
      const e = d && d.getElementById('nx-error');
      return e ? e.textContent : '';
    });
    const consoleErr = await page.evaluate(() => Array.from(document.querySelectorAll('#console-lines .err')).map((x) => x.textContent).join(' | '));
    if (frameErr || consoleErr) errors.push('aperçu ' + id + ': ' + frameErr + ' ' + consoleErr);
    if (['jeu', 'plateforme', 'shooter', 'aventure', 'bagarre', 'labyrinthe3d', 'multiapp', 'contacts', 'depenses'].includes(id)) await page.screenshot({ path: path.join(out, 'shot-preview-' + id + '.png') });
  }
  // Médias : un bloc « mon média » utilisé comme apparence de sprite.
  const media = await page.evaluate(() => {
    NXStudio.createProject('Test média', 'vide');
    NXStudio.project().media = { chat: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' };
    const ws = NXStudio.ws();
    const b = ws.newBlock('nx_image'); b.initSvg(); b.render();
    const m = ws.newBlock('nx_media'); m.initSvg(); m.render(); m.setFieldValue('chat', 'M');
    b.getInput('SRC').connection.connect(m.outputConnection);
    return { js: NXStudio.generate('js'), html: NXStudio.buildHtml().indexOf('window.NX_MEDIA') > 0 };
  });
  console.log('média:', JSON.stringify(media));
  if (!media.html || media.js.indexOf("NX.media('chat')") < 0) errors.push('média non généré');
  await page.evaluate(() => NXStudio.showTab('blocks'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'shot-blocks.png') });
  await page.click('.blocklyToolboxCategory >> nth=2');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'shot-flyout.png') });
  await page.evaluate(() => NXStudio.showTab('code'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'shot-code.png') });
  await page.evaluate(() => NXStudio.showTab('learn'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'shot-learn.png') });
  await page.click('.ency-item >> nth=5');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'shot-ency.png') });
  await page.evaluate(() => { document.querySelector('.modal-close').click(); });

  // Export APK depuis l'interface.
  await page.evaluate(() => NXStudio.showTab('blocks'));
  await page.click('#btn-export');
  await page.click('[data-x=apk]');
  await page.waitForSelector('#apk-save', { timeout: 60000 });
  await page.screenshot({ path: path.join(out, 'shot-apk.png') });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#apk-save')]);
  await dl.saveAs(path.join(out, 'from-browser.apk'));
  await page.evaluate(() => { document.querySelector('.modal-close').click(); });
  await page.click('#btn-export');
  const [dz] = await Promise.all([page.waitForEvent('download'), page.click('[data-x=zip]')]);
  await dz.saveAs(path.join(out, 'from-browser.zip'));
  const [dh] = await Promise.all([page.waitForEvent('download'), (async () => { await page.click('#btn-export'); await page.click('[data-x=html]'); })()]);
  await dh.saveAs(path.join(out, 'from-browser.html'));

  console.log(errors.length ? 'ERREURS:\n' + errors.join('\n') : 'Aucune erreur ✔');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
