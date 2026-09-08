const prisma = require('../prisma');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51PxX77Rx7kXy7X7X7Xx7_placeholder');

function validateOrderItems(pharmacieId, items) {
  return Array.isArray(items)
    && items.length > 0
    && items.every(item => item && item.pharmacieId === pharmacieId && Number(item.qty || 1) > 0);
}

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
  const medicaments = await prisma.medicament.findMany({ orderBy: { nom: 'asc' }, take: 500 });
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
      orderBy: { dateEmission: 'desc' }
    });
    const populated = [];
    for (const p of prescriptions) {
      const medecin = await prisma.user.findUnique({ where: { id: p.medecinId }, include: { profile: true, medecinDisponible: true } });
      populated.push({ 
        ...p, 
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

async function requestRenewal(req, res) {
  const { id } = req.params;
  try {
    const existing = await prisma.ordonnance.findFirst({
      where: { id, patientId: req.user.id, status: { in: ['PENDING', 'DELIVREE'] }, renouvellementDemande: false }
    });
    if (!existing) return res.status(409).json({ error: "Cette ordonnance ne peut pas être renouvelée pour le moment." });
    const ord = await prisma.ordonnance.update({ where: { id }, data: { renouvellementDemande: true, status: 'RENEWAL_REQUESTED' } });
    return res.status(200).json({ message: "Demande envoyée avec succès.", ordonnance: ord });
  } catch(e) {
    return res.status(500).json({ error: "Erreur demande renouvellement." });
  }
}

// TACHE 5 : COMMANDE / CHECKOUT FAKE
async function createCommande(req, res) {
  const { pharmacieId, items, total } = req.body;
  try {
    if (!validateOrderItems(pharmacieId, items)) {
      return res.status(400).json({ error: "Tous les articles doivent provenir de la même pharmacie." });
    }

    const commande = await prisma.commande.create({
      data: { patientId: req.user.id, pharmacieId, total, items, status: "PAYEE" }
    });
    return res.status(201).json({ message: "Paiement validé avec succès (Simulation).", commande });
  } catch(e) {
    return res.status(500).json({ error: "Erreur lors du paiement." });
  }
}

// TACHE 3 : MESSAGERIE
async function getMessages(req, res) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id }, include: { medecinChoisi: true } });
    if (!profile || !profile.medecinChoisi || !profile.medecinChoisi.userId) return res.status(200).json({ doctorId: null, messages: [] });
    
    const medecinUserId = profile.medecinChoisi.userId;
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
    return res.status(500).json({ error: "Erreur messages." });
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
    return res.status(500).json({ error: "Erreur envoi message." });
  }
}

