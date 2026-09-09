const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture, line } = require('./fixtures');
const denied = (operation, status) => assert.rejects(operation, e => e.status === status);

test('prescription and messages require an active linked doctor-patient pair', async () => {
  const { db, care } = fixture();
  await denied(() => care.prescribe('doctor', { patientId: 'other', medicaments: [line()] }), 403);
  await denied(() => care.sendMessage('patient', 'doctor2', 'Bonjour', 'PATIENT'), 403);
  await denied(() => care.sendMessage('doctor2', 'patient', 'Bonjour', 'MEDECIN'), 403);
  await care.sendMessage('patient', 'doctor', ' Bonjour ', 'PATIENT');
  assert.equal((await db.message.findMany())[0].content, 'Bonjour');
  await db.profile.update({ where: { userId: 'doctor' }, data: { status: 'BLOCKED' } });
  await denied(() => care.sendMessage('patient', 'doctor', 'Bonjour', 'PATIENT'), 403);
});

test('catalogue identity is canonical and invalid prescription lines are rejected', async () => {
  const { care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()], renewable: true });
  assert.equal(ord.medicaments[0].nom, 'Produit test sur ordonnance');
  assert.match(ord.code, /^ORD-[a-f0-9-]{36}$/);
  await denied(() => care.prescribe('doctor', { patientId: 'patient', medicaments: [line(), line()] }), 400);
  await denied(() => care.prescribe('doctor', { patientId: 'patient', medicaments: [line('inactive')] }), 409);
  await denied(() => care.prescribe('doctor', { patientId: 'patient', medicaments: [line('rx', 1.5)] }), 400);
});

test('renewal request cannot change dispensing, cannot precede dispensing and is single-use', async () => {
  const { db, care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()], renewable: true });
  await denied(() => care.requestRenewal('patient', ord.id), 409);
  await care.dispense('pharmacy', ord.id);
  const original = await db.ordonnance.findUnique({ where: { id: ord.id } });
  const results = await Promise.allSettled([care.requestRenewal('patient', ord.id), care.requestRenewal('patient', ord.id)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const decisions = await Promise.allSettled([
    care.decideRenewal('doctor', ord.id, 'ACCEPTEE', null, { renewable: true }),
    care.decideRenewal('doctor', ord.id, 'ACCEPTEE')
  ]);
  assert.equal(decisions.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(await db.ordonnance.count(), 2);
  const after = await db.ordonnance.findUnique({ where: { id: ord.id }, include: { renewal: true } });
  assert.equal(after.status, 'DELIVREE');
  assert.deepEqual(after.dateDelivrance, original.dateDelivrance);
  assert.equal(after.renewal.status, 'ACCEPTEE');
  const next = await db.ordonnance.findUnique({ where: { id: after.renewal.newOrdonnanceId } });
  assert.equal(next.status, 'PENDING');
  assert.equal(next.dateDelivrance, null);
});

test('renewal refusals require a reason and are visible without changing prescription', async () => {
  const { db, care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()], renewable: true });
  await care.dispense('pharmacy', ord.id);
  await care.requestRenewal('patient', ord.id);
  await denied(() => care.decideRenewal('doctor2', ord.id, 'ACCEPTEE'), 404);
  await denied(() => care.decideRenewal('doctor', ord.id, 'REFUSEE', ''), 400);
  await care.decideRenewal('doctor', ord.id, 'REFUSEE', 'Nouvelle consultation nécessaire');
  assert.equal(await db.ordonnance.count(), 1);
  const request = await db.renewalRequest.findUnique({ where: { ordonnanceId: ord.id } });
  assert.equal(request.reason, 'Nouvelle consultation nécessaire');
  assert.equal(request.decidedBy, 'doctor');
});

test('ordinary purchase rejects unreviewed, inactive and prescription-only products', async () => {
  const { care } = fixture();
  for (const [id, status] of [['rx', 403], ['unreviewed', 409], ['inactive', 409]]) {
    await denied(() => care.order('patient', { pharmacieId: 'pharmacy', items: [{ medicamentId: id, qty: 1 }] }, 'RESERVEE'), status);
  }
  const order = await care.order('patient', { pharmacieId: 'pharmacy', total: 0.01,
    items: [{ medicamentId: 'otc', qty: 2, medicament: { prix: 0.01 } }] }, 'RESERVEE');
  assert.equal(order.total, 4000);
  assert.equal(order.currency, 'MGA');
  assert.equal(order.status, 'RESERVEE');
});

