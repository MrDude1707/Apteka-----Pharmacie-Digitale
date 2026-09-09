const { createMemoryPrisma } = require('../src/memoryPrisma');
const { createCareWorkflows } = require('../src/services/careWorkflows');
function fixture() {
  const db = createMemoryPrisma({
    user: ['patient', 'other', 'doctor', 'doctor2', 'pharma', 'admin', 'pending'].map(id => ({ id, email: id + '@example.test' })),
    profile: [
      { id: 'pp', userId: 'patient', role: 'PATIENT', status: 'ACTIVE', medecinChoisiId: 'card' },
      { id: 'po', userId: 'other', role: 'PATIENT', status: 'ACTIVE', medecinChoisiId: 'card2' },
      { id: 'pd', userId: 'doctor', role: 'MEDECIN', status: 'ACTIVE' },
      { id: 'pd2', userId: 'doctor2', role: 'MEDECIN', status: 'ACTIVE' },
      { id: 'pf', userId: 'pharma', role: 'PHARMACIEN', status: 'ACTIVE', pharmacieId: 'pharmacy' },
      { id: 'pa', userId: 'admin', role: 'ADMINISTRATEUR', status: 'ACTIVE' },
      { id: 'wait', userId: 'pending', role: 'MEDECIN', status: 'PENDING' }
    ],
    medecinDisponible: [{ id: 'card', userId: 'doctor', actif: true }, { id: 'card2', userId: 'doctor2', actif: true }],
    pharmacie: [{ id: 'pharmacy', name: 'Officine Test' }, { id: 'pharmacy2', name: 'Autre officine' }],
    medicament: [
      { id: 'rx', cis: '1', nom: 'Produit test sur ordonnance', prix: 12.50, forme: 'Test', requiresPrescription: true, classificationReviewed: true, isActive: true },
      { id: 'otc', cis: '2', nom: 'Produit test libre', prix: 2, forme: 'Test', requiresPrescription: false, classificationReviewed: true, isActive: true },
      { id: 'unreviewed', cis: '3', nom: 'Produit test non vérifié', prix: 2, requiresPrescription: true, classificationReviewed: false, isActive: true },
      { id: 'inactive', cis: '4', nom: 'Produit test retiré', prix: 2, requiresPrescription: false, classificationReviewed: true, isActive: false }
    ],
    stock: ['rx', 'otc', 'unreviewed', 'inactive'].map(medicamentId => ({ id: 's-' + medicamentId, pharmacieId: 'pharmacy', medicamentId, quantite: 10 }))
  });
  const care = createCareWorkflows(db);
  return { db, care };
}
const line = (medicamentId = 'rx', quantite = 2) => ({
  medicamentId, quantite, nom: 'Nom navigateur falsifié', dosage: 'Dosage test', posologie: 'Instructions test', duree: 'Durée test'
});
module.exports = { fixture, line };
