const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./fixtures');
const { createCheckoutWorkflows } = require('../src/services/checkoutWorkflows');
const cart = { pharmacieId: 'pharmacy', items: [{ medicamentId: 'otc', qty: 2 }], frontendUrl: 'http://localhost:5173' };
const config = { NODE_ENV: 'production', STRIPE_SECRET_KEY: 'synthetic-key', APP_URL: 'http://localhost:5173' };
const stock = db => db.stock.findUnique({ where: { id: 's-otc' } });

test('unconfigured payments and foreign redirects do not reserve any inventory', async () => {
  const { db } = fixture();
  const checkout = createCheckoutWorkflows(db, {}, { NODE_ENV: 'production', DEMO_PAYMENTS: 'true' });
  await assert.rejects(checkout.create('patient', cart), e => e.status === 503);
  await assert.rejects(checkout.create('patient', { ...cart, frontendUrl: 'https://attacker.example' }), e => e.status === 400);
  assert.equal(await db.commande.count(), 0);
  assert.equal((await stock(db)).quantite, 10);
});

test('definite provider rejection cancels the order and releases reserved stock', async () => {
  const { db } = fixture();
  const stripe = { checkout: { sessions: { create: async () => { throw { type: 'StripeAuthenticationError' }; } } } };
  await assert.rejects(createCheckoutWorkflows(db, stripe, config).create('patient', cart), e => e.status === 502 && e.message.includes('annulée'));
  assert.equal((await stock(db)).quantite, 10);
  assert.equal((await db.commande.findFirst({})).status, 'ANNULEE');
});

test('ambiguous provider failure keeps inventory reserved and asks for reconciliation', async () => {
  const { db } = fixture();
  const stripe = { checkout: { sessions: { create: async () => { throw { type: 'StripeConnectionError' }; } } } };
  await assert.rejects(createCheckoutWorkflows(db, stripe, config).create('patient', cart), e => e.message.includes('rapprocher'));
  assert.equal((await stock(db)).quantite, 8);
  assert.equal((await db.commande.findFirst({})).status, 'EN_ATTENTE_DE_PAIEMENT');
});

test('real session is closed before inventory is released when session persistence fails', async () => {
  const { db } = fixture();
  const update = db.commande.update;
  db.commande.update = args => {
    if (args.data.stripeSessionId) throw new Error('Synthetic persistence failure');
    return update(args);
  };
  let closed = false;
  const stripe = { checkout: { sessions: {
    create: async () => ({ id: 'cs_synthetic', url: 'https://checkout.example' }),
    expire: async id => { assert.equal(id, 'cs_synthetic'); assert.equal((await stock(db)).quantite, 8); closed = true; return { status: 'expired', payment_status: 'unpaid' }; }
  } } };
  await assert.rejects(createCheckoutWorkflows(db, stripe, config).create('patient', cart), e => e.status === 502);
  assert.equal(closed, true);
  assert.equal((await stock(db)).quantite, 10);
});

test('paid or uncloseable sessions can never release reserved inventory', async () => {
  const { db, care } = fixture();
  const cmd = await care.order('patient', cart, 'EN_ATTENTE_DE_PAIEMENT');
  await db.commande.update({ where: { id: cmd.id }, data: { stripeSessionId: 'cs_paid' } });
  const stripe = { checkout: { sessions: {
    retrieve: async () => ({ id: 'cs_paid', status: 'complete', payment_status: 'paid', metadata: { commandeId: cmd.id, patientId: 'patient' } })
  } } };
  await assert.rejects(createCheckoutWorkflows(db, stripe, config).cancel('patient', cmd.id), e => e.status === 409);
  assert.equal((await stock(db)).quantite, 8);
});

test('explicit development payment simulation stores an exact bound session', async () => {
  const { db } = fixture();
  const checkout = createCheckoutWorkflows(db, {}, { NODE_ENV: 'development', DEMO_PAYMENTS: 'true' });
  const result = await checkout.create('patient', cart);
  const cmd = await db.commande.findFirst({});
  assert.match(result.sessionId, /^mock_/);
  assert.equal(cmd.stripeSessionId, result.sessionId);
  assert.equal(cmd.status, 'EN_ATTENTE_DE_PAIEMENT');
  await checkout.cancel('patient', cmd.id);
  assert.equal((await stock(db)).quantite, 10);
});

test('legacy orders cannot create phantom inventory during cancellation', async () => {
  const { db, care } = fixture();
  const cmd = await db.commande.create({ data: { patientId: 'patient', pharmacieId: 'pharmacy', items: cart.items, total: 4 } });
  await assert.rejects(care.cancelOrder('patient', cmd.id), e => e.status === 409);
  assert.equal((await stock(db)).quantite, 10);
});
