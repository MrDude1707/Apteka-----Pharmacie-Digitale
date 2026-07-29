const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const prisma = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || "TANA_PHARMA_SECURE_JWT_KEY_L2_MEMOIRE_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465");
const isSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER || "resend",
    pass: process.env.SMTP_PASS || "re_C1JqJz8u_ESbcAGCfn6VhCySBhL1uWqRc"
  }
});

/**
 * INSCRIPTION
 */
async function register(req, res) {
  const { email, password, firstName, lastName, role, phone, zone, pharmacieId, wantsMedecin, medecinChoisiId } = req.body;

  try {
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: "Veuillez remplir tous les champs obligatoires." });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Cette adresse email est déjà enregistrée." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let status = 'PENDING';

    if (role === 'PHARMACIEN') {
      if (!pharmacieId) {
        return res.status(400).json({ error: "Un pharmacien doit obligatoirement sélectionner sa pharmacie de rattachement." });
      }
      const pharmacie = await prisma.pharmacie.findUnique({ where: { id: pharmacieId } });
      if (!pharmacie) {
        return res.status(400).json({ error: "La pharmacie sélectionnée n'existe pas dans la base de données officielle." });
      }
    }

    let medecinChoisiValide = null;
    if (role === 'PATIENT' && wantsMedecin && medecinChoisiId) {
      medecinChoisiValide = await prisma.medecinDisponible.findUnique({ where: { id: medecinChoisiId } });
      if (!medecinChoisiValide) {
        return res.status(400).json({ error: "Le médecin sélectionné n'existe pas ou n'est plus disponible." });
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: {
            firstName,
            lastName,
            role,
            status,
            phone: phone || null,
            zone: zone || null,
            pharmacieId: role === 'PHARMACIEN' ? pharmacieId : null,
            wantsMedecin: role === 'PATIENT' ? !!wantsMedecin : false,
            medecinChoisiId: role === 'PATIENT' && medecinChoisiValide ? medecinChoisiValide.id : null
          }
        }
      }
    });

    if (role === 'PATIENT') {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await prisma.otpCode.create({
        data: {
          userId: user.id,
          code: otpCode,
          type: 'REGISTER',
          expiresAt
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Apteka" <onboarding@resend.dev>',
        to: email,
        subject: "Validation de votre compte - Code OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #007aff; text-align: center;">Apteka — Pharmacie d'Antananarivo</h2>
            <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
            <p>Merci de vous être inscrit sur notre plateforme. Pour activer votre compte Patient, veuillez utiliser le code de validation OTP ci-dessous :</p>
            <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #10b981; margin: 30px 0; padding: 15px; background-color: #f5f5f7; border-radius: 6px;">
              ${otpCode}
            </div>
            <p style="font-size: 13px; color: #86868b; text-align: center;">Ce code est confidentiel et est valide pendant 15 minutes.</p>
          </div>
        `
      };

      const hasSmtpConfig = process.env.SMTP_USER || transporter.options.auth.pass;
      if (hasSmtpConfig) {
        transporter.sendMail(mailOptions).catch((mailError) => {
          console.error("Erreur d'envoi d'email réel, code affiché dans les logs:", mailError.message);
          console.log(`\n==========================================\n[DÉMO BACKUP LOG À ${email}] : Le code OTP est ${otpCode}\n==========================================\n`);
        });
      } else {
        console.log(`\n==========================================\n[DÉMO OTP ENVOYÉ À ${email}] : Le code OTP est ${otpCode}\n==========================================\n`);
      }

      return res.status(201).json({
        message: "Compte créé ! Un code de validation OTP a été envoyé à votre email pour activer votre compte.",
        userId: user.id,
        requiresOtp: true
      });
    }

    return res.status(201).json({
      message: "Demande de compte professionnel enregistrée. Un Administrateur va vérifier vos pièces justificatives et activer votre accès sous 24h.",
      userId: user.id,
      requiresOtp: false
    });

  } catch (error) {
    console.error("Erreur d'inscription:", error);
    return res.status(500).json({ error: "Une erreur interne est survenue lors de l'inscription." });
  }
}

/**
 * VALIDATION DE L'OTP PATIENT
 */
async function verifyOtp(req, res) {
  const { userId, code } = req.body;

  try {
    if (!userId || !code) {
      return res.status(400).json({ error: "Informations de validation manquantes." });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: { userId, code, type: 'REGISTER' }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Code OTP invalide." });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "Le code OTP a expiré. Veuillez en demander un nouveau." });
    }

    await prisma.profile.update({
      where: { userId },
      data: { status: 'ACTIVE' }
    });

    await prisma.otpCode.deleteMany({ where: { userId, type: 'REGISTER' } });

    return res.status(200).json({ message: "Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter." });

  } catch (error) {
    console.error("Erreur validation OTP:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la validation." });
  }
}

/**
 * CONNEXION
 */
async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Veuillez fournir un email et un mot de passe." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Identifiants de connexion invalides." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Identifiants de connexion invalides." });
    }

    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return res.status(400).json({ error: "Profil utilisateur introuvable." });
    }

    if (profile.status === 'PENDING') {
      if (profile.role === 'PATIENT') {
        return res.status(403).json({ error: "Veuillez d'abord valider votre compte via l'OTP envoyé par email.", requiresOtp: true, userId: user.id });
      }
      return res.status(403).json({ error: "Votre compte est en attente d'approbation par l'Administrateur." });
    }

    if (profile.status === 'BLOCKED') {
      return res.status(403).json({ error: "Votre compte a été suspendu. Veuillez contacter l'assistance." });
    }

    if (profile.status === 'REJECTED') {
      return res.status(403).json({ error: "Votre demande de compte professionnel a été refusée. Veuillez contacter l'assistance." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    let pharmacie = null;
    if (profile.role === 'PHARMACIEN' && profile.pharmacieId) {
      pharmacie = await prisma.pharmacie.findUnique({ where: { id: profile.pharmacieId } });
    }

    return res.status(200).json({
      message: "Connexion réussie !",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: profile.role,
        status: profile.status,
        zone: profile.zone,
        pharmacie
      }
    });

  } catch (error) {
    console.error("Erreur de connexion:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
}

/**
 * OBTENIR LES INFOS DU COMPTE ACTIF
 */
async function getMe(req, res) {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });

    let pharmacie = null;
    if (profile && profile.role === 'PHARMACIEN' && profile.pharmacieId) {
      pharmacie = await prisma.pharmacie.findUnique({ where: { id: profile.pharmacieId } });
    }

    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      role: profile?.role,
      status: profile?.status,
      zone: profile?.zone,
      pharmacie
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la récupération des données utilisateur." });
  }
}

/**
 * ADMIN: RÉCUPÉRER LES COMPTES PROS EN ATTENTE
 */
async function getPendingProfessionals(req, res) {
  try {
    const pendingProfiles = await prisma.profile.findMany({
      where: {
        role: { in: ['MEDECIN', 'PHARMACIEN'] },
        status: 'PENDING'
      }
    });

    const populated = [];
    for (const p of pendingProfiles) {
      const user = await prisma.user.findUnique({ where: { id: p.userId } });
      let pharmaName = null;
      if (p.pharmacieId) {
        const ph = await prisma.pharmacie.findUnique({ where: { id: p.pharmacieId } });
        pharmaName = ph ? ph.name : null;
      }
      populated.push({
        id: p.id,
        userId: p.userId,
        email: user.email,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role,
        zone: p.zone,
        pharmacieName: pharmaName,
        createdAt: user.createdAt
      });
    }

    return res.status(200).json(populated);
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du chargement des comptes en attente." });
  }
}

/**
 * ADMIN: APPROUVER UN COMPTE PRO
 */
async function approveProfessional(req, res) {
  const { profileId } = req.params;

  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: { status: 'ACTIVE' }
    });

    const user = await prisma.user.findUnique({ where: { id: profile.userId } });
    if (user) {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Apteka" <onboarding@resend.dev>',
        to: user.email,
        subject: "Votre compte a été approuvé !",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #10b981; text-align: center;">Apteka — Pharmacie d'Antananarivo</h2>
            <p>Bonjour <strong>${profile.firstName} ${profile.lastName}</strong>,</p>
            <p>Votre compte ${profile.role === 'MEDECIN' ? 'Médecin' : 'Pharmacien'} a été vérifié et approuvé par notre équipe. Vous pouvez dès à présent vous connecter à la plateforme.</p>
          </div>
        `
      };
      transporter.sendMail(mailOptions).catch((mailError) => {
        console.error("Erreur d'envoi d'email d'approbation (non bloquant) :", mailError.message);
      });
    }

    return res.status(200).json({ message: `Le compte professionnel de ${profile.firstName} ${profile.lastName} a été approuvé avec succès !` });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la validation du profil." });
  }
}

