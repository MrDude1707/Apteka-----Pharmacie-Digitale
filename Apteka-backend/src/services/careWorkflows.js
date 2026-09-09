const { randomUUID } = require('node:crypto');

class WorkflowError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new WorkflowError(status, message); };
const validId = value => typeof value === 'string' && value.length > 0 && value.length <= 150;
const jsonItems = value => {
  try {
    const items = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(items) || !items.length || items.length > 100) throw new Error();
    return items;
  } catch { fail(400, 'La liste des médicaments est invalide.'); }
};
const expired = ord => !!ord.dateExpiration && new Date(ord.dateExpiration) <= new Date();

function createCareWorkflows(db) {
  async function transaction(work) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await db.$transaction(work, { isolationLevel: 'Serializable' }); }
      catch (error) {
        if (error.code === 'P2034' && attempt < 2) continue;
        if (['P2002', 'P2034'].includes(error.code)) fail(409, 'Cette opération a déjà été traitée ou les données ont changé. Actualisez la page.');
        throw error;
      }
    }
  }

  async function related(patientId, doctorId, tx = db) {
    if (!validId(patientId) || !validId(doctorId)) fail(400, 'Identifiants manquants.');
    const patient = await tx.profile.findUnique({ where: { userId: patientId } });
    const doctor = await tx.profile.findUnique({ where: { userId: doctorId } });
    const card = patient?.medecinChoisiId
      ? await tx.medecinDisponible.findUnique({ where: { id: patient.medecinChoisiId } }) : null;
    if (patient?.role !== 'PATIENT' || patient.status !== 'ACTIVE'
      || doctor?.role !== 'MEDECIN' || doctor.status !== 'ACTIVE'
      || !card?.actif || card.userId !== doctorId) {
      fail(403, 'Cette action est réservée au patient et à son médecin rattaché actif.');
    }
    return patient;
  }

  async function medicineLines(value, tx = db) {
    const seen = new Set();
    const result = [];
    for (const item of jsonItems(value)) {
      if (!validId(item?.medicamentId) || seen.has(item.medicamentId)
        || !Number.isInteger(item.quantite) || item.quantite < 1 || item.quantite > 10000
        || typeof item.posologie !== 'string' || !item.posologie.trim() || item.posologie.length > 1000
        || typeof item.duree !== 'string' || !item.duree.trim() || item.duree.length > 150
        || typeof item.dosage !== 'string' || !item.dosage.trim() || item.dosage.length > 150) {
        fail(400, 'Chaque ligne doit avoir un médicament unique, une quantité entière, un dosage, une posologie et une durée.');
      }
      const medicine = await tx.medicament.findUnique({ where: { id: item.medicamentId } });
      if (!medicine?.isActive) fail(409, 'Un médicament est inconnu ou retiré du catalogue.');
      seen.add(item.medicamentId);
      result.push({ medicamentId: medicine.id, nom: medicine.nom, quantite: item.quantite,
        dosage: item.dosage.trim(), posologie: item.posologie.trim(), duree: item.duree.trim() });
    }
    return result;
  }

  function prescriptionOptions(data) {
    if (data.renewable !== undefined && typeof data.renewable !== 'boolean') fail(400, 'Autorisation de renouvellement invalide.');
    let dateExpiration = null;
    if (data.dateExpiration) {
      dateExpiration = new Date(data.dateExpiration);
      if (Number.isNaN(dateExpiration.getTime()) || dateExpiration <= new Date()) fail(400, 'La date limite de délivrance doit être future.');
    }
    return { renewable: data.renewable === true, dateExpiration };
  }

  async function prescribe(doctorId, data) {
    return transaction(async tx => {
      await related(data.patientId, doctorId, tx);
      const medicaments = await medicineLines(data.medicaments, tx);
      return tx.ordonnance.create({ data: {
        code: 'ORD-' + randomUUID(), medecinId: doctorId, patientId: data.patientId,
        status: 'PENDING', medicaments, ...prescriptionOptions(data)
      } });
    });
  }

  async function requestRenewal(patientId, ordonnanceId) {
    return transaction(async tx => {
      const ord = await tx.ordonnance.findUnique({ where: { id: ordonnanceId }, include: { renewal: true } });
      if (!ord || ord.patientId !== patientId) fail(404, 'Ordonnance introuvable.');
      await related(patientId, ord.medecinId, tx);
      if (ord.status !== 'DELIVREE' || !ord.dateDelivrance || !ord.renewable || ord.renewal) {
        fail(409, 'Une demande unique est possible après délivrance, si le médecin a autorisé le renouvellement.');
      }
      return tx.renewalRequest.create({ data: { ordonnanceId } });
    });
  }

  async function decideRenewal(doctorId, ordonnanceId, decision, reason, options = {}) {
    if (!['ACCEPTEE', 'REFUSEE'].includes(decision)) fail(400, 'Décision invalide.');
    if (decision === 'REFUSEE' && (typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 1000)) {
      fail(400, 'Indiquez un motif de refus entre 3 et 1000 caractères.');
    }
    return transaction(async tx => {
      const ord = await tx.ordonnance.findUnique({ where: { id: ordonnanceId }, include: { renewal: true } });
      if (!ord || ord.medecinId !== doctorId) fail(404, 'Ordonnance introuvable.');
      await related(ord.patientId, doctorId, tx);
      if (ord.renewal?.status !== 'EN_ATTENTE') fail(409, 'Cette demande a déjà été traitée ou n’existe pas.');
      let newOrdonnance = null;
      if (decision === 'ACCEPTEE') {
        if (ord.status !== 'DELIVREE' || !ord.dateDelivrance) fail(409, 'Aucune délivrance attestée. Une nouvelle consultation est nécessaire.');
        const medicaments = await medicineLines(ord.medicaments, tx);
        newOrdonnance = await tx.ordonnance.create({ data: {
          medecinId: doctorId, patientId: ord.patientId, medicaments, status: 'PENDING',
          code: 'ORD-' + randomUUID(), parentOrdonnanceId: ord.id,
          ...prescriptionOptions(options)
        } });
      }
      const changed = await tx.renewalRequest.updateMany({
        where: { id: ord.renewal.id, status: 'EN_ATTENTE' },
        data: { status: decision, decidedAt: new Date(), decidedBy: doctorId,
          reason: decision === 'REFUSEE' ? reason.trim() : null, newOrdonnanceId: newOrdonnance?.id || null }
      });
      if (changed.count !== 1) fail(409, 'Cette demande a déjà été traitée.');
      return { newOrdonnance, decision };
    });
  }

  async function sendMessage(senderId, receiverId, content, senderRole) {
    if (typeof content !== 'string' || !content.trim() || content.length > 5000) fail(400, 'Le message doit contenir entre 1 et 5000 caractères.');
    return transaction(async tx => {
      if (senderRole === 'PATIENT') await related(senderId, receiverId, tx);
      else if (senderRole === 'MEDECIN') await related(receiverId, senderId, tx);
      else fail(403, 'Messagerie réservée au patient et à son médecin.');
      return tx.message.create({ data: { senderId, receiverId, content: content.trim() } });
    });
  }

  // One order fulfils the entire prescription. Partial dispensing is not offered.
  async function order(patientId, data, status) {
    if (!['RESERVEE', 'EN_ATTENTE_DE_PAIEMENT'].includes(status)) fail(400, 'Statut initial invalide.');
    if (!validId(data.pharmacieId)) fail(400, 'Pharmacie manquante.');
    return transaction(async tx => {
      const pharmacy = await tx.pharmacie.findUnique({ where: { id: data.pharmacieId } });
      if (!pharmacy) fail(404, 'Pharmacie introuvable.');
      const quantities = new Map();
      for (const item of jsonItems(data.items)) {
        if (!validId(item?.medicamentId) || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 10000
          || (item.pharmacieId && item.pharmacieId !== pharmacy.id)) fail(400, 'Articles ou quantités invalides.');
        quantities.set(item.medicamentId, (quantities.get(item.medicamentId) || 0) + item.qty);
      }
      let ord = null;
      if (data.ordonnanceId) {
        ord = await tx.ordonnance.findUnique({ where: { id: data.ordonnanceId }, include: { commande: true } });
        if (!ord || ord.patientId !== patientId) fail(403, 'Cette ordonnance ne vous appartient pas.');
        if (ord.status !== 'PENDING' || expired(ord) || ord.commande) fail(409, 'Ordonnance expirée, délivrée ou déjà associée à une commande.');
        const lines = await medicineLines(ord.medicaments, tx);
        if (lines.length !== quantities.size || lines.some(line => quantities.get(line.medicamentId) !== line.quantite)) {
          fail(400, 'Commandez tous les médicaments de l’ordonnance dans les quantités prescrites et dans une seule pharmacie.');
        }
      }
      const items = [];
      let cents = 0;
      for (const [medicamentId, qty] of quantities) {
        if (qty > 10000) fail(400, 'Quantité trop élevée.');
        const medicine = await tx.medicament.findUnique({ where: { id: medicamentId } });
        if (!medicine?.isActive) fail(409, 'Médicament inconnu ou retiré du catalogue.');
        if (!medicine.classificationReviewed) fail(409, 'Le régime de délivrance de ce produit doit être vérifié avant commande.');
        if (medicine.requiresPrescription && !ord) fail(403, 'Une ordonnance personnelle valide est obligatoire pour ce produit.');
        if (!Number.isFinite(medicine.prix) || medicine.prix <= 0) fail(409, 'Prix indisponible pour ce médicament.');
        const unitCents = Math.round(medicine.prix * 100);
        cents += unitCents * qty;
        const stock = await tx.stock.findFirst({ where: { pharmacieId: pharmacy.id, medicamentId } });
        if (!stock || stock.quantite < qty) fail(409, 'Stock insuffisant pour ' + medicine.nom + '.');
        const changed = await tx.stock.updateMany({ where: { id: stock.id, quantite: { gte: qty } }, data: { quantite: { decrement: qty } } });
        if (changed.count !== 1) fail(409, 'Le stock vient de changer. Actualisez votre panier.');
        items.push({ medicamentId, pharmacieId: pharmacy.id, qty,
          medicament: { id: medicine.id, nom: medicine.nom, prix: unitCents / 100 },
          pharmacie: { id: pharmacy.id, name: pharmacy.name } });
      }
      if (ord) {
        const claimed = await tx.ordonnance.updateMany({ where: { id: ord.id, status: 'PENDING' }, data: { pharmacieId: pharmacy.id } });
        if (claimed.count !== 1) fail(409, 'Cette ordonnance vient de changer.');
      }
      return tx.commande.create({ data: { patientId, pharmacieId: pharmacy.id, items,
        total: cents / 100, status, stockReserved: true, ordonnanceId: ord?.id || null } });
    });
  }

  async function confirmPayment(patientId, commandeId, session) {
    return transaction(async tx => {
      const cmd = await tx.commande.findUnique({ where: { id: commandeId } });
      if (!cmd || cmd.patientId !== patientId) fail(404, 'Commande introuvable.');
      if (cmd.stripeSessionId !== session.id || session.metadata?.commandeId !== cmd.id
        || session.metadata?.patientId !== patientId || session.payment_status !== 'paid'
        || session.currency !== 'eur' || session.amount_total !== Math.round(cmd.total * 100)) {
        fail(409, 'Le paiement ne correspond pas à cette commande.');
      }
      if (['PAYEE', 'EN_ROUTE', 'LIVREE'].includes(cmd.status)) return cmd;
      if (cmd.status !== 'EN_ATTENTE_DE_PAIEMENT') fail(409, 'Cette commande ne peut plus être payée.');
      if (!cmd.stockReserved) fail(409, 'Ancienne commande sans réservation de stock vérifiable : un rapprochement manuel est nécessaire.');
      return tx.commande.update({ where: { id: cmd.id }, data: { status: 'PAYEE', paidAt: new Date() } });
    });
  }

  // Caller must first expire any open Stripe session and reject a paid session.
  async function cancelOrder(patientId, commandeId) {
    return transaction(async tx => {
      const cmd = await tx.commande.findUnique({ where: { id: commandeId } });
      if (!cmd || cmd.patientId !== patientId) fail(404, 'Commande introuvable.');
      if (cmd.status === 'ANNULEE') return cmd;
      if (!['RESERVEE', 'EN_ATTENTE_DE_PAIEMENT'].includes(cmd.status)) fail(409, 'Une commande payée ne peut pas être annulée par cette action.');
      if (!cmd.stockReserved) fail(409, 'Ancienne commande sans réservation de stock vérifiable : un rapprochement manuel est nécessaire.');
      for (const item of jsonItems(cmd.items)) {
        await tx.stock.update({ where: { pharmacieId_medicamentId: { pharmacieId: cmd.pharmacieId, medicamentId: item.medicamentId } },
          data: { quantite: { increment: item.qty } } });
      }
      if (cmd.ordonnanceId) await tx.ordonnance.update({ where: { id: cmd.ordonnanceId }, data: { pharmacieId: null } });
      return tx.commande.update({ where: { id: cmd.id }, data: { status: 'ANNULEE', ordonnanceId: null, stockReserved: false } });
    });
  }

  async function dispense(pharmacieId, ordonnanceId) {
    if (!validId(pharmacieId) || !validId(ordonnanceId)) fail(400, 'Pharmacie ou ordonnance manquante.');
    return transaction(async tx => {
      const ord = await tx.ordonnance.findUnique({ where: { id: ordonnanceId }, include: { commande: true } });
      if (!ord) fail(404, 'Ordonnance introuvable.');
      if (ord.status !== 'PENDING' || expired(ord)) fail(409, 'Ordonnance déjà délivrée, annulée ou expirée.');
      if (ord.pharmacieId && ord.pharmacieId !== pharmacieId) fail(403, 'Cette ordonnance est réservée dans une autre pharmacie.');
      const lines = await medicineLines(ord.medicaments, tx);
      if (ord.commande) {
        if (ord.commande.pharmacieId !== pharmacieId || ord.commande.status !== 'PAYEE') fail(409, 'Le paiement doit être confirmé avant la délivrance.');
        if (!ord.commande.stockReserved) fail(409, 'Le stock de cette commande doit être rapproché avant délivrance.');
        // These units were reserved by order(), do not debit them twice.
      } else {
        for (const line of lines) {
          const changed = await tx.stock.updateMany({ where: { pharmacieId, medicamentId: line.medicamentId, quantite: { gte: line.quantite } },
            data: { quantite: { decrement: line.quantite } } });
          if (changed.count !== 1) fail(409, 'Stock insuffisant pour ' + line.nom + '.');
        }
      }
      const changed = await tx.ordonnance.updateMany({ where: { id: ord.id, status: 'PENDING' },
        data: { status: 'DELIVREE', pharmacieId, dateDelivrance: new Date() } });
      if (changed.count !== 1) fail(409, 'Cette ordonnance a déjà été délivrée.');
      return tx.ordonnance.findUnique({ where: { id: ord.id } });
    });
  }
  return { related, prescribe, requestRenewal, decideRenewal, sendMessage, order, confirmPayment, cancelOrder, dispense, transaction };
}

function respondError(res, error) {
  if (error instanceof WorkflowError) return res.status(error.status).json({ error: error.message });
  console.error('Workflow failed:', error.code || error.name);
  return res.status(500).json({ error: 'L’opération n’a pas pu être enregistrée.' });
}
module.exports = { createCareWorkflows, WorkflowError, respondError, expired, jsonItems };
