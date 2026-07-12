# Stack technique — Millésime

## Vue d'ensemble

Une **web app responsive (PWA)**, un seul code, installable sur iPhone/Android via "Ajouter à l'écran d'accueil" — pas d'app native, pas d'App Store, pas de compte développeur.

```
┌─────────────────────────────┐
│  Next.js (PWA responsive)   │  ← iPhone Safari / Android Chrome / desktop
│  React + TypeScript          │
└──────────────┬───────────────┘
               │ HTTPS
┌──────────────▼───────────────┐
│  API routes Next.js           │  ← orchestration, clés API côté serveur
│  (déployées sur Vercel)       │
└──┬────────────┬───────────────┘
   │            │
   ▼            ▼
┌──────────┐  ┌───────────────────────┐
│ Supabase │  │ Gemini API             │
│ - Auth   │  │ - lecture étiquette    │
│ - DB     │  │ - régénération image   │
│ - Storage│  │ - accords mets-vins    │
└──────────┘  └───────────────────────┘
```

Un seul fournisseur IA (Gemini) pour tout : lecture d'étiquette, régénération d'image et suggestions mets-vins — un seul compte/une seule clé API à gérer.

## Frontend

- **Next.js** (React + TypeScript) — un seul code pour mobile et desktop, responsive via CSS (Flexbox/Grid).
- **PWA** (manifest + service worker minimal) — icône, splash screen, "Ajouter à l'écran d'accueil" sur iOS/Android.
- Capture photo via l'API navigateur (`getUserMedia` ou `<input type="file" capture="environment">`), pas besoin d'app native.
- Déploiement : **Vercel** (gratuit pour ce volume d'usage).

## Backend / données

- **Supabase** :
  - **Auth** : connexion par lien magique (email), session partagée entre iPhone et web.
  - **Postgres** : table `bottles` (nom, type_vin, région, millésime, cépage, prix, note, notes, accords_mets_vins, image_url, created_at, user_id).
  - `type_vin`, millésime et note sont indexés pour permettre les filtres de la galerie (MILL-8) sans latence.
  - **Storage** : stockage de l'image générée uniquement (les photos brutes ne transitent que le temps du traitement, jamais persistées).
- La clé API Gemini reste **côté serveur** (API routes Next.js), jamais exposée au client.
- Important : l'abonnement Claude.ai (chat) n'est **pas** relié à l'API Gemini — il s'agit d'un compte Google AI Studio séparé, facturé à l'usage. On n'utilise plus Claude du tout dans ce projet, donc un seul compte/une seule clé à gérer.

## Intelligence artificielle

Un seul fournisseur, **Gemini**, pour les trois usages (aucune génération/lecture d'image ni de texte ne passe par Claude) :

### 1. Lecture de l'étiquette → extraction structurée
- **Gemini 2.5 Flash** (multimodal, texte+vision) : envoi des 2 photos, prompt structuré demandant un JSON `{nom, type_vin, region, millesime, cepage}`.
- Si un champ n'est pas lisible, il reste `null` → l'utilisatrice complète à la main.

### 2. Régénération de l'image "commerciale"
- **Gemini 2.5 Flash Image** (dit "nano banana") : édite/régénère la photo pour produire un rendu photoréaliste cohérent (même cadrage, même fond neutre, même lumière) sur toutes les bouteilles.
- Coût très faible (~0,02–0,04 € par image), rapide, bonne fidélité à la bouteille réelle.
- Un **prompt template fixe** (même consigne de mise en scène à chaque appel) garantit la cohérence visuelle demandée dans l'epic.
- Alternative si besoin de comparer : `gpt-image-1` (OpenAI, un peu plus cher, très bonne qualité) — nécessiterait un compte séparé, non retenu pour garder un seul fournisseur.

### 3. Suggestions d'accords mets-vins
- **Gemini 2.5 Flash** (texte, même compte/même clé que ci-dessus) : à la création de la fiche, un appel léger avec le type de vin + cépage + région déjà extraits génère 2-3 suggestions d'accords, stockées dans `accords_mets_vins` en base.
- Génération **une seule fois** puis mise en cache — pas de nouvel appel à chaque ouverture de la fiche (coût quasi nul).
- Coût négligeable (appel texte court, quelques centièmes de centime par bouteille).

## Distribution / installation

- **iPhone / Android** : ouvrir l'URL Vercel dans le navigateur → "Ajouter à l'écran d'accueil" → icône native, plein écran, aucune installation de type App Store.
- **Web** : accessible depuis n'importe quel navigateur avec le même compte.

## Estimation de coût mensuel (usage perso, quelques bouteilles/semaine)

| Service | Coût estimé |
|---|---|
| Vercel (hosting) | 0 € (plan gratuit largement suffisant) |
| Supabase (DB + Storage + Auth) | 0 € (plan gratuit largement suffisant) |
| Gemini 2.5 Flash (lecture étiquette + accords mets-vins) | quelques centimes / bouteille |
| Gemini 2.5 Flash Image (régénération image) | quelques centimes / bouteille |
| **Total** | **< 5 €/mois** pour un usage perso régulier |

## Notes d'implémentation

- Pas de mode hors-ligne à prévoir (connexion toujours disponible, confirmé).
- Pas de gestion multi-utilisateurs à prévoir dans le MVP.
- Prévoir un état de chargement clair pendant le traitement IA (peut prendre quelques secondes).
- Prévoir un fallback si la génération IA échoue (réessayer / message d'erreur clair, comme précisé dans l'epic).
