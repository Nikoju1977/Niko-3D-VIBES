# V7.5.1 — budget de rendu et endurance (candidate)

Le cycle de rendu ralentit selon le coût CPU mesuré, avec plafonds par profil et réduction de résolution en économie. Les surfaces Canvas immobiles ne sont recalculées qu'après changement de vue. Les commandes de suivi sont invalidées une seule fois après perte de fraîcheur du signal mains/corps ; les commandes manuelles sont indépendantes. Test d'endurance Chromium : 60 secondes de flux caméra simulé, vraie inférence MediaPipe et six changements de mode/profil. Mesure CPU de soumission de rendu, pas mesure GPU ni garantie de température/autonomie. Appareils physiques et plusieurs heures de session restent à tester.

# V7.5 — qualité média (candidate)

Lecture DJ conditionnée au décodage des métadonnées, erreurs visibles, crête échantillonnée dBFS réellement mesurée après compression (pas une mesure true peak), deux pistes WAV testées avec contrôle master et arrêt. Enregistrement du rendu WebGL, export WebM ou MP4 selon MediaRecorder, test de décodage du résultat. Nouveau test de démarrage et navigation Firefox/WebKit à viewport mobile (pas Safari ou téléphone physique). Fusion après validation complète. Pas de nouveau service payant ni de génération photoréaliste.

# V7.4 — stabilité du suivi facial (candidate)

Conservation du maillage photographique : variations relatives des repères par rapport à une calibration neutre, amplitudes bornées et lissage. Décodage de portrait alternatif si ImageBitmap indisponible, détection des nouvelles images uniquement, indication réelle du temps d'inférence, recalibration explicite. Nouveau test de suivi MediaPipe sur flux vidéo construit à partir d'un portrait public, sans webcam physique et sans données personnelles de l'utilisateur. Ce n'est pas une reconstruction complète ni une validation anatomique. Fusion après CI.

# V7.3.1 — correctif de démarrage (candidat)

Caméra visage indépendante des modèles mains/corps, aperçu immédiatement disponible, annulation et redémarrage par génération de session, délais de chargement bornés, messages de permissions, récupération PWA indépendante et cache cohérent par version. Nouveau test Chromium avec périphérique caméra simulé et véritable inférence MediaPipe, arrêt/redémarrage et réparation. Le matériel physique reste non vérifié. Aucun changement de confidentialité ni collecte de données.

# V7.3 — Motion Expression (candidate)

Prises faciales locales : enregistrement des coefficients MediaPipe ou du contrôle manuel (sources distinctes), lecture interpolée, import/export JSON et export GLB animé des morph targets compatibles. Maximum 60 s/1800 images ; arrêt sur perte du signal ou changement d'atelier. Le fichier GLB animé n'est proposé que pour les cibles GLB compatibles, pas pour VRM. Tests unitaires et navigateur avec une cible de morphologie réelle et une prise manuelle ; aucune prétention de validation sur caméra physique. Aucun modèle génératif libre intégré.

# V7.2 — Expression Studio (candidate)

Les GLB contenant des cibles faciales reconnues et les VRM contenant des expressions peuvent recevoir les coefficients MediaPipe localement. Détection explicite des canaux compatibles, essai manuel de la bouche, lissage et remise à zéro, priorité du suivi facial sur les clips. Ne crée pas de rig pour un modèle statique et ne génère pas d'avatar photoréaliste à partir d'un prompt. Le test navigateur utilise un GLB synthétique muni d'une vraie cible de morphologie ; caméra physique et VRM réel restent à qualifier.

# V7.1 — qualité de production (candidate)

Matériaux de créatures avec relief procédural, détails de modelage, environnement PBR, lissage facial temporel et clignements indépendants. Les formes sont toujours stylisées, non photoréalistes. Import GLB invalide ne doit plus détruire la scène précédente. DJ : deux niveaux, vitesses, positions, master et compresseur de protection (pas de beatmatch ni de limiteur brickwall). Art PNG. Enregistrement vidéo arrêté si onglet masqué. CI à valider.

## V7 — atelier de lecture et export vidéo

Lecture des clips GLB incorporés (AnimationMixer), choix du clip, lecture/pause, position, vitesse, recadrage et export WebM local de 60 s maximum si MediaRecorder est disponible. La capture vidéo ne contient ni audio ni webcam. Le test WebGL utilise une animation synthétique déterministe générée par le moteur GLB, et non une prétendue capture réelle. Le photoréalisme reste dépendant du modèle importé.

# V7 Studio — candidate

Refonte du poste de création, guide contextuel, accès directs et agrandissement. Holo utilise un nouveau maillage surfacique ombré (Canvas 2D) par défaut ; le moteur de points WebGL V6.5 reste disponible. Les moteurs natifs, garde-fous cliniques, licences et intégrité sont conservés. Version candidate à valider.

# NIKO 3D VIBES — V6.5 Robust Vision (candidat)

Studio Niko Design · PWA créative et analyse expérimentale du mouvement. **Non médical.**

