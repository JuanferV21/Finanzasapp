const Transaction = require('../models/Transaction');

class CategorizationService {
  constructor() {
    // Dataset de entrenamiento basado en palabras clave
    this.trainingData = {
      // GASTOS
      food: [
        'supermercado', 'mercado', 'restaurant', 'restaurante', 'comida', 'pizza', 'hamburguesa',
        'mcdonalds', 'burger', 'subway', 'dominos', 'kfc', 'starbucks', 'cafe', 'cafeteria',
        'panaderia', 'carniceria', 'verduleria', 'almacen', 'despensa', 'grocery', 'food',
        'soriana', 'walmart', 'chedraui', 'oxxo', 'seven', 'tienda', 'abarrotes', 'lunch',
        'desayuno', 'cena', 'delivery', 'uber eats', 'rappi', 'didi food', 'just eat'
      ],
      transport: [
        'uber', 'taxi', 'gasolina', 'combustible', 'metro', 'autobus', 'bus', 'tren',
        'parking', 'estacionamiento', 'peaje', 'caseta', 'transporte', 'viaje', 'flight',
        'vuelo', 'avion', 'hotel', 'airbnb', 'rent car', 'renta auto', 'didi', 'cabify',
        'beat', 'pemex', 'shell', 'bp', 'mobil', 'total', 'repsol', 'mechanic', 'mecanico',
        'refaccion', 'llanta', 'service', 'verificacion', 'tenencia', 'seguro auto'
      ],
      entertainment: [
        'cine', 'cinema', 'netflix', 'spotify', 'youtube', 'disney', 'amazon prime',
        'hbo', 'game', 'juego', 'videojuego', 'steam', 'playstation', 'xbox', 'nintendo',
        'concierto', 'teatro', 'museo', 'parque', 'entretenimiento', 'diversion',
        'bar', 'club', 'antro', 'disco', 'cerveza', 'alcohol', 'vino', 'whisky',
        'fiesta', 'party', 'evento', 'boleto', 'ticket', 'entrada', 'show'
      ],
      shopping: [
        'amazon', 'mercadolibre', 'liverpool', 'palacio', 'sears', 'suburbia', 'zara',
        'hm', 'nike', 'adidas', 'ropa', 'clothes', 'zapatos', 'shoes', 'shopping',
        'compras', 'tienda', 'store', 'mall', 'centro comercial', 'plaza', 'outlet',
        'fashion', 'moda', 'accesorio', 'joyeria', 'electronico', 'celular', 'laptop',
        'tablet', 'headphones', 'audifonos', 'gadget', 'tecnologia', 'electronics'
      ],
      health: [
        'doctor', 'medico', 'hospital', 'clinica', 'farmacia', 'pharmacy', 'medicina',
        'medicamento', 'consulta', 'cita medica', 'laboratorio', 'analisis', 'radiografia',
        'dentista', 'odontologo', 'optometrista', 'oculista', 'pediatra', 'ginecologo',
        'dermatologo', 'nutriologo', 'psicologo', 'terapia', 'fisioterapia', 'quiropractico',
        'veterinario', 'vacuna', 'cirugia', 'operacion', 'emergencia', 'urgencias'
      ],
      education: [
        'escuela', 'colegio', 'universidad', 'curso', 'clase', 'capacitacion', 'entrenamiento',
        'libro', 'libros', 'material', 'educacion', 'study', 'estudios', 'maestria',
        'doctorado', 'certificacion', 'examen', 'inscripcion', 'matricula', 'colegiatura',
        'udemy', 'coursera', 'platzi', 'codecademy', 'skillshare', 'masterclass',
        'workshop', 'seminario', 'conferencia', 'congreso', 'diploma'
      ],
      housing: [
        'renta', 'rent', 'alquiler', 'hipoteca', 'mortgage', 'casa', 'hogar', 'vivienda',
        'departamento', 'apartment', 'condominio', 'predial', 'mantenimiento', 'reparacion',
        'plomero', 'electricista', 'pintor', 'jardinero', 'limpieza', 'cleaning',
        'muebles', 'furniture', 'decoracion', 'home depot', 'liverpool hogar',
        'ikea', 'construccion', 'material construccion', 'ferreteria', 'hogar'
      ],
      utilities: [
        'luz', 'electricity', 'electrica', 'cfe', 'gas', 'agua', 'water', 'telefono',
        'internet', 'cable', 'tv', 'television', 'streaming', 'wifi', 'modem',
        'telmex', 'totalplay', 'megacable', 'izzi', 'dish', 'sky', 'directv',
        'telcel', 'movistar', 'at&t', 'unefon', 'virgin', 'prepago', 'recarga',
        'factura', 'bill', 'servicio', 'utility', 'basura', 'trash'
      ],
      insurance: [
        'seguro', 'insurance', 'poliza', 'prima', 'deducible', 'cobertura', 'aseguradora',
        'axa', 'gnp', 'metlife', 'allianz', 'zurich', 'mapfre', 'hsbc seguros',
        'bbva seguros', 'santander seguros', 'seguro vida', 'seguro auto', 'seguro casa',
        'seguro medico', 'gastos medicos', 'dental', 'vision', 'pension', 'ahorro'
      ],

      // INGRESOS
      salary: [
        'salario', 'sueldo', 'nomina', 'salary', 'wage', 'pago', 'payment', 'ingreso',
        'quincena', 'mensualidad', 'empresa', 'work', 'trabajo', 'empleador', 'patron',
        'deposito nomina', 'transferencia empresa', 'payroll', 'aguinaldo', 'bonus',
        'comision', 'bono', 'incentivo', 'overtime', 'horas extras', 'vacaciones'
      ],
      freelance: [
        'freelance', 'freelancer', 'independiente', 'proyecto', 'consulting', 'consultoria',
        'servicio', 'cliente', 'honorarios', 'factura', 'invoice', 'cobro', 'trabajo',
        'upwork', 'fiverr', 'guru', 'freelancer.com', 'consultor', 'contractor',
        'servicios profesionales', 'desarrollo', 'design', 'marketing', 'writing'
      ],
      investment: [
        'inversion', 'investment', 'dividend', 'dividendo', 'interes', 'interest',
        'rendimiento', 'ganancia', 'profit', 'bolsa', 'stock', 'accion', 'share',
        'etf', 'fondo', 'mutual fund', 'crypto', 'bitcoin', 'ethereum', 'trading',
        'broker', 'gbm', 'actinver', 'kuspit', 'bursanet', 'cetesdirecto', 'cetes'
      ],
      business: [
        'negocio', 'business', 'empresa', 'venta', 'sale', 'cliente', 'customer',
        'producto', 'servicio', 'comercio', 'tienda', 'local', 'ecommerce',
        'mercadolibre venta', 'amazon venta', 'shopify', 'emprendimiento',
        'startup', 'revenue', 'facturacion', 'pos', 'terminal', 'efectivo'
      ]
    };

    // Pesos para diferentes tipos de coincidencias
    this.weights = {
      exact: 10,      // Coincidencia exacta
      startsWith: 8,  // Empieza con la palabra
      endsWith: 6,    // Termina con la palabra
      contains: 5,    // Contiene la palabra
      partial: 3      // Coincidencia parcial
    };
  }

