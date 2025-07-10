const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { auth } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// CRUD
router.get('/', goalController.getGoals); // Listar metas del usuario
router.post('/', goalController.createGoal); // Crear meta
router.put('/:id', goalController.updateGoal); // Editar meta
router.delete('/:id', goalController.deleteGoal); // Eliminar meta
router.post('/notify', goalController.notifyGoal);
router.post('/subscribe', goalController.savePushSubscription);
router.post('/push', goalController.sendPushNotification);
router.get('/vapid-key', goalController.getVapidPublicKey);

module.exports = router; 