/*
 * NOCODEX — bibliothèque d'exécution "NX".
 * Ce code est copié tel quel dans chaque application créée (aperçu, HTML, ZIP, APK).
 * Les blocs génèrent des appels comme NX.button("OK", function () { ... }).
 */
function NXRuntime() {
  'use strict';
  if (window.NX) return;

  var native = window.NXNative || null;
  try { if (!native && window.parent !== window && window.parent.NXNative) native = window.parent.NXNative; } catch (e) {}

  var app = document.getElementById('nx-app');
  if (!app) { app = document.createElement('div'); app.id = 'nx-app'; document.body.appendChild(app); }
  var target = app;
  var timers = [];
  var startTime = Date.now();

  function post(kind, data) {
    try { if (window.parent !== window) window.parent.postMessage({ nx: kind, data: data }, '*'); } catch (e) {}
  }
  function str(v) {
    if (v === undefined || v === null) return '';
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch (e) { return String(v); } }
    return String(v);
  }
  function num(v, d) { v = Number(v); return isNaN(v) ? (d || 0) : v; }
  function safe(fn, args) {
    if (typeof fn !== 'function') return;
    try { return fn.apply(null, args || []); } catch (e) { NX.error(e); }
  }
  function byId(id) { return document.getElementById(str(id)); }
  function add(el, id) {
    if (id) el.id = str(id);
    target.appendChild(el);
    return el;
  }

  var NX = window.NX = {};

  /* ---------- Console & erreurs ---------- */
  NX.log = function (v) { console.log(v); post('log', str(v)); };
  NX.error = function (e) {
    var msg = (e && e.message) ? e.message : str(e);
    console.error(e);
    post('error', msg);
    var bar = document.getElementById('nx-error');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'nx-error';
      bar.onclick = function () { bar.remove(); };
      document.body.appendChild(bar);
    }
    bar.textContent = '⚠️ Erreur : ' + msg + '  (toucher pour fermer)';
  };
  window.addEventListener('error', function (ev) { NX.error(ev.error || ev.message); });
  window.addEventListener('unhandledrejection', function (ev) { NX.error(ev.reason); });

  /* ---------- Écran / interface ---------- */
  NX.setTitle = function (t) { document.title = str(t); };
  NX.background = function (c) { document.body.style.background = str(c); };
  NX.textColor = function (c) { document.body.style.color = str(c); };
  NX.font = function (f) { document.body.style.fontFamily = str(f); };
  NX.align = function (a) { app.style.textAlign = str(a); };
  NX.text = function (t, id) { var p = document.createElement('p'); p.textContent = str(t); return add(p, id); };
  NX.heading = function (t, level, id) {
    var h = document.createElement('h' + Math.min(6, Math.max(1, num(level, 1))));
    h.textContent = str(t);
    return add(h, id);
  };
  NX.button = function (label, fn, id) {
    var b = document.createElement('button');
    b.className = 'nx-btn';
    b.textContent = str(label);
    b.onclick = function () { safe(fn); };
    return add(b, id);
  };
  NX.input = function (id, placeholder, type) {
    var i = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') i.type = type || 'text';
    i.className = 'nx-input';
    i.placeholder = str(placeholder);
    return add(i, id);
  };
  NX.slider = function (id, min, max, value) {
    var i = document.createElement('input');
    i.type = 'range'; i.className = 'nx-slider';
    i.min = num(min); i.max = num(max, 100); i.value = num(value);
    return add(i, id);
  };
  NX.checkbox = function (id, label) {
    var l = document.createElement('label');
    l.className = 'nx-check';
    var c = document.createElement('input');
    c.type = 'checkbox'; c.id = str(id);
    l.appendChild(c);
    l.appendChild(document.createTextNode(' ' + str(label)));
    target.appendChild(l);
    return c;
  };
  NX.select = function (id, options) {
    var s = document.createElement('select');
    s.className = 'nx-input';
    (Array.isArray(options) ? options : str(options).split(',')).forEach(function (o) {
      var opt = document.createElement('option');
      opt.textContent = str(o).trim();
      s.appendChild(opt);
    });
    return add(s, id);
  };
  NX.valueOf = function (id) {
    var el = byId(id);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    if ('value' in el && el.tagName !== 'BUTTON' && el.tagName !== 'LI') {
      var v = el.value;
      return (v !== '' && !isNaN(v) && el.type !== 'text' && el.tagName !== 'TEXTAREA') ? Number(v) : v;
    }
    return el.textContent;
  };
  NX.numberOf = function (id) { return num(NX.valueOf(id)); };
  NX.setValue = function (id, v) {
    var el = byId(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else if ('value' in el && el.tagName !== 'BUTTON' && el.tagName !== 'LI') el.value = str(v);
    else el.textContent = str(v);
  };
  NX.image = function (src, width, id) {
    var img = document.createElement('img');
    img.src = str(src);
    img.className = 'nx-img';
    if (width) img.style.width = num(width) + 'px';
    return add(img, id);
  };
  NX.video = function (src, id) {
    var v = document.createElement('video');
    v.src = str(src); v.controls = true; v.className = 'nx-img';
    return add(v, id);
  };
  NX.youtube = function (videoId) {
    var f = document.createElement('iframe');
    f.className = 'nx-embed';
    f.src = 'https://www.youtube.com/embed/' + encodeURIComponent(str(videoId));
    f.allowFullscreen = true;
    return add(f);
  };
  NX.link = function (label, url) {
    var a = document.createElement('a');
    a.textContent = str(label);
    a.href = str(url);
    a.target = '_blank';
    a.onclick = function (e) { if (native) { e.preventDefault(); native.openUrl(str(url)); } };
    return add(a);
  };
  NX.list = function (id, items) {
    var ul = byId(id);
    if (!ul) { ul = document.createElement('ul'); ul.className = 'nx-list'; add(ul, id); }
    ul.innerHTML = '';
    (Array.isArray(items) ? items : [items]).forEach(function (it, i) {
      var li = document.createElement('li');
      li.textContent = str(it);
      li.dataset.index = i + 1;
      ul.appendChild(li);
    });
    return ul;
  };
  NX.onListClick = function (id, fn) {
    var ul = byId(id);
    if (!ul) { ul = NX.list(id, []); }
    ul.onclick = function (e) {
      var li = e.target.closest('li');
      if (li) { NX.clickedItem = li.textContent; NX.clickedIndex = Number(li.dataset.index); safe(fn); }
    };
  };
  NX.separator = function () { return add(document.createElement('hr')); };
  NX.space = function (px) { var d = document.createElement('div'); d.style.height = num(px, 16) + 'px'; return add(d); };
  NX.box = function (id, fn, layout) {
    var d = byId(id);
    if (!d) { d = document.createElement('div'); add(d, id); }
    d.className = 'nx-box' + (layout === 'row' ? ' nx-row' : '') + (layout === 'card' ? ' nx-card' : '');
    var prev = target;
    target = d;
    try { safe(fn); } finally { target = prev; }
    return d;
  };
  NX.clear = function (id) {
    var el = id ? byId(id) : app;
    if (el) el.innerHTML = '';
  };
  NX.setText = function (id, t) { var el = byId(id); if (el) el.textContent = str(t); };
  NX.getText = function (id) { var el = byId(id); return el ? el.textContent : ''; };
  NX.style = function (id, prop, value) {
    var el = id === 'page' ? document.body : byId(id);
    if (el) el.style[str(prop)] = (typeof value === 'number' && !/opacity|z-?index|flex|weight/i.test(prop)) ? value + 'px' : str(value);
  };
  NX.show = function (id, visible) { var el = byId(id); if (el) el.style.display = visible ? '' : 'none'; };
  NX.remove = function (id) { var el = byId(id); if (el) el.remove(); };
  NX.onClick = function (id, fn) { var el = byId(id); if (el) el.addEventListener('click', function () { safe(fn); }); };
  NX.onChange = function (id, fn) { var el = byId(id); if (el) el.addEventListener('input', function () { safe(fn); }); };
  NX.html = function (code) {
    var d = document.createElement('div');
    d.innerHTML = str(code);
    while (d.firstChild) target.appendChild(d.firstChild);
    // Les <script> insérés via innerHTML ne s'exécutent pas : on les recrée.
    Array.prototype.forEach.call(target.querySelectorAll('script:not([data-nx])'), function (old) {
      var s = document.createElement('script');
      s.dataset.nx = '1';
      s.textContent = old.textContent;
      if (old.src) s.src = old.src;
      old.replaceWith(s);
    });
  };
  NX.css = function (code) {
    var s = document.createElement('style');
    s.textContent = str(code);
    document.head.appendChild(s);
  };
  NX.alert = function (m) { alert(str(m)); };
  NX.ask = function (q, def) { var r = prompt(str(q), def === undefined ? '' : str(def)); return r === null ? '' : r; };
  NX.askNumber = function (q) { return num(NX.ask(q)); };
  NX.confirm = function (q) { return confirm(str(q)); };
  NX.toast = function (m) {
    var t = document.createElement('div');
    t.className = 'nx-toast';
    t.textContent = str(m);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('nx-hide'); }, 2200);
    setTimeout(function () { t.remove(); }, 2700);
  };

  /* ---------- Temps ---------- */
  NX.after = function (sec, fn) { timers.push(setTimeout(function () { safe(fn); }, num(sec) * 1000)); };
  NX.every = function (sec, fn) { timers.push(setInterval(function () { safe(fn); }, Math.max(10, num(sec) * 1000))); };
  NX.stopTimers = function () {
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    timers = [];
    loops = [];
  };
  NX.time = function (part) {
    var d = new Date();
    switch (part) {
      case 'hour': return d.getHours();
      case 'minute': return d.getMinutes();
      case 'second': return d.getSeconds();
      case 'day': return d.getDate();
      case 'month': return d.getMonth() + 1;
      case 'year': return d.getFullYear();
      case 'weekday': return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][d.getDay()];
      case 'date': return d.toLocaleDateString('fr-FR');
      case 'clock': return d.toLocaleTimeString('fr-FR');
      case 'timestamp': return d.getTime();
    }
    return d.toString();
  };
  NX.chrono = function () { return Math.round((Date.now() - startTime) / 100) / 10; };
  NX.resetChrono = function () { startTime = Date.now(); };

  /* ---------- Données ---------- */
  NX.save = function (k, v) { try { localStorage.setItem('nx:' + k, JSON.stringify(v)); } catch (e) {} };
  NX.load = function (k, def) {
    try {
      var v = localStorage.getItem('nx:' + k);
      return v === null ? (def === undefined ? '' : def) : JSON.parse(v);
    } catch (e) { return def === undefined ? '' : def; }
  };
  NX.forget = function (k) { try { localStorage.removeItem('nx:' + k); } catch (e) {} };
  NX.fetch = function (url, asJson, fn) {
    fetch(str(url)).then(function (r) { return asJson ? r.json() : r.text(); })
      .then(function (data) { NX.result = data; safe(fn); })
      .catch(function (e) { NX.result = ''; NX.error('Internet : ' + e.message); });
  };
  NX.get = function (obj, path) {
    if (typeof obj === 'string') { try { obj = JSON.parse(obj); } catch (e) { return ''; } }
    var cur = obj;
    str(path).split('.').forEach(function (p) {
      if (cur === undefined || cur === null || p === '') return;
      cur = cur[/^\d+$/.test(p) ? Number(p) : p];
    });
    return cur === undefined ? '' : cur;
  };
  NX.toJson = function (v) { return JSON.stringify(v); };
  NX.fromJson = function (t) { try { return JSON.parse(str(t)); } catch (e) { return ''; } };
  NX.copy = function (t) {
    try { navigator.clipboard.writeText(str(t)); NX.toast('Copié !'); }
    catch (e) { NX.toast('Copie impossible'); }
  };
  NX.share = function (t) {
    if (native && native.shareText) native.shareText(str(t));
    else if (navigator.share) navigator.share({ text: str(t) }).catch(function () {});
    else NX.copy(t);
  };
  NX.openUrl = function (url) {
    if (native && native.openUrl) native.openUrl(str(url));
    else window.open(str(url), '_blank');
  };
  NX.downloadText = function (name, text) {
    var blob = new Blob([str(text)], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = str(name);
    a.click();
  };

  /* ---------- Appareil ---------- */
  NX.vibrate = function (ms) {
    if (native && native.vibrate) native.vibrate(num(ms, 200));
    else if (navigator.vibrate) navigator.vibrate(num(ms, 200));
  };
  NX.locate = function (fn) {
    if (!navigator.geolocation) return NX.error('Localisation indisponible');
    navigator.geolocation.getCurrentPosition(function (p) {
      NX.latitude = p.coords.latitude;
      NX.longitude = p.coords.longitude;
      safe(fn);
    }, function (e) { NX.error('Localisation refusée : ' + e.message); });
  };
  NX.screen = function (what) {
    if (what === 'width') return window.innerWidth;
    if (what === 'height') return window.innerHeight;
    if (what === 'android') return !!native;
    if (what === 'online') return navigator.onLine;
    if (what === 'dark') return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
    if (what === 'language') return navigator.language;
    return '';
  };
  NX.fullscreen = function (on) {
    if (native && native.fullscreen) return native.fullscreen(!!on);
    try { if (on) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {}
  };
  NX.keepAwake = function (on) { if (native && native.keepScreenOn) native.keepScreenOn(!!on); };
  NX.camera = function (id) {
    var v = document.createElement('video');
    v.autoplay = true; v.playsInline = true; v.className = 'nx-img';
    add(v, id);
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (s) { v.srcObject = s; })
      .catch(function (e) { NX.error('Caméra : ' + e.message); });
  };

  /* ---------- Sons & voix ---------- */
  var audioCtx = null;
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  var soundQueue = 0;
  NX.beep = function (freq, ms, wave) {
    try {
      var c = ctx(), o = c.createOscillator(), g = c.createGain();
      var start = Math.max(c.currentTime, soundQueue);
      var dur = num(ms, 200) / 1000;
      o.type = wave || 'square';
      o.frequency.value = num(freq, 440);
      g.gain.setValueAtTime(0.15, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(c.destination);
      o.start(start); o.stop(start + dur);
      soundQueue = start + dur;
    } catch (e) {}
  };
  var NOTES = { do: 261.63, re: 293.66, mi: 329.63, fa: 349.23, sol: 392.0, la: 440.0, si: 493.88, do2: 523.25 };
  NX.note = function (n, beats) { NX.beep(NOTES[n] || num(n, 440), num(beats, 1) * 400, 'triangle'); };
  NX.sound = function (name) {
    var presets = {
      piece: [[988, 80], [1319, 250]], saut: [[300, 80], [600, 120]], explosion: [[120, 300], [60, 300]],
      victoire: [[523, 120], [659, 120], [784, 120], [1047, 300]], defaite: [[392, 200], [330, 200], [262, 400]],
      clic: [[1200, 30]], alarme: [[880, 200], [660, 200], [880, 200], [660, 200]]
    };
    (presets[name] || [[440, 200]]).forEach(function (p) { NX.beep(p[0], p[1], name === 'explosion' ? 'sawtooth' : 'square'); });
  };
  NX.playUrl = function (url) { try { new Audio(str(url)).play(); } catch (e) { NX.error(e); } };
  NX.speak = function (t) {
    if (native && native.speak) return native.speak(str(t));
    if (window.speechSynthesis) {
      var u = new SpeechSynthesisUtterance(str(t));
      u.lang = 'fr-FR';
      speechSynthesis.speak(u);
    }
  };

  /* ---------- Jeux : scène, sprites, dessin ---------- */
  var scene = null, sprites = {}, loops = [], keys = {}, keyHandlers = [], tapHandlers = [];
  NX.tapX = 0; NX.tapY = 0; NX.gravity = 0;

  NX.scene = function (w, h, color) {
    if (scene) { scene.canvas.remove(); }
    var c = document.createElement('canvas');
    c.width = num(w, 360); c.height = num(h, 640);
    c.className = 'nx-scene';
    var paint = document.createElement('canvas');
    paint.width = c.width; paint.height = c.height;
    scene = { canvas: c, ctx: c.getContext('2d'), paint: paint, pctx: paint.getContext('2d'), color: str(color || '#000'), hud: '' };
    add(c);
    function pos(e) {
      var r = c.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      NX.tapX = Math.round((t.clientX - r.left) * c.width / r.width);
      NX.tapY = Math.round((t.clientY - r.top) * c.height / r.height);
    }
    function down(e) {
      pos(e);
      scene.pressed = true;
      Object.keys(sprites).forEach(function (n) {
        var s = sprites[n];
        if (s.visible && s.onTap && Math.abs(s.x - NX.tapX) < s.size / 2 && Math.abs(s.y - NX.tapY) < s.size / 2) safe(s.onTap);
      });
      tapHandlers.forEach(function (fn) { safe(fn); });
      if (e.cancelable) e.preventDefault();
    }
    c.addEventListener('mousedown', down);
    c.addEventListener('touchstart', down, { passive: false });
    c.addEventListener('mousemove', function (e) { if (scene.pressed) pos(e); });
    c.addEventListener('touchmove', function (e) { pos(e); if (e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('mouseup', function () { scene && (scene.pressed = false); });
    c.addEventListener('touchend', function () { scene.pressed = false; });
    return c;
  };
  NX.sceneSize = function (what) { return scene ? (what === 'height' ? scene.canvas.height : scene.canvas.width) : 0; };
  NX.sceneColor = function (c) { if (scene) scene.color = str(c); };
  NX.hud = function (t) { if (scene) scene.hud = str(t); };
  NX.pressing = function () { return !!(scene && scene.pressed); };

  NX.sprite = function (name, look, x, y, size) {
    if (!scene) NX.scene(360, 640, '#111');
    sprites[str(name)] = {
      name: str(name), look: str(look), x: num(x, 100), y: num(y, 100), size: num(size, 48),
      angle: 0, opacity: 1, vx: 0, vy: 0, visible: true, bounce: false, gravity: false
    };
  };
  function sp(name) { return sprites[str(name)]; }
  NX.spriteSet = function (name, prop, v) {
    var s = sp(name); if (!s) return;
    if (prop === 'look') s.look = str(v);
    else if (prop === 'visible' || prop === 'bounce' || prop === 'gravity') s[prop] = !!v;
    else s[prop] = num(v);
  };
  NX.spriteChange = function (name, prop, v) { var s = sp(name); if (s) s[prop] = num(s[prop]) + num(v); };
  NX.spriteGet = function (name, prop) { var s = sp(name); return s ? s[prop] : 0; };
  NX.spriteMove = function (name, dx, dy) { var s = sp(name); if (s) { s.x += num(dx); s.y += num(dy); } };
  NX.spriteGoto = function (name, x, y) { var s = sp(name); if (s) { s.x = num(x); s.y = num(y); } };
  NX.spriteRandom = function (name) {
    var s = sp(name); if (!s || !scene) return;
    s.x = s.size / 2 + Math.random() * (scene.canvas.width - s.size);
    s.y = s.size / 2 + Math.random() * (scene.canvas.height - s.size);
  };
  NX.spriteDelete = function (name) { delete sprites[str(name)]; };
  NX.spriteClone = function (name, newName) {
    var s = sp(name); if (!s) return;
    var c = JSON.parse(JSON.stringify(s)); c.name = str(newName); c.onTap = s.onTap;
    sprites[c.name] = c;
  };
  NX.spriteExists = function (name) { return !!sp(name); };
  NX.touching = function (a, b) {
    var s1 = sp(a), s2 = sp(b);
    if (!s1 || !s2 || !s1.visible || !s2.visible) return false;
    var d = (s1.size + s2.size) * 0.4;
    return Math.abs(s1.x - s2.x) < d && Math.abs(s1.y - s2.y) < d;
  };
  NX.touchingGroup = function (a, prefix) {
    var found = '';
    Object.keys(sprites).forEach(function (n) {
      if (!found && n !== str(a) && n.indexOf(str(prefix)) === 0 && NX.touching(a, n)) found = n;
    });
    NX.touchedSprite = found;
    return !!found;
  };
  NX.atEdge = function (name) {
    var s = sp(name); if (!s || !scene) return false;
    var h = s.size / 2;
    return s.x <= h || s.y <= h || s.x >= scene.canvas.width - h || s.y >= scene.canvas.height - h;
  };
  NX.keepInside = function (name) {
    var s = sp(name); if (!s || !scene) return;
    var h = s.size / 2;
    s.x = Math.max(h, Math.min(scene.canvas.width - h, s.x));
    s.y = Math.max(h, Math.min(scene.canvas.height - h, s.y));
  };
  NX.distance = function (a, b) {
    var s1 = sp(a), s2 = sp(b);
    return (s1 && s2) ? Math.round(Math.hypot(s1.x - s2.x, s1.y - s2.y)) : 0;
  };
  NX.pointTowards = function (a, x, y, speed) {
    var s = sp(a); if (!s) return;
    var dx = num(x) - s.x, dy = num(y) - s.y, d = Math.hypot(dx, dy) || 1;
    s.vx = dx / d * num(speed, 3); s.vy = dy / d * num(speed, 3);
  };
  NX.onSpriteTap = function (name, fn) { var s = sp(name); if (s) s.onTap = fn; };
  NX.onTap = function (fn) { tapHandlers.push(fn); };
  NX.everyFrame = function (fn) { loops.push(fn); };

  NX.draw = function (shape, a, b, c, d, color) {
    if (!scene) NX.scene(360, 640, '#111');
    var g = scene.pctx;
    g.fillStyle = g.strokeStyle = str(color || '#fff');
    g.lineWidth = 4;
    if (shape === 'rect') g.fillRect(num(a), num(b), num(c), num(d));
    else if (shape === 'circle') { g.beginPath(); g.arc(num(a), num(b), Math.abs(num(c)), 0, Math.PI * 2); g.fill(); }
    else if (shape === 'line') { g.beginPath(); g.moveTo(num(a), num(b)); g.lineTo(num(c), num(d)); g.stroke(); }
  };
  NX.drawText = function (t, x, y, size, color) {
    if (!scene) NX.scene(360, 640, '#111');
    var g = scene.pctx;
    g.fillStyle = str(color || '#fff');
    g.font = 'bold ' + num(size, 24) + 'px sans-serif';
    g.textAlign = 'center';
    g.fillText(str(t), num(x), num(y));
  };
  NX.clearDrawing = function () { if (scene) scene.pctx.clearRect(0, 0, scene.paint.width, scene.paint.height); };

  // Clavier + manette tactile
  function keyName(k) {
    return ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space', Enter: 'enter' })[k] || String(k).toLowerCase();
  }
  function pressKey(k) {
    if (!keys[k]) keyHandlers.forEach(function (h) { if (h.key === k || h.key === 'any') { NX.lastKey = k; safe(h.fn); } });
    keys[k] = true;
  }
  window.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    pressKey(keyName(e.key));
    if (scene && /Arrow| /.test(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[keyName(e.key)] = false; });
  NX.onKey = function (k, fn) { keyHandlers.push({ key: k, fn: fn }); };
  NX.keyDown = function (k) { return !!keys[k]; };
  NX.gamepad = function () {
    if (document.getElementById('nx-pad')) return;
    var pad = document.createElement('div');
    pad.id = 'nx-pad';
    [['left', '◀'], ['up', '▲'], ['down', '▼'], ['right', '▶'], ['space', 'A']].forEach(function (b) {
      var el = document.createElement('button');
      el.textContent = b[1];
      el.className = 'nx-pad-' + b[0];
      var on = function (e) { e.preventDefault(); pressKey(b[0]); };
      var off = function (e) { e.preventDefault(); keys[b[0]] = false; };
      el.addEventListener('touchstart', on, { passive: false });
      el.addEventListener('touchend', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
      pad.appendChild(el);
    });
    document.body.appendChild(pad);
    document.body.classList.add('nx-has-pad');
  };

  function frame() {
    if (scene) {
      var g = scene.ctx, W = scene.canvas.width, H = scene.canvas.height;
      loops.forEach(function (fn) { safe(fn); });
      Object.keys(sprites).forEach(function (n) {
        var s = sprites[n];
        if (s.gravity) s.vy += NX.gravity || 0.5;
        s.x += s.vx; s.y += s.vy;
        if (s.bounce) {
          var h = s.size / 2;
          if (s.x < h || s.x > W - h) { s.vx = -s.vx; s.x = Math.max(h, Math.min(W - h, s.x)); }
          if (s.y < h || s.y > H - h) { s.vy = -s.vy; s.y = Math.max(h, Math.min(H - h, s.y)); }
        }
      });
      g.fillStyle = scene.color;
      g.fillRect(0, 0, W, H);
      g.drawImage(scene.paint, 0, 0);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      Object.keys(sprites).forEach(function (n) {
        var s = sprites[n];
        if (!s.visible) return;
        g.save();
        g.globalAlpha = Math.max(0, Math.min(1, s.opacity));
        g.translate(s.x, s.y);
        g.rotate(s.angle * Math.PI / 180);
        if (/^(https?:|data:|blob:)/.test(s.look)) {
          if (!s.img || s.img.src !== s.look) { s.img = new Image(); s.img.src = s.look; }
          if (s.img.complete) g.drawImage(s.img, -s.size / 2, -s.size / 2, s.size, s.size);
        } else {
          g.font = s.size + 'px sans-serif';
          g.fillText(s.look, 0, s.size * 0.06);
        }
        g.restore();
      });
      if (scene.hud) {
        g.font = 'bold 22px sans-serif';
        g.textAlign = 'left';
        g.textBaseline = 'top';
        g.fillStyle = 'rgba(0,0,0,.45)';
        g.fillRect(0, 0, W, 40);
        g.fillStyle = '#fff';
        g.fillText(scene.hud, 12, 9);
      }
    } else {
      loops.forEach(function (fn) { safe(fn); });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Divers ---------- */
  NX.media = function (name) { var m = window.NX_MEDIA || {}; return m[str(name)] || ''; };
  NX.setGravity = function (g) { NX.gravity = num(g, 0.5); };
  NX.rgb = function (r, g, b) { return 'rgb(' + num(r) + ',' + num(g) + ',' + num(b) + ')'; };
  NX.randomColor = function () { return 'hsl(' + Math.floor(Math.random() * 360) + ',80%,55%)'; };
  NX.random = function (a, b) { a = num(a); b = num(b); return Math.floor(Math.random() * (b - a + 1)) + a; };
  NX.pick = function (list) { return Array.isArray(list) && list.length ? list[Math.floor(Math.random() * list.length)] : ''; };
  NX.exit = function () { if (native && native.exit) native.exit(); else window.close(); };
  NX.reload = function () { location.reload(); };
}
