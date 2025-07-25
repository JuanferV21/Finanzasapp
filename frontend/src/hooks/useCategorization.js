import { useState } from 'react';
import { api } from '../services/api';

export const useCategorization = () => {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sugerir categoría para una descripción
  const suggestCategory = async (description, type = null) => {
    if (!description || description.trim().length === 0) {
      setSuggestions(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/categorization/suggest', {
        description: description.trim(),
        type
      });

      const suggestionData = {
        category: response.data.suggestion.category,
        confidence: response.data.suggestion.confidence,
        source: response.data.suggestion.source,
        alternatives: response.data.alternatives || [],
        description: response.data.description
      };

      setSuggestions(suggestionData);
      setLoading(false);
      
      return suggestionData;
    } catch (error) {
      console.error('Error obteniendo sugerencia:', error);
      setError(error.response?.data?.message || 'Error al obtener sugerencia');
      setLoading(false);
      return null;
    }
  };

  // Sugerir categorías para múltiples descripciones
  const suggestCategoriesBatch = async (items) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/categorization/batch-suggest', {
        items
      });

      setLoading(false);
      return response.data.results;
    } catch (error) {
      console.error('Error en sugerencias por lote:', error);
      setError(error.response?.data?.message || 'Error al obtener sugerencias');
      setLoading(false);
      return null;
    }
  };

  // Enviar feedback sobre una sugerencia
  const sendFeedback = async (description, suggestedCategory, actualCategory, wasAccurate, confidence = null) => {
    try {
      await api.post('/categorization/feedback', {
        description,
        suggestedCategory,
        actualCategory,
        wasAccurate,
        confidence
      });
      
      console.log('📊 Feedback enviado exitosamente');
      return true;
    } catch (error) {
      console.error('Error enviando feedback:', error);
      return false;
    }
  };

  // Obtener categorías disponibles
  const getCategories = async (type = null) => {
    try {
      const response = await api.get('/categorization/categories', {
        params: type ? { type } : {}
      });
      
      return response.data.categories;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return null;
    }
  };

  // Obtener estadísticas del modelo
  const getModelStats = async () => {
    try {
      const response = await api.get('/categorization/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  };

  // Limpiar sugerencias
  const clearSuggestions = () => {
    setSuggestions(null);
    setError(null);
  };

  return {
    suggestions,
    loading,
    error,
    suggestCategory,
    suggestCategoriesBatch,
    sendFeedback,
    getCategories,
    getModelStats,
    clearSuggestions
  };
};