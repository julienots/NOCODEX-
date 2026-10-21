/*
 * NOCODEX — tout le contenu pédagogique : leçons pas à pas, langages, glossaire, FAQ.
 * L'encyclopédie des blocs est générée automatiquement depuis blocks.js.
 */
(function () {
  'use strict';

  var LESSONS = [
    { id: 'l1', icon: '👋', title: 'Ta première application', time: '3 min', template: 'bonjour',
      intro: 'Tu vas créer une app qui affiche un titre, un texte et un bouton qui parle.',
      steps: [
        'Va dans l\'onglet <b>🧩 Blocs</b>. À gauche il y a des <b>catégories</b> (Événements, Écran, Jeux…). Touche-en une pour voir ses blocs.',
        'Ouvre <b>⚡ Événements</b> et glisse le bloc <b>« quand l\'application démarre »</b> dans la grande zone. C\'est le point de départ.',
        'Ouvre <b>📱 Écran</b> et glisse <b>« gros titre »</b> À L\'INTÉRIEUR du bloc de démarrage : les blocs s\'emboîtent comme des LEGO.',
        'Touche le texte « Bienvenue ! » pour écrire ce que tu veux.',
        'Ajoute en dessous un bloc <b>« bouton … quand on clique »</b>, puis glisse un bloc <b>« message »</b> dans le bouton.',
        'Appuie sur <b>▶ Lancer</b> en haut : ton app s\'affiche dans l\'onglet <b>Aperçu</b>. Touche le bouton !'
      ],
      challenge: 'Change la couleur de fond avec le bloc « couleur de fond », et fais dire une phrase au téléphone avec « dire à voix haute ».' },
    { id: 'l2', icon: '📦', title: 'Les variables (mémoire)', time: '4 min', template: 'compteur',
      intro: 'Une variable est une boîte avec un nom qui retient une valeur : un score, un prénom, un nombre de vies…',
      steps: [
        'Ouvre <b>📦 Variables</b> → <b>Créer une variable</b> et appelle-la <code>score</code>.',
        'Le bloc <b>« définir score à 0 »</b> met une valeur dans la boîte. Place-le au démarrage.',
        'Le bloc <b>« ajouter 1 à score »</b> augmente la valeur. Mets-le dans un bouton.',
        'Le bloc rond <b>« score »</b> lit la valeur : glisse-le dans « changer le texte de … en ».',
        'Pour garder un record même après avoir fermé l\'app : <b>🌐 Données → sauvegarder</b> et <b>charger la sauvegarde</b>.'
      ],
      challenge: 'Ajoute un bouton « Remise à zéro » qui remet score à 0.' },
    { id: 'l3', icon: '🔀', title: 'Les conditions : si… sinon', time: '4 min', template: 'devine',
      intro: 'Un programme prend des décisions : SI une chose est vraie ALORS il fait ceci, SINON cela.',
      steps: [
        'Ouvre <b>🔀 Logique</b> et prends le bloc <b>« si … faire »</b>.',
        'Dans la case « si », mets une comparaison : <b>« … = … »</b>. Touche le symbole = pour choisir &lt;, &gt;, ≠…',
        'Touche la petite roue ⚙️ du bloc « si » pour ajouter des <b>« sinon si »</b> et un <b>« sinon »</b>.',
        'Combine plusieurs conditions avec <b>« et » / « ou »</b>, ou inverse-les avec <b>« non »</b>.'
      ],
      challenge: 'Dans « Devine le nombre », affiche un message spécial si le joueur gagne en moins de 5 essais.' },
    { id: 'l4', icon: '🔁', title: 'Les boucles : répéter', time: '3 min', template: 'dessin',
      intro: 'Au lieu de copier 100 fois le même bloc, on demande à l\'ordinateur de répéter.',
      steps: [
        '<b>« répéter 10 fois »</b> : le plus simple.',
        '<b>« compter avec i de 1 à 10 »</b> : la variable i change à chaque tour (1, 2, 3…). Pratique pour faire des tables de multiplication.',
        '<b>« pour chaque élément de la liste »</b> : parcourt une liste.',
        '<b>« répéter tant que »</b> : continue tant qu\'une condition est vraie (attention aux boucles infinies !).',
        'Pour répéter dans le temps (toutes les secondes), utilise plutôt <b>⚡ « toutes les X secondes »</b>.'
      ],
      challenge: 'Dessine 10 carrés alignés en utilisant « compter avec i » et le rectangle à la position i × 35.' },
    { id: 'l5', icon: '📋', title: 'Les listes', time: '4 min', template: 'taches',
      intro: 'Une liste range plusieurs valeurs dans une seule variable : des tâches, des questions, des scores…',
      steps: [
        '<b>« créer une liste avec »</b> : touche la roue ⚙️ pour ajouter des éléments.',
        '<b>« insérer à la fin »</b> (bloc « dans la liste … définir/insérer ») pour ajouter un élément.',
        '<b>« obtenir # »</b> pour lire un élément (le premier est le n°1).',
        '<b>« longueur de »</b> donne le nombre d\'éléments.',
        '<b>📱 « afficher la liste »</b> la montre à l\'écran, et <b>⚡ « quand on touche un élément de la liste »</b> réagit au toucher.'
      ],
      challenge: 'Ajoute un bouton « Tout effacer » qui vide la liste et la sauvegarde.' },
    { id: 'l6', icon: '🛠️', title: 'Les fonctions (tes propres blocs)', time: '4 min', template: null,
      intro: 'Une fonction est un groupe de blocs auquel tu donnes un nom pour le réutiliser partout.',
      steps: [
        'Ouvre <b>🛠️ Fonctions</b> et prends <b>« pour faire quelque chose »</b>. Renomme-le, par exemple <code>afficherScore</code>.',
        'Mets des blocs dedans.',
        'Un nouveau bloc <b>« afficherScore »</b> apparaît dans la catégorie : utilise-le où tu veux !',
        'Avec la roue ⚙️ tu peux ajouter des <b>paramètres</b> (des valeurs qu\'on donne à la fonction).',
        'Le bloc <b>« pour faire … retourner »</b> crée une fonction qui renvoie un résultat (comme un calcul).'
      ],
      challenge: 'Crée une fonction « gagner » qui joue l\'effet victoire, fait vibrer et affiche un message.' },
    { id: 'l7', icon: '🎮', title: 'Créer un jeu vidéo', time: '8 min', template: 'jeu',
      intro: 'Un jeu, c\'est une scène, des sprites (personnages), une boucle de jeu, des collisions et un score.',
      steps: [
        '<b>🎮 « créer une scène »</b> : la zone de jeu. x va de gauche (0) à droite, y de haut (0) en bas.',
        '<b>« créer le sprite »</b> : donne-lui un nom (ex. <code>joueur</code>) et une apparence (un emoji ou une image).',
        '<b>⚡ « à chaque image »</b> : la boucle de jeu, répétée 60 fois par seconde. C\'est là qu\'on bouge les sprites.',
        '<b>« touche flèche enfoncée ? »</b> + <b>« déplacer »</b> = contrôler le joueur. Ajoute <b>« afficher la manette tactile »</b> pour jouer au doigt.',
        '<b>« … touche … ? »</b> détecte une collision. Augmente le score, joue un son, replace l\'objet.',
        '<b>« afficher en haut de la scène »</b> montre le score. <b>« arrêter les répétitions »</b> = Game Over.',
        'Bonus : <b>vitesse x / y</b>, <b>rebondit sur les bords</b>, <b>gravité</b> font bouger les sprites tout seuls (jeux de plateforme, casse-briques…).'
      ],
      challenge: 'Ajoute un ennemi 💣 qui tombe aussi : s\'il touche le joueur, c\'est perdu.' },
    { id: 'l8', icon: '🔊', title: 'Sons, musique et voix', time: '3 min', template: 'piano',
      intro: 'Pas besoin de fichiers : le téléphone fabrique les sons.',
      steps: [
        '<b>« jouer l\'effet »</b> : pièce, saut, explosion, victoire…',
        '<b>« jouer la note »</b> : enchaîne plusieurs notes pour une mélodie.',
        '<b>« bip fréquence »</b> : un son précis (440 Hz = la).',
        '<b>« dire à voix haute »</b> : synthèse vocale.',
        '<b>« jouer le son »</b> : un fichier mp3 depuis Internet ou tes médias.'
      ],
      challenge: 'Joue « Au clair de la lune » : do do do ré mi ré do mi ré ré do.' },
    { id: 'l9', icon: '🌐', title: 'Internet, API et sauvegarde', time: '5 min', template: 'api',
      intro: 'Ton app peut récupérer des informations sur Internet (météo, blagues, crypto…) et garder des données dans le téléphone.',
      steps: [
        'Une <b>API</b> est une adresse web qui renvoie des données, souvent au format <b>JSON</b>.',
        '<b>« télécharger … puis »</b> : quand la réponse arrive, les blocs dedans s\'exécutent.',
        '<b>« dans … lire … »</b> extrait une information : <code>current_weather.temperature</code> lit « temperature » dans « current_weather ».',
        '<b>« sauvegarder / charger »</b> gardent des données dans le téléphone, même hors ligne.',
        'APIs gratuites sans clé pour t\'entraîner : open-meteo.com (météo), api.chucknorris.io (blagues), pokeapi.co (Pokémon), restcountries.com (pays).'
      ],
      challenge: 'Avec https://pokeapi.co/api/v2/pokemon/pikachu affiche l\'image : chemin « sprites.front_default ».' },
    { id: 'l10', icon: '⌨️', title: 'Le vrai code (aller plus loin)', time: '5 min', template: 'html',
      intro: 'Tes blocs SONT du vrai code. Et quand tu veux, tu peux écrire du code directement.',
      steps: [
        'Onglet <b>⌨️ Code → Code des blocs</b> : choisis un langage (JavaScript, Python, PHP, Lua, Dart) pour voir la traduction de tes blocs.',
        'Le <b>JavaScript</b> est celui qui s\'exécute dans ton app. Les autres servent à apprendre et à réutiliser ta logique ailleurs.',
        'Onglet <b>Code → Mon code</b> : écris du <b>HTML</b> (structure), du <b>CSS</b> (style) et du <b>JavaScript</b> (actions). Il est ajouté à ton app.',
        'Dans ton JavaScript, toutes les fonctions des blocs sont disponibles : <code>NX.toast("Salut")</code>, <code>NX.sprite(...)</code>…',
        'Les blocs <b>🧩 Code avancé</b> permettent aussi de glisser une ligne de code au milieu de tes blocs.'
      ],
      challenge: 'Dans Mon code → CSS, écris <code>button { background: hotpink; }</code> et lance l\'app.' },
    { id: 'l11', icon: '📦', title: 'Exporter : HTML, ZIP, APK', time: '4 min', template: null,
      intro: 'Une fois ton app prête, tu peux la partager ou l\'installer comme une vraie application.',
      steps: [
        'Touche <b>⬇️ Exporter</b> en haut à droite.',
        '<b>HTML</b> : un seul fichier qui s\'ouvre dans n\'importe quel navigateur (téléphone, PC, Mac). Parfait pour un site.',
        '<b>ZIP</b> : le site complet + le code de tes blocs dans les 5 langages + ton projet. Pour publier sur un hébergeur (GitHub Pages, Netlify, Vercel…).',
        '<b>APK</b> : une vraie application Android, signée, générée directement dans le téléphone. Installe-la ou envoie-la à tes amis.',
        'Dans <b>⚙️ Réglages du projet</b> : choisis le nom de l\'app et son icône avant d\'exporter.',
        'Pour installer un APK, Android demande d\'autoriser « Sources inconnues » pour NOCODEX ou ton gestionnaire de fichiers : c\'est normal.'
      ],
      challenge: 'Exporte ton jeu en APK et installe-le sur ton téléphone !' }
  ];

  var LANGUAGES = [
    { name: 'JavaScript', icon: '🟨', where: 'Navigateurs, sites, apps mobiles, serveurs (Node.js)', what: 'LE langage du web. C\'est lui qui fait tourner ton app NOCODEX. Il gère les clics, les animations, les jeux, les données.', hello: 'console.log("Bonjour !");' },
    { name: 'HTML', icon: '🧱', where: 'Toutes les pages web', what: 'Ce n\'est pas un langage de programmation mais de STRUCTURE : titres, paragraphes, boutons, images.', hello: '<h1>Bonjour !</h1>' },
    { name: 'CSS', icon: '🎨', where: 'Toutes les pages web', what: 'Le langage du STYLE : couleurs, tailles, positions, animations.', hello: 'h1 { color: gold; }' },
    { name: 'Python', icon: '🐍', where: 'Intelligence artificielle, science, scripts, serveurs, enseignement', what: 'Très lisible, idéal pour apprendre. Utilisé par la NASA, Google, Instagram…', hello: 'print("Bonjour !")' },
    { name: 'PHP', icon: '🐘', where: 'Serveurs web (WordPress, Facebook à ses débuts)', what: 'Fabrique des pages web côté serveur, gère les bases de données et les comptes.', hello: '<?php echo "Bonjour !"; ?>' },
    { name: 'Lua', icon: '🌙', where: 'Jeux vidéo (Roblox, World of Warcraft, Love2D), objets connectés', what: 'Petit, rapide et simple : très utilisé pour programmer les jeux.', hello: 'print("Bonjour !")' },
    { name: 'Dart', icon: '🎯', where: 'Applications Flutter (Android, iOS, Web, PC)', what: 'Le langage de Flutter, de Google, pour créer des apps mobiles natives.', hello: 'void main() => print("Bonjour !");' },
    { name: 'JSON', icon: '📄', where: 'Échange de données entre apps et serveurs (API)', what: 'Un format pour écrire des données : {"nom": "Léa", "age": 12}.', hello: '{"message": "Bonjour !"}' }
  ];

  var GLOSSARY = [
    ['Algorithme', 'Une suite d\'étapes pour résoudre un problème, comme une recette de cuisine.'],
    ['API', 'Une adresse web qui renvoie des données (météo, blagues…) à ton app.'],
    ['APK', 'Le fichier d\'installation d\'une application Android.'],
    ['Booléen', 'Une valeur qui vaut vrai ou faux.'],
    ['Boucle', 'Un morceau de programme répété plusieurs fois.'],
    ['Bug', 'Une erreur dans un programme. « Débuguer » = la trouver et la corriger.'],
    ['Canvas / Scène', 'Une zone de dessin où l\'on affiche des formes et des sprites.'],
    ['Collision', 'Quand deux objets d\'un jeu se touchent.'],
    ['Condition', 'Un test « si… alors… sinon ».'],
    ['Console', 'Une zone où le programme écrit des messages pour aider à comprendre ce qui se passe.'],
    ['CSS', 'Le langage qui décrit le style d\'une page (couleurs, tailles).'],
    ['Événement', 'Quelque chose qui arrive : un clic, une touche, un minuteur…'],
    ['Fonction', 'Un groupe d\'instructions avec un nom, réutilisable.'],
    ['Hébergeur', 'Un service qui met ton site en ligne (GitHub Pages, Netlify, Vercel…).'],
    ['HTML', 'Le langage qui décrit la structure d\'une page web.'],
    ['id', 'Le nom unique d\'un élément à l\'écran, pour le retrouver et le modifier.'],
    ['JSON', 'Un format texte pour échanger des données.'],
    ['Liste (tableau)', 'Une variable qui contient plusieurs valeurs rangées dans l\'ordre.'],
    ['Paramètre', 'Une valeur donnée à une fonction ou à un bloc.'],
    ['Pixel', 'Un petit point de l\'écran ; les tailles et positions se comptent en pixels.'],
    ['Sprite', 'Un personnage ou objet qui bouge dans un jeu.'],
    ['Texte (chaîne)', 'Une suite de caractères : un mot, une phrase.'],
    ['Variable', 'Une boîte avec un nom qui retient une valeur.'],
    ['ZIP', 'Un fichier qui contient plusieurs fichiers compressés.']
  ];

  var FAQ = [
    ['Est-ce que je peux vraiment tout faire ?', 'Avec les blocs tu peux faire des sites, des apps, des jeux 2D, des quiz, des outils, utiliser Internet, le GPS, la caméra, les sons… Et pour TOUT le reste, les blocs « Code avancé » et l\'onglet « Mon code » acceptent du vrai HTML/CSS/JavaScript : tout ce qu\'un navigateur sait faire, ton app peut le faire. Les limites : pas d\'accès bas niveau au système Android (Bluetooth, NFC, contacts…), pas de jeux 3D lourds sans code.'],
    ['Pourquoi plusieurs langages ?', 'Ton app s\'exécute en JavaScript. Les traductions en Python, PHP, Lua et Dart te montrent la même logique dans d\'autres langages : c\'est idéal pour apprendre à coder « pour de vrai » et réutiliser tes algorithmes (calculs, conditions, boucles, fonctions). Les blocs spécifiques à l\'écran utilisent une bibliothèque « nx » qui n\'existe que dans NOCODEX.'],
    ['Mon projet est-il sauvegardé ?', 'Oui, automatiquement dans le téléphone à chaque modification. Pour le garder en sécurité ou le passer à un autre appareil : Projets → Exporter le fichier .nocodex.'],
    ['L\'APK ne s\'installe pas', 'Autorise l\'installation depuis des « sources inconnues » quand Android le demande. Si une ancienne version de la même app est installée avec une autre signature, désinstalle-la d\'abord. Play Protect peut afficher un avertissement car l\'app ne vient pas du Play Store : choisis « Installer quand même ».'],
    ['Puis-je publier sur le Play Store ?', 'Le Play Store demande un format AAB et un compte développeur Google (25 $). Le ZIP exporté contient le site complet : avec Android Studio ou des outils comme Capacitor/Bubblewrap tu peux le transformer en AAB. Pour partager simplement, l\'APK ou un site sur GitHub Pages suffisent.'],
    ['Mon app a besoin d\'Internet ?', 'Non, sauf si tu utilises des blocs « télécharger », des images ou sons venant d\'Internet.'],
    ['Comment utiliser mes propres images et sons ?', 'Touche ⚙️ (Réglages du projet) → Médias → « Ajouter une image ou un son ». Ensuite, dans 📱 Écran, le bloc « mon média » te permet de choisir ton fichier : mets-le dans « image », dans l\'apparence d\'un sprite ou dans « jouer le son ». Les médias sont inclus dans l\'app exportée (HTML, ZIP, APK) et marchent hors ligne.'],
    ['Comment supprimer un bloc ?', 'Glisse-le vers la corbeille ou vers la liste des catégories, ou appuie longuement dessus → Supprimer.'],
    ['Comment dupliquer un bloc ?', 'Appui long (ou clic droit) sur le bloc → Dupliquer.'],
    ['J\'ai fait une erreur !', 'Utilise les boutons ↶ annuler / ↷ refaire en haut de la zone de blocs.']
  ];

  window.NXLearn = { lessons: LESSONS, languages: LANGUAGES, glossary: GLOSSARY, faq: FAQ };
})();
