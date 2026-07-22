const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/medicaments/recherche', patientController.searchMedicamentAndStocks);
router.get('/medicaments/autocomplete', patientController.getAutocomplete);
router.get('/ordonnances/my-history', patientController.getMyPrescriptions);
router.post('/ordonnances/:id/renew', patientController.requestRenewal);
router.post('/commandes', patientController.createCommande);
router.get('/messages', patientController.getMessages);
router.post('/messages', patientController.sendMessage);

module.exports = router;