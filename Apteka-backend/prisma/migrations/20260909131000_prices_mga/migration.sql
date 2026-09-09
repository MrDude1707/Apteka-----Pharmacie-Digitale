-- Conversion de référence : 1 EUR = 4 951,08 MGA, cours moyen applicable
-- à partir du 07/09/2026 publié par la Direction générale des douanes Malagasy.
-- Les prix du catalogue sont arrondis au multiple de 100 MGA le plus proche.
UPDATE "Medicament"
SET "prix" = ROUND(("prix" * 4951.08) / 100.0) * 100,
    "currency" = 'MGA'
WHERE "prix" IS NOT NULL AND "currency" = 'EUR';

UPDATE "Medicament" SET "currency" = 'MGA' WHERE "prix" IS NULL;
ALTER TABLE "Medicament" ALTER COLUMN "currency" SET DEFAULT 'MGA';
ALTER TABLE "Commande" ALTER COLUMN "currency" SET DEFAULT 'MGA';

-- Les commandes historiques conservent leur montant et leur devise EUR.
