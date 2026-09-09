const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { fixture, line } = require('./fixtures');
const { db } = fixture();
process.env.JWT_SECRET = 'isolated-test-secret-do-not-use-in-production';
// Inject only synthetic in-memory data. No .env, email or external database is loaded.
require.cache[require.resolve('../src/prisma')] = { exports: db };
const app = express();
app.use(express.json());
app.use('/patient', require('../src/routes/patientRoutes'));
app.use('/medecin', require('../src/routes/medecinRoutes'));
app.use('/pharmacien', require('../src/routes/pharmacienRoutes'));
app.use('/auth', require('../src/routes/authRoutes'));
let server, url;
before(async () => {
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  url = 'http://127.0.0.1:' + server.address().port;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });
async function request(id, path, method = 'GET', body) {
  return fetch(url + path, { method, headers: {
    ...(id ? { Authorization: 'Bearer ' + jwt.sign({ id }, process.env.JWT_SECRET) } : {}),
    'Content-Type': 'application/json'
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
test('each protected API rejects unauthenticated access and inappropriate roles', async () => {
  for (const [path, allowed] of [['/patient/ordonnances/my-history', 'patient'], ['/medecin/ordonnances/history', 'doctor'],
    ['/pharmacien/stocks', 'pharma'], ['/auth/admin/all-users', 'admin']]) {
    assert.equal((await request(null, path)).status, 401);
    for (const id of ['patient', 'doctor', 'pharma', 'admin', 'pending']) {
      assert.equal((await request(id, path)).status, id === allowed ? 200 : 403, path + ' / ' + id);
    }
  }
});
test('registration forbids administrative or unknown roles before creating a user', async () => {
  for (const role of ['ADMINISTRATEUR', 'ROOT', '', null]) {
    const response = await request(null, '/auth/register', 'POST', { email: 'new@example.test', password: 'testing-only', firstName: 'Test', lastName: 'User', role });
    assert.equal(response.status, 400);
  }
  assert.equal(await db.user.count(), 7);
});
test('professional approval cannot be bypassed through resend/verify OTP', async () => {
  assert.equal((await request(null, '/auth/resend-otp', 'POST', { userId: 'pending' })).status, 400);
  await db.otpCode.create({ data: { userId: 'pending', code: '123456', type: 'REGISTER', expiresAt: new Date(Date.now() + 60000) } });
  assert.equal((await request(null, '/auth/verify-otp', 'POST', { userId: 'pending', code: '123456' })).status, 409);
  assert.equal((await db.profile.findUnique({ where: { userId: 'pending' } })).status, 'PENDING');
});
test('doctor cannot search or message an unrelated patient', async () => {
  assert.equal((await request('doctor', '/medecin/patient/search?email=other@example.test')).status, 403);
  assert.equal((await request('doctor', '/medecin/messages/other')).status, 403);
  assert.equal((await request('doctor', '/medecin/messages', 'POST', { receiverId: 'other', content: 'Bonjour' })).status, 403);
  assert.equal((await request('patient', '/patient/messages', 'POST', { receiverId: 'admin', content: 'Bonjour' })).status, 403);
});
test('pharmacist cannot update orders from another pharmacy', async () => {
  const cmd = await db.commande.create({ data: { patientId: 'patient', pharmacieId: 'pharmacy2', status: 'RESERVEE', items: [], total: 0 } });
  assert.equal((await request('pharma', '/pharmacien/commandes/' + cmd.id + '/status', 'POST', { status: 'PAYEE' })).status, 403);
  assert.equal((await db.commande.findUnique({ where: { id: cmd.id } })).status, 'RESERVEE');
});
test('catalogue regime cannot be changed by a patient, doctor or pharmacist', async () => {
  const body = { requiresPrescription: false, isActive: true, classificationSource: 'Source pédagogique de test' };
  for (const role of ['patient', 'doctor', 'pharma']) assert.equal((await request(role, '/auth/admin/catalogue/rx', 'PUT', body)).status, 403);
  assert.equal((await request('admin', '/auth/admin/catalogue/rx', 'PUT', { ...body, classificationSource: '' })).status, 400);
  assert.equal((await db.medicament.findUnique({ where: { id: 'rx' } })).requiresPrescription, true);
});

test('linked prescription to reservation to dispensing to accepted renewal works through actual role routes', async () => {
  async function json(id, path, method, body, status = 200) {
    const response = await request(id, path, method, body);
    const result = await response.json();
    assert.equal(response.status, status, path + ': ' + JSON.stringify(result));
    return result;
  }
  const issued = await json('doctor', '/medecin/ordonnances', 'POST', { patientId: 'patient', medicaments: [line()], renewable: true }, 201);
  const ord = issued.ordonnance;
  const options = await json('patient', '/patient/ordonnances/' + ord.id + '/pharmacies');
  assert.equal(options.length, 1);
  assert.equal(options[0].items[0].qty, 2);
  const reserved = await json('patient', '/patient/commandes', 'POST', {
    pharmacieId: 'pharmacy', ordonnanceId: ord.id, items: [{ medicamentId: 'rx', qty: 2 }]
  }, 201);
  const cmd = reserved.commande;
  assert.equal(cmd.status, 'RESERVEE');
  await json('pharma', '/pharmacien/commandes/' + cmd.id + '/status', 'POST', { status: 'EN_ROUTE' }, 409);
  // A long reservation must not become delivered immediately upon payment.
  await db.commande.update({ where: { id: cmd.id }, data: { createdAt: new Date('2020-01-01') } });
  await json('pharma', '/pharmacien/commandes/' + cmd.id + '/status', 'POST', { status: 'PAYEE' });
  let history = await json('patient', '/patient/commandes/my-history');
  assert.equal(history.find(c => c.id === cmd.id).status, 'PAYEE');
  await json('pharma', '/pharmacien/commandes/' + cmd.id + '/status', 'POST', { status: 'EN_ROUTE' }, 409);
  await json('pharma', '/pharmacien/ordonnances/deliver', 'POST', { ordonnanceId: ord.id });
  history = await json('patient', '/patient/commandes/my-history');
  assert.equal(history.find(c => c.id === cmd.id).status, 'PAYEE');
  assert.equal((await db.stock.findUnique({ where: { id: 's-rx' } })).quantite, 8);
  await json('patient', '/patient/ordonnances/' + ord.id + '/renew', 'POST', {}, 201);
  const pending = await json('doctor', '/medecin/renewals');
  assert.equal(pending.find(o => o.id === ord.id).renewal.status, 'EN_ATTENTE');
  await json('doctor', '/medecin/ordonnances/' + ord.id + '/approve-renewal', 'POST', {});
  const prescriptions = await json('patient', '/patient/ordonnances/my-history');
  const original = prescriptions.find(o => o.id === ord.id);
  assert.equal(original.status, 'DELIVREE');
  assert.equal(original.renewal.status, 'ACCEPTEE');
  assert.equal(prescriptions.find(o => o.id === original.renewal.newOrdonnanceId).status, 'PENDING');
});
