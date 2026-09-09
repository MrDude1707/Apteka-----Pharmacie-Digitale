const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

let prisma;
let isFallback = false;

const hasDb = process.env.DATABASE_URL && process.env.DATABASE_URL !== "MY_DATABASE_URL" && !process.env.DATABASE_URL.includes("[PASSWORD]");

if (hasDb) {
  try {
    prisma = new PrismaClient();
    console.log("Prisma Client connecté à la base de données PostgreSQL (Supabase).");
  } catch (error) {
    console.error("Erreur d'initialisation de Prisma Client, bascule en mode Démo simulé:", error.message);
    if (process.env.NODE_ENV === 'production') throw error;
    isFallback = true;
  }
} else {
  if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL requise en production.');
  console.warn("⚠️ DATABASE_URL non configurée. Mode DEMO activé.");
  isFallback = true;
}

let mockUsers = [], mockProfiles = [], mockOtps = [], mockOrdonnances = [], mockMessages = [], mockCommandes = [], mockMedecinsDispos = [];

const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pharmacies.json'), 'utf-8'));
const medicamentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicaments.json'), 'utf-8'));

const mockMedicaments = medicamentsData.map((med, idx) => ({
  id: `med-${idx + 1}`, cis: med.cis, nom: med.nom, forme: med.forme, presentation: med.presentation || "",
  prix: med.prix_euros ? Math.round((Number(med.prix_euros.replace(',', '.')) * 4951.08) / 100) * 100 : 10000, currency: 'MGA', tauxRemboursement: med.taux_remboursement || "30%",
  substanceActive: med.substances_actives?.[0]?.substance || "Aucune", categorie: med.categorie || "Général", isPopular: med.isPopular || false,
  isActive: true, requiresPrescription: true, classificationReviewed: false
}));

const mockPharmacies = pharmaciesData.map(p => ({
  id: p.id, name: p.name, latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude), phone: p.phone, zone: p.zone
}));

const mockStocks = [];
mockPharmacies.forEach(p => {
  mockMedicaments.forEach(m => {
    mockStocks.push({ id: `stock-${p.id}-${m.id}`, pharmacieId: p.id, medicamentId: m.id, quantite: Math.floor(Math.random() * 131) + 20 });
  });
});

const bcrypt = require('bcryptjs');
const defaultHashedPassword = bcrypt.hashSync('password123', 10);

mockUsers.push(
  { id: 'usr-admin', email: 'admin@pharma.mg', password: defaultHashedPassword },
  { id: 'usr-doctor', email: 'dr.razafy@pharma.mg', password: defaultHashedPassword },
  { id: 'usr-pharma', email: 'pharmacien.analakely@pharma.mg', password: defaultHashedPassword },
  { id: 'usr-patient', email: 'patient@example.com', password: defaultHashedPassword }
);

mockProfiles.push(
  { id: 'prof-admin', userId: 'usr-admin', firstName: 'Admin', lastName: 'Prescribe', role: 'ADMINISTRATEUR', status: 'ACTIVE' },
  { id: 'prof-doctor', userId: 'usr-doctor', firstName: 'Jean', lastName: 'Razafy', role: 'MEDECIN', status: 'ACTIVE', zone: 'Analakely', phone: '+261 34 11 234 56' },
  { id: 'prof-pharma', userId: 'usr-pharma', firstName: 'Nirina', lastName: 'Rabe', role: 'PHARMACIEN', status: 'ACTIVE', pharmacieId: '4' },
  { id: 'prof-patient', userId: 'usr-patient', firstName: 'Toky', lastName: 'Randria', role: 'PATIENT', status: 'ACTIVE', wantsMedecin: true, medecinChoisiId: 'vitrine-1' }
);

mockMedecinsDispos.push(
  { id: 'vitrine-1', nom: 'Dr. Jean Razafy', specialite: 'Médecine générale', photoUrl: '/images/medecins/medecin-1.jpg', userId: 'usr-doctor', actif: true },
  { id: 'vitrine-2', nom: 'Dr. Voahangy Rakoto', specialite: 'Pédiatrie' }
);

const { createMemoryPrisma } = require('./memoryPrisma');
module.exports = isFallback ? createMemoryPrisma({
  user: mockUsers, profile: mockProfiles, medecinDisponible: mockMedecinsDispos,
  pharmacie: mockPharmacies, medicament: mockMedicaments, stock: mockStocks,
  ordonnance: mockOrdonnances, commande: mockCommandes, message: mockMessages, otpCode: mockOtps
}) : prisma;
