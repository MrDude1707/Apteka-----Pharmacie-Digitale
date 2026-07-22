const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const medecinRoutes = require('./routes/medecinRoutes');
const pharmacienRoutes = require('./routes/pharmacienRoutes');
const patientRoutes = require('./routes/patientRoutes');
const prisma = require('./prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// Configurer les middlewares globaux
app.use(cors());
app.use(express.json());

// Message de bienvenue & statut de l'API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "online",
    message: "API de Pharmacie Numérique & Prescription d'Antananarivo en ligne 🟢",
    timestamp: new Date()
  });
});

// Route publique : récupérer toutes les pharmacies pour l'inscription des pharmaciens
app.get('/api/public/pharmacies', async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacie.findMany({
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(pharmacies);
  } catch (error) {
    console.error("Erreur de récupération des pharmacies publiques:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des pharmacies." });
  }
});

// Route publique : récupérer tous les médicaments pour consultation générale
app.get('/api/public/medicaments', async (req, res) => {
  try {
    const medicaments = await prisma.medicament.findMany({
      orderBy: { nom: 'asc' }
    });
    return res.status(200).json(medicaments);
  } catch (error) {
    console.error("Erreur de récupération des médicaments publics:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des médicaments." });
  }
});

// Monter les modules de routage
app.use('/api/auth', authRoutes);
app.use('/api/medecin', medecinRoutes);
app.use('/api/pharmacien', pharmacienRoutes);
app.use('/api/patient', patientRoutes);

// Middleware de gestion d'erreur global
app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err.stack);
  res.status(500).json({ error: "Une erreur inattendue est survenue sur le serveur." });
});

// Démarrer le serveur backend
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🚀 SERVEUR BACKEND DÉMARRÉ sur le port ${PORT}`);
  console.log(`🔗 API de santé locale : http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
