const prisma = require('../prisma');

async function searchMedicamentAndStocks(req, res) {
  const { query } = req.query;
  try {
    if (!query || query.trim() === '') return res.status(400).json({ error: "Recherche vide." });
    const searchLower = query.toLowerCase();
    const medicaments = await prisma.medicament.findMany();
    const matchingMeds = medicaments.filter(m => m.nom.toLowerCase().includes(searchLower) || (m.substanceActive && m.substanceActive.toLowerCase().includes(searchLower)));
    
    if (matchingMeds.length === 0) return res.status(200).json({ medicaments: [], stocks: [], message: "Aucun médicament correspondant trouvé." });

    const matchingMedIds = matchingMeds.map(m => m.id);
    const stocks = await prisma.stock.findMany({
      where: { medicamentId: { in: matchingMedIds }, quantite: { gt: 0 } },
      include: { pharmacie: true, medicament: true }
    });
    return res.status(200).json({ medicaments: matchingMeds, stocks: stocks });
  } catch (error) {
    return res.status(500).json({ error: "Une erreur est survenue lors de la recherche." });
  }
}

// TACHE 9 : AUTOCOMPLETION
async function getAutocomplete(req, res) {
  const { q } = req.query;
  try {
    if (!q || q.length < 2) return res.status(200).json([]);
    const meds = await prisma.medicament.findMany({
      where: { nom: { contains: q, mode: 'insensitive' } },
      take: 5
    });
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
    const ord = await prisma.ordonnance.update({
      where: { id },
      data: { renouvellementDemande: true, status: 'RENEWAL_REQUESTED' }
    });
    return res.status(200).json({ message: "Demande envoyée avec succès.", ordonnance: ord });
  } catch(e) {
    return res.status(500).json({ error: "Erreur demande renouvellement." });
  }
}

// TACHE 5 : COMMANDE / CHECKOUT FAKE
async function createCommande(req, res) {
  const { pharmacieId, items, total } = req.body;
  try {
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

module.exports = { searchMedicamentAndStocks, getAutocomplete, getMyPrescriptions, requestRenewal, createCommande, getMessages, sendMessage };