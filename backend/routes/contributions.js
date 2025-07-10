const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { auth } = require('../middleware/auth');

router.use(auth);

// Listar aportes de una meta
router.get('/:goalId', contributionController.getContributionsByGoal);
// Crear aporte
router.post('/', contributionController.createContribution);
// Editar aporte
router.put('/:id', contributionController.updateContribution);
// Eliminar aporte
router.delete('/:id', contributionController.deleteContribution);

module.exports = router; 