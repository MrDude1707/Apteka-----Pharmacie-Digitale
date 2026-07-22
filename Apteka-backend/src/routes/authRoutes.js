const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, isAdmin } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateMe);
router.post('/change-password', protect, authController.changePassword);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/admin/pending', protect, isAdmin, authController.getPendingProfessionals);
router.post('/admin/approve/:profileId', protect, isAdmin, authController.approveProfessional);
router.post('/admin/reject/:profileId', protect, isAdmin, authController.rejectProfessional);
router.get('/admin/all-users', protect, isAdmin, authController.getAllUsers);
router.post('/admin/toggle-block/:profileId', protect, isAdmin, authController.toggleBlockUser);
router.get('/admin/stats', protect, isAdmin, authController.getAdminStats);

// NOUVELLES ROUTES ADMIN (TACHE 1)
router.get('/admin/vitrine', protect, isAdmin, authController.getVitrineDocs);
router.put('/admin/vitrine/:id/link', protect, isAdmin, authController.linkVitrineDoc);

module.exports = router;