/**
 * ADMIN: REFUSER UN COMPTE PRO EN ATTENTE
 */
async function rejectProfessional(req, res) {
  const { profileId } = req.params;

  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: { status: 'REJECTED' }
    });

    return res.status(200).json({ message: `Le compte de ${profile.firstName} ${profile.lastName} a été refusé.` });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du refus du profil." });
  }
}

/**
 * ADMIN: LISTER TOUS LES COMPTES (pour la supervision et le blocage)
 */
async function getAllUsers(req, res) {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { firstName: 'asc' }
    });

    const populated = [];
    for (const p of profiles) {
      const user = await prisma.user.findUnique({ where: { id: p.userId } });
      populated.push({
        id: p.id,
        userId: p.userId,
        email: user?.email,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role,
        status: p.status,
        zone: p.zone,
        createdAt: user?.createdAt
      });
    }

    return res.status(200).json(populated);
  } catch (error) {
    console.error("Erreur de récupération des comptes:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des comptes." });
  }
}

/**
 * ADMIN: BLOQUER / DÉBLOQUER UN COMPTE ACTIF
 */
async function toggleBlockUser(req, res) {
  const { profileId } = req.params;

  try {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return res.status(404).json({ error: "Profil introuvable." });
    }
    if (profile.role === 'ADMINISTRATEUR') {
      return res.status(400).json({ error: "Impossible de bloquer un compte administrateur." });
    }

    const newStatus = profile.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: { status: newStatus }
    });

    return res.status(200).json({
      message: newStatus === 'BLOCKED'
        ? `Le compte de ${updated.firstName} ${updated.lastName} a été bloqué.`
        : `Le compte de ${updated.firstName} ${updated.lastName} a été débloqué.`,
      status: newStatus
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du changement de statut du compte." });
  }
}

