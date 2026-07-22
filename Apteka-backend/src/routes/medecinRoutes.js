const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');
const { protect, isMedecin } = require('../middlewares/auth');

router.use(protect);
router.use(isMedecin);

router.get('/patient/search', medecinController.searchPatient);
router.get('/pharmacies', medecinController.getPharmaciesByZone);
router.get('/stocks/medicament/:medicamentId', medecinController.getStocksByMedicament);
router.post('/ordonnances', medecinController.createOrdonnance);
router.get('/ordonnances/history', medecinController.getDoctorPrescriptions);
router.get('/mes-patients', medecinController.getMyPatients);

// NOUVELLES ROUTES (RENOUVELLEMENT ET CHAT)
router.get('/renewals', medecinController.getRenewals);
router.post('/ordonnances/:id/approve-renewal', medecinController.approveRenewal);
router.get('/messages/:patientId', medecinController.getMessagesWithPatient);
router.post('/messages', medecinController.sendMessage);

module.exports = router;