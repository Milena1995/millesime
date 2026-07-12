# EPIC — Millésime : catalogue personnel de vins

## Résumé

En tant qu'amatrice de vin, je veux photographier chaque bouteille (face + dos) et obtenir automatiquement une fiche propre — visuel régénéré par IA dans un style commercial cohérent, informations du vin extraites de l'étiquette, prix payé et note personnelle — accessible depuis mon iPhone et le web, synchronisée entre mes appareils.

## Contexte / besoin métier

- Usage strictement personnel (1 seule utilisatrice, mais consultable depuis plusieurs appareils : iPhone + web).
- Les photos originales ne sont **pas conservées** : seule l'image régénérée par IA est stockée.
- Toutes les bouteilles doivent avoir un rendu visuel **cohérent entre elles** (même cadrage/fond/lumière), pour une galerie homogène et élégante.
- Connexion réseau toujours disponible (pas de besoin de mode hors-ligne).
- Pas de publication App Store / Play Store — installation simple via navigateur (PWA).

## Personas

- **Marie-Miléna** — unique utilisatrice, connaissances techniques, veut un outil simple, propre, esthétique.

## Périmètre (in scope)

1. Authentification simple (multi-appareils, même compte partout).
2. Ajout d'une bouteille : prise de photo face + dos via l'appareil photo du navigateur.
3. Traitement IA :
   - Extraction automatique des informations de l'étiquette (OCR + compréhension) → pré-remplissage du formulaire.
   - Régénération de l'image de la bouteille dans un style commercial cohérent et réaliste (même mise en scène pour toutes les bouteilles), à partir des photos face/dos.
   - Les photos originales sont supprimées après traitement ; seule l'image générée est conservée.
4. Fiche vin éditable avec les champs :
   - Nom / domaine
   - Type de vin (rouge, blanc, rosé, mousseux/champagne, autre)
   - Appellation / région
   - Millésime
   - Cépage
   - Prix payé
   - Note (1 à 5 étoiles)
   - Notes personnelles (texte libre)
5. Galerie / bibliothèque de bouteilles (grille responsive), triable et consultable.
6. Filtres sur la galerie : par millésime (année), par note (étoiles), par type de vin.
7. Suggestions d'accords mets-vins générées automatiquement par IA à partir du type/cépage/région (affichées sur la fiche détaillée, pas de saisie manuelle).
8. Modification et suppression d'une fiche.
9. Responsive : ergonomie mobile (iPhone) et confortable en grand écran (web desktop).

## Hors périmètre (out of scope, pour l'instant)

- Multi-utilisateurs / partage social.
- Mode hors-ligne.
- Publication sur l'App Store / Play Store.
- Recommandations d'achat de vin, scan de carte de restaurant.
- Export/impression de la cave.

## User stories

### MILL-1 — Connexion multi-appareils
**En tant qu'** utilisatrice, **je veux** me connecter avec le même compte sur iPhone et sur le web, **afin de** retrouver ma cave partout.
- Critères d'acceptation :
  - Connexion par lien magique (email) ou équivalent sans mot de passe à retenir.
  - Session persistante sur chaque appareil.

### MILL-2 — Ajouter une bouteille (photos)
**En tant qu'** utilisatrice, **je veux** prendre en photo le devant et le dos d'une bouteille, **afin de** créer une nouvelle fiche.
- Critères d'acceptation :
  - Capture via l'appareil photo du navigateur (mobile et desktop avec webcam).
  - Possibilité de reprendre la photo avant validation.
  - Les 2 photos sont envoyées pour traitement IA puis supprimées du stockage définitif.

