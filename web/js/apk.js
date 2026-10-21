/*
 * NOCODEX — Générateur d'APK 100 % JavaScript (fonctionne hors ligne, dans le téléphone).
 *
 * Principe : NOCODEX embarque un APK "modèle" (une coquille WebView non signée).
 * Pour créer l'application de l'utilisateur on :
 *   1. remplace les fichiers assets/www/* par le site généré,
 *   2. change le nom affiché et le nom de package (chaînes réservées de même longueur
 *      dans AndroidManifest.xml / resources.arsc, encodées en UTF-16),
 *   3. remplace l'icône,
 *   4. reconstruit le ZIP (resources.arsc non compressé et aligné sur 4 octets),
 *   5. signe l'APK avec les schémas v1 (JAR) et v2 (APK Signature Scheme v2).
 *
 * Dépendances : fflate (zip/deflate) et node-forge (SHA-256, RSA, PKCS#7, X.509).
 */
(function (root) {
  'use strict';

  var PKG_PLACEHOLDER = 'com.nocodex.app.p000000000000';
  var LABEL_PLACEHOLDER = 'NXLABEL_________________________';

  function deps() {
    var fflate = root.fflate || (typeof require === 'function' ? require('fflate') : null);
    var forge = root.forge || (typeof require === 'function' ? require('node-forge') : null);
    if (!fflate || !forge) throw new Error('Bibliothèques fflate / forge manquantes');
    return { fflate: fflate, forge: forge };
  }

  /* ---------- utilitaires octets ---------- */

  function utf8(str) { return new TextEncoder().encode(str); }

  function concat(arrays) {
    var len = 0, i;
    for (i = 0; i < arrays.length; i++) len += arrays[i].length;
    var out = new Uint8Array(len), off = 0;
    for (i = 0; i < arrays.length; i++) { out.set(arrays[i], off); off += arrays[i].length; }
    return out;
  }

  function toBinStr(bytes) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    }
    return s;
  }

  function fromBinStr(s) {
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
    return b;
  }

  function u16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
  function u32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }
  function u64(n) {
    var lo = n % 0x100000000, hi = Math.floor(n / 0x100000000);
    return concat([u32(lo), u32(hi)]);
  }
  function lenPrefixed(bytes) { return concat([u32(bytes.length), bytes]); }

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    var c = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function sha256(forge, bytes) {
    var md = forge.md.sha256.create();
    md.update(toBinStr(bytes));
    return fromBinStr(md.digest().getBytes());
  }

  function b64(bytes) {
    if (typeof btoa === 'function') return btoa(toBinStr(bytes));
    return Buffer.from(bytes).toString('base64');
  }

  /* ---------- patch des chaînes UTF-16 réservées ---------- */

  function utf16(str) {
    var b = new Uint8Array(str.length * 2);
    for (var i = 0; i < str.length; i++) {
      b[i * 2] = str.charCodeAt(i) & 0xff;
      b[i * 2 + 1] = str.charCodeAt(i) >>> 8;
    }
    return b;
  }

  function replaceAllBytes(data, from, to) {
    var out = new Uint8Array(data), count = 0;
    outer:
    for (var i = 0; i <= out.length - from.length; i++) {
      for (var j = 0; j < from.length; j++) if (out[i + j] !== from[j]) continue outer;
      out.set(to, i);
      count++;
      i += from.length - 1;
    }
    return { data: out, count: count };
  }

  /**
   * Dans le pool de chaînes UTF-16 du manifeste binaire, chaque chaîne est précédée
   * de sa longueur (u16) et suivie d'un 0x0000. On écrit le vrai nom puis on corrige
   * la longueur : le reste de l'emplacement réservé est simplement ignoré par Android.
   */
  function replaceLabel(data, label) {
    var from = utf16(LABEL_PLACEHOLDER), out = new Uint8Array(data);
    outer:
    for (var i = 2; i <= out.length - from.length; i++) {
      for (var j = 0; j < from.length; j++) if (out[i + j] !== from[j]) continue outer;
      var len = out[i - 2] | (out[i - 1] << 8);
      var bytes = utf16(label);
      out.fill(0, i, i + from.length);
      out.set(bytes, i);
      if (len === LABEL_PLACEHOLDER.length) { out[i - 2] = label.length & 0xff; out[i - 1] = label.length >>> 8; }
      i += from.length - 1;
    }
    return out;
  }

  function fitString(str, len) {
    str = String(str || '').replace(/[\u0000-\u001f]/g, ' ');
    // On reste dans le plan multilingue de base (1 unité UTF-16 par caractère).
    str = Array.from(str).filter(function (c) { return c.length === 1; }).join('');
    if (str.length > len) str = str.slice(0, len);
    while (str.length < len) str += ' ';
    return str;
  }

  /** Nom de package valide et unique dérivé du nom de l'app, même longueur que le modèle. */
  function makePackageName(seed) {
    var prefix = 'com.nocodex.app.';
    var n = PKG_PLACEHOLDER.length - prefix.length; // 13
    var slug = String(seed || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
    var h = 0x811c9dc5;
    for (var i = 0; i < String(seed).length; i++) { h ^= String(seed).charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var hash = h.toString(36);
    var body = (slug.slice(0, n - 1 - Math.min(hash.length, 5)) + hash.slice(0, 5));
    body = ('a' + body).replace(/^a([a-z])/, '$1');
    if (!/^[a-z]/.test(body)) body = 'a' + body;
    while (body.length < n) body += '0';
    return prefix + body.slice(0, n);
  }

  /* ---------- écriture ZIP avec alignement ---------- */

  function buildZip(fflate, entries) {
    // entries : [{name, data(Uint8Array), store(bool)}]
    var locals = [], centrals = [], offset = 0;
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var nameBytes = utf8(e.name);
      var crc = crc32(e.data);
      var method = e.store ? 0 : 8;
      var comp = e.store ? e.data : fflate.deflateSync(e.data, { level: 9 });
      if (!e.store && comp.length >= e.data.length) { method = 0; comp = e.data; }
      var headerLen = 30 + nameBytes.length;
      var extra = new Uint8Array(0);
      if (method === 0) {
        // Alignement : 4 octets (4096 pour les .so, inutile ici).
        var pad = (4 - ((offset + headerLen) % 4)) % 4;
        extra = new Uint8Array(pad);
      }
      var flags = 0x0800; // noms en UTF-8
      var local = concat([
        u32(0x04034b50), u16(method === 0 ? 10 : 20), u16(flags), u16(method),
        u16(0), u16(0x21), // heure/date DOS fixes (1980-01-01)
        u32(crc), u32(comp.length), u32(e.data.length),
        u16(nameBytes.length), u16(extra.length), nameBytes, extra
      ]);
      var central = concat([
        u32(0x02014b50), u16(method === 0 ? 10 : 20), u16(method === 0 ? 10 : 20), u16(flags), u16(method),
        u16(0), u16(0x21), u32(crc), u32(comp.length), u32(e.data.length),
        u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes
      ]);
      locals.push(local, comp);
      centrals.push(central);
      offset += local.length + comp.length;
    }
    var entriesSection = concat(locals);
    var cd = concat(centrals);
    var eocd = concat([
      u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
      u32(cd.length), u32(entriesSection.length), u16(0)
    ]);
    return { entries: entriesSection, cd: cd, eocd: eocd };
  }

  /* ---------- signature v1 (JAR) ---------- */

  function manifestSection(name, digestB64) {
    // Lignes de 72 octets max, continuation par CRLF + espace.
    function wrap(line) {
      var bytes = utf8(line);
      if (bytes.length <= 72) return line + '\r\n';
      var out = '', cur = '';
      Array.from(line).forEach(function (ch) {
        var limit = out === '' ? 72 : 71;
        if (utf8(cur + ch).length > limit) { out += (out === '' ? '' : ' ') + cur + '\r\n'; cur = ch; }
        else cur += ch;
      });
      out += (out === '' ? '' : ' ') + cur + '\r\n';
      return out;
    }
    return wrap('Name: ' + name) + wrap('SHA-256-Digest: ' + digestB64) + '\r\n';
  }

  function signV1(forge, key, entries) {
    var mfMain = 'Manifest-Version: 1.0\r\nBuilt-By: NOCODEX\r\nCreated-By: NOCODEX (SuperEssence studio)\r\n\r\n';
    var sections = entries.map(function (e) { return { name: e.name, text: manifestSection(e.name, b64(sha256(forge, e.data))) }; });
    var mf = utf8(mfMain + sections.map(function (s) { return s.text; }).join(''));

    var sf = 'Signature-Version: 1.0\r\nCreated-By: 1.0 (NOCODEX)\r\n' +
      'SHA-256-Digest-Manifest: ' + b64(sha256(forge, mf)) + '\r\n' +
      'X-Android-APK-Signed: 2\r\n\r\n';
    sections.forEach(function (s) {
      sf += manifestSection(s.name, b64(sha256(forge, utf8(s.text))));
    });
    var sfBytes = utf8(sf);

    var p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(toBinStr(sfBytes));
    p7.addCertificate(key.cert);
    p7.addSigner({ key: key.privateKey, certificate: key.cert, digestAlgorithm: forge.pki.oids.sha256, authenticatedAttributes: [] });
    p7.sign({ detached: true });
    var rsa = fromBinStr(forge.asn1.toDer(p7.toAsn1()).getBytes());

    return [
      { name: 'META-INF/MANIFEST.MF', data: mf },
      { name: 'META-INF/CERT.SF', data: sfBytes },
      { name: 'META-INF/CERT.RSA', data: rsa }
    ];
  }

  /* ---------- signature v2 (APK Signature Scheme v2) ---------- */

  function chunkedDigest(forge, sections) {
    var CHUNK = 1024 * 1024, digests = [];
    sections.forEach(function (sec) {
      for (var off = 0; off < sec.length; off += CHUNK) {
        var chunk = sec.subarray(off, Math.min(off + CHUNK, sec.length));
        digests.push(sha256(forge, concat([new Uint8Array([0xa5]), u32(chunk.length), chunk])));
      }
    });
    return sha256(forge, concat([new Uint8Array([0x5a]), u32(digests.length)].concat(digests)));
  }

  function signV2(forge, key, zip) {
    var ALG = 0x0103; // RSASSA-PKCS1-v1_5 + SHA2-256
    // EOCD avec l'offset du répertoire central = début du bloc de signature (= fin des entrées).
    var digest = chunkedDigest(forge, [zip.entries, zip.cd, zip.eocd]);
    var certDer = fromBinStr(forge.asn1.toDer(forge.pki.certificateToAsn1(key.cert)).getBytes());
    var pubDer = fromBinStr(forge.asn1.toDer(forge.pki.publicKeyToAsn1(key.cert.publicKey)).getBytes());

    var signedData = concat([
      lenPrefixed(lenPrefixed(concat([u32(ALG), lenPrefixed(digest)]))),
      lenPrefixed(lenPrefixed(certDer)),
      lenPrefixed(new Uint8Array(0))
    ]);
    var md = forge.md.sha256.create();
    md.update(toBinStr(signedData));
    var sig = fromBinStr(key.privateKey.sign(md));

    var signer = concat([
      lenPrefixed(signedData),
      lenPrefixed(lenPrefixed(concat([u32(ALG), lenPrefixed(sig)]))),
      lenPrefixed(pubDer)
    ]);
    var v2Value = lenPrefixed(lenPrefixed(signer));
    var pair = concat([u64(4 + v2Value.length), u32(0x7109871a), v2Value]);
    var blockSize = pair.length + 8 + 16; // paires + taille répétée + magic
    var block = concat([u64(blockSize), pair, u64(blockSize), utf8('APK Sig Block 42')]);

    // L'EOCD final pointe vers le répertoire central, désormais décalé de la taille du bloc.
    var eocd = new Uint8Array(zip.eocd);
    var cdOffset = zip.entries.length + block.length;
    eocd.set(u32(cdOffset), 16);
    return concat([zip.entries, block, zip.cd, eocd]);
  }

  /* ---------- clé de signature ---------- */

  function createKey(forge, done) {
    // WebCrypto (natif, ~100 ms) si disponible, sinon forge en JavaScript pur (plus lent sur mobile).
    var subtle = root.crypto && root.crypto.subtle;
    if (subtle && typeof root.document !== 'undefined') {
      subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
        .then(function (kp) { return subtle.exportKey('pkcs8', kp.privateKey); })
        .then(function (pkcs8) {
          var priv = forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(toBinStr(new Uint8Array(pkcs8))));
          finish(null, { privateKey: priv, publicKey: forge.pki.setRsaPublicKey(priv.n, priv.e) });
        })
        .catch(function () { generateWithForge(); });
    } else {
      generateWithForge();
    }
    function generateWithForge() {
      forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 }, finish);
    }
    function finish(err, keys) {
      if (err) return done(err);
      var cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(8));
      cert.validity.notBefore = new Date(Date.UTC(2020, 0, 1));
      cert.validity.notAfter = new Date(Date.UTC(2075, 0, 1));
      var attrs = [{ name: 'commonName', value: 'NOCODEX' }, { name: 'organizationName', value: 'SuperEssence studio' }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(keys.privateKey, forge.md.sha256.create());
      done(null, { privateKey: keys.privateKey, cert: cert });
    }
  }

  function exportKey(forge, key) {
    return { key: forge.pki.privateKeyToPem(key.privateKey), cert: forge.pki.certificateToPem(key.cert) };
  }

  function importKey(forge, pem) {
    return { privateKey: forge.pki.privateKeyFromPem(pem.key), cert: forge.pki.certificateFromPem(pem.cert) };
  }

  /* ---------- construction complète ---------- */

  /**
   * opts = {
   *   template: Uint8Array (APK modèle non signé),
   *   files: { 'index.html': Uint8Array|string, ... }  (copiés dans assets/www/),
   *   appName, packageName (optionnel), icon: Uint8Array PNG (optionnel),
   *   key: {privateKey, cert} (forge)
   * }
   * Retourne un Uint8Array : l'APK signé, prêt à installer.
   */
  function buildApk(opts) {
    var d = deps(), fflate = d.fflate, forge = d.forge;
    var files = fflate.unzipSync(opts.template);
    var pkg = opts.packageName || makePackageName(opts.appName);
    if (pkg.length !== PKG_PLACEHOLDER.length) throw new Error('Nom de package invalide');
    var label = fitString(opts.appName || 'Mon app', LABEL_PLACEHOLDER.length);

    var out = [];
    Object.keys(files).forEach(function (name) {
      if (name.indexOf('META-INF/') === 0 || name.indexOf('assets/www/') === 0) return;
      var data = files[name];
      if (name === 'AndroidManifest.xml' || name === 'resources.arsc') {
        data = replaceAllBytes(data, utf16(PKG_PLACEHOLDER), utf16(pkg)).data;
        data = replaceLabel(data, label.replace(/\s+$/, '') || 'App');
      }
      if (opts.icon && /^res\/mipmap[^/]*\/ic_launcher\.png$/.test(name)) data = opts.icon;
      out.push({ name: name, data: data, store: name === 'resources.arsc' || /\.(png|jpg|jpeg|gif|webp|mp3|ogg|mp4)$/i.test(name) });
    });
    Object.keys(opts.files).forEach(function (rel) {
      var data = opts.files[rel];
      if (typeof data === 'string') data = utf8(data);
      out.push({ name: 'assets/www/' + rel, data: data, store: /\.(png|jpg|jpeg|gif|webp|mp3|ogg|mp4|zip)$/i.test(rel) });
    });
    // Ordre stable : manifeste d'abord (habitude des outils Android).
    out.sort(function (a, b) {
      if (a.name === 'AndroidManifest.xml') return -1;
      if (b.name === 'AndroidManifest.xml') return 1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });

    var meta = signV1(forge, opts.key, out);
    var zip = buildZip(fflate, out.concat(meta.map(function (m) { return { name: m.name, data: m.data, store: false }; })));
    return { apk: signV2(forge, opts.key, zip), packageName: pkg };
  }

  var api = {
    buildApk: buildApk,
    createKey: function (cb) { createKey(deps().forge, cb); },
    exportKey: function (k) { return exportKey(deps().forge, k); },
    importKey: function (p) { return importKey(deps().forge, p); },
    makePackageName: makePackageName,
    crc32: crc32,
    buildZip: function (entries) { var z = buildZip(deps().fflate, entries); return concat([z.entries, z.cd, z.eocd]); }
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NXApk = api;
})(typeof window !== 'undefined' ? window : globalThis);
