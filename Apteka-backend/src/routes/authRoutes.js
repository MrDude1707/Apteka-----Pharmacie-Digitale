const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const catalogueController = require('../controllers/catalogueController');
const { protect, isAdmin } = require('../middlewares/auth');
const { createLimiter } = require('../middlewares/rateLimiter');

// Configuration des limiteurs de débit pour protéger les routes sensibles
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requêtes par IP
  message: "Trop d'échecs de connexion ou de requêtes sensibles. Veuillez patienter 15 minutes avant de réessayer."
});

const registrationAndOtpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes par IP
  message: "Trop de demandes d'inscription ou de validation de code OTP. Veuillez patienter 15 minutes avant de réessayer."
});

router.post('/register', registrationAndOtpLimiter, authController.register);
router.post('/verify-otp', registrationAndOtpLimiter, authController.verifyOtp);
router.post('/resend-otp', registrationAndOtpLimiter, authController.resendOtp);
router.post('/login', authLimiter, authController.login);
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);
router.post('/change-password', protect, authController.changePassword);

router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

router.get('/admin/pending', protect, isAdmin, authController.getPendingProfessionals);
router.post('/admin/approve/:profileId', protect, isAdmin, authController.approveProfessional);
router.post('/admin/reject/:profileId', protect, isAdmin, authController.rejectProfessional);
router.get('/admin/all-users', protect, isAdmin, authController.getAllUsers);
router.post('/admin/toggle-block/:profileId', protect, isAdmin, authController.toggleBlockUser);
router.get('/admin/stats', protect, isAdmin, authController.getAdminStats);
router.get('/admin/catalogue', protect, isAdmin, catalogueController.list);
router.put('/admin/catalogue/:id', protect, isAdmin, catalogueController.update);

// NOUVELLES ROUTES ADMIN (TACHE 1)
router.get('/admin/vitrine', protect, isAdmin, authController.getVitrineDocs);
router.put('/admin/vitrine/:id/link', protect, isAdmin, authController.linkVitrineDoc);

module.exports = router;
