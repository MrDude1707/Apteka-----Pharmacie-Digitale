const prisma = require('../prisma');
const { createCareWorkflows, respondError, expired } = require('../services/careWorkflows');
const { createCheckoutWorkflows } = require('../services/checkoutWorkflows');
const care = createCareWorkflows(prisma);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_unconfigured');
const checkout = createCheckoutWorkflows(prisma, stripe);


function normalizeSearchText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function levenshteinDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const previous = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }
  return row[right.length];
}

function medicationMatches(medicament, query) {
  const normalizedQuery = normalizeSearchText(query);
  const queryWords = normalizedQuery.split(' ').filter(Boolean);
  const searchableFields = [medicament.nom, medicament.substanceActive, medicament.categorie, medicament.forme]
    .map(normalizeSearchText)
    .filter(Boolean);

  return queryWords.every(word => searchableFields.some(field => {
    if (field.includes(word)) return true;
    return field.split(' ').some(fieldWord => {
      const limit = word.length >= 7 ? 2 : word.length >= 4 ? 1 : 0;
      return limit > 0 && levenshteinDistance(word, fieldWord) <= limit;
    });
  }));
}

async function getMedicationCatalog(query) {
  const medicaments = await prisma.medicament.findMany({ where: { isActive: true }, orderBy: { nom: 'asc' } });
  return query ? medicaments.filter(medicament => medicationMatches(medicament, query)) : medicaments;
}

async function searchMedicamentAndStocks(req, res) {
  const { query } = req.query;
  try {
    if (!query || query.trim() === '') return res.status(400).json({ error: "Recherche vide." });

    const matchingMeds = await getMedicationCatalog(query.trim());
    
    if (matchingMeds.length === 0) return res.status(200).json({ medicaments: [], stocks: [], message: "Aucun médicament correspondant trouvé." });

    const matchingMedIds = matchingMeds.map(m => m.id);
    const stocks = await prisma.stock.findMany({
      where: { medicamentId: { in: matchingMedIds }, quantite: { gt: 0 } },
      include: { pharmacie: true, medicament: true }
    });
    return res.status(200).json({ medicaments: matchingMeds, stocks: stocks });
  } catch (error) {
    console.error("Erreur lors de la recherche de médicaments :", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la recherche." });
  }
}

async function getCatalogue(req, res) {
  try {
    const medicaments = await getMedicationCatalog(req.query.query?.trim());
    const stocks = await prisma.stock.findMany({
      where: { medicamentId: { in: medicaments.map(medicament => medicament.id) }, quantite: { gt: 0 } },
      include: { pharmacie: true, medicament: true }
    });
    return res.status(200).json({ medicaments, stocks });
  } catch (error) {
    console.error("Erreur lors du chargement du catalogue :", error);
    return res.status(500).json({ error: "Impossible de charger le catalogue." });
  }
}

// TACHE 9 : AUTOCOMPLETION
async function getAutocomplete(req, res) {
  const { q } = req.query;
  try {
    if (!q || q.length < 2) return res.status(200).json([]);
    const meds = (await getMedicationCatalog(q)).slice(0, 5);
    return res.status(200).json(meds);
  } catch(e) {
    return res.status(500).json([]);
  }
}

// TACHE 2 & 4 : PRESCRIPTIONS & RENOUVELLEMENT
async function getMyPrescriptions(req, res) {
  try {
    const prescriptions = await prisma.ordonnance.findMany({
      where: { patientId: req.user.id },
      include: { renewal: true, commande: { select: { id: true, status: true } } },
      orderBy: { dateEmission: 'desc' }
    });
    const populated = [];
    for (const p of prescriptions) {
      const medecin = await prisma.user.findUnique({ where: { id: p.medecinId }, include: { profile: true, medecinDisponible: true } });
      populated.push({ 
        ...p, status: expired(p) && p.status === 'PENDING' ? 'EXPIREE' : p.status,
        medecinName: medecin?.profile ? `Dr. ${medecin.profile.firstName} ${medecin.profile.lastName}` : "Médecin Inconnu",
        medecinSpec: medecin?.medecinDisponible ? medecin.medecinDisponible.specialite : "Généraliste"
      });
    }
    return res.status(200).json(populated);
  } catch (error) {
    console.error("Erreur dans getMyPrescriptions:", error);
    return res.status(500).json({ error: "Erreur lors de la récupération de vos ordonnances." });
  }
}

async function prescriptionPharmacies(req, res) {
  try {
    const ord = await prisma.ordonnance.findUnique({ where: { id: req.params.id }, include: { commande: true } });
    if (!ord || ord.patientId !== req.user.id) return res.status(404).json({ error: 'Ordonnance introuvable.' });
    if (ord.status !== 'PENDING' || expired(ord) || ord.commande) return res.status(409).json({ error: 'Cette ordonnance ne peut pas être commandée.' });
    const lines = typeof ord.medicaments === 'string' ? JSON.parse(ord.medicaments) : ord.medicaments;
    const stocks = await prisma.stock.findMany({ where: { medicamentId: { in: lines.map(l => l.medicamentId) } }, include: { pharmacie: true, medicament: true } });
    const options = [];
    for (const pharmacieId of new Set(stocks.map(s => s.pharmacieId))) {
      const items = lines.map(line => {
        const stock = stocks.find(s => s.pharmacieId === pharmacieId && s.medicamentId === line.medicamentId);
        return stock && stock.quantite >= line.quantite && stock.medicament.isActive && stock.medicament.classificationReviewed
          ? { ...stock, qty: line.quantite } : null;
      });
      if (items.every(Boolean)) options.push({ pharmacie: items[0].pharmacie, items });
    }
    return res.json(options);
  } catch (error) { return respondError(res, error); }
}

async function requestRenewal(req, res) {
  try {
    const renewal = await care.requestRenewal(req.user.id, req.params.id);
    return res.status(201).json({ message: 'Demande envoyée au médecin.', renewal });
  } catch (error) { return respondError(res, error); }
}

// Retrait en officine : réservation à payer sur place, jamais paiement simulé.
async function createCommande(req, res) {
  try {
    const commande = await care.order(req.user.id, req.body, 'RESERVEE');
    return res.status(201).json({ message: 'Réservation enregistrée, paiement en officine.', commande });
  } catch (error) { return respondError(res, error); }
}

// TACHE 3 : MESSAGERIE
async function getMessages(req, res) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id }, include: { medecinChoisi: true } });
    if (!profile || !profile.medecinChoisi || !profile.medecinChoisi.userId) return res.status(200).json({ doctorId: null, messages: [] });
    
    const medecinUserId = profile.medecinChoisi.userId;
    await care.related(req.user.id, medecinUserId);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: medecinUserId },
          { senderId: medecinUserId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json({ doctorId: medecinUserId, messages });
  } catch(e) {
    return respondError(res, e);
  }
}

