# V3.3 — Avatar Morph (candidat)

Transformation textuelle déterministe par catalogue local : singe, chat, loup, alien, robot, humain ; couleur et style cyberpunk. Maillages stylisés WebGL, suivi facial MediaPipe de tête/bouche/clignements et visage texturé estimé depuis un portrait local. Export GLB de la pose actuelle (pas de rig exporté ni d'animation). Aucune photo publiée ou envoyée ; modèles et bibliothèques téléchargés à la demande. Aucun moteur texte-vers-3D libre ni photoréalisme garanti. Tests Node et UI à lancer ; WebGL/CDN/visage réel à vérifier séparément.

# Avatar WebGL — candidat V3.2

Import local GLB/VRM autonome (100 Mo maximum), matériaux et textures originaux, éclairage trois points, ombres, ACES, caméra orbitale et PNG. Animation expérimentale des huit segments des membres pour VRM humanoïde ; GLB générique sans mapping de squelette reste statique. Aucun modèle photoréaliste fourni ni génération de visage à partir d'une photo. Internet nécessaire pour télécharger Three.js 0.180.0 et three-vrm 3.4.4 au premier import ; aucun envoi du fichier local. Dépendances et rendu WebGL à qualifier sur navigateur réel. Le mode procédural reste disponible.

# V3.2 — Avatar Motion (candidate)

Atelier procédural local : nom, style humanoïde/robot/néon, couleur, morphologie et rotation. Pose neutre sans caméra ; capture réelle MediaPipe normalisée, sans données inventées. Enregistrement de 18 000 images maximum, export JSON et PNG. Pas de modèle GLB riggé, de génération photoréaliste ou de retargeting Blender validé. CI à confirmer.

# NIKO 3D VIBES V3 — NeuroMotion Engine

## V3.1 — socle partagé et CI

Copie canonique de Studio Niko Core 0.1.0 (blob fb5d7b84d160979f2e437156922d7b21b1261796), diagnostic volontaire sans télémétrie, aucune donnée caméra ou projet dans le diagnostic. Cache PWA versionné et actifs du build actualisés. Le workflow utilise ubuntu-24.04 : l'échec du run 45938198279 venait de l'incompatibilité Playwright 1.51.0 avec ubuntu26.04-x64. Nouvelle CI et tests sur matériel réel à confirmer.

## V3 : amélioration du moteur (27 novembre 2026)
- Inférence MediaPipe en Worker CPU lorsque compatible, avec bascule CPU principal en cas d'échec. Un seul frame en vol, fermeture des modèles et rejet des résultats périmés.
- Cadence d'inférence adaptative (65–500 ms, mode économie 125 ms minimum, mode fluide 40 ms minimum), latence et backend affichés. Ce ne sont pas des benchmarks.
- Association des deux mains aux trajectoires précédentes, geste dynamique de balayage optionnel dans Holo, sortie MIDI facultative dans Motion Sound (pincement, note off, CC74). Web MIDI dépend du navigateur et d'une sortie autorisée.
- Arrêt du capteur lorsque l'onglet est masqué, remise à zéro après déplacement dans une vidéo, coupure audio/MIDI en cas de perte du flux.
- 25 tests Node (13 historiques + 12 nouveaux), vérification statique, build 19 ressources. Tests Worker et MIDI avec doubles, pas de mesure sur matériel réel.
- Le workflow GitHub installe Playwright et vérifie les dix modes, le dessin/OBJ et l'arrêt du capteur sur deux tailles d'écran. Test navigateur local non réussi : Chromium n'a pas répondu avant la limite. CI distante non exécutée. Le test UI ne valide ni MediaPipe réel ni Blender.
- Les modèles MediaPipe sont téléchargés au premier usage. Aucun envoi de frames. Pas de garantie hors-ligne complète, d'exactitude clinique ou de compatibilité tous appareils. Le rendu 3D reste procédural Canvas, pas un moteur WebGL ; BVH et import GLB non intégrés.

### Vérification
`npm test && npm run check && python3 scripts/verify.py && npm run build`

Test navigateur supplémentaire : `python -m pip install playwright==1.51.0`, `python -m playwright install chromium`, `python scripts/browser_smoke.py`.

# NIKO 3D VIBES — Human Motion Intelligence V2.0
Studio Niko Design — adaptation web expérimentale de trois projets MIT de Tuba Khan (@tubakhxn).

## Démarrage
1. Décompresser le dossier.
2. Dans ce dossier, lancer `python -m http.server 8000` (ou `python3 -m http.server 8000`).
3. Ouvrir http://localhost:8000 dans Chrome ou Edge. Sur smartphone, utiliser un hébergement HTTPS (par exemple GitHub Pages ou Vercel statique). Pas de serveur de calcul, ni d'API payante. Les modèles et WASM sont téléchargés au premier usage depuis Google Storage et jsDelivr. Internet reste nécessaire si ces ressources ne sont pas en cache. Ne pas ouvrir index.html directement depuis un gestionnaire de fichiers.
4. Activer la caméra ou importer une vidéo locale. Autoriser la caméra si nécessaire. Pour arrêter la caméra, cliquer Arrêter.

## Modes
- Holo 3D : main ouverte = éclaté, poing = assemblage, pincement et déplacement = rotation, signe V maintenu = modèle suivant, écartement de deux mains = zoom. Commandes souris et curseur également disponibles. Modèles procéduraux originaux : turbine, articulation et caméra cinéma, non conformes à des plans industriels.
- Biomécanique : angles 2D des genoux, estimation expérimentale de cadence à partir des pics de signal cheville-hanche, journal et export JSON. Vue latérale, personne entière, bon éclairage. Ce n'est pas un dispositif médical ni un outil de mesure clinique. Ni vitesse ni longueur de foulée calibrée.
- Robot : animations d'un robot virtuel piloté par gestes reconnus. Aucune commande matérielle. Les états COMPILATION et DÉPLOIEMENT sont des libellés visuels, pas des opérations informatiques autonomes.
- Motion Sound : activer le synthétiseur, déplacer la main pour modifier la hauteur et le filtre, pincer pour augmenter le volume. Web Audio, aucun son préenregistré.

## Architecture
MediaPipe Tasks Vision 0.10.14 (Hand Landmarker et Pose Landmarker Lite) -> géométrie des repères -> hystérésis et stabilisation des gestes -> dix modules locaux. Modèles 3D rendus par projection perspective Canvas 2D (pas de WebGL). PWA avec cache du shell local, installation à vérifier sur appareil. Pas de compte, pas de télémétrie distante, pas de transmission des pixels. Les hôtes de ressources voient les requêtes de téléchargement ordinaires. L'export est explicite et local.

## Extensions V2
- Cinema : paramètres de caméra virtuelle (panoramique, inclinaison, focale), enregistrement et export JSON. Pas de rendu vidéo ni de contrôle de caméra physique.
- DJ : deux fichiers audio locaux, lecture/pause, crossfader à puissance constante et filtre passe-bas, contrôle gestuel facultatif. Pas de synchronisation BPM automatique.
- Art 3D : tracés par pincement ou souris/tactile, rotation, annulation et export OBJ (points et lignes, sans couleurs ni maillage).
- Digital Twin : visualisation 3D des repères corporels estimés ; pas de reconstruction anatomique.
- Gesture Agent : apprentissage de poses de main par comparaison de descripteurs, stockées localement. Actions prédéfinies uniquement, activation explicite et confirmation avant effacement. Aucun agent LLM distant.
- Motion Capture : 33 repères à une cadence cible jusqu'à 15 Hz, export JSON, script Blender créant des objets articulaires animés et leurs liens. Pas de retargeting automatique. Les coordonnées restent estimées.

## Validation
`npm test` : 13 tests unitaires. `npm run check` : syntaxe JS. `python3 scripts/verify.py` : références DOM, fichiers, manifeste PWA, cache et syntaxe Blender. `npm run build` : production statique dans public-build/.
Caméra, modèles distants, lecture audio et import Blender à tester sur appareils réels. Aucun résultat clinique validé. Voir TESTS.txt et NOTICE.txt. Aucun clonage intégral des dépôts d'origine.

## GitHub et Vercel
Dépôt public autorisé explicitement par le propriétaire ; le code distribué est consultable. Créer un dépôt vide, sans README ni licence automatique, puis pousser le commit local. Voir PUBLISH.md. GitHub Actions lance les contrôles à chaque push ou pull request. Pour Vercel, importer le dépôt, sélectionner le preset Other et conserver vercel.json ; le build n'a pas besoin de clé API. La publication sur Vercel expose normalement le site même si le dépôt est privé : vérifier les réglages d'accès avant de publier. Les offres gratuites sont soumises aux quotas et conditions de chaque service.

## Droits et confidentialité du code
Voir [LICENSE.md](LICENSE.md) et [NOTICE.txt](NOTICE.txt). Dépôt public autorisé ; ne publier aucun secret. `python3 scripts/check-secrets.py` contrôle les fichiers suivis par Git de façon heuristique, sans garantie exhaustive. Les sources JavaScript livrées au navigateur restent consultables même si le dépôt est privé ; ne jamais y inclure de secrets.

## Code Mode Pro Security
Le moteur local AutoCoder (blob `2ca34b69a196e14881bb1c50847d4764387761a5`) est exécuté par `scripts/code-mode-audit.mjs` avec un chemin externe. Il n'est pas redistribué. Périmètre : fichiers texte racine admissibles selon son schéma ; les autres chemins sont listés comme exclus. Remplacement du sink HTML statique par un template DOM. En-têtes Vercel anti-iframe et restriction des objets, des bases et des formulaires. Publication contrôlée (public uniquement avec --allow-public) avec vérification distante et approbation par SHA via `scripts/private-publish.py` (voir PUBLISH.md). Le contrôle est local et non exhaustif ; aucune invocation Agnes AI. Aucun chiffrement, aucune protection anti-copie du JavaScript distribué. Les tests navigateur et la visibilité distante doivent être confirmés avant mise en production.
