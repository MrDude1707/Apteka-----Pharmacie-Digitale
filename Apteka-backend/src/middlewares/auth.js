const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || "TANA_PHARMA_SECURE_JWT_KEY_L2_MEMOIRE_2026";

/**
 * Middleware d'authentification global : extrait et vérifie le JWT
 */
async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Récupérer l'utilisateur et son profil rattaché
      // IMPORTANT : include profile obligatoire, sinon req.user.profile est undefined
      // avec une vraie base Postgres (le mode démo en mémoire le simulait automatiquement)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { profile: true }
      });

      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé ou supprimé." });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Erreur de validation JWT:", error.message);
      return res.status(401).json({ error: "Session expirée ou jeton JWT invalide." });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Jeton d'authentification manquant." });
  }
}

/**
 * Restriction stricte à l'Administrateur
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.profile && req.user.profile.role === 'ADMINISTRATEUR') {
    next();
  } else {
    return res.status(403).json({ error: "Accès interdit. Rôle Administrateur requis." });
  }
}

/**
 * Restriction stricte au Médecin
 */
function isMedecin(req, res, next) {
  if (req.user && req.user.profile && req.user.profile.role === 'MEDECIN') {
    if (req.user.profile.status !== 'ACTIVE') {
      return res.status(403).json({ error: "Votre compte médecin est en attente d'approbation par l'administrateur." });
    }
    next();
  } else {
    return res.status(403).json({ error: "Accès interdit. Rôle Médecin requis." });
  }
}

/**
 * Restriction stricte au Pharmacien
 */
function isPharmacien(req, res, next) {
  if (req.user && req.user.profile && req.user.profile.role === 'PHARMACIEN') {
    if (req.user.profile.status !== 'ACTIVE') {
      return res.status(403).json({ error: "Votre compte pharmacien est en attente d'approbation par l'administrateur." });
    }
    next();
  } else {
    return res.status(403).json({ error: "Accès interdit. Rôle Pharmacien requis." });
  }
}

module.exports = {
  protect,
  isAdmin,
  isMedecin,
  isPharmacien
};