async function sendMessage(req, res) {
  try {
    const msg = await care.sendMessage(req.user.id, req.body.receiverId, req.body.content, 'PATIENT');
    return res.status(201).json(msg);
  } catch (error) { return respondError(res, error); }
}

async function createCheckoutSession(req, res) {
  try { return res.json(await checkout.create(req.user.id, req.body)); }
  catch (error) { return respondError(res, error); }
}

async function verifyCheckoutSession(req, res) {
  try {
    const { commandeId, sessionId } = req.body;
    if (typeof commandeId !== 'string' || typeof sessionId !== 'string') return res.status(400).json({ error: 'Paramètres manquants.' });
    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande || commande.patientId !== req.user.id) return res.status(404).json({ error: 'Commande introuvable.' });
    if (commande.stripeSessionId !== sessionId) return res.status(409).json({ error: 'Session étrangère à cette commande.' });
    let session;
    if (sessionId.startsWith('mock_') && process.env.NODE_ENV !== 'production' && process.env.DEMO_PAYMENTS === 'true') {
      session = { id: sessionId, payment_status: 'paid', currency: 'eur', amount_total: Math.round(commande.total * 100),
        metadata: { commandeId, patientId: req.user.id } };
    } else {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    }
    const updated = await care.confirmPayment(req.user.id, commandeId, session);
    return res.json({ message: updated.ordonnanceId ? 'Paiement confirmé. L’ordonnance attend la validation de délivrance.' : 'Paiement confirmé. La commande peut être préparée.', commande: updated });
  } catch (error) { return respondError(res, error); }
}

async function cancelCommande(req, res) {
  try {
    const commande = await checkout.cancel(req.user.id, req.params.id);
    return res.json({ message: 'Réservation annulée, stock et ordonnance libérés.', commande });
  } catch (error) { return respondError(res, error); }
}

async function getMyCommandes(req, res) {
  try {
    const commandes = await prisma.commande.findMany({
      where: { patientId: req.user.id },
      include: { pharmacie: true, ordonnance: { select: { status: true, dateDelivrance: true } } },
      orderBy: { createdAt: 'desc' }
    });
    const now = Date.now();
    const updatedCommandes = await Promise.all(commandes.map(async commande => {
      if (commande.ordonnanceId && commande.ordonnance?.status !== 'DELIVREE') return commande;
      const start = Math.max(new Date(commande.paidAt || commande.createdAt).getTime(), new Date(commande.ordonnance?.dateDelivrance || 0).getTime());
      const elapsedSeconds = (now - start) / 1000;
      const nextStatus = elapsedSeconds >= 600 ? 'LIVREE' : elapsedSeconds >= 180 && commande.status === 'PAYEE' ? 'EN_ROUTE' : commande.status;
      if (nextStatus !== commande.status && ['PAYEE', 'EN_ROUTE'].includes(commande.status)) {
        await prisma.commande.updateMany({ where: { id: commande.id, status: commande.status }, data: { status: nextStatus } });
        return prisma.commande.findUnique({ where: { id: commande.id }, include: { pharmacie: true, ordonnance: { select: { status: true, dateDelivrance: true } } } });
      }
      return commande;
    }));
    return res.status(200).json(updatedCommandes);
  } catch (e) {
    console.error("Erreur getMyCommandes :", e);
    return res.status(500).json({ error: "Erreur lors de la récupération de vos commandes." });
  }
}

module.exports = {
  searchMedicamentAndStocks,
  getCatalogue,
  getAutocomplete,
  getMyPrescriptions,
  requestRenewal,
  prescriptionPharmacies,
  createCommande,
  getMessages,
  sendMessage,
  createCheckoutSession,
  verifyCheckoutSession,
  cancelCommande,
  getMyCommandes
};
