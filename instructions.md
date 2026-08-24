# Instructions du Projet Apteka (Pharmacie Digitale)

Ce document résume l'architecture, les configurations clés et les optimisations déjà réalisées sur le projet. Il sert de mémoire permanente pour tout agent d'IA qui intervient sur ce projet afin d'éviter les explications répétitives.

---

## 1. Contexte & Architecture du Projet

* **Projet** : Apteka (anciennement Pharmasyst Tana), plateforme numérique pour connecter patients, médecins agréés et pharmacies officielles d'Antananarivo (Madagascar).
* **Hébergement Frontend** : Vercel (Domaine personnalisé : `https://apteka-digitale.site` & `https://www.apteka-digitale.site`).
* **Hébergement Backend** : Render (URL : `https://apteka-pharmacie-digitale.onrender.com`).
* **Base de données** : PostgreSQL hébergée sur Supabase (Prisma ORM).

---

## 2. Configuration d'envoi d'e-mails (Resend HTTP API vs Mailtrap)

⚠️ **Attention** : L'hébergeur Render bloque tous les ports SMTP sortants standard (25, 465, 587) sur son offre gratuite. Pour contourner ce blocage, le projet a été migré avec succès de SMTP vers l'**API REST HTTP** de Resend.

### Système d'envoi hybride intelligent (`authController.js`) :
* **En Local (Développement)** : Si le fichier local `.env` a `SMTP_HOST` pointant vers Mailtrap, le backend utilise automatiquement **Nodemailer** et envoie les e-mails dans le simulateur Mailtrap.
* **En Production (Render)** : Le backend détecte que ce n'est pas Mailtrap et utilise l'**API SDK HTTP de Resend** (via le port standard 443 HTTPS, jamais bloqué by Render).
* **Performance (Asynchrone)** : Toutes les fonctions d'envoi de mail (Validation OTP, Approbation de compte, Mot de passe oublié) sont **non bloquantes**. Elles se lancent en arrière-plan (sans bloquer la réponse HTTP par un `await`), rendant les réponses de l'API instantanées (moins de 100 ms).

---

## 3. Variables d'Environnement Requises

### Sur Render (Backend) :
* `NODE_ENV` : `production`
* `APP_URL` : `https://apteka-digitale.site,https://www.apteka-digitale.site` (gère la sécurité CORS pour autoriser le nouveau domaine).
* `SMTP_PASS` : *Votre Clé API Resend réelle (commençant par `re_...`)*.
* `SMTP_FROM` : `"Apteka" <no-reply@apteka-digitale.site>` *(L'expéditeur doit obligatoirement utiliser votre nom de domaine vérifié dans Resend !)*.

### Sur Vercel (Frontend) :
* `VITE_API_URL` : `https://apteka-pharmacie-digitale.onrender.com` *(l'URL publique réelle de votre API backend)*.
  * *Note : Les variables de Vite sont injectées au moment du build, un **re-deploy** sur Vercel est nécessaire après chaque changement.*

---

## 4. Gestion du Logo et de la Charte Graphique

* **Dossier Source Sacré** : Tous les logos et favicons originaux doivent être placés dans `/Apteka-frontend/public/branding/` et **jamais** directement dans `dist/branding/` (qui est temporaire et écrasé à chaque compilation).
* **Le composant `Logo.jsx`** :
  * Utilise une hauteur adaptative et une largeur **`w-auto`** pour s'adapter parfaitement aux logos carrés, ronds ou rectangulaires sans jamais les déformer.
  * Les tailles d'images configurées sont `sm` (`h-16`), `md` (`h-24`), et `lg` (`h-32`) pour compenser d'éventuelles marges transparentes.
  * Pour garder la barre de navigation (Navbar) fine et élégante, le conteneur du logo est limité en hauteur (`h-10` pour sm et `h-12` pour md). Le logo déborde ainsi subtilement et élégamment vers le bas sans déformer la structure ou les textes du menu.