### MILL-3 — Génération de l'image commerciale
**En tant qu'** utilisatrice, **je veux** que l'IA régénère une image propre et réaliste de ma bouteille, **afin d'**avoir une galerie visuellement homogène.
- Critères d'acceptation :
  - Rendu photoréaliste (pas d'illustration stylisée), fidèle à la bouteille réelle (étiquette, couleur, forme).
  - Cadrage, fond et lumière identiques (ou très proches) d'une bouteille à l'autre, cohérents avec la charte visuelle "chic / bohème / neutre / old money".
  - Temps de traitement raisonnable avec état de chargement visible côté utilisatrice.
  - En cas d'échec de génération, message clair + possibilité de réessayer.

### MILL-4 — Extraction automatique des infos
**En tant qu'** utilisatrice, **je veux** que les champs du formulaire soient pré-remplis à partir des photos, **afin de** gagner du temps de saisie.
- Critères d'acceptation :
  - Nom/domaine, type de vin, appellation/région, millésime, cépage détectés si lisibles sur l'étiquette.
  - Tous les champs restent éditables manuellement avant sauvegarde.
  - Si un champ n'est pas détecté, il reste vide (pas de valeur inventée).

### MILL-5 — Compléter la fiche
**En tant qu'** utilisatrice, **je veux** ajouter le prix payé, une note en étoiles et des notes libres, **afin de** garder une trace complète de mon expérience.
- Critères d'acceptation :
  - Sélecteur d'étoiles (1 à 5, incréments entiers).
  - Champ prix numérique en euros (€).
  - Champ texte libre multi-lignes.

### MILL-6 — Consulter ma cave
**En tant qu'** utilisatrice, **je veux** voir toutes mes bouteilles dans une galerie, **afin de** parcourir ma collection facilement.
- Critères d'acceptation :
  - Grille responsive (1-2 colonnes mobile, plus en desktop).
  - Chaque carte affiche : image générée, nom, millésime, note en étoiles.
  - Clic sur une carte → fiche détaillée.

### MILL-7 — Modifier / supprimer une bouteille
**En tant qu'** utilisatrice, **je veux** corriger ou supprimer une fiche, **afin de** garder ma cave à jour.
- Critères d'acceptation :
  - Tous les champs sont modifiables après création.
  - Suppression avec confirmation (action irréversible).

### MILL-8 — Filtrer ma cave
**En tant qu'** utilisatrice, **je veux** filtrer la galerie par millésime, par note et par type de vin, **afin de** retrouver rapidement une bouteille ou explorer un sous-ensemble de ma collection.
- Critères d'acceptation :
  - Filtres combinables (ex. "rouge" + "4 étoiles et plus").
  - Les filtres se réinitialisent facilement (bouton "effacer").
  - La liste des millésimes/types disponibles dans les filtres se construit dynamiquement à partir des bouteilles existantes.

### MILL-9 — Suggestions d'accords mets-vins
**En tant qu'** utilisatrice, **je veux** voir des suggestions d'accords mets-vins sur la fiche d'une bouteille, **afin de** savoir avec quel plat la servir sans avoir à chercher ailleurs.
- Critères d'acceptation :
  - Suggestions générées automatiquement par IA (texte), à partir du type de vin + cépage + région déjà connus — aucune saisie manuelle requise.
  - Génération déclenchée une fois à la création de la fiche et **mise en cache** (stockée avec la bouteille), pas régénérée à chaque consultation.
  - Format court et lisible (ex. 3 suggestions de plats/familles de plats), cohérent avec le ton élégant de l'app.
  - Si la génération échoue, la fiche reste utilisable sans bloquer (section simplement vide avec option "générer").

## Métriques de succès

- Ajout d'une bouteille en moins de 2 minutes de bout en bout (photo → fiche sauvegardée).
- Rendu visuel jugé cohérent sur au moins 90 % des bouteilles ajoutées.
- Zéro photo originale conservée après traitement.

## Risques / points d'attention

- Qualité de reconnaissance OCR sur étiquettes manuscrites ou très stylisées → prévoir correction manuelle facile.
- Cohérence visuelle du rendu IA d'une bouteille à l'autre → nécessite un prompt/template très strict et des tests sur plusieurs types de bouteilles (rouge, blanc, mousseux, formats différents).
- Coût IA à surveiller si usage intensif (voir tech-stack.md).
- Les accords mets-vins générés par IA restent des suggestions générales (pas une recommandation d'expert sommelier) — à formuler avec cette nuance dans l'UI si besoin.