[Application publique](https://niko-3d-vibes.vercel.app/) · [Candidat V6.5 / PR 7](https://github.com/Nikoju1977/Niko-3D-VIBES/pull/7) · [CI](https://github.com/Nikoju1977/Niko-3D-VIBES/actions)

**État vérifié le 27 novembre 2026 :** l'alias Vercel est READY sur V3.4 (commit 9a0ec8bda4fb8c06b7806e1ac1f5828611df5991), pas V6.5. Le candidat V6.5 5a006b99c1e619e4b8164e51c20fde33a59861cb a réussi 91/91 tests et un workflow complet 46005477907 ; le workflow 46005485231 a aussi réussi les tests Node et le build mais échoué à l'installation Playwright (dépôt Microsoft HTTP 403). La révision documentaire/CI suivante doit être validée à son tour. Aucun lancement IBM, aucune invocation Agnes attestée, aucune validation clinique ou caméra réelle.

## Fonctions du candidat
- Onze ateliers : Holo, biomécanique, robot virtuel, Motion Sound, Cinema, DJ, Art 3D, Digital Twin, Gesture Agent, Motion Capture, Avatar. Voir les guides historiques ci-dessous et les documents des moteurs.
- V6.5 : angles 2D et alternances bilatérales de genoux/minute, régression temporelle, adaptation de rythme, expiration des estimations, rejet des anomalies géométriques. Les alternances ne sont pas des pas mesurés. Pas de diagnostic ou mesure médicale.
- Vision MediaPipe sur l'appareil, modèles tiers téléchargés au premier usage. Rendu Canvas et WebGL2 avec repli ; export GLB animé procédural et rig directionnel expérimental, pas de reconstruction photoréaliste garantie. Aucun nouveau modèle IA propriétaire.
- Export JSON local explicite, option AES-GCM/PBKDF2 par phrase secrète ; export CSV non chiffré avec confirmation. La protection de l'export ne protège pas le JavaScript public contre la copie. Licence et provenance préservées.

## Preuves comparatives (signaux synthétiques distincts)
| Version / banc | Résultat |
|---|---|
| V6.2, 16 conditions positives | MAE 0,3390 → 0,1109 alternances/min ; couverture 100 %, trois contrôles négatifs sans résultat |
| V6.3, 12 transitions | score pénalisé 22,6758 → 1,1809 ; récupération moyenne 7,56 → 2,29 s |
| V6.4, 18 arrêts/reprises | 280 → 164 sorties périmées ; récupération moyenne 3,33 s inchangée |
| V6.5, 12 conditions avec anomalies injectées | 276/276 anomalies rejetées ; MAE acceptée 0,0752 → 0,0421 ; couverture 100 → 95,62 % ; coût pénalisé 0,0752 → 1,3545 |

Ces chiffres ne sont pas comparables d'un banc à l'autre et ne prouvent pas la précision humaine réelle. Voir [NATIVE-ENGINE.md](NATIVE-ENGINE.md), [TESTS.txt](TESTS.txt), [PROVENANCE.md](PROVENANCE.md).

## Licence et intégrité
[Studio Niko Design Proprietary License 1.0](LICENSE.md) réserve les contributions originales effectivement détenues, sans restreindre les droits tiers. [Inventaire](RIGHTS.md). Le build génère un manifeste SHA-256 ; `npm run integrity:verify` vérifie les fichiers. Aucun brevet, dépôt INPI ou protection anti-copie revendiqué.

## Vérification et démarrage
Node 22 et Python 3.12 : `npm test && npm run check && python3 scripts/verify.py && npm run build`. Ouvrir `npm start` puis http://localhost:8000, ou héberger le build via HTTPS. Voir [PUBLISH.md](PUBLISH.md). Le forfait gratuit est soumis à quota ; ne pas contourner les limites.

## Historique des versions (informations d'époque)
Les sections suivantes sont conservées pour la traçabilité ; les états de tests et limitations décrivent les anciennes versions, pas le candidat actuel.

# V3.4 — fiabilité et ateliers sans caméra (candidat)

Robot manuel, zoom Holo, pavé synthétiseur tactile et clavier, timbres, caméra virtuelle manuelle enregistrable, export biomécanique CSV, désarmement de l'agent à la sortie du module, remise à zéro du visage après perte de suivi, arrêt audio lorsque l'onglet est masqué, cache versionné. Tests navigateur étendus aux nouveaux contrôles, test de reconstruction sur portrait public MediaPipe (pas de portrait personnel). Le photoréalisme et les appareils physiques ne sont pas validés par ces essais.

## Validation renforcée V3.3

Le workflow ajoute une épreuve WebGL Chromium (SwiftShader) : création d’un singe par prompt, rendu, export PNG/GLB et réimport. Les bibliothèques WebGL sont téléchargées à la demande ; un échec CDN fait échouer le contrôle. Le test ne valide ni une caméra physique ni une reconstruction faciale réelle. Le guide de démarrage couvre les 11 ateliers.

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

## V4 PRO — consolidation
Fusion fonctionnelle de la V3.4 et des moteurs V4 expérimentaux. Les onze modes, l'avatar GLB/VRM et les fonctions manuelles V3.4 sont conservés. Digital Twin propose en plus le rig directionnel et le GLB animé. Voir PRECISION-CORE.md, MEDICAL-QUALITY-SECURITY.md, SPATIAL-ENGINE.md, AVATAR-ENGINE.md et MOTION-STUDIO.md. Aucun usage médical validé. Tests navigateur et CI à confirmer sur cette consolidation; pas de publication automatique depuis la branche.

## V5 Native Engine — candidate
Angle-based gesture engine selected exclusively at runtime; new bilateral knee-phase estimator, non-clinical. Historical MIT engine retained in source and tests, excluded from production build. See NATIVE-ENGINE.md. Notices unchanged.
