const prisma = require('../prisma');
const { createCareWorkflows, respondError, expired } = require('../services/careWorkflows');
const care = createCareWorkflows(prisma);

/**
 * Rechercher un patient par email pour rédiger une ordonnance
 */
async function searchPatient(req, res) {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ error: "Veuillez renseigner un email pour la recherche." });
    }

    const patient = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!patient || !patient.profile || patient.profile.role !== 'PATIENT') {
      return res.status(404).json({ error: "Aucun compte Patient trouvé pour cet email." });
    }

    await care.related(patient.id, req.user.id);
    return res.status(200).json({
      id: patient.id,
      email: patient.email,
      firstName: patient.profile.firstName,
      lastName: patient.profile.lastName
    });
  } catch (error) {
    return respondError(res, error);
  }
}

/**
 * Obtenir la liste de toutes les pharmacies de la zone du médecin (avec stocks)
 */
async function getPharmaciesByZone(req, res) {
  const zone = req.user.profile.zone || "Analakely";

  try {
    const pharmacies = await prisma.pharmacie.findMany();

    const formatted = pharmacies.map(p => ({
      ...p,
      isLocalZone: p.zone?.toLowerCase() === zone.toLowerCase()
    }));

    return res.status(200).json({
      doctorZone: zone,
      pharmacies: formatted
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la récupération des pharmacies de la zone." });
  }
}

/**
 * Consulter l'état des stocks d'un médicament spécifique dans tout le réseau d'Antananarivo
 */
async function getStocksByMedicament(req, res) {
  const { medicamentId } = req.params;

  try {
    const stocks = await prisma.stock.findMany({
      where: {
        medicamentId,
        quantite: { gt: 0 }
      },
      include: {
        pharmacie: true,
        medicament: true
      }
    });

    return res.status(200).json(stocks);
  } catch (error) {
    console.error("Erreur de récupération de stocks:", error);
    return res.status(500).json({ error: "Erreur lors de la consultation des stocks de ce médicament." });
  }
}

/**
 * RÉDIGER ET VALIDER UNE PRESCRIPTION (ORDONNANCE ÉLECTRONIQUE)
 */
async function createOrdonnance(req, res) {
  try {
    const ordonnance = await care.prescribe(req.user.id, req.body);
    return res.status(201).json({ message: 'Ordonnance validée électroniquement.', ordonnanceCode: ordonnance.code, ordonnance });
  } catch (error) { return respondError(res, error); }
}

/**
 * Obtenir l'historique des prescriptions rédigées par le médecin connecté
 */
async function getDoctorPrescriptions(req, res) {
  try {
    const prescriptions = await prisma.ordonnance.findMany({
      where: { medecinId: req.user.id },
      orderBy: { dateEmission: 'desc' }
    });

    const populated = [];
    for (const p of prescriptions) {
      const patient = await prisma.user.findUnique({
        where: { id: p.patientId },
        include: { profile: true }
      });
      populated.push({
        ...p,
        status: p.status === 'PENDING' && expired(p) ? 'EXPIREE' : p.status,
        patientName: patient?.profile ? `${patient.profile.firstName} ${patient.profile.lastName}` : "Patient Inconnu"
      });
    }

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la récupération des prescriptions rédigées." });
  }
}

/**
 * Obtenir la liste des patients qui ont choisi CE médecin comme médecin traitant
 * à l'inscription (via le champ Profile.medecinChoisiId -> MedecinDisponible).
 */
async function getMyPatients(req, res) {
  try {
    const medecinDisponible = await prisma.medecinDisponible.findUnique({
      where: { userId: req.user.id }
    });

    if (!medecinDisponible?.actif) {
      return res.status(200).json({
        linked: false,
        message: "Votre compte n'est pas encore relié à une fiche médecin vitrine, aucun patient ne peut donc vous avoir choisi pour l'instant.",
        patients: []
      });
    }

    const profiles = await prisma.profile.findMany({
      where: { medecinChoisiId: medecinDisponible.id, role: 'PATIENT', status: 'ACTIVE' }
    });

    const patients = [];
    for (const profile of profiles) {
      const user = await prisma.user.findUnique({ where: { id: profile.userId } });
      patients.push({
        userId: profile.userId,
        email: user?.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        status: profile.status
      });
    }

    return res.status(200).json({ linked: true, medecinDisponibleId: medecinDisponible.id, patients });
  } catch (error) {
    console.error("Erreur de récupération de mes patients:", error);
    return res.status(500).json({ error: "Erreur lors du chargement de vos patients assignés." });
  }
}

module.exports = {
  searchPatient,
  getPharmaciesByZone,
  getStocksByMedicament,
  createOrdonnance,
  getDoctorPrescriptions,
  getMyPatients
};

// ... [GARDE TES ANCIENNES FONCTIONS] ...

// TACHE 4 : RENOUVELLEMENT ORDONNANCES
async function getRenewals(req, res) {
  try {
    const requests = await prisma.renewalRequest.findMany({
      where: { ordonnance: { medecinId: req.user.id, patient: { profile: { medecinChoisi: { userId: req.user.id, actif: true } } } } },
      include: { ordonnance: { include: { patient: { select: { id: true, email: true, profile: true } } } } },
      orderBy: { requestedAt: 'desc' }
    });
    return res.json(requests.map(r => ({ ...r.ordonnance, renewal: { id: r.id, status: r.status, requestedAt: r.requestedAt, decidedAt: r.decidedAt, reason: r.reason, newOrdonnanceId: r.newOrdonnanceId } })));
  } catch (error) { return respondError(res, error); }
}

async function approveRenewal(req, res) {
  try {
    const result = await care.decideRenewal(req.user.id, req.params.id, 'ACCEPTEE', null, req.body || {});
    return res.json({ message: 'Renouvellement accepté. Une nouvelle ordonnance a été émise.', ...result });
  } catch (error) { return respondError(res, error); }
}

async function rejectRenewal(req, res) {
  try {
    const result = await care.decideRenewal(req.user.id, req.params.id, 'REFUSEE', req.body?.reason);
    return res.json({ message: 'Refus enregistré et consultable par le patient.', ...result });
  } catch (error) { return respondError(res, error); }
}

// TACHE 3 : MESSAGERIE
async function getMessagesWithPatient(req, res) {
  const { patientId } = req.params;
  try {
    await care.related(patientId, req.user.id);
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: patientId },
          { senderId: patientId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
    return res.status(200).json(messages);
  } catch(e) {
    return respondError(res, e);
  }
}

async function sendMessage(req, res) {
  try {
    const msg = await care.sendMessage(req.user.id, req.body.receiverId, req.body.content, 'MEDECIN');
    return res.status(201).json(msg);
  } catch (error) { return respondError(res, error); }
}

module.exports = {
  searchPatient, getPharmaciesByZone, getStocksByMedicament, createOrdonnance, getDoctorPrescriptions, getMyPatients,
  getRenewals, approveRenewal, rejectRenewal, getMessagesWithPatient, sendMessage // <-- NOUVEAU
};
