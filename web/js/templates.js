/*
 * NOCODEX — projets d'exemple (utilisés par la galerie de modèles et les leçons).
 * Un mini-langage construit le XML Blockly pour rester lisible.
 */
(function () {
  'use strict';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // B(type, {f: champs, v: entrées valeur, s: entrées instruction, m: mutation xml})
  function B(type, o) { return { type: type, o: o || {} }; }
  function t(s) { return { type: 'text', shadow: true, o: { f: { TEXT: s } } }; }
  function n(x) { return { type: 'math_number', shadow: true, o: { f: { NUM: x } } }; }
  function col(c) {
    // Couleur de la liste → bloc « couleur » ; sinon → bloc « couleur code ».
    var known = window.NXBlocks && NXBlocks.colors.some(function (x) { return x[1] === c; });
    return { type: known ? 'nx_color' : 'nx_color_hex', shadow: true, o: { f: { C: c } } };
  }
  function emo(e) { return { type: 'nx_emoji', shadow: true, o: { f: { E: e } } }; }
  function V(name) { return { var: name }; }
  function get(name) { return B('variables_get', { f: { VAR: V(name) } }); }
  function set(name, value) { return B('variables_set', { f: { VAR: V(name) }, v: { VALUE: value } }); }
  function change(name, by) { return B('math_change', { f: { VAR: V(name) }, v: { DELTA: n(by) } }); }
  function join() {
    var items = Array.prototype.slice.call(arguments), v = {};
    items.forEach(function (it, i) { v['ADD' + i] = typeof it === 'string' ? t(it) : it; });
    return B('text_join', { m: '<mutation items="' + items.length + '"></mutation>', v: v });
  }
  function cmp(op, a, b) { return B('logic_compare', { f: { OP: op }, v: { A: a, B: b } }); }
  function arith(op, a, b) { return B('math_arithmetic', { f: { OP: op }, v: { A: a, B: b } }); }
  function ifelse(cond, then, els, elifs) {
    var v = { IF0: cond }, s = { DO0: then }, m = '';
    (elifs || []).forEach(function (e, i) { v['IF' + (i + 1)] = e[0]; s['DO' + (i + 1)] = e[1]; });
    if (els) s.ELSE = els;
    m = '<mutation' + ((elifs && elifs.length) ? ' elseif="' + elifs.length + '"' : '') + (els ? ' else="1"' : '') + '></mutation>';
    return B('controls_if', { m: m, v: v, s: s });
  }
  function seq() {
    var list = Array.prototype.slice.call(arguments).filter(Boolean);
    for (var i = 0; i < list.length - 1; i++) list[i].next = list[i + 1];
    return list[0];
  }

  function render(b, vars) {
    var tag = b.shadow ? 'shadow' : 'block';
    var x = '<' + tag + ' type="' + b.type + '">';
    if (b.o.m) x += b.o.m;
    var f = b.o.f || {};
    Object.keys(f).forEach(function (k) {
      var val = f[k];
      if (val && val.var) {
        vars[val.var] = true;
        x += '<field name="' + k + '" id="var_' + esc(val.var) + '">' + esc(val.var) + '</field>';
      } else x += '<field name="' + k + '">' + esc(val) + '</field>';
    });
    var v = b.o.v || {};
    Object.keys(v).forEach(function (k) {
      if (!v[k]) return;
      var inner = typeof v[k] === 'string' ? t(v[k]) : typeof v[k] === 'number' ? n(v[k]) : v[k];
      x += '<value name="' + k + '">' + render(inner, vars) + '</value>';
    });
    var s = b.o.s || {};
    Object.keys(s).forEach(function (k) { if (s[k]) x += '<statement name="' + k + '">' + render(s[k], vars) + '</statement>'; });
    if (b.next) x += '<next>' + render(b.next, vars) + '</next>';
    return x + '</' + tag + '>';
  }

  function workspace(tops) {
    var vars = {}, body = '', y = 20;
    tops.forEach(function (top) {
      body += render(top, vars).replace(/^<block /, '<block x="20" y="' + y + '" ');
      y += 400;
    });
    var vx = Object.keys(vars).map(function (name) { return '<variable id="var_' + esc(name) + '">' + esc(name) + '</variable>'; }).join('');
    return '<xml xmlns="https://developers.google.com/blockly/xml"><variables>' + vx + '</variables>' + body + '</xml>';
  }

  function start() { return B('nx_start', { s: { DO: seq.apply(null, arguments) } }); }

  var T = [];

  T.push({ id: 'vide', icon: '📄', name: 'Projet vide', level: 'Tous', desc: 'Une page blanche avec juste le bloc de démarrage.',
    xml: function () { return workspace([start(B('nx_text', { v: { T: t('Mon application') } }))]); } });

  T.push({ id: 'bonjour', icon: '👋', name: 'Bonjour le monde', level: 'Débutant', desc: 'Titre, texte, bouton, message et voix : ta toute première app.',
    xml: function () {
      return workspace([start(
        B('nx_background', { v: { C: col('#101820') } }),
        B('nx_text_color', { v: { C: col('#ffffff') } }),
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('Bonjour ! 👋') } }),
        B('nx_text', { f: { ID: '' }, v: { T: t('Voici ma première application faite avec NOCODEX.') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('Clique-moi') }, s: { DO: seq(
          B('nx_alert', { v: { T: t('Bravo, tu as cliqué ! 🎉') } }),
          B('nx_speak', { v: { T: t('Bravo !') } })) } })
      )]);
    } });

  T.push({ id: 'compteur', icon: '👆', name: 'Compteur (clicker)', level: 'Débutant', desc: 'Une variable qui augmente à chaque toucher, avec record sauvegardé.',
    xml: function () {
      return workspace([start(
        set('compteur', n(0)),
        set('record', B('nx_load', { v: { KEY: t('record'), DEF: n(0) } })),
        B('nx_background', { v: { C: col('#1a237e') } }),
        B('nx_text_color', { v: { C: col('#ffffff') } }),
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '2', ID: '' }, v: { T: t('Clique le plus vite possible !') } }),
        B('nx_heading', { f: { LEVEL: '1', ID: 'score' }, v: { T: n(0) } }),
        B('nx_text', { f: { ID: 'rec' }, v: { T: join('Record : ', get('record')) } }),
        B('nx_button', { f: { ID: 'gros' }, v: { LABEL: t('🍪 +1') }, s: { DO: seq(
          change('compteur', 1),
          B('nx_set_text', { f: { ID: 'score' }, v: { T: get('compteur') } }),
          B('nx_vibrate', { v: { MS: n(20) } }),
          ifelse(cmp('GT', get('compteur'), get('record')), seq(
            set('record', get('compteur')),
            B('nx_save', { v: { VAL: get('record'), KEY: t('record') } }),
            B('nx_set_text', { f: { ID: 'rec' }, v: { T: join('Nouveau record : ', get('record'), ' 🏆') } })))) } }),
        B('nx_style', { f: { ID: 'gros', PROP: 'fontSize' }, v: { VAL: n(40) } })
      )]);
    } });

  T.push({ id: 'calculatrice', icon: '🧮', name: 'Calculatrice', level: 'Débutant', desc: 'Deux champs nombre, quatre boutons, un résultat.',
    xml: function () {
      function op(label, o) {
        return B('nx_button', { f: { ID: '' }, v: { LABEL: t(label) }, s: { DO:
          B('nx_set_text', { f: { ID: 'resultat' }, v: { T: join('= ', arith(o, B('nx_number_of', { f: { ID: 'a' } }), B('nx_number_of', { f: { ID: 'b' } }))) } }) } });
      }
      return workspace([start(
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('🧮 Calculatrice') } }),
        B('nx_input', { f: { ID: 'a', TYPE: 'number' }, v: { PH: t('Premier nombre') } }),
        B('nx_input', { f: { ID: 'b', TYPE: 'number' }, v: { PH: t('Deuxième nombre') } }),
        B('nx_box', { f: { ID: 'ops', LAYOUT: 'row' }, s: { DO: seq(op('+', 'ADD'), op('−', 'MINUS'), op('×', 'MULTIPLY'), op('÷', 'DIVIDE')) } }),
        B('nx_heading', { f: { LEVEL: '1', ID: 'resultat' }, v: { T: t('= ?') } })
      )]);
    } });

  T.push({ id: 'devine', icon: '🎲', name: 'Devine le nombre', level: 'Débutant', desc: 'Conditions si / sinon, nombre au hasard, compteur d\'essais.',
    xml: function () {
      return workspace([start(
        set('secret', B('math_random_int', { v: { FROM: n(1), TO: n(100) } })),
        set('essais', n(0)),
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('🎲 Devine le nombre') } }),
        B('nx_text', { f: { ID: '' }, v: { T: t('J\'ai choisi un nombre entre 1 et 100.') } }),
        B('nx_input', { f: { ID: 'essai', TYPE: 'number' }, v: { PH: t('Ton nombre') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('Essayer') }, s: { DO: seq(
          change('essais', 1),
          ifelse(cmp('LT', B('nx_number_of', { f: { ID: 'essai' } }), get('secret')),
            B('nx_set_text', { f: { ID: 'indice' }, v: { T: t('C\'est plus ! ⬆️') } }),
            seq(B('nx_set_text', { f: { ID: 'indice' }, v: { T: join('🎉 Gagné en ', get('essais'), ' essais !') } }), B('nx_sound', { f: { S: 'victoire' } })),
            [[cmp('GT', B('nx_number_of', { f: { ID: 'essai' } }), get('secret')), B('nx_set_text', { f: { ID: 'indice' }, v: { T: t('C\'est moins ! ⬇️') } })]])) } }),
        B('nx_heading', { f: { LEVEL: '2', ID: 'indice' }, v: { T: t('À toi de jouer !') } })
      )]);
    } });

  T.push({ id: 'taches', icon: '✅', name: 'Liste de tâches', level: 'Intermédiaire', desc: 'Listes, sauvegarde dans le téléphone, suppression au toucher.',
    xml: function () {
      return workspace([start(
        set('taches', B('nx_load', { v: { KEY: t('taches'), DEF: B('lists_create_with', { m: '<mutation items="0"></mutation>' }) } })),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('✅ Mes tâches') } }),
        B('nx_box', { f: { ID: 'ajout', LAYOUT: 'row' }, s: { DO: seq(
          B('nx_input', { f: { ID: 'nouvelle', TYPE: 'text' }, v: { PH: t('Nouvelle tâche…') } }),
          B('nx_button', { f: { ID: '' }, v: { LABEL: t('Ajouter') }, s: { DO: seq(
            ifelse(B('logic_negate', { v: { BOOL: B('text_isEmpty', { v: { VALUE: B('nx_value', { f: { ID: 'nouvelle' } }) } }) } }), seq(
              B('lists_setIndex', { m: '<mutation at="false"></mutation>', f: { MODE: 'INSERT', WHERE: 'LAST' }, v: { LIST: get('taches'), TO: B('nx_value', { f: { ID: 'nouvelle' } }) } }),
              B('nx_set_value', { f: { ID: 'nouvelle' }, v: { VAL: t('') } }),
              B('nx_save', { v: { VAL: get('taches'), KEY: t('taches') } }),
              B('nx_list', { f: { ID: 'liste' }, v: { ITEMS: get('taches') } })))) } }))
        } }),
        B('nx_text', { f: { ID: '' }, v: { T: t('Touche une tâche pour la supprimer.') } }),
        B('nx_list', { f: { ID: 'liste' }, v: { ITEMS: get('taches') } }),
        B('nx_on_list', { f: { ID: 'liste' }, s: { DO: seq(
          B('lists_setIndex', { m: '<mutation at="true"></mutation>', f: { MODE: 'REMOVE', WHERE: 'FROM_START' }, v: { LIST: get('taches'), AT: B('nx_clicked_index') } }),
          B('nx_save', { v: { VAL: get('taches'), KEY: t('taches') } }),
          B('nx_list', { f: { ID: 'liste' }, v: { ITEMS: get('taches') } }),
          B('nx_toast', { v: { T: t('Tâche terminée 👍') } })) } })
      )]);
    } });

  T.push({ id: 'jeu', icon: '⭐', name: 'Jeu : attrape les étoiles', level: 'Intermédiaire', desc: 'Scène, sprites, manette, collisions, score, game over.',
    xml: function () {
      return workspace([
        start(
          set('score', n(0)),
          B('nx_background', { v: { C: col('#000000') } }),
          B('nx_scene', { v: { W: n(360), H: n(600), C: col('#1a237e') } }),
          B('nx_sprite', { v: { NAME: t('joueur'), LOOK: emo('🐱'), X: n(180), Y: n(550), SIZE: n(64) } }),
          B('nx_sprite', { v: { NAME: t('etoile'), LOOK: emo('⭐'), X: n(180), Y: n(0), SIZE: n(48) } }),
          B('nx_gamepad'),
          B('nx_frame', { s: { DO: seq(
            ifelse(B('nx_key_down', { f: { KEY: 'left' } }), B('nx_sprite_move', { v: { NAME: t('joueur'), DX: n(-7), DY: n(0) } })),
            ifelse(B('nx_key_down', { f: { KEY: 'right' } }), B('nx_sprite_move', { v: { NAME: t('joueur'), DX: n(7), DY: n(0) } })),
            ifelse(B('nx_pressing'), B('nx_sprite_set', { f: { PROP: 'x' }, v: { NAME: t('joueur'), VAL: B('nx_tap_x') } })),
            B('nx_sprite_keep', { v: { NAME: t('joueur') } }),
            B('nx_sprite_move', { v: { NAME: t('etoile'), DX: n(0), DY: arith('ADD', n(3), arith('DIVIDE', get('score'), n(3))) } }),
            ifelse(B('nx_touching', { v: { A: t('joueur'), B: t('etoile') } }), seq(
              change('score', 1),
              B('nx_sound', { f: { S: 'piece' } }),
              B('nx_vibrate', { v: { MS: n(30) } }),
              B('nx_sprite_goto', { v: { NAME: t('etoile'), X: B('math_random_int', { v: { FROM: n(30), TO: n(330) } }), Y: n(0) } }))),
            ifelse(cmp('GT', B('nx_sprite_get', { f: { PROP: 'y' }, v: { NAME: t('etoile') } }), n(600)), seq(
              B('nx_stop_timers'),
              B('nx_sound', { f: { S: 'defaite' } }),
              B('nx_draw_text', { v: { T: t('GAME OVER'), X: n(180), Y: n(280), S: n(44), C: col('#ffffff') } }),
              B('nx_draw_text', { v: { T: join('Score : ', get('score')), X: n(180), Y: n(330), S: n(28), C: col('#fdd835') } }))),
            B('nx_hud', { v: { T: join('⭐ Score : ', get('score')) } })) } })
        )
      ]);
    } });

  T.push({ id: 'balle', icon: '⚽', name: 'Balle rebondissante', level: 'Intermédiaire', desc: 'Physique : vitesse, rebonds, gravité. Touche l\'écran pour lancer la balle.',
    xml: function () {
      return workspace([start(
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#101820') } }),
        B('nx_sprite', { v: { NAME: t('balle'), LOOK: emo('⚽'), X: n(180), Y: n(100), SIZE: n(56) } }),
        B('nx_sprite_flag', { f: { FLAG: 'bounce', VAL: 'TRUE' }, v: { NAME: t('balle') } }),
        B('nx_sprite_flag', { f: { FLAG: 'gravity', VAL: 'TRUE' }, v: { NAME: t('balle') } }),
        B('nx_gravity', { v: { G: n(0.4) } }),
        B('nx_sprite_set', { f: { PROP: 'vx' }, v: { NAME: t('balle'), VAL: n(4) } }),
        B('nx_hud', { v: { T: t('Touche l\'écran pour lancer la balle !') } }),
        B('nx_on_tap', { s: { DO: seq(
          B('nx_sprite_towards', { v: { NAME: t('balle'), X: B('nx_tap_x'), Y: B('nx_tap_y'), SPEED: n(14) } }),
          B('nx_sound', { f: { S: 'saut' } })) } })
      )]);
    } });

  T.push({ id: 'dessin', icon: '🎨', name: 'Art génératif', level: 'Débutant', desc: 'Une boucle qui dessine 80 cercles de couleurs au hasard.',
    xml: function () {
      return workspace([start(
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#000000') } }),
        B('controls_repeat_ext', { v: { TIMES: n(80) }, s: { DO:
          B('nx_draw_circle', { v: { X: B('math_random_int', { v: { FROM: n(0), TO: n(360) } }), Y: B('math_random_int', { v: { FROM: n(0), TO: n(600) } }), R: B('math_random_int', { v: { FROM: n(5), TO: n(50) } }), C: B('nx_random_color') } }) } }),
        B('nx_draw_text', { v: { T: t('Mon œuvre ✨'), X: n(180), Y: n(560), S: n(32), C: col('#ffffff') } }),
        B('nx_on_tap', { s: { DO: B('nx_draw_circle', { v: { X: B('nx_tap_x'), Y: B('nx_tap_y'), R: n(20), C: B('nx_random_color') } }) } })
      )]);
    } });

  T.push({ id: 'quiz', icon: '❓', name: 'Quiz', level: 'Débutant', desc: 'Pose des questions, compte les bonnes réponses.',
    xml: function () {
      function q(question, answer) {
        return ifelse(cmp('EQ', B('text_changeCase', { f: { CASE: 'LOWERCASE' }, v: { TEXT: B('nx_ask', { v: { Q: t(question) } }) } }), t(answer)),
          seq(change('points', 1), B('nx_toast', { v: { T: t('✅ Bonne réponse !') } })),
          B('nx_toast', { v: { T: t('❌ La réponse était : ' + answer) } }));
      }
      return workspace([start(
        set('points', n(0)),
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('❓ Le grand quiz') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('Commencer') }, s: { DO: seq(
          set('points', n(0)),
          q('Quelle est la capitale de la France ?', 'paris'),
          q('Combien font 7 × 8 ?', '56'),
          q('Quelle planète est la plus proche du Soleil ?', 'mercure'),
          B('nx_alert', { v: { T: join('Tu as ', get('points'), ' / 3 !') } })) } })
      )]);
    } });

  T.push({ id: 'api', icon: '🌐', name: 'Blague depuis Internet', level: 'Intermédiaire', desc: 'Télécharge des données JSON depuis une API et les affiche.',
    xml: function () {
      return workspace([start(
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('😂 Blague du jour') } }),
        B('nx_text', { f: { ID: 'blague' }, v: { T: t('Appuie sur le bouton…') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('Nouvelle blague (anglais)') }, s: { DO: seq(
          B('nx_set_text', { f: { ID: 'blague' }, v: { T: t('Chargement…') } }),
          B('nx_fetch', { f: { JSON: 'TRUE' }, v: { URL: t('https://api.chucknorris.io/jokes/random') }, s: { DO:
            B('nx_set_text', { f: { ID: 'blague' }, v: { T: B('nx_get', { v: { OBJ: B('nx_result'), PATH: t('value') } }) } }) } })) } })
      )]);
    } });

  T.push({ id: 'horloge', icon: '⏰', name: 'Horloge', level: 'Débutant', desc: 'Heure en direct mise à jour chaque seconde.',
    xml: function () {
      return workspace([start(
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_text_color', { v: { C: col('#ffcc22') } }),
        B('nx_align', { f: { A: 'center' } }),
        B('nx_font', { f: { FONT: 'monospace' } }),
        B('nx_space', { v: { PX: n(80) } }),
        B('nx_heading', { f: { LEVEL: '1', ID: 'heure' }, v: { T: B('nx_time', { f: { P: 'clock' } }) } }),
        B('nx_text', { f: { ID: '' }, v: { T: join(B('nx_time', { f: { P: 'weekday' } }), ' ', B('nx_time', { f: { P: 'date' } })) } }),
        B('nx_every', { v: { SEC: n(1) }, s: { DO: B('nx_set_text', { f: { ID: 'heure' }, v: { T: B('nx_time', { f: { P: 'clock' } }) } }) } })
      )]);
    } });

  T.push({ id: 'piano', icon: '🎹', name: 'Piano', level: 'Débutant', desc: 'Des boutons qui jouent des notes de musique.',
    xml: function () {
      var notes = [['Do', 'do'], ['Ré', 're'], ['Mi', 'mi'], ['Fa', 'fa'], ['Sol', 'sol'], ['La', 'la'], ['Si', 'si'], ['Do', 'do2']];
      var keys = notes.map(function (nn) {
        return B('nx_button', { f: { ID: '' }, v: { LABEL: t(nn[0]) }, s: { DO: B('nx_note', { f: { N: nn[1] }, v: { B: n(1) } }) } });
      });
      return workspace([start(
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('🎹 Mon piano') } }),
        B('nx_box', { f: { ID: 'touches', LAYOUT: 'row' }, s: { DO: seq.apply(null, keys) } }),
        B('nx_raw_css', { v: { CODE: t('#touches button{min-width:38px;height:140px;background:#fff;color:#000;border-radius:0 0 10px 10px}') } })
      )]);
    } });

  T.push({ id: 'profil', icon: '🪪', name: 'Formulaire & carte de profil', level: 'Débutant', desc: 'Champs, menu, curseur, case à cocher et carte de résultat.',
    xml: function () {
      return workspace([start(
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('🪪 Mon profil') } }),
        B('nx_input', { f: { ID: 'prenom', TYPE: 'text' }, v: { PH: t('Ton prénom') } }),
        B('nx_select', { f: { ID: 'couleur' }, v: { OPTIONS: t('Rouge,Vert,Bleu,Jaune') } }),
        B('nx_text', { f: { ID: '' }, v: { T: t('Ton âge :') } }),
        B('nx_slider', { f: { ID: 'age' }, v: { MIN: n(5), MAX: n(99), VAL: n(15) } }),
        B('nx_checkbox', { f: { ID: 'news' }, v: { LABEL: t('Je veux des nouvelles') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('Créer ma carte') }, s: { DO: seq(
          B('nx_box', { f: { ID: 'carte', LAYOUT: 'card' }, s: { DO: seq(
            B('nx_clear_el', { f: { ID: 'carte' } }),
            B('nx_heading', { f: { LEVEL: '2', ID: '' }, v: { T: join('Salut ', B('nx_value', { f: { ID: 'prenom' } }), ' !') } }),
            B('nx_text', { f: { ID: '' }, v: { T: join('Âge : ', B('nx_value', { f: { ID: 'age' } }), ' ans · couleur préférée : ', B('nx_value', { f: { ID: 'couleur' } })) } }),
            ifelse(B('nx_value', { f: { ID: 'news' } }), B('nx_text', { f: { ID: '' }, v: { T: t('📬 Abonné aux nouvelles') } }))) } })) } })
      )]);
    } });

  T.push({ id: 'meteo', icon: '🌦️', name: 'Météo + GPS', level: 'Avancé', desc: 'Position GPS + API météo gratuite (open-meteo.com).',
    xml: function () {
      return workspace([start(
        B('nx_align', { f: { A: 'center' } }),
        B('nx_heading', { f: { LEVEL: '1', ID: '' }, v: { T: t('🌦️ Météo ici') } }),
        B('nx_heading', { f: { LEVEL: '1', ID: 'temp' }, v: { T: t('…') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('📍 Me localiser') }, s: { DO:
          B('nx_locate', { s: { DO: B('nx_fetch', { f: { JSON: 'TRUE' }, v: { URL: join('https://api.open-meteo.com/v1/forecast?current_weather=true&latitude=', B('nx_lat'), '&longitude=', B('nx_lon')) }, s: { DO: seq(
            B('nx_set_text', { f: { ID: 'temp' }, v: { T: join(B('nx_get', { v: { OBJ: B('nx_result'), PATH: t('current_weather.temperature') } }), ' °C') } }),
            B('nx_speak', { v: { T: join('Il fait ', B('nx_get', { v: { OBJ: B('nx_result'), PATH: t('current_weather.temperature') } }), ' degrés') } })) } }) } }) } })
      )]);
    } });

  T.push({ id: 'html', icon: '⌨️', name: 'Site en code libre', level: 'Avancé', desc: 'Un site écrit directement en HTML / CSS / JavaScript (onglet Code → Mon code).',
    xml: function () { return workspace([start(B('nx_comment', { f: { T: 'Ce projet est écrit dans l\'onglet Code → Mon code' } }))]); },
    custom: {
      html: '<header class="hero">\n  <h1>Mon site 🚀</h1>\n  <p>Fait avec NOCODEX, en code libre.</p>\n  <button id="hello">Dire bonjour</button>\n</header>\n<main>\n  <section class="card"><h2>HTML</h2><p>La structure de la page.</p></section>\n  <section class="card"><h2>CSS</h2><p>Les couleurs et la mise en page.</p></section>\n  <section class="card"><h2>JavaScript</h2><p>Les actions et l\'interactivité.</p></section>\n</main>',
      css: '.hero{padding:48px 16px;background:linear-gradient(135deg,#ffcc22,#ff6a00);color:#111;border-radius:0 0 24px 24px}\nmain{display:grid;gap:12px;padding:16px}\n.card{background:#1b1b24;color:#fff;padding:16px;border-radius:16px}',
      js: 'document.getElementById("hello").onclick = function () {\n  NX.toast("Bonjour ! 👋");\n  NX.speak("Bonjour");\n};'
    } });

  /* ===================== Jeux complets ===================== */
  function hud() { return B('nx_hud', { v: { T: join.apply(null, Array.prototype.slice.call(arguments)) } }); }
  function other() { return B('nx_other'); }
  function collide(a, b, body) { return B('nx_collide', { v: { A: t(a), B: t(b) }, s: { DO: body } }); }
  function sget(prop, name) { return B('nx_sprite_get', { f: { PROP: prop }, v: { NAME: typeof name === 'string' ? t(name) : name } }); }
  function gameOver(msg) {
    return seq(
      B('nx_stop_timers'),
      B('nx_sound', { f: { S: 'defaite' } }),
      B('nx_draw_text', { v: { T: t(msg || 'GAME OVER'), X: n(180), Y: n(280), S: n(44), C: col('#ffffff') } }),
      B('nx_draw_text', { v: { T: t('Touche ↻ Relancer pour rejouer'), X: n(180), Y: n(330), S: n(18), C: col('#fdd835') } }));
  }
  function procDef(name, body) { return B('procedures_defnoreturn', { f: { NAME: name }, s: { STACK: body } }); }
  function procCall(name) { return B('procedures_callnoreturn', { m: '<mutation name="' + name + '"></mutation>' }); }

  var PLATFORM_LEVEL = [
    '..............................................',
    '..............................................',
    '..............................................',
    '...................*.*.*......................',
    '..................=======.............*.*.....',
    '.........*.*.................E.......=====....',
    '........=====..........==========.............',
    '.................................*.*..........',
    '...*.*.........*....E...........=====.........',
    '..=====......=====............................',
    '.P....................E.......^^.......E....D.',
    '##############...#############################',
    '##############...#############################',
    '##############################################',
    '##############################################'
  ].join('|');

  T.push({ id: 'plateforme', group: 'jeu', icon: '🍄', name: 'Jeu de plateforme', level: 'Complet', desc: 'Niveau dessiné en lettres, saut, caméra qui suit, pièces, ennemis qu\'on écrase, pics, vies, porte de sortie.',
    xml: function () {
      return workspace([start(
        set('score', n(0)), set('vies', n(3)),
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#1e88e5') } }),
        B('nx_scene_gradient', { v: { A: col('#1e88e5'), B: col('#ffcba4') } }),
        B('nx_level', { v: { TEXT: t(PLATFORM_LEVEL), T: n(40) } }),
        B('nx_sprite', { v: { NAME: t('joueur'), LOOK: emo('🐱'), X: B('nx_start_x'), Y: B('nx_start_y'), SIZE: n(34) } }),
        B('nx_control', { f: { TYPE: 'platform' }, v: { NAME: t('joueur'), SPEED: n(4), JUMP: n(13) } }),
        B('nx_camera_follow', { v: { NAME: t('joueur') } }),
        hud('⭐ ', get('score'), '   ❤️ ', get('vies')),
        collide('joueur', 'piece', seq(
          change('score', 1),
          B('nx_sound', { f: { S: 'piece' } }),
          B('nx_sprite_delete', { v: { NAME: other() } }),
          hud('⭐ ', get('score'), '   ❤️ ', get('vies')))),
        collide('joueur', 'ennemi', ifelse(
          cmp('LT', sget('y', 'joueur'), arith('MINUS', sget('y', other()), n(12))),
          seq(B('nx_explode', { v: { NAME: other(), C: col('#8e24aa') } }), B('nx_sprite_delete', { v: { NAME: other() } }),
            B('nx_jump', { v: { NAME: t('joueur'), F: n(9) } }), B('nx_sound', { f: { S: 'saut' } }), change('score', 5),
            hud('⭐ ', get('score'), '   ❤️ ', get('vies'))),
          procCall('blessure'))),
        collide('joueur', 'pic', procCall('blessure')),
        collide('joueur', 'sortie', ifelse(cmp('EQ', B('nx_group_count', { v: { G: t('piece') } }), n(0)),
          seq(B('nx_stop_timers'), B('nx_sound', { f: { S: 'victoire' } }), B('nx_alert', { v: { T: join('🏆 Niveau terminé ! Score : ', get('score')) } })),
          B('nx_toast', { v: { T: join('Ramasse encore ', B('nx_group_count', { v: { G: t('piece') } }), ' étoiles !') } }))),
        B('nx_frame', { s: { DO: ifelse(cmp('GT', sget('y', 'joueur'), n(590)), procCall('blessure')) } })
      ), procDef('blessure', seq(
          change('vies', -1),
          B('nx_shake', { v: { F: n(12) } }),
          B('nx_vibrate', { v: { MS: n(200) } }),
          B('nx_sprite_goto', { v: { NAME: t('joueur'), X: B('nx_start_x'), Y: B('nx_start_y') } }),
          hud('⭐ ', get('score'), '   ❤️ ', get('vies')),
          ifelse(cmp('LTE', get('vies'), n(0)), gameOver('GAME OVER'))))]);
    } });

  T.push({ id: 'shooter', group: 'jeu', icon: '🚀', name: 'Shoot\'em up spatial', level: 'Complet', desc: 'Tir automatique, vagues d\'ennemis de plus en plus rapides, explosions, record sauvegardé.',
    xml: function () {
      return workspace([start(
        set('score', n(0)),
        set('record', B('nx_load', { v: { KEY: t('record_espace'), DEF: n(0) } })),
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#000000') } }),
        B('nx_scene_gradient', { v: { A: col('#000000'), B: col('#1a237e') } }),
        B('nx_sprite', { v: { NAME: t('vaisseau'), LOOK: emo('🚀'), X: n(180), Y: n(530), SIZE: n(50) } }),
        B('nx_sprite_set', { f: { PROP: 'angle' }, v: { NAME: t('vaisseau'), VAL: n(-45) } }),
        B('nx_control', { f: { TYPE: 'topdown' }, v: { NAME: t('vaisseau'), SPEED: n(6), JUMP: n(0) } }),
        B('nx_frame', { s: { DO: B('nx_sprite_keep', { v: { NAME: t('vaisseau') } }) } }),
        B('nx_every', { v: { SEC: n(0.25) }, s: { DO:
          B('nx_spawn', { v: { LOOK: emo('🔥'), G: t('tir'), X: sget('x', 'vaisseau'), Y: arith('MINUS', sget('y', 'vaisseau'), n(30)), VX: n(0), VY: n(-12) } }) } }),
        B('nx_every', { v: { SEC: n(0.7) }, s: { DO:
          B('nx_spawn', { v: { LOOK: emo('👾'), G: t('ennemi'), X: B('math_random_int', { v: { FROM: n(20), TO: n(340) } }), Y: n(-20), VX: n(0), VY: arith('ADD', n(2), arith('DIVIDE', get('score'), n(8))) } }) } }),
        hud('Score : ', get('score'), '   Record : ', get('record')),
        collide('tir', 'ennemi', seq(
          B('nx_explode', { v: { NAME: other(), C: col('#fb8c00') } }),
          B('nx_sprite_delete', { v: { NAME: other() } }),
          B('nx_sprite_delete', { v: { NAME: B('nx_self') } }),
          B('nx_sound', { f: { S: 'explosion' } }),
          change('score', 1),
          hud('Score : ', get('score'), '   Record : ', get('record')))),
        collide('vaisseau', 'ennemi', seq(
          B('nx_explode', { v: { NAME: t('vaisseau'), C: col('#e53935') } }),
          B('nx_sprite_delete', { v: { NAME: t('vaisseau') } }),
          B('nx_shake', { v: { F: n(16) } }),
          B('nx_vibrate', { v: { MS: n(400) } }),
          ifelse(cmp('GT', get('score'), get('record')), B('nx_save', { v: { VAL: get('score'), KEY: t('record_espace') } })),
          gameOver('GAME OVER')))
      )]);
    } });

  var TOPDOWN_LEVEL = [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T.P....T.....*....M..T',
    'T..*...T..TTTTT......T',
    'T......T......T..*...T',
    'T..TTTTT..*...T......T',
    'T.........M...TTTT...T',
    'T..*...........K.T...T',
    'TTTTTT..TTTTT....T.*.T',
    'T....*..T...T....T...T',
    'T..M....T.*.T....TTDTT',
    'T.......T...T........T',
    'T..*..........*...M..T',
    'TTTTTTTTTTTTTTTTTTTTTT'
  ].join('|');

  T.push({ id: 'aventure', group: 'jeu', icon: '🧝', name: 'Aventure vue de dessus', level: 'Complet', desc: 'Exploration façon Zelda : forêt, pièces, fantômes, clé, porte, barre de vie.',
    xml: function () {
      return workspace([start(
        set('vie', n(100)), set('cle', B('logic_boolean', { f: { BOOL: 'FALSE' } })), set('score', n(0)),
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#7cb342') } }),
        B('nx_level', { v: { TEXT: t(TOPDOWN_LEVEL), T: n(48) } }),
        B('nx_sprite', { v: { NAME: t('joueur'), LOOK: emo('🧙'), X: B('nx_start_x'), Y: B('nx_start_y'), SIZE: n(38) } }),
        B('nx_control', { f: { TYPE: 'topdown' }, v: { NAME: t('joueur'), SPEED: n(3), JUMP: n(0) } }),
        B('nx_life_bar', { v: { NAME: t('joueur'), V: get('vie'), MAX: n(100) } }),
        B('nx_camera_follow', { v: { NAME: t('joueur') } }),
        hud('🪙 ', get('score'), '  🔑 ', B('logic_ternary', { v: { IF: get('cle'), THEN: t('oui'), ELSE: t('non') } })),
        collide('joueur', 'piece', seq(change('score', 1), B('nx_sound', { f: { S: 'piece' } }), B('nx_sprite_delete', { v: { NAME: other() } }),
          hud('🪙 ', get('score'), '  🔑 ', B('logic_ternary', { v: { IF: get('cle'), THEN: t('oui'), ELSE: t('non') } })))),
        collide('joueur', 'cle', seq(set('cle', B('logic_boolean', { f: { BOOL: 'TRUE' } })), B('nx_sprite_delete', { v: { NAME: other() } }), B('nx_sound', { f: { S: 'victoire' } }),
          B('nx_toast', { v: { T: t('🔑 Tu as trouvé la clé !') } }), hud('🪙 ', get('score'), '  🔑 oui'))),
        collide('joueur', 'ennemi', seq(change('vie', -25), B('nx_life_bar', { v: { NAME: t('joueur'), V: get('vie'), MAX: n(100) } }),
          B('nx_shake', { v: { F: n(8) } }), B('nx_vibrate', { v: { MS: n(150) } }),
          ifelse(cmp('LTE', get('vie'), n(0)), gameOver('Tu as perdu…')))),
        collide('joueur', 'sortie', ifelse(get('cle'),
          seq(B('nx_stop_timers'), B('nx_sound', { f: { S: 'victoire' } }), B('nx_alert', { v: { T: join('🏆 Gagné avec ', get('score'), ' pièces !') } })),
          B('nx_toast', { v: { T: t('🚪 Fermé… il faut la clé !') } })))
      )]);
    } });

  T.push({ id: 'bagarre', group: 'jeu', icon: '🥷', name: 'Bagarre en 2.5D', level: 'Complet', desc: 'Perspective 2.5D, ombres, saut en hauteur, zombies qui te poursuivent, attaque au toucher.',
    xml: function () {
      return workspace([start(
        set('vie', n(100)), set('ko', n(0)),
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#ff8a65') } }),
        B('nx_scene_gradient', { v: { A: col('#ff7043'), B: col('#ffe0b2') } }),
        B('nx_mode25', { v: { H: n(250), C: col('#6d4c41') } }),
        B('nx_sprite', { v: { NAME: t('joueur'), LOOK: emo('🥷'), X: n(90), Y: n(450), SIZE: n(80) } }),
        B('nx_control', { f: { TYPE: 'beat' }, v: { NAME: t('joueur'), SPEED: n(4), JUMP: n(11) } }),
        B('nx_life_bar', { v: { NAME: t('joueur'), V: get('vie'), MAX: n(100) } }),
        B('nx_frame', { s: { DO: B('nx_sprite_keep', { v: { NAME: t('joueur') } }) } }),
        hud('👊 Touche pour frapper · KO : ', get('ko')),
        B('nx_every', { v: { SEC: n(2) }, s: { DO: seq(
          B('nx_spawn', { v: { LOOK: emo('🧟'), G: t('ennemi'), X: n(400), Y: B('math_random_int', { v: { FROM: n(280), TO: n(580) } }), VX: n(0), VY: n(0) } }),
          B('nx_sprite_set', { f: { PROP: 'size' }, v: { NAME: B('nx_last_spawned'), VAL: n(76) } }),
          B('nx_chase', { v: { NAME: B('nx_last_spawned'), T: t('joueur'), SPEED: n(1.3) } })) } }),
        B('nx_on_tap', { s: { DO: seq(
          B('nx_sound', { f: { S: 'clic' } }),
          B('nx_for_each_group', { v: { G: t('ennemi') }, s: { DO:
            ifelse(cmp('LT', B('nx_distance', { v: { A: t('joueur'), B: B('nx_current_sprite') } }), n(90)), seq(
              B('nx_explode', { v: { NAME: B('nx_current_sprite'), C: col('#43a047') } }),
              B('nx_sprite_delete', { v: { NAME: B('nx_current_sprite') } }),
              B('nx_sound', { f: { S: 'explosion' } }),
              change('ko', 1),
              hud('👊 Touche pour frapper · KO : ', get('ko')))) } })) } }),
        collide('ennemi', 'joueur', seq(change('vie', -10), B('nx_life_bar', { v: { NAME: t('joueur'), V: get('vie'), MAX: n(100) } }),
          B('nx_shake', { v: { F: n(10) } }), B('nx_sprite_change', { f: { PROP: 'x' }, v: { NAME: B('nx_self'), VAL: n(80) } }),
          ifelse(cmp('LTE', get('vie'), n(0)), gameOver('K.O. !'))))
      )]);
    } });

  var MAZE = [
    '################',
    '#P...#.....#...#',
    '#.##.#.###.#.#*#',
    '#.#*...#...#.#.#',
    '#.####.#.###.#.#',
    '#......#...M.#.#',
    '###.######.###.#',
    '#*..#....#.....#',
    '#.###.##.####.##',
    '#...M..#....*.D#',
    '################'
  ].join('|');

  T.push({ id: 'labyrinthe3d', group: 'jeu', icon: '🧱', name: 'Labyrinthe 3D', level: 'Complet', desc: 'Vraie 3D à la première personne : trouve les étoiles, évite les fantômes, atteins la porte.',
    xml: function () {
      return workspace([start(
        set('etoiles', n(0)),
        B('nx_background', { v: { C: col('#000000') } }),
        B('nx_scene', { v: { W: n(360), H: n(600), C: col('#000000') } }),
        B('nx_maze', { v: { TEXT: t(MAZE), SKY: col('#4fc3f7'), GROUND: col('#3e2723') } }),
        B('nx_minimap', { f: { ON: 'TRUE' } }),
        hud('⭐ ', get('etoiles'), ' / 4   — trouve la porte 🚪'),
        collide('joueur', 'piece', seq(change('etoiles', 1), B('nx_sound', { f: { S: 'piece' } }), B('nx_sprite_delete', { v: { NAME: other() } }),
          hud('⭐ ', get('etoiles'), ' / 4   — trouve la porte 🚪'))),
        collide('joueur', 'ennemi', seq(B('nx_sound', { f: { S: 'alarme' } }), B('nx_vibrate', { v: { MS: n(300) } }), B('nx_toast', { v: { T: t('👻 BOUH ! Retour au départ') } }),
          B('nx_sprite_goto', { v: { NAME: t('joueur'), X: n(96), Y: n(96) } }))),
        collide('joueur', 'sortie', ifelse(cmp('EQ', B('nx_group_count', { v: { G: t('piece') } }), n(0)),
          seq(B('nx_stop_timers'), B('nx_sound', { f: { S: 'victoire' } }), B('nx_alert', { v: { T: t('🏆 Tu es sorti du labyrinthe !') } })),
          B('nx_toast', { v: { T: t('Il te manque des étoiles ⭐') } })))
      )]);
    } });

  /* ===================== Applications complètes ===================== */
  T.push({ id: 'multiapp', group: 'app', icon: '📲', name: 'App à plusieurs écrans', level: 'Complet', desc: 'Barre de titre, onglets en bas, 3 écrans, cartes, navigation, profil sauvegardé.',
    xml: function () {
      function cardImg(seed, title, text, page) {
        return B('nx_card', { f: { ID: '' }, v: { IMG: t('https://picsum.photos/seed/' + seed + '/600/300'), T: t(title), TXT: t(text) }, s: { DO: page ? B('nx_go_page', { f: { NAME: page } }) : B('nx_toast', { v: { T: t(title) } }) } });
      }
      return workspace([start(
        B('nx_theme', { f: { T: 'clair' } }),
        B('nx_app_bar', { v: { T: t('Ma super app'), C: col('#ffcc22') } }),
        B('nx_tab_bar', { v: { SPEC: t('Accueil:🏠,Galerie:🖼️,Profil:👤') } }),
        B('nx_page', { f: { NAME: 'Accueil' }, s: { DO: seq(
          B('nx_heading', { f: { LEVEL: '2', ID: '' }, v: { T: join('Bonjour ', B('nx_load', { v: { KEY: t('prenom'), DEF: t('toi') } }), ' 👋') } }),
          B('nx_text', { f: { ID: '' }, v: { T: t('Bienvenue dans ton application. Touche une carte !') } }),
          cardImg('nature', '🖼️ Voir la galerie', 'Des images magnifiques', 'Galerie'),
          cardImg('profil', '👤 Mon profil', 'Change ton prénom', 'Profil'),
          B('nx_button', { f: { ID: '' }, v: { LABEL: t('📤 Partager l\'app') }, s: { DO: B('nx_share', { v: { T: t('Regarde mon app faite avec NOCODEX !') } }) } })) } }),
        B('nx_page', { f: { NAME: 'Galerie' }, s: { DO: seq(
          B('nx_heading', { f: { LEVEL: '2', ID: '' }, v: { T: t('🖼️ Galerie') } }),
          cardImg('montagne', 'Montagne', 'Les Alpes au lever du soleil'),
          cardImg('ocean', 'Océan', 'Vagues et horizon'),
          cardImg('ville', 'Ville', 'Lumières de la nuit')) } }),
        B('nx_page', { f: { NAME: 'Profil' }, s: { DO: seq(
          B('nx_heading', { f: { LEVEL: '2', ID: '' }, v: { T: t('👤 Mon profil') } }),
          B('nx_input', { f: { ID: 'prenom', TYPE: 'text' }, v: { PH: t('Ton prénom') } }),
          B('nx_set_value', { f: { ID: 'prenom' }, v: { VAL: B('nx_load', { v: { KEY: t('prenom'), DEF: t('') } }) } }),
          B('nx_button', { f: { ID: '' }, v: { LABEL: t('💾 Enregistrer') }, s: { DO: seq(
            B('nx_save', { v: { VAL: B('nx_value', { f: { ID: 'prenom' } }), KEY: t('prenom') } }),
            B('nx_toast', { v: { T: t('Enregistré ✔') } }),
            B('nx_go_page', { f: { NAME: 'Accueil' } })) } })) } })
      )]);
    } });

  T.push({ id: 'contacts', group: 'app', icon: '📇', name: 'Carnet de contacts', level: 'Complet', desc: 'Vraie base de données : ajouter, chercher, tableau, détails au toucher, tout effacer.',
    xml: function () {
      return workspace([start(
        B('nx_theme', { f: { T: 'ocean' } }),
        B('nx_app_bar', { v: { T: t('📇 Mes contacts'), C: col('#1e88e5') } }),
        B('nx_input', { f: { ID: 'nom', TYPE: 'text' }, v: { PH: t('Nom') } }),
        B('nx_input', { f: { ID: 'tel', TYPE: 'text' }, v: { PH: t('Téléphone') } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('＋ Ajouter') }, s: { DO: seq(
          B('nx_db_add', { v: { ITEM: B('nx_obj', { f: { K1: 'nom', K2: 'téléphone', K3: '' }, v: { V1: B('nx_value', { f: { ID: 'nom' } }), V2: B('nx_value', { f: { ID: 'tel' } }) } }), C: t('contacts') } }),
          B('nx_set_value', { f: { ID: 'nom' }, v: { VAL: t('') } }),
          B('nx_set_value', { f: { ID: 'tel' }, v: { VAL: t('') } }),
          B('nx_table', { f: { ID: 'tableau' }, v: { L: B('nx_db_all', { v: { C: t('contacts') } }) } }),
          B('nx_toast', { v: { T: t('Contact ajouté ✔') } })) } }),
        B('nx_input', { f: { ID: 'cherche', TYPE: 'text' }, v: { PH: t('🔎 Chercher un nom…') } }),
        B('nx_on_change', { f: { ID: 'cherche' }, s: { DO:
          B('nx_table', { f: { ID: 'tableau' }, v: { L: B('nx_db_find', { v: { C: t('contacts'), K: t('nom'), V: B('nx_value', { f: { ID: 'cherche' } }) } }) } }) } }),
        B('nx_table', { f: { ID: 'tableau' }, v: { L: B('nx_db_all', { v: { C: t('contacts') } }) } }),
        B('nx_on_table', { f: { ID: 'tableau' }, s: { DO:
          B('nx_alert', { v: { T: join('📞 ', B('nx_get_prop', { v: { O: B('nx_clicked_item'), K: t('nom') } }), ' : ', B('nx_get_prop', { v: { O: B('nx_clicked_item'), K: t('téléphone') } })) } }) } }),
        B('nx_button', { f: { ID: '' }, v: { LABEL: t('🗑️ Tout effacer') }, s: { DO:
          ifelse(B('nx_confirm', { v: { Q: t('Effacer tous les contacts') } }), seq(
            B('nx_db_clear', { v: { C: t('contacts') } }),
            B('nx_table', { f: { ID: 'tableau' }, v: { L: B('nx_db_all', { v: { C: t('contacts') } }) } }))) } })
      )]);
    } });

  T.push({ id: 'depenses', group: 'app', icon: '📊', name: 'Suivi de dépenses', level: 'Complet', desc: 'Base de données + tableau + graphique + total, avec une fonction réutilisable.',
    xml: function () {
      return workspace([
        start(
          B('nx_theme', { f: { T: 'sombre' } }),
          B('nx_app_bar', { v: { T: t('💶 Mes dépenses'), C: col('#43a047') } }),
          B('nx_box', { f: { ID: 'saisie', LAYOUT: 'row' }, s: { DO: seq(
            B('nx_input', { f: { ID: 'quoi', TYPE: 'text' }, v: { PH: t('Quoi ?') } }),
            B('nx_input', { f: { ID: 'combien', TYPE: 'number' }, v: { PH: t('€') } })) } }),
          B('nx_button', { f: { ID: '' }, v: { LABEL: t('＋ Ajouter la dépense') }, s: { DO: seq(
            B('nx_db_add', { v: { ITEM: B('nx_obj', { f: { K1: 'quoi', K2: 'montant', K3: '' }, v: { V1: B('nx_value', { f: { ID: 'quoi' } }), V2: B('nx_number_of', { f: { ID: 'combien' } }) } }), C: t('depenses') } }),
            procCall('rafraichir')) } }),
          B('nx_heading', { f: { LEVEL: '2', ID: 'total' }, v: { T: t('Total : 0 €') } }),
          B('nx_chart', { f: { TYPE: 'bar', ID: 'graph' }, v: { V: t(''), L: t('') } }),
          B('nx_table', { f: { ID: 'tableau' }, v: { L: B('lists_create_with', { m: '<mutation items="0"></mutation>' }) } }),
          B('nx_button', { f: { ID: '' }, v: { LABEL: t('🗑️ Remettre à zéro') }, s: { DO: seq(B('nx_db_clear', { v: { C: t('depenses') } }), procCall('rafraichir')) } }),
          procCall('rafraichir')),
        procDef('rafraichir', seq(
          set('montants', B('lists_create_with', { m: '<mutation items="0"></mutation>' })),
          set('noms', B('lists_create_with', { m: '<mutation items="0"></mutation>' })),
          B('controls_forEach', { f: { VAR: V('d') }, v: { LIST: B('nx_db_all', { v: { C: t('depenses') } }) }, s: { DO: seq(
            B('lists_setIndex', { m: '<mutation at="false"></mutation>', f: { MODE: 'INSERT', WHERE: 'LAST' }, v: { LIST: get('montants'), TO: B('nx_get_prop', { v: { O: get('d'), K: t('montant') } }) } }),
            B('lists_setIndex', { m: '<mutation at="false"></mutation>', f: { MODE: 'INSERT', WHERE: 'LAST' }, v: { LIST: get('noms'), TO: B('nx_get_prop', { v: { O: get('d'), K: t('quoi') } }) } })) } }),
          B('nx_table', { f: { ID: 'tableau' }, v: { L: B('nx_db_all', { v: { C: t('depenses') } }) } }),
          B('nx_chart', { f: { TYPE: 'bar', ID: 'graph' }, v: { V: get('montants'), L: get('noms') } }),
          B('nx_set_text', { f: { ID: 'total' }, v: { T: join('Total : ', B('nx_format', { v: { N: B('math_on_list', { f: { OP: 'SUM' }, v: { LIST: get('montants') } }), D: n(2) } }), ' €') } })))
      ]);
    } });

  var GROUP_OF = { vide: 'apprendre', bonjour: 'apprendre', compteur: 'jeu', calculatrice: 'app', devine: 'jeu', taches: 'app', jeu: 'jeu', balle: 'jeu',
    dessin: 'apprendre', quiz: 'jeu', api: 'app', horloge: 'app', piano: 'app', profil: 'apprendre', meteo: 'app', html: 'apprendre' };
  T.forEach(function (x) { if (!x.group) x.group = GROUP_OF[x.id] || 'apprendre'; });
  // Les jeux et apps complets en premier.
  T.sort(function (a, b) { return (a.level === 'Complet' ? 0 : 1) - (b.level === 'Complet' ? 0 : 1); });

  window.NXTemplates = { list: T, byId: function (id) { return T.filter(function (x) { return x.id === id; })[0]; } };
})();
