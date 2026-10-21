/*
 * NOCODEX — définition des blocs, de leur explication et du code généré
 * dans 5 langages (JavaScript, Python, PHP, Lua, Dart).
 *
 * Chaque bloc est décrit une seule fois dans NX_BLOCKS ; on en déduit :
 *   - la forme du bloc Blockly,
 *   - l'info-bulle et la fiche de l'encyclopédie,
 *   - le bloc prêt à l'emploi (avec valeurs par défaut) dans la boîte à outils,
 *   - le code dans chaque langage.
 */
(function () {
  'use strict';

  /* ---------- Petites fonctions pour décrire les paramètres ---------- */
  function V(name, type, def) { return { k: 'V', name: name, type: type, def: def }; } // case à remplir avec un bloc
  function F(name, def) { return { k: 'F', name: name, def: def }; }                  // champ de texte
  function D(name, options) { return { k: 'D', name: name, options: options }; }      // menu (valeur texte)
  function R(name, options) { return { k: 'R', name: name, options: options }; }      // menu (valeur brute : oui/non)
  function S(name) { return { k: 'S', name: name || 'DO' }; }                         // blocs à exécuter plus tard

  var YESNO = [['oui', 'TRUE'], ['non', 'FALSE']];
  var KEYS = [['← flèche gauche', 'left'], ['→ flèche droite', 'right'], ['↑ flèche haut', 'up'], ['↓ flèche bas', 'down'],
    ['espace / bouton A', 'space'], ['entrée', 'enter'], ['n\'importe laquelle', 'any']]
    .concat('abcdefghijklmnopqrstuvwxyz0123456789'.split('').map(function (c) { return [c.toUpperCase(), c]; }));

  var CATS = {
    events: { name: 'Événements', icon: '⚡', colour: '#FFAB19', help: 'Le point de départ : QUAND faire les choses (au démarrage, quand on clique, toutes les X secondes…).' },
    ui: { name: 'Écran', icon: '📱', colour: '#4C97FF', help: 'Tout ce qui s\'affiche : textes, boutons, champs, images, listes, couleurs, messages…' },
    game: { name: 'Jeux & Dessin', icon: '🎮', colour: '#9966FF', help: 'Créer des jeux : une scène, des personnages (sprites), des collisions, un score, des dessins.' },
    sound: { name: 'Sons & Voix', icon: '🔊', colour: '#CF63CF', help: 'Faire du bruit : bips, notes de musique, effets, sons depuis Internet, voix qui parle.' },
    time: { name: 'Temps', icon: '⏱️', colour: '#5CB1D6', help: 'L\'heure, la date, un chronomètre.' },
    data: { name: 'Données & Web', icon: '🌐', colour: '#59C059', help: 'Sauvegarder dans le téléphone, télécharger depuis Internet (API), JSON, partager, copier.' },
    device: { name: 'Appareil', icon: '📍', colour: '#FF8C1A', help: 'Le téléphone : vibration, GPS, caméra, plein écran, taille de l\'écran.' },
    pages: { name: 'Écrans & navigation', icon: '🗂️', colour: '#3D7BD9', help: 'Pour les vraies apps : plusieurs écrans, barre de titre, onglets en bas, cartes, thèmes, animations.' },
    control: { name: 'Contrôles & physique', icon: '🕹️', colour: '#7B4FE0', help: 'Rendre un sprite jouable en UN bloc, sauts, gravité, caméra qui suit, pause.' },
    collide: { name: 'Collisions & groupes', icon: '💥', colour: '#C2185B', help: 'Quand deux sprites se touchent, faire apparaître des tirs/ennemis, gérer des groupes, explosions.' },
    world: { name: 'Niveaux, 2.5D & 3D', icon: '🏰', colour: '#00897B', help: 'Dessiner des niveaux avec des lettres, perspective 2.5D, labyrinthe 3D, fonds qui défilent.' },
    db: { name: 'Base de données', icon: '🗃️', colour: '#2E7D32', help: 'Fiches (contacts, produits…), base de données dans le téléphone, tableaux et graphiques.' },
    code: { name: 'Code avancé', icon: '🧩', colour: '#5B5B73', help: 'Pour aller plus loin : écrire directement du JavaScript, du HTML ou du CSS dans un bloc.' }
  };

  var COLORS = [['🔴 rouge', '#e53935'], ['🟠 orange', '#fb8c00'], ['🟡 jaune', '#fdd835'], ['🟢 vert', '#43a047'],
    ['🔵 bleu', '#1e88e5'], ['🟣 violet', '#8e24aa'], ['🟤 marron', '#6d4c41'], ['⚫ noir', '#000000'], ['⚪ blanc', '#ffffff'],
    ['🩶 gris', '#9e9e9e'], ['🩷 rose', '#ec407a'], ['🩵 cyan', '#00bcd4'], ['🌑 nuit', '#101820'], ['🌕 or NOCODEX', '#ffcc22'],
    ['🌿 menthe', '#a5f2c8'], ['🍑 pêche', '#ffcba4'], ['🌌 bleu nuit', '#1a237e'], ['💧 transparent', 'transparent']];
  var EMOJIS = '🐱 🐶 🐸 🐵 🦊 🐼 🐧 🐢 🐟 🦖 🐉 🦄 🐝 🦋 👾 🤖 👻 👽 🧙 🦸 🥷 🧟 🚀 🛸 ✈️ 🚗 🏎️ 🚲 ⚽ 🏀 🎾 ⭐ 🌟 💎 🪙 💰 ❤️ 💣 🔥 💥 ⚡ 🍎 🍌 🍓 🍕 🍔 🍩 🌵 🌳 🌴 🪨 🧱 🏠 🏰 ☁️ 🌙 ☀️ 🌈 🎈 🎁 🏆 🎯 🔑 🗡️ 🛡️ 🟥 🟦 🟩 🟨 ⬛ ⬜ 🔴 🔵 🟢 🟡'.split(' ');

  var STYLE_PROPS = [['couleur du texte', 'color'], ['couleur de fond', 'background'], ['taille du texte', 'fontSize'],
    ['largeur', 'width'], ['hauteur', 'height'], ['marge extérieure', 'margin'], ['marge intérieure', 'padding'],
    ['arrondi des coins', 'borderRadius'], ['épaisseur (gras)', 'fontWeight'], ['opacité 0-1', 'opacity'],
    ['bordure', 'border'], ['police', 'fontFamily'], ['alignement', 'textAlign'], ['ombre', 'boxShadow'],
    ['transformation', 'transform'], ['affichage', 'display']];

  /* ---------- Catalogue des blocs ---------- */
  var NX_BLOCKS = [
    // ===== Événements =====
    { cat: 'events', type: 'nx_start', hat: true, msg: '🚀 quand l\'application démarre %1', args: [S()], gen: 'body',
      help: 'Les blocs placés ici s\'exécutent dès l\'ouverture de l\'app. (Les blocs posés seuls s\'exécutent aussi au démarrage, ce bloc sert surtout à bien ranger.)' },
    { cat: 'events', type: 'nx_on_click', msg: 'quand on clique sur l\'élément %1 %2', args: [F('ID', 'monBouton'), S()], call: 'onClick',
      help: 'Exécute des blocs quand on touche l\'élément qui porte cet identifiant (id).' },
    { cat: 'events', type: 'nx_on_change', msg: 'quand l\'élément %1 change %2', args: [F('ID', 'nom'), S()], call: 'onChange',
      help: 'Se déclenche à chaque modification d\'un champ, d\'un curseur ou d\'une case à cocher.' },
    { cat: 'events', type: 'nx_every', msg: 'toutes les %1 secondes faire %2', args: [V('SEC', 'Number', 1), S()], call: 'every',
      help: 'Répète les blocs en boucle, à intervalle régulier. Ex : une horloge, un compte à rebours, un ennemi qui apparaît.' },
    { cat: 'events', type: 'nx_after', msg: 'après %1 secondes faire %2', args: [V('SEC', 'Number', 2), S()], call: 'after',
      help: 'Attend un peu puis exécute les blocs, une seule fois.' },
    { cat: 'events', type: 'nx_frame', msg: '🎬 à chaque image (60 fois par seconde) %1', args: [S()], call: 'everyFrame',
      help: 'La boucle de jeu : tout ce qui est dedans est répété environ 60 fois par seconde. Idéal pour déplacer les personnages.' },
    { cat: 'events', type: 'nx_on_key', msg: 'quand la touche %1 est pressée %2', args: [D('KEY', KEYS), S()], call: 'onKey',
      help: 'Réagit au clavier (ordinateur) ou à la manette tactile affichée à l\'écran.' },
    { cat: 'events', type: 'nx_on_tap', msg: 'quand on touche la scène %1', args: [S()], call: 'onTap',
      help: 'Réagit quand on touche la scène de jeu. Utilise "x du toucher" et "y du toucher" pour savoir où.' },
    { cat: 'events', type: 'nx_on_sprite_tap', msg: 'quand on touche le sprite %1 %2', args: [V('NAME', 'String', 'chat'), S()], call: 'onSpriteTap',
      help: 'Réagit quand on touche un personnage précis. Le sprite doit déjà être créé.' },
    { cat: 'events', type: 'nx_on_list', msg: 'quand on touche un élément de la liste %1 %2', args: [F('ID', 'maListe'), S()], call: 'onListClick',
      help: 'Réagit au toucher d\'une ligne de liste. Utilise "élément de liste touché" pour savoir laquelle.' },
    { cat: 'events', type: 'nx_stop_timers', msg: '⏹ arrêter les répétitions et la boucle de jeu', call: 'stopTimers',
      help: 'Stoppe tous les "toutes les X secondes", "après X secondes" et "à chaque image". Pratique pour un Game Over.' },

    // ===== Écran =====
    { cat: 'ui', type: 'nx_title', msg: 'nom de la page %1', args: [V('T', 'String', 'Mon application')], call: 'setTitle',
      help: 'Le titre de la fenêtre / de l\'onglet du navigateur.' },
    { cat: 'ui', type: 'nx_heading', msg: 'gros titre %1 niveau %2 id %3', args: [V('T', 'String', 'Bienvenue !'), D('LEVEL', [['1 (énorme)', '1'], ['2 (grand)', '2'], ['3 (moyen)', '3'], ['4 (petit)', '4']]), F('ID', '')], call: 'heading',
      help: 'Affiche un titre. Le niveau 1 est le plus gros. L\'id (facultatif) permet de le modifier plus tard.' },
    { cat: 'ui', type: 'nx_text', msg: 'afficher le texte %1 id %2', args: [V('T', 'String', 'Bonjour le monde !'), F('ID', '')], call: 'text',
      help: 'Ajoute un paragraphe de texte à l\'écran. Tu peux y mettre un nombre, une variable, un calcul…' },
    { cat: 'ui', type: 'nx_button', msg: 'bouton %1 id %2 quand on clique %3', args: [V('LABEL', 'String', 'Clique-moi'), F('ID', ''), S()], params: ['LABEL', 'DO', 'ID'], call: 'button',
      help: 'Crée un bouton. Les blocs à l\'intérieur s\'exécutent à chaque clic.' },
    { cat: 'ui', type: 'nx_input', msg: 'champ de saisie id %1 indice %2 type %3', args: [F('ID', 'nom'), V('PH', 'String', 'Écris ici…'),
      D('TYPE', [['texte', 'text'], ['nombre', 'number'], ['mot de passe', 'password'], ['e-mail', 'email'], ['date', 'date'], ['heure', 'time'], ['couleur', 'color'], ['grand texte', 'textarea']])], call: 'input',
      help: 'Une zone où l\'utilisateur peut écrire. Récupère ce qu\'il a écrit avec "valeur de".' },
    { cat: 'ui', type: 'nx_slider', msg: 'curseur id %1 de %2 à %3 valeur %4', args: [F('ID', 'volume'), V('MIN', 'Number', 0), V('MAX', 'Number', 100), V('VAL', 'Number', 50)], call: 'slider',
      help: 'Une barre à faire glisser pour choisir un nombre.' },
    { cat: 'ui', type: 'nx_checkbox', msg: 'case à cocher id %1 texte %2', args: [F('ID', 'accord'), V('LABEL', 'String', 'J\'accepte')], call: 'checkbox',
      help: 'Une case oui/non. "valeur de" renvoie vrai si elle est cochée.' },
    { cat: 'ui', type: 'nx_select', msg: 'menu de choix id %1 options %2', args: [F('ID', 'choix'), V('OPTIONS', null, 'Rouge,Vert,Bleu')], call: 'select',
      help: 'Une liste déroulante. Mets les choix séparés par des virgules, ou une liste.' },
    { cat: 'ui', type: 'nx_value', msg: 'valeur de %1', args: [F('ID', 'nom')], out: null, call: 'valueOf',
      help: 'Ce que contient un champ, un curseur, une case, un menu, ou le texte d\'un élément.' },
    { cat: 'ui', type: 'nx_number_of', msg: 'nombre écrit dans %1', args: [F('ID', 'nom')], out: 'Number', call: 'numberOf',
      help: 'Comme "valeur de" mais transforme toujours en nombre (pour faire des calculs).' },
    { cat: 'ui', type: 'nx_set_value', msg: 'mettre la valeur de %1 à %2', args: [F('ID', 'nom'), V('VAL', null, '')], call: 'setValue',
      help: 'Change le contenu d\'un champ, d\'un curseur, d\'une case ou d\'un texte.' },
    { cat: 'ui', type: 'nx_set_text', msg: 'changer le texte de %1 en %2', args: [F('ID', 'score'), V('T', 'String', 'Nouveau texte')], call: 'setText',
      help: 'Remplace le texte d\'un élément existant (titre, texte, bouton…) grâce à son id.' },
    { cat: 'ui', type: 'nx_get_text', msg: 'texte de l\'élément %1', args: [F('ID', 'score')], out: 'String', call: 'getText',
      help: 'Lit le texte affiché dans un élément.' },
    { cat: 'ui', type: 'nx_image', msg: 'image %1 largeur %2 id %3', args: [V('SRC', 'String', 'https://picsum.photos/400/250'), V('W', 'Number', 300), F('ID', '')], call: 'image',
      help: 'Affiche une image depuis une adresse Internet (ou une image ajoutée dans les médias du projet).' },
    { cat: 'ui', type: 'nx_video', msg: 'vidéo %1 id %2', args: [V('SRC', 'String', 'https://www.w3schools.com/html/mov_bbb.mp4'), F('ID', '')], call: 'video',
      help: 'Affiche un lecteur vidéo (fichier .mp4).' },
    { cat: 'ui', type: 'nx_youtube', msg: 'vidéo YouTube code %1', args: [V('VID', 'String', 'dQw4w9WgXcQ')], call: 'youtube',
      help: 'Intègre une vidéo YouTube. Le code est la fin de l\'adresse (après v=).' },
    { cat: 'ui', type: 'nx_link', msg: 'lien %1 vers %2', args: [V('LABEL', 'String', 'Mon site'), V('URL', 'String', 'https://example.com')], call: 'link',
      help: 'Un lien cliquable qui ouvre une page web.' },
    { cat: 'ui', type: 'nx_list', msg: 'afficher la liste %1 id %2', args: [V('ITEMS', null), F('ID', 'maListe')], params: ['ID', 'ITEMS'], call: 'list',
      help: 'Affiche une liste à puces. Si l\'id existe déjà, la liste est mise à jour.' },
    { cat: 'ui', type: 'nx_clicked_item', msg: 'élément de liste touché', out: 'String', prop: 'clickedItem',
      help: 'Le texte de la ligne touchée (à utiliser dans "quand on touche un élément de la liste").' },
    { cat: 'ui', type: 'nx_clicked_index', msg: 'numéro de l\'élément touché', out: 'Number', prop: 'clickedIndex',
      help: 'La position (1, 2, 3…) de la ligne touchée.' },
    { cat: 'ui', type: 'nx_box', msg: 'boîte %1 disposition %2 %3', args: [F('ID', 'boite1'), D('LAYOUT', [['en colonne', 'column'], ['en ligne', 'row'], ['carte', 'card']]), S()], params: ['ID', 'DO', 'LAYOUT'], call: 'box',
      help: 'Regroupe des éléments. "En ligne" les met côte à côte, "carte" fait un joli cadre.' },
    { cat: 'ui', type: 'nx_separator', msg: '── ligne de séparation', call: 'separator', help: 'Une ligne horizontale.' },
    { cat: 'ui', type: 'nx_space', msg: 'espace vide de %1 pixels', args: [V('PX', 'Number', 20)], call: 'space', help: 'Ajoute de l\'espace vertical.' },
    { cat: 'ui', type: 'nx_clear', msg: '🧽 effacer tout l\'écran', call: 'clear', help: 'Retire tous les éléments affichés (pour changer de "page").' },
    { cat: 'ui', type: 'nx_clear_el', msg: 'vider le contenu de %1', args: [F('ID', 'boite1')], call: 'clear', help: 'Vide une boîte ou un élément.' },
    { cat: 'ui', type: 'nx_remove', msg: 'supprimer l\'élément %1', args: [F('ID', 'monBouton')], call: 'remove', help: 'Retire un élément de l\'écran.' },
    { cat: 'ui', type: 'nx_show', msg: '%1 l\'élément %2', args: [R('VIS', [['afficher', 'TRUE'], ['cacher', 'FALSE']]), F('ID', 'monBouton')], params: ['ID', 'VIS'], call: 'show',
      help: 'Cache ou ré-affiche un élément sans le supprimer.' },
    { cat: 'ui', type: 'nx_background', msg: 'couleur de fond %1', args: [V('C', 'Colour', '#101820')], call: 'background', help: 'La couleur de fond de toute la page.' },
    { cat: 'ui', type: 'nx_text_color', msg: 'couleur du texte %1', args: [V('C', 'Colour', '#ffffff')], call: 'textColor', help: 'La couleur par défaut des textes.' },
    { cat: 'ui', type: 'nx_font', msg: 'police %1', args: [D('FONT', [['moderne', 'system-ui, sans-serif'], ['ronde', '"Comic Sans MS", cursive'], ['machine à écrire', 'monospace'], ['élégante', 'Georgia, serif'], ['impact', 'Impact, sans-serif']])], call: 'font',
      help: 'Change la police d\'écriture de toute l\'app.' },
    { cat: 'ui', type: 'nx_align', msg: 'aligner le contenu %1', args: [D('A', [['au centre', 'center'], ['à gauche', 'left'], ['à droite', 'right']])], call: 'align', help: 'Centre ou aligne tous les éléments.' },
    { cat: 'ui', type: 'nx_style', msg: 'style de %1 : %2 = %3', args: [F('ID', 'monBouton'), D('PROP', STYLE_PROPS), V('VAL', null, 'red')], call: 'style',
      help: 'Change l\'apparence d\'un élément (couleur, taille, arrondi…). Un nombre est compris en pixels. Utilise l\'id "page" pour toute la page.' },
    { cat: 'ui', type: 'nx_alert', msg: '💬 message %1', args: [V('T', 'String', 'Bravo !')], call: 'alert', help: 'Affiche une fenêtre avec un message et un bouton OK.' },
    { cat: 'ui', type: 'nx_toast', msg: 'petite notification %1', args: [V('T', 'String', 'Enregistré !')], call: 'toast', help: 'Un message discret qui disparaît tout seul.' },
    { cat: 'ui', type: 'nx_ask', msg: 'demander %1', args: [V('Q', 'String', 'Comment tu t\'appelles ?')], out: 'String', call: 'ask', help: 'Pose une question et renvoie la réponse écrite.' },
    { cat: 'ui', type: 'nx_ask_number', msg: 'demander un nombre %1', args: [V('Q', 'String', 'Quel âge as-tu ?')], out: 'Number', call: 'askNumber', help: 'Pose une question et renvoie un nombre.' },
    { cat: 'ui', type: 'nx_confirm', msg: 'confirmer %1 ?', args: [V('Q', 'String', 'Rejouer')], out: 'Boolean', call: 'confirm', help: 'Demande OK / Annuler. Renvoie vrai ou faux.' },
    { cat: 'ui', type: 'nx_color', msg: 'couleur %1', args: [D('C', COLORS)], out: 'String', gen: 'color', help: 'Choisis une couleur dans la liste.' },
    { cat: 'ui', type: 'nx_color_hex', msg: 'couleur code %1', args: [F('C', '#ffcc22')], out: 'String', gen: 'color', help: 'Une couleur précise en code hexadécimal (#RRVVBB) ou en nom anglais (red, gold…).' },
    { cat: 'ui', type: 'nx_rgb', msg: 'couleur rouge %1 vert %2 bleu %3', args: [V('R', 'Number', 255), V('G', 'Number', 120), V('B', 'Number', 0)], out: 'String', call: 'rgb', help: 'Mélange rouge, vert et bleu (0 à 255 chacun).' },
    { cat: 'ui', type: 'nx_media', msg: '🖼️ mon média %1', args: [D('M', [['(ajoute un média dans ⚙️)', '']])], out: 'String', gen: 'media',
      help: 'Une image ou un son que TU as ajouté au projet (⚙️ Réglages → Médias). Utilise-le dans « image », « apparence » d\'un sprite ou « jouer le son ».' },
    { cat: 'ui', type: 'nx_random_color', msg: 'couleur au hasard', out: 'String', call: 'randomColor', help: 'Une couleur vive au hasard.' },

    // ===== Jeux & dessin =====
    { cat: 'game', type: 'nx_scene', msg: '🎮 créer une scène largeur %1 hauteur %2 couleur %3', args: [V('W', 'Number', 360), V('H', 'Number', 600), V('C', 'Colour', '#1a237e')], call: 'scene',
      help: 'La zone de jeu (un "canvas"). Les sprites et les dessins s\'affichent dedans. x va de gauche à droite, y de haut en bas.' },
    { cat: 'game', type: 'nx_scene_color', msg: 'couleur de la scène %1', args: [V('C', 'Colour', '#000000')], call: 'sceneColor', help: 'Change la couleur de fond de la scène.' },
    { cat: 'game', type: 'nx_sprite', msg: 'créer le sprite %1 apparence %2 x %3 y %4 taille %5', args: [V('NAME', 'String', 'chat'), V('LOOK', 'Emoji', '🐱'), V('X', 'Number', 180), V('Y', 'Number', 500), V('SIZE', 'Number', 64)], call: 'sprite',
      help: 'Un personnage ou objet du jeu. L\'apparence est un emoji ou l\'adresse d\'une image. Chaque sprite a un nom unique.' },
    { cat: 'game', type: 'nx_emoji', msg: 'emoji %1', args: [D('E', EMOJIS.map(function (e) { return [e, e]; }))], out: 'String', gen: 'color', help: 'Choisis un emoji comme apparence.' },
    { cat: 'game', type: 'nx_sprite_move', msg: 'déplacer %1 de x %2 y %3', args: [V('NAME', 'String', 'chat'), V('DX', 'Number', 5), V('DY', 'Number', 0)], call: 'spriteMove',
      help: 'Bouge un sprite. x positif = vers la droite, y positif = vers le bas.' },
    { cat: 'game', type: 'nx_sprite_goto', msg: 'placer %1 en x %2 y %3', args: [V('NAME', 'String', 'chat'), V('X', 'Number', 180), V('Y', 'Number', 300)], call: 'spriteGoto', help: 'Téléporte un sprite à une position.' },
    { cat: 'game', type: 'nx_sprite_random', msg: 'placer %1 au hasard', args: [V('NAME', 'String', 'etoile')], call: 'spriteRandom', help: 'Place le sprite n\'importe où dans la scène.' },
    { cat: 'game', type: 'nx_sprite_set', msg: 'mettre %1 du sprite %2 à %3', args: [D('PROP', [['x', 'x'], ['y', 'y'], ['taille', 'size'], ['angle', 'angle'], ['transparence (0-1)', 'opacity'], ['vitesse x', 'vx'], ['vitesse y', 'vy'], ['hauteur 2.5D (z)', 'z'], ['calque', 'layer'], ['apparence', 'look'], ['groupe', 'group']]), V('NAME', 'String', 'chat'), V('VAL', null, 0)], params: ['NAME', 'PROP', 'VAL'], call: 'spriteSet',
      help: 'Règle une propriété. La vitesse fait bouger le sprite tout seul à chaque image.' },
    { cat: 'game', type: 'nx_sprite_change', msg: 'augmenter %1 du sprite %2 de %3', args: [D('PROP', [['x', 'x'], ['y', 'y'], ['taille', 'size'], ['angle', 'angle'], ['transparence', 'opacity'], ['vitesse x', 'vx'], ['vitesse y', 'vy']]), V('NAME', 'String', 'chat'), V('VAL', 'Number', 10)], params: ['NAME', 'PROP', 'VAL'], call: 'spriteChange',
      help: 'Ajoute (ou retire avec un nombre négatif) une valeur à une propriété.' },
    { cat: 'game', type: 'nx_sprite_get', msg: '%1 du sprite %2', args: [D('PROP', [['x', 'x'], ['y', 'y'], ['taille', 'size'], ['angle', 'angle'], ['vitesse x', 'vx'], ['vitesse y', 'vy'], ['apparence', 'look']]), V('NAME', 'String', 'chat')], params: ['NAME', 'PROP'], out: null, call: 'spriteGet',
      help: 'Lit une propriété d\'un sprite (sa position, sa taille…).' },
    { cat: 'control', type: 'nx_sprite_flag', msg: 'sprite %1 %2 : %3', args: [V('NAME', 'String', 'balle'), D('FLAG', [['rebondit sur les bords', 'bounce'], ['tombe (gravité)', 'gravity'], ['est visible', 'visible'], ['est solide (mur/sol)', 'solid'], ['est retourné', 'flip'], ['disparaît hors du monde', 'autoDelete']]), R('VAL', YESNO)], call: 'spriteSet',
      help: 'Active des comportements automatiques : rebond, gravité, visibilité.' },
    { cat: 'control', type: 'nx_gravity', msg: 'force de la gravité %1', args: [V('G', 'Number', 0.5)], call: 'setGravity', help: 'Plus le nombre est grand, plus les sprites "qui tombent" tombent vite.' },
    { cat: 'control', type: 'nx_sprite_towards', msg: 'lancer %1 vers x %2 y %3 vitesse %4', args: [V('NAME', 'String', 'balle'), V('X', 'Number', 180), V('Y', 'Number', 0), V('SPEED', 'Number', 5)], call: 'pointTowards',
      help: 'Donne au sprite une vitesse dirigée vers un point.' },
    { cat: 'control', type: 'nx_sprite_keep', msg: 'garder %1 dans la scène', args: [V('NAME', 'String', 'chat')], call: 'keepInside', help: 'Empêche le sprite de sortir de l\'écran.' },
    { cat: 'game', type: 'nx_sprite_clone', msg: 'copier le sprite %1 sous le nom %2', args: [V('NAME', 'String', 'ennemi'), V('NEW', 'String', 'ennemi2')], call: 'spriteClone', help: 'Crée une copie (pratique pour plusieurs ennemis).' },
    { cat: 'game', type: 'nx_sprite_delete', msg: 'supprimer le sprite %1', args: [V('NAME', 'String', 'etoile')], call: 'spriteDelete', help: 'Fait disparaître définitivement un sprite.' },
    { cat: 'collide', type: 'nx_touching', msg: '%1 touche %2 ?', args: [V('A', 'String', 'chat'), V('B', 'String', 'etoile')], out: 'Boolean', call: 'touching', help: 'Vrai si les deux sprites se touchent (collision).' },
    { cat: 'collide', type: 'nx_touching_group', msg: '%1 touche un sprite dont le nom commence par %2 ?', args: [V('A', 'String', 'chat'), V('P', 'String', 'ennemi')], out: 'Boolean', call: 'touchingGroup',
      help: 'Collision avec un groupe (ennemi1, ennemi2…). Le nom trouvé est dans "nom du sprite touché".' },
    { cat: 'collide', type: 'nx_touched_sprite', msg: 'nom du sprite touché', out: 'String', prop: 'touchedSprite', help: 'Le sprite trouvé par le bloc "touche un sprite dont le nom commence par".' },
    { cat: 'collide', type: 'nx_at_edge', msg: '%1 touche le bord ?', args: [V('NAME', 'String', 'chat')], out: 'Boolean', call: 'atEdge', help: 'Vrai si le sprite est au bord de la scène.' },
    { cat: 'collide', type: 'nx_distance', msg: 'distance entre %1 et %2', args: [V('A', 'String', 'chat'), V('B', 'String', 'etoile')], out: 'Number', call: 'distance', help: 'La distance en pixels entre deux sprites.' },
    { cat: 'collide', type: 'nx_sprite_exists', msg: 'le sprite %1 existe ?', args: [V('NAME', 'String', 'etoile')], out: 'Boolean', call: 'spriteExists', help: 'Vrai si le sprite n\'a pas été supprimé.' },
    { cat: 'game', type: 'nx_key_down', msg: 'touche %1 enfoncée ?', args: [D('KEY', KEYS.slice(0, 6))], out: 'Boolean', call: 'keyDown', help: 'Vrai tant qu\'on reste appuyé (à utiliser dans "à chaque image").' },
    { cat: 'game', type: 'nx_gamepad', msg: '🕹️ afficher la manette tactile', call: 'gamepad', help: 'Ajoute des flèches et un bouton A à l\'écran pour jouer au doigt sur téléphone.' },
    { cat: 'game', type: 'nx_tap_x', msg: 'x du toucher', out: 'Number', prop: 'tapX', help: 'Position horizontale du dernier toucher dans la scène.' },
    { cat: 'game', type: 'nx_tap_y', msg: 'y du toucher', out: 'Number', prop: 'tapY', help: 'Position verticale du dernier toucher dans la scène.' },
    { cat: 'game', type: 'nx_pressing', msg: 'doigt posé sur la scène ?', out: 'Boolean', call: 'pressing', help: 'Vrai tant que le doigt (ou la souris) appuie sur la scène.' },
    { cat: 'game', type: 'nx_hud', msg: 'afficher en haut de la scène %1', args: [V('T', 'String', 'Score : 0')], call: 'hud', help: 'Un bandeau d\'information (score, vies, temps…).' },
    { cat: 'game', type: 'nx_scene_size', msg: '%1 de la scène', args: [D('WHAT', [['largeur', 'width'], ['hauteur', 'height']])], out: 'Number', call: 'sceneSize', help: 'La taille de la scène.' },
    { cat: 'game', type: 'nx_draw_rect', msg: '✏️ dessiner un rectangle x %1 y %2 largeur %3 hauteur %4 couleur %5', args: [V('X', 'Number', 50), V('Y', 'Number', 50), V('W', 'Number', 100), V('H', 'Number', 60), V('C', 'Colour', '#43a047')], params: ['=rect', 'X', 'Y', 'W', 'H', 'C'], call: 'draw',
      help: 'Dessine un rectangle plein. Les dessins restent jusqu\'à "effacer les dessins".' },
    { cat: 'game', type: 'nx_draw_circle', msg: '✏️ dessiner un cercle x %1 y %2 rayon %3 couleur %4', args: [V('X', 'Number', 180), V('Y', 'Number', 200), V('R', 'Number', 40), V('C', 'Colour', '#fdd835')], params: ['=circle', 'X', 'Y', 'R', '#0', 'C'], call: 'draw',
      help: 'Dessine un disque plein.' },
    { cat: 'game', type: 'nx_draw_line', msg: '✏️ dessiner une ligne de x %1 y %2 à x %3 y %4 couleur %5', args: [V('X1', 'Number', 0), V('Y1', 'Number', 0), V('X2', 'Number', 360), V('Y2', 'Number', 600), V('C', 'Colour', '#ffffff')], params: ['=line', 'X1', 'Y1', 'X2', 'Y2', 'C'], call: 'draw',
      help: 'Trace un trait entre deux points.' },
    { cat: 'game', type: 'nx_draw_text', msg: '✏️ écrire %1 en x %2 y %3 taille %4 couleur %5', args: [V('T', 'String', 'GAME OVER'), V('X', 'Number', 180), V('Y', 'Number', 300), V('S', 'Number', 40), V('C', 'Colour', '#ffffff')], call: 'drawText',
      help: 'Écrit du texte dans la scène.' },
    { cat: 'game', type: 'nx_clear_drawing', msg: '🧽 effacer les dessins', call: 'clearDrawing', help: 'Efface tout ce qui a été dessiné (les sprites restent).' },

    // ===== Sons =====
    { cat: 'sound', type: 'nx_sound', msg: '🔊 jouer l\'effet %1', args: [D('S', [['pièce 🪙', 'piece'], ['saut 🦘', 'saut'], ['explosion 💥', 'explosion'], ['victoire 🏆', 'victoire'], ['défaite 💀', 'defaite'], ['clic 🖱️', 'clic'], ['alarme 🚨', 'alarme']])], call: 'sound',
      help: 'Des effets sonores prêts à l\'emploi, fabriqués par le téléphone (pas besoin de fichier).' },
    { cat: 'sound', type: 'nx_note', msg: '🎵 jouer la note %1 pendant %2 temps', args: [D('N', [['do', 'do'], ['ré', 're'], ['mi', 'mi'], ['fa', 'fa'], ['sol', 'sol'], ['la', 'la'], ['si', 'si'], ['do aigu', 'do2']]), V('B', 'Number', 1)], call: 'note',
      help: 'Joue une note. Mets plusieurs blocs à la suite pour faire une mélodie.' },
    { cat: 'sound', type: 'nx_beep', msg: 'bip fréquence %1 Hz durée %2 ms', args: [V('F', 'Number', 440), V('MS', 'Number', 200)], call: 'beep', help: 'Un son pur. 440 Hz = la. Plus le nombre est grand, plus c\'est aigu.' },
    { cat: 'sound', type: 'nx_play_url', msg: 'jouer le son %1', args: [V('URL', 'String', 'https://www.soundjay.com/buttons/beep-01a.mp3')], call: 'playUrl', help: 'Joue un fichier audio (mp3, ogg…) depuis Internet ou les médias du projet.' },
    { cat: 'sound', type: 'nx_speak', msg: '🗣️ dire à voix haute %1', args: [V('T', 'String', 'Bonjour !')], call: 'speak', help: 'Le téléphone lit le texte avec sa voix de synthèse.' },

    // ===== Temps =====
    { cat: 'time', type: 'nx_time', msg: '%1 actuel(le)', args: [D('P', [['heure', 'hour'], ['minute', 'minute'], ['seconde', 'second'], ['jour du mois', 'day'], ['mois', 'month'], ['année', 'year'], ['jour de la semaine', 'weekday'], ['date complète', 'date'], ['heure complète', 'clock'], ['horodatage (ms)', 'timestamp']])], out: null, call: 'time',
      help: 'Donne l\'heure ou la date du téléphone.' },
    { cat: 'time', type: 'nx_chrono', msg: 'chronomètre (secondes)', out: 'Number', call: 'chrono', help: 'Le temps écoulé depuis le démarrage (ou la remise à zéro).' },
    { cat: 'time', type: 'nx_reset_chrono', msg: 'remettre le chronomètre à zéro', call: 'resetChrono', help: 'Redémarre le chronomètre.' },

    // ===== Données =====
    { cat: 'data', type: 'nx_save', msg: '💾 sauvegarder %1 sous le nom %2', args: [V('VAL', null, 0), V('KEY', 'String', 'record')], params: ['KEY', 'VAL'], call: 'save',
      help: 'Garde une valeur dans le téléphone, même après fermeture de l\'app (meilleur score, préférences…).' },
    { cat: 'data', type: 'nx_load', msg: 'charger la sauvegarde %1 sinon %2', args: [V('KEY', 'String', 'record'), V('DEF', null, 0)], out: null, call: 'load',
      help: 'Relit une valeur sauvegardée. "sinon" est utilisé si rien n\'a encore été sauvegardé.' },
    { cat: 'data', type: 'nx_forget', msg: 'effacer la sauvegarde %1', args: [V('KEY', 'String', 'record')], call: 'forget', help: 'Supprime une sauvegarde.' },
    { cat: 'data', type: 'nx_fetch', msg: '🌐 télécharger %1 format %2 puis %3', args: [V('URL', 'String', 'https://api.chucknorris.io/jokes/random'), R('JSON', [['JSON (données)', 'TRUE'], ['texte', 'FALSE']]), S()], call: 'fetch',
      help: 'Récupère des données sur Internet (une API). Quand c\'est fini, les blocs dedans s\'exécutent et "résultat téléchargé" contient la réponse.' },
    { cat: 'data', type: 'nx_result', msg: 'résultat téléchargé', out: null, prop: 'result', help: 'La réponse du dernier téléchargement.' },
    { cat: 'data', type: 'nx_get', msg: 'dans %1 lire %2', args: [V('OBJ', null), V('PATH', 'String', 'value')], out: null, call: 'get',
      help: 'Lit une information dans des données JSON. Sépare les niveaux par des points : "main.temp" ou "items.0.name".' },
    { cat: 'data', type: 'nx_to_json', msg: 'convertir en texte JSON %1', args: [V('V', null)], out: 'String', call: 'toJson', help: 'Transforme une liste ou un objet en texte.' },
    { cat: 'data', type: 'nx_from_json', msg: 'lire le texte JSON %1', args: [V('T', 'String', '{"a": 1}')], out: null, call: 'fromJson', help: 'Transforme un texte JSON en données utilisables.' },
    { cat: 'data', type: 'nx_copy', msg: '📋 copier %1', args: [V('T', 'String', 'Texte à copier')], call: 'copy', help: 'Copie un texte dans le presse-papiers.' },
    { cat: 'data', type: 'nx_share', msg: '📤 partager %1', args: [V('T', 'String', 'Regarde mon app !')], call: 'share', help: 'Ouvre le menu de partage du téléphone (WhatsApp, SMS, mail…).' },
    { cat: 'data', type: 'nx_open_url', msg: 'ouvrir la page %1', args: [V('URL', 'String', 'https://www.google.com')], call: 'openUrl', help: 'Ouvre un site, un numéro (tel:…), un mail (mailto:…) ou une carte (geo:…).' },
    { cat: 'data', type: 'nx_download_text', msg: 'télécharger un fichier %1 contenant %2', args: [V('NAME', 'String', 'notes.txt'), V('T', 'String', 'Mon texte')], call: 'downloadText', help: 'Crée un fichier texte à télécharger.' },
    { cat: 'data', type: 'nx_pick', msg: 'élément au hasard de %1', args: [V('L', 'Array')], out: null, call: 'pick', help: 'Choisit un élément au hasard dans une liste.' },
    { cat: 'data', type: 'nx_log', msg: '🐞 afficher dans la console %1', args: [V('V', null, 'test')], call: 'log', help: 'Écrit une valeur dans la console (onglet Aperçu) pour comprendre ce qui se passe.' },

    // ===== Appareil =====
    { cat: 'device', type: 'nx_vibrate', msg: '📳 vibrer %1 ms', args: [V('MS', 'Number', 300)], call: 'vibrate', help: 'Fait vibrer le téléphone.' },
    { cat: 'device', type: 'nx_locate', msg: '📍 trouver ma position puis %1', args: [S()], call: 'locate', help: 'Demande la position GPS. Ensuite utilise latitude et longitude.' },
    { cat: 'device', type: 'nx_lat', msg: 'latitude', out: 'Number', prop: 'latitude', help: 'Latitude trouvée par "trouver ma position".' },
    { cat: 'device', type: 'nx_lon', msg: 'longitude', out: 'Number', prop: 'longitude', help: 'Longitude trouvée par "trouver ma position".' },
    { cat: 'device', type: 'nx_screen', msg: 'info appareil : %1', args: [D('W', [['largeur écran', 'width'], ['hauteur écran', 'height'], ['est une app Android', 'android'], ['connecté à Internet', 'online'], ['mode sombre', 'dark'], ['langue', 'language']])], out: null, call: 'screen',
      help: 'Des informations sur l\'appareil.' },
    { cat: 'device', type: 'nx_camera', msg: '📷 afficher la caméra id %1', args: [F('ID', 'camera')], call: 'camera', help: 'Affiche ce que voit la caméra (autorisation demandée).' },
    { cat: 'device', type: 'nx_fullscreen', msg: 'plein écran %1', args: [R('ON', YESNO)], call: 'fullscreen', help: 'Cache les barres du téléphone (idéal pour les jeux).' },
    { cat: 'device', type: 'nx_keep_awake', msg: 'garder l\'écran allumé %1', args: [R('ON', YESNO)], call: 'keepAwake', help: 'Empêche l\'écran de s\'éteindre (app Android).' },
    { cat: 'device', type: 'nx_reload', msg: '🔄 redémarrer l\'application', call: 'reload', help: 'Relance l\'app depuis le début.' },
    { cat: 'device', type: 'nx_exit', msg: '🚪 quitter l\'application', call: 'exit', help: 'Ferme l\'app (sur Android).' },

    // ===== Écrans & navigation (vraies apps) =====
    { cat: 'pages', type: 'nx_page', msg: '🗂️ écran %1 %2', args: [F('NAME', 'Accueil'), S()], call: 'page',
      help: 'Un écran (une page) de ton app. Mets dedans ce qui doit s\'afficher. Le premier écran créé s\'affiche au démarrage.' },
    { cat: 'pages', type: 'nx_go_page', msg: '➡️ aller à l\'écran %1', args: [F('NAME', 'Accueil')], call: 'goPage',
      help: 'Affiche un autre écran. Le bouton retour du téléphone revient à l\'écran précédent.' },
    { cat: 'pages', type: 'nx_back', msg: '⬅️ revenir à l\'écran précédent', call: 'back', help: 'Retourne à l\'écran d\'avant.' },
    { cat: 'pages', type: 'nx_current_page', msg: 'écran actuel', out: 'String', call: 'currentPage', help: 'Le nom de l\'écran affiché.' },
    { cat: 'pages', type: 'nx_app_bar', msg: '🔝 barre de titre %1 couleur %2', args: [V('T', 'String', 'Mon app'), V('C', 'Colour', '#ffcc22')], call: 'appBar',
      help: 'Une barre fixe en haut de l\'app avec un titre et une flèche retour automatique.' },
    { cat: 'pages', type: 'nx_tab_bar', msg: '🔻 barre d\'onglets en bas %1', args: [V('SPEC', 'String', 'Accueil:🏠,Jeu:🎮,Profil:👤')], call: 'tabBar',
      help: 'Une barre de navigation en bas, comme dans les vraies apps. Écris : NomÉcran:emoji, séparés par des virgules.' },
    { cat: 'pages', type: 'nx_card', msg: '🃏 carte image %1 titre %2 texte %3 id %4 quand on touche %5', args: [V('IMG', 'String', 'https://picsum.photos/400/200'), V('T', 'String', 'Titre'), V('TXT', 'String', 'Une petite description'), F('ID', ''), S()], params: ['IMG', 'T', 'TXT', 'DO', 'ID'], call: 'card',
      help: 'Une jolie carte (image + titre + texte) qu\'on peut toucher. Laisse l\'image vide pour une carte sans image.' },
    { cat: 'pages', type: 'nx_badge', msg: 'étiquette %1 couleur %2', args: [V('T', 'String', 'NOUVEAU'), V('C', 'Colour', '#e53935')], call: 'badge', help: 'Un petit badge coloré.' },
    { cat: 'pages', type: 'nx_progress', msg: 'barre de progression id %1 valeur %2 sur %3', args: [F('ID', 'prog'), V('V', 'Number', 40), V('MAX', 'Number', 100)], call: 'progress',
      help: 'Une barre qui se remplit. Réutilise le même id pour la mettre à jour.' },
    { cat: 'pages', type: 'nx_theme', msg: '🎨 thème de l\'app %1', args: [D('T', [['clair', 'clair'], ['sombre', 'sombre'], ['néon', 'neon'], ['océan', 'ocean'], ['forêt', 'foret'], ['bonbon', 'bonbon'], ['rétro', 'retro']])], call: 'theme',
      help: 'Change d\'un coup toutes les couleurs de l\'app.' },
    { cat: 'pages', type: 'nx_animate_el', msg: '✨ animer %1 effet %2', args: [F('ID', 'monBouton'), D('FX', [['rebond', 'bounce'], ['secousse', 'shake'], ['apparition', 'fade'], ['zoom', 'zoom'], ['tour complet', 'spin'], ['pulsation', 'pulse']])], call: 'animateEl',
      help: 'Une animation sur un élément (id). Mets « page » pour animer tout l\'écran.' },
    { cat: 'events', type: 'nx_on_enter', msg: 'quand on appuie sur Entrée dans %1 %2', args: [F('ID', 'nom'), S()], call: 'onEnter', help: 'Réagit à la touche Entrée dans un champ.' },

    // ===== Contrôles & physique =====
    { cat: 'control', type: 'nx_control', msg: '🕹️ contrôler %1 comme %2 vitesse %3 saut %4', args: [V('NAME', 'String', 'joueur'),
      D('TYPE', [['jeu de plateforme', 'platform'], ['vue de dessus (4 directions)', 'topdown'], ['bagarre 2.5D', 'beat'], ['suit le doigt', 'follow'], ['glisser au doigt', 'drag'], ['patrouille (aller-retour)', 'patrol'], ['se promène au hasard', 'wander']]),
      V('SPEED', 'Number', 4), V('JUMP', 'Number', 13)], params: ['NAME', 'TYPE', 'SPEED', 'JUMP'], call: 'control',
      help: 'LE bloc magique : un seul bloc rend le sprite jouable (flèches, saut, manette tactile affichée automatiquement) ou lui donne un comportement (patrouille, promenade). Marche aussi avec un nom de groupe.' },
    { cat: 'control', type: 'nx_chase', msg: '🎯 %1 poursuit %2 vitesse %3', args: [V('NAME', 'String', 'ennemi'), V('T', 'String', 'joueur'), V('SPEED', 'Number', 2)], call: 'chase',
      help: 'Le sprite (ou tout un groupe) suit un autre sprite en permanence. Parfait pour les ennemis.' },
    { cat: 'control', type: 'nx_jump', msg: '⤴️ faire sauter %1 force %2', args: [V('NAME', 'String', 'joueur'), V('F', 'Number', 12)], call: 'jump', help: 'Fait sauter le sprite (s\'il est au sol).' },
    { cat: 'control', type: 'nx_on_ground', msg: '%1 est au sol ?', args: [V('NAME', 'String', 'joueur')], out: 'Boolean', call: 'onGround', help: 'Vrai si le sprite est posé sur quelque chose.' },
    { cat: 'control', type: 'nx_camera_follow', msg: '🎥 la caméra suit %1', args: [V('NAME', 'String', 'joueur')], call: 'cameraFollow',
      help: 'L\'écran défile pour garder le sprite au centre. Indispensable pour les niveaux plus grands que l\'écran.' },
    { cat: 'control', type: 'nx_camera_goto', msg: 'placer la caméra en x %1 y %2', args: [V('X', 'Number', 0), V('Y', 'Number', 0)], call: 'cameraGoto', help: 'Place la vue à un endroit précis du monde.' },
    { cat: 'control', type: 'nx_world_size', msg: 'taille du monde largeur %1 hauteur %2', args: [V('W', 'Number', 2000), V('H', 'Number', 600)], call: 'worldSize',
      help: 'Le monde peut être plus grand que l\'écran (la caméra le parcourt). Les niveaux en texte le règlent tout seuls.' },
    { cat: 'control', type: 'nx_pause', msg: '⏸ pause du jeu %1', args: [R('P', YESNO)], call: 'pause', help: 'Met en pause ou relance le jeu.' },
    { cat: 'control', type: 'nx_shake', msg: '📳 secouer l\'écran force %1', args: [V('F', 'Number', 10)], call: 'shake', help: 'Un tremblement de caméra (choc, explosion).' },

    // ===== Collisions & groupes =====
    { cat: 'collide', type: 'nx_collide', msg: '💥 quand %1 touche %2 %3', args: [V('A', 'String', 'joueur'), V('B', 'String', 'piece'), S()], call: 'onCollide',
      help: 'Se déclenche une fois au moment du contact. Tu peux mettre un nom de sprite OU un nom de groupe (ex : « piece », « ennemi »). Utilise « l\'autre sprite » pour agir sur celui qui a été touché.' },
    { cat: 'collide', type: 'nx_other', msg: 'l\'autre sprite', out: 'String', prop: 'other', help: 'Dans « quand … touche … » : le sprite touché (ex : la pièce ramassée).' },
    { cat: 'collide', type: 'nx_self', msg: 'ce sprite', out: 'String', prop: 'self', help: 'Dans « quand … touche … » ou « quand on touche le sprite » : le sprite concerné.' },
    { cat: 'collide', type: 'nx_spawn', msg: '✨ faire apparaître %1 groupe %2 en x %3 y %4 vitesse x %5 y %6', args: [V('LOOK', 'Emoji', '🔥'), V('G', 'String', 'balle'), V('X', 'Number', 180), V('Y', 'Number', 500), V('VX', 'Number', 0), V('VY', 'Number', -10)], call: 'spawn',
      help: 'Crée un nouveau sprite dans un groupe : tirs, ennemis, pièces… Il disparaît tout seul en sortant du monde.' },
    { cat: 'collide', type: 'nx_last_spawned', msg: 'dernier sprite apparu', out: 'String', prop: 'lastSpawned', help: 'Le nom du dernier sprite créé avec « faire apparaître ».' },
    { cat: 'collide', type: 'nx_set_group', msg: 'mettre %1 dans le groupe %2', args: [V('NAME', 'String', 'chat'), V('G', 'String', 'amis')], params: ['NAME', '=group', 'G'], call: 'spriteSet',
      help: 'Range un sprite dans un groupe pour gérer plusieurs sprites d\'un coup.' },
    { cat: 'collide', type: 'nx_for_each_group', msg: 'pour chaque sprite du groupe %1 faire %2', args: [V('G', 'String', 'ennemi'), S()], call: 'forEachInGroup',
      help: 'Répète les blocs pour chaque sprite du groupe. « sprite actuel » donne son nom.' },
    { cat: 'collide', type: 'nx_current_sprite', msg: 'sprite actuel', out: 'String', prop: 'current', help: 'Dans « pour chaque sprite du groupe ».' },
    { cat: 'collide', type: 'nx_group_count', msg: 'nombre de sprites du groupe %1', args: [V('G', 'String', 'piece')], out: 'Number', call: 'groupCount', help: 'Combien de sprites restent dans le groupe (ex : 0 pièce = niveau gagné).' },
    { cat: 'collide', type: 'nx_explode', msg: '🎆 explosion sur %1 couleur %2', args: [V('NAME', 'String', 'ennemi'), V('C', 'Colour', '#fb8c00')], call: 'explodeAt', help: 'Des particules jaillissent du sprite.' },
    { cat: 'collide', type: 'nx_particles', msg: '🎆 particules en x %1 y %2 apparence %3 nombre %4', args: [V('X', 'Number', 180), V('Y', 'Number', 300), V('L', 'Emoji', '⭐'), V('N', 'Number', 20)], call: 'particles',
      help: 'Une gerbe de particules (couleur ou emoji).' },

    // ===== Niveaux, 2.5D & 3D =====
    { cat: 'world', type: 'nx_level', msg: '🏰 créer le niveau %1 taille des cases %2', args: [V('TEXT', 'String', '..........|....*.....|..===...E.|P.........|##########'), V('T', 'Number', 40)], call: 'level',
      help: 'Dessine ton niveau avec des lettres ! Chaque ligne est séparée par « | ». # mur · = plateforme · B brique · * étoile (groupe piece) · o pièce · E ennemi qui patrouille · M fantôme · ^ pic · D porte (sortie) · K clé · H cœur · T arbre · P départ du joueur. Le monde et la caméra s\'adaptent tout seuls.' },
    { cat: 'world', type: 'nx_legend', msg: 'dans les niveaux, la lettre %1 = apparence %2 groupe %3 solide %4', args: [F('CH', 'X'), V('LOOK', 'Emoji', '🍄'), V('G', 'String', 'bonus'), R('S', YESNO)], call: 'legend',
      help: 'Invente tes propres lettres de niveau (à placer AVANT « créer le niveau »).' },
    { cat: 'world', type: 'nx_start_x', msg: 'x de départ du niveau', out: 'Number', prop: 'startX', help: 'Position de la lettre P.' },
    { cat: 'world', type: 'nx_start_y', msg: 'y de départ du niveau', out: 'Number', prop: 'startY', help: 'Position de la lettre P.' },
    { cat: 'world', type: 'nx_mode25', msg: '🧊 mode 2.5D horizon à %1 couleur du sol %2', args: [V('H', 'Number', 220), V('C', 'Colour', '#6d4c41')], call: 'mode25',
      help: 'Vue en perspective : les sprites rapetissent au loin, ont une ombre et sautent en hauteur. Pour les jeux de bagarre, de course, d\'aventure.' },
    { cat: 'world', type: 'nx_maze', msg: '🧱 labyrinthe 3D %1 ciel %2 sol %3', args: [V('TEXT', 'String', '##########|#P...#...#|#.##.#.#.#|#..#...#*#|##.####..#|#...*...D#|##########'), V('SKY', 'Colour', '#4fc3f7'), V('GROUND', 'Colour', '#3e2723')], call: 'maze',
      help: 'Un vrai jeu en 3D à la première personne (comme les premiers jeux de tir) ! Mêmes lettres que les niveaux ; murs : # 1 2 3 4 (couleurs). Le joueur s\'appelle « joueur » : flèches ou toucher l\'écran pour avancer/tourner.' },
    { cat: 'world', type: 'nx_minimap', msg: 'mini-carte du labyrinthe %1', args: [R('ON', YESNO)], call: 'minimap', help: 'Affiche un plan du labyrinthe dans un coin.' },
    { cat: 'world', type: 'nx_turn', msg: 'tourner la vue de %1 degrés', args: [V('D', 'Number', 90)], call: 'turn', help: 'Fait pivoter la vue 3D.' },
    { cat: 'world', type: 'nx_scene_gradient', msg: '🌅 fond de scène dégradé %1 vers %2', args: [V('A', 'Colour', '#1e88e5'), V('B', 'Colour', '#ffcba4')], call: 'sceneGradient', help: 'Un beau ciel en dégradé.' },
    { cat: 'world', type: 'nx_scene_image', msg: '🏞️ image de fond %1 défilement %2', args: [V('SRC', 'String', 'https://picsum.photos/800/400'), V('S', 'Number', 0.3)], call: 'sceneImage',
      help: 'Une image de fond qui défile plus lentement que le jeu (effet de profondeur « parallaxe »). Ajoute plusieurs images pour plusieurs couches.' },

    // ===== Jeux : en plus =====
    { cat: 'game', type: 'nx_animate', msg: '🎞️ animer %1 avec les images %2 vitesse %3', args: [V('NAME', 'String', 'joueur'), V('F', 'String', '🐱,😺,😸'), V('S', 'Number', 10)], call: 'animate',
      help: 'Fait défiler plusieurs apparences (emojis ou médias séparés par des virgules) : marche, battements d\'ailes… Plus le nombre est petit, plus c\'est rapide.' },
    { cat: 'game', type: 'nx_label', msg: 'texte au-dessus de %1 : %2', args: [V('NAME', 'String', 'joueur'), V('T', 'String', 'Moi')], call: 'label', help: 'Un nom ou un message affiché au-dessus du sprite.' },
    { cat: 'game', type: 'nx_life_bar', msg: '❤️ barre de vie de %1 valeur %2 max %3', args: [V('NAME', 'String', 'joueur'), V('V', 'Number', 100), V('MAX', 'Number', 100)], call: 'lifeBar', help: 'Une barre de vie verte/jaune/rouge au-dessus du sprite.' },
    { cat: 'game', type: 'nx_to_front', msg: 'mettre %1 au premier plan', args: [V('NAME', 'String', 'joueur')], call: 'toFront', help: 'Dessine le sprite par-dessus les autres.' },

    // ===== Base de données & fiches =====
    { cat: 'db', type: 'nx_obj', msg: '📇 fiche %1 = %2 %3 = %4 %5 = %6', args: [F('K1', 'nom'), V('V1', null, 'Léa'), F('K2', 'age'), V('V2', null, 12), F('K3', ''), V('V3', null)], out: null, call: 'obj',
      help: 'Une fiche regroupe plusieurs informations nommées (un contact, un produit, un score…). Laisse un nom vide pour ne pas l\'utiliser.' },
    { cat: 'db', type: 'nx_obj_empty', msg: 'fiche vide', out: null, call: 'obj', help: 'Une fiche sans rien dedans.' },
    { cat: 'db', type: 'nx_set_prop', msg: 'dans la fiche %1 mettre %2 à %3', args: [V('O', null), F('K', 'nom'), V('V', null, 'valeur')], call: 'setProp', help: 'Ajoute ou modifie une information de la fiche.' },
    { cat: 'db', type: 'nx_get_prop', msg: 'dans la fiche %1 lire %2', args: [V('O', null), V('K', 'String', 'nom')], out: null, call: 'get', help: 'Lit une information de la fiche (marche aussi avec le JSON d\'Internet).' },
    { cat: 'db', type: 'nx_keys', msg: 'noms des informations de %1', args: [V('O', null)], out: 'Array', call: 'keys', help: 'La liste des noms d\'informations d\'une fiche.' },
    { cat: 'db', type: 'nx_db_add', msg: '🗃️ ajouter %1 dans la base %2', args: [V('ITEM', null, 'Bonjour'), V('C', 'String', 'notes')], params: ['C', 'ITEM'], call: 'dbAdd',
      help: 'Enregistre un élément (texte, nombre ou fiche) dans une base de données du téléphone. Elle est gardée même après fermeture.' },
    { cat: 'db', type: 'nx_db_all', msg: 'tout le contenu de la base %1', args: [V('C', 'String', 'notes')], out: 'Array', call: 'dbAll', help: 'La liste de tous les éléments de la base.' },
    { cat: 'db', type: 'nx_db_count', msg: 'nombre d\'éléments dans la base %1', args: [V('C', 'String', 'notes')], out: 'Number', call: 'dbCount', help: 'Combien d\'éléments contient la base.' },
    { cat: 'db', type: 'nx_db_find', msg: 'chercher dans la base %1 où %2 contient %3', args: [V('C', 'String', 'contacts'), V('K', 'String', 'nom'), V('V', 'String', 'lé')], out: 'Array', call: 'dbFind',
      help: 'Les éléments dont l\'information contient le texte cherché (sans tenir compte des majuscules).' },
    { cat: 'db', type: 'nx_db_update', msg: 'dans la base %1 élément n° %2 mettre %3 à %4', args: [V('C', 'String', 'contacts'), V('I', 'Number', 1), V('K', 'String', 'nom'), V('V', null, 'Nouveau')], call: 'dbUpdate', help: 'Modifie une information d\'un élément.' },
    { cat: 'db', type: 'nx_db_remove', msg: 'supprimer l\'élément n° %2 de la base %1', args: [V('C', 'String', 'notes'), V('I', 'Number', 1)], call: 'dbRemove', help: 'Supprime un élément (le premier est le n° 1).' },
    { cat: 'db', type: 'nx_db_clear', msg: 'vider la base %1', args: [V('C', 'String', 'notes')], call: 'dbClear', help: 'Efface tout le contenu de la base.' },
    { cat: 'db', type: 'nx_sort_by', msg: 'trier %1 par %2 %3', args: [V('L', 'Array'), V('K', 'String', 'score'), R('D', [['croissant', 'FALSE'], ['décroissant', 'TRUE']])], out: 'Array', call: 'sortBy', help: 'Trie une liste de fiches selon une information (classement, ordre alphabétique…).' },
    { cat: 'db', type: 'nx_table', msg: '📋 afficher le tableau %1 id %2', args: [V('L', 'Array'), F('ID', 'tableau')], params: ['ID', 'L'], call: 'table',
      help: 'Affiche une liste (de fiches) sous forme de tableau avec colonnes. Réutilise le même id pour le mettre à jour.' },
    { cat: 'db', type: 'nx_on_table', msg: 'quand on touche une ligne du tableau %1 %2', args: [F('ID', 'tableau'), S()], call: 'onTableClick',
      help: 'Réagit au toucher d\'une ligne. « numéro de l\'élément touché » et « élément de liste touché » donnent la ligne.' },
    { cat: 'db', type: 'nx_chart', msg: '📊 graphique %1 valeurs %2 étiquettes %3 id %4', args: [D('TYPE', [['barres', 'bar'], ['courbe', 'line'], ['camembert', 'pie']]), V('V', null, '12,19,7,15'), V('L', null, 'Lun,Mar,Mer,Jeu'), F('ID', 'graph')], params: ['ID', 'TYPE', 'V', 'L'], call: 'chart',
      help: 'Dessine un graphique à partir de nombres (liste ou texte séparé par des virgules).' },
    { cat: 'data', type: 'nx_post', msg: '📤 envoyer %1 à %2 (POST) puis %3', args: [V('DATA', null), V('URL', 'String', 'https://httpbin.org/post'), S()], params: ['URL', 'DATA', 'DO'], call: 'post',
      help: 'Envoie des données à un serveur (formulaire, score en ligne, webhook Discord…). La réponse est dans « résultat téléchargé ».' },
    { cat: 'data', type: 'nx_format', msg: 'nombre %1 avec %2 décimales', args: [V('N', 'Number', 3.14159), V('D', 'Number', 2)], out: 'String', call: 'format', help: 'Arrondit joliment un nombre pour l\'afficher (prix, moyenne…).' },
    { cat: 'time', type: 'nx_countdown', msg: '⏳ compte à rebours %1 s affiché dans %2 puis %3', args: [V('S', 'Number', 10), F('ID', 'chrono'), S()], call: 'countdown',
      help: 'Décompte les secondes dans un élément (id), puis exécute les blocs à zéro.' },

    // ===== Code avancé =====
    { cat: 'code', type: 'nx_comment', msg: '💬 note : %1', args: [F('T', 'Explique ici ce que fait ton programme')], gen: 'comment',
      help: 'Un commentaire : il n\'est pas exécuté, il sert juste à expliquer.' },
    { cat: 'code', type: 'nx_raw_js', msg: '⌨️ code JavaScript %1', args: [F('CODE', 'console.log("Salut !");')], gen: 'rawjs',
      help: 'Exécute n\'importe quelle ligne de JavaScript. Tout ce que le web sait faire devient possible.' },
    { cat: 'code', type: 'nx_raw_js_value', msg: 'valeur JavaScript %1', args: [F('CODE', 'Math.PI * 2')], out: null, gen: 'rawjs',
      help: 'Une expression JavaScript qui donne une valeur.' },
    { cat: 'code', type: 'nx_raw_html', msg: '🧱 insérer du HTML %1', args: [V('CODE', 'String', '<b>Gras</b> et <i>italique</i>')], call: 'html', help: 'Ajoute du HTML brut à l\'écran.' },
    { cat: 'code', type: 'nx_raw_css', msg: '🎨 ajouter du CSS %1', args: [V('CODE', 'String', 'button { border-radius: 30px; }')], call: 'css', help: 'Ajoute des règles de style CSS à toute l\'app.' }
  ];

  /* ---------- Création des blocs Blockly ---------- */
  var BY_TYPE = {};

  function blockJson(spec) {
    var c = CATS[spec.cat];
    var args = (spec.args || []).map(function (a) {
      // Les entrées "texte" acceptent tout (nombres, variables…) : la valeur est convertie automatiquement.
      if (a.k === 'V') return { type: 'input_value', name: a.name, check: (a.type === 'Number' || a.type === 'Array' || a.type === 'Boolean') ? a.type : null };
      if (a.k === 'F') return { type: 'field_input', name: a.name, text: a.def };
      if (a.k === 'D' || a.k === 'R') return { type: 'field_dropdown', name: a.name, options: a.options };
      return { type: 'input_statement', name: a.name };
    });
    var json = {
      type: spec.type,
      message0: spec.msg,
      args0: args,
      colour: c.colour,
      tooltip: spec.help,
      inputsInline: true
    };
    if (spec.out !== undefined) json.output = spec.out;
    else if (spec.hat) json.nextStatement = null;
    else { json.previousStatement = null; json.nextStatement = null; }
    if (spec.hat) json.hat = 'cap';
    return json;
  }

  /** Bloc prêt à glisser, avec ses valeurs par défaut (pour la boîte à outils). */
  function toolboxEntry(spec) {
    var entry = { kind: 'block', type: spec.type };
    var inputs = {};
    (spec.args || []).forEach(function (a) {
      if (a.k !== 'V' || a.def === undefined) return;
      var shadow;
      if (a.type === 'Number') shadow = { type: 'math_number', fields: { NUM: a.def } };
      else if (a.type === 'Colour') {
        var known = COLORS.filter(function (c) { return c[1] === a.def; })[0];
        shadow = known ? { type: 'nx_color', fields: { C: a.def } } : { type: 'nx_color_hex', fields: { C: a.def } };
      } else if (a.type === 'Emoji') shadow = { type: 'nx_emoji', fields: { E: a.def } };
      else if (typeof a.def === 'number') shadow = { type: 'math_number', fields: { NUM: a.def } };
      else shadow = { type: 'text', fields: { TEXT: a.def } };
      inputs[a.name] = { shadow: shadow };
    });
    if (Object.keys(inputs).length) entry.inputs = inputs;
    return entry;
  }

  /* ---------- Génération de code multi-langage ---------- */
  var LANGS = {
    js: { obj: 'NX.', prop: 'NX.', end: ';', comment: '// ', t: 'true', f: 'false', nil: 'null', def: null },
    py: { obj: 'nx.', prop: 'nx.', end: '', comment: '# ', t: 'True', f: 'False', nil: 'None', def: 'import nx  # bibliothèque NOCODEX' },
    php: { obj: 'NX::', prop: 'NX::$', end: ';', comment: '// ', t: 'true', f: 'false', nil: 'null', def: 'require_once \'nx.php\'; // bibliothèque NOCODEX' },
    lua: { obj: 'nx.', prop: 'nx.', end: '', comment: '-- ', t: 'true', f: 'false', nil: 'nil', def: 'local nx = require(\'nx\') -- bibliothèque NOCODEX' },
    dart: { obj: 'nx.', prop: 'nx.', end: ';', comment: '// ', t: 'true', f: 'false', nil: 'null', def: 'import \'nx.dart\'; // bibliothèque NOCODEX' }
  };

  function orders(lang) {
    var mod = { js: window.javascript, py: window.python, php: window.php, lua: window.lua, dart: window.dart }[lang];
    var O = mod.Order;
    var call = O.FUNCTION_CALL !== undefined ? O.FUNCTION_CALL : (O.HIGH !== undefined ? O.HIGH : O.UNARY_POSTFIX);
    if (lang === 'lua') call = O.HIGH;
    if (lang === 'dart') call = O.UNARY_POSTFIX;
    return { none: O.NONE, atomic: O.ATOMIC, call: call };
  }

  function globalsOf(block, g, lang) {
    var vars = Blockly.Variables.allUsedVarModels(block.workspace).map(function (v) {
      return g.getVariableName(v.getId());
    });
    if (!vars.length) return '';
    if (lang === 'py') return g.INDENT + 'global ' + vars.join(', ') + '\n';
    if (lang === 'php') return g.INDENT + 'global ' + vars.join(', ') + ';\n';
    return '';
  }

  function callback(block, g, lang, name, hoist) {
    var body = g.statementToCode(block, name);
    switch (lang) {
      case 'js': return 'function () {\n' + body + '}';
      case 'php': return 'function () {\n' + globalsOf(block, g, lang) + body + '}';
      case 'lua': return 'function()\n' + body + 'end';
      case 'dart': return '() {\n' + body + '}';
      case 'py':
        var fn = g.nameDB_.getDistinctName('nx_quand', Blockly.Names.NameType.PROCEDURE);
        hoist.push('def ' + fn + '():\n' + globalsOf(block, g, lang) + (body || g.INDENT + 'pass\n'));
        return fn;
    }
  }

  function makeGenerator(spec, lang) {
    var L = LANGS[lang];
    return function (block, g) {
      var O = orders(lang);
      if (L.def) g.definitions_['nx_import'] = L.def;

      if (spec.gen === 'body') {
        var b = g.statementToCode(block, 'DO');
        return b.replace(new RegExp('^' + g.INDENT, 'gm'), '');
      }
      if (spec.gen === 'color') {
        return [g.quote_(block.getFieldValue(spec.args[0].name)), O.atomic];
      }
      if (spec.gen === 'media') {
        return [L.obj + 'media(' + g.quote_(block.getFieldValue('M') || '') + ')', O.call];
      }
      if (spec.gen === 'comment') {
        return L.comment + block.getFieldValue('T') + '\n';
      }
      if (spec.gen === 'rawjs') {
        var code = block.getFieldValue('CODE');
        if (lang === 'js') return spec.out !== undefined ? ['(' + code + ')', O.atomic] : code + '\n';
        if (spec.out !== undefined) return [L.nil, O.atomic];
        return L.comment + '[JavaScript uniquement] ' + code + '\n';
      }
      if (spec.prop) return [L.prop + spec.prop, O.atomic];

      var argMap = {};
      (spec.args || []).forEach(function (a) { argMap[a.name] = a; });
      var params = spec.params || (spec.args || []).map(function (a) { return a.name; });
      var hoist = [];
      var parts = params.map(function (p) {
        if (p.charAt(0) === '=') return g.quote_(p.slice(1));
        if (p.charAt(0) === '#') return p.slice(1);
        var a = argMap[p];
        if (a.k === 'V') {
          var v = g.valueToCode(block, p, O.none);
          if (v) return v;
          if (a.type === 'Number') return '0';
          if (a.type === 'String' || a.type === 'Colour' || a.type === 'Emoji') return g.quote_('');
          return L.nil;
        }
        if (a.k === 'F' || a.k === 'D') return g.quote_(block.getFieldValue(p) || '');
        if (a.k === 'R') return block.getFieldValue(p) === 'TRUE' ? L.t : L.f;
        return callback(block, g, lang, p, hoist);
      });
      // On retire les paramètres vides en fin d'appel (ex. id facultatif).
      while (parts.length && parts[parts.length - 1] === g.quote_('') && argMap[params[parts.length - 1]] && argMap[params[parts.length - 1]].k === 'F') parts.pop();
      var call = L.obj + spec.call + '(' + parts.join(', ') + ')';
      if (spec.out !== undefined) return [call, O.call];
      return hoist.join('') + call + L.end + '\n';
    };
  }

  function register() {
    NX_BLOCKS.forEach(function (spec) {
      BY_TYPE[spec.type] = spec;
      Blockly.Blocks[spec.type] = {
        init: function () {
          this.jsonInit(blockJson(spec));
          if (spec.gen === 'media') {
            // La liste des médias change selon le projet : menu calculé à l'ouverture.
            var input = this.inputList[0];
            input.removeField('M');
            input.appendField(new Blockly.FieldDropdown(function () {
              var names = (window.NXMediaNames && window.NXMediaNames()) || [];
              return names.length ? names.map(function (n) { return [n, n]; }) : [['(ajoute un média dans ⚙️)', '']];
            }, function (v) { return v; }), 'M');
          }
        }
      };
      var gens = { js: Blockly.JavaScript, py: Blockly.Python, php: Blockly.PHP, lua: Blockly.Lua, dart: Blockly.Dart };
      Object.keys(gens).forEach(function (lang) {
        if (gens[lang]) gens[lang].forBlock[spec.type] = makeGenerator(spec, lang);
      });
    });
  }

  /* ---------- Boîte à outils ---------- */
  function num(n) { return { shadow: { type: 'math_number', fields: { NUM: n } } }; }
  function txt(t) { return { shadow: { type: 'text', fields: { TEXT: t } } }; }
  function label(t) { return { kind: 'label', text: t }; }

  var BUILTIN = [
    { name: 'Logique', icon: '🔀', colour: '#5C81A6', help: 'Prendre des décisions : SI ceci ALORS cela, comparer, ET / OU / NON, vrai / faux.', contents: [
      label('Si une condition est vraie, faire quelque chose'),
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
      { kind: 'block', type: 'logic_compare', inputs: { A: num(0), B: num(0) } },
      { kind: 'block', type: 'logic_operation' },
      { kind: 'block', type: 'logic_negate' },
      { kind: 'block', type: 'logic_boolean' },
      { kind: 'block', type: 'logic_null' },
      { kind: 'block', type: 'logic_ternary' }
    ] },
    { name: 'Boucles', icon: '🔁', colour: '#5CA65C', help: 'Répéter des actions : X fois, tant que, pour chaque élément d\'une liste.', contents: [
      { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: num(10) } },
      { kind: 'block', type: 'controls_whileUntil' },
      { kind: 'block', type: 'controls_for', inputs: { FROM: num(1), TO: num(10), BY: num(1) } },
      { kind: 'block', type: 'controls_forEach' },
      { kind: 'block', type: 'controls_flow_statements' }
    ] },
    { name: 'Maths', icon: '🔢', colour: '#5C68A6', help: 'Nombres et calculs : + − × ÷, hasard, arrondi, racine, pourcentage…', contents: [
      { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
      { kind: 'block', type: 'math_arithmetic', inputs: { A: num(1), B: num(1) } },
      { kind: 'block', type: 'math_random_int', inputs: { FROM: num(1), TO: num(100) } },
      { kind: 'block', type: 'math_random_float' },
      { kind: 'block', type: 'math_single', inputs: { NUM: num(9) } },
      { kind: 'block', type: 'math_round', inputs: { NUM: num(3.1) } },
      { kind: 'block', type: 'math_modulo', inputs: { DIVIDEND: num(64), DIVISOR: num(10) } },
      { kind: 'block', type: 'math_constrain', inputs: { VALUE: num(50), LOW: num(1), HIGH: num(100) } },
      { kind: 'block', type: 'math_number_property', inputs: { NUMBER_TO_CHECK: num(0) } },
      { kind: 'block', type: 'math_trig', inputs: { NUM: num(45) } },
      { kind: 'block', type: 'math_constant' },
      { kind: 'block', type: 'math_on_list' }
    ] },
    { name: 'Texte', icon: '🔤', colour: '#5CA68D', help: 'Les mots et phrases : coller des textes, longueur, majuscules, chercher, découper…', contents: [
      { kind: 'block', type: 'text' },
      { kind: 'block', type: 'text_join' },
      { kind: 'block', type: 'text_append', inputs: { TEXT: txt('') } },
      { kind: 'block', type: 'text_length', inputs: { VALUE: txt('abc') } },
      { kind: 'block', type: 'text_isEmpty', inputs: { VALUE: txt('') } },
      { kind: 'block', type: 'text_indexOf', inputs: { FIND: txt('abc') } },
      { kind: 'block', type: 'text_charAt' },
      { kind: 'block', type: 'text_getSubstring' },
      { kind: 'block', type: 'text_changeCase', inputs: { TEXT: txt('abc') } },
      { kind: 'block', type: 'text_trim', inputs: { TEXT: txt(' abc ') } },
      { kind: 'block', type: 'text_count', inputs: { SUB: txt('a'), TEXT: txt('banane') } },
      { kind: 'block', type: 'text_replace', inputs: { FROM: txt('chat'), TO: txt('chien'), TEXT: txt('mon chat') } },
      { kind: 'block', type: 'text_reverse', inputs: { TEXT: txt('NOCODEX') } },
      { kind: 'block', type: 'lists_split', inputs: { DELIM: txt(',') } }
    ] },
    { name: 'Listes', icon: '📋', colour: '#745CA6', help: 'Ranger plusieurs valeurs ensemble : liste de courses, scores, questions…', contents: [
      { kind: 'block', type: 'lists_create_with', extraState: { itemCount: 0 } },
      { kind: 'block', type: 'lists_create_with', inputs: { ADD0: txt('pomme'), ADD1: txt('banane'), ADD2: txt('cerise') }, extraState: { itemCount: 3 } },
      { kind: 'block', type: 'lists_repeat', inputs: { NUM: num(5) } },
      { kind: 'block', type: 'lists_length' },
      { kind: 'block', type: 'lists_isEmpty' },
      { kind: 'block', type: 'lists_indexOf' },
      { kind: 'block', type: 'lists_getIndex' },
      { kind: 'block', type: 'lists_setIndex' },
      { kind: 'block', type: 'lists_getSublist' },
      { kind: 'block', type: 'lists_sort' },
      { kind: 'block', type: 'lists_reverse' }
    ] },
    { name: 'Variables', icon: '📦', colour: '#A65C81', help: 'Des boîtes avec un nom pour retenir une valeur : score, vies, prénom…', custom: 'VARIABLE' },
    { name: 'Fonctions', icon: '🛠️', colour: '#9A5CA6', help: 'Créer tes propres blocs réutilisables (fonctions) pour ne pas répéter les mêmes blocs.', custom: 'PROCEDURE' }
  ];

  // Mode Facile : seulement les blocs indispensables, regroupés par intention.
  var EASY = [
    { name: 'Démarrer', icon: '🚀', colour: '#FFAB19', help: 'Commence toujours par ici : QUAND faire les choses.',
      types: ['nx_start', 'nx_on_click', 'nx_every', 'nx_after', 'nx_frame', 'nx_on_key', 'nx_on_tap'] },
    { name: 'Afficher', icon: '📱', colour: '#4C97FF', help: 'Mettre des choses à l\'écran.',
      types: ['nx_heading', 'nx_text', 'nx_button', 'nx_input', 'nx_value', 'nx_set_text', 'nx_image', 'nx_card', 'nx_alert', 'nx_ask', 'nx_theme', 'nx_background', 'nx_color', 'nx_media', 'nx_clear'] },
    { name: 'Écrans', icon: '🗂️', colour: '#3D7BD9', help: 'Une app avec plusieurs pages.',
      types: ['nx_page', 'nx_go_page', 'nx_app_bar', 'nx_tab_bar'] },
    { name: 'Jeu', icon: '🎮', colour: '#9966FF', help: 'Un jeu en quelques blocs : une scène, des personnages, un contrôle.',
      types: ['nx_scene', 'nx_sprite', 'nx_emoji', 'nx_control', 'nx_chase', 'nx_camera_follow', 'nx_hud', 'nx_sprite_move', 'nx_sprite_random', 'nx_sprite_delete', 'nx_animate'] },
    { name: 'Touche & tir', icon: '💥', colour: '#C2185B', help: 'Ce qui se passe quand les sprites se touchent.',
      types: ['nx_collide', 'nx_other', 'nx_spawn', 'nx_explode', 'nx_group_count', 'nx_touching'] },
    { name: 'Mondes', icon: '🏰', colour: '#00897B', help: 'Niveaux dessinés avec des lettres, 2.5D, 3D.',
      types: ['nx_level', 'nx_mode25', 'nx_maze', 'nx_scene_gradient'] },
    { name: 'Sons', icon: '🔊', colour: '#CF63CF', help: 'Bruitages, musique et voix.', types: ['nx_sound', 'nx_note', 'nx_speak', 'nx_vibrate'] },
    { name: 'Mémoire', icon: '💾', colour: '#2E7D32', help: 'Garder des infos dans le téléphone.',
      types: ['nx_save', 'nx_load', 'nx_db_add', 'nx_db_all', 'nx_table', 'nx_chart'] }
  ];
  var EASY_BUILTIN = [
    { name: 'Si…', icon: '🔀', colour: '#5C81A6', help: 'Décider : SI quelque chose est vrai ALORS…', contents: [
      { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'controls_if', extraState: { hasElse: true } },
      { kind: 'block', type: 'logic_compare', inputs: { A: num(0), B: num(0) } }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_boolean' }] },
    { name: 'Répéter', icon: '🔁', colour: '#5CA65C', help: 'Faire plusieurs fois la même chose.', contents: [
      { kind: 'block', type: 'controls_repeat_ext', inputs: { TIMES: num(10) } }, { kind: 'block', type: 'controls_forEach' }] },
    { name: 'Nombres', icon: '🔢', colour: '#5C68A6', help: 'Compter et calculer.', contents: [
      { kind: 'block', type: 'math_number', fields: { NUM: 0 } }, { kind: 'block', type: 'math_arithmetic', inputs: { A: num(1), B: num(1) } },
      { kind: 'block', type: 'math_random_int', inputs: { FROM: num(1), TO: num(10) } }] },
    { name: 'Textes', icon: '🔤', colour: '#5CA68D', help: 'Des mots et des phrases.', contents: [
      { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_join' },
      { kind: 'block', type: 'lists_create_with', inputs: { ADD0: txt('pomme'), ADD1: txt('banane') }, extraState: { itemCount: 2 } }] },
    { name: 'Variables', icon: '📦', colour: '#A65C81', help: 'Retenir une valeur (score, vies…).', custom: 'VARIABLE' }
  ];

  function buildToolbox(mode) {
    var cats = [];
    if (mode === 'easy') {
      var byType = {};
      NX_BLOCKS.forEach(function (s) { byType[s.type] = s; });
      EASY.forEach(function (e, i) {
        cats.push({ kind: 'category', name: e.icon + ' ' + e.name, colour: e.colour,
          contents: [label(e.help)].concat(e.types.filter(function (t) { return byType[t]; }).map(function (t) { return toolboxEntry(byType[t]); })) });
        if (i === 3) EASY_BUILTIN.forEach(function (b) {
          var cat = { kind: 'category', name: b.icon + ' ' + b.name, colour: b.colour };
          if (b.custom) cat.custom = b.custom; else cat.contents = [label(b.help)].concat(b.contents);
          cats.push(cat);
        });
      });
      return { kind: 'categoryToolbox', contents: cats };
    }
    function nxCat(key) {
      var c = CATS[key];
      var contents = [label(c.help)];
      NX_BLOCKS.forEach(function (s) { if (s.cat === key) contents.push(toolboxEntry(s)); });
      return { kind: 'category', name: c.icon + ' ' + c.name, colour: c.colour, contents: contents };
    }
    cats.push(nxCat('events'), nxCat('ui'), nxCat('pages'), nxCat('game'), nxCat('control'), nxCat('collide'), nxCat('world'));
    BUILTIN.forEach(function (b) {
      var cat = { kind: 'category', name: b.icon + ' ' + b.name, colour: b.colour };
      if (b.custom) cat.custom = b.custom;
      else cat.contents = [label(b.help)].concat(b.contents);
      cats.push(cat);
    });
    cats.push(nxCat('sound'), nxCat('time'), nxCat('data'), nxCat('db'), nxCat('device'), nxCat('code'));
    return { kind: 'categoryToolbox', contents: cats };
  }

  window.NXBlocks = {
    register: register,
    toolbox: buildToolbox,
    specs: NX_BLOCKS,
    colors: COLORS,
    cats: CATS,
    builtin: BUILTIN,
    byType: BY_TYPE,
    toolboxEntry: toolboxEntry
  };
})();