/**
 * ADMIN: STATISTIQUES RÉELLES POUR L'ONGLET SUPERVISION
 */
async function getAdminStats(req, res) {
  try {
    const [pharmaciesCount, activeProsCount, stockAgg, ordonnancesCount, recentOrdonnances] = await Promise.all([
      prisma.pharmacie.count(),
      prisma.profile.count({ where: { role: { in: ['MEDECIN', 'PHARMACIEN'] }, status: 'ACTIVE' } }),
      prisma.stock.aggregate({ _sum: { quantite: true } }),
      prisma.ordonnance.count({ where: { status: 'DELIVREE' } }),
      prisma.ordonnance.findMany({
        orderBy: { dateEmission: 'desc' },
        take: 8
      })
    ]);

    return res.status(200).json({
      pharmaciesCount,
      activeProsCount,
      totalStockUnits: stockAgg._sum.quantite || 0,
      ordonnancesDelivreesCount: ordonnancesCount,
      recentOrdonnances: recentOrdonnances.map(o => ({
        code: o.code,
        status: o.status,
        dateEmission: o.dateEmission
      }))
    });
  } catch (error) {
    console.error("Erreur de récupération des statistiques admin:", error);
    return res.status(500).json({ error: "Erreur lors du chargement des statistiques." });
  }
}

/**
 * MOT DE PASSE OUBLIÉ : envoi d'un code de réinitialisation par email
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Veuillez fournir votre adresse email." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(200).json({ message: "Si cette adresse existe, un code de réinitialisation vient de lui être envoyé." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.otpCode.create({
      data: { userId: user.id, code: otpCode, type: 'PASSWORD_RESET', expiresAt }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Apteka" <onboarding@resend.dev>',
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #10b981; text-align: center;">Apteka — Pharmacie d'Antananarivo</h2>
          <p>Voici votre code de réinitialisation de mot de passe :</p>
          <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #10b981; margin: 30px 0; padding: 15px; background-color: #f5f5f7; border-radius: 6px;">
            ${otpCode}
          </div>
          <p style="font-size: 13px; color: #86868b; text-align: center;">Ce code est valide pendant 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `
    };

    const hasSmtpConfig = process.env.SMTP_USER || transporter.options.auth.pass;
    if (hasSmtpConfig) {
      transporter.sendMail(mailOptions).catch((mailError) => {
        console.error("Erreur d'envoi d'email de réinitialisation, code affiché dans les logs:", mailError.message);
        console.log(`\n==========================================\n[DÉMO BACKUP LOG RESET PASSWORD À ${email}] : Le code est ${otpCode}\n==========================================\n`);
      });
    } else {
      console.log(`\n==========================================\n[DÉMO RESET PASSWORD À ${email}] : Le code est ${otpCode}\n==========================================\n`);
    }

    return res.status(200).json({ message: "Si cette adresse existe, un code de réinitialisation vient de lui être envoyé.", userId: user.id });
  } catch (error) {
    console.error("Erreur forgotPassword:", error);
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
}

/**
 * RÉINITIALISATION DU MOT DE PASSE avec le code reçu par email
 */
