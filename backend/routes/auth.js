const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { authLimiter, sensitiveOpLimiter } = require('../middleware/rateLimiter');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');

const router = express.Router();

// Configurar transporter de email
const createTransporter = () => {
  if (!process.env.NOTIFY_EMAIL_USER || !process.env.NOTIFY_EMAIL_PASS) {
    console.warn('⚠️  Variables de email no configuradas. La recuperación de contraseña no funcionará.');
    return null;
  }
  
  console.log('📧 Configurando transporter de email para:', process.env.NOTIFY_EMAIL_USER);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NOTIFY_EMAIL_USER,
      pass: process.env.NOTIFY_EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Registrar nuevo usuario
router.post('/register', authLimiter, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { email: email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'Ya existe un usuario con este email'
      });
    }

    // Crear nuevo usuario
    const user = await User.create({
      name,
      email,
      password
    });

    // Generar token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Iniciar sesión
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
], async (req, res) => {
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user.id);

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/me - Obtener perfil del usuario autenticado
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: req.user.toPublicJSON()
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión (opcional, el frontend puede manejar esto)
router.post('/logout', auth, async (req, res) => {
  try {
    // En una implementación más avanzada, podrías invalidar el token
    // Por ahora, solo respondemos exitosamente
    res.json({
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/me - Actualizar perfil del usuario
router.put('/me', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updateData = {};

    // Verificar si se está actualizando el email
    if (email && email !== req.user.email) {
      // Verificar si el nuevo email ya existe
      const existingUser = await User.findOne({ where: { email: email } });
      if (existingUser) {
        return res.status(400).json({
          message: 'Ya existe un usuario con este email'
        });
      }
      updateData.email = email;
    }

    if (name) {
      updateData.name = name;
    }

    // Actualizar usuario
    await User.update(updateData, {
      where: { id: req.user.id }
    });

    // Obtener usuario actualizado
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] }
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', sensitiveOpLimiter, auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Obtener usuario con contraseña para verificar
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/auth/preferences - Actualizar preferencias
router.put('/preferences', auth, [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications debe ser un booleano'),
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('pushNotifications debe ser un booleano'),
  body('goalReminders')
    .optional()
    .isBoolean()
    .withMessage('goalReminders debe ser un booleano'),
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('El tema debe ser light o dark')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { emailNotifications, pushNotifications, goalReminders, theme } = req.body;

    // Obtener usuario actual
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar preferencias
    const currentPreferences = user.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(pushNotifications !== undefined && { pushNotifications }),
      ...(goalReminders !== undefined && { goalReminders }),
      ...(theme !== undefined && { theme })
    };

    user.preferences = updatedPreferences;
    await user.save();

    res.json({
      message: 'Preferencias actualizadas exitosamente',
      preferences: user.preferences
    });

  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/forgot-password - Solicitar reset de contraseña
router.post('/forgot-password', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Por favor ingresa un email válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Email inválido',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email } });
    
    // Siempre responder exitosamente para no revelar si el email existe
    if (!user) {
      return res.json({
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación.'
      });
    }

    // Generar token de reset
    const resetToken = user.createPasswordResetToken();
    await user.save({ validate: false });

    // Crear transporter de email
    const transporter = createTransporter();
    if (!transporter) {
      return res.status(500).json({
        message: 'Servicio de email no configurado. Contacta al administrador.'
      });
    }

    // Crear URL de reset
    const resetURL = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Configurar email
    const mailOptions = {
      from: process.env.NOTIFY_EMAIL_USER,
      to: user.email,
      subject: 'Recuperación de Contraseña - Finanzas Dashboard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
          <p>Hola <strong>${user.name}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este email.</p>
          <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p><strong>⚠️ Este enlace expira en 10 minutos.</strong></p>
          <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetURL}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Si no solicitaste este cambio, tu cuenta sigue siendo segura. Puedes ignorar este email.
          </p>
        </div>
      `
    };

    // Enviar email
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('📧 Email enviado exitosamente:', info.messageId);
      
      res.json({
        message: 'Enlace de recuperación enviado a tu email.'
      });
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError);
      
      // Limpiar token en caso de error de email
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validate: false });
      
      return res.status(500).json({
        message: 'Error al enviar el email. Verifica la configuración del servidor.'
      });
    }

  } catch (error) {
    console.error('Error en forgot-password:', error);
    
    // Limpiar token en caso de error
    if (req.body.email) {
      const user = await User.findOne({ where: { email: req.body.email } });
      if (user) {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save({ validate: false });
      }
    }
    
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/reset-password/:token - Confirmar reset de contraseña
router.post('/reset-password/:token', authLimiter, [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Contraseña inválida',
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token recibido para comparar con el de la BD
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con token válido y no expirado
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token inválido o expirado'
      });
    }

    // Establecer nueva contraseña
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    // Generar nuevo token JWT
    const jwtToken = generateToken(user.id);

    res.json({
      message: 'Contraseña restablecida exitosamente',
      token: jwtToken,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 