test('prescription purchase must belong to patient and exactly match quantities, no duplicate use', async () => {
  const { db, care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()] });
  const cart = { pharmacieId: 'pharmacy', ordonnanceId: ord.id, items: [{ medicamentId: 'rx', qty: 2 }] };
  await denied(() => care.order('other', cart, 'RESERVEE'), 403);
  await denied(() => care.order('patient', { ...cart, items: [{ medicamentId: 'rx', qty: 1 }] }, 'RESERVEE'), 400);
  const results = await Promise.allSettled([care.order('patient', cart, 'RESERVEE'), care.order('patient', cart, 'RESERVEE')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await db.stock.findUnique({ where: { id: 's-rx' } })).quantite, 8);
  await denied(() => care.dispense('pharmacy2', ord.id), 403);
  await denied(() => care.dispense('pharmacy', ord.id), 409);
  const cmd = results.find(r => r.status === 'fulfilled').value;
  await db.commande.update({ where: { id: cmd.id }, data: { status: 'PAYEE' } });
  await care.dispense('pharmacy', ord.id);
  await denied(() => care.dispense('pharmacy', ord.id), 409);
  assert.equal((await db.stock.findUnique({ where: { id: 's-rx' } })).quantite, 8);
});

test('insufficient stock rolls back the whole reservation and concurrent sales cannot oversell', async () => {
  const { db, care } = fixture();
  await denied(() => care.order('patient', { pharmacieId: 'pharmacy', items: [
    { medicamentId: 'otc', qty: 3 }, { medicamentId: 'unreviewed', qty: 1 }
  ] }, 'RESERVEE'), 409);
  assert.equal((await db.stock.findUnique({ where: { id: 's-otc' } })).quantite, 10);
  const cart = { pharmacieId: 'pharmacy', items: [{ medicamentId: 'otc', qty: 7 }] };
  const results = await Promise.allSettled([care.order('patient', cart, 'RESERVEE'), care.order('other', cart, 'RESERVEE')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await db.stock.findUnique({ where: { id: 's-otc' } })).quantite, 3);
});

test('cancellation releases prescription and inventory exactly once', async () => {
  const { db, care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()] });
  const cmd = await care.order('patient', { pharmacieId: 'pharmacy', ordonnanceId: ord.id, items: [{ medicamentId: 'rx', qty: 2 }] }, 'RESERVEE');
  await Promise.all([care.cancelOrder('patient', cmd.id), care.cancelOrder('patient', cmd.id)]);
  assert.equal((await db.stock.findUnique({ where: { id: 's-rx' } })).quantite, 10);
  assert.equal((await db.commande.findUnique({ where: { id: cmd.id } })).ordonnanceId, null);
  assert.equal((await db.ordonnance.findUnique({ where: { id: ord.id } })).status, 'PENDING');
});

test('payment session must match order, patient, stored session, currency and exact amount', async () => {
  const { db, care } = fixture();
  const cmd = await care.order('patient', { pharmacieId: 'pharmacy', items: [{ medicamentId: 'otc', qty: 2 }] }, 'EN_ATTENTE_DE_PAIEMENT');
  await db.commande.update({ where: { id: cmd.id }, data: { stripeSessionId: 'session-test' } });
  const session = { id: 'session-test', payment_status: 'paid', amount_total: 4000, currency: 'mga', metadata: { commandeId: cmd.id, patientId: 'patient' } };
  for (const wrong of [{ amount_total: 1 }, { id: 'different-session' }, { metadata: { commandeId: 'other-order', patientId: 'patient' } }, { currency: 'usd' }]) {
    await denied(() => care.confirmPayment('patient', cmd.id, { ...session, ...wrong }), 409);
  }
  await care.confirmPayment('patient', cmd.id, session);
  await care.confirmPayment('patient', cmd.id, session);
  assert.equal((await db.stock.findUnique({ where: { id: 's-otc' } })).quantite, 8);
});

test('historical EUR payment verification preserves its two-decimal minor units', async () => {
  const { db, care } = fixture();
  const cmd = await db.commande.create({ data: {
    patientId: 'patient', pharmacieId: 'pharmacy', items: [{ medicamentId: 'otc', qty: 1 }],
    total: 2.5, currency: 'EUR', status: 'EN_ATTENTE_DE_PAIEMENT', stockReserved: true, stripeSessionId: 'legacy-eur'
  } });
  const session = { id: 'legacy-eur', payment_status: 'paid', amount_total: 250, currency: 'eur', metadata: { commandeId: cmd.id, patientId: 'patient' } };
  await care.confirmPayment('patient', cmd.id, session);
  assert.equal((await db.commande.findUnique({ where: { id: cmd.id } })).currency, 'EUR');
});

test('explicit expiry blocks ordering and dispensing; no arbitrary global validity is imposed', async () => {
  const { db, care } = fixture();
  const ord = await care.prescribe('doctor', { patientId: 'patient', medicaments: [line()] });
  assert.equal(ord.dateExpiration, null);
  await db.ordonnance.update({ where: { id: ord.id }, data: { dateExpiration: new Date('2020-01-01') } });
  await denied(() => care.dispense('pharmacy', ord.id), 409);
  await denied(() => care.order('patient', { pharmacieId: 'pharmacy', ordonnanceId: ord.id, items: [{ medicamentId: 'rx', qty: 2 }] }, 'RESERVEE'), 409);
});
