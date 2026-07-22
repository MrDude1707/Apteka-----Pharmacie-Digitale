-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PHARMACIEN', 'MEDECIN', 'ADMINISTRATEUR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "OrdonnanceStatus" AS ENUM ('PENDING', 'DELIVREE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "phone" TEXT,
    "zone" TEXT,
    "pharmacieId" TEXT,
    "wantsMedecin" BOOLEAN NOT NULL DEFAULT false,
    "medecinChoisiId" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedecinDisponible" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "specialite" TEXT,
    "photoUrl" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "MedecinDisponible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pharmacie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT,
    "zone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pharmacie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicament" (
    "id" TEXT NOT NULL,
    "cis" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "forme" TEXT NOT NULL,
    "presentation" TEXT,
    "prix" DOUBLE PRECISION,
    "tauxRemboursement" TEXT,
    "substanceActive" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "pharmacieId" TEXT NOT NULL,
    "medicamentId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ordonnance" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "OrdonnanceStatus" NOT NULL DEFAULT 'PENDING',
    "medicaments" JSONB NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateDelivrance" TIMESTAMP(3),
    "pharmacieId" TEXT,

    CONSTRAINT "Ordonnance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_role_status_idx" ON "Profile"("role", "status");

-- CreateIndex
CREATE INDEX "Profile_zone_idx" ON "Profile"("zone");

-- CreateIndex
CREATE UNIQUE INDEX "MedecinDisponible_userId_key" ON "MedecinDisponible"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Medicament_cis_key" ON "Medicament"("cis");

-- CreateIndex
CREATE INDEX "Medicament_nom_idx" ON "Medicament"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_pharmacieId_medicamentId_key" ON "Stock"("pharmacieId", "medicamentId");

-- CreateIndex
CREATE UNIQUE INDEX "Ordonnance_code_key" ON "Ordonnance"("code");

-- CreateIndex
CREATE INDEX "Ordonnance_medecinId_idx" ON "Ordonnance"("medecinId");

-- CreateIndex
CREATE INDEX "Ordonnance_patientId_idx" ON "Ordonnance"("patientId");

-- CreateIndex
CREATE INDEX "Ordonnance_status_idx" ON "Ordonnance"("status");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_pharmacieId_fkey" FOREIGN KEY ("pharmacieId") REFERENCES "Pharmacie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_medecinChoisiId_fkey" FOREIGN KEY ("medecinChoisiId") REFERENCES "MedecinDisponible"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedecinDisponible" ADD CONSTRAINT "MedecinDisponible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_pharmacieId_fkey" FOREIGN KEY ("pharmacieId") REFERENCES "Pharmacie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ordonnance" ADD CONSTRAINT "Ordonnance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
