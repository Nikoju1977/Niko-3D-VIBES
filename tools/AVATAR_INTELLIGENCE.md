# Avatar Intelligence — moteurs IA locaux (V8.1 candidate)

Génération effective par des modèles tiers installés sur un ordinateur, sans serveur Studio Niko, sans API payante. Les fichiers restent sur cet ordinateur, sauf transfert volontaire. Le téléchargement initial des modèles et dépendances nécessite Internet. Un GPU compatible est vivement recommandé ; le CPU peut être très lent et une machine avec 4 Go de RAM risque de manquer de mémoire.

## 1. Photo → GLB (TripoSR)
Installer TripoSR selon https://github.com/VAST-AI-Research/TripoSR (code et poids MIT). Utiliser son environnement Python activé et installer trimesh si nécessaire.

    python tools/generate_3d.py image --triposr /chemin/TripoSR --image portrait.png --output personnage.glb

Option --texture : atlas de couleurs 1024 px, reconstruction via OBJ et UV puis intégration dans GLB. Ce n'est pas une création de cartes PBR complètes. En cas d'échec de l'atlas, relancer sans cette option pour obtenir les couleurs aux sommets.
Options --device cpu ou cuda:0, --resolution 128/192/256, --chunk 1024/2048/4096/8192, --timeout 600/1800/3600. Les paramètres modestes par défaut réduisent le coût mais aussi le détail. TripoSR peut basculer sur CPU en l'absence de CUDA.

## 2. Texte → GLB (Shap-E)
Dans un environnement Python séparé compatible avec PyTorch, suivre https://github.com/openai/shap-e ; installer Shap-E et trimesh, par exemple depuis le dépôt Shap-E cloné : pip install -e . puis pip install trimesh.
Depuis le dépôt Niko, avec cet environnement actif :

    python tools/generate_3d.py text --prompt "a full body cyberpunk robot, neutral pose" --output robot.glb

Options --seed 42, --steps 32/48/64, --device auto/cpu/cuda:0. Le prompt est transmis au modèle local, de préférence en anglais. Le générateur produit un maillage approximatif et coloré, sans rig automatique. Le résultat ne préserve pas nécessairement l'identité d'une personne.

## 3. Import et animation
Dans Avatar Motion de Niko 3D Vibes, choisir Modèle 3D local et importer le GLB généré (100 Mio maximum). Ajuster éclairage, caméra, exposition et exporter une image ou vidéo. Pour le suivi corporel ou facial, il faut un rig VRM ou des morph targets compatibles préparés séparément dans Blender. Aucun rig ou expression inventé par le bridge.

## 4. Validation
Depuis le dépôt Niko : python -m unittest discover -s tools -p test_generate_3d.py
Les tests utilisent des fixtures synthétiques et un adaptateur simulé pour contrôler les paramètres, le refus d'écrasement et la validation structurelle de base. Ils ne constituent pas une génération réelle, ni une validation glTF exhaustive. Aucun test GPU, photoréalisme ou installation des dépendances n'est revendiqué à ce stade. Le bridge n'envoie pas de requêtes à un serveur de génération ; les bibliothèques externes téléchargent leurs propres poids.
