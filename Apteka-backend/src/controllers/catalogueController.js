const prisma = require('../prisma');
const { respondError } = require('../services/careWorkflows');

exports.list = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().slice(0, 150);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const where = search ? { OR: [{ nom: { contains: search, mode: 'insensitive' } }, { cis: { contains: search, mode: 'insensitive' } }] } : {};
    const [items, total] = await Promise.all([
      prisma.medicament.findMany({ where, orderBy: { nom: 'asc' }, take: 20, skip: (page - 1) * 20 }),
      prisma.medicament.count({ where })
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / 20) });
  } catch (error) { return respondError(res, error); }
};

exports.update = async (req, res) => {
  try {
    const { requiresPrescription, isActive, classificationSource } = req.body;
    if (typeof requiresPrescription !== 'boolean' || typeof isActive !== 'boolean'
      || typeof classificationSource !== 'string' || classificationSource.trim().length < 10 || classificationSource.length > 1000) {
      return res.status(400).json({ error: 'Renseignez le régime, l’état du produit et une source de validation (10 à 1000 caractères).' });
    }
    const med = await prisma.medicament.findUnique({ where: { id: req.params.id } });
    if (!med) return res.status(404).json({ error: 'Médicament introuvable.' });
    const item = await prisma.medicament.update({ where: { id: med.id }, data: {
      requiresPrescription, isActive, classificationReviewed: true, classificationSource: classificationSource.trim()
    } });
    res.json({ item, message: 'Régime de délivrance enregistré.' });
  } catch (error) { return respondError(res, error); }
};
