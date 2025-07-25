const rateLimit = require('express-rate-limit');

// Rate limiter estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  message: {
    error: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    retryAfter: 15 * 60 // segundos
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // No contar requests exitosos
  handler: (req, res) => {
    console.log(`🚫 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiter moderado para APIs generales
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🚫 API rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.',
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