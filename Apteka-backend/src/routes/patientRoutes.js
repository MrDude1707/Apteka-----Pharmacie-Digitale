const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect, isPatient } = require('../middlewares/auth');

router.use(protect);
router.use(isPatient);

router.get('/medicaments/recherche', patientController.searchMedicamentAndStocks);
router.get('/medicaments/catalogue', patientController.getCatalogue);
router.get('/medicaments/autocomplete', patientController.getAutocomplete);
router.get('/ordonnances/my-history', patientController.getMyPrescriptions);
router.post('/ordonnances/:id/renew', patientController.requestRenewal);
router.get('/ordonnances/:id/pharmacies', patientController.prescriptionPharmacies);
router.post('/commandes', patientController.createCommande);
router.post('/commandes/create-checkout-session', patientController.createCheckoutSession);
router.post('/commandes/verify-checkout-session', patientController.verifyCheckoutSession);
router.post('/commandes/:id/cancel', patientController.cancelCommande);
router.get('/commandes/my-history', patientController.getMyCommandes);
router.get('/messages', patientController.getMessages);
router.post('/messages', patientController.sendMessage);

module.exports = router;