// STRIPE CHECKOUT & ORDER DELIVERY TRACKING
async function createCheckoutSession(req, res) {
  const { pharmacieId, items, total, frontendUrl: customFrontendUrl } = req.body;
  try {
    if (!pharmacieId || !validateOrderItems(pharmacieId, items)) {
      return res.status(400).json({ error: "Panier vide ou articles provenant de plusieurs pharmacies." });
    }

    // 1. Créer la commande en base avec le statut EN_ATTENTE_DE_PAIEMENT
    const commande = await prisma.commande.create({
      data: {
        patientId: req.user.id,
        pharmacieId,
        total: parseFloat(total),
        items: items, // Stockage complet au format JSON
        status: "EN_ATTENTE_DE_PAIEMENT"
      }
    });

    const frontendUrl = customFrontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

    // 2. Tenter de créer une session Stripe réelle
    try {
      const lineItems = items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.medicament.nom,
            description: `Officine de retrait : ${item.pharmacie.name}`,
          },
          unit_amount: Math.round((item.medicament.prix || 0) * 100), // En centimes
        },
        quantity: item.qty || 1,
      }));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${frontendUrl}/?payment=success&commande_id=${commande.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/?payment=cancel&commande_id=${commande.id}`,
        metadata: {
          commandeId: commande.id,
          patientId: req.user.id,
        }
      });

      return res.status(200).json({ url: session.url, sessionId: session.id });
    } catch (stripeError) {
      if (process.env.NODE_ENV === 'production') {
        console.error("Stripe indisponible en production :", stripeError.message);
        return res.status(502).json({ error: "Le paiement est temporairement indisponible." });
      }

      console.warn("⚠️ Stripe secret key non configurée ou incorrecte. Simulation active. Erreur :", stripeError.message);
      
      // Simulation locale ultra-fluide si Stripe n'est pas configuré en dev
      const mockSessionUrl = `${frontendUrl}/?payment=success&commande_id=${commande.id}&session_id=mock_session_${Date.now()}`;
      return res.status(200).json({ url: mockSessionUrl, sessionId: `mock_${Date.now()}`, isMock: true });
    }
  } catch (error) {
    console.error("Erreur lors de la création de la session de paiement :", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de l'initialisation du paiement." });
  }
}

async function verifyCheckoutSession(req, res) {
  const { commandeId, sessionId } = req.body;
  try {
    if (!commandeId || !sessionId) {
      return res.status(400).json({ error: "Paramètres manquants pour la vérification." });
    }

    // Récupérer la commande
    const commande = await prisma.commande.findUnique({
      where: { id: commandeId }
    });

    if (!commande) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    if (commande.patientId !== req.user.id) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à vérifier cette commande." });
    }

    // Si elle est déjà payée, pas besoin de refaire l'opération
    if (commande.status !== "EN_ATTENTE_DE_PAIEMENT") {
      return res.status(200).json({ message: "Paiement déjà enregistré avec succès.", commande });
    }

    let isPaid = false;
    if (sessionId.startsWith('mock_') && process.env.NODE_ENV !== 'production') {
      isPaid = true;
    } else {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === 'paid') {
          isPaid = true;
        }
      } catch (stripeVerifyErr) {
        console.error("Erreur d'authentification Stripe lors de la vérification :", stripeVerifyErr.message);
        return res.status(502).json({ error: "Le paiement n'a pas pu être vérifié auprès de Stripe." });
      }
    }

    if (isPaid) {
      // Déduire les stocks de la pharmacie concernée pour chaque produit
      let items;
      try {
        items = typeof commande.items === 'string' ? JSON.parse(commande.items) : commande.items;
      } catch (parseError) {
        console.error("Erreur de parsing des articles de la commande:", parseError);
        return res.status(500).json({ error: "Les données des articles associés à cette commande sont corrompues ou invalides." });
      }
      const txOperations = [];

      for (const item of items) {
        // Chercher la ligne de stock correspondante dans cette pharmacie
        const stock = await prisma.stock.findFirst({
          where: {
            pharmacieId: commande.pharmacieId,
            medicamentId: item.medicamentId
          }
        });

        if (stock) {
          const newQty = Math.max(0, stock.quantite - (item.qty || 1));
          txOperations.push(
            prisma.stock.update({
              where: { id: stock.id },
              data: { quantite: newQty }
            })
          );
        }
      }

      // Mettre à jour le statut de la commande à "PAYEE" (qui équivaut à "En cours de préparation")
      txOperations.push(
        prisma.commande.update({
          where: { id: commandeId },
          data: { status: "PAYEE" }
        })
      );

      // Exécuter l'ensemble des débits de stock et l'update de statut de manière transactionnelle
      await prisma.$transaction(txOperations);

      return res.status(200).json({ message: "Paiement validé et stocks mis à jour avec succès !", commande: { ...commande, status: "PAYEE" } });
    } else {
      return res.status(400).json({ error: "Le paiement Stripe n'a pas été validé." });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement :", error);
    return res.status(500).json({ error: "Erreur lors de la validation finale de votre commande." });
  }
}

async function getMyCommandes(req, res) {
  try {
    const commandes = await prisma.commande.findMany({
      where: { patientId: req.user.id },
      include: { pharmacie: true },
      orderBy: { createdAt: 'desc' }
    });
    const now = Date.now();
    const updatedCommandes = await Promise.all(commandes.map(async commande => {
      const elapsedSeconds = (now - new Date(commande.createdAt).getTime()) / 1000;
      const nextStatus = elapsedSeconds >= 600 ? 'LIVREE' : elapsedSeconds >= 180 && commande.status === 'PAYEE' ? 'EN_ROUTE' : commande.status;
      if (nextStatus !== commande.status && ['PAYEE', 'EN_ROUTE'].includes(commande.status)) {
        return prisma.commande.update({ where: { id: commande.id }, data: { status: nextStatus }, include: { pharmacie: true } });
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
  createCommande,
  getMessages,
  sendMessage,
  createCheckoutSession,
  verifyCheckoutSession,
  getMyCommandes
};