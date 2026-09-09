const prisma = require('../prisma');
const { createCareWorkflows, respondError, expired } = require('../services/careWorkflows');
const care = createCareWorkflows(prisma);

/**
 * Rechercher et lire une ordonnance par son code unique (ex: ORD-4927)
 */
async function getOrdonnanceByCode(req, res) {
  const { code } = req.params;

  try {
    if (!code) {
      return res.status(400).json({ error: "Le code d'ordonnance est requis." });
    }

    const ordonnance = await prisma.ordonnance.findUnique({
      where: { code }, include: { commande: { select: { id: true, status: true, pharmacieId: true } } }
    });

    if (!ordonnance) {
      return res.status(404).json({ error: "Ordonnance introuvable. Veuillez vérifier le code saisi." });
    }
    if (!req.user.profile.pharmacieId || (ordonnance.pharmacieId && ordonnance.pharmacieId !== req.user.profile.pharmacieId)) {
      return res.status(403).json({ error: 'Cette ordonnance est rattachée à une autre pharmacie ou votre rattachement est manquant.' });
    }

    // Récupérer le médecin et le patient liés
    const medecin = await prisma.user.findUnique({
      where: { id: ordonnance.medecinId },
      include: { profile: true }
    });

    const patient = await prisma.user.findUnique({
      where: { id: ordonnance.patientId },
      include: { profile: true }
    });

    return res.status(200).json({
      id: ordonnance.id,
      code: ordonnance.code,
      status: expired(ordonnance) && ordonnance.status === 'PENDING' ? 'EXPIREE' : ordonnance.status,
      commande: ordonnance.commande,
      dateExpiration: ordonnance.dateExpiration,
      dateEmission: ordonnance.dateEmission,
      dateDelivrance: ordonnance.dateDelivrance,
      medicaments: ordonnance.medicaments,
      medecin: {
        firstName: medecin?.profile?.firstName,
        lastName: medecin?.profile?.lastName,
        email: medecin?.email
      },
      patient: {
        firstName: patient?.profile?.firstName,
        lastName: patient?.profile?.lastName,
        email: patient?.email
      }
    });

  } catch (error) {
    console.error("Erreur de recherche d'ordonnance:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la recherche." });
  }
}

/**
 * VALIDER ET DÉLIVRER UNE ORDONNANCE (DÉDUCTION TRANSACTIONNELLE DU STOCK)
 */
async function deliverOrdonnance(req, res) {
  try {
    const ordonnance = await care.dispense(req.user.profile.pharmacieId, req.body.ordonnanceId);
    return res.json({ message: 'Délivrance enregistrée. Stock confirmé sans double débit.', ordonnanceStatus: ordonnance.status, ordonnance });
  } catch (error) { return respondError(res, error); }
}

/**
 * Obtenir l'état de stock actuel de la pharmacie du pharmacien connecté
 */
async function getMyPharmacyStocks(req, res) {
  const pharmacieId = req.user.profile.pharmacieId;

  try {
    if (!pharmacieId) {
      return res.status(400).json({ error: "Aucune pharmacie rattachée à votre profil." });
    }

    const stocks = await prisma.stock.findMany({
      where: { pharmacieId },
      include: { medicament: true }
    });

    return res.status(200).json(stocks);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du chargement des stocks de votre pharmacie." });
  }
}

/**
 * REAPPROVISIONNER / METTRE À JOUR LE STOCK D'UN MÉDICAMENT DANS SON OFFICINE
 */
async function updateStock(req, res) {
  const { medicamentId, quantiteAjoutee, motif = 'reception' } = req.body;
  const pharmacieId = req.user.profile.pharmacieId;

  try {
    if (!pharmacieId) {
      return res.status(400).json({ error: "Aucune pharmacie rattachée à votre profil." });
    }

    const motifsAutorises = ['reception', 'correction', 'perte', 'peremption'];
    if (!medicamentId || quantiteAjoutee === undefined || !Number.isInteger(quantiteAjoutee) || quantiteAjoutee <= 0 || !motifsAutorises.includes(motif)) {
      return res.status(400).json({ error: "Veuillez spécifier un médicament et une quantité valide à ajouter." });
    }

    // Trouver le stock existant
    const stock = await prisma.stock.findFirst({
      where: { pharmacieId, medicamentId }
    });

    let updatedStock;
    if (stock) {
      updatedStock = await prisma.stock.update({
        where: { id: stock.id },
        data: { quantite: { increment: quantiteAjoutee } }
      });
    } else {
      // Si la ligne n'existait pas, la créer
      updatedStock = await prisma.stock.create({
        data: {
          pharmacieId,
          medicamentId,
          quantite: quantiteAjoutee
        }
      });
    }

    return res.status(200).json({
      message: "Réapprovisionnement enregistré ! Le stock de l'officine a été incrémenté avec succès.",
      stock: updatedStock
    });

  } catch (error) {
    console.error("Erreur de mise à jour du stock:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la mise à jour de l'inventaire." });
  }
}

