const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';

// Rate limiter estricto para autenticación
const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000, // 1 min en dev, 15 min en prod
  max: isDev ? 1000 : 20, // 1000 intentos en dev, 20 en prod (aumentado de 5)
  message: {
    error: isDev
      ? 'Demasiados intentos en desarrollo. Espera un minuto e intenta de nuevo.'
      : 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    retryAfter: isDev ? 60 : 15 * 60 // segundos
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: isDev
        ? 'Demasiados intentos en desarrollo. Espera un minuto e intenta de nuevo.'
        : 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
      retryAfter: isDev ? 60 : 15 * 60
    });
  }
});

// Rate limiter moderado para APIs generales
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 10000 : 500, // 10000 requests en dev, 500 en prod
  message: {
    error: isDev
      ? 'Demasiadas solicitudes en desarrollo. Espera 15 minutos.'
      : 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 API rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: isDev
        ? 'Demasiadas solicitudes en desarrollo. Espera 15 minutos.'
        : 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter estricto para upload de archivos
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 uploads por IP por hora
  message: {
    error: 'Demasiados archivos subidos. Intenta de nuevo en 1 hora.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados archivos subidos. Intenta de nuevo en 1 hora.',
      retryAfter: 60 * 60
    });
  }
});

// Rate limiter muy estricto para operaciones sensibles
const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // 10 operaciones por IP por hora
  message: {
    error: 'Demasiadas operaciones sensibles. Intenta de nuevo en 1 hora.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 Sensitive operation rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas operaciones sensibles. Intenta de nuevo en 1 hora.',
      retryAfter: 60 * 60
    });
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  sensitiveOpLimiter
};
