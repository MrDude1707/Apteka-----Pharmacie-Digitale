const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const shouldClean = process.argv.includes('--clean');

  if (shouldClean) {
    console.log('⚠️ Mode CLEAN détecté : réinitialisation complète de la base de données...');
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
  } else {
    console.log('ℹ️ Mode INCREMENTAL : conservation des données existantes (Commandes, Messages, Ordonnances)...');
  }

  console.log('--- Début du Seeding de la base de données ---');

  const pharmaciesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/pharmacies.json'), 'utf-8'));
  const medicamentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/medicaments.json'), 'utf-8'));

  // 1. Peupler les pharmacies (si inexistantes)
  await prisma.pharmacie.createMany({
    data: pharmaciesData.map(pharma => ({
      id: pharma.id, 
      name: pharma.name, 
      latitude: parseFloat(pharma.latitude),
      longitude: parseFloat(pharma.longitude), 
      phone: pharma.phone || null, 
      zone: pharma.zone || "Antananarivo"
    })),
    skipDuplicates: true
  });
  const createdPharmacies = await prisma.pharmacie.findMany();

  // 2. Peupler les médicaments (si inexistants)
  await prisma.medicament.createMany({
    data: medicamentsData.map(med => {
      const subActive = med.substances_actives && med.substances_actives.length > 0
        ? `${med.substances_actives[0].substance}` : null;
      return {
        cis: med.cis, 
        nom: med.nom, 
        forme: med.forme, 
        presentation: med.presentation || null,
        prix: med.prix_euros ? parseFloat(med.prix_euros.replace(',', '.')) : null,
        tauxRemboursement: med.taux_remboursement || null, 
        substanceActive: subActive,
        categorie: med.categorie || "Général", 
        isPopular: med.isPopular || false
      };
    }),
    skipDuplicates: true
  });
  const createdMedicaments = await prisma.medicament.findMany();

  // 3. Peupler les stocks initiaux (si inexistants pour l'officine/produit)
  const stocksData = [];
  for (const pharma of createdPharmacies) {
    for (const med of createdMedicaments) {
      stocksData.push({
        pharmacieId: pharma.id, 
        medicamentId: med.id, 
        quantite: Math.floor(Math.random() * 131) + 20
      });
    }
  }
  await prisma.stock.createMany({ data: stocksData, skipDuplicates: true });

  const salt = await bcrypt.genSalt(10);
  const hashedDefaultPassword = await bcrypt.hash('password123', salt);

  // 4. Peupler les utilisateurs réels
  
  // ADMIN
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@pharma.mg' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { 
        email: 'admin@pharma.mg', 
        password: hashedDefaultPassword, 
        profile: { create: { firstName: 'Admin', lastName: 'Prescribe', role: 'ADMINISTRATEUR', status: 'ACTIVE' } } 
      }
    });
    console.log('✅ Compte Administrateur créé.');
  }

  // MÉDECIN
  let doctorUser = await prisma.user.findUnique({ where: { email: 'dr.razafy@pharma.mg' } });
  if (!doctorUser) {
    doctorUser = await prisma.user.create({
      data: { 
        email: 'dr.razafy@pharma.mg', 
        password: hashedDefaultPassword, 
        profile: { create: { firstName: 'Jean', lastName: 'Razafy', role: 'MEDECIN', status: 'ACTIVE', zone: 'Analakely', phone: '+261 34 11 234 56' } } 
      }
    });
    console.log('✅ Compte Médecin (Dr. Razafy) créé.');
  }

  // PHARMACIEN
  let pharmacistUser = await prisma.user.findUnique({ where: { email: 'pharmacien.analakely@pharma.mg' } });
  if (!pharmacistUser) {
    pharmacistUser = await prisma.user.create({
      data: { 
        email: 'pharmacien.analakely@pharma.mg', 
        password: hashedDefaultPassword, 
        profile: { create: { firstName: 'Nirina', lastName: 'Rabe', role: 'PHARMACIEN', status: 'ACTIVE', pharmacieId: '4', phone: '+261 32 88 123 45' } } 
      }
    });
    console.log('✅ Compte Pharmacien (Nirina Rabe) créé.');
  }

  // 5. Peupler les fiches de médecins disponibles (vitrine)
  let vitrineDr1 = await prisma.medecinDisponible.findFirst({ where: { nom: 'Dr. Jean Razafy' } });
  if (!vitrineDr1) {
    vitrineDr1 = await prisma.medecinDisponible.create({
      data: { nom: 'Dr. Jean Razafy', specialite: 'Médecine générale', photoUrl: '/images/medecins/medecin-1.jpg', userId: doctorUser.id }
    });
  }

  const otherDoctors = [
    { nom: 'Dr. Voahangy Rakoto', specialite: 'Pédiatrie', photoUrl: '/images/medecins/medecin-2.jpg' },
    { nom: 'Dr. Hery Andrianasolo', specialite: 'Cardiologie', photoUrl: '/images/medecins/medecin-3.jpg' },
    { nom: 'Dr. Mialy Ravelojaona', specialite: 'Gynécologie', photoUrl: '/images/medecins/medecin-4.jpg' },
    { nom: 'Dr. Tojo Rabearison', specialite: 'Dermatologie', photoUrl: '/images/medecins/medecin-5.jpg' }
  ];

  for (const doc of otherDoctors) {
    const exists = await prisma.medecinDisponible.findFirst({ where: { nom: doc.nom } });
    if (!exists) {
      await prisma.medecinDisponible.create({ data: doc });
    }
  }

  // PATIENT
  let patientUser = await prisma.user.findUnique({ where: { email: 'patient@example.com' } });
  if (!patientUser) {
    patientUser = await prisma.user.create({
      data: { 
        email: 'patient@example.com', 
        password: hashedDefaultPassword, 
        profile: { create: { firstName: 'Toky', lastName: 'Randria', role: 'PATIENT', status: 'ACTIVE', phone: '+261 33 44 555 66', wantsMedecin: true, medecinChoisiId: vitrineDr1.id } } 
      }
    });
    console.log('✅ Compte Patient (Toky Randria) créé.');
  }

  // MESSAGE INITIAL DE BIENVENUE
  if (doctorUser && patientUser) {
    const msgExists = await prisma.message.findFirst({
      where: { senderId: doctorUser.id, receiverId: patientUser.id }
    });
    if (!msgExists) {
      await prisma.message.create({
        data: { senderId: doctorUser.id, receiverId: patientUser.id, content: "Bonjour Toky, comment se passe votre traitement ?" }
      });
      console.log('✅ Message de bienvenue initial créé.');
    }
  }

  console.log('--- Seeding terminé avec succès ! ---');
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });