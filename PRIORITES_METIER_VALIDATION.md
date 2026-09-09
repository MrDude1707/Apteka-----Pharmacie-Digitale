# Priorités métier : validation et mise en ligne

## Périmètre de cette livraison locale

Les trois priorités sont implémentées dans le backend et les tableaux de bord web. Aucune migration, aucun seed ni déploiement de la base Supabase n’a été exécuté pendant cette intervention. Le mobile et les fichiers de travail préexistants ne sont pas modifiés. La charte graphique générale est conservée.

| Rôle | Actions prévues | Limites contrôlées par l’API |
| --- | --- | --- |
| Patient actif | Consulter ses ordonnances, acheter, réserver, demander un renouvellement, écrire à son médecin | Ses propres ordonnances ; messagerie avec le médecin actif rattaché ; aucun renouvellement automatique |
| Médecin actif | Prescrire à ses patients rattachés, accepter ou refuser leurs demandes, échanger avec eux | Ne délivre pas les médicaments ; n’enregistre pas les paiements ; ne consulte pas les conversations de patients non rattachés |
| Pharmacien actif | Gérer le stock et les commandes de son officine, enregistrer le paiement sur place et la délivrance | Pas de délivrance double ; pas de modification d’une commande d’une autre officine ; pas d’expédition d’une ordonnance non délivrée |
| Administrateur | Approuver les professionnels, gérer les rattachements et enregistrer le régime de délivrance du catalogue | Pas d’auto-inscription administrateur ; le régime doit être renseigné à partir d’une source validée, pas déduit du nom du produit |

L’activation d’un médecin ou pharmacien ne peut plus être obtenue par l’OTP réservé à l’inscription patient. Les comptes non actifs sont refusés, même avec un ancien jeton. Les listes administratives de rattachement ne renvoient plus les empreintes de mots de passe.

## Règles à expliquer pendant la soutenance

- L’ordonnance suit son propre état : émise (`PENDING`), délivrée (`DELIVREE`), expirée ou annulée. La date limite est facultative et fixée par le médecin ; aucune validité réglementaire universelle n’est inventée. Il n’y a pas encore d’écran d’annulation médicale.
- Une demande de renouvellement est distincte : en attente, acceptée ou refusée avec motif. Elle est unique par ordonnance, après une délivrance datée et seulement si le médecin l’a autorisée. L’acceptation crée une **nouvelle ordonnance**. L’ancienne conserve sa délivrance. Un refus nécessite une nouvelle consultation/prescription, pas une succession automatique de demandes.
- Une commande sur ordonnance reprend tous ses médicaments et quantités, dans une seule pharmacie. Pas de délivrance partielle, de substitution ni de mélange avec des articles libres dans ce parcours. Le serveur vérifie propriétaire, validité, unicité, catalogue, prix et stock.
- La réservation bloque les unités disponibles, sans constituer un paiement ni une délivrance. L’annulation impayée les restitue une seule fois. Le pharmacien confirme la délivrance sans second débit des unités déjà réservées.
- Un produit non classé ou retiré ne peut pas être commandé. L’administrateur saisit la classification et sa référence ; le logiciel ne certifie pas lui-même l’exactitude médicale de cette référence.
- Le suivi de livraison reste **une simulation web**, après paiement et, pour une ordonnance, après sa délivrance. Il ne représente ni un GPS réel ni l’affectation réelle d’un livreur.
- La validation de l’ordonnance est un enregistrement depuis un compte médecin. Le QR contient son code, à consulter dans l’espace pharmacien. Ce n’est pas une blockchain, une signature cryptographique certifiée ou un agrément ministériel.

## Migration : avant tout déploiement

1. Sauvegarder la base existante et disposer d’une restauration testée. Utiliser d’abord une copie de test sans données personnelles réelles. Identifier les migrations Prisma déjà appliquées ; ne pas utiliser `db push`, `migrate reset` ou le seed pour contourner une différence de schéma.
2. Sur cette copie, configurer `DATABASE_URL` et `DIRECT_URL` sans les publier. Depuis `Apteka-backend`, exécuter :

   ```powershell
   npm.cmd ci
   npm.cmd test
   npx.cmd prisma validate
   npx.cmd prisma migrate status
   npm.cmd run prisma:migrate:deploy
   npm.cmd run prisma:generate
   ```

