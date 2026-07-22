# Landing Page Brief — Refonte Premium de la Landing Page Apteka

> Version 1.0

## Objectif

Refondre complètement `src/components/LandingPage.jsx` afin d'obtenir une landing page moderne, élégante et très fluide, inspirée des sites Apple.

L'objectif est de donner immédiatement une impression de qualité, de confiance et de professionnalisme, tout en conservant le thème actuel (vert émeraude).

La nouvelle landing page doit être responsive, performante, et mettre davantage en valeur la plateforme.

---

# Technologies

Ne rien changer à la stack existante.

Utiliser uniquement :

- React
- Vite
- Tailwind CSS v4
- Motion (Framer Motion)
- Lucide React

Aucune autre dépendance ne doit être ajoutée sans nécessité.

---

# Direction Artistique

S'inspirer des sites suivants :

- Apple
- Stripe
- Linear
- Arc Browser
- Raycast

Le style recherché :

- énormément d'espace blanc
- typographie large
- animations très fluides
- glassmorphism léger
- coins très arrondis
- ombres douces
- animations discrètes

Éviter :

- effets tape-à-l'œil
- animations exagérées
- couleurs saturées
- surcharge visuelle

---

# Palette

Conserver la palette actuelle.

Couleur principale :

```
#10b981
```

Fond :

```
white
```

Texte :

```
gray-900
```

Texte secondaire :

```
gray-500
```

---

# Animations

Toutes les animations utilisent Motion.

## Reveal

Chaque section apparaît avec :

- opacity
- translateY
- stagger

Utiliser :

```
whileInView
viewport={{ once: true }}
```

---

## Hero

Ajouter :

- légère animation flottante
- parallax sur la vidéo
- apparition progressive du texte
- CTA avec léger scale

---

## Scroll Progress

Ajouter une barre de progression fixe en haut.

Elle suit :

```
scrollYProgress
```

---

## Compteurs

Les statistiques doivent compter progressivement.

Exemple :

```
0 → 114

0 → "Les medicament dans medicament.json

0 → 24

0 → 98%
```

---

## Boutons

Les CTA utilisent un effet magnétique subtil.

Au hover :

- translation légère
- scale 1.03

Jamais d'effet agressif.

---

# Sections

La page doit contenir dans cet ordre :

---

## 1 Hero

Conserver la vidéo.

Ajouter :

- animation
- CTA
- statistiques
- scroll indicator

---

## 2 Comment ça marche

3 cartes :

- Chercher
- Comparer
- Réserver

Animation stagger.

---

## 3 Statistiques

Nouvelle section.

Exemple :

114 Pharmacies

"Les medicaments dans medicament.json" Médicaments

24/7 Disponible

98% Satisfaction

Compteurs animés.

---

## 4 Pourquoi Apteka

4 cartes.

Icônes Lucide.

Exemple :

- Données sécurisées
- Stock temps réel
- Ordonnances certifiées
- Disponible 24/7

---

## 5 Aperçu Produit

Créer une belle présentation.

Utiliser :

- mockup téléphone
- mockup desktop

Si possible afficher une vraie capture de l'application.

Sinon utiliser les composants React dans un cadre stylisé.

---

## 6 Témoignages

Créer 6 faux témoignages.

Ne jamais utiliser de vraies photos.

Utiliser uniquement :

avatars avec initiales

Exemple :

AM

JR

TK

etc.

Chaque carte possède :

★★★★★

nom

profession

avis

---

## 7 Pharmacies partenaires

Créer un bandeau horizontal infini.

Exemple :

Pharmacie Centrale

Pharmacie Analakely

Pharmacie Isoraka

Pharmacie Santé

etc.

Défilement continu.

---

## 8 FAQ

Créer un accordéon.

Questions :

- Comment fonctionne la réservation ?
- Mes données sont-elles protégées ?
- Puis-je renouveler une ordonnance ?
- Puis-je changer de pharmacie ?
- Comment contacter un médecin ?
- L'application est-elle gratuite ?

---

## 9 Connexion

Conserver :

PatientAuth

Uniquement améliorer l'habillage.

---

## 10 Footer

Créer un vrai footer.

Contenu :

- À propos
- Mentions légales
- Politique de confidentialité
- Contact
- FAQ

Icônes :

Facebook

LinkedIn

Instagram

GitHub

Copyright

---

# Responsive

Le site doit être parfait sur :

Desktop

Laptop

Tablette

Mobile

Les animations lourdes doivent être réduites sur mobile.

---

# Performance

Respecter les bonnes pratiques :

lazy loading

animations GPU

éviter les re-render inutiles

optimiser Motion

---

# Accessibilité

Tous les boutons possèdent :

aria-label

focus visible

contraste suffisant

navigation clavier

---

# Images

Les images peuvent provenir :

- d'une vraie capture de l'application
- d'illustrations libres
- de photos liées à la pharmacie

Ne jamais utiliser de photos de vraies personnes pour les faux témoignages.

---

# Livrable attendu

La refonte doit donner une impression "premium".

Le visiteur doit avoir l'impression d'utiliser une plateforme moderne comparable aux meilleurs sites SaaS actuels.

Le code doit être :

- propre
- découpé en composants
- réutilisable
- commenté lorsque nécessaire

Aucun warning.

Aucune erreur.

Les commandes suivantes doivent réussir :

```bash
npm run lint

npm run build
```

---

# Résumé attendu

À la fin du développement, fournir un résumé indiquant :

- les sections créées
- les animations ajoutées
- les éventuelles images à fournir
- les composants créés
- les optimisations réalisées
- les fichiers modifiés