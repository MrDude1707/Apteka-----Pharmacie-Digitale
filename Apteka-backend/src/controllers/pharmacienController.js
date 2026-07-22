const prisma = require('../prisma');

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
      where: { code }
    });

    if (!ordonnance) {
      return res.status(404).json({ error: "Ordonnance introuvable. Veuillez vérifier le code saisi." });
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
      status: ordonnance.status,
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
  const { ordonnanceId } = req.body;
  const pharmacieId = req.user.profile.pharmacieId; // Pharmacie associée au compte du pharmacien connecté

  try {
    if (!pharmacieId) {
      return res.status(400).json({ error: "Vous n'êtes actuellement rattaché à aucune pharmacie officielle d'Antananarivo." });
    }

    // Récupérer l'ordonnance
    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id: ordonnanceId }
    });

    if (!ordonnance) {
      return res.status(404).json({ error: "Ordonnance introuvable." });
    }

    if (ordonnance.status === 'DELIVREE') {
      return res.status(400).json({ error: "Cette ordonnance a déjà été entièrement délivrée." });
    }

    const prescritMedicaments = typeof ordonnance.medicaments === 'string' 
      ? JSON.parse(ordonnance.medicaments) 
      : ordonnance.medicaments;

    // Étape 1 : Vérifier la disponibilité de TOUS les stocks dans la pharmacie du pharmacien
    const stocksToUpdate = [];
    const missingStockItems = [];

    for (const item of prescritMedicaments) {
      // Trouver la ligne de stock correspondante
      const stock = await prisma.stock.findFirst({
        where: {
          pharmacieId: pharmacieId,
          medicamentId: item.medicamentId
        },
        include: { medicament: true }
      });

      if (!stock || stock.quantite < item.quantite) {
        const available = stock ? stock.quantite : 0;
        const medName = stock ? stock.medicament.nom : (item.nom || "Médicament inconnu");
        missingStockItems.push({
          medicamentId: item.medicamentId,
          nom: medName,
          requis: item.quantite,
          disponible: available
        });
      } else {
        stocksToUpdate.push({
          stockId: stock.id,
          medicamentId: item.medicamentId,
          nouveauStock: stock.quantite - item.quantite,
          quantitePrescrite: item.quantite
        });
      }
    }

    // S'il y a des ruptures de stock, annuler l'opération globale
    if (missingStockItems.length > 0) {
      return res.status(400).json({
        error: "Impossible de délivrer l'ordonnance : stock insuffisant pour certains produits dans votre officine.",
        details: missingStockItems
      });
    }

    // Étape 2 : Exécuter la transaction Prisma de déduction des stocks et de marquage de l'ordonnance
    const txOperations = [];

    // Déduire chaque stock
    stocksToUpdate.forEach(item => {
      txOperations.push(
        prisma.stock.update({
          where: { id: item.stockId },
          data: { quantite: item.nouveauStock }
        })
      );
    });

    // Marquer l'ordonnance comme délivrée
    txOperations.push(
      prisma.ordonnance.update({
        where: { id: ordonnanceId },
        data: {
          status: 'DELIVREE',
          dateDelivrance: new Date(),
          pharmacieId: pharmacieId
        }
      })
    );

    // Lancer la transaction atomique (si l'une échoue, tout échoue)
    await prisma.$transaction(txOperations);

    return res.status(200).json({
      message: "Ordonnance délivrée avec succès ! Les stocks de votre pharmacie ont été débités en temps réel de manière transactionnelle.",
      ordonnanceStatus: "DELIVREE"
    });

  } catch (error) {
    console.error("Erreur lors de la transaction de délivrance:", error);
    return res.status(500).json({ error: "Une erreur critique est survenue lors de la délivrance et de la déduction des stocks." });
  }
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
  const { medicamentId, quantiteAjoutee } = req.body;
  const pharmacieId = req.user.profile.pharmacieId;

  try {
    if (!pharmacieId) {
      return res.status(400).json({ error: "Aucune pharmacie rattachée à votre profil." });
    }

    if (!medicamentId || quantiteAjoutee === undefined || typeof quantiteAjoutee !== 'number' || quantiteAjoutee <= 0) {
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
        data: { quantite: stock.quantite + quantiteAjoutee }
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

module.exports = {
  getOrdonnanceByCode,
  deliverOrdonnance,
  getMyPharmacyStocks,
  updateStock
};