async function resetPassword(req, res) {
  const { userId, code, newPassword } = req.body;

  try {
    if (!userId || !code || !newPassword) {
      return res.status(400).json({ error: "Informations manquantes." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: { userId, code, type: 'PASSWORD_RESET' }
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Code invalide." });
    }
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "Le code a expiré. Veuillez recommencer la procédure." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    await prisma.otpCode.deleteMany({ where: { userId, type: 'PASSWORD_RESET' } });

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter." });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
}

/**
 * RENVOYER UN CODE OTP D'INSCRIPTION (si expiré ou non reçu)
 */
async function resendOtp(req, res) {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: "userId manquant." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!user || !profile) {
      return res.status(404).json({ error: "Compte introuvable." });
    }
    if (profile.status !== 'PENDING') {
      return res.status(400).json({ error: "Ce compte n'est pas en attente de validation." });
    }

    await prisma.otpCode.deleteMany({ where: { userId, type: 'REGISTER' } });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await prisma.otpCode.create({
      data: { userId, code: otpCode, type: 'REGISTER', expiresAt }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Apteka" <onboarding@resend.dev>',
      to: user.email,
      subject: "Nouveau code de validation OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #10b981; text-align: center;">Apteka — Pharmacie d'Antananarivo</h2>
          <p>Voici votre nouveau code de validation :</p>
          <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #10b981; margin: 30px 0; padding: 15px; background-color: #f5f5f7; border-radius: 6px;">
            ${otpCode}
          </div>
          <p style="font-size: 13px; color: #86868b; text-align: center;">Ce code est valide pendant 15 minutes.</p>
        </div>
      `
    };

    const hasSmtpConfig = process.env.SMTP_USER || transporter.options.auth.pass;
    if (hasSmtpConfig) {
      transporter.sendMail(mailOptions).catch((mailError) => {
        console.error("Erreur d'envoi d'email (non bloquant), code affiché dans les logs:", mailError.message);
        console.log(`\n==========================================\n[DÉMO BACKUP LOG OTP RENVOYÉ À ${user.email}] : Le code est ${otpCode}\n==========================================\n`);
      });
    } else {
      console.log(`\n==========================================\n[DÉMO OTP RENVOYÉ À ${user.email}] : Le code est ${otpCode}\n==========================================\n`);
    }

    return res.status(200).json({ message: "Un nouveau code a été envoyé à votre email." });
  } catch (error) {
    console.error("Erreur resendOtp:", error);
    return res.status(500).json({ error: "Une erreur est survenue." });
  }
}

/**
 * METTRE À JOUR MON PROFIL (téléphone, zone — connecté)
 */
async function updateMe(req, res) {
  const { phone, zone } = req.body;

  try {
    const updated = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        phone: phone !== undefined ? phone : undefined,
        zone: zone !== undefined ? zone : undefined
      }
    });

    return res.status(200).json({ message: "Profil mis à jour avec succès.", profile: updated });
  } catch (error) {
    console.error("Erreur updateMe:", error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du profil." });
  }
}

/**
 * CHANGER MON MOT DE PASSE (connecté, avec vérification de l'ancien)
 */
async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Veuillez fournir l'ancien et le nouveau mot de passe." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "L'ancien mot de passe est incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashedPassword } });

    return res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("Erreur changePassword:", error);
    return res.status(500).json({ error: "Erreur lors du changement de mot de passe." });
  }
}

module.exports = {
  register,
  verifyOtp,
  login,
  getMe,
  getPendingProfessionals,
  approveProfessional,
  rejectProfessional,
  getAllUsers,
  toggleBlockUser,
  getAdminStats,
  forgotPassword,
  resetPassword,
  resendOtp,
  updateMe,
  changePassword
};

// ... [TOUT LE CODE EXISTANT] ...

/**
 * ADMIN: TACHE 1 - Obtenir les médecins vitrine et les vrais comptes médecins
 */
async function getVitrineDocs(req, res) {
  try {
    const vitrines = await prisma.medecinDisponible.findMany({ include: { user: { include: { profile: true } } } });
    const medecins = await prisma.user.findMany({
      where: { profile: { role: 'MEDECIN', status: 'ACTIVE' } },
      include: { profile: true }
    });
    return res.status(200).json({ vitrines, medecins });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors du chargement des fiches vitrines." });
  }
}

/**
 * ADMIN: TACHE 1 - Lier un compte réel à une fiche vitrine
 */
async function linkVitrineDoc(req, res) {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    await prisma.medecinDisponible.update({
      where: { id },
      data: { userId: userId || null }
    });
    return res.status(200).json({ message: "Liaison mise à jour avec succès." });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la liaison." });
  }
}

module.exports = {
  register, verifyOtp, login, getMe, getPendingProfessionals, approveProfessional, rejectProfessional, getAllUsers, toggleBlockUser, getAdminStats, forgotPassword, resetPassword, resendOtp, updateMe, changePassword,
  getVitrineDocs, // NOUVEAU
  linkVitrineDoc  // NOUVEAU
};