/**
 * RÉCUPÉRER TOUTES LES COMMANDES CONCERNANT L'OFFICINE DU PHARMACIEN
 */
async function getMyPharmacyCommandes(req, res) {
  const pharmacieId = req.user.profile.pharmacieId;

  try {
    if (!pharmacieId) {
      return res.status(400).json({ error: "Aucune pharmacie rattachée à votre profil." });
    }

    const commandes = await prisma.commande.findMany({
      where: {
        pharmacieId,
        status: { not: "EN_ATTENTE_DE_PAIEMENT" } // Exclure les sessions de paiement en cours non validées
      },
      include: {
        ordonnance: { select: { code: true, status: true, dateDelivrance: true } },
        patient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                zone: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = Date.now();
    await Promise.all(commandes.map(async commande => {
      if (commande.ordonnanceId && commande.ordonnance?.status !== 'DELIVREE') return;
      const start = Math.max(new Date(commande.paidAt || commande.createdAt).getTime(), new Date(commande.ordonnance?.dateDelivrance || 0).getTime());
      const elapsedSeconds = (now - start) / 1000;
      const nextStatus = elapsedSeconds >= 600 ? 'LIVREE' : elapsedSeconds >= 180 && commande.status === 'PAYEE' ? 'EN_ROUTE' : commande.status;
      if (nextStatus !== commande.status && ['PAYEE', 'EN_ROUTE'].includes(commande.status)) {
        await prisma.commande.updateMany({ where: { id: commande.id, status: commande.status }, data: { status: nextStatus } });
        commande.status = (await prisma.commande.findUnique({ where: { id: commande.id } })).status;
      }
    }));

    return res.status(200).json(commandes);
  } catch (error) {
    console.error("Erreur getMyPharmacyCommandes :", error);
    return res.status(500).json({ error: "Erreur lors du chargement des commandes de la pharmacie." });
  }
}

/**
 * METTRE À JOUR LE STATUT DE LIVRAISON / TRAITEMENT D'UNE COMMANDE (ex: PAYEE -> EN_ROUTE -> LIVREE)
 */
async function updateCommandeStatus(req, res) {
  try {
    const pharmacieId = req.user.profile.pharmacieId;
    const transitions = { RESERVEE: ['PAYEE'], PAYEE: ['EN_ROUTE'], EN_ROUTE: ['LIVREE'] };
    const updated = await care.transaction(async tx => {
      const cmd = await tx.commande.findUnique({ where: { id: req.params.id }, include: { ordonnance: true } });
      if (!pharmacieId || !cmd || cmd.pharmacieId !== pharmacieId) {
        const error = new Error('Commande extérieure à votre pharmacie.'); error.status = 403; throw error;
      }
      if (!transitions[cmd.status]?.includes(req.body.status)) {
        const error = new Error('Transition de commande impossible.'); error.status = 409; throw error;
      }
      if (req.body.status === 'PAYEE' && !cmd.stockReserved) {
        const error = new Error('Rapprochez le stock de cette ancienne commande avant paiement.'); error.status = 409; throw error;
      }
      if (req.body.status === 'EN_ROUTE' && cmd.ordonnanceId && cmd.ordonnance?.status !== 'DELIVREE') {
        const error = new Error('Validez la délivrance de l’ordonnance avant l’expédition.'); error.status = 409; throw error;
      }
      return tx.commande.update({ where: { id: cmd.id }, data: { status: req.body.status, ...(req.body.status === 'PAYEE' ? { paidAt: new Date() } : {}) } });
    });
    return res.json({ message: 'Statut enregistré.', commande: updated });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    return respondError(res, error);
  }
}

module.exports = {
  getOrdonnanceByCode,
  deliverOrdonnance,
  getMyPharmacyStocks,
  updateStock,
  getMyPharmacyCommandes,
  updateCommandeStatus
};
