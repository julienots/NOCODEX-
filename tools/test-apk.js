// Test hors téléphone : génère un APK avec web/js/apk.js puis le vérifie avec apksigner.
const fs = require('fs');
const NXApk = require('../web/js/apk.js');
const template = new Uint8Array(fs.readFileSync(process.argv[2]));
const out = process.argv[3];
const t0 = Date.now();
NXApk.createKey((err, key) => {
  if (err) throw err;
  console.log('clé générée en', Date.now() - t0, 'ms');
  const res = NXApk.buildApk({
    template,
    files: { 'index.html': '<!doctype html><h1 style="color:red">Bonjour depuis NOCODEX</h1><script>document.body.append(navigator.userAgent)</script>' },
    appName: 'Mon Jeu Génial é',
    icon: new Uint8Array(fs.readFileSync(__dirname + '/../web/img/icon-192.png')),
    key
  });
  fs.writeFileSync(out, res.apk);
  console.log('APK', res.packageName, res.apk.length, 'octets');
});
