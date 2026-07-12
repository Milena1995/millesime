# Millésime — web

App Next.js (PWA) pour cataloguer sa cave à vin : photo face/dos, régénération
d'image par IA, extraction automatique des infos d'étiquette, notation et
suggestions d'accords mets-vins.

## Prérequis

- Node.js 20+
- Un projet Supabase (voir `../supabase/schema.sql`)
- Une clé API Gemini ([Google AI Studio](https://aistudio.google.com/apikey))

## Configuration

1. Copier `.env.example` en `.env.local` et renseigner les 3 variables.
2. Dans Supabase, exécuter `../supabase/schema.sql` dans le SQL Editor.
3. Dans Supabase Auth > Providers > Email, activer "Confirm email" pour
   permettre la connexion par lien magique.
4. Dans Supabase Auth > URL Configuration, ajouter l'URL de callback
   (`http://localhost:3000/auth/confirm` en local, l'équivalent en prod).

## Développement

```bash
npm install
npm run dev
```

L'app est accessible sur `http://localhost:3000`.

## Installation sur iPhone (PWA)

Ouvrir l'URL du site dans Safari, puis Partager > "Sur l'écran d'accueil".
Aucune publication sur l'App Store n'est nécessaire.
