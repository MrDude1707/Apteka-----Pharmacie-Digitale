# Pharmasyst Tana — Backend (API)

API REST Express + Prisma, complètement indépendante du frontend.

## Installation

```bash
npm install
```
(le `postinstall` lance automatiquement `prisma generate`)

## Configuration

Le `.env` est déjà rempli avec tes identifiants Supabase. Vérifie/complète surtout :
- `JWT_SECRET` (change la valeur par défaut avant toute vraie mise en production)
- `APP_URL` (origine du frontend déployé — sert à restreindre le CORS quand `NODE_ENV=production`)

## Base de données (si pas encore fait)

Attention : le seed peut réinitialiser les données en mode CLEAN. Ce n’est pas un outil de migration ; ne pas l’utiliser pour mettre à jour une base de production.

```bash
npm run prisma:migrate   # crée les tables (1re fois)
npm run prisma:seed      # remplit avec les données de test + référentiel pharmacies/médicaments
```

## Lancer le serveur

```bash
npm run dev     # avec rechargement automatique (node --watch)
# ou
npm start       # sans rechargement automatique
```

API disponible sur `http://localhost:3001` (port configurable via `.env` / `PORT`).
Vérifie que ça tourne : `http://localhost:3001/api/health`

## Déploiement

- Build command : `npm install`
- Start command : `npm start`
- Variables d'environnement à définir sur l'hébergeur : les mêmes que le `.env`, avec `NODE_ENV=production` et `APP_URL` pointant vers le vrai domaine du frontend déployé.
- Après sauvegarde et validation sur une base de test, appliquer `npm run prisma:migrate:deploy` **avant de démarrer la nouvelle version** (pas `prisma:migrate`, qui est interactif).
- Pour les nouveaux rôles, renouvellements et commandes liés aux ordonnances : suivre [la procédure de validation et migration](../PRIORITES_METIER_VALIDATION.md). Le catalogue existant doit être classé à partir de références validées avant commande.