  /**
   * Normaliza texto para procesamiento
   */
  normalizeText(text) {
    if (!text) return '';
    
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, ' ') // Remover caracteres especiales
      .replace(/\s+/g, ' ')      // Múltiples espacios a uno
      .split(' ')
      .filter(word => word.length > 2) // Filtrar palabras muy cortas
      .join(' ');
  }

  /**
   * Calcula el score de coincidencia entre texto y palabra clave
   */
  calculateMatchScore(text, keyword) {
    const normalizedText = this.normalizeText(text);
    const normalizedKeyword = this.normalizeText(keyword);
    
    if (!normalizedText || !normalizedKeyword) return 0;

    // Coincidencia exacta
    if (normalizedText === normalizedKeyword) {
      return this.weights.exact;
    }

    // Contiene la palabra exacta
    if (normalizedText.includes(normalizedKeyword)) {
      // Verificar si es palabra completa
      const words = normalizedText.split(' ');
      if (words.includes(normalizedKeyword)) {
        return this.weights.exact;
      }
      return this.weights.contains;
    }

    // Empieza con
    if (normalizedText.startsWith(normalizedKeyword)) {
      return this.weights.startsWith;
    }

    // Termina con
    if (normalizedText.endsWith(normalizedKeyword)) {
      return this.weights.endsWith;
    }

    // Coincidencia parcial (substring)
    if (normalizedText.includes(normalizedKeyword.substring(0, Math.min(4, normalizedKeyword.length)))) {
      return this.weights.partial;
    }

    return 0;
  }

  /**
   * Sugiere categoría basada en descripción
   */
  suggestCategory(description, type = null) {
    if (!description) {
      return {
        suggested: null,
        confidence: 0,
        alternatives: []
      };
    }

    const scores = {};
    const normalizedDescription = this.normalizeText(description);

    // Calcular scores para cada categoría
    Object.keys(this.trainingData).forEach(category => {
      scores[category] = 0;
      
      this.trainingData[category].forEach(keyword => {
        const score = this.calculateMatchScore(normalizedDescription, keyword);
        scores[category] += score;
      });
    });

    // Filtrar por tipo si se especifica
    const validCategories = type ? this.getValidCategoriesForType(type) : Object.keys(scores);
    const filteredScores = {};
    
    validCategories.forEach(category => {
      if (scores[category] > 0) {
        filteredScores[category] = scores[category];
      }
    });

    // Ordenar por score
    const sortedCategories = Object.entries(filteredScores)
      .sort(([,a], [,b]) => b - a)
      .map(([category, score]) => ({ category, score }));

    if (sortedCategories.length === 0) {
      return {
        suggested: type === 'expense' ? 'other_expense' : 'other_income',
        confidence: 0,
        alternatives: []
      };
    }

    const maxScore = sortedCategories[0].score;
    const confidence = Math.min(maxScore / 10, 1); // Normalizar a 0-1

    return {
      suggested: sortedCategories[0].category,
      confidence: confidence,
      alternatives: sortedCategories.slice(1, 4).map(item => ({
        category: item.category,
        confidence: Math.min(item.score / 10, 1)
      }))
    };
  }

  /**
   * Obtiene categorías válidas para un tipo de transacción
   */
  getValidCategoriesForType(type) {
    const incomeCategories = ['salary', 'freelance', 'investment', 'business', 'other_income'];
    const expenseCategories = ['food', 'transport', 'entertainment', 'shopping', 'health', 'education', 'housing', 'utilities', 'insurance', 'other_expense'];
    
    return type === 'income' ? incomeCategories : expenseCategories;
  }

  /**
   * Aprende de transacciones existentes del usuario para mejorar precisión
   */
  async learnFromUserTransactions(userId) {
    try {
      const userTransactions = await Transaction.find({ user: userId })
        .select('description category type')
        .limit(500); // Limitar para performance

      const userPatterns = {};

      userTransactions.forEach(transaction => {
        const { description, category, type } = transaction;
        const normalizedDesc = this.normalizeText(description);
        
        if (!userPatterns[category]) {
          userPatterns[category] = [];
        }

        // Extraer palabras significativas
        const words = normalizedDesc.split(' ');
        words.forEach(word => {
          if (word.length > 2 && !userPatterns[category].includes(word)) {
            userPatterns[category].push(word);
          }
        });
      });

      return userPatterns;
    } catch (error) {
      console.error('Error aprendiendo de transacciones del usuario:', error);
      return {};
    }
  }

  /**
   * Sugiere categoría personalizada para un usuario específico
   */
  async suggestCategoryForUser(userId, description, type = null) {
    try {
      // Obtener sugerencia base
      const baseSuggestion = this.suggestCategory(description, type);
      
      // Aprender patrones del usuario
      const userPatterns = await this.learnFromUserTransactions(userId);
      
      // Si hay patrones del usuario, ajustar la sugerencia
      if (Object.keys(userPatterns).length > 0) {
        const userScores = {};
        const normalizedDescription = this.normalizeText(description);

        Object.keys(userPatterns).forEach(category => {
          userScores[category] = 0;
          
          userPatterns[category].forEach(pattern => {
            const score = this.calculateMatchScore(normalizedDescription, pattern);
            userScores[category] += score * 1.5; // Dar más peso a patrones del usuario
          });
        });

        // Encontrar la mejor coincidencia del usuario
        const bestUserMatch = Object.entries(userScores)
          .filter(([category]) => type ? this.getValidCategoriesForType(type).includes(category) : true)
          .sort(([,a], [,b]) => b - a)[0];

        if (bestUserMatch && bestUserMatch[1] > baseSuggestion.confidence * 10) {
          return {
            suggested: bestUserMatch[0],
            confidence: Math.min(bestUserMatch[1] / 15, 1),
            alternatives: [
              { category: baseSuggestion.suggested, confidence: baseSuggestion.confidence },
              ...baseSuggestion.alternatives
            ],
            source: 'user_patterns'
          };
        }
      }

      return {
        ...baseSuggestion,
        source: 'base_model'
      };
    } catch (error) {
      console.error('Error sugiriendo categoría personalizada:', error);
      return this.suggestCategory(description, type);
    }
  }

  /**
   * Obtiene estadísticas del modelo de categorización
   */
  async getModelStats(userId = null) {
    try {
      const stats = {
        totalKeywords: Object.values(this.trainingData).flat().length,
        categoriesCount: Object.keys(this.trainingData).length,
        categories: {}
      };

      Object.keys(this.trainingData).forEach(category => {
        stats.categories[category] = {
          keywordCount: this.trainingData[category].length,
          examples: this.trainingData[category].slice(0, 5)
        };
      });

      if (userId) {
        const userTransactions = await Transaction.countDocuments({ user: userId });
        stats.userTransactions = userTransactions;
        stats.hasUserPatterns = userTransactions > 10;
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas del modelo:', error);
      return null;
    }
  }

  /**
   * Valida y mejora el dataset con nuevas palabras clave
   */
  addKeywordToCategory(category, keyword) {
    if (!this.trainingData[category]) {
      console.warn(`Categoría ${category} no existe`);
      return false;
    }

    const normalizedKeyword = this.normalizeText(keyword);
    if (normalizedKeyword && !this.trainingData[category].includes(normalizedKeyword)) {
      this.trainingData[category].push(normalizedKeyword);
      return true;
    }

    return false;
  }
}

module.exports = new CategorizationService();