# Publication contrôlée NIKO 3D VIBES

Dépôt : https://github.com/Nikoju1977/Niko-3D-VIBES

Le moteur Code Mode Pro d'AutoCoder est utilisé séparément, sans redistribution, à l'empreinte Git `2ca34b69a196e14881bb1c50847d4764387761a5`. Fournir le fichier `code-mode-x.mjs` exact depuis le dépôt AutoCoder. Installer Git, Node, Python et GitHub CLI, puis authentifier GitHub CLI (`gh auth login`) et Git (`gh auth setup-git`). Ne jamais placer un jeton dans le code. Le dépôt public est explicitement autorisé par le propriétaire. Le mode privé reste la valeur par défaut.

```bash
python3 scripts/private-publish.py /chemin/AutoCoder-Studio-Niko/code-mode-x.mjs --allow-public
# après revue des tests, fournir le SHA complet affiché :
python3 scripts/private-publish.py /chemin/AutoCoder-Studio-Niko/code-mode-x.mjs --allow-public --approve SHA_COMPLET
```

Le script refuse un dépôt public sans le drapeau explicite --allow-public, une réponse API incomplète, une absence de droit push, un arbre modifié, un SHA non approuvé ou un échec des tests. Il n'effectue aucun force push. Vérifier également Actions et les tests physiques avant le déploiement. Ce garde-fou n'empêche pas un push manuel ou une modification ultérieure de visibilité et ne garantit pas la confidentialité du JS servi au navigateur.
