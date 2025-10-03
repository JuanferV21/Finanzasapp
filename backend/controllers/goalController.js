const { Goal } = require('../models');
const nodemailer = require('nodemailer');
const webpush = require('web-push');

// Listar metas del usuario
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener metas', error: err.message });
  }
};

// Crear meta
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, savedAmount, deadline, notes } = req.body;
    const goal = await Goal.create({
      name,
      targetAmount,
      savedAmount: savedAmount || 0,
      deadline,
      notes,
      userId: req.user.id,
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear meta', error: err.message });
  }
};

// Editar meta
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({
      where: { id: id, userId: req.user.id }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    // Actualizar campos
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        goal[key] = req.body[key];
      }
    });

    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar meta', error: err.message });
  }
};

// Eliminar meta
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({
      where: { id: id, userId: req.user.id }
    });

    if (!goal) {
      return res.status(404).json({ message: 'Meta no encontrada' });
    }

    await goal.destroy();
    res.json({ message: 'Meta eliminada' });
  } catch (err) {
    res.status(400).json({ message: 'Error al eliminar meta', error: err.message });
  }
};

exports.notifyGoal = async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    const userEmail = req.user?.email;
    const mailTo = to || userEmail;
    if (!mailTo) return res.status(400).json({ message: 'No se especificó destinatario.' });
    // Configuración básica de Nodemailer (puedes personalizar)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NOTIFY_EMAIL_USER,
        pass: process.env.NOTIFY_EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.NOTIFY_EMAIL_USER,
      to: mailTo,
      subject: subject || 'Notificación de Meta',
      text: text,
      html: html,
    });
    res.json({ message: 'Notificación enviada' });
  } catch (err) {
    res.status(500).json({ message: 'Error enviando email', error: err.message });
  }
};

// Guardar suscripciones en memoria (para demo; en producción usar DB)
const pushSubscriptions = {};

exports.savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !req.user?.id) return res.status(400).json({ message: 'Faltan datos de suscripción o usuario.' });
    pushSubscriptions[req.user.id] = subscription;
    res.json({ message: 'Suscripción guardada' });
  } catch (err) {
    res.status(500).json({ message: 'Error guardando suscripción', error: err.message });
  }
};

exports.sendPushNotification = async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    const subscription = pushSubscriptions[userId];
    if (!subscription) return res.status(404).json({ message: 'No hay suscripción push para este usuario.' });
    webpush.setVapidDetails(
      'mailto:admin@finanzasdash.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    const payload = JSON.stringify({ title: title || 'Notificación de Meta', body: body || '' });
    await webpush.sendNotification(subscription, payload);
    res.json({ message: 'Notificación push enviada' });
  } catch (err) {
    res.status(500).json({ message: 'Error enviando push', error: err.message });
  }
};

exports.getVapidPublicKey = (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
};
