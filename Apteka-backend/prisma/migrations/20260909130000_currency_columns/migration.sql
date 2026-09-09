-- Étape compatible avec l'ancienne version : les données restent encore en EUR.
ALTER TABLE "Medicament" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
ALTER TABLE "Commande" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'EUR';
