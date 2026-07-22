# Pharmasyst Tana — Frontend

Application React (Vite) qui consomme l'API backend via HTTP. Complètement indépendante du backend — peut être déployée séparément.

## Installation

```bash
npm install
```

## Configuration

Le `.env` pointe par défaut vers `http://localhost:3001` (le backend en local) :
```
VITE_API_URL="http://localhost:3001"
```
En production, mets l'URL réelle de ton API backend déployée (ex : `https://api.pharmasyst-tana.mg`).

## Lancer en développement

⚠️ Assure-toi que le backend tourne déjà (voir son propre README) avant de lancer le frontend.

```bash
npm run dev
```

Disponible sur `http://localhost:3000`.

## Build de production

```bash
npm run build
```
Génère le dossier `dist/` — à déployer sur n'importe quel hébergeur de fichiers statiques (Vercel, Netlify, Render Static Site, etc.).

## Déploiement

- Build command : `npm install && npm run build`
- Dossier à publier : `dist`
- Variable d'environnement à définir sur l'hébergeur : `VITE_API_URL` = URL publique de ton backend déployé (⚠️ elle est injectée **au moment du build**, donc si tu la changes, il faut rebuilder).
