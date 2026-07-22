# Contexte complet du projet "Apteke" — à lire avant de commencer

Tu reprends un projet déjà bien avancé. Ce document résume **tout ce qui a déjà été fait**, la méthode de travail à respecter, et **les tâches à réaliser maintenant**. Lis-le en entier avant de toucher au code.

---

## 1. Présentation du projet

**Apteka** (« pharmacie » en russe, anciennement nommé "Pharmasyst Tana") est une plateforme de pharmacie numérique pour Antananarivo, Madagascar — projet de mémoire de fin d'études (L2 Informatique). Elle connecte patients, médecins agréés et pharmacies officielles.

### Stack technique
- **Backend** : Node.js + Express + Prisma ORM + PostgreSQL (hébergé sur Supabase, avec pooler transaction-mode + direct URL pour les migrations)
- **Frontend** : React 19 + Vite + Tailwind CSS v4 + `motion` (framer-motion)
- **Deux projets séparés** (pas un monorepo) : `pharmasyst-backend` (API pure, port 3001) et `pharmasyst-frontend` (port 3000), communiquant en REST avec CORS configuré (ouvert en dev, restreint à `APP_URL` en prod)
- **4 rôles RBAC** : `PATIENT`, `MEDECIN`, `PHARMACIEN`, `ADMINISTRATEUR`
- **Auth** : JWT (`jsonwebtoken`), mots de passe hashés (`bcryptjs`), emails via `nodemailer` + Mailtrap (sandbox, ne délivre pas de vrais emails — normal en dev)

### Comptes de test (créés par `prisma/seed.js`, mot de passe `password123` pour tous)
- `admin@pharma.mg` — Administrateur
- `dr.razafy@pharma.mg` — Médecin (zone Analakely) — **lié** à la fiche vitrine "Dr. Jean Razafy"
- `pharmacien.analakely@pharma.mg` — Pharmacien, rattaché à la pharmacie id `4` ("Pharmacie de Tana")
- `patient@example.com` — Patient

La base contient aussi 114 pharmacies et 21 médicaments (import JSON), avec un stock généré aléatoirement pour chaque couple pharmacie/médicament (~2400 lignes).

---

## 2. Structure des dossiers

```
pharmasyst-backend/
├── server.js                     # Point d'entrée Express, CORS, routes publiques
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── data/ (pharmacies.json, medicaments.json)
├── src/
│   ├── prisma.js                 # client Prisma (avec fallback mémoire si DATABASE_URL absente/placeholder)
│   ├── middlewares/auth.js       # protect, isAdmin, isMedecin, isPharmacien
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── medecinController.js
│   │   ├── pharmacienController.js
│   │   └── patientController.js
│   └── routes/ (authRoutes.js, medecinRoutes.js, pharmacienRoutes.js, patientRoutes.js)
└── .env

pharmasyst-frontend/
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx                   # routing par activeTab (pas de react-router), état global
│   ├── config.ts                 # export API_URL (VITE_API_URL)
│   ├── index.css                 # thème Tailwind v4 (@theme), couleurs apple-* (voir plus bas)
│   └── components/
│       ├── Logo.jsx              # composant logo partagé (voir section branding)
│       ├── LandingPage.jsx       # page d'accueil publique (vidéo bg fixe, scroll horizontal médecins)
│       ├── PatientAuth.jsx       # login / register / OTP / mot de passe oublié
│       ├── Navbar.jsx            # navbar des dashboards connectés
│       ├── MapRoute.jsx          # carte Leaflet + itinéraire OSRM (À REMPLACER, voir tâche 7)
│       ├── DoctorDashboard.jsx
│       └── PharmacistDashboard.jsx
└── .env (VITE_API_URL=http://localhost:3001)
```

---

## 3. Ce qui est déjà fonctionnel (ne pas refaire)

