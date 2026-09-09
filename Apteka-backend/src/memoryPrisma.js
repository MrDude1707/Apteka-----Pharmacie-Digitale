// In-memory demo adapter. Production always uses PostgreSQL.
const { randomUUID } = require('node:crypto');

function createMemoryPrisma(seed = {}) {
  let state = structuredClone(seed);
  let queue = Promise.resolve();
  const names = ['user', 'profile', 'medecinDisponible', 'pharmacie', 'medicament', 'stock', 'ordonnance', 'renewalRequest', 'commande', 'message', 'otpCode'];
  for (const name of names) state[name] ||= [];
  const relations = {
    user: { profile: ['profile', 'id', 'userId'], medecinDisponible: ['medecinDisponible', 'id', 'userId'] },
    profile: { user: ['user', 'userId', 'id'], medecinChoisi: ['medecinDisponible', 'medecinChoisiId', 'id'], pharmacie: ['pharmacie', 'pharmacieId', 'id'] },
    medecinDisponible: { user: ['user', 'userId', 'id'] },
    stock: { medicament: ['medicament', 'medicamentId', 'id'], pharmacie: ['pharmacie', 'pharmacieId', 'id'] },
    ordonnance: { renewal: ['renewalRequest', 'id', 'ordonnanceId'], commande: ['commande', 'id', 'ordonnanceId'],
      patient: ['user', 'patientId', 'id'], medecin: ['user', 'medecinId', 'id'] },
    renewalRequest: { ordonnance: ['ordonnance', 'ordonnanceId', 'id'] },
    commande: { ordonnance: ['ordonnance', 'ordonnanceId', 'id'], patient: ['user', 'patientId', 'id'], pharmacie: ['pharmacie', 'pharmacieId', 'id'] }
  };
  function relation(model, row, key) {
    const [target, local, foreign] = relations[model][key];
    return [target, state[target].find(r => row[local] != null && r[foreign] === row[local]) || null];
  }
  function matches(model, row, where = {}) {
    if (!row) return false;
    return Object.entries(where).every(([key, filter]) => {
      if (key === 'OR') return filter.some(w => matches(model, row, w));
      if (key === 'AND') return (Array.isArray(filter) ? filter : [filter]).every(w => matches(model, row, w));
      if (key === 'NOT') return !matches(model, row, filter);
      if (key === 'pharmacieId_medicamentId') return matches(model, row, filter);
      if (relations[model]?.[key]) {
        const [target, related] = relation(model, row, key);
        return filter === null ? !related : matches(target, related, filter.is || filter);
      }
      if (filter === undefined) return true;
      const value = row[key];
      if (filter === null) return value == null;
      if (typeof filter !== 'object' || filter instanceof Date) return value === filter;
      return Object.entries(filter).every(([op, operand]) => {
        if (op === 'mode') return true;
        if (op === 'in') return operand.includes(value);
        if (op === 'not') return value !== operand;
        if (op === 'equals') return value === operand;
        if (op === 'gt') return value > operand;
        if (op === 'gte') return value >= operand;
        if (op === 'lt') return value < operand;
        if (op === 'lte') return value <= operand;
        if (op === 'contains') return String(value || '').toLowerCase().includes(operand.toLowerCase());
        return false;
      });
    });
  }
  function project(model, row, options = {}) {
    if (!row) return null;
    const result = options.select ? {} : structuredClone(row);
    for (const [key, option] of Object.entries(options.select || options.include || {})) {
      if (!option) continue;
      if (relations[model]?.[key]) {
        const [target, related] = relation(model, row, key);
        result[key] = project(target, related, option === true ? {} : option);
      } else result[key] = structuredClone(row[key]);
    }
    return result;
  }
  const unique = {
    user: [['email']], profile: [['userId']], medecinDisponible: [['userId']], medicament: [['cis']],
    stock: [['pharmacieId', 'medicamentId']], ordonnance: [['code']],
    renewalRequest: [['ordonnanceId'], ['newOrdonnanceId']], commande: [['ordonnanceId'], ['stripeSessionId']]
  };
  function checkUnique(model, row) {
    if ((unique[model] || []).some(keys => keys.every(k => row[k] != null)
      && state[model].some(other => other.id !== row.id && keys.every(k => other[k] === row[k])))) {
      const err = new Error('Unique constraint'); err.code = 'P2002'; throw err;
    }
  }
  const defaults = model => ({
    ...(model === 'medicament' ? { isActive: true, requiresPrescription: true, classificationReviewed: false, currency: 'MGA' } : {}),
    ...(model === 'medecinDisponible' ? { actif: true } : {}),
    ...(model === 'ordonnance' ? { status: 'PENDING', renewable: false, dateEmission: new Date(), dateDelivrance: null, dateExpiration: null } : {}),
    ...(model === 'renewalRequest' ? { status: 'EN_ATTENTE', requestedAt: new Date(), decidedAt: null } : {}),
    ...(model === 'stock' ? { quantite: 0 } : {}),
    ...(model === 'commande' ? { status: 'RESERVEE', stockReserved: false, currency: 'MGA' } : {}),
    id: randomUUID(), createdAt: new Date(), updatedAt: new Date()
  });
  const client = { isFallback: true };
  for (const model of names) {
    const find = where => state[model].find(row => matches(model, row, where));
    const change = (row, data) => {
      if (!row) { const err = new Error('Not found'); err.code = 'P2025'; throw err; }
      const next = { ...row, updatedAt: new Date() };
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        next[key] = value?.increment !== undefined ? row[key] + value.increment
          : value?.decrement !== undefined ? row[key] - value.decrement : value;
      }
      checkUnique(model, next);
      Object.assign(row, next);
      return row;
    };
    client[model] = {
      findUnique: async (args) => project(model, find(args.where), args),
      findFirst: async (args) => project(model, find(args.where), args),
      findMany: async (args = {}) => {
        let rows = state[model].filter(r => matches(model, r, args.where));
        for (const [key, dir] of Object.entries(args.orderBy || {})) rows.sort((a,b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (dir === 'desc' ? -1 : 1));
        return rows.slice(args.skip || 0, args.take ? (args.skip || 0) + args.take : undefined).map(r => project(model, r, args));
      },
      count: async (args = {}) => state[model].filter(r => matches(model, r, args.where)).length,
      create: async (args) => {
        const data = { ...args.data };
        const profile = model === 'user' ? data.profile?.create : null;
        if (profile) delete data.profile;
        const row = { ...defaults(model), ...data };
        checkUnique(model, row);
        state[model].push(row);
        if (profile) await client.profile.create({ data: { ...profile, userId: row.id } });
        return project(model, row, args);
      },
      update: async (args) => project(model, change(find(args.where), args.data), args),
      updateMany: async ({ where, data }) => {
        const rows = state[model].filter(r => matches(model, r, where));
        rows.forEach(row => change(row, data));
        return { count: rows.length };
      },
      deleteMany: async ({ where } = {}) => {
        const before = state[model].length;
        state[model] = state[model].filter(r => !matches(model, r, where));
        return { count: before - state[model].length };
      },
      aggregate: async () => ({ _sum: { quantite: state[model].reduce((n,r) => n + (r.quantite || 0), 0) } })
    };
  }
  client.$transaction = async work => {
    if (typeof work !== 'function') return Promise.all(work); // Legacy read-only/demo operations.
    const previous = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await previous;
    const snapshot = structuredClone(state);
    try { return await work(client); }
    catch (error) { state = snapshot; throw error; }
    finally { release(); }
  };
  return client;
}
module.exports = { createMemoryPrisma };
