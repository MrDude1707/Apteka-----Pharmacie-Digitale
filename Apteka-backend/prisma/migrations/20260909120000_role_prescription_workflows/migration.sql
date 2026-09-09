ALTER TYPE "OrdonnanceStatus" ADD VALUE 'EXPIREE';
ALTER TYPE "OrdonnanceStatus" ADD VALUE 'ANNULEE';
CREATE TYPE "RenewalStatus" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

ALTER TABLE "Medicament"
  ADD COLUMN "requiresPrescription" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "classificationReviewed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "classificationSource" TEXT,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Ordonnance"
  ADD COLUMN "renewable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dateExpiration" TIMESTAMP(3);
ALTER TABLE "Commande"
  ADD COLUMN "ordonnanceId" TEXT,
  ADD COLUMN "stripeSessionId" TEXT,
  ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Commande" ALTER COLUMN "status" SET DEFAULT 'RESERVEE';
CREATE UNIQUE INDEX "Commande_ordonnanceId_key" ON "Commande"("ordonnanceId");
CREATE UNIQUE INDEX "Commande_stripeSessionId_key" ON "Commande"("stripeSessionId");
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_ordonnanceId_fkey"
  FOREIGN KEY ("ordonnanceId") REFERENCES "Ordonnance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "RenewalRequest" (
  "id" TEXT NOT NULL,
  "ordonnanceId" TEXT NOT NULL,
  "status" "RenewalStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  "decidedBy" TEXT,
  "reason" TEXT,
  "newOrdonnanceId" TEXT,
  CONSTRAINT "RenewalRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RenewalRequest_ordonnanceId_key" ON "RenewalRequest"("ordonnanceId");
CREATE UNIQUE INDEX "RenewalRequest_newOrdonnanceId_key" ON "RenewalRequest"("newOrdonnanceId");
ALTER TABLE "RenewalRequest" ADD CONSTRAINT "RenewalRequest_ordonnanceId_fkey"
  FOREIGN KEY ("ordonnanceId") REFERENCES "Ordonnance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve previous requests and decisions without manufacturing a delivery date.
INSERT INTO "RenewalRequest" ("id", "ordonnanceId", "status", "requestedAt", "reason", "newOrdonnanceId")
SELECT 'legacy-' || o."id", o."id",
  CASE WHEN child."id" IS NOT NULL THEN 'ACCEPTEE'::"RenewalStatus"
       WHEN o."dateDelivrance" IS NOT NULL THEN 'EN_ATTENTE'::"RenewalStatus"
       ELSE 'REFUSEE'::"RenewalStatus" END,
  o."dateEmission",
  'Import historique : date exacte de demande et décision non enregistrée.' ||
    CASE WHEN child."id" IS NULL AND o."dateDelivrance" IS NULL
      THEN ' Aucune délivrance attestée : nouvelle consultation nécessaire.' ELSE '' END,
  child."id"
FROM "Ordonnance" o
LEFT JOIN LATERAL (
  SELECT c."id" FROM "Ordonnance" c WHERE c."parentOrdonnanceId" = o."id"
  ORDER BY c."dateEmission", c."id" LIMIT 1
) child ON true
WHERE o."renouvellementDemande" OR o."status" = 'RENEWAL_REQUESTED' OR child."id" IS NOT NULL;

UPDATE "Ordonnance" SET "status" = CASE WHEN "dateDelivrance" IS NOT NULL
  THEN 'DELIVREE'::"OrdonnanceStatus" ELSE 'PENDING'::"OrdonnanceStatus" END
WHERE "status" = 'RENEWAL_REQUESTED';
-- Legacy delivered labels without a recorded dispensing remain blocked (DELIVREE).
-- They are listed by the deployment guide for manual reconciliation, never re-opened.
UPDATE "Ordonnance" SET "renouvellementDemande" = false;
