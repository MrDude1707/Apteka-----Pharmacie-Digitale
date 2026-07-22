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
    isFallback = true;
  }
} else {
  console.warn("⚠️ DATABASE_URL non configurée. Mode DEMO activé.");
  isFallback = true;
}

let mockUsers = [], mockProfiles = [], mockOtps = [], mockOrdonnances = [], mockMessages = [], mockCommandes = [], mockMedecinsDispos = [];

const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pharmacies.json'), 'utf-8'));
const medicamentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicaments.json'), 'utf-8'));

const mockMedicaments = medicamentsData.map((med, idx) => ({
  id: `med-${idx + 1}`, cis: med.cis, nom: med.nom, forme: med.forme, presentation: med.presentation || "",
  prix: med.prix_euros ? parseFloat(med.prix_euros.replace(',', '.')) : 5.5, tauxRemboursement: med.taux_remboursement || "30%",
  substanceActive: med.substances_actives?.[0]?.substance || "Aucune", categorie: med.categorie || "Général", isPopular: med.isPopular || false
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
  { id: 'vitrine-1', nom: 'Dr. Jean Razafy', specialite: 'Médecine générale', photoUrl: '/images/medecins/medecin-1.jpg', userId: 'usr-doctor' },
  { id: 'vitrine-2', nom: 'Dr. Voahangy Rakoto', specialite: 'Pédiatrie' }
);

const fallbackClient = {
  isFallback: true,
  user: {
    findUnique: async ({ where }) => {
      const u = mockUsers.find(user => user.email === where.email || user.id === where.id);
      if (!u) return null;
      return { ...u, profile: mockProfiles.find(p => p.userId === u.id) };
    },
    findMany: async ({ where }) => {
      let res = mockUsers;
      if (where && where.profile && where.profile.role) {
        const matchingProfiles = mockProfiles.filter(p => p.role === where.profile.role);
        res = mockUsers.filter(u => matchingProfiles.some(p => p.userId === u.id));
      }
      return res.map(u => ({ ...u, profile: mockProfiles.find(p => p.userId === u.id) }));
    },
    create: async ({ data }) => {
      const newUser = { id: data.id || `usr-${Date.now()}`, email: data.email, password: data.password, createdAt: new Date() };
      mockUsers.push(newUser);
      if (data.profile?.create) mockProfiles.push({ id: `prof-${Date.now()}`, userId: newUser.id, ...data.profile.create });
      return { ...newUser, profile: mockProfiles.find(p => p.userId === newUser.id) };
    },
    update: async ({ where, data }) => {
      const idx = mockUsers.findIndex(u => u.id === where.id);
      if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...data };
      return mockUsers[idx];
    }
  },
  profile: {
    findUnique: async ({ where }) => mockProfiles.find(p => p.userId === where.userId),
    findMany: async ({ where }) => mockProfiles.filter(p => (!where?.role || p.role === where.role) && (!where?.status || p.status === where.status) && (!where?.medecinChoisiId || p.medecinChoisiId === where.medecinChoisiId)),
    update: async ({ where, data }) => {
      const idx = mockProfiles.findIndex(p => p.id === where.id || p.userId === where.userId);
      if (idx !== -1) mockProfiles[idx] = { ...mockProfiles[idx], ...data };
      return mockProfiles[idx];
    }
  },
  medecinDisponible: {
    findMany: async () => mockMedecinsDispos.map(md => ({...md, user: mockUsers.find(u=>u.id === md.userId)})),
    findUnique: async ({ where }) => mockMedecinsDispos.find(m => m.id === where.id || m.userId === where.userId),
    update: async ({ where, data }) => {
      const idx = mockMedecinsDispos.findIndex(m => m.id === where.id);
      if (idx !== -1) mockMedecinsDispos[idx] = { ...mockMedecinsDispos[idx], ...data };
      return mockMedecinsDispos[idx];
    }
  },
  pharmacie: {
    findMany: async () => mockPharmacies,
    findUnique: async ({ where }) => mockPharmacies.find(p => p.id === where.id)
  },
  medicament: {
    findMany: async ({ where, take }) => {
      let res = mockMedicaments;
      if (where?.nom?.contains) res = res.filter(m => m.nom.toLowerCase().includes(where.nom.contains.toLowerCase()));
      if (take) res = res.slice(0, take);
      return res;
    },
    findUnique: async ({ where }) => mockMedicaments.find(m => m.id === where.id || m.cis === where.cis)
  },
  stock: {
    findMany: async ({ where, include }) => {
      let results = mockStocks.filter(s => (!where?.medicamentId || s.medicamentId === where.medicamentId) && (!where?.pharmacieId || s.pharmacieId === where.pharmacieId) && (!where?.quantite?.gt || s.quantite > 0));
      return results.map(s => ({ ...s, pharmacie: mockPharmacies.find(p => p.id === s.pharmacieId), medicament: mockMedicaments.find(m => m.id === s.medicamentId) }));
    },
    update: async ({ where, data }) => {
      const idx = mockStocks.findIndex(s => s.id === where.id);
      if (idx !== -1) {
        if (data.quantite?.decrement) mockStocks[idx].quantite = Math.max(0, mockStocks[idx].quantite - data.quantite.decrement);
        else mockStocks[idx].quantite = data.quantite;
        return mockStocks[idx];
      }
    }
  },
  ordonnance: {
    create: async ({ data }) => {
      const newOrd = { id: `ord-${Date.now()}`, ...data, dateEmission: new Date() };
      mockOrdonnances.push(newOrd);
      return newOrd;
    },
    findUnique: async ({ where }) => {
      const ord = mockOrdonnances.find(o => o.id === where.id || o.code === where.code);
      if(!ord) return null;
      return {...ord, medecin: mockUsers.find(u=>u.id===ord.medecinId), patient: mockUsers.find(u=>u.id===ord.patientId)};
    },
    findMany: async ({ where }) => mockOrdonnances.filter(o => (!where?.patientId || o.patientId === where.patientId) && (!where?.medecinId || o.medecinId === where.medecinId) && (!where?.status || o.status === where.status)),
    update: async ({ where, data }) => {
      const idx = mockOrdonnances.findIndex(o => o.id === where.id);
      if (idx !== -1) mockOrdonnances[idx] = { ...mockOrdonnances[idx], ...data };
      return mockOrdonnances[idx];
    }
  },
  message: {
    findMany: async ({ where }) => mockMessages.filter(m => 
      (m.senderId === where.OR[0].senderId && m.receiverId === where.OR[0].receiverId) ||
      (m.senderId === where.OR[1].senderId && m.receiverId === where.OR[1].receiverId)
    ).sort((a,b) => a.createdAt - b.createdAt),
    create: async ({ data }) => {
      const newMsg = { id: `msg-${Date.now()}`, ...data, createdAt: new Date() };
      mockMessages.push(newMsg);
      return newMsg;
    }
  },
  commande: {
    create: async ({ data }) => {
      const newCmd = { id: `cmd-${Date.now()}`, ...data, createdAt: new Date() };
      mockCommandes.push(newCmd);
      return newCmd;
    }
  },
  otpCode: {
    create: async ({ data }) => { const newOtp = { id: `otp-${Date.now()}`, ...data, createdAt: new Date() }; mockOtps.push(newOtp); return newOtp; },
    findFirst: async ({ where }) => mockOtps.find(o => o.userId === where.userId && o.code === where.code),
    deleteMany: async ({ where }) => { mockOtps = mockOtps.filter(o => o.userId !== where?.userId); }
  },
  $transaction: async (promises) => Promise.all(promises)
};

module.exports = isFallback ? fallbackClient : prisma;