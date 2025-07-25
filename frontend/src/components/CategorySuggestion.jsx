import React from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Zap } from 'lucide-react';

const CategorySuggestion = ({ 
  suggestion, 
  onAccept, 
  onReject, 
  onSelectAlternative,
  loading,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-blue-700">Analizando descripción...</span>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 80) return <Zap className="h-3 w-3" />;
    if (confidence >= 60) return <Lightbulb className="h-3 w-3" />;
    return <Sparkles className="h-3 w-3" />;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      // Gastos
      food: 'Alimentación',
      transport: 'Transporte',
      entertainment: 'Entretenimiento',
      shopping: 'Compras',
      health: 'Salud',
      education: 'Educación',
      housing: 'Vivienda',
      utilities: 'Servicios',
      insurance: 'Seguros',
      other_expense: 'Otros Gastos',
      // Ingresos
      salary: 'Salario',
      freelance: 'Freelance',
      investment: 'Inversiones',
      business: 'Negocio',
      other_income: 'Otros Ingresos'
    };
    return labels[category] || category;
  };

  const getSourceIcon = (source) => {
    if (source === 'user_patterns') {
      return (
        <div className="flex items-center gap-1 text-xs text-purple-600">
          <Sparkles className="h-3 w-3" />
          <span>Personalizado</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-blue-600">
        <Lightbulb className="h-3 w-3" />
        <span>IA</span>
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Sugerencia Inteligente</span>
        </div>
        {getSourceIcon(suggestion.source)}
      </div>

      {/* Sugerencia Principal */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              {getCategoryLabel(suggestion.category)}
            </span>
            <div className={`flex items-center gap-1 ${getConfidenceColor(suggestion.confidence)}`}>
              {getConfidenceIcon(suggestion.confidence)}
              <span className="text-sm font-medium">{suggestion.confidence}%</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(suggestion.category)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md text-sm font-medium transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            Usar esta
          </button>
          <button
            onClick={() => onReject()}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            <ThumbsDown className="h-3 w-3" />
            No gracias
          </button>
        </div>
      </div>

      {/* Alternativas */}
      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-medium">Otras opciones:</p>
          <div className="flex flex-wrap gap-2">
            {suggestion.alternatives.map((alt, index) => (
              <button
                key={index}
                onClick={() => onSelectAlternative(alt.category)}
                className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 transition-colors"
              >
                <span>{getCategoryLabel(alt.category)}</span>
                <span className="text-gray-500">({alt.confidence}%)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div className="mt-3 pt-2 border-t border-blue-100">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Cuantas más transacciones tengas, más precisas serán las sugerencias
        </p>
      </div>
    </div>
  );
};

export default CategorySuggestion;