const Goal = require('../models/Goal');
const nodemailer = require('nodemailer');
const webpush = require('web-push');

// Listar metas del usuario
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener metas', error: err.message });
  }
};

// Crear meta
exports.createGoal = async (req, res) => {
  try {
    const { nombre, montoObjetivo, montoAhorrado, fechaLimite, notas } = req.body;
    const goal = new Goal({
      nombre,
      montoObjetivo,
      montoAhorrado: montoAhorrado || 0,
      fechaLimite,
      notas,
      user: req.user._id,
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear meta', error: err.message });
  }
};

// Editar meta
exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndUpdate(
      { _id: id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ message: 'Meta no encontrada' });
    res.json(goal);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar meta', error: err.message });
  }
};

// Eliminar meta
exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Meta no encontrada' });
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
    if (!subscription || !req.user?._id) return res.status(400).json({ message: 'Faltan datos de suscripción o usuario.' });
    pushSubscriptions[req.user._id] = subscription;
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