const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');

test('migration preserves legacy dispensing facts and makes unclassified products explicit', async () => {
  const pg = new PGlite();
  try {
    const root = path.join(__dirname, '../prisma/migrations');
    const migrations = fs.readdirSync(root).filter(name => fs.existsSync(path.join(root, name, 'migration.sql'))).sort();
    for (const name of migrations.filter(n => n < '20260909120000')) await pg.exec(fs.readFileSync(path.join(root, name, 'migration.sql'), 'utf8'));
    await pg.exec(`
      INSERT INTO "User" ("id","email","password","updatedAt") VALUES ('p','p@example.test','test',NOW()),('d','d@example.test','test',NOW());
      INSERT INTO "Medicament" ("id","cis","nom","forme","prix") VALUES ('m','1','Produit test','Test',2.00);
      INSERT INTO "Ordonnance" ("id","code","medecinId","patientId","medicaments","status","renouvellementDemande","dateDelivrance") VALUES
        ('dispensed','OLD1','d','p','[]','RENEWAL_REQUESTED',true,'2026-09-01'),
        ('not-dispensed','OLD2','d','p','[]','RENEWAL_REQUESTED',true,NULL),
        ('accepted','OLD3','d','p','[]','DELIVREE',true,NULL);
      INSERT INTO "Ordonnance" ("id","code","medecinId","patientId","medicaments","parentOrdonnanceId") VALUES
        ('child','NEW1','d','p','[]','accepted');
    `);
    for (const name of migrations.filter(n => n >= '20260909120000')) await pg.exec(fs.readFileSync(path.join(root, name, 'migration.sql'), 'utf8'));
    const { rows: meds } = await pg.query('SELECT * FROM "Medicament"');
    assert.equal(meds[0].requiresPrescription, true);
    assert.equal(meds[0].classificationReviewed, false);
    assert.equal(meds[0].isActive, true);
    assert.equal(meds[0].prix, 9900);
    const { rows } = await pg.query('SELECT o."id",o."status" AS prescription,o."dateDelivrance",r."status" AS request,r."newOrdonnanceId" FROM "Ordonnance" o LEFT JOIN "RenewalRequest" r ON r."ordonnanceId"=o."id"');
    assert.equal(rows.find(r => r.id === 'dispensed').prescription, 'DELIVREE');
    assert.equal(rows.find(r => r.id === 'dispensed').request, 'EN_ATTENTE');
    assert.equal(rows.find(r => r.id === 'not-dispensed').prescription, 'PENDING');
    assert.equal(rows.find(r => r.id === 'not-dispensed').request, 'REFUSEE');
    assert.equal(rows.find(r => r.id === 'accepted').dateDelivrance, null);
    assert.equal(rows.find(r => r.id === 'accepted').newOrdonnanceId, 'child');
    assert.equal(rows.find(r => r.id === 'child').prescription, 'PENDING');
  } finally { await pg.close(); }
});
