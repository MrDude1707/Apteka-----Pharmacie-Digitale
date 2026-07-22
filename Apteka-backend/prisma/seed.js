const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Début du Seeding de la base de données ---');

  await prisma.commande.deleteMany();
  await prisma.message.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.ordonnance.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.medecinDisponible.deleteMany();
  await prisma.user.deleteMany();
  await prisma.medicament.deleteMany();
  await prisma.pharmacie.deleteMany();

  const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pharmacies.json'), 'utf-8'));
  const medicamentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicaments.json'), 'utf-8'));

  await prisma.pharmacie.createMany({
    data: pharmaciesData.map(pharma => ({
      id: pharma.id, name: pharma.name, latitude: parseFloat(pharma.latitude),
      longitude: parseFloat(pharma.longitude), phone: pharma.phone || null, zone: pharma.zone || "Antananarivo"
    })),
    skipDuplicates: true
  });
  const createdPharmacies = await prisma.pharmacie.findMany();

  await prisma.medicament.createMany({
    data: medicamentsData.map(med => {
      const subActive = med.substances_actives && med.substances_actives.length > 0
        ? `${med.substances_actives[0].substance}` : null;
      return {
        cis: med.cis, nom: med.nom, forme: med.forme, presentation: med.presentation || null,
        prix: med.prix_euros ? parseFloat(med.prix_euros.replace(',', '.')) : null,
        tauxRemboursement: med.taux_remboursement || null, substanceActive: subActive,
        categorie: med.categorie || "Général", isPopular: med.isPopular || false
      };
    }),
    skipDuplicates: true
  });
  const createdMedicaments = await prisma.medicament.findMany();

  const stocksData = [];
  for (const pharma of createdPharmacies) {
    for (const med of createdMedicaments) {
      stocksData.push({
        pharmacieId: pharma.id, medicamentId: med.id, quantite: Math.floor(Math.random() * 131) + 20
      });
    }
  }
  await prisma.stock.createMany({ data: stocksData, skipDuplicates: true });

  const salt = await bcrypt.genSalt(10);
  const hashedDefaultPassword = await bcrypt.hash('password123', salt);

  const adminUser = await prisma.user.create({
    data: { email: 'admin@pharma.mg', password: hashedDefaultPassword, profile: { create: { firstName: 'Admin', lastName: 'Prescribe', role: 'ADMINISTRATEUR', status: 'ACTIVE' } } }
  });

  const doctorUser = await prisma.user.create({
    data: { email: 'dr.razafy@pharma.mg', password: hashedDefaultPassword, profile: { create: { firstName: 'Jean', lastName: 'Razafy', role: 'MEDECIN', status: 'ACTIVE', zone: 'Analakely', phone: '+261 34 11 234 56' } } }
  });

  const pharmacistUser = await prisma.user.create({
    data: { email: 'pharmacien.analakely@pharma.mg', password: hashedDefaultPassword, profile: { create: { firstName: 'Nirina', lastName: 'Rabe', role: 'PHARMACIEN', status: 'ACTIVE', pharmacieId: '4', phone: '+261 32 88 123 45' } } }
  });

  const vitrineDr1 = await prisma.medecinDisponible.create({
    data: { nom: 'Dr. Jean Razafy', specialite: 'Médecine générale', photoUrl: '/images/medecins/medecin-1.jpg', userId: doctorUser.id }
  });
  
  await prisma.medecinDisponible.createMany({
    data: [
      { nom: 'Dr. Voahangy Rakoto', specialite: 'Pédiatrie', photoUrl: '/images/medecins/medecin-2.jpg' },
      { nom: 'Dr. Hery Andrianasolo', specialite: 'Cardiologie', photoUrl: '/images/medecins/medecin-3.jpg' },
      { nom: 'Dr. Mialy Ravelojaona', specialite: 'Gynécologie', photoUrl: '/images/medecins/medecin-4.jpg' },
      { nom: 'Dr. Tojo Rabearison', specialite: 'Dermatologie', photoUrl: '/images/medecins/medecin-5.jpg' }
    ]
  });

  const patientUser = await prisma.user.create({
    data: { email: 'patient@example.com', password: hashedDefaultPassword, profile: { create: { firstName: 'Toky', lastName: 'Randria', role: 'PATIENT', status: 'ACTIVE', phone: '+261 33 44 555 66', wantsMedecin: true, medecinChoisiId: vitrineDr1.id } } }
  });

  await prisma.message.create({
    data: { senderId: doctorUser.id, receiverId: patientUser.id, content: "Bonjour Toky, comment se passe votre traitement ?" }
  });

  console.log('--- Seeding terminé avec succès ! ---');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });