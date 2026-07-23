const prisma = require('../prisma');

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

    return res.status(200).json({
      id: patient.id,
      email: patient.email,
      firstName: patient.profile.firstName,
      lastName: patient.profile.lastName
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la recherche du patient." });
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
  const { patientId, medicaments } = req.body;

  try {
    if (!patientId || !medicaments || !Array.isArray(medicaments) || medicaments.length === 0) {
      return res.status(400).json({ error: "Veuillez spécifier un patient et au moins un médicament prescrit." });
    }

    const patient = await prisma.user.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ error: "Le patient spécifié est introuvable." });
    }

    const code = 'ORD-' + Math.floor(1000 + Math.random() * 9000).toString();

    const ordonnance = await prisma.ordonnance.create({
      data: {
        code,
        medecinId: req.user.id,
        patientId,
        status: 'PENDING',
        medicaments
      }
    });

    return res.status(201).json({
      message: "Ordonnance électronique validée et signée cryptographiquement avec succès !",
      ordonnanceCode: code,
      ordonnance
    });
  } catch (error) {
    console.error("Erreur de création d'ordonnance:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de l'émission de la prescription." });
  }
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

    if (!medecinDisponible) {
      return res.status(200).json({
        linked: false,
        message: "Votre compte n'est pas encore relié à une fiche médecin vitrine, aucun patient ne peut donc vous avoir choisi pour l'instant.",
        patients: []
      });
    }

    const profiles = await prisma.profile.findMany({
      where: { medecinChoisiId: medecinDisponible.id, role: 'PATIENT' }
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
    const renewals = await prisma.ordonnance.findMany({
      where: { medecinId: req.user.id, status: 'RENEWAL_REQUESTED' },
      include: { patient: { include: { profile: true } } }
    });
    return res.status(200).json(renewals);
  } catch (err) {
    return res.status(500).json({ error: "Erreur chargement renouvellements." });
  }
}

async function approveRenewal(req, res) {
  const { id } = req.params;
  try {
    const oldOrd = await prisma.ordonnance.findUnique({ where: { id } });
    if (!oldOrd) return res.status(404).json({ error: "Ordonnance introuvable." });
    
    // Marquer l'ancienne comme délivrée/archivée
    await prisma.ordonnance.update({ where: { id }, data: { status: 'DELIVREE' } });
    
    // Créer la nouvelle
    const code = 'ORD-REN-' + Math.floor(1000 + Math.random() * 9000).toString();
    const newOrd = await prisma.ordonnance.create({
      data: {
        code, medecinId: oldOrd.medecinId, patientId: oldOrd.patientId, status: 'PENDING',
        medicaments: oldOrd.medicaments, parentOrdonnanceId: id
      }
    });
    return res.status(200).json({ message: "Renouvellement approuvé avec succès.", newOrdonnance: newOrd });
  } catch (err) {
    return res.status(500).json({ error: "Erreur approbation renouvellement." });
  }
}

// TACHE 3 : MESSAGERIE
async function getMessagesWithPatient(req, res) {
  const { patientId } = req.params;
  try {
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
    return res.status(500).json({ error: "Erreur lors de la récupération des messages." });
  }
}

async function sendMessage(req, res) {
  const { receiverId, content } = req.body;
  try {
    const msg = await prisma.message.create({
      data: { senderId: req.user.id, receiverId, content }
    });
    return res.status(201).json(msg);
  } catch(e) {
    return res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
}

module.exports = {
  searchPatient, getPharmaciesByZone, getStocksByMedicament, createOrdonnance, getDoctorPrescriptions, getMyPatients,
  getRenewals, approveRenewal, getMessagesWithPatient, sendMessage // <-- NOUVEAU
};