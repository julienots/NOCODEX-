# NOCODEX — par SuperEssence studio

**Crée des applications, des sites et des jeux sans écrire de code**, en emboîtant des blocs.
Vois le vrai code de tes blocs dans 5 langages, et exporte ton travail en **HTML**, **ZIP** ou **APK Android** — directement depuis le téléphone, hors ligne.

📲 **Télécharger l'app Android :** [`dist/NOCODEX.apk`](dist/NOCODEX.apk)

## Le plus simple possible

- **🟢 Mode Facile** (par défaut) : seulement les blocs essentiels, rangés par envie (Démarrer, Afficher, Écrans, Jeu, Touche & tir, Mondes, Sons, Mémoire…). **🔥 Mode Expert** : plus de 250 blocs.
- **🔎 Chercher un bloc** : écris « sauter », « score », « son »… et touche le bloc proposé.
- **✨ Je veux créer…** : 24 jeux et apps déjà complets qui fonctionnent, à modifier petit à petit.
- **Blocs tout-en-un** : « contrôler joueur comme jeu de plateforme » (flèches + saut + gravité + manette tactile), « quand joueur touche piece », « créer le niveau » avec des lettres…

## Jeux 2D, 2.5D et 3D complets

Niveaux dessinés en texte (`#` mur, `=` plateforme, `*` étoile, `E` ennemi, `^` pic, `D` porte, `P` départ…), murs et sols solides, gravité, sauts, caméra qui suit, monde plus grand que l'écran, fonds en dégradé ou en parallaxe, groupes de sprites, collisions par groupe, tirs et apparitions, poursuite / patrouille / promenade, animations, barres de vie, particules, tremblement d'écran, pause. **Mode 2.5D** (perspective, ombres, saut en hauteur) et **labyrinthe 3D** à la première personne (raycasting, mini-carte).

## Vraies applications

Plusieurs écrans avec navigation et bouton retour Android, barre de titre, barre d'onglets, cartes, thèmes, animations, fiches (objets), **base de données** locale (ajouter, chercher, modifier, trier), tableaux, **graphiques** (barres, courbe, camembert), envoi de données (POST), compte à rebours.

## Ce que contient l'app

| Onglet | Rôle |
|---|---|
| 🧩 **Blocs** | ~120 blocs NOCODEX + tous les blocs standards (logique, boucles, maths, texte, listes, variables, fonctions). Annuler/refaire, zoom, code en direct `</>`. |
| ⌨️ **Code** | Le code de tes blocs en **JavaScript, Python, PHP, Lua, Dart** et la page **HTML** complète. « Mon code » : écris ton propre HTML / CSS / JavaScript. |
| ▶️ **Aperçu** | Lance l'app, plein écran, tailles téléphone/tablette, console d'erreurs. |
| 🎓 **Apprendre** | Visite guidée, 16 leçons pas à pas avec défis, encyclopédie de chaque bloc (rendu + code dans 5 langages), langages, glossaire, FAQ. |
| 📁 **Projets** | Projets multiples (sauvegarde automatique), 24 modèles (jeux et apps complets), import/export `.nocodex`. |

**Catégories de blocs :** ⚡ Événements · 📱 Écran (textes, boutons, champs, curseurs, menus, images, vidéos, YouTube, listes, boîtes, styles, messages) · 🎮 Jeux & Dessin (scène, sprites emoji/image, vitesse, gravité, rebonds, collisions, manette tactile, score, dessin) · 🔊 Sons & Voix · ⏱️ Temps · 🌐 Données & Web (sauvegarde, API JSON, partage, copie) · 📍 Appareil (vibration, GPS, caméra, plein écran) · 🧩 Code avancé (JavaScript / HTML / CSS bruts) · 🖼️ Médias du projet (tes images et sons).

**Exports :**
- 🌐 **HTML** : un seul fichier autonome.
- 📦 **ZIP** : site + code dans les 5 langages + projet + mode d'emploi pour publier.
- 🤖 **APK** : vraie application Android signée (schéma v2), avec ton nom et ton icône, générée **dans le téléphone** en JavaScript (`web/js/apk.js`).
- 💾 **.nocodex** : le projet, pour le sauvegarder ou le rouvrir ailleurs.

Au lancement : logo **SuperEssence studio**, puis chargement du nom **NOCODEX**.

## Organisation du code

```
web/               l'application (HTML/CSS/JS, fonctionne aussi dans un navigateur : ouvrir web/index.html)
  js/blocks.js     définition des blocs + génération JS/Python/PHP/Lua/Dart
  js/runtime.js    bibliothèque « NX » incluse dans chaque app créée
  js/apk.js        générateur + signature d'APK (v1 + v2) en JavaScript
  js/templates.js  projets modèles      js/learn.js  leçons, glossaire, FAQ
  js/app.js        interface du studio  vendor/      Blockly, fflate, forge, highlight.js
android/           coquille WebView native (studio et modèle des APK exportés)
tools/build.sh     construit le modèle d'APK puis dist/NOCODEX.apk (aapt2 + javac + d8, sans Gradle)
tools/smoke.js     test automatique dans Chromium (tous les modèles, 5 langages, aperçu, exports)
```

## Construire

Prérequis : Node 18+, JDK 17+, Android SDK (`platforms;android-34`, `build-tools;36.0.0`).

```bash
npm install
ANDROID_HOME=/chemin/sdk npm run build   # → build/NOCODEX.apk
npm test                                 # vérifie l'export APK et l'interface
```

La clé de signature du studio est créée dans `build/nocodex-release.jks` (non versionnée) ; définis `NOCODEX_KEYSTORE` / `NOCODEX_KEYSTORE_PASS` pour réutiliser la tienne et pouvoir publier des mises à jour.