3. Examiner la migration `20260909120000_role_prescription_workflows`. Elle ajoute les données de classification, de renouvellement, de rattachement commande/ordonnance, de réservation de stock et de paiement. Elle ne classe pas médicalement le catalogue à votre place. **Tous les produits existants restent à vérifier et ne sont pas commandables tant que cette vérification n’est pas renseignée.** Préparer les produits de démonstration avec un professionnel et leurs références avant la soutenance.
4. Les anciennes demandes de renouvellement sont importées sans inventer de date de délivrance. La date d’émission sert uniquement de repère d’import, identifié dans le motif, pas de preuve de la date réelle de demande. Une demande historique sans délivrance attestée ni ordonnance enfant est clôturée avec un motif explicatif. Un enfant existant est conservé comme renouvellement accepté. Les anciens libellés `DELIVREE` sans date restent bloqués pour vérification humaine.
5. Vérifier notamment, en lecture seule, après migration :

   ```sql
   SELECT id, code, status, "dateDelivrance"
   FROM "Ordonnance"
   WHERE status = 'DELIVREE' AND "dateDelivrance" IS NULL;

   SELECT id, status, "stockReserved", "stripeSessionId"
   FROM "Commande"
   WHERE status IN ('RESERVEE', 'EN_ATTENTE_DE_PAIEMENT')
     AND (NOT "stockReserved" OR "stripeSessionId" IS NULL);

   SELECT count(*) AS produits_a_verifier
   FROM "Medicament" WHERE NOT "classificationReviewed";
   ```

   Les réservations en officine sans session Stripe sont normales. Les anciennes commandes n’ont pas de réservation de stock attestée : ne pas leur attribuer automatiquement une session, une délivrance, un débit de stock ou une date de paiement. Réconcilier avec leurs faits historiques. Ne pas rouvrir une ordonnance délivrée pour faciliter une démonstration.
6. Après recette, coordonner sauvegarde, migration, démarrage du nouveau backend puis déploiement frontend, pendant une fenêtre sans commandes. Ne pas publier le code backend seul sur un serveur dont le schéma est encore ancien. Le rollback applicatif seul n’annule pas la migration ; préparer la restauration coordonnée avant intervention.

## Paiement et configuration

- `NODE_ENV=production` : base et `JWT_SECRET` obligatoires ; aucune simulation de paiement ni repli sur une base mémoire.
- `STRIPE_SECRET_KEY` : nécessaire au paiement en ligne. Sans clé, aucune réservation Stripe n’est créée ; le paiement sur place reste disponible.
- `APP_URL` : origines frontend autorisées, séparées par des virgules. Une redirection vers une origine arbitraire est refusée.
- `DEMO_PAYMENTS=true` : simulation explicitement activée **hors production seulement**, avec une session liée à la commande. Ne pas confondre cette option avec la simulation de livraison web.
- Le serveur contrôle session, patient, commande, montant et devise. Une session ouverte doit être fermée chez Stripe avant de rendre le stock. Voir la [documentation Stripe sur l’expiration des sessions](https://docs.stripe.com/api/checkout/sessions/expire).
- Une erreur certaine avant création du paiement libère la réservation ; une erreur réseau ambiguë conserve le stock et affiche la référence à rapprocher. L’assistance doit alors vérifier le prestataire et la base avant toute intervention.

## Vérifications effectuées et recette restante

Les tests automatisés utilisent des données synthétiques, sans appeler Supabase, Stripe ou la messagerie réels :

- `npm.cmd test` dans le backend : contrôles par rôle via les véritables routes Express, parcours complet entre rôles, décisions de renouvellement, stock, annulation et scénarios de paiement injectés.
- La migration SQL est exécutée sur PostgreSQL embarqué PGlite, avec cas historiques représentatifs.
- Les tests de concurrence métier utilisent l’adaptateur mémoire sérialisé ; ils ne remplacent pas des essais de charge et de transactions simultanées sur PostgreSQL/Supabase réel.
- `npm.cmd run lint` (TypeScript) et `npm.cmd run build` dans le frontend. Cela ne constitue pas une recette visuelle automatisée dans un navigateur.

Recette avant présentation : avec quatre comptes de test, vérifier les refus de rôle, classer deux produits de démonstration, prescrire sans posologie préremplie, réserver une ordonnance, enregistrer le paiement sur place, délivrer, demander puis accepter/refuser un renouvellement. Vérifier l’aperçu après enregistrement, les badges, l’impression, les boutons désactivés, le stock après annulation et les notifications d’échec. Répéter sur petits et grands écrans.

## Hors de ce premier lot

Pas encore de webhook Stripe, d’expiration automatique des réservations abandonnées, de remboursement, de journal d’audit exhaustif, de signature électronique certifiée, de contrôle des interactions médicamenteuses ni de livraison mobile réelle. Une panne entre prestataire et base demande encore un rapprochement manuel. Ces éléments, la recette navigateur et la validation métier par les professionnels restent nécessaires avant de présenter le projet comme un service de santé utilisable en conditions réelles.
