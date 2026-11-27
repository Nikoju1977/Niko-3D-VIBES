# NIKO — exigences de qualité et sécurité / V4

Statut : prototype de recherche et création, non destiné à un usage médical. Pas de diagnostic ni de recommandation thérapeutique. Un seuil de confiance de modèle n'est ni une incertitude métrologique ni une probabilité de précision clinique.

## Contrôle implémenté
- Rejeter points non finis, hors cadre, visibilité absente ou < 0,8, segments < 20 pixels, géométrie invalide. Les seuils sont provisoires et non validés cliniquement. Les angles admissibles sont des projections 2D non calibrées, sensibles à la perspective et au placement de la caméra.
- Cadence masquée jusqu'à 6 secondes de signal bilatéral continu. Rupture > 500 ms, horodatage non monotone ou perte du flux réinitialisent la fenêtre. Un résultat périmé est masqué. Les exports indiquent le statut qualité et l'absence de calibration. Les événements cumulés restent des pics estimés, non des pas confirmés.
- Pas de nouvelle dépendance, transmission de frames, stockage de données médicales ou appel IA distant. Données de session en mémoire et export explicite. Le contrôle qualité ne valide pas les modèles eux-mêmes.

## Critères avant usage clinique (non satisfaits)
- Définir la destination précise, population, conditions et contre-indications avec un clinicien et un métrologue. Établir critères d'acceptation avant essai; ne pas inventer une précision universelle.
- Comparer à un goniomètre calibré ou un système optique de référence synchronisé. Mesurer biais, MAE, RMSE, limites d'accord, répétabilité, taux de rejet et couverture; stratifier par appareil, lumière, morphologie, occultation et mouvement. Utiliser jeux de test indépendants, consentement et protocole éthique adapté.
- Gestion des risques (ISO 14971), cycle logiciel (IEC 62304), système qualité (ISO 13485), ergonomie et cybersécurité (IEC 81001-5-1) à évaluer selon destination. Pas de revendication de conformité ou certification.
- Modèle de menace : données de caméra, scripts tiers et CDN, export local, cache PWA et intégrité des mises à jour. HTTPS et permissions minimales existantes; vérifier dépendances et licences, prévoir hébergement/intégrité des modèles et artefacts, audit indépendant, gestion des vulnérabilités, tests adversariaux. Aucun secret ou donnée réelle dans GitHub. Les exports ne sont pas chiffrés et l'app n'est pas un dossier patient.
- Si destination médicale: analyse réglementaire MDR 2017/745, qualification/classification et évaluation clinique selon MDCG 2020-1; mise en service médicale bloquée tant que preuves et exigences applicables non satisfaites.

Aucune revendication de sécurité absolue ni de précision médicale. Les tests de cette branche sont synthétiques et UI, sans patients ni système de référence.

## Complément Precision Core 1.0
Export chiffré optionnel de la session biomécanique, JSON ordinaire et autres exports non chiffrés. Banc de référence local avec critères explicites. Voir PRECISION-CORE.md. Aucun patient, audit indépendant ni preuve clinique.

Extension 1.1: budget d'incertitude conditionnel aux hypothèses fournies et étalonnage expérimental hors production clinique. Empreinte de rapport non signée. Aucun instrument réel validé.
