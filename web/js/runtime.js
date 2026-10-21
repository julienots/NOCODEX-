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
    frozen = true;
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

  /* ==========================================================
   *  Moteur de jeu NOCODEX : 2D, plateformes, vue de dessus,
   *  2.5D (profondeur) et labyrinthe 3D (raycasting).
   * ========================================================== */
  var scene = null, sprites = {}, loops = [], keys = {}, keyHandlers = [], tapHandlers = [];
  var collides = [], particles = [], legend = {}, imgCache = {};
  var world = { w: 0, h: 0 }, cam = { x: 0, y: 0, follow: '' }, shakeT = 0, shakeA = 0;
  var frozen = false, mode = '2d', horizon = 200, paused = false, spawnId = 0, maze = null, minimap = false;
  NX.tapX = 0; NX.tapY = 0; NX.gravity = 0.6; NX.other = ''; NX.self = ''; NX.current = '';

  function isColor(s) { return /^(#[0-9a-f]{3,8}|rgb|hsl)/i.test(s); }
  function isImage(s) { return /^(https?:|data:|blob:|file:|\.?\/|img\/)/.test(s); }
  function matches(s, x) { return s && (s.name === x || s.group === x); }

  NX.scene = function (w, h, color) {
    if (scene) { scene.canvas.remove(); }
    var c = document.createElement('canvas');
    c.width = num(w, 360); c.height = num(h, 640);
    c.className = 'nx-scene';
    var paint = document.createElement('canvas');
    paint.width = c.width; paint.height = c.height;
    scene = { canvas: c, ctx: c.getContext('2d'), paint: paint, pctx: paint.getContext('2d'), color: str(color || '#000'),
      hud: '', W: c.width, H: c.height, floor: '#4e342e', bg: [], gradient: null };
    world.w = c.width; world.h = c.height;
    cam.x = cam.y = 0;
    add(c);
    function pos(e) {
      var r = c.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      NX.screenX = (t.clientX - r.left) * c.width / r.width;
      NX.screenY = (t.clientY - r.top) * c.height / r.height;
      NX.tapX = Math.round(NX.screenX + cam.x);
      NX.tapY = Math.round(NX.screenY + cam.y);
    }
    function down(e) {
      pos(e);
      scene.pressed = true;
      Object.keys(sprites).forEach(function (n) {
        var s = sprites[n];
        if (s && s.visible && s.onTap && Math.abs(s.x - NX.tapX) < s.size / 2 && Math.abs(s.y - s.z - NX.tapY) < s.size / 2) { NX.self = n; safe(s.onTap); }
      });
      tapHandlers.forEach(function (fn) { safe(fn); });
      if (e.cancelable) e.preventDefault();
    }
    c.addEventListener('mousedown', down);
    c.addEventListener('touchstart', down, { passive: false });
    c.addEventListener('mousemove', function (e) { if (scene && scene.pressed) pos(e); });
    c.addEventListener('touchmove', function (e) { pos(e); if (e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('mouseup', function () { if (scene) scene.pressed = false; });
    c.addEventListener('touchend', function () { scene.pressed = false; });
    return c;
  };
  function needScene() { if (!scene) NX.scene(360, 600, '#1a237e'); }
  NX.sceneSize = function (what) { return scene ? (what === 'height' ? scene.H : scene.W) : 0; };
  NX.worldSizeOf = function (what) { return what === 'height' ? world.h : world.w; };
  NX.sceneColor = function (c) { needScene(); scene.color = str(c); scene.gradient = null; };
  NX.sceneGradient = function (a, b) { needScene(); scene.gradient = [str(a), str(b)]; };
  NX.sceneImage = function (src, speed) { needScene(); scene.bg.push({ src: str(src), speed: num(speed, 0.5) }); };
  NX.hud = function (t) { needScene(); scene.hud = str(t); };
  NX.pressing = function () { return !!(scene && scene.pressed); };
  NX.worldSize = function (w, h) { needScene(); world.w = Math.max(scene.W, num(w)); world.h = Math.max(scene.H, num(h)); };
  NX.cameraFollow = function (name) { cam.follow = str(name); };
  NX.cameraGoto = function (x, y) { cam.follow = ''; cam.x = num(x); cam.y = num(y); };
  NX.shake = function (a) { shakeA = num(a, 8); shakeT = 18; };
  NX.pause = function (p) { paused = !!p; };
  NX.isPaused = function () { return paused; };

  /* ---------- Sprites ---------- */
  NX.sprite = function (name, look, x, y, size) {
    needScene();
    var s = sprites[str(name)] = {
      name: str(name), look: str(look), x: num(x, 100), y: num(y, 100), z: 0, size: num(size, 48),
      angle: 0, opacity: 1, vx: 0, vy: 0, vz: 0, visible: true, bounce: false, gravity: false,
      solid: false, group: '', flip: false, layer: 0, frames: null, frameSpeed: 8, t: 0,
      onGround: false, hitWall: false, autoDelete: false, control: null, label: '', bar: null, id: spawnId++
    };
    return s.name;
  };
  function sp(name) { return sprites[str(name)]; }
  NX.spawn = function (look, group, x, y, vx, vy, size) {
    var name = str(group || 'objet') + '#' + (spawnId + 1);
    NX.sprite(name, look, x, y, size || 40);
    var s = sp(name);
    s.group = str(group); s.vx = num(vx); s.vy = num(vy); s.autoDelete = true;
    NX.lastSpawned = name;
    return name;
  };
  NX.spriteSet = function (name, prop, v) {
    eachTarget(name, function (s) {
      if (prop === 'look' || prop === 'group' || prop === 'label') s[prop] = str(v);
      else if (/^(visible|bounce|gravity|solid|flip|autoDelete)$/.test(prop)) s[prop] = !!v;
      else s[prop] = num(v);
    });
  };
  NX.spriteChange = function (name, prop, v) { eachTarget(name, function (s) { s[prop] = num(s[prop]) + num(v); }); };
  NX.spriteGet = function (name, prop) {
    var s = sp(name);
    if (!s) return 0;
    if (prop === 'onGround') return s.onGround;
    return s[prop];
  };
  NX.spriteMove = function (name, dx, dy) { eachTarget(name, function (s) { s.x += num(dx); s.y += num(dy); }); };
  NX.spriteGoto = function (name, x, y) { eachTarget(name, function (s) { s.x = num(x); s.y = num(y); }); };
  NX.spriteRandom = function (name) {
    eachTarget(name, function (s) {
      s.x = s.size / 2 + Math.random() * (world.w - s.size);
      s.y = (mode === '25d' ? horizon : s.size / 2) + Math.random() * (world.h - s.size - (mode === '25d' ? horizon : 0));
    });
  };
  NX.spriteDelete = function (name) {
    var n = str(name);
    if (sprites[n]) { delete sprites[n]; return; }
    Object.keys(sprites).forEach(function (k) { if (sprites[k].group === n) delete sprites[k]; });
  };
  NX.spriteClone = function (name, newName) {
    var s = sp(name); if (!s) return;
    var c = JSON.parse(JSON.stringify(s)); c.name = str(newName); c.onTap = s.onTap; c.id = spawnId++;
    sprites[c.name] = c;
  };
  NX.spriteExists = function (name) { return !!sp(name); };
  NX.animate = function (name, frames, speed) {
    var list = Array.isArray(frames) ? frames : str(frames).split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    eachTarget(name, function (s) { s.frames = list.length ? list : null; s.frameSpeed = Math.max(1, num(speed, 8)); });
  };
  NX.label = function (name, t) { eachTarget(name, function (s) { s.label = str(t); }); };
  NX.lifeBar = function (name, v, max) { eachTarget(name, function (s) { s.bar = { v: num(v), max: Math.max(1, num(max, 100)) }; }); };
  NX.toFront = function (name) { var top = 0; Object.keys(sprites).forEach(function (k) { top = Math.max(top, sprites[k].layer); }); eachTarget(name, function (s) { s.layer = top + 1; }); };

  // Un nom de sprite OU un nom de groupe : les blocs s'appliquent à tous.
  function eachTarget(x, fn) {
    var s = sp(x);
    if (s) return fn(s);
    Object.keys(sprites).forEach(function (k) { if (sprites[k] && sprites[k].group === str(x)) fn(sprites[k]); });
  }

  /* ---------- Collisions ---------- */
  function overlap(a, b) {
    if (!a || !b || a === b || !a.visible || !b.visible) return false;
    if (mode === 'maze') return Math.hypot(a.x - b.x, a.y - b.y) < (a.size + b.size) * 0.4;
    var d = (a.size + b.size) * 0.4;
    if (mode === '25d') return Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d * 0.45 && Math.abs(a.z - b.z) < d;
    return Math.abs(a.x - b.x) < d && Math.abs(a.y - b.y) < d;
  }
  NX.touching = function (a, b) {
    var hit = false;
    eachTarget(a, function (s1) {
      if (hit) return;
      Object.keys(sprites).forEach(function (k) { if (!hit && matches(sprites[k], str(b)) && overlap(s1, sprites[k])) { hit = true; NX.self = s1.name; NX.other = k; } });
    });
    return hit;
  };
  NX.touchingGroup = function (a, prefix) {
    var found = '';
    Object.keys(sprites).forEach(function (n) {
      if (!found && n !== str(a) && (n.indexOf(str(prefix)) === 0 || sprites[n].group === str(prefix)) && overlap(sp(a), sprites[n])) found = n;
    });
    NX.touchedSprite = NX.other = found;
    return !!found;
  };
  NX.onCollide = function (a, b, fn) { collides.push({ a: str(a), b: str(b), fn: fn, on: {} }); };
  NX.atEdge = function (name) {
    var s = sp(name); if (!s) return false;
    var h = s.size / 2;
    return s.x <= h || s.y <= h || s.x >= world.w - h || s.y >= world.h - h;
  };
  NX.keepInside = function (name) {
    eachTarget(name, function (s) {
      var h = s.size / 2;
      s.x = Math.max(h, Math.min(world.w - h, s.x));
      s.y = Math.max(mode === '25d' ? horizon : h, Math.min(world.h - h * (mode === '25d' ? 0.2 : 1), s.y));
    });
  };
  NX.distance = function (a, b) {
    var s1 = sp(a), s2 = sp(b);
    return (s1 && s2) ? Math.round(Math.hypot(s1.x - s2.x, s1.y - s2.y)) : 0;
  };
  NX.pointTowards = function (a, x, y, speed) {
    eachTarget(a, function (s) {
      var dx = num(x) - s.x, dy = num(y) - s.y, d = Math.hypot(dx, dy) || 1;
      s.vx = dx / d * num(speed, 3); s.vy = dy / d * num(speed, 3);
    });
  };
  NX.forEachInGroup = function (g, fn) {
    Object.keys(sprites).forEach(function (k) { if (sprites[k] && sprites[k].group === str(g)) { NX.current = k; safe(fn); } });
  };
  NX.groupCount = function (g) { return Object.keys(sprites).filter(function (k) { return sprites[k].group === str(g); }).length; };
  NX.onSpriteTap = function (name, fn) { eachTarget(name, function (s) { s.onTap = fn; }); };
  NX.onTap = function (fn) { tapHandlers.push(fn); };
  NX.everyFrame = function (fn) { loops.push(fn); };

  /* ---------- Contrôles tout-en-un ---------- */
  NX.control = function (name, type, speed, jump) {
    eachTarget(name, function (s) {
      s.control = { type: str(type), speed: num(speed, 4), jump: num(jump, 12) };
      if (type === 'platform') s.gravity = true;
      if (type === 'patrol' && !s.vx) s.vx = num(speed, 2);
    });
    if (type === 'platform' || type === 'topdown' || type === 'beat') NX.gamepad();
  };
  NX.chase = function (name, target, speed) { eachTarget(name, function (s) { s.control = { type: 'chase', target: str(target), speed: num(speed, 2) }; }); };
  NX.jump = function (name, force) {
    eachTarget(name, function (s) {
      if (mode === '25d') { if (s.z <= 0) s.vz = num(force, 10); }
      else if (s.onGround || !s.gravity) { s.vy = -num(force, 12); s.onGround = false; }
    });
  };
  NX.onGround = function (name) { var s = sp(name); return !!(s && (mode === '25d' ? s.z <= 0 : s.onGround)); };

  function runControl(s) {
    var c = s.control, L = keys.left, R = keys.right, U = keys.up, D = keys.down, A = keys.space;
    if (c.type === 'platform') {
      s.vx = ((R ? 1 : 0) - (L ? 1 : 0)) * c.speed;
      if ((U || A) && s.onGround) { s.vy = -c.jump; s.onGround = false; NX.sound && soundOnce('saut'); }
    } else if (c.type === 'topdown') {
      s.vx = ((R ? 1 : 0) - (L ? 1 : 0)) * c.speed;
      s.vy = ((D ? 1 : 0) - (U ? 1 : 0)) * c.speed;
      if (scene && scene.pressed && !(L || R || U || D)) moveToward(s, NX.tapX, NX.tapY, c.speed);
    } else if (c.type === 'beat') {
      s.vx = ((R ? 1 : 0) - (L ? 1 : 0)) * c.speed;
      s.vy = ((D ? 1 : 0) - (U ? 1 : 0)) * c.speed * 0.6;
      if (A && s.z <= 0) s.vz = c.jump;
    } else if (c.type === 'follow') {
      if (scene && scene.pressed) moveToward(s, NX.tapX, NX.tapY, c.speed); else { s.vx = 0; s.vy = 0; }
    } else if (c.type === 'drag') {
      if (scene && scene.pressed) { s.x = NX.tapX; s.y = NX.tapY; }
    } else if (c.type === 'chase') {
      var t = sp(c.target);
      if (t) moveToward(s, t.x, t.y, c.speed); else { s.vx = 0; s.vy = s.gravity ? s.vy : 0; }
    } else if (c.type === 'patrol') {
      if (s.hitWall || s.x < s.size / 2 || s.x > world.w - s.size / 2) s.vx = -s.vx || c.speed;
      // Ne tombe pas des plateformes : demi-tour au bord du vide.
      if (s.gravity && s.onGround && !solidAt(s.x + Math.sign(s.vx) * s.size * 0.6, s.y + s.size * 0.6)) s.vx = -s.vx;
    } else if (c.type === 'wander') {
      if (Math.random() < 0.02 || s.hitWall) { var a = Math.random() * Math.PI * 2; s.vx = Math.cos(a) * c.speed; s.vy = Math.sin(a) * c.speed; }
    }
    if (s.vx > 0.1) s.flip = false; else if (s.vx < -0.1) s.flip = true;
  }
  function moveToward(s, x, y, speed) {
    var dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
    if (d < speed) { s.vx = 0; if (!s.gravity) s.vy = 0; return; }
    s.vx = dx / d * speed;
    if (!s.gravity) s.vy = dy / d * speed;
  }
  var lastSound = {};
  function soundOnce(n) { var now = Date.now(); if (!lastSound[n] || now - lastSound[n] > 150) { lastSound[n] = now; NX.sound(n); } }

  /* ---------- Physique : solides, gravité, rebonds ---------- */
  var solidList = [];
  function solidAt(x, y) {
    if (mode === 'maze') return mazeWall(x, y);
    for (var i = 0; i < solidList.length; i++) {
      var o = solidList[i], h = o.size / 2;
      if (x > o.x - h && x < o.x + h && y > o.y - h && y < o.y + h) return true;
    }
    return false;
  }
  function resolve(s, axis) {
    var h = s.size * 0.42;
    for (var i = 0; i < solidList.length; i++) {
      var o = solidList[i];
      if (o === s) continue;
      var oh = o.size / 2;
      // Tolérance de 2 px sur l'autre axe : marcher sur le sol ne compte pas comme toucher un mur.
      var ex = axis === 'y' ? 2 : 0, ey = axis === 'x' ? 2 : 0;
      if (Math.abs(s.x - o.x) >= h + oh - ex || Math.abs(s.y - o.y) >= h + oh - ey) continue;
      if (axis === 'x') {
        if (s.vx > 0) s.x = o.x - oh - h; else if (s.vx < 0) s.x = o.x + oh + h;
        s.vx = s.bounce ? -s.vx : 0; s.hitWall = true;
      } else {
        if (s.vy > 0) { s.y = o.y - oh - h; s.onGround = true; } else if (s.vy < 0) s.y = o.y + oh + h;
        s.vy = s.bounce ? -s.vy : 0;
      }
    }
  }
  function physics() {
    solidList = [];
    Object.keys(sprites).forEach(function (k) { if (sprites[k].solid) solidList.push(sprites[k]); });
    var W = world.w, H = world.h;
    Object.keys(sprites).forEach(function (k) {
      var s = sprites[k];
      if (!s || s.solid) return;
      s.hitWall = false;
      if (s.control) runControl(s);
      if (mode === 'maze') { mazeMove(s); return; }
      if (mode === '25d') {
        if (s.gravity || s.z > 0 || s.vz) { s.vz -= NX.gravity; s.z += s.vz; if (s.z <= 0) { s.z = 0; s.vz = 0; } }
        s.x += s.vx; s.y += s.vy;
        s.onGround = s.z <= 0;
      } else {
        if (s.gravity) s.vy = Math.min(s.vy + NX.gravity, 18);
        s.x += s.vx; if (solidList.length) resolve(s, 'x');
        s.onGround = false;
        s.y += s.vy; if (solidList.length) resolve(s, 'y');
      }
      var h = s.size / 2;
      if (s.control && /^(platform|topdown|beat|follow)$/.test(s.control.type)) s.x = Math.max(h, Math.min(W - h, s.x));
      if (s.bounce) {
        if (s.x < h || s.x > W - h) { s.vx = -s.vx; s.x = Math.max(h, Math.min(W - h, s.x)); }
        if (s.y < h || s.y > H - h) { s.vy = -s.vy; s.y = Math.max(h, Math.min(H - h, s.y)); }
      } else if (s.gravity && mode === '2d' && s.y > H - h && !s.autoDelete) {
        // Le bas du monde sert de sol si rien d'autre ne retient le sprite.
        if (!solidList.length) { s.y = H - h; s.vy = 0; s.onGround = true; }
      }
      if (s.autoDelete && (s.x < -200 || s.y < -200 || s.x > W + 200 || s.y > H + 200)) delete sprites[k];
      if (s.frames) { s.t++; s.look = s.frames[Math.floor(s.t / s.frameSpeed) % s.frames.length]; }
    });
    // Événements de collision (déclenchés une fois au contact).
    collides.forEach(function (c) {
      var now = {};
      Object.keys(sprites).forEach(function (ka) {
        var a = sprites[ka];
        if (!matches(a, c.a)) return;
        Object.keys(sprites).forEach(function (kb) {
          var b = sprites[kb];
          if (!b || !sprites[ka] || !matches(b, c.b) || !overlap(a, b)) return;
          var key = ka + '|' + kb;
          now[key] = true;
          if (!c.on[key]) { NX.self = ka; NX.other = kb; safe(c.fn); }
        });
      });
      c.on = now;
    });
  }

  /* ---------- Niveaux en texte ---------- */
  var DEFAULT_LEGEND = {
    '#': { look: '#6d4c41', group: 'mur', solid: true },
    '=': { look: '#43a047', group: 'sol', solid: true },
    'B': { look: '🧱', group: 'mur', solid: true },
    '*': { look: '⭐', group: 'piece' },
    'o': { look: '🪙', group: 'piece' },
    'E': { look: '👾', group: 'ennemi', control: 'patrol' },
    'M': { look: '👻', group: 'ennemi', control: 'wander' },
    '^': { look: '🔺', group: 'pic' },
    'D': { look: '🚪', group: 'sortie' },
    'K': { look: '🔑', group: 'cle' },
    'H': { look: '❤️', group: 'vie' },
    'T': { look: '🌳', group: 'decor', solid: true }
  };
  NX.legend = function (ch, look, group, solid) { legend[str(ch).charAt(0)] = { look: str(look), group: str(group), solid: !!solid }; };
  NX.level = function (text, tile) {
    needScene();
    var t = num(tile, 40);
    var rows = str(text).split(/\n|\|/).filter(function (r) { return r.length; });
    Object.keys(sprites).forEach(function (k) { if (sprites[k].fromLevel) delete sprites[k]; });
    var cols = 0;
    rows.forEach(function (row, r) {
      cols = Math.max(cols, row.length);
      row.split('').forEach(function (ch, c) {
        var x = c * t + t / 2, y = r * t + t / 2;
        if (ch === 'P') { NX.startX = x; NX.startY = y; var j = sp('joueur'); if (j) { j.x = x; j.y = y; } return; }
        var def = legend[ch] || DEFAULT_LEGEND[ch];
        if (!def) return;
        var name = (def.group || 'case') + '_' + r + '_' + c;
        NX.sprite(name, def.look, x, y, def.solid ? t : t * 0.8);
        var s = sp(name);
        s.group = def.group; s.solid = !!def.solid; s.fromLevel = true; s.layer = -1;
        if (def.control) { s.control = { type: def.control, speed: 1.5 }; s.gravity = def.control === 'patrol'; s.vx = 1.5; }
      });
    });
    world.w = Math.max(scene.W, cols * t);
    world.h = Math.max(scene.H, rows.length * t);
  };

  /* ---------- 2.5D ---------- */
  NX.mode25 = function (h, floor) { needScene(); mode = '25d'; horizon = num(h, scene.H * 0.4); if (floor) scene.floor = str(floor); };
  function depth(y) { return mode === '25d' ? 0.45 + 0.55 * Math.max(0, Math.min(1, (y - horizon) / Math.max(1, world.h - horizon))) : 1; }

  /* ---------- Labyrinthe 3D (raycasting) ---------- */
  var MAZE_COLORS = { '#': '#8d6e63', '1': '#e53935', '2': '#1e88e5', '3': '#43a047', '4': '#fdd835', 'B': '#b0503a' };
  NX.maze = function (text, sky, ground) {
    needScene();
    mode = 'maze';
    var rows = str(text).split(/\n|\|/).filter(function (r) { return r.length; });
    maze = { rows: rows, T: 64, a: 0, sky: str(sky || '#4fc3f7'), ground: str(ground || '#3e2723') };
    Object.keys(sprites).forEach(function (k) { if (sprites[k].fromLevel) delete sprites[k]; });
    var px = 96, py = 96;
    rows.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) {
        var x = c * 64 + 32, y = r * 64 + 32;
        if (ch === 'P') { px = x; py = y; return; }
        if (MAZE_COLORS[ch] || ch === '.' || ch === ' ') return;
        var def = legend[ch] || DEFAULT_LEGEND[ch];
        if (!def) return;
        var name = (def.group || 'objet') + '_' + r + '_' + c;
        NX.sprite(name, def.look, x, y, 40);
        var s = sp(name); s.group = def.group; s.fromLevel = true;
        if (def.control) s.control = { type: def.control === 'patrol' ? 'wander' : def.control, speed: 1 };
      });
    });
    world.w = (rows[0] || '').length * 64; world.h = rows.length * 64;
    NX.sprite('joueur', '', px, py, 30);
    NX.gamepad();
  };
  NX.minimap = function (on) { minimap = !!on; };
  NX.turn = function (deg) { if (maze) maze.a += num(deg) * Math.PI / 180; };
  function mazeWall(x, y) {
    if (!maze) return false;
    var r = maze.rows[Math.floor(y / 64)];
    if (!r) return true;
    var ch = r.charAt(Math.floor(x / 64));
    return !!MAZE_COLORS[ch];
  }
  function mazeMove(s) {
    if (s.name === 'joueur' && maze) {
      var sp2 = 3.2;
      if (keys.left) maze.a -= 0.05;
      if (keys.right) maze.a += 0.05;
      var f = (keys.up || keys.space ? 1 : 0) - (keys.down ? 1 : 0);
      if (scene && scene.pressed) {
        if (NX.screenX < scene.W * 0.3) maze.a -= 0.05;
        else if (NX.screenX > scene.W * 0.7) maze.a += 0.05;
        else f = NX.screenY > scene.H * 0.7 ? -1 : 1;
      }
      s.vx = Math.cos(maze.a) * sp2 * f; s.vy = Math.sin(maze.a) * sp2 * f;
    }
    var r = s.size * 0.4;
    if (!mazeWall(s.x + s.vx + Math.sign(s.vx) * r, s.y)) s.x += s.vx; else { s.hitWall = true; if (s.bounce) s.vx = -s.vx; }
    if (!mazeWall(s.x, s.y + s.vy + Math.sign(s.vy) * r)) s.y += s.vy; else { s.hitWall = true; if (s.bounce) s.vy = -s.vy; }
    if (s.frames) { s.t++; s.look = s.frames[Math.floor(s.t / s.frameSpeed) % s.frames.length]; }
  }
  function renderMaze(g, W, H) {
    var p = sp('joueur'); if (!p) return;
    var fov = Math.PI / 3, step = 2, zbuf = [];
    g.fillStyle = maze.sky; g.fillRect(0, 0, W, H / 2);
    g.fillStyle = maze.ground; g.fillRect(0, H / 2, W, H / 2);
    for (var col = 0; col < W; col += step) {
      var ang = maze.a - fov / 2 + fov * col / W;
      var dx = Math.cos(ang), dy = Math.sin(ang);
      // DDA dans la grille de 64 px
      var mx = Math.floor(p.x / 64), my = Math.floor(p.y / 64);
      var ddx = Math.abs(1 / (dx || 1e-9)), ddy = Math.abs(1 / (dy || 1e-9));
      var sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
      var sdx = (dx < 0 ? (p.x / 64 - mx) : (mx + 1 - p.x / 64)) * ddx;
      var sdy = (dy < 0 ? (p.y / 64 - my) : (my + 1 - p.y / 64)) * ddy;
      var side = 0, ch = '', n = 0;
      while (n++ < 64) {
        if (sdx < sdy) { sdx += ddx; mx += sx; side = 0; } else { sdy += ddy; my += sy; side = 1; }
        var row = maze.rows[my];
        ch = row ? row.charAt(mx) : '#';
        if (!row || mx < 0 || MAZE_COLORS[ch]) break;
      }
      var dist = (side === 0 ? sdx - ddx : sdy - ddy) * 64;
      var perp = Math.max(1, dist * Math.cos(ang - maze.a));
      zbuf[col] = perp;
      var h = Math.min(H * 4, 64 * H / perp * 0.9);
      g.fillStyle = MAZE_COLORS[ch] || '#8d6e63';
      g.fillRect(col, H / 2 - h / 2, step, h);
      var shade = Math.min(0.8, perp / 900) + (side ? 0.15 : 0);
      g.fillStyle = 'rgba(0,0,0,' + shade + ')';
      g.fillRect(col, H / 2 - h / 2, step, h);
    }
    // Objets et ennemis en "billboards", du plus loin au plus proche.
    var list = Object.keys(sprites).map(function (k) { return sprites[k]; }).filter(function (s) { return s !== p && s.visible && s.look; });
    list.forEach(function (s) { s._d = Math.hypot(s.x - p.x, s.y - p.y); });
    list.sort(function (a, b) { return b._d - a._d; });
    list.forEach(function (s) {
      var a = Math.atan2(s.y - p.y, s.x - p.x) - maze.a;
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      if (Math.abs(a) > fov / 2 + 0.3) return;
      var perp = s._d * Math.cos(a);
      if (perp < 8) return;
      var sx = W / 2 + Math.tan(a) / Math.tan(fov / 2) * W / 2;
      var size = s.size / 40 * 48 * H / perp;
      var c = Math.max(0, Math.min(W - 1, Math.round(sx / step) * step));
      if (zbuf[c] !== undefined && zbuf[c] < perp) return;
      drawLook(g, s.look, sx, H / 2 + size * 0.25, size, false);
    });
    if (minimap) {
      var m = 5;
      g.globalAlpha = 0.8;
      maze.rows.forEach(function (row, r) {
        row.split('').forEach(function (ch, c) { if (MAZE_COLORS[ch]) { g.fillStyle = MAZE_COLORS[ch]; g.fillRect(8 + c * m, 48 + r * m, m, m); } });
      });
      g.fillStyle = '#ff0'; g.fillRect(8 + p.x / 64 * m - 2, 48 + p.y / 64 * m - 2, 4, 4);
      g.globalAlpha = 1;
    }
  }

  /* ---------- Particules ---------- */
  NX.particles = function (x, y, look, count) {
    var n = Math.min(200, num(count, 20));
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 5;
      particles.push({ x: num(x), y: num(y), vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 30 + Math.random() * 30, look: str(look || '#ffcc22') });
    }
  };
  NX.explodeAt = function (name, look) { var s = sp(name); if (s) NX.particles(s.x, s.y - s.z, look || '#ff9800', 30); };

  /* ---------- Dessin ---------- */
  NX.draw = function (shape, a, b, c, d, color) {
    needScene();
    var g = scene.pctx;
    g.fillStyle = g.strokeStyle = str(color || '#fff');
    g.lineWidth = 4;
    if (shape === 'rect') g.fillRect(num(a), num(b), num(c), num(d));
    else if (shape === 'circle') { g.beginPath(); g.arc(num(a), num(b), Math.abs(num(c)), 0, Math.PI * 2); g.fill(); }
    else if (shape === 'line') { g.beginPath(); g.moveTo(num(a), num(b)); g.lineTo(num(c), num(d)); g.stroke(); }
  };
  NX.drawText = function (t, x, y, size, color) {
    needScene();
    var g = scene.pctx;
    g.fillStyle = str(color || '#fff');
    g.font = 'bold ' + num(size, 24) + 'px sans-serif';
    g.textAlign = 'center';
    g.fillText(str(t), num(x), num(y));
  };
  NX.clearDrawing = function () { if (scene) scene.pctx.clearRect(0, 0, scene.paint.width, scene.paint.height); };

  // Rendu d'un emoji / image / couleur, avec cache (beaucoup plus rapide sur téléphone).
  function cached(look, size) {
    var px = Math.max(4, Math.round(size));
    var key = look + '|' + px;
    if (imgCache[key]) return imgCache[key];
    var c = document.createElement('canvas');
    c.width = c.height = Math.ceil(px * 1.25);
    var g = c.getContext('2d');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = px + 'px sans-serif';
    g.fillText(look, c.width / 2, c.height / 2 + px * 0.06);
    if (Object.keys(imgCache).length > 600) imgCache = {};
    return (imgCache[key] = c);
  }
  function drawLook(g, look, x, y, size, flip) {
    if (!look) return;
    if (isColor(look)) {
      g.fillStyle = look;
      g.fillRect(x - size / 2, y - size / 2, size, size);
      g.fillStyle = 'rgba(255,255,255,.12)';
      g.fillRect(x - size / 2, y - size / 2, size, size * 0.18);
      return;
    }
    if (flip) { g.save(); g.translate(x, y); g.scale(-1, 1); x = 0; y = 0; }
    if (isImage(look)) {
      var im = imgCache['img:' + look];
      if (!im) { im = imgCache['img:' + look] = new Image(); im.src = look; }
      if (im.complete && im.naturalWidth) {
        var r = im.naturalHeight / im.naturalWidth;
        g.drawImage(im, x - size / 2, y - size * r / 2, size, size * r);
      }
    } else {
      var px = Math.max(4, Math.round(size / 4) * 4);
      var c = cached(look, px), dw = c.width * size / px;
      g.drawImage(c, x - dw / 2, y - dw / 2, dw, dw);
    }
    if (flip) g.restore();
  }

  /* ---------- Clavier + manette tactile ---------- */
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
      el.addEventListener('touchcancel', off, { passive: false });
      el.addEventListener('mousedown', on);
      el.addEventListener('mouseup', off);
      el.addEventListener('mouseleave', off);
      pad.appendChild(el);
    });
    document.body.appendChild(pad);
    document.body.classList.add('nx-has-pad');
  };

  /* ---------- Boucle principale ---------- */
  function render() {
    var g = scene.ctx, W = scene.W, H = scene.H;
    if (mode === 'maze') { renderMaze(g, W, H); drawOverlay(g, W, H); return; }
    var f = cam.follow && sp(cam.follow);
    if (f) {
      cam.x += ((f.x - W / 2) - cam.x) * 0.15;
      cam.y += ((f.y - H / 2) - cam.y) * 0.15;
    }
    cam.x = Math.max(0, Math.min(world.w - W, cam.x));
    cam.y = Math.max(0, Math.min(world.h - H, cam.y));
    var ox = cam.x, oy = cam.y;
    if (shakeT > 0) { shakeT--; ox += (Math.random() - 0.5) * shakeA; oy += (Math.random() - 0.5) * shakeA; }

    if (scene.gradient) {
      var gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, scene.gradient[0]); gr.addColorStop(1, scene.gradient[1]);
      g.fillStyle = gr;
    } else g.fillStyle = scene.color;
    g.fillRect(0, 0, W, H);
    if (mode === '25d') {
      g.fillStyle = scene.floor;
      g.fillRect(0, horizon - oy, W, H);
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
      for (var lx = -W; lx < W * 2; lx += 60) { g.beginPath(); g.moveTo(W / 2 + (lx - W / 2 - ox % 60) * 0.3, horizon - oy); g.lineTo(lx - ox % 60, H); g.stroke(); }
    }
    scene.bg.forEach(function (b) {
      var im = imgCache['img:' + b.src];
      if (!im) { im = imgCache['img:' + b.src] = new Image(); im.src = b.src; }
      if (!im.complete || !im.naturalWidth) return;
      var w = im.naturalWidth * H / im.naturalHeight, start = -((ox * b.speed) % w);
      for (var x = start; x < W; x += w) g.drawImage(im, x, 0, w, H);
    });
    g.drawImage(scene.paint, 0, 0);

    var list = Object.keys(sprites).map(function (k) { return sprites[k]; });
    if (mode === '25d') list.sort(function (a, b) { return a.y - b.y; });
    else list.sort(function (a, b) { return a.layer - b.layer || a.id - b.id; });
    list.forEach(function (s) {
      if (!s.visible) return;
      var k = depth(s.y), size = s.size * k;
      var x = s.x - ox, y = s.y - oy;
      if (x < -size || x > W + size || y < -size - s.z || y > H + size) return;
      if (mode === '25d') {
        g.fillStyle = 'rgba(0,0,0,.3)';
        g.beginPath(); g.ellipse(x, y + size * 0.42, size * 0.35, size * 0.1, 0, 0, Math.PI * 2); g.fill();
        y -= s.z * k;
      }
      g.save();
      g.globalAlpha = Math.max(0, Math.min(1, s.opacity));
      if (s.angle) { g.translate(x, y); g.rotate(s.angle * Math.PI / 180); x = 0; y = 0; }
      drawLook(g, s.look, x, y, size, s.flip);
      g.restore();
      if (s.label) {
        g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff';
        g.fillText(s.label, s.x - ox, y - size / 2 - (s.bar ? 14 : 4));
      }
      if (s.bar) {
        var bw = Math.max(30, size), bx = s.x - ox - bw / 2, by = y - size / 2 - 10;
        g.fillStyle = '#0008'; g.fillRect(bx, by, bw, 6);
        var r = Math.max(0, Math.min(1, s.bar.v / s.bar.max));
        g.fillStyle = r > 0.5 ? '#43a047' : r > 0.25 ? '#fdd835' : '#e53935';
        g.fillRect(bx, by, bw * r, 6);
      }
    });
    particles.forEach(function (p) {
      if (isColor(p.look)) { g.fillStyle = p.look; g.globalAlpha = Math.min(1, p.life / 30); g.fillRect(p.x - ox - 3, p.y - oy - 3, 6, 6); g.globalAlpha = 1; }
      else drawLook(g, p.look, p.x - ox, p.y - oy, 18, false);
    });
    drawOverlay(g, W, H);
  }
  function drawOverlay(g, W) {
    if (scene.hud) {
      g.font = 'bold 20px sans-serif';
      g.textAlign = 'left';
      g.textBaseline = 'top';
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(0, 0, W, 38);
      g.fillStyle = '#fff';
      g.fillText(scene.hud, 12, 9);
      g.textBaseline = 'alphabetic';
    }
    if (paused) {
      g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, 0, W, scene.H);
      g.fillStyle = '#fff'; g.font = 'bold 36px sans-serif'; g.textAlign = 'center';
      g.fillText('⏸ PAUSE', W / 2, scene.H / 2);
    }
  }

  function frame() {
    try {
      if (!paused) {
        loops.slice().forEach(function (fn) { safe(fn); });
        if (scene && !frozen) physics();
        particles = particles.filter(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; return --p.life > 0; });
      }
      if (scene) render();
    } catch (e) { NX.error(e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ==========================================================
   *  Vraies applications : écrans, navigation, données.
   * ========================================================== */
  var pages = {}, pageOrder = [], pageHistory = [], currentPage = '', pageMark = null, tabSpec = null;
  NX.page = function (name, fn) {
    name = str(name);
    pages[name] = fn;
    pageOrder.push(name);
    if (pageOrder.length === 1) setTimeout(function () { if (!currentPage) NX.goPage(name); }, 0);
  };
  function leavePage() {
    if (!pageMark) return;
    // Arrête ce que l'écran précédent avait démarré (minuteurs, boucles, jeu…).
    timers.splice(pageMark.timers).forEach(function (t) { clearTimeout(t); clearInterval(t); });
    loops.splice(pageMark.loops);
    keyHandlers.splice(pageMark.keys);
    tapHandlers.splice(pageMark.taps);
    collides.splice(pageMark.collides);
    if (scene && scene !== pageMark.scene) {
      scene = pageMark.scene; sprites = {}; particles = []; mode = '2d'; maze = null; cam.follow = ''; paused = false;
      var pad = document.getElementById('nx-pad'); if (pad) pad.remove();
      document.body.classList.remove('nx-has-pad');
    }
  }
  NX.goPage = function (name, noHistory) {
    name = str(name);
    if (!pages[name]) return NX.error('Écran inconnu : ' + name);
    leavePage();
    frozen = false;
    if (!noHistory && currentPage && currentPage !== name) pageHistory.push(currentPage);
    currentPage = name;
    app.innerHTML = '';
    target = app;
    window.scrollTo(0, 0);
    pageMark = { timers: timers.length, loops: loops.length, keys: keyHandlers.length, taps: tapHandlers.length, collides: collides.length, scene: scene };
    updateBars();
    app.classList.remove('nx-page-in'); void app.offsetWidth; app.classList.add('nx-page-in');
    safe(pages[name]);
  };
  NX.back = function () { if (pageHistory.length) NX.goPage(pageHistory.pop(), true); };
  NX.currentPage = function () { return currentPage; };
  // Retour Android dans une app exportée : revient à l'écran précédent.
  if (!window.nxOnBack) window.nxOnBack = function () { if (pageHistory.length) { NX.back(); return true; } return false; };

  NX.appBar = function (title, color) {
    var bar = document.getElementById('nx-appbar');
    if (!bar) {
      bar = document.createElement('header');
      bar.id = 'nx-appbar';
      bar.innerHTML = '<button class="nx-back" aria-label="Retour">←</button><span class="nx-title"></span>';
      bar.firstChild.onclick = function () { NX.back(); };
      document.body.insertBefore(bar, document.body.firstChild);
      document.body.classList.add('nx-has-appbar');
    }
    bar.querySelector('.nx-title').textContent = str(title);
    if (color) bar.style.background = str(color);
    updateBars();
  };
  NX.tabBar = function (spec) {
    var items = (Array.isArray(spec) ? spec : str(spec).split(',')).map(function (s) {
      var p = str(s).split(':');
      return { page: p[0].trim(), icon: (p[1] || '•').trim() };
    }).filter(function (i) { return i.page; });
    var bar = document.getElementById('nx-tabbar');
    if (!bar) { bar = document.createElement('nav'); bar.id = 'nx-tabbar'; document.body.appendChild(bar); document.body.classList.add('nx-has-tabbar'); }
    bar.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.innerHTML = '<i></i><span></span>';
      b.firstChild.textContent = it.icon; b.lastChild.textContent = it.page;
      b.dataset.page = it.page;
      b.onclick = function () { pageHistory = []; NX.goPage(it.page, true); };
      bar.appendChild(b);
    });
    tabSpec = items;
    updateBars();
  };
  function updateBars() {
    var back = document.querySelector('#nx-appbar .nx-back');
    if (back) back.style.visibility = pageHistory.length ? 'visible' : 'hidden';
    Array.prototype.forEach.call(document.querySelectorAll('#nx-tabbar button'), function (b) { b.classList.toggle('on', b.dataset.page === currentPage); });
  }

  NX.card = function (img, title, text, fn, id) {
    var c = document.createElement('div');
    c.className = 'nx-card nx-tapcard';
    if (img) { var i = document.createElement('img'); i.src = str(img); c.appendChild(i); }
    var body = document.createElement('div');
    var h = document.createElement('h3'); h.textContent = str(title); body.appendChild(h);
    if (text !== '' && text !== undefined) { var p = document.createElement('p'); p.textContent = str(text); body.appendChild(p); }
    c.appendChild(body);
    if (typeof fn === 'function') c.onclick = function () { safe(fn); };
    return add(c, id);
  };
  NX.badge = function (t, color) {
    var s = document.createElement('span'); s.className = 'nx-badge'; s.textContent = str(t);
    if (color) s.style.background = str(color);
    return add(s);
  };
  NX.progress = function (id, value, max) {
    var el = byId(id);
    if (!el) { el = document.createElement('progress'); el.className = 'nx-progress'; add(el, id); }
    el.max = num(max, 100); el.value = num(value);
  };
  NX.onEnter = function (id, fn) { var el = byId(id); if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') safe(fn); }); };
  NX.animateEl = function (id, effect) {
    var el = id === 'page' ? app : byId(id); if (!el) return;
    el.classList.remove('nx-fx-' + effect); void el.offsetWidth; el.classList.add('nx-fx-' + effect);
  };
  var THEMES = {
    clair: ['#f6f7fb', '#16161d', '#ffcc22', '#111'], sombre: ['#101018', '#f2f2f7', '#ffcc22', '#111'],
    neon: ['#0a0018', '#f0e6ff', '#ff2bd6', '#fff'], ocean: ['#e6f4ff', '#0b2540', '#1e88e5', '#fff'],
    foret: ['#eef7ee', '#123a1a', '#43a047', '#fff'], bonbon: ['#fff0f6', '#4a1030', '#ec407a', '#fff'],
    retro: ['#1d2b53', '#fff1e8', '#ff004d', '#fff']
  };
  NX.theme = function (name) {
    var t = THEMES[str(name)] || THEMES.clair;
    document.body.style.background = t[0];
    document.body.style.color = t[1];
    document.documentElement.style.setProperty('--nx-accent', t[2]);
    document.documentElement.style.setProperty('--nx-accent-ink', t[3]);
  };

  // Objets (fiches avec des propriétés)
  NX.obj = function () {
    var o = {};
    for (var i = 0; i + 1 < arguments.length; i += 2) if (str(arguments[i])) o[str(arguments[i])] = arguments[i + 1];
    return o;
  };
  NX.setProp = function (o, k, v) { if (o && typeof o === 'object') o[str(k)] = v; return o; };
  NX.keys = function (o) { return o && typeof o === 'object' ? Object.keys(o) : []; };

  // Base de données locale (collections sauvegardées dans le téléphone)
  function coll(n) { var v = NX.load('db:' + n, []); return Array.isArray(v) ? v : []; }
  function saveColl(n, v) { NX.save('db:' + n, v); }
  NX.dbAdd = function (n, item) { var c = coll(n); if (item && typeof item === 'object' && !Array.isArray(item)) item = Object.assign({ _date: new Date().toLocaleString('fr-FR') }, item); c.push(item); saveColl(n, c); };
  NX.dbAll = function (n) { return coll(n); };
  NX.dbCount = function (n) { return coll(n).length; };
  NX.dbRemove = function (n, i) { var c = coll(n); c.splice(num(i) - 1, 1); saveColl(n, c); };
  NX.dbUpdate = function (n, i, k, v) { var c = coll(n), it = c[num(i) - 1]; if (it && typeof it === 'object') { it[str(k)] = v; saveColl(n, c); } };
  NX.dbClear = function (n) { saveColl(n, []); };
  NX.dbFind = function (n, k, v) {
    var q = str(v).toLowerCase();
    return coll(n).filter(function (it) { return str(it && typeof it === 'object' ? it[str(k)] : it).toLowerCase().indexOf(q) >= 0; });
  };
  NX.sortBy = function (list, k, desc) {
    var l = (Array.isArray(list) ? list : []).slice();
    l.sort(function (a, b) {
      var x = a && typeof a === 'object' ? a[str(k)] : a, y = b && typeof b === 'object' ? b[str(k)] : b;
      var r = (typeof x === 'number' && typeof y === 'number') ? x - y : str(x).localeCompare(str(y));
      return desc ? -r : r;
    });
    return l;
  };

  NX.table = function (id, list) {
    var t = byId(id);
    if (!t) { t = document.createElement('table'); t.className = 'nx-table'; add(t, id); }
    list = Array.isArray(list) ? list : [];
    var cols = [];
    list.forEach(function (r) { if (r && typeof r === 'object' && !Array.isArray(r)) Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_' && cols.indexOf(k) < 0) cols.push(k); }); });
    var html = '';
    if (cols.length) html += '<tr><th>#</th>' + cols.map(function (c) { return '<th>' + escHtml(c) + '</th>'; }).join('') + '</tr>';
    list.forEach(function (r, i) {
      html += '<tr data-index="' + (i + 1) + '"><td>' + (i + 1) + '</td>';
      if (cols.length && r && typeof r === 'object' && !Array.isArray(r)) html += cols.map(function (c) { return '<td>' + escHtml(str(r[c])) + '</td>'; }).join('');
      else html += (Array.isArray(r) ? r : [r]).map(function (c) { return '<td>' + escHtml(str(c)) + '</td>'; }).join('');
      html += '</tr>';
    });
    t.innerHTML = html || '<tr><td>(vide)</td></tr>';
    t.onclick = function (e) {
      var tr = e.target.closest('tr[data-index]');
      if (tr && t._fn) { NX.clickedIndex = Number(tr.dataset.index); NX.clickedItem = list[NX.clickedIndex - 1]; safe(t._fn); }
    };
  };
  NX.onTableClick = function (id, fn) { var t = byId(id); if (!t) { NX.table(id, []); t = byId(id); } t._fn = fn; };
  function escHtml(s) { return str(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  NX.chart = function (id, type, values, labels) {
    var c = byId(id);
    if (!c) { c = document.createElement('canvas'); c.className = 'nx-chart'; c.width = 640; c.height = 360; add(c, id); }
    var g = c.getContext('2d'), W = c.width, H = c.height;
    var v = (Array.isArray(values) ? values : str(values).split(',')).map(function (x) { return num(x); });
    var l = Array.isArray(labels) ? labels : str(labels).split(',');
    var colors = ['#ffcc22', '#1e88e5', '#e53935', '#43a047', '#8e24aa', '#fb8c00', '#00bcd4', '#ec407a'];
    g.clearRect(0, 0, W, H);
    g.font = '18px sans-serif'; g.textAlign = 'center';
    var max = Math.max.apply(null, v.concat([1]));
    if (type === 'pie') {
      var total = v.reduce(function (a, b) { return a + Math.max(0, b); }, 0) || 1, a0 = -Math.PI / 2;
      v.forEach(function (x, i) {
        var a1 = a0 + Math.max(0, x) / total * Math.PI * 2;
        g.fillStyle = colors[i % colors.length];
        g.beginPath(); g.moveTo(W / 3, H / 2); g.arc(W / 3, H / 2, H * 0.42, a0, a1); g.fill();
        g.fillRect(W * 0.68, 30 + i * 30, 18, 18);
        g.fillStyle = '#888'; g.textAlign = 'left';
        g.fillText(str(l[i] || '') + ' (' + x + ')', W * 0.68 + 26, 46 + i * 30);
        a0 = a1;
      });
      return;
    }
    var n = v.length || 1, bw = (W - 60) / n;
    g.strokeStyle = '#8884'; g.beginPath(); g.moveTo(40, 10); g.lineTo(40, H - 40); g.lineTo(W - 10, H - 40); g.stroke();
    g.fillStyle = '#888'; g.textAlign = 'right'; g.fillText(String(max), 36, 22);
    g.textAlign = 'center';
    v.forEach(function (x, i) {
      var h = (H - 60) * x / max, cx = 50 + i * bw + bw / 2;
      if (type === 'line') {
        g.strokeStyle = colors[1]; g.lineWidth = 4;
        if (i) { var px = 50 + (i - 1) * bw + bw / 2, ph = (H - 60) * v[i - 1] / max; g.beginPath(); g.moveTo(px, H - 40 - ph); g.lineTo(cx, H - 40 - h); g.stroke(); }
        g.fillStyle = colors[1]; g.beginPath(); g.arc(cx, H - 40 - h, 6, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = colors[i % colors.length];
        g.fillRect(cx - bw * 0.35, H - 40 - h, bw * 0.7, h);
      }
      g.fillStyle = '#888'; g.fillText(str(l[i] === undefined ? '' : l[i]), cx, H - 16);
    });
  };

  NX.post = function (url, data, fn) {
    fetch(str(url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.text(); })
      .then(function (t) { try { NX.result = JSON.parse(t); } catch (e) { NX.result = t; } safe(fn); })
      .catch(function (e) { NX.error('Internet : ' + e.message); });
  };
  NX.format = function (n, d) { return Number(num(n)).toLocaleString('fr-FR', { minimumFractionDigits: num(d), maximumFractionDigits: num(d) }); };
  NX.countdown = function (sec, id, fn) {
    var left = num(sec, 10);
    NX.setText(id, left);
    var t = setInterval(function () {
      left--;
      NX.setText(id, left);
      if (left <= 0) { clearInterval(t); safe(fn); }
    }, 1000);
    timers.push(t);
  };

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
