const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const medecinRoutes = require('./src/routes/medecinRoutes');
const pharmacienRoutes = require('./src/routes/pharmacienRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const prisma = require('./src/prisma');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const allowedOrigins = (process.env.APP_URL)
  ? process.env.APP_URL.split(',').map(o => o.trim()).filter(Boolean)
  : true;

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: "online",
    message: "API Pharmasyst Tana — Serveur backend 🟢",
    timestamp: new Date()
  });
});

app.get('/api/public/pharmacies', async (req, res) => {
  try {
    const pharmacies = await prisma.pharmacie.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json(pharmacies);
  } catch (error) {
    console.error("Erreur de récupération des pharmacies publiques:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des pharmacies." });
  }
});

app.get('/api/public/medicaments', async (req, res) => {
  try {
    const medicaments = await prisma.medicament.findMany({ orderBy: { nom: 'asc' } });
    return res.status(200).json(medicaments);
  } catch (error) {
    console.error("Erreur de récupération des médicaments publics:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des médicaments." });
  }
});

app.get('/api/public/medecins-disponibles', async (req, res) => {
  try {
    const medecins = await prisma.medecinDisponible.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' }
    });
    return res.status(200).json(medecins);
  } catch (error) {
    console.error("Erreur de récupération des médecins disponibles:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des médecins." });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/medecin', medecinRoutes);
app.use('/api/pharmacien', pharmacienRoutes);
app.use('/api/patient', patientRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route API introuvable." });
});

app.use((err, req, res, next) => {
  console.error("Erreur détectée sur le serveur backend :", err.stack);
  res.status(500).json({ error: "Une erreur inattendue est survenue sur le serveur." });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🚀 API BACKEND démarrée sur le port ${PORT}`);
  console.log(`🔗 Accès local : http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS autorisé pour : ${allowedOrigins === true ? 'toutes origines' : allowedOrigins.join(', ')}`);
  console.log(`=================================================`);
});