### Backend — modèles Prisma existants
`User`, `Profile` (role, status, zone, pharmacieId, wantsMedecin, medecinChoisiId), `MedecinDisponible` (médecins "vitrine" affichés à l'inscription), `Pharmacie`, `Medicament`, `Stock`, `Ordonnance` (code, medecinId, patientId, status, medicaments en `Json`, dateEmission, dateDelivrance, pharmacieId), `OtpCode` (avec champ `type`: `REGISTER` ou `PASSWORD_RESET`). Enums : `Role`, `AccountStatus` (PENDING/ACTIVE/BLOCKED/REJECTED), `OrdonnanceStatus` (PENDING/DELIVREE).

### Backend — fonctionnalités livrées
- **Auth** : inscription (patient → OTP email, pro → attente validation admin), vérification OTP, connexion, `GET/PUT /me`, changement de mot de passe, mot de passe oublié (code par email), renvoi d'OTP
- **Admin** : liste des comptes pros en attente, approuver (+ email de notif), **refuser**, lister tous les comptes, **bloquer/débloquer un compte**, statistiques réelles de supervision (nb pharmacies, pros actifs, stock total, ordonnances délivrées, dernières ordonnances)
- **Médecin** : recherche patient par email, pharmacies de sa zone, stock d'un médicament dans tout le réseau, **création d'ordonnance simple** (juste un code `ORD-XXXX` + tableau JSON de médicaments — PAS de vraie signature électronique, voir tâche 2), historique de ses prescriptions, **"mes patients assignés"** (patients ayant choisi ce médecin à l'inscription, via `MedecinDisponible.userId`)
- **Pharmacien** : délivrance d'ordonnance par code (vérifie le stock de SA pharmacie uniquement, déduit le stock), consultation/gestion manuelle de son stock
- **Patient** : recherche de médicament (renvoie les pharmacies en stock), historique de ses ordonnances

### Frontend — fonctionnalités livrées
- **LandingPage** : vidéo de fond fixe en boucle infinie (le contenu scrolle par-dessus), section scroll horizontal forcé présentant les 5 médecins vitrine (clic = présélection à l'inscription), stats, démo 1-clic par rôle
- **PatientAuth** : les 5 écrans (login / register / OTP / mot de passe oublié / réinitialisation), sélecteur de rôle à l'inscription, étape "voulez-vous être suivi par un médecin ?" avec choix parmi les 5 vitrine
- **MapRoute** : géolocalisation réelle du navigateur, calcul de la pharmacie la plus proche (Haversine) + itinéraire réel via **OSRM** (API publique) affiché sur une carte **Leaflet** — À REMPLACER (tâche 7)
- **DoctorDashboard** : zone/stocks, rédaction d'ordonnance, historique, onglet "Mes Patients"
- **PharmacistDashboard** : délivrance, gestion de stock
- **App.tsx (Admin)** : validation pros (approuver/refuser), tous les comptes (bloquer/débloquer), supervision (vraies stats)

### Branding déjà en place
- Nom du site : **`Apteke`**, centralisé dans `SITE_NAME` (fichier `src/components/Logo.jsx`)
- Composant `<Logo variant="light|dark" size="sm|md|lg" />` réutilisé partout (Navbar, LandingPage)
- 3 emplacements prévus pour les images du client (déjà référencés dans le code, gèrent l'absence de fichier avec un fallback propre — voir méthode section 4) :
  - `public/branding/logo.png` (logo sur fond clair)
  - `public/branding/logo-dark.png` (logo sur fond sombre, menu de la landing)
  - `public/branding/favicon.png` (favicon, référencé dans `index.html`)
- Thème couleur : `--color-apple-blue` dans `index.css` a été changé de bleu vers **émeraude** (`#10b981`) — donc toutes les classes `bg-apple-blue`, `text-apple-blue` etc. dans TOUT le code affichent déjà de l'émeraude. Ne pas recréer un nouveau système de couleur, réutiliser ces tokens existants.
- Cartes : `rounded-3xl`, `shadow-xl shadow-gray-200/40`, titres en `font-extrabold tracking-tight`, boutons CTA avec `shadow-lg shadow-emerald-500/30` et `hover:-translate-y-0.5` — ce langage visuel est appliqué sur TOUS les dashboards actuels, à réutiliser pour toute nouvelle interface.

---

## 4. Méthode de travail à respecter impérativement

1. **Toujours commencer par le Backend, le Frontend vient après** (c'est la préférence explicite du porteur du projet).
2. Si une nouvelle fonctionnalité nécessite un changement de `schema.prisma` : le dire clairement, et rappeler qu'il faudra lancer `npm run prisma:migrate` puis potentiellement `npm run prisma:seed`.
3. **Donner le code complet, fichier par fichier**, prêt à copier-coller (pas des diffs ambigus sauf si le fichier est énorme et déjà connu du porteur du projet).
4. **Toujours vérifier la syntaxe avant de livrer** : `node --check fichier.js` pour le backend, `npm run build` + `npm run lint` (= `tsc --noEmit`) pour le frontend.
5. Donner un **récapitulatif clair des fichiers modifiés/créés** en fin de réponse (tableau ou liste).
6. Pour toute image/photo dont le porteur de projet n'a pas encore le fichier : utiliser la méthode déjà en place (composant avec état `imgError`, fallback visuel propre, chemin exact du fichier attendu clairement indiqué) — ne jamais bloquer le développement en attendant un asset.
7. Rester cohérent avec le design émeraude déjà en place (voir section 3) plutôt que de repartir de zéro.
8. Ne pas faire de tests automatisés (explicitement pas demandé).
9. Ne pas s'occuper du déploiement — le porteur de projet le demandera lui-même séparément le moment venu.

---

## 5. Tâches à réaliser maintenant, dans cet ordre

### 1. Finir de lier les médecins vitrine à de vrais comptes
Seul "Dr. Jean Razafy" (`MedecinDisponible.userId`) est relié à un vrai compte (`dr.razafy@pharma.mg`). Les 4 autres fiches vitrine n'ont aucun compte réel derrière. Il faut un vrai mécanisme (probablement côté Admin) pour lier un compte `MEDECIN` existant à une fiche `MedecinDisponible`, afin que "Mes patients assignés" fonctionne pour tous les médecins, pas juste un.

### 2. Vraie prescription électronique (fonctionnalité PRINCIPALE du mémoire)
Actuellement une `Ordonnance` n'est qu'un code `ORD-XXXX` + un tableau JSON brut. Il faut en faire une vraie prescription électronique crédible : structure de données propre (médicament, dosage, posologie, durée du traitement), et une représentation "officielle" consultable/imprimable (a minima un rendu HTML/PDF soigné avec en-tête médecin, infos patient, cachet numérique/QR code de vérification). C'est LE cœur fonctionnel du mémoire, à soigner particulièrement.

### 3. Messagerie Médecin ↔ Patient
Nouveau modèle de données (ex: `Message`), échange uniquement entre un patient et le médecin qu'il a choisi (`Profile.medecinChoisiId`). Pas besoin de temps réel sophistiqué (WebSocket) si trop complexe — un système avec rafraîchissement simple suffit.

### 4. Renouvellement d'ordonnance
Le patient doit pouvoir demander le renouvellement d'une ordonnance déjà délivrée/ancienne ; le médecin voit la demande et peut la valider (ce qui crée une nouvelle ordonnance liée à l'ancienne).

### 5. Système de "vente" simulé — PAS de vrai Stripe
Le porteur de projet n'est pas encore au niveau pour un vrai module de paiement, mais veut quand même un parcours d'achat complet à l'écran : panier, récapitulatif, un faux formulaire de paiement qui valide juste le format des champs, et une confirmation de commande simulée. Aucune vraie intégration de paiement (Stripe ou autre) — tout reste factice/local.

### 6. Parcourir toutes les pharmacies sans recherche préalable
Actuellement le patient ne voit des pharmacies qu'après avoir cherché un médicament. Ajouter un écran/onglet pour explorer librement les 114 pharmacies sur la carte (avec filtre par zone), sans recherche de médicament au préalable.

### 7. Remplacer OSRM + Leaflet par Google Maps
Le porteur de projet a maintenant une clé API Google Maps. Remplacer complètement `MapRoute.jsx` : carte Google Maps (JavaScript API) + Google Directions Service pour le calcul d'itinéraire réel, à la place de Leaflet + l'API publique OSRM. Prévoir la variable d'env `VITE_GOOGLE_MAPS_API_KEY` côté frontend.

### 8. Nettoyer et enrichir les données médicaments
Le fichier `medicaments.json` actuel est jugé "en désordre". Créer une nouvelle structure de données plus propre et enrichie : catégories, tags, et notamment une liste (ou plusieurs) de "médicaments les plus recherchés" mise en avant. Objectif : des données plus exploitables pour l'UI (mise en avant, filtres, recommandations).

### 9. Aperçu/autocomplétion dans la recherche de médicament
Quand le patient tape dans la barre de recherche (ex: "Pommade"), afficher une **prévisualisation déroulante sous la barre** avec les médicaments correspondants disponibles en stock, cliquable directement — pour éviter d'avoir à taper le nom complet.

### 10. Enrichir le contenu de la LandingPage + animations fluides
Ajouter davantage de contenu à la landing page (sections supplémentaires, storytelling du projet, etc.), avec des animations fluides (la lib `motion` est déjà installée et utilisée). Pour toute nouvelle photo nécessaire : utiliser la même méthode que pour le logo (placeholder propre + chemin exact à fournir, renommage simple si besoin).

### 11. Interface moderne partout, avec un accent particulier sur la LandingPage
Continuer à pousser la qualité visuelle (animations, transitions, micro-interactions) sur la LandingPage en priorité, et sur les dashboards en général.

---

### Le nom du site est "Apteka" pas Apteke faut de frappe.
