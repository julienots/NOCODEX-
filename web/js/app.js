/*
 * NOCODEX — logique du studio : onglets, espace de blocs, projets, aperçu,
 * code multi-langage, apprentissage et exports (HTML, ZIP, APK, projet).
 */
(function () {
  'use strict';

  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var native = window.NXNative || null;
  var KEY = 'nocodex.studio.';
  var ws = null;            // espace de travail Blockly principal
  var project = null;       // projet ouvert
  var dirty = true;         // l'aperçu doit être relancé
  var currentLang = 'js';
  var currentMine = 'html';
  var consoleErrors = 0;

  /* =================== Utilitaires =================== */
  function esc(s) { return String(s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function store(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); return true; } catch (e) { toast('⚠️ Mémoire pleine : exporte puis supprime d\'anciens projets'); return false; } }
  function load(k, def) { try { var v = localStorage.getItem(KEY + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function remove(k) { try { localStorage.removeItem(KEY + k); } catch (e) {} }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function slug(s) { return String(s || 'app').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'app'; }
  function dateFr(ts) { return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function bytesToB64(bytes) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(s);
  }
  function b64ToBytes(b64) {
    var s = atob(b64), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b;
  }
  function utf8(s) { return new TextEncoder().encode(s); }

  /* =================== Fenêtre & navigation =================== */
  function openModal(html, onOpen) {
    $('#modal-body').innerHTML = html;
    $('#modal').hidden = false;
    $('.modal-card').scrollTop = 0;
    if (onOpen) onOpen($('#modal-body'));
  }
  function closeModal() {
    $('#modal').hidden = true;
    $('#modal-body').innerHTML = '';
    if (miniWs) { miniWs.dispose(); miniWs = null; }
  }
  $('.modal-close').onclick = closeModal;
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });

  function ask(title, value, cb) {
    openModal('<h2>' + esc(title) + '</h2><div class="field"><input type="text" id="ask-input" value="' + esc(value) + '"></div>' +
      '<div class="row"><button class="btn primary" id="ask-ok">Valider</button></div>', function (b) {
      var i = $('#ask-input', b);
      setTimeout(function () { i.focus(); i.select(); }, 50);
      function ok() { var v = i.value.trim(); closeModal(); if (v) cb(v); }
      $('#ask-ok', b).onclick = ok;
      i.onkeydown = function (e) { if (e.key === 'Enter') ok(); };
    });
  }
  function confirmBox(title, text, okLabel, cb, danger) {
    openModal('<h2>' + esc(title) + '</h2><p>' + text + '</p><div class="row"><button class="btn" id="cf-no">Annuler</button>' +
      '<button class="btn ' + (danger ? 'danger' : 'primary') + '" id="cf-ok">' + esc(okLabel) + '</button></div>', function (b) {
      $('#cf-no', b).onclick = closeModal;
      $('#cf-ok', b).onclick = function () { closeModal(); cb(); };
    });
  }

  var currentTab = 'blocks';
  function showTab(name) {
    currentTab = name;
    $$('.tab').forEach(function (t) { t.classList.toggle('active', t.id === 'tab-' + name); });
    $$('.nav').forEach(function (n) { n.classList.toggle('active', n.dataset.tab === name); });
    if (name === 'blocks' && ws) setTimeout(function () { Blockly.svgResize(ws); }, 0);
    if (name === 'code') renderCode();
    if (name === 'preview' && dirty) run();
    if (name === 'projects') renderProjects();
  }
  $$('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });

  // Bouton retour Android
  window.nxOnBack = function () {
    if (!$('#tour').hidden) { endTour(); return true; }
    if (!$('#modal').hidden) { closeModal(); return true; }
    if ($('#tab-preview').classList.contains('full')) { exitFull(); return true; }
    if (currentTab !== 'blocks') { showTab('blocks'); return true; }
    return false;
  };

  /* =================== Blockly =================== */
  var theme = Blockly.Theme.defineTheme('nocodex', {
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: '#101016',
      toolboxBackgroundColour: '#08080b',
      toolboxForegroundColour: '#f0f0f5',
      flyoutBackgroundColour: '#1a1a23',
      flyoutForegroundColour: '#ddd',
      flyoutOpacity: 0.98,
      scrollbarColour: '#ffcc22',
      scrollbarOpacity: 0.35,
      insertionMarkerColour: '#ffcc22',
      insertionMarkerOpacity: 0.4,
      cursorColour: '#ffcc22'
    },
    fontStyle: { family: 'system-ui, sans-serif', weight: '600', size: 11 },
    startHats: true
  });

  var GENS = {
    js: { name: 'JavaScript', ext: 'js', gen: function () { return Blockly.JavaScript; }, hl: 'javascript' },
    py: { name: 'Python', ext: 'py', gen: function () { return Blockly.Python; }, hl: 'python' },
    php: { name: 'PHP', ext: 'php', gen: function () { return Blockly.PHP; }, hl: 'php' },
    lua: { name: 'Lua', ext: 'lua', gen: function () { return Blockly.Lua; }, hl: 'lua' },
    dart: { name: 'Dart', ext: 'dart', gen: function () { return Blockly.Dart; }, hl: 'dart' },
    html: { name: 'HTML complet', ext: 'html', hl: 'xml' }
  };

  function initBlockly() {
    NXBlocks.register();
    Blockly.Msg.NEW_VARIABLE = '➕ Créer une variable…';
    ws = Blockly.inject('blockly', {
      toolbox: NXBlocks.toolbox(),
      renderer: 'zelos',
      theme: theme,
      media: 'vendor/media/',
      grid: { spacing: 28, length: 2, colour: '#23232e', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.72, maxScale: 2.2, minScale: 0.25, scaleSpeed: 1.15, pinch: true },
      trashcan: true,
      move: { scrollbars: true, drag: true, wheel: false },
      sounds: true,
      oneBasedIndex: true
    });
    ws.addChangeListener(function (e) {
      if (e.isUiEvent || !project || loadingProject) return;
      dirty = true;
      saveSoon();
      if (!$('#live-code').hidden) liveSoon();
    });
    window.addEventListener('resize', function () { Blockly.svgResize(ws); });
    // Catégories compactes : l'emoji au-dessus du nom (gain de place sur téléphone).
    $$('.blocklyToolboxCategoryLabel').forEach(function (l) {
      var m = l.textContent.match(/^(\S+)\s+(.*)$/);
      if (m) l.innerHTML = '<span class="ci">' + esc(m[1]) + '</span><span>' + esc(m[2]) + '</span>';
    });
    Blockly.svgResize(ws);
  }

  function generate(lang) {
    var g = GENS[lang].gen();
    try { return g.workspaceToCode(ws); } catch (e) { return '// Erreur de génération : ' + e.message; }
  }

  /* =================== Projets =================== */
  var loadingProject = false;

  function projectIndex() { return load('projects', []); }
  function saveIndex(list) { store('projects', list); }

  function newProjectData(name, templateId) {
    var tpl = NXTemplates.byId(templateId || 'vide');
    return {
      id: uid(), name: name, created: Date.now(), updated: Date.now(),
      xml: tpl.xml(), blocks: null,
      custom: tpl.custom ? JSON.parse(JSON.stringify(tpl.custom)) : { html: '', css: '', js: '' },
      settings: { appName: name, icon: null, version: '1.0' },
      media: {}
    };
  }
  window.NXMediaNames = function () { return project && project.media ? Object.keys(project.media) : []; };

  function saveProject() {
    if (!project || !ws) return;
    project.blocks = Blockly.serialization.workspaces.save(ws);
    project.xml = null;
    project.updated = Date.now();
    store('project.' + project.id, project);
    var list = projectIndex().filter(function (p) { return p.id !== project.id; });
    list.unshift({ id: project.id, name: project.name, updated: project.updated, icon: project.settings.icon });
    saveIndex(list);
    store('current', project.id);
  }
  var saveSoon = debounce(saveProject, 500);

  function openProject(p) {
    project = p;
    project.custom = project.custom || { html: '', css: '', js: '' };
    project.settings = project.settings || { appName: project.name, icon: null, version: '1.0' };
    project.media = project.media || {};
    loadingProject = true;
    ws.clear();
    try {
      if (p.blocks) Blockly.serialization.workspaces.load(p.blocks, ws);
      else if (p.xml) Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(p.xml), ws);
    } catch (e) {
      toast('⚠️ Projet partiellement chargé : ' + e.message);
    }
    loadingProject = false;
    ws.clearUndo();
    setTimeout(function () { ws.scrollCenter(); ws.scroll(20, 20); }, 50);
    $('#project-name').textContent = p.name;
    $('#mine-editor').value = project.custom[currentMine] || '';
    dirty = true;
    saveProject();
  }

  function createProject(name, templateId) {
    var p = newProjectData(name, templateId);
    openProject(p);
    showTab('blocks');
    toast('Projet « ' + name + ' » créé ✨');
  }

  function loadProjectById(id) {
    var p = load('project.' + id, null);
    if (!p) { toast('Projet introuvable'); return; }
    openProject(p);
  }

  function renderProjects() {
    var list = projectIndex();
    $('#project-list').innerHTML = list.length ? list.map(function (p) {
      return '<div class="proj' + (project && p.id === project.id ? ' current' : '') + '" data-id="' + p.id + '">' +
        '<img src="' + (p.icon || 'img/default-app-icon.png') + '" alt="">' +
        '<div class="meta"><b>' + esc(p.name) + '</b><small>' + (project && p.id === project.id ? '● ouvert · ' : '') + dateFr(p.updated) + '</small></div>' +
        '<div class="acts"><button class="btn small" data-act="open">Ouvrir</button><button class="btn small" data-act="more">⋯</button></div></div>';
    }).join('') : '<p class="info">Aucun projet pour l\'instant.</p>';
    $$('#project-list .proj').forEach(function (el) {
      var id = el.dataset.id;
      $('[data-act=open]', el).onclick = function () { loadProjectById(id); showTab('blocks'); };
      $('[data-act=more]', el).onclick = function () { projectMenu(id); };
    });
  }

  function projectMenu(id) {
    var meta = projectIndex().filter(function (p) { return p.id === id; })[0];
    openModal('<h2>' + esc(meta.name) + '</h2>' +
      '<button class="export-opt" data-a="rename"><span class="ic">✏️</span><span><b>Renommer</b></span></button>' +
      '<button class="export-opt" data-a="dup"><span class="ic">📑</span><span><b>Dupliquer</b></span></button>' +
      '<button class="export-opt" data-a="export"><span class="ic">💾</span><span><b>Exporter le fichier projet (.nocodex)</b><small>Pour le sauvegarder ou l\'ouvrir sur un autre appareil</small></span></button>' +
      '<button class="export-opt" data-a="del"><span class="ic">🗑️</span><span><b style="color:var(--danger)">Supprimer</b></span></button>', function (b) {
      $('[data-a=rename]', b).onclick = function () {
        ask('Nouveau nom', meta.name, function (v) {
          var p = load('project.' + id, null); if (!p) return;
          p.name = v;
          if (project && project.id === id) { project.name = v; $('#project-name').textContent = v; saveProject(); }
          else { store('project.' + id, p); saveIndex(projectIndex().map(function (x) { if (x.id === id) x.name = v; return x; })); }
          renderProjects();
        });
      };
      $('[data-a=dup]', b).onclick = function () {
        if (project && project.id === id) saveProject();
        var p = load('project.' + id, null); if (!p) return;
        p.id = uid(); p.name += ' (copie)'; p.created = p.updated = Date.now();
        store('project.' + p.id, p);
        var list = projectIndex(); list.unshift({ id: p.id, name: p.name, updated: p.updated, icon: p.settings && p.settings.icon });
        saveIndex(list);
        closeModal(); renderProjects(); toast('Projet dupliqué');
      };
      $('[data-a=export]', b).onclick = function () {
        if (project && project.id === id) saveProject();
        var p = load('project.' + id, null);
        closeModal();
        saveFile(slug(p.name) + '.nocodex', 'application/json', utf8(JSON.stringify(p)));
      };
      $('[data-a=del]', b).onclick = function () {
        confirmBox('Supprimer « ' + meta.name + ' » ?', 'Cette action est définitive. Pense à exporter le projet si tu veux le garder.', 'Supprimer', function () {
          remove('project.' + id);
          saveIndex(projectIndex().filter(function (p) { return p.id !== id; }));
          if (project && project.id === id) {
            var rest = projectIndex();
            if (rest.length) loadProjectById(rest[0].id); else createProject('Mon projet', 'bonjour');
          }
          renderProjects();
        }, true);
      };
    });
  }

  function newProjectDialog(templateId) {
    var tpl = NXTemplates.byId(templateId || 'vide');
    ask('Nom du nouveau projet', templateId && templateId !== 'vide' ? tpl.name : 'Mon app', function (name) { createProject(name, tpl.id); });
  }

  function renderTemplates() {
    $('#template-grid').innerHTML = NXTemplates.list.map(function (t) {
      return '<button class="card" data-tpl="' + t.id + '"><span class="ic">' + t.icon + '</span><span class="t">' + esc(t.name) + '</span>' +
        '<span class="tag">' + esc(t.level) + '</span><span class="d">' + esc(t.desc) + '</span></button>';
    }).join('');
    $$('#template-grid [data-tpl]').forEach(function (b) { b.onclick = function () { newProjectDialog(b.dataset.tpl); }; });
  }

  $('#btn-new').onclick = function () {
    openModal('<h2>＋ Nouveau projet</h2><p>Choisis un point de départ :</p><div class="grid">' + NXTemplates.list.map(function (t) {
      return '<button class="card" data-tpl="' + t.id + '"><span class="ic">' + t.icon + '</span><span class="t">' + esc(t.name) + '</span><span class="d">' + esc(t.desc) + '</span></button>';
    }).join('') + '</div>', function (b) {
      $$('[data-tpl]', b).forEach(function (el) { el.onclick = function () { closeModal(); newProjectDialog(el.dataset.tpl); }; });
    });
  };

  $('#import-file').onchange = function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var p = JSON.parse(r.result);
        if (!p.blocks && !p.xml && !p.custom) throw new Error('format inconnu');
        p.id = uid();
        p.name = p.name || 'Projet importé';
        openProject(p);
        showTab('blocks');
        toast('Projet importé ✔');
      } catch (err) { toast('⚠️ Fichier invalide : ' + err.message); }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  $('#project-name').onclick = function () {
    ask('Nom du projet', project.name, function (v) {
      project.name = v;
      if (!project.settings.appName || project.settings.appName === $('#project-name').textContent) project.settings.appName = v;
      $('#project-name').textContent = v;
      saveProject();
    });
  };

  /* =================== Réglages du projet =================== */
  function settingsDialog() {
    var s = project.settings;
    openModal('<h2>⚙️ Réglages du projet</h2>' +
      '<div class="field"><label>Nom de l\'application (affiché sous l\'icône)</label><input type="text" id="set-name" maxlength="32" value="' + esc(s.appName || project.name) + '"></div>' +
      '<div class="field"><label>Icône (image carrée conseillée)</label><div class="row"><img id="set-icon-prev" class="icon-preview" src="' + (s.icon || 'img/default-app-icon.png') + '">' +
      '<label class="btn small">🖼️ Choisir une image<input type="file" id="set-icon" accept="image/*" hidden></label><button class="btn small" id="set-icon-reset">Par défaut</button></div></div>' +
      '<div class="field"><label>Identifiant Android (package)</label><code>' + esc(NXApk.makePackageName(project.id)) + '</code><small style="color:var(--muted)">Unique pour ce projet : réinstaller une nouvelle version met à jour l\'app existante.</small></div>' +
      '<div class="field"><label>🖼️ Médias du projet (tes images et sons)</label><div id="media-list"></div>' +
      '<label class="btn small" style="align-self:flex-start">＋ Ajouter une image ou un son<input type="file" id="media-add" accept="image/*,audio/*" multiple hidden></label>' +
      '<small style="color:var(--muted)">Utilise-les avec le bloc 📱 Écran → « mon média ». Ils sont inclus dans l\'app exportée.</small></div>' +
      '<div class="row" style="margin-top:14px"><button class="btn primary" id="set-save">Enregistrer</button></div>', function (b) {
      var icon = s.icon;
      function renderMedia() {
        var names = Object.keys(project.media);
        $('#media-list', b).innerHTML = names.length ? names.map(function (n) {
          var d = project.media[n];
          var prev = d.indexOf('data:image') === 0 ? '<img src="' + d + '" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#000">' : '<span style="font-size:26px">🔊</span>';
          return '<div class="proj" style="margin-bottom:6px">' + prev + '<div class="meta"><b>' + esc(n) + '</b><small>' + Math.round(d.length * 0.75 / 1024) + ' Ko</small></div>' +
            '<button class="btn small danger" data-del="' + esc(n) + '">✕</button></div>';
        }).join('') : '<small style="color:var(--muted)">Aucun média pour l\'instant.</small>';
        $$('[data-del]', b).forEach(function (x) { x.onclick = function () { delete project.media[x.dataset.del]; saveProject(); dirty = true; renderMedia(); }; });
      }
      renderMedia();
      $('#media-add', b).onchange = function (e) {
        Array.prototype.forEach.call(e.target.files, function (f) {
          var name = slug(f.name.replace(/\.[^.]+$/, '')) || 'media';
          while (project.media[name]) name += '2';
          if (f.type.indexOf('image') === 0) {
            var img = new Image();
            img.onload = function () {
              var scale = Math.min(1, 512 / Math.max(img.width, img.height));
              var c = document.createElement('canvas');
              c.width = Math.max(1, Math.round(img.width * scale)); c.height = Math.max(1, Math.round(img.height * scale));
              c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
              project.media[name] = /png|gif|webp|svg/.test(f.type) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.85);
              saveProject(); dirty = true; renderMedia();
            };
            img.src = URL.createObjectURL(f);
          } else {
            if (f.size > 1500000) { toast('Son trop lourd (max 1,5 Mo)'); return; }
            var r = new FileReader();
            r.onload = function () { project.media[name] = r.result; saveProject(); dirty = true; renderMedia(); };
            r.readAsDataURL(f);
          }
        });
        e.target.value = '';
      };
      $('#set-icon', b).onchange = function (e) {
        var f = e.target.files[0]; if (!f) return;
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = c.height = 192;
          var g = c.getContext('2d');
          var m = Math.min(img.width, img.height);
          g.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 192, 192);
          icon = c.toDataURL('image/png');
          $('#set-icon-prev', b).src = icon;
        };
        img.src = URL.createObjectURL(f);
      };
      $('#set-icon-reset', b).onclick = function () { icon = null; $('#set-icon-prev', b).src = 'img/default-app-icon.png'; };
      $('#set-save', b).onclick = function () {
        s.appName = $('#set-name', b).value.trim() || project.name;
        s.icon = icon;
        saveProject();
        closeModal();
        toast('Réglages enregistrés ✔');
      };
    });
  }
  $('#btn-settings').onclick = settingsDialog;

  /* =================== Construction de l'app =================== */
  var BASE_CSS = [
    '*{box-sizing:border-box}',
    'html,body{margin:0;min-height:100%}',
    'body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#fff;color:#16161d;-webkit-tap-highlight-color:transparent}',
    '#nx-app{max-width:760px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:10px}',
    '#nx-app>*{margin:0}',
    'h1,h2,h3,h4{line-height:1.15}',
    '.nx-btn{appearance:none;border:0;border-radius:14px;padding:13px 20px;font:700 17px system-ui,sans-serif;background:#ffcc22;color:#111;box-shadow:0 4px 0 #c99b00;cursor:pointer;transition:transform .08s}',
    '.nx-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #c99b00}',
    '.nx-input{width:100%;padding:12px 14px;border:2px solid #0002;border-radius:12px;font:inherit;background:#fff;color:#111}',
    '.nx-input:focus{outline:none;border-color:#ffcc22}',
    'textarea.nx-input{min-height:110px}',
    '.nx-slider{width:100%}',
    '.nx-check{display:flex;align-items:center;gap:8px;font-weight:600}',
    '.nx-check input{width:22px;height:22px}',
    '.nx-img{max-width:100%;border-radius:12px;align-self:center}',
    '.nx-embed{width:100%;aspect-ratio:16/9;border:0;border-radius:12px}',
    '.nx-box{display:flex;flex-direction:column;gap:10px}',
    '.nx-row{flex-direction:row;flex-wrap:wrap;justify-content:center}',
    '.nx-row>.nx-input{flex:1;min-width:140px}',
    '.nx-card{background:#0000000d;border-radius:18px;padding:16px;box-shadow:0 6px 20px #0001}',
    '.nx-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;text-align:left}',
    '.nx-list li{background:#0000000d;padding:12px 14px;border-radius:12px;cursor:pointer}',
    '.nx-scene{display:block;width:100%;max-width:100%;max-height:calc(100vh - 32px);object-fit:contain;margin:0 auto;border-radius:12px;touch-action:none;user-select:none}',
    'body.nx-has-pad #nx-app{padding-bottom:150px}',
    '#nx-pad{position:fixed;left:0;right:0;bottom:0;height:140px;pointer-events:none;z-index:50}',
    '#nx-pad button{position:absolute;width:62px;height:62px;border-radius:50%;border:0;background:#ffffff40;color:#fff;font:900 22px system-ui;pointer-events:auto;backdrop-filter:blur(4px);box-shadow:0 0 0 2px #0003;user-select:none;touch-action:none}',
    '#nx-pad button:active{background:#ffcc22aa}',
    '.nx-pad-left{left:12px;bottom:40px}.nx-pad-right{left:136px;bottom:40px}.nx-pad-up{left:74px;bottom:76px}.nx-pad-down{left:74px;bottom:6px}.nx-pad-space{right:24px;bottom:40px;width:78px!important;height:78px!important;background:#ff5a5f88!important}',
    '.nx-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 18px;border-radius:99px;font-weight:700;z-index:99;transition:opacity .4s;max-width:90vw;text-align:center}',
    '.nx-toast.nx-hide{opacity:0}',
    '#nx-error{position:fixed;left:8px;right:8px;top:8px;background:#ff5a5f;color:#fff;padding:10px 12px;border-radius:12px;font:600 13px system-ui;z-index:100}',
    'a{color:#1e88e5;font-weight:600}'
  ].join('\n');

  function scriptSafe(code) { return String(code || '').replace(/<\/(script)/gi, '<\\/$1'); }

  function buildHtml() {
    var js = generate('js');
    var c = project.custom || {};
    var title = project.settings.appName || project.name;
    return '<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<meta name="generator" content="NOCODEX by SuperEssence studio">\n' +
      '<title>' + esc(title) + '</title>\n<style>\n' + BASE_CSS + '\n' + (c.css || '') + '\n</style>\n</head>\n<body>\n' +
      (c.html ? c.html + '\n' : '') +
      '<div id="nx-app"></div>\n' +
      (Object.keys(project.media || {}).length ? '<script>window.NX_MEDIA = ' + scriptSafe(JSON.stringify(project.media)) + ';</script>\n' : '') +
      '<script>\n/* Bibliothèque NOCODEX */\n(' + NXRuntime.toString() + ')();\n</script>\n' +
      '<script>\n/* Code généré par tes blocs */\ntry {\n' + scriptSafe(js) + '\n} catch (e) { NX.error(e); }\n</script>\n' +
      (c.js ? '<script>\n/* Mon code */\ntry {\n' + scriptSafe(c.js) + '\n} catch (e) { NX.error(e); }\n</script>\n' : '') +
      '</body>\n</html>\n';
  }

  /* =================== Aperçu =================== */
  function run() {
    if (!project) return;
    dirty = false;
    $('#console-lines').innerHTML = '';
    consoleErrors = 0;
    $('#console-count').textContent = '';
    var frame = $('#preview');
    frame.srcdoc = buildHtml();
  }
  $('#btn-run').onclick = function () { showTab('preview'); run(); };
  $('#btn-rerun').onclick = run;
  $('#btn-console').onclick = function () { $('#console').hidden = !$('#console').hidden; };
  $('#console-clear').onclick = function () { $('#console-lines').innerHTML = ''; consoleErrors = 0; $('#console-count').textContent = ''; };
  $('#device-size').onchange = function (e) {
    var w = $('.preview-wrap');
    w.classList.remove('phone', 'tablet');
    if (e.target.value !== 'fit') w.classList.add(e.target.value);
  };
  function exitFull() {
    $('#tab-preview').classList.remove('full');
    var b = $('#exit-full'); if (b) b.remove();
    $('#bottombar').hidden = false; $('#topbar').hidden = false;
  }
  $('#btn-full').onclick = function () {
    $('#tab-preview').classList.add('full');
    $('#bottombar').hidden = true; $('#topbar').hidden = true;
    var b = document.createElement('button');
    b.id = 'exit-full'; b.className = 'btn small'; b.textContent = '✕ Quitter';
    b.onclick = exitFull;
    document.body.appendChild(b);
  };
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.nx) return;
    var line = document.createElement('div');
    line.textContent = (d.nx === 'error' ? '⚠️ ' : '› ') + d.data;
    if (d.nx === 'error') { line.className = 'err'; consoleErrors++; $('#console-count').textContent = consoleErrors; }
    $('#console-lines').appendChild(line);
    $('#console-lines').scrollTop = 1e9;
  });

  /* =================== Code =================== */
  function codeFor(lang) {
    if (lang === 'html') return buildHtml();
    var code = generate(lang);
    if (lang === 'php') code = '<?php\n' + code;
    var head = {
      js: '// Code JavaScript généré par NOCODEX à partir de tes blocs.\n// C\'est ce code qui s\'exécute dans ton application.\n\n',
      py: '# Code Python généré par NOCODEX à partir de tes blocs.\n# Les blocs « nx » (écran, jeux…) utilisent une bibliothèque propre à NOCODEX.\n\n',
      php: '',
      lua: '-- Code Lua généré par NOCODEX à partir de tes blocs.\n\n',
      dart: '// Code Dart généré par NOCODEX à partir de tes blocs.\n\n'
    }[lang];
    return head + (code.trim() ? code : (lang === 'py' || lang === 'lua' ? (lang === 'py' ? '# ' : '-- ') : '// ') + '(aucun bloc pour l\'instant)');
  }
  function highlight(el, code, lang) {
    el.textContent = code;
    el.className = 'language-' + GENS[lang].hl;
    try { if (code.length < 200000) hljs.highlightElement(el); } catch (e) {}
  }
  function renderCode() {
    if (!ws) return;
    highlight($('#code-pre'), codeFor(currentLang), currentLang);
    var info = {
      js: 'Le <b>JavaScript</b> est le langage qui fait réellement tourner ton app (navigateur, Android). Chaque bloc devient une ligne de ce code.',
      py: '<b>Python</b> : la même logique traduite en Python (IA, science, scripts). Les maths, textes, listes, conditions, boucles et fonctions sont du Python standard.',
      php: '<b>PHP</b> : langage des serveurs web. Utile pour réutiliser ta logique côté serveur.',
      lua: '<b>Lua</b> : langage des jeux (Roblox, Love2D…). Compare-le au JavaScript pour apprendre !',
      dart: '<b>Dart</b> : langage de Flutter (apps Android/iOS). Ta logique traduite en Dart.',
      html: 'La <b>page complète</b> : HTML (structure) + CSS (style) + la bibliothèque NOCODEX + ton code. C\'est exactement le fichier exporté.'
    }[currentLang];
    $('#lang-info').innerHTML = info;
  }
  $('#lang-chips').innerHTML = Object.keys(GENS).map(function (k) {
    return '<button class="chip' + (k === currentLang ? ' active' : '') + '" data-lang="' + k + '">' + GENS[k].name + '</button>';
  }).join('');
  $$('#lang-chips .chip').forEach(function (c) {
    c.onclick = function () {
      currentLang = c.dataset.lang;
      $$('#lang-chips .chip').forEach(function (x) { x.classList.toggle('active', x === c); });
      renderCode();
    };
  });
  $('#btn-copy-code').onclick = function () { copyText(codeFor(currentLang)); };
  $('#btn-dl-code').onclick = function () {
    saveFile(slug(project.name) + '.' + GENS[currentLang].ext, 'text/plain', utf8(codeFor(currentLang)));
  };
  function copyText(t) {
    var done = function () { toast('Copié 📋'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback);
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible'); }
      ta.remove();
    }
  }
  $$('.sub').forEach(function (s) {
    s.onclick = function () {
      $$('.sub').forEach(function (x) { x.classList.toggle('active', x === s); });
      $$('.subpanel').forEach(function (p) { p.classList.toggle('active', p.id === 'sub-' + s.dataset.sub); });
    };
  });
  $$('#mine-chips .chip').forEach(function (c) {
    c.onclick = function () {
      currentMine = c.dataset.mine;
      $$('#mine-chips .chip').forEach(function (x) { x.classList.toggle('active', x === c); });
      $('#mine-editor').value = project.custom[currentMine] || '';
      $('#mine-editor').placeholder = { html: '<h1>Mon titre</h1>\n<p>Mon texte…</p>', css: 'body { background: black; color: white; }', js: 'NX.toast("Bonjour !");' }[currentMine];
    };
  });
  $('#mine-editor').addEventListener('input', function (e) {
    project.custom[currentMine] = e.target.value;
    dirty = true;
    saveSoon();
  });
  $('#mine-editor').addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      var t = e.target, s = t.selectionStart;
      t.value = t.value.slice(0, s) + '  ' + t.value.slice(t.selectionEnd);
      t.selectionStart = t.selectionEnd = s + 2;
      t.dispatchEvent(new Event('input'));
    }
  });

  // Code en direct sous les blocs
  $('#live-lang').innerHTML = ['js', 'py', 'php', 'lua', 'dart'].map(function (k) { return '<option value="' + k + '">' + GENS[k].name + '</option>'; }).join('');
  function renderLive() { highlight($('#live-pre'), codeFor($('#live-lang').value), $('#live-lang').value); }
  var liveSoon = debounce(renderLive, 250);
  $('#btn-live').onclick = function () { $('#live-code').hidden = !$('#live-code').hidden; if (!$('#live-code').hidden) renderLive(); };
  $('#live-close').onclick = function () { $('#live-code').hidden = true; };
  $('#live-lang').onchange = renderLive;
  $('#btn-undo').onclick = function () { ws.undo(false); };
  $('#btn-redo').onclick = function () { ws.undo(true); };
  $('#btn-help-blocks').onclick = function () {
    openModal('<h2>🧩 Comment utiliser les blocs</h2><ol>' +
      '<li>Touche une <b>catégorie</b> à gauche pour voir ses blocs.</li>' +
      '<li><b>Glisse</b> un bloc dans la zone de travail. Les blocs s\'<b>emboîtent</b> : ceux du dessous s\'exécutent après.</li>' +
      '<li>Les blocs <b>ronds / pointus</b> sont des <b>valeurs</b> (nombre, texte, vrai/faux) : glisse-les dans les trous des autres blocs.</li>' +
      '<li>Touche un <b>texte ou un nombre</b> dans un bloc pour le modifier, ou un <b>▾</b> pour choisir dans une liste.</li>' +
      '<li><b>Appui long</b> (ou clic droit) sur un bloc : dupliquer, commenter, aide, supprimer.</li>' +
      '<li>Pour <b>supprimer</b> : glisse le bloc sur la poubelle ou sur la liste des catégories.</li>' +
      '<li><b>Pince</b> avec deux doigts ou utilise <b>＋ / −</b> pour zoomer.</li>' +
      '<li><b>▶ Lancer</b> pour tester. <b>&lt;/&gt;</b> pour voir le code en direct.</li></ol>' +
      '<div class="row"><button class="btn primary" id="h-learn">🎓 Voir les leçons</button><button class="btn" id="h-tour">🧭 Visite guidée</button></div>', function (b) {
      $('#h-learn', b).onclick = function () { closeModal(); showTab('learn'); };
      $('#h-tour', b).onclick = function () { closeModal(); startTour(); };
    });
  };

  /* =================== Apprendre =================== */
  var miniWs = null;

  function renderLearn() {
    $('#lessons').innerHTML = NXLearn.lessons.map(function (l, i) {
      return '<button class="card" data-lesson="' + i + '"><span class="ic">' + l.icon + '</span><span class="t">' + (i + 1) + '. ' + esc(l.title) + '</span>' +
        '<span class="tag">⏱ ' + l.time + '</span><span class="d">' + esc(l.intro) + '</span></button>';
    }).join('');
    $$('[data-lesson]').forEach(function (b) { b.onclick = function () { openLesson(NXLearn.lessons[+b.dataset.lesson]); }; });

    $('#languages').innerHTML = NXLearn.languages.map(function (l) {
      return '<div class="card"><span class="ic">' + l.icon + '</span><span class="t">' + esc(l.name) + '</span><span class="d"><b>Où :</b> ' + esc(l.where) + '</span>' +
        '<span class="d">' + esc(l.what) + '</span><pre><code>' + esc(l.hello) + '</code></pre></div>';
    }).join('');
    $('#glossary').innerHTML = NXLearn.glossary.map(function (g) { return '<details><summary>' + esc(g[0]) + '</summary><p>' + esc(g[1]) + '</p></details>'; }).join('');
    $('#faq').innerHTML = NXLearn.faq.map(function (g) { return '<details><summary>' + esc(g[0]) + '</summary><p>' + esc(g[1]) + '</p></details>'; }).join('');
    renderEncyclopedia('');
  }

  function openLesson(l) {
    openModal('<h2>' + l.icon + ' ' + esc(l.title) + '</h2><p>' + l.intro + '</p><ol>' + l.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
      '<div class="challenge">🏆 <b>Défi :</b> ' + l.challenge + '</div><div class="row" style="margin-top:14px">' +
      (l.template ? '<button class="btn primary" id="lesson-open">📂 Ouvrir l\'exemple</button>' : '') +
      '<button class="btn" id="lesson-blocks">🧩 Aller aux blocs</button></div>', function (b) {
      if (l.template) $('#lesson-open', b).onclick = function () {
        closeModal();
        var t = NXTemplates.byId(l.template);
        createProject('Leçon : ' + l.title, t.id);
      };
      $('#lesson-blocks', b).onclick = function () { closeModal(); showTab('blocks'); };
    });
  }

  var encyEntries = null;
  function encyclopediaEntries() {
    if (encyEntries) return encyEntries;
    encyEntries = [];
    Object.keys(NXBlocks.cats).forEach(function (k) {
      var c = NXBlocks.cats[k];
      encyEntries.push({ cat: c.icon + ' ' + c.name, colour: c.colour, help: c.help, items: NXBlocks.specs.filter(function (s) { return s.cat === k; }).map(function (s) {
        return { type: s.type, name: s.msg.replace(/%\d/g, '…').replace(/\s+…$/, ''), help: s.help, entry: NXBlocks.toolboxEntry(s) };
      }) });
    });
    // Blocs standards : on lit leur texte et leur info-bulle directement dans Blockly.
    var head = new Blockly.Workspace();
    NXBlocks.builtin.forEach(function (b) {
      if (b.custom) {
        encyEntries.push({ cat: b.icon + ' ' + b.name, colour: b.colour, help: b.help, items: [] });
        return;
      }
      var seen = {};
      encyEntries.push({ cat: b.icon + ' ' + b.name, colour: b.colour, help: b.help, items: b.contents.filter(function (e) {
        if (e.kind !== 'block' || seen[e.type]) return false;
        seen[e.type] = true; return true;
      }).map(function (e) {
        var blk = head.newBlock(e.type), tip = blk.tooltip;
        if (typeof tip === 'function') tip = tip.call(blk);
        var name = blk.toString().replace(/\?/g, '…');
        blk.dispose();
        return { type: e.type, name: name, help: String(tip || ''), entry: e };
      }) });
    });
    head.dispose();
    return encyEntries;
  }

  function renderEncyclopedia(q) {
    q = (q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    var norm = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var html = '';
    encyclopediaEntries().forEach(function (c, ci) {
      var items = c.items.filter(function (it) { return !q || norm(it.name + ' ' + it.help).indexOf(q) >= 0; });
      if (q && !items.length) return;
      html += '<div class="ency-cat"><span class="dot" style="background:' + c.colour + '"></span>' + esc(c.cat) + ' <small>— ' + esc(c.help) + '</small></div>';
      items.forEach(function (it) {
        html += '<button class="ency-item" style="border-left-color:' + c.colour + '" data-ci="' + ci + '" data-type="' + it.type + '"><span><span class="n">' + esc(it.name) + '</span><br><span class="h">' + esc(it.help) + '</span></span></button>';
      });
    });
    $('#ency').innerHTML = html || '<p class="info">Aucun bloc trouvé.</p>';
    $$('#ency .ency-item').forEach(function (b) {
      b.onclick = function () {
        var c = encyclopediaEntries()[+b.dataset.ci];
        var it = c.items.filter(function (x) { return x.type === b.dataset.type; })[0];
        openBlockSheet(c, it);
      };
    });
  }
  $('#ency-search').addEventListener('input', debounce(function () { renderEncyclopedia($('#ency-search').value); }, 150));

  function entryToState(e) {
    var s = JSON.parse(JSON.stringify(e));
    delete s.kind;
    return s;
  }

  function openBlockSheet(c, it) {
    openModal('<h2>' + esc(it.name) + '</h2><p>' + esc(it.help) + '</p><div class="mini-ws" id="mini-ws"></div>' +
      '<div class="chips" id="sheet-langs">' + ['js', 'py', 'php', 'lua', 'dart'].map(function (k, i) { return '<button class="chip' + (i ? '' : ' active') + '" data-l="' + k + '">' + GENS[k].name + '</button>'; }).join('') + '</div>' +
      '<pre class="code-view" style="max-height:200px"><code id="sheet-code"></code></pre>' +
      '<div class="row" style="margin-top:12px"><button class="btn primary" id="sheet-add">＋ Ajouter à mon projet</button></div>', function (b) {
      miniWs = Blockly.inject($('#mini-ws', b), { readOnly: true, renderer: 'zelos', theme: theme, media: 'vendor/media/', zoom: { startScale: 0.8 } });
      try { Blockly.serialization.blocks.append(entryToState(it.entry), miniWs); } catch (e) {}
      setTimeout(function () { Blockly.svgResize(miniWs); miniWs.zoomToFit(); if (miniWs.getScale() > 1) miniWs.setScale(1); miniWs.scrollCenter(); }, 30);
      function show(lang) {
        var code;
        try { code = GENS[lang].gen().workspaceToCode(miniWs); } catch (e) { code = '// ' + e.message; }
        highlight($('#sheet-code', b), code.trim() || '(ce bloc se combine avec d\'autres)', lang);
      }
      show('js');
      $$('#sheet-langs .chip', b).forEach(function (ch) {
        ch.onclick = function () { $$('#sheet-langs .chip', b).forEach(function (x) { x.classList.toggle('active', x === ch); }); show(ch.dataset.l); };
      });
      $('#sheet-add', b).onclick = function () {
        var blk = Blockly.serialization.blocks.append(entryToState(it.entry), ws);
        var m = ws.getMetricsManager().getViewMetrics(true);
        blk.moveBy(m.left + 40 - blk.getRelativeToSurfaceXY().x, m.top + 40 - blk.getRelativeToSurfaceXY().y);
        closeModal();
        showTab('blocks');
        blk.select();
        toast('Bloc ajouté : relie-le à ton programme 🧩');
      };
    });
  }

  /* =================== Visite guidée =================== */
  var TOUR = [
    { el: '#bottombar [data-tab=blocks]', text: '🧩 <b>Blocs</b> : c\'est ici que tu crées ton app en emboîtant des blocs, comme des LEGO.' },
    { el: '.blocklyToolboxDiv', text: '📚 Les <b>catégories</b> de blocs : Événements, Écran, Jeux, Logique, Boucles, Sons, Internet… Touche-en une pour voir ses blocs.' },
    { el: '#btn-run', text: '▶ <b>Lancer</b> : teste ton application à tout moment.' },
    { el: '#bottombar [data-tab=code]', text: '⌨️ <b>Code</b> : vois le vrai code de tes blocs en JavaScript, Python, PHP, Lua, Dart… ou écris ton propre HTML/CSS/JS.' },
    { el: '#btn-export', text: '⬇ <b>Exporter</b> : en page HTML, en ZIP, ou en vraie application Android (APK) !' },
    { el: '#bottombar [data-tab=learn]', text: '🎓 <b>Apprendre</b> : leçons pas à pas, explication de chaque bloc, langages, glossaire.' },
    { el: '#bottombar [data-tab=projects]', text: '📁 <b>Projets</b> : tous tes projets et des modèles prêts à l\'emploi (jeu, quiz, calculatrice…).' }
  ];
  var tourStep = 0;
  function placeTour() {
    var s = TOUR[tourStep], el = $(s.el);
    var r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
    var hole = $('.tour-hole'), box = $('.tour-box');
    hole.style.left = (r.left - 6) + 'px'; hole.style.top = (r.top - 6) + 'px';
    hole.style.width = (r.width + 12) + 'px'; hole.style.height = (r.height + 12) + 'px';
    $('.tour-text').innerHTML = s.text + '<div style="color:var(--muted);font-size:12px;margin-top:6px">' + (tourStep + 1) + ' / ' + TOUR.length + '</div>';
    var below = r.top + r.height / 2 < innerHeight / 2;
    box.style.top = below ? (r.top + r.height + 18) + 'px' : Math.max(12, r.top - 18 - box.offsetHeight) + 'px';
    $('.tour-next').textContent = tourStep === TOUR.length - 1 ? 'C\'est parti ! 🚀' : 'Suivant →';
  }
  function startTour() { showTab('blocks'); tourStep = 0; $('#tour').hidden = false; placeTour(); requestAnimationFrame(placeTour); }
  function endTour() { $('#tour').hidden = true; store('toured', true); }
  $('.tour-next').onclick = function () { tourStep++; if (tourStep >= TOUR.length) endTour(); else placeTour(); };
  $('.tour-skip').onclick = endTour;
  $('#btn-tour').onclick = startTour;

  /* =================== Enregistrement de fichiers =================== */
  window.nxOnSaved = function (ok) { if (pendingSaved) { var cb = pendingSaved; pendingSaved = null; cb(ok); } };
  var pendingSaved = null;
  function saveFile(name, mime, bytes, cb) {
    if (native && native.saveFile) {
      pendingSaved = cb || null;
      native.saveFile(name, mime, bytesToB64(bytes), false);
      return;
    }
    var blob = new Blob([bytes], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
    toast('Téléchargement : ' + name);
    if (cb) cb(true);
  }

  /* =================== Exports =================== */
  function readme() {
    return [
      'NOCODEX — ' + project.name,
      '==========================================',
      'Application créée sans coder avec NOCODEX (SuperEssence studio).',
      '',
      'CONTENU DU ZIP',
      '  index.html            -> ton application complète. Ouvre-la dans un navigateur.',
      '  icon.png              -> l\'icône de l\'application.',
      '  projet.nocodex        -> ton projet : réimporte-le dans NOCODEX (Projets > Importer).',
      '  code/blocs.js         -> le code JavaScript généré par tes blocs.',
      '  code/blocs.py         -> la même logique en Python.',
      '  code/blocs.php        -> la même logique en PHP.',
      '  code/blocs.lua        -> la même logique en Lua.',
      '  code/blocs.dart       -> la même logique en Dart.',
      '  code/mon-code.html/.css/.js -> le code que tu as écrit toi-même.',
      '',
      'METTRE TON SITE EN LIGNE (gratuit)',
      '  - Netlify Drop : glisse le dossier sur https://app.netlify.com/drop',
      '  - GitHub Pages : crée un dépôt, ajoute index.html, active Pages.',
      '  - Vercel, Cloudflare Pages, Firebase Hosting... fonctionnent aussi.',
      '',
      'EN FAIRE UNE APPLICATION',
      '  - Android : utilise l\'export APK directement dans NOCODEX.',
      '  - iOS / Play Store : le dossier peut être emballé avec Capacitor ou Cordova',
      '    (npx cap init, puis copie index.html dans le dossier www).',
      '',
      'Les fichiers Python/PHP/Lua/Dart utilisent une bibliothèque "nx" qui',
      'représente les blocs propres à NOCODEX (écran, jeux, sons...) : la logique',
      '(variables, conditions, boucles, listes, fonctions, maths) est du code standard.'
    ].join('\r\n');
  }

  function iconBytes() {
    if (project.settings.icon) return b64ToBytes(project.settings.icon.split(',')[1]);
    return null;
  }

  function exportHtml() {
    saveFile(slug(project.settings.appName || project.name) + '.html', 'text/html', utf8(buildHtml()));
  }

  function exportZip() {
    var entries = [
      { name: 'index.html', data: utf8(buildHtml()) },
      { name: 'projet.nocodex', data: utf8(JSON.stringify(project)) },
      { name: 'LISEZMOI.txt', data: utf8(readme()) }
    ];
    ['js', 'py', 'php', 'lua', 'dart'].forEach(function (l) { entries.push({ name: 'code/blocs.' + GENS[l].ext, data: utf8(codeFor(l)) }); });
    var c = project.custom;
    if (c.html) entries.push({ name: 'code/mon-code.html', data: utf8(c.html) });
    if (c.css) entries.push({ name: 'code/mon-code.css', data: utf8(c.css) });
    if (c.js) entries.push({ name: 'code/mon-code.js', data: utf8(c.js) });
    var ic = iconBytes();
    if (ic) entries.push({ name: 'icon.png', data: ic, store: true });
    saveFile(slug(project.settings.appName || project.name) + '.zip', 'application/zip', NXApk.buildZip(entries));
  }

  function signingKey(progress, cb) {
    var saved = load('signkey', null);
    if (saved) {
      try { return cb(null, NXApk.importKey(saved)); } catch (e) { /* clé abîmée : on en recrée une */ }
    }
    progress(10, 'Création de ta clé de signature personnelle (une seule fois, quelques secondes)…');
    setTimeout(function () {
      NXApk.createKey(function (err, key) {
        if (err) return cb(err);
        store('signkey', NXApk.exportKey(key));
        cb(null, key);
      });
    }, 50);
  }

  function exportApk() {
    var appName = project.settings.appName || project.name;
    openModal('<h2>🤖 Création de l\'APK</h2><p id="apk-step">Préparation…</p><div class="progress"><i id="apk-bar"></i></div><div id="apk-done"></div>', function (b) {
      function progress(p, msg) { $('#apk-bar', b).style.width = p + '%'; if (msg) $('#apk-step', b).textContent = msg; }
      progress(5, 'Préparation de ton application « ' + appName + ' »…');
      signingKey(progress, function (err, key) {
        if (err) { progress(100, '⚠️ Erreur de clé : ' + err.message); return; }
        progress(55, 'Assemblage et signature de l\'APK…');
        setTimeout(function () {
          try {
            var res = NXApk.buildApk({
              template: b64ToBytes(window.NX_TEMPLATE_APK),
              files: { 'index.html': buildHtml() },
              appName: appName,
              packageName: NXApk.makePackageName(project.id),
              icon: iconBytes(),
              key: key
            });
            var fileName = slug(appName) + '.apk';
            progress(100, '✅ APK prêt : ' + fileName + ' (' + Math.round(res.apk.length / 1024) + ' Ko)');
            $('#apk-done', b).innerHTML = '<p>Package : <code>' + res.packageName + '</code></p>' +
              '<div class="row"><button class="btn primary" id="apk-save">💾 Enregistrer l\'APK</button>' +
              (native ? '<button class="btn" id="apk-install" disabled>📲 Installer</button><button class="btn" id="apk-share" disabled>📤 Partager</button>' : '') + '</div>' +
              '<p style="font-size:13px;color:var(--muted)">' + (native ?
                'Choisis où enregistrer le fichier, puis touche « Installer ». Android te demandera d\'autoriser l\'installation depuis NOCODEX : c\'est normal pour une app qui ne vient pas du Play Store.' :
                'Envoie ce fichier .apk sur ton téléphone Android (câble, mail, Drive…) et ouvre-le pour l\'installer.') + '</p>';
            $('#apk-save', b).onclick = function () {
              saveFile(fileName, 'application/vnd.android.package-archive', res.apk, function (ok) {
                if (ok && native) { $('#apk-install', b).disabled = false; $('#apk-share', b).disabled = false; }
              });
            };
            if (native) {
              $('#apk-install', b).onclick = function () { native.openLastSaved(); };
              $('#apk-share', b).onclick = function () { native.shareLastSaved(); };
            }
          } catch (e) {
            progress(100, '⚠️ Erreur : ' + e.message);
          }
        }, 60);
      });
    });
  }

  $('#btn-export').onclick = function () {
    saveProject();
    openModal('<h2>⬇ Exporter « ' + esc(project.settings.appName || project.name) + ' »</h2>' +
      '<button class="export-opt" data-x="apk"><span class="ic">🤖</span><span><b>Application Android (.apk)</b><small>Une vraie app installable, avec ton nom et ton icône. Générée et signée directement ici.</small></span></button>' +
      '<button class="export-opt" data-x="html"><span class="ic">🌐</span><span><b>Page web (.html)</b><small>Un seul fichier qui marche partout : téléphone, PC, Mac, tablette.</small></span></button>' +
      '<button class="export-opt" data-x="zip"><span class="ic">📦</span><span><b>Archive complète (.zip)</b><small>Site + code dans 5 langages + projet + mode d\'emploi pour publier en ligne.</small></span></button>' +
      '<button class="export-opt" data-x="proj"><span class="ic">💾</span><span><b>Fichier projet (.nocodex)</b><small>Pour sauvegarder ou continuer sur un autre appareil.</small></span></button>' +
      '<button class="export-opt" data-x="copy"><span class="ic">📋</span><span><b>Copier le code HTML</b><small>Pour le coller où tu veux.</small></span></button>' +
      '<button class="export-opt" data-x="settings"><span class="ic">⚙️</span><span><b>Nom & icône de l\'app</b><small>À régler avant d\'exporter.</small></span></button>', function (b) {
      $('[data-x=apk]', b).onclick = exportApk;
      $('[data-x=html]', b).onclick = function () { closeModal(); exportHtml(); };
      $('[data-x=zip]', b).onclick = function () { closeModal(); exportZip(); };
      $('[data-x=proj]', b).onclick = function () { closeModal(); saveFile(slug(project.name) + '.nocodex', 'application/json', utf8(JSON.stringify(project))); };
      $('[data-x=copy]', b).onclick = function () { closeModal(); copyText(buildHtml()); };
      $('[data-x=settings]', b).onclick = settingsDialog;
    });
  };

  /* =================== Démarrage =================== */
  function boot() {
    initBlockly();
    renderTemplates();
    renderLearn();
    var cur = load('current', null);
    var first = !projectIndex().length;
    if (cur && load('project.' + cur, null)) loadProjectById(cur);
    else if (!first) loadProjectById(projectIndex()[0].id);
    else openProject(newProjectData('Mon premier projet', 'bonjour'));

    var splash = $('#splash');
    var finish = function () { splash.remove(); Blockly.svgResize(ws); if (!load('toured', false)) setTimeout(welcome, 300); };
    splash.addEventListener('animationend', function (e) { if (e.target === splash) finish(); });
    // Sécurité si l'animation ne se termine pas.
    setTimeout(function () { if (document.body.contains(splash)) finish(); }, 6500);
  }

  function welcome() {
    openModal('<h2>Bienvenue dans NOCODEX ! 👋</h2><p>Ici tu crées <b>des applications, des sites et des jeux sans écrire de code</b>, en emboîtant des blocs. Tu peux voir le vrai code dans 5 langages, et exporter ton app en <b>HTML, ZIP ou APK Android</b>.</p>' +
      '<p>Un premier projet « Bonjour » est déjà ouvert. Appuie sur <b>▶ Lancer</b> pour le tester !</p>' +
      '<div class="row"><button class="btn primary" id="w-tour">🧭 Faire la visite guidée</button><button class="btn" id="w-skip">Plus tard</button></div>', function (b) {
      $('#w-tour', b).onclick = function () { closeModal(); startTour(); };
      $('#w-skip', b).onclick = function () { closeModal(); store('toured', true); };
    });
  }

  window.addEventListener('beforeunload', saveProject);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveProject(); });

  // Laisse l'écran de lancement s'afficher avant le gros chargement.
  setTimeout(boot, 120);

  // Accès pour le débogage / tests automatiques.
  window.NXStudio = { project: function () { return project; }, buildHtml: function () { return buildHtml(); }, generate: generate, showTab: showTab, createProject: createProject, run: run, ws: function () { return ws; } };
})();
