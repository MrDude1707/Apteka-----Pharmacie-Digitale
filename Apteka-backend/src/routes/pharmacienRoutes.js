const express = require('express');
const router = express.Router();
const pharmacienController = require('../controllers/pharmacienController');
const { protect, isPharmacien } = require('../middlewares/auth');

// Protéger toutes les routes pharmaciens
router.use(protect);
router.use(isPharmacien);

router.get('/ordonnances/code/:code', pharmacienController.getOrdonnanceByCode);
router.post('/ordonnances/deliver', pharmacienController.deliverOrdonnance);
router.get('/stocks', pharmacienController.getMyPharmacyStocks);
router.post('/stocks/update', pharmacienController.updateStock);
router.get('/commandes', pharmacienController.getMyPharmacyCommandes);
router.post('/commandes/:id/status', pharmacienController.updateCommandeStatus);

module.exports